// ================================================================
// 海报生成 & 分享：结局/短局战绩/成就 → 精美图片 → 调用 Android 分享
// ================================================================
(function(){
const W=720,H=1280;
function _t(s){return (window.t?window.t(s):s);}

function _hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*16777619)>>>0;}return h;}
function _rng(seed){var s=seed||1;return function(){s=(s*9301+49297)%233280;return s/233280;};}

function _drawBg(c,palette){
  // 1) 垂直主渐变
  var g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,palette.bgTop);g.addColorStop(0.55,palette.bgMid);g.addColorStop(1,palette.bgBot);
  c.fillStyle=g;c.fillRect(0,0,W,H);
  // 2) 星云径向斑块
  var blobs=[
    {x:W*0.18,y:H*0.22,r:420,col:palette.glow1,a:0.55},
    {x:W*0.85,y:H*0.45,r:380,col:palette.glow2,a:0.45},
    {x:W*0.45,y:H*0.85,r:520,col:palette.glow1,a:0.35}
  ];
  c.globalCompositeOperation='lighter';
  blobs.forEach(function(b){
    var rg=c.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
    rg.addColorStop(0,_alpha(b.col,b.a));rg.addColorStop(1,_alpha(b.col,0));
    c.fillStyle=rg;c.beginPath();c.arc(b.x,b.y,b.r,0,Math.PI*2);c.fill();
  });
  c.globalCompositeOperation='source-over';
  // 3) 网格扫描线
  c.strokeStyle='rgba(255,255,255,0.025)';c.lineWidth=1;
  for(var y=0;y<H;y+=4){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
  // 4) 漂浮孢子（确定性种子）
  var rnd=_rng(palette.seed||1);
  for(var i=0;i<60;i++){
    var x=rnd()*W,py=rnd()*H,r=rnd()*2.4+0.6,al=rnd()*0.6+0.2;
    c.fillStyle=_alpha(palette.particle,al);
    c.beginPath();c.arc(x,py,r,0,Math.PI*2);c.fill();
  }
  // 5) 顶部/底部暗角
  var vg=c.createLinearGradient(0,0,0,H);
  vg.addColorStop(0,'rgba(0,0,0,0.55)');vg.addColorStop(0.5,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.7)');
  c.fillStyle=vg;c.fillRect(0,0,W,H);
}

function _alpha(hex,a){
  if(hex.indexOf('rgba')===0)return hex;
  var h=hex.replace('#','');
  if(h.length===3)h=h.split('').map(function(x){return x+x;}).join('');
  var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}

function _drawFrame(c,col){
  // 双层荧光边框
  c.strokeStyle=_alpha(col,0.6);c.lineWidth=2;
  c.strokeRect(24,24,W-48,H-48);
  c.strokeStyle=_alpha(col,0.18);c.lineWidth=1;
  c.strokeRect(38,38,W-76,H-76);
  // 四角刻饰
  var L=36;
  [[40,40,1,1],[W-40,40,-1,1],[40,H-40,1,-1],[W-40,H-40,-1,-1]].forEach(function(p){
    c.strokeStyle=col;c.lineWidth=3;c.beginPath();
    c.moveTo(p[0],p[1]+p[3]*L);c.lineTo(p[0],p[1]);c.lineTo(p[0]+p[2]*L,p[1]);c.stroke();
  });
}

// 评级风格：S系金色、A紫、B蓝、C绿、D灰
function _ratingTheme(rating){
  var r=String(rating||'').toUpperCase();
  var t=r.charAt(0);
  if(t==='S')return{color:'#ffd700',glow:'#ffb700',tier:r==='SSS'?3:r==='SS'?2:1,name:'gold'};
  if(t==='A')return{color:'#b455ff',glow:'#9233ee',tier:0,name:'purple'};
  if(t==='B')return{color:'#3aa8ff',glow:'#1e80e0',tier:0,name:'blue'};
  if(t==='C')return{color:'#1ed8b0',glow:'#0fae8a',tier:0,name:'green'};
  return{color:'#888',glow:'#555',tier:0,name:'gray'};
}

