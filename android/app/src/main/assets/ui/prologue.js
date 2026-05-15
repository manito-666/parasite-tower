// ================================================================
// 序章系统
// ================================================================
// ========== 序章 Canvas 程序化渲染 (Inside + Scorn 美学) ==========
var _prC=null,_prX=null,_prW=0,_prH=0,_prAF=0,_prS=null;
// Perlin noise
var _pnP=new Uint8Array(512);
(function(){var p=[];for(var i=0;i<256;i++)p[i]=i;for(var i=255;i>0;i--){var j=0|Math.random()*(i+1);var t=p[i];p[i]=p[j];p[j]=t;}for(var i=0;i<512;i++)_pnP[i]=p[i&255];})();
function _pf(t){return t*t*t*(t*(t*6-15)+10);}
function _pg(h,x,y){var n=h&3;if(n===0)return x+y;if(n===1)return -x+y;if(n===2)return x-y;return -x-y;}
function pN(px,py){
var X=Math.floor(px)&255,Y=Math.floor(py)&255;
var xf=px-Math.floor(px),yf=py-Math.floor(py);
var u=_pf(xf),v=_pf(yf);
var A=_pnP[X]+Y,B=_pnP[X+1]+Y;
var l1=_pg(_pnP[A],xf,yf)*(1-u)+_pg(_pnP[B],xf-1,yf)*u;
var l2=_pg(_pnP[A+1],xf,yf-1)*(1-u)+_pg(_pnP[B+1],xf-1,yf-1)*u;
return l1*(1-v)+l2*v;
}
// 场景配色（更暗更压抑）
var _prCfg=[
{bg:[3,4,8],vc:[50,70,100],gc:[80,110,150],gx:.5,gy:.55,gr:.3,gi:.15,ns:12,st:0,pc:[120,160,210],pn:20},
{bg:[12,2,4],vc:[160,20,30],gc:[200,30,40],gx:.5,gy:.45,gr:.35,gi:.28,ns:16,st:1,pc:[255,40,60],pn:26},
{bg:[1,1,2],vc:[80,15,15],gc:[220,20,20],gx:.5,gy:.5,gr:.4,gi:.35,ns:18,st:2,pc:[255,30,30],pn:32},
{bg:[2,8,12],vc:[0,150,180],gc:[0,220,190],gx:.5,gy:.4,gr:.35,gi:.32,ns:20,st:3,pc:[0,240,200],pn:34},
{bg:[4,2,14],vc:[15,80,65],gc:[0,160,120],gx:.5,gy:.35,gr:.28,gi:.25,ns:20,st:4,pc:[0,180,140],pn:36,eye:1}
];
function _prGV(c,w,h){
var vs=[];
for(var i=0;i<c.ns;i++){
  var pts=[],sg=5+Math.floor(Math.random()*5),sd=Math.random()*100;
  if(c.st===0){
    var y0=h*(0.12+Math.random()*0.76);
    for(var j=0;j<=sg;j++){var t=j/sg;pts.push({x:t*w,y:y0+pN(t*3+sd,sd)*h*0.14});}
  }else if(c.st===1){
    var ang=(i/c.ns)*Math.PI*2,cx2=w*0.5,cy2=h*0.48;
    for(var j=0;j<=sg;j++){var t=j/sg,r=(1-t)*Math.max(w,h)*0.52;pts.push({x:cx2+Math.cos(ang+pN(t*2+sd,0)*0.5)*r,y:cy2+Math.sin(ang+pN(0,t*2+sd)*0.5)*r});}
  }else if(c.st===2){
    var side=i<c.ns/2?-1:1,sx=side>0?w:0,ex=w*0.5+side*w*0.08;
    for(var j=0;j<=sg;j++){var t=j/sg;pts.push({x:sx+(ex-sx)*t+pN(t*3+sd,sd)*w*0.04,y:h*0.08+h*t*0.6+pN(sd,t*3+sd)*h*0.03});}
  }else if(c.st===3){
    var cx3=w*(0.12+Math.random()*0.76),cy3=h*(0.22+Math.random()*0.56);
    for(var j=0;j<=sg;j++){var t=j/sg,a2=t*Math.PI*(1+Math.random()),r2=22+Math.random()*65;pts.push({x:cx3+Math.cos(a2)*r2+pN(t*2+sd,sd)*30,y:cy3+Math.sin(a2)*r2+pN(sd,t*2+sd)*30});}
  }else if(c.st===4){
    var x0=w*(0.18+Math.random()*0.64);
    for(var j=0;j<=sg;j++){var t=j/sg,xv=x0+pN(t*3+sd,sd)*w*0.1;xv+=(w*0.5-xv)*t*0.5;pts.push({x:xv,y:h*(1-t*0.88)});}
  }
  vs.push({pts:pts,w:0.8+Math.random()*2.5,a:0.2+Math.random()*0.25,sd:sd});
  if(Math.random()<0.45&&pts.length>2){
    var bi=1+Math.floor(Math.random()*(pts.length-2)),bp=pts[bi],bpts=[{x:bp.x,y:bp.y}],ba=Math.random()*6.28;
    for(var k=1;k<=3;k++){bpts.push({x:bp.x+Math.cos(ba)*k*22+pN(k+sd,sd)*12,y:bp.y+Math.sin(ba)*k*22+pN(sd,k+sd)*12});}
    vs.push({pts:bpts,w:0.4+Math.random()*1.2,a:0.12+Math.random()*0.15,sd:sd+50});
  }
}
return vs;
}
function _prGP(c,vs,w,h){
var ps=[];
for(var i=0;i<c.pn;i++){
  var vi=Math.floor(Math.random()*vs.length),vv=vs[vi],t=Math.random();
  var idx=Math.floor(t*(vv.pts.length-1)),nx=Math.min(idx+1,vv.pts.length-1),lt=t*(vv.pts.length-1)-idx;
  ps.push({x:vv.pts[idx].x+(vv.pts[nx].x-vv.pts[idx].x)*lt,y:vv.pts[idx].y+(vv.pts[nx].y-vv.pts[idx].y)*lt,
    vx:0,vy:0,vi:vi,t:t,sp:0.001+Math.random()*0.004,sz:1+Math.random()*2.5,a:0.15+Math.random()*0.25});
}
return ps;
}
var _prClick=null,_prClickT=0;
function initProlScene(idx){
try{
  if(_prAF){cancelAnimationFrame(_prAF);_prAF=0;}
  var cv=document.getElementById('prol-canvas');
  if(!cv){console.error('prol-canvas not found');return;}
  _prC=cv;
  _prX=cv.getContext('2d');
  if(!_prX){console.error('canvas 2d context failed');return;}
  _prW=window.innerWidth;_prH=window.innerHeight;
  var dpr=Math.min(window.devicePixelRatio||1,1.5);
  cv.width=Math.floor(_prW*dpr);cv.height=Math.floor(_prH*dpr);
  cv.style.width=_prW+'px';cv.style.height=_prH+'px';
  _prX.setTransform(dpr,0,0,dpr,0,0);
  var cf=_prCfg[idx]||_prCfg[0];
  var vs=_prGV(cf,_prW,_prH);
  var ps=_prGP(cf,vs,_prW,_prH);
  _prS={c:cf,v:vs,p:ps,t:0,fa:0};
  _prClick=null;
  function loop(){
    try{_prRender();}catch(e){console.error('render err',e);}
    _prAF=requestAnimationFrame(loop);
  }
  _prAF=requestAnimationFrame(loop);
}catch(e){console.error('initProlScene err',e);}
}
function _prRender(){
var s=_prS;if(!s)return;
var ctx=_prX,w=_prW,h=_prH,c=s.c;
s.t+=0.016;
if(s.fa<1)s.fa=Math.min(1,s.fa+0.015);
ctx.globalAlpha=1;
ctx.fillStyle='rgb('+c.bg[0]+','+c.bg[1]+','+c.bg[2]+')';
ctx.fillRect(0,0,w,h);
ctx.globalAlpha=s.fa;
// 径向微光（呼吸脉动更明显）
var gp=1+Math.sin(s.t*0.5)*0.35+Math.sin(s.t*1.3)*0.1;
var glx=c.gx*w,gly=c.gy*h,glr=c.gr*Math.max(w,h)*gp;
var grd=ctx.createRadialGradient(glx,gly,0,glx,gly,glr);
var gi2=c.gi*gp;
grd.addColorStop(0,'rgba('+c.gc[0]+','+c.gc[1]+','+c.gc[2]+','+gi2+')');
grd.addColorStop(0.5,'rgba('+c.gc[0]+','+c.gc[1]+','+c.gc[2]+','+(gi2*0.3)+')');
grd.addColorStop(1,'rgba(0,0,0,0)');
ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
// 血管
ctx.lineCap='round';ctx.lineJoin='round';
for(var i=0;i<s.v.length;i++){
  var vn=s.v[i],pt=vn.pts;
  if(pt.length<2)continue;
  ctx.beginPath();ctx.moveTo(pt[0].x,pt[0].y);
  for(var j=1;j<pt.length;j++){
    var ddx=pN(j*0.5+vn.sd,s.t*0.2)*2.5;
    var ddy=pN(s.t*0.2,j*0.5+vn.sd)*2.5;
    if(j<pt.length-1){
      var mx2=(pt[j].x+pt[j+1].x)/2+ddx;
      var my2=(pt[j].y+pt[j+1].y)/2+ddy;
      ctx.quadraticCurveTo(pt[j].x+ddx,pt[j].y+ddy,mx2,my2);
    }else{
      ctx.lineTo(pt[j].x+ddx,pt[j].y+ddy);
    }
  }
  var vpulse=1+Math.sin(s.t*0.3+vn.sd)*0.35+Math.sin(s.t*0.8+vn.sd*0.5)*0.15;
  ctx.strokeStyle='rgba('+c.vc[0]+','+c.vc[1]+','+c.vc[2]+','+(vn.a*vpulse)+')';
  ctx.lineWidth=vn.w*vpulse;ctx.stroke();
  ctx.strokeStyle='rgba('+c.vc[0]+','+c.vc[1]+','+c.vc[2]+','+(vn.a*0.4*vpulse)+')';
  ctx.lineWidth=vn.w*5*vpulse;ctx.stroke();
}
// 粒子
var nowMs=Date.now(),hasT=_prClick&&(nowMs-_prClickT<1800);
for(var i=0;i<s.p.length;i++){
  var pr=s.p[i];
  if(hasT){
    var pdx=_prClick.x-pr.x,pdy=_prClick.y-pr.y,pd=Math.sqrt(pdx*pdx+pdy*pdy);
    if(pd>1){pr.vx+=pdx/pd*0.25;pr.vy+=pdy/pd*0.25;}
    pr.vx*=0.93;pr.vy*=0.93;pr.x+=pr.vx;pr.y+=pr.vy;
  }else{
    var vn2=s.v[pr.vi%s.v.length];
    pr.t+=pr.sp;
    if(pr.t>1){pr.t=0;pr.vi=Math.floor(Math.random()*s.v.length);}
    var pi=Math.floor(pr.t*(vn2.pts.length-1));
    var pnx=Math.min(pi+1,vn2.pts.length-1);
    var plt=pr.t*(vn2.pts.length-1)-pi;
    var ptx=vn2.pts[pi].x+(vn2.pts[pnx].x-vn2.pts[pi].x)*plt;
    var pty=vn2.pts[pi].y+(vn2.pts[pnx].y-vn2.pts[pi].y)*plt;
    pr.x+=(ptx-pr.x)*0.04;pr.y+=(pty-pr.y)*0.04;
    pr.vx=0;pr.vy=0;
  }
  var ppulse=0.2+Math.sin(s.t*1.2+i*0.7)*0.8;
  var palpha=pr.a*ppulse;
  ctx.beginPath();ctx.arc(pr.x,pr.y,pr.sz*5,0,Math.PI*2);
  ctx.fillStyle='rgba('+c.pc[0]+','+c.pc[1]+','+c.pc[2]+','+(palpha*0.2)+')';ctx.fill();
  ctx.beginPath();ctx.arc(pr.x,pr.y,pr.sz*2.5,0,Math.PI*2);
  ctx.fillStyle='rgba('+c.pc[0]+','+c.pc[1]+','+c.pc[2]+','+(palpha*0.45)+')';ctx.fill();
  ctx.beginPath();ctx.arc(pr.x,pr.y,pr.sz,0,Math.PI*2);
  ctx.fillStyle='rgba('+c.pc[0]+','+c.pc[1]+','+c.pc[2]+','+palpha+')';ctx.fill();
}
// 塔顶之眼
if(c.eye){
  var eyep=0.3+Math.sin(s.t*0.45)*0.7;
  var eyeg=ctx.createRadialGradient(w*0.5,h*0.11,0,w*0.5,h*0.11,50);
  eyeg.addColorStop(0,'rgba(200,150,20,'+(eyep*0.4)+')');
  eyeg.addColorStop(0.4,'rgba(150,100,10,'+(eyep*0.15)+')');
  eyeg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=eyeg;ctx.fillRect(0,0,w,h);
  ctx.beginPath();ctx.arc(w*0.5,h*0.11,4,0,Math.PI*2);
  ctx.fillStyle='rgba(255,200,50,'+(eyep*0.6)+')';ctx.fill();
}
// 暗角（更重的压迫感）
var vig=ctx.createRadialGradient(w*0.5,h*0.42,w*0.08,w*0.5,h*0.42,w*0.65);
vig.addColorStop(0,'rgba(0,0,0,0)');
vig.addColorStop(0.25,'rgba(0,0,0,0.2)');
vig.addColorStop(0.5,'rgba(0,0,0,0.55)');
vig.addColorStop(0.75,'rgba(0,0,0,0.82)');
vig.addColorStop(1,'rgba(0,0,0,0.96)');
ctx.fillStyle=vig;ctx.fillRect(0,0,w,h);
}
function stopProlScene(){if(_prAF){cancelAnimationFrame(_prAF);_prAF=0;}_prS=null;}
function prolCanvasClick(ex,ey){_prClick={x:ex,y:ey};_prClickT=Date.now();}

