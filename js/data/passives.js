/* ============================================================================
 * passives.js — 被动七套的数据（纯浏览器全局脚本，无模块）
 * 来源：被动.md §2 / §3 / §4 / §7，逐格转录。
 *
 * 校验摘要（与文档一致）：
 *   HOUSING       6 档，可上场 7 / 9 / 11 / 13 / 15 / 18（初始 5，住满 = 18，无舒适度门槛）
 *   COMFORT      16 档，舒适度合计 = 4+4+4+6+5+6+5+6+8+6+7+7+9+8+7+8 = 100
 *                分代：石器 12 / 中世纪 22 / 工业 27 / 信息 24 / 太空 15
 *   FORTS        14 档，工事战力合计 = 47,750，耗电合计 = 18 瓦
 *                袭击强度削减：尖木陷阱 -5% + 石墙 / 钢筋混凝土墙 / 合金要塞 各 -10% = -35%
 *   WAREHOUSE_UPG 6 档，每档 +34 格：20（初始）→ 54 → 88 → 122 → 156 → 190 → 224
 *   GRANARY_UPG   3 档（v0.0.35）：陶器 −30% 腐坏 / 地窖 −60% 腐坏 / 冷库 −100% 腐坏（粮仓容量无限）
 *
 * v0.0.35 升级项造价：按升级项名字选材料（材料都取自现有物品），
 *   第一档（解锁项目 / 进门档）压到很便宜，后续档按该套被动的重要性递增，
 *   同一套里每一档的材料种类与数量都不重复 —— 定价规则见 工作表.md §1.1。
 * 材料名严格照抄原文，注意「石头」与「石材」是两种不同物品：
 *   茅草棚用「石头」，长屋 / 石屋 / 土垒 / 石墙用「石材」。
 * ==========================================================================*/

/* ---------------------------------------------------------------------------
 * §2.1 角色上限（盖房子）
 * 初始可上场 5 人，6 档住房依次 +2/+2/+2/+2/+2/+3，住满正好 18 人。
 * 没有任何舒适度门槛：材料够、时代到就能盖。
 * ------------------------------------------------------------------------- */
window.HOUSING = [
  { name: "茅草棚", era: "stone",      cost: { 木材: 40, 石头: 20 },                              cap: 7  },
  { name: "长屋",   era: "stone",      cost: { 木材: 400, 石材: 175, 木板: 75 },                  cap: 9  },
  { name: "石屋",   era: "medieval",   cost: { 石材: 550, 石灰石: 225, 木材: 200 },              cap: 11 },
  { name: "公寓",   era: "industrial", cost: { 混凝土: 400, 钢铁: 650, 玻璃: 175 },               cap: 13 },
  { name: "住宅区", era: "info",       cost: { 钛合金: 900, 混凝土: 350, 玻璃: 250 },             cap: 15 },
  { name: "殖民舱", era: "space",      cost: { 外星合金: 1050, 生命维持单元: 175, 精密零件: 125 }, cap: 18 }
];

/* ---------------------------------------------------------------------------
 * §2.2 舒适度线（家具 / 娱乐 / 地板）
 * 舒适度 0~100，硬上限 100（不溢出）。
 * 全局工作效率加成 = 舒适度 × 0.35%（满舒适度 = 全部工作 +35%）。
 * 合计 = 100（文档 §2.2 末行「合计 100」）。
 * 腐坏规则：舒适度 ≥ 80 时，陶器 / 地毯按周期腐坏（每周期 10%，见 PASSIVE_RULES）。
 * ------------------------------------------------------------------------- */