// 增强版边框：在评级框基础上叠加金色多层光晕（仅 S 系）
function _drawRatingFrame(c,theme){
  _drawFrame(c,theme.color);
  if(theme.tier>=1){
    // S/SS/SSS 额外金色外框 + 内描
    c.strokeStyle=_alpha(theme.color,0.35);c.lineWidth=4;
    c.shadowColor=theme.glow;c.shadowBlur=18;
    c.strokeRect(18,18,W-36,H-36);
    c.shadowBlur=0;
  }
  if(theme.tier>=2){
    // SS/SSS：再加一层内层细框
    c.strokeStyle=_alpha(theme.color,0.5);c.lineWidth=1;
    c.strokeRect(52,52,W-104,H-104);
  }
  if(theme.tier>=3){
    // SSS：四角加放射星芒
    var pts=[[40,40],[W-40,40],[40,H-40],[W-40,H-40]];
    c.fillStyle=theme.color;c.shadowColor=theme.glow;c.shadowBlur=20;
    pts.forEach(function(p){c.beginPath();c.arc(p[0],p[1],4,0,Math.PI*2);c.fill();});
    c.shadowBlur=0;
  }
}

function _txt(c,s,x,y,opts){
  opts=opts||{};
  c.font=(opts.weight||'normal')+' '+(opts.size||16)+'px '+(opts.font||'"PingFang SC","Hiragino Sans GB",sans-serif');
  c.textAlign=opts.align||'left';c.textBaseline=opts.baseline||'alphabetic';
  if(opts.glow){c.shadowColor=opts.glow;c.shadowBlur=opts.glowSize||16;}
  c.fillStyle=opts.color||'#fff';
  c.fillText(s,x,y);
  c.shadowBlur=0;
}

function _wrap(c,text,maxW){
  var arr=[],line='';
  for(var i=0;i<text.length;i++){
    var ch=text[i];var test=line+ch;
    if(c.measureText(test).width>maxW&&line){arr.push(line);line=ch;}
    else line=test;
  }
  if(line)arr.push(line);return arr;
}

function _logo(c,col){
  // 你也是我 双语 logo
  _txt(c,'YOU  ARE  ME',W/2,108,{size:22,weight:'bold',color:_alpha(col,0.55),align:'center',font:'monospace'});
  _txt(c,'你 也 是 我',W/2,160,{size:38,weight:'bold',color:'#fff',align:'center',glow:col,glowSize:18});
  // 装饰线
  c.strokeStyle=_alpha(col,0.5);c.lineWidth=1;
  c.beginPath();c.moveTo(W/2-100,180);c.lineTo(W/2-40,180);c.stroke();
  c.beginPath();c.moveTo(W/2+40,180);c.lineTo(W/2+100,180);c.stroke();
  // 中心装饰点
  c.fillStyle=col;c.beginPath();c.arc(W/2,180,3,0,Math.PI*2);c.fill();
}

function _classGlyph(c,cls,cx,cy,r,col){
  // 圆形荧光环 + 大 emoji
  c.save();
  // 外光晕
  var rg=c.createRadialGradient(cx,cy,r*0.4,cx,cy,r*1.5);
  rg.addColorStop(0,_alpha(col,0.55));rg.addColorStop(1,_alpha(col,0));
  c.fillStyle=rg;c.beginPath();c.arc(cx,cy,r*1.5,0,Math.PI*2);c.fill();
  // 圆环
  c.strokeStyle=col;c.lineWidth=3;c.shadowColor=col;c.shadowBlur=24;
  c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
  c.shadowBlur=0;
  // 内圈虚线
  c.strokeStyle=_alpha(col,0.45);c.lineWidth=1;
  c.setLineDash([6,8]);c.beginPath();c.arc(cx,cy,r-14,0,Math.PI*2);c.stroke();
  c.setLineDash([]);
  // emoji (居中绘制)
  var ic=(window.classColors&&classColors[cls]&&classColors[cls].icon)||'🧬';
  c.font=(r*1.2)+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
  c.textAlign='center';c.textBaseline='middle';
  c.fillText(ic,cx,cy+4);
  c.restore();
}

