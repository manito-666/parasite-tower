// ================================================================
// 特性效果系统
// ================================================================
function getTraitEffect(traitName){
  const effects={
    '迅捷':{moveDouble:true,desc:'可双步移动'},
    '厚皮':{dmgReduce:0.15,desc:'受伤-15%'},
    '再生':{regenPerTurn:0.03,desc:'每步回3%HP'},
    '忠诚':{evoBonus:5,healOnSwitch:0.1,desc:'击败+5EP，切换形态时回复10%HP'},
    '毒素':{poisonDmg:0.1,desc:'攻击附加10%毒伤'},
    '狂暴':{berserkAtk:0.5,desc:'HP<50%时ATK+50%'},
    '蛛网':{webChance:0.2,desc:'20%几率减速敌人'},
    '吸血':{lifesteal:0.15,desc:'攻击回15%HP'},
    '护甲':{flatDef:3,desc:'额外+3DEF'},
    '领袖':{allBonus:2,desc:'ATK&DEF+2'},
    '暴击':{critChance:0.2,critMult:1.5,desc:'20%几率1.5倍伤害'},
    '寄生强化':{possessBonus:0.12,polResist:0.15,desc:'附身率+12%，污染增长-15%'},
    '洞察':{seeTrue:true,desc:'识破幻觉'},
    '多重攻击':{multiHit:2,desc:'攻击2次(每次80%伤害)'},
    '拟态':{mimicDef:0.2,desc:'受伤-20%'},
    '污染光环':{polResist:0.3,desc:'污染增长-30%'},
    '恐惧':{fearAura:true,desc:'敌人ATK-10%'},
    '爆炸':{deathDmg:0.3,desc:'死亡时造成30%MaxHP伤害'},
    '相位':{phaseWalk:true,desc:'可穿越障碍物'},
    '不死':{revive:true,desc:'首次死亡恢复30%HP'},
    '伏击':{firstStrike:true,desc:'先手攻击'},
    '吸取':{drainHp:0.1,desc:'攻击吸取10%HP'},
    '反击':{counterAtk:0.5,desc:'反击50%伤害'},
    '掠夺':{lootBonus:1.5,desc:'战利品1.5倍'},
    '召唤':{summon:true,desc:'可能召唤援军'},
    // === 攻击类 ===
    '撕裂':{bleed:0.05,desc:'每回合流血5%MaxHP'},
    '穿甲':{armorPen:0.5,desc:'无视50%防御'},
    '连击':{multiHit:1.5,desc:'攻击3次(每次50%伤害)'},
    '蓄力':{chargeAtk:2.0,desc:'每3回合造成双倍伤害'},
    '腐蚀':{corrode:2,desc:'每回合降低敌方DEF-2'},
    '电击':{stunChance:0.15,desc:'15%几率击晕1回合'},
    // === 防御类 ===
    '厚甲':{flatDef:5,desc:'额外+5DEF'},
    '铁壁':{flatDef:8,blockChance:0.1,desc:'+8DEF，10%完全格挡'},
    '弹性':{dmgReduce:0.15,dodgeChance:0.1,desc:'受伤减少15%，10%闪避'},
    '反射':{counterAtk:1.0,desc:'反弹100%受到伤害'},
    '硬化':{hardenHp:0.2,desc:'低于20%HP时DEF翻倍'},
    '棘刺':{thornDmg:5,desc:'被攻击时反弹5点伤害'},
    // === 辅助类 ===
    '再生+':{regenPerTurn:0.05,desc:'每步回5%HP'},
    '吸血+':{lifesteal:0.25,desc:'攻击回25%HP'},
    '寄生+':{possessBonus:0.15,desc:'附身率+15%'},
    '净化':{polResist:0.5,desc:'污染增长-50%'},
    '适应':{adaptDef:true,desc:'受伤后永久+1DEF(上限5)'},
    '共生':{symbiosis:true,desc:'附身时保留1个旧特性'},
    '猎手':{evoBonus:10,desc:'击杀额外+10EP'},
    // === 移动类 ===
    '飞行':{phaseWalk:true,moveDouble:true,desc:'穿越障碍+双步'},
    '挖掘':{phaseWalk:true,desc:'穿越障碍物'},
    '瞬移':{teleport:true,desc:'可传送到视野内任意点'},
    // === 特殊类 ===
    '分裂':{splitOnDeath:true,desc:'死亡时分裂为2个弱体'},
    '感染':{infectChance:0.1,desc:'附身时10%几率掠夺+30EP'},
    '共鸣':{resonance:true,desc:'同类怪物ATK+20%'},
    '结晶':{crystalArmor:true,desc:'首次受伤完全免疫'},
    '虚无':{intangible:0.2,desc:'20%几率闪避攻击'},
    '诅咒':{curseDmg:true,desc:'附身后附带诅咒(污染+5)'},
    '融合':{fusionBonus:true,desc:'附身时ATK/DEF额外+10%'},
    '回响':{echo:true,desc:'上次攻击伤害的30%追加'},
    '噬魂':{soulEat:true,desc:'击杀恢复20%MaxHP'}
  };
  return effects[traitName]||null;
}

// 点击特性徽章查看效果描述
function showTraitInfo(traitName){
  const e=getTraitEffect(traitName);
  const desc=e&&e.desc?e.desc:'特殊效果（无详细说明）';
  const html='<div style="text-align:center;padding:8px 4px"><div style="font-size:1.5em;font-weight:bold;color:#00ffd0;margin-bottom:8px">'+traitName+'</div><div style="color:#ddd;line-height:1.6">'+desc+'</div></div>';
  showEventDialog('🧬 特性',html,true);
}

// === 怪物trait战斗辅助 ===
function monsterHasTrait(m,traitName){
  return m.traits&&m.traits.includes(traitName);
}
function getMonsterTraitVal(m,effectKey){
  if(!m.traits)return 0;
  let total=0;
  m.traits.forEach(t=>{const e=getTraitEffect(t);if(e&&e[effectKey])total+=e[effectKey];});
  return total;
}

function hasTraitEffect(effectKey){
  return game.player.traits.some(t=>{
    const e=getTraitEffect(t);
    return e&&e[effectKey];
  });
}

function getTraitValue(effectKey){
  let total=0;
  game.player.traits.forEach(t=>{
    const e=getTraitEffect(t);
    if(e&&e[effectKey])total+=e[effectKey];
  });
  return total;
}

// === Trait effect pipeline ===
// hook 行为定义在 systems/trait-hooks.js（数据/行为分离）。
// 已支持 hook：onAtkCalc / onOpponentAtkCalc / onTurnStart / onDeath / onHitTaken / onKill / onPossessSuccess
// ctx 约定字段：self, target, attacker, defender, atk, dmg, round, victim, log（可选 string[] 收集战报）, saved（onDeath 用）
// 新增 trait hook 时只需在 trait-hooks.js 调用 defineTraitHook(name,hookName,fn)，无需改 combat.js。
function runTraitPipeline(hookName,ctx,traits){
  if(!traits||!traits.length)return ctx;
  var reg=window.traitHookRegistry;
  if(!reg)return ctx;
  for(var i=0;i<traits.length;i++){
    var hooks=reg[traits[i]];
    if(hooks&&typeof hooks[hookName]==='function'){
      try{hooks[hookName](ctx);}catch(err){console.error('trait hook',traits[i],hookName,err);}
    }
  }
  return ctx;
}

