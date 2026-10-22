/* =========================================================================
   纪元放置 · 引擎层
   数据全部来自 js/data/*.js（由设计文档转写）
   ========================================================================= */
'use strict';

/* ---------- 常量 ---------- */
const GAME = {
  tickMs: 200,
  saveKey: 'eraIdleSave_v1',
  masteryXpMax: 14394,      // 文档：精通 1→100 级累计在岗秒数
  foodPerCharSec: 0.05,     // 每名上场角色每秒消耗的食物份数
  raidPeriod: 7200,         // 袭击间隔（秒）
  shopRefresh: 60,
  weaponDefaultInterval: 2.4,
};

const HEROES = [
  { id:'yuki',   name:'星见由岐',       pool:'神人俱乐部', hp:12, atk:10, str:12, def:6,  job:'锻造',     e1:'黑暗之魂',           e2:'黑暗之魂+' },
  { id:'finger', name:'一根手指扣晕你', pool:'神人俱乐部', hp:4,  atk:12, str:14, def:10, job:'火药制作', e1:'让这个瞬间成为永恒', e2:'让这个瞬间成为永恒+' },
  { id:'chao',   name:'超超',           pool:'神人俱乐部', hp:10, atk:8,  str:6,  def:16, job:'种植',     e1:'开拓者',             e2:'开拓者+' },
  { id:'juju',   name:'居居',           pool:'神人俱乐部', hp:6,  atk:6,  str:6,  def:6,  job:'畜牧',     e1:'习惯',               e2:'习惯+' },
  { id:'lare',   name:'Laremehpe',      pool:'P社',        hp:8,  atk:10, str:8,  def:8,  job:'科研',     e1:'波浪式地向前进',      e2:'波浪式地向前进+' },
  { id:'dashao', name:'大少',           pool:'steam游戏群', hp:14, atk:6,  str:8,  def:12, job:'医疗',     e1:'模拟纪元',           e2:'模拟纪元+' },
  { id:'muyi',   name:'木易天二人一',   pool:'steam游戏群', hp:8,  atk:9,  str:10, def:7,  job:'伐木',     e1:'潜水摸鱼',           e2:'潜水摸鱼+' },
  { id:'liu',    name:'刘',             pool:'steam游戏群', hp:7,  atk:8,  str:9,  def:10, job:'烹饪',     e1:'人缘好',             e2:'人缘好+' },
  { id:'space',  name:'空白TheSpace',   pool:'双池',        hp:12, atk:7,  str:8,  def:9,  job:'切石机',   e1:'搬石',               e2:'搬石+' },
];
const POOLS = [
  { id:'shenren', name:'神人俱乐部', heroes:['yuki','finger','chao','juju','space'] },
  { id:'pshe',    name:'P社',        heroes:['lare'] },
  { id:'steam',   name:'steam游戏群', heroes:['dashao','muyi','liu','space'] },
];
const GIFTS = [
  { id:'gift1', name:'便利贴', favor:2,  w:50, price:400  },
  { id:'gift2', name:'周边',   favor:6,  w:30, price:1200 },
  { id:'gift3', name:'典藏',   favor:15, w:15, price:3000 },
  { id:'gift4', name:'传家宝', favor:30, w:5,  price:6000 },
];
const ERA_LIST = (window.ERAS || [
  { id:'stone', name:'石器时代' }, { id:'medieval', name:'中世纪' },
  { id:'industrial', name:'工业时代' }, { id:'info', name:'信息时代' }, { id:'space', name:'太空时代' },
]);
const ERA_KEYS = ERA_LIST.map(e => e.id);
const ERA_NAME = {}; ERA_LIST.forEach(e => ERA_NAME[e.id] = e.name);
const ERA_BASE = { stone:800, medieval:3000, industrial:6500, info:14500, space:30000 };
const ERA_WEALTH = { stone:50000, medieval:250000, industrial:1000000, info:4000000, space:16000000 };
const ERA_MAT = { stone:'木材', medieval:'铁锭', industrial:'钢铁', info:'钛合金', space:'外星合金' };

/* ---------- 数据索引 ---------- */
const ITEMS = window.ITEMS || {};
const ITEM_ORDER = window.ITEM_ORDER || Object.keys(ITEMS);
const JOBS = (window.JOBS || []).slice().sort((a,b) => (a.order||0) - (b.order||0));
const TECHS = window.TECHS || [];
const ENEMIES = window.ENEMIES || [];
const REGIONS = window.REGIONS || [];
const WEAPON_COMBAT = window.WEAPON_COMBAT || {};
const CC = window.COMBAT_CONST || {};
const HOUSING = window.HOUSING || [];
const COMFORT = window.COMFORT || [];
const FORTS = window.FORTS || [];
const WH_UPG = window.WAREHOUSE_UPG || [];
const GR_UPG = window.GRANARY_UPG || [];
const PR = window.PASSIVE_RULES || {};

/* 发电设备（工作表.md「电力系统」：煤炭 10 / 蒸汽 25 / 风力 15 / 太阳能 25 / 核电 120 瓦）
   造价为按 4 档阶梯推导的占位值 */
window.JOB_POWER_GENERATORS = window.JOB_POWER_GENERATORS || {
  industrial: [
    { id:'coal',  name:'煤炭发电',   watt:10, tech:'蒸汽机',     cost:{ '钢铁':200, '机械零件':50 } },
    { id:'steam', name:'蒸汽发电机', watt:25, tech:'蒸汽机',     cost:{ '钢铁':400, '机械零件':100 } },
  ],
  info: [
    { id:'wind',  name:'风力发电',   watt:15, tech:'风力发电',   cost:{ '铝合金':100, '精密零件':30 } },
    { id:'solar', name:'太阳能发电', watt:25, tech:'太阳能发电', cost:{ '硅片':100, '芯片':30 } },
  ],
  space: [
    { id:'nuclear', name:'核电站',   watt:120, tech:'核能',      cost:{ '核燃料':200, '钛合金':300 } },
  ],
};

const BY_NAME = {};
Object.values(ITEMS).forEach(it => { BY_NAME[it.name] = it; });
const N2I = name => (BY_NAME[name] ? BY_NAME[name].id : null);
const JOB_BY_ID = {}; JOBS.forEach(j => JOB_BY_ID[j.id] = j);
const JOB_BY_NAME = {}; JOBS.forEach(j => JOB_BY_NAME[j.name] = j);
const TECH_BY_NAME = {}; TECHS.forEach(t => TECH_BY_NAME[t.name] = t);
const ENEMY_BY_NAME = {}; ENEMIES.forEach(e => ENEMY_BY_NAME[e.name] = e);
const POOL_BY_ID = {}; POOLS.forEach(p => POOL_BY_ID[p.id] = p);
const HERO_BY_ID = {}; HEROES.forEach(h => HERO_BY_ID[h.id] = h);