window.COMFORT = [
  { name: "陶罐装饰",   era: "stone",      cost: { 陶器: 40, 沙: 20 },                          value: 4 },
  { name: "木床",       era: "stone",      cost: { 木材: 125, 植物纤维: 65 },                  value: 4 },
  { name: "木地板",     era: "stone",      cost: { 木板: 90, 木材: 65 },                       value: 4 },
  { name: "地毯",       era: "medieval",   cost: { 地毯: 65, 布料: 50, 植物纤维: 40 },         value: 6 },
  { name: "纸窗",       era: "medieval",   cost: { 纸张: 75, 木材: 50 },                       value: 5 },
  { name: "木制家具",   era: "medieval",   cost: { 木板: 125, 铁锭: 40, 木材: 75 },            value: 6 },
  { name: "石地板",     era: "medieval",   cost: { 石材: 175, 石灰石: 90 },                    value: 5 },
  { name: "台球桌",     era: "industrial", cost: { 木板: 150, 塑料: 65, 布料: 40 },             value: 6 },
  { name: "塑料家具",   era: "industrial", cost: { 塑料: 350, 钢铁: 125 },                     value: 8 },
  { name: "瓷砖地板",   era: "industrial", cost: { 混凝土: 275, 陶器: 150, 沙: 110 },           value: 6 },
  { name: "电气娱乐",   era: "industrial", cost: { 电子元件: 90, 玻璃: 75, 塑料: 65 },          value: 7 },
  { name: "合成地板",   era: "info",       cost: { 塑料: 400, 铝合金: 90 },                    value: 7 },
  { name: "AI 家电",    era: "info",       cost: { 芯片: 225, 精密零件: 65, 电子元件: 90 },     value: 9 },
  { name: "全息娱乐",   era: "info",       cost: { 芯片: 175, 铝合金: 110, 玻璃: 90 },          value: 8 },
  { name: "全息地板",   era: "space",      cost: { 外星合金: 900, 反物质: 110, 精密零件: 75 },   value: 7 },
  { name: "生命维持舱", era: "space",      cost: { 生命维持单元: 160, 外星合金: 1130, 玻璃: 225 }, value: 8 }
];

/* ---------------------------------------------------------------------------
 * §3.1 防御工事（14 项）
 * 工事战力合计 = 47,750，耗电合计 = 18 瓦（2+2+3+5+6）。
 * reduce = 袭击强度削减比例（尖木陷阱 -5%，石墙 / 钢筋混凝土墙 / 合金要塞 各 -10%）。
 * 工事职责只有三件：给工事战力、改袭击强度、耗电；不参与狩猎战斗。
 * ------------------------------------------------------------------------- */
window.FORTS = [
  { name: "尖木陷阱",       era: "stone",      cost: { 木材: 45, 石头: 20 },                             power: 50,    watt: 0, reduce: 0.05, note: "袭击强度 -5%" },
  { name: "陷坑",           era: "stone",      cost: { 木材: 225, 石头: 110, 植物纤维: 75 },             power: 100,   watt: 0, reduce: 0,    note: "" },
  { name: "土垒",           era: "stone",      cost: { 石材: 200, 石头: 125 },                           power: 150,   watt: 0, reduce: 0,    note: "" },
  { name: "石墙",           era: "medieval",   cost: { 石材: 450, 石灰石: 200 },                         power: 250,   watt: 0, reduce: 0.10, note: "袭击强度 -10%（原「袭击者入场人数 -1」改为此）" },
  { name: "铁蒺藜",         era: "medieval",   cost: { 铁锭: 225, 铁矿: 125 },                          power: 400,   watt: 0, reduce: 0,    note: "" },
  { name: "瞭望塔",         era: "medieval",   cost: { 木板: 225, 铁锭: 110, 木材: 150 },                power: 600,   watt: 0, reduce: 0,    note: "原「全队命中 +2」已删除" },
  { name: "钢筋混凝土墙",   era: "industrial", cost: { 混凝土: 550, 钢铁: 300, 石灰石: 175 },            power: 1000,  watt: 0, reduce: 0.10, note: "袭击强度 -10%" },
  { name: "自动炮塔",       era: "industrial", cost: { 钢铁: 800, 机械零件: 250, 电子元件: 75 },         power: 1500,  watt: 2, reduce: 0,    note: "⚡ 2 瓦" },
  { name: "机枪碉堡",       era: "industrial", cost: { 钢铁: 950, 机械零件: 325, 火药: 150 },            power: 2200,  watt: 2, reduce: 0,    note: "⚡ 2 瓦" },
  { name: "合金要塞",       era: "info",       cost: { 钛合金: 1000, 精密零件: 250, 混凝土: 300 },       power: 3000,  watt: 0, reduce: 0.10, note: "袭击强度 -10%" },
  { name: "激光炮塔",       era: "info",       cost: { 精密零件: 450, 芯片: 200, 钛合金: 550 },          power: 4500,  watt: 3, reduce: 0,    note: "⚡ 3 瓦" },
  { name: "护盾塔",         era: "info",       cost: { 反物质: 400, 精密零件: 300, 电子元件: 200 },     power: 7000,  watt: 5, reduce: 0,    note: "⚡ 5 瓦（原「给全队加护盾」已删除）" },
  { name: "战斗机器人",     era: "space",      cost: { "AI 核心": 125, 外星合金: 880, 精密零件: 225 },   power: 11000, watt: 0, reduce: 0,    note: "原「失守时优先被击毁」已删除" },
  { name: "轨道防御平台",   era: "space",      cost: { 反物质: 1200, 外星合金: 3000, 精密零件: 500 },   power: 16000, watt: 6, reduce: 0,    note: "⚡ 6 瓦" }
];

