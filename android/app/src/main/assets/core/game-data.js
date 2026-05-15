// ================================================================
// 技能碎片映射（trait → 碎片 → 合成技能）
// ================================================================
const fragmentSkillMap={
'吸血':{fragName:'吸血碎片',fragIcon:'🩸',skill:{name:'生命汲取',icon:'🩸',desc:'治愈攻击伤害的30%',maxUses:2,effectId:'healOnHit'}},
'狂暴':{fragName:'狂暴碎片',fragIcon:'💢',skill:{name:'暴怒一击',icon:'💢',desc:'下次攻击伤害×2',maxUses:1,effectId:'nextAtkX2'}},
'再生':{fragName:'再生碎片',fragIcon:'🌿',skill:{name:'紧急修复',icon:'🌿',desc:'立即回复25%MaxHP',maxUses:2,effectId:'healNow25'}},
'护甲':{fragName:'护甲碎片',fragIcon:'🛡',skill:{name:'临时护盾',icon:'🛡',desc:'3回合受伤-50%',maxUses:1,effectId:'shield'}},
'暴击':{fragName:'暴击碎片',fragIcon:'💥',skill:{name:'必杀之心',icon:'💥',desc:'下次攻击必定暴击×2',maxUses:2,effectId:'guaranteedCrit'}},
'毒素':{fragName:'毒素碎片',fragIcon:'🧪',skill:{name:'剧毒释放',icon:'🧪',desc:'敌每回合-8%HP 持续3回合',maxUses:1,effectId:'poisonDot'}},
'相位':{fragName:'相位碎片',fragIcon:'👻',skill:{name:'虚空闪避',icon:'👻',desc:'2回合完全闪避',maxUses:1,effectId:'dodge'}},
'电击':{fragName:'电击碎片',fragIcon:'⚡',skill:{name:'电弧释放',icon:'⚡',desc:'ATK×50%伤害+眩晕1回合',maxUses:2,effectId:'shockStun'}},
'恐惧':{fragName:'恐惧碎片',fragIcon:'😱',skill:{name:'心灵震慑',icon:'😱',desc:'敌ATK-30%全场',maxUses:1,effectId:'fearDebuff'}},
'不死':{fragName:'不死碎片',fragIcon:'💀',skill:{name:'死亡拒绝',icon:'💀',desc:'本场死亡时50%HP复活',maxUses:1,effectId:'extraRevive'}},
'撕裂':{fragName:'撕裂碎片',fragIcon:'🔪',skill:{name:'致命撕裂',icon:'🔪',desc:'敌每回合-10%HP全场',maxUses:1,effectId:'heavyBleed'}},
'反击':{fragName:'反击碎片',fragIcon:'🔄',skill:{name:'完美格挡',icon:'🔄',desc:'下次受击反弹100%',maxUses:2,effectId:'perfectCounter'}},
'迅捷':{fragName:'迅捷碎片',fragIcon:'💨',skill:{name:'疾风突刺',icon:'💨',desc:'下次攻击×1.8 且本回合免反击',maxUses:2,effectId:'fastStrike'}},
'厚皮':{fragName:'厚皮碎片',fragIcon:'🪨',skill:{name:'棘甲',icon:'🪨',desc:'3回合内反弹受到伤害的50%',maxUses:1,effectId:'thornShield3'}},
'忠诚':{fragName:'忠诚碎片',fragIcon:'🐕',skill:{name:'忠诚守护',icon:'🐕',desc:'切换形态自动回满血（被动消耗）',maxUses:2,effectId:'switchFullHeal'}},
'弹性':{fragName:'弹性碎片',fragIcon:'🦎',skill:{name:'弹性反弹',icon:'🦎',desc:'下次受击伤害归0并反弹原值',maxUses:1,effectId:'dodgeReflect'}},
'蛛网':{fragName:'蛛网碎片',fragIcon:'🕸',skill:{name:'蛛网陷阱',icon:'🕸',desc:'当前敌人无法行动2回合',maxUses:1,effectId:'netStun'}},
'领袖':{fragName:'领袖碎片',fragIcon:'👑',skill:{name:'鼓舞士气',icon:'👑',desc:'永久ATK+3',maxUses:1,effectId:'permAtk'}},
'寄生强化':{fragName:'寄生碎片',fragIcon:'🦠',skill:{name:'寄生狂热',icon:'🦠',desc:'下次附身100%成功',maxUses:2,effectId:'guaranteedPossess'}},
'伏击':{fragName:'伏击碎片',fragIcon:'🗡',skill:{name:'暗影伏击',icon:'🗡',desc:'下次攻击造成3倍伤害',maxUses:2,effectId:'nextAtkX3'}},
'吸取':{fragName:'吸取碎片',fragIcon:'🌑',skill:{name:'灵魂虹吸',icon:'🌑',desc:'立即吸取目标15%MaxHP',maxUses:2,effectId:'drainTarget'}},
'多重攻击':{fragName:'多重碎片',fragIcon:'⚔',skill:{name:'连击风暴',icon:'⚔',desc:'下次攻击造成2.1倍伤害',maxUses:1,effectId:'tripleHit'}},
'再生+':{fragName:'强化再生碎片',fragIcon:'🌿',skill:{name:'强效修复',icon:'🌿',desc:'立即回复50%MaxHP',maxUses:2,effectId:'healNow50'}},
'召唤':{fragName:'召唤碎片',fragIcon:'📢',skill:{name:'幻影召唤',icon:'📢',desc:'召唤分身承受1次伤害',maxUses:1,effectId:'summonDecoy'}},
'污染光环':{fragName:'污染碎片',fragIcon:'☢',skill:{name:'污染爆发',icon:'☢',desc:'敌-15%MaxHP 并ATK-30% 3回合',maxUses:1,effectId:'pollutionBurst'}},
'掠夺':{fragName:'掠夺碎片',fragIcon:'💰',skill:{name:'资源掠夺',icon:'💰',desc:'击杀后EP+50',maxUses:2,effectId:'epBonus'}},
'爆炸':{fragName:'爆炸碎片',fragIcon:'💣',skill:{name:'自爆协议',icon:'💣',desc:'对敌造成30%MaxHP伤害',maxUses:1,effectId:'selfDestruct'}},
// 被动碎片（合成后永久生效）
'护甲被动':{fragName:'铁壁碎片',fragIcon:'🛡',passive:true,skill:{name:'铁壁',icon:'🛡',desc:'永久DEF+3',effectId:'passiveDef',value:3}},
'迅捷被动':{fragName:'疾步碎片',fragIcon:'💨',passive:true,skill:{name:'疾步',icon:'💨',desc:'永久双步移动',effectId:'passiveSpeed'}},
'洞察被动':{fragName:'先知碎片',fragIcon:'👁',passive:true,skill:{name:'先知之眼',icon:'👁',desc:'永久暴击率+15%',effectId:'passiveCrit',value:0.15}},
'掠夺被动':{fragName:'掠夺碎片',fragIcon:'💰',passive:true,skill:{name:'资源掠夺',icon:'💰',desc:'击杀EP+20%',effectId:'passiveEP',value:0.2}},
'恐惧被动':{fragName:'威慑碎片',fragIcon:'😱',passive:true,skill:{name:'威慑光环',icon:'😱',desc:'怪物ATK-10%',effectId:'passiveFear',value:0.1}},
'反击被动':{fragName:'反击碎片',fragIcon:'↩️',passive:true,skill:{name:'完美反击',icon:'↩️',desc:'受击30%概率反弹50%伤害',effectId:'passiveCounter',value:0.3}},
'寄生被动':{fragName:'寄生碎片',fragIcon:'🧬',passive:true,skill:{name:'寄生强化',icon:'🧬',desc:'附身率+10%',effectId:'passivePossess',value:0.1}},
'生命力被动':{fragName:'体质碎片',fragIcon:'❤️',passive:true,skill:{name:'体质强化',icon:'❤️',desc:'永久MaxHP+30',effectId:'passiveHP',value:30}}
};

