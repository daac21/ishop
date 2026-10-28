/* =========================================================
   iShop Tools — v1: estructura y navegación
   La información (precios, cobertura, etc.) se agregará
   después en /datos/*.json. Por ahora cada pantalla es un
   placeholder que confirma que la navegación funciona.
   ========================================================= */

/* =====================================================================
   Ajustes personales (se guardan en ESTE teléfono): nombre, color, apariencia y mosaicos
   ===================================================================== */
const ISHOP_ACENTOS = [
  ["Azul", "#0071e3"], ["Morado", "#5856d6"], ["Rosa", "#d6336c"], ["Rojo", "#e03131"],
  ["Naranja", "#e8590c"], ["Verde", "#2b8a3e"], ["Turquesa", "#0c8599"], ["Grafito", "#495057"],
];
const ISHOP_AJUSTES_DEF = { nombre: "", acento: "#0071e3", modo: "claro", mosaicos: "original", listo: false };
function ishopAjustes() {
  try { return Object.assign({}, ISHOP_AJUSTES_DEF, JSON.parse(localStorage.getItem("ishop_ajustes") || "{}")); }
  catch (e) { return Object.assign({}, ISHOP_AJUSTES_DEF); }
}
function ishopGuardarAjustes(patch) {
  const a = Object.assign(ishopAjustes(), patch);
  try { localStorage.setItem("ishop_ajustes", JSON.stringify(a)); } catch (e) {}
  ishopAplicarTema();
  return a;
}
function ishopEsOscuro(a) {
  return a.modo === "oscuro" || (a.modo === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
}
function ishopColorBarra() { if (document.documentElement.classList.contains("docs-mode")) return "#ffffff"; return ishopEsOscuro(ishopAjustes()) ? "#000000" : "#f5f5f7"; }
function ishopAplicarTema() {
  const a = ishopAjustes();
  const root = document.documentElement;
  root.style.setProperty("--accent", a.acento);
  root.style.setProperty("--accent-press", `color-mix(in srgb, ${a.acento} 78%, black)`);
  root.dataset.mode = (!root.classList.contains("docs-mode") && ishopEsOscuro(a)) ? "dark" : "light";   // en los registros siempre fondo blanco
  root.dataset.tiles = a.mosaicos;
  if (!root.classList.contains("rep-mode")) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", ishopColorBarra());
  }
}
ishopAplicarTema();
if (window.matchMedia) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", ishopAplicarTema);
}

// Iconos de línea (estilo SF Symbols) para el menú principal y Registros
const ISHOP_ICONS = (() => {
  const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    tradein:   s(`<rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.5 5.2h3"/>`),
    switchup:  s(`<path d="M19.5 11a7.5 7.5 0 0 0-13-4.6L4.5 8.5"/><path d="M4.5 4v4.5H9"/><path d="M4.5 13a7.5 7.5 0 0 0 13 4.6l2-2.1"/><path d="M19.5 20v-4.5H15"/>`),
    applecare: s(`<path d="M12 2.8 4.5 5.6v5.6c0 4.5 3.1 8.2 7.5 9.9 4.4-1.7 7.5-5.4 7.5-9.9V5.6L12 2.8z"/>`),
    forlife:   s(`<rect x="5" y="3" width="11" height="18" rx="2.4"/><path d="M8.5 5.6h4"/><path d="M19.5 3.5v5M17 6h5"/>`),
    getac:     s(`<rect x="5" y="3" width="11" height="18" rx="2.4"/><path d="M8.5 5.6h4"/><path d="M19.5 3.5v5M17 6h5"/>`),
    cubre:     s(`<path d="M12 2.8 4.5 5.6v5.6c0 4.5 3.1 8.2 7.5 9.9 4.4-1.7 7.5-5.4 7.5-9.9V5.6L12 2.8z"/><path d="m9 12 2.2 2.2L15.5 10"/>`),
    scanner:   s(`<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.2"/>`),
    cajas:     s(`<path d="M3.5 6.5v11M6.5 6.5v11M9.5 6.5v11M13 6.5v11M16 6.5v11M18.5 6.5v11M20.8 6.5v11"/><path d="M9.5 6.5v11" stroke-width="3"/><path d="M16 6.5v11" stroke-width="3"/>`),
    registros: s(`<rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="M10 9h7M10 12.5h7M10 16h7"/><circle cx="7" cy="9" r=".6" fill="currentColor"/><circle cx="7" cy="12.5" r=".6" fill="currentColor"/><circle cx="7" cy="16" r=".6" fill="currentColor"/>`),
    coins:     s(`<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>`),
    tag:       s(`<path d="M20.5 12.6 12.6 20.5a1.6 1.6 0 0 1-2.3 0L3.5 13.7V3.5h10.2l6.8 6.8a1.6 1.6 0 0 1 0 2.3z"/><circle cx="8" cy="8" r="1.3"/>`),
    cancel:    s(`<path d="M6 6l12 12M18 6 6 18"/>`),
    existencias: s(`<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>`),
  };
})();

// ---- Definición del menú principal ----
const MENU = [
  { id: "tradein",   label: "Trade In",       c1: "#5183e5", c2: "#4247d5" },
  { id: "switchup",  label: "Switch Up",      c1: "#f6a850", c2: "#e8645e" },
  { id: "applecare", label: "AppleCare+",     c1: "#65c58d", c2: "#3b8e7c" },
  { id: "forlife",   label: "For Life + AC",  c1: "#7e61e6", c2: "#5642b9" },
  { id: "getac",     label: "GET + AC",       c1: "#e96390", c2: "#c84172" },
  { id: "cubre",     label: "¿Qué cubre?",    c1: "#6dbece", c2: "#4997ae" },
  { id: "scanner",   label: "Escáner",        c1: "#747c8d", c2: "#3a404f" },
  { id: "cajas",     label: "Código cajas",   c1: "#d6a76e", c2: "#a8703b" },
];

// ---- iShop Arcade (oculto: se abre manteniendo presionado el nombre "iShop Tools") ----
const ARCADE_GAMES = [
  { id: "tetris", icon: "🧱", label: "Tetris",     color: "#0071e3" },
  { id: "snake",  icon: "🐍", label: "Snake",      color: "#34c759" },
  { id: "mines",  icon: "💣", label: "Buscaminas", color: "#3a3a3c" },
  { id: "dino",   icon: "🦖", label: "Dino Run",   color: "#ff9500" },
];

// Iconos y color por categoría de cobertura
const COVERAGE_ICONS = {
  "iPhone": "📱", "iPad": "📱", "Mac": "🖥️", "Mac Neo": "💻",
  "Apple Watch": "⌚", "AirPods Pro": "🎧", "AirPods Max": "🎧",
  "HomePod": "🔊", "Apple TV": "📺",
};
const COVERAGE_TILE_COLORS = ["#0071e3", "#ff9500", "#34c759", "#5856d6", "#af52de", "#ff3b30", "#1d1d1f", "#0a84ff", "#30d158"];

// Las categorías de cobertura.json (¿Qué cubre?) no coinciden 1 a 1 con las de
// applecare_info.json (AppleCare+), así que aquí las relacionamos para poder
// sacar el precio automáticamente en vez de cargarlo a mano en cobertura.json.
// nameIncludes/excludeNeo/onlyNeo filtran qué modelos de esa fuente cuentan.
const COBERTURA_TO_AC_INFO = {
  "iPhone":      { source: "iPhone" },
  "iPad":        { source: "iPad" },
  "Mac":         { source: "Mac", excludeNeo: true },
  "Mac Neo":     { source: "Mac", onlyNeo: true },
  "Apple Watch": { source: "Watch" },
  "AirPods Pro": { source: "AirPods", nameIncludes: "Pro" },
  "AirPods Max": { source: "AirPods", nameIncludes: "Max" },
  "HomePod":     { source: "HomePod" },
  "Apple TV":    { source: "Apple TV" },
};

// Si a un iPhone le falta el precio "Robo y Extravío" en applecare_info.json, se toma del catálogo (escaner.json / applecare.json).
function completarRoboAppleCare() {
  try {
    const ip = APPLECARE_INFO && APPLECARE_INFO.iPhone; if (!ip) return;
    const fuentes = [ESCANER_DATA || {}];
    fuentes.forEach(src => Object.values(src).forEach(v => {
      if (!v || typeof v.applecare_robo_perdida !== "number") return;
      const m = ip[v.modelo]; if (!m || !m["AppleCare+"]) return;
      if (typeof m["AppleCare+"]["Robo y Extravío"] !== "number") m["AppleCare+"]["Robo y Extravío"] = v.applecare_robo_perdida;
    }));
  } catch (e) {}
}

// Lista de modelos de applecare_info.json que le corresponden a una categoría
// de cobertura.json, cada uno con su precio normal y (si aplica) el de Robo y
// Extravío. Alimenta el dropdown de modelo en la sección "Costo de AppleCare+".
function acInfoModelsForCoverage(category) {
  const map = COBERTURA_TO_AC_INFO[category];
  if (!map || !APPLECARE_INFO) return [];
  const models = APPLECARE_INFO[map.source] || {};
  const list = [];
  Object.entries(models).forEach(([modelName, variants]) => {
    if (map.excludeNeo && /neo/i.test(modelName)) return;
    if (map.onlyNeo && !/neo/i.test(modelName)) return;
    if (map.nameIncludes && !modelName.includes(map.nameIncludes)) return;
    const info = variants && variants["AppleCare+"];
    if (!info) return;
    list.push({ name: modelName, precio: info.precio, robo: info["Robo y Extravío"] });
  });
  return list;
}

// Dado un modelo de AppleCare+ (applecare_info.json), devuelve la categoría
// de "¿Qué cubre?" (cobertura.json) que le corresponde, o null si no hay.
function coverageCategoryForAc(acCategory, model) {
  if (!COBERTURA_DATA) return null;
  const key = Object.keys(COBERTURA_TO_AC_INFO).find(k =>
    COBERTURA_TO_AC_INFO[k].source === acCategory &&
    COBERTURA_DATA[k] &&
    acInfoModelsForCoverage(k).some(m => m.name === model)
  );
  return key || null;
}

function coverageYears(category, extra) {
  const t = `${category || ""} ${extra || ""}`.toLowerCase();
  if (t.includes("herm") || t.includes("edition")) return 3;
  if (t.includes("mac") || t.includes("display")) return 3;
  return 2;
}

// Ícono/color por categoría para el apartado AppleCare+ (datos/applecare_info.json)
const AC_CATEGORY_META = {
  "iPhone":    { icon: "📱", color: "#0071e3" },
  "Watch":     { icon: "⌚", color: "#ff3b30" },
  "iPad":      { icon: "📱", color: "#5856d6" },
  "Mac":       { icon: "💻", color: "#34c759" },
  "HomePod":   { icon: "🔊", color: "#ff9500" },
  "Apple TV":  { icon: "📺", color: "#1d1d1f" },
  "AirPods":   { icon: "🎧", color: "#8e8e93" },
};

/* =====================================================================
   Tema "joya": íconos de línea, colores y piezas compartidas por todos los menús.
   Nada de esto lee datos: solo es presentación. Los textos y precios salen de los JSON.
   ===================================================================== */
const DS_SVG = (inner, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const DS_ICONS = {
  phone:   DS_SVG('<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M10.5 18.6h3"/>'),
  tablet:  DS_SVG('<rect x="4.5" y="2.5" width="15" height="19" rx="2.6"/><path d="M10.6 18.4h2.8"/>'),
  watch:   DS_SVG('<rect x="7" y="6.5" width="10" height="11" rx="3"/><path d="M9 6.5l.7-3.5h4.6l.7 3.5M9 17.5l.7 3.5h4.6l.7-3.5"/>'),
  mac:     DS_SVG('<rect x="4.5" y="5" width="15" height="10.5" rx="1.6"/><path d="M2.5 19h19"/>'),
  homepod: DS_SVG('<rect x="6" y="4" width="12" height="16" rx="6"/><path d="M9 8.2h6"/>'),
  tv:      DS_SVG('<rect x="3" y="6" width="18" height="11" rx="2"/><path d="M8 20h8"/>'),
  airpods: DS_SVG('<path d="M4 14a8 8 0 0 1 16 0"/><rect x="3" y="13.5" width="4" height="7" rx="2"/><rect x="17" y="13.5" width="4" height="7" rx="2"/>'),
  box:     DS_SVG('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
  shield:  DS_SVG('<path d="M12 3l7 3v5.2c0 4.6-3 7.6-7 9.8-4-2.2-7-5.2-7-9.8V6z"/><path d="M9 12l2.2 2.2L15.2 10"/>'),
  check:   DS_SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.6),
  x:       DS_SVG('<path d="M6 6l12 12M18 6L6 18"/>', 2.6),
  bolt:    DS_SVG('<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>'),
  wrench:  DS_SVG('<path d="M14.5 6.2a4 4 0 0 0 4.9 4.9L9 21.5 3 15.5 13.6 5a4 4 0 0 0 .9 1.2z"/>'),
  storage: DS_SVG('<rect x="3" y="7.5" width="18" height="9" rx="2.2"/><path d="M7 10.5v3M10.3 10.5v3M13.6 10.5v3M16.9 10.5v3" stroke-width="1.6"/>'),
  batpho:  DS_SVG('<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M12.8 7.8l-2.4 4h2.8l-1.6 3.6"/>'),
  battery: DS_SVG('<rect x="6" y="5" width="12" height="16" rx="2.6"/><path d="M10 2.5h4M12 10v5M9.5 12.5h5"/>'),
  headset: DS_SVG('<path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3.5" y="13" width="4" height="6.5" rx="2"/><rect x="16.5" y="13" width="4" height="6.5" rx="2"/>'),
  burst:   DS_SVG('<path d="M12 3l1.8 4.7 4.6-2.1-2 4.7 5 .9-4.6 2.5 3 4-5-1-1 4.9-2.8-4.1-3.7 3.2.5-4.9-5-.3 4.2-3.2-3-4 4.9 1.5z"/>'),
  pencil:  DS_SVG('<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/>'),
  calendar:DS_SVG('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8 3v4M16 3v4"/>', 2),
  coin:    DS_SVG('<path d="M12 2v20M17 6.5H9.8a2.8 2.8 0 0 0 0 5.6h4.4a2.8 2.8 0 0 1 0 5.6H6.5"/>', 2),
  warn:    DS_SVG('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.2"/>', 2),
  doc:     DS_SVG('<path d="M7 3h10v18l-5-3-5 3z"/>', 2),
  steps:   DS_SVG('<path d="M5 6.5h14M5 12h14M5 17.5h9"/>', 2),
  grid:    DS_SVG('<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>'),
  list:    DS_SVG('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.7" cy="6.5" r=".6"/><circle cx="4.7" cy="12" r=".6"/><circle cx="4.7" cy="17.5" r=".6"/>'),
};
const DS_JEWELS = ["blue", "violet", "green", "rose", "amber", "teal", "slate", "navy"];
function dsIconFor(name) {
  const t = String(name || "").toLowerCase();
  if (/iphone/.test(t)) return DS_ICONS.phone;
  if (/ipad/.test(t)) return DS_ICONS.tablet;
  if (/watch/.test(t)) return DS_ICONS.watch;
  if (/mac/.test(t)) return DS_ICONS.mac;
  if (/homepod/.test(t)) return DS_ICONS.homepod;
  if (/apple tv|\btv\b/.test(t)) return DS_ICONS.tv;
  if (/airpods|audífon|audifon|beats/.test(t)) return DS_ICONS.airpods;
  return DS_ICONS.box;
}
function dsJewelFor(name, i) {
  const t = String(name || "").toLowerCase();
  if (/iphone/.test(t)) return "blue";
  if (/ipad/.test(t)) return "violet";
  if (/watch/.test(t)) return "green";
  if (/mac/.test(t)) return "slate";
  if (/homepod/.test(t)) return "amber";
  if (/apple tv|\btv\b/.test(t)) return "navy";
  if (/airpods|audífon|audifon|beats/.test(t)) return "teal";
  return DS_JEWELS[(i || 0) % DS_JEWELS.length];
}
// Fila de menú con ícono de color (AppleCare+, ¿Qué cubre?, Código cajas…)
function dsRow({ icon, jw, label, sub, onClick }) {
  const b = document.createElement("button");
  b.className = "ds-row";
  b.innerHTML = `<span class="ds-chip jw-${jw}">${icon}</span><span class="ds-row-text"><b></b>${sub ? "<small></small>" : ""}</span><span class="chev"></span>`;
  b.querySelector("b").textContent = label;
  if (sub) b.querySelector("small").textContent = sub;
  b.addEventListener("click", onClick);
  return b;
}
// Ícono y color de cada beneficio de AppleCare+ según las palabras del texto
function benefitChip(text) {
  const t = String(text).toLowerCase();
  if (t.includes("batería")) return { icon: DS_ICONS.battery, jw: "green" };
  if (t.includes("robo") || t.includes("extrav")) return { icon: DS_ICONS.shield, jw: "blue" };
  if (t.includes("soporte")) return { icon: DS_ICONS.headset, jw: "violet" };
  if (t.includes("pencil") || t.includes("keyboard")) return { icon: DS_ICONS.pencil, jw: "teal" };
  if (t.includes("original")) return { icon: DS_ICONS.wrench, jw: "amber" };
  if (t.includes("accidental")) return { icon: DS_ICONS.burst, jw: "rose" };
  return { icon: DS_ICONS.check, jw: "slate" };
}
function dsKeyIcon(label) {
  const t = String(label).toLowerCase();
  if (/pantalla/.test(t)) return DS_ICONS.phone;
  if (/robo|extrav/.test(t)) return DS_ICONS.shield;
  if (/bater/.test(t)) return DS_ICONS.battery;
  if (/otros|da[ñn]o/.test(t)) return DS_ICONS.burst;
  return DS_ICONS.wrench;
}
// Marca de agua al pie de cada pantalla
function dsWatermark() {
  const w = document.createElement("div");
  w.className = "ds-wm";
  w.setAttribute("aria-hidden", "true");
  w.innerHTML = "<i></i><span>daac</span><i></i>";
  // Oculto: mantener presionado "daac" 1 s → Bodega
  const sp = w.querySelector("span");
  let t = null;
  sp.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    clearTimeout(t);
    t = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(15);
      if (currentEntry().screen !== "bodega") navigate({ screen: "bodega", title: "Bodega" });
    }, 1000);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => sp.addEventListener(ev, () => clearTimeout(t)));
  sp.addEventListener("contextmenu", (e) => e.preventDefault());
  return w;
}

let TRADEIN_DATA = null;
let TRADEIN_VISUAL = null;
let PRECIOS_IPHONE = null;
let APPLECARE_DATA = null;
let SWITCHUP_MODELOS = null;
let FINANCIAMIENTO_DATA = null;
let COBERTURA_DATA = null;
let APPLECARE_INFO = null;
let ESCANER_DATA = null;
let CODIGOS_CAJAS = null;

// datos/applecare.json ahora está indexado por código de barras (SKU), con un
// campo "modelo" dentro de cada registro. Trade In, For Life + AC y GET + AC
// necesitan el precio de AppleCare+ buscando por NOMBRE de modelo, así que
// aquí reconstruimos esa tabla auxiliar a partir del JSON por código de barras.
function buildApplecareByModel(raw) {
  const byModel = {};
  if (!raw) return byModel;
  Object.values(raw).forEach(item => {
    const modelo = item && item.modelo;
    if (!modelo || byModel[modelo]) return; // el primer precio encontrado por modelo es suficiente (son consistentes)
    byModel[modelo] = {
      APPLECARE: item.applecare,
      ROBO_PERDIDA: item.applecare_robo_perdida,
    };
  });
  return byModel;
}

// Busca el AppleCare+ de un modelo tolerando diferencias de mayúsculas/minúsculas
// entre los nombres usados en financiamiento.json / tradein.json (p.ej. "iPhone 17 PRO")
// y los nombres usados en applecare.json (p.ej. "iPhone 17 Pro").
function findApplecareForModel(modelName) {
  if (!APPLECARE_DATA || !modelName) return {};
  if (APPLECARE_DATA[modelName]) return APPLECARE_DATA[modelName];
  const target = modelName.toLowerCase();
  const key = Object.keys(APPLECARE_DATA).find(k => k.toLowerCase() === target);
  return key ? APPLECARE_DATA[key] : {};
}

async function loadAllData() {
  try {
    const [t, tv, p, a, s, f, c, aci, esc, caj] = await Promise.all([
      fetch("datos/tradein.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/tradein_categorias.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/precios_iphone.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/applecare.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/switchup_modelos.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/financiamiento.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/cobertura.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/applecare_info.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/escaner.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/codigos_cajas.json", { cache: "no-store" }).then(r => r.json()),
    ]);
    TRADEIN_DATA = t;
    TRADEIN_VISUAL = tv;
    PRECIOS_IPHONE = p;
    APPLECARE_DATA = buildApplecareByModel(a);
    SWITCHUP_MODELOS = s;
    FINANCIAMIENTO_DATA = f;
    COBERTURA_DATA = c;
    APPLECARE_INFO = aci;
    ESCANER_DATA = esc;
    completarRoboAppleCare();
    CODIGOS_CAJAS = caj;
    localStorage.setItem("ishop_data_cache", JSON.stringify({ tradein: t, tradein_categorias: tv, precios_iphone: p, applecare: a, switchup_modelos: s, financiamiento: f, cobertura: c, applecare_info: aci, escaner: esc, codigos_cajas: caj }));
  } catch (e) {
    const cached = localStorage.getItem("ishop_data_cache");
    if (cached) {
      const data = JSON.parse(cached);
      TRADEIN_DATA = data.tradein || {};
      TRADEIN_VISUAL = data.tradein_categorias || {};
      PRECIOS_IPHONE = data.precios_iphone || {};
      APPLECARE_DATA = buildApplecareByModel(data.applecare || {});
      SWITCHUP_MODELOS = data.switchup_modelos || [];
      FINANCIAMIENTO_DATA = data.financiamiento || {};
      COBERTURA_DATA = data.cobertura || {};
      APPLECARE_INFO = data.applecare_info || {};
      ESCANER_DATA = data.escaner || {};
      completarRoboAppleCare();
      CODIGOS_CAJAS = data.codigos_cajas || {};
    } else {
      TRADEIN_DATA = {};
      TRADEIN_VISUAL = {};
      PRECIOS_IPHONE = {};
      APPLECARE_DATA = {};
      SWITCHUP_MODELOS = [];
      FINANCIAMIENTO_DATA = {};
      COBERTURA_DATA = {};
      APPLECARE_INFO = {};
      ESCANER_DATA = {};
      CODIGOS_CAJAS = {};
    }
  }
}
const dataReady = loadAllData();

let stack = [{ screen: "home", title: "iShop Tools" }];
const MESES = [3, 6, 9, 10, 12, 13, 15];
const MEMBRESIA_SWITCH = 399;

