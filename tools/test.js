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
function unlockWood(S) { S.milestones.wood_stone = true; S.jobs.woodcutting.up[0] = 1; }
let fails = 0;
function ok(cond, msg) { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fails++; }

console.log('== 数据 ==');
ok(Object.keys(E.ITEMS).length === 215, '物品 215（新增草药 + 3 个资源包，删除药草作物）：' + Object.keys(E.ITEMS).length);
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
ok(E.JOBS.filter(E.jobVisible).map(j => j.id).join(',') === 'gathering', '开局只显示采集：' + E.JOBS.filter(E.jobVisible).map(j => j.id).join(','));
ok(!S.milestones.wood_stone && !S.milestones.research_ready && !S.milestones.injured, '开局里程碑都是未解锁');

console.log('== 获得物品消息框：所有产出 ==');
const lootGot = [];
window.UI = { loot: (id, n) => lootGot.push([id, n]) };
E.addItem('木材', 3);
E.addItem('木材', 2);
ok(lootGot.length === 2 && lootGot[0][0] === 'wood' && lootGot[0][1] === 3 && lootGot[1][1] === 2, 'addItem 每次产出都上报：' + JSON.stringify(lootGot));
E.addItem('木材', 1, { silent: true });
ok(lootGot.length === 2, 'opts.silent 可临时静音');
// 真正的「工作持续产出」：玩家入驻草地，直接结算 10 秒
E.assignSlot('gathering', 0, 'player');
const lootBefore = lootGot.length;
E.produceJob('gathering', 10);
E.clearSlot('gathering', 0);
ok(lootGot.length > lootBefore, '工作持续产出（采集）也会进消息框：' + lootGot.slice(lootBefore).map(x => x[0] + '+' + x[1]).join(','));
window.UI = undefined;

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
// 先凑齐 1 木材 + 1 石头 → 工作永久显示；再买石斧 → 木材项目出现
E.addItem('木材', 2); E.addItem('石头', 2);
ok(E.jobVisible(E.JOB_BY_ID.woodcutting) && E.jobVisible(E.JOB_BY_ID.mining), '拥有木材 + 石头后伐木 / 采矿永久显示');
ok(E.buyUpgrade('woodcutting', 0).ok, '购买石斧（2 木材 + 2 石头）');
E.assignSlot('woodcutting', 0, 'player');
for (let i = 0; i < 3000; i++) E.tick(0.2);
const wood = E.count('木材');
ok(wood > 100, '木材产出 ' + E.fmt(wood));
ok(E.masteryLvl(S.chars.player, 'woodcutting') > 1, '精通升到 ' + E.masteryLvl(S.chars.player, 'woodcutting'));
ok(E.assignedCount(E.JOB_BY_ID.woodcutting) === 1, '伐木显示 1 人在工作');

console.log('== 采集 / 资源包 / 烹饪 ==');
E.clearSlot('woodcutting', 0);
E.assignSlot('gathering', 1, 'player');   // 平原资源：石头 / 木材 / 浆果 / 块根 / 坚果
for (let i = 0; i < 500; i++) E.tick(0.2);
const plainsGain = ['石头', '木材', '浆果', '块根', '坚果'].reduce((a, n) => a + E.count(n), 0);
ok(plainsGain > 0, '平原资源随机产出其中一种：' + plainsGain.toFixed(1));
ok(E.count('草地资源') === 0 && E.count('平原资源') === 0, '资源包本身不会进仓库');
ok(E.jobRecipes(E.JOB_BY_ID.gathering).map(r => r.name).join('/') === '草地/平原/沼泽', '采集项目 = 草地 / 平原 / 沼泽');
const grassPool = E.ITEMS[E.N2I('草地资源')].pool;
ok(grassPool.find(p => p.id === 'plant_fiber').weight === 90 && grassPool.length === 6, '草地：植物纤维 90% + 5 种种子合计 10%');
ok(E.ITEMS[E.N2I('平原资源')].pool.every(p => p.weight === 1), '平原：五种产物等概率');
ok(E.ITEMS[E.N2I('沼泽资源')].pool.map(p => p.id).join(',') === 'wild_mushroom,herb', '沼泽：野菌 / 药草各半');
ok(!E.recipeVisible(E.jobRecipes(E.JOB_BY_ID.gathering)[2], E.JOB_BY_ID.gathering), '没受伤时沼泽项目隐藏');
E.addItem('浆果', 40);
S.research = 500;
E.researchTech('fire');
// v0.0.30：除采集外，所有工作都要先买第一个升级项才出现项目
E.addItem('木材', 100); E.addItem('石头', 50);
ok(E.buyUpgrade('cooking', 0).ok, '购买灶台（烹饪第一个升级项）');
E.clearSlot('gathering', 0);
E.assignSlot('cooking', 0, 'player');
for (let i = 0; i < 800; i++) E.tick(0.2);
ok(E.count('素餐') + E.count('均衡餐') + E.count('肉餐') > 0, '烹饪有熟食产出');

console.log('== 科研 / 科技 ==');
E.clearSlot('cooking', 0);
E.addItem('木材', 100); E.addItem('石头', 50);
ok(S.milestones.research_ready && E.jobVisible(E.JOB_BY_ID.research), '攒到基础研究桌 30% 材料后科研永久显示');
ok(!E.recipeVisible(E.jobRecipes(E.JOB_BY_ID.research)[0], E.JOB_BY_ID.research), '没买基础研究桌时科研项目隐藏');
ok(E.buyUpgrade('research', 0).ok, '购买基础研究桌');
ok(E.recipeVisible(E.jobRecipes(E.JOB_BY_ID.research)[0], E.JOB_BY_ID.research), '买完基础研究桌后科研项目出现');
E.assignSlot('research', 0, 'player');
for (let i = 0; i < 400; i++) E.tick(0.2);
ok(S.research > 0, '科研点 ' + E.fmt(S.research));
S.research = 500;
const r1 = E.researchTech('stonecraft');
ok(r1.ok, '研究 石器工艺：' + JSON.stringify(r1));

console.log('== 采矿：每种矿石一条配方 ==');
const mining = E.JOB_BY_ID.mining;
const mrs = E.jobRecipes(mining);
ok(mrs.length === 12, '采矿配方 12 条（石油已拆到石油开采）：' + mrs.length);
const stoneR = mrs.find(r => r.name === '石头');
const goldR = mrs.find(r => r.name === '金矿');
ok(stoneR.duration === 3, '石头时长 3 秒（权重 100）');
ok(Math.abs(goldR.duration - 75) < 0.01, '金矿时长 75 秒（权重 4，与权重成反比）');
ok(stoneR.duration < goldR.duration, '权重越高时长越短');
ok(!E.recipeVisible(stoneR, mining) && !E.recipeVisible(mrs.find(r => r.name === '铜矿'), mining), '没买石镐时石头 / 铜矿项目隐藏');
E.addItem('木材', 2); E.addItem('石头', 2);
ok(E.buyUpgrade('mining', 0).ok, '购买石镐（2 木材 + 2 石头）');
ok(E.recipeVisible(stoneR, mining) && E.recipeVisible(mrs.find(r => r.name === '铜矿'), mining), '买完石镐后最基础的石头 / 铜矿项目出现');
E.clearSlot('research', 0);
E.assignSlot('mining', mrs.indexOf(stoneR), 'player');
for (let i = 0; i < 500; i++) E.tick(0.2);
ok(E.count('石头') > 10, '采石产出 ' + E.count('石头'));

