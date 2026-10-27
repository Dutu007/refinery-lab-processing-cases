(function () {
  'use strict';
  const A = window.ATLAS, Cases = window.Cases, Art = window.RefineryArt, root = document.getElementById('view'), esc = K.esc;
  const refining = A.index.byStage.refining;
  let mounted = null, previousPath = '', workflowIndex = 0, activeScene = null;
  const catalog = { search: '', stage: '', method: '', difficulty: '', pending: false };
  const readyFor = id => Cases.bySceneAll(id).filter(c => c.tabs && c.tabs.demo && typeof c.tabs.demo.mount === 'function');
  const completedScenes = () => A.allScenes.filter(s => readyFor(s.id).length);
  const primary = id => Cases.byScene(id);
  const presentation = c => c && c.presentation || {};
  const sceneMethods = (s, c) => {
    if (c) return c.methods && c.methods.length ? c.methods : s.methods || [];
    const cases = Cases.bySceneAll(s.id);
    return cases.length ? [...new Set(cases.flatMap(k => k.methods && k.methods.length ? k.methods : s.methods || []))] : s.methods || [];
  };
  const methodNames = keys => keys.map(k => A.methods[k] ? A.methods[k].name : k).join(' / ');
  const sceneURL = (id, tab = 'background', kase = '') => `#/scene/${encodeURIComponent(id)}?tab=${tab}${kase ? '&case=' + encodeURIComponent(kase) : ''}`;
  const route = () => { const h = location.hash.replace(/^#\/?/, '') || '', [p, q] = h.split('?'); return { path: p, parts: p.split('/').filter(Boolean), params: new URLSearchParams(q || '') }; };
  function header(active = 'overview') {
    return `<header class="site-header"><div class="page-width header-inner"><a class="brand" href="#/" aria-label="炼化实验室首页"><span class="brand-symbol">${Art.brand()}</span><span><strong class="brand-name">炼化实验室</strong><span class="brand-sub">REFINERY LAB / PROCESSING</span></span></a><nav class="header-nav" aria-label="主导航">${[['overview', '#/', '总览'], ['cases', '#/cases', '全部案例'], ['methods', '#/methods', '按方法找'], ['guide', '#/guide', '接入指南']].map(([key, url, label]) => `<a href="${url}" class="${active === key ? 'active' : ''}" ${active === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav><details class="mobile-menu"><summary aria-label="打开导航菜单">导航</summary><nav aria-label="移动端导航">${[['overview', '#/', '总览'], ['cases', '#/cases', '全部案例'], ['methods', '#/methods', '按方法找'], ['guide', '#/guide', '接入指南']].map(([key, url, label]) => `<a href="${url}" class="${active === key ? 'active' : ''}" ${active === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav></details><button class="add-case" data-import><span aria-hidden="true">＋</span>添加案例</button></div></header>`;
  }
  function footer() {
    return `<footer class="site-footer"><div class="page-width footer-inner"><div class="footer-brand"><span>炼化实验室</span><span>石油勘探开发的智能化可能性地图 · 加工专题</span></div><nav class="footer-links" aria-label="页尾导航"><a href="#/cases">全部案例</a><a href="#/methods">按方法找</a><a href="#/guide">接入指南</a><span>演示数据为合成数据</span></nav></div></footer>`;
  }
  function breadcrumb(items) { return `<nav class="breadcrumb" aria-label="面包屑"><a href="#/">总览</a>${items.map(([s, link]) => `<span>/</span>${link ? `<a href="${link}">${esc(s)}</a>` : `<b>${esc(s)}</b>`}`).join('')}</nav>`; }
  function row(s, index, opt = {}) {
    const c = opt.kase || primary(s.id), p = presentation(c), ready = !!(c && c.tabs && c.tabs.demo && typeof c.tabs.demo.mount === 'function'), methods = methodNames(sceneMethods(s, c));
    return `<a class="case-row ${ready ? '' : 'pending'}" href="${sceneURL(s.id, 'background', opt.kase ? c.id : '')}"><span class="row-no">${String(index + 1).padStart(2, '0')}</span>${opt.icon === false ? '' : `<span class="row-icon">${Art.icon(s.id)}</span>`}<span class="row-text"><h3>${esc(c ? c.title : s.name)}</h3><p>${esc(p.summary || s.point || '查看场景介绍')}</p></span><span class="row-method">${esc(ready ? p.algorithm || methods : c ? '已接入 · 暂无演示' : '暂无可运行案例')}</span>${opt.stage ? `<span class="row-stage">${esc(s.stageName || (A.index.byStage[s.stageId] || {}).name || '')}</span>` : ''}<span class="row-arrow" aria-hidden="true">↗</span></a>`;
  }
  function homepage() {
    const count = completedScenes().filter(s => s.stageId === 'refining').length;
    document.title = '炼化实验室 · 石油加工交互案例';
    root.innerHTML = header() + `<main class="page-width" id="main-content"><section class="hero"><div class="hero-intro"><div class="hero-kicker"><span>13</span>石油加工 · 交互案例集</div><h1>原油怎么分离，<br><em>参数怎么选择？</em></h1><p class="hero-copy">从常减压分离到产品质量，拆开看懂5个加工问题。调一组参数，观察模型的计算过程，再比较结果。</p><div class="hero-actions"><a class="primary-link" href="${sceneURL('r1')}">从常减压开始<span>→</span></a><a class="text-link" href="#/cases">查看全部案例<span>↗</span></a></div><div class="hero-meta"><div><strong>${String(count).padStart(2, '0')}</strong><span>可运行场景</span></div><div><strong>13</strong><span>流程环节</span></div><div><strong>03</strong><span>内容分区</span></div></div></div><div><figure class="hero-visual">${Art.plant()}</figure><div class="hero-figure-caption"><span>五个案例在炼化流程中的位置</span><span>FIG. 01 / PROCESS MAP</span></div></div></section>
    <section class="index-panel" aria-label="全流程分类"><div class="index-head"><h2>全流程索引</h2><p>当前专题：第13环节 · 加工</p><span class="section-code">EXPLORATION → REFINING</span></div><nav class="stage-rail" aria-label="13个石油作业环节">${A.stages.map(st => `<a class="stage-stop ${st.id === 'refining' ? 'active' : ''}" href="#/stage/${st.id}" ${st.id === 'refining' ? 'aria-current="true"' : ''}><span class="stage-index">${String(st.idx).padStart(2, '0')}</span>${esc(st.name)}</a>`).join('')}</nav></section>
    <section class="case-section"><div class="section-heading"><div><span class="section-code orange">01 / CASE STUDIES</span><h2>加工环节的5个场景</h2><p>先理解业务，再看方法怎样介入。</p></div><a class="text-link" href="#/stage/refining">查看加工分类<span>↗</span></a></div><div class="case-list-layout"><aside class="case-list-note"><h3>看流程。<br>调参数。<br>比较计算结果。</h3><p>每个案例都说明输入数据、计算方法和结果边界。图表随输入变化，指标由程序实际计算。</p><div class="note-fractions"><span><i></i>专业背景</span><span><i></i>案例流程</span><span><i></i>交互演示</span></div></aside><div class="case-rows">${refining.scenes.map((s, i) => row(s, i)).join('')}</div></div></section>
    <section class="learning-strip" aria-label="案例内容说明"><div class="learning-item"><span>01</span><div><h3>专业背景：先看装置在做什么</h3><p>用分馏塔、裂化分子和采样时间线，把专业概念画出来。</p></div></div><div class="learning-item"><span>02</span><div><h3>案例流程：逐步看输入与输出</h3><p>点开数据、建模、计算和评价步骤，查看每一步的目的和易错点。</p></div></div><div class="learning-item"><span>03</span><div><h3>交互演示：让结果随参数变化</h3><p>调整工况与阈值，查看预测、误差和约束；需要时可导出计算记录。</p></div></div></section>
    <section class="contribute"><div><h2>把你的案例加进来。</h2><p>沿用原网站的案例包格式，选择文件夹即可校验、预览和添加。</p></div><button data-import>添加一个案例<span aria-hidden="true">＋</span></button></section></main>` + footer();
  }
  function sidebar(sceneId) {
    const current = A.index.byScene[sceneId] || {};
    const stage = A.index.byStage[current.stageId] || refining;
    return `<aside class="studio-side"><div class="side-inner"><div class="side-heading">${esc((stage.en || stage.name || 'CASE').toUpperCase())} / ${stage.scenes.length} SCENES</div>${stage.scenes.map((s, i) => `<a class="side-case ${s.id === sceneId ? 'active' : ''}" href="${sceneURL(s.id)}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(presentation(primary(s.id)).short || s.name)}</a>`).join('')}<div class="side-info"><b>演示怎样计算？</b>数据、模型训练和图表都在浏览器中运行。输入会参与实际计算，数据使用固定随机种子生成。<br><br><a href="#/guide">查看案例接入说明 ↗</a></div></div></aside>`;
  }
  function renderBackground(c) {
    const b = c.tabs.background;
    if (!b) return '<div class="catalog-empty">该案例没有专业背景内容。</div>';
    return `<div class="background-lede">${esc(b.lede || '')}</div>${b.judge && b.judge.length ? `<div class="judge-grid">${b.judge.map(j => `<div class="judge-cell"><span>${esc(j.label)}</span><strong>${esc(j.value)}</strong><p>${esc(j.desc || '')}</p></div>`).join('')}</div>` : ''}<div class="background-sections">${(b.sections || []).map((s, i) => `<section class="background-section"><div class="section-number">${String(s.no || i + 1).padStart(2, '0')}</div><div><span class="section-code">${esc(s.en || 'BACKGROUND')}</span><h2>${esc(s.title)}</h2><div class="section-body">${s.html || esc(s.body || '')}</div></div></section>`).join('')}</div>`;
  }
  function stepPanel(c, index) {
    const steps = c.tabs.workflow.steps || [], step = steps[index];
    if (!step) return '';
    return `<span class="section-code orange">STEP ${String(index + 1).padStart(2, '0')} / ${esc(step.role || 'WORKFLOW')}</span><h3>${esc(step.name)}</h3>${step.figure || (['r1', 'r2', 'r3', 'r4', 'r5'].includes(c.sceneId) ? Art.workflow(c.sceneId, Math.min(index, 4)) : '')}<p class="step-description">${K.rich(step.do || '')}</p>${step.effect ? `<div class="step-result"><span>这步输出</span><div>${K.rich(step.effect)}</div></div>` : ''}${step.trap ? `<div class="step-trap"><span>容易出错</span><div>${K.rich(step.trap)}</div></div>` : ''}`;
  }
  function renderWorkflow(c) {
    const w = c.tabs.workflow;
    if (!w) return '<div class="catalog-empty">该案例尚未提供流程说明。</div>';
    workflowIndex = 0;
    return `<div class="workflow-top"><span class="section-code orange">HOW IT WORKS</span><h2>${esc(w.title || '案例流程')}</h2>${(Array.isArray(w.lead) ? w.lead : [w.lead || '']).map(s => `<p>${esc(s)}</p>`).join('')}</div>${w.stats ? `<div class="workflow-stats">${w.stats.map(([a, b]) => `<div>${esc(a)}<strong>${esc(b)}</strong></div>`).join('')}</div>` : ''}<div class="workflow-explorer"><div class="workflow-steps" role="tablist" aria-label="案例流程步骤" aria-orientation="vertical">${(w.steps || []).map((s, i) => `<button class="workflow-step ${i === 0 ? 'active' : ''}" data-step="${i}" role="tab" id="step-${i}" aria-controls="step-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}"><span>${String(i + 1).padStart(2, '0')}</span><div>${esc(s.name)}<small>${esc(s.role || '')}</small></div></button>`).join('')}</div><section class="step-panel" id="step-panel" role="tabpanel" aria-labelledby="step-0">${stepPanel(c, 0)}</section></div>${w.metrics ? `<section class="workflow-metrics"><h3>${esc(w.metrics.title || '评价方法')}</h3><div>${w.metrics.html || ''}</div></section>` : ''}${w.fails && w.fails.length ? `<div class="failure-grid">${w.fails.map((f, i) => `<section class="failure-item"><span>CHECK ${String(i + 1).padStart(2, '0')}</span><h4>${esc(f.name)}</h4><p>${esc(f.why)}</p></section>`).join('')}</div>` : ''}`;
  }
  function selectedCase(id, params) {
    const choices = Cases.bySceneAll(id);
    return choices.find(c => c.id === params.get('case')) || choices[0];
  }
  function requestedTab(params) { return ['background', 'workflow', 'demo'].includes(params.get('tab')) ? params.get('tab') : 'background'; }
  function scenePage(id, params) {
    const s = A.index.byScene[id];
    if (!s) return notFound();
    const alternatives = Cases.bySceneAll(id), c = selectedCase(id, params), p = presentation(c), tab = requestedTab(params);
    document.title = `${c ? c.title : s.name} · 炼化实验室`;
    const tabs = [['background', '01', '专业背景'], ['workflow', '02', '案例流程'], ['demo', '03', '交互演示']];
    root.innerHTML = header('cases') + `<main class="page-width" id="main-content"><section class="page-top">${breadcrumb([[s.stageName, '#/stage/' + s.stageId], [s.name]])}<div class="scene-top"><div class="scene-title-block"><span class="section-code orange">${esc(p.en || (A.index.byStage[s.stageId] || {}).en || 'CASE STUDY')}</span><h1>${esc(c ? c.title : s.name)}</h1><p class="page-desc">${esc(p.question || s.point)}</p><div class="scene-meta"><span class="plain-tag">${String(s.stageIdx).padStart(2, '0')} ${esc(s.stageName)}</span><span class="plain-tag ${c ? 'ready' : ''}">${readyFor(id).length ? '可运行案例' : c ? '已接入 · 暂无演示' : '候选场景'}</span><span>${esc(p.algorithm || methodNames(sceneMethods(s, c)))}</span><span>难度：${esc(p.difficulty || s.diff)}</span>${c ? `<span>${c.imported ? '本地导入' : '内置案例'}</span>` : ''}</div></div><div class="scene-glyph">${Art.icon(s.id)}</div></div></section><div class="studio-layout">${sidebar(id)}<div class="studio-main">${alternatives.length > 1 ? `<div class="case-switcher"><label for="case-variant">这个场景有 ${alternatives.length} 个案例</label><select id="case-variant">${alternatives.map(x => `<option value="${esc(x.id)}" ${c.id === x.id ? 'selected' : ''}>${esc(x.title)}${x.imported ? '（导入）' : ''}</option>`).join('')}</select></div>` : ''}${c ? `<nav class="case-tabs" role="tablist" aria-label="案例内容">${tabs.map(([key, no, label]) => `<a role="tab" id="tab-${key}" aria-controls="panel-${key}" aria-selected="${tab === key}" tabindex="${tab === key ? '0' : '-1'}" href="${sceneURL(id, key, c.id)}" class="${tab === key ? 'active' : ''}"><span>${no}</span>${label}</a>`).join('')}<span class="tab-note">READ → FOLLOW → TRY</span></nav><div id="case-panel">${tabs.map(([key]) => `<section class="case-panel-section" id="panel-${key}" role="tabpanel" aria-labelledby="tab-${key}" hidden></section>`).join('')}</div><nav class="demo-next" aria-label="相邻内容"><a href="#/stage/${s.stageId}">← 返回${esc(s.stageName)}分类</a>${nextSceneLink(id)}</nav>` : pendingScene(s)}</div></div></main>` + footer();
    if (!c) return;
    activeScene = { id, def: c, tab, loaded: new Set() };
    const variant = document.getElementById('case-variant'); if (variant) variant.onchange = () => { location.hash = sceneURL(id, activeScene.tab, variant.value); };
    bindTabKeyboard('.case-tabs', 'a');
    activateSceneTab(tab);
  }
  function activateSceneTab(tab) {
    const { id, def: c, loaded } = activeScene;
    activeScene.tab = tab;
    document.querySelectorAll('.case-tabs [role="tab"]').forEach(el => { const on = el.id === 'tab-' + tab; el.classList.toggle('active', on); el.setAttribute('aria-selected', String(on)); el.tabIndex = on ? 0 : -1; });
    ['background', 'workflow', 'demo'].forEach(key => { document.getElementById('panel-' + key).hidden = key !== tab; });
    const panel = document.getElementById('panel-' + tab);
    if (!loaded.has(tab)) {
      loaded.add(tab);
      if (tab === 'background') panel.innerHTML = renderBackground(c);
      else if (tab === 'workflow') {
        panel.innerHTML = renderWorkflow(c);
        panel.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => setStep(+b.dataset.step, c)));
        const list = panel.querySelector('.workflow-steps');
        if (list) list.onkeydown = e => {
          if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
          const count = (c.tabs.workflow.steps || []).length; if (!count) return;
          e.preventDefault(); const n = e.key === 'Home' ? 0 : e.key === 'End' ? count - 1 : (workflowIndex + (['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1) + count) % count;
          setStep(n, c); panel.querySelector(`[data-step="${n}"]`).focus();
        };
      } else {
        const demo = c.tabs.demo;
        panel.innerHTML = `<div class="demo-intro"><p>${esc(demo && demo.intro || presentation(c).summary || '')}</p><span>${c.imported ? '本地导入案例' : '教学合成数据 · 实际计算'}</span></div><div id="demo-host" class="demo-host"></div>`;
        const host = document.getElementById('demo-host');
        if (demo && typeof demo.mount === 'function') {
          mounted = demo;
          try { const live = demo.mount(host, { scene: A.index.byScene[id], kase: c, atlas: A }); if (live && typeof live.unmount === 'function' && !demo.unmount) mounted = live; }
          catch (e) { host.innerHTML = `<p class="cd-err">演示未能运行：${esc(e.message)}</p>`; }
        } else host.innerHTML = '<p class="cd-err">这个案例没有提供可运行演示。</p>';
      }
    }
    if (tab !== 'demo') { const frame = document.querySelector('#demo-host iframe'); if (frame) frame.contentWindow.postMessage({ __refineryPause: true }, '*'); }
  }
  function setStep(index, c) {
    workflowIndex = index;
    document.querySelectorAll('[data-step]').forEach(b => { const on = +b.dataset.step === index; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    const panel = document.getElementById('step-panel'); panel.innerHTML = stepPanel(c, index); panel.setAttribute('aria-labelledby', 'step-' + index);
  }
  function bindTabKeyboard(container, item) {
    const el = document.querySelector(container); if (!el) return;
    el.onkeydown = e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; const tabs = [...el.querySelectorAll(item)], i = tabs.indexOf(document.activeElement); if (i < 0) return; e.preventDefault(); const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; tabs[n].focus(); tabs[n].click(); };
  }
  function nextSceneLink(id) {
    const current = A.index.byScene[id] || {}, stage = A.index.byStage[current.stageId] || refining, index = stage.scenes.findIndex(s => s.id === id), next = stage.scenes[index + 1];
    return index >= 0 && next ? `<a href="${sceneURL(next.id)}">下一个：${esc(presentation(primary(next.id)).short || next.name)} →</a>` : '<a href="#/cases">查看全部案例 →</a>';
  }
  function pendingScene(s) {
    return `<section class="pending-scene"><span class="section-code orange">SCENE INDEX / NO CASE YET</span><h2>该场景还没有接入演示。</h2><p>${esc(s.intro || '')}</p><p><b>可以解决的问题：</b>${esc(s.problem || s.point)}</p><p><b>方法介入点：</b>${esc(s.point)}</p><div class="guide-actions"><button data-import data-scene="${esc(s.id)}">为此场景添加案例</button><a class="text-link" href="#/cases">查看已有的可运行案例 →</a></div><div class="section-body">${tableFromData(s.data || [])}</div></section>`;
  }
  function tableFromData(data) { return `<div class="table-wrap"><table class="context-table"><thead><tr><th>数据类型</th><th>规模 / 规格</th><th>标签或条件</th></tr></thead><tbody>${data.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
  function catalogPage(params) {
    Object.assign(catalog, { search: params.get('q') || '', stage: params.get('stage') || '', method: params.get('method') || '', difficulty: params.get('difficulty') || '', pending: params.get('pending') === '1' });
    document.title = '全部案例 · 炼化实验室';
    root.innerHTML = header('cases') + `<main class="page-width" id="main-content"><section class="page-top">${breadcrumb([['全部案例']])}<span class="section-code orange">CASE LIBRARY</span><h1>选择一个具体问题，开始计算。</h1><p class="page-desc">当前提供加工环节的5个案例。也可以按环节、方法和难度筛选，或导入其他同学的案例。</p></section><div class="catalog-shell"><div class="catalog-filters"><label class="filter-control">搜索案例<input id="case-search" type="search" placeholder="例如：收率、振动、化验、回归" value="${esc(catalog.search)}"></label><label class="filter-control">所属环节<select id="stage-filter"><option value="">全部环节</option>${A.stages.map(st => `<option value="${st.id}" ${catalog.stage === st.id ? 'selected' : ''}>${String(st.idx).padStart(2, '0')} ${esc(st.name)}</option>`).join('')}</select></label><label class="filter-control">AI方法<select id="method-filter"><option value="">全部方法</option>${Object.keys(A.methods).map(k => `<option value="${k}" ${catalog.method === k ? 'selected' : ''}>${esc(A.methods[k].name)}</option>`).join('')}</select></label><label class="filter-control">技术难度<select id="difficulty-filter"><option value="">全部难度</option>${['低', '中', '高'].map(d => `<option ${catalog.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label></div><div class="catalog-status"><span id="result-count" role="status" aria-live="polite"></span><div class="catalog-actions"><button class="filter-reset" id="reset-catalog" type="button">清空筛选</button><label><input id="include-pending" type="checkbox" ${catalog.pending ? 'checked' : ''}>同时查看尚未接入案例的候选场景</label></div></div><div class="catalog-rows" id="catalog-results"></div><div id="blocked-cases"></div></div></main>` + footer();
    const ids = { 'case-search': 'search', 'stage-filter': 'stage', 'method-filter': 'method', 'difficulty-filter': 'difficulty', 'include-pending': 'pending' };
    Object.entries(ids).forEach(([id, key]) => { document.getElementById(id).addEventListener(id === 'case-search' ? 'input' : 'change', e => { catalog[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; syncCatalogURL(); catalogResults(); }); });
    document.getElementById('reset-catalog').onclick = resetCatalog;
    catalogResults();
  }
  function syncCatalogURL() {
    const params = new URLSearchParams();
    [['q', catalog.search], ['stage', catalog.stage], ['method', catalog.method], ['difficulty', catalog.difficulty], ['pending', catalog.pending ? '1' : '']].forEach(([k, value]) => { if (value) params.set(k, value); });
    history.replaceState(null, '', '#/cases' + (params.size ? '?' + params : ''));
  }
  function resetCatalog() {
    history.replaceState(null, '', '#/cases');
    catalogPage(new URLSearchParams());
  }
  function catalogResults() {
    let items = Cases.list().filter(c => catalog.pending || c.tabs && c.tabs.demo && typeof c.tabs.demo.mount === 'function').map(c => ({ s: A.index.byScene[c.sceneId], c })).filter(x => x.s);
    if (catalog.pending) items.push(...A.allScenes.filter(s => !primary(s.id)).map(s => ({ s, c: null })));
    const q = catalog.search.trim().toLowerCase();
    items = items.filter(({ s, c }) => {
      const p = presentation(c), text = [s.name, c && c.title, p.algorithm, p.summary, s.point, s.stageName, methodNames(sceneMethods(s, c)), c && c.id].filter(Boolean).join(' ').toLowerCase();
      return (!q || text.includes(q)) && (!catalog.stage || s.stageId === catalog.stage) && (!catalog.method || sceneMethods(s, c).includes(catalog.method)) && (!catalog.difficulty || (p.difficulty || s.diff) === catalog.difficulty);
    });
    document.getElementById('result-count').textContent = `${items.length} 条结果 · ${items.filter(x => x.c).length} 个已接入案例`;
    document.getElementById('catalog-results').innerHTML = items.length ? items.map(({ s, c }, i) => row(s, i, { kase: c, stage: true }) + (c ? `<div class="catalog-manage"><span>${c.imported ? '本地导入' : '站点内置'}</span><span>${esc(presentation(c).dataset || (c.imported ? '由案例作者提供' : '教学合成数据'))}</span><span>${esc(c.version || '1.0.0')}</span><button data-remove-case="${esc(c.id)}">${c.imported ? '移除此案例' : '隐藏此案例'}</button></div>` : '')).join('') : '<div class="catalog-empty"><h2>没有找到匹配内容。</h2><p>试试清空搜索词，或选择其他环节与方法。</p><button class="text-link" id="clear-filters">清空筛选 →</button></div>';
    const clear = document.getElementById('clear-filters'); if (clear) clear.onclick = resetCatalog;
    const blocked = window.CaseImport.blockedList();
    document.getElementById('blocked-cases').innerHTML = blocked.length ? `<section class="blocked-cases"><h2>已隐藏的内置案例</h2>${blocked.map(id => { const p = (window.RefineryPackages || []).find(p => p.manifest.id === id); return `<div class="blocked-case"><span>${esc(p ? p.manifest.title : id)}</span><button data-restore-case="${esc(id)}">恢复</button></div>`; }).join('')}</section>` : '';
  }
  function stagePage(id) {
    const st = A.index.byStage[id]; if (!st) return notFound();
    document.title = `${st.name} · 流程分类 · 炼化实验室`;
    const n = st.scenes.filter(s => primary(s.id)).length;
    root.innerHTML = header('cases') + `<main class="page-width" id="main-content"><section class="page-top">${breadcrumb([['流程分类'], [st.name]])}<span class="section-code orange">STAGE ${String(st.idx).padStart(2, '0')} / ${esc(st.en.toUpperCase())}</span><h1>${esc(st.name)}环节</h1><p class="page-desc">${esc(st.blurb)}</p></section><div class="stage-browser"><nav class="stage-sidebar" aria-label="切换流程环节">${A.stages.map(s => `<a href="#/stage/${s.id}" class="${s.id === id ? 'active' : ''}" ${s.id === id ? 'aria-current="page"' : ''}><span>${String(s.idx).padStart(2, '0')}</span>${esc(s.name)}<span>${s.scenes.length}</span></a>`).join('')}</nav><section><p class="stage-summary">${st.scenes.length} 个候选场景 · ${n} 个场景已接入案例${n ? '' : '。点击场景可查看背景，或为它添加案例。'}</p><div class="stage-scenes">${st.scenes.map((s, i) => row(s, i, { icon: false })).join('')}</div></section></div></main>` + footer();
  }
  function methodsPage() {
    document.title = '按AI方法找场景 · 炼化实验室';
    root.innerHTML = header('methods') + `<main class="page-width" id="main-content"><section class="page-top">${breadcrumb([['按方法找']])}<span class="section-code orange">METHOD INDEX</span><h1>先选方法，再找它能处理的问题。</h1><p class="page-desc">保留原项目的五类方法索引。一个场景可以涉及多种方法，场景数量与可运行案例数量分开统计。</p></section><section class="method-list">${Object.keys(A.methods).map(k => { const m = A.methods[k], scenes = A.allScenes.filter(s => sceneMethods(s).includes(k)), available = scenes.filter(s => primary(s.id)).length; return `<a class="method-row" href="#/method/${k}"><span class="method-abbr">${esc(m.abbr)}</span><h2>${esc(m.name)}</h2><p>${esc(m.desc)}</p><span class="method-count"><b>${scenes.length}</b>候选场景<br>${available}个已有案例</span><span class="row-arrow">↗</span></a>`; }).join('')}</section></main>` + footer();
  }
  function methodPage(key) {
    const method = A.methods[key]; if (!method) return notFound();
    const scenes = A.allScenes.filter(s => sceneMethods(s).includes(key));
    document.title = `${method.name}的应用场景 · 炼化实验室`;
    root.innerHTML = header('methods') + `<main class="page-width" id="main-content"><section class="page-top">${breadcrumb([['按方法找', '#/methods'], [method.name]])}<span class="section-code orange">${esc(method.abbr)} / APPLICATION SCENES</span><h1>${esc(method.name)}可以用在哪些场景？</h1><p class="page-desc">${esc(method.desc)}</p></section><div class="catalog-shell"><div class="catalog-status"><span>${scenes.length} 个候选场景 · ${scenes.filter(s => primary(s.id)).length} 个场景已有案例</span><a class="text-link" href="#/cases?method=${key}">只看可运行案例 →</a></div>${A.stages.filter(st => scenes.some(s => s.stageId === st.id)).map(st => `<section class="method-stage"><div class="index-head" style="margin-top:25px"><h2>${String(st.idx).padStart(2, '0')} ${esc(st.name)}</h2></div><div class="stage-scenes">${scenes.filter(s => s.stageId === st.id).map((s, i) => row(s, i, { icon: false })).join('')}</div></section>`).join('')}</div></main>` + footer();
  }
  function guidePage() {
    document.title = '案例接入指南 · 炼化实验室';
    root.innerHTML = header('guide') + `<main class="page-width" id="main-content"><section class="page-top">${breadcrumb([['接入指南']])}<span class="section-code orange">ADD A CASE PACKAGE</span><h1>一个文件夹，就是一个案例。</h1><p class="page-desc">沿用原项目的case.json清单与demo目录。原示例和其他同学按这一格式制作的案例，都可以通过“添加案例”接入。</p></section><div class="guide-layout"><div class="guide-content"><section class="guide-step"><span>01</span><div><h2>准备清单与独立演示</h2><p>清单至少包含唯一id、对应场景sceneId、标题和专业背景。完整作业案例还要有案例流程与可运行演示。点击模板按钮可以下载原框架格式的案例模板。</p><div class="guide-actions"><button data-dl-template>下载案例包模板</button><button data-import>添加案例</button></div></div></section><section class="guide-step"><span>02</span><div><h2>把案例绑定到正确场景</h2><p>本专题的场景编号与原网站保持一致。不要把两个不同案例设成相同id；如果站点已经内置同id案例，导入时可在表单中改成新的id。</p><table class="field-table"><thead><tr><th>场景编号</th><th>加工场景</th></tr></thead><tbody>${refining.scenes.map(s => `<tr><td><code>${s.id}</code></td><td>${esc(s.name)}</td></tr>`).join('')}</tbody></table></div></section><section class="guide-step"><span>03</span><div><h2>选择整个文件夹，先校验再添加</h2><p>点击“添加案例”，拖入整个案例文件夹，或使用“选择文件夹”。导入器会检查清单、场景、背景、流程与演示资源。可以先试跑，修复红色错误后点击“校验并添加”。</p><ul><li>整页模式：使用<code>demo/index.html</code>，CSS与JS采用相对路径。</li><li>模块模式：只有<code>demo.js</code>时，保留原项目的mount / unmount约定。</li><li>单个案例包上限6MB，避免把大视频或无关素材放进包里。</li></ul></div></section><section class="guide-step"><span>04</span><div><h2>区分本地导入与站点发布</h2><p>导入案例保存在当前浏览器；换浏览器、换设备需要重新导入。本站五个案例已随站点打包，首次访问即可使用。</p><p>修改本项目内置案例后，运行<code>node tools/build.mjs</code>更新<code>assets/cases.bundle.js</code>。随后把整个workspace目录作为静态网站发布，不需要后端。</p></div></section><section class="guide-step"><span>05</span><div><h2>按“大类别-小类别”分别提交</h2><p><code>cases/</code>下已经按场景分好五个文件夹。每个文件夹包含完整清单与独立演示，可以单独压缩后提交。不要只压缩demo，也不要把五个案例合成一个包。</p></div></section></div><aside class="guide-aside"><h3>标准案例包结构</h3><pre class="file-tree">加工-某个具体场景/\n├─ case.json\n├─ README.txt\n└─ demo/\n   ├─ index.html\n   ├─ demo.css\n   ├─ engine.js\n   └─ demo.js</pre><p>本项目每个案例都可以独立运行，不依赖主站私有接口，也没有CDN或后端依赖。</p><h3 style="margin-top:25px">三个内容分区</h3><p><b>专业背景</b>：解释工艺、业务问题、数据与方法边界。</p><p><b>案例流程</b>：说明每步输入、输出与常见错误。</p><p><b>交互演示</b>：用参数变化驱动计算与图表，给出可复核的结果。</p></aside></div></main>` + footer();
  }
  function notFound() { document.title = '未找到页面 · 炼化实验室'; root.innerHTML = header() + '<main id="main-content" class="page-width loading"><span class="section-code orange">404 / PAGE NOT FOUND</span><h1>没有找到这个页面。</h1><p>场景可能已被移除，或链接中的编号不正确。</p><a class="text-link" href="#/">返回总览 →</a></main>' + footer(); }
  function render() {
    const r = route();
    if (activeScene && r.parts[0] === 'scene' && r.parts[1] === activeScene.id && selectedCase(activeScene.id, r.params) === activeScene.def) {
      activateSceneTab(requestedTab(r.params));
      const tab = document.querySelector('.case-tabs [aria-selected="true"]'); if (tab) tab.focus({ preventScroll: true });
      return;
    }
    activeScene = null;
    if (mounted) { try { if (typeof mounted.unmount === 'function') mounted.unmount(); } catch (_) { /* A third-party teardown must not block navigation. */ } mounted = null; }
    const changed = previousPath !== r.path; previousPath = r.path;
    if (!r.parts.length) homepage();
    else if (r.parts[0] === 'scene') scenePage(r.parts[1], r.params);
    else if (r.parts[0] === 'cases') catalogPage(r.params);
    else if (r.parts[0] === 'stage') stagePage(r.parts[1]);
    else if (r.parts[0] === 'methods') methodsPage();
    else if (r.parts[0] === 'method') methodPage(r.parts[1]);
    else if (r.parts[0] === 'guide') guidePage();
    else notFound();
    if (changed) window.scrollTo({ top: 0, behavior: 'instant' });
    if (r.parts[0] === 'scene' && r.params.has('tab')) { const selected = document.querySelector('[role="tab"][aria-selected="true"]'); if (selected && document.activeElement === document.body) selected.focus({ preventScroll: true }); }
  }
  document.querySelector('.skip-link').addEventListener('click', e => { e.preventDefault(); const main = document.getElementById('main-content'); if (main) { main.tabIndex = -1; main.focus({ preventScroll: true }); main.scrollIntoView(); } });
  window.addEventListener('hashchange', render);
  window.addEventListener('pagehide', () => { if (mounted && typeof mounted.unmount === 'function') mounted.unmount(); });
  render();
})();
