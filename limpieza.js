/* =====================================================================
   LIMPIEZA — rol de limpieza mensual con firma obligatoria.
   - Cada mes (desde el día 1) la app pide a cada asesor su firma antes de dejarlo usar la app.
   - Mesa 15 y 16 es fija (Pau, R. Pau, Dimas): no firman y no bloquea.
   - El rol sale de datos/limpieza.json (o de Firebase si se publicó uno: limpieza/rol_AAAA-MM).
   - Firmas: limpieza/firmas_AAAA-MM en Firebase (todos las ven) + una marca en este teléfono.
   - Cuando todos firmaron se puede generar el PDF para imprimir.
   ===================================================================== */
const LIM_COL = { "1": "#f07800", "2": "#ffaa00", "3y4": "#0a7ac8", "5y6": "#8b1a5a", "7y8": "#e8260f", "9": "#000000", "10": "#8c8c8c", "11": "#ff9a8d", "12": "#00a98a", "13y14": "#0b4f7f", "15y16": "#ff3fa0" };
const LIM_NOM = { "1": "1", "2": "2", "3y4": "3 y 4", "5y6": "5 y 6", "7y8": "7 y 8", "9": "9", "10": "10", "11": "11", "12": "12", "13y14": "13 y 14", "15y16": "15 y 16" };
const LIM_ORDEN = ["1", "2", "3y4", "5y6", "7y8", "9", "10", "11", "12", "13y14", "15y16"];
const LIM_FIJA = "15y16";
const LIM_PRUEBA = true;   // PRUEBA: el PDF rellena con firmas inventadas las que falten. Poner false cuando todos firmen de verdad.
const LIM_NO_VEND = ["angel", "juan", "juan carlos", "fabian", "omar", "sahib", "daniel", "dani"];   // entran sin mesa de limpieza
const limNorm = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const limMesActual = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
const limMesSig = (m) => { const [y, mo] = m.split("-").map(Number); return mo === 12 ? (y + 1) + "-01" : y + "-" + String(mo + 1).padStart(2, "0"); };
const LIM_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const limTitulo = m => LIM_MESES[+m.split("-")[1] - 1] + " " + m.split("-")[0];
const limEsc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Rol base incluido en el código (no depende de ningún otro archivo) */
const LIM_BASE = {"meses": {"2026-11": {"titulo": "Noviembre 2026", "mesas": [{"mesa": "1", "asesores": ["Montserrat"]}, {"mesa": "2", "asesores": ["Carlos"]}, {"mesa": "3y4", "asesores": ["Raul"]}, {"mesa": "5y6", "asesores": ["Dani"]}, {"mesa": "7y8", "asesores": ["Ceci"]}, {"mesa": "9", "asesores": ["Lalo"]}, {"mesa": "10", "asesores": ["Jesus"]}, {"mesa": "11", "asesores": ["Jorge"]}, {"mesa": "12", "asesores": ["Mari"]}, {"mesa": "13y14", "asesores": ["Kolaz"]}, {"mesa": "15y16", "asesores": ["Pau", "R. Pau", "Dimas"]}]}}, "historial": {"2026-03": [{"mesa": "1", "asesores": ["Omar"]}, {"mesa": "2", "asesores": ["Kolaz"]}, {"mesa": "3y4", "asesores": ["Ceci"]}, {"mesa": "5y6", "asesores": ["Dani"]}, {"mesa": "7y8", "asesores": ["Jorge"]}, {"mesa": "9", "asesores": ["Montserrat"]}, {"mesa": "10", "asesores": ["Raul"]}, {"mesa": "11", "asesores": ["Lalo"]}, {"mesa": "12", "asesores": ["Perez"]}, {"mesa": "13y14", "asesores": ["Abraham"]}, {"mesa": "15y16", "asesores": ["Jesus"]}], "2026-07": [{"mesa": "1", "asesores": ["Ceci"]}, {"mesa": "2", "asesores": ["Dani"]}, {"mesa": "3y4", "asesores": ["Jorge"]}, {"mesa": "5y6", "asesores": ["Perez"]}, {"mesa": "7y8", "asesores": ["Lalo"]}, {"mesa": "9", "asesores": ["Fernando"]}, {"mesa": "10", "asesores": ["Jesus"]}, {"mesa": "11", "asesores": ["Montserrat"]}, {"mesa": "12", "asesores": ["Kolaz"]}, {"mesa": "13y14", "asesores": ["Raul"]}, {"mesa": "15y16", "asesores": ["Cajas"]}], "2026-09": [{"mesa": "1", "asesores": ["Dani"]}, {"mesa": "2", "asesores": ["Jorge"]}, {"mesa": "3y4", "asesores": ["Montserrat"]}, {"mesa": "5y6", "asesores": ["Fernando"]}, {"mesa": "7y8", "asesores": ["Carlos"]}, {"mesa": "9", "asesores": ["Raul"]}, {"mesa": "10", "asesores": ["Lalo"]}, {"mesa": "11", "asesores": ["Mari"]}, {"mesa": "12", "asesores": ["Chucho"]}, {"mesa": "13y14", "asesores": ["Kolaz", "Ceci"]}, {"mesa": "15y16", "asesores": ["Pau", "R. Pau", "Dimas"]}]}, "alias": {"cecilia": "Ceci", "daniel": "Dani", "montse": "Montserrat", "eduardo": "Lalo"}};
let limDatos = LIM_BASE;
async function limCargarJson() { return limDatos; }
/* Rol del mes: publicado en Firebase > archivo/base > guardado en el teléfono. */
async function limBuscar(mes) {
  const k = "ishop_lim_rol_" + mes;
  try {
    if (typeof window.ishopLimGet === "function") {
      const d = await window.ishopLimGet("rol_" + mes);
      if (d && d.mesas) { const r = { titulo: d.titulo || limTitulo(mes), mesas: JSON.parse(d.mesas) }; try { localStorage.setItem(k, JSON.stringify(r)); } catch (_) {} return r; }
    }
  } catch (_) {}
  const j = await limCargarJson();
  if (j.meses && j.meses[mes]) return j.meses[mes];
  try { const c = JSON.parse(localStorage.getItem(k)); if (c && c.mesas) return c; } catch (_) {}
  return null;
}
/* Si el mes no tiene rol, se genera solo (mismo resultado en todos los teléfonos) y se intenta publicar. */
async function limRol(mes) {
  const ya = await limBuscar(mes); if (ya) return ya;
  let prev = null, m = mes;
  for (let i = 0; i < 12 && !prev; i++) { const [y, mo] = m.split("-").map(Number); m = mo === 1 ? (y - 1) + "-12" : y + "-" + String(mo - 1).padStart(2, "0"); prev = await limBuscar(m); }
  if (!prev) return null;
  const gen = await limProponer(prev, mes), rol = { titulo: limTitulo(mes), mesas: gen.mesas };
  try { localStorage.setItem("ishop_lim_rol_" + mes, JSON.stringify(rol)); } catch (_) {}
  try { if (typeof window.ishopLimCrear === "function") { const pub = await window.ishopLimCrear("rol_" + mes, { titulo: rol.titulo, mesas: JSON.stringify(rol.mesas) }); if (pub && pub.mesas) return { titulo: pub.titulo || rol.titulo, mesas: JSON.parse(pub.mesas) }; } } catch (_) {}
  return rol;
}
const limYoKey = mes => "ishop_lim_firmado_" + mes;
const limFirmado = mes => { try { return localStorage.getItem(limYoKey(mes)) || ""; } catch (_) { return ""; } };
const limPendKey = "ishop_lim_pend";
function limPersonas(rol) { const out = []; (rol.mesas || []).forEach(m => m.asesores.forEach(a => out.push({ nombre: a, mesa: m.mesa, fija: m.mesa === LIM_FIJA }))); return out; }