console.log('== 多配方独立入驻 ==');
S.research = 5000;
S.techs['pottery'] = true; S.techs['metal_smelting'] = true;
const sandR = mrs.find(r => r.name === '沙');
ok(E.recipeVisible(sandR, mining), '陶器科技后 沙 配方可见');
ok(!E.recipeVisible(mrs.find(r => r.name === '铀矿'), mining), '核能未研究时 铀矿 配方不可见');
E.assignSlot('mining', mrs.indexOf(sandR), 'player');
ok(E.assignedCount(mining) === 1, '同一角色只占一条配方（沙），石头被顶掉');

console.log('== 装备制造：三份工作的完整配方 ==');
const craftJob = E.JOB_BY_ID.crafting, forgeJob = E.JOB_BY_ID.forging, tailorJob = E.JOB_BY_ID.tailoring, machJob = E.JOB_BY_ID.machining;
const craftRs = E.jobRecipes(craftJob), forgeRs = E.jobRecipes(forgeJob), tailorRs = E.jobRecipes(tailorJob), machRs = E.jobRecipes(machJob);
const isGearR = r => { const id = E.N2I(r.name); return id && ['equip', 'weapon'].includes(E.ITEMS[id].cat); };
const machGear = machRs.filter(isGearR);
ok(craftRs.length === 17, '加工 17 件：' + craftRs.length);
ok(forgeRs.length === 16, '锻造 16 件（工业后装备已移到机械加工）：' + forgeRs.length);
ok(tailorRs.length === 5, '裁缝 5 件（工业后装备已移到机械加工）：' + tailorRs.length);
ok(machGear.length === 47, '机械加工新增 47 件工业 / 信息 / 太空装备：' + machGear.length);
ok(craftRs.some(r => r.name === '石斧') && craftRs.some(r => r.name === '皮甲'), '加工包含石器时代装备');
ok(!craftRs.some(r => r.name === '硅片') && !craftRs.some(r => r.name === '光纤'), '硅片 / 光纤已移出加工');
ok(E.jobRecipes(E.JOB_BY_ID.glassmaking).some(r => r.name === '光纤'), '光纤移到玻璃制造');
ok(E.jobRecipes(E.JOB_BY_ID.semiconductors).some(r => r.name === '硅片'), '硅片移到半导体制造');
let badRecipe = 0;
for (const r of [...craftRs, ...forgeRs, ...tailorRs, ...machGear]) {
  if (Object.keys(E.recipeInputs(r)).length !== Object.keys(r.inputs).length) badRecipe++;
  if (Object.keys(E.recipeOutputs(r)).length !== 1) badRecipe++;
}
ok(badRecipe === 0, '85 件装备的投料 / 产出都能映射到物品');
ok(!E.recipeVisible(craftRs.find(r => r.name === '长弓')), '长弓锁在 *缝制');
S.techs['tailoring'] = true;
ok(E.recipeVisible(craftRs.find(r => r.name === '长弓')), '研究 *缝制 后长弓可见');
E.addItem('木材', 100); E.addItem('石头', 50);
ok(E.buyUpgrade('crafting', 0).ok, '购买工作台（加工第一个升级项）');
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
E.addItem(E.SHARD_ITEM, 4000);
S.gold = 100000;
ok(E.POOLS.length === 2 && E.POOLS[0].id === 'limited' && E.POOLS[1].id === 'standard', '卡池只有 限定 / 常驻：' + E.POOLS.map(p => p.name).join(' / '));
ok(E.pull('shenren').ok === false, '旧卡池（神人俱乐部）已移除');
ok(E.ITEMS[E.SHARD_ITEM] && E.ITEMS[E.SHARD_ITEM].name === '招募券', '英雄碎片已改名为招募券');
ok(E.N2I('英雄碎片') === null && E.N2I('招募券') === 'hero_shard', '旧名不再映射、新名映射到同一物品 id');
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
ok(E.shardCount() === before - E.PULL_COST, '单抽消耗 ' + E.PULL_COST + ' 张招募券：' + (before - E.shardCount()));

// 保底窗口：第 1 抽必出角色；每抽到一次角色，下一窗口 +1 抽，封顶 10 抽（礼物也计入）
// v0.0.33：限定 / 常驻共用一个窗口（S.gacha.pity.shared / noNew.shared）
ok(E.PITY_MIN === 1 && E.PITY_MAX === 10, '保底窗口范围 1~10 抽');
S.gacha.noNew.shared = 0; S.gacha.pity.shared = 0;
const rnd = Math.random;
Math.random = () => 0.99;            // 30% 角色判定必失败 → 正常情况会出礼物
const p1s = E.pull('standard');      // 窗口 1：必出
ok(p1s.ok && p1s.type === 'new' && p1s.gen, '窗口 1：第 1 抽必出角色');
ok(S.gacha.pity.shared === 1 && E.gachaPityLimit() === 2, '出角色后窗口升到 2 抽');
ok(S.gacha.noNew.shared === 0, '出角色后本窗口计数清零');
// 窗口 2：第 1 抽礼物，第 2 抽必出
E.pull('standard');
ok(E.gachaPityLimit() === 2 && S.gacha.noNew.shared === 1, '窗口 2：第 1 抽礼物，计数 1');
const p2 = E.pull('standard');
ok(p2.ok && p2.type === 'new' && p2.gen, '窗口 2：两次抽内必出角色');
ok(!S.chars[p2.hero.id].e1, '随机普通角色没有社交恩赐');
ok(S.gacha.pity.shared === 2 && E.gachaPityLimit() === 3, '出角色后窗口升到 3 抽');
// 窗口 3：前两抽礼物，第 3 抽必出
E.pull('standard'); E.pull('standard');
ok(S.gacha.noNew.shared === 2, '窗口 3：连续 2 抽没出角色');
const p2b = E.pull('standard');
ok(p2b.ok && p2b.type === 'new' && p2b.gen && p2b.hero.id !== p2.hero.id, '窗口 3：第 3 抽必出角色，且是一张新面孔');
ok(S.gacha.pity.shared === 3 && E.gachaPityLimit() === 4, '出角色后窗口升到 4 抽');
// 提前抽到角色（非保底）也推进窗口：窗口 4 第 1 抽就出 → 下一窗口 5
S.gacha.noNew.shared = 0;
Math.random = () => 0;               // 30% 角色判定必成功
const early = E.pull('standard');
ok(early.ok && early.type === 'new' && early.gen, '窗口 4：第 1 抽提前出角色');
ok(S.gacha.pity.shared === 4 && E.gachaPityLimit() === 5, '提前出角色同样推进窗口 → 5 抽');
// 窗口封顶 10
S.gacha.pity.shared = 9; S.gacha.noNew.shared = 0;
Math.random = () => 0.99;
ok(E.gachaPityLimit() === 10, '窗口封顶 10 抽');
for (let i = 0; i < 9; i++) E.pull('standard');   // 前 9 抽礼物
const pCap = E.pull('standard');                    // 第 10 抽必出
ok(pCap.ok && pCap.type === 'new' && pCap.gen, '窗口 10：10 抽内必出角色');
ok(S.gacha.pity.shared === 10 && E.gachaPityLimit() === 10, '封顶后窗口不再增长');
Math.random = rnd;
S.gacha.pity.shared = 0; S.gacha.noNew.shared = 0;

