/* =========================================================================
   纪元放置 · UI 层（纯 DOM，无框架）
   ========================================================================= */
'use strict';
const E = window.Engine;

/* 工作的一句话简介（设计文档要求：工作页只显示粗略说明，不堆细节） */
const JOB_BRIEF = {
  woodcutting: '砍树，产出木材。',
  mining: '开采矿石，也可以直接采石。每种矿石单独开采，越稀有的矿越慢。',
  gathering: '灌木、石头、草地、平原、沼泽各是一个项目；资源包会随机变成其中一种物品。',
  farming: '种地，把种子变成对应作物与草料；也能晒制干草。',
  hunting: '派角色去野外打怪，掉落皮革与肉。',
  husbandry: '圈养认知度满的动物；喂养项目持续消耗草料，动物进度条满才产出肉、皮革与副产物。',
  cooking: '把生食做成更耐放、更顶饱的熟食。',
  crafting: '打造石器时代的装备；中世纪后也做长弓与弩。',
  research: '产出科研点，用来研究科技树。',
  stonecutting: '把石头切成石材。',
  pottery: '把沙烧成陶器。',
  medicine: '把药草捣成草药，也制作草药药剂 / 医药；有人入驻时全队回血更快。',
  smelting: '把矿石炼成金属锭。',
  forging: '打造中世纪金属装备与武器。',
  carpentry: '把木材加工成木板。',
  weaving: '把植物纤维与毛料纺成布料。',
  tailoring: '缝制各时代的布料衣物与轻甲。',
  carpet_weaving: '编织地毯。',
  papermaking: '把木材做成纸张。',
  power: '用燃料发电，供耗电工作与工事使用。',
  machining: '制造机械零件、建材、核燃料，以及工业 / 信息时代的武器盔甲。',
  oil_extraction: '开采石油，供给化学精炼与火药制作。',
  chemistry: '炼油，产出化学燃料与塑料。',
  glassmaking: '把沙做成玻璃。',
  gunpowder: '制造火药。',
  semiconductors: '制造芯片。',
  precision_assembly: '制造精密零件，以及太空时代的武器与盔甲。',
  alien_mining: '在太空开采外星合金。',
  particle_collider: '对撞粒子，制造反物质。',
  synthesis: '合成超织物、AI 核心与生命维持单元。',
  warp_core: '终局目标：制造曲速核心。',
  black_soul: '与黑魂怪对决，掉落灵魂与余火。',
  era_sim: '与僵尸对决，随机补给资源。',
};

/* 物品悬浮面板用到的中文名。数据源只有 items.js + enemies.js 的 WEAPON_COMBAT 两处 */
const ITEM_CAT_NAME = {
  ore: '矿石', material: '材料', animal: '动物产物', equip: '装备', weapon: '武器',
  misc: '杂项', book: '技能书', gacha: '抽卡', food: '食材', seed: '种子', cooked: '熟食',
  medicine: '医物', bundle: '资源包',
};
const ITEM_SLOT_NAME = {
  mainhand: '主手', offhand: '副手', head: '头盔', headInner: '内衬头盔', body: '胸甲',
  bodyInner: '内衬', legs: '护腿', legsInner: '内衬护腿', feet: '靴子', socks: '袜子',
  neck: '项链', belt: '腰带',
};
const ITEM_KIND_NAME = {
  shard: '招募券', gift: '好感度礼物', stardust: '升星货币', starPotion: '升星道具',
  soul: '黑魂材料', ember: '黑魂材料',
};
/* 时代徽章名：era:'cross' 是跨时代通用标记，显示为「通用」；era:'gacha' 是抽卡类内部标记，
   分类徽章已经写「抽卡」，不再把内部字段露成英文徽章（未知 / 内部 era 一律不显示） */
const ERA_TAG_NAME = Object.assign({ cross: '通用', gacha: '' }, E.ERA_NAME || {});