/* ---- Subir firma (si no hay conexión queda pendiente y se reintenta) ---- */
async function limSubirFirma(mes, nombre, img, ts) {
  try { if (typeof window.ishopLimSet !== "function") throw 0; await window.ishopLimSet("firmas_" + mes, { firmas: { [nombre]: { img, ts } } }); return true; }
  catch (_) { try { localStorage.setItem(limPendKey, JSON.stringify({ mes, nombre, img, ts })); } catch (_) {} return false; }
}
function limReintentar() {
  try { const p = JSON.parse(localStorage.getItem(limPendKey)); if (p && typeof window.ishopLimSet === "function") limSubirFirma(p.mes, p.nombre, p.img, p.ts).then(ok => { if (ok) localStorage.removeItem(limPendKey); }); } catch (_) {}
}

/* ---- Lienzo para firmar ---- */
function limPad(host) {
  host.innerHTML = `<canvas class="lim-cv" width="640" height="220"></canvas><button type="button" class="lim-borrar">Borrar</button><span class="lim-ph">Firma aquí</span>`;
  const cv = host.querySelector("canvas"), cx = cv.getContext("2d"); let dib = false, tiene = false, ult = null;
  cx.lineWidth = 4; cx.lineCap = "round"; cx.lineJoin = "round"; cx.strokeStyle = "#111";
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener("pointerdown", e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); dib = true; ult = pos(e); cx.beginPath(); cx.arc(ult.x, ult.y, 2, 0, 7); cx.fill(); tiene = true; host.classList.add("lleno"); });
  cv.addEventListener("pointermove", e => { if (!dib) return; e.preventDefault(); const p = pos(e); cx.beginPath(); cx.moveTo(ult.x, ult.y); cx.lineTo(p.x, p.y); cx.stroke(); ult = p; });
  ["pointerup", "pointercancel"].forEach(ev => cv.addEventListener(ev, () => { dib = false; host.dispatchEvent(new Event("cambio")); }));
  host.querySelector(".lim-borrar").addEventListener("click", () => { cx.clearRect(0, 0, cv.width, cv.height); tiene = false; host.classList.remove("lleno"); host.dispatchEvent(new Event("cambio")); });
  return { vacia: () => !tiene, png: () => { const o = document.createElement("canvas"); o.width = 320; o.height = 110; o.getContext("2d").drawImage(cv, 0, 0, 320, 110); return o.toDataURL("image/png"); } };
}

