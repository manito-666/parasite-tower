// ================================================================
// 职业转换 + 楼层导航 + getFloorName + getEvolutionEffect
// ================================================================
// ================================================================
// 职业转换系统
// ================================================================
function showClassConversion(){
  const p=game.player;
  const src=p.playerClass;
  const srcC=classColors[src];
  const ev=document.getElementById('event-overlay');
  ev.style.display='flex';
  document.getElementById('event-title').textContent=t('⛯ 职业转换祭坛');
  let info='<div style="margin-bottom:10px">';
  info+='<div style="color:'+srcC.primary+';font-size:1.1em">当前: '+srcC.icon+' '+srcC.name+'</div>';
  info+='<div style="font-size:.8em;color:#888">HP:'+p.hp+'/'+p.maxHp+' ATK:'+p.atk+' DEF:'+p.def+' POL:'+p.pollution+'%</div>';
  if(src==='titan')info+='<div style="font-size:.8em;color:#48a">装甲: '+p.armor+'</div>';
  if(src==='ghost')info+='<div style="font-size:.8em;color:#a4a">潜行能量: '+p.stealth+(p.stealthActive?' [潜行中]':'')+'</div>';
  if(src==='swarm')info+='<div style="font-size:.8em;color:#4a4">分身: '+p.swarms.filter(s=>s.hp>0).length+'只</div>';
  info+='</div>';
  document.getElementById('event-text').innerHTML=info;

  const hpMatrix={titan:{ghost:0.3,swarm:0.4},ghost:{titan:1.5,swarm:1.2},swarm:{titan:1.0,ghost:0.8}};
  const polSrcMod={titan:1.0,ghost:0.9,swarm:0.7};
  const polDstMod={titan:0.5,ghost:0.8,swarm:1.2};

  let choices='<div style="display:flex;flex-direction:column;gap:10px">';
  choices+='<div style="color:#ff0;font-size:.85em;text-align:center">消耗: 500EP | 持有: '+p.evoPoints+'EP</div>';

  ['titan','ghost','swarm'].forEach(target=>{
    if(target===src)return;
    if(!p.classUnlocked[target])return;
    const tc=classColors[target];
    const tBase=classBaseStats[target];
    // 计算预览
    const newHp=Math.min(Math.floor(p.hp*hpMatrix[src][target])+(target==='titan'?80:0),tBase.maxHp);
    const rawPol=Math.floor(p.pollution*polSrcMod[src]*polDstMod[target]);
    const polOverflow=rawPol>100;
    const newPol=Math.min(100,rawPol);

    let resInfo='';
    if(target==='titan'){
      const armor=50+(src==='ghost'?Math.floor(p.stealth/10):0)+(src==='swarm'?p.swarms.length*15:0);
      resInfo='装甲: '+armor;
    }else if(target==='ghost'){
      const stealth=50+(src==='titan'?Math.floor(p.hp/10):0)+(src==='swarm'?p.swarms.length*20:0);
      resInfo='潜行: '+stealth+' + 复仇一击';
    }else if(target==='swarm'){
      const extra=src==='titan'?Math.floor(p.hp/100):src==='ghost'?Math.floor(p.stealth/25):0;
      resInfo='分身: '+(1+extra)+'只';
    }

    choices+='<div style="background:rgba(255,255,255,0.03);border:1px solid '+tc.primary+';border-radius:6px;padding:8px">';
    choices+='<div style="color:'+tc.primary+';font-size:1em;margin-bottom:4px">'+tc.icon+' '+tc.name+'</div>';
    choices+='<div style="font-size:.8em;color:#aaa">HP: '+p.hp+' → <b style="color:'+(newHp<p.hp?'#ff006e':'#00ffd0')+'">'+newHp+'</b>/'+tBase.maxHp+'</div>';
    choices+='<div style="font-size:.8em;color:#aaa">POL: '+p.pollution+'% → <b style="color:'+(newPol>p.pollution?'#ff006e':'#00ffd0')+'">'+newPol+'%</b>'+(polOverflow?' ⚠️':'')+'</div>';
    choices+='<div style="font-size:.8em;color:'+tc.primary+'">'+resInfo+'</div>';
    choices+='<button class="btn" style="margin-top:6px;width:100%;border-color:'+tc.primary+';color:'+tc.primary+';'+(p.evoPoints<500?'opacity:0.4':'')+'" '+(p.evoPoints>=500?'onclick="convertClass(\''+target+'\')"':'disabled')+'>转换为'+tc.name+'</button>';
    choices+='</div>';
  });

  choices+='<div style="font-size:.75em;color:#666;text-align:center">⚠️ 转换后本层重置，进化等级和EP保留</div>';
  choices+='<button class="btn btn-secondary" onclick="closeEvent();render()">取消</button>';
  choices+='</div>';
  document.getElementById('event-choices').innerHTML=choices;
}

