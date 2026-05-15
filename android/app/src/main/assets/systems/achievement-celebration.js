// ================================================================
// 成就解锁庆祝动画 — 全屏电影化演出
// ================================================================
(function(){
var _queue=[],_busy=false;

function celebrateAchievement(def){
  if(!def)return;
  _queue.push(def);
  if(!_busy)_consume();
}

function _consume(){
  if(_queue.length===0){_busy=false;return;}
  _busy=true;
  var def=_queue.shift();
  _play(def,function(){setTimeout(_consume,200);});
}

function _play(def,done){
  var stage=document.createElement('div');
  stage.className='ach-stage';
  stage.innerHTML=
    '<div class="ach-backdrop"></div>'+
    '<div class="ach-rays"></div>'+
    '<div class="ach-particles">'+_particlesHtml()+'</div>'+
    '<div class="ach-card">'+
      '<div class="ach-ribbon">成 就 解 锁</div>'+
      '<div class="ach-badge"><span class="ach-icon">'+(def.icon||'🏆')+'</span></div>'+
      '<div class="ach-name">'+_esc(def.name||'未知成就')+'</div>'+
      '<div class="ach-desc">'+_esc(def.desc||'')+'</div>'+
      '<div class="ach-actions">'+
        '<button class="ach-btn ach-btn-share" onclick="shareAchievementPoster('+JSON.stringify(def).replace(/"/g,'&quot;')+')">📷 生成海报</button>'+
        '<button class="ach-btn ach-btn-close">继续</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(stage);

  // 触发屏幕震动
  try{if(window.game)game._shakeFrames=Math.max(game._shakeFrames||0,6);}catch(e){}
  // 触发音效
  try{sounds.achievement&&sounds.achievement();}catch(e){}

  // 入场动画
  requestAnimationFrame(function(){stage.classList.add('show');});

  var closed=false;
  function close(){
    if(closed)return;closed=true;
    stage.classList.remove('show');
    stage.classList.add('hide');
    setTimeout(function(){if(stage.parentNode)stage.parentNode.removeChild(stage);done&&done();},420);
  }
  stage.querySelector('.ach-btn-close').onclick=close;
  // 自动关闭
  setTimeout(close,4500);
}

function _particlesHtml(){
  var html='';
  for(var i=0;i<14;i++){
    var a=Math.random()*360,d=160+Math.random()*240,sz=4+Math.random()*6;
    html+='<i class="ach-spark" style="--ang:'+a+'deg;--dist:'+d+'px;--sz:'+sz+'px;--delay:'+(Math.random()*0.3)+'s"></i>';
  }
  return html;
}

function _esc(s){return String(s).replace(/[&<>]/g,function(c){return c==='&'?'&amp;':c==='<'?'&lt;':'&gt;';});}

window.celebrateAchievement=celebrateAchievement;
})();
