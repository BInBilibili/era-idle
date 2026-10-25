/* =========================================================================
   纪元放置 · 启动与交互
   ========================================================================= */
'use strict';
(function () {
  const E = window.Engine, U = window.UI;
  let tickTimer = null, saveTimer = null, lastTick = 0, dragData = null, slotMenuEl = null, giftMenuEl = null, filterMenuEl = null;
  let pendingOffline = null;
  let resetting = false;   // 「重开」确认后置 true，阻止 beforeunload/visibilitychange 把旧存档写回去
  let devTapCount = 0, devTapTimer = null;
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
      U.toast('第一步：去「工作」→「采集」→「平原」，攒出木材和石头');
    };
    document.getElementById('startBtn').onclick = go;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    setTimeout(() => input.focus(), 50);
  }

  function startGame() {
    const S = E.S;
    applyTheme((S.settings && S.settings.theme) || 'dark');
    handledDevQuery();
    if (!S.ui.page) S.ui.page = 'warehouse';
    if (S.ui.page === 'tech') S.ui.page = 'job:research';
    if (!S.shop.slots.length) E.refreshShop(true);
    E.refreshShop(false);
    renderDevButton();
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
      ${S.dev ? `<div class="card" style="margin-top:10px;border-color:#6b5522"><div class="row" style="justify-content:space-between">
        <div><b class="gold">🛠 开发者模式</b><div class="tiny muted">调试面板；改动会正常保存</div></div>
        <div class="row"><button id="setDevPanel" class="gold">打开调试面板</button><button id="setDevOff">关闭</button></div>
      </div></div>` : ''}
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
    const dp = document.getElementById('setDevPanel'); if (dp) dp.onclick = () => { U.closeModal(); openDevPanel(); };
    const dof = document.getElementById('setDevOff'); if (dof) dof.onclick = () => { U.closeModal(); setDevMode(false); };
  }

  function showTips() {
    U.modal(`<h3>🏛️ 三步开始</h3>
      <div class="card" style="margin-bottom:8px"><b>1 · 先采集</b><div class="sub">开局只有「采集」。把玩家角色拖到「灌木」或「捡石头」项目上，直接攒木材和石头；草地 / 平原 / 沼泽三个资源包项目会随着进度慢慢出现。</div></div>
      <div class="card" style="margin-bottom:8px"><b>2 · 做第一把工具</b><div class="sub">有了 1 木材 + 1 石头，伐木 / 采矿会永久出现。先买「石斧」（2 木材 + 2 石头）才会出现木材项目；石镐同理。</div></div>
      <div class="card" style="margin-bottom:8px"><b>3 · 滚起来</b><div class="sub">把食物 / 医物放进角色的补给栏；食物要粮仓有货才生效。科研需要攒到基础研究桌 30% 材料、并先买桌子，才会出现科研项目。右上角 ⚙ 设置里可以切换浅色主题。</div></div>
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
      refreshFilterMenuCounts();
    } catch (e) { console.error(e); }
  }

  /* ---------------- 全局事件 ---------------- */
  function wireGlobal() {
    document.addEventListener('click', onClick);
    document.addEventListener('click', e => {
      if (giftMenuEl) {
        if (e.target.closest('#giftMenu') || e.target.closest('[data-act="sendgift"]')) {
          // 点自己的按钮 / 菜单内部：保持下拉打开
        } else closeGiftMenu();
      }
      if (!slotMenuEl) return;
      if (e.target.closest('#slotMenu') || e.target.closest('[data-act="recslot"],[data-act="cardrec"]')) return;
      closeSlotMenu();
    });
    document.addEventListener('click', e => {
      if (!filterMenuEl) return;
      if (e.target.closest('#inputMenu') || e.target.closest('[data-act="inpfilter"]')) return;
      closeFilterMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSlotMenu(); closeGiftMenu(); closeFilterMenu(); U.hideTip(); } });
    // 物品悬浮面板：mouseover 决定显示谁，mousemove 只记坐标（整页重绘后 syncTip 靠坐标找回锚点）
    document.addEventListener('mouseover', e => U.onHover(e));
    document.addEventListener('mousemove', e => U.onHoverMove(e), { passive: true });
    document.documentElement.addEventListener('mouseleave', () => U.hideTip());
    window.addEventListener('scroll', e => {
      // 整页重绘会先清空再还原滚动位置，这个 scroll 事件不是用户在滚动：别把物品面板关掉
      if (Date.now() < (U._scrollLock || 0)) return;
      // 面板自己有滚动条：在面板里滚轮查看长说明时不应该关闭
      if (e.target && e.target.closest && e.target.closest('#itemTip')) return;
      U.hideTip();
    }, true);
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
    if (page) page.addEventListener('scroll', () => {
      if (E.S && E.S.ui) E.S.ui.scroll = page.scrollTop;   // 记住页面滚动，重绘后还原
      closeSlotMenu();
      closeGiftMenu();
    }, { passive: true });
    window.addEventListener('resize', () => { closeSlotMenu(); closeGiftMenu(); });
    // 开发者后门：连点版本号 5 次
    const verEl = document.getElementById('hudVer');
    if (verEl) verEl.addEventListener('click', () => {
      devTapCount++;
      clearTimeout(devTapTimer);
      devTapTimer = setTimeout(() => { devTapCount = 0; }, 1600);
      if (devTapCount >= 5) {
        devTapCount = 0;
        setDevMode(!(E.S && E.S.dev));
      }
    });

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
      case 'recslot': {
        const jobId = el.dataset.job || id, idx = +(i || 0);
        // v0.0.40：再次点击同一个入驻槽 = 收起下拉，不再重开
        if (slotMenuEl && slotMenuEl.dataset.job === jobId && +slotMenuEl.dataset.i === idx) {
          closeSlotMenu();
          break;
        }
        openJobSlot(jobId, idx, el);
        break;
      }
      /* 整张项目卡：空置 → 弹出与入驻槽相同的下拉菜单；已有人 → 直接撤下 */
      case 'cardrec': {
        const jobId = el.dataset.job, idx = +(el.dataset.i || 0);
        const js2 = S.jobs[jobId];
        const cur = (js2 && js2.slots) ? js2.slots[idx] : null;
        if (cur && S.chars[cur]) {
          E.clearSlot(jobId, idx);
          U.toast('已撤下 ' + E.charName(S.chars[cur]));
          U.render();
        } else {
          if (slotMenuEl && slotMenuEl.dataset.job === jobId && +slotMenuEl.dataset.i === idx) {
            closeSlotMenu();
            break;
          }
          openJobSlot(jobId, idx, el);
        }
        break;
      }
      case 'recipe': S.jobs[id].recipe = +i; U.render(); break;
      /* v0.0.38：模糊投入的浮层筛选面板（素食食材 / 肉食食材 / 种子 / 金属） */
      case 'inpfilter': {
        const jobId = el.dataset.job, slotIdx = +(el.dataset.i || 0);
        // v0.0.40：再次点击同一个筛选徽章 = 收起下拉
        if (filterMenuEl && filterMenuEl.dataset.job === jobId
            && +filterMenuEl.dataset.i === slotIdx && filterMenuEl.dataset.in === el.dataset.in) {
          closeFilterMenu();
          break;
        }
        const job = E.JOB_BY_ID[jobId];
        const r = job ? E.jobRecipes(job)[slotIdx] : null;
        if (job && r) openInputFilter(job.id, slotIdx, el.dataset.in, el);
        break;
      }
      case 'hubPanel': openHusbandryPanel(); break;
      case 'hubRemove': {
        const r = E.removeHusbandryAnimal(+i);
        if (r.ok) U.toast('已移出：' + r.name);
        U.render(); break;
      }
      case 'upg': {
        const r = E.buyUpgrade(id, +i);
        U.toast(r.ok ? '已建造升级' : (r.why || '无法建造'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'tech': {
        const r = E.researchTech(id);
        U.toast(r.ok ? '研究完成' : (r.why || '无法研究'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'devDestroyUpg': {
        const r = E.revokeUpgrade(id, +i);
        if (r.ok) E.save(true);
        U.toast(r.ok ? '已摧毁：' + r.list.map(x => x.name).join('、') : (r.why || '无法摧毁'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'devDegradeTech': confirmDegradeTech(id); break;
      case 'sell': { const g = E.sellItem(id, 1); if (g) U.toast('卖出获得 ' + E.fmt(g) + ' 金'); U.render(); break; }
      case 'sellall': { const g = E.sellItem(id, S.items[id] || 0); if (g) U.toast('卖出获得 ' + E.fmt(g) + ' 金'); U.render(); break; }
      case 'buy': confirmBuy(+i); break;
      case 'buyPotion': {
        const sd = E.N2I('星尘'), pot = E.N2I('升星药水'), cost = E.POTION_STARDUST_COST;
        if (E.count(sd) >= cost) { E.removeItem(sd, cost); E.addItem(pot, 1); U.toast('买到升星药水 ×1', 'good'); } else U.toast('星尘不足', 'bad');
        U.render(); break;
      }
      case 'buybook': {
        const it = E.ITEMS[id]; if (!it) break;
        const price = E.buyPrice(id);
        if (S.gold < price) { U.toast('金币不足', 'bad'); break; }
        if (E.warehouseFull() && !S.items[id]) { U.toast('仓库已满', 'bad'); break; }
        S.gold -= price; E.addItem(id, 1); U.toast('购买《' + it.name + '》', 'good'); U.render(); break;
      }
      case 'eqslot': openEquipSlot(slot); break;
      case 'foodslot': openSupplySlot('food'); break;
      case 'medslot': openSupplySlot('med'); break;
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
      case 'sendgift': openGiftMenu(id, el); break;
      case 'dismissChar': confirmDismiss(id); break;
      case 'pull': doPull(id); break;
      case 'claimCodex': {
        const r = E.codexClaim(k, id);
        U.toast(r.ok ? '领取 ' + r.n + ' 张招募券' : (r.why || '没有可领取的奖励'), r.ok ? 'good' : 'bad');
        U.render(); break;
      }
      case 'claimAllCodex': {
        const r = E.codexClaimAll();
        U.toast(r.count ? '一键领取 ' + r.count + ' 项，共 ' + r.n + ' 张招募券' : '没有可领取的奖励', r.count ? 'good' : 'bad');
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
          <div class="sub" style="margin-top:8px">${st > de ? '按当前战力，这次会被攻破。' : '按当前战力可以击退。'}</div>
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
  function closeFilterMenu() {
    if (filterMenuEl) { filterMenuEl.remove(); filterMenuEl = null; }
  }
  /* v0.0.42：筛选下拉开着时，物品可能被项目 / 建造 / 商店实时消耗，
     每帧把「×数量」重写一遍，不再停留在打开那一刻的库存。 */
  function refreshFilterMenuCounts() {
    const menu = filterMenuEl;
    if (!menu || !menu.isConnected || !E.S || !E.S.seen) return;
    menu.querySelectorAll('[data-pickitem]').forEach(el => {
      const id = el.dataset.pickitem;
      const mm = el.querySelector('.mm');
      if (!mm) return;
      mm.textContent = E.S.seen.items[id] ? '×' + E.fmt(E.count(id)) : '×？';
    });
  }
  /* 模糊投入筛选：与入驻槽一样的浮层下拉列表，不再塞进项目卡内部。
     v0.0.39：点选即写回存档（无需「应用」）；「取消」撤销本次打开后的所有改动。 */
  function openInputFilter(jobId, slotIdx, inputName, anchor) {
    closeSlotMenu();
    closeFilterMenu();
    const job = E.JOB_BY_ID[jobId];
    const r = job ? E.jobRecipes(job)[slotIdx] : null;
    if (!job || !r || !anchor) return;
    const all = E.genericItemIds(inputName);
    const initial = E.inputSelection(jobId, r, inputName).filter(id => all.indexOf(id) >= 0);
    const selected = new Set(initial);
    const menu = document.createElement('div');
    menu.id = 'inputMenu';
    menu.className = 'slotmenu inpmenu';
    menu.dataset.job = jobId;
    menu.dataset.i = slotIdx;
    menu.dataset.in = inputName;
    menu.innerHTML = `
      <div class="pmh">筛选</div>
      <div class="pmlist">${all.length ? all.map(id => {
        const it = E.ITEMS[id]; if (!it) return '';
        const on = selected.has(id);
        // v0.0.40：图鉴还没收录的物品不露图标 / 名称 / 库存，只显示问号
        const seen = !!(E.S.seen && E.S.seen.items && E.S.seen.items[id]);
        if (!seen) {
          return `<button type="button" class="pmitem ${on ? 'on' : ''}" data-pickitem="${id}">
            <span class="qmark">？</span><span class="nm">？？？</span><span class="mm">×？</span><span class="tick">${on ? '✓' : '＋'}</span>
          </button>`;
        }
        return `<button type="button" class="pmitem ${on ? 'on' : ''}" data-pickitem="${id}" data-tip-item="${id}">
          ${U.itemIcon(it)}<span class="nm">${U.esc(it.name)}</span><span class="mm">×${E.fmt(E.count(id))}</span><span class="tick">${on ? '✓' : '＋'}</span>
        </button>`;
      }).join('') : '<div class="pmempty">没有可筛选的物品</div>'}</div>
      <div class="pmfoot inpfoot">
        <button type="button" data-menu-all>全选</button>
        <button type="button" data-menu-none>全不选</button>
        <button type="button" data-menu-cancel>取消</button>
      </div>`;
    document.body.appendChild(menu);
    const rct = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    const left = Math.max(8, Math.min(rct.left, window.innerWidth - mw - 8));
    let top = rct.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, rct.top - mh - 6);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    filterMenuEl = menu;
    /* 每次改动立即写存档并重绘页面（徽章 / 够不够料同步变化），下拉本身留在原地 */
    const apply = () => {
      E.setInputSelection(jobId, r, inputName, Array.from(selected));
      E.save(true);
      U.render();
    };
    const paint = () => {
      menu.querySelectorAll('[data-pickitem]').forEach(el => {
        const onNow = selected.has(el.dataset.pickitem);
        el.classList.toggle('on', onNow);
        const tick = el.querySelector('.tick');
        if (tick) tick.textContent = onNow ? '✓' : '＋';
      });
    };
    menu.querySelectorAll('[data-pickitem]').forEach(el => el.onclick = () => {
      const id = el.dataset.pickitem;
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      paint();
      apply();
    });
    const setAll = on => {
      selected.clear();
      if (on) all.forEach(id => selected.add(id));
      paint();
      apply();
    };
    menu.querySelector('[data-menu-all]').onclick = () => setAll(true);
    menu.querySelector('[data-menu-none]').onclick = () => setAll(false);
    menu.querySelector('[data-menu-cancel]').onclick = () => {
      E.setInputSelection(jobId, r, inputName, initial);
      closeFilterMenu();
      E.save(true);
      U.render();
    };
  }
  /* 畜牧「＋」面板：列出可圈养动物（名称 / 消耗 / 产出 / 时间 / 占用容量 / 认知度门槛） */
  function openHusbandryPanel() {
    const cap = E.husbandryCapacity(), used = E.husbandryUsed();
    const list = E.husbandryAnimalList();
    const rows = list.map(a => {
      const e = E.ENEMY_BY_NAME[a.name];
      const canFit = used + a.sizeCost <= cap + 1e-9;
      const ok = a.unlocked && canFit;
      const why = !a.unlocked ? '认知度 ' + a.know + '/' + a.need
        : (!canFit ? '容量不足' : '');
      return `<button type="button" class="pickrow ${ok ? '' : 'lack'}" data-hubadd="${U.esc(a.name)}" ${ok ? '' : 'disabled'}>
        <span class="pi">${e ? U.enemyIcon(e, 'xs') : '🐾'}</span>
        <span class="pn">
          <b>${U.esc(a.name)}</b>
          <span class="badge" style="margin-left:6px">占用 ${a.sizeCost}</span>
          <span class="badge" style="margin-left:4px">${a.duration} 秒 / 次</span>
          <div class="tiny muted">消耗：草料 ${a.consume} / 天 · 产出：${U.ioList(a.outputs)}</div>
          ${why ? `<div class="tiny ${a.unlocked ? 'red' : 'dim'}">${U.esc(why)}</div>` : ''}
        </span>
        <span class="pc mono ${ok ? 'green' : 'dim'}">${ok ? '可圈养' : (a.unlocked ? '容量满' : '未解锁')}</span>
      </button>`;
    }).join('');
    U.modal(`<h3>可畜牧动物</h3>
      <div class="sub" style="margin-bottom:10px">畜牧容量 <b class="mono">${E.fmt(used)} / ${E.fmt(cap)}</b>；狩猎提高该动物的图鉴认知度，达到各自门槛后解锁（兔子约 2 只、熊约 16 只）。</div>
      <div class="picklist">${rows || '<div class="empty">暂无可畜牧动物</div>'}</div>
      <div class="acts"><button data-act="closeModal">关闭</button></div>`);
    document.querySelectorAll('#modalBox [data-hubadd]').forEach(el => {
      el.onclick = () => {
        const r = E.addHusbandryAnimal(el.dataset.hubadd);
        if (!r.ok) { U.toast(r.why || '无法圈养', 'bad'); return; }
        U.closeModal();
        U.render();
        U.toast('已圈养 ' + r.name + '（占用 ' + E.fmt(r.used) + ' / ' + E.fmt(r.cap) + '）', 'good');
      };
    });
  }
  /* v0.0.34：查角色当前入驻的岗位（工作 + 具体项目），入驻下拉里用来说明「他现在在哪」。
     每个角色同一时间只占一个槽（assignSlot 会先清掉旧槽），所以找到第一个即可。 */
  function currentJobOf(cid) {
    const S = E.S;
    for (const jobId in S.jobs) {
      const js = S.jobs[jobId];
      if (!js || !Array.isArray(js.slots)) continue;
      const idx = js.slots.indexOf(cid);
      if (idx < 0) continue;
      const job = E.JOB_BY_ID[jobId];
      if (!job) continue;
      const rs = E.jobRecipes(job);
      const recipe = rs[idx] || (rs.length === 1 ? rs[0] : null);
      return { job, idx, recipe };
    }
    return null;
  }
  function openJobSlot(jobId, slotIdx, anchor) {
    closeSlotMenu();
    closeFilterMenu();
    const S = E.S, job = E.JOB_BY_ID[jobId];
    if (!job || !anchor) return;
    const idx = slotIdx || 0;
    const recipe = E.jobRecipes(job)[idx] || { name: job.name };
    const list = S.order.slice(0, E.onFieldCap()).map(id => S.chars[id]).filter(Boolean);
    const curId = S.jobs[jobId].slots ? S.jobs[jobId].slots[idx] : null;
    const menu = document.createElement('div');
    menu.id = 'slotMenu';
    menu.className = 'slotmenu';
    menu.dataset.job = jobId;
    menu.dataset.i = idx;
    menu.innerHTML = `
      <div class="pmh">入驻 · ${U.esc(job.name)}${E.jobRecipes(job).length > 1 ? ' · ' + U.esc(recipe.name) : ''}</div>
      <div class="pms">${curId ? '当前：' + U.esc(E.charName(S.chars[curId])) : '当前：空'}</div>
      <div class="pmlist">${list.length ? list.map(c => {
        let ok = true, why = '';
        if (job.special === 'blackSoul' && c.cid !== 'yuki') { ok = false; why = '仅星见由岐'; }
        if (job.special === 'eraSim' && c.cid !== 'dashao') { ok = false; why = '仅大少'; }
        const work = currentJobOf(c.cid);
        const here = work && work.job.id === jobId && work.idx === idx;
        const where = here
          ? '<span class="where here">当前岗位</span>'
          : (work
            ? `<span class="where">${U.jobIcon(work.job)}${U.esc(work.job.name)}${work.recipe && work.recipe.name && work.recipe.name !== work.job.name ? ' · ' + U.esc(work.recipe.name) : ''}</span>`
            : '<span class="where idle">闲置</span>');
        return `<button type="button" class="pmitem ${c.cid === curId ? 'on' : ''} ${ok ? '' : 'dim'}" data-pickchar data-id="${c.cid}" ${ok ? '' : 'disabled'}>
          ${U.avatar(c, 'sm')}<span class="nm">${U.esc(E.charName(c))}${where}</span><span class="mm">${why || '精通 ' + E.masteryLvl(c, jobId)}</span>
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

  /* 补给栏：食物 / 医物下拉列表（弹窗形式，不会被后台整页重绘冲掉） */
  function openSupplySlot(field) {
    const S = E.S, cid = selectedCharId(), c = S.chars[cid];
    if (!c) return;
    const food = field === 'food';
    const label = food ? '食物' : '医物';
    const list = Object.keys(E.ITEMS).filter(id => {
      if (food) return E.isFoodItem(id) && (E.itemEver(id) || E.count(id) > 0);
      return !!(E.ITEMS[id].med && (E.itemEver(id) || E.count(id) > 0));
    });
    if (food) {
      const top = ['vegetarian_meal', 'meat_meal', 'balanced_meal'];
      list.sort((a, b) => {
        const ai = top.indexOf(a), bi = top.indexOf(b);
        if (ai !== bi) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        const ac = E.ITEMS[a].cat === 'cooked' ? 0 : 1, bc = E.ITEMS[b].cat === 'cooked' ? 0 : 1;
        if (ac !== bc) return ac - bc;
        return (E.ITEMS[b].price || 0) - (E.ITEMS[a].price || 0);
      });
    } else {
      list.sort((a, b) => (E.ITEMS[a].med.healMul || 1) - (E.ITEMS[b].med.healMul || 1));
    }
    const cur = c[field] || '';
    const rows = list.map(id => {
      const it = E.ITEMS[id], stock = E.count(id);
      const effect = food ? E.foodEffectText(id)
        : `受伤时 ×${it.med.healMul} 回血 · 每 ${it.med.consumeSec} 秒消耗 1`;
      return `<button type="button" class="pickrow ${cur === id ? 'on' : ''} ${stock > 0 ? '' : 'lack'}" data-pick="${id}">
        <span class="pi">${U.itemIcon(it)}</span>
        <span class="pn"><b>${U.esc(it.name)}</b><div class="tiny muted">${U.esc(effect)}</div></span>
        <span class="pc mono ${stock > 0 ? 'green' : 'red'}">${stock > 0 ? '×' + E.fmt(stock) : '缺货'}</span>
      </button>`;
    }).join('');
    U.modal(`<h3>${label}栏 · ${U.esc(E.charName(c))}</h3>
      <div class="sub" style="margin-bottom:10px">${food
        ? '选中后，该角色会优先消耗这种食物；粮仓里有货时才会获得效果。不选则从最好用的食物开始消耗。'
        : '选中后，角色受伤时会自动消耗该医物，提高回血速度；只在受伤时消耗。'}</div>
      <button type="button" class="pickrow ${cur ? '' : 'on'}" data-pick="">
        <span class="pi">🔄</span><span class="pn"><b>自动 / 不指定</b><div class="tiny muted">${food ? '按最贵的可食用食物依次消耗' : '不额外消耗医物'}</div></span><span class="pc"></span>
      </button>
      <div class="picklist">${rows || `<div class="empty">${food ? '粮仓里还没有任何食物' : '仓库里还没有任何医物'}</div>`}</div>
      <div class="acts"><button data-act="closeModal">关闭</button></div>`);
    document.querySelectorAll('#modalBox [data-pick]').forEach(el => {
      el.onclick = () => {
        c[field] = el.dataset.pick || null;
        if (field === 'med') c.medT = 0;
        E.save(true);
        U.closeModal();
        U.render();
        U.toast(c[field] ? '已装备 ' + E.ITEMS[c[field]].name : '已取消' + label + '选择');
      };
    });
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

    /* v0.0.33：一键最优把补给栏一起选上。
       食物：粮仓有货的优先特殊餐（均衡餐 > 肉餐 > 素餐），同类取贵的；
       医物：仓库有货里回血倍率最高的。没有库存则保持原样，不选「缺货」的。 */
    let supplyN = 0;
    const foodRank = id => id === 'balanced_meal' ? 3 : id === 'meat_meal' ? 2 : id === 'vegetarian_meal' ? 1 : 0;
    const foodCands = Object.keys(E.ITEMS).filter(id => E.isFoodItem(id) && E.count(id) > 0);
    if (foodCands.length) {
      foodCands.sort((a, b) => foodRank(b) - foodRank(a) || (E.ITEMS[b].price || 0) - (E.ITEMS[a].price || 0));
      if (c.food !== foodCands[0]) { c.food = foodCands[0]; supplyN++; }
    }
    const medCands = Object.keys(E.ITEMS).filter(id => E.ITEMS[id].med && E.count(id) > 0);
    if (medCands.length) {
      medCands.sort((a, b) => (E.ITEMS[b].med.healMul || 1) - (E.ITEMS[a].med.healMul || 1));
      if (c.med !== medCands[0]) { c.med = medCands[0]; c.medT = 0; supplyN++; }
    }

    const parts = [];
    if (changed) parts.push('换上最好装备 ' + changed + ' 件');
    if (supplyN) parts.push('补给已选最优 ' + supplyN + ' 项');
    U.toast(parts.length ? parts.join(' · ') : '当前装备与补给已经是最优', parts.length ? 'good' : '');
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
  function closeGiftMenu() {
    if (giftMenuEl) { giftMenuEl.remove(); giftMenuEl = null; }
  }
  /* v0.0.33：送礼物改成常驻下拉（锚在按钮下方）。
     赠送后不关闭：原地刷新库存与好感动，角色卡片也随 U.render() 刷新节点。 */
  function openGiftMenu(cid, anchor) {
    const S = E.S, c = S.chars[cid];
    if (!c || !anchor) return;
    closeGiftMenu();
    const menu = document.createElement('div');
    menu.id = 'giftMenu';
    menu.className = 'slotmenu giftmenu';
    document.body.appendChild(menu);
    const draw = () => {
      const gifts = E.GIFTS.map(g => ({ g, it: E.ITEMS[g.id], n: E.count(g.id) }));
      menu.innerHTML = `
        <div class="pmh">🎁 送礼物 · ${U.esc(E.charName(c))}</div>
        <div class="pms">当前好感度 <b class="violet">${c.favor}</b> / 100 · 50 解锁一级恩赐，100 解锁二级<br>赠送后下拉不会关闭，可以连续送。</div>
        <div class="pmlist">${gifts.map(({ g, it, n }) => `
          <button type="button" class="pmitem ${n ? '' : 'dim'}" data-gift="${g.id}" ${n ? '' : 'disabled'}>
            ${it ? U.itemIcon(it) : '🎁'}
            <span class="nm">${U.esc(g.name)} <span class="tiny dim">+${g.favor}</span></span>
            <span class="mm tiny ${n ? 'green' : 'dim'}">×${E.fmt(n)}</span>
            <span class="mm tiny gold">赠送</span>
          </button>`).join('')}</div>
        <div class="pmfoot"><span class="favnow">好感度 <b>${c.favor}</b>/100</span><button type="button" data-menu-close>关闭</button></div>`;
      menu.querySelectorAll('[data-gift]').forEach(el => el.onclick = ev => {
        // 菜单内部点击不应触发「点外面关闭」；U.render() 会替换页面，事件冒泡到 document 时按钮已脱离 DOM
        ev.stopPropagation();
        const giftId = el.dataset.gift;
        const r = E.giftTo(cid, giftId);
        if (!r || !r.ok) { U.toast((r && r.why) || '无法赠送', 'bad'); return; }
        U.toast('好感度 +' + E.GIFTS.find(g => g.id === giftId).favor, 'good');
        U.render();   // 刷新角色卡上的好感度与节点高亮
        draw();       // 下拉保持打开，原地刷新库存 / 好感
      });
      const cl = menu.querySelector('[data-menu-close]');
      if (cl) cl.onclick = closeGiftMenu;
    };
    draw();
    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    let left = Math.max(8, Math.min(r.left, window.innerWidth - mw - 8));
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    giftMenuEl = menu;
  }
  function doPull(poolId) {
    const r = E.pull(poolId);
    if (!r.ok) { U.toast(r.why || '抽卡失败', 'bad'); return; }
    let html = '<h3>抽卡结果</h3>';
    if (r.type === 'new') {
      const ch = E.S.chars[r.hero.id];
      html += `<div class="card" style="text-align:center;padding:22px">
        <div class="drawArt">${ch ? U.avatar(ch, 'lg') : ''}</div>
        <h2 class="gold">${U.esc(r.hero.name)}</h2><div class="sub">${r.gen ? '随机普通角色加入！' : '新角色加入！'}</div></div>`;
    } else if (r.type === 'dup') {
      const ch = E.S.chars[r.hero.id];
      html += `<div class="card" style="text-align:center;padding:22px">
        <div class="drawArt">${ch ? U.avatar(ch, 'lg') : ''}</div>
        <h2>${U.esc(r.hero.name)}</h2><div class="sub">重复角色 → 星尘 ×${r.n}</div></div>`;
    } else if (r.type === 'stardust') {
      const it = E.ITEMS[E.N2I('星尘')];
      html += `<div class="card" style="text-align:center;padding:22px">
        <div class="drawArt">${it ? U.itemIcon(it) : ''}</div>
        <h2>星尘 ×${r.n}</h2><div class="sub">该池已集齐，保底转为星尘</div></div>`;
    } else if (r.type === 'gift') {
      const it = E.ITEMS[r.gift.id];
      html += `<div class="card" style="text-align:center;padding:22px">
        <div class="drawArt">${it ? U.itemIcon(it) : ''}</div>
        <h2>${U.esc(it ? it.name : r.gift.name)}</h2><div class="sub">好感度礼物 +${r.gift.favor}</div></div>`;
    }
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

  /* ---------------- 开发者模式（后门） ---------------- */
  function handledDevQuery() {
    const q = new URLSearchParams(location.search);
    if (!q.has('dev')) return;
    E.S.dev = q.get('dev') !== '0';
    E.save(true);
  }
  function renderDevButton() {
    const acts = document.querySelector('#hud .acts');
    if (!acts) return;
    let btn = document.getElementById('btnDev');
    if (E.S && E.S.dev) {
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btnDev';
        btn.className = 'gold';
        btn.title = '开发者模式：调试面板';
        btn.textContent = '🛠 开发者';
        btn.onclick = openDevPanel;
        acts.insertBefore(btn, acts.firstChild);
      }
    } else if (btn) btn.remove();
  }
  function setDevMode(on) {
    if (!E.S) return;
    E.S.dev = !!on;
    E.save(true);
    renderDevButton();
    U.render();
    if (on) {
      U.toast('开发者模式已开启：右上角 🛠 或设置里打开调试面板', 'good');
      openDevPanel();
    } else {
      U.closeModal();
      U.toast('开发者模式已关闭');
    }
  }
  /* 开发者专用：直接摧毁已购升级项（不弹确认，不返还材料）。 */
  function confirmDegradeTech(id) {
    const S = E.S;
    if (!S || !S.dev) return;
    const plan = E.techRevokePlan(id);
    if (!plan.ok) { U.toast(plan.why || '无法退化', 'bad'); return; }
    const names = plan.list.map(x => U.esc(x.name));
    const t = E.TECHS.find(x => x.id === id);
    U.modal(`<h3 class="red">退化科技？</h3>
      <div class="sub">将撤销研究：<b class="red">${names.join('、')}</b></div>
      <div class="card" style="margin-top:10px">
        ${names.length > 1 ? '<div class="tiny muted">依赖它的后续科技会一起退化。</div>' : ''}
        <div class="tiny muted" style="margin-top:6px">科研点不返还；依赖该科技的工作 / 项目会重新上锁，相关入驻角色会被撤下。</div>
        ${t && t.desc ? `<div class="tiny dim" style="margin-top:6px">${U.esc(t.desc)}</div>` : ''}
      </div>
      <div class="acts"><button data-act="closeModal">取消</button><button class="danger" id="devTechOk">确认退化</button></div>`);
    document.getElementById('devTechOk').onclick = () => {
      const r = E.revokeTech(id);
      U.closeModal();
      E.save(true);
      U.render();
      const cleared = r.ok && r.cleared && r.cleared.length ? '；撤下 ' + r.cleared.join('、') : '';
      U.toast(r.ok ? '已退化：' + r.list.map(x => x.name).join('、') + cleared : (r.why || '无法退化'), r.ok ? 'good' : 'bad');
    };
  }
  /* 开发者操作 id → 中文提示（v0.0.42：新增畜牧认知度，顺便不再把内部 id 弹给玩家） */
  const DEV_ACTION_LABEL = {
    gold: '金币 +100,000', research: '科研点 +100,000', items: '每种物品 +100', food: '粮仓每种 +500',
    techs: '解锁全部科技', unlock: '一键全解锁', husbandry: '解锁所有畜牧认知度',
    heal: '治愈所有角色', codex: '解锁全部图鉴', shop: '刷新商店', uninjured: '清除「受伤」里程碑',
  };
  function devAction(action) {
    const S = E.S;
    if (!S || !S.dev) return;
    if (action === 'gold') S.gold += 100000;
    else if (action === 'research') S.research += 100000;
    else if (action === 'items') {
      Object.keys(E.ITEMS).forEach(id => {
        const it = E.ITEMS[id];
        if (it.hidden || it.bundle || it.virtual) return;
        E.addItem(id, 100);
      });
    } else if (action === 'food') {
      Object.keys(E.ITEMS).forEach(id => {
        if (E.ITEMS[id].storage === 'granary') E.addItem(id, 500);
      });
    } else if (action === 'techs') {
      E.TECHS.forEach(t => { S.techs[t.id] = true; });
    } else if (action === 'unlock') {
      S.milestones = Object.assign({}, S.milestones, { wood_stone: true, research_ready: true, injured: true });
      E.TECHS.forEach(t => { S.techs[t.id] = true; });
      Object.keys(E.ITEMS).forEach(id => { S.ever[id] = 1; });
      E.JOBS.forEach(j => {
        if (!S.jobs[j.id]) S.jobs[j.id] = { slots: [], prog: [], blocked: [], up: [] };
        S.jobs[j.id].up = new Array((j.upgrades || []).length).fill(1);
      });
      E.refreshMilestones();
    } else if (action === 'husbandry') {
      // v0.0.42：把所有动物的图鉴认知度拉满，畜牧面板全部解锁
      Object.keys(S.chars).forEach(id => {
        const c = S.chars[id];
        if (!c) return;
        if (!c.know) c.know = {};
        Object.keys(E.HUSBANDRY_ANIMALS).forEach(nm => { c.know[nm] = E.HUSBANDRY_UNLOCK_KNOW; });
      });
    } else if (action === 'heal') {
      Object.keys(S.chars).forEach(id => {
        const c = S.chars[id];
        c.injured = false;
        c.hpNow = E.charStats(c).maxHp;
        c.medT = 0;
      });
    } else if (action === 'codex') {
      Object.keys(E.ITEMS).forEach(id => { if (!E.ITEMS[id].hidden) S.seen.items[id] = true; });
      E.ENEMIES.forEach(e => { if (!e.hidden) S.seen.enemies[e.id] = true; });
      E.poolHeroList().forEach(x => { if (S.chars[x.id]) S.seen.chars[x.id] = true; });
      S.discoveredShard = true;
    } else if (action === 'shop') {
      E.refreshShop(true);
    } else if (action === 'uninjured') {
      S.milestones.injured = false;
    } else if (action === 'closeDev') {
      setDevMode(false);
      return;
    }
    E.save(true);
    U.render();
    U.toast('开发者操作已执行：' + (DEV_ACTION_LABEL[action] || action), 'good');
  }
  function openDevPanel() {
    const S = E.S;
    if (!S || !S.dev) return;
    const btn = (act, text, cls) => `<button ${cls ? 'class="' + cls + '"' : ''} data-dev="${act}">${text}</button>`;
    U.modal(`<h3>🛠 开发者模式</h3>
      <div class="sub" style="margin-bottom:10px">后门入口：网址加 <b class="mono">?dev=1</b>，或连点左上角版本号 5 次。改动会正常写进存档。</div>
      <div class="card" style="margin-bottom:8px"><b>资源</b>
        <div class="row" style="margin-top:8px">${btn('gold', '金币 +100,000', 'gold')}${btn('research', '科研点 +100,000')}${btn('items', '每种物品 +100')}${btn('food', '粮仓每种 +500')}</div>
      </div>
      <div class="card" style="margin-bottom:8px"><b>解锁</b>
        <div class="row" style="margin-top:8px">${btn('techs', '解锁全部科技', 'primary')}${btn('unlock', '一键全解锁（科技 + 工作 + 升级项）', 'gold')}${btn('codex', '解锁全部图鉴')}${btn('husbandry', '解锁所有畜牧认知度')}</div>
      </div>
      <div class="card" style="margin-bottom:8px"><b>维护</b>
        <div class="row" style="margin-top:8px">${btn('heal', '治愈所有角色')}${btn('shop', '刷新商店')}${btn('uninjured', '清除「受伤」里程碑')}</div>
      </div>
      <div class="acts"><button data-dev="closeDev">关闭开发者模式</button><button class="primary" data-act="closeModal">收起面板</button></div>`);
    document.querySelectorAll('#modalBox [data-dev]').forEach(el => {
      el.onclick = () => devAction(el.dataset.dev);
    });
  }
  window.DEV = {
    on: () => setDevMode(true),
    off: () => setDevMode(false),
    open: openDevPanel,
    items: () => devAction('items'),
    unlock: () => devAction('unlock'),
    husbandry: () => devAction('husbandry'),
    heal: () => devAction('heal'),
    gold: () => devAction('gold'),
  };

  /* ---------------- 启动 ---------------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
