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
/* Catálogo del escáner: iPhone, iPad, Mac, Watch… (todo menos las "Caja AppleCare+") + códigos que tú nombraste */
function bodegaCatalogoEscaneo() {
  const cat = {};
  const esc = (typeof ESCANER_DATA !== "undefined" && ESCANER_DATA) || {};
  Object.keys(esc).forEach(k => { const v = esc[k]; if (v && !/^caja\b/i.test(v.modelo || "")) cat[k] = { modelo: v.modelo || "", color: v.color || "", capacidad: v.capacidad || "" }; });
  const ex = bodegaExtra();
  Object.keys(ex).forEach(k => { cat[k] = ex[k]; });
  return cat;
}
/* Sección de un código (iPhone, iPad, Mac…) según su nombre */
function bodegaSeccionDe(code) {
  const cat = bodegaCatalogoEscaneo(), e = cat[code];
  if (!e) return "Otros";
  return typeof exSeccion === "function" ? exSeccion(e.modelo) : (/^iPhone/i.test(e.modelo || "") ? "iPhone" : "Otros");
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
function bodegaSave(d) {
  let prev = null; try { prev = JSON.parse(localStorage.getItem(BODEGA_KEY)); } catch (e) {}
  try { localStorage.setItem(BODEGA_KEY, JSON.stringify(d)); } catch (e) {}
  try { if (typeof window.ishopSyncPush === "function") window.ishopSyncPush(prev, d); } catch (e) {}   // sync.js: sube el cambio a Firebase
}

/* ---------- UPC-A: dígito verificador ---------- */
function bodegaUpcOk(c) {
  if (!/^\d{12}$/.test(c)) return false;
  const d = c.split("").map(Number);
  const s = (d[0]+d[2]+d[4]+d[6]+d[8]+d[10]) * 3 + (d[1]+d[3]+d[5]+d[7]+d[9]);
  return (10 - (s % 10)) % 10 === d[11];
}

/* Dígitos que el lector suele confundir entre sí (5↔6↔8↔3, 1↔7, 0↔8↔6…) */
const BODEGA_CONF = { "0": "896", "1": "7", "2": "7", "3": "58", "4": "1", "5": "6389", "6": "5809", "7": "12", "8": "0693", "9": "84" };

/* Corrige errores del lector comparando contra el catálogo y el dígito verificador. Devuelve {code, estado} */
/* Los UPC de esta bodega siempre empiezan igual (19594…, 19595…): se toman también los inicios del catálogo */
function bodegaInicios(cat) {
  const s = new Set(["19594", "19595"]);
  Object.keys(cat || {}).forEach(k => { if (/^\d{12}$/.test(k)) s.add(k.slice(0, 5)); });
  return [...s];
}
function bodegaResolver(raw, cat) {
  let r = String(raw || "").replace(/\D/g, "");
  if (cat[r]) return { code: r, estado: "ok" };
  // inicio mal leído (ej. 1939… en vez de 1959…): se prueba con los inicios conocidos y se confirma con el dígito verificador
  if (r.length === 12) {
    const ini = bodegaInicios(cat);
    if (!ini.includes(r.slice(0, 5))) {
      const cands = new Set();
      ini.forEach(pf => { let d = 0; for (let i = 0; i < 5; i++) if (pf[i] !== r[i]) d++; if (d <= 2) { const c = pf + r.slice(5); if (cat[c] || bodegaUpcOk(c)) cands.add(c); } });
      if (cands.size === 1) { const c = [...cands][0]; return { code: c, estado: cat[c] ? "corregido" : "nuevo" }; }
    }
  }
  const keys = Object.keys(cat);
  const hallados = new Set();
  const probar = (c) => { if (cat[c]) hallados.add(c); };
  const valido = r.length === 12 && bodegaUpcOk(r);
  if (r.length === 12) {
    keys.forEach(k => { let d = 0; for (let i = 0; i < 12 && d < 2; i++) if (k[i] !== r[i]) d++; if (d <= 1) hallados.add(k); });
  } else if (r.length === 13) {
    for (let i = 0; i < 13; i++) probar(r.slice(0, i) + r.slice(i + 1));
  } else if (r.length === 11) {
    for (let i = 0; i <= 11; i++) for (let n = 0; n < 10; n++) probar(r.slice(0, i) + n + r.slice(i));
  }
  // un UPC con dígito verificador correcto que no está en el catálogo es un código nuevo (no se "corrige" a otro)
  if (hallados.size === 0 && r.length === 12 && !valido) {
    // con 2 diferencias solo se acepta si ambas son confusiones típicas del lector (si no, se mandaría a un producto que no está en la hoja)
    const conf = (a, b) => (BODEGA_CONF[a] || "").includes(b) || (BODEGA_CONF[b] || "").includes(a);
    keys.forEach(k => { let d = 0, ok = true; for (let i = 0; i < 12 && d < 3; i++) if (k[i] !== r[i]) { d++; if (!conf(k[i], r[i])) ok = false; } if (d <= 2 && ok) hallados.add(k); });
  }
  if (hallados.size === 1) return { code: [...hallados][0], estado: "corregido" };
  if (valido) return { code: r, estado: "nuevo" };
  if (hallados.size > 1) return { code: r, estado: "ambiguo" };
  // código nuevo con un dígito mal leído: se prueban solo las confusiones típicas y debe salir un único UPC válido
  const cand = new Set();
  if (r.length === 12) { for (let i = 0; i < 12; i++) for (const d of (BODEGA_CONF[r[i]] || "")) { const c = r.slice(0, i) + d + r.slice(i + 1); if (bodegaUpcOk(c)) cand.add(c); } }
  else if (r.length === 13) { for (let i = 0; i < 13; i++) { const c = r.slice(0, i) + r.slice(i + 1); if (bodegaUpcOk(c)) cand.add(c); } }
  if (cand.size === 1) return { code: [...cand][0], estado: "nuevo" };
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

/* Lista de {raw,qty} → existencias. Marca para revisar las cantidades poco seguras y los códigos repetidos */
function bodegaConstruir(filas, cat) {
  const stock = {}, dudosos = [], nuevos = [], info = {};
  let ignorados = 0;
  filas.forEach((r, i) => {
    const idx = r.idx || i + 1;
    if (/^20\d{11}$/.test(String(r.raw || "").replace(/\D/g, ""))) { ignorados++; return; }   // devoluciones / códigos 2021… con cantidad negativa
    const res = bodegaResolver(r.raw, cat);
    if (res.estado === "ilegible" || res.estado === "ambiguo") { dudosos.push({ raw: r.raw, qty: r.qty, mini: r.mini || null, idx }); return; }
    if (res.estado === "nuevo" && !nuevos.includes(res.code)) nuevos.push(res.code);
    const repetido = res.code in stock;
    stock[res.code] = (stock[res.code] || 0) + r.qty;
    const dudCod = res.estado === "corregido" || res.estado === "nuevo";
    if (r.dudoso || repetido) info[res.code] = { code: res.code, qty: stock[res.code], alt: r.alt == null ? null : r.alt, repetido, raw: r.raw, leido: res.estado === "corregido" ? r.raw : "", idx, mini: r.mini || (info[res.code] && info[res.code].mini) || null };
  });
  return { stock, dudosos, nuevos, leidos: Object.keys(stock).length, revisar: Object.values(info), total: filas.length, ignorados };
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
  const r = bodegaConstruir(bodegaFilasDeTexto(texto), bodegaCatalogoEscaneo());
  const m = String(texto).match(/(\d{2})[-/](\d{2})[-/](20\d{2})/);
  r.fecha = m ? `${m[1]}-${m[2]}-${m[3]}` : "";
  return r;
}

/* ---------- Imagen: base en gris (si es pantalla oscura se invierte) ---------- */
function bodegaCargarImagen(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => rej(new Error("No pude abrir la foto"));
    img.src = url;
  });
}
/* Si el papel es claro y hay franjas casi negras en las orillas, las recorta. Devuelve null si no hay nada que quitar */
function bodegaQuitarBordes(ctx, w, h) {
  const px = ctx.getImageData(0, 0, w, h).data, col = new Float64Array(w), fil = new Float64Array(h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y*w+x)*4, v = px[i]*0.299 + px[i+1]*0.587 + px[i+2]*0.114; col[x] += v; fil[y] += v; }
  for (let x = 0; x < w; x++) col[x] /= h; for (let y = 0; y < h; y++) fil[y] /= w;
  const N = 40; let x0 = 0, x1 = w, y0 = 0, y1 = h;
  while (x0 < w && col[x0] < N) x0++; while (x1 > x0 && col[x1-1] < N) x1--;
  while (y0 < h && fil[y0] < N) y0++; while (y1 > y0 && fil[y1-1] < N) y1--;
  const cw = x1 - x0, ch = y1 - y0;
  if (cw < w * 0.3 || ch < h * 0.3 || (x0 === 0 && x1 === w && y0 === 0 && y1 === h)) return null;
  let suma = 0, n = 0; for (let x = x0; x < x1; x++) { suma += col[x]; n++; }
  if (suma / n < 110) return null;   // el resto también es oscuro: es una pantalla, no se recorta
  const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  const c2 = cv.getContext("2d", { willReadFrequently: true });
  c2.drawImage(ctx.canvas, x0, y0, cw, ch, 0, 0, cw, ch);
  return { cv, ctx: c2, w: cw, h: ch };
}
function bodegaBase(img) {
  const W0 = img.naturalWidth, H0 = img.naturalHeight;
  const esc = W0 > 1700 ? 1700 / W0 : W0 < 1200 ? Math.min(2, 1200 / W0) : 1;
  let w = Math.round(W0 * esc), h = Math.round(H0 * esc);
  let cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  let ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high"; ctx.drawImage(img, 0, 0, w, h);
  { const r = bodegaQuitarBordes(ctx, w, h);   // franjas negras (capturas / fotos con borde) confunden al lector
    if (r) { cv = r.cv; ctx = r.ctx; w = r.w; h = r.h; } }
  const im = ctx.getImageData(0, 0, w, h), px = im.data, g = new Uint8ClampedArray(w * h);
  let suma = 0;
  for (let i = 0; i < w * h; i++) { const v = px[i*4] * 0.299 + px[i*4+1] * 0.587 + px[i*4+2] * 0.114; g[i] = v; suma += v; }
  const oscura = suma / (w * h) < 128;   // letras claras sobre fondo oscuro (pantalla) → se invierte
  for (let i = 0; i < w * h; i++) { const v = oscura ? 255 - g[i] : g[i]; px[i*4] = px[i*4+1] = px[i*4+2] = v; px[i*4+3] = 255; }
  ctx.putImageData(im, 0, 0);
  return { cv, w, h, oscura };
}
/* Luz despareja: gris / fondo (desenfoque grande) + contraste */
function bodegaNormalizar(base) {
  const { w, h } = base, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(base.cv, 0, 0);
  const im = ctx.getImageData(0, 0, w, h), px = im.data, g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = px[i*4];
  const W = w + 1, S = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) { let fila = 0; for (let x = 0; x < w; x++) { fila += g[y*w+x]; S[(y+1)*W+x+1] = S[y*W+x+1] + fila; } }
  const R = Math.max(12, Math.round(Math.min(w, h) / 40));
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1);
      const bg = (S[y1*W+x1] - S[y0*W+x1] - S[y1*W+x0] + S[y0*W+x0]) / ((x1 - x0) * (y1 - y0));
      let v = (g[y*w+x] / Math.max(bg, 1)) * 255;
      v = Math.max(0, Math.min(255, (v - 110) * 1.9 + 110));
      const o = (y*w+x) * 4; px[o] = px[o+1] = px[o+2] = v;
    }
  }
  ctx.putImageData(im, 0, 0);
  return { cv, w, h };
}

