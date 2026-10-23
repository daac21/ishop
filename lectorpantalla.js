/* =====================================================================
   LECTOR DE PANTALLA VERDE (terminal) — sin internet y sin Tesseract
   Foto de la pantalla verde del sistema → renglones (código + cantidad)
   1) Ubica los renglones por el COLOR verde (ignora marco, etiquetas, reflejos).
   2) Endereza cada renglón y lo parte en celdas de paso fijo (la letra es de ancho fijo).
   3) Cada celda se clasifica con un modelo pequeño entrenado con fotos reales (datos/lector_pantalla.js).
   4) El código se valida con el dígito verificador del UPC y con el catálogo.
   Todo es funciones puras sobre datos RGBA: se puede probar fuera del navegador.
   ===================================================================== */
(function (root) {
"use strict";
const CW = 12, CH = 20, VEC = CW * CH;
const H_OBJ = 18;   // altura típica de letra (px) a la que se normaliza la foto

/* ---------- Morfología básica ---------- */
function percentil(vals, n, q) {   // vals: Float32Array/Uint8Array de números 0..~300
  const h = new Uint32Array(512); let tot = 0;
  for (let i = 0; i < n; i++) { const v = vals[i]; if (v > 0) { h[Math.min(511, v | 0)]++; tot++; } }
  if (!tot) return 0; let a = 0; const objetivo = tot * q;
  for (let i = 0; i < 512; i++) { a += h[i]; if (a >= objetivo) return i; }
  return 511;
}
/* Verde del texto, relativo a lo brillante que salió la foto (así sirve con poca luz) */
function maskVerde(d, w, h, frac) {
  const n = w * h, a = new Float32Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) a[i] = d[p + 1] - d[p];
  const pA = Math.max(20, percentil(a, n, 0.995)), m = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const r = d[p], g = d[p + 1], b = d[p + 2];
    if (g - r > frac * pA && g - b > 0.1 * pA && g > 2.2 * pA * frac) m[i] = 1;
  }
  return m;
}
function dilatar(m, w, h, kx, ky) {
  const a = new Uint8Array(w * h), out = new Uint8Array(w * h), cum = new Int32Array(Math.max(w, h) + 1);
  const lx = Math.floor(kx / 2), rx = kx - 1 - lx, ly = Math.floor(ky / 2), ry = ky - 1 - ly;
  for (let y = 0; y < h; y++) {
    cum[0] = 0; for (let x = 0; x < w; x++) cum[x + 1] = cum[x] + m[y * w + x];
    for (let x = 0; x < w; x++) { const x0 = Math.max(0, x - lx), x1 = Math.min(w, x + rx + 1); a[y * w + x] = cum[x1] - cum[x0] > 0 ? 1 : 0; }
  }
  for (let x = 0; x < w; x++) {
    cum[0] = 0; for (let y = 0; y < h; y++) cum[y + 1] = cum[y] + a[y * w + x];
    for (let y = 0; y < h; y++) { const y0 = Math.max(0, y - ly), y1 = Math.min(h, y + ry + 1); out[y * w + x] = cum[y1] - cum[y0] > 0 ? 1 : 0; }
  }
  return out;
}
function erosionar3(m, w, h) {   // cuadrado 3x3 (fuera de la imagen = 0)
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (m[i] && m[i - 1] && m[i + 1] && m[i - w] && m[i + w] && m[i - w - 1] && m[i - w + 1] && m[i + w - 1] && m[i + w + 1]) out[i] = 1;
  }
  return out;
}
function abrir2x1(m, w, h) {   // quita pixeles sueltos de 1 renglón de alto
  const e = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) e[y * w + x] = m[y * w + x] & m[(y + 1) * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = e[y * w + x] | (y > 0 ? e[(y - 1) * w + x] : 0);
  return out;
}
/* Componentes conectadas (4 vecinos) → cajas */
function etiquetar(m, w, h) {
  const lab = new Int32Array(w * h), par = [0];
  const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!m[i]) continue;
    const l = x > 0 ? lab[i - 1] : 0, u = y > 0 ? lab[i - w] : 0;
    if (!l && !u) { n++; par.push(n); lab[i] = n; }
    else if (l && u) { const a = find(l), b = find(u); if (a !== b) par[Math.max(a, b)] = Math.min(a, b); lab[i] = Math.min(a, b); }
    else lab[i] = l || u;
  }
  const map = new Int32Array(n + 1); let k = 0;
  for (let i = 1; i <= n; i++) if (find(i) === i) map[i] = ++k;
  const bx = []; for (let i = 0; i < k; i++) bx.push({ x0: 1e9, y0: 1e9, x1: -1, y1: -1, area: 0 });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, l = lab[i]; if (!l) continue;
    const id = map[find(l)] - 1; lab[i] = id + 1; const b = bx[id];
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
  }
  bx.forEach(b => { b.x1 += 1; b.y1 += 1; b.w = b.x1 - b.x0; b.h = b.y1 - b.y0; });
  return { lab, boxes: bx };
}
const mediana = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* ---------- Geometría: bloques de texto verde ---------- */
function geometria(d, w, h, frac) {
  let m = maskVerde(d, w, h, frac);
  m = abrir2x1(m, w, h);
  let c = dilatar(m, w, h, 3, 3); c = erosionar3(c, w, h);
  const hs = etiquetar(c, w, h).boxes.filter(b => b.h >= 8).map(b => b.h);
  const H = hs.length ? mediana(hs) : 0;
  if (!H) return { H: 0, bloques: [], m };
  const dil = dilatar(m, w, h, Math.max(3, Math.floor(H * 0.9)), 3);
  const { lab, boxes } = etiquetar(dil, w, h);
  for (let i = 0; i < w * h; i++) if (m[i] && lab[i]) boxes[lab[i] - 1].area++;
  return { H, bloques: boxes, m };
}