// 限定池：第 1 抽必出有名英雄；保底优先补该池还没拥有的有名英雄（两池共用一个窗口）
const l1 = E.pull('limited');
ok(l1.ok && l1.type === 'new' && !l1.gen, '限定池第 1 抽必出有名英雄：' + (l1.hero && l1.hero.name));
ok(E.gachaPityLimit() === 2, '限定与常驻共用一个保底窗口：抽一次后窗口升到 2 抽');
for (let i = 0; i < 2 && !['dashao', 'lare'].every(id => S.chars[id]); i++) {
  S.gacha.noNew.shared = E.gachaPityLimit() - 1;
  E.pull('limited');
}
ok(['dashao', 'lare'].every(id => S.chars[id]), '限定池保底补齐两名英雄');
S.gacha.noNew.shared = E.gachaPityLimit() - 1;
const p5 = E.pull('limited');
ok(p5.ok && p5.type === 'new' && p5.gen, '英雄集齐后，限定池保底 = 全新随机普通角色（' + p5.type + '）');
// 重复角色也算「抽出角色」：同样清零并推进窗口
const limBefore = E.gachaPityLimit();
S.gacha.noNew.shared = 0;
Math.random = () => 0;               // 出角色 → 有名英雄 → 已拥有 → 星尘
const pd = E.pull('limited');
ok(pd.ok && pd.type === 'dup' && pd.n === 10, '限定池抽到重复英雄给星尘 ×10');
ok(E.gachaPityLimit() === Math.min(10, limBefore + 1), '重复角色也推进保底窗口');
Math.random = rnd;
S.gacha.pity.shared = 0; S.gacha.noNew.shared = 0;

// v0.0.29：礼物必须落到真实物品上（旧版 addItem('gift1') 会补出无图标占位物品）
ok(E.GIFTS.every(g => E.ITEMS[g.id] && E.ITEMS[g.id].kind === 'gift'), '4 档礼物 id 都是真实物品 id');
ok(E.GIFTS.map(g => g.id).join('/') === 'sticky_note/merch/collector/heirloom', '礼物 id = 便利贴/周边/典藏/传家宝');
S.gacha.pity.shared = 9; S.gacha.noNew.shared = 0;
Math.random = () => 0.999;           // 不出角色；礼物档位 roll=99.9 → 传家宝
const gp = E.pull('standard');
Math.random = rnd;
ok(gp.ok && gp.type === 'gift' && gp.gift.id === 'heirloom', '抽到传家宝：' + (gp.gift && gp.gift.name));
ok((S.items.heirloom || 0) > 0 && !S.items.gift1 && !S.items.gift2 && !S.items.gift3 && !S.items.gift4,
  '礼物进仓库的是真实物品，不再出现 gift1~gift4');
S.gacha.noNew.shared = 0;

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
ok(cr.ok && E.shardCount() === shards0 + E.CODEX_REWARD.items, '领取物品奖励 +' + E.CODEX_REWARD.items + ' 张招募券');
ok(!E.codexClaimable('items', E.N2I('木材')), '同一条目不能重复领取');
ok(E.CODEX_REWARD.enemies === 3 && E.CODEX_REWARD.chars === 5, '敌人 3 / 角色 5 张招募券');
const allc = E.codexClaimAll();
ok(E.codexUnclaimed().total === 0, '一键领取后没有待领：领取 ' + allc.count + ' 项 → ' + allc.n + ' 张招募券');

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
// v0.0.29：旧礼物 gift1~gift4 → 真实物品 id
const giftOld = E.newState('礼物迁移');
giftOld.items = { gift1: 3, gift2: 2, gift3: 1 };
giftOld.seen.items = { gift1: true };
giftOld.ever = { gift1: 1 };
const migGift = E.migrate(giftOld);
ok(migGift.items.sticky_note === 3 && migGift.items.merch === 2 && migGift.items.collector === 1,
  '旧礼物 gift1~3 → 便利贴 / 周边 / 典藏：' + JSON.stringify(migGift.items));
ok(!migGift.items.gift1 && !migGift.items.gift2 && migGift.seen.items.sticky_note && migGift.ever.sticky_note,
  '旧礼物不在仓库/图鉴/曾经拥有里残留 gift1');
// v0.0.30：药剂工作 / 药剂精通书 → 医疗
const pharmOld = E.newState('药剂迁移');
pharmOld.items = { book_alchemy: 2 };
pharmOld.seen.items = { book_alchemy: true };
pharmOld.ever = { book_alchemy: 1 };
pharmOld.jobs.pharmacy = { slots: [], prog: [], blocked: [], up: [1, 1, 0, 0], upVer: 2 };
pharmOld.jobs.husbandry = { slots: [null, 'player'], prog: [0, 0], blocked: [null, null], up: [1, 0, 0, 0], upVer: 2 };
const migPharm = E.migrate(pharmOld);
ok(!migPharm.jobs.pharmacy && migPharm.items.book_medicine === 2, '药剂工作删除、药剂精通书并入医疗精通书');
ok(migPharm.seen.items.book_medicine && migPharm.ever.book_medicine && !migPharm.seen.items.book_alchemy, '药剂精通书的图鉴 / 曾经拥有同步迁移');
ok(Array.isArray(migPharm.jobs.husbandry.animals) && migPharm.jobs.husbandry.animals.length === 0, '旧档畜牧自动补齐 animals 数组');
// v0.0.30：锻造 / 裁缝配方变短，旧存档里指向已移走装备的幽灵槽要清掉
const ghostOld = E.newState('幽灵槽迁移');
ghostOld.jobs.forging.slots = new Array(51).fill(null);
ghostOld.jobs.forging.slots[40] = 'player';
ghostOld.jobs.forging.prog = new Array(51).fill(0.5);
const migGhost = E.migrate(ghostOld);
ok(migGhost.jobs.forging.slots.length === 16 && migGhost.jobs.forging.slots[40] === undefined, '旧锻造槽 40 → 裁掉（16 件配方）');
// v0.0.31：药草作物删除 → 数量并入药草，角色选中的旧食物清空
const herbOld = E.newState('药草迁移');
herbOld.items = { herb_crop: 4, herb: 1 };
herbOld.chars.player.food = 'herb_crop';
const migHerb = E.migrate(herbOld);
ok(!('herb_crop' in migHerb.items) && migHerb.items.herb === 5, '药草作物数量并入药草：' + JSON.stringify(migHerb.items));
ok(migHerb.chars.player.food === null, '旧存档选中药草作物作为食物 → 清空选择');
ok(migHerb.ever.herb === 1, '药草记为曾经拥有');
E.S = migGhost;
ok(E.assignedCount(E.JOB_BY_ID.forging) === 0, '幽灵槽不再被算作「N 人在工作」');