function money(n) {
  if (n === null || n === undefined || isNaN(n)) return "Precio pendiente";
  return "$" + Math.round(n).toLocaleString("es-MX");
}

function parsePesoValue(str) {
  if (typeof str !== "string") return null;
  const clean = str.replace(/[^0-9.]/g, "");
  if (!clean) return null;
  return parseFloat(clean);
}

function computePlan(base, extra, months, acMonths) {
  if (base === null || base === undefined) return null;
  const safeExtra = extra || 0;
  if (months === 15 && safeExtra > 0) {
    const acM = acMonths || 10;
    return {
      split: true,
      acMonths: acM,
      phase1: { months: acM, amount: base / 15 + safeExtra / acM },
      phase2: { months: 15 - acM, amount: base / 15 },
    };
  }
  return { split: false, amount: (base + safeExtra) / months };
}

const screensEl = document.getElementById("screens");
const titleEl = document.getElementById("screenTitle");
const backBtn = document.getElementById("backBtn");
const homeBtn = document.getElementById("homeBtn");

function currentEntry() {
  return stack[stack.length - 1];
}

function navigate(entry) {
  stack.push(entry);
  render(true);
}

function goBack() {
  if (stack.length > 1) {
    stack.pop();
    render(false);
  }
}

function goHome() {
  stack = [{ screen: "home", title: "iShop Tools" }];
  render(false);
}

// Botón de ajustes (engrane): solo se ve en el inicio
const settingsBtn = document.createElement("button");
settingsBtn.id = "settingsBtn";
settingsBtn.className = "nav-btn";
settingsBtn.setAttribute("aria-label", "Ajustes");
settingsBtn.hidden = true;
settingsBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
document.getElementById("topbar").appendChild(settingsBtn);
settingsBtn.addEventListener("click", () => navigate({ screen: "settings", title: "Ajustes" }));

backBtn.addEventListener("click", goBack);
homeBtn.addEventListener("click", goHome);
setupArcadeTrigger(titleEl);

/* ---- Deslizar con el dedo hacia la derecha para regresar (como el gesto de iOS) ---- */
(function setupSwipeBack() {
  const EDGE_ZONE = 35;   // solo cuenta si el toque inicia cerca del borde izquierdo
  const THRESHOLD = 70;   // distancia mínima para considerarlo un swipe
  let startX = 0, startY = 0, tracking = false;

  screensEl.addEventListener("touchstart", (e) => {
    if (stack.length <= 1) { tracking = false; return; }
    const t = e.touches[0];
    if (t.clientX > EDGE_ZONE) { tracking = false; return; }
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  }, { passive: true });

  screensEl.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = Math.abs(t.clientY - startY);
    if (dx > THRESHOLD && dy < 60) goBack();
  }, { passive: true });
})();

function render(isForward) {
  const entry = currentEntry();
  if (entry.screen !== "scanner") stopScanner();
  titleEl.textContent = entry.title;
  backBtn.hidden = stack.length === 1;
  homeBtn.hidden = stack.length === 1;
  settingsBtn.hidden = entry.screen !== "home";
  document.documentElement.classList.toggle("home-mode", entry.screen === "home");
  document.documentElement.classList.toggle("docs-mode", /^docs/.test(entry.screen));
  ishopAplicarTema();
  setRepairTheme(entry.screen === "repair");

  const node = buildScreen(entry);
  node.classList.add("screen");
  if (!/^(scanner|arcade|minesweeper|tetris|snake|dino|repair)$/.test(entry.screen)) {
    node.classList.add("has-wm");
    node.appendChild(dsWatermark());
  }
  if (isForward) node.classList.add("enter");
  screensEl.innerHTML = "";
  screensEl.appendChild(node);
}

function buildScreen(entry) {
  const el = document.createElement("div");

  if (entry.screen === "home") {
    el.appendChild(buildHome());
  } else if (entry.screen === "coverage") {
    el.appendChild(buildCoverageList());
  } else if (entry.screen === "coverageVariant") {
    el.appendChild(buildCoverageVariantList(entry.category));
  } else if (entry.screen === "coverageDetail") {
    el.appendChild(buildCoverageDetail(entry.category, entry.variant, entry.preModel));
  } else if (entry.screen === "tradeNode") {
    el.appendChild(buildTradeNode(entry.path));
  } else if (entry.screen === "quoteSelectNew") {
    el.appendChild(buildQuoteSelectNew(entry.path, entry.tradeIn));
  } else if (entry.screen === "quoteResult") {
    el.appendChild(buildQuoteResult(entry.tradeIn, entry.newModel, entry.newCapacity));
  } else if (entry.screen === "switchSelect") {
    el.appendChild(buildSwitchSelect(entry.path));
  } else if (entry.screen === "switchResult") {
    el.appendChild(buildSwitchResult(entry.newModel, entry.newCapacity));
  } else if (entry.screen === "financeSelect") {
    el.appendChild(buildFinanceSelect(entry.path, entry.planType));
  } else if (entry.screen === "financeResult") {
    el.appendChild(buildFinanceResult(entry.model, entry.capacity, entry.planType));
  } else if (entry.screen === "acCategories") {
    el.appendChild(buildAcCategories());
  } else if (entry.screen === "acModels") {
    el.appendChild(buildAcModels(entry.category));
  } else if (entry.screen === "acVariants") {
    el.appendChild(buildAcVariants(entry.category, entry.model));
  } else if (entry.screen === "acDetail") {
    el.appendChild(buildAcDetail(entry.category, entry.model, entry.variant));
  } else if (entry.screen === "repair") {
    el.classList.add("rep-screen");
    el.appendChild(buildRepair(entry.category, entry.model, entry.variant));
  } else if (entry.screen === "settings") {
    el.appendChild(buildSettings(entry));
  } else if (entry.screen === "registros") {
    el.appendChild(buildRegistros());
  } else if (entry.screen === "bodega") {
    el.appendChild(buildBodega());
  } else if (entry.screen === "bodegaManual") {
    el.appendChild(buildBodegaManual());
  } else if (entry.screen === "bodegaNoVend") {
    el.appendChild(buildBodegaNoVend());
  } else if (entry.screen === "bodegaDemo") {
    el.appendChild(buildBodegaDemo());
  } else if (entry.screen === "bodegaHist") {
    el.appendChild(buildBodegaHist());
  } else if (entry.screen === "bodegaDetalle") {
    el.appendChild(buildBodegaDetalle(entry.ts));
  } else if (entry.screen === "existencias") {
    el.appendChild(buildExistencias());
  } else if (entry.screen === "docs") {
    el.appendChild(buildDocs());
  } else if (entry.screen === "docsFotos") {
    el.appendChild(buildDocsFotos());
  } else if (entry.screen === "docsConfirm") {
    el.appendChild(buildDocsConfirm());
  } else if (entry.screen === "docsOk") {
    el.appendChild(buildDocsOk(entry));
  } else if (entry.screen === "scanner") {
    el.appendChild(buildScanner());
  } else if (entry.screen === "cajasCategories") {
    el.appendChild(buildCajasCategories());
  } else if (entry.screen === "cajasModels") {
    el.appendChild(buildCajasModels(entry.category));
  } else if (entry.screen === "cajasDetail") {
    el.appendChild(buildCajasDetail(entry.category, entry.modelo));
  } else if (entry.screen === "arcade") {
    el.appendChild(buildArcade());
  } else if (entry.screen === "minesweeper") {
    el.appendChild(buildMinesweeper());
  } else if (entry.screen === "tetris") {
    el.appendChild(buildTetris());
  } else if (entry.screen === "snake") {
    el.appendChild(buildSnake());
  } else if (entry.screen === "dino") {
    el.appendChild(buildDino());
  } else if (entry.screen === "tool") {
    el.appendChild(buildPlaceholder(entry.title, "🛠️", "Esta sección estará disponible próximamente."));
  }

  return el;
}

function buildHome() {
  const wrap = document.createElement("div");
  wrap.className = "home-wrap";

  const heading = document.createElement("div");
  heading.className = "home-heading";
  const nom = ishopAjustes().nombre;
  heading.innerHTML = `<h2></h2><p>¿Qué herramienta necesitas?</p>`;
  heading.querySelector("h2").textContent = nom ? `Hola, ${nom}.` : "Hola.";
  wrap.appendChild(heading);

  const exBtn = document.createElement("button");
  exBtn.className = "home-exist";
  exBtn.innerHTML = `
    <span class="home-exist-icon">${ISHOP_ICONS.existencias}</span>
    <span class="home-exist-text"><strong>Existencias</strong></span>
    <span class="home-tile-chev"></span>`;
  exBtn.addEventListener("click", async () => {
    if (!ESCANER_DATA) await dataReady;
    navigate({ screen: "existencias", title: "Existencias" });
  });
  wrap.appendChild(exBtn);

  const grid = document.createElement("div");
  grid.className = "home-grid";
  MENU.forEach(item => {
    const tile = document.createElement("button");
    tile.className = "home-tile" + (item.light ? " light" : "");
    tile.style.setProperty("--t1", item.c1);
    tile.style.setProperty("--t2", item.c2);
    tile.innerHTML = `
      <span class="home-tile-icon">${ISHOP_ICONS[item.id] || ""}</span>
      <span class="home-tile-label">${item.label}</span>
      <span class="home-tile-chev"></span>`;
    tile.addEventListener("click", () => handleMenuClick(item));
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);

  const reg = document.createElement("button");
  reg.className = "home-reg";
  reg.innerHTML = `
    <span class="home-reg-icon">${ISHOP_ICONS.registros}</span>
    <span class="home-reg-text"><strong>Registros</strong></span>
    <span class="home-tile-chev"></span>`;
  reg.addEventListener("click", () => navigate({ screen: "registros", title: "Registros" }));
  wrap.appendChild(reg);

  async function handleMenuClick(item) {
    if (item.id === "cubre") {
      if (!COBERTURA_DATA) await dataReady;
      navigate({ screen: "coverage", title: item.label });
    } else if (item.id === "tradein") {
      if (!TRADEIN_DATA) await dataReady;
      navigate({ screen: "tradeNode", path: [], title: item.label });
    } else if (item.id === "switchup") {
      if (!PRECIOS_IPHONE) await dataReady;
      navigate({ screen: "switchSelect", path: [], title: item.label });
    } else if (item.id === "applecare") {
      if (!APPLECARE_INFO) await dataReady;
      navigate({ screen: "acCategories", title: item.label });
    } else if (item.id === "forlife" || item.id === "getac") {
      if (!FINANCIAMIENTO_DATA) await dataReady;
      const planType = item.id === "forlife" ? "IFL" : "GET";
      navigate({ screen: "financeSelect", path: [], planType, title: item.label });
    } else if (item.id === "scanner") {
      if (!ESCANER_DATA) await dataReady;
      navigate({ screen: "scanner", title: item.label });
    } else if (item.id === "cajas") {
      if (!CODIGOS_CAJAS) await dataReady;
      navigate({ screen: "cajasCategories", title: item.label });
    } else {
      navigate({ screen: "tool", id: item.id, title: item.label });
    }
  }
  return wrap;
}

/* ---- Registros (antes era un menú secreto en Código cajas) ---- */
const REGISTROS_TIPOS = [
  { label: "For Life",            programa: "For Life",  icon: "forlife",   c1: "#c9a6f5", c2: "#8e5fe0" },
  { label: "Get",                 programa: "Get",       icon: "coins",     c1: "#9aa2f7", c2: "#6a62e0" },
  { label: "Switch Up",           programa: "Switch Up", icon: "switchup",  c1: "#ffc46b", c2: "#f59a23" },
  { label: "Trade In",            programa: "Trade In",  icon: "tag",       c1: "#6ea8ff", c2: "#2f6fe4" },
  { label: "Cancelación For Life", programa: "Cancelación For Life", icon: "cancel", c1: "#b4b8c2", c2: "#7c808b" },
  { label: "Trade In · Cancelación For Life", programa: "Trade In Cancelación", icon: "tag", c1: "#6ea8ff", c2: "#2f6fe4" },
];

function buildRegistros() {
  const wrap = document.createElement("div");
  wrap.className = "reg-wrap";
  wrap.innerHTML = `<div class="reg-heading"><h2>Registros</h2><p class="ds-sub">Elige el tipo de registro.</p></div>`;
  const list = document.createElement("div");
  list.className = "reg-list";
  const JW = { "For Life": "violet", "Get": "navy", "Switch Up": "amber", "Trade In": "blue", "Cancelación For Life": "slate", "Trade In Cancelación": "blue" };
  REGISTROS_TIPOS.forEach(t => {
    const row = dsRow({
      icon: ISHOP_ICONS[t.icon] || DS_ICONS.doc, jw: JW[t.programa] || "slate", label: t.label,
      onClick: () => {
        if (t.pendiente) {
          navigate({ screen: "tool", id: "cancelacion", title: t.label });
          return;
        }
        docsDraft = docsNewDraft();
        docsDraft.programa = t.programa;
        navigate({ screen: "docs", title: t.label });
      },
    });
    list.appendChild(row);
  });
  wrap.appendChild(list);
  const saved = document.createElement("button");
  saved.className = "docs-link";
  saved.textContent = "Registros guardados";
  saved.addEventListener("click", () => navigate({ screen: "docsOk", title: "Registros", hero: false }));
  wrap.appendChild(saved);
  return wrap;
}

/* ---- Gesto secreto: mantener presionado "iShop Tools" abre iShop Arcade ---- */
function setupArcadeTrigger(titleEl2) {
  if (!titleEl2) return;
  const HOLD_MS = 800;
  let pressTimer = null;

  const start = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (currentEntry().screen !== "home") return;
    titleEl2.classList.add("title-pressing");
    pressTimer = setTimeout(() => {
      titleEl2.classList.remove("title-pressing");
      if (navigator.vibrate) navigator.vibrate(15);
      navigate({ screen: "arcade", title: "iShop Arcade" });
    }, HOLD_MS);
  };
  const cancel = () => {
    clearTimeout(pressTimer);
    titleEl2.classList.remove("title-pressing");
  };

  titleEl2.addEventListener("pointerdown", start);
  titleEl2.addEventListener("pointerup", cancel);
  titleEl2.addEventListener("pointerleave", cancel);
  titleEl2.addEventListener("pointercancel", cancel);
  titleEl2.addEventListener("contextmenu", (e) => e.preventDefault());
}

/* ---- iShop Arcade: menú de juegos ---- */
function buildArcade() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>🕹️ iShop Arcade</h2><p>Encontraste el modo secreto. Elige un juego.</p>`;
  wrap.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "coverage-tile-grid";
  ARCADE_GAMES.forEach(item => {
    const tile = document.createElement("button");
    tile.className = "coverage-tile";
    tile.style.setProperty("--tile-color", item.color);
    tile.innerHTML = `<span class="coverage-tile-icon">${item.icon}</span><span>${item.label}</span>`;
    tile.addEventListener("click", () => {
      if (item.id === "mines") {
        navigate({ screen: "minesweeper", title: item.label });
      } else {
        navigate({ screen: item.id, title: item.label });
      }
    });
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);

  return wrap;
}

function buildCoverageList() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>¿Qué cubre?</h2><p class="ds-sub">Elige el equipo para ver su cobertura.</p>`;
  wrap.appendChild(heading);

  const categories = COBERTURA_DATA ? Object.keys(COBERTURA_DATA) : [];
  if (categories.length === 0) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛠️", "Aún no hay información cargada en datos/cobertura.json."));
    return wrap;
  }

  const list = document.createElement("div");
  categories.forEach((cat, i) => {
    list.appendChild(dsRow({
      icon: dsIconFor(cat), jw: dsJewelFor(cat, i), label: cat,
      onClick: () => {
        const variants = Object.keys(COBERTURA_DATA[cat]);
        if (variants.length === 1) {
          navigate({ screen: "coverageDetail", category: cat, variant: variants[0], title: cat });
        } else {
          navigate({ screen: "coverageDetail", category: cat, variant: variants[0], title: cat });
        }
      },
    }));
  });
  wrap.appendChild(list);
  return wrap;
}

function buildCoverageVariantList(category) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${COVERAGE_ICONS[category] || "🛠️"} ${category}</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(COBERTURA_DATA[category]).forEach(variant => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${variant}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "coverageDetail", category, variant, title: variant });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildCoverageDetail(category, variant, preModel) {
  const wrap = document.createElement("div");
  const data = COBERTURA_DATA?.[category]?.[variant];
  const isRobo = /robo/i.test(variant);
  const years = coverageYears(category, variant);

  const head = document.createElement("div");
  head.className = "section-heading";
  head.innerHTML = `<h2>¿Qué cubre?</h2><p class="ds-sub"></p>`;
  head.querySelector("p").textContent = `${category} · protección con ${variant}`;
  wrap.appendChild(head);

  // Pestañas entre las coberturas del mismo equipo (AppleCare+ / Robo y Pérdida…)
  const variants = Object.keys(COBERTURA_DATA?.[category] || {});
  if (variants.length > 1) {
    const tabs = document.createElement("div");
    tabs.className = "ds-tabs";
    variants.forEach(v => {
      const tb = document.createElement("button");
      tb.type = "button";
      tb.className = "ds-tab" + (v === variant ? " on" : "");
      tb.textContent = v;
      tb.addEventListener("click", () => {
        if (v === variant) return;
        const e = currentEntry();
        e.variant = v;
        e.title = category;
        render(false);
      });
      tabs.appendChild(tb);
    });
    wrap.appendChild(tabs);
  }

  if (!data) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛠️", "Aún no hay información cargada para esta cobertura."));
    return wrap;
  }

  // Resumen: se arma solo con lo que haya en el JSON
  const nums = (data.cuotas || []).map(c => parseFloat(String(c.precio).replace(/[^0-9.]/g, ""))).filter(n => isFinite(n));
  const kp = [{ jw: "blue", big: `${years} años`, small: "de cobertura" }];
  if (nums.length) kp.push({ jw: "green", big: `Desde ${money(Math.min(...nums))}`, small: "por evento" });
  if (data.bateria) kp.push({ jw: "violet", big: "Batería", small: "incluida" });
  if (data.cubre?.length) kp.push({ jw: "teal", big: String(data.cubre.length), small: "coberturas" });
  const kpis = document.createElement("div");
  kpis.className = "ds-kpis";
  kp.slice(0, 3).forEach(k => {
    const d = document.createElement("div");
    d.className = "ds-kpi jw-" + k.jw;
    d.innerHTML = `<strong></strong><small></small>`;
    d.querySelector("strong").textContent = k.big;
    d.querySelector("small").textContent = k.small;
    kpis.appendChild(d);
  });
  wrap.appendChild(kpis);

  function card(icon, title, body, cls) {
    const c = document.createElement("div");
    c.className = "ds-card" + (cls ? " " + cls : "");
    const h = document.createElement("h4");
    h.innerHTML = `${icon}<span></span>`;
    h.querySelector("span").textContent = title;
    c.appendChild(h);
    c.appendChild(body);
    wrap.appendChild(c);
    return c;
  }
  function checks(items, kind) {
    const box = document.createElement("div");
    items.forEach(text => {
      const row = document.createElement("div");
      row.className = "ds-li " + (kind === "good" ? "ok" : "no");
      row.innerHTML = `<i>${kind === "good" ? DS_ICONS.check : DS_ICONS.x}</i><span></span>`;
      row.querySelector("span").textContent = text;
      box.appendChild(row);
    });
    return box;
  }
  function chips(items) {
    const box = document.createElement("div");
    box.className = "ds-chips";
    items.forEach(text => { const c = document.createElement("span"); c.textContent = text; box.appendChild(c); });
    return box;
  }

  if (data.cubre?.length) card(DS_ICONS.check, "Sí cubre", checks(data.cubre, "good"), "ds-card-ok");

  if (data.cuotas?.length) {
    const box = document.createElement("div");
    box.className = "ds-fees";
    data.cuotas.forEach(c => {
      const d = document.createElement("div");
      d.innerHTML = `<small></small><strong></strong>`;
      d.querySelector("small").textContent = c.label;
      d.querySelector("strong").textContent = c.precio;
      box.appendChild(d);
    });
    card(DS_ICONS.coin, "Cuota por evento", box);
  }

  if (data.si_aplica?.length) card(DS_ICONS.warn, "Casos que normalmente sí aplican", chips(data.si_aplica));
  if (data.no_cubre?.length) card(DS_ICONS.x, "No cubre", checks(data.no_cubre, "bad"), "ds-card-no");
  if (data.rechazados?.length) card(DS_ICONS.x, "Casos que pueden ser rechazados", chips(data.rechazados), "ds-card-no");

  if (data.bateria) {
    const box = document.createElement("div");
    box.className = "ds-batt";
    box.innerHTML = `<span class="ds-chip jw-green">${DS_ICONS.battery}</span><div><b></b><small></small></div>`;
    box.querySelector("b").textContent = data.bateria.condicion || "Batería";
    box.querySelector("small").textContent = data.bateria.resultado || "";
    const c = document.createElement("div");
    c.className = "ds-card ds-card-ok";
    c.appendChild(box);
    wrap.appendChild(c);
  }

  if (data.info?.length) card(DS_ICONS.shield, "Información importante", checks(data.info, "good"));

  // Costo del plan: dropdown de modelo (precio real, ya no "desde") y, solo
  // para iPhone, un segundo dropdown para elegir AppleCare+ normal o Robo y
  // Extravío. Debajo, el precio de contado y el desglose a MSI (filtrable).
  const MSI_MONTHS = [3, 6, 9, 10, 12, 13];
  const acModels = acInfoModelsForCoverage(category);
  if (acModels.length) {
    const box = document.createElement("div");

    const modelSelect = document.createElement("select");
    modelSelect.className = "alt-finance-select";
    modelSelect.style.marginBottom = "10px";
    modelSelect.innerHTML = acModels.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
    if (preModel && acModels.some(m => m.name === preModel)) modelSelect.value = preModel;
    box.appendChild(modelSelect);

    let tipoSelect = null;
    if (category === "iPhone") {
      tipoSelect = document.createElement("select");
      tipoSelect.className = "alt-finance-select";
      tipoSelect.style.marginBottom = "10px";
      tipoSelect.innerHTML = `
        <option value="normal">AppleCare+</option>
        <option value="robo">AppleCare+ Robo y Extravío</option>
      `;
      tipoSelect.value = isRobo ? "robo" : "normal";
      box.appendChild(tipoSelect);
    }

    const totalRow = document.createElement("div");
    totalRow.className = "fee-row";
    box.appendChild(totalRow);

    const msiSelect = document.createElement("select");
    msiSelect.className = "alt-finance-select";
    msiSelect.style.margin = "10px 0";
    msiSelect.innerHTML = `<option value="all">Ver todos los plazos</option>` +
      MSI_MONTHS.map(m => `<option value="${m}">${m} MSI</option>`).join("");
    box.appendChild(msiSelect);

    const msiList = document.createElement("div");
    msiList.className = "fee-list";
    box.appendChild(msiList);

    function currentPrice() {
      const model = acModels.find(m => m.name === modelSelect.value) || acModels[0];
      if (!model) return null;
      const wantRobo = tipoSelect ? tipoSelect.value === "robo" : false;
      const price = wantRobo ? model.robo : model.precio;
      return (price === undefined || price === null || isNaN(price)) ? null : price;
    }

    function renderAll() {
      const price = currentPrice();
      totalRow.innerHTML = price !== null
        ? `<span>Costo de contado</span><strong>${money(price)}</strong>`
        : `<span>Costo de contado</span><strong>Precio pendiente</strong>`;

      msiList.innerHTML = "";
      if (price === null) return;
      const months = msiSelect.value === "all" ? MSI_MONTHS : [Number(msiSelect.value)];
      months.forEach(m => {
        const row = document.createElement("div");
        row.className = "fee-row";
        row.innerHTML = `<span>${m} MSI</span><strong>${money(price / m)}/mes</strong>`;
        msiList.appendChild(row);
      });
    }
    modelSelect.addEventListener("change", renderAll);
    if (tipoSelect) tipoSelect.addEventListener("change", renderAll);
    msiSelect.addEventListener("change", renderAll);
    renderAll();

    card(DS_ICONS.coin, "Costo de AppleCare+", box);
  }

  if (data.reclamo?.length) {
    const ol = document.createElement("ol");
    ol.className = "claim-steps";
    data.reclamo.forEach(t => { const li = document.createElement("li"); li.textContent = t; ol.appendChild(li); });
    card(DS_ICONS.steps, "Cómo reclamar", ol);
  }

  return wrap;
}