/* ---------- Imagen en "verdor" (texto brillante, lo demás ≈ 0) ---------- */
function verdor(d, w, h) {
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) { const v = d[p + 1] - 0.45 * (d[p] + d[p + 2]); g[i] = v > 0 ? v : 0; }
  return g;
}

/* ---------- Recorte, enderezado y celdas ---------- */
function preparar(g, gw, gh, b, pad, up) {
  const y0 = Math.max(0, b.y0 - pad), y1 = Math.min(gh, b.y1 + pad), x0 = Math.max(0, b.x0 - pad), x1 = Math.min(gw, b.x1 + pad);
  const cw = x1 - x0, ch = y1 - y0, v = new Float32Array(cw * ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) v[y * cw + x] = g[(y0 + y) * gw + x0 + x];
  const s = Float32Array.from(v).sort(), lo = s[Math.floor(s.length * 0.03)], hi = s[Math.min(s.length - 1, Math.floor(s.length * 0.997))], k = 1 / Math.max(hi - lo, 1);
  for (let i = 0; i < v.length; i++) { const t = (v[i] - lo) * k; v[i] = t < 0 ? 0 : t > 1 ? 1 : t; }
  const W = cw * up, Hh = ch * up, o = new Float32Array(W * Hh);   // ampliación bilineal
  for (let y = 0; y < Hh; y++) {
    const fy = (y + 0.5) / up - 0.5, y0i = Math.max(0, Math.min(ch - 1, Math.floor(fy))), y1i = Math.min(ch - 1, y0i + 1), ty = Math.max(0, fy - y0i);
    for (let x = 0; x < W; x++) {
      const fx = (x + 0.5) / up - 0.5, x0i = Math.max(0, Math.min(cw - 1, Math.floor(fx))), x1i = Math.min(cw - 1, x0i + 1), tx = Math.max(0, fx - x0i);
      o[y * W + x] = (v[y0i * cw + x0i] * (1 - tx) + v[y0i * cw + x1i] * tx) * (1 - ty) + (v[y1i * cw + x0i] * (1 - tx) + v[y1i * cw + x1i] * tx) * ty;
    }
  }
  return { c: o, W, H: Hh, ox: x0, oy: y0 };
}
function mejorAngulo(c, W, H) {
  const xs = [], ys = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (c[y * W + x] > 0.45) { xs.push(x); ys.push(y); }
  const cx = W / 2, cy = H / 2, hist = new Float64Array(H + 2);
  const sc = a => {
    const t = a * Math.PI / 180, co = Math.cos(t), si = Math.sin(t); hist.fill(0);
    for (let i = 0; i < xs.length; i++) { const yy = Math.round((ys[i] - cy) * co + (xs[i] - cx) * si + cy); if (yy >= 0 && yy < H) hist[yy]++; }
    let s = 0; for (let i = 0; i < H; i++) s += hist[i] * hist[i]; return s;
  };
  let best = -1, a0 = 0; for (let a = -14; a <= 14.001; a += 1) { const s = sc(a); if (s > best) { best = s; a0 = a; } }
  let a1 = a0; best = -1; for (let a = a0 - 1; a <= a0 + 1.001; a += 0.25) { const s = sc(a); if (s > best) { best = s; a1 = a; } }
  return a1;
}
function rotar(c, W, H, ang) {
  const t = ang * Math.PI / 180, co = Math.cos(t), si = Math.sin(t), cx = W / 2, cy = H / 2, o = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = (x - cx) * co + (y - cy) * si + cx, sy = -(x - cx) * si + (y - cy) * co + cy;
    if (sx < 0 || sy < 0 || sx > W - 1 || sy > H - 1) continue;
    const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), tx = sx - x0, ty = sy - y0;
    o[y * W + x] = (c[y0 * W + x0] * (1 - tx) + c[y0 * W + x1] * tx) * (1 - ty) + (c[y1 * W + x0] * (1 - tx) + c[y1 * W + x1] * tx) * ty;
  }
  return o;
}
/* Banda de texto principal (renglón con más tinta) y perfil de columnas */
function banda(r, W, H) {
  const pr = new Float64Array(H); let mx = 0, k0 = 0;
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) if (r[y * W + x] > 0.45) s++; pr[y] = s; if (s > mx) { mx = s; k0 = y; } }
  const thr = 0.15 * mx; let ya = k0, yb = k0 + 1;
  while (ya > 0 && pr[ya - 1] > thr) ya--; while (yb < H && pr[yb] > thr) yb++;
  const prof = new Float64Array(W); for (let y = ya; y < yb; y++) for (let x = 0; x < W; x++) if (r[y * W + x] > 0.45) prof[x]++;
  return { ya, yb, prof };
}
function celda(r, W, ya, yb, cx0, cx1) {   // promedio por áreas → CW x CH
  const out = new Float32Array(VEC), sw = cx1 - cx0, sh = yb - ya;
  for (let j = 0; j < CH; j++) {
    const y0 = ya + Math.floor(j * sh / CH), y1 = Math.max(y0 + 1, ya + Math.ceil((j + 1) * sh / CH));
    for (let i = 0; i < CW; i++) {
      const x0 = cx0 + Math.floor(i * sw / CW), x1 = Math.max(x0 + 1, cx0 + Math.ceil((i + 1) * sw / CW));
      let s = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += r[y * W + x]; n++; }
      out[j * CW + i] = n ? s / n : 0;
    }
  }
  return out;
}
/* Código de 12 dígitos: paso fijo y desfase que dejan menos tinta en las fronteras */
function celdasCodigo(g, gw, gh, b) {
  const UP = 3, P = preparar(g, gw, gh, b, 4, UP), ang = mejorAngulo(P.c, P.W, P.H), r = rotar(P.c, P.W, P.H, ang);
  const { ya, yb, prof } = banda(r, P.W, P.H);
  let xa = -1, xb = -1; for (let x = 0; x < P.W; x++) if (prof[x] >= 2) { if (xa < 0) xa = x; xb = x + 1; }
  if (xa < 0 || yb - ya < 6) return null;
  const n = 12, p0 = (xb - xa) / (n - 0.1);
  let best = 1e18, bp = p0, bo = xa;
  for (let p = 0.92 * p0; p < 1.08 * p0; p += p0 * 0.004) for (let off = xa - 0.15 * p0; off < xa + 0.15 * p0; off += 1) {
    let s = 0; for (let i = 0; i <= n; i++) { const x = Math.round(off + i * p); if (x >= 0 && x < P.W) for (let q = Math.max(0, x - 1); q <= Math.min(P.W - 1, x + 1); q++) s += prof[q]; }
    if (s < best) { best = s; bp = p; bo = off; }
  }
  const celdas = [];
  for (let i = 0; i < n; i++) { const cx0 = Math.max(0, Math.round(bo + i * bp)); let cx1 = Math.min(P.W, Math.round(bo + (i + 1) * bp)); if (cx1 < cx0 + 3) cx1 = Math.min(P.W, cx0 + 3); celdas.push(celda(r, P.W, ya, yb, cx0, cx1)); }
  return { celdas, angulo: ang, paso: bp / UP, ancho: (xb - xa) / UP };
}
/* Cantidad "N.00" alineada a la derecha: se miden celdas desde la derecha; devuelve solo los dígitos enteros */
function celdasCantidad(g, gw, gh, b, pasoHint, ang) {
  const UP = 3, P = preparar(g, gw, gh, b, 4, UP), r = rotar(P.c, P.W, P.H, ang);
  const { ya, yb, prof } = banda(r, P.W, P.H);
  let xb = -1; for (let x = 0; x < P.W; x++) if (prof[x] >= 2) xb = x + 1;
  if (xb < 0 || yb - ya < 6) return null;
  const ph = pasoHint * UP; let best = 1e18, bp = ph, be = 0;
  for (let p = 0.88 * ph; p < 1.12 * ph; p += ph * 0.004) for (let e = -0.2 * ph; e < 0.2 * ph; e += 1) {
    let s = 0; for (let j = 0; j < 4; j++) { const x = Math.round(xb + e - j * p); if (x >= 0 && x < P.W) for (let q = Math.max(0, x - 1); q <= Math.min(P.W - 1, x + 1); q++) s += prof[q]; }
    if (s < best) { best = s; bp = p; be = e; }
  }
  const xe = xb + be, celdas = [];
  for (let j = 3; j < 7; j++) {
    const cx1 = Math.round(xe - j * bp), cx0 = Math.round(xe - (j + 1) * bp); if (cx0 < 0 || cx1 <= cx0) break;
    let tinta = 0; for (let y = ya; y < yb; y++) for (let x = cx0; x < cx1; x++) if (r[y * P.W + x] > 0.45) tinta++;
    if (tinta / ((yb - ya) * (cx1 - cx0)) < 0.06) break;
    celdas.push(celda(r, P.W, ya, yb, cx0, cx1));
  }
  celdas.reverse();
  return celdas.length ? celdas : null;
}

