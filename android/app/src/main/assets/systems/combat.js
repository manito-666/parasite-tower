// ================================================================
// === Phase 3: 连击系统 ===
const COMBO_TIERS=[
  {min:1,label:'',bonus:0,tier:1},
  {min:3,label:'连击!',bonus:0.05,tier:2},
  {min:5,label:'猛攻!',bonus:0.10,tier:2},
  {min:8,label:'狂暴连击!',bonus:0.15,tier:3},
  {min:12,label:'毁灭风暴!',bonus:0.25,tier:4},
  {min:20,label:'无尽杀戮!',bonus:0.35,tier:5}
];
function getComboTier(count){
  let t=COMBO_TIERS[0];
  for(let i=COMBO_TIERS.length-1;i>=0;i--){if(count>=COMBO_TIERS[i].min){t=COMBO_TIERS[i];break;}}
  return t;
}
function updateComboDisplay(){
  const el=document.getElementById('combo-display');
  const counter=document.getElementById('combo-counter');
  const bonus=document.getElementById('combo-bonus');
  if(!el||!counter)return;
  const count=game._comboCount||0;
  if(count<2){el.classList.add('hidden');return;}
  el.classList.remove('hidden');
  const tier=getComboTier(count);
  counter.textContent=count;
  counter.className='combo-tier-'+tier.tier;
  if(tier.bonus>0){
    bonus.textContent=tier.label+' DMG+'+Math.round(tier.bonus*100)+'%';
    bonus.style.color=counter.style.color;
  }else{bonus.textContent='';}
  // 连击阶段提升时弹出动画
  if(game._lastComboTier!==undefined&&tier.tier>game._lastComboTier){
    counter.style.animation='none';
    counter.offsetHeight;
    counter.style.animation='comboPop 0.4s ease-out, comboFlash 0.6s infinite 0.4s';
    showTraitEffect(tier.label,'combo-tier-'+tier.tier==='combo-tier-5'?'#00ffd0':tier.tier>=4?'#b455ff':tier.tier>=3?'#ff8800':'#ff0');
    try{sounds.comboUp();}catch(e){}
    GameEvents.emit('combo:tierUp',{count:count,tier:tier.tier,label:tier.label,bonus:tier.bonus});
  }
  game._lastComboTier=tier.tier;
}
function getComboBonus(){
  const count=game._comboCount||0;
  const base=getComboTier(count).bonus;
  if(base<=0)return 0;
  // 双核心耦合: 污染越高，形态共鸣越强（污染70+: ×1.5，污染50+: ×1.25）
  const pol=game.player.pollution||0;
  const polMult=pol>=70?1.5:pol>=50?1.25:1;
  const cardMult=1+(game.player._cardComboMult||0);
  return base*polMult*cardMult;
}
function resetCombo(showEffect){
  const prev=game._comboCount||0;
  if(prev>=3&&showEffect){
    // 连击中断视觉
    const el=document.getElementById('combo-counter');
    if(el){el.style.animation='comboShatter 0.5s ease-out';setTimeout(()=>{document.getElementById('combo-display').classList.add('hidden');},500);}
    try{sounds.comboBreak();}catch(e){}
  }else{
    const el=document.getElementById('combo-display');if(el)el.classList.add('hidden');
  }
  game._comboCount=0;
  game._lastComboTier=0;
  updateEdgeGlow(0);
}
function updateEdgeGlow(comboCount){
  const el=document.getElementById('edge-glow');if(!el)return;
  if(comboCount<5){el.style.opacity='0';return;}
  const tier=getComboTier(comboCount);
  const colors={2:'rgba(255,255,0,0.08)',3:'rgba(255,136,0,0.12)',4:'rgba(180,85,255,0.15)',5:'rgba(0,255,208,0.2)'};
  const c=colors[tier.tier]||'transparent';
  el.style.background='radial-gradient(ellipse at center,transparent 60%,'+c+' 100%)';
  el.style.opacity='1';
  el.style.animation='edgeGlow 1.5s infinite';
}
// 战斗视觉: 大号暴击伤害浮字
function spawnCritFloatingText(x,y,text,color){
  const el=document.createElement('div');
  el.style.cssText='position:fixed;top:40%;left:50%;font-size:48px;font-weight:900;color:'+color+';text-shadow:0 0 20px '+color+',0 0 40px '+color+';animation:critNumber 1s ease-out;pointer-events:none;z-index:9999;font-family:Courier New,monospace';
  el.textContent=text;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1000);
}
// 命中闪烁（战斗面板）
function flashCombatBox(){
  const box=document.getElementById('combat-box');
  if(!box)return;
  box.classList.add('combat-hit-flash');
  setTimeout(()=>box.classList.remove('combat-hit-flash'),150);
}
// ================================================================
// === 战斗子函数 ===
// 1. 计算玩家伤害
function calcPlayerDamage(p,m,round){
  let baseAtk=p.atk;
  // 3.2 形态进化树: level 1/2/3 = +5%/+10%/+18% ATK
  var _evoLvl=getFormEvoLevel(p.formType);
  if(_evoLvl>0){
    var _evoMult=_evoLvl===3?1.18:_evoLvl===2?1.10:1.05;
    baseAtk=Math.floor(baseAtk*_evoMult);
  }
  if(game._skillEffects.nextAtkX2){baseAtk*=2;game._skillEffects.nextAtkX2=false;}
  if(game._skillEffects.nextAtkX3){baseAtk*=3;game._skillEffects.nextAtkX3=false;}
  if(game._skillEffects.fastStrike){baseAtk=Math.floor(baseAtk*1.8);game._skillEffects.fastStrike=false;game._skillEffects._fastStrikeNoCounter=true;}
  if(game._skillEffects.tripleHit){baseAtk=Math.floor(baseAtk*2.1);game._skillEffects.tripleHit=false;}
  if(game.curseBlessing&&game.curseBlessing.mods.atkMult)baseAtk=Math.floor(baseAtk*game.curseBlessing.mods.atkMult);
  if(game._webbed){game._webbed=false;baseAtk=Math.floor(baseAtk*0.7);}
  const backstabMult=(round===1)?ghostBackstabMult():1;
  var _atkCtx={self:p,target:m,atk:baseAtk,round:round};runTraitPipeline('onAtkCalc',_atkCtx,p.traits);baseAtk=_atkCtx.atk;
  // 血族被动：血怒（HP<30%时+50%攻击）
  if(p.playerClass==='blood'&&p.hp<p.maxHp*0.3){
    var _bloodRage=1.5;
    var _lowHpEvo=getEvolutionEffect('lowHpBonus');if(_lowHpEvo)_bloodRage+=_lowHpEvo;
    baseAtk=Math.floor(baseAtk*_bloodRage);
  }
  // 机甲被动：护盾>50时攻击+20%（需进化解锁）
  if(p.playerClass==='mech'&&(p.armor||0)>50&&getEvolutionEffect('shieldAtkBonus'))baseAtk=Math.floor(baseAtk*(1+getEvolutionEffect('shieldAtkBonus')));
  let pDmg=Math.max(1,baseAtk-m.def);
  const extraDmg=getEvolutionEffect('extraDmg');if(extraDmg)pDmg=Math.floor(pDmg*(1+extraDmg));
  if((m.ability==='armored'||monsterHasTrait(m,'护甲'))&&round<=3){pDmg=Math.max(1,baseAtk-m.def*2);if(extraDmg)pDmg=Math.floor(pDmg*(1+extraDmg));}
  let isCrit=false;
  const critChance=getTraitValue('critChance');
  const critMult=getTraitValue('critMult')||1.5;
  const sigCritBonus=game._sigFlags.critBonus||0;
  const passiveCritBonus=getPassiveValue('passiveCrit');
  if((critChance||sigCritBonus||passiveCritBonus)&&Math.random()<((critChance||0)+sigCritBonus+passiveCritBonus)){pDmg=Math.floor(pDmg*critMult);isCrit=true;}
  if(game.player.pollutionPassives.resonance&&Math.random()<0.15){const polDmg=game.player.pollution;pDmg+=polDmg;showTraitEffect('☢️ 污染共鸣! +'+polDmg,'#ff8800');}
  if(game._loneWolf)pDmg=Math.floor(pDmg*1.3);
  if(p._storyLoneWolfBonus&&(!p.formType||p.formType==='human'))pDmg=Math.floor(pDmg*1.2);
  if(game._skillEffects.guaranteedCrit){pDmg=Math.floor(pDmg*2);game._skillEffects.guaranteedCrit=false;isCrit=true;}
  const multiHit=getTraitValue('multiHit');
  if(multiHit>1)pDmg=Math.floor(pDmg*0.8*multiHit);
  if(backstabMult>1)pDmg=Math.floor(pDmg*backstabMult);
  const swarmDmg=swarmExtraDamage(m.def);
  if(game._sigFlags.atkMult)pDmg=Math.floor(pDmg*game._sigFlags.atkMult);
  if(game._sigFlags.randomDmg)pDmg=Math.max(1,Math.floor(pDmg*(0.5+Math.random()*1.5)));
  if(game._sigFlags.dmgMult)pDmg=Math.floor(pDmg*game._sigFlags.dmgMult);
  if(game.curseBlessing&&game.curseBlessing.mods.dmgRandom){const r=game.curseBlessing.mods.dmgRandom;pDmg=Math.max(1,Math.floor(pDmg*(r[0]+Math.random()*(r[1]-r[0]))));}
  if(monsterHasTrait(m,'恐惧')&&!hasTraitEffect('fearAura'))pDmg=Math.max(1,Math.floor(pDmg*0.9));
  if(p._voidWalker)pDmg=0;
  return {pDmg,isCrit,multiHit,backstabMult,swarmDmg};
}
// 2. 计算怪物伤害
function calcMonsterDamage(p,m,round){
  let mAtkMod=m.atk;
  if(m._atkDebuff&&m._atkDebuffTurns>0)mAtkMod=Math.floor(mAtkMod*m._atkDebuff);
  // Z3污染核心：首回合怪物ATK×1.2
  if(Math.min(5,Math.ceil(game.floor/10))===3&&round===1)mAtkMod=Math.floor(mAtkMod*1.2);
  // 玩家"恐惧光环"等对怪物 ATK 的减益走 onOpponentAtkCalc pipeline
  var _mAtkCtx={self:m,target:p,atk:mAtkMod,round:round};runTraitPipeline('onOpponentAtkCalc',_mAtkCtx,p.traits);mAtkMod=_mAtkCtx.atk;
  const pFear=getPassiveValue('passiveFear');if(pFear)mAtkMod=Math.floor(mAtkMod*(1-pFear));
  let pDefEff=p.def;
  if(p._storyTenacious&&p.hp<p.maxHp*0.2)pDefEff=Math.floor(pDefEff*2);
  if(game._sigFlags.defMult)pDefEff=Math.floor(pDefEff*game._sigFlags.defMult);
  let mDmg=Math.max(1,mAtkMod-pDefEff);
  if(m._stunned){mDmg=0;m._stunned=false;}
  const traitDmgReduce=getTraitValue('dmgReduce');
  if(traitDmgReduce)mDmg=Math.floor(mDmg*(1-traitDmgReduce));
  const dmgReduce=getEvolutionEffect('dmgReduce');
  if(dmgReduce)mDmg=Math.floor(mDmg*(1-dmgReduce));
  // 泰坦终极：额外减伤20%
  if(p.ultimateActive&&p.playerClass==='titan')mDmg=Math.floor(mDmg*0.8);
  const mimicDef=getTraitValue('mimicDef');
  if(mimicDef)mDmg=Math.floor(mDmg*(1-mimicDef));
  if((m.ability==='berserk'||monsterHasTrait(m,'狂暴'))&&m.hp<m.maxHp*0.5)mDmg=Math.floor(mDmg*1.5);
  if(mMultiHitCheck(m))mDmg=Math.floor(mDmg*0.7*2);
  if(monsterHasTrait(m,'蓄力')&&round%3===0)mDmg=Math.floor(mDmg*2);
  if(game._skillEffects.shield&&game._skillEffects._shieldTurns>0){mDmg=Math.floor(mDmg*0.5);game._skillEffects._shieldTurns--;if(game._skillEffects._shieldTurns<=0)game._skillEffects.shield=false;}
  if(game._skillEffects.dodge&&game._skillEffects._dodgeTurns>0){mDmg=0;game._skillEffects._dodgeTurns--;if(game._skillEffects._dodgeTurns<=0)game._skillEffects.dodge=false;}
  if(game._skillEffects.fearDebuff)mDmg=Math.floor(mDmg*0.7);
  if(game.curseBlessing&&game.curseBlessing.mods.dmgTakenMult)mDmg=Math.floor(mDmg*game.curseBlessing.mods.dmgTakenMult);
  if(game._sigFlags.dmgMult)mDmg=Math.floor(mDmg*game._sigFlags.dmgMult);
  if(game._sigFlags.monsterDoubleHit)mDmg=Math.floor(mDmg*2);
  var _dodgeCh=getTraitValue('dodgeChance');
  if(_dodgeCh&&Math.random()<_dodgeCh){mDmg=0;showTraitEffect('🦎 闪避！','#7ccd7c');}
  return mDmg;
}
function mMultiHitCheck(m){return monsterHasTrait(m,'多重攻击');}
// 3. 第1回合战斗信息
function logRoundStart(log,p,m){
  var _h=['<div style="color:#ff8c00;font-weight:bold">战斗开始！</div>'];
  addBattleLog('⚔ vs '+m.name+' (HP:'+m.hp+' ATK:'+m.atk+' DEF:'+m.def+')','#ff8c00');
  if(m._ambush){_h.push('<div style="color:#ff006e;font-weight:bold">【伏击！】敌人突袭 — 第1回合你无法反击！</div>');showTraitEffect('伏击!','#ff006e');game._shakeFrames=4;}
  if(hasTraitEffect('berserkAtk')&&p.hp<p.maxHp*0.5){_h.push('<div style="color:#ff006e">【狂暴】ATK+50%！</div>');showTraitEffect('💢 狂暴','#ff006e');}
  if(hasTraitEffect('fearAura')){_h.push('<div style="color:#a4a">【恐惧光环】敌ATK-10%</div>');showTraitEffect('👻 恐惧光环','#b455ff');}
  if(m.ability==='armored'||monsterHasTrait(m,'护甲'))_h.push('<div style="color:#aaa">【护甲】前3回合防御翻倍</div>');
  if(m.ability==='berserk'||monsterHasTrait(m,'狂暴'))_h.push('<div style="color:#ff006e">【狂暴】HP&lt;50%时ATK+50%</div>');
  if(m.ability==='vampiric'||monsterHasTrait(m,'吸血'))_h.push('<div style="color:#a4a">【吸血】每回合回复伤害</div>');
  if(m.ability==='poison'||monsterHasTrait(m,'毒素'))_h.push('<div style="color:#4a4">【毒素】击败后额外伤害</div>');
  if(monsterHasTrait(m,'反击'))_h.push('<div style="color:#f80">【反击】受击时反弹50%伤害</div>');
  if(monsterHasTrait(m,'多重攻击'))_h.push('<div style="color:#ff0">【多重攻击】每回合攻击2次</div>');
  if(monsterHasTrait(m,'再生')||monsterHasTrait(m,'再生+'))_h.push('<div style="color:#00ffd0">【再生】每回合恢复HP</div>');
  if(monsterHasTrait(m,'不死'))_h.push('<div style="color:#ff0">【不死】首次致死时复活</div>');
  if(monsterHasTrait(m,'恐惧'))_h.push('<div style="color:#a4a">【恐惧】降低你的攻击力10%</div>');
  if(monsterHasTrait(m,'电击'))_h.push('<div style="color:#00ffd0">【电击】有几率眩晕你</div>');
  if(monsterHasTrait(m,'撕裂'))_h.push('<div style="color:#ff006e">【撕裂】造成持续流血</div>');
  if(monsterHasTrait(m,'吸取'))_h.push('<div style="color:#a4a">【吸取】攻击吸取你的生命</div>');
  if(monsterHasTrait(m,'召唤'))_h.push('<div style="color:#ff0">【召唤】可能呼叫援军</div>');
  if(monsterHasTrait(m,'蛛网'))_h.push('<div style="color:#888">【蛛网】减速并降低你的伤害</div>');
  if(monsterHasTrait(m,'腐蚀'))_h.push('<div style="color:#4a4">【腐蚀】逐渐削弱你的防御</div>');
  if(monsterHasTrait(m,'爆炸'))_h.push('<div style="color:#f80">【爆炸】死亡时自爆</div>');
  log.innerHTML=_h.join('');
}
// 4. 回合结束效果
function applyEndOfRoundEffects(log,p,m,round,pDmg,mDmg,dmgTaken){
  // 吸血回复
  const lifesteal=getEvolutionEffect('lifesteal');
  if(lifesteal){const heal=Math.floor(pDmg*lifesteal);p.hp=Math.min(p.maxHp,p.hp+heal);showTraitEffect('🩸 吸血+'+heal,'#b455ff');sounds.heal();}
  const traitLifesteal=getTraitValue('lifesteal');
  if(traitLifesteal){const heal=Math.floor(pDmg*traitLifesteal);p.hp=Math.min(p.maxHp,p.hp+heal);showTraitEffect('🩸 吸血+'+heal,'#b455ff');sounds.heal();}
  // 血族被动吸血（基础10%）+ 血月狂宴（100%）
  if(p.playerClass==='blood'&&pDmg>0){
    var _bloodRate=0.10;
    if(p._bloodMoon)_bloodRate=1.0;
    var _bHeal=Math.max(1,Math.floor(pDmg*_bloodRate));
    p.hp=Math.min(p.maxHp,p.hp+_bHeal);
    showTraitEffect('🩸 '+(_bloodRate>=1?'狂宴':'嗜血')+'+'+_bHeal,'#cc0022');
    try{sounds.heal();}catch(e){}
  }
  // 每日修饰：鲜血之夜（全职业15%吸血）
  if(game._dailyVampire&&pDmg>0&&p.playerClass!=='blood'){
    var _dvHeal=Math.max(1,Math.floor(pDmg*0.15));
    p.hp=Math.min(p.maxHp,p.hp+_dvHeal);
    showTraitEffect('🩸 鲜血之夜+'+_dvHeal,'#cc0022');
  }
  // 战斗回合回血（商店道具）
  const combatRegen=(p._regenCombat||0)+(p._permRegen||0);
  if(combatRegen>0){const heal=Math.max(1,Math.floor(p.maxHp*combatRegen));p.hp=Math.min(p.maxHp,p.hp+heal);log.innerHTML+='<div style="color:#00ffd0;font-size:9px">🧬 再生+'+heal+'</div>';}
  const drainHp=getTraitValue('drainHp');
  if(drainHp&&round===1){const drain=Math.floor(m.maxHp*drainHp);p.hp=Math.min(p.maxHp,p.hp+drain);log.innerHTML+='<div style="color:#a4a;font-size:9px">吸取+'+drain+'</div>';showTraitEffect('💉 吸取+'+drain,'#b455ff');sounds.heal();}
  // 怪物再生 → onTurnStart pipeline
  if(m.hp>0&&m.traits&&m.traits.length){var _mrCtx={self:m,log:[]};runTraitPipeline('onTurnStart',_mrCtx,m.traits);_mrCtx.log.forEach(function(s){log.innerHTML+='<div style="color:#00ffd0;font-size:10px">'+s+'</div>';});}
  // 撕裂流血
  if(m._bleedApplied&&m.hp>0){const bleedDmg=Math.max(1,Math.floor(p.maxHp*0.05));p.hp-=bleedDmg;game._combatTotalDmg+=bleedDmg;log.innerHTML+='<div style="color:#ff006e;font-size:10px">🩸 撕裂流血 -'+bleedDmg+'</div>';}
  // 腐蚀提示
  if(monsterHasTrait(m,'腐蚀')&&m.hp>0&&m._corrodeApplied>0)log.innerHTML+='<div style="color:#4a4;font-size:10px">🧪 腐蚀: DEF已降低'+m._corrodeApplied+'</div>';
  // 召唤
  if(monsterHasTrait(m,'召唤')&&m.hp>0&&round%4===0&&Math.random()<0.2){
    const zone=Math.min(5,Math.ceil(game.floor/10));
    const types=Object.keys(monsterTemplates).filter(k=>monsterTemplates[k].zone===zone&&!k.includes('boss'));
    if(types.length>0){
      const sType=types[Math.floor(Math.random()*types.length)];
      const sTmpl=monsterTemplates[sType];
      var _occ=new Set();for(var _oi=0;_oi<game.monsters.length;_oi++){var _om=game.monsters[_oi];if(_om&&_om.hp>0)_occ.add(_om.x+','+_om.y);}
      let sx,sy,_sTry=0;do{sx=2+Math.floor(Math.random()*9);sy=2+Math.floor(Math.random()*9);_sTry++;}
      while(_sTry<50&&((sx===game.player.x&&sy===game.player.y)||game.tiles[sy][sx]!==1||_occ.has(sx+','+sy)));
      if(_sTry>=50)return;
      game.monsters.push({id:sType+'_s'+Date.now()+'_'+Math.floor(Math.random()*1000),type:sType,name:sTmpl.name,hp:Math.floor(sTmpl.maxHp*0.6),maxHp:Math.floor(sTmpl.maxHp*0.6),atk:sTmpl.atk,def:sTmpl.def,traits:sTmpl.traits.slice(),color:sTmpl.color,x:sx,y:sy,possessed:false});
      log.innerHTML+='<div style="color:#ff0;font-weight:bold">【召唤】'+m.name+'呼叫了'+sTmpl.name+'!</div>';
      addMsg(m.name+'召唤了'+sTmpl.name+'!');
    }
  }
  // 技能效果
  if(game._skillEffects.poisonDot&&game._skillEffects._poisonTurns>0){const pdmg=Math.max(1,Math.floor(m.maxHp*0.08));m.hp-=pdmg;game._skillEffects._poisonTurns--;if(game._skillEffects._poisonTurns<=0)game._skillEffects.poisonDot=false;log.innerHTML+='<div style="color:#0f0;font-size:10px">🧪 剧毒 -'+pdmg+'</div>';}
  if(game._skillEffects.heavyBleed){const bdmg=Math.max(1,Math.floor(m.maxHp*0.1));m.hp-=bdmg;log.innerHTML+='<div style="color:#ff006e;font-size:10px">🔪 致命撕裂 -'+bdmg+'</div>';}
  if(game._skillEffects.perfectCounter&&mDmg>0){m.hp-=mDmg;game._skillEffects.perfectCounter=false;log.innerHTML+='<div style="color:#00ffd0;font-size:10px">🔄 完美格挡反弹 '+mDmg+'!</div>';}
  if(game._skillEffects.healOnHit&&pDmg>0){const hl=Math.floor(pDmg*0.3);p.hp=Math.min(p.maxHp,p.hp+hl);game._skillEffects.healOnHit=false;log.innerHTML+='<div style="color:#00ffd0;font-size:10px">🩸 生命汲取 +'+hl+'</div>';}
  log.scrollTop=log.scrollHeight;
  tickUltimate();
  // 递减一次性碎片技能持续效果
  if(game._skillEffects.thornShield&&game._skillEffects._thornTurns>0){game._skillEffects._thornTurns--;if(game._skillEffects._thornTurns<=0)game._skillEffects.thornShield=false;}
  if(m._atkDebuffTurns>0){m._atkDebuffTurns--;if(m._atkDebuffTurns<=0){m._atkDebuff=null;}}
  // 清除伏击标记（仅影响第1回合）
  if(m._ambush&&round>=1)m._ambush=false;
}
// 5. 战斗结果判定（死亡/击杀/继续）
function handleCombatResult(log,p,m,round){
  // 技能: 死亡拒绝
  if(p.hp<=0&&!game._combatSaved&&game._skillEffects.extraRevive){p.hp=Math.floor(p.maxHp*0.5);game._skillEffects.extraRevive=false;game._combatSaved=true;log.innerHTML+='<div style="color:#ff0;font-weight:bold">💀 死亡拒绝! 复活50%HP!</div>';}
  // 不死特性 → onDeath pipeline
  if(p.hp<=0&&!game._combatSaved){var _dCtx={self:p,saved:false,log:[]};runTraitPipeline('onDeath',_dCtx,p.traits);if(_dCtx.saved){game._revived=true;game._combatSaved=true;_dCtx.log.forEach(function(s){log.innerHTML+='<div style="color:#ff0;font-weight:bold">'+s+'</div>';});showTraitEffect('💀 不死复活!','#ff0');}else if(p._deathBlast){var _pBlast=p._deathBlast;p._deathBlast=0;if(m&&m.hp>0){m.hp=Math.max(0,m.hp-_pBlast);log.innerHTML+='<div style="color:#f80;font-weight:bold">💥 死亡爆炸 对'+m.name+'-'+_pBlast+'HP</div>';}if(game.monsters&&game.monsters.length){for(var _bi=0;_bi<game.monsters.length;_bi++){var _bm=game.monsters[_bi];if(_bm===m||!_bm||_bm.hp<=0)continue;if(Math.abs(_bm.x-p.x)<=1&&Math.abs(_bm.y-p.y)<=1){_bm.hp=Math.max(0,_bm.hp-_pBlast);}}showTraitEffect('💥 死亡爆炸!','#f80');}}}
  // 污染被动保命
  if(p.hp<0)p.hp=0;
  // 玩家死亡
  if(p.hp<=0){
    game._autoFight=false;
    const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
    if(aliveBackups.length>0){
      game._deathChoiceActive=true;try{sounds.death();}catch(e){}
      log.innerHTML+='<div style="color:#00ffd0;font-weight:bold;margin-top:6px">// 意识抽离中... //</div>';
      log.scrollTop=log.scrollHeight;addMsg('意识正在脱离濒死躯体...');addBattleLog('⚠ 意识脱离 — 选择新形态...','#00ffd0');
      game._combatEnding=true;closeCombat();
      setTimeout(()=>{game._combatEnding=false;showDeathChoice();},500);return 'dead';
    }
    game._combatRound=0;try{sounds.death();}catch(e){}
    log.innerHTML+='<div style="color:#ff006e;font-weight:bold;margin-top:6px">// 宿主死亡 //</div>';
    log.scrollTop=log.scrollHeight;addMsg('宿主死亡...');
    game._combatEnding=true;setTimeout(()=>{game._combatEnding=false;closeCombat();triggerDeath();},1200);return 'dead';
  }
  // 怪物死亡
  if(m.hp<=0){
    if(monsterHasTrait(m,'不死')&&!m._revived){m._revived=true;m.hp=Math.max(1,Math.floor(m.maxHp*0.3));log.innerHTML+='<div style="color:#ff0;font-weight:bold">💀【不死】'+m.name+'复活了！恢复30%HP</div>';addMsg(m.name+'触发不死，复活!');showCombat();render();return 'continue';}
    if(monsterHasTrait(m,'爆炸')){const boomDmg=Math.max(1,Math.floor(m.maxHp*0.3));p.hp=Math.max(1,p.hp-boomDmg);log.innerHTML+='<div style="color:#f80;font-weight:bold">💥【爆炸】'+m.name+'自爆! -'+boomDmg+'HP</div>';addMsg(m.name+'自爆! -'+boomDmg+'HP');}
    // 分裂：怪物死亡时分裂成 2 个弱体（HP/ATK 50%），相邻空格生成
    if(monsterHasTrait(m,'分裂')&&!m._splitDone&&monsterTemplates[m.type]){
      m._splitDone=true;
      var _stmpl=monsterTemplates[m.type];
      var _splitN=0;
      var _dirs=[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
      for(var _si=0;_si<_dirs.length&&_splitN<2;_si++){
        var _sx=m.x+_dirs[_si][0],_sy=m.y+_dirs[_si][1];
        if(_sx<1||_sy<1||!game.tiles[_sy]||game.tiles[_sy][_sx]!==1)continue;
        if(game.monsters.some(function(em){return em.x===_sx&&em.y===_sy&&em.hp>0;}))continue;
        if(p.x===_sx&&p.y===_sy)continue;
        var _shp=Math.max(1,Math.floor(m.maxHp*0.5)),_satk=Math.max(1,Math.floor(m.atk*0.5));
        game.monsters.push({id:m.type+'_split_'+Date.now()+'_'+_splitN,type:m.type,name:'分裂体·'+_stmpl.name,hp:_shp,maxHp:_shp,atk:_satk,def:m.def,traits:_stmpl.traits.filter(function(tr){return tr!=='分裂';}),color:_stmpl.color,x:_sx,y:_sy,possessed:false,ai:(typeof getMonsterAI==='function'?getMonsterAI(_stmpl):'idle'),alertLevel:1,homeX:_sx,homeY:_sy,detectRange:(typeof getMonsterDetectRange==='function'?getMonsterDetectRange(_stmpl):3)});
        _splitN++;
      }
      if(_splitN>0){log.innerHTML+='<div style="color:#a8f;font-weight:bold">🧫【分裂】'+m.name+'分裂出 '+_splitN+' 个弱体!</div>';addMsg(m.name+'分裂为 '+_splitN+' 个弱体!');}
    }
    if(monsterHasTrait(m,'毒素')&&m.ability!=='poison'){var _toxAdd=(typeof addEnvPollution==='function')?addEnvPollution(3,null):(p.pollution=Math.min(100,(p.pollution||0)+3),3);if(_toxAdd>0)log.innerHTML+='<div style="color:#4a4;font-size:10px">🧪 毒素残留 污染+'+_toxAdd+'</div>';}
    if(m._corrodeApplied&&m._preCombatDef!==undefined)p.def=m._preCombatDef;
    if(game._floor5Mirror&&m.type.startsWith('mirror_'))completeFloor5();
    updateFormAffinity(p.formType,'kill',1);
    const traitPoison=getTraitValue('poisonDmg');
    if(traitPoison)log.innerHTML+='<div style="color:#4a4;font-size:9px">毒素伤害已施加</div>';
    if(m.ability==='poison'){const pd=Math.max(1,Math.floor(game._combatTotalDmg*0.1));p.hp=Math.max(1,p.hp-pd);log.innerHTML+='<div style="color:#4a4">毒素反噬-'+pd+'</div>';}
    const mZone=monsterTemplates[m.type]?monsterTemplates[m.type].zone:1;
    let evoGain=10+mZone*15+Math.floor(Math.random()*8);
    if(m._elite)evoGain=Math.floor(evoGain*1.8);
    if(game._dailyBounty)evoGain=Math.floor(evoGain*2);
    const bonusEvo=getEvolutionEffect('bonusEvo');if(bonusEvo)evoGain+=bonusEvo;
    const evoBonus=getTraitValue('evoBonus');if(evoBonus)evoGain+=evoBonus;
    const lootBonus=getTraitValue('lootBonus');if(lootBonus)evoGain=Math.floor(evoGain*lootBonus);
    if(game._sigFlags.epMult!==undefined)evoGain=Math.floor(evoGain*game._sigFlags.epMult);
    if(game.curseBlessing&&game.curseBlessing.mods.epMult!==undefined)evoGain=Math.floor(evoGain*game.curseBlessing.mods.epMult);
    if(game._sigFlags.eliteReward)evoGain=Math.floor(evoGain*game._sigFlags.eliteReward);
    if(game._routeMods&&game._routeMods.epMult)evoGain=Math.floor(evoGain*game._routeMods.epMult);
    const passiveEPBonus=getPassiveValue('passiveEP');if(passiveEPBonus)evoGain=Math.floor(evoGain*(1+passiveEPBonus));
    if(window.GameModes&&GameModes.isShort()&&window.ShortMode){var _epCurve=ShortMode.getFloorCurve(game.floor).epMult;if(_epCurve!==1)evoGain=Math.floor(evoGain*_epCurve);}
    else if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){var _eep=ExpeditionMode.getFloorCurve(game.floor).epMult;if(_eep!==1)evoGain=Math.floor(evoGain*_eep);}
    else if(typeof getFullFloorCurve==='function'){var _fep=getFullFloorCurve(game.floor).epMult;if(_fep!==1)evoGain=Math.floor(evoGain*_fep);}
    p.evoPoints+=evoGain;
    if(game._skillEffects.epBonus){game._skillEffects.epBonus=false;p.evoPoints+=50;addMsg('💰 掠夺! +50EP');}
    tryDropFragment(m);
    if(game._sigFlags.bountyId&&m.id===game._sigFlags.bountyId){p.evoPoints+=500;addMsg('🎯 悬赏完成 +500EP!');game._sigFlags.bountyId=null;}
    if(game._sigFlags.stalkerReward&&m.id&&m.id.startsWith('stalker_')){p.evoPoints+=game._sigFlags.stalkerReward;addMsg('👤 暗影猎手击杀! +'+game._sigFlags.stalkerReward+'EP');}
    if(game._sigFlags.killOrder){if(game._sigFlags.killOrder[game._sigFlags.killIdx]===m.id){game._sigFlags.killIdx++;if(game._sigFlags.judgmentBonus){p.evoPoints+=game._sigFlags.judgmentBonus;addMsg('⚖ 正确顺序! +'+game._sigFlags.judgmentBonus+'EP');}}else{game._sigFlags.killPenalty=true;addMsg('⚖ 审判: 击杀顺序错误! 下只敌人ATK×2');}}
    if(game._sigFlags.healOnKill){const hk=Math.floor(p.maxHp*game._sigFlags.healOnKill);p.hp=Math.min(p.maxHp,p.hp+hk);addMsg('♨ 击杀治愈 +'+hk+'HP');}
    if(game.curseBlessing&&game.curseBlessing.mods.killHeal){const kh=Math.floor(m.maxHp*game.curseBlessing.mods.killHeal);p.hp=Math.min(p.maxHp,p.hp+kh);addMsg('+'+kh+'HP(击杀回复)');}
    // 血族进化：击杀回复25%最大HP
    if(p.playerClass==='blood'){var _bkh=getEvolutionEffect('killHeal');if(_bkh){var _bheal=Math.floor(p.maxHp*_bkh);p.hp=Math.min(p.maxHp,p.hp+_bheal);addMsg('<span style="color:#cc0022">🩸 血池+'+_bheal+'HP</span>');}}
    if(game.player.pollutionPassives.deathPulse){const dph=Math.floor(p.maxHp*0.1);p.hp=Math.min(p.maxHp,p.hp+dph);addMsg('💀 死亡脉冲 +'+dph+'HP');}
    log.innerHTML+='<div style="color:#00ffd0;font-weight:bold;margin-top:6px">胜利！+'+evoGain+'EP</div>';
    // 击杀爆裂粒子
    spawnHitSparks(m.x,m.y,'#00ffd0',12);
    spawnHitSparks(m.x,m.y,'#ff0',6);
    game._shakeFrames=3;
    log.scrollTop=log.scrollHeight;
    addMsg('击败 '+m.name+'('+round+'回合)，+'+evoGain+'EP');
    addBattleLog('✦ 击败 '+m.name+' ('+round+'回合) +'+evoGain+'EP','#00ffd0');
    game._totalKills=(game._totalKills||0)+1;
    runTraitPipeline('onKill',{self:p,victim:m,log:null},p.traits||[]);
    // Boss击败回满血
    if(m.type&&m.type.startsWith('boss')){
      try{sounds.bossDefeat();flashAhaMoment&&flashAhaMoment('★ BOSS 已击败','#00ffd0');}catch(e){}
      p.hp=p.maxHp;addMsg('★ Boss击败！完全恢复！');log.innerHTML+='<div style="color:#00ffd0;font-weight:bold">★ Boss击败！HP完全恢复！</div>';
      // 卡槽扩展碎片掉落（boss1-4 各保底 1 片，3 片合成 +1 槽）
      if(['boss1','boss2','boss3','boss4'].indexOf(m.type)>=0){
        if(!game._slotFragments)game._slotFragments=0;
        if(!game._bossSlotDropped)game._bossSlotDropped={};
        if(!game._bossSlotDropped[m.type]){
          game._bossSlotDropped[m.type]=true;
          game._slotFragments++;
          addMsg('<span style="color:#ffd700;font-weight:bold">🧩 获得「形态槽碎片」('+game._slotFragments+'/3)</span>');
          if(game._slotFragments>=3&&game.forms.length<4){
            game._slotFragments-=3;
            game.forms.push(null);game._deadForms.push(false);
            addMsg('<span style="color:#ffd700;font-size:1.15em;font-weight:900;text-shadow:0 0 8px #ffd700">✨ 碎片合成！形态槽 +1（当前 '+game.forms.length+'/4）</span>');
            updateFormBar();
          }else if(game._slotFragments>=3&&game.forms.length>=4){
            game._slotFragments=3; // 封顶，已满上限
            addMsg('<span style="color:#888">　形态槽已达上限(4)，碎片冻结</span>');
          }
        }
      }
    }
    GameEvents.emit('monster:kill',{monster:m,rounds:round,comboCount:game._comboCount||0,evoGain:evoGain});
    checkAchievements();
    if(game._tutorialStage===0&&m.id==='tut_rat'){
      game._tutorialStage=1;
      if(typeof announceStageUp==='function')announceStageUp(1);
      setTimeout(function(){ showTutorialPossess(m); },800);
    }else if(game._tutorialStage===0){
      game._tutorialStage=1;addMsg('<span style="color:#00ffd0;font-weight:bold">💡 附身解锁！击败敌人后可尝试🧬附身获取其能力</span>');
      if(typeof announceStageUp==='function')announceStageUp(1);
      setTimeout(function(){checkTutorial('firstKill');checkTutorial('inspect');},500);
    }
    if(m._tutorialHighlight){delete m._tutorialHighlight;delete game._tutorialTarget;}
    game._combatRound=0;checkEvoUnlockHint();
    if(game._tutorialStage>=3&&(game.player.evoPoints||0)>0&&typeof checkTutorial==='function')setTimeout(function(){checkTutorial('evoHint');},1500);
    game._attackRounds=0;game._consecutiveDefends=0;
    game._combatEnding=true;
    game.target=null;
    markDirty();
    setTimeout(()=>{game._combatEnding=false;closeCombat();checkHiddenStory('combat_win');game._consecutiveDeaths=0;checkFloorCleared();render();saveGame();},1200);
    return 'killed';
  }
  return 'continue';
}
// ================================================================
function attack(){
if(typeof dismissSoftHint==='function')dismissSoftHint('attack');
if(typeof dismissTutorial==='function')dismissTutorial('attack');
markDirty();
if(game._deathChoiceActive)return;
if(game._inCombat)return;
game._inCombat=true;
try{
const p=game.player,m=game.target;
if(!game._combatRound)game._combatRound=0;
if(!game._combatTotalDmg)game._combatTotalDmg=0;
game._consecutiveDefends=0;
game._combatRound++;
const round=game._combatRound;
if(round===1)game._attackRounds=0;

if(game._sigFlags.killPenalty){m.atk=Math.floor(m.atk*2);game._sigFlags.killPenalty=false;}

// 重组僵直检测
const log=document.getElementById('combat-log');
if(game._stiffnessTurns>0){
  game._stiffnessTurns--;
  game._combatRound--;
  game._autoFight=false;
  if(log){log.innerHTML+='<div style="color:#00ffd0;font-weight:bold">【重组僵直】本回合无法行动，但免受伤害</div>';log.scrollTop=log.scrollHeight;}
  if(typeof _refreshCombatUI==='function')_refreshCombatUI();
  render();return;
}

// 眩晕检测
if(game._playerStunned){
  game._playerStunned=false;
  if(log)log.innerHTML+='<div style="color:#8844ff;font-weight:bold">【眩晕】你被电击麻痹，无法行动！</div>';
  let stunDmg=Math.max(1,m.atk-p.def);
  if((m.ability==='berserk'||monsterHasTrait(m,'狂暴'))&&m.hp<m.maxHp*0.5)stunDmg=Math.floor(stunDmg*2);
  stunDmg=titanArmorAbsorb(stunDmg);
  p.hp-=stunDmg;game._combatTotalDmg+=stunDmg;
  if(log)log.innerHTML+='<div style="margin:2px 0;padding:3px;background:rgba(255,255,255,0.04)"><b>R'+round+'</b> <span style="color:#8844ff">眩晕!</span> 敌-><span style="color:#ff006e">'+stunDmg+'</span></div>';
  if(m._bleedApplied){const bleedDmg=Math.max(1,Math.floor(p.maxHp*0.05));p.hp-=bleedDmg;game._combatTotalDmg+=bleedDmg;if(log)log.innerHTML+='<div style="color:#ff006e;font-size:10px">🩸 撕裂流血 -'+bleedDmg+'</div>';}
  if(log)log.scrollTop=log.scrollHeight;
  addMsg('R'+round+': 眩晕! 敌→'+stunDmg);
  addBattleLog('R'+round+' ⚡眩晕! 敌→'+stunDmg+' ['+m.name+' HP:'+m.hp+'/'+m.maxHp+']','#8844ff');
  const res=handleCombatResult(log,p,m,round);
  if(res==='continue'){showCombat();render();}
  return;
}

// === 调用子函数计算伤害 ===
if(round===1&&log)logRoundStart(log,p,m);
const isFirstStrike=hasTraitEffect('firstStrike')&&round===1;
const {pDmg:rawPDmg,isCrit,multiHit,backstabMult,swarmDmg}=calcPlayerDamage(p,m,round);

// 连击加成
const comboBonus=getComboBonus();
let pDmg=comboBonus>0?Math.floor(rawPDmg*(1+comboBonus)):rawPDmg;

// 持久战加成：基于攻击回合数（防御不计入）
game._attackRounds=(game._attackRounds||0)+1;
var _atkRounds=game._attackRounds;
if(_atkRounds>6){
  var _overRounds=_atkRounds-6;
  var _bonusDmg=Math.floor(m.maxHp*0.08*_overRounds);
  pDmg+=_bonusDmg;
}

// 玩家攻击怪物
// 铁壁：10% 完全格挡（仅对怪物方）
if(pDmg>0&&monsterHasTrait(m,'铁壁')&&Math.random()<0.1){var _ironBlock=pDmg;pDmg=0;if(log)log.innerHTML+='<div style="color:#8a9aff;font-size:10px">🛡️ 铁壁 完全格挡 -'+_ironBlock+'</div>';}
m.hp-=pDmg;
if(bossPhaseData[m.type])checkBossPhase(m);
try{sounds.hit();}catch(e){}
flashCombatBox();
const mirrorDmg=handleFloor5Combat(m,pDmg);
if(mirrorDmg>0){p.hp-=mirrorDmg;game._combatTotalDmg+=mirrorDmg;}
if(swarmDmg>0)m.hp-=swarmDmg;
if(m.hp<0)m.hp=0;

// 构建回合日志
let roundLog='<div style="margin:2px 0;padding:3px;background:rgba(255,255,255,0.04)"><b>R'+round+'</b> 你-><span style="color:#4a4">'+pDmg+'</span>';
if(comboBonus>0)roundLog+=' <span style="color:#ff0;font-size:9px">(连击+'+Math.round(comboBonus*100)+'%)</span>';
if(isCrit){roundLog+=' <span style="color:#b455ff">暴击!</span>';showTraitEffect('💥 暴击!','#b455ff');try{sounds.crit();}catch(e){}game._shakeFrames=6;spawnCritFloatingText(0,0,'-'+pDmg,'#b455ff');}
if(multiHit>1)showTraitEffect('⚡ 多重攻击×'+multiHit,'#ff0');
if(backstabMult>1)showTraitEffect('🗡️ 背刺×'+backstabMult,'#00ffd0');

// 怪物反击
let dmgTaken=0;
const isAmbushRound=m._ambush&&round===1;
// 剧情奖励：预知闪避 / 疾风突刺免反击 / 蛛网陷阱
if(m.hp>0&&game._skillEffects._fastStrikeNoCounter){game._skillEffects._fastStrikeNoCounter=false;roundLog+=' <span style="color:#7ccd7c">💨先手免反击</span>';}
else if(m.hp>0&&m._netStunTurns>0){m._netStunTurns--;if(m._netStunTurns<=0)m._stunned=false;roundLog+=' <span style="color:#888">🕸网中无法行动</span>';}
else if(m.hp>0&&!isFirstStrike&&!p._voidWalker&&p._storyDodge&&Math.random()<p._storyDodge){
  roundLog+=' <span style="color:#b455ff">👁预知闪避!</span>';
}else if(m.hp>0&&!isFirstStrike&&!p._voidWalker){
  let mDmg=calcMonsterDamage(p,m,round);
  // 伏击：第1回合怪物伤害×1.5
  if(isAmbushRound){mDmg=Math.floor(mDmg*1.5);roundLog+=' <span style="color:#ff006e;font-weight:bold">[突袭]</span>';}
  dmgTaken=swarmTakeDamage(titanArmorAbsorb(mDmg));
  if(dmgTaken>0&&game._skillEffects.summonDecoy){game._skillEffects.summonDecoy=false;dmgTaken=0;roundLog+=' <span style="color:#00ffd0">[分身挡伤]</span>';}
  // 弹性反弹：免伤一次并反弹
  if(dmgTaken>0&&game._skillEffects.dodgeReflect){game._skillEffects.dodgeReflect=false;m.hp-=dmgTaken;roundLog+=' <span style="color:#7ccd7c">🦎反弹-'+dmgTaken+'</span>';dmgTaken=0;}
  if(dmgTaken>0&&game.player.pollutionPassives.corrodeBody&&Math.random()<0.1){dmgTaken=0;roundLog+=' <span style="color:#ff8800">☢️腐蚀免伤</span>';}
  // 玩家受击 trait pipeline（适应/结晶/虚无/棘刺/硬化等）—— hook 内部已自行扣 attacker.hp，外部只读 counter 用于统计/日志
  if(dmgTaken>0&&p.traits&&p.traits.length){var _phCtx={self:p,attacker:m,defender:p,dmg:dmgTaken,log:[]};runTraitPipeline('onHitTaken',_phCtx,p.traits);dmgTaken=Math.max(0,_phCtx.dmg|0);if(_phCtx.counter)game._combatTotalDmg+=_phCtx.counter;if(_phCtx.log.length)roundLog+=' <span style="color:#7ccd7c">'+_phCtx.log.join(' ')+'</span>';}
  p.hp-=dmgTaken;game._combatTotalDmg+=dmgTaken;
  // 棘甲：3回合反弹50%受到的伤害
  if(dmgTaken>0&&game._skillEffects.thornShield&&game._skillEffects._thornTurns>0){const t=Math.max(1,Math.floor(dmgTaken*0.5));m.hp-=t;roundLog+=' <span style="color:#aaa">🪨棘甲-'+t+'</span>';}
  if(dmgTaken>0&&hasPassiveEffect('passiveCounter')&&Math.random()<0.3){const reflect=Math.floor(dmgTaken*0.5);m.hp-=reflect;roundLog+=' <span style="color:#b455ff">↩️反击-'+reflect+'</span>';}
  if(dmgTaken>0)GameEvents.emit('player:damage',{amount:dmgTaken,source:m.name,hp:p.hp,maxHp:p.maxHp});
  updateFormAffinity(p.formType,'damage',dmgTaken);
  swarmSplit(dmgTaken);
  roundLog+=' 敌-><span style="color:#ff006e">'+dmgTaken+'</span>';
  // 怪物战斗traits
  if((m.ability==='vampiric'||monsterHasTrait(m,'吸血'))&&dmgTaken>0){const vHeal=Math.floor(dmgTaken*0.3);m.hp=Math.min(m.maxHp,m.hp+vHeal);roundLog+=' <span style="color:#a4a">吸血+'+vHeal+'</span>';}
  // 怪物反击 → onHitTaken pipeline
  if(pDmg>0&&m.traits&&m.traits.length){var _hCtx={self:m,attacker:p,dmg:pDmg,log:[]};runTraitPipeline('onHitTaken',_hCtx,m.traits);if(_hCtx.counter){game._combatTotalDmg+=_hCtx.counter;roundLog+=' <span style="color:#f80">'+_hCtx.log.join(' ')+'</span>';}}
  if(monsterHasTrait(m,'吸取')&&dmgTaken>0){const da=Math.max(1,Math.floor(dmgTaken*0.1));m.hp=Math.min(m.maxHp,m.hp+da);roundLog+=' <span style="color:#a4a">吸取+'+da+'</span>';}
  if(monsterHasTrait(m,'电击')&&dmgTaken>0&&Math.random()<0.15){game._playerStunned=true;roundLog+=' <span style="color:#8844ff">⚡眩晕!</span>';}
  if(monsterHasTrait(m,'撕裂')&&dmgTaken>0&&!m._bleedApplied){m._bleedApplied=true;roundLog+=' <span style="color:#ff006e">撕裂!</span>';}
  if(monsterHasTrait(m,'蛛网')&&Math.random()<0.2){game._webbed=true;roundLog+=' <span style="color:#888">蛛网缠绕!</span>';}
}else if(m.hp>0&&p._voidWalker){
  roundLog+=' <span style="color:#a4a">(虚空无敌)</span>';
}else if(m.hp>0&&isFirstStrike){
  roundLog+=' <span style="color:#ff0">(先手免伤)</span>';
  showTraitEffect('🛡️ 先手免伤','#ff0');
}

roundLog+=' | 敌HP:<span style="color:'+((m.maxHp>0?m.hp/m.maxHp:0)>0.5?'#00ffd0':(m.maxHp>0?m.hp/m.maxHp:0)>0.2?'#ff0':'#ff006e')+'">'+m.hp+'</span></div>';
if(p._storyPollRegen&&p.hp>0){const prHeal=Math.max(1,Math.floor(p.maxHp*0.02));p.hp=Math.min(p.maxHp,p.hp+prHeal);roundLog=roundLog.replace('</div>','<span style="color:#00ffd0;font-size:9px"> +'+prHeal+'♻</span></div>');}
log.innerHTML+=roundLog;

// 浮动伤害文字 + 连击 + 命中粒子
if(pDmg>0){
  if(!isCrit)spawnFloatingText(m.x*T+T/2,m.y*T,'-'+pDmg,'#fff');
  spawnHitSparks(m.x,m.y,isCrit?'#b455ff':'#ff8800',isCrit?8:4);
}
if(dmgTaken>0){spawnFloatingText(p.x*T+T/2,p.y*T,'-'+dmgTaken,'#ff006e');spawnHitSparks(p.x,p.y,'#ff006e',3);}
game._comboCount=(game._comboCount||0)+1;
updateComboDisplay();
updateEdgeGlow(game._comboCount);

// 回合结束效果
applyEndOfRoundEffects(log,p,m,round,pDmg,0,dmgTaken);

// 战斗结果判定
const result=handleCombatResult(log,p,m,round);
if(result==='continue'){
  const tier=getComboTier(game._comboCount);
  const comboTag=game._comboCount>1?' <span style="color:'+(tier.tier>=4?'#b455ff':tier.tier>=3?'#ff8800':'#ff0')+';font-weight:bold">('+game._comboCount+'连击'+(tier.label?' '+tier.label:'')+')</span>':'';
  addMsg('R'+round+': 你→'+pDmg+' 敌→'+dmgTaken+' 敌HP:'+m.hp+comboTag);
  addBattleLog('R'+round+' 你→'+pDmg+(isCrit?' 暴击!':'')+' 敌→'+dmgTaken+' ['+m.name+' HP:'+m.hp+'/'+m.maxHp+']',dmgTaken>pDmg?'#ff006e':'#00ffd0');
  showCombat();render();
}
}finally{game._inCombat=false;}
}
function defend(){
if(typeof dismissSoftHint==='function')dismissSoftHint('defend');
if(typeof dismissTutorial==='function')dismissTutorial('defend');
// 首次防御反馈（每个存档仅一次）
try{if(!localStorage.getItem('pt_first_defend')){localStorage.setItem('pt_first_defend','1');setTimeout(function(){addMsg('<span style="color:#8844ff;font-weight:bold">→ 防御！减半伤害 +回少量HP</span>');},300);}}catch(e){}
markDirty();
try{sounds.defend();}catch(e){}
if(!game.target||game.target.hp<=0)return;
if(game._deathChoiceActive)return;
if(game._stiffnessTurns>0){
  const log=document.getElementById('combat-log');
  if(log){log.innerHTML+='<div style="color:#00ffd0;font-weight:bold">【重组僵直】本回合无法行动，但免受伤害</div>';log.scrollTop=log.scrollHeight;}
  game._stiffnessTurns--;
  if(typeof _refreshCombatUI==='function')_refreshCombatUI();
  render();return;
}
if(game._playerStunned){
  game._playerStunned=false;
  if(!game._combatRound)game._combatRound=0;
  game._combatRound++;
  const p=game.player,m=game.target,round=game._combatRound;
  const log=document.getElementById('combat-log');
  let stunDmg=Math.max(1,m.atk-p.def);
  if((m.ability==='berserk'||monsterHasTrait(m,'狂暴'))&&m.hp<m.maxHp*0.5)stunDmg=Math.floor(stunDmg*2);
  stunDmg=titanArmorAbsorb(stunDmg);
  p.hp-=stunDmg;if(!game._combatTotalDmg)game._combatTotalDmg=0;game._combatTotalDmg+=stunDmg;
  log.innerHTML+='<div style="margin:2px 0;padding:3px;background:rgba(255,255,255,0.04)"><b>R'+round+'</b> <span style="color:#8844ff">眩晕!</span> 敌→<span style="color:#ff006e">'+stunDmg+'</span></div>';
  if(p.hp<=0){
    game._deathChoiceActive=true;game._autoFight=false;game._combatEnding=true;
    const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
    if(aliveBackups.length>0){try{sounds.death();}catch(e){}closeCombat();setTimeout(()=>{game._combatEnding=false;showDeathChoice();},500);return;}
    try{sounds.death();}catch(e){}addMsg('宿主死亡...');setTimeout(()=>{game._combatEnding=false;closeCombat();triggerDeath();},1200);return;
  }
  showCombat();render();return;
}
const p=game.player,m=game.target;
if(!game._combatRound)game._combatRound=0;
if(!game._combatTotalDmg)game._combatTotalDmg=0;
game._combatRound++;
const round=game._combatRound;
const log=document.getElementById('combat-log');
if(round===1&&log)log.innerHTML='';
// 防御中断连击
resetCombo(true);
// 连续防御衰减计数
game._consecutiveDefends=(game._consecutiveDefends||0)+1;
var _cdCount=game._consecutiveDefends;
// 防御回复：前3次8%，之后递减（第4次5%，第5次3%，第6次+仅1%）
var _healRate=0.08;
if(_cdCount>3) _healRate=Math.max(0.01, 0.08 - (_cdCount-3)*0.025);
// 防御减伤：前3次50%，之后递减（第4次65%，第5次80%，第6次+不再减伤）
var _defReduce=0.5;
if(_cdCount>3) _defReduce=Math.min(1.0, 0.5 + (_cdCount-3)*0.15);
game._defendCount=(game._defendCount||0)+1;
if(game._defendCount>=10)unlockAchievement('defend10');
const heal=Math.max(1,Math.floor(p.maxHp*_healRate));
p.hp=Math.min(p.maxHp,p.hp+heal);
// 怪物攻击（伤害减半）
let mAtkMod=m.atk;
if(m._atkDebuff&&m._atkDebuffTurns>0)mAtkMod=Math.floor(mAtkMod*m._atkDebuff);
var _mAtkCtx2={self:m,target:p,atk:mAtkMod,round:round};runTraitPipeline('onOpponentAtkCalc',_mAtkCtx2,p.traits);mAtkMod=_mAtkCtx2.atk;
let mDmg=Math.max(1,mAtkMod-p.def);
if((m.ability==='berserk'||monsterHasTrait(m,'狂暴'))&&m.hp<m.maxHp*0.5)mDmg=Math.floor(mDmg*1.5);
if(monsterHasTrait(m,'多重攻击'))mDmg=Math.floor(mDmg*0.7*2);
if(monsterHasTrait(m,'蓄力')&&round%3===0)mDmg=Math.floor(mDmg*2);
var _dCh=getTraitValue('dodgeChance');
if(_dCh&&Math.random()<_dCh){mDmg=0;showTraitEffect('🦎 闪避！','#7ccd7c');}
// 技能效果
if(game._skillEffects.shield&&game._skillEffects._shieldTurns>0){mDmg=Math.floor(mDmg*0.5);game._skillEffects._shieldTurns--;if(game._skillEffects._shieldTurns<=0)game._skillEffects.shield=false;}
if(game._skillEffects.dodge&&game._skillEffects._dodgeTurns>0){mDmg=0;game._skillEffects._dodgeTurns--;if(game._skillEffects._dodgeTurns<=0)game._skillEffects.dodge=false;}
if(game._skillEffects.fearDebuff)mDmg=Math.floor(mDmg*0.7);
// 防御减伤（连续防御衰减）
mDmg=Math.floor(mDmg*_defReduce);
// 羁绊被动：记忆盾墙（防御时反弹30%伤害）
if(p._affinityPassive&&p._affinityPassive.effect==='blockCounter'&&mDmg>0&&m.hp>0){
  const reflect=Math.floor(mDmg*p._affinityPassive.value);
  if(reflect>0){m.hp-=reflect;log.innerHTML+='<div style="color:#ffcc00;font-size:10px">🔗 记忆盾墙反弹 -'+reflect+'</div>';}
}
// 签名修正
if(game._sigFlags.dmgMult)mDmg=Math.floor(mDmg*game._sigFlags.dmgMult);
if(game._sigFlags.monsterDoubleHit)mDmg=Math.floor(mDmg*2);
// 泰坦装甲 + 虫群分摊
mDmg=titanArmorAbsorb(mDmg);
mDmg=swarmTakeDamage(mDmg);
if(mDmg>0&&game.player.pollutionPassives.corrodeBody&&Math.random()<0.1){mDmg=0;log.innerHTML+='<div style="color:#ff8800;font-size:10px">☢️ 腐蚀之体免伤!</div>';}
p.hp-=mDmg;
game._combatTotalDmg+=mDmg;
// 羁绊追踪：受伤
updateFormAffinity(p.formType,'damage',mDmg);
// 虫群分裂
swarmSplit(mDmg);
// 电击眩晕
if(monsterHasTrait(m,'电击')&&m.hp>0&&mDmg>0&&Math.random()<0.15)game._playerStunned=true;
// 撕裂流血
if(m._bleedApplied&&m.hp>0){const bd=Math.max(1,Math.floor(p.maxHp*0.05));p.hp-=bd;game._combatTotalDmg+=bd;log.innerHTML+='<div style="color:#ff006e;font-size:10px">🩸 撕裂流血 -'+bd+'</div>';}
// 腐蚀
if(monsterHasTrait(m,'腐蚀')&&m.hp>0&&m._corrodeApplied>0)log.innerHTML+='<div style="color:#4a4;font-size:10px">🧪 腐蚀: DEF已降低'+m._corrodeApplied+'</div>';
// 怪物再生 → onTurnStart pipeline
if(m.hp>0&&m.traits&&m.traits.length){var _mr2Ctx={self:m,log:[]};runTraitPipeline('onTurnStart',_mr2Ctx,m.traits);_mr2Ctx.log.forEach(function(s){log.innerHTML+='<div style="color:#00ffd0;font-size:10px">'+s+'</div>';});}
// 日志
var _defLabel=_cdCount>3?'减伤'+Math.round((1-_defReduce)*100)+'%':'减半';
log.innerHTML+='<div style="margin:2px 0;padding:3px;background:rgba(60,120,255,0.1);border-left:2px solid #8844ff"><b>R'+round+'</b> 🛡防御 <span style="color:#00ffd0">+'+heal+'HP</span> 敌→<span style="color:#88f">'+mDmg+'</span>('+_defLabel+')'+(game._playerStunned?' <span style="color:#8844ff">⚡眩晕!</span>':'')+(_cdCount>=3?' <span style="color:#ff8c00;font-size:9px">⚠连续防御'+_cdCount+'次</span>':'')+'</div>';
log.scrollTop=log.scrollHeight;
addMsg('R'+round+': 防御 +'+heal+'HP 受'+mDmg+'伤('+_defLabel+')');
// 不死/污染保命 → onDeath pipeline
if(p.hp<=0&&!game._combatSaved){var _dCtx2={self:p,saved:false,log:[]};runTraitPipeline('onDeath',_dCtx2,p.traits);if(_dCtx2.saved){game._revived=true;game._combatSaved=true;_dCtx2.log.forEach(function(s){log.innerHTML+='<div style="color:#ff0;font-weight:bold">'+s+'</div>';});}}
if(p.hp<0)p.hp=0;
// 死亡检测
if(p.hp<=0){
  game._deathChoiceActive=true;game._autoFight=false;game._combatEnding=true;
  const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
  if(aliveBackups.length>0){try{sounds.death();}catch(e){}log.innerHTML+='<div style="color:#00ffd0;font-weight:bold">// 意识抽离中... //</div>';closeCombat();setTimeout(()=>{game._combatEnding=false;showDeathChoice();},500);return;}
  try{sounds.death();}catch(e){}addMsg('宿主死亡...');setTimeout(()=>{game._combatEnding=false;closeCombat();triggerDeath();},1200);return;
}
tickUltimate();
showCombat();render();
}
function showTutorialPossess(deadMonster){
  closeCombat();
  if(typeof _tutorialShown!=='undefined'){_tutorialShown['possess']=true;if(typeof _saveTutShown==='function')_saveTutShown();}
  setTimeout(function(){
    var ev=document.getElementById('event-overlay');
    if(!ev)return;
    document.getElementById('event-title').textContent=t('宿主选择');
    document.getElementById('event-text').innerHTML='<div style="text-align:center;line-height:2;color:#ccc"><span style="color:#888;font-size:12px">这副躯壳太脆弱了。</span><br><span style="color:#c6f;font-weight:bold">去夺取更强的身体。</span></div>';
    var choicesEl=document.getElementById('event-choices');
    choicesEl.innerHTML='';
    var btn=document.createElement('button');
    btn.className='btn';
    btn.style.cssText='background:linear-gradient(135deg,#1a1028,#0d0d2b);border:1px solid #00ffd0;color:#00ffd0;font-weight:bold;padding:12px 24px;font-size:14px';
    btn.textContent=t('寻找更强宿主');
    btn.onclick=function(){
      ev.style.display='none';
      if(game._tutorialStage<1)game._tutorialStage=1;
      var dog=game.monsters.find(function(mm){return mm.id==='tut_dog'&&mm.hp>0;});
      if(dog){
        dog.hp=1;dog._tutorialHighlight=true;dog.alertLevel=0;
        game._tutorialTarget=dog;
        addMsg('<span style="color:#ffcc00">发现可用宿主：<b>受伤的看门犬</b></span>');
        setTimeout(function(){addMsg('<span style="color:#888;font-size:11px">虚弱目标更容易附身</span>');},400);
      }
    };
    choicesEl.appendChild(btn);
    ev.style.display='flex';
  },500);
}
// ================================================================
// 逃跑确认系统
// ================================================================
function confirmFlee(){
  if(typeof dismissSoftHint==='function')dismissSoftHint('flee');
  if(!game.target)return;
  const fleeCost=Math.max(5,Math.floor(game.player.maxHp*0.05));
  const infoEl=document.getElementById('flee-info');
  infoEl.innerHTML='<div style="color:#ff8c00;margin-bottom:8px">逃跑需付出代价：</div>'+
    '<div style="color:#ff006e;font-size:1.1em;margin:6px 0">HP -'+fleeCost+'</div>'+
    '<div style="color:#666;font-size:.8em">(当前HP: '+game.player.hp+'/'+game.player.maxHp+')</div>';
  document.getElementById('flee-confirm-overlay').style.display='flex';
}
function executeFlee(){
  document.getElementById('flee-confirm-overlay').style.display='none';
  const fleeCost=Math.max(5,Math.floor(game.player.maxHp*0.05));
  game.player.hp=Math.max(1,game.player.hp-fleeCost);
  const fleeTarget=game.target;
  addMsg('逃跑成功 HP-'+fleeCost);
  closeCombat();
  if(fleeTarget){
    const dx=game.player.x-fleeTarget.x;
    const dy=game.player.y-fleeTarget.y;
    const dirs=[];
    if(dx!==0)dirs.push([dx>0?1:-1,0]);
    if(dy!==0)dirs.push([0,dy>0?1:-1]);
    dirs.push([1,0],[-1,0],[0,1],[0,-1]);
    for(const d of dirs){
      const nx=game.player.x+d[0],ny=game.player.y+d[1];
      if(nx>=1&&nx<=11&&ny>=1&&ny<=11&&game.tiles[ny][nx]===1&&!game.monsters.some(m=>m.hp>0&&m.x===nx&&m.y===ny)){
        game.player.x=nx;game.player.y=ny;break;
      }
    }
    fleeTarget._fleeImmunity=2;
  }
  render();
}
function cancelFlee(){
  document.getElementById('flee-confirm-overlay').style.display='none';
}

function possess(){
if(typeof dismissSoftHint==='function')dismissSoftHint('possess');
if(typeof dismissTutorial==='function')dismissTutorial('possess');
markDirty();
if(!game.target)return;
if(game._deathChoiceActive)return;
if(game._stiffnessTurns>0){addMsg('重组僵直中，无法行动');return;}
if(game.player.possessed[game.target.id]){addMsg('已附身过此个体');return;}
if(game.target._enraged){addMsg('谈判已破裂，无法再次附身');return;}
openNegotiate();
}
