/* Browser-only numerical routines. No model service or external dependencies. */
(function (g) {
  'use strict';
  const C = { orange: '#d75736', green: '#297764', blue: '#507e9a', gold: '#bf913b', purple: '#8d7599', ink: '#203e3a', muted: '#79857f', line: '#e1e6dd', pale: '#f3f5ee' };
  function rng(seed = 13) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function normal(r) { return Math.sqrt(-2 * Math.log(Math.max(1e-10, r()))) * Math.cos(2 * Math.PI * r()); }
  const sum = a => a.reduce((s, v) => s + v, 0);
  const mean = a => sum(a) / (a.length || 1);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const quantile = (a, p) => { const b = a.slice().sort((x, y) => x - y); const i = clamp((b.length - 1) * p, 0, b.length - 1); const l = Math.floor(i); return b[l] + (b[Math.ceil(i)] - b[l]) * (i - l); };
  const rmse = (a, b) => Math.sqrt(mean(a.map((v, i) => (v - b[i]) ** 2)));
  const mae = (a, b) => mean(a.map((v, i) => Math.abs(v - b[i])));
  function solve(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      [M[k], M[p]] = [M[p], M[k]];
      if (Math.abs(M[k][k]) < 1e-12) throw new Error('矩阵不可逆，请增加样本或正则项');
      const z = M[k][k];
      for (let j = k; j <= n; j++) M[k][j] /= z;
      for (let i = 0; i < n; i++) if (i !== k) { const f = M[i][k]; for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j]; }
    }
    return M.map(r => r[n]);
  }
  function scaler(X) {
    const mu = X[0].map((_, j) => mean(X.map(r => r[j])));
    const sd = mu.map((m, j) => Math.sqrt(mean(X.map(r => (r[j] - m) ** 2))) || 1);
    return { mu, sd, transform: x => x.map((v, j) => (v - mu[j]) / sd[j]) };
  }
  function polynomial(x, degree) {
    const f = [1, ...x];
    if (degree === 2) for (let i = 0; i < x.length; i++) for (let j = i; j < x.length; j++) f.push(x[i] * x[j]);
    return f;
  }
  function ridge(X, y, lambda = 0.15, degree = 1) {
    const sc = scaler(X), F = X.map(x => polynomial(sc.transform(x), degree)), d = F[0].length;
    const A = Array.from({ length: d }, () => Array(d).fill(0)), b = Array(d).fill(0);
    F.forEach((f, i) => { for (let j = 0; j < d; j++) { b[j] += f[j] * y[i]; for (let k = 0; k < d; k++) A[j][k] += f[j] * f[k]; } });
    for (let j = 1; j < d; j++) A[j][j] += lambda;
    const weights = solve(A, b);
    return { weights, scaler: sc, predict: x => sum(polynomial(sc.transform(x), degree).map((v, j) => v * weights[j])), contributions: x => polynomial(sc.transform(x), degree).map((v, j) => v * weights[j]) };
  }
  function knn(X, Y) {
    const sc = scaler(X), Z = X.map(sc.transform);
    function neighbors(x, k) { const z = sc.transform(x); return Z.map((r, i) => ({ i, d: Math.sqrt(sum(r.map((v, j) => (v - z[j]) ** 2))) })).sort((a, b) => a.d - b.d).slice(0, k); }
    return { neighbors, predict(x, k = 7) { const ns = neighbors(x, k); if (ns[0].d < 1e-8) return Y[ns[0].i].slice(); const ws = ns.map(n => 1 / Math.max(n.d, 1e-6)); return Y[0].map((_, j) => sum(ns.map((n, i) => Y[n.i][j] * ws[i])) / sum(ws)); } };
  }
  function gaussian(X) {
    const sc = scaler(X), Z = X.map(sc.transform), d = Z[0].length;
    const cov = Array.from({ length: d }, (_, j) => Array.from({ length: d }, (_, k) => mean(Z.map(r => r[j] * r[k])) + (j === k ? 0.04 : 0)));
    const inv = Array.from({ length: d }, (_, j) => solve(cov, Array.from({ length: d }, (_, k) => j === k ? 1 : 0)));
    return { scaler: sc, score(x) { const z = sc.transform(x); return Math.max(0, sum(z.map((v, i) => v * sum(inv[i].map((w, j) => w * z[j]))))); }, z: sc.transform };
  }
  function isolationForest(X, trees = 80, sampleSize = 96, seed = 7) {
    const r = rng(seed), size = Math.min(X.length, sampleSize), limit = Math.ceil(Math.log2(size));
    const c = n => n <= 1 ? 0 : n === 2 ? 1 : 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
    function tree(rows, depth) {
      if (rows.length < 2 || depth >= limit) return { n: rows.length };
      const dims = Array.from({ length: rows[0].length }, (_, j) => ({ j, lo: Math.min(...rows.map(x => x[j])), hi: Math.max(...rows.map(x => x[j])) })).filter(d => d.hi - d.lo > 1e-10);
      if (!dims.length) return { n: rows.length };
      const f = dims[Math.floor(r() * dims.length)], p = f.lo + r() * (f.hi - f.lo);
      const L = rows.filter(x => x[f.j] < p), R = rows.filter(x => x[f.j] >= p);
      if (!L.length || !R.length) return { n: rows.length };
      return { j: f.j, p, l: tree(L, depth + 1), r: tree(R, depth + 1) };
    }
    function path(t, x, h = 0) { return t.n !== undefined ? h + c(t.n) : path(x[t.j] < t.p ? t.l : t.r, x, h + 1); }
    const forest = Array.from({ length: trees }, () => {
      const ids = Array.from({ length: X.length }, (_, i) => i);
      for (let i = 0; i < size; i++) { const j = i + Math.floor(r() * (ids.length - i)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
      return tree(ids.slice(0, size).map(i => X[i]), 0);
    });
    return { score: x => 2 ** (-mean(forest.map(t => path(t, x))) / c(size)), pathLengths: x => forest.map(t => path(t, x)), trees, sampleSize: size };
  }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function svg(inner, w = 680, h = 290, label = '数据图表') { return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`; }
  const text = (x, y, s, opts = '') => `<text x="${x}" y="${y}" fill="${C.muted}" font-size="11" font-family="Segoe UI,Microsoft YaHei,sans-serif" ${opts}>${esc(s)}</text>`;
  function chartWidth() {
    const box = g.document && typeof g.document.querySelector === 'function' && g.document.querySelector('.main .chart-box');
    const width = box && box.clientWidth > 0 ? box.clientWidth - 38 : typeof g.innerWidth === 'number' ? g.innerWidth - 84 : 680;
    return clamp(width, 260, 680);
  }
  function lineChart(series, opt = {}) {
    const w = opt.w || chartWidth(), h = opt.h || 260, L = 49, R = 16, T = 22, B = 36, pw = w - L - R, ph = h - T - B;
    const vals = series.flatMap(s => s.values.filter(v => v !== null && Number.isFinite(v)));
    if (!vals.length) return svg(text(30, 50, '暂无数据'), w, h);
    let lo = opt.lo ?? Math.min(...vals), hi = opt.hi ?? Math.max(...vals);
    if (lo === hi) { lo -= 1; hi += 1; }
    if (opt.lo === undefined) lo -= (hi - lo) * .1;
    if (opt.hi === undefined) hi += (hi - lo) * .1;
    const N = Math.max(...series.map(s => s.values.length)), x = i => L + i / Math.max(1, N - 1) * pw, y = v => T + (hi - v) / (hi - lo) * ph;
    let out = '';
    if (opt.band) { const [a, b] = opt.band; out += `<rect x="${L}" y="${y(b)}" width="${pw}" height="${y(a) - y(b)}" fill="${C.green}" opacity=".06"/>`; }
    for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4, yy = y(v); out += `<path d="M${L} ${yy}H${w - R}" stroke="${C.line}" stroke-dasharray="3 4"/>` + text(L - 10, yy + 4, v.toFixed(opt.decimals ?? (hi - lo < 5 ? 1 : 0)), 'text-anchor="end"'); }
    for (let i = 0; i <= 4; i++) { const n = Math.round(i / 4 * (N - 1)); out += text(x(n), h - 11, opt.xLabel ? opt.xLabel(n) : n, 'text-anchor="middle"'); }
    if (opt.interval) { const { low, high } = opt.interval; out += `<path d="${high.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')} ${low.map((v, i) => [i, v]).reverse().map(([i, v]) => `L${x(i)} ${y(v)}`).join(' ')}Z" fill="${C.green}" opacity=".10"/>`; }
    (opt.thresholds || []).forEach(t => { out += `<path d="M${L} ${y(t.value)}H${w - R}" stroke="${t.color || C.orange}" stroke-width="1.2" stroke-dasharray="6 4"/>` + text(w - R - 2, y(t.value) - 6, t.label, 'text-anchor="end"'); });
    series.forEach(s => {
      if (s.dots) out += s.values.map((v, i) => v === null || !Number.isFinite(v) ? '' : `<circle cx="${x(i)}" cy="${y(v)}" r="3.4" fill="${s.color}" stroke="white" stroke-width="1.4"><title>${esc(s.name)} ${i}: ${v.toFixed(2)}</title></circle>`).join('');
      else { let gap = true; const d = s.values.map((v, i) => { if (v === null || !Number.isFinite(v)) { gap = true; return ''; } const out = `${gap ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`; gap = false; return out; }).join(' '); out += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.2}" ${s.dashed ? 'stroke-dasharray="5 4"' : ''} stroke-linejoin="round"/>`; }
    });
    if (opt.cursor !== undefined) out += `<path d="M${x(opt.cursor)} ${T}V${h - B}" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 3"/><circle cx="${x(opt.cursor)}" cy="${h - B}" r="3" fill="${C.ink}"/>`;
    out += text(L, 12, opt.unit || '', 'font-size="10"');
    return svg(out, w, h, opt.label || series.map(s => s.name).join('、'));
  }
  function scatter(points, opt = {}) {
    const w = opt.w || chartWidth(), h = opt.h || 260, L = 50, R = 18, T = 20, B = 38;
    const xmin = opt.xmin ?? Math.min(...points.map(p => p.x)), xmax = opt.xmax ?? Math.max(...points.map(p => p.x));
    const ymin = opt.ymin ?? Math.min(...points.map(p => p.y)), ymax = opt.ymax ?? Math.max(...points.map(p => p.y));
    const x = v => L + (v - xmin) / (xmax - xmin || 1) * (w - L - R), y = v => T + (ymax - v) / (ymax - ymin || 1) * (h - T - B);
    let out = '';
    for (let i = 0; i <= 4; i++) { const xx = xmin + (xmax - xmin) * i / 4, yy = ymin + (ymax - ymin) * i / 4; out += `<path d="M${L} ${y(yy)}H${w - R}M${x(xx)} ${T}V${h - B}" stroke="${C.line}" stroke-dasharray="3 4"/>` + text(L - 8, y(yy) + 4, yy.toFixed(opt.ydp ?? 0), 'text-anchor="end"') + text(x(xx), h - 15, xx.toFixed(opt.xdp ?? 0), 'text-anchor="middle"'); }
    if (opt.diagonal) out += `<path d="M${x(xmin)} ${y(xmin)}L${x(xmax)} ${y(xmax)}" stroke="${C.muted}" stroke-dasharray="4 4"/>`;
    points.forEach(p => { out += `<circle ${p.key === undefined ? '' : `data-point="${esc(p.key)}" style="cursor:pointer"`} cx="${x(p.x)}" cy="${y(p.y)}" r="${p.r || 3}" fill="${p.color || C.green}" opacity="${p.opacity ?? .7}" stroke="${p.outline || 'none'}" stroke-width="1.7">${p.label ? `<title>${esc(p.label)}</title>` : ''}</circle>`; });
    if (opt.target) { const q = opt.target; out += `<path d="M${x(q.x) - 9} ${y(q.y)}H${x(q.x) + 9}M${x(q.x)} ${y(q.y) - 9}V${y(q.y) + 9}" stroke="${C.orange}" stroke-width="2"/><circle cx="${x(q.x)}" cy="${y(q.y)}" r="8" fill="none" stroke="${C.orange}"/>`; }
    out += text(L, 12, opt.ylabel || '') + text(w - R, h - 1, opt.xlabel || '', 'text-anchor="end"');
    return svg(out, w, h, opt.label || `${opt.xlabel}与${opt.ylabel}散点图`);
  }
  function bars(items, opt = {}) {
    const w = opt.w || 680, h = opt.h || items.length * 43 + 25, left = opt.left || 110, right = 66, max = opt.max || Math.max(...items.map(v => Math.abs(v.value))) * 1.15 || 1;
    let out = '';
    const signed = items.some(v => v.value < 0), zero = signed ? left + (w - left - right) / 2 : left, scale = (w - left - right) / max / (signed ? 2 : 1);
    out += `<path d="M${zero} 8V${h - 10}" stroke="${C.line}"/>`;
    items.forEach((a, i) => { const yy = 12 + i * ((h - 25) / items.length), ww = Math.abs(a.value) * scale; out += text(left - 12, yy + 14, a.name, 'text-anchor="end"') + `<rect x="${a.value < 0 ? zero - ww : zero}" y="${yy}" width="${Math.max(1, ww)}" height="21" rx="2" fill="${a.color || C.green}" opacity=".87"/>` + text(a.value < 0 ? zero - ww - 6 : zero + ww + 6, yy + 15, `${a.value.toFixed(opt.dp ?? 1)}${opt.unit || ''}`, a.value < 0 ? 'text-anchor="end"' : ''); });
    return svg(out, w, h, opt.label || '数值对比');
  }
  function legend(items) { return `<div class="legend">${items.map(a => `<span><i style="--lc:${a.color}"></i>${esc(a.name)}</span>`).join('')}</div>`; }
  function metric(label, value, unit = '', note = '', accent = '') { return `<div class="metric ${accent}"><span>${esc(label)}</span><strong>${esc(value)}<small>${esc(unit)}</small></strong><p>${esc(note)}</p></div>`; }
  function control(id, label, min, max, step, value, unit = '', note = '') { return `<label class="control" for="${id}"><span>${esc(label)}<output id="${id}-value">${value}${unit}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${esc(unit)}"><small>${esc(note || `${min} — ${max} ${unit}`)}</small></label>`; }
  function bindControls(ids, fn) {
    ids.forEach(id => document.getElementById(id).addEventListener('input', e => { const o = document.getElementById(id + '-value'); if (o) o.textContent = e.target.value + e.target.dataset.unit; fn(); }));
    // srcdoc scripts can run before the iframe has its final width. Redraw once
    // layout settles, then only when the content width changes (not its height).
    if (typeof g.requestAnimationFrame !== 'function') return;
    let width = -1, scheduled = false;
    const redraw = () => { if (scheduled) return; scheduled = true; g.requestAnimationFrame(() => { scheduled = false; const main = document.querySelector('.main'); if (!main || main.clientWidth <= 0) return; const next = main.clientWidth; if (Math.abs(next - width) > 1) { width = next; fn(); } }); };
    const main = document.querySelector('.main'), observer = main && g.ResizeObserver ? new g.ResizeObserver(redraw) : null;
    if (observer) observer.observe(main);
    g.addEventListener('resize', redraw);
    g.addEventListener('pagehide', () => { if (observer) observer.disconnect(); g.removeEventListener('resize', redraw); }, { once: true });
    redraw();
  }
  function reset(values, fn) { Object.entries(values).forEach(([id, v]) => { const e = document.getElementById(id); e.value = v; const o = document.getElementById(id + '-value'); if (o) o.textContent = v + (e.dataset.unit || ''); }); fn(); }
  function csv(name, rows) { const body = '\uFEFF' + rows.map(r => r.map(v => { let s = String(v ?? ''); if (/^[=+@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }).join(',')).join('\r\n'); const a = document.createElement('a'), url = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' })); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); }
  function note(msg) { const n = document.getElementById('feedback'); if (n) { n.textContent = msg; n.classList.add('visible'); } }
  g.Lab = { C, rng, normal, sum, mean, clamp, quantile, rmse, mae, solve, scaler, ridge, knn, gaussian, isolationForest, esc, svg, text, chartWidth, lineChart, scatter, bars, legend, metric, control, bindControls, reset, csv, note };
})(globalThis);