/* 未在物品表里出现的材料名 → 运行时补一条（容错，正常不应触发） */
function ensureItemByName(name) {
  if (!name) return null;
  if (BY_NAME[name]) return BY_NAME[name].id;
  const id = 'auto_' + Object.keys(BY_NAME).length + '_' + Math.abs(hash(name));
  ITEMS[id] = { id, name, era:'stone', cat:'material', storage:'warehouse', price:1, auto:true };
  BY_NAME[name] = ITEMS[id]; ITEM_ORDER.push(id);
  return id;
}
function hash(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return h; }
function iid(nameOrId) {
  if (!nameOrId) return null;
  if (ITEMS[nameOrId]) return nameOrId;
  return ensureItemByName(nameOrId);
}

/* ---------- 状态 ---------- */
let S = null;

function newChar(cid, opts) {
  return {
    cid, name: opts.name, kind: opts.kind || 'hero', pool: opts.pool || null,
    stars: opts.stars || 1, favor: 0,
    lv: { hp: opts.hp, atk: opts.atk, str: opts.str, def: opts.def },
    xp: { hp:0, atk:0, str:0, def:0 },
    hpNow: 10 + (opts.hp - 1) * 10, injured: false,
    eq: { head:null, headInner:null, body:null, bodyInner:null, legs:null, legsInner:null, feet:null, socks:null, offhand:null, neck:null, belt:null, mainhand:null },
    mastery: {},
  };
}

function newState(name) {
  const st = {
    v: 1, name: name || '无名者', created: Date.now(), lastSave: Date.now(),
    playtime: 0,
    gold: 0, research: 0,
    items: {}, seen: { items:{}, enemies:{}, chars:{} },
    chars: {}, order: [],
    jobs: {}, techs: {}, recipes: {},
    housing: 0, comfort: [], forts: [], whUpg: 0, granary: 0,
    shop: { slots: [], next: 0 },
    gacha: { pity: {}, pulls: 0, noNew: {} },
    combat: {},
    raid: { next: GAME.raidPeriod, last: null, count: 0 },
    power: { built: {}, on: {} },
    ui: { page: 'warehouse', charSel: null, tab: {} },
    discoveredShard: false,
    log: [],
    stats: { kills:0, raids:0, pulls:0 },
  };
  JOBS.forEach(j => {
    st.jobs[j.id] = { char: null, prog: 0, recipe: 0, up: [0,0,0,0] };
  });
  const pc = newChar('player', { name: st.name, kind:'player', hp:1, atk:1, str:1, def:1 });
  st.chars.player = pc; st.order.push('player');
  st.seen.chars.player = true;
  st.ui.charSel = 'player';
  // 开局给一点点食物，避免一上来就饿着
  const berry = N2I('浆果') || N2I('野菌');
  if (berry) st.items[berry] = 8;
  return st;
}

/* ---------- 小工具 ---------- */
function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
function fmt(n, dp) {
  if (n === Infinity) return '∞';
  if (n === null || n === undefined || isNaN(n)) return '0';
  const a = Math.abs(n);
  if (a >= 1e9) return (n/1e9).toFixed(a>=1e10?1:2).replace(/\.0+$/,'') + 'B';
  if (a >= 1e6) return (n/1e6).toFixed(a>=1e7?1:2).replace(/\.0+$/,'') + 'M';
  if (a >= 1e4) return (n/1000).toFixed(a>=1e5?0:1).replace(/\.0+$/,'') + 'K';
  if (Number.isInteger(n) || dp === 0) return String(Math.round(n));
  return n.toFixed(dp === undefined ? 1 : dp).replace(/\.?0+$/,'');
}
function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec/3600), m = Math.floor(sec%3600/60), s = sec%60;
  if (h > 0) return h + ' 时 ' + m + ' 分';
  if (m > 0) return m + ' 分 ' + s + ' 秒';
  return s + ' 秒';
}
function log(html, kind) {
  S.log.unshift({ t: Date.now(), html, kind: kind || '' });
  if (S.log.length > 120) S.log.length = 120;
}
function toast(msg, kind) { if (window.UI) UI.toast(msg, kind); }

/* ---------- 物品 ---------- */
function count(idOrName) {
  const id = ITEMS[idOrName] ? idOrName : N2I(idOrName);
  return id ? (S.items[id] || 0) : 0;
}
function addItem(idOrName, qty) {
  const id = ITEMS[idOrName] ? idOrName : iid(idOrName);
  if (!id || qty <= 0) return 0;
  S.items[id] = (S.items[id] || 0) + qty;
  S.seen.items[id] = true;
  if (ITEMS[id] && ITEMS[id].kind === 'shard') S.discoveredShard = true;
  return qty;
}
function removeItem(idOrName, qty) {
  const id = ITEMS[idOrName] ? idOrName : N2I(idOrName);
  if (!id) return false;
  if ((S.items[id] || 0) < qty) return false;
  S.items[id] -= qty;
  if (S.items[id] <= 1e-9) delete S.items[id];
  return true;
}
function itemName(id) { return ITEMS[id] ? ITEMS[id].name : id; }
function sellPrice(id) { return ITEMS[id] ? (ITEMS[id].price || 0) : 0; }
function buyPrice(id) { const it = ITEMS[id]; if (!it) return 0; return Math.max(1, Math.round(it.price * 3)); }
function warehouseCap() {
  if (!S.whUpg) return 20;
  const t = WH_UPG[S.whUpg - 1];
  return t && t.slots ? t.slots : 20 + S.whUpg * 34;
}
function warehouseUsed() { return Object.keys(S.items).filter(id => (S.items[id]||0) > 0 && (ITEMS[id] ? ITEMS[id].storage !== 'granary' : true)).length; }
function warehouseFull() { return warehouseUsed() >= warehouseCap(); }
function granaryCap() {
  let base = PR.granaryCap || 60, mul = 1;
  GR_UPG.slice(0, S.granary).forEach(u => { if (u.capMul) mul *= u.capMul; });
  return Math.floor(base * mul);
}
function granaryTotal() { let t=0; for (const id in S.items) if (ITEMS[id] && ITEMS[id].storage==='granary') t += S.items[id]; return t; }
function addFood(id, n) {
  const cap = granaryCap(), cur = granaryTotal();
  const room = Math.max(0, cap - cur);
  const amt = Math.min(n, room);
  if (amt > 0) addItem(id, amt);
  return amt;
}