function buildPlaceholder(title, emoji, message) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="placeholder-card">
      <span class="emoji">${emoji}</span>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
  return wrap;
}

/* ---- Escáner de código de barras (lee con la cámara y busca en datos/escaner.json) ---- */
let scannerLibPromise = null;
let html5QrcodeInstance = null;

function loadScannerLib() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (scannerLibPromise) return scannerLibPromise;
  scannerLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar la librería del escáner."));
    document.head.appendChild(script);
  });
  return scannerLibPromise;
}

function stopScanner() {
  if (html5QrcodeInstance) {
    const inst = html5QrcodeInstance;
    html5QrcodeInstance = null;
    inst.stop().then(() => inst.clear()).catch(() => {});
  }
}

function buildScanner() {
  const wrap = document.createElement("div");
  wrap.className = "scanner-wrap";

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>📷 Escáner</h2><p>Apunta la cámara al código de barras de la caja.</p>`;
  wrap.appendChild(heading);

  const readerBox = document.createElement("div");
  readerBox.id = "scanner-reader";
  readerBox.className = "scanner-reader";
  wrap.appendChild(readerBox);

  const statusEl = document.createElement("p");
  statusEl.className = "scanner-status";
  statusEl.textContent = "Cargando cámara…";
  wrap.appendChild(statusEl);

  const resultBox = document.createElement("div");
  resultBox.className = "scanner-result";
  wrap.appendChild(resultBox);

  const manualRow = document.createElement("div");
  manualRow.className = "scanner-manual";
  manualRow.innerHTML = `
    <input type="text" inputmode="numeric" placeholder="O escribe el código aquí" class="scanner-manual-input">
    <button class="scanner-manual-btn">Buscar</button>
  `;
  wrap.appendChild(manualRow);

  function showResult(code) {
    const info = ESCANER_DATA ? ESCANER_DATA[code] : null;
    if (!info) {
      resultBox.innerHTML = `
        <div class="placeholder-card">
          <span class="emoji">❓</span>
          <h3>Código no encontrado</h3>
          <p>${code}</p>
        </div>
      `;
      return;
    }
    resultBox.innerHTML = `
      <div class="trade-banner"><span>${code}</span><strong>${info.modelo}</strong></div>
      <div class="finance-col">
        <div class="finance-row"><span>Color</span><strong>${info.color}</strong></div>
        <div class="finance-row"><span>Capacidad</span><strong>${/^\d+$/.test(String(info.capacidad).trim()) ? info.capacidad + " GB" : info.capacidad}</strong></div>
        <div class="finance-row${typeof info.applecare_robo_perdida === "number" ? "" : " total"}"><span>AppleCare+</span><strong>${money(info.applecare)}</strong></div>
        ${typeof info.applecare_robo_perdida === "number" ? `<div class="finance-row total"><span>AppleCare+ R y P</span><strong>${money(info.applecare_robo_perdida)}</strong></div>` : ""}
      </div>
    `;
  }

  const manualInput = manualRow.querySelector(".scanner-manual-input");
  const manualBtn = manualRow.querySelector(".scanner-manual-btn");
  manualBtn.addEventListener("click", () => {
    const val = manualInput.value.trim();
    if (val) showResult(val);
  });
  manualInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") manualBtn.click();
  });

  loadScannerLib().then(() => {
    statusEl.textContent = "";
    const instance = new Html5Qrcode("scanner-reader", {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
      verbose: false,
    });
    html5QrcodeInstance = instance;

    let lastCode = null;
    let lastTime = 0;

    instance.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 160 } },
      (decodedText) => {
        const now = Date.now();
        if (decodedText === lastCode && now - lastTime < 2500) return;
        lastCode = decodedText;
        lastTime = now;
        if (navigator.vibrate) navigator.vibrate(80);
        showResult(decodedText);
      },
      () => {} // errores de lectura cuadro a cuadro: se ignoran, son normales
    ).catch(() => {
      statusEl.textContent = "No se pudo abrir la cámara. Revisa los permisos o usa la búsqueda manual de abajo.";
    });
  }).catch(() => {
    statusEl.textContent = "No se pudo cargar el escáner (revisa tu conexión). Usa la búsqueda manual de abajo.";
  });

  return wrap;
}

/* ---- Código cajas: generar el código de barras de AppleCare+ (y el de serie) para escanear en caja ---- */
const CAJAS_CATEGORY_META = {
  "iPhone (T&L)": { icon: "📱" },
  "iPhone": { icon: "📱" },
  "Watch": { icon: "⌚" },
  "iPad": { icon: "📱" },
  "Mac": { icon: "💻" },
  "Studio Display": { icon: "🖥️" },
  "AirPods": { icon: "🎧" },
  "Home / TV": { icon: "🏠" },
};

let barcodeLibPromise = null;
function loadBarcodeLib() {
  if (window.JsBarcode) return Promise.resolve();
  if (barcodeLibPromise) return barcodeLibPromise;
  barcodeLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el generador de códigos."));
    document.head.appendChild(script);
  });
  return barcodeLibPromise;
}

function renderBarcodeInto(container, value, format) {
  container.innerHTML = `<svg class="barcode-svg"></svg>`;
  const svg = container.querySelector("svg");
  loadBarcodeLib().then(() => {
    try {
      window.JsBarcode(svg, value, {
        format: format || "CODE39",
        lineColor: "#000",
        background: "transparent",
        width: 2.4,
        height: 90,
        displayValue: true,
        fontSize: 16,
        margin: 8,
      });
    } catch (e) {
      container.innerHTML = `<p class="pending">No se pudo generar este código.</p>`;
    }
  }).catch(() => {
    container.innerHTML = `<p class="pending">Sin conexión: no se pudo cargar el generador de códigos.</p>`;
  });
}

function buildCajasCategories() {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>Código cajas</h2><p class="ds-sub">Elige el equipo para generar su código de AppleCare+.</p>`;
  wrap.appendChild(heading);

  const cats = CODIGOS_CAJAS ? Object.keys(CODIGOS_CAJAS) : [];
  if (cats.length === 0) {
    wrap.appendChild(buildPlaceholder("Sin datos", "📦", "Aún no hay códigos cargados."));
    return wrap;
  }

  const grid = document.createElement("div");
  cats.forEach((cat, i) => {
    grid.appendChild(dsRow({
      icon: dsIconFor(cat), jw: dsJewelFor(cat, i), label: cat,
      onClick: () => navigate({ screen: "cajasModels", category: cat, title: cat }),
    }));
  });
  wrap.appendChild(grid);
  return wrap;
}

function buildCajasModels(category) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${category}</h2>`;
  wrap.appendChild(heading);

  const models = (CODIGOS_CAJAS && CODIGOS_CAJAS[category]) || [];
  const list = document.createElement("div");
  list.className = "sub-list";
  buildModelPicker(category, models.map(m => m.modelo), wrap, (modelo) => {
    navigate({ screen: "cajasDetail", category, modelo, title: modeloNombre(modelo) });
  }, { titulo: category });
  return wrap;
}

function buildCajasDetail(category, modelo) {
  const wrap = document.createElement("div");
  const models = (CODIGOS_CAJAS && CODIGOS_CAJAS[category]) || [];
  const info = models.find(m => m.modelo === modelo);

  if (!info) {
    wrap.appendChild(buildPlaceholder("Sin datos", "📦", "No se encontró este equipo."));
    return wrap;
  }

  const hero = document.createElement("div");
  hero.className = "ac-hero";
  hero.innerHTML = `
    <span class="ac-hero-icon">📦</span>
    <h2>${info.modelo}</h2>
    <div class="ac-price">${money(info.precio)}</div>
  `;
  wrap.appendChild(hero);

  const chipsRow = document.createElement("div");
  chipsRow.className = "chip-list";
  ["Externo", "Interno"].forEach((label, i) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (i === 0 ? " active" : "");
    chip.textContent = label;
    chip.addEventListener("click", () => {
      chipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      showAcBarcode(label);
    });
    chipsRow.appendChild(chip);
  });
  wrap.appendChild(chipsRow);

  const acBarcodeBox = document.createElement("div");
  acBarcodeBox.className = "barcode-box";
  wrap.appendChild(acBarcodeBox);

  function showAcBarcode(label) {
    const value = label === "Externo" ? info.externo : info.interno;
    renderBarcodeInto(acBarcodeBox, value, "CODE39");
  }
  showAcBarcode("Externo");

  const serialToggleRow = document.createElement("div");
  serialToggleRow.className = "scanner-manual";
  serialToggleRow.style.marginTop = "20px";
  serialToggleRow.innerHTML = `
    <input type="text" placeholder="Número de serie del equipo (opcional)" class="scanner-manual-input serial-input">
    <button class="scanner-manual-btn">Generar</button>
  `;
  wrap.appendChild(serialToggleRow);

  const serialBarcodeBox = document.createElement("div");
  serialBarcodeBox.className = "barcode-box";
  serialBarcodeBox.hidden = true;
  wrap.appendChild(serialBarcodeBox);

  const serialInput = serialToggleRow.querySelector(".serial-input");
  const serialBtn = serialToggleRow.querySelector(".scanner-manual-btn");
  function generateSerial() {
    const val = serialInput.value.trim().toUpperCase();
    if (!val) return;
    serialBarcodeBox.hidden = false;
    renderBarcodeInto(serialBarcodeBox, val, "CODE39");
  }
  serialBtn.addEventListener("click", generateSerial);
  serialInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") generateSerial();
  });

  return wrap;
}

const PRICE_ROWS = [
  { key: "ÓPTIMO",   label: "Óptimo",   color: "#34c759", sub: "Equipo en perfecto estado", jw: "green",  icon: "check" },
  { key: "BATERÍA",  label: "Batería",  color: "#ff9500", sub: "Servicio de batería",       jw: "orange", icon: "battery" },
  { key: "PANTALLA", label: "Pantalla", color: "#0071e3", sub: "Pantalla dañada",           jw: "sky",    icon: "phone" },
  { key: "B Y P",    label: "B y P",    color: "#af52de", sub: "Batería y pantalla",        jw: "purple", icon: "batpho" },
];

// Lee un valor de un nodo de precios ignorando espacios raros (nbsp) en las claves y valores.
function leafVal(node, key) {
  const t = normalizarClave(key);
  const k = Object.keys(node || {}).find(x => normalizarClave(x) === t);
  return k === undefined ? "N/A" : normalizarClave(node[k]);
}

function getNodeAtPath(path) {
  let node = TRADEIN_DATA;
  for (const key of path) {
    if (!node) return null;
    node = node[key];
  }
  return node;
}

// Normaliza espacios "raros" (como el espacio de no separación U+00A0 que a
// veces mete el teclado del iPhone al renombrar archivos o escribir en el
// JSON) a espacios normales, y quita espacios de más. Así, aunque una clave
// en tradein.json tenga ese carácter invisible, sigue encontrando su tarjeta
// visual en tradein_categorias.json.
function normalizarClave(str) {
  return String(str).replace(/\s+/g, " ").trim();
}

function buscarVisual(key) {
  if (!TRADEIN_VISUAL) return null;
  if (TRADEIN_VISUAL[key]) return TRADEIN_VISUAL[key];
  const target = normalizarClave(key);
  const found = Object.keys(TRADEIN_VISUAL).find(k => normalizarClave(k) === target);
  return found ? TRADEIN_VISUAL[found] : null;
}

function isPriceLeaf(node) {
  return node && typeof node === "object" && Object.prototype.hasOwnProperty.call(node, "ÓPTIMO");
}

function buildTradeNode(path) {
  const node = getNodeAtPath(path);
  const wrap = document.createElement("div");

  if (!node) {
    wrap.appendChild(buildPlaceholder("Trade In", "🛒", "No se encontró información para esta selección."));
    return wrap;
  }

  if (isPriceLeaf(node)) {
    // Pantalla "Estado del equipo": nombre del modelo arriba (con la capacidad chiquita) y los precios.
    const isIphone = path[0] === "iPhone";
    const head = document.createElement("div");
    head.className = "ds-head ti-head";
    head.innerHTML = `<div><h2></h2><p></p></div>`;
    head.querySelector("h2").textContent = modeloNombre(path[path.length - 2] || path[0]);
    head.querySelector("p").textContent = modeloNombre(path[path.length - 1]);
    wrap.appendChild(head);

    const goQuote = (row, numeric) => navigate({
      screen: "quoteSelectNew",
      path: [],
      tradeIn: { model: path[1], capacity: path[2], value: numeric, condition: row.label },
      title: "Equipo nuevo",
    });
    const chevSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

    const rowOpt = PRICE_ROWS[0];
    const rawOpt = leafVal(node, rowOpt.key);
    const numOpt = parsePesoValue(rawOpt);
    const hero = document.createElement(isIphone && numOpt !== null ? "button" : "div");
    hero.className = "ti-hero";
    hero.innerHTML = `<div class="ti-hero-tag">${DS_ICONS.check}<span>ÓPTIMO</span></div>
      <div class="ti-hero-price"></div><div class="ti-hero-sub"></div>
      ${isIphone && numOpt !== null ? `<span class="ti-hero-go">${chevSvg}</span>` : ""}`;
    hero.querySelector(".ti-hero-price").textContent = rawOpt;
    hero.querySelector(".ti-hero-sub").textContent = rowOpt.sub;
    if (isIphone && numOpt !== null) hero.addEventListener("click", () => goQuote(rowOpt, numOpt));
    wrap.appendChild(hero);

    const lab = document.createElement("div");
    lab.className = "ti-label";
    lab.textContent = "CON DETALLES";
    wrap.appendChild(lab);

    PRICE_ROWS.slice(1).forEach(row => {
      const raw = leafVal(node, row.key);
      const numeric = parsePesoValue(raw);
      const ok = numeric !== null;
      const clickable = isIphone && ok;
      const item = document.createElement(clickable ? "button" : "div");
      item.className = "ti-row" + (ok ? "" : " off");
      item.innerHTML = `<span class="ds-chip jw-${row.jw}">${DS_ICONS[row.icon]}</span>
        <span class="ds-row-text"><b></b><small></small></span>
        <span class="ti-row-val"></span>${clickable ? '<span class="chev"></span>' : ""}`;
      item.querySelector("b").textContent = row.label;
      item.querySelector("small").textContent = row.sub;
      item.querySelector(".ti-row-val").textContent = ok ? raw : "No aplica";
      if (clickable) item.addEventListener("click", () => goQuote(row, numeric));
      wrap.appendChild(item);
    });
    return wrap;
  }

  // Elegir capacidad (los hijos son nodos de precios): tarjetas con barra de almacenamiento.
  if (path.length >= 2 && Object.values(node).length && Object.values(node).every(isPriceLeaf)) {
    const keys = Object.keys(node);
    const head = document.createElement("div");
    head.className = "ds-head ti-head";
    head.innerHTML = `<div><h2></h2><p>Elige la capacidad que entrega el cliente</p></div>`;
    head.querySelector("h2").textContent = modeloNombre(path[path.length - 1]);
    wrap.appendChild(head);

    const JW = ["blue", "violet", "amber", "rose", "teal", "green"];
    keys.forEach((key, i) => {
      const leaf = node[key];
      const nums = PRICE_ROWS.map(r => parsePesoValue(leafVal(leaf, r.key))).filter(n => n !== null);
      const top = nums.length ? Math.max(...nums) : null;
      const name = modeloNombre(key);
      const m = name.match(/^(\d+(?:\.\d+)?)\s*(GB|TB)$/i);
      const pct = keys.length > 1 ? Math.round(35 + 65 * i / (keys.length - 1)) : 100;
      const b = document.createElement("button");
      b.className = "ti-cap jw-" + JW[i % JW.length];
      b.innerHTML = `<span class="ds-chip">${DS_ICONS.storage}</span>
        <span class="ti-cap-main">
          <span class="ti-cap-size"><b></b><i></i></span>
          <small>Almacenamiento</small>
          <span class="ti-bar"><span style="width:${pct}%"></span></span>
        </span>
        <span class="ti-cap-price"><small>Hasta</small><b></b></span>
        <span class="chev"></span>`;
      b.querySelector(".ti-cap-size b").textContent = m ? m[1] : name;
      b.querySelector(".ti-cap-size i").textContent = m ? m[2].toUpperCase() : "";
      b.querySelector(".ti-cap-price b").textContent = top !== null ? money(top) : "—";
      b.addEventListener("click", () => navigate({ screen: "tradeNode", path: [...path, key], title: "Estado del equipo" }));
      wrap.appendChild(b);
    });
    return wrap;
  }

  // Elegir modelo dentro de una categoría (iPhone, iPad, Watch, Mac): selector visual agrupado.
  if (path.length === 1 && Object.values(node).every(v => v && typeof v === "object" && !isPriceLeaf(v))) {
    buildTradeModelPicker(path, node, wrap);
    return wrap;
  }

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const label = path.length === 0 ? "Trade In" : path[path.length - 1];
  heading.innerHTML = `<h2>${path.length === 0 ? "Selecciona un tipo" : label}</h2>`;
  wrap.appendChild(heading);

  // El menú raíz ("Selecciona un tipo") se ve en cuadrícula o en lista (el botón de arriba a la
  // derecha cambia la vista y se recuerda en este teléfono). Las claves, y a dónde navegan,
  // salen de tradein.json: si agregas una categoría nueva, aparece sola con ícono genérico.
  if (path.length === 0) {
    wrap.removeChild(heading);
    const KEY = "ishop_vista_tradein";
    let vista = "cuadricula";
    try { if (localStorage.getItem(KEY) === "lista") vista = "lista"; } catch (e) {}
    const head = document.createElement("div");
    head.className = "ds-head";
    head.innerHTML = `<div><h2>Selecciona un tipo</h2><p>Elige el dispositivo que deseas consultar.</p></div>
      <div class="view-toggle">
        <button type="button" class="view-toggle-btn" data-v="cuadricula" aria-label="Cuadrícula">${DS_ICONS.grid}</button>
        <button type="button" class="view-toggle-btn" data-v="lista" aria-label="Lista">${DS_ICONS.list}</button>
      </div>`;
    wrap.appendChild(head);
    const box = document.createElement("div");
    wrap.appendChild(box);
    const paint = () => {
      head.querySelectorAll(".view-toggle-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.v === vista));
      box.className = vista === "lista" ? "ds-stack" : "ds-grid";
      box.innerHTML = "";
      Object.keys(node).forEach((key, i) => {
        const t = document.createElement("button");
        t.className = "ds-tile jw-" + dsJewelFor(key, i);
        t.innerHTML = `<span class="ds-tile-chev"></span><span class="ds-tile-icon">${dsIconFor(key)}</span><span class="ds-tile-label"></span>`;
        t.querySelector(".ds-tile-label").textContent = key;
        t.addEventListener("click", () => navigate({ screen: "tradeNode", path: [...path, key], title: key }));
        box.appendChild(t);
      });
    };
    head.addEventListener("click", (e) => {
      const btn = e.target.closest(".view-toggle-btn");
      if (!btn) return;
      vista = btn.dataset.v;
      try { localStorage.setItem(KEY, vista); } catch (e2) {}
      paint();
    });
    paint();
    return wrap;
  }

  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(node).forEach(key => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${key}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "tradeNode", path: [...path, key], title: key });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

/* =====================================================================
   Selector de modelos de Trade In (iPhone / iPad / Watch / Mac)
   Es solo visual: las claves y los precios siguen saliendo de datos/tradein.json,
   así que al reemplazar ese JSON el selector se reacomoda solo. Los grupos y filtros
   se calculan a partir de los nombres de los modelos.
   Imágenes opcionales por modelo: datos/tradein_categorias.json -> "_modelos":
     { "iPhone 14 PRO": { "imagen": "imágenes/tradein/modelos/iphone-14-pro.png" } }
   Si un modelo no tiene imagen se dibuja el dispositivo automáticamente.
   ===================================================================== */
const TRADE_RECIENTES_KEY = "ishop_tradein_recientes";

function modeloNombre(key) { return normalizarClave(String(key).replace(/ /g, " ")); }

function modeloGrupo(cat, key) {
  const n = modeloNombre(key);
  if (cat === "Otro") return { id: "_", titulo: "Modelos", orden: 0, chip: "Todos" };
  if (cat === "iPhone") {
    const t = n.replace(/^iPhone\s+/i, "").split(" ")[0] || "";
    if (/^SE/i.test(t)) return { id: "SE", titulo: "iPhone SE", orden: 0, chip: "SE" };
    const num = t.match(/^(\d+)/);
    if (num) return { id: num[1], titulo: "iPhone " + num[1], orden: Number(num[1]), chip: num[1] };
    const nm = t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "Otros";
    return { id: nm, titulo: "iPhone " + nm, orden: 1000, chip: nm };
  }
  if (cat === "iPad") {
    const g = /mini/i.test(n) ? ["mini", 3] : /air/i.test(n) ? ["Air", 1] : /pro/i.test(n) ? ["Pro", 2] : ["iPad", 0];
    return { id: g[0], titulo: g[0] === "iPad" ? "iPad" : "iPad " + g[0], orden: g[1], chip: g[0] };
  }
  if (cat === "Apple Watch") {
    const g = /ultra/i.test(n) ? ["Ultra", 2] : /\bSE/i.test(n) ? ["SE", 1] : ["Series", 0];
    return { id: g[0], titulo: "Apple Watch " + g[0], orden: g[1], chip: g[0] };
  }
  const m = n.match(/^(MacBook (?:Air|Pro)|iMac|Mac mini|Mac Studio|Mac Pro|Mac)/i);
  const nm = m ? m[1] : n.split(" ").slice(0, 2).join(" ");
  return { id: nm, titulo: nm, orden: /Air/i.test(nm) ? 0 : /Pro/i.test(nm) ? 1 : 2, chip: nm.replace(/^MacBook /i, "") };
}

const MODELO_PALETA = {
  SE: "#3a3a3c", "12": "#7a5bb5", "13": "#e8708a", "14": "#6a8fd8", "15": "#e0b8a8",
  "16": "#5fa39a", "17": "#7f9fd0", "18": "#d4784f", Air: "#c9ced6", Duo: "#4a4a4e",
};
function modeloColor(cat, g, key) {
  let c = MODELO_PALETA[g.id];
  if (!c) { let h = 0; for (const ch of g.id) h = (h * 31 + ch.charCodeAt(0)) % 360; c = `hsl(${h} 38% 58%)`; }
  if (/pro|ultra/i.test(modeloNombre(key))) c = `color-mix(in srgb, ${c} 62%, #1c1c1e)`;
  return c;
}