console.log('== 袭击 ==');
E.S = S;   // 回到主测试存档（前面的迁移用例换过 E.S）
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
unlockWood(E.S);
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
unlockWood(E.S);
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
// 离线结算后 5 秒内静音：不给玩家刷几十条「获得物品」
const mutedLoot = [];
window.UI = { loot: (id, n) => mutedLoot.push([id, n]) };
E.addItem('木材', 1);
ok(mutedLoot.length === 0, '离线结算后短时间内的产出不逐条弹（由离线弹窗汇总）');
window.UI = undefined;

console.log('== 界面：消耗栏缺料标红 ==');
require('../js/ui.js');
const U = window.UI;
E.S = E.newState('界面测试');
E.S.techs.writing = true;    // 开启商店
const shopHtml = U.pageShop();
ok(shopHtml.includes('data-tip-item=') && shopHtml.includes('buyPotion'), '商店所有商品（货架 + 常驻）都能悬停看面板');
ok(shopHtml.includes('升星药水') && shopHtml.includes('精通 +10'), '升星药水与精通书以卡片形式常驻在商店');
ok(!shopHtml.includes('买入价 = 卖出价'), '商店不再写买入价规则说明');
ok(U.itemTipHtml(E.N2I('升星药水')).includes('兑换价') && !U.itemTipHtml(E.N2I('升星药水')).includes('买入价'), '升星药水面板显示 3 星尘兑换价');
const recHtml = U.pageRecruit();
ok(!recHtml.includes('使用招募券概率获取到角色'), '招募页已删除顶部「使用招募券概率获取到角色」');
ok(recHtml.includes('保底 ') && recHtml.includes('shardbadge') && !recHtml.includes('每次都是新的') && !recHtml.includes('好感随送礼提升'), '招募页页头显示共用保底徽章与招募券徽章，旧说明不再出现');
ok(recHtml.includes('出角色 <b class="green">30%</b> · 好感度礼物 <b>70%</b>'), '卡池下方显示 30% 角色 / 70% 好感度礼物');
ok(recHtml.includes('便利贴 35.0%') && recHtml.includes('传家宝 3.5%'), '卡池下方列出礼物档位概率');
ok(!recHtml.includes('随机普通角色 100%') && recHtml.includes('好感度礼物'), '删除旧构成说明，卡池追加好感度礼物');
ok(recHtml.includes('data-tip-item="hero_shard"'), '页头招募券徽章可悬停看物品面板');
ok(!recHtml.includes('gift1'), '招募页不出现 gift1 占位 id');
ok(recHtml.includes('av md'), '卡池角色头像改用 56px 的 md 尺寸（不再缩成 32px）');
const lareC = E.newChar('lare', { name:'Laremehpe', kind:'hero', pool:'limited', gen:false, job:'科研', hp:8, atk:10, str:8, def:8, stars:1 });
E.S.chars.lare = lareC; E.S.order.push('lare');
ok(U.pageRecruit().includes('class="avwrap"'), '已拥有角色列表显示头像');
delete E.S.chars.lare; E.S.order = E.S.order.filter(id => id !== 'lare');
const housingHtml = U.pageHousing();
ok(housingHtml.includes('住房能提高角色上限'), '住所页描述精简为一句');
ok(!housingHtml.includes('茅草棚') && !housingHtml.includes('陶罐装饰'), '没拥有过所需资源时，住房 / 舒适度升级项不显示');
E.addItem('木材', 1); E.addItem('石头', 1);
ok(U.pageHousing().includes('茅草棚'), '拥有过 1 木材 + 1 石头后，茅草棚出现');
E.addItem('陶器', 1);
ok(U.pageHousing().includes('陶罐装饰') && !U.pageHousing().includes('木床'), '有陶器 → 陶罐装饰出现；缺石材时木床仍不显示');
E.addItem('石材', 1);
ok(U.pageHousing().includes('木床'), '木材 + 石材都拥有过 → 木床出现');
E.ITEMS.__noera = { name: '无时代物品', cat: 'material', storage: 'warehouse', price: 1 };
const noEraTip = U.itemTipHtml('__noera');
ok(!!noEraTip && !noEraTip.includes('未标时代'), '没有 era 的物品不显示时代标签');
delete E.ITEMS.__noera;
ok(U.srcText('医疗（药剂配方 + 化学燃料）') === '医疗' && !U.itemTipHtml(E.N2I('闪耀医药')).includes('药剂配方'),
  '物品面板「获取」只写来源，不展开配方');
const favC = E.newChar('lare', { name:'Laremehpe', kind:'hero', pool:'limited', gen:false, job:'科研', hp:8, atk:10, str:8, def:8, stars:1 });
favC.favor = 60;
E.S.chars.lare = favC; E.S.order.push('lare'); E.S.ui.charSel = 'lare';
const charHtml = U.pageCharacters();
ok(charHtml.includes('特长：科研 +20% 工作速度') && !charHtml.includes('随机普通角色：'), '角色页特长文案改成「特长：工作 +N% 工作速度」');
ok((charHtml.match(/data-tip-favor=/g) || []).length === 3, '好感度条标出 25 / 50 / 100 三个节点');
ok(U.favorTipHtml('lare', 50).includes('波浪式地向前进') && U.favorTipHtml('lare', 50).includes('已激活'), '好感度节点悬浮说明带恩赐与激活状态');
delete E.S.chars.lare; E.S.order = E.S.order.filter(id => id !== 'lare'); E.S.ui.charSel = 'player';
E.S = E.newState('防御显示');
ok(!U.pageDefense().includes('尖木陷阱'), '没拥有过木材 + 石头时，防御工事不显示');
E.addItem('木材', 1); E.addItem('石头', 1);
ok(U.pageDefense().includes('尖木陷阱'), '拥有过所需资源后，尖木陷阱出现');
ok(U.pageDefense().includes('每隔一段时间会有袭击发生'), '防御页描述精简为一句');
delete E.S.techs.writing;
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

console.log('== 界面：gacha 标签与页头提示（v0.0.31）==');
E.S = E.newState('标签与提示');
const gachaTip = U.itemTipHtml(E.N2I('升星药水'));
ok(!gachaTip.includes('gacha'), '抽卡类物品不再露出 gacha 内部标签');
ok(gachaTip.includes('抽卡') && gachaTip.includes('升星道具'), '升星药水只显示「抽卡」「升星道具」');
E.S.techs['animal_husbandry'] = true;
E.S.jobs.husbandry.up[0] = 1;
const hintHubHtml = U.pageJob('husbandry');
ok(!hintHubHtml.includes('把头像拖到下方') && !hintHubHtml.includes('每个项目独立入驻') &&
   !hintHubHtml.includes('首次拥有 1 份所需资源后永久显示') && !hintHubHtml.includes('有人入驻、草料够时'),
   '工作页右侧操作提示全部删除');
ok(hintHubHtml.includes('喂养畜群') && hintHubHtml.includes('畜牧产物') && hintHubHtml.includes('可用角色'), '删除提示后内容区仍然完整');
E.S.milestones.research_ready = true;
const hintResHtml = U.pageJob('research');
ok(!hintResHtml.includes('研究消耗科研点'), '科研页不再显示「研究消耗科研点」');
ok(hintResHtml.includes('科技树'), '科研页标题与科技树仍在');

