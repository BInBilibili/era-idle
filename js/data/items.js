/* js/data/items.js —— 物品数据
 * 权威来源：资源表.md（逐行转录，共 212 种：194 仓库 + 18 粮仓）
 *   window.ITEMS      id → 物品对象
 *   window.ITEM_ORDER 显示顺序：矿石 → 石器 → 中世纪 → 工业 → 信息 → 太空 → 跨阶段 → 技能书 → 抽卡/恩赐 → 粮仓最后
 *
 * 字段口径：
 *   price = 资源表「金币」列 = 卖出价（买入价 = 卖出价 × 3，仅文档明确给出时才写 buy）
 *   cost  = 「造价」列；装备表里的通用「皮革」按 §十「通用皮革 3 金/个」映射到同价 3 金的「中型皮革」(leather_medium)
 *   武器（主手）的战斗字段 interval / 攻击加成 / 射程 在另一个按键名索引的文件里，本文件只保证 name 与表内完全一致
 */
window.ITEMS = {

  /* ============================================================
   * §二 矿石（13 种）
   * ============================================================ */
  stone:        { name: '石头',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 1.5,  src: '采矿', use: '切石机、加工、制陶、建造' },
  copper_ore:   { name: '铜矿',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 3.75, src: '采矿', use: '熔炼 → 铜锭' },
  sand:         { name: '沙',     era: 'stone', cat: 'ore', storage: 'warehouse', price: 5,    src: '采矿', use: '制陶、玻璃制造、半导体制造' },
  limestone:    { name: '石灰石', era: 'stone', cat: 'ore', storage: 'warehouse', price: 6,    src: '采矿', use: '机械加工 → 水泥 → 混凝土' },
  iron_ore:     { name: '铁矿',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 7.5,  src: '采矿', use: '熔炼 → 铁锭 → 钢铁' },
  oil:          { name: '石油',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 2,    src: '采矿', use: '化学精炼' },
  nitric_acid:  { name: '硝酸',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 16,   src: '采矿', use: '火药制作' },
  bauxite:      { name: '铝土矿', era: 'stone', cat: 'ore', storage: 'warehouse', price: 6,    src: '采矿', use: '熔炼 → 铝合金' },
  rare_earth:   { name: '稀土',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 15,   src: '采矿', use: '半导体制造、电池升级项' },
  silver_ore:   { name: '银矿',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 18.75, src: '采矿', use: '熔炼 → 银锭、商店出售' },
  titanium_ore: { name: '钛矿',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 12,   src: '采矿', use: '熔炼 → 钛合金' },
  gold_ore:     { name: '金矿',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 37.5, src: '采矿', use: '熔炼 → 金锭、商店出售' },
  uranium_ore:  { name: '铀矿',   era: 'stone', cat: 'ore', storage: 'warehouse', price: 50,   src: '采矿', use: '机械加工 → 核燃料 → 核电站' },

  /* ============================================================
   * §三 石器时代 · 3.1 资源（14 仓库）
   * ============================================================ */
  wood:          { name: '木材',     era: 'stone', cat: 'material', storage: 'warehouse', price: 1,   src: '伐木', use: '木工、加工、建造、燃料、造纸' },
  stone_block:   { name: '石材',     era: 'stone', cat: 'material', storage: 'warehouse', price: 5,   src: '切石机', use: '建造、仓库升级' },
  plant_fiber:   { name: '植物纤维', era: 'stone', cat: 'material', storage: 'warehouse', price: 0.5, src: '采集', use: '加工（内衬衣物）、编织（地毯）、裁缝（弓）' },
  fodder:        { name: '草料',     era: 'stone', cat: 'material', storage: 'warehouse', price: 0.5, src: '种植', use: '畜牧饲料（人不能吃）' },
  herb:          { name: '药草',     era: 'stone', cat: 'material', storage: 'warehouse', price: 0.5, src: '采集', use: '医疗、药剂' },
  bone_horn:     { name: '骨 / 角',  era: 'stone', cat: 'animal',   storage: 'warehouse', price: 0.5, src: '狩猎', use: '加工（骨项链 + 骨器升级项）' },
  compost:       { name: '堆肥',     era: 'stone', cat: 'material', storage: 'warehouse', price: 0.1, src: '腐坏转化', use: '种植化肥（+50% 产出）' },
  pottery:       { name: '陶器',     era: 'stone', cat: 'material', storage: 'warehouse', price: 8.5, src: '制陶（沙）', use: '粮仓容量升级项' },
  leather_small: { name: '小型皮革', era: 'stone', cat: 'animal',   storage: 'warehouse', price: 2,   src: '狩猎 / 畜牧（兔子）', use: '低级衣物' },
  leather_medium:{ name: '中型皮革', era: 'stone', cat: 'animal',   storage: 'warehouse', price: 3,   src: '狩猎 / 畜牧（鹿、山羊、野猪、羚羊）', use: '中级护甲' },
  leather_heavy: { name: '厚重皮革', era: 'stone', cat: 'animal',   storage: 'warehouse', price: 5,   src: '狩猎 / 畜牧（驼鹿、野牛、巨蜥）', use: '高级护甲' },
  feather:       { name: '羽毛',     era: 'stone', cat: 'animal',   storage: 'warehouse', price: 0.3, src: '狩猎 / 畜牧（松鸡）', use: '枕头、装饰' },
  wolf_pelt:     { name: '狼皮',     era: 'stone', cat: 'animal',   storage: 'warehouse', price: 6,   src: '狩猎 / 畜牧（狼）', use: '高级衣物' },
  bear_pelt:     { name: '熊皮',     era: 'stone', cat: 'animal',   storage: 'warehouse', price: 10,  src: '狩猎 / 畜牧（熊）', use: '高级护甲' },

  /* ============================================================
   * §三 石器时代 · 3.2 装备与武器（15 件）
   * ============================================================ */
  leather_cap:     { name: '皮帽',     era: 'stone', cat: 'equip', storage: 'warehouse', price: 13.5, slot: 'head',      dr: 2, temp: 1, cost: { leather_medium: 3 } },
  linen_headscarf: { name: '亚麻头巾', era: 'stone', cat: 'equip', storage: 'warehouse', price: 2.2,  slot: 'headInner', temp: 3, cost: { plant_fiber: 3 } },
  leather_armor:   { name: '皮甲',     era: 'stone', cat: 'equip', storage: 'warehouse', price: 27,   slot: 'body',      dr: 5, str: 2, temp: 1, cost: { leather_medium: 6 } },
  linen_shirt:     { name: '亚麻衬衣', era: 'stone', cat: 'equip', storage: 'warehouse', price: 3,    slot: 'bodyInner', temp: 4, cost: { plant_fiber: 4 } },
  leather_pants:   { name: '皮裤',     era: 'stone', cat: 'equip', storage: 'warehouse', price: 18,   slot: 'legs',      dr: 3, temp: 1, cost: { leather_medium: 4 } },
  linen_underpants:{ name: '亚麻衬裤', era: 'stone', cat: 'equip', storage: 'warehouse', price: 2.2,  slot: 'legsInner', temp: 3, cost: { plant_fiber: 3 } },
  leather_boots:   { name: '皮靴',     era: 'stone', cat: 'equip', storage: 'warehouse', price: 13.5, slot: 'feet',      dr: 2, temp: 2, cost: { leather_medium: 3 } },
  wool_socks:      { name: '毛袜',     era: 'stone', cat: 'equip', storage: 'warehouse', price: 6,    slot: 'socks',     temp: 4, cost: { wool: 2 } },
  wood_shield:     { name: '木盾',     era: 'stone', cat: 'equip', storage: 'warehouse', price: 12,   slot: 'offhand',   dr: 6, cost: { wood: 8 } },
  bone_necklace:   { name: '骨项链',   era: 'stone', cat: 'equip', storage: 'warehouse', price: 1.5,  slot: 'neck',      str: 1, cost: { bone_horn: 2 } },
  leather_belt:    { name: '皮带',     era: 'stone', cat: 'equip', storage: 'warehouse', price: 13.5, slot: 'belt',      dr: 1, cost: { leather_medium: 3 } },

  stone_dagger: { name: '石匕首', era: 'stone', cat: 'weapon', storage: 'warehouse', price: 52.5, slot: 'mainhand',             str: 0,  cost: { wood: 20, stone: 10 } },
  stone_axe:    { name: '石斧',   era: 'stone', cat: 'weapon', storage: 'warehouse', price: 90,   slot: 'mainhand',             str: 18, cost: { wood: 30, stone: 20 } },
  stone_spear:  { name: '石矛',   era: 'stone', cat: 'weapon', storage: 'warehouse', price: 71.2, slot: 'mainhand',             str: 8,  cost: { wood: 25, stone: 15 } },
  short_bow:    { name: '短弓',   era: 'stone', cat: 'weapon', storage: 'warehouse', price: 75,   slot: 'mainhand', twoHanded: true, str: 8,  cost: { wood: 40, plant_fiber: 20 } },

  /* ============================================================
   * §四 中世纪 · 4.1 资源（12 种）
   * ============================================================ */
  plank:        { name: '木板',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 4,  src: '木工', use: '建造、家具升级项' },
  copper_ingot: { name: '铜锭',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 11, src: '熔炼', use: '锻造（铜武器）、机械加工（电子元件）' },
  iron_ingot:   { name: '铁锭',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 18, src: '熔炼', use: '锻造、木工（工具）、建造' },
  steel:        { name: '钢铁',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 27, src: '熔炼（*钢铁）', use: '锻造（中世纪 + 工业装备）、机械加工、建造' },
  silver_ingot: { name: '银锭',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 41, src: '熔炼', use: '裁缝（银项链）、医疗（医疗设备）、商店高价出售品' },
  gold_ingot:   { name: '金锭',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 78, src: '熔炼', use: '商店最高价出售品（金币的主要来源）' },
  hemp:         { name: '大麻',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 0.5, src: '种植（*缝制）', use: '纺织' },
  cotton:       { name: '棉花',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 0.5, src: '种植（*缝制）', use: '纺织' },
  cloth:        { name: '布料',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 3,  src: '纺织', use: '裁缝（衣物）、编织（地毯）' },
  wool:         { name: '毛料',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 2,  src: '畜牧 / 纺织', use: '裁缝（保暖衣物、袜子）' },
  paper:        { name: '纸张',   era: 'medieval', cat: 'material', storage: 'warehouse', price: 5,  src: '造纸', use: '科研（可选消耗品，+50% 科研点）' },
  croc_leather: { name: '鳄鱼皮', era: 'medieval', cat: 'animal',   storage: 'warehouse', price: 8,  src: '狩猎 / 畜牧（鳄鱼）', use: '裁缝（高级轻甲）' },

  /* ============================================================
   * §四 中世纪 · 4.2 装备与武器（23 件）
   * ============================================================ */
  iron_helm:       { name: '铁盔',     era: 'medieval', cat: 'equip', storage: 'warehouse', price: 135,   slot: 'head',      dr: 6, str: 1, cost: { iron_ingot: 5 } },
  steel_helm:      { name: '钢盔',     era: 'medieval', cat: 'equip', storage: 'warehouse', price: 202.5, slot: 'head',      dr: 9, str: 2, cost: { steel: 5 } },
  cloth_hat:       { name: '布帽',     era: 'medieval', cat: 'equip', storage: 'warehouse', price: 18,    slot: 'headInner', temp: 5, cost: { cloth: 4 } },
  iron_armor:      { name: '铁甲',     era: 'medieval', cat: 'equip', storage: 'warehouse', price: 270,   slot: 'body',      dr: 12, str: 4, cost: { iron_ingot: 10 } },
  steel_armor:     { name: '钢甲',     era: 'medieval', cat: 'equip', storage: 'warehouse', price: 486,   slot: 'body',      dr: 18, str: 7, cost: { steel: 12 } },
  cloth_shirt:     { name: '布衬衣',   era: 'medieval', cat: 'equip', storage: 'warehouse', price: 22.5,  slot: 'bodyInner', temp: 6, cost: { cloth: 5 } },
  iron_legs:       { name: '铁护腿',   era: 'medieval', cat: 'equip', storage: 'warehouse', price: 216,   slot: 'legs',      dr: 8, str: 2, cost: { iron_ingot: 8 } },
  cloth_pants:     { name: '布衬裤',   era: 'medieval', cat: 'equip', storage: 'warehouse', price: 18,    slot: 'legsInner', temp: 5, cost: { cloth: 4 } },
  iron_boots:      { name: '铁靴',     era: 'medieval', cat: 'equip', storage: 'warehouse', price: 162,   slot: 'feet',      dr: 5, str: 1, temp: 1, cost: { iron_ingot: 6 } },
  woolen_socks:    { name: '羊毛袜',   era: 'medieval', cat: 'equip', storage: 'warehouse', price: 9,     slot: 'socks',     temp: 6, cost: { wool: 3 } },
  iron_shield:     { name: '铁盾',     era: 'medieval', cat: 'equip', storage: 'warehouse', price: 270,   slot: 'offhand',   dr: 14, str: 2, cost: { iron_ingot: 10 } },
  silver_necklace: { name: '银项链',   era: 'medieval', cat: 'equip', storage: 'warehouse', price: 184.5, slot: 'neck',      str: 3, cost: { silver_ingot: 3 } },
  iron_belt:       { name: '铁扣腰带', era: 'medieval', cat: 'equip', storage: 'warehouse', price: 67.5,  slot: 'belt',      dr: 3, str: 1, cost: { iron_ingot: 2, leather_medium: 3 } },

  copper_dagger:    { name: '铜匕首', era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 330,  slot: 'mainhand',             str: 4,  cost: { copper_ingot: 20 } },
  iron_dagger:      { name: '铁匕首', era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 540,  slot: 'mainhand',             str: 8,  cost: { iron_ingot: 20 } },
  short_sword:      { name: '短剑',   era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 1080, slot: 'mainhand',             str: 12, cost: { iron_ingot: 40 } },
  copper_spear:     { name: '铜矛',   era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 525,  slot: 'mainhand',             str: 10, cost: { copper_ingot: 30, wood: 20 } },
  iron_spear:       { name: '铁矛',   era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 840,  slot: 'mainhand',             str: 16, cost: { iron_ingot: 30, wood: 20 } },
  battle_axe:       { name: '战斧',   era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 1620, slot: 'mainhand',             str: 30, cost: { iron_ingot: 60 } },
  two_handed_sword: { name: '双手剑', era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 3240, slot: 'mainhand', twoHanded: true, str: 38, cost: { steel: 80 } },
  great_hammer:     { name: '巨锤',   era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 4050, slot: 'mainhand', twoHanded: true, str: 48, cost: { steel: 100 } },
  long_bow:         { name: '长弓',   era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 255,  slot: 'mainhand', twoHanded: true, str: 26, cost: { wood: 50, leather_medium: 40 } },
  crossbow:         { name: '弩',     era: 'medieval', cat: 'weapon', storage: 'warehouse', price: 1440, slot: 'mainhand', twoHanded: true, str: 36, cost: { wood: 60, iron_ingot: 50 } },

  /* ============================================================
   * §五 工业时代 · 5.1 资源（8 种）
   * ============================================================ */
  cement:               { name: '水泥',     era: 'industrial', cat: 'material', storage: 'warehouse', price: 13,   src: '机械加工', use: '混凝土' },
  concrete:             { name: '混凝土',   era: 'industrial', cat: 'material', storage: 'warehouse', price: 21,   src: '机械加工', use: '建造、仓库升级' },
  glass:                { name: '玻璃',     era: 'industrial', cat: 'material', storage: 'warehouse', price: 17.5, src: '玻璃制造', use: '光纤、建造、医疗 3 档升级项' },
  machine_part:         { name: '机械零件', era: 'industrial', cat: 'material', storage: 'warehouse', price: 67.5, src: '机械加工', use: '工业装备、蒸汽锯、建造、半导体制造' },
  electronic_component: { name: '电子元件', era: 'industrial', cat: 'material', storage: 'warehouse', price: 76.5, src: '机械加工（钢铁 + 铜锭）', use: '装备、护盾腰带、精密装配' },
  chemical_fuel:        { name: '化学燃料', era: 'industrial', cat: 'material', storage: 'warehouse', price: 9,    src: '化学精炼', use: '塑料、火药、医药' },
  plastic:              { name: '塑料',     era: 'industrial', cat: 'material', storage: 'warehouse', price: 9,    src: '化学精炼', use: '电子元件、日用家具升级项' },
  gunpowder:            { name: '火药',     era: 'industrial', cat: 'material', storage: 'warehouse', price: 28,   src: '火药制作', use: '深层矿开采（每次 1 个）、爆破升级项' },

  /* ============================================================
   * §五 工业时代 · 5.2 装备与武器（17 件）
   * ============================================================ */
  steel_helmet:       { name: '钢铁头盔',     era: 'industrial', cat: 'equip', storage: 'warehouse', price: 324,    slot: 'head',      dr: 12, str: 3, cost: { steel: 8 } },
  cotton_hat:         { name: '棉帽',         era: 'industrial', cat: 'equip', storage: 'warehouse', price: 22.5,   slot: 'headInner', temp: 7, cost: { cloth: 5 } },
  bulletproof_vest:   { name: '防弹衣',       era: 'industrial', cat: 'equip', storage: 'warehouse', price: 1316.2, slot: 'body',      dr: 26, str: 8, cost: { steel: 20, machine_part: 5 } },
  cotton_shirt:       { name: '棉衬衣',       era: 'industrial', cat: 'equip', storage: 'warehouse', price: 27,     slot: 'bodyInner', temp: 8, cost: { cloth: 6 } },
  steel_legs:         { name: '钢护腿',       era: 'industrial', cat: 'equip', storage: 'warehouse', price: 486,    slot: 'legs',      dr: 16, str: 4, cost: { steel: 12 } },
  cotton_pants:       { name: '棉衬裤',       era: 'industrial', cat: 'equip', storage: 'warehouse', price: 22.5,   slot: 'legsInner', temp: 7, cost: { cloth: 5 } },
  military_boots:     { name: '军靴',         era: 'industrial', cat: 'equip', storage: 'warehouse', price: 342,    slot: 'feet',      dr: 10, str: 2, temp: 3, cost: { steel: 8, leather_medium: 4 } },
  cotton_socks:       { name: '棉袜',         era: 'industrial', cat: 'equip', storage: 'warehouse', price: 13.5,   slot: 'socks',     temp: 8, cost: { cloth: 3 } },
  steel_shield:       { name: '钢盾',         era: 'industrial', cat: 'equip', storage: 'warehouse', price: 607.5,  slot: 'offhand',   dr: 22, str: 4, cost: { steel: 15 } },
  electronic_amulet:  { name: '电子护符',     era: 'industrial', cat: 'equip', storage: 'warehouse', price: 229.5,  slot: 'neck',      dr: 2, str: 5, cost: { electronic_component: 2 } },
  shield_belt:        { name: '简易护盾腰带', era: 'industrial', cat: 'equip', storage: 'warehouse', price: 4320,   slot: 'belt',      shield: 100, cost: { steel: 50, electronic_component: 20 } },

  bayonet:           { name: '刺刀',   era: 'industrial', cat: 'weapon', storage: 'warehouse', price: 1620,   slot: 'mainhand',             str: 14, cost: { steel: 40 } },
  saber:             { name: '军刀',   era: 'industrial', cat: 'weapon', storage: 'warehouse', price: 2430,   slot: 'mainhand',             str: 26, cost: { steel: 60 } },
  entrenching_tool:  { name: '工兵铲', era: 'industrial', cat: 'weapon', storage: 'warehouse', price: 5265,   slot: 'mainhand',             str: 48, cost: { steel: 80, machine_part: 20 } },
  pistol:            { name: '手枪',   era: 'industrial', cat: 'weapon', storage: 'warehouse', price: 5467.5, slot: 'mainhand',             str: 30, cost: { steel: 60, machine_part: 30 } },
  shotgun:           { name: '霰弹枪', era: 'industrial', cat: 'weapon', storage: 'warehouse', price: 9112.5, slot: 'mainhand', twoHanded: true, str: 66, cost: { steel: 100, machine_part: 50 } },
  rifle:             { name: '步枪',   era: 'industrial', cat: 'weapon', storage: 'warehouse', price: 10935,  slot: 'mainhand', twoHanded: true, str: 52, cost: { steel: 120, machine_part: 60 } },

  /* ============================================================
   * §六 信息时代 · 6.1 资源（7 种）
   * ============================================================ */
  silicon_wafer:   { name: '硅片',     era: 'info', cat: 'material', storage: 'warehouse', price: 12,    src: '半导体制造（2 沙）', use: '半导体制造' },
  optical_fiber:   { name: '光纤',     era: 'info', cat: 'material', storage: 'warehouse', price: 37,    src: '玻璃制造（2 玻璃）', use: '精密装配' },
  precision_part:  { name: '精密零件', era: 'info', cat: 'material', storage: 'warehouse', price: 347,   src: '精密装配', use: '信息时代装备、太空时代装备、合成制造、仓库升级' },
  chip:            { name: '芯片',     era: 'info', cat: 'material', storage: 'warehouse', price: 110.5, src: '半导体制造', use: '精密装配、AI 核心、信息时代装备、电池升级项' },
  aluminum_alloy:  { name: '铝合金',   era: 'info', cat: 'material', storage: 'warehouse', price: 28,    src: '熔炼（铝土矿）', use: '战术头盔、复合护腿、防暴盾' },
  titanium_alloy:  { name: '钛合金',   era: 'info', cat: 'material', storage: 'warehouse', price: 59,    src: '熔炼（钛矿）', use: '信息时代装备、仓库升级' },
  nuclear_fuel:    { name: '核燃料',   era: 'info', cat: 'material', storage: 'warehouse', price: 52,    src: '机械加工', use: '核电站' },

  /* ============================================================
   * §六 信息时代 · 6.2 装备与武器（15 件）
   * ============================================================ */
  tactical_helmet:      { name: '战术头盔',   era: 'info', cat: 'equip', storage: 'warehouse', price: 1167,  slot: 'head',      dr: 18, str: 6, cost: { aluminum_alloy: 12, chip: 4 } },
  tactical_liner:       { name: '战术内衬',   era: 'info', cat: 'equip', storage: 'warehouse', price: 36,    slot: 'headInner', temp: 10, cost: { cloth: 8 } },
  composite_armor:      { name: '复合装甲',   era: 'info', cat: 'equip', storage: 'warehouse', price: 7860,  slot: 'body',      dr: 38, str: 14, cost: { titanium_alloy: 30, precision_part: 10 } },
  thermal_liner:        { name: '恒温内衬',   era: 'info', cat: 'equip', storage: 'warehouse', price: 274.5, slot: 'bodyInner', str: 2, temp: 12, cost: { cloth: 10, electronic_component: 2 } },
  composite_legs:       { name: '复合护腿',   era: 'info', cat: 'equip', storage: 'warehouse', price: 840,   slot: 'legs',      dr: 24, str: 8, cost: { aluminum_alloy: 20 } },
  tactical_liner_pants: { name: '战术内衬裤', era: 'info', cat: 'equip', storage: 'warehouse', price: 36,    slot: 'legsInner', temp: 10, cost: { cloth: 8 } },
  tactical_boots:       { name: '战术靴',     era: 'info', cat: 'equip', storage: 'warehouse', price: 1089,  slot: 'feet',      dr: 14, str: 4, temp: 5, cost: { titanium_alloy: 12, leather_medium: 6 } },
  thermal_socks:        { name: '恒温袜',     era: 'info', cat: 'equip', storage: 'warehouse', price: 132.8, slot: 'socks',     temp: 12, cost: { cloth: 4, electronic_component: 1 } },
  riot_shield:          { name: '防暴盾',     era: 'info', cat: 'equip', storage: 'warehouse', price: 840,   slot: 'offhand',   dr: 30, str: 6, cost: { aluminum_alloy: 20 } },
  military_amulet:      { name: '军用护符',   era: 'info', cat: 'equip', storage: 'warehouse', price: 497.2, slot: 'neck',      dr: 4, str: 9, cost: { chip: 3 } },
  military_shield_belt: { name: '军用护盾腰带', era: 'info', cat: 'equip', storage: 'warehouse', price: 20925, slot: 'belt',    shield: 250, cost: { titanium_alloy: 60, precision_part: 30 } },

  tactical_knife:    { name: '战术刀',     era: 'info', cat: 'weapon', storage: 'warehouse', price: 3540,  slot: 'mainhand',             str: 26, cost: { titanium_alloy: 40 } },
  carbon_fiber_knife:{ name: '碳纤维长刀', era: 'info', cat: 'weapon', storage: 'warehouse', price: 17490, slot: 'mainhand',             str: 58, cost: { titanium_alloy: 80, precision_part: 20 } },
  assault_rifle:     { name: '突击步枪',   era: 'info', cat: 'weapon', storage: 'warehouse', price: 45165, slot: 'mainhand', twoHanded: true, str: 62, cost: { titanium_alloy: 120, precision_part: 60, chip: 20 } },
  sniper_rifle:      { name: '狙击枪',     era: 'info', cat: 'weapon', storage: 'warehouse', price: 61545, slot: 'mainhand', twoHanded: true, str: 96, cost: { titanium_alloy: 150, precision_part: 80, chip: 40 } },

  /* ============================================================
   * §七 太空时代 · 7.1 资源（7 种）
   * ============================================================ */
  super_fabric:      { name: '超织物',       era: 'space', cat: 'material', storage: 'warehouse', price: 751.5, src: '合成制造', use: '太空时代衣物（唯一带伤害减免的内衬）' },
  alien_alloy:       { name: '外星合金',     era: 'space', cat: 'material', storage: 'warehouse', price: 6,     src: '外星采矿', use: '太空时代装备、建造' },
  antimatter:        { name: '反物质',       era: 'space', cat: 'material', storage: 'warehouse', price: 10,    src: '粒子对撞', use: '太空时代武器、装备、合成制造' },
  ai_core:           { name: 'AI 核心',      era: 'space', cat: 'material', storage: 'warehouse', price: 751.5, src: '合成制造', use: '动力装甲、自动化升级项' },
  life_support_unit: { name: '生命维持单元', era: 'space', cat: 'material', storage: 'warehouse', price: 751.5, src: '合成制造', use: '殖民舱（角色上限大幅提高）' },
  warp_core:         { name: '曲速核心',     era: 'space', cat: 'material', storage: 'warehouse', price: 776.5, src: '曲速核心制造', use: '终局目标' },
  alien_leather:     { name: '外星皮革',     era: 'space', cat: 'animal',   storage: 'warehouse', price: 40,    src: '狩猎 / 畜牧（外星掠食者）', use: '太空时代护甲' },

  /* ============================================================
   * §七 太空时代 · 7.2 装备与武器（15 件）
   * ============================================================ */
  power_helmet:       { name: '动力头盔',   era: 'space', cat: 'equip', storage: 'warehouse', price: 2782.5, slot: 'head',      dr: 26, str: 12, cost: { alien_alloy: 20, precision_part: 5 } },
  super_fabric_hood:  { name: '超织物头套', era: 'space', cat: 'equip', storage: 'warehouse', price: 6763.5, slot: 'headInner', dr: 2, str: 3, temp: 16, cost: { super_fabric: 6 } },
  power_armor:        { name: '动力装甲',   era: 'space', cat: 'equip', storage: 'warehouse', price: 16927.5, slot: 'body',     dr: 50, str: 25, cost: { alien_alloy: 50, ai_core: 10, precision_part: 10 } },
  super_fabric_liner: { name: '超织物内衬', era: 'space', cat: 'equip', storage: 'warehouse', price: 9018,   slot: 'bodyInner', dr: 6, str: 5, temp: 20, cost: { super_fabric: 8 } },
  power_legs:         { name: '动力护腿',   era: 'space', cat: 'equip', storage: 'warehouse', price: 4434,   slot: 'legs',      dr: 32, str: 14, cost: { alien_alloy: 30, precision_part: 8 } },
  super_fabric_legs:  { name: '超织物护腿', era: 'space', cat: 'equip', storage: 'warehouse', price: 6763.5, slot: 'legsInner', dr: 4, str: 3, temp: 16, cost: { super_fabric: 6 } },
  magnetic_boots:     { name: '磁力靴',     era: 'space', cat: 'equip', storage: 'warehouse', price: 2737.5, slot: 'feet',      dr: 18, str: 8, temp: 8, cost: { alien_alloy: 15, precision_part: 5 } },
  super_fabric_socks: { name: '超织物袜',   era: 'space', cat: 'equip', storage: 'warehouse', price: 5636.2, slot: 'socks',     dr: 2, str: 2, temp: 18, cost: { super_fabric: 5 } },
  energy_shield:      { name: '能量盾',     era: 'space', cat: 'equip', storage: 'warehouse', price: 4464,   slot: 'offhand',   dr: 40, str: 12, cost: { alien_alloy: 25, antimatter: 5, precision_part: 8 } },
  phase_amulet:       { name: '相位护符',   era: 'space', cat: 'equip', storage: 'warehouse', price: 102,    slot: 'neck',      dr: 8, str: 18, cost: { alien_alloy: 8, antimatter: 2 } },
  phase_shield_belt:  { name: '相位护盾腰带', era: 'space', cat: 'equip', storage: 'warehouse', price: 8827.5, slot: 'belt',    shield: 500, cost: { alien_alloy: 80, antimatter: 20, precision_part: 15 } },

  plasma_blade:   { name: '等离子刃', era: 'space', cat: 'weapon', storage: 'warehouse', price: 6045,   slot: 'mainhand',             str: 90,  cost: { alien_alloy: 60, antimatter: 20, precision_part: 10 } },
  gravity_hammer: { name: '重力锤',   era: 'space', cat: 'weapon', storage: 'warehouse', price: 9307.5, slot: 'mainhand', twoHanded: true, str: 140, cost: { alien_alloy: 100, antimatter: 40, precision_part: 15 } },
  rail_spear:     { name: '轨道矛',   era: 'space', cat: 'weapon', storage: 'warehouse', price: 7416,   slot: 'mainhand',             str: 100, cost: { alien_alloy: 80, antimatter: 30, precision_part: 12 } },
  particle_gun:   { name: '粒子枪',   era: 'space', cat: 'weapon', storage: 'warehouse', price: 12390,  slot: 'mainhand', twoHanded: true, str: 120, cost: { alien_alloy: 120, antimatter: 60, precision_part: 20 } },

  /* ============================================================
   * §八 跨阶段药物、熟食与消费品 —— 仓库 4 种（粮仓 3 种见文件末尾）
   * ============================================================ */
  herbal_potion:  { name: '草药药剂', era: 'cross', cat: 'material', storage: 'warehouse', price: 4,    src: '药剂', use: '医疗' },
  medicine:       { name: '医药',     era: 'cross', cat: 'material', storage: 'warehouse', price: 15.5, src: '药剂（+化学燃料）', use: '医疗' },
  shining_med:    { name: '闪耀医药', era: 'cross', cat: 'material', storage: 'warehouse', price: 54,   src: '药剂（+医药 +稀土 +化学燃料）', use: '医疗' },
  carpet:         { name: '地毯',     era: 'cross', cat: 'misc',     storage: 'warehouse', price: 6,    src: '编织', use: '舒适度' },

  /* ============================================================
   * §十一 精通技能书（31 本，商店专属，卖出 8000 / 买入 24000）
   * ============================================================ */
  book_woodcutting:         { name: '伐木精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '伐木',       src: '商店' },
  book_mining:              { name: '采矿精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '采矿',       src: '商店' },
  book_gathering:           { name: '采集精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '采集',       src: '商店' },
  book_farming:             { name: '种植精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '种植',       src: '商店' },
  book_hunting:             { name: '狩猎精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '狩猎',       src: '商店' },
  book_herding:             { name: '畜牧精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '畜牧',       src: '商店' },
  book_cooking:             { name: '烹饪精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '烹饪',       src: '商店' },
  book_crafting:            { name: '加工精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '加工',       src: '商店' },
  book_research:            { name: '科研精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '科研',       src: '商店' },
  book_stonecutting:        { name: '切石机精通书',     era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '切石机',     src: '商店' },
  book_pottery:             { name: '制陶精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '制陶',       src: '商店' },
  book_medicine:            { name: '医疗精通书',       era: 'stone',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '医疗',       src: '商店' },
  book_smelting:            { name: '熔炼精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '熔炼',       src: '商店' },
  book_forging:             { name: '锻造精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '锻造',       src: '商店' },
  book_carpentry:           { name: '木工精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '木工',       src: '商店' },
  book_textile:             { name: '纺织精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '纺织',       src: '商店' },
  book_tailoring:           { name: '裁缝精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '裁缝',       src: '商店' },
  book_alchemy:             { name: '药剂精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '药剂',       src: '商店' },
  book_weaving:             { name: '编织精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '编织',       src: '商店' },
  book_papermaking:         { name: '造纸精通书',       era: 'medieval',   cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '造纸',       src: '商店' },
  book_power:               { name: '电力精通书',       era: 'industrial', cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '电力',       src: '商店' },
  book_machining:           { name: '机械加工精通书',   era: 'industrial', cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '机械加工',   src: '商店' },
  book_chemical_refining:   { name: '化学精炼精通书',   era: 'industrial', cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '化学精炼',   src: '商店' },
  book_glassmaking:         { name: '玻璃制造精通书',   era: 'industrial', cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '玻璃制造',   src: '商店' },
  book_gunpowder_making:    { name: '火药制作精通书',   era: 'industrial', cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '火药制作',   src: '商店' },
  book_semiconductor:       { name: '半导体制造精通书', era: 'info',       cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '半导体制造', src: '商店' },
  book_precision_assembly:  { name: '精密装配精通书',   era: 'info',       cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '精密装配',   src: '商店' },
  book_alien_mining:        { name: '外星采矿精通书',   era: 'space',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '外星采矿',   src: '商店' },
  book_particle_collider:   { name: '粒子对撞精通书',   era: 'space',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '粒子对撞',   src: '商店' },
  book_synthesis:           { name: '合成制造精通书',   era: 'space',      cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '合成制造',   src: '商店' },
  book_warp_core_making:    { name: '曲速核心制造精通书', era: 'space',    cat: 'book', storage: 'warehouse', price: 8000, buy: 24000, book: '曲速核心制造', src: '商店' },

  /* ============================================================
   * §十二 抽卡与恩赐新增物品（13 种）
   * ============================================================ */
  hero_shard:  { name: '英雄碎片',       era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 667,  buy: 2000,  kind: 'shard',     src: '任意工作极低概率 / 商店第 6 格', note: '20 个 = 1 次抽卡' },
  sticky_note: { name: '好感度礼物·便利贴', era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 400,  buy: 1200,  kind: 'gift', gift: 2,  src: '抽卡 35.0%' },
  merch:       { name: '好感度礼物·周边',   era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 1200, buy: 3600,  kind: 'gift', gift: 6,  src: '抽卡 21.0%' },
  collector:   { name: '好感度礼物·典藏',   era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 3000, buy: 9000,  kind: 'gift', gift: 15, src: '抽卡 10.5%' },
  heirloom:    { name: '好感度礼物·传家宝', era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 6000, buy: 18000, kind: 'gift', gift: 30, src: '抽卡 3.5%' },
  stardust:    { name: '星尘',           era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 600,  kind: 'stardust',   src: '抽到重复角色（×10）/ 池集齐后的保底（×30）', note: '不能用金币买' },
  star_potion: { name: '升星药水',       era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 1800, kind: 'starPotion', src: '商店界面用 3 星尘买', note: '给角色升 1 星（★1~★5）' },
  soul:        { name: '灵魂',           era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 80,   kind: 'soul',       hidden: true, src: '#黑暗之魂 掉落', use: '黑魂装备套的唯一材料来源' },
  ember:       { name: '余火',           era: 'gacha', cat: 'gacha', storage: 'warehouse', price: 200,  kind: 'ember',      hidden: true, src: '#黑暗之魂 掉落', use: '黑魂装备套的造价材料（不强化）' },

  /* --- §12.1 黑魂装备套（4 件，1 档固定属性、不强化）—— v0.0.13 随黑暗之魂线隐藏 --- */
  undead_chainmail: { name: '不死院锁子甲', era: 'info', cat: 'equip',  storage: 'warehouse', price: 4710,   slot: 'body',     dr: 32, str: 14, hidden: true, cost: { soul: 20, ember: 5, steel: 20 } },
  ashen_legs:       { name: '灰烬护腿',     era: 'info', cat: 'equip',  storage: 'warehouse', price: 3607.5, slot: 'legs',     dr: 28, str: 9,  hidden: true, cost: { soul: 15, ember: 4, steel: 15 } },
  abyss_helmet:     { name: '深渊头盔',     era: 'info', cat: 'equip',  storage: 'warehouse', price: 2745,   slot: 'head',     dr: 22, str: 8,  hidden: true, cost: { soul: 12, ember: 3, steel: 10 } },
  abyss_greatsword: { name: '深渊大剑',     era: 'info', cat: 'weapon', storage: 'warehouse', price: 7215,   slot: 'mainhand', str: 72, atk: 30, interval: 2.2, armorPen: 25, hidden: true, cost: { soul: 30, ember: 8, steel: 30 }, note: '间隔 2.2 秒 / 破甲 25%' },

  /* ============================================================
   * 粮仓（18 种，会腐坏）—— §三 15 种食材 / 种子 + §八 3 种熟食
   * ============================================================ */
  berry:          { name: '浆果',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '采集', use: '食材' },
  tuber:          { name: '块根',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '采集', use: '食材' },
  wild_mushroom:  { name: '野菌',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '采集', use: '食材' },
  nut:            { name: '坚果',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '采集', use: '食材' },
  grain:          { name: '谷物',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '种植', use: '食材 / 药材' },
  bean:           { name: '豆类',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '种植', use: '食材 / 药材' },
  vegetable:      { name: '蔬菜',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '种植', use: '食材 / 药材' },
  beet:           { name: '甜菜',     era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '种植', use: '食材 / 药材' },
  herb_crop:      { name: '药草作物', era: 'stone', cat: 'food',   storage: 'granary', price: 0.1, src: '种植', use: '食材 / 药材' },
  grain_seed:     { name: '谷物种子', era: 'stone', cat: 'seed',   storage: 'granary', price: 0.5, src: '采集', use: '种植输入' },
  bean_seed:      { name: '豆类种子', era: 'stone', cat: 'seed',   storage: 'granary', price: 0.5, src: '采集', use: '种植输入' },
  vegetable_seed: { name: '蔬菜种子', era: 'stone', cat: 'seed',   storage: 'granary', price: 0.5, src: '采集', use: '种植输入' },
  beet_seed:      { name: '甜菜种子', era: 'stone', cat: 'seed',   storage: 'granary', price: 0.5, src: '采集', use: '种植输入' },
  herb_seed:      { name: '药草种子', era: 'stone', cat: 'seed',   storage: 'granary', price: 0.5, src: '采集', use: '种植输入' },
  meat:           { name: '肉类食材', era: 'stone', cat: 'food',   storage: 'granary', price: 0.2, src: '狩猎 / 畜牧', use: '食材' },
  vegetarian_meal:{ name: '素餐',     era: 'cross', cat: 'cooked', storage: 'granary', price: 1.2, src: '烹饪（素食食材）', use: '食物' },
  meat_meal:      { name: '肉餐',     era: 'cross', cat: 'cooked', storage: 'granary', price: 1.4, src: '烹饪（肉食食材）', use: '食物' },
  balanced_meal:  { name: '均衡餐',   era: 'cross', cat: 'cooked', storage: 'granary', price: 1.3, src: '烹饪（素 + 肉）', use: '食物' }
};

/* 每个物品对象自带 id 字段（与 ITEMS 的键一致），方便 Object.values(ITEMS) 直接取用 */
(function () {
  for (var id in window.ITEMS) {
    if (Object.prototype.hasOwnProperty.call(window.ITEMS, id)) window.ITEMS[id].id = id;
  }
})();

/* 显示顺序：矿石 → 石器 → 中世纪 → 工业 → 信息 → 太空 → 跨阶段 → 技能书 → 抽卡/恩赐 → 粮仓最后 */
window.ITEM_ORDER = [
  /* §二 矿石 */
  'stone', 'copper_ore', 'sand', 'limestone', 'iron_ore', 'oil', 'nitric_acid', 'bauxite', 'rare_earth', 'silver_ore', 'titanium_ore', 'gold_ore', 'uranium_ore',

  /* §三 石器 · 资源（仓库） */
  'wood', 'stone_block', 'plant_fiber', 'fodder', 'herb', 'bone_horn', 'compost', 'pottery', 'leather_small', 'leather_medium', 'leather_heavy', 'feather', 'wolf_pelt', 'bear_pelt',

  /* §三 石器 · 装备与武器 */
  'leather_cap', 'linen_headscarf', 'leather_armor', 'linen_shirt', 'leather_pants', 'linen_underpants', 'leather_boots', 'wool_socks', 'wood_shield', 'bone_necklace', 'leather_belt',
  'stone_dagger', 'stone_axe', 'stone_spear', 'short_bow',

  /* §四 中世纪 · 资源 */
  'plank', 'copper_ingot', 'iron_ingot', 'steel', 'silver_ingot', 'gold_ingot', 'hemp', 'cotton', 'cloth', 'wool', 'paper', 'croc_leather',

  /* §四 中世纪 · 装备与武器 */
  'iron_helm', 'steel_helm', 'cloth_hat', 'iron_armor', 'steel_armor', 'cloth_shirt', 'iron_legs', 'cloth_pants', 'iron_boots', 'woolen_socks', 'iron_shield', 'silver_necklace', 'iron_belt',
  'copper_dagger', 'iron_dagger', 'short_sword', 'copper_spear', 'iron_spear', 'battle_axe', 'two_handed_sword', 'great_hammer', 'long_bow', 'crossbow',

  /* §五 工业 · 资源 */
  'cement', 'concrete', 'glass', 'machine_part', 'electronic_component', 'chemical_fuel', 'plastic', 'gunpowder',

  /* §五 工业 · 装备与武器 */
  'steel_helmet', 'cotton_hat', 'bulletproof_vest', 'cotton_shirt', 'steel_legs', 'cotton_pants', 'military_boots', 'cotton_socks', 'steel_shield', 'electronic_amulet', 'shield_belt',
  'bayonet', 'saber', 'entrenching_tool', 'pistol', 'shotgun', 'rifle',

  /* §六 信息 · 资源 */
  'silicon_wafer', 'optical_fiber', 'precision_part', 'chip', 'aluminum_alloy', 'titanium_alloy', 'nuclear_fuel',

  /* §六 信息 · 装备与武器 */
  'tactical_helmet', 'tactical_liner', 'composite_armor', 'thermal_liner', 'composite_legs', 'tactical_liner_pants', 'tactical_boots', 'thermal_socks', 'riot_shield', 'military_amulet', 'military_shield_belt',
  'tactical_knife', 'carbon_fiber_knife', 'assault_rifle', 'sniper_rifle',

  /* §七 太空 · 资源 */
  'super_fabric', 'alien_alloy', 'antimatter', 'ai_core', 'life_support_unit', 'warp_core', 'alien_leather',

  /* §七 太空 · 装备与武器 */
  'power_helmet', 'super_fabric_hood', 'power_armor', 'super_fabric_liner', 'power_legs', 'super_fabric_legs', 'magnetic_boots', 'super_fabric_socks', 'energy_shield', 'phase_amulet', 'phase_shield_belt',
  'plasma_blade', 'gravity_hammer', 'rail_spear', 'particle_gun',

  /* §八 跨阶段（仓库） */
  'herbal_potion', 'medicine', 'shining_med', 'carpet',

  /* §十一 精通技能书（31 本） */
  'book_woodcutting', 'book_mining', 'book_gathering', 'book_farming', 'book_hunting', 'book_herding', 'book_cooking', 'book_crafting', 'book_research', 'book_stonecutting', 'book_pottery', 'book_medicine',
  'book_smelting', 'book_forging', 'book_carpentry', 'book_textile', 'book_tailoring', 'book_alchemy', 'book_weaving', 'book_papermaking',
  'book_power', 'book_machining', 'book_chemical_refining', 'book_glassmaking', 'book_gunpowder_making',
  'book_semiconductor', 'book_precision_assembly',
  'book_alien_mining', 'book_particle_collider', 'book_synthesis', 'book_warp_core_making',

  /* §十二 抽卡与恩赐 */
  'hero_shard', 'sticky_note', 'merch', 'collector', 'heirloom', 'stardust', 'star_potion', 'soul', 'ember',
  'undead_chainmail', 'ashen_legs', 'abyss_helmet', 'abyss_greatsword',

  /* 粮仓最后（18 种） */
  'berry', 'tuber', 'wild_mushroom', 'nut', 'grain', 'bean', 'vegetable', 'beet', 'herb_crop',
  'grain_seed', 'bean_seed', 'vegetable_seed', 'beet_seed', 'herb_seed', 'meat',
  'vegetarian_meal', 'meat_meal', 'balanced_meal'
];