var _prologueScenes=[
  // 幕一：建立鼠的视角 + 异物入侵 + 瘫痪
  {lines:[
    {text:'[实验日志 #???] 编号 R-0463 · 实验鼠',cls:'p-terminal'},
    {text:'你在通风管道里觅食。金属壁渗着冷凝水。',cls:''},
    {text:'背后有声音——比脚步更软，贴着壁面蠕动。',cls:''},
    {text:'一团荧光色的东西从裂缝里渗出来。',cls:'p-warn'},
    {text:'你的四肢突然僵硬。',cls:'p-warn'},
  ]},
  // 幕二：死亡 + 觉醒（核心情绪）
  {lines:[
    {text:'[警告] 意识层遭入侵',cls:'p-terminal p-warn'},
    {text:'[终止] R-0463 脑死亡确认',cls:'p-terminal p-warn'},
    {text:'…………',cls:'p-thought'},
    {text:'你看见自己的尸体。蜷缩在管道角落。',cls:''},
    {text:'但「你」还在——没有身体，只剩一团意识。',cls:'p-thought'},
  ]},
  // 幕三：动机 + title
  {lines:[
    {text:'那只老鼠是我吗？不。我是侵入它的东西。',cls:'p-warn'},
    {text:'可——为什么我有它的记忆？',cls:'p-note'},
    {text:'没有躯壳，意识会在几分钟内消散。',cls:'p-warn'},
    {text:'附身。任何活的东西。然后向上走，找到答案。',cls:'p-warn'},
    {text:'你 也 是 我',cls:'p-title'},
  ]},
];
var _prologueIdx=0;
var _prologueLineIdx=0;
var _prologueTimer=null;
var _prologueBusy=false;