/* ---------- 科技 / 时代 ---------- */
function eraIndex(key) { const i = ERA_KEYS.indexOf(key); return i < 0 ? 0 : i; }
function researched(name) { const t = TECH_BY_NAME[name]; return !!(t && S.techs[t.id]); }
function techDone(id) { return !!S.techs[id]; }
function techAvailable(t) {
  if (techDone(t.id)) return false;
  const reqs = t.requires || [];
  return reqs.every(r => researched(r));
}
function currentEra() {
  let idx = 0;
  TECHS.forEach(t => { if (techDone(t.id)) idx = Math.max(idx, eraIndex(t.era)); });
  return ERA_KEYS[idx] || 'stone';
}
function eraName() { return ERA_NAME[currentEra()] || '石器时代'; }
function eraProgress() {
  const e = currentEra();
  const list = TECHS.filter(t => t.era === e);
  if (!list.length) return 1;
  return list.filter(t => techDone(t.id)).length / list.length;
}
function techsDone() { return TECHS.filter(t => techDone(t.id)).length; }
function jobUnlocked(job) {
  if (job.alwaysVisible) return true;
  if (!job.tech) return true;
  return researched(job.tech);
}
function jobVisible(j) {
  if (j.unlockBy) {
    const c = S.chars[j.unlockBy.hero] || Object.values(S.chars).find(x => x.name === j.unlockBy.hero);
    return !!(c && c.favor >= (j.unlockBy.affection || 50));
  }
  if (j.alwaysVisible) return true;
  if (!j.tech) return true;
  return researched(j.tech);
}
function unlockedJobs() { return JOBS.filter(jobVisible); }

/* ---------- 角色 ---------- */
function onFieldCap() { return Math.min(5 + S.housing * 2, 18); }
function charPower(c) {
  const st = charStats(c);
  const gear = gearPower(c);
  return (c.lv.hp + c.lv.atk + c.lv.str + c.lv.def) * 3 + gear;
}
function gearPower(c) {
  let p = 0;
  for (const slot in c.eq) {
    const id = c.eq[slot]; if (!id) continue;
    const it = ITEMS[id]; if (!it) continue;
    if (it.cat === 'weapon') p += (it.str || 0) * 2 + (it.atk || 0) * 1;
    else p += (it.dr || 0) * 5 + (it.str || 0) * 2;
  }
  return p;
}
function weaponOf(c) { const id = c.eq.mainhand; return id ? ITEMS[id] : null; }
function charStats(c) {
  let dr = 0, str = 0, atk = 0, temp = 0, shield = 0;
  for (const slot in c.eq) {
    const it = ITEMS[c.eq[slot]]; if (!it) continue;
    dr += it.dr || 0; str += it.str || 0; atk += it.atk || 0; temp += it.temp || 0; shield += it.shield || 0;
  }
  const w = weaponOf(c);
  const wc = w ? (WEAPON_COMBAT[w.name] || {}) : {};
  const wStr = wc.str !== undefined ? wc.str : (w ? (w.str || 0) : 0);
  const wAtk = wc.atk !== undefined ? wc.atk : (w ? (w.atk || 0) : 0);
  const strTotal = c.lv.str + str + wStr;
  const atkTotal = c.lv.atk + atk + wAtk;
  const interval = wc.interval || (w && w.interval) || GAME.weaponDefaultInterval;
  const range = wc.range !== undefined ? wc.range : (w && w.range) || 0;
  const mh = Math.floor(10 * (2.2 + strTotal/10 + (strTotal + 17) * str / 640));
  return {
    dr: Math.min(dr, 100), str: strTotal, atk: atkTotal, temp, shield,
    interval, range, maxHp: 10 + (c.lv.hp - 1) * 10,
    maxHit: Math.max(1, mh),
  };
}
function charDps(c, target) {
  const st = charStats(c);
  const atkRating = Math.floor((c.lv.atk + 9) * (st.atk + 64));
  const defRating = Math.floor(((target ? target.def : 5) + 9) * 64);
  const hit = atkRating < defRating ? atkRating/(2*defRating) : 1 - defRating/(2*atkRating);
  const dr = (target && target.dr ? target.dr : 0) / 100;
  const avg = (st.maxHit + 1) / 2 * (1 - dr);
  return hit * avg / st.interval;
}
function masteryOf(c, jobId) {
  if (!c.mastery[jobId]) c.mastery[jobId] = { xp: 0 };
  return c.mastery[jobId];
}
function masteryLvl(c, jobId) {
  const m = masteryOf(c, jobId);
  return Math.min(100, Math.floor(Math.sqrt(Math.max(0,m.xp) / GAME.masteryXpMax) * 100));
}
function masteryPct(c, jobId) { return 1 + masteryLvl(c, jobId) * 0.001; }
function masteryNext(c, jobId) {
  const lv = masteryLvl(c, jobId);
  if (lv >= 100) return 1;
  const need = Math.pow((lv + 1) / 100, 2) * GAME.masteryXpMax;
  return clamp(masteryOf(c,jobId).xp / need, 0, 1);
}
function charBonusFor(c, job) {
  if (!c || c.kind === 'player') return 0;
  const h = HERO_BY_ID[c.cid]; if (!h) return 0;
  if (h.job !== job.name) return 0;
  return 0.2 * (c.stars || 1);
}
function favorUnlocked(c) { return c.favor >= 25; }
function hasGift(c, tier) { return c.favor >= (tier === 1 ? 50 : 100); }
function onFieldChars() { return S.order.slice(0, onFieldCap()).map(id => S.chars[id]).filter(Boolean); }
function isOnField(c) { return S.order.indexOf(c.cid) < onFieldCap(); }
function charName(c) { return c.cid === 'player' ? S.name : c.name; }

/* ---------- 舒适度 / 电力 ---------- */
function comfortValue() { let v = 0; S.comfort.forEach((b,i) => { if (b) v += (COMFORT[i] ? COMFORT[i].value : 0); }); return Math.min(v, 100); }
function comfortMult() { return 1 + comfortValue() * 0.0035; }
function fortPower() { let p = 0; S.forts.forEach((b,i)=>{ if (b) p += FORTS[i].power || 0; }); return p; }
function fortWatts() { let w = 0; S.forts.forEach((b,i)=>{ if (b) w += FORTS[i].watt || 0; }); return w; }
function fortReduce() { let r = 0; S.forts.forEach((b,i)=>{ if (b) r += FORTS[i].reduce || 0; }); return Math.min(r, 0.9); }
const POWERED_JOBS = ['power','machining','chemistry','glassmaking','gunpowder','semiconductors','precision_assembly','alien_mining','particle_collider','synthesis','warp_core'];
function powerProduced() {
  let p = 0;
  const g = window.JOB_POWER_GENERATORS || {};
  for (const era in g) (g[era] || []).forEach(x => { if (S.power.built[x.id]) p += x.watt || 0; });
  const pj = S.jobs.power;
  if (pj && pj.char) p += 10;   // 电力工作：2 木材 / 3 秒 → 10 瓦
  return p;
}
function powerDemand() {
  let d = 0;
  for (const id in S.jobs) {
    const js = S.jobs[id];
    if (!js.char) continue;
    if (POWERED_JOBS.includes(id)) d += 1;
    if (js.up) js.up.forEach((u, k) => { const job = JOB_BY_ID[id]; if (u && job && job.upgrades && job.upgrades[k] && job.upgrades[k].watt) d += job.upgrades[k].watt; });
  }
  d += fortWatts();
  if (S.granary >= 3) d += 1;
  return d;
}
function powerEfficiency() {
  const p = powerProduced(), d = powerDemand();
  if (d <= 0) return 1;
  return clamp(p / d, 0, 1);
}
function powerNow() { return powerProduced(); }