/* ---- Bloqueo: pantalla completa hasta firmar ---- */
let limGateAbierto = false;
async function limGate() {
  if (limGateAbierto) return;
  const mes = limMesActual();
  if (limFirmado(mes)) { limReintentar(); return; }
  const rol = await limRol(mes);
  if (!rol) return;
  limGateAbierto = true;
  limCss();
  const personas = limPersonas(rol), nombreApp = (typeof ishopAjustes === "function" ? ishopAjustes().nombre : "") || "";
  const previo = personas.find(p => limNorm(p.nombre) === limNorm(nombreApp) || limNorm(nombreApp).split(" ")[0] === limNorm(p.nombre));
  const ov = document.createElement("div"); ov.className = "lim-ov";
  ov.innerHTML = `<div class="lim-card"><h2>Rol de limpieza · ${limEsc(rol.titulo || limTitulo(mes))}</h2>
    <p class="lim-sub">Elige tu nombre, revisa tu mesa y firma para continuar.</p>
    <div class="lim-lista">${rol.mesas.slice().sort((a, b) => LIM_ORDEN.indexOf(a.mesa) - LIM_ORDEN.indexOf(b.mesa)).map(m => `<button type="button" class="lim-fila" data-m="${m.mesa}"><i style="background:${LIM_COL[m.mesa]}">${LIM_NOM[m.mesa]}</i><span>${m.asesores.map(a => `<b data-n="${limEsc(a)}">${limEsc(a)}</b>`).join(", ")}</span></button>`).join("")}</div>
    <div class="lim-nov"><b>No soy vendedor</b><p>Escribe tu nombre para entrar (sin mesa de limpieza).</p><input type="text" class="lim-in" placeholder="Tu nombre" autocomplete="off" autocapitalize="words"><div class="lim-err" hidden></div><button type="button" class="lim-go lim-gonv">Entrar</button></div>
    <div class="lim-yo" hidden><div class="lim-tu"></div><div class="lim-pad"></div><button type="button" class="lim-go" disabled>Firmar y continuar</button></div></div>`;
  document.body.appendChild(ov);
  const yo = ov.querySelector(".lim-yo"), tu = ov.querySelector(".lim-tu"), go = ov.querySelector(".lim-go"); let sel = null, pad = null;
  const elegir = (p) => {
    sel = p; ov.querySelectorAll(".lim-fila").forEach(f => f.classList.toggle("on", f.dataset.m === p.mesa));
    yo.hidden = false;
    if (p.fija) { tu.innerHTML = `<b>${limEsc(p.nombre)}</b>: la mesa ${LIM_NOM[p.mesa]} es fija, no necesitas firmar.`; ov.querySelector(".lim-pad").style.display = "none"; go.disabled = false; go.textContent = "Continuar"; return; }
    tu.innerHTML = `Soy <b>${limEsc(p.nombre)}</b> y me toca la mesa <b>${LIM_NOM[p.mesa]}</b>.`;
    const padHost = ov.querySelector(".lim-pad"); padHost.style.display = ""; pad = limPad(padHost); go.textContent = "Firmar y continuar"; go.disabled = true;
    padHost.addEventListener("cambio", () => { go.disabled = pad.vacia(); });
    yo.scrollIntoView({ behavior: "smooth", block: "end" });
  };
  ov.querySelector(".lim-lista").addEventListener("click", e => {
    const b = e.target.closest("[data-n]"); const f = e.target.closest(".lim-fila"); if (!f) return;
    const m = rol.mesas.find(x => x.mesa === f.dataset.m); const nom = b ? b.dataset.n : m.asesores[0];
    elegir({ nombre: nom, mesa: m.mesa, fija: m.mesa === LIM_FIJA });
  });
  const nvIn = ov.querySelector(".lim-in"), nvErr = ov.querySelector(".lim-err");
  const entrarNV = () => {
    const n = limNorm(nvIn.value);
    if (!LIM_NO_VEND.includes(n)) { nvErr.hidden = false; nvErr.textContent = n ? "Ese nombre no está autorizado. Si eres vendedor, elígete en la lista." : "Escribe tu nombre."; return; }
    try { localStorage.setItem(limYoKey(mes), nvIn.value.trim()); } catch (_) {}
    ov.remove(); limGateAbierto = false;
  };
  ov.querySelector(".lim-gonv").addEventListener("click", entrarNV);
  nvIn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); entrarNV(); } });
  nvIn.addEventListener("input", () => { nvErr.hidden = true; });
  if (previo) elegir(previo);
  go.addEventListener("click", async () => {
    if (!sel) return; go.disabled = true;
    if (!sel.fija) { if (pad.vacia()) { go.disabled = false; return; } await limSubirFirma(mes, sel.nombre, pad.png(), Date.now()); }
    try { localStorage.setItem(limYoKey(mes), sel.nombre); } catch (_) {}
    ov.remove(); limGateAbierto = false;
  });
}