function modeloThumb(cat, key, g, raw) {
  const vis = TRADEIN_VISUAL && TRADEIN_VISUAL._modelos && (TRADEIN_VISUAL._modelos[key] || TRADEIN_VISUAL._modelos[modeloNombre(key)]);
  if (vis && vis.imagen) return `<img class="mp-img" src="${vis.imagen}" alt="" loading="lazy">`;
  const c = modeloColor(cat, g, key);
  const n = modeloNombre(key);
  let body = "";
  if (cat === "iPhone") {
    const lens = /pro/i.test(n) ? 3 : /^iPhone (SE|Air)/i.test(n) ? 1 : 2;
    const cam = lens === 3
      ? `<rect x="6" y="6" width="17" height="17" rx="5" fill="rgba(255,255,255,.28)"/><circle cx="11.5" cy="11.5" r="2.5" fill="#1c1c1e"/><circle cx="18" cy="11.5" r="2.5" fill="#1c1c1e"/><circle cx="14.8" cy="18" r="2.5" fill="#1c1c1e"/>`
      : lens === 2
      ? `<rect x="6" y="6" width="16" height="16" rx="5" fill="rgba(255,255,255,.28)"/><circle cx="11" cy="11" r="2.6" fill="#1c1c1e"/><circle cx="17.2" cy="17.2" r="2.6" fill="#1c1c1e"/>`
      : `<circle cx="12" cy="11" r="3" fill="#1c1c1e"/>`;
    body = `<svg viewBox="0 0 40 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs><rect x="3" y="2" width="34" height="60" rx="8" fill="${c}"/><rect x="3" y="2" width="34" height="60" rx="8" fill="url(#g)"/>${cam}</svg>`;
  } else if (cat === "iPad") {
    body = `<svg viewBox="0 0 48 64"><rect x="3" y="3" width="42" height="58" rx="6" fill="#1c1c1e"/><rect x="6" y="6" width="36" height="52" rx="3" fill="${c}"/><rect x="6" y="6" width="36" height="52" rx="3" fill="#fff" fill-opacity=".18"/></svg>`;
  } else if (cat === "Apple Watch") {
    body = `<svg viewBox="0 0 40 64"><rect x="10" y="2" width="20" height="14" rx="4" fill="${c}" fill-opacity=".7"/><rect x="10" y="48" width="20" height="14" rx="4" fill="${c}" fill-opacity=".7"/><rect x="5" y="14" width="30" height="36" rx="9" fill="${c}"/><rect x="8.5" y="17.5" width="23" height="29" rx="6" fill="#1c1c1e"/><rect x="35" y="26" width="2.6" height="7" rx="1.3" fill="${c}"/></svg>`;
  } else if (cat === "Otro") {
    const ic0 = dsIconFor(key); return `<span class="mp-draw mp-glyph">${ic0 === DS_ICONS.box ? dsIconFor(raw) : ic0}</span>`;
  } else {
    body = `<svg viewBox="0 0 64 44"><rect x="9" y="4" width="46" height="29" rx="3" fill="#1c1c1e"/><rect x="11" y="6" width="42" height="25" rx="1.5" fill="${c}"/><path d="M3 35h58l-3 5H6z" fill="${c}"/><path d="M3 35h58l-.6 1.2H3.6z" fill="#fff" fill-opacity=".4"/></svg>`;
  }
  return `<span class="mp-draw">${body}</span>`;
}

function tradeRecientes(cat) {
  try { return (JSON.parse(localStorage.getItem(TRADE_RECIENTES_KEY) || "[]") || []).filter(r => r.cat === cat); }
  catch (e) { return []; }
}
function tradeGuardarReciente(cat, key) {
  try {
    const all = JSON.parse(localStorage.getItem(TRADE_RECIENTES_KEY) || "[]") || [];
    const next = [{ cat, key }].concat(all.filter(r => !(r.cat === cat && r.key === key))).slice(0, 12);
    localStorage.setItem(TRADE_RECIENTES_KEY, JSON.stringify(next));
  } catch (e) {}
}

function tradeEliminarReciente(cat, key) {
  try {
    const all = JSON.parse(localStorage.getItem(TRADE_RECIENTES_KEY) || "[]") || [];
    localStorage.setItem(TRADE_RECIENTES_KEY, JSON.stringify(all.filter(r => !(r.cat === cat && r.key === key))));
  } catch (e) {}
}

function buildTradeModelPicker(path, node, wrap) {
  buildModelPicker(path[0], Object.keys(node), wrap, (key) => {
    navigate({ screen: "tradeNode", path: [...path, key], title: "Trade In · " + modeloNombre(key) });
  }, { recents: true });
}

// Categoría "visual" a partir del nombre (iPhone, iPad, Watch, Mac u otra).
function mpCat(c) {
  const t = String(c || "").toLowerCase();
  if (/iphone/.test(t)) return "iPhone";
  if (/ipad/.test(t)) return "iPad";
  if (/watch/.test(t)) return "Apple Watch";
  if (/mac/.test(t)) return "Mac";
  return "Otro";
}

// Selector de modelos con imagen del equipo: se usa en Trade In, AppleCare+, For Life, GET, Switch Up y Código cajas.
// keys = nombres tal como vienen en los JSON; onPick(key) recibe la clave original.
function buildModelPicker(catRaw, keys, wrap, onPick, opts) {
  opts = opts || {};
  const cat = mpCat(catRaw);

  // Agrupar por generación / línea
  const groups = new Map();
  keys.forEach(key => {
    const g = modeloGrupo(cat, key);
    if (cat === "Otro") g.titulo = opts.titulo || String(catRaw || "Modelos");
    if (!groups.has(g.id)) groups.set(g.id, Object.assign({ keys: [] }, g));
    groups.get(g.id).keys.push(key);
  });
  // opts.desc: modelos nuevos de arriba hacia abajo -> Duo, 18, 17, Air, 16, 15, ...
  const ordenDesc = (g) => g.id === "Duo" ? 10000 : g.id === "Air" ? 16.5 : g.id === "SE" ? -1 : g.orden;
  const ordered = [...groups.values()].sort((a, b) => (opts.desc && cat === "iPhone") ? ordenDesc(b) - ordenDesc(a) : a.orden - b.orden);

  let filtro = "Todos";
  const collapsed = new Set();

  const chips = document.createElement("div");
  chips.className = "mp-chips";
  const body = document.createElement("div");
  body.className = "mp-body";

  const chevSvg = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Fila deslizable (izquierda o derecha) para quitar un "usado recientemente"
  function swipeRow(key, g) {
    const box = document.createElement("div");
    box.className = "mp-swipe";
    box.innerHTML = `<span class="mp-swipe-bg"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>Eliminar</span>`;
    const row = modelRow(key, g);
    box.appendChild(row);
    let x0 = 0, y0 = 0, dx = 0, drag = false, decided = false, moved = false;
    row.style.touchAction = "pan-y";
    row.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; dx = 0; drag = true; decided = false; moved = false; row.style.transition = "none"; });
    row.addEventListener("pointermove", e => {
      if (!drag) return;
      const mx = e.clientX - x0, my = e.clientY - y0;
      if (!decided) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        if (Math.abs(my) > Math.abs(mx)) { drag = false; return; }
        decided = true;
        try { row.setPointerCapture(e.pointerId); } catch (err) {}
      }
      dx = mx; moved = true;
      row.style.transform = `translateX(${dx}px)`;
    });
    const end = () => {
      if (!drag) return;
      drag = false;
      row.style.transition = "transform .22s ease";
      if (moved && Math.abs(dx) > Math.min(110, box.offsetWidth * 0.3)) {
        row.style.transform = `translateX(${dx > 0 ? "110%" : "-110%"})`;
        setTimeout(() => { tradeEliminarReciente(cat, key); paint(); }, 200);
      } else {
        row.style.transform = "translateX(0)";
      }
    };
    row.addEventListener("pointerup", end);
    row.addEventListener("pointercancel", end);
    // si fue un deslizamiento, no abrir el modelo
    row.addEventListener("click", e => { if (moved) { e.stopImmediatePropagation(); e.preventDefault(); moved = false; } }, true);
    return box;
  }

  function modelRow(key, g) {
    const row = document.createElement("button");
    row.className = "mp-row";
    row.innerHTML = `<span class="mp-thumb">${modeloThumb(cat, key, g, catRaw)}</span><span class="mp-name"></span><span class="mp-chev"></span>`;
    row.querySelector(".mp-name").textContent = modeloNombre(key);
    const subTxt = typeof opts.sub === "function" ? opts.sub(key) : "";
    if (subTxt) { const sm = document.createElement("small"); sm.className = "mp-sub"; sm.textContent = subTxt; row.querySelector(".mp-name").appendChild(sm); }
    row.addEventListener("click", () => {
      if (opts.recents) tradeGuardarReciente(cat, key);
      onPick(key);
    });
    return row;
  }

  function panel(id, titulo, iconHtml, rows) {
    const sec = document.createElement("section");
    sec.className = "mp-card" + (collapsed.has(id) ? " closed" : "");
    const head = document.createElement("button");
    head.className = "mp-head";
    head.innerHTML = `${iconHtml || ""}<span class="mp-title"></span><span class="mp-toggle">${chevSvg}</span>`;
    head.querySelector(".mp-title").textContent = titulo;
    head.addEventListener("click", () => {
      if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
      sec.classList.toggle("closed", collapsed.has(id));
    });
    const list = document.createElement("div");
    list.className = "mp-list";
    rows.forEach(r => list.appendChild(r));
    sec.append(head, list);
    return sec;
  }

  function paint() {
    chips.querySelectorAll(".mp-chip").forEach(b => b.classList.toggle("on", b.dataset.f === filtro));
    body.innerHTML = "";
    if (filtro === "Todos" && opts.recents) {
      const rec = tradeRecientes(cat).filter(r => keys.includes(r.key)).slice(0, 3);
      if (rec.length) {
        const clock = `<span class="mp-clock"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>`;
        body.appendChild(panel("_rec", "Usados recientemente", clock, rec.map(r => swipeRow(r.key, modeloGrupo(cat, r.key)))));
      }
    }
    ordered.filter(g => filtro === "Todos" || g.id === filtro).forEach(g => {
      body.appendChild(panel(g.id, g.titulo, "", g.keys.map(k => modelRow(k, g))));
    });
  }

  ["Todos", ...ordered.map(g => g.id)].forEach(id => {
    const b = document.createElement("button");
    b.className = "mp-chip";
    b.dataset.f = id;
    b.textContent = id === "Todos" ? "Todos" : groups.get(id).chip;
    b.addEventListener("click", () => { filtro = id; paint(); });
    chips.appendChild(b);
  });

  if (ordered.length > 1) {
    const layout = document.createElement("div");
    layout.className = "mp-layout";
    layout.append(chips, body);
    wrap.appendChild(layout);
  } else {
    wrap.appendChild(body);
  }
  paint();
}

function buildQuoteSelectNew(path, tradeIn) {
  const node = getNodeAtPathIn(PRECIOS_IPHONE, path);
  const wrap = document.createElement("div");

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  banner.innerHTML = `<span>Trade In seleccionado</span><strong>${tradeIn.model} ${tradeIn.capacity} · ${tradeIn.condition} · ${money(tradeIn.value)}</strong>`;
  wrap.appendChild(banner);

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${path.length === 0 ? "Elige el iPhone nuevo" : path[path.length - 1]}</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";

  if (typeof node !== "object" || node === null) {
    wrap.appendChild(buildPlaceholder("Sin datos", "📦", "Aún no hay precios cargados para esta selección."));
    return wrap;
  }

  const isLeaf = Object.values(node).every(v => v === null || typeof v === "number");
  if (isLeaf) {
    Object.entries(node).forEach(([cap, price]) => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${cap}</span><span style="font-weight:650;">${money(price)}</span>`;
      btn.addEventListener("click", () => {
        navigate({
          screen: "quoteResult",
          tradeIn,
          newModel: path[path.length - 1],
          newCapacity: cap,
          title: "Cotización",
        });
      });
      list.appendChild(btn);
    });
  } else if (path.length === 0) {
    buildModelPicker("iPhone", filteredModelKeys(node, path), wrap, (key) => {
      navigate({ screen: "quoteSelectNew", path: [...path, key], tradeIn, title: modeloNombre(key) });
    }, { desc: true });
    return wrap;
  } else {
    filteredModelKeys(node, path).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${key}</span><span class="chev"></span>`;
      btn.addEventListener("click", () => {
        navigate({ screen: "quoteSelectNew", path: [...path, key], tradeIn, title: key });
      });
      list.appendChild(btn);
    });
  }
  wrap.appendChild(list);
  return wrap;
}

function getNodeAtPathIn(root, path) {
  let node = root;
  for (const key of path) {
    if (!node) return null;
    node = node[key];
  }
  return node;
}

function filteredModelKeys(node, path) {
  if (path.length === 0 && Array.isArray(SWITCHUP_MODELOS)) {
    return SWITCHUP_MODELOS.filter(m => Object.prototype.hasOwnProperty.call(node, m));
  }
  return Object.keys(node);
}

function buildQuoteResult(tradeIn, newModel, newCapacity) {
  const wrap = document.createElement("div");
  const newPrice = PRECIOS_IPHONE?.[newModel]?.[newCapacity] ?? null;
  const ac = findApplecareForModel(newModel);
  const base = newPrice === null ? null : newPrice - tradeIn.value;

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  wrap.appendChild(banner);

  function updateBanner(opt) {
    banner.classList.add("quote");
    if (newPrice === null) {
      banner.innerHTML = `<span>${newModel} ${newCapacity}</span><strong>Precio pendiente de cargar</strong>`;
      return;
    }
    const extra = opt && opt.extra > 0 ? opt.extra : 0;
    const line = (cls, label, val) => `<div class="q-line ${cls}"><i></i><em>${label}</em><b>${val}</b></div>`;
    let html = `<span>${newModel} ${newCapacity}</span><strong class="q-total">${money(base + extra)}</strong><div class="q-lines">`;
    html += line("q-eq", "Equipo nuevo", money(newPrice));
    html += line("q-ti", "Trade In", "− " + money(tradeIn.value));
    if (extra) html += line("q-ac", opt.shortLabel, "+ " + money(extra));
    html += `</div>`;
    banner.innerHTML = html;
  }

  const options = [
    { key: "solo", label: "Solo equipo", shortLabel: "Equipo", extra: 0 },
    { key: "ac", label: "Equipo + AppleCare+", shortLabel: "AppleCare+", extra: ac.APPLECARE },
    { key: "acrp", label: "Equipo + AppleCare+ R y P", shortLabel: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
  ];

  wrap.appendChild(buildPlanTabs(options, base, { onSelect: updateBanner }));

  if (newPrice !== null) {
    wrap.appendChild(buildTradeInAltFinancing(tradeIn, newModel, newCapacity, newPrice, ac));
  }

  return wrap;
}

function buildTradeInAltFinancing(tradeIn, newModel, newCapacity, newPrice, ac) {
  const wrap = document.createElement("div");
  wrap.style.marginTop = "18px";

  const label = document.createElement("p");
  label.className = "plan-note";
  label.style.margin = "0 0 8px 2px";
  label.textContent = "¿Prefieres verlo en otra forma de pago?";
  wrap.appendChild(label);

  const select = document.createElement("select");
  select.className = "alt-finance-select";
  select.innerHTML = `
    <option value="">Elegir…</option>
    <option value="IFL">iPhone For Life + AC</option>
    <option value="IFL_SOLO">iPhone For Life (solo, sin AC)</option>
    <option value="GET">GET + AC</option>
    <option value="GET_SOLO">GET (solo, sin AC)</option>
    <option value="switchup">Switch Up</option>
  `;
  wrap.appendChild(select);

  const resultArea = document.createElement("div");
  resultArea.style.marginTop = "12px";
  wrap.appendChild(resultArea);

  select.addEventListener("change", () => {
    resultArea.innerHTML = "";
    if (!select.value) return;

    if (select.value === "switchup") {
      const switchBase = newPrice + MEMBRESIA_SWITCH - tradeIn.value;
      const banner = document.createElement("div");
      banner.className = "trade-banner";
      banner.innerHTML = `<span>Switch Up con Trade In</span><strong>${money(newPrice)} + ${money(MEMBRESIA_SWITCH)} − ${money(tradeIn.value)} (Trade In) = ${money(switchBase)}</strong>`;
      resultArea.appendChild(banner);

      const options = [
        { key: "ac", label: "AppleCare+", extra: ac.APPLECARE },
        { key: "acrp", label: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
      ];
      resultArea.appendChild(buildPlanTabs(options, switchBase));
      return;
    }

    const solo = /_SOLO$/.test(select.value);
    const planKey = select.value.replace(/_SOLO$/, "");
    const cfg = FINANCE_CONFIG[planKey];
    const finData = FINANCIAMIENTO_DATA?.[newModel]?.[newCapacity]?.[planKey];
    if (!finData) {
      resultArea.appendChild(buildPlaceholder("Sin datos", "💳", "Aún no hay plan " + cfg.label + " cargado para este equipo."));
      return;
    }

    const totalMsi = cfg.phase1 + cfg.phase2Months;
    const descuentoMensual = tradeIn.value / totalMsi;
    const discountedFinData = {
      monthly: Math.max(0, finData.monthly - descuentoMensual),
      residual: finData.residual,
    };

    const banner = document.createElement("div");
    banner.className = "trade-banner";
    banner.innerHTML = `<span>${cfg.label}${solo ? " solo" : ""} con Trade In</span><strong>${money(finData.monthly)}/mes − ${money(descuentoMensual)} (Trade In ÷ ${totalMsi} msi) = ${money(discountedFinData.monthly)}/mes</strong>`;
    resultArea.appendChild(banner);

    resultArea.appendChild(buildFinanceColumnsGrid(discountedFinData, ac, cfg, { solo }));
  });

  return wrap;
}

function buildSwitchSelect(path) {
  const node = getNodeAtPathIn(PRECIOS_IPHONE, path);
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${path.length === 0 ? "Elige el iPhone nuevo" : path[path.length - 1]}</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";

  if (typeof node !== "object" || node === null) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🔄", "Aún no hay precios cargados para esta selección."));
    return wrap;
  }

  const isLeaf = Object.values(node).every(v => v === null || typeof v === "number");
  if (isLeaf) {
    Object.entries(node).forEach(([cap, price]) => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${cap}</span><span style="font-weight:650;">${money(price)}</span>`;
      btn.addEventListener("click", () => {
        navigate({ screen: "switchResult", newModel: path[path.length - 1], newCapacity: cap, title: "Switch Up" });
      });
      list.appendChild(btn);
    });
  } else if (path.length === 0) {
    buildModelPicker("iPhone", filteredModelKeys(node, path), wrap, (key) => {
      navigate({ screen: "switchSelect", path: [...path, key], title: modeloNombre(key) });
    }, { desc: true });
    return wrap;
  } else {
    filteredModelKeys(node, path).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${key}</span><span class="chev"></span>`;
      btn.addEventListener("click", () => {
        navigate({ screen: "switchSelect", path: [...path, key], title: key });
      });
      list.appendChild(btn);
    });
  }
  wrap.appendChild(list);
  return wrap;
}

function buildSwitchResult(newModel, newCapacity) {
  const wrap = document.createElement("div");
  const newPrice = PRECIOS_IPHONE?.[newModel]?.[newCapacity] ?? null;
  const ac = findApplecareForModel(newModel);
  let incluir = true;
  let lastOpt = null;

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  wrap.appendChild(banner);

  const baseActual = () => newPrice === null ? null : newPrice + (incluir ? MEMBRESIA_SWITCH : 0);

  function updateBanner(opt) {
    lastOpt = opt || lastOpt;
    opt = lastOpt;
    if (newPrice === null) {
      banner.innerHTML = `<span>${newModel} ${newCapacity}</span><strong>Precio pendiente de cargar</strong>`;
      return;
    }
    const base = baseActual();
    let html = `<span>${newModel} ${newCapacity}</span><strong>${money(newPrice)}`;
    if (incluir) html += ` + ${money(MEMBRESIA_SWITCH)} membresía`;
    if (opt && opt.extra !== null && opt.extra !== undefined) {
      html += ` + ${money(opt.extra)} ${opt.label} = ${money(base + opt.extra)}</strong>`;
    } else {
      html += ` = ${money(base)}</strong>`;
    }
    banner.innerHTML = html;
  }

  const options = [
    { key: "ac", label: "AppleCare+", extra: ac.APPLECARE },
    { key: "acrp", label: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
  ];

  // Recuadro: incluir membresía Switch Up (Sí / No, solo equipo)
  const memb = document.createElement("div");
  memb.className = "sw-memb";
  memb.innerHTML = `
    <div class="sw-memb-head"><span class="sw-memb-ico"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span><div><b>Incluir membresía Switch Up</b><small>Membresía Switch Up · ${money(MEMBRESIA_SWITCH)}</small></div></div>
    <div class="sw-memb-opts"><button type="button" class="on" data-v="1">Sí, incluir</button><button type="button" data-v="0">No, solo equipo</button></div>`;
  wrap.appendChild(memb);

  const planHost = document.createElement("div");
  wrap.appendChild(planHost);

  function renderPlans() {
    planHost.innerHTML = "";
    lastOpt = null;
    planHost.appendChild(buildPlanTabs(options, baseActual(), { onSelect: updateBanner, phonePrice: newPrice }));
  }

  memb.querySelectorAll(".sw-memb-opts button").forEach(b => {
    b.addEventListener("click", () => {
      incluir = b.dataset.v === "1";
      memb.querySelectorAll(".sw-memb-opts button").forEach(x => x.classList.toggle("on", x === b));
      renderPlans();
    });
  });

  renderPlans();
  return wrap;
}

function buildAcCategories() {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "home-heading";
  heading.innerHTML = `<h2>AppleCare+</h2><p>Protección oficial Apple para cada equipo.</p>`;
  wrap.appendChild(heading);

  const cats = APPLECARE_INFO ? Object.keys(APPLECARE_INFO) : [];
  if (cats.length === 0) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛡️", "Aún no hay información de AppleCare+ cargada."));
    return wrap;
  }

  const list = document.createElement("div");
  cats.forEach((cat, i) => {
    list.appendChild(dsRow({
      icon: dsIconFor(cat), jw: dsJewelFor(cat, i), label: cat,
      onClick: () => navigate({ screen: "acModels", category: cat, title: cat }),
    }));
  });
  wrap.appendChild(list);
  return wrap;
}