console.log('== 袭击：时代基数 ×0.1（v0.0.20）==');
const raidBase = Object.fromEntries(E.PR.raidEra.map(r => [r.id, r.base]));
ok(raidBase.stone === 80 && raidBase.medieval === 300 && raidBase.industrial === 650 &&
   raidBase.info === 1450 && raidBase.space === 3000, '时代基数 80/300/650/1450/3000');
ok(E.raidGuard === undefined, '已移除早期保护缩放');
E.S = E.newState('低战力袭击');
E.S.techs.writing = true;    // 直接进入中世纪（1/8 进度）
const lowPower = E.basePower();
const lowSamples = Array.from({ length: 120 }, () => E.raidStrength());
const lowMin = Math.min(...lowSamples), lowMax = Math.max(...lowSamples);
ok(lowPower === 12 && lowMin >= 100 && lowMax <= 200, '中世纪 1/8 进度：战力 ' + lowPower + ' → 强度 ' + lowMin + '~' + lowMax);

console.log('== 链式升级：伐木 / 采矿 石→铜→铁（v0.0.23）==');
ok(E.JOB_BY_ID.woodcutting.upgrades.slice(0, 3).map(u => u.name).join('/') === '石斧/铜斧/铁斧', '伐木前三档 = 石斧/铜斧/铁斧');
ok(E.JOB_BY_ID.mining.upgrades.slice(0, 3).map(u => u.name).join('/') === '石镐/铜镐/铁镐', '采矿前三档 = 石镐/铜镐/铁镐');
E.S = E.newState('链式升级');
['木材', '石头', '铜锭', '铁锭'].forEach(n => { E.S.items[E.N2I(n)] = 500; });
ok(E.buyUpgrade('woodcutting', 1).why === '未解锁', '未买石斧 / 无科技：买不了铜斧');
ok(E.buyUpgrade('woodcutting', 0).ok, '买石斧成功');
const metalTech = E.TECHS.find(t => t.name === '金属冶炼').id;
ok(E.buyUpgrade('woodcutting', 1).why === '未解锁', '石斧已买但无 *金属冶炼：铜斧仍未解锁');
E.S.techs[metalTech] = 1;
ok(E.buyUpgrade('woodcutting', 1).ok, '石斧 + *金属冶炼 → 铜斧可买');
ok(E.buyUpgrade('woodcutting', 2).ok, '铜斧之后 → 铁斧可买');
const woodBonus = E.JOB_BY_ID.woodcutting.upgrades.reduce((a, u, i) => a + (E.S.jobs.woodcutting.up[i] ? u.bonusPct : 0), 0);
ok(woodBonus === 50, '石斧不再加工作速度；铜斧 + 铁斧合计 +50%：' + woodBonus);
ok(E.JOB_BY_ID.woodcutting.upgrades[0].bonusPct === 0 && E.upgradeDesc(E.JOB_BY_ID.woodcutting, 0) === '解锁伐木项目',
  '石斧描述 = 解锁伐木项目（代码生成）、不加工作速度');
ok(E.JOB_BY_ID.mining.upgrades[0].bonusPct === 0 && E.upgradeDesc(E.JOB_BY_ID.mining, 0) === '解锁采石项目',
  '石镐描述 = 解锁采石项目（代码生成）、不加工作速度');
ok(E.upgradeDesc(E.JOB_BY_ID.research, 0) === '解锁科研项目', '基础研究桌描述 = 解锁科研项目');
ok(E.upgradeDesc(E.JOB_BY_ID.husbandry, 0).indexOf('解锁加工草料、喂养畜群项目') === 0, '畜牧门槛档列出两个项目');
const badGate = [];
E.JOBS.forEach(j => {
  const gate = E.jobRecipeGate(j);
  if (gate == null) return;
  const u = j.upgrades && j.upgrades[gate];
  const desc = E.upgradeDesc(j, gate);
  if (!u || u.bonusPct !== 0 || E.upgradeBonus(j, gate, u) !== 0 || desc.indexOf('解锁') !== 0) {
    badGate.push(j.name + ' → ' + desc);
  }
});
ok(badGate.length === 0, '所有门槛档 0 产出、说明由项目名生成：' + (badGate.join('；') || '无'));
const hardcodedUnlock = [];
E.JOBS.forEach(j => {
  const gate = E.jobRecipeGate(j);
  const u = gate == null ? null : (j.upgrades || [])[gate];
  if (u && u.note && u.note.indexOf('解锁') === 0) hardcodedUnlock.push(j.name);
});
ok(hardcodedUnlock.length === 0, '门槛档不再手写「解锁…」说明：' + (hardcodedUnlock.join('、') || '无'));
['woodcutting', 'mining', 'gathering'].forEach(jid => {
  const u = E.JOB_BY_ID[jid].upgrades.find(x => x.name.endsWith('小屋'));
  ok(!!u && u.cost['石材'] === 150 && !u.cost['石头'], jid + ' 小屋改用石材：' + JSON.stringify(u && u.cost));
});
ok(E.S.jobs.woodcutting.up.length === E.JOB_BY_ID.woodcutting.upgrades.length, 'up 数组长度跟随档位数');
// 旧存档迁移：旧下标 [石斧, 小屋] / [石镐, 采矿场, 电动矿钻]
const oldSave = E.newState('旧档');
oldSave.jobs.woodcutting.up = [1, 1, 0, 0]; delete oldSave.jobs.woodcutting.upVer;
oldSave.jobs.mining.up = [1, 0, 1, 0, 0, 1]; delete oldSave.jobs.mining.upVer;
const migSave = E.migrate(oldSave);
ok(JSON.stringify(migSave.jobs.woodcutting.up) === JSON.stringify([1, 0, 0, 1, 0, 0]), '旧伐木档位按名字迁移：石斧 + 伐木小屋');
ok(JSON.stringify(migSave.jobs.mining.up) === JSON.stringify([1, 0, 0, 0, 1, 0, 0, 1]), '旧采矿档位按名字迁移：石镐 + 采矿场 + 电动矿钻');
// 界面：上一档没买 / 科技没点亮时，下一档卡不出现
E.S = E.newState('链式卡片');
E.S.milestones.wood_stone = true;
['木材', '石头', '铜锭', '铁锭'].forEach(n => E.addItem(n, 500));
const lockedHtml = U.pageJob('woodcutting');
ok(lockedHtml.includes('石斧') && !lockedHtml.includes('铜斧'), '未点亮 *金属冶炼：只显示石斧');
E.S.techs[metalTech] = 1;
const stillLocked = U.pageJob('woodcutting');
ok(!stillLocked.includes('铜斧'), '科技有了但石斧没买：铜斧仍不显示');
E.buyUpgrade('woodcutting', 0);
const chainHtml = U.pageJob('woodcutting');
ok(chainHtml.includes('铜斧'), '石斧买完：铜斧出现');
ok(chainHtml.includes('解锁伐木项目'), '升级卡显示代码生成的解锁说明');
ok(chainHtml.includes('工作速度 +25%') && !chainHtml.includes('产出 +25%'), '升级卡加成文案 = 工作速度 +25%');
E.S.milestones.research_ready = true;
const researchUpHtml = U.pageJob('research');
ok(researchUpHtml.includes('解锁科研项目') && !researchUpHtml.includes('产出 +25%'), '科研升级卡显示「解锁科研项目」而不是产出加成');

