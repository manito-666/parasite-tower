// ================================================================
// 叙事系统 + 隐藏剧情 + 结局 + 重新开始
// ================================================================
function checkStoryTrigger(floor){
  const trigger=storyTriggers[floor];
  if(!trigger)return;
  if(game.player.storyFlags['floor_'+floor])return;
  if(game._tutorialStage<4&&floor<=10){
    const retries=(game._storyRetries||0);
    if(retries<6){game._storyRetries=retries+1;setTimeout(()=>checkStoryTrigger(floor),5000);return;}
    game._storyRetries=0;
  }
  game.player.storyFlags['floor_'+floor]=true;
  setTimeout(()=>showStoryEvent(trigger),500);
}

function showStoryEvent(trigger){
  const overlay=document.getElementById('story-overlay');
  const box=document.getElementById('story-box');
  const titleEl=document.getElementById('story-title');
  const textEl=document.getElementById('story-text');
  const choicesEl=document.getElementById('story-choices');

  box.className='story-box';
  if(trigger.type==='note')box.classList.add('story-note-style');
  else if(trigger.type==='revelation')box.classList.add('story-revelation');
  else if(trigger.type==='fragment')box.classList.add('story-fragment-style');

  titleEl.textContent=trigger.title;
  textEl.textContent=trigger.text;
  choicesEl.innerHTML='';

  if(trigger.type==='note'){
    const btn=document.createElement('button');btn.className='btn';btn.style.margin='4px';
    btn.textContent=trigger.rewardName||('+' +(trigger.reward||0)+'EP');
    btn.onclick=function(){
      game.player.evoPoints+=(trigger.reward||0);
      addMsg(trigger.title+' +'+(trigger.reward||0)+'EP');
      if(trigger.storyReward)applyStoryReward(trigger.storyReward);
      closeStory();
    };
    choicesEl.appendChild(btn);
    if(trigger.rewardDesc){const desc=document.createElement('div');desc.style.cssText='color:#aaa;font-size:11px;margin:4px 0';desc.textContent=trigger.rewardDesc;choicesEl.appendChild(desc);}
    const btn2=document.createElement('button');btn2.className='btn btn-secondary';btn2.style.margin='4px';
    btn2.textContent=t('关闭');btn2.onclick=closeStory;
    choicesEl.appendChild(btn2);
  }else if(trigger.type==='revelation'){
    game.player.storyPhase=Math.max(game.player.storyPhase,1);
    game.player.pollution=Math.min(100,game.player.pollution+10);
    addMsg('【认知冲击】污染+10%');
    addMsg('目标更新: 寻找真相...');
    const btn=document.createElement('button');btn.className='btn';btn.style.margin='4px';
    btn.style.borderColor='#ff006e';btn.style.color='#ff006e';
    btn.textContent=trigger.rewardName||'...继续前进';
    btn.onclick=function(){if(trigger.storyReward)applyStoryReward(trigger.storyReward);closeStory();render();};
    choicesEl.appendChild(btn);
    if(trigger.rewardDesc){const desc=document.createElement('div');desc.style.cssText='color:#aaa;font-size:11px;margin:4px 0';desc.textContent=trigger.rewardDesc;choicesEl.appendChild(desc);}
  }else if(trigger.type==='fragment'){
    game.player.storyPhase=Math.max(game.player.storyPhase,2);
    game.player.pollution=Math.min(100,game.player.pollution+5);
    addMsg('【记忆恢复】意识碎片涌入...');
    const btn=document.createElement('button');btn.className='btn';btn.style.margin='4px';
    btn.style.borderColor='#b455ff';btn.style.color='#b455ff';
    btn.textContent=trigger.rewardName||'接受记忆';
    btn.onclick=function(){
      game.player.evoPoints+=100;
      addMsg('记忆碎片 +100EP');
      if(trigger.storyReward)applyStoryReward(trigger.storyReward);
      closeStory();
    };
    choicesEl.appendChild(btn);
    if(trigger.rewardDesc){const desc=document.createElement('div');desc.style.cssText='color:#aaa;font-size:11px;margin:4px 0';desc.textContent=trigger.rewardDesc;choicesEl.appendChild(desc);}
  }else if(trigger.type==='finale'){
    game.player.storyPhase=Math.max(game.player.storyPhase,3);
    addMsg('【最终真相】一切都清晰了...');
    const btn=document.createElement('button');btn.className='btn';btn.style.margin='4px';
    btn.style.borderColor='#ff0';btn.style.color='#ff0';
    btn.textContent=t('选择你的命运');
    btn.onclick=function(){
      closeStory();
      showEndingChoice();
    };
    choicesEl.appendChild(btn);
  }

  overlay.classList.add('active');
}

