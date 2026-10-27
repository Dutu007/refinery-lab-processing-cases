/* Numerical and package-contract checks. No browser or backend is required. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
const engine = fs.readFileSync(path.join(root, 'tools/engine.js'), 'utf8');
const numeric = vm.createContext({}); vm.runInContext(engine, numeric); const L = numeric.Lab;
const X = [[-2, 3], [-1, 1], [0, 0], [1, 3], [2, -1], [3, 2]], Y = X.map(x => 4 + 2 * x[0] - 3 * x[1]);
check(Math.abs(L.ridge(X, Y, 1e-8).predict([1.5, 2]) - 1) < 1e-6, '岭回归应学到独立输入的线性关系');
check(L.knn([[0], [1]], [[20, 80], [60, 40]]).predict([0], 1)[0] === 20, '近邻应正确命中同点');
check(Math.abs(L.sum(L.knn([[0], [1]], [[20, 80], [60, 40]]).predict([.4], 2)) - 100) < 1e-8, '多输出近邻应保持收率总和');
const r = L.rng(9), normal = Array.from({ length: 200 }, () => [L.normal(r), L.normal(r)]), forest = L.isolationForest(normal);
check(forest.score([12, 12]) > L.mean(normal.map(forest.score)), '孤立森林应给明显离群样本更高分数');
check(L.gaussian(normal).score([12, 12]) > L.gaussian(normal).score([0, 0]), '马氏距离应能区分正常中心与远离点');
function demoContext() {
  const elements = new Map(), listeners = new Map();
  function el(id) {
    if (!elements.has(id)) elements.set(id, { id, value: '', dataset: {}, checked: false, classList: { add() {}, remove() {} }, addEventListener(name, fn) { this['on' + name] = fn; }, setAttribute() {}, remove() {}, click() {}, get innerHTML() { return this.html || ''; }, set innerHTML(s) { this.html = s; if (id !== 'app') return; for (const match of s.matchAll(/<(?:input|output)\b([^>]*)>/g)) { const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]])); if (attrs.id) { const node = el(attrs.id); node.value = attrs.value || ''; node.dataset.unit = attrs['data-unit'] || ''; node.checked = /\bchecked\b/.test(match[1]); } } } });
    return elements.get(id);
  }
  const document = { getElementById: el, createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } };
  const c = { document, console, Blob, URL, setTimeout: () => 0, setInterval: () => 1, clearInterval() {}, addEventListener(name, fn) { listeners.set(name, fn); } };
  c.window = c; vm.createContext(c); vm.runInContext(engine, c); return { c, el, listeners };
}
function finiteTree(a) { return Array.isArray(a) ? a.every(finiteTree) : typeof a === 'number' ? Number.isFinite(a) : true; }
const packages = fs.readdirSync(path.join(root, 'cases')).filter(folder => fs.existsSync(path.join(root, 'cases', folder, 'case.json'))).map(folder => ({ folder, dir: path.join(root, 'cases', folder), manifest: JSON.parse(fs.readFileSync(path.join(root, 'cases', folder, 'case.json'), 'utf8')) }));
check(packages.length === 5, '加工类别的五个场景必须各有一个包');
check(new Set(packages.map(p => p.manifest.id)).size === 5, '案例id必须唯一');
check(packages.map(p => p.manifest.sceneId).sort().join(',') === 'r1,r2,r3,r4,r5', '场景编号必须保持原项目约定');
for (const p of packages) {
  for (const file of ['case.json', 'README.txt', 'demo/index.html', 'demo/demo.js', 'demo/engine.js', 'demo/demo.css']) check(fs.existsSync(path.join(p.dir, file)), `${p.folder}缺少${file}`);
  const bytes = fs.readdirSync(path.join(p.dir, 'demo')).reduce((s, f) => s + fs.statSync(path.join(p.dir, 'demo', f)).size, fs.statSync(path.join(p.dir, 'case.json')).size);
  check(bytes < 6 * 1024 * 1024, '案例包必须小于原框架6MB上限');
  check(p.manifest.tabs.background.sections.length === 4, '专业背景应有四段');
  check(p.manifest.tabs.workflow.steps.length === 5, '每个案例应有五步流程');
  check(p.manifest.tabs.background.sections[0].html.includes('<svg'), '专业背景应包含主题图解');
  check(p.manifest.tabs.workflow.metrics.html.includes('<svg'), '导入原框架后流程仍应包含可视化');
  const { c, el } = demoContext(); vm.runInContext(fs.readFileSync(path.join(p.dir, 'demo/demo.js'), 'utf8'), c, { filename: p.folder + '/demo.js' });
  const demo = c.RefineryDemo, s = demo.snapshot;
  check(!!s, '演示必须运行并给出状态');
  if (p.manifest.sceneId === 'r1') {
    check(finiteTree(s.predicted) && s.testRMSE[0] < 2, '常减压测试误差和预测必须有效');
    const old = s.objective; el('optimize').onclick(); check(demo.snapshot.feasible && demo.snapshot.objective >= old - .05, '推荐应满足两项约束并改善默认目标');
    for (const density of [830, 910]) for (const temperature of [340, 390]) { el('density').value = density; el('temperature').value = temperature; el('temperature').oninput({ target: el('temperature') }); check(finiteTree(demo.snapshot.predicted), '边界工况预测不能出现非有限数'); }
  }
  if (p.manifest.sceneId === 'r2') {
    check(Math.abs(s.total - 100) < 1e-8, '裂化产物质量分配应为100%');
    check(s.predicted.every(v => v > 0) && s.meanMAE < 5, '产物收率与独立测试误差应有效');
    const y = [...s.predicted]; el('temperature').value = 550; el('temperature').oninput({ target: el('temperature') }); check(demo.snapshot.predicted.some((v, j) => Math.abs(v - y[j]) > .2), '反应温度改变必须影响计算');
    let predictions = 0; const predict = demo.model.predict; demo.model.predict = (...args) => { predictions++; return predict(...args); };
    el('temperature').value = 540; el('temperature').oninput({ target: el('temperature') });
    check(predictions === 1, 'k未变时，不应重新预测80组测试数据');
    el('neighbors').value = 1; el('neighbors').oninput({ target: el('neighbors') }); check(demo.snapshot.neighbors.length === 1, 'k应改变参与预测的近邻数');
  }
  if (p.manifest.sceneId === 'r3') {
    check(s.rows.length === 96 && finiteTree(s.scores), '96小时时序应完整有效');
    check(s.threshold > 0 && s.alarm !== null, '默认退化场景应该触发模型报警');
    const last = s.scores.at(-1); el('wear').value = 1.8; el('wear').oninput({ target: el('wear') }); check(demo.snapshot.scores.at(-1) > last, '退化增强必须增大末时刻异常分数');
  }
  if (p.manifest.sceneId === 'r4') {
    check(s.rows.length === 30 && s.rows.every(d => Number.isFinite(d.score)), '化验批次应包含有效分数');
    check(s.recall !== null && s.recall >= .6, '默认异常批次应该检出多数已知异常');
    check(s.rows[0].reasons[0].includes('密度'), '规则超限必须有具体指标依据');
    let scores = 0; const score = demo.model.score; demo.model.score = x => { scores++; return score(x); };
    demo.selectSample(5); el('threshold').value = .59; el('threshold').oninput({ target: el('threshold') });
    check(scores === 0, '选择样本与调整阈值应复用批次模型分数');
    check(demo.snapshot.selected === 5 && el('decision-trace').innerHTML.includes('三项均在教学范围内'), '联合异常应展示规则与模型的不同结论');
    const parsed = demo.parseCSV('sample,density,flash,sulfur\n"A,1",0.84,67,0.03\n'); check(parsed[1][0] === 'A,1', 'CSV应支持引号内逗号');
    await el('csv-file').onchange({ target: { files: [{ size: 90, text: async () => 'sample,density,flash,sulfur\nCSV-1,0.84,67,0.03\nCSV-2,0.91,67,0.03\n' }], value: 'test.csv' } });
    check(demo.snapshot.imported && demo.snapshot.rows.length === 2, '有效CSV应替换当前批次');
    check(demo.snapshot.recall === null, '没有真实标签的CSV不能展示虚构检出率');
    check(el('faults').disabled && demo.snapshot.precision === null, '导入批次应锁定教学生成器且不虚构精确率');
    await el('csv-file').onchange({ target: { files: [{ size: 60, text: async () => 'sample,density,flash\nCSV-1,0.84,67\n' }], value: 'invalid.csv' } });
    check(demo.snapshot.rows.length === 2 && el('feedback').textContent.includes('未导入'), '缺字段CSV应拒绝并保留原批次');
    await el('csv-file').onchange({ target: { files: [{ size: 65, text: async () => 'sample,density,flash,sulfur\nCSV-1,,67,0.03\n' }], value: 'empty.csv' } });
    check(demo.snapshot.rows.length === 2 && el('feedback').textContent.includes('缺少数值'), '空数值不应被静默转换成0');
    for (const invalid of ['', 'sample,density,flash,sulfur\nCSV,0x10,67,0.03', 'sample,density,density,flash,sulfur\nCSV,0.84,0.85,67,0.03']) {
      await el('csv-file').onchange({ target: { files: [{ size: invalid.length, text: async () => invalid }], value: 'invalid.csv' } });
      check(demo.snapshot.rows.length === 2 && el('feedback').textContent.includes('未导入'), '空CSV、十六进制与重复必需列必须拒绝并保留数据');
    }
    el('faults').value = 0; el('faults').oninput(); check(demo.snapshot.recall === null, '没有注入异常时不应伪造检出率');
  }
  if (p.manifest.sceneId === 'r5') {
    check(Math.abs(L.sum(s.contribution) - s.current.prediction) < 1e-8, '模型贡献与截距之和应等于预测值');
    check(s.testMAE < 1 && s.testCoverage >= 0 && s.testCoverage <= 1, '质量模型独立测试结果应有效');
    el('time').value = 0; el('time').oninput({ target: el('time') }); check(demo.snapshot.labMAE === null, '化验未返回前不应伪造基准误差');
    el('delay').value = 0; el('delay').oninput({ target: el('delay') }); check(demo.snapshot.hold[0] !== null, '零延迟时第一条化验应立即可见');
  }
  console.log(`通过 ${p.manifest.sceneId} ${p.folder} (${(bytes / 1024).toFixed(1)} KB)`);
}
const dataCtx = { localStorage: { getItem: () => null, setItem() {} }, document: { addEventListener() {} }, addEventListener() {}, btoa: s => Buffer.from(s, 'binary').toString('base64') }; dataCtx.window = dataCtx; vm.createContext(dataCtx);
for (const file of ['assets/data.js', 'assets/core/registry.js', 'assets/core/kit.js', 'assets/core/case-demo-host.js', 'assets/cases.bundle.js', 'assets/core/case-upload.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), dataCtx, { filename: file });
check(dataCtx.ATLAS.stages.length === 13, '必须保留全部13环节');
const importPackage = dataCtx.RefineryPackages.find(p => p.manifest.sceneId === 'r4');
const importedRecord = { v: 2, pkg: importPackage.manifest, files: importPackage.files, meta: { ...importPackage.manifest, id: 'qa-import-review' } };
dataCtx.localStorage.getItem = key => key === 'atlas.casepack.v2' ? JSON.stringify([importedRecord]) : null;
dataCtx.CaseImport.loadSaved();
const imported = dataCtx.Cases.get('qa-import-review');
check(imported.tabs.workflow.steps[0].figure.includes('<svg'), '导入后必须保留流程图字段');
check(imported.presentation.algorithm === importPackage.manifest.presentation.algorithm, '导入后必须保留案例算法与展示元数据');
for (const p of packages) { const def = dataCtx.Cases.get(p.manifest.id); check(dataCtx.Cases.validate(def).every(v => v.level !== 'error'), '原注册表必须认可案例'); const doc = dataCtx.CaseDemoHost.buildPageDoc({ files: dataCtx.RefineryPackages.find(x => x.manifest.id === p.manifest.id).files, demo: p.manifest.tabs.demo }, 'qa'); check(!/<(?:script|link)\b[^>]*\s(?:src|href)="(?:demo\.css|demo\.js|engine\.js)"/.test(doc), '导入宿主必须内联相对CSS与脚本'); check(doc.includes('window.__ASSETS__'), '宿主应提供资源表'); }
console.log(`全部通过：${checks} 项数值、数据划分、案例包及原框架契约检查。`);
