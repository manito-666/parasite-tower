// ================================================================
// 渲染系统：小地图 + drawPlayer/drawMonster + 静态层 + 瓦片纹理 + render主循环 + 粒子/浮字
// ================================================================
// === 小地图系统 ===
let _minimapExpanded=false;
let _minimapDirty=true;
function toggleMinimap(){
  _minimapExpanded=!_minimapExpanded;
  const mc=document.getElementById('minimap-canvas');
  if(_minimapExpanded){mc.width=130;mc.height=130;}
  else{mc.width=65;mc.height=65;}
  _minimapDirty=true;
  renderMinimap();
}
function renderMinimap(){
  if(!game||!game.tiles||game.tiles.length===0)return;
  const mc=document.getElementById('minimap-canvas');
  if(!mc)return;
  const mctx=mc.getContext('2d');
  const w=mc.width,h=mc.height;
  const cellW=w/13,cellH=h/13;
  const px=game.player.x,py=game.player.y;
  const FOG_RADIUS=6;
  const explored=game.explored[game.floor]||[];

  mctx.fillStyle='#080514';mctx.fillRect(0,0,w,h);

  for(let y=0;y<13;y++){
    for(let x=0;x<13;x++){
      const key=x+','+y;
      const isExplored=explored.indexOf(key)!==-1;
      const dist=Math.sqrt((x-px)*(x-px)+(y-py)*(y-py));
      const inView=dist<=FOG_RADIUS;

      if(!isExplored&&!inView)continue;

      const tile=game.tiles[y]?game.tiles[y][x]:0;
      const alpha=inView?1:0.4;
      mctx.globalAlpha=alpha;

      if(tile===0){mctx.fillStyle='#3d2860';}
      else if(tile===1){mctx.fillStyle='#110d20';}
      else if(tile===2){mctx.fillStyle='#00ffd0';} // 下楼梯
      else if(tile===6){mctx.fillStyle='#8844ff';} // 上楼梯
      else if(tile===3){mctx.fillStyle='#ff006e';} // 祭坛
      else if(tile===4){mctx.fillStyle='#b455ff';} // 事件
      else if(tile===5){mctx.fillStyle='#00ffd0';} // 资源
      else{mctx.fillStyle='#1a0e2e';}

      mctx.fillRect(x*cellW,y*cellH,cellW,cellH);
    }
  }

  // 怪物（视野内）
  mctx.globalAlpha=1;
  game.monsters.forEach(m=>{
    if(m.hp<=0||m.possessed)return;
    const _dx=m.x-px,_dy=m.y-py;
    if(_dx*_dx+_dy*_dy>FOG_RADIUS*FOG_RADIUS)return;
    mctx.fillStyle='#ff006e';
    mctx.fillRect(m.x*cellW+1,m.y*cellH+1,cellW-2,cellH-2);
  });

  // 玩家（闪烁）
  mctx.fillStyle=Date.now()%800<400?'#00ffd0':'#fff';
  mctx.fillRect(px*cellW,py*cellH,cellW,cellH);

  mctx.globalAlpha=1;
  _minimapDirty=false;
}