function startPrologue(){
  _prologueIdx=0;_prologueLineIdx=0;_prologueBusy=false;
  var scr=document.getElementById('prologue-screen');
  scr.style.display='flex';
  try{startPrologueBGM();}catch(e){}
  showPrologueScene();
}
function showPrologueScene(){
  if(_prologueIdx>=_prologueScenes.length){endPrologue();return;}
  // 3幕 → 5种视觉配色映射：冷蓝建立 → 深红死亡 → 绿色之眼
  var cfgMap=[0,2,4];
  initProlScene(cfgMap[_prologueIdx]||0);
  // 幕二（觉醒）进入瞬间触发寄生体觉醒音效
  if(_prologueIdx===1){try{sounds.possess();}catch(e){}}
  var scene=_prologueScenes[_prologueIdx];
  var container=document.getElementById('prologue-text');
  container.innerHTML='';
  _prologueLineIdx=0;_prologueBusy=true;
  showPrologueLine(scene.lines,container);
}
function showPrologueLine(lines,container){
  if(_prologueLineIdx>=lines.length){
    var hint=document.createElement('div');hint.className='p-line active p-continue';hint.textContent='— 点击继续 —';
    container.appendChild(hint);
    _prologueBusy=false;
    return;
  }
  var lineData=lines[_prologueLineIdx];
  var div=document.createElement('div');
  div.className='p-line active '+(lineData.cls||'');
  container.appendChild(div);
  var text=lineData.text;var charIdx=0;
  var cursor=document.createElement('span');cursor.className='p-cursor';
  div.appendChild(cursor);
  var speed=lineData.cls&&lineData.cls.indexOf('p-title')>=0?140:lineData.cls&&lineData.cls.indexOf('p-terminal')>=0?22:lineData.cls&&lineData.cls.indexOf('p-thought')>=0?50:38;
  function typeChar(){
    if(charIdx<text.length){
      cursor.remove();
      div.insertAdjacentText('beforeend',text[charIdx]);
      div.appendChild(cursor);
      charIdx++;
      _prologueTimer=setTimeout(typeChar,speed);
    }else{
      cursor.remove();
      if(lineData.cls&&lineData.cls.indexOf('p-warn')>=0){prologueFlash();}
      // 幕二（idx=1）"脑死亡确认" 瞬间触发系统崩溃效果
      if(_prologueIdx===1&&text.indexOf('脑死亡确认')>=0){prologueGlitchCrash();}
      // 关键停顿节拍
      var nextDelay=350;
      if(_prologueIdx===1&&text.indexOf('脑死亡确认')>=0)nextDelay=2000; // 死亡后静默
      if(_prologueIdx===1&&text.indexOf('「你」还在')>=0)nextDelay=1200; // 觉醒留白
      if(_prologueIdx===0&&text.indexOf('四肢突然僵硬')>=0)nextDelay=1000; // 入侵悬念
      if(_prologueIdx===2&&text.indexOf('你 也')>=0)nextDelay=0; // title后不需等
      _prologueLineIdx++;
      _prologueTimer=setTimeout(function(){showPrologueLine(lines,container);},nextDelay);
    }
  }
  _prologueTimer=setTimeout(typeChar,_prologueLineIdx===0?600:200);
}
function prologueNext(e){
  if(e&&e.clientX)prolCanvasClick(e.clientX,e.clientY);
  if(_prologueBusy){
    if(_prologueTimer)clearTimeout(_prologueTimer);
    var scene=_prologueScenes[_prologueIdx];
    var container=document.getElementById('prologue-text');
    container.innerHTML='';
    scene.lines.forEach(function(l){
      var d=document.createElement('div');d.className='p-line active '+(l.cls||'');d.textContent=l.text;container.appendChild(d);
    });
    var hint=document.createElement('div');hint.className='p-line active p-continue';hint.textContent='— 点击继续 —';
    container.appendChild(hint);
    _prologueBusy=false;
    return;
  }
  _prologueBusy=true;
  // 场景切换：微黑闪+震动
  var scr=document.getElementById('prologue-screen');
  if(scr){scr.style.transition='opacity .15s';scr.style.opacity='0.3';}
  setTimeout(function(){
    if(scr){scr.style.opacity='1';scr.style.transition='opacity .5s';}
    _prologueIdx++;showPrologueScene();
  },800);
}
function skipPrologue(){try{stopPrologueBGM();}catch(e){}endPrologue();}
function prologueFlash(){
  var scr=document.getElementById('prologue-screen');
  scr.style.transition='background .05s';scr.style.background='rgba(255,0,50,0.06)';
  setTimeout(function(){scr.style.background='';scr.style.transition='background .4s';},80);
}
// 第3幕宿主死亡瞬间：剧烈崩溃效果（多次闪烁 + 屏幕抖动 + 死亡音效）
function prologueGlitchCrash(){
  var scr=document.getElementById('prologue-screen');
  if(!scr)return;
  try{sounds.death();}catch(e){}
  var flashes=[
    {color:'rgba(255,0,40,0.6)',delay:0,dur:80},
    {color:'rgba(0,0,0,1)',delay:120,dur:60},
    {color:'rgba(255,0,40,0.45)',delay:200,dur:80},
    {color:'rgba(0,0,0,1)',delay:320,dur:100},
    {color:'rgba(255,40,40,0.3)',delay:460,dur:140},
    {color:'rgba(0,0,0,0.85)',delay:620,dur:200}
  ];
  flashes.forEach(function(f){
    setTimeout(function(){
      scr.style.transition='background .03s';
      scr.style.background=f.color;
      scr.style.transform='translateX('+(Math.random()*6-3)+'px) translateY('+(Math.random()*6-3)+'px)';
      setTimeout(function(){scr.style.background='';scr.style.transform='';scr.style.transition='background .4s';},f.dur);
    },f.delay);
  });
}
function endPrologue(){
  if(_prologueTimer)clearTimeout(_prologueTimer);
  stopProlScene();
  try{stopPrologueBGM();}catch(e){}
  // 序章结束直接接探索 BGM，盖住"标题→选职业"的静默缺口
  try{if(typeof startBGMusic==='function')startBGMusic();}catch(e){}
  document.getElementById('prologue-screen').style.display='none';
  try{localStorage.setItem('pt_prologue_done','1');}catch(e){}
  // 先把标题界面铺底，避免昵称弹窗出现时背后是黑屏
  showTitleScreen(true);
  if(typeof ensureNickname==='function'){ ensureNickname(function(){}); }
}

