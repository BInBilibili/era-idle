/* ============================================================================
 * 战斗数据表（普通敌人 / 黑魂怪 / 模拟纪元怪 / 武器 / 战斗常数）
 * 数据来源（只抄文档，不编造）：
 *   - 敌人：敌人表.md「区域分布」「普通敌人战斗数值」「黑魂怪」「模拟纪元怪」
 *   - 武器：战斗系统.md「各时代武器全表」（28 把）+ 资源表.md「12.1 黑魂装备套」
 *           （深渊大剑 = 第 29 把）
 *   - 常数：战斗系统.md（§三~§十）、敌人表.md（刷新 / 图鉴 / 恩赐怪）、
 *           工作表.md（狩猎 / 畜牧）、角色与抽卡.md（[开拓者] 狩猎加成）
 *
 * 数值缺口（文档未给出，不猜）：
 *   1. 皮革只有「种类」，没有掉落数量 → min/max 记 null。
 *   2. 机械兽的机械零件、硅基生物的硅片没有数量 → min/max 记 null。
 *   3. 敌人表没有「战力」列 → ENEMIES 不提供 power 字段。
 *   4. 温度效果 / 护盾恢复速率文档未定义 → COMBAT_CONST 对应项记 null。
 *   maxHit 按 战斗系统.md §五公式以「敌人装备为空 → 力量加成 0」推导：
 *        floor(10 × (2.2 + 力量/10))；熊 = floor(10 × (2.2 + 4.5)) = 67，
 *        与 敌人表.md 验算一致。
 * ========================================================================= */

