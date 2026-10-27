(function () {
  'use strict';
  const L = Lab, C = L.C, $ = id => document.getElementById(id), rnd = L.rng(1303);
  function healthy(load, r, noise = 1) { return [2.1 + .4 * load + .13 * L.normal(r) * noise, 65 + 3 * load + .9 * L.normal(r) * noise, 78 + 6 * load + 1.5 * L.normal(r) * noise, 3 + .1 * load + .15 * L.normal(r) * noise]; }
  const training = Array.from({ length: 280 }, () => healthy(rnd() * 2 - 1, rnd)), calibration = Array.from({ length: 140 }, () => healthy(rnd() * 2 - 1, rnd));
  const model = L.gaussian(training), calibrationScores = calibration.map(model.score), names = ['振动 RMS', '轴承温度', '电机电流', '振动峭度'];
  const defaults = { wear: 1.2, noise: 1, quantile: 99, time: 72 };
  document.getElementById('app').innerHTML = `
    <header class="lab-head"><div><div class="lab-no">03 / ROTATING EQUIPMENT</div><h1>振动还没超限，设备是否已经偏离正常？</h1><p>用正常运行样本学习多个测点的关系，比较联合异常预警与单一振动阈值。</p></div><span class="synthetic">教学合成数据</span></header>
    <div class="lab-layout"><aside class="controls"><h2>退化场景 <span>SCENARIO</span></h2>
    ${L.control('wear', '退化强度', .2, 1.8, .1, 1.2, '', '第32小时起逐渐增加，模拟轴承磨损。')}
    ${L.control('noise', '测量噪声倍率', .5, 2, .1, 1, ' ×', '增加噪声，观察模型误报是否变多。')}
    ${L.control('quantile', '正常样本阈值分位数', 95, 99.9, .1, 99, '%', '阈值从140组独立正常校准样本计算。')}
    ${L.control('time', '查看第几小时', 0, 95, 1, 72, ' h', '拖动时间，查看当时的四个测点。')}
    <button class="action secondary" id="reset">恢复默认退化场景</button><button class="action secondary" id="export">导出96小时记录</button>
    <div class="method-box"><b>多变量高斯异常检测</b>280组正常样本学习均值与协方差，加入0.04对角正则项避免数值不稳定。<br><code>异常分数 = zᵀ Σ⁻¹ z</code><br>连续3小时超阈值才报警。对照为振动 &gt; 4.5 mm/s（教学阈值）。</div></aside>
    <main class="main"><div class="metrics" id="metrics"></div>
    <section class="chart-box"><div class="chart-head"><h2>96小时内的联合异常分数</h2><span>竖线为当前查看时刻</span></div><div id="score-chart"></div>${L.legend([{ name: '联合异常分数', color: C.green }, { name: '正常样本计算的阈值', color: C.orange }])}<p class="chart-note" id="timeline-note"></p></section>
    <div class="columns"><section class="chart-box"><div class="chart-head"><h2>单一振动阈值何时报警？</h2><span>RMS / mm/s</span></div><div id="vibration-chart"></div><p class="chart-note">两种方法都要求连续3小时超阈值，避免单点尖峰直接触发停机建议。</p></section><section class="chart-box"><div class="chart-head"><h2>当前测点偏离正常均值多少？</h2><span>标准差 z</span></div><div id="feature-chart"></div><p class="chart-note" id="current-note"></p></section></div>
    <section class="chart-box" style="margin-top:19px"><div class="chart-head"><h2>四类测点的退化过程</h2><span>每格4小时平均</span></div><div id="heatmap" class="heatmap"></div><p class="chart-note">颜色越深，标准化测点值相对正常均值越高。这里只显示偏移，不把它解释为因果贡献。</p></section>
    <div class="model-note"><strong>需要比较的两件事：</strong>预警是否更早，以及正常时段是否误报。调低分位阈值会更敏感，也可能增加误报。异常分数不等于故障概率，本例不把短期趋势外推成真实剩余寿命。</div><p id="feedback" class="feedback" role="status"></p></main></div>
    <footer class="foot"><span>退化过程和振动阈值均为教学设置，不能代替设备诊断规程。</span><span>GAUSSIAN · 4 features · seed 1303</span></footer>`;
  function firstRun(flags) { for (let i = 2; i < flags.length; i++) if (flags[i] && flags[i - 1] && flags[i - 2]) return i; return null; }
  let latest;
  function render() {
    const rr = L.rng(2313), wear = +$('wear').value, noise = +$('noise').value, q = +$('quantile').value / 100, time = +$('time').value;
    const rows = Array.from({ length: 96 }, (_, t) => { const f = healthy(.6 * Math.sin(t / 9), rr, noise), d = Math.max(0, (t - 32) / 63) * wear; return f.map((v, j) => v + [2.6 * d ** 1.4, 8 * d, 5 * d, 1.4 * d][j]); });
    const threshold = L.quantile(calibrationScores, q), scores = rows.map(model.score), flags = scores.map(v => v > threshold), fixed = rows.map(v => v[0] > 4.5), alarm = firstRun(flags), fixedAlarm = firstRun(fixed), falsePositives = flags.slice(0, 32).filter(Boolean).length;
    const z = model.z(rows[time]);
    latest = { rows, scores, threshold, alarm, fixedAlarm, falsePositives, time, z, wear, noise };
    const lead = alarm !== null && fixedAlarm !== null ? fixedAlarm - alarm : null;
    $('metrics').innerHTML = L.metric('联合检测首次报警', alarm === null ? '未触发' : alarm, alarm === null ? '' : 'h', '连续3小时超过模型阈值', 'accent') + L.metric('相对单阈值提前', lead === null ? '—' : lead, lead === null ? '' : 'h', fixedAlarm === null ? '单一振动阈值尚未触发' : `单一阈值第 ${fixedAlarm} 小时触发`) + L.metric('正常时段超阈点', falsePositives, '/ 32', '第0—31小时，尚未注入退化');
    $('score-chart').innerHTML = L.lineChart([{ name: '联合异常分数', values: scores, color: C.green }], { h: 255, lo: 0, thresholds: [{ value: threshold, label: `阈值 ${threshold.toFixed(1)}` }], cursor: time, unit: '马氏距离平方', xLabel: i => `${i}h` });
    $('timeline-note').textContent = `第32小时开始注入退化。当前第 ${time} 小时，分数 ${scores[time].toFixed(1)}，${flags[time] ? '已超过' : '未超过'}阈值 ${threshold.toFixed(1)}。`;
    $('vibration-chart').innerHTML = L.lineChart([{ name: '振动 RMS', values: rows.map(v => v[0]), color: C.blue }], { w: 360, h: 220, lo: 1, hi: Math.max(6, ...rows.map(v => v[0] + .3)), cursor: time, thresholds: [{ value: 4.5, label: '教学阈值 4.5' }], xLabel: i => `${i}h` });
    $('feature-chart').innerHTML = L.bars(names.map((name, j) => ({ name, value: z[j], color: z[j] > 2 ? C.orange : C.green })), { w: 360, h: 220, left: 88, unit: 'σ' });
    $('current-note').textContent = `振动 ${rows[time][0].toFixed(2)} mm/s · 温度 ${rows[time][1].toFixed(1)} °C · 电流 ${rows[time][2].toFixed(1)} A · 峭度 ${rows[time][3].toFixed(2)}`;
    $('heatmap').innerHTML = names.map((name, j) => `<div class="heat-row"><span>${name}</span>${Array.from({ length: 24 }, (_, k) => { const value = L.mean(rows.slice(k * 4, k * 4 + 4).map(v => model.z(v)[j])), f = L.clamp(value / 6, 0, 1); return `<i style="background:rgba(215,87,54,${.07 + f * .83})" title="${k * 4}—${k * 4 + 3}h：${value.toFixed(2)}σ"></i>`; }).join('')}</div>`).join('');
  }
  L.bindControls(Object.keys(defaults), render);
  $('reset').onclick = () => { L.reset(defaults, render); L.note('已恢复默认场景。'); };
  $('export').onclick = () => { L.csv('设备维护-96小时.csv', [['数据类型', '教学合成数据'], ['小时', '振动_mm_s', '温度_C', '电流_A', '峭度', '异常分数', '阈值'], ...latest.rows.map((x, i) => [i, ...x, latest.scores[i], latest.threshold])]); L.note('96小时的测点、分数与阈值已导出。'); };
  globalThis.RefineryDemo = { get snapshot() { return latest; }, model, training, calibration };
  render();
})();