function showTitleScreen(menuMode){
  var scr=document.getElementById('start-screen');
  scr.style.display='flex';
  // 标题界面也接 BGM（跳过序章/重开都覆盖）；同 zone 内部 no-op
  try{if(typeof startBGMusic==='function')startBGMusic();}catch(e){}
  var startBtn=document.getElementById('ss-start-btn');
  var enterBtn=document.getElementById('ss-enter-btn');
  var enterTxt=document.getElementById('ss-enter-text');
  var nav=document.getElementById('ss-nav-zone');
  var recCards=document.getElementById('ss-rec-cards');
  var recCardShort=document.getElementById('ss-rec-card-short');
  var recCardClassic=document.getElementById('ss-rec-card-classic');
  var recEmpty=document.getElementById('ss-rec-empty');
  var tagline=document.getElementById('ss-tagline');
  var lang=window.PT_LANG&&PT_LANG._current||'zh';
  var deathReturn=!!window._titleDeathReturn;
  var classMap=lang==='en'?{titan:'Titan',ghost:'Ghost',swarm:'Swarm',blood:'Blood',mech:'Mech'}:{titan:'泰坦',ghost:'幽魂',swarm:'虫群',blood:'血祭',mech:'机甲'};
  function fmtTime(ts){var ago=Math.floor((Date.now()-ts)/60000);return lang==='en'?(ago<1?'just now':ago<60?ago+'m ago':Math.floor(ago/60)+'h ago'):(ago<1?'刚才':ago<60?ago+'分钟前':Math.floor(ago/60)+'小时前');}
  function fillCard(suffix,info){
    var card=document.getElementById('ss-rec-card-'+suffix);if(!card)return false;
    if(!info){card.style.display='none';return false;}
    var setT=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v;};
    setT('ss-rec-time-'+suffix,fmtTime(info.time));
    setT('ss-rec-floor-'+suffix,'F'+info.floor);
    setT('ss-rec-host-'+suffix,(info.icon?info.icon+' ':'')+info.name);
    setT('ss-rec-class-'+suffix,classMap[info.cls]||info.cls);
    // 短局存档：按挑战类型替换标签
    if(suffix==='short'){
      var labelEl=card.querySelector('.ss-rec-label');
      if(labelEl){
        var labelTxt='⚡ 短局 · 一次迭代';
        if(info.challengeType==='daily')labelTxt='🎯 每日挑战'+(info.modName?' · '+info.modName:'');
        else if(info.challengeType==='weekly')labelTxt='⛯ 本周挑战'+(info.modName?' · '+info.modName:'');
        labelEl.textContent=labelTxt;
        // 挑战配色高亮
        if(info.challengeType==='daily')labelEl.style.color='#ffd700';
        else if(info.challengeType==='weekly')labelEl.style.color='#cdb6ff';
        else labelEl.style.color='';
      }
    }
    card.style.display='block';
    return true;
  }

  if(menuMode){
    if(startBtn) startBtn.style.display='none';
    if(enterBtn) enterBtn.style.display='block';
    if(nav) nav.style.display='flex';
    var allInfo=(typeof getAllSaveInfo==='function')?getAllSaveInfo():{short:null,classic:(window._titleSaveInfo||getSaveInfo()),expedition:null};
    // 按存档时间降序排列卡片（最近的排最前）
    var saves=[
      {suffix:'short',info:allInfo.short},
      {suffix:'classic',info:allInfo.classic},
      {suffix:'expedition',info:allInfo.expedition}
    ];
    saves.sort(function(a,b){return (b.info?b.info.time:0)-(a.info?a.info.time:0);});
    var hasAny=false;
    var container=document.getElementById('ss-rec-cards');
    for(var si=0;si<saves.length;si++){
      var s=saves[si];
      var filled=fillCard(s.suffix,s.info);
      if(filled){
        hasAny=true;
        var cardEl=document.getElementById('ss-rec-card-'+s.suffix);
        if(cardEl&&container)container.appendChild(cardEl);
      }
    }
    if(hasAny){
      if(recCards) recCards.style.display='flex';
      if(recEmpty) recEmpty.style.display='none';
      if(enterTxt) enterTxt.textContent=deathReturn?(lang==='en'?'DIVE AGAIN':'再次下潜'):(lang==='en'?'DESCEND DEEPER':'继续深入');
      if(tagline) tagline.textContent=deathReturn?'这具身体已经失效，但你仍在下沉。':'你每夺走一个身体，就离自己更远一步。';
    }else{
      if(recCards) recCards.style.display='none';
      if(recEmpty) recEmpty.style.display='block';
      if(enterTxt) enterTxt.textContent=lang==='en'?'INTO THE ABYSS':'进入深渊';
      if(tagline) tagline.textContent='踏入深渊，寻找下一具身体。';
    }
  }else{
    if(startBtn) startBtn.style.display='block';
    if(enterBtn) enterBtn.style.display='none';
    if(nav) nav.style.display='none';
    if(recCards) recCards.style.display='none';
    if(recEmpty) recEmpty.style.display='none';
    if(tagline) tagline.textContent='你每夺走一个身体，就离自己更远一步。';
  }
  window._titleDeathReturn=false;
  // 残响圣坛入口：显示当前残响余额 + 推进连续登录（不弹窗，由用户主动领取）
  try{
    if(window.MetaProgress){
      if(!window._metaLoginChecked){
        window._metaLoginChecked = true;
        try{ MetaProgress.checkLogin(); }catch(e){}
      }
      var _m = MetaProgress.get();
      var _badge = document.getElementById('ss-nav-altar-badge');
      if(_badge) _badge.textContent = '['+(_m.echoes|0)+']';
      // 登录奖励按钮红点
      try{ if(typeof updateLoginBonusBadge==='function') updateLoginBonusBadge(); }catch(e){}
    }
  }catch(e){}
  if(typeof PT_LANG!=='undefined') PT_LANG._applyLang();
}

