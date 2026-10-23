/* =========================================================================
   纪元放置 · 引擎层
   数据全部来自 js/data/*.js（由设计文档转写）
   ========================================================================= */
'use strict';

/* ---------- 常量 ---------- */
const APP_VERSION = 'v0.0.25';   // 测试版版本号（0.0.x 阶段）
const GAME = {
  tickMs: 200,
  saveKey: 'eraIdleSave_v1',
  masteryXpMax: 14394,      // 文档：精通 1→100 级累计在岗秒数
  foodPerCharSec: 0.05,     // 每名上场角色每秒消耗的食物份数
  raidPeriod: 7200,         // 袭击间隔（秒）
  shopRefresh: 60,
  weaponDefaultInterval: 2.4,
  mineBaseSec: 3,           // 采矿基础时长：权重 100 的矿石 = 3 秒，其余 = 3×100/权重
  secPerDay: 24,            // 1 天 = 24 秒（1 秒 = 1 小时）：只有按「天」写的数值靠它换算
  offlineMinSec: 60,        // 离开 < 60 秒不结算（交给正常 tick 追 5 秒）
  offlineCapSec: 8 * 3600,  // 离线结算上限 8 小时
  offlineChunkSec: 15,      // 离线生产按 15 秒的时间块推进
};

/* 卡池里的有名英雄：只有 大少 / Laremehpe 两位。
   其余 7 位 retired=true —— 数据保留（旧存档、#黑暗之魂 的门槛、刘的商店折扣仍按 id 查得到），
   但不再进任何卡池、不进图鉴、不可获得。 */
const HEROES = [
  { id:'dashao', name:'大少',           pool:'limited', portrait:'assets/portraits/dashao.jpg', hp:14, atk:6,  str:8,  def:12, job:'医疗',     e1:'模拟纪元',           e2:'模拟纪元+' },
  { id:'lare',   name:'Laremehpe',      pool:'limited', portrait:'assets/portraits/lare.jpg',   hp:8,  atk:10, str:8,  def:8,  job:'科研',     e1:'波浪式地向前进',      e2:'波浪式地向前进+' },
  { id:'yuki',   name:'星见由岐',       pool:null, retired:true, hp:12, atk:10, str:12, def:6,  job:'锻造',     e1:'黑暗之魂',           e2:'黑暗之魂+' },
  { id:'finger', name:'一根手指扣晕你', pool:null, retired:true, hp:4,  atk:12, str:14, def:10, job:'火药制作', e1:'让这个瞬间成为永恒', e2:'让这个瞬间成为永恒+' },
  { id:'chao',   name:'超超',           pool:null, retired:true, hp:10, atk:8,  str:6,  def:16, job:'种植',     e1:'开拓者',             e2:'开拓者+' },
  { id:'juju',   name:'居居',           pool:null, retired:true, hp:6,  atk:6,  str:6,  def:6,  job:'畜牧',     e1:'习惯',               e2:'习惯+' },
  { id:'muyi',   name:'木易天二人一',   pool:null, retired:true, hp:8,  atk:9,  str:10, def:7,  job:'伐木',     e1:'潜水摸鱼',           e2:'潜水摸鱼+' },
  { id:'liu',    name:'刘',             pool:null, retired:true, hp:7,  atk:8,  str:9,  def:10, job:'烹饪',     e1:'人缘好',             e2:'人缘好+' },
  { id:'space',  name:'空白TheSpace',   pool:null, retired:true, hp:12, atk:7,  str:8,  def:9,  job:'切石机',   e1:'搬石',               e2:'搬石+' },
];
/* 只有 2 个池：限定（有名英雄 + 随机普通角色）/ 常驻（只有随机普通角色）。
   namedW = 池内全部有名英雄的权重之和；normalW = 「抽到一个随机普通角色」的权重。
   限定池 10 : 1 → 出角色时 ~90.9% 是有名英雄（每人 45.5%），~9.1% 是全新随机普通角色。 */