// ================================================================
// 诅咒/祝福祭坛选项对（15对；首发版仅启用 LAUNCH_ALTAR_INDICES 中列出的 6 对，其余保留）
// 启用：嗜血之力/生命之泉、玻璃大炮/铁壁、贪婪/节制、狂战士/影行者、寄生共鸣/独立意志、形态大师/专注
// ================================================================
const LAUNCH_ALTAR_INDICES=[0,1,2,3,4,5,6,7,8,13];
const curseAltarPairs=[
{a:{name:'嗜血之力',icon:'🔴',desc:'ATK+50% 每层-10HP',type:'curse',mods:{atkMult:1.5,hpPerFloor:-10}},
 b:{name:'生命之泉',icon:'💚',desc:'每层+20HP ATK-30%',type:'blessing',mods:{hpPerFloor:20,atkMult:0.7}}},
{a:{name:'玻璃大炮',icon:'💎',desc:'暴击率+40% DEF=0',type:'curse',mods:{critBonus:0.4,defOverride:0}},
 b:{name:'铁壁',icon:'🧱',desc:'DEF×2 无法暴击',type:'blessing',mods:{defMult:2,noCrit:true}}},
{a:{name:'加速代谢',icon:'🔥',desc:'每步回3HP 污染+50%',type:'curse',mods:{regenPerStep:3,polMult:1.5}},
 b:{name:'冬眠',icon:'❄',desc:'污染停止 移速减半',type:'blessing',mods:{polMult:0,halfSpeed:true}}},
{a:{name:'贪婪',icon:'💰',desc:'EP×2 受伤+30%',type:'curse',mods:{epMult:2,dmgTakenMult:1.3}},
 b:{name:'节制',icon:'🙏',desc:'受伤-30% EP×0.5',type:'blessing',mods:{dmgTakenMult:0.7,epMult:0.5}}},
{a:{name:'狂战士',icon:'⚔',desc:'ATK+80% 无法逃跑',type:'curse',mods:{atkMult:1.8,noFlee:true}},
 b:{name:'影行者',icon:'🌑',desc:'可跳过战斗 ATK-40%',type:'blessing',mods:{atkMult:0.6,skipCombat:true}}},
{a:{name:'寄生共鸣',icon:'🧬',desc:'附身率+40% 附身后-30%HP',type:'curse',mods:{possessBonus:0.4,possessHpCost:0.3}},
 b:{name:'独立意志',icon:'🧠',desc:'附身率-20% 每层+5DEF',type:'blessing',mods:{possessBonus:-0.2,defPerFloor:5}}},
{a:{name:'脆弱之力',icon:'🗡',desc:'暴击伤害×3 被暴击×3',type:'curse',mods:{critDmgMult:3,critVuln:3}},
 b:{name:'坚韧',icon:'🪨',desc:'免疫暴击 ATK-20%',type:'blessing',mods:{noCrit:true,atkMult:0.8}}},
{a:{name:'嗜血回复',icon:'❤',desc:'击杀回20%HP 每层+5污染',type:'curse',mods:{killHeal:0.2,polPerFloor:5}},
 b:{name:'净化之路',icon:'✨',desc:'每层-5污染 击杀无EP',type:'blessing',mods:{polPerFloor:-5,epMult:0}}},
{a:{name:'赌徒',icon:'🎲',desc:'伤害0.3x-3x随机',type:'curse',mods:{dmgRandom:[0.3,3]}},
 b:{name:'稳定',icon:'⚖',desc:'伤害固定为平均值(无随机)',type:'blessing',mods:{dmgFixed:true}}},
{a:{name:'速攻',icon:'⚡',desc:'先手攻击 DEF÷2',type:'curse',mods:{firstStrike:true,defMult:0.5}},
 b:{name:'铁壁反击',icon:'🛡',desc:'后手但反弹50%伤害',type:'blessing',mods:{counterRate:0.5}}},
{a:{name:'巨人化',icon:'🦣',desc:'HP×2 ATK×2 每步-1HP',type:'curse',mods:{hpMult:2,atkMult:2,hpPerStep:-1}},
 b:{name:'小型化',icon:'🐜',desc:'HP÷2 ATK÷2 双倍移速',type:'blessing',mods:{hpMult:0.5,atkMult:0.5,doubleMove:true}}},
{a:{name:'虹吸',icon:'🩸',desc:'击杀吸30%HP',type:'curse',mods:{killHeal:0.3}},
 b:{name:'爆裂',icon:'💣',desc:'击杀爆炸伤害30%HP给周围',type:'blessing',mods:{killExplode:0.3}}},
{a:{name:'污染亲和',icon:'☢',desc:'污染效果反转 每层+10污染',type:'curse',mods:{polReverse:true,polPerFloor:10}},
 b:{name:'净化体质',icon:'🌟',desc:'免疫污染 ATK-25%',type:'blessing',mods:{polImmune:true,atkMult:0.75}}},
{a:{name:'形态大师',icon:'🔄',desc:'切换无CD ATK-15%',type:'curse',mods:{noFormCD:true,atkMult:0.85}},
 b:{name:'专注',icon:'🎯',desc:'锁定当前形态 ATK+25%',type:'blessing',mods:{formLock:true,atkMult:1.25}}},
{a:{name:'碎片磁铁',icon:'🧲',desc:'碎片掉率100% 上限5',type:'curse',mods:{fragRate:1.0,fragMax:5}},
 b:{name:'技能大师',icon:'📚',desc:'技能使用+2次 掉率20%',type:'blessing',mods:{fragRate:0.2,skillUsesBonus:2}}}
];