function closeStory(){
  document.getElementById('story-overlay').classList.remove('active');
  render();
}

function applyStoryReward(key){
  if(!key)return;
  const p=game.player;
  switch(key){
    case 'parasite_instinct':p._storyParasiteBonus=0.15;addMsg('🧬 寄生本能觉醒：附身成功率永久+15%');break;
    case 'echo_heal':p._storyEchoHeal=true;addMsg('💚 记忆回声：每次换层回复5%最大HP');break;
    case 'dead_relic':if(game.forms.length<4){game.forms.push(null);game._deadForms.push(false);addMsg('📦 死者遗物：形态槽+1（当前'+game.forms.length+'/4）');updateFormBar();}else{try{sounds.slotsFull();}catch(e){}p.evoPoints+=200;addMsg('📦 形态槽已满，获得200EP');}break;
    case 'anchor_shield':p._collapseResist=true;addMsg('🛡 意识锚定强化：获得1次崩溃抵抗');break;
    case 'cognitive_split':p._storyPollReduction=5;addMsg('☢️ 认知裂变：污染技能消耗-5');break;
    case 'echo_power':{
      const path=p.playerClass;
      if(p.evolution[path]<5){
        p.evolution[path]++;
        const node=evolutionPaths[path]?evolutionPaths[path][p.evolution[path]-1]:null;
        if(node&&node.effect){
          var _eb=ensureEvoBonus(p);
          if(node.effect.atk){p.atk+=node.effect.atk;_eb.atk+=node.effect.atk;}
          if(node.effect.def){p.def+=node.effect.def;_eb.def+=node.effect.def;}
          if(node.effect.maxHp){p.maxHp+=node.effect.maxHp;p.hp+=node.effect.maxHp;_eb.maxHp+=node.effect.maxHp;}
        }
        addMsg('⚡ 残响之力：'+p.playerClass+'进化+1级');
      }else{p.evoPoints+=300;addMsg('⚡ 已满级，获得300EP');}
      break;}
    case 'foresight':p._storyDodge=0.1;addMsg('👁 预知残像：10%几率闪避攻击');break;
    case 'memory_fusion':p.atk+=8;p.def+=5;addMsg('🔥 记忆融合：ATK+8 DEF+5');break;
    case 'recursive_awaken':p.maxHp+=50;p.hp=p.maxHp;addMsg('🌀 递归觉醒：MaxHP+50，HP回满');break;
  }
  markDirty();saveGame();render();
}