console.log('== 升级项：首次拥有 1 份资源后永久显示（v0.0.27）==');
E.S = E.newState('升级显示');
E.addItem('木材', 1); E.addItem('石头', 1);
const upHtml1 = U.pageJob('woodcutting');
ok(upHtml1.includes('石斧'), '拿到 1 木材 + 1 石头后石斧升级项出现');
E.S.items = {};   // 花光资源
const upHtml2 = U.pageJob('woodcutting');
ok(upHtml2.includes('石斧'), '资源花光后石斧升级项仍然显示（永久）');
ok(!upHtml1.includes('先购买升级项') && !upHtml1.includes('木材 ×1'), '没买石斧时不再显示「先购买升级项」提示');
// 科研 30% 门槛
E.S = E.newState('科研门槛');
E.addItem('木材', 30); E.addItem('石头', 15);
ok(E.S.milestones.research_ready && E.jobVisible(E.JOB_BY_ID.research), '30 木材 + 15 石头 → 科研永久显示');
E.S.items = {};
ok(E.jobVisible(E.JOB_BY_ID.research), '花光后科研仍然显示（永久）');

console.log('== 补给栏：食物增益 / 医物消耗（v0.0.27）==');
E.S = E.newState('补给测试');
const pc = E.S.chars.player;
E.addItem('素餐', 10);
pc.food = E.N2I('素餐');
ok(E.foodXpMult(pc) === 1.25, '素餐：精通经验 ×1.25');
E.addItem('肉餐', 10);
pc.food = E.N2I('肉餐');
ok(E.charStats(pc).str === 11 && E.charStats(pc).atk === 11, '肉餐：命中 / 力量 +10 级（1 → 11）');
E.addItem('均衡餐', 10);
pc.food = E.N2I('均衡餐');
ok(E.foodSpeedMult(pc) === 1.25, '均衡餐：工作速度 ×1.25');
pc.food = E.N2I('素餐'); E.S.items[E.N2I('素餐')] = 0;
ok(E.foodXpMult(pc) === 1 && !E.activeFoodId(pc), '选中的食物粮仓没货 → 不生效');
E.S.items[E.N2I('素餐')] = 3;
const beforeMeal = E.count('素餐');
for (let i = 0; i < 10; i++) E.tick(0.2);
ok(E.count('素餐') < beforeMeal, '选中食物被优先消耗：' + beforeMeal.toFixed(2) + ' → ' + E.count('素餐').toFixed(2));
E.addItem('草药', 3);
pc.med = E.N2I('草药'); pc.hpNow = 1;
E.markInjured(pc);
const beforeHerb = E.count('草药');
for (let i = 0; i < 10; i++) E.tick(0.2);
ok(pc.injured && pc.hpNow > 1, '受伤后医物提高回血：HP ' + pc.hpNow.toFixed(3));
ok(E.count('草药') < beforeHerb, '受伤后消耗草药：' + beforeHerb + ' → ' + E.count('草药'));
ok(E.jobVisible(E.JOB_BY_ID.medicine), '有人受伤后医疗永久显示');
ok(E.recipeVisible(E.jobRecipes(E.JOB_BY_ID.gathering)[2], E.JOB_BY_ID.gathering), '有人受伤后沼泽项目永久显示');
const medTip = U.itemTipHtml(E.N2I('草药'));
ok(medTip.includes('医物效果') && medTip.includes('×2'), '草药悬浮面板显示医物 ×2 回血');
console.log('== 资源包：极简提示 + 逐项揭示 ==');
const ES = E.S;
const grassId = E.N2I('草地资源');
ES.bundleSeen = {};
E.addItem('谷物种子', 1);                 // 别处获得种子，不代表在草地上见过
let grassTip = U.itemTipHtml(grassId);
ok(!grassTip.includes('ttHead') && !grassTip.includes('经济') && !grassTip.includes('获取') && !grassTip.includes('产物列表') && !grassTip.includes('资源包'), '资源包提示不再显示图标 / 标签 / 经济 / 获取');
ok(!grassTip.includes('谷物种子') && !grassTip.includes('植物纤维'), '未在该包抽到过的产物全部遮住');
ok((grassTip.match(/？/g) || []).length === 6 && grassTip.includes('90%') && grassTip.includes('2%'), '六项全部显示 ？ + 概率：' + grassTip);
const oldRandom = Math.random;
Math.random = () => 0;                    // 草地第一个产物 = 植物纤维
const grassGot = E.addProducedItem(grassId, 1);
Math.random = oldRandom;
ok(grassGot === 1 && ES.bundleSeen[grassId] && ES.bundleSeen[grassId].plant_fiber, '实际抽到后才记录该包已发现植物纤维：' + grassGot + '/' + JSON.stringify(ES.bundleSeen));
grassTip = U.itemTipHtml(grassId);
ok(grassTip.includes('植物纤维') && grassTip.includes('90%') && (grassTip.match(/？/g) || []).length === 5, '揭示植物纤维，其余仍为 ？：' + grassTip);

console.log('== v0.0.30：项目门槛 / 石油 / 种植 / 医疗 / 畜牧 / 武器特性 ==');
E.S = E.newState('新内容测试');
const NS = E.S;
ok(!E.JOB_BY_ID.pharmacy && !!E.JOB_BY_ID.oil_extraction, '药剂工作删除，新增石油开采');
ok(E.JOB_BY_ID.oil_extraction.tech === '蒸汽机', '石油开采由 *蒸汽机 解锁');
ok(E.jobRecipes(E.JOB_BY_ID.mining).every(r => r.name !== '石油'), '采矿不再产出石油');
ok(!!E.N2I('石油开采精通书') && !E.N2I('药剂精通书'), '精通书：新增石油开采、删除药剂');
const techSteam = E.TECHS.find(t => t.name === '蒸汽机');
const techMed = E.TECHS.find(t => t.name === '医疗');
ok(techSteam.unlocks.some(u => u.includes('石油开采')), '科技树：蒸汽机点亮石油开采');
ok(techMed.unlocks.some(u => u.includes('医疗')), '科技树：医疗科技改为点亮医疗的药剂配方');

// 项目门槛：所有常规工作（采集除外）都要先买第一个升级项
const forging = E.JOB_BY_ID.forging;
E.S.techs['forging'] = true;
const forgeFirst = E.jobRecipes(forging)[0];
ok(!E.recipeVisible(forgeFirst, forging), '没买铁砧时锻造项目隐藏');
E.S.jobs.forging.up[0] = 1;
ok(E.recipeVisible(forgeFirst, forging), '买完铁砧后锻造项目出现');
const gatedJobs = E.JOBS.filter(j => {
  if (j.special || j.id === 'gathering') return false;
  const js = E.S.jobs[j.id], u = (j.upgrades || [])[0];
  return !!u && !(js.up && js.up[0]);
});
const visibleGated = gatedJobs.filter(j => E.recipeVisible(E.jobRecipes(j)[0], j));
ok(visibleGated.length === 0, '除采集外全部工作未买第一档时都没有项目：' + visibleGated.map(j => j.name).join('、'));