window.ENEMIES = [
  /* ------------------------------ 森林（石器时代开局） ------------------------------ */
  {
    id: "rabbit",
    name: "兔子",
    type: "normal",
    region: "森林",
    hp: 12,
    atk: 1,
    str: 1,
    def: 1,
    dr: 0,
    interval: 2.0,
    maxHit: 23,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 2, max: 2 },
      { name: "小型皮革", min: null, max: null }
    ],
    note: null
  },
  {
    id: "grouse",
    name: "松鸡",
    type: "normal",
    region: "森林",
    hp: 10,
    atk: 1,
    str: 1,
    def: 1,
    dr: 0,
    interval: 2.0,
    maxHit: 23,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 2, max: 2 },
      { name: "羽毛", min: null, max: null }
    ],
    note: null
  },
  {
    id: "deer",
    name: "鹿",
    type: "normal",
    region: "森林",
    hp: 40,
    atk: 8,
    str: 6,
    def: 3,
    dr: 0,
    interval: 2.0,
    maxHit: 28,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 6, max: 6 },
      { name: "中型皮革", min: null, max: null }
    ],
    note: null
  },
  {
    id: "boar",
    name: "野猪",
    type: "normal",
    region: "森林",
    hp: 70,
    atk: 15,
    str: 18,
    def: 12,
    dr: 10,
    interval: 2.5,
    maxHit: 40,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 8, max: 8 },
      { name: "中型皮革", min: null, max: null },
      { name: "骨/角", min: 1, max: 2 }
    ],
    note: null
  },
  {
    id: "wolf",
    name: "狼",
    type: "normal",
    region: "森林",
    hp: 90,
    atk: 25,
    str: 28,
    def: 10,
    dr: 5,
    interval: 2.0,
    maxHit: 50,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 10, max: 10 },
      { name: "狼皮", min: null, max: null }
    ],
    note: null
  },
  {
    id: "bear",
    name: "熊",
    type: "normal",
    region: "森林",
    hp: 180,
    atk: 35,
    str: 45,
    def: 15,
    dr: 15,
    interval: 3.0,
    maxHit: 67,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 18, max: 18 },
      { name: "熊皮", min: null, max: null },
      { name: "骨/角", min: 1, max: 2 }
    ],
    note: null
  },

  /* ------------------------------ 草原（石器时代中期） ------------------------------ */
  {
    id: "mountain_goat",
    name: "野山羊",
    type: "normal",
    region: "草原",
    hp: 30,
    atk: 5,
    str: 4,
    def: 2,
    dr: 0,
    interval: 2.5,
    maxHit: 26,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 5, max: 5 },
      { name: "中型皮革", min: null, max: null }
    ],
    note: null
  },
  {
    id: "antelope",
    name: "羚羊",
    type: "normal",
    region: "草原",
    hp: 45,
    atk: 6,
    str: 6,
    def: 3,
    dr: 0,
    interval: 2.0,
    maxHit: 28,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 8, max: 8 },
      { name: "中型皮革", min: null, max: null }
    ],
    note: null
  },
  {
    id: "moose",
    name: "驼鹿",
    type: "normal",
    region: "草原",
    hp: 120,
    atk: 22,
    str: 30,
    def: 12,
    dr: 10,
    interval: 2.8,
    maxHit: 52,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 20, max: 20 },
      { name: "厚重皮革", min: null, max: null }
    ],
    note: null
  },
  {
    id: "bison",
    name: "野牛",
    type: "normal",
    region: "草原",
    hp: 170,
    atk: 30,
    str: 42,
    def: 18,
    dr: 15,
    interval: 2.8,
    maxHit: 64,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 25, max: 25 },
      { name: "厚重皮革", min: null, max: null }
    ],
    note: null
  },

  /* ------------------------------ 极地（中世纪） ------------------------------ */
  {
    id: "mammoth",
    name: "猛犸",
    type: "normal",
    region: "极地",
    hp: 400,
    atk: 40,
    str: 60,
    def: 35,
    dr: 30,
    interval: 3.5,
    maxHit: 82,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 30, max: 30 },
      { name: "厚重皮革", min: null, max: null },
      { name: "骨/角", min: 1, max: 2 }
    ],
    note: null
  },

  /* ------------------------------ 沼泽（中世纪） ------------------------------ */
  {
    id: "crocodile",
    name: "鳄鱼",
    type: "normal",
    region: "沼泽",
    hp: 200,
    atk: 35,
    str: 50,
    def: 20,
    dr: 20,
    interval: 3.0,
    maxHit: 72,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 15, max: 15 },
      { name: "鳄鱼皮", min: null, max: null }
    ],
    note: null
  },
  {
    id: "monitor_lizard",
    name: "巨蜥",
    type: "normal",
    region: "沼泽",
    hp: 180,
    atk: 33,
    str: 45,
    def: 18,
    dr: 18,
    interval: 2.6,
    maxHit: 67,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 20, max: 20 },
      { name: "厚重皮革", min: null, max: null }
    ],
    note: null
  },

  /* ------------------------------ 荒原（工业时代） ------------------------------ */
  {
    id: "rhino",
    name: "犀牛",
    type: "normal",
    region: "荒原",
    hp: 350,
    atk: 45,
    str: 65,
    def: 38,
    dr: 35,
    interval: 3.2,
    maxHit: 87,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 40, max: 40 },
      { name: "厚重皮革", min: null, max: null },
      { name: "骨/角", min: 1, max: 2 }
    ],
    note: null
  },

  /* ------------------------------ 废墟（信息时代） ------------------------------ */
  {
    id: "mech_beast",
    name: "机械兽",
    type: "normal",
    region: "废墟",
    hp: 500,
    atk: 65,
    str: 75,
    def: 55,
    dr: 45,
    interval: 3.0,
    maxHit: 97,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "机械零件", min: null, max: null }
    ],
    note: "不能畜牧；肉量 0，掉落改为机械零件（数量文档未给）"
  },

  /* ------------------------------ 变异区（信息时代） ------------------------------ */
  {
    id: "mutant_behemoth",
    name: "变异巨兽",
    type: "normal",
    region: "变异区",
    hp: 550,
    atk: 60,
    str: 90,
    def: 40,
    dr: 40,
    interval: 3.2,
    maxHit: 112,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 60, max: 60 },
      { name: "厚重皮革", min: null, max: null }
    ],
    note: null
  },

  /* ------------------------------ 外星（太空时代） ------------------------------ */
  {
    id: "alien_predator",
    name: "外星掠食者",
    type: "normal",
    region: "外星",
    hp: 600,
    atk: 70,
    str: 100,
    def: 45,
    dr: 45,
    interval: 3.0,
    maxHit: 122,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "肉类食材", min: 80, max: 80 },
      { name: "外星皮革", min: null, max: null }
    ],
    note: null
  },
  {
    id: "silicon_lifeform",
    name: "硅基生物",
    type: "normal",
    region: "外星",
    hp: 480,
    atk: 62,
    str: 80,
    def: 60,
    dr: 55,
    interval: 3.4,
    maxHit: 102,
    tier: null,
    unlockLevel: null,
    loot: [
      { name: "硅片", min: null, max: null }
    ],
    note: "不能畜牧；肉量 0，掉落改为硅片（数量文档未给）"
  },

  /* ------------------------------ 黑魂怪（4 档，仅星见由岐） ------------------------------ */
  {
    id: "asylum_demon",
    name: "不死院恶魔",
    type: "blackSoul",
    hidden: true, // v0.0.13：黑暗之魂整条线隐藏（星见由岐退役后不可达）
    region: null,
    hp: 220,
    atk: 28,
    str: 38,
    def: 18,
    dr: 15,
    interval: 2.6,
    maxHit: 60,
    tier: 1,
    unlockLevel: 1,
    loot: [
      { name: "灵魂", min: 3, max: 5 },
      { name: "余火", min: 1, max: 1, chance: 0.25 }
    ],
    note: "仅星见由岐可打（好感 50 解锁 #黑暗之魂）；灵魂/余火唯一来源；不进图鉴、不能畜牧；强度≈中世纪中期怪"
  },
  {
    id: "ashen_judicator",
    name: "灰烬审判者",
    type: "blackSoul",
    hidden: true, // v0.0.13：黑暗之魂整条线隐藏（星见由岐退役后不可达）
    region: null,
    hp: 560,
    atk: 52,
    str: 68,
    def: 38,
    dr: 28,
    interval: 2.8,
    maxHit: 90,
    tier: 2,
    unlockLevel: 25,
    loot: [
      { name: "灵魂", min: 5, max: 8 },
      { name: "余火", min: 1, max: 1 }
    ],
    note: "仅星见由岐可打；灵魂/余火唯一来源；不进图鉴、不能畜牧；强度≈工业中期怪"
  },
  {
    id: "abyss_watcher",
    name: "深渊监视者",
    type: "blackSoul",
    hidden: true, // v0.0.13：黑暗之魂整条线隐藏（星见由岐退役后不可达）
    region: null,
    hp: 1150,
    atk: 74,
    str: 104,
    def: 58,
    dr: 40,
    interval: 3.0,
    maxHit: 126,
    tier: 3,
    unlockLevel: 50,
    loot: [
      { name: "灵魂", min: 8, max: 12 },
      { name: "余火", min: 1, max: 2 }
    ],
    note: "仅星见由岐可打；灵魂/余火唯一来源；不进图鉴、不能畜牧；强度≈信息时代怪"
  },
  {
    id: "nameless_king",
    name: "无名王者",
    type: "blackSoul",
    hidden: true, // v0.0.13：黑暗之魂整条线隐藏（星见由岐退役后不可达）
    region: null,
    hp: 2050,
    atk: 94,
    str: 142,
    def: 82,
    dr: 50,
    interval: 3.2,
    maxHit: 164,
    tier: 4,
    unlockLevel: 75,
    loot: [
      { name: "灵魂", min: 13, max: 18 },
      { name: "余火", min: 2, max: 4 }
    ],
    note: "仅星见由岐可打；灵魂/余火唯一来源；不进图鉴、不能畜牧；强度≈太空终局怪"
  },

  /* ------------------------------ 模拟纪元怪（4 档，仅大少） ------------------------------ */
  {
    id: "wandering_zombie",
    name: "游荡僵尸",
    type: "eraSim",
    region: null,
    hp: 180,
    atk: 22,
    str: 26,
    def: 12,
    dr: 10,
    interval: 2.4,
    maxHit: 48,
    tier: 1,
    unlockLevel: 1,
    loot: [
      { name: "随机材料", min: 2, max: 4 }
    ],
    note: "仅大少可打（好感 50 解锁 #模拟纪元）；不进图鉴、不能畜牧；强度≈中世纪前期怪；每次从已解锁材料池抽 1 种，权重=1/该材料单价"
  },
  {
    id: "zombie_horde",
    name: "尸群",
    type: "eraSim",
    region: null,
    hp: 460,
    atk: 44,
    str: 52,
    def: 30,
    dr: 22,
    interval: 2.6,
    maxHit: 74,
    tier: 2,
    unlockLevel: 25,
    loot: [
      { name: "随机材料", min: 4, max: 7 }
    ],
    note: "仅大少可打；不进图鉴、不能畜牧；强度≈工业前期怪；随机已解锁材料，权重=1/单价"
  },
  {
    id: "mutant",
    name: "变异体",
    type: "eraSim",
    region: null,
    hp: 980,
    atk: 66,
    str: 88,
    def: 50,
    dr: 34,
    interval: 2.8,
    maxHit: 110,
    tier: 3,
    unlockLevel: 50,
    loot: [
      { name: "随机材料", min: 7, max: 12 }
    ],
    note: "仅大少可打；不进图鉴、不能畜牧；强度≈信息时代怪；随机已解锁材料，权重=1/单价"
  },
  {
    id: "horde_chieftain",
    name: "尸潮首领",
    type: "eraSim",
    region: null,
    hp: 1800,
    atk: 86,
    str: 124,
    def: 74,
    dr: 44,
    interval: 3.0,
    maxHit: 146,
    tier: 4,
    unlockLevel: 75,
    loot: [
      { name: "随机材料", min: 12, max: 20 }
    ],
    note: "仅大少可打；不进图鉴、不能畜牧；强度≈太空期怪；随机已解锁材料，权重=1/单价"
  }
];