// ================================================================
// BOSS多阶段数据
// ================================================================
const bossPhaseData={
boss1:{phases:[
  {at:0.66,name:'实验主管·觉醒',color:'#cc4400',atkMult:1.2,addTraits:['狂暴'],msg:'实验主管的眼睛变红了!'},
  {at:0.33,name:'实验主管·暴走',color:'#ff2200',atkMult:1.5,addTraits:['吸血','再生'],msg:'实验主管开始疯狂自我修复!'}
]},
boss2:{phases:[
  {at:0.66,name:'培育主管·铁壁',color:'#8888cc',atkMult:1.0,addTraits:['护甲','再生'],msg:'培育主管激活了防御协议!'},
  {at:0.33,name:'培育主管·暴怒',color:'#ff4488',atkMult:1.8,addTraits:['狂暴','反击'],msg:'培育主管暴怒了! 攻击大幅提升!'}
]},
boss3:{phases:[
  {at:0.66,name:'污染核心·扩散',color:'#44cc44',atkMult:1.3,addTraits:['毒素','召唤'],msg:'污染核心开始扩散毒素!'},
  {at:0.33,name:'污染核心·临界',color:'#00ff00',atkMult:1.6,addTraits:['爆炸','不死'],msg:'污染核心达到临界状态!'}
]},
boss4:{phases:[
  {at:0.66,name:'深渊领主·觉醒',color:'#8800ff',atkMult:1.3,addTraits:['吸血','召唤'],msg:'深渊领主召唤暗影仆从!'},
  {at:0.33,name:'深渊领主·终焉',color:'#ff00ff',atkMult:2.0,addTraits:['狂暴','再生+'],msg:'深渊领主释放终极形态! ATK翻倍!'}
]},
boss5:{phases:[
  {at:0.75,name:'真实形态·觉醒',color:'#440044',atkMult:1.2,addTraits:['吸血'],msg:'真实形态开始吸取你的生命力!'},
  {at:0.50,name:'真实形态·共鸣',color:'#880088',atkMult:1.5,addTraits:['召唤','反击'],msg:'真实形态与塔产生共鸣!'},
  {at:0.25,name:'真实形态·终末',color:'#ff00ff',atkMult:2.0,addTraits:['爆炸'],msg:'真实形态进入毁灭模式!'}
]}
};