// 矛盾审计：第一档升级不能依赖本工作自己的产物（若有其它来源则允许）
const JOB_NAMES = E.JOBS.map(j => j.name);
const selfRef = [];
E.JOBS.forEach(j => {
  if (j.special || j.id === 'gathering') return;
  const u = (j.upgrades || [])[0];
  if (!u) return;
  Object.keys(u.cost || {}).forEach(name => {
    const it = E.ITEMS[E.N2I(name)];
    if (!it || !it.src || it.src.indexOf(j.name) < 0) return;
    const other = JOB_NAMES.some(n => n !== j.name && it.src.indexOf(n) >= 0);
    if (!other) selfRef.push(j.name + ' 依赖 ' + name);
  });
});
ok(selfRef.length === 0, '第一档升级项没有「自己产自己」的矛盾：' + (selfRef.join('；') || '无'));

// 种植：按种子拆项目 + 干草（v0.0.32：药草直接产药草，草料只由干草产）
const farmRs = E.jobRecipes(E.JOB_BY_ID.farming);
ok(farmRs.length === 6 && farmRs.map(r => r.name).join('/') === '谷物/豆类/蔬菜/甜菜/药草/干草', '种植 6 个项目：5 种种子 + 干草');
ok(Object.keys(farmRs.find(r => r.name === '甜菜').inputs).join(',') === '甜菜种子', '甜菜项目吃甜菜种子');
const hayR = farmRs.find(r => r.name === '干草');
ok(Object.keys(hayR.inputs).length === 0 && hayR.outputs['草料'] === 6, '干草不消耗、产出 6 草料');
const herbR = farmRs.find(r => r.name === '药草');
ok(herbR.outputs['药草'] === 6 && !('草料' in herbR.outputs), '药草项目直接产 6 药草，不产草料');
ok(farmRs.filter(r => r !== herbR && r !== hayR).every(r => !('草料' in r.outputs)), '其余 4 个作物项目都不产草料');
ok(E.N2I('药草作物') === null && !E.ITEMS.herb_crop, '药草作物已删除');

// 医疗：药剂工作合并
const medRs = E.jobRecipes(E.JOB_BY_ID.medicine);
ok(medRs.length === 4 && medRs.some(r => r.name === '草药药剂') && medRs.some(r => r.name === '医药') && medRs.some(r => r.name === '闪耀医药'), '医疗合并了药剂 3 个配方');
const medJob = E.JOB_BY_ID.medicine;
ok(medJob.upgrades[0].name === '研钵' && medJob.upgrades[1].name === '药剂实验室', '医疗床→研钵，医疗设备→药剂实验室');

// 医物 / 草料文案（v0.0.31）：不显示适用时代、不写「只有受伤时才会消耗」、用途不背数值
const potionId = E.N2I('草药药剂');
const potionTip = U.itemTipHtml(potionId);
ok(!potionTip.includes('适用时代') && !potionTip.includes('只有角色受伤时'), '医物面板删掉「适用时代」行与消耗说明');
ok(potionTip.includes('通用') && potionTip.includes('医物'), 'era:cross 显示为「通用」，分类仍是医物');
ok(potionTip.includes('回血速度') && potionTip.includes('消耗间隔'), '医物面板保留回血速度 / 消耗间隔');
ok(E.ITEMS[potionId].use === '补给栏 · 医物', '医物用途只写「补给栏 · 医物」：' + E.ITEMS[potionId].use);
const fodderIt = E.ITEMS[E.N2I('草料')];
ok(fodderIt.use === '畜牧饲料' && !/人不能吃/.test(fodderIt.use), '草料用途不再写「人不能吃」');

// 畜牧：容量 / 动物 / 喂养与产出分离（v0.0.31）
ok(Object.keys(E.HUSBANDRY_ANIMALS).length === 16 && !E.HUSBANDRY_ANIMALS['机械兽'] && !E.HUSBANDRY_ANIMALS['硅基生物'], '16 种可畜牧动物，机械兽 / 硅基生物除外');
ok(E.HUSBANDRY_ANIMALS['野山羊'].outputs['毛料'] === 1, '野山羊提供毛料（纺织 / 裁缝的羊毛来源）');
ok(E.JOB_BY_ID.husbandry.upgrades[0].cost['石材'] && !E.JOB_BY_ID.husbandry.upgrades[0].cost['草料'], '圈舍用木材 + 石材启动，不卡草料');
ok(E.JOB_BY_ID.medicine.upgrades[0].cost['石头'] && !E.JOB_BY_ID.medicine.upgrades[0].cost['药草'], '研钵用木材 + 石头启动，不卡药草');
const hubRs = E.jobRecipes(E.JOB_BY_ID.husbandry);
ok(hubRs.length === 2 && hubRs[0].name === '加工草料' && hubRs[1].name === '喂养畜群' && hubRs[1].feed === true,
  '畜牧项目 = 加工草料 + 喂养畜群');
ok(E.husbandryFeedDuration() === 24, '喂养周期 24 秒 = 1 天');
ok(E.husbandryCapacity() === 5, '初始畜牧容量 5');
NS.jobs.husbandry.up[0] = 1;
ok(E.husbandryCapacity() === 10, '圈舍 +5 → 10');
NS.jobs.husbandry.up[2] = 1;
ok(E.husbandryCapacity() === 25, '大型牧场 +15 → 25');
ok(!E.addHusbandryAnimal('兔子').ok, '认知度未满 100 不能圈养');
NS.chars.player.know = { '兔子': 100, '熊': 100, '犀牛': 100 };
E.S.techs['animal_husbandry'] = true;
ok(E.addHusbandryAnimal('兔子').ok && E.husbandryUsed() === 0.5, '兔子占 0.5 容量');
ok(E.addHusbandryAnimal('熊').ok && E.husbandryUsed() === 3.5, '熊占 3 容量');
NS.jobs.husbandry.animals = [];          // 换成一只长周期动物：验证「喂养满只扣草料、不产物品」
E.addHusbandryAnimal('犀牛');
ok(E.husbandryFeedCost() === 1, '喂养一次消耗 = 所有动物草料之和（1 只犀牛 = 1 草料）');
E.addHusbandryAnimal('兔子');
ok(E.husbandryFeedCost() === 2, '再加一只兔子 → 每次 2 草料');
E.removeHusbandryAnimal(1);
E.addItem('草料', 10);
E.assignSlot('husbandry', 1, 'player');
const hubSpd = E.husbandrySpeed();
const oneCycle = 24 / hubSpd;            // 喂养条从 0 到满需要的秒数
const meat0 = E.count('肉类食材'), hay0 = E.count('草料');
E.produceJob('husbandry', oneCycle * 0.5);
ok(E.count('草料') === hay0 && E.count('肉类食材') === meat0 && E.husbandryAnimals()[0].prog > 0,
  '喂养条未满：动物进度推进，但不扣草料、不产物品');