/* 区域按解锁时机排序；era 为科技时代 id。旧区域永远可访问，阶段只决定解锁时机。 */
window.REGIONS = [
  { name: "森林", era: "stone", enemies: ["兔子", "松鸡", "鹿", "野猪", "狼", "熊"] },
  { name: "草原", era: "stone", enemies: ["野山羊", "羚羊", "驼鹿", "野牛"] },
  { name: "极地", era: "medieval", enemies: ["猛犸"] },
  { name: "沼泽", era: "medieval", enemies: ["鳄鱼", "巨蜥"] },
  { name: "荒原", era: "industrial", enemies: ["犀牛"] },
  { name: "废墟", era: "information", enemies: ["机械兽"] },
  { name: "变异区", era: "information", enemies: ["变异巨兽"] },
  { name: "外星", era: "space", enemies: ["外星掠食者", "硅基生物"] }
];

/* 武器名与 资源表.md 完全一致。
 * interval = 攻击间隔（秒）；str = 力量加成；atk = 命中加成；range = 射程。
 * twoHanded 取 资源表.md 的「主手（双手）」栏位。
 * armorPen 只记录文档写「破甲 X%」的武器；「无视 X% 伤害减免」另记 ignoreDR（语义不同）。
 * 深渊大剑来自 资源表.md §12.1（战斗系统.md 未单列，但计入 29 把全表）。 */
