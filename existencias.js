/* =====================================================================
   EXISTENCIAS (oculto) — lo que hay en bodega, bonito y por sección
   Se abre manteniendo presionado ~1 s el botón "Código cajas" del inicio.
   Lee las cantidades del módulo Bodega (bodega.js) y el catálogo de datos/escaner.json.
   Arriba: solo lo que hay, por sección. Abajo: "Todo agotado".
   ===================================================================== */
const EX_SVG = {
  "iPhone": '<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 5.3h3"/>',
  "iPad": '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M10.8 18.5h2.4"/>',
  "Mac": '<rect x="4.5" y="5" width="15" height="10.5" rx="1.5"/><path d="M2.5 18.5h19"/>',
  "Watch": '<rect x="7" y="6.5" width="10" height="11" rx="3"/><path d="M9 6.5l.7-3.5h4.6l.7 3.5M9 17.5l.7 3.5h4.6l.7-3.5"/>',
  "AirPods": '<path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3"/><rect x="3" y="13.5" width="4" height="7" rx="1.9"/><rect x="17" y="13.5" width="4" height="7" rx="1.9"/>',
  "Bocinas / Home": '<rect x="6" y="2.5" width="12" height="19" rx="3.2"/><circle cx="12" cy="14.5" r="3.3"/><circle cx="12" cy="7" r="1"/>',
  "Otros": '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
};
const EX_SECCIONES = [
  { id: "iPhone",  label: "iPhone",  icono: "📱", c1: "#0a84ff", c2: "#5e5ce6" },
  { id: "iPad",    label: "iPad",    icono: "🟦", c1: "#30b0c7", c2: "#0a84ff" },
  { id: "Mac",     label: "Mac",     icono: "💻", c1: "#8e8e93", c2: "#48484a" },
  { id: "Watch",   label: "Watch",   icono: "⌚", c1: "#ff375f", c2: "#ff9f0a" },
  { id: "AirPods", label: "AirPods", icono: "🎧", c1: "#bf5af2", c2: "#5e5ce6" },
  { id: "Bocinas / Home", label: "Bocinas", icono: "🔊", c1: "#34c759", c2: "#30b0c7" },
  { id: "Otros",   label: "Otros",   icono: "📦", c1: "#ff9f0a", c2: "#ff6b35" },
];
/* Hasta cuántas piezas se considera "pocas" (naranja) en cada categoría. 0 piezas = agotado (rojo). Más de eso = hay (verde). */
const EX_POCAS = { "iPhone": 3, "iPad": 2, "Mac": 2, "Watch": 3, "AirPods": 3, "Bocinas / Home": 2, "Otros": 3 };
const exPocas = id => EX_POCAS[id] != null ? EX_POCAS[id] : 3;
function exIcono(id) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${EX_SVG[id] || EX_SVG.Otros}</svg>`; }
/* Imagen opcional: imágenes/existencias/<nombre-en-minúsculas-con-guiones>.png (si no existe se queda el icono) */
function exSlug(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function exImg(nombre) { return `<img src="imágenes/existencias/${exSlug(nombre)}.png" alt="" loading="lazy" onload="this.parentNode.classList.add('has')" onerror="this.remove()">`; }
const EX_COLORES = [
  [/nocturno|night|negro|black|medianoche|midnight|space|grafito/i, "#2b2b2e"],
  [/blanco|white|estelar|starlight|star/i, "#f2efe9"],
  [/plata|silver|plateado/i, "#d7d8da"],
  [/azul cielo|cielo|sky|mist|niebla/i, "#a9c7e6"],
  [/glaci/i, "#bcd7e3"],
  [/azul|blue|indigo|índigo/i, "#3f6fb3"],
  [/lavanda|lavender|morado|purple|violeta/i, "#b9a6d8"],
  [/salvia|sage|verde|green/i, "#9db39a"],
  [/naranja|orange|cosmic/i, "#e8793a"],
  [/borgo|burgundy|rojo|red/i, "#7b1f33"],
  [/rosa|pink/i, "#efb7c5"],
  [/amarillo|yellow|citr/i, "#e9d56a"],
  [/oro|gold|dorado/i, "#d9b97a"],
  [/gris|gray|grey|titanio|natural/i, "#8d8d92"],
];

function exSeccion(nombre) {
  const n = String(nombre || "").toLowerCase();
  if (/iphone/.test(n)) return "iPhone";
  if (/ipad/.test(n)) return "iPad";
  if (/watch/.test(n)) return "Watch";
  if (/airpods|beats/.test(n)) return "AirPods";
  if (/homepod|bocina|speaker|pill|studio display/.test(n)) return "Bocinas / Home";
  if (/mac/.test(n)) return "Mac";
  return "Otros";
}
function exColor(nombre) {
  for (const [re, hex] of EX_COLORES) if (re.test(nombre || "")) return hex;
  return "#c7c7cc";
}
function exCapNum(c) {
  const m = String(c || "").match(/(\d+)\s*(tb|gb)?/i);
  if (!m) return 0;
  return /tb/i.test(m[2] || "") ? +m[1] * 1000 : +m[1];
}
function exCap(c) { c = String(c || "").trim(); return /^\d+$/.test(c) ? c + " GB" : c.replace(/\s*gb$/i, " GB").replace(/\s*tb$/i, " TB"); }
function exEsc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* Catálogo completo: { upc: {modelo,color,capacidad,seccion} } sin las "Caja AppleCare+" */
function exCatalogo() {
  const out = {};
  const esc = (typeof ESCANER_DATA !== "undefined" && ESCANER_DATA) || {};
  Object.keys(esc).forEach(k => {
    const v = esc[k];
    if (!v || /^caja\b/i.test(v.modelo || "")) return;
    out[k] = { modelo: v.modelo || "", color: v.color || "", capacidad: v.capacidad || "", seccion: exSeccion(v.modelo) };
  });
  if (typeof bodegaExtra === "function") {
    const ex = bodegaExtra();
    Object.keys(ex).forEach(k => { out[k] = { modelo: ex[k].modelo || "Código nuevo", color: ex[k].color || "", capacidad: ex[k].capacidad || "", seccion: exSeccion(ex[k].modelo) }; });
  }
  return out;
}

/* ---- Separar "MacBook Pro 14" + M5 · 16 GB · CPU 10 · GPU 10" para que cada configuración sea su propia tarjeta ---- */
function exParse(modelo, seccion) {
  const m = String(modelo || "").trim();
  if (seccion !== "Mac") return { titulo: m, spec: "" };
  const chipRe = /\b(A\d{2}(?:\s*Pro)?|M\d(?:\s*(?:Pro|Max|Ultra))?)\b/i;
  const cm = m.match(chipRe);
  if (!cm) return { titulo: m, spec: "" };
  let titulo = m.slice(0, cm.index).replace(/[\/\-–]\s*$/, "").trim();
  let resto = m.slice(cm.index + cm[0].length);
  const ram = (resto.match(/(\d+)\s*GB/i) || [])[1], cpu = (resto.match(/CPU\s*(\d+)/i) || [])[1], gpu = (resto.match(/GPU\s*(\d+)/i) || [])[1];
  const extra = resto.replace(/(\d+)\s*GB/ig, "").replace(/CPU\s*\d+/ig, "").replace(/GPU\s*\d+/ig, "").replace(/[\/\-–]+/g, " ").replace(/\s+/g, " ").trim();
  titulo = titulo.replace(/macbook\s*pro/i, "MacBook Pro").replace(/macbook\s*air/i, "MacBook Air").replace(/macbook\s*neo/i, "MacBook Neo")
    .replace(/^imac\s*(de\s*)?/i, "iMac ").replace(/mac\s*mini/i, "Mac mini").replace(/mac\s*studio/i, "Mac Studio").replace(/\s+/g, " ").trim();
  titulo = titulo.replace(/\b(\d{2})\s*"?$/, '$1"');
  const cp = cm[1].replace(/\s+/g, " ").replace(/\bpro\b/i, "Pro").replace(/\bmax\b/i, "Max").replace(/\bultra\b/i, "Ultra").toUpperCase().replace(/ PRO/, " Pro").replace(/ MAX/, " Max").replace(/ ULTRA/, " Ultra");
  const spec = [cp, ram && ram + " GB", cpu && "CPU " + cpu, gpu && "GPU " + gpu, extra].filter(Boolean).join(" · ");
  return { titulo, spec };
}
/* Precios de lista (opcional): datos/precios_existencias.json  →  { "<UPC>": 13999 }  o por modelo exacto: { "modelo|capacidad": 13999 } */
let EX_PRECIOS = null;
function exCargaPrecios() {
  if (EX_PRECIOS) return;
  EX_PRECIOS = {};
  try { fetch("datos/precios_existencias.json", { cache: "no-store" }).then(r => r.ok ? r.json() : {}).then(j => { EX_PRECIOS = j || {}; window.dispatchEvent(new Event("ex-precios")); }).catch(() => {}); } catch (_) {}
}
function exPrecio(i) {
  const p = EX_PRECIOS || {};
  const v = p[i.upc] != null ? p[i.upc] : p[i.modelo + "|" + exCap(i.capacidad)];
  return typeof v === "number" ? v : null;
}
function exMoney(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

function exEstilos() {
  if (document.getElementById("exEstilos")) document.getElementById("exEstilos").remove();
  const st = document.createElement("style"); st.id = "exEstilos";
  st.textContent = `
  .ex-wrap,.ex-conf,.ex-toast,.ex-sheet{ --bx-card:#fff; --bx-fill:#e8e8ed; --bx-band:#e3e3e8; --bx-line:rgba(60,60,67,.22); --bx-green:#17803a; --bx-greenbg:rgba(52,199,89,.2); --bx-orange:#a65f00; --bx-orangebg:rgba(255,159,10,.22); --bx-red:#d1261b; --bx-redbg:rgba(255,69,58,.16); --bx-cap:#0a6fd8; }
  html[data-mode="dark"] .ex-wrap, html[data-mode="dark"] .ex-conf, html[data-mode="dark"] .ex-toast, html[data-mode="dark"] .ex-sheet{ --bx-card:#1c1c1e; --bx-fill:#2c2c2e; --bx-band:#3a3a3c; --bx-line:rgba(255,255,255,.16); --bx-green:#30d158; --bx-greenbg:rgba(48,209,88,.2); --bx-orange:#ffb340; --bx-orangebg:rgba(255,159,10,.24); --bx-red:#ff6259; --bx-redbg:rgba(255,69,58,.24); --bx-cap:#64b5ff; }
  .ex-wrap{ padding-bottom:60px; }
  .ex-car{ display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x proximity; padding:4px 2px 14px; margin:0 -2px; scrollbar-width:none; -webkit-overflow-scrolling:touch; transition:opacity .2s; }
  .ex-car::-webkit-scrollbar{ display:none; }
  .ex-car.off{ opacity:.45; }
  .ex-tile{ flex:0 0 21.5%; min-width:76px; height:118px; scroll-snap-align:start; border:1px solid var(--bx-line); border-radius:18px; background:var(--bx-card); color:var(--text); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font:inherit; padding:8px 4px; transition:transform .15s; }
  .ex-tile:active{ transform:scale(.96); }
  .ex-tile b{ font-size:15.5px; font-weight:700; letter-spacing:-.01em; }
  .ex-tile small{ font-size:11.5px; font-weight:700; opacity:.7; margin-top:-3px; }
  .ex-ti{ position:relative; width:50px; height:50px; display:grid; place-items:center; color:var(--c1); }
  .ex-ti svg{ width:42px; height:42px; }
  .ex-ti img, .ex-pic img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
  .ex-ti.has svg, .ex-pic.has svg{ visibility:hidden; }
  .ex-tile.on{ background:linear-gradient(160deg,var(--c1),var(--c2)); border-color:transparent; color:#fff; box-shadow:0 6px 16px color-mix(in srgb,var(--c2) 40%, transparent); }
  .ex-tile.on .ex-ti{ color:#fff; }
  .ex-search{ margin:4px 0 6px; position:relative; }
  .ex-search svg{ position:absolute; left:14px; top:50%; width:20px; height:20px; margin-top:-10px; fill:none; stroke:var(--text-secondary); stroke-width:1.9; stroke-linecap:round; }
  .ex-search input{ width:100%; box-sizing:border-box; padding:14px 14px 14px 44px; border-radius:15px; border:0; font-size:16px; background:var(--bx-fill); color:var(--text); }
  .ex-metar{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0 4px 2px; }
  .ex-meta{ margin:0; font-size:12.5px; color:var(--text-secondary); }
  .ex-btns{ display:flex; gap:6px; }
  .ex-todo{ border:0; background:none; color:var(--accent); font:inherit; font-size:13.5px; font-weight:700; padding:6px 6px; }
  .ex-ventas{ border:0; background:var(--bx-fill); color:var(--text); font:inherit; font-size:13px; font-weight:700; padding:6px 12px; border-radius:999px; }
  .ex-apbtn{ border:0; background:none; color:var(--text-secondary); display:inline-flex; align-items:center; gap:3px; padding:6px 6px; font:inherit; font-size:12px; font-weight:700; opacity:.75; }
  .ex-apbtn svg{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linejoin:round; }
  .ex-apr{ padding:12px 4px; border-top:1px solid var(--bx-line); }
  .ex-apr b{ display:block; font-size:16px; } .ex-apr span{ display:block; font-size:13px; color:var(--text-secondary); margin-top:2px; }
  .ex-apr .fol{ display:inline-block; font-weight:800; color:var(--text); background:var(--bx-fill); border-radius:8px; padding:2px 8px; margin-top:5px; font-size:12.5px; }
  .ex-aps{ width:100%; box-sizing:border-box; padding:11px 14px; border-radius:12px; border:0; font-size:15.5px; background:var(--bx-fill); color:var(--text); margin:0 0 6px; }
  .ex-hint{ margin:0 4px 6px; font-size:12px; color:var(--text-secondary); }
  /* encabezado de categoría (igual que la captura) */
  .ex-sec{ margin:22px 4px 14px; display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
  .ex-sec h3{ margin:0; font-size:34px; font-weight:800; letter-spacing:-.025em; }
  .ex-sec em{ font-style:normal; font-size:18px; font-weight:700; color:var(--text-secondary); }
  /* tarjeta de configuración */
  .ex-model{ background:var(--bx-card); border:1px solid var(--bx-line); border-radius:26px; margin:14px 0; overflow:hidden; }
  .ex-mh{ display:flex; align-items:center; gap:14px; width:100%; border:0; background:none; font:inherit; color:var(--text); text-align:left; padding:16px 16px; }
  .ex-pic{ position:relative; flex:0 0 66px; width:66px; height:66px; border-radius:18px; display:grid; place-items:center; color:var(--text); background:var(--bx-fill); }
  .ex-pic > svg{ width:34px; height:34px; }
  .ex-pic img{ inset:5px; width:calc(100% - 10px); height:calc(100% - 10px); }
  .ex-mt{ flex:1; min-width:0; }
  .ex-mt strong{ display:block; font-size:21px; font-weight:800; letter-spacing:-.015em; line-height:1.15; }
  .ex-mt .spec{ display:block; margin-top:4px; font-size:14.5px; font-weight:600; line-height:1.3; color:var(--text-secondary); }
  .ex-mt .sub{ display:flex; align-items:center; gap:8px; margin-top:8px; font-size:15px; font-weight:600; color:var(--text-secondary); }
  .ex-sws{ display:inline-flex; }
  .ex-sws i{ width:20px; height:20px; border-radius:50%; border:2px solid var(--bx-card); box-shadow:0 0 0 1px rgba(120,120,128,.45); margin-left:-7px; }
  .ex-sws i:first-child{ margin-left:0; }
  .ex-badge{ min-width:56px; text-align:center; font-weight:800; font-size:26px; line-height:1; padding:10px 14px; border-radius:15px; background:var(--bx-greenbg); color:var(--bx-green); flex:0 0 auto; }
  .ex-badge small{ display:block; font-size:10.5px; font-weight:800; letter-spacing:.05em; margin-top:4px; }
  .ex-badge.low{ background:var(--bx-orangebg); color:var(--bx-orange); }
  .ex-badge.zero{ background:var(--bx-redbg); color:var(--bx-red); }
  .ex-chev{ width:10px; height:10px; border-right:2.5px solid var(--text-secondary); border-bottom:2.5px solid var(--text-secondary); transform:rotate(45deg); transition:transform .2s; margin:0 6px 4px 2px; flex:0 0 auto; }
  .ex-model.open .ex-chev{ transform:rotate(-135deg); margin-bottom:-4px; }
  .ex-rows{ display:none; border-top:1px solid var(--bx-line); }
  .ex-model.open .ex-rows{ display:block; }
  /* franja de capacidad */
  .ex-capbar{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:15px 16px; background:var(--bx-band); border-top:1px solid var(--bx-line); border-bottom:1px solid var(--bx-line); }
  .ex-rows .ex-capbar:first-child{ border-top:0; }
  .ex-capbar b{ font-size:21px; font-weight:800; letter-spacing:-.01em; }
  .ex-capbar span{ font-size:15px; font-weight:600; color:var(--text-secondary); text-align:right; }
  /* renglón (deslizable a la izquierda = Vendido) */
  .ex-sw{ position:relative; overflow:hidden; border-top:1px solid var(--bx-line); }
  .ex-capbar + .ex-sw{ border-top:0; }
  .ex-sell{ position:absolute; top:0; right:0; bottom:0; width:104px; border:0; background:#34c759; color:#fff; font:inherit; font-weight:700; font-size:14.5px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; }
  .ex-sell svg{ width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; }
  .ex-row{ display:flex; align-items:center; gap:14px; padding:14px 16px; }
  .ex-sw .ex-row{ position:relative; background:var(--bx-card); transition:transform .22s ease; touch-action:pan-y; user-select:none; -webkit-user-select:none; }
  .ex-sw .ex-row.drag{ transition:none; }
  .ex-dot{ width:36px; height:36px; border-radius:50%; flex:0 0 auto; border:1px solid rgba(120,120,128,.45); box-shadow:inset 0 -6px 9px rgba(0,0,0,.16), inset 0 3px 6px rgba(255,255,255,.3); }
  .ex-info{ flex:1; min-width:0; }
  .ex-info .col{ display:block; font-weight:700; font-size:19px; letter-spacing:-.01em; line-height:1.2; }
  .ex-upc{ display:block; margin-top:3px; font:14px ui-monospace,Menlo,monospace; color:var(--text-secondary); letter-spacing:.02em; }
  .ex-apa{ display:inline-flex; align-items:center; gap:4px; margin-top:6px; font-size:12px; font-weight:700; color:var(--bx-cap); background:rgba(10,132,255,.16); padding:3px 9px 3px 6px; border-radius:999px; }
  .ex-apa svg{ width:12px; height:12px; fill:currentColor; stroke:currentColor; stroke-width:1.4; stroke-linejoin:round; }
  /* ===== diseño más resaltado ===== */
  .ex-car{ gap:12px; padding:6px 4px 18px; }
  .ex-tile{ flex:0 0 24%; min-width:84px; height:132px; border-radius:24px; border:1.5px solid color-mix(in srgb,var(--c1) 38%, var(--bx-line)); gap:8px;
    background:linear-gradient(165deg, color-mix(in srgb,var(--c1) 16%, var(--bx-card)), color-mix(in srgb,var(--c2) 5%, var(--bx-card)));
    box-shadow:0 8px 18px color-mix(in srgb,var(--c2) 16%, transparent), inset 0 1px 0 rgba(255,255,255,.35); }
  .ex-ti{ width:54px; height:54px; border-radius:18px; background:linear-gradient(150deg, color-mix(in srgb,var(--c1) 26%, transparent), color-mix(in srgb,var(--c2) 10%, transparent)); }
  .ex-ti svg{ width:34px; height:34px; }
  .ex-tile b{ font-size:16px; font-weight:800; }
  .ex-tile small{ font-size:11.5px; font-weight:700; opacity:.75; }
  .ex-tile.on{ background:linear-gradient(160deg,var(--c1),var(--c2)); box-shadow:0 12px 26px color-mix(in srgb,var(--c2) 48%, transparent), inset 0 1px 0 rgba(255,255,255,.4); transform:translateY(-3px); }
  .ex-tile.on .ex-ti{ background:rgba(255,255,255,.2); }
  .ex-tile.on small{ opacity:.9; }
  .ex-sec{ margin:26px 4px 14px; }
  .ex-sec h3{ font-size:36px; font-weight:850; }
  .ex-model{ border-radius:24px; border:1px solid var(--bx-line); margin:16px 0; position:relative; background:var(--bx-card);
    box-shadow:0 1px 2px rgba(0,0,0,.06), 0 6px 18px rgba(0,0,0,.07); }
  html[data-mode="dark"] .ex-model{ box-shadow:0 1px 2px rgba(0,0,0,.4), 0 6px 18px rgba(0,0,0,.35); }
  .ex-mh{ padding:18px 16px; }
  .ex-pic{ flex:0 0 72px; width:72px; height:72px; border-radius:20px; background:var(--bx-fill); color:var(--text); }
  .ex-pic > svg{ width:38px; height:38px; }
  .ex-mt strong{ font-size:23px; font-weight:850; }
  .ex-mt .spec{ font-size:14.5px; font-weight:650; }
  .ex-badge.hid{ background:var(--bx-fill); color:var(--text-secondary); padding:13px 16px; min-width:58px; }
  .ex-badge.hid.ok{ background:var(--bx-greenbg); color:var(--bx-green); }
  .ex-badge.hid.low{ background:var(--bx-orangebg); color:var(--bx-orange); }
  .ex-badge svg{ width:28px; height:28px; display:block; margin:0 auto; }
  .ex-badge[data-eye]{ cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .ex-ojo{ border:0; background:var(--bx-fill); color:var(--text); width:44px; height:34px; border-radius:999px; display:grid; place-items:center; padding:0; }
  .ex-ojo svg{ width:23px; height:23px; }
  .ex-ojo.on{ background:var(--accent); color:#fff; }
  /* franjas de capacidad: negras, con acento de color */
  .ex-capbar{ background:linear-gradient(90deg,#141416,#2a2a2f 70%,#1d1d20); border-top:0; border-bottom:0; padding:16px 18px; }
  .ex-capbar b{ color:#fff; font-size:22px; font-weight:850; letter-spacing:-.01em; display:flex; align-items:center; gap:10px; }
  .ex-capbar span{ color:rgba(255,255,255,.72); font-size:14.5px; font-weight:650; }
  html[data-mode="dark"] .ex-capbar{ background:linear-gradient(90deg,#000,#242428 70%,#101012); }
  .ex-apa.demo{ color:#1c8da3; background:rgba(48,176,199,.2); margin-left:6px; }
  html[data-mode="dark"] .ex-apa.demo{ color:#5fd0e4; }
  .ex-price{ font-size:19px; font-weight:800; letter-spacing:-.01em; white-space:nowrap; }
  .ex-ago-b{ margin:22px 4px 6px; }
  .ex-ago-b summary{ list-style:none; display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-radius:16px; background:var(--bx-redbg); color:var(--bx-red); font-weight:800; font-size:16px; }
  .ex-ago-b summary::-webkit-details-marker{ display:none; }
  .ex-ago-b[open] summary{ margin-bottom:4px; }
  .ex-vacio{ text-align:center; padding:34px 18px; color:var(--text-secondary); line-height:1.5; }
  .ex-vacio b{ display:block; font-size:18px; color:var(--text); margin-bottom:6px; }
  /* confirmación de venta */
  .ex-conf-bg{ position:fixed; inset:0; z-index:80; background:rgba(0,0,0,.5); display:flex; align-items:flex-end; justify-content:center; }
  .ex-conf{ width:100%; max-width:560px; background:var(--bx-card); color:var(--text); border-radius:24px 24px 0 0; padding:22px 18px calc(20px + var(--safe-bottom, 0px)); }
  .ex-conf h3{ margin:0 0 12px; font-size:22px; letter-spacing:-.01em; text-align:center; }
  .ex-conf-it{ display:flex; align-items:center; gap:12px; background:var(--bx-fill); border-radius:16px; padding:12px 14px; margin-bottom:10px; }
  .ex-conf-it b{ display:block; font-size:16.5px; line-height:1.25; }
  .ex-conf-it small{ display:block; margin-top:2px; font-size:13px; color:var(--text-secondary); }
  .ex-conf-q{ text-align:center; font-size:15px; color:var(--text-secondary); margin:0 0 16px; }
  .ex-conf-q b{ color:var(--text); }
  .ex-conf-b{ display:grid; grid-template-columns:1fr 1.4fr; gap:10px; }
  .ex-conf-b button{ border:0; border-radius:15px; padding:16px 8px; font:inherit; font-size:17px; font-weight:700; background:var(--bx-fill); color:var(--text); }
  .ex-conf-b button.si{ background:#34c759; color:#fff; }
  .ex-toast{ position:fixed; left:50%; bottom:calc(24px + var(--safe-bottom, 0px)); transform:translateX(-50%); z-index:90; display:flex; align-items:center; gap:14px; background:#1c1c1e; color:#fff; border-radius:16px; padding:12px 16px; font-size:14.5px; box-shadow:0 10px 30px rgba(0,0,0,.35); max-width:calc(100% - 28px); }
  .ex-toast button{ border:0; background:none; color:#64b5ff; font:inherit; font-weight:700; padding:2px 4px; }
  /* ventas recientes (deshacer tardío) */
  .ex-sheet-bg{ position:fixed; inset:0; z-index:80; background:rgba(0,0,0,.5); display:flex; align-items:flex-end; justify-content:center; }
  .ex-sheet{ width:100%; max-width:560px; max-height:82vh; overflow:auto; background:var(--bx-card); color:var(--text); border-radius:24px 24px 0 0; padding:18px 16px calc(20px + var(--safe-bottom, 0px)); }
  .ex-sheet h3{ margin:0 0 4px; font-size:22px; text-align:center; }
  .ex-sheet > p{ margin:0 0 14px; text-align:center; font-size:13px; color:var(--text-secondary); }
  .ex-vr{ display:flex; align-items:center; gap:12px; padding:12px 4px; border-top:1px solid var(--bx-line); }
  .ex-vr .ex-info .col{ font-size:16px; }
  .ex-vr small{ display:block; font-size:12.5px; color:var(--text-secondary); margin-top:2px; }
  .ex-vr button{ border:0; border-radius:12px; padding:10px 14px; font:inherit; font-weight:800; font-size:14px; background:#ff9f0a; color:#1c1c1e; }
  .ex-vr.hecha{ opacity:.55; }
  .ex-vr.hecha button{ display:none; }
  `;
  document.head.appendChild(st);
}

/* Ojo estilo SF Symbols (iOS): "eye.slash" = oculto, "eye" = visible */
const EX_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 12S6.2 6.2 12 6.2 21.2 12 21.2 12 17.8 17.8 12 17.8 2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.9"/><path d="M4.6 20 19.4 4"/></svg>';
const EX_EYE_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 12S6.2 6.2 12 6.2 21.2 12 21.2 12 17.8 17.8 12 17.8 2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.9" fill="currentColor" stroke="none"/></svg>';
const EX_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function buildExistencias() {
  exEstilos(); exCargaPrecios();
  const wrap = document.createElement("div");
  wrap.className = "ex-wrap";
  const cat = exCatalogo();
  const bod = (typeof bodegaLoad === "function") ? bodegaLoad() : { stock: {}, fecha: "" };
  const stock = bod.stock || {};
  let apart = (typeof bodegaApartados === "function") ? bodegaApartados() : {};
  let demo = (typeof bodegaDemo === "function") ? bodegaDemo() : {};   // piezas de demostración (dentro de la existencia de bodega)
  const libre = k => Math.max(0, (stock[k] || 0) - (demo[k] || 0));    // lo que se muestra: bodega − demostración

  const todos = {};
  Object.keys(cat).forEach(k => { todos[k] = cat[k]; });
  Object.keys(stock).forEach(k => { if (!todos[k]) todos[k] = { modelo: "Código nuevo", color: "", capacidad: "", seccion: "Otros" }; });

  let disp = [], agot = [];
  function calc() {
    disp = []; agot = [];
    demo = (typeof bodegaDemo === "function") ? bodegaDemo() : {};
    apart = (typeof bodegaApartados === "function") ? bodegaApartados() : {};
    Object.keys(todos).forEach(k => {
      const p = exParse(todos[k].modelo, todos[k].seccion);
      const it = { upc: k, ...todos[k], titulo: p.titulo, spec: p.spec, qty: libre(k), demo: Math.min(demo[k] || 0, stock[k] || 0) };
      (it.qty > 0 ? disp : agot).push(it);
    });
  }
  calc();
  const cmp = (a, b) => exCapNum(a.capacidad) - exCapNum(b.capacidad) || (a.capacidad || "").localeCompare(b.capacidad || "") || a.color.localeCompare(b.color);
  const ordenModelos = (ms) => ms.sort((a, b) => (typeof BODEGA_ORDEN !== "undefined" ? (BODEGA_ORDEN.indexOf(a) < 0 ? 99 : BODEGA_ORDEN.indexOf(a)) - (BODEGA_ORDEN.indexOf(b) < 0 ? 99 : BODEGA_ORDEN.indexOf(b)) : 0) || a.localeCompare(b, undefined, { numeric: true }));

  const tieneSec = id => disp.some(i => i.seccion === id) || agot.some(i => i.seccion === id);
  const secs = EX_SECCIONES.filter(s => s.id !== "Otros" || tieneSec("Otros"));
  let filtro = (secs.find(s => tieneSec(s.id)) || secs[0]).id, texto = "";
  const abiertos = new Set();
  /* Las piezas se esconden (ojo cerrado). Un toque en cualquier ojo las muestra 12 s y se vuelven a esconder solas. */
  let ver = false, verT = null;
  const rev = new Set(), revT = {};   // ojos individuales: "u:<upc>" (color) o "m:<configuración>" (tarjeta)
  const visto = k => ver || rev.has(k);
  const piezasSec = id => disp.filter(i => i.seccion === id).reduce((s, i) => s + i.qty, 0);   // solo se usa en el encabezado de la lista

  wrap.innerHTML = `
    <div class="ex-car" id="exCar"></div>
    <div class="ex-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="exBuscar" type="search" placeholder="Buscar modelo, color, tamaño o UPC" autocomplete="off"></div>
    <div class="ex-metar"><p class="ex-meta">${Object.keys(stock).length ? "Bodega" + (bod.fecha ? " · lista del " + exEsc(bod.fecha) : "") : "Sin datos de bodega todavía"}</p><div class="ex-btns"><button class="ex-ojo" id="exOjo" type="button" aria-label="Mostrar u ocultar piezas">${EX_EYE_OFF}</button><button class="ex-apbtn" id="exAp" type="button" aria-label="Ver apartados"><svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-3.5L7 20z"/></svg><span id="exApN"></span></button><button class="ex-ventas" id="exVentas" type="button">Ventas</button><button class="ex-todo" id="exTodo" type="button">Abrir todo</button></div></div>
    <p class="ex-hint">Toca una configuración para ver capacidades y colores. Desliza un renglón a la izquierda para marcarlo como vendido.</p>
    <div id="exLista"></div>`;

  const car = wrap.querySelector("#exCar"), lista = wrap.querySelector("#exLista");
  function pintaCar() {
    car.innerHTML = secs.map(s => {
      return `<button class="ex-tile${s.id === filtro && !texto ? " on" : ""}" data-f="${exEsc(s.id)}" style="--c1:${s.c1};--c2:${s.c2}"><span class="ex-ti">${exIcono(s.id)}${exImg(s.id)}</span><b>${exEsc(s.label || s.id)}</b></button>`; }).join("");
    car.classList.toggle("off", !!texto);
  }
  car.addEventListener("click", e => {
    const t = e.target.closest(".ex-tile"); if (!t) return;
    filtro = t.dataset.f; texto = ""; wrap.querySelector("#exBuscar").value = "";
    pintaCar(); pintaLista();
    const nt = car.querySelector(".ex-tile.on"); if (nt) nt.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  });

  const coincide = (i) => {
    if (!texto) return true;
    const t = texto.toLowerCase();
    return (i.titulo + " " + i.spec + " " + i.modelo + " " + i.color + " " + i.capacidad + " " + i.upc).toLowerCase().includes(t);
  };
  const apaHtml = (n, u) => n > 0 ? `<span class="ex-apa" data-ap="${exEsc(u || "")}"><svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-3.5L7 20z"/></svg>${n} apartado${n === 1 ? "" : "s"}</span>` : "";
  const demoHtml = (n) => n > 0 ? `<span class="ex-apa demo"><svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="11.5" rx="2" fill="none"/><path d="M8 20h8M12 16v4" fill="none"/></svg>${n} en demostración</span>` : "";
  const badge = (q, k, sec) => {
    if (q <= 0) return `<div class="ex-badge zero"><small>AGOTADO</small></div>`;
    const poca = q <= exPocas(sec);
    if (!visto(k)) return `<div class="ex-badge hid ${poca ? "low" : "ok"}" data-eye="${exEsc(k)}" role="button" aria-label="Mostrar piezas">${EX_EYE_OFF}</div>`;
    return poca ? `<div class="ex-badge low" data-eye="${exEsc(k)}" role="button">${q}<small>POCAS</small></div>` : `<div class="ex-badge" data-eye="${exEsc(k)}" role="button">${q}</div>`;
  };
  const fila = (i) => {
    const pr = exPrecio(i);
    const row = `<div class="ex-row" data-u="${i.upc}">
      <div class="ex-dot" style="background:${exColor(i.color)}"></div>
      <div class="ex-info"><span class="col">${exEsc(i.color || "Sin color")}</span><span class="ex-upc">${exEsc(i.upc)}</span>${i.qty > 0 ? apaHtml(apart[i.upc] || 0, i.upc) : ""}${demoHtml(i.demo)}</div>
      ${pr != null ? `<span class="ex-price">${exMoney(pr)}</span>` : ""}
      ${badge(i.qty, "u:" + i.upc, i.seccion)}
    </div>`;
    return i.qty > 0 ? `<div class="ex-sw"><button class="ex-sell" type="button" data-u="${i.upc}" tabindex="-1">${EX_CHECK}Vendido</button>${row}</div>` : row;
  };
  /* filas agrupadas por capacidad, con su franja "256 GB · 3 colores · 18 pzas" */
  const bloques = (items) => {
    const por = {};
    items.sort(cmp).forEach(i => { const k = i.capacidad ? exCap(i.capacidad) : ""; (por[k] = por[k] || []).push(i); });
    return Object.keys(por).map(k => {
      const l = por[k], pz = l.reduce((s, i) => s + i.qty, 0), nc = new Set(l.map(i => i.color)).size;
      return (k ? `<div class="ex-capbar"><b>${exEsc(k)}</b><span>${nc} color${nc === 1 ? "" : "es"}${ver && pz ? " · " + pz + (pz === 1 ? " pza" : " pzas") : ""}</span></div>` : "") + l.map(fila).join("");
    }).join("");
  };
  /* tarjeta por configuración (titulo + spec) */
  const tarjeta = (clave, items, sec) => {
    const tot = items.reduce((s, i) => s + i.qty, 0), colores = [...new Set(items.map(i => i.color))];
    const abierto = texto || abiertos.has(clave);
    const p = items[0];
    return `<div class="ex-model${abierto ? " open" : ""}" data-m="${exEsc(clave)}" style="--c1:${sec.c1};--c2:${sec.c2}">
      <button class="ex-mh" type="button"><div class="ex-pic">${exIcono(sec.id)}${exImg(p.titulo)}</div>
        <div class="ex-mt"><strong>${exEsc(p.titulo)}</strong>${p.spec ? `<span class="spec">${exEsc(p.spec)}</span>` : ""}<div class="sub"><span class="ex-sws">${colores.slice(0, 6).map(c => `<i style="background:${exColor(c)}"></i>`).join("")}</span><span>${colores.length} color${colores.length === 1 ? "" : "es"}</span></div></div>
        ${badge(tot, "m:" + clave, sec.id)}<i class="ex-chev"></i></button>
      <div class="ex-rows">${bloques(items)}</div></div>`;
  };
  const agrupa = (lista) => {
    const o = {};
    lista.forEach(i => { (o[i.titulo + "||" + i.spec] = o[i.titulo + "||" + i.spec] || []).push(i); });
    return o;
  };
  const ordIdx = (m) => typeof BODEGA_ORDEN !== "undefined" ? (BODEGA_ORDEN.indexOf(m) < 0 ? 99 : BODEGA_ORDEN.indexOf(m)) : 0;
  const ordenClaves = (g) => Object.keys(g).sort((a, b) => ordIdx(g[a][0].modelo) - ordIdx(g[b][0].modelo) || a.localeCompare(b, undefined, { numeric: true }));

  function pintaLista() {
    const f = texto ? "Todo" : filtro;
    const sel = (l) => l.filter(i => coincide(i) && (f === "Todo" || i.seccion === f));
    const d = sel(disp), a = sel(agot);
    let html = "";
    EX_SECCIONES.forEach(sec => {
      const ds = d.filter(i => i.seccion === sec.id); if (!ds.length) return;
      const g = agrupa(ds), piezas = ds.reduce((s, i) => s + i.qty, 0);
      html += `<div class="ex-sec" style="--c1:${sec.c1};--c2:${sec.c2}"><h3>${exEsc(sec.label || sec.id)}</h3><em>${ver ? piezas + " pzas" : Object.keys(g).length + " modelo" + (Object.keys(g).length === 1 ? "" : "s")}</em></div>`;
      ordenClaves(g).forEach(k => { html += tarjeta(k, g[k], sec); });
    });
    if (!html) {
      html = !Object.keys(stock).length
        ? `<div class="ex-vacio"><b>Aún no hay existencias</b>Escanea el listado en Bodega (mantén presionado “Registros”) y aquí aparecerá todo ordenado.</div>`
        : `<div class="ex-vacio"><b>Nada disponible aquí</b>${texto ? "Prueba con otra búsqueda." : "Esta sección no tiene piezas en bodega."}</div>`;
    }
    if (a.length) {
      let h2 = "";
      EX_SECCIONES.forEach(sec => {
        const as = a.filter(i => i.seccion === sec.id); if (!as.length) return;
        const g = agrupa(as);
        ordenClaves(g).forEach(k => { h2 += tarjeta(k, g[k], sec); });
      });
      const nMod = new Set(a.map(i => i.titulo + "||" + i.spec)).size;
      html += `<details class="ex-ago-b"${texto ? " open" : ""}><summary><span>Agotados</span><span>${nMod} configuraciones</span></summary>${h2}</details>`;
    }
    lista.innerHTML = html;
    abierto = null;
    const bt = wrap.querySelector("#exTodo");
    const cards = [...lista.querySelectorAll(".ex-model")];
    bt.hidden = !cards.length;
    bt.textContent = cards.length && cards.every(c => c.classList.contains("open")) ? "Cerrar todo" : "Abrir todo";
  }
  window.addEventListener("ex-precios", () => { if (wrap.isConnected) pintaLista(); }, { once: true });

  /* ---- abrir / cerrar ---- */
  const setVer = v => {
    ver = v; clearTimeout(verT);
    if (v) verT = setTimeout(() => { if (wrap.isConnected) setVer(false); }, 12000);
    const o = wrap.querySelector("#exOjo"); if (o) { o.innerHTML = v ? EX_EYE_ON : EX_EYE_OFF; o.classList.toggle("on", v); }
    pintaCar(); pintaLista();
  };
  wrap.querySelector("#exOjo").addEventListener("click", () => { rev.clear(); Object.keys(revT).forEach(k => { clearTimeout(revT[k]); delete revT[k]; }); setVer(!ver); });
  /* ojo individual: solo muestra/oculta ese color o esa tarjeta */
  const toggleRev = k => {
    if (ver) {   // venía de "ver todo": se apaga y se conservan visibles los demás
      const otros = [...lista.querySelectorAll("[data-eye]")].map(n => n.dataset.eye).filter(x => x !== k);
      setVer(false); otros.forEach(x => rev.add(x)); rev.delete(k);
    } else if (rev.has(k)) rev.delete(k); else rev.add(k);
    clearTimeout(revT[k]); delete revT[k];
    if (rev.has(k)) revT[k] = setTimeout(() => { rev.delete(k); delete revT[k]; if (wrap.isConnected) pintaLista(); }, 12000);
    pintaLista();
  };
  lista.addEventListener("click", e => {
    const ap = e.target.closest("[data-ap]"); if (ap) { e.stopPropagation(); abreApart(ap.dataset.ap); return; }
    const ey = e.target.closest("[data-eye]"); if (ey) { e.stopPropagation(); toggleRev(ey.dataset.eye); return; }
    const h = e.target.closest(".ex-mh"); if (!h) return;
    const card = h.parentNode, m = card.dataset.m;
    card.classList.toggle("open");
    if (card.classList.contains("open")) abiertos.add(m); else abiertos.delete(m);
    const cards = [...lista.querySelectorAll(".ex-model")];
    wrap.querySelector("#exTodo").textContent = cards.every(c => c.classList.contains("open")) ? "Cerrar todo" : "Abrir todo";
  });
  wrap.querySelector("#exTodo").addEventListener("click", () => {
    const cards = [...lista.querySelectorAll(".ex-model")], abrir = !cards.every(c => c.classList.contains("open"));
    cards.forEach(c => { c.classList.toggle("open", abrir); if (abrir) abiertos.add(c.dataset.m); else abiertos.delete(c.dataset.m); });
    wrap.querySelector("#exTodo").textContent = abrir ? "Cerrar todo" : "Abrir todo";
  });

  /* ---- deslizar a la izquierda = Vendido ---- */
  const W = 104;
  let abierto = null, g = null;
  const cerrar = r => { if (!r) return; r.style.transform = ""; r.classList.remove("drag"); if (abierto === r) abierto = null; };
  lista.addEventListener("pointerdown", e => {
    const r = e.target.closest(".ex-sw .ex-row");
    if (abierto && abierto !== r) cerrar(abierto);
    if (!r) return;
    g = { r, x: e.clientX, y: e.clientY, base: abierto === r ? -W : 0, lock: false, tx: abierto === r ? -W : 0, id: e.pointerId };
  });
  lista.addEventListener("pointermove", e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.lock) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      g.lock = true; g.r.classList.add("drag");
      try { g.r.setPointerCapture(e.pointerId); } catch (_) {}
    }
    g.tx = Math.max(-W * 1.7, Math.min(0, g.base + dx));
    g.r.style.transform = `translateX(${g.tx}px)`;
  });
  const fin = e => {
    if (!g || e.pointerId !== g.id) return;
    const { r, lock, tx } = g; g = null;
    r.classList.remove("drag");
    if (!lock) { if (abierto === r) cerrar(r); return; }
    if (e.type === "pointercancel") { cerrar(r); return; }
    if (tx < -W * 1.5) { cerrar(r); pedirVenta(r.dataset.u); }
    else if (tx < -W * 0.45) { r.style.transform = `translateX(${-W}px)`; abierto = r; }
    else cerrar(r);
  };
  lista.addEventListener("pointerup", fin);
  lista.addEventListener("pointercancel", fin);
  lista.addEventListener("click", e => {
    const b = e.target.closest(".ex-sell"); if (!b) return;
    cerrar(abierto); pedirVenta(b.dataset.u);
  });

  /* ---- confirmar venta: descuenta 1 pieza de la bodega ---- */
  function pedirVenta(upc) {
    const it = todos[upc], q = libre(upc); if (!it || q <= 0) return;
    const bg = document.createElement("div"); bg.className = "ex-conf-bg";
    bg.innerHTML = `<div class="ex-conf"><h3>¿Vendiste este producto?</h3>
      <div class="ex-conf-it"><div class="ex-dot" style="background:${exColor(it.color)}"></div><div><b>${exEsc(it.modelo)}</b><small>${exEsc([it.color, it.capacidad && exCap(it.capacidad)].filter(Boolean).join(" · "))}</small><small style="font-family:ui-monospace,Menlo,monospace">UPC ${exEsc(upc)}</small></div></div>
      <p class="ex-conf-q">Pasará de <b>${q}</b> a <b>${q - 1}</b> pieza${q - 1 === 1 ? "" : "s"} en bodega.</p>
      <div class="ex-conf-b"><button type="button" data-n>No</button><button type="button" class="si" data-s>Sí, vendido</button></div></div>`;
    document.body.appendChild(bg);
    const cierra = () => bg.remove();
    bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-n]")) cierra(); });
    bg.querySelector("[data-s]").addEventListener("click", () => { cierra(); vender(upc); });
  }
  function vender(upc) {
    if (typeof bodegaLoad !== "function" || typeof bodegaSave !== "function") return;
    const est = bodegaLoad(), prev = { ...(est.stock || {}) }, q = prev[upc] || 0, dm = Math.min((bodegaDemo()[upc] || 0), q); if (q - dm <= 0) return;
    const nuevo = { ...prev, [upc]: q - 1 };
    let hist = est.historial || [];
    try { hist = bodegaRegistrar(est, prev, nuevo, bodegaCatalogoTodo(prev), "venta", est.fecha); } catch (_) {}
    bodegaSave({ ...est, stock: nuevo, historial: hist });
    stock[upc] = q - 1; calc(); pintaCar(); pintaLista();
    const antesHist = est.historial || [];
    const old = document.querySelector(".ex-toast"); if (old) old.remove();
    const t = document.createElement("div"); t.className = "ex-toast";
    t.innerHTML = `<span>Vendido · quedan ${Math.max(0, q - 1 - dm)}</span><button type="button">Deshacer</button>`;
    document.body.appendChild(t);
    const timer = setTimeout(() => t.remove(), 6000);
    t.querySelector("button").addEventListener("click", () => {
      clearTimeout(timer); t.remove();
      const e2 = bodegaLoad(), s2 = { ...(e2.stock || {}) }; s2[upc] = (s2[upc] || 0) + 1;
      bodegaSave({ ...e2, stock: s2, historial: antesHist });
      stock[upc] = s2[upc]; calc(); pintaCar(); pintaLista();
    });
  }

  /* ---- Apartados: quién, folio, cliente ---- */
  function abreApart(filtroInicial) {
    const nv = (typeof bodegaNV === "function" ? bodegaNV() : []).filter(r => r.tipo === "Apartado");
    const bg = document.createElement("div"); bg.className = "ex-sheet-bg";
    const fechaTxt = ts => { try { return typeof bodegaFechaHora === "function" ? bodegaFechaHora(ts) : ""; } catch (_) { return ""; } };
    bg.innerHTML = `<div class="ex-sheet"><h3>Apartados</h3><p>${nv.reduce((n, r) => n + (+r.qty || 0), 0)} pieza(s) apartada(s)</p>
      <input class="ex-aps" type="search" placeholder="Buscar folio, cliente, quién apartó…" value="${exEsc(filtroInicial || "")}"><div class="ex-apl"></div></div>`;
    const l = bg.querySelector(".ex-apl"), q = bg.querySelector(".ex-aps");
    const pinta = () => {
      const t = q.value.trim().toLowerCase();
      const f = nv.filter(r => { const it = todos[r.code] || {}; return !t || [it.modelo, it.color, it.capacidad, r.code, r.cliente, r.folio, r.quien, r.nota].join(" ").toLowerCase().includes(t); });
      l.innerHTML = f.map(r => {
        const it = todos[r.code] || { modelo: "Código nuevo", color: "", capacidad: "" };
        const l1 = [r.cliente && "Cliente: " + r.cliente, r.quien && "Apartó: " + r.quien, r.ts && fechaTxt(r.ts)].filter(Boolean).join(" · ");
        return `<div class="ex-apr"><b>${exEsc(it.modelo)} ×${+r.qty || 1}</b><span>${exEsc([it.color, it.capacidad && exCap(it.capacidad)].filter(Boolean).join(" · "))}</span>${l1 ? `<span>${exEsc(l1)}</span>` : ""}${r.nota ? `<span style="font-style:italic">${exEsc(r.nota)}</span>` : ""}${r.folio ? `<span class="fol">Folio ${exEsc(r.folio)}</span>` : ""}</div>`;
      }).join("") || `<div class="ex-vacio"><b>${nv.length ? "Sin resultados" : "Sin apartados"}</b>${nv.length ? "Prueba con otra búsqueda." : "Se registran en Bodega → Equipos no vendibles."}</div>`;
    };
    q.addEventListener("input", pinta); pinta();
    bg.addEventListener("click", e => { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg);
  }
  const apN = () => { const n = (typeof bodegaApartados === "function") ? Object.values(bodegaApartados()).reduce((a, b) => a + b, 0) : 0; const e = wrap.querySelector("#exApN"); if (e) e.textContent = n ? n : ""; };
  wrap.querySelector("#exAp").addEventListener("click", () => abreApart(""));
  apN(); window.addEventListener("ishop-remote", apN);

  /* ---- Ventas recientes: deshacer una venta aunque ya pasó tiempo ---- */
  wrap.querySelector("#exVentas").addEventListener("click", async () => {
    try { if (window.ishopCargarHistorial) await Promise.race([window.ishopCargarHistorial(), new Promise(r => setTimeout(r, 3500))]); } catch (_) {}
    const est = bodegaLoad();
    const ventas = (est.historial || []).filter(h => h.origen === "venta").slice(0, 40);
    const bg = document.createElement("div"); bg.className = "ex-sheet-bg";
    const filas = ventas.map(h => {
      const x = (h.items || []).find(i => i.antes > i.ahora); if (!x) return "";
      const it = todos[x.code] || { modelo: "Código nuevo", color: "", capacidad: "" };
      const p = exParse(it.modelo, it.seccion);
      return `<div class="ex-vr${h.deshecha ? " hecha" : ""}"><div class="ex-dot" style="background:${exColor(it.color)}"></div>
        <div class="ex-info"><span class="col">${exEsc(p.titulo)}</span><small>${exEsc([p.spec, it.color, it.capacidad && exCap(it.capacidad)].filter(Boolean).join(" · "))}</small><small>${exEsc(typeof bodegaFechaHora === "function" ? bodegaFechaHora(h.ts) : "")}${h.deshecha ? " · deshecha" : ""}</small></div>
        <button type="button" data-ts="${h.ts}" data-u="${x.code}">Deshacer</button></div>`;
    }).join("");
    bg.innerHTML = `<div class="ex-sheet"><h3>Ventas recientes</h3><p>Si una venta no pasó en caja, deshazla aquí y la pieza regresa a bodega.</p>${filas || `<div class="ex-vacio"><b>Sin ventas registradas</b>Aquí aparecerán las piezas que marques como vendidas.</div>`}</div>`;
    document.body.appendChild(bg);
    bg.addEventListener("click", e => {
      if (e.target === bg) { bg.remove(); return; }
      const b = e.target.closest("button[data-ts]"); if (!b) return;
      const e2 = bodegaLoad(), s2 = { ...(e2.stock || {}) }, u = b.dataset.u, ts = +b.dataset.ts;
      const hist = (e2.historial || []).map(h => h.ts === ts && h.origen === "venta" ? { ...h, deshecha: true } : h);
      if (hist.find(h => h.ts === ts && h.deshecha) == null) return;
      const prev = { ...s2 }; s2[u] = (s2[u] || 0) + 1;
      let h3 = hist;
      try { h3 = bodegaRegistrar({ ...e2, historial: hist }, prev, s2, bodegaCatalogoTodo(s2), "deshacer", e2.fecha); } catch (_) {}
      bodegaSave({ ...e2, stock: s2, historial: h3 });
      stock[u] = s2[u]; calc(); pintaCar(); pintaLista();
      const row = b.closest(".ex-vr"); row.classList.add("hecha");
      row.querySelector(".ex-info small:last-child").textContent += " · deshecha";
    });
  });

  /* ---- cambios de otros dispositivos (Firebase): se repinta con la copia local, sin leer nada extra ---- */
  const alRemoto = () => {
    if (!wrap.isConnected) { window.removeEventListener("ishop-remote", alRemoto); window.removeEventListener("ishop-sync-estado", alEstado); return; }
    const b = bodegaLoad();
    Object.keys(stock).forEach(k => { delete stock[k]; }); Object.assign(stock, b.stock || {});
    Object.keys(stock).forEach(k => { if (!todos[k]) todos[k] = { modelo: "Código nuevo", color: "", capacidad: "", seccion: "Otros" }; });
    calc(); pintaCar(); pintaLista();
  };
  const alEstado = () => { const m = wrap.querySelector(".ex-meta"); if (m && window.ishopSyncEstado) m.textContent = m.textContent.replace(/ · (en línea|sin conexión|sin sync)$/, "") + " · " + window.ishopSyncEstado; };
  window.addEventListener("ishop-remote", alRemoto); window.addEventListener("ishop-sync-estado", alEstado); alEstado();
  wrap.querySelector("#exBuscar").addEventListener("input", e => { texto = e.target.value.trim(); pintaCar(); pintaLista(); });
  pintaCar(); pintaLista();
  return wrap;
}