E.produceJob('husbandry', oneCycle * 0.5 + 1e-6);
ok(E.count('草料') === hay0 - 1, '喂养条填满只扣 1 草料');
ok(E.count('肉类食材') === meat0, '喂养条填满不直接产物品（犀牛 42 秒 / 次还没满）');
const animalNeed = (E.HUSBANDRY_ANIMALS['犀牛'].duration - 24) / hubSpd;
E.produceJob('husbandry', animalNeed + 0.05);
ok(E.count('肉类食材') > meat0, '只有动物自己的进度条满才产出：' + E.count('肉类食材'));
NS.jobs.husbandry.prog[1] = 0;
NS.items[E.N2I('草料')] = 0;
const hubProg0 = E.husbandryAnimals()[0].prog;
for (let i = 0; i < 10; i++) E.produceJob('husbandry', 0.2);
ok(Math.abs(E.husbandryAnimals()[0].prog - hubProg0) < 1e-9 && NS.jobs.husbandry.blocked[1] === 'input',
  '没有入驻角色持续喂草料时，动物进度条停止');
const hubHtml = U.pageJob('husbandry');
ok(hubHtml.includes('penGrid') && hubHtml.includes('bigplus') && hubHtml.includes('畜牧容量'), '畜牧页渲染网格 + 大＋虚线框 + 畜牧容量');
ok(hubHtml.includes('喂养畜群') && hubHtml.includes('data-tip-hub') && hubHtml.includes('畜牧产物'),
  '喂养项目卡显示汇总「畜牧产物」徽章');
const iProj = hubHtml.indexOf('>项目<'), iHub = hubHtml.indexOf('>畜牧<'), iUpg = hubHtml.indexOf('>升级项<');
ok(iProj >= 0 && iHub > iProj && iUpg > iHub, '畜牧独立成栏，位置在 项目 与 升级项 之间');
const hubTip = U.husbandryTipHtml();
ok(hubTip.includes('犀牛') && hubTip.includes('肉类食材'), '畜牧产物悬停列出每只动物的产物');
const animalN = E.husbandryAnimals().length;
E.removeHusbandryAnimal(0);
ok(E.husbandryAnimals().length === animalN - 1, '可以移除畜牧格里的动物');
E.S.techs['animal_husbandry'] = true;
const hubPick = U.ioList(E.HUSBANDRY_ANIMALS['兔子'].outputs);
ok(hubPick.includes('肉类食材'), '动物列表面板能显示产出');

// 随机普通角色名字：加入其它国家 / 地区译名
const genNames = [];
for (let i = 0; i < 300; i++) genNames.push(E.makeNormal().name);
ok(genNames.some(n => n.indexOf('·') >= 0), '随机名字包含其它国家 / 地区译名：' + genNames.filter(n => n.indexOf('·') >= 0).slice(0, 3).join('、'));
ok(new Set(genNames).size > 100, '随机名字组合足够多：' + new Set(genNames).size + ' 种');

// 种植：甜菜项目按种子产出甜菜
E.S = E.newState('种植测试');
E.S.techs['crop_farming'] = true;
E.S.jobs.farming.up[0] = 1;
E.addItem('甜菜种子', 10);
const beetIdx = E.jobRecipes(E.JOB_BY_ID.farming).findIndex(r => r.name === '甜菜');
E.assignSlot('farming', beetIdx, 'player');
for (let i = 0; i < 100; i++) E.produceJob('farming', 0.2);
ok(E.count('甜菜') > 0 && E.count('甜菜种子') < 10, '甜菜项目消耗甜菜种子、产出甜菜：' + E.count('甜菜'));

// 药草项目：药草种子 → 药草（仓库材料），不产草料
E.S = E.newState('药草种植');
E.S.techs['crop_farming'] = true;
E.S.jobs.farming.up[0] = 1;
E.addItem('药草种子', 10);
const herbIdx = E.jobRecipes(E.JOB_BY_ID.farming).findIndex(r => r.name === '药草');
E.assignSlot('farming', herbIdx, 'player');
for (let i = 0; i < 100; i++) E.produceJob('farming', 0.2);
ok(E.count('药草') > 0 && E.count('药草种子') < 10, '药草项目消耗药草种子、产出药草：' + E.count('药草'));
ok(E.count('草料') === 0, '药草项目不产草料');

// 石油开采：独立工作产出石油，采矿不再出石油
E.S = E.newState('石油测试');
E.S.techs['steam_engine'] = true;
E.S.power.built.steam = true;          // 石油开采耗电 0.4 瓦：先有电才转
E.S.jobs.oil_extraction.up[0] = 1;
E.assignSlot('oil_extraction', 0, 'player');
for (let i = 0; i < 100; i++) E.produceJob('oil_extraction', 0.2);
ok(E.count('石油') > 0, '石油开采产出石油：' + E.count('石油'));

// 武器特性描述已删除
ok(Object.keys(E.WEAPON_COMBAT).every(k => !('special' in E.WEAPON_COMBAT[k])), 'WEAPON_COMBAT 不再有特性文本');
require('../js/ui.js');
const U2 = window.UI;
ok(!U2.itemTipHtml(E.N2I('石斧')).includes('特性'), '武器悬浮面板不再显示特性行');

// 战斗日志：双方伤害 / 攻击间隔
E.S = E.newState('战斗日志测试');
E.S.techs['bow'] = true;
Object.assign(E.S.chars.player.lv, { hp: 50, atk: 50, str: 50, def: 50 });
E.S.chars.player.hpNow = 500;
E.assignSlot('hunting', 0, 'player');
const csLog = E.combatState('hunting');
csLog.logs = [];
for (let i = 0; i < 200; i++) E.tick(0.2);
ok(csLog.logs.some(l => l.kind === 'hit' && l.msg.includes('造成')), '战斗日志记录我方造成的伤害');
ok(csLog.logs.some(l => l.msg.includes('攻击') && (l.kind === 'taken' || l.kind === 'miss')), '战斗日志记录敌方攻击 / 未命中');
ok(csLog.logs.some(l => l.kind === 'kill'), '战斗日志记录击杀与掉落');
ok(typeof csLog.tP === 'number' && csLog.tP >= 0 && typeof csLog.tE === 'number' && csLog.tE >= 0, '攻击间隔进度保存在战斗状态里：tP=' + csLog.tP.toFixed(2) + ' / tE=' + csLog.tE.toFixed(2));

console.log('== 英雄立绘（v0.0.25）==');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
['dashao', 'lare'].forEach(id => {
  const p = E.heroDef(id).portrait;
  ok(!!p && fs.existsSync(path.join(ROOT, p)), '立绘文件存在：' + id + ' → ' + p);
});
const dashaoArt = U.avatar({ cid: 'dashao', kind: 'hero', name: '大少' }, 'lg');
ok(dashaoArt.includes('assets/portraits/dashao.jpg') && dashaoArt.includes('<img'), '大少头像渲染为立绘图片');
ok(dashaoArt.includes('?v=' + E.APP_VERSION.replace(/^v/, '')), '立绘 URL 带版本号缓存串');
const randArt = U.avatar({ cid: 'gen9', gen: true, name: '林子墨' });
ok(!randArt.includes('<img') && randArt.includes('林'), '随机普通角色仍是首字色块');
const cssText = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
ok(cssText.includes('.av.art img'), 'CSS 有 .av.art img 铺满规则');

console.log(fails ? ('\n✗ 失败 ' + fails + ' 项') : '\n✓ 全部通过');
process.exit(fails ? 1 : 0);