/* ---------- Pareo código ↔ cantidad (la perspectiva hace que no queden a la misma altura) ---------- */
function ajusteLineal(xs, ys) {
  const n = xs.length; if (n < 2) return [0, ys.length ? ys[0] : 0];
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0; for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) * (xs[i] - mx); sxy += (xs[i] - mx) * (ys[i] - my); }
  const a = sxx ? sxy / sxx : 0; return [a, my - a * mx];
}
function parear(codigos, cants) {
  const cy = codigos.map(b => (b.y0 + b.y1) / 2), qy = cants.map(b => (b.y0 + b.y1) / 2), n = Math.min(cy.length, qy.length);
  const pr = new Array(cy.length).fill(null); if (!n) return pr;
  let idx = []; for (let i = 0; i < n; i++) idx.push([i, i]);
  const pasoMed = cy.length > 1 ? mediana(cy.slice(1).map((v, i) => v - cy[i])) : 30;
  for (let it = 0; it < 3; it++) {
    const [a, b0] = ajusteLineal(idx.map(p => cy[p[0]]), idx.map(p => qy[p[1]] - cy[p[0]]));
    idx = [];
    for (let i = 0; i < cy.length; i++) {
      const pred = cy[i] + a * cy[i] + b0; let bj = -1, bd = 1e9;
      for (let j = 0; j < qy.length; j++) { const dd = Math.abs(qy[j] - pred); if (dd < bd) { bd = dd; bj = j; } }
      if (bd < 0.45 * pasoMed) { pr[i] = bj; idx.push([i, bj]); } else pr[i] = null;
    }
    if (idx.length < 2) break;
  }
  return pr;
}

