/* =====================================================================
   EXISTENCIAS (oculto) — lo que hay en bodega, bonito y por sección
   Se abre manteniendo presionado ~1 s el botón "Código cajas" del inicio.
   Lee las cantidades del módulo Bodega (bodega.js) y el catálogo de datos/escaner.json.
   Arriba: solo lo que hay, por sección. Abajo: "Todo agotado".
   ===================================================================== */
const EX_SECCIONES = [
  { id: "iPhone",  icono: "📱", c1: "#0a84ff", c2: "#5e5ce6" },
  { id: "iPad",    icono: "🟦", c1: "#30b0c7", c2: "#0a84ff" },
  { id: "Mac",     icono: "💻", c1: "#8e8e93", c2: "#48484a" },
  { id: "Watch",   icono: "⌚", c1: "#ff375f", c2: "#ff9f0a" },
  { id: "AirPods", icono: "🎧", c1: "#bf5af2", c2: "#5e5ce6" },
  { id: "Bocinas / Home", icono: "🔊", c1: "#34c759", c2: "#30b0c7" },
  { id: "Otros",   icono: "📦", c1: "#ff9f0a", c2: "#ff6b35" },
];
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
function exCap(c) { c = String(c || "").trim(); return /^\d+$/.test(c) ? c + " GB" : c.replace(/gb$/i, " GB").replace(/tb$/i, " TB"); }
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