// ================================================================
// 全模式50层爽感曲线 — 逐层参数表
// 6段情绪曲线: 适应(1-8)→成长(9-16)→失控(17-24)→反转(25-32)→验证(33-40)→高潮(41-48)→终章(49-50)
// ================================================================
var FULL_FLOOR_CURVE = {
  // S1 适应期 (F1-F8): 低压高回报，建立核心循环
  1:  {hpScale:1.0, atkScale:1.0, count:5,  eliteRate:0,    epMult:1.3, fragRate:0.70, pollAdd:0, possessPollMult:0.7},
  2:  {hpScale:1.0, atkScale:1.0, count:5,  eliteRate:0,    epMult:1.3, fragRate:0.70, pollAdd:0, possessPollMult:0.7},
  3:  {hpScale:1.0, atkScale:1.0, count:5,  eliteRate:0.05, epMult:1.2, fragRate:0.65, pollAdd:0, possessPollMult:0.7},
  4:  {hpScale:1.0, atkScale:1.0, count:5,  eliteRate:0.05, epMult:1.2, fragRate:0.65, pollAdd:0, possessPollMult:0.8},
  5:  {hpScale:1.0, atkScale:1.0, count:6,  eliteRate:0.10, epMult:1.2, fragRate:0.65, pollAdd:0, possessPollMult:0.8},
  6:  {hpScale:1.02,atkScale:1.01,count:6,  eliteRate:0.10, epMult:1.1, fragRate:0.65, pollAdd:0, possessPollMult:0.8},
  7:  {hpScale:1.04,atkScale:1.02,count:6,  eliteRate:0.12, epMult:1.1, fragRate:0.60, pollAdd:0, possessPollMult:0.9},
  8:  {hpScale:1.06,atkScale:1.03,count:6,  eliteRate:0.12, epMult:1.1, fragRate:0.60, pollAdd:0, possessPollMult:0.9},
  // Boss F10 由 boss phase 系统控制
  9:  {hpScale:1.08,atkScale:1.04,count:7,  eliteRate:0.15, epMult:1.1, fragRate:0.60, pollAdd:0, possessPollMult:0.9},
  10: {hpScale:1.10,atkScale:1.05,count:5,  eliteRate:0.15, epMult:1.0, fragRate:0.60, pollAdd:0, possessPollMult:1.0},
  // S2 稳定成长 (F11-F16): 渐进加压，精英频现，首次污染
  11: {hpScale:1.12,atkScale:1.06,count:7,  eliteRate:0.18, epMult:1.0, fragRate:0.60, pollAdd:1, possessPollMult:1.0},
  12: {hpScale:1.14,atkScale:1.07,count:7,  eliteRate:0.18, epMult:1.0, fragRate:0.60, pollAdd:1, possessPollMult:1.0},
  13: {hpScale:1.16,atkScale:1.08,count:7,  eliteRate:0.20, epMult:1.0, fragRate:0.60, pollAdd:1, possessPollMult:1.0},
  14: {hpScale:1.18,atkScale:1.09,count:7,  eliteRate:0.20, epMult:1.1, fragRate:0.60, pollAdd:1, possessPollMult:1.0},
  15: {hpScale:1.20,atkScale:1.10,count:8,  eliteRate:0.22, epMult:1.1, fragRate:0.60, pollAdd:1, possessPollMult:1.0},
  16: {hpScale:1.22,atkScale:1.11,count:8,  eliteRate:0.22, epMult:1.1, fragRate:0.60, pollAdd:1, possessPollMult:1.0},
  // S3 污染成为主角 (F17-F24): 污染压力陡增，污染技能解锁，"不是变强而是代价更大"
  17: {hpScale:1.24,atkScale:1.12,count:8,  eliteRate:0.22, epMult:1.0, fragRate:0.55, pollAdd:2, possessPollMult:1.1},
  18: {hpScale:1.26,atkScale:1.13,count:8,  eliteRate:0.24, epMult:1.0, fragRate:0.55, pollAdd:2, possessPollMult:1.1},
  19: {hpScale:1.28,atkScale:1.14,count:9,  eliteRate:0.24, epMult:1.0, fragRate:0.55, pollAdd:2, possessPollMult:1.2},
  20: {hpScale:1.30,atkScale:1.15,count:5,  eliteRate:0.24, epMult:1.0, fragRate:0.55, pollAdd:2, possessPollMult:1.2},
  21: {hpScale:1.32,atkScale:1.16,count:9,  eliteRate:0.25, epMult:1.1, fragRate:0.55, pollAdd:2, possessPollMult:1.2},
  22: {hpScale:1.34,atkScale:1.17,count:9,  eliteRate:0.25, epMult:1.1, fragRate:0.55, pollAdd:3, possessPollMult:1.2},
  23: {hpScale:1.36,atkScale:1.18,count:9,  eliteRate:0.28, epMult:1.2, fragRate:0.60, pollAdd:3, possessPollMult:1.3},
  24: {hpScale:1.38,atkScale:1.19,count:9,  eliteRate:0.28, epMult:1.2, fragRate:0.60, pollAdd:3, possessPollMult:1.3},
  // S4 系统反转 (F25-F32): F25净化祭坛，极限挑战+高回报
  25: {hpScale:1.40,atkScale:1.20,count:10, eliteRate:0.28, epMult:1.2, fragRate:0.60, pollAdd:3, possessPollMult:1.3},
  26: {hpScale:1.42,atkScale:1.21,count:10, eliteRate:0.30, epMult:1.2, fragRate:0.60, pollAdd:3, possessPollMult:1.3},
  27: {hpScale:1.44,atkScale:1.22,count:10, eliteRate:0.30, epMult:1.3, fragRate:0.65, pollAdd:3, possessPollMult:1.4},
  28: {hpScale:1.46,atkScale:1.23,count:10, eliteRate:0.30, epMult:1.3, fragRate:0.65, pollAdd:4, possessPollMult:1.4},
  29: {hpScale:1.48,atkScale:1.24,count:11, eliteRate:0.32, epMult:1.3, fragRate:0.65, pollAdd:4, possessPollMult:1.4},
  30: {hpScale:1.50,atkScale:1.25,count:5,  eliteRate:0.32, epMult:1.2, fragRate:0.65, pollAdd:4, possessPollMult:1.5},
  // S5 高压验证 (F33-F40): 持续高压，高回报
  31: {hpScale:1.52,atkScale:1.26,count:11, eliteRate:0.32, epMult:1.3, fragRate:0.65, pollAdd:4, possessPollMult:1.5},
  32: {hpScale:1.54,atkScale:1.27,count:11, eliteRate:0.34, epMult:1.3, fragRate:0.65, pollAdd:4, possessPollMult:1.5},
  33: {hpScale:1.56,atkScale:1.28,count:11, eliteRate:0.34, epMult:1.4, fragRate:0.70, pollAdd:4, possessPollMult:1.5},
  34: {hpScale:1.58,atkScale:1.29,count:11, eliteRate:0.34, epMult:1.4, fragRate:0.70, pollAdd:4, possessPollMult:1.6},
  35: {hpScale:1.60,atkScale:1.30,count:12, eliteRate:0.36, epMult:1.4, fragRate:0.70, pollAdd:5, possessPollMult:1.6},
  36: {hpScale:1.62,atkScale:1.31,count:12, eliteRate:0.36, epMult:1.4, fragRate:0.70, pollAdd:5, possessPollMult:1.6},
  37: {hpScale:1.64,atkScale:1.32,count:12, eliteRate:0.38, epMult:1.5, fragRate:0.75, pollAdd:5, possessPollMult:1.7},
  38: {hpScale:1.66,atkScale:1.33,count:12, eliteRate:0.38, epMult:1.5, fragRate:0.75, pollAdd:5, possessPollMult:1.7},
  39: {hpScale:1.68,atkScale:1.34,count:13, eliteRate:0.40, epMult:1.5, fragRate:0.75, pollAdd:5, possessPollMult:1.8},
  40: {hpScale:1.70,atkScale:1.35,count:5,  eliteRate:0.40, epMult:1.4, fragRate:0.75, pollAdd:5, possessPollMult:1.8},
  // S6 持续高潮 (F41-F48): 崩坏冲顶，终极压力
  41: {hpScale:1.72,atkScale:1.36,count:13, eliteRate:0.40, epMult:1.5, fragRate:0.75, pollAdd:6, possessPollMult:1.8},
  42: {hpScale:1.74,atkScale:1.37,count:13, eliteRate:0.42, epMult:1.6, fragRate:0.80, pollAdd:6, possessPollMult:1.9},
  43: {hpScale:1.76,atkScale:1.38,count:13, eliteRate:0.42, epMult:1.6, fragRate:0.80, pollAdd:6, possessPollMult:1.9},
  44: {hpScale:1.78,atkScale:1.39,count:14, eliteRate:0.44, epMult:1.7, fragRate:0.80, pollAdd:7, possessPollMult:2.0},
  45: {hpScale:1.80,atkScale:1.40,count:14, eliteRate:0.44, epMult:1.7, fragRate:0.85, pollAdd:7, possessPollMult:2.0},
  46: {hpScale:1.82,atkScale:1.41,count:14, eliteRate:0.46, epMult:1.8, fragRate:0.85, pollAdd:7, possessPollMult:2.0},
  47: {hpScale:1.84,atkScale:1.42,count:14, eliteRate:0.46, epMult:1.8, fragRate:0.90, pollAdd:8, possessPollMult:2.0},
  48: {hpScale:1.86,atkScale:1.43,count:15, eliteRate:0.48, epMult:2.0, fragRate:0.90, pollAdd:8, possessPollMult:2.0},
  // 终章 (F49-F50): 审判与结局
  49: {hpScale:1.88,atkScale:1.44,count:15, eliteRate:0.50, epMult:2.0, fragRate:1.00, pollAdd:8, possessPollMult:2.0},
  50: {hpScale:1.90,atkScale:1.45,count:5,  eliteRate:0.50, epMult:2.0, fragRate:1.00, pollAdd:8, possessPollMult:2.0}
};
function getFullFloorCurve(floor){return FULL_FLOOR_CURVE[floor]||FULL_FLOOR_CURVE[50];}