/* ---------- Enderezar toda la foto (los renglones salen ladeados) ---------- */
function anguloGlobal(d, w, h) {
  const m = maskVerde(d, w, h, 0.25), xs = [], ys = [];
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (m[y * w + x]) { xs.push(x); ys.push(y); }
  if (xs.length < 500) return 0;
  const cx = w / 2, cy = h / 2, N = h * 2, hist = new Float64Array(N);
  const sc = a => {
    const t = a * Math.PI / 180, co = Math.cos(t), si = Math.sin(t); hist.fill(0);
    for (let i = 0; i < xs.length; i++) { const yy = Math.round((ys[i] - cy) * co + (xs[i] - cx) * si + cy + h / 2); if (yy >= 0 && yy < N) hist[yy]++; }
    let s = 0; for (let i = 0; i < N; i++) s += hist[i] * hist[i]; return s;
  };
  let best = -1, a0 = 0; for (let a = -20; a <= 20.001; a += 1) { const s = sc(a); if (s > best) { best = s; a0 = a; } }
  let a1 = a0; best = -1; for (let a = a0 - 1; a <= a0 + 1.001; a += 0.25) { const s = sc(a); if (s > best) { best = s; a1 = a; } }
  return a1;
}
function rotarRGBA(d, w, h, ang) {
  const t = ang * Math.PI / 180, co = Math.cos(t), si = Math.sin(t), cx = w / 2, cy = h / 2, o = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = (x - cx) * co + (y - cy) * si + cx, sy = -(x - cx) * si + (y - cy) * co + cy, q = (y * w + x) * 4; o[q + 3] = 255;
    if (sx < 0 || sy < 0 || sx > w - 1 || sy > h - 1) continue;
    const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), tx = sx - x0, ty = sy - y0;
    for (let c = 0; c < 3; c++) o[q + c] = (d[(y0 * w + x0) * 4 + c] * (1 - tx) + d[(y0 * w + x1) * 4 + c] * tx) * (1 - ty) + (d[(y1 * w + x0) * 4 + c] * (1 - tx) + d[(y1 * w + x1) * 4 + c] * tx) * ty;
  }
  return o;
}

