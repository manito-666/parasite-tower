// 解析SVG路径字符串为 Canvas 绘制指令（缓存）
var _silhouetteCache={};
function drawSilhouettePath(ctx2,d,ox,oy,scale){
  var k=d+'_'+scale;
  if(!_silhouetteCache[k]){
    var cmds=[];
    var re=/([MLQCZ])([\d.,\s-]*)/gi;
    var m;
    while((m=re.exec(d))!==null){
      var cmd=m[1].toUpperCase();
      var nums=m[2].trim().split(/[\s,]+/).map(Number).filter(function(n){return !isNaN(n);});
      cmds.push({c:cmd,n:nums});
    }
    _silhouetteCache[k]=cmds;
  }
  var cmds=_silhouetteCache[k];
  for(var i=0;i<cmds.length;i++){
    var c=cmds[i].c,n=cmds[i].n;
    if(c==='M'&&n.length>=2)ctx2.moveTo(ox+n[0]*scale,oy+n[1]*scale);
    else if(c==='L'&&n.length>=2)ctx2.lineTo(ox+n[0]*scale,oy+n[1]*scale);
    else if(c==='Q'&&n.length>=4)ctx2.quadraticCurveTo(ox+n[0]*scale,oy+n[1]*scale,ox+n[2]*scale,oy+n[3]*scale);
    else if(c==='C'&&n.length>=6)ctx2.bezierCurveTo(ox+n[0]*scale,oy+n[1]*scale,ox+n[2]*scale,oy+n[3]*scale,ox+n[4]*scale,oy+n[5]*scale);
    else if(c==='Z')ctx2.closePath();
  }
}

// 统一怪物剪影渲染（所有头像/图标共用此函数确保一致性）
function _drawSilIcon(c,type,w,h,hasBg){
  var sz=Math.min(w,h);
  if(hasBg){
    var bgG=c.createRadialGradient(w/2,h*0.45,0,w/2,h/2,sz*0.7);
    bgG.addColorStop(0,'#1a1030');bgG.addColorStop(1,'#0a0512');
    c.fillStyle=bgG;c.fillRect(0,0,w,h);
  }
  var sil=monsterSilhouettes[type];
  var tmpl=monsterTemplates[type];
  var color=(tmpl?tmpl.color:null)||'#8878aa';
  var glowCol=sil?sil.glow:color;
  if(sil){
    var bodyS=sz*0.78;
    var bx=(w-bodyS)/2,by=(h-bodyS)/2+sz*0.02;
    c.save();
    c.shadowColor=glowCol;c.shadowBlur=sz*0.18;
    var mg=c.createRadialGradient(w/2,h*0.42,bodyS*0.08,w/2,h*0.52,bodyS*0.55);
    mg.addColorStop(0,'rgba(255,255,255,0.5)');mg.addColorStop(0.3,color);mg.addColorStop(0.7,color);mg.addColorStop(1,'rgba(20,10,40,0.6)');
    c.fillStyle=mg;c.beginPath();drawSilhouettePath(c,sil.body,bx,by,bodyS);c.fill();
    c.restore();
    c.strokeStyle=glowCol;c.lineWidth=Math.max(1,sz/32);c.globalAlpha=0.85;
    c.beginPath();drawSilhouettePath(c,sil.body,bx,by,bodyS);c.stroke();
    c.globalAlpha=1;
    if(sil.extras){
      c.strokeStyle=glowCol;c.lineWidth=Math.max(0.8,sz/45);c.globalAlpha=0.6;
      for(var i=0;i<sil.extras.length;i++){c.beginPath();drawSilhouettePath(c,sil.extras[i].d,bx,by,bodyS);c.stroke();}
      c.globalAlpha=1;
    }
    if(sil.eye){
      c.save();c.shadowColor=glowCol;c.shadowBlur=sz*0.12;
      c.fillStyle='#fff';
      for(var i=0;i<sil.eye.length;i++){var ep=sil.eye[i];c.beginPath();c.arc(bx+ep[0]*bodyS,by+ep[1]*bodyS,Math.max(1.2,sz/18),0,Math.PI*2);c.fill();}
      c.fillStyle=glowCol;
      for(var i=0;i<sil.eye.length;i++){var ep=sil.eye[i];c.beginPath();c.arc(bx+ep[0]*bodyS,by+ep[1]*bodyS,Math.max(0.8,sz/28),0,Math.PI*2);c.fill();}
      c.restore();
    }
  }else{
    c.save();c.shadowColor=color;c.shadowBlur=sz*0.15;
    c.fillStyle=color;c.beginPath();c.arc(w/2,h/2,sz*0.28,0,Math.PI*2);c.fill();
    c.restore();
  }
}

// 在指定 canvas 元素上渲染怪物头像（战斗界面/形态栏通用）
function renderMonsterPortrait(canvasId,monster){
  var cv=document.getElementById(canvasId);
  if(!cv)return;
  var c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  _drawSilIcon(c,monster.type,cv.width,cv.height,true);
}

// 生成怪物类型的小图标 data URL（用于 img src）
var _monsterIconCache={};
function getMonsterIconDataURL(monsterType){
  if(_monsterIconCache[monsterType])return _monsterIconCache[monsterType];
  var sil=monsterSilhouettes[monsterType];
  if(!sil){_monsterIconCache[monsterType]='';return '';}
  var sz=64;
  var cv=document.createElement('canvas');cv.width=sz;cv.height=sz;
  var c=cv.getContext('2d');
  c.clearRect(0,0,sz,sz);
  _drawSilIcon(c,monsterType,sz,sz,false);
  _monsterIconCache[monsterType]=cv.toDataURL();
  return _monsterIconCache[monsterType];
}
function getFormIcon(type){
  var url=getMonsterIconDataURL(type);
  if(url)return '<img src="'+url+'" style="width:20px;height:20px;border-radius:3px;vertical-align:middle">';
  return formIcons[type]||'❓';
}
function getFormIconLg(type,w){
  w=w||32;
  var url=getMonsterIconDataURL(type);
  if(url)return '<img src="'+url+'" style="width:'+w+'px;height:'+w+'px;border-radius:4px;vertical-align:middle">';
  return '<span style="font-size:'+w+'px">'+(formIcons[type]||'❓')+'</span>';
}