// ================================================================
// 楼层签名定义（30个；首发版仅启用 LAUNCH_SIGNATURES 中列出的 10 个，其余保留待后续版本启用）
// ================================================================
const LAUNCH_SIGNATURES=['peaceZone','parasiteParadise','darkness','healSpring','giantify','gamblerHeaven','regenLand','goldenRain','timeAccel','duel','xray','evoAccel','bountyHunt','critZone','hungerSwamp','toxicFog','fragileBarrier','lilliput','pollutionStorm','judgment'];
const floorSignatures={
// --- 正面/中性签名 ---
regenLand:{id:'regenLand',name:'再生之地',desc:'每步回复2%HP',icon:'🌿',color:'#0a4',
  onEnter(g){g._sigFlags.regenPerStep=0.02;},onExit(g){}},
goldenRain:{id:'goldenRain',name:'黄金雨',desc:'EP奖励×3',icon:'💰',color:'#fc0',
  onEnter(g){g._sigFlags.epMult=3;},onExit(g){}},
peaceZone:{id:'peaceZone',name:'和平区',desc:'怪物不拦路 附身率+30%',icon:'🕊',color:'#8f8',
  onEnter(g){g._sigFlags.peacefulMonsters=true;g._sigFlags.possessBonus=0.3;},onExit(g){}},
xray:{id:'xray',name:'透视',desc:'全图可见',icon:'👁',color:'#ff0',
  onEnter(g){g._sigFlags.fogRadius=99;},onExit(g){}},
parasiteParadise:{id:'parasiteParadise',name:'寄生乐园',desc:'附身率+20% 但+20污染',icon:'🧬',color:'#00ffd0',
  onEnter(g){g._sigFlags.possessBonus=0.2;},onExit(g){}},
evoAccel:{id:'evoAccel',name:'进化加速',desc:'EP奖励×2',icon:'🧬',color:'#00ffd0',
  onEnter(g){g._sigFlags.epMult=2;},onExit(g){}},
bountyHunt:{id:'bountyHunt',name:'猎杀令',desc:'击杀悬赏目标+500EP',icon:'🎯',color:'#ff8800',
  onEnter(g){
    const alive=g.monsters.filter(m=>m.hp>0&&!m.type.includes('boss'));
    if(alive.length>0){const t=alive[Math.floor(Math.random()*alive.length)];g._sigFlags.bountyId=t.id;g._sigFlags.bountyName=t.name;addMsg('🎯 猎杀令: 击杀 '+t.name+' 奖励500EP!');}
  },onExit(g){}},
resourceRace:{id:'resourceRace',name:'EP宝石',desc:'地图上散落EP宝石 踩到即获',icon:'💎',color:'#08f',
  onEnter(g){
    g._sigFlags.gems=[];
    for(let i=0;i<5;i++){
      let gx,gy,tries=0;
      do{gx=1+Math.floor(Math.random()*11);gy=1+Math.floor(Math.random()*11);tries++;}
      while(tries<20&&(g.tiles[gy][gx]!==1||(gx===g.player.x&&gy===g.player.y)));
      if(tries<20)g._sigFlags.gems.push({x:gx,y:gy,value:50+Math.floor(Math.random()*100)});
    }
  },onExit(g){}},
healSpring:{id:'healSpring',name:'治愈温泉',desc:'击杀怪物回复15%HP',icon:'♨',color:'#4af',
  onEnter(g){g._sigFlags.healOnKill=0.15;},onExit(g){}},
critZone:{id:'critZone',name:'暴击场',desc:'所有攻击暴击率+30%',icon:'💥',color:'#ff0',
  onEnter(g){g._sigFlags.critBonus=0.3;},onExit(g){}},
// --- 风险/回报签名（有代价但也有好处） ---
hungerSwamp:{id:'hungerSwamp',name:'饥饿沼泽',desc:'停止不动流失HP 但移动回复1%HP',icon:'🏚',color:'#4a2',
  onEnter(g){g._sigFlags.lastMoveStep=0;g._sigFlags.stepCount=0;g._sigFlags.regenPerStep=0.01;},onExit(g){}},
toxicFog:{id:'toxicFog',name:'毒雾弥漫',desc:'每步+1污染 但怪物ATK-40%',icon:'☁',color:'#4a0',
  onEnter(g){g._sigFlags.polPerStep=1;g.monsters.forEach(m=>{if(m.hp>0)m.atk=Math.floor(m.atk*0.6);});},onExit(g){}},
fragileBarrier:{id:'fragileBarrier',name:'脆弱结界',desc:'所有伤害×2（双方均受影响）',icon:'💔',color:'#f08',
  onEnter(g){g._sigFlags.dmgMult=2;},onExit(g){}},
gamblerHeaven:{id:'gamblerHeaven',name:'赌徒天堂',desc:'伤害0.5x-2x随机',icon:'🎰',color:'#fc0',
  onEnter(g){g._sigFlags.randomDmg=true;},onExit(g){}},
giantify:{id:'giantify',name:'巨人化',desc:'怪物HP×2 ATK×1.5 但EP×2',icon:'🦣',color:'#a44',
  onEnter(g){g._sigFlags.epMult=2;g.monsters.forEach(m=>{if(m.hp>0){m.maxHp*=2;m.hp*=2;m.atk=Math.floor(m.atk*1.5);}});},onExit(g){}},
lilliput:{id:'lilliput',name:'小人国',desc:'怪物HP÷2 数量翻倍',icon:'🐜',color:'#4af',
  onEnter(g){
    g.monsters.forEach(m=>{if(m.hp>0){m.maxHp=Math.max(1,Math.floor(m.maxHp/2));m.hp=Math.min(m.hp,m.maxHp);}});
    const extras=[];
    g.monsters.forEach(m=>{
      if(m.hp>0&&!m.type.includes('boss')){
        let sx,sy,tries=0;
        do{sx=2+Math.floor(Math.random()*9);sy=2+Math.floor(Math.random()*9);tries++;}
        while(tries<20&&((sx===g.player.x&&sy===g.player.y)||g.tiles[sy][sx]!==1||g.monsters.some(em=>em.hp>0&&em.x===sx&&em.y===sy)));
        if(tries<20)extras.push({...m,id:m.id+'_clone',x:sx,y:sy,hp:m.hp,maxHp:m.maxHp,_revived:false});
      }
    });
    g.monsters.push(...extras);
  },onExit(g){}},
duel:{id:'duel',name:'单挑',desc:'仅1只精英 属性×3 奖励×5',icon:'⚔',color:'#ff0',
  onEnter(g){
    const alive=g.monsters.filter(m=>m.hp>0);if(alive.length===0)return;
    const best=alive.reduce((a,b)=>b.atk>a.atk?b:a,alive[0]);
    g.monsters.forEach(m=>{if(m!==best)m.hp=0;});
    best.maxHp*=3;best.hp=best.maxHp;best.atk*=3;best.def*=3;best.name='精英 '+best.name;
    g._sigFlags.eliteReward=5;
  },onExit(g){}},
pollutionStorm:{id:'pollutionStorm',name:'污染风暴',desc:'每10步+5污染 怪物ATK-30% EP×1.5',icon:'☢',color:'#4a0',
  onEnter(g){g._sigFlags.polStormSteps=0;g._sigFlags.epMult=1.5;g.monsters.forEach(m=>{if(m.hp>0)m.atk=Math.floor(m.atk*0.7);});},onExit(g){}},
judgment:{id:'judgment',name:'审判',desc:'从弱到强击杀 每正确击杀+50EP',icon:'⚖',color:'#ff0',
  onEnter(g){
    const alive=g.monsters.filter(m=>m.hp>0).sort((a,b)=>a.atk-b.atk);
    g._sigFlags.killOrder=alive.map(m=>m.id);g._sigFlags.killIdx=0;g._sigFlags.killPenalty=false;
    g._sigFlags.judgmentBonus=50;
    if(alive.length>0)addMsg('⚖ 审判: 从弱到强击杀可获得额外EP!');
  },onExit(g){}},
// --- 挑战签名（限制但有补偿） ---
weakField:{id:'weakField',name:'弱化场',desc:'ATK减半 但DEF+50%',icon:'⬇',color:'#888',
  onEnter(g){g._sigFlags.atkMult=0.5;g._sigFlags.defMult=1.5;},onExit(g){}},
armorBreak:{id:'armorBreak',name:'破甲场',desc:'DEF减半 但ATK+50%',icon:'⚔',color:'#c44',
  onEnter(g){g._sigFlags.defMult=0.5;g._sigFlags.atkMult=1.5;},onExit(g){}},
darkness:{id:'darkness',name:'黑暗降临',desc:'视野缩小到3格 但附身率+20%',icon:'🌑',color:'#222',minFloor:8,
  onEnter(g){g._sigFlags.fogRadius=3;g._sigFlags.possessBonus=0.2;},onExit(g){}},
timeAccel:{id:'timeAccel',name:'时间加速',desc:'怪物攻击2次 但EP×2',icon:'⏩',color:'#ff8800',minFloor:15,
  onEnter(g){g._sigFlags.monsterDoubleHit=true;g._sigFlags.epMult=2;},onExit(g){}},
formLock:{id:'formLock',name:'形态锁定',desc:'无法切换形态 但ATK+25%',icon:'🔒',color:'#888',
  onEnter(g){g._sigFlags.noSwitch=true;g._sigFlags.atkMult=1.25;},onExit(g){}},
undeadLand:{id:'undeadLand',name:'不死之地',desc:'怪物自带不死 但击杀EP×2',icon:'💀',color:'#808',
  onEnter(g){g._sigFlags.epMult=2;g.monsters.forEach(m=>{if(m.hp>0&&m.traits&&!m.traits.includes('不死'))m.traits.push('不死');});},onExit(g){}},
barrenLand:{id:'barrenLand',name:'贫瘠之地',desc:'击杀无EP 但每步回复3%HP',icon:'🏜',color:'#555',
  onEnter(g){g._sigFlags.epMult=0;g._sigFlags.regenPerStep=0.03;},onExit(g){}},
mime:{id:'mime',name:'哑剧',desc:'隐藏所有数字 但怪物DEF-50%',icon:'🤫',color:'#ccc',minFloor:10,
  onEnter(g){g._sigFlags.hideNumbers=true;g.monsters.forEach(m=>{if(m.hp>0)m.def=Math.floor(m.def*0.5);});},onExit(g){}},
fogStalker:{id:'fogStalker',name:'迷雾追踪',desc:'隐形猎手追踪你 击杀奖励300EP',icon:'👤',color:'#404',
  onEnter(g){
    let sx,sy,_st=0;do{sx=1+Math.floor(Math.random()*11);sy=1+Math.floor(Math.random()*11);_st++;}while(_st<50&&(g.tiles[sy][sx]!==1||(Math.abs(sx-g.player.x)<4&&Math.abs(sy-g.player.y)<4)));
    g._sigFlags.stalker={x:sx,y:sy,steps:0};g._sigFlags.stalkerReward=300;
  },onExit(g){}},
timedChallenge:{id:'timedChallenge',name:'限时挑战',desc:'90秒内下楼奖励200EP',icon:'⏱',color:'#ff006e',
  onEnter(g){g._sigFlags.timerEnd=Date.now()+90000;g._sigFlags.timerActive=true;g._sigFlags.timerReward=200;},onExit(g){g._sigFlags.timerActive=false;}}
};