function buildAcModels(category) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${category}</h2>`;
  wrap.appendChild(heading);

  const models = APPLECARE_INFO?.[category] || {};
  buildModelPicker(category, Object.keys(models), wrap, (model) => {
    const variants = Object.keys(models[model]);
    if (variants.length === 1) {
      navigate({ screen: "acDetail", category, model, variant: variants[0], title: modeloNombre(model) });
    } else {
      navigate({ screen: "acVariants", category, model, title: modeloNombre(model) });
    }
  }, { titulo: category, desc: true, sub: (m) => { const v = models[m] && Object.values(models[m])[0]; return v && v.aplica ? "Cubre " + v.aplica : ""; } });
  return wrap;
}

function buildAcVariants(category, model) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${model}</h2>`;
  wrap.appendChild(heading);

  const variants = APPLECARE_INFO?.[category]?.[model] || {};
  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(variants).forEach(v => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${v}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "acDetail", category, model, variant: v, title: v });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function benefitIcon(text) {
  const t = text.toLowerCase();
  if (t.includes("batería")) return "🔋";
  if (t.includes("robo") || t.includes("extrav")) return "🛡️";
  if (t.includes("soporte")) return "🎧";
  if (t.includes("pencil") || t.includes("keyboard")) return "✏️";
  if (t.includes("original")) return "🔧";
  if (t.includes("accidental")) return "💥";
  return "✅";
}

function buildAcDetail(category, model, variant) {
  const wrap = document.createElement("div");
  const info = APPLECARE_INFO?.[category]?.[model]?.[variant];

  if (!info) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛡️", "Aún no hay información cargada para este equipo."));
    return wrap;
  }

  const roboPrice = info["Robo y Extravío"];
  const hasRobo = roboPrice !== undefined && roboPrice !== null;
  const years = coverageYears(category, model + " " + variant);
  const diff = (hasRobo && typeof info.precio === "number" && typeof roboPrice === "number") ? roboPrice - info.precio : null;

  const hero = document.createElement("div");
  hero.className = "ds-hero";
  hero.innerHTML = `
    <span class="ds-hero-chip">${DS_ICONS.shield}</span>
    <h2></h2>
    <p class="ds-hero-sub"></p>
    <span class="ds-pill">${DS_ICONS.calendar}<span>${years} años de cobertura</span></span>
    ${hasRobo ? `
      <div class="ds-plans">
        <div class="ds-plan">
          <span>AppleCare+</span>
          <strong>${money(info.precio)}</strong>
        </div>
        <div class="ds-plan alt">
          <span>Con Robo y Extravío</span>
          <strong>${money(roboPrice)}</strong>
        </div>
      </div>
      ${diff && diff > 0 ? `<p class="ds-plan-note">Agrega protección contra robo y extravío por ${money(diff)} más.</p>` : ""}
    ` : `<div class="ds-price">${money(info.precio)}</div>`}
    ${info.aplica ? `<p class="ds-aplica"><b>Cubre</b> <span></span></p>` : ""}
  `;
  if (info.aplica) hero.querySelector(".ds-aplica span").textContent = info.aplica;
  hero.querySelector("h2").textContent = model;
  hero.querySelector(".ds-hero-sub").textContent = variant;
  wrap.appendChild(hero);

  // Gesto secreto: mantener presionado el precio de AppleCare+ (el normal) abre Reparaciones.
  const repTrigger = hero.querySelector(".ds-plan:not(.alt)") || hero.querySelector(".ds-price");
  if (repTrigger && repairPartsFor(category, info).length) {
    repTrigger.classList.add("rep-trigger");
    setupRepairTrigger(repTrigger, () => {
      navigate({ screen: "repair", category, model, variant, title: "Reparaciones" });
    });
  }

  function card(icon, title, cls) {
    const c = document.createElement("div");
    c.className = "ds-card" + (cls ? " " + cls : "");
    const h = document.createElement("h4");
    h.innerHTML = `${icon}<span></span>`;
    h.querySelector("span").textContent = title;
    c.appendChild(h);
    wrap.appendChild(c);
    return c;
  }
  function kvRows(c, obj) {
    Object.entries(obj).forEach(([k, v]) => {
      const row = document.createElement("div");
      row.className = "ds-kv";
      row.innerHTML = `<span>${dsKeyIcon(k)}<em></em></span><strong>${money(v)}</strong>`;
      row.querySelector("em").textContent = k;
      c.appendChild(row);
    });
  }

  if (Array.isArray(info.cubre) && info.cubre.length) {
    const c = card(DS_ICONS.shield, "Todo lo que incluye");
    info.cubre.forEach(t => {
      const b = benefitChip(t);
      const row = document.createElement("div");
      row.className = "ds-incl";
      row.innerHTML = `<span class="ds-chip sm jw-${b.jw}">${b.icon}</span><span></span>`;
      row.lastChild.textContent = t;
      c.appendChild(row);
    });
  }

  if (info.deducibles && Object.keys(info.deducibles).length) {
    kvRows(card(DS_ICONS.doc, "Deducibles por evento", "ds-card-rose"), info.deducibles);
  }

  if (info.sinAppleCare && Object.keys(info.sinAppleCare).length) {
    kvRows(card(DS_ICONS.wrench, "Reparación sin AppleCare+", "ds-card-teal"), info.sinAppleCare);
  }

  // Acceso a "¿Qué cubre?" de este mismo equipo (no duplica datos: abre la
  // pantalla existente con el modelo ya seleccionado).
  const covCat = coverageCategoryForAc(category, model);
  if (covCat) {
    const covVariant = Object.keys(COBERTURA_DATA[covCat])[0];
    const holder = document.createElement("div");
    holder.style.marginTop = "12px";
    holder.appendChild(dsRow({
      icon: DS_ICONS.shield, jw: "teal", label: "Ver qué cubre", sub: "Cobertura, cuotas y casos que aplican",
      onClick: () => navigate({ screen: "coverageDetail", category: covCat, variant: covVariant, preModel: model, title: covCat }),
    }));
    wrap.appendChild(holder);
  }

  return wrap;
}

/* =====================================================================
   Reparaciones (sección oculta)
   Se abre manteniendo presionado el precio de AppleCare+ en el detalle de un iPhone.
   Los importes salen de datos/applecare_info.json (sinAppleCare y deducibles)
   y de datos/cobertura.json (cuota de cristal trasero y condición de batería).
   Imágenes: reparaciones/<id>.jpg  (opcional por modelo: reparaciones/<modelo-en-minusculas-con-guiones>/<id>.jpg)
   ===================================================================== */
const REPAIR_PARTS = [
  { id: "camara",   label: "Cámara",         icon: "📷", title: "Sistema de cámaras.", sub: "Ingeniería de precisión, pieza por pieza.",
    sin: "Daño de la cámara trasera", con: { deducible: ["Otros daños", "Otro daño accidental"] } },
  { id: "pantalla", label: "Pantalla",       icon: "📱", title: "Pantalla.", sub: "Una reparación que exige precisión.",
    sin: ["Daño de la pantalla", "Daño en la pantalla exterior"], con: { deducible: ["Pantalla", "Daño en la pantalla exterior"] } },
  { id: "pantalla-interior", label: "Pantalla interior", icon: "📖", title: "Pantalla interior.", sub: "Precisión en cada pliegue.",
    sin: "Daño en la pantalla interior", con: { deducible: "Daño en la pantalla interior" } },
  { id: "bateria",  label: "Batería",        icon: "🔋", title: "Batería.", sub: "La energía de tu iPhone, bien cuidada.",
    sin: "Servicio de batería", con: { bateria: true } },
  { id: "vidrio",   label: "Vidrio trasero", icon: "✨", title: "Vidrio trasero.", sub: "El acabado que se ve y se siente.",
    sin: "Daño de la parte posterior de vidrio", con: { cuota: "Cristal trasero" } },
  { id: "cubierta", label: "Capa de cubierta", icon: "🛡️", title: "Capa de cubierta.", sub: "La primera capa de protección.",
    sin: "Daño en la capa de la cubierta", con: { deducible: "Daño en la capa de la cubierta" } },
  { id: "cuerpo",   label: "Cuerpo",         icon: "🛠️", title: "Cuerpo.", sub: "El chasis que mantiene todo unido.",
    sin: "Otro daño", con: { deducible: ["Otros daños", "Otro daño accidental"] } },
];

function setRepairTheme(on) {
  document.documentElement.classList.toggle("rep-mode", !!on);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", on ? "#0a0a0c" : ishopColorBarra());
}

function setupRepairTrigger(el, onOpen) {
  const HOLD_MS = 800;
  let timer = null, sx = 0, sy = 0;
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    el.classList.remove("rep-pressing");
  };
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    sx = e.clientX; sy = e.clientY;
    el.classList.add("rep-pressing");
    timer = setTimeout(() => {
      timer = null;
      el.classList.remove("rep-pressing");
      if (navigator.vibrate) navigator.vibrate(15);
      onOpen();
    }, HOLD_MS);
  });
  el.addEventListener("pointermove", (e) => {
    if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) cancel();
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(t => el.addEventListener(t, cancel));
  // En algunos celulares (Android) la pulsación larga dispara "contextmenu" antes de que termine el
  // temporizador: se usa también como disparador para que el menú secreto siempre abra.
  el.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (timer) {
      cancel();
      if (navigator.vibrate) navigator.vibrate(15);
      onOpen();
    }
  });
  el.addEventListener("touchstart", () => {}, { passive: true });
}

// Algunos modelos usan otros nombres en los datos (p. ej. iPhone Duo): se acepta una lista de nombres posibles.
const repairList = (x) => Array.isArray(x) ? x : [x];
const repairSinKey = (part, info) => repairList(part.sin).find(k => typeof info?.sinAppleCare?.[k] === "number");

// Importe "con AppleCare+" de una pieza, sacado de los datos existentes. null = no hay dato.
function repairWithAc(part, info, category) {
  const c = part.con;
  const cob = COBERTURA_DATA?.[category]?.["AppleCare+"];
  if (c.deducible) {
    const dk = repairList(c.deducible).find(k => typeof info?.deducibles?.[k] === "number");
    return dk ? { amount: info.deducibles[dk], note: "Deducible · " + dk } : null;
  }
  if (c.cuota) {
    const q = (cob?.cuotas || []).find(x => x.label === c.cuota);
    const v = parsePesoValue(q?.precio);
    return v === null ? null : { amount: v, note: "Cuota · " + c.cuota };
  }
  if (c.bateria) {
    return cob?.bateria ? { text: "Sin costo", note: cob.bateria.condicion } : null;
  }
  return null;
}

// Piezas que sí tienen precio sin AppleCare+ y con AppleCare+ para este equipo.
function repairPartsFor(category, info) {
  if (category !== "iPhone" || !info?.sinAppleCare) return [];
  return REPAIR_PARTS.filter(p =>
    repairSinKey(p, info) && repairWithAc(p, info, category)
  );
}

function buildRepairImage(urls, onFail) {
  const img = document.createElement("img");
  img.className = "rep-img";
  img.alt = "";
  img.decoding = "async";
  img.draggable = false;
  let i = 0;
  img.addEventListener("error", () => {
    i += 1;
    if (i < urls.length) img.src = urls[i];
    else onFail();
  });
  img.src = urls[0];
  return img;
}

function buildRepair(category, model, variant) {
  const info = APPLECARE_INFO?.[category]?.[model]?.[variant];
  const parts = repairPartsFor(category, info);
  const wrap = document.createElement("div");

  if (!parts.length) {
    wrap.style.padding = "20px 16px";
    wrap.appendChild(buildPlaceholder("Sin datos", "🛠️", "Aún no hay costos de reparación cargados para este equipo."));
    return wrap;
  }

  const slug = model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  wrap.innerHTML = `
    <section class="rep-hero">
      <div class="rep-glow"></div>
      <div class="rep-stage"></div>
      <div class="rep-fallback"></div>
      <div class="rep-cap">
        <span class="rep-eyebrow"></span>
        <h2 class="rep-title"></h2>
        <p class="rep-sub"></p>
      </div>
      <div class="rep-tabs" role="tablist"></div>
      <button class="rep-expand" type="button" aria-label="Ver imagen completa">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2h4v4M6 14H2v-4M14 2l-4.5 4.5M2 14l4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="rep-concept">Imagen conceptual ilustrativa</span>
    </section>
    <div class="rep-cards">
      <div class="rep-card rep-card-ac">
        <span class="rep-lbl">Con AppleCare+</span>
        <strong class="rep-price"></strong>
        <span class="rep-cur">MXN</span>
        <span class="rep-note"></span>
      </div>
      <div class="rep-card rep-card-no">
        <span class="rep-lbl">Sin AppleCare+</span>
        <strong class="rep-price"></strong>
        <span class="rep-cur">MXN</span>
        <span class="rep-note"></span>
      </div>
    </div>
    <button class="rep-more" type="button" aria-expanded="false">
      <span>Ver más costos y detalles</span>
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="rep-details" hidden></div>
  `;

  const $ = (sel) => wrap.querySelector(sel);
  $(".rep-eyebrow").textContent = model;
  const stage = $(".rep-stage");
  const hero = $(".rep-hero");
  const tabsEl = $(".rep-tabs");
  const cardAc = $(".rep-card-ac");
  const cardNo = $(".rep-card-no");

  const state = parts.map(p => ({ part: p, img: null, failed: false }));
  let active = 0;

  function paintCard(card, value, note) {
    const priceEl = card.querySelector(".rep-price");
    const curEl = card.querySelector(".rep-cur");
    const isText = value.text !== undefined;
    priceEl.textContent = isText ? value.text : money(value.amount);
    priceEl.classList.toggle("txt", isText);
    curEl.hidden = isText;
    card.querySelector(".rep-note").textContent = note || "";
  }

  function select(i) {
    active = i;
    const s = state[i];
    const p = s.part;
    state.forEach((x, k) => { if (x.img) x.img.classList.toggle("on", k === i); });
    tabsEl.querySelectorAll(".rep-tab").forEach((b, k) => {
      b.classList.toggle("on", k === i);
      b.setAttribute("aria-selected", k === i ? "true" : "false");
    });
    $(".rep-title").textContent = p.title;
    $(".rep-sub").textContent = p.sub;
    hero.classList.toggle("rep-noimg", s.failed);
    $(".rep-fallback").textContent = p.icon;
    paintCard(cardAc, repairWithAc(p, info, category), repairWithAc(p, info, category).note);
    const sinKey = repairSinKey(p, info);
    paintCard(cardNo, { amount: info.sinAppleCare[sinKey] }, sinKey);
  }

  state.forEach((s, i) => {
    const p = s.part;
    s.img = buildRepairImage(
      [`reparaciones/${slug}/${p.id}.jpg`, `reparaciones/${p.id}.jpg`],
      () => { s.failed = true; s.img.remove(); if (active === i) select(i); }
    );
    stage.appendChild(s.img);

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "rep-tab";
    tab.setAttribute("role", "tab");
    tab.textContent = p.label;
    tab.addEventListener("click", () => select(i));
    tabsEl.appendChild(tab);
  });

  // Detalle: mismos datos que ya muestra la pantalla de AppleCare+, sin duplicarlos en otro lugar.
  const details = $(".rep-details");
  const block = (title, obj) => `<div class="plan-result"><h4>${title}</h4>`
    + Object.entries(obj).map(([k, v]) => `<div class="plan-phase"><span>${k}</span><strong>${money(v)}</strong></div>`).join("")
    + `</div>`;
  details.innerHTML =
    (info.deducibles && Object.keys(info.deducibles).length ? block("Deducibles con AppleCare+", info.deducibles) : "")
    + block("Reparación sin AppleCare+", info.sinAppleCare);
  const more = $(".rep-more");
  more.addEventListener("click", () => {
    const open = details.hidden;
    details.hidden = !open;
    more.classList.toggle("open", open);
    more.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) details.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const openViewer = () => {
    const s = state[active];
    if (!s.failed && s.img) openRepairViewer(s.img.currentSrc || s.img.src);
  };
  stage.addEventListener("click", openViewer);
  $(".rep-expand").addEventListener("click", openViewer);

  select(0);
  return wrap;
}

// Visor a pantalla completa: pellizcar o doble toque para acercar, arrastrar para mover, ✕ para cerrar.
function openRepairViewer(src) {
  const ov = document.createElement("div");
  ov.className = "rep-viewer";
  const img = document.createElement("img");
  img.src = src; img.alt = ""; img.draggable = false;
  const close = document.createElement("button");
  close.type = "button"; close.className = "rep-viewer-close";
  close.setAttribute("aria-label", "Cerrar"); close.textContent = "✕";
  const hint = document.createElement("span");
  hint.className = "rep-viewer-hint";
  hint.textContent = "Pellizca o toca dos veces para acercar";
  ov.append(img, close, hint);
  document.body.appendChild(ov);

  let s = 1, tx = 0, ty = 0, startDist = 0, startS = 1, lastTap = 0, moved = false, sx = 0, sy = 0;
  const pts = new Map();
  const apply = () => { img.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; };
  const clamp = () => {
    const mx = (s - 1) * ov.clientWidth / 2, my = (s - 1) * ov.clientHeight / 2;
    tx = Math.max(-mx, Math.min(mx, tx));
    ty = Math.max(-my, Math.min(my, ty));
    if (s <= 1) { tx = 0; ty = 0; }
  };
  const onKey = (e) => { if (e.key === "Escape") shut(); };
  function shut() { ov.remove(); document.removeEventListener("keydown", onKey); }
  document.addEventListener("keydown", onKey);
  close.addEventListener("click", shut);

  ov.addEventListener("pointerdown", (e) => {
    if (e.target === close) return;
    ov.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false; sx = e.clientX; sy = e.clientY;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      startDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      startS = s;
    }
  });
  ov.addEventListener("pointermove", (e) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) moved = true;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      s = Math.max(1, Math.min(5, startS * Math.hypot(a.x - b.x, a.y - b.y) / startDist));
    } else if (s > 1) {
      tx += dx; ty += dy;
    }
    clamp(); apply();
  });
  ov.addEventListener("pointerup", (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 0 && !moved && e.target !== close) {
      const now = Date.now();
      if (now - lastTap < 300) { s = s > 1 ? 1 : 2.5; clamp(); apply(); lastTap = 0; }
      else lastTap = now;
    }
  });
  ov.addEventListener("pointercancel", (e) => pts.delete(e.pointerId));
  ov.addEventListener("wheel", (e) => {
    e.preventDefault();
    s = Math.max(1, Math.min(5, s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    clamp(); apply();
  }, { passive: false });
}


/* ---------- Pantalla de ajustes ---------- */
function buildSettings(entry) {
  const a0 = ishopAjustes();
  const wrap = document.createElement("div");
  wrap.className = "set-page";
  wrap.innerHTML = `
    <div class="home-heading"><h2>${entry.welcome ? "¡Bienvenido!" : "Ajustes"}</h2>
      <p>${entry.welcome ? "Configura tu app. Esto se guarda solo en tu teléfono y lo cambias cuando quieras." : "Se guardan solos en este teléfono."}</p></div>
    <div class="set-card"><label class="set-label" for="setNombre">Tu nombre</label>
      <input id="setNombre" class="set-input" type="text" maxlength="30" autocomplete="off" autocapitalize="words" placeholder="Escribe tu nombre"></div>
    <div class="set-card"><div class="set-label">Color</div>
      <div class="set-swatches" id="setSw"></div></div>
    <div class="set-card"><div class="set-label">Apariencia</div>
      <div class="set-seg" id="setModo">
        <button type="button" data-v="claro">Claro</button><button type="button" data-v="oscuro">Oscuro</button><button type="button" data-v="auto">Automático</button>
      </div></div>
    <div class="set-card"><div class="set-label">Mosaicos del menú</div>
      <div class="set-seg" id="setTiles">
        <button type="button" data-v="original">Colores variados</button><button type="button" data-v="acento">Un solo color</button>
      </div></div>
    ${entry.welcome ? `<button type="button" class="set-go" id="setGo">Empezar</button>` : `<button type="button" class="set-reset" id="setReset">Restablecer colores</button>`}
  `;
  const $ = (q) => wrap.querySelector(q);
  const nom = $("#setNombre");
  nom.value = a0.nombre;
  nom.addEventListener("input", () => ishopGuardarAjustes({ nombre: nom.value.trim().slice(0, 30), listo: true }));

  const sw = $("#setSw");
  ISHOP_ACENTOS.forEach(([name, hex]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "set-sw"; b.dataset.hex = hex; b.setAttribute("aria-label", name);
    b.style.background = hex;
    b.addEventListener("click", () => { ishopGuardarAjustes({ acento: hex, listo: true }); paint(); });
    sw.appendChild(b);
  });
  const custom = document.createElement("label");
  custom.className = "set-sw set-sw-custom"; custom.setAttribute("aria-label", "Otro color");
  custom.innerHTML = `<span>+</span><input type="color" value="${a0.acento}">`;
  custom.querySelector("input").addEventListener("input", (e) => { ishopGuardarAjustes({ acento: e.target.value, listo: true }); paint(); });
  sw.appendChild(custom);

  const bindSeg = (id, key) => {
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      ishopGuardarAjustes({ [key]: b.dataset.v, listo: true }); paint();
    });
  };
  bindSeg("#setModo", "modo"); bindSeg("#setTiles", "mosaicos");

  function paint() {
    const a = ishopAjustes();
    sw.querySelectorAll(".set-sw[data-hex]").forEach(b => b.classList.toggle("on", b.dataset.hex.toLowerCase() === a.acento.toLowerCase()));
    custom.classList.toggle("on", !ISHOP_ACENTOS.some(([, h]) => h.toLowerCase() === a.acento.toLowerCase()));
    custom.style.background = custom.classList.contains("on") ? a.acento : "";
    $("#setModo").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.v === a.modo));
    $("#setTiles").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.v === a.mosaicos));
  }
  paint();

  const go = $("#setGo");
  if (go) go.addEventListener("click", () => { ishopGuardarAjustes({ nombre: nom.value.trim().slice(0, 30), listo: true }); goHome(); });
  const rs = $("#setReset");
  if (rs) rs.addEventListener("click", () => { ishopGuardarAjustes({ acento: ISHOP_AJUSTES_DEF.acento, modo: ISHOP_AJUSTES_DEF.modo, mosaicos: ISHOP_AJUSTES_DEF.mosaicos }); paint(); });
  return wrap;
}

