(function () {
  'use strict';
  const L = Lab, C = L.C, $ = id => document.getElementById(id), rnd = L.rng(1304);
  function normalSample(r) { const d = .84 + .004 * L.normal(r); return [d, 67 + (d - .84) * 650 + 1.2 * L.normal(r), .03 + .004 * L.normal(r)]; }
  const training = Array.from({ length: 260 }, () => normalSample(rnd)), model = L.isolationForest(training, 90, 128, 1304), featureScaler = L.scaler(training);
  const calibration = Array.from({ length: 100 }, () => normalSample(rnd)), normalThreshold = L.quantile(calibration.map(model.score), .97);
  const defaults = { faults: 5, threshold: +normalThreshold.toFixed(2) };
  let rows = [], selected = 0, imported = false, latest;
  document.getElementById('app').innerHTML = `
    <header class="lab-head"><div><div class="lab-no">04 / LABORATORY DATA REVIEW</div><h1>数值都在范围内，也可能需要复核。</h1><p>比较范围规则与孤立森林的判断，逐条查看为什么被标记。</p></div><span class="synthetic" id="source-tag">教学合成数据</span></header>
    <div class="visual-key" role="note" aria-label="图表阅读提示"><span class="visual-key-title">如何读这页</span><span><i class="vk-dot vk-input"></i>输入 / 工况</span><span><i class="vk-dot vk-model"></i>模型计算</span><span><i class="vk-dot vk-result"></i>结果 / 约束</span></div><div class="lab-layout"><aside class="controls"><h2>审核设置 <span>REVIEW</span></h2>
    ${L.control('faults', '注入的异常样本数', 0, 10, 1, 5, ' / 30', '混合录入错误与单项未超限的组合异常。')}
    ${L.control('threshold', '模型异常分数阈值', .42, .75, .01, defaults.threshold, '', `100组正常校准样本的97%分位为${normalThreshold.toFixed(3)}，滑杆默认取两位小数。`)}
    <label class="check"><input type="checkbox" id="rules" checked>同时使用范围规则</label>
    <button class="action" id="show-combination">查看规则漏过的样本 ↗</button><button class="action secondary" id="reset">恢复教学批次</button><button class="action secondary" id="export">导出本批审核结果</button>
    <div class="method-box"><b>孤立森林 + 范围规则</b>90棵随机树，每棵从260个正常训练样本中无放回抽取128个。分数由平均隔离路径计算。<br><code>s(x) = 2 ^ (−E[h(x)] / c(128))</code><br>教学规则：密度0.80—0.88 g/cm³；闪点55—85 °C；硫0—0.06%。这些范围不是产品标准。</div></aside>
    <main class="main"><div class="metrics" id="metrics"></div>
    <section class="chart-box"><div class="chart-head"><h2>密度与闪点的组合是否少见？</h2><span>点击彩点或表格行查看样本</span></div><div id="scatter"></div>${L.legend([{ name: '正常训练样本', color: '#b7c6b7' }, { name: '暂未标记', color: C.green }, { name: '待人工复核', color: C.orange }])}<p class="chart-note">灰点来自训练集，彩点为本批数据。模型使用三个特征；图中仅显示密度与闪点。深色外圈表示当前选择。</p></section>
    <div class="toolbar"><b id="batch-title">本批30份化验单</b><button id="import-csv" type="button">导入CSV</button><input type="file" accept=".csv,text/csv" id="csv-file" hidden><button id="sample">下载CSV样例</button></div>
    <div class="review-filters"><label><input id="only-pending" type="checkbox">只看待复核</label><label class="review-sort" for="sort-rows">排列<select id="sort-rows"><option value="review">待复核优先</option><option value="score">异常分数从高到低</option><option value="sample">原始样本顺序</option></select></label><span id="table-count" role="status" aria-live="polite"></span></div>
    <div class="data-scroll"><table class="data-table"><caption class="sr-only">化验批次审核结果；使用行首按钮或上下方向键选择样本</caption><thead><tr><th scope="col">样本</th><th scope="col">密度 g/cm³</th><th scope="col">闪点 °C</th><th scope="col">硫 %</th><th scope="col">模型分数</th><th scope="col">审核依据</th></tr></thead><tbody id="table-body"></tbody></table></div>
    <section class="review-detail" id="review-detail"><div class="chart-head"><h2 id="selection-title">当前样本</h2><span id="selected-score"></span></div><div id="decision-trace" class="decision-trace"></div><p id="selected-note" class="chart-note"></p></section>
    <div class="columns"><section class="chart-box"><div class="chart-head"><h2>三个指标偏离训练均值多少？</h2><span>标准差 σ</span></div><div id="selected-chart"></div><p class="chart-note">标准化柱图帮助定位偏离项；联合异常也可能出现在单项偏移不大的情况下。</p></section><section class="chart-box"><div class="chart-head"><h2>与只用规则相比</h2><span>标记样本数</span></div><div id="rule-compare"></div><p class="chart-note" id="truth-note"></p></section></div>
    <div class="model-note"><strong>标记之后做什么：</strong>核对取样时间、仪器和原始记录，再决定重测还是保留。异常分数不等于错误概率。CSV列名为sample、density、flash、sulfur，单位与表头一致，最多500行。导入后仍使用教学训练模型。</div><p id="feedback" class="feedback" role="status"></p></main></div>
    <footer class="foot"><span>所有自动标记都进入人工复核，不自动改写化验数据。</span><span>ISOLATION FOREST · 90 trees · seed 1304</span></footer>`;
  function ruleReasons(x) {
    const reasons = [];
    if (x[0] < .8 || x[0] > .88) reasons.push(`密度 ${x[0].toFixed(4)} g/cm³ 超出0.80—0.88`);
    if (x[1] < 55 || x[1] > 85) reasons.push(`闪点 ${x[1].toFixed(1)} °C 超出55—85`);
    if (x[2] < 0 || x[2] > .06) reasons.push(`硫 ${x[2].toFixed(4)}% 超出0—0.06`);
    return reasons;
  }
  function adopt(batch, isImported) {
    // Scores depend only on the batch and trained forest. Thresholds, table order
    // and row selection must not traverse all 90 trees for every record again.
    rows = batch.map(d => ({ ...d, score: model.score(d.x), reasons: ruleReasons(d.x) }));
    imported = isImported; selected = 0; $('faults').disabled = imported;
    $('source-tag').textContent = imported ? '用户CSV · 教学模型' : '教学合成数据';
    render();
  }
  function generate() {
    const r = L.rng(3404), faults = +$('faults').value, ids = Array.from({ length: 30 }, (_, i) => i).sort((a, b) => (a * 7 % 31) - (b * 7 % 31));
    const batch = Array.from({ length: 30 }, (_, i) => ({ id: `L-${String(i + 1).padStart(3, '0')}`, x: normalSample(r), label: false }));
    ids.slice(0, faults).forEach((i, j) => { batch[i].label = true; batch[i].x = j % 3 === 0 ? [.91, 67, .03] : j % 3 === 1 ? [.855, 58, .031] : [.842, 70, .12]; });
    adopt(batch, false);
  }
  function render() {
    const threshold = +$('threshold').value, rulesOn = $('rules').checked;
    const scored = rows.map(d => { const byRule = d.reasons.length > 0, byModel = d.score > threshold; return { ...d, byRule, byModel, flagged: byModel || rulesOn && byRule }; });
    selected = L.clamp(selected, 0, Math.max(0, scored.length - 1));
    const flagged = scored.filter(d => d.flagged), trueFaults = scored.filter(d => d.label === true), tp = flagged.filter(d => d.label === true).length;
    const recall = !imported && trueFaults.length ? tp / trueFaults.length : null, precision = !imported && flagged.length ? tp / flagged.length : null;
    latest = { rows: scored, threshold, selected, imported, recall, precision, flagged: flagged.length };
    $('metrics').innerHTML = L.metric('待人工复核', flagged.length, `/ ${rows.length}`, `${scored.filter(d => d.byModel).length}条模型标记；${scored.filter(d => d.byRule).length}条规则命中${rulesOn ? '' : '（规则已停用）'}`, 'accent') + L.metric('异常样本检出率', recall === null ? '—' : (recall * 100).toFixed(0), recall === null ? '' : '%', imported ? '导入数据没有已知异常标签' : `${tp} / ${trueFaults.length} 个注入异常被标记`) + L.metric('标记样本中确为异常', precision === null ? '—' : (precision * 100).toFixed(0), precision === null ? '' : '%', '仅能在已知合成标签时计算');
    $('batch-title').textContent = `本批 ${rows.length} 份化验单${imported ? ' · 用户导入' : ''}`;
    renderTable(); renderSelection();
    $('rule-compare').innerHTML = L.bars([{ name: '只用范围规则', value: scored.filter(d => d.byRule).length, color: '#b5c3b4' }, { name: '当前审核设置', value: flagged.length, color: C.orange }], { w: 360, h: 180, left: 105, max: Math.max(10, flagged.length + 1), dp: 0 });
    $('truth-note').textContent = imported ? '导入数据没有真实审核结论，因此不展示检出率和标记精确率。' : `本批注入 ${trueFaults.length} 个异常，其中包含单项都在教学范围内的组合异常。多标记的样本仍需人工判断。`;
  }
  function basis(d) { return d.flagged ? [d.byModel ? '模型超阈' : '', $('rules').checked && d.byRule ? '规则超限' : ''].filter(Boolean).join(' + ') : '暂未标记'; }
  function visibleRows() {
    const list = latest.rows.map((d, i) => ({ d, i })).filter(({ d }) => !$('only-pending').checked || d.flagged), order = $('sort-rows').value;
    if (order === 'score') list.sort((a, b) => b.d.score - a.d.score || a.i - b.i);
    else if (order !== 'sample') list.sort((a, b) => Number(b.d.flagged) - Number(a.d.flagged) || a.i - b.i);
    return list;
  }
  function renderTable() {
    const list = visibleRows();
    $('table-count').textContent = `显示 ${list.length} / ${rows.length} 条`;
    $('table-body').innerHTML = list.length ? list.map(({ d, i }) => `<tr data-row="${i}" class="${d.flagged ? 'flagged ' : ''}${i === selected ? 'selected' : ''}" aria-selected="${i === selected}"><td><button type="button" class="sample-button" data-select="${i}" aria-label="查看样本 ${L.esc(d.id)}${i === selected ? '，当前已选中' : ''}">${L.esc(d.id)}</button></td><td>${d.x[0].toFixed(4)}</td><td>${d.x[1].toFixed(1)}</td><td>${d.x[2].toFixed(4)}</td><td>${d.score.toFixed(3)}</td><td><i class="status-dot ${d.flagged ? 'bad' : ''}" aria-hidden="true"></i>${basis(d)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-state">当前设置下没有待复核样本。可取消筛选查看本批全部数据。</td></tr>';
  }
  function renderSelection() {
    const scored = latest.rows, d = scored[selected]; if (!d) return;
    $('scatter').innerHTML = L.scatter([...training.map(x => ({ x: x[0], y: x[1], color: '#b7c6b7', r: 2, opacity: .45 })), ...scored.map((item, i) => ({ x: item.x[0], y: item.x[1], color: item.flagged ? C.orange : C.green, r: i === selected ? 6 : 3.8, outline: i === selected ? C.ink : 'white', key: i, label: item.id }))], { h: 245, xdp: 3, xlabel: '密度 / g/cm³', ylabel: '闪点 / °C' });
    $('selection-title').textContent = `样本 ${d.id} · ${d.flagged ? '待复核' : '暂未标记'}`;
    $('selected-score').textContent = `score ${d.score.toFixed(3)} / 阈值 ${latest.threshold.toFixed(2)}`;
    const rulesOn = $('rules').checked;
    $('decision-trace').innerHTML = `<div class="decision-item"><span>01 / 范围规则${rulesOn ? '' : '（已停用）'}</span><strong>${d.byRule ? '有指标超出教学范围' : '三项均在教学范围内'}</strong><p>${d.byRule ? d.reasons.map(L.esc).join('<br>') : '密度、闪点、硫含量逐项检查均未命中。'}</p></div><div class="decision-item"><span>02 / 孤立森林</span><strong>${d.byModel ? '超过模型阈值' : '未超过模型阈值'}</strong><div class="score-gauge" aria-label="异常分数${d.score.toFixed(3)}，阈值${latest.threshold.toFixed(2)}"><i style="width:${d.score * 100}%"></i><b style="left:${latest.threshold * 100}%"></b></div><p>${d.score.toFixed(3)} ${d.byModel ? '>' : '≤'} ${latest.threshold.toFixed(2)} · 竖线为阈值，分数越高越少见。</p></div>`;
    $('selected-note').textContent = d.flagged ? `进入人工复核，依据：${basis(d)}。请检查原始记录与仪器状态后决定是否重测。` : '当前设置未标记此样本；这不等于证明化验值正确。';
    const z = featureScaler.transform(d.x);
    $('selected-chart').innerHTML = L.bars(['密度', '闪点', '硫含量'].map((name, j) => ({ name, value: z[j], color: Math.abs(z[j]) > 3 ? C.orange : C.green })), { w: 360, h: 180, left: 70, unit: 'σ' });
  }
  function selectSample(index, focus = false) {
    if (!latest.rows[index]) return; selected = index; latest.selected = index;
    const body = $('table-body');
    if (body.querySelectorAll) body.querySelectorAll('[data-row]').forEach(row => { const on = +row.dataset.row === selected, item = latest.rows[+row.dataset.row]; row.classList.toggle('selected', on); row.setAttribute('aria-selected', String(on)); const button = row.querySelector('button'); if (button && item) { button.setAttribute('aria-label', `查看样本 ${item.id}${on ? '，当前已选中' : ''}`); if (on && focus) button.focus({ preventScroll: true }); } });
    renderSelection();
  }
  $('faults').addEventListener('input', () => { $('faults-value').textContent = $('faults').value + ' / 30'; generate(); });
  L.bindControls(['threshold'], render); $('rules').onchange = render;
  $('only-pending').onchange = renderTable; $('sort-rows').onchange = renderTable;
  $('table-body').onclick = e => { const row = e.target.closest('[data-row]'); if (row) selectSample(+row.dataset.row); };
  $('table-body').onkeydown = e => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const list = visibleRows(); if (!list.length) return;
    e.preventDefault(); const current = list.findIndex(item => item.i === selected), next = e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : L.clamp(current + (e.key === 'ArrowDown' ? 1 : -1), 0, list.length - 1); selectSample(list[next].i, true);
  };
  $('scatter').onclick = e => { const point = e.target.closest('[data-point]'); if (point) selectSample(+point.dataset.point); };
  $('show-combination').onclick = () => { const index = latest.rows.findIndex(d => d.byModel && !d.byRule); if (index < 0) { L.note('当前批次与阈值下，没有“模型标记而规则未命中”的样本。可降低阈值后再比较。'); return; } selectSample(index); $('review-detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); L.note(`已选中 ${latest.rows[index].id}：三项都在教学范围内，模型分数超过阈值。`); };
  $('reset').onclick = () => { $('rules').checked = true; $('only-pending').checked = false; $('sort-rows').value = 'review'; L.reset(defaults, generate); L.note('已恢复固定随机种子生成的30份教学化验单。'); };
  $('export').onclick = () => { L.csv('化验审核-本批结果.csv', [['sample', 'density', 'flash', 'sulfur', 'anomaly_score', 'threshold', 'rule_flag', 'rules_enabled', 'pending_review', 'reason', 'synthetic_label'], ...latest.rows.map(d => [d.id, ...d.x, d.score, latest.threshold, d.byRule, $('rules').checked, d.flagged, basis(d), d.label ?? 'unknown'])]); L.note('已导出原始值、分数、当前阈值和审核依据；筛选不会删掉导出记录。'); };
  $('sample').onclick = () => L.csv('化验数据-导入样例.csv', [['sample', 'density', 'flash', 'sulfur'], ...rows.slice(0, 10).map(d => [d.id, ...d.x])]);
  $('import-csv').onclick = () => $('csv-file').click();
  function parseCSV(s) {
    const result = []; let row = [], value = '', quote = false;
    for (let i = 0; i <= s.length; i++) { const c = s[i]; if (c === '"') { if (quote && s[i + 1] === '"') { value += '"'; i++; } else quote = !quote; } else if ((c === ',' || c === '\n' || c === undefined) && !quote) { row.push(value.replace(/\r$/, '')); value = ''; if (c !== ',') { if (row.some(v => v.trim())) result.push(row); row = []; } } else if (c !== undefined) value += c; }
    if (quote) throw new Error('CSV引号未闭合'); return result;
  }
  $('csv-file').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('CSV请控制在1MB以内');
      const a = parseCSV((await file.text()).replace(/^\uFEFF/, '')), keys = ['sample', 'density', 'flash', 'sulfur'];
      if (!a.length) throw new Error('CSV为空，请使用样例中的四列格式');
      const h = a.shift().map(v => v.trim().toLowerCase());
      if (!keys.every(k => h.includes(k))) throw new Error('需要sample、density、flash、sulfur四列');
      if (keys.some(k => h.filter(v => v === k).length > 1)) throw new Error('必需列名不能重复');
      if (!a.length || a.length > 500) throw new Error('数据行数应在1—500之间');
      const parsed = a.map((v, i) => {
        const x = keys.slice(1).map(k => { const raw = v[h.indexOf(k)]; if (raw === undefined || raw.trim() === '') throw new Error(`第${i + 2}行缺少数值`); const text = raw.trim(); if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text) || !Number.isFinite(+text)) throw new Error(`第${i + 2}行的${k}不是有效十进制数值`); return +text; });
        return { id: (v[h.indexOf('sample')] || '').trim() || `CSV-${i + 1}`, x, label: null };
      });
      adopt(parsed, true); L.note(`已导入 ${rows.length} 行。没有真实异常标签，因此不计算检出率。当前案例分区切换会保留批次；点击“恢复教学批次”可回到合成数据。`);
    } catch (err) { L.note(`未导入：${err.message}。原批次数据已保留。`); } finally { e.target.value = ''; }
  };
  globalThis.RefineryDemo = { get snapshot() { return latest; }, model, training, parseCSV, selectSample };
  generate();
})();