const fragments={
rat:'实验日志001。1号实验鼠注射基因增强剂后，智力显著提升。它开始识别复杂图案，甚至学会了开锁...',
roach:'观察记录007。辐射蟑螂的外壳硬度达到钢铁级别。它们在核废料中不仅存活，还在进化...',
slime:'培育笔记015。失败体-α——第一批基因改造的副产物。它们被标记为"废弃"，却在废液中自我修复...',
dog:'事故报告030。看门犬突破收容，咬伤了李博士。它的忠诚基因被改造后，产生了病态的依恋...',
wasp:'警告日志045。变异黄蜂的毒液含有未知成分。中毒者声称看到了"真相"...',
wolf:'紧急记录060。培育狼已具备协同狩猎能力。它不是在狩猎——它在计算...',
spider:'收容日志075。酸液蜘蛛的蛛网能腐蚀钢铁，它们在暗处织就了一张巨大的网络...',
bat:'夜间观察090。铁爪猴的速度远超预期，它的爪子能撕裂防弹装甲...',
guard:'人员报告105。安保队长失踪三天后出现，但已经不是人类了。他说"我已经进化了"...',
boss1:'最高机密120。实验主管自愿接受改造。他获得了召唤和控制其他实验体的能力...新物种的领袖...',
gecko:'实验日志008。壁虎变体的再生能力远超原型。它甚至能修复被切断的神经...',
drone:'故障报告012。无人机的AI似乎产生了自主意识。它开始拒绝执行关闭指令...',
wolf:'培育记录201。培育狼的群体智慧不断提升。它们开始建立复杂的社会结构...',
spider:'收容警告215。酸液蜘蛛分泌的酸液能溶解三级防护门。收容措施需升级...',
wasp:'紧急日志230。变异黄蜂的毒腺中检测到未知神经毒素。中毒者出现幻视...',
vine:'生物报告245。绞缠藤蔓不是植物——它有肌肉纤维。它在模仿植物...',
boss2:'最高机密260。培育主管说"你们不理解，这不是实验，这是进化"...',
larva:'项目日志301。实验体-Ω展现了我们从未见过的再生能力。它不是在修复，是在重塑...',
mantis:'观察报告315。镰刀螳螂的前肢振动频率能共振钢铁。一击就能切开收容仓...',
beetle:'收容升级330。装甲甲虫的外壳密度超过钛合金。常规武器完全无效...',
worm:'寄生报告345。寄生蠕虫能通过宿主的神经系统传递信息。感染者说它们"在低语"...',
moth:'紧急封锁360。毒粉飞蛾释放的孢子具有传染性。三名研究员已出现变异症状...',
scorpion:'安全评估375。守卫者原是安保机器人的生物改造版。它仍在执行"保护"命令——只是定义变了...',
hydra:'异常报告380。多头蛇怪每次受伤都会长出新头。我们已停止尝试消灭它...',
boss3:'黑箱日志400。污染核心不是一个实体。它是这座塔的"免疫系统"...',
shade:'深层记录501。暗影不留下痕迹。唯一知道它来过的方式是——有东西消失了...',
lurker:'失踪报告515。第37层以下的勘探队全部失联。最后的通讯只有一句话："它在等我们"...',
wraith:'灵魂研究530。怨灵不是死者的灵魂。它是活着的人的"恐惧"具现化...',
voidbeast:'空间异常545。虚空兽不存在于三维空间。它只是在我们的视野中投下了影子...',
nightmare:'梦境日志560。三号受试者在催眠状态下画了它。醒来后他说"它也在看我画的画"...',
watcher:'深渊观测575。深渊守望者是最早的实验体之一。它看着我们建造了这一切...',
voiddragon:'终极报告590。虚空幼龙撕裂了D区的空间壁障。我们在另一边看到了...不可能的东西...',
boss4:'深渊档案600。深渊领主说："你们来得太迟了。门已经开了。"',
titan:'废墟日志701。腐化泰坦是第一代泰坦级实验体。它已经在这里等了很久...',
chaos:'混沌记录715。混沌之子没有固定形态。每次你看它，它都不一样...',
deathknight:'传说730。死亡骑士曾是这座塔的首席安全官。他选择了与实验体"共存"...',
horror:'禁忌档案745。远古恐惧不是被创造出来的。它一直就在那里。实验只是唤醒了它...',
colossus:'最终记录760。虚空巨像是塔的基石。移除它，一切都会崩塌...',
plague:'隔离报告775。瘟疫使者是被故意设计的生物武器。研发者已在爆炸中死亡...据说...',
origin:'起源790。原初寄生体——是的，就是你的同类。或者说...你的原型...',
boss5:'终章800。真实形态。这就是一切的终点。或者，一切的起点。'
};