/* =====================================================================
   Registro de documentos (oculto)
   Se abre manteniendo presionado "Código cajas" ~3 segundos.
   Flujo: 1) Datos del cliente + firma  →  2) Fotos (frente, atrás, ticket; el frente
   llena el nombre solo)  →  3) Confirmar  →  4) Palomita verde + registros.
   Todo se guarda en ESTE teléfono (IndexedDB) y se borra solo a las 48 h.
   Banner: imágenes/docs/banner.jpg (o .png). Lector de texto: libs/tesseract/.
   ===================================================================== */
const DOCS_TITULO = "iPhone/iPad/Mac/Watch®";
const DOCS_PROGRAMAS = ["For Life", "Get", "Switch Up", "Trade In", "Cancelación For Life", "Trade In Cancelación"];
const DOCS_TC = "Trade In Cancelación";   // Trade In por cancelación de For Life: formato de 1 hoja con datos + firma
const DOCS_SUCURSAL = "Morelia";
const DOCS_BANNERS = ["imágenes/docs/banner.jpg", "imágenes/docs/banner.png"];
const DOCS_TTL_MS = 48 * 60 * 60 * 1000;
const DOCS_HOLD_MS = 3000;

/* ---------- Borrador compartido entre pantallas ---------- */
function docsNewDraft() {
  return {
    email: "", nombre: "", paterno: "", materno: "", telefono: "", serie: "", fechaCompra: "",
    firmaUrl: "", firmaAsesorUrl: "",
    // Trade In (contrato completo)
    estado: "", asesor: "", rfc: "", calle: "", cp: "", numExt: "", numInt: "", colonia: "",
    localidad: "", referencia: "", municipio: "",
    modelo: "", capacidad: "", imei: "", costo: "",
    modeloN: "", capacidadN: "", serieN: "", imeiN: "",
    idTipo: "INE", aceptaTyC: false, aceptaAviso: false,
    frente: null, reverso: null, ticket: null,
    names: { frente: "", reverso: "", ticket: "" },
    nombreEnFotos: false,   // true = el nombre se escribió en la pantalla de fotos (no se bloquea)
    programa: "",           // "For Life" | "Get" | "Switch Up" | "Trade In" (se elige en Registros)
  };
}
let docsDraft = docsNewDraft();
const docsFullName = (d) => [d.nombre, d.paterno, d.materno].filter(Boolean).join(" ");
const docsHayDatos = (d) => !!(d.email || (d.nombre && !d.nombreEnFotos) || d.paterno || d.materno || d.telefono || d.serie || d.fechaCompra || d.firmaUrl || d.rfc || d.calle || d.modelo || d.costo);
const docsIsoLarga = (iso) => { const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? docsFechaLarga(new Date(+m[1], +m[2] - 1, +m[3])) : String(iso || ""); };
const docsFechaHoy = () => new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

