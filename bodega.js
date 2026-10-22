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
  try { const d = JSON.parse(localStorage.getItem(BODEGA_KEY)); if (d && d.stock) { if (!Array.isArray(d.historial)) d.historial = []; return d; } } catch (e) {}
  return { stock: {}, fecha: "", ultimoReporte: null, historial: [] };
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

/* =====================================================================
   REPORTES CON DETALLE, EQUIPOS NO VENDIBLES Y APARTADOS
   (el escaneo de arriba no se toca; esto solo guarda y muestra los cambios)
   ===================================================================== */
const BODEGA_NV_KEY = "ishop_bodega_nv_v1";
const BODEGA_TIPOS = [
  { id: "DOA", color: "#ff453a" },
  { id: "Dañado", color: "#ff9f0a" },
  { id: "No vendible", color: "#bf5af2" },
  { id: "Apartado", color: "#0a84ff" },
];
const BX_ICON = {
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.2-1.8h6.2L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.1"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M4 12h15M14 7l5 5-5 5"/></svg>',
  mark: '<svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-3.5L7 20z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5.5M13.5 11v5.5"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
};

function bodegaEsc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function bodegaColor(nombre) { return typeof exColor === "function" ? exColor(nombre) : "#c7c7cc"; }
function bodegaCapTxt(c) { c = String(c || "").trim(); return !c ? "" : /^\d+$/.test(c) ? c + " GB" : c.replace(/\s*gb$/i, " GB").replace(/\s*tb$/i, " TB"); }
function bodegaCapNum(c) { const m = String(c || "").match(/(\d+)\s*(tb|gb)?/i); return !m ? 0 : /tb/i.test(m[2] || "") ? +m[1] * 1000 : +m[1]; }
function bodegaOrdenModelo(m) { const i = BODEGA_ORDEN.indexOf(m); return i < 0 ? 99 : i; }