/* ---------- Detección completa: RGBA → renglones con sus celdas ---------- */
function buscarFilas(d, w, h, frac) {
  const geo = geometria(d, w, h, frac), H = geo.H; if (!H) return null;
  const esc = (H / H_OBJ) * (H / H_OBJ);
  const codigos = geo.bloques.filter(b => b.h >= 0.6 * H && b.w >= 7.5 * H && b.w <= 14 * H && b.area > 800 * esc && b.area / (b.w * b.h) < 0.5).sort((a, b) => a.y0 - b.y0);
  if (codigos.length < 3) return null;
  const xCod = mediana(codigos.map(b => b.x1));
  // cantidades: se juntan los pedazos de un mismo renglón (una letra tenue puede quedar partida)
  const trozos = geo.bloques.filter(b => b.h >= 0.35 * H && b.x0 > xCod && b.y0 > codigos[0].y0 - 0.9 * H && b.area > 20 * esc).sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1));
  const grupos = [];
  trozos.forEach(b => {
    const cy = (b.y0 + b.y1) / 2, g = grupos[grupos.length - 1];
    if (g && cy - g.cy < 0.55 * H) { g.x0 = Math.min(g.x0, b.x0); g.x1 = Math.max(g.x1, b.x1); g.y0 = Math.min(g.y0, b.y0); g.y1 = Math.max(g.y1, b.y1); g.area += b.area; g.n++; g.cy = (g.y0 + g.y1) / 2; }
    else grupos.push({ x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, area: b.area, n: 1, cy });
  });
  const cants = grupos.map(g => ({ ...g, w: g.x1 - g.x0, h: g.y1 - g.y0 })).filter(b => b.h >= 0.6 * H && b.w >= 2 * H && b.w <= 6.8 * H && b.area > 250 * esc).sort((a, b) => a.y0 - b.y0);
  return { H, codigos, cants };
}
function extraer(d0, w, h) {
  const ang = anguloGlobal(d0, w, h), d = Math.abs(ang) > 0.4 ? rotarRGBA(d0, w, h, ang) : d0;
  let mejor = null, mf = 0;
  for (const frac of [0.18, 0.25, 0.35]) { const r = buscarFilas(d, w, h, frac); if (r && (!mejor || r.codigos.length > mejor.codigos.length)) { mejor = r; mf = frac; } }
  if (!mejor) return null;
  const g = verdor(d, w, h), { H, codigos, cants } = mejor, pr = parear(codigos, cants), filas = [];
  codigos.forEach((b, i) => {
    const c = celdasCodigo(g, w, h, b); if (!c) return;
    let q = null; if (pr[i] != null) q = celdasCantidad(g, w, h, cants[pr[i]], c.paso, c.angulo);
    const qb = pr[i] != null ? cants[pr[i]] : null;
    filas.push({ caja: { x: b.x0, y: b.y0, w: b.w, h: b.h }, cajaCant: qb ? { x: qb.x0, y: qb.y0, w: qb.w, h: qb.h } : null, celdas: c.celdas, cant: q, angulo: c.angulo });
  });
  return filas.length >= 3 ? { filas, H, anguloFoto: ang, umbral: mf, imagen: d, ancho: w, alto: h } : null;
}