/* ---------- 工作 ---------- */
function jobRecipe(job, idx) {
  const list = (job.recipes && job.recipes.length) ? job.recipes : null;
  if (!list) return { name: job.name, inputs: job.inputs || {}, outputs: job.outputs || {}, era: job.era };
  return list[clamp(idx,0,list.length-1)];
}
function recipeInputs(r) { const o = {}; for (const k in (r.inputs||{})) { const id = iid(normName(k)); if (id) o[id] = r.inputs[k]; } return o; }
function recipeOutputs(r) { const o = {}; for (const k in (r.outputs||{})) { const id = iid(normName(k)); if (id) o[id] = r.outputs[k]; } return o; }
const GENERIC_IN = {
  '素食食材': ['浆果', '块根', '野菌', '坚果'],
  '肉食食材': ['肉类食材'],
  '种子': ['谷物种子', '豆类种子', '蔬菜种子', '甜菜种子', '药草种子'],
};
function genericCount(name) {
  const list = GENERIC_IN[name] || [];
  return list.reduce((a, n) => a + (S.items[iid(n)] || 0), 0);
}
function consumeInputs(r) {
  const ins = r.inputs || {};
  for (const name in ins) {
    let need = ins[name];
    if (GENERIC_IN[name]) {
      for (const real of GENERIC_IN[name]) {
        if (need <= 0) break;
        const id = iid(real), take = Math.min(S.items[id] || 0, need);
        if (take > 0) { removeItem(id, take); need -= take; }
      }
      if (need > 0) return false;
    } else {
      const id = iid(normName(name));
      if (!id || !removeItem(id, need)) return false;
    }
  }
  return true;
}
function canMake(r, mult) {
  const ins = r.inputs || {}; mult = mult || 1;
  for (const name in ins) {
    const need = ins[name] * mult;
    if (GENERIC_IN[name]) { if (genericCount(name) < need) return false; }
    else { const id = iid(normName(name)); if (!id || (S.items[id] || 0) < need) return false; }
  }
  return true;
}
function jobSpeed(jobId) {
  const js = S.jobs[jobId], job = JOB_BY_ID[jobId], c = js.char ? S.chars[js.char] : null;
  let m = 1;
  if (js.up) js.up.forEach((u, k) => { if (u && job.upgrades && job.upgrades[k]) m += (job.upgrades[k].bonusPct || 0) / 100; });
  m *= comfortMult();
  m *= powerEfficiency();
  if (c) {
    m *= masteryPct(c, jobId);
    m *= 1 + charBonusFor(c, job);
    // Laremehpe 波浪
    if (c.cid === 'lare') {
      const phase = (S.playtime % 600) / 600 * Math.PI * 2;
      const wave = c.favor >= 100 ? 1 + 0.5 * Math.sin(phase) : 0.875 + 0.375 * Math.sin(phase);
      m *= wave;
    }
    if (c.injured) m *= 0.35;
  }
  if (granaryTotal() <= 0) m *= 0.5;
  return m;
}
function produceJob(jobId, dt) {
  const js = S.jobs[jobId], job = JOB_BY_ID[jobId];
  if (!job) return;
  if (job.special === 'hunting' || job.special === 'blackSoul' || job.special === 'eraSim') { combatTick(jobId, dt); return; }
  if (!js.char) { js.prog = clamp(js.prog, 0, 1); return; }
  const c = S.chars[js.char]; if (!c) { js.char = null; return; }
  if (c.injured) return;
  const gate = jobGate(jobId);
  if (!gate.ok) return;
  const r = jobRecipe(job, js.recipe || 0);
  const ins = r.inputs || {};
  const rawOuts = r.outputs || {};
  if (Object.keys(ins).length && !canMake(r)) { js.blocked = 'input'; return; }
  js.blocked = null;
  const speed = jobSpeed(jobId);
  const dur = Math.max(0.4, (job.duration || 2)) / speed;
  js.prog = (js.prog || 0) + dt / dur;
  while (js.prog >= 1) {
    js.prog -= 1;
    if (Object.keys(ins).length && !canMake(r)) { js.prog = 0; js.blocked = 'input'; break; }
    if (!consumeInputs(r)) { js.prog = 0; js.blocked = 'input'; break; }
    // 采矿的随机矿池
    if (job.special === 'mining') {
      const pool = miningPool(job);
      const pick = weightedPick(pool);
      if (pick) addItem(pick.id, 1);
      gainMastery(c, jobId, (job.duration||3) * 0.55);
      js.done = (js.done||0) + 1;
      continue;
    }
    if (job.special === 'power') {
      // 电力的产出由 powerProduced() 统一结算（10 瓦），这里只消耗燃料
      gainMastery(c, jobId, (job.duration||3));
      js.done = (js.done||0) + 1;
      continue;
    }
    for (const name in rawOuts) {
      const n = rawOuts[name];
      if (name.indexOf('科研') >= 0) { S.research += n; continue; }
      if (name.indexOf('电力') >= 0) continue;
      if (GENERIC_OUT[name]) {
        for (let k = 0; k < n; k++) {
          const real = GENERIC_OUT[name]();
          if (!real) continue;
          const oid = iid(real);
          if (ITEMS[oid] && ITEMS[oid].storage === 'granary') addFood(oid, 1); else addItem(oid, 1);
        }
        continue;
      }
      const id = iid(normName(name));
      if (!id) continue;
      if (ITEMS[id] && ITEMS[id].storage === 'granary') addFood(id, n);
      else addItem(id, n);
    }
    gainMastery(c, jobId, (job.duration||2));
    js.done = (js.done||0) + 1;
  }
}
function jobGate(jobId) {
  const js = S.jobs[jobId], job = JOB_BY_ID[jobId];
  if (!jobVisible(job)) return { ok:false, why:'未解锁' };
  if (!js.char) return { ok:false, why:'未入驻' };
  return { ok:true };
}
function miningPool(job) {
  const ores = (job.ores || []).filter(o => oreUnlocked(o.name));
  if (!ores.length) return [{ id: N2I('石头'), w: 1 }].filter(x=>x.id).map(x=>({id:x.id, weight:1}));
  return ores.map(o => ({ id: N2I(o.name) || ensureItemByName(o.name), weight: o.weight || 1 }));
}
function oreUnlocked(name /*, job*/) {
  const job = JOB_BY_NAME['采矿'];
  const ore = job && (job.ores || []).find(o => o.name === name);
  if (ore && ore.tech) return researched(ore.tech);
  return true;
}
/* 通用产出名 → 具体物品 */
const PICK = arr => arr[Math.floor(Math.random() * arr.length)];
const GENERIC_OUT = {
  '素食食材': () => PICK(['浆果', '块根', '野菌', '坚果']),
  '肉食食材': () => '肉类食材',
  '种子': () => PICK(['谷物种子', '豆类种子', '蔬菜种子', '甜菜种子', '药草种子']),
  '石器装备': () => pickItem(it => it.era === 'stone' && (it.cat === 'equip' || it.cat === 'weapon')),
  '金属装备': () => pickItem(it => ['medieval', 'industrial'].includes(it.era) && (it.cat === 'equip' || it.cat === 'weapon')),
  '衣物': () => pickItem(it => it.cat === 'equip' && /布|衣|袜|衬|帽|巾/.test(it.name)),
};
function pickItem(fn) {
  const list = Object.values(ITEMS).filter(fn);
  return list.length ? PICK(list).name : null;
}
const NAME_ALIAS = { '骨/角': '骨 / 角' };
function normName(n) {
  if (!n) return n;
  if (NAME_ALIAS[n]) return NAME_ALIAS[n];
  if (BY_NAME[n]) return n;
  const k = Object.keys(BY_NAME).find(x => x.replace(/\s+/g, '') === String(n).replace(/\s+/g, ''));
  return k || n;
}
function weightedPick(arr) {
  const total = arr.reduce((a,b) => a + (b.weight||0), 0);
  let r = Math.random() * total;
  for (const it of arr) { r -= (it.weight||0); if (r <= 0) return it; }
  return arr[arr.length-1];
}
function gainMastery(c, jobId, sec) {
  const m = masteryOf(c, jobId);
  let mult = 1;
  if (c.cid === 'juju' && c.favor >= 50) mult *= c.favor >= 100 ? 2 : 1.5;
  m.xp += sec * mult;
  if (c.cid === 'lare' && c.favor >= 100 && jobSpeed(jobId) > 1.5) m.xp += sec * 0.5;
}

