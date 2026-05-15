// ================================================================
// 技能碎片系统
// ================================================================
function tryDropFragment(monster){
  if(!monster.traits||monster.traits.length===0)return;
  let dropRate=0.6;
  if(window.GameModes&&GameModes.isShort()&&window.ShortMode){dropRate=ShortMode.getFloorCurve(game.floor).fragRate;}
  else if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){dropRate=ExpeditionMode.getFloorCurve(game.floor).fragRate;}
  else if(typeof getFullFloorCurve==='function'){dropRate=getFullFloorCurve(game.floor).fragRate;}
  if(game.curseBlessing&&game.curseBlessing.mods.fragRate!==undefined)dropRate=game.curseBlessing.mods.fragRate;
  if(game._routeMods&&game._routeMods.fragMult)dropRate=Math.min(1,dropRate*game._routeMods.fragMult);
  const isBoss=monster.type&&monster.type.startsWith('boss');
  if(!isBoss&&Math.random()>=dropRate)return;
  if(game._fragDropCount===undefined)game._fragDropCount=0;
  if(game._fragDropCount>=2&&!isBoss)return;
  game._fragDropCount++;
  const candidates=generateFragCandidates(monster,isBoss);
  if(candidates.length===0)return;
  if(!game._fragDrops)game._fragDrops=[];
  game._fragDrops.push({x:monster.x,y:monster.y,candidates:candidates,isBoss:isBoss});
  addMsg('💎 碎片掉落在地上！走过去拾取');
}
function generateFragCandidates(monster,isBoss){
  const zone=Math.min(5,Math.ceil(game.floor/10));
  const zonePools={
    1:['护甲','再生','忠诚','厚皮','护甲被动','生命力被动'],
    2:['吸血','狂暴','毒素','撕裂','掠夺','掠夺被动'],
    3:['暴击','电击','恐惧','蛛网','伏击','恐惧被动','洞察被动'],
    4:['召唤','寄生强化','反击','弹性','不死','反击被动','寄生被动'],
    5:['迅捷','相位','污染光环','爆炸','迅捷被动']
  };
  let pool=[];
  for(let z=1;z<=zone;z++){
    const w=z===zone?3:(zone-z>=2?1:2);
    (zonePools[z]||[]).forEach(t=>{if(fragmentSkillMap[t])for(let i=0;i<w;i++)pool.push(t);});
  }
  const results=[];
  const validTraits=monster.traits.filter(t=>fragmentSkillMap[t]);
  if(validTraits.length>0)results.push(validTraits[Math.floor(Math.random()*validTraits.length)]);
  const boosted=new Set();
  game.skillFragments.forEach(f=>{
    if(game.skillFragments.filter(ff=>ff.type===f.type).length>=2&&fragmentSkillMap[f.type])boosted.add(f.type);
  });
  boosted.forEach(t=>{for(let i=0;i<6;i++)pool.push(t);});
  while(results.length<3&&pool.length>0){
    const idx=Math.floor(Math.random()*pool.length);
    const t=pool[idx];
    if(!results.includes(t))results.push(t);
    pool.splice(idx,1);
  }
  if(isBoss&&results.length>=3){
    const extra=validTraits.length>0?validTraits[Math.floor(Math.random()*validTraits.length)]:null;
    if(extra&&!results.includes(extra))results.push(extra);
  }
  return results;
}
function checkFragPickup(x,y){
  if(!game._fragDrops||game._fragDrops.length===0)return;
  const idx=game._fragDrops.findIndex(d=>d.x===x&&d.y===y);
  if(idx===-1)return;
  const drop=game._fragDrops.splice(idx,1)[0];
  try{sounds.pickup();}catch(e){}
  showFragmentChoice(drop.candidates,drop.isBoss);
}
function showFragmentChoice(candidates,isBoss){
  try{
  const ov=document.getElementById('frag-choice-overlay');
  if(!ov)return;
  ov.style.display='flex';
  const cardsEl=document.getElementById('frag-choice-cards');
  const skipEp=50;
  document.getElementById('frag-skip-ep').textContent=skipEp;
  cardsEl.innerHTML='';
  candidates.forEach(function(trait){
    const fDef=fragmentSkillMap[trait];if(!fDef)return;
    const count=game.skillFragments.filter(f=>f.type===trait).length;
    const near=count>=2;
    const card=document.createElement('div');
    card.className='frag-card'+(near?' near-synth':'');
    card.innerHTML='<span class="fc-icon">'+fDef.fragIcon+'</span>'+
      '<div class="fc-name">'+fDef.fragName+'</div>'+
      '<div class="fc-desc">'+fDef.skill.desc+'</div>'+
      '<div class="fc-type '+(fDef.passive?'passive':'active')+'">'+(fDef.passive?'[被动]':'[主动]')+'</div>'+
      '<div class="fc-quality">★☆☆</div>'+
      '<div class="fc-progress'+(near?' near':'')+'">'+count+'/3'+(near?' ⚡合成!':'')+'</div>';
    card.onclick=function(){pickFragment(trait);ov.style.display='none';};
    cardsEl.appendChild(card);
  });
  document.getElementById('frag-choice-skip').onclick=function(){
    game.player.evoPoints+=skipEp;
    addMsg('放弃碎片 +'+skipEp+'EP');
    ov.style.display='none';
    game._fragDirty=true;markDirty();render();
  };
  }catch(e){console.error('showFragmentChoice error:',e);}
}
function pickFragment(trait){
  const frag=fragmentSkillMap[trait];if(!frag)return;
  const maxFrags=(game.curseBlessing&&game.curseBlessing.mods.fragMax)||12;
  const currentCount=game.skillFragments.filter(f=>f.type===trait).length;
  // 即使背包满，如果拾取后能触发合成（已有2个同类），也允许拾取
  if(game.skillFragments.length>=maxFrags&&currentCount<2){
    addMsg(frag.fragIcon+' 碎片已满，自动分解 +15EP');
    game.player.evoPoints+=15;
  }else{
    game.skillFragments.push({type:trait,icon:frag.fragIcon});
    addMsg(frag.fragIcon+' 获得 '+frag.fragName+'!');
    if(currentCount+1>=3)synthesizeFragments(trait);
  }
  game._fragDirty=true;markDirty();render();
}
function synthesizeFragments(traitType){
  const frag=fragmentSkillMap[traitType];if(!frag)return;
  showSynthConfirm(traitType);
}
function showSynthConfirm(traitType){
  const frag=fragmentSkillMap[traitType];if(!frag)return;
  const ov=document.getElementById('synth-confirm-overlay');
  ov.style.display='flex';
  const isPassive=!!frag.passive;
  const preview=document.getElementById('synth-preview');
  preview.innerHTML=
    '<div style="font-size:36px;margin:8px 0">'+frag.fragIcon+' ×3</div>'+
    '<div style="font-size:20px;margin:4px 0;color:#888">⬇</div>'+
    '<div style="font-size:14px;color:#fff;font-weight:bold;margin:6px 0">'+frag.skill.icon+' '+frag.skill.name+'</div>'+
    '<div style="font-size:11px;color:#aaa;margin:4px 0">'+frag.skill.desc+'</div>'+
    '<div style="font-size:10px;margin-top:8px"><span class="fc-type '+(isPassive?'passive':'active')+'">'+(isPassive?'[被动·永久]':'[主动技能]')+'</span></div>';
  document.getElementById('synth-confirm-btn').onclick=function(){doSynthesize(traitType);ov.style.display='none';openFragBag();};
  document.getElementById('synth-cancel-btn').onclick=function(){ov.style.display='none';openFragBag();};
}
function doSynthesize(traitType){
  const frag=fragmentSkillMap[traitType];if(!frag)return;
  let removed=0;
  game.skillFragments=game.skillFragments.filter(f=>{
    if(f.type===traitType&&removed<3){removed++;return false;}return true;
  });
  if(frag.passive){
    if(!game.passiveFragEffects)game.passiveFragEffects=[];
    const eff={name:frag.skill.name,icon:frag.skill.icon,desc:frag.skill.desc,effectId:frag.skill.effectId,value:frag.skill.value||0};
    game.passiveFragEffects.push(eff);
    applyPassiveImmediate(eff);
    addMsg('🔮 被动效果: '+eff.icon+' '+eff.name+' 永久激活!');
    try{sounds.achievement&&sounds.achievement();flashAhaMoment&&flashAhaMoment(eff.icon+' '+eff.name,'#b455ff');}catch(e){}
  }else{
    let usesBonus=0;
    if(game.curseBlessing&&game.curseBlessing.mods.skillUsesBonus)usesBonus=game.curseBlessing.mods.skillUsesBonus;
    const skill={name:frag.skill.name,desc:frag.skill.desc,icon:frag.skill.icon,
      uses:frag.skill.maxUses+usesBonus,maxUses:frag.skill.maxUses+usesBonus,effectId:frag.skill.effectId};
    if(game.activeSkills.length>=3)game.activeSkills.shift();
    game.activeSkills.push(skill);
    addMsg('⚡ 合成技能: '+skill.icon+' '+skill.name+' ('+skill.uses+'次)');
    try{sounds.achievement&&sounds.achievement();flashAhaMoment&&flashAhaMoment(skill.icon+' '+skill.name,'#ffd700');}catch(e){}
  }
  game._fragDirty=true;markDirty();render();
}
function applyPassiveImmediate(eff){
  const p=game.player;
  if(!p._evoStatBonus)p._evoStatBonus={atk:0,def:0,maxHp:0};
  if(eff.effectId==='passiveDef'){var dv=eff.value||3;p.def+=dv;p._evoStatBonus.def+=dv;}
  if(eff.effectId==='passiveHP'){var hv=eff.value||30;p.maxHp+=hv;p.hp+=hv;p._evoStatBonus.maxHp+=hv;}
}
function hasPassiveEffect(id){return game.passiveFragEffects&&game.passiveFragEffects.some(e=>e.effectId===id);}
function getPassiveValue(id){if(!game.passiveFragEffects)return 0;return game.passiveFragEffects.filter(e=>e.effectId===id).reduce((s,e)=>s+(e.value||0),0);}
function openFragBag(){
  const ov=document.getElementById('frag-bag-overlay');
  ov.style.display='flex';
  const content=document.getElementById('frag-bag-content');
  const maxFrags=(game.curseBlessing&&game.curseBlessing.mods.fragMax)||12;
  let html='';
  // === 碎片区 ===
  const fragMap={};
  game.skillFragments.forEach(f=>{if(!fragMap[f.type])fragMap[f.type]={icon:f.icon,count:0};fragMap[f.type].count++;});
  const fragKeys=Object.keys(fragMap);
  html+='<div class="fb-section"><div class="fb-label">碎片 '+game.skillFragments.length+'/'+maxFrags+'</div><div>';
  if(fragKeys.length===0){html+='<span style="color:#555;font-size:11px">暂无碎片</span>';}
  fragKeys.forEach(t=>{
    const fDef=fragmentSkillMap[t];
    const cnt=fragMap[t].count;const need=fDef&&fDef.passive&&fDef.skill&&fDef.skill.effectId==='passivePossess'?2:3;
    const nearSynth=cnt>=need;const isP=fDef&&fDef.passive;
    const bc=nearSynth?'synthable':'';
    var fragClick=nearSynth?'closeFragBag();synthesizeFragments(&quot;'+t+'&quot;)':'showFragBubble(this,&quot;'+t+'&quot;)';
    html+='<div class="fb-frag '+bc+'" onclick="'+fragClick+'">'
      +'<div class="fb-icon">'+fragMap[t].icon+'</div>'
      +'<div class="fb-prog'+(nearSynth?'" style="color:#ffcc00':'')+'">'+(isP?'被':'主')+' '+cnt+'/'+need+'</div>'
      +(nearSynth?'<div class="fb-synlabel">合成</div>':'')
      +'</div>';
  });
  html+='</div></div>';
  // === 主动技能 ===
  html+='<div class="fb-section"><div class="fb-label">⚡ 主动技能 '+game.activeSkills.length+'/3</div>';
  if(game.activeSkills.length===0){html+='<div style="color:#555;font-size:11px;padding:2px 0">暂无</div>';}
  game.activeSkills.forEach(s=>{
    html+='<div class="fb-skill-row"><div class="fb-skill-icon">'+s.icon+'</div><div class="fb-skill-info"><div class="fb-skill-name">'+s.name+'</div><div class="fb-skill-desc">'+s.desc+'</div></div><div class="fb-skill-uses">'+s.uses+'/'+s.maxUses+'</div></div>';
  });
  html+='</div>';
  // === 被动效果（合并同类）===
  if(game.passiveFragEffects&&game.passiveFragEffects.length>0){
    html+='<div class="fb-section"><div class="fb-label">🔮 被动效果</div>';
    const pMap={};
    game.passiveFragEffects.forEach(e=>{
      if(!pMap[e.effectId])pMap[e.effectId]={icon:e.icon,name:e.name,desc:e.desc,count:0,value:e.value||0};
      pMap[e.effectId].count++;
    });
    Object.keys(pMap).forEach(k=>{
      const pe=pMap[k];
      const multi=pe.count>1?' ×'+pe.count:'';
      html+='<div class="fb-passive-row"><div class="fb-skill-icon">'+pe.icon+'</div><div class="fb-skill-info"><div class="fb-skill-name">'+pe.name+multi+'</div><div class="fb-skill-desc">'+pe.desc+'</div></div></div>';
    });
    html+='</div>';
  }
  content.innerHTML=html;
}
function closeFragBag(){document.getElementById('frag-bag-overlay').style.display='none';hideFragBubble();}
function showFragBubble(el,type){
  hideFragBubble();
  var fDef=fragmentSkillMap[type];if(!fDef)return;
  var cnt=game.skillFragments.filter(function(f){return f.type===type;}).length;
  var need=fDef.passive&&fDef.skill&&fDef.skill.effectId==='passivePossess'?2:3;
  var bub=document.createElement('div');bub.id='frag-bubble';
  bub.innerHTML='<div style="font-weight:bold;color:#00ffd0;margin-bottom:4px">'+fDef.fragIcon+' '+fDef.fragName+'</div>'
    +'<div style="color:#eee;font-size:11px;line-height:1.4">合成技能：<b>'+fDef.skill.name+'</b></div>'
    +'<div style="color:#aaa;font-size:10px;margin-top:2px">'+fDef.skill.desc+'</div>'
    +'<div style="color:#888;font-size:10px;margin-top:4px">'+(fDef.passive?'被动':'主动')+'技能 | 进度 '+cnt+'/'+need+'</div>';
  bub.style.cssText='position:fixed;z-index:9999;background:rgba(34,32,64,0.95);border:1px solid rgba(0,255,208,0.3);border-radius:8px;padding:8px 12px;width:180px;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.5)';
  document.body.appendChild(bub);
  var rect=el.getBoundingClientRect();
  var bw=180+24;
  var bh=bub.offsetHeight;
  var left=rect.left+rect.width/2-bw/2;
  var top=rect.top-bh-6;
  if(left<4)left=4;
  if(left+bw>window.innerWidth-4)left=window.innerWidth-4-bw;
  if(top<4){top=rect.bottom+6;}
  bub.style.left=left+'px';
  bub.style.top=top+'px';
  setTimeout(hideFragBubble,3000);
}
function hideFragBubble(){var b=document.getElementById('frag-bubble');if(b)b.remove();}
function useActiveSkill(index){
  if(game._skillLock)return;
  const skill=game.activeSkills[index];
  if(!skill||skill.uses<=0)return;
  game._skillLock=true;
  setTimeout(()=>{game._skillLock=false;},500);
  skill.uses--;
  const eid=skill.effectId;
  if(eid==='healNow25'){
    const heal=Math.floor(game.player.maxHp*0.25);
    game.player.hp=Math.min(game.player.maxHp,game.player.hp+heal);
    addMsg(skill.icon+' 紧急修复 +'+heal+'HP');
  }else if(eid==='healNow50'){
    const heal=Math.floor(game.player.maxHp*0.5);
    game.player.hp=Math.min(game.player.maxHp,game.player.hp+heal);
    addMsg(skill.icon+' 强效修复 +'+heal+'HP');
  }else if(eid==='drainTarget'){
    if(game.target){
      const drain=Math.max(1,Math.floor(game.target.maxHp*0.15));
      game.target.hp-=drain;
      game.player.hp=Math.min(game.player.maxHp,game.player.hp+drain);
      addMsg(skill.icon+' 灵魂虹吸 -'+drain+'/+'+drain+'HP');
    }else{addMsg('没有战斗目标');skill.uses++;}
  }else if(eid==='switchFullHeal'){
    game._skillEffects.switchFullHeal=true;
    addMsg(skill.icon+' 忠诚守护激活! 下次切换形态回满血');
  }else if(eid==='guaranteedPossess'){
    game._skillEffects.guaranteedPossess=true;
    addMsg(skill.icon+' 寄生狂热! 下次附身100%成功');
  }else if(eid==='permAtk'){
    if(!game.player._evoStatBonus)game.player._evoStatBonus={atk:0,def:0,maxHp:0};
    game.player.atk+=3;
    game.player._evoStatBonus.atk+=3;
    addMsg(skill.icon+' 鼓舞士气! 永久ATK+3');
  }else if(eid==='thornShield3'){
    game._skillEffects.thornShield=true;
    game._skillEffects._thornTurns=3;
    addMsg(skill.icon+' 棘甲激活! 3回合反弹50%伤害');
  }else if(eid==='nextAtkX3'){
    game._skillEffects.nextAtkX3=true;
    addMsg(skill.icon+' 暗影伏击! 下次攻击×3');
  }else if(eid==='fastStrike'){
    game._skillEffects.fastStrike=true;
    addMsg(skill.icon+' 疾风突刺! 下次攻击×1.8 免反击');
  }else if(eid==='tripleHit'){
    game._skillEffects.tripleHit=true;
    addMsg(skill.icon+' 连击风暴! 下次攻击造成2.1倍伤害');
  }else if(eid==='dodgeReflect'){
    game._skillEffects.dodgeReflect=true;
    addMsg(skill.icon+' 弹性反弹! 下次受击免伤并反弹');
  }else if(eid==='netStun'){
    if(game.target){
      game.target._netStunTurns=2;
      game.target._stunned=true;
      addMsg(skill.icon+' 蛛网陷阱! 敌人2回合无法行动');
    }else{addMsg('没有战斗目标');skill.uses++;}
  }else if(eid==='pollutionBurst'){
    if(game.target){
      const burn=Math.max(1,Math.floor(game.target.maxHp*0.15));
      game.target.hp-=burn;
      game.target._atkDebuff=0.7;
      game.target._atkDebuffTurns=3;
      addMsg(skill.icon+' 污染爆发! 敌-'+burn+'HP 且ATK-30%');
    }else{addMsg('没有战斗目标');skill.uses++;}
  }else if(eid==='shockStun'){
    if(game.target){
      const dmg=Math.floor(game.player.atk*0.5);
      game.target.hp-=dmg;game.target._stunned=true;
      addMsg(skill.icon+' 电弧释放 -'+dmg+' +眩晕');
    }
  }else if(eid==='summonDecoy'){
    game._skillEffects.summonDecoy=true;
    addMsg(skill.icon+' 幻影召唤! 下次受击由分身承受');
  }else if(eid==='epBonus'){
    game._skillEffects.epBonus=true;
    addMsg(skill.icon+' 资源掠夺激活! 下次击杀EP+50');
  }else if(eid==='selfDestruct'){
    if(game.target){
      const dmg=Math.floor(game.target.maxHp*0.3);
      game.target.hp-=dmg;
      addMsg(skill.icon+' 自爆协议! 对敌造成'+dmg+'伤害');
    }else{
      addMsg('没有战斗目标');skill.uses++;
    }
  }else{
    game._skillEffects[eid]=true;
    if(eid==='shield')game._skillEffects._shieldTurns=3;
    if(eid==='dodge')game._skillEffects._dodgeTurns=2;
    if(eid==='poisonDot')game._skillEffects._poisonTurns=3;
    addMsg(skill.icon+' '+skill.name+' 激活!');
  }
  if(skill.uses<=0)game.activeSkills.splice(index,1);
  game._fragDirty=true;
  if(game.target&&game.target.hp<=0){
    var _skLog=document.getElementById('combat-log');
    handleCombatResult(_skLog,game.player,game.target,game._combatRound||1);
    return;
  }
  showCombat();render();
}
function updateFragmentBar(){
  const bar=document.getElementById('fragment-bar');if(!bar)return;
  if(game.skillFragments.length===0&&game.activeSkills.length===0&&(!game.passiveFragEffects||game.passiveFragEffects.length===0)){bar.style.display='none';return;}
  bar.style.display='block';
  const fSlots=document.getElementById('fragment-slots');
  const fragMap={};
  game.skillFragments.forEach(f=>{if(!fragMap[f.type])fragMap[f.type]={icon:f.icon,count:0};fragMap[f.type].count++;});
  let fHtml='';
  Object.keys(fragMap).forEach(t=>{const fDef=fragmentSkillMap[t];const desc=fDef?fDef.skill.desc:'';fHtml+='<div class="frag-slot" title="'+t+' ×'+fragMap[t].count+(desc?' | 合成: '+desc:'')+'">'+fragMap[t].icon+'<span class="frag-count">'+fragMap[t].count+'</span></div>';});
  fSlots.innerHTML=fHtml;
  const sSlots=document.getElementById('active-skill-slots');
  let sHtml='';
  game.activeSkills.forEach((s,i)=>{
    sHtml+='<div class="frag-slot" style="border-color:#00ffd0;background:rgba(0,255,208,0.08)" title="'+s.name+': '+s.desc+' ('+s.uses+'次)">'+s.icon+'<span class="frag-count" style="color:#00ffd0">'+s.uses+'</span></div>';
  });
  sSlots.innerHTML=sHtml;
}