/* ---------- Modelo (MLP + regresión logística) ---------- */
function normVec(v) { let m = 0; for (let i = 0; i < v.length; i++) m += v[i]; m /= v.length; const o = new Float32Array(v.length); let s = 0; for (let i = 0; i < v.length; i++) { o[i] = v[i] - m; s += o[i] * o[i]; } s = Math.sqrt(s) + 1e-6; for (let i = 0; i < v.length; i++) o[i] /= s; return o; }
function softmax(z) { let m = -1e30; for (const v of z) if (v > m) m = v; const e = z.map(v => Math.exp(v - m)); let s = 0; e.forEach(v => s += v); return e.map(v => v / s); }
function probaCelda(M, v) {
  const x = normVec(v), out = new Array(10).fill(0);
  { // regresión logística: W[10][240]
    const z = []; for (let c = 0; c < 10; c++) { let s = M.lr.b[c]; const w = M.lr.W[c]; for (let i = 0; i < VEC; i++) s += w[i] * x[i]; z.push(s); }
    softmax(z).forEach((p, c) => out[c] += 0.5 * p);
  }
  { // MLPs: W1[240][H], b1[H], W2[H][10], b2[10] (se promedian)
    const mm = M.mlps, pesoM = 0.5 / mm.length;
    mm.forEach(N => {
      const Hn = N.b1.length, hid = new Float32Array(Hn);
      for (let j = 0; j < Hn; j++) { let s = N.b1[j]; for (let i = 0; i < VEC; i++) s += x[i] * N.W1[i][j]; hid[j] = s > 0 ? s : 0; }
      const z = []; for (let c = 0; c < 10; c++) { let s = N.b2[c]; for (let j = 0; j < Hn; j++) s += hid[j] * N.W2[j][c]; z.push(s); }
      softmax(z).forEach((p, c) => out[c] += pesoM * p);
    });
  }
  return out;
}

