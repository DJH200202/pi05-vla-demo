'use strict';
(() => {
  const get = id => document.getElementById(id);
  const data = window.DEMO_DATA;
  const schemes = {
    A: {
      title: '仅动作专家 LoRA',
      description: '固定视觉与指令的表示方式，仅训练动作专家 Attention 和 FFN 内的低秩支路。动作输入 / 输出投影和时间 MLP 也保持冻结。',
      change: '适配起点：只调整动作专家如何利用已有条件预测动作速度场。',
      alt: 'A 方案：仅动作专家训练 rank 32 LoRA，视觉、语言主干和外部接口冻结。'
    },
    B: {
      title: 'Strict · 语言与动作双 LoRA',
      description: '视觉语言 Transformer 与动作专家分别训练 LoRA，让条件表示和动作生成共同适配；视觉、原始主干权重与外部接口保持冻结。',
      change: '相对 A：新增语言侧 rank 16 LoRA，调整图像与指令的联合表示及逐层条件 K/V。',
      alt: 'B Strict 方案：语言侧 rank 16 与动作侧 rank 32 LoRA；视觉及外部接口冻结。'
    },
    C: {
      title: 'Default · 双 LoRA + 视觉与接口更新',
      description: '语言与动作主干训练低秩支路，同时更新视觉编码、视觉投影，以及动作输入 / 输出投影和时间 MLP。',
      change: '相对 B：放开视觉与外部接口；两个 Transformer 主干的原权重仍冻结。',
      alt: 'C Default 方案：视觉与外部接口原权重更新，语言和动作专家只训练 LoRA。'
    },
    D: {
      title: '语言 LoRA + 动作专家全量更新',
      description: '保留语言侧 LoRA，直接更新动作专家原参数（含内部条件归一化映射），同时更新视觉和外部接口；不添加动作专家 LoRA。',
      change: '相对 C：用动作专家原权重更新替代动作 LoRA；语言主干原权重仍冻结。',
      alt: 'D 方案：语言侧 LoRA；动作专家、视觉及外部接口直接训练原权重，没有动作 LoRA。'
    },
    E: {
      title: '整模型全量微调',
      description: '视觉、语言主干、动作专家与外部接口的全部原参数进入优化器，包括词嵌入和归一化参数；两侧均不添加 LoRA。',
      change: '相对 D：语言侧也由 LoRA 改为原权重更新。本轮训练暂缓，不参与当前成绩比较。',
      alt: 'E 方案：全部原始模型参数可训练，不使用 LoRA；本轮暂缓，没有本轮评估成绩。'
    }
  };
  const tabs = [...document.querySelectorAll('.architecture-tabs [role="tab"]')];
  const dialog = get('architecture-dialog');
  let selected = 'C';
  function selectScheme(group) {
    if (!schemes[group]) return;
    selected = group;
    const scheme = schemes[group];
    const source = `assets/architecture/scheme-${group.toLowerCase()}.svg`;
    tabs.forEach(tab => {
      const active = tab.dataset.scheme === group;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    get('architecture-panel').setAttribute('aria-labelledby', `architecture-tab-${group}`);
    get('architecture-title').textContent = `${group} · ${scheme.title}`;
    get('architecture-description').textContent = scheme.description;
    get('architecture-change').textContent = scheme.change;
    get('architecture-parameters').textContent = group === 'E' ? '3.35 G' : `${(data.training[group].parameters.trainable / 1e6).toFixed(2)} M`;
    const result = get('architecture-result');
    if (group === 'E') result.textContent = '暂缓 · 无成绩';
    else {
      const evaluation = data.evaluation[group];
      result.textContent = `${(evaluation.success_rate * 100).toFixed(1)}% `;
      const count = document.createElement('small');
      count.textContent = `${evaluation.successes}/500`;
      result.append(count);
    }
    get('architecture-image').src = source;
    get('architecture-image').alt = scheme.alt;
    get('architecture-enlarge').setAttribute('aria-label', `放大查看 ${group} 方案架构图`);
    get('architecture-download').href = source;
    get('architecture-download').download = `pi05-scheme-${group.toLowerCase()}.svg`;
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectScheme(tab.dataset.scheme));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectScheme(tabs[next].dataset.scheme);
      tabs[next].focus();
    });
  });
  // Keep scores unchanged; add architecture navigation for evaluated schemes only.
  const rows = [...get('scope-table').rows];
  data.groups.forEach((group, index) => {
    if (!schemes[group]) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scope-architecture';
    button.textContent = '查看架构 ↗';
    button.setAttribute('aria-label', `查看 ${group} 方案架构`);
    button.addEventListener('click', () => {
      selectScheme(group);
      get(`architecture-tab-${group}`).focus({preventScroll: true});
      get('architecture').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
    });
    rows[index].cells[1].append(button);
  });
  function resetZoom() {
    dialog.classList.remove('is-zoomed');
    get('architecture-zoom').setAttribute('aria-pressed', 'false');
    get('architecture-zoom').textContent = '查看细节';
    const canvas = dialog.querySelector('.architecture-dialog-canvas');
    canvas.scrollTop = canvas.scrollLeft = 0;
  }
  get('architecture-enlarge').addEventListener('click', () => {
    get('architecture-dialog-title').textContent = `${selected} · ${schemes[selected].title}`;
    get('architecture-dialog-image').src = get('architecture-image').src;
    get('architecture-dialog-image').alt = schemes[selected].alt;
    resetZoom();
    dialog.showModal();
    document.body.classList.add('architecture-modal-open');
  });
  get('architecture-zoom').addEventListener('click', () => {
    const zoomed = dialog.classList.toggle('is-zoomed');
    get('architecture-zoom').setAttribute('aria-pressed', String(zoomed));
    get('architecture-zoom').textContent = zoomed ? '适应窗口' : '查看细节';
  });
  get('architecture-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('architecture-modal-open');
    resetZoom();
  });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  selectScheme('C');
})();
