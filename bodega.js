/* =====================================================================
   BODEGA (oculto) — inventario por foto
   Se abre manteniendo presionado el botón "Registros" ~1 segundo.
   Flujo: foto del listado → escaneo renglón por renglón (lector de texto) →
   compara contra las existencias guardadas → reporte de cambios → Aplicar.
   Todo se guarda en ESTE teléfono (localStorage). No toca otros módulos.
   Catálogo: usa datos/escaner.json (UPC → modelo/color/capacidad) + códigos nuevos
   que tú nombres aquí. Lector de texto: libs/tesseract/ (si no está, lo baja de internet).
   ===================================================================== */
const BODEGA_KEY = "ishop_bodega_v1";
const BODEGA_EXTRA_KEY = "ishop_bodega_extra_v1";
const BODEGA_ORDEN = ["iPhone Duo","iPhone 18 Pro Max","iPhone 18 Pro","iPhone 17 Pro Max","iPhone 17 Pro","iPhone Air","iPhone 17","iPhone 17e","iPhone 16 Plus","iPhone 16","iPhone 16e","iPhone 15"];

/* Existencias de ejemplo = foto del 21-10-2026 (para probar sin tomar foto) */
const BODEGA_SEED = {
  "195949035180":1,"195950643015":79,"195950643213":1,"195950643138":112,"195950643336":2,"195950643091":43,
  "195950643299":1,"195950643176":27,"195950643374":1,"195950643053":39,"195950643251":1,"195950626438":3,
  "195950626513":5,"195950626759":1,"195950626353":18,"195950638288":26,"195950638325":15,"195950638240":32,
  "195951030197":16,"195951030272":5,"195951030234":7,"195951415581":1,"195951415505":37,"195951415529":135,
  "195951415611":1,"195951415536":64,"195951415550":10,"195951409948":10,"195951409863":7,"195951409887":60,
  "195951409924":29,"195951409979":5,"195951410012":2,"195951409955":1,"195951409870":8,"195951409993":1,
  "195950621419":11,"195950621297":1,"195951405650":40,"195951405612":40
};

/* DATOS DE PRUEBA (erróneos a propósito): escanea la foto del 21-10-2026 y el reporte debe corregirlos */
const BODEGA_PRUEBA = {"195949035180":1,"195950643015":70,"195950643213":1,"195950643138":120,"195950643336":2,"195950643091":43,"195950643299":1,"195950643176":27,"195950643374":1,"195950643053":39,"195950643251":1,"195950626438":3,"195950626513":5,"195950626759":1,"195950626353":14,"195950638288":26,"195950638325":15,"195950638240":32,"195951030197":20,"195951030272":5,"195951030234":7,"195951415505":37,"195951415529":150,"195951415611":1,"195951415536":64,"195951415550":10,"195951409948":10,"195951409863":12,"195951409887":55,"195951409924":29,"195951409979":5,"195951410012":2,"195951409955":1,"195951409870":8,"195950621419":11,"195951405650":25,"195951405612":40,"195949821257":6};

/* ---------- Catálogo ---------- */
function bodegaExtra() { try { return JSON.parse(localStorage.getItem(BODEGA_EXTRA_KEY)) || {}; } catch (e) { return {}; } }
function bodegaCatalogo() {
  const cat = {};
  const esc = (typeof ESCANER_DATA !== "undefined" && ESCANER_DATA) || {};
  Object.keys(esc).forEach(k => { if (/^iPhone/i.test(esc[k].modelo || "")) cat[k] = { modelo: esc[k].modelo, color: esc[k].color || "", capacidad: esc[k].capacidad || "" }; });
  const ex = bodegaExtra();
  Object.keys(ex).forEach(k => { cat[k] = ex[k]; });
  return cat;
}
function bodegaCap(c) { c = String(c || ""); return /^\d+$/.test(c) ? c + "GB" : c; }
function bodegaNombre(cat, code) {
  const e = cat[code];
  if (!e) return "UPC " + code;
  return [e.modelo, e.color, bodegaCap(e.capacidad)].filter(Boolean).join(" ");
}