/* Equipos no vendibles / apartados (se guardan solo en este teléfono) */
function bodegaNV() { try { const a = JSON.parse(localStorage.getItem(BODEGA_NV_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function bodegaNVSave(a) { try { localStorage.setItem(BODEGA_NV_KEY, JSON.stringify(a)); } catch (e) {} }
function bodegaApartados() {
  const o = {};
  bodegaNV().forEach(r => { if (r.tipo === "Apartado") o[r.code] = (o[r.code] || 0) + (+r.qty || 0); });
  return o;
}

/* Catálogo de TODOS los productos (iPhone, iPad, Mac…) + códigos nuevos que ya tengan existencia */
function bodegaCatalogoTodo(stock) {
  const out = {};
  if (typeof exCatalogo === "function") { const b = exCatalogo(); Object.keys(b).forEach(k => { out[k] = b[k]; }); }
  else { const c = bodegaCatalogo(); Object.keys(c).forEach(k => { out[k] = { ...c[k], seccion: "iPhone" }; }); }
  Object.keys(stock || {}).forEach(k => { if (!out[k]) out[k] = { modelo: "Código nuevo", color: "", capacidad: "", seccion: "Otros" }; });
  return out;
}

/* Al aplicar un escaneo: lo que ya estaba capturado a mano de otros productos (iPad, Mac…) se conserva */
function bodegaMezclar(prev, escaneado) {
  const out = { ...escaneado }, esc = (typeof ESCANER_DATA !== "undefined" && ESCANER_DATA) || {};
  Object.keys(prev || {}).forEach(c => {
    if (c in out) return;
    if (esc[c] && !/^iPhone/i.test(esc[c].modelo || "")) out[c] = prev[c];
  });
  return out;
}

/* ---------- Detalle de un reporte ---------- */
/* items = cambios + los demás colores del mismo modelo (para verlos en contexto) */
function bodegaItems(prev, nuevo, cat) {
  const modelo = c => (cat[c] && cat[c].modelo) || "Código nuevo";
  const todos = new Set([...Object.keys(prev), ...Object.keys(nuevo)]);
  const modelos = new Set();
  todos.forEach(c => { if ((prev[c] || 0) !== (nuevo[c] || 0)) modelos.add(modelo(c)); });
  const items = [];
  todos.forEach(c => {
    const a = prev[c] || 0, b = nuevo[c] || 0;
    if (a === b) { if (a > 0 && modelos.has(modelo(c))) items.push({ code: c, antes: a, ahora: b, e: "" }); return; }
    items.push({ code: c, antes: a, ahora: b, e: !(c in prev) ? "n" : !(c in nuevo) ? "q" : "" });
  });
  return items;
}
function bodegaGrupos(items, cat, filtro) {
  const por = {};
  items.filter(filtro || (() => true)).forEach(it => {
    const e = cat[it.code] || { modelo: "Código nuevo", color: "", capacidad: "" };
    (por[e.modelo] = por[e.modelo] || []).push({ ...it, color: e.color || "", cap: e.capacidad || "" });
  });
  return Object.keys(por).map(m => {
    const filas = por[m].sort((a, b) => bodegaCapNum(a.cap) - bodegaCapNum(b.cap) || a.color.localeCompare(b.color));
    const antes = filas.reduce((s, f) => s + f.antes, 0), ahora = filas.reduce((s, f) => s + f.ahora, 0);
    return { modelo: m, filas, antes, ahora, dif: ahora - antes };
  }).sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif) || bodegaOrdenModelo(a.modelo) - bodegaOrdenModelo(b.modelo) || a.modelo.localeCompare(b.modelo));
}
function bodegaRegistrar(estado, prev, nuevo, cat, origen, fecha) {
  const items = bodegaItems(prev, nuevo, cat);
  const hist = (estado.historial || []).slice();
  if (items.some(i => i.antes !== i.ahora)) hist.unshift({ ts: Date.now(), fecha: fecha || "", origen, items });
  return hist.slice(0, 100);
}
function bodegaResumen(items) {
  const r = { cambios: 0, nuevos: 0, quitados: 0, antes: 0, ahora: 0 };
  items.forEach(i => {
    if (i.antes === i.ahora) return;
    r.cambios++; if (i.e === "n") r.nuevos++; if (i.e === "q") r.quitados++;
    r.antes += i.antes; r.ahora += i.ahora;
  });
  return r;
}
function bodegaFechaHora(ts) {
  const d = new Date(ts), hoy = new Date();
  const ini = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dd = Math.round((ini(hoy) - ini(d)) / 864e5);
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0"), ap = h >= 12 ? "p.m." : "a.m."; h = h % 12 || 12;
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const dia = dd === 0 ? "Hoy" : dd === 1 ? "Ayer" : `${d.getDate()} ${meses[d.getMonth()]}${d.getFullYear() !== hoy.getFullYear() ? " " + d.getFullYear() : ""}`;
  return `${dia}, ${h}:${m} ${ap}`;
}

/* ---------- Piezas HTML (mismos renglones en todas las pantallas) ---------- */
function bodegaPill(n) {
  n = +n || 0;
  if (n <= 0) return `<span class="bx-q zero">0</span>`;
  if (n <= 3) return `<span class="bx-q low">${n}<small>POCAS</small></span>`;
  return `<span class="bx-q ok">${n}</span>`;
}
function bodegaFilaHtml(f) {
  const dif = f.ahora - f.antes;
  const cambio = f.e === "n" ? `<span class="bx-tag nuevo">Nuevo</span>`
    : f.e === "q" ? `<span class="bx-tag quit">Quitado</span>`
    : !dif ? `<span class="bx-sin">Sin cambio</span>`
    : `<b class="bx-dif ${dif > 0 ? "up" : "down"}">${dif > 0 ? "+" : "−"}${Math.abs(dif)}</b>`;
  const cap = bodegaCapTxt(f.cap);
  return `<div class="bx-r">
    <div class="bx-c1"><i class="bx-dot" style="background:${bodegaColor(f.color)}"></i><span>${bodegaEsc(f.color || "UPC " + f.code)}</span></div>
    <div class="bx-cp">${cap ? `<span>${bodegaEsc(cap)}</span>` : ""}</div>
    <div class="bx-n">${bodegaPill(f.antes)}</div>
    <div class="bx-n">${bodegaPill(f.ahora)}</div>
    <div class="bx-c5">${cambio}</div></div>`;
}
function bodegaGrupoHtml(g) {
  const d = g.dif;
  return `<div class="bx-g">
    <div class="bx-gh"><strong>${bodegaEsc(g.modelo)}</strong>
      <div class="bx-gs">
        <div class="bx-gb"><small>Antes</small>${bodegaPill(g.antes)}</div>
        <span class="bx-ar">${BX_ICON.arrow}</span>
        <div class="bx-gb"><small>Ahora</small>${bodegaPill(g.ahora)}</div>
        <div class="bx-gd ${d > 0 ? "up" : d < 0 ? "down" : ""}">${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)}<small>pieza${Math.abs(d) === 1 ? "" : "s"}</small></div>
      </div></div>
    <div class="bx-th"><span>Color</span><span>Cap.</span><span>Antes</span><span>Ahora</span><span>Cambio</span></div>
    ${g.filas.map(bodegaFilaHtml).join("")}</div>`;
}
/* Todo lo que cambió, lo que se agregó y lo que se quitó */
function bodegaDetalleHtml(items, cat) {
  const sec = (titulo, cls, filtro) => {
    const g = bodegaGrupos(items, cat, filtro);
    return g.length ? `<div class="bx-sec ${cls}"><h4>${titulo}</h4><span>${items.filter(filtro).length}</span></div>${g.map(bodegaGrupoHtml).join("")}` : "";
  };
  return sec("Cambiaron", "", it => !it.e && it.antes !== it.ahora)
    + sec("Agregados", "add", it => it.e === "n")
    + sec("Quitados", "del", it => it.e === "q")
    || `<div class="bx-vacio">Sin cambios.</div>`;
}

/* ---------- Estilos ---------- */
function bodegaEstilos() {
  if (document.getElementById("bodEstilos")) return;
  const st = document.createElement("style"); st.id = "bodEstilos";
  st.textContent = `
  .bx,.ex-wrap{ --bx-card:#fff; --bx-fill:#e8e8ed; --bx-line:rgba(120,120,128,.2); --bx-green:#1f9d46; --bx-orange:#c77700; --bx-cap:#0a6fd8; --bx-red:#e0342b; }
  html[data-mode="dark"] .bx, html[data-mode="dark"] .ex-wrap{ --bx-card:#1c1c1e; --bx-fill:#2c2c2e; --bx-line:rgba(255,255,255,.12); --bx-green:#30d158; --bx-orange:#ffb340; --bx-cap:#64b5ff; --bx-red:#ff6259; }
  .bx{ padding-bottom:40px; }
  .bx svg{ fill:none; stroke:currentColor; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
  .bx-card{ display:block; width:100%; text-align:left; border:0; color:var(--text); font:inherit; background:var(--bx-card); border-radius:20px; padding:18px 14px; margin:12px 0; }
  .bx-card h3{ margin:0 0 4px; font-size:24px; letter-spacing:-.02em; padding:0 4px; }
  .bx-sub{ margin:0 0 14px; padding:0 4px; font-size:15px; line-height:1.4; color:var(--text-secondary); }
  .bx-btn{ display:flex; align-items:center; gap:14px; width:100%; margin-top:10px; padding:17px 18px; border:0; border-radius:14px; font:inherit; font-size:18px; font-weight:600; text-align:left; cursor:pointer; background:var(--bx-fill); color:var(--text); }
  .bx-btn svg{ width:28px; height:28px; flex:0 0 28px; }
  .bx-btn.pri{ background:var(--accent); color:#fff; }
  .bx-btn.ok{ background:#34c759; color:#fff; justify-content:center; }
  .bx-btn.ghost{ position:relative; background:transparent; border:1.5px solid var(--accent); color:var(--accent); justify-content:center; padding:14px 40px; margin-top:12px; font-size:17px; }
  .bx-btn.ghost svg{ position:absolute; right:14px; width:20px; height:20px; flex:none; }
  .bx-btn.mid{ justify-content:center; }
  .bx-btn[disabled]{ opacity:.45; }
  .bx-g{ border:1px solid var(--bx-line); border-radius:16px; overflow:hidden; margin:10px 0; background:transparent; }
  .bx-gh{ padding:14px 14px 12px; }
  .bx-gh strong{ display:block; font-size:19px; letter-spacing:-.01em; margin-bottom:10px; }
  .bx-gs{ display:flex; align-items:flex-end; gap:10px; }
  .bx-gb{ display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
  .bx-gb small{ font-size:13px; color:var(--text-secondary); }
  .bx-gb .bx-q{ min-width:70px; height:50px; font-size:30px; border-radius:12px; }
  .bx-gb .bx-q small{ font-size:9px; color:inherit; }
  .bx-ar{ width:30px; height:30px; margin-bottom:10px; color:var(--text-secondary); }
  .bx-gd{ margin-left:auto; text-align:center; font-weight:800; font-size:30px; line-height:1; color:var(--text-secondary); }
  .bx-gd.up{ color:var(--bx-green); } .bx-gd.down{ color:var(--bx-red); }
  .bx-gd small{ display:block; font-size:14px; font-weight:500; margin-top:4px; color:var(--text-secondary); }
  .bx-th,.bx-r{ display:grid; grid-template-columns:minmax(0,1fr) 54px 44px 44px 52px; align-items:center; column-gap:3px; padding:0 8px; }
  .bx-th{ height:34px; font-size:12.5px; color:var(--text-secondary); border-top:1px solid var(--bx-line); }
  .bx-th span:nth-child(n+2){ text-align:center; }
  .bx-r{ height:58px; border-top:1px solid var(--bx-line); }
  .bx-c1{ display:flex; align-items:center; gap:7px; min-width:0; font-size:13.5px; font-weight:500; line-height:1.15; }
  .bx-c1 span{ min-width:0; overflow-wrap:break-word; word-break:normal; }
  .bx-dot{ width:22px; height:22px; border-radius:50%; flex:0 0 22px; border:1px solid rgba(120,120,128,.35); box-shadow:inset 0 -4px 6px rgba(0,0,0,.14), inset 0 2px 4px rgba(255,255,255,.3); }
  .bx-cp,.bx-n,.bx-c5{ display:flex; justify-content:center; align-items:center; }
  .bx-cp span{ font-size:11px; font-weight:700; padding:3px 5px; border-radius:7px; background:rgba(10,132,255,.14); color:var(--bx-cap); white-space:nowrap; }
  .bx-q{ display:inline-flex; flex-direction:column; align-items:center; justify-content:center; min-width:40px; height:42px; padding:0 6px; border-radius:10px; font-weight:800; font-size:18px; line-height:1; }
  .bx-q small{ font-size:8px; font-weight:700; letter-spacing:.03em; margin-top:2px; }
  .bx-q.ok{ background:rgba(52,199,89,.17); color:var(--bx-green); }
  .bx-q.low{ background:rgba(255,159,10,.2); color:var(--bx-orange); }
  .bx-q.zero{ background:var(--bx-fill); color:var(--text-secondary); }
  .bx-dif{ font-size:19px; font-weight:800; } .bx-dif.up{ color:var(--bx-green); } .bx-dif.down{ color:var(--bx-red); }
  .bx-sin{ font-size:12px; line-height:1.15; text-align:center; color:var(--text-secondary); }
  .bx-tag{ font-size:10.5px; font-weight:800; padding:4px 7px; border-radius:7px; letter-spacing:.02em; }
  .bx-tag.nuevo{ background:rgba(52,199,89,.17); color:var(--bx-green); } .bx-tag.quit{ background:rgba(255,69,58,.16); color:var(--bx-red); }
  .bx-sec{ display:flex; align-items:center; justify-content:space-between; margin:20px 4px 2px; }
  .bx-sec h4{ margin:0; font-size:15px; text-transform:uppercase; letter-spacing:.06em; color:var(--text-secondary); }
  .bx-sec span{ font-size:13px; font-weight:700; padding:2px 10px; border-radius:999px; background:var(--bx-fill); }
  .bx-sec.add h4{ color:var(--bx-green); } .bx-sec.del h4{ color:var(--bx-red); }
  .bx-vacio{ text-align:center; padding:26px 12px; color:var(--text-secondary); }
  .bx-inner{ display:block; width:100%; text-align:left; font:inherit; color:var(--text); background:transparent; border:1px solid var(--bx-line); border-radius:16px; padding:14px; margin-top:6px; }
  .bx-inner-h{ display:flex; align-items:center; gap:12px; font-size:17px; font-weight:600; }
  .bx-inner-h svg{ width:30px; height:30px; flex:0 0 30px; color:var(--bx-red); }
  .bx-inner-h > span{ flex:1; min-width:0; }
  .bx-inner-h .bx-ch{ width:20px; height:20px; flex:0 0 20px; color:var(--text-secondary); }
  .bx-inner p{ margin:10px 0 0; font-size:14.5px; line-height:1.4; color:var(--text-secondary); }
  .bx-badge{ font-size:14px; font-weight:700; padding:6px 12px; border-radius:10px; background:rgba(255,69,58,.18); color:var(--bx-red); white-space:nowrap; flex:0 0 auto; }
  .bx-badge.ap{ background:rgba(10,132,255,.16); color:var(--bx-cap); }
  .bx-hist{ display:flex; align-items:center; gap:16px; padding:20px 18px; font-size:20px; font-weight:600; }
  .bx-hist svg{ width:40px; height:40px; flex:0 0 40px; color:var(--accent); }
  .bx-hist span{ flex:1; }
  .bx-hist .bx-ch{ width:22px; height:22px; flex:0 0 22px; color:var(--text-secondary); }
  .bx-fecha{ margin:-2px 4px 10px; font-size:16px; color:var(--text-secondary); }
  .bx-prev{ margin:14px -6px 0; }
  .bx-prev h3{ margin:0 0 2px; font-size:19px; }
  .bx-search{ position:relative; margin:4px 0 10px; }
  .bx-search svg{ position:absolute; left:13px; top:50%; width:19px; height:19px; margin-top:-9.5px; color:var(--text-secondary); }
  .bx-search input{ width:100%; padding:13px 14px 13px 42px; border-radius:14px; border:0; font-size:16px; background:var(--bx-fill); color:var(--text); }
  .bx-chips{ display:flex; gap:8px; overflow-x:auto; padding:2px 2px 12px; scrollbar-width:none; }
  .bx-chips::-webkit-scrollbar{ display:none; }
  .bx-chip{ flex:0 0 auto; border:0; border-radius:999px; padding:9px 16px; font:inherit; font-size:15px; font-weight:600; background:var(--bx-fill); color:var(--text); }
  .bx-chip.on{ background:var(--accent); color:#fff; }
  .bx-m{ background:var(--bx-card); border-radius:18px; margin:10px 0; overflow:hidden; }
  .bx-mh{ padding:14px 16px 8px; font-size:18px; font-weight:700; letter-spacing:-.01em; }
  .bx-mr{ display:flex; align-items:center; gap:12px; padding:10px 14px; min-height:62px; border-top:1px solid var(--bx-line); cursor:pointer; }
  .bx-mr .bx-dot{ width:28px; height:28px; flex-basis:28px; }
  .bx-mi{ flex:1; min-width:0; }
  .bx-mi b{ font-size:15.5px; font-weight:600; margin-right:6px; }
  .bx-mi .cap{ display:inline-block; white-space:nowrap; font-size:11.5px; font-weight:700; padding:2px 7px; border-radius:7px; background:rgba(10,132,255,.14); color:var(--bx-cap); }
  .bx-mi small{ display:block; margin-top:3px; font:12px ui-monospace,Menlo,monospace; color:var(--text-secondary); }
  .bx-mr.chg{ background:rgba(10,132,255,.08); }
  .bx-mr .bx-ch{ width:18px; height:18px; color:var(--text-secondary); flex:0 0 18px; }
  .bx-step{ display:flex; align-items:center; gap:6px; }
  .bx-step button{ width:34px; height:36px; border:0; border-radius:10px; font-size:22px; line-height:1; font-weight:600; background:var(--bx-fill); color:var(--text); }
  .bx-step input{ width:56px; height:36px; text-align:center; font-size:18px; font-weight:700; border:1px solid transparent; border-radius:10px; background:transparent; color:var(--text); -moz-appearance:textfield; }
  .bx-step input::-webkit-outer-spin-button,.bx-step input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
  .bx-mr.chg .bx-step input{ border-color:var(--accent); }
  .bx-bar{ position:sticky; bottom:calc(10px + var(--safe-bottom)); margin-top:14px; z-index:5; }
  .bx-bar .bx-btn[disabled]{ opacity:1; background:var(--bx-fill); color:var(--text-secondary); }
  .bx-bar .bx-btn{ margin:0; justify-content:center; box-shadow:0 8px 22px rgba(0,0,0,.28); }
  .bx-nvr{ display:flex; align-items:center; gap:10px; padding:11px 14px; min-height:62px; border-top:1px solid var(--bx-line); }
  .bx-nvi{ flex:1; min-width:0; } .bx-nvi b{ display:block; font-size:15px; } .bx-nvi span{ font-size:13px; color:var(--text-secondary); } .bx-nvi small{ display:block; font-size:12.5px; margin-top:2px; color:var(--text-secondary); font-style:italic; }
  .bx-tipo{ font-size:11px; font-weight:800; padding:4px 8px; border-radius:8px; color:var(--t); background:color-mix(in srgb,var(--t) 16%, transparent); white-space:nowrap; }
  .bx-nvq{ font-size:17px; min-width:30px; text-align:right; }
  .bx-x{ border:0; background:none; padding:6px; color:var(--text-secondary); } .bx-x svg{ width:22px; height:22px; }
  .bx-sheet-bg{ position:fixed; inset:0; z-index:60; background:rgba(0,0,0,.5); display:flex; align-items:flex-end; justify-content:center; }
  .bx-sheet{ width:100%; max-width:560px; background:var(--bx-card); color:var(--text); border-radius:22px 22px 0 0; padding:20px 18px calc(20px + var(--safe-bottom)); }
  .bx-sheet h3{ margin:0; font-size:19px; } .bx-sheet p{ margin:4px 0 14px; font-size:14px; color:var(--text-secondary); }
  .bx-seg{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
  .bx-seg button{ padding:13px 8px; border-radius:12px; border:2px solid transparent; font:inherit; font-size:15.5px; font-weight:700; background:var(--bx-fill); color:var(--text); }
  .bx-seg button.on{ border-color:var(--t); color:var(--t); background:color-mix(in srgb,var(--t) 14%, transparent); }
  .bx-qty{ display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:14px; }
  .bx-qty button{ width:48px; height:48px; border:0; border-radius:14px; font-size:26px; background:var(--bx-fill); color:var(--text); }
  .bx-qty b{ font-size:30px; min-width:50px; text-align:center; }
  .bx-nota{ width:100%; padding:13px 14px; border-radius:12px; border:0; font-size:16px; background:var(--bx-fill); color:var(--text); margin-bottom:6px; }
  .bx-ch{ display:inline-flex; } .bx-ch svg{ width:100%; height:100%; color:inherit; }
  .bx-hr{ display:flex; align-items:center; gap:12px; text-align:left; }
  .bx-hr .t{ flex:1; min-width:0; } .bx-hr b{ display:block; font-size:17px; } .bx-hr small{ font-size:13.5px; color:var(--text-secondary); }
  .bx-or{ font-size:11px; font-weight:800; padding:3px 8px; border-radius:7px; background:var(--bx-fill); color:var(--text-secondary); text-transform:uppercase; letter-spacing:.04em; }
  .bod-card{ background:#fff; border-radius:16px; padding:16px; margin:12px 0; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  html[data-mode="dark"] .bod-card{ background:#1c1c1e; }
  .bod-txt{ width:100%; box-sizing:border-box; min-height:130px; border-radius:12px; border:1px solid rgba(120,120,128,.35); padding:10px; font:14px ui-monospace,Menlo,monospace; background:transparent; color:var(--text); }
  .bod-small{ display:flex; gap:16px; justify-content:center; margin:18px 0; flex-wrap:wrap; }
  .bod-small button{ background:none; border:0; color:var(--accent); font-size:14.5px; padding:6px; }
  .bod-small button.rojo{ color:#ff3b30; }
  .bod-textobox p{ font-size:14.5px; color:var(--text-secondary); line-height:1.4; margin:10px 4px; }`;
  document.head.appendChild(st);
}

/* ---------- Lista de todos los equipos (búsqueda + secciones) para capturar / registrar ---------- */
function bodegaPicker(cfg) {
  const cat = cfg.cat, secs = (typeof EX_SECCIONES !== "undefined") ? EX_SECCIONES : [{ id: "iPhone", label: "iPhone" }];
  const items = Object.keys(cat).map(k => ({ code: k, ...cat[k] }));
  const tiene = id => items.some(i => i.seccion === id);
  const ops = secs.filter(s => s.id !== "Otros" || tiene("Otros"));
  const prim = ops.find(s => tiene(s.id));
  let sec = prim ? prim.id : "iPhone", texto = "";
  const box = document.createElement("div");
  box.innerHTML = `<div class="bx-search">${BX_ICON.search}<input type="search" placeholder="Buscar modelo, color o UPC" autocomplete="off"></div>
    <div class="bx-chips">${ops.map(s => `<button class="bx-chip" data-s="${bodegaEsc(s.id)}">${bodegaEsc(s.label || s.id)}</button>`).join("")}</div>
    <div class="bx-plist"></div>`;
  const lista = box.querySelector(".bx-plist"), chips = box.querySelectorAll(".bx-chip");
  function pinta() {
    chips.forEach(c => c.classList.toggle("on", !texto && c.dataset.s === sec));
    const t = texto.toLowerCase();
    const sel = items.filter(i => t ? (i.modelo + " " + i.color + " " + i.capacidad + " " + i.code).toLowerCase().includes(t) : i.seccion === sec);
    const por = {};
    sel.forEach(i => { (por[i.modelo] = por[i.modelo] || []).push(i); });
    const nombres = Object.keys(por).sort((a, b) => bodegaOrdenModelo(a) - bodegaOrdenModelo(b) || b.localeCompare(a, undefined, { numeric: true }));
    lista.innerHTML = nombres.length ? nombres.map(m => `<div class="bx-m"><div class="bx-mh">${bodegaEsc(m)}</div>${por[m].sort((a, b) => bodegaCapNum(a.capacidad) - bodegaCapNum(b.capacidad) || a.color.localeCompare(b.color)).map(cfg.fila).join("")}</div>`).join("")
      : `<div class="bx-vacio">${texto ? "No encontré nada con esa búsqueda." : "No hay productos en esta sección."}</div>`;
  }
  chips.forEach(c => c.addEventListener("click", () => { sec = c.dataset.s; texto = ""; box.querySelector("input").value = ""; pinta(); }));
  box.querySelector("input").addEventListener("input", e => { texto = e.target.value.trim(); pinta(); });
  box.lista = lista; box.refresh = pinta; pinta();
  return box;
}
function bodegaFilaInfo(i) {
  const cap = bodegaCapTxt(i.capacidad);
  return `<i class="bx-dot" style="background:${bodegaColor(i.color)}"></i><div class="bx-mi"><b>${bodegaEsc(i.color || "Sin color")}</b>${cap ? `<span class="cap">${bodegaEsc(cap)}</span>` : ""}<small>UPC ${bodegaEsc(i.code)}</small></div>`;
}

/* ---------- Pantalla principal de Bodega ---------- */
function buildBodega() {
  bodegaEstilos();
  const wrap = document.createElement("div");
  wrap.className = "bod-wrap bx";
  let estado = bodegaLoad();
  let pendiente = null;
  const cat = () => bodegaCatalogoTodo(estado.stock);

  function pintar() {
    const c = cat(), nv = bodegaNV(), hist = estado.historial || [], ult = hist[0];
    const nvTot = nv.filter(r => r.tipo !== "Apartado").reduce((s, r) => s + (+r.qty || 0), 0);
    const apTot = nv.filter(r => r.tipo === "Apartado").reduce((s, r) => s + (+r.qty || 0), 0);
    const n = Object.keys(estado.stock).length;

    let ultimo;
    if (ult) {
      const g = bodegaGrupos(ult.items, c)[0];
      ultimo = `<h3>Último reporte</h3><p class="bx-fecha">${bodegaFechaHora(ult.ts)}</p>${g ? bodegaGrupoHtml(g) : ""}
        <button class="bx-btn ghost" id="bodVerCambios"><span>Ver todos los cambios</span>${BX_ICON.chev}</button>`;
    } else if (estado.ultimoReporte) {
      ultimo = `<h3>Último reporte</h3><pre style="white-space:pre-wrap;font:inherit;font-size:15px;margin:8px 4px 0">${bodegaEsc(estado.ultimoReporte)}</pre>`;
    } else {
      ultimo = `<h3>Último reporte</h3><p class="bx-sub" style="margin:0">Todavía no hay reportes. Cuando apliques el primero, aquí verás qué cambió.</p>`;
    }

    wrap.innerHTML = `
      <div class="bx-card">
        <h3>Actualizar existencias</h3>
        <p class="bx-sub">${n ? `Sube el reporte de hoy o captura un cambio manual.${estado.fecha ? " Última lista: " + bodegaEsc(estado.fecha) + "." : ""}` : "Sube el reporte de hoy o captura un cambio manual. Todavía no hay existencias guardadas."}</p>
        <label class="bx-btn pri">${BX_ICON.cam}<span>Escanear / subir reporte</span>
          <input type="file" accept="image/*" id="bodFoto" hidden></label>
        <button class="bx-btn" id="bodVerTexto">${BX_ICON.doc}<span>Pegar o escanear texto</span></button>
        <div id="bodTextoBox" class="bod-textobox" hidden>
          <p>Toca el cuadro, mantén presionado y elige <b>“Escanear texto”</b> (icono de cámara) y apunta al papel. Luego toca “Leer texto”.</p>
          <textarea class="bod-txt" id="bodTexto" placeholder="Aquí aparece el texto…"></textarea>
          <button class="bx-btn pri mid" id="bodLeerTexto">Leer texto</button>
        </div>
        <button class="bx-btn" id="bodManual">${BX_ICON.pen}<span>Capturar cantidades manualmente</span></button>
        <div id="bodEstado" class="bod-estado" hidden></div>
        <div id="bodPreview"></div>
      </div>

      <div class="bx-card">${ultimo}</div>

      <div class="bx-card">
        <h3>Equipos no vendibles</h3>
        <button class="bx-inner" id="bodNV">
          <div class="bx-inner-h">${BX_ICON.warn}<span>Registrar DOA / equipo dañado</span>
            ${nvTot ? `<em class="bx-badge" style="font-style:normal">${nvTot} equipo${nvTot === 1 ? "" : "s"}</em>` : ""}${apTot ? `<em class="bx-badge ap" style="font-style:normal">${apTot} apartado${apTot === 1 ? "" : "s"}</em>` : ""}
            <span class="bx-ch" style="flex:0 0 20px;color:var(--text-secondary)">${BX_ICON.chev}</span></div>
          <p>DOA, dañados, equipos aún no vendibles y apartados. Solo los apartados se ven en Existencias, como etiqueta.</p>
        </button>
      </div>

      <button class="bx-card bx-hist" id="bodHist">${BX_ICON.clock}<span>Historial de reportes</span><i class="bx-ch">${BX_ICON.chev}</i></button>

      <div class="bod-small"><button id="bodPrueba">Cargar datos de prueba</button><button id="bodSeed">Cargar lista del 21-10</button><button class="rojo" id="bodBorrar">Borrar todo</button></div>`;

    wrap.querySelector("#bodFoto").addEventListener("change", e => procesar(e.target.files[0]));
    wrap.querySelector("#bodVerTexto").addEventListener("click", () => { const b = wrap.querySelector("#bodTextoBox"); b.hidden = !b.hidden; if (!b.hidden) wrap.querySelector("#bodTexto").focus(); });
    wrap.querySelector("#bodLeerTexto").addEventListener("click", () => {
      const t = wrap.querySelector("#bodTexto").value, est = wrap.querySelector("#bodEstado"), prev = wrap.querySelector("#bodPreview");
      const esc = bodegaLeerTexto(t); est.hidden = false; prev.innerHTML = "";
      if (!esc.leidos) { est.textContent = "No encontré renglones con código y existencia en ese texto."; return; }
      pendiente = { esc, origen: "texto" }; est.textContent = `Leí ${esc.leidos} códigos.`; mostrarReporte(prev, cat());
    });
    wrap.querySelector("#bodManual").addEventListener("click", () => navigate({ screen: "bodegaManual", title: "Capturar cantidades" }));
    wrap.querySelector("#bodNV").addEventListener("click", () => navigate({ screen: "bodegaNoVend", title: "Equipos no vendibles" }));
    wrap.querySelector("#bodHist").addEventListener("click", () => navigate({ screen: "bodegaHist", title: "Historial de reportes" }));
    const vc = wrap.querySelector("#bodVerCambios");
    if (vc) vc.addEventListener("click", () => navigate({ screen: "bodegaDetalle", title: "Cambios del reporte", ts: ult.ts }));

    const poner = (stock, fecha, msg) => {
      if (Object.keys(estado.stock).length && !confirm(msg)) return;
      estado = { stock: { ...stock }, fecha, ultimoReporte: null, historial: estado.historial || [] }; bodegaSave(estado); pintar();
    };
    wrap.querySelector("#bodPrueba").addEventListener("click", () => poner(BODEGA_PRUEBA, "datos de prueba", "Esto reemplaza tus existencias por datos de prueba (con errores a propósito). ¿Seguir?"));
    wrap.querySelector("#bodSeed").addEventListener("click", () => poner(BODEGA_SEED, "21-10-2026", "Esto reemplaza tus existencias por la lista del 21-10-2026. ¿Seguir?"));
    wrap.querySelector("#bodBorrar").addEventListener("click", () => {
      if (!confirm("¿Borrar las existencias, el historial y los registros de equipos no vendibles / apartados de este teléfono?")) return;
      estado = { stock: {}, fecha: "", ultimoReporte: null, historial: [] }; bodegaSave(estado); bodegaNVSave([]); pintar();
    });
  }

  async function procesar(file) {
    if (!file) return;
    const est = wrap.querySelector("#bodEstado"), prev = wrap.querySelector("#bodPreview");
    est.hidden = false; est.textContent = "Preparando…";
    const url = URL.createObjectURL(file);
    prev.innerHTML = `<div class="bod-scan bx-scan"><img src="${url}" alt=""><div class="bod-scan-line" id="bodLinea"></div></div><div class="bod-bar"><i id="bodBarra"></i></div>`;
    const linea = prev.querySelector("#bodLinea"), barra = prev.querySelector("#bodBarra");
    try {
      const esc = await bodegaEscanear(file, t => { est.textContent = t; },
        p => { barra.style.width = Math.round(p * 100) + "%"; linea.style.top = Math.round(p * 100) + "%"; });
      barra.style.width = "100%"; linea.style.display = "none";
      if (!esc.leidos) { est.textContent = "No logré leer renglones de esa foto. Prueba con “Pegar o escanear texto”, que es más tolerante."; return; }
      pendiente = { esc, origen: "foto" };
      est.textContent = `Leí ${esc.leidos} códigos${esc.dudosos.length ? ` · ${esc.dudosos.length} dudoso(s)` : ""}.`;
      mostrarReporte(prev, cat(), true);
    } catch (e) { est.textContent = "Error: " + (e.message || e); }
  }

  /* Vista previa de lo que cambió ANTES de guardar */
  function mostrarReporte(prev, c, conservar) {
    const { esc, origen } = pendiente, fecha = esc.fecha;
    const nuevoStock = bodegaMezclar(estado.stock, esc.stock);
    const hayPrev = Object.keys(estado.stock).length > 0;
    const items = bodegaItems(estado.stock, nuevoStock, c);
    const res = bodegaResumen(items);
    const rep = hayPrev ? bodegaComparar(estado.stock, nuevoStock, c) : null;
    const tot = Object.values(nuevoStock).reduce((a, b) => a + b, 0);
    const texto = rep ? bodegaTextoReporte(rep, fecha) : `Primera captura${fecha ? " · " + fecha : ""}\n${esc.leidos} códigos · ${tot} piezas`;
    let extra = "";
    if (esc.dudosos.length) extra += `<p class="bod-aviso">⚠️ No pude confirmar estos renglones y los dejé fuera: ${esc.dudosos.map(d => `${bodegaEsc(d.raw)} (${d.qty})`).join(", ")}.</p>`;
    if (esc.nuevos.length) extra += `<p class="bod-aviso">🆕 Códigos fuera del catálogo:</p>${esc.nuevos.map(n => `<button class="bx-btn bod-nombrar" data-c="${n}"><span>${n} — Poner nombre</span></button>`).join("")}`;
    const old = prev.querySelector(".bod-reporte"); if (old) old.remove();
    if (!conservar) prev.innerHTML = "";
    prev.insertAdjacentHTML("beforeend", `<div class="bod-reporte bx-prev">
      <h3>Cambios detectados</h3>
      <p class="bx-sub" style="margin-bottom:6px">${fecha ? "Lista del " + bodegaEsc(fecha) + " · " : ""}${esc.leidos} códigos leídos · ${res.cambios ? res.cambios + " con cambio" : "sin cambios"}. Revísalos antes de guardar.</p>
      ${bodegaDetalleHtml(items, c)}${extra}
      <button class="bx-btn ok" id="bodAplicar">✓ Aplicar cambios</button>
      <button class="bx-btn mid" id="bodCopiar">Copiar reporte</button>
      <button class="bx-btn mid" id="bodCancelar">Descartar</button></div>`);
    prev.querySelectorAll(".bod-nombrar").forEach(b => b.addEventListener("click", () => {
      const code = b.dataset.c, n = prompt("Nombre (ej. iPhone 18 Pro Max Naranja 512GB):", "");
      if (!n) return;
      const ex = bodegaExtra(); ex[code] = { modelo: n, color: "", capacidad: "" };
      try { localStorage.setItem(BODEGA_EXTRA_KEY, JSON.stringify(ex)); } catch (e) {}
      mostrarReporte(prev, cat(), true);
    }));
    prev.querySelector("#bodCopiar").addEventListener("click", () => { navigator.clipboard && navigator.clipboard.writeText(texto); });
    prev.querySelector("#bodCancelar").addEventListener("click", () => { pendiente = null; pintar(); });
    prev.querySelector("#bodAplicar").addEventListener("click", () => {
      const hist = bodegaRegistrar(estado, estado.stock, nuevoStock, cat(), origen, fecha);
      estado = { stock: nuevoStock, fecha: fecha || estado.fecha, ultimoReporte: texto, historial: hist };
      bodegaSave(estado); pendiente = null; pintar();
    });
  }

  pintar();
  return wrap;
}

/* ---------- Capturar cantidades manualmente ---------- */
function buildBodegaManual() {
  bodegaEstilos();
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx";
  const estado = bodegaLoad(), stock = estado.stock || {}, cat = bodegaCatalogoTodo(stock);
  const edits = {};
  const val = c => (c in edits ? edits[c] : (stock[c] || 0));

  const picker = bodegaPicker({
    cat,
    fila: i => `<div class="bx-mr ${i.code in edits ? "chg" : ""}" data-c="${i.code}">${bodegaFilaInfo(i)}
      <div class="bx-step"><button data-d="-1" aria-label="Quitar uno">−</button><input type="number" inputmode="numeric" min="0" value="${val(i.code)}" aria-label="Cantidad"><button data-d="1" aria-label="Agregar uno">+</button></div></div>`,
  });
  const head = document.createElement("div");
  head.innerHTML = `<div class="bx-card" style="margin-top:4px"><h3>Cantidades en bodega</h3><p class="bx-sub" style="margin:0">Cambia las piezas de lo que haga falta. Solo se guardan los renglones que modifiques.</p></div>`;
  const bar = document.createElement("div"); bar.className = "bx-bar";
  bar.innerHTML = `<button class="bx-btn pri" id="mRev" disabled>Revisar cambios</button>`;
  const btn = bar.querySelector("button");

  function marca(row, c) {
    row.classList.toggle("chg", c in edits);
    const n = Object.keys(edits).length;
    btn.disabled = !n; btn.textContent = n ? `Revisar cambios (${n})` : "Revisar cambios";
  }
  function poner(c, v, row, input) {
    v = Math.max(0, Math.min(99999, Math.round(+v || 0)));
    if (v === (stock[c] || 0)) delete edits[c]; else edits[c] = v;
    if (input) input.value = v;
    marca(row, c);
  }
  picker.lista.addEventListener("click", e => {
    const b = e.target.closest("button[data-d]"); if (!b) return;
    const row = b.closest(".bx-mr"), inp = row.querySelector("input");
    poner(row.dataset.c, val(row.dataset.c) + (+b.dataset.d), row, inp);
  });
  picker.lista.addEventListener("change", e => {
    const inp = e.target.closest("input"); if (!inp) return;
    const row = inp.closest(".bx-mr"); poner(row.dataset.c, inp.value, row, inp);
  });
  picker.lista.addEventListener("focusin", e => { if (e.target.matches("input")) e.target.select(); });

  const lista = document.createElement("div");
  function vistaLista() { lista.innerHTML = ""; lista.append(head, picker, bar); picker.refresh(); }

  function vistaRevision() {
    const nuevo = { ...stock };
    Object.keys(edits).forEach(c => { if (edits[c] > 0) nuevo[c] = edits[c]; else delete nuevo[c]; });
    const items = bodegaItems(stock, nuevo, cat), res = bodegaResumen(items);
    lista.innerHTML = `<div class="bx-card" style="margin-top:4px"><h3>Cambios detectados</h3><p class="bx-sub" style="margin:0">${res.cambios} renglón${res.cambios === 1 ? "" : "es"} con cambio. Revísalos antes de guardar.</p></div>
      ${bodegaDetalleHtml(items, cat)}
      <button class="bx-btn ok" id="mOk" style="margin-top:16px">✓ Aplicar cambios</button>
      <button class="bx-btn mid" id="mVolver">Seguir editando</button>`;
    lista.querySelector("#mVolver").addEventListener("click", vistaLista);
    lista.querySelector("#mOk").addEventListener("click", () => {
      const texto = bodegaTextoReporte(bodegaComparar(stock, nuevo, cat), "captura manual");
      bodegaSave({ stock: nuevo, fecha: estado.fecha, ultimoReporte: texto, historial: bodegaRegistrar(estado, stock, nuevo, cat, "manual", estado.fecha) });
      goBack();
    });
    lista.scrollIntoView({ block: "start" });
  }
  btn.addEventListener("click", vistaRevision);
  wrap.appendChild(lista); vistaLista();
  return wrap;
}

/* ---------- Equipos no vendibles / apartados ---------- */
function buildBodegaNoVend() {
  bodegaEstilos();
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx";
  const estado = bodegaLoad(), stock = estado.stock || {}, cat = bodegaCatalogoTodo(stock);
  const libre = c => Math.max(0, (stock[c] || 0) - bodegaNV().filter(r => r.code === c).reduce((s, r) => s + (+r.qty || 0), 0));
  const tipoColor = t => (BODEGA_TIPOS.find(x => x.id === t) || BODEGA_TIPOS[0]).color;

  const intro = document.createElement("div"); intro.className = "bx-card"; intro.style.marginTop = "4px";
  intro.innerHTML = `<h3>Equipos no vendibles</h3><p class="bx-sub" style="margin:0"><b>DOA, dañado y no vendible</b> no se ven en Existencias y no se restan del conteo físico. Un <b>apartado</b> sí aparece en Existencias como una etiqueta bajo el equipo.</p>`;
  const reg = document.createElement("div");

  function pintaReg() {
    const nv = bodegaNV();
    if (!nv.length) { reg.innerHTML = ""; return; }
    reg.innerHTML = `<div class="bx-m"><div class="bx-mh">Registrados</div>${nv.map(r => {
      const e = cat[r.code] || { modelo: "Código nuevo", color: "", capacidad: "" };
      return `<div class="bx-nvr"><i class="bx-dot" style="background:${bodegaColor(e.color)}"></i>
        <div class="bx-nvi"><b>${bodegaEsc(e.modelo)}</b><span>${bodegaEsc([e.color, bodegaCapTxt(e.capacidad)].filter(Boolean).join(" · ") || "UPC " + r.code)}</span>${r.nota ? `<small>${bodegaEsc(r.nota)}</small>` : ""}</div>
        <span class="bx-tipo" style="--t:${tipoColor(r.tipo)}">${bodegaEsc(r.tipo)}</span><b class="bx-nvq">×${r.qty}</b>
        <button class="bx-x" data-id="${r.id}" aria-label="Quitar registro">${BX_ICON.trash}</button></div>`;
    }).join("")}</div>`;
  }
  reg.addEventListener("click", e => {
    const b = e.target.closest(".bx-x"); if (!b) return;
    if (!confirm("¿Quitar este registro? El equipo vuelve a contar como normal.")) return;
    bodegaNVSave(bodegaNV().filter(r => r.id !== b.dataset.id)); pintaReg();
  });

  function hoja(code) {
    const e = cat[code], max = libre(code);
    if (max <= 0) { alert(`No hay piezas libres de ese equipo en bodega (existencia: ${stock[code] || 0}). Primero actualiza las existencias.`); return; }
    let tipo = "DOA", qty = 1;
    const bg = document.createElement("div"); bg.className = "bx-sheet-bg";
    bg.innerHTML = `<div class="bx-sheet"><h3>${bodegaEsc(e.modelo)}</h3><p>${bodegaEsc([e.color, bodegaCapTxt(e.capacidad)].filter(Boolean).join(" · "))} · libres en bodega: ${max}</p>
      <div class="bx-seg">${BODEGA_TIPOS.map(t => `<button data-t="${t.id}" style="--t:${t.color}">${t.id}</button>`).join("")}</div>
      <div class="bx-qty"><button data-q="-1">−</button><b>1</b><button data-q="1">+</button></div>
      <input class="bx-nota" placeholder="Nota (opcional): cliente, folio, motivo…" maxlength="80">
      <button class="bx-btn pri mid" data-ok>Guardar</button><button class="bx-btn mid" data-no>Cancelar</button></div>`;
    const pinta = () => { bg.querySelectorAll(".bx-seg button").forEach(b => b.classList.toggle("on", b.dataset.t === tipo)); bg.querySelector(".bx-qty b").textContent = qty; };
    bg.addEventListener("click", ev => {
      if (ev.target === bg || ev.target.closest("[data-no]")) { bg.remove(); return; }
      const t = ev.target.closest("[data-t]"); if (t) { tipo = t.dataset.t; pinta(); return; }
      const q = ev.target.closest("[data-q]"); if (q) { qty = Math.max(1, Math.min(max, qty + (+q.dataset.q))); pinta(); return; }
      if (ev.target.closest("[data-ok]")) {
        const a = bodegaNV();
        a.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), code, tipo, qty, nota: bg.querySelector(".bx-nota").value.trim(), ts: Date.now() });
        bodegaNVSave(a); bg.remove(); pintaReg();
      }
    });
    pinta(); document.body.appendChild(bg);
  }

  const picker = bodegaPicker({
    cat,
    fila: i => `<div class="bx-mr" data-c="${i.code}">${bodegaFilaInfo(i)}${bodegaPill(stock[i.code] || 0)}<span class="bx-ch">${BX_ICON.chev}</span></div>`,
  });
  picker.lista.addEventListener("click", e => { const r = e.target.closest(".bx-mr"); if (r) hoja(r.dataset.c); });
  const sub = document.createElement("p"); sub.className = "bx-sub"; sub.style.margin = "16px 4px 8px";
  sub.innerHTML = "<b>Toca un equipo</b> para marcarlo como DOA, dañado, no vendible o apartado.";
  wrap.append(intro, reg, sub, picker);
  pintaReg();
  return wrap;
}

