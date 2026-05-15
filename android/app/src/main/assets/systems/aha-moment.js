// ================================================================
// 啊哈时刻 — 首次附身电影化演出（4 幕编排）
// ================================================================
var _ahaTimers=[];
var _ahaSkipped=false;
var _ahaFinished=false;

function _ahaT(fn,delay){var id=setTimeout(fn,delay);_ahaTimers.push(id);return id;}
function _ahaClearAll(){_ahaTimers.forEach(function(id){clearTimeout(id);});_ahaTimers=[];}

function playFirstPossessAha(player,target,oldStats,newStats,onComplete){
  _ahaSkipped=false;_ahaFinished=false;_ahaTimers=[];

  var stage=document.createElement('div');
  stage.id='aha-stage';
  stage.className='aha-stage';
  document.body.appendChild(stage);

  // 立即生效部分：背景渐暗 + 屏幕震动 + 粒子
  requestAnimationFrame(function(){stage.classList.add('aha-stage-on');});
  try{game._shakeFrames=8;}catch(e){}
  try{playLoudSub(0.4);}catch(e){}
  try{playReverseSwell(220,0.6);}catch(e){}
  try{spawnPossessEffect(target.x||player.x,target.y||player.y,true);}catch(e){}

  // 幕二 · 觉醒（800ms）
  _ahaT(function(){
    if(_ahaSkipped)return;
    try{playChoirStab([165,220,330],0.8);}catch(e){}
    var wrap=document.createElement('div');
    wrap.className='aha-act2';
    var awaken=document.createElement('div');
    awaken.className='aha-awaken';
    awaken.textContent='◈ 意 识 觉 醒 ◈';
    var becoming=document.createElement('div');
    becoming.className='aha-becoming';
    becoming.textContent='你 现 在 是 — '+newStats.name;
    var formColor=(window.monsterTemplates&&monsterTemplates[newStats.type]&&monsterTemplates[newStats.type].color)||'#00ffd0';
    becoming.style.color=formColor;
    becoming.style.textShadow='0 0 14px '+formColor;
    wrap.appendChild(awaken);wrap.appendChild(becoming);
    stage.appendChild(wrap);
    requestAnimationFrame(function(){wrap.classList.add('aha-on');});
  },800);

  // 幕三 · 凝视（1800ms）属性飞跃面板
  _ahaT(function(){
    if(_ahaSkipped)return;
    var act2=stage.querySelector('.aha-act2');
    if(act2)act2.classList.add('aha-fade-out');
    var panel=_ahaBuildStatPanel(oldStats,newStats);
    stage.appendChild(panel);
    requestAnimationFrame(function(){panel.classList.add('aha-on');});
  },1800);

  // 幕四 · 启示（2900ms）
  _ahaT(function(){
    if(_ahaSkipped)return;
    _ahaShowFinale(stage,target,oldStats,newStats,onComplete);
  },2900);
}

function _ahaBuildStatPanel(oldStats,newStats){
  var panel=document.createElement('div');
  panel.className='aha-stats-panel';
  var title=document.createElement('div');
  title.className='aha-stats-title';
  title.textContent='◤ 属 性 飞 跃 ◢';
  panel.appendChild(title);

  var rows=[
    {label:'HP',o:oldStats.hp,n:newStats.hp,color:'#ff5577'},
    {label:'ATK',o:oldStats.atk,n:newStats.atk,color:'#ffaa44'},
    {label:'DEF',o:oldStats.def,n:newStats.def,color:'#44aaff'}
  ];
  rows.forEach(function(r,i){
    var diff=r.n-r.o;
    var sign=diff>0?'↑':(diff<0?'↓':'·');
    var diffColor=diff>0?'#00ff90':(diff<0?'#ff4466':'#888');
    var row=document.createElement('div');
    row.className='aha-stat-row';
    row.style.animationDelay=(i*150)+'ms';
    row.innerHTML='<span class="aha-stat-label" style="color:'+r.color+'">'+r.label+'</span>'+
      '<span class="aha-stat-old">'+r.o+'</span>'+
      '<span class="aha-stat-arrow">→</span>'+
      '<span class="aha-stat-new">'+r.n+'</span>'+
      '<span class="aha-stat-diff" style="color:'+diffColor+'">'+sign+(diff>0?'+':'')+diff+'</span>';
    panel.appendChild(row);
  });

  if(newStats.traits&&newStats.traits.length>0){
    var traitsBox=document.createElement('div');
    traitsBox.className='aha-traits-box';
    var tlabel=document.createElement('div');
    tlabel.className='aha-traits-label';
    tlabel.textContent='+ 继 承 特 性';
    traitsBox.appendChild(tlabel);
    newStats.traits.forEach(function(tr,i){
      var chip=document.createElement('span');
      chip.className='aha-trait-chip';
      chip.textContent=(window.traitNames&&traitNames[tr])||tr;
      chip.style.animationDelay=(500+i*120)+'ms';
      traitsBox.appendChild(chip);
    });
    panel.appendChild(traitsBox);
  }
  var rating=document.createElement('div');
  rating.style.cssText='margin-top:12px;padding-top:8px;border-top:1px solid rgba(0,255,208,0.2);text-align:center;font-size:13px;color:#00ffd0;font-weight:700;letter-spacing:2px;text-shadow:0 0 8px rgba(0,255,208,0.5);opacity:0;animation:ahaRowIn 0.4s ease forwards 0.8s';
  rating.textContent='战斗评级：显著提升';
  panel.appendChild(rating);
  return panel;
}

function _ahaShowFinale(stage,target,oldStats,newStats,onComplete){
  var act3=stage.querySelector('.aha-stats-panel');
  if(act3)act3.classList.add('aha-fade-out');

  _ahaT(function(){
    if(_ahaFinished)return;
    var finale=document.createElement('div');
    finale.className='aha-finale';
    var main=document.createElement('div');
    main.className='aha-line-main';
    main.textContent='这就是「你也是我」的核心 —';
    var sub=document.createElement('div');
    sub.className='aha-line-sub';
    sub.textContent='夺取身体，成为更强者。';
    var cta=document.createElement('button');
    cta.className='aha-cta-btn';
    cta.textContent='继 续 探 索';
    cta.onclick=function(){_ahaCleanup(stage,onComplete);};
    finale.appendChild(main);finale.appendChild(sub);finale.appendChild(cta);
    stage.appendChild(finale);
    requestAnimationFrame(function(){finale.classList.add('aha-on');});
  },400);
}

function _ahaJumpToFinale(stage,target,oldStats,newStats,onComplete){
  if(_ahaSkipped||_ahaFinished)return;
  _ahaSkipped=true;
  _ahaClearAll();
  // 移除已渲染的中间幕
  var act2=stage.querySelector('.aha-act2');if(act2)act2.remove();
  var act3=stage.querySelector('.aha-stats-panel');if(act3)act3.remove();
  _ahaShowFinale(stage,target,oldStats,newStats,onComplete);
}

function _ahaCleanup(stage,onComplete){
  if(_ahaFinished)return;
  _ahaFinished=true;
  _ahaClearAll();
  stage.classList.add('aha-stage-out');
  setTimeout(function(){
    if(stage&&stage.parentNode)stage.remove();
    try{onComplete&&onComplete();}catch(e){}
  },350);
}
