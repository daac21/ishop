/* =====================================================================
   SYNC (Firebase) — conecta Bodega / Existencias entre todos los dispositivos.
   - La app sigue leyendo SIEMPRE de la copia local (localStorage): ver, buscar, cambiar de
     categoría y abrir tarjetas NO cuenta como lectura de Firebase.
   - Solo se escribe cuando bodegaSave() guarda un cambio real (vendido, deshacer, actualización de Bodega).
   - Un solo oyente por dispositivo; Firebase le avisa únicamente cuando alguien más cambió algo.
   - Si Firebase no carga (sin internet la primera vez), la app funciona como antes.
   ===================================================================== */
const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
const CFG = {
  apiKey: "AIzaSyCtv8d8gAv8YNdtAtxo8E2aQZhCduNmJcg",
  authDomain: "ishop-tools.firebaseapp.com",
  projectId: "ishop-tools",
  storageBucket: "ishop-tools.firebasestorage.app",
  messagingSenderId: "938510294787",
  appId: "1:938510294787:web:516ae817ca9a59be691336"
};
const KEY = "ishop_bodega_v1";          // misma llave que usa bodega.js
const MAX_HIST = 40;

(async function () {
  let F;   // funciones de firestore
  let db, invRef, histCol, remoto = null, listo = false;
  const leer = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.stock) { if (!Array.isArray(d.historial)) d.historial = []; return d; } } catch (_) {} return { stock: {}, fecha: "", ultimoReporte: null, historial: [] }; };
  const guardarLocal = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) {} };
  const aviso = () => { try { window.dispatchEvent(new Event("ishop-remote")); } catch (_) {} };
  const estado = (t) => { window.ishopSyncEstado = t; try { window.dispatchEvent(new Event("ishop-sync-estado")); } catch (_) {} };

  try {
    const [A, Au, Fs] = await Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-firestore.js")]);
    F = Fs;
    const app = A.initializeApp(CFG);
    const auth = Au.getAuth(app);
    db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
    invRef = F.doc(db, "existencias", "bodega");
    histCol = F.collection(db, "historial");
    await new Promise((ok, fail) => { Au.onAuthStateChanged(auth, u => { if (u) ok(); }); Au.signInAnonymously(auth).catch(fail); });
  } catch (e) { console.warn("Sync desactivado:", e); estado("sin sync"); return; }

  /* ---- Inventario: un solo oyente ---- */
  F.onSnapshot(invRef, snap => {
    if (snap.metadata.hasPendingWrites) return;               // eco de mi propio cambio
    if (!snap.exists()) {                                      // primera vez: sube lo que hay en este dispositivo
      const l = leer();
      if (Object.keys(l.stock).length) F.setDoc(invRef, { stock: l.stock, fecha: l.fecha || "", ts: Date.now() }).catch(() => {});
      listo = true; estado("en línea"); return;
    }
    const d = snap.data();
    remoto = { ...(d.stock || {}) };
    const l = leer();
    const igual = JSON.stringify(Object.keys(remoto).sort().map(k => [k, remoto[k]])) === JSON.stringify(Object.keys(l.stock).sort().map(k => [k, l.stock[k]]));
    if (!igual || (d.fecha || "") !== (l.fecha || "")) { guardarLocal({ ...l, stock: { ...remoto }, fecha: d.fecha || l.fecha || "" }); aviso(); }
    listo = true; estado(snap.metadata.fromCache ? "sin conexión" : "en línea");
  }, err => { console.warn(err); estado("sin sync"); });

  /* ---- Historial (ventas, reportes): últimos 40, para "Ventas / Deshacer" en cualquier teléfono ---- */
  F.onSnapshot(F.query(histCol, F.orderBy("ts", "desc"), F.limit(MAX_HIST)), snap => {
    if (snap.metadata.hasPendingWrites) return;
    const rem = snap.docs.map(x => x.data());
    const l = leer();
    const minTs = rem.length >= MAX_HIST ? rem[rem.length - 1].ts : 0;
    const viejos = (l.historial || []).filter(h => h.ts < minTs);   // lo anterior a lo que Firebase guarda
    const nuevo = [...rem, ...viejos].sort((a, b) => b.ts - a.ts).slice(0, 100);
    if (JSON.stringify(nuevo) !== JSON.stringify(l.historial)) { guardarLocal({ ...l, historial: nuevo }); aviso(); }
  }, () => {});

  /* ---- Subir cambios: bodegaSave(prev → d) ---- */
  window.ishopSyncPush = function (prev, d) {
    if (!F || !listo) return;
    const base = remoto || (prev && prev.stock) || {};
    const nuevo = d.stock || {};
    const delta = {};
    new Set([...Object.keys(base), ...Object.keys(nuevo)]).forEach(k => {
      const x = (nuevo[k] || 0) - (base[k] || 0);
      if (x) delta[k] = F.increment(x);              // suma/resta (no pisa lo que hizo otro al mismo tiempo)
    });
    if (Object.keys(delta).length || (d.fecha || "") !== ((prev && prev.fecha) || "")) {
      remoto = { ...nuevo };
      F.setDoc(invRef, { stock: delta, fecha: d.fecha || "", ts: Date.now() }, { merge: true }).catch(e => console.warn(e));
    }
    const ph = (prev && prev.historial) || [], nh = d.historial || [];
    const idsP = new Set(ph.map(h => h.ts)), idsN = new Set(nh.map(h => h.ts));
    nh.forEach(h => {
      if (!idsP.has(h.ts)) F.setDoc(F.doc(histCol, String(h.ts)), h).catch(() => {});                 // entrada nueva
      else { const o = ph.find(x => x.ts === h.ts); if (o && !o.deshecha && h.deshecha) F.setDoc(F.doc(histCol, String(h.ts)), h).catch(() => {}); }   // venta marcada como deshecha
    });
    ph.forEach(h => { if (!idsN.has(h.ts)) F.deleteDoc(F.doc(histCol, String(h.ts))).catch(() => {}); });   // quitada (deshacer inmediato)
  };
})();
