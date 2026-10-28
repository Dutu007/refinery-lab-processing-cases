(function () {
  'use strict';
  const L = Lab, C = L.C, $ = id => document.getElementById(id), r = L.rng(1301);
  const defaults = { temperature: 365, reflux: 2.7, vacuum: 18, density: 870 };
  const ranges = [[340, 390], [1.4, 4], [8, 28], [830, 910]];
  function truth(x) {
    const [u, v, w, d] = [(x[0] - 365) / 25, (x[1] - 2.7) / 1.3, (x[2] - 18) / 10, (x[3] - 870) / 40];
    return [66 + 4 * u + 2 * v - 1.4 * w - 3 * d - 2 * u * u - 1.6 * v * v + .5 * u * v, 1.45 + .18 * u + .13 * v - .09 * w + .09 * u * u + .04 * v * v, 62 - 6 * u + 3 * v + .8 * w + 1.5 * d];
  }
  const data = Array.from({ length: 450 }, () => { const x = ranges.map(([a, b]) => a + r() * (b - a)), y = truth(x).map((v, j) => v + L.normal(r) * [.45, .025, .6][j]); return { x, y }; });
  const train = data.slice(0, 360), test = data.slice(360), models = [0, 1, 2].map(j => L.ridge(train.map(d => d.x), train.map(d => d.y[j]), .2, 2));
  const errors = models.map((m, j) => L.rmse(test.map(d => d.y[j]), test.map(d => m.predict(d.x))));
  const predict = x => models.map(m => m.predict(x)), score = y => y[0] - 11 * y[1], feasible = y => y[2] >= 55 && y[1] <= 1.85;
  document.getElementById('app').innerHTML = `
    <header class="lab-head"><div><div class="lab-no">01 / CDU · VDU</div><h1>收率、能耗和闪点，怎样一起考虑？</h1><p>调整操作条件，查看代理模型的预测，再在约束范围内寻找更好的参数。</p></div><span class="synthetic">教学合成数据</span></header>
    <div class="visual-key" role="note" aria-label="图表阅读提示"><span class="visual-key-title">如何读这页</span><span><i class="vk-dot vk-input"></i>输入 / 工况</span><span><i class="vk-dot vk-model"></i>模型计算</span><span><i class="vk-dot vk-result"></i>结果 / 约束</span></div><div class="lab-layout"><aside class="controls"><h2>操作参数 <span>INPUT</span></h2>
    ${L.control('temperature', '加热炉出口温度', 340, 390, 1, 365, ' °C', '升温有利于汽化，也会增加能耗。')}
    ${L.control('reflux', '回流比', 1.4, 4, .1, 2.7, '', '回流改善分离，需要更多加热和冷却。')}
    ${L.control('vacuum', '减压塔绝对压力', 8, 28, 1, 18, ' kPa', '压力越低，重馏分越容易在较低温度下汽化。')}
    ${L.control('density', '原油密度', 830, 910, 5, 870, ' kg/m³', '原油性质作为当前批次条件，寻优时保持不变。')}
    <button class="action" id="optimize">计算推荐参数 <span>↗</span></button><button class="action secondary" id="reset">恢复初始参数</button><button class="action secondary" id="export">导出当前计算</button>
    <div class="method-box"><b>二次岭回归 + 网格搜索</b>360组训练数据，90组独立测试数据。三个模型分别预测收率、能耗、闪点。<br><code>目标 = 轻馏分收率 − 11 × 能耗</code><br>约束：闪点 ≥ 55 °C；能耗 ≤ 1.85 GJ/t。目标权重仅用于教学。</div></aside>
    <main class="main"><div class="metrics" id="metrics"></div>
    <section class="chart-box"><div class="chart-head"><h2>参数组合与目标值</h2><span>点击色块试一个工况</span></div><div id="heatmap"></div><div class="legend"><span><i style="--lc:#e8eed9"></i>较低目标值</span><span><i style="--lc:#297764"></i>较高目标值</span><span><i style="--lc:#d2d3cd"></i>不满足约束</span><span><i style="--lc:#d75736"></i>当前工况</span></div><p class="chart-note">这张切片固定当前原油密度和减压塔压力。推荐参数会同时搜索炉温、回流比和压力。</p></section>
    <div class="columns"><section class="chart-box"><div class="chart-head"><h2>与初始操作比较</h2><span>轻馏分 / %</span></div><div id="comparison"></div><p class="chart-note" id="constraint-note"></p></section><section class="chart-box"><div class="chart-head"><h2>模型在测试集上的表现</h2><span>90组，未参与拟合</span></div><div id="validation"></div><p class="chart-note" id="validation-note"></p></section></div>
    <div class="model-note"><strong>读图方法：</strong>深绿色不一定能直接使用，先看它是否满足闪点与能耗约束。这里用合成响应生成训练数据，模型从样本拟合关系；输出不是装置设定值。</div><p id="feedback" class="feedback" role="status"></p></main></div>
    <footer class="foot"><span>轻馏分为教学汇总指标；数据与边界不代表某家炼厂。</span><span>RIDGE · λ = 0.2 · seed 1301</span></footer>`;
  function inputs() { return ['temperature', 'reflux', 'vacuum', 'density'].map(id => +$(id).value); }
  let latest = null;
  function heatmap(x) {
    const w = L.chartWidth(), h = 260, left = w < 450 ? 41 : 55, top = 18, cols = w < 450 ? 11 : 15, rows = 11, cw = (w - left - 14) / cols, ch = 17;
    const grid = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const t = 340 + i * 50 / (cols - 1), rf = 4 - j * 2.6 / (rows - 1), yy = predict([t, rf, x[2], x[3]]); grid.push({ i, j, t, rf, y: yy, value: score(yy) }); }
    const a = Math.min(...grid.map(d => d.value)), b = Math.max(...grid.map(d => d.value));
    let out = grid.map(d => { const f = (d.value - a) / (b - a || 1), col = feasible(d.y) ? `rgb(${Math.round(232 - f * 191)},${Math.round(238 - f * 119)},${Math.round(217 - f * 117)})` : '#d9dcd5'; return `<rect class="heat-cell" data-t="${d.t}" data-r="${d.rf}" x="${left + d.i * cw}" y="${top + d.j * ch}" width="${cw - 2}" height="${ch - 2}" fill="${col}" style="cursor:pointer"><title>温度 ${d.t.toFixed(0)} °C，回流比 ${d.rf.toFixed(2)}，目标 ${d.value.toFixed(1)}${feasible(d.y) ? '' : '，约束未满足'}</title></rect>`; }).join('');
    [0, 5, 10].forEach(j => { out += L.text(left - 10, top + j * ch + 12, (4 - j * 2.6 / 10).toFixed(1), 'text-anchor="end"'); });
    [0, .25, .5, .75, 1].map(f => Math.round(f * (cols - 1))).forEach(i => { out += L.text(left + i * cw + cw / 2, top + rows * ch + 20, (340 + i * 50 / (cols - 1)).toFixed(0), 'text-anchor="middle"'); });
    const px = left + (x[0] - 340) / 50 * (cols - 1) * cw + cw / 2 - 1, py = top + (4 - x[1]) / 2.6 * (rows - 1) * ch + ch / 2 - 1;
    out += `<circle cx="${px}" cy="${py}" r="8" fill="none" stroke="white" stroke-width="4"/><circle cx="${px}" cy="${py}" r="8" fill="none" stroke="${C.orange}" stroke-width="2.5"/>` + L.text(left, 10, '回流比') + L.text(w - 12, 247, '炉温 / °C', 'text-anchor="end"');
    $('heatmap').innerHTML = L.svg(out, w, h, '炉温与回流比的目标值热力图');
  }
  function render() {
    const x = inputs(), y = predict(x), baseline = predict([365, 2.7, 18, x[3]]);
    latest = { inputs: x, predicted: y, objective: score(y), feasible: feasible(y), testRMSE: errors };
    $('metrics').innerHTML = L.metric('轻馏分收率', y[0].toFixed(1), '%', `相对初始 ${(y[0] - baseline[0]) >= 0 ? '+' : ''}${(y[0] - baseline[0]).toFixed(1)} 个百分点`, 'accent') + L.metric('单位原油能耗', y[1].toFixed(2), 'GJ/t', '约束上限 1.85 GJ/t') + L.metric('柴油闪点估计', y[2].toFixed(1), '°C', y[2] >= 55 ? '满足教学下限 55 °C' : '低于教学下限 55 °C');
    heatmap(x);
    $('comparison').innerHTML = L.bars([{ name: '初始操作', value: baseline[0], color: '#b3c1b3' }, { name: '当前操作', value: y[0], color: C.green }], { w: 360, h: 165, max: 80, unit: '%', left: 82 });
    $('constraint-note').textContent = `目标值 ${score(y).toFixed(2)}；${feasible(y) ? '当前工况满足两项约束。' : '当前工况有约束未满足，不作为推荐结果。'}`;
    $('validation').innerHTML = L.scatter(test.map(d => ({ x: d.y[0], y: models[0].predict(d.x), r: 2.7 })), { w: 360, h: 180, xmin: 54, xmax: 76, ymin: 54, ymax: 76, diagonal: true, xlabel: '样本收率 / %', ylabel: '预测 / %' });
    $('validation-note').textContent = `测试RMSE：收率 ${errors[0].toFixed(2)} 个百分点；能耗 ${errors[1].toFixed(3)} GJ/t；闪点 ${errors[2].toFixed(2)} °C。`;
  }
  L.bindControls(Object.keys(defaults), render);
  $('heatmap').addEventListener('click', e => { const cell = e.target.closest('.heat-cell'); if (!cell) return; L.reset({ temperature: Math.round(+cell.dataset.t), reflux: (+cell.dataset.r).toFixed(1) }, render); });
  $('reset').onclick = () => { L.reset(defaults, render); L.note('已恢复初始参数。'); };
  $('optimize').onclick = () => {
    const density = inputs()[3]; let best = null;
    for (let t = 340; t <= 390; t += 2) for (let rf = 1.4; rf <= 4.001; rf += .2) for (let p = 8; p <= 28; p += 2) {
      const x = [t, rf, p, density], y = predict(x); if (feasible(y) && (!best || score(y) > best.score)) best = { x, y, score: score(y) };
    }
    if (!best) { L.note('当前原油条件下，搜索范围内没有同时满足约束的参数。'); return; }
    const before = latest.objective;
    L.reset({ temperature: best.x[0], reflux: best.x[1].toFixed(1), vacuum: best.x[2] }, render);
    L.note(`已比较 4004 组参数。当前推荐目标值 ${latest.objective.toFixed(2)}，相对调整前 ${(latest.objective - before).toFixed(2)}；原油密度保持 ${density} kg/m³。`);
  };
  $('export').onclick = () => { L.csv('常减压优化-当前工况.csv', [['数据类型', '教学合成数据'], ['炉温_C', '回流比', '压力_kPa', '密度_kg_m3', '预测收率_pct', '预测能耗_GJ_t', '预测闪点_C', '目标值', '约束满足'], [...latest.inputs, ...latest.predicted, latest.objective, latest.feasible]]); L.note('当前输入、预测与约束结果已导出。'); };
  globalThis.RefineryDemo = { get snapshot() { return latest; }, models, test, truth };
  render();
})();