function convertClass(target){
  const p=game.player;
  const src=p.playerClass;
  if(src===target)return;
  if(p.evoPoints<500){addMsg('EP不足(需500)');return;}

  // 先保存原始值，避免后续修改后读到错误值
  const origHp=p.hp;
  const origStealth=p.stealth;
  const origArmor=p.armor;
  const origSwarms=p.swarms.slice();

  const hpMatrix={titan:{ghost:0.3,swarm:0.4},ghost:{titan:1.5,swarm:1.2},swarm:{titan:1.0,ghost:0.8}};
  const polSrcMod={titan:1.0,ghost:0.9,swarm:0.7};
  const polDstMod={titan:0.5,ghost:0.8,swarm:1.2};
  const tBase=classBaseStats[target];

  // HP转换
  const newHp=Math.min(Math.floor(origHp*hpMatrix[src][target])+(target==='titan'?80:0),tBase.maxHp);
  p.hp=newHp;
  p.maxHp=tBase.maxHp;

  // POL转换
  let newPol=Math.floor(p.pollution*polSrcMod[src]*polDstMod[target]);
  if(newPol>100){p.hp=Math.max(1,p.hp-(newPol-100)*2);newPol=100;addMsg('污染溢出反噬！');}
  p.pollution=newPol;

  // ATK/DEF重置为目标职业基础
  p.atk=tBase.atk;p.def=tBase.def;
  // 重新应用当前目标职业的进化加成
  const level=p.evolution[target]||0;
  for(let i=0;i<level;i++){
    const eff=evolutionPaths[target][i].effect;
    if(eff.atk)p.atk+=eff.atk;
    if(eff.def)p.def+=eff.def;
    if(eff.maxHp){p.maxHp+=eff.maxHp;p.hp=Math.min(p.hp+eff.maxHp,p.maxHp);}
  }

  // EP消耗
  p.evoPoints-=500;

  // 专属资源转换（使用原始值计算）
  if(target==='titan'){
    p.armor=50+(src==='ghost'?Math.floor(origStealth/10):0)+(src==='swarm'?origSwarms.length*15:0);
  }else{p.armor=0;}

  if(target==='ghost'){
    p.stealth=50+(src==='titan'?Math.floor(origHp/10):0)+(src==='swarm'?origSwarms.length*20:0);
    p._firstStrikeCrit=true;
  }else{p.stealth=0;p.stealthActive=false;}

  if(target==='swarm'){
    const extra=src==='titan'?Math.floor(origHp/100):src==='ghost'?Math.floor(origStealth/25):0;
    p.swarms=[];
    for(let i=0;i<1+extra;i++)p.swarms.push({hp:Math.floor(p.maxHp*0.2),atk:Math.floor(p.atk*0.5),duration:99});
  }else{p.swarms=[];}

  // 设置职业
  p.playerClass=target;
  p.ultimateCooldown=10;
  p.ultimateActive=false;
  p.ultimateTurns=0;
  p._voidWalker=false;
  p._nextCritX5=false;

  const tc=classColors[target];
  addMsg('⛯ 职业转换: '+classColors[src].name+' → '+tc.icon+' '+tc.name);
  updateClassTheme();
  closeEvent();
  // 本层重置
  delete game.floorHistory[game.floor];
  generateFloor();
  createAnchor('convert');
  render();
}
function getFloorAccessRange(){
  const pol=game.player.pollution;
  if(pol<=30)return{min:game.floor-2,max:game.floor+1};
  if(pol<=50)return{min:game.floor-1,max:game.floor+1};
  if(pol<=70)return{min:game.floor,max:game.floor+1};
  if(pol<=85)return{min:game.floor+1,max:game.floor+1}; // 强制下行
  return{min:1,max:999}; // 86-100: 随机（失控）
}
function getExplorePercent(f){
  if(game.floorCleared[f])return 100;
  const exp=game.explored[f];
  if(!exp||exp.length===0)return 0;
  // 计算该层可走格子数
  const hist=game.floorHistory[f];
  if(hist&&hist.tiles){
    let walkable=0;
    for(let y=0;y<13;y++)for(let x=0;x<13;x++){if(hist.tiles[y][x]!==0)walkable++;}
    if(walkable>0)return Math.min(100,Math.floor(exp.length/walkable*100));
  }
  return Math.min(100,Math.floor(exp.length/80*100));
}
function showFloorNav(direction){
  const p=game.player;
  const pol=p.pollution;
  const range=getFloorAccessRange();
  const ev=document.getElementById('event-overlay');
  ev.style.display='flex';
  document.getElementById('event-title').textContent=t('楼层导航');
  let info='<div style="font-size:.85em;color:#888">';
  info+='当前: 第'+game.floor+'层 '+getFloorName()+'<br>';
  info+='污染: '+pol+'% | 可达范围: '+(pol>85?'随机(失控)':'第'+Math.max(1,range.min)+'~'+range.max+'层');
  info+='</div>';
  document.getElementById('event-text').innerHTML=info;
  let choices='<div style="display:flex;flex-direction:column;gap:6px">';
  // 下一层
  if(direction==='down'||direction==='both'){
    const nextF=game.floor+1;
    const _cap=window.GameRules?GameRules.floorCap:50;
    // 到达楼层 cap → 触发 finale
    if(game.floor>=_cap){
      choices+='<button class="btn" onclick="closeEvent();triggerModeFinale()" style="border-color:#ff0;color:#ff0">';
      choices+='⚡ 终局之门';
      choices+='</button>';
    }else{
    const canGo=nextF>=range.min&&nextF<=range.max;
    const visited=!!game.floorHistory[nextF];
    const exp=getExplorePercent(nextF);
    choices+='<button class="btn" '+(canGo?'onclick="goToFloor('+(nextF)+',\'down\')"':'disabled style="opacity:0.4"')+'>';
    choices+='↓ 第'+nextF+'层 '+(visited?'(已访问 '+exp+'%)':'(未探索)')+(canGo?'':' [污染过高]');
    choices+='</button>';
    } // end floorCap else
  }
  // 上一层
  if((direction==='up'||direction==='both')&&game.floor>1){
    const prevF=game.floor-1;
    const canGo=prevF>=range.min&&prevF<=range.max;
    const exp=getExplorePercent(prevF);
    // 超范围回溯需100EP
    const needEP=!canGo&&p.evoPoints>=100;
    if(canGo){
      choices+='<button class="btn" onclick="goToFloor('+(prevF)+',\'up\')">';
      choices+='↑ 第'+prevF+'层 (已通关 '+exp+'%) [免费]';
      choices+='</button>';
    }else if(needEP){
      choices+='<button class="btn" style="border-color:#ff0" onclick="goToFloor('+(prevF)+',\'up\',100)">';
      choices+='↑ 第'+prevF+'层 [紧急回溯 100EP]';
      choices+='</button>';
    }else{
      choices+='<button class="btn" disabled style="opacity:0.4">';
      choices+='↑ 第'+prevF+'层 [不可达: '+(p.evoPoints<100?'EP不足':'污染过高')+']';
      choices+='</button>';
    }
  }
  // 更远楼层（已访问的）
  const visited=Object.keys(game.floorHistory).map(Number).filter(f=>f!==game.floor&&f!==game.floor+1&&f!==game.floor-1).sort((a,b)=>b-a);
  if(visited.length>0){
    choices+='<div style="color:#555;font-size:.75em;margin:6px 0;border-top:1px solid #222;padding-top:4px">已探索楼层</div>';
    visited.slice(0,4).forEach(f=>{
      const canGo=f>=range.min&&f<=range.max;
      const exp=getExplorePercent(f);
      const dist=Math.abs(f-game.floor);
      const epCost=dist>1?dist*50:0;
      if(canGo||p.evoPoints>=epCost){
        choices+='<button class="btn" style="font-size:.8em;padding:4px;'+(canGo?'':'border-color:#ff0')+'" onclick="goToFloor('+f+',\''+(f<game.floor?'up':'down')+'\''+(!canGo?','+epCost:'')+')">第'+f+'层 '+getFloorNameForFloor(f)+' ('+exp+'%)'+(epCost>0?' ['+epCost+'EP]':'')+'</button>';
      }
    });
  }
  choices+='<button class="btn btn-secondary" onclick="closeEvent()">留在当前层</button>';
  choices+='</div>';
  document.getElementById('event-choices').innerHTML=choices;
}
function goToFloor(targetFloor,dir,epCost){
  if(game._forceTutorial&&game._tutorialStage<2&&targetFloor>game.floor){
    addMsg('<span style="color:#ff8c00">➤ 先附身一只怪物再下楼 — 这是「你也是我」的核心机制</span>');
    return;
  }
  markDirty();invalidateStaticLayer();
  try{dir==='down'?sounds.floorDown():sounds.floorUp();}catch(e){}
  if(epCost&&epCost>0){
    if(game.player.evoPoints<epCost){addMsg('EP不足');return;}
    game.player.evoPoints-=epCost;
    addMsg('紧急移动 -'+epCost+'EP');
  }
  closeEvent();
  saveFloorState();
  // 限时挑战奖励（计时器还在运行时下楼 = 成功）
  if(game._sigFlags&&game._sigFlags.timerActive&&game._sigFlags.timerReward){
    game.player.evoPoints+=game._sigFlags.timerReward;
    addMsg('⏱ 限时挑战成功! +'+game._sigFlags.timerReward+'EP');
  }
  // 第1层教学：全清奖励（杀死所有怪物 = 鼠 + 3 守卫，看门犬被附身不计）
  if(game.floor===1&&targetFloor===2&&dir==='down'&&!game._tut1ClearReward){
    var _allDown=game.monsters.every(function(m){return m.hp<=0||m.possessed;});
    if(_allDown){
      var _bonus=80;
      game.player.evoPoints=(game.player.evoPoints||0)+_bonus;
      game._tut1ClearReward=true;
      addMsg('<span style="color:#00ff90;font-weight:bold">★ 楼梯口肃清！全清奖励 +'+_bonus+'EP</span>');
      addMsg('<span style="color:#9bd;font-style:italic">你扫清了通往上层的最后阻碍。</span>');
    }
  }
  // 退出当前楼层签名（try/catch保护，避免序列化丢失函数导致崩溃）
  try{exitFloorSignature();}catch(e){game._floorSignature=null;game._sigFlags={};}
  game.floor=targetFloor;
  // 模式钩子：进入新楼层
  try{ if(window.GameRules) GameRules.hooks.onFloorEnter(targetFloor); }catch(e){}
  game._restUsedThisFloor=false;
  game.phantoms=[]; // 清除幻觉怪物，避免残留到新楼层
  // 阵亡形态不会因换楼复活——死亡是永久的（除非 F25 净化献祭或被新宿主覆盖）
  game._loneWolf=false;
  game._stiffnessTurns=0;
  // 羁绊追踪：存活时间
  updateFormAffinity(game.player.formType,'survive',1);
  // 污染技能更新
  updatePollutionSkills();
  applyPollutionPassives();
  // 污染技能每层限制重置
  game.player.pollutionSkills.bloodRite.used=false;
  game.player.pollutionSkills.devour.used=false;
  // 职业冷却递减
  tickUltimateCooldown();
  // 职业解锁检查
  checkClassUnlock();
  // 污染和再生
  const zone=Math.min(5,Math.ceil(game.floor/10));
  const _pollMult=window.GameRules?GameRules.pollutionRate:1;
  var pollutionAdd=0;
  if(window.GameModes&&GameModes.isShort()&&window.ShortMode){
    pollutionAdd=ShortMode.getFloorCurve(game.floor).pollAdd;
  }else if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){
    var _epc=ExpeditionMode.getFloorCurve(game.floor);
    var _pr2=getEvolutionEffect('pollutionReduce');
    pollutionAdd=Math.max(0,Math.round((_pr2?_epc.pollAdd-_pr2:_epc.pollAdd)*_pollMult));
  }else{
    var _fpc=typeof getFullFloorCurve==='function'?getFullFloorCurve(game.floor):null;
    var _basePoll=_fpc?_fpc.pollAdd:(zone<=2?1:zone<=4?2:3);
    if(!_fpc&&game.floor<=10)_basePoll=0;
    var _pr=getEvolutionEffect('pollutionReduce');
    pollutionAdd=Math.max(0,Math.round((_pr?_basePoll-_pr:_basePoll)*_pollMult));
  }
  if(pollutionAdd>0&&typeof addEnvPollution==='function'){addEnvPollution(pollutionAdd,null);}else{game.player.pollution=Math.min(100,game.player.pollution+pollutionAdd);}
  if(game._dailyVampire){if(typeof addEnvPollution==='function')addEnvPollution(5,null);else game.player.pollution=Math.min(100,game.player.pollution+5);}
  if(pollutionAdd>0)addMsg('☢ 污染+'+pollutionAdd+' (当前'+game.player.pollution+'%)');
  if(game.player.pollution>=85)addMsg('<span style="color:#ff006e;font-weight:bold">⚠ 污染即将崩溃！点击☣图标管理污染技能</span>');
  else if(game.player.pollution>=70&&game.player.pollution<85)addMsg('<span style="color:#ff8c00">⚠ 污染偏高，注意控制</span>');
  const regen=getEvolutionEffect('regen');
  if(regen){const heal=Math.floor(game.player.maxHp*regen);game.player.hp=Math.min(game.player.maxHp,game.player.hp+heal);addMsg('再生恢复 '+heal+' HP');}
  // 根据方向设置玩家位置
  if(dir==='down'){game.player.x=2;game.player.y=6;} // 从上楼梯进入
  else{game.player.x=10;game.player.y=6;} // 从下楼梯进入
  // 每5层自动锚定
  if(game.floor%5===1&&game.floor>1)createAnchor('zone');
  if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&game.floor===10)createAnchor('chapter');
  addMsg('来到第'+game.floor+'层 - '+getFloorName());
  // 全模式6段情绪曲线转场文案
  if(!(window.GameModes&&GameModes.isShort())&&!(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition())){
    if(game.floor===1)addMsg('<span style="color:#666;font-style:italic">…塔底的空气很冷。你感到一股陌生的力量在召唤…</span>');
    else if(game.floor===9)addMsg('<span style="color:#2dd4bf;font-style:italic">…适应期结束。真正的试炼开始了。</span>');
    else if(game.floor===17)addMsg('<span style="color:#ff8c00;font-style:italic">…身体里有什么东西在生长。污染不再只是代价——它在变成你的一部分。</span>');
    else if(game.floor===25)addMsg('<span style="color:#ff006e;font-style:italic">…规则正在崩塌。你曾以为自己在操控，但也许一切都反过来了。</span>');
    else if(game.floor===33)addMsg('<span style="color:#b455ff;font-style:italic">…如果你还能看到这段文字，说明你比大多数人走得更远。</span>');
    else if(game.floor===41)addMsg('<span style="color:#ff0055;font-weight:bold;font-style:italic">…最后的攀登。每一步都是赌命。</span>');
    else if(game.floor===49)addMsg('<span style="color:#fff;font-weight:bold">…终焉在上方等待。你准备好面对审判了吗？</span>');
  }
  // 新手引导
  if(game.floor>=2&&game._tutorialStage<2){game._tutorialStage=2;if(typeof announceStageUp==='function')announceStageUp(2);}
  if(game.floor>=3&&game._tutorialStage<3){game._tutorialStage=3;if(typeof announceStageUp==='function')announceStageUp(3);setTimeout(function(){if((game.player.evoPoints||0)>0)checkTutorial('evoHint');},1200);setTimeout(function(){if(game.player.ultimateCooldown===0&&!game.player.ultimateActive)checkTutorial('ultReady');},2400);}
  if(game.floor>=5&&game._tutorialStage<4){game._tutorialStage=4;if(typeof announceStageUp==='function')announceStageUp(4);addMsg('<span style="color:#00ffd0;font-weight:bold">💡 全系统解锁——商店、签名、污染机制已可用</span>');setTimeout(function(){checkTutorial('floorUnlock');},800);}
  // F4 复触发 floorUnlock，让没在 F5 触发到的步骤有机会显示
  if(game.floor>=4&&game._tutorialStage>=4){setTimeout(function(){checkTutorial('floorUnlock');},800);}
  // 叙事低语 — 短局禁用
  if(!(window.GameModes&&GameModes.isShort())&&game.player.storyPhase>=1&&Math.random()<0.15){addMsg('<span style="color:#666;font-style:italic">'+whispers[Math.floor(Math.random()*whispers.length)]+'</span>');}
  generateFloor();
  // 路线效果 — 短局不使用路线
  if(!(window.GameModes&&GameModes.isShort())&&game._routeMods&&game._routeFloors>0){
    game._routeFloors--;
    // 路线回血
    if(game._routeMods.healPerFloor){
      const rHeal=Math.floor(game.player.maxHp*game._routeMods.healPerFloor);
      game.player.hp=Math.min(game.player.maxHp,game.player.hp+rHeal);
      addMsg(game._routeIcon+' '+game._routeName+'效果: 恢复'+rHeal+'HP');
    }
    // 路线每层污染（污染深渊）
    if(game._routeMods.polPerFloor){
      game.player.pollution=Math.max(0,Math.min(100,game.player.pollution+game._routeMods.polPerFloor));
      addMsg(game._routeIcon+' '+game._routeName+'效果: 污染'+(game._routeMods.polPerFloor>0?'+':'')+game._routeMods.polPerFloor);
    }
    if(game._routeFloors<=0){
      addMsg('📍 '+game._routeName+'路线结束');
      game._routeMods=null;game._routeName=null;game._routeIcon=null;game._routeColor=null;
    }
  }
  // 每5层触发路线选择(第6/11/16...层) — 短局禁用
  if(!(window.GameModes&&GameModes.isShort())&&game.floor%5===1&&game.floor>1&&!game._routeMods){
    if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()){
      if(game.floor===6||game.floor===11)setTimeout(()=>showRouteChoice(),600);
    }else{
      setTimeout(()=>showRouteChoice(),600);
    }
  }
  // 进入新楼层签名 — 短局禁用
  if(!(window.GameModes&&GameModes.isShort())){enterFloorSignature();}
  // BGM：startBGMusic 内部按 zone 自检，同 zone 直接 no-op
  try{startBGMusic();}catch(e){}
  // 诅咒祭坛 (每5层非BOSS) — 短局禁用，远征 F8/F18
  if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()){
    if(game.floor===8||game.floor===18)game._pendingAltar=true;
  }else if(!(window.GameModes&&GameModes.isShort())&&game.floor > 1 && game.floor % 5 === 0 && game.floor % 10 !== 0){
    game._pendingAltar=true;
  }
  // 诅咒/祝福每层效果 — 短局禁用
  if(!(window.GameModes&&GameModes.isShort())&&game.curseBlessing){
    const cb=game.curseBlessing.mods;
    if(cb.hpPerFloor)game.player.hp=Math.max(1,game.player.hp+cb.hpPerFloor);
    if(cb.defPerFloor)game.player.def+=cb.defPerFloor;
    if(cb.polPerFloor)game.player.pollution=Math.max(0,Math.min(100,game.player.pollution+cb.polPerFloor));
  }
  // 污染检查 — 短局走崩溃序列
  if(game.player.pollution>=100){
    if(window.GameModes&&GameModes.isShort()&&window.ShortMode){ShortMode.forceFinale('pollution');return;}
    if(game.player.storyPhase<3){triggerPollutionCollapse();return;}
  }
  // 剧情奖励：记忆回声换层回复 — 短局禁用
  if(!(window.GameModes&&GameModes.isShort())&&game.player._storyEchoHeal){const echoH=Math.max(1,Math.floor(game.player.maxHp*0.05));game.player.hp=Math.min(game.player.maxHp,game.player.hp+echoH);addMsg('💚 记忆回声 +'+echoH+'HP');}
  // 重置移动计数
  game._moveCountThisFloor=0;
  // 无附身楼层计数
  game._floorsWithoutPossess=(game._floorsWithoutPossess||0)+1;
  render();
  // 隐藏剧情检查
  checkHiddenStory('floor_enter');
  // 特殊楼层触发 — 短局禁用
  if(!(window.GameModes&&GameModes.isShort())&&[5,25,50].includes(game.floor))triggerSpecialFloor(game.floor);
  // 剧情触发
  checkStoryTrigger(game.floor);
  // 自动存档
  saveGame();
  checkAchievements();
}
function getFloorNameForFloor(f){
  const names={
    1:'入口通道',2:'消毒间',3:'储物室',4:'监控室',5:'实验室A',
    6:'实验室B',7:'废弃走廊',8:'标本室',9:'主管办公室',10:'电梯井',
    11:'培育温室',12:'孵化间',13:'营养池',14:'观察室',15:'隔离区',
    16:'基因库',17:'培育走廊',18:'蜕皮室',19:'培育控制室',20:'培育核心',
    21:'收容区入口',22:'A级收容',23:'B级收容',24:'泄漏区',25:'净化室',
    26:'收容走廊',27:'C级收容',28:'紧急通道',29:'收容控制室',30:'收容核心',
    31:'深层通道',32:'裂隙区',33:'回声廊',34:'虚影室',35:'扭曲区',
    36:'暗影走廊',37:'深渊边缘',38:'虚空观测站',39:'深渊前厅',40:'深渊之心',
    41:'源头通道',42:'腐化区',43:'混沌区',44:'死亡走廊',45:'原初之门',
    46:'意志之间',47:'记忆残骸',48:'真实之厅',49:'终焉走廊',50:'起源之地'
  };
  const name=names[f]||('未知区域-'+f+'层');
  // 中期揭示后，高层名字加问号
  if(game.player.storyPhase>=1&&f>25)return name+'?';
  return name;
}
function getFloorName(){return getFloorNameForFloor(game.floor);}
function getEvolutionEffect(key){
let total=0;
// 只计算当前职业的进化效果
const path=game.player.playerClass;
const level=game.player.evolution[path]||0;
if(!evolutionPaths[path])return total;
for(let i=0;i<level;i++){const node=evolutionPaths[path][i];if(node&&node.effect&&node.effect[key])total+=node.effect[key];}
return total;
}