// === 隐藏剧情事件系统 ===
const hiddenStoryEvents=[
  {id:'echo_corridor',name:'回声走廊',
    check:function(){return(game._moveCountThisFloor||0)>=15&&!game.player.storyFlags.hidden_echo_corridor;},
    text:'你的脚步声在走廊中产生了奇怪的共鸣...\n墙壁震动，露出一个暗格！',
    reward:function(){
      const p=game.player;p.atk+=2;p.def+=2;p.maxHp+=15;p.hp+=15;
      addMsg('🔮 回声走廊：ATK+2 DEF+2 MaxHP+15');
    }},
  {id:'mirror_whisper',name:'镜中低语',
    check:function(){const types=Object.keys(game.player.possessed||{});return types.length>=3&&!game.player.storyFlags.hidden_mirror_whisper;},
    triggerOn:'shop',
    text:'商人盯着你看了很久：\n"你身上有太多灵魂的气息..."\n他从柜台下取出一个发光的碎片。',
    reward:function(){
      const p=game.player;p.atk+=3;p.def+=3;p.maxHp+=20;p.hp=Math.min(p.maxHp,p.hp+20);
      addMsg('👤 镜中低语：ATK+3 DEF+3 MaxHP+20');
    }},
  {id:'parasite_resonance',name:'寄生共鸣',
    check:function(){return game.player.pollution>=60&&!game.player.storyFlags.hidden_parasite_resonance;},
    triggerOn:'possess_success',
    text:'"污染不是毒药...它在帮助你"\n一股温暖的能量从污染核心流出。',
    reward:function(){
      game.player._storyPollRegen=true;
      addMsg('☢️ 寄生共鸣：战斗中每回合回复2%最大HP');
    }},
  {id:'death_memory',name:'亡者记忆',
    check:function(){return(game._consecutiveDeaths||0)>=2&&!game.player.storyFlags.hidden_death_memory;},
    triggerOn:'combat_win',
    text:'"每次死亡都让你更强..."\n亡者的记忆融入了你的意识。',
    reward:function(){
      game.player._storyTenacious=true;
      addMsg('💀 亡者记忆：HP<20%时DEF翻倍');
    }},
  {id:'subject_zero',name:'实验体零号',
    check:function(){return game.floor%5===0&&game.player.hp===1&&!game.player.storyFlags.hidden_subject_zero;},
    triggerOn:'floor_enter',
    text:'"系统检测到极限状态...启动应急协议"\n一道光芒笼罩了你。',
    reward:function(){
      const p=game.player;
      var _eb=ensureEvoBonus(p);
      var _dA=Math.floor(p.atk*1.1)-p.atk;
      var _dD=Math.floor(p.def*1.1)-p.def;
      var _dH=Math.floor(p.maxHp*1.1)-p.maxHp;
      p.atk+=_dA;p.def+=_dD;p.maxHp+=_dH;p.hp=p.maxHp;
      _eb.atk+=_dA;_eb.def+=_dD;_eb.maxHp+=_dH;
      addMsg('⚡ 实验体零号：全属性+10%，HP回满');
    }},
  {id:'lone_explorer',name:'孤独探索者',
    check:function(){return(game._floorsWithoutPossess||0)>=5&&!game.player.storyFlags.hidden_lone_explorer;},
    triggerOn:'floor_enter',
    text:'"独行的意志赋予了你力量"\n你感受到一股孤独而强大的能量。',
    reward:function(){
      game.player._storyLoneWolfBonus=true;
      addMsg('🐺 孤独探索者：无附身形态时ATK+20%');
    }},
  {id:'shadow_trade',name:'暗影交易',
    check:function(){return game.player.hp>50&&!game.player.storyFlags.hidden_shadow_trade;},
    triggerOn:'shop_linger',
    text:'"嘘...我有些特别的东西..."\n一个暗影商人从角落现身。',
    reward:function(){
      const p=game.player;
      if(p.hp>50){p.hp-=50;p.evoPoints+=200;addMsg('🌑 暗影交易：-50HP +200EP');}
      else{addMsg('🌑 暗影商人："你太虚弱了，下次吧"');}
    }},
  {id:'recursive_door',name:'递归之门',
    check:function(){return game.floor>=25&&game.player.x===1&&game.player.y===1&&!game.player.storyFlags.hidden_recursive_door;},
    triggerOn:'move',
    text:'你发现了空间裂缝！\n一扇发光的门出现在墙壁中。',
    reward:function(){
      const p=game.player;
      const choices=['ATK+8','DEF+6','MaxHP+40'];
      const pick=choices[Math.floor(Math.random()*3)];
      if(pick==='ATK+8'){p.atk+=8;addMsg('🚪 递归之门：ATK+8');}
      else if(pick==='DEF+6'){p.def+=6;addMsg('🚪 递归之门：DEF+6');}
      else{p.maxHp+=40;p.hp+=40;addMsg('🚪 递归之门：MaxHP+40');}
    }},
  {id:'wall_gift',name:'墙壁暗格',
    check:function(){return Math.random()<0.03&&!game.player.storyFlags['hidden_wall_gift_'+game.floor];},
    triggerOn:'wall_bump',repeatable:true,
    text:'你撞到墙壁时，发现了一个隐藏暗格！\n里面有前人留下的物资。',
    reward:function(){
      game.player.storyFlags['hidden_wall_gift_'+game.floor]=true;
      const r=Math.random();
      const p=game.player;
      if(r<0.3){p.hp=Math.min(p.maxHp,p.hp+Math.floor(p.maxHp*0.2));addMsg('🎁 墙壁暗格：回复20%HP');}
      else if(r<0.6){p.evoPoints+=50;addMsg('🎁 墙壁暗格：+50EP');}
      else if(r<0.85){p.atk+=1;p.def+=1;addMsg('🎁 墙壁暗格：ATK+1 DEF+1');}
      else{const heal=Math.floor(p.maxHp*0.3);p.hp=Math.min(p.maxHp,p.hp+heal);p.pollution=Math.max(0,p.pollution-5);addMsg('🎁 墙壁暗格：回复30%HP 污染-5%');}
    }}
];