function exEstilos() {
  if (document.getElementById("exEstilos")) return;
  const st = document.createElement("style"); st.id = "exEstilos";
  st.textContent = `
  .ex-wrap{ padding-bottom:48px; }
  .ex-hero{ border-radius:22px; padding:20px 18px 16px; color:#fff; background:linear-gradient(135deg,#0a84ff,#5e5ce6 60%,#bf5af2); box-shadow:0 10px 26px rgba(94,92,230,.35); }
  .ex-hero h2{ margin:0; font-size:26px; letter-spacing:-.02em; }
  .ex-hero p{ margin:2px 0 14px; opacity:.85; font-size:13.5px; }
  .ex-stats{ display:flex; gap:10px; }
  .ex-stat{ flex:1; background:rgba(255,255,255,.18); border-radius:14px; padding:10px 8px; text-align:center; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
  .ex-stat b{ display:block; font-size:24px; line-height:1.1; }
  .ex-stat span{ font-size:11.5px; opacity:.85; text-transform:uppercase; letter-spacing:.06em; }
  .ex-search{ margin:14px 0 8px; position:relative; }
  .ex-search input{ width:100%; box-sizing:border-box; padding:13px 14px 13px 40px; border-radius:14px; border:0; font-size:16px; background:#e8e8ed; color:var(--text); }
  html[data-mode="dark"] .ex-search input{ background:#2c2c2e; }
  .ex-search::before{ content:"🔍"; position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:15px; }
  .ex-chips{ display:flex; gap:8px; overflow-x:auto; padding:4px 2px 10px; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .ex-chips::-webkit-scrollbar{ display:none; }
  .ex-chip{ flex:0 0 auto; border:0; border-radius:999px; padding:9px 14px; font-size:14.5px; font-weight:600; background:#e8e8ed; color:var(--text); white-space:nowrap; }
  html[data-mode="dark"] .ex-chip{ background:#2c2c2e; }
  .ex-chip.on{ background:var(--accent); color:#fff; }
  .ex-chip small{ opacity:.7; margin-left:5px; font-weight:500; }
  .ex-sec{ margin:18px 0 6px; display:flex; align-items:center; gap:10px; }
  .ex-sec-ico{ width:38px; height:38px; border-radius:11px; display:grid; place-items:center; font-size:20px; color:#fff; box-shadow:0 3px 8px rgba(0,0,0,.18); }
  .ex-sec h3{ margin:0; font-size:20px; letter-spacing:-.01em; flex:1; }
  .ex-sec em{ font-style:normal; font-size:13px; color:var(--text-secondary); font-weight:600; }
  .ex-model{ background:#fff; border-radius:18px; margin:10px 0; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.07); }
  html[data-mode="dark"] .ex-model{ background:#1c1c1e; }
  .ex-model-h{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; }
  .ex-model-h strong{ font-size:17px; letter-spacing:-.01em; }
  .ex-model-h .tot{ background:rgba(52,199,89,.15); color:#1f9d46; font-weight:700; border-radius:999px; padding:4px 12px; font-size:14px; }
  html[data-mode="dark"] .ex-model-h .tot{ color:#30d158; }
  .ex-row{ display:flex; align-items:center; gap:12px; padding:11px 16px; border-top:1px solid rgba(120,120,128,.15); }
  .ex-dot{ width:30px; height:30px; border-radius:50%; flex:0 0 auto; border:1px solid rgba(0,0,0,.15); box-shadow:inset 0 -5px 8px rgba(0,0,0,.12), inset 0 3px 5px rgba(255,255,255,.35); }
  .ex-info{ flex:1; min-width:0; }
  .ex-info .l1{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .ex-info .col{ font-weight:600; font-size:15.5px; }
  .ex-cap{ font-size:12px; font-weight:700; padding:2px 8px; border-radius:7px; background:rgba(10,132,255,.12); color:#0a6fd8; }
  html[data-mode="dark"] .ex-cap{ color:#64b5ff; }
  .ex-upc{ display:block; margin-top:3px; font:12.5px ui-monospace,Menlo,monospace; color:var(--text-secondary); letter-spacing:.03em; }
  .ex-qty{ min-width:46px; text-align:center; font-weight:800; font-size:19px; padding:6px 10px; border-radius:12px; background:rgba(52,199,89,.15); color:#1f9d46; }
  html[data-mode="dark"] .ex-qty{ color:#30d158; }
  .ex-qty.low{ background:rgba(255,159,10,.17); color:#c77700; }
  .ex-qty small{ display:block; font-size:9.5px; font-weight:700; letter-spacing:.04em; margin-top:-1px; }
  .ex-ago-h{ margin:30px 0 6px; padding:14px 16px; border-radius:16px; background:linear-gradient(135deg,#ff453a,#ff375f); color:#fff; display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:18px; box-shadow:0 6px 16px rgba(255,69,58,.3); }
  .ex-ago-h span{ font-size:13px; opacity:.9; font-weight:600; }
  .ex-ago{ background:#fff; border-radius:16px; margin:8px 0; overflow:hidden; }
  html[data-mode="dark"] .ex-ago{ background:#1c1c1e; }
  .ex-ago summary{ list-style:none; display:flex; align-items:center; gap:10px; padding:14px 16px; font-weight:600; font-size:16px; }
  .ex-ago summary::-webkit-details-marker{ display:none; }
  .ex-ago summary b{ margin-left:auto; color:#ff453a; font-size:14px; }
  .ex-ago summary::after{ content:"›"; color:var(--text-secondary); font-size:22px; transform:rotate(90deg); margin-left:4px; }
  .ex-ago[open] summary::after{ transform:rotate(-90deg); }
  .ex-ago-m{ padding:10px 16px 4px; font-size:12.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.05em; border-top:1px solid rgba(120,120,128,.15); }
  .ex-ago .ex-row{ opacity:.78; padding:9px 16px; }
  .ex-ago .ex-dot{ width:22px; height:22px; filter:grayscale(.6); }
  .ex-tag{ font-size:11px; font-weight:800; letter-spacing:.05em; padding:4px 9px; border-radius:8px; background:rgba(255,69,58,.14); color:#e0342b; }
  .ex-vacio{ text-align:center; padding:34px 18px; color:var(--text-secondary); line-height:1.5; }
  .ex-vacio b{ display:block; font-size:18px; color:var(--text); margin-bottom:6px; }
  `;
  document.head.appendChild(st);
}

