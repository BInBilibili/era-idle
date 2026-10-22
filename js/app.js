/* =========================================================================
   纪元放置 · 启动与交互
   ========================================================================= */
'use strict';
(function () {
  const E = window.Engine, U = window.UI;
  let tickTimer = null, saveTimer = null, lastTick = 0, dragData = null;

  /* ---------------- 启动 ---------------- */
  function boot() {
    const hv = document.getElementById('hudVer');
    if (hv) hv.textContent = E.APP_VERSION;
    const q = new URLSearchParams(location.search);
    const saved = E.load();
    if (saved) {
      E.S = saved;
      if (q.get('page')) E.S.ui.page = q.get('page');
      startGame();
    } else if (q.has('demo')) {
      E.S = E.newState(q.get('name') || '演示者');
      E.S.chars.player.name = E.S.name;
      if (q.get('page')) E.S.ui.page = q.get('page');
      startGame();
    } else {
      askName();
    }
    wireGlobal();
  }

  function askName() {
    U.modal(`<h3>🏛️ 欢迎来到纪元放置</h3>
      <div class="sub" style="margin-bottom:12px">从石器时代开始，把一个殖民地一路推到太空时代。<br>先给自己起个名字吧（之后随时可改）。</div>
      <input id="nameInput" style="width:100%;padding:10px 12px;border-radius:9px;border:1px solid #33465c;background:#0c1219;color:#e2e8f2;font-size:15px" maxlength="12" placeholder="你的名字" value="无名者">
      <div class="acts"><button class="primary" id="startBtn">开始游戏</button></div>`);
    const input = document.getElementById('nameInput');
    const go = () => {
      const name = (input.value || '无名者').trim().slice(0, 12) || '无名者';
      E.S = E.newState(name);
      E.S.chars.player.name = name;
      U.closeModal();
      startGame();
      U.toast('第一步：去「工作」派玩家角色伐木');
    };
    document.getElementById('startBtn').onclick = go;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    setTimeout(() => input.focus(), 50);
  }

  function startGame() {
    const S = E.S;
    applyTheme((S.settings && S.settings.theme) || 'dark');
    if (!S.ui.page) S.ui.page = 'warehouse';
    if (S.ui.page === 'tech') S.ui.page = 'job:research';
    if (!S.shop.slots.length) E.refreshShop(true);
    E.refreshShop(false);
    U.render();
    if (!S.ui.tipsSeen) { S.ui.tipsSeen = true; setTimeout(showTips, 300); }
    if (new URLSearchParams(location.search).has('settings')) setTimeout(openSettings, 500);
    lastTick = performance.now();
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(gameTick, E.GAME.tickMs);
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(() => E.save(true), 15000);
    window.addEventListener('beforeunload', () => E.save(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) E.save(true); });
  }

  function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    if (E.S) { E.S.settings = E.S.settings || {}; E.S.settings.theme = t; }
  }
  function openSettings() {
    const S = E.S;
    const theme = (S.settings && S.settings.theme) || 'dark';
    U.modal(`<h3>⚙ 设置 <span class="tiny dim" style="font-weight:400">纪元放置 ${E.APP_VERSION} · 测试版</span></h3>
      <div class="card"><div class="row" style="justify-content:space-between">
        <div><b>主题</b><div class="tiny muted">深色适合长时间挂机，浅色适合白天</div></div>
        <div class="row">
          <button class="${theme === 'dark' ? 'primary' : ''}" data-theme="dark">🌙 深色</button>
          <button class="${theme === 'light' ? 'primary' : ''}" data-theme="light">☀️ 浅色</button>
        </div>
      </div></div>
      <div class="card" style="margin-top:10px"><div class="row" style="justify-content:space-between">
        <div><b>存档</b><div class="tiny muted">自动存档每 15 秒；关闭页面也会存</div></div>
        <div class="row"><button id="setSave">立即存档</button><button id="setExport">导出</button><button id="setImport">导入</button></div>
      </div></div>
      <div class="acts"><button class="primary" data-act="closeModal">关闭</button></div>`);
    document.querySelectorAll('#modalBox [data-theme]').forEach(btn => btn.onclick = () => {
      applyTheme(btn.dataset.theme);
      if (E.S) E.save(true);
      U.closeModal(); U.render(); U.toast('已切换到' + (btn.dataset.theme === 'light' ? '浅色' : '深色') + '主题');
    });
    const sv = document.getElementById('setSave'); if (sv) sv.onclick = () => { E.save(); U.toast('已存档', 'good'); };
    const ex = document.getElementById('setExport'); if (ex) ex.onclick = () => { U.closeModal(); doExport(); };
    const im = document.getElementById('setImport'); if (im) im.onclick = () => { U.closeModal(); doImport(); };
  }

  function showTips() {
    U.modal(`<h3>🏛️ 三步开始</h3>
      <div class="card" style="margin-bottom:8px"><b>1 · 派人干活</b><div class="sub">左侧「工作」→ 打开「伐木」→ 点配方卡右上角的 ＋ 入驻槽，选你的角色。每张配方都有独立槽位。</div></div>
      <div class="card" style="margin-bottom:8px"><b>2 · 研究科技</b><div class="sub">把角色派去「科研」攒科研点 → 科研页下方就是科技树，研究「火 / 语言 / 石器工艺」，新工作会逐个出现。</div></div>
      <div class="card" style="margin-bottom:8px"><b>3 · 滚起来</b><div class="sub">仓库里卖东西换金币 → 造升级项 → 提升产出；粮食会腐坏，记得保持粮仓有吃的。右上角 ⚙ 设置里可以切换浅色主题。</div></div>
      <div class="acts"><button class="primary" data-act="closeModal">开始</button></div>`);
  }

  function gameTick() {    const now = performance.now();
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    if (dt > 5) dt = 5;           // 切后台回来不要爆
    if (dt <= 0) return;
    try {
      E.tick(dt);
      U.tick();
    } catch (e) { console.error(e); }
  }

  /* ---------------- 全局事件 ---------------- */
  function wireGlobal() {
    document.addEventListener('click', onClick);
    document.addEventListener('dragover', e => {
      const t = e.target.closest('[data-act="recslot"],[data-act="eqslot"],[data-act="selectChar"]');
      if (t) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; t.classList.add('hover'); }
    });
    document.addEventListener('dragleave', e => {
      const t = e.target.closest('[data-act="recslot"],[data-act="eqslot"]');
      if (t) t.classList.remove('hover');
    });
    document.addEventListener('drop', onDrop);
    document.addEventListener('dragstart', e => {
      const el = e.target.closest('[draggable="true"]');
      if (!el) return;
      dragData = { kind: el.dataset.drag, id: el.dataset.id };
      el.style.opacity = '.5';
      try { e.dataTransfer.setData('text/plain', JSON.stringify(dragData)); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
    });
    document.addEventListener('dragend', e => {
      const el = e.target.closest('[draggable="true"]');
      if (el) el.style.opacity = '';
      document.querySelectorAll('.chip.hover,.slot.hover').forEach(x => x.classList.remove('hover'));
    });

    document.getElementById('btnSave').onclick = () => { E.save(); U.render(); };
    document.getElementById('btnExport').onclick = doExport;
    document.getElementById('btnImport').onclick = doImport;
    document.getElementById('btnReset').onclick = doReset;
    const bs = document.getElementById('btnSettings');
    if (bs) bs.onclick = openSettings;
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') U.closeModal(); });
  }

  /* ---------------- 点击分发 ---------------- */
  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, id = el.dataset.id, i = el.dataset.i, v = el.dataset.v, k = el.dataset.k, slot = el.dataset.slot;
    const S = E.S;
    switch (act) {
      case 'nav':
        S.ui.page = el.dataset.page;
        S.ui.scroll = 0;
        U.render();
        document.getElementById('page').scrollTop = 0;
        break;
      case 'tab': S.ui.tab[k] = v; U.render(); break;
      case 'sort': S.ui.tab.whSort = v; U.render(); break;
      case 'recslot': openJobSlot(el.dataset.job || id, +(i || 0)); break;
      case 'recipe': S.jobs[id].recipe = +i; U.render(); break;
      case 'upg': {
        const r = E.buyUpgrade(id, +i);
        U.toast(r.ok ? '已购买升级' : (r.why || '无法购买'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'tech': {
        const r = E.researchTech(id);
        U.toast(r.ok ? '研究完成' : (r.why || '无法研究'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'sell': { const g = E.sellItem(id, 1); if (g) U.toast('卖出获得 ' + E.fmt(g) + ' 金'); U.render(); break; }
      case 'sellall': { const g = E.sellItem(id, S.items[id] || 0); if (g) U.toast('卖出获得 ' + E.fmt(g) + ' 金'); U.render(); break; }
      case 'buy': confirmBuy(+i); break;
      case 'buyPotion': {
        const sd = E.N2I('星尘'), pot = E.N2I('升星药水');
        if (E.count(sd) >= 3) { E.removeItem(sd, 3); E.addItem(pot, 1); U.toast('买到升星药水 ×1', 'good'); } else U.toast('星尘不足', 'bad');
        U.render(); break;
      }
      case 'buybook': {
        const it = E.ITEMS[id]; if (!it) break;
        if (S.gold < 24000) { U.toast('金币不足', 'bad'); break; }
        if (E.warehouseFull() && !S.items[id]) { U.toast('仓库已满', 'bad'); break; }
        S.gold -= 24000; E.addItem(id, 1); U.toast('购买《' + it.name + '》', 'good'); U.render(); break;
      }
      case 'eqslot': openEquipSlot(slot); break;
      case 'eqfrom': {
        const cid = S.ui.charSel || S.order[0];
        equipItem(cid, id, true); break;
      }
      case 'autoEquip': autoEquip(S.ui.charSel); break;
      case 'unequipAll': {
        const c = S.chars[S.ui.charSel]; if (c) { Object.keys(c.eq).forEach(s => { if (c.eq[s]) { E.addItem(c.eq[s], 1); c.eq[s] = null; } }); U.render(); }
        break;
      }
      case 'selectChar': S.ui.charSel = id; U.render(); break;
      case 'rename': openRename(); break;
      case 'starup': {
        const r = E.starUp(id);
        U.toast(r.ok ? '升星成功：★' + r.stars : (r.why || '无法升星'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'sendgift': openGift(id); break;
      case 'pull': doPull(id); break;
      case 'buildgen': {
        const gens = window.JOB_POWER_GENERATORS || {};
        let g = null;
        for (const era in gens) (gens[era] || []).forEach(x => { if (x.id === id) g = x; });
        if (!g) break;
        if (!E.affordCost(g.cost || {})) { U.toast('材料不足', 'bad'); break; }
        E.payCost(g.cost || {}); S.power.built[id] = true; U.toast('建造完成：' + g.name, 'good'); U.render(); break;
      }
      case 'buyhouse': { const r = E.buyHousing(); U.toast(r.ok ? '住房建成，角色上限提升' : (r.why || '无法建造'), r.ok ? 'good' : 'bad'); U.render(); break; }
      case 'buycomfort': { const r = E.buyComfort(+i); U.toast(r.ok ? '舒适度提升' : (r.why || '无法购买'), r.ok ? 'good' : 'bad'); U.render(); break; }
      case 'buyfort': { const r = E.buyFort(+i); U.toast(r.ok ? '工事建成' : (r.why || '无法建造'), r.ok ? 'good' : 'bad'); U.render(); break; }
      case 'buywh': { const r = E.buyWarehouse(); U.toast(r.ok ? '仓库扩容完成' : (r.why || '无法扩建'), r.ok ? 'good' : 'bad'); U.render(); break; }
      case 'buygr': { const r = E.buyGranary(); U.toast(r.ok ? '粮仓升级完成' : (r.why || '无法建造'), r.ok ? 'good' : 'bad'); U.render(); break; }
      case 'region': { E.combatState('hunting').region = +i; E.combatState('hunting').enemy = null; E.combatState('hunting').respawn = 0; U.render(); break; }
      case 'raidPreview': {
        const st = E.raidStrength(), de = E.basePower();
        U.modal(`<h3>袭击预演</h3><div class="small">袭击强度 <b class="${st > de ? 'red' : 'green'}">${E.fmt(st)}</b> vs 基地战力 <b class="gold">${E.fmt(de)}</b></div>
          <div class="sub" style="margin-top:8px">${st > de ? '按当前战力，这次会被攻破：约 10% 物品与金币会被抢走。' : '按当前战力可以击退。'}</div>
          <div class="acts"><button onclick="UI.closeModal()">知道了</button></div>`);
        break;
      }
      case 'closeModal': U.closeModal(); break;
    }
  }

  /* ---------------- 拖拽 ---------------- */
  function onDrop(e) {
    const target = e.target.closest('[data-act="recslot"],[data-act="eqslot"],[data-act="selectChar"]');
    if (!target || !dragData) return;
    e.preventDefault();
    const kind = dragData.kind, id = dragData.id;
    if (target.dataset.act === 'recslot' && kind === 'char') assignJob(target.dataset.job, +(target.dataset.i || 0), id);
    if (target.dataset.act === 'eqslot' && kind === 'item') equipItem(E.S.ui.charSel || E.S.order[0], id, true);
    if (target.dataset.act === 'selectChar' && kind === 'order') moveOrder(id, target.dataset.id);
    dragData = null;
  }
  function moveOrder(fromId, toId) {
    const S = E.S;
    const a = S.order.indexOf(fromId), b = S.order.indexOf(toId);
    if (a < 0 || b < 0 || a === b) return;
    S.order.splice(a, 1);
    S.order.splice(b, 0, fromId);
    // 被挤出上场区的角色自动退出所有工作槽
    const cap = E.onFieldCap();
    S.order.forEach((cid, idx) => {
      if (idx >= cap) Object.keys(S.jobs).forEach(j => {
        const js = S.jobs[j];
        if (js.slots) js.slots = js.slots.map(x => (x === cid ? null : x));
      });
    });
    U.render();
  }
  function assignJob(jobId, slotIdx, cid) {
    const S = E.S;
    const c = S.chars[cid]; if (!c) return;
    if (!E.isOnField(c)) { U.toast('该角色在待命队列（置灰），拖到前 ' + E.onFieldCap() + ' 名才能上场', 'bad'); return; }
    const job = E.JOB_BY_ID[jobId]; if (!job) return;
    const owner = job.staffOnly || job.owner;
    if (owner && E.charName(c) !== owner) { U.toast('只有 ' + owner + ' 可以入驻「' + job.name + '」', 'bad'); return; }
    if (job.special === 'blackSoul' && c.cid !== 'yuki') { U.toast('只有星见由岐可以入驻 #黑暗之魂', 'bad'); return; }
    if (job.special === 'eraSim' && c.cid !== 'dashao') { U.toast('只有大少可以入驻 #模拟纪元', 'bad'); return; }
    E.assignSlot(jobId, slotIdx || 0, cid);
    if (E.combatState && (job.special === 'hunting' || job.special === 'blackSoul' || job.special === 'eraSim')) {
      const cs = E.combatState(jobId); cs.enemy = null; cs.respawn = 0;
    }
    const r = E.jobRecipes(job)[slotIdx || 0];
    U.toast(E.charName(c) + ' → ' + job.name + (r && E.jobRecipes(job).length > 1 ? ' · ' + r.name : ''));
    U.render();
  }
  function openJobSlot(jobId, slotIdx) {
    const S = E.S, job = E.JOB_BY_ID[jobId];
    if (!job) return;
    const idx = slotIdx || 0;
    const recipe = E.jobRecipes(job)[idx] || { name: job.name };
    const list = S.order.slice(0, E.onFieldCap()).map(id => S.chars[id]).filter(Boolean);
    const curId = S.jobs[jobId].slots ? S.jobs[jobId].slots[idx] : null;
    U.modal(`<h3>入驻 · ${U.esc(job.name)}${E.jobRecipes(job).length > 1 ? ' · ' + U.esc(recipe.name) : ''}</h3>
      <div class="sub" style="margin-bottom:10px">只有前 ${E.onFieldCap()} 名角色可以上场。当前：${curId ? U.esc(E.charName(S.chars[curId])) : '空'}</div>
      <div class="chips">${list.map(c => {
        let ok = true, why = '';
        if (job.special === 'blackSoul' && c.cid !== 'yuki') { ok = false; why = '仅星见由岐'; }
        if (job.special === 'eraSim' && c.cid !== 'dashao') { ok = false; why = '仅大少'; }
        return `<div class="chip ${ok ? '' : 'dim'}" data-act="pickchar" data-job="${jobId}" data-i="${idx}" data-id="${c.cid}" style="cursor:pointer">
          ${U.avatar(c)}<div class="cn">${U.esc(E.charName(c))}</div><div class="tiny dim">${why || '精通 ' + E.masteryLvl(c, jobId)}</div></div>`;
      }).join('')}</div>
      <div class="acts"><button data-act="unassign" data-job="${jobId}" data-i="${idx}">撤下</button><button data-act="closeModal">取消</button></div>`);
    document.querySelectorAll('[data-act="pickchar"]').forEach(el => el.onclick = () => { assignJob(el.dataset.job, +el.dataset.i, el.dataset.id); U.closeModal(); });
    const un = document.querySelector('[data-act="unassign"]');
    if (un) un.onclick = () => { E.clearSlot(jobId, idx); U.closeModal(); U.render(); };
  }
  function openEquipSlot(slot) {
    const S = E.S, cid = S.ui.charSel || S.order[0], c = S.chars[cid];
    if (!c) return;
    const items = Object.keys(S.items).filter(id => (S.items[id] || 0) > 0 && E.ITEMS[id] && E.ITEMS[id].slot === slot);
    U.modal(`<h3>${U.esc(slotName(slot))} · ${U.esc(E.charName(c))}</h3>
      ${c.eq[slot] ? `<div class="card" style="margin-bottom:10px"><div class="row" style="justify-content:space-between"><b>${U.esc(E.ITEMS[c.eq[slot]].name)}</b><button data-act="unequip" data-slot="${slot}">卸下</button></div></div>` : ''}
      ${!items.length ? '<div class="empty">仓库里没有该栏位装备</div>' : `<div class="wgrid">${items.map(id => {
        const it = E.ITEMS[id];
        return `<div class="slot sm filled" data-pick="${id}" style="cursor:pointer" title="${U.esc(it.name)}">
          <div class="ph">${U.itemIcon(it)}</div><div class="nm">${U.esc(it.name)}</div><div class="tiny dim">×${E.fmt(S.items[id])}</div></div>`;
      }).join('')}</div>`}
      <div class="acts"><button data-act="closeModal">关闭</button></div>`);
    document.querySelectorAll('[data-pick]').forEach(el => el.onclick = () => { equipItem(cid, el.dataset.pick, false); U.closeModal(); });
    const un = document.querySelector('[data-act="unequip"]');
    if (un) un.onclick = () => { const id = c.eq[slot]; if (id) { E.addItem(id, 1); c.eq[slot] = null; } U.closeModal(); U.render(); };
  }
  function slotName(s) {
    return { head: '头盔', headInner: '内衬头盔', body: '胸甲', bodyInner: '内衬', legs: '护腿', legsInner: '内衬护腿', feet: '靴子', socks: '袜子', offhand: '副手', neck: '项链', belt: '腰带', mainhand: '主手' }[s] || s;
  }
  function equipItem(cid, id, fromWarehouse) {
    const S = E.S, c = S.chars[cid], it = E.ITEMS[id];
    if (!c || !it || !it.slot) return;
    if ((S.items[id] || 0) < 1) { U.toast('仓库里没有这件装备', 'bad'); return; }
    const slot = it.slot;
    E.removeItem(id, 1);
    if (c.eq[slot]) E.addItem(c.eq[slot], 1);
    c.eq[slot] = id;
    if (fromWarehouse === false) U.closeModal();
    U.render();
  }
  function autoEquip(cid) {
    const S = E.S, c = S.chars[cid || S.ui.charSel];
    if (!c) return;
    const slots = ['mainhand', 'offhand', 'body', 'legs', 'head', 'feet', 'belt', 'neck', 'bodyInner', 'legsInner', 'headInner', 'socks'];
    slots.forEach(slot => {
      const cands = Object.keys(S.items).filter(id => (S.items[id] || 0) > 0 && E.ITEMS[id].slot === slot);
      if (!cands.length) return;
      cands.sort((a, b) => score(E.ITEMS[b]) - score(E.ITEMS[a]));
      equipItem(c.cid, cands[0], true);
    });
    U.toast('已装备仓库中最好的装备');
    U.render();
  }
  function score(it) {
    if (!it) return 0;
    if (it.cat === 'weapon') return (it.str || 0) * 2 + (it.atk || 0) * 1;
    return (it.dr || 0) * 5 + (it.str || 0) * 2;
  }

  /* ---------------- 弹窗业务 ---------------- */
  function confirmBuy(i) {
    const S = E.S, s = S.shop.slots[i];
    if (!s) return;
    const it = E.ITEMS[s.id];
    const liu = S.chars.liu;
    let disc = 0;
    if (liu && liu.favor >= 50) disc = liu.favor >= 100 ? 0.3 : 0.15;
    const price = Math.ceil(s.price * s.qty * (1 - disc));
    U.modal(`<h3>确认购买</h3>
      <div class="card"><div class="row" style="justify-content:space-between"><b>${U.itemIcon(it)} ${U.esc(it ? it.name : s.id)}</b><span class="mono">×${s.qty}</span></div>
      <div class="hr"></div>
      <div class="row" style="justify-content:space-between"><span class="muted">单价</span><span class="mono">${E.fmt(s.price)} 金</span></div>
      <div class="row" style="justify-content:space-between"><span class="muted">总价</span><span class="mono gold">${E.fmt(price)} 金</span></div>
      ${disc ? `<div class="tiny green">[人缘好] 折扣 -${Math.round(disc * 100)}%</div>` : ''}
      <div class="tiny dim" style="margin-top:6px">持有金币 ${E.fmt(S.gold)}</div></div>
      <div class="acts"><button data-act="closeModal">取消</button><button class="primary" id="okBuy" ${S.gold < price ? 'disabled' : ''}>确认购买</button></div>`);
    const btn = document.getElementById('okBuy');
    if (btn) btn.onclick = () => {
      const r = E.buyShopSlot(i);
      U.toast(r.ok ? '购买成功' : (r.why || '购买失败'), r.ok ? 'good' : 'bad');
      U.closeModal(); U.render();
    };
  }
  function openRename() {
    const S = E.S;
    U.modal(`<h3>改名</h3><input id="renameInput" style="width:100%;padding:9px 12px;border-radius:9px;border:1px solid #33465c;background:#0c1219;color:#e2e8f2" maxlength="12" value="${U.esc(S.name)}">
      <div class="acts"><button data-act="closeModal">取消</button><button class="primary" id="okRename">保存</button></div>`);
    document.getElementById('okRename').onclick = () => {
      const n = (document.getElementById('renameInput').value || '').trim().slice(0, 12) || S.name;
      S.name = n;
      if (S.chars.player) S.chars.player.name = n;
      U.closeModal(); U.render(); U.toast('已改名');
    };
  }
  function openGift(cid) {
    const S = E.S, c = S.chars[cid];
    if (!c) return;
    const gifts = E.GIFTS.map(g => {
      const id = Object.values(E.ITEMS).find(x => x.kind === 'gift' && x.gift === g.favor);
      return { g, id, n: id ? (S.items[id] || 0) : 0 };
    });
    U.modal(`<h3>送礼物 · ${U.esc(E.charName(c))}</h3>
      <div class="sub" style="margin-bottom:10px">当前好感度 ${c.favor}/100。50 解锁一级恩赐，100 解锁二级。</div>
      ${gifts.map(({ g, id, n }) => `<div class="card" style="margin-bottom:8px"><div class="row" style="justify-content:space-between">
        <span>${U.esc(g.name)} <span class="tiny muted">+${g.favor} 好感</span></span>
        <span class="row"><span class="tiny ${n ? 'green' : 'dim'}">持有 ${n}</span><button data-gift="${id}" ${n ? '' : 'disabled'}>赠送</button></span>
      </div></div>`).join('')}
      <div class="acts"><button data-act="closeModal">关闭</button></div>`);
    document.querySelectorAll('[data-gift]').forEach(el => el.onclick = () => {
      const r = E.giftTo(cid, el.dataset.gift);
      U.toast(r.ok ? '好感度 +' + E.GIFTS.find(g => g.id === el.dataset.gift).favor : (r.why || '无法赠送'), r.ok ? 'good' : 'bad');
      U.closeModal(); U.render();
    });
  }
  function doPull(poolId) {
    const r = E.pull(poolId);
    if (!r.ok) { U.toast(r.why || '抽卡失败', 'bad'); return; }
    let html = '<h3>抽卡结果</h3>';
    if (r.type === 'new') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:44px">🌟</div><h2 class="gold">${U.esc(r.hero.name)}</h2><div class="sub">新角色加入！</div></div>`;
    else if (r.type === 'dup') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:40px">✨</div><h2>${U.esc(r.hero.name)}</h2><div class="sub">重复角色 → 星尘 ×${r.n}</div></div>`;
    else if (r.type === 'stardust') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:40px">✨</div><h2>星尘 ×${r.n}</h2><div class="sub">该池已集齐，保底转为星尘</div></div>`;
    else if (r.type === 'gift') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:40px">🎁</div><h2>${U.esc(r.gift.name)}</h2><div class="sub">好感度礼物 +${r.gift.favor}</div></div>`;
    html += `<div class="acts"><button class="gold" id="againBtn">再抽一次</button><button data-act="closeModal">收下</button></div>`;
    U.modal(html);
    const again = document.getElementById('againBtn');
    if (again) again.onclick = () => { U.closeModal(); doPull(poolId); };
    U.render();
  }

  /* ---------------- 存档操作 ---------------- */
  function doExport() {
    const code = E.exportSave();
    U.modal(`<h3>导出存档</h3><div class="sub" style="margin-bottom:8px">下面这段 base64 就是你的全部进度，复制保存到记事本即可备份。</div>
      <textarea readonly style="width:100%;height:150px;background:#0c1219;color:#b8c6d6;border:1px solid #33465c;border-radius:9px;padding:8px;font-family:monospace;font-size:11px">${code}</textarea>
      <div class="acts"><button class="primary" id="copyBtn">复制到剪贴板</button><button data-act="closeModal">关闭</button></div>`);
    document.getElementById('copyBtn').onclick = () => {
      navigator.clipboard.writeText(code).then(() => U.toast('已复制到剪贴板', 'good')).catch(() => U.toast('复制失败，请手动全选复制', 'bad'));
    };
  }
  function doImport() {
    U.modal(`<h3>导入存档</h3><div class="sub" style="margin-bottom:8px">粘贴导出的 base64 存档，会覆盖当前进度。</div>
      <textarea id="importArea" style="width:100%;height:150px;background:#0c1219;color:#b8c6d6;border:1px solid #33465c;border-radius:9px;padding:8px;font-family:monospace;font-size:11px" placeholder="粘贴存档..."></textarea>
      <div class="acts"><button data-act="closeModal">取消</button><button class="primary" id="okImport">导入并刷新</button></div>`);
    document.getElementById('okImport').onclick = () => {
      const v = document.getElementById('importArea').value;
      if (E.importSave(v)) { U.closeModal(); location.reload(); }
    };
  }
  function doReset() {
    U.modal(`<h3 class="red">重新开始？</h3>
      <div class="sub">会清空全部进度，回到起名页。<b class="red">不可恢复</b> —— 强烈建议先点「导出」备份。</div>
      <div class="acts"><button data-act="closeModal">取消</button><button class="danger" id="okReset">确认清空</button></div>`);
    document.getElementById('okReset').onclick = () => {
      localStorage.removeItem(E.GAME.saveKey);
      location.reload();
    };
  }

  /* ---------------- 启动 ---------------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
