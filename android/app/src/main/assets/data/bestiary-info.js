// ================================================================
// 怪物图鉴附加信息：剧情简介 + 玩法建议
// ================================================================
window.monsterLore = {
  // T1
  rat:    '实验室逃逸的初代试验体。神经系统被基因改造剂腐蚀，行动反常迅捷。',
  roach:  '在辐射区生存的甲壳生物。外壳异化，对常规伤害有抗性。',
  slime:  '失败的细胞融合实验产物。无核结构使其能持续自愈。',
  dog:    '看守犬被注入忠诚类基因强化，对入侵者保持高度警觉。',
  gecko:  '改造爬虫，体壁富含弹性纤维，可吸收冲击。',
  drone:  '故障的安保无人机，控制系统紊乱后开始攻击一切移动目标。',
  boss1:  '实验主管染毒后异化，仍保留管理者的指挥本能。',
  // T2
  wolf:   '培育区的犬科战兽，肾上腺被永久激活，越伤越凶。',
  spider: '酸液腺被强化的节肢生物，吐丝缠敌后注入腐蚀液。',
  bat:    '夜行猎兽，獠牙改造后能从血液中提取能量。',
  wasp:   '改造黄蜂，尾针注射神经毒，目标会随时间持续衰弱。',
  guard:  '失控的人形警卫，原型还在使用的复合装甲。',
  vine:   '具有植物-动物嵌合特征，活体绞缠并吸取养分。',
  boss2:  '培育部门负责人，融合多个失败实验体的复合存在。',
  // T3
  larva:  '编号 Ω 的终极实验体，再生速度突破生物上限。',
  mantis: '前肢被替换为分子刃，每一击都能切开装甲。',
  beetle: '装甲化甲虫，几丁质硬度远超工业合金。',
  worm:   '寄生于其他实验体内的蛔形生物，吞噬宿主后变形为本体。',
  moth:   '飞行毒粉散播者，鳞粉具神经麻痹效果。',
  scorpion: '污染核心的守卫，毒囊与装甲腺同时进化。',
  hydra:  '失去理智的多头变种，每个头各自独立思考、独立攻击。',
  boss3:  '污染核心的具现化形态，能量过载后形成的活体反应堆。',
  // T4
  shade:  '深渊投射出的二维残影，部分时间不存在于现实。',
  lurker: '潜伏在阴影中的捕食者，伏击命中率极高。',
  wraith: '尚未完全死亡的灵魂残渣，会从攻击者身上抽取生命补全自己。',
  voidbeast: '从虚空裂缝中爬出的生物，骨骼是非欧几何结构。',
  nightmare: '具现化的恐惧本身，使敌人产生幻觉，攻击力下降。',
  watcher:'深渊层的固定守卫，巨大眼球记录一切入侵者。',
  voiddragon: '虚空中孵化的低等龙类，鳞片在物质与虚空间相位切换。',
  boss4:  '深渊层的统治者，集合了所有虚空特性的复合体。',
  // T5
  titan:  '由腐化菌丝包裹的远古巨像，每一步都在腐蚀地面。',
  chaos:  '混沌之火的化身，攻击模式无法被任何模型预测。',
  deathknight: '死而复生的古代战士，骨甲与黑魔法融合。',
  horror: '远古时代封印的恐惧实体，仅是注视就让生物心智崩坏。',
  colossus: '虚空中漂浮的山岳级生命体，物理与相位双重免疫。',
  plague: '行走的瘟疫源，每一次呼吸都在散播致死毒素。',
  origin: '所有寄生体的祖先形态，与你共享同一份基因记忆。',
  boss5:  '塔的真实形态。你一直以为自己在攀登，但塔本身才是真正的实验体。'
};

