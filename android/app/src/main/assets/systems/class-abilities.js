// ================================================================
// 职业专属机制
// ================================================================
function canUseClassKit(){
  const p=game.player;
  if(!p.formType||p.formType==='human')return true;
  if(p.formType===p.playerClass)return true;
  try{return getAffinityLevel(p.formType)>=3;}catch(e){return false;}
}
function titanTrample(nx,ny){
  if(game.player.playerClass!=='titan'||!canUseClassKit())return;
  // 教学阶段不践踏教学怪（保护看门犬等被动目标）
  if(game._forceTutorial&&game._tutorialStage<2)return;
  game.monsters.forEach(m=>{
    if(m.hp<=0)return;
    if(m._tutPinned)return; // 钉死的教学怪免疫践踏
    if(Math.abs(m.x-nx)+Math.abs(m.y-ny)===1){
      const dmg=Math.max(1,Math.floor(game.player.atk*0.3)-m.def);
      m.hp-=dmg;
      addMsg('💥 践踏 '+m.name+' -'+dmg+'HP');
      if(m.hp<=0){m.hp=0;addMsg(m.name+' 被践踏致死');}
    }
  });
}
function titanArmorAbsorb(damage){
  if(game.player.playerClass!=='titan'||game.player.armor<=0||!canUseClassKit())return damage;
  const absorbed=Math.min(game.player.armor,damage);
  game.player.armor-=absorbed;
  if(absorbed>0)addMsg('🛡 装甲吸收 '+absorbed+' 伤害');
  return damage-absorbed;
}
function toggleSprint(){
  game.player._sprintEnabled=!game.player._sprintEnabled;
  addMsg(game.player._sprintEnabled?'⚡ 冲刺模式开启':'冲刺模式关闭');
  render();
}
function ghostStealth(){
  const p=game.player;
  if(p.playerClass!=='ghost'){addMsg('仅幽灵可用');return;}
  if(!canUseClassKit()){addMsg('⚠ 当前形态与起始人格不契合，潜行无法激活（需亲密度3）');return;}
  if(p.stealthActive){p.stealthActive=false;addMsg('退出潜行');render();return;}
  if(p.stealth<20){addMsg('潜行能量不足(需20)');return;}
  let stealthCost=20;
  if(p._affinityPassive&&p._affinityPassive.effect==='backstabCooldown')stealthCost=Math.floor(stealthCost*(1-p._affinityPassive.value));
  p.stealth-=stealthCost;
  p.stealthActive=true;
  addMsg('🌑 进入潜行状态（再次点击或穿过怪物取消）');
  render();
}
function ghostBackstabMult(){
  const p=game.player;
  if(p.playerClass!=='ghost'||!canUseClassKit())return 1;
  if(p.stealthActive){
    p.stealthActive=false;
    addMsg('🗡 背刺！伤害×2');
    return 2;
  }
  if(p._nextCritX5){
    p._nextCritX5=false;
    addMsg('💀 虚空行者暴击×5！');
    return 5;
  }
  if(p._firstStrikeCrit){
    p._firstStrikeCrit=false;
    addMsg('🗡 转职复仇一击！暴击');
    return 2;
  }
  return 1;
}
function swarmSplit(damage){
  const p=game.player;
  if(p.playerClass!=='swarm'||!canUseClassKit())return;
  if(Math.random()<0.2){
    p.swarms.push({hp:Math.floor(p.maxHp*0.2),atk:Math.floor(p.atk*0.5),duration:8});
    addMsg('🦗 分裂！召唤1只分身');
  }
}
function swarmExtraDamage(targetDef){
  const p=game.player;
  if(p.playerClass!=='swarm'||p.swarms.length===0||!canUseClassKit())return 0;
  let total=0;
  p.swarms.forEach(s=>{
    if(s.hp>0){
      const dmg=Math.max(1,s.atk-targetDef);
      total+=dmg;
    }
  });
  if(total>0)addMsg('🦗 '+p.swarms.filter(s=>s.hp>0).length+'只分身造成 '+total+' 伤害');
  return total;
}
function swarmTakeDamage(damage){
  const p=game.player;
  if(p.playerClass!=='swarm'||p.swarms.length===0||!canUseClassKit())return damage;
  const alive=p.swarms.filter(s=>s.hp>0);
  if(alive.length===0)return damage;
  const share=Math.floor(damage*0.3);
  alive.forEach(s=>{
    const sdmg=Math.floor(share/alive.length);
    s.hp-=sdmg;
  });
  const beforeCount=p.swarms.length;
  p.swarms=p.swarms.filter(s=>s.hp>0);
  const died=beforeCount-p.swarms.length;
  if(died>0&&p._affinityPassive&&p._affinityPassive.effect==='swarmHeal'){
    const heal=Math.floor(p.maxHp*p._affinityPassive.value*died);
    p.hp=Math.min(p.maxHp,p.hp+heal);
    addMsg('🔗 牺牲增殖 +'+heal+'HP');
  }
  return Math.floor(damage*0.7);
}
function activateUltimate(){
  const p=game.player;
  const ult=classUltimates[p.playerClass];
  if(p.ultimateActive){addMsg('终极技能已激活');return;}
  if(p.ultimateCooldown>0){addMsg(ult.name+' 冷却中('+p.ultimateCooldown+'层)');return;}
  // 首次终极反馈
  try{if(!localStorage.getItem('pt_first_ult')){localStorage.setItem('pt_first_ult','1');setTimeout(function(){addMsg('<span style="color:#ff8800;font-weight:bold">→ 终极技能释放！</span>');},200);}}catch(e){}
  if(typeof dismissTutorial==='function')dismissTutorial('ultimate');
  if(p.formType&&p.formType!=='human'&&p.formType!==p.playerClass){
    addMsg('⚠ 当前形态（'+p.name+'）与起始人格不契合，终极技无法激活');
    addMsg('💡 切回起始形态（人形）或同源形态（'+p.playerClass+'）后可用');
    return;
  }
  p.ultimateActive=true;
  p.ultimateTurns=ult.duration;
  p.ultimateCooldown=ult.cooldown;
  if(p.playerClass==='titan'){
    p._ultSavedMaxHp=p.maxHp;p._ultSavedAtk=p.atk;p._ultSavedDef=p.def;
    p.maxHp=Math.floor(p.maxHp*1.5);p.hp=Math.floor(p.hp*1.5);p.atk+=15;p.def+=15;
    addMsg('💥 泰坦之怒！HP×1.5 ATK+15 DEF+15');
  }else if(p.playerClass==='ghost'){
    p._voidWalker=true;
    addMsg('👻 虚空行者！无敌'+ult.duration+'回合');
  }else if(p.playerClass==='swarm'){
    const count=Math.min(5,Math.max(1,Math.floor(p.pollution/15)));
    for(let i=0;i<count;i++)p.swarms.push({hp:Math.floor(p.maxHp*0.5),atk:Math.floor(p.atk*0.8),duration:ult.duration});
    addMsg('🦗 虫群之心！释放'+count+'只分身');
  }else if(p.playerClass==='blood'){
    p._bloodMoon=true;
    addMsg('🩸 血月狂宴！全攻击100%吸血，每回合-5HP，持续'+ult.duration+'回合');
  }else if(p.playerClass==='mech'){
    const shield=p.pollution*3;
    const dmg=p.pollution*2;
    p.armor=(p.armor||0)+shield;
    if(game.target&&game.target.hp>0){
      const actualDmg=Math.max(1,dmg-(game.target.def||0));
      game.target.hp=Math.max(0,game.target.hp-actualDmg);
      addMsg('⚙️ 过载核心！+'+shield+'护盾，AOE '+actualDmg+' 伤害');
    }else{
      addMsg('⚙️ 过载核心！+'+shield+'护盾，污染清零');
    }
    p.pollution=0;
    p.ultimateActive=false;p.ultimateTurns=0;
  }
  // 技能 → 角色：从玩家位置爆发橙色粒子簇 + 屏震，让"角色释放"而非"按钮释放"
  try{
    var _T=document.getElementById('game-canvas').width/13;
    var _bx=p.x*_T+_T/2,_by=p.y*_T+_T/2;
    for(var _bi=0;_bi<28;_bi++){
      var _ba=Math.random()*Math.PI*2;
      var _bs=2+Math.random()*4;
      spawnParticle(_bx,_by,'rgba(255,140,40,0.9)',Math.cos(_ba)*_bs,Math.sin(_ba)*_bs,0.04,2+Math.random()*1.5,3);
    }
    for(var _bi2=0;_bi2<14;_bi2++){
      var _ba2=Math.random()*Math.PI*2;
      spawnParticle(_bx,_by,'rgba(255,220,120,0.9)',Math.cos(_ba2)*1.5,Math.sin(_ba2)*1.5,0.05,1+Math.random(),2);
    }
    game._shakeFrames=Math.max(game._shakeFrames||0,4);
  }catch(e){}
  render();
}
function tickUltimate(){
  const p=game.player;
  if(!p.ultimateActive)return;
  if(p.playerClass==='blood'&&p._bloodMoon){
    p.hp=Math.max(1,p.hp-5);
    addMsg('<span style="color:#cc0022">🩸 血月代价 -5HP ('+p.hp+'/'+p.maxHp+')</span>');
  }
  p.ultimateTurns--;
  if(p.ultimateTurns<=0){
    deactivateUltimate();
  }
}
function deactivateUltimate(){
  const p=game.player;
  p.ultimateActive=false;
  if(p.playerClass==='titan'){
    p.atk=p._ultSavedAtk!==undefined?p._ultSavedAtk:p.atk-30;
    p.def=p._ultSavedDef!==undefined?p._ultSavedDef:p.def-30;
    p.maxHp=p._ultSavedMaxHp!==undefined?p._ultSavedMaxHp:Math.floor(p.maxHp/2);
    p.hp=Math.min(p.hp,p.maxHp);
    delete p._ultSavedAtk;delete p._ultSavedDef;delete p._ultSavedMaxHp;
    addMsg('泰坦之怒结束');
  }else if(p.playerClass==='ghost'){
    p._voidWalker=false;
    p._nextCritX5=true;
    addMsg('虚空行者结束，下次攻击暴击×5');
  }else if(p.playerClass==='swarm'){
    p.swarms=p.swarms.filter(s=>s.duration>0);
    addMsg('虫群之心结束');
  }else if(p.playerClass==='blood'){
    p._bloodMoon=false;
    addMsg('🩸 血月狂宴结束');
  }
}
function tickUltimateCooldown(){
  if(game.player.ultimateCooldown>0){
    game.player.ultimateCooldown--;
    if(game.player.ultimateCooldown===0&&typeof checkTutorial==='function')setTimeout(function(){checkTutorial('ultReady');},500);
  }
  game.player.swarms.forEach(s=>s.duration--);
  game.player.swarms=game.player.swarms.filter(s=>s.duration>0&&s.hp>0);
  if(game.player.playerClass==='ghost')game.player.stealth=Math.min(100,game.player.stealth+10);
  if(game.player.playerClass==='titan')game.player.armor=Math.min(200,game.player.armor+10);
  if(game.player.playerClass==='mech'){
    var _shieldAdd=20+getEvolutionEffect('shieldPerFloor');
    var _shieldCap=150+getEvolutionEffect('shieldCap');
    game.player.armor=Math.min(_shieldCap,game.player.armor+_shieldAdd);
  }
}