window.WEAPON_COMBAT = {
  // 石器时代
  "石匕首": { interval: 1.5, atk: 10, str: 0, range: 0, twoHanded: false },
  "石斧": { interval: 2.5, atk: 0, str: 18, range: 0, twoHanded: false, armorPen: 10 },
  "石矛": { interval: 2.4, atk: 12, str: 8, range: 1, twoHanded: false },
  "短弓": { interval: 2.4, atk: 6, str: 8, range: 2, twoHanded: true },

  // 中世纪
  "铜匕首": { interval: 1.5, atk: 14, str: 4, range: 0, twoHanded: false },
  "铁匕首": { interval: 1.5, atk: 18, str: 8, range: 0, twoHanded: false },
  "短剑": { interval: 2.0, atk: 12, str: 12, range: 0, twoHanded: false },
  "铜矛": { interval: 2.4, atk: 16, str: 10, range: 1, twoHanded: false },
  "铁矛": { interval: 2.4, atk: 20, str: 16, range: 1, twoHanded: false },
  "战斧": { interval: 3.0, atk: 4, str: 30, range: 0, twoHanded: false, armorPen: 20 },
  "双手剑": { interval: 3.6, atk: 10, str: 38, range: 0, twoHanded: true, crit: 15 },
  "巨锤": { interval: 4.0, atk: 0, str: 48, range: 0, twoHanded: true, ignoreDR: 30 },
  "长弓": { interval: 3.0, atk: 10, str: 26, range: 3, twoHanded: true },
  "弩": { interval: 3.4, atk: 24, str: 36, range: 3, twoHanded: true },

  // 工业时代
  "刺刀": { interval: 1.5, atk: 26, str: 14, range: 0, twoHanded: false },
  "军刀": { interval: 2.0, atk: 20, str: 26, range: 0, twoHanded: false },
  "工兵铲": { interval: 3.0, atk: 6, str: 48, range: 0, twoHanded: false, armorPen: 25 },
  "手枪": { interval: 1.5, atk: 16, str: 30, range: 4, twoHanded: false },
  "霰弹枪": { interval: 2.5, atk: 4, str: 66, range: 2, twoHanded: true },
  "步枪": { interval: 3.0, atk: 24, str: 52, range: 5, twoHanded: true },

  // 信息时代
  "战术刀": { interval: 1.5, atk: 40, str: 26, range: 0, twoHanded: false },
  "碳纤维长刀": { interval: 2.4, atk: 26, str: 58, range: 0, twoHanded: false, armorPen: 30 },
  "突击步枪": { interval: 2.0, atk: 34, str: 62, range: 5, twoHanded: true },
  "狙击枪": { interval: 4.0, atk: 48, str: 96, range: 6, twoHanded: true },

  // 太空时代
  "等离子刃": { interval: 2.0, atk: 50, str: 90, range: 0, twoHanded: false, ignoreDR: 40 },
  "重力锤": { interval: 3.5, atk: 20, str: 140, range: 0, twoHanded: true, ignoreDR: 50 },
  "轨道矛": { interval: 2.4, atk: 70, str: 100, range: 3, twoHanded: false },
  "粒子枪": { interval: 3.0, atk: 44, str: 120, range: 6, twoHanded: true },

  // 黑魂套（资源表.md §12.1；仅 [黑暗之魂] 专属，1 档固定属性、不强化）
  "深渊大剑": { interval: 2.2, atk: 30, str: 72, range: 0, twoHanded: false, armorPen: 25 }
};