/* ---------- 战斗 ---------- */
function huntingBonus(c, job) {
  let m = 1;
  if (c && c.cid === 'chao') { if (c.favor >= 100) m *= 1.5; else if (c.favor >= 50) m *= 1.25; }
  return m;
}
function combatState(jobId) {
  if (!S.combat[jobId]) S.combat[jobId] = { enemy:null, ehp:0, tP:0, tE:0, respawn:0, region:0, logs:[] };
  return S.combat[jobId];
}
function enemyFor(job, js, c) {
  if (job.special === 'hunting') {
    const region = (job.regions || REGIONS)[combatState(job.id).region || 0];
    if (!region) return null;
    const names = region.enemies || [];
    const pick = names[Math.floor(Math.random()*names.length)];
    return ENEMY_BY_NAME[pick] || null;
  }
  const lvl = c ? masteryLvl(c, job.id) : 1;
  const list = ENEMIES.filter(e => e.type === (job.special === 'blackSoul' ? 'blackSoul' : 'eraSim'));
  const pool = list.filter(e => (e.unlockLevel || 1) <= lvl);
  return pool.length ? pool[pool.length-1] : list[0];
}
function combatTick(jobId, dt) {
  const js = S.jobs[jobId], job = JOB_BY_ID[jobId];
  if (!js.char) return;
  const c = S.chars[js.char];
  if (!c || c.injured) return;
  const cs = combatState(jobId);
  if (!cs.enemy) {
    if (cs.respawn > 0) { cs.respawn -= dt; return; }
    const e = enemyFor(job, js, c);
    if (!e) return;
    cs.enemy = e; cs.ehp = e.hp; cs.tP = 0; cs.tE = 0;
    cs.logs = cs.logs || []; pushCombatLog(cs, '遭遇 ' + e.name);
    return;
  }
  const st = charStats(c);
  // 玩家攻击
  cs.tP += dt;
  const interval = st.interval;
  if (cs.tP >= interval) {
    cs.tP -= interval;
    const atkRating = Math.floor((c.lv.atk + 9) * (st.atk + 64));
    const defRating = Math.floor(((cs.enemy.def || 0) + 9) * 64);
    const hit = atkRating < defRating ? atkRating/(2*defRating) : 1 - defRating/(2*atkRating);
    if (Math.random() < hit) {
      const dmg = Math.max(1, Math.round(st.maxHit * (0.5 + Math.random()*0.5) * (1 - (cs.enemy.dr||0)/100) * huntingBonus(c, job)));
      cs.ehp -= dmg;
      xpGain(c, 'atk', dmg * 0.4); xpGain(c, 'str', dmg * 0.2);
      if (cs.ehp <= 0) { onKill(job, c, cs); return; }
    }
  }
  // 敌人攻击
  cs.tE += dt;
  const eint = cs.enemy.interval || 2.4;
  if (cs.tE >= eint) {
    cs.tE -= eint;
    const eAtk = Math.floor((cs.enemy.atk + 9) * 64), pDef = Math.floor(((c.lv.def) + 9) * 64);
    const hit = eAtk < pDef ? eAtk/(2*pDef) : 1 - pDef/(2*eAtk);
    if (Math.random() < hit) {
      const emh = cs.enemy.maxHit || Math.floor(10*(2.2 + (cs.enemy.str||0)/10));
      let dmg = Math.max(1, Math.round(emh * (0.5 + Math.random()*0.5) * (1 - st.dr/100)));
      c.hpNow = (c.hpNow || st.maxHp) - dmg;
      xpGain(c, 'hp', dmg * 0.133); xpGain(c, 'def', dmg * 0.133);
      if (c.hpNow <= st.maxHp * 0.2) {
        c.hpNow = 1; c.injured = true;
        pushCombatLog(cs, '重伤！' + charName(c) + ' 退出战斗');
        cs.enemy = null; cs.respawn = 8;
        c.jobPaused = job.id;
        log('<b class="red">' + charName(c) + '</b> 在战斗中重伤，需要休养。');
      }
    }
  }
}
function pushCombatLog(cs, msg) {
  cs.logs.unshift({ t: Date.now(), msg });
  if (cs.logs.length > 40) cs.logs.length = 40;
}
function onKill(job, c, cs) {
  const e = cs.enemy;
  S.stats.kills++;
  S.seen.enemies[e.id] = true;
  // 图鉴认知度
  c.know = c.know || {};
  c.know[e.name] = Math.min(100, (c.know[e.name] || 0) + (huntingBonus(c,job) > 1.25 ? 2 : 1));
  (e.loot || []).forEach(l => {
    if (l.name === '随机材料') return; // 模拟纪元另走 materialPool
    if (l.chance !== undefined && Math.random() > l.chance) return;
    const nn = normName(l.name);
    const min = l.min || 1, max = l.max || min;
    const n = min + Math.floor(Math.random() * (max - min + 1));
    if (n > 0) addItem(nn, n);
  });
  if (job.special === 'eraSim') {
    const pool = materialPool();
    for (let i = 0; i < 2; i++) if (pool.length) {
      const pick = weightedPick(pool);
      if (pick) addItem(pick.id, 1);
    }
  }
  xpGain(c, 'str', 8); xpGain(c, 'atk', 6);
  gainMastery(c, job.id, 4);
  pushCombatLog(cs, '击败 ' + e.name);
  cs.enemy = null; cs.respawn = 3;
  cs.defeated = (cs.defeated||0) + 1;
}
function materialPool() {
  const out = [];
  for (const id in ITEMS) {
    const it = ITEMS[id];
    if (!it || it.storage !== 'warehouse') continue;
    if (['material','ore'].includes(it.cat) && it.price > 0 && (S.seen.items[id] || jobUnlockedByTech(it))) {
      out.push({ id, weight: 1 / Math.max(0.5, it.price) });
    }
  }
  return out;
}
function jobUnlockedByTech(it) { return true; }
function xpGain(c, stat, n) {
  c.xp = c.xp || { hp:0, atk:0, str:0, def:0 };
  c.xp[stat] = (c.xp[stat] || 0) + n;
  let lv = c.lv[stat];
  while (lv < 100 && c.xp[stat] >= lvlNeed(lv)) { c.xp[stat] -= lvlNeed(lv); lv++; }
  c.lv[stat] = lv;
}
function lvlNeed(lv) { return Math.floor(60 * Math.pow(lv, 1.4)); }

