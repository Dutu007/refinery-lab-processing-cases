(function () {
  'use strict';
  const L = Lab, C = L.C, $ = id => document.getElementById(id), r = L.rng(1302);
  const names = ['干气', '液化气', '汽油', '柴油馏分', '油浆', '焦炭'], colors = [C.blue, C.gold, C.green, '#6c9586', C.purple, '#626d69'];
  const ranges = [[480, 550], [4, 10], [900, 970], [.6, 1]];
  const defaults = { temperature: 515, ratio: 7, density: 935, activity: .8, neighbors: 7 };
  function truth(x, noise = 0) {
    const [t, c, d, a] = [(x[0] - 515) / 35, (x[1] - 7) / 3, (x[2] - 935) / 35, (x[3] - .8) / .2];
    const raw = [4 + 1.3 * t + .6 * c + 1.1 * t * t, 16 + 3 * t + c + a, 47 + 5 * t + 4 * c + 3 * a - 2 * d - 4 * t * t - 2.4 * c * c, 21 - 4 * t - 1.8 * c - a + d, 8 - 2 * t - 1.3 * c - 1.2 * a + 1.5 * d, 5 + t + .8 * c + .8 * d];
    const y = raw.map(v => Math.max(.5, v + L.normal(r) * noise)), total = L.sum(y); return y.map(v => v * 100 / total);
  }
  const data = Array.from({ length: 440 }, () => { const x = ranges.map(([a, b]) => a + r() * (b - a)); return { x, y: truth(x, .35) }; }), train = data.slice(0, 360), test = data.slice(360);
  const model = L.knn(train.map(d => d.x), train.map(d => d.y));
  document.getElementById('app').innerHTML = `
    <header class="lab-head"><div><div class="lab-no">02 / FLUID CATALYTIC CRACKING</div><h1>换一种工况，会多产汽油还是液化气？</h1><p>模型从历史工况中找相近样本，再按距离加权预测六类产物的质量收率。</p></div><span class="synthetic">教学合成数据</span></header>
    <div class="lab-layout"><aside class="controls"><h2>原料与反应条件 <span>INPUT</span></h2>
    ${L.control('temperature', '反应温度', 480, 550, 1, 515, ' °C')}
    ${L.control('ratio', '剂油比', 4, 10, .1, 7, '', '催化剂循环量与原料油流量之比。')}
    ${L.control('density', '原料密度', 900, 970, 1, 935, ' kg/m³')}
    ${L.control('activity', '催化剂相对活性', .6, 1, .01, .8, '', '教学归一化指标，不对应工业活性测定标准。')}
    ${L.control('neighbors', '参与预测的近邻数 k', 1, 19, 2, 7, '', 'k较小更依赖局部样本，较大时预测更平滑。')}
    <button class="action secondary" id="reset">恢复初始工况</button><button class="action secondary" id="export">导出产物预测</button>
    <div class="method-box"><b>距离加权 k 近邻回归</b>360组训练工况、80组测试工况。先将四维特征标准化，再计算欧氏距离。<br><code>预测收率 = Σ(收率 / 距离) / Σ(1 / 距离)</code><br>产物包含焦炭，六类质量收率之和为100%。</div></aside>
    <main class="main"><div id="metrics" class="metrics"></div>
    <section class="chart-box"><div class="chart-head"><h2>六类产物的质量分配</h2><span>原料油 = 100%</span></div><div id="product-chart"></div><div id="product-legend"></div><div id="products"></div><p class="chart-note">浅色细线标记初始工况。这里展示质量收率，不是体积收率；焦炭在催化剂再生环节燃烧。</p></section>
    <div class="columns"><section class="chart-box"><div class="chart-head"><h2>本次预测参考了哪些工况？</h2><span id="neighbor-count"></span></div><div id="neighbors-plot"></div><p class="chart-note">散点只投影温度和剂油比。模型找邻居时使用全部四维特征，橙色十字为当前输入。</p></section><section class="chart-box"><div class="chart-head"><h2>各产物的测试误差</h2><span>平均绝对误差 / 百分点</span></div><div id="validation"></div><p class="chart-note">误差使用80组独立测试工况实时重算，不是预设的准确率。</p></section></div>
    <div class="model-note"><strong>可以试试：</strong>先提高反应温度，再提高剂油比。汽油不一定持续增加，因为更强的裂化也可能把它继续转成轻气体。比较不同k值时，同时看产物变化和测试误差。</div><p id="feedback" class="feedback" role="status"></p></main></div>
    <footer class="foot"><span>合成工况仅用于解释多变量回归，不能直接用于装置操作。</span><span>KNN · distance weighted · seed 1302</span></footer>`;
  const baseline = model.predict([515, 7, 935, .8], 7);
  const errorCache = new Map();
  function testErrors(k) {
    if (!errorCache.has(k)) {
      const pred = test.map(d => model.predict(d.x, k));
      errorCache.set(k, names.map((_, j) => L.mae(test.map(d => d.y[j]), pred.map(d => d[j]))));
    }
    return errorCache.get(k);
  }
  let latest;
  function render() {
    const x = ['temperature', 'ratio', 'density', 'activity'].map(id => +$(id).value), k = +$('neighbors').value, y = model.predict(x, k), ns = model.neighbors(x, k), ids = new Set(ns.map(n => n.i));
    const errors = testErrors(k);
    latest = { inputs: x, k, predicted: y, total: L.sum(y), errors, meanMAE: L.mean(errors), neighbors: ns };
    $('metrics').innerHTML = L.metric('汽油质量收率', y[2].toFixed(1), '%', `相对初始 ${y[2] >= baseline[2] ? '+' : ''}${(y[2] - baseline[2]).toFixed(1)} 个百分点`, 'accent') + L.metric('汽油 + 液化气', (y[1] + y[2]).toFixed(1), '%', '由六类产物中的两类汇总') + L.metric('六类平均测试误差', L.mean(errors).toFixed(2), '百分点', `k = ${k}，80组独立测试工况`);
    $('product-chart').innerHTML = `<div class="stacked">${y.map((v, j) => `<span style="width:${v}%;background:${colors[j]}" title="${names[j]} ${v.toFixed(2)}%">${v > 7 ? v.toFixed(1) : ''}</span>`).join('')}</div>`;
    $('product-legend').innerHTML = L.legend(names.map((name, j) => ({ name, color: colors[j] })));
    $('products').innerHTML = y.map((v, j) => `<div class="yield-row"><span>${names[j]}</span><div class="yield-bar"><i style="width:${v / 60 * 100}%;background:${colors[j]}"></i><span style="position:absolute;left:${baseline[j] / 60 * 100}%;top:-3px;height:14px;border-left:2px solid #acb9ad" title="初始工况 ${baseline[j].toFixed(1)}%"></span></div><strong>${v.toFixed(1)}%<small>${v >= baseline[j] ? '+' : ''}${(v - baseline[j]).toFixed(1)}</small></strong></div>`).join('');
    $('neighbor-count').textContent = `${k} / 360`;
    $('neighbors-plot').innerHTML = L.scatter(train.map((d, i) => ({ x: d.x[0], y: d.x[1], color: ids.has(i) ? C.orange : '#b9c9b9', opacity: ids.has(i) ? 1 : .38, r: ids.has(i) ? 4.5 : 2, label: `训练工况 ${i + 1}` })), { w: 360, h: 230, xmin: 480, xmax: 550, ymin: 4, ymax: 10, target: { x: x[0], y: x[1] }, xlabel: '反应温度 / °C', ylabel: '剂油比' });
    $('validation').innerHTML = L.bars(names.map((name, j) => ({ name, value: errors[j], color: colors[j] })), { w: 360, h: 230, left: 78, dp: 2 });
  }
  L.bindControls(Object.keys(defaults), render);
  $('reset').onclick = () => { L.reset(defaults, render); L.note('已恢复初始工况，浅色参考线保持不变。'); };
  $('export').onclick = () => { L.csv('催化裂化-产物预测.csv', [['数据类型', '教学合成数据'], ['温度_C', '剂油比', '密度_kg_m3', '相对活性', 'k'], [...latest.inputs, latest.k], ['产物', '质量收率_pct', '测试MAE_百分点'], ...names.map((n, j) => [n, latest.predicted[j], latest.errors[j]])]); L.note('六类产物预测与测试误差已导出。'); };
  globalThis.RefineryDemo = { get snapshot() { return latest; }, model, train, test };
  render();
})();