function _statBar(c,x,y,w,label,val,max,col){
  _txt(c,label,x,y-6,{size:14,color:'#9aa',weight:'bold',font:'monospace'});
  _txt(c,String(val),x+w,y-6,{size:14,color:'#fff',weight:'bold',align:'right',font:'monospace'});
  // 槽底
  c.fillStyle='rgba(255,255,255,0.06)';
  _roundRect(c,x,y,w,8,4);c.fill();
  // 填充
  var pct=Math.max(0,Math.min(1,val/max));
  var grad=c.createLinearGradient(x,y,x+w*pct,y);
  grad.addColorStop(0,_alpha(col,0.4));grad.addColorStop(1,col);
  c.fillStyle=grad;
  _roundRect(c,x,y,w*pct,8,4);c.fill();
}

function _roundRect(c,x,y,w,h,r){
  c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
}

function _palette(cls){
  var cc=(window.classColors&&classColors[cls])||{primary:'#1ed8b0'};
  var col=cc.primary;
  return {
    primary:col,
    bgTop:'#0a0818',bgMid:'#15102a',bgBot:'#080614',
    glow1:col,glow2:'#5a3a8c',
    particle:col,
    seed:_hash(cls||'default')
  };
}

// ===== 结局海报 =====
function buildEndingPoster(cls,opts){
  opts=opts||{};
  var canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  var c=canvas.getContext('2d');
  var pal=_palette(cls);
  var cc=(window.classColors&&classColors[cls])||{primary:'#1ed8b0',name:cls,icon:'🧬'};
  var ending=(window.classEndings&&classEndings[cls])||{title:'结局',quote:'',subtitle:''};

  _drawBg(c,pal);
  _drawFrame(c,pal.primary);
  _logo(c,pal.primary);

  // 标题徽章
  _txt(c,_t('◈  结  局  ◈'),W/2,238,{size:18,weight:'bold',color:_alpha(pal.primary,0.7),align:'center',font:'monospace'});

  // 职业图腾
  _classGlyph(c,cls,W/2,400,120,pal.primary);

  // 结局名
  _txt(c,ending.title||'',W/2,580,{size:46,weight:'bold',color:'#fff',align:'center',glow:pal.primary,glowSize:20});
  _txt(c,cc.icon+'  '+_t(cc.name)+(ending.subtitle?'  ·  '+_t(ending.subtitle):''),W/2,624,{size:18,color:_alpha(pal.primary,0.85),align:'center'});

  // 引言（限 3 行）
  if(ending.quote){
    var qx=80,qy=720,qw=W-160;
    c.font='italic 22px "PingFang SC",sans-serif';
    var lines=_wrap(c,'"'+ending.quote+'"',qw).slice(0,3);
    lines.forEach(function(ln,i){
      _txt(c,ln,W/2,qy+i*36,{size:22,color:'#cfd6e0',align:'center',font:'italic "PingFang SC",sans-serif'});
    });
    qy+=lines.length*36+24;
  }

  // 数据卡片
  var p=(window.game&&game.player)||{};
  var floor=(window.game&&game.floor)||1;
  var cardY=900,cardH=240;
  c.fillStyle='rgba(255,255,255,0.04)';
  _roundRect(c,60,cardY,W-120,cardH,12);c.fill();
  c.strokeStyle=_alpha(pal.primary,0.4);c.lineWidth=1;
  _roundRect(c,60,cardY,W-120,cardH,12);c.stroke();

  _txt(c,_t('最 终 数 据'),W/2,cardY+34,{size:14,color:_alpha(pal.primary,0.7),align:'center',font:'monospace',weight:'bold'});

  // 楼层大字
  _txt(c,'F'+floor,W/2,cardY+108,{size:84,weight:'bold',color:'#fff',align:'center',glow:pal.primary,glowSize:14,font:'monospace'});
  _txt(c,_t('到达楼层'),W/2,cardY+138,{size:13,color:'#7d8294',align:'center',font:'monospace'});

  // 三条属性
  var bx=100,bw=W-200;
  _statBar(c,bx,cardY+178,bw,'HP',p.hp||0,p.maxHp||100,pal.primary);
  _statBar(c,bx,cardY+208,bw,'POL',p.pollution||0,100,'#ff006e');

  // 底部 hashtag
  _txt(c,'#你也是我  #YouAreMe',W/2,H-90,{size:18,color:_alpha(pal.primary,0.6),align:'center',weight:'bold',font:'monospace'});
  _txt(c,_t('我的结局——你的呢？'),W/2,H-58,{size:14,color:'#5a6178',align:'center'});

  return canvas;
}