/* ---------- 商店 ---------- */
function shopPool() {
  const pool = [];
  const era = currentEra();
  const maxEra = eraIndex(era);
  for (const id in ITEMS) {
    const it = ITEMS[id];
    if (!it || it.storage !== 'warehouse') continue;
    if (it.cat === 'equip' || it.cat === 'weapon' || it.cat === 'book') continue;
    if (it.kind === 'shard' || it.kind === 'stardust' || it.kind === 'starPotion') continue;
    if (it.kind === 'soul' || it.kind === 'ember') continue;
    const e = eraIndex(it.era || 'stone');
    if (e > maxEra) continue;
    if (it.era === 'gacha') continue;
    pool.push(id);
  }
  return pool.length ? pool : Object.keys(ITEMS).slice(0, 10);
}
function refreshShop(force) {
  const now = S.playtime;
  if (!force && S.shop.slots.length && now < S.shop.next) return;
  const pool = shopPool();
  const slots = [];
  for (let i = 0; i < 5; i++) {
    const id = pool[Math.floor(Math.random()*pool.length)];
    const it = ITEMS[id];
    let qty = 1 + Math.floor(Math.random() * (it && it.price < 5 ? 40 : 6));
    if (it && it.cat === 'book') qty = 1;
    slots.push({ id, qty, price: Math.max(1, Math.round((it ? it.price : 1) * 3)) });
  }
  // 第 6 格：英雄碎片
  const shard = N2I('英雄碎片') || ensureItemByName('英雄碎片');
  slots.push({ id: shard, qty: 1 + Math.floor(Math.random()*3), price: 2000 });
  S.shop.slots = slots;
  S.shop.next = now + GAME.shopRefresh;
}
function buyShopSlot(i) {
  const s = S.shop.slots[i]; if (!s) return { ok:false };
  let price = s.price * s.qty;
  // 刘 人缘好
  const liu = S.chars.liu;
  let disc = 0;
  if (liu && liu.favor >= 50) disc = liu.favor >= 100 ? 0.3 : 0.15;
  price = Math.ceil(price * (1 - disc));
  if (S.gold < price) return { ok:false, why:'金币不足' };
  if (ITEMS[s.id].storage !== 'granary' && warehouseFull() && !S.items[s.id]) return { ok:false, why:'仓库已满' };
  S.gold -= price;
  if (ITEMS[s.id].storage === 'granary') addFood(s.id, s.qty); else addItem(s.id, s.qty);
  S.shop.slots[i] = null;
  S.seen.items[s.id] = true;
  return { ok:true, price };
}
function sellItem(id, qty) {
  qty = Math.min(qty, S.items[id] || 0);
  if (qty <= 0) return 0;
  removeItem(id, qty);
  const g = Math.floor(sellPrice(id) * qty);
  S.gold += g;
  return g;
}

/* ---------- 抽卡 ---------- */
function gachaPity(poolId) {
  if (!S.gacha.noNew[poolId]) S.gacha.noNew[poolId] = 0;
  return S.gacha.noNew[poolId];
}
function shardCount() { const id = N2I('英雄碎片'); return id ? (S.items[id]||0) : 0; }
function ownsHero(hid) { return !!S.chars[hid]; }
function poolComplete(poolId) { const p = POOL_BY_ID[poolId]; return p.heroes.every(h => ownsHero(h)); }
function pull(poolId) {
  const pool = POOL_BY_ID[poolId]; if (!pool) return { ok:false };
  const shardId = N2I('英雄碎片'); if (!shardId) return { ok:false };
  if ((S.items[shardId]||0) < 20) return { ok:false, why:'英雄碎片不足（需要 20 个）' };
  removeItem(shardId, 20);
  S.gacha.pulls++; S.stats.pulls++;
  const noNew = gachaPity(poolId);
  const needPity = noNew >= 30;
  const isChar = needPity || Math.random() < 0.30;
  if (!isChar) {
    const roll = Math.random() * 100;
    let acc = 0, tier = GIFTS[0];
    for (const g of GIFTS) { acc += g.w; if (roll <= acc) { tier = g; break; } }
    addItem(tier.id, 1);
    S.gacha.noNew[poolId] = noNew + 0;
    return { ok:true, type:'gift', gift: tier };
  }
  // 抽角色
  const owned = pool.heroes.filter(h => ownsHero(h));
  const all = pool.heroes;
  let hid;
  if (needPity) {
    const missing = all.filter(h => !ownsHero(h));
    if (missing.length) hid = missing[Math.floor(Math.random()*missing.length)];
    else { addItem(N2I('星尘') || ensureItemByName('星尘'), 30); S.gacha.noNew[poolId] = 0; return { ok:true, type:'stardust', n:30, pity:true }; }
  } else {
    hid = all[Math.floor(Math.random()*all.length)];
  }
  if (ownsHero(hid)) {
    addItem(N2I('星尘') || ensureItemByName('星尘'), 10);
    S.gacha.noNew[poolId] = needPity ? 0 : noNew + 1;
    return { ok:true, type:'dup', hero: HERO_BY_ID[hid], n:10 };
  }
  // 新角色
  const h = HERO_BY_ID[hid];
  const c = newChar(hid, { name: h.name, kind:'hero', pool: poolId, hp: h.hp, atk: h.atk, str: h.str, def: h.def, stars: 1 });
  c.hpNow = charStats(c).maxHp;
  S.chars[hid] = c;
  S.order.push(hid);
  S.seen.chars[hid] = true;
  S.gacha.noNew[poolId] = 0;
  S.discoveredShard = true;
  log('抽到新角色 <b class="gold">' + h.name + '</b>！');
  return { ok:true, type:'new', hero: h };
}
function giftTo(cid, giftId) {
  const c = S.chars[cid], g = GIFTS.find(x => x.id === giftId);
  if (!c || !g) return false;
  if (c.kind === 'player') return { ok:false, why:'玩家角色不参与好感度' };
  if ((S.items[giftId]||0) < 1) return false;
  removeItem(giftId, 1);
  c.favor = Math.min(100, c.favor + g.favor);
  return { ok:true, favor: c.favor };
}
function starUp(cid) {
  const c = S.chars[cid]; if (!c || c.kind === 'player') return { ok:false, why:'玩家角色不能升星' };
  if (c.stars >= 5) return { ok:false, why:'已满星' };
  const potion = N2I('升星药水'); if (!potion) return { ok:false };
  const need = c.stars; // ★1→2 = 1 瓶 ...
  if ((S.items[potion]||0) < need) return { ok:false, why:'升星药水不足（需要 ' + need + ' 瓶）' };
  removeItem(potion, need);
  c.stars++;
  return { ok:true, stars: c.stars };
}

