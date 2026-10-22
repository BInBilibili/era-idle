/* ============================================================================
 * techs.js — 科技树数据（纯浏览器全局脚本，无模块）
 * 来源：科技树.md §二 ~ §六，逐格转录。
 *
 * 计数与校验：
 *   石器时代 9 个 =   420 科研点
 *   中世纪   8 个 = 1,260 科研点
 *   工业    10 个 = 3,800 科研点
 *   信息     9 个 = 10,800 科研点
 *   太空     6 个 = 28,000 科研点
 *   ------------------------------------
 *   合计    42 个 = 44,280 科研点
 *
 * 字段：
 *   id        ascii snake_case 唯一标识
 *   name      科技中文名（与文档完全一致，requires 也用它做引用）
 *   era       stone | medieval | industrial | info | space
 *   cost      科研点费用
 *   requires  前置科技的中文名数组（文档「前置」栏原样；「—」为空数组）
 *   unlocks   解锁内容的中文字符串数组（工作 / 配方 / 升级项 / 建筑 / 被动）
 *   desc      一句话说明
 *   note      补充备注（时代门槛、支线归属、前置数量等）
 *
 * 时代门槛链（科技树.md:43）：
 *   火 → 金属冶炼 → 蒸汽机 → 半导体 → 太空计划
 * 开局无前置的三个：火 / 语言 / 石器工艺（科技树.md:43、:53-55）
 * ==========================================================================*/