function titleNewGame(){
  document.getElementById('start-screen').style.display='none';
  startPrologue();
}

function titleContinue(){
  var saveInfo=window._titleSaveInfo||getSaveInfo();
  if(!saveInfo) return;
  _enterLoadedGame();
}
function titleContinueMode(modeId){
  var info=getSaveInfo(modeId);
  if(!info)return;
  _enterLoadedGame(modeId);
}

function _enterLoadedGame(modeId){
  if(typeof loadGame==='function'&&loadGame(modeId)){
    game._runEnded=false; // 续档：本局继续，放行 autosave
    document.getElementById('start-screen').style.display='none';
    document.getElementById('game-screen').classList.add('active');
    try{if(typeof initSporeParticles==='function')initSporeParticles();}catch(e){}
    try{updateClassTheme();}catch(e){}
    try{if(!game._floorSignatureMap||Object.keys(game._floorSignatureMap).length===0)assignFloorSignatures();}catch(e){}
    try{
      var _sigId=game._floorSignatureMap&&game._floorSignatureMap[game.floor];
      game._floorSignature=(_sigId&&floorSignatures[_sigId])||null;
    }catch(e){game._floorSignature=null;}
    try{loadAffinityFromStorage();}catch(e){}
    try{updatePollutionSkills();applyPollutionPassives();}catch(e){}
    game._lastFormSig=null;
    try{updateFormBar();}catch(e){}
    try{initCanvasTap();}catch(e){}
    try{startBGMusic();}catch(e){}
    try{rebuildMessages();}catch(e){}
    render();
  }
}