/* ---------- 被动购买 ---------- */
function affordCost(cost) {
  for (const name in cost) { const id = iid(name); if (!id || (S.items[id]||0) < cost[name]) return false; }
  return true;
}
function payCost(cost) {
  for (const name in cost) { const id = iid(name); if (!id) return false; if ((S.items[id]||0) < cost[name]) return false; }
  for (const name in cost) removeItem(iid(name), cost[name]);
  return true;
}
function costHtml(cost) {
  return Object.entries(cost || {}).map(([n,q]) => {
    const id = iid(n); const have = id ? (S.items[id]||0) : 0;
    return '<span class="' + (have >= q ? 'ok' : 'no') + '">' + n + ' ' + fmt(have) + '/' + fmt(q) + '</span>';
  }).join(' ');
}
function buyHousing() { const t = HOUSING[S.housing]; if (!t) return { ok:false, why:'已到顶' }; if (comfortValue() < (t.comfortReq||0)) return { ok:false, why:'舒适度不足（需要 ' + t.comfortReq + '）' }; if (!payCost(t.cost)) return { ok:false, why:'材料不足' }; S.housing++; return { ok:true }; }
function buyComfort(i) { const t = COMFORT[i]; if (!t || S.comfort[i]) return { ok:false }; if (!payCost(t.cost)) return { ok:false, why:'材料不足' }; S.comfort[i] = true; return { ok:true }; }
function buyFort(i) { const t = FORTS[i]; if (!t || S.forts[i]) return { ok:false }; if (!payCost(t.cost)) return { ok:false, why:'材料不足' }; S.forts[i] = true; return { ok:true }; }
function buyWarehouse() { const t = WH_UPG[S.whUpg]; if (!t) return { ok:false }; if (!payCost(t.cost)) return { ok:false, why:'材料不足' }; S.whUpg++; return { ok:true }; }
function buyGranary() { const t = GR_UPG[S.granary]; if (!t) return { ok:false }; if (!payCost(t.cost)) return { ok:false, why:'材料不足' }; S.granary++; return { ok:true }; }
function researchTech(id) {
  const t = TECHS.find(x => x.id === id); if (!t) return { ok:false };
  if (techDone(id)) return { ok:false, why:'已研究' };
  if (!techAvailable(t)) return { ok:false, why:'前置科技未完成' };
  if (S.research < t.cost) return { ok:false, why:'科研点不足' };
  S.research -= t.cost; S.techs[id] = true;
  log('研究完成 <b class="blue">' + t.name + '</b>');
  return { ok:true };
}
function buyUpgrade(jobId, idx) {
  const job = JOB_BY_ID[jobId], js = S.jobs[jobId], t = job && job.upgrades && job.upgrades[idx];
  if (!t) return { ok:false };
  if (js.up[idx]) return { ok:false, why:'已购买' };
  if (!payCost(t.cost)) return { ok:false, why:'材料不足' };
  js.up[idx] = 1; return { ok:true };
}

/* ---------- 袭击 ---------- */
function wealth() {
  let w = S.gold;
  for (const id in S.items) { const it = ITEMS[id]; if (it) w += (S.items[id]||0) * (it.price||0); }
  return w;
}
function basePower() {
  let p = fortPower();
  onFieldChars().forEach(c => p += charPower(c));
  return Math.round(p);
}
function raidStrength() {
  const era = currentEra(), ei = eraIndex(era);
  const base = ERA_BASE[era] || 800, ref = ERA_WEALTH[era] || 50000;
  const cap = base * 1.5;
  const raw = base * (1 + 0.5 * Math.min(wealth() / ref, 1));
  const prevCap = ei > 0 ? (ERA_BASE[ERA_KEYS[ei-1]] || 0) * 1.5 : 0;
  return Math.round((prevCap + (raw - prevCap) * eraProgress()) * (0.95 + Math.random()*0.1) * (1 - fortReduce()));
}
function doRaid() {
  const strength = raidStrength(), def = basePower();
  S.stats.raids++;
  const out = { strength, defense: def, time: Date.now(), lost: {}, gold: 0, win: strength <= def };
  if (strength <= def) {
    out.win = true;
  } else {
    // 失守：物品与金币各按 10% 被抢
    for (const id in S.items) {
      const it = ITEMS[id]; if (!it) continue;
      if (['book'].includes(it.cat)) { /* 技能书也是物品，照抢 */ }
      const loss = Math.floor((S.items[id]||0) * 0.1);
      if (loss > 0) { removeItem(id, loss); out.lost[id] = loss; }
    }
    out.gold = Math.floor(S.gold * 0.1); S.gold -= out.gold;
    // 工事需修复
    out.repair = true;
  }
  S.raid.last = out;
  log(out.win ? '<b class="green">击退了袭击</b>（强度 ' + fmt(strength) + ' ≤ 战力 ' + fmt(def) + '）'
             : '<b class="red">基地失守</b>（强度 ' + fmt(strength) + ' > 战力 ' + fmt(def) + '），被抢走约 10% 资源。');
  return out;
}

