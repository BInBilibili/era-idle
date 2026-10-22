/* 无头冒烟测试：node tools/test.js */
global.window = {};
require('../js/data/items.js');
require('../js/data/jobs.js');
require('../js/data/techs.js');
require('../js/data/passives.js');
require('../js/data/enemies.js');
require('../js/engine.js');

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

console.log('== 新档 ==');
E.S = E.newState('测试者');
const S = E.S;
ok(S.chars.player && S.order.length === 1, '玩家角色已赠送');
ok(E.onFieldCap() === 5, '初始角色上限 5');
ok(E.granaryTotal() > 0, '开局有食物：' + E.granaryTotal().toFixed(1));
ok(E.warehouseCap() === 20, '初始仓库 20 格');
ok(S.settings && S.settings.theme === 'dark', '默认深色主题');

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
S.techs['pottery'] = true; S.techs['金属冶炼'] = true;
const sandR = mrs.find(r => r.name === '沙');
ok(E.recipeVisible(sandR), '陶器科技后 沙 配方可见');
ok(!E.recipeVisible(mrs.find(r => r.name === '铀矿')), '核能未研究时 铀矿 配方不可见');
E.assignSlot('mining', mrs.indexOf(sandR), 'player');
ok(E.assignedCount(mining) === 1, '同一角色只占一条配方（沙），石头被顶掉');

console.log('== 战斗 ==');
E.clearSlot('mining', 0);
S.techs['bow'] = true;
// 固定战斗数值，避免随机重伤导致测试抖动
Object.assign(S.chars.player.lv, { hp: 20, atk: 20, str: 20, def: 20 });
S.chars.player.xp = { hp: 0, atk: 0, str: 0, def: 0 };
S.chars.player.hpNow = 999;
E.assignSlot('hunting', 0, 'player');
for (let i = 0; i < 1500; i++) E.tick(0.2);
ok(S.stats.kills > 0, '击杀数 ' + S.stats.kills);
ok(S.chars.player.xp.atk > 0 || S.chars.player.lv.atk > 1, '战斗经验累积 ' + JSON.stringify(S.chars.player.xp));
ok(Object.keys(S.seen.enemies).length > 0, '图鉴记录了遇敌');

console.log('== 抽卡 ==');
E.addItem(E.N2I('英雄碎片'), 40);
S.gold = 100000;
const p1 = E.pull('shenren');
ok(p1.ok, '抽卡一次：' + p1.type);
const p2 = E.pull('shenren');
ok(p2.ok, '抽卡两次：' + p2.type);
ok(S.gacha.pulls === 2, '抽卡计数 2');

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

console.log(fails ? ('\n✗ 失败 ' + fails + ' 项') : '\n✓ 全部通过');
process.exit(fails ? 1 : 0);
