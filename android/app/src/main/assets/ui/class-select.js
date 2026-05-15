let _csSelectedClass='titan';
let _csAnimFrame=null;
let _csHoldTimer=null;
let _csHoldStart=0;
const CS_HOLD_DURATION=2000; // 2秒

function showClassSelect(){
  const el=document.getElementById('class-select-screen');
  el.classList.add('active');
  selectClass('titan');
}

function selectClass(cls){
  _csSelectedClass=cls;
  const cc=getClassColors(cls);
  const locked=isDLCClass(cls)&&!isDLCUnlocked(cls);
  // 更新标签
  ['titan','ghost','swarm','blood','mech'].forEach(c=>{
    const tab=document.getElementById('tab-'+c);
    if(!tab)return;
    tab.classList.toggle('active',c===cls);
    document.getElementById('tab-status-'+c).textContent=c===cls?(locked?'锁定':'选中'):'';
    var lockEl=document.getElementById('tab-lock-'+c);
    if(lockEl)lockEl.style.display=(isDLCClass(c)&&!isDLCUnlocked(c))?'':'none';
  });
  // 更新中央展示
  document.getElementById('cs-class-name').textContent=cc.icon+' '+cc.name;
  document.getElementById('cs-class-name').style.color=cc.primary;
  document.getElementById('cs-class-quote').textContent=classDescriptions[cls].quote;
  // canvas边框色
  const cvs=document.getElementById('class-preview-canvas');
  cvs.style.borderColor=cc.primary;
  // 长按条颜色
  document.getElementById('hb-fill').style.background=cc.primary;
  document.getElementById('hb-fill').style.width='0%';
  // DLC锁定时显示商城引导
  var holdArea=document.getElementById('confirm-hold-area');
  var dlcHint=document.getElementById('dlc-lock-hint');
  if(!dlcHint){
    dlcHint=document.createElement('div');dlcHint.id='dlc-lock-hint';
    dlcHint.style.cssText='text-align:center;padding:10px;display:none';
    dlcHint.innerHTML='<div style="color:#ff8800;font-size:.85em;margin-bottom:8px">🔒 DLC 职业 — 前往商城解锁</div><button class="ca-btn" onclick="showDLCShop()" style="font-size:.8em">⭐ 打开商城</button>';
    holdArea.parentNode.insertBefore(dlcHint,holdArea.nextSibling);
  }
  if(locked){holdArea.style.display='none';dlcHint.style.display='block';}
  else{holdArea.style.display='';dlcHint.style.display='none';}
  // 更新面板
  updateCSStats(cls);
  updateCSMechanics(cls);
  // 启动预览动画
  startCSPreviewAnim(cls);
}

function updateCSStats(cls){
  const base=classBaseStats[cls];
  const cc=getClassColors(cls);
  const stats=[
    {label:'HP',val:base.hp,max:200,color:cc.primary},
    {label:'ATK',val:base.atk,max:16,color:'#ff006e'},
    {label:'DEF',val:base.def,max:14,color:'#8844ff'},
    {label:'MOV',val:cls==='ghost'?5:cls==='swarm'?4:cls==='blood'?4:cls==='mech'?3:3,max:6,color:'#ff0'},
    {label:'VIS',val:base.fogRadius,max:8,color:'#00ffd0'}
  ];
  const allClasses=['titan','ghost','swarm','blood','mech'];
  const bestOf=(key)=>{
    const vals={};allClasses.forEach(c=>{vals[c]=classBaseStats[c][key];});
    const mx=Math.max(...Object.values(vals));
    return vals[cls]===mx?'最高':'';
  };
  const movVals={titan:3,ghost:5,swarm:4,blood:4,mech:3};
  let html='';
  stats.forEach(s=>{
    let note='';
    if(s.label==='HP')note=bestOf('hp');
    else if(s.label==='ATK')note=bestOf('atk');
    else if(s.label==='DEF')note=bestOf('def');
    else if(s.label==='MOV'){const mx=Math.max(...Object.values(movVals));note=movVals[cls]===mx?'最快':movVals[cls]===Math.min(...Object.values(movVals))?'最慢':'';}
    else if(s.label==='VIS')note=bestOf('fogRadius');
    html+='<div class="stat-row"><span class="sr-label">'+s.label+'</span><div class="sr-bar"><div class="sr-fill" style="width:'+(s.val/s.max*100)+'%;background:'+s.color+'"></div></div><span class="sr-val">'+s.val+'</span><span class="sr-note">'+(note?'['+note+']':'')+'</span></div>';
  });
  html+='<div style="margin-top:6px;font-size:.7em;color:#666">难度: '+classDescriptions[cls].difficulty+'</div>';
  html+='<div style="font-size:.7em;color:#666">风格: '+classDescriptions[cls].style+'</div>';
  if(classDescriptions[cls].tags){
    html+='<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">';
    classDescriptions[cls].tags.forEach(function(tag){
      html+='<span style="font-size:.65em;background:'+cc.primary+'22;border:1px solid '+cc.primary+'66;color:'+cc.primary+';padding:2px 6px;border-radius:8px">'+tag+'</span>';
    });
    html+='</div>';
  }
  document.getElementById('cs-stats-content').innerHTML=html;
}