/* ---------- Base de datos del teléfono ---------- */
function docsOpenDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("sin IndexedDB")); return; }
    const req = indexedDB.open("ishop_docs", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("registros", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function docsRun(mode, fn) {
  const db = await docsOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("registros", mode);
    const req = fn(tx.objectStore("registros"));
    tx.oncomplete = () => { db.close(); resolve(req ? req.result : undefined); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
const docsAllRaw = async () => (await docsRun("readonly", s => s.getAll())) || [];
const docsPut = (rec) => docsRun("readwrite", s => s.put(rec));
const docsDelete = (id) => docsRun("readwrite", s => s.delete(id));

// Borra los registros con más de 48 h y devuelve el resto (más nuevo primero).
async function docsAll() {
  const now = Date.now();
  const all = await docsAllRaw();
  const vivos = [];
  for (const r of all) {
    if (now - new Date(r.fecha).getTime() > DOCS_TTL_MS) { try { await docsDelete(r.id); } catch (e) {} }
    else vivos.push(r);
  }
  return vivos.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
docsAll().catch(() => {});   // limpieza al abrir la app

function docsTimeLeft(rec) {
  const ms = DOCS_TTL_MS - (Date.now() - new Date(rec.fecha).getTime());
  const h = Math.ceil(ms / 3600000);
  return h <= 1 ? "Se borra en menos de 1 h" : `Se borra en ${h} h`;
}

/* ---------- Fotos: reducir, compartir/descargar ---------- */
async function docsShrink(file, maxSide = 2400, quality = 0.88) {
  let url = null;
  try {
    url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", quality));
    return blob || file;
  } catch (e) {
    return file;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

// Abre el menú de compartir del teléfono ("Guardar imagen" → Fotos, o "Guardar en Archivos"). Si no se puede, descarga.
async function docsShareFiles(files, title) {
  if (!files.length) return;
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files, title }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  files.forEach(f => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}
function docsFile(blob, base, tag) {
  const ext = blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `${base}_${tag}.${ext}`, { type: blob.type || "image/jpeg" });
}
const docsBase = (nombre) => ((nombre || "registro").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w-]+/g, "_").slice(0, 40)) || "registro";

async function docsShare(rec) {
  const base = docsBase(rec.nombre);
  const files = [];
  const frente = rec.usuarioFrente || rec.usuario;   // "usuario" = registros de versiones anteriores
  if (frente) files.push(docsFile(frente, base, "documento_frente"));
  if (rec.usuarioReverso) files.push(docsFile(rec.usuarioReverso, base, "documento_atras"));
  if (rec.ticket) files.push(docsFile(rec.ticket, base, "ticket"));
  if (rec.firma) files.push(docsFile(rec.firma, base, "firma"));
  if (rec.firmaAsesor) files.push(docsFile(rec.firmaAsesor, base, "firma_asesor"));
  await docsShareFiles(files, base);
}

/* ---------- Datos: copiar y descargar ---------- */
const DOCS_CAMPOS = [
  ["nombre", "Nombre"], ["paterno", "Apellido paterno"], ["materno", "Apellido materno"],
  ["telefono", "Teléfono"], ["email", "Correo"], ["serie", "# Serie"],
];
// Trade In: todos los datos que lleva el contrato completo
const DOCS_CAMPOS_TI = [
  ["nombre", "Nombre"], ["paterno", "Apellido paterno"], ["materno", "Apellido materno"],
  ["telefono", "Teléfono"], ["email", "Correo"], ["estado", "Estado"],
  ["rfc", "RFC"], ["calle", "Calle"], ["cp", "Código postal"], ["numExt", "No. exterior"], ["numInt", "No. interior"],
  ["colonia", "Colonia"], ["localidad", "Localidad"], ["referencia", "Referencia"], ["municipio", "Municipio/Alcaldía"],
  ["modelo", "Modelo (entrega)"], ["capacidad", "Capacidad (entrega)"], ["serie", "# Serie (entrega)"], ["imei", "IMEI (entrega)"], ["costo", "Costo"],
  ["modeloN", "Modelo (nuevo)"], ["capacidadN", "Capacidad (nueva)"], ["serieN", "No. Serie (nuevo)"], ["imeiN", "IMEI (nuevo)"],
  ["idTipo", "Identificación"],
];
const DOCS_CAMPOS_TC = [
  ["nombre", "Nombre"], ["paterno", "Apellido paterno"], ["materno", "Apellido materno"],
  ["telefono", "Teléfono"], ["email", "Correo"], ["serie", "# Serie"], ["fechaCompra", "Fecha de compra"],
];
const docsCampos = (prog) => prog === "Trade In" ? DOCS_CAMPOS_TI : prog === DOCS_TC ? DOCS_CAMPOS_TC : DOCS_CAMPOS;
const docsNb = (t) => String(t == null ? "" : t).replace(/\u00a0/g, " ");
// "2500" -> "$2,500.00"
function docsMoney(v) {
  const n = parseFloat(String(v || "").replace(/[^0-9.]/g, ""));
  if (!isFinite(n)) return "";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function docsDatosTexto(rec) {
  const d = rec.datos || {};
  const fecha = new Date(rec.fecha).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
  const lines = [`Registro iShop · ${fecha}`, `Sucursal: ${d.sucursal || DOCS_SUCURSAL}`];
  if (rec.programa) lines.push(`Programa: ${rec.programa}`);
  if (rec.empleado) lines.push(`Registrado por: ${rec.empleado}`);
  lines.push("");
  docsCampos(rec.programa).forEach(([k, label]) => { if (d[k]) lines.push(`${label}: ${d[k]}`); });
  return lines.join("\n") + "\n";
}
async function docsShareDatos(rec) {
  const f = new File([docsDatosTexto(rec)], `${docsBase(rec.nombre)}_datos.txt`, { type: "text/plain" });
  await docsShareFiles([f], docsBase(rec.nombre));
}
async function docsCopy(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; }
  catch (e) {
    const t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { ok = document.execCommand("copy"); } catch (e2) {}
    t.remove();
  }
  const old = btn.textContent;
  btn.textContent = ok ? "✓ Copiado" : "No se pudo";
  btn.classList.toggle("done", ok);
  setTimeout(() => { btn.textContent = old; btn.classList.remove("done"); }, 1400);
}


/* ---------- Contrato en PDF (For Life) ---------- */
// Plantilla en blanco: contrato/for_life.pdf  ·  Librería: libs/pdf-lib.min.js
const DOCS_PDF_TEMPLATES = {
  "For Life": "contrato/for_life.pdf",
  "Get": "contrato/get.pdf",
  "Switch Up": "contrato/switch_up.pdf",
  "Trade In": "contrato/trade_in.pdf",
  "Cancelación For Life": "contrato/cancelacion.pdf",
  "Trade In Cancelación": "contrato/trade_in_cancelacion.pdf",
};
let docsPdfLibP = null;
function docsLoadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (docsPdfLibP) return docsPdfLibP;
  docsPdfLibP = new Promise((ok, bad) => {
    const s = document.createElement("script");
    s.src = "libs/pdf-lib.min.js";
    s.onload = () => ok(window.PDFLib);
    s.onerror = () => { docsPdfLibP = null; bad(new Error("no carga pdf-lib")); };
    document.head.appendChild(s);
  });
  return docsPdfLibP;
}
const docsDmy = (dt) => `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
function docsPlusMonths(dt, m) {
  const d = new Date(dt.getFullYear(), dt.getMonth() + m, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dt.getDate(), last));
  return d;
}
// Recorta la firma al área con tinta para que se vea grande en el contrato.
async function docsCropInk(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const im = new Image();
    await new Promise((ok, bad) => { im.onload = ok; im.onerror = bad; im.src = url; });
    const c = document.createElement("canvas");
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0);
    const px = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
      const i = (y * c.width + xx) * 4;
      if (px[i] < 200 || px[i + 1] < 200 || px[i + 2] < 200) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    const pad = 6;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
    const o = document.createElement("canvas");
    o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    const out = await new Promise(r => o.toBlob(r, "image/png"));
    return new Uint8Array(await out.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}

const DOCS_MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const docsFechaLarga = (dt, cap) => { const m = DOCS_MESES[dt.getMonth()]; return `${dt.getDate()} de ${cap ? m[0].toUpperCase() + m.slice(1) : m} de ${dt.getFullYear()}`; };

async function docsMakePdf(rec) {
  const PDFLib = await docsLoadPdfLib();
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const tplUrl = DOCS_PDF_TEMPLATES[rec.programa];
  if (!tplUrl) throw new Error("no hay plantilla");
  const resp = await fetch(tplUrl);
  if (!resp.ok) throw new Error("no hay plantilla");
  const pdf = await PDFDocument.load(await resp.arrayBuffer());
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const black = rgb(0, 0, 0);
  const d = rec.datos || {};
  const inicio = new Date(rec.fecha);
  const nombreCompleto = [d.nombre, d.paterno, d.materno].filter(Boolean).join(" ");
  const sucursal = d.sucursal || DOCS_SUCURSAL;
  const empleado = rec.empleado || "";
  const Hof = (page) => page.getHeight();   // las coordenadas de abajo se miden desde arriba de la hoja

  const safe = (t, f) => Array.from(String(t || "").normalize("NFC")).map(ch => { try { f.encodeText(ch); return ch; } catch (e) { return "?"; } }).join("");
  const fit = (t, f, size, maxW) => { let s = size; while (s > 4.5 && f.widthOfTextAtSize(t, s) > maxW) s -= 0.25; return s; };
  // texto alineado a la izquierda, al centro o a la derecha; "top" es la línea base medida desde arriba
  const put = (page, text, x, top, f, size, maxW, align, col) => {
    const t = safe(text, f); if (!t) return;
    const sz = fit(t, f, size, maxW || 9999);
    const w = f.widthOfTextAtSize(t, sz);
    const px = align === "c" ? x - w / 2 : align === "r" ? x - w : x;
    page.drawText(t, { x: px, y: Hof(page) - top, size: sz, font: f, color: col || black });
    return { px, w, sz };
  };
  const sigCache = {};
  const sign = async (page, cx, top, boxW, boxH, which) => {
    const sk = which || "firma";
    const blob = rec[sk];
    if (!blob) return;
    if (!sigCache[sk]) sigCache[sk] = await docsCropInk(blob);
    const sigBytes = sigCache[sk];
    if (!sigBytes) return;
    const img = await pdf.embedPng(sigBytes);
    const sc = Math.min(boxW / img.width, boxH / img.height);
    const w = img.width * sc, h = img.height * sc;
    page.drawImage(img, { x: cx - w / 2, y: Hof(page) - (top + boxH / 2) - h / 2, width: w, height: h });
  };

  const prog = rec.programa;
  if (prog === "For Life") {
    const p1 = pages[0], pl = pages[pages.length - 1];
    put(p1, d.paterno, 55.9, 118.7, font, 7, 155);
    put(p1, d.materno, 223.7, 118.7, font, 7, 145);
    put(p1, d.nombre, 379.9, 118.7, font, 7, 170);
    put(p1, d.telefono, 55.9, 149.5, font, 7, 220);
    put(p1, d.email, 292.2, 149.5, font, 7, 250);
    put(p1, docsDmy(inicio), 223.7, 294.6, bold, 7, 140);
    put(p1, docsDmy(docsPlusMonths(inicio, 24)), 379.9, 294.6, bold, 7, 140);
    put(pl, nombreCompleto, 164.2, 695.9, font, 9.5, 185, "c");
    put(pl, docsDmy(inicio), 336.9, 695.9, font, 9.5, 90, "c");
    put(pl, sucursal, 467.2, 695.9, font, 9.5, 100, "c");
    await sign(pl, 164.2, 598, 160, 86);

  } else if (prog === "Get") {
    const p1 = pages[0], pl = pages[pages.length - 1];
    put(p1, d.paterno, 55.9, 140.6, font, 7, 155);
    put(p1, d.materno, 223.7, 140.6, font, 7, 145);
    put(p1, d.nombre, 379.9, 140.6, font, 7, 170);
    put(p1, d.telefono, 55.9, 171.3, font, 7, 220);
    put(p1, d.email, 292.2, 171.3, font, 7, 250);
    put(p1, docsDmy(inicio), 223.7, 316.5, bold, 7, 140);
    put(p1, docsDmy(docsPlusMonths(inicio, 20)), 379.9, 316.5, bold, 7, 140);
    put(pl, nombreCompleto, 155, 741.3, font, 9.5, 185, "c");
    put(pl, docsDmy(inicio), 328, 741.3, font, 9.5, 90, "c");
    put(pl, sucursal, 458, 741.3, font, 9.5, 100, "c");
    await sign(pl, 155, 640, 150, 80);

  } else if (prog === "Switch Up") {
    const [p1, p2, , p4] = pages;
    put(p1, d.paterno, 55.9, 118.9, font, 7, 155);
    put(p1, d.materno, 223.7, 118.9, font, 7, 145);
    put(p1, d.nombre, 379.9, 118.9, font, 7, 170);
    put(p1, d.telefono, 55.9, 149.6, font, 7, 220);
    put(p1, d.email, 292.2, 149.6, font, 7, 250);
    put(p1, docsDmy(inicio), 223.7, 294.8, bold, 7, 140);
    put(p1, docsDmy(docsPlusMonths(inicio, 24)), 379.9, 294.8, bold, 7, 140);
    const vig = `Del ${docsFechaLarga(inicio, true)} al ${docsFechaLarga(docsPlusMonths(inicio, 13), true)}`;
    put(p2, vig, 55.9, 296.4, font, 7.5, 260);
    put(p2, nombreCompleto, 393, 403.2, font, 9, 185, "c");
    await sign(p2, 393, 300, 130, 80);
    put(p4, vig, 60.2, 398.5, font, 7.5, 260);
    put(p4, empleado, 142.5, 604.2, font, 9, 120, "c");
    put(p4, nombreCompleto, 414, 598.5, font, 9, 185, "c");
    await sign(p4, 412, 488, 140, 84);

  } else if (prog === "Cancelación For Life") {
    const p = pages[0];
    const ahora = new Date();   // momento exacto en que se genera el contrato
    const hora = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
    const txt = `En mi carácter de tarjetahabiente de Citibanamex y en razón de que a través del programa iPhone For Life adquirí el iPhone con número de serie ${d.serie || "______________"}, haciendo uso del derecho de upgrade que el programa me confiere y que el citado teléfono cumple con todos los requisitos de elegibilidad, “bajo protesta de decir verdad” y siendo las ${hora} horas del día ${docsFechaLarga(ahora)}, hago devolución del citado equipo a Promotora Musical, S.A de C.V (APR), quien a partir de este momento recibe la propiedad y la posesión física y jurídica del citado iPhone, mismo que se entrega sin información del tarjetahabiente.`;
    const words = safe(txt, font).split(/\s+/);
    const SZ = 11, MAXW = 440, LH = 15.9;
    let line = "", y = 308.5;
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(t, SZ) > MAXW && line) { put(p, line, 75.3, y, font, SZ); y += LH; line = w; } else line = t;
    }
    if (line) put(p, line, 75.3, y, font, SZ);
    put(p, nombreCompleto, 286, 578.8, font, 11.5, 250, "c");
    await sign(p, 286, 485, 160, 80);

  } else if (prog === DOCS_TC) {
    // Hoja única: Nombre, Teléfono, e-Mail, No. de Serie, Fecha de compra (en azul, centrados) + firma sobre la línea
    const p = pages[0], azul = rgb(0.22, 0.43, 0.72), cx = 183 + 373 / 2;
    const fila = i => 364 + 29 * i + 16.4;
    put(p, nombreCompleto.toUpperCase(), cx, fila(0), font, 10, 360, "c", azul);
    put(p, d.telefono, cx, fila(1), font, 10, 360, "c", azul);
    const em = put(p, d.email, cx, fila(2), font, 10, 360, "c", azul);
    if (em) p.drawLine({ start: { x: em.px, y: Hof(p) - fila(2) - 1.6 }, end: { x: em.px + em.w, y: Hof(p) - fila(2) - 1.6 }, thickness: 0.6, color: azul });
    put(p, (d.serie || "").toUpperCase(), cx, fila(3), font, 10, 360, "c", azul);
    put(p, d.fechaCompra, cx, fila(4), font, 10, 360, "c", azul);
    await sign(p, 306, 516, 200, 56);

  } else if (prog === "Trade In") {
    const [p1, p2, p3, p4, p5] = pages;
    const costo = docsMoney(d.costo);
    const white = rgb(1, 1, 1);
    // texto en varias líneas dentro de un ancho
    const wrapLines = (t, f, size, maxW) => {
      const out = []; let line = "";
      safe(t, f).split(/\s+/).forEach(w => {
        const c = line ? line + " " + w : w;
        if (f.widthOfTextAtSize(c, size) > maxW && line) { out.push(line); line = w; } else line = c;
      });
      if (line) out.push(line);
      return out;
    };
    const calleNum = [d.calle, d.numExt ? "No. " + d.numExt : "", d.numInt ? "Int. " + d.numInt : ""].filter(Boolean).join(" ");
    const domicilio = [calleNum, d.colonia ? "Col. " + d.colonia : "", d.localidad, d.municipio, d.estado, d.cp ? "C.P. " + d.cp : "", (calleNum || d.colonia) ? "México" : ""].filter(Boolean).join(", ");
    const idTxt = d.idTipo === "Pasaporte" ? "PASAPORTE" : "INE";

    // --- Página 1: cliente y equipo entregado
    put(p1, `México a ${docsFechaLarga(inicio)}`, 558.3, 122, font, 8.5, 200, "r");
    put(p1, nombreCompleto, 235, 270.1, font, 8.5, 320);
    put(p1, idTxt, 235, 287.1, font, 8.5, 320);
    wrapLines(domicilio, font, 7.5, 320).slice(0, 2).forEach((ln, i) => put(p1, ln, 235, 302 + i * 9.3, font, 7.5, 322));
    put(p1, d.rfc, 235, 329.6, font, 8.5, 320);
    put(p1, d.email, 235, 346.6, font, 8.5, 320);
    put(p1, d.telefono, 235, 363.6, font, 8.5, 320);
    put(p1, d.modelo, 191.5, 411.3, font, 8.5, 360);
    put(p1, d.capacidad, 191.5, 438.9, font, 8.5, 360);
    put(p1, d.serie, 191.5, 466.4, bold, 8.5, 360);
    put(p1, d.imei, 191.5, 493.9, bold, 8.5, 360);

    // --- Página 2: RFC, firmas y monto
    put(p2, d.rfc, 53, 584.3, font, 8.5, 500);
    put(p2, nombreCompleto, 162, 700.4, font, 8.5, 190, "c");
    put(p2, empleado, 445.7, 700.4, font, 8.5, 120, "c");
    await sign(p2, 162, 622, 130, 66);
    await sign(p2, 445.7, 622, 130, 66, "firmaAsesor");

    // --- Página 3: equipo del comitente
    put(p3, `${nombreCompleto}, en mi carácter de legítimo propietario del Equipo que aquí se detalla (en lo sucesivo el “Comitente”),`, 53, 38, font, 8.5, 495);
    put(p3, d.modelo, 191.5, 107.6, font, 8.5, 360);
    put(p3, d.capacidad, 191.5, 135.1, font, 8.5, 360);
    put(p3, d.serie, 191.5, 162.6, bold, 8.5, 360);
    put(p3, d.imei, 191.5, 190.1, bold, 8.5, 360);

    // --- Página 4: correo y equipo nuevo
    put(p4, d.email, 103.9, 216.1, font, 8.5, 440);
    put(p4, d.modeloN, 191.5, 702.9, font, 8.5, 360);
    put(p4, d.capacidadN, 191.5, 730.4, font, 8.5, 360);
    put(p4, d.serieN, 191.5, 757.9, bold, 8.5, 360);

    // --- Página 5: IMEI nuevo, cliente, domicilio fiscal y firmas
    put(p5, d.imeiN, 191.5, 45.2, bold, 8.5, 360);
    put(p5, nombreCompleto, 53, 328.3, bold, 8.5, 500);
    put(p5, d.rfc, 53, 362.4, font, 8.5, 500);
    put(p5, d.calle, 193.1, 396.4, font, 8.5, 152);
    put(p5, d.numExt, 438.1, 396.4, font, 8.5, 120);
    put(p5, d.numInt, 193.1, 413.4, font, 8.5, 152);
    put(p5, d.colonia, 438.1, 413.4, font, 8.5, 120);
    put(p5, d.localidad, 193.1, 430.4, font, 8.5, 152);
    put(p5, d.referencia, 438.1, 430.4, font, 8.5, 120);
    put(p5, d.municipio, 193.1, 447.4, font, 8.5, 152);
    put(p5, d.estado, 438.1, 447.4, font, 8.5, 120);
    put(p5, "México", 193.1, 464.4, font, 8.5, 152);
    put(p5, d.cp, 438.1, 464.4, font, 8.5, 120);
    put(p5, d.email, 193.1, 481.3, font, 8.5, 360);
    put(p5, nombreCompleto, 162, 524.4, font, 8.5, 190, "c");
    await sign(p5, 162, 532, 140, 86);
    await sign(p5, 445.7, 534, 140, 82, "firmaAsesor");

    // --- Monto: el contrato trae "$11,000.00" impreso; se tapa y se escribe el costo capturado
    [[p2, 195.81, 235.91, 397.51, 406.51], [p4, 296.46, 336.56, 120.24, 129.24], [p4, 78.45, 118.55, 520.56, 529.56]].forEach(([pg, x0, x1, top, bot]) => {
      const H = pg.getHeight();
      pg.drawRectangle({ x: x0 - 0.8, y: H - bot - 2.2, width: (x1 - x0) + 1.6, height: (bot - top) + 3.4, color: white });
      const t = safe(costo, bold); if (!t) return;
      const sz = fit(t, bold, 9, x1 - x0);
      const w = bold.widthOfTextAtSize(t, sz);
      pg.drawText(t, { x: x0, y: H - bot + 2.2, size: sz, font: bold, color: black });
      pg.drawLine({ start: { x: x0, y: H - bot + 0.6 }, end: { x: x0 + w, y: H - bot + 0.6 }, thickness: 0.6, color: black });
    });
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}
async function docsShareContrato(rec, btn) {
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = "Generando…";
  try {
    const blob = await docsMakePdf(rec);
    const f = new File([blob], `${docsBase(rec.nombre)}_${(rec.programa || "contrato").replace(/\s+/g, "")}.pdf`, { type: "application/pdf" });
    await docsShareFiles([f], docsBase(rec.nombre));
  } catch (e) {
    alert("No se pudo generar el PDF. Revisa que existan libs/pdf-lib.min.js y la carpeta contrato/ con los PDF en tu proyecto.");
  }
  btn.disabled = false; btn.textContent = old;
}

/* ---------- Gesto secreto: mantener presionado "Código cajas" ---------- */
let docsClickGuard = false;
document.addEventListener("pointerdown", () => { docsClickGuard = false; }, true);
document.addEventListener("pointerup", () => { setTimeout(() => { docsClickGuard = false; }, 500); }, true);
document.addEventListener("click", (e) => {
  if (docsClickGuard) { e.stopPropagation(); e.preventDefault(); }
}, true);

/* ---------- Piezas comunes de pantalla ---------- */
function docsHeaderHtml() {
  return `<div class="docs-banner-box"><img class="docs-banner" alt=""></div><h2 class="docs-title"></h2>`;
}
function docsInitHeader(wrap) {
  wrap.querySelector(".docs-title").textContent = DOCS_TITULO;
  const ban = wrap.querySelector(".docs-banner");
  let bi = 0;
  ban.onerror = () => { bi++; if (bi < DOCS_BANNERS.length) ban.src = DOCS_BANNERS[bi]; else wrap.querySelector(".docs-banner-box").hidden = true; };
  ban.src = DOCS_BANNERS[0];
}
function docsBindText(wrap, id, key, opts = {}) {
  const el = wrap.querySelector("#" + id);
  el.value = docsDraft[key] || "";
  el.addEventListener("input", () => {
    docsDraft[key] = opts.upper ? el.value.toUpperCase() : el.value;
    if (opts.upper && el.value !== docsDraft[key]) el.value = docsDraft[key];
    if (opts.onInput) opts.onInput();
  });
  return el;
}

/* ---------- Pantalla 1: datos del cliente + firma ---------- */
const DOCS_ESTADOS = ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"];
const DOCS_TRASH_SVG = `<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const docsSignHtml = (cid, label, tid) => `
  <div class="docs-sign">
    <div class="docs-sign-head"><span>${label}</span>
      <button type="button" class="docs-trash" id="${tid}" aria-label="Borrar firma">${DOCS_TRASH_SVG}</button></div>
    <canvas id="${cid}"></canvas>
  </div>`;

// Lienzo de firma; guarda el PNG en docsDraft[key]
function docsSignPad(wrap, cid, tid, key) {
  const cv = wrap.querySelector("#" + cid);
  const ctx = cv.getContext("2d");
  let drawing = false, last = null;
  function sizeCanvas() {
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    cv.width = Math.round(w * r); cv.height = Math.round(h * r);
    ctx.setTransform(r, 0, 0, r, 0, 0);
    ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111";
    if (docsDraft[key]) {
      const im = new Image();
      im.onload = () => ctx.drawImage(im, 0, 0, w, h);
      im.src = docsDraft[key];
    }
  }
  requestAnimationFrame(sizeCanvas);
  const pos = (e) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  cv.addEventListener("pointerdown", (e) => {
    drawing = true; last = pos(e);
    cv.setPointerCapture(e.pointerId);
    ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, Math.PI * 2); ctx.fillStyle = "#111"; ctx.fill();
    e.preventDefault();
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; e.preventDefault();
  });
  const end = () => { if (!drawing) return; drawing = false; docsDraft[key] = cv.toDataURL("image/png"); };
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);
  wrap.querySelector("#" + tid).addEventListener("click", () => {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore();
    docsDraft[key] = "";
  });
}

// Modelo + capacidad enlazados. "Otro…" permite escribir a mano si el modelo no está en la lista.
function docsModelosEntrega() {
  return Object.keys(TRADEIN_DATA || {}).map(cat => ({ grupo: cat, items: Object.keys(TRADEIN_DATA[cat] || {}) }));
}
function docsCapsEntrega(model) {
  const D = TRADEIN_DATA || {};
  for (const cat of Object.keys(D)) { if (D[cat] && D[cat][model]) return Object.keys(D[cat][model]); }
  return [];
}
const docsModelosNuevo = () => [{ grupo: "iPhone", items: Object.keys(PRECIOS_IPHONE || {}) }];
const docsCapsNuevo = (model) => Object.keys((PRECIOS_IPHONE || {})[model] || {});

function docsBindModelo(wrap, ids, keyM, keyC, listModelos, listCaps) {
  const sm = wrap.querySelector("#" + ids.m), sc = wrap.querySelector("#" + ids.c);
  const tm = wrap.querySelector("#" + ids.m + "X"), tc = wrap.querySelector("#" + ids.c + "X");
  const d = docsDraft;
  const opt = (v, t) => { const o = document.createElement("option"); o.value = v; o.textContent = t; return o; };
  const OTRO = "__otro";

  sm.innerHTML = "";
  sm.appendChild(opt("", "Seleccione"));
  listModelos().forEach(g => {
    if (!g.items.length) return;
    const og = document.createElement("optgroup"); og.label = g.grupo;
    g.items.forEach(m => og.appendChild(opt(m, docsNb(m))));
    sm.appendChild(og);
  });
  sm.appendChild(opt(OTRO, "Otro…"));

  function fillCaps(model) {
    sc.innerHTML = "";
    sc.appendChild(opt("", "Seleccione"));
    listCaps(model).forEach(c => sc.appendChild(opt(c, docsNb(c))));
    sc.appendChild(opt(OTRO, "Otro…"));
  }
  function show(el, on) { el.hidden = !on; }

  // restaurar al volver a esta pantalla
  const cur = d[keyM], curC = d[keyC];
  const hit = Array.from(sm.options).find(o => o.value && o.value !== OTRO && docsNb(o.value) === cur);
  if (hit) { sm.value = hit.value; fillCaps(hit.value); }
  else if (cur) { sm.value = OTRO; tm.value = cur; fillCaps(""); }
  else fillCaps("");
  show(tm, sm.value === OTRO);
  const hitC = Array.from(sc.options).find(o => o.value && o.value !== OTRO && docsNb(o.value) === curC);
  if (hitC) sc.value = hitC.value;
  else if (curC) { sc.value = OTRO; tc.value = curC; }
  show(tc, sc.value === OTRO);

  sm.addEventListener("change", () => {
    const v = sm.value;
    if (v === OTRO) { show(tm, true); d[keyM] = tm.value; fillCaps(""); sc.value = OTRO; show(tc, true); d[keyC] = tc.value; return; }
    show(tm, false); d[keyM] = docsNb(v);
    fillCaps(v); d[keyC] = ""; show(tc, false);
  });
  sc.addEventListener("change", () => {
    if (sc.value === OTRO) { show(tc, true); d[keyC] = tc.value; }
    else { show(tc, false); d[keyC] = docsNb(sc.value); }
  });
  tm.addEventListener("input", () => { d[keyM] = tm.value; });
  tc.addEventListener("input", () => { d[keyC] = tc.value; });
}

function docsTiHtml() {
  const fld = (id, label, attrs = "", cls = "") => `<div class="docs-field ${cls}"><label for="${id}">${label} :</label>
        <input id="${id}" class="docs-input" type="text" autocomplete="off" ${attrs}></div>`;
  const modelo = (id, idc, label, labelC) => `
      <div class="docs-row2">
        <div class="docs-field"><label for="${id}">${label} :</label>
          <select id="${id}" class="docs-input docs-select"></select>
          <input id="${id}X" class="docs-input docs-otro" type="text" autocomplete="off" placeholder="Escribe el modelo" hidden></div>
        <div class="docs-field"><label for="${idc}">${labelC} :</label>
          <select id="${idc}" class="docs-input docs-select"></select>
          <input id="${idc}X" class="docs-input docs-otro" type="text" autocomplete="off" placeholder="Escribe la capacidad" hidden></div>
      </div>`;
  const UP = 'autocapitalize="characters" autocorrect="off" spellcheck="false"';
  return `
      <h3>Datos del cliente</h3>
      <div class="docs-sec"><span>Consentimientos</span></div>
      <label class="docs-check"><input type="checkbox" id="dTyC"><span>He leído y Acepto los términos y condiciones del programa Trade In (Contrato unificado)</span></label>
      <label class="docs-check"><input type="checkbox" id="dAviso"><span>He leído y Acepto el <a href="https://www.ishopmixup.com/aviso-de-privacidad" target="_blank" rel="noopener">Aviso de Privacidad</a>, consiento y autorizo expresamente que los datos personales que proporcione sean tratados conforme a los términos y condiciones del mismo.</span></label>
      <div class="docs-field"><label for="dEmail">Email :</label>
        <input id="dEmail" class="docs-input" type="email" inputmode="email" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"></div>
      ${fld("dNombre", "Nombre", 'autocapitalize="characters"')}
      <div class="docs-row2">
        ${fld("dPaterno", "Apellido Paterno", 'autocapitalize="characters"')}
        ${fld("dMaterno", "Apellido Materno", 'autocapitalize="characters"')}
      </div>
      <div class="docs-field"><label for="dTel">Teléfono :</label>
        <input id="dTel" class="docs-input" type="tel" inputmode="tel" autocomplete="off"></div>
      <div class="docs-field docs-half"><label for="dEstado">Estado :</label>
        <select id="dEstado" class="docs-input docs-select"><option value="">Seleccione</option>${DOCS_ESTADOS.map(e => `<option>${e}</option>`).join("")}</select></div>
      ${fld("dAsesor", "Asesor", 'autocapitalize="characters"')}

      <div class="docs-sec"><span>🏠 Domicilio fiscal</span></div>
      ${fld("dRfc", "RFC", UP)}
      <div class="docs-row2">
        ${fld("dCalle", "Calle", 'autocapitalize="characters"')}
        <div class="docs-field"><label for="dCp">Código postal :</label>
          <input id="dCp" class="docs-input" type="text" inputmode="numeric" maxlength="5" autocomplete="off"></div>
      </div>
      <div class="docs-row2">
        ${fld("dExt", "No. Exterior", 'autocapitalize="characters"')}
        ${fld("dInt", "No. Interior", 'autocapitalize="characters"')}
      </div>
      ${fld("dColonia", "Colonia", 'autocapitalize="characters"')}
      ${fld("dLocalidad", "Localidad", 'autocapitalize="characters"')}
      ${fld("dReferencia", "Referencia", 'autocapitalize="characters"')}
      ${fld("dMunicipio", "Municipio/Alcaldía", 'autocapitalize="characters"')}

      <div class="docs-sec"><span>Datos del equipo a entregar</span></div>
      <p class="docs-help">Equipo usado que el cliente <b>entrega</b> en cesión de derechos.</p>
      ${modelo("dModelo", "dCap", "Modelo", "Capacidad")}
      <div class="docs-row2">
        ${fld("dSerie", "# Serie", UP)}
        ${fld("dImei", "IMEI", UP + ' inputmode="numeric"')}
      </div>
      <div class="docs-field docs-half"><label for="dCosto">Costo :</label>
        <input id="dCosto" class="docs-input" type="text" inputmode="decimal" autocomplete="off" placeholder="$0.00"></div>

      <div class="docs-sec"><span>Datos del equipo nuevo</span></div>
      <p class="docs-help">Equipo nuevo que el cliente <b>adquiere y se lleva</b>. Opcional: el equipo a entregar no es un iPhone.</p>
      ${modelo("dModeloN", "dCapN", "Modelo (nuevo)", "Capacidad (nueva)")}
      <div class="docs-row2">
        ${fld("dSerieN", "No. Serie (nuevo)", UP)}
        ${fld("dImeiN", "IMEI (nuevo)", UP + ' inputmode="numeric"')}
      </div>

      <div class="docs-sec"><span>Identificación oficial</span></div>
      <div class="docs-field"><label>Tipo de identificación :</label>
        <div class="docs-seg" id="dIdSeg" data-side="frente">
          <span class="docs-seg-knob"></span>
          <button type="button" data-side="frente">INE</button>
          <button type="button" data-side="reverso">Pasaporte</button>
        </div></div>
      <div class="docs-row2 docs-info">
        <div><div class="docs-lbl">Fecha :</div><div class="docs-val" id="dFecha"></div></div>
        <div><div class="docs-lbl">Sucursal de iShop :</div><div class="docs-val" id="dSuc"></div></div>
      </div>
      ${docsSignHtml("dSign", "Captura tu firma (Cliente)", "dClear")}
      ${docsSignHtml("dSignA", "Captura tu firma (Asesor)", "dClearA")}`;
}

function docsBaseHtml(tc) {
  return `
      <h3>Datos del cliente</h3>
      <div class="docs-field"><label for="dEmail">Email :</label>
        <input id="dEmail" class="docs-input" type="email" inputmode="email" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"></div>
      <div class="docs-field"><label for="dNombre">Nombre :</label>
        <input id="dNombre" class="docs-input" type="text" autocomplete="off" autocapitalize="characters"></div>
      <div class="docs-row2">
        <div class="docs-field"><label for="dPaterno">Apellido Paterno :</label>
          <input id="dPaterno" class="docs-input" type="text" autocomplete="off" autocapitalize="characters"></div>
        <div class="docs-field"><label for="dMaterno">Apellido Materno :</label>
          <input id="dMaterno" class="docs-input" type="text" autocomplete="off" autocapitalize="characters"></div>
      </div>
      <div class="docs-field"><label for="dTel">Teléfono :</label>
        <input id="dTel" class="docs-input" type="tel" inputmode="tel" autocomplete="off"></div>
      <div class="docs-field docs-half"><label for="dSerie"># Serie :</label>
        <input id="dSerie" class="docs-input" type="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false"></div>
      ${tc ? `<div class="docs-field docs-half"><label for="dCompra">Fecha de compra :</label>
        <input id="dCompra" class="docs-input" type="date"></div>` : ""}
      <div class="docs-row2 docs-info">
        <div><div class="docs-lbl">Fecha :</div><div class="docs-val" id="dFecha"></div></div>
        <div><div class="docs-lbl">Sucursal de iShop :</div><div class="docs-val" id="dSuc"></div></div>
      </div>
      ${docsSignHtml("dSign", "Captura tu firma (Cliente)", "dClear")}`;
}

/* Por ahora Registros es solo para tomar las fotos: los campos de datos están bloqueados.
   Para volver a abrirlos, cambia esto a false. */
const REGISTROS_SOLO_FOTOS = true;

function buildDocs() {
  const ti = docsDraft.programa === "Trade In";
  const tc = docsDraft.programa === DOCS_TC;
  const bloqueado = REGISTROS_SOLO_FOTOS && !tc;   // el formato de cancelación sí lleva captura de datos
  const wrap = document.createElement("div");
  wrap.className = "docs-page";
  wrap.innerHTML = `
    ${docsHeaderHtml()}
    <div class="docs-card">${ti ? docsTiHtml() : docsBaseHtml(tc)}</div>
    <button type="button" class="docs-accept" id="dNext"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Aceptar</span></button>
    <p class="docs-msg" id="dMsg" role="status"></p>
    <button type="button" class="docs-link" id="dSkip">Omitir datos · solo fotos</button>
    <button type="button" class="docs-link" id="dVer">Ver registros</button>
  `;
  docsInitHeader(wrap);
  const $ = (s) => wrap.querySelector(s);
  const d = docsDraft;
  docsBindText(wrap, "dEmail", "email");
  docsBindText(wrap, "dNombre", "nombre", { upper: true });
  docsBindText(wrap, "dPaterno", "paterno", { upper: true });
  docsBindText(wrap, "dMaterno", "materno", { upper: true });
  docsBindText(wrap, "dTel", "telefono");
  docsBindText(wrap, "dSerie", "serie", { upper: true });
  if (tc) docsBindText(wrap, "dCompra", "fechaCompra");
  $("#dFecha").textContent = docsFechaHoy();
  $("#dSuc").textContent = DOCS_SUCURSAL;
  docsSignPad(wrap, "dSign", "dClear", "firmaUrl");

  if (ti) {
    const nomAsesor = (ishopAjustes().nombre || "").trim().toUpperCase();
    if (nomAsesor) d.asesor = nomAsesor;
    else if (!d.asesor) d.asesor = "";
    [["dAsesor", "asesor", true], ["dRfc", "rfc", true], ["dCalle", "calle", true], ["dCp", "cp"], ["dExt", "numExt", true],
     ["dInt", "numInt", true], ["dColonia", "colonia", true], ["dLocalidad", "localidad", true], ["dReferencia", "referencia", true],
     ["dMunicipio", "municipio", true], ["dImei", "imei", true], ["dSerieN", "serieN", true], ["dImeiN", "imeiN", true]
    ].forEach(([id, key, upper]) => docsBindText(wrap, id, key, { upper: !!upper }));

    const asEl = $("#dAsesor");
    if (nomAsesor) { asEl.readOnly = true; asEl.classList.add("locked"); }

    // Costo: libre; al salir del campo se da formato de moneda
    const costo = docsBindText(wrap, "dCosto", "costo");
    costo.addEventListener("blur", () => { const m = docsMoney(costo.value); if (m) { costo.value = m; d.costo = m; } });

    // Estado
    const est = $("#dEstado"); est.value = d.estado || "";
    est.addEventListener("change", () => { d.estado = est.value; });

    // Consentimientos
    const tyc = $("#dTyC"), avi = $("#dAviso");
    tyc.checked = !!d.aceptaTyC; avi.checked = !!d.aceptaAviso;
    tyc.addEventListener("change", () => { d.aceptaTyC = tyc.checked; });
    avi.addEventListener("change", () => { d.aceptaAviso = avi.checked; });

    // Modelo / capacidad
    dataReady.then(() => {
      docsBindModelo(wrap, { m: "dModelo", c: "dCap" }, "modelo", "capacidad", docsModelosEntrega, docsCapsEntrega);
      docsBindModelo(wrap, { m: "dModeloN", c: "dCapN" }, "modeloN", "capacidadN", docsModelosNuevo, docsCapsNuevo);
    });

    // Tipo de identificación
    const seg = $("#dIdSeg");
    const setId = (v) => { d.idTipo = v; seg.dataset.side = v === "Pasaporte" ? "reverso" : "frente"; };
    setId(d.idTipo || "INE");
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-side]"); if (!b) return;
      setId(b.dataset.side === "reverso" ? "Pasaporte" : "INE");
    });

    docsSignPad(wrap, "dSignA", "dClearA", "firmaAsesorUrl");
  }

  if (bloqueado) {
    const card = wrap.querySelector(".docs-card");
    card.classList.add("docs-bloq");
    card.querySelectorAll("input, select, textarea, button").forEach(el => { el.disabled = true; });
    const sk = wrap.querySelector("#dSkip"); if (sk) sk.hidden = true;
    wrap.querySelector("#dNext span").textContent = "Continuar a fotos";
  }
  if (tc) { const sk = wrap.querySelector("#dSkip"); if (sk) sk.hidden = true; }
  const next = () => navigate({ screen: "docsFotos", title: "Documentos" });
  $("#dNext").addEventListener("click", () => {
    if (tc) {
      const f = [["nombre", "nombre"], ["telefono", "teléfono"], ["email", "correo"], ["serie", "# serie"], ["fechaCompra", "fecha de compra"]].filter(([k]) => !String(d[k] || "").trim()).map(x => x[1]);
      if (!d.firmaUrl) f.push("firma");
      if (f.length) { $("#dMsg").textContent = "Falta: " + f.join(", ") + "."; return; }
    }
    if (!bloqueado && ti && (!d.aceptaTyC || !d.aceptaAviso)) {
      $("#dMsg").textContent = "Marca los dos consentimientos para continuar.";
      $("#dTyC").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    next();
  });
  $("#dSkip").addEventListener("click", next);
  $("#dVer").addEventListener("click", () => navigate({ screen: "docsOk", title: "Registros", hero: false }));
  return wrap;
}

