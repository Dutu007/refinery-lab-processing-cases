/* Original SVG illustrations. Labels and geometry are part of the page, not raster images. */
(function (g) {
  'use strict';
  const green = '#315d50', orange = '#d75736', muted = '#7a897e', line = '#d7dfd1', cream = '#f3f5ed';
  const t = (x, y, label, size = 12, color = muted, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Microsoft YaHei,sans-serif" ${extra}>${label}</text>`;
  const wrap = (body, label, w = 660, h = 310) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
  const arrow = (x, y, color = orange) => `<path d="M${x - 5} ${y - 4}L${x} ${y}L${x - 5} ${y + 4}" fill="none" stroke="${color}" stroke-width="1.6"/>`;
  function brand() { return wrap(`<path d="M8 35V12l8-5 8 5v23M11 17h10m-10 6h10m-10 6h10M30 35V19l7-4 7 4v16M33 24h8m-8 6h8M4 35h45" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 24h6m14 5h5" stroke="${orange}" stroke-width="3"/>`, '炼化实验室', 54, 43); }
  function plant() {
    function column(x, y, w, h, fill, id) {
      return `<g><path d="M${x} ${y}v${h}c0 12 ${w} 12 ${w} 0V${y}" fill="${fill}" stroke="${green}" stroke-width="1.3"/><ellipse cx="${x + w / 2}" cy="${y}" rx="${w / 2}" ry="10" fill="#fafbf5" stroke="${green}" stroke-width="1.3"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${x + 6} ${y + 20 + i * (h - 35) / 6}h${w - 12}" stroke="${green}" opacity=".32"/>`).join('')}<path d="M${x + w + 7} ${y + 5}v${h - 2}m-4 -6h8m-8 -15h8m-8 -15h8m-8 -15h8m-8 -15h8m-8 -15h8m-8 -15h8m-8 -15h8" fill="none" stroke="${green}" opacity=".5"/>${t(x + w / 2, y + h + 27, id, 10, green, 'text-anchor="middle"')}</g>`;
    }
    const body = `<defs><pattern id="plant-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#ccdac9" stroke-width=".6"/></pattern><linearGradient id="metal" x1="0" x2="1"><stop stop-color="#c6d3bd"/><stop offset=".48" stop-color="#f5f7eb"/><stop offset="1" stop-color="#d9e2cd"/></linearGradient></defs>
      <rect width="720" height="420" fill="#edf1e6"/>
      <rect x="18" y="16" width="684" height="383" fill="url(#plant-grid)" opacity=".7"/>
      <path d="M25 38V20h18m634 0h18v18M25 365v18h18m634 0h18v-18" stroke="#a6b6a0" fill="none"/>
      ${t(42, 43, 'PROCESS DIAGRAM / REFINERY', 10, green)}${t(674, 43, '13', 13, orange, 'text-anchor="end"')}
      <path d="M71 304L336 365L654 281L389 221Z" fill="#dfe7d7" stroke="#bdcdb5"/>
      <path d="M71 304v10l265 63v-12M336 377l318-84v-12" fill="none" stroke="#aabda1"/>
      <path d="M103 302L365 362M139 291L405 351M180 280L449 339M221 269L489 329M267 257L536 316M306 247L576 306M348 236L618 293M107 313L423 230M173 329L490 246M242 346L558 263M308 361L625 279" stroke="#c6d4bf" fill="none" stroke-width=".6"/>
      ${column(188, 111, 58, 172, 'url(#metal)', 'CDU-01')}
      ${column(287, 157, 48, 147, 'url(#metal)', 'VDU-01')}
      <path d="M396 178v-39c0-28 66-28 66 0v39l-11 14v87c0 16-45 16-45 0v-87Z" fill="url(#metal)" stroke="${green}" stroke-width="1.4"/>
      <ellipse cx="429" cy="141" rx="33" ry="13" fill="#e7eedf" stroke="${green}"/>
      <path d="M410 208h37m-37 14h37m-37 14h37m-37 14h37M470 154v132" stroke="${green}" opacity=".4"/>
      ${t(431, 310, 'FCC-01', 10, green, 'text-anchor="middle"')}
      <path d="M555 271v-40c0-22 86-22 86 0v40c0 21-86 21-86 0" fill="url(#metal)" stroke="${green}" stroke-width="1.3"/>
      <ellipse cx="598" cy="232" rx="43" ry="14" fill="#e6ecdc" stroke="${green}"/>
      <path d="M559 243c23 12 56 12 78 0" fill="none" stroke="${green}" opacity=".3"/>
      ${t(597, 304, 'PRODUCT', 10, green, 'text-anchor="middle"')}
      <g fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="M79 269h68v-45h41M246 181h30v-66h120v61M246 268h26v21h15M335 266h32v-27h39M452 256h62v-18h41" stroke="#fbfcf8" stroke-width="9"/><path class="pipe-flow" d="M79 269h68v-45h41M246 181h30v-66h120v61M246 268h26v21h15M335 266h32v-27h39M452 256h62v-18h41" stroke="${orange}" stroke-width="3.3"/>
      <path d="M217 111V79h95v78M429 122V94h90v137M554 253h-25v51H360v-27h-25" stroke="${green}" stroke-width="2"/>
      <path d="M138 269v17h29" stroke="${green}" stroke-width="2"/></g>
      <g fill="#f7f9ef" stroke="${green}"><circle cx="147" cy="246" r="8"/><path d="M142 241l10 10m0-10l-10 10"/><circle cx="367" cy="258" r="8"/><path d="M362 253l10 10m0-10l-10 10"/></g>
      <g transform="translate(321 314)"><path d="M0 20h60l9 8H-5Z" fill="#a6bfa1"/><circle cx="18" cy="10" r="13" fill="#eaf0df" stroke="${green}"/><circle cx="18" cy="10" r="5" fill="#abc39f"/><rect x="30" y="0" width="31" height="20" rx="3" fill="#c9d7bd" stroke="${green}"/><path d="M38 4v12m7-12v12m7-12v12" stroke="${green}" opacity=".5"/></g>
      <g stroke="${green}" fill="#f7f9ef"><path d="M242 94l22-27h85" stroke-dasharray="3 3" fill="none"/><circle cx="245" cy="94" r="3"/><path d="M429 117l33-46h39" stroke-dasharray="3 3" fill="none"/><circle cx="429" cy="117" r="3"/></g>
      <a href="#/scene/r1" aria-label="打开常减压装置操作优化"><g class="plant-label"><rect x="99" y="60" width="164" height="32" rx="3" fill="#fffef8" stroke="#cad5c2"/>${t(111, 81, '01', 11, orange)}${t(139, 81, '常减压操作优化', 12, green)}<path d="M207 92v18" stroke="${green}" stroke-dasharray="2 3"/></g></a>
      <a href="#/scene/r2" aria-label="打开催化裂化产物预测"><g class="plant-label"><rect x="353" y="57" width="158" height="32" rx="3" fill="#fffef8" stroke="#cad5c2"/>${t(365, 78, '02', 11, orange)}${t(392, 78, '裂化产物预测', 12, green)}</g></a>
      <a href="#/scene/r3" aria-label="打开炼化设备预测性维护"><g class="plant-label"><rect x="232" y="369" width="153" height="29" rx="3" fill="#fffef8" stroke="#cad5c2"/>${t(244, 389, '03', 11, orange)}${t(272, 389, '设备维护预警', 12, green)}<path d="M337 369v-21" stroke="${green}" stroke-dasharray="2 3"/></g></a>
      <a href="#/scene/r4" aria-label="打开化验数据智能审核"><g class="plant-label"><rect x="548" y="95" width="129" height="63" rx="3" fill="#fffef8" stroke="#cad5c2"/>${t(560, 114, '04 / LIMS', 10, orange)}${t(560, 139, '化验数据审核', 12, green)}<path d="M602 159v39" fill="none" stroke="${green}" stroke-dasharray="3 3"/></g></a>
      <a href="#/scene/r5" aria-label="打开产品质量在线软测量"><g class="plant-label"><rect x="533" y="322" width="147" height="57" rx="3" fill="#fffef8" stroke="#cad5c2"/>${t(545, 342, '05', 10, orange)}${t(572, 342, '质量软测量', 12, green)}<path d="M546 363h15l8-7 8 3 9-11 11 6 9-4 11 5 12-7 14 2 16-4" fill="none" stroke="${green}" stroke-width="1.6"/><path d="M597 322v-11" stroke="${green}" stroke-dasharray="2 3"/></g></a>
      ${t(42, 401, '流程关系示意 · 点击标注进入案例', 10, muted)}${t(675, 401, 'NOT TO SCALE', 9, muted, 'text-anchor="end"')}`;
    return wrap(body, '炼化装置与五个交互案例的关系图', 720, 420).replace('role="img"', 'role="group"');
  }
  function distillation() {
    let body = `<defs><linearGradient id="heat-column" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ddebd8"/><stop offset="1" stop-color="#e9b28f"/></linearGradient></defs><rect x="10" y="8" width="640" height="294" rx="4" fill="${cream}"/>`;
    body += `<path d="M235 55v195q0 18 70 0V55" fill="url(#heat-column)" stroke="${green}" stroke-width="1.5"/><ellipse cx="270" cy="55" rx="35" ry="11" fill="#f7faef" stroke="${green}"/><path d="M110 223h81v-38h44" fill="none" stroke="${orange}" stroke-width="4"/>${arrow(233, 185)}${t(55, 214, '加热后的原油', 12, green)}`;
    const labels = ['气体 / 最轻组分', '石脑油', '煤油馏分', '柴油馏分', '重油 / 塔底'];
    labels.forEach((s, i) => { const y = 77 + i * 38; body += `<path d="M243 ${y}h54M305 ${y}h72" stroke="${i === 4 ? orange : green}" stroke-width="${i === 4 ? 3 : 1.4}"/>${arrow(377, y, green)}${t(390, y + 4, s, 12, green)}`; });
    body += `<path d="M208 77V226" stroke="${orange}" stroke-width="1.4"/>${t(124, 82, '上部较冷', 11)}${t(124, 230, '下部较热', 11)}${t(80, 278, '按沸点分离，不是把分子切碎。减压塔进一步分离常压塔底重油。', 11, green)}`;
    return wrap(body, '常压蒸馏塔按沸点分离原油馏分的示意图');
  }
  function cracking() {
    let body = `<rect x="10" y="8" width="640" height="294" rx="4" fill="${cream}"/>${t(40, 45, '较大的烃分子', 13, green)}${t(430, 45, '较小分子 / 不同产物', 13, green)}`;
    for (let i = 0; i < 9; i++) { const x = 46 + i * 16, y = 126 + (i % 2) * 12; if (i) body += `<path d="M${x - 16} ${126 + ((i - 1) % 2) * 12}L${x} ${y}" stroke="${green}" stroke-width="3"/>`; body += `<circle cx="${x}" cy="${y}" r="5" fill="${green}"/>`; }
    body += `<path d="M227 130h157" stroke="${orange}" stroke-width="2"/>${arrow(384, 130)}<rect x="259" y="85" width="96" height="30" rx="3" fill="#f6e6d8"/>${t(275, 105, '热 + 催化剂', 12, orange)}${t(250, 157, '改变分子结构', 11)}`;
    [3, 5, 2].forEach((n, j) => { for (let i = 0; i < n; i++) { const x = 432 + i * 22, y = 89 + j * 52 + i % 2 * 9; if (i) body += `<path d="M${x - 22} ${89 + j * 52 + (i - 1) % 2 * 9}L${x} ${y}" stroke="${j === 1 ? green : orange}" stroke-width="2.5"/>`; body += `<circle cx="${x}" cy="${y}" r="5" fill="${j === 1 ? green : orange}"/>`; } });
    body += `${t(563, 100, '轻气体', 11)}${t(563, 151, '汽油组分', 11)}${t(563, 203, '其他产物', 11)}<path d="M55 221H605" stroke="${line}"/>${t(55, 250, '温度、剂油比、原料性质、催化剂活性 → 一起改变产物分布。', 12, green)}${t(55, 276, '图中分子仅作概念示意，不表示真实反应式或计量关系。', 10)}`;
    return wrap(body, '催化裂化把较大烃分子转化为较小分子的概念图');
  }
  function maintenance() {
    let body = `<rect x="10" y="8" width="640" height="294" rx="4" fill="${cream}"/><path d="M58 219h236l15 12H46Z" fill="#c3d1bb"/><circle cx="119" cy="160" r="46" fill="#e0e9d7" stroke="${green}" stroke-width="2"/><circle cx="119" cy="160" r="17" fill="#a8bda1" stroke="${green}"/><rect x="174" y="129" width="112" height="65" rx="6" fill="#d2dfc7" stroke="${green}" stroke-width="2"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${186 + 15 * i} 137v49" stroke="${green}" opacity=".45"/>`).join('')}<path d="M139 160h35M119 114V85h68" fill="none" stroke="${orange}" stroke-width="2"/><circle cx="119" cy="114" r="5" fill="${orange}"/>${t(194, 88, '振动传感器', 12, green)}<path d="M247 129V107h72" fill="none" stroke="${green}" stroke-dasharray="3 3"/>${t(323, 111, '温度 / 电流', 11)}`;
    const wave = (top, amp) => Array.from({ length: 100 }, (_, i) => `${i ? 'L' : 'M'}${362 + i * 2.5} ${top + Math.sin(i * 1.13) * (i > 60 ? amp * 2 : amp)}`).join(' ');
    body += `<path d="M352 151H624M352 213H624" stroke="${line}"/><path d="${wave(151, 6)}" fill="none" stroke="${green}" stroke-width="1.4"/><path d="${wave(213, 9)}" fill="none" stroke="${orange}" stroke-width="1.4"/>${t(362, 133, '正常', 11, green)}${t(362, 190, '早期退化', 11, orange)}${t(56, 266, '单个测点尚未超限时，多个测点的联合关系可能已经变了。', 12, green)}`;
    return wrap(body, '机泵振动与多测点联合退化监测示意图');
  }
  function laboratory() {
    let body = `<rect x="10" y="8" width="640" height="294" rx="4" fill="${cream}"/><path d="M70 40V246H391" stroke="${green}" fill="none"/><rect x="96" y="59" width="259" height="159" fill="none" stroke="${green}" stroke-dasharray="6 5" opacity=".6"/><ellipse cx="222" cy="145" rx="91" ry="25" transform="rotate(-28 222 145)" fill="#cbdcc6" opacity=".8"/>`;
    for (let i = 0; i < 35; i++) { const x = 130 + i * 5, y = 190 - i * 2.8 + Math.sin(i * 2.37) * 10; body += `<circle cx="${x}" cy="${y}" r="2.8" fill="${green}" opacity=".7"/>`; }
    body += `<circle cx="310" cy="195" r="6" fill="${orange}"/><path d="M318 195h102" stroke="${orange}" stroke-dasharray="3 3"/>${t(426, 190, '范围内的少见组合', 12, orange)}${t(426, 210, '规则可能放过，模型标记', 10)}<circle cx="382" cy="88" r="6" fill="${orange}"/><path d="M390 88h30" stroke="${orange}"/>${t(426, 86, '单项超出范围', 12, orange)}${t(426, 106, '范围规则直接命中', 10)}${t(76, 31, '闪点', 11)}${t(350, 268, '密度', 11)}${t(86, 287, '虚线框：单项允许范围；斜向点群：正常样本之间的关系。', 11, green)}`;
    return wrap(body, '化验指标范围检查与多变量组合异常的区别');
  }
  function softsensor() {
    let body = `<rect x="10" y="8" width="640" height="294" rx="4" fill="${cream}"/>${t(42, 43, '连续过程测量', 12, green)}${t(42, 166, '间隔化验取样', 12, orange)}<path d="M170 106H611M170 220H611" stroke="${line}"/><path d="M170 99C210 106 216 58 252 69S310 125 352 93S411 63 451 85S524 123 610 63" fill="none" stroke="${green}" stroke-width="2.5"/>`;
    [0, 1, 2, 3].forEach(i => { const x = 182 + i * 117; body += `<circle cx="${x}" cy="220" r="5" fill="${orange}"/><path d="M${x} 215V190h53v25" stroke="${orange}" fill="none" stroke-dasharray="3 3"/><circle cx="${x + 53}" cy="220" r="4" fill="#fff" stroke="${orange}"/>${t(x, 248, `${i * 8}h`, 10, muted, 'text-anchor="middle"')}`; });
    body += `${t(251, 182, '采样 → 等待 → 结果返回', 11, orange)}${t(172, 134, '模型每个时刻都有估计，还需要化验校准。', 11, green)}${t(42, 283, '软测量 = 用容易在线测到的变量，估计难以连续测到的质量指标。', 11, green)}`;
    return wrap(body, '连续软测量与间隔取样延迟化验的时间关系图');
  }
  function workflow(key, n) {
    const labels = { r1: ['操作记录', '变量对齐', '学习响应', '约束寻优', '比较验收'], r2: ['历史工况', '特征缩放', '寻找近邻', '加权预测', '测试误差'], r3: ['正常测点', '标准化', '拟合分布', '连续预警', '人工复核'], r4: ['化验记录', '字段核对', '训练随机树', '联合审核', '复核留痕'], r5: ['过程与化验', '按取样对齐', '拟合回归', '在线估计', '对照误差'] }[key];
    let out = `<rect x="8" y="8" width="594" height="194" rx="4" fill="${cream}"/>`;
    if (n === 0) {
      ['时间', '变量 A', '变量 B', '标签 / 状态'].forEach((s, i) => { out += t(47 + i * 129, 49, s, 11, green); });
      for (let i = 0; i < 4; i++) { out += `<path d="M38 ${64 + i * 28}H570" stroke="${line}"/>`; for (let j = 0; j < 4; j++) out += `<rect x="${47 + j * 129}" y="${72 + i * 28}" width="${34 + (i + j) % 3 * 13}" height="5" rx="2" fill="${j === 3 ? orange : green}" opacity=".3"/>`; }
    } else if (n === 1) {
      out += `<path d="M45 57v93h190M365 57v93h190M260 107h68" stroke="${line}" fill="none"/>${arrow(328, 107)}`;
      for (let i = 0; i < 24; i++) { out += `<circle cx="${58 + i * 6.5}" cy="${137 - i * 2.8 + Math.sin(i * 2) * 9}" r="3" fill="${green}" opacity=".55"/><circle cx="${386 + i * 6}" cy="${133 - i * 2.5 + Math.sin(i * 2) * 7}" r="3" fill="${green}" opacity=".55"/>`; }
      out += t(47, 179, '不同量纲 / 时间基准', 11) + t(367, 179, '统一缩放 / 样本对齐', 11, green);
    } else if (n === 2) {
      out += `<rect x="47" y="65" width="125" height="75" rx="3" fill="#dce6d3"/>${t(73, 107, '训练样本', 13, green)}<path d="M172 103h73" stroke="${orange}"/>${arrow(245, 103)}<rect x="250" y="56" width="130" height="94" rx="3" fill="#fffef8" stroke="${green}"/>${t(280, 98, '拟合模型', 13, green)}${t(272, 122, '从样本学习参数', 10)}<path d="M380 103h60" stroke="${orange}"/>${arrow(440, 103)}${t(456, 100, '保存参数', 13, green)}${t(456, 120, '保留独立测试集', 10)}`;
    } else if (n === 3) {
      out += `<path d="M45 155H560M45 155V47" stroke="${line}" fill="none"/><path d="M50 140C120 135 151 126 202 114S280 72 340 78S455 121 552 51" stroke="${green}" stroke-width="2.5" fill="none"/><path d="M45 92H560" stroke="${orange}" stroke-width="1.4" stroke-dasharray="6 5"/><circle cx="317" cy="79" r="6" fill="${orange}" stroke="white" stroke-width="2"/>${t(399, 85, key === 'r1' ? '质量 / 能耗约束' : key === 'r3' || key === 'r4' ? '审核阈值' : '新输入 → 计算结果', 11, orange)}${t(47, 181, '计算结果需要结合边界条件解释。', 11)}`;
    } else {
      out += `<path d="M54 158V48M54 158H280M54 158L264 50" fill="none" stroke="${line}" stroke-dasharray="4 3"/>`;
      for (let i = 0; i < 22; i++) out += `<circle cx="${67 + i * 8}" cy="${148 - i * 4.1 + Math.sin(i * 2) * 10}" r="3.5" fill="${green}" opacity=".75"/>`;
      out += t(347, 83, '与独立基准比较', 15, green) + t(347, 111, '记录误差、误报和失败条件', 11) + t(347, 139, '保留人工复核入口', 11, orange);
    }
    out += t(28, 26, `${String(n + 1).padStart(2, '0')} / ${labels[n]}`, 10, orange);
    return wrap(out, labels[n] + '步骤示意', 610, 210);
  }
  function pipeline(labels) {
    let out = '';
    labels.forEach((s, i) => { const x = 8 + i * 128; out += `<rect x="${x}" y="25" width="113" height="72" rx="3" fill="${cream}" stroke="${line}"/>${t(x + 11, 46, String(i + 1).padStart(2, '0'), 10, orange)}${t(x + 11, 72, s, 12, green)}`; if (i < labels.length - 1) out += `<path d="M${x + 114} 61h11" stroke="${orange}"/>` + arrow(x + 125, 61); });
    return wrap(out, '案例完整计算流程', 660, 120);
  }
  const concepts = { r1: distillation, r2: cracking, r3: maintenance, r4: laboratory, r5: softsensor };
  function icon(id) {
    const paths = {
      r1: '<path d="M23 9v42m18-34v34M17 15h12m-12 9h12m-12 9h12m-12 9h12m7-18h10m-10 9h10m-10 9h10M11 51h42M12 38h5m12-5h7m10 0h7"/>',
      r2: '<path d="M20 16l13 8-2 16M12 28l8-12 4-7m9 15 13-7 9 10M31 40l13 8 9-10M31 40l-15 5-6-10"/><circle cx="20" cy="16" r="3"/><circle cx="33" cy="24" r="3"/><circle cx="31" cy="40" r="3"/><circle cx="46" cy="17" r="3"/>',
      r3: '<circle cx="24" cy="32" r="13"/><circle cx="24" cy="32" r="5"/><path d="M37 23h17v18H37M13 47h44M24 19V9h15m5 18v10m5-10v10M8 32h3"/>',
      r4: '<path d="M17 9h27v43H17zM22 18h15m-15 8h15m-15 8h9m-9 8h9M36 39l5 5 11-15"/>',
      r5: '<path d="M11 10v41h44M17 36l9-10 10 7 9-16 8 4M17 43l9-3 10 4 9-6 8-2"/>',
    };
    return wrap(`<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${paths[id] || paths.r1}</g>`, '案例示意图标', 64, 62);
  }
  g.RefineryArt = { brand, plant, concepts, workflow, pipeline, icon };
})(typeof window === 'undefined' ? globalThis : window);