window.TECHS = [

  /* ======================= 石器时代 9 个 · 420 点 ======================= */

  {
    id: "fire",
    name: "火",
    era: "stone",
    cost: 20,
    requires: [],
    unlocks: ["烹饪工作"],
    desc: "钻木取火，第一次把生食变成熟食。",
    note: "生活支线起点；开局三个无前置科技之一。"
  },
  {
    id: "language",
    name: "语言",
    era: "stone",
    cost: 20,
    requires: [],
    unlocks: ["角色上限 +2"],
    desc: "共同的语言让更多人愿意加入营地。",
    note: "生活支线；无前置，直接提升角色上限，也是文字（中世纪）的唯一前置。"
  },
  {
    id: "stonecraft",
    name: "石器工艺",
    era: "stone",
    cost: 20,
    requires: [],
    unlocks: ["加工工作"],
    desc: "打制石器，让加工有了第一套工具。",
    note: "生产支线起点；无前置，派生弓 / 作物栽培 / 岩石切割三条线。"
  },
  {
    id: "pottery",
    name: "陶器",
    era: "stone",
    cost: 40,
    requires: ["火"],
    unlocks: ["粮仓容量 ×1.5", "制陶工作", "沙矿"],
    desc: "烧制陶器，粮食终于能存过冬天。",
    note: "生活支线；一次给三样东西：粮仓容量、制陶工作、沙矿。"
  },
  {
    id: "cellar",
    name: "地窖",
    era: "stone",
    cost: 80,
    requires: ["陶器"],
    unlocks: ["[地窖]升级项（粮仓容量 ×2、半衰期 ×2）"],
    desc: "地下恒温的地窖让存粮放得更久。",
    note: "生活支线末端（80 点）；只给升级项，不给新工作。"
  },
  {
    id: "bow",
    name: "弓",
    era: "stone",
    cost: 40,
    requires: ["石器工艺"],
    unlocks: ["狩猎工作"],
    desc: "弓箭让狩猎从围堵变成远程。",
    note: "军事支线起点；也是畜牧业（80 点）的唯一前置。"
  },
  {
    id: "crop_farming",
    name: "作物栽培",
    era: "stone",
    cost: 40,
    requires: ["石器工艺"],
    unlocks: ["种植工作"],
    desc: "把采集来的种子种下去，食物开始可控。",
    note: "生产支线；种植工作是采集之外的稳定食物来源，温室（工业）挂在它下面。"
  },
  {
    id: "animal_husbandry",
    name: "畜牧业",
    era: "stone",
    cost: 80,
    requires: ["弓"],
    unlocks: ["畜牧工作"],
    desc: "圈养猎物，活的食物比死的更耐放。",
    note: "生产支线末端（80 点）；前置走军事线的弓，缝制（中世纪）也由它承接。"
  },
  {
    id: "stone_cutting",
    name: "岩石切割",
    era: "stone",
    cost: 80,
    requires: ["石器工艺"],
    unlocks: ["切石机工作", "金矿"],
    desc: "切石机把巨石切成建材，金矿随之暴露。",
    note: "生产支线末端（80 点）；金矿与混凝土、火药两条链的源头。"
  },

  /* ====================== 中世纪 8 个 · 1,260 点 ======================= */

  {
    id: "metal_smelting",
    name: "金属冶炼",
    era: "medieval",
    cost: 240,
    requires: ["火"],
    unlocks: ["熔炼工作", "铜锭"],
    desc: "从矿石里炼出第一炉铜，石器时代结束。",
    note: "进入中世纪的关键科技（240 点，需先有火）。"
  },
  {
    id: "steel",
    name: "钢铁",
    era: "medieval",
    cost: 120,
    requires: ["金属冶炼"],
    unlocks: ["钢铁材料", "[钢筋混凝土仓库]"],
    desc: "渗碳与淬火，让铁变成钢。",
    note: "蒸汽机（工业门槛）与[钢筋混凝土仓库]都挂在这里。"
  },
  {
    id: "forging",
    name: "锻造",
    era: "medieval",
    cost: 240,
    requires: ["钢铁"],
    unlocks: ["锻造工作（中世纪装备）"],
    desc: "炉火与铁砧，中世纪的第一套装备。",
    note: "军事支线末端（240 点）；中世纪装备的唯一来源。"
  },
  {
    id: "tailoring",
    name: "缝制",
    era: "medieval",
    cost: 120,
    requires: ["畜牧业"],
    unlocks: ["纺织工作", "裁缝工作", "编织工作"],
    desc: "把植物纤维和兽皮缝成布与衣。",
    note: "生活支线；一次点亮纺织 / 裁缝 / 编织三份工作。"
  },
  {
    id: "woodworking",
    name: "木工",
    era: "medieval",
    cost: 240,
    requires: ["缝制"],
    unlocks: ["木工工作"],
    desc: "锯与刨让木材变成木板。",
    note: "生活支线末端（240 点）；前置是缝制，不经过钢铁。"
  },
  {
    id: "writing",
    name: "文字",
    era: "medieval",
    cost: 60,
    requires: ["语言"],
    unlocks: ["造纸工作", "科研速度 +25%"],
    desc: "把经验写下来，科研第一次能积累。",
    note: "生活支线；科研 +25%；商店（#商店）也由它开张。"
  },
  {
    id: "medicine",
    name: "医疗",
    era: "medieval",
    cost: 120,
    requires: ["文字"],
    unlocks: ["药剂工作"],
    desc: "药剂与包扎，让人不再因小伤退场。",
    note: "生活支线；公共卫生（工业 200 点）与它是同一条链。"
  },
  {
    id: "sailing",
    name: "航海",
    era: "medieval",
    cost: 120,
    requires: ["文字"],
    unlocks: ["解锁第 3 个狩猎区域（极地）"],
    desc: "造船出海，抵达极地猎场。",
    note: "军事支线；只解锁狩猎区域，不给新工作。"
  },

  /* ===================== 工业时代 10 个 · 3,800 点 ====================== */

  {
    id: "steam_engine",
    name: "蒸汽机",
    era: "industrial",
    cost: 800,
    requires: ["钢铁"],
    unlocks: ["[伐木场]升级项", "[采矿场]升级项"],
    desc: "蒸汽驱动锯与钻，生产第一次脱离人力。",
    note: "进入工业时代的关键科技（800 点，需先有钢铁）。"
  },
  {
    id: "electricity",
    name: "电力",
    era: "industrial",
    cost: 200,
    requires: ["蒸汽机"],
    unlocks: ["电力工作", "电力资源"],
    desc: "电流让工作可以按瓦计费地加速。",
    note: "工业支线主干；电池 / 制冷 / 护盾技术 / 风力发电都从它分叉。"
  },
  {
    id: "battery",
    name: "电池",
    era: "industrial",
    cost: 400,
    requires: ["电力"],
    unlocks: ["电量上限升级项"],
    desc: "把电存起来，供给不再只看峰值。",
    note: "只给电量上限升级项，不是新工作。"
  },
  {
    id: "precision_machine_tools",
    name: "精密机床",
    era: "industrial",
    cost: 200,
    requires: ["蒸汽机"],
    unlocks: ["机械加工工作"],
    desc: "公差进入毫米级，机械可以互相复制。",
    note: "信息时代门槛（半导体）与火药（400 点）的共同前置。"
  },
  {
    id: "concrete",
    name: "混凝土",
    era: "industrial",
    cost: 200,
    requires: ["岩石切割"],
    unlocks: ["[钢筋混凝土仓库]升级项"],
    desc: "水泥加骨料，仓库第一次能砌起来。",
    note: "前置是石器的岩石切割，跨代依赖。"
  },
  {
    id: "gunpowder",
    name: "火药",
    era: "industrial",
    cost: 400,
    requires: ["精密机床"],
    unlocks: ["[爆破]升级项（解锁深层矿）", "化学精炼工作", "火药制作工作"],
    desc: "硝石与硫磺，把岩石和深矿一起炸开。",
    note: "生产支线；[爆破]升级项直接决定深层矿产出（每次开采另耗 1 火药）。"
  },
  {
    id: "refrigeration",
    name: "制冷",
    era: "industrial",
    cost: 400,
    requires: ["电力"],
    unlocks: ["[冷库]升级项（粮仓容量 ×2、半衰期 ×2）"],
    desc: "冰与压缩机，让食物几乎不再腐坏。",
    note: "生活支线；实为粮仓三档中的第三档[冷库]。"
  },
  {
    id: "public_health",
    name: "公共卫生",
    era: "industrial",
    cost: 200,
    requires: ["医疗"],
    unlocks: ["医疗 3~4 档升级项（医院 / 自动医疗床）"],
    desc: "医院与自动医疗床，把医疗从个人变成制度。",
    note: "生活支线；只给医疗工作的 3~4 档升级项。"
  },
  {
    id: "greenhouse",
    name: "温室",
    era: "industrial",
    cost: 200,
    requires: ["作物栽培"],
    unlocks: ["[温室]升级项（种植不受季节影响）", "玻璃制造工作"],
    desc: "玻璃房里的作物不再看季节脸色。",
    note: "生活支线；玻璃制造工作与[温室]升级项一起给。"
  },
  {
    id: "shield_tech",
    name: "护盾技术",
    era: "industrial",
    cost: 800,
    requires: ["电力"],
    unlocks: ["[简易护盾腰带]"],
    desc: "能量护盾第一次能穿在身上。",
    note: "军事支线；后续军用护盾 / 相位护盾都要求它。"
  },

  /* ===================== 信息时代 9 个 · 10,800 点 ===================== */

  {
    id: "semiconductor",
    name: "半导体",
    era: "info",
    cost: 2400,
    requires: ["精密机床"],
    unlocks: ["半导体制造工作", "芯片"],
    desc: "硅片上的电路，信息时代的起点。",
    note: "进入信息时代的关键科技（2,400 点，需先有精密机床）。"
  },
  {
    id: "precision_assembly",
    name: "精密装配",
    era: "info",
    cost: 600,
    requires: ["半导体"],
    unlocks: ["精密装配工作"],
    desc: "在无尘台上装出微米级的部件。",
    note: "生产支线；军用护盾的两条前置之一。"
  },
  {
    id: "networking",
    name: "网络",
    era: "info",
    cost: 600,
    requires: ["半导体"],
    unlocks: ["科研速度 +100%"],
    desc: "机器彼此说话，科研速度翻倍。",
    note: "生活支线；只给 +100% 科研，纯数值但量级最大（科技树.md:11 明示可接受）。"
  },
  {
    id: "wind_power",
    name: "风力发电",
    era: "info",
    cost: 600,
    requires: ["电力"],
    unlocks: ["风力发电机（无消耗产电）"],
    desc: "风车发电，不烧任何燃料。",
    note: "生产支线；无消耗产电的第一条路，前置跨回工业的电力。"
  },
  {
    id: "solar_power",
    name: "太阳能发电",
    era: "info",
    cost: 600,
    requires: ["半导体"],
    unlocks: ["太阳能发电机（无消耗产电）"],
    desc: "光伏板把日光直接变成电。",
    note: "核能（1,200 点）的唯一前置。"
  },
  {
    id: "nuclear_energy",
    name: "核能",
    era: "info",
    cost: 1200,
    requires: ["太阳能发电"],
    unlocks: ["铀矿（采矿新矿种）", "[核电站]升级项"],
    desc: "铀裂变，一座电站顶一个电网。",
    note: "同时解锁铀矿（采矿新矿种）与[核电站]升级项。"
  },
  {
    id: "military_shield",
    name: "军用护盾",
    era: "info",
    cost: 1200,
    requires: ["精密装配", "护盾技术"],
    unlocks: ["[军用护盾腰带]"],
    desc: "护盾能量化到能挡子弹。",
    note: "军事支线；双前置（精密装配 + 护盾技术），相位护盾由它承接。"
  },
  {
    id: "automation",
    name: "自动化",
    era: "info",
    cost: 1200,
    requires: ["网络"],
    unlocks: ["工作可无人运转（1 人当 2 人）"],
    desc: "工作可以无人运转，1 人当 2 人。",
    note: "生产支线；太空计划与人工智能的共同前置。"
  },
  {
    id: "space_program",
    name: "太空计划",
    era: "info",
    cost: 2400,
    requires: ["自动化"],
    unlocks: ["解锁太空时代"],
    desc: "把第一枚火箭送上去，太空时代开启。",
    note: "进入太空时代的关键科技（2,400 点）。"
  },

  /* ===================== 太空时代 6 个 · 28,000 点 ===================== */

  {
    id: "interstellar_travel_basics",
    name: "星际航行基础",
    era: "space",
    cost: 2000,
    requires: ["太空计划"],
    unlocks: ["外星采矿工作", "外星区域"],
    desc: "学会在真空里活着抵达另一颗星。",
    note: "太空支线的唯一入口；反物质与生命维持都由它承接。"
  },
  {
    id: "antimatter",
    name: "反物质",
    era: "space",
    cost: 4000,
    requires: ["星际航行基础"],
    unlocks: ["粒子对撞工作", "合成制造工作", "反物质能源", "[量子仓库]升级项"],
    desc: "把质量完整换成能量。",
    note: "太空支线主干；量子仓库与曲速引擎都挂在它下面。"
  },
  {
    id: "life_support",
    name: "生命维持",
    era: "space",
    cost: 4000,
    requires: ["星际航行基础"],
    unlocks: ["太空支线收尾"],
    desc: "太空时代的最后一块技术拼图，殖民舱靠它维持生命。",
    note: "角色上限只由住房决定：初始 5 人，住满 6 档 = 18 人，本科技不再额外加人数。"
  },
  {
    id: "artificial_intelligence",
    name: "人工智能",
    era: "space",
    cost: 2000,
    requires: ["自动化"],
    unlocks: ["AI 核心", "工作完全无人化"],
    desc: "AI 核心接管整条生产线。",
    note: "生产支线末端；工作完全无人化，代价是效率（科技树.md:159）。"
  },
  {
    id: "phase_shield",
    name: "相位护盾",
    era: "space",
    cost: 8000,
    requires: ["军用护盾", "反物质"],
    unlocks: ["[相位护盾腰带]"],
    desc: "相位护盾让攻击从身上穿过去。",
    note: "军事支线终点（8,000 点）；双前置，跨军事与生产两条线。"
  },
  {
    id: "warp_engine",
    name: "曲速引擎",
    era: "space",
    cost: 8000,
    requires: ["反物质"],
    unlocks: ["曲速核心制造工作"],
    desc: "折叠空间，离开这个星系。",
    note: "无支线的终点科技；只给曲速核心制造工作。"
  }

];

/* 5 个时代；techCount 与上面的实际条数一致（9 / 8 / 10 / 9 / 6 = 42） */
window.ERAS = [
  { id: "stone",      name: "石器时代", techCount: 9  },
  { id: "medieval",   name: "中世纪",   techCount: 8  },
  { id: "industrial", name: "工业时代", techCount: 10 },
  { id: "info",       name: "信息时代", techCount: 9  },
  { id: "space",      name: "太空时代", techCount: 6  }
];