const UI = {
  /* ---------------- 基础 ---------------- */
  /* 统一消息框：物品产出与操作提示（入驻 / 撤下 / 购买 / 存档…）共用 #lootFeed */
  toast(msg, kind) { this.notice(msg, kind); },
  /* ---------------- 统一消息框（右下角） ----------------
     物品产出与操作提示共用 #lootFeed：物品行同种累加数量，提示行按文字去重；
     每行各自在「最后一次出现」后 4.5 秒淡出，互不影响。
     离线结算不逐条弹（走离线弹窗汇总）。 */
  LOOT_TTL: 4500,
  LOOT_FADE: 320,      // 与 .lootrow 的 opacity 过渡一致；淡出结束后再摘掉 DOM
  _lootBoxEl(feed) {
    if (!this._lootRows || !this._lootBox || !this._lootBox.isConnected) {
      feed.innerHTML = '';
      this._lootBox = document.createElement('div');
      this._lootBox.className = 'lootbox';
      feed.appendChild(this._lootBox);
      this._lootRows = new Map();
    }
    return this._lootBox;
  },
  _trimLootRows() {
    if (!this._lootRows || this._lootRows.size < 6) return;
    const oldest = this._lootRows.keys().next().value;
    const old = this._lootRows.get(oldest);
    if (old) old.el.remove();
    this._lootRows.delete(oldest);
  },
  _touchLootRow(row) {
    // 同一条消息 / 同种物品又出现：正在淡出就拉回来，重新计 4.5 秒
    if (row.fading) {
      row.fading = false; row.removeAt = 0;
      row.el.classList.remove('fade');
    }
    row.exp = Date.now() + this.LOOT_TTL;
  },
  loot(id, qty) {
    if (typeof document === 'undefined') return;   // node 无头冒烟测试
    qty = Number(qty) || 0;
    if (!id || qty <= 0) return;
    const it = E.ITEMS[id];
    const feed = document.getElementById('lootFeed');
    if (!it || !feed) return;
    const box = this._lootBoxEl(feed);
    let row = this._lootRows.get(id);
    if (!row) {
      this._trimLootRows();
      const el = document.createElement('div');
      el.className = 'lootrow';
      el.innerHTML = '<span class="ic"></span><span class="n"></span><span class="q mono"></span>';
      el.querySelector('.ic').innerHTML = this.itemIcon(it);
      el.querySelector('.n').textContent = it.name;
      box.appendChild(el);
      row = { el, n: 0, q: el.querySelector('.q'), exp: 0, fading: false, removeAt: 0 };
      this._lootRows.set(id, row);
    }
    this._touchLootRow(row);
    row.n += qty;
    row.q.textContent = '+' + E.fmt(row.n);
    row.q.classList.remove('bump');
    void row.q.offsetWidth;
    row.q.classList.add('bump');
  },
  /* 文字提示行：与物品行共用同一个框和同一套逐行 4.5 秒计时（UI.toast 走这里） */
  notice(text, kind) {
    if (typeof document === 'undefined') return;
    const msg = String(text == null ? '' : text).trim();
    if (!msg) return;
    const feed = document.getElementById('lootFeed');
    if (!feed) return;
    const box = this._lootBoxEl(feed);
    const key = 'msg:' + msg;
    let row = this._lootRows.get(key);
    if (!row) {
      this._trimLootRows();
      const el = document.createElement('div');
      el.className = 'lootrow msg' + (kind === 'good' || kind === 'bad' ? ' ' + kind : '');
      el.innerHTML = '<span class="n"></span>';
      el.querySelector('.n').textContent = msg;
      box.appendChild(el);
      row = { el, n: 0, q: null, exp: 0, fading: false, removeAt: 0 };
      this._lootRows.set(key, row);
    }
    this._touchLootRow(row);
  },
  /* 逐行到期检查（UI.tick 每 200ms 跑一次）：每行只看自己的 exp，到点单独淡出 */
  _sweepLoot() {
    const rows = this._lootRows;
    if (!rows || !rows.size) return;
    const now = Date.now();
    rows.forEach((row, id) => {
      if (row.fading) {
        if (now >= row.removeAt) { row.el.remove(); rows.delete(id); }
      } else if (now >= row.exp) {
        row.fading = true;
        row.removeAt = now + this.LOOT_FADE;
        row.el.classList.add('fade');
      }
    });
    if (!rows.size) {
      const feed = document.getElementById('lootFeed');
      if (feed) feed.innerHTML = '';
      this._lootRows = null; this._lootBox = null;
    }
  },
  modal(html) {
    document.getElementById('modalBox').innerHTML = html;
    document.getElementById('modal').classList.add('show');
  },
  closeModal() {
    document.getElementById('modal').classList.remove('show');
    document.getElementById('modalBox').innerHTML = '';
  },
  esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },

  hue(str) { let h = 0; for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) % 360; return h; },
  avatar(c, cls) {
    const name = E.charName(c);
    const hd = E.heroDef(c.cid);
    if (hd && hd.portrait) {
      const v = String(E.APP_VERSION || '').replace(/^v/, '');
      return `<div class="av art ${cls || ''}"><img src="${hd.portrait}${v ? '?v=' + v : ''}" alt="${this.esc(name)}" draggable="false"></div>`;
    }
    const hue = this.hue(c.cid);
    const bg = `linear-gradient(145deg,hsl(${hue} 42% 32%),hsl(${(hue + 40) % 360} 38% 20%))`;
    const initial = c.kind === 'player' ? '你' : name.slice(0, 1);
    return `<div class="av ${cls || ''}" style="background:${bg}">${this.esc(initial)}</div>`;
  },
  itemIcon(it) {
    if (!it) return '❔';
    if (window.ICONS) { const s = window.ICONS.item(it); if (s) return s; }
    const map = { ore: '⛏️', food: '🍎', seed: '🌱', cooked: '🍲', material: '📦', equip: '🛡️', weapon: '⚔️', book: '📖', gacha: '🎁', misc: '📦' };
    if (it.slot === 'mainhand') return '⚔️';
    if (it.slot === 'offhand') return '🛡️';
    if (it.slot === 'head' || it.slot === 'headInner') return '🪖';
    if (it.slot === 'body' || it.slot === 'bodyInner') return '🎽';
    if (it.slot === 'legs' || it.slot === 'legsInner') return '👖';
    if (it.slot === 'feet' || it.slot === 'socks') return '🥾';
    return map[it.cat] || '📦';
  },
  /* 敌人立绘（程序化 SVG）：cs.enemy 是 enemies.js 的原对象，带 id */
  enemyIcon(e, cls) {
    if (!e || !window.ICONS) return '';
    const svg = window.ICONS.enemy(e.id || e.name || e);
    return svg ? `<span class="foeArt ${cls || ''}">${svg}</span>` : '';
  },
  jobIcon(j) {
    if (!j) return '';
    if (window.ICONS) { const s = window.ICONS.job(j); if (s) return s; }
    return j.icon || '🔨';
  },
  /* 住房 / 舒适度 / 防御工事 的小图标（名字来自 passives.js） */
  passIcon(name, small) {
    if (!name) return '';
    if (window.ICONS) {
      const s = window.ICONS.passive(name);
      if (s) return `<span class="upgIc${small ? ' sm' : ''}">${s}</span>`;
    }
    return '';
  },

  /* ---------------- 物品面板（悬浮提示） ----------------
     数据来自两处：items.js 的静态字段 + enemies.js 的 WEAPON_COMBAT（按武器中文名索引）。
     武器数值一律以 WEAPON_COMBAT 为准，和 engine.charStats 的取数顺序保持一致。 */
  itemIdOf(name) {
    if (!name) return null;
    const direct = E.N2I(name);
    if (direct) return direct;
    const key = String(name).replace(/\s+/g, '');
    return Object.keys(E.ITEMS).find(x => E.ITEMS[x].name.replace(/\s+/g, '') === key) || null;
  },
  itemInfo(id) {
    const it = E.ITEMS[id];
    if (!it) return null;
    // 动态材料武器：攻速 / 命中 / 力量已经算进物品自身，别再被按模板名索引的 WEAPON_COMBAT 覆盖
    const wc = (it.cat === 'weapon' && !it.dynamicMaterial && E.WEAPON_COMBAT[it.name]) || {};
    const pick = (a, b, d) => (a !== undefined ? a : (b !== undefined ? b : d));
    const info = {
      it, wc,
      str: pick(wc.str, it.str, 0),
      atk: pick(wc.atk, it.atk, 0),
      interval: pick(wc.interval, it.interval, null),
      range: pick(wc.range, it.range, null),
      armorPen: pick(wc.armorPen, it.armorPen, 0),
      ignoreDR: wc.ignoreDR || 0,
      crit: wc.crit || 0,
    };
    info.gear = it.cat === 'equip' || it.cat === 'weapon';
    info.power = it.cat === 'weapon' ? info.str * 2 + info.atk : (it.dr || 0) * 5 + info.str * 2;   // 与 engine.gearPower 同权重
    return info;
  },
  /* 物品面板的「获取 / 用途」只写主分类，不再展开括号里的配方 / 材料细节。
     例：医药 的 src「医疗（药剂配方 + 化学燃料）」→ 显示「医疗」；
     植物纤维的 use「加工（内衬衣物）、编织（地毯）、裁缝（弓）」→「加工、编织、裁缝」。
     全角 / 半角括号里的补充说明（材料、具体动物、*缝制 等）统一去掉。 */
  srcText(src) {
    return String(src === undefined || src === null ? '' : src)
      .replace(/（[^）]*）/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },
  itemTipHtml(id) {
    const info = this.itemInfo(id);
    if (!info) return '';
    const it = info.it, S = E.S;
    const esc = s => this.esc(s);
    const q = (S.items && S.items[id]) || 0;
    const seen = !!(S.seen && S.seen.items && S.seen.items[id]);
    const row = (k, v, cls) => `<div class="ttRow"><span class="k">${k}</span><span class="v mono ${cls || ''}">${v}</span></div>`;
    const tag = (txt, cls) => `<span class="badge ${cls || ''}">${esc(txt)}</span>`;

    // 资源包只显示「产物 + 概率」：不显示包图标 / 标签 / 经济 / 获取。
    // 每个产物必须曾经从「这个包」里抽到过才显示名字，否则用 ？ 遮住。
    if (it.bundle && Array.isArray(it.pool) && it.pool.length) {
      const total = it.pool.reduce((a, p) => a + (p.weight || 0), 0) || 1;
      const drops = it.pool.map(p => {
        const drop = E.ITEMS[p.id] || E.ITEMS[E.N2I(p.id)];
        const pct = (p.weight || 0) / total * 100;
        const known = E.bundleItemSeen(it.id, p.id);
        const label = known
          ? `${drop ? this.itemIcon(drop) + ' ' : ''}${esc(drop ? drop.name : p.id)}`
          : '<span class="qmark">？</span>';
        return row(label, pct.toFixed(pct < 1 ? 1 : 0) + '%');
      }).join('');
      return `<div class="ttRows ttBundleRows">${drops}</div>`;
    }

    const leatherMat = it.cat === 'animal' && (it.tags || []).indexOf('皮革') >= 0;
    let h = `<div class="ttHead"><span class="ttIcon">${this.itemIcon(it)}</span><div class="ttTitle">
      <b>${esc(it.name)}</b>
      <div class="ttTags">${it.era && ERA_TAG_NAME[it.era] ? tag(ERA_TAG_NAME[it.era]) : ''}${leatherMat ? '' : tag(ITEM_CAT_NAME[it.cat] || it.cat)}
      ${it.slot ? tag(ITEM_SLOT_NAME[it.slot] || it.slot) : ''}${it.twoHanded ? tag('双手', 'warn') : ''}${(it.tags || []).map(t => tag(t)).join('')}</div></div></div>`;

    if (info.gear) {
      const rows = [];
      if (it.dr) rows.push(row('伤害减免', '+' + it.dr + '%', 'green'));
      if (info.str) rows.push(row('力量', '+' + info.str));
      if (info.atk) rows.push(row('命中', '+' + info.atk));
      if (info.interval !== null) rows.push(row('攻击间隔', (+info.interval).toFixed(1) + ' 秒'));
      if (info.range) rows.push(row('射程', info.range));
      if (it.temp) rows.push(row('保暖', '+' + it.temp));
      if (it.shield) rows.push(row('护盾', it.shield));
      if (info.armorPen) rows.push(row('破甲', info.armorPen + '%', 'gold'));
      if (info.ignoreDR) rows.push(row('无视减免', info.ignoreDR + '%', 'gold'));
      if (info.crit) rows.push(row('暴击', info.crit + '%', 'gold'));
      rows.push(row('战力贡献', '+' + E.fmt(info.power), 'gold'));
      h += `<div class="ttSec">战斗数值</div><div class="ttRows">${rows.join('')}</div>`;
    }

    const matMods = it.metalMods || it.leatherMods;
    if (matMods) {
      const labels = { dr: '伤害减免', str: '力量', atk: '命中' };
      // v0.0.39：和经济一样用两列网格逐行排，不再挤在「金属加成」一行里竖向折行
      // v0.0.40：皮革也走同一套「战斗数值修正」
      const rows = ['dr', 'str', 'atk'].filter(k => matMods[k] != null)
        .map(k => row(labels[k], '×' + Number(matMods[k]).toFixed(2), 'gold'));
      h += `<div class="ttSec">战斗数值修正</div><div class="ttRows">${rows.join('')}</div>`;
    }

    const buyRow = it.kind === 'starPotion'
      ? row('兑换价', E.POTION_STARDUST_COST + ' 星尘', 'violet')
      : (it.kind === 'stardust' ? '' : row('买入价', E.fmt(E.buyPrice(id)) + ' 金'));
    h += `<div class="ttSec">经济</div><div class="ttRows">`
      + row('卖出价', E.fmt(E.sellPrice(id)) + ' 金', 'gold')
      + buyRow
      + row('持有', q ? E.fmt(q) + ' 件' : '<span class="dim">没有</span>')
      + row('总价值', E.fmt(q * (it.price || 0)) + ' 金') + '</div>';

    if (it.med) {
      // v0.0.31：不再显示「适用时代」（医物本身是跨时代物品），也不再写「只有受伤时才会消耗」这句说明
      h += `<div class="ttSec">医物效果</div><div class="ttRows">`
        + row('回血速度', '×' + (it.med.healMul || 1), 'green')
        + row('消耗间隔', (it.med.consumeSec || 30) + ' 秒')
        + `</div>`;
    }
    if (E.isFoodItem(id)) {
      const fx = E.foodEffectText(id);
      if (fx) h += `<div class="ttSec">食物效果</div><div class="ttDesc">${esc(fx)}</div>`;
    }
    if (it.cat === 'book' && it.book) h += row('用途', '《' + esc(it.book) + '》精通 +10 级');
    if (it.kind) h += row('类别', esc(ITEM_KIND_NAME[it.kind] || it.kind));
    if (it.gift) h += row('送礼好感', '+' + it.gift, 'gold');
    if (it.storage === 'granary') {
      const rate = E.granaryDecayRate(id);
      h += row('腐坏', rate <= 0
        ? '不腐坏'
        : '每 ' + Math.round(E.granaryHalfLife(id)) + ' 秒减半（−' + (rate * 100).toFixed(3) + '%/秒）', 'red');
    }

    const srcText = it.src ? this.srcText(it.src) : '';
    if (srcText) h += `<div class="ttSec">获取</div><div class="ttDesc">${esc(srcText)}</div>`;
    const useText = it.use ? this.srcText(it.use) : '';
    if (useText) h += `<div class="ttDesc">用途：${esc(useText)}</div>`;
    if (it.note) h += `<div class="ttDesc">备注：${esc(it.note)}</div>`;

    if (it.cost) {
      const parts = Object.keys(it.cost).map(cid => {
        const m = E.ITEMS[cid];
        if (!m) return '';
        const ok = ((S.items && S.items[cid]) || 0) >= it.cost[cid];
        return `<span class="ttCost ${ok ? '' : 'lack'}">${this.itemIcon(m)} ${esc(m.name)} ×${E.fmt(it.cost[cid])}</span>`;
      }).filter(Boolean);
      if (parts.length) h += `<div class="ttSec">造价</div><div class="ttCosts">${parts.join('')}</div>`;
    }

    h += `<div class="ttFoot">${seen ? '已收录图鉴' : '尚未收录图鉴'}</div>`;
    return h;
  },
  /* 「畜牧产物」汇总面板：鼠标悬停在喂养项目的产物徽章上，列出每只动物的产物 */
  husbandryTipHtml() {
    const esc = s => this.esc(s);
    const list = E.husbandryAnimals();
    let h = `<div class="ttHead"><span class="ttIcon">🐾</span><div class="ttTitle">
      <b>畜牧产物</b>
      <div class="ttTags"><span class="badge">畜牧</span><span class="badge">动物进度</span></div></div></div>`;
    if (!list.length) return h + '<div class="ttDesc">还没有圈养动物。到下方「畜牧」区点「＋」添加。</div>';
    const rows = list.map(a => {
      const def = E.HUSBANDRY_ANIMALS[a.name] || {};
      const outs = Object.keys(def.outputs || {}).length ? this.ioList(def.outputs) : '<span class="dim">无</span>';
      return `<div class="ttHubRow"><div class="nm"><b>${esc(a.name)}</b> <span class="dim">已产 ${a.done || 0} 次</span></div><div class="outs">${outs}</div></div>`;
    }).join('');
    h += `<div class="ttSec">每只动物的产物</div><div class="ttHubList">${rows}</div>`;
    h += '<div class="ttDesc">动物自己的进度条满时才产出；「喂养畜群」进度条满只扣草料，不直接给物品。</div>';
    return h;
  },
  showTip(id, el) {
    const tip = document.getElementById('itemTip');
    if (!tip) return;
    const html = this.itemTipHtml(id);
    if (!html) return this.hideTip();
    if (this._tipHtml !== html) { tip.innerHTML = html; this._tipHtml = html; }
    this._tipId = id;
    tip.classList.add('show');
    this._placeTip(el);
  },
  showHubTip(el) {
    const tip = document.getElementById('itemTip');
    if (!tip) return;
    const html = this.husbandryTipHtml();
    if (this._tipHtml !== html) { tip.innerHTML = html; this._tipHtml = html; }
    this._tipId = '#hub';
    tip.classList.add('show');
    this._placeTip(el);
  },
  /* 好感度节点：复用同一个悬浮面板容器 */
  showFavorTip(el) {
    const tip = document.getElementById('itemTip');
    if (!tip) return;
    const [cid, tier] = String(el.dataset.tipFavor || '').split(':');
    const html = this.favorTipHtml(cid, +tier);
    if (!html) return this.hideTip();
    if (this._tipHtml !== html) { tip.innerHTML = html; this._tipHtml = html; }
    this._tipId = '#fav:' + el.dataset.tipFavor;
    tip.classList.add('show');
    this._placeTip(el);
  },
  /* 固定方向：默认贴在元素正下方居中；下方放不下就翻到正上方；横向越界夹进视口 */
  _placeTip(el) {
    const tip = document.getElementById('itemTip');
    if (!tip) return;
    const r = tip.getBoundingClientRect();
    const a = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    const pad = 8, gap = 8, vw = window.innerWidth, vh = window.innerHeight;
    let left, top;
    // v0.0.39：筛选下拉里的物品面板贴在下拉旁边，避免盖住列表导致悬停项来回跳
    const menu = el && el.closest ? el.closest('#inputMenu') : null;
    if (a && menu) {
      const m = menu.getBoundingClientRect();
      const right = m.right + gap, leftSide = m.left - r.width - gap;
      if (right + r.width <= vw - pad) { left = right; top = a.top; }
      else if (leftSide >= pad) { left = leftSide; top = a.top; }
      else {
        left = a.left + a.width / 2 - r.width / 2;
        top = a.bottom + gap;
      }
      top = Math.min(Math.max(pad, top), Math.max(pad, vh - r.height - pad));
    } else if (a) {
      left = a.left + a.width / 2 - r.width / 2;
      top = a.bottom + gap;                                    // 优先下方
      if (top + r.height > vh - pad) {
        const above = a.top - r.height - gap;                  // 下方不够 → 上方
        top = above >= pad ? above : Math.max(pad, vh - r.height - pad);
      }
    } else {
      left = (vw - r.width) / 2;
      top = vh - r.height - pad;
    }
    left = Math.min(Math.max(pad, left), Math.max(pad, vw - r.width - pad));
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  },
  hideTip() {
    const tip = document.getElementById('itemTip');
    if (tip) tip.classList.remove('show');
    this._tipId = null; this._tipEl = null; this._tipHtml = '';
  },
  onHoverMove(e) { this._tipX = e.clientX; this._tipY = e.clientY; },
  onHover(e) {
    this._tipX = e.clientX; this._tipY = e.clientY;
    if (!e.target || !e.target.closest) return;
    if (e.target.closest('[data-act="recslot"]')) return this.hideTip();   // 入驻槽不抢物品面板
    const fav = e.target.closest('[data-tip-favor]');
    if (fav) {
      const key = fav.dataset.tipFavor;
      if (this._tipEl === fav && this._tipId === '#fav:' + key) return;
      this._tipEl = fav;
      return this.showFavorTip(fav);
    }
    const hub = e.target.closest('[data-tip-hub]');
    if (hub) {
      if (this._tipEl === hub && this._tipId === '#hub') return;
      this._tipEl = hub;
      return this.showHubTip(hub);
    }
    const el = e.target.closest('[data-tip-item]');
    if (!el) return this.hideTip();
    const id = el.dataset.tipItem;
    if (this._tipEl === el && this._tipId === id) return;
    this._tipEl = el;
    this.showTip(id, el);
  },
  /* 页面每 1.5 秒整页重绘一次，锚点元素会被换掉：用指针坐标重新找回锚点 */
  syncTip() {
    if (!this._tipId) return;
    if (typeof this._tipX !== 'number') return this.hideTip();
    const under = document.elementFromPoint(this._tipX, this._tipY);
    if (this._tipId === '#hub') {
      const hub = under && under.closest ? under.closest('[data-tip-hub]') : null;
      if (!hub) return this.hideTip();
      this._tipEl = hub;
      return this.showHubTip(hub);
    }
    if (String(this._tipId).indexOf('#fav:') === 0) {
      const fav = under && under.closest ? under.closest('[data-tip-favor]') : null;
      if (!fav || '#fav:' + fav.dataset.tipFavor !== this._tipId) return this.hideTip();
      this._tipEl = fav;
      return this.showFavorTip(fav);
    }
    const el = under && under.closest ? under.closest('[data-tip-item]') : null;
    if (!el || el.dataset.tipItem !== this._tipId) return this.hideTip();
    this._tipEl = el;
    this.showTip(this._tipId, el);
  },

  /* ---------------- 顶栏 ---------------- */
  renderHud() {
    const S = E.S;
    document.getElementById('hudEra').textContent = E.eraName();
    const showRes = S.ui.showResearch !== false && (S.research >= 1 || S.ui.showResearch);
    if (S.research >= 1) S.ui.showResearch = true;
    if (E.powerProduced() >= 1) S.ui.showPower = true;
    const food = E.granaryTotal();
    const chars = E.onFieldChars().length;
    const foodRate = chars * E.GAME.foodPerCharSec;
    const foodLeft = chars > 0 ? food / foodRate : Infinity;
    const low = food <= 0 || foodLeft < 60;
    let html = '';
    html += `<div class="res gold"><span class="k">金币</span><span class="v mono" id="resGold">${E.fmt(S.gold)}</span></div>`;
    if (S.ui.showResearch) html += `<div class="res research"><span class="k">科研</span><span class="v mono" id="resResearch">${E.fmt(S.research)}</span></div>`;
    if (S.ui.showPower) html += `<div class="res power"><span class="k">电力</span><span class="v mono" id="resPower">${E.fmt(E.powerProduced(), 0)}/${E.fmt(E.powerDemand(), 0)}</span></div>`;
    html += `<div class="res food ${low ? 'low' : ''}" title="粮仓份数（容量无限）；${chars ? '约可支撑 ' + E.fmtTime(foodLeft) : '无人在场'}"><span class="k">食物</span><span class="v mono" id="resFood">${E.fmt(food, 0)}</span><span class="rate">${chars ? '-' + foodRate.toFixed(2) + '/秒' : '0/秒'}</span></div>`;
    document.getElementById('resbar').innerHTML = html;
  },

  /* ---------------- 左侧导航 ---------------- */
  renderNav() {
    const S = E.S;
    const cur = S.ui.page;
    const nav = (key, icon, name, sub, extra) =>
      `<div class="nav ${cur === key ? 'active' : ''} ${extra || ''}" data-act="nav" data-page="${key}">
         <span class="ic">${icon}</span><span class="nm">${name}</span>${sub ? `<span class="sub ${String(sub).indexOf('人在工作') >= 0 ? 'green' : ''}">${sub}</span>` : ''}
       </div>`;
    let h = '';
    // 被动
    const nv = k => (window.ICONS ? window.ICONS.nav(k) : '•');
    h += `<div class="grp">被动</div>`;
    h += nav('housing', nv('housing'), '住所与娱乐', E.onFieldChars().length + '/' + E.onFieldCap());
    h += nav('defense', nv('defense'), '防御', E.fmt(E.basePower()));
    h += nav('shop', nv('shop'), '商店', E.fmt(S.gold) + ' 金');
    h += nav('characters', nv('characters'), '角色', Object.keys(S.chars).length + ' 人');
    h += nav('codex', nv('codex'), '图鉴', this.codexPct() + '%');
    if (S.discoveredShard || E.shardCount() > 0) h += nav('recruit', nv('recruit'), '招募', E.fmt(E.shardCount()) + ' 招募券');
    h += nav('warehouse', nv('warehouse'), '仓库', E.warehouseUsed() + '/' + E.warehouseCap() + ' 格');
    // 工作
    h += `<div class="grp">工作</div>`;
    E.JOBS.filter(j => (j.special !== 'blackSoul' && j.special !== 'eraSim') && E.jobVisible(j)).forEach(j => {
      h += nav('job:' + j.id, this.jobIcon(j), j.name, this.jobSub(j), this.jobSub(j) && j.id !== 'hunting' ? '' : '');
    });
    // 角色特技（v0.0.33：挪到工作列表最下面；狩猎归入「工作」，不再单列「战斗」分组）
    const gifts = E.JOBS.filter(j => (j.special === 'blackSoul' || j.special === 'eraSim') && E.jobVisible(j));
    if (gifts.length) {
      h += `<div class="grp">角色特技</div>`;
      gifts.forEach(j => h += nav('job:' + j.id, this.jobIcon(j), j.name + '（' + (j.staffOnly || (j.special === 'blackSoul' ? '星见由岐' : '大少')) + '）', ''));
    }
    document.getElementById('side').innerHTML = h;
  },
  jobSub(job) {
    const n = E.assignedCount(job);
    return n > 0 ? `<span class="green">${n}人在工作</span>` : '未入驻';
  },
  codexPct() {
    const S = E.S;
    const ic = Object.keys(E.ITEMS).filter(id => !E.ITEMS[id].hidden && S.seen.items[id]).length;
    const ec = E.ENEMIES.filter(e => !e.hidden && S.seen.enemies[e.id]).length;
    const heroes = E.poolHeroList();
    const cc = heroes.filter(x => S.chars[x.id]).length;
    const total = Object.keys(E.ITEMS).filter(id => !E.ITEMS[id].hidden).length + E.ENEMIES.filter(e => !e.hidden).length + heroes.length;
    return Math.round((ic + ec + cc) / total * 100);
  },

  /* ---------------- 路由 ---------------- */
  render() {
    const S = E.S;
    this.renderHud(); this.renderNav();
    const page = S.ui.page || 'warehouse';
    const wrap = document.getElementById('mainWrap');
    const pageEl = document.getElementById('page');
    let html = '';
    if (page === 'tech') html = this.pageTech();
    else if (page === 'warehouse') html = this.pageWarehouse();
    else if (page === 'shop') html = this.pageShop();
    else if (page === 'characters') html = this.pageCharacters();
    else if (page === 'codex') html = this.pageCodex();
    else if (page === 'recruit') html = this.pageRecruit();
    else if (page === 'housing') html = this.pageHousing();
    else if (page === 'defense') html = this.pageDefense();
    else if (page.startsWith('job:')) html = this.pageJob(page.slice(4));
    else html = this.pageWarehouse();
    const prevPage = wrap.dataset.page;
    const samePage = prevPage === page;
    const pageScroll = pageEl ? pageEl.scrollTop : 0;
    const scrolls = this._saveScroll();
    const selection = samePage ? this._saveSelection(wrap) : null;
    this._scrollLock = Date.now() + 260;   // 还原滚动位置时触发 scroll 事件，别把物品悬浮面板误关
    wrap.innerHTML = html;
    wrap.dataset.page = page;
    // 整页重绘（工作页 0.2s / 其它页 1.5s）不能把用户正在看的位置或选中文本冲掉
    if (samePage) {
      if (pageEl) pageEl.scrollTop = pageScroll;
      this._restoreScroll(scrolls);
      this._restoreSelection(selection, wrap);
    } else if (pageEl) {
      pageEl.scrollTop = S.ui.scroll || 0;
    }
    this.syncTip();
  },

  /* 把选区锚点记成「相对 mainWrap 的节点路径」，重绘后按同一路径还原 */
  _nodePath(node, root) {
    const path = [];
    let n = node;
    while (n && n !== root) {
      const parent = n.parentNode;
      if (!parent) return null;
      path.unshift(Array.prototype.indexOf.call(parent.childNodes, n));
      n = parent;
    }
    return n === root ? path : null;
  },
  _nodeAt(root, path) {
    let n = root;
    for (const i of path || []) {
      if (!n || !n.childNodes || !n.childNodes[i]) return null;
      n = n.childNodes[i];
    }
    return n;
  },
  _saveSelection(wrap) {
    const sel = window.getSelection ? window.getSelection() : null;
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!wrap.contains(range.startContainer) || !wrap.contains(range.endContainer)) return null;
    const a = this._nodePath(range.startContainer, wrap);
    const b = this._nodePath(range.endContainer, wrap);
    if (!a || !b) return null;
    return { a, ao: range.startOffset, b, bo: range.endOffset };
  },
  _restoreSelection(saved, wrap) {
    if (!saved) return;
    const a = this._nodeAt(wrap, saved.a), b = this._nodeAt(wrap, saved.b);
    if (!a || !b) return;
    const maxA = a.nodeType === 3 ? a.nodeValue.length : (a.childNodes ? a.childNodes.length : 0);
    const maxB = b.nodeType === 3 ? b.nodeValue.length : (b.childNodes ? b.childNodes.length : 0);
    const range = document.createRange();
    try {
      range.setStart(a, Math.min(saved.ao, maxA));
      range.setEnd(b, Math.min(saved.bo, maxB));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) { /* 结构变化时放弃还原，不影响页面 */ }
  },

  /* 记住页面里所有滚动容器的位置：整页重绘（每 1.5 秒一次）时不跳回顶部 */
  _saveScroll() {
    const wrap = document.getElementById('mainWrap');
    if (!wrap) return [];
    const out = [];
    wrap.querySelectorAll('*').forEach(el => {
      if (el.scrollTop > 0 || el.scrollLeft > 0) out.push({ path: this._domPath(el, wrap), top: el.scrollTop, left: el.scrollLeft });
    });
    return out;
  },
  _domPath(el, root) {
    const parts = [];
    while (el && el !== root) {
      let i = 0, s = el;
      while ((s = s.previousElementSibling)) i++;
      parts.unshift(i);
      el = el.parentElement;
    }
    return parts;
  },
  _restoreScroll(list) {
    if (!list || !list.length) return;
    const wrap = document.getElementById('mainWrap');
    if (!wrap) return;
    list.forEach(item => {
      let el = wrap;
      for (const i of item.path) { el = el && el.children[i]; if (!el) return; }
      el.scrollTop = item.top;
      el.scrollLeft = item.left;
    });
  },

  /* ---------------- 通用组件 ---------------- */
  chips() {
    const S = E.S;
    const cap = E.onFieldCap();
    return `<div class="chips">` + S.order.map((cid, i) => {
      const c = S.chars[cid]; if (!c) return '';
      const jobId = Object.keys(S.jobs).find(j => S.jobs[j].slots && S.jobs[j].slots.includes(cid));
      const job = jobId ? E.JOB_BY_ID[jobId] : null;
      const dim = i >= cap ? 'dim' : '';
      return `<div class="chip ${dim}" draggable="true" data-drag="char" data-id="${cid}" title="拖到工作页的项目卡上可派驻">
        <div class="avwrap">${this.avatar(c)}${job ? `<span class="corner" title="当前工作：${this.esc(job.name)}">${this.jobIcon(job)}</span>` : ''}</div>
        <div class="cn">${this.esc(E.charName(c))}</div>
        ${c.stars > 1 ? `<span class="star">${'★'.repeat(c.stars)}</span>` : ''}
      </div>`;
    }).join('') + `</div>`;
  },
  priceLine(cost) {
    return Object.entries(cost || {}).map(([n, q]) => {
      const id = E.iid(n), have = id ? E.count(id) : 0;
      const it = id ? E.ITEMS[id] : null;
      // v0.0.39：材料前面带物品图标，悬停图标看物品面板
      return `<span class="pice ${have >= q ? 'ok' : 'no'}">`
        + (it ? `<span class="pico" data-tip-item="${id}">${this.itemIcon(it)}</span>` : '')
        + `<span>${this.esc(n)} ${E.fmt(have)}/${E.fmt(q)}</span></span>`;
    }).join('');
  },
  /* ---------------- 工作页 ---------------- */
  pageJob(jobId) {
    const S = E.S, job = E.JOB_BY_ID[jobId];
    if (!job) return `<div class="empty">未知工作</div>`;
    if (!E.jobVisible(job)) return `<div class="empty">该工作尚未解锁</div>`;
    const js = S.jobs[jobId];
    if (job.special === 'hunting') return this.pageHunt(job);
    if (job.special === 'blackSoul' || job.special === 'eraSim') return this.pageGiftJob(job);
    if (job.special === 'power') return this.pagePower(job);
    const rs = E.jobRecipes(job);
    E.ensureSlots(js, rs.length);
    const badges = [];
    const badgeWatt = job.powerUse || job.watt;
    if (badgeWatt) badges.push(`<span class="badge warn">⚡ ${badgeWatt} 瓦</span>`);
    if (job.era) badges.push(`<span class="badge">${E.ERA_NAME[job.era] || ''}</span>`);
    const staffed = E.assignedCount(job);
    const rows = rs.map((r, i) => ({ r, i })).filter(x => E.recipeVisible(x.r, job));

    let h = `<div class="wrap">
      <div class="jobhead">
        <div class="icon lg">${this.jobIcon(job)}</div>
        <div class="info">
          <div class="title">${this.esc(job.name)} ${badges.join(' ')} ${staffed ? `<span class="badge on">${staffed} 人在工作</span>` : '<span class="badge off">无人入驻</span>'}</div>
          <div class="sub">${this.esc(this.brief(job))}</div>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="small muted">可用角色</div>
        <div style="margin-top:8px">${this.chips()}</div>
      </div>

      <h3 style="font-size:15px;margin-top:16px">项目</h3>
      <div class="grid recgrid" style="margin-top:8px">
        ${rows.map(({ r, i }) => this.recipeCard(job, js, r, i)).join('')}
      </div>

      ${job.id === 'husbandry' ? this.husbandrySection(job, js) : ''}

      <div style="margin-top:16px">
        <h3 style="font-size:15px">升级项${S.dev ? ' <span class="tiny gold" style="font-weight:400">🛠 开发者：无视材料 · 已购项可摧毁</span>' : ''}</h3>
        <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-top:8px">
          ${(job.upgrades || []).map((u, i) => {
            const bought = js.up && js.up[i];
            const locked = (u.req != null && !(js.up && js.up[u.req])) || !!(u.tech && !E.researched(u.tech));
            const ever = E.everOwnedAll(u.cost);
            if (!bought && (locked || !ever)) return '';
            const desc = E.upgradeDesc(job, i);
            return `<div class="card upg ${bought ? 'done' : ''}">
              <div class="row" style="justify-content:space-between;gap:6px"><b class="small">${this.esc(u.name || ('升级 ' + (i + 1)))}</b><span class="row" style="gap:5px;flex-wrap:nowrap">${bought ? '<span class="badge on">已购</span>' : u.watt ? `<span class="badge warn">⚡${u.watt}瓦</span>` : ''}</span></div>
              ${desc ? `<div class="tiny muted" style="margin-top:4px">${this.esc(desc)}</div>` : ''}
              ${bought ? '' : `<div class="price" style="margin-top:6px">${this.priceLine(u.cost)}</div>`}
              ${bought
                ? (S.dev ? `<button class="danger" style="margin-top:8px;width:100%" data-act="devDestroyUpg" data-id="${job.id}" data-i="${i}" title="开发者：摧毁该升级项（连带后续档位，不返还材料）">摧毁</button>` : '')
                : `<button class="primary" style="margin-top:8px;width:100%" data-act="upg" data-id="${job.id}" data-i="${i}" ${E.affordCost(u.cost) ? '' : 'disabled'}>建造</button>`}
            </div>`;
          }).join('') || '<div class="empty">暂无可用升级项</div>'}
        </div>
      </div>

      ${job.special === 'research' ? this.techTreeHtml() : ''}
    </div>`;
    return h;
  },
  brief(job) {
    return JOB_BRIEF[job.id] || (job.note ? String(job.note).split(/[；。]/)[0] : '');
  },
  recipeIcon(job, r) {
    if (r && r.icon && window.ICONS && window.ICONS.recipe) {
      const s = window.ICONS.recipe(r.icon);
      if (s) return s;
    }
    if (r && (r.metalBase || r.leatherBase)) {
      const mid = E.materialPreviewId(job.id, r);
      if (mid) return this.itemIcon(E.ITEMS[mid]);
    }
    const outs = Object.keys((r && r.outputs) || {});
    for (const n of outs) {
      const id = this.itemIdOf(n);
      if (id) return this.itemIcon(E.ITEMS[id]);
    }
    return this.jobIcon(job);
  },
  /* 金属 / 皮革成品的图标随筛选材料变化；其余项目直接用数据里的 outputs。 */
  recipeOutputsFor(job, r) {
    if (r && (r.metalBase || r.leatherBase)) {
      const id = E.materialPreviewId(job.id, r);
      if (id) return { [E.ITEMS[id].name]: 1 };
      return { [(r.metalBase ? '金属' : '皮革') + (r.name || '装备')]: 1 };
    }
    return (r && r.outputs) || {};
  },
  recipePreviewId(job, r) {
    if (r && (r.metalBase || r.leatherBase)) return E.materialPreviewId(job.id, r);
    return null;
  },
  /* 畜牧区（v0.0.31）：像「项目 / 升级项」一样独立成栏，不再塞进项目网格。
     入驻槽已经分到「喂养畜群」项目：消耗草料归入驻角色，产出归每只动物自己的进度条。 */
  husbandrySection(job, js) {
    const S = E.S;
    const feed = E.jobRecipes(job).filter(r => r && r.feed)[0];
    if (!feed || !E.recipeVisible(feed, job)) return '';
    const used = E.husbandryUsed(), cap = E.husbandryCapacity();
    const animals = E.husbandryAnimals();
    const blocked = (js.blocked && js.blocked[1]) || '';
    const free = cap - used > 1e-9;
    const cells = animals.map((a, idx) => {
      const def = E.HUSBANDRY_ANIMALS[a.name] || {};
      const size = E.husbandrySizeCost(a.name);
      const enemy = E.ENEMY_BY_NAME[a.name];
      const p = Math.max(0, Math.min(1, a.prog || 0));
      return `<div class="pen ${blocked === 'input' ? 'stall' : ''}">
        <div class="row" style="justify-content:space-between;align-items:center">
          <span class="row" style="gap:4px;min-width:0"><span class="penic">${enemy ? this.enemyIcon(enemy, 'xs') : ''}</span><b class="tiny">${this.esc(a.name)}</b></span>
          <button class="penx" data-act="hubRemove" data-i="${idx}" title="移除这只动物">×</button>
        </div>
        <div class="tiny muted">占用 ${size} · ${def.duration || '?'} 秒 / 次</div>
        <div class="tiny penout">产出：${this.ioList(def.outputs)}</div>
        <div class="bar sm" data-live="hprog" data-i="${idx}"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
        <div class="tiny dim" style="margin-top:3px">已产出 ${a.done || 0} 次</div>
      </div>`;
    }).join('');
    return `<div style="margin-top:16px">
      <h3 style="font-size:15px">畜牧</h3>
      <div class="card" style="margin-top:8px">
        <div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px">
          <div class="row" style="gap:6px;flex-wrap:wrap;min-width:0">
            <span class="badge">🐾 ${animals.length} 只动物</span>
            <span class="badge" data-live="hubused">畜牧容量 ${E.fmt(used)} / ${E.fmt(cap)}</span>
          </div>
        </div>
        ${blocked === 'input' ? '<div class="tiny red" style="margin-top:5px">草料不足，全部动物停产</div>' : ''}
        ${blocked === 'worker' ? '<div class="tiny dim" style="margin-top:5px">「喂养畜群」派驻角色后，动物进度条才会推进</div>' : ''}
        ${blocked === 'injury' ? '<div class="tiny red" style="margin-top:5px">角色重伤，喂养与动物进度暂停</div>' : ''}
        <div class="penGrid" style="margin-top:9px">
          ${cells}
          ${free
            ? `<button class="pen penAdd" data-act="hubPanel" data-job="${job.id}"><span class="bigplus">＋</span><span class="tiny muted">添加动物</span></button>`
            : `<div class="pen penAdd full"><span class="bigplus">＋</span><span class="tiny dim">畜牧容量已满</span></div>`}
        </div>
      </div>
    </div>`;
  },
  /* 「喂养畜群」项目卡：产出徽章是汇总的「畜牧产物」，消耗是动物草料之和；
     进度条填满只扣草料，不直接产物品。 */
  husbandryFeedCard(job, js, r, i) {
    const S = E.S;
    const cid = js.slots ? js.slots[i] : null;
    const c = cid ? S.chars[cid] : null;
    const prog = (js.prog && js.prog[i]) || 0;
    const speed = E.jobSpeed(job.id, i);
    const dur = speed > 0 ? Math.max(0.4, E.recipeDuration(job, r)) / speed : Infinity;
    const cost = E.husbandryFeedCost();
    const hay = E.count('草料');
    const lack = cost > 0 && hay < cost;
    const blocked = (js.blocked && js.blocked[i]) || '';
    const mastery = c ? E.masteryLvl(c, job.id) : 0;
    const mnext = c ? E.masteryNext(c, job.id) : 0;
    const bonus = c ? Math.round(E.charBonusFor(c, job) * 100) : 0;
    const fodderId = E.N2I('草料');
    const fodderIt = fodderId ? E.ITEMS[fodderId] : null;
    const costHtml = `<span class="badge io ${lack ? 'bad' : ''}" data-live="hubcost">${fodderIt ? this.itemIcon(fodderIt) : '🌾'} ×${E.fmt(cost)}</span>`;
    return `<div class="card recipe ${c ? 'run' : ''}" data-act="cardrec" data-job="${job.id}" data-i="${i}" data-drop-job="${job.id}" data-drop-i="${i}">
      <div class="row" style="justify-content:space-between">
        <div class="row" style="gap:8px;min-width:0"><span class="icon sm">${this.jobIcon(job)}</span><b class="small">${this.esc(r.name || '喂养畜群')}</b></div>
        <div class="slot mini ${c ? 'filled' : ''}" data-act="recslot" data-job="${job.id}" data-i="${i}" title="${c ? this.esc(E.charName(c)) : '点击选择入驻角色'}">
          ${c ? this.avatar(c, 'sm') : '<span class="plus">＋</span>'}
        </div>
      </div>
      <div class="io">产出：<span class="badge io" data-tip-hub="1">🐾 畜牧产物</span>
        <br>消耗：${costHtml}</div>
      <div class="row tiny" style="justify-content:space-between;margin-top:6px">
        <span>${c ? `<span class="green">${this.esc(E.charName(c))}</span> · 精通 <b class="mono" data-live="masterylvl" data-i="${i}">${mastery}</b>${bonus ? ' · +' + bonus + '%' : ''}` : '<span class="dim">空置 · 拖入角色</span>'}</span>
        <span class="mono">${isFinite(dur) ? dur.toFixed(1) + 's' : '停滞'}</span>
      </div>
      <div class="bar sm" style="margin-top:6px" data-live="rec" data-job="${job.id}" data-i="${i}"><i style="width:${(prog * 100).toFixed(1)}%"></i></div>
      ${c ? `<div class="row" style="margin-top:5px;gap:6px"><span class="tiny muted" style="width:52px">精通经验</span><div class="bar xp" style="flex:1" data-live="mastery" data-job="${job.id}" data-i="${i}"><i style="width:${(mnext * 100).toFixed(1)}%"></i></div></div>` : ''}
      ${blocked === 'input' ? `<div class="tiny red" style="margin-top:4px">草料不足（每次需要 ${E.fmt(cost)}）</div>` : ''}
      ${blocked === 'injury' ? '<div class="tiny red" style="margin-top:4px">角色重伤，喂养暂停</div>' : ''}
    </div>`;
  },
  recipeCard(job, js, r, i) {
    if (r && r.feed) return this.husbandryFeedCard(job, js, r, i);
    const S = E.S;
    const cid = js.slots ? js.slots[i] : null;
    const c = cid ? S.chars[cid] : null;
    const prog = (js.prog && js.prog[i]) || 0;
    const speed = E.jobSpeed(job.id, i);
    const dur = speed > 0 ? Math.max(0.4, E.recipeDuration(job, r)) / speed : Infinity;
    const blocked = js.blocked && js.blocked[i] === 'input';
    const mastery = c ? E.masteryLvl(c, job.id) : 0;
    const mnext = c ? E.masteryNext(c, job.id) : 0;
    const bonus = c ? Math.round(E.charBonusFor(c, job) * 100) : 0;
    const outObj = this.recipeOutputsFor(job, r);
    const previewId = this.recipePreviewId(job, r);
    const outItem = previewId || Object.keys(outObj).map(n => this.itemIdOf(n)).filter(Boolean)[0] || null;
    // 动态材料成品：直接按预览物品 id 渲染，避免同名多材料时 itemIdOf 取错图标
    const outHtml = previewId
      ? `<span class="badge io" data-tip-item="${previewId}">${this.itemIcon(E.ITEMS[previewId])} ${this.esc(E.ITEMS[previewId].name)} ×1</span>`
      : this.ioList(outObj);
    return `<div class="card recipe ${c ? 'run' : ''}" data-act="cardrec" data-job="${job.id}" data-i="${i}" data-drop-job="${job.id}" data-drop-i="${i}"${outItem ? ` data-tip-item="${outItem}"` : ''}>
      <div class="row" style="justify-content:space-between">
        <div class="row" style="gap:8px;min-width:0"><span class="icon sm">${this.recipeIcon(job, r)}</span><b class="small">${this.esc(r.name || job.name)}</b></div>
        <div class="slot mini ${c ? 'filled' : ''}" data-act="recslot" data-job="${job.id}" data-i="${i}" title="${c ? this.esc(E.charName(c)) : '点击选择入驻角色'}">
          ${c ? this.avatar(c, 'sm') : '<span class="plus">＋</span>'}
        </div>
      </div>
      <div class="io">产出：${outHtml}${Object.keys(r.inputs || {}).length ? '<br>消耗：' + this.recipeInputList(job, r, i) : ''}</div>
      <div class="row tiny" style="justify-content:space-between;margin-top:6px">
        <span>${c ? `<span class="green">${this.esc(E.charName(c))}</span> · 精通 <b class="mono" data-live="masterylvl" data-i="${i}">${mastery}</b>${bonus ? ' · +' + bonus + '%' : ''}` : '<span class="dim">空置 · 拖入角色</span>'}</span>
        <span class="mono">${isFinite(dur) ? dur.toFixed(1) + 's' : '停滞'}</span>
      </div>
      <div class="bar sm" style="margin-top:6px" data-live="rec" data-job="${job.id}" data-i="${i}"><i style="width:${(prog * 100).toFixed(1)}%"></i></div>
      ${c ? `<div class="row" style="margin-top:5px;gap:6px"><span class="tiny muted" style="width:52px">精通经验</span><div class="bar xp" style="flex:1" data-live="mastery" data-job="${job.id}" data-i="${i}"><i style="width:${(mnext * 100).toFixed(1)}%"></i></div></div>` : ''}
      ${blocked ? '<div class="tiny red" style="margin-top:4px">材料不足</div>' : ''}
    </div>`;
  },
  /* v0.0.38：模糊投入徽章只显示一个图标、与普通消耗栏同尺寸；下拉列表在 app.js 里以浮层打开。
     没勾选的组成物品不计入消耗，也不参与「够不够料」的判断。 */
  recipeInputList(job, r, i) {
    const ent = Object.entries(r.inputs || {});
    if (!ent.length) return '<span class="dim">无</span>';
    return ent.map(([n, q]) => this.inputBadge(job, r, i, n, q)).join(' ');
  },
  inputBadge(job, r, i, n, q) {
    const generic = !!(E.GENERIC_IN && E.GENERIC_IN[n]);
    if (!generic) {
      const id = this.itemIdOf(n);
      const it = id ? E.ITEMS[id] : null;
      const lack = E.stockOf(n) < q;
      const name = lack ? `<span class="red">${this.esc(n)}</span>` : this.esc(n);
      return `<span class="badge io"${id ? ` data-tip-item="${id}"` : ''}>${it ? this.itemIcon(it) + ' ' : ''}${name} ×${E.fmt(q)}</span>`;
    }
    const all = E.genericItemIds(n);
    const sel = E.inputSelection(job.id, r, n);
    // 金属 / 皮革锻造：总库存够不代表某一种材料够一次投料，徽章按「实际可开工」标红
    const dynMat = (n === '金属' && r && r.metalBase) || (n === '皮革' && r && r.leatherBase);
    const lack = dynMat
      ? !E.materialForRecipe(r, job.id, true)
      : E.stockOf(n, sel) < q;
    // v0.0.40：优先拿已收录的筛选物品做徽章图标；全都未收录时才显示问号
    const seenId = sel.find(x => E.S.seen && E.S.seen.items && E.S.seen.items[x])
      || all.find(x => E.S.seen && E.S.seen.items && E.S.seen.items[x]) || null;
    const firstId = seenId || sel[0] || all[0] || null;
    const first = firstId ? E.ITEMS[firstId] : null;
    const firstSeen = !!(firstId && E.S.seen && E.S.seen.items && E.S.seen.items[firstId]);
    const icon = first ? (firstSeen ? this.itemIcon(first) : '<span class="qmark">？</span>') : '';
    // v0.0.39：不再写「点击筛选」原生提示；悬停显示当前图标的物品面板
    return `<span class="badge io inpbadge ${lack ? 'bad' : ''}" role="button" tabindex="0"
      data-act="inpfilter" data-job="${job.id}" data-i="${i}" data-in="${this.esc(n)}"${firstSeen ? ` data-tip-item="${firstId}"` : ''}>
      ${icon}${icon ? ' ' : ''}<span class="${lack ? 'red' : ''}">${this.esc(n)} ×${E.fmt(q)}</span></span>`;
  },
  ioList(obj, checkStock) {
    const ent = Object.entries(obj || {});
    if (!ent.length) return '<span class="dim">无</span>';
    return ent.map(([n, q]) => {
      const id = this.itemIdOf(n);
      const it = id ? E.ITEMS[id] : null;
      const lack = !!checkStock && E.stockOf(n) < q;   // 消耗栏：库存不够时物品名标红
      const name = lack ? `<span class="red">${this.esc(n)}</span>` : this.esc(n);
      return `<span class="badge io"${id ? ` data-tip-item="${id}"` : ''}>${it ? this.itemIcon(it) + ' ' : ''}${name} ×${E.fmt(q)}</span>`;
    }).join(' ');
  },
  miningPanel(job) {
    const pool = (job.ores || []);
    const total = pool.reduce((a, o) => a + (o.weight || 0), 0) || 1;
    return `<div class="card" style="margin-top:14px">
      <h3>矿脉概率</h3>
      <table class="t"><thead><tr><th>矿石</th><th class="r">权重</th><th class="r">概率</th><th class="r">单价</th></tr></thead><tbody>
      ${pool.filter(o => E.jobVisible(job)).map(o => {
        const id = E.iid(o.name); const it = E.ITEMS[id];
        const unlocked = this.oreUnlocked(o.name);
        return `<tr style="${unlocked ? '' : 'opacity:.4'}"><td>${this.itemIcon(it)} ${this.esc(o.label || o.name)}${unlocked ? '' : ' 🔒'}</td><td class="r mono">${o.weight}</td><td class="r mono">${unlocked ? (o.weight / total * 100).toFixed(1) + '%' : '—'}</td><td class="r mono">${it ? E.fmt(it.price) : '—'}</td></tr>`;
      }).join('')}
      </tbody></table>
      <div class="tiny dim" style="margin-top:6px">稀有矿需要对应科技解锁。</div>
    </div>`;
  },
  oreUnlocked(name) {
    const rare = { '银矿': '金属冶炼', '金矿': '金属冶炼', '稀土': '半导体制造', '钛矿': '精密装配', '铝土矿': '金属冶炼', '铀矿': '核能', '硝酸': '火药' };
    return !rare[name] || E.researched(rare[name]);
  },

  /* ---------------- 狩猎 / 恩赐工作 ---------------- */
  combatLogHtml(cs) {
    const logs = (cs && cs.logs) || [];
    if (!logs.length) return '<div class="dim small">暂无</div>';
    return logs.map(l => {
      let tm = '';
      try { tm = new Date(l.t || Date.now()).toLocaleTimeString('zh-CN', { hour12: false }); } catch (_) {}
      return `<div class="l ${l.kind || ''}"><span class="lt mono">${tm}</span>${this.esc(l.msg)}</div>`;
    }).join('');
  },
  /* 战场：敌我血条 + 双方攻击间隔进度 + 战斗日志（v0.0.30）
     血条和间隔条都挂 data-live，UI.tick 每 0.2 秒原地更新，不再整页重绘。 */
  battleField(job, c) {
    const cs = E.combatState(job.id);
    const e = cs.enemy, st = c ? E.charStats(c) : null;
    const pct = (v) => Math.max(0, Math.min(100, v)).toFixed(1) + '%';
    let h = '';
    if (e) {
      const ehp = Math.max(0, cs.ehp || 0);
      const eint = e.interval || 2.4;
      h += `<div class="row foeRow" style="align-items:flex-start;gap:12px">
        ${this.enemyIcon(e)}
        <div style="flex:1;min-width:0">
          <div class="row" style="justify-content:space-between"><b>${this.esc(e.name)}</b><span class="badge">${e.tier ? 'Lv.' + e.tier : '野外'}</span></div>
          <div class="bar enemy tall" style="margin-top:8px" data-live="ehp"><i style="width:${pct(ehp / e.hp * 100)}"></i><span data-live="ehpText">${Math.ceil(ehp)} / ${e.hp}</span></div>
          <div class="tiny muted" style="margin-top:6px">命中 ${e.atk || 0} · 力量 ${e.str || 0} · 防御 ${e.def || 0} · 减免 ${e.dr || 0}% · 间隔 ${eint}s</div>
          <div class="atkline"><span class="k">敌方攻击</span><div class="bar sm foe" data-live="eap"><i style="width:${pct((cs.tE || 0) / eint * 100)}"></i></div><span class="v mono" data-live="eapText">${Math.max(0, eint - (cs.tE || 0)).toFixed(1)}s</span></div>
        </div>
      </div>`;
    } else {
      h += `<div class="empty" data-live="erespawn">${cs.respawn > 0 ? '敌人将在 ' + cs.respawn.toFixed(1) + 's 后出现' : '等待入驻角色…'}</div>`;
    }
    if (c && st) {
      const hp = c.hpNow === undefined || c.hpNow === null ? st.maxHp : c.hpNow;
      h += `<div class="hr"></div>
        <div class="row" style="gap:10px;align-items:center">
          ${this.avatar(c, 'sm')}
          <div style="flex:1;min-width:0">
            <div class="row" style="justify-content:space-between"><b class="small">${this.esc(E.charName(c))}</b><span class="tiny ${c.injured ? 'red' : 'muted'}">${c.injured ? '重伤' : '战斗中'}</span></div>
            <div class="bar hp" style="margin-top:5px" data-live="php"><i style="width:${pct(hp / st.maxHp * 100)}"></i><span data-live="phpText">${Math.ceil(hp)} / ${st.maxHp}</span></div>
            <div class="tiny muted" style="margin-top:6px">命中 ${st.atk} · 力量 ${st.str} · 防御 ${c.lv.def} · 减免 ${st.dr.toFixed(0)}% · 间隔 ${st.interval.toFixed(1)}s</div>
            <div class="atkline"><span class="k">我方攻击</span><div class="bar sm atk" data-live="pap"><i style="width:${pct((cs.tP || 0) / (st.interval || 2.4) * 100)}"></i></div><span class="v mono" data-live="papText">${Math.max(0, (st.interval || 2.4) - (cs.tP || 0)).toFixed(1)}s</span></div>
          </div>
        </div>`;
    }
    h += `<div class="hr"></div><div class="row" style="justify-content:space-between"><h3 style="margin:0">战斗日志</h3><span class="tiny dim">伤害 / 未命中 / 击杀都记录</span></div>
      <div class="log battlelog" data-live="clog">${this.combatLogHtml(cs)}</div>`;
    return h;
  },
  pageHunt(job) {
    const S = E.S, js = S.jobs[job.id];
    E.ensureSlots(js, 1);
    const c = E.slotChar(js, 0);
    const cs = E.combatState(job.id);
    const region = (job.regions || E.REGIONS)[cs.region || 0] || { name: '—', enemies: [] };
    let h = `<div class="wrap">
      <div class="pagehead"><div class="icon lg">🏹</div><div><h2>狩猎</h2><div class="sub">选择区域，派一名角色自动战斗。角色不会死亡，只会重伤。</div></div></div>
      <div class="split">
        <div class="card">
          <h3>区域</h3>
          <div class="row">${(job.regions || E.REGIONS).map((r, i) => {
            const locked = r.tech && !E.researched(r.tech);
            return `<button class="${(cs.region || 0) === i ? 'primary' : ''}" data-act="region" data-i="${i}" ${locked ? 'disabled title="需要科技：' + this.esc(r.tech) + '"' : ''}>${this.esc(r.name)}${locked ? ' 🔒' : ''}</button>`;
          }).join('')}</div>
          <div class="hr"></div>
          <h3>入驻角色</h3>
          <div class="row" data-act="recslot" data-job="${job.id}" data-i="0" style="cursor:pointer">
            ${c ? this.avatar(c) : '<div class="av empty">＋</div>'}
            <div>${c ? `<b>${this.esc(E.charName(c))}</b><div class="tiny muted">DPS ≈ ${E.fmt(E.charDps(c, cs.enemy || { def: 5 }), 1)} · 精通 ${E.masteryLvl(c, job.id)}</div>` : '<span class="dim">点击选择角色</span>'}</div>
          </div>
          <div class="hr"></div>
          <div class="row"><span class="small muted">可用角色</span></div>
          <div style="margin-top:8px">${this.chips()}</div>
        </div>
        <div class="card">
          <h3>战场</h3>
          ${this.battleField(job, c)}
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <h3>本区域敌人物种</h3>
        <div class="row">${(region.enemies || []).map(n => { const e = E.ENEMIES.find(x => x.name === n); if (!e) return ''; const seen = E.S.seen.enemies[e.id]; return `<span class="badge bdFoe ${seen ? 'on' : 'off'}">${seen ? this.enemyIcon(e, 'xs') : ''}${seen ? e.name + ' ' + e.hp + 'HP' : '？？？'}</span>`; }).join('')}</div>
        <div class="tiny dim" style="margin-top:8px">击杀可提升图鉴认知度；满级后可开展畜牧。</div>
      </div>
    </div>`;
    return h;
  },
  pageGiftJob(job) {
    const js = E.S.jobs[job.id];
    E.ensureSlots(js, 1);
    const c = E.slotChar(js, 0);
    const cs = E.combatState(job.id);
    const owner = job.staffOnly || job.owner || (job.special === 'blackSoul' ? '星见由岐' : '大少');
    const lv = c ? E.masteryLvl(c, job.id) : 1;
    const tiers = E.ENEMIES.filter(e => e.type === (job.special === 'blackSoul' ? 'blackSoul' : 'eraSim'));
    return `<div class="wrap">
      <div class="pagehead"><div class="icon lg">${this.jobIcon(job)}</div><div><h2>${this.esc(job.name)}</h2>
      <div class="sub">社交恩赐专属工作 · 仅 ${owner} 可入驻 · 技能等级 ${lv}/100</div></div></div>
      <div class="split">
        <div class="card">
          <h3>入驻</h3>
          <div class="row" data-act="recslot" data-job="${job.id}" data-i="0" style="cursor:pointer">
            ${c ? this.avatar(c) : '<div class="av empty">＋</div>'}
            ${c ? `<b>${this.esc(E.charName(c))}</b>` : `<span class="dim">点击选择 ${owner}</span>`}
          </div>
          <div class="hr"></div>
          <h3>怪物档位（按技能等级解锁）</h3>
          <table class="t"><thead><tr><th>怪物</th><th class="r">HP</th><th class="r">解锁</th></tr></thead><tbody>
          ${tiers.map(e => `<tr style="${lv >= (e.unlockLevel||1) ? '' : 'opacity:.45'}"><td>${this.esc(e.name)}</td><td class="r mono">${e.hp}</td><td class="r mono">Lv.${e.unlockLevel||1}</td></tr>`).join('')}
          </tbody></table>
          <div class="tiny dim" style="margin-top:6px">击破档位越高，掉落越多。${job.special === 'blackSoul' ? '产出灵魂 / 余火。' : ''}</div>
        </div>
        <div class="card">
          <h3>战场</h3>
          ${this.battleField(job, c)}
        </div>
      </div>
    </div>`;
  },
  pagePower(job) {
    const S = E.S, js = S.jobs[job.id];
    E.ensureSlots(js, 1);
    const c = E.slotChar(js, 0);
    const gens = window.JOB_POWER_GENERATORS || {};
    const list = [];
    for (const era in gens) (gens[era] || []).forEach(g => list.push(Object.assign({ era }, g)));
    return `<div class="wrap">
      <div class="pagehead"><div class="icon lg">⚡</div><div><h2>电力</h2><div class="sub">发电设备提供电力；供电不足时耗电工作会减速。</div></div></div>
      <div class="card">
        <div class="row" style="gap:26px">
          <div><div class="tiny muted">发电</div><div style="font-size:22px" class="mono green">${E.fmt(E.powerProduced(), 0)} <span class="small muted">瓦</span></div></div>
          <div><div class="tiny muted">消耗</div><div style="font-size:22px" class="mono red">${E.fmt(E.powerDemand(), 0)} <span class="small muted">瓦</span></div></div>
          <div><div class="tiny muted">供电效率</div><div style="font-size:22px" class="mono ${E.powerEfficiency() >= 1 ? 'green' : 'gold'}">${(E.powerEfficiency() * 100).toFixed(0)}%</div></div>
        </div>
      </div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin-top:12px">
        ${list.map(g => {
          const built = !!(S.power.built[g.id]);
          const unlocked = !g.tech || E.researched(g.tech);
          return `<div class="card ${built ? 'upg done' : ''}">
            <div class="row" style="justify-content:space-between"><b class="small">${this.esc(g.name)}</b><span class="badge ${built ? 'on' : ''}">${g.watt} 瓦</span></div>
            <div class="tiny muted" style="margin-top:4px">${g.tech ? '科技：' + this.esc(g.tech) : '初始可用'}</div>
            ${built ? '' : `<div class="price" style="margin-top:6px">${this.priceLine(g.cost || {})}</div>
              <button class="primary" style="margin-top:8px;width:100%" data-act="buildgen" data-id="${g.id}" ${(!unlocked || !E.affordCost(g.cost || {})) ? 'disabled' : ''}>${unlocked ? '建造' : '未解锁'}</button>`}
          </div>`;
        }).join('') || '<div class="empty">暂无发电设备</div>'}
      </div>
      <div class="card" style="margin-top:12px"><h3>电力工作</h3><div class="sub">指派角色到「电力」工作可发电。</div></div>
      <div class="card" style="margin-top:12px"><h3>入驻</h3>
        <div class="row" data-act="recslot" data-job="power" data-i="0" style="cursor:pointer">${c ? this.avatar(c) + '<b>' + this.esc(E.charName(c)) + '</b>' : '<div class="av empty">＋</div><span class="dim">点击选择角色</span>'}</div>
        <div style="margin-top:10px">${this.chips()}</div>
      </div>
    </div>`;
  },

  /* ---------------- 科技树 ---------------- */
  pageTech() { return `<div class="wrap">${this.techTreeHtml()}</div>`; },
  techUnlockText(u) {
    u = String(u);
    let m = u.match(/^(.*?)工作(（.*）)?$/);
    if (m) return '解锁工作「' + m[1] + '」' + (m[2] || '');
    m = u.match(/^(.*?)资源$/);
    if (m) return '解锁资源「' + m[1] + '」';
    m = u.match(/^(.*?)区域$/);
    if (m) return '解锁区域「' + m[1] + '」';
    m = u.match(/^(.*?)能源$/);
    if (m) return '解锁能源「' + m[1] + '」';
    m = u.match(/^(.*?)矿(（.*）)?$/);
    if (m && m[1].length <= 2) return '解锁矿种「' + m[1] + '矿」' + (m[2] || '');
    m = u.match(/^(.*?发电机)(（.*）)?$/);
    if (m) return '解锁发电设备「' + m[1] + '」' + (m[2] || '');
    m = u.match(/^(.*?)材料$/);
    if (m) return '解锁材料「' + m[1] + '」';
    m = u.match(/^(.*?)升级项(（.*）)?$/);
    if (m) return '解锁升级项「' + m[1].replace(/^\[|\]$/g, '') + '」' + (m[2] || '');
    m = u.match(/^\[([^\]]+)\]$/);
    if (m) return E.N2I(m[1]) ? '解锁物品「' + m[1] + '」' : '解锁升级项「' + m[1] + '」';
    if (E.N2I(u)) return '解锁物品「' + u + '」';
    return u;
  },
  techTreeHtml() {
    const S = E.S;
    let h = `<div class="pagehead"><h2>科技树</h2>
      <span class="badge">已研究 ${E.techsDone()}/${E.TECHS.length}</span>
      <span class="badge blue">科研点 <b class="mono" data-live="researchval">${E.fmt(S.research)}</b></span>
      <span class="badge">${E.eraName()}</span>
      ${S.dev ? '<span class="badge warn">🛠 开发者：已完成科技可退化</span>' : ''}</div>`;
    E.ERA_LIST.forEach(era => {
      const list = E.TECHS.filter(t => t.era === era.id);
      if (!list.length) return;
      const visible = list.filter(t => E.techDone(t.id) || E.techAvailable(t) || t.requires.some(r => E.researched(r)));
      if (!visible.length) return;
      h += `<div class="eraBlock"><div class="eraHead"><h3>${era.name}</h3><span class="tiny dim">${list.filter(t => E.techDone(t.id)).length}/${list.length}</span></div>
        <div class="techgrid">` + visible.map(t => {
          const done = E.techDone(t.id), avail = E.techAvailable(t);
          return `<div class="tech ${done ? 'done' : avail ? 'avail' : 'locked'}">
            <div class="tn"><span>${this.esc(t.name)}</span><span class="tiny mono ${S.research >= t.cost ? 'blue' : 'dim'}">${E.fmt(t.cost)}</span></div>
            <div class="td">${this.esc(t.desc || '')}</div>
            <div class="tu"><span class="tk">作用</span><ul>${(t.unlocks || []).map(u => `<li>${this.esc(this.techUnlockText(u))}</li>`).join('')}</ul></div>
            <div class="tc">${done ? '✓ 已完成' : avail ? '可研究' : '前置：' + (t.requires || []).filter(r => !E.researched(r)).join('、')}</div>
            ${done ? '' : `<button class="primary" style="margin-top:8px;width:100%" data-act="tech" data-id="${t.id}" ${(!avail || S.research < t.cost) ? 'disabled' : ''}>研究</button>`}
            ${done && S.dev ? `<button class="danger devbtn" style="margin-top:8px;width:100%" data-act="devDegradeTech" data-id="${t.id}" title="开发者：退化该科技（连带后续科技，不返还科研点）">退化</button>` : ''}
          </div>`;
        }).join('') + `</div></div>`;
    });
    return h;
  },

  /* ---------------- 仓库 ---------------- */
  pageWarehouse() {
    const S = E.S;
    const tab = S.ui.tab.wh || 'warehouse';
    let h = `<div class="wrap"><div class="pagehead"><h2>仓库</h2>
      <span class="badge">${tab === 'warehouse' ? E.warehouseUsed() + ' / ' + E.warehouseCap() + ' 格' : E.fmt(E.granaryTotal(), 0) + ' 份'}</span></div>
      <div class="tabs">
        <div class="tab ${tab === 'warehouse' ? 'active' : ''}" data-act="tab" data-k="wh" data-v="warehouse">仓库</div>
        <div class="tab ${tab === 'granary' ? 'active' : ''}" data-act="tab" data-k="wh" data-v="granary">粮仓 ${E.fmt(E.granaryTotal(), 0)}</div>
      </div>`;
    if (tab === 'warehouse') h += this.warehouseTab();
    else h += this.granaryTab();
    h += `</div>`;
    return h;
  },
  warehouseTab() {
    const S = E.S;
    const sort = S.ui.tab.whSort || 'order';
    let ids = Object.keys(S.items).filter(id => (S.items[id] || 0) > 0 && E.ITEMS[id] && E.ITEMS[id].storage !== 'granary');
    const orderIdx = id => E.ITEM_ORDER.indexOf(id);
    if (sort === 'name') ids.sort((a, b) => E.ITEMS[a].name.localeCompare(E.ITEMS[b].name, 'zh'));
    else if (sort === 'value') ids.sort((a, b) => (S.items[b] * E.ITEMS[b].price) - (S.items[a] * E.ITEMS[a].price));
    else ids.sort((a, b) => orderIdx(a) - orderIdx(b));
    let h = `<div class="card"><div class="row">
      <div class="row">排序：<button class="${sort === 'order' ? 'primary' : ''}" data-act="sort" data-v="order">默认</button>
      <button class="${sort === 'name' ? 'primary' : ''}" data-act="sort" data-v="name">名称</button>
      <button class="${sort === 'value' ? 'primary' : ''}" data-act="sort" data-v="value">总价值</button></div></div>
      ${!ids.length ? '<div class="empty">仓库空空如也。去「工作」派角色采集吧。</div>' : `
      <table class="t" style="margin-top:10px"><thead><tr><th>物品</th><th class="r">数量</th><th class="r">单价</th><th class="r">总价值</th><th class="r">操作</th></tr></thead><tbody>
      ${ids.map(id => {
        const it = E.ITEMS[id], q = S.items[id];
        return `<tr><td data-tip-item="${id}">${this.itemIcon(it)} ${this.esc(it.name)}${it.cat === 'book' ? ' <span class="tiny dim">技能书</span>' : ''}</td>
          <td class="r mono">${E.fmt(q)}</td><td class="r mono">${E.fmt(it.price)}</td><td class="r mono gold">${E.fmt(q * it.price)}</td>
          <td class="r"><button class="sm" data-act="sell" data-id="${id}">卖 1</button> <button data-act="sellall" data-id="${id}">全卖</button></td></tr>`;
      }).join('')}</tbody></table>`}
    </div>`;
    // 升级项
    const t = E.WH_UPG[S.whUpg];
    h += `<div style="margin-top:14px"><h3 style="font-size:15px">仓库扩容</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin-top:8px">`;
    E.WH_UPG.forEach((u, i) => {
      const done = i < S.whUpg, cur = i === S.whUpg;
      if (!done && (!cur || !E.everOwnedAll(u.cost))) return;
      h += `<div class="card upg ${done ? 'done' : ''}">
        <div class="row" style="justify-content:space-between"><b class="small">${this.esc(u.name)}</b><span class="badge ${done ? 'on' : ''}">${u.slots} 格</span></div>
        <div class="tiny muted">共 ${u.slots} 格</div>
        ${done ? '<div class="tiny green" style="margin-top:6px">✓ 已建成</div>' : `<div class="price" style="margin-top:6px">${this.priceLine(u.cost)}</div>
          <button class="primary" style="margin-top:8px;width:100%" data-act="buywh" ${E.affordCost(u.cost) ? '' : 'disabled'}>扩建</button>`}
      </div>`;
    });
    h += `</div></div>`;
    return h;
  },
  granaryTab() {
    const S = E.S;
    const ids = Object.keys(S.items).filter(id => (S.items[id] || 0) > 0 && E.ITEMS[id] && E.ITEMS[id].storage === 'granary');
    const chars = E.onFieldChars().length;
    const left = chars ? E.granaryTotal() / (chars * E.GAME.foodPerCharSec) : Infinity;
    const spoilt = E.granarySpoilMul() <= 0;
    let h = `<div class="card">
      <div class="row" style="justify-content:space-between"><b>当前 ${E.fmt(E.granaryTotal(), 0)} 份</b>
      <span class="small ${left < 60 ? 'red' : 'muted'}">${chars ? '约可支撑 ' + E.fmtTime(left) : '无人在场'}</span></div>
      <div class="tiny muted" style="margin-top:4px">容量无限 · ${spoilt ? '冷库：全部不腐坏' : '腐坏速度见每行（食物基础 600 秒减半，种子 2400 秒减半）'}</div>
      ${!ids.length ? '<div class="empty">粮仓是空的。派角色去采集 / 种植 / 烹饪。</div>' : `
      <table class="t" style="margin-top:10px"><thead><tr><th>食物</th><th class="r">数量</th><th class="r">单价</th><th class="r">腐坏速度</th><th class="r">操作</th></tr></thead><tbody>
      ${ids.map(id => {
        const it = E.ITEMS[id];
        const rate = E.granaryDecayRate(id);
        const rateText = rate > 0 ? '−' + (rate * 100).toFixed(3) + '%/秒' : '不腐坏';
        const spoilCell = spoilt ? '<span class="green">不腐坏</span>' : `<span class="red">${rateText}</span>`;
        return `<tr><td data-tip-item="${id}">${this.itemIcon(it)} ${this.esc(it.name)}</td><td class="r mono">${E.fmt(S.items[id], 0)}</td><td class="r mono">${E.fmt(it.price)}</td><td class="r mono">${spoilCell}</td><td class="r"><button data-act="sellall" data-id="${id}">全卖</button></td></tr>`;
      }).join('')}
      </tbody></table>`}
    </div>
    <div style="margin-top:14px"><h3 style="font-size:15px">粮仓升级</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin-top:8px">`;
    E.GR_UPG.forEach((u, i) => {
      const done = i < S.granary, cur = i === S.granary;
      if (!done && (!cur || !E.everOwnedAll(u.cost))) return;
      const eff = u.spoilMul === 0 ? '不腐坏' : '腐坏 −' + Math.round((1 - (u.spoilMul == null ? 1 : u.spoilMul)) * 100) + '%';
      h += `<div class="card upg ${done ? 'done' : ''}">
        <div class="row" style="justify-content:space-between"><b class="small">${this.esc(u.name)}</b><span class="badge ${done ? 'on' : ''}">${eff}</span></div>
        ${done ? '<div class="tiny green" style="margin-top:6px">✓ 已建成</div>' : `<div class="price" style="margin-top:6px">${this.priceLine(u.cost)}</div>
        <button class="primary" style="margin-top:8px;width:100%" data-act="buygr" ${E.affordCost(u.cost) ? '' : 'disabled'}>建造</button>`}
      </div>`;
    });
    h += `</div></div>`;
    return h;
  },

  /* ---------------- 商店 ---------------- */
  pageShop() {
    const S = E.S;
    if (!E.researched('文字')) {
      return `<div class="wrap"><div class="pagehead"><h2>商店</h2></div>
      <div class="card empty">商店尚未开张。研究 <b class="blue">文字</b>后开启。</div></div>`;
    }
    let h = `<div class="wrap"><div class="pagehead"><h2>商店</h2><span class="badge gold">金币 ${E.fmt(S.gold)}</span>
      <span class="badge">货架刷新 ${Math.max(0, S.shop.next - S.playtime).toFixed(0)}s</span></div>
      <div class="shopgrid" style="margin-top:12px">`;
    S.shop.slots.forEach((s, i) => {
      if (!s) { h += `<div class="shopitem" style="opacity:.3">已售罄</div>`; return; }
      const it = E.ITEMS[s.id];
      const price = Math.ceil(s.price * s.qty);
      h += `<div class="shopitem" data-tip-item="${s.id}">
        <div class="icon">${it ? this.itemIcon(it) : '📦'}</div>
        <b class="small">${this.esc(it ? it.name : s.id)}</b>
        <div class="tiny muted">×${s.qty}</div>
        <button class="gold" data-act="buy" data-i="${i}" ${S.gold < price ? 'disabled' : ''}>${E.fmt(price)} 金</button>
      </div>`;
    });
    h += `</div>`;
    // 常驻商品：升星药水 + 已解锁工作的精通书（卡片 + 图标，悬停看物品面板）
    const sd = E.count('星尘');
    const potion = E.count('升星药水');
    const potionId = E.N2I('升星药水');
    h += `<h3 style="font-size:15px;margin-top:18px">常驻商品</h3>
      <div class="shopgrid" style="margin-top:8px">`;
    if (potionId) {
      const it = E.ITEMS[potionId];
      h += `<div class="shopitem" data-tip-item="${potionId}">
        <div class="icon">${this.itemIcon(it)}</div>
        <b class="small">${this.esc(it.name)}</b>
        <div class="tiny muted">持有 ${E.fmt(potion)}</div>
        <button class="gold" data-act="buyPotion" ${sd < E.POTION_STARDUST_COST ? 'disabled' : ''}>${E.POTION_STARDUST_COST} 星尘</button>
      </div>`;
    }
    E.JOBS.filter(j => !j.special && E.jobVisible(j)).forEach(j => {
      const id = E.N2I(j.name + '精通书');
      const it = id && E.ITEMS[id];
      if (!it) return;
      h += `<div class="shopitem" data-tip-item="${id}">
        <div class="icon">${this.itemIcon(it)}</div>
        <b class="small">${this.esc(it.name)}</b>
        <div class="tiny muted">精通 +10</div>
        <button data-act="buybook" data-id="${id}" ${S.gold < E.buyPrice(id) ? 'disabled' : ''}>${E.fmt(E.buyPrice(id))} 金</button>
      </div>`;
    });
    h += `</div></div>`;
    return h;
  },

  /* ---------------- 角色页 ---------------- */
  supplyBox(c, field, label) {
    const id = c[field];
    const it = id ? E.ITEMS[id] : null;
    const stock = id ? E.count(id) : 0;
    let state = '未指定 · 自动';
    if (field === 'food') {
      if (id && stock > 0) state = '生效：' + E.foodEffectText(id);
      else if (id) state = '粮仓无货 · 暂不生效';
    } else {
      if (id && stock > 0) {
        const med = it && it.med;
        state = c.injured ? `生效：×${med ? med.healMul : 1} 回血` : `备好：×${med ? med.healMul : 1} 回血`;
      } else if (id) state = '仓库无货 · 暂不生效';
    }
    return `<div class="slot supply ${it ? 'filled' : ''}" data-act="${field === 'food' ? 'foodslot' : 'medslot'}" ${it ? `data-tip-item="${id}"` : `title="点击选择${label}"`}>
      <div class="ph">${it ? this.itemIcon(it) : '＋'}</div>
      <div class="nm">${it ? this.esc(it.name) : label}</div>
      <div class="tiny dim supplyState">${this.esc(state)}</div>
    </div>`;
  },
  /* v0.0.33：好感度进度条上的 25 / 50 / 100 节点。
     节点本身可悬浮，面板写清「到点后解锁什么」（数据来自 HEROES 的 e1d / e2d）。 */
  favorNode(c, tier) {
    const on = c.favor >= tier;
    const left = tier === 100 ? 'transform:translate(-100%,-50%);left:100%' : `left:${tier}%`;
    return `<span class="fnode ${on ? 'on' : ''}" data-tip-favor="${c.cid}:${tier}" style="${left}"><i></i></span>`;
  },
  favorTipHtml(cid, tier) {
    const c = E.S.chars[cid];
    if (!c) return '';
    const esc = s => this.esc(s);
    const def = E.heroDef(cid) || {};
    const on = c.favor >= tier;
    let name = '', desc = '';
    if (tier === 25) {
      name = '头像解锁';
      desc = '好感度 ≥ 25 后解锁该角色的头像使用权（节点奖励）。';
    } else if (tier === 50) {
      name = def.e1 || '一级社交恩赐';
      desc = def.gen ? '随机普通角色没有社交恩赐。' : (def.e1d || '好感度 ≥ 50 后解锁一级社交恩赐。');
    } else {
      name = def.e2 || '二级社交恩赐';
      desc = def.gen ? '随机普通角色没有社交恩赐。' : (def.e2d || '好感度达到 100 后强化一级社交恩赐。');
    }
    return `<div class="ttHead"><span class="ttIcon">💜</span><div class="ttTitle">
      <b>好感度 ${tier} 节点</b>
      <div class="ttTags"><span class="badge ${on ? 'on' : 'off'}">${on ? '已激活' : '未激活'}</span></div></div></div>
      <div class="ttRows"><div class="ttRow"><span class="k">当前好感</span><span class="v mono">${c.favor} / 100</span></div></div>
      <div class="ttSec">节点效果</div>
      <div class="ttDesc"><b class="violet">${esc(name)}</b>：${esc(desc)}</div>`;
  },
  pageCharacters() {
    const S = E.S;
    const sel = S.chars[S.ui.charSel] ? S.ui.charSel : (S.order[0] || 'player');
    const c = S.chars[sel];
    if (!c) return `<div class="wrap"><div class="empty">还没有角色</div></div>`;
    const st = E.charStats(c);
    const slots = [
      ['head', '头盔'], ['headInner', '内衬头盔'], ['body', '胸甲'], ['bodyInner', '内衬'],
      ['legs', '护腿'], ['legsInner', '内衬护腿'], ['feet', '靴子'], ['socks', '袜子'],
      ['offhand', '副手'], ['neck', '项链'], ['belt', '腰带'], ['mainhand', '主手'],
    ];
    const slotBox = (key, label) => {
      const id = c.eq[key]; const it = id ? E.ITEMS[id] : null;
      const main = c.eq.mainhand ? E.ITEMS[c.eq.mainhand] : null;
      const ghost = (!it && key === 'offhand' && main && main.twoHanded) ? main : null;
      if (ghost) {
        return `<div class="slot ghost" data-act="eqslot" data-slot="${key}" data-tip-item="${c.eq.mainhand}" title="副手由双手武器占用：点此可换副手">
          <div class="ph">${this.itemIcon(ghost)}</div><div class="nm">${this.esc(ghost.name)}</div></div>`;
      }
      return `<div class="slot ${it ? 'filled' : ''}" data-act="eqslot" data-slot="${key}" ${it ? `data-tip-item="${id}"` : `title="${label}（空）"`}>
        <div class="ph">${it ? this.itemIcon(it) : '＋'}</div><div class="nm">${it ? this.esc(it.name) : label}</div></div>`;
    };
    const equipItems = Object.keys(S.items).filter(id => (S.items[id] || 0) > 0 && E.ITEMS[id] && (E.ITEMS[id].cat === 'equip' || E.ITEMS[id].cat === 'weapon'));
    const masteryJobs = E.JOBS.filter(j => E.jobVisible(j));
    return `<div class="wrap">
      <div class="pagehead"><h2>角色</h2>
        <span class="badge">上场 ${Math.min(S.order.length, E.onFieldCap())} / ${E.onFieldCap()}</span>
        <span class="badge">角色总数 ${S.order.length}</span>
        <button data-act="rename">改名</button>
      </div>
      <div class="charlayout">
        <div class="card">
          <div class="eqgrid">
            ${slotBox('head', '头盔')}${slotBox('headInner', '内衬头盔')}${slotBox('body', '胸甲')}${slotBox('bodyInner', '内衬')}
            ${slotBox('legs', '护腿')}
            <div class="eqcenter" style="grid-column:span 2;grid-row:span 2;display:flex;flex-direction:column;align-items:center;gap:4px">
              ${this.avatar(c, 'xl')}
              <div style="text-align:center"><b>${this.esc(E.charName(c))}</b>
              <div class="tiny ${c.injured ? 'red' : 'muted'}">${c.injured ? '重伤休养中' : (E.isOnField(c) ? '上场' : '待命（置灰）')}</div></div>
            </div>
            ${slotBox('legsInner', '内衬护腿')}
            ${slotBox('feet', '靴子')}${slotBox('socks', '袜子')}${slotBox('offhand', '副手')}${slotBox('neck', '项链')}
            ${slotBox('belt', '腰带')}${slotBox('mainhand', '主手')}
          </div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between;margin-bottom:6px"><b class="small">补给栏</b><span class="tiny dim">选中后该角色优先消耗；食物需粮仓有货才生效</span></div>
          <div class="supplyrow">
            ${this.supplyBox(c, 'food', '食物')}
            ${this.supplyBox(c, 'med', '医物')}
          </div>
          <div class="hr"></div>
          <div class="row" style="justify-content:space-between">
            <span class="small">战力 <b class="gold mono">${E.fmt(E.charPower(c))}</b></span>
            <div class="row"><button data-act="autoEquip">一键最优</button><button data-act="unequipAll">全部卸下</button></div>
          </div>
          ${c.kind !== 'player' ? `<div class="hr"></div>
            <div class="row" style="justify-content:space-between">
              <span class="small">好感度 <b class="violet">${c.favor}</b>/100</span>
              <span class="tiny dim">${c.favor >= 100 ? '爱戴' : c.favor >= 50 ? '友好' : c.favor >= 25 ? '头像已解锁' : '陌生'}</span>
            </div>
            <div class="favorbar">
              <div class="bar"><i style="width:${c.favor}%;background:linear-gradient(90deg,#4b3a6b,#a98be0)"></i></div>
              ${[25, 50, 100].map(t => this.favorNode(c, t)).join('')}
            </div>
            <div class="row" style="justify-content:space-between">
              <span class="small">升星 <b class="gold">${'★'.repeat(c.stars)}${'☆'.repeat(5 - c.stars)}</b></span>
              <button class="gold" data-act="starup" data-id="${c.cid}" ${c.stars >= 5 ? 'disabled' : ''}>升星（${c.stars} 瓶药水）</button>
            </div>
            <div class="tiny dim" style="margin-top:4px">${(() => { const h = E.heroDef(c.cid); const job = h && h.job; return job ? '特长：' + this.esc(job) + ' +' + Math.round(E.charBonusFor(c, { name: job }) * 100) + '% 工作速度' : '特长：无'; })()}</div>
            <div class="row" style="margin-top:8px">
              ${c.gen ? `<button class="red" data-act="dismissChar" data-id="${c.cid}">开除</button>` : `<button data-act="sendgift" data-id="${c.cid}" aria-haspopup="true">🎁 送礼物</button>`}
            </div>` : `<div class="tiny dim" style="margin-top:8px">玩家角色。</div>`}
        </div>

        <div class="card">
          <div class="row" style="justify-content:space-between"><h3>仓库装备</h3><span class="tiny dim">拖到左侧装备栏</span></div>
          ${!equipItems.length ? '<div class="empty">仓库里没有装备</div>' : `<div class="wgrid" style="margin-top:8px">
            ${equipItems.map(id => { const it = E.ITEMS[id]; return `<div class="slot sm ${'filled'}" draggable="true" data-drag="item" data-id="${id}" data-act="eqfrom" data-tip-item="${id}">
              <div class="ph">${this.itemIcon(it)}</div><div class="nm">${this.esc(it.name)}</div><div class="tiny dim">×${E.fmt(S.items[id])}</div></div>`; }).join('')}
          </div>`}
        </div>

        <div>
          <div class="card">
            <h3>战斗属性</h3>
            <div class="statrow"><span class="k">生命</span><span class="mono">${c.hpNow === undefined ? st.maxHp : Math.ceil(c.hpNow)} / ${st.maxHp}</span></div>
            <div class="bar hp" style="margin:4px 0 8px"><i style="width:${Math.min(100, (c.hpNow || st.maxHp) / st.maxHp * 100).toFixed(1)}%"></i></div>
            <div class="statrow"><span class="k">命中</span><span class="mono">${st.atk} <span class="tiny dim">(Lv.${c.lv.atk})</span></span></div>
            <div class="statrow"><span class="k">力量</span><span class="mono">${st.str} <span class="tiny dim">(Lv.${c.lv.str})</span></span></div>
            <div class="statrow"><span class="k">防御</span><span class="mono">${c.lv.def}</span></div>
            <div class="statrow"><span class="k">伤害减免</span><span class="mono">${st.dr.toFixed(0)}%</span></div>
            <div class="statrow"><span class="k">攻击间隔</span><span class="mono">${st.interval.toFixed(1)}s</span></div>
            <div class="statrow"><span class="k">最大伤害</span><span class="mono">${st.maxHit}</span></div>
            ${E.foodAtkStrBonus(c) ? `<div class="statrow"><span class="k">食物增益</span><span class="mono green">命中 / 力量 +${E.foodAtkStrBonus(c)} 级</span></div>` : ''}
          </div>
          <div class="card" style="margin-top:12px">
            <h3>精通</h3>
            <div class="mastery">
              ${masteryJobs.map(j => { const lv = E.masteryLvl(c, j.id), p = E.masteryNext(c, j.id); return `<div class="mrow"><div><span class="small">${this.esc(j.name)}</span><div class="mb"><i style="width:${(p * 100).toFixed(1)}%"></i></div></div><span class="mono small">${lv}</span></div>`; }).join('')}
            </div>
          </div>
        </div>
      </div>
      <div style="margin-top:14px">
        <div class="row" style="justify-content:space-between"><h3 style="font-size:15px">角色列表</h3></div>
        <div class="charlist">
          ${S.order.map((cid, i) => {
            const ch = S.chars[cid]; if (!ch) return '';
            const dim = i >= E.onFieldCap();
            const jobId = Object.keys(S.jobs).find(j => S.jobs[j].slots && S.jobs[j].slots.includes(cid));
            return `${i === E.onFieldCap() ? '<div class="sep"></div>' : ''}
              <div class="chip ${dim ? 'dim' : ''} ${cid === sel ? 'sel' : ''}" draggable="true" data-drag="order" data-id="${cid}" data-act="selectChar">
                <div class="avwrap">${this.avatar(ch)}${jobId ? `<span class="corner" title="当前工作：${this.esc(E.JOB_BY_ID[jobId].name)}">${this.jobIcon(E.JOB_BY_ID[jobId])}</span>` : ''}</div>
                <div class="cn">${this.esc(E.charName(ch))}</div>
                ${ch.stars > 1 ? `<span class="star">${'★'.repeat(ch.stars)}</span>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  },

  /* ---------------- 图鉴 ---------------- */
  pageCodex() {
    const S = E.S;
    const tab = S.ui.tab.codex || 'items';
    const itemIds = Object.keys(E.ITEMS).filter(id => !E.ITEMS[id].hidden);
    const enemyList = E.ENEMIES.filter(e => !e.hidden);
    const charDefs = E.poolHeroList();
    const pending = E.codexUnclaimed();
    const seenItems = itemIds.filter(id => S.seen.items[id]);
    const seenEnemies = enemyList.filter(e => S.seen.enemies[e.id]);
    const ownedChars = charDefs.filter(x => S.chars[x.id]);
    const claimBtn = (k, id, n) => `<button class="claimbtn" data-act="claimCodex" data-k="${k}" data-id="${id}">领取 +${n}</button>`;
    let h = `<div class="wrap"><div class="pagehead"><h2>图鉴</h2>
      <span class="badge">物品 ${seenItems.length}/${itemIds.length}</span>
      <span class="badge">敌人 ${seenEnemies.length}/${enemyList.length}</span>
      <span class="badge">角色 ${ownedChars.length}/${charDefs.length}</span>
      ${pending.total ? `<button class="gold" data-act="claimAllCodex">全部领取 · ${pending.total} 项（+${pending.shards} 招募券）</button>` : ''}</div>
      <div class="tabs">
        <div class="tab ${tab === 'items' ? 'active' : ''}" data-act="tab" data-k="codex" data-v="items">物品</div>
        <div class="tab ${tab === 'enemies' ? 'active' : ''}" data-act="tab" data-k="codex" data-v="enemies">敌人</div>
        <div class="tab ${tab === 'chars' ? 'active' : ''}" data-act="tab" data-k="codex" data-v="chars">角色</div>
      </div>`;
    if (tab === 'items') {
      h += `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">` +
        itemIds.slice().sort((a, b) => E.ITEM_ORDER.indexOf(a) - E.ITEM_ORDER.indexOf(b)).map(id => {
          const it = E.ITEMS[id], seen = S.seen.items[id];
          const claimable = E.codexClaimable('items', id);
          return `<div class="card ${claimable ? 'claim' : ''}" style="padding:9px 10px;${seen ? '' : 'opacity:.45'}"${seen ? ` data-tip-item="${id}"` : ''}>
            ${claimable ? claimBtn('items', id, E.CODEX_REWARD.items) : ''}
            <div class="row" style="gap:8px">${seen ? this.itemIcon(it) : '❔'}<b class="small">${seen ? this.esc(it.name) : '？？？'}</b></div>
            ${seen ? `<div class="tiny muted" style="margin-top:4px">${[ERA_TAG_NAME[it.era] || '', it.price ? E.fmt(it.price) + ' 金' : ''].filter(Boolean).join(' · ')}</div>` : ''}
          </div>`;
        }).join('') + `</div>`;
    } else if (tab === 'enemies') {
      h += `<table class="t"><thead><tr><th>敌人</th><th>区域/类型</th><th class="r">生命</th><th class="r">命中</th><th class="r">力量</th><th class="r">防御</th><th class="r">减免</th><th>掉落</th><th>奖励</th></tr></thead><tbody>` +
        enemyList.map(e => {
          const seen = S.seen.enemies[e.id];
          const claimable = E.codexClaimable('enemies', e.id);
          const claimed = E.codexClaimed('enemies', e.id);
          return `<tr class="${claimable ? 'claim' : ''}" style="${seen ? '' : 'opacity:.45'}">
          <td><div class="row" style="gap:8px;align-items:center">${seen ? this.enemyIcon(e, 'xs') : ''}<span>${seen ? this.esc(e.name) : '？？？'}</span></div></td><td class="small">${this.esc(e.region || (e.type === 'blackSoul' ? '黑暗之魂' : '模拟纪元'))}</td>
          <td class="r mono">${seen ? e.hp : '—'}</td><td class="r mono">${seen ? e.atk : '—'}</td><td class="r mono">${seen ? e.str : '—'}</td><td class="r mono">${seen ? e.def : '—'}</td><td class="r mono">${seen ? (e.dr || 0) + '%' : '—'}</td>
          <td class="tiny">${seen ? (e.loot || []).map(l => l.name).join('、') : '—'}</td>
          <td>${claimable ? `<button class="claimbtn inline" data-act="claimCodex" data-k="enemies" data-id="${e.id}">领取 +${E.CODEX_REWARD.enemies}</button>` : (claimed ? '<span class="tiny dim">已领</span>' : '—')}</td></tr>`;
        }).join('') + `</tbody></table>`;
    } else {
      h += `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">` +
        charDefs.map(x => {
          const def = x.def, owned = S.chars[x.id];
          const claimable = E.codexClaimable('chars', x.id);
          return `<div class="card ${claimable ? 'claim' : ''}" style="${owned ? '' : 'opacity:.5'}">
            ${claimable ? claimBtn('chars', x.id, E.CODEX_REWARD.chars) : ''}
            <div class="row">${owned ? this.avatar(owned) : '<div class="av empty">？</div>'}
              <div><b>${owned ? this.esc(def.name) : '？？？'}</b><div class="tiny muted">${x.gen ? '随机普通角色' : '限定'}</div></div></div>
            ${owned ? `<div class="tiny muted" style="margin-top:6px">生命 ${def.hp} · 命中 ${def.atk} · 力量 ${def.str} · 防御 ${def.def}</div>
              <div class="tiny dim">自带加成：${def.job ? this.esc(def.job) + ' +20%' : '无'}</div>
              <div class="tiny ${def.e1 ? 'gold' : 'dim'}" style="margin-top:4px">${def.e1 ? this.esc(def.e1) + (owned.favor >= 100 ? ' / ' + this.esc(def.e2) : '') : '无社交恩赐'}</div>` : `<div class="tiny dim" style="margin-top:6px">尚未在招募中抽到</div>`}
          </div>`;
        }).join('') + `</div>`;
    }
    h += `</div>`;
    return h;
  },

  /* ---------------- 招募 ---------------- */
  pageRecruit() {
    const S = E.S;
    const shards = E.shardCount();
    const cost = E.PULL_COST;
    const genOwned = S.order.filter(id => S.chars[id] && S.chars[id].gen).length;
    const shardItem = E.ITEMS[E.SHARD_ITEM];
    const pityNoNew = E.gachaPity(), pityWin = E.gachaPityLimit();
    const giftOdds = E.GIFTS.map(g => this.esc(g.name) + ' ' + (g.w / 100 * 70).toFixed(1) + '%').join(' / ');
    const giftChip = `<div class="chip poolchip"><div class="av md giftav">${this.itemIcon(E.ITEMS[E.GIFTS[0].id])}</div><div class="cn tiny">好感度礼物</div></div>`;
    let h = `<div class="wrap"><div class="pagehead"><h2>招募</h2>
      <span class="badge shardbadge" data-tip-item="${E.SHARD_ITEM}">${shardItem ? this.itemIcon(shardItem) : ''}招募券 <b class="gold">${shards}</b></span>
      <span class="badge">累计抽卡 ${S.gacha.pulls || 0}</span>
      <span class="badge">随机普通角色 ${genOwned}</span>
      <span class="badge" title="限定与常驻共用一个保底窗口；抽到角色后窗口 +1 抽，最长 10 抽">保底 ${pityNoNew}/${pityWin} 抽</span></div>
      <div class="grid poollist" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));margin-top:14px">`;
    E.POOLS.forEach(p => {
      const named = (p.heroes || []).map(id => E.heroDef(id)).filter(Boolean);
      const namedOwned = named.filter(hero => E.ownsHero(hero.id)).length;
      const complete = named.length > 0 && namedOwned === named.length;
      h += `<div class="poolwrap">
        <div class="card">
        <div class="row" style="justify-content:space-between"><h3 style="margin:0">${this.esc(p.name)}</h3><span class="badge ${complete ? 'on' : ''}">${named.length ? '英雄 ' + namedOwned + '/' + named.length : '随机角色'}</span></div>
        <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
          ${named.map(hero => {
            const own = E.ownsHero(hero.id);
            return `<div class="chip poolchip" style="${own ? '' : 'opacity:.42'}" title="${own ? this.esc(hero.name) : '未拥有'}">
              ${own ? this.avatar(S.chars[hero.id], 'md') : '<div class="av md empty">？</div>'}
              <div class="cn tiny">${own ? this.esc(hero.name) : '？？？'}</div></div>`;
          }).join('')}
          <div class="chip poolchip">
            <div class="av md empty">？</div><div class="cn tiny">随机普通角色</div>
          </div>
          ${giftChip}
        </div>
        <div class="row" style="margin-top:10px;justify-content:flex-end">
          <button class="gold" data-act="pull" data-id="${p.id}" ${shards < cost ? 'disabled' : ''}>抽一次（${cost} 招募券）</button>
        </div>
        </div>
        <div class="tiny muted poolodds">
          <div>出角色 <b class="green">30%</b> · 好感度礼物 <b>70%</b></div>
          <div>礼物档位：${giftOdds}</div>
        </div>
      </div>`;
    });
    h += `</div>
      <div class="card" style="margin-top:14px">
        <h3>已拥有角色</h3>
        <div class="chips" style="margin-top:8px">
          ${S.order.filter(id => S.chars[id] && S.chars[id].kind !== 'player').map(id => { const c = S.chars[id]; return `<div class="chip" title="${this.esc(E.charName(c))}"><div class="avwrap">${this.avatar(c)}</div><div class="cn">${this.esc(E.charName(c))}${c.gen ? ' <span class="tiny dim">随机</span>' : ''}</div><div class="tiny gold">${'★'.repeat(c.stars)}</div><div class="tiny muted">好感 ${c.favor}</div></div>`; }).join('') || '<span class="dim small">还没有英雄角色</span>'}
        </div>
      </div>
    </div>`;
    return h;
  },

  /* ---------------- 住所与娱乐 ---------------- */
  pageHousing() {
    const S = E.S;
    const next = E.HOUSING[S.housing];
    let h = `<div class="wrap"><div class="pagehead"><h2>住所与娱乐</h2>
      <span class="badge">角色上限 ${E.onFieldCap()}</span>
      <span class="badge">舒适度 ${E.comfortValue()}/100</span>
      <span class="badge">全局效率 +${(E.comfortValue() * 0.35).toFixed(1)}%</span></div>
      <div class="split">
        <div class="card"><h3>住房（角色上限）</h3>
          <div class="sub">住房能提高角色上限，使有效角色更多。</div>
          <div class="hr"></div>
          ${E.HOUSING.map((t, i) => {
            const done = i < S.housing, cur = i === S.housing;
            if (!done && (!cur || !E.everOwnedAll(t.cost))) return '';
            return `<div class="card upg ${done ? 'done' : ''}" style="margin-bottom:8px">
              <div class="row" style="justify-content:space-between">${this.passIcon(t.name)}<b class="small" style="flex:1">${this.esc(t.name)}</b><span class="badge ${done ? 'on' : ''}">可上场 ${t.cap} 人</span></div>
              ${done ? '<div class="tiny green">✓ 已建成</div>' : `<div class="price" style="margin-top:4px">${this.priceLine(t.cost)}</div>
              <button class="primary" style="margin-top:6px;width:100%" data-act="buyhouse" ${E.affordCost(t.cost) ? '' : 'disabled'}>建造</button>`}
            </div>`;
          }).join('')}
          ${!next ? '<div class="tiny green">已建满全部住房。</div>' : ''}
        </div>
        <div class="card"><h3>舒适度（家具 / 娱乐 / 地板）</h3>
          <div class="sub">舒适度提高工作效率，上限 100。</div>
          <div class="hr"></div>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:8px">
          ${E.COMFORT.map((t, i) => {
            const done = !!S.comfort[i];
            if (!done && !E.everOwnedAll(t.cost)) return '';
            return `<div class="card upg ${done ? 'done' : ''}" style="padding:8px 10px">
              <div class="row" style="justify-content:space-between">${this.passIcon(t.name, true)}<b class="tiny" style="flex:1">${this.esc(t.name)}</b><span class="badge ${done ? 'on' : ''}">+${t.value}</span></div>
              ${done ? '' : `<div class="price" style="margin-top:4px">${this.priceLine(t.cost)}</div>
                <button style="margin-top:5px;width:100%" data-act="buycomfort" data-i="${i}" ${E.affordCost(t.cost) ? '' : 'disabled'}>购买</button>`}
            </div>`;
          }).join('')}
          </div>
        </div>
      </div>
    </div>`;
    return h;
  },

  /* ---------------- 防御 ---------------- */
  pageDefense() {
    const S = E.S;
    const last = S.raid.last;
    let h = `<div class="wrap"><div class="pagehead"><h2>防御</h2>
      <span class="badge">基地战力 <b class="gold">${E.fmt(E.basePower())}</b></span>
      <span class="badge">下次袭击 ${S.raid.next - S.playtime > 0 ? E.fmtTime(S.raid.next - S.playtime) : '判定中'}</span>
      <span class="badge">袭击强度 -${Math.round(E.fortReduce() * 100)}%</span></div>
      <div class="split">
        <div class="card"><h3>基地战力构成</h3>
          <div class="statrow"><span class="k">工事战力</span><span class="mono">${E.fmt(E.fortPower())}</span></div>
          <div class="statrow"><span class="k">上场角色战力</span><span class="mono">${E.fmt(E.basePower() - E.fortPower())}</span></div>
          <div class="statrow"><span class="k">财富值（会被抢）</span><span class="mono">${E.fmt(E.wealth())}</span></div>
          <div class="statrow"><span class="k">预计袭击强度</span><span class="mono red">${E.fmt(E.raidStrength())}</span></div>
          <div class="row" style="margin-top:10px"><button data-act="raidPreview">预演袭击（不结算）</button></div>
          <div class="tiny dim" style="margin-top:8px">每隔一段时间会有袭击发生，基地战力过低会丢失部分财物。</div>
        </div>
        <div class="card"><h3>最近战报</h3>
          ${last ? `<div class="row" style="justify-content:space-between"><span class="${last.win ? 'green' : 'red'}">${last.win ? '击退' : '失守'}</span><span class="tiny dim">${new Date(last.time).toLocaleTimeString()}</span></div>
            <div class="small" style="margin-top:6px">袭击强度 <b class="mono">${E.fmt(last.strength)}</b> vs 基地战力 <b class="mono">${E.fmt(last.defense)}</b></div>
            ${last.gold ? `<div class="tiny red">被抢金币 ${E.fmt(last.gold)}</div>` : ''}
            ${last.lost && Object.keys(last.lost).length ? `<div class="tiny red">损失物品：${Object.entries(last.lost).map(([id, n]) => E.itemName(id) + ' ×' + n).join('、')}</div>` : ''}
          ` : `<div class="empty">还没有遭遇袭击</div>`}
        </div>
      </div>
      <div style="margin-top:14px"><h3 style="font-size:15px">防御工事</h3>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:8px">
      ${E.FORTS.map((f, i) => {
        const done = !!S.forts[i];
        const builtCount = S.forts.filter(Boolean).length;
        if (!done && i > builtCount) return '';
        if (!done && !E.everOwnedAll(f.cost)) return '';
        return `<div class="card upg ${done ? 'done' : ''}">
          <div class="row" style="justify-content:space-between">${this.passIcon(f.name)}<b class="small" style="flex:1">${this.esc(f.name)}</b><span class="badge ${done ? 'on' : ''}">战力 ${E.fmt(f.power)}</span></div>
          <div class="tiny muted">${f.reduce ? '袭击强度 -' + Math.round(f.reduce * 100) + '% ' : ''}${f.watt ? '⚡ ' + f.watt + ' 瓦' : ''}</div>
          ${done ? '' : `<div class="price" style="margin-top:6px">${this.priceLine(f.cost)}</div>
          <button class="primary" style="margin-top:8px;width:100%" data-act="buyfort" data-i="${i}" ${E.affordCost(f.cost) ? '' : 'disabled'}>建造</button>`}
        </div>`;
      }).join('')}
      </div></div>
    </div>`;
    return h;
  },

  /* ---------------- 每帧轻量更新 ---------------- */
  tick() {
    const S = E.S;
    this._sweepLoot();
    this.renderHud();
    const page = S.ui.page;
    if (page && page.startsWith('job:')) {
      const jobId = page.slice(4), job = E.JOB_BY_ID[jobId], js = S.jobs[jobId];
      if (!job || !js) return;
      if (job.special !== 'hunting' && job.special !== 'blackSoul' && job.special !== 'eraSim') {
        document.querySelectorAll('[data-live="rec"]').forEach(bar => {
          const i = +bar.dataset.i;
          const p = (js.prog && js.prog[i]) || 0;
          const fill = bar.querySelector('i');
          if (fill) fill.style.width = (p * 100).toFixed(1) + '%';
        });
        document.querySelectorAll('[data-live="mastery"]').forEach(bar => {
          const i = +bar.dataset.i;
          const c = js.slots && js.slots[i] ? S.chars[js.slots[i]] : null;
          if (!c) return;
          const fill = bar.querySelector('i');
          if (fill) fill.style.width = (E.masteryNext(c, jobId) * 100).toFixed(1) + '%';
          const lv = document.querySelector('[data-live="masterylvl"][data-i="' + i + '"]');
          if (lv) lv.textContent = E.masteryLvl(c, jobId);
        });
      } else {
        const cs = E.combatState(jobId);
        const c = js.slots && js.slots[0] ? S.chars[js.slots[0]] : null;
        const st = c ? E.charStats(c) : null;
        const e = cs.enemy;
        const setBar = (sel, pct) => document.querySelectorAll(sel + ' > i').forEach(f => { f.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%'; });
        const setText = (sel, txt) => document.querySelectorAll(sel).forEach(el => { el.textContent = txt; });
        if (e) {
          setBar('[data-live="ehp"]', (cs.ehp || 0) / e.hp * 100);
          setText('[data-live="ehpText"]', Math.ceil(Math.max(0, cs.ehp || 0)) + ' / ' + e.hp);
          const eint = e.interval || 2.4;
          setBar('[data-live="eap"]', (cs.tE || 0) / eint * 100);
          setText('[data-live="eapText"]', Math.max(0, eint - (cs.tE || 0)).toFixed(1) + 's');
        } else {
          setText('[data-live="erespawn"]', cs.respawn > 0 ? '敌人将在 ' + cs.respawn.toFixed(1) + 's 后出现' : '等待入驻角色…');
        }
        if (c && st) {
          const hp = c.hpNow === undefined || c.hpNow === null ? st.maxHp : c.hpNow;
          setBar('[data-live="php"]', hp / st.maxHp * 100);
          setText('[data-live="phpText"]', Math.ceil(Math.max(0, hp)) + ' / ' + st.maxHp);
          setBar('[data-live="pap"]', (cs.tP || 0) / (st.interval || 2.4) * 100);
          setText('[data-live="papText"]', Math.max(0, (st.interval || 2.4) - (cs.tP || 0)).toFixed(1) + 's');
        }
        const logEl = document.querySelector('[data-live="clog"]');
        if (logEl) {
          const lsig = (cs.logs || []).length + '|' + ((cs.logs && cs.logs[0]) ? cs.logs[0].t : 0);
          if (logEl.dataset.sig !== lsig) { logEl.dataset.sig = lsig; logEl.innerHTML = this.combatLogHtml(cs); }
        }
        const csig = [e ? e.id : '-', cs.respawn > 0 ? 1 : 0, c ? c.cid : '-', c && c.injured ? 1 : 0, (js.slots || []).join(',')].join('|');
        if (!this._combatSigs) this._combatSigs = {};
        if (this._combatSigs[jobId] !== csig) { this._combatSigs[jobId] = csig; this.render(); }
      }
      if (job.id === 'husbandry') {
        const animals = E.husbandryAnimals();
        document.querySelectorAll('[data-live="hprog"]').forEach(bar => {
          const a = animals[+bar.dataset.i];
          const fill = bar.querySelector('i');
          if (a && fill) fill.style.width = (Math.max(0, Math.min(1, a.prog || 0)) * 100).toFixed(1) + '%';
        });
        const used = E.husbandryUsed(), cap = E.husbandryCapacity();
        document.querySelectorAll('[data-live="hubused"]').forEach(el => { el.textContent = '畜牧容量 ' + E.fmt(used) + ' / ' + E.fmt(cap); });
        const fodderNow = E.count('草料'), feedCostNow = E.husbandryFeedCost();
        document.querySelectorAll('[data-live="hubcost"]').forEach(el => {
          el.classList.toggle('bad', feedCostNow > 0 && fodderNow < feedCostNow);
        });
      }
      if (job.special === 'research') {
        document.querySelectorAll('[data-live="researchval"]').forEach(el => { el.textContent = E.fmt(S.research); });
        document.querySelectorAll('[data-act="tech"]').forEach(btn => {
          const t = E.TECHS.find(x => x.id === btn.dataset.id);
          if (t) btn.disabled = !E.techAvailable(t) || S.research < t.cost;
        });
      }
      // 工作页不逐帧整页重绘；但里程碑 / 新工作 / 升级项可见性变化时要立刻刷新，
      // 否则玩家停在采集页时，伐木 / 采矿 / 科研 / 医疗出现后左侧导航不会更新。
      const sig = [
        E.jobVisible(job) ? 1 : 0,
        (js.up || []).join(''),
        (js.slots || []).join(','),
        (js.blocked || []).join(','),
        Object.keys(S.ever || {}).length,
        ['wood_stone', 'research_ready', 'injured'].map(k => (S.milestones && S.milestones[k]) ? 1 : 0).join(''),
      ].join('|');
      if (!this._jobSigs) this._jobSigs = {};
      if (this._jobSigs[jobId] !== sig) { this._jobSigs[jobId] = sig; this.render(); }
    }
    if (page === 'codex') {
      // 图鉴没有实时数字：只在「收录 / 领取 / 切换页签」变化时重绘，
      // 避免每 1.5 秒把滚动位置和用户选中的文本冲掉
      const sig = [
        S.ui.tab.codex || 'items',
        Object.keys(S.seen.items || {}).length,
        Object.keys(S.seen.enemies || {}).length,
        Object.keys(S.chars || {}).length,
        E.codexUnclaimed().total,
      ].join('|');
      if (sig !== this._codexSig) { this._codexSig = sig; this.render(); }
    } else if (page === 'warehouse' || page === 'shop' || page === 'tech' || page === 'characters' || page === 'housing' || page === 'defense' || page === 'recruit') {
      // 这些页面每 1.5 秒整页重绘一次，保证金币/科研点等数字变化
      if (!this._lastFull || Date.now() - this._lastFull > 1500) { this._lastFull = Date.now(); this.render(); }
    }
  },
};
window.UI = UI;
