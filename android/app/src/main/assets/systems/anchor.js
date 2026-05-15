// ================================================================
// 锚点存档 + 死亡回滚系统
// ================================================================
function createAnchor(reason){
  const p=game.player;
  // 双核心耦合: 污染≥70 时无法稳定锚定（除 init/altar/manual 强制路径外）
  if((p.pollution||0)>=70&&reason!=='init'&&reason!=='altar'&&reason!=='manual'){
    addMsg('<span style="color:#ff006e">⚠ 污染过高（'+Math.floor(p.pollution)+'%），意识无法锚定</span>');
    return;
  }
  const formName=p.name||'寄生体';
  game.anchor={
    floor:game.floor,
    player:{
      name:p.name,hp:p.hp,maxHp:p.maxHp,atk:p.atk,def:p.def,
      traits:p.traits.slice(),pollution:p.pollution,evoPoints:p.evoPoints,
      formType:p.formType,possessed:JSON.parse(JSON.stringify(p.possessed)),
      evolution:JSON.parse(JSON.stringify(p.evolution)),
      playerClass:p.playerClass,classUnlocked:JSON.parse(JSON.stringify(p.classUnlocked)),
      armor:p.armor,stealth:p.stealth,stealthActive:p.stealthActive,
      swarms:JSON.parse(JSON.stringify(p.swarms)),
      ultimateCooldown:p.ultimateCooldown,ultimateActive:p.ultimateActive,ultimateTurns:p.ultimateTurns,deathCount:p.deathCount,
      storyPhase:p.storyPhase,storyFlags:JSON.parse(JSON.stringify(p.storyFlags)),
      _evoStatBonus:p._evoStatBonus?JSON.parse(JSON.stringify(p._evoStatBonus)):{atk:0,def:0,maxHp:0}
    },
    forms:JSON.parse(JSON.stringify(game.forms)),
    currentForm:game.currentForm,
    anchorName:formName+'-F'+game.floor,
    reason:reason,
    // 短局模式快照倒计时（秒），回滚时一并恢复
    shortRemaining:(window.ShortMode&&typeof ShortMode._remaining==='number')?ShortMode._remaining:null
  };
  game.anchorFloor=game.floor;
  addMsg('&#x1F4BE; 记忆锚定: '+formName+' - 第'+game.floor+'层');
  updateAnchorBar();
}

function updateAnchorBar(){
  const bar=document.getElementById('anchor-bar');
  const nameEl=document.getElementById('anchor-name-display');
  const distEl=document.getElementById('anchor-dist-display');
  if(!bar||!game.anchor)return;
  nameEl.textContent=game.anchor.anchorName;
  const dist=game.floor-game.anchor.floor;
  if(dist<=2){
    bar.className='stable';
    distEl.textContent='安全';
  }else if(dist<=6){
    bar.className='warning';
    distEl.textContent=dist+'层未固化';
  }else{
    bar.className='danger';
    distEl.textContent=dist+'层未固化!';
  }
  // 高污染额外提示
  if(game.player.pollution>60){
    distEl.textContent+=' | 记忆不稳定';
  }
}


function showAnchorDetail(){
  if(game.target)return; // 战斗中不打开
  const overlay=document.getElementById('anchor-detail-overlay');
  overlay.classList.add('active');
  const a=game.anchor;

  // 锚点快照
  const snapEl=document.getElementById('anchor-snapshot');
  const icon=getFormIconLg(a.player.formType,28);
  let snapHtml='<div class="snap-form">'+icon+'</div>';
  snapHtml+='<div class="snap-info"><b>'+a.player.name+'</b> - 第'+a.floor+'层</div>';
  snapHtml+='<div class="snap-info">HP:<b>'+a.player.hp+'</b>/'+a.player.maxHp+' ATK:<b>'+a.player.atk+'</b> DEF:<b>'+a.player.def+'</b></div>';
  if(a.player.traits.length>0){
    snapHtml+='<div class="snap-traits">'+a.player.traits.map(t=>'<span>'+t+'</span>').join('')+'</div>';
  }
  snapEl.innerHTML=snapHtml;

  // 楼层进度列表
  const listEl=document.getElementById('anchor-floor-list');
  const dist=game.floor-a.floor;
  let listHtml='';
  for(let f=a.floor+1;f<=Math.min(game.floor+2,a.floor+10);f++){
    const explored=f<=game.floor;
    const pct=explored?getExplorePercent(f):0;
    listHtml+='<div class="anchor-floor-item">';
    listHtml+='<span class="fl-num">F'+f+'</span>';
    listHtml+='<span style="color:'+(explored?'#888':'#333')+'">'+
      (explored?'探索中':'未到达')+'</span>';
    listHtml+='<div class="fl-bar"><div class="fl-fill" style="width:'+pct+'%"></div></div>';
    listHtml+='</div>';
  }
  listEl.innerHTML=listHtml;

  // 警告
  const warnEl=document.getElementById('anchor-loss-warn');
  if(dist>0){
    warnEl.textContent='死亡将丢失以上 '+dist+' 层进度';
    warnEl.style.display='block';
  }else{
    warnEl.style.display='none';
  }

  // 固化按钮（200EP）
  const solidBtn=document.getElementById('anchor-solidify-btn');
  solidBtn.disabled=false;
  if(game.player.evoPoints>=200&&game.floor!==a.floor){
    solidBtn.style.display='inline-block';
    solidBtn.textContent='固化记忆 (200EP)';
  }else if(game.player.evoPoints<200){
    solidBtn.style.display='inline-block';
    solidBtn.textContent='EP不足(需200)';
    solidBtn.disabled=true;
  }else{
    solidBtn.style.display='none';
  }
}

function closeAnchorDetail(){
  document.getElementById('anchor-detail-overlay').classList.remove('active');
  _restoreHiddenByMenu();
}

function manualAnchor(){
  if(game.player.evoPoints<200){addMsg('EP不足（需200EP）');return;}
  game.player.evoPoints-=200;
  createAnchor('manual');
  closeAnchorDetail();
  addMsg('记忆已固化 -200EP');
  render();
}