const POOLS = [
  { id:'limited',  name:'限定', heroes:['dashao','lare'], normal:true, namedW:10, normalW:1 },
  { id:'standard', name:'常驻', heroes:[],                normal:true, namedW:0,  normalW:1 },
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

/* 袭击数值以 PASSIVE_RULES.raidEra 为唯一数据源，避免引擎和被动表各写一份 */
const ERA_BASE = {}, ERA_WEALTH = {};
(PR.raidEra || []).forEach(r => { ERA_BASE[r.id] = r.base; ERA_WEALTH[r.id] = r.refWealth; });

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

/* ---------- 抽卡常数 / 随机普通角色 ---------- */
const PULL_COST = 10;      // 一次抽卡消耗的英雄碎片
const PITY_MIN = 1;        // 保底阈值起点：连续 1 抽没新角色 → 下一抽必新
const PITY_MAX = 10;       // 每触发一次保底，阈值 +1，封顶 10（每池独立，礼物也累计）
const POTION_STARDUST_COST = 3;   // 升星药水的常驻兑换价
const CODEX_REWARD = { items: 1, enemies: 3, chars: 5 };   // 图鉴首次收录可领的碎片

/* 随机普通角色：随机名字 / 随机初始属性 / 随机工作加成 / 无社交恩赐 / 不进图鉴。
   v0.0.12 起改为【完全无限】：不预生成、不设上限，每次「抽到随机普通角色」时现造一个，
   开除后永久消失，下次抽到的又是新面孔。 */
const NORMAL = {
  sur: ['林','陈','周','许','沈','顾','苏','何','罗','唐','宋','韩','叶','程','陆','温','夏','江','白','严'],
  given: ['子墨','清和','南星','知秋','砚青','小满','听雨','若川','行舟','望舒','星野','一鸣','怀瑾','停云','衔月','拾光','长庚','临川'],
  hp: [6, 12], atk: [5, 11], str: [5, 12], def: [5, 12],
};
function rndInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function normalName() {
  const used = {};
  Object.keys(S.chars).forEach(id => { used[S.chars[id].name] = 1; });
  for (let guard = 0; guard < 400; guard++) {
    const name = NORMAL.sur[rndInt(0, NORMAL.sur.length - 1)] + NORMAL.given[rndInt(0, NORMAL.given.length - 1)];
    if (!used[name]) return name;
  }
  return '无名' + (S.gacha.genSeq || 0);
}
/* 现造一个随机普通角色（不入档，由 pull 决定是否收下） */
function makeNormal() {
  if (!S.gacha) S.gacha = { pity:{}, pulls:0, noNew:{}, genSeq:0 };
  if (!S.gacha.genSeq) S.gacha.genSeq = 0;
  const jobs = JOBS.filter(j => !j.special);
  let id, guard = 0;
  do { S.gacha.genSeq++; id = 'gen' + S.gacha.genSeq; guard++; } while (S.chars[id] && guard < 500);
  return {
    id, gen: true, name: normalName(),
    hp: rndInt(NORMAL.hp[0], NORMAL.hp[1]), atk: rndInt(NORMAL.atk[0], NORMAL.atk[1]),
    str: rndInt(NORMAL.str[0], NORMAL.str[1]), def: rndInt(NORMAL.def[0], NORMAL.def[1]),
    job: jobs.length ? jobs[rndInt(0, jobs.length - 1)].name : null,
    e1: null, e2: null,
  };
}
/* 已拥有的随机普通角色 → 还原成定义（图鉴 / 详情页照着显示） */
function genDef(id) {
  const c = S && S.chars[id];
  if (!c || !c.gen) return null;
  return { id, gen:true, name:c.name, hp:c.lv.hp, atk:c.lv.atk, str:c.lv.str, def:c.lv.def,
    job:c.job, e1:null, e2:null };
}
function heroDef(id) { return HERO_BY_ID[id] || genDef(id) || null; }
function poolMembers(poolId) {
  const p = POOL_BY_ID[poolId]; if (!p) return [];
  return (p.heroes || []).map(id => ({ id, def: HERO_BY_ID[id], gen: false }));
}
/* 图鉴「角色」页用：只统计有名英雄（随机普通角色不进图鉴），退役的不算 */
function poolHeroList() {
  const out = [];
  HEROES.forEach(h => { if (!h.retired) out.push({ id:h.id, def:h, gen:false }); });
  return out;
}

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
    gen: !!opts.gen, job: opts.job || null,
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
    gacha: { pity: {}, pulls: 0, noNew: {}, genSeq: 0 },
    codex: { items: {}, enemies: {}, chars: {} },
    combat: {},
    raid: { next: GAME.raidPeriod, last: null, count: 0 },
    power: { built: {}, on: {} },
    ui: { page: 'warehouse', charSel: null, tab: {} },
    settings: { theme: 'dark' },
    discoveredShard: false,
    log: [],
    stats: { kills:0, raids:0, pulls:0 },
  };
  JOBS.forEach(j => {
    st.jobs[j.id] = { slots: [], prog: [], blocked: [], up: new Array((j.upgrades || []).length).fill(0), upVer: 2 };
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
function buyPrice(id) { const it = ITEMS[id]; if (!it) return 0; return Math.max(1, Math.round(it.buy || it.price * 3)); }
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
  if (j.hidden) return false;   // v0.0.13：随黑暗之魂线整体隐藏的工作
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
/* 可上场人数：初始 5，每建成一档取该档 cap；住满 6 档 = 18 */
function onFieldCap() {
  if (!S.housing) return 5;
  const t = HOUSING[Math.min(S.housing, HOUSING.length) - 1];
  return Math.min(t ? t.cap : 18, 18);
}
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
  const cur = Math.pow(lv / 100, 2) * GAME.masteryXpMax;
  const need = Math.pow((lv + 1) / 100, 2) * GAME.masteryXpMax;
  return clamp((masteryOf(c,jobId).xp - cur) / (need - cur), 0, 1);
}
function charBonusFor(c, job) {
  if (!c || c.kind === 'player') return 0;
  const h = HERO_BY_ID[c.cid];
  const jobName = h ? h.job : c.job;      // 随机普通角色的工作加成记在角色本身
  if (jobName !== job.name) return 0;
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
  if (pj && assignedCount(JOB_BY_ID.power) > 0) p += 10;   // 电力工作：2 木材 / 3 秒 → 10 瓦
  return p;
}
function powerDemand() {
  let d = 0;
  for (const id in S.jobs) {
    const js = S.jobs[id];
    if (!js.slots || !js.slots.some(Boolean)) continue;
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
/* 采矿：每种矿石一条配方，各自按科技解锁；时长与权重成反比（权重 100 = 基础 3 秒） */
function miningRecipes(job) {
  return (job.ores || []).map(o => ({
    name: o.name,
    outputs: { [o.name]: 1 },
    inputs: {},
    era: job.era,
    tech: o.tech || null,
    weight: o.weight,
    duration: Math.round((GAME.mineBaseSec * 100 / (o.weight || 1)) * 10) / 10,
  }));
}
/* 装备制造：三份工作按「主材料」分 85 件；配方直接由物品表造价生成，避免两处维护。 */
const TAILORING_ITEMS = new Set([
  '布帽', '布衬衣', '布衬裤', '羊毛袜', '银项链',
  '棉帽', '棉衬衣', '棉衬裤', '棉袜',
  '战术内衬', '战术内衬裤', '恒温内衬', '恒温袜',
  '超织物头套', '超织物内衬', '超织物护腿', '超织物袜',
]);
const EQUIP_RECIPE_CACHE = {};
function equipmentJobId(it) {
  if (it.era === 'stone') return 'crafting';
  if (it.name === '长弓' || it.name === '弩') return 'crafting';
  return TAILORING_ITEMS.has(it.name) ? 'tailoring' : 'forging';
}
function equipmentRecipes(job) {
  if (EQUIP_RECIPE_CACHE[job.id]) return EQUIP_RECIPE_CACHE[job.id];
  const list = [];
  for (const id of ITEM_ORDER) {
    const it = ITEMS[id];
    if (!it || (it.cat !== 'equip' && it.cat !== 'weapon') || !it.cost) continue;
    if (it.cost.soul || it.cost.ember) continue;          // 黑魂套是抽卡掉落，不走制造
    if (equipmentJobId(it) !== job.id) continue;
    const inputs = {};
    for (const cid in it.cost) inputs[itemName(cid)] = it.cost[cid];
    let unlockTech = null;
    if (it.name === '长弓') unlockTech = '缝制';
    if (it.name === '弩') unlockTech = '金属冶炼';
    list.push({
      name: it.name, inputs, outputs: { [it.name]: 1 },
      era: it.era, unlockTech, duration: job.duration || 3,
    });
  }
  EQUIP_RECIPE_CACHE[job.id] = list;
  return list;
}
function jobRecipes(job) {
  if (job.special === 'mining') return miningRecipes(job);
  if (job.equipment) return equipmentRecipes(job);
  if (job.recipes && job.recipes.length) return job.recipes;
  return [{ name: job.name, inputs: job.inputs || {}, outputs: job.outputs || {}, era: job.era, duration: job.duration || 2 }];
}
function jobRecipe(job, idx) { const l = jobRecipes(job); return l[clamp(idx, 0, l.length - 1)]; }
function recipeVisible(r) {
  if (!r) return true;
  const tech = r.unlockTech || r.tech;
  return !tech || researched(tech);
}
function recipeDuration(job, r) { return (r && r.duration) || job.duration || 2; }
function ensureSlots(js, n) {
  if (!Array.isArray(js.slots)) js.slots = [];
  if (!Array.isArray(js.prog)) js.prog = [];
  if (!Array.isArray(js.blocked)) js.blocked = [];
  while (js.slots.length < n) js.slots.push(null);
  while (js.prog.length < n) js.prog.push(0);
  while (js.blocked.length < n) js.blocked.push(null);
}
function slotChar(js, i) { const id = js.slots && js.slots[i]; return id ? S.chars[id] : null; }
function assignedCount(job) {
  if (!job) return 0;
  const js = S.jobs[job.id];
  if (!js || !js.slots) return 0;
  const rs = jobRecipes(job);
  return js.slots.filter((id, i) => id && S.chars[id] && recipeVisible(rs[i])).length;
}
function isWorking(cid) {
  for (const id in S.jobs) {
    const js = S.jobs[id];
    if (js.slots && js.slots.some(x => x === cid)) return true;
  }
  return false;
}
function assignSlot(jobId, slotIdx, cid) {
  const job = JOB_BY_ID[jobId];
  if (!job) return false;
  for (const id in S.jobs) {
    const j = S.jobs[id];
    if (j.slots) j.slots = j.slots.map(x => (x === cid ? null : x));
  }
  ensureSlots(S.jobs[jobId], Math.max(1, jobRecipes(job).length));
  S.jobs[jobId].slots[slotIdx] = cid;
  S.jobs[jobId].prog[slotIdx] = 0;
  return true;
}
function clearSlot(jobId, slotIdx) {
  const js = S.jobs[jobId];
  if (!js || !js.slots) return;
  js.slots[slotIdx] = null;
  if (js.prog) js.prog[slotIdx] = 0;
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
/* 需求行的实际可用量：通用分类（素食食材 / 肉食食材 / 种子）按组成物品合计，
   其余按物品 id 取库存；名字不认识时返回 0（宁可标缺料，也不假装充足）。 */
function stockOf(name) {
  if (GENERIC_IN[name]) return genericCount(name);
  const id = iid(normName(name));
  return id ? (S.items[id] || 0) : 0;
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
function jobSpeed(jobId, slotIdx) {
  const js = S.jobs[jobId], job = JOB_BY_ID[jobId], c = slotChar(js, slotIdx || 0);
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
  if (!jobVisible(job)) return;
  const rs = jobRecipes(job);
  ensureSlots(js, rs.length);
  for (let i = 0; i < rs.length; i++) {
    const r = rs[i];
    const cid = js.slots[i];
    if (!cid) { js.prog[i] = 0; js.blocked[i] = null; continue; }
    const c = S.chars[cid];
    if (!c) { js.slots[i] = null; continue; }
    if (!recipeVisible(r)) { js.slots[i] = null; js.prog[i] = 0; continue; }
    if (c.injured) { js.blocked[i] = 'injury'; continue; }
    const ins = r.inputs || {};
    const rawOuts = r.outputs || {};
    if (Object.keys(ins).length && !canMake(r)) { js.blocked[i] = 'input'; continue; }
    js.blocked[i] = null;
    const speed = jobSpeed(jobId, i);
    const dur = Math.max(0.4, recipeDuration(job, r)) / speed;
    js.prog[i] = (js.prog[i] || 0) + dt / dur;
    while (js.prog[i] >= 1) {
      js.prog[i] -= 1;
      if (Object.keys(ins).length && !canMake(r)) { js.prog[i] = 0; js.blocked[i] = 'input'; break; }
      if (!consumeInputs(r)) { js.prog[i] = 0; js.blocked[i] = 'input'; break; }
      if (job.special === 'power') {
        // 电力的产出由 powerProduced() 统一结算（10 瓦），这里只消耗燃料
        gainMastery(c, jobId, recipeDuration(job, r)); js.done = (js.done||0) + 1; continue;
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
      gainMastery(c, jobId, recipeDuration(job, r));
      js.done = (js.done||0) + 1;
    }
  }
}
function jobGate(jobId) {
  const job = JOB_BY_ID[jobId];
  if (!job) return { ok:false, why:'未知工作' };
  if (!jobVisible(job)) return { ok:false, why:'未解锁' };
  if (assignedCount(job) <= 0) return { ok:false, why:'未入驻' };
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
  ensureSlots(js, 1);
  const cid = js.slots[0];
  if (!cid) return;
  const c = S.chars[cid];
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
    if (!it || it.hidden) continue;
    if (it.storage !== 'warehouse') continue;
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
/* 保底阈值：第一次触发前 = 1，每触发一次保底 +1，封顶 10（分池独立） */
function gachaPityLimit(poolId) {
  const n = (S.gacha.pity && S.gacha.pity[poolId]) || 0;
  return Math.min(PITY_MAX, PITY_MIN + n);
}
function bumpGachaPity(poolId) {
  if (!S.gacha.pity) S.gacha.pity = {};
  S.gacha.pity[poolId] = Math.min(PITY_MAX, (S.gacha.pity[poolId] || 0) + 1);
}
function shardCount() { const id = N2I('英雄碎片'); return id ? (S.items[id]||0) : 0; }
function ownsHero(hid) { return !!S.chars[hid]; }
/* 「池子集齐」只对有名英雄有意义（随机普通角色是无限池，永远集不齐） */
function poolComplete(poolId) { return (POOL_BY_ID[poolId].heroes || []).every(ownsHero); }
function pull(poolId) {
  const pool = POOL_BY_ID[poolId]; if (!pool) return { ok:false, why:'没有这个卡池' };
  const shardId = N2I('英雄碎片'); if (!shardId) return { ok:false };
  if ((S.items[shardId]||0) < PULL_COST) return { ok:false, why:'英雄碎片不足（需要 ' + PULL_COST + ' 个）' };
  removeItem(shardId, PULL_COST);
  S.gacha.pulls++; S.stats.pulls++;
  const noNew = gachaPity(poolId);
  const needPity = noNew >= gachaPityLimit(poolId);
  const isChar = needPity || Math.random() < 0.30;
  if (!isChar) {
    const roll = Math.random() * 100;
    let acc = 0, tier = GIFTS[0];
    for (const g of GIFTS) { acc += g.w; if (roll <= acc) { tier = g; break; } }
    addItem(tier.id, 1);
    S.gacha.noNew[poolId] = noNew + 1;   // 礼物也算「这一抽没出新角色」
    return { ok:true, type:'gift', gift: tier };
  }
  // 抽角色：先掷「有名英雄 or 全新随机普通角色」
  const named = (pool.heroes || []).map(id => HERO_BY_ID[id]).filter(Boolean);
  const missing = named.filter(h => !ownsHero(h.id));
  let hero = null;
  if (needPity) {
    // 保底：优先补该池还没拥有的有名英雄；没有的话就现造一个全新随机普通角色
    if (missing.length) hero = missing[rndInt(0, missing.length - 1)];
  } else if (named.length) {
    const wNamed = pool.namedW || 0;
    const wNormal = pool.normal === false ? 0 : (pool.normalW || 1);
    if (wNamed > 0 && Math.random() * (wNamed + wNormal) <= wNamed) {
      // 有名英雄内部等权（每人 namedW / 人数）
      hero = named[rndInt(0, named.length - 1)];
    }
  }
  if (hero) {
    const hid = hero.id;
    if (ownsHero(hid)) {
      addItem(N2I('星尘') || ensureItemByName('星尘'), 10);
      S.gacha.noNew[poolId] = needPity ? 0 : noNew + 1;
      return { ok:true, type:'dup', hero, gen:false, n:10 };
    }
    const c = newChar(hid, { name: hero.name, kind:'hero', pool: poolId, gen:false, job: hero.job,
      hp: hero.hp, atk: hero.atk, str: hero.str, def: hero.def, stars: 1 });
    c.hpNow = charStats(c).maxHp;
    S.chars[hid] = c; S.order.push(hid);
    S.seen.chars[hid] = true;
    if (needPity) bumpGachaPity(poolId);
    S.gacha.noNew[poolId] = 0;
    S.discoveredShard = true;
    log('抽到新角色 <b class="gold">' + hero.name + '</b>！');
    return { ok:true, type:'new', hero, gen:false };
  }
  // 全新随机普通角色：每次现造一个（不预生成、不进图鉴、可开除）
  const h = makeNormal();
  const c = newChar(h.id, { name: h.name, kind:'hero', pool: poolId, gen:true, job: h.job,
    hp: h.hp, atk: h.atk, str: h.str, def: h.def, stars: 1 });
  c.hpNow = charStats(c).maxHp;
  S.chars[h.id] = c; S.order.push(h.id);
  if (needPity) bumpGachaPity(poolId);
  S.gacha.noNew[poolId] = 0;
  S.discoveredShard = true;
  log('一名随机普通角色加入了：<b class="gold">' + h.name + '</b>');
  return { ok:true, type:'new', hero: h, gen:true };
}
/* 开除随机普通角色：永久移除，装备全部退回仓库，并从所有岗位上撤下 */
function dismissChar(cid) {
  const c = S.chars[cid];
  if (!c) return { ok:false, why:'角色不存在' };
  if (!c.gen) return { ok:false, why:'只有随机普通角色可以开除' };
  let eqN = 0;
  for (const slot in c.eq) {
    const id = c.eq[slot];
    if (id) { addItem(id, 1); c.eq[slot] = null; eqN++; }
  }
  for (const id in S.jobs) {
    const js = S.jobs[id];
    if (js.slots) js.slots = js.slots.map(x => (x === cid ? null : x));
  }
  const nm = charName(c);
  delete S.chars[cid];
  S.order = S.order.filter(x => x !== cid);
  if (S.seen.chars) delete S.seen.chars[cid];
  if (S.ui && S.ui.charSel === cid) S.ui.charSel = S.order[0] || null;
  log('开除了 <b class="gold">' + nm + '</b>，归还装备 ' + eqN + ' 件');
  return { ok:true, n: eqN, name: nm };
}

/* ---------- 图鉴收集奖励（英雄碎片） ---------- */
function codexSeen(kind, id) {
  if (kind === 'chars') return id !== 'player' && !!(S.seen.chars && S.seen.chars[id]);
  return !!(S.seen[kind] && S.seen[kind][id]);
}
function codexClaimed(kind, id) { return !!(S.codex && S.codex[kind] && S.codex[kind][id]); }
function codexClaimable(kind, id) { return codexSeen(kind, id) && !codexClaimed(kind, id); }
function codexClaim(kind, id) {
  if (!codexClaimable(kind, id)) return { ok:false, why:'没有可领取的奖励' };
  if (!S.codex) S.codex = { items:{}, enemies:{}, chars:{} };
  if (!S.codex[kind]) S.codex[kind] = {};
  const n = CODEX_REWARD[kind] || 0;
  S.codex[kind][id] = true;
  addItem(N2I('英雄碎片') || ensureItemByName('英雄碎片'), n);
  S.discoveredShard = true;
  return { ok:true, n };
}
function codexUnclaimed() {
  let items = 0, enemies = 0, chars = 0;
  for (const id in ITEMS) if (!ITEMS[id].hidden && codexClaimable('items', id)) items++;
  ENEMIES.forEach(e => { if (!e.hidden && codexClaimable('enemies', e.id)) enemies++; });
  poolHeroList().forEach(x => { if (codexClaimable('chars', x.id)) chars++; });
  return {
    items, enemies, chars, total: items + enemies + chars,
    shards: items * CODEX_REWARD.items + enemies * CODEX_REWARD.enemies + chars * CODEX_REWARD.chars,
  };
}
function codexClaimAll() {
  let count = 0, n = 0;
  for (const id in ITEMS) { if (ITEMS[id].hidden) continue; const r = codexClaim('items', id); if (r.ok) { count++; n += r.n; } }
  ENEMIES.forEach(e => { if (e.hidden) return; const r = codexClaim('enemies', e.id); if (r.ok) { count++; n += r.n; } });
  poolHeroList().forEach(x => { const r = codexClaim('chars', x.id); if (r.ok) { count++; n += r.n; } });
  return { ok: count > 0, count, n };
}
function giftTo(cid, giftId) {
  const c = S.chars[cid], g = GIFTS.find(x => x.id === giftId);
  if (!c || !g) return false;
  if (c.kind === 'player') return { ok:false, why:'玩家角色不参与好感度' };
  if (c.gen) return { ok:false, why:'随机普通角色没有社交恩赐，不收礼物' };
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
function buyHousing() { const t = HOUSING[S.housing]; if (!t) return { ok:false, why:'已到顶' }; if (!payCost(t.cost)) return { ok:false, why:'材料不足' }; S.housing++; return { ok:true }; }
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
  if (!Array.isArray(js.up)) js.up = [];
  if (js.up[idx]) return { ok:false, why:'已购买' };
  if (t.tech && !researched(t.tech)) return { ok:false, why:'未解锁' };
  if (t.req != null && !js.up[t.req]) return { ok:false, why:'需先购买上一档' };
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
  const base = ERA_BASE[era] || 80, ref = ERA_WEALTH[era] || 50000;
  const capMul = PR.raidCapMul || 1.5;
  const wealthScale = PR.raidWealthScale || 0.5;
  const raw = base * (1 + wealthScale * Math.min(wealth() / ref, 1));
  const prevCap = ei > 0 ? (ERA_BASE[ERA_KEYS[ei-1]] || 0) * capMul : 0;
  const interp = prevCap + (raw - prevCap) * eraProgress();
  const rMin = PR.raidRandomMin || 0.95, rMax = PR.raidRandomMax || 1.05;
  return Math.round(interp * (rMin + Math.random() * (rMax - rMin)) * (1 - fortReduce()));
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

/* ---------- 离线结算 ----------
   口径来自 design/战斗系统.md「九、离线结算」：在线逐帧，离线用期望值。
   · 时长 = min(现实离开秒数, 8 小时)；低于 60 秒不结算（正常 tick 追平）
   · 非战斗工作：按 15 秒时间块推进（含食物消耗 / 粮仓腐坏 / 回血 / 潜水摸鱼）
   · 战斗工作（狩猎 / 黑暗之魂 / 模拟纪元）：不做逐回合模拟，按
     「期望击杀时长 → 击杀数 × 单杀掉落」一次算完，O(1)
   · 袭击：离线期间每 2 小时判定照常补算
   返回结算报告，app.js 用它弹「离线收益」框。 */
function offlineRegenPctPerSec() {
  const pct = healerPresent()
    ? (CC.healerRegenPctPerDay || 15) : (CC.naturalRegenPctPerDay || 5);
  return pct / 100 / GAME.secPerDay;
}
/* 期望数量 → 整数：整数部分照给，小数部分按概率补 1，保证多次结算不丢期望 */
function offlineRound(v) {
  if (!(v > 0)) return 0;
  const whole = Math.floor(v);
  return whole + (Math.random() < v - whole ? 1 : 0);
}
function offlineCombatChars() {
  const set = {};
  JOBS.forEach(j => {
    if (j.special !== 'hunting' && j.special !== 'blackSoul' && j.special !== 'eraSim') return;
    const js = S.jobs[j.id];
    if (!js || !js.slots) return;
    js.slots.forEach(id => { if (id && S.chars[id]) set[id] = 1; });
  });
  return set;
}
function offlineEnemies(job, c) {
  if (job.special === 'hunting') {
    const region = (job.regions || REGIONS)[combatState(job.id).region || 0];
    const names = (region && region.enemies) || [];
    return names.map(n => ENEMY_BY_NAME[n]).filter(Boolean);
  }
  const lvl = c ? masteryLvl(c, job.id) : 1;
  const list = ENEMIES.filter(e => e.type === (job.special === 'blackSoul' ? 'blackSoul' : 'eraSim'));
  const pool = list.filter(e => (e.unlockLevel || 1) <= lvl);
  if (pool.length) return [pool[pool.length - 1]];
  return list.length ? [list[0]] : [];
}
/* 单场对决的期望：击杀时长 / 被打进重伤的时长 / 获胜概率 / 单杀挨的伤害 */
function offlineFight(c, e) {
  const st = charStats(c);
  const dps = Math.max(0.001, charDps(c, e));
  // 一次攻击间隔内最多打掉一只：再弱的怪也要等下一次挥击（同在线 combatTick）
  const tKill = Math.max(st.interval || 2.4, e.hp / dps);
  const eAtk = Math.floor((e.atk + 9) * 64);
  const pDef = Math.floor((c.lv.def + 9) * 64);
  const eHit = eAtk < pDef ? eAtk / (2 * pDef) : 1 - pDef / (2 * eAtk);
  const eMaxHit = e.maxHit || Math.floor(10 * (2.2 + (e.str || 0) / 10));
  const eDps = eHit * ((eMaxHit + 1) / 2) * (1 - Math.min(80, st.dr) / 100) / (e.interval || 2.4);
  const floor = st.maxHp * 0.2;
  const tInjure = Math.max(0.01, ((c.hpNow || st.maxHp) - floor) / Math.max(0.001, eDps));
  // 胜率：能在被打进重伤前击杀掉这一只的比例；1 = 稳赢（design §九「× 胜率」）
  const pWin = tKill <= tInjure ? 1 : Math.max(0, tInjure / tKill);
  // 单杀挨的伤害 = 敌人 DPS × 战斗时长（3 秒刷新期间回血另算）
  const dmg = eDps * Math.min(tKill, tInjure);
  return { e, dps, tKill, tInjure, pWin, dmg, win: pWin >= 1 };
}
function offlineLoot(e) {
  const out = {};
  (e.loot || []).forEach(l => {
    if (l.name === '随机材料') return;
    const p = l.chance === undefined ? 1 : l.chance;
    const min = l.min || 1, max = l.max || min;
    const id = iid(normName(l.name));
    if (!id) return;
    out[id] = (out[id] || 0) + p * ((min + max) / 2);
  });
  return out;
}
function offlineCombat(jobId, sec, rep) {
  const job = JOB_BY_ID[jobId], js = S.jobs[jobId];
  if (!job || !js || !js.slots || !js.slots.some(Boolean)) return;
  if (!jobVisible(job)) return;
  const c = S.chars[js.slots[0]];
  if (!c) return;
  const st = charStats(c);
  if (c.hpNow === undefined || c.hpNow === null) c.hpNow = st.maxHp;
  const regen = offlineRegenPctPerSec();
  let time = sec;
  // 出发时重伤：先扣掉养伤时间，养好才继续打
  if (c.injured) {
    const healSec = Math.max(0, st.maxHp * 0.5 - c.hpNow) / Math.max(1e-6, st.maxHp * regen);
    if (healSec >= time) {
      c.hpNow = Math.min(st.maxHp, c.hpNow + st.maxHp * regen * time);
      rep.stats.injuredTime += time;
      return;
    }
    time -= healSec; c.hpNow = st.maxHp * 0.5; c.injured = false;
    rep.stats.injuredTime += healSec;
  }
  const enemies = offlineEnemies(job, c);
  if (!enemies.length) return;
  const fights = enemies.map(e => offlineFight(c, e));
  const n = fights.length;
  const bonus = huntingBonus(c, job);
  const regenRate = st.maxHp * regen;
  // 各敌人均分离线时间：平均每秒的击杀数与挨打伤害（= 在线随机遭遇的期望）
  let killRate = 0, dmgRate = 0, unwinnable = false;
  fights.forEach(f => {
    const r = f.pWin / (f.tKill + 3);
    killRate += r / n;
    dmgRate += r * f.dmg / n;
    if (f.pWin < 1) unwinnable = true;
  });
  // 连续作战会掉血：挨打速度超过自然恢复时，算能撑多久（同在线受伤逻辑）
  let lost = unwinnable, battleTime = time;
  if (dmgRate > regenRate) {
    const budget = Math.max(0, (c.hpNow || st.maxHp) - st.maxHp * 0.2);
    const survive = budget / (dmgRate - regenRate);
    if (survive < battleTime) { battleTime = survive; lost = true; }
  }
  const scale = time > 0 ? Math.max(0, battleTime / time) : 0;
  let kills = 0, dealt = 0;
  fights.forEach(f => {
    const k = (time / n) * (f.pWin / (f.tKill + 3)) * scale;   // 3 秒刷下一只（同在线）
    if (k <= 0) return;
    kills += k; dealt += k * f.e.hp;
    S.seen.enemies[f.e.id] = true;
    c.know = c.know || {};
    const per = bonus > 1.25 ? 2 : 1;
    c.know[f.e.name] = Math.min(100, (c.know[f.e.name] || 0) + per * k);
    const loot = offlineLoot(f.e);
    for (const id in loot) {
      const n2 = offlineRound(loot[id] * k);
      if (n2 > 0) addItem(id, n2);
    }
  });
  if (job.special === 'eraSim' && kills > 0) {
    // 模拟纪元每杀再随机给 2 份材料：按 materialPool 的权重补期望值
    const pool = materialPool();
    const total = pool.reduce((a, b) => a + b.weight, 0);
    if (total > 0) pool.forEach(it => {
      const n = offlineRound(kills * 2 * it.weight / total);
      if (n > 0) addItem(it.id, n);
    });
  }
  if (kills > 0) {
    S.stats.kills += Math.round(kills);
    gainMastery(c, job.id, 4 * kills);
    xpGain(c, 'str', 8 * kills);
    xpGain(c, 'atk', 6 * kills);
    xpGain(c, 'atk', dealt * 0.4);            // 在线是每次命中给：atk 0.4×伤害
    xpGain(c, 'str', dealt * 0.2);
  }
  if (lost) {
    // 打不过 / 被持续消耗打穿 → 重伤（design/战斗系统.md §八）；产出只保留打赢的部分
    c.injured = true;
    c.hpNow = 1;
    c.jobPaused = job.id;
  } else {
    // 全程撑住：血量按「自然恢复 − 挨打」的净速率走，不会凭空受伤
    const net = regenRate - dmgRate;
    c.hpNow = Math.max(1, Math.min(st.maxHp, (c.hpNow || st.maxHp) + net * time));
  }
  rep.kills += kills;
  rep.stats.battles++;
  const cs = S.combat[jobId];
  if (cs) { cs.enemy = null; cs.respawn = 0; cs.tP = 0; cs.tE = 0; }
}
/* 15 秒的生产块：与 tick() 同序，只是不跑战斗与袭击 */
function offlineChunk(dt, combatChars) {
  const chars = onFieldChars();
  const need = chars.length * GAME.foodPerCharSec * dt;
  if (need > 0) consumeFood(need);
  for (const id in S.jobs) {
    const js = S.jobs[id];
    if (!js.slots || !js.slots.some(Boolean)) continue;
    const job = JOB_BY_ID[id];
    if (!job) continue;
    if (!jobVisible(job)) { js.slots = js.slots.map(() => null); continue; }
    if (job.special === 'hunting' || job.special === 'blackSoul' || job.special === 'eraSim') continue;
    produceJob(id, dt);
  }
  // 潜水摸鱼：木易天二人一待命也按伐木产出
  const muyi = S.chars.muyi;
  if (muyi && muyi.favor >= 50 && !isWorking(muyi.cid)) {
    const rate = muyi.favor >= 100 ? 1 : 0.5;
    S._muyiAcc = (S._muyiAcc || 0) + dt * rate / 2;
    while (S._muyiAcc >= 1) { S._muyiAcc -= 1; addItem('wood', 1); gainMastery(muyi, 'woodcutting', 1); }
  }
  // 回血 / 重伤解除（战斗岗角色的血量由 offlineCombat 单独结算）
  const regen = offlineRegenPctPerSec();
  chars.forEach(c => {
    if (combatChars[c.cid]) return;
    const st = charStats(c);
    if (c.hpNow === undefined || c.hpNow === null) c.hpNow = st.maxHp;
    c.hpNow = Math.min(st.maxHp, c.hpNow + st.maxHp * regen * dt);
    if (c.injured && c.hpNow > st.maxHp * 0.5) { c.injured = false; log('<b class="green">' + charName(c) + '</b> 伤愈归队。'); }
  });
  granaryDecay(dt);
}
/* 主入口：传现实离开秒数，返回结算报告；不足 60 秒返回 null（交给正常 tick）*/
function settleOffline(awaySec) {
  if (!S) return null;
  awaySec = Number(awaySec);
  if (!isFinite(awaySec) || awaySec <= 0) return null;
  const used = Math.min(awaySec, GAME.offlineCapSec);
  if (used < GAME.offlineMinSec) return null;
  const before = {
    items: Object.assign({}, S.items),
    gold: S.gold, research: S.research,
    food: granaryTotal(), kills: S.stats.kills,
    injured: Object.keys(S.chars).filter(id => S.chars[id].injured),
  };
  const rep = {
    away: awaySec, used, capped: awaySec > used + 1,
    gained: [], spent: [], gold: 0, research: 0, kills: 0,
    injured: [], raids: [], mastery: [],
    food: { before: before.food, after: before.food },
    stats: { battles: 0, injuredTime: 0 },
  };
  // 精通快照：结算后对比出「谁在哪项工作上从几级升到几级」
  const mBefore = {};
  Object.keys(S.jobs).forEach(jobId => {
    (S.jobs[jobId].slots || []).forEach(cid => {
      if (!cid || !S.chars[cid]) return;
      mBefore[cid + '|' + jobId] = masteryLvl(S.chars[cid], jobId);
    });
  });
  if (S.chars.muyi && S.chars.muyi.favor >= 50) mBefore['muyi|woodcutting'] = masteryLvl(S.chars.muyi, 'woodcutting');
  const combatChars = offlineCombatChars();
  // 1) 生产 / 食物 / 腐坏 / 回血
  let left = used;
  while (left > 0.001) {
    const dt = Math.min(GAME.offlineChunkSec, left);
    S.playtime += dt;
    offlineChunk(dt, combatChars);
    left -= dt;
  }
  // 2) 战斗：期望值一次算完（狩猎按区域里每种怪均分时间）
  JOBS.forEach(j => {
    if (j.special === 'hunting' || j.special === 'blackSoul' || j.special === 'eraSim') offlineCombat(j.id, used, rep);
  });
  // 3) 袭击：离线期间每 2 小时的判定补算（最多 12 次，防止旧存档连环打）
  let guard = 0;
  while (S.playtime >= S.raid.next && guard < 12) {
    const out = doRaid();
    rep.raids.push({ win: out.win, strength: out.strength, defense: out.defense });
    S.raid.next += GAME.raidPeriod;
    guard++;
  }
  if (guard >= 12) S.raid.next = S.playtime + GAME.raidPeriod;
  // 4) 汇总差值
  const ids = {};
  Object.keys(before.items).forEach(id => { ids[id] = 1; });
  Object.keys(S.items).forEach(id => { ids[id] = 1; });
  for (const id in ids) {
    const d = (S.items[id] || 0) - (before.items[id] || 0);
    if (d >= 1) rep.gained.push({ id, n: Math.floor(d) });
    else if (d <= -1) rep.spent.push({ id, n: Math.floor(-d) });
  }
  const worth = x => (ITEMS[x.id] ? (ITEMS[x.id].price || 0) : 0) * x.n;
  rep.gained.sort((a, b) => worth(b) - worth(a));
  rep.spent.sort((a, b) => worth(b) - worth(a));
  rep.gold = Math.round(S.gold - before.gold);
  rep.research = S.research - before.research;
  rep.kills = Math.round(S.stats.kills - before.kills);
  rep.food.after = granaryTotal();
  Object.keys(S.chars).forEach(id => {
    if (S.chars[id].injured && before.injured.indexOf(id) < 0) rep.injured.push(charName(S.chars[id]));
  });
  // 精通升级：只列真的升了级的（没有巧合，等级由 XP 决定）
  Object.keys(mBefore).forEach(key => {
    const at = key.indexOf('|');
    const cid = key.slice(0, at), jobId = key.slice(at + 1);
    const c = S.chars[cid];
    if (!c) return;
    const to = masteryLvl(c, jobId);
    if (to > mBefore[key]) rep.mastery.push({
      char: charName(c),
      job: (JOB_BY_ID[jobId] || {}).name || jobId,
      from: mBefore[key], to,
    });
  });
  rep.mastery.sort((a, b) => (b.to - b.from) - (a.to - a.from));
  log('离线 <b>' + fmtTime(used) + '</b> 结算：' + rep.gained.length + ' 种物品 · ' +
      (rep.kills > 0 ? '击杀 ' + fmt(rep.kills) + ' · ' : '') +
      (rep.mastery.length ? '精通 ' + rep.mastery.length + ' 项 · ' : '') +
      '袭击 ' + rep.raids.length + ' 次');
  return rep;
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
    if (!js.slots || !js.slots.some(Boolean)) continue;
    if (!jobVisible(JOB_BY_ID[id])) { js.slots = js.slots.map(() => null); continue; }
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
  // 恢复 / 重伤：1 天 = 24 秒；自然 5%/天，有医疗角色 15%/天（数值来自 CC 的 /天 字段）
  const regenPctPerDay = healerPresent()
    ? (CC.healerRegenPctPerDay || 15) : (CC.naturalRegenPctPerDay || 5);
  const regenPctPerSec = regenPctPerDay / 100 / GAME.secPerDay;
  chars.forEach(c => {
    const st = charStats(c);
    if (c.hpNow === undefined || c.hpNow === null) c.hpNow = st.maxHp;
    c.hpNow = Math.min(st.maxHp, c.hpNow + st.maxHp * regenPctPerSec * dt);
    if (c.injured && c.hpNow > st.maxHp * 0.5) { c.injured = false; log('<b class="green">' + charName(c) + '</b> 伤愈归队。'); }
  });
  // 粮仓腐坏
  granaryDecay(dt);
  // 袭击
  if (S.playtime >= S.raid.next) { S.raid.next = S.playtime + GAME.raidPeriod; doRaid(); }
}
function isAssigned(cid) { return isWorking(cid); }
function healerPresent() {
  const js = S.jobs.medical || S.jobs.medicine;
  if (!js || !js.slots) return false;
  return js.slots.some(id => id && S.chars[id]);
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
/* v0.0.23：伐木 / 采矿的工具档从「三选一」改成链式（石 → 铜 → 铁，各 +25%）。
   js.up 按下标存，新增档插在队首，旧存档必须按「旧下标 → 旧名字」重新映射。 */
const UPG_RENAME = {
  woodcutting: { 0: '石斧', 1: '伐木小屋', 2: '伐木场', 3: '蒸汽锯' },
  mining: { 0: '石镐', 1: '采矿小屋', 2: '采矿场', 3: '爆破', 4: '选矿厂', 5: '电动矿钻' },
};
function migrate(st) {
  // 补全缺失字段
  const base = newState(st.name || '无名者');
  const merged = Object.assign(base, st);
  merged.items = st.items || {};
  merged.chars = st.chars || {};
  merged.order = st.order || [];
  // 双手武器规则（v0.0.17）：旧存档若同时戴着双手主手与副手，副手退回仓库
  Object.keys(merged.chars).forEach(cid => {
    const c = merged.chars[cid];
    if (!c || !c.eq || !c.eq.mainhand || !c.eq.offhand) return;
    const mh = ITEMS[c.eq.mainhand];
    if (mh && mh.twoHanded) {
      merged.items[c.eq.offhand] = (merged.items[c.eq.offhand] || 0) + 1;
      c.eq.offhand = null;
    }
  });
  merged.jobs = merged.jobs || {};
  JOBS.forEach(j => {
    let js = merged.jobs[j.id];
    if (!js) js = merged.jobs[j.id] = {};
    // 旧存档：单一 char / 数字 prog → 槽位数组
    if (!Array.isArray(js.slots)) js.slots = [];
    if (!Array.isArray(js.prog)) js.prog = [];
    if (!Array.isArray(js.blocked)) js.blocked = [];
    if (js.char) {
      const ri = clamp(js.recipe || 0, 0, Math.max(0, jobRecipes(j).length - 1));
      js.slots[ri] = js.char;
    }
    if (typeof js.prog === 'number') { js.prog = []; js.prog[clamp(js.recipe || 0, 0, Math.max(0, jobRecipes(j).length - 1))] = js.prog; }
    delete js.char; delete js.recipe;
    ensureSlots(js, Math.max(1, jobRecipes(j).length));
    const nUp = (j.upgrades || []).length;
    if (!Array.isArray(js.up)) js.up = [];
    if (js.upVer !== 2) {
      const ren = UPG_RENAME[j.id], oldUp = js.up.slice();
      if (ren) {
        const owned = new Set();
        oldUp.forEach((b, k) => { const nm = ren[k]; if (b && nm) owned.add(nm); });
        js.up = new Array(nUp).fill(0);
        (j.upgrades || []).forEach((u, k) => { if (owned.has(u.name)) js.up[k] = 1; });
      } else {
        js.up = oldUp.slice(0, nUp);
      }
      js.upVer = 2;
    }
    while (js.up.length < nUp) js.up.push(0);
    if (js.up.length > nUp) js.up.length = nUp;
  });
  merged.ui = Object.assign({ page:'warehouse', charSel:null, tab:{} }, st.ui || {});
  merged.settings = Object.assign({ theme:'dark' }, st.settings || {});
  merged.gacha = Object.assign({ pity:{}, pulls:0, noNew:{}, genSeq:0 }, st.gacha || {});
  if (!merged.gacha.genSeq) merged.gacha.genSeq = 0;
  // 旧存档（v0.0.10/0.0.11）的预生成普通角色：已抽到手的人还在 S.chars 里，只是不再有新批次
  delete merged.gacha.normals;
  merged.codex = Object.assign({ items:{}, enemies:{}, chars:{} }, st.codex || {});
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
  APP_VERSION,
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
  jobRecipe, jobRecipes, recipeVisible, recipeDuration, ensureSlots, slotChar, assignedCount, isWorking, assignSlot, clearSlot,
  recipeInputs, recipeOutputs, canMake, stockOf, jobSpeed, jobGate, produceJob, combatState, healerPresent,
  refreshShop, buyShopSlot, sellItem, shopPool,
  gachaPity, gachaPityLimit, shardCount, ownsHero, poolComplete, poolMembers, poolHeroList, makeNormal, genDef, heroDef,
  pull, dismissChar, giftTo, starUp, PULL_COST, PITY_MIN, PITY_MAX, POTION_STARDUST_COST, CODEX_REWARD, NORMAL,
  codexSeen, codexClaimed, codexClaimable, codexClaim, codexUnclaimed, codexClaimAll,
  affordCost, payCost, costHtml, buyHousing, buyComfort, buyFort, buyWarehouse, buyGranary, buyUpgrade,
  wealth, basePower, raidStrength, doRaid, tick, log, toast,
  settleOffline, offlineCombatChars,
  gold: () => S.gold, research: () => S.research,
};
