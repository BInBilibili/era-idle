/* 无头冒烟测试：node tools/test.js */
global.window = {};
require('../js/data/items.js');
require('../js/data/jobs.js');
require('../js/data/techs.js');
require('../js/data/passives.js');
require('../js/data/enemies.js');
require('../js/engine.js');
require('../js/icons.js');

const E = window.Engine;
let fails = 0;
function ok(cond, msg) { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fails++; }

console.log('== 数据 ==');
ok(Object.keys(E.ITEMS).length === 212, '物品 212：' + Object.keys(E.ITEMS).length);
ok(E.JOBS.length === 33, '工作 33：' + E.JOBS.length);
ok(E.TECHS.length === 42, '科技 42：' + E.TECHS.length);
ok(E.ENEMIES.length === 26, '敌人 26：' + E.ENEMIES.length);
ok(E.HOUSING.length === 6 && E.COMFORT.length === 16 && E.FORTS.length === 14, '被动档位 6/16/14');
ok(E.COMFORT.reduce((a, b) => a + b.value, 0) === 100, '舒适度合计 100');

console.log('== 图标 ==');
const ICONS = window.ICONS;
ok(!!ICONS, 'icons.js 已加载');
if (ICONS) {
  const miss = ICONS.missing();
  ok(miss.length === 0, '没有缺形状的 id：' + (miss.join(',') || '无'));
  const itemIds = Object.keys(E.ITEMS);
  const badItem = itemIds.filter(id => {
    const s = ICONS.item(id);
    return !s.startsWith('<svg class="icSvg"') || s.length < 260;
  });
  ok(badItem.length === 0, '全部 ' + itemIds.length + ' 件物品能渲染：' + (badItem.join(',') || 'ok'));
  const badEnemy = E.ENEMIES.filter(e => {
    const s = ICONS.enemy(e.id);
    return !s.startsWith('<svg class="icSvg"') || s.length < 260;
  }).map(e => e.id);
  ok(badEnemy.length === 0, '全部 ' + E.ENEMIES.length + ' 种敌人能渲染：' + (badEnemy.join(',') || 'ok'));
  ok(ICONS.item('stone') !== ICONS.item('copper_ore'), '不同物品图标不同');
  ok(ICONS.item(E.ITEMS.stone) === ICONS.item('stone'), '传物品对象与传 id 结果一致（中文名映射）');
  ok(ICONS.nameToId('石头') === 'stone', '中文名 → id');
  ok(Object.keys(ICONS.SPEC).every(id => E.ITEMS[id]), 'SPEC 里没有已删除的物品 id');
  ok(Object.keys(ICONS.ENEMY_SPEC).every(id => E.ENEMIES.some(e => e.id === id)), 'ENEMY_SPEC 里没有已删除的敌人 id');
  const noId = ['stone', 'wood', 'iron_sword', 'book_mining'].every(id => !/id="/.test(ICONS.item(id)) && !/<defs/.test(ICONS.item(id)));
  ok(noId, '图标不含 id/defs（重复渲染不会串色）');
  ok(E.JOBS.every(j => { const s = ICONS.job(j); return s.startsWith('<svg class="icSvg"') && s.length > 220; }), '全部 ' + E.JOBS.length + ' 份工作都有图标');
  const passAll = [].concat(E.HOUSING, E.COMFORT, E.FORTS);
  ok(passAll.every(p => { const s = ICONS.passive(p.name); return s.startsWith('<svg class="icSvg"') && s.length > 220; }), '全部 ' + passAll.length + ' 项被动都有图标');
  ok(['housing', 'defense', 'shop', 'characters', 'codex', 'recruit', 'warehouse'].every(k => ICONS.nav(k).startsWith('<svg')), '7 个左侧导航图标都在');
  ok(ICONS.job('woodcutting') !== ICONS.job('mining') && ICONS.passive('石墙') !== ICONS.passive('土垒'), '不同工作 / 不同工事图标不同');
  ok(ICONS.job('black_soul') && ICONS.job({ id: 'hunting' }) === ICONS.job('hunting'), '工作图标可传对象或 id');
}

console.log('== 新档 ==');
E.S = E.newState('测试者');
const S = E.S;
ok(S.chars.player && S.order.length === 1, '玩家角色已赠送');
ok(E.onFieldCap() === 5, '初始角色上限 5');
ok(E.granaryTotal() > 0, '开局有食物：' + E.granaryTotal().toFixed(1));
ok(E.warehouseCap() === 20, '初始仓库 20 格');
ok(S.settings && S.settings.theme === 'dark', '默认深色主题');

console.log('== 住房：6 档住满 = 18 人 ==');
ok(E.HOUSING.map(h => h.cap).join(',') === '7,9,11,13,15,18', '每档可上场人数 7/9/11/13/15/18');
ok(E.HOUSING.every(h => h.comfortReq === undefined), '住房不再有舒适度门槛');
const savedHousing = S.housing;
S.housing = 0; ok(E.onFieldCap() === 5, '没盖房 = 5 人');
S.housing = 1; ok(E.onFieldCap() === 7, '茅草棚 = 7 人');
S.housing = 3; ok(E.onFieldCap() === 11, '第 3 档 = 11 人');
S.housing = 6; ok(E.onFieldCap() === 18, '住满 6 档 = 18 人（不是 17/25）');
S.housing = 0;
S.comfort = E.COMFORT.map(() => false);            // 舒适度 0 也能盖房
E.addItem('木材', 300); E.addItem('石头', 150);
const hr = E.buyHousing();
ok(hr.ok && S.housing === 1 && E.onFieldCap() === 7, '舒适度 0 也能建茅草棚：' + JSON.stringify(hr));
S.housing = savedHousing;

console.log('== 黑暗之魂线隐藏 ==');
ok(E.JOB_BY_ID.black_soul && E.JOB_BY_ID.black_soul.hidden, '#黑暗之魂 标记隐藏');
ok(E.jobVisible(E.JOB_BY_ID.black_soul) === false, '#黑暗之魂 不可见（不出现在导航/工作页）');
ok(E.JOB_BY_ID.era_sim && !E.JOB_BY_ID.era_sim.hidden, '#模拟纪元 不受影响');
ok(E.ENEMIES.filter(e => e.type === 'blackSoul').length === 4 && E.ENEMIES.filter(e => e.type === 'blackSoul').every(e => e.hidden), '4 只黑魂怪隐藏（图鉴不显示）');
ok(['soul', 'ember', 'undead_chainmail', 'ashen_legs', 'abyss_helmet', 'abyss_greatsword'].every(id => E.ITEMS[id] && E.ITEMS[id].hidden), '灵魂/余火/黑魂套 6 件隐藏');

console.log('== 伐木 600 秒 ==');
E.assignSlot('woodcutting', 0, 'player');
for (let i = 0; i < 3000; i++) E.tick(0.2);
const wood = E.count('木材');
ok(wood > 100, '木材产出 ' + E.fmt(wood));
ok(E.masteryLvl(S.chars.player, 'woodcutting') > 1, '精通升到 ' + E.masteryLvl(S.chars.player, 'woodcutting'));
ok(E.assignedCount(E.JOB_BY_ID.woodcutting) === 1, '伐木显示 1 人在工作');

console.log('== 采集 / 烹饪 ==');
E.clearSlot('woodcutting', 0);
E.assignSlot('gathering', 0, 'player');
for (let i = 0; i < 500; i++) E.tick(0.2);
const veg = ['浆果', '块根', '野菌', '坚果'].reduce((a, n) => a + E.count(n), 0);
ok(veg > 0, '采集产出食物 ' + veg.toFixed(1));
S.research = 500;
E.researchTech('fire');
E.clearSlot('gathering', 0);
E.assignSlot('cooking', 0, 'player');
for (let i = 0; i < 800; i++) E.tick(0.2);
ok(E.count('素餐') + E.count('均衡餐') + E.count('肉餐') > 0, '烹饪有熟食产出');

console.log('== 科研 / 科技 ==');
E.clearSlot('cooking', 0);
E.assignSlot('research', 0, 'player');
for (let i = 0; i < 400; i++) E.tick(0.2);
ok(S.research > 0, '科研点 ' + E.fmt(S.research));
S.research = 500;
const r1 = E.researchTech('stonecraft');
ok(r1.ok, '研究 石器工艺：' + JSON.stringify(r1));

console.log('== 采矿：每种矿石一条配方 ==');
const mining = E.JOB_BY_ID.mining;
const mrs = E.jobRecipes(mining);
ok(mrs.length === 13, '采矿配方 13 条：' + mrs.length);
const stoneR = mrs.find(r => r.name === '石头');
const goldR = mrs.find(r => r.name === '金矿');
ok(stoneR.duration === 3, '石头时长 3 秒（权重 100）');
ok(Math.abs(goldR.duration - 75) < 0.01, '金矿时长 75 秒（权重 4，与权重成反比）');
ok(stoneR.duration < goldR.duration, '权重越高时长越短');
E.clearSlot('research', 0);
E.assignSlot('mining', mrs.indexOf(stoneR), 'player');
for (let i = 0; i < 500; i++) E.tick(0.2);
ok(E.count('石头') > 10, '采石产出 ' + E.count('石头'));

console.log('== 多配方独立入驻 ==');
S.research = 5000;
S.techs['pottery'] = true; S.techs['metal_smelting'] = true;
const sandR = mrs.find(r => r.name === '沙');
ok(E.recipeVisible(sandR), '陶器科技后 沙 配方可见');
ok(!E.recipeVisible(mrs.find(r => r.name === '铀矿')), '核能未研究时 铀矿 配方不可见');
E.assignSlot('mining', mrs.indexOf(sandR), 'player');
ok(E.assignedCount(mining) === 1, '同一角色只占一条配方（沙），石头被顶掉');

console.log('== 装备制造：三份工作的完整配方 ==');
const craftJob = E.JOB_BY_ID.crafting, forgeJob = E.JOB_BY_ID.forging, tailorJob = E.JOB_BY_ID.tailoring;
const craftRs = E.jobRecipes(craftJob), forgeRs = E.jobRecipes(forgeJob), tailorRs = E.jobRecipes(tailorJob);
ok(craftRs.length === 17, '加工 17 件：' + craftRs.length);
ok(forgeRs.length === 51, '锻造 51 件：' + forgeRs.length);
ok(tailorRs.length === 17, '裁缝 17 件：' + tailorRs.length);
ok(craftRs.some(r => r.name === '石斧') && craftRs.some(r => r.name === '皮甲'), '加工包含石器时代装备');
ok(!craftRs.some(r => r.name === '硅片') && !craftRs.some(r => r.name === '光纤'), '硅片 / 光纤已移出加工');
ok(E.jobRecipes(E.JOB_BY_ID.glassmaking).some(r => r.name === '光纤'), '光纤移到玻璃制造');
ok(E.jobRecipes(E.JOB_BY_ID.semiconductors).some(r => r.name === '硅片'), '硅片移到半导体制造');
let badRecipe = 0;
for (const r of [...craftRs, ...forgeRs, ...tailorRs]) {
  if (Object.keys(E.recipeInputs(r)).length !== Object.keys(r.inputs).length) badRecipe++;
  if (Object.keys(E.recipeOutputs(r)).length !== 1) badRecipe++;
}
ok(badRecipe === 0, '85 件装备的投料 / 产出都能映射到物品');
ok(!E.recipeVisible(craftRs.find(r => r.name === '长弓')), '长弓锁在 *缝制');
S.techs['tailoring'] = true;
ok(E.recipeVisible(craftRs.find(r => r.name === '长弓')), '研究 *缝制 后长弓可见');
E.assignSlot('crafting', craftRs.findIndex(r => r.name === '石斧'), 'player');
S.items[E.N2I('木材')] = 100; S.items[E.N2I('石头')] = 100;
for (let i = 0; i < 40; i++) E.tick(0.2);
ok(E.count('石斧') > 0, '加工能实际造出石斧：' + E.count('石斧'));

console.log('== 精通经验条 ==');
const mc = S.chars.player, mx = E.GAME.masteryXpMax;
E.masteryOf(mc, 'woodcutting').xp = Math.pow(10 / 100, 2) * mx;
ok(E.masteryLvl(mc, 'woodcutting') === 10, '10 级门槛处等级为 10');
ok(E.masteryNext(mc, 'woodcutting') < 0.001, '升级瞬间经验条从 0 开始：' + E.masteryNext(mc, 'woodcutting').toFixed(3));
E.masteryOf(mc, 'woodcutting').xp = (Math.pow(10 / 100, 2) + (Math.pow(11 / 100, 2) - Math.pow(10 / 100, 2)) / 2) * mx;
ok(Math.abs(E.masteryNext(mc, 'woodcutting') - 0.5) < 0.01, '本级正中间约 50%：' + E.masteryNext(mc, 'woodcutting').toFixed(3));

console.log('== 战斗 ==');
E.clearSlot('mining', 0);
S.techs['bow'] = true;
// 固定战斗数值，避免随机重伤导致测试抖动（hpNow 会被 tick 夹回 maxHp，所以直接拉高等级）
Object.assign(S.chars.player.lv, { hp: 50, atk: 50, str: 50, def: 50 });
S.chars.player.xp = { hp: 0, atk: 0, str: 0, def: 0 };
S.chars.player.hpNow = 500;
E.assignSlot('hunting', 0, 'player');
for (let i = 0; i < 1500; i++) E.tick(0.2);
ok(S.stats.kills > 0, '击杀数 ' + S.stats.kills);
ok(S.chars.player.xp.atk > 0 || S.chars.player.lv.atk > 1, '战斗经验累积 ' + JSON.stringify(S.chars.player.xp));
ok(Object.keys(S.seen.enemies).length > 0, '图鉴记录了遇敌');

console.log('== 抽卡 ==');
E.addItem(E.N2I('英雄碎片'), 4000);
S.gold = 100000;
ok(E.POOLS.length === 2 && E.POOLS[0].id === 'limited' && E.POOLS[1].id === 'standard', '卡池只有 限定 / 常驻：' + E.POOLS.map(p => p.name).join(' / '));
ok(E.pull('shenren').ok === false, '旧卡池（神人俱乐部）已移除');
ok(E.poolMembers('limited').length === 2, '限定池只预置 2 名有名英雄：' + E.poolMembers('limited').length);
ok(E.poolMembers('standard').length === 0, '常驻池不预置角色，随机普通角色全部现造');
ok(E.poolMembers('limited').map(m => m.def.name).join('/') === '大少/Laremehpe', '限定池有名角色 = 大少 / Laremehpe');

const n1 = E.makeNormal(), n2 = E.makeNormal();
ok(n1.id !== n2.id, '随机普通角色每次现造、id 不重复：' + n1.id + ' / ' + n2.id);
ok(!!n1.name && n1.hp >= 6 && n1.atk >= 5 && !!n1.job && n1.e1 === null, '随机名字/属性/工作加成，无社交恩赐');
ok(E.poolHeroList().length === 2, '图鉴角色只统计 2 名有名英雄（随机普通角色不进图鉴）');

const before = E.shardCount();
const p1 = E.pull('limited');
ok(p1.ok, '抽卡一次：' + p1.type);
ok(E.shardCount() === before - E.PULL_COST, '单抽消耗 ' + E.PULL_COST + ' 碎片：' + (before - E.shardCount()));

// 常驻池：出角色时 100% 是全新随机普通角色
S.gacha.noNew.standard = 30;
const p2 = E.pull('standard');
ok(p2.ok && p2.type === 'new' && p2.gen, '常驻池保底必出全新随机普通角色');
ok(!S.chars[p2.hero.id].e1, '随机普通角色没有社交恩赐');
S.gacha.noNew.standard = 30;
const p2b = E.pull('standard');
ok(p2b.ok && p2b.type === 'new' && p2b.gen && p2b.hero.id !== p2.hero.id, '随机普通角色无限：再保底又是一张新面孔');
S.gacha.noNew.standard = 0;

// 限定池：保底优先补齐两名有名英雄
for (let i = 0; i < 4 && !['dashao', 'lare'].every(id => S.chars[id]); i++) { S.gacha.noNew.limited = 30; E.pull('limited'); }
ok(['dashao', 'lare'].every(id => S.chars[id]), '限定池保底补齐两名英雄');
S.gacha.noNew.limited = 30;
const p5 = E.pull('limited');
ok(p5.ok && p5.type === 'new' && p5.gen, '英雄集齐后，限定池保底 = 全新随机普通角色（' + p5.type + '）');
S.gacha.noNew.limited = 0;

// 礼物也算「这一抽没出新角色」：连抽 30 次礼物 → 第 31 抽保底必出角色
S.gacha.noNew.standard = 0;
const rnd = Math.random;
Math.random = () => 0.99;            // 30% 判定必失败 → 全部出礼物
for (let i = 0; i < 30; i++) E.pull('standard');
const pityCnt = S.gacha.noNew.standard;
const p4 = E.pull('standard');
Math.random = rnd;
ok(pityCnt === 30, '礼物抽也累计保底计数：' + pityCnt);
ok(p4.type === 'new' && p4.gen, '第 31 抽保底必出全新角色：' + p4.type);

console.log('== 开除随机普通角色 ==');
const gcId = Object.keys(S.chars).find(id => S.chars[id].gen);
ok(!!gcId, '存在随机普通角色：' + gcId);
const wid = Object.keys(E.ITEMS).find(id => E.ITEMS[id].cat === 'weapon');
S.chars[gcId].eq.mainhand = wid;
E.assignSlot('woodcutting', 0, gcId);
const widBefore = S.items[wid] || 0;
const dis = E.dismissChar(gcId);
ok(dis.ok && dis.n === 1, '开除成功，归还 1 件装备：' + dis.n);
ok(!S.chars[gcId] && S.order.indexOf(gcId) < 0, '角色永久移除（存档 + 列表）');
ok((S.items[wid] || 0) === widBefore + 1, '装备退回仓库');
ok(!(S.jobs.woodcutting.slots || []).some(x => x === gcId), '岗位已空出');
ok(E.dismissChar('player').ok === false, '玩家角色不能开除');
ok(!E.S.chars[gcId], '开除后不能再送回抽卡结果');

console.log('== 图鉴领取 ==');
ok(E.codexClaimable('items', E.N2I('木材')), '已收录物品可领取');
const shards0 = E.shardCount();
const cr = E.codexClaim('items', E.N2I('木材'));
ok(cr.ok && E.shardCount() === shards0 + E.CODEX_REWARD.items, '领取物品奖励 +' + E.CODEX_REWARD.items + ' 碎片');
ok(!E.codexClaimable('items', E.N2I('木材')), '同一条目不能重复领取');
ok(E.CODEX_REWARD.enemies === 3 && E.CODEX_REWARD.chars === 5, '敌人 3 / 角色 5 碎片');
const allc = E.codexClaimAll();
ok(E.codexUnclaimed().total === 0, '一键领取后没有待领：领取 ' + allc.count + ' 项 → ' + allc.n + ' 碎片');

console.log('== 商店 ==');
E.refreshShop(true);
ok(S.shop.slots.length === 6, '货架 6 格');
const idx = S.shop.slots.findIndex(x => x && E.ITEMS[x.id] && E.ITEMS[x.id].storage !== 'granary');
if (idx >= 0) { S.gold = 1e7; const before = S.gold; const b = E.buyShopSlot(idx); ok(b.ok, '购买成功 花费 ' + (before - S.gold)); }

console.log('== 存档迁移 / 往返 ==');
E.assignSlot('woodcutting', 0, 'player');
const cloned = E.migrate(JSON.parse(JSON.stringify(S)));
ok(cloned.name === '测试者' && Object.keys(cloned.chars).length >= 1, '存档往返');
ok(Array.isArray(cloned.jobs.woodcutting.slots) && cloned.jobs.woodcutting.slots[0] === 'player', '槽位状态保留');
// 旧存档结构
const old = JSON.parse(JSON.stringify(S));
Object.values(old.jobs).forEach(j => { delete j.slots; delete j.prog; j.char = null; j.prog = 0; j.recipe = 0; });
old.jobs.woodcutting.char = 'player';
const mig = E.migrate(old);
ok(Array.isArray(mig.jobs.woodcutting.slots) && mig.jobs.woodcutting.slots[0] === 'player', '旧存档 char → 槽位迁移');
const twoH = E.newState('双手迁移');
twoH.chars.player.eq.mainhand = 'short_bow';
twoH.chars.player.eq.offhand = 'wood_shield';
const migTwo = E.migrate(twoH);
ok(!migTwo.chars.player.eq.offhand && (migTwo.items.wood_shield || 0) === 1, '旧存档双手武器 + 副手 → 副手退回仓库');

console.log('== 袭击 ==');
S.forts[0] = true;
const raid = E.doRaid();
ok(typeof raid.strength === 'number' && raid.strength > 0, '袭击强度 ' + raid.strength + ' vs ' + raid.defense + ' → ' + (raid.win ? '击退' : '失守'));

console.log('== 长跑 1 小时 ==');
E.assignSlot('hunting', 0, 'player');
let t0 = Date.now();
for (let i = 0; i < 18000; i++) E.tick(0.2);
ok(true, '长跑无异常（耗时 ' + (Date.now() - t0) + 'ms，游戏内 ' + E.fmtTime(S.playtime) + '）');
ok(Object.values(S.items).every(v => v >= 0 && !isNaN(v)), '物品数量无负数/NaN');
ok(!isNaN(S.gold) && !isNaN(S.research), '金币/科研点无 NaN');

console.log('== 离线结算 ==');
E.S = E.newState('离线测试');
E.assignSlot('woodcutting', 0, 'player');
const beforePlay = E.S.playtime;
let rep = E.settleOffline(3600);
ok(!!rep && Math.abs(rep.used - 3600) < 1, '1 小时离线按 3600 秒结算');
ok(Math.abs(E.S.playtime - beforePlay - 3600) < 1, '游戏时长推进 3600 秒');
const woodGain = rep.gained.find(g => g.id === E.N2I('木材'));
ok(!!woodGain && woodGain.n > 50, '离线伐木产出木材：' + (woodGain ? woodGain.n : 0));
ok(rep.food.after < rep.food.before, '离线期间粮仓腐坏：' + rep.food.before.toFixed(1) + ' → ' + rep.food.after.toFixed(1));
ok(rep.mastery && rep.mastery.length > 0 && rep.mastery[0].to > rep.mastery[0].from,
  '离线精通升级写进结算单：' + (rep.mastery[0] ? rep.mastery[0].job + ' Lv' + rep.mastery[0].from + '→' + rep.mastery[0].to : '无'));
const offMLvl = E.masteryLvl(E.S.chars.player, 'woodcutting');
const offMXp = E.masteryOf(E.S.chars.player, 'woodcutting').xp;
ok(E.settleOffline(30) === null, '不足 60 秒不结算（交给正常 tick）');
rep = E.settleOffline(20 * 3600);
ok(rep && rep.used === E.GAME.offlineCapSec && rep.capped, '超过 8 小时按上限结算');
ok(Object.values(E.S.items).every(v => v >= 0 && !isNaN(v)), '离线后物品无负数/NaN');

// 精通：离线按 15 秒块推进，1 小时后的等级 / 经验应与在线一致
E.S = E.newState('在线对照');
E.assignSlot('woodcutting', 0, 'player');
for (let i = 0; i < 18000; i++) E.tick(0.2);
const onMLvl = E.masteryLvl(E.S.chars.player, 'woodcutting');
const onMXp = E.masteryOf(E.S.chars.player, 'woodcutting').xp;
ok(offMLvl > 0 && offMLvl === onMLvl, '离线精通等级 = 在线：' + offMLvl);
ok(Math.abs(offMXp - onMXp) <= Math.max(1, onMXp * 0.05), '离线精通经验 ≈ 在线：' + Math.round(offMXp) + ' vs ' + Math.round(onMXp));

E.S = E.newState('离线袭击');
rep = E.settleOffline(8 * 3600);
ok(rep.raids.length === 4, '8 小时补算 4 次袭击判定：' + rep.raids.length);

E.S = E.newState('离线战斗');
// 高防高攻：能稳定打穿森林，且挨打速度低于自愈，1 小时下来不会重伤
Object.assign(E.S.chars.player.lv, { hp: 50, atk: 100, str: 100, def: 200 });
E.S.chars.player.hpNow = 500;
E.S.techs['bow'] = true;
E.assignSlot('hunting', 0, 'player');
E.combatState('hunting').region = 0;
rep = E.settleOffline(3600);
ok(rep.kills > 0, '离线狩猎按期望值击杀：' + rep.kills);
ok(E.S.stats.kills > 0 && rep.gained.length > 0, '离线战斗掉落 ' + rep.gained.length + ' 种');
ok(!E.S.chars.player.injured, '打得过就不会重伤');
ok(E.masteryOf(E.S.chars.player, 'hunting').xp > 0, '离线战斗也涨精通');
ok(rep.mastery.length > 0, '结算单含战斗精通升级：' + rep.mastery.map(m => m.job + ' Lv' + m.from + '→' + m.to).join('、'));

E.S = E.newState('离线重伤');
E.S.techs['bow'] = true;
E.assignSlot('hunting', 0, 'player');
E.combatState('hunting').region = 7;
rep = E.settleOffline(600);
ok(rep.injured.length > 0 && E.S.chars.player.injured, '离线打不过会重伤：' + rep.injured.join('、'));
ok(rep.kills === 0, '打不过时没有击杀产出');

console.log('== 界面：消耗栏缺料标红 ==');
require('../js/ui.js');
const U = window.UI;
E.S = E.newState('界面测试');
ok(!U.ioList({ '木材': 2 }).includes('<span class="red">'), '产出行不检查库存（不标红）');
ok(U.ioList({ '木材': 2 }, true).includes('<span class="red">木材</span>'), '消耗栏缺木材：名称标红');
E.addItem(E.N2I('木材'), 2);
ok(!U.ioList({ '木材': 2 }, true).includes('<span class="red">'), '库存够：名称不标红');
// 通用输入（素食食材 = 浆果 / 块根 / 野菌 / 坚果）按合计判定
['浆果', '块根', '野菌', '坚果'].forEach(n => { E.S.items[E.N2I(n)] = 0; });
ok(U.ioList({ '素食食材': 1 }, true).includes('<span class="red">素食食材</span>'), '通用消耗（素食食材）缺料：名称标红');
E.S.items[E.N2I('浆果')] = 1;
ok(!U.ioList({ '素食食材': 1 }, true).includes('<span class="red">'), '通用消耗凑够：名称不标红');
// 真实项目卡：消耗行接入检查，产出行不受影响
const inJob = E.JOBS.find(j => !j.special && j.inputs && Object.keys(j.inputs).length > 0);
E.ensureSlots(E.S.jobs[inJob.id], E.jobRecipes(inJob).length);
E.S.items = {};
const card = U.recipeCard(inJob, E.S.jobs[inJob.id], E.jobRecipes(inJob)[0], 0);
ok(card.includes('消耗：') && card.includes('<span class="red">'), '项目卡消耗行：缺料名称标红（' + inJob.name + '）');
ok(!card.split('产出：')[1].split('<br>')[0].includes('class="red"'), '项目卡产出行不标红');

console.log('== 袭击：早期保护 ==');
E.S = E.newState('早期保护');
E.S.techs.writing = true;    // 直接进入中世纪（1/8 进度）
const earlyPower = E.basePower();
const earlyMax = Math.max(...Array.from({ length: 80 }, () => E.raidStrength()));
ok(E.raidGuard() <= 0.05, '新手基地战力 ' + earlyPower + ' → 早期保护系数 ' + E.raidGuard().toFixed(3));
ok(earlyMax < 40, '新手袭击强度 ' + earlyMax + '（旧公式约 1400）');
E.S.chars.player.lv = { hp: 10, atk: 10, str: 10, def: 10 };
E.S.forts = E.FORTS.map(() => true);
ok(E.raidGuard() === 1 && E.basePower() > 2500, '基地战力 ' + E.basePower() + ' → 早期保护解除');

console.log(fails ? ('\n✗ 失败 ' + fails + ' 项') : '\n✓ 全部通过');
process.exit(fails ? 1 : 0);