function checkHiddenStory(trigger,extraData){
  if(!game.player||!game.player.storyFlags)return;
  if(window.GameModes&&GameModes.isShort())return;
  let triggered=false;
  hiddenStoryEvents.forEach(ev=>{
    if(triggered)return;
    if(ev.triggerOn&&ev.triggerOn!==trigger)return;
    if(!ev.triggerOn&&trigger!=='move')return;
    try{
      if(!ev.check())return;
    }catch(e){return;}
    if(!ev.repeatable)game.player.storyFlags['hidden_'+ev.id]=true;
    triggered=true;
    const flash=document.createElement('div');
    flash.style.cssText='position:fixed;inset:0;background:rgba(180,85,255,0.3);z-index:9998;pointer-events:none';
    document.body.appendChild(flash);
    setTimeout(()=>flash.remove(),400);
    try{initAudio();if(_audioContext)playFreqSweep(400,800,0.5);}catch(e){}
    const evOv=document.getElementById('event-overlay');
    document.getElementById('event-title').innerHTML='<span style="color:#b455ff">🔮 隐藏发现</span> '+ev.name;
    const choicesEl=document.getElementById('event-choices');
    choicesEl.innerHTML='';
    document.getElementById('event-text').textContent=ev.text;
    const btn=document.createElement('button');btn.className='btn';btn.style.margin='4px';
    btn.style.borderColor='#b455ff';btn.style.color='#b455ff';
    btn.textContent=t('获取奖励');
    btn.onclick=function(){ev.reward();closeEvent();markDirty();saveGame();render();};
    choicesEl.appendChild(btn);
    evOv.style.display='flex';
  });
}