/* ---------- Historial y detalle de reportes ---------- */
function buildBodegaHist() {
  bodegaEstilos();
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx";
  const estado = bodegaLoad(), hist = estado.historial || [], cat = bodegaCatalogoTodo(estado.stock);
  const ORIGEN = { foto: "Foto", texto: "Texto", manual: "Manual" };
  wrap.innerHTML = `<div class="bx-card" style="margin-top:4px"><h3>Historial de reportes</h3><p class="bx-sub" style="margin:0">${hist.length ? "Todo lo que fue subiendo, bajando, agregándose o quitándose. Toca un reporte para ver el detalle." : "Todavía no hay reportes. Aparecerán aquí cuando apliques cambios."}</p></div>`;
  hist.forEach(h => {
    const r = bodegaResumen(h.items), d = r.ahora - r.antes;
    const b = document.createElement("button"); b.className = "bx-card bx-hr";
    b.innerHTML = `<div class="t"><b>${bodegaFechaHora(h.ts)}</b><small>${r.cambios} cambio${r.cambios === 1 ? "" : "s"}${r.nuevos ? " · " + r.nuevos + " agregado" + (r.nuevos === 1 ? "" : "s") : ""}${r.quitados ? " · " + r.quitados + " quitado" + (r.quitados === 1 ? "" : "s") : ""}${h.fecha ? " · lista " + bodegaEsc(h.fecha) : ""}</small></div>
      <span class="bx-or">${ORIGEN[h.origen] || "Reporte"}</span>
      <b class="bx-dif ${d > 0 ? "up" : d < 0 ? "down" : ""}" style="font-size:20px;min-width:44px;text-align:right">${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)}</b>`;
    b.addEventListener("click", () => navigate({ screen: "bodegaDetalle", title: "Cambios del reporte", ts: h.ts }));
    wrap.appendChild(b);
  });
  return wrap;
}
function buildBodegaDetalle(ts) {
  bodegaEstilos();
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx";
  const estado = bodegaLoad(), h = (estado.historial || []).find(x => x.ts === ts), cat = bodegaCatalogoTodo(estado.stock);
  if (!h) { wrap.innerHTML = `<div class="bx-vacio">No encontré ese reporte.</div>`; return wrap; }
  const r = bodegaResumen(h.items), d = r.ahora - r.antes;
  wrap.innerHTML = `<div class="bx-card" style="margin-top:4px"><h3>${bodegaFechaHora(h.ts)}</h3>
    <p class="bx-sub" style="margin:0">${r.cambios} renglón${r.cambios === 1 ? "" : "es"} con cambio · ${r.antes} → ${r.ahora} piezas (${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)})${h.fecha ? " · lista del " + bodegaEsc(h.fecha) : ""}</p></div>
    ${bodegaDetalleHtml(h.items, cat)}`;
  return wrap;
}

if (typeof module !== "undefined") module.exports = { bodegaFilasDeTexto, bodegaLeerTexto, bodegaResolver, bodegaRenglones, bodegaLeerRenglon, bodegaComparar, bodegaTextoReporte, bodegaUpcOk, bodegaFecha };