function titleStartNew(){
  document.getElementById('start-screen').style.display='none';
  document.getElementById('mode-screen').style.display='flex';
  var _dmp=document.getElementById('daily-mod-preview');
  if(_dmp&&typeof getDailyModifier==='function'){var _m=getDailyModifier();_dmp.innerHTML='<span style="color:'+_m.color+'">'+_m.icon+' '+_m.name+'：'+_m.desc+'</span>';}
}

function titleOverlay(){
  var ev=document.getElementById('event-overlay');
  if(ev) ev.style.zIndex='600';
}

function titleShowLeaderboard(){
  titleOverlay();
  if(window.ShortMode) ShortMode.showLeaderboard();
}

function titleShowSaveMenu(){
  titleOverlay();
  var ev=document.getElementById('event-overlay');
  ev.style.display='flex';
  document.getElementById('event-title').textContent=t('存档管理');
  document.getElementById('event-text').innerHTML='';
  document.getElementById('event-choices').innerHTML=
    '<div style="display:flex;flex-direction:column;gap:8px">'+
    '<button class="btn" onclick="exportSave();titleOverlay()">📤 '+t('导出存档')+'</button>'+
    '<button class="btn" onclick="importSave();titleOverlay()">📥 '+t('导入存档')+'</button>'+
    '<button class="btn" onclick="editNickname();titleOverlay()">🪪 '+t('修改昵称')+'</button>'+
    '<button class="btn btn-secondary" onclick="closeEvent()">'+t('关闭')+'</button>'+
    '</div>';
}

function _spawnTitleParticles(){
  var el=document.getElementById('ss-bottom-particles');
  if(!el) return;
  if(el._spawned) return;
  el._spawned=true;
  setInterval(function(){
    if(document.getElementById('start-screen').style.display==='none') return;
    var p=document.createElement('div');
    var x=10+Math.random()*80;
    var s=1+Math.random()*3;
    var c=Math.random()<0.75?'rgba(120,240,215,0.22)':'rgba(142,31,45,0.18)';
    p.style.cssText='position:absolute;left:'+x+'%;bottom:0;width:'+s+'px;height:'+s+'px;border-radius:50%;background:'+c+';opacity:0;pointer-events:none;animation:ssParticleRise '+(5+Math.random()*4)+'s linear forwards';
    el.appendChild(p);
    setTimeout(function(){if(p.parentNode)p.remove();},9000);
  },900);
}

window._selectedMode=null;
function selectGameMode(id){
  window._selectedMode=id;
  if(typeof GameModes!=='undefined') GameModes.select(id);
  var cards=document.querySelectorAll('.mode-card');
  cards.forEach(function(c){ c.classList.remove('mc-selected'); });
  var sel=document.getElementById('mc-'+id);
  if(sel) sel.classList.add('mc-selected');
  var btn=document.getElementById('mode-confirm-btn');
  if(btn) btn.style.display='block';
}