// ===== 短局战绩海报 =====
function buildShortRunPoster(d){
  var canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  var c=canvas.getContext('2d');
  var cls=d.playerClass||(window.game&&game.player&&game.player.playerClass)||'titan';
  var pal=_palette(cls);pal.bgTop='#0a0818';pal.bgMid='#13183a';
  pal.glow1=pal.primary;pal.glow2='#1ed8b0';
  var cc=(window.classColors&&classColors[cls])||{primary:pal.primary,name:cls,icon:'🧬'};
  var isPollution=(d.cause||'').indexOf('污染')>=0||(d.cause||'').indexOf('覆写')>=0||d.causeIcon==='☢';
  var causeCol=isPollution?'#ff006e':'#1ed8b0';

  _drawBg(c,pal);
  var rating=d.rating||'?';
  var rTheme=_ratingTheme(rating);
  _drawRatingFrame(c,rTheme);
  _logo(c,rTheme.color);

  // 顶栏：迭代号（左）+ 职业（右）
  var iter=String(d.iteration||0);while(iter.length<3)iter='0'+iter;
  _txt(c,_t('迭代 #')+iter,W*0.28,232,{size:18,weight:'bold',color:_alpha(rTheme.color,0.85),align:'center',font:'monospace'});
  _txt(c,(cc.icon||'🧬')+' '+_t(cc.name||cls),W*0.72,232,{size:18,weight:'bold',color:'#cfd6e0',align:'center'});

  // 巨型评级字（垂直分层：rating → EVALUATION → score → SCORE，无重叠）
  var rSize=rating.length>=3?160:200;
  // S 系特效：双重描边 + 强光晕
  if(rTheme.tier>=1){
    _txt(c,rating,W/2,420,{size:rSize,weight:'bold',color:rTheme.color,align:'center',baseline:'middle',glow:rTheme.glow,glowSize:48,font:'"Trajan Pro",serif'});
    _txt(c,rating,W/2,420,{size:rSize,weight:'bold',color:'#fff',align:'center',baseline:'middle',glow:rTheme.color,glowSize:24,font:'"Trajan Pro",serif'});
  }else{
    _txt(c,rating,W/2,420,{size:rSize,weight:'bold',color:'#fff',align:'center',baseline:'middle',glow:rTheme.color,glowSize:32,font:'"Trajan Pro",serif'});
  }
  _txt(c,'EVALUATION',W/2,508,{size:13,color:_alpha(rTheme.color,0.7),align:'center',font:'monospace',weight:'bold'});

  // 分数
  _txt(c,String(d.score||0),W/2,548,{size:42,weight:'bold',color:'#1ed8b0',align:'center',baseline:'middle',glow:'#1ed8b0',glowSize:12,font:'monospace'});
  _txt(c,'SCORE',W/2,580,{size:12,color:'#5a6178',align:'center',font:'monospace'});

  // ===== 主数据卡 =====
  var cardY=600,cardH=440;
  c.fillStyle='rgba(255,255,255,0.04)';
  _roundRect(c,60,cardY,W-120,cardH,12);c.fill();
  c.strokeStyle=_alpha(pal.primary,0.35);c.lineWidth=1;
  _roundRect(c,60,cardY,W-120,cardH,12);c.stroke();

  // 顶部标题
  _txt(c,'· RUN  REPORT ·',W/2,cardY+30,{size:13,color:_alpha(pal.primary,0.7),align:'center',weight:'bold',font:'monospace'});

  // 四宫格基础数据
  var mm=Math.floor((d.dur||0)/60),ss=Math.floor((d.dur||0)%60);
  var ts=(mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss;
  var grid=[
    {ic:'⏱',label:_t('用时'),val:ts,col:'#9ad'},
    {ic:'🧬',label:_t('附身'),val:String(d.possessions||0),col:pal.primary},
    {ic:'💀',label:_t('击杀'),val:String(d.kills||0),col:'#ff006e'},
    {ic:'🏢',label:_t('楼层'),val:(d.floor||0)+'/12',col:'#ffd700'}
  ];
  for(var i=0;i<4;i++){
    var col=i%2,row=Math.floor(i/2);
    var gx=92+col*((W-184)/2),gy=cardY+62+row*92;
    var g=grid[i];
    _txt(c,g.ic,gx,gy+26,{size:28,align:'left'});
    _txt(c,g.val,gx+52,gy+28,{size:30,weight:'bold',color:'#fff',font:'monospace'});
    _txt(c,g.label,gx+52,gy+50,{size:11,color:'#7d8294',font:'monospace'});
  }

  // 12 层进度条
  var tlY=cardY+220;
  _txt(c,'TIMELINE  F1 → F12',92,tlY,{size:11,color:'#7d8294',font:'monospace',weight:'bold'});
  var tlX=92,tlW=W-184,tlBarH=12,gap=3;
  var cellW=(tlW-gap*11)/12;
  for(var fi=1;fi<=12;fi++){
    var reached=fi<=(d.floor||0);
    var color = reached ? (fi>=9?'#ff006e':fi>=5?'#ff8c00':'#1ed8b0') : 'rgba(255,255,255,0.06)';
    c.fillStyle=color;
    _roundRect(c,tlX+(fi-1)*(cellW+gap),tlY+10,cellW,tlBarH,2);c.fill();
    if(fi===1||fi===5||fi===9){
      _txt(c,fi===1?_t('第一浪'):fi===5?_t('第二浪'):_t('第三浪'),tlX+(fi-1)*(cellW+gap),tlY+38,{size:9,color:'#5a6178',font:'monospace'});
    }
  }

  // 污染条
  _statBar(c,92,tlY+62,W-184,'☢ MAX POLLUTION',d.maxPollution||0,100,'#ff006e');

  // ===== 战绩详情（最久宿主 + 最终形态） =====
  var dY=cardY+310;
  // 左：最久宿主
  c.fillStyle='rgba(255,255,255,0.03)';
  _roundRect(c,92,dY,(W-204)/2,108,8);c.fill();
  c.strokeStyle='rgba(255,255,255,0.06)';c.lineWidth=1;
  _roundRect(c,92,dY,(W-204)/2,108,8);c.stroke();
  _txt(c,'🏆 BEST HOST',104,dY+22,{size:11,color:_alpha(pal.primary,0.7),weight:'bold',font:'monospace'});
  _txt(c,(d.longestHost||_t('未知')).slice(0,8),104,dY+58,{size:22,weight:'bold',color:'#fff'});
  _txt(c,(d.longestDur||0)+_t('秒存活'),104,dY+86,{size:12,color:'#7d8294',font:'monospace'});
  // 右：最终形态
  var fx=92+(W-204)/2+20;
  c.fillStyle='rgba(255,255,255,0.03)';
  _roundRect(c,fx,dY,(W-204)/2,108,8);c.fill();
  c.strokeStyle='rgba(255,255,255,0.06)';c.lineWidth=1;
  _roundRect(c,fx,dY,(W-204)/2,108,8);c.stroke();
  _txt(c,'💀 FINAL FORM',fx+12,dY+22,{size:11,color:_alpha(causeCol,0.8),weight:'bold',font:'monospace'});
  _txt(c,(d.finalForm||_t('未知')).slice(0,8),fx+12,dY+58,{size:22,weight:'bold',color:'#fff'});
  _txt(c,_t(d.cause||''),fx+12,dY+86,{size:12,color:causeCol,font:'monospace'});

  // ===== 残响奖励 =====
  var eg=d.echoGain;
  if(eg&&eg.earned>0){
    var eY=cardY+cardH+18;
    c.fillStyle='rgba(165,92,255,0.08)';
    _roundRect(c,60,eY,W-120,72,10);c.fill();
    c.strokeStyle='rgba(165,92,255,0.45)';c.lineWidth=1;
    _roundRect(c,60,eY,W-120,72,10);c.stroke();
    _txt(c,'⛯',88,eY+44,{size:30,color:'#cdb6ff',glow:'#a55cff',glowSize:14});
    _txt(c,_t('ECHO · 残响'),132,eY+30,{size:11,color:'#a78bd8',weight:'bold',font:'monospace'});
    _txt(c,'+'+eg.earned,132,eY+58,{size:24,weight:'bold',color:'#cdb6ff',font:'monospace',glow:'#a55cff',glowSize:10});
    var bits=[_t('基础')+' '+eg.base];
    if(eg.clear>0) bits.push(_t('通关')+' +'+eg.clear);
    if(eg.daily>0) bits.push(_t('今日')+' +'+eg.daily);
    if(eg.milestone>0) bits.push(_t('里程碑')+' +'+eg.milestone);
    _txt(c,bits.join(' · '),W-80,eY+34,{size:11,color:'#888',align:'right',font:'monospace'});
    _txt(c,_t('累计')+' '+(eg.total||eg.earned),W-80,eY+56,{size:13,color:'#cdb6ff',align:'right',weight:'bold',font:'monospace'});
  }

  _txt(c,'#你也是我  #YouAreMe',W/2,H-86,{size:18,color:_alpha(pal.primary,0.6),align:'center',weight:'bold',font:'monospace'});
  _txt(c,_t('你也来一局？'),W/2,H-56,{size:14,color:'#5a6178',align:'center'});
  return canvas;
}

// ===== 成就海报 =====
function buildAchievementPoster(def){
  var canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  var c=canvas.getContext('2d');
  var pal={primary:'#ffd700',bgTop:'#1a1408',bgMid:'#2a1c08',bgBot:'#0a0804',glow1:'#ffd700',glow2:'#ff8800',particle:'#ffd700',seed:_hash(def.id||'ach')};

  _drawBg(c,pal);
  _drawFrame(c,pal.primary);
  _logo(c,pal.primary);

  _txt(c,_t('◈  成 就 解 锁  ◈'),W/2,240,{size:22,weight:'bold',color:_alpha(pal.primary,0.85),align:'center',font:'monospace'});

  // 大徽章
  c.save();
  var cx=W/2,cy=420,r=140;
  var rg=c.createRadialGradient(cx,cy,r*0.3,cx,cy,r*1.6);
  rg.addColorStop(0,_alpha(pal.primary,0.6));rg.addColorStop(1,_alpha(pal.primary,0));
  c.fillStyle=rg;c.beginPath();c.arc(cx,cy,r*1.6,0,Math.PI*2);c.fill();
  // 多边形徽章
  c.strokeStyle=pal.primary;c.lineWidth=4;c.shadowColor=pal.primary;c.shadowBlur=28;
  c.beginPath();
  for(var i=0;i<6;i++){var a=Math.PI/2+i*Math.PI/3;var px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}
  c.closePath();c.stroke();
  c.shadowBlur=0;
  // emoji
  c.font='150px "Apple Color Emoji","Segoe UI Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText(def.icon||'🏆',cx,cy+8);
  c.restore();

  _txt(c,def.name||'',W/2,640,{size:48,weight:'bold',color:'#fff',align:'center',glow:pal.primary,glowSize:20});

  if(def.desc){
    var lines=_wrap(c,def.desc,W-140).slice(0,2);
    lines.forEach(function(ln,i){_txt(c,ln,W/2,710+i*32,{size:20,color:'#cfd6e0',align:'center'});});
  }

  // 底部时间
  var dt=new Date();var pad=function(n){return n<10?'0'+n:n;};
  var ts=dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate())+' '+pad(dt.getHours())+':'+pad(dt.getMinutes());
  _txt(c,ts,W/2,950,{size:14,color:'#7d8294',align:'center',font:'monospace'});

  _txt(c,'#你也是我  #成就',W/2,H-90,{size:18,color:_alpha(pal.primary,0.6),align:'center',weight:'bold',font:'monospace'});
  return canvas;
}