/* ---------------------------------------------------------------------------
 * §7.1 仓库扩容（6 档，每档 +34 格；初始 20 格）
 * 格数序列（资源表.md §9.2）：20 → 54 → 88 → 122 → 156 → 190 → 224
 *
 * v0.0.35 建材：按升级项名字取同名 / 同义材料（木头仓库用木材，石头仓库用石材，
 *   金属仓库用铁锭 …），关闭「4 档阶梯 100 / 300 / 800 / 2,000」的旧推导口径；
 *   第一档木头仓库是进门档，压到 35 木材 + 15 石头。
 * ------------------------------------------------------------------------- */
window.WAREHOUSE_UPG = [
  { name: "木头仓库",         era: "stone",      cost: { 木材: 35, 石头: 15 },                       slots: 54  },
  { name: "石头仓库",         era: "stone",      cost: { 石材: 160, 木材: 100 },                     slots: 88  },
  { name: "金属仓库",         era: "medieval",   cost: { 铁锭: 250, 石材: 150 },                     slots: 122 },
  { name: "钢筋混凝土仓库",   era: "industrial", cost: { 混凝土: 400, 钢铁: 450, 石灰石: 200 },      slots: 156 },
  { name: "合金仓库",         era: "info",       cost: { 钛合金: 850, 铝合金: 225, 精密零件: 175 },  slots: 190 },
  { name: "量子仓库",         era: "space",      cost: { 外星合金: 2000, 反物质: 300, 精密零件: 400 },    slots: 224 }
];

/* ---------------------------------------------------------------------------
 * §7.2 粮仓升级（3 档，v0.0.35 重做）
 * 粮仓容量无限，升级项改为「降低全局腐坏效率」（作用于粮仓里所有食物）：
 *   陶器：腐坏效率 −30%（spoilMul 0.7，科技「陶器」，石器 40 点）
 *   地窖：腐坏效率 −60%（spoilMul 0.4，科技「地窖」，石器 80 点）
 *   冷库：腐坏效率 −100%（spoilMul 0，科技「制冷」，工业 400 点）→ 完全不腐坏
 * 基础腐坏：每 600 秒减半（有效半衰期 = 600 ÷ spoilMul）。
 * 注意：地窖 / 冷库不提供仓库格数，只作用于粮仓（资源表.md:345）。
 * 材料按名字取：陶器 = 陶罐，地窖 = 石材 + 木材 + 石灰石，冷库 = 钢铁 + 塑料 + 机械零件。
 * ------------------------------------------------------------------------- */
window.GRANARY_UPG = [
  { name: "陶器", era: "stone",      cost: { 陶器: 20, 木材: 12, 沙: 8 },                spoilMul: 0.7 },
  { name: "地窖", era: "stone",      cost: { 石材: 175, 木材: 110, 石灰石: 75 },         spoilMul: 0.4 },
  { name: "冷库", era: "industrial", cost: { 钢铁: 550, 塑料: 225, 机械零件: 100 },      spoilMul: 0 }
];

/* ---------------------------------------------------------------------------
 * 全部规则的数值常量（被动.md 逐条抽出）
 * ------------------------------------------------------------------------- */
