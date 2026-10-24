/*
 * js/data/jobs.js — 33 份工作（31 常规 + 2 恩赐工作）
 *
 * 数据来源：工作表.md（§2 总览 / §3 产出清单与配方 / §4~§9 各工作 / §11 电力）、
 *           科技树.md（工作由哪个科技点亮）、敌人表.md（狩猎区域 / 两只恩赐怪）
 *
 * 时间基准：tick 200ms，1 天 = 24 秒（1 秒 = 1 小时）。duration = 基础周期（秒）；
 *           实际周期 = duration ÷ (1 + 0.01 × ⌊精通等级 ÷ 10⌋)（满级 100 级 = +10% 速度）。
 * 精通：角色 × 工作 各一份，产出基数不因精通改变。
 *
 * 升级项 4 档阶梯（工作表 §1.1）：
 *   1 档 0%（只解锁项目；采集例外 +25%）：100 主材 + 50 辅材    2 档 +50%：300 主材 + 150 辅材
 *   3 档 +75%：800 主材 + 400 辅材        4 档 +75%~100%：2,000 主材 + 500 机械零件，⚡ 耗电 +1 瓦
 *   主材按时代：石器 木材 / 中世纪 铁锭 / 工业 钢铁 / 信息 钛合金 / 太空 外星合金
 *   4 档按时代：石器·中世纪 2,000 铁锭 + 500 机械零件；工业 2,000 钢铁 + 500 机械零件；
 *               信息 2,000 钛合金 + 500 精密零件；太空 2,000 外星合金 + 500 反物质
 *   工作表只列名字、没列价格的「标准 4 档」工作按此阶梯推导；第 3 档辅材按表内多数写法取「石材」。
 *   例外：采矿 6 档、电力 5 档；信息 / 太空多数工作只有 2~3 档（表内写几档就是几档）。
 *
 * 显示规则：未解锁的工作完全不可见（不是置灰）；升级项必须「随工作解锁」+「持有 ≥30% 所需资源」才显示。
 * ⚡ 耗电：瓦是每秒持续功率，只在运转中（有人 + 有料 + 有电）计入；升级项 +1 瓦同理。
 *   job.powerUse = 该工作运转中每秒耗电（9 个工作合计 9.65 瓦）；升级项 watt = 该档是否 +1 瓦。
 *
 * inputs / outputs 一律用中文物品名（引擎自己映射到物品 id）。
 * 装备制造（加工 / 锻造 / 裁缝）标记 equipment:true：85 件装备的配方由引擎从 items.js 的 cost 生成，
 *   不在这里重复抄材料，避免物品造价与工作配方两处漂移。
 * 工作表写「投料比例写实现时回填」的（熔炼 → 钢铁）inputs 留空，并在 note 标出。
 */