/* Variantes de limpieza para un recorte pequeño (1 = contraste, 2 = blanco/negro, 3 = blanco/negro local) */
function bodegaVariante(im, v) {
  const w = im.width, h = im.height, px = im.data, n = w * h, g = new Float32Array(n);
  for (let i = 0; i < n; i++) g[i] = px[i*4];
  const box = (src, r) => {
    const W = w + 1, S = new Float64Array(W * (h + 1)), out = new Float32Array(n);
    for (let y = 0; y < h; y++) { let f = 0; for (let x = 0; x < w; x++) { f += src[y*w+x]; S[(y+1)*W+x+1] = S[y*W+x+1] + f; } }
    for (let y = 0; y < h; y++) { const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) { const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        out[y*w+x] = (S[y1*W+x1] - S[y0*W+x1] - S[y1*W+x0] + S[y0*W+x0]) / ((x1 - x0) * (y1 - y0)); } }
    return out;
  };
  let out = new Float32Array(n);
  if (v === 1) {
    const hist = new Uint32Array(256); for (let i = 0; i < n; i++) hist[g[i] | 0]++;
    let a = 0, lo = 0, hi = 255; while (lo < 255 && (a += hist[lo]) < n * 0.02) lo++;
    a = 0; while (hi > 0 && (a += hist[hi]) < n * 0.02) hi--;
    const k = 255 / Math.max(1, hi - lo); for (let i = 0; i < n; i++) out[i] = Math.max(0, Math.min(255, (g[i] - lo) * k));
  } else if (v === 2) {
    const b = box(g, 1), hist = new Uint32Array(256); for (let i = 0; i < n; i++) hist[b[i] | 0]++;
    let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
    let sB = 0, wB = 0, mx = -1, th = 128;
    for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = n - wB; if (!wF) break; sB += t * hist[t];
      const mB = sB / wB, mF = (sum - sB) / wF, bt = wB * wF * (mB - mF) * (mB - mF); if (bt > mx) { mx = bt; th = t; } }
    for (let i = 0; i < n; i++) out[i] = b[i] > th ? 255 : 0;
  } else {
    const b = box(g, 1), m = box(b, Math.max(8, Math.round(h / 3)));
    for (let i = 0; i < n; i++) out[i] = b[i] > m[i] - 12 ? 255 : 0;
  }
  for (let i = 0; i < n; i++) { px[i*4] = px[i*4+1] = px[i*4+2] = out[i]; }
}
/* Recorta una zona (x,y,w,h de la base), la agranda a H px de alto y la rodea de margen blanco */
function bodegaRecorte(base, b, H, variante, padx, pady) {
  const px = Math.round(b.h * padx), py = Math.round(b.h * pady);
  const x0 = Math.max(0, Math.floor(b.x - px)), y0 = Math.max(0, Math.floor(b.y - py));
  const x1 = Math.min(base.w, Math.ceil(b.x + b.w + px)), y1 = Math.min(base.h, Math.ceil(b.y + b.h + py));
  const sw = Math.max(1, x1 - x0), sh = Math.max(1, y1 - y0), sc = H / sh;
  const w = Math.max(8, Math.round(sw * sc)), h = Math.round(H), M = 16;
  const cv = document.createElement("canvas"); cv.width = w + 2 * M; cv.height = h + 2 * M;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.imageSmoothingQuality = "high"; ctx.drawImage(base.cv, x0, y0, sw, sh, M, M, w, h);
  if (variante) { const im = ctx.getImageData(0, 0, cv.width, cv.height); bodegaVariante(im, variante); ctx.putImageData(im, 0, 0); }
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
    const opt = { logger: m => { const w = bodegaWorkerP && bodegaWorkerP.__w; if (m.status === "recognizing text" && w && w.__prog) w.__prog(m.progress); } };
    if (window.__tessLocal) { opt.workerPath = "libs/tesseract/worker.min.js"; opt.corePath = "libs/tesseract/"; opt.langPath = "libs/tesseract/lang"; }
    bodegaWorkerP = Tesseract.createWorker("eng", 1, opt).then(async w => { bodegaWorkerP.__w = w; return w; });
    bodegaWorkerP.catch(() => { bodegaWorkerP = null; });
  }
  const w = await bodegaWorkerP;
  w.__prog = onProg;
  return w;
}
function bodegaPalabras(data) {
  return data.words || (data.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => (p.lines || []).flatMap(l => l.words || [])));
}