function showStoryArchive(){
  const ev=document.getElementById('event-overlay');
  ev.style.display='flex';
  const flags=game.player.storyFlags||{};
  const mainFloors=[5,10,15,20,25,30,35,40,45,50];
  const hiddenIds=hiddenStoryEvents.filter(e=>!e.repeatable);
  let mainCount=0,hiddenCount=0;
  const wallGifts=Object.keys(flags).filter(k=>k.startsWith('hidden_wall_gift_')).length;
  const total=mainFloors.length+hiddenIds.length+1;

  document.getElementById('event-title').innerHTML='ARCHIVE / 记忆档案';

  // 主线
  let mainHtml='';
  mainFloors.forEach(f=>{
    const t=storyTriggers[f];
    const found=!!flags['floor_'+f];
    if(found)mainCount++;
    const idStr='F'+(f<10?'0'+f:f);
    if(found){
      mainHtml+='<div class="arc-row unlocked">'+
        '<span class="arc-row__id">'+idStr+'</span>'+
        '<span class="arc-row__title">'+(t?t.title:'未命名记录')+(t&&t.rewardName?' <span class="arc-row__sub">'+t.rewardName+'</span>':'')+'</span>'+
        '<span class="arc-row__status">●</span>'+
        '</div>';
    }else{
      mainHtml+='<div class="arc-row locked">'+
        '<span class="arc-row__id">'+idStr+'</span>'+
        '<span class="arc-row__title"></span>'+
        '<span class="arc-row__status">🔒</span>'+
        '</div>';
    }
  });

  // 隐藏事件
  let hiddenHtml='';
  hiddenIds.forEach((evd,i)=>{
    const found=!!flags['hidden_'+evd.id];
    if(found)hiddenCount++;
    const idStr='H'+(i+1<10?'0'+(i+1):i+1);
    if(found){
      hiddenHtml+='<div class="arc-row purple unlocked">'+
        '<span class="arc-row__id">'+idStr+'</span>'+
        '<span class="arc-row__title">🔮 '+evd.name+'</span>'+
        '<span class="arc-row__status">●</span>'+
        '</div>';
    }else{
      hiddenHtml+='<div class="arc-row purple locked">'+
        '<span class="arc-row__id">'+idStr+'</span>'+
        '<span class="arc-row__title"></span>'+
        '<span class="arc-row__status">🔒</span>'+
        '</div>';
    }
  });
  // 墙壁暗格
  hiddenHtml+='<div class="arc-row purple '+(wallGifts>0?'unlocked':'locked')+'">'+
    '<span class="arc-row__id">WG</span>'+
    '<span class="arc-row__title">'+(wallGifts>0?'🎁 墙壁暗格 <span class="arc-row__sub">×'+wallGifts+'</span>':'')+'</span>'+
    '<span class="arc-row__status">'+(wallGifts>0?'●':'🔒')+'</span>'+
    '</div>';

  const found=mainCount+hiddenCount+(wallGifts>0?1:0);
  const html=
    '<div class="arc-meta"><span>RECORD / 发现进度</span><span><span class="arc-meta-num">'+found+'</span> / '+total+'</span></div>'+
    '<div class="arc-section cyan">主线剧情</div>'+
    '<div class="arc-list">'+mainHtml+'</div>'+
    '<div class="arc-section purple">隐藏事件</div>'+
    '<div class="arc-list">'+hiddenHtml+'</div>';

  document.getElementById('event-text').innerHTML='<div style="max-height:62vh;overflow-y:auto;padding-right:4px">'+html+'</div>';
  document.getElementById('event-choices').innerHTML='<button class="btn btn-secondary" style="min-width:140px" onclick="closeEvent()">关闭</button>';
}