// ===== 调用 Android 分享 / 浏览器降级 =====
function _doShare(canvas,text,filename){
  var dataUrl;try{dataUrl=canvas.toDataURL('image/png');}catch(e){addMsg(_t('海报生成失败'));return;}
  // Android Bridge
  if(window.Android&&typeof window.Android.shareImage==='function'){
    try{window.Android.shareImage(dataUrl,text||_t('你也是我'));addMsg('<span style="color:#1ed8b0">📷 '+_t('已生成海报，请选择分享渠道')+'</span>');return;}catch(e){}
  }
  // Web Share API（少数支持的浏览器）
  if(navigator.canShare&&window.fetch){
    fetch(dataUrl).then(function(r){return r.blob();}).then(function(blob){
      var file=new File([blob],(filename||'parasite-tower')+'.png',{type:'image/png'});
      if(navigator.canShare({files:[file]})){return navigator.share({files:[file],text:text||'',title:_t('你也是我')});}
      throw 0;
    }).catch(function(){_previewModal(dataUrl);});
    return;
  }
  // 降级：弹窗预览，长按保存
  _previewModal(dataUrl);
}

function _previewModal(dataUrl){
  var ev=document.getElementById('event-overlay');
  if(!ev)return;
  ev.style.display='flex';
  document.getElementById('event-title').textContent=_t('海报预览');
  document.getElementById('event-text').innerHTML='<div style="text-align:center;font-size:11px;color:#aaa;margin-bottom:8px">'+_t('长按图片即可保存到相册分享')+'</div><img src="'+dataUrl+'" style="width:100%;border:1px solid #333;border-radius:6px;display:block">';
  document.getElementById('event-choices').innerHTML='<button class="btn btn-secondary" onclick="closeEvent()">'+_t('关闭')+'</button>';
}