/* ---------- Palabras → renglones { cod:{x,y,w,h}, qty:{...}|null, raw } ---------- */
const BODEGA_QTY_RE = /^\d{1,5}[.,]\d{1,2}$/;
function bodegaFilasDePalabras(words) {
  const ws = words.filter(w => w.bbox && String(w.text || "").trim())
    .map(w => ({ t: String(w.text).trim(), x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1, cy: (w.bbox.y0 + w.bbox.y1) / 2, h: w.bbox.y1 - w.bbox.y0 }))
    .sort((a, b) => a.cy - b.cy);
  if (!ws.length) return [];
  const hs = ws.map(w => w.h).sort((a, b) => a - b), tol = Math.max(6, hs[Math.floor(hs.length / 2)] * 0.6);
  const rows = [];
  ws.forEach(w => {
    const last = rows[rows.length - 1];
    if (last && Math.abs(w.cy - last.cy) <= tol) { last.w.push(w); last.cy = (last.cy * (last.w.length - 1) + w.cy) / last.w.length; }
    else rows.push({ cy: w.cy, w: [w] });
  });
  const out = [];
  rows.forEach(r => {
    const toks = r.w.sort((a, b) => a.x0 - b.x0), cod = []; let qty = null, digs = 0;
    for (const t of toks) {
      const nd = t.t.replace(/\D/g, "").length;
      if (BODEGA_QTY_RE.test(t.t)) { if (cod.length) { qty = t; break; } continue; }
      if (nd >= 14 && /[.,]/.test(t.t)) {   // código y cantidad pegados en una sola palabra
        const L = t.t.length, xm = t.x0 + (t.x1 - t.x0) * (12 / L);
        cod.push({ ...t, t: t.t.replace(/\D/g, "").slice(0, 12), x1: xm }); digs += 12;
        qty = { ...t, t: t.t.slice(12), x0: xm + 1 }; break;
      }
      if (nd >= 3 && !/[.,]\d/.test(t.t)) { cod.push(t); digs += nd; if (digs > 14) break; }
      else if (cod.length) break;
    }
    if (digs < 9) return;
    const x0 = Math.min(...cod.map(t => t.x0)), x1 = Math.max(...cod.map(t => t.x1)), y0 = Math.min(...cod.map(t => t.y0)), y1 = Math.max(...cod.map(t => t.y1));
    out.push({
      cod: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, raw: cod.map(t => t.t.replace(/\D/g, "")).join("").slice(0, 13),
      qty: qty ? { x: qty.x0, y: qty.y0, w: qty.x1 - qty.x0, h: qty.y1 - qty.y0 } : null,
    });
  });
  return out;
}
/* Une lo que encontró cada intento (mismo renglón = mismo alto) */
function bodegaUnirFilas(listas) {
  const out = [];
  listas.forEach(l => l.forEach(f => {
    const cy = f.cod.y + f.cod.h / 2, ya = out.find(o => Math.abs(o.cod.y + o.cod.h / 2 - cy) < o.cod.h * 0.55);
    if (!ya) out.push(f); else if (!ya.qty && f.qty) ya.qty = f.qty;
  }));
  return out.sort((a, b) => a.cod.y - b.cod.y);
}
const bodegaMediana = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
/* Renglones que el lector se saltó: si hay un hueco de 2× o más entre renglones, se prueba ahí */
function bodegaHuecos(filas) {
  if (filas.length < 4) return [];
  const cy = filas.map(f => f.cod.y + f.cod.h / 2), dif = []; for (let i = 1; i < cy.length; i++) dif.push(cy[i] - cy[i-1]);
  const med = bodegaMediana(dif), extra = [];
  for (let i = 0; i < dif.length; i++) {
    const n = Math.round(dif[i] / med) - 1;
    if (dif[i] / med < 1.6 || n < 1 || n > 6) continue;
    const a = filas[i], b = filas[i+1];
    for (let j = 1; j <= n; j++) {
      const t = j / (n + 1), lerp = (p, q) => p + (q - p) * t;
      extra.push({ cod: { x: lerp(a.cod.x, b.cod.x), y: lerp(a.cod.y, b.cod.y), w: lerp(a.cod.w, b.cod.w), h: lerp(a.cod.h, b.cod.h) }, raw: "", qty: null, sonda: true });
    }
  }
  return extra;
}
/* A los renglones sin cantidad ubicada se les calcula dónde debe estar (como en los demás) */
function bodegaUbicarCantidades(filas) {
  const con = filas.filter(f => f.qty);
  let dx, dy, w;
  if (con.length >= 3) {
    dx = bodegaMediana(con.map(f => f.qty.x - (f.cod.x + f.cod.w))); dy = bodegaMediana(con.map(f => f.qty.y - f.cod.y)); w = bodegaMediana(con.map(f => f.qty.w));
  } else {   // casi no se vieron cantidades: se estima por la forma típica del listado (cantidad a la derecha del código)
    const cw = bodegaMediana(filas.map(f => f.cod.w)); dx = cw * 0.45; dy = 0; w = cw * 0.55;
  }
  filas.forEach(f => { if (!f.qty) { f.qty = { x: f.cod.x + f.cod.w + dx, y: f.cod.y + dy, w, h: f.cod.h }; f.qtyEstimada = true; } });
}

/* ---------- Lectura renglón por renglón (código validado con el catálogo / dígito verificador) ---------- */
async function bodegaLeerCodigo(worker, base, fila, cat) {
  const votos = new Map(); let mejor = "", pMejor = 0, lecturas = 0;
  const voto = (raw, peso) => {
    raw = String(raw || "").replace(/\D/g, "").slice(0, 13); if (raw.length < 9) return;
    const r = bodegaResolver(raw, cat), clave = (r.estado === "ilegible" || r.estado === "ambiguo") ? raw : r.code;
    const p = r.estado === "ok" || r.estado === "corregido" ? 3 : r.estado === "nuevo" ? 2 : 0.5;
    votos.set(clave, (votos.get(clave) || 0) + p * peso);
    if (votos.get(clave) > pMejor) { pMejor = votos.get(clave); mejor = clave; }
  };
  voto(fila.raw, 1);
  for (const v of [0, 1, 2, 3]) {
    const cv = bodegaRecorte(base, fila.cod, 48, v, 0.25, 0.2);
    const { data } = await worker.recognize(cv);
    lecturas++; voto(String(data.text || "").split(/\s+/).join(""), 1);
    if (lecturas >= 2 && pMejor >= 5.5) break;   // dos lecturas buenas coinciden
  }
  return mejor;
}
/* Foto del renglón completo (código + cantidad) para poder revisarlo en grande */
function bodegaMiniFila(base, f) {
  try {
    const q = f.qty, h = Math.max(f.cod.h, q ? q.h : 0);
    const x0 = Math.max(0, f.cod.x - h * 1.2), x1 = Math.min(base.w, (q ? q.x + q.w : f.cod.x + f.cod.w) + h * 1.2);
    const y0 = Math.max(0, Math.min(f.cod.y, q ? q.y : f.cod.y) - h * 0.7), y1 = Math.min(base.h, Math.max(f.cod.y + f.cod.h, q ? q.y + q.h : 0) + h * 0.7);
    const sw = Math.max(10, x1 - x0), sh = Math.max(10, y1 - y0), k = Math.min(3, 900 / sw);
    const cv = document.createElement("canvas"); cv.width = Math.round(sw * k); cv.height = Math.round(sh * k);
    cv.getContext("2d").drawImage(base.cv, x0, y0, sw, sh, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.85);
  } catch (e) { return null; }
}

/* Cantidad: varias lecturas y se queda con la que más se repite */
async function bodegaLeerCantidad(worker, base, fila) {
  const v = new Map(); let total = 0;
  if (!fila.qty) return { qty: null, share: 0, alt: null };
  const suma = (n, p) => { v.set(n, (v.get(n) || 0) + p); total += p; };
  const plan = [[44, 0], [64, 0], [44, 2], [64, 3], [64, 2], [44, 3]];
  for (let i = 0; i < plan.length; i++) {
    const cv = bodegaRecorte(base, fila.qty, plan[i][0], plan[i][1], 0.4, 0.3);
    const { data } = await worker.recognize(cv);
    const t = String(data.text || "").replace(/\s+/g, "");
    let m = t.match(/^(\d{1,4})[.,]\d{2}$/);
    if (m) suma(+m[1], 1);
    else if ((m = t.match(/^(\d{1,4})[.,]\d?$/))) suma(+m[1], 0.5);
    else if ((m = t.match(/^(\d{1,3})00$/))) suma(+m[1], 0.5);   // el punto no se vio: "800" = 8.00
    if (i >= 2 && total >= 3) { const top = Math.max(...v.values()); if (top === total) break; }
  }
  if (!total) return { qty: null, share: 0, alt: null };
  const orden = [...v.entries()].sort((a, b) => b[1] - a[1]);
  return { qty: orden[0][0], share: orden[0][1] / total, alt: orden[1] ? orden[1][0] : null };
}