/* ============================================================================
 * 畜牧动物表（工作表.md §4.6 / UI 动物列表面板）
 *   size     占用畜牧容量的体型（COMBAT_CONST.husbandry.sizeCost）
 *   duration 基础产出周期（秒）
 *   outputs  一次周期的产出（中文物品名，引擎自己映射 id）
 *   consume  每天消耗草料数量（1 天 = 24 秒，按连续时间扣）
 * 机械兽 / 硅基生物不能畜牧，因此不在本表里。
 * ==========================================================================*/
window.HUSBANDRY_ANIMALS = {
  "兔子":     { size: "极小", duration: 8,  consume: 1, outputs: { "肉类食材": 1,  "小型皮革": 1 } },
  "松鸡":     { size: "极小", duration: 8,  consume: 1, outputs: { "肉类食材": 1,  "羽毛": 1 } },
  "鹿":       { size: "小",   duration: 12, consume: 1, outputs: { "肉类食材": 4,  "中型皮革": 1 } },
  "野山羊":   { size: "小",   duration: 10, consume: 1, outputs: { "肉类食材": 3,  "毛料": 1, "中型皮革": 1 } },
  "羚羊":     { size: "小",   duration: 12, consume: 1, outputs: { "肉类食材": 5,  "中型皮革": 1 } },
  "野猪":     { size: "中",   duration: 16, consume: 1, outputs: { "肉类食材": 5,  "中型皮革": 1, "骨 / 角": 1 } },
  "狼":       { size: "中",   duration: 18, consume: 1, outputs: { "肉类食材": 6,  "狼皮": 1 } },
  "鳄鱼":     { size: "中",   duration: 30, consume: 1, outputs: { "肉类食材": 9,  "鳄鱼皮": 1 } },
  "巨蜥":     { size: "中",   duration: 28, consume: 1, outputs: { "肉类食材": 12, "厚重皮革": 1 } },
  "熊":       { size: "大",   duration: 28, consume: 1, outputs: { "肉类食材": 11, "熊皮": 1, "骨 / 角": 1 } },
  "驼鹿":     { size: "大",   duration: 30, consume: 1, outputs: { "肉类食材": 12, "厚重皮革": 1 } },
  "野牛":     { size: "大",   duration: 32, consume: 1, outputs: { "肉类食材": 15, "厚重皮革": 1 } },
  "犀牛":     { size: "大",   duration: 42, consume: 1, outputs: { "肉类食材": 24, "厚重皮革": 1, "骨 / 角": 1 } },
  "猛犸":     { size: "极大", duration: 45, consume: 1, outputs: { "肉类食材": 18, "厚重皮革": 1, "骨 / 角": 1 } },
  "变异巨兽": { size: "极大", duration: 55, consume: 1, outputs: { "肉类食材": 36, "厚重皮革": 1 } },
  "外星掠食者": { size: "极大", duration: 55, consume: 1, outputs: { "肉类食材": 48, "外星皮革": 1 } }
};

