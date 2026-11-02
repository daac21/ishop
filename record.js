/* =====================================================================
   Récord de ventas — registro rápido de puntos por semana (dom a sáb)
   Los datos se guardan SOLO en este teléfono (localStorage). No se sincronizan.
   ===================================================================== */
(function () {
  const KEY = "ishop_record_v1";
  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  // [id, nombre, puntos]
  const CATS = [
    { n: "Mac", it: [["mac", "Mac", 6], ["acc-mac", "Accesorio Mac", 3], ["ac-mac", "AppleCare Mac", 10], ["flg-mac", "For Life-Get Mac", 4]] },
    { n: "iPad", it: [["ipad", "iPad", 2], ["acc-ipad", "Accesorio iPad", 2], ["ac-ipad", "AppleCare iPad", 4], ["flg-ipad", "For Life-Get iPad", 4]] },
    { n: "iPhone", it: [["iphone", "iPhone", 2], ["acc-iphone", "Accesorio iPhone", 2], ["ac-ios", "AppleCare iOS", 4], ["switch", "Switch Up iOS", 4], ["flg-iphone", "For Life-Get iPhone", 4], ["buyback", "Buyback", 10]] },
    { n: "Watch (todas las series)", it: [["watch", "Watch", 2], ["acc-watch", "Accesorio Watch", 2], ["ac-watch", "AppleCare Watch", 4], ["flg-watch", "For Life-Get Watch", 4]] },
    { n: "Audio y otros", it: [["asesorias", "Asesorías", 4], ["bocinas", "Bocinas o Audífonos (N/A AirPods)", 3], ["airpods", "AirPods", 0], ["ac-airpods", "AppleCare AirPods, HomePod y Apple TV", 5]] },
  ];
  const ITEMS = {};
  CATS.forEach(c => c.it.forEach(x => { ITEMS[x[0]] = { n: x[1], p: x[2] }; }));

  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY) || "{}"); return d && typeof d === "object" ? d : {}; }
    catch (e) { return {}; }
  }
  function save(d) {
    const ks = Object.keys(d).sort();
    while (ks.length > 40) delete d[ks.shift()];
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }
  function weekStart(off) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() - t.getDay() + off * 7);
    return t;
  }
  function key(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fmt(d) { return d.getDate() + " " + MESES[d.getMonth()]; }

  const css = `
  #recordBtn{ position:absolute; right:52px; top:calc(var(--safe-top) + 10px); height:32px; padding:0 13px 0 10px; border:none; border-radius:16px;
    display:flex; align-items:center; gap:6px; color:#fff; font:inherit; font-size:14px; font-weight:650; letter-spacing:-0.01em;
    background:linear-gradient(135deg,#5183e5,#4247d5); box-shadow:0 4px 12px rgba(66,71,213,.32), inset 0 1px 0 rgba(255,255,255,.25); }
  #recordBtn[hidden]{ display:none; }
  #recordBtn:active{ transform:scale(.95); }
  #recordBtn svg{ width:16px; height:16px; }
  .rc-wrap{ padding-bottom:8px; }
  .rc-week{ display:flex; align-items:center; gap:6px; margin:0 0 12px; }
  .rc-weeklabel{ flex:1; text-align:center; display:flex; flex-direction:column; }
  .rc-weeklabel strong{ font-size:17px; font-weight:700; }
  .rc-weeklabel span{ font-size:13px; color:var(--text-secondary); }
  .rc-arrow{ width:40px; height:40px; border:none; border-radius:12px; background:var(--surface); color:var(--accent); font-size:24px; line-height:1; border:1px solid var(--border); }
  .rc-stats{ display:grid; grid-template-columns:1.2fr 1fr; gap:10px; }
  .rc-stat{ border-radius:18px; padding:12px 14px; background:var(--surface); border:1px solid var(--border); }
  .rc-stat small{ display:block; font-size:13px; color:var(--text-secondary); }
  .rc-stat b{ display:block; font-size:34px; font-weight:750; letter-spacing:-0.03em; line-height:1.1; }
  .rc-stat.main{ background:linear-gradient(135deg,#5183e5,#4247d5); border:none; color:#fff; box-shadow:0 8px 20px rgba(66,71,213,.28); }
  .rc-stat.main small{ color:rgba(255,255,255,.85); }
  .rc-days{ display:flex; gap:5px; margin:12px 0 2px; }
  .rc-day{ flex:1; min-width:0; padding:7px 0 6px; border-radius:12px; border:1px solid var(--border); background:var(--surface); color:var(--text-secondary); font:inherit; font-size:12px; text-align:center; }
  .rc-day b{ display:block; font-size:16px; font-weight:650; color:var(--text); }
  .rc-day i{ display:block; font-style:normal; font-size:11px; min-height:14px; }
  .rc-day.today b{ text-decoration:underline; text-underline-offset:3px; }
  .rc-day.on{ background:linear-gradient(135deg,#5183e5,#4247d5); border-color:transparent; color:rgba(255,255,255,.85); }
  .rc-day.on b{ color:#fff; }
  .rc-cat{ font-size:13px; font-weight:650; color:var(--text-secondary); margin:18px 2px 8px; }
  .rc-grid{ display:grid; grid-template-columns:1fr 1fr; gap:9px; }
  .rc-tile{ position:relative; text-align:left; min-height:68px; padding:11px 12px; border-radius:16px; background:var(--surface); border:1px solid var(--border);
    color:var(--text); font:inherit; display:flex; flex-direction:column; justify-content:space-between; gap:6px; -webkit-user-select:none; user-select:none; }
  .rc-tile:active{ transform:scale(.96); }
  .rc-n{ font-size:14px; font-weight:600; line-height:1.25; padding-right:28px; }
  .rc-p{ font-size:13px; color:var(--text-secondary); }
  .rc-c{ display:none; position:absolute; top:8px; right:8px; min-width:24px; height:24px; padding:0 7px; border-radius:12px; align-items:center; justify-content:center;
    font-size:13px; font-weight:700; color:#fff; background:linear-gradient(135deg,#5183e5,#4247d5); }
  .rc-tile.has{ border-color:#4247d5; background:color-mix(in srgb,#4247d5 10%, var(--surface)); }
  .rc-tile.has .rc-c{ display:flex; }
  .rc-tile.has .rc-p{ color:#4247d5; font-weight:600; }
  html[data-mode="dark"] .rc-tile.has .rc-p{ color:#9aa2f7; }
  .rc-tile.pop{ animation:rcPop .22s ease; }
  @keyframes rcPop{ 0%{ transform:scale(.94); } 60%{ transform:scale(1.03); } 100%{ transform:scale(1); } }
  .rc-undobar{ position:sticky; bottom:calc(var(--safe-bottom) + 8px); margin-top:18px; z-index:5; }
  .rc-undo{ width:100%; padding:14px; border-radius:16px; border:1px solid var(--border); font:inherit; font-size:15px; font-weight:650; color:var(--text);
    background:var(--surface); box-shadow:0 8px 22px rgba(0,0,0,.14); }
  .rc-undo:active{ transform:scale(.985); }
  .rc-undo.off{ color:var(--text-secondary); font-weight:500; }
  `;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  window.buildRecord = function buildRecord() {
    const wrap = document.createElement("div");
    wrap.className = "rc-wrap";
    let off = 0;
    let day = new Date().getDay();

    wrap.innerHTML = `
      <div class="rc-week">
        <button class="rc-arrow" data-w="-1" aria-label="Semana anterior">‹</button>
        <div class="rc-weeklabel"><strong class="rc-lbl"></strong><span class="rc-sub"></span></div>
        <button class="rc-arrow rc-next" data-w="1" aria-label="Semana siguiente">›</button>
      </div>
      <div class="rc-stats">
        <div class="rc-stat main"><small>Puntos de la semana</small><b class="rc-tot">0</b></div>
        <div class="rc-stat"><small class="rc-daylbl">Hoy</small><b class="rc-day-tot">0</b></div>
      </div>
      <div class="rc-days"></div>
      ${CATS.map(c => `<div class="rc-cat">${c.n}</div><div class="rc-grid">${c.it.map(x =>
        `<button class="rc-tile" data-i="${x[0]}"><span class="rc-n">${x[1]}</span><span class="rc-p">+${x[2]} pts</span><span class="rc-c"></span></button>`
      ).join("")}</div>`).join("")}
      <div class="rc-undobar"><button class="rc-undo off">Nada que deshacer</button></div>`;

    const $ = s => wrap.querySelector(s);
    const lbl = $(".rc-lbl"), sub = $(".rc-sub"), tot = $(".rc-tot"), dayTot = $(".rc-day-tot"),
          dayLbl = $(".rc-daylbl"), daysEl = $(".rc-days"), nextBtn = $(".rc-next"), undo = $(".rc-undo");
    const tiles = Array.from(wrap.querySelectorAll(".rc-tile"));

    function update() {
      const start = weekStart(off);
      const log = load()[key(start)] || [];
      const per = [0, 0, 0, 0, 0, 0, 0];
      const cnt = {};
      let total = 0;
      log.forEach(e => {
        total += e.p;
        if (per[e.d] !== undefined) per[e.d] += e.p;
        if (e.d === day) cnt[e.i] = (cnt[e.i] || 0) + 1;
      });
      const end = new Date(start); end.setDate(end.getDate() + 6);
      lbl.textContent = fmt(start) + " – " + fmt(end);
      sub.textContent = off === 0 ? "Semana actual" : off === -1 ? "Semana pasada" : "Hace " + (-off) + " semanas";
      nextBtn.style.visibility = off < 0 ? "visible" : "hidden";
      tot.textContent = total;
      dayTot.textContent = per[day];
      dayLbl.textContent = (off === 0 && day === new Date().getDay()) ? "Hoy" : "Puntos del " + DIAS[day];

      const todayIdx = new Date().getDay();
      daysEl.innerHTML = "";
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        const b = document.createElement("button");
        b.className = "rc-day" + (i === day ? " on" : "") + (off === 0 && i === todayIdx ? " today" : "");
        b.dataset.d = i;
        b.innerHTML = `${DIAS[i]}<b>${d.getDate()}</b><i>${per[i] ? per[i] : ""}</i>`;
        daysEl.appendChild(b);
      }

      tiles.forEach(t => {
        const n = cnt[t.dataset.i] || 0;
        t.classList.toggle("has", n > 0);
        t.querySelector(".rc-c").textContent = n;
      });

      if (log.length) {
        const last = log[log.length - 1];
        const nm = ITEMS[last.i] ? ITEMS[last.i].n : last.i;
        undo.textContent = "Deshacer: " + nm + " (−" + last.p + ")";
        undo.classList.remove("off");
      } else {
        undo.textContent = "Nada que deshacer";
        undo.classList.add("off");
      }
    }

    wrap.addEventListener("click", e => {
      const t = e.target.closest(".rc-tile");
      if (t) {
        const it = ITEMS[t.dataset.i];
        if (!it) return;
        const d = load(), k = key(weekStart(off));
        (d[k] = d[k] || []).push({ i: t.dataset.i, d: day, p: it.p, t: Date.now() });
        save(d);
        update();
        t.classList.remove("pop"); void t.offsetWidth; t.classList.add("pop");
        return;
      }
      const dd = e.target.closest("[data-d]");
      if (dd) { day = +dd.dataset.d; update(); return; }
      const w = e.target.closest("[data-w]");
      if (w) {
        off = Math.min(0, off + (+w.dataset.w));
        if (off === 0) day = new Date().getDay();
        update();
        return;
      }
      if (e.target.closest(".rc-undo")) {
        const d = load(), k = key(weekStart(off));
        if (d[k] && d[k].length) {
          d[k].pop();
          if (!d[k].length) delete d[k];
          save(d);
          update();
        }
      }
    });

    update();
    return wrap;
  };
})();
