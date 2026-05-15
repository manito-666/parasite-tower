// ============ HP低警告系统（防暴毙） ============

function checkLowHpWarning(){
  const p=game.player;
  const ratio=p.hp/p.maxHp;
  const vignette=document.getElementById('hp-warning-vignette');
  const hint=document.getElementById('hp-switch-hint');
  if(!vignette||!hint)return;

  if(ratio<0.3 && p.hp>0){
    // 屏幕红光脉动
    vignette.classList.add('active');
    // 提示切换
    const hasBackup=game.forms.some((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
    if(hasBackup && !game._loneWolf){
      hint.classList.add('active');
      // 其他形态槽高亮闪烁
      for(let i=0;i<game.forms.length;i++){
        const el=document.getElementById('fslot-'+i);
        if(el && i!==game.currentForm && game.forms[i] && !game._deadForms[i] && game.forms[i].hp>0){
          el.classList.add('blink-hint');
        }
      }
      // 意识警告音效（高频电子音）
      try{
        if(!game._lowHpSoundPlayed){
          const ctx=new(window.AudioContext||window.webkitAudioContext)();
          const osc=ctx.createOscillator();
          const gain=ctx.createGain();
          osc.type='square';osc.frequency.value=1200;
          gain.gain.value=0.08;
          osc.connect(gain);gain.connect(ctx.destination);
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
          osc.stop(ctx.currentTime+0.4);
          game._lowHpSoundPlayed=true;
        }
      }catch(e){}
    }else{
      hint.classList.remove('active');
    }
  }else{
    vignette.classList.remove('active');
    hint.classList.remove('active');
    game._lowHpSoundPlayed=false;
    // 移除闪烁
    for(let i=0;i<game.forms.length;i++){
      const el=document.getElementById('fslot-'+i);
      if(el)el.classList.remove('blink-hint');
    }
  }
}

// ============ 死亡瞬间慢动作选择 ============

function showDeathChoice(){
  game._deathChoiceActive=true;
  // 收集存活备用形态
  const aliveSlots=[];
  game.forms.forEach((f,i)=>{
    if(f && i!==game.currentForm && !game._deadForms[i] && f.hp>0){
      aliveSlots.push({index:i, form:f});
    }
  });

  if(aliveSlots.length===0){
    // 无备用形态，直接死亡
    game._deathChoiceActive=false;
    closeCombat();
    triggerDeath();
    return;
  }

  const overlay=document.getElementById('death-choice-overlay');
  overlay._deathChoiceHandled=false;
  const cards=document.getElementById('death-choice-cards');
  const cdEl=document.getElementById('death-choice-cd');
  overlay.classList.add('active');
  cards.innerHTML='';

  // 生成形态选项卡片
  aliveSlots.forEach((slot,idx)=>{
    const f=slot.form;
    const hpPct=Math.round(f.hp/f.maxHp*100);
    const card=document.createElement('div');
    card.className='death-choice-card'+(idx===0?' default-pick':'');
    card.innerHTML=`
      <div class="dc-icon">${f.icon||'👤'}</div>
      <div class="dc-name">切换至 ${f.name}</div>
      <div class="dc-hp">${hpPct}% HP (${f.hp}/${f.maxHp})</div>
      <div class="dc-stats">ATK:${f.atk} DEF:${f.def}</div>
    `;
    card.onclick=()=>executeDeathChoice(slot.index);
    cards.appendChild(card);
  });

  // 接受死亡选项
  const deathCard=document.createElement('div');
  deathCard.className='death-choice-card death-accept';
  deathCard.innerHTML=`
    <div class="dc-icon">💀</div>
    <div class="dc-name">接受死亡</div>
    <div class="dc-hp" style="color:#ff006e">放弃抵抗</div>
  `;
  deathCard.onclick=()=>executeDeathChoice(-1);
  cards.appendChild(deathCard);

  // 3秒倒计时，默认选第一个
  let countdown=3;
  cdEl.textContent=countdown;
  overlay._cdTimer=setInterval(()=>{
    countdown--;
    cdEl.textContent=Math.max(0,countdown);
    if(countdown<=0){
      clearInterval(overlay._cdTimer);
      // 默认选第一个存活形态
      executeDeathChoice(aliveSlots[0].index);
    }
  },1000);
}

function executeDeathChoice(targetIndex){
  const overlay=document.getElementById('death-choice-overlay');
  if(overlay._deathChoiceHandled)return;
  overlay._deathChoiceHandled=true;
  if(overlay._cdTimer){clearInterval(overlay._cdTimer);overlay._cdTimer=null;}
  overlay.classList.remove('active');

  if(targetIndex===-1){
    // 接受死亡
    closeCombat();
    checkDeathTransfer_forceCollapse();
    return;
  }

  // 执行转移
  checkDeathTransfer_withTarget(targetIndex);
}

// 强制深度崩溃（玩家选择接受死亡）
function checkDeathTransfer_forceCollapse(){
  game._deathChoiceActive=false;
  saveCurrentForm();
  storeFormEcho(game.forms[game.currentForm]);
  game.forms[game.currentForm].hp=0;
  game._deadForms[game.currentForm]=true;
  addMsg('放弃抵抗... 意识消散');
  triggerDeath();
}

// 3.3 残响继承: 形态阵亡时记录其属性快照，下次附身继承 20%
function storeFormEcho(form){
  if(!form)return;
  game.player._formEcho={
    name:form.name||'未知形态',
    atk:form.atk||0,
    def:form.def||0,
    maxHp:form.maxHp||0
  };
  try{addMsg('<span style="color:#b455ff;font-style:italic">💔 '+game.player._formEcho.name+' 的残响留存下来...</span>');}catch(e){}
}

// 带目标的转移（来自死亡选择界面）
function checkDeathTransfer_withTarget(targetIndex){
  saveCurrentForm();
  storeFormEcho(game.forms[game.currentForm]);
  game.forms[game.currentForm].hp=0;
  game._deadForms[game.currentForm]=true;

  // 直接执行转移，不再走倒计时流程
  executeDeathTransfer(targetIndex);
}

// ============ 濒死转移协议 ============

// 检查是否可以进行濒死转移
function checkDeathTransfer(){
  // 保存当前形态并标记死亡
  saveCurrentForm();
  storeFormEcho(game.forms[game.currentForm]);
  game.forms[game.currentForm].hp=0;
  game._deadForms[game.currentForm]=true;

  // 扫描存活形态
  const aliveSlots=[];
  game.forms.forEach((f,i)=>{
    if(f && i!==game.currentForm && !game._deadForms[i] && f.hp>0){
      aliveSlots.push(i);
    }
  });

  if(aliveSlots.length===0){
    // 深度崩溃：所有形态全灭
    addMsg('所有形态全部阵亡... 深度崩溃');
    closeCombat();
    triggerDeath();
    return;
  }

  if(aliveSlots.length===1){
    // 仅剩1个形态，自动选中，2秒后转移
    showTransferOverlay(aliveSlots, true);
  } else {
    // 多个存活形态，让玩家选择
    showTransferOverlay(aliveSlots, false);
  }
}

// 显示转移提案UI
function showTransferOverlay(aliveSlots, autoSelect){
  const overlay=document.getElementById('transfer-overlay');
  const formList=document.getElementById('transfer-form-list');
  const timerEl=document.getElementById('transfer-timer');
  const skipBtn=document.getElementById('transfer-skip-btn');

  overlay.classList.add('active');
  formList.innerHTML='';

  // EP>=1000时启用紧急接管按钮
  skipBtn.disabled=game.player.evoPoints<1000;

  // 倒计时
  let countdown=2;
  timerEl.textContent=countdown;
  const cdTimer=setInterval(()=>{
    countdown--;
    timerEl.textContent=Math.max(0,countdown);
    if(countdown<=0){
      clearInterval(cdTimer);

      if(autoSelect){
        executeDeathTransfer(aliveSlots[0]);
        return;
      }

      timerEl.textContent='▶';
      // 倒计时结束，显示可选形态卡片
      aliveSlots.forEach(idx=>{
        const f=game.forms[idx];
        const card=document.createElement('div');
        card.className='transfer-form-card';
        card.innerHTML=`
          <div class="form-icon">${(function(){var u=f.type?getMonsterIconDataURL(f.type):'';return u?'<img src="'+u+'" style="width:28px;height:28px;border-radius:4px">':(f.icon||'👤');}())}</div>
          <div class="form-name">${f.name}</div>
          <div class="form-hp">HP:${f.hp}/${f.maxHp}</div>
          <div style="font-size:10px;color:#aaa">ATK:${f.atk} DEF:${f.def}</div>
        `;
        card.onclick=()=>executeDeathTransfer(idx);
        formList.appendChild(card);
      });
    }
  },1000);

  // 存储timer引用以便紧急接管时清除
  overlay._cdTimer=cdTimer;
  overlay._aliveSlots=aliveSlots;
}

// 执行濒死转移
function executeDeathTransfer(targetIndex){
  const overlay=document.getElementById('death-choice-overlay');
  const transferOv=document.getElementById('transfer-overlay');
  if(overlay&&overlay._cdTimer)clearInterval(overlay._cdTimer);
  if(transferOv&&transferOv._cdTimer)clearInterval(transferOv._cdTimer);
  if(overlay)overlay.classList.remove('active');
  if(transferOv)transferOv.classList.remove('active');
  game._deathChoiceActive=false;

  // 加载目标形态
  const success=loadForm(targetIndex);
  if(!success){
    addMsg('转移失败：目标形态不存在');
    closeCombat();triggerDeath();
    return;
  }

  // 确保HP正确（防止加载后HP仍为0的情况）
  if(game.player.hp<=0){
    const slot=game.forms[targetIndex];
    if(slot&&slot.hp>0){
      game.player.hp=slot.hp;
      game.player.maxHp=slot.maxHp;
    }else{
      game.player.hp=Math.max(1,Math.floor(game.player.maxHp*0.3));
    }
  }

  // 清理低HP警告闪烁
  for(let i=0;i<game.forms.length;i++){
    const el=document.getElementById('fslot-'+i);
    if(el)el.classList.remove('blink-hint');
  }
  const vignette=document.getElementById('hp-warning-vignette');
  const hint=document.getElementById('hp-switch-hint');
  if(vignette)vignette.classList.remove('active');
  if(hint)hint.classList.remove('active');
  game._lowHpSoundPlayed=false;

  // 设置重组僵直1回合
  game._stiffnessTurns=1;

  // 检查孤狼模式（仅设标记，伤害加成在attack()中统一处理）
  // 仅当恰好剩 1 个活槽时触发
  const aliveCount=game.forms.filter((f,i)=>f&&!game._deadForms[i]&&f.hp>0).length;
  if(aliveCount===1){
    game._loneWolf=true;
    addMsg('孤狼模式激活! ATK+30% 但无法切换形态');
    addMsg('下次死亡将触发深度崩溃!');
  }

  addMsg('意识转移成功! 切换为 '+game.player.name+' HP:'+game.player.hp+'/'+game.player.maxHp);
  addMsg('重组僵直: 本回合无法行动但免受伤害');

  // 刷新战斗UI
  if(game.target){
    showCombat();
  }
  updateFormBar();
  render();
}

// 紧急接管(1000EP跳过等待)
function emergencyTakeover(){
  if(game.player.evoPoints<1000){addMsg('EP不足');return;}
  const overlay=document.getElementById('transfer-overlay');
  const aliveSlots=overlay._aliveSlots||[];

  if(aliveSlots.length===0){addMsg('没有可用形态');return;}

  game.player.evoPoints-=1000;

  if(overlay._cdTimer) clearInterval(overlay._cdTimer);

  addMsg('紧急接管! -1000EP 跳过僵直');
  game._stiffnessTurns=0;

  if(aliveSlots.length===1){
    executeDeathTransfer(aliveSlots[0]);
    return;
  }

  // 多个形态：立即显示选择卡片，跳过倒计时
  const formList=document.getElementById('transfer-form-list');
  const timerEl=document.getElementById('transfer-timer');
  timerEl.textContent='▶';
  formList.innerHTML='';
  aliveSlots.forEach(idx=>{
    const f=game.forms[idx];
    const card=document.createElement('div');
    card.className='transfer-form-card';
    card.innerHTML=`
      <div class="form-icon">${f.icon||'👤'}</div>
      <div class="form-name">${f.name}</div>
      <div class="form-hp">HP:${f.hp}/${f.maxHp}</div>
      <div style="font-size:10px;color:#aaa">ATK:${f.atk} DEF:${f.def}</div>
    `;
    card.onclick=()=>executeDeathTransfer(idx);
    formList.appendChild(card);
  });
}

function triggerDeath(){
  if(game._triggerDeathActive)return;
  game._triggerDeathActive=true;
  game._inCombat=false;
  game._autoFight=false;
  game._deathChoiceActive=false;
  if(game._collapseTimer){clearInterval(game._collapseTimer);game._collapseTimer=null;}
  // 连续死亡计数
  game._consecutiveDeaths=(game._consecutiveDeaths||0)+1;
  // 生命结晶：阻止死亡，恢复50%HP
  if(game._lifeStone){
    game._lifeStone=false;
    game.player.hp=Math.max(1,Math.floor(game.player.maxHp*0.5));
    addMsg('💠 生命结晶碎裂！恢复50%HP');
    game._triggerDeathActive=false;
    game._consecutiveDeaths=0;
    markDirty();
    return;
  }
  try{sounds.death();}catch(e){}
  const p=game.player;
  p.deathCount=(p.deathCount||0)+1;
  checkClassUnlock(); // 死亡3次解锁幽灵

  // 死亡复活检查（商店购买的保险）
  if(p._deathRevive){
    p._deathRevive=false;
    p.hp=Math.floor(p.maxHp*0.3);
    p.pollution=Math.max(0,p.pollution-20);
    addMsg('// 死亡复活激活！保留当前形态，HP恢复30% //');
    if(game.target){game.target=null;}
    closeCombat();render();
    game._triggerDeathActive=false;
    game._consecutiveDeaths=0;
    return;
  }

  // 短局模式：仅当锚点不可用（EP不足回滚）时直接进入「迭代终止报告」
  // 否则按常规死亡流程，让玩家选择「回滚锚点」或「结束本局」
  if(window.GameModes&&typeof GameModes.isShort==='function'&&GameModes.isShort()&&window.ShortMode){
    var _epPenalty=Math.min(2000,500+game.floor*50);
    if(game.player.evoPoints<_epPenalty){
      try{if(typeof endRunSave==='function')endRunSave();}catch(e){}
      game._triggerDeathActive=false;
      game._consecutiveDeaths=0;
      try{ShortMode.forceFinale('death');}catch(e){}
      return;
    }
  }

  const overlay=document.getElementById('death-overlay');
  // 预动画：红色闪光 + 屏幕震动
  var flashEl=document.createElement('div');
  flashEl.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(255,0,40,.55);pointer-events:none';
  document.body.appendChild(flashEl);
  setTimeout(function(){flashEl.style.background='rgba(255,0,40,.25)';},80);
  setTimeout(function(){if(flashEl.parentNode)flashEl.parentNode.removeChild(flashEl);},180);
  var gc=document.getElementById('game-container')||document.body;
  gc.classList.add('death-shake');
  setTimeout(function(){gc.classList.remove('death-shake');},400);
  // 延迟后显示死亡覆盖层
  setTimeout(function(){
  overlay.classList.add('active');
  // 本局判定结束：清除当前模式存档；若玩家选择回滚，rollbackToAnchor 会复位标志
  try{if(typeof endRunSave==='function')endRunSave();}catch(e){}
  const a=game.anchor;
  const lostFloors=game.floor-a.floor;

  // 死亡EP惩罚（500 + 层数×50，上限2000）
  const epPenalty=Math.min(2000,500+game.floor*50);

  // 目标信息
  document.getElementById('death-target-info').textContent=
    '回滚至: '+a.anchorName;

  // 丢失/保留信息
  const infoEl=document.getElementById('death-info');
  let html='';
  if(lostFloors>0){
    html+='<div class="death-info-row lost"><span>丢失</span><span>第'+(a.floor+1)+'-'+game.floor+'层探索进度</span></div>';
  }
  if(game.player.formType!==a.player.formType){
    html+='<div class="death-info-row lost"><span>丢失</span><span>'+game.player.name+' 形态</span></div>';
  }
  const atkDiff=game.player.atk-a.player.atk;
  const defDiff=game.player.def-a.player.def;
  if(atkDiff>0||defDiff>0){
    html+='<div class="death-info-row lost"><span>丢失</span><span>属性增长 (ATK+'+(atkDiff>0?atkDiff:0)+' DEF+'+(defDiff>0?defDiff:0)+')</span></div>';
  }
  html+='<div class="death-info-row lost"><span>扣除</span><span style="color:#ff006e">-'+epPenalty+'EP (死亡惩罚)</span></div>';
  // EP 不足判定：回滚必须支付完整惩罚，EP<惩罚 则强制结束
  const canRollback=game.player.evoPoints>=epPenalty;
  if(!canRollback){
    html+='<div class="death-info-row lost" style="color:#ff006e;font-weight:bold"><span>⚠</span><span>进化点不足（'+game.player.evoPoints+'/'+epPenalty+'EP），无法回滚</span></div>';
  }
  // 保留
  const remainEP=Math.max(0,game.player.evoPoints-epPenalty);
  html+='<div class="death-info-row kept"><span>保留</span><span>进化点 '+remainEP+'EP</span></div>';
  html+='<div class="death-info-row kept"><span>保留</span><span>进化路径等级</span></div>';
  html+='<div class="death-info-row kept"><span>保留</span><span>已解析怪物信息</span></div>';

  // 提供EP复活选项（如果有足够EP）
  if(game.player.evoPoints>=2000){
    html+='<div style="margin-top:8px;padding:8px;border:1px solid #ff0;border-radius:6px;background:rgba(255,255,0,0.05)">';
    html+='<button class="btn" style="width:100%;border-color:#ff0;color:#ff0" onclick="deathReviveNow()">立即复活 (2000EP) — 保留形态不回滚</button>';
    html+='</div>';
  }

  // 重新开始选项（短局模式：结束本局并查看战绩报告，不重置游戏）
  var _isShort=window.GameModes&&typeof GameModes.isShort==='function'&&GameModes.isShort()&&window.ShortMode;
  html+='<div style="margin-top:8px;padding:8px;border:1px solid #ff006e;border-radius:6px;background:rgba(255,0,110,0.05)">';
  if(_isShort){
    html+='<button class="btn" style="width:100%;border-color:#ff006e;color:#ff006e" onclick="endShortRunFromDeath()">'+t('结束本局并查看战绩')+'</button>';
  }else{
    html+='<button class="btn" style="width:100%;border-color:#ff006e;color:#ff006e" onclick="restartGame()">重新开始新游戏</button>';
  }
  html+='</div>';

  infoEl.innerHTML=html;
  game._deathEpPenalty=epPenalty;
  game._deathCanRollback=canRollback;

  // 进度条动画
  const fill=document.getElementById('death-progress-fill');
  fill.classList.remove('animating');
  fill.style.width='0';
  setTimeout(()=>{fill.classList.add('animating');},50);

  // EP 不足：禁用回滚按钮，取消自动回滚
  if(!canRollback){
    const btn=document.getElementById('death-btn');
    btn.textContent='EP不足·无法回滚';
    btn.disabled=true;
    btn.style.opacity='0.4';
    btn.style.cursor='not-allowed';
    document.getElementById('death-cd-text').textContent='请「重新开始新游戏」';
    return;
  }

  // 连续死亡>=3次时不自动回滚，让玩家自己选择
  if(game._consecutiveDeaths>=3){
    const cdText=document.getElementById('death-cd-text');
    cdText.textContent='连续死亡过多，请选择操作';
    document.getElementById('death-btn').textContent='回滚并强化';
    return;
  }

  // 必须玩家显式确认才回滚（不再自动）
  const cdText=document.getElementById('death-cd-text');
  cdText.textContent='请选择操作';
  },380);
}

function confirmRollback(){
  if(game._deathTimer)clearInterval(game._deathTimer);
  game._deathTimer=null;
  // EP 不足，硬阻止回滚
  if(game._deathCanRollback===false){
    addMsg('<span style="color:#ff006e;font-weight:bold">进化点不足，无法回滚</span>');
    return;
  }
  game._triggerDeathActive=false;
  const overlay=document.getElementById('death-overlay');
  if(!overlay.classList.contains('active'))return;
  overlay.classList.remove('active');
  // 恢复按钮文字
  document.getElementById('death-btn').textContent='继续旅程';
  rollbackToAnchor();
}

function deathReviveNow(){
  if(game._deathTimer)clearInterval(game._deathTimer);
  game._deathTimer=null;
  game._triggerDeathActive=false;
  game._runEnded=false; // 复活：本局未结束，恢复 autosave
  const overlay=document.getElementById('death-overlay');
  overlay.classList.remove('active');
  const p=game.player;
  p.evoPoints-=2000;
  p.hp=Math.floor(p.maxHp*0.3);
  p.pollution=Math.max(0,p.pollution-20);
  if(game.target){game.target=null;}
  closeCombat();
  addMsg('// EP复活！保留当前形态，HP恢复30% -2000EP //');
  render();
}

function rollbackToAnchor(){
  game._runEnded=false; // 回滚：本局继续，恢复 autosave
  const a=game.anchor;
  const p=game.player;

  // 保留项（死亡后不回滚的）
  const keptPossessed=JSON.parse(JSON.stringify(p.possessed));
  const epPenalty=game._deathEpPenalty||0;
  const keptEvoPoints=Math.max(0,p.evoPoints-epPenalty);
  const keptEvolution=JSON.parse(JSON.stringify(p.evolution));
  const keptClassUnlocked=JSON.parse(JSON.stringify(p.classUnlocked));
  const keptDeathCount=p.deathCount;
  const keptStoryPhase=p.storyPhase;
  const keptStoryFlags=JSON.parse(JSON.stringify(p.storyFlags));
  const keptEndings=p.endingsAchieved;

  // 恢复锚点状态
  p.name=a.player.name;
  p.hp=a.player.hp;
  p.maxHp=a.player.maxHp;
  p.atk=a.player.atk;
  p.def=a.player.def;
  p.traits=a.player.traits.slice();
  p.pollution=a.player.pollution;
  p.formType=a.player.formType;
  // 同步恢复 _evoStatBonus,避免回滚后切换形态时数值膨胀
  p._evoStatBonus=a.player._evoStatBonus?JSON.parse(JSON.stringify(a.player._evoStatBonus)):{atk:0,def:0,maxHp:0};
  // 保证回滚后最低30%HP，防止无限死亡循环
  if(p.hp<Math.floor(p.maxHp*0.3)){p.hp=Math.max(1,Math.floor(p.maxHp*0.3));}
  // 连续死亡>=3次时额外强化，帮助脱困
  if(game._consecutiveDeaths>=3){
    p.hp=p.maxHp;
    p.atk+=Math.floor(p.atk*0.2);
    p.def+=Math.floor(p.def*0.2);
    addMsg('// 记忆共鸣强化: HP回满, ATK/DEF+20% //');
  }

  // 恢复职业状态
  p.playerClass=a.player.playerClass||'swarm';
  p.armor=a.player.armor||0;
  p.stealth=a.player.stealth||0;
  p.stealthActive=false;
  p.swarms=a.player.swarms?JSON.parse(JSON.stringify(a.player.swarms)):[];
  p.ultimateCooldown=a.player.ultimateCooldown||0;
  p.ultimateActive=false;
  p.ultimateTurns=0;
  p._voidWalker=false;
  p._nextCritX5=false;
  p._firstStrikeCrit=false;

  // 恢复保留项
  p.possessed=keptPossessed;
  p.evoPoints=keptEvoPoints;
  p.evolution=keptEvolution;
  p.classUnlocked=keptClassUnlocked;
  p.deathCount=keptDeathCount;
  p.storyPhase=keptStoryPhase;
  p.storyFlags=keptStoryFlags;
  p.endingsAchieved=keptEndings;

  // 恢复形态槽
  game.forms=JSON.parse(JSON.stringify(a.forms));
  game.currentForm=a.currentForm;
  // 确保所有形态至少30%HP
  game.forms.forEach(f=>{if(f&&f.hp<Math.floor(f.maxHp*0.3)){f.hp=Math.max(1,Math.floor(f.maxHp*0.3));}});

  // 恢复楼层
  game.floor=a.floor;
  p.x=6;p.y=6;

  // 清除锚点之后的楼层历史（回滚后重新探索）
  Object.keys(game.floorHistory).forEach(f=>{
    if(Number(f)>a.floor){delete game.floorHistory[f];delete game.explored[f];delete game.floorCleared[f];}
  });
  // 清除当前锚点层的历史（重新生成）
  delete game.floorHistory[a.floor];

  // 重置临时状态
  game.target=null;
  game._revived=false;
  game.phantoms=[];
  game.statLieOffset={atk:0,def:0,hp:0};
  // 清理音频interval
  if(_heartbeatInterval){clearInterval(_heartbeatInterval);_heartbeatInterval=null;}
  if(_whisperInterval){clearInterval(_whisperInterval);_whisperInterval=null;}
  if(_glitchInterval){clearInterval(_glitchInterval);_glitchInterval=null;}
  if(_battleLogTimer){clearTimeout(_battleLogTimer);_battleLogTimer=null;}
  clearBattleLog();
  // 重置濒死转移状态
  game._deadForms=Array(game.forms.length).fill(false);
  game._loneWolf=false;
  game._stiffnessTurns=0;

  generateFloor();
  updateFormBar();
  updateAnchorBar();
  updateClassTheme();
  // 短局模式：恢复倒计时到锚点设置时的剩余秒数
  if(window.ShortMode&&typeof a.shortRemaining==='number'){
    ShortMode._remaining=a.shortRemaining;
    ShortMode._lastTickAt=Date.now();
    try{ShortMode.updateTimerDom&&ShortMode.updateTimerDom();}catch(e){}
  }
  game._deathEpPenalty=0;
  game._consecutiveDeaths=0;
  addMsg('// 记忆回滚至 '+a.anchorName+' (-'+epPenalty+'EP) //');
  render();
}

// 短局模式：玩家在死亡 overlay 选择「结束本局并查看战绩」
function endShortRunFromDeath(){
  if(game._deathTimer){clearInterval(game._deathTimer);game._deathTimer=null;}
  var overlay=document.getElementById('death-overlay');
  if(overlay)overlay.classList.remove('active');
  game._triggerDeathActive=false;
  game._consecutiveDeaths=0;
  try{if(typeof endRunSave==='function')endRunSave();}catch(e){}
  try{if(window.ShortMode&&typeof ShortMode.forceFinale==='function')ShortMode.forceFinale('death');}catch(e){}
}