/* ---- Estado de firmas (en vivo) ---- */
function limEscuchar(mes, cb) {
  const usar = () => { if (typeof window.ishopLimEscuchar === "function") { try { return window.ishopLimEscuchar("firmas_" + mes, d => cb((d && d.firmas) || {})); } catch (_) {} } return null; };
  let un = usar(); const h = () => { if (!un) un = usar(); };
  window.addEventListener("ishop-lim-listo", h);
  return () => { window.removeEventListener("ishop-lim-listo", h); if (un) un(); };
}

/* ---- Pantallas ---- */
function buildAsesores() {
  limCss();
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div class="home-heading"><h2>Asesores</h2><p>Herramientas del equipo.</p></div>`;
  const b = document.createElement("button"); b.className = "home-reg";
  b.innerHTML = `<span class="home-reg-icon">🧹</span><span class="home-reg-text"><strong>Limpieza</strong></span><span class="home-tile-chev"></span>`;
  b.addEventListener("click", () => navigate({ screen: "limpieza", title: "Limpieza" }));
  wrap.appendChild(b);
  return wrap;
}

function buildLimpieza() {
  limCss();
  const mes = limMesActual();
  const wrap = document.createElement("div"); wrap.className = "lim-wrap";
  wrap.innerHTML = `<div class="home-heading"><h2>Rol de limpieza</h2><p id="limSub">Cargando…</p></div><div id="limMesas"></div><div class="lim-bar"><button type="button" class="lim-pdf" id="limPdf" disabled>Generar PDF</button></div>`;
  let rol = null, firmas = {};
  const pinta = () => {
    if (!rol) return;
    const req = limPersonas(rol).filter(p => !p.fija), ok = req.filter(p => firmas[p.nombre] && firmas[p.nombre].img);
    wrap.querySelector("#limSub").textContent = `${rol.titulo || limTitulo(mes)} · firmaron ${ok.length} de ${req.length}`;
    wrap.querySelector("#limMesas").innerHTML = rol.mesas.slice().sort((a, b) => LIM_ORDEN.indexOf(a.mesa) - LIM_ORDEN.indexOf(b.mesa)).map(m => `<div class="lim-fila fix"><i style="background:${LIM_COL[m.mesa]}">${LIM_NOM[m.mesa]}</i><span>${m.asesores.map(a => `<b>${limEsc(a)}</b>`).join(", ")}</span><em class="${m.mesa === LIM_FIJA ? "fi" : m.asesores.every(a => firmas[a] && firmas[a].img) ? "ok" : "no"}">${m.mesa === LIM_FIJA ? "Fija" : m.asesores.every(a => firmas[a] && firmas[a].img) ? "Firmado ✓" : "Pendiente"}</em></div>`).join("");
    const btn = wrap.querySelector("#limPdf"), falta = req.length - ok.length; btn.disabled = falta > 0 && !LIM_PRUEBA; btn.textContent = falta > 0 ? (LIM_PRUEBA ? `Generar PDF (prueba, faltan ${falta} firmas)` : `Faltan ${falta} firma${falta === 1 ? "" : "s"}`) : "Generar PDF";
  };
  limRol(mes).then(r => { rol = r; if (!r) wrap.querySelector("#limSub").textContent = "Todavía no hay rol para este mes."; pinta(); });
  const stop = limEscuchar(mes, f => { firmas = f; pinta(); });
  const obs = new MutationObserver(() => { if (!wrap.isConnected) { stop(); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
  wrap.querySelector("#limPdf").addEventListener("click", async () => { const b = wrap.querySelector("#limPdf"); b.disabled = true; b.textContent = "Generando…"; try { await limPdf(rol, mes, firmas); } catch (e) { alert("No se pudo generar el PDF."); } pinta(); });
  return wrap;
}

/* ---- Armar el rol del próximo mes: nadie repite mesa en el año si se puede ---- */
function limRng(txt) { let h = 1779033703 ^ txt.length; for (let i = 0; i < txt.length; i++) { h = Math.imul(h ^ txt.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } let a = h >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
async function limProponer(rolActual, mesSig) {
  const j = await limCargarJson(), alias = j.alias || {};
  const canon = n => { const k = limNorm(n); return alias[k] || n.trim(); };
  const veces = {};   // veces[asesor][mesa]
  const suma = (n, m) => { const a = canon(n); (veces[a] = veces[a] || {})[m] = (veces[a][m] || 0) + 1; };
  const anio = mesSig.split("-")[0];
  const hist = Object.assign({}, j.historial || {}, j.meses || {});
  Object.keys(hist).filter(k => k.startsWith(anio)).forEach(k => (hist[k].mesas || hist[k]).forEach(m => m.asesores.forEach(a => suma(a, m.mesa))));
  const gente = [...new Set(rolActual.mesas.filter(m => m.mesa !== LIM_FIJA).flatMap(m => m.asesores).map(canon))];
  const fija = rolActual.mesas.find(m => m.mesa === LIM_FIJA);
  const mesas = LIM_ORDEN.filter(m => m !== LIM_FIJA);
  const rnd = limRng("rol-" + mesSig); let mejor = null, mejorC = 1e9;
  for (let i = 0; i < 400; i++) {                       // varios barajados al azar, se queda el de menos repeticiones
    const bar = gente.slice(), asg = {}; for (let q = bar.length - 1; q > 0; q--) { const r = Math.floor(rnd() * (q + 1)); [bar[q], bar[r]] = [bar[r], bar[q]]; }
    mesas.forEach((m, k) => { if (bar[k]) asg[m] = [bar[k]]; });
    bar.slice(mesas.length).forEach(a => { asg["13y14"] = (asg["13y14"] || []).concat(a); });
    let c = 0; Object.entries(asg).forEach(([m, l]) => l.forEach(a => { const v = (veces[a] || {})[m] || 0; c += v * v * 10; if (rolActual.mesas.find(x => x.mesa === m && x.asesores.map(canon).includes(a))) c += 50; }));
    if (c < mejorC) { mejorC = c; mejor = asg; if (c === 0) break; }
  }
  return { mesas: mesas.map(m => ({ mesa: m, asesores: mejor[m] || [] })).filter(m => m.asesores.length).concat(fija ? [fija] : []) };
}

/* ---- PDF imprimible: título, tabla con firmas y plano ---- */
function limFirmaFalsa(nombre) {
  const rnd = limRng("firma-" + nombre), c = document.createElement("canvas"); c.width = 320; c.height = 110; const x = c.getContext("2d");
  x.strokeStyle = "#1a2a6c"; x.lineWidth = 3; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath();
  let px = 14, py = 60 + rnd() * 20; x.moveTo(px, py);
  while (px < 290) { const nx = px + 18 + rnd() * 26, ny = 25 + rnd() * 65; x.quadraticCurveTo(px + (nx - px) * .4, py + (rnd() - .5) * 90, nx, ny); px = nx; py = ny; }
  x.stroke(); x.beginPath(); x.moveTo(16, 92); x.quadraticCurveTo(150, 80 + rnd() * 20, 300, 88 - rnd() * 12); x.lineWidth = 2; x.stroke();
  return c.toDataURL("image/png");
}
async function limPdf(rol, mes, firmasReales) {
  const firmas = Object.assign({}, firmasReales);
  if (LIM_PRUEBA) limPersonas(rol).filter(p => !p.fija).forEach(p => { if (!(firmas[p.nombre] && firmas[p.nombre].img)) firmas[p.nombre] = { img: limFirmaFalsa(p.nombre), ts: 0 }; });
  const PL = await docsLoadPdfLib(), doc = await PL.PDFDocument.create(), pg = doc.addPage([792, 612]);
  const fb = await doc.embedFont(PL.StandardFonts.HelveticaBold), fr = await doc.embedFont(PL.StandardFonts.Helvetica);
  const get = async u => new Uint8Array(await (await fetch(u)).arrayBuffer());
  const logo = await doc.embedJpg(await get("imágenes/limpieza/logo.jpg")), plano = await doc.embedJpg(await get("imágenes/limpieza/plano.jpg"));
  const hex = h => PL.rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
  pg.drawImage(logo, { x: 50, y: 612 - 14 - 38, width: 118, height: 38 });
  pg.drawText("ROL DE LIMPIEZA " + (rol.titulo || limTitulo(mes)), { x: 195, y: 612 - 40, size: 21, font: fb });
  const filas = []; rol.mesas.slice().sort((a, b) => LIM_ORDEN.indexOf(a.mesa) - LIM_ORDEN.indexOf(b.mesa)).forEach(m => filas.push(m));
  const izq = filas.slice(0, 6), der = filas.slice(6), RH = 24, top = 612 - 66;
  const col = (lista, x0) => {
    const w = [58, 118, 160]; let x = x0;
    ["MESA", "ASESOR", "FIRMA"].forEach((t, i) => { pg.drawText(t, { x: x + w[i] / 2 - fr.widthOfTextAtSize(t, 9) / 2, y: top - 10, size: 9, font: fr }); x += w[i]; });
    return { w, x0, lista };
  };
  const dibujaCol = async ({ w, x0, lista }) => {
    for (let r = 0; r < lista.length; r++) {
      const m = lista[r], y = top - 16 - (r + 1) * RH;
      pg.drawRectangle({ x: x0, y, width: w[0] + w[1] + w[2], height: RH, borderColor: PL.rgb(.8, .8, .8), borderWidth: .5, color: r % 2 ? PL.rgb(.96, .96, .96) : PL.rgb(1, 1, 1) });
      pg.drawRectangle({ x: x0, y, width: w[0], height: RH, color: hex(LIM_COL[m.mesa]) });
      const t = LIM_NOM[m.mesa], tc = ["9", "5y6", "13y14", "7y8", "10"].includes(m.mesa) ? PL.rgb(1, 1, 1) : PL.rgb(0, 0, 0);
      pg.drawText(t, { x: x0 + w[0] / 2 - fb.widthOfTextAtSize(t, 9) / 2, y: y + RH / 2 - 3, size: 9, font: fb, color: tc });
      const nom = m.asesores.join(", "), sz = fr.widthOfTextAtSize(nom, 10) > w[1] - 6 ? 8 : 10;
      pg.drawText(nom, { x: x0 + w[0] + w[1] / 2 - fr.widthOfTextAtSize(nom, sz) / 2, y: y + RH / 2 - 3, size: sz, font: fr });
      if (m.mesa !== LIM_FIJA) {
        const imgs = m.asesores.map(a => firmas[a] && firmas[a].img).filter(Boolean), cw = w[2] / Math.max(1, m.asesores.length);
        for (let i = 0; i < imgs.length; i++) { const im = await doc.embedPng(imgs[i]), h = RH - 4, ww = Math.min(cw - 4, h * im.width / im.height); pg.drawImage(im, { x: x0 + w[0] + w[1] + i * cw + (cw - ww) / 2, y: y + 2, width: ww, height: h }); }
      }
    }
  };
  await dibujaCol(col(izq, 50)); await dibujaCol(col(der, 50 + 336 + 20));
  const pw = 640, ph = pw * plano.height / plano.width; pg.drawImage(plano, { x: (792 - pw) / 2, y: 612 - 66 - 16 - 6 * RH - 8 - ph, width: pw, height: ph });
  const bytes = await doc.save(), file = new File([bytes], "Rol_limpieza_" + limTitulo(mes).replace(" ", "_") + ".pdf", { type: "application/pdf" });
  await docsShareFiles([file], "Rol de limpieza");
}

function limCss() {
  if (document.getElementById("limCss")) return;
  const s = document.createElement("style"); s.id = "limCss";
  s.textContent = `
  .lim-ov{ position:fixed; inset:0; z-index:99999; background:var(--bg,#f2f2f7); overflow:auto; -webkit-overflow-scrolling:touch; padding:calc(env(safe-area-inset-top,0px) + 16px) 14px calc(env(safe-area-inset-bottom,0px) + 24px); }
  .lim-card{ max-width:560px; margin:0 auto; } .lim-card h2{ font-size:26px; letter-spacing:-.02em; margin:6px 2px 4px; }
  .lim-sub{ color:var(--text-secondary); font-size:14.5px; margin:2px 2px 12px; }
  .lim-lista{ display:flex; flex-direction:column; gap:7px; }
  .lim-fila{ display:flex; align-items:center; gap:12px; text-align:left; width:100%; padding:9px 12px; border-radius:14px; border:2px solid transparent; background:var(--surface,#fff); font:inherit; color:var(--text); box-shadow:0 1px 0 rgba(0,0,0,.06); }
  .lim-fila.on{ border-color:var(--accent); } .lim-fila.fix{ margin-top:7px; }
  .lim-fila i{ flex:0 0 62px; text-align:center; font-style:normal; font-weight:800; font-size:14px; padding:8px 0; border-radius:9px; color:#fff; text-shadow:0 1px 1px rgba(0,0,0,.35); }
  .lim-fila span{ flex:1; font-size:16px; } .lim-fila span b{ font-weight:700; } .lim-fila em{ font-style:normal; font-size:13px; font-weight:800; } .lim-fila em.ok{ color:#1f9d55; } .lim-fila em.no{ color:#d9822b; } .lim-fila em.fi{ color:var(--text-secondary); }
  .lim-nov{ margin-top:14px; padding:14px; border-radius:18px; background:var(--surface,#fff); box-shadow:0 1px 0 rgba(0,0,0,.06); } .lim-nov p{ margin:2px 0 10px; font-size:14px; color:var(--text-secondary); }
  .lim-in{ width:100%; box-sizing:border-box; font:inherit; font-size:18px; padding:12px; border:1px solid var(--border,#c7c7cc); border-radius:12px; background:transparent; color:var(--text); } .lim-err{ margin-top:8px; font-size:14px; color:#d9822b; font-weight:600; }
  .lim-yo{ margin-top:16px; padding:14px; border-radius:18px; background:var(--surface,#fff); box-shadow:0 6px 18px rgba(0,0,0,.08); } .lim-tu{ font-size:16px; margin-bottom:10px; }
  .lim-pad{ position:relative; } .lim-cv{ display:block; width:100%; height:auto; aspect-ratio:640/220; border:2px dashed var(--border,#c7c7cc); border-radius:14px; background:#fff; touch-action:none; }
  .lim-ph{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); color:#bbb; font-size:20px; pointer-events:none; } .lim-pad.lleno .lim-ph{ display:none; }
  .lim-borrar{ position:absolute; right:8px; top:8px; border:0; border-radius:9px; padding:6px 10px; background:rgba(120,120,128,.18); color:#333; font:inherit; font-size:13px; font-weight:700; }
  .lim-go,.lim-pdf{ width:100%; margin-top:12px; border:0; border-radius:14px; padding:15px; font:inherit; font-size:17px; font-weight:800; background:var(--accent,#0071e3); color:#fff; } .lim-go:disabled,.lim-pdf:disabled{ opacity:.45; }
  .lim-bar{ display:flex; gap:8px; margin-top:12px; } .lim-bar button{ flex:1; margin-top:0; } .lim-sec{ border:0; border-radius:14px; padding:15px 8px; font:inherit; font-size:15px; font-weight:800; background:rgba(120,120,128,.28); color:var(--text,#111); }
  .lim-prop{ margin-top:18px; } .lim-prop h3{ margin:0 2px 4px; }`;
  document.head.appendChild(s);
}
window.addEventListener("load", () => { setTimeout(limGate, 600); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) limGate(); });