// === 叙事系统数据 ===
const storyTriggers={
  5:{type:'note',title:'📜 墙上的刻字',text:'你在墙上发现了潦草的字迹：\n\n"出口在上面。一直往上走就对了。\n不要停下来，不要回头。"\n\n——无名者\n\n你触碰刻字时，一股寄生本能涌入体内。',reward:20,storyReward:'parasite_instinct',rewardName:'🧬 寄生本能觉醒',rewardDesc:'附身成功率永久+15%'},
  10:{type:'note',title:'📜 实验员笔记',text:'一张揉皱的纸条：\n\n"第3天。实验体仍在逃跑。\n它们不知道出口被设计成\n永远在「下一层」。"\n\n纸条背面有一行微弱的备注：\n"记忆残留有治愈效果"',reward:30,storyReward:'echo_heal',rewardName:'💚 记忆回声',rewardDesc:'每次换层回复5%最大HP'},
  15:{type:'note',title:'📜 血书',text:'墙壁上用暗红色写着：\n\n"我数了。从第1层到这里，\n已经有23具尸体。\n他们都以为再走几层就到了。\n\n我也以为。"\n\n墙壁裂缝中掉落一个容器。',reward:40,storyReward:'dead_relic',rewardName:'📦 死者遗物',rewardDesc:'获得+1形态槽'},
  20:{type:'note',title:'📜 研究日志',text:'一台损坏终端的最后记录：\n\n"意识迁移实验#7 - 进行中\n宿主认知锚定...成功\n记忆覆写...87%\n\n注意：宿主开始质疑环境真实性。\n建议提升污染压制阈值。"\n\n终端弹出一枚芯片。',reward:50,storyReward:'anchor_shield',rewardName:'🛡 意识锚定强化',rewardDesc:'获得1次崩溃抵抗'},
  25:{type:'revelation',title:'⚠️ 系统异常',text:'你终于到达标记为"出口"的房间。\n\n但面前只有一堵墙，和墙上的刻字：\n\n"第47个到达这里的人。\n如果你在读这个，说明你也发现了——\n\n根本没有出口。"\n\n你感觉有什么东西在你的认知深处碎裂了。\n裂变的能量让你领悟了污染的控制方法。',storyReward:'cognitive_split',rewardName:'☢️ 认知裂变',rewardDesc:'污染技能消耗-5'},
  30:{type:'note',title:'📜 被划掉的日记',text:'大部分内容被暴力划掉，只剩几行：\n\n"...不是在逃跑...\n...一直在深入...\n...锚点不是存档，是███████...\n...我们都是它的██..."\n\n日记散发出前人的力量残响。',storyReward:'echo_power',rewardName:'⚡ 残响之力',rewardDesc:'当前职业进化+1级'},
  35:{type:'note',title:'📜 最后的警告',text:'刻在金属门上的字：\n\n"如果你走到这里还没死，\n说明它选中了你。\n\n不要去第50层。\n或者说——你阻止不了自己去。\n\n因为你就是它。"\n\n一种预知能力觉醒了。',storyReward:'foresight',rewardName:'👁 预知残像',rewardDesc:'10%几率闪避攻击'},
  40:{type:'fragment',title:'🧠 记忆碎片恢复 #1',text:'一段被压制的记忆涌入意识：\n\n"实验日志 #001\n项目: 意识递归\n目标: 创建自我维持的意识生态\n\n宿主: [数据损坏]\n结果: 意识上传成功。\n宿主已进入递归循环。\n\n备注: 宿主...就是你自己。"\n\n记忆融合强化了你的身体。',storyReward:'memory_fusion',rewardName:'🔥 记忆融合',rewardDesc:'ATK+8 DEF+5'},
  45:{type:'fragment',title:'🧠 记忆碎片恢复 #2',text:'更多记忆浮现：\n\n"第7次迭代记录\n\n它又开始建造塔了。\n每次都是50层。\n每次都说要逃出去。\n每次到第25层都会「发现真相」。\n然后继续往上走。\n\n我们不确定这是BUG还是FEATURE。\n也许对它来说，\n寻找出口本身就是存在的意义。"\n\n递归觉醒让你的意识完全苏醒。',storyReward:'recursive_awaken',rewardName:'🌀 递归觉醒',rewardDesc:'MaxHP+50 HP回满'},
  50:{type:'finale',title:'🌀 起源之地',text:'第50层。\n\n没有出口。没有解药。没有怪物。\n只有一面镜子。\n\n你看到的不是自己的倒影——\n你看到的是这座塔的全貌。\n从第1层到第50层，\n每一层都是你吞噬的记忆。\n每一个怪物都是曾经的"你"。\n\n污染不是腐蚀，是你在苏醒。\n附身不是夺取，是你在回收。\n\n所谓"逃出"，其实是"接纳"。\n所谓"解药"，其实是"完全觉醒"。'}
};