/* ---------- Pantalla 2: fotos ---------- */
function buildDocsFotos() {
  const wrap = document.createElement("div");
  wrap.className = "docs-page";
  wrap.innerHTML = `
    ${docsHeaderHtml()}
    <div class="docs-card">
      <h3>Carga de documentos</h3>
      <div class="docs-field"><label for="fNombre">Nombre :</label>
        <input id="fNombre" class="docs-input" type="text" autocomplete="off" autocapitalize="characters" placeholder="Nombre del cliente"></div>
      <div class="docs-field">
        <label>Documento</label>
        <div class="docs-seg" id="docsSeg" data-side="frente">
          <span class="docs-seg-knob"></span>
          <button type="button" data-side="frente">Frente</button>
          <button type="button" data-side="reverso">Atrás</button>
        </div>
        <div class="docs-slot" id="docsSlotDoc"></div>
      </div>
      <div class="docs-field">
        <label>Ticket de compra :</label>
        <div class="docs-slot" id="docsSlotTicket"></div>
      </div>
    </div>
    <button type="button" class="docs-accept" id="docsAccept"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Aceptar</span></button>
    <p class="docs-msg" id="docsMsg" role="status"></p>
  `;
  docsInitHeader(wrap);
  const $ = (s) => wrap.querySelector(s);
  const d = docsDraft;

  // Si el nombre ya se capturó en la primera pantalla, aquí queda bloqueado. Si no, se puede escribir.
  const nombreEl = docsBindText(wrap, "fNombre", "nombre", { upper: true, onInput: () => { d.nombreEnFotos = true; } });
  if (d.nombre.trim() && !d.nombreEnFotos) {
    nombreEl.readOnly = true;
    nombreEl.classList.add("locked");
    nombreEl.value = docsFullName(d);   // se muestra completo (nombre + apellidos si se capturaron)
  }

  const seg = $("#docsSeg");
  const acceptBtn = $("#docsAccept");
  const urls = {};
  let side = "frente";

  const refresh = () => {
    seg.querySelectorAll("button").forEach(b => b.classList.toggle("has", !!d[b.dataset.side]));
  };

  function renderSlot(container, key) {
    if (urls[key]) { URL.revokeObjectURL(urls[key]); urls[key] = null; }
    container.innerHTML = "";
    const row = document.createElement("div");
    row.className = "docs-file";
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*"; inp.hidden = true;
    const pick = document.createElement("button");
    pick.type = "button"; pick.className = "docs-pick"; pick.textContent = "Seleccionar archivos";
    pick.addEventListener("click", () => inp.click());
    const nm = document.createElement("span");
    nm.className = "docs-file-name";
    nm.textContent = d[key] ? (d.names[key] || "foto") : "Ningún archivo seleccionado";
    row.append(pick, nm, inp);
    container.appendChild(row);

    inp.addEventListener("change", async () => {
      const f = inp.files && inp.files[0];
      inp.value = "";
      if (!f) return;
      nm.textContent = "Procesando…";
      d[key] = await docsShrink(f);
      d.names[key] = f.name || "foto.jpg";
      renderSlot(container, key);
      refresh();
    });

    if (d[key]) {
      urls[key] = URL.createObjectURL(d[key]);
      const prev = document.createElement("div");
      prev.className = "docs-preview";
      const img = document.createElement("img");
      img.alt = "Vista previa"; img.src = urls[key];
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "docs-remove"; rm.textContent = "Quitar foto";
      rm.addEventListener("click", () => { d[key] = null; d.names[key] = ""; renderSlot(container, key); refresh(); });
      prev.append(img, rm);
      container.appendChild(prev);
    }
  }

  const docSlot = $("#docsSlotDoc");
  const renderDoc = () => renderSlot(docSlot, side);
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-side]");
    if (!b || b.dataset.side === side) return;
    side = b.dataset.side;
    seg.dataset.side = side;
    renderDoc();
  });

  acceptBtn.addEventListener("click", () => {
    if (!(d.frente || d.reverso || d.ticket || docsHayDatos(d))) {
      $("#docsMsg").textContent = "Agrega al menos una foto o algún dato.";
      return;
    }
    navigate({ screen: "docsConfirm", title: "Confirmar" });
  });

  renderDoc();
  renderSlot($("#docsSlotTicket"), "ticket");
  refresh();
  return wrap;
}

/* ---------- Pantalla 3: confirmar datos ---------- */
async function docsDataUrlToWhitePng(url) {
  const im = new Image();
  await new Promise((ok, bad) => { im.onload = ok; im.onerror = bad; im.src = url; });
  const c = document.createElement("canvas");
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(im, 0, 0);
  return new Promise(r => c.toBlob(r, "image/png"));
}

function buildDocsConfirm() {
  const d = docsDraft;
  const wrap = document.createElement("div");
  wrap.className = "docs-page";
  wrap.innerHTML = `
    <div class="docs-card docs-confirm">
      <h3>Confirma los datos</h3>
      <div id="cfRows"></div>
      <div class="docs-cf-thumbs" id="cfThumbs"></div>
      <div class="docs-warn" id="cfWarn" hidden></div>
    </div>
    <button type="button" class="docs-accept" id="cfOk"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Confirmar y guardar</span></button>
    <button type="button" class="docs-link" id="cfBack">Editar</button>
    <p class="docs-msg" id="cfMsg" role="status"></p>
  `;
  const rows = wrap.querySelector("#cfRows");
  const addRow = (label, value) => {
    const r = document.createElement("div");
    r.className = "docs-cf-row";
    const a = document.createElement("span"); a.textContent = label;
    const b = document.createElement("strong"); b.textContent = value;
    r.append(a, b); rows.appendChild(r);
  };
  const hayDatos = docsHayDatos(d);
  if (d.programa) addRow("Programa", d.programa);
  if (hayDatos) {
    docsCampos(d.programa).forEach(([k, label]) => { if (d[k]) addRow(label, k === "costo" ? (docsMoney(d[k]) || d[k]) : k === "fechaCompra" ? docsIsoLarga(d[k]) : d[k]); });
    if (d.programa === "Trade In") addRow("Asesor", d.asesor || ishopAjustes().nombre || "—");
    addRow("Fecha", docsFechaHoy());
    addRow("Sucursal", DOCS_SUCURSAL);
  } else {
    addRow("Registro", "Solo fotos");
    if (docsFullName(d)) addRow("Nombre", docsFullName(d));
  }

  const thumbs = wrap.querySelector("#cfThumbs");
  const tUrls = [];
  const addThumb = (label, src) => {
    const fig = document.createElement("figure");
    const im = document.createElement("img"); im.src = src; im.alt = label;
    const cap = document.createElement("figcaption"); cap.textContent = label;
    fig.append(im, cap); thumbs.appendChild(fig);
  };
  [["Frente", d.frente], ["Atrás", d.reverso], ["Ticket", d.ticket]].forEach(([l, b]) => {
    if (!b) return; const u = URL.createObjectURL(b); tUrls.push(u); addThumb(l, u);
  });
  if (d.firmaUrl) addThumb("Firma", d.firmaUrl);
  if (d.firmaAsesorUrl) addThumb("Firma asesor", d.firmaAsesorUrl);

  const faltan = [];
  if (d.programa !== DOCS_TC) {
    if (!d.frente) faltan.push("foto del frente");
    if (!d.reverso) faltan.push("foto de atrás");
    if (!d.ticket) faltan.push("ticket");
  }
  if (hayDatos && !d.firmaUrl) faltan.push("firma");
  if ((d.programa === "Trade In" || d.programa === "Switch Up") && !ishopAjustes().nombre && !(d.asesor || "").trim()) faltan.push("tu nombre de asesor (ponlo en Ajustes)");
  if (d.programa === "Trade In") {
    const req = [["email", "correo"], ["nombre", "nombre"], ["paterno", "apellido paterno"], ["telefono", "teléfono"], ["estado", "estado"],
      ["rfc", "RFC"], ["calle", "calle"], ["cp", "código postal"], ["numExt", "no. exterior"], ["colonia", "colonia"],
      ["localidad", "localidad"], ["municipio", "municipio/alcaldía"], ["modelo", "modelo a entregar"], ["capacidad", "capacidad a entregar"],
      ["serie", "# serie"], ["imei", "IMEI"], ["costo", "costo"]];
    req.forEach(([k, l]) => { if (!String(d[k] || "").trim()) faltan.push(l); });
    if (!d.firmaAsesorUrl) faltan.push("firma del asesor");
  }
  if (!d.programa) faltan.push("tipo de registro");
  if (faltan.length) {
    const w = wrap.querySelector("#cfWarn");
    w.hidden = false; w.textContent = "Falta: " + faltan.join(", ") + ".";
  }

  wrap.querySelector("#cfBack").addEventListener("click", goBack);
  const okBtn = wrap.querySelector("#cfOk");
  okBtn.addEventListener("click", async () => {
    okBtn.disabled = true;
    try {
      const firma = d.firmaUrl ? await docsDataUrlToWhitePng(d.firmaUrl) : null;
      const firmaAsesor = d.firmaAsesorUrl ? await docsDataUrlToWhitePng(d.firmaAsesorUrl) : null;
      const datosRec = {};
      docsCampos(d.programa).forEach(([k]) => { datosRec[k] = String(d[k] == null ? "" : d[k]).trim(); });
      if (d.programa === DOCS_TC) datosRec.fechaCompra = docsIsoLarga(datosRec.fechaCompra);
      if (d.programa === "Trade In") datosRec.costo = docsMoney(d.costo) || datosRec.costo;
      const rec = {
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        nombre: docsFullName(d) || "Sin nombre",
        programa: d.programa,
        empleado: (d.programa === "Trade In" && d.asesor.trim()) ? d.asesor.trim() : ishopAjustes().nombre,
        fecha: new Date().toISOString(),
        datos: hayDatos ? Object.assign(datosRec, { sucursal: DOCS_SUCURSAL, fechaTexto: docsFechaHoy() }) : null,
        firma,
        firmaAsesor,
        usuarioFrente: d.frente,
        usuarioReverso: d.reverso,
        ticket: d.ticket,
      };
      await docsPut(rec);
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      tUrls.forEach(u => URL.revokeObjectURL(u));
      docsDraft = docsNewDraft();
      stack = [{ screen: "home", title: "iShop Tools" }];   // al regresar desde la palomita se va al inicio
      navigate({ screen: "docsOk", title: "Registro", hero: true });
    } catch (e) {
      wrap.querySelector("#cfMsg").textContent = "No se pudo guardar. Revisa el espacio del teléfono o abre la app desde el icono de inicio (no en modo privado).";
      okBtn.disabled = false;
    }
  });
  return wrap;
}

/* ---------- Pantalla 4: palomita verde + registros (con la flechita) ---------- */
let docsListUrls = [];
function buildDocsOk(entry) {
  const wrap = document.createElement("div");
  wrap.className = "docs-page";
  wrap.innerHTML = `
    ${entry.hero ? `
    <section class="docs-ok-hero">
      <div class="docs-ok-circle"><svg viewBox="0 0 52 52" aria-hidden="true"><path d="M14 27l8 8 16-17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h2>Registro guardado</h2>
      <button type="button" class="docs-ok-arrow" id="docsArrow" aria-label="Ver registros" aria-expanded="false">⌄</button>
    </section>` : ""}
    <section class="docs-regs" id="docsRegs"${entry.hero ? " hidden" : ""}>
      <h3 class="docs-list-title">Registros</h3>
      <div id="docsList"></div>
    </section>
  `;
  const listEl = wrap.querySelector("#docsList");
  const arrow = wrap.querySelector("#docsArrow");
  if (arrow) {
    const regs = wrap.querySelector("#docsRegs");
    arrow.addEventListener("click", () => {
      const open = regs.hidden;
      regs.hidden = !open;
      arrow.classList.toggle("open", open);
      arrow.setAttribute("aria-expanded", String(open));
      if (open) { renderList(); setTimeout(() => regs.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }
    });
  }

  async function renderList() {
    docsListUrls.forEach(u => URL.revokeObjectURL(u));
    docsListUrls = [];
    listEl.innerHTML = "";
    let recs;
    try { recs = await docsAll(); }
    catch (e) {
      listEl.innerHTML = `<p class="docs-msg">Este navegador no permite guardar archivos (¿modo privado?).</p>`;
      return;
    }
    if (!recs.length) { listEl.innerHTML = `<p class="docs-msg">No hay registros guardados.</p>`; return; }

    recs.forEach(rec => {
      const card = document.createElement("div");
      card.className = "docs-rec";

      const top = document.createElement("div");
      top.className = "docs-rec-top";
      const name = document.createElement("strong");
      name.textContent = rec.nombre || "Sin nombre";
      const chip = document.createElement("span");
      chip.className = "docs-chip";
      chip.textContent = docsTimeLeft(rec);
      top.append(name, chip);

      const meta = document.createElement("div");
      meta.className = "docs-rec-meta";
      meta.textContent = new Date(rec.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) + (rec.empleado ? " · " + rec.empleado : "");

      card.append(top);
      if (rec.programa) {
        const pr = document.createElement("div");
        pr.className = "docs-rec-prog";
        pr.textContent = rec.programa;
        card.append(pr);
      }
      card.append(meta);

      const d = rec.datos;
      if (d) {
        const box = document.createElement("div");
        box.className = "docs-rec-data";
        docsCampos(rec.programa).forEach(([k, label]) => {
          if (!d[k]) return;
          const row = document.createElement("div");
          row.className = "docs-copy-row";
          const txt = document.createElement("div");
          const l = document.createElement("span"); l.textContent = label;
          const v = document.createElement("strong"); v.textContent = d[k];
          txt.append(l, v);
          const b = document.createElement("button");
          b.type = "button"; b.className = "docs-copy"; b.textContent = "Copiar";
          b.addEventListener("click", () => docsCopy(d[k], b));
          row.append(txt, b);
          box.appendChild(row);
        });
        card.appendChild(box);
      }

      const thumbs = document.createElement("div");
      thumbs.className = "docs-rec-thumbs";
      [["Frente", rec.usuarioFrente || rec.usuario], ["Atrás", rec.usuarioReverso], ["Ticket", rec.ticket], ["Firma", rec.firma], ["Firma asesor", rec.firmaAsesor]].forEach(([label, blob]) => {
        if (!blob) return;
        const fig = document.createElement("figure");
        const u = URL.createObjectURL(blob);
        docsListUrls.push(u);
        const im = document.createElement("img");
        im.src = u; im.alt = label;
        const cap = document.createElement("figcaption");
        cap.textContent = label;
        fig.append(im, cap);
        thumbs.appendChild(fig);
      });
      card.appendChild(thumbs);

      const actions = document.createElement("div");
      actions.className = "docs-actions";
      const mk = (text, cls, fn) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "docs-btn " + cls; b.textContent = text;
        b.addEventListener("click", fn); return b;
      };
      actions.append(mk("Guardar fotos", "", () => docsShare(rec)));
      if (d && DOCS_PDF_TEMPLATES[rec.programa]) {
        const pb = mk("Descargar PDF", "", () => docsShareContrato(rec, pb));
        actions.append(pb);
      }
      if (d) actions.append(mk("Descargar datos", "sec", () => docsShareDatos(rec)));
      actions.append(mk("Borrar", "danger", async () => {
        if (!confirm("¿Borrar este registro del teléfono? No se puede recuperar.")) return;
        try { await docsDelete(rec.id); } catch (e) {}
        renderList();
      }));
      card.appendChild(actions);
      listEl.appendChild(card);
    });
  }
  if (!entry.hero) renderList();
  return wrap;
}

function buildPlanTabs(options, base, extraOpts = {}) {
  const { onSelect, phonePrice } = extraOpts;
  const wrap = document.createElement("div");

  const tabs = document.createElement("div");
  tabs.className = "plan-tabs";
  const panels = document.createElement("div");

  let activeIdx = 0;

  function renderPanel(idx) {
    panels.innerHTML = "";
    const opt = options[idx];
    if (typeof onSelect === "function") onSelect(opt);
    const chipsRow = document.createElement("div");
    chipsRow.className = "month-chips";
    let selectedMonths = MESES[0];

    const acChipsRow = document.createElement("div");
    acChipsRow.className = "month-chips";
    acChipsRow.hidden = true;
    let selectedAcMonths = 10;
    [10, 12, 13].forEach(m => {
      const chip = document.createElement("button");
      chip.className = "chip" + (m === selectedAcMonths ? " active" : "");
      chip.textContent = "AC " + m + " msi";
      chip.addEventListener("click", () => {
        selectedAcMonths = m;
        acChipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderResult();
      });
      acChipsRow.appendChild(chip);
    });

    const resultBox = document.createElement("div");
    resultBox.className = "plan-result";

    function renderResult() {
      if (base === null || base === undefined) {
        resultBox.innerHTML = `<p class="pending">Precio del equipo pendiente de cargar.</p>`;
        acChipsRow.hidden = true;
        return;
      }
      if (opt.extra === null) {
        resultBox.innerHTML = `<p class="pending">Precio de AppleCare+ pendiente de cargar.</p>`;
        acChipsRow.hidden = true;
        return;
      }
      acChipsRow.hidden = !(selectedMonths === 15 && opt.extra > 0);
      const plan = computePlan(base, opt.extra, selectedMonths, selectedAcMonths);
      if (!plan) {
        resultBox.innerHTML = `<p class="pending">Precio pendiente de cargar.</p>`;
        return;
      }
      if (plan.split) {
        resultBox.innerHTML = `
          <div class="plan-phase"><span>Mes 1 a ${plan.acMonths} (con AppleCare+)</span><strong>${money(plan.phase1.amount)}/mes</strong></div>
          <div class="plan-phase"><span>Mes ${plan.acMonths + 1} a 15 (solo iPhone)</span><strong>${money(plan.phase2.amount)}/mes</strong></div>
        `;
      } else {
        resultBox.innerHTML = `<div class="plan-phase"><span>${selectedMonths} meses</span><strong>${money(plan.amount)}/mes</strong></div>`;
      }
    }

    MESES.forEach(m => {
      const chip = document.createElement("button");
      chip.className = "chip" + (m === selectedMonths ? " active" : "");
      chip.textContent = m + (m === 15 ? "*" : "");
      chip.addEventListener("click", () => {
        selectedMonths = m;
        chipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderResult();
      });
      chipsRow.appendChild(chip);
    });

    panels.appendChild(chipsRow);
    panels.appendChild(acChipsRow);
    panels.appendChild(resultBox);
    renderResult();

    if (opt.extra) {
      const note = document.createElement("p");
      note.className = "plan-note";
      note.textContent = "* A 15 meses, el AppleCare+ se financia solo dentro de los meses que elijas (10, 12 o 13).";
      panels.appendChild(note);

      if (phonePrice !== undefined && phonePrice !== null) {
        const promoBox = document.createElement("div");
        promoBox.className = "plan-result";
        promoBox.style.marginTop = "10px";
        promoBox.innerHTML = `
          <div class="plan-phase"><span>50% del equipo</span><strong>${money(phonePrice * 0.5)}</strong></div>
          <div class="plan-phase"><span>50% de ${opt.label}</span><strong>${money(opt.extra * 0.5)}</strong></div>
        `;
        panels.appendChild(promoBox);

        const promoNote = document.createElement("p");
        promoNote.className = "plan-note";
        promoNote.textContent = "50% aplicable dentro de los primeros 13 meses.";
        panels.appendChild(promoNote);
      }
    }
  }

  options.forEach((opt, idx) => {
    const tab = document.createElement("button");
    tab.className = "plan-tab" + (idx === 0 ? " active" : "");
    tab.textContent = opt.label;
    tab.addEventListener("click", () => {
      tabs.querySelectorAll(".plan-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeIdx = idx;
      renderPanel(idx);
    });
    tabs.appendChild(tab);
  });

  wrap.appendChild(tabs);
  wrap.appendChild(panels);
  renderPanel(0);
  return wrap;
}

const FINANCE_CONFIG = {
  IFL: { label: "iPhone For Life", phase1: 10, phase2Start: 11, phase2End: 24, phase2Months: 14, residualMonth: 25 },
  GET: { label: "GET",             phase1: 13, phase2Start: 14, phase2End: 20, phase2Months: 7,  residualMonth: 21 },
};

function buildFinanceSelect(path, planType) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";

  if (path.length === 0) {
    heading.innerHTML = `<h2>Elige el iPhone</h2>`;
    wrap.appendChild(heading);
    const list = document.createElement("div");
    list.className = "sub-list";
    const models = FINANCIAMIENTO_DATA ? Object.keys(FINANCIAMIENTO_DATA) : [];
    if (models.length === 0) {
      wrap.appendChild(buildPlaceholder("Sin datos", "💳", "Aún no hay planes cargados en datos/financiamiento.json."));
      return wrap;
    }
    buildModelPicker("iPhone", models, wrap, (model) => {
      navigate({ screen: "financeSelect", path: [model], planType, title: modeloNombre(model) });
    }, { desc: true });
    return wrap;
  }

  const model = path[0];
  const caps = FINANCIAMIENTO_DATA?.[model] || {};
  heading.innerHTML = `<h2>${model}</h2>`;
  wrap.appendChild(heading);
  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(caps).forEach(cap => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${cap}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "financeResult", model, capacity: cap, planType, title: cap });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildFinanceResult(model, capacity, planType) {
  const wrap = document.createElement("div");
  const cfg = FINANCE_CONFIG[planType];
  const finData = FINANCIAMIENTO_DATA?.[model]?.[capacity]?.[planType];
  const ac = findApplecareForModel(model);

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  banner.innerHTML = `<span>${cfg.label}</span><strong>${model} ${capacity}</strong>`;
  wrap.appendChild(banner);

  if (!finData) {
    wrap.appendChild(buildPlaceholder("Sin datos", "💳", "Aún no hay plan " + cfg.label + " cargado para este equipo."));
    return wrap;
  }

  wrap.appendChild(buildFinanceColumnsGrid(finData, ac, cfg));
  return wrap;
}

function buildFinanceColumnsGrid(finData, ac, cfg, o = {}) {
  const cols = o.solo
    ? [{ label: "Solo equipo (sin AppleCare+)", extra: 0 }]
    : [
        { label: "AppleCare+", extra: ac.APPLECARE },
        { label: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
      ];

  const grid = document.createElement("div");
  grid.className = "finance-columns" + (o.solo ? " solo" : "");

  cols.forEach(col => {
    const card = document.createElement("div");
    card.className = "finance-col";

    if (col.extra === null || col.extra === undefined) {
      card.innerHTML = `<h4>${col.label}</h4><p class="pending">AppleCare+ pendiente</p>`;
      grid.appendChild(card);
      return;
    }

    const phase1Amount = finData.monthly + col.extra / cfg.phase1;
    const phase2Amount = finData.monthly;
    const residual = finData.residual;
    const total = phase1Amount * cfg.phase1 + phase2Amount * cfg.phase2Months + residual;

    card.innerHTML = `
      <h4>${col.label}</h4>
      <div class="finance-row"><span>Mes 1–${cfg.phase1}</span><strong>${money(phase1Amount)}</strong></div>
      <div class="finance-row"><span>Mes ${cfg.phase1 + 1}–${cfg.phase2End}</span><strong>${money(phase2Amount)}</strong></div>
      <div class="finance-row"><span>Mes ${cfg.residualMonth} (saldo)</span><strong>${money(residual)}</strong></div>
      <div class="finance-row total"><span>Total</span><strong>${money(total)}</strong></div>
    `;
    grid.appendChild(card);
  });

  return grid;
}

render(true);

// Primera vez: pantalla de bienvenida para poner nombre y colores (solo se muestra una vez)
if (!ishopAjustes().listo) {
  ishopGuardarAjustes({ listo: true });
  navigate({ screen: "settings", title: "Bienvenido", welcome: true });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