/* ---------- Guardado ---------- */
function bodegaLoad() {
  try { const d = JSON.parse(localStorage.getItem(BODEGA_KEY)); if (d && d.stock) return d; } catch (e) {}
  return { stock: {}, fecha: "", ultimoReporte: null };
}
function bodegaSave(d) { try { localStorage.setItem(BODEGA_KEY, JSON.stringify(d)); } catch (e) {} }

/* ---------- UPC-A: dígito verificador ---------- */
function bodegaUpcOk(c) {
  if (!/^\d{12}$/.test(c)) return false;
  const d = c.split("").map(Number);
  const s = (d[0]+d[2]+d[4]+d[6]+d[8]+d[10]) * 3 + (d[1]+d[3]+d[5]+d[7]+d[9]);
  return (10 - (s % 10)) % 10 === d[11];
}

/* Corrige errores del lector comparando contra el catálogo. Devuelve {code, estado} */
function bodegaResolver(raw, cat) {
  const r = String(raw || "").replace(/\D/g, "");
  if (cat[r]) return { code: r, estado: "ok" };
  const keys = Object.keys(cat);
  const hallados = new Set();
  const probar = (c) => { if (cat[c]) hallados.add(c); };
  if (r.length === 12) {
    keys.forEach(k => { let d = 0; for (let i = 0; i < 12 && d < 2; i++) if (k[i] !== r[i]) d++; if (d <= 1) hallados.add(k); });
  } else if (r.length === 13) {
    for (let i = 0; i < 13; i++) probar(r.slice(0, i) + r.slice(i + 1));
  } else if (r.length === 11) {
    for (let i = 0; i <= 11; i++) for (let n = 0; n < 10; n++) probar(r.slice(0, i) + n + r.slice(i));
  }
  if (hallados.size === 0 && r.length === 12) {
    keys.forEach(k => { let d = 0; for (let i = 0; i < 12 && d < 3; i++) if (k[i] !== r[i]) d++; if (d <= 2) hallados.add(k); });
  }
  if (hallados.size === 1) return { code: [...hallados][0], estado: "corregido" };
  if (r.length === 12 && bodegaUpcOk(r)) return { code: r, estado: "nuevo" };
  if (hallados.size > 1) return { code: r, estado: "ambiguo" };
  return { code: r, estado: "ilegible" };
}

/* ---------- Palabras del lector → renglones ---------- */
function bodegaRenglones(words, anchoImg) {
  const ws = words.filter(w => w.bbox && String(w.text || "").trim())
    .map(w => ({ t: String(w.text).trim(), x: (w.bbox.x0 + w.bbox.x1) / 2, y: (w.bbox.y0 + w.bbox.y1) / 2, h: w.bbox.y1 - w.bbox.y0 }))
    .sort((a, b) => a.y - b.y);
  if (!ws.length) return [];
  const hs = ws.map(w => w.h).sort((a, b) => a - b);
  const tol = Math.max(6, hs[Math.floor(hs.length / 2)] * 0.6);
  const rows = [];
  ws.forEach(w => {
    const last = rows[rows.length - 1];
    if (last && Math.abs(w.y - last.y) <= tol) { last.w.push(w); last.y = (last.y * (last.w.length - 1) + w.y) / last.w.length; }
    else rows.push({ y: w.y, w: [w] });
  });
  return rows.map(r => r.w.sort((a, b) => a.x - b.x));
}

/* Un renglón → { raw, qty } (o null si no parece renglón de inventario) */
function bodegaLeerRenglon(tokens, ancho) {
  const izq = tokens.filter(t => t.x < ancho * 0.5).map(t => t.t.replace(/\D/g, "")).join("");
  const nums = tokens.filter(t => /^\d{1,3}(,\d{3})*[.,]\d{2}$|^\d{1,5}[.,]\d{2}$/.test(t.t.replace(/\s/g, "")));
  if (izq.length < 10 || !nums.length) return null;
  const q = nums[nums.length - 1].t.replace(/\s/g, "");
  const val = parseFloat(q.replace(/,(?=\d{3}\b)/g, "").replace(",", "."));
  if (!isFinite(val)) return null;
  return { raw: izq.slice(0, 13), qty: Math.round(val) };
}