// trait → 战术分类（用于自动派生玩法建议）
// 类别：tank/regen/lifesteal/burst/cc/mobility/aoe/utility
window.traitTactics = {
  '迅捷':   {tag:'mobility', tip:'追击与拉扯走位'},
  '厚皮':   {tag:'tank',     tip:'减伤抗压'},
  '再生':   {tag:'regen',    tip:'长线续航·回血型'},
  '再生+':  {tag:'regen',    tip:'强力回血·BOSS消耗战'},
  '忠诚':   {tag:'utility',  tip:'切换形态时回血'},
  '弹性':   {tag:'tank',     tip:'减伤+闪避·应付高伤宿主'},
  '电击':   {tag:'cc',       tip:'15% 眩晕·控场'},
  '狂暴':   {tag:'burst',    tip:'残血逆转·适合极限翻盘'},
  '蛛网':   {tag:'cc',       tip:'减速控制'},
  '吸血':   {tag:'lifesteal',tip:'15% 攻击回血·清杂兵'},
  '吸血+':  {tag:'lifesteal',tip:'25% 强力回血·BOSS单挑'},
  '毒素':   {tag:'burst',    tip:'持续毒伤·针对高血量目标'},
  '护甲':   {tag:'tank',     tip:'额外 DEF·稳健推图'},
  '反击':   {tag:'tank',     tip:'被动反伤·应付追击'},
  '掠夺':   {tag:'utility',  tip:'战利品 1.5×·刷资源'},
  '暴击':   {tag:'burst',    tip:'20% 暴击·爆发输出'},
  '寄生强化':{tag:'utility', tip:'附身率+12%·扩展形态'},
  '撕裂':   {tag:'burst',    tip:'流血持续伤害'},
  '相位':   {tag:'mobility', tip:'穿墙走位·绕过守卫'},
  '伏击':   {tag:'burst',    tip:'先手·突袭脆皮'},
  '不死':   {tag:'utility',  tip:'首次死亡复活·保险'},
  '吸取':   {tag:'lifesteal',tip:'攻击吸血+削弱敌人'},
  '恐惧':   {tag:'cc',       tip:'削减敌方 ATK·控场'},
  '多重攻击':{tag:'burst',   tip:'两次攻击·适合破护甲'},
  '污染光环':{tag:'utility', tip:'污染增长 -30%·长线推图'},
  '爆炸':   {tag:'burst',    tip:'死亡反伤·自杀流'},
  '召唤':   {tag:'utility',  tip:'援军·拖延'},
  '领袖':   {tag:'utility',  tip:'ATK&DEF+2·均衡型'}
};

// 自动生成"适合"建议
window.getMonsterPlaystyle = function(type){
  var m = window.monsterTemplates && window.monsterTemplates[type];
  if(!m) return null;
  var traits = m.traits || [];
  var tags = {};
  traits.forEach(function(t){
    var info = window.traitTactics[t];
    if(info) tags[info.tag] = (tags[info.tag]||0) + 1;
  });
  // 由属性补充
  if(m.def >= 20) tags.tank = (tags.tank||0) + 1;
  if(m.atk >= 80) tags.burst = (tags.burst||0) + 1;
  var suggestions = [];
  if(tags.regen >= 1 || tags.lifesteal >= 1) suggestions.push('🩹 回血续航 — 适合连续作战、长楼层推进');
  if(tags.tank >= 2) suggestions.push('🛡️ 硬抗 — 适合扛 BOSS 爆发、高伤楼层');
  else if(tags.tank === 1) suggestions.push('🛡️ 减伤 — 应付密集敌群');
  if(tags.burst >= 2) suggestions.push('⚔️ 高爆发 — 适合速通 BOSS / 关键击杀');
  else if(tags.burst === 1) suggestions.push('⚔️ 输出型 — 主力清怪');
  if(tags.cc >= 1) suggestions.push('🎯 控场 — 拉开战局、断敌节奏');
  if(tags.mobility >= 1) suggestions.push('💨 机动 — 走位拉扯、绕过守卫');
  if(tags.utility >= 1) suggestions.push('🔧 工具型 — 切换/资源/保险');
  // BOSS 特别标注
  if(type.indexOf('boss') === 0) suggestions.unshift('👑 区域 BOSS — 击败后通向下一层区域');
  if(suggestions.length === 0) suggestions.push('⚖️ 均衡型 — 无明显短板');
  // 评级
  var role = '';
  if(tags.regen >= 1 && tags.tank >= 1) role = '坦克/续航';
  else if(tags.lifesteal >= 1) role = '吸血输出';
  else if(tags.burst >= 2) role = '爆发刺客';
  else if(tags.tank >= 2) role = '重装坦克';
  else if(tags.cc >= 1) role = '控场';
  else if(tags.mobility >= 1) role = '游走';
  else role = '均衡';
  return { suggestions:suggestions, role:role };
};