function showEndingChoice(){
  const p=game.player;
  const cls=p.playerClass;
  if(!cls||!classEndings[cls]){addMsg('错误：职业数据丢失');return;}
  const cc=classColors[cls];
  const ending=classEndings[cls];

  const overlay=document.getElementById('story-overlay');
  const box=document.getElementById('story-box');
  const titleEl=document.getElementById('story-title');
  const textEl=document.getElementById('story-text');
  const choicesEl=document.getElementById('story-choices');

  box.className='story-box';
  box.style.borderColor=cc.primary;
  titleEl.textContent=t('🌀 选择存在形式');
  titleEl.style.color=cc.primary;

  let choiceText='你站在起源之地。\n镜中的"你"等待着你的决定。\n\n';
  if(cls==='titan')choiceText+='你可以成为永恒的墙壁，\n守护这座塔直到世界终结。';
  else if(cls==='ghost')choiceText+='你可以消散于虚实边界，\n成为自由的观察者。';
  else choiceText+='你可以分裂为无数碎片，\n拥抱混沌的增殖。';
  textEl.textContent=choiceText;

  choicesEl.innerHTML='';
  const btn1=document.createElement('button');btn1.className='btn';btn1.style.margin='4px';
  btn1.style.borderColor=cc.primary;btn1.style.color=cc.primary;btn1.style.display='block';btn1.style.width='100%';
  btn1.textContent=cc.icon+' '+ending.title+' ('+cc.name+'结局)';
  btn1.onclick=function(){closeStory();triggerEnding(cls);};
  choicesEl.appendChild(btn1);

  const btn2=document.createElement('button');btn2.className='btn btn-secondary';btn2.style.margin='4px';
  btn2.style.display='block';btn2.style.width='100%';
  btn2.textContent=t('还没准备好...继续探索');
  btn2.onclick=function(){closeStory();addMsg('你转身离开了镜子...');render();};
  choicesEl.appendChild(btn2);

  overlay.classList.add('active');
}

function triggerModeFinale(){
  var _cap=window.GameRules?GameRules.floorCap:50;
  if(window.GameModes&&GameModes.isShort()){
    if(window.ShortMode) ShortMode.forceFinale('time');
    return;
  }
  var trigger=hidden_revelations[_cap];
  if(trigger&&trigger.type==='finale'){
    showStoryEvent(trigger);
  }else{
    showEndingChoice();
  }
}

function triggerEnding(cls){
  const ending=classEndings[cls];
  const cc=classColors[cls];
  if(typeof endRunSave==='function')endRunSave(); else {localStorage.removeItem('pt_save');localStorage.removeItem('parasiteTowerSave');}
  document.getElementById('story-overlay').classList.remove('active');

  const achieved=safeParse(localStorage.getItem('pt_endings'),[]);
  if(!achieved.includes(cls)){achieved.push(cls);localStorage.setItem('pt_endings',JSON.stringify(achieved));}
  game.player.endingsAchieved=achieved;
  unlockAchievement(cls+'_end');
  saveEndingRecord(cls);

  const overlay=document.getElementById('ending-overlay');
  overlay.classList.add('active');
  document.getElementById('ending-title').textContent=ending.title;
  document.getElementById('ending-title').style.color=cc.primary;
  document.getElementById('ending-text').textContent=ending.text;
  document.getElementById('ending-achievement').textContent='成就解锁: 【'+ending.achievement+'】';
  document.getElementById('ending-quote').textContent=ending.quote;

  let actHtml='<div style="margin-top:10px;font-size:.75em;color:#666">'+ending.subtitle+' - '+cc.icon+' '+cc.name+'</div>';
  actHtml+='<div style="margin-top:16px">';
  actHtml+='<button class="ending-btn" onclick="newGamePlus()">新游戏+</button>';
  actHtml+='<button class="ending-btn" style="border-color:#1ed8b0;color:#1ed8b0" onclick="shareEndingPoster(\''+cls+'\')">📷 海报分享</button>';
  actHtml+='<button class="ending-btn" style="border-color:#888;color:#888;font-size:.85em" onclick="shareEnding(\''+cls+'\')">📋 文本</button>';
  actHtml+='<button class="ending-btn" style="border-color:#444;color:#888" onclick="backToTitle()">返回主页</button>';
  actHtml+='</div>';

  if(achieved.length>=3&&achieved.includes('titan')&&achieved.includes('ghost')&&achieved.includes('swarm')){
    actHtml+='<div style="margin-top:12px"><button class="ending-btn" style="border-color:#ff0;color:#ff0" onclick="triggerHiddenEnding()">???</button></div>';
  }

  if(window.GameModes&&GameModes.isShort()&&window.ShortMode){
    actHtml+='<div style="margin-top:12px"><button class="ending-btn" style="border-color:#1ed8b0;color:#1ed8b0" onclick="document.getElementById(\'ending-overlay\').classList.remove(\'active\');ShortMode.showResume()">📋 迭代履历书</button></div>';
  }

  document.getElementById('ending-actions').innerHTML=actHtml;
}