/* Fecha dd-mm-aaaa en el encabezado */
function bodegaFecha(words) {
  for (const w of words) { const m = String(w.text || "").match(/(\d{2})[-/](\d{2})[-/](20\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`; }
  return "";
}

/* ---------- Diferencias ---------- */
function bodegaComparar(prev, nuevo, cat) {
  const aumentos = [], bajas = [], nuevos = [], desaparecidos = [];
  let sinCambio = 0;
  new Set([...Object.keys(prev), ...Object.keys(nuevo)]).forEach(c => {
    const a = prev[c] || 0, b = nuevo[c] || 0, nombre = bodegaNombre(cat, c);
    if (a === b) { sinCambio++; return; }
    const it = { code: c, nombre, antes: a, ahora: b, dif: b - a };
    if (!(c in prev)) nuevos.push(it);
    else if (!(c in nuevo)) desaparecidos.push(it);
    else if (b > a) aumentos.push(it);
    else bajas.push(it);
  });
  const orden = (x, y) => Math.abs(y.dif) - Math.abs(x.dif);
  [aumentos, bajas, nuevos, desaparecidos].forEach(l => l.sort(orden));
  return { aumentos, bajas, nuevos, desaparecidos, sinCambio };
}
function bodegaTextoReporte(rep, fecha) {
  const sg = n => (n > 0 ? "+" : "") + n;
  const lin = it => `• ${it.nombre}: ${sg(it.dif)} pza${Math.abs(it.dif) === 1 ? "" : "s"} (${it.antes} → ${it.ahora})`;
  const out = [`Reporte de bodega${fecha ? " · " + fecha : ""}`];
  if (rep.aumentos.length) out.push("", "AUMENTARON", ...rep.aumentos.map(lin));
  if (rep.bajas.length) out.push("", "BAJARON", ...rep.bajas.map(lin));
  if (rep.nuevos.length) out.push("", "NUEVOS EN LISTA", ...rep.nuevos.map(lin));
  if (rep.desaparecidos.length) out.push("", "YA NO APARECEN (pasan a 0)", ...rep.desaparecidos.map(lin));
  if (out.length === 1) out.push("", "Sin cambios.");
  out.push("", `Sin cambio: ${rep.sinCambio} códigos`);
  return out.join("\n");
}

/* Lista de {raw,qty} → existencias */
function bodegaConstruir(filas, cat) {
  const stock = {}, dudosos = [], nuevos = [];
  filas.forEach(r => {
    const res = bodegaResolver(r.raw, cat);
    if (res.estado === "ilegible" || res.estado === "ambiguo") { dudosos.push({ raw: r.raw, qty: r.qty }); return; }
    if (res.estado === "nuevo" && !nuevos.includes(res.code)) nuevos.push(res.code);
    stock[res.code] = (stock[res.code] || 0) + r.qty;
  });
  return { stock, dudosos, nuevos, leidos: Object.keys(stock).length };
}

/* Texto (escaneado con el teclado del iPhone o pegado): un renglón por línea */
function bodegaFilasDeTexto(texto) {
  const filas = [];
  String(texto || "").split(/\r?\n/).forEach(l => {
    // solo se corrigen letras (O, l, I) dentro de "palabras" que son números
    const toks = l.trim().split(/\s+/).map(t => (/^[\dOolI|.,]+$/.test(t) && /\d/.test(t)) ? t.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1") : t);
    let raw = "", empezo = false;
    for (const t of toks) {
      if (/^\d+$/.test(t) && (empezo || t.length >= 3)) { raw += t; empezo = true; if (raw.length >= 12) break; }
      else if (empezo) break;
    }
    const nums = [...toks.join(" ").matchAll(/\d[\d,]*[.,]\d{2}(?!\d)/g)];
    if (raw.length < 10 || !nums.length) return;
    const q = nums[nums.length - 1][0];
    const val = parseFloat(q.replace(/,(?=\d{3}\b)/g, "").replace(",", "."));
    if (isFinite(val)) filas.push({ raw: raw.slice(0, 13), qty: Math.round(val) });
  });
  return filas;
}
function bodegaLeerTexto(texto) {
  const r = bodegaConstruir(bodegaFilasDeTexto(texto), bodegaCatalogo());
  const m = String(texto).match(/(\d{2})[-/](\d{2})[-/](20\d{2})/);
  r.fecha = m ? `${m[1]}-${m[2]}-${m[3]}` : "";
  return r;
}

/* ---------- Imagen: limpiar y escalar ---------- */
function bodegaCargarImagen(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => rej(new Error("No pude abrir la foto"));
    img.src = url;
  });
}
function bodegaPreparar(img, simple) {
  const MAX = 2400, esc = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * esc), h = Math.round(img.naturalHeight * esc);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const im = ctx.getImageData(0, 0, w, h), px = im.data, g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = px[i*4] * 0.299 + px[i*4+1] * 0.587 + px[i*4+2] * 0.114;
  if (simple) { for (let i = 0; i < w * h; i++) { const v = Math.max(0, Math.min(255, (g[i] - 60) * 1.4)); px[i*4] = px[i*4+1] = px[i*4+2] = v; } ctx.putImageData(im, 0, 0); return cv; }
  // fondo = desenfoque grande (imagen integral); salida = gris / fondo → corrige luz despareja
  const W = w + 1, S = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) { let fila = 0; for (let x = 0; x < w; x++) { fila += g[y*w+x]; S[(y+1)*W+x+1] = S[y*W+x+1] + fila; } }
  const R = Math.max(12, Math.round(Math.min(w, h) / 40));
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1);
      const bg = (S[y1*W+x1] - S[y0*W+x1] - S[y1*W+x0] + S[y0*W+x0]) / ((x1 - x0) * (y1 - y0));
      let v = (g[y*w+x] / Math.max(bg, 1)) * 255;
      v = Math.max(0, Math.min(255, (v - 110) * 1.9 + 110));   // más contraste
      const o = (y*w+x) * 4; px[o] = px[o+1] = px[o+2] = v; px[o+3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  return cv;
}

/* ---------- Lector de texto (Tesseract) ---------- */
let bodegaWorkerP = null;
function bodegaCargarScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("x")); document.head.appendChild(s); });
}
async function bodegaWorker(onProg) {
  if (!window.Tesseract) {
    try { await bodegaCargarScript("libs/tesseract/tesseract.min.js"); window.__tessLocal = true; }
    catch (e) { await bodegaCargarScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"); window.__tessLocal = false; }
  }
  if (!bodegaWorkerP) {
    const opt = { logger: m => { if (m.status === "recognizing text") onProg && onProg(m.progress); } };
    if (window.__tessLocal) { opt.workerPath = "libs/tesseract/worker.min.js"; opt.corePath = "libs/tesseract/"; opt.langPath = "libs/tesseract/lang"; }
    bodegaWorkerP = Tesseract.createWorker("eng", 1, opt).then(async w => {
      await w.setParameters({ tessedit_char_whitelist: "0123456789.,-/", tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
      return w;
    });
    bodegaWorkerP.catch(() => { bodegaWorkerP = null; });
  }
  const w = await bodegaWorkerP;
  w.__prog = onProg;
  return w;
}

/* Foto → { stock, fecha, dudosos, nuevos, leidos }. Prueba varios intentos y se queda con el mejor */
async function bodegaEscanear(file, onEstado, onProg) {
  onEstado("Preparando la foto…");
  const img = await bodegaCargarImagen(file);
  onEstado("Cargando lector de texto…");
  let worker;
  try { worker = await bodegaWorker(onProg); }
  catch (e) { throw new Error("No pude cargar el lector de texto (necesita internet la primera vez)."); }
  const cat = bodegaCatalogo();
  const intentos = [
    { simple: false, psm: "6", wl: true },
    { simple: true,  psm: "6", wl: true },
    { simple: false, psm: "4", wl: true },
    { simple: true,  psm: "4", wl: false },
  ];
  let mejor = null;
  for (let i = 0; i < intentos.length; i++) {
    const it = intentos[i];
    onEstado(i === 0 ? "Escaneando renglón por renglón…" : `Reintentando con otro ajuste (${i + 1}/${intentos.length})…`);
    const cv = bodegaPreparar(img, it.simple);
    await worker.setParameters({ tessedit_char_whitelist: it.wl ? "0123456789.,-/ " : "", tessedit_pageseg_mode: it.psm, preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(cv, {}, { blocks: true });
    const words = data.words || (data.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => (p.lines || []).flatMap(l => l.words || [])));
    const filas = [];
    bodegaRenglones(words, cv.width).forEach(tk => { const r = bodegaLeerRenglon(tk, cv.width); if (r) filas.push(r); });
    let r1 = bodegaConstruir(filas, cat);
    const r2 = bodegaConstruir(bodegaFilasDeTexto(data.text || ""), cat);
    if (r2.leidos > r1.leidos) r1 = r2;
    r1.fecha = bodegaFecha(words) || (String(data.text || "").match(/\d{2}-\d{2}-20\d{2}/) || [""])[0];
    if (!mejor || r1.leidos > mejor.leidos) mejor = r1;
    if (mejor.leidos >= 25 && mejor.dudosos.length <= 2) break;
  }
  return mejor;
}

/* ---------- Pantalla ---------- */
function bodegaEstilos() {
  if (document.getElementById("bodEstilos")) return;
  const st = document.createElement("style"); st.id = "bodEstilos";
  st.textContent = `
  .bod-card{ background:#fff; border-radius:16px; padding:16px; margin:12px 0; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  html[data-mode="dark"] .bod-card{ background:#1c1c1e; }
  .bod-card h3{ margin:0 0 4px; font-size:18px; }
  .bod-card p{ margin:0 0 12px; font-size:14.5px; color:var(--text-secondary); line-height:1.4; }
  .bod-big{ display:block; width:100%; padding:16px; font-size:17px; border-radius:14px; border:0; background:var(--accent); color:#fff; font-weight:600; text-align:center; cursor:pointer; margin-bottom:10px; box-sizing:border-box; }
  .bod-big.sec{ background:#e8e8ed; color:var(--text); }
  html[data-mode="dark"] .bod-big.sec{ background:#3a3a3c; }
  .bod-txt{ width:100%; box-sizing:border-box; min-height:130px; border-radius:12px; border:1px solid rgba(120,120,128,.35); padding:10px; font:14px ui-monospace,Menlo,monospace; background:transparent; color:var(--text); }
  .bod-small{ display:flex; gap:16px; justify-content:center; margin:18px 0; flex-wrap:wrap; }
  .bod-small button{ background:none; border:0; color:var(--accent); font-size:14.5px; padding:6px; }
  .bod-small button.rojo{ color:#ff3b30; }
  .bod-ok{ background:#34c759 !important; }`;
  document.head.appendChild(st);
}

function buildBodega() {
  bodegaEstilos();
  const wrap = document.createElement("div");
  wrap.className = "bod-wrap";
  const cat = () => bodegaCatalogo();
  let estado = bodegaLoad();
  let pendiente = null;
  const ordenModelo = m => { const i = BODEGA_ORDEN.indexOf(m); return i < 0 ? 99 : i; };

  function pintar() {
    const c = cat(), n = Object.keys(estado.stock).length;
    const total = Object.values(estado.stock).reduce((a, b) => a + b, 0);
    wrap.innerHTML = `
      <div class="reg-heading"><h2>Bodega <small style="font-size:13px;font-weight:500;color:var(--text-secondary)">v3</small></h2>
        <p class="ds-sub">${n ? `${total} piezas en ${n} códigos${estado.fecha ? " · lista del " + estado.fecha : ""}` : "Todavía no hay existencias guardadas."}</p></div>

      <div class="bod-card">
        <h3>Actualizar existencias</h3>
        <p>Escanea o sube el listado del día. La app lo lee y te dice qué cambió.</p>
        <label class="bod-big">📄 Escanear / subir foto del listado
          <input type="file" accept="image/*" id="bodFoto" hidden></label>
        <button class="bod-big sec" id="bodVerTexto">📝 Pegar o escanear texto</button>
        <div id="bodTextoBox" hidden>
          <p>Toca el cuadro, mantén presionado y elige <b>“Escanear texto”</b> (icono de cámara) y apunta al papel. Luego toca “Leer texto”.</p>
          <textarea class="bod-txt" id="bodTexto" placeholder="Aquí aparece el texto…"></textarea>
          <button class="bod-big" id="bodLeerTexto" style="margin-top:10px">Leer texto</button>
        </div>
        <div id="bodEstado" class="bod-estado" hidden></div>
        <div id="bodPreview"></div>
      </div>`;

    if (n) {
      const modelos = {};
      Object.keys(estado.stock).forEach(code => {
        const e = c[code] || { modelo: "Código nuevo", color: "", capacidad: "" };
        (modelos[e.modelo] = modelos[e.modelo] || []).push({ code, e, qty: estado.stock[code] });
      });
      const box = document.createElement("div"); box.className = "bod-card";
      box.innerHTML = `<h3>Existencias por modelo</h3><p>Toca un modelo para ver colores, capacidades y UPC.</p>`;
      Object.keys(modelos).sort((a, b) => ordenModelo(a) - ordenModelo(b) || a.localeCompare(b)).forEach(m => {
        const items = modelos[m].sort((a, b) => parseInt(a.e.capacidad) - parseInt(b.e.capacidad) || a.e.color.localeCompare(b.e.color));
        const det = document.createElement("details"); det.className = "bod-model";
        det.innerHTML = `<summary><span>${m}</span><b>${items.reduce((s, i) => s + i.qty, 0)}</b></summary>` +
          items.map(i => `<div class="bod-row"><div><strong>${[i.e.color, bodegaCap(i.e.capacidad)].filter(Boolean).join(" · ") || "Sin nombre"}</strong><small>UPC ${i.code}</small></div><b>${i.qty}</b></div>`).join("");
        box.appendChild(det);
      });
      wrap.appendChild(box);
    }
    if (estado.ultimoReporte) {
      const u = document.createElement("div"); u.className = "bod-card";
      u.innerHTML = `<h3>Último reporte</h3><pre style="white-space:pre-wrap;font:inherit;font-size:15px;margin:0">${estado.ultimoReporte.replace(/</g, "&lt;")}</pre>`;
      wrap.appendChild(u);
    }
    const pie = document.createElement("div"); pie.className = "bod-small";
    pie.innerHTML = `<button id="bodPrueba">Cargar datos de prueba</button><button id="bodSeed">Cargar lista del 21-10</button><button class="rojo" id="bodBorrar">Borrar todo</button>`;
    wrap.appendChild(pie);

    wrap.querySelector("#bodFoto").addEventListener("change", e => procesar(e.target.files[0]));
    wrap.querySelector("#bodVerTexto").addEventListener("click", () => { const b = wrap.querySelector("#bodTextoBox"); b.hidden = !b.hidden; if (!b.hidden) wrap.querySelector("#bodTexto").focus(); });
    wrap.querySelector("#bodLeerTexto").addEventListener("click", () => {
      const t = wrap.querySelector("#bodTexto").value, est = wrap.querySelector("#bodEstado"), prev = wrap.querySelector("#bodPreview");
      const esc = bodegaLeerTexto(t); est.hidden = false; prev.innerHTML = "";
      if (!esc.leidos) { est.textContent = "No encontré renglones con código y existencia en ese texto."; return; }
      pendiente = { esc }; est.textContent = `Leí ${esc.leidos} códigos.`; mostrarReporte(prev, cat());
    });
    const poner = (stock, fecha, msg) => {
      if (Object.keys(estado.stock).length && !confirm(msg)) return;
      estado = { stock: { ...stock }, fecha, ultimoReporte: null }; bodegaSave(estado); pintar();
    };
    wrap.querySelector("#bodPrueba").addEventListener("click", () => poner(BODEGA_PRUEBA, "datos de prueba", "Esto reemplaza tus existencias por datos de prueba (con errores a propósito). ¿Seguir?"));
    wrap.querySelector("#bodSeed").addEventListener("click", () => poner(BODEGA_SEED, "21-10-2026", "Esto reemplaza tus existencias por la lista del 21-10-2026. ¿Seguir?"));
    wrap.querySelector("#bodBorrar").addEventListener("click", () => {
      if (!confirm("¿Borrar todas las existencias de bodega de este teléfono?")) return;
      estado = { stock: {}, fecha: "", ultimoReporte: null }; bodegaSave(estado); pintar();
    });
  }

  async function procesar(file) {
    if (!file) return;
    const est = wrap.querySelector("#bodEstado"), prev = wrap.querySelector("#bodPreview");
    est.hidden = false; est.textContent = "Preparando…";
    const url = URL.createObjectURL(file);
    prev.innerHTML = `<div class="bod-scan"><img src="${url}" alt=""><div class="bod-scan-line" id="bodLinea"></div></div><div class="bod-bar"><i id="bodBarra"></i></div>`;
    const linea = prev.querySelector("#bodLinea"), barra = prev.querySelector("#bodBarra");
    try {
      const esc = await bodegaEscanear(file, t => { est.textContent = t; },
        p => { barra.style.width = Math.round(p * 100) + "%"; linea.style.top = Math.round(p * 100) + "%"; });
      barra.style.width = "100%"; linea.style.display = "none";
      if (!esc.leidos) { est.textContent = "No logré leer renglones de esa foto. Prueba con “Pegar o escanear texto”, que es más tolerante."; return; }
      pendiente = { esc };
      est.textContent = `Leí ${esc.leidos} códigos${esc.dudosos.length ? ` · ${esc.dudosos.length} dudoso(s)` : ""}.`;
      mostrarReporte(prev, cat(), true);
    } catch (e) { est.textContent = "Error: " + (e.message || e); }
  }

  function mostrarReporte(prev, c, conservar) {
    const { esc } = pendiente, fecha = esc.fecha;
    const rep = Object.keys(estado.stock).length ? bodegaComparar(estado.stock, esc.stock, c) : null;
    const tot = Object.values(esc.stock).reduce((a, b) => a + b, 0);
    const texto = rep ? bodegaTextoReporte(rep, fecha) : `Primera captura${fecha ? " · " + fecha : ""}\n${esc.leidos} códigos · ${tot} piezas`;
    let extra = "";
    if (esc.dudosos.length) extra += `<p class="bod-aviso">⚠️ No pude confirmar estos renglones y los dejé fuera: ${esc.dudosos.map(d => `${d.raw} (${d.qty})`).join(", ")}.</p>`;
    if (esc.nuevos.length) extra += `<p class="bod-aviso">🆕 Códigos fuera del catálogo:</p>${esc.nuevos.map(n => `<button class="bod-big sec bod-nombrar" data-c="${n}">${n} — Poner nombre</button>`).join("")}`;
    const html = `<div class="bod-reporte"><h3>Cambios detectados</h3><pre>${texto.replace(/</g, "&lt;")}</pre>${extra}
      <button class="bod-big bod-ok" id="bodAplicar">✓ Aplicar cambios</button>
      <button class="bod-big sec" id="bodCopiar">Copiar reporte</button>
      <button class="bod-big sec" id="bodCancelar">Descartar</button></div>`;
    if (!conservar) prev.innerHTML = "";
    prev.insertAdjacentHTML("beforeend", html);
    prev.querySelectorAll(".bod-nombrar").forEach(b => b.addEventListener("click", () => {
      const code = b.dataset.c, n = prompt("Nombre (ej. iPhone 18 Pro Max Naranja 512GB):", "");
      if (!n) return;
      const ex = bodegaExtra(); ex[code] = { modelo: n, color: "", capacidad: "" };
      try { localStorage.setItem(BODEGA_EXTRA_KEY, JSON.stringify(ex)); } catch (e) {}
      b.textContent = code + " — " + n; b.disabled = true;
    }));
    prev.querySelector("#bodCopiar").addEventListener("click", () => { navigator.clipboard && navigator.clipboard.writeText(texto); });
    prev.querySelector("#bodCancelar").addEventListener("click", () => { pendiente = null; pintar(); });
    prev.querySelector("#bodAplicar").addEventListener("click", () => {
      estado = { stock: esc.stock, fecha: fecha || estado.fecha, ultimoReporte: texto };
      bodegaSave(estado); pendiente = null; pintar();
    });
  }

  pintar();
  return wrap;
}

if (typeof module !== "undefined") module.exports = { bodegaFilasDeTexto, bodegaLeerTexto, bodegaResolver, bodegaRenglones, bodegaLeerRenglon, bodegaComparar, bodegaTextoReporte, bodegaUpcOk, bodegaFecha };