function confirmModeAndContinue(){
  if(!window._selectedMode) return;
  // 清理上一局的崩溃结算残留（top-bar 乱码、_endScreenActive、覆盖层）
  try{ if(window.ShortMode&&typeof ShortMode._cleanupCrash==='function') ShortMode._cleanupCrash(); }catch(e){}
  try{ if(window.game) game._endScreenActive=false; }catch(e){}
  // 强制清除战斗中可能残留的 combat-hidden 类（死亡→forceFinale 不走 closeCombat）
  try{
    ['minimap-container','msg-panel','battle-log-panel'].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.classList.remove('combat-hidden');
    });
    var _coR=document.getElementById('combat-overlay');
    if(_coR){_coR.classList.remove('active');}
  }catch(e){}
  try{
    var _co=document.getElementById('crash-overlay');if(_co)_co.remove();
    var _bo=document.getElementById('short-blackout');if(_bo)_bo.remove();
    var _ga=document.getElementById('game-area');if(_ga)_ga.style.animation='';
    var _ev=document.getElementById('event-overlay');if(_ev)_ev.style.display='none';
    var _statEls=document.querySelectorAll('#top-bar [data-orig]');
    for(var _i=0;_i<_statEls.length;_i++){
      // data-orig 是上一局的脏数据，不要还原——清空动画与属性即可，后面 _clr 会写入新值
      _statEls[_i].style.animation='';
      _statEls[_i].removeAttribute('data-orig');
    }
  }catch(e){}
  game._runEnded=false; // 新一局开始：放行 autosave
  // 重置上一局可能残留的内存状态（backToTitle 不会 reload）
  game.floor=1;
  game.tiles=[];game.monsters=[];game.messages=[];game.target=null;
  game.floorHistory={};game.explored={};game.floorCleared={};
  game.skillFragments=[];game.activeSkills=[];game.passiveFragEffects=[];
  game._skillEffects={};game._fragDrops=[];game._fragDropCount=0;
  game.curseBlessing=null;
  game._bossPhase=0;game._bossBaseAtk=0;
  game._floorSignature=null;game._floorSignatureMap={};game._sigFlags={};
  game._routeMods=null;game._routeName=null;game._routeIcon=null;game._routeColor=null;game._routeFloors=0;
  game._dailyPollMult=1;game._dailyBerserkAll=false;game._dailyEliteMult=1;game._dailyNoItemHeal=false;game._dailyBounty=false;game._dailyVampire=false;
  game.phantoms=[];game.statLieOffset={atk:0,def:0,hp:0};
  game.anchorFloor=1;game._tutorialStage=0;game._totalKills=0;
  game._comboCount=0;game._lastComboTier=0;game._shakeFrames=0;
  game.forms=[{name:'寄生体',type:'human',hp:120,maxHp:120,atk:8,def:6,traits:[],icon:'👤',color:'#00c8a0'},null,null];
  game.currentForm=0;game.formCooldown=0;game._deadForms=[false,false,false];
  game._loneWolf=false;game._stiffnessTurns=0;game._deathChoiceActive=false;
  game._shopBuyCount={};game._slotFragments=0;game._lifeStone=false;
  game._inCombat=false;game._autoFight=false;game._combatRound=0;game._combatTotalDmg=0;
  game._attackRounds=0;game._consecutiveDefends=0;game._defendCount=0;
  game._playerStunned=false;game._webbed=false;game._combatSaved=false;game._combatEnding=false;
  game._altarUsed={};game._mapScanned=false;game._moveCountThisFloor=0;game._wallBumpThisFloor=0;
  game._stepCount=0;game._zoneStepCount=0;game._polStepCount=0;game._restUsedThisFloor=false;
  game._evoHintShown=false;game._evoRedDot=false;game._shortUIUnlocked=false;
  game._humanBonus=null;game._bossSlotDropped=false;game._revived=false;
  game._runCounted=false;game._switchCount=0;game._waveCount=0;game._skillLock=false;
  game._lowHpWarned=false;game._lowHpSoundPlayed=false;game._lastSkillStatusHtml='';
  game._dailyModifier=null;game._isWeeklyChallenge=false;game._storyRetries=0;
  game._topBarHeightDirty=true;game._lastPxy=null;game._doubleMoving=false;
  // 进化树/终极技/连死/策略提示/死亡 overlay 状态全部清零
  game._consecutiveDeaths=0;game._lastCombatTargetId=null;
  game._floorsWithoutPossess=0;
  game._deathEpPenalty=0;game._deathCanRollback=false;
  if(game._deathTimer){try{clearInterval(game._deathTimer);}catch(e){}game._deathTimer=null;}
  game._triggerDeathActive=false;
  // 清除上一局的 localStorage 残留（非 reload 新游戏流程 backToTitle 不会清理）
  try{
    localStorage.removeItem('pt_affinity'); // 防止 loadAffinityFromStorage 恢复旧羁绊
    // 清除当前模式存档（防止 visibilitychange autosave 残留）
    if(typeof _currentSaveKey==='function')localStorage.removeItem(_currentSaveKey());
    localStorage.removeItem('pt_save');localStorage.removeItem('parasiteTowerSave');
  }catch(e){}
  // 标记 UI 脏数据强制刷新
  game._fragDirty=true;game._curseDirty=true;game._lastFormSig=null;
  // 关闭所有可能残留的覆盖层 DOM
  try{
    // CSS .active 控制显隐的 overlay：只移除 active 类
    ['fragment-overlay','negotiate-overlay','death-overlay','collapse-overlay','story-overlay','ending-overlay','combat-overlay','anchor-detail-overlay'].forEach(function(id){
      var el=document.getElementById(id);if(el){el.classList.remove('active');}
    });
    // inline style 控制显隐的 overlay：设 display:none
    ['evolution-overlay','shop-overlay','form-library-overlay','affinity-detail-overlay','pollution-skill-overlay','floor25-choice-overlay','flee-confirm-overlay','route-overlay','frag-choice-overlay','synth-confirm-overlay','frag-bag-overlay'].forEach(function(id){
      var el=document.getElementById(id);if(el){el.style.display='none';}
    });
  }catch(e){}
  // 清空碎片栏 / 技能栏 DOM（防止上一局残留）
  try{
    var _fs=document.getElementById('fragment-slots');if(_fs)_fs.innerHTML='';
    var _as=document.getElementById('active-skill-slots');if(_as)_as.innerHTML='';
    var _fb=document.getElementById('fragment-bar');if(_fb)_fb.style.display='none';
  }catch(e){}
  // ☢ 整体替换 player 与 anchor.player 为全新对象 —— 一行抹除上局所有字段
  if(typeof _freshPlayer==='function')game.player=_freshPlayer();
  if(typeof _freshAnchorPlayer==='function'){
    if(!game.anchor)game.anchor={};
    game.anchor.player=_freshAnchorPlayer();
    game.anchor.forms=[{name:'寄生体',type:'human',hp:120,maxHp:120,atk:8,def:6,traits:[],icon:'👤',color:'#00c8a0'},null,null];
    game.anchor.currentForm=0;
    game.anchor.floor=1;game.anchor.anchorName='';game.anchor.reason='';game.anchor.shortRemaining=null;
  }
  // 顶栏 DOM 立即清空，避免短暂闪现上一局数据
  try{
    var _clr=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
    _clr('floor-num','1');_clr('floor-num2','1');_clr('floor-name','废弃实验室');
    _clr('atk-top','0');_clr('def-top','0');_clr('hp-text','0/0');
    _clr('pol-text','0%');_clr('poss-text','--');_clr('evo-bottom','0');
    _clr('explore-pct','0%');_clr('class-name-top','--');_clr('class-resource','');
    var _hf=document.getElementById('hp-fill');if(_hf)_hf.style.width='0%';
  }catch(e){}
  // 失效 render DOM 缓存（避免上一局 detached 节点引用）+ 解锁渲染门
  try{
    if(typeof _$!=='undefined'){_$.hpFill=null;}
    if(window.game){game._endScreenActive=false;game._lastFormSig=null;}
    window._renderDirty=true;
  }catch(e){}
  document.getElementById('mode-screen').style.display='none';
  document.getElementById('class-select-screen').classList.add('active');
  // 清空上一局战斗日志/消息面板（必须在 class-select 后续 addMsg 之前）
  try{['msg-panel','battle-log-panel'].forEach(function(id){var el=document.getElementById(id);if(el)el.innerHTML='';});}catch(e){}
  if(typeof selectClass==='function') selectClass('titan');
}