function updateCSMechanics(cls){
  const cc=classColors[cls];
  let html='';
  classDescriptions[cls].mechanics.forEach(m=>{
    html+='<div class="mech-item" style="border-left-color:'+cc.primary+'"><div class="mi-name" style="color:'+cc.highlight+'">▶ '+m.name+'</div><div class="mi-desc">'+m.desc+'</div></div>';
  });
  document.getElementById('cs-mech-content').innerHTML=html;
}

// 预览canvas动画
function startCSPreviewAnim(cls){
  if(_csAnimFrame)cancelAnimationFrame(_csAnimFrame);
  const cvs=document.getElementById('class-preview-canvas');
  const c=cvs.getContext('2d');
  const w=cvs.width,h=cvs.height;
  const cc=classColors[cls];
  function drawFrame(){
    c.clearRect(0,0,w,h);
    // 背景
    c.fillStyle=cc.bg;c.fillRect(0,0,w,h);
    const cx=w/2,cy=h/2-10;
    const breathe=1+Math.sin(Date.now()/300)*0.06;
    const r=30*breathe;
    c.save();
    c.shadowColor=cc.glow;c.shadowBlur=12;
    if(cls==='titan'){
      // 岩石巨人（Dota1 Tiny 风格）
      c.shadowBlur=0;
      const bW=r*1.6,bH=r*1.4;
      const bTop=cy-bH*0.35,bBot=cy+bH*0.45;
      // 石腿
      c.fillStyle='#556b7a';
      c.fillRect(cx-bW*0.2,bBot-1,bW*0.15,r*0.4);
      c.fillRect(cx+bW*0.05,bBot-1,bW*0.15,r*0.4);
      // 石臂（粗壮）
      c.fillStyle='#6a7d8e';
      c.save();c.translate(cx-bW*0.42,cy-bH*0.08);c.rotate(-0.35);
      c.fillRect(-r*0.55,-r*0.16,r*0.55,r*0.32);
      c.beginPath();c.arc(-r*0.55,0,r*0.2,0,Math.PI*2);c.fill(); // 左拳
      c.restore();
      c.save();c.translate(cx+bW*0.42,cy-bH*0.08);c.rotate(0.35);
      c.fillRect(0,-r*0.16,r*0.55,r*0.32);
      c.beginPath();c.arc(r*0.55,0,r*0.2,0,Math.PI*2);c.fill(); // 右拳
      c.restore();
      // 身体（梯形岩石）
      const bodyGrad=c.createLinearGradient(cx,bTop,cx,bBot);
      bodyGrad.addColorStop(0,'#7a8e9e');bodyGrad.addColorStop(0.5,'#6a7d8e');bodyGrad.addColorStop(1,'#4a5d6e');
      c.fillStyle=bodyGrad;
      c.beginPath();c.moveTo(cx-bW*0.4,bTop+bH*0.12);c.lineTo(cx+bW*0.4,bTop+bH*0.12);
      c.lineTo(cx+bW*0.28,bBot);c.lineTo(cx-bW*0.28,bBot);c.closePath();c.fill();
      // 肩甲石板
      c.fillStyle='#728598';
      c.beginPath();c.moveTo(cx-bW*0.45,bTop+bH*0.06);c.lineTo(cx-bW*0.08,bTop+bH*0.03);
      c.lineTo(cx-bW*0.1,bTop+bH*0.22);c.lineTo(cx-bW*0.42,bTop+bH*0.25);c.closePath();c.fill();
      c.beginPath();c.moveTo(cx+bW*0.45,bTop+bH*0.06);c.lineTo(cx+bW*0.08,bTop+bH*0.03);
      c.lineTo(cx+bW*0.1,bTop+bH*0.22);c.lineTo(cx+bW*0.42,bTop+bH*0.25);c.closePath();c.fill();
      // 石板裂缝
      c.strokeStyle='rgba(15,25,35,0.4)';c.lineWidth=1;
      c.beginPath();c.moveTo(cx-bW*0.3,bTop+bH*0.25);c.lineTo(cx+bW*0.32,bTop+bH*0.27);c.stroke();
      c.beginPath();c.moveTo(cx-bW*0.05,bTop+bH*0.12);c.lineTo(cx-bW*0.02,bTop+bH*0.5);c.stroke();
      // 青苔
      c.fillStyle='rgba(80,140,70,0.5)';
      c.beginPath();c.ellipse(cx-bW*0.18,bTop+bH*0.26,bW*0.07,bH*0.02,0.2,0,Math.PI*2);c.fill();
      c.beginPath();c.ellipse(cx+bW*0.12,bTop+bH*0.27,bW*0.05,bH*0.015,0,0,Math.PI*2);c.fill();
      // 头部（小石头）
      const headR=r*0.32;const headY=bTop+bH*0.02;
      const hGrad=c.createRadialGradient(cx-headR*0.2,headY-headR*0.2,headR*0.1,cx,headY,headR);
      hGrad.addColorStop(0,'#8ea8b8');hGrad.addColorStop(0.6,'#6a7d8e');hGrad.addColorStop(1,'#4a5d6e');
      c.fillStyle=hGrad;c.beginPath();c.arc(cx,headY,headR,0,Math.PI*2);c.fill();
      // 荧光眼
      c.shadowColor=cc.glow;c.shadowBlur=6;c.fillStyle=cc.glow;
      c.beginPath();c.ellipse(cx-headR*0.35,headY+headR*0.1,headR*0.18,headR*0.1,0,0,Math.PI*2);c.fill();
      c.beginPath();c.ellipse(cx+headR*0.35,headY+headR*0.1,headR*0.18,headR*0.1,0,0,Math.PI*2);c.fill();
      c.shadowBlur=0;
      // 外轮廓荧光
      c.strokeStyle=cc.glow;c.lineWidth=1.5;c.shadowColor=cc.glow;c.shadowBlur=8;c.globalAlpha=0.4;
      c.beginPath();c.moveTo(cx-bW*0.4,bTop+bH*0.12);c.lineTo(cx+bW*0.4,bTop+bH*0.12);
      c.lineTo(cx+bW*0.28,bBot);c.lineTo(cx-bW*0.28,bBot);c.closePath();c.stroke();
      c.globalAlpha=1;c.shadowBlur=0;
    }else if(cls==='ghost'){
      // 半透明圆
      c.globalAlpha=0.6+Math.sin(Date.now()/600)*0.2;
      c.fillStyle=cc.primary;
      c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
      // 尾迹
      c.fillStyle='rgba(170,68,170,0.2)';
      c.beginPath();c.arc(cx-r*0.3,cy+r*0.5,r*0.5,0,Math.PI*2);c.fill();
      c.globalAlpha=1;c.shadowBlur=0;
      c.fillStyle='#fff';c.beginPath();c.arc(cx,cy,r*0.25,0,Math.PI*2);c.fill();
    }else{
      // 虫群多点簇
      c.fillStyle=cc.primary;
      c.beginPath();c.arc(cx,cy,r*0.8,0,Math.PI*2);c.fill();
      for(let i=0;i<5;i++){
        const a=i*Math.PI*2/5+Date.now()/800;
        c.beginPath();c.arc(cx+Math.cos(a)*r*0.7,cy+Math.sin(a)*r*0.7,r*0.22,0,Math.PI*2);c.fill();
      }
      c.shadowBlur=0;c.fillStyle='#fff';
      c.beginPath();c.arc(cx,cy,r*0.2,0,Math.PI*2);c.fill();
      // 分身环绕
      c.fillStyle='rgba(68,170,68,0.5)';
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3+Date.now()/500;
        c.beginPath();c.arc(cx+Math.cos(a)*r*1.5,cy+Math.sin(a)*r*1.5,3,0,Math.PI*2);c.fill();
      }
    }
    c.restore();
    // 职业名底部
    c.fillStyle=cc.primary;c.font='bold 12px Consolas,monospace';c.textAlign='center';
    c.fillText(classColors[cls].name,cx,h-16);
    _csAnimFrame=requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

function stopCSPreviewAnim(){
  if(_csAnimFrame){cancelAnimationFrame(_csAnimFrame);_csAnimFrame=null;}
}

// 长按确认
function startClassHold(){
  if(_csHoldTimer){cancelAnimationFrame(_csHoldTimer);_csHoldTimer=null;}
  _csHoldStart=Date.now();
  const fill=document.getElementById('hb-fill');
  if(!fill){console.error('hb-fill not found');return;}
  function tick(){
    const elapsed=Date.now()-_csHoldStart;
    const pct=Math.min(100,elapsed/CS_HOLD_DURATION*100);
    fill.style.width=pct+'%';
    if(elapsed>=CS_HOLD_DURATION){
      confirmClassAndStart(_csSelectedClass);
      return;
    }
    _csHoldTimer=requestAnimationFrame(tick);
  }
  tick();
}

function endClassHold(){
  if(_csHoldTimer){cancelAnimationFrame(_csHoldTimer);_csHoldTimer=null;}
  document.getElementById('hb-fill').style.width='0%';
}

function confirmClassAndStart(cls){
  if(isDLCClass(cls)&&!isDLCUnlocked(cls)){addMsg('⚠ 该职业需要在商城解锁');return;}
  try{
    endClassHold();
    stopCSPreviewAnim();
    const base=classBaseStats[cls];
    if(!base){console.error('classBaseStats not found for',cls);return;}
    const p=game.player;
    p.playerClass=cls;
    p.hp=base.hp;p.maxHp=base.maxHp;
    p.atk=base.atk;p.def=base.def;
    p.classUnlocked={swarm:true,titan:true,ghost:true,blood:isDLCUnlocked('blood'),mech:isDLCUnlocked('mech')};
    p.armor=cls==='titan'?50:cls==='mech'?30:0;
    p.stealth=cls==='ghost'?50:0;
    p.stealthActive=false;
    p.swarms=[];
    p._bloodMoon=false;p._mechShield=0;
    // 成就起始加成
    const bonusApplied=applyAchievementBonuses(p);
    // 元进度（残响圣坛）解锁的起始加成
    var metaApplied = [];
    try{ if(window.MetaProgress) metaApplied = MetaProgress.applyBonuses(p, cls); }catch(e){}
    // 元进度起始词条/形态需要的派生效果
    try{
      if(p._metaForm_swarmKing && cls==='swarm'){
        // 起始 +1 分身
        p.swarms = p.swarms || [];
        p.swarms.push({hp:Math.floor(p.maxHp*0.2),atk:Math.floor(p.atk*0.5),duration:99});
      }
    }catch(e){}
    // 更新初始形态槽（使用加成后的数值）
    game.forms[0]={name:'寄生体',type:'human',hp:p.hp,maxHp:p.maxHp,atk:p.atk,def:p.def,traits:[],icon:'👤',color:classColors[cls].primary};
    if(game.forms.length<2){game.forms.push(null);game._deadForms.push(false);}
    // 更新锚点初始
    game.anchor.player.playerClass=cls;
    game.anchor.player.hp=p.hp;game.anchor.player.maxHp=p.maxHp;
    game.anchor.player.atk=p.atk;game.anchor.player.def=p.def;
    game.anchor.player.armor=p.armor;game.anchor.player.stealth=p.stealth;
    game.anchor.player.stealthActive=false;
    game.anchor.player.swarms=[];
    game.anchor.player.classUnlocked=JSON.parse(JSON.stringify(p.classUnlocked));
    game.anchor.player.storyPhase=p.storyPhase;
    game.anchor.player.storyFlags=JSON.parse(JSON.stringify(p.storyFlags));
    game.anchor.forms=JSON.parse(JSON.stringify(game.forms));
    // 切换界面
    document.getElementById('class-select-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    try{if(typeof initSporeParticles==='function')initSporeParticles();}catch(e){}
    addMsg('你苏醒了...选择了'+classColors[cls].icon+' '+classColors[cls].name+'之路');
    addMsg('只能通过附身其他生物来生存');
    if(bonusApplied.length>0)addMsg('<span style="color:#ff0">🏆 成就加成: '+bonusApplied.join(', ')+'</span>');
    if(metaApplied.length>0)addMsg('<span style="color:#a55cff">⛯ 残响加成: '+metaApplied.join('、')+'</span>');
    // === 深渊降临音效 sting ===
    // 先停掉标题界面的轻柔 BGM，让冲击音独占声场
    try{ if(typeof stopBGMusic==='function') stopBGMusic(); }catch(e){}
    // 1. 反向上扬膨胀（吸入感）→ 2. 不和谐低音合唱刺击 → 3. 重低音坠落
    try{
      if(typeof playReverseSwell==='function') playReverseSwell(70, 1.3);
      setTimeout(function(){
        try{
          if(typeof playChoirStab==='function') playChoirStab([55, 58.27, 87.31, 110], 1.1);
          if(typeof playMembraneStretch==='function') playMembraneStretch(0.7);
        }catch(e){}
      }, 750);
      setTimeout(function(){
        try{ if(typeof playSubDrop==='function') playSubDrop(1.8); }catch(e){}
      }, 1050);
    }catch(e){}
    // 启动背景音乐（延迟到 sting 收尾后再淡入，避免和冲击音混叠）
    setTimeout(function(){
      try{if(typeof startBGMusic==='function')startBGMusic();}catch(e){}
    }, 1500);
    // 强制刷新形态栏
    game._lastFormSig=null;
    try{updateFormBar();}catch(e){}
    init();
    if(typeof applyDailyModifier==='function')applyDailyModifier();
    // 重玩兜底：init 中任一步抛错都不影响顶栏刷新
    try{render();}catch(e){}
    try{updateFormBar();}catch(e){}
    // === 强制覆写 top-bar DOM（防止 render 因 tiles 为空提前 return 导致上一局数据残留） ===
    try{
      var _p=game.player,_cc=classColors[cls]||{name:cls,icon:'🧬',primary:'#0fa'};
      var _set=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
      _set('floor-num',String(game.floor||1));
      _set('floor-num2',String(game.floor||1));
      _set('floor-name',(typeof getFloorName==='function')?getFloorName():'废弃实验室');
      _set('atk-top',String(_p.atk||0));
      _set('def-top',String(_p.def||0));
      _set('hp-text',(_p.hp||0)+'/'+(_p.maxHp||0));
      _set('pol-text',(_p.pollution||0)+'%');
      _set('poss-text','--');
      _set('evo-bottom',String(_p.evoPoints||0));
      _set('explore-pct','0%');
      _set('class-name-top',(_cc.icon||'🧬')+' '+(_cc.name||cls));
      _set('class-resource','');
      var _hf=document.getElementById('hp-fill');
      if(_hf){var _pct=_p.maxHp?Math.max(0,Math.min(100,(_p.hp/_p.maxHp)*100)):0;_hf.style.width=_pct+'%';}
      // 清理上一局可能残留的紧急状态视觉（vignette / shake / timer 闪烁）
      var _vg=document.getElementById('short-urgency-vignette');if(_vg)_vg.remove();
      var _gs=document.getElementById('game-screen');if(_gs)_gs.classList.remove('shake-soft','shake-hard');
      var _st=document.getElementById('short-timer');
      if(_st){_st.classList.remove('st-warn','st-danger','st-critical');_st.classList.add('st-safe');}
    }catch(e){console.error('forceRefreshTopBar error:',e);}
    // 延迟兜底：100ms / 500ms 后再强写顶栏 + 触发 render，捕获任何异步覆盖
    try{
      var _setLater=function(){
        try{
          var _p2=game.player;if(!_p2)return;
          var _cc2=classColors[_p2.playerClass]||{name:'',icon:'🧬',primary:'#0fa'};
          var _s=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
          _s('floor-num',String(game.floor||1));
          _s('floor-num2',String(game.floor||1));
          _s('floor-name',(typeof getFloorName==='function')?getFloorName():'废弃实验室');
          _s('atk-top',String(_p2.atk||0));
          _s('def-top',String(_p2.def||0));
          _s('hp-text',(_p2.hp||0)+'/'+(_p2.maxHp||0));
          _s('pol-text',(_p2.pollution||0)+'%');
          _s('evo-bottom',String(_p2.evoPoints||0));
          _s('class-name-top',(_cc2.icon||'🧬')+' '+(_cc2.name||_p2.playerClass||''));
          var _hf2=document.getElementById('hp-fill');
          if(_hf2){var _pct2=_p2.maxHp?Math.max(0,Math.min(100,(_p2.hp/_p2.maxHp)*100)):0;_hf2.style.width=_pct2+'%';}
          window._renderDirty=true;
          try{render();}catch(e){}
        }catch(e){}
      };
      setTimeout(_setLater,100);
      setTimeout(_setLater,500);
    }catch(e){}
  }catch(e){
    console.error('Error in confirmClassAndStart:',e);
    document.getElementById('msg-panel').innerHTML='<div class="msg-toast" style="color:#f66">启动失败，请重启应用</div>';
  }
}

function randomClassSelect(){
  const available=['titan','ghost','swarm'];
  if(isDLCUnlocked('blood'))available.push('blood');
  if(isDLCUnlocked('mech'))available.push('mech');
  const rnd=available[Math.floor(Math.random()*available.length)];
  selectClass(rnd);
}

function toggleCompareMode(){
  const el=document.getElementById('compare-mode');
  const isOn=el.classList.toggle('active');
  if(isOn)renderCompareTable();
}

function renderCompareTable(){
  const classes=['titan','ghost','swarm','blood','mech'];
  const movMap={titan:3,ghost:5,swarm:4,blood:4,mech:3};
  let html='<table class="cmp-table"><tr><th></th>';
  classes.forEach(c=>html+='<th style="color:'+getClassColors(c).primary+'">'+getClassColors(c).icon+' '+getClassColors(c).name+'</th>');
  html+='</tr>';
  // HP
  const hpVals=classes.map(c=>classBaseStats[c].hp);const hpMax=Math.max(...hpVals);
  html+='<tr><td style="color:#888">HP</td>';
  classes.forEach((c,i)=>html+='<td'+(hpVals[i]===hpMax?' class="cmp-best"':'')+'>'+hpVals[i]+'</td>');
  html+='</tr>';
  // ATK
  const atkVals=classes.map(c=>classBaseStats[c].atk);const atkMax=Math.max(...atkVals);
  html+='<tr><td style="color:#888">ATK</td>';
  classes.forEach((c,i)=>html+='<td'+(atkVals[i]===atkMax?' class="cmp-best"':'')+'>'+atkVals[i]+'</td>');
  html+='</tr>';
  // DEF
  const defVals=classes.map(c=>classBaseStats[c].def);const defMax=Math.max(...defVals);
  html+='<tr><td style="color:#888">DEF</td>';
  classes.forEach((c,i)=>html+='<td'+(defVals[i]===defMax?' class="cmp-best"':'')+'>'+defVals[i]+'</td>');
  html+='</tr>';
  // MOV
  const movVals=classes.map(c=>movMap[c]);const movMax=Math.max(...movVals);
  html+='<tr><td style="color:#888">移动</td>';
  classes.forEach((c,i)=>html+='<td'+(movVals[i]===movMax?' class="cmp-best"':'')+'>'+movVals[i]+'格</td>');
  html+='</tr>';
  // VIS
  const visVals=classes.map(c=>classBaseStats[c].fogRadius);const visMax=Math.max(...visVals);
  html+='<tr><td style="color:#888">视野</td>';
  classes.forEach((c,i)=>html+='<td'+(visVals[i]===visMax?' class="cmp-best"':'')+'>'+visVals[i]+'格</td>');
  html+='</tr>';
  // 分隔
  html+='<tr><td colspan="4" style="border-top:1px solid #333"></td></tr>';
  // 机制对比
  html+='<tr><td style="color:#888">伤害</td><td>碾压/爆发</td><td>背刺/闪避</td><td>数量/消耗</td></tr>';
  html+='<tr><td style="color:#888">生存</td><td>★★★★★</td><td>★★★☆☆</td><td>★★★★☆</td></tr>';
  html+='<tr><td style="color:#888">操作</td><td>★★☆☆☆</td><td>★★★★☆</td><td>★★★☆☆</td></tr>';
  html+='<tr><td style="color:#888">后期</td><td>★★★★☆</td><td>★★★★★</td><td>★★★★★</td></tr>';
  html+='</table>';
  html+='<div style="margin-top:10px;font-size:.75em;color:#666;text-align:center">推荐新手: 🪨泰坦 | 推荐高手: 👻幽灵</div>';
  document.getElementById('compare-content').innerHTML=html;
}