/* Foto → { stock, fecha, dudosos, nuevos, leidos, revisar } */
/* ---------- Pantalla verde (terminal): lector propio, sin internet ---------- */
function bodegaMiniatura(r, f) {
  try {
    const cc = f.cajaCant, x0 = Math.max(0, Math.min(f.caja.x, cc ? cc.x : f.caja.x) - 14), y0 = Math.max(0, Math.min(f.caja.y, cc ? cc.y : f.caja.y) - 10);
    const x1 = Math.min(r.ancho, (cc ? cc.x + cc.w : f.caja.x + f.caja.w) + 14), y1 = Math.min(r.alto, Math.max(f.caja.y + f.caja.h, cc ? cc.y + cc.h : 0) + 10);
    if (!bodegaMiniatura.full) { const c = document.createElement("canvas"); c.width = r.ancho; c.height = r.alto; c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(r.imagen), r.ancho, r.alto), 0, 0); bodegaMiniatura.full = c; }
    const k = 1.4, cv = document.createElement("canvas"); cv.width = Math.round((x1 - x0) * k); cv.height = Math.round((y1 - y0) * k);
    cv.getContext("2d").drawImage(bodegaMiniatura.full, x0, y0, x1 - x0, y1 - y0, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.8);
  } catch (e) { return null; }
}
function bodegaLeerPantalla(img, cat) {
  if (typeof LectorPantalla === "undefined" || typeof LECTOR_MODELO === "undefined") return null;
  // La foto se prueba a varios tamaños y se queda con la lectura más segura (códigos válidos + cantidades claras)
  const largo = Math.max(img.naturalWidth, img.naturalHeight);
  const tamanos = [...new Set([Math.min(largo, 1280), Math.min(largo, 900), Math.min(largo, 700), Math.min(largo, 1600)])];
  const puntaje = (rr) => rr.filas.reduce((t, f) => t + (f.estadoCodigo === "ok" ? 1 : f.estadoCodigo === "corregido" ? 0.6 : 0) * (f.qty == null ? 0.2 : 0.3 + 0.7 * f.confQty), 0);
  let r = null, mejorP = -1;
  tamanos.forEach(L => {
    const escala = L / largo, w = Math.max(200, Math.round(img.naturalWidth * escala)), h = Math.max(200, Math.round(img.naturalHeight * escala));
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0, w, h);
    let rr = null; try { rr = LectorPantalla.leer(ctx.getImageData(0, 0, w, h).data, w, h, LECTOR_MODELO, cat); } catch (e) { rr = null; }
    if (!rr || rr.filas.length < 3) return;
    const pt = puntaje(rr);
    if (pt > mejorP) { mejorP = pt; r = rr; }
  });
  if (!r) return null;
  bodegaMiniatura.full = null;
  const lista = [];
  r.filas.forEach(f => {
    if (f.estadoCodigo === "ilegible" && f.qty == null) return;   // basura (barra, encabezado…)
    const dudCod = f.estadoCodigo === "corregido" && f.margenCodigo < 0.5;
    const dud = f.qty == null || f.confQty < 0.93 || f.qty >= 100 || dudCod || f.confCodigo < 0.45 || f.sintetico;
    lista.push({ raw: f.raw, qty: f.qty == null ? 0 : f.qty, share: f.confQty, alt: f.alt, dudoso: dud, idx: lista.length + 1, mini: (dud || f.estadoCodigo === "ilegible") ? bodegaMiniatura(r, f) : null });
  });
  return lista;
}

