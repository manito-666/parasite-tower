// ================================================================
// 诅咒/祝福祭坛
// ================================================================
function triggerCurseAltar(){
  const _pool=LAUNCH_ALTAR_INDICES.map(i=>curseAltarPairs[i]).filter(Boolean);
  const pair=_pool[Math.floor(Math.random()*_pool.length)];
  const overlay=document.getElementById('event-overlay');
  overlay.style.display='flex';
  document.getElementById('event-title').textContent=t('⚗ 诅咒祭坛');
  document.getElementById('event-text').innerHTML='祭坛散发着诡异的光芒...<br>你必须做出选择:';
  const btns=document.getElementById('event-choices');
  btns.innerHTML='';
  [pair.a,pair.b].forEach(choice=>{
    const btn=document.createElement('button');
    btn.className='event-btn';
    btn.style.borderColor=choice.type==='curse'?'#ff006e':'#00ffd0';
    btn.innerHTML=choice.icon+' <b>'+choice.name+'</b><br><span style="font-size:10px;color:#aaa">'+choice.desc+'</span>';
    btn.onclick=()=>{applyCurseBlessing(choice);closeEvent();};
    btns.appendChild(btn);
  });
}
function applyCurseBlessing(choice){
  revertCurseBlessing();
  game.curseBlessing=choice;
  game._curseDirty=true;
  addMsg(choice.icon+' '+choice.name+': '+choice.desc);
  if(choice.mods.hpMult){
    game.player.maxHp=Math.floor(game.player.maxHp*choice.mods.hpMult);
    game.player.hp=Math.min(game.player.hp,game.player.maxHp);
  }
  updateCurseBadge();
}
function revertCurseBlessing(){
  if(!game.curseBlessing)return;
  const m=game.curseBlessing.mods;
  if(m.hpMult){game.player.maxHp=Math.max(1,Math.floor(game.player.maxHp/m.hpMult));game.player.hp=Math.min(game.player.hp,game.player.maxHp);}
  game.curseBlessing=null;
  game._curseDirty=true;
  updateCurseBadge();
}
function updateCurseBadge(){
  const el=document.getElementById('curse-badge');if(!el)return;
  if(!game.curseBlessing){el.style.display='none';return;}
  el.className=game.curseBlessing.type==='curse'?'cb-curse':'cb-blessing';
  el.textContent=game.curseBlessing.icon+' '+game.curseBlessing.name;
}

// ================================================================
// BOSS多阶段
// ================================================================
function checkBossPhase(m){
  const data=bossPhaseData[m.type];if(!data)return;
  if(!m.maxHp||m.maxHp<=0)return;
  const ratio=m.hp/m.maxHp;
  for(let i=data.phases.length-1;i>=0;i--){
    const phase=data.phases[i];
    if(ratio<=phase.at&&game._bossPhase<=i){
      game._bossPhase=i+1;
      if(!game._bossBaseAtk)game._bossBaseAtk=m.atk;
      m.atk=Math.floor(game._bossBaseAtk*phase.atkMult);
      m.name=phase.name;
      if(phase.addTraits)phase.addTraits.forEach(t=>{if(!m.traits.includes(t))m.traits.push(t);});
      const log=document.getElementById('combat-log');
      if(log)log.innerHTML+='<div class="boss-phase-msg">⚠ '+phase.msg+'</div>';
      addMsg('BOSS阶段'+(i+1)+': '+phase.name);
      break;
    }
  }
}

// ================================================================
// 楼层签名系统
// ================================================================
function assignFloorSignatures(){
  const ids=Object.keys(floorSignatures).filter(k=>LAUNCH_SIGNATURES.indexOf(k)>=0);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  const floors=[];
  for(let f=2;f<=49;f++){if(f%10!==0)floors.push(f);}
  for(let i=floors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[floors[i],floors[j]]=[floors[j],floors[i]];}
  game._floorSignatureMap={};
  let fi=0;
  for(let i=0;i<ids.length&&fi<floors.length;i++){
    const sig=floorSignatures[ids[i]];
    // 跳过不满足最低楼层要求的分配
    let assigned=false;
    for(let j=fi;j<floors.length;j++){
      if(!sig.minFloor||floors[j]>=sig.minFloor){
        game._floorSignatureMap[floors[j]]=ids[i];
        floors.splice(j,1);
        assigned=true;
        break;
      }
    }
    if(!assigned){/* 无合适楼层，跳过此签名 */}
  }
}
function enterFloorSignature(){
  const sigId=game._floorSignatureMap[game.floor];if(!sigId)return;
  const sig=floorSignatures[sigId];if(!sig)return;
  game._floorSignature=sig;
  game._sigFlags={};
  try{if(typeof sig.onEnter==='function')sig.onEnter(game);}catch(e){}
  showFloorSigBanner(sig);
  // 限时挑战：启动独立定时器（1秒更新，不依赖render帧）
  if(game._sigFlags.timerActive){
    if(game._floorTimerInterval)clearInterval(game._floorTimerInterval);
    game._floorTimerInterval=setInterval(checkFloorTimer,1000);
  }
}
function exitFloorSignature(){
  if(!game._floorSignature)return;
  try{if(typeof game._floorSignature.onExit==='function')game._floorSignature.onExit(game);}catch(e){}
  game._floorSignature=null;
  game._sigFlags={};
  // 清除限时定时器
  if(game._floorTimerInterval){clearInterval(game._floorTimerInterval);game._floorTimerInterval=null;}
  const el=document.getElementById('floor-timer');if(el)el.style.display='none';
}
function showFloorSigBanner(sig){
  const el=document.getElementById('floor-sig-banner');if(!el)return;
  el.textContent=sig.icon+' '+sig.name+': '+sig.desc;
  el.style.borderColor=sig.color||'#ff0';el.style.color=sig.color||'#ff0';
  el.style.display='block';
  el.style.transition='none';el.style.opacity='0';el.offsetHeight;
  el.style.animation='none';el.offsetHeight;el.style.animation='sigIn .5s ease-out';
  el.style.transition='opacity .8s ease-out';el.style.opacity='1';
  setTimeout(()=>{el.style.opacity='0';},2700);
  setTimeout(()=>{el.style.display='none';},3500);
}