/* 战斗常数。所有数值都有文档出处；文档没写的记 null 并在 notes 里点名。 */
window.COMBAT_CONST = {
  /* ---- 角色战斗属性（战斗系统.md §三） ---- */
  statLevelMin: 1,
  statLevelMax: 100,
  hp: { base: 100, perLevel: 10 },          // 生命上限 = 100 + 10 × 生命等级 + 装备
  damageReductionMin: 0,                    // 伤害减免只有装备提供
  damageReductionMax: 80,                   // 0~80%
  attackIntervalMin: 1.5,                   // 武器攻击间隔 1.5~4.0 秒
  attackIntervalMax: 4.0,
  equipmentSlots: 12,                       // 头盔/内衬头盔/胸甲/内衬/护腿/内衬护腿/靴子/袜子/副手/项链/腰带/主手
  warehouseSlots: 224,                      // 终局仓库格数
  weaponWarehouseSlots: 1,                  // 每把武器占 1 格

  /* ---- 战斗经验（§3.1） ---- */
  xpDmg: 0.4,                               // 造成伤害 0.4 XP/伤害（单一技能）
  xpDmgSplit: 0.2,                          // 两个技能分摊时 0.2 XP/伤害
  xpTaken: 0.133,                           // 承受伤害 0.133 XP/伤害

  /* ---- 战力换算（§3.2，供被动.md 袭击判定复用） ---- */
  power: {
    charMultiplier: 3,                      // 单角色战力 = (生命+命中+力量+防御) × 3 + 装备战力
    equipDRMul: 5,                          // 装备战力 = 伤害减免% × 5 + 力量 × 2
    equipStrMul: 2,
    weaponStrMul: 2,                        // 武器战力 = 力量加成 × 2 + 命中加成 × 1
    weaponAtkMul: 1,
    fullSetEquipmentPower: { stone: 137, medieval: 417, industrial: 628, information: 978, space: 1444 },
    activeCharCap: 18,                       // 只有前 X 名上场角色计入基地战力，X = min(住所上限, 18)
    temperatureAndShieldExcluded: true      // 温度 / 护盾值不计战力，只服务狩猎与两份恩赐战斗
  },

  /* ---- 命中（§四） ---- */
  hitBase: { atkLvl: 9, atkBonus: 64 },     // 命中评级 = floor((命中等级+9) × (命中加成+64) × (1+修正/100))
  evadeBase: { defLvl: 9, evadeBonus: 64 }, // 回避评级同式，用防御等级 / 回避加成
  hitRatingModDiv: 100,
  hitRateExamples: { equal: 0.5, double: 0.75, triple: 0.833 }, // 评级相等 50%、2 倍 75%、3 倍 83.3%

  /* ---- 伤害（§五） ---- */
  maxHit: {
    base: 10,
    add: 2.2,
    strDiv: 10,
    strOffset: 17,                          // (力量等级 + 17)
    strBonusDiv: 640,
    modDiv: 100,                            // 实际最大伤害 = floor(基础 × (1 + 修正/100)) + 固定修正
    examples: { str10: 32, str50: 72, str99: 121, str99Bonus50: 211 }
  },
  avgHit: { add: 1, div: 2 },               // 平均每击 = (最大伤害 + 1) / 2
  dps: { formula: "hitChance * (maxHit + 1) / 2 / interval" },
  meleeDpsTolerancePct: 10,                 // 六把近战武器 DPS 落在 ±10%

  /* ---- 距离（§六） ---- */
  distance: {
    startFromWeaponRange: true,             // 开战距离 = 玩家武器射程
    reducePerPlayerAction: 1,               // 玩家每行动一次距离 -1
    onlyPlayerWhenPositive: true            // 距离 > 0 时只有玩家能攻击
  },
  range: {
    melee: 0,
    spear: 1,
    shortbow: 2,
    longbow: 3,
    crossbow: 3,
    coldWeaponMax: 3,                       // 冷兵器射程上限 3
    firearmMin: 4,                          // 火器 4~6
    firearmMax: 6
  },

  /* ---- 重伤 / 恢复（§八） ---- */
  injury: {
    hpFloor: 1,                             // HP 永远不低于 1
    thresholdPct: 20,                       // 最大生命值的 20% → 重伤并自动撤退
    recoverPct: 20,                         // 回到 20% 以上脱离重伤
    naturalRegenPctPerDay: 5,               // 自然恢复：最大生命值的 5%/天
    healerRegenPctPerDay: 15,               // 有医疗角色：15%/天
    autoRetreat: true,
    noDeath: true,
    outputScaleByDamageDealt: true          // 败北产出 = 全额 × 已造成伤害比例
  },

  /* ---- 离线结算（§九） ---- */
  offline: {
    expectedDuration: "enemyHp / (playerDps * hitChance)",
    output: "(offlineSeconds / expectedDuration) * perKillOutput * winRate",
    example: { seconds: 28800, avgFightSeconds: 20, fights: 1440, roundsPerFight: 30, settlements: 43200 }
  },

  /* ---- 刷新与区域（敌人表.md §一 / §八） ---- */
  enemyCount: 26,
  normalEnemyCount: 18,
  giftEnemyCount: 8,
  regionCount: 8,
  respawnSeconds: 3,                        // 击杀后 3 秒刷下一只
  regionDrawPerEntry: 1,                    // 进入区域随机抽 1 只

  /* ---- 图鉴认知度（敌人表.md §六 / §八） ---- */
  codex: {
    perKill: 1,                             // 每次击杀 +1
    maxLevel: 100,                          // 满级 100
    dmgPctPerLevel: 2,                      // 每级对该敌人 +2% 伤害
    dropQtyPctAtMax: 10,                    // 满级后该敌人掉落数量 +10%
    unlocksHusbandry: true,                 // 认知度满 → 解锁畜牧线
    giftExcluded: true                      // 恩赐怪不进图鉴
  },

  /* ---- 畜牧（工作表.md §4.6） ---- */
  husbandry: {
    expectedOutputMultiplier: 2.5,          // 狩猎期望 × 2.5
    meatMultiplier: 0.6,                    // 肉类食材 × 0.6
    feedPerDay: 1,                          // 1 草料 / 只 / 天
    initialCapacity: 5,
    sizeCost: { "极小": 0.5, "小": 1, "中": 2, "大": 3, "极大": 5 },
    unkeepable: ["机械兽", "硅基生物"],
    zeroRisk: true
  },

  /* ---- 狩猎（工作表.md §4.5 / 角色与抽卡.md §6.3） ---- */
  hunting: {
    noEscape: true,                         // 没有逃跑机制，打不过就重伤
    outputBonus: { pioneer: 0.25, pioneerPlus: 0.5 },        // 超超 [开拓者] / [开拓者+]
    codexBonus: { pioneerPlus: 0.5 },                        // [开拓者+] 图鉴认知度累积 +50%
    combatDriven: true                       // 周期 = 敌人 HP ÷ (DPS × 命中率)
  },

  /* ---- 两份恩赐工作（敌人表.md §三/§四、角色与抽卡.md §七） ---- */
  gift: {
    favorUnlock: 50,                        // 好感 50 解锁对应工作
    skillLevelMax: 100,                     // 黑暗之魂 / 模拟纪元 1~100 级
    speedPctPer10Levels: 1,                 // 每 10 级 +1% 速度
    tiers: [1, 25, 50, 75],                 // 4 档技能门槛
    strengthMultiplier: 1.2,                // 现按同档普通敌人 ×1.2 拍，文档标注待实测
    codexExcluded: true,
    husbandryExcluded: true
  },

  /* ---- 火器与近战分野（§10.6~§10.7） ---- */
  combat: {
    twoHandedBlocksOffhand: true,            // 双手武器占主手并占用副手（装备时自动卸下副手）
    shieldBeltPVPOnly: true,                 // 护盾腰带不提供「免疫远程」，留给 PVP
    weaponCount: 29,                         // 28 常规 + 深渊大剑
    normalWeaponCount: 28
  },

  /* ---- 文档未定义、明确留空的项 ---- */
  temperature: null,                         // 只有装备温度列，体温/环境温度规则未定义
  shieldRegen: null,                         // 未定义恢复速率
  shieldValues: { "简易护盾腰带": 100, "军用护盾腰带": 250, "相位护盾腰带": 500 },

  notes: [
    "来源：战斗系统.md（§三~§十）、敌人表.md（§一~§八）、工作表.md（§4.5/§4.6）、角色与抽卡.md（§6.3/§七）。",
    "命中评级 = floor((命中等级+9) × (命中加成+64) × (1 + 命中修正/100))；回避评级同式用防御等级与回避加成。",
    "命中率：命中评级 < 回避评级时 = 命中评级 / (2 × 回避评级)；否则 = 1 - 回避评级 / (2 × 命中评级)。",
    "基础最大伤害 = floor(10 × (2.2 + 力量等级/10 + (力量等级+17) × 力量加成/640))；敌人装备为空，力量加成为 0。",
    "敌人 maxHit 为按上式的推导值，不是敌人表直接给出的列；熊 = 67 与敌人表验算一致。",
    "敌人表没有战力列，故 ENEMIES 不写 power 字段（不编造）。",
    "皮革掉落数量、机械兽的机械零件数量、硅基生物的硅片数量文档未给出 → loot 的 min/max 为 null。",
    "肉量为每次击杀的固定值；图鉴满级 +10% 掉落数量是全局修正，未预先乘进基础掉落。",
    "黑魂怪 / 模拟纪元怪只掉灵魂 / 余火或随机材料，不进图鉴、不能畜牧；强度按同档普通敌人 ×1.2 拍，文档标注待实测。",
    "模拟纪元怪的随机材料：每次从已解锁材料池抽 1 种，权重 = 1 / 该材料单价；越便宜越容易抽到。",
    "温度系统只有装备温度列（资源表.md，+1~+20），没有环境温度 / 体温规则；护盾腰带只有 100 / 250 / 500 的护盾值，没有恢复速率。",
    "离线用期望值结算，在线才逐回合模拟；成本从 O(回合) 降到 O(1)。",
    "角色永远不会死亡，HP 下限 1；败北判据是 HP ≤ 最大生命 20% 自动撤退。",
    "武器名严格照 资源表.md；短弓 / 双手剑 / 巨锤 / 长弓 / 弩 / 霰弹枪 / 步枪 / 突击步枪 / 狙击枪 / 重力锤 / 粒子枪 在资源表标为「主手（双手）」。",
    "深渊大剑来自 资源表.md §12.1（力量+72 / 命中+30 / 间隔 2.2 秒 / 破甲 25%），是第 29 把武器。",
    "「阶段」是解锁时机，不是出现范围：新阶段解锁新区域，旧区域永远可访问。",
    "恩赐怪门槛是黑暗之魂 / 模拟纪元技能等级（1 / 25 / 50 / 75），不是时代；真实门槛是该角色打不打得过。",
    "袭击不跑本文件的战斗公式，只做「基地战力 vs 袭击强度」的纯数值判定（被动.md「#防御」）。",
    "图鉴完成度（收集率）不给奖励；认知度是单只敌人的熟练度，满级才解锁畜牧。"
  ]
};