async function bodegaEscanear(file, onEstado, onProg) {
  onEstado("Preparando la foto…");
  const img = await bodegaCargarImagen(file);
  { const cat0 = bodegaCatalogoEscaneo();
    onEstado("Leyendo la pantalla…"); await new Promise(res => setTimeout(res, 30));
    const lista = bodegaLeerPantalla(img, cat0);
    if (lista && lista.length >= 3) { onProg && onProg(1); const rp = bodegaConstruir(lista, cat0); rp.fecha = ""; rp.metodo = "pantalla"; return rp; } }
  const base = bodegaBase(img);
  onEstado("Cargando lector de texto…");
  let worker;
  try { worker = await bodegaWorker(onProg); }
  catch (e) { throw new Error("No pude cargar el lector de texto (necesita internet la primera vez)."); }
  const cat = bodegaCatalogoEscaneo();

  // 1) vista general: ubica dónde está cada renglón
  const listas = []; let fecha = "";
  const intentos = [{ norm: false, psm: "6" }, { norm: false, psm: "4" }, { norm: true, psm: "6" }, { norm: true, psm: "4" }];
  for (let i = 0; i < intentos.length; i++) {
    if (i >= 2 && bodegaUnirFilas(listas).length >= 12) break;
    const it = intentos[i];
    onEstado(i === 0 ? "Buscando los renglones…" : "Buscando con otro ajuste…");
    const cv = it.norm ? bodegaNormalizar(base).cv : base.cv;
    await worker.setParameters({ tessedit_char_whitelist: "0123456789.,-/ ", tessedit_pageseg_mode: it.psm, preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(cv, {}, { blocks: true });
    const words = bodegaPalabras(data);
    listas.push(bodegaFilasDePalabras(words));
    fecha = fecha || bodegaFecha(words) || (String(data.text || "").match(/\d{2}-\d{2}-20\d{2}/) || [""])[0];
  }
  let filas = bodegaUnirFilas(listas);
  if (!filas.length) return { stock: {}, fecha, dudosos: [], nuevos: [], leidos: 0, revisar: [] };
  filas = filas.concat(bodegaHuecos(filas)).sort((a, b) => a.cod.y - b.cod.y);
  bodegaUbicarCantidades(filas);

  // 2) cada renglón por separado, agrandado y limpio
  worker.__prog = null;
  await worker.setParameters({ tessedit_char_whitelist: "0123456789", tessedit_pageseg_mode: "7", preserve_interword_spaces: "0" });
  const codigos = [];
  for (let i = 0; i < filas.length; i++) {
    onEstado(`Leyendo códigos… ${i + 1}/${filas.length}`); onProg && onProg((i + 1) / filas.length / 2);
    codigos.push(await bodegaLeerCodigo(worker, base, filas[i], cat));
  }
  await worker.setParameters({ tessedit_char_whitelist: "0123456789.,", tessedit_pageseg_mode: "7" });
  const lista = [], vistos = new Set();
  for (let i = 0; i < filas.length; i++) {
    const res = bodegaResolver(codigos[i], cat);
    if (filas[i].sonda && !(res.estado === "ok" || res.estado === "corregido" || res.estado === "nuevo")) continue;   // la sonda no encontró nada
    if (filas[i].sonda && vistos.has(res.code)) continue;
    onEstado(`Leyendo cantidades… ${i + 1}/${filas.length}`); onProg && onProg(0.5 + (i + 1) / filas.length / 2);
    const q = await bodegaLeerCantidad(worker, base, filas[i]);
    if (q.qty == null) { if (res.estado === "ilegible" || res.estado === "ambiguo") { lista.push({ raw: codigos[i], qty: 0, idx: i + 1, mini: bodegaMiniFila(base, filas[i]) }); } else lista.push({ raw: codigos[i], qty: 0, dudoso: true, share: 0, idx: i + 1, mini: bodegaMiniFila(base, filas[i]) }); continue; }
    vistos.add(res.code);
    const dd = q.share < 0.8 || filas[i].qtyEstimada || res.estado === "corregido";
    lista.push({ raw: codigos[i], qty: q.qty, share: q.share, alt: q.alt, dudoso: dd, idx: i + 1, mini: dd ? bodegaMiniFila(base, filas[i]) : null });
  }
  const r = bodegaConstruir(lista, cat);
  r.fecha = fecha;
  return r;
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

/* Al aplicar un escaneo, cada sección que aparece en la foto (iPhone, iPad, Mac…) se reemplaza con lo leído;
   las secciones que NO aparecen se conservan. Con modo "parcial" (la foto es solo una parte de la lista)
   no se pone en 0 nada de lo que no apareció. */
function bodegaMezclar(prev, escaneado, modo) {
  const out = { ...escaneado }, vistas = new Set(Object.keys(escaneado).map(bodegaSeccionDe));
  Object.keys(prev || {}).forEach(c => {
    if (c in out) return;
    if (modo === "parcial" || !vistas.has(bodegaSeccionDe(c))) out[c] = prev[c];
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
  .bx-btn.warnb{ background:#ff9f0a; color:#fff; justify-content:center; }
  .bx-steps{ display:flex; align-items:center; gap:6px; margin:4px 0 14px; }
  .bx-steps b{ flex:1; height:2px; background:var(--bx-line); }
  .bx-st{ display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:var(--text-secondary); }
  .bx-st i{ width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-style:normal; font-size:13px; background:var(--bx-fill); }
  .bx-st.act{ color:var(--accent); } .bx-st.act i{ background:var(--accent); color:#fff; }
  .bx-st.hecho{ color:var(--bx-green); } .bx-st.hecho i{ background:var(--bx-green); color:#fff; }
  .bx-resumen{ display:flex; gap:8px; margin:8px 0 6px; }
  .bx-resumen div{ flex:1; background:var(--bx-fill); border-radius:14px; padding:10px 6px; text-align:center; }
  .bx-resumen b{ display:block; font-size:26px; line-height:1.1; }
  .bx-resumen small{ font-size:12px; color:var(--text-secondary); }
  .bx-resumen .ok b{ color:var(--bx-green); } .bx-resumen .warn b{ color:var(--bx-orange); }
  .bx-sec.warn h4{ color:var(--bx-orange); }
  .bx-rv{ border:1.5px solid rgba(255,159,10,.55); border-radius:16px; padding:12px; margin:10px 0; background:var(--bx-card); }
  .bx-rv-top{ display:flex; justify-content:space-between; font-size:13px; color:var(--text-secondary); font-weight:600; }
  .bx-rv-s{ background:var(--bx-fill); border-radius:8px; padding:1px 8px; }
  .bx-rv-tag{ display:inline-block; margin:8px 0 4px; font-size:12px; font-weight:700; padding:3px 9px; border-radius:8px; }
  .bx-rv-tag.q{ background:rgba(255,159,10,.2); color:var(--bx-orange); } .bx-rv-tag.x{ background:rgba(255,59,48,.16); color:var(--bx-red); }
  .bx-rv-tag.f{ background:rgba(10,132,255,.15); color:var(--bx-cap); } .bx-rv-tag.g{ background:rgba(175,82,222,.18); color:#a24bd6; font-size:15px; }
  .bx-rv-upc{ font:700 24px/1.15 ui-monospace,Menlo,monospace; letter-spacing:.02em; word-break:break-all; }
  .bx-rv-upc.dim{ color:var(--text-secondary); }
  .bx-rv-nom{ font-size:15px; margin:2px 0 6px; }
  .bx-rv-nota{ font-size:13px; color:var(--text-secondary); margin-bottom:6px; }
  .bx-rv-img{ position:relative; display:block; width:100%; padding:0; border:0; border-radius:10px; overflow:hidden; background:#000; margin:6px 0; }
  .bx-rv-img img{ display:block; width:100%; }
  .bx-rv-img span{ position:absolute; right:8px; bottom:8px; font-size:12px; font-weight:700; color:#fff; background:rgba(0,0,0,.6); border-radius:8px; padding:3px 8px; }
  .bx-rv-noimg{ font-size:13px; color:var(--text-secondary); padding:8px 0; }
  .bx-rv-opts{ display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
  .bx-rv-b{ flex:1 1 auto; border:0; border-radius:12px; padding:13px 12px; font:inherit; font-size:16px; font-weight:650; background:var(--bx-fill); color:var(--text); }
  .bx-rv-b.main{ background:var(--accent); color:#fff; }
  .bx-listo{ background:rgba(52,199,89,.15); color:var(--bx-green); border-radius:14px; padding:14px; font-weight:600; margin:10px 0; }
  .bx-hechos{ margin:8px 0; font-size:14px; } .bx-hechos summary{ font-weight:650; padding:6px 2px; } .bx-hechos div{ padding:2px 4px; color:var(--text-secondary); }
  .bx-zoom{ position:fixed; inset:0; z-index:9999; background:#000; display:flex; flex-direction:column; }
  .bx-zoom-h{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:14px 16px; color:#fff; font-size:15px; }
  .bx-zoom-h b{ font-size:15px; word-break:break-all; } .bx-zoom-h button{ border:0; background:#3a3a3c; color:#fff; border-radius:10px; padding:10px 14px; font:inherit; font-weight:650; white-space:nowrap; }
  .bx-zoom-b{ flex:1; overflow:auto; -webkit-overflow-scrolling:touch; }
  .bx-zoom-b img{ display:block; width:100%; }
  .bx-edit-b{ padding:8px 16px 24px; color:#fff; } .bx-edit-b label{ display:block; font-size:13px; color:#aaa; margin:14px 0 6px; }
  .bx-edit-b input{ width:100%; box-sizing:border-box; font:700 26px ui-monospace,Menlo,monospace; letter-spacing:.04em; padding:12px; border-radius:12px; border:1.5px solid #555; background:#1c1c1e; color:#fff; }
  .bx-edit-prev{ margin-top:10px; padding:12px; border-radius:12px; font-size:16px; font-weight:600; background:#2c2c2e; color:#ddd; }
  .bx-edit-prev.ok{ background:rgba(52,199,89,.2); color:#5ee07f; } .bx-edit-prev.warn{ background:rgba(255,159,10,.2); color:#ffb340; }
  .bx-edit-b .bx-rv-b{ width:100%; margin-top:20px; } .bx-edit-b .bx-rv-b[disabled]{ opacity:.4; }
  .bx-todos{ margin:10px 0; } .bx-todos summary{ font-weight:650; padding:8px 2px; }
  .bx-td{ display:flex; align-items:center; gap:8px; padding:8px 4px; border-top:1px solid var(--bx-line); }
  .bx-td-t{ flex:1; min-width:0; } .bx-td-t b{ display:block; font:700 15px ui-monospace,Menlo,monospace; } .bx-td-t small{ display:block; font-size:13px; color:var(--text-secondary); }
  .bx-td-q{ font-weight:800; font-size:18px; min-width:34px; text-align:right; }
  .bx-td button{ border:0; border-radius:10px; background:var(--bx-fill); color:var(--text); font:inherit; font-size:14px; font-weight:650; padding:8px 12px; }
  .bx-zoom p{ margin:0; padding:10px; text-align:center; color:#aaa; font-size:13px; }
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
  .bod-textobox p{ font-size:14.5px; color:var(--text-secondary); line-height:1.4; margin:10px 4px; }
  /* contornos de color por sección: azul = actualizar, verde = reportes, naranja = no vendibles, morado = historial */
  .bx-s-azul,.bx-t-azul{ --sc:#0a84ff; } .bx-s-verde,.bx-t-verde{ --sc:#30d158; } .bx-s-naranja,.bx-t-naranja{ --sc:#ff9f0a; } .bx-s-morado,.bx-t-morado{ --sc:#bf5af2; }
  .bx .bx-card[class*="bx-s-"], .bx[class*="bx-t-"] .bx-card, .bx[class*="bx-t-"] .bx-m, .bx[class*="bx-t-"] .bx-g{ border:2px solid color-mix(in srgb,var(--sc) 70%, transparent); background:color-mix(in srgb,var(--sc) 5%, var(--bx-card)); }
  .bx .bx-card[class*="bx-s-"] h3::before, .bx[class*="bx-t-"] .bx-card h3::before{ content:""; display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--sc); margin-right:10px; vertical-align:middle; position:relative; top:-2px; }
  .bx-hist[class*="bx-s-"] svg{ color:var(--sc); }
  .bx-s-azul .bx-btn.pri{ background:var(--sc); }
  .bx-s-azul .bx-btn:not(.pri), .bx-t-azul .bx-btn:not(.pri){ box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--sc) 45%, transparent); }
  .bx-s-naranja .bx-inner{ border:1.5px solid color-mix(in srgb,var(--sc) 55%, transparent); }
  .bx-s-naranja .bx-inner-h > svg{ color:var(--sc); }
  .bx-t-naranja .bx-mh{ color:var(--sc); }
  .bx-t-azul .bx-mh{ color:var(--sc); }
  `;
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

/* "iPad (18 códigos), iPhone (40 códigos)" de lo que trae un escaneo */
function bodegaSeccionesTxt(stock) {
  const n = {}; Object.keys(stock).forEach(c => { const sec = bodegaSeccionDe(c); n[sec] = (n[sec] || 0) + 1; });
  const t = Object.keys(n).map(k => `${k} (${n[k]} código${n[k] === 1 ? "" : "s"})`).join(", ");
  return t || "nada";
}

/* ---------- Pantalla principal de Bodega ---------- */
/* Foto a pantalla completa: un toque alterna entre ajustada y ampliada (se desplaza con el dedo) */
function bodegaZoom(src, titulo) {
  const o = document.createElement("div");
  o.className = "bx-zoom";
  o.innerHTML = `<div class="bx-zoom-h"><b></b><button type="button">Cerrar ✕</button></div><div class="bx-zoom-b"><img alt=""></div><p>Toca la foto para acercar o alejar</p>`;
  o.querySelector("b").textContent = titulo || "";
  const im = o.querySelector("img"); im.src = src;
  let grande = false;
  im.addEventListener("click", () => { grande = !grande; im.style.width = grande ? "260%" : "100%"; im.style.maxWidth = grande ? "none" : "100%"; });
  const cerrar = () => o.remove();
  o.querySelector("button").addEventListener("click", cerrar);
  document.body.appendChild(o);
}

/* Editor de UPC: escribes el número y al momento muestra qué modelo es */
function bodegaEditor(cat, code, qty, onSave) {
  const o = document.createElement("div");
  o.className = "bx-zoom bx-edit";
  o.innerHTML = `<div class="bx-zoom-h"><b>Corregir UPC</b><button type="button" data-x>Cancelar</button></div>
    <div class="bx-edit-b">
      <label>UPC (12 dígitos)</label><input id="bxeU" inputmode="numeric" autocomplete="off" maxlength="13">
      <div class="bx-edit-prev" id="bxeP"></div>
      <label>Cantidad</label><input id="bxeQ" inputmode="numeric" autocomplete="off" maxlength="5">
      <button type="button" class="bx-rv-b main" id="bxeG">Guardar</button></div>`;
  const u = o.querySelector("#bxeU"), q = o.querySelector("#bxeQ"), pv = o.querySelector("#bxeP"), g = o.querySelector("#bxeG");
  u.value = String(code || "").replace(/\D/g, ""); q.value = qty == null ? "" : String(qty);
  const act = () => {
    const v = u.value.replace(/\D/g, ""), ok = v.length === 12;
    g.disabled = !ok || q.value.replace(/\D/g, "") === "";
    if (!v) { pv.className = "bx-edit-prev"; pv.textContent = "Escribe el código del renglón."; return; }
    if (!ok) { pv.className = "bx-edit-prev warn"; pv.textContent = `Faltan ${12 - v.length > 0 ? 12 - v.length : 0} dígito(s)${v.length > 12 ? " — sobran " + (v.length - 12) : ""}.`; return; }
    if (cat[v]) { pv.className = "bx-edit-prev ok"; pv.textContent = "✓ " + bodegaNombre(cat, v); }
    else { pv.className = "bx-edit-prev warn"; pv.textContent = (bodegaUpcOk(v) ? "Código válido pero no está en el catálogo (se guarda como código nuevo)." : "Este código no está en el catálogo y su dígito verificador no cuadra. Revisa el número."); }
  };
  u.addEventListener("input", act); q.addEventListener("input", act);
  o.querySelector("[data-x]").addEventListener("click", () => o.remove());
  g.addEventListener("click", () => { const v = u.value.replace(/\D/g, ""), n = parseInt(q.value.replace(/\D/g, ""), 10); if (v.length === 12 && isFinite(n)) { o.remove(); onSave(v, n); } });
  document.body.appendChild(o); act(); u.focus();
}

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

    const sp = window.ishopSyncPausada ? window.ishopSyncPausada() : false, sd = typeof window.ishopSyncPausa === "function";
    wrap.innerHTML = `
      ${sd ? `<div class="bx-card" style="${sp ? "outline:2px solid #ff9f0a" : ""}">
        <h3>Sincronización con Firebase</h3>
        <p class="bx-sub">${sp ? "<b>Modo pruebas:</b> tus cambios se quedan solo en este dispositivo. Nadie más los ve." : "Encendida: lo que hagas aquí le llega a todos los dispositivos."}</p>
        <button class="bx-btn ${sp ? "pri" : ""}" id="bodSync"><span>${sp ? "Encender sincronización y publicar lo que hice" : "Apagar sincronización (modo pruebas)"}</span></button>
      </div>` : ""}
      <div class="bx-card bx-s-azul">
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

      <div class="bx-card bx-s-verde">${ultimo}</div>

      <div class="bx-card bx-s-naranja">
        <h3>Equipos no vendibles</h3>
        <button class="bx-inner" id="bodNV">
          <div class="bx-inner-h">${BX_ICON.warn}<span>Registrar DOA / equipo dañado</span>
            ${nvTot ? `<em class="bx-badge" style="font-style:normal">${nvTot} equipo${nvTot === 1 ? "" : "s"}</em>` : ""}${apTot ? `<em class="bx-badge ap" style="font-style:normal">${apTot} apartado${apTot === 1 ? "" : "s"}</em>` : ""}
            <span class="bx-ch" style="flex:0 0 20px;color:var(--text-secondary)">${BX_ICON.chev}</span></div>
          <p>DOA, dañados, equipos aún no vendibles y apartados. Solo los apartados se ven en Existencias, como etiqueta.</p>
        </button>
      </div>

      <button class="bx-card bx-hist bx-s-morado" id="bodHist">${BX_ICON.clock}<span>Historial de reportes</span><i class="bx-ch">${BX_ICON.chev}</i></button>

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
      est.textContent = `Leí ${esc.leidos} códigos. Revisa lo marcado abajo antes de guardar.`;
      mostrarReporte(prev, cat(), true);
    } catch (e) { linea.style.display = "none"; est.textContent = "No pude leer esa foto (" + (e.message || e) + "). Prueba con otra foto o con “Pegar o escanear texto”."; }
  }

  /* Vista previa de lo que cambió ANTES de guardar: 1 Escanear → 2 Revisar → 3 Guardar */
  function mostrarReporte(prev, c, conservar) {
    const { esc, origen } = pendiente, fecha = esc.fecha;
    esc.confirmadas = esc.confirmadas || {}; esc.faltaOk = esc.faltaOk || {}; esc.grandeOk = esc.grandeOk || {}; esc.hechos = esc.hechos || {};
    const hayPrev = Object.keys(estado.stock).length > 0;
    const total = esc.total || esc.leidos;
    const nuevoStock = bodegaMezclar(estado.stock, esc.stock, pendiente.parcial ? "parcial" : "secciones");
    const items = bodegaItems(estado.stock, nuevoStock, c);
    const res = bodegaResumen(items);
    const rep = hayPrev ? bodegaComparar(estado.stock, nuevoStock, c) : null;
    const tot = Object.values(nuevoStock).reduce((x, y) => x + y, 0);
    const texto = rep ? bodegaTextoReporte(rep, fecha) : `Primera captura${fecha ? " · " + fecha : ""}\n${esc.leidos} códigos · ${tot} piezas`;
    const sec = code => bodegaSeccionDe(code);
    const ren = (idx) => idx ? `Renglón ${idx}${total ? " de " + total : ""}` : "Renglón";

    // 1) cantidades poco seguras
    const rev = (esc.revisar || []).filter(x => !esc.confirmadas[x.code]);
    // 2) códigos que no pude leer
    const dud = esc.dudosos || [];
    // 3) códigos que tenías y no salieron en la foto
    const faltan = (hayPrev && !pendiente.parcial) ? Object.keys(estado.stock).filter(code => estado.stock[code] > 0 && !(code in esc.stock) && !esc.faltaOk[code] && Object.keys(esc.stock).some(k => sec(k) === sec(code))) : [];
    // 4) cambios muy grandes contra el reporte anterior
    const grandes = hayPrev ? Object.keys(esc.stock).filter(code => {
      if (esc.confirmadas[code] || esc.grandeOk[code] || rev.some(x => x.code === code) || !(code in estado.stock)) return false;
      const p = estado.stock[code], n = esc.stock[code];
      return p > 0 && Math.abs(n - p) >= 10 && (n >= p * 2 || n <= p / 2);
    }) : [];
    const pend = rev.length + dud.length + faltan.length + grandes.length;
    const hechos = Object.values(esc.hechos);

    const img = (x, titulo) => x.mini ? `<button type="button" class="bx-rv-img" data-act="zoom" data-t="${bodegaEsc(titulo)}"><img src="${x.mini}" alt=""><span>🔍 Toca para ampliar</span></button>` : `<div class="bx-rv-noimg">Sin foto de este renglón</div>`;
    const cab = (idx, code, raw) => `<div class="bx-rv-top"><span class="bx-rv-n">${ren(idx)}</span>${code ? `<span class="bx-rv-s">${bodegaEsc(sec(code))}</span>` : ""}</div>`;
    const cards = [];
    rev.forEach(x => {
      const nom = bodegaNombre(c, x.code), leido = esc.stock[x.code];
      cards.push(`<div class="bx-rv" data-c="${x.code}">${cab(x.idx, x.code)}
        <div class="bx-rv-tag q">Cantidad dudosa</div>
        <div class="bx-rv-upc">${x.code}</div><div class="bx-rv-nom">${bodegaEsc(nom)}</div>
        ${x.leido ? `<div class="bx-rv-nota">El código se leyó como ${bodegaEsc(x.leido)} y lo corregí a este.</div>` : ""}
        ${x.repetido ? `<div class="bx-rv-nota">Este código salió repetido en la foto.</div>` : ""}
        ${img(x, x.code + " · " + nom)}
        <div class="bx-rv-opts"><button class="bx-rv-b main" data-act="qty" data-c="${x.code}" data-v="${leido}">Leí ${leido} ✓</button>${x.alt != null && x.alt !== leido ? `<button class="bx-rv-b" data-act="qty" data-c="${x.code}" data-v="${x.alt}">¿${x.alt}?</button>` : ""}<button class="bx-rv-b" data-act="otra" data-c="${x.code}">Otra cantidad</button><button class="bx-rv-b" data-act="upc" data-c="${x.code}">Corregir UPC</button></div></div>`);
    });
    dud.forEach((d, i) => {
      cards.push(`<div class="bx-rv" data-i="${i}">${cab(d.idx)}
        <div class="bx-rv-tag x">No pude leer el código</div>
        <div class="bx-rv-upc dim">${bodegaEsc(d.raw || "—")}</div><div class="bx-rv-nom">Cantidad que leí: ${d.qty}</div>
        ${img(d, "Renglón " + (d.idx || ""))}
        <div class="bx-rv-opts"><button class="bx-rv-b main" data-act="cod" data-i="${i}">Escribir el código</button><button class="bx-rv-b" data-act="quitar" data-i="${i}">Quitar renglón</button></div></div>`);
    });
    faltan.forEach(code => {
      const nom = bodegaNombre(c, code), antes = estado.stock[code];
      cards.push(`<div class="bx-rv" data-c="${code}"><div class="bx-rv-top"><span class="bx-rv-n">No apareció en la foto</span><span class="bx-rv-s">${bodegaEsc(sec(code))}</span></div>
        <div class="bx-rv-tag f">Tenías ${antes} pieza${antes === 1 ? "" : "s"}</div>
        <div class="bx-rv-upc">${code}</div><div class="bx-rv-nom">${bodegaEsc(nom)}</div>
        <div class="bx-rv-opts"><button class="bx-rv-b main" data-act="conservar" data-c="${code}" data-v="${antes}">Conservar ${antes}</button><button class="bx-rv-b" data-act="cero" data-c="${code}">Ya no hay (0)</button></div></div>`);
    });
    grandes.forEach(code => {
      const nom = bodegaNombre(c, code), p = estado.stock[code], n = esc.stock[code];
      cards.push(`<div class="bx-rv" data-c="${code}"><div class="bx-rv-top"><span class="bx-rv-n">Cambio muy grande</span><span class="bx-rv-s">${bodegaEsc(sec(code))}</span></div>
        <div class="bx-rv-tag g">${p} → ${n}</div>
        <div class="bx-rv-upc">${code}</div><div class="bx-rv-nom">${bodegaEsc(nom)}</div>
        <div class="bx-rv-opts"><button class="bx-rv-b main" data-act="grande" data-c="${code}">Sí, ${n} es correcto</button><button class="bx-rv-b" data-act="otra" data-c="${code}">Corregir cantidad</button><button class="bx-rv-b" data-act="upc" data-c="${code}">Corregir UPC</button></div></div>`);
    });

    let extra = "";
    if (esc.nuevos.length) extra += `<p class="bod-aviso">🆕 Códigos fuera del catálogo:</p>${esc.nuevos.map(n => `<button class="bx-btn bod-nombrar" data-c="${n}"><span>${n} — Poner nombre</span></button>`).join("")}`;

    const paso = (n, t, st) => `<div class="bx-st ${st}"><i>${st === "hecho" ? "✓" : n}</i><span>${t}</span></div>`;
    const pasos = `<div class="bx-steps">${paso(1, "Escanear", "hecho")}<b></b>${paso(2, "Revisar", pend ? "act" : "hecho")}<b></b>${paso(3, "Guardar", pend ? "" : "act")}</div>`;
    const seguros = Math.max(0, esc.leidos - rev.length - grandes.length);
    const resumen = `<div class="bx-resumen"><div><b>${esc.leidos}</b><small>códigos leídos</small></div><div class="ok"><b>${seguros}</b><small>seguros</small></div><div class="${pend ? "warn" : "ok"}"><b>${pend}</b><small>por revisar</small></div></div>`;

    const old = prev.querySelector(".bod-reporte"); if (old) old.remove();
    if (!conservar) prev.innerHTML = "";
    prev.insertAdjacentHTML("beforeend", `<div class="bod-reporte bx-prev">
      ${pasos}
      <h3>${pend ? "Revisa antes de guardar" : "Todo revisado"}</h3>
      <p class="bx-sub" style="margin-bottom:8px">${fecha ? "Lista del " + bodegaEsc(fecha) + " · " : ""}${res.cambios ? res.cambios + " código" + (res.cambios === 1 ? "" : "s") + " con cambio." : "Sin cambios contra lo guardado."}</p>
      ${resumen}
      ${pend ? `<div class="bx-sec warn"><h4>Por revisar</h4><span>${pend}</span></div>${cards.join("")}` : `<div class="bx-listo">✅ Ya no hay nada pendiente. Revisa los cambios y guarda.</div>`}
      ${esc.ignorados ? `<p class="bod-aviso">ℹ️ Ignoré ${esc.ignorados} renglón(es) con códigos 2021… y cantidad negativa (no son existencias).</p>` : ""}
      <details class="bx-todos"><summary>Ver todos los códigos leídos (${Object.keys(esc.stock).length}) y corregir un UPC</summary>${Object.keys(esc.stock).map(code => `<div class="bx-td"><div class="bx-td-t"><b>${code}</b><small>${bodegaEsc(bodegaNombre(c, code))}</small></div><span class="bx-td-q">${esc.stock[code]}</span><button type="button" data-act="upc" data-c="${code}">Editar</button></div>`).join("")}</details>
      ${hechos.length ? `<details class="bx-hechos"><summary>Ya revisados (${hechos.length})</summary>${hechos.map(t => `<div>✓ ${bodegaEsc(t)}</div>`).join("")}</details>` : ""}
      ${hayPrev ? `<label class="bod-aviso" style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="bodParcial" ${pendiente.parcial ? "checked" : ""} style="margin-top:3px;width:20px;height:20px"><span><b>La foto es solo una parte de la lista</b><br><small>Actualizo: ${bodegaSeccionesTxt(esc.stock)}. ${pendiente.parcial ? "Lo que no aparece en la foto se queda como estaba." : "Lo que no aparece de esas secciones pasa a 0."}</small></span></label>` : ""}
      <div class="bx-sec"><h4>Cambios a guardar</h4></div>
      ${bodegaDetalleHtml(items, c)}${extra}
      <button class="bx-btn ${pend ? "warnb" : "ok"}" id="bodAplicar">${pend ? "Guardar con " + pend + " sin revisar" : "✓ Aplicar cambios"}</button>
      <button class="bx-btn mid" id="bodCopiar">Copiar reporte</button>
      <button class="bx-btn mid" id="bodCancelar">Descartar</button></div>`);

    const again = () => mostrarReporte(prev, cat(), true);
    const hecho = (code, txt) => { esc.hechos[code] = txt; };
    const pedir = (code, def) => {
      const v = prompt("Cantidad correcta de " + bodegaNombre(c, code) + ":", String(def));
      if (v === null) return null;
      const n = parseInt(String(v).replace(/\D/g, ""), 10);
      return isFinite(n) ? n : null;
    };
    const chkP = prev.querySelector("#bodParcial");
    if (chkP) chkP.addEventListener("change", () => { pendiente.parcial = chkP.checked; again(); });
    prev.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
      const act = b.dataset.act, code = b.dataset.c, v = b.dataset.v, i = +b.dataset.i;
      if (act === "zoom") { bodegaZoom(b.querySelector("img").src, b.dataset.t); return; }
      if (act === "qty") { esc.stock[code] = +v; esc.confirmadas[code] = true; hecho(code, `${bodegaNombre(c, code)} · ${v}`); }
      else if (act === "otra") { const n = pedir(code, esc.stock[code] != null ? esc.stock[code] : ""); if (n === null) return; esc.stock[code] = n; esc.confirmadas[code] = true; hecho(code, `${bodegaNombre(c, code)} · ${n}`); }
      else if (act === "grande") { esc.grandeOk[code] = true; hecho(code, `${bodegaNombre(c, code)} · ${esc.stock[code]}`); }
      else if (act === "conservar") { esc.stock[code] = +v; esc.faltaOk[code] = true; hecho(code, `${bodegaNombre(c, code)} · se conserva ${v}`); }
      else if (act === "cero") { esc.faltaOk[code] = true; hecho(code, `${bodegaNombre(c, code)} · 0`); }
      else if (act === "quitar") { esc.dudosos.splice(i, 1); }
      else if (act === "cod") {
        const d = esc.dudosos[i], raw12 = String(d.raw || "").replace(/\D/g, "");
        bodegaEditor(cat(), raw12.length === 12 ? raw12 : "", d.qty, (v, n) => {
          esc.stock[v] = n; esc.confirmadas[v] = true; esc.leidos = Object.keys(esc.stock).length;
          if (!bodegaCatalogoEscaneo()[v] && !esc.nuevos.includes(v)) esc.nuevos.push(v);
          const k = esc.dudosos.indexOf(d); if (k >= 0) esc.dudosos.splice(k, 1);
          hecho(v, `${bodegaNombre(cat(), v)} · ${n}`); again();
        });
        return;
      }
      else if (act === "upc") {
        bodegaEditor(cat(), code, esc.stock[code], (v, n) => {
          if (v !== code) { delete esc.stock[code]; esc.revisar = (esc.revisar || []).filter(x => x.code !== code); }
          esc.stock[v] = n; esc.confirmadas[v] = true; esc.leidos = Object.keys(esc.stock).length;
          if (!bodegaCatalogoEscaneo()[v] && !esc.nuevos.includes(v)) esc.nuevos.push(v);
          hecho(v, `${bodegaNombre(cat(), v)} · ${n}`); again();
        });
        return;
      }
      again();
    }));
    prev.querySelectorAll(".bod-nombrar").forEach(b => b.addEventListener("click", () => {
      const code = b.dataset.c, n = prompt("Nombre (ej. iPhone 18 Pro Max Naranja 512GB):", "");
      if (!n) return;
      const ex = bodegaExtra(); ex[code] = { modelo: n, color: "", capacidad: "" };
      try { localStorage.setItem(BODEGA_EXTRA_KEY, JSON.stringify(ex)); } catch (e) {}
      again();
    }));
    prev.querySelector("#bodCopiar").addEventListener("click", () => { navigator.clipboard && navigator.clipboard.writeText(texto); });
    prev.querySelector("#bodCancelar").addEventListener("click", () => { pendiente = null; pintar(); });
    prev.querySelector("#bodAplicar").addEventListener("click", () => {
      if (pend && !confirm("Todavía hay " + pend + " renglón(es) sin revisar. ¿Guardar así?")) return;
      const hist = bodegaRegistrar(estado, estado.stock, nuevoStock, cat(), origen, fecha);
      estado = { stock: nuevoStock, fecha: fecha || estado.fecha, ultimoReporte: texto, historial: hist };
      bodegaSave(estado); pendiente = null; pintar();
    });
  }

  wrap.addEventListener("click", async (e) => {
    const bt = e.target.closest("#bodSync"); if (!bt || !window.ishopSyncPausa) return;
    const pausada = window.ishopSyncPausada();
    if (!pausada) {
      if (!confirm("¿Apagar la sincronización?\n\nLo que subas o cambies aquí se queda solo en este dispositivo y no verás los cambios de los demás hasta que la enciendas.")) return;
      window.ishopSyncPausa(true); estado = bodegaLoad(); pintar();
    } else {
      if (!confirm("¿Encender la sincronización?\n\nTodo lo que dejaste en este dispositivo (lo agregado y lo borrado) se publicará y reemplazará lo que ven los demás.")) return;
      bt.disabled = true; bt.querySelector("span").textContent = "Publicando…";
      try { await window.ishopSyncPausa(false); } catch (_) { alert("No se pudo publicar. Revisa tu conexión e inténtalo de nuevo."); }
      estado = bodegaLoad(); pintar();
    }
  });
  pintar();
  return wrap;
}

/* ---------- Capturar cantidades manualmente ---------- */
function buildBodegaManual() {
  bodegaEstilos();
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx bx-t-azul";
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
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx bx-t-naranja";
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
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx bx-t-morado";
  const estado = bodegaLoad(), hist = estado.historial || [], cat = bodegaCatalogoTodo(estado.stock);
  const ORIGEN = { foto: "Foto", texto: "Texto", manual: "Manual", venta: "Venta", deshacer: "Venta deshecha" };
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
  const wrap = document.createElement("div"); wrap.className = "bod-wrap bx bx-t-verde";
  const estado = bodegaLoad(), h = (estado.historial || []).find(x => x.ts === ts), cat = bodegaCatalogoTodo(estado.stock);
  if (!h) { wrap.innerHTML = `<div class="bx-vacio">No encontré ese reporte.</div>`; return wrap; }
  const r = bodegaResumen(h.items), d = r.ahora - r.antes;
  wrap.innerHTML = `<div class="bx-card" style="margin-top:4px"><h3>${bodegaFechaHora(h.ts)}</h3>
    <p class="bx-sub" style="margin:0">${r.cambios} renglón${r.cambios === 1 ? "" : "es"} con cambio · ${r.antes} → ${r.ahora} piezas (${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)})${h.fecha ? " · lista del " + bodegaEsc(h.fecha) : ""}</p></div>
    ${bodegaDetalleHtml(h.items, cat)}`;
  return wrap;
}

if (typeof module !== "undefined") module.exports = { bodegaFilasDeTexto, bodegaLeerTexto, bodegaResolver, bodegaRenglones, bodegaLeerRenglon, bodegaFilasDePalabras, bodegaComparar, bodegaTextoReporte, bodegaUpcOk, bodegaFecha, bodegaMezclar };