function getDailySeed(){
  var d=new Date();
  return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
}

// === 每日挑战修饰器系统 ===
var DAILY_MODIFIERS=[
  {id:'double_poll',name:'污染潮汐',icon:'☢️',desc:'污染增长×2',color:'#ff006e',apply:function(g){g._dailyPollMult=2;}},
  {id:'glass_cannon',name:'脆弱之力',icon:'💔',desc:'全伤害×2（双方）',color:'#ff4444',apply:function(g){g._sigFlags.dmgMult=2;}},
  {id:'ep_feast',name:'进化盛宴',icon:'✨',desc:'EP获取×3',color:'#ffd700',apply:function(g){g._sigFlags.epMult=3;}},
  {id:'berserk_all',name:'狂暴之夜',icon:'🔥',desc:'所有怪物狂暴（HP<50%伤害×1.5）',color:'#ff8800',apply:function(g){g._dailyBerserkAll=true;}},
  {id:'fog_thick',name:'浓雾笼罩',icon:'🌫️',desc:'视野缩小至2格',color:'#8888cc',apply:function(g){g.player.fogRadius=2;}},
  {id:'elite_swarm',name:'精英入侵',icon:'💀',desc:'精英出现率×3',color:'#b455ff',apply:function(g){g._dailyEliteMult=3;}},
  {id:'heal_ban',name:'枯竭诅咒',icon:'🚫',desc:'无法通过道具回血',color:'#666',apply:function(g){g._dailyNoItemHeal=true;}},
  {id:'speed_run',name:'时间压缩',icon:'⚡',desc:'倒计时缩短至10分钟',color:'#00c8ff',apply:function(g){if(window.ShortMode)ShortMode._remaining=600;}},
  {id:'bounty',name:'赏金猎人',icon:'🎯',desc:'击杀奖励EP×2 但怪物HP×1.5',color:'#1ed8b0',apply:function(g){g._dailyBounty=true;}},
  {id:'vampire_night',name:'鲜血之夜',icon:'🩸',desc:'所有攻击吸血15% 但每层+5污染',color:'#cc0022',apply:function(g){g._dailyVampire=true;}}
];

function getDailyModifier(){
  var seed=getDailySeed();
  var idx=seed%DAILY_MODIFIERS.length;
  return DAILY_MODIFIERS[idx];
}

function startDailyChallenge(){
  var mod=getDailyModifier();
  game._seed=getDailySeed();
  game._seedLabel='DAILY #'+game._seed;
  game._dailyModifier=mod;
  selectGameMode('short');
  confirmModeAndContinue();
}

// === 本周挑战 ===
// ISO 周种子：year*100 + ISOweek（1..53）
function getWeekSeed(){
  var d=new Date();
  // ISO week 算法
  var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  var dayNum=t.getUTCDay()||7; // Mon=1..Sun=7
  t.setUTCDate(t.getUTCDate()+4-dayNum);
  var yearStart=new Date(Date.UTC(t.getUTCFullYear(),0,1));
  var week=Math.ceil(((t-yearStart)/86400000+1)/7);
  return t.getUTCFullYear()*100+week;
}

function getWeekModifier(){
  var seed=getWeekSeed();
  // 复用日常 modifier 池，但用周种子选取 → 同一周固定
  var idx=seed%DAILY_MODIFIERS.length;
  return DAILY_MODIFIERS[idx];
}

function startWeeklyChallenge(){
  var mod=getWeekModifier();
  game._seed=getWeekSeed();
  game._seedLabel='WEEKLY #'+game._seed;
  game._dailyModifier=mod;       // 复用 apply 通道
  game._isWeeklyChallenge=true;  // 提交时打标
  selectGameMode('short');
  confirmModeAndContinue();
}

function applyDailyModifier(){
  if(!game._dailyModifier)return;
  game._dailyModifier.apply(game);
  addMsg('<span style="color:'+game._dailyModifier.color+';font-weight:bold">'+game._dailyModifier.icon+' 今日修饰：'+game._dailyModifier.name+' — '+game._dailyModifier.desc+'</span>');
}

function startSeededRun(){
  var inp=document.getElementById('seed-input');
  var v=parseInt(inp.value,10);
  if(!v||v<1){inp.style.borderColor='#f44';return;}
  inp.style.borderColor='#444';
  game._seed=v;
  game._seedLabel='SEED #'+v;
  selectGameMode('short');
  confirmModeAndContinue();
}

function _showLoginToast(li){
  try{
    var box = document.createElement('div');
    box.style.cssText='position:fixed;top:18%;left:50%;transform:translateX(-50%);'+
      'background:linear-gradient(180deg,#1a0a2a,#0a0612);border:1px solid #a55cff;'+
      'color:#cdb6ff;padding:14px 20px;border-radius:8px;z-index:700;'+
      'font-family:Consolas,monospace;text-align:center;box-shadow:0 0 20px rgba(165,92,255,.5);'+
      'opacity:0;transition:opacity .4s,transform .4s;';
    box.innerHTML =
      '<div style="font-size:.85em;color:#a55cff;margin-bottom:6px">⛯ 残响共鸣</div>'+
      '<div style="font-size:1.05em;font-weight:bold;color:#fff;margin-bottom:4px">连续登录 第'+li.streak+'天</div>'+
      '<div style="font-size:.85em;color:#cdb6ff">+'+li.bonus+' 残响 · 当前 '+li.total+'</div>';
    document.body.appendChild(box);
    requestAnimationFrame(function(){ box.style.opacity='1'; box.style.transform='translateX(-50%) translateY(8px)'; });
    setTimeout(function(){ box.style.opacity='0'; }, 2800);
    setTimeout(function(){ if(box.parentNode) box.remove(); }, 3300);
    // 同步更新主菜单徽章
    var b = document.getElementById('ss-nav-altar-badge');
    if(b) b.textContent = '['+li.total+']';
  }catch(e){}
}