function shareEndingPoster(cls){
  var canvas=buildEndingPoster(cls);
  var ending=(window.classEndings&&classEndings[cls])||{};
  var text=_t('🌀 你也是我 · ')+(ending.title||_t('结局'))+' (F'+(window.game?game.floor:'?')+') #你也是我 #YouAreMe';
  _doShare(canvas,text,'pt-ending-'+cls);
}

function shareShortRunPoster(d){
  var canvas=buildShortRunPoster(d||{});
  var text=_t('🧬 你也是我 短局 · ')+(d?d.rating:'')+' '+(d?d.score:'')+' #你也是我 #YouAreMe';
  _doShare(canvas,text,'pt-shortrun');
}

function shareAchievementPoster(def){
  var canvas=buildAchievementPoster(def||{});
  var text=_t('🏆 你也是我 成就解锁：')+(def?def.name:'')+' #你也是我';
  _doShare(canvas,text,'pt-ach-'+(def&&def.id||'x'));
}

window.buildEndingPoster=buildEndingPoster;
window.buildShortRunPoster=buildShortRunPoster;
window.buildAchievementPoster=buildAchievementPoster;
window.shareEndingPoster=shareEndingPoster;
window.shareShortRunPoster=shareShortRunPoster;
window.shareAchievementPoster=shareAchievementPoster;
})();