window.JOBS = [
  /* ------------------------------------------------------------------ *
   * 一、石器时代（12 份）
   * ------------------------------------------------------------------ */
  {
    id: "woodcutting",
    name: "伐木",
    era: "stone",
    order: 1,
    alwaysVisible: false,
    visibleMilestone: "wood_stone",   // 曾经拥有 1 木材 + 1 石头后永久显示
    recipeUpgrade: 0,                 // 先买石斧，才出现「木材」项目
    tech: null,
    category: "collect",
    duration: 2,
    inputs: {},
    outputs: { "木材": 1 },
    powerUse: 0,
    upgrades: [
      { name: "石斧", watt: 0, bonusPct: 0, cost: { "木材": 2, "石头": 2 } },
      { name: "铜斧", watt: 0, bonusPct: 25, cost: { "木材": 100, "铜锭": 50 }, tech: "金属冶炼", req: 0, note: "" },
      { name: "铁斧", watt: 0, bonusPct: 25, cost: { "木材": 100, "铁锭": 50 }, tech: "金属冶炼", req: 1, note: "" },
      { name: "伐木小屋", watt: 0, bonusPct: 50, cost: { "木材": 300, "石材": 150 }, note: "" },
      { name: "伐木场", watt: 0, bonusPct: 75, cost: { "木材": 800, "石材": 400 }, note: "" },
      { name: "蒸汽锯", watt: 1, bonusPct: 100, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "v0.0.27：曾经拥有 1 木材 + 1 石头后永久显示；先买「石斧」（2 木材 + 2 石头）才出现木材项目。2 秒 1 木材 = 30 木材/分钟；1 个伐木工喂 0.75 个加工工。产出的木材是石器时代主材料，也是燃料 / 造纸 / 木工原料。"
  },
  {
    id: "mining",
    name: "采矿",
    era: "stone",
    order: 2,
    alwaysVisible: false,
    visibleMilestone: "wood_stone",   // 曾经拥有 1 木材 + 1 石头后永久显示
    recipeUpgrade: 0,                 // 先买石镐，才出现矿石项目
    tech: null,
    category: "collect",
    duration: 3,
    inputs: {},
    outputs: {},
    powerUse: 0,
    ores: [
      { name: "石头", weight: 100, tech: null },
      { name: "铜矿", weight: 40, tech: null },
      { name: "沙", weight: 30, tech: "陶器" },
      { name: "石灰石", weight: 25, tech: "混凝土" },
      { name: "铁矿", weight: 20, tech: "金属冶炼" },
      { name: "硝酸", weight: 12, tech: "蒸汽机" },
      { name: "铝土矿", weight: 12, tech: "半导体" },
      { name: "稀土", weight: 10, tech: "半导体" },
      { name: "银矿", weight: 8, tech: "钢铁" },
      { name: "钛矿", weight: 6, tech: "半导体" },
      { name: "金矿", weight: 4, tech: "岩石切割" },
      { name: "铀矿", weight: 3, tech: "核能" }
    ],
    upgrades: [
      { name: "石镐", watt: 0, bonusPct: 0, cost: { "木材": 2, "石头": 2 } },
      { name: "铜镐", watt: 0, bonusPct: 25, cost: { "木材": 100, "铜锭": 50 }, tech: "金属冶炼", req: 0, note: "" },
      { name: "铁镐", watt: 0, bonusPct: 25, cost: { "木材": 100, "铁锭": 50 }, tech: "金属冶炼", req: 1, note: "" },
      { name: "采矿小屋", watt: 0, bonusPct: 50, cost: { "木材": 300, "石材": 150 }, note: "" },
      { name: "采矿场", watt: 0, bonusPct: 75, cost: { "木材": 800, "石材": 400 }, note: "" },
      { name: "爆破", watt: 0, bonusPct: 0, cost: { "火药": 500, "铁锭": 1000 }, note: "解锁深层矿：银矿 / 金矿 权重 ×2；每次开采另耗 1 火药；可随时退回表层矿" },
      { name: "选矿厂", watt: 0, bonusPct: 0, cost: { "铁锭": 3000, "机械零件": 800 }, note: "铁矿 / 银矿 / 金矿 / 稀土 / 铀矿 权重 ×2，石头 ÷2" },
      { name: "电动矿钻", watt: 1, bonusPct: 100, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    blast: {
      name: "爆破",
      tech: "火药",
      tiers: 4,
      cost: { "火药": 500, "铁锭": 1000 },
      effect: "解锁深层矿：银矿 / 金矿 权重 ×2",
      consume: { "火药": 1 },
      note: "开启后每次开采另耗 1 火药（持续耗材，不是一次性造价）；玩家可随时退回表层矿 —— 不烧火药、也没有稀有矿加成。这是火药唯一的持续消耗方。"
    },
    orePlant: {
      name: "选矿厂",
      tech: "机械加工",
      techNote: "工作表 §4.2.3 原文写 *机械加工（工业 200）；科技树.md 没有「机械加工」科技，对应条目是「精密机床（蒸汽机 → 200）」。此处按工作表原文记录。",
      tiers: 5,
      cost: { "铁锭": 3000, "机械零件": 800 },
      doubleWeights: ["铁矿", "银矿", "金矿", "稀土", "铀矿"],
      halveWeights: ["石头"],
      effect: "稀有矿权重 ×2，石头 ÷2",
      note: "两个修改器全开后（*核能 阶段）石头权重 100 → 50，石头概率从 41.7% 掉到约 21%，金银翻倍。"
    },
    special: "mining",
    note: "v0.0.27：曾经拥有 1 木材 + 1 石头后永久显示；先买「石镐」（2 木材 + 2 石头）才出现矿石项目。3 秒 1 票，从 12 种矿按权重抽 1 种；概率 = 该矿权重 ÷ 当时已解锁矿的总权重（每解锁一种新矿，老矿概率自动被稀释，不需要分阶段配表）。开局只有 石头 100 / 铜矿 40（71.4% / 28.6%）。石油已拆到独立的 #石油开采 工作；硝酸仍由采矿产出。1.5 个采矿工喂 1 个熔炼工。"
  },
  {
    id: "gathering",
    name: "采集",
    era: "stone",
    order: 3,
    alwaysVisible: true,
    tech: null,
    category: "collect",
    duration: 3,
    inputs: {},
    outputs: {},
    recipes: [
      { name: "草地", outputs: { "草地资源": 1 }, era: "stone", duration: 3,
        note: "植物纤维 90%；谷物 / 豆类 / 蔬菜 / 甜菜 / 药草种子合计 10%（每种 2%）" },
      { name: "平原", outputs: { "平原资源": 1 }, era: "stone", duration: 3,
        note: "石头 / 木材 / 浆果 / 块根 / 坚果，各 20%" },
      { name: "沼泽", outputs: { "沼泽资源": 1 }, era: "stone", duration: 3, milestone: "injured",
        note: "野菌 / 药草，各 50%；至少一名角色受过伤后永久显示" }
    ],
    powerUse: 0,
    upgrades: [
      { name: "采集篮", watt: 0, bonusPct: 25, cost: { "木材": 100, "石头": 50 }, note: "" },
      { name: "采集小屋", watt: 0, bonusPct: 50, cost: { "木材": 300, "石材": 150 }, note: "" },
      { name: "晾晒架", watt: 0, bonusPct: 75, cost: { "木材": 800, "石材": 400 }, note: "" },
      { name: "温室采集", watt: 1, bonusPct: 100, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "v0.0.27：拆成草地 / 平原 / 沼泽三个项目，每个项目 3 秒产出 1 份资源包，资源包按权重随机变成其中 1 种物品。草地 = 植物纤维 90% + 种子合计 10%（谷物 / 豆类 / 蔬菜 / 甜菜 / 药草种子各 2%）；平原 = 石头 / 木材 / 浆果 / 块根 / 坚果各 20%；沼泽 = 野菌 / 药草各 50%，且至少一名角色受伤后才永久显示。开局只显示采集。"
  },
  {
    id: "farming",
    name: "种植",
    era: "stone",
    order: 4,
    alwaysVisible: false,
    tech: "作物栽培",
    category: "collect",
    duration: 3,
    inputs: { "谷物种子": 1 },
    outputs: { "谷物": 6 },
    powerUse: 0,
    recipes: [
      { name: "谷物", inputs: { "谷物种子": 1 }, outputs: { "谷物": 6 }, era: "stone", unlockTech: null, duration: 3 },
      { name: "豆类", inputs: { "豆类种子": 1 }, outputs: { "豆类": 6 }, era: "stone", unlockTech: null, duration: 3 },
      { name: "蔬菜", inputs: { "蔬菜种子": 1 }, outputs: { "蔬菜": 6 }, era: "stone", unlockTech: null, duration: 3 },
      { name: "甜菜", inputs: { "甜菜种子": 1 }, outputs: { "甜菜": 6 }, era: "stone", unlockTech: null, duration: 3 },
      { name: "药草", inputs: { "药草种子": 1 }, outputs: { "药草": 6 }, era: "stone", unlockTech: null, duration: 3,
        note: "药草种子 → 6 药草（进仓库，供医疗），不产食材" },
      { name: "干草", inputs: {}, outputs: { "草料": 6 }, era: "stone", unlockTech: null, duration: 4,
        note: "不消耗种子 / 食材，4 秒晒制 6 草料" }
    ],
    upgrades: [
      { name: "石锄", watt: 0, bonusPct: 0, cost: { "木材": 100, "石头": 50 }, note: "" },
      { name: "灌溉", watt: 0, bonusPct: 50, cost: { "木材": 300, "石头": 150 }, note: "" },
      { name: "温室", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" },
      { name: "化肥", watt: 0, bonusPct: 100, cost: { "堆肥": 1 }, note: "每次消耗 1 堆肥" }
    ],
    special: null,
    note: "1 种子 → 6 对应作物，不再附赠草料；收成由播的种子决定：谷物 / 豆类 / 蔬菜 / 甜菜 种子 → 对应作物，药草种子 → 6 药草（仓库材料，供医疗，不是食材）。草料只由「干草」项目产出：不消耗任何物品，4 秒产 6 草料。大麻 / 棉花 种子需 *缝制（中世纪 120）解锁。upgrades[2] 温室是第 3 档，故第 4 档「化肥」不带 ⚡。1 个种植工需 1 个烹饪工（120 食材/分钟）。"
  },
  {
    id: "hunting",
    name: "狩猎",
    era: "stone",
    order: 5,
    alwaysVisible: false,
    tech: "弓",
    category: "combat",
    duration: 0,
    inputs: {},
    outputs: {},
    powerUse: 0,
    regions: [
      { name: "森林", unlock: "石器时代开局", tech: null, enemies: ["兔子", "松鸡", "鹿", "野猪", "狼", "熊"] },
      { name: "草原", unlock: "石器时代中期", tech: null, enemies: ["野山羊", "羚羊", "驼鹿", "野牛"] },
      { name: "极地", unlock: "中世纪", tech: "航海", enemies: ["猛犸"] },
      { name: "沼泽", unlock: "中世纪", tech: null, enemies: ["鳄鱼", "巨蜥"] },
      { name: "荒原", unlock: "工业时代", tech: null, enemies: ["犀牛"] },
      { name: "废墟", unlock: "信息时代", tech: null, enemies: ["机械兽"] },
      { name: "变异区", unlock: "信息时代", tech: null, enemies: ["变异巨兽"] },
      { name: "外星", unlock: "太空时代", tech: "星际航行基础", enemies: ["外星掠食者", "硅基生物"] }
    ],
    upgrades: [],
    special: "hunting",
    note: "duration = 0 表示周期不是固定秒数：周期 = 敌人 HP ÷ 该角色实际 DPS × 命中率（自动回合对决，实时时钟）。区域有固定敌人池 —— 进入区域随机抽 1 只，击杀后 3 秒刷下一只，旧区域永远可访问（8 区域 / 18 种普通敌人）。产出：肉类食材（按敌人肉量）+ 皮革 + 骨 / 角 + 羽毛 + 图鉴认知度，任何工作都有极低概率产招募券。打输只重伤（HP < 最大生命 20% → 不产出、不能参战，需 #医疗），角色永不死亡；没有逃跑机制，产出按已造成伤害比例折算；离线按期望值结算。升级项 = 29 把武器（28 常规 + 黑魂套深渊大剑），护盾腰带三档暂缓 —— 武器属于 item 数据（战斗系统.md「各时代武器全表」），因此 upgrades 留空。"
  },
  {
    id: "husbandry",
    name: "畜牧",
    era: "stone",
    order: 6,
    alwaysVisible: false,
    tech: "畜牧业",
    category: "collect",
    duration: 0,
    inputs: {},
    outputs: {},
    powerUse: 0,
    recipes: [
      { name: "加工草料", inputs: { "素食食材": 2 }, outputs: { "草料": 1 }, era: "stone", unlockTech: null, duration: 4,
        note: "把 2 份素食食材加工成 1 草料" },
      { name: "喂养畜群", feed: true, inputs: {}, outputs: {}, era: "stone", unlockTech: null, duration: 24,
        note: "派驻角色后按周期消耗「所有动物草料消耗之和」；进度条填满只扣草料，动物产物由「畜牧」区各自的进度条产出" }
    ],
    upgrades: [
      { name: "圈舍", watt: 0, bonusPct: 0, cap: 5, cost: { "木材": 100, "石材": 50 }, note: "畜牧容量 +5" },
      { name: "饲料槽", watt: 0, bonusPct: 25, cost: { "木材": 300, "草料": 150 }, note: "" },
      { name: "大型牧场", watt: 0, bonusPct: 0, cap: 15, cost: { "木材": 800, "石材": 400 }, note: "畜牧容量 +15" },
      { name: "自动喂食机", watt: 1, bonusPct: 50, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "前置：该敌人的图鉴认知度满 100 —— 认知度是狩猎解锁畜牧的唯一路径。项目一「加工草料」消耗食材产出草料；项目二「喂养畜群」派驻角色后，每 24 秒（受畜牧速度影响）扣一次「所有动物草料消耗之和」，只有它有人入驻且草料充足时，下方「畜牧」区各动物的进度条才推进、进度条满才产出。畜牧速度加成同时作用于喂养与所有动物。网格按「畜牧容量」排布：初始 5，圈舍 +5、大型牧场 +15；体型占用 极小 0.5 / 小 1 / 中 2 / 大 3 / 极大 5。每只动物消耗 1 草料 / 天（1 天 = 24 秒）。机械兽、硅基生物不能畜牧。零风险纯周期，离线同伐木规则。"
  },
  {
    id: "cooking",
    name: "烹饪",
    era: "stone",
    order: 7,
    alwaysVisible: false,
    tech: "火",
    category: "process",
    duration: 2,
    inputs: { "素食食材": 4 },
    outputs: { "素餐": 8 },
    powerUse: 0,
    recipes: [
      { name: "素餐", inputs: { "素食食材": 4 }, outputs: { "素餐": 8 }, era: "stone", unlockTech: null, duration: 2 },
      { name: "肉餐", inputs: { "肉食食材": 4 }, outputs: { "肉餐": 8 }, era: "stone", unlockTech: null, duration: 2 },
      { name: "均衡餐", inputs: { "素食食材": 2, "肉食食材": 2 }, outputs: { "均衡餐": 8 }, era: "stone", unlockTech: null, duration: 2 }
    ],
    upgrades: [
      { name: "灶台", watt: 0, bonusPct: 0, cost: { "木材": 100, "石头": 50 }, note: "" },
      { name: "厨房", watt: 0, bonusPct: 50, cost: { "木材": 300, "石头": 150 }, note: "" },
      { name: "大厨房", watt: 0, bonusPct: 75, cost: { "木材": 800, "石材": 400 }, note: "" },
      { name: "自动厨房", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "2 秒：4 食材 → 8 熟食；做哪一种看喂什么（素餐 = 4 素食食材 / 肉餐 = 4 肉食食材 / 均衡餐 = 素 + 肉 各 2）。1 个采集工只需 0.5 个烹饪工，1 个种植工需 1 个。"
  },
  {
    id: "crafting",
    name: "加工",
    era: "stone",
    order: 8,
    alwaysVisible: false,
    tech: "石器工艺",
    category: "craft",
    duration: 3,
    equipment: true,
    powerUse: 0,
    upgrades: [
      { name: "工作台", watt: 0, bonusPct: 0, cost: { "木材": 100, "石头": 50 }, note: "" },
      { name: "工匠坊", watt: 0, bonusPct: 50, cost: { "木材": 300, "石头": 150 }, note: "" },
      { name: "骨器工艺", watt: 0, bonusPct: 0, cost: { "木材": 800, "骨 / 角": 400 }, note: "解锁骨器系装备" },
      { name: "电动工具", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "3 秒一件，材料按 资源表.md 各装备「造价」栏自动生成。石器时代 15 件装备全部由本工作造（那时锻造 / 裁缝未解锁）；中世纪的长弓 / 弩也留在这里。共 17 件装备，不产出硅片 / 光纤（已分别移到 半导体制造 / 玻璃制造）。"
  },
  {
    id: "research",
    name: "科研",
    era: "stone",
    order: 9,
    alwaysVisible: false,
    visibleMilestone: "research_ready",   // 曾经攒到基础研究桌 30% 材料后永久显示
    recipeUpgrade: 0,                    // 先买基础研究桌，才出现「科研点」项目
    tech: null,
    category: "research",
    duration: 5,
    inputs: {},
    outputs: { "科研点": 1 },
    powerUse: 0,
    upgrades: [
      { name: "基础研究桌", watt: 0, bonusPct: 0, cost: { "木材": 100, "石头": 50 }, note: "" },
      { name: "图书馆", watt: 0, bonusPct: 50, cost: { "木材": 300, "纸张": 150 }, note: "" },
      { name: "网络", watt: 0, bonusPct: 100, cost: { "钛合金": 2000, "精密零件": 500 }, note: "" },
      { name: "实验室", watt: 1, bonusPct: 50, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: "research",
    note: "v0.0.27：曾经攒到「基础研究桌」30% 所需资源（30 木材 + 15 石头）后永久显示；先买基础研究桌，才出现「科研点」项目。5 秒 1 科研点（= 720 点/小时）；喂 纸张 → ×1.5。科研点喂 42 个科技，合计 44,280 点。科研加成全叠满（科技 *文字 +25% / *网络 +100%，升级项 图书馆 +50% / 网络 +100% / 实验室 +50%，纸张 +50%）约 ×19.5，单人可达 ≈14,000 点/小时。"
  },
  {
    id: "stonecutting",
    name: "切石机",
    era: "stone",
    order: 10,
    alwaysVisible: false,
    tech: "岩石切割",
    category: "process",
    duration: 4,
    inputs: { "石头": 2 },
    outputs: { "石材": 1 },
    powerUse: 0,
    upgrades: [
      { name: "碎石锤", watt: 0, bonusPct: 0, cost: { "木材": 100, "石头": 50 }, note: "" },
      { name: "水力切石", watt: 0, bonusPct: 50, cost: { "木材": 300, "石头": 150 }, note: "" },
      { name: "大型石场", watt: 0, bonusPct: 75, cost: { "木材": 800, "石材": 400 }, note: "" },
      { name: "电锯切石", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "4 秒 / 2 石头 → 1 石材。留在石器时代，石材才能在石器期供上长屋（800 木材 + 400 石材）。"
  },
  {
    id: "pottery",
    name: "制陶",
    era: "stone",
    order: 11,
    alwaysVisible: false,
    tech: "陶器",
    category: "process",
    duration: 5,
    inputs: { "沙": 1 },
    outputs: { "陶器": 1 },
    powerUse: 0,
    upgrades: [
      { name: "陶轮", watt: 0, bonusPct: 0, cost: { "木材": 100, "沙": 50 }, note: "" },
      { name: "陶窑", watt: 0, bonusPct: 50, cost: { "木材": 300, "沙": 150 }, note: "" },
      { name: "大型陶窑", watt: 0, bonusPct: 75, cost: { "木材": 800, "石材": 400 }, note: "" },
      { name: "电窑", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "5 秒 / 1 沙 → 1 陶器。配方里没有水（「水井」这个产出方不存在）。陶器用于粮仓容量升级项。"
  },
  {
    id: "medicine",
    name: "医疗",
    era: "stone",
    order: 12,
    alwaysVisible: false,
    visibleMilestone: "injured",       // 至少一名角色受过伤后永久显示
    tech: null,
    category: "process",
    duration: 3,
    recipes: [
      { name: "草药", inputs: { "药草": 1 }, outputs: { "草药": 1 }, era: "stone", unlockTech: null, duration: 3,
        note: "把 1 药草捣成 1 草药；医疗工作同时让全队回血速度提高" },
      { name: "草药药剂", inputs: { "药草": 3 }, outputs: { "草药药剂": 1 }, era: "medieval", unlockTech: "医疗", duration: 5,
        note: "原「药剂」工作的基础配方，已并入医疗" },
      { name: "医药", inputs: { "草药药剂": 1, "化学燃料": 1 }, outputs: { "医药": 1 }, era: "industrial", unlockTech: "火药", duration: 5 },
      { name: "闪耀医药", inputs: { "医药": 1, "稀土": 1, "化学燃料": 2, "药草": 1 }, outputs: { "闪耀医药": 1 }, era: "info", unlockTech: "半导体", duration: 10,
        note: "此配方 10 秒（其余 3~5 秒）" }
    ],
    powerUse: 0,
    upgrades: [
      { name: "研钵", watt: 0, bonusPct: 0, cost: { "木材": 100, "石头": 50 }, note: "" },
      { name: "药剂实验室", watt: 0, bonusPct: 50, cost: { "铁锭": 300, "银锭": 150 }, note: "" },
      { name: "医院", watt: 0, bonusPct: 75, cost: { "铁锭": 800, "玻璃": 400 }, note: "" },
      { name: "自动医疗床", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "v0.0.30：原「药剂」工作整体并入医疗，成为医疗的 3 个新配方；「医疗床」升级项改名「研钵」，「医疗设备」改名「药剂实验室」。项目「草药」= 3 秒消耗 1 药草 → 1 草药；「草药药剂」需科技 *医疗（中世纪 120）；「医药」「闪耀医药」沿用原药剂的 *火药 / *半导体 门槛。医疗工作有人入驻时全队回血速度提高；把草药 / 草药药剂 / 医药 / 闪耀医药放进角色的医物栏，受伤时还会按时代额外加速回血（草药 ×2、草药药剂 ×3、医药 ×4、闪耀医药 ×6）。1~2 档随工作可见，3~4 档另由工业科技「公共卫生」解锁。"
  },

  /* ------------------------------------------------------------------ *
   * 二、中世纪（8 份）
   * ------------------------------------------------------------------ */
  {
    id: "smelting",
    name: "熔炼",
    era: "medieval",
    order: 13,
    alwaysVisible: false,
    tech: "金属冶炼",
    category: "process",
    duration: 4,
    inputs: { "铜矿": 2, "木材": 1 },
    outputs: { "铜锭": 1 },
    powerUse: 0,
    recipes: [
      { name: "铜锭", inputs: { "铜矿": 2, "木材": 1 }, outputs: { "铜锭": 1 }, era: "medieval", unlockTech: null, duration: 4 },
      { name: "铁锭", inputs: { "铁矿": 2, "木材": 1 }, outputs: { "铁锭": 1 }, era: "medieval", unlockTech: null, duration: 4 },
      { name: "银锭", inputs: { "银矿": 2, "木材": 1 }, outputs: { "银锭": 1 }, era: "medieval", unlockTech: "钢铁", duration: 4 },
      { name: "金锭", inputs: { "金矿": 2, "木材": 1 }, outputs: { "金锭": 1 }, era: "stone", unlockTech: "岩石切割", duration: 4 },
      { name: "铝合金", inputs: { "铝土矿": 2, "木材": 1 }, outputs: { "铝合金": 1 }, era: "info", unlockTech: "半导体", duration: 4 },
      { name: "钛合金", inputs: { "钛矿": 2, "木材": 1 }, outputs: { "钛合金": 1 }, era: "info", unlockTech: "半导体", duration: 4 },
      { name: "钢铁", inputs: { "铁锭": 1, "木材": 1 }, outputs: { "钢铁": 1 }, era: "medieval", unlockTech: "钢铁", duration: 4, note: "二级精炼：铁锭 → 钢铁。工作表原文「投料比例写实现时回填」，此处取 1 铁锭 + 1 木材 / 4 秒（价格规则：钢铁 27 = 铁锭 18 × 1.5）。" }
    ],
    upgrades: [
      { name: "风箱", watt: 0, bonusPct: 0, cost: { "铜矿": 100, "木材": 50 }, note: "" },
      { name: "高炉", watt: 0, bonusPct: 50, cost: { "铁锭": 300, "石头": 150 }, note: "" },
      { name: "大型熔炉", watt: 0, bonusPct: 75, cost: { "铁锭": 800, "石材": 400 }, note: "" },
      { name: "电弧炉", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "4 秒 / 2 矿石 + 1 木材 → 1 金属锭；出哪种由你喂哪种矿。铜 / 铁 中世纪开局就有，银 要 *钢铁，金 要 *岩石切割（石器 80），铝 / 钛 要 *半导体（信息 2,400）。「钢锭」已并入「钢铁」。1.5 个采矿工喂 1 个熔炼工。"
  },
  {
    id: "forging",
    name: "锻造",
    era: "medieval",
    order: 14,
    alwaysVisible: false,
    tech: "锻造",
    category: "craft",
    duration: 5,
    equipment: true,
    powerUse: 0,
    upgrades: [
      { name: "铁砧", watt: 0, bonusPct: 0, cost: { "铁锭": 100, "木材": 50 }, note: "" },
      { name: "锻造坊", watt: 0, bonusPct: 50, cost: { "铁锭": 450 }, note: "" },
      { name: "大型锻炉", watt: 0, bonusPct: 75, cost: { "钢铁": 800, "石材": 400 }, note: "" },
      { name: "蒸汽锤", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "5 秒一件，材料按 资源表.md 各装备「造价」栏自动生成。v0.0.30 起工业 / 信息 / 太空装备全部移到机械加工，本工作只剩中世纪金属类装备与武器 18 件；石器时代装备与长弓 / 弩归 加工，布料 / 皮革 / 毛料防具归 裁缝。"
  },
  {
    id: "carpentry",
    name: "木工",
    era: "medieval",
    order: 15,
    alwaysVisible: false,
    tech: "木工",
    category: "process",
    duration: 4,
    inputs: { "木材": 2 },
    outputs: { "木板": 1 },
    powerUse: 0,
    upgrades: [
      { name: "手锯", watt: 0, bonusPct: 0, cost: { "铁锭": 100, "木材": 50 }, note: "" },
      { name: "锯木厂", watt: 0, bonusPct: 50, cost: { "铁锭": 300, "木材": 150 }, note: "" },
      { name: "大型锯木厂", watt: 0, bonusPct: 75, cost: { "铁锭": 800, "石材": 400 }, note: "" },
      { name: "电锯", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "4 秒 / 2 木材 → 1 木板。标准 4 档（工作表只给名字，价格按 §1.1 阶梯推导）。"
  },
  {
    id: "weaving",
    name: "纺织",
    era: "medieval",
    order: 16,
    alwaysVisible: false,
    tech: "缝制",
    category: "process",
    duration: 4,
    inputs: { "大麻": 2 },
    outputs: { "布料": 1 },
    powerUse: 0,
    recipes: [
      { name: "布料（大麻）", inputs: { "大麻": 2 }, outputs: { "布料": 1 }, era: "medieval", unlockTech: null, duration: 4 },
      { name: "布料（棉花）", inputs: { "棉花": 2 }, outputs: { "布料": 1 }, era: "medieval", unlockTech: null, duration: 4 },
      { name: "布料（毛料）", inputs: { "毛料": 2 }, outputs: { "布料": 1 }, era: "medieval", unlockTech: null, duration: 4 }
    ],
    upgrades: [
      { name: "纺锤", watt: 0, bonusPct: 0, cost: { "铁锭": 100, "木材": 50 }, note: "" },
      { name: "织布机", watt: 0, bonusPct: 50, cost: { "铁锭": 300, "毛料": 150 }, note: "" },
      { name: "大型织坊", watt: 0, bonusPct: 75, cost: { "铁锭": 800, "石材": 400 }, note: "" },
      { name: "电动织机", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "4 秒：2 纤维 / 毛料 → 1 布料（2 大麻 / 2 棉花 / 2 毛料 三种投料）。大麻、棉花由 种植 产出，但种子要 *缝制（中世纪 120）才解锁。标准 4 档，价格按 §1.1 阶梯推导、第 3 档辅材取石材。"
  },
  {
    id: "tailoring",
    name: "裁缝",
    era: "medieval",
    order: 17,
    alwaysVisible: false,
    tech: "缝制",
    category: "craft",
    duration: 5,
    equipment: true,
    powerUse: 0,
    upgrades: [
      { name: "缝纫针", watt: 0, bonusPct: 0, cost: { "铁锭": 100, "木材": 50 }, note: "" },
      { name: "裁缝铺", watt: 0, bonusPct: 50, cost: { "铁锭": 300, "布料": 150 }, note: "" },
      { name: "大型裁缝铺", watt: 0, bonusPct: 75, cost: { "铁锭": 800, "石材": 400 }, note: "" },
      { name: "缝纫机", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "5 秒一件，材料按 资源表.md 各装备「造价」栏自动生成。v0.0.30 起工业 / 信息 / 太空装备全部移到机械加工；本工作只剩中世纪布料 / 皮革 / 毛料防具 5 件（布帽、布衬衣、布衬裤、羊毛袜、银项链）。"
  },
  {
    id: "carpet_weaving",
    name: "编织",
    era: "medieval",
    order: 18,
    alwaysVisible: false,
    tech: "缝制",
    category: "craft",
    duration: 4,
    inputs: { "植物纤维": 2, "布料": 1 },
    outputs: { "地毯": 1 },
    powerUse: 0,
    upgrades: [
      { name: "编织架", watt: 0, bonusPct: 0, cost: { "铁锭": 100, "植物纤维": 50 }, note: "" },
      { name: "编织坊", watt: 0, bonusPct: 50, cost: { "铁锭": 300, "植物纤维": 150 }, note: "" },
      { name: "大型编织坊", watt: 0, bonusPct: 75, cost: { "铁锭": 800, "布料": 400 }, note: "" }
    ],
    special: null,
    note: "4 秒 / 2 植物纤维 + 1 布料 → 1 地毯。工作表只给 3 档（没有第 4 档 ⚡）。"
  },
  {
    id: "papermaking",
    name: "造纸",
    era: "medieval",
    order: 19,
    alwaysVisible: false,
    tech: "文字",
    category: "process",
    duration: 4,
    inputs: { "木材": 3 },
    outputs: { "纸张": 1 },
    powerUse: 0,
    upgrades: [
      { name: "打浆机", watt: 0, bonusPct: 0, cost: { "铁锭": 100, "木材": 50 }, note: "" },
      { name: "造纸厂", watt: 0, bonusPct: 50, cost: { "铁锭": 300, "木材": 150 }, note: "" },
      { name: "大型造纸厂", watt: 0, bonusPct: 75, cost: { "铁锭": 800, "石材": 400 }, note: "" },
      { name: "自动造纸线", watt: 1, bonusPct: 75, cost: { "铁锭": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "4 秒 / 3 木材 → 1 纸张；纸张是 #9 科研 的提速料（喂纸张 → 科研点 ×1.5）与图书馆 / 建造材料。由 *文字（中世纪 60 点）解锁。标准 4 档，价格按 §1.1 阶梯推导。"
  },

  /* ------------------------------------------------------------------ *
   * 三、工业时代（5 份）
   * ------------------------------------------------------------------ */
  {
    id: "power",
    name: "电力",
    era: "industrial",
    order: 20,
    alwaysVisible: false,
    tech: "电力",
    category: "power",
    duration: 3,
    inputs: { "木材": 2 },
    outputs: { "电力": 10 },
    powerUse: 0,
    generators: [
      { name: "电力工作（燃木）", watt: 10, cost: { "木材": 2 }, duration: 3, tech: "电力", workers: 1, note: "基础产电：2 木材 / 3 秒 → 10 瓦，要 1 人" },
      { name: "蒸汽发电机", watt: 25, cost: { "木材": 4 }, duration: 3, tech: "电力", workers: 1, note: "升级项 1：换燃料 4 木材 / 3 秒 → 25 瓦，1 人顶 2.5 个电力工" },
      { name: "风力发电机", watt: 15, cost: {}, duration: 0, tech: "风力发电", workers: 0, note: "升级项 3：15 瓦，无消耗、不用人" },
      { name: "太阳能发电机", watt: 25, cost: {}, duration: 0, tech: "太阳能发电", workers: 0, note: "升级项 4：25 瓦，无消耗、不用人" },
      { name: "核电站", watt: 120, cost: { "核燃料": 1 }, duration: 10, tech: "核能", workers: 0, note: "升级项 5：120 瓦，消耗 1 核燃料 / 10 秒，不用人" }
    ],
    upgrades: [
      { name: "蒸汽发电机", watt: 0, bonusPct: 0, cost: { "钢铁": 100, "木材": 50 }, note: "换燃料：4 木材 / 3 秒 → 25 瓦" },
      { name: "电池", watt: 0, bonusPct: 0, cost: { "钢铁": 300, "化学燃料": 150 }, note: "电量上限 +50%" },
      { name: "风力发电机", watt: 0, bonusPct: 0, cost: { "钢铁": 800, "机械零件": 400 }, note: "15 瓦，无消耗、不用人" },
      { name: "太阳能发电机", watt: 0, bonusPct: 0, cost: { "钛合金": 2000, "精密零件": 500 }, note: "25 瓦，无消耗、不用人" },
      { name: "核电站", watt: 0, bonusPct: 0, cost: { "钢铁": 5000, "机械零件": 1000 }, note: "120 瓦，消耗 1 核燃料 / 10 秒" }
    ],
    special: "power",
    note: "3 秒 / 2 木材 → 10 瓦。5 档升级项不是产量百分比，而是产电方式的替代：1~2 档仍要人，3~5 档「无消耗、不用人」—— 设计意图是早期用人力换电、后期用电把自己的角色从电力岗位换下来。v0.0.30 峰值：10 个耗电工作 10.05 瓦 + 27 个电力升级项 27 瓦 + 冷库 1 瓦 ≈ 38.05 瓦（不含 #防御 工事 18 瓦）。"
  },
  {
    id: "oil_extraction",
    name: "石油开采",
    era: "industrial",
    order: 22,
    alwaysVisible: false,
    tech: "蒸汽机",
    category: "collect",
    duration: 6,
    inputs: {},
    outputs: { "石油": 2 },
    powerUse: 0.4,
    upgrades: [
      { name: "井架", watt: 0, bonusPct: 0, cost: { "钢铁": 100, "木材": 50 } },
      { name: "抽油机", watt: 0, bonusPct: 50, cost: { "钢铁": 300, "石材": 150 }, note: "" },
      { name: "大型油井", watt: 0, bonusPct: 75, cost: { "钢铁": 800, "石材": 400 }, note: "" },
      { name: "自动化钻井", watt: 1, bonusPct: 75, cost: { "钢铁": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "v0.0.30 新增：石油从采矿的 12 种矿里拆出来，成为独立的工业工作。由 *蒸汽机（工业 800）解锁；先买「井架」才出现石油项目。6 秒产 2 石油，运转时耗电 0.4 瓦。喂给 #化学精炼（3 石油 → 1 化学燃料 / 塑料）与 #火药制作（经化学燃料 + 硝酸）。"
  },
  {
    id: "machining",
    name: "机械加工",
    era: "industrial",
    order: 21,
    alwaysVisible: false,
    tech: "精密机床",
    category: "process",
    duration: 5,
    inputs: { "钢铁": 2, "铜锭": 1 },
    outputs: { "机械零件": 1 },
    powerUse: 0.4,
    equipmentMixed: true,
    recipes: [
      { name: "机械零件", inputs: { "钢铁": 2, "铜锭": 1 }, outputs: { "机械零件": 1 }, era: "industrial", unlockTech: "精密机床", duration: 5 },
      { name: "电子元件", inputs: { "钢铁": 2, "铜锭": 1 }, outputs: { "电子元件": 1 }, era: "industrial", unlockTech: "精密机床", duration: 5 },
      { name: "水泥", inputs: { "石灰石": 1, "石材": 1 }, outputs: { "水泥": 1 }, era: "industrial", unlockTech: "混凝土", duration: 5 },
      { name: "混凝土", inputs: { "水泥": 1, "石材": 1 }, outputs: { "混凝土": 1 }, era: "industrial", unlockTech: "混凝土", duration: 5 },
      { name: "核燃料", inputs: { "铀矿": 1 }, outputs: { "核燃料": 1 }, era: "info", unlockTech: "核能", duration: 5 }
    ],
    upgrades: [
      { name: "车床", watt: 0, bonusPct: 0, cost: { "钢铁": 100, "铜锭": 50 } },
      { name: "机械车间", watt: 0, bonusPct: 50, cost: { "钢铁": 300, "铜锭": 150 }, note: "" },
      { name: "大型车间", watt: 0, bonusPct: 75, cost: { "钢铁": 800, "石材": 400 }, note: "" },
      { name: "自动化产线", watt: 1, bonusPct: 75, cost: { "钢铁": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "5 秒，同一份工作、同一个进度条：1 机械零件 / 1 电子元件（2 钢铁 + 1 铜锭，*精密机床）｜1 水泥（1 石灰石 + 1 石材）｜1 混凝土（1 水泥 + 1 石材）（*混凝土 工业 200）｜1 核燃料（1 铀矿，*核能 信息 1,200）。v0.0.30 起工业 / 信息 / 太空时代的全部装备与武器制造也移到这里（配方由物品造价自动生成）。先买「车床」才出现项目。运转时耗电 0.4 瓦。"
  },
  {
    id: "chemistry",
    name: "化学精炼",
    era: "industrial",
    order: 23,
    alwaysVisible: false,
    tech: "火药",
    category: "process",
    duration: 6,
    inputs: { "石油": 3 },
    outputs: { "化学燃料": 1 },
    powerUse: 0.5,
    recipes: [
      { name: "化学燃料", inputs: { "石油": 3 }, outputs: { "化学燃料": 1 }, era: "industrial", unlockTech: "火药", duration: 6 },
      { name: "塑料", inputs: { "石油": 3 }, outputs: { "塑料": 1 }, era: "industrial", unlockTech: "火药", duration: 6 }
    ],
    upgrades: [
      { name: "蒸馏器", watt: 0, bonusPct: 0, cost: { "钢铁": 100, "石油": 50 }, note: "" },
      { name: "精炼塔", watt: 0, bonusPct: 50, cost: { "钢铁": 300, "石油": 150 }, note: "" },
      { name: "催化裂化", watt: 0, bonusPct: 75, cost: { "钢铁": 800, "石材": 400 }, note: "" },
      { name: "自动化精炼线", watt: 1, bonusPct: 75, cost: { "钢铁": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "6 秒 / 3 石油 → 1 化学燃料 或 1 塑料（二选一，投料成本 6 → 售价 9，+50%）。石油由 #石油开采（工业 *蒸汽机）产出，不再从采矿随机掉落。运转时耗电 0.5 瓦。"
  },
  {
    id: "glassmaking",
    name: "玻璃制造",
    era: "industrial",
    order: 24,
    alwaysVisible: false,
    tech: "温室",
    category: "process",
    duration: 5,
    inputs: { "沙": 3 },
    outputs: { "玻璃": 1 },
    powerUse: 0.4,
    recipes: [
      { name: "玻璃", inputs: { "沙": 3 }, outputs: { "玻璃": 1 }, era: "industrial", unlockTech: null, duration: 5 },
      { name: "光纤", inputs: { "玻璃": 2 }, outputs: { "光纤": 1 }, era: "industrial", unlockTech: null, duration: 4 }
    ],
    upgrades: [
      { name: "坩埚", watt: 0, bonusPct: 0, cost: { "钢铁": 100, "沙": 50 }, note: "" },
      { name: "玻璃坊", watt: 0, bonusPct: 50, cost: { "钢铁": 300, "沙": 150 }, note: "" },
      { name: "工业熔炉", watt: 0, bonusPct: 75, cost: { "钢铁": 800, "石材": 400 }, note: "" },
      { name: "自动玻璃线", watt: 1, bonusPct: 75, cost: { "钢铁": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "5 秒 / 3 沙 → 1 玻璃；4 秒 / 2 玻璃 → 1 光纤（供 精密装配）。由 *温室（作物栽培 → 200）解锁。运转时耗电 0.4 瓦。"
  },
  {
    id: "gunpowder",
    name: "火药制作",
    era: "industrial",
    order: 25,
    alwaysVisible: false,
    tech: "火药",
    category: "process",
    duration: 6,
    inputs: { "化学燃料": 1, "硝酸": 1 },
    outputs: { "火药": 1 },
    powerUse: 0,
    upgrades: [
      { name: "混合机", watt: 0, bonusPct: 0, cost: { "钢铁": 100, "硝酸": 50 }, note: "" },
      { name: "火药坊", watt: 0, bonusPct: 50, cost: { "钢铁": 300, "硝酸": 150 }, note: "" },
      { name: "大型火药坊", watt: 0, bonusPct: 75, cost: { "钢铁": 800, "石材": 400 }, note: "" },
      { name: "自动化火药线", watt: 1, bonusPct: 75, cost: { "钢铁": 2000, "机械零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "6 秒 / 1 化学燃料 + 1 硝酸 → 1 火药。火药唯一的持续消耗方 = 采矿「爆破」后的深层矿（每次开采 1 个）；没有它，硝酸 / 火药 整条链只是一次性门票。工作本身不耗电，只有第 4 档 ⚡ +1 瓦。"
  },

  /* ------------------------------------------------------------------ *
   * 四、信息时代（2 份）
   * ------------------------------------------------------------------ */
  {
    id: "semiconductors",
    name: "半导体制造",
    era: "info",
    order: 26,
    alwaysVisible: false,
    tech: "半导体",
    category: "process",
    duration: 8,
    inputs: { "硅片": 2, "稀土": 1, "机械零件": 1 },
    outputs: { "芯片": 1 },
    powerUse: 0.625,
    recipes: [
      { name: "硅片", inputs: { "沙": 2 }, outputs: { "硅片": 1 }, era: "info", unlockTech: null, duration: 4 },
      { name: "芯片", inputs: { "硅片": 2, "稀土": 1, "机械零件": 1 }, outputs: { "芯片": 1 }, era: "info", unlockTech: null, duration: 8 }
    ],
    upgrades: [
      { name: "光刻机", watt: 0, bonusPct: 0, cost: { "钛合金": 100, "稀土": 50 }, note: "" },
      { name: "无尘车间", watt: 0, bonusPct: 100, cost: { "钛合金": 300, "精密零件": 150 }, note: "" },
      { name: "全自动晶圆厂", watt: 1, bonusPct: 150, cost: { "钛合金": 2000, "精密零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "4 秒 / 2 沙 → 1 硅片；8 秒 / 2 硅片 + 1 稀土 + 1 机械零件 → 1 芯片（+3.8%）。只有 3 档升级项（表内写 3 档）。运转时耗电 0.625 瓦。"
  },
  {
    id: "precision_assembly",
    name: "精密装配",
    era: "info",
    order: 27,
    alwaysVisible: false,
    tech: "精密装配",
    category: "process",
    duration: 10,
    inputs: { "芯片": 1, "钛合金": 2, "光纤": 1, "电子元件": 1 },
    outputs: { "精密零件": 1 },
    powerUse: 0.8,
    upgrades: [
      { name: "机械臂", watt: 0, bonusPct: 0, cost: { "钛合金": 100, "芯片": 50 }, note: "" },
      { name: "全自动产线", watt: 1, bonusPct: 100, cost: { "钛合金": 2000, "精密零件": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "10 秒 / 1 芯片 + 2 钛合金 + 1 光纤 + 1 电子元件 → 1 精密零件。故意吃上一代中间品（机械零件 / 电子元件），给工业时代的中间品一个无限消耗方。只有 2 档升级项。运转时耗电 0.8 瓦。"
  },

  /* ------------------------------------------------------------------ *
   * 五、太空时代（4 份）
   * ------------------------------------------------------------------ */
  {
    id: "alien_mining",
    name: "外星采矿",
    era: "space",
    order: 28,
    alwaysVisible: false,
    tech: "星际航行基础",
    category: "collect",
    duration: 12,
    inputs: {},
    outputs: { "外星合金": 1, "硅片": 1 },
    powerUse: 1.25,
    upgrades: [
      { name: "等离子钻", watt: 0, bonusPct: 0, cost: { "钛合金": 100, "芯片": 50 }, note: "" },
      { name: "自动采矿站", watt: 1, bonusPct: 100, cost: { "外星合金": 2000, "反物质": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "12 秒，一次固定出 2 种：1 外星合金 + 1 硅片（不是随机池）。只有 2 档升级项。运转时耗电 1.25 瓦。"
  },
  {
    id: "particle_collider",
    name: "粒子对撞",
    era: "space",
    order: 29,
    alwaysVisible: false,
    tech: "反物质",
    category: "process",
    duration: 20,
    inputs: {},
    outputs: { "反物质": 1 },
    powerUse: 2,
    upgrades: [
      { name: "环形加速器", watt: 0, bonusPct: 0, cost: { "外星合金": 100, "芯片": 50 }, note: "" },
      { name: "超级对撞机", watt: 1, bonusPct: 100, cost: { "外星合金": 2000, "反物质": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "20 秒 / 1 反物质（无输入）。由 *反物质（星际航行基础 → 4,000）解锁。只有 2 档升级项。运转时耗电 2 瓦。"
  },
  {
    id: "synthesis",
    name: "合成制造",
    era: "space",
    order: 30,
    alwaysVisible: false,
    tech: "反物质",
    category: "process",
    duration: 15,
    inputs: { "外星合金": 5, "反物质": 2, "精密零件": 2 },
    outputs: { "超织物": 1 },
    powerUse: 1.67,
    recipes: [
      { name: "超织物", inputs: { "外星合金": 5, "反物质": 2, "精密零件": 2 }, outputs: { "超织物": 1 }, era: "space", unlockTech: "反物质", duration: 15 },
      { name: "AI 核心", inputs: { "外星合金": 5, "反物质": 2, "精密零件": 2 }, outputs: { "AI 核心": 1 }, era: "space", unlockTech: "反物质", duration: 15 },
      { name: "生命维持单元", inputs: { "外星合金": 5, "反物质": 2, "精密零件": 2 }, outputs: { "生命维持单元": 1 }, era: "space", unlockTech: "反物质", duration: 15 }
    ],
    upgrades: [
      { name: "纳米装配", watt: 0, bonusPct: 0, cost: { "外星合金": 100, "反物质": 50 }, note: "" },
      { name: "分子组装", watt: 1, bonusPct: 100, cost: { "外星合金": 2000, "反物质": 500 }, note: "耗电 +1 瓦" }
    ],
    special: null,
    note: "15 秒，同一份投料（5 外星合金 + 2 反物质 + 2 精密零件），三个产出三选一：超织物（太空衣物，唯一带伤害减免的内衬）/ AI 核心（动力装甲、自动化升级项）/ 生命维持单元（殖民舱，角色上限大幅提高）。三者同价 751.5 金。只有 2 档升级项。运转时耗电 1.67 瓦。"
  },
  {
    id: "warp_core",
    name: "曲速核心制造",
    era: "space",
    order: 31,
    alwaysVisible: false,
    tech: "曲速引擎",
    category: "process",
    duration: 30,
    inputs: { "AI 核心": 1, "反物质": 1 },
    outputs: { "曲速核心": 1 },
    powerUse: 2,
    upgrades: [
      { name: "曲速线圈", watt: 0, bonusPct: 0, cost: { "外星合金": 500, "反物质": 200 }, note: "用时 −50%" }
    ],
    special: null,
    note: "30 秒 / 1 AI 核心 + 1 反物质 → 1 曲速核心（终局目标，776.5 金）。由 *曲速引擎（反物质 → 8,000）解锁。只有 1 档升级项，效果是周期 −50%。运转时耗电 2 瓦。"
  },

  /* ------------------------------------------------------------------ *
   * 六、恩赐工作（2 份，不吃科技、不占时代）
   * ------------------------------------------------------------------ */
  {
    id: "black_soul",
    name: "黑暗之魂",
    era: "gift",
    order: 32,
    hidden: true,             // v0.0.13：整条线隐藏（星见由岐退役后不可达；模拟纪元不受影响）
    alwaysVisible: false,
    tech: null,
    category: "gift",
    duration: 0,
    inputs: {},
    outputs: {},
    powerUse: 0,
    staffOnly: "星见由岐",
    unlockBy: { hero: "星见由岐", gift: "黑暗之魂", affection: 50 },
    monsters: [
      { name: "不死院恶魔", skillLevel: 1, hp: 220, drops: { "灵魂": [3, 5], "余火": { chance: 0.25, qty: 1 } }, note: "≈ 中世纪中期怪" },
      { name: "灰烬审判者", skillLevel: 25, hp: 560, drops: { "灵魂": [5, 8], "余火": { chance: 1, qty: 1 } }, note: "≈ 工业中期怪" },
      { name: "深渊监视者", skillLevel: 50, hp: 1150, drops: { "灵魂": [8, 12], "余火": { chance: 1, qty: [1, 2] } }, note: "≈ 信息时代怪" },
      { name: "无名王者", skillLevel: 75, hp: 2050, drops: { "灵魂": [13, 18], "余火": { chance: 1, qty: [2, 4] } }, note: "≈ 太空终局怪" }
    ],
    upgrades: [],
    special: "blackSoul",
    note: "恩赐工作 #32：由社交恩赐解锁（星见由岐 好感 50 解锁 [黑暗之魂]），不吃科技、不占时代，只有星见由岐能入驻（staffOnly）。独立技能等级 1~100（按秒给经验，每 10 级 +1% 速度，与工作精通同规则，各自一份）。周期同狩猎 —— 怪物 HP ÷ 角色 DPS × 命中率，离线用期望值；duration = 0 不是「瞬时」。怪物 4 档按技能等级 1 / 25 / 50 / 75 开门（门槛是技能等级，不是时代），玩家选打哪一档。消耗：无。掉落 灵魂 / 余火 —— 灵魂 / 余火只有这条路径能拿到，是黑魂装备套 4 件（3 装备 + 1 武器）的唯一来源；余火只是造价材料、不做强化。怪越硬单位时间灵魂越多，但需求装备也越高；打输不死亡、只重伤。升级项：无（恩赐工作暂定不给升级项）。"
  },
  {
    id: "era_sim",
    name: "模拟纪元",
    era: "gift",
    order: 33,
    alwaysVisible: false,
    tech: null,
    category: "gift",
    duration: 0,
    inputs: {},
    outputs: {},
    powerUse: 0,
    staffOnly: "大少",
    unlockBy: { hero: "大少", gift: "模拟纪元", affection: 50 },
    monsters: [
      { name: "游荡僵尸", skillLevel: 1, hp: 180, drops: [2, 4], note: "掉落次数 2~4；≈ 中世纪前期怪" },
      { name: "尸群", skillLevel: 25, hp: 460, drops: [4, 7], note: "掉落次数 4~7；≈ 工业前期怪" },
      { name: "变异体", skillLevel: 50, hp: 980, drops: [7, 12], note: "掉落次数 7~12；≈ 信息时代怪" },
      { name: "尸潮首领", skillLevel: 75, hp: 1800, drops: [12, 20], note: "掉落次数 12~20；≈ 太空期怪" }
    ],
    upgrades: [],
    special: "eraSim",
    note: "恩赐工作 #33：由社交恩赐解锁（大少 好感 50 解锁 [模拟纪元]），不吃科技、不占时代，只有大少能入驻（staffOnly）。独立技能等级 1~100（按秒给经验，每 10 级 +1% 速度）。周期同狩猎（怪物 HP ÷ 角色 DPS × 命中率），duration = 0 不是「瞬时」。怪物 4 档按技能等级 1 / 25 / 50 / 75 开门。消耗：无。产出：随机资源 —— 每次掉落从「已解锁材料池」抽 1 种，权重 = 1 ÷ 该材料单价（越便宜越容易抽到 → 每次期望金币价值恒定，是补缺口的万能农场、不是印钞机；不抽还没解锁时代的东西，也不新增物品）。升级项：无。"
  }
];

/*
 * 池 / 分类键说明（items.js 的 212 个物品里没有下列 5 个「物品」，它们是池或泛称）：
 *   素食食材 = 浆果 / 块根 / 野菌 / 坚果（items.js cat:"food"）
 *   肉食食材 = 肉类食材（items.js id:"meat"）
 *   种子     = 谷物种子 / 豆类种子 / 蔬菜种子 / 甜菜种子 / 药草种子（cat:"seed"）
 *   石器装备 / 金属装备 / 衣物 = 装备泛称：85 件由 engine.equipmentRecipes 从物品造价生成
 *     （v0.0.30 分工：加工 17 / 锻造 16 / 裁缝 5 / 机械加工 47）
 *   科研点 / 电力 = 特殊产出，不是仓库物品（科研点记进科研系统，电力记进电网）
 */

