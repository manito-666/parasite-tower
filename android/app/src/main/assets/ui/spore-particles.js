// ================================================================
// 孢子粒子系统 — Canvas 动态漂浮（增强版）
// ================================================================
var _sporeInited=false;
function initSporeParticles(){
  if(_sporeInited)return;
  _sporeInited=true;
  var canvas=document.getElementById('spore-layer');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  var w,h;
  function resize(){
    var gs=document.getElementById('game-screen');
    w=canvas.width=(gs?gs.clientWidth:window.innerWidth);
    h=canvas.height=(gs?gs.clientHeight:window.innerHeight);
  }
  resize();
  window.addEventListener('resize',resize);

  // 预渲染精灵图（避免每帧 createRadialGradient）
  var spriteCache=[];
  function makeSprite(size,hue){
    var d=Math.ceil(size*6)+2;
    var c=document.createElement('canvas');
    c.width=d;c.height=d;
    var cx=c.getContext('2d');
    var half=d/2;
    var grad=cx.createRadialGradient(half,half,0,half,half,size*3);
    grad.addColorStop(0,'hsla('+hue+',100%,70%,0.8)');
    grad.addColorStop(0.5,'hsla('+hue+',100%,50%,0.4)');
    grad.addColorStop(1,'transparent');
    cx.fillStyle=grad;
    cx.fillRect(0,0,d,d);
    cx.beginPath();
    cx.arc(half,half,size,0,6.2832);
    cx.fillStyle='hsla('+hue+',100%,85%,0.9)';
    cx.fill();
    return c;
  }

  var COUNT=30;
  var spores=[];
  for(var i=0;i<COUNT;i++){
    var sz=Math.random()*3+1;
    var hu=Math.random()*60+160;
    spores.push({
      x:Math.random()*w,
      y:Math.random()*h,
      size:sz,
      speedX:(Math.random()-0.5)*0.4,
      speedY:-Math.random()*0.25-0.08,
      opacity:Math.random()*0.4+0.1,
      twinkle:Math.random()*Math.PI*2,
      sprite:makeSprite(sz,hu)
    });
    spriteCache.push(spores[i].sprite);
  }

  var running=true;
  function animate(){
    if(!running)return;
    if(document.hidden){requestAnimationFrame(animate);return;}
    ctx.clearRect(0,0,w,h);
    for(var i=0;i<COUNT;i++){
      var s=spores[i];
      s.x+=s.speedX+Math.sin(s.twinkle)*0.2;
      s.y+=s.speedY;
      s.twinkle+=0.015;
      if(s.y<-10){s.y=h+10;s.x=Math.random()*w;}
      if(s.x<-10)s.x=w+10;
      if(s.x>w+10)s.x=-10;
      var tOp=s.opacity*(0.7+Math.sin(s.twinkle*3)*0.3);
      ctx.globalAlpha=tOp;
      var d=s.sprite.width;
      ctx.drawImage(s.sprite,s.x-d/2,s.y-d/2);
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(animate);
  }
  animate();

  document.addEventListener('visibilitychange',function(){
    if(!document.hidden&&!running){running=true;animate();}
  });

  initAmbientLight();
}

// ================================================================
// 动态环境光照系统（纯 CSS animation，GPU 合成）
// ================================================================
function initAmbientLight(){
  var overlay=document.createElement('div');
  overlay.id='ambient-light';
  overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:100;background:radial-gradient(ellipse at 30% 20%,rgba(120,240,215,0.025) 0%,rgba(180,85,255,0.01) 30%,transparent 60%);animation:ambientDrift 20s ease-in-out infinite;';
  document.body.appendChild(overlay);
}
