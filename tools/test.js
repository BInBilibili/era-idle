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

console.log('== 伐木 600 秒 ==');
S.jobs.woodcutting.char = 'player';
for (let i = 0; i < 3000; i++) E.tick(0.2);
const wood = E.count('木材');
ok(wood > 100, '木材产出 ' + E.fmt(wood));
ok(E.masteryLvl(S.chars.player, 'woodcutting') > 1, '精通升到 ' + E.masteryLvl(S.chars.player, 'woodcutting'));
ok(S.chars.player.hpNow > 0, '玩家生命 ' + Math.round(S.chars.player.hpNow));

console.log('== 采集 / 烹饪 ==');
S.jobs.woodcutting.char = null;
S.jobs.gathering.char = 'player';
for (let i = 0; i < 500; i++) E.tick(0.2);
const veg = ['浆果', '块根', '野菌', '坚果'].reduce((a, n) => a + E.count(n), 0);
ok(veg > 0, '采集产出食物 ' + veg.toFixed(1));
ok(Object.keys(S.items).some(id => E.ITEMS[id].storage === 'granary'), '粮仓有物品');

S.research = 500;
E.researchTech('fire');
S.jobs.gathering.char = null;
S.jobs.cooking.char = 'player';
for (let i = 0; i < 800; i++) E.tick(0.2);
ok(E.count('素餐') + E.count('均衡餐') + E.count('肉餐') > 0, '烹饪有熟食产出');

console.log('== 科研 ==');
S.jobs.cooking.char = null;
S.jobs.research.char = 'player';
for (let i = 0; i < 400; i++) E.tick(0.2);
ok(S.research > 0, '科研点 ' + E.fmt(S.research));
S.research = 500;
const r1 = E.researchTech('stonecraft');
ok(r1.ok, '研究 石器工艺：' + JSON.stringify(r1));

console.log('== 采矿 ==');
S.jobs.research.char = null;
S.jobs.mining.char = 'player';
for (let i = 0; i < 1000; i++) E.tick(0.2);
let ores = 0; Object.keys(E.ITEMS).forEach(id => { if (E.ITEMS[id].cat === 'ore') ores += E.count(id); });
ok(ores > 20, '矿石产出 ' + ores.toFixed(0));

console.log('== 战斗 ==');
S.jobs.mining.char = null;
S.techs['bow'] = true;
S.jobs.hunting.char = 'player';
for (let i = 0; i < 1500; i++) E.tick(0.2);
ok(S.stats.kills > 0, '击杀数 ' + S.stats.kills);
ok(S.chars.player.xp.atk > 0 || S.chars.player.lv.atk > 1, '战斗经验累积 ' + JSON.stringify(S.chars.player.xp));
ok(Object.keys(S.seen.enemies).length > 0, '图鉴记录了遇敌');

console.log('== 抽卡 ==');
const shard = E.N2I('英雄碎片');
E.addItem(shard, 40);
S.gold = 100000;
const p1 = E.pull('shenren');
ok(p1.ok, '抽卡一次：' + p1.type);
if (p1.type === 'new') ok(S.order.length === 2, '新角色加入，角色数 ' + S.order.length);
const p2 = E.pull('shenren');
ok(p2.ok, '抽卡两次：' + p2.type);
ok(S.gacha.pulls === 2, '抽卡计数 2');

console.log('== 商店 ==');
E.refreshShop(true);
ok(S.shop.slots.length === 6, '货架 6 格');
const idx = S.shop.slots.findIndex(x => x && E.ITEMS[x.id] && E.ITEMS[x.id].storage !== 'granary');
if (idx >= 0) { S.gold = 1e7; const before = S.gold; const b = E.buyShopSlot(idx); ok(b.ok, '购买成功 花费 ' + (before - S.gold)); }

console.log('== 存档 ==');
const cloned = E.migrate(JSON.parse(JSON.stringify(S)));
ok(cloned.name === '测试者' && Object.keys(cloned.chars).length >= 1, '存档往返');
ok(cloned.jobs.woodcutting.char === S.jobs.woodcutting.char, '工作状态保留');

console.log('== 袭击 ==');
S.forts[0] = true;
const raid = E.doRaid();
ok(typeof raid.strength === 'number' && raid.strength > 0, '袭击强度 ' + raid.strength + ' vs ' + raid.defense + ' → ' + (raid.win ? '击退' : '失守'));

console.log('== 长跑 1 小时 ==');
S.jobs.hunting.char = 'player';
let t0 = Date.now();
for (let i = 0; i < 18000; i++) E.tick(0.2);
ok(true, '长跑无异常（耗时 ' + (Date.now() - t0) + 'ms，游戏内 ' + E.fmtTime(S.playtime) + '）');
ok(Object.values(S.items).every(v => v >= 0 && !isNaN(v)), '物品数量无负数/NaN');
ok(!isNaN(S.gold) && !isNaN(S.research), '金币/科研点无 NaN');

console.log(fails ? ('\n✗ 失败 ' + fails + ' 项') : '\n✓ 全部通过');
process.exit(fails ? 1 : 0);