function buildExistencias() {
  exEstilos();
  const wrap = document.createElement("div");
  wrap.className = "ex-wrap";
  const cat = exCatalogo();
  const bod = (typeof bodegaLoad === "function") ? bodegaLoad() : { stock: {}, fecha: "" };
  const stock = bod.stock || {};

  // Todos los códigos: catálogo + los que existan en stock pero no estén en catálogo
  const todos = {};
  Object.keys(cat).forEach(k => { todos[k] = cat[k]; });
  Object.keys(stock).forEach(k => { if (!todos[k]) todos[k] = { modelo: "Código nuevo", color: "", capacidad: "", seccion: "Otros" }; });

  const disp = [], agot = [];
  Object.keys(todos).forEach(k => {
    const it = { upc: k, ...todos[k], qty: stock[k] || 0 };
    (it.qty > 0 ? disp : agot).push(it);
  });
  const cmp = (a, b) => exCapNum(a.capacidad) - exCapNum(b.capacidad) || a.color.localeCompare(b.color);
  const porSeccion = (lista) => {
    const o = {};
    lista.forEach(i => { ((o[i.seccion] = o[i.seccion] || {})[i.modelo] = (o[i.seccion][i.modelo] || [])).push(i); });
    return o;
  };
  // orden de modelos: el más nuevo primero (como en la lista del proveedor)
  const ordenModelos = (ms) => ms.sort((a, b) => (typeof BODEGA_ORDEN !== "undefined" ? (BODEGA_ORDEN.indexOf(a) < 0 ? 99 : BODEGA_ORDEN.indexOf(a)) - (BODEGA_ORDEN.indexOf(b) < 0 ? 99 : BODEGA_ORDEN.indexOf(b)) : 0) || b.localeCompare(a, undefined, { numeric: true }));

  const totPzas = disp.reduce((s, i) => s + i.qty, 0);
  let filtro = "Todo", texto = "";

  wrap.innerHTML = `
    <div class="ex-hero">
      <h2>Existencias</h2>
      <p>${Object.keys(stock).length ? "Bodega" + (bod.fecha ? " · lista del " + exEsc(bod.fecha) : "") : "Sin datos de bodega todavía"}</p>
      <div class="ex-stats">
        <div class="ex-stat"><b>${totPzas}</b><span>Piezas</span></div>
        <div class="ex-stat"><b>${disp.length}</b><span>Disponibles</span></div>
        <div class="ex-stat"><b>${agot.length}</b><span>Agotados</span></div>
      </div>
    </div>
    <div class="ex-search"><input id="exBuscar" type="search" placeholder="Buscar modelo, color o UPC" autocomplete="off"></div>
    <div class="ex-chips" id="exChips"></div>
    <div id="exLista"></div>`;

  const chips = wrap.querySelector("#exChips"), lista = wrap.querySelector("#exLista");
  const cuentaSec = {};
  disp.forEach(i => { cuentaSec[i.seccion] = (cuentaSec[i.seccion] || 0) + i.qty; });

  function pintaChips() {
    const ops = ["Todo", ...EX_SECCIONES.map(s => s.id).filter(id => id !== "Otros" || cuentaSec.Otros || agot.some(a => a.seccion === "Otros"))];
    chips.innerHTML = ops.map(o => `<button class="ex-chip ${o === filtro ? "on" : ""}" data-f="${exEsc(o)}">${exEsc(o)}${o !== "Todo" ? `<small>${cuentaSec[o] || 0}</small>` : `<small>${totPzas}</small>`}</button>`).join("");
    chips.querySelectorAll(".ex-chip").forEach(b => b.addEventListener("click", () => { filtro = b.dataset.f; pintaChips(); pintaLista(); }));
  }
  const coincide = (i) => {
    if (!texto) return true;
    const t = texto.toLowerCase();
    return (i.modelo + " " + i.color + " " + i.capacidad + " " + i.upc).toLowerCase().includes(t);
  };
  const fila = (i, agotado) => `
    <div class="ex-row">
      <div class="ex-dot" style="background:${exColor(i.color)}"></div>
      <div class="ex-info">
        <div class="l1"><span class="col">${exEsc(i.color || "Sin color")}</span>${i.capacidad ? `<span class="ex-cap">${exEsc(exCap(i.capacidad))}</span>` : ""}</div>
        <span class="ex-upc">UPC ${exEsc(i.upc)}</span>
      </div>
      ${agotado ? `<span class="ex-tag">AGOTADO</span>`
        : `<div class="ex-qty ${i.qty <= 3 ? "low" : ""}">${i.qty}${i.qty <= 3 ? "<small>POCAS</small>" : ""}</div>`}
    </div>`;

  function pintaLista() {
    const d = porSeccion(disp.filter(i => coincide(i) && (filtro === "Todo" || i.seccion === filtro)));
    const a = porSeccion(agot.filter(i => coincide(i) && (filtro === "Todo" || i.seccion === filtro)));
    let html = "";
    EX_SECCIONES.forEach(sec => {
      const modelos = d[sec.id]; if (!modelos) return;
      const nombres = ordenModelos(Object.keys(modelos));
      const piezas = nombres.reduce((s, m) => s + modelos[m].reduce((x, i) => x + i.qty, 0), 0);
      html += `<div class="ex-sec"><div class="ex-sec-ico" style="background:linear-gradient(135deg,${sec.c1},${sec.c2})">${sec.icono}</div><h3>${exEsc(sec.id)}</h3><em>${piezas} pzas</em></div>`;
      nombres.forEach(m => {
        const items = modelos[m].sort(cmp);
        html += `<div class="ex-model"><div class="ex-model-h"><strong>${exEsc(m)}</strong><span class="tot">${items.reduce((s, i) => s + i.qty, 0)}</span></div>${items.map(i => fila(i, false)).join("")}</div>`;
      });
    });
    if (!html) {
      html = !Object.keys(stock).length
        ? `<div class="ex-vacio"><b>Aún no hay existencias</b>Escanea el listado en Bodega (mantén presionado “Registros”) y aquí aparecerá todo ordenado.</div>`
        : `<div class="ex-vacio"><b>Nada disponible aquí</b>${texto ? "Prueba con otra búsqueda." : "Esta sección no tiene piezas en bodega."}</div>`;
    }
    const nAgot = Object.values(a).reduce((s, m) => s + Object.values(m).reduce((x, l) => x + l.length, 0), 0);
    if (nAgot) {
      html += `<div class="ex-ago-h">Todo agotado <span>${nAgot} productos</span></div><div id="exAgot"></div>`;
    }
    lista.innerHTML = html;
    if (nAgot) {
      const cont = lista.querySelector("#exAgot");
      EX_SECCIONES.forEach(sec => {
        const modelos = a[sec.id]; if (!modelos) return;
        const nombres = ordenModelos(Object.keys(modelos));
        const n = nombres.reduce((s, m) => s + modelos[m].length, 0);
        const det = document.createElement("details"); det.className = "ex-ago";
        if (texto) det.open = true;
        det.innerHTML = `<summary><span>${sec.icono}</span>${exEsc(sec.id)}<b>${n}</b></summary><div class="ex-ago-body"></div>`;
        let lleno = false;
        const llenar = () => {
          if (lleno) return; lleno = true;
          det.querySelector(".ex-ago-body").innerHTML = nombres.map(m => `<div class="ex-ago-m">${exEsc(m)}</div>${modelos[m].sort(cmp).map(i => fila(i, true)).join("")}`).join("");
        };
        det.addEventListener("toggle", () => { if (det.open) llenar(); });
        if (det.open) llenar();
        cont.appendChild(det);
      });
    }
  }

  wrap.querySelector("#exBuscar").addEventListener("input", e => { texto = e.target.value.trim(); pintaLista(); });
  pintaChips(); pintaLista();
  return wrap;
}
