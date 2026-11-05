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
const LIM_CC_MES = "2026-11";   // arreglo de UNA sola vez: Carlos C firma como Kolaz (solo este mes; el 1 del mes siguiente ya no aplica)
const limEsCC = () => { const t = limNorm((typeof ishopAjustes === "function" ? ishopAjustes().nombre : "") || "").split(" "); return t[0] === "carlos" && !!t[1] && t[1][0] === "c"; };
const LIM_PRUEBA = false;   // (apagado) firmas inventadas solo para pruebas
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
  const k = "ishop_lim_rol_" + mes, kh = "ishop_lim_rolchk_" + mes, hoy = new Date().toDateString();
  try { const c = JSON.parse(localStorage.getItem(k)); if (c && c.mesas && localStorage.getItem(kh) === hoy) return c; } catch (_) {}   // el rol se consulta en Firebase máximo una vez al día
  try {
    if (typeof window.ishopLimGet === "function") {
      const d = await window.ishopLimGet("rol_" + mes);
      if (d && d.mesas) { const r = { titulo: d.titulo || limTitulo(mes), mesas: JSON.parse(d.mesas) }; try { localStorage.setItem(k, JSON.stringify(r)); localStorage.setItem(kh, hoy); } catch (_) {} return r; }
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
const limYoKey = mes => "ishop_lim_f2_" + mes;          // f2: obliga a firmar de nuevo (las firmas anteriores no llegaron a Firebase)
const limViejo = mes => { try { return localStorage.getItem("ishop_lim_firmado_" + mes) || ""; } catch (_) { return ""; } };
const limFirmado = mes => { try { return localStorage.getItem(limYoKey(mes)) || ""; } catch (_) { return ""; } };
const limDev = () => { try { let d = localStorage.getItem("ishop_lim_dev"); if (!d) { d = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem("ishop_lim_dev", d); } return d; } catch (_) { return "x"; } };
async function limFirmasDe(mes) { try { if (typeof window.ishopLimGet === "function") { const d = await window.ishopLimGet("firmas_" + mes); return (d && d.firmas) || {}; } } catch (_) {} return null; }
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
  const mes = limMesActual(), esCCmes = mes === LIM_CC_MES && limEsCC();
  try { if (localStorage.getItem(esCCmes ? "ishop_lim_ccok_" + mes : "ishop_lim_ok_" + mes) === "1") return; } catch (_) {}   // ya verificado este mes: cero lecturas a Firebase hasta el día 1
  const rol = await limRol(mes);
  if (!rol) return;
  const okMes = () => { try { localStorage.setItem("ishop_lim_ok_" + mes, "1"); if (esCCmes) localStorage.setItem("ishop_lim_ccok_" + mes, "1"); } catch (_) {} };
  let soloKolaz = false;
  if (mes === LIM_CC_MES && limEsCC()) {                   // Carlos C = Kolaz (solo este mes)
    const kol = limPersonas(rol).find(p => limNorm(p.nombre) === "kolaz");
    if (kol) {
      const fsK = await limFirmasDe(mes);
      if (fsK && fsK[kol.nombre] && fsK[kol.nombre].img) { try { localStorage.setItem(limYoKey(mes), kol.nombre); } catch (_) {} okMes(); return; }   // ya firmó como Kolaz
      if (fsK) soloKolaz = true;                           // sin firma de Kolaz: se le pide solo a él
    }
  }
  const f = soloKolaz ? "" : limFirmado(mes);
  if (f) {
    limReintentar();
    const pers = limPersonas(rol).find(p => limNorm(p.nombre) === limNorm(f));
    if (!pers || pers.fija) { okMes(); return; }           // no vendedor o mesa fija: ya entró
    const hoy = new Date().toDateString(), kc = "ishop_lim_chk_" + mes;   // la revisión en Firebase se hace una sola vez al día
    try { if (localStorage.getItem(kc) === hoy) return; } catch (_) {}
    const fs = await limFirmasDe(mes);                    // si su firma no está en Firebase, se vuelve a pedir
    if (!fs) return;
    if (fs[pers.nombre] && fs[pers.nombre].img) { try { localStorage.setItem(kc, hoy); } catch (_) {} okMes(); return; }
    try { localStorage.removeItem(limYoKey(mes)); } catch (_) {}
  }
  limGateAbierto = true;
  limCss();
  const personas = limPersonas(rol), nombreApp = (typeof ishopAjustes === "function" ? ishopAjustes().nombre : "") || "";
  const ant = limNorm(limViejo(mes)), previo = soloKolaz ? personas.find(p => limNorm(p.nombre) === "kolaz") : personas.find(p => ant && limNorm(p.nombre) === ant) || personas.find(p => limNorm(p.nombre) === limNorm(nombreApp) || limNorm(nombreApp).split(" ")[0] === limNorm(p.nombre));
  const ov = document.createElement("div"); ov.className = "lim-ov";
  ov.innerHTML = `<div class="lim-card"><h2>Rol de limpieza · ${limEsc(rol.titulo || limTitulo(mes))}</h2>
    <p class="lim-sub">Elige tu nombre, revisa tu mesa y firma para continuar.</p>
    <div class="lim-lista">${rol.mesas.filter(m => !soloKolaz || m.asesores.some(a => limNorm(a) === "kolaz")).sort((a, b) => LIM_ORDEN.indexOf(a.mesa) - LIM_ORDEN.indexOf(b.mesa)).map(m => `<button type="button" class="lim-fila" data-m="${m.mesa}"><i style="background:${LIM_COL[m.mesa]}">${LIM_NOM[m.mesa]}</i><span>${m.asesores.map(a => `<b data-n="${limEsc(a)}">${limEsc(a)}</b>`).join(", ")}</span></button>`).join("")}</div>
    <div class="lim-nov"><b>No soy vendedor</b><p>Escribe tu nombre para entrar (sin mesa de limpieza).</p><input type="text" class="lim-in" placeholder="Tu nombre" autocomplete="off" autocapitalize="words"><div class="lim-err" hidden></div><button type="button" class="lim-go lim-gonv">Entrar</button></div>
    <div class="lim-yo" hidden><div class="lim-tu"></div><div class="lim-pad"></div><button type="button" class="lim-go" disabled>Firmar y continuar</button></div></div>`;
  document.body.appendChild(ov);
  if (soloKolaz) { const nv = ov.querySelector(".lim-nov"); if (nv) nv.style.display = "none"; }
  const yo = ov.querySelector(".lim-yo"), tu = ov.querySelector(".lim-tu"), go = ov.querySelector(".lim-yo .lim-go"); let sel = null, pad = null;
  const elegir = (p) => {
    sel = p; ov.querySelectorAll(".lim-fila").forEach(f => f.classList.toggle("on", f.dataset.m === p.mesa));
    yo.hidden = false;
    if (p.fija) { tu.innerHTML = `<b>${limEsc(p.nombre)}</b>: la mesa ${LIM_NOM[p.mesa]} es fija, no necesitas firmar.<div class="lim-err" id="limFijaErr" hidden></div>`; ov.querySelector(".lim-pad").style.display = "none"; go.disabled = false; go.textContent = "Continuar"; return; }
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
    if (sel.fija) {
      let ok = true; try { if (typeof window.ishopLimAcceso === "function") ok = await window.ishopLimAcceso("fija_" + mes, limDev(), 3); } catch (_) { ok = true; }
      if (!ok) { const e = ov.querySelector("#limFijaErr"); if (e) { e.hidden = false; e.textContent = "Acceso denegado: ya se usaron los 3 accesos de la mesa " + LIM_NOM[sel.mesa] + "."; } go.disabled = false; return; }
    }
    let subido = true;
    if (!sel.fija) { if (pad.vacia()) { go.disabled = false; return; } subido = await limSubirFirma(mes, sel.nombre, pad.png(), Date.now()); }
    if (subido) okMes();
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
  const wrap = document.createElement("div"); wrap.className = "lim-wrap";
  wrap.innerHTML = `<div class="ase-hero"><h2>Asesores</h2></div>
    <button type="button" class="ase-card" id="aseLim"><span class="ase-ic">🧹</span><span class="ase-tx"><b>Limpieza</b></span><i></i></button>`;
  wrap.querySelector("#aseLim").addEventListener("click", () => navigate({ screen: "limpieza", title: "Limpieza" }));
  return wrap;
}

function limImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }
/* Imagen del PDF (para la previa): misma distribución que el PDF. */
async function limPreview(rol, firmas, ancho, calidad) {
  const k = ancho / 792, cv = document.createElement("canvas"); cv.width = ancho; cv.height = Math.round(612 * k); const x = cv.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, cv.width, cv.height); x.scale(k, k);
  const logo = await limImg("imágenes/limpieza/logo.jpg"), plano = await limImg("imágenes/limpieza/plano.jpg");
  if (logo) x.drawImage(logo, 50, 14, 118, 38);
  x.fillStyle = "#000"; x.font = "bold 21px Helvetica, Arial, sans-serif"; x.textBaseline = "alphabetic"; x.fillText("ROL DE LIMPIEZA " + (rol.titulo || ""), 195, 40);
  const filas = rol.mesas.slice().sort((a, b) => LIM_ORDEN.indexOf(a.mesa) - LIM_ORDEN.indexOf(b.mesa)), RH = 24, w = [58, 118, 160];
  const col = async (lista, x0) => {
    x.fillStyle = "#222"; x.font = "9px Helvetica, Arial, sans-serif"; let cx = x0; ["MESA", "ASESOR", "FIRMA"].forEach((t, i) => { x.fillText(t, cx + w[i] / 2 - x.measureText(t).width / 2, 66 + 8); cx += w[i]; });
    for (let r = 0; r < lista.length; r++) {
      const m = lista[r], y = 82 + r * RH;
      x.fillStyle = r % 2 ? "#f5f5f5" : "#fff"; x.fillRect(x0, y, w[0] + w[1] + w[2], RH); x.strokeStyle = "#ccc"; x.lineWidth = .5; x.strokeRect(x0, y, w[0] + w[1] + w[2], RH);
      x.fillStyle = LIM_COL[m.mesa]; x.fillRect(x0, y, w[0], RH);
      x.font = "bold 9px Helvetica, Arial, sans-serif"; x.fillStyle = ["9", "5y6", "13y14", "7y8", "10"].includes(m.mesa) ? "#fff" : "#000"; const t = LIM_NOM[m.mesa]; x.fillText(t, x0 + w[0] / 2 - x.measureText(t).width / 2, y + RH / 2 + 3);
      x.fillStyle = "#000"; const nom = m.asesores.join(", "); x.font = (nom.length > 22 ? 8 : 10) + "px Helvetica, Arial, sans-serif"; x.fillText(nom, x0 + w[0] + w[1] / 2 - x.measureText(nom).width / 2, y + RH / 2 + 3);
      if (m.mesa !== LIM_FIJA) {
        const cw = w[2] / Math.max(1, m.asesores.length);
        for (let i = 0; i < m.asesores.length; i++) { const f = firmas[m.asesores[i]]; if (!f || !f.img) continue; const im = await limImg(f.img); if (!im) continue; const h = RH - 4, ww = Math.min(cw - 4, h * im.width / im.height); x.drawImage(im, x0 + w[0] + w[1] + i * cw + (cw - ww) / 2, y + 2, ww, h); }
      }
    }
  };
  await col(filas.slice(0, 6), 50); await col(filas.slice(6), 50 + 336 + 20);
  if (plano) { const pw = 640, ph = pw * plano.height / plano.width; x.drawImage(plano, (792 - pw) / 2, 234, pw, ph); }
  return cv.toDataURL("image/jpeg", calidad);
}
function limVisor(rol, firmas) {
  const ov = document.createElement("div"); ov.className = "lim-vis"; ov.innerHTML = `<button type="button" class="lim-x">✕</button><div class="lim-vp"><img alt=""></div>`;
  document.body.appendChild(ov); const img = ov.querySelector("img"); let z = false;
  limPreview(rol, firmas, 1500, .6).then(u => { img.src = u; });
  img.addEventListener("click", () => { z = !z; img.style.width = z ? "230%" : "100%"; });
  ov.querySelector(".lim-x").addEventListener("click", () => ov.remove());
}
/* Cuadro: previa + PDF de un mes (se usa en Limpieza y en Registros) */
function limCuadroPrevia(host, getRol, getFirmas) {
  host.innerHTML = `<div class="lim-prev"><img alt="Previa del rol de limpieza"><small>Toca la imagen para verla grande</small></div>`;
  const img = host.querySelector("img"); let tmr = 0, ultima = "";
  const pinta = async () => { const rol = getRol(); if (!rol) return; const f = getFirmas(), sig = JSON.stringify([rol.titulo, Object.keys(f).map(n => n + (f[n] && f[n].ts))]); if (sig === ultima) return; ultima = sig; img.src = await limPreview(rol, f, 700, .4); };
  img.addEventListener("click", () => { const rol = getRol(); if (rol) limVisor(rol, getFirmas()); });
  return () => { clearTimeout(tmr); tmr = setTimeout(pinta, 120); };
}
function buildLimpieza() {
  limCss();
  const mes = limMesActual();
  const wrap = document.createElement("div"); wrap.className = "lim-wrap";
  wrap.innerHTML = `<div class="lim-hero"><span>🧹</span><div><h2>Rol de limpieza</h2><p id="limSub">Cargando…</p></div></div><div id="limMesas"></div><div class="lim-bar"><button type="button" class="lim-pdf" id="limPdf">Generar PDF</button></div><div id="limPrev"></div><button type="button" class="lim-reg" id="limReg"><b>Registros</b><small>Meses anteriores guardados</small><i></i></button>`;
  let rol = null, firmas = {};
  const refrescarPrev = limCuadroPrevia(wrap.querySelector("#limPrev"), () => rol, () => firmas);
  const pinta = () => {
    if (!rol) return;
    const req = limPersonas(rol).filter(p => !p.fija), ok = req.filter(p => firmas[p.nombre] && firmas[p.nombre].img), falta = req.length - ok.length;
    wrap.querySelector("#limSub").textContent = `${rol.titulo || limTitulo(mes)} · firmaron ${ok.length} de ${req.length}` + (falta ? ` · faltan ${falta}` : " · completo ✓");
    const pend = rol.mesas.filter(m => m.mesa !== LIM_FIJA).map(m => ({ mesa: m.mesa, asesores: m.asesores.filter(a => !(firmas[a] && firmas[a].img)) })).filter(m => m.asesores.length).sort((a, b) => LIM_ORDEN.indexOf(a.mesa) - LIM_ORDEN.indexOf(b.mesa));
    wrap.querySelector("#limMesas").innerHTML = pend.length ? `<h3 class="lim-h3">Faltan por firmar</h3>` + pend.map(m => `<div class="lim-fila fix"><i style="background:${LIM_COL[m.mesa]}">${LIM_NOM[m.mesa]}</i><span>${m.asesores.map(a => `<b>${limEsc(a)}</b>`).join(", ")}</span><em class="no">Pendiente</em></div>`).join("") : "";
    wrap.querySelector("#limPdf").textContent = falta ? `Generar PDF (faltan ${falta} firma${falta === 1 ? "" : "s"})` : "Generar PDF";
    refrescarPrev();
  };
  try { const c = JSON.parse(localStorage.getItem("ishop_lim_fc_" + mes)); if (c && typeof c === "object") firmas = c; } catch (_) {}   // muestra al instante las firmas guardadas mientras llegan las nuevas
  limRol(mes).then(r => { rol = r; if (!r) wrap.querySelector("#limSub").textContent = "Todavía no hay rol para este mes."; pinta(); });
  const stop = limEscuchar(mes, f => { firmas = f; try { localStorage.setItem("ishop_lim_fc_" + mes, JSON.stringify(f)); } catch (_) {} pinta(); });
  const obs = new MutationObserver(() => { if (!wrap.isConnected) { stop(); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
  wrap.querySelector("#limPdf").addEventListener("click", async () => { if (!rol) return; const b = wrap.querySelector("#limPdf"); b.disabled = true; b.textContent = "Generando…"; try { await limPdf(rol, mes, firmas); } catch (e) { alert("No se pudo generar el PDF."); } b.disabled = false; pinta(); });
  wrap.querySelector("#limReg").addEventListener("click", () => navigate({ screen: "limregistros", title: "Registros" }));
  return wrap;
}

/* ---- Registros: meses guardados (ver, descargar, borrar con nombre autorizado) ---- */
function buildLimRegistros() {
  limCss();
  const wrap = document.createElement("div"); wrap.className = "lim-wrap";
  wrap.innerHTML = `<div class="lim-hero"><span>🗂️</span><div><h2>Registros</h2><p>Roles de limpieza guardados mes con mes.</p></div></div><div id="limRegL"><p class="lim-sub">Buscando…</p></div>`;
  (async () => {
    const hoy = limMesActual(), y0 = +hoy.split("-")[0], out = [];
    for (let y = y0; y >= y0 - 1; y--) for (let m = 12; m >= 1; m--) {
      const mes = y + "-" + String(m).padStart(2, "0"); if (mes > hoy) continue;
      const f = await limFirmasDe(mes), j = await limCargarJson();
      if ((f && Object.keys(f).length) || (j.meses && j.meses[mes] && mes === hoy)) out.push({ mes, n: f ? Object.keys(f).length : 0 });
    }
    wrap.querySelector("#limRegL").innerHTML = out.length ? out.map(o => `<button type="button" class="lim-reg" data-m="${o.mes}"><b>${limTitulo(o.mes)}</b><small>${o.n} firma${o.n === 1 ? "" : "s"} guardada${o.n === 1 ? "" : "s"}</small><i></i></button>`).join("") : `<p class="lim-sub">Todavía no hay registros guardados.</p>`;
    wrap.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => navigate({ screen: "limregistro", mes: b.dataset.m, title: limTitulo(b.dataset.m) })));
  })();
  return wrap;
}
function buildLimRegistro(mes) {
  limCss();
  const wrap = document.createElement("div"); wrap.className = "lim-wrap";
  wrap.innerHTML = `<div class="lim-hero"><span>🧾</span><div><h2>${limTitulo(mes)}</h2><p id="limRs">Cargando…</p></div></div><div class="lim-bar"><button type="button" class="lim-pdf" id="limRp">Descargar PDF</button></div><div id="limRv"></div><button type="button" class="lim-del" id="limRb">Borrar este registro</button>`;
  let rol = null, firmas = {};
  const ref = limCuadroPrevia(wrap.querySelector("#limRv"), () => rol, () => firmas);
  (async () => {
    rol = await limBuscar(mes); firmas = (await limFirmasDe(mes)) || {};
    if (!rol) { wrap.querySelector("#limRs").textContent = "Sin datos del rol."; return; }
    const req = limPersonas(rol).filter(p => !p.fija); wrap.querySelector("#limRs").textContent = `Firmaron ${req.filter(p => firmas[p.nombre] && firmas[p.nombre].img).length} de ${req.length}`; ref();
  })();
  wrap.querySelector("#limRp").addEventListener("click", async () => { if (rol) try { await limPdf(rol, mes, firmas); } catch (_) { alert("No se pudo generar el PDF."); } });
  wrap.querySelector("#limRb").addEventListener("click", async () => {
    const n = prompt("Para borrar este registro escribe tu nombre (solo personal autorizado):");
    if (n === null) return;
    if (!LIM_NO_VEND.includes(limNorm(n))) { alert("Ese nombre no está autorizado para borrar."); return; }
    if (!confirm("¿Borrar el registro de " + limTitulo(mes) + "? No se puede deshacer.")) return;
    try { if (typeof window.ishopLimBorrar === "function") { await window.ishopLimBorrar("firmas_" + mes); await window.ishopLimBorrar("rol_" + mes); } localStorage.removeItem("ishop_lim_rol_" + mes); localStorage.removeItem("ishop_lim_ok_" + mes); localStorage.removeItem("ishop_lim_ccok_" + mes); localStorage.removeItem("ishop_lim_fc_" + mes); localStorage.removeItem(limYoKey(mes)); alert("Registro borrado."); history.back(); }
    catch (_) { alert("No se pudo borrar (revisa tu conexión)."); }
  });
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
  .lim-hero{ display:flex; align-items:center; gap:14px; padding:18px 16px; margin:6px 0 14px; border-radius:22px; color:#fff; background:linear-gradient(125deg,#0f5c6e,#168a9b 60%,#0d4a5a); box-shadow:0 12px 26px rgba(15,92,110,.32), inset 0 1px 0 rgba(255,255,255,.2); }
  .lim-hero span{ font-size:34px; } .lim-hero h2{ margin:0; font-size:26px; letter-spacing:-.02em; } .lim-hero p{ margin:3px 0 0; font-size:14px; opacity:.88; }
  .lim-h3{ margin:4px 4px 6px; font-size:15px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.06em; }
  .lim-prev{ margin-top:14px; } .lim-prev img{ display:block; width:100%; min-height:120px; border-radius:14px; border:1px solid var(--border,#d1d1d6); background:#fff; box-shadow:0 6px 16px rgba(0,0,0,.1); } .lim-prev small{ display:block; margin-top:6px; text-align:center; color:var(--text-secondary); font-size:12.5px; }
  .lim-reg{ display:flex; align-items:center; width:100%; text-align:left; gap:2px; margin-top:12px; padding:14px 16px; border:0; border-radius:16px; background:var(--surface,#fff); color:var(--text); font:inherit; box-shadow:0 1px 0 rgba(0,0,0,.08); flex-wrap:wrap; position:relative; }
  .lim-reg b{ flex-basis:100%; font-size:17px; } .lim-reg small{ color:var(--text-secondary); font-size:13px; } .lim-reg i{ position:absolute; right:16px; top:50%; width:8px; height:8px; border-right:2px solid currentColor; border-bottom:2px solid currentColor; transform:translateY(-50%) rotate(-45deg); opacity:.5; }
  .lim-del{ width:100%; margin-top:16px; padding:13px; border:0; border-radius:14px; background:rgba(255,69,58,.14); color:#e5392e; font:inherit; font-weight:800; font-size:15px; }
  .lim-vis{ position:fixed; inset:0; z-index:99998; background:rgba(0,0,0,.92); display:flex; flex-direction:column; } .lim-vp{ flex:1; overflow:auto; -webkit-overflow-scrolling:touch; padding:56px 8px 20px; } .lim-vp img{ width:100%; display:block; background:#fff; border-radius:8px; max-width:none; }
  .lim-x{ position:absolute; top:calc(env(safe-area-inset-top,0px) + 10px); right:12px; z-index:2; width:40px; height:40px; border:0; border-radius:50%; background:rgba(255,255,255,.2); color:#fff; font-size:20px; }
  .ase-hero{ margin:8px 2px 18px; } .ase-hero small{ font-size:12px; font-weight:800; letter-spacing:.22em; color:#8e5bd0; } .ase-hero h2{ margin:2px 0 4px; font-size:40px; font-weight:850; letter-spacing:-.035em; background:linear-gradient(120deg,#0a84ff,#12b5c9 55%,#2fcf8a); -webkit-background-clip:text; background-clip:text; color:transparent; } .ase-hero p{ margin:0; color:var(--text-secondary); font-size:15px; }
  .ase-card{ position:relative; display:flex; align-items:center; gap:14px; width:100%; text-align:left; padding:16px; border:0; border-radius:22px; color:#fff; font:inherit; background:linear-gradient(125deg,#0f5c6e,#168a9b 60%,#0d4a5a); box-shadow:0 12px 26px rgba(15,92,110,.32), inset 0 1px 0 rgba(255,255,255,.2); }
  .ase-card:active{ transform:scale(.985); } .ase-ic{ width:50px; height:50px; border-radius:15px; background:rgba(255,255,255,.18); display:grid; place-items:center; font-size:26px; } .ase-tx{ flex:1; display:flex; flex-direction:column; gap:2px; } .ase-tx b{ font-size:19px; } .ase-tx small{ font-size:13px; opacity:.85; }
  .ase-card i{ width:9px; height:9px; border-right:2px solid #fff; border-bottom:2px solid #fff; transform:rotate(-45deg); opacity:.7; }`;
  document.head.appendChild(s);
}
window.addEventListener("load", () => { setTimeout(limGate, 600); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) limGate(); });