// === 绘制系统（生物朋克 × 新艺术运动）===
function drawPlayer(x,y,size){
const cx=x+size/2,cy=y+size/2;
const breathe=1+Math.sin(Date.now()/300)*0.04;
const r=size*0.35*breathe;
const p=game.player;
const cc=classColors[p.playerClass]||classColors.swarm;
ctx.save();
// 污染高时抖动
if(p.pollution>80)ctx.translate((Math.random()-0.5)*2,(Math.random()-0.5)*2);
// 地面生物发光影
ctx.fillStyle='rgba(0,255,208,0.12)';
ctx.beginPath();ctx.ellipse(cx,cy+r*1.1,r*0.8,r*0.2,0,0,Math.PI*2);ctx.fill();

// === 玩家可视化层：克制版（清晰优雅）===
{
  var _t=Date.now();
  var _hpPct=p.maxHp>0?p.hp/p.maxHp:1;
  var _critical=_hpPct<0.3;
  var _ultReady=(p.ultimateCooldown===0 && !p.ultimateActive);
  var _ultActive=!!p.ultimateActive;
  // 状态色：仅低血 / 终极激活时改色；终极就绪用职业色（不抢戏）
  var _stateColor=cc.glow;
  if(_critical) _stateColor='#ff3366';
  else if(_ultActive) _stateColor='#ff8800';
  var _period=_critical?280:520;
  var _pulse=0.5+0.5*Math.sin(_t/_period);
  // —— 落点扩散圆环（0.4s）——
  var _landAge=_t-(game._landingPulseAt||0);
  if(_landAge<400){
    var _lp=_landAge/400;
    ctx.globalAlpha=(1-_lp)*0.55;
    ctx.strokeStyle=_stateColor;ctx.lineWidth=1.6-_lp*1.2;
    ctx.beginPath();ctx.arc(cx,cy+r*0.7,r*0.4+_lp*r*1.0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
  }
  // —— 外层柔光：极轻，仅用于"活着"的呼吸感 ——
  ctx.globalAlpha=0.08+_pulse*0.08;
  ctx.fillStyle=_stateColor;
  ctx.beginPath();ctx.arc(cx,cy,r*(1.6+_pulse*0.15),0,Math.PI*2);
  ctx.arc(cx,cy,r*1.05,0,Math.PI*2,true);
  ctx.fill();
  ctx.globalAlpha=1;
  // —— 单层细描边（清晰轮廓基线）——
  ctx.strokeStyle=_stateColor;ctx.lineWidth=1.2;
  ctx.shadowColor=_stateColor;ctx.shadowBlur=6+_pulse*4;
  ctx.globalAlpha=0.35+_pulse*0.25;
  ctx.beginPath();ctx.arc(cx,cy,r*1.12,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=0;ctx.globalAlpha=1;
  // —— 护盾：细青环（仅有护盾时出现）——
  if(p.armor>0){
    ctx.strokeStyle='rgba(0,220,255,0.4)';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(cx,cy,r*1.28,0,Math.PI*2);ctx.stroke();
  }
  // —— 终极激活：橙色高频环（仅激活时，让"释放中"明显）——
  if(_ultActive){
    var _aP=0.5+0.5*Math.sin(_t/180);
    ctx.strokeStyle='rgba(255,140,40,'+(0.45+_aP*0.4)+')';ctx.lineWidth=1.8;
    ctx.shadowColor='#ff8c28';ctx.shadowBlur=8+_aP*6;
    ctx.beginPath();ctx.arc(cx,cy,r*(1.0+_aP*0.1),0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
  }
  // —— 头顶箭头（小而清晰，最强识别）——
  var _bobY=Math.sin(_t/420)*1.2;
  ctx.fillStyle=cc.glow;
  ctx.shadowColor=cc.glow;ctx.shadowBlur=4;
  ctx.beginPath();
  ctx.moveTo(cx,cy-r*1.35+_bobY);
  ctx.lineTo(cx-r*0.14,cy-r*1.62+_bobY);
  ctx.lineTo(cx+r*0.14,cy-r*1.62+_bobY);
  ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;
  // —— 终极就绪：仅在箭头旁加一颗暖色小点（克制）——
  if(_ultReady){
    var _eP=0.5+0.5*Math.sin(_t/400);
    ctx.fillStyle='rgba(255,180,80,'+(0.5+_eP*0.4)+')';
    ctx.shadowColor='#ffb340';ctx.shadowBlur=4;
    ctx.beginPath();ctx.arc(cx+r*0.32,cy-r*1.42+_bobY,2,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
}

if(p.playerClass==='titan'){
  // 泰坦：岩石巨人（致敬 Dota1 山顶巨人 Tiny）
  // 多块岩石板甲堆叠身体 + 岩缝青苔 + 粗壮石拳 + 短粗石腿
  const pulse2=Math.sin(Date.now()/700)*0.04+0.96;
  const t2=Date.now();
  ctx.shadowColor=cc.glow;ctx.shadowBlur=8*pulse2;
  const bW=r*1.1,bH=r*1.0; // 身体宽高（梯形：肩宽脚窄）
  const bTop=cy-bH*0.5,bBot=cy+bH*0.5;
  // --- 石腿（先画，在身体下面）---
  const legW=r*0.24,legH=r*0.38;
  ctx.shadowBlur=2;
  const legGrad=ctx.createLinearGradient(0,bBot-2,0,bBot+legH);
  legGrad.addColorStop(0,'#6a7d8e');legGrad.addColorStop(0.5,'#556b7a');legGrad.addColorStop(1,'#3a4d5c');
  ctx.fillStyle=legGrad;
  // 左腿
  ctx.beginPath();ctx.moveTo(cx-bW*0.28-legW*0.1,bBot-2);ctx.lineTo(cx-bW*0.28+legW,bBot-2);
  ctx.lineTo(cx-bW*0.28+legW*0.8,bBot+legH);ctx.lineTo(cx-bW*0.28+legW*0.1,bBot+legH);ctx.closePath();ctx.fill();
  // 右腿
  ctx.beginPath();ctx.moveTo(cx+bW*0.28-legW,bBot-2);ctx.lineTo(cx+bW*0.28+legW*0.1,bBot-2);
  ctx.lineTo(cx+bW*0.28-legW*0.1,bBot+legH);ctx.lineTo(cx+bW*0.28-legW*0.8,bBot+legH);ctx.closePath();ctx.fill();
  // 腿部裂纹
  ctx.strokeStyle='rgba(20,30,40,0.4)';ctx.lineWidth=0.6;ctx.shadowBlur=0;
  ctx.beginPath();ctx.moveTo(cx-bW*0.22,bBot+legH*0.3);ctx.lineTo(cx-bW*0.16,bBot+legH*0.7);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+bW*0.16,bBot+legH*0.25);ctx.lineTo(cx+bW*0.22,bBot+legH*0.65);ctx.stroke();
  // --- 石臂（先画，在身体后面）---
  const armW=r*0.28,armL=r*0.55;
  const armY=cy-bH*0.15; // 肩部位置
  ctx.shadowColor=cc.glow;ctx.shadowBlur=4;
  // 左臂（向左上微抬，拳头姿态）
  const laAngle=-0.4+Math.sin(t2/900)*0.06;
  ctx.save();ctx.translate(cx-bW*0.45,armY);ctx.rotate(laAngle);
  const laGrad=ctx.createLinearGradient(0,0,-armL,0);
  laGrad.addColorStop(0,'#6a7d8e');laGrad.addColorStop(0.6,'#556b7a');laGrad.addColorStop(1,'#4a6070');
  ctx.fillStyle=laGrad;
  ctx.beginPath();ctx.moveTo(0,-armW*0.5);ctx.lineTo(-armL*0.7,-armW*0.55);
  ctx.lineTo(-armL,-armW*0.3);ctx.lineTo(-armL,armW*0.3);
  ctx.lineTo(-armL*0.7,armW*0.55);ctx.lineTo(0,armW*0.5);ctx.closePath();ctx.fill();
  // 左拳（大石拳）
  ctx.fillStyle='#5a6d7e';
  ctx.beginPath();ctx.arc(-armL,0,armW*0.55,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(200,220,240,0.2)';
  ctx.beginPath();ctx.arc(-armL-armW*0.1,-armW*0.15,armW*0.2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(20,30,40,0.35)';ctx.lineWidth=0.5;ctx.shadowBlur=0;
  ctx.beginPath();ctx.moveTo(-armL*0.3,-armW*0.1);ctx.lineTo(-armL*0.7,armW*0.1);ctx.stroke();
  ctx.restore();
  // 右臂（向右上微抬）
  const raAngle=0.4-Math.sin(t2/900)*0.06;
  ctx.save();ctx.translate(cx+bW*0.45,armY);ctx.rotate(raAngle);
  const raGrad=ctx.createLinearGradient(0,0,armL,0);
  raGrad.addColorStop(0,'#6a7d8e');raGrad.addColorStop(0.6,'#556b7a');raGrad.addColorStop(1,'#4a6070');
  ctx.fillStyle=raGrad;
  ctx.beginPath();ctx.moveTo(0,-armW*0.5);ctx.lineTo(armL*0.7,-armW*0.55);
  ctx.lineTo(armL,-armW*0.3);ctx.lineTo(armL,armW*0.3);
  ctx.lineTo(armL*0.7,armW*0.55);ctx.lineTo(0,armW*0.5);ctx.closePath();ctx.fill();
  // 右拳
  ctx.fillStyle='#5a6d7e';
  ctx.beginPath();ctx.arc(armL,0,armW*0.55,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(200,220,240,0.2)';
  ctx.beginPath();ctx.arc(armL+armW*0.1,-armW*0.15,armW*0.2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(20,30,40,0.35)';ctx.lineWidth=0.5;ctx.shadowBlur=0;
  ctx.beginPath();ctx.moveTo(armL*0.3,-armW*0.1);ctx.lineTo(armL*0.7,armW*0.1);ctx.stroke();
  ctx.restore();
  // --- 身体：多块岩石板甲堆叠（梯形轮廓）---
  ctx.shadowColor=cc.glow;ctx.shadowBlur=6*pulse2;
  const bodyGrad=ctx.createLinearGradient(cx,bTop,cx,bBot);
  bodyGrad.addColorStop(0,'#7a8e9e');bodyGrad.addColorStop(0.3,'#6a7d8e');bodyGrad.addColorStop(0.7,'#556b7a');bodyGrad.addColorStop(1,'#3a4d5c');
  ctx.fillStyle=bodyGrad;
  // 梯形身体（上宽下窄）
  ctx.beginPath();
  ctx.moveTo(cx-bW*0.48,bTop+bH*0.15);
  ctx.lineTo(cx+bW*0.48,bTop+bH*0.15);
  ctx.lineTo(cx+bW*0.35,bBot);
  ctx.lineTo(cx-bW*0.35,bBot);
  ctx.closePath();ctx.fill();
  // 肩甲石板（左右两块突出的厚石板）
  ctx.fillStyle='#6a7d8e';
  ctx.beginPath();ctx.moveTo(cx-bW*0.55,bTop+bH*0.08);ctx.lineTo(cx-bW*0.1,bTop+bH*0.05);
  ctx.lineTo(cx-bW*0.15,bTop+bH*0.28);ctx.lineTo(cx-bW*0.52,bTop+bH*0.32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(cx+bW*0.55,bTop+bH*0.08);ctx.lineTo(cx+bW*0.1,bTop+bH*0.05);
  ctx.lineTo(cx+bW*0.15,bTop+bH*0.28);ctx.lineTo(cx+bW*0.52,bTop+bH*0.32);ctx.closePath();ctx.fill();
  // 胸甲中央石板
  ctx.fillStyle='#728598';
  ctx.beginPath();ctx.moveTo(cx-bW*0.22,bTop+bH*0.2);ctx.lineTo(cx+bW*0.22,bTop+bH*0.2);
  ctx.lineTo(cx+bW*0.18,bTop+bH*0.55);ctx.lineTo(cx-bW*0.18,bTop+bH*0.55);ctx.closePath();ctx.fill();
  // 腹部石板
  ctx.fillStyle='#5e7080';
  ctx.beginPath();ctx.moveTo(cx-bW*0.25,bTop+bH*0.52);ctx.lineTo(cx+bW*0.25,bTop+bH*0.52);
  ctx.lineTo(cx+bW*0.3,bTop+bH*0.82);ctx.lineTo(cx-bW*0.3,bTop+bH*0.82);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;
  // 石块高光（左上角反光）
  const hiGrad=ctx.createRadialGradient(cx-bW*0.2,bTop+bH*0.15,0,cx-bW*0.2,bTop+bH*0.15,bW*0.4);
  hiGrad.addColorStop(0,'rgba(200,225,245,0.3)');hiGrad.addColorStop(1,'rgba(200,225,245,0)');
  ctx.fillStyle=hiGrad;
  ctx.beginPath();ctx.moveTo(cx-bW*0.48,bTop+bH*0.15);ctx.lineTo(cx+bW*0.48,bTop+bH*0.15);
  ctx.lineTo(cx+bW*0.35,bBot);ctx.lineTo(cx-bW*0.35,bBot);ctx.closePath();ctx.fill();
  // 石板缝隙线（岩石纹理）
  ctx.strokeStyle='rgba(15,25,35,0.45)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(cx-bW*0.35,bTop+bH*0.28);ctx.lineTo(cx+bW*0.38,bTop+bH*0.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-bW*0.3,bTop+bH*0.53);ctx.lineTo(cx+bW*0.32,bTop+bH*0.52);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-bW*0.1,bTop+bH*0.15);ctx.lineTo(cx-bW*0.05,bTop+bH*0.55);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+bW*0.12,bTop+bH*0.2);ctx.lineTo(cx+bW*0.08,bTop+bH*0.52);ctx.stroke();
  // 岩缝青苔（绿色点缀——Tiny标志性苔藓）
  ctx.fillStyle='rgba(80,140,70,0.5)';
  ctx.beginPath();ctx.ellipse(cx-bW*0.25,bTop+bH*0.29,bW*0.08,bH*0.025,0.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+bW*0.15,bTop+bH*0.53,bW*0.06,bH*0.02,-0.15,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx-bW*0.05,bTop+bH*0.54,bW*0.05,bH*0.018,0.1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(60,120,55,0.4)';
  ctx.beginPath();ctx.ellipse(cx+bW*0.3,bTop+bH*0.3,bW*0.05,bH*0.015,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx-bW*0.18,bTop+bH*0.53,bW*0.04,bH*0.015,-0.2,0,Math.PI*2);ctx.fill();
  // --- 头部：小石头脑袋（嵌在肩甲之间）---
  const headR=r*0.22;
  const headY=bTop+bH*0.06;
  const headGrad=ctx.createRadialGradient(cx-headR*0.3,headY-headR*0.3,headR*0.1,cx,headY,headR);
  headGrad.addColorStop(0,'#8ea8b8');headGrad.addColorStop(0.6,'#6a7d8e');headGrad.addColorStop(1,'#4a5d6e');
  ctx.fillStyle=headGrad;
  ctx.beginPath();ctx.arc(cx,headY,headR,0,Math.PI*2);ctx.fill();
  // 头部裂纹
  ctx.strokeStyle='rgba(15,25,35,0.4)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.moveTo(cx-headR*0.3,headY-headR*0.5);ctx.lineTo(cx+headR*0.1,headY+headR*0.3);ctx.stroke();
  // --- 眼睛：石缝中的荧光眼 ---
  ctx.shadowColor=cc.glow;ctx.shadowBlur=5;
  ctx.fillStyle=cc.glow;
  ctx.beginPath();ctx.ellipse(cx-headR*0.35,headY+headR*0.05,headR*0.22,headR*0.13,-0.1,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+headR*0.35,headY+headR*0.05,headR*0.22,headR*0.13,0.1,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // 瞳孔
  ctx.fillStyle='#0a1520';
  ctx.beginPath();ctx.arc(cx-headR*0.35,headY+headR*0.08,headR*0.08,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+headR*0.35,headY+headR*0.08,headR*0.08,0,Math.PI*2);ctx.fill();
  // 嘴（一条暗线）
  ctx.strokeStyle='rgba(15,25,35,0.5)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(cx-headR*0.25,headY+headR*0.45);
  ctx.quadraticCurveTo(cx,headY+headR*0.55,cx+headR*0.25,headY+headR*0.45);ctx.stroke();
  // --- 荧光菌脉（生物朋克元素）---
  ctx.shadowColor=cc.glow;ctx.shadowBlur=3;
  ctx.strokeStyle='rgba(0,200,255,0.2)';ctx.lineWidth=0.7;
  ctx.beginPath();ctx.moveTo(cx-bW*0.3,bTop+bH*0.4);
  ctx.quadraticCurveTo(cx,bTop+bH*0.6,cx+bW*0.25,bTop+bH*0.75);ctx.stroke();
  ctx.strokeStyle='rgba(0,255,208,0.15)';
  ctx.beginPath();ctx.moveTo(cx+bW*0.2,bTop+bH*0.25);
  ctx.quadraticCurveTo(cx+bW*0.1,bTop+bH*0.5,cx-bW*0.15,bTop+bH*0.7);ctx.stroke();
  ctx.shadowBlur=0;
  // 外轮廓荧光描边
  ctx.strokeStyle=cc.glow;ctx.lineWidth=1.2;ctx.shadowColor=cc.glow;ctx.shadowBlur=6*pulse2;ctx.globalAlpha=0.4;
  ctx.beginPath();ctx.moveTo(cx-bW*0.48,bTop+bH*0.15);ctx.lineTo(cx+bW*0.48,bTop+bH*0.15);
  ctx.lineTo(cx+bW*0.35,bBot);ctx.lineTo(cx-bW*0.35,bBot);ctx.closePath();ctx.stroke();
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  // 装甲条（生物膜质）
  if(p.armor>0){
    ctx.fillStyle='rgba(0,200,255,0.4)';
    const armorPct=Math.min(1,p.armor/100);
    ctx.fillRect(cx-bW*0.4,bBot+legH+2,bW*0.8*armorPct,3);
    ctx.strokeStyle='rgba(0,255,208,0.3)';ctx.lineWidth=0.5;ctx.strokeRect(cx-bW*0.4,bBot+legH+2,bW*0.8,3);
  }
}else if(p.playerClass==='ghost'){
  // 幽灵：半透明凝胶体 + 虹彩薄膜
  ctx.globalAlpha=p.stealthActive?0.25+Math.sin(Date.now()/200)*0.15:0.7;
  const ghGrad=ctx.createRadialGradient(cx,cy-r*0.2,r*0.1,cx,cy,r);
  ghGrad.addColorStop(0,'rgba(255,255,255,0.8)');ghGrad.addColorStop(0.2,cc.highlight);ghGrad.addColorStop(0.7,cc.primary);ghGrad.addColorStop(1,'rgba(45,27,78,0.5)');
  // 凝胶轮廓（发光描边）
  ctx.strokeStyle=cc.glow;ctx.lineWidth=1.5;ctx.shadowColor=cc.glow;ctx.shadowBlur=8;
  ctx.beginPath();ctx.moveTo(cx,cy-r);
  ctx.quadraticCurveTo(cx+r,cy-r*0.3,cx+r*0.7,cy+r*0.5);
  ctx.quadraticCurveTo(cx+r*0.3,cy+r,cx,cy+r*0.8);
  ctx.quadraticCurveTo(cx-r*0.3,cy+r,cx-r*0.7,cy+r*0.5);
  ctx.quadraticCurveTo(cx-r,cy-r*0.3,cx,cy-r);ctx.stroke();
  ctx.shadowBlur=0;
  // 填充
  ctx.fillStyle=ghGrad;
  ctx.beginPath();ctx.moveTo(cx,cy-r);
  ctx.quadraticCurveTo(cx+r,cy-r*0.3,cx+r*0.7,cy+r*0.5);
  ctx.quadraticCurveTo(cx+r*0.3,cy+r,cx,cy+r*0.8);
  ctx.quadraticCurveTo(cx-r*0.3,cy+r,cx-r*0.7,cy+r*0.5);
  ctx.quadraticCurveTo(cx-r,cy-r*0.3,cx,cy-r);ctx.fill();
  // 虹彩残影
  const iridHue=(Date.now()/20)%360;
  ctx.fillStyle='hsla('+iridHue+',100%,70%,0.08)';
  ctx.beginPath();ctx.arc(cx-r*0.4,cy+r*0.6,r*0.35,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+r*0.3,cy+r*0.5,r*0.25,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=p.stealthActive?0.5:0.9;
  // 发光眼
  ctx.shadowColor=cc.glow;ctx.shadowBlur=4;
  ctx.fillStyle=cc.glow;
  ctx.beginPath();ctx.arc(cx-r*0.2,cy-r*0.2,r*0.12,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+r*0.2,cy-r*0.2,r*0.12,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='#222040';
  ctx.beginPath();ctx.arc(cx-r*0.2,cy-r*0.2,r*0.05,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+r*0.2,cy-r*0.2,r*0.05,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  // 虹彩拖尾粒子
  if(Math.random()<0.3){
    const iH=(Date.now()/15)%360;
    spawnParticle(cx+(Math.random()-0.5)*r,cy+r*0.3+Math.random()*r*0.5,'hsla('+iH+',100%,70%,0.3)',
      (Math.random()-0.5)*0.5,0.3+Math.random()*0.5,0.025,1+Math.random(),2);
  }
}else{
  // 虫群：核心体 + 寄生触手 + 生物发光
  const swGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,r*0.8);
  swGrad.addColorStop(0,'rgba(255,255,255,0.9)');swGrad.addColorStop(0.2,cc.highlight);swGrad.addColorStop(0.7,cc.primary);swGrad.addColorStop(1,'#0d1a14');
  // 发光描边
  ctx.strokeStyle=cc.glow;ctx.lineWidth=1.5;ctx.shadowColor=cc.glow;ctx.shadowBlur=6;
  ctx.beginPath();ctx.moveTo(cx,cy-r*0.7);
  ctx.quadraticCurveTo(cx+r*0.8,cy-r*0.3,cx+r*0.6,cy+r*0.4);
  ctx.quadraticCurveTo(cx+r*0.2,cy+r*0.8,cx,cy+r*0.7);
  ctx.quadraticCurveTo(cx-r*0.2,cy+r*0.8,cx-r*0.6,cy+r*0.4);
  ctx.quadraticCurveTo(cx-r*0.8,cy-r*0.3,cx,cy-r*0.7);ctx.stroke();
  ctx.shadowBlur=0;
  // 填充
  ctx.fillStyle=swGrad;
  ctx.beginPath();ctx.moveTo(cx,cy-r*0.7);
  ctx.quadraticCurveTo(cx+r*0.8,cy-r*0.3,cx+r*0.6,cy+r*0.4);
  ctx.quadraticCurveTo(cx+r*0.2,cy+r*0.8,cx,cy+r*0.7);
  ctx.quadraticCurveTo(cx-r*0.2,cy+r*0.8,cx-r*0.6,cy+r*0.4);
  ctx.quadraticCurveTo(cx-r*0.8,cy-r*0.3,cx,cy-r*0.7);ctx.fill();
  // 发光眼
  ctx.shadowColor=cc.glow;ctx.shadowBlur=3;
  ctx.fillStyle=cc.glow;
  ctx.beginPath();ctx.arc(cx-r*0.15,cy-r*0.15,r*0.1,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+r*0.15,cy-r*0.15,r*0.1,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='#222040';
  ctx.beginPath();ctx.arc(cx-r*0.15,cy-r*0.15,r*0.04,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx+r*0.15,cy-r*0.15,r*0.04,0,Math.PI*2);ctx.fill();
  // 寄生触手（生物发光）
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2+Date.now()/800;
    ctx.strokeStyle=cc.glow;ctx.lineWidth=1.5;ctx.globalAlpha=0.5;
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.quadraticCurveTo(cx+Math.cos(a)*r*0.5,cy+Math.sin(a)*r*0.5,cx+Math.cos(a)*r*0.8,cy+Math.sin(a)*r*0.8);
    ctx.stroke();
    ctx.fillStyle=cc.primary;
    ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*0.7,cy+Math.sin(a)*r*0.7,r*0.12,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
  // 分身发光点
  const alive=p.swarms.filter(s=>s.hp>0);
  if(alive.length>0){
    ctx.fillStyle='rgba(0,255,208,0.6)';
    alive.forEach((s,i)=>{
      const sa=i*Math.PI*2/alive.length+Date.now()/600;
      ctx.beginPath();ctx.arc(cx+Math.cos(sa)*r*1.3,cy+Math.sin(sa)*r*1.3,2,0,Math.PI*2);ctx.fill();
    });
  }
}

// 能量光环（生物荧光粒子）
for(let ei=0;ei<4;ei++){
  const ea=ei*Math.PI/2+Date.now()/700;
  const eA=0.2+0.2*Math.sin(Date.now()/500+ei);
  ctx.globalAlpha=eA;ctx.fillStyle=cc.glow;
  ctx.beginPath();ctx.arc(cx+Math.cos(ea)*r*1.1,cy+Math.sin(ea)*r*1.1,2,0,Math.PI*2);ctx.fill();
}
ctx.globalAlpha=1;
// 方向指示（加描边）
ctx.shadowBlur=0;
const dirs={up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0};
const angle=dirs[p.lastDir]||dirs.down;
ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.lineJoin='round';
ctx.beginPath();
ctx.moveTo(cx+Math.cos(angle)*r*0.9,cy+Math.sin(angle)*r*0.9);
ctx.lineTo(cx+Math.cos(angle+0.6)*r*0.5,cy+Math.sin(angle+0.6)*r*0.5);
ctx.lineTo(cx+Math.cos(angle-0.6)*r*0.5,cy+Math.sin(angle-0.6)*r*0.5);
ctx.closePath();ctx.stroke();
ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fill();
// 污染虹彩微光
if(p.pollution>40&&p.pollution<=70){
  ctx.strokeStyle='rgba(180,85,255,0.25)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(cx,cy,r*0.9,0,Math.PI*2);ctx.stroke();
}
if(p.pollution>70){
  const pRA=0.3+0.2*Math.sin(Date.now()/300);
  ctx.strokeStyle='rgba(255,0,110,'+pRA+')';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(cx,cy,r*1.1,0,Math.PI*2);ctx.stroke();
}
// 污染侵蚀（高污染时像素缺失）
if(p.pollution>70){
ctx.globalCompositeOperation='destination-out';
for(let i=0;i<3;i++){
ctx.beginPath();ctx.arc(cx+(Math.random()-0.5)*r*1.5,cy+(Math.random()-0.5)*r*1.5,2+Math.random()*2,0,Math.PI*2);ctx.fill();
}
ctx.globalCompositeOperation='source-over';
}
ctx.restore();
}

function drawMonster(m,x,y,size){
var cx=x+size/2,cy=y+size/2;
var hpRatio=m.hp/m.maxHp;
var s=size*0.8;
var _isBoss=m.type&&m.type.startsWith('boss');
var sil=monsterSilhouettes[m.type];
var zone=monsterTemplates[m.type]?monsterTemplates[m.type].zone:1;
var color=m.color||'#8878aa';
ctx.save();
// Boss脉动光环
if(_isBoss){
  var pulse=0.5+0.5*Math.sin(Date.now()/400);
  var auraR=s*0.6+pulse*s*0.15;
  var auraGrad=ctx.createRadialGradient(cx,cy,s*0.2,cx,cy,auraR);
  auraGrad.addColorStop(0,'rgba(255,0,60,'+(.25+pulse*0.15)+')');
  auraGrad.addColorStop(0.5,'rgba(255,40,0,'+(.12+pulse*0.08)+')');
  auraGrad.addColorStop(1,'rgba(255,0,0,0)');
  ctx.fillStyle=auraGrad;ctx.beginPath();ctx.arc(cx,cy,auraR,0,Math.PI*2);ctx.fill();
  var ang=Date.now()/600;
  ctx.strokeStyle='rgba(255,60,30,'+(0.3+pulse*0.2)+')';ctx.lineWidth=1.5;ctx.shadowColor='#ff0033';ctx.shadowBlur=6;
  ctx.beginPath();ctx.arc(cx,cy,s*0.55,ang,ang+Math.PI*0.6);ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,s*0.55,ang+Math.PI,ang+Math.PI*1.6);ctx.stroke();
  ctx.shadowBlur=0;
}
// 残血颤抖
if(hpRatio<0.3){ctx.translate((Math.random()-0.5)*2,(Math.random()-0.5)*2);ctx.globalAlpha=0.7+Math.random()*0.3;}
// T4相位透明效果
if(zone===4)ctx.globalAlpha=Math.max(0.3,ctx.globalAlpha*(0.55+Math.sin(Date.now()/350)*0.2));
// 投影
ctx.fillStyle='rgba(180,85,255,0.12)';ctx.beginPath();ctx.ellipse(cx,cy+s*0.42,s*0.3,s*0.1,0,0,Math.PI*2);ctx.fill();
// 主体剪影
var mLight=typeof lightenColor==='function'?lightenColor(color,40):color;
var glowCol=sil?sil.glow:color;
if(sil){
  var bodyS=s*1.025;
  var bx=cx-bodyS/2,by=cy-bodyS/2;
  // 渐变填充
  var mg=ctx.createRadialGradient(cx-bodyS*0.05,cy-bodyS*0.08,0,cx,cy,bodyS*0.5);
  mg.addColorStop(0,'rgba(255,255,255,0.7)');mg.addColorStop(0.3,mLight);mg.addColorStop(0.8,color);mg.addColorStop(1,'rgba(45,27,78,0.5)');
  // 发光描边
  ctx.shadowColor=glowCol;ctx.shadowBlur=zone<=2?6:zone<=4?8:12;
  ctx.strokeStyle=glowCol;ctx.lineWidth=zone<=2?1.5:2;
  ctx.beginPath();drawSilhouettePath(ctx,sil.body,bx,by,bodyS);ctx.stroke();
  ctx.shadowBlur=0;
  ctx.fillStyle=mg;ctx.beginPath();drawSilhouettePath(ctx,sil.body,bx,by,bodyS);ctx.fill();
  // 附加元素（触须/翅膀/角等）
  if(sil.extras){
    var t=Date.now()/1000;
    for(var ei=0;ei<sil.extras.length;ei++){
      var ex=sil.extras[ei];
      var exAlpha=0.6;
      if(ex.type==='wisp'||ex.type==='smoke')exAlpha=0.3+0.2*Math.sin(t+ei);
      ctx.strokeStyle=glowCol;ctx.lineWidth=1.2;ctx.globalAlpha=Math.min(1,ctx.globalAlpha)*exAlpha;
      ctx.shadowColor=glowCol;ctx.shadowBlur=3;
      ctx.beginPath();drawSilhouettePath(ctx,ex.d,bx,by,bodyS);ctx.stroke();
      ctx.shadowBlur=0;ctx.globalAlpha=hpRatio<0.3?(0.7+Math.random()*0.3):zone===4?(0.55+Math.sin(Date.now()/350)*0.2):1;
    }
  }
  // 眼睛（发光点）
  if(sil.eye){
    ctx.shadowColor=glowCol;ctx.shadowBlur=4;ctx.fillStyle=glowCol;
    for(var eyi=0;eyi<sil.eye.length;eyi++){
      var ep=sil.eye[eyi];
      var er=zone<=2?s/11:zone<=4?s/12:s/14;
      var eyeX=bx+ep[0]*bodyS,eyeY=by+ep[1]*bodyS;
      ctx.beginPath();ctx.arc(eyeX,eyeY,er,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // 瞳孔
    ctx.fillStyle='#222040';
    for(var eyi=0;eyi<sil.eye.length;eyi++){
      var ep=sil.eye[eyi];
      var eyeX=bx+ep[0]*bodyS,eyeY=by+ep[1]*bodyS;
      ctx.beginPath();ctx.arc(eyeX+1,eyeY,s/22,0,Math.PI*2);ctx.fill();
    }
  }
  // T4 能量环
  if(zone===4){
    var ringHue=(Date.now()/25)%360;
    ctx.strokeStyle='hsla('+ringHue+',100%,70%,0.3)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,bodyS*0.55,0,Math.PI*2);ctx.stroke();
  }
  // T5 旋转触手光环
  if(zone>=5){
    ctx.lineCap='round';
    for(var ti=0;ti<4;ti++){
      var ta=ti*Math.PI*2/4+Date.now()/800;
      var tLen=bodyS*0.5;
      var tHue=(Date.now()/20+ti*90)%360;
      ctx.strokeStyle='hsla('+tHue+',80%,60%,0.35)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(ta)*bodyS*0.35,cy+Math.sin(ta)*bodyS*0.35);
      ctx.quadraticCurveTo(cx+Math.cos(ta+0.3)*tLen*0.7,cy+Math.sin(ta+0.3)*tLen*0.7,cx+Math.cos(ta)*tLen,cy+Math.sin(ta)*tLen);
      ctx.stroke();
    }
    ctx.lineCap='butt';
  }
}else{
  // 无剪影数据的后备：简单圆形
  var mg=ctx.createRadialGradient(cx,cy-s*0.05,0,cx,cy,s/3);
  mg.addColorStop(0,'rgba(255,255,255,0.7)');mg.addColorStop(0.5,color);mg.addColorStop(1,'rgba(45,27,78,0.5)');
  ctx.shadowColor=color;ctx.shadowBlur=6;ctx.strokeStyle=color;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(cx,cy,s/3,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle=mg;ctx.beginPath();ctx.arc(cx,cy,s/3,0,Math.PI*2);ctx.fill();
}
// 头顶HP条
ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.globalAlpha=1;
if(m._displayHp===undefined)m._displayHp=m.hp;
if(m._displayHp>m.hp)m._displayHp=Math.max(m.hp,m._displayHp-Math.max(1,m.maxHp*0.03));
else if(m._displayHp<m.hp)m._displayHp=Math.min(m.hp,m._displayHp+Math.max(1,m.maxHp*0.05));
var displayRatio=m._displayHp/m.maxHp;
var barW=size*0.7,barH=5,barX=cx-barW/2,barY=y+1;
ctx.fillStyle='#080514';ctx.fillRect(barX-1,barY-1,barW+2,barH+2);
ctx.strokeStyle='rgba(0,255,208,0.3)';ctx.lineWidth=0.8;ctx.strokeRect(barX-1,barY-1,barW+2,barH+2);
ctx.fillStyle='#1a0e2e';ctx.fillRect(barX,barY,barW,barH);
if(displayRatio>hpRatio){ctx.fillStyle='#b455ff';ctx.fillRect(barX,barY,barW*displayRatio,barH);}
ctx.fillStyle=hpRatio>0.5?'#00ffd0':hpRatio>0.3?'#ffcc00':'#ff006e';
ctx.fillRect(barX,barY,barW*hpRatio,barH);
ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(barX,barY,barW*hpRatio,1);
// 名字首字
ctx.shadowColor=color;ctx.shadowBlur=3;
ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='bold '+(size*0.24)+'px Arial';ctx.textAlign='center';
ctx.fillText(m.name[0],cx,cy+size*0.36);
ctx.shadowBlur=0;
// Boss 💀 标记
if(_isBoss){
  ctx.font='bold '+(size*0.18)+'px Arial';
  ctx.shadowColor='#ff0033';ctx.shadowBlur=4;
  ctx.fillStyle='#ff3344';
  ctx.fillText('💀',cx,y-1);
  ctx.shadowBlur=0;
}
ctx.restore();
}


// === 辅助：颜色提亮 ===
function lightenColor(hex,amt){
  hex=hex.replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  let r=parseInt(hex.substring(0,2),16),g=parseInt(hex.substring(2,4),16),b=parseInt(hex.substring(4,6),16);
  r=Math.min(255,r+amt);g=Math.min(255,g+amt);b=Math.min(255,b+amt);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

// === 性能优化：离屏Canvas + 脏标记 + 渐变缓存 ===
let _staticCanvas=null,_staticCtx=null;
let _staticValid=false; // 静态层有效标记（false时重绘）
let _lastPx=-1,_lastPy=-1,_lastFloor=-1;
let _gradientCache={};
let _polFrame=0;
let _renderDirty=true;
function markDirty(){_renderDirty=true;}
function invalidateStaticLayer(){_staticValid=false;_lastFloor=-1;_gradientCache={};markDirty();}

// 静态层渲染函数（生物朋克风格 — 只在地图/玩家位置变化时调用）
function renderStaticLayer(px,py,FOG_RADIUS,pol){
  const W=canvas.width,H=canvas.height;
  if(!_staticCanvas||_staticCanvas.width!==W||_staticCanvas.height!==H){
    _staticCanvas=document.createElement('canvas');
    _staticCanvas.width=W;_staticCanvas.height=H;
    _staticCtx=_staticCanvas.getContext('2d');
  }
  const sc=_staticCtx;
  sc.fillStyle='#222040';sc.fillRect(0,0,W,H);
  const _now=Date.now();
  const _zone=(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode)?ExpeditionMode.getZone(game.floor):Math.min(5,Math.ceil(game.floor/10));
  for(let y=0;y<13;y++){
    for(let x=0;x<13;x++){
      const dist=Math.sqrt((x-px)*(x-px)+(y-py)*(y-py));
      if(dist>FOG_RADIUS+1){sc.fillStyle='#080514';sc.fillRect(x*T,y*T,T,T);continue;}
      let fogAlpha=0;
      if(dist>FOG_RADIUS-1.5){fogAlpha=Math.min(0.9,(dist-FOG_RADIUS+1.5)/2.0);}
      const tile=game.tiles[y][x];
      const tx=x*T,ty2=y*T;
      if(tile===0){
        // 墙壁
        if(_tileTextures){sc.drawImage(_tileTextures.walls[(_zone-1)*2+(x+y)%2],tx,ty2);}
        else{sc.fillStyle='#2a1c48';sc.fillRect(tx,ty2,T,T);}
        // 墙壁底部阴影（伪3D感）
        if(y<12&&game.tiles[y+1]&&game.tiles[y+1][x]!==0){
          sc.fillStyle='rgba(0,0,0,0.4)';sc.fillRect(tx,ty2+T-3,T,3);
        }
        // 膜质微光（生物朋克墙壁纹理）
        const membraneAlpha=0.05+0.03*Math.sin(_now/1200+x*0.7+y*0.5);
        sc.fillStyle='rgba(0,255,208,'+membraneAlpha+')';
        sc.fillRect(tx,ty2,T,T);
        // 血管脉络
        if((x+y)%3===0){
          sc.strokeStyle='rgba(180,85,255,0.12)';sc.lineWidth=0.5;
          sc.beginPath();sc.moveTo(tx,ty2+T*0.3);sc.quadraticCurveTo(tx+T*0.5,ty2+T*0.5+Math.sin(_now/2000+x)*3,tx+T,ty2+T*0.7);sc.stroke();
        }
      }else if(tile===1){
        // 地板
        if(_tileTextures){sc.drawImage(_tileTextures.floors[(_zone-1)*2+(x+y)%2],tx,ty2);}
        else{sc.fillStyle='#110d20';sc.fillRect(tx,ty2,T,T);}
        // 墙壁投射阴影（邻墙的地板暗角）
        if(y>0&&game.tiles[y-1]&&game.tiles[y-1][x]===0){
          sc.fillStyle='rgba(0,0,0,0.25)';sc.fillRect(tx,ty2,T,6);
        }
        if(x>0&&game.tiles[y][x-1]===0){
          sc.fillStyle='rgba(0,0,0,0.15)';sc.fillRect(tx,ty2,4,T);
        }
      }else if(tile===2){
        // 楼梯：有机括约肌门环
        if(_tileTextures){sc.drawImage(_tileTextures.floors[(_zone-1)*2+(x+y)%2],tx,ty2);}
        else{sc.fillStyle='#110d20';sc.fillRect(tx,ty2,T,T);}
        const pulse=0.6+0.3*Math.sin(_now/600);
        const sg2=sc.createRadialGradient(tx+T/2,ty2+T/2,0,tx+T/2,ty2+T/2,T*0.7);
        sg2.addColorStop(0,'rgba(0,255,208,'+(0.25*pulse)+')');sg2.addColorStop(0.5,'rgba(0,200,166,'+(0.1*pulse)+')');sg2.addColorStop(1,'transparent');
        sc.fillStyle=sg2;sc.fillRect(tx,ty2,T,T);
        // 括约肌环
        sc.strokeStyle='rgba(0,255,208,'+(0.5+0.2*pulse)+')';sc.lineWidth=1.5;
        sc.beginPath();sc.arc(tx+T/2,ty2+T/2,T*0.35,0,Math.PI*2);sc.stroke();
        sc.strokeStyle='rgba(0,255,208,'+(0.25*pulse)+')';sc.lineWidth=0.8;
        sc.beginPath();sc.arc(tx+T/2,ty2+T/2,T*0.22,0,Math.PI*2);sc.stroke();
        // 向下箭头
        sc.fillStyle='rgba(0,255,208,'+(0.6+0.3*pulse)+')';sc.font='bold 18px Courier New';sc.textAlign='center';
        sc.fillText('\u25BC',tx+T/2,ty2+T*0.68+Math.sin(_now/500)*2);
      }else if(tile===3){
        // 祭坛：生物共鸣核心
        if(_tileTextures){sc.drawImage(_tileTextures.floors[(_zone-1)*2+(x+y)%2],tx,ty2);}
        else{sc.fillStyle='#110d20';sc.fillRect(tx,ty2,T,T);}
        const pulse3=0.5+0.4*Math.sin(_now/700);
        const sg3=sc.createRadialGradient(tx+T/2,ty2+T/2,0,tx+T/2,ty2+T/2,T*0.7);
        sg3.addColorStop(0,'rgba(255,0,110,'+(0.2*pulse3)+')');sg3.addColorStop(0.6,'rgba(180,85,255,'+(0.1*pulse3)+')');sg3.addColorStop(1,'transparent');
        sc.fillStyle=sg3;sc.fillRect(tx,ty2,T,T);
        // 有机共鸣环
        sc.strokeStyle='rgba(255,0,110,'+(0.4+0.3*pulse3)+')';sc.lineWidth=1.5;
        sc.beginPath();sc.arc(tx+T/2,ty2+T/2,T*0.35,0,Math.PI*2);sc.stroke();
        sc.strokeStyle='rgba(180,85,255,'+(0.25*pulse3)+')';sc.lineWidth=0.8;
        sc.beginPath();sc.arc(tx+T/2,ty2+T/2,T*0.22,0,Math.PI*2);sc.stroke();
        // 核心符文
        sc.fillStyle='rgba(255,0,110,'+(0.5+0.3*pulse3)+')';sc.font='bold 15px serif';sc.textAlign='center';
        sc.fillText('\u26EF',tx+T/2,ty2+T*0.62+Math.sin(_now/500)*1.5);
      }else if(tile===4){
        // 事件点：生物信号脉动
        if(_tileTextures){sc.drawImage(_tileTextures.floors[(_zone-1)*2+(x+y)%2],tx,ty2);}
        else{sc.fillStyle='#110d20';sc.fillRect(tx,ty2,T,T);}
        const pulse4=0.5+0.4*Math.sin(_now/650);
        const sg4=sc.createRadialGradient(tx+T/2,ty2+T/2,0,tx+T/2,ty2+T/2,T*0.6);
        sg4.addColorStop(0,'rgba(180,85,255,'+(0.18*pulse4)+')');sg4.addColorStop(1,'transparent');
        sc.fillStyle=sg4;sc.fillRect(tx,ty2,T,T);
        sc.strokeStyle='rgba(180,85,255,'+(0.3+0.2*pulse4)+')';sc.lineWidth=1;
        sc.strokeRect(tx+4,ty2+4,T-8,T-8);
        sc.fillStyle='rgba(180,85,255,'+(0.6+0.3*pulse4)+')';sc.font='bold 16px serif';sc.textAlign='center';
        sc.fillText('?',tx+T/2,ty2+T*0.65+Math.sin(_now/500)*1.5);
      }else if(tile===5){
        // 资源点：生物荧光结晶
        if(_tileTextures){sc.drawImage(_tileTextures.floors[(_zone-1)*2+(x+y)%2],tx,ty2);}
        else{sc.fillStyle='#110d20';sc.fillRect(tx,ty2,T,T);}
        const pulse5=0.5+0.4*Math.sin(_now/550);
        const sg5=sc.createRadialGradient(tx+T/2,ty2+T/2,0,tx+T/2,ty2+T/2,T*0.6);
        sg5.addColorStop(0,'rgba(0,255,208,'+(0.2*pulse5)+')');sg5.addColorStop(1,'transparent');
        sc.fillStyle=sg5;sc.fillRect(tx,ty2,T,T);
        sc.strokeStyle='rgba(0,255,208,'+(0.35+0.2*pulse5)+')';sc.lineWidth=1;
        sc.strokeRect(tx+4,ty2+4,T-8,T-8);
        // 荧光结晶图标
        sc.fillStyle='rgba(0,255,208,'+(0.6+0.3*pulse5)+')';sc.font='bold 15px serif';sc.textAlign='center';
        sc.fillText('\u25C6',tx+T/2,ty2+T*0.65+Math.sin(_now/500)*1.5);
      }else if(tile===6){
        // 上楼梯：生物紫色门环
        if(_tileTextures){sc.drawImage(_tileTextures.floors[(_zone-1)*2+(x+y)%2],tx,ty2);}
        else{sc.fillStyle='#110d20';sc.fillRect(tx,ty2,T,T);}
        const pulse6=0.6+0.3*Math.sin(_now/600);
        const sg6=sc.createRadialGradient(tx+T/2,ty2+T/2,0,tx+T/2,ty2+T/2,T*0.6);
        sg6.addColorStop(0,'rgba(136,68,255,'+(0.18*pulse6)+')');sg6.addColorStop(1,'transparent');
        sc.fillStyle=sg6;sc.fillRect(tx,ty2,T,T);
        sc.strokeStyle='rgba(136,68,255,'+(0.4+0.2*pulse6)+')';sc.lineWidth=1.5;
        sc.beginPath();sc.arc(tx+T/2,ty2+T/2,T*0.32,0,Math.PI*2);sc.stroke();
        sc.fillStyle='rgba(180,85,255,'+(0.6+0.3*pulse6)+')';sc.font='bold 18px Courier New';sc.textAlign='center';
        sc.fillText('\u25B2',tx+T/2,ty2+T*0.65);
      }
      // 地格线（生物膜脉纹）
      sc.strokeStyle='rgba(0,255,208,0.04)';sc.lineWidth=0.3;sc.strokeRect(tx,ty2,T,T);
      // 迷雾 + 暗角
      if(fogAlpha>0){
        const fk='fog_'+x+'_'+y+'_'+Math.round(fogAlpha*100);
        if(!_gradientCache[fk]){
          const fg=sc.createRadialGradient(tx+T/2,ty2+T/2,0,tx+T/2,ty2+T/2,T*0.7);
          fg.addColorStop(0,'rgba(8,6,8,'+(fogAlpha*0.5)+')');
          fg.addColorStop(1,'rgba(8,6,8,'+fogAlpha+')');
          _gradientCache[fk]=fg;
        }
        sc.fillStyle=_gradientCache[fk];sc.fillRect(tx,ty2,T,T);
      }
    }
  }
  // 全局暗角晕影（生物朋克有机洞穴氛围）
  const vigW=W,vigH=H;
  const vig=sc.createRadialGradient(px*T+T/2,py*T+T/2,T*2,px*T+T/2,py*T+T/2,Math.max(vigW,vigH)*0.7);
  vig.addColorStop(0,'transparent');vig.addColorStop(0.7,'rgba(0,0,0,0.15)');vig.addColorStop(1,'rgba(0,0,0,0.4)');
  sc.fillStyle=vig;sc.fillRect(0,0,W,H);
  _staticValid=true;
}
// === 浮动伤害数字（PixiJS + Canvas 2D fallback）===
const _floatingTexts=[];
function spawnFloatingText(x,y,text,color){
  if(pixiApp){
    const t=_pixiTextPool.find(p=>!p.visible);
    if(!t)return;
    t.visible=true;
    t.text=String(text);
    t.style.fill=color||'#ffffff';
    t.x=x;t.y=y;
    t.alpha=1;
    t.scale.set(1.3);
    t._life=1.0;t._vy=-1.8;
  }else{
    _floatingTexts.push({x:x,y:y,text:text,color:color||'#fff',life:1.0,vy:-1.8,scale:1.3});
  }
  markDirty();
}
function updateAndDrawFloatingTexts(){
  if(pixiApp){
    for(let i=0;i<_pixiTextPool.length;i++){
      const t=_pixiTextPool[i];
      if(!t.visible)continue;
      t.y+=t._vy;t._life-=0.022;
      if(t.scale.x>1)t.scale.set(Math.max(1,t.scale.x-0.02));
      if(t._life<=0){t.visible=false;continue;}
      t.alpha=t._life;
    }
  }else{
    for(let i=_floatingTexts.length-1;i>=0;i--){
      const ft=_floatingTexts[i];
      ft.y+=ft.vy;ft.life-=0.022;
      if(ft.scale>1)ft.scale-=0.02;
      if(ft.life<=0){_floatingTexts[i]=_floatingTexts[_floatingTexts.length-1];_floatingTexts.pop();continue;}
      ctx.globalAlpha=ft.life;
      const fSize=Math.round(14*Math.max(1,ft.scale));
      ctx.font='bold '+fSize+'px Arial';ctx.textAlign='center';
      ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.lineJoin='round';
      ctx.strokeText(ft.text,ft.x,ft.y);
      ctx.fillStyle=ft.color;
      ctx.fillText(ft.text,ft.x,ft.y);
    }
    ctx.globalAlpha=1;
  }
}

// === 粒子系统（PixiJS + Canvas 2D fallback）===
const particles=[];
const MAX_PARTICLES=120;
function spawnParticle(px,py,color,vx,vy,decay,size,swirl){
  if(pixiApp){
    let s=_pixiParticlePool.find(p=>!p.visible);
    if(!s){
      // FIFO: 回收life最低的粒子
      let minLife=Infinity,minIdx=-1;
      for(let i=0;i<_pixiParticlePool.length;i++){
        if(_pixiParticlePool[i]._life<minLife){minLife=_pixiParticlePool[i]._life;minIdx=i;}
      }
      if(minIdx>=0)s=_pixiParticlePool[minIdx];
      else return;
    }
    s.visible=true;
    s.x=px;s.y=py;
    const pc=_parseColor(color);
    s.tint=pc.rgb;
    s.alpha=pc.a;
    s.scale.set((size||2)/4);
    s._vx=vx||0;s._vy=vy||0;
    s._decay=decay||0.025;s._life=1;s._initAlpha=pc.a;
    s._swirl=swirl||0;s._age=0;
  }else{
    if(particles.length>=MAX_PARTICLES)return;
    particles.push({x:px,y:py,color:color,vx:vx||0,vy:vy||0,life:1.0,decay:decay||0.025,size:size||2,swirl:swirl||0,age:0});
  }
}
function updateAndDrawParticles(){
  if(pixiApp){
    for(let i=0;i<_pixiParticlePool.length;i++){
      const s=_pixiParticlePool[i];
      if(!s.visible)continue;
      s._life-=s._decay;
      if(s._life<=0){s.visible=false;continue;}
      s._age+=0.016;
      if(s._swirl){
        const sw=s._swirl*s._age;
        s.x+=s._vx+Math.sin(sw)*s._swirl*0.5;
        s.y+=s._vy+Math.cos(sw)*s._swirl*0.3;
      }else{
        s.x+=s._vx;s.y+=s._vy;
      }
      s.alpha=s._life*0.7*(s._initAlpha||1);
    }
  }else{
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.age=(p.age||0)+0.016;
      p.life-=p.decay;
      if(p.life<=0){particles[i]=particles[particles.length-1];particles.pop();continue;}
      if(p.swirl){
        const sw=p.swirl*p.age;
        p.x+=p.vx+Math.sin(sw)*p.swirl*0.5;
        p.y+=p.vy+Math.cos(sw)*p.swirl*0.3;
      }else{
        p.x+=p.vx;p.y+=p.vy;
      }
      ctx.globalAlpha=p.life*0.7;
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
}
function spawnHitSparks(tx,ty,color,count){
  const cx=tx*T+T/2,cy=ty*T+T/2;
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2;
    const spd=3+Math.random()*4;
    const vx=Math.cos(a)*spd,vy=Math.sin(a)*spd;
    spawnParticle(cx+(Math.random()-0.5)*12,cy+(Math.random()-0.5)*12,color,vx,vy,0.035+Math.random()*0.03,1.5+Math.random()*2);
    // 拖尾子粒子（更小更慢更快消失）
    spawnParticle(cx+(Math.random()-0.5)*6,cy+(Math.random()-0.5)*6,color,vx*0.3,vy*0.3,0.06,0.8+Math.random()*0.5);
  }
  for(let i=0;i<Math.min(count,4);i++){
    spawnParticle(cx+(Math.random()-0.5)*8,cy+(Math.random()-0.5)*8,'#ffffc8',(Math.random()-0.5)*6,(Math.random()-0.5)*6,0.06,1+Math.random());
  }
}
// === Boss铭牌入场 ===
function showBossIntro(t,cb){
  var c=monsterTemplates[t.type]||{};
  var color=c.color||'#ff006e';
  var traits=(c.traits||[]).join(' · ');
  var root=document.createElement('div');
  root.style.cssText='position:fixed;inset:0;z-index:10002;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0);pointer-events:none;transition:background 0.3s';
  var nameEl=document.createElement('div');
  nameEl.style.cssText='font-size:24px;font-weight:900;color:'+color+';text-shadow:0 0 20px '+color+',0 0 40px '+color+';letter-spacing:6px;opacity:0;transform:translateY(20px);transition:all 0.4s ease-out';
  nameEl.textContent='⚔ '+t.name+' ⚔';
  var traitEl=document.createElement('div');
  traitEl.style.cssText='font-size:12px;color:#888;margin-top:8px;letter-spacing:2px;opacity:0;transform:translateY(10px);transition:all 0.3s ease-out 0.2s';
  traitEl.textContent=traits;
  var lineEl=document.createElement('div');
  lineEl.style.cssText='width:0;height:1px;background:linear-gradient(90deg,transparent,'+color+',transparent);margin-top:12px;transition:width 0.5s ease-out 0.1s';
  root.appendChild(nameEl);root.appendChild(traitEl);root.appendChild(lineEl);
  document.body.appendChild(root);
  try{playSubDrop(0.5);setTimeout(function(){playChoirStab([110,165,220],0.6);},200);}catch(e){}
  requestAnimationFrame(function(){
    root.style.background='rgba(0,0,0,0.85)';
    nameEl.style.opacity='1';nameEl.style.transform='translateY(0)';
    traitEl.style.opacity='1';traitEl.style.transform='translateY(0)';
    lineEl.style.width='60%';
  });
  setTimeout(function(){
    root.style.background='rgba(0,0,0,0)';
    nameEl.style.opacity='0';nameEl.style.transform='translateY(-10px)';
    traitEl.style.opacity='0';lineEl.style.opacity='0';
  },1300);
  setTimeout(function(){root.remove();cb();},1600);
}
// === 附身属性对比浮层 ===
function showPossessCompare(oA,oD,oH,nA,nD,nH,newTraits,hostName){
  var el=document.createElement('div');
  el.style.cssText='position:fixed;top:16%;left:50%;transform:translate(-50%,0) scale(0.92);z-index:10004;pointer-events:none;background:rgba(0,0,0,0.92);border:1px solid rgba(0,255,208,0.55);border-radius:10px;padding:10px 14px;font-family:monospace;font-size:12px;color:#e0e0e0;opacity:0;transition:opacity 0.2s,transform 0.2s;text-align:center;min-width:200px;max-width:82vw;box-shadow:0 0 24px rgba(0,255,208,0.24)';
  function row(label,o,n){
    var d=n-o,c=d>0?'#00ffd0':d<0?'#ff006e':'#888';
    var sign=d>0?'+':'';
    return '<div style="display:flex;justify-content:space-between;gap:12px;margin:3px 0"><span style="color:#888">'+label+'</span><span><span style="color:#666">'+o+'</span> <span style="color:'+c+';font-weight:bold">→ '+n+' ('+sign+d+')</span></span></div>';
  }
  var html='<div style="color:#00ffd0;font-weight:bold;margin-bottom:6px;font-size:13px;text-shadow:0 0 6px rgba(0,255,208,0.4)">⬆ '+t('形态同化')+(hostName?' · '+hostName:'')+'</div>'+row('ATK',oA,nA)+row('DEF',oD,nD)+row('HP',oH,nH);
  if(newTraits&&newTraits.length>0){
    html+='<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(0,255,208,0.2);text-align:left">';
    html+='<div style="color:#ffaa44;font-size:11px;margin-bottom:4px;letter-spacing:1px">+ 继承能力</div>';
    for(var i=0;i<newTraits.length;i++){
      var tr=newTraits[i];
      var nm=(window.traitNames&&traitNames[tr])||tr;
      var ef=(typeof getTraitEffect==='function')?getTraitEffect(tr):null;
      var ds=(ef&&ef.desc)||'';
      html+='<div style="margin:3px 0;line-height:1.4"><span style="color:#ffd76b;font-weight:bold">◆ '+nm+'</span>'+(ds?'<span style="color:#aaa;font-size:11px"> — '+ds+'</span>':'')+'</div>';
    }
    html+='</div>';
  }
  el.innerHTML=html;
  document.body.appendChild(el);
  var hold=(newTraits&&newTraits.length>0)?4200:2400;
  requestAnimationFrame(function(){el.style.opacity='1';el.style.transform='translate(-50%,0) scale(1)';});
  setTimeout(function(){el.style.opacity='0';el.style.transform='translate(-50%,-6px) scale(1.03)';},hold);
  setTimeout(function(){el.remove();},hold+350);
}
// 附身特效（成功/失败）
// === 附身转场：屏幕撕裂 + RGB 错位 + 缩放冲击 ===
function possessCinematic(success){
  var root=document.createElement('div');
  root.style.cssText='position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden';
  document.body.appendChild(root);
  if(!success){
    // 失败：红色脉冲 + 抖动
    root.innerHTML='<div style="position:absolute;inset:0;background:rgba(255,0,60,0.35)"></div>';
    document.body.style.transform='translateX(4px)';
    setTimeout(function(){document.body.style.transform='translateX(-4px)';},60);
    setTimeout(function(){document.body.style.transform='';root.remove();},200);
    return;
  }
  // --- Phase 0: 白闪 ---
  var flash=document.createElement('div');
  flash.style.cssText='position:absolute;inset:0;background:rgba(0,255,208,0.5)';
  root.appendChild(flash);
  // --- Phase 1 (80ms): 屏幕撕裂 —— 5 条水平切片错位 ---
  setTimeout(function(){
    flash.style.background='rgba(0,0,0,0.7)';
    var sliceCount=6,h=100/sliceCount;
    for(var i=0;i<sliceCount;i++){
      var s=document.createElement('div');
      var dx=(Math.random()-0.5)*30;
      s.style.cssText='position:absolute;left:'+dx+'px;right:'+(-dx)+'px;top:'+(h*i)+'%;height:'+h+'%;background:rgba(0,255,208,0.08);border-top:1px solid rgba(0,255,208,0.3);border-bottom:1px solid rgba(0,255,208,0.3)';
      root.appendChild(s);
    }
    document.body.style.transform='scale(1.03)';
  },80);
  // --- Phase 2 (200ms): RGB 色差 —— 红蓝通道偏移 ---
  setTimeout(function(){
    root.innerHTML='';
    var r=document.createElement('div');
    r.style.cssText='position:absolute;inset:0;background:rgba(255,0,60,0.15);transform:translateX(-3px)';
    var b=document.createElement('div');
    b.style.cssText='position:absolute;inset:0;background:rgba(0,80,255,0.15);transform:translateX(3px)';
    root.appendChild(r);root.appendChild(b);
    document.body.style.transform='scale(1.06)';
  },200);
  // --- Phase 3 (350ms): 缩放冲击 + 扫描线 ---
  setTimeout(function(){
    root.innerHTML='';
    for(var i=0;i<20;i++){
      var ln=document.createElement('div');
      ln.style.cssText='position:absolute;left:0;right:0;top:'+(i*5)+'%;height:2px;background:rgba(0,255,208,'+(0.1+Math.random()*0.2)+')';
      root.appendChild(ln);
    }
    document.body.style.transform='scale(1.0) translateY(-2px)';
  },350);
  // --- Phase 4 (550ms): 最终闪白 ---
  setTimeout(function(){
    root.innerHTML='<div style="position:absolute;inset:0;background:rgba(255,255,255,0.25)"></div>';
    document.body.style.transform='';
  },550);
  // --- Phase 5 (800ms): 清理 ---
  setTimeout(function(){root.remove();document.body.style.transform='';},800);
}

function spawnPossessEffect(tx,ty,success){
  const cx=tx*T+T/2,cy=ty*T+T/2;
  if(success){
    // 成功: 生物青→虹彩 螺旋内聚
    for(let i=0;i<24;i++){
      const a=i*Math.PI*2/24;
      const dist=30+Math.random()*20;
      const px=cx+Math.cos(a)*dist,py=cy+Math.sin(a)*dist;
      const hue=Math.floor((i/24)*360);
      spawnParticle(px,py,'hsla('+hue+',100%,70%,0.7)',-Math.cos(a)*2.5,-Math.sin(a)*2.5,0.018,2+Math.random(),5+Math.random()*3);
    }
    // 中心爆发
    for(let i=0;i<12;i++){
      spawnParticle(cx+(Math.random()-0.5)*8,cy+(Math.random()-0.5)*8,'rgba(0,255,208,0.8)',(Math.random()-0.5)*1,-1-Math.random()*2,0.03,1.5+Math.random());
    }
  }else{
    // 失败: 洋红色向外爆散
    for(let i=0;i<16;i++){
      const a=i*Math.PI*2/16+Math.random()*0.3;
      spawnParticle(cx,cy,'rgba(255,0,110,0.7)',Math.cos(a)*(3+Math.random()*3),Math.sin(a)*(3+Math.random()*3),0.04,2+Math.random()*1.5);
    }
    // 碎片
    for(let i=0;i<8;i++){
      spawnParticle(cx+(Math.random()-0.5)*10,cy+(Math.random()-0.5)*10,'rgba(180,85,255,0.5)',(Math.random()-0.5)*5,(Math.random()-0.5)*5,0.05,1+Math.random());
    }
  }
}

// === 瓦片纹理预渲染（生物朋克有机洞穴风格） ===
let _tileTextures=null;
function generateTileTextures(){
  var T=40;
  _tileTextures={walls:[],floors:[]};
  function seededRand(s){return function(){s=(s*9301+49297)%233280;return s/233280;};}
  // 5区域配色
  var zoneColors=[
    {wall:[42,28,72],floor:[17,13,32],accent:'rgba(0,255,208,',vein:'rgba(180,85,255,'},  // Z1实验室
    {wall:[48,22,22],floor:[22,12,18],accent:'rgba(255,100,50,',vein:'rgba(200,60,60,'},   // Z2培育区
    {wall:[25,35,30],floor:[12,20,16],accent:'rgba(100,255,100,',vein:'rgba(80,180,80,'},  // Z3生物区
    {wall:[18,18,42],floor:[8,8,24],accent:'rgba(120,80,255,',vein:'rgba(80,50,200,'},     // Z4深渊
    {wall:[30,10,30],floor:[16,5,20],accent:'rgba(255,0,200,',vein:'rgba(200,0,150,'}      // Z5终极
  ];
  // 每区域2墙壁变体 + 2地板变体 = 10+10
  for(var z=0;z<5;z++){
    var zc=zoneColors[z];
    // 2墙壁
    for(var v=0;v<2;v++){
      var c=document.createElement('canvas');c.width=T;c.height=T;var g=c.getContext('2d');
      var rng=seededRand(z*1337+v*42);
      var bR=zc.wall[0]+v*3,bG=zc.wall[1]+v*2,bB=zc.wall[2]+v*4;
      g.fillStyle='rgb('+bR+','+bG+','+bB+')';g.fillRect(0,0,T,T);
      var bH=Math.floor(T/3);
      for(var row=0;row<3;row++){
        var yy=row*bH;var off=(row%2===0)?0:Math.floor(T/2);var bW=Math.floor(T/2);
        for(var col=-1;col<3;col++){
          var bx=col*bW+off;
          var dr=Math.floor(rng()*8)-4,dg=Math.floor(rng()*6)-3,db=Math.floor(rng()*10)-5;
          g.fillStyle='rgb('+(bR+dr)+','+(bG+dg)+','+(bB+db)+')';g.fillRect(bx+1,yy+1,bW-2,bH-2);
          g.fillStyle=zc.accent+'0.06)';g.fillRect(bx+1,yy+1,bW-2,2);
          g.fillStyle='rgba(0,0,0,0.2)';g.fillRect(bx+1,yy+bH-3,bW-2,2);
          for(var n=0;n<3;n++){var nx=bx+2+rng()*(bW-4),ny=yy+2+rng()*(bH-4);g.fillStyle=zc.vein+(0.06+rng()*0.08)+')';g.fillRect(nx,ny,1+rng()*2,1+rng()*2);}
        }
      }
      g.strokeStyle='rgba(8,5,20,0.85)';g.lineWidth=1.5;
      for(var row=0;row<=3;row++){var yy=row*bH;g.beginPath();g.moveTo(0,yy);g.lineTo(T,yy);g.stroke();var off2=(row%2===0)?0:Math.floor(T/2);for(var col=-1;col<3;col++){var xx=col*Math.floor(T/2)+off2;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx,yy+bH);g.stroke();}}
      if(rng()>0.3){var mx=rng()*T,my=rng()*T;g.fillStyle=zc.accent+(0.12+rng()*0.15)+')';g.beginPath();g.arc(mx,my,2+rng()*4,0,Math.PI*2);g.fill();}
      if(v>=1){g.strokeStyle='rgba(0,0,0,0.3)';g.lineWidth=0.8;g.beginPath();var cx2=5+rng()*30,cy2=5+rng()*30;g.moveTo(cx2,cy2);g.lineTo(cx2+5+rng()*8,cy2+3+rng()*6);g.lineTo(cx2+8+rng()*10,cy2+8+rng()*8);g.stroke();}
      if(z>=3){g.strokeStyle=zc.vein+'0.15)';g.lineWidth=0.7;g.beginPath();g.moveTo(rng()*T,rng()*T);g.quadraticCurveTo(rng()*T,rng()*T,rng()*T,rng()*T);g.stroke();}
      var edgeGrad=g.createLinearGradient(0,0,0,T);edgeGrad.addColorStop(0,'rgba(0,0,0,0.08)');edgeGrad.addColorStop(0.5,'transparent');edgeGrad.addColorStop(1,'rgba(0,0,0,0.12)');g.fillStyle=edgeGrad;g.fillRect(0,0,T,T);
      _tileTextures.walls.push(c);
    }
    // 2地板
    for(var v=0;v<2;v++){
      var c=document.createElement('canvas');c.width=T;c.height=T;var g=c.getContext('2d');
      var rng=seededRand(z*2371+v*99);
      var fR=zc.floor[0]+v*2,fG=zc.floor[1]+v*1,fB=zc.floor[2]+v*3;
      g.fillStyle='rgb('+fR+','+fG+','+fB+')';g.fillRect(0,0,T,T);
      var midX=T/2+Math.floor(rng()*6)-3,midY=T/2+Math.floor(rng()*6)-3;
      g.strokeStyle='rgba(34,32,64,0.5)';g.lineWidth=1;
      g.beginPath();g.moveTo(midX,0);g.lineTo(midX+Math.floor(rng()*4)-2,T);g.stroke();
      g.beginPath();g.moveTo(0,midY);g.lineTo(T,midY+Math.floor(rng()*4)-2);g.stroke();
      var zones2=[[0,0,midX,midY],[midX,0,T-midX,midY],[0,midY,midX,T-midY],[midX,midY,T-midX,T-midY]];
      zones2.forEach(function(z2){var zr=Math.floor(rng()*8)-4;g.fillStyle='rgba('+(fR+zr)+','+(fG+zr-1)+','+(fB+zr+1)+',0.4)';g.fillRect(z2[0],z2[1],z2[2],z2[3]);});
      for(var i=0;i<4+v;i++){var sx=rng()*T,sy=rng()*T,ss=0.5+rng()*2;g.fillStyle='rgba(45,27,78,'+(0.3+rng()*0.3)+')';g.fillRect(sx,sy,ss,ss);}
      if(v>=1){g.strokeStyle='rgba(0,0,0,'+(0.15+rng()*0.15)+')';g.lineWidth=0.6;g.beginPath();var cx3=rng()*T,cy3=rng()*T;g.moveTo(cx3,cy3);for(var s=0;s<2+v;s++){g.lineTo(cx3+(rng()-0.5)*20,cy3+(rng()-0.5)*20);}g.stroke();}
      // 区域特色纹理
      if(z===1){g.fillStyle='rgba(200,50,20,0.04)';g.fillRect(0,0,T,T);}// Z2血迹
      if(z===2){g.fillStyle='rgba(50,180,50,0.03)';g.beginPath();g.arc(rng()*T,rng()*T,3+rng()*5,0,Math.PI*2);g.fill();}// Z3孢子
      if(z===3){g.strokeStyle='rgba(100,60,200,0.08)';g.lineWidth=0.5;g.beginPath();g.moveTo(rng()*T,0);g.quadraticCurveTo(rng()*T,rng()*T,rng()*T,T);g.stroke();}// Z4裂缝
      if(z===4){var fg=g.createRadialGradient(T/2,T/2,0,T/2,T/2,T*0.6);fg.addColorStop(0,'rgba(255,0,150,0.04)');fg.addColorStop(1,'transparent');g.fillStyle=fg;g.fillRect(0,0,T,T);}// Z5辐射
      g.fillStyle='rgba(255,255,255,0.02)';g.fillRect(2,2,T/2-2,T/2-2);
      _tileTextures.floors.push(c);
    }
  }
}


// === 职业主题 ===
function updateClassTheme(){
  const cc=classColors[game.player.playerClass]||classColors.swarm;
  document.documentElement.style.setProperty('--class-primary',cc.primary);
  document.documentElement.style.setProperty('--class-glow',cc.glow);
  document.documentElement.style.setProperty('--class-highlight',cc.highlight);
  // 顶栏边框
  const topBar=document.getElementById('top-bar');
  if(topBar)topBar.style.borderBottomColor=cc.primary;
  // HP条颜色
  const hpFill=document.getElementById('hp-fill');
  if(hpFill)hpFill.style.background='linear-gradient(90deg,'+cc.primary+','+cc.highlight+')';
}
function getClassResourceDisplay(){
  const p=game.player;
  if(p.playerClass==='titan')return '🛡'+p.armor;
  if(p.playerClass==='ghost')return '🌑'+p.stealth+(p.stealthActive?'[隐]':'');
  if(p.playerClass==='swarm')return '🦗×'+p.swarms.filter(s=>s.hp>0).length;
  return '';
}

// === DOM缓存（避免每帧重复getElementById） ===
const _$={};
function _cacheDom(){
_$.hpFill=document.getElementById('hp-fill');
_$.hpText=document.getElementById('hp-text');
_$.polText=document.getElementById('pol-text');
_$.polBadge=document.getElementById('pol-badge');
_$.possText=document.getElementById('poss-text');
_$.possBadge=document.getElementById('poss-badge');
_$.atkTop=document.getElementById('atk-top');
_$.defTop=document.getElementById('def-top');
_$.floorNum=document.getElementById('floor-num');
_$.floorNum2=document.getElementById('floor-num2');
_$.floorName=document.getElementById('floor-name');
_$.evoBottom=document.getElementById('evo-bottom');
_$.explorePct=document.getElementById('explore-pct');
_$.classResource=document.getElementById('class-resource');
_$.classNameTop=document.getElementById('class-name-top');
_$.formNameTop=document.getElementById('form-name-top');
_$.traitsTop=document.getElementById('traits-top');
_$.polOverlay=document.getElementById('pollution-overlay');
_$.minimapContainer=document.getElementById('minimap-container');
_$.btnUltimate=document.getElementById('btn-ultimate');
_$.btnStealth=document.getElementById('btn-stealth');
_$.btnSprint=document.getElementById('btn-sprint');
_$.dpadCenter=document.getElementById('dpad-center');
}

function resetRenderCaches(){
_staticCanvas=null;_staticCtx=null;_staticValid=false;
_lastPx=-1;_lastPy=-1;_lastFloor=-1;
_gradientCache={};_polFrame=0;
_tileTextures=null;
_renderDirty=true;
}

// === 渲染 ===
function render(){
if(!game.tiles||game.tiles.length===0)return;
try{
// 更新top-bar高度CSS变量（只在首次或脏标记时读取，避免每帧 reflow）
if(!game._topBarHeight||game._topBarHeightDirty){
  const topBar=document.getElementById('top-bar');
  if(topBar){game._topBarHeight=topBar.offsetHeight;game._topBarHeightDirty=false;
    document.documentElement.style.setProperty('--top-bar-height',game._topBarHeight+'px');}
}
// 更新技能状态显示
if(typeof updateSkillStatus==='function')updateSkillStatus();
// 更新环境音效
if(typeof updateAmbient==='function')updateAmbient();
// 安全触发诅咒祭坛（非战斗中）
if(game._pendingAltar&&!game.target){game._pendingAltar=false;setTimeout(()=>triggerCurseAltar(),300);}
// 更新碎片栏（脏标记优化）
if(game._fragDirty!==false){updateFragmentBar();game._fragDirty=false;}
// 更新诅咒标记（脏标记优化）
if(game._curseDirty!==false){updateCurseBadge();game._curseDirty=false;}
if(!_tileTextures)generateTileTextures();
const _now=Date.now(); // 每帧缓存一次，避免多处 Date.now() 调用
// 红点检查（每秒一次）
if(!game._lastRedDotCheck||_now-game._lastRedDotCheck>1000){game._lastRedDotCheck=_now;if(typeof updateEvoRedDot==='function')updateEvoRedDot();}
const W=canvas.width,H=canvas.height;
ctx.fillStyle='#060406';ctx.fillRect(0,0,W,H);
// 暴击震屏效果
let _shook=false;
if(game._shakeFrames>0){ctx.save();ctx.translate((Math.random()-0.5)*8,(Math.random()-0.5)*8);game._shakeFrames--;_shook=true;
  if(pixiApp)pixiApp.stage.position.set((Math.random()-0.5)*8,(Math.random()-0.5)*8);
}else if(pixiApp&&(pixiApp.stage.position.x!==0||pixiApp.stage.position.y!==0)){pixiApp.stage.position.set(0,0);}
const pol=game.player.pollution;
const px=game.player.x,py=game.player.y;
let FOG_RADIUS=(game._sigFlags.fogRadius!==undefined?game._sigFlags.fogRadius:((classBaseStats[game.player.playerClass]||{}).fogRadius||5));
// Z4深层菌脉：视野-1
var _renderZone=(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode)?ExpeditionMode.getZone(game.floor):Math.min(5,Math.ceil(game.floor/10));
if(_renderZone===4)FOG_RADIUS=Math.max(3,FOG_RADIUS-1);

// 地图（静态层缓存：只在地图/玩家位置变化时重绘瓦片）
if(!_staticValid||px!==_lastPx||py!==_lastPy){
  _lastPx=px;_lastPy=py;
  renderStaticLayer(px,py,FOG_RADIUS,pol);
}
ctx.drawImage(_staticCanvas,0,0);
// 区域色调（生物朋克风格：每区域独特生物荧光氛围）
const _zone=_renderZone;
const _zoneTint=[null,'rgba(0,255,208,0.03)','rgba(180,85,255,0.04)','rgba(0,200,166,0.03)','rgba(136,68,255,0.05)','rgba(255,0,110,0.04)'][_zone];
if(_zoneTint){ctx.fillStyle=_zoneTint;ctx.fillRect(0,0,W,H);}
// 环境尘埃粒子（生物朋克孢子/荧光粒子 — 螺旋上浮 + 污染密度联动）
const _sporeChance=(0.10+pol*0.003)*(game._lowFPS?0.3:1); // 低帧率时减70%粒子
if(Math.random()<_sporeChance){
  const ax=(px+(Math.random()-0.5)*FOG_RADIUS*2)*T;
  const ay=(py+(Math.random()-0.5)*FOG_RADIUS*2)*T;
  const zoneColors=[null,'rgba(0,255,208,0.25)','rgba(180,85,255,0.3)','rgba(0,200,166,0.25)','rgba(136,68,255,0.3)','rgba(255,0,110,0.3)'];
  // 高污染时颜色偏洋红
  const dc=pol>60?'rgba(255,0,110,'+(0.15+pol*0.002)+')':zoneColors[_zone]||'rgba(0,255,208,0.2)';
  const swirlStr=2+Math.random()*3; // 螺旋强度
  spawnParticle(ax,ay,dc,(Math.random()-0.5)*0.3,(Math.random()-0.5)*0.3-0.25,0.006+Math.random()*0.008,1+Math.random()*1.5,swirlStr);
}
// 偶尔产生荧光粒子（生物氛围 — 大颗螺旋孢子）
if(Math.random()<0.05+pol*0.001&&_zone>=2){
  const fx=(px+(Math.random()-0.5)*FOG_RADIUS*1.5)*T;
  const fy=(py+(Math.random()-0.5)*FOG_RADIUS*1.5)*T;
  spawnParticle(fx,fy,'rgba(0,255,208,0.5)',(Math.random()-0.5)*0.5,-0.5-Math.random()*0.5,0.02+Math.random()*0.02,0.8+Math.random(),4+Math.random()*2);
}
// 怪物（视野内才显示）
game.monsters.forEach(m=>{
if(!m||m.hp<=0||m.possessed)return;
const _dx=m.x-px,_dy=m.y-py,_distSq=_dx*_dx+_dy*_dy;
const _fogSq=FOG_RADIUS*FOG_RADIUS;
if(_distSq>_fogSq)return;
const _fadeSq=(FOG_RADIUS-2)*(FOG_RADIUS-2);
const _monsterAlphaChanged=_distSq>_fadeSq;
if(_monsterAlphaChanged){const dist=Math.sqrt(_distSq);ctx.globalAlpha=1-((dist-FOG_RADIUS+2)/2)*0.6;}
// 残影效果（怪物刚移动过）
if(m._prevX!==undefined&&m._moveTime&&_now-m._moveTime<300){
  const fade=1-(_now-m._moveTime)/300;
  ctx.save();ctx.globalAlpha=fade*0.3;
  drawMonster(m,m._prevX*T+2,m._prevY*T+2,T-4);
  ctx.restore();
}
drawMonster(m,m.x*T+2,m.y*T+2,T-4);
// 新手引导目标怪物高亮（三层渐进）
if(m._tutorialHighlight&&game._tutorialStage===1){
  var _dist=Math.abs(m.x-game.player.x)+Math.abs(m.y-game.player.y);
  var pulse=0.4+0.3*Math.sin(_now/400);
  ctx.save();
  // 远距离：光柱+引导线
  if(_dist>3){
    ctx.strokeStyle='rgba(255,204,0,'+(pulse*0.4)+')';ctx.lineWidth=1;
    ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(game.player.x*T+T/2,game.player.y*T+T/2);ctx.lineTo(m.x*T+T/2,m.y*T+T/2);ctx.stroke();
    ctx.setLineDash([]);
    var grad=ctx.createLinearGradient(m.x*T+T/2,m.y*T-T,m.x*T+T/2,m.y*T+T);
    grad.addColorStop(0,'rgba(255,204,0,0)');grad.addColorStop(0.5,'rgba(255,204,0,'+(pulse*0.15)+')');grad.addColorStop(1,'rgba(255,204,0,0)');
    ctx.fillStyle=grad;ctx.fillRect(m.x*T+T*0.3,m.y*T-T,T*0.4,T*2);
  }
  // 中距离：轮廓描边+名称
  if(_dist<=4){
    ctx.strokeStyle='rgba(0,255,208,'+pulse+')';ctx.lineWidth=2;ctx.shadowColor='#00ffd0';ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(m.x*T+T/2,m.y*T+T/2,T*0.6,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,204,0,'+(pulse*0.9)+')';ctx.font='bold 9px monospace';ctx.textAlign='center';
    ctx.fillText(m.name,m.x*T+T/2,m.y*T-6);
  }
  // 近距离：HP=1 + 虚弱 + 附身率
  if(_dist<=2){
    ctx.fillStyle='rgba(255,100,100,0.9)';ctx.font='bold 8px monospace';ctx.textAlign='center';
    ctx.fillText('HP:1 虚弱',m.x*T+T/2,m.y*T+T+10);
    ctx.fillStyle='rgba(0,255,208,0.9)';
    ctx.fillText('附身率100%',m.x*T+T/2,m.y*T+T+20);
  }
  ctx.restore();
}
// 怪物警觉指示器（生物朋克风格）
const alert=m.alertLevel||0;
if(alert===1){
  // 半警觉: 黄色 ? 浮动 + 描边
  ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.font='bold 14px Arial';ctx.textAlign='center';
  ctx.strokeText('?',m.x*T+T/2,m.y*T-2+Math.sin(_now/400)*2);
  ctx.fillStyle='#fc0';
  ctx.fillText('?',m.x*T+T/2,m.y*T-2+Math.sin(_now/400)*2);
}else if(alert===2){
  // 追踪: 红色 ! + 描边 + 向玩家连线
  ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.font='bold 16px Arial';ctx.textAlign='center';
  ctx.strokeText('!',m.x*T+T/2,m.y*T-2);
  ctx.fillStyle='#ff006e';
  ctx.fillText('!',m.x*T+T/2,m.y*T-2);
  // 追踪连线
  ctx.save();ctx.strokeStyle='rgba(255,0,110,0.15)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(m.x*T+T/2,m.y*T+T/2);ctx.lineTo(px*T+T/2,py*T+T/2);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();
}
if(game._sigFlags.bountyId&&m.id===game._sigFlags.bountyId){
  ctx.strokeStyle='#fc0';ctx.lineWidth=2;ctx.strokeRect(m.x*T+1,m.y*T+1,T-2,T-2);
}
ctx.globalAlpha=1;
});
// 玩家（移到怪物之后立即绘制，确保不被中间代码异常阻断）
{
const p=game.player;
if(game._lastPxy==null)game._lastPxy={x:p.x,y:p.y};
if(game._lastPxy.x!==p.x||game._lastPxy.y!==p.y){
  var _opx=game._lastPxy.x*T+T/2,_opy=game._lastPxy.y*T+T/2;
  var _npx=p.x*T+T/2,_npy=p.y*T+T/2;
  var _trCC=(typeof classColors!=='undefined'?classColors[p.playerClass]:null)||{glow:'#00ffd0'};
  for(var _ti=0;_ti<3;_ti++){
    var _f=(_ti+1)/4;
    spawnParticle(_opx+(_npx-_opx)*_f,_opy+(_npy-_opy)*_f,_trCC.glow,
      (Math.random()-0.5)*0.2,(Math.random()-0.5)*0.2,0.08,1+Math.random()*0.6,2);
  }
  game._landingPulseAt=Date.now();
  game._lastPxy={x:p.x,y:p.y};
}
drawPlayer(p.x*T+2,p.y*T+2,T-4);
}
// 签名: 迷雾追踪者提示
if(game._sigFlags.stalker){
  const s=game._sigFlags.stalker;
  const dist=Math.sqrt((s.x-px)*(s.x-px)+(s.y-py)*(s.y-py));
  if(dist<4){
    ctx.fillStyle='rgba(100,0,100,0.3)';ctx.fillRect(s.x*T,s.y*T,T,T);
  }
}
// 签名: EP宝石
if(game._sigFlags.gems){
  game._sigFlags.gems.forEach(gem=>{
    const gDist=Math.sqrt((gem.x-px)*(gem.x-px)+(gem.y-py)*(gem.y-py));
    if(gDist<=FOG_RADIUS){
      ctx.fillStyle='#08f';ctx.beginPath();ctx.arc(gem.x*T+T/2,gem.y*T+T/2,T/4,0,Math.PI*2);ctx.fill();
    }
  });
}
// 碎片掉落物渲染
if(game._fragDrops&&game._fragDrops.length>0){
  game._fragDrops.forEach(fd=>{
    const fDist=Math.max(Math.abs(fd.x-px),Math.abs(fd.y-py));
    if(fDist>FOG_RADIUS)return;
    const fcx=fd.x*T+T/2,fcy=fd.y*T+T/2;
    const pulse=0.8+0.2*Math.sin(_now/400);
    ctx.save();
    ctx.shadowColor='#00ffd0';ctx.shadowBlur=8*pulse;
    ctx.fillStyle='rgba(0,255,208,0.15)';
    ctx.beginPath();ctx.arc(fcx,fcy,T/3,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(0,255,208,'+0.5*pulse+')';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(fcx,fcy,T/3,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle='#fff';ctx.font='bold '+(T*0.35)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('💎',fcx,fcy);
    ctx.restore();
  });
}
// 幻觉怪物（污染31-60%生成，视野内才显示）
if(game.phantoms&&game.phantoms.length>0){
game.phantoms.forEach(ph=>{
const dist=Math.max(Math.abs(ph.x-px),Math.abs(ph.y-py));
if(dist>FOG_RADIUS)return;
ctx.save();
const flickerAlpha=0.2+Math.sin(_now/300)*0.15+Math.sin(_now/170)*0.05;
ctx.globalAlpha=flickerAlpha;
ctx.fillStyle=ph.color||'#666';
const phcx=ph.x*T+T/2,phcy=ph.y*T+T/2;
ctx.beginPath();ctx.arc(phcx,phcy,T/3,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='rgba(160,0,255,0.3)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
ctx.beginPath();ctx.arc(phcx,phcy,T/3+2,0,Math.PI*2);ctx.stroke();
ctx.setLineDash([]);
ctx.restore();
});
}
// 粒子渲染
updateAndDrawParticles();
// 浮动伤害数字
updateAndDrawFloatingTexts();
// PixiJS 手动渲染（粒子+文字层）
if(pixiApp)try{pixiApp.renderer.render(pixiApp.stage);}catch(e){}
if(_shook)ctx.restore();

const p=game.player;

// === 污染视觉后处理 ===
ctx.globalAlpha=1;
if(pol>40){
  // 2b: 屏幕边缘腐蚀（污染>40%）
  const edgeIntensity=Math.min(1,(pol-40)/60); // 0~1
  const edgeW=8+edgeIntensity*20;
  // 边缘黑暗渐变
  const edgeGradL=ctx.createLinearGradient(0,0,edgeW,0);
  edgeGradL.addColorStop(0,'rgba(34,32,64,'+(0.3+edgeIntensity*0.5)+')');edgeGradL.addColorStop(1,'transparent');
  ctx.fillStyle=edgeGradL;ctx.fillRect(0,0,edgeW,H);
  const edgeGradR=ctx.createLinearGradient(W,0,W-edgeW,0);
  edgeGradR.addColorStop(0,'rgba(34,32,64,'+(0.3+edgeIntensity*0.5)+')');edgeGradR.addColorStop(1,'transparent');
  ctx.fillStyle=edgeGradR;ctx.fillRect(W-edgeW,0,edgeW,H);
  const edgeGradT=ctx.createLinearGradient(0,0,0,edgeW);
  edgeGradT.addColorStop(0,'rgba(34,32,64,'+(0.3+edgeIntensity*0.5)+')');edgeGradT.addColorStop(1,'transparent');
  ctx.fillStyle=edgeGradT;ctx.fillRect(0,0,W,edgeW);
  const edgeGradB=ctx.createLinearGradient(0,H,0,H-edgeW);
  edgeGradB.addColorStop(0,'rgba(34,32,64,'+(0.3+edgeIntensity*0.5)+')');edgeGradB.addColorStop(1,'transparent');
  ctx.fillStyle=edgeGradB;ctx.fillRect(0,H-edgeW,W,edgeW);
  // 有机腐蚀斑点（边缘随机洋红/紫色斑）
  if(Math.random()<edgeIntensity*0.4){
    const eColor=pol>70?'rgba(255,0,110,'+(0.05+edgeIntensity*0.1)+')':'rgba(180,85,255,'+(0.05+edgeIntensity*0.08)+')';
    ctx.fillStyle=eColor;
    for(let ei=0;ei<2+Math.floor(edgeIntensity*4);ei++){
      const side=Math.floor(Math.random()*4);
      let ex,ey;
      if(side===0){ex=Math.random()*edgeW;ey=Math.random()*H;}
      else if(side===1){ex=W-Math.random()*edgeW;ey=Math.random()*H;}
      else if(side===2){ex=Math.random()*W;ey=Math.random()*edgeW;}
      else{ex=Math.random()*W;ey=H-Math.random()*edgeW;}
      ctx.beginPath();ctx.arc(ex,ey,3+Math.random()*6,0,Math.PI*2);ctx.fill();
    }
  }
}
if(pol>60){
  // 2a: 色散效果 (Chromatic Aberration) — 每3帧执行一次降低性能开销
  if(!window._caFrame)window._caFrame=0;
  window._caFrame++;
  if(window._caFrame%6===0&&!game._lowFPS){
    const caShift=Math.floor(1+(pol-60)*0.075); // 1~4px
    try{
      const imgData=ctx.getImageData(0,0,W,H);
      const d=imgData.data;
      const out=ctx.createImageData(W,H);
      const o=out.data;
      for(let y=0;y<H;y++){
        for(let x=0;x<W;x++){
          const idx=(y*W+x)*4;
          // R通道右移
          const rx=Math.min(W-1,x+caShift);
          o[idx]=d[(y*W+rx)*4];
          // G通道不动
          o[idx+1]=d[idx+1];
          // B通道左移
          const bx=Math.max(0,x-caShift);
          o[idx+2]=d[(y*W+bx)*4+2];
          o[idx+3]=d[idx+3];
        }
      }
      ctx.putImageData(out,0,0);
    }catch(e){}
  }
}
if(pol>75){
  // 2c: Glitch 故障效果 — 3%概率随机水平切片位移（低帧率时跳过）
  if(!window._glitchFrames)window._glitchFrames=0;
  if(window._glitchFrames>0){
    window._glitchFrames--;
  }else if(!game._lowFPS&&Math.random()<0.03){
    window._glitchFrames=2+Math.floor(Math.random()*2); // 持续2-3帧
    try{
      const sliceCount=3+Math.floor(Math.random()*4);
      const imgData=ctx.getImageData(0,0,W,H);
      for(let si=0;si<sliceCount;si++){
        const sy=Math.floor(Math.random()*H);
        const sh=4+Math.floor(Math.random()*12);
        const shift=Math.floor((Math.random()-0.5)*16);
        if(shift===0)continue;
        const slice=ctx.getImageData(0,sy,W,Math.min(sh,H-sy));
        ctx.putImageData(slice,shift,sy);
      }
    }catch(e){}
  }
}

// === 更新所有UI（使用DOM缓存） ===
if(!_$.hpFill)_cacheDom();
if(!_$.hpFill)return; // DOM未就绪，跳过UI更新
const lie=game.statLieOffset||{atk:0,def:0,hp:0};
const displayHp=p.hp+lie.hp;
const displayAtk=p.atk+lie.atk;
const displayDef=p.def+lie.def;
const hpPct=(p.hp/p.maxHp)*100;
_$.hpFill.style.width=hpPct+'%';
_$.hpFill.className='hp-fill'+(hpPct<30?' critical':hpPct<60?' low':'');
_$.hpText.textContent=displayHp+'/'+p.maxHp;
var _polZone=Math.min(5,Math.ceil(game.floor/10));var _polAdd=_polZone<=2?1:_polZone<=4?2:3;
var _pr=getEvolutionEffect('pollutionReduce');if(_pr)_polAdd=Math.max(0,_polAdd-_pr);
_$.polText.textContent=p.pollution+'%'+(p.pollution>=70?' ⚠':'');
_$.polText.title=(game.floor<=10?'前10层免疫每层污染':'每层+'+_polAdd+'污染')+(p.pollution>=85?' | 即将崩溃！':p.pollution>=70?' | 接近崩溃':'');
_$.polBadge.className='pol-badge'+(p.pollution>80?' danger':p.pollution>60?' warning':'');
// 附身率预测: 战斗中显示当前目标，探索中显示 idle
if(_$.possBadge&&_$.possText){
  if(game.target&&game.target.hp>0&&!p.possessed[game.target.id]){
    try{
      var _pRate=Math.round(getNegBaseRate()*100);
      _$.possText.textContent=_pRate+'%';
      var _pCls=_pRate<30?'low':_pRate<60?'mid':'high';
      _$.possBadge.className='poss-badge '+_pCls;
      _$.possBadge.title='附身成功率: '+_pRate+'%（削弱目标 HP 可提升）';
    }catch(e){_$.possText.textContent='--';_$.possBadge.className='poss-badge idle';}
  }else{
    _$.possText.textContent='--';
    _$.possBadge.className='poss-badge idle';
    _$.possBadge.title='附身成功率预测（进入战斗时显示）';
  }
}
if(p.pollution>=60&&!_tutorialShown.pollution)checkTutorial('pollution');
_$.atkTop.textContent=displayAtk;
_$.defTop.textContent=displayDef;
// 签名: 哑剧模式
if(game._sigFlags.hideNumbers){
  _$.hpText.textContent='???/???';
  _$.atkTop.textContent='???';
  _$.defTop.textContent='???';
}
_$.floorNum.textContent=game.floor;
_$.floorNum2.textContent=game.floor;
_$.floorName.textContent=getFloorName()+(game._routeMods?' '+game._routeIcon+game._routeName:'')+(game._floorSignature?' '+game._floorSignature.icon+game._floorSignature.name:'');
_$.evoBottom.textContent=p.evoPoints;
_$.explorePct.textContent=getExplorePercent(game.floor)+'%';
// 职业资源显示
if(_$.classResource)_$.classResource.textContent=getClassResourceDisplay();
if(_$.classNameTop){const cc=classColors[p.playerClass];_$.classNameTop.textContent=cc.icon+' '+cc.name;_$.classNameTop.style.color=cc.primary;}
if(_$.dpadCenter){const cc=classColors[p.playerClass];_$.dpadCenter.textContent=cc.icon;_$.dpadCenter.style.color=cc.primary;}
// 形态信息
var _hudEvo=getFormEvoLevel(p.formType);
if(_hudEvo>0){
  var _hudEvoPct=_hudEvo===3?18:_hudEvo===2?10:5;
  var _hudEvoColor=_hudEvo===3?'#ffd700':_hudEvo===2?'#b455ff':'#00c8ff';
  _$.formNameTop.innerHTML=p.name+' <span style="color:'+_hudEvoColor+';font-size:9px;font-weight:900;margin-left:2px;text-shadow:0 0 4px currentColor" title="形态进化 Lv.'+_hudEvo+' (ATK +'+_hudEvoPct+'%)">Lv.'+_hudEvo+'</span>';
}else{
  _$.formNameTop.textContent=p.name;
}
_$.traitsTop.innerHTML=p.traits.slice(0,3).map(t=>'<span class="mini-trait" style="cursor:pointer" onclick="showTraitInfo(\''+t+'\')" title="点击查看效果">'+t+' ⓘ</span>').join('');
// 污染视觉层
_$.polOverlay.className=p.pollution>=100?'pol-lv-100':p.pollution>=85?'pol-lv-85':p.pollution>=70?'pol-lv-70':p.pollution>=50?'pol-lv-50':p.pollution>=30?'pol-lv-30':'pol-lv-0';
// Canvas污染效果（节流：每6帧更新一次）
_polFrame++;
if(_polFrame%6===0){
if(pol>=85){
canvas.style.filter='drop-shadow('+(Math.random()*4-2)+'px 0 0 rgba(255,0,0,0.3)) drop-shadow('+(Math.random()*4-2)+'px 0 0 rgba(0,255,208,0.3))';
canvas.style.transform='translate('+(Math.random()*3-1.5)+'px,'+(Math.random()*2-1)+'px)';
}else if(pol>=70){
const rotate=Math.random()>0.95?'rotate(90deg)':'';
canvas.style.filter='drop-shadow('+(Math.random()*3-1.5)+'px 0 0 rgba(255,0,0,0.2)) drop-shadow('+(Math.random()*3-1.5)+'px 0 0 rgba(0,100,255,0.2))';
canvas.style.transform=rotate;
}else if(pol>=50){
canvas.style.filter='hue-rotate(5deg)';
canvas.style.transform='';
}else{canvas.style.filter='none';canvas.style.transform='';}
}
// 更新形态栏
updateFormBar();
// 更新小地图（战斗中隐藏）
if(_$.minimapContainer){if(game.target)_$.minimapContainer.classList.add('hidden');else _$.minimapContainer.classList.remove('hidden');}
renderMinimap();
// 更新职业按钮
if(_$.btnUltimate){
  const ult=classUltimates[p.playerClass];
  if(p.ultimateActive){_$.btnUltimate.innerHTML=ult.icon+'<span class="skill-main-label">'+p.ultimateTurns+'回合</span>';_$.btnUltimate.disabled=true;_$.btnUltimate.style.opacity='0.6';}
  else if(p.ultimateCooldown>0){_$.btnUltimate.innerHTML=ult.icon+'<span class="skill-main-label">CD:'+p.ultimateCooldown+'</span>';_$.btnUltimate.disabled=true;_$.btnUltimate.style.opacity='0.4';}
  else{_$.btnUltimate.innerHTML=ult.icon+'<span class="skill-main-label">'+ult.name+'</span>';_$.btnUltimate.disabled=false;_$.btnUltimate.style.opacity='1';}
  const cc=classColors[p.playerClass];
  _$.btnUltimate.style.borderColor=cc.primary;_$.btnUltimate.style.color=cc.primary;
}
if(_$.btnStealth)_$.btnStealth.style.display=p.playerClass==='ghost'?'inline-block':'none';
// 冲刺按钮（迅捷/飞行特性时显示）
if(_$.btnSprint){
  const hasSprint=hasTraitEffect('moveDouble');
  _$.btnSprint.style.display=hasSprint?'inline-block':'none';
  if(hasSprint){
    _$.btnSprint.textContent=p._sprintEnabled?'⚡冲刺ON':'冲刺OFF';
    _$.btnSprint.style.borderColor=p._sprintEnabled?'#00ffd0':'#555';
    _$.btnSprint.style.color=p._sprintEnabled?'#00ffd0':'#555';
  }
}
// 更新锚点状态
if(typeof updateAnchorBar==='function')updateAnchorBar();
// 低HP警告检测
checkLowHpWarning();
}catch(e){console.error('render error:',e);}
}

// 启动主循环（必须在 particles/_floatingTexts/_renderDirty 等本文件定义的全局生效后调用）
if(typeof gameLoop==="function")gameLoop(0);