window.PASSIVE_RULES = {

  /* --- §2.1 角色上限 --- */
  housingStart: 5,            // 初始住所上限（可上场 5 人）
  housingHardCap: 18,         // 绝对硬顶：住满 6 档 = 18 人
  housingCapGain: 2,          // 前 5 档各 +2，第 6 档（殖民舱）+3
  housingComfortReq: [],      // v0.0.14 起取消舒适度门槛，有钱有材料就能盖

  /* --- §2.2 舒适度 --- */
  comfortPerPoint: 0.0035,    // 全局工作效率 = 舒适度 × 0.35%
  comfortMax: 100,            // 舒适度硬上限 100（不溢出）
  comfortFullBonus: 0.35,     // 满舒适度 = 全部工作 +35%
  comfortDecayThreshold: 80,  // 舒适度 ≥ 80 时陶器 / 地毯开始腐坏
  comfortDecayRate: 0.1,      // 每周期腐坏 10%
  comfortAdditiveWithWorkUpg: true, // 与工作升级项加法叠加（工作 +100% + 全局 +35% → +135%）

  /* --- §3.1 防御工事 --- */
  fortPowerTotal: 47750,      // 工事战力合计
  fortWattTotal: 18,          // 工事耗电合计（瓦）
  fortReduceTotal: 0.35,      // 袭击强度削减合计（-5% + -10%×3）
  defenseWattWithPeak: 56,    // 防御耗电 18 瓦（工作峰值 38 → 56 瓦）

  /* --- §3.2 袭击模型 --- */
  raidPeriodHours: 2,         // 每 2 小时判定一次
  raidRandomMin: 0.95,        // 强度 ×0.95~1.05 随机
  raidRandomMax: 1.05,
  raidStealRatio: 0.1,        // 失守：仓库物品与金币各按 10% 数量被抢
  fortRepairRatio: 0.3,       // 被拆工事修复价 = 建造价 × 30%
  raidCapMul: 1.5,            // 本代强度封顶 ×1.5
  raidWealthScale: 0.5,       // 本代强度 = 时代基数 × (1 + 0.5 × min(财富值 ÷ 参考财富, 1))
  raidWealthSaturation: 1,    // 财富值只作饱和输入 min(财富 ÷ 参考财富, 1)
  raidProgressMin: 0,         // 时代进度 = 本代科技已解锁数 ÷ 本代科技总数（0 → 1）
  raidProgressMax: 1,

  /* --- §3.2.1 角色 / 装备战力 --- */
  charAttrPowerMul: 3,        // 单角色战力 = (生命+命中+力量+防御) × 3 + 装备战力
  charAttrPerStat: 100,       // 属性四项各 1~100 级 → 单角色属性部分最高 1,200
  equipPowerDrMul: 5,         // 装备战力 = 伤害减免% × 5 + 力量值 × 2（防具 / 衣物 / 盾牌）
  equipPowerStrMul: 2,
  weaponPowerStrMul: 2,       // 武器战力 = 力量加成 × 2 + 命中加成 × 1（主手武器）
  weaponPowerHitMul: 1,
  equipSlots: 12,             // 装备共 12 栏
  drCapForCombat: 0.8,        // 战斗力公式里 DR 80% 上限；装备战力按原始值合计，不截断
  fullEquipPowerBase: 1200,   // 属性部分上限（四项各 100 × 3）
  darkSoulSetPower: 646,      // 黑魂套 4 件装备战力（信息偏上档）

  /* --- §3.2.2 五档满装基线 --- */
  equipPowerByEra: [137, 417, 628, 978, 1444],   // stone / medieval / industrial / info / space
  attrAssumeByEra: [10, 25, 45, 65, 85],         // 本代「该有的」属性（四项各）
  fieldedByEra: [9, 11, 13, 15, 18],             // 本代上场人数
  charPowerByEra: [257, 717, 1168, 1758, 2464],  // 单角色战力
  basePowerByEra: [2613, 9437, 21434, 47120, 92102], // 本代满装基地战力
  surplusByEra: [21.8, 21.0, 22.0, 21.7, 20.5],   // 富余倍数（v0.0.20：时代基数整体 ×0.1）

  /* --- §3.2.3 / §3.2.4 袭击强度表 --- */
  raidEra: [
    { id: "stone",      base: 80,    refWealth: 50000,     cap: 120  },
    { id: "medieval",   base: 300,   refWealth: 250000,    cap: 450  },
    { id: "industrial", base: 650,   refWealth: 1000000,   cap: 975  },
    { id: "info",       base: 1450,  refWealth: 4000000,   cap: 2175 },
    { id: "space",      base: 3000,  refWealth: 16000000,  cap: 4500 }
  ],
  raidBaseDivisor: 31.5,      // v0.0.20：旧表整体 ×0.1（约等于满装基地战力 ÷ 31.5，不再按基线现算）

  /* --- §4 商店 --- */
  shopSlots: 6,               // 货架固定 6 格
  shopRandomSlots: 5,         // 1~5 格随机商品
  shopShardSlot: 1,           // 第 6 格固定卖招募券
  shopRefreshSec: 60,         // 每 60 秒刷新一次
  shopPriceMul: 3,            // 买入价 = 卖出价 × 3
  shardBuy: 2000,             // 招募券单价（金币）
  bookBuy: 24000,             // 精通技能书买入价
  bookSell: 8000,             // 精通技能书卖回价（24,000 ÷ 3）
  bookLevels: 10,             // 一本书 = 该角色该工作精通 +10 级
  bookMaxPerWork: 10,         // 每份工作吃 10 本即满级（100 级）
  bookCount: 31,              // 31 本，覆盖 31 份常规工作，不含 2 份恩赐工作
  bookTotalCost: 7440000,     // 全买 310 本 = 744 万金
  resaleDecayMul: 0.9,        // 同一物品连续卖出回收价 ×0.9
  resaleDecayFloor: 0.2,      // 下限 20%
  tradeCapPerWealth: 2,       // 总交易额 ≤ 财富值 × 2（每小时）
  starDustPerPotion: 3,       // 升星药水 3 星尘 / 瓶
  starUpStarBonus: 0.2,       // 每星该角色自带工作加成 +20%
  starMax: 5,                 // ★1 → ★5，合计 +100%
  starPotionsTotal: 10,       // 满星 10 瓶 = 30 星尘（每星 1 / 2 / 3 / 4 瓶）
  starDustPerFullStar: 30,    // 满星合计 30 星尘 = 一次池集齐保底

  /* --- §5 图鉴 --- */
  codexItems: 208,            // 全部 208 种物品
  codexEnemies: 26,           // 26 种敌人（18 普通 + 4 黑魂怪 + 4 模拟纪元怪）
  codexCharacters: 9,         // 9 名英雄
  codexEnemyNormal: 18,
  codexEnemyDarkSoul: 4,
  codexEnemySimEra: 4,

  /* --- §7 仓库 / 粮仓 --- */
  warehouseStart: 20,         // 初始仓库格数
  warehousePerTier: 34,       // 每次扩容 +34 格
  warehouseTiers: 6,          // 6 次阶段式扩容
  warehouseMax: 224,          // 终局 224 格（194 占用 + 30 余量）
  warehouseOccupiedItems: 194,// 占仓库格的物品种类
  granaryItems: 17,           // 粮仓类 17 种（14 食材 / 种子 + 3 熟食），v0.0.35 起容量无限
  granaryBaseHalfLife: 600,   // 基础腐坏：每 600 秒减半（粮仓升级项再按 spoilMul 拉低）
  totalItems: 215,            // 物品总数 215 种（195 仓库 + 17 粮仓 + 3 虚拟资源包）
  workCount: 33,              // 33 份工作（31 常规 + 2 恩赐），被动不计入工作总数
  workCountRegular: 31,
  workCountGift: 2,
  upgradeShowResourceRatio: 0.3, // 旧口径（v0.0.23~0.0.26）：持有 ≥30% 所需资源才显示
  upgradeShowEverOwned: true,    // v0.0.27：首次拥有 1 份每种所需资源后永久显示

  /* --- 被动七套（§一） --- */
  passiveSets: ["住所与娱乐", "防御", "商店", "角色", "图鉴", "招募", "仓库"],
  passiveUnlockTech: {         // 各套的解锁条件
    housing: "语言",
    defense: "财富值 ≥ 5,000",
    shop: "文字",
    characters: null,          // #角色 常驻，无解锁闸门
    codex: null,               // #图鉴 始终显示
    recruit: "发现第一张招募券",
    warehouse: null            // #仓库 开局即显示
  },
  defenseUnlockWealth: 5000,   // #防御 的解锁门槛：财富值 ≥ 5,000
  masteryMaxLevel: 100,        // 精通 100 级（每「角色 × 工作」各一份，换人不继承）
  masterySpeedPerTier: 0.01,   // 实际周期 = 基础周期 ÷ (1 + 0.01 × ⌊精通等级 ÷ 10⌋)
  masterySpeedTierSize: 10,
  masteryMaxSpeed: 0.1         // 满级 100 级 = +10% 速度
};

/* 便捷汇总（供实现直接引用，不重复手写） */
window.PASSIVE_TOTALS = {
  housingTiers: 6,
  housingCapFirst: 7,
  housingCapLast: 17,
  housingCapHard: 18,
  comfortTiers: 16,
  comfortSum: 100,
  comfortByEra: { stone: 12, medieval: 22, industrial: 27, info: 24, space: 15 },
  fortTiers: 14,
  fortPowerSum: 47750,
  fortWattSum: 18,
  fortReduceSum: 0.35,
  warehouseTiers: 6,
  warehouseStep: 34,
  warehouseSlots: [20, 54, 88, 122, 156, 190, 224],
  granaryTiers: 3
};
