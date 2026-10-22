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
  .ex-wrap{ --bx-card:#fff; --bx-fill:#e8e8ed; --bx-line:rgba(120,120,128,.2); --bx-green:#1f9d46; --bx-orange:#c77700; --bx-cap:#0a6fd8; padding-bottom:48px; }
  html[data-mode="dark"] .ex-wrap{ --bx-card:#1c1c1e; --bx-fill:#2c2c2e; --bx-line:rgba(255,255,255,.12); --bx-green:#30d158; --bx-orange:#ffb340; --bx-cap:#64b5ff; }
  /* menú de arriba: carrusel deslizable */
  .ex-car{ display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x proximity; padding:4px 2px 14px; margin:0 -2px; scrollbar-width:none; -webkit-overflow-scrolling:touch; transition:opacity .2s; }
  .ex-car::-webkit-scrollbar{ display:none; }
  .ex-car.off{ opacity:.45; }
  .ex-tile{ flex:0 0 21.5%; min-width:72px; height:108px; scroll-snap-align:start; border:1px solid var(--bx-line); border-radius:18px; background:var(--bx-card); color:var(--text); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; font:inherit; padding:8px 4px; }
  .ex-tile b{ font-size:15.5px; font-weight:600; letter-spacing:-.01em; }
  .ex-ti{ position:relative; width:50px; height:50px; display:grid; place-items:center; }
  .ex-ti svg{ width:44px; height:44px; }
  .ex-ti img, .ex-pic img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
  .ex-ti.has svg, .ex-pic.has svg{ visibility:hidden; }
  .ex-tile.on{ background:linear-gradient(160deg,#0b3fd1,#1a73ff); border-color:transparent; color:#fff; box-shadow:0 4px 12px rgba(26,115,255,.3); }
  .ex-search{ margin:4px 0 6px; position:relative; }
  .ex-search svg{ position:absolute; left:14px; top:50%; width:20px; height:20px; margin-top:-10px; fill:none; stroke:var(--text-secondary); stroke-width:1.9; stroke-linecap:round; }
  .ex-search input{ width:100%; box-sizing:border-box; padding:14px 14px 14px 44px; border-radius:15px; border:0; font-size:16px; background:var(--bx-fill); color:var(--text); }
  .ex-meta{ margin:0 4px 4px; font-size:12.5px; color:var(--text-secondary); }
  .ex-sec{ margin:18px 0 8px; display:flex; align-items:center; gap:10px; }
  .ex-sec-ico{ width:26px; height:26px; color:var(--accent); display:grid; place-items:center; }
  .ex-sec-ico svg{ width:26px; height:26px; }
  .ex-sec h3{ margin:0; font-size:22px; letter-spacing:-.01em; flex:1; }
  .ex-sec em{ font-style:normal; font-size:15px; color:var(--text-secondary); font-weight:500; }
  /* tarjeta de modelo: imagen / icono a la izquierda, colores a la derecha */
  .ex-model{ display:flex; background:var(--bx-card); border:1px solid var(--bx-line); border-radius:18px; margin:10px 0; overflow:hidden; }
  .ex-pic{ position:relative; flex:0 0 92px; display:grid; place-items:center; color:var(--c1); background:linear-gradient(160deg,color-mix(in srgb,var(--c1) 16%, transparent),color-mix(in srgb,var(--c2) 6%, transparent)); }
  .ex-pic > svg{ width:46px; height:46px; opacity:.9; }
  .ex-pic img{ inset:10px; width:calc(100% - 20px); height:calc(100% - 20px); }
  .ex-body{ flex:1; min-width:0; border-left:1px solid var(--bx-line); }
  .ex-model-h{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:14px 14px 10px; }
  .ex-model-h strong{ font-size:19px; letter-spacing:-.01em; }
  .ex-model-h .tot{ background:rgba(52,199,89,.16); color:var(--bx-green); font-weight:700; border-radius:10px; padding:4px 12px; font-size:16px; }
  .ex-row{ display:flex; align-items:center; gap:11px; padding:11px 14px; border-top:1px solid var(--bx-line); }
  .ex-dot{ width:30px; height:30px; border-radius:50%; flex:0 0 auto; border:1px solid rgba(120,120,128,.35); box-shadow:inset 0 -5px 8px rgba(0,0,0,.14), inset 0 3px 5px rgba(255,255,255,.3); }
  .ex-info{ flex:1; min-width:0; }
  .ex-info .l1{ display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
  .ex-info .col{ font-weight:600; font-size:16px; }
  .ex-cap{ font-size:11.5px; font-weight:700; padding:2px 8px; border-radius:7px; background:rgba(10,132,255,.14); color:var(--bx-cap); }
  .ex-upc{ display:block; margin-top:3px; font:12px ui-monospace,Menlo,monospace; color:var(--text-secondary); letter-spacing:.02em; }
  .ex-apa{ display:inline-flex; align-items:center; gap:4px; margin-top:6px; font-size:11.5px; font-weight:700; color:var(--bx-cap); background:rgba(10,132,255,.14); padding:3px 9px 3px 6px; border-radius:999px; }
  .ex-apa svg{ width:12px; height:12px; fill:currentColor; stroke:currentColor; stroke-width:1.4; stroke-linejoin:round; }
  .ex-qty{ min-width:46px; text-align:center; font-weight:800; font-size:19px; padding:6px 10px; border-radius:11px; background:rgba(52,199,89,.16); color:var(--bx-green); }
  .ex-qty.low{ background:rgba(255,159,10,.2); color:var(--bx-orange); }
  .ex-qty small{ display:block; font-size:9px; font-weight:700; letter-spacing:.04em; margin-top:-1px; }
  .ex-ago-h{ margin:30px 0 6px; padding:14px 16px; border-radius:16px; background:linear-gradient(135deg,#ff453a,#ff375f); color:#fff; display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:18px; box-shadow:0 6px 16px rgba(255,69,58,.3); }
  .ex-ago-h span{ font-size:13px; opacity:.9; font-weight:600; }
  .ex-ago{ background:var(--bx-card); border-radius:16px; margin:8px 0; overflow:hidden; }
  .ex-ago summary{ list-style:none; display:flex; align-items:center; gap:10px; padding:14px 16px; font-weight:600; font-size:16px; }
  .ex-ago summary::-webkit-details-marker{ display:none; }
  .ex-ago summary b{ margin-left:auto; color:#ff453a; font-size:14px; }
  .ex-ago summary::after{ content:"›"; color:var(--text-secondary); font-size:22px; transform:rotate(90deg); margin-left:4px; }
  .ex-ago[open] summary::after{ transform:rotate(-90deg); }
  .ex-ago-m{ padding:10px 16px 4px; font-size:12.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.05em; border-top:1px solid var(--bx-line); }
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
  const apart = (typeof bodegaApartados === "function") ? bodegaApartados() : {};   // solo los apartados se ven aquí; DOA / dañados / no vendibles no

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

  const tieneSec = id => disp.some(i => i.seccion === id) || agot.some(i => i.seccion === id);
  const secs = EX_SECCIONES.filter(s => s.id !== "Otros" || tieneSec("Otros"));
  let filtro = (secs.find(s => tieneSec(s.id)) || secs[0]).id, texto = "";

  wrap.innerHTML = `
    <div class="ex-car" id="exCar">${secs.map(s => `<button class="ex-tile" data-f="${exEsc(s.id)}"><span class="ex-ti">${exIcono(s.id)}${exImg(s.id)}</span><b>${exEsc(s.label || s.id)}</b></button>`).join("")}</div>
    <div class="ex-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="exBuscar" type="search" placeholder="Buscar modelo, color, tamaño o UPC" autocomplete="off"></div>
    <p class="ex-meta">${Object.keys(stock).length ? "Bodega" + (bod.fecha ? " · lista del " + exEsc(bod.fecha) : "") : "Sin datos de bodega todavía"}</p>
    <div id="exLista"></div>`;

  const car = wrap.querySelector("#exCar"), lista = wrap.querySelector("#exLista");
  const tiles = [...car.querySelectorAll(".ex-tile")];
  function pintaCar() { tiles.forEach(t => t.classList.toggle("on", t.dataset.f === filtro)); car.classList.toggle("off", !!texto); }
  tiles.forEach(t => t.addEventListener("click", () => {
    filtro = t.dataset.f; texto = ""; wrap.querySelector("#exBuscar").value = "";
    pintaCar(); pintaLista();
    t.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }));

  const coincide = (i) => {
    if (!texto) return true;
    const t = texto.toLowerCase();
    return (i.modelo + " " + i.color + " " + i.capacidad + " " + i.upc).toLowerCase().includes(t);
  };
  const apaHtml = (n) => n > 0 ? `<span class="ex-apa"><svg viewBox="0 0 24 24"><path d="M7 4h10v16l-5-3.5L7 20z"/></svg>${n} apartado${n === 1 ? "" : "s"}</span>` : "";
  const fila = (i, agotado) => `
    <div class="ex-row">
      <div class="ex-dot" style="background:${exColor(i.color)}"></div>
      <div class="ex-info">
        <div class="l1"><span class="col">${exEsc(i.color || "Sin color")}</span>${i.capacidad ? `<span class="ex-cap">${exEsc(exCap(i.capacidad))}</span>` : ""}</div>
        <span class="ex-upc">UPC ${exEsc(i.upc)}</span>
        ${agotado ? "" : apaHtml(apart[i.upc] || 0)}
      </div>
      ${agotado ? `<span class="ex-tag">AGOTADO</span>`
        : `<div class="ex-qty ${i.qty <= 3 ? "low" : ""}">${i.qty}${i.qty <= 3 ? "<small>POCAS</small>" : ""}</div>`}
    </div>`;

  function pintaLista() {
    const f = texto ? "Todo" : filtro;   // al buscar se busca en todas las secciones
    const d = porSeccion(disp.filter(i => coincide(i) && (f === "Todo" || i.seccion === f)));
    const a = porSeccion(agot.filter(i => coincide(i) && (f === "Todo" || i.seccion === f)));
    let html = "";
    EX_SECCIONES.forEach(sec => {
      const modelos = d[sec.id]; if (!modelos) return;
      const nombres = ordenModelos(Object.keys(modelos));
      const piezas = nombres.reduce((s, m) => s + modelos[m].reduce((x, i) => x + i.qty, 0), 0);
      html += `<div class="ex-sec"><span class="ex-sec-ico">${exIcono(sec.id)}</span><h3>${exEsc(sec.label || sec.id)}</h3><em>${piezas} pzas</em></div>`;
      nombres.forEach(m => {
        const items = modelos[m].sort(cmp);
        html += `<div class="ex-model" style="--c1:${sec.c1};--c2:${sec.c2}"><div class="ex-pic">${exIcono(sec.id)}${exImg(m)}</div><div class="ex-body"><div class="ex-model-h"><strong>${exEsc(m)}</strong><span class="tot">${items.reduce((s, i) => s + i.qty, 0)}</span></div>${items.map(i => fila(i, false)).join("")}</div></div>`;
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
        det.innerHTML = `<summary><span>${sec.icono}</span>${exEsc(sec.label || sec.id)}<b>${n}</b></summary><div class="ex-ago-body"></div>`;
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

  wrap.querySelector("#exBuscar").addEventListener("input", e => { texto = e.target.value.trim(); pintaCar(); pintaLista(); });
  pintaCar(); pintaLista();
  return wrap;
}