function triggerHiddenEnding(){
  const overlay=document.getElementById('ending-overlay');
  document.getElementById('ending-title').textContent=hiddenEnding.title;
  document.getElementById('ending-title').style.color='#ff0';
  document.getElementById('ending-text').textContent=hiddenEnding.text;
  document.getElementById('ending-achievement').textContent='成就解锁: 【'+hiddenEnding.achievement+'】';
  document.getElementById('ending-quote').textContent=hiddenEnding.quote;

  const achieved=safeParse(localStorage.getItem('pt_endings'),[]);
  if(!achieved.includes('hidden')){achieved.push('hidden');localStorage.setItem('pt_endings',JSON.stringify(achieved));}
  unlockAchievement('hidden_end');
  saveEndingRecord('hidden');

  document.getElementById('ending-actions').innerHTML='<div style="margin-top:16px"><button class="ending-btn" onclick="backToTitle()">返回主页</button></div>';
}

function restartGame(){
  if(game._deathTimer){clearInterval(game._deathTimer);game._deathTimer=null;}
  game._triggerDeathActive=false;
  const overlay=document.getElementById('death-overlay');
  if(overlay)overlay.classList.remove('active');
  if(typeof resetRenderCaches==='function')resetRenderCaches();
  clearAllGameData();
  location.reload();
}

function newGamePlus(){
  document.getElementById('ending-overlay').classList.remove('active');
  localStorage.removeItem('pt_save');
  localStorage.removeItem('pt_save_short');
  localStorage.removeItem('pt_save_classic');
  localStorage.removeItem('parasiteTowerSave');
  localStorage.removeItem('pt_affinity');
  location.reload();
}

function backToTitle(){
  // 清理短局崩溃结算残留（top-bar 乱码、_endScreenActive）
  try{ if(window.ShortMode&&typeof ShortMode._cleanupCrash==='function') ShortMode._cleanupCrash(); }catch(e){}
  try{ if(window.game) game._endScreenActive=false; }catch(e){}
  // 统一清理游戏会话定时器和渲染缓存
  try{
    if(game._deathTimer){clearInterval(game._deathTimer);game._deathTimer=null;}
    if(game._floorTimerInterval){clearInterval(game._floorTimerInterval);game._floorTimerInterval=null;}
    if(game._collapseTimer){clearInterval(game._collapseTimer);game._collapseTimer=null;}
  }catch(e){}
  if(typeof stopAllAudioTimers==='function')try{stopAllAudioTimers();}catch(e){}
  if(typeof cleanupFormTimers==='function')try{cleanupFormTimers();}catch(e){}
  if(typeof stopPollutionCombatEffects==='function')try{stopPollutionCombatEffects();}catch(e){}
  if(typeof resetRenderCaches==='function')resetRenderCaches();
  document.getElementById('ending-overlay').classList.remove('active');
  // 关闭可能残留的覆盖层（不动 game-screen 子元素的 display，避免下一局开局后画面空白）
  var co=document.getElementById('combat-overlay');if(co){co.classList.remove('active');co.style.display='';}
  var eo=document.getElementById('event-overlay');if(eo){eo.style.display='none';eo.classList.remove('active');}
  // 整个 game-screen 通过移除 .active 隐藏，子元素 display 保持默认，下次开局自动恢复
  var gs=document.getElementById('game-screen');if(gs)gs.classList.remove('active');
  window._titleSaveInfo=typeof getSaveInfo==='function'?getSaveInfo():null;
  window._titleDeathReturn=true;
  showTitleScreen(true);
}

const whispers=['...你听到了什么...','...边界在震动...','...谁在说话？...','...这不是出口...','...记忆在渗漏...','...你就是...'];
