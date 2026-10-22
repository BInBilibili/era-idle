/* =========================================================================
   纪元放置 · 启动与交互
   ========================================================================= */
'use strict';
(function () {
  const E = window.Engine, U = window.UI;
  let tickTimer = null, saveTimer = null, lastTick = 0, dragData = null, slotMenuEl = null;
  let pendingOffline = null;
  let resetting = false;   // 「重开」确认后置 true，阻止 beforeunload/visibilitychange 把旧存档写回去
  const OFFLINE_POPUP_SEC = 120;     // 离开超过 2 分钟才弹结算框，避免切标签页就打扰

  /* ---------------- 启动 ---------------- */
  function boot() {
    const hv = document.getElementById('hudVer');
    if (hv) hv.textContent = E.APP_VERSION;
    const q = new URLSearchParams(location.search);
    const saved = E.load();
    if (saved) {
      E.S = saved;
      if (q.get('page')) E.S.ui.page = q.get('page');
      // 离线收益：用存档里的 lastSave 算现实离开时长，期望值一次结算
      const away = (Date.now() - (saved.lastSave || Date.now())) / 1000;
      const rep = E.settleOffline(away);
      pendingOffline = rep;
      startGame();
      E.save(true);
      pendingOffline = null;
      if (rep) setTimeout(() => showOffline(rep), 320);
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
      <input id="nameInput" class="inp" maxlength="12" placeholder="你的名字" value="无名者">
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
    if (!S.ui.tipsSeen && !pendingOffline) { S.ui.tipsSeen = true; setTimeout(showTips, 300); }
    if (new URLSearchParams(location.search).has('settings')) setTimeout(openSettings, 500);
    lastTick = performance.now();
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(gameTick, E.GAME.tickMs);
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(() => E.save(true), 15000);
    window.addEventListener('beforeunload', () => { if (!resetting) E.save(true); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (!resetting) E.save(true); return; }
      // 回到前台：立刻按真实离开时长补结算，不等被节流的下一跳
      gameTick();
    });
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
      <div class="card" style="margin-top:10px;border-color:#5a2a30"><div class="row" style="justify-content:space-between">
        <div><b class="red">重新开始</b><div class="tiny muted">清空全部进度，回到起名页；不可恢复</div></div>
        <button class="danger" id="setReset">重开</button>
      </div></div>
      <div class="acts"><button class="primary" data-act="closeModal">关闭</button></div>`);
    document.querySelectorAll('#modalBox [data-theme]').forEach(btn => btn.onclick = () => {
      applyTheme(btn.dataset.theme);
      if (E.S) E.save(true);
      U.closeModal(); U.render(); U.toast('已切换到' + (btn.dataset.theme === 'light' ? '浅色' : '深色') + '主题');
    });
    const sv = document.getElementById('setSave'); if (sv) sv.onclick = () => { E.save(true); U.toast('已保存', 'good'); };
    const ex = document.getElementById('setExport'); if (ex) ex.onclick = () => { U.closeModal(); doExport(); };
    const im = document.getElementById('setImport'); if (im) im.onclick = () => { U.closeModal(); doImport(); };
    const rs = document.getElementById('setReset'); if (rs) rs.onclick = () => { U.closeModal(); doReset(); };
  }

  function showTips() {
    U.modal(`<h3>🏛️ 三步开始</h3>
      <div class="card" style="margin-bottom:8px"><b>1 · 派人干活</b><div class="sub">左侧「工作」→ 打开「伐木」→ 点项目卡右上角的 ＋ 弹出下拉菜单，或把角色头像拖到整张卡上。每个项目都有独立槽位。</div></div>
      <div class="card" style="margin-bottom:8px"><b>2 · 研究科技</b><div class="sub">把角色派去「科研」攒科研点 → 科研页下方就是科技树，研究「火 / 语言 / 石器工艺」，新工作会逐个出现。</div></div>
      <div class="card" style="margin-bottom:8px"><b>3 · 滚起来</b><div class="sub">仓库里卖东西换金币 → 造升级项 → 提升产出；粮食会腐坏，记得保持粮仓有吃的。右上角 ⚙ 设置里可以切换浅色主题。</div></div>
      <div class="acts"><button class="primary" data-act="closeModal">开始</button></div>`);
  }

  function gameTick() {
    // 后台标签页不做任何处理：浏览器会把定时器节流到 1 次/分钟，
    // 边走边结算会让每次只有 60 秒、永远够不到弹窗阈值；回来一次算总账。
    if (document.hidden) return;
    const now = performance.now();
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    if (dt <= 0) return;
    try {
      if (dt >= E.GAME.offlineMinSec) {
        // 切后台 / 电脑休眠回来：按离线期望值结算，不再丢时间
        const rep = E.settleOffline(dt);
        E.save(true);
        U.render();
        if (rep && rep.used >= OFFLINE_POPUP_SEC) showOffline(rep);
        return;
      }
      // 小抖动按 0.2 秒分步追平（单步别把战斗模拟撑坏）
      const steps = Math.min(300, Math.max(1, Math.ceil(dt / 0.2)));
      for (let i = 0; i < steps; i++) E.tick(dt / steps);
      U.tick();
    } catch (e) { console.error(e); }
  }

  /* ---------------- 全局事件 ---------------- */
  function wireGlobal() {
    document.addEventListener('click', onClick);
    document.addEventListener('click', e => {
      if (!slotMenuEl) return;
      if (e.target.closest('#slotMenu') || e.target.closest('[data-act="recslot"],[data-act="cardrec"]')) return;
      closeSlotMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSlotMenu(); U.hideTip(); } });
    // 物品悬浮面板：mouseover 决定显示谁，mousemove 只记坐标（整页重绘后 syncTip 靠坐标找回锚点）
    document.addEventListener('mouseover', e => U.onHover(e));
    document.addEventListener('mousemove', e => U.onHoverMove(e), { passive: true });
    document.documentElement.addEventListener('mouseleave', () => U.hideTip());
    window.addEventListener('scroll', () => U.hideTip(), true);
    document.addEventListener('dragover', e => {
      const card = e.target.closest('[data-drop-job]');
      if (card && dragData && dragData.kind === 'char') {
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        if (!card.classList.contains('dropok')) {
          document.querySelectorAll('.recipe.dropok').forEach(x => x.classList.remove('dropok'));
          card.classList.add('dropok');
        }
        return;
      }
      const t = e.target.closest('[data-act="recslot"],[data-act="eqslot"],[data-act="selectChar"]');
      if (t) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; t.classList.add('hover'); }
    });
    document.addEventListener('dragleave', e => {
      const card = e.target.closest('[data-drop-job]');
      if (card && !card.contains(e.relatedTarget)) card.classList.remove('dropok');
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
      document.querySelectorAll('.chip.hover,.slot.hover,.recipe.dropok').forEach(x => x.classList.remove('hover', 'dropok'));
    });
    const page = document.getElementById('page');
    if (page) page.addEventListener('scroll', closeSlotMenu, { passive: true });
    window.addEventListener('resize', closeSlotMenu);

    document.getElementById('btnSave').onclick = () => { E.save(); U.render(); };
    document.getElementById('btnExport').onclick = doExport;
    document.getElementById('btnImport').onclick = doImport;
    const br = document.getElementById('btnReset'); if (br) br.onclick = doReset;
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
      case 'recslot': openJobSlot(el.dataset.job || id, +(i || 0), el); break;
      /* 整张项目卡：空置 → 弹出与入驻槽相同的下拉菜单；已有人 → 直接撤下 */
      case 'cardrec': {
        const jobId = el.dataset.job, idx = +(el.dataset.i || 0);
        const js2 = S.jobs[jobId];
        const cur = (js2 && js2.slots) ? js2.slots[idx] : null;
        if (cur && S.chars[cur]) {
          E.clearSlot(jobId, idx);
          U.toast('已撤下 ' + E.charName(S.chars[cur]));
          U.render();
        } else openJobSlot(jobId, idx, el);
        break;
      }
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
        const cid = selectedCharId();
        if (cid) equipItem(cid, id, true); break;
      }
      case 'autoEquip': autoEquip(selectedCharId()); break;
      case 'unequipAll': {
        const c = S.chars[selectedCharId()]; if (c) { Object.keys(c.eq).forEach(s => { if (c.eq[s]) { E.addItem(c.eq[s], 1); c.eq[s] = null; } }); U.render(); }
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
      case 'dismissChar': confirmDismiss(id); break;
      case 'pull': doPull(id); break;
      case 'claimCodex': {
        const r = E.codexClaim(k, id);
        U.toast(r.ok ? '领取 ' + r.n + ' 个英雄碎片' : (r.why || '没有可领取的奖励'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'claimAllCodex': {
        const r = E.codexClaimAll();
        U.toast(r.count ? '一键领取 ' + r.count + ' 项，共 ' + r.n + ' 个英雄碎片' : '没有可领取的奖励', r.count ? 'good' : 'bad');
        U.render(); break;
      }
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
    if (!dragData) return;
    const card = e.target.closest('[data-drop-job]');
    if (card && dragData.kind === 'char') {
      e.preventDefault();
      assignJob(card.dataset.dropJob, +(card.dataset.dropI || 0), dragData.id);
      dragData = null;
      document.querySelectorAll('.recipe.dropok').forEach(x => x.classList.remove('dropok'));
      return;
    }
    const target = e.target.closest('[data-act="recslot"],[data-act="eqslot"],[data-act="selectChar"]');
    if (!target) return;
    e.preventDefault();
    const kind = dragData.kind, id = dragData.id;
    if (target.dataset.act === 'recslot' && kind === 'char') assignJob(target.dataset.job, +(target.dataset.i || 0), id);
    if (target.dataset.act === 'eqslot' && kind === 'item') equipItem(selectedCharId(), id, true);
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
  function closeSlotMenu() {
    if (slotMenuEl) { slotMenuEl.remove(); slotMenuEl = null; }
  }
  function openJobSlot(jobId, slotIdx, anchor) {
    closeSlotMenu();
    const S = E.S, job = E.JOB_BY_ID[jobId];
    if (!job || !anchor) return;
    const idx = slotIdx || 0;
    const recipe = E.jobRecipes(job)[idx] || { name: job.name };
    const list = S.order.slice(0, E.onFieldCap()).map(id => S.chars[id]).filter(Boolean);
    const curId = S.jobs[jobId].slots ? S.jobs[jobId].slots[idx] : null;
    const menu = document.createElement('div');
    menu.id = 'slotMenu';
    menu.className = 'slotmenu';
    menu.innerHTML = `
      <div class="pmh">入驻 · ${U.esc(job.name)}${E.jobRecipes(job).length > 1 ? ' · ' + U.esc(recipe.name) : ''}</div>
      <div class="pms">前 ${E.onFieldCap()} 名角色可上场${curId ? ' · 当前：' + U.esc(E.charName(S.chars[curId])) : ' · 当前：空'}</div>
      <div class="pmlist">${list.length ? list.map(c => {
        let ok = true, why = '';
        if (job.special === 'blackSoul' && c.cid !== 'yuki') { ok = false; why = '仅星见由岐'; }
        if (job.special === 'eraSim' && c.cid !== 'dashao') { ok = false; why = '仅大少'; }
        return `<button type="button" class="pmitem ${c.cid === curId ? 'on' : ''} ${ok ? '' : 'dim'}" data-pickchar data-id="${c.cid}" ${ok ? '' : 'disabled'}>
          ${U.avatar(c, 'sm')}<span class="nm">${U.esc(E.charName(c))}</span><span class="mm">${why || '精通 ' + E.masteryLvl(c, jobId)}</span>
        </button>`;
      }).join('') : '<div class="pmempty">没有可上场的角色</div>'}</div>
      <div class="pmfoot">
        <button type="button" data-menu-unassign ${curId ? '' : 'disabled'}>撤下</button>
        <button type="button" data-menu-close>取消</button>
      </div>`;
    document.body.appendChild(menu);
    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    let left = Math.max(8, Math.min(r.left, window.innerWidth - mw - 8));
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    slotMenuEl = menu;
    menu.querySelectorAll('[data-pickchar]').forEach(el => el.onclick = () => {
      const cid = el.dataset.id;
      closeSlotMenu();
      assignJob(jobId, idx, cid);
    });
    const un = menu.querySelector('[data-menu-unassign]');
    if (un) un.onclick = () => { closeSlotMenu(); E.clearSlot(jobId, idx); U.render(); };
    menu.querySelector('[data-menu-close]').onclick = closeSlotMenu;
  }
  function selectedCharId() {
    const S = E.S;
    if (S.chars[S.ui.charSel]) return S.ui.charSel;
    return S.order[0];
  }
  function openEquipSlot(slot) {
    const S = E.S, cid = selectedCharId(), c = S.chars[cid];
    if (!c) return;
    const mh = c.eq.mainhand ? E.ITEMS[c.eq.mainhand] : null;
    const items = Object.keys(S.items).filter(id => (S.items[id] || 0) > 0 && E.ITEMS[id] && E.ITEMS[id].slot === slot);
    U.modal(`<h3>${U.esc(slotName(slot))} · ${U.esc(E.charName(c))}</h3>
      ${slot === 'offhand' && mh && mh.twoHanded ? `<div class="tiny dim" style="margin-bottom:8px">主手是双手武器「${U.esc(mh.name)}」，装备副手会自动把它退回仓库。</div>` : ''}
      ${(c.eq[slot] && E.ITEMS[c.eq[slot]]) ? `<div class="card" style="margin-bottom:10px"><div class="row" style="justify-content:space-between"><b>${U.esc(E.ITEMS[c.eq[slot]].name)}</b><button data-act="unequip" data-slot="${slot}">卸下</button></div></div>` : ''}
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
    let note = '';
    // 双手武器：占用主手后，副手装备自动退回仓库
    if (it.twoHanded && slot === 'mainhand' && c.eq.offhand) {
      E.addItem(c.eq.offhand, 1);
      c.eq.offhand = null;
      note = '双手武器占用副手，已卸下副手装备';
    }
    // 反向：装备副手时，若主手是双手武器，主手自动退回仓库
    if (slot === 'offhand' && c.eq.mainhand) {
      const mh = E.ITEMS[c.eq.mainhand];
      if (mh && mh.twoHanded) {
        E.addItem(c.eq.mainhand, 1);
        c.eq.mainhand = null;
        note = '副手已装备，双手武器已退回仓库';
      }
    }
    if (fromWarehouse === false) U.closeModal();
    U.render();
    if (note) U.toast(note);
  }
  function autoEquip(cid) {
    const S = E.S;
    cid = (cid && S.chars[cid]) ? cid : selectedCharId();
    const c = S.chars[cid];
    if (!c) { U.toast('没有可装备的角色', 'bad'); return; }
    let changed = 0;
    const cands = slot => Object.keys(S.items).filter(id =>
      (S.items[id] || 0) > 0 && E.ITEMS[id] && E.ITEMS[id].slot === slot);

    // 主手 + 副手一起算：双手武器只算主手，单手武器可以和副手相加
    const curMain = (c.eq.mainhand && E.ITEMS[c.eq.mainhand]) ? c.eq.mainhand : null;
    const curOff = (c.eq.offhand && E.ITEMS[c.eq.offhand]) ? c.eq.offhand : null;
    const uniq = arr => arr.filter((v, i, a) => v && a.indexOf(v) === i);
    const mains = uniq([curMain].concat(cands('mainhand')));
    const offs = uniq([curOff].concat(cands('offhand')));
    let best = { total: combinedScore(curMain, curOff), main: curMain, off: curOff };
    for (const m of mains) {
      const mi = E.ITEMS[m];
      if (!mi) continue;
      if (mi.cat === 'weapon' && mi.twoHanded) {
        const total = score(mi);
        if (total > best.total) best = { total, main: m, off: null };
        continue;
      }
      for (const o of [null].concat(offs)) {
        if (o === m) continue;
        const total = score(mi) + (o ? score(E.ITEMS[o]) : 0);
        if (total > best.total) best = { total, main: m, off: o };
      }
    }
    if (best.main !== curMain && (S.items[best.main] || 0) > 0) {
      equipItem(c.cid, best.main, true); changed++;
    }
    if ((best.off || null) !== (c.eq.offhand || null)) {
      if (best.off) {
        if ((S.items[best.off] || 0) > 0) { equipItem(c.cid, best.off, true); changed++; }
      } else if (c.eq.offhand) {
        E.addItem(c.eq.offhand, 1); c.eq.offhand = null; changed++;
      }
    }

    // 其余 10 栏逐栏取最高分，只换更好的
    ['head', 'headInner', 'body', 'bodyInner', 'legs', 'legsInner', 'feet', 'socks', 'neck', 'belt'].forEach(slot => {
      const list = cands(slot).filter(id => id !== c.eq[slot]);
      if (!list.length) return;
      list.sort((a, b) => score(E.ITEMS[b]) - score(E.ITEMS[a]));
      const curVal = (c.eq[slot] && E.ITEMS[c.eq[slot]]) ? score(E.ITEMS[c.eq[slot]]) : -1;
      if (score(E.ITEMS[list[0]]) > curVal) { equipItem(c.cid, list[0], true); changed++; }
    });

    U.toast(changed ? '已换上仓库里最好的装备（' + changed + ' 件）' : '当前装备已经是最优', changed ? 'good' : '');
    U.render();
  }
  function combinedScore(mainId, offId) {
    const m = mainId ? E.ITEMS[mainId] : null;
    const o = offId ? E.ITEMS[offId] : null;
    return (m ? score(m) : 0) + (o ? score(o) : 0);
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
  function confirmDismiss(cid) {
    const c = E.S.chars[cid]; if (!c) return;
    const eqN = Object.keys(c.eq).filter(s => c.eq[s]).length;
    U.modal(`<h3>开除随机普通角色</h3>
      <div class="card"><b>${U.esc(E.charName(c))}</b>
        <div class="tiny dim" style="margin-top:6px">开除后这名角色<b class="red">永久消失</b>（从角色列表与所有岗位上移除，之后也不会再抽到同一个人）；${eqN ? '身上的 ' + eqN + ' 件装备会退回仓库。' : '他身上没有装备。'}</div></div>
      <div class="acts"><button data-act="closeModal">取消</button><button class="red" id="okDismiss">确认开除</button></div>`);
    const btn = document.getElementById('okDismiss');
    if (btn) btn.onclick = () => {
      const r = E.dismissChar(cid);
      U.toast(r.ok ? '已开除 ' + r.name + (r.n ? '，归还装备 ' + r.n + ' 件' : '') : (r.why || '无法开除'), r.ok ? 'good' : 'bad');
      U.closeModal(); U.render();
    };
  }
  function openRename() {
    const S = E.S;
    U.modal(`<h3>改名</h3><input id="renameInput" class="inp" maxlength="12" value="${U.esc(S.name)}">
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
    if (r.type === 'new') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:44px">🌟</div><h2 class="gold">${U.esc(r.hero.name)}</h2><div class="sub">${r.gen ? '随机普通角色加入！' : '新角色加入！'}</div></div>`;
    else if (r.type === 'dup') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:40px">✨</div><h2>${U.esc(r.hero.name)}</h2><div class="sub">重复角色 → 星尘 ×${r.n}</div></div>`;
    else if (r.type === 'stardust') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:40px">✨</div><h2>星尘 ×${r.n}</h2><div class="sub">该池已集齐，保底转为星尘</div></div>`;
    else if (r.type === 'gift') html += `<div class="card" style="text-align:center;padding:22px"><div style="font-size:40px">🎁</div><h2>${U.esc(r.gift.name)}</h2><div class="sub">好感度礼物 +${r.gift.favor}</div></div>`;
    html += `<div class="acts"><button class="gold" id="againBtn">再抽一次</button><button data-act="closeModal">收下</button></div>`;
    U.modal(html);
    const again = document.getElementById('againBtn');
    if (again) again.onclick = () => { U.closeModal(); doPull(poolId); };
    U.render();
  }

  /* ---------------- 离线结算弹窗 ---------------- */
  function showOffline(rep) {
    if (!rep) return;
    const itOf = g => E.ITEMS[g.id] || null;
    const topGain = rep.gained.slice(0, 10);
    const topSpend = rep.spent.slice(0, 4);
    const raidWin = rep.raids.filter(r => r.win).length;
    const rows = [];
    topGain.forEach(g => {
      const it = itOf(g);
      rows.push(`<div class="row" style="justify-content:space-between;padding:2px 0"><span>${it ? U.itemIcon(it) : '📦'} ${U.esc(it ? it.name : g.id)}</span><b class="green mono">+${E.fmt(g.n)}</b></div>`);
    });
    if (rep.gold) rows.push(`<div class="row" style="justify-content:space-between;padding:2px 0"><span>💰 金币</span><b class="${rep.gold > 0 ? 'gold' : 'red'} mono">${rep.gold > 0 ? '+' : ''}${E.fmt(rep.gold)}</b></div>`);
    if (rep.research > 0) rows.push(`<div class="row" style="justify-content:space-between;padding:2px 0"><span>🔬 科研点</span><b class="blue mono">+${E.fmt(rep.research, 0)}</b></div>`);
    if (rep.kills > 0) rows.push(`<div class="row" style="justify-content:space-between;padding:2px 0"><span>⚔️ 击杀</span><b class="mono">${E.fmt(rep.kills)}</b></div>`);
    if (!rows.length) rows.push('<div class="dim small">这段时间没有产出（还有工作没派人？）</div>');
    if (rep.gained.length > topGain.length) rows.push(`<div class="tiny dim" style="margin-top:4px">另有 ${rep.gained.length - topGain.length} 种物品没列出</div>`);

    let html = `<h3>🌙 离线结算</h3>
      <div class="sub" style="margin-bottom:10px">离开了 <b>${E.fmtTime(rep.away)}</b>，按 <b>${E.fmtTime(rep.used)}</b> 结算${rep.capped ? '（离线收益上限 8 小时）' : ''}。</div>
      <div class="card">${rows.join('')}</div>`;
    if (rep.mastery && rep.mastery.length) {
      const mRows = rep.mastery.slice(0, 6).map(m =>
        `<div class="row" style="justify-content:space-between;padding:2px 0"><span>📘 ${U.esc(m.char)} · ${U.esc(m.job)}</span><b class="green mono">Lv${m.from} → ${m.to}</b></div>`);
      if (rep.mastery.length > 6) mRows.push(`<div class="tiny dim" style="margin-top:4px">另有 ${rep.mastery.length - 6} 项精通升级</div>`);
      html += `<div class="card" style="margin-top:8px">${mRows.join('')}</div>`;
    }

    const loss = [];
    if (rep.food.after < rep.food.before - 0.5) {
      loss.push(`<div class="row" style="justify-content:space-between"><span>🍎 粮仓</span><span class="mono red">${E.fmt(rep.food.before, 0)} → ${E.fmt(rep.food.after, 0)}</span></div>`);
    }
    if (topSpend.length) {
      loss.push(`<div class="tiny muted" style="margin-top:4px">消耗：${topSpend.map(g => { const it = itOf(g); return U.esc(it ? it.name : g.id) + ' −' + E.fmt(g.n); }).join(' · ')}</div>`);
    }
    if (rep.raids.length) {
      loss.push(`<div class="row" style="justify-content:space-between;margin-top:4px"><span>🛡️ 袭击 ${rep.raids.length} 次</span><span class="mono">${raidWin === rep.raids.length ? '<span class="green">全部击退</span>' : '<span class="red">失守 ' + (rep.raids.length - raidWin) + ' 次</span>'}</span></div>`);
    }
    if (loss.length) html += `<div class="card" style="margin-top:8px">${loss.join('')}</div>`;
    if (rep.injured.length) {
      html += `<div class="card" style="margin-top:8px"><b class="red">重伤</b><div class="tiny muted" style="margin-top:2px">${rep.injured.map(n => U.esc(n)).join('、')} 离线期间被打伤，需要休养或派去医疗。</div></div>`;
    }
    html += `<div class="acts"><button class="primary" data-act="closeModal">收下</button></div>`;
    U.modal(html);
  }

  /* ---------------- 存档操作 ---------------- */
  function doExport() {
    const code = E.exportSave();
    U.modal(`<h3>导出存档</h3><div class="sub" style="margin-bottom:8px">下面这段 base64 就是你的全部进度，复制保存到记事本即可备份。</div>
      <textarea readonly class="ta">${code}</textarea>
      <div class="acts"><button class="primary" id="copyBtn">复制到剪贴板</button><button data-act="closeModal">关闭</button></div>`);
    document.getElementById('copyBtn').onclick = () => {
      navigator.clipboard.writeText(code).then(() => U.toast('已复制到剪贴板', 'good')).catch(() => U.toast('复制失败，请手动全选复制', 'bad'));
    };
  }
  function doImport() {
    U.modal(`<h3>导入存档</h3><div class="sub" style="margin-bottom:8px">粘贴导出的 base64 存档，会覆盖当前进度。</div>
      <textarea id="importArea" class="ta" placeholder="粘贴存档..."></textarea>
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
      resetting = true;
      if (tickTimer) clearInterval(tickTimer);
      if (saveTimer) clearInterval(saveTimer);
      localStorage.removeItem(E.GAME.saveKey);
      location.reload();
    };
  }

  /* ---------------- 启动 ---------------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