/* ---------- 主循环 ---------- */
function tick(dt) {
  dt = dt || 0.2;
  S.playtime += dt;
  refreshShop(false);
  // 每个上场角色消耗食物
  const chars = onFieldChars();
  const need = chars.length * GAME.foodPerCharSec * dt;
  if (need > 0) consumeFood(need);
  // 工作
  for (const id in S.jobs) {
    const js = S.jobs[id];
    if (!js.char) continue;
    if (!jobVisible(JOB_BY_ID[id])) { js.char = null; continue; }
    produceJob(id, dt);
  }
  // 潜水摸鱼：木易天二人一即使待命也按伐木产出
  const muyi = S.chars.muyi;
  if (muyi && muyi.favor >= 50 && !isAssigned(muyi.cid)) {
    const rate = muyi.favor >= 100 ? 1 : 0.5;
    // 伐木 2 秒 1 木材 的基础产出
    S._muyiAcc = (S._muyiAcc || 0) + dt * rate / 2;
    while (S._muyiAcc >= 1) { S._muyiAcc -= 1; addItem('wood', 1); gainMastery(muyi, 'woodcutting', 1); }
  }
  // 恢复 / 重伤
  chars.forEach(c => {
    const st = charStats(c);
    if (c.hpNow === undefined || c.hpNow === null) c.hpNow = st.maxHp;
    if (c.injured) {
      c.hpNow = Math.min(st.maxHp, c.hpNow + st.maxHp * 0.05 * dt * (healerPresent() ? 3 : 1));
      if (c.hpNow > st.maxHp * 0.5) { c.injured = false; log('<b class="green">' + charName(c) + '</b> 伤愈归队。'); }
    } else {
      c.hpNow = Math.min(st.maxHp, c.hpNow + st.maxHp * 0.05 * dt * (healerPresent() ? 3 : 1));
    }
  });
  // 粮仓腐坏
  granaryDecay(dt);
  // 袭击
  if (S.playtime >= S.raid.next) { S.raid.next = S.playtime + GAME.raidPeriod; doRaid(); }
}
function isAssigned(cid) {
  for (const id in S.jobs) if (S.jobs[id].char === cid) return true;
  return false;
}
function healerPresent() {
  const js = S.jobs.medical || S.jobs.medicine;
  return !!(js && js.char);
}
function consumeFood(n) {
  let left = n;
  const foods = Object.keys(S.items).filter(id => ITEMS[id] && ITEMS[id].storage === 'granary');
  // 先吃熟食（价值高），再吃食材
  foods.sort((a,b) => (ITEMS[b].price||0) - (ITEMS[a].price||0));
  for (const id of foods) {
    if (left <= 0) break;
    const take = Math.min(S.items[id], left);
    if (take > 0) { removeItem(id, take); left -= take; }
  }
  if (left > 0.001) S._hungry = true; else S._hungry = false;
}
function granaryDecay(dt) {
  // 每 60 秒腐坏 1%（半衰期约 40 分钟），堆肥产出
  const rate = Math.pow(0.5, dt / 2400);
  let compost = 0;
  for (const id in S.items) {
    const it = ITEMS[id]; if (!it || it.storage !== 'granary') continue;
    const before = S.items[id];
    const after = before * rate;
    const lost = before - after;
    S.items[id] = after;
    compost += lost * 0.15;
    if (S.items[id] < 0.01) delete S.items[id];
  }
  if (compost >= 0.5) addItem(N2I('堆肥') || ensureItemByName('堆肥'), Math.floor(compost));
}

/* ---------- 存档 ---------- */
function save(quiet) {
  try {
    S.lastSave = Date.now();
    localStorage.setItem(GAME.saveKey, JSON.stringify(S));
    if (!quiet) toast('已保存');
    return true;
  } catch (e) { console.error(e); toast('保存失败：' + e.message); return false; }
}
function load() {
  try {
    const raw = localStorage.getItem(GAME.saveKey);
    if (!raw) return null;
    const st = JSON.parse(raw);
    if (!st || !st.v) return null;
    return migrate(st);
  } catch (e) { console.error(e); return null; }
}
function migrate(st) {
  // 补全缺失字段
  const base = newState(st.name || '无名者');
  const merged = Object.assign(base, st);
  merged.items = st.items || {};
  merged.chars = st.chars || {};
  merged.order = st.order || [];
  merged.jobs = merged.jobs || {};
  JOBS.forEach(j => { if (!merged.jobs[j.id]) merged.jobs[j.id] = { char:null, prog:0, recipe:0, up:[0,0,0,0] }; });
  merged.ui = Object.assign({ page:'warehouse', charSel:null, tab:{} }, st.ui || {});
  merged.gacha = Object.assign({ pity:{}, pulls:0, noNew:{} }, st.gacha || {});
  merged.combat = st.combat || {};
  merged.seen = Object.assign({ items:{}, enemies:{}, chars:{} }, st.seen || {});
  merged.raid = Object.assign({ next: merged.playtime + GAME.raidPeriod, last:null, count:0 }, st.raid || {});
  merged.power = Object.assign({ built:{}, on:{} }, st.power || {});
  return merged;
}
function exportSave() {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); } catch (e) { return ''; }
}
function importSave(str) {
  try {
    const json = decodeURIComponent(escape(atob(str.trim())));
    const st = JSON.parse(json);
    if (!st || !st.v) throw new Error('无效存档');
    localStorage.setItem(GAME.saveKey, JSON.stringify(migrate(st)));
    return true;
  } catch (e) { toast('导入失败：' + e.message); return false; }
}

window.Engine = {
  GAME, HEROES, POOLS, GIFTS, ERA_LIST, ERA_KEYS, ERA_NAME,
  ITEMS, ITEM_ORDER, JOBS, TECHS, ENEMIES, REGIONS, WEAPON_COMBAT, CC,
  HOUSING, COMFORT, FORTS, WH_UPG, GR_UPG, PR,
  get S() { return S; }, set S(v) { S = v; },
  newState, newChar, load, save, exportSave, importSave, migrate,
  fmt, fmtTime, count, addItem, removeItem, itemName, sellPrice, buyPrice, iid, N2I,
  warehouseCap, warehouseUsed, warehouseFull, granaryCap, granaryTotal, addFood,
  currentEra, eraName, eraProgress, techDone, techAvailable, researched, techsDone, researchTech,
  jobUnlocked, jobVisible, unlockedJobs, JOB_BY_ID, JOB_BY_NAME,
  onFieldCap, onFieldChars, isOnField, charPower, gearPower, charStats, charDps, weaponOf,
  masteryOf, masteryLvl, masteryPct, masteryNext, charBonusFor, charName,
  comfortValue, comfortMult, fortPower, fortWatts, fortReduce, powerProduced, powerDemand, powerEfficiency, powerNow,
  jobRecipe, recipeInputs, recipeOutputs, canMake, jobSpeed, jobGate, produceJob, combatState,
  refreshShop, buyShopSlot, sellItem, shopPool,
  gachaPity, shardCount, ownsHero, poolComplete, pull, giftTo, starUp,
  affordCost, payCost, costHtml, buyHousing, buyComfort, buyFort, buyWarehouse, buyGranary, buyUpgrade,
  wealth, basePower, raidStrength, doRaid, tick, log, toast,
  gold: () => S.gold, research: () => S.research,
};
