(function () {
  'use strict';
  const L = Lab, C = L.C, $ = id => document.getElementById(id), r = L.rng(1305), ranges = [[495, 525], [1.1, 1.9], [3, 5], [18, 32]];
  function truth(x) { return 96 + .17 * (x[0] - 510) - 1.8 * (x[1] - 1.5) + .55 * (x[2] - 4) + .12 * (x[3] - 25) + .04 * (x[0] - 510) * (x[1] - 1.5); }
  const historical = Array.from({ length: 520 }, () => { const x = ranges.map(([a, b]) => a + r() * (b - a)); return { x, y: truth(x) + L.normal(r) * .22 }; });
  const training = historical.slice(0, 360), calibration = historical.slice(360, 440), test = historical.slice(440), model = L.ridge(training.map(d => d.x), training.map(d => d.y), .15);
  const radius = L.quantile(calibration.map(d => Math.abs(model.predict(d.x) - d.y)), .95), testMAE = L.mae(test.map(d => d.y), test.map(d => model.predict(d.x))), testCoverage = test.filter(d => Math.abs(model.predict(d.x) - d.y) <= radius).length / test.length;
  const defaults = { delay: 4, noise: .5, time: 64 }; let timer = null, latest;
  document.getElementById('app').innerHTML = `
    <header class="lab-head"><div><div class="lab-no">05 / ONLINE QUALITY ESTIMATION</div><h1>化验结果还没回来，现在的汽油质量是多少？</h1><p>用温度、压力等过程变量估计重整汽油辛烷值，比较模型与滞后化验值的差别。</p></div><span class="synthetic">教学合成数据</span></header>
    <div class="lab-layout"><aside class="controls"><h2>采样与测量 <span>STREAM</span></h2>
    ${L.control('delay', '化验结果延迟', 0, 12, 1, 4, ' h', '每8小时取样一次，延迟后才能看到该次结果。')}
    ${L.control('noise', '过程传感器噪声', 0, 2, .1, .5, ' ×', '训练模型不变，增加现场输入的不确定性。')}
    ${L.control('time', '当前运行时刻', 0, 95, 1, 64, ' h', '图表只展示当前时刻已经可见的数据。')}
    <button class="action" id="play">播放运行过程 <span>▶</span></button><button class="action secondary" id="reset">从第0小时重新开始</button><button class="action secondary" id="export">导出完整时序数据</button>
    <div class="method-box"><b>岭回归软测量</b>360组历史样本训练；80组校准样本计算区间宽度；另外80组测试样本评价效果。<br><code>RON = b + Σ(wⱼ × 标准化过程变量ⱼ)</code><br>区间使用校准集绝对残差的95%分位数，不代表对每个新工况都有95%保证。</div></aside>
    <main class="main"><div class="metrics" id="metrics"></div>
    <section class="chart-box"><div class="chart-head"><h2>当前质量估计与已返回的化验结果</h2><span>研究法辛烷值 / RON</span></div><div id="quality-chart"></div>${L.legend([{ name: '模型估计及残差区间', color: C.green }, { name: '已返回化验值保持', color: C.orange }, { name: '合成真实值，用于教学对照', color: C.blue }])}<p class="chart-note" id="availability-note"></p></section>
    <div class="selected-values" id="process-values"></div>
    <div class="columns"><section class="chart-box"><div class="chart-head"><h2>本次估计由哪些变量推高或拉低？</h2><span>相对训练均值 / RON</span></div><div id="contribution-chart"></div><p class="chart-note" id="intercept-note"></p></section><section class="chart-box"><div class="chart-head"><h2>在当前已运行时段，哪种估计更接近真实值？</h2><span>MAE / RON</span></div><div id="comparison-chart"></div><p class="chart-note" id="validation-note"></p></section></div>
    <div class="model-note"><strong>软测量的用途：</strong>在两次化验之间提供连续估计，帮助发现质量变化。化验仍用于标定和复核。传感器噪声增大时，预测可能落在残差区间之外；区间宽度不会自动替代工况漂移检测。</div><p id="feedback" class="feedback" role="status"></p></main></div>
    <footer class="foot"><span>本例产品为重整汽油，所有过程曲线与化验值均为合成数据。</span><span>RIDGE · split 360 / 80 / 80 · seed 1305</span></footer>`;
  function render() {
    const rr = L.rng(3505), noise = +$('noise').value, delay = +$('delay').value, time = +$('time').value;
    const rows = Array.from({ length: 96 }, (_, t) => { const actual = [508 + 6 * Math.sin(t / 13) + (t >= 45 ? 5 : 0), 1.5 + .15 * Math.sin(t / 11), 4 + .35 * Math.cos(t / 12), 25 + 3 * Math.sin(t / 18)]; const measured = actual.map((v, j) => v + L.normal(rr) * [1.3, .04, .08, .3][j] * noise); return { time: t, actual, measured, truth: truth(actual) + L.normal(rr) * .09, prediction: model.predict(measured) }; });
    const labs = rows.filter(d => d.time % 8 === 0).map(d => ({ sample: d.time, available: d.time + delay, value: d.truth + L.normal(rr) * .12 }));
    const hold = rows.map(d => { const avail = labs.filter(l => l.available <= d.time); return avail.length ? avail.at(-1).value : null; });
    const visible = rows.slice(0, time + 1), comparable = visible.filter(d => hold[d.time] !== null), latestLab = labs.filter(d => d.available <= time).at(-1), predError = L.mae(visible.map(d => d.truth), visible.map(d => d.prediction)), holdError = comparable.length ? L.mae(comparable.map(d => d.truth), comparable.map(d => hold[d.time])) : null;
    const current = rows[time], contribution = model.contributions(current.measured), coverage = visible.filter(d => Math.abs(d.prediction - d.truth) <= radius).length / visible.length;
    latest = { rows, labs, hold, time, radius, current, contribution, modelMAE: predError, labMAE: holdError, coverage, testMAE, testCoverage };
    $('metrics').innerHTML = L.metric('当前模型估计', current.prediction.toFixed(2), 'RON', `残差区间 ± ${radius.toFixed(2)} RON`, 'accent') + L.metric('最近已返回化验', latestLab ? latestLab.value.toFixed(2) : '未返回', latestLab ? 'RON' : '', latestLab ? `${latestLab.sample}h取样，距当前 ${time - latestLab.sample}h` : '需要等待取样结果返回') + L.metric('当前时段区间覆盖', (coverage * 100).toFixed(0), '%', `${visible.length}个合成真实值中落在区间内的比例`);
    const mask = fn => rows.map(d => d.time <= time ? fn(d) : null), low = rows.map(d => d.time <= time ? d.prediction - radius : null), high = rows.map(d => d.time <= time ? d.prediction + radius : null);
    // A separate masked polygon avoids drawing through future null values.
    const qSeries = [{ name: '模型估计', values: mask(d => d.prediction), color: C.green }, { name: '合成真实质量', values: mask(d => d.truth), color: C.blue, dashed: true }, { name: '已返回化验保持', values: rows.map((d, i) => i <= time ? hold[i] : null), color: C.orange }];
    const clippedLow = rows.map((d, i) => i <= time ? low[i] : low[time]), clippedHigh = rows.map((d, i) => i <= time ? high[i] : high[time]);
    const plotWidth = L.chartWidth();
    let chart = L.lineChart(qSeries, { w: plotWidth, h: 280, lo: 92, hi: 101, cursor: time, unit: 'RON', band: [94, 98], xLabel: i => `${i}h`, label: '软测量、化验保持值和合成真实质量的时序图' });
    // Overlay the interval only for observed timestamps using the chart's axes.
    const px = i => 49 + i / 95 * (plotWidth - 49 - 16), py = v => 22 + (101 - v) / 9 * (280 - 22 - 36);
    const band = `<path d="${visible.map((d, i) => `${i ? 'L' : 'M'}${px(i)} ${py(clippedHigh[i])}`).join(' ')} ${visible.slice().reverse().map(d => `L${px(d.time)} ${py(clippedLow[d.time])}`).join(' ')}Z" fill="${C.green}" opacity=".10"/>`;
    chart = chart.replace('</svg>', band + '</svg>'); $('quality-chart').innerHTML = chart;
    $('availability-note').textContent = `当前 ${time}h；每8h取样，延迟 ${delay}h返回。${latestLab ? `最近可见的是 ${latestLab.sample}h 的样本，而不是当前时刻的样本。` : '目前还没有已返回的化验结果。'}浅绿色背景为教学观察带94—98 RON。`;
    const labels = ['反应温度', '操作压力', '氢油比', '原料芳烃'], units = [' °C', ' MPa', '', ' %'];
    $('process-values').innerHTML = labels.map((s, j) => `<span>${s} <b>${current.measured[j].toFixed(j === 1 ? 2 : 1)}${units[j]}</b></span>`).join('');
    $('contribution-chart').innerHTML = L.bars(labels.map((name, j) => ({ name, value: contribution[j + 1], color: contribution[j + 1] >= 0 ? C.green : C.orange })), { w: 360, h: 220, left: 92, dp: 2 });
    $('intercept-note').textContent = `训练均值处的基准 ${contribution[0].toFixed(2)} RON，加上图中四项，得到 ${current.prediction.toFixed(2)} RON。贡献解释模型计算，不代表因果作用。`;
    const matchedPredError = comparable.length ? L.mae(comparable.map(d => d.truth), comparable.map(d => d.prediction)) : null;
    $('comparison-chart').innerHTML = comparable.length ? L.bars([{ name: '模型估计', value: matchedPredError, color: C.green }, { name: '滞后化验保持', value: holdError, color: C.orange }], { w: 360, h: 220, left: 105, max: Math.max(1, holdError, matchedPredError) * 1.2, dp: 2 }) : '<div class="empty-state">化验还未返回，暂不能在同一时段比较两种方法。</div>';
    $('validation-note').textContent = `比较只用两种方法都有结果的 ${comparable.length} 个时刻。另有80组独立测试样本：模型MAE ${testMAE.toFixed(2)} RON，区间覆盖 ${(testCoverage * 100).toFixed(1)}%。`;
  }
  L.bindControls(Object.keys(defaults), render);
  function stop() { clearInterval(timer); timer = null; $('play').innerHTML = '播放运行过程 <span>▶</span>'; }
  $('play').onclick = () => { if (timer) return stop(); if (+$('time').value >= 95) L.reset({ time: 0 }, render); $('play').innerHTML = '暂停播放 <span>Ⅱ</span>'; timer = setInterval(() => { const t = +$('time').value; if (t >= 95) return stop(); L.reset({ time: t + 1 }, render); }, 600); };
  $('reset').onclick = () => { stop(); L.reset({ delay: 4, noise: .5, time: 0 }, render); L.note('已回到第0小时。点击播放可观察化验结果逐次返回。'); };
  $('export').onclick = () => { L.csv('质量软测量-96小时.csv', [['数据类型', '教学合成数据'], ['小时', '温度_C', '压力_MPa', '氢油比', '芳烃_pct', '合成真实RON', '模型RON', '区间下界', '区间上界', '已返回化验保持值'], ...latest.rows.map((d, i) => [i, ...d.measured, d.truth, d.prediction, d.prediction - radius, d.prediction + radius, latest.hold[i] ?? ''])]); L.note('完整96小时时序与预测区间已导出。'); };
  window.addEventListener('pagehide', stop);
  window.addEventListener('message', e => { if (e.source === parent && e.data && e.data.__refineryPause === true) stop(); });
  globalThis.RefineryDemo = { get snapshot() { return latest; }, model, training, calibration, test };
  render();
})();
