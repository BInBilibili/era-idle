/* js/icons.js —— 物品 / 敌人矢量图标（参考 Melvor Idle 图标风格）
 *
 * 风格三原则：
 *   1. 深色描边（#241b13，1.7/48）+ 三阶平涂（亮面 l / 中间 m / 暗面 d），小尺寸也认得出剪影；
 *   2. 只画物体本身，不画底框 —— 底框由容器的 .icon / .slot 负责，所以表格行、徽章里也能直接摆；
 *   3. 每张图最多 20 来个节点，DOM 数量可控；同一 id 的字符串缓存，重复渲染零开销。
 *
 * 对外：
 *   ICONS.item(x)   物品对象或 id → '<svg …>'
 *   ICONS.enemy(x)  敌人对象或 id → '<svg …>'
 *   ICONS.SPEC      规格表（id → [形状, 主色, 附属]），方便排查缺图
 *   ICONS.missing() 没有专属形状、退回方块兜底的 id 列表
 */
(function () {
  'use strict';

  const OUT = '#241b13';                     // 统一描边色（暖黑）
  const SW = 1.7;                            // 48 画布下的描边宽度

  /* ============================================================
   * 调色板：l 亮面 / m 中间色 / d 暗面
   * ============================================================ */
  const PAL = {
    /* -- 矿石 / 无机 -- */
    stone: { l: '#b3bcc6', m: '#8b949e', d: '#5a626b' },
    rock: { l: '#a8a197', m: '#857e74', d: '#575147' },
    granite: { l: '#b9b3aa', m: '#918b82', d: '#605a52' },
    sand: { l: '#efdcae', m: '#d8bf87', d: '#a68f5b' },
    limestone: { l: '#e8e4d6', m: '#cdc7b6', d: '#9a9384' },
    bauxite: { l: '#d8a07a', m: '#b57a52', d: '#7d4a2a' },
    copper: { l: '#eba06a', m: '#c2743e', d: '#8a4a22' },
    iron: { l: '#ced5dc', m: '#a3adb7', d: '#6c757f' },
    steel: { l: '#e2eaf2', m: '#b0bccb', d: '#747f8f' },
    silver: { l: '#f4f8fb', m: '#cbd5df', d: '#909ba7' },
    gold: { l: '#ffe08a', m: '#e8bb4b', d: '#a87f1f' },
    aluminum: { l: '#e4ebf0', m: '#bcc7cf', d: '#87929b' },
    titanium: { l: '#cfdbe0', m: '#9fb0b8', d: '#6a7a82' },
    rareEarth: { l: '#f7b7e8', m: '#cf7fc4', d: '#8c4a86' },
    uranium: { l: '#b6ff86', m: '#78d845', d: '#3f8a1e' },
    oil: { l: '#4a4a52', m: '#2c2c33', d: '#14141a' },
    acid: { l: '#c8f77a', m: '#93d13a', d: '#5d8f1c' },
    /* -- 木材 / 植物 / 皮革 / 骨 -- */
    wood: { l: '#c2955e', m: '#96693a', d: '#5f3f1e' },
    bark: { l: '#8a6a44', m: '#664a2c', d: '#3f2c17' },
    plank: { l: '#d0a86e', m: '#a97d47', d: '#74522a' },
    fiberGreen: { l: '#bcd98a', m: '#8fb35c', d: '#5a7a32' },
    hay: { l: '#e8cf86', m: '#cbb05e', d: '#97802f' },
    herb: { l: '#a8dfa0', m: '#6cb96a', d: '#3d7d46' },
    herbCrop: { l: '#8fd08a', m: '#5fa85c', d: '#366b38' },
    bone: { l: '#f4ecd6', m: '#dccfae', d: '#a89a78' },
    compost: { l: '#a8855f', m: '#7f6040', d: '#523b24' },
    clay: { l: '#d99a6c', m: '#b8703f', d: '#7d4622' },
    leatherS: { l: '#d9a971', m: '#b2834d', d: '#7c5628' },
    leatherM: { l: '#c48e58', m: '#9c6a36', d: '#6b4520' },
    leatherH: { l: '#9c6b42', m: '#784e2c', d: '#4d3118' },
    furWolf: { l: '#b8bcc4', m: '#8d939c', d: '#5d636c' },
    furBear: { l: '#8a5c34', m: '#6a4425', d: '#432a13' },
    hideCroc: { l: '#9dae7c', m: '#77875a', d: '#4d5a38' },
    hideAlien: { l: '#b39ae0', m: '#8a6fc4', d: '#5c4690' },
    feather: { l: '#fbf7ee', m: '#ddd5c4', d: '#a9a08c' },
    hemp: { l: '#cfd69a', m: '#a4ad6a', d: '#6f7840' },
    cotton: { l: '#fbfbf6', m: '#e6e4d8', d: '#b8b5a4' },
    wool: { l: '#f2e7d2', m: '#dbcbae', d: '#a89778' },
    linen: { l: '#efe9d7', m: '#d5cdb7', d: '#a59b81' },
    cloth: { l: '#e2dcd2', m: '#c3baa9', d: '#8f8574' },
    paper: { l: '#f7f1e0', m: '#e2d8bd', d: '#b3a786' },
    /* -- 工业 / 科技 -- */
    cement: { l: '#b5b6b0', m: '#90928b', d: '#61635d' },
    concrete: { l: '#adaca6', m: '#878680', d: '#5a5954' },
    glass: { l: '#c6ecf7', m: '#8fcadd', d: '#538fa6' },
    machine: { l: '#a8b2bc', m: '#7d8791', d: '#525b64' },
    pcb: { l: '#5fb98a', m: '#35855f', d: '#1c523a' },
    fuel: { l: '#c28a3c', m: '#9a6524', d: '#6a4214' },
    plastic: { l: '#7fd0c4', m: '#4fa79a', d: '#2c6f66' },
    powder: { l: '#6a6a72', m: '#4a4a52', d: '#2b2b31' },
    silicon: { l: '#9fb6d8', m: '#7391bb', d: '#455f86' },
    optical: { l: '#a8f0ff', m: '#63c8e8', d: '#2f8fb0' },
    chip: { l: '#3c4550', m: '#242b33', d: '#12171c' },
    alloyT: { l: '#b8c6cf', m: '#8a9aa5', d: '#5a6874' },
    carbon: { l: '#5c6270', m: '#3b404a', d: '#22262c' },
    nuclear: { l: '#b9ffd0', m: '#5fdc98', d: '#2a8a56' },
    army: { l: '#7f8a5e', m: '#5e6944', d: '#3b4429' },
    vest: { l: '#6b7a5c', m: '#4d5942', d: '#333b2b' },
    liner: { l: '#b7b2a4', m: '#948f82', d: '#625e53' },
    /* -- 太空 -- */
    superFabric: { l: '#d8b9f5', m: '#ac7fe0', d: '#704cb0' },
    alienAlloy: { l: '#a8e6d8', m: '#65b8a6', d: '#347a6c' },
    antimatter: { l: '#d9a6ff', m: '#9a5fd0', d: '#551f8a' },
    aiCore: { l: '#9fe6ff', m: '#4fb3d9', d: '#246b8c' },
    lifeSupport: { l: '#c8d8e8', m: '#93a8bd', d: '#5c707f' },
    warp: { l: '#ffd0f0', m: '#e878c8', d: '#93307f' },
    power: { l: '#c9d6e4', m: '#93a6ba', d: '#5c7086' },
    energy: { l: '#9ff0ff', m: '#54c8e8', d: '#227f9c' },
    plasma: { l: '#d8b6ff', m: '#a578f0', d: '#6536b0' },
    abyssMetal: { l: '#8b7fa8', m: '#635878', d: '#3c3349' },
    abyss: { l: '#b07ad8', m: '#7a4ba8', d: '#452569' },
    /* -- 药水 / 抽卡 / 食物 -- */
    potionGreen: { l: '#a8f08a', m: '#66c94e', d: '#357a2a' },
    potionRed: { l: '#ff9a9a', m: '#e0524f', d: '#9b2b28' },
    potionGold: { l: '#ffe08a', m: '#e8bb4b', d: '#a87f1f' },
    carpet: { l: '#c14e58', m: '#94343f', d: '#5f1f28' },
    soul: { l: '#8fd8ff', m: '#4a9ad8', d: '#245f8f' },
    ember: { l: '#ffb066', m: '#e06a2a', d: '#963d12' },
    stardust: { l: '#c8f0ff', m: '#7fd0f0', d: '#3f8fb0' },
    shardBlue: { l: '#9fc8ff', m: '#5c8fe0', d: '#2f5696' },
    noteYellow: { l: '#ffe98a', m: '#efd054', d: '#b3972c' },
    plushPink: { l: '#ffb8c8', m: '#e07a94', d: '#a04a60' },
    album: { l: '#d06a6a', m: '#a34444', d: '#6b2626' },
    woodGold: { l: '#d9a94a', m: '#b0812c', d: '#735114' },
    bookStone: { l: '#c9a06a', m: '#a17b45', d: '#6d4f26' },
    bookMedieval: { l: '#c05a4e', m: '#96392f', d: '#5e1f19' },
    bookIndustrial: { l: '#6f8fb0', m: '#4c6b8b', d: '#2c435b' },
    bookInfo: { l: '#4fae9e', m: '#33857a', d: '#1b524c' },
    bookSpace: { l: '#9a7fd0', m: '#7354a8', d: '#452f69' },
    berry: { l: '#e0607a', m: '#b53c56', d: '#7a2135' },
    tuber: { l: '#c99a63', m: '#a2773f', d: '#6d4d22' },
    mushroom: { l: '#d98a5a', m: '#b06337', d: '#7a3f1c' },
    nut: { l: '#b98a52', m: '#8f6532', d: '#5d411a' },
    grain: { l: '#e8c96a', m: '#c9a63f', d: '#8f7220' },
    bean: { l: '#a8c96a', m: '#7fa03c', d: '#4f6a1c' },
    veg: { l: '#a8d87a', m: '#7fb84a', d: '#4d7a22' },
    beet: { l: '#c05a8a', m: '#963c68', d: '#5e2044' },
    meat: { l: '#d9705f', m: '#b04a3c', d: '#7a2a20' },
    seedGrain: { l: '#f0d98a', m: '#cfb04f', d: '#947c26' },
    seedBean: { l: '#c8d87a', m: '#9fb04a', d: '#6a7a22' },
    seedVeg: { l: '#f0b07a', m: '#cf844a', d: '#94561f' },
    seedBeet: { l: '#e39ac0', m: '#c0689a', d: '#873a63' },
    seedHerb: { l: '#9fe0d0', m: '#62b8a4', d: '#347a6a' },
    vegMeal: { l: '#9fd08a', m: '#6fa85a', d: '#456f36' },
    meatMeal: { l: '#d98a5f', m: '#b06338', d: '#7a3f1e' },
    balMeal: { l: '#d8c07a', m: '#b39a4a', d: '#7a6a26' },
    /* -- 生物（敌人） -- */
    furRabbit: { l: '#e6ddd0', m: '#c7bba8', d: '#918673' },
    featherBrown: { l: '#c49a6a', m: '#9a7144', d: '#68472a' },
    furDeer: { l: '#c09060', m: '#986a3e', d: '#66431f' },
    furBoar: { l: '#8a7a68', m: '#665847', d: '#41372b' },
    furGoat: { l: '#f0ece0', m: '#d2cbb8', d: '#9c947f' },
    furAntelope: { l: '#d8b080', m: '#b08552', d: '#7a5730' },
    furMoose: { l: '#6f5440', m: '#52402f', d: '#33261b' },
    furBison: { l: '#5d4a38', m: '#43342a', d: '#2a1f19' },
    furMammoth: { l: '#9a6a44', m: '#734b2c', d: '#4a2e18' },
    scaleCroc: { l: '#7f9a5c', m: '#5d7640', d: '#3b4d28' },
    scaleLizard: { l: '#8aa05c', m: '#657a3c', d: '#41501f' },
    hideRhino: { l: '#8f8a7c', m: '#6b6759', d: '#454236' },
    metalMech: { l: '#a8b0ba', m: '#78828d', d: '#4b545d' },
    mutant: { l: '#8fb86a', m: '#648a44', d: '#3f5c28' },
    alien: { l: '#a88fd0', m: '#7d5fa8', d: '#4f386f' },
    siliconC: { l: '#9fd8e0', m: '#6aa8b8', d: '#3d6b7a' },
    demon: { l: '#b8564a', m: '#8a352c', d: '#5a1c18' },
    ash: { l: '#c8c0b8', m: '#9a928a', d: '#67605a' },
    undead: { l: '#9fb8a0', m: '#76907a', d: '#4a5c4e' },
    zombie: { l: '#8aa87f', m: '#5f7a5a', d: '#3c5138' },
    voidEye: { l: '#a87fd8', m: '#7147a8', d: '#432166' },
  };

  /* ============================================================
   * 绘图小工具
   * ============================================================ */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* 剪影：带描边 */
  const sil = (d, fill, w) => `<path d="${d}" fill="${fill}" stroke="${OUT}" stroke-width="${w || SW}" stroke-linejoin="round"/>`;
  /* 色块：不带描边，用于亮/暗面与花纹 */
  const det = (d, fill, op) => `<path d="${d}" fill="${fill}"${op ? ` opacity="${op}"` : ''}/>`;
  /* 线：只描边 */
  const ln = (d, col, w, op) => `<path d="${d}" fill="none" stroke="${col || OUT}" stroke-width="${w || 1.2}" stroke-linecap="round" stroke-linejoin="round"${op ? ` opacity="${op}"` : ''}/>`;
  const pa = (d, fill) => `<path d="${d}" fill="${fill}" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const el = (cx, cy, rx, ry, fill, extra) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${extra || ''}/>`;
  const ci = (cx, cy, r, fill, extra) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra || ''}/>`;
  const sh = (cx, cy, rx, ry) => el(cx, cy, rx, ry, '#000', ' opacity=".22"');
  const hl = (d, op) => det(d, '#fff', op || '.16');
  const pc = k => PAL[k] || null;
  /* 稳定伪随机：同一个 id 每次拿到的「随机」一致，图标不会闪 */
  function rng(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
      return (h % 10000) / 10000;
    };
  }
  const jit = (r, span) => (r() - 0.5) * span;   // 抖动

  /* ============================================================
   * 形状库（每个函数返回 48×48 内的 SVG 片段）
   *   (c, r, arg)  c=主色对象  r=稳定随机  arg=规格表第三项（子样式/第二主色/字形名）
   * ============================================================ */
  const SH = {};

  /* 兜底：没有专属形状时画个木箱，避免整页空掉 */
  SH.box = function (c) {
    return sh(24, 43, 13, 2.6) +
      sil('M9 15 H39 V38 H9 Z', c.m) +
      det('M9 15 H39 V20 H9 Z', c.l) +
      det('M9 33 H39 V38 H9 Z', c.d) +
      ln('M9 15 H39 V38 H9 Z', OUT, 1.4) +
      ln('M15 20 V33 M24 20 V33 M33 20 V33', c.d, 1.6);
  };

  /* ============================================================
   * 规格表：id → [形状, 主色, 附属]
   * 附属的用法由形状自己决定（第二主色 / 子样式 / 书本字形 / 皮甲尺寸）
   * ============================================================ */
  const SPEC = {
    /* ---------------- 矿石 ---------------- */
    stone: ['rock', 'stone'],
    copper_ore: ['rock', 'stone', 'copper'],
    sand: ['dune', 'sand'],
    limestone: ['rock', 'limestone'],
    iron_ore: ['rock', 'rock', 'iron'],
    oil: ['barrel', 'oil', 'wood'],
    nitric_acid: ['flask', 'glass', 'acid'],
    bauxite: ['rock', 'rock', 'bauxite'],
    rare_earth: ['crystal', 'rareEarth'],
    silver_ore: ['rock', 'stone', 'silver'],
    titanium_ore: ['rock', 'granite', 'titanium'],
    gold_ore: ['rock', 'stone', 'gold'],
    uranium_ore: ['rock', 'rock', 'uranium'],

    /* ---------------- 石器时代材料 ---------------- */
    wood: ['log', 'wood', 'bark'],
    stone_block: ['block', 'stone'],
    plant_fiber: ['fiber', 'fiberGreen'],
    fodder: ['hay', 'hay'],
    herb: ['sprig', 'herb'],
    bone_horn: ['horn', 'bone'],
    compost: ['compost', 'compost'],
    pottery: ['pot', 'clay'],

    /* ---------------- 动物材料 ---------------- */
    leather_small: ['hide', 'leatherS', '0.82'],
    leather_medium: ['hide', 'leatherM', '1'],
    leather_heavy: ['hide', 'leatherH', '1.12'],
    feather: ['feather', 'feather'],
    wolf_pelt: ['pelt', 'furWolf'],
    bear_pelt: ['pelt', 'furBear'],
    croc_leather: ['hide', 'hideCroc', '1', 'scale'],
    alien_leather: ['hide', 'hideAlien', '1', 'glow'],

    /* ---------------- 石器时代装备 ---------------- */
    leather_cap: ['helm', 'leatherM', 'soft'],
    linen_headscarf: ['hood', 'linen'],
    leather_armor: ['torso', 'leatherM', 'soft'],
    linen_shirt: ['shirt', 'linen'],
    leather_pants: ['pants', 'leatherM', 'soft'],
    linen_underpants: ['pants', 'linen'],
    leather_boots: ['boot', 'leatherM'],
    wool_socks: ['sock', 'wool'],
    wood_shield: ['shield', 'wood', 'round'],
    bone_necklace: ['necklace', 'bone'],
    leather_belt: ['belt', 'leatherM'],

    /* ---------------- 石器时代武器 ---------------- */
    stone_dagger: ['dagger', 'stone', 'leatherM'],
    stone_axe: ['axe', 'stone', 'wood'],
    stone_spear: ['spear', 'stone', 'wood'],
    short_bow: ['bow', 'wood', '0.86'],

    /* ---------------- 中世纪材料 ---------------- */
    plank: ['planks', 'plank'],
    copper_ingot: ['ingot', 'copper'],
    iron_ingot: ['ingot', 'iron'],
    steel: ['ingotStack', 'steel'],
    silver_ingot: ['ingot', 'silver'],
    gold_ingot: ['ingot', 'gold'],
    hemp: ['fiber', 'hemp'],
    cotton: ['cotton', 'cotton'],
    cloth: ['cloth', 'cloth'],
    wool: ['yarn', 'wool'],
    paper: ['paper', 'paper'],

    /* ---------------- 中世纪装备 ---------------- */
    iron_helm: ['helm', 'iron', 'plate'],
    steel_helm: ['helm', 'steel', 'plate'],
    cloth_hat: ['hood', 'cloth'],
    iron_armor: ['torso', 'iron', 'plate'],
    steel_armor: ['torso', 'steel', 'plate'],
    cloth_shirt: ['shirt', 'cloth'],
    iron_legs: ['pants', 'iron', 'plate'],
    cloth_pants: ['pants', 'cloth'],
    iron_boots: ['boot', 'iron'],
    woolen_socks: ['sock', 'wool'],
    iron_shield: ['shield', 'iron', 'kite'],
    silver_necklace: ['necklace', 'silver'],
    iron_belt: ['belt', 'iron'],

    /* ---------------- 中世纪武器 ---------------- */
    copper_dagger: ['dagger', 'copper', 'leatherM'],
    iron_dagger: ['dagger', 'iron', 'leatherM'],
    short_sword: ['sword', 'steel', '0.9'],
    copper_spear: ['spear', 'copper', 'wood'],
    iron_spear: ['spear', 'iron', 'wood'],
    battle_axe: ['axe', 'steel', 'wood', 'double'],
    two_handed_sword: ['sword', 'steel', '1.16'],
    great_hammer: ['hammer', 'steel', 'wood'],
    long_bow: ['bow', 'wood', '1'],
    crossbow: ['crossbow', 'wood', 'iron'],

    /* ---------------- 工业材料 ---------------- */
    cement: ['sack', 'cement'],
    concrete: ['slab', 'concrete'],
    glass: ['glass', 'glass'],
    machine_part: ['gear', 'machine'],
    electronic_component: ['pcb', 'pcb'],
    chemical_fuel: ['jerrycan', 'fuel'],
    plastic: ['pellets', 'plastic'],
    gunpowder: ['barrel', 'powder', 'wood'],

    /* ---------------- 工业装备 ---------------- */
    steel_helmet: ['helm', 'steel', 'plate'],
    cotton_hat: ['hood', 'cotton'],
    bulletproof_vest: ['torso', 'vest', 'vest'],
    cotton_shirt: ['shirt', 'cotton'],
    steel_legs: ['pants', 'steel', 'plate'],
    cotton_pants: ['pants', 'cotton'],
    military_boots: ['boot', 'army'],
    cotton_socks: ['sock', 'cotton'],
    steel_shield: ['shield', 'steel', 'kite'],
    electronic_amulet: ['amulet', 'gold', 'pcb'],
    shield_belt: ['belt', 'army', 'shield'],

    /* ---------------- 工业武器 ---------------- */
    bayonet: ['knife', 'steel', 'bayonet'],
    saber: ['saber', 'steel'],
    entrenching_tool: ['shovel', 'army', 'wood'],
    pistol: ['pistol', 'army'],
    shotgun: ['shotgun', 'steel', 'wood'],
    rifle: ['rifle', 'wood', 'steel'],

    /* ---------------- 信息时代材料 ---------------- */
    silicon_wafer: ['wafer', 'silicon'],
    optical_fiber: ['coil', 'optical'],
    precision_part: ['gear', 'machine', 'precise'],
    chip: ['chip', 'chip'],
    aluminum_alloy: ['ingot', 'aluminum'],
    titanium_alloy: ['ingot', 'titanium'],
    nuclear_fuel: ['rod', 'nuclear'],

    /* ---------------- 信息时代装备 ---------------- */
    tactical_helmet: ['helm', 'army', 'tactical'],
    tactical_liner: ['shirt', 'army'],
    composite_armor: ['torso', 'alloyT', 'plate'],
    thermal_liner: ['shirt', 'liner'],
    composite_legs: ['pants', 'alloyT', 'plate'],
    tactical_liner_pants: ['pants', 'liner'],
    tactical_boots: ['boot', 'army'],
    thermal_socks: ['sock', 'liner'],
    riot_shield: ['shield', 'army', 'riot'],
    military_amulet: ['amulet', 'alloyT', 'gold'],
    military_shield_belt: ['belt', 'alloyT', 'shield'],

    /* ---------------- 信息时代武器 ---------------- */
    tactical_knife: ['knife', 'carbon', 'combat'],
    carbon_fiber_knife: ['knife', 'carbon', 'long'],
    assault_rifle: ['rifle', 'carbon', 'steel', 'carbine'],
    sniper_rifle: ['rifle', 'carbon', 'steel', 'sniper'],

    /* ---------------- 太空时代材料 ---------------- */
    super_fabric: ['roll', 'superFabric'],
    alien_alloy: ['shardCrystal', 'alienAlloy'],
    antimatter: ['orb', 'antimatter'],
    ai_core: ['cube', 'aiCore'],
    life_support_unit: ['canister', 'lifeSupport'],
    warp_core: ['vortex', 'warp'],

    /* ---------------- 太空时代装备 ---------------- */
    power_helmet: ['helm', 'power', 'power'],
    super_fabric_hood: ['hood', 'superFabric'],
    power_armor: ['torso', 'power', 'power'],
    super_fabric_liner: ['shirt', 'superFabric'],
    power_legs: ['pants', 'power', 'power'],
    super_fabric_legs: ['pants', 'superFabric'],
    magnetic_boots: ['boot', 'power', 'power'],
    super_fabric_socks: ['sock', 'superFabric'],
    energy_shield: ['shield', 'energy', 'energy'],
    phase_amulet: ['amulet', 'energy', 'energy'],
    phase_shield_belt: ['belt', 'energy', 'shield'],

    /* ---------------- 太空时代武器 ---------------- */
    plasma_blade: ['sword', 'plasma', '1.02', 'energy'],
    gravity_hammer: ['hammer', 'power', 'power', 'energy'],
    rail_spear: ['spear', 'power', 'alloyT', 'energy'],
    particle_gun: ['rifle', 'power', 'energy', 'cannon'],

    /* ---------------- 跨阶段 ---------------- */
    herb_medicine: ['sprig', 'herbCrop', 'bushy'],
    herbal_potion: ['flask', 'glass', 'potionGreen'],
    medicine: ['flask', 'glass', 'potionRed'],
    shining_med: ['flask', 'glass', 'potionGold'],
    carpet: ['rug', 'carpet'],

    /* ---------------- 采集资源包（虚拟产出，悬浮显示概率） ---------------- */
    grass_resource: ['bundle', 'fiberGreen'],
    plains_resource: ['bundle', 'wood'],
    swamp_resource: ['bundle', 'herb'],

    /* ---------------- 技能书（34） ---------------- */
    book_woodcutting: ['book', 'bookStone', 'tree'],
    book_mining: ['book', 'bookStone', 'pick'],
    book_gathering: ['book', 'bookStone', 'basket'],
    book_farming: ['book', 'bookStone', 'sprout'],
    book_hunting: ['book', 'bookStone', 'bow'],
    book_herding: ['book', 'bookStone', 'bell'],
    book_cooking: ['book', 'bookStone', 'pot'],
    book_crafting: ['book', 'bookStone', 'hammer'],
    book_research: ['book', 'bookStone', 'scroll'],
    book_stonecutting: ['book', 'bookStone', 'saw'],
    book_pottery: ['book', 'bookStone', 'vase'],
    book_medicine: ['book', 'bookStone', 'cross'],
    book_smelting: ['book', 'bookMedieval', 'flame'],
    book_forging: ['book', 'bookMedieval', 'anvil'],
    book_carpentry: ['book', 'bookMedieval', 'plane'],
    book_textile: ['book', 'bookMedieval', 'needle'],
    book_tailoring: ['book', 'bookMedieval', 'scissors'],
    book_oil_extraction: ['book', 'bookIndustrial', 'barrel'],
    book_weaving: ['book', 'bookMedieval', 'loom'],
    book_papermaking: ['book', 'bookMedieval', 'scroll'],
    book_power: ['book', 'bookIndustrial', 'bolt'],
    book_machining: ['book', 'bookIndustrial', 'gear'],
    book_chemical_refining: ['book', 'bookIndustrial', 'alembic'],
    book_glassmaking: ['book', 'bookIndustrial', 'window'],
    book_gunpowder_making: ['book', 'bookIndustrial', 'bomb'],
    book_semiconductor: ['book', 'bookInfo', 'wafer'],
    book_precision_assembly: ['book', 'bookInfo', 'caliper'],
    book_alien_mining: ['book', 'bookSpace', 'pick'],
    book_particle_collider: ['book', 'bookSpace', 'atom'],
    book_synthesis: ['book', 'bookSpace', 'cube'],
    book_warp_core_making: ['book', 'bookSpace', 'vortex'],

    /* ---------------- 抽卡 / 恩赐 ---------------- */
    hero_shard: ['shardCrystal', 'shardBlue'],
    sticky_note: ['note', 'noteYellow'],
    merch: ['plush', 'plushPink'],
    collector: ['album', 'album'],
    heirloom: ['chest', 'woodGold'],
    stardust: ['dust', 'stardust'],
    star_potion: ['bottle', 'star'],
    soul: ['flame', 'soul'],
    ember: ['emberCoal', 'ember'],

    /* ---------------- 黑魂装备套（隐藏线，仍要有图） ---------------- */
    undead_chainmail: ['torso', 'abyssMetal', 'chain'],
    ashen_legs: ['pants', 'abyssMetal', 'plate'],
    abyss_helmet: ['helm', 'abyssMetal', 'abyss'],
    abyss_greatsword: ['sword', 'abyss', '1.2', 'abyss'],

    /* ---------------- 粮食 / 种子 / 熟食 ---------------- */
    berry: ['berry', 'berry'],
    tuber: ['root', 'tuber'],
    wild_mushroom: ['mushroom', 'mushroom'],
    nut: ['nuts', 'nut'],
    grain: ['sheaf', 'grain'],
    bean: ['pod', 'bean'],
    vegetable: ['cabbage', 'veg'],
    beet: ['beet', 'beet'],
    herb_crop: ['sprig', 'herbCrop', 'bushy'],
    meat: ['steak', 'meat'],
    grain_seed: ['seedPouch', 'seedGrain'],
    bean_seed: ['seedPouch', 'seedBean'],
    vegetable_seed: ['seedPouch', 'seedVeg'],
    beet_seed: ['seedPouch', 'seedBeet'],
    herb_seed: ['seedPouch', 'seedHerb'],
    vegetarian_meal: ['bowl', 'vegMeal'],
    meat_meal: ['bowl', 'meatMeal'],
    balanced_meal: ['bowl', 'balMeal'],
  };

  /* ============================================================
   * 渲染入口
   * ============================================================ */
  const NAME2ID = {};
  if (typeof window !== 'undefined' && window.ITEMS) {
    Object.keys(window.ITEMS).forEach(id => { NAME2ID[window.ITEMS[id].name] = id; });
  }
  const EN2ID = {};
  if (typeof window !== 'undefined' && window.ENEMIES) {
    window.ENEMIES.forEach(e => { EN2ID[e.id] = e; EN2ID[e.name] = e; });
  }

  const cache = Object.create(null);
  function svgWrap(inner, box) {
    return `<svg class="icSvg" viewBox="${box || '0 0 48 48'}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }
  function item(x) {
    const id = typeof x === 'string' ? x : (x && (x.id || NAME2ID[x.name]));
    if (!id) return svgWrap(SH.box(PAL.stone));
    if (cache['i:' + id]) return cache['i:' + id];
    const spec = SPEC[id];
    const c = PAL[spec && spec[1]] || PAL.stone;
    const fn = (spec && SH[spec[0]]) || SH.box;
    let out;
    try { out = fn(c, rng(id), spec && spec[2], spec && spec[3]); } catch (e) { out = SH.box(c); }
    if (!out) out = SH.box(c);
    cache['i:' + id] = svgWrap(out);
    return cache['i:' + id];
  }
  function enemy(x) {
    const e = typeof x === 'string' ? EN2ID[x] : (x || (x && x.id ? x : null));
    if (!e) return svgWrap(SH.box(PAL.bone));
    if (cache['e:' + e.id]) return cache['e:' + e.id];
    const spec = ENEMY_SPEC[e.id] || ['beast', 'furBoar'];
    const c = PAL[spec[1]] || PAL.furBoar;
    const fn = ENEMY_SH[spec[0]] || ENEMY_SH.beast;
    let out;
    try { out = fn(c, rng(e.id), spec[2], e); } catch (err) { out = ENEMY_SH.beast(c, rng(e.id)); }
    if (!out) out = ENEMY_SH.beast(c, rng(e.id));
    cache['e:' + e.id] = svgWrap(out, '0 0 48 48');
    return cache['e:' + e.id];
  }

  const ENEMY_SH = {};
  const ENEMY_SPEC = {
    rabbit: ['rabbit', 'furRabbit'],
    grouse: ['grouse', 'featherBrown'],
    deer: ['deer', 'furDeer'],
    boar: ['boar', 'furBoar'],
    wolf: ['wolf', 'furWolf'],
    bear: ['bear', 'furBear'],
    mountain_goat: ['goat', 'furGoat'],
    antelope: ['antelope', 'furAntelope'],
    moose: ['moose', 'furMoose'],
    bison: ['bison', 'furBison'],
    mammoth: ['mammoth', 'furMammoth'],
    crocodile: ['croc', 'scaleCroc'],
    monitor_lizard: ['lizard', 'scaleLizard'],
    rhino: ['rhino', 'hideRhino'],
    mech_beast: ['mech', 'metalMech'],
    mutant_behemoth: ['mutantBeast', 'mutant'],
    alien_predator: ['alienPred', 'alien'],
    silicon_lifeform: ['silicon', 'siliconC'],
    asylum_demon: ['demon', 'demon'],
    ashen_judicator: ['judge', 'ash'],
    abyss_watcher: ['watcher', 'voidEye'],
    nameless_king: ['king', 'undead'],
    wandering_zombie: ['zombie', 'zombie'],
    zombie_horde: ['zombieHorde', 'zombie'],
    mutant: ['mutant', 'mutant'],
    horde_chieftain: ['chieftain', 'zombie'],
  };

  /* ==================== 形状：资源 / 材料 ==================== */
  const rc = (x, y, w, h, r, fill, ex) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r || 0}" fill="${fill}"${ex || ''}/>`;
  const rcl = (x, y, w, h, r, fill, wd) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r || 0}" fill="${fill}" stroke="${OUT}" stroke-width="${wd || SW}"/>`;
  const gp = (tf, inner) => `<g transform="${tf}">${inner}</g>`;
  const rot = (deg, inner, cx, cy) => gp(`rotate(${deg} ${cx == null ? 24 : cx} ${cy == null ? 24 : cy})`, inner);

  /* 齿轮路径 */
  function cogPath(cx, cy, rO, rI, n) {
    const pt = (r, a) => (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    const st = Math.PI * 2 / n;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = i * st;
      const seq = [[rO, a - 0.17 * st], [rO, a + 0.17 * st], [rI, a + 0.34 * st], [rI, a + 0.66 * st]];
      seq.forEach(([r, ang], j) => { d += (i === 0 && j === 0 ? 'M' : 'L') + pt(r, ang); });
    }
    return d + 'Z';
  }

  /* 矿石：一块石头 + 矿脉 */
  SH.rock = function (c, r, accKey) {
    const a = pc(accKey);
    let s = sh(25, 42, 13, 2.8);
    s += sil('M8.5 32 L12 23.5 L20 18.5 L30 19.5 L39.5 26.5 L38 36.5 L29 41.5 L16 40.5 Z', c.m);
    s += det('M12 23.5 L20 18.5 L23.5 27.5 L16 40.5 L8.5 32 Z', c.l);
    s += det('M30 19.5 L39.5 26.5 L38 36.5 L29 41.5 L26 31 Z', c.d);
    s += ln('M20 18.5 L23.5 27.5 L26 31 M23.5 27.5 L16 40.5', c.d, 1, '.45');
    if (a) {
      const spots = [[17, 30], [25.5, 24.5], [31, 35]];
      const n = 2 + (r() > 0.45 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const [x, y] = spots[i], k = 2.7 + r() * 0.7;
        s += det(`M${x} ${y - k} L${x + k} ${y} L${x} ${y + k} L${x - k} ${y} Z`, a.m);
        s += det(`M${x} ${y - k} L${x + k} ${y} L${x} ${y} Z`, a.l);
        s += det(`M${x - k} ${y} L${x} ${y + k} L${x} ${y} Z`, a.d);
      }
    }
    if (a && (accKey === 'gold' || accKey === 'silver')) {
      s += det('M34 21 L35.6 24.4 L39 26 L35.6 27.6 L34 31 L32.4 27.6 L29 26 L32.4 24.4 Z', '#fff', '.9');
    }
    return s;
  };

  /* 沙堆 */
  SH.dune = function (c) {
    let s = sh(24, 42, 14, 2.8);
    s += sil('M6 39 Q12 23 24 20 Q36 23 42 39 Z', c.m);
    s += det('M12 35 Q17 23 24 20 Q28 25 30 31 Q20 27 12 35 Z', c.l);
    s += det('M24 20 Q36 23 42 39 L29 39 Q31 28 24 20 Z', c.d);
    s += ci(17, 33, 1.1, c.d) + ci(27, 31, 1, c.d) + ci(22, 36, 1.2, c.d) + ci(33, 35, 0.9, c.d);
    return s;
  };

  /* 桶（石油 / 火药） */
  SH.barrel = function (c, r, accKey) {
    const a = pc(accKey) || PAL.wood;
    const oil = c === PAL.oil;
    let s = sh(24, 43, 12, 2.6);
    s += sil('M14 11 Q24 8 34 11 L35 38 Q24 42 13 38 Z', c.m);
    s += det('M13.6 15 Q24 12 34.4 15 L34.6 18.4 Q24 15.4 13.4 18.4 Z', a.m);
    s += det('M13.1 32 Q24 35 34.9 32 L35 36 Q24 39.6 13 36 Z', a.m);
    s += ln('M19 12 L18.6 39 M24 11.5 L24 40.5 M29 12 L29.4 39', c.d, 1, '.5');
    s += hl('M16 13 L17 36.6 L19.4 37 L18.6 13.4 Z', '.14');
    if (oil) {
      s += sil('M24 17 Q29.4 24 29.4 28.4 A5.4 5.4 0 0 1 18.6 28.4 Q18.6 24 24 17 Z', '#191920', 1.2);
      s += det('M21.4 27.4 A2.6 2.6 0 0 0 24.6 31.6', '#fff', '.5');
    } else {
      s += ci(24, 26, 5.2, c.d, ` stroke="${OUT}" stroke-width="1.2"`);
      s += ci(24, 26, 2.6, a.d);
      s += ln('M27 21 Q30 17 32 18', PAL.bark.m, 1.8);
      s += ci(32.4, 17.4, 1.8, PAL.ember.l);
      s += ci(32.4, 17.4, 3.4, PAL.ember.l, ' opacity=".3"');
    }
    return s;
  };

  /* 圆底烧瓶（硝酸 / 药剂） */
  SH.flask = function (c, r, accKey) {
    const a = pc(accKey) || PAL.acid;
    let s = sh(24, 43, 9, 2.4);
    s += rcl(19, 6, 10, 6, 1.4, PAL.wood.m, 1.4);            // 软木塞
    s += sil('M20 11 H28 V18 Q36 22 35.5 30 Q35 40 24 40 Q13 40 12.5 30 Q12 22 20 18 Z', c.m);
    s += det('M20 11 H28 V18 Q36 22 35.5 30 Q35 40 24 40 Q13 40 12.5 30 Q12 22 20 18 Z', a.m, '.92');
    s += det('M17 25 Q20 22 22 24 Q19 27 16.5 30 Z', a.l);
    s += det('M15 29 Q24 33 33 29 Q32 39 24 39 Q16 39 15 29 Z', a.d, '.5');
    s += ln('M16 22 Q13 26 13.4 31', '#fff', 1.6, '.35');
    s += ci(20, 33, 1.5, a.l) + ci(27, 30, 1.1, a.l) + ci(25, 35.5, 0.9, a.l);
    return s;
  };

  /* 晶体簇（稀土） */
  SH.crystal = function (c) {
    let s = sh(24, 43, 12, 2.6);
    s += sil('M7 40 L12 25 L17 40 Z', c.d);
    s += sil('M31 40 L36 24 L41 40 Z', c.d);
    s += sil('M17 41 L21.5 9 L27 20 L29 41 Z', c.m);
    s += det('M21.5 9 L24 20 L23 41 L17 41 Z', c.l);
    s += det('M27 20 L29 41 L24 41 L24 20 Z', c.d);
    s += ln('M21.5 9 L24 20 L27 20', c.d, 0.9, '.6');
    s += det('M34 12 L35.4 15.4 L39 17 L35.4 18.6 L34 22 L32.6 18.6 L29 17 L32.6 15.4 Z', '#fff', '.85');
    s += ci(12, 21, 1.2, c.l) + ci(38, 20, 1, c.l);
    return s;
  };

  /* 原木 */
  SH.log = function (c, r, barkKey) {
    const b = pc(barkKey) || PAL.bark;
    let s = sh(24, 40, 14, 2.8);
    s += gp('rotate(-16 24 24)',
      sil('M9 18 H34 Q40 18 40 24 Q40 30 34 30 H9 Q5 24 9 18 Z', b.m) +
      ln('M14 19 Q16 24 14 29 M21 18.6 Q23 24 21 29.4 M28 18.6 Q30 24 28 29.4', b.d, 1.1, '.55') +
      sil('M9 18 Q5 24 9 30 A6 6 0 0 0 9 18 Z', c.l, 1.3) +
      ln('M9 20 A4 4 0 0 1 9 28', c.d, 1, '.5') +
      hl('M12 19.6 Q9 24 12 28.4 L14 28.4 Q11 24 14 19.6 Z', '.12'));
    s += ci(6.2, 37, 1.4, b.d) + ci(20, 39.5, 1.2, b.d);
    return s;
  };

  /* 石材（切块） */
  SH.block = function (c) {
    return sh(24, 43, 14, 2.6) +
      sil('M8 19 L24 10 L40 19 L24 28 Z', c.m) +
      det('M8 19 L24 10 L24 18 L8 22 Z', c.l) +
      det('M40 19 L24 10 L24 18 L40 22 Z', c.l) +
      sil('M8 19 V36 L24 44 V28 Z', c.m) +
      sil('M40 19 V36 L24 44 V28 Z', c.d) +
      det('M8 19 L24 28 L40 19 L40 22 L24 31 L8 22 Z', c.m) +
      ln('M13 22 L13 33 M29 25 L29 39', c.d, 1, '.5');
  };

  /* 植物纤维 / 大麻：一捆杆 */
  SH.fiber = function (c, r) {
    let s = sh(24, 43, 10, 2.4);
    let stalks = '';
    const tops = [[11, 17], [16, 13], [22, 11], [28, 12], [33, 15], [37, 19]];
    tops.forEach(([x, y], i) => {
      stalks += ln(`M24 38 Q${20 + i * 2} 26 ${x} ${y}`, i % 2 ? c.d : c.m, 2.1);
      stalks += det(`M${x - 2} ${y + 2} Q${x} ${y - 1} ${x + 1} ${y + 4} Z`, c.l);
    });
    s += stalks;
    s += rcl(18.5, 29, 11, 5.2, 1.2, PAL.leatherM.m, 1.3);
    s += ln('M19 31.6 H29', PAL.leatherM.d, 1);
    return s;
  };

  /* 草料：草捆 */
  SH.hay = function (c) {
    let s = sh(24, 42, 13, 2.6);
    s += rcl(10, 16, 28, 22, 4, c.m);
    s += det('M10 16 H38 V21 H10 Z', c.l);
    s += ln('M12 24 H36 M12 30 H36', c.d, 1.1, '.55');
    s += det('M10 33 H38 V38 H10 Z', c.d, '.5');
    s += ln('M18 17 V37 M24 17 V37 M30 17 V37', '#fff', 0.9, '.18');
    s += ln('M38 19 L44 14 M39 26 L45 26 M38 33 L44 38', c.d, 1.4, '.7');
    return s;
  };

  /* 药草 / 草药作物 */
  SH.sprig = function (c, r, style) {
    let s = sh(24, 43, 9, 2.2);
    if (style === 'bushy') {
      s += el(24, 28, 14, 11, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
      s += det('M12 24 Q18 16 26 17 Q21 24 14 30 Z', c.l);
      s += det('M36 26 Q33 36 24 38 Q32 35 33 28 Z', c.d);
      s += ln('M24 38 V42', PAL.bark.m, 1.6);
      s += ci(20, 24, 2, c.l) + ci(29, 21, 1.8, c.l) + ci(26, 31, 1.6, c.l);
      return s;
    }
    s += ln('M24 40 Q22 28 24 12', PAL.bark.m, 2);
    const leaves = [[20, 31, -1], [28, 29, 1], [19, 24, -1], [29, 22, 1], [21, 17, -1], [27, 15, 1]];
    leaves.forEach(([x, y, d], i) => {
      s += det(`M24 ${y + 4} Q${x + d * 3} ${y - 3} ${x + d * 7} ${y + 1} Q${x + d * 2} ${y + 6} 24 ${y + 4} Z`, i % 2 ? c.l : c.m);
    });
    s += ci(24, 11, 2.6, c.l) + ci(24, 11, 1.2, '#fff', ' opacity=".7"');
    return s;
  };

  /* 资源包：布袋 + 露出袋口的产物 */
  SH.bundle = function (c) {
    let s = sh(24, 43, 12, 2.4);
    s += sil('M11 20 Q9 27 10 34 Q11 41 16 42 H32 Q37 41 38 34 Q39 27 37 20 Z', PAL.cloth.m);
    s += det('M11 20 Q9 27 10 34 Q11 41 16 42 L17 20 Z', PAL.cloth.l);
    s += det('M36 22 Q38 29 37 35 Q36 41 31 42 L30 22 Z', PAL.cloth.d);
    s += ln('M11 20 Q9 27 10 34 Q11 41 16 42 H32 Q37 41 38 34 Q39 27 37 20 Z', OUT, 1.4);
    s += ln('M11 20 Q24 15 37 20', PAL.cloth.d, 2.2);
    s += ci(15, 17, 3, c.m) + ci(15, 16, 1.2, c.l);
    s += ci(24, 15, 3.4, c.l) + ci(24, 14, 1.4, c.m);
    s += ci(33, 17, 3, c.d) + ci(33, 16, 1.2, c.m);
    s += ln('M24 36 Q28 34 32 36', PAL.cloth.d, 1.2, '.55');
    return s;
  };

  /* 骨 / 角 */
  SH.horn = function (c) {
    let s = sh(24, 42, 11, 2.4);
    s += sil('M13 40 Q9 30 13 21 Q17 12 28 8 Q35 6 39 11 Q33 11 28 15 Q20 21 19 30 Q18.5 35 20 40 Z', c.m);
    s += det('M13 40 Q9 30 13 21 Q15 16 20 12 Q17 22 18 31 Q18.5 36 20 40 Z', c.l);
    s += ln('M15 32 Q17 24 22 18 M17.5 36 Q19 31 22 27', c.d, 1.1, '.6');
    s += rcl(12, 34, 9, 7, 2.4, c.d, 1.4);
    return s;
  };

  /* 堆肥 */
  SH.compost = function (c) {
    let s = sh(24, 42, 13, 2.6);
    s += sil('M8 38 Q10 26 18 22 Q24 19 30 22 Q38 26 40 38 Z', c.m);
    s += det('M14 35 Q16 26 22 23 Q18 30 18 36 Z', c.l);
    s += det('M30 23 Q38 27 40 38 L28 38 Q32 30 30 23 Z', c.d);
    s += ci(16, 33, 1.2, c.d) + ci(26, 30, 1.1, c.d) + ci(32, 34, 1.3, c.d);
    s += ln('M20 21 Q22 16 26 15', PAL.herb.m, 1.5) + ci(26, 14, 1.7, PAL.herb.l);
    s += ln('M31 24 Q34 20 37 20', PAL.herb.d, 1.3);
    return s;
  };

  /* 陶器 */
  SH.pot = function (c) {
    let s = sh(24, 43, 10, 2.4);
    s += sil('M14 20 Q9 27 11 34 Q14 41 24 41 Q34 41 37 34 Q39 27 34 20 Z', c.m);
    s += det('M14 20 Q10 26 12 33 Q14 36 17 37 Q13 29 16 20 Z', c.l);
    s += det('M34 20 Q39 27 37 34 Q35 41 24 41 Q32 39 33 31 Q33 25 31 20 Z', c.d);
    s += rcl(17, 13, 14, 8, 2, c.m, 1.5);
    s += rcl(15.6, 10.6, 16.8, 4.4, 2.2, c.l, 1.4);
    s += ln('M14 26 Q24 30 34 26', c.d, 1.1, '.5');
    s += ln('M16 23 Q14 28 15.4 33', '#fff', 1.5, '.3');
    return s;
  };

  /* 皮革：展开的兽皮 */
  SH.hide = function (c, r, sizeKey, style) {
    const f = Number(sizeKey) || 1;
    let s = sh(24, 42, 13, 2.5);
    let h = sil('M9 17 Q9 12 14 13 L19 16 Q24 12 29 16 L34 13 Q39 12 39 17 L38 27 L34 40 L24 36 L14 40 L10 27 Z', c.m);
    h += det('M9 17 Q9 12 14 13 L19 16 Q20 22 16 26 L10 27 Z', c.l);
    h += det('M39 17 Q39 12 34 13 L29 16 Q28 22 32 26 L38 27 Z', c.d);
    h += ln('M15 34 L24 32 L33 34', c.d, 1.1, '.65');
    if (style === 'scale') {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        h += det(`M${17 + i * 6} ${20 + j * 5} l3 2 l-3 2 l-3 -2 Z`, c.d, '.5');
      }
    } else if (style === 'glow') {
      h += ci(19, 22, 1.3, c.l) + ci(29, 25, 1.5, c.l) + ci(24, 31, 1.1, c.l);
      h += ci(19, 22, 2.6, c.l, ' opacity=".3"') + ci(29, 25, 3, c.l, ' opacity=".25"');
    } else {
      h += ln('M17 20 L19 22 M27 27 L29 29', c.d, 1.2, '.8');
    }
    s += f === 1 ? h : gp(`translate(24 26) scale(${f}) translate(-24 -26)`, h);
    return s;
  };

  /* 毛皮 */
  SH.pelt = function (c) {
    let s = sh(24, 42, 13, 2.5);
    s += sil('M10 14 L16 10 L21 14 L26 10 L31 14 L36 10 L38 20 Q38 32 34 39 Q28 36 24 39 Q20 36 14 39 Q10 32 10 20 Z', c.m);
    s += det('M10 14 L16 10 L21 14 Q20 22 14 26 Q10 21 10 14 Z', c.l);
    s += det('M38 18 Q38 30 34 39 Q30 37 26 39 Q33 32 33 20 Z', c.d);
    s += ln('M15 22 Q24 26 33 22 M17 30 Q24 33 31 30', c.d, 1.2, '.55');
    s += ln('M14 12 L16 18 M22 12 L23 18 M30 12 L31 18 M36 14 L34 19', c.d, 1, '.4');
    return s;
  };

  /* 羽毛 */
  SH.feather = function (c) {
    let s = sh(24, 42, 8, 2);
    s += rot(-18, 
      sil('M24 7 Q34 17 31 30 Q24 27 17 30 Q14 17 24 7 Z', c.l) +
      det('M24 7 Q34 17 31 30 Q24 27 24 8 Z', c.m) +
      ln('M24 8 L23 42', c.d, 1.8) +
      ln('M24 14 L29 17 M23.6 19 L30 22 M23.4 24 L29.6 27', c.d, 0.9, '.45') +
      ln('M23.6 14 L19 17 M23.4 19 L18 22 M23.2 24 L18.6 27', c.d, 0.9, '.35'));
    return s;
  };

  /* 锭 */
  SH.ingot = function (c) {
    let s = sh(24, 40, 13, 2.4);
    s += sil('M9 22 L24 14 L39 22 L24 31 Z', c.l);
    s += sil('M9 22 V28 L24 37 V31 Z', c.m);
    s += sil('M39 22 V28 L24 37 V31 Z', c.d);
    s += det('M13 22.4 L24 17 L27 18.6 L16 24.4 Z', '#fff', '.3');
    s += ln('M9 22 L24 31 L39 22', OUT, 1.2);
    s += ln('M14 41 L24 37 L34 41', c.d, 1.1, '.45');
    return s;
  };

  /* 锭堆（钢铁） */
  SH.ingotStack = function (c) {
    let s = sh(24, 41, 14, 2.4);
    const one = (cx, cy, f) => gp(`translate(${cx} ${cy}) scale(${f}) translate(-24 -24)`,
      sil('M11 24 L24 17 L37 24 L24 32 Z', c.l) +
      sil('M11 24 V28 L24 36 V32 Z', c.m) +
      sil('M37 24 V28 L24 36 V32 Z', c.d) +
      det('M15 24 L24 19.4 L26 20.6 L17 25.2 Z', '#fff', '.3'));
    s += one(17, 34, 0.72) + one(31, 34, 0.72) + one(24, 26.5, 0.8);
    return s;
  };

  /* 木板 */
  SH.planks = function (c) {
    let s = sh(24, 40, 14, 2.4);
    const board = (y, skew) => gp(`skewX(${skew})`,
      rcl(8, y, 32, 7.4, 1.2, c.m, 1.4) +
      ln(`M12 ${y + 2.4} Q22 ${y + 4} 36 ${y + 2}`, c.d, 1, '.5') +
      ln(`M12 ${y + 5.2} Q22 ${y + 6} 36 ${y + 4.6}`, c.d, 1, '.3'));
    s += rot(-6, board(24, 0) + board(31.5, 0) + board(17, 0));
    return s;
  };

  /* 棉花 */
  SH.cotton = function (c) {
    let s = sh(24, 42, 11, 2.4);
    s += ln('M24 39 V28', PAL.bark.m, 1.8);
    s += el(24, 24, 13, 12, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += ci(18, 21, 6.4, c.l) + ci(29, 20, 5.6, c.l) + ci(24, 28, 6, c.l);
    s += ln('M13 27 Q24 33 35 26', c.m, 1.4, '.7');
    s += det('M14 34 L24 30 L34 34 L24 38 Z', PAL.bark.m);
    return s;
  };

  /* 布料（折叠） */
  SH.cloth = function (c) {
    let s = sh(24, 41, 13, 2.4);
    s += sil('M9 18 L36 14 Q40 14 40 18 V32 Q40 35 36 34 L10 38 Q7 38 7 34 V21 Q7 18 9 18 Z', c.m);
    s += det('M9 18 L36 14 Q34 20 32 24 L11 28 Q8 24 9 18 Z', c.l);
    s += det('M7 31 L11 28 L32 24 L39 21 V32 Q39 35 36 34 L10 38 Q7 38 7 34 Z', c.d, '.55');
    s += ln('M32 24 L34 35 M12 27 L13 38', c.d, 1.2, '.6');
    s += ln('M9 18 L36 14', '#fff', 1.2, '.2');
    return s;
  };

  /* 羊毛线团 */
  SH.yarn = function (c) {
    let s = sh(24, 41, 11, 2.4);
    s += ci(24, 25, 14, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M14 18 Q20 14 29 15 Q22 20 13 25 Z', c.l);
    s += ln('M13 22 Q20 30 35 27 M15 29 Q24 34 34 30 M18 17 Q28 22 32 20', c.d, 1.2, '.55');
    s += ln('M36 33 Q40 37 34 40', c.m, 1.8);
    return s;
  };

  /* 纸张 */
  SH.paper = function (c) {
    let s = sh(24, 41, 13, 2.4);
    s += rcl(9, 16, 28, 22, 1.6, c.d, 1.4);
    s += rcl(11, 13, 28, 22, 1.6, c.m, 1.4);
    s += sil('M13 11 H36 L39 14 V34 H13 Z', c.l, 1.4);
    s += det('M36 11 L39 14 H36 Z', c.d);
    s += ln('M17 18 H34 M17 22 H34 M17 26 H29', c.d, 1.1, '.55');
    return s;
  };

  /* 水泥袋（牛皮纸袋） */
  SH.sack = function (c) {
    let s = sh(24, 42, 12, 2.4);
    /* 袋身：上窄下宽，底部圆角 */
    s += sil('M14 17 L34 17 L38 34 Q38.6 40.4 24 40.4 Q9.4 40.4 10 34 Z', c.m);
    /* 折口：上缘双层翻折 */
    s += sil('M14 17 L19 11.6 H29 L34 17 L24 19.4 Z', c.l);
    s += det('M24 19.4 L34 17 L38 20 L26 22.6 Z', c.d, '.5');
    s += ln('M14 17 L34 17', c.d, 1.2, '.6');
    /* 侧面折痕 */
    s += ln('M17.4 18.6 L16 39 M30.6 18.6 L32 39', c.d, 1, '.42');
    s += hl('M14.6 20 L13.4 36.4 L16.6 36.8 L17.4 19.6 Z', '.16');
    /* 印刷标签 */
    s += rcl(18.6, 24.2, 10.8, 8.4, 1.6, PAL.paper.m, 1.2);
    s += ln('M20.6 27.4 H27.4 M20.6 30 H25.4', c.d, 1, '.8');
    s += det('M20.6 22.4 H27.2 V23.6 H20.6 Z', c.d, '.55');
    return s;
  };

  /* 混凝土板 */
  SH.slab = function (c) {
    let s = sh(24, 40, 14, 2.4);
    s += sil('M7 24 L24 16 L41 24 L24 33 Z', c.l);
    s += sil('M7 24 V31 L24 40 V33 Z', c.m);
    s += sil('M41 24 V31 L24 40 V33 Z', c.d);
    s += ci(15, 23, 1.1, c.d) + ci(31, 22, 1, c.d) + ci(24, 27, 1.2, c.d);
    s += ln('M11 28 L24 34 L37 28', OUT, 1, '.35');
    return s;
  };

  /* 玻璃 */
  SH.glass = function (c) {
    let s = sh(24, 41, 12, 2.4);
    s += sil('M12 12 L34 8 L38 34 L16 38 Z', c.m);
    s += det('M12 12 L34 8 L35 17 L13 21 Z', c.l);
    s += ln('M16 20 L34 17 M17 26 L35 23 M18 32 L36 29', '#fff', 1.4, '.28');
    s += ln('M11 14 L16 38', '#fff', 1.6, '.2');
    s += det('M14 16 L19 15 L17 26 L13 27 Z', '#fff', '.12');
    return s;
  };

  /* 齿轮（机械零件 / 精密零件） */
  SH.gear = function (c, r, style) {
    const precise = style === 'precise';
    let s = sh(24, 41, 12, 2.4);
    s += sil(cogPath(24, 24, 17, 12.4, precise ? 10 : 8), c.m);
    s += ln('M12.6 17.4 A13 13 0 0 1 20.4 11.6', c.l, 2.4, '.75');
    s += ci(24, 24, 7, c.d, ` stroke="${OUT}" stroke-width="1.4"`);
    s += ci(24, 24, 3.6, '#131a21');
    if (precise) {
      s += ci(24, 24, 10.2, 'none', ` stroke="${c.l}" stroke-width="1.2" opacity=".8"`);
      s += ln('M24 17 V20 M24 28 V31 M17 24 H20 M28 24 H31', c.l, 1.2, '.8');
    }
    s += hl('M14 18 A12 12 0 0 1 22 12.4 L21 15.4 A9 9 0 0 0 16 19.6 Z', '.18');
    return s;
  };

  /* 电路板 */
  SH.pcb = function (c) {
    let s = sh(24, 41, 13, 2.4);
    s += rcl(8, 14, 32, 20, 2, c.m, 1.5);
    s += ln('M12 20 H18 V27 H26 M12 28 H16 V24 M30 18 H36 V25 H30 V31 M26 30 H36', c.d, 1.4, '.9');
    s += ci(12, 20, 1.5, PAL.gold.m) + ci(18, 27, 1.5, PAL.gold.m) + ci(30, 25, 1.5, PAL.gold.m);
    s += rcl(19, 20, 10, 8, 1, PAL.chip.m, 1.2);
    s += ci(22, 23, 1.1, c.l);
    s += ci(10, 17, 1.1, c.d) + ci(38, 17, 1.1, c.d) + ci(10, 32, 1.1, c.d) + ci(38, 32, 1.1, c.d);
    return s;
  };

  /* 油桶 */
  SH.jerrycan = function (c) {
    let s = sh(24, 42, 11, 2.4);
    s += sil('M14 14 H31 Q36 14 36 19 V36 Q36 40 31 40 H14 Z', c.m);
    s += det('M14 14 H20 V40 H14 Z', c.l);
    s += det('M32 16 H36 V38 H30 Z', c.d, '.5');
    s += rcl(17, 9, 8, 5, 1.4, c.d, 1.3);
    s += ln('M22 9 V14', c.d, 1.6);
    s += ln('M18 27 L29 21 M18 21 L29 27', c.l, 1.8, '.55');
    s += ln('M14 34 H36', c.d, 1.2, '.5');
    return s;
  };

  /* 塑料颗粒 */
  SH.pellets = function (c) {
    let s = sh(24, 42, 12, 2.4);
    s += el(17, 31, 7, 5.6, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += el(31, 30, 6.4, 5.2, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += el(24, 22, 8, 6.2, c.l, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M18 20 Q22 18 28 18 Q24 21 19 23 Z', '#fff', '.35');
    s += el(14, 30, 2, 1.2, c.d) + el(28, 29, 1.6, 1, c.d);
    return s;
  };

  /* 硅片 */
  SH.wafer = function (c) {
    let s = sh(24, 41, 12, 2.4);
    s += ci(24, 24, 15, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M24 9 A15 15 0 0 1 39 24 L24 24 Z', c.l, '.55');
    s += ci(24, 24, 15, 'none', ` stroke="${c.d}" stroke-width="1" opacity=".5"`);
    for (let i = -1; i <= 1; i++) s += ln(`M${18 + i * 6} 12 V36 M12 ${18 + i * 6} H36`, c.d, 0.8, '.35');
    s += ci(24, 39, 2.2, c.d);
    s += ln('M14 17 A13 13 0 0 1 22 11', '#fff', 1.6, '.4');
    return s;
  };

  /* 光纤（线圈） */
  SH.coil = function (c) {
    let s = sh(24, 41, 12, 2.4);
    s += ci(24, 25, 13, 'none', ` stroke="${OUT}" stroke-width="${SW + 1}" opacity=".9"`);
    s += ci(24, 25, 13, 'none', ` stroke="${c.m}" stroke-width="6"`);
    s += ci(24, 25, 13, 'none', ` stroke="${c.l}" stroke-width="1.6" opacity=".7"`);
    s += ln('M14 36 Q20 42 32 37', c.m, 3);
    s += ln('M14 36 Q20 42 32 37', c.l, 1, '.8');
    s += ln('M34 14 Q40 10 36 6', c.m, 3);
    s += ci(36, 5.4, 2, c.l);
    s += ci(20, 20, 1.4, '#fff', ' opacity=".7"');
    return s;
  };

  /* 芯片 */
  SH.chip = function (c) {
    let s = sh(24, 41, 12, 2.4);
    for (let i = 0; i < 4; i++) {
      const o = 13 + i * 6;
      s += ln(`M${o} 16 V11 M${o} 32 V37`, PAL.gold.m, 1.7);
      s += ln(`M16 ${o} H11 M32 ${o} H37`, PAL.gold.m, 1.7);
    }
    s += rcl(14, 14, 20, 20, 2.4, c.m, 1.5);
    s += det('M14 14 H34 V19 H14 Z', c.l, '.5');
    s += rcl(19, 19, 10, 10, 1.2, PAL.aiCore.m, 1);
    s += ci(21.5, 21.5, 1.4, PAL.aiCore.l);
    s += ci(16.6, 16.6, 1.4, c.d);
    return s;
  };

  /* 核燃料棒 */
  SH.rod = function (c) {
    let s = sh(24, 41, 9, 2.4);
    s += rcl(18, 10, 12, 30, 3, c.m);
    s += det('M18 10 H23 V40 H18 Z', c.l);
    s += det('M28 10 H30 V40 H28 Z', c.d, '.6');
    s += rcl(16.6, 7, 14.8, 5, 2.4, PAL.steel.m, 1.3);
    s += rcl(16.6, 36, 14.8, 5, 2.4, PAL.steel.m, 1.3);
    s += ci(24, 25, 6, c.l, ' opacity=".25"');
    s += ln('M24 21 L24 29 M20.4 23 L27.6 27 M27.6 23 L20.4 27', c.d, 1.4, '.85');
    return s;
  };

  /* 布卷（超织物） */
  SH.roll = function (c) {
    let s = sh(24, 39, 14, 2.4);
    s += rot(-10,
      sil('M9 19 H34 A7 7.5 0 0 1 34 34 H9 A7.5 7.5 0 0 1 9 19 Z', c.m) +
      ln('M13 20 Q12 26 13 33 M18 20 Q17 26 18 33 M23 20 Q22 26 23 33 M28 20 Q27 26 28 33', c.d, 1, '.45') +
      el(37, 26.5, 7.5, 7.5, c.l, ` stroke="${OUT}" stroke-width="1.5"`) +
      el(37, 26.5, 3.4, 3.4, c.d) +
      det('M36 20 A7 7 0 0 1 43.5 25', '#fff', '.45'));
    s += det('M30 40 Q34 44 40 42', c.d, '.4');
    return s;
  };

  /* 外星合金碎块 */
  SH.shardCrystal = function (c) {
    let s = sh(24, 41, 12, 2.4);
    s += sil('M17 8 L32 13 L38 30 L26 41 L13 33 L10 18 Z', c.m);
    s += det('M17 8 L32 13 L26 24 L13 18 Z', c.l);
    s += det('M26 24 L38 30 L26 41 Z', c.d);
    s += ln('M26 24 L13 18 M26 24 L17 8 M26 24 L26 41', c.d, 1, '.4');
    s += ci(22, 20, 2, c.l) + ci(31, 26, 1.5, c.l) + ci(20, 30, 1.2, c.l);
    s += ci(22, 20, 3.6, c.l, ' opacity=".22"');
    return s;
  };

  /* 反物质球 */
  SH.orb = function (c) {
    let s = sh(24, 41, 10, 2.4);
    s += ci(24, 24, 13, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M31 15 A13 13 0 0 1 32 33 A17 11 0 0 0 31 15 Z', c.d, '.7');
    s += ci(24, 24, 6.5, c.d);
    s += el(24, 24, 19, 6, 'none', ` stroke="${c.l}" stroke-width="1.7" opacity=".9" transform="rotate(-24 24 24)"`);
    s += el(24, 24, 16, 5, 'none', ` stroke="${c.l}" stroke-width="1" opacity=".45" transform="rotate(32 24 24)"`);
    s += ci(21, 21, 2.2, c.l, ' opacity=".8"');
    s += ci(9, 12, 1.4, c.l) + ci(39, 33, 1.2, c.l) + ci(38, 13, 0.9, c.l);
    return s;
  };

  /* AI 核心 */
  SH.cube = function (c) {
    let s = sh(24, 40, 13, 2.4);
    s += sil('M8 19 L24 10 L40 19 L24 28 Z', c.l);
    s += sil('M8 19 V33 L24 42 V28 Z', c.m);
    s += sil('M40 19 V33 L24 42 V28 Z', c.d);
    s += ln('M13 21.6 V30 M24 25 V39 M35 21.6 V30', c.l, 1.3, '.6');
    s += ci(24, 19.4, 4.4, c.d, ` stroke="${OUT}" stroke-width="1.1"`);
    s += ci(24, 19.4, 2.2, c.l);
    s += ln('M18 27 L24 31 L30 27', c.l, 1.4, '.8');
    s += ci(24, 19.4, 6.6, c.l, ' opacity=".2"');
    return s;
  };

  /* 生命维持单元 */
  SH.canister = function (c) {
    let s = sh(24, 42, 10, 2.4);
    s += rcl(15, 9, 18, 30, 6, c.m);
    s += det('M15 15 H24 V39 H15 Z', c.l, '.65');
    s += det('M30 12 H33 V36 H30 Z', c.d, '.5');
    s += rcl(18, 6, 12, 5, 2, PAL.machine.m, 1.3);
    s += ci(26, 25, 6.4, c.d, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ci(26, 25, 4.6, c.l);
    s += ln('M26 25 L28.4 22.6', c.d, 1.4);
    s += ci(26, 25, 1, c.d);
    s += ci(18.4, 18, 1.3, PAL.energy.m) + ci(18.4, 32, 1.3, PAL.ember.m);
    s += ln('M33 14 Q40 20 38 30', PAL.machine.m, 2.4);
    return s;
  };

  /* 曲速核心 */
  SH.vortex = function (c) {
    let s = sh(24, 41, 10, 2.4);
    s += ci(24, 24, 16, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M24 8 A16 16 0 0 1 24 40 A12 12 0 0 0 24 16 A8 8 0 0 1 24 8 Z', c.d, '.55');
    s += ln('M24 12 A12 12 0 1 1 19 35 A8 8 0 1 0 30 15', c.l, 2.2, '.85');
    s += ln('M24 19 A5.6 5.6 0 1 0 26 29', c.l, 1.4, '.6');
    s += ci(24, 24, 4, '#fff', ' opacity=".9"');
    s += ci(24, 24, 7, '#fff', ' opacity=".22"');
    s += ci(11, 13, 1.3, c.l) + ci(38, 36, 1.1, c.l);
    return s;
  };

  /* 地毯（卷起） */
  SH.rug = function (c) {
    let s = sh(24, 40, 14, 2.4);
    s += rot(-8,
      sil('M8 17 H33 A8 8 0 0 1 33 33 H8 A8 8 0 0 1 8 17 Z', c.m) +
      det('M8 17 H33 V21 H10 Q8 21 8 25 Z', c.l, '.6') +
      ln('M14 18 V32 M22 18 V32 M30 18 V32', c.d, 1.6, '.5') +
      ln('M11 22 H31 M11 28 H31', PAL.gold.m, 1.4, '.75') +
      el(36, 25, 8, 8, c.l, ` stroke="${OUT}" stroke-width="1.5"`) +
      el(36, 25, 4.4, 5.2, c.d) +
      det('M34 18 A8 8 0 0 1 42 23', '#fff', '.4'));
    return s;
  };

  /* ==================== 形状：装备 / 武器 ==================== */
  const st = ` stroke="${OUT}" stroke-width="${SW}"`;

  /* 头盔：soft 皮帽 / plate 铁盔 / tactical 战术盔 / power 动力盔 / abyss 深渊盔 */
  SH.helm = function (c, r, style) {
    const s0 = sh(24, 42, 12, 2.4);
    if (style === 'soft') {
      return s0 +
        /* 圆顶 */
        sil('M11.6 30 Q11.6 13.4 24 13.4 Q36.4 13.4 36.4 30 Z', c.m) +
        det('M11.6 30 Q11.6 13.4 24 13.4 V30 Z', c.l, '.7') +
        ln('M24 13.6 V30', c.d, 1.1, '.35') +
        /* 帽箍 */
        det('M12 26.4 Q24 23.6 36 26.4 V30.2 Q24 27.6 12 30.2 Z', c.d, '.55') +
        /* 窄檐 */
        sil('M9 29.8 Q24 26.6 39 29.8 Q40 31.4 37.6 32.4 Q24 30.2 10.4 32.4 Q8 31.4 9 29.8 Z', c.m) +
        ln('M9 29.8 Q24 26.6 39 29.8', c.d, 1, '.6') +
        rcl(21.4, 25.2, 5.2, 3.6, 1, PAL.brass.m, 1.1);
    }
    if (style === 'plate') {
      return s0 +
        sil('M12 31 Q11 11 24 11 Q37 11 36 31 L33 35 H15 Z', c.m) +
        det('M12 31 Q11 11 24 11 V35 H15 Z', c.l) +
        /* 鼻梁护条 */
        det('M22.4 12 H25.6 V27.4 Q24 28.6 22.4 27.4 Z', c.l) +
        /* 眼缝（窄而暗） */
        det('M14.6 22.4 Q18.2 21.4 20.8 22.6 L20.6 25 Q17.6 23.8 14.8 24.4 Z', '#20242c') +
        det('M27.2 22.6 Q29.8 21.4 33.4 22.4 L33.2 24.4 Q30.4 23.8 27.4 25 Z', '#20242c') +
        /* 铆钉与顶脊 */
        ln('M24 11 V21', c.l, 1.2, '.45') +
        ci(15.4, 30.4, 1.2, c.d) + ci(32.6, 30.4, 1.2, c.d) +
        ci(24, 12.4, 1.4, c.d);
    }
    if (style === 'tactical') {
      return s0 +
        sil('M11 30 Q11 13 24 13 Q37 13 37 30 L34 35 H14 Z', c.m) +
        det('M11 30 Q11 13 24 13 V35 H14 Z', c.l, '.5') +
        rcl(12, 23, 24, 6.4, 1.4, PAL.glass.d, 1.2) +
        ln('M15 26 H21', PAL.glass.l, 1.2, '.8') +
        rcl(21, 8, 6, 6, 1.2, c.d, 1.2) +
        ci(24, 11, 1.6, PAL.ember.m) +
        ln('M30 12 L34 7', c.d, 1.4);
    }
    if (style === 'power') {
      return s0 +
        sil('M10 31 Q10 11 24 11 Q38 11 38 31 L34 36 H14 Z', c.m) +
        det('M10 31 Q10 11 24 11 V36 H14 Z', c.l, '.55') +
        det('M24 4 L28 12 H20 Z', c.d) +
        rcl(13, 22, 22, 6, 3, '#0e1620', 1.2) +
        det('M16 24 H32 V26 H16 Z', PAL.energy.m) +
        ci(32, 24.4, 1.6, PAL.energy.l) +
        ln('M15 32 H19 M29 32 H33', c.d, 1.6) +
        ci(24, 11, 2, c.l);
    }
    /* abyss */
    return s0 +
      sil('M12 32 Q11 12 24 12 Q37 12 36 32 L32 36 H16 Z', c.m) +
      det('M22 26 H26 V38 Q24 39 22 38 Z', c.l) +
      det('M13 24 Q17 22 20 24 L19 28 L14 27 Z', PAL.ember.l) +
      det('M28 24 Q31 22 35 24 L34 27 L29 28 Z', PAL.ember.l) +
      sil('M12 18 Q6 14 7 7 Q13 9 16 15 Z', c.d) +
      sil('M36 18 Q42 14 41 7 Q35 9 32 15 Z', c.d) +
      ln('M24 12 V21', c.l, 1.2, '.5');
  };

  /* 头巾 / 布帽 / 内衬 */
  SH.hood = function (c) {
    return sh(24, 42, 12, 2.4) +
      /* 头顶布面 */
      sil('M10 31 Q10 12.6 24 11.8 Q38 12.6 38 31 Z', c.m) +
      det('M10 31 Q10 12.6 24 11.8 V31 Z', c.l, '.6') +
      /* 额前褶皱 */
      ln('M13 22.6 Q18.4 19.6 23.6 20.4 M24.4 20.4 Q29.6 19.6 35 22.6', c.d, 1.3, '.6') +
      ln('M16 16.4 Q20 13.8 24 13.4', c.l, 1.2, '.7') +
      /* 布箍 */
      sil('M9.6 27.4 Q24 24.4 38.4 27.4 L38.8 32.4 Q24 29.4 9.2 32.4 Z', c.d) +
      ln('M9.8 30 Q24 27 38.6 30', c.l, 1, '.42') +
      /* 侧结与垂布 */
      det('M34.6 26.4 L39.6 24.4 L39 29.6 Z', c.d) +
      sil('M38.2 28.6 Q42 32 39.4 37.4 Q37 32.6 36.4 30 Z', c.m);
  };

  /* 上衣 / 胸甲：soft plate chain vest power */
  SH.torso = function (c, r, style) {
    let s = sh(24, 43, 12, 2.6);
    const body = 'M13 12 L20 9 Q24 13 28 9 L35 12 L38 21 L34 24 V38 Q24 42 14 38 V24 L10 21 Z';
    s += sil(body, c.m);
    s += det('M13 12 L20 9 Q22 13 24 14 V40 Q18 41 14 38 V24 L10 21 Z', c.l, '.75');
    s += det('M35 12 L38 21 L34 24 V38 Q30 40 26 40 V14 Q29 12 28 9 Z', c.d, '.55');
    if (style === 'plate') {
      s += ln('M24 14 V40', c.d, 1.5, '.7');
      s += ln('M16 30 Q24 34 32 30', c.d, 1.3, '.6');
      s += el(24, 22, 5, 4, c.l, ` opacity=".35"`);
      s += ci(17, 17, 1.3, c.d) + ci(31, 17, 1.3, c.d);
    } else if (style === 'chain') {
      for (let y = 17; y < 38; y += 4.4) for (let x = 16 + (y % 8 < 4 ? 0 : 2.2); x < 33; x += 4.4) {
        s += ci(x, y, 1.5, 'none', ` stroke="${c.d}" stroke-width="1" opacity=".7"`);
      }
    } else if (style === 'vest') {
      s += rcl(16, 20, 7, 8, 1, c.d, 1.1);
      s += rcl(25, 20, 7, 8, 1, c.d, 1.1);
      s += ln('M12 26 H17 M31 26 H36', c.d, 1.6, '.8');
      s += det('M20 12 L24 20 L28 12 L24 15 Z', c.d);
    } else if (style === 'power') {
      s += ci(24, 24, 6.4, '#0e1620', ` stroke="${OUT}" stroke-width="1.4"`);
      s += ci(24, 24, 4.2, PAL.energy.m);
      s += ci(24, 24, 2, '#fff', ' opacity=".85"');
      s += ci(35, 19, 1.6, PAL.energy.l) + ci(13, 19, 1.6, PAL.energy.l);
      s += ln('M16 33 H20 M28 33 H32', c.d, 1.6);
      s += det('M11 13 L14 21 L18 12 Z', c.d);
    } else {
      s += ln('M24 14 V39', c.d, 1.2, '.5');
      s += ln('M17 20 L21 22 M31 20 L27 22', c.d, 1.2, '.5');
      s += ln('M18 33 Q24 36 30 33', c.d, 1.1, '.45');
    }
    return s;
  };

  /* 内衬 / 衬衣 */
  SH.shirt = function (c) {
    return sh(24, 43, 12, 2.4) +
      sil('M15 13 L20 10 Q24 15 28 10 L33 13 L40 22 L34 27 L33 39 H15 V27 L8 22 Z', c.m) +
      det('M15 13 L20 10 Q21 14 24 16 V39 H15 V27 L8 22 Z', c.l, '.7') +
      det('M28 10 Q31 11 33 13 L40 22 L34 27 L33 39 H27 V16 Q29 13 28 10 Z', c.d, '.45') +
      ln('M24 17 V39', c.d, 1.1, '.45') +
      ln('M17 19 L20 22 M31 19 L28 22', c.d, 1.1, '.5') +
      ci(24, 21, 1.2, c.d) + ci(24, 27, 1.2, c.d);
  };

  /* 裤子 / 护腿 */
  SH.pants = function (c, r, style) {
    let s = sh(24, 43, 12, 2.6);
    s += sil('M14 10 H34 L36 40 H27 L24 24 L21 40 H12 Z', c.m);
    s += det('M14 10 H24 L24 24 L21 40 H12 Z', c.l, '.55');
    s += det('M28 10 H34 L36 40 H27 L26 26 Z', c.d, '.5');
    s += rcl(12, 8, 24, 6, 1.4, c.d, 1.3);
    if (style === 'plate') {
      s += ln('M14 22 Q19 25 23 23', c.d, 1.8, '.8');
      s += ln('M34 22 Q29 25 25 23', c.d, 1.8, '.8');
      s += ci(18, 31, 1.6, c.d) + ci(30, 31, 1.6, c.d);
      s += det('M17 36 H22 V40 H17 Z', c.d) + det('M26 36 H31 V40 H26 Z', c.d);
    } else if (style === 'power') {
      s += ci(19, 25, 5, '#0e1620', ` stroke="${OUT}" stroke-width="1.2"`);
      s += ci(19, 25, 2.6, PAL.energy.m);
      s += ci(29.5, 25, 4, '#0e1620', ` stroke="${OUT}" stroke-width="1.1"`);
      s += ci(29.5, 25, 2, PAL.energy.m);
      s += ln('M14 33 H21 M27 33 H34', c.d, 1.6);
    } else {
      s += ln('M17 16 Q20 26 16 38 M31 16 Q28 26 32 38', c.d, 1.2, '.5');
      s += ln('M15 35 H21 M27 35 H33', c.d, 1.3, '.5');
    }
    return s;
  };

  /* 靴子 */
  SH.boot = function (c, r, style) {
    const power = style === 'power';
    let s = sh(26, 42, 12, 2.4);
    s += sil('M16 12 H29 V27 Q33 30 36 34 Q39 38 37 40 H15 V12 Z', c.m);
    s += det('M16 12 H21 V39 H15 V12 Z', c.l, '.8');
    s += det('M29 12 V27 Q33 30 36 34 Q38 36 37 40 H30 Z', c.d, '.5');
    s += rcl(14, 36, 24, 5, 2, c === PAL.machine || power ? PAL.chip.m : c.d, 1.3);
    if (power) {
      s += det('M18 20 H27 V25 H18 Z', PAL.energy.m);
      s += ci(22.5, 22.5, 1.6, '#fff', ' opacity=".8"');
      s += ln('M17 29 H28', c.d, 1.4);
    } else if (c === PAL.iron || c === PAL.steel) {
      s += ci(18.5, 18, 1.3, c.d) + ci(18.5, 24, 1.3, c.d);
      s += ln('M20 14 Q26 17 29 24', c.d, 1.2, '.5');
    } else {
      s += ln('M19 16 Q25 19 27 25 M19 22 Q24 24 26 28', c.d, 1.2, '.6');
      s += ln('M17 31 H28', c.d, 1.2, '.5');
    }
    return s;
  };

  /* 袜子 */
  SH.sock = function (c) {
    return sh(25, 42, 9, 2.2) +
      sil('M17 10 H28 V29 Q32 31 31 35 H16 V10 Z', c.m) +
      det('M17 10 H22 V35 H16 V10 Z', c.l, '.8') +
      det('M28 10 V29 Q32 31 31 35 H26 V29 Q27 20 26 10 Z', c.d, '.45') +
      rcl(15.6, 8, 14, 5, 1.4, c.d, 1.3) +
      ln('M18 18 H27 M18 21 H27', c.l, 1.2, '.5') +
      ln('M16 33 H31', c.d, 1.2, '.5');
  };

  /* 盾：round kite riot energy */
  SH.shield = function (c, r, style) {
    if (style === 'energy') {
      return sh(24, 42, 11, 2.4) +
        sil('M24 6 L38 14 V30 L24 42 L10 30 V14 Z', c.m) +
        det('M24 6 L38 14 V30 L24 42 Z', c.l, '.35') +
        det('M24 13 L32 18 V28 L24 35 L16 28 V18 Z', PAL.energy.d) +
        ci(24, 23, 5, PAL.energy.m) +
        ci(24, 23, 2.4, '#fff', ' opacity=".9"') +
        ln('M10 14 L38 30 M38 14 L10 30', PAL.energy.l, 1.1, '.5');
    }
    if (style === 'riot') {
      return sh(24, 43, 11, 2.4) +
        sil('M13 8 H35 Q37 8 37 11 V38 Q37 41 34 41 H14 Q11 41 11 38 V11 Q11 8 13 8 Z', c.m) +
        det('M13 8 H20 V41 H14 Q11 41 11 38 V11 Q11 8 13 8 Z', c.l, '.6') +
        rcl(17, 12, 14, 5, 1.2, '#0e1620', 1.2) +
        ln('M17 24 V38 M21 20 V40 M31 20 V40 M35 24 V38', PAL.machine.d, 1.4, '.7') +
        ci(15, 14, 1.2, c.d) + ci(33, 14, 1.2, c.d) + ci(15, 38, 1.2, c.d) + ci(33, 38, 1.2, c.d);
    }
    if (style === 'kite') {
      return sh(24, 42, 12, 2.4) +
        sil('M24 6 Q37 10 37 20 V27 Q37 36 24 43 Q11 36 11 27 V20 Q11 10 24 6 Z', c.m) +
        det('M24 6 Q37 10 37 20 V27 Q37 36 24 43 Q24 24 24 6 Z', c.l, '.3') +
        det('M24 12 Q32 15 32 22 V27 Q32 33 24 38 Q16 33 16 27 V22 Q16 15 24 12 Z', 'none', 0) +
        ln('M24 6 V43', c.d, 1.4, '.55') +
        ci(24, 23, 4.4, c.d, ` stroke="${OUT}" stroke-width="1.2"`) +
        ci(24, 23, 2, c.l) +
        ln('M14 15 Q18 12 22 12 M34 15 Q30 12 26 12', c.l, 1.2, '.6');
    }
    return sh(24, 42, 12, 2.4) +
      ci(24, 25, 16, c.m, ` stroke="${OUT}" stroke-width="${SW}"`) +
      ci(24, 25, 16, 'none', ` stroke="${c.d}" stroke-width="2.4" opacity=".55"`) +
      ln('M15 13 V37 M20 9 V41 M28 9 V41 M33 13 V37', c.d, 1.2, '.5') +
      ci(24, 25, 6, c.d, ` stroke="${OUT}" stroke-width="1.2"`) +
      ci(24, 25, 2.6, c.l) +
      det('M10 18 A16 16 0 0 1 22 9.2 L20 13 A12 12 0 0 0 13.4 19 Z', '#fff', '.18');
  };

  /* 项链 / 护符 */
  SH.necklace = function (c, r, accKey) {
    const a = pc(accKey);
    let s = sh(24, 41, 9, 2.2);
    s += ln('M11 13 Q12 27 24 31 Q36 27 37 13', c.m, 2.2);
    s += ln('M11 13 Q12 27 24 31 Q36 27 37 13', '#fff', 0.7, '.25');
    if (a) {
      s += rcl(19, 29, 10, 10, 2, a.m, 1.3);
      s += ci(24, 34, 3.4, PAL.aiCore.l);
      s += ci(24, 34, 1.6, '#fff', ' opacity=".8"');
      s += ln('M20 31.6 H28', a.d, 1.1);
    } else {
      s += sil('M24 30 L29 35 L24 41 L19 35 Z', c.d);
      s += det('M24 31.4 L27 35 L24 38.6 Z', c.l);
    }
    return s;
  };

  SH.amulet = function (c, r, accKey) {
    const a = pc(accKey) || PAL.gold;
    let s = sh(24, 41, 9, 2.2);
    s += ln('M10 12 Q12 26 24 30 Q36 26 38 12', c.m, 2.4);
    s += sil('M24 28 L34 32 V40 L24 44 L14 40 V32 Z', c.m);
    s += det('M24 28 L34 32 V40 L24 44 Z', c.l, '.3');
    s += ci(24, 36, 4.2, a.m, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ln('M22 36 H26 M24 34 V38', a.d, 1.2);
    s += ln('M15 12 Q17 22 24 26', '#fff', 0.8, '.3');
    return s;
  };

  /* 腰带 */
  SH.belt = function (c, r, style) {
    let s = sh(24, 40, 13, 2.2);
    s += sil('M6 22 H42 V32 H6 Z', c.m);
    s += det('M6 22 H42 V25 H6 Z', c.l, '.6');
    s += ln('M6 29 H42', c.d, 1.2, '.5');
    if (style === 'shield') {
      s += sil('M24 15 L33 19 V27 L24 33 L15 27 V19 Z', PAL.steel.m);
      s += ci(24, 23, 4, PAL.energy.m) + ci(24, 23, 1.8, '#fff', ' opacity=".85"');
    } else {
      s += rcl(18, 17, 12, 14, 2, PAL.steel.m, 1.4);
      s += rcl(21, 21, 6, 7, 1, '#1a2028', 1.2);
      s += ci(33, 27, 1.4, c.d) + ci(37, 27, 1.4, c.d);
    }
    return s;
  };

  /* ---- 武器 ---- */
  /* 剑：参数 len 拉伸长度，style 为 energy / abyss 时刀刃发光 */
  SH.sword = function (c, r, lenKey, style) {
    const L = Number(lenKey) || 1;
    const glow = style === 'energy' || style === 'abyss';
    let g = '';
    g += sil('M24 5 L27.6 11 V25 L24 29.4 L20.4 25 V11 Z', c.m);
    g += det('M24 5 L20.4 11 V25 L24 29.4 Z', c.l, '.75');
    g += ln('M24 8 V26', c.d, 1.1, '.6');
    if (glow) {
      g += det('M24 6.4 L25.6 11 V25 L24 27.6 Z', c.l, '.9');
      g += det('M24 5 L27.6 11 V25 L24 29.4 L20.4 25 V11 Z', c.l, '.25');
    }
    g += rcl(14.5, 25.4, 19, 3.6, 1.6, PAL.steel.m, 1.4);       // 护手
    g += ci(24, 27.2, 1.6, PAL.steel.l);
    g += rcl(22, 29, 4, 9, 1.2, PAL.leatherM.m, 1.3);            // 握柄
    g += ln('M22 31.4 H26 M22 34.4 H26', PAL.leatherM.d, 1, '.7');
    g += ci(24, 39.4, 2.4, PAL.steel.l, ` stroke="${OUT}" stroke-width="1.2"`);
    return sh(24, 40, 12, 2.2) + rot(-38, gp(`translate(24 24) scale(1 ${L}) translate(-24 -24)`, g));
  };

  /* 匕首 / 刺刀 / 战术刀 */
  SH.dagger = function (c, r, gripKey, style) {
    const grip = pc(gripKey) || PAL.leatherM;
    const len = style === 'long' ? 23 : style === 'bayonet' ? 21 : 18;
    const tip = 26 - len;
    let g = '';
    g += sil(`M24 ${tip} Q28.9 ${tip + 8} 28.2 25.6 H19.8 Q19.1 ${tip + 8} 24 ${tip} Z`, c.m);
    g += det(`M24 ${tip} Q20.6 ${tip + 8} 20.3 25.2 H24 Z`, c.l, '.8');
    g += ln(`M24 ${tip + 3.4} V24`, c.d, 1.1, '.55');
    g += rcl(15.4, 25.4, 17.2, 3.4, 1.4, PAL.steel.m, 1.3);
    g += ci(24, 27.2, 1.5, PAL.steel.l);
    g += rcl(22.1, 29, 3.8, 8.2, 1.2, grip.m, 1.3);
    g += ln('M22.1 31.6 H25.9 M22.1 34.4 H25.9', grip.d, 1, '.7');
    g += ci(24, 38.8, 2.2, PAL.steel.l, ` stroke="${OUT}" stroke-width="1.1"`);
    if (style === 'bayonet') g += ci(16, 27.2, 2.8, 'none', ` stroke="${PAL.steel.l}" stroke-width="1.7"`);
    return sh(24, 40, 9, 2.2) + rot(-38, g);
  };

  /* 军刀：弯刃 */
  SH.saber = function (c) {
    let g = '';
    g += sil('M24 6 Q33 16 30 27 L25 25 Q27 15 24 6 Z', c.m);
    g += det('M24 6 Q29 15 28 25 L25 25 Q27 15 24 6 Z', c.l, '.7');
    g += ln('M25.6 9 Q29 17 27.6 25', c.d, 1, '.5');
    g += rcl(16, 25, 16, 3.4, 1.6, PAL.steel.m, 1.3);
    g += rcl(22, 28, 4, 9, 1.2, PAL.leatherH.m, 1.3);
    g += ci(24, 38.4, 2.2, PAL.steel.l, ` stroke="${OUT}" stroke-width="1.1"`);
    return sh(24, 40, 10, 2.2) + rot(-32, g);
  };

  /* 斧：轴 + 单/双刃头 */
  SH.axe = function (c, r, woodKey, style) {
    const w = pc(woodKey) || PAL.wood;
    let g = rcl(22.7, 9, 3.6, 33, 1.4, w.m, 1.4);
    g += ln('M23.4 14 H25.6 M23.4 30 H25.6', w.d, 1, '.5');
    if (style === 'double') {
      g += sil('M23 10.5 Q13.4 9 9 15.6 Q6.6 20 9 24.4 Q13.4 31 23 29.5 Z', c.d);
      g += det('M12.4 12.4 Q9 15.6 9 20 Q9 24.4 12.4 27.6 Q10.4 22 12.4 16 Z', c.m, '.75');
    }
    g += sil('M25 10.5 Q34.6 9 39 15.6 Q41.4 20 39 24.4 Q34.6 31 25 29.5 Z', c.m);
    g += det('M35.6 12.4 Q39 15.6 39 20 Q39 24.4 35.6 27.6 Q37.6 22 35.6 16 Z', c.l);
    g += ln('M25.6 13.4 Q32 12.8 36.4 16.6 M25.6 26.6 Q32 27.2 36.4 23.4', c.d, 1, '.55');
    g += rcl(21.6, 9.6, 5.8, 4.2, 1.2, c.d, 1.3);
    return sh(24, 41, 11, 2.2) + rot(-14, g);
  };

  /* 刀：刺刀 / 战术刀 / 长刀 */
  SH.knife = function (c, r, style) {
    return SH.dagger(c, r, style === 'bayonet' ? 'army' : 'chip', style);
  };

  /* 矛：杆 + 叶形枪头 */
  SH.spear = function (c, r, woodKey, style) {
    const w = pc(woodKey) || PAL.wood;
    let g = '';
    g += rcl(22.4, 16, 3.2, 27, 1.4, w.m, 1.4);
    g += sil('M24 6 L28.4 15 L24 21 L19.6 15 Z', c.m);
    g += det('M24 6 L19.6 15 L24 21 Z', c.l, '.7');
    g += rcl(20.8, 13.4, 6.4, 2.6, 1, PAL.steel.d, 1.2);
    g += ln('M24 9 V15', c.d, 1, '.5');
    if (style === 'energy') {
      g += det('M24 7 L26 15 L24 19 L22 15 Z', PAL.energy.m, '.9');
      g += ln('M22.6 8.6 L25.4 8.6', '#fff', 1.2, '.8');
      g += ci(24, 17, 6, PAL.energy.l, ' opacity=".18"');
    }
    return sh(24, 42, 10, 2.2) + rot(-34, g);
  };

  /* 弓 / 短弓 / 长弓 */
  SH.bow = function (c, r, lens) {
    const f = Number(lens) || 1;
    let g = '';
    g += ln('M30 5 Q16 24 30 43', c.m, 3.4);
    g += ln('M30 5 Q16 24 30 43', c.l, 1.2, '.55');
    g += ln('M30 5 L27.4 24 L30 43', '#e8dfc8', 1.1, '.9');
    g += ln('M27.4 24 H40', '#d9c9a5', 1.6);
    g += det('M40 24 L35 21 L35 27 Z', PAL.steel.m);
    g += det('M27.4 24 L31 21 L31 27 Z', PAL.steel.d);
    g += ci(22.6, 24, 1.8, c.d);
    return sh(24, 41, 9, 2.2) + gp(`translate(24 24) scale(${f}) translate(-24 -24)`, g);
  };

  /* 弩 */
  SH.crossbow = function (c, r, metalKey) {
    const m = pc(metalKey) || PAL.iron;
    let g = '';
    /* 弩臂（前端竖弓） */
    g += ln('M20.6 6 Q10.4 24 20.6 42', OUT, 6.6);
    g += ln('M20.6 6 Q10.4 24 20.6 42', m.m, 4.4);
    g += ln('M20.6 9 Q13.6 24 20.6 39', m.l, 1.1, '.45');
    /* 弓弦 + 弦挡 */
    g += ln('M20.6 7.4 V40.6', '#eae0c6', 1.1, '.95');
    g += ln('M20.6 24 L25.4 21.2 M20.6 24 L25.4 26.8', '#eae0c6', 1.1, '.95');
    /* 弩身 */
    g += rcl(20.4, 21.6, 18.6, 4.8, 1.6, c.m, 1.5);
    g += det('M37 19.8 H42.6 V28.2 H37 Z', c.d);
    g += det('M30.4 26.2 H34.6 L33.2 34.4 H29.2 Z', c.d, '.85');
    g += ln('M22 24.2 H36', c.l, 1, '.4');
    /* 弩箭（朝前） */
    g += ln('M25.4 24 H9.6', PAL.steel.l, 1.7);
    g += det('M6.6 24 L12 20.8 L12 27.2 Z', PAL.steel.l);
    g += ln('M25 24 L28.6 21.6 L28.6 26.4 Z', PAL.steel.d, 1);
    /* 机括 + 扳机 */
    g += ci(27.6, 24, 2, m.d, ` stroke="${OUT}" stroke-width="1.1"`);
    g += ln('M29.6 28 Q28 30.4 27.2 31.6', m.d, 1.6);
    return sh(24, 40, 12, 2.4) + g;
  };

  /* 锤 / 巨锤 / 重力锤 */
  SH.hammer = function (c, r, woodKey, style) {
    const w = pc(woodKey) || PAL.wood;
    let g = rcl(22.6, 18, 3.4, 25, 1.4, w.m, 1.4);
    g += rcl(12, 8, 24, 12, 2.4, c.m, 1.6);
    g += det('M12 8 H36 V12 H12 Z', c.l, '.55');
    g += det('M12 16 H36 V20 H12 Z', c.d, '.45');
    g += ln('M16 11 V17 M24 11 V17 M32 11 V17', c.d, 1.1, '.6');
    g += rcl(20.6, 19.4, 7.8, 3.4, 1.2, c.d, 1.2);
    if (style === 'energy') {
      g += det('M14 10 H34 V13 H14 Z', PAL.energy.m, '.85');
      g += ci(24, 14, 3, PAL.energy.l);
      g += ci(24, 14, 7, PAL.energy.l, ' opacity=".18"');
    }
    return sh(24, 41, 12, 2.4) + rot(-8, g);
  };

  /* 工兵铲 */
  SH.shovel = function (c, r, woodKey) {
    const w = pc(woodKey) || PAL.wood;
    let g = '';
    g += rcl(22.6, 8, 3.4, 24, 1.4, w.m, 1.4);
    g += rcl(18, 5.6, 12, 3.4, 1.6, w.m, 1.3);
    g += sil('M24 30 L33 34 V40 Q24 45 15 40 V34 Z', c.m);
    g += det('M24 30 L24 43.6 Q18 42 15 39 V34 Z', c.l, '.5');
    g += ln('M24 31 V41', c.d, 1.1, '.5');
    g += rcl(21.4, 29, 5.2, 3, 1, PAL.steel.d, 1.2);
    return sh(24, 41, 10, 2.2) + rot(-12, g);
  };

  /* 手枪 */
  SH.pistol = function (c) {
    let g = '';
    g += rcl(14, 15, 24, 6, 1.6, PAL.machine.m, 1.5);
    g += det('M14 15 H38 V18 H14 Z', PAL.machine.l, '.7');
    g += sil('M17 21 H30 L27 33 L13 33 Z', c.m);
    g += det('M17 21 H22 L19 33 H13 Z', c.l, '.55');
    g += ln('M20 24 H27', c.d, 1.2, '.6');
    g += ln('M18 21 Q17 27 18.6 30', PAL.machine.d, 1.8);
    g += ci(37, 18, 1.8, '#0e1620');
    g += rcl(20, 11.6, 4, 3.4, 1, PAL.machine.d, 1.1);
    g += ln('M30 21 V23', PAL.machine.d, 1.6);
    return sh(24, 40, 12, 2.2) + rot(-8, g);
  };

  /* 霰弹枪 */
  SH.shotgun = function (c, r, metalKey) {
    const m = pc(metalKey) || PAL.steel;
    let g = '';
    g += sil('M8 26 L18 24 V32 L10 34 Z', c.m);                 // 木托
    g += rcl(18, 22, 26, 5, 1.4, m.m, 1.5);                     // 枪管
    g += det('M18 22 H44 V24.4 H18 Z', m.l, '.7');
    g += rcl(20, 26.8, 14, 4.4, 1.4, c.m, 1.3);                 // 前护木
    g += sil('M22 31 H30 L28 38 L20 38 Z', c.d);
    g += ci(43, 24.4, 2, '#0e1620');
    g += ln('M26 23 V26', m.d, 1.1, '.7');
    return sh(24, 40, 13, 2.2) + rot(-8, g);
  };

  /* 步枪：carbine 卡宾 / sniper 狙击 / cannon 粒子炮 / 默认栓动 */
  SH.rifle = function (c, r, metalKey, variant) {
    const m = pc(metalKey) || PAL.steel;
    let g = '';
    if (variant === 'cannon') {
      g += rcl(13, 17, 26, 8, 2.6, c.m, 1.6);
      g += det('M13 17 H39 V20 H13 Z', c.l, '.6');
      g += ci(41, 21, 4.6, c.d, ` stroke="${OUT}" stroke-width="1.4"`);
      g += ci(41, 21, 2.6, PAL.energy.m);
      g += ci(41, 21, 5.6, PAL.energy.l, ' opacity=".25"');
      g += sil('M16 25 H26 L23 37 L13 37 Z', c.d);
      g += ci(20, 16, 3.4, PAL.energy.d) + ci(20, 16, 1.6, '#fff', ' opacity=".7"');
      g += ln('M30 18 V22 M35 18 V22', c.l, 1.2, '.6');
      return sh(24, 41, 13, 2.2) + rot(-8, g);
    }
    g += sil('M7 25 L15 22 V32 L9 35 Z', PAL.wood.d);           // 枪托
    g += rcl(14, 19.6, 24, 6, 1.4, c.m, 1.5);                   // 机匣
    g += rcl(34, 20.6, 11, 3.4, 1.2, m.m, 1.4);                 // 枪管
    g += det('M14 19.6 H38 V22 H14 Z', c.l, '.55');
    g += sil('M17 25 H25 L23 34 L14 34 Z', PAL.wood.m);         // 握把
    g += rcl(26, 25.6, 5, 7, 1, m.d, 1.2);                      // 弹匣
    g += ln('M16 23 Q14 28 15.4 31', m.d, 1.6);
    if (variant === 'sniper') {
      g += rcl(20, 13.6, 13, 4.4, 1.6, PAL.chip.m, 1.3);        // 瞄准镜
      g += ci(36, 15.4, 2, PAL.glass.m);
      g += ln('M24 18 V19.6', PAL.chip.d, 1.4);
      g += ln('M33 24 L39 30 M34 22 L41 26', m.d, 1.2, '.7');   // 脚架
    } else if (variant === 'carbine') {
      g += ln('M22 19.6 H30', m.d, 1.4, '.7');
      g += rcl(30, 24.4, 6, 2.6, 1, m.d, 1.1);
    } else {
      g += ln('M18 25 Q16 29 17 31', m.d, 1.4);
      g += ci(28, 22, 1.2, m.d);
    }
    g += ci(44.4, 22.2, 1.6, '#0e1620');
    return sh(24, 40, 13, 2.2) + rot(-8, g);
  };

  /* ==================== 形状：书 / 食物 / 抽卡 ==================== */
  const INK = '#f5e7c4';
  const GLY = {
    tree: p => det('M25 16 L31 26 H19 Z', p) + rc(24, 25, 2.4, 5, 0, p),
    pick: p => ln('M20 29 L29 19', p, 2) + ln('M21 22 Q25 17 31 19', p, 2.4),
    basket: p => det('M19 22 H31 L29 29.6 H21 Z', p) + ln('M21 22 Q25 16 29 22', p, 1.8),
    sprout: p => ln('M25 30 V22', p, 2) + det('M25 24 Q19 22 18 17 Q25 18 25 24 Z', p) + det('M25 26 Q31 24 32 19 Q25 20 25 26 Z', p),
    bow: p => ln('M21 16 Q29 24 21 32', p, 2.2) + ln('M21 16 L21 32', p, 1.1) + ln('M21 24 H32', p, 1.4),
    bell: p => det('M25 16 Q31 17 31 25 L32.6 28 H17.4 L19 25 Q19 17 25 16 Z', p) + ci(25, 29.6, 1.6, p),
    pot: p => det('M19 21 H31 Q30 30 25 30.6 Q20 30 19 21 Z', p) + rc(18, 18.6, 14, 2.6, 1, p),
    hammer: p => rc(21, 17, 9, 4, 1, p) + rc(23.6, 21, 2.6, 8, 1, p),
    scroll: p => rc(20, 17, 10, 13, 1.4, p) + ln('M22.6 21 H27.4 M22.6 25 H26', '#00000000', 0) ,
    saw: p => det('M18 28 L32 19 L32 23 L18 30 Z', p),
    vase: p => det('M22 19 H28 L30 30 H20 Z', p) + rc(21, 17, 8, 2.4, 1, p),
    cross: p => rc(23, 17, 4, 13, 1.2, p) + rc(18, 21.4, 14, 4, 1.2, p),
    flame: p => det('M25 16 Q32 23 28.6 27.6 Q26 31 22.6 28.6 Q19.6 25.6 22.6 21 Q23.6 18.4 25 16 Z', p),
    anvil: p => det('M18 20 H32 V23.4 H27.6 L29 29.6 H21 L22.4 23.4 H18 Z', p),
    plane: p => rc(18, 21, 14, 5, 1.2, p) + rc(22.6, 24.6, 3.4, 4, 1, p),
    needle: p => ln('M20 30 L30 19', p, 1.8) + ci(29.4, 19.6, 1.5, 'none', ` stroke="${p}" stroke-width="1.2"`),
    scissors: p => ln('M19 30 L30 19 M19 19 L30 30', p, 1.6) + ci(18, 31, 2, 'none', ` stroke="${p}" stroke-width="1.4"`) + ci(18, 18, 2, 'none', ` stroke="${p}" stroke-width="1.4"`),
    alembic: p => ci(25, 25, 5, 'none', ` stroke="${p}" stroke-width="1.8"`) + rc(24, 16.6, 2, 5, 0, p) + ci(25, 25, 1.6, p),
    loom: p => rc(19, 17, 12, 13, 1.2, 'none', ) ,
    bolt: p => det('M27 16 L20 25 H24.6 L22.4 31 L31 21.6 H25.6 Z', p),
    gear: p => det(cogPath(25, 24, 6.6, 4.6, 8), p) + ci(25, 24, 1.6, '#00000000'),
    window: p => det('M19 17 H31 V31 H19 Z', p) + ln('M25 17 V31 M19 24 H31', '#241b13', 1.4),
    bomb: p => ci(24, 25, 5.4, p) + ln('M28 20 Q31 16 28 14', p, 1.6) + ci(28, 13.4, 1.6, '#ffb066'),
    wafer: p => ci(25, 24, 5.6, p) + ci(25, 24, 2.2, '#241b13', ' opacity=".5"'),
    caliper: p => ln('M19 30 L23 17 M31 30 L27 17', p, 1.8) + rc(23.6, 25, 2.8, 3, 1, p),
    atom: p => ci(25, 24, 2.2, p) + el(25, 24, 7, 3, 'none', ` stroke="${p}" stroke-width="1.3" transform="rotate(30 25 24)"`) + el(25, 24, 7, 3, 'none', ` stroke="${p}" stroke-width="1.3" transform="rotate(-30 25 24)"`),
    cube: p => det('M25 16 L32 20 L25 24 L18 20 Z', p) + det('M18 20 V27 L25 31 V24 Z', p) + det('M32 20 V27 L25 31 V24 Z', p),
    vortex: p => ln('M25 17 A7 7 0 1 1 20 28 A5 5 0 1 0 27 20', p, 1.8),
  };
  function glyphOf(name, ink) {
    if (!name) return '';
    if (name === 'scroll') return rc(20, 17, 10, 13, 1.4, ink) + ln('M22.6 21 H27.4 M22.6 25 H26', '#241b13', 1.2);
    if (name === 'loom') return rc(19, 17, 12, 13, 1.2, 'none') + ln('M19 17 H31', ink, 1.6) +
      ln('M22 19 V30 M25 19 V30 M28 19 V30', ink, 1.2) + ln('M19 26.6 H31', ink, 1.4);
    const f = GLY[name];
    return f ? f(ink) : '';
  }

  /* 技能书 */
  SH.book = function (c, r, gname) {
    let s = sh(24, 42, 12, 2.6);
    s += sil('M12 6 Q12 4 14 4 H34 Q37 4 37 7 V39 Q37 42 34 42 H14 Q12 42 12 40 Z', c.m);
    s += det('M12 6 Q12 4 14 4 H17 V42 H14 Q12 42 12 40 Z', c.d, '.6');
    s += sil('M34.4 7.2 H37 V39 H34.4 Z', PAL.paper.m, 1.3);
    s += ln('M35.4 10 V37 M36.2 10 V37', PAL.paper.d, 0.9, '.85');
    s += ln('M14 8.6 V37.6', c.l, 1.2, '.55');
    s += ln('M11 10 Q9.6 24 11 38', '#000', 1, '.22');
    /* 封面内框 + 徽记 */
    s += det('M17.9 11 H34.1 V37 H17.9 Z', c.d, '.38');
    s += ln('M17.9 11 H34.1 V37 H17.9 Z', c.l, 1.1, '.65');
    s += ci(17.9, 11, 1.3, c.l, ' opacity=".85"') + ci(34.1, 11, 1.3, c.l, ' opacity=".85"');
    s += ci(17.9, 37, 1.3, c.l, ' opacity=".85"') + ci(34.1, 37, 1.3, c.l, ' opacity=".85"');
    s += det('M20.4 13.4 H31.6 V34.6 H20.4 Z', c.l, '.12');
    s += glyphOf(gname, '#f7ecd0');
    return s;
  };

  /* 浆果 */
  SH.berry = function (c) {
    let s = sh(24, 42, 11, 2.4);
    s += ln('M24 22 Q25 18 28 16', PAL.bark.m, 1.8);
    s += det('M26 16 Q31 12 36 14 Q32 19 26 16 Z', PAL.herb.m);
    s += det('M22 17 Q17 13 12 15 Q16 20 22 17 Z', PAL.herb.d);
    s += ci(30, 27, 6, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += ci(18, 28, 6.4, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += ci(24, 21, 6.2, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += ci(22, 19, 2.2, '#fff', ' opacity=".35"');
    s += ci(16.4, 26, 1.8, '#fff', ' opacity=".28"');
    s += ci(28.6, 25, 1.6, '#fff', ' opacity=".25"');
    return s;
  };

  /* 块根 */
  SH.root = function (c) {
    let s = sh(24, 42, 12, 2.4);
    s += ln('M24 22 Q22 16 26 12', PAL.herb.m, 2);
    s += det('M26 13 Q31 9 36 11 Q32 16 26 13 Z', PAL.herb.m);
    s += det('M25 14 Q21 9 16 10 Q19 16 25 14 Z', PAL.herb.d);
    s += sil('M13 27 Q13 20 20 20 Q30 19 35 25 Q40 32 31 37 Q19 41 14 34 Z', c.m);
    s += det('M13 27 Q13 20 20 20 Q20 28 17 37 Q14 33 13 27 Z', c.l);
    s += ln('M20 26 Q22 31 20 35 M27 25 Q30 30 28 35', c.d, 1.2, '.55');
    s += ln('M12 36 L8 39 M31 38 L35 41', c.d, 1.4, '.6');
    return s;
  };

  /* 蘑菇 */
  SH.mushroom = function (c) {
    let s = sh(24, 42, 10, 2.4);
    s += rcl(20, 22, 8, 16, 3.4, PAL.bone.m, 1.5);
    s += det('M20 26 H24 V36 Q22 37 20 36 Z', PAL.bone.d, '.5');
    s += sil('M9 23 Q11 10 24 10 Q37 10 39 23 Z', c.m);
    s += det('M9 23 Q11 10 24 10 Q24 16 24 23 Z', c.l);
    s += ci(18, 17, 2.4, '#f6efe0', ` opacity=".85"`);
    s += ci(28, 19.6, 1.8, '#f6efe0', ` opacity=".8"`);
    s += ci(33, 15.6, 1.3, '#f6efe0', ` opacity=".7"`);
    return s;
  };

  /* 坚果 */
  SH.nuts = function (c) {
    let s = sh(24, 42, 11, 2.4);
    s += ci(29, 28, 8, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M24 23 Q31 21 35 27 Q31 22 24 25 Z', c.l, '.55');
    s += det('M22 22 Q32 18 36 24 Q30 21 23 26 Z', PAL.bark.m);
    s += ci(17, 32, 7, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M12 27 Q17 25 21 29 Q17 26 13 29 Z', PAL.bark.m);
    s += ln('M26 34 Q29 36 33 34', c.d, 1.2, '.5');
    return s;
  };

  /* 谷物捆 */
  SH.sheaf = function (c) {
    let s = sh(24, 42, 11, 2.4);
    for (let i = 0; i < 5; i++) {
      const x = 13 + i * 5.4, y = 8 + Math.abs(i - 2) * 3.6;
      s += ln(`M24 38 Q${22 + i} 26 ${x} ${y + 6}`, i % 2 ? c.m : c.d, 1.8);
      s += det(`M${x - 2.4} ${y + 8} Q${x} ${y - 1} ${x + 2.4} ${y + 8} Q${x} ${y + 4} ${x - 2.4} ${y + 8} Z`, c.l);
    }
    s += rcl(18.4, 27, 11.2, 5, 1.2, PAL.leatherM.m, 1.3);
    return s;
  };

  /* 豆荚 */
  SH.pod = function (c) {
    let s = sh(24, 41, 12, 2.4);
    s += rot(-24, sil('M11 24 Q14 15 24 13 Q34 12 37 18 Q36 27 26 29 Q16 31 11 24 Z', c.m));
    s += rot(-24, ci(18, 22, 3.4, c.l, ` stroke="${OUT}" stroke-width="1.2"`) + ci(25, 21, 3.6, c.l, ` stroke="${OUT}" stroke-width="1.2"`) + ci(31, 21.4, 3.2, c.l, ` stroke="${OUT}" stroke-width="1.2"`));
    s += rot(-24, ln('M12 24 Q22 19 36 19', c.d, 1.2, '.6'));
    return s;
  };

  /* 蔬菜（卷心菜） */
  SH.cabbage = function (c) {
    let s = sh(24, 42, 12, 2.4);
    s += ci(24, 26, 14, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M24 12 Q34 15 36 26 Q30 20 24 12 Z', c.l);
    s += det('M24 12 Q14 15 12 26 Q18 20 24 12 Z', c.d, '.4');
    s += ln('M24 12 Q21 22 24 40 M24 20 Q17 24 13 30 M24 20 Q31 24 35 30', c.d, 1.3, '.55');
    s += ci(24, 14, 2.4, PAL.herb.d);
    return s;
  };

  /* 甜菜 */
  SH.beet = function (c) {
    let s = sh(24, 42, 11, 2.4);
    s += ln('M24 24 Q22 16 26 10', PAL.herb.m, 2);
    s += det('M26 12 Q32 7 38 10 Q33 16 26 12 Z', PAL.herb.m);
    s += det('M24 13 Q18 7 12 9 Q17 16 24 13 Z', PAL.herb.d);
    s += sil('M12 26 Q12 18 24 18 Q36 18 36 26 Q36 38 24 40 Q12 38 12 26 Z', c.m);
    s += det('M12 26 Q12 18 24 18 Q23 28 20 40 Q12 37 12 26 Z', c.l, '.75');
    s += ln('M24 19 V39', c.d, 1.2, '.5');
    s += ln('M13 38 L9 42 M34 38 L38 42', c.d, 1.4, '.6');
    return s;
  };

  /* 肉类食材 */
  SH.steak = function (c) {
    let s = sh(24, 42, 13, 2.4);
    s += sil('M10 26 Q10 16 22 15 Q36 14 38 24 Q40 34 28 36 Q14 38 10 26 Z', c.m);
    s += det('M10 26 Q10 16 22 15 Q22 24 18 34 Q12 31 10 26 Z', c.l, '.7');
    s += det('M30 17 Q36 17 38 24 Q38 30 32 34 Q34 24 30 17 Z', c.d, '.4');
    s += ln('M17 24 Q24 22 30 27 M19 30 Q25 28 31 31', PAL.bone.l, 2.2, '.85');
    s += sil('M33 31 Q38 29 40 33 Q41 37 36 38 Q32 38 33 31 Z', PAL.bone.m, 1.3);
    return s;
  };

  /* 籽袋 */
  SH.seedPouch = function (c) {
    let s = sh(24, 42, 10, 2.2);
    s += sil('M15 16 Q24 11 33 16 L35 30 Q34 38 24 38 Q14 38 13 30 Z', PAL.leatherM.m);
    s += det('M15 16 Q24 11 33 16 L33 21 Q24 17 15 21 Z', PAL.leatherM.l);
    s += rcl(16, 13, 16, 4, 1.6, PAL.leatherM.d, 1.2);
    s += ci(20, 26, 2.2, c.m) + ci(28, 28, 2, c.m) + ci(24, 32, 1.8, c.m);
    s += ln('M19 18 H29', PAL.leatherM.d, 1.1, '.6');
    s += ci(19.4, 25.2, 0.8, '#fff', ' opacity=".5"') + ci(27.4, 27.2, 0.7, '#fff', ' opacity=".45"');
    return s;
  };

  /* 餐碗 */
  SH.bowl = function (c) {
    let s = sh(24, 42, 12, 2.4);
    s += el(24, 24, 15, 5.4, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += sil('M9 24 Q10 39 24 39 Q38 39 39 24 Z', PAL.wood.m);
    s += det('M9 24 Q10 39 24 39 Q38 39 39 24 Z', '#000', '.14');
    s += ln('M12 29 Q18 33 24 33 Q30 33 36 29', PAL.wood.d, 1.2, '.5');
    s += el(24, 23.4, 11.4, 3.6, c.l, ` opacity=".85"`);
    s += ci(20, 22.6, 2, c.d) + ci(27, 22.4, 2.2, c.d);
    s += ln('M20 14 Q18 11 20 9 M28 15 Q30 12 28 10', '#fff', 1.4, '.22');
    return s;
  };

  /* 便利贴 */
  SH.note = function (c) {
    let s = sh(24, 41, 12, 2.4);
    s += sil('M11 13 H33 L37 17 V37 H11 Z', c.m);
    s += det('M33 13 L37 17 H33 Z', c.d);
    s += det('M11 13 H33 V17 H11 Z', c.l, '.6');
    s += ln('M15 21 H31 M15 25 H31 M15 29 H25', PAL.noteYellow.d, 1.4, '.85');
    s += ci(24, 10, 2.6, PAL.carpet.m, ` stroke="${OUT}" stroke-width="1.1"`);
    return s;
  };

  /* 周边（玩偶） */
  SH.plush = function (c) {
    let s = sh(24, 42, 11, 2.4);
    s += ci(12, 18, 5, c.m, ` stroke="${OUT}" stroke-width="1.4"`);
    s += ci(36, 18, 5, c.m, ` stroke="${OUT}" stroke-width="1.4"`);
    s += ci(12, 18, 2, c.l) + ci(36, 18, 2, c.l);
    s += ci(24, 27, 13, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += el(24, 31, 6.6, 5, c.l, ' opacity=".8"');
    s += ci(20, 24, 2, '#241b13') + ci(28, 24, 2, '#241b13');
    s += ci(20.6, 23.4, 0.7, '#fff') + ci(28.6, 23.4, 0.7, '#fff');
    s += el(24, 30.4, 2.2, 1.6, c.d);
    s += ln('M24 31.6 Q22.4 33.4 21 32.4 M24 31.6 Q25.6 33.4 27 32.4', c.d, 1.2);
    return s;
  };

  /* 典藏（纪念册） */
  SH.album = function (c) {
    let s = sh(24, 42, 12, 2.6);
    s += sil('M10 10 Q10 6 14 6 H32 Q36 6 36 10 V40 H14 Q10 40 10 36 Z', c.m);
    s += det('M14 6 H32 Q36 6 36 10 V40 H30 Z', c.l, '.2');
    s += rcl(14, 10, 20, 24, 1.6, PAL.paper.m, 1.3);
    s += det('M17 14 H31 V22 H17 Z', PAL.chip.m, '.85');
    s += ln('M17 26 H31 M17 30 H26', PAL.paper.d, 1.2, '.8');
    s += det('M24 8 L25.6 11.4 L29 12.6 L25.6 14 L24 17.4 L22.4 14 L19 12.6 L22.4 11.4 Z', PAL.gold.l);
    s += ln('M10 14 H13 M10 22 H13 M10 30 H13', c.d, 1.2, '.55');
    return s;
  };

  /* 传家宝（宝箱） */
  SH.chest = function (c) {
    let s = sh(24, 43, 13, 2.6);
    s += sil('M8 20 Q8 11 24 11 Q40 11 40 20 V38 H8 Z', c.m);
    s += det('M8 20 Q8 11 24 11 Q40 11 40 20 Z', c.l, '.35');
    s += ln('M8 21 H40', c.d, 2, '.7');
    s += rcl(21.4, 17, 5.2, 10, 1.4, PAL.gold.m, 1.3);
    s += ci(24, 27, 1.8, c.d);
    s += sil('M8 32 H40 V40 H8 Z', c.m, 1.4);
    s += ln('M13 16 V38 M35 16 V38', PAL.gold.d, 1.4, '.7');
    s += ci(13, 26, 1.4, PAL.gold.l) + ci(35, 26, 1.4, PAL.gold.l);
    return s;
  };

  /* 星尘 */
  SH.dust = function (c) {
    let s = sh(24, 42, 11, 2.2);
    s += sil('M9 39 Q12 30 20 28 Q30 27 37 32 Q40 39 24 40 Z', c.m);
    s += det('M9 39 Q12 30 20 28 Q17 33 16 39 Z', c.l, '.7');
    const star = (x, y, r) => `M${x} ${y - r} L${x + r * .36} ${y - r * .36} L${x + r} ${y} L${x + r * .36} ${y + r * .36} L${x} ${y + r} L${x - r * .36} ${y + r * .36} L${x - r} ${y} L${x - r * .36} ${y - r * .36} Z`;
    s += det(star(18, 22, 5), c.l) + det(star(30, 17, 3.6), c.l) + det(star(34, 27, 2.6), c.l);
    s += ci(24, 34, 1.2, '#fff', ' opacity=".8"') + ci(14, 35, 1, '#fff', ' opacity=".7"');
    return s;
  };

  /* 升星药水 */
  SH.bottle = function (c) {
    let s = sh(24, 42, 9, 2.2);
    s += rcl(20, 6, 8, 5, 1.4, PAL.wood.m, 1.3);
    s += sil('M20 11 H28 V16 Q35 20 35 28 Q35 40 24 40 Q13 40 13 28 Q13 20 20 16 Z', c.m);
    s += det('M13 27 Q13 39 24 39 Q35 39 35 27 Q30 33 24 33 Q18 33 13 27 Z', c.l, '.55');
    s += ln('M16 22 Q14 26 14.4 30', '#fff', 1.5, '.35');
    s += det('M24 20 L25.8 24 L30 24.6 L26.8 27.6 L27.6 32 L24 29.6 L20.4 32 L21.2 27.6 L18 24.6 L22.2 24 Z', PAL.gold.l);
    return s;
  };

  /* 灵魂火焰 */
  SH.flame = function (c) {
    let s = sh(24, 42, 9, 2.2);
    s += sil('M24 6 Q34 16 33 26 Q32 36 24 40 Q16 36 15 26 Q14 18 24 6 Z', c.m);
    s += det('M24 14 Q30 21 29.4 27 Q29 34 24 37 Q19 34 18.6 27 Q18 21 24 14 Z', c.l, '.85');
    s += det('M24 22 Q27 26 26.6 29 Q26 33 24 34 Q22 33 21.4 29 Q21 26 24 22 Z', '#fff', '.85');
    s += ci(24, 25, 12, c.l, ' opacity=".16"');
    s += det('M35 12 L36 15 L39 16 L36 17 L35 20 L34 17 L31 16 L34 15 Z', '#fff', '.7');
    return s;
  };

  /* 余火（炭块） */
  SH.emberCoal = function (c) {
    let s = sh(24, 41, 11, 2.2);
    s += sil('M10 30 L14 19 L24 15 L34 19 L38 29 L32 39 L16 39 Z', PAL.coal || PAL.chip.m);
    s += det('M14 19 L24 15 L27 25 L20 32 L10 30 Z', PAL.chip.l);
    s += ln('M15 28 L22 26 L27 30 L34 27', c.m, 1.6, '.95');
    s += ln('M22 26 L24 20 M27 30 L26 36', c.m, 1.4, '.8');
    s += ci(22, 27, 3, c.l, ' opacity=".45"') + ci(28, 28, 2.4, c.l, ' opacity=".35"');
    s += ci(22, 27, 1.4, '#fff', ' opacity=".75"');
    return s;
  };

  /* ==================== 敌人立绘（全部朝左，构图 48×48） ==================== */
  const eye = (x, y, r, col) => {
    r = r || 2.1;
    return ci(x, y, r, col || '#171a1f') + ci(x - r * 0.28, y - r * 0.3, r * 0.38, '#fff', ' opacity=".9"');
  };
  const fang = (x, y, w, h, col) => det(`M${x - w} ${y} L${x} ${y + h} L${x + w} ${y} Z`, col || PAL.bone.l);
  const leg = (x, y, w, h, c, off) => rcl(x, y, w, h, w / 2, off ? c.d : c.m, 1.5);

  /* 兔子 */
  ENEMY_SH.rabbit = function (c) {
    let s = sh(26, 43, 8.5, 2);
    s += sil('M31 31 Q37 30 37.5 35 Q37 39.5 31.5 39.5 Q28 39 27 34.5 Z', c.m);
    s += sil('M19 30 Q27 23 33 27 Q38 33 34 39 Q24 43 18 39 Q15 34 19 30 Z', c.m);
    s += det('M21 33 Q27 30 32 33 Q33 38 26 39.5 Q21 38 21 33 Z', c.l, '.7');
    s += el(15, 19, 2.9, 7.4, c.m, ` stroke="${OUT}" stroke-width="${SW}" transform="rotate(-14 15 19)"`);
    s += el(21, 17.4, 2.6, 7, c.m, ` stroke="${OUT}" stroke-width="${SW}" transform="rotate(10 21 17.4)"`);
    s += det('M14.4 18 Q14 12 15.6 12.6 Q16.4 16 16 21 Z', c.l, '.8');
    s += sil('M11 28 Q8.5 23 12.5 21 Q18 21 21 26 Q19 32 14 32 Z', c.m);
    s += eye(14.4, 26.4, 1.9);
    s += ci(11, 28.6, 1.1, '#8a5a5a');
    s += ln('M11 29.6 Q9.6 30.2 9.4 31.4', OUT, 1);
    s += det('M11.2 26.2 L9 28.4 M11.4 26.6 L8.8 26.6', '#fff', '.6');
    s += ci(37.6, 33, 3, c.l, ` stroke="${OUT}" stroke-width="1.2"`);
    return s;
  };

  /* 松鸡 */
  ENEMY_SH.grouse = function (c) {
    let s = sh(25, 43, 8.5, 2);
    s += ln('M19 36 V43 M26 37 V43', PAL.bark.d, 2);
    s += ln('M19 43 H15 M26 43 H22', PAL.bark.d, 1.6);
    s += sil('M16 25 Q24 18 33 22 Q40 27 37 35 Q30 40 20 37 Q14 32 16 25 Z', c.m);
    s += det('M18 30 Q25 26 33 30 Q34 36 26 37 Q19 35 18 30 Z', c.l, '.6');
    s += sil('M10 22 Q10 15 17 14 Q23 15 23 21 Q21 27 15 27 Q11 26 10 22 Z', c.m);
    s += det('M11 20 Q13 15.4 18 15.6 Q16 20 12 22 Z', c.l);
    s += det('M8 21 L13 18.6 L13 23 Z', PAL.grain.m);
    s += eye(14.6, 19.6, 1.7);
    s += ln('M30 20 Q36 15 42 16 M31 23 Q38 20 43 22 M30 26 Q36 26 41 29', c.d, 2, '.8');
    s += det('M19 27 Q27 24 33 28 Q28 30 20 31 Z', c.d, '.5');
    s += ci(16.6, 14.4, 1.6, PAL.ember.m);
    return s;
  };

  /* 鹿 */
  ENEMY_SH.deer = function (c) {
    let s = sh(25, 43, 9, 2);
    s += leg(14, 32, 3, 11, c, true) + leg(33, 32, 3, 11, c, true);
    s += leg(18, 33, 3.2, 10, c) + leg(29, 33, 3.2, 10, c);
    s += sil('M15 26 Q22 19 33 21 Q39 26 36 33 Q27 38 18 35 Q13 31 15 26 Z', c.m);
    s += det('M18 30 Q26 27 33 30 Q33 35 26 36 Q19 34 18 30 Z', c.l, '.6');
    s += sil('M12 16 Q11 10 17 9 Q23 10 23 15 Q23 21 18 22 Q13 21 12 16 Z', c.m);
    s += det('M14 14 Q15 10 18 10.4 Q16 15 14 16 Z', c.l);
    s += det('M11 15 L7 17.4 L11.4 19 Z', c.m, '.9');
    s += eye(13.6, 15.4, 1.6);
    s += ln('M18 9 Q16 4 13 3 M13 5 L11 2 M13 5 L16 2.4 M16 6 L17 2.6', PAL.bone.m, 1.8);
    s += ln('M21 9 Q23 4 27 3 M24 5 L26 2 M24 5 L22 2', PAL.bone.m, 1.8);
    s += det('M12.6 18.4 Q16 20 19.6 18.4 Q17 22 12.6 18.4 Z', c.d, '.7');
    s += ln('M35 23 Q39 20 40 25', c.l, 2.6);
    s += det('M12.6 8.4 L13.4 4.6 L14 8.4 Z', c.d);
    return s;
  };

  /* 野猪 */
  ENEMY_SH.boar = function (c) {
    let s = sh(26, 43, 10, 2);
    s += leg(14, 33, 3.4, 10, c, true) + leg(32, 33, 3.4, 10, c, true);
    s += sil('M12 22 Q20 15 32 18 Q41 23 39 32 Q31 40 18 38 Q10 32 12 22 Z', c.m);
    s += det('M15 29 Q24 26 33 30 Q33 36 24 38 Q16 34 15 29 Z', c.l, '.45');
    s += det('M13 19 L16 12 L19 18 L22 12 L25 18 L28 12 L30 19 Z', c.d);
    s += sil('M8 28 Q8 22 13 21 Q19 21 20 26 Q20 32 14 33 Q9 32 8 28 Z', c.m);
    s += det('M9 26 Q10 21.6 14 21.6 Q12 26 9 27.6 Z', c.l, '.7');
    s += eye(12.4, 24.6, 1.6);
    s += ci(9.4, 29.6, 1.6, c.d, ` stroke="${OUT}" stroke-width="1"`);
    s += fang(12, 30, 1.6, 6) + fang(12, 30, 1.6, -6);
    s += ln('M8 27 Q5.6 26 5 28', OUT, 1);
    s += ln('M33 20 Q36 21 38 25', c.d, 1.2, '.5');
    return s;
  };

  /* 狼 */
  ENEMY_SH.wolf = function (c) {
    let s = sh(25, 43, 9.5, 2);
    s += leg(14, 32, 3.4, 11, c, true) + leg(32, 31, 3.4, 12, c, true);
    s += leg(18, 33, 3.6, 10, c) + leg(28, 32, 3.6, 11, c);
    s += sil('M12 24 Q20 18 31 20 Q40 24 38 32 Q30 38 19 36 Q10 31 12 24 Z', c.m);
    s += det('M17 29 Q25 26 32 29 Q32 34 25 35 Q18 33 17 29 Z', c.l, '.5');
    s += sil('M9.6 23 Q8.2 15.2 15 13.4 Q20.6 13.6 21.8 19.4 L22.6 23.2 Q19.4 27 14.6 26.6 Q11 25.8 9.6 23 Z', c.m);
    s += sil('M9.8 23.2 L4.2 22 L9 24.8 Z', c.m);
    s += ci(4.4, 22, 1.15, OUT);
    s += det('M10.4 19.2 Q12.2 15 15.4 14.6 L14.2 19.8 Z', c.l);
    s += det('M13.6 12.4 L15.6 6.6 L18.8 12.2 Z', c.d) + det('M9 12.8 L8.6 7.6 L12.4 12.2 Z', c.d);
    s += eye(14.6, 19.2, 1.6);
    s += fang(9.4, 24.4, 1, 2.2) + fang(12.2, 24.8, 1, 2);
    s += sil('M36 24 Q42 20 42.6 15 Q40 21 34 26 Z', c.d);
    s += ln('M20 24 Q26 23 31 26', c.d, 1.1, '.35');
    return s;
  };

  /* 熊 */
  ENEMY_SH.bear = function (c) {
    let s = sh(25, 43, 11, 2.2);
    s += leg(12, 31, 5, 12, c, true) + leg(31, 31, 5, 12, c, true);
    s += sil('M10 23 Q18 14 30 16 Q41 20 40 32 Q31 41 18 39 Q8 32 10 23 Z', c.m);
    s += det('M15 30 Q25 27 34 31 Q34 37 25 39 Q16 35 15 30 Z', c.l, '.45');
    /* 肩部隆起 */
    s += sil('M24 16 Q31 12.6 38 17.4 Q32 19.6 25 20.4 Z', c.d, '.75');
    /* 头 */
    s += sil('M7 26 Q7 18 14 16 Q21 16 22 22 Q22 29 15 31 Q9 29 7 26 Z', c.m);
    s += ci(10.4, 16.6, 3, c.m, ` stroke="${OUT}" stroke-width="1.3"`);
    s += ci(10.4, 16.6, 1.5, c.d);
    s += ci(18.2, 16, 2.6, c.m, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ci(18.2, 16, 1.2, c.d);
    s += det('M9 26 Q13 24 17 26 Q17 30 13 31 Q9 30 9 26 Z', c.l, '.6');
    s += eye(12.4, 23, 1.6);
    s += ci(9.6, 27.6, 1.5, '#2b1d17');
    s += fang(11, 29.6, 1.4, 3.4);
    s += ln('M23 21 Q30 20 37 24', c.d, 1.2, '.4');
    return s;
  };

  /* 山羊 */
  ENEMY_SH.goat = function (c) {
    let s = sh(24, 43, 9, 2);
    s += leg(15, 31, 3, 12, c, true) + leg(32, 31, 3, 12, c, true);
    s += sil('M14 25 Q20 19 31 21 Q38 25 36 32 Q27 37 18 34 Q12 30 14 25 Z', c.m);
    s += det('M17 29 Q24 27 31 29 Q31 34 24 35 Q18 33 17 29 Z', c.l, '.7');
    s += sil('M10 17 Q9 11 15 10 Q21 11 21 16 Q21 22 15 23 Q10 22 10 17 Z', c.m);
    s += det('M12 14 Q14 11 17 11 Q15 15 12 15 Z', c.l);
    s += ln('M15 10 Q15 4 20 2 Q22 6 18 9', PAL.bark.m, 2.6);
    s += ln('M13 10 Q11 4 7 3 Q9 8 12 10', PAL.bark.m, 2.6);
    s += eye(12.4, 16, 1.6);
    s += det('M12 21 Q14 27 18 29 Q13 29 11.4 24 Z', c.l, '.85');
    s += ci(9.2, 19.4, 1.2, c.d);
    return s;
  };

  /* 羚羊 */
  ENEMY_SH.antelope = function (c) {
    let s = sh(24, 43, 8.5, 2);
    s += leg(14, 30, 2.6, 13, c, true) + leg(31, 30, 2.6, 13, c, true);
    s += leg(18, 31, 2.8, 12, c) + leg(28, 31, 2.8, 12, c);
    s += sil('M15 25 Q21 20 30 21 Q36 25 34 31 Q27 35 19 33 Q13 29 15 25 Z', c.m);
    s += det('M18 28 Q24 26 30 28 Q30 32 24 33 Q19 32 18 28 Z', c.l, '.6');
    s += sil('M13 16 Q12 10 17 9 Q22 10 22 15 Q22 21 17 22 Q13 21 13 16 Z', c.m);
    s += det('M14.6 13 Q16 10.6 18.6 10.6 Q17 14 14.6 14.6 Z', c.l);
    s += ln('M16 9 Q14 3 18 1 Q21 4 18.4 8.6', PAL.bone.m, 2.2);
    s += ln('M19 9 Q18 3 21.6 1 Q24 4.6 21 8.6', PAL.bone.m, 2.2);
    s += eye(14.4, 15, 1.5);
    s += det('M13.4 18 Q16 20 19.4 18.4', c.d, '.6');
    s += ln('M30 22 Q34 21 35 25', c.l, 2.2);
    return s;
  };

  /* 驼鹿 */
  ENEMY_SH.moose = function (c) {
    let s = sh(25, 43, 10, 2.2);
    s += leg(14, 33, 3.4, 10, c, true) + leg(31, 33, 3.4, 10, c, true);
    s += leg(18, 34, 3.6, 9, c) + leg(27, 34, 3.6, 9, c);
    s += sil('M12 22 Q19 16 31 18 Q40 22 38 31 Q29 39 18 36 Q9 30 12 22 Z', c.m);
    s += det('M13 18 Q19 12 25 13 Q20 18 17 24 Q12 27 13 18 Z', c.d, '.65');
    s += sil('M9 25 Q8 18 14 16 Q20 16 21 22 Q20 29 14 30 Q9 28 9 25 Z', c.m);
    s += det('M10 24 Q11 19 15 18 Q13 24 10 25.6 Z', c.l, '.6');
    s += det('M10 28 Q13 30 16 29 Q15 36 13 38 Q10 34 10 28 Z', c.d, '.8');
    s += det('M13.6 16 Q12.6 10 9.4 6.8 Q11.6 10.6 11.2 12.8 Q9.4 9 6.6 8.8 Q9.6 11.8 10.6 15 Q8 12.8 5.8 13.6 Q9.4 15 11.6 17.4 Z', PAL.bone.m, 1.2);
    s += det('M18.4 15.4 Q19.6 9.6 22.8 6.4 Q20.6 10 21 12.2 Q23 8.4 25.8 8.2 Q22.8 11.2 21.8 14.4 Q24.4 12.4 26.6 13.2 Q23.2 14.6 21 16.8 Z', PAL.bone.m, 1.2);
    s += det('M8 21 L12 20 L11.6 24 Z', c.m);
    s += eye(12.6, 22, 1.5);
    s += ln('M9 26 Q6 25 5 27', OUT, 1);
    return s;
  };

  /* 野牛 */
  ENEMY_SH.bison = function (c) {
    let s = sh(25, 43, 11, 2.2);
    s += leg(13, 32, 4, 11, c, true) + leg(31, 33, 3.6, 10, c, true);
    s += sil('M9 24 Q11 14 21 12 Q33 12 39 20 Q40 30 32 36 Q18 40 11 33 Q8 29 9 24 Z', c.m);
    s += det('M11 22 Q12 14 20 12.6 Q16 20 16 28 Q9 27 11 22 Z', c.d, '.6');
    s += sil('M6 28 Q5 21 11 19 Q16 19 17 24 Q17 31 11 32 Q6 31 6 28 Z', c.d);
    s += det('M9 21 Q12 15 17 14 Q21 12 23 16 Q18 20 16 26 Q12 24 9 21 Z', c.d, '.9');
    s += ci(12, 26, 1.7, '#2b1d17') ;
    s += eye(11, 23.6, 1.6);
    s += det('M12 17 Q18 12 24 15 Q18 19 15 19 Z', PAL.bone.m);
    s += ln('M15 16 Q11 12 8 13', PAL.bone.m, 2.2);
    s += ln('M13 30 Q16 29 17 31', OUT, 1);
    s += det('M35 30 Q38 32 37 36 Q33 36 33 32 Z', c.d);
    return s;
  };

  /* 猛犸 */
  ENEMY_SH.mammoth = function (c) {
    let s = sh(24, 43, 11.5, 2.4);
    s += leg(12, 31, 5.4, 12, c, true) + leg(29, 31, 5.4, 12, c, true);
    s += sil('M8 22 Q10 12 22 10 Q36 10 41 20 Q43 30 34 36 Q18 40 10 32 Q6 27 8 22 Z', c.m);
    s += det('M10 20 Q14 13 22 11.4 Q16 18 15 26 Q9 25 10 20 Z', c.d, '.55');
    s += ln('M13 20 Q15 28 13 36 M18 17 Q20 26 18 36 M24 15 Q26 26 24 38', c.d, 1.2, '.45');
    s += sil('M8 26 Q7 18 14 16 Q22 16 23 22 Q23 30 15 32 Q9 31 8 26 Z', c.m);
    s += det('M9 24 Q10 18 15 17 Q13 24 9 26 Z', c.l, '.5');
    s += ln('M14 26 Q10 33 14 38 Q18 41 17 35', c.m, 5.2);
    s += ln('M14 26 Q10 33 14 38 Q18 41 17 35', c.d, 2, '.5');
    s += ln('M13 28 Q11 34 14 37', c.l, 1.4, '.4');
    s += sil('M18 24 Q22 22 22 28 Q21 34 18 33 Q15 30 18 24 Z', '#f4ecd6', 1.3);
    s += ci(18, 16, 4.6, c.m, ` stroke="${OUT}" stroke-width="1.3"`);
    s += det('M16 13 Q19 15 21 14 Q20 18 17 18 Z', c.l, '.6');
    s += eye(14.6, 22.6, 1.6);
    s += det('M24 12 L27 7 L30 13 Z', c.d);
    return s;
  };

  /* 鳄鱼 */
  ENEMY_SH.croc = function (c) {
    let s = sh(26, 42, 12, 2);
    s += sil('M16 34 Q26 32 34 34 Q40 36 40 40 Q36 43 26 42 Q18 41 16 38 Z', c.d);
    s += sil('M10 40 Q12 30 22 28 Q32 27 39 32 Q41 37 35 39 Q24 42 10 40 Z', c.m);
    s += det('M12 38 Q18 32 26 31 Q32 31 36 34 Q28 38 16 39 Z', c.l, '.55');
    s += sil('M2 33 Q4 28 12 28 Q20 28 23 32 Q22 38 14 39 Q5 39 2 33 Z', c.m);
    s += det('M3 31 Q6 28 12 28.6 Q9 33 4 34 Z', c.l, '.5');
    s += ln('M4 30 L4 28.6 M7 28.6 L7 27.4 M10 28.6 L10 27.4', OUT, 1, '.6');
    for (let i = 0; i < 3; i++) s += det(`M${26 + i * 4} ${27.6 - i * 0.4} L${28 + i * 4} ${25 - i * 0.4} L${29.4 + i * 4} ${28 - i * 0.4} Z`, c.d);
    s += eye(9, 31, 1.6);
    s += ln('M17 36 Q22 38 28 37 M18 38.6 Q24 40 30 39', OUT, 1, '.45');
    s += ln('M17 39 Q14 40 12 40 M21 40 Q18 41 16 41', OUT, 1, '.4');
    for (let i = 0; i < 4; i++) s += det(`M${20 + i * 5} ${33 + (i % 2) * 1.4} l1.6 1.6 l-1.6 1.6 l-1.6 -1.6 Z`, c.d, '.6');
    return s;
  };

  /* 巨蜥 */
  ENEMY_SH.lizard = function (c) {
    let s = sh(25, 42, 11, 2);
    s += ln('M33 33 Q40 30 44 34 Q42 36 38 36', c.m, 4.2);
    s += ln('M33 33 Q40 30 44 34 Q42 36 38 36', c.d, 1.4, '.4');
    s += sil('M14 30 Q20 24 29 26 Q35 29 34 35 Q26 40 18 36 Q13 34 14 30 Z', c.m);
    s += det('M16 31 Q22 27 29 28.6 Q29 33 23 35 Q18 33 16 31 Z', c.l, '.5');
    s += sil('M6 27 Q7 21 13 20 Q19 21 20 26 Q18 32 12 32 Q7 31 6 27 Z', c.m);
    s += det('M7.6 25 Q9 21.6 13 21.6 Q11 26 8 27 Z', c.l, '.6');
    s += eye(10, 24, 1.7);
    s += ln('M6 28 Q1 28 0 30.4', c.m, 1.6) + ln('M6 28.6 L2.4 30.4', PAL.carpet.l, 1.2);
    s += leg(15, 34, 2.6, 8, c) + leg(28, 34, 2.6, 8, c) + leg(19, 33, 2.4, 7, c, true);
    s += ln('M18 28 L22 27 M24 27.6 L27 28.4 M20 31 L24 31.6', c.d, 1, '.5');
    return s;
  };

  /* 犀牛 */
  ENEMY_SH.rhino = function (c) {
    let s = sh(25, 43, 11, 2.2);
    s += leg(12, 31, 5, 12, c, true) + leg(31, 32, 4.6, 11, c, true);
    s += sil('M9 21 Q16 13 29 15 Q41 18 41 29 Q36 40 22 39 Q8 35 9 21 Z', c.m);
    s += det('M12 20 Q18 15 27 16 Q22 24 22 34 Q11 30 12 20 Z', c.l, '.5');
    s += ln('M17 19 Q20 26 19 34 M26 17 Q29 24 28 35', c.d, 1.3, '.5');
    s += sil('M4 26 Q4 18 12 17 Q19 17 20 24 Q19 33 11 34 Q5 32 4 26 Z', c.m);
    s += det('M5 26 Q6 19 12 18 Q10 25 6 28 Z', c.l, '.45');
    s += ln('M9 17 L10 6 Q13 8 12.6 17 Z', PAL.bone.l, 1.4);
    s += det('M9 17 L10 6 Q13 8 12.6 17 Z', PAL.bone.m);
    s += eye(9, 24, 1.6);
    s += ci(12.6, 30, 1.4, c.d);
    s += ln('M20 30 Q26 32 34 31', c.d, 1.2, '.4');
    return s;
  };

  /* 机械兽 */
  ENEMY_SH.mech = function (c) {
    const g = PAL.gold, e = PAL.ember;
    let s = sh(25, 43, 11, 2.2);
    s += rcl(12, 31, 5, 11, 1.6, PAL.machine.d, 1.4) + rcl(30, 32, 5, 10, 1.6, PAL.machine.d, 1.4);
    s += sil('M8 22 L18 16 L34 18 L41 25 L36 34 L20 35 L12 31 Z', c.m);
    s += det('M18 16 L34 18 L36 25 L20 24 Z', c.l, '.5');
    s += ln('M20 24 V34 M28 25 V35', c.d, 1.2, '.6');
    s += ci(26, 27, 5, PAL.chip.m, ` stroke="${OUT}" stroke-width="1.3"`);
    s += det(cogPath(26, 27, 4.4, 2.8, 8), g.m);
    s += sil('M3 27 L12 21 L21 24 L20 32 L11 35 L3 32 Z', PAL.machine.m);
    s += rcl(5, 25, 12, 3, 1, '#0e1620', 1.2);
    s += ci(9, 26.6, 1.6, e.m);
    s += ci(9, 26.6, 3, e.l, ' opacity=".35"');
    s += det('M3 27 L8 24 L8 22 L3 24 Z', g.m);
    s += ln('M20 17 L22 10 L27 9', PAL.machine.l, 1.6) + ci(27.6, 8.6, 1.8, e.m);
    s += ln('M15 20 L13 26 L16 30', PAL.machine.d, 1.4);
    s += ci(15, 22, 1.2, g.l) + ci(33, 20, 1.2, g.l);
    return s;
  };

  /* 变异巨兽 */
  ENEMY_SH.mutantBeast = function (c) {
    let s = sh(24, 43, 11.5, 2.2);
    s += rcl(11, 30, 6, 12, 2.4, c.d, 1.5) + rcl(29, 30, 6, 12, 2.4, c.d, 1.5);
    s += sil('M9 20 Q14 11 24 12 Q36 12 41 22 Q42 32 32 36 Q18 38 11 32 Q7 26 9 20 Z', c.m);
    s += det('M14 18 Q20 13 28 14 Q22 20 20 28 Q13 26 14 18 Z', c.l, '.5');
    s += det('M33 17 L38 9 L39 16 L44 12 L40 20 Z', c.d);
    s += sil('M6 16 Q2 9 7 5 Q9 11 12 13 Z', c.d);
    s += sil('M7 22 Q3 18 1 24 Q5 26 8 26 Z', c.d);
    s += ci(13, 20, 4.6, c.d, ` stroke="${OUT}" stroke-width="1.3"`);
    s += eye(11.6, 19.4, 2.2, PAL.ember.m);
    s += ci(13.6, 20, 3.6, PAL.ember.d, ' opacity=".5"');
    s += det('M8 27 Q14 25 20 28 Q18 33 12 33 Q9 31 8 27 Z', c.l, '.55');
    s += fang(11, 28.6, 1.4, 4) + fang(15, 28.6, 1.4, 4);
    s += sil('M36 26 Q42 24 43 28 Q42 33 37 32 Z', c.d);
    s += ln('M18 20 Q24 18 30 21', c.d, 1.2, '.45');
    s += ci(22, 24, 1.2, c.d) + ci(26, 25.4, 1, c.d);
    return s;
  };

  /* 外星掠食者 */
  ENEMY_SH.alienPred = function (c, r, _arg, e) {
    let s = sh(24, 43, 11, 2.2);
    s += ln('M28 33 Q36 34 40 40 M20 34 Q14 38 12 42', c.d, 2.6);
    s += sil('M14 26 Q18 16 27 16 Q34 19 35 28 Q34 37 25 38 Q16 35 14 26 Z', c.m);
    s += det('M17 25 Q21 19 27 19 Q23 25 22 31 Q18 30 17 25 Z', c.l, '.5');
    s += sil('M8 18 Q8 9 17 8 Q25 9 26 17 Q26 25 17 26 Q9 24 8 18 Z', c.m);
    s += det('M11 17 Q12 11 17 10.4 Q15 15 12 18 Z', c.l, '.6');
    s += eye(12.4, 16, 2.4, '#121a24');
    s += det('M5 20 Q8 17 12 17 L11 21 Q8 21 5 20 Z', c.d);
    s += det('M6 26 Q8 20 11 22 Q9 28 12 30 Q8 31 6 28 Z', c.d);
    s += ln('M22 26 Q26 24 28 27', c.d, 1.2, '.5');
    s += ln('M16 12 Q20 6 25 7 M20 9 L22 4', c.l, 2, '.7');
    s += ci(17, 33, 1.4, c.l, ' opacity=".7"') + ci(25, 34, 1.2, c.l, ' opacity=".6"');
    if (e && e.type === 'eraSim') s += ln('M8 8 Q6 4 9 2', PAL.mutant.l, 1.6, '.7');
    return s;
  };

  /* 硅基生物 */
  ENEMY_SH.silicon = function (c) {
    let s = sh(24, 43, 11, 2.2);
    s += sil('M24 6 L34 14 L32 30 L24 40 L16 30 L14 14 Z', c.m);
    s += det('M24 6 L34 14 L24 22 Z', c.l);
    s += det('M24 22 L32 30 L24 40 Z', c.d);
    s += ln('M24 6 V22 M14 14 L24 22 L34 14 M16 30 L24 22 L32 30', c.l, 1.4, '.8');
    s += ci(24, 26, 5.4, '#0d1a20', ` stroke="${OUT}" stroke-width="1.2"`);
    s += ci(24, 26, 3.4, c.l);
    s += ci(24, 26, 1.6, '#fff', ' opacity=".9"');
    s += ln('M16 30 L11 36 L13 42 M32 30 L37 36 L35 42', c.d, 2.6);
    s += ln('M24 40 L24 43', c.d, 2);
    s += ci(18, 17, 1.3, '#fff', ' opacity=".85"') + ci(30, 20, 1.1, '#fff', ' opacity=".7"');
    s += ci(24, 26, 9, c.l, ' opacity=".13"');
    return s;
  };

  /* ============ 人形敌人 ============ */
  function humanoid(c, opt) {
    const o = opt || {};
    let s = sh(24, 43, 9, 2.2);
    s += rcl(17, 30, 5.4, 12, 2.2, c.d, 1.5) + rcl(26, 30, 5.4, 12, 2.2, c.d, 1.5);
    s += sil('M14 16 Q24 12 34 16 L36 32 Q24 35 12 32 Z', o.body || c.m);
    if (o.belly) s += det('M17 22 Q24 20 31 22 Q31 32 24 32 Q17 30 17 22 Z', o.belly, '.7');
    s += ln('M24 17 V33', c.d, 1.2, '.45');
    s += sil('M10 18 Q6 24 8 31 Q11 33 12 30 Q10 24 13 20 Z', c.d);
    s += sil('M38 18 Q42 24 40 31 Q37 33 36 30 Q38 24 35 20 Z', c.d);
    s += ci(10.4, 32.4, 2.2, c.d, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ci(38.4, 32.4, 2.2, c.d, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ci(24, 11, 7.4, o.head || c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    if (o.face) s += det('M17.6 11 Q24 7 30.4 11 Q30 17 24 18.6 Q18 17 17.6 11 Z', o.face, '.9');
    return s;
  }

  /* 疯人院恶魔 */
  ENEMY_SH.demon = function (c) {
    let s = humanoid(c, { body: c.m, head: c.m });
    s += ln('M17 6 Q13 1 9 2 Q12 5 13 8', PAL.bone.m, 2.4);
    s += ln('M31 6 Q35 1 39 2 Q36 5 35 8', PAL.bone.m, 2.4);
    s += eye(20.6, 10.6, 2, PAL.ember.l) + eye(27.4, 10.6, 2, PAL.ember.l);
    s += ln('M20 15 Q24 17.6 28 15', '#2a0f0c', 1.6);
    s += fang(21.6, 15.4, 1.2, 2.8) + fang(24, 15.4, 1.2, 3.2) + fang(26.4, 15.4, 1.2, 2.8);
    s += det('M14 20 Q24 16 34 20 L32 26 Q24 24 16 26 Z', PAL.chip.m, '.9');
    s += ci(24, 24, 2.6, PAL.ember.m) + ci(24, 24, 1.2, '#fff', ' opacity=".7"');
    s += ln('M9 32 L7 38 M38 32 L40 38', OUT, 1.4, '.7');
    s += ci(24, 11, 9, c.l, ' opacity=".12"');
    return s;
  };

  /* 灰烬裁决者 */
  ENEMY_SH.judge = function (c) {
    let s = humanoid(c, { body: PAL.steel.m, head: PAL.steel.m });
    s += det('M14 16 Q24 12 34 16 L34 27 Q24 24 14 27 Z', PAL.ash.m, '.85');
    s += rcl(19, 6, 10, 11, 4, PAL.steel.l, 1.5);
    s += rcl(20, 11.4, 8, 2.4, 1, '#0d1319', 1);
    s += det('M22 6 L24 1.6 L26 6 Z', PAL.gold.m);
    s += ln('M15 5 Q10 8 8 13 Q12 10 16 9', PAL.gold.l, 2);
    s += ln('M33 5 Q38 8 40 13 Q36 10 32 9', PAL.gold.l, 2);
    s += ln('M24 17 V33 M18 20 L30 20', PAL.gold.d, 1.6, '.8');
    s += sil('M39 14 L42 26 L38 38 L35 26 Z', PAL.steel.l, 1.3);
    s += det('M37 12 H41 V16 H37 Z', PAL.gold.m);
    s += ln('M8 36 Q24 42 40 36', PAL.ash.d, 1.4, '.6');
    s += ci(24, 24, 12, PAL.ember.l, ' opacity=".1"');
    return s;
  };

  /* 深渊窥视者 */
  ENEMY_SH.watcher = function (c) {
    let s = sh(24, 43, 11, 2.4);
    for (let i = 0; i < 5; i++) {
      const x = 9 + i * 7.4;
      s += ln(`M${x} 36 Q${x - 4 + i * 2} 41 ${x + 1} 44`, c.d, 2.4);
    }
    s += ci(24, 25, 15, c.m, ` stroke="${OUT}" stroke-width="${SW}"`);
    s += det('M24 10 A15 15 0 0 1 39 25 L24 25 Z', c.l, '.45');
    s += ci(24, 25, 9.4, PAL.bone.l, ` stroke="${OUT}" stroke-width="1.5"`);
    s += ci(24, 25, 5.2, '#1b1030');
    s += ci(22.6, 23.6, 2, '#fff');
    s += det('M12 14 Q16 8 24 7 M36 14 Q32 8 24 7', c.l, 'none') ;
    s += el(24, 25, 15, 15, 'none', ` stroke="${c.d}" stroke-width="1.6" opacity=".6"`);
    s += ln('M10 25 Q14 22 18 25 M30 25 Q34 22 38 25', c.d, 1.2, '.5');
    s += ci(24, 25, 18, c.l, ' opacity=".1"');
    s += ci(13, 12, 1.6, c.l) + ci(36, 12, 1.4, c.l);
    return s;
  };

  /* 无名之王 */
  ENEMY_SH.king = function (c) {
    let s = humanoid(c, { body: c.d, head: PAL.bone.m, belly: PAL.chip.m });
    s += det('M17 10 L20 4 L23 9 L26 3.4 L29 9 L32 4.6 L33 10.6 Z', PAL.gold.m);
    s += ci(20.6, 11, 1.8, '#101418') + ci(27.4, 11, 1.8, '#101418');
    s += ci(20.6, 11, 3, PAL.ember.l, ' opacity=".5"');
    s += ln('M20 15 H28 M22 15 V18 M24 15 V19 M26 15 V18', '#2a2018', 1.2);
    s += det('M17 18 Q24 15 31 18 L30 24 Q24 22 18 24 Z', PAL.gold.d, '.85');
    s += det('M14 16 Q24 12 34 16 V36 Q24 40 14 36 Z', c.d, '.55');
    s += ln('M12 30 Q24 34 36 30', PAL.gold.m, 1.6, '.7');
    s += sil('M39 12 L43 30 L39 42 L36 30 Z', PAL.chip.m, 1.3);
    s += ci(24, 11, 10, c.l, ' opacity=".1"');
    return s;
  };

  /* 游荡僵尸 */
  ENEMY_SH.zombie = function (c) {
    let s = humanoid(c, { body: c.m, head: c.m, belly: PAL.chip.m });
    s += det('M17 11 Q18 7 22 8 Q24 9 26 8 Q30 8 31 11 Q30 17 24 18 Q18 17 17 11 Z', c.l, '.35');
    s += eye(20.6, 10.4, 1.6) + eye(27.2, 10.4, 1.6);
    s += ln('M21 15 Q24 17 27 15', '#1a2418', 1.4);
    s += fang(22.4, 15, 1, 2) + fang(25.6, 15, 1, 2);
    s += det('M16 19 L30 17 L31 26 L17 28 Z', PAL.linen.m, '.75');
    s += ln('M20 19 L21 27 M26 18 L25 26', PAL.linen.d, 1.2, '.7');
    s += ln('M14 20 Q10 26 11 33 M34 19 Q40 24 39 30', c.m, 3.4);
    s += ci(11, 34, 2.4, c.m, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ci(39, 31, 2.4, c.m, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ln('M19 25 Q22 27 21 30', c.d, 1.2, '.6');
    return s;
  };

  /* 尸潮（三只） */
  ENEMY_SH.zombieHorde = function (c) {
    let s = sh(24, 43, 12, 2.4);
    const one = (x, y, f, dark) => gp(`translate(${x} ${y}) scale(${f}) translate(-24 -34)`,
      sil('M17 20 Q24 16 31 20 L32 34 H16 Z', dark ? c.d : c.m) +
      ci(24, 15, 6.2, dark ? c.d : c.m, ` stroke="${OUT}" stroke-width="1.5"`) +
      eye(21.4, 14.4, 1.3) + eye(26.6, 14.4, 1.3) +
      ln('M21.6 18.4 H26.4', '#1a2418', 1.2) +
      ln('M13 22 Q9 27 10 33 M35 22 Q39 27 38 33', dark ? c.d : c.m, 3));
    s += one(24, 26, 0.86, true);
    s += one(14, 30, 0.78, true);
    s += one(34, 30, 0.8, false);
    s += ci(24, 24, 16, PAL.mutant.l, ' opacity=".08"');
    return s;
  };

  /* 变异体 */
  ENEMY_SH.mutant = function (c) {
    let s = sh(24, 43, 10, 2.2);
    s += rcl(15, 32, 6, 11, 3, c.d, 1.5) + rcl(27, 32, 6, 11, 3, c.d, 1.5);
    s += sil('M10 22 Q12 12 24 11 Q37 12 39 23 Q40 34 30 37 Q18 38 12 32 Q8 27 10 22 Z', c.m);
    s += det('M15 20 Q20 14 26 15 Q20 21 18 30 Q12 28 15 20 Z', c.l, '.45');
    s += ci(18, 20, 6, c.d, ` stroke="${OUT}" stroke-width="1.3"`);
    s += eye(16, 19, 2.6, PAL.ember.m);
    s += sil('M8 24 Q2 26 3 34 Q6 38 9 34 Q7 29 11 27 Z', c.m);
    s += ci(6, 35, 3, c.m, ` stroke="${OUT}" stroke-width="1.2"`);
    s += ln('M13 30 Q18 27 23 30 Q21 35 16 35 Q13 33 13 30 Z', PAL.chip.m, 1.2);
    s += ln('M27 18 Q33 16 37 20', c.d, 1.2, '.5');
    s += ci(29, 24, 1.6, c.d) + ci(33, 27, 1.3, c.d);
    s += fang(25, 21, 1.2, 2.4);
    return s;
  };

  /* 尸潮首领 */
  ENEMY_SH.chieftain = function (c) {
    let s = humanoid(c, { body: c.m, head: c.m });
    s += det('M14 16 Q24 11 34 16 L35 28 Q24 25 13 28 Z', PAL.chip.m, '.9');
    s += sil('M36 26 Q42 22 44 28 Q41 32 37 32 Z', c.d);
    s += ln('M40 24 L44 12', PAL.wood.m, 3.4);
    s += det('M42 6 L47 12 L43 15 L39 10 Z', PAL.machine.m, 1.3);
    s += eye(20.4, 10.6, 1.9) + eye(27.6, 10.6, 1.9, PAL.ember.l);
    s += ln('M20 15.4 Q24 18 28 15', '#1a2418', 1.6);
    s += fang(21.6, 15, 1.2, 2.6) + fang(24, 15, 1.2, 3) + fang(26.4, 15, 1.2, 2.6);
    s += det('M17 6.4 L18.6 2 L21 5.6 L24 1.6 L26.6 5.6 L29 2 L30.6 6.4 Z', PAL.bone.m);
    s += ln('M11 22 Q8 28 9 33 M37 22 Q40 26 39 30', c.m, 3);
    s += ci(24, 24, 12, PAL.mutant.l, ' opacity=".1"');
    return s;
  };

  /* ============================================================
   * 工作图标（33 份工作）
   * ============================================================ */
  const JOB_SH = {};
  /* 地面阴影（默认 y=43） */
  const gsh = (w, y) => sh(24, y || 43, w || 13, 2.1);

  /* 伐木：斧头剁进圆木 */
  JOB_SH.woodcutting = function () {
    const w = PAL.wood, k = PAL.bark, st = PAL.steel;
    return gsh(15) +
      sil('M7 31 H32 V41 H7 Z', w.m) +
      det('M7 31 H32 V34.4 H7 Z', w.l) +
      det('M7 38.4 H32 V41 H7 Z', w.d) +
      el(32, 36, 3.4, 5, w.l) + el(32, 36, 2.2, 3.2, w.m) + el(32, 36, .9, 1.4, w.d) +
      ln('M7 31 H32 V41 H7 Z', OUT, 1.4) +
      ln('M11 34.6 H20', w.d, .9) +
      ln('M20 33 L30 9', k.m, 3.2) + ln('M20 33 L30 9', k.l, 1) +
      sil('M27 3 Q37 4 39 12 Q38 17 30 17 Q24 15 24 10 Q24 6 27 3 Z', st.m) +
      det('M27 3 Q37 4 39 12 L33 11 Q27 9 27 3 Z', st.l) +
      det('M25 13 Q31 15 37 13 Q34 17 29 16.6 Q26 15.4 25 13 Z', st.d);
  };

  /* 采矿：镐 + 矿石堆 */
  JOB_SH.mining = function () {
    const st = PAL.steel, w = PAL.wood, r = PAL.stone;
    return gsh(14) +
      sil('M6 35 Q10 27 18 28 Q24 25 31 28 Q40 29 42 35 Q41 40 35 41 H13 Q7 40 6 35 Z', r.m) +
      det('M10 34 Q15 30 20 31 Q25 29 30 31 Q36 32 38 35 Q30 33 24 34 Q16 33 10 34 Z', r.l) +
      det('M9 38 Q18 35 27 37 Q35 36 40 38 Q36 41 29 41 H15 Q10 41 9 38 Z', r.d) +
      ln('M6 35 Q10 27 18 28 Q24 25 31 28 Q40 29 42 35 Q41 40 35 41 H13 Q7 40 6 35 Z', OUT, 1.5) +
      ln('M18 34 L30 8', w.m, 3) + ln('M18 34 L30 8', w.l, 1) +
      sil('M14 18 Q16 9 24 7 Q33 8 38 17 Q33 13 28 12.4 Q23 12 19 13.6 Q16 15 14 18 Z', st.m) +
      det('M14 18 Q16 9 24 7 Q33 8 38 17 Q32 12 24 11.4 Q18 12 14 18 Z', st.l) +
      ln('M22 11.4 Q26 10.8 31 12.4', st.d, 1);
  };

  /* 采集：装满果实的篮子 */
  JOB_SH.gathering = function () {
    const b = PAL.hemp;
    return gsh(13) +
      ci(16, 19, 4.4, PAL.berry.m) + ci(15.2, 18, 1.7, PAL.berry.l) +
      ci(25, 17, 4.8, PAL.veg.m) + ci(24, 16, 1.9, PAL.veg.l) +
      ci(33, 20, 4, PAL.grain.m) + ci(32.2, 19, 1.6, PAL.grain.l) +
      sil('M10 25 H38 L35 40 H13 Z', b.m) +
      det('M10 25 H38 V28.6 H10 Z', b.l) +
      det('M13 25 L14 40 H17 L16 25 Z', b.d) +
      ln('M12 31 H36 M13 35 H35', b.d, 1) +
      ln('M13 25 L9 33 M35 25 L39 33', b.d, 2.2) +
      ln('M10 25 H38 L35 40 H13 Z', OUT, 1.4) +
      ln('M14 25 Q24 12 34 25', b.d, 2);
  };

  /* 种植：土垄 + 幼苗 */
  JOB_SH.farming = function () {
    const g = PAL.herbCrop, s = PAL.tuber;
    return gsh(14) +
      sil('M6 34 Q16 29 24 31 Q33 29 42 34 Q37 41 24 41 Q11 41 6 34 Z', s.m) +
      det('M9 35 Q17 32 24 33.4 Q32 32 39 35 Q33 39 24 39 Q14 39 9 35 Z', s.l) +
      det('M7 34 Q16 30 24 31.6 Q33 30 41 34 Q34 36 24 35.4 Q16 36 7 34 Z', s.d) +
      ln('M6 34 Q16 29 24 31 Q33 29 42 34 Q37 41 24 41 Q11 41 6 34 Z', OUT, 1.4) +
      ln('M24 33 V17', g.d, 2.4) +
      sil('M24 26 Q14 25 11 16 Q21 17 24 26 Z', g.m) +
      sil('M24 22 Q34 21 37 12 Q27 13 24 22 Z', g.l) +
      sil('M24 19 Q20 11 24 6 Q28 11 24 19 Z', g.m) +
      ci(15, 36, 1.1, PAL.seedBean.m) + ci(32, 36.6, 1.1, PAL.seedBean.m);
  };

  /* 狩猎：弓 + 箭 */
  JOB_SH.hunting = function () {
    const w = PAL.wood, st = PAL.steel;
    return gsh(13) +
      sil('M16 5 Q3 24 16 43 L20 41 Q9 24 20 7 Z', w.m) +
      det('M18 8 Q8 24 18 40 L20 41 Q10 24 20 7 Z', w.l) +
      ln('M16 5 Q3 24 16 43', OUT, 1.4) +
      ln('M16 6.4 V41.6', '#e9dfcc', 1.1) +
      ln('M13 24 H37', w.d, 2.2) +
      sil('M37 24 L43 21 L41 24 L43 27 Z', st.m) +
      ln('M14 24 L10 20 M14 24 L10 28', PAL.featherBrown.l, 1.6) +
      ln('M31 24 H36', w.l, 1);
  };

  /* 畜牧：绵羊 + 围栏 */
  JOB_SH.husbandry = function () {
    const wool = PAL.furGoat, face = PAL.furMoose, fence = PAL.plank;
    return gsh(14) +
      ln('M7 35 V41 M15 35 V41 M33 35 V41 M41 35 V41', fence.d, 2) +
      ln('M7 36.6 H41', fence.m, 1.8) +
      ci(13, 24, 6.6, wool.m) + ci(20, 21, 7.2, wool.m) + ci(27, 24, 6.4, wool.m) +
      ci(15, 29, 5.4, wool.m) + ci(24, 29, 5.6, wool.m) +
      det('M7 22 Q10 15 19 16 Q27 15 31 22 Q25 18 19 19 Q13 18 7 22 Z', wool.l) +
      det('M9 30 Q14 34 20 33 Q26 34 31 30 Q28 35 20 35 Q13 35 9 30 Z', wool.d) +
      sil('M28 17 Q38 16 40 23 Q40 31 32 31 Q27 29 26 23 Q26 19 28 17 Z', face.m) +
      det('M27 18 Q32 16 36 17 Q33 20 27 20 Z', face.l) +
      ci(36.6, 23.4, 1.2, '#241b13') +
      ln('M29 19.4 Q32 18 35 19.4', face.d, 1.2) +
      ln('M14 33 V38 M20 34 V39 M27 33 V38', face.d, 2) +
      ln('M33 32 V37 M37 31 V36', face.d, 1.8);
  };

  /* 烹饪：吊锅 + 热气 */
  JOB_SH.cooking = function () {
    const pot = PAL.iron, hot = PAL.ember;
    return gsh(13) +
      ln('M24 4 Q20 8 24 11 Q28 14 24 18', '#f2ead8', 1.6, '.5') +
      ln('M33 6 Q29 9 33 12 Q37 15 33 19', '#f2ead8', 1.4, '.38') +
      sil('M9 22 H39 L36 39 Q24 43 12 39 Z', pot.m) +
      det('M11 24 H37 V28 H11 Z', pot.l) +
      det('M13 33 Q24 36 35 33 Q33 40 24 41 Q15 40 13 33 Z', pot.d) +
      el(24, 22, 15, 4, pot.d) + el(24, 22, 12.4, 3, hot.m) + el(24, 22, 8, 1.8, hot.l) +
      ln('M9 22 H39 L36 39 Q24 43 12 39 Z', OUT, 1.5) +
      ln('M9 24 Q5 26 7 31 M39 24 Q43 26 41 31', OUT, 1.8);
  };

  /* 加工：锤 + 扳手 */
  JOB_SH.crafting = function () {
    const st = PAL.steel, w = PAL.wood;
    return gsh(13) +
      ln('M15 40 L31 12', w.m, 3.2) + ln('M15 40 L31 12', w.l, 1) +
      sil('M27 6 Q34 3 40 6 Q41 13 35 16 Q30 16 27 12 Z', st.m) +
      det('M27 6 Q34 3 40 6 L36 8 Q31 6 27 10 Z', st.l) +
      ln('M33 40 L17 12', st.m, 2.6) +
      sil('M13 6 Q8 6 7 11 Q6 15 10 16 L14 12 L17 15 L16 8 Z', st.m) +
      ci(33, 40, 2.4, st.d) + ci(33, 40, 1.1, '#241b13');
  };

  /* 科研：显微镜 */
  JOB_SH.research = function () {
    const st = PAL.steel, g = PAL.glass, b = PAL.pcb;
    return gsh(12) +
      ci(24, 20, 13, b.l, ' opacity=".10"') +
      sil('M11 37 H37 L34 42 H14 Z', st.m) +
      det('M11 37 H37 L36 39.4 H12 Z', st.l) +
      ln('M11 37 H37 L34 42 H14 Z', OUT, 1.4) +
      sil('M22 24 H26 V37 H22 Z', st.m) +
      ln('M24 30 H17', st.d, 3) +
      sil('M12.6 28 H21 L19.4 31.4 H14.2 Z', st.d) +
      sil('M21.2 26.4 H26.8 V29.4 H21.2 Z', g.m) +
      rot(22, sil('M25 10 H30 V23 H25 Z', st.d) + det('M25 10 H30 V13 H25 Z', st.m), 27.5, 17) +
      ci(29.4, 9.6, 3.1, st.l) + ci(29.4, 9.6, 1.7, g.l);
  };

  /* 切石机：圆锯 + 石块 */
  JOB_SH.stonecutting = function () {
    const st = PAL.steel, r = PAL.granite;
    return gsh(14) +
      det(cogPath(17, 26, 16.6, 13, 14), st.m) +
      ci(17, 26, 12.2, st.l) +
      ci(17, 26, 8.6, st.m) +
      ci(17, 26, 2.6, st.d) +
      ln('M17 13.6 V38.4 M4.6 26 H29.4', st.d, 1, '.55') +
      sil('M25 31 H42 V40 H25 Z', r.m) +
      det('M25 31 H42 V34 H25 Z', r.l) +
      ln('M25 31 H42 V40 H25 Z', OUT, 1.4) +
      ln('M33 37 Q37 35 41 37', '#ffe08a', 1.7, '.95') +
      ln('M31 41 Q36 39 40 41', '#ffe08a', 1.3, '.7');
  };

  /* 制陶：陶罐 + 轮盘 */
  JOB_SH.pottery = function () {
    const c = PAL.clay, w = PAL.wood;
    return gsh(13) +
      sil('M17 33 H31 L33 38 H15 Z', w.m) +
      det('M15 38 H33 V41 H15 Z', w.d) +
      ln('M17 33 H31 L33 38 H15 Z', OUT, 1.3) +
      sil('M9 25 H39 V29 H9 Z', PAL.stone.m) +
      ln('M9 25 H39 V29 H9 Z', OUT, 1.3) +
      sil('M16 25 Q13 18 17 12 Q21 8 24 8 Q28 8 31 12 Q35 18 32 25 Z', c.m) +
      det('M16 25 Q13 18 17 12 Q21 8 24 8 L24 25 Z', c.l) +
      det('M20 21 H28 M19 17 H29', c.d, 1.2) +
      el(24, 8, 6, 2.2, c.d) + el(24, 8, 4.2, 1.3, c.l) +
      ln('M16 25 Q13 18 17 12 Q21 8 24 8 Q28 8 31 12 Q35 18 32 25 Z', OUT, 1.5) +
      ln('M8 18 Q5 20 7 23 M40 17 Q43 19 41 22', c.d, 1.4, '.6');
  };

  /* 医疗：急救绷带 + 十字 */
  JOB_SH.medicine = function () {
    const cl = PAL.cloth, red = PAL.potionRed;
    return gsh(12) +
      sil('M11 18 H37 V36 H11 Z', cl.m) +
      det('M11 18 H37 V22 H11 Z', cl.l) +
      det('M11 32 H37 V36 H11 Z', cl.d) +
      ln('M11 18 H37 V36 H11 Z', OUT, 1.4) +
      ln('M15 23 H33 M15 27.6 H33 M15 31.6 H25', cl.d, 1.4) +
      sil('M19 8 H29 V13 H34 V23 H29 V28 H19 V23 H14 V13 H19 Z', red.m) +
      det('M19 8 H29 V13 H19 Z', red.l) +
      ln('M19 8 H29 V13 H34 V23 H29 V28 H19 V23 H14 V13 H19 Z', OUT, 1.4);
  };

  /* 熔炼：砖炉 + 火焰 */
  JOB_SH.smelting = function () {
    const br = PAL.rock, hot = PAL.ember, st = PAL.steel;
    return gsh(13) +
      ln('M26 4 Q22 8 26 11 Q30 14 26 18', '#8b949e', 1.6, '.45') +
      sil('M7 20 H41 L39 41 H9 Z', br.m) +
      det('M7 20 H41 V24 H7 Z', br.l) +
      det('M9 36 H39 V41 H9 Z', br.d) +
      ln('M7 20 H41 L39 41 H9 Z', OUT, 1.5) +
      ln('M14 20 V14 H34 V20', st.d, 2.2) +
      sil('M15 41 V27 Q24 22 33 27 V41 Z', '#2a1c15') +
      det('M18 40 Q19 32 24 30 Q29 32 30 40 Z', hot.m) +
      det('M21 40 Q21.6 35 24 34 Q26.4 35 27 40 Z', hot.l) +
      ln('M15 41 V27 Q24 22 33 27 V41', OUT, 1.4) +
      ln('M11 28 H14 M34 28 H37', br.d, 1.2);
  };

  /* 锻造：铁砧 + 锤 */
  JOB_SH.forging = function () {
    const st = PAL.steel, w = PAL.wood, hot = PAL.ember;
    return gsh(13) +
      sil('M9 24 H33 L31 31 Q30 33 26 33 H16 Q12 33 11 31 Z', st.m) +
      det('M9 24 H33 V26.6 H9 Z', st.l) +
      sil('M38 24 Q43 25 42 28 Q40 30 36 29 L33 26 Z', st.m) +
      sil('M15 33 H27 L25 38 H17 Z', st.d) +
      sil('M11 38 H31 L30 42 H12 Z', st.d) +
      ln('M9 24 H33 L31 31 Q30 33 26 33 H16 Q12 33 11 31 Z', OUT, 1.5) +
      ln('M15 33 H27 L25 38 H17 Z M11 38 H31 L30 42 H12 Z', OUT, 1.3) +
      ln('M28 6 L24 12', w.m, 3) +
      sil('M30 3 H35 V9 H30 Z', st.d) +
      ln('M24 13 Q27 18 24 22 M28 8 Q31 11 30 14', hot.l, 1.3, '.85');
  };

  /* 木工：手锯 + 木板 */
  JOB_SH.carpentry = function () {
    const st = PAL.steel, w = PAL.wood, pl = PAL.plank;
    let teeth = '';
    for (let i = 0; i < 9; i++) teeth += det('M' + (15 + i * 2.6) + ' 25 L' + (16.3 + i * 2.6) + ' 28.4 L' + (17.6 + i * 2.6) + ' 25 Z', st.d);
    return gsh(14) +
      sil('M6 32 H30 L28 39 H6 Z', pl.m) +
      det('M6 32 H30 V34 H6 Z', pl.l) +
      ln('M6 32 H30 L28 39 H6 Z', OUT, 1.3) +
      ln('M10 36 H24', pl.d, 1) +
      sil('M13 14 H38 L40 25 H13 Z', st.m) +
      det('M13 14 H38 L39 18 H13 Z', st.l) +
      teeth +
      sil('M6 13 Q3 13 3 18 V26 Q3 30 6 30 H14 V13 Z', w.m) +
      det('M6 16 H11 V27 H6 Z', w.d) +
      ln('M13 14 H38 L40 25 H13 Z M6 13 H14 V30 H6 Q3 30 3 26 V18 Q3 13 6 13 Z', OUT, 1.4);
  };

  /* 纺织：线卷 + 针 */
  JOB_SH.weaving = function () {
    const w = PAL.wood, c = PAL.linen, st = PAL.steel;
    return gsh(12) +
      sil('M13 12 H31 V14 H13 Z', w.m) +
      sil('M13 34 H31 V36 H13 Z', w.m) +
      sil('M15 14 H29 V34 H15 Z', c.m) +
      det('M15 17 H29 M15 21 H29 M15 25 H29 M15 29 H29', c.d) +
      det('M15 14 H22 V34 H15 Z', c.l) +
      ln('M13 12 H31 V14 H13 Z M13 34 H31 V36 H13 Z M15 14 H29 V34 H15 Z', OUT, 1.3) +
      ln('M31 30 Q38 26 42 18', st.d, 2) +
      ln('M31 32 Q36 28 39 20', c.l, 1.2);
  };

  /* 裁缝：剪刀 + 布 */
  JOB_SH.tailoring = function () {
    const cl = PAL.cloth, st = PAL.steel, w = PAL.wood;
    return gsh(13) +
      sil('M4 30 H22 L20 40 H4 Z', cl.m) +
      det('M4 30 H22 V33 H4 Z', cl.l) +
      det('M4 37 H20 V40 H4 Z', cl.d) +
      ln('M4 30 H22 L20 40 H4 Z', OUT, 1.3) +
      ln('M7 34 H18', cl.d, 1) +
      sil('M21.4 6 L25 6 L26.6 20 L22.6 20 Z', st.m) +
      sil('M28.6 6 L25.2 6 L23.6 20 L27.6 20 Z', st.l) +
      ci(24, 21, 2.4, st.d) + ci(24, 21, 1.1, '#241b13') +
      ln('M22.6 22 Q19 30 18 36 M25.4 22 Q29 30 30 36', st.d, 2.2) +
      ci(17, 37.6, 3.4, 'none', ' stroke="' + OUT + '" stroke-width="2.4"') +
      ci(31, 37.6, 3.4, 'none', ' stroke="' + OUT + '" stroke-width="2.4"') +
      ci(33, 34, 1.4, w.l);
  };

  /* 石油开采：井架 + 油桶（v0.0.30） */
  JOB_SH.oil_extraction = function () {
    const st = PAL.steel, w = PAL.wood, o = PAL.oil;
    return gsh(14) +
      ln('M11 41 L20 7 M27 41 L36 7', st.m, 2.4) +
      ln('M15 41 L23 9 M31 41 L23 9', st.d, 1.5) +
      ln('M16 27 H32 M14 33 H34 M12 39 H36', st.l, 1.4) +
      ci(23, 6, 2.4, st.l) + ci(23, 6, 1, '#241b13') +
      ln('M23 12 L34 17 L40 15.4', w.m, 2.3) +
      sil('M5 30 H18 V41 H5 Z', w.m) +
      det('M5 30 H18 V33 H5 Z', w.l) +
      det('M5 38 H18 V41 H5 Z', w.d) +
      ln('M5 30 H18 V41 H5 Z', OUT, 1.3) +
      ci(11.5, 35.5, 2.6, o.m) + ci(11.5, 35.5, 1.1, o.l) +
      ln('M37 15 Q42 20 40 27', o.m, 1.8);
  };

  /* 编织：挂毯 + 织机 */
  JOB_SH.carpet_weaving = function () {
    const cp = PAL.carpet, w = PAL.wood;
    return gsh(13) +
      ln('M10 8 H38', w.m, 2.6) +
      ln('M12 8 V41 M36 8 V41', w.d, 2) +
      sil('M14 10 H34 V34 H14 Z', cp.m) +
      det('M14 10 H34 V16 H14 Z', cp.l) +
      det('M18 18 H30 V22 H18 Z', PAL.potionGold.m) +
      det('M18 26 H30 V30 H18 Z', PAL.potionGold.m) +
      ln('M14 10 H34 V34 H14 Z', OUT, 1.4) +
      (function () { let s2 = ''; for (let i = 0; i < 6; i++) s2 += ln('M' + (15 + i * 3.6) + ' 34 V39', cp.d, 1.4); return s2; })();
  };

  /* 造纸：纸张 + 滚筒 */
  JOB_SH.papermaking = function () {
    const p = PAL.paper, w = PAL.wood, st = PAL.steel;
    return gsh(13) +
      rot(-9, sil('M12 12 H34 V34 H12 Z', p.d), 23, 23) +
      sil('M10 16 H34 L36 32 Q30 37 22 36 Q13 36 10 32 Z', p.m) +
      det('M10 16 H34 L34.6 20 H10 Z', p.l) +
      ln('M10 16 H34 L36 32 Q30 37 22 36 Q13 36 10 32 Z', OUT, 1.4) +
      ln('M14 22 H30 M14 25.6 H30 M14 29.2 H26', p.d, 1.1) +
      sil('M30 32 H43 V38 H30 Z', w.m) +
      det('M30 32 H43 V33.6 H30 Z', w.l) +
      ln('M30 32 H43 V38 H30 Z', OUT, 1.2) +
      ci(31.4, 35, 1.4, st.d) + ci(41.6, 35, 1.4, st.d) +
      ln('M9 30 Q6 32 5 36', p.d, 1.2);
  };

  /* 电力：电池 + 闪电 */
  JOB_SH.power = function () {
    const p = PAL.power, en = PAL.energy;
    return gsh(13) +
      sil('M25 12 H37 V40 H25 Z', p.m) +
      det('M25 12 H37 V17 H25 Z', p.l) +
      det('M25 35 H37 V40 H25 Z', p.d) +
      sil('M29 6 H33 V12 H29 Z', p.d) +
      ln('M25 12 H37 V40 H25 Z', OUT, 1.4) +
      sil('M21 6 L9 25 H18 L14 42 L31 20 H21 L25 6 Z', en.m) +
      det('M21 6 L9 25 H18 L17 20 L25 10 Z', en.l) +
      ln('M21 6 L9 25 H18 L14 42 L31 20 H21 L25 6 Z', OUT, 1.6) +
      ln('M28 20 H33 M28 25 H33', p.l, 1, '.5');
  };

  /* 机械加工：齿轮 + 钻头 */
  JOB_SH.machining = function () {
    const m = PAL.machine, st = PAL.steel, w = PAL.wood;
    return gsh(13) +
      det(cogPath(19, 20, 13, 9.6, 12), m.m) +
      ci(19, 20, 8.2, m.l) +
      ci(19, 20, 3.4, m.d) +
      det(cogPath(19, 20, 7.4, 5.6, 8), st.l, '.9') +
      rot(-24, sil('M26 28 H33 V36 H26 Z', st.m) + det('M26 36 L33 36 L29.5 43 Z', st.l) + ln('M26 28 H33 L33 36 L29.5 43 L26 36 Z', OUT, 1.3), 30, 34) +
      ln('M28 26 Q30 23 33 26 M27 30 Q30 27 33 30', m.d, 1.4) +
      ln('M9 30 Q7 33 9 36 M6 28 Q3 33 6 38', m.d, 1.3, '.6');
  };

  /* 化学精炼：烧瓶 + 冷凝管 */
  JOB_SH.chemistry = function () {
    const g = PAL.glass, liq = PAL.potionGreen, st = PAL.steel;
    return gsh(12) +
      ln('M33 6 V14 Q39 18 39 24 Q39 33 31 36', st.m, 2.4) +
      sil('M14 12 H25 V20 Q33 24 33 31 Q33 40 19.5 40 Q6 40 6 31 Q6 24 14 20 Z', g.m) +
      det('M9 30 Q19 34 30 30 Q30 37 19.5 38.4 Q9 37 9 30 Z', liq.m) +
      ln('M14 12 H25 V20 Q33 24 33 31 Q33 40 19.5 40 Q6 40 6 31 Q6 24 14 20 Z', OUT, 1.5) +
      ln('M15 12 V16 M20 12 V16', g.d, 1.2) +
      ci(16, 27, 2.2, liq.l, ' opacity=".85"') + ci(23, 22, 1.5, liq.l) +
      ln('M38 20 Q43 22 41 26', st.d, 1.3, '.7');
  };

  /* 玻璃制造：吹制玻璃 + 吹管 */
  JOB_SH.glassmaking = function () {
    const g = PAL.glass, st = PAL.steel, em = PAL.ember;
    return gsh(13) +
      sil('M17 20 Q12 26 13 34 Q15 40 24 40 Q33 40 35 34 Q36 26 31 20 L29 20 V15 H19 V20 Z', g.m) +
      det('M16 30 Q24 33 32 30 Q33 37 24 38 Q15 37 16 30 Z', g.d, '.75') +
      hl('M19 24 Q16 28 17 33 L20 33 Q19 28 21 25 Z', '.55') +
      ln('M17 20 Q12 26 13 34 Q15 40 24 40 Q33 40 35 34 Q36 26 31 20 L29 20 V15 H19 V20 Z', OUT, 1.5) +
      ln('M19 15 H29', OUT, 1.3) +
      ln('M29 17 L41 6', st.m, 3) +
      ln('M40 5.4 L44 9', st.d, 2.6) +
      ln('M12 40 Q8 41 6 39', em.l, 1.6, '.8');
  };

  /* 火药制作：木桶 + 引信 */
  JOB_SH.gunpowder = function () {
    const w = PAL.bark, st = PAL.steel, pw = PAL.powder, em = PAL.ember;
    return gsh(13) +
      sil('M11 16 Q24 9 37 16 V38 Q24 44 11 38 Z', w.m) +
      det('M11 16 Q24 9 37 16 V20 Q24 13 11 20 Z', w.l) +
      det('M11 33 Q24 39 37 33 V38 Q24 44 11 38 Z', w.d) +
      det('M13 22 H35 V23.4 H13 Z M13 30 H35 V31.4 H13 Z', st.d) +
      ln('M11 16 Q24 9 37 16 V38 Q24 44 11 38 Z', OUT, 1.5) +
      el(24, 16, 6.4, 2.4, w.d) +
      ln('M24 15 Q30 10 32 4', '#d8cbb4', 1.8) +
      ci(33, 4, 2.6, em.l) + ci(33, 4, 1.4, '#fff3c0') +
      ln('M33 0 V-2', em.m, 1.2);
  };

  /* 半导体制造：晶圆 + 芯片 */
  JOB_SH.semiconductors = function () {
    const si = PAL.silicon, op = PAL.optical, ch = PAL.chip;
    return gsh(13) +
      det(cogPath(20, 20, 13.4, 10, 16), PAL.steel.m) +
      ci(20, 20, 10.6, si.m) +
      ci(20, 20, 10.6, si.l, ' opacity=".45"') +
      ln('M13 15 Q17 20 13 25 M20 12 Q24 20 20 28 M27 15 Q23 20 27 25', op.d, 1, '.7') +
      ci(20, 20, 2.2, PAL.chip.d) +
      sil('M27 27 H42 V41 H27 Z', ch.m) +
      det('M29 29 H40 V39 H29 Z', ch.d) +
      ln('M27 27 H42 V41 H27 Z', OUT, 1.3) +
      (function () { let s2 = ''; for (let i = 0; i < 4; i++) s2 += det('M' + (29 + i * 3) + ' 41 H' + (30.4 + i * 3) + ' V45 H' + (29 + i * 3) + ' Z', PAL.gold.m); return s2; })() +
      ln('M30 33 H38', PAL.pcb.l, 1.2);
  };

  /* 精密装配：游标卡尺 */
  JOB_SH.precision_assembly = function () {
    const st = PAL.steel, ch = PAL.chip, m = PAL.machine;
    let tick = '';
    for (let i = 0; i < 8; i++) tick += ln('M' + (12 + i * 3.2) + ' 27 V30', st.d, 1, '.8');
    return gsh(13) +
      sil('M6 24 H42 V28 H6 Z', st.m) +
      det('M6 24 H42 V25.6 H6 Z', st.l) +
      ln('M6 24 H42 V28 H6 Z', OUT, 1.3) +
      tick +
      sil('M6 13 H10 V24 H6 Z', st.d) +
      sil('M6 13 H16 V16 H6 Z', st.d) +
      sil('M24 14 H28 V28 H24 Z', st.m) +
      det('M21 18 H31 V21 H21 Z', st.l) +
      ci(26, 33.4, 2.8, m.m) + ci(26, 33.4, 1.3, '#241b13') +
      sil('M36 15 H42 V20 H36 Z', st.d) +
      det('M37.4 16.4 H40.6 V18.6 H37.4 Z', ch.m) +
      ln('M6 13 H10 V24 M6 13 H16 V16', OUT, 1.3);
  };

  /* 外星采矿：镐 + 异星晶体 */
  JOB_SH.alien_mining = function () {
    const st = PAL.steel, aa = PAL.alienAlloy, al = PAL.alien;
    return gsh(13) +
      sil('M8 41 L14 24 L20 33 L26 20 L34 34 L40 41 Z', al.d) +
      sil('M15 33 L21 17 L27 27 Z', al.m) +
      det('M21 17 L27 27 L23 33 Z', al.l) +
      ln('M15 33 L21 17 L27 27 Z', OUT, 1.3) +
      ln('M10 40 L28 12', PAL.wood.m, 3) +
      sil('M22 14 Q24 5 32 6 Q38 8 38 15 Q34 12 30 13 Q26 12 22 14 Z', st.m) +
      det('M24 7 Q28 4 33 6 Q36 8 37 12 Q32 9 28 10 Z', st.l) +
      ci(30, 24, 1.6, PAL.energy.l, ' opacity=".8"') + ci(12, 32, 1.2, PAL.energy.l, ' opacity=".6"');
  };

  /* 粒子对撞：原子轨道 */
  JOB_SH.particle_collider = function () {
    const en = PAL.energy, pl = PAL.plasma, ch = PAL.chip;
    return gsh(12) +
      el(24, 24, 19, 19, 'none') +
      ci(24, 24, 4.4, pl.m) + ci(24, 24, 2.4, '#fff') +
      (function () {
        let s2 = '';
        for (let i = 0; i < 3; i++) {
          s2 += rot(i * 60, el(24, 24, 18.4, 6.8, 'none', ' stroke="' + en.m + '" stroke-width="1.7" opacity=".9"'), 24, 24);
        }
        return s2;
      })() +
      ci(42, 24, 2.2, en.l) + ci(6, 24, 2.2, en.l) +
      ci(14.6, 10.6, 1.8, pl.l) + ci(33.4, 37.4, 1.8, pl.l) +
      ci(24, 24, 21, ch.m, ' opacity=".07"');
  };

  /* 合成制造：两件合成一件 */
  JOB_SH.synthesis = function () {
    const en = PAL.energy, pl = PAL.plasma, m = PAL.machine;
    return gsh(13) +
      sil('M7 30 L17 24 L27 30 L17 36 Z', m.m) +
      det('M7 30 L17 24 L17 30 L7 36 Z', m.l) +
      det('M17 24 L27 30 L27 36 L17 30 Z', m.d) +
      ln('M7 30 L17 24 L27 30 L17 36 Z M17 36 V42 M7 36 L17 42 M27 36 L17 42', OUT, 1.2) +
      ln('M30 30 H38 M35 25 L40 30 L35 35', en.m, 2.2) +
      sil('M33 8 L43 3 L43 13 L33 18 Z', pl.m) +
      det('M33 8 L43 3 L43 8 L33 13 Z', pl.l) +
      ln('M33 8 L43 3 L43 13 L33 18 Z', OUT, 1.2) +
      ci(38, 30, 7, en.l, ' opacity=".18"');
  };

  /* 曲速核心：漩涡球 */
  JOB_SH.warp_core = function () {
    const wp = PAL.warp, en = PAL.energy;
    return gsh(11) +
      ci(24, 24, 17, wp.d) +
      ci(24, 24, 15.4, wp.m) +
      det('M10 18 Q24 6 38 18 Q30 12 24 20 Q18 12 10 18 Z', wp.l) +
      det('M12 32 Q24 42 36 32 Q28 36 24 30 Q20 36 12 32 Z', wp.l, '.8') +
      ci(24, 24, 6.6, en.m, ' opacity=".9"') +
      ci(24, 24, 3.4, '#fff') +
      ln('M24 4 V9 M24 39 V44 M4 24 H9 M39 24 H44', wp.l, 1.6, '.9') +
      ci(24, 24, 20, en.m, ' opacity=".10"');
  };

  /* 黑暗之魂：骷髅 */
  JOB_SH.black_soul = function () {
    const so = PAL.soul, b = PAL.bone, ab = PAL.abyss;
    return gsh(11) +
      det('M8 24 Q8 8 24 8 Q40 8 40 24 Q40 34 33 38 L32 44 H16 L15 38 Q8 34 8 24 Z', so.m, '.25') +
      sil('M12 26 Q12 12 24 12 Q36 12 36 26 Q36 34 31 37 L30 42 H18 L17 37 Q12 34 12 26 Z', b.m) +
      det('M17 24 Q19 19 22.6 19 Q26 19 26 23 Q26 27 21.4 27 Q17 27 17 24 Z', '#241b13') +
      det('M29.4 24 Q31 19 33.4 19 Q37 19 37 23 Q37 27 32.6 27 Q29.4 27 29.4 24 Z', '#241b13') +
      ci(21.4, 23.4, 1.5, so.l) + ci(33, 23.4, 1.5, so.l) +
      det('M23 30 L25 30 L24 33 Z', '#241b13') +
      ln('M18 36 H30', '#241b13', 1.4) +
      ln('M12 26 Q12 12 24 12 Q36 12 36 26 Q36 34 31 37 L30 42 H18 L17 37 Q12 34 12 26 Z', OUT, 1.5) +
      det('M6 14 L12 20 L8 24 L3 18 Z', ab.m, '.7') + det('M42 14 L36 20 L40 24 L45 18 Z', ab.m, '.7');
  };

  /* 模拟纪元：沙漏 */
  JOB_SH.era_sim = function () {
    const w = PAL.wood, sd = PAL.grain, en = PAL.energy;
    return gsh(13) +
      sil('M11 6 H37 V10 H11 Z', w.m) +
      sil('M11 38 H37 V42 H11 Z', w.m) +
      det('M11 6 H37 V8.4 H11 Z', w.l) +
      ln('M11 6 H37 V10 H11 Z M11 38 H37 V42 H11 Z', OUT, 1.3) +
      sil('M14 10 H34 Q34 18 26 24 Q34 30 34 38 H14 Q14 30 22 24 Q14 18 14 10 Z', PAL.glass.m) +
      det('M17 13 H31 Q30 18 24 22 Q18 18 17 13 Z', sd.m) +
      det('M18 33 H30 Q29 37 24 40 Q19 37 18 33 Z', sd.m) +
      ln('M14 10 H34 Q34 18 26 24 Q34 30 34 38 H14 Q14 30 22 24 Q14 18 14 10 Z', OUT, 1.4) +
      ln('M24 24 V30', sd.d, 1.2, '.8') +
      ci(24, 24, 2, en.l, ' opacity=".8"');
  };

  /* ============================================================
   * 被动图标：住房 6 / 舒适 16 / 工事 14（按中文名索引）
   * ============================================================ */
  const PASS_SH = {};

  /* 一排砖缝 */
  function courses(x, y, w, h, rows, col, op) {
    let s2 = '';
    for (let i = 1; i < rows; i++) s2 += ln('M' + x + ' ' + (y + h * i / rows) + ' H' + (x + w), col, .9, op || '.45');
    return s2;
  }

  /* 住房：茅草棚 */
  PASS_SH.hut = function () {
    const th = PAL.hay, wa = PAL.clay, w = PAL.wood;
    return gsh(15) +
      sil('M8 24 H40 V41 H8 Z', wa.m) +
      det('M8 24 H40 V26 H8 Z', wa.l) +
      ln('M8 24 H40 V41 H8 Z', OUT, 1.5) +
      sil('M6 26 L14 9 L34 9 L42 26 Z', th.m) +
      det('M6 26 L14 9 L34 9 L42 26 L24 22 Z', th.l) +
      ln('M6 26 L14 9 H34 L42 26 Z', OUT, 1.6) +
      ln('M12 24 L17 11 M20 25 L22 10 M30 25 L28 10 M36 24 L32 11', th.d, 1.1, '.7') +
      sil('M19 32 H29 V41 H19 Z', w.m) +
      det('M19 32 H29 V34 H19 Z', w.l) +
      ln('M19 32 H29 V41 H19 Z', OUT, 1.3) +
      ci(25.6, 37, .9, PAL.gold.m);
  };

  /* 住房：长屋 */
  PASS_SH.longhouse = function () {
    const w = PAL.wood, b = PAL.bark, th = PAL.hay;
    return gsh(16) +
      sil('M6 24 H42 V41 H6 Z', w.m) +
      det('M6 24 H42 V28 H6 Z', w.l) +
      ln('M6 24 H42 V41 H6 Z', OUT, 1.5) +
      ln('M14 28 V41 M24 28 V41 M34 28 V41', b.d, 1.6) +
      sil('M4 26 L24 10 L44 26 Z', th.m) +
      det('M4 26 L24 10 L44 26 L24 22 Z', th.d) +
      ln('M4 26 L24 10 L44 26 Z', OUT, 1.6) +
      ln('M24 10 V26', th.d, 1.1) +
      sil('M19 33 H29 V41 H19 Z', b.d) +
      ln('M19 33 H29 V41 H19 Z', OUT, 1.2) +
      det('M9 31 H15 V35 H9 Z', PAL.glass.m) + det('M33 31 H39 V35 H33 Z', PAL.glass.m) +
      ln('M9 31 H15 V35 H9 Z M33 31 H39 V35 H33 Z', OUT, 1.1);
  };

  /* 住房：石屋 */
  PASS_SH.stonehouse = function () {
    const s = PAL.granite, r = PAL.carpet, st = PAL.stone;
    return gsh(15) +
      sil('M8 21 H40 V41 H8 Z', s.m) +
      det('M8 21 H40 V24 H8 Z', s.l) +
      det('M8 36 H40 V41 H8 Z', s.d) +
      ln('M8 21 H40 V41 H8 Z', OUT, 1.5) +
      courses(8, 24, 32, 12, 4, s.d) +
      ln('M14 27 V33 M24 27 V33 M20 30 V36', s.d, .9, '.35') +
      sil('M5 23 L17 11 H31 L43 23 Z', r.m) +
      det('M5 23 L17 11 H31 L43 23 L24 19 Z', r.l) +
      ln('M5 23 L17 11 H31 L43 23 Z', OUT, 1.5) +
      sil('M33 14 H38 V21 H33 Z', st.m) +
      ln('M33 14 H38 V21 H33 Z', OUT, 1.2) +
      sil('M20 32 H28 V41 H20 Z', PAL.bark.m) +
      ln('M20 32 H28 V41 H20 Z', OUT, 1.2) +
      ci(26.4, 37, .9, PAL.gold.m);
  };

  /* 住房：公寓 */
  PASS_SH.apartment = function () {
    const c = PAL.concrete, g = PAL.glass, st = PAL.steel;
    let win = '';
    for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 2; c2++) {
      win += det('M' + (16 + c2 * 10) + ' ' + (16 + r2 * 6.4) + ' H' + (22 + c2 * 10) + ' V' + (19.4 + r2 * 6.4) + ' H' + (16 + c2 * 10) + ' Z', g.m);
    }
    return gsh(15) +
      sil('M12 9 H36 V41 H12 Z', c.m) +
      det('M12 9 H36 V12 H12 Z', c.d) +
      det('M12 37 H36 V41 H12 Z', c.d) +
      ln('M12 9 H36 V41 H12 Z', OUT, 1.5) +
      win +
      ln('M16 16 H22 V19.4 H16 Z M26 16 H32 V19.4 H26 Z', g.d, .9) +
      sil('M19 34 H29 V41 H19 Z', PAL.bark.d) +
      ln('M19 34 H29 V41 H19 Z', OUT, 1.2) +
      ln('M24 9 V3 M20 3 H28', st.d, 1.6) +
      ci(24, 2.4, 1.4, PAL.potionRed.l);
  };

  /* 住房：住宅区 */
  PASS_SH.district = function () {
    const c = PAL.concrete, g = PAL.glass, s = PAL.granite;
    let win = '';
    for (let r2 = 0; r2 < 3; r2++) win += det('M' + (27) + ' ' + (22 + r2 * 5) + ' H31 V' + (24.6 + r2 * 5) + ' H27 Z', g.m);
    return gsh(16) +
      sil('M4 26 H16 V41 H4 Z', s.m) + det('M4 26 H16 V29 H4 Z', s.l) +
      ln('M4 26 H16 V41 H4 Z', OUT, 1.4) +
      sil('M17 15 H31 V41 H17 Z', c.m) + det('M17 15 H31 V18 H17 Z', c.l) +
      det('M26 21 H29 V24 H26 Z M26 26 H29 V29 H26 Z M26 31 H29 V34 H26 Z', g.m) +
      ln('M17 15 H31 V41 H17 Z', OUT, 1.4) +
      sil('M32 24 H44 V41 H32 Z', PAL.carpet.m) + det('M32 24 H44 V27 H32 Z', PAL.carpet.l) +
      ln('M32 24 H44 V41 H32 Z', OUT, 1.4) +
      ln('M35 31 H41 V35 H35 Z', PAL.carpet.d, 1.2) +
      ci(21, 37, 1.6, PAL.gold.m) + ci(39, 37, 1.4, PAL.gold.m);
  };

  /* 住房：殖民舱 */
  PASS_SH.colony = function () {
    const al = PAL.lifeSupport, en = PAL.energy, st = PAL.steel;
    return gsh(14) +
      sil('M10 20 Q24 8 38 20 V34 Q24 46 10 34 Z', al.m) +
      det('M10 20 Q24 8 38 20 V25 Q24 14 10 25 Z', al.l) +
      det('M10 33 Q24 44 38 33 V34 Q24 46 10 34 Z', al.d) +
      ln('M10 20 Q24 8 38 20 V34 Q24 46 10 34 Z', OUT, 1.5) +
      ci(24, 26, 8, PAL.glass.m) + ci(24, 26, 6.4, PAL.glass.l) +
      ci(24, 26, 8, 'none', ' stroke="' + OUT + '" stroke-width="1.4"') +
      hl('M20 21 Q22 19 25 20 Q21 22 20 26 Z', '.5') +
      ln('M14 38 L10 44 M34 38 L38 44', st.d, 2) +
      ln('M24 12 V4 M20 6 H28', st.d, 1.4) +
      ci(24, 3.4, 1.5, en.l);
  };

  /* 舒适：陶罐装饰 */
  PASS_SH.potdecor = function () {
    const c = PAL.clay;
    return gsh(12) +
      sil('M17 12 Q13 16 14 22 Q8 28 12 36 Q16 42 24 42 Q32 42 36 36 Q40 28 34 22 Q35 16 31 12 Z', c.m) +
      det('M17 12 Q13 16 14 22 Q8 28 12 36 Q16 42 24 42 L24 12 Z', c.l) +
      det('M17 12 H31 V15 H17 Z', c.d) +
      det('M11 26 Q14 30 11 34 Q9 30 11 26 Z M37 26 Q34 30 37 34 Q39 30 37 26 Z', c.d, '.8') +
      ln('M17 12 Q13 16 14 22 Q8 28 12 36 Q16 42 24 42 Q32 42 36 36 Q40 28 34 22 Q35 16 31 12 Z', OUT, 1.5) +
      ln('M15 22 H33 M16 30 H32', c.d, 1.1, '.7') +
      ci(24, 19, 2, PAL.potionGold.m);
  };

  /* 舒适：木床 */
  PASS_SH.bed = function () {
    const w = PAL.plank, cl = PAL.linen, bl = PAL.carpet;
    return gsh(14) +
      sil('M5 30 H43 V38 H5 Z', w.m) +
      det('M5 30 H43 V32 H5 Z', w.l) +
      ln('M5 30 H43 V38 H5 Z', OUT, 1.4) +
      sil('M8 22 H20 V30 H8 Z', cl.m) +
      det('M8 22 H20 V24.6 H8 Z', cl.l) +
      ln('M8 22 H20 V30 H8 Z', OUT, 1.2) +
      sil('M20 24 H40 V31 H20 Z', bl.m) +
      det('M20 24 H40 V27 H20 Z', bl.l) +
      ln('M20 24 H40 V31 H20 Z', OUT, 1.3) +
      ln('M5 38 V42 M43 38 V42', w.d, 2.2) +
      sil('M4 20 H8 V30 H4 Z', w.d) + sil('M40 27 H44 V30 H40 Z', w.d);
  };

  /* 舒适：木地板 */
  PASS_SH.woodfloor = function () {
    const w = PAL.plank;
    let s2 = '';
    for (let i = 0; i < 3; i++) s2 += ln('M15 ' + (15 + i * 7.4) + ' L33 ' + (15 + i * 7.4 - 3.2), w.d, 1);
    return gsh(0) +
      sil('M8 32 L24 22 L40 32 L24 42 Z', w.m) +
      det('M8 32 L24 22 L40 32 L24 34 Z', w.l) +
      det('M8 32 L24 34 L24 42 Z', w.d) +
      ln('M8 32 L24 22 L40 32 L24 42 Z', OUT, 1.4) +
      s2 +
      ln('M24 22 V42', w.d, .8, '.5');
  };

  /* 舒适：地毯 */
  PASS_SH.rugo = function () {
    const cp = PAL.carpet, gd = PAL.potionGold;
    let fr = '';
    for (let i = 0; i < 5; i++) fr += ln('M' + (9 + i * 6) + ' 36 V40', cp.d, 1.3);
    return gsh(13) +
      sil('M7 12 H41 V36 H7 Z', cp.m) +
      det('M7 12 H41 V15 H7 Z', cp.l) +
      det('M11 18 H37 V21 H11 Z', gd.m) + det('M11 27 H37 V30 H11 Z', gd.m) +
      det('M20 21 H28 V27 H20 Z', gd.d) +
      ln('M7 12 H41 V36 H7 Z', OUT, 1.5) +
      fr;
  };

  /* 舒适：纸窗 */
  PASS_SH.paperwindow = function () {
    const w = PAL.wood, p = PAL.paper;
    return gsh(0) +
      sil('M9 8 H39 V40 H9 Z', w.m) +
      det('M12 11 H36 V37 H12 Z', p.m) +
      det('M12 11 H36 V14 H12 Z', p.l) +
      ln('M12 11 H36 V37 H12 Z', p.d, .9) +
      ln('M9 8 H39 V40 H9 Z', OUT, 1.5) +
      ln('M12 24 H36 M24 11 V37', w.d, 2) +
      ln('M14 14 H22 V22 H14 Z M26 14 H34 V22 H26 Z M14 26 H22 V34 H14 Z M26 26 H34 V34 H26 Z', w.d, .9, '.45') +
      ci(35, 34, 1.6, PAL.potionGold.m);
  };

  /* 舒适：木制家具 */
  PASS_SH.furniture = function () {
    const w = PAL.plank, b = PAL.bark;
    return gsh(14) +
      sil('M6 22 H30 V26 H6 Z', w.m) +
      det('M6 22 H30 V24 H6 Z', w.l) +
      ln('M6 22 H30 V26 H6 Z', OUT, 1.3) +
      ln('M9 26 V38 M27 26 V38', b.d, 2.2) +
      sil('M32 12 H44 V22 H32 Z', w.m) +
      det('M32 12 H44 V14 H32 Z', w.l) +
      ln('M32 12 H44 V22 H32 Z', OUT, 1.2) +
      ln('M35 22 V30 M41 22 V30', b.d, 2) +
      sil('M32 28 H44 V31 H32 Z', w.m) +
      ci(35, 20, 1.2, PAL.cloth.m);
  };

  /* 舒适：石地板 */
  PASS_SH.stonefloor = function () {
    const s = PAL.granite;
    return gsh(0) +
      pa('M8 32 L24 22 L40 32 L24 42 Z', s.m) +
      det('M8 32 L24 22 L24 32 L8 42 Z', s.l, '.85') +
      det('M24 22 L40 32 L24 42 L24 32 Z', s.d, '.55') +
      ln('M8 32 L24 22 L40 32 L24 42 Z', OUT, 1.4) +
      ln('M16 27 L16 37 M32 27 L32 37', '#463f38', 1.1, '.75') +
      ln('M24 22 L24 42', '#463f38', 1, '.75');
  };

  /* 舒适：台球桌 */
  PASS_SH.pooltable = function () {
    const f = PAL.plank, felt = PAL.pcb;
    return gsh(14) +
      sil('M5 20 H43 V34 H5 Z', f.m) +
      det('M7 22 H41 V32 H7 Z', felt.m) +
      det('M7 22 H41 V24 H7 Z', felt.l) +
      ln('M5 20 H43 V34 H5 Z', OUT, 1.4) +
      ln('M9 22 V32 M39 22 V32', felt.d, 1) +
      ci(14, 27, 2.4, '#f4f2ea') + ci(24, 25.6, 2.4, PAL.potionRed.m) + ci(33, 28, 2.4, PAL.potionGold.m) +
      ln('M5 34 V39 M43 34 V39', f.d, 2.2) +
      ln('M30 16 L44 8', PAL.wood.l, 2.2);
  };

  /* 舒适：塑料家具 */
  PASS_SH.plasticfurniture = function () {
    const p = PAL.plastic;
    return gsh(14) +
      sil('M7 18 Q7 13 13 13 H35 Q41 13 41 18 V26 H7 Z', p.m) +
      det('M9 16 H39 V18 H9 Z', p.l, '.7') +
      ln('M7 18 Q7 13 13 13 H35 Q41 13 41 18 V26 H7 Z', OUT, 1.4) +
      sil('M8 25 H40 Q40 36 24 36 Q8 36 8 25 Z', p.m) +
      det('M8 25 H40 V27.6 H8 Z', p.l) +
      ln('M8 25 H40 Q40 36 24 36 Q8 36 8 25 Z', OUT, 1.4) +
      sil('M4 20 H9 V34 H4 Z', p.d) + sil('M39 20 H44 V34 H39 Z', p.d) +
      ln('M4 20 H9 V34 H4 Z M39 20 H44 V34 H39 Z', OUT, 1.2) +
      ln('M12 36 V41 M36 36 V41', p.d, 2.2) +
      ln('M24 26 V32', p.d, 1, '.6');
  };

  /* 舒适：瓷砖地板 */
  PASS_SH.tilefloor = function () {
    const lt = '#dbe4ea', md = '#c3cfd8', dk = '#9fb0bd', gr = '#5b6672';
    return gsh(0) +
      pa('M8 32 L24 22 L40 32 L24 42 Z', md) +
      det('M8 32 L24 22 L24 32 L8 42 Z', lt) +
      det('M24 22 L40 32 L24 42 L24 32 Z', dk) +
      ln('M8 32 L24 22 L40 32 L24 42 Z', OUT, 1.4) +
      ln('M16 27 L32 37 M32 27 L16 37', gr, 1.2, '.85') +
      ln('M24 22 L24 42', gr, 1, '.7');
  };

  /* 舒适：电气娱乐 */
  PASS_SH.tv = function () {
    const d = PAL.chip, st = PAL.machine, en = PAL.energy;
    return gsh(13) +
      sil('M6 14 H38 V32 H6 Z', d.m) +
      det('M8 16 H36 V30 H8 Z', en.d) +
      det('M10 18 H34 V28 H10 Z', en.m, '.8') +
      ln('M6 14 H38 V32 H6 Z', OUT, 1.5) +
      ln('M10 24 Q15 18 20 24 Q25 30 30 22', '#eafcff', 1.3, '.8') +
      ln('M22 8 L16 3 M22 8 L29 3', st.m, 1.6) +
      ci(22, 7, 2, st.m) +
      ln('M12 32 V38 M32 32 V38 M8 38 H36', st.d, 2) +
      ci(35, 17, 1, PAL.potionRed.l);
  };

  /* 舒适：合成地板 */
  PASS_SH.synthfloor = function () {
    const d = PAL.chip, en = PAL.energy;
    return gsh(0) +
      sil('M8 32 L24 22 L40 32 L24 42 Z', d.m) +
      det('M8 32 L24 22 L24 32 L8 42 Z', d.l) +
      det('M24 22 L40 32 L24 42 Z', '#171c22') +
      ln('M8 32 L24 22 L40 32 L24 42 Z', OUT, 1.4) +
      ln('M8 32 L24 42 M24 22 L40 32', en.m, 1.5, '.95') +
      ln('M16 27 L16 37 M32 27 L32 37', en.m, 1, '.7') +
      ci(24, 23, 4, en.m, ' opacity=".22"');
  };

  /* 舒适：AI 家电 */
  PASS_SH.aiappliance = function () {
    const p = PAL.power, en = PAL.energy, ch = PAL.chip;
    return gsh(13) +
      sil('M13 20 Q13 12 24 12 Q35 12 35 20 V36 Q35 42 24 42 Q13 42 13 36 Z', p.m) +
      det('M13 20 Q13 12 24 12 Q35 12 35 20 V23 H13 Z', p.l) +
      det('M18 25 H30 V31 H18 Z', ch.m) +
      ci(21.4, 28, 1.6, en.l) + ci(26.6, 28, 1.6, en.l) +
      ln('M13 20 Q13 12 24 12 Q35 12 35 20 V36 Q35 42 24 42 Q13 42 13 36 Z', OUT, 1.5) +
      ln('M24 12 V5', OUT, 1.6) + ci(24, 4, 1.8, en.l) +
      ln('M37 22 Q41 18 37 14 M40 24 Q45 18 40 12', en.m, 1.4, '.75');
  };

  /* 舒适：全息娱乐 */
  PASS_SH.holoent = function () {
    const en = PAL.optical, pl = PAL.plasma;
    return gsh(13) +
      sil('M11 30 H37 V36 H11 Z', PAL.machine.m) +
      det('M11 30 H37 V32 H11 Z', PAL.machine.l) +
      ln('M11 30 H37 V36 H11 Z', OUT, 1.4) +
      det('M14 30 L20 14 L28 14 L34 30 Z', en.m, '.28') +
      det('M19 30 L23 18 L25 18 L29 30 Z', en.l, '.18') +
      sil('M20 8 L28 8 L27 16 L21 16 Z', pl.m) +
      ci(24, 12, 2.2, '#fff', ' opacity=".85"') +
      ln('M20 8 L28 8 L27 16 L21 16 Z', OUT, 1.2) +
      ln('M15 36 V41 M33 36 V41', PAL.machine.d, 1.8) +
      ci(24, 22, 8, en.m, ' opacity=".10"');
  };

  /* 舒适：全息地板 */
  PASS_SH.holofloor = function () {
    const en = PAL.optical, pl = PAL.plasma;
    return gsh(0) +
      sil('M6 34 L24 24 L42 34 L24 44 Z', 'none') +
      det('M6 34 L24 24 L42 34 L24 44 Z', en.m, '.16') +
      ln('M6 34 L24 24 L42 34 L24 44 Z', en.l, 1.6, '.95') +
      ln('M15 29 L15 39 M33 29 L33 39 M24 24 V44', en.m, 1, '.75') +
      ci(24, 33, 7, pl.m, ' opacity=".18"') +
      ln('M18 33 H30 M24 27 V39', pl.l, 1.2, '.5') +
      ci(24, 34, 21, en.l, ' opacity=".06"');
  };

  /* 舒适：生命维持舱 */
  PASS_SH.lifepod = function () {
    const l = PAL.lifeSupport, g = PAL.glass, en = PAL.energy;
    return gsh(14) +
      sil('M9 16 Q24 6 39 16 V32 Q24 44 9 32 Z', l.m) +
      det('M9 16 Q24 6 39 16 V20 Q24 11 9 20 Z', l.l) +
      det('M9 30 Q24 41 39 30 V32 Q24 44 9 32 Z', l.d) +
      ln('M9 16 Q24 6 39 16 V32 Q24 44 9 32 Z', OUT, 1.5) +
      ci(24, 24, 9, g.d) + ci(24, 24, 7.6, g.m) +
      ci(24, 24, 9, 'none', ' stroke="' + OUT + '" stroke-width="1.4"') +
      sil('M21 19 Q24 17 27 19 Q28 22 24 22.6 Q20 22 21 19 Z', PAL.potionRed.m) +
      ln('M21 25 H27 M24 22.6 V27', PAL.potionRed.m, 1.3) +
      ln('M13 38 L10 44 M35 38 L38 44', PAL.steel.d, 1.8) +
      ln('M24 10 V3', PAL.steel.d, 1.3) + ci(24, 2.4, 1.4, en.l);
  };

  /* 工事：尖木陷阱 */
  PASS_SH.spiketrap = function () {
    const w = PAL.wood, b = PAL.bark, s = PAL.steel;
    let sp = '';
    for (let i = 0; i < 5; i++) {
      const x = 9 + i * 7;
      sp += sil('M' + x + ' 34 L' + (x + 2) + ' 14 L' + (x + 4) + ' 34 Z', i % 2 ? b.m : w.m);
    }
    return gsh(15) +
      det('M6 34 H42 V40 H6 Z', PAL.tuber.d) +
      ln('M6 34 H42', OUT, 1.3) +
      sp +
      ln('M7 40 H41', OUT, 1.2) +
      det('M18 31 H30 V34 H18 Z', s.d);
  };

  /* 工事：陷坑 */
  PASS_SH.pit = function () {
    const b = PAL.bark, s = PAL.steel, e = PAL.tuber;
    return gsh(16) +
      sil('M4 29 Q24 22 44 29 L39 41 H9 Z', e.m) +
      det('M7 30 Q24 24 41 30 L38 34 H10 Z', e.l) +
      det('M10 31 Q24 26 38 31 L36 40 H12 Z', '#140d08') +
      ln('M4 29 Q24 22 44 29 L39 41 H9 Z', OUT, 1.4) +
      (function () {
        let s2 = '';
        for (let i = 0; i < 4; i++) {
          const x = 13 + i * 6.4, y = 40 - i * .4;
          s2 += sil('M' + x + ' ' + y + ' L' + (x + 2) + ' 34 L' + (x + 4) + ' ' + y + ' Z', s.m);
        }
        return s2;
      })() +
      ln('M6 29 L2 25 M42 29 L46 25', b.d, 2.2);
  };

  /* 工事：土垒 */
  PASS_SH.rampart = function () {
    const e = PAL.tuber, w = PAL.wood, b = PAL.bark;
    let st2 = '';
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 7.6;
      st2 += sil('M' + x + ' 30 L' + (x + 2) + ' 13 L' + (x + 4) + ' 30 Z', i % 2 ? b.m : w.m);
    }
    return gsh(16) +
      sil('M4 33 Q16 24 24 26 Q34 23 44 33 Q38 41 24 41 Q10 41 4 33 Z', e.m) +
      det('M8 33 Q18 28 24 29 Q32 27 40 33 Q33 37 24 37 Q15 37 8 33 Z', e.l) +
      ln('M4 33 Q16 24 24 26 Q34 23 44 33 Q38 41 24 41 Q10 41 4 33 Z', OUT, 1.4) +
      st2 +
      ln('M10 33 H38', w.d, 1.6);
  };

  /* 工事：石墙 */
  PASS_SH.stonewall = function () {
    const s = PAL.granite;
    let m = '';
    for (let i = 0; i < 4; i++) m += det('M' + (8 + i * 9) + ' 15 H' + (15 + i * 9) + ' V21 H' + (8 + i * 9) + ' Z', s.d, '.35');
    return gsh(15) +
      sil('M6 21 H42 V41 H6 Z', s.m) +
      det('M6 21 H42 V24 H6 Z', s.l) +
      ln('M6 21 H42 V41 H6 Z', OUT, 1.5) +
      courses(6, 24, 36, 17, 4, s.d) +
      ln('M13 24 V41 M24 24 V41 M35 24 V41', s.d, .9, '.4') +
      (function () {
        let c2 = '';
        for (let i = 0; i < 4; i++) c2 += sil('M' + (6 + i * 9) + ' 21 V15 H' + (13 + i * 9) + ' V21 Z', s.m);
        return c2;
      })() +
      ln('M6 21 V15 H13 V21 M15 21 V15 H22 V21 M24 21 V15 H31 V21 M33 21 V15 H40 V21', OUT, 1.3);
  };

  /* 工事：铁蒺藜 */
  PASS_SH.caltrops = function () {
    const s = PAL.steel;
    const one = (x, y, r2) => gp('translate(' + x + ' ' + y + ') rotate(' + r2 + ')',
      sil('M0 -9 L2.6 -2.4 L9 0 L2.6 2.4 L0 9 L-2.6 2.4 L-9 0 L-2.6 -2.4 Z', s.m) +
      det('M0 -9 L2.6 -2.4 L0 0 Z', s.l) +
      ci(0, 0, 2, '#241b13'));
    return gsh(14) +
      one(16, 26, 8) + one(33, 30, -22) + one(24, 38, 40) +
      ln('M6 41 H42', s.d, 1, '.35');
  };

  /* 工事：瞭望塔 */
  PASS_SH.watchtower = function () {
    const w = PAL.plank, b = PAL.bark, r = PAL.carpet;
    return gsh(15) +
      sil('M14 18 H34 V36 H14 Z', w.m) +
      det('M14 18 H34 V21 H14 Z', w.l) +
      ln('M14 18 H34 V36 H14 Z', OUT, 1.4) +
      ln('M14 36 L18 41 M34 36 L30 41', b.d, 2.4) +
      ln('M17 22 L31 34 M31 22 L17 34', b.d, 1.6) +
      sil('M10 14 H38 V19 H10 Z', b.m) +
      det('M10 14 H38 V16 H10 Z', b.l) +
      ln('M10 14 H38 V19 H10 Z', OUT, 1.4) +
      sil('M12 14 L24 5 L36 14 Z', r.m) +
      ln('M12 14 L24 5 L36 14 Z', OUT, 1.4) +
      ln('M24 5 V11', PAL.steel.d, 1.3) +
      det('M36 6 L44 8 L36 10 Z', PAL.potionGold.m) +
      det('M18 24 H22 V27 H18 Z M26 24 H30 V27 H26 Z', PAL.glass.m);
  };

  /* 工事：钢筋混凝土墙 */
  PASS_SH.concretewall = function () {
    const c = PAL.concrete, st = PAL.steel;
    return gsh(15) +
      sil('M6 20 H42 V41 H6 Z', c.m) +
      det('M6 20 H42 V23 H6 Z', c.l) +
      det('M6 37 H42 V41 H6 Z', c.d) +
      ln('M6 20 H42 V41 H6 Z', OUT, 1.5) +
      courses(6, 23, 36, 14, 3, c.d) +
      ln('M14 20 V41 M26 20 V41 M36 20 V41', c.d, .9, '.35') +
      ln('M18 20 V11 M24 20 V8 M30 20 V12 M36 20 V9', st.d, 1.5) +
      ln('M15 11 H21 M21 8 H27 M27 12 H33 M33 9 H39', st.l, 1.1, '.8') +
      det('M9 27 L14 31 L11 34 L16 37', '#2b2b31', 1.2) +
      ln('M9 27 L14 31 L11 34 L16 37', c.d, 1.1, '.8');
  };

  /* 工事：自动炮塔 */
  PASS_SH.turret = function () {
    const st = PAL.machine, d = PAL.chip, en = PAL.ember;
    return gsh(14) +
      sil('M10 36 H38 V41 H10 Z', d.m) +
      ln('M10 36 H38 V41 H10 Z', OUT, 1.3) +
      sil('M17 26 H31 L33 36 H15 Z', st.m) +
      det('M17 26 H31 V29 H17 Z', st.l) +
      ln('M17 26 H31 L33 36 H15 Z', OUT, 1.4) +
      sil('M13 15 H31 Q35 15 35 20 Q35 26 31 26 H13 Z', st.m) +
      det('M13 15 H31 V18.4 H13 Z', st.l) +
      ln('M13 15 H31 Q35 15 35 20 Q35 26 31 26 H13 Z', OUT, 1.4) +
      sil('M35 18 H43 V23 H35 Z', d.d) +
      ln('M35 18 H43 V23 H35 Z', OUT, 1.2) +
      ci(14, 21, 3, en.m) + ci(14, 21, 1.5, en.l) +
      ln('M24 26 V36', st.d, 2);
  };

  /* 工事：机枪碉堡 */
  PASS_SH.bunker = function () {
    const c = PAL.concrete, st = PAL.steel, sg = PAL.hemp;
    return gsh(15) +
      sil('M6 24 H38 V41 H6 Z', c.m) +
      det('M6 24 H38 V27 H6 Z', c.l) +
      det('M6 37 H38 V41 H6 Z', c.d) +
      ln('M6 24 H38 V41 H6 Z', OUT, 1.5) +
      det('M10 29 H26 V34 H10 Z', '#1b1b20') +
      ln('M10 29 H26 V34 H10 Z', OUT, 1.1) +
      sil('M26 30 H42 V33.6 H26 Z', st.d) +
      ln('M26 30 H42 V33.6 H26 Z', OUT, 1.1) +
      ln('M24 33.6 L22 36 M32 33.6 V36.6 M37 33.6 V36.6', st.d, 1.1) +
      ci(14, 22, 3.4, sg.m) + ci(20, 21, 3, sg.m) + ci(38, 38, 3.2, sg.m) +
      ln('M9 39 H20', c.d, 1, '.6');
  };

  /* 工事：合金要塞 */
  PASS_SH.alloyfort = function () {
    const a = PAL.titanium, en = PAL.energy, g = PAL.glass;
    return gsh(16) +
      sil('M8 22 H40 V37 H8 Z', a.m) +
      det('M8 22 H40 V25 H8 Z', a.l) +
      ln('M8 22 H40 V37 H8 Z', OUT, 1.4) +
      (function () {
        let s2 = '';
        for (let i = 0; i < 3; i++) {
          const x = 10 + i * 11;
          s2 += sil('M' + x + ' 22 V15 H' + (x + 7) + ' V22 Z', a.m);
        }
        return s2;
      })() +
      ln('M10 22 V15 H17 V22 M21 22 V15 H28 V22 M32 22 V15 H39 V22', OUT, 1.3) +
      det('M17 28 H23 V33 H17 Z M27 28 H33 V33 H27 Z', g.m) +
      ln('M17 28 H23 V33 H17 Z M27 28 H33 V33 H27 Z', OUT, 1.1) +
      ln('M12 30 H44', a.d, 1.2, '.5') +
      sil('M20 10 H28 V15 H20 Z', en.m) +
      ln('M20 10 H28 V15 H20 Z', OUT, 1.1) +
      ci(24, 12.4, 1.4, '#fff');
  };

  /* 工事：激光炮塔 */
  PASS_SH.laserturret = function () {
    const st = PAL.machine, en = PAL.energy;
    return gsh(14) +
      sil('M9 36 H39 V41 H9 Z', PAL.chip.m) +
      ln('M9 36 H39 V41 H9 Z', OUT, 1.2) +
      sil('M18 26 H30 L32 36 H16 Z', st.m) +
      ln('M18 26 H30 L32 36 H16 Z', OUT, 1.3) +
      sil('M16 16 H32 Q36 16 36 21 Q36 26 32 26 H16 Z', st.d) +
      det('M16 16 H32 V19.4 H16 Z', st.m) +
      ln('M16 16 H32 Q36 16 36 21 Q36 26 32 26 H16 Z', OUT, 1.4) +
      sil('M36 18 H41 V24 H36 Z', en.d) +
      ci(38.6, 21, 2.4, en.m) + ci(38.6, 21, 1.2, '#fff') +
      ln('M40 21 L46 15 M40 21 L46 27', en.l, 1.8, '.85') +
      det('M40 20 L46 15 L44 21 Z', en.l, '.5') +
      ci(24, 27, 8, en.m, ' opacity=".10"');
  };

  /* 工事：护盾塔 */
  PASS_SH.shieldtower = function () {
    const a = PAL.titanium, en = PAL.optical, pl = PAL.plasma;
    return gsh(15) +
      sil('M13 22 H35 V41 H13 Z', a.m) +
      det('M13 22 H35 V25 H13 Z', a.l) +
      det('M13 38 H35 V41 H13 Z', a.d) +
      ln('M13 22 H35 V41 H13 Z', OUT, 1.4) +
      ln('M20 25 V38 M28 25 V38', a.d, 1, '.45') +
      sil('M16 12 H32 L30 22 H18 Z', pl.m) +
      ln('M16 12 H32 L30 22 H18 Z', OUT, 1.3) +
      ci(24, 10, 3.2, en.m) + ci(24, 10, 1.6, '#fff') +
      gp('none', el(24, 24, 19, 21, 'none', ' stroke="' + en.m + '" stroke-width="1.6" stroke-dasharray="4 3" opacity=".75"')) +
      det('M22 8 Q24 4 26 8 Q28 5 30 9 Q26 12 24 12 Q20 12 19 9 Q21 5 22 8 Z', en.l, '.5');
  };

  /* 工事：战斗机器人 */
  PASS_SH.battlebot = function () {
    const st = PAL.machine, d = PAL.chip, en = PAL.potionRed;
    return gsh(14) +
      sil('M17 8 H31 V13 H17 Z', st.m) +
      det('M19 10 H29 V12 H19 Z', en.m) +
      ln('M17 8 H31 V13 H17 Z', OUT, 1.3) +
      sil('M14 13 H34 V29 H14 Z', st.m) +
      det('M14 13 H34 V17 H14 Z', st.l) +
      det('M19 19 H24 V23 H19 Z M26 19 H31 V23 H26 Z', en.d) +
      ln('M14 13 H34 V29 H14 Z', OUT, 1.4) +
      sil('M8 16 H13 V27 H8 Z', st.d) + sil('M35 16 H40 V27 H35 Z', st.d) +
      ln('M8 16 H13 V27 H8 Z M35 16 H40 V27 H35 Z', OUT, 1.2) +
      sil('M16 29 H22 V40 H16 Z', d.m) + sil('M26 29 H32 V40 H26 Z', d.m) +
      ln('M16 29 H22 V40 H16 Z M26 29 H32 V40 H26 Z', OUT, 1.2) +
      ln('M12 29 V34 M36 29 V34', st.d, 2.2) +
      ci(24, 15, 1.4, PAL.energy.l);
  };

  /* 工事：轨道防御平台 */
  PASS_SH.orbital = function () {
    const a = PAL.titanium, en = PAL.energy, st = PAL.steel;
    return gsh(14) +
      det('M4 36 Q24 24 44 36 Q44 44 24 44 Q4 44 4 36 Z', PAL.alien.d, '.9') +
      ln('M4 36 Q24 24 44 36', PAL.alien.m, 1.4, '.85') +
      sil('M12 20 H36 V27 H12 Z', a.m) +
      det('M12 20 H36 V22.4 H12 Z', a.l) +
      ln('M12 20 H36 V27 H12 Z', OUT, 1.3) +
      sil('M8 15 H20 V20 H8 Z', a.d) + sil('M28 15 H40 V20 H28 Z', a.d) +
      ln('M8 15 H20 V20 H8 Z M28 15 H40 V20 H28 Z', OUT, 1.2) +
      sil('M20 12 H28 V16 H20 Z', en.m) +
      ln('M20 12 H28 V16 H20 Z', OUT, 1.1) +
      ci(24, 14, 1.3, '#fff') +
      ln('M14 27 L10 33 M34 27 L38 33', st.d, 1.6) +
      ci(8, 12, 1.2, '#fff', ' opacity=".8"') + ci(42, 10, 1, '#fff', ' opacity=".6"') +
      ci(36, 6, .9, '#fff', ' opacity=".5"');
  };

  /* ============================================================
   * 导航图标（左侧栏）
   * ============================================================ */
  const NAV_SH = {
    housing: function () {
      return sil('M7 23 H41 V41 H7 Z', PAL.clay.m) +
        det('M7 23 H41 V25.4 H7 Z', PAL.clay.l) +
        ln('M7 23 H41 V41 H7 Z', OUT, 1.5) +
        sil('M4 25 L24 8 L44 25 Z', PAL.carpet.m) +
        ln('M4 25 L24 8 L44 25 Z', OUT, 1.5) +
        sil('M19 32 H29 V41 H19 Z', PAL.bark.d) +
        ln('M19 32 H29 V41 H19 Z', OUT, 1.2);
    },
    defense: function () {
      return sil('M24 4 L40 10 V24 Q40 37 24 44 Q8 37 8 24 V10 Z', PAL.steel.m) +
        det('M24 8 L36 12.6 V24 Q36 34 24 40 Z', PAL.steel.l) +
        ln('M24 4 L40 10 V24 Q40 37 24 44 Q8 37 8 24 V10 Z', OUT, 1.6) +
        sil('M20 17 H28 V23 H34 V31 H28 V37 H20 V31 H14 V23 H20 Z', PAL.potionRed.m) +
        ln('M20 17 H28 V23 H34 V31 H28 V37 H20 V31 H14 V23 H20 Z', OUT, 1.2);
    },
    shop: function () {
      let aw = '';
      for (let i = 0; i < 4; i++) aw += det('M' + (8 + i * 8) + ' 14 H' + (16 + i * 8) + ' L' + (14 + i * 8) + ' 22 H' + (10 + i * 8) + ' Z', i % 2 ? PAL.carpet.l : PAL.linen.m);
      return sil('M8 22 H40 V26 H8 Z', PAL.wood.m) +
        ln('M8 22 H40 V26 H8 Z', OUT, 1.3) +
        aw +
        ln('M6 14 H42 L40 22 H8 Z', OUT, 1.4) +
        ln('M8 26 V41 M40 26 V41 M8 39 H40', PAL.wood.d, 1.8) +
        ci(20, 32, 3.2, PAL.potionGold.m) + ci(28, 33, 2.6, PAL.potionGreen.m);
    },
    characters: function () {
      const h = (x, y, r2) => ci(x, y, r2, PAL.clay.m) + ln('M' + (x - r2) + ' ' + (y + r2 + 2) + ' Q' + x + ' ' + (y + r2 * 2 + 4) + ' ' + (x + r2) + ' ' + (y + r2 + 2), PAL.clay.d, 2.6);
      return ci(17, 17, 7, PAL.clay.m) + det('M11 18 Q17 12 23 18 L23 22 H11 Z', PAL.clay.l) +
        ln('M10 17 A7 7 0 0 1 24 17 L24 27 Q17 31 10 27 Z', OUT, 1.4) +
        ci(32, 20, 5.4, PAL.linen.m) + ln('M27 20 A5.4 5.4 0 0 1 37 20 L37 27 Q32 30 27 27 Z', OUT, 1.3) +
        sil('M6 30 Q17 24 28 30 L28 40 H6 Z', PAL.pcb.m) +
        det('M6 30 Q17 24 28 30 L28 33 Q17 28 6 33 Z', PAL.pcb.l) +
        ln('M6 30 Q17 24 28 30 L28 40 H6 Z', OUT, 1.4) +
        sil('M27 31 Q34 26 42 31 L42 39 Q34 42 27 39 Z', PAL.machine.m) +
        ln('M27 31 Q34 26 42 31 L42 39 Q34 42 27 39 Z', OUT, 1.3);
    },
    codex: function () {
      return sil('M6 10 Q16 6 24 10 Q32 6 42 10 V34 Q32 30 24 34 Q16 30 6 34 Z', PAL.bookInfo.m) +
        det('M6 10 Q16 6 24 10 V34 Q16 30 6 34 Z', PAL.bookInfo.l) +
        det('M24 10 Q32 6 42 10 V34 Q32 30 24 34 Z', PAL.bookInfo.d) +
        ln('M6 10 Q16 6 24 10 Q32 6 42 10 V34 Q32 30 24 34 Q16 30 6 34 Z', OUT, 1.5) +
        ln('M24 10 V34', OUT, 1.3) +
        ln('M11 15 H19 M11 20 H19 M11 25 H18', PAL.linen.l, 1.3) +
        ln('M29 15 H37 M29 20 H37', PAL.linen.l, 1.3);
    },
    recruit: function () {
      return sil('M24 4 L38 16 L30 42 H18 L10 16 Z', PAL.shardBlue.m) +
        det('M24 4 L38 16 L24 24 Z', PAL.shardBlue.l) +
        det('M10 16 L24 24 L18 42 Z', PAL.shardBlue.d) +
        ln('M24 4 L38 16 L30 42 H18 L10 16 Z', OUT, 1.5) +
        ln('M24 4 L24 24 M10 16 H38', OUT, 1.1) +
        ci(24, 20, 8, '#fff', ' opacity=".12"');
    },
    warehouse: function () {
      return sil('M8 20 H40 V41 H8 Z', PAL.plank.m) +
        det('M8 20 H40 V23 H8 Z', PAL.plank.l) +
        ln('M8 20 H40 V41 H8 Z', OUT, 1.5) +
        ln('M8 27 H40 M8 34 H40 M17 20 V41 M31 20 V41', PAL.plank.d, 1.4) +
        sil('M18 8 H30 V20 H18 Z', PAL.bark.m) +
        ln('M18 8 H30 V20 H18 Z', OUT, 1.3) +
        det('M22 4 H26 V8 H22 Z', PAL.steel.d);
    },
  };

  /* ============================================================
   * 名称 → 形状 表（被动按中文名索引，和 passives.js 一致）
   * ============================================================ */
  const PASS_SPEC = {
    /* 住房 6 */
    '茅草棚': 'hut', '长屋': 'longhouse', '石屋': 'stonehouse',
    '公寓': 'apartment', '住宅区': 'district', '殖民舱': 'colony',
    /* 舒适度 16 */
    '陶罐装饰': 'potdecor', '木床': 'bed', '木地板': 'woodfloor', '地毯': 'rugo',
    '纸窗': 'paperwindow', '木制家具': 'furniture', '石地板': 'stonefloor', '台球桌': 'pooltable',
    '塑料家具': 'plasticfurniture', '瓷砖地板': 'tilefloor', '电气娱乐': 'tv', '合成地板': 'synthfloor',
    'AI 家电': 'aiappliance', 'AI家电': 'aiappliance', '全息娱乐': 'holoent', '全息地板': 'holofloor',
    '生命维持舱': 'lifepod',
    /* 工事 14 */
    '尖木陷阱': 'spiketrap', '陷坑': 'pit', '土垒': 'rampart', '石墙': 'stonewall',
    '铁蒺藜': 'caltrops', '瞭望塔': 'watchtower', '钢筋混凝土墙': 'concretewall', '自动炮塔': 'turret',
    '机枪碉堡': 'bunker', '合金要塞': 'alloyfort', '激光炮塔': 'laserturret', '护盾塔': 'shieldtower',
    '战斗机器人': 'battlebot', '轨道防御平台': 'orbital',
  };

  /* ---------- 渲染入口：工作 / 被动 / 导航 ---------- */
  function job(x) {
    const j = typeof x === 'string' ? null : x;
    const id = typeof x === 'string' ? x : (j && j.id);
    if (!id) return svgWrap(SH.box(PAL.wood));
    if (cache['j:' + id]) return cache['j:' + id];
    const fn = JOB_SH[id];
    let out;
    try { out = fn ? fn(PAL.wood, rng('job:' + id)) : SH.box(PAL.wood); } catch (e) { out = SH.box(PAL.wood); }
    if (!out) out = SH.box(PAL.wood);
    cache['j:' + id] = svgWrap(out);
    return cache['j:' + id];
  }

  function passive(x) {
    const name = typeof x === 'string' ? x : (x && x.name);
    if (!name) return svgWrap(SH.box(PAL.stone));
    const k = 'p:' + name;
    if (cache[k]) return cache[k];
    const shape = PASS_SPEC[name];
    const fn = shape && PASS_SH[shape];
    let out;
    try { out = fn ? fn() : SH.box(PAL.stone); } catch (e) { out = SH.box(PAL.stone); }
    if (!out) out = SH.box(PAL.stone);
    cache[k] = svgWrap(out);
    return cache[k];
  }

  const NAV_ALIAS = { home: 'housing', city: 'housing', house: 'housing', fight: 'defense', market: 'shop', people: 'characters', chars: 'characters', book: 'codex', gacha: 'recruit', shard: 'recruit', storage: 'warehouse', items: 'warehouse' };
  function nav(key) {
    const k = NAV_ALIAS[key] || key;
    if (cache['n:' + k]) return cache['n:' + k];
    const fn = NAV_SH[k];
    let out;
    try { out = fn ? fn() : SH.box(PAL.stone); } catch (e) { out = SH.box(PAL.stone); }
    if (!out) out = SH.box(PAL.stone);
    cache['n:' + k] = svgWrap(out);
    return cache['n:' + k];
  }

  /* __SHAPES__ */

  window.ICONS = {
    item, enemy, job, passive, nav, SPEC, PAL, SH, ENEMY_SPEC, JOB_SH, PASS_SPEC, PASS_SH, NAV_SH,
    nameToId: n => NAME2ID[n] || null,
    missing() {
      const out = Object.keys(SPEC).filter(id => !SH[SPEC[id][0]]).concat(
        Object.keys(ENEMY_SPEC).filter(id => !ENEMY_SH[ENEMY_SPEC[id][0]])
      );
      const jobs = (window.JOBS || []).filter(j => !JOB_SH[j.id]).map(j => 'J:' + j.id);
      const ps = [].concat(window.HOUSING || [], window.COMFORT || [], window.FORTS || [])
        .filter(p => !PASS_SH[PASS_SPEC[p.name]]).map(p => 'P:' + p.name);
      const ns = ['housing', 'defense', 'shop', 'characters', 'codex', 'recruit', 'warehouse']
        .filter(k => !NAV_SH[k]).map(k => 'N:' + k);
      return out.concat(jobs, ps, ns);
    },
  };
})();