/* ---------- Decodificar un código con dígito verificador y catálogo ---------- */
function upcOk(c) {
  if (!/^\d{12}$/.test(c)) return false;
  let s = 0; for (let i = 0; i < 11; i++) s += (+c[i]) * (i % 2 === 0 ? 3 : 1);
  return (10 - s % 10) % 10 === +c[11];
}
function decodificar(P, cat) {   // P: 12 x 10 probabilidades
  const L = P.map(r => r.map(p => Math.log(p + 1e-6))), top = L.map(r => r.indexOf(Math.max(...r))).join("");
  const mejorL = L.map(r => Math.max(...r));
  const costo = c => { let s = 0; for (let i = 0; i < 12; i++) s += mejorL[i] - L[i][+c[i]]; return s; };
  const conf = Math.min(...P.map(r => Math.max(...r)));
  if (upcOk(top)) return { code: top, estado: "ok", conf, margen: 9 };
  const cand = new Map(), poner = (c, v) => { if (!cand.has(c) || cand.get(c) > v) cand.set(c, v); };
  for (const q in cat) { let d = 0; for (let i = 0; i < 12 && d < 4; i++) if (q[i] !== top[i]) d++; if (d <= 3) poner(q, costo(q) - 1); }
  for (let i = 0; i < 12; i++) for (let dg = 0; dg < 10; dg++) { if (String(dg) === top[i]) continue; const c = top.slice(0, i) + dg + top.slice(i + 1); if (upcOk(c)) poner(c, costo(c)); }
  const dudosas = L.map((r, i) => { const s = r.slice().sort((a, b) => b - a); return [i, s[0] - s[1]]; }).sort((a, b) => a[1] - b[1]).slice(0, 5).map(x => x[0]);
  for (let a = 0; a < dudosas.length; a++) for (let b = a + 1; b < dudosas.length; b++) {
    const i = dudosas[a], j = dudosas[b];
    for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) {
      if (String(x) === top[i] || String(y) === top[j]) continue;
      const t = top.split(""); t[i] = x; t[j] = y; const c = t.join("");
      if (cat[c] && upcOk(c)) poner(c, costo(c));
    }
  }
  if (!cand.size) return { code: top, estado: "ilegible", conf, margen: 0 };
  const o = [...cand.entries()].sort((a, b) => a[1] - b[1]);
  return { code: o[0][0], estado: "corregido", conf, margen: o.length > 1 ? o[1][1] - o[0][1] : 9 };
}
function decodificarCantidad(P) {   // P: n x 10
  const dig = P.map(r => r.indexOf(Math.max(...r))), conf = Math.min(...P.map(r => Math.max(...r)));
  const qty = parseInt(dig.join(""), 10);
  // alternativa: se cambia el dígito más dudoso por su segunda opción
  let alt = null, pe = 1e9, pi = -1;
  P.forEach((r, i) => { const s = r.slice().sort((a, b) => b - a); if (s[0] - s[1] < pe) { pe = s[0] - s[1]; pi = i; } });
  if (pi >= 0) { const r = P[pi], s2 = r.map((p, c) => [p, c]).sort((a, b) => b[0] - a[0])[1][1], d2 = dig.slice(); d2[pi] = s2; alt = parseInt(d2.join(""), 10); }
  return { qty, conf, alt };
}

/* ---------- Todo junto: RGBA → [{ raw, qty, share, alt, dudoso, ... }] ---------- */
function leer(d, w, h, modelo, cat) {
  const ex = extraer(d, w, h); if (!ex) return null;
  const filas = ex.filas.map(f => {
    const rc = decodificar(f.celdas.map(v => probaCelda(modelo, v)), cat);
    let q = null; if (f.cant) q = decodificarCantidad(f.cant.map(v => probaCelda(modelo, v)));
    return { raw: rc.code, estadoCodigo: rc.estado, confCodigo: rc.conf, margenCodigo: rc.margen, qty: q ? q.qty : null, confQty: q ? q.conf : 0, alt: q ? q.alt : null, caja: f.caja, cajaCant: f.cajaCant };
  });
  return { filas, H: ex.H, imagen: ex.imagen, ancho: ex.ancho, alto: ex.alto };
}

root.LectorPantalla = { _geo: geometria, _rot: rotarRGBA, _ang: anguloGlobal, extraer, leer, probaCelda, decodificar, decodificarCantidad, upcOk, CW, CH, VEC, H_OBJ };
})(typeof window !== "undefined" ? window : globalThis);
