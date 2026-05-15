// ================================================================
// 楼层系统：状态保存/恢复 + 路线分支 + 关卡生成 + 移动 + 祭坛
// ================================================================
// 保存当前楼层状态到历史
function saveFloorState(){
  game.floorHistory[game.floor]={
    tiles:game.tiles.map(r=>r.slice()),
    monsters:JSON.parse(JSON.stringify(game.monsters.filter(m=>m.hp>0))),
    cleared:game.floorCleared[game.floor]||false
  };
  // 限制历史记录，保留最近 20 层，防止内存无限增长
  const keys=Object.keys(game.floorHistory).map(Number).sort((a,b)=>a-b);
  while(keys.length>20){delete game.floorHistory[keys.shift()];}
}

// 从历史恢复楼层状态
function restoreFloorState(f){
  const h=game.floorHistory[f];
  if(!h)return false;
  game.tiles=h.tiles.map(r=>r.slice());
  game.monsters=JSON.parse(JSON.stringify(h.monsters));
  return true;
}

// tile类型: 0=墙 1=地板 2=下楼梯 3=祭坛 4=事件 5=资源 6=上楼梯
// ================================================================
// 路线分支系统
// ================================================================
// 首发版：3条路线（猎场/净土/污染深渊），固定显示而非随机抽取
// 后续版本可启用：深渊/试炼/迷宫/荒原（保留代码）
const routePool=[
  {name:'猎场',icon:'⚔',desc:'怪物强化30% EP×1.5',color:'#ff8800',mods:{monsterHpMult:1.3,monsterAtkMult:1.2,epMult:1.5}},
  {name:'净土',icon:'🌿',desc:'怪物弱化30% 每层回10%HP',color:'#00ffd0',mods:{monsterHpMult:0.7,monsterAtkMult:0.7,healPerFloor:0.1}},
  {name:'污染深渊',icon:'⚗',desc:'附身率+50% 怪物+2 每层+10污染',color:'#b455ff',mods:{possessBonus:0.5,extraMonsters:2,polPerFloor:10}},
  // --- 以下为后续版本启用，首发版不显示 ---
  {name:'深渊',icon:'🕳',desc:'怪物数量+2 碎片掉率翻倍',color:'#b455ff',mods:{extraMonsters:2,fragMult:2},_disabled:true},
  {name:'试炼',icon:'⚡',desc:'怪物ATK×1.5 击杀+50%EP',color:'#ff0',mods:{monsterAtkMult:1.5,epMult:1.5},_disabled:true},
  {name:'迷宫',icon:'🌀',desc:'更多内墙 隐藏资源房×2',color:'#00ffd0',mods:{extraWalls:6,extraResRoom:2},_disabled:true},
  {name:'荒原',icon:'🏜',desc:'怪物少 无祭坛 EP×2',color:'#ca8',mods:{monsterCountOverride:3,noAltar:true,epMult:2},_disabled:true},
];
function showRouteChoice(){
  const el=document.getElementById('route-overlay');
  el.style.display='flex';
  const cardsEl=document.getElementById('route-cards');
  // 首发版：固定显示前3条（猎场/净土/污染深渊）而非随机抽取
  const choices=routePool.filter(r=>!r._disabled).slice(0,3);
  cardsEl.innerHTML='';
  choices.forEach((r,i)=>{
    cardsEl.innerHTML+='<div onclick="selectRoute('+i+')" style="cursor:pointer;padding:12px;border:1px solid '+r.color+';border-radius:8px;background:rgba(0,0,0,0.6);transition:transform .2s,box-shadow .2s" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'\'" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'\'">'
      +'<div style="font-size:16px;color:'+r.color+';font-weight:bold">'+r.icon+' '+r.name+'</div>'
      +'<div style="font-size:11px;color:#ccc;margin-top:4px">'+r.desc+'</div>'
      +'<div style="font-size:9px;color:#888;margin-top:4px">持续5层</div>'
      +'</div>';
  });
  // 存储当前可选
  game._routeChoices=choices;
}
function selectRoute(idx){
  const r=game._routeChoices[idx];
  game._routeMods=r.mods;
  game._routeFloors=5;
  game._routeName=r.name;
  game._routeIcon=r.icon;
  game._routeColor=r.color;
  document.getElementById('route-overlay').style.display='none';
  addMsg(r.icon+' 进入'+r.name+'路线 (持续5层)');
  // 重新生成当前层以应用路线效果
  delete game.floorHistory[game.floor];
  generateFloor();
  render();
}
function generateFloor(){
var _origRandom;
if(game._seed!==undefined){
  var _s=game._seed+game.floor*9973;
  _origRandom=Math.random;
  Math.random=function(){_s=(_s*16807+0)%2147483647;return(_s-1)/2147483646;};
}
// 短局 zone 映射：12 层压缩到 5 区
function getFloorZone(f){
  if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()){
    return window.ExpeditionMode?ExpeditionMode.getZone(f):Math.min(4,Math.ceil(f/5));
  }
  if(!window.GameModes||!GameModes.isShort()) return Math.min(5,Math.ceil(f/10));
  if(f<=3) return 1;
  if(f<=6) return 2;
  if(f<=9) return 3;
  if(f<=11) return 4;
  return 5;
}
game._fragDropCount=0;
game._fragDrops=[];
game._waveCount=0;
GameEvents.emit('floor:change',{floor:game.floor,zone:Math.min(5,Math.ceil(game.floor/10))});
invalidateStaticLayer();
// 先尝试从历史恢复（第1层新手引导未完成时不从缓存恢复）
if(game.floorHistory[game.floor]&&!(game.floor===1&&game._tutorialStage<2)){
  restoreFloorState(game.floor);
  return;
}
game.tiles=[];
for(let y=0;y<13;y++){
game.tiles[y]=[];
for(let x=0;x<13;x++){
if(x===0||y===0||x===12||y===12)game.tiles[y][x]=0;
else game.tiles[y][x]=1;
}
}
// 随机内墙（增加地图变化）
const wallCount=3+Math.floor(Math.random()*4)+((game._routeMods&&game._routeMods.extraWalls)||0);
// 保护区：关键位置及其相邻格不放墙（防止出生点/楼梯被堵死）
const _protected=new Set();
[[6,6],[2,6],[10,6]].forEach(function(p){
  for(let ddx=-1;ddx<=1;ddx++)for(let ddy=-1;ddy<=1;ddy++){
    if(Math.abs(ddx)+Math.abs(ddy)<=1)_protected.add((p[0]+ddx)+','+(p[1]+ddy));
  }
});
for(let w=0;w<wallCount;w++){
  const wx=2+Math.floor(Math.random()*9);
  const wy=2+Math.floor(Math.random()*9);
  if(_protected.has(wx+','+wy))continue;
  game.tiles[wy][wx]=0;
}
// 墙壁放完后连通性检查：确保所有地板格连通，孤岛直接填墙
(function ensureConnectivity(){
  function flood(sx,sy){
    const vis=new Set();const q=[[sx,sy]];vis.add(sx+','+sy);
    while(q.length){const[cx,cy]=q.shift();
      [[0,1],[0,-1],[1,0],[-1,0]].forEach(function(d){
        const nx2=cx+d[0],ny2=cy+d[1],k=nx2+','+ny2;
        if(nx2>=1&&ny2>=1&&nx2<=11&&ny2<=11&&!vis.has(k)&&game.tiles[ny2][nx2]!==0){vis.add(k);q.push([nx2,ny2]);}
      });
    }return vis;
  }
  // 从玩家第1层出生点(6,6)做flood fill
  const reachable=flood(6,6);
  // 确保两个楼梯位置可达，不可达时沿y=6打通水平走廊
  [[10,6],[2,6]].forEach(function(target){
    if(reachable.has(target[0]+','+target[1]))return;
    const x0=Math.min(6,target[0]),x1=Math.max(6,target[0]);
    for(let cx=x0;cx<=x1;cx++){
      if(game.tiles[6][cx]===0){game.tiles[6][cx]=1;reachable.add(cx+',6');}
    }
  });
  // 把不可达的孤岛地板格变成墙，防止怪物/物品刷在不可达区域
  for(let yy=1;yy<=11;yy++){
    for(let xx=1;xx<=11;xx++){
      if(game.tiles[yy][xx]!==0&&!reachable.has(xx+','+yy)){
        game.tiles[yy][xx]=0;
      }
    }
  }
})();
// 下楼梯（固定右侧）
game.tiles[6][10]=2;
// 上楼梯（2层以上才有，固定左侧）
if(game.floor>1)game.tiles[6][2]=6;
// 祭坛（每5层固定出现; 路线noAltar时禁止）
if(!(game._routeMods&&game._routeMods.noAltar)&&game.floor%5===0){
  let ax,ay,_t=0;do{ax=3+Math.floor(Math.random()*7);ay=2+Math.floor(Math.random()*9);_t++;}
  while((game.tiles[ay][ax]!==1||(ax===6&&ay===6))&&_t<50);
  if(_t<50)game.tiles[ay][ax]=3;
}
// 事件房（40%概率）
if(Math.random()<0.4){
  let ex,ey,_t=0;do{ex=2+Math.floor(Math.random()*9);ey=2+Math.floor(Math.random()*9);_t++;}
  while((game.tiles[ey][ex]!==1||(ex===6&&ey===6))&&_t<50);
  if(_t<50)game.tiles[ey][ex]=4;
}
// 资源房（50%概率）
if(Math.random()<0.5){
  let rx,ry,_t=0;do{rx=2+Math.floor(Math.random()*9);ry=2+Math.floor(Math.random()*9);_t++;}
  while((game.tiles[ry][rx]!==1||(rx===6&&ry===6))&&_t<50);
  if(_t<50)game.tiles[ry][rx]=5;
}
// 路线额外资源房
if(game._routeMods&&game._routeMods.extraResRoom){
  for(let er=0;er<game._routeMods.extraResRoom;er++){
    let rx2,ry2,_t=0;do{rx2=2+Math.floor(Math.random()*9);ry2=2+Math.floor(Math.random()*9);_t++;}
    while((game.tiles[ry2][rx2]!==1||(rx2===6&&ry2===6))&&_t<50);
    if(_t<50)game.tiles[ry2][rx2]=5;
  }
}
// 怪物生成（含难度曲线过渡）
game.monsters=[];
// 第1层新手引导：特殊怪物配置
if(game.floor===1&&game._tutorialStage<2){
  var _tutDog=monsterTemplates.dog;
  var _px=game.player.x,_py=game.player.y;
  // 教学走廊：玩家→楼梯（x=10,y=6）的水平直线
  var _tutY=_py;
  // 沿玩家东侧（朝楼梯方向）扫描可走格
  var _path=[];
  for(var _cx=_px+1;_cx<game.tiles[_tutY].length;_cx++){
    if(game.tiles[_tutY]&&game.tiles[_tutY][_cx]===1)_path.push(_cx);
  }
  // 鼠：路径首格（紧邻玩家，先打一只学操作）
  var _ratX=_path.length>0?_path[0]:_px+1, _ratY=_tutY;
  // 看门犬：路径中段，附身后玩家在此位置，需向东打通楼梯口
  var _dogIdx=Math.max(1,_path.length-3);
  var _dogX=_path[_dogIdx]||(_px+2), _dogY=_tutY;
  if(_dogX===_ratX){_dogX=_path[Math.min(_path.length-1,_dogIdx+1)]||(_px+3);}
  // 鼠：detectRange:1，玩家贴脸才会战斗，不会主动追
  game.monsters.push({id:'tut_rat',type:'rat',name:'虚弱实验鼠',hp:15,maxHp:15,atk:2,def:0,traits:[],color:'#8b4513',x:_ratX,y:_ratY,possessed:false,ai:'idle',alertLevel:2,homeX:_ratX,homeY:_ratY,detectRange:1,_tutorialHighlight:false,_tutPinned:true});
  // 看门犬：detectRange:1，pin 在原地
  game.monsters.push({id:'tut_dog',type:'dog',name:_tutDog.name,hp:_tutDog.maxHp,maxHp:_tutDog.maxHp,atk:_tutDog.atk,def:_tutDog.def,traits:_tutDog.traits.slice(),color:_tutDog.color,x:_dogX,y:_dogY,possessed:false,ai:'idle',alertLevel:0,homeX:_dogX,homeY:_dogY,detectRange:1,_tutPinned:true});
  // 楼梯口守卫：3 只 zone-1 怪把守 (10,6) 楼梯，必须全部击败才能下楼
  // (9,6) 直接挡路，(10,5)(10,7) 侧翼，组成"三守卫"阵型
  var _z1=Object.keys(monsterTemplates).filter(function(k){return monsterTemplates[k].zone===1&&!k.includes('boss')&&k!=='rat'&&k!=='dog';});
  var _guardSpots=[[9,6],[10,5],[10,7]];
  var _gPlaced=0;
  for(var _gi=0;_gi<_guardSpots.length;_gi++){
    var _gx=_guardSpots[_gi][0],_gy=_guardSpots[_gi][1];
    if(!game.tiles[_gy])continue;
    // 强制守卫位置为地板（教学保证可放置）
    if(game.tiles[_gy][_gx]!==1)game.tiles[_gy][_gx]=1;
    if(_gx===_ratX&&_gy===_ratY)continue;
    if(_gx===_dogX&&_gy===_dogY)continue;
    if(game.monsters.some(function(mm){return mm.x===_gx&&mm.y===_gy;}))continue;
    var _gk=_z1[_gPlaced%_z1.length]||'rat',_gm=monsterTemplates[_gk];
    // 守卫属性削弱：HP 60% / ATK 70%（适配看门犬玩家）
    var _ghp=Math.max(8,Math.floor(_gm.maxHp*0.6));
    var _gatk=Math.max(2,Math.floor(_gm.atk*0.7));
    game.monsters.push({id:'tut_guard_'+_gPlaced,type:_gk,name:'楼梯守卫·'+_gm.name,hp:_ghp,maxHp:_ghp,atk:_gatk,def:_gm.def,traits:_gm.traits.slice(),color:_gm.color,x:_gx,y:_gy,possessed:false,ai:'idle',alertLevel:1,homeX:_gx,homeY:_gy,detectRange:1,_tutPinned:true,_stairGuard:true});
    _gPlaced++;
  }
  if(game._tutorialStage===0&&!localStorage.getItem('pt_first_run_done')){setTimeout(function(){addMsg('<span style="color:#c6f;font-style:italic">你醒来了。微弱的意识在损坏的躯壳中闪烁。</span>');setTimeout(function(){addMsg('<span style="color:#ff8c00;font-weight:bold">➤ 靠近前方目标。</span>');checkTutorial('move');},1500);},800);}
  if(!game.explored[game.floor])game.explored[game.floor]=[];
  saveFloorState();
  return;
}
const zone=getFloorZone(game.floor);
// 过渡楼层：跨区混合怪物（9/19/29/39层混入下一区30%，11/21/31/41层混入上一区40%）
const floorInZone=game.floor%10;
let prevZoneRatio=0;
if(floorInZone===1&&zone>1)prevZoneRatio=0.4; // X1层: 40%上一区怪物
else if(floorInZone===2&&zone>1)prevZoneRatio=0.2; // X2层: 20%上一区怪物
let nextZoneRatio=0;
if(floorInZone===9&&zone<5)nextZoneRatio=0.3; // X9层: 30%下一区怪物
else if(floorInZone===8&&zone<5)nextZoneRatio=0.15; // X8层: 15%下一区怪物
const types=Object.keys(monsterTemplates).filter(k=>monsterTemplates[k].zone===zone&&!k.includes('boss'));
const prevTypes=zone>1?Object.keys(monsterTemplates).filter(k=>monsterTemplates[k].zone===zone-1&&!k.includes('boss')):[];
const nextTypes=zone<5?Object.keys(monsterTemplates).filter(k=>monsterTemplates[k].zone===zone+1&&!k.includes('boss')):[];
const bossTypes=Object.keys(monsterTemplates).filter(k=>monsterTemplates[k].zone===zone&&k.includes('boss'));
var _isBossFloor=(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition())
  ?(game.floor%5===0)
  :(game.floor%10===0);
if(_isBossFloor&&bossTypes.length>0){
const type=bossTypes[0];const tmpl=monsterTemplates[type];
var _bossHp=tmpl.maxHp,_bossAtk=tmpl.atk,_bossDef=tmpl.def;
// 远征模式：Boss按曲线缩放（原始Boss数值面向经典模式高层，远征需要压缩）
if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){
  var _bcv=ExpeditionMode.getFloorCurve(game.floor);
  _bossHp=Math.floor(_bossHp*_bcv.hpScale*0.7);
  _bossAtk=Math.floor(_bossAtk*_bcv.atkScale*0.6);
  _bossDef=Math.floor(_bossDef*_bcv.atkScale*0.6);
}
// Boss层也有护卫怪（2-3只当区普通怪）
var _guardCount=2+Math.floor(zone/2);
for(var _gi=0;_gi<_guardCount;_gi++){
  var _gpool=types;var _gt=_gpool[Math.floor(Math.random()*_gpool.length)];var _gtm=monsterTemplates[_gt];
  var _ghp=_gtm.maxHp,_gatk=_gtm.atk;
  if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){var _gcv=ExpeditionMode.getFloorCurve(game.floor);_ghp=Math.floor(_ghp*_gcv.hpScale);_gatk=Math.floor(_gatk*_gcv.atkScale);}
  var _gx,_gy,_gst=0;do{_gx=2+Math.floor(Math.random()*9);_gy=2+Math.floor(Math.random()*9);_gst++;}while(_gst<100&&((_gx===6&&_gy===6)||(_gx===10&&_gy===6)||(_gx===6&&_gy===3)||game.tiles[_gy][_gx]!==1||game.monsters.some(function(em){return em.x===_gx&&em.y===_gy;})));
  if(_gst<100)game.monsters.push({id:_gt+'g'+_gi,type:_gt,name:_gtm.name,hp:_ghp,maxHp:_ghp,atk:_gatk,def:_gtm.def,traits:_gtm.traits.slice(),color:_gtm.color,x:_gx,y:_gy,possessed:false,ai:getMonsterAI(_gtm),alertLevel:0,homeX:_gx,homeY:_gy,detectRange:getMonsterDetectRange(_gtm)});
}
game.monsters.push({id:type+'0',type:type,name:tmpl.name,hp:_bossHp,maxHp:_bossHp,atk:_bossAtk,def:_bossDef,traits:tmpl.traits.slice(),color:tmpl.color,x:6,y:3,possessed:false,
  ai:'aggressive',alertLevel:0,homeX:6,homeY:3,detectRange:6,_stairGuard:true});
}else{
var _fc=null;
if(window.GameModes&&GameModes.isShort()&&window.ShortMode){_fc={count:ShortMode.getFloorCurve(game.floor).count};}
else if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){_fc=ExpeditionMode.getFloorCurve(game.floor);}
else if(typeof getFullFloorCurve==='function'){_fc=getFullFloorCurve(game.floor);}
let count=_fc?_fc.count:(5+Math.floor(game.floor/5));
if(game.floor%10===9&&!(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()))count+=2;
if(game._routeMods&&game._routeMods.monsterCountOverride!==undefined)count=game._routeMods.monsterCountOverride;
if(game._routeMods&&game._routeMods.extraMonsters)count+=game._routeMods.extraMonsters;
count=Math.min(count,15); // 上限15防止地图太挤
for(let i=0;i<count;i++){
// 根据过渡比例选择怪物池
let pool=types;
const roll=Math.random();
if(prevZoneRatio>0&&roll<prevZoneRatio&&prevTypes.length>0)pool=prevTypes;
else if(nextZoneRatio>0&&roll>(1-nextZoneRatio)&&nextTypes.length>0)pool=nextTypes;
const type=pool[Math.floor(Math.random()*pool.length)];const tmpl=monsterTemplates[type];
let mx,my,_spawnTry=0;do{mx=2+Math.floor(Math.random()*9);my=2+Math.floor(Math.random()*9);_spawnTry++;}while(_spawnTry<100&&((mx===6&&my===6)||(mx===10&&my===6)||(mx===2&&my===6)||game.tiles[my][mx]!==1||game.monsters.some(em=>em.x===mx&&em.y===my)));
if(_spawnTry>=100)continue;
let mHp=tmpl.maxHp,mAtk=tmpl.atk;
// 短局模式：怪物属性按三浪曲线动态缩放
if(window.GameModes&&GameModes.isShort()&&window.ShortMode){
  var _curve=ShortMode.getFloorCurve(game.floor);
  var _pHp=game.player.maxHp||120,_pAtk=game.player.atk||8;
  mHp=Math.max(20,Math.floor(_pHp*_curve.hpMult*(0.8+Math.random()*0.4)));
  mAtk=Math.max(3,Math.floor(_pAtk*_curve.atkMult*(0.8+Math.random()*0.4)));
  // 兜底：避免玩家裸体时怪物退化得过弱
  var _minScale=0.25+game.floor*0.05;
  mHp=Math.max(mHp,Math.floor(tmpl.maxHp*_minScale));
  mAtk=Math.max(mAtk,Math.floor(tmpl.atk*_minScale));
}
// 远征模式：怪物属性按远征曲线缩放
else if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){
  var _ecv=ExpeditionMode.getFloorCurve(game.floor);
  mHp=Math.floor(tmpl.maxHp*_ecv.hpScale);
  mAtk=Math.floor(tmpl.atk*_ecv.atkScale);
}
// 过渡层的下一区怪物适当弱化（HP/ATK×0.7），上一区怪物适当强化（HP/ATK×1.2）
if(nextZoneRatio>0&&pool===nextTypes){mHp=Math.max(1,Math.floor(mHp*0.7));mAtk=Math.max(1,Math.floor(mAtk*0.7));}
if(prevZoneRatio>0&&pool===prevTypes){mHp=Math.floor(mHp*1.2);mAtk=Math.floor(mAtk*1.2);}
if(game._routeMods&&game._routeMods.monsterHpMult){mHp=Math.max(1,Math.floor(mHp*game._routeMods.monsterHpMult));}
if(game._routeMods&&game._routeMods.monsterAtkMult){mAtk=Math.max(1,Math.floor(mAtk*game._routeMods.monsterAtkMult));}
// 全模式爽感曲线缩放（替代线性+1%/层）— 短局/远征已在上方独立处理
var _skipFloorScale=window.GameModes&&(GameModes.isShort()||(GameModes.isExpedition&&GameModes.isExpedition()));
if(!_skipFloorScale){
var _fullCv=typeof getFullFloorCurve==='function'?getFullFloorCurve(game.floor):null;
var _floorScale=_fullCv?_fullCv.hpScale:(1+game.floor*0.01);
var _floorAtkScale=_fullCv?_fullCv.atkScale:(1+game.floor*0.01);
mHp=Math.floor(mHp*_floorScale);mAtk=Math.floor(mAtk*_floorAtkScale);
}
// 模式 HP 缩放
if(window.GameRules&&GameRules.hpMult!==1)mHp=Math.max(1,Math.floor(mHp*GameRules.hpMult));
// 精英怪
var _isElite=false;
if(window.GameModes&&GameModes.isShort()&&window.ShortMode){
  var _eRate=ShortMode.getFloorCurve(game.floor).eliteRate;
  if(game._dailyEliteMult)_eRate=Math.min(0.8,_eRate*game._dailyEliteMult);
  _isElite=Math.random()<_eRate;
}else if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){
  var _eRate2=ExpeditionMode.getFloorCurve(game.floor).eliteRate;
  if(game._dailyEliteMult)_eRate2=Math.min(0.8,_eRate2*game._dailyEliteMult);
  _isElite=Math.random()<_eRate2;
}else if(_fullCv){
  _isElite=Math.random()<_fullCv.eliteRate;
}else{
  _isElite=game.floor>=5&&Math.random()<0.2;
}
if(_isElite){mHp=Math.floor(mHp*1.6);mAtk=Math.floor(mAtk*1.4);}
if(game._dailyBounty){mHp=Math.floor(mHp*1.5);}
var mDef=tmpl.def;if(_isElite)mDef=Math.floor(mDef*1.3);
game.monsters.push({id:type+i,type:type,name:(_isElite?'★ ':'')+tmpl.name,hp:mHp,maxHp:mHp,atk:mAtk,def:mDef,traits:tmpl.traits.slice(),color:tmpl.color,x:mx,y:my,possessed:false,
  ai:getMonsterAI(tmpl),alertLevel:0,homeX:mx,homeY:my,detectRange:getMonsterDetectRange(tmpl),_elite:_isElite||false});
if(game._dailyBerserkAll){var _lastM=game.monsters[game.monsters.length-1];if(_lastM.traits.indexOf('狂暴')===-1)_lastM.traits.push('狂暴');}
}
// 诱饵精英：全模式在关键转折层出现，短局仅F5/F8
var _lureFloors=(window.GameModes&&GameModes.isShort())?[5,8]:[5,8,15,18,25,28,35,38,45,48];
if(_lureFloors.indexOf(game.floor)!==-1){
  var _hasLure=game.monsters.some(function(mm){return mm._lurePol;});
  if(!_hasLure){
    var _luPool=types;var _luT=_luPool[Math.floor(Math.random()*_luPool.length)];var _luTm=monsterTemplates[_luT];
    var _lx,_ly,_lst=0;do{_lx=2+Math.floor(Math.random()*9);_ly=2+Math.floor(Math.random()*9);_lst++;}while(_lst<100&&((_lx===6&&_ly===6)||(_lx===10&&_ly===6)||(_lx===2&&_ly===6)||game.tiles[_ly][_lx]!==1||game.monsters.some(function(em){return em.x===_lx&&em.y===_ly;})));
    if(_lst<100){
      var _luHp=Math.floor(_luTm.maxHp*2),_luAtk=Math.floor(_luTm.atk*1.8),_luDef=Math.floor(_luTm.def*1.5);
      var _lurePollCost=Math.min(30,15+Math.floor(game.floor/10)*3);
      game.monsters.push({id:'lure'+game.floor,type:_luT,name:'☣ '+_luTm.name+'（污染体）',hp:_luHp,maxHp:_luHp,atk:_luAtk,def:_luDef,traits:_luTm.traits.slice(),color:'#b455ff',x:_lx,y:_ly,possessed:false,ai:getMonsterAI(_luTm),alertLevel:0,homeX:_lx,homeY:_ly,detectRange:getMonsterDetectRange(_luTm),_elite:true,_lurePol:_lurePollCost});
    }
  }
}
// 下楼梯守卫：每层至少 1 只怪守住通往下一层的楼梯
if(game.floor < (window.GameRules&&GameRules.floorCap?GameRules.floorCap:50) && !game.monsters.some(function(mm){return mm._stairGuard&&mm.hp>0;})){
  var _guardIdx=-1,_guardBest=999;
  for(var _gi=0;_gi<game.monsters.length;_gi++){
    var _gm=game.monsters[_gi];
    if(!_gm||_gm.hp<=0) continue;
    var _dist=Math.abs(_gm.x-10)+Math.abs(_gm.y-6);
    if(_dist<_guardBest){_guardBest=_dist;_guardIdx=_gi;}
  }
  var _guardSpots=[[9,6],[10,5],[10,7],[9,5],[9,7],[8,6],[8,5],[8,7]];
  if(_guardIdx>=0){
    var _guard=game.monsters[_guardIdx];
    for(var _gs=0;_gs<_guardSpots.length;_gs++){
      var _gx=_guardSpots[_gs][0],_gy=_guardSpots[_gs][1];
      if(game.tiles[_gy]&&game.tiles[_gy][_gx]===1&&!game.monsters.some(function(em,ei){return ei!==_guardIdx&&em.x===_gx&&em.y===_gy&&em.hp>0;})&&!(game.player.x===_gx&&game.player.y===_gy)){
        _guard.x=_gx;_guard.y=_gy;_guard.homeX=_gx;_guard.homeY=_gy;break;
      }
    }
    _guard.ai='aggressive';
    _guard.alertLevel=2;
    _guard.detectRange=Math.max(_guard.detectRange||3,6);
    _guard._stairGuard=true;
  }
}}
// 初始化探索度
if(!game.explored[game.floor])game.explored[game.floor]=[];
// 保存到历史
saveFloorState();
if(_origRandom) Math.random=_origRandom;
}
let _lastMoveTime=0;
function move(dx,dy){
markDirty();
if(typeof dismissTutorial==='function')dismissTutorial('move');
if(window.StrategyHints)StrategyHints.check('move');
const now=Date.now();if(now-_lastMoveTime<150)return;_lastMoveTime=now;
if(game.target)return; // 战斗中不能移动
try{sounds.move();}catch(e){}
const nx=game.player.x+dx;const ny=game.player.y+dy;
// 特性：相位 可穿越墙壁
const canPhase=hasTraitEffect('phaseWalk');
if(nx<1||ny<1||nx>11||ny>11){flashMoveBtn(dx,dy);return;}
if(game.tiles[ny][nx]===0&&!canPhase){flashMoveBtn(dx,dy);checkHiddenStory('wall_bump');if(window.StrategyHints)StrategyHints.check('wall_bump');return;}
// 记录方向
if(dx>0)game.player.lastDir='right';else if(dx<0)game.player.lastDir='left';
if(dy>0)game.player.lastDir='down';else if(dy<0)game.player.lastDir='up';
const m=game.monsters.find(m=>m.hp>0&&m.x===nx&&m.y===ny);
// 签名: 和平区(怪物不主动拦路，但玩家走到怪物上仍可战斗)
if(m){
  // 幽灵潜行：不触发遭遇，穿过怪物（消耗潜行状态）
  if(game.player.stealthActive){
    game.player.stealthActive=false;
    game.player.x=nx;game.player.y=ny;
    addMsg('🌑 潜行穿过 '+m.name+'（潜行结束）');
    render();return;
  }else{
    game.target=m;showCombat();return;
  }
}
// 泰坦践踏（移动后对相邻怪物伤害 — 在位置更新前先记录目标）
// 探索度追踪
const expKey=nx+','+ny;
if(!game.explored[game.floor])game.explored[game.floor]=[];
if(game.explored[game.floor].indexOf(expKey)===-1)game.explored[game.floor].push(expKey);
// 下楼梯 tile=2
if(game.tiles[ny][nx]===2){
if(game._forceTutorial&&game._tutorialStage<2){addMsg('<span style="color:#ff8c00">➤ 先附身一只怪物再下楼 — 这是「你也是我」的核心机制</span>');render();return;}
var _guardAlive=game.monsters.some(function(m){return m._stairGuard&&m.hp>0;});
if(_guardAlive){addMsg('<span style="color:#ff006e;font-weight:bold">⚠ 楼梯守卫还活着！击败或附身它才能继续前进。</span>');render();return;}
game.player.x=nx;game.player.y=ny;
checkFragPickup(nx,ny);
saveFloorState();
showFloorNav('down');
return;
}
// 上楼梯 tile=6
if(game.tiles[ny][nx]===6){
if(game.floor<=1){addMsg('已在最高层');render();return;}
game.player.x=nx;game.player.y=ny;
checkFragPickup(nx,ny);
saveFloorState();
showFloorNav('up');
return;
}
// 祭坛 tile=3
if(game.tiles[ny][nx]===3){
game.player.x=nx;game.player.y=ny;
checkFragPickup(nx,ny);
triggerAltar();
return;
}
// 事件房 tile=4
if(game.tiles[ny][nx]===4){
game.player.x=nx;game.player.y=ny;
checkFragPickup(nx,ny);
game.tiles[ny][nx]=1; // 事件触发后变普通地板
triggerRandomEvent();
render();return;
}
// 资源房 tile=5
if(game.tiles[ny][nx]===5){
game.player.x=nx;game.player.y=ny;
checkFragPickup(nx,ny);
game.tiles[ny][nx]=1; // 资源拾取后变普通地板
const epGain=50+game.floor*10+Math.floor(Math.random()*50);
game.player.evoPoints+=epGain;
addMsg('发现资源！+'+epGain+'EP');
try{sounds.pickup();}catch(e){}
render();return;
}
game.player.x=nx;game.player.y=ny;
// 移动计数（隐藏剧情用）
game._moveCountThisFloor=(game._moveCountThisFloor||0)+1;
// 拾取地面碎片
checkFragPickup(nx,ny);
// 泰坦践踏
titanTrample(nx,ny);
// 特性：再生 每步回3%HP
const traitRegen=getTraitValue('regenPerTurn');
if(traitRegen){const heal=Math.max(1,Math.floor(game.player.maxHp*traitRegen));game.player.hp=Math.min(game.player.maxHp,game.player.hp+heal);}
// 基础回血：每3步回1%maxHP
if(!game._stepCount)game._stepCount=0;
game._stepCount++;
if(game._stepCount%3===0){const baseHeal=Math.max(1,Math.floor(game.player.maxHp*0.01));game.player.hp=Math.min(game.player.maxHp,game.player.hp+baseHeal);}
// 特性：迅捷 双步移动（需开启冲刺）
if((hasTraitEffect('moveDouble')||hasPassiveEffect('passiveSpeed'))&&game.player._sprintEnabled&&!game._doubleMoving){
  game._doubleMoving=true;
  const nx2=game.player.x+dx,ny2=game.player.y+dy;
  if(nx2>=1&&ny2>=1&&nx2<=11&&ny2<=11&&(game.tiles[ny2][nx2]!==0||(game.tiles[ny2][nx2]===0&&canPhase))){
    const m2=game.monsters.find(m=>m.hp>0&&m.x===nx2&&m.y===ny2);
    if(!m2){game.player.x=nx2;game.player.y=ny2;}
  }
  game._doubleMoving=false;
}
// 签名: 步数计数
if(game._sigFlags.stepCount!==undefined)game._sigFlags.stepCount++;
// 签名: 每步回复
if(game._sigFlags.regenPerStep){const regen=Math.max(1,Math.floor(game.player.maxHp*game._sigFlags.regenPerStep));game.player.hp=Math.min(game.player.maxHp,game.player.hp+regen);}
// 签名: 每步污染
if(game._sigFlags.polPerStep){if(typeof addEnvPollution==='function')addEnvPollution(game._sigFlags.polPerStep,null);else game.player.pollution=Math.min(100,game.player.pollution+game._sigFlags.polPerStep);}
// 签名: 污染风暴(每15步+3，原:每10步+5)
if(game._sigFlags.polStormSteps!==undefined){game._sigFlags.polStormSteps++;if(game._sigFlags.polStormSteps%15===0){var _psg=(typeof addEnvPollution==='function')?addEnvPollution(3,null):(game.player.pollution=Math.min(100,game.player.pollution+3),3);if(_psg>0)addMsg('☢ 污染风暴 +'+_psg);}}
// 签名: 迷雾追踪者
if(typeof moveStalker==='function')moveStalker();
// === 区域环境效果 ===
const _moveZone=Math.min(5,Math.ceil(game.floor/10));
if(_moveZone===2&&Math.random()<0.03){var _spg=(typeof addEnvPollution==='function')?addEnvPollution(1,null):(game.player.pollution=Math.min(100,game.player.pollution+1),1);if(_spg>0)addMsg('<span style="color:#b455ff;font-size:0.8em">🦠 孢子弥漫 污染+'+_spg+'</span>');}
if(_moveZone===4){
  if(!game._zoneStepCount)game._zoneStepCount=0;game._zoneStepCount++;
  if(game._zoneStepCount%5===0){const corrode=Math.max(1,Math.floor(game.player.maxHp*0.02));game.player.hp=Math.max(1,game.player.hp-corrode);addMsg('<span style="color:#ff006e;font-size:0.8em">🧪 腐蚀地面 HP-'+corrode+'</span>');}
}
if(_moveZone===5&&Math.random()<0.03){
  let rx,ry,tries=0;do{rx=2+Math.floor(Math.random()*9);ry=2+Math.floor(Math.random()*9);tries++;}while(tries<20&&(game.tiles[ry][rx]===0||game.monsters.some(m=>m.hp>0&&m.x===rx&&m.y===ry)));
  if(tries<20){game.player.x=rx;game.player.y=ry;addMsg('<span style="color:#8844ff;font-size:0.8em">🌀 空间不稳定！随机传送</span>');game._shakeFrames=3;}
}
// Phase 4: 怪物AI行动
tickMonsterAI();
// 签名: 资源竞争(捡EP宝石)
if(game._sigFlags.gems){
  game._sigFlags.gems=game._sigFlags.gems.filter(gem=>{
    if(gem.x===game.player.x&&gem.y===game.player.y){game.player.evoPoints+=gem.value;addMsg('💎 +'+gem.value+'EP');return false;}
    return true;
  });
}
// 诅咒: 每步扣血
if(game.curseBlessing&&game.curseBlessing.mods.hpPerStep)game.player.hp=Math.max(1,game.player.hp+game.curseBlessing.mods.hpPerStep);
// 诅咒: 每步回血
if(game.curseBlessing&&game.curseBlessing.mods.regenPerStep){game.player.hp=Math.min(game.player.maxHp,game.player.hp+game.curseBlessing.mods.regenPerStep);}
// 污染惩罚
applyPollutionEffects();
checkHiddenStory('move');
render();
}
// === 祭坛系统 ===
function triggerAltar(){
  const p=game.player;
  const cc=classColors[p.playerClass];
  const ev=document.getElementById('event-overlay');
  ev.style.display='flex';
  document.getElementById('event-title').textContent=t('⛯ 净化祭坛');
  document.getElementById('event-text').innerHTML='古老的祭坛散发着微弱的光芒...<br><span style="color:#888">'+cc.icon+' '+cc.name+' | 污染: '+p.pollution+'% | EP: '+p.evoPoints+'</span>';
  let choices='<div style="display:flex;flex-direction:column;gap:8px">';
  // 职业转换
  const hasOther=Object.keys(p.classUnlocked).filter(c=>c!==p.playerClass&&p.classUnlocked[c]).length>0;
  if(hasOther){
    choices+='<button class="btn" style="border-color:'+(p.evoPoints>=500?'#ff0':'#555')+';color:'+(p.evoPoints>=500?'#ff0':'#555')+(p.evoPoints<500?';opacity:0.4':'')+'" '+(p.evoPoints>=500?'onclick="closeEvent();showClassConversion()"':'disabled')+'>⛯ 职业转换 (500EP)'+(p.evoPoints<500?' EP不足':'')+'</button>';
  }
  if(!game._altarUsed)game._altarUsed={};
  // 净化（300EP，污染-30）
  const purifyUsed=!!game._altarUsed['purify_'+game.floor];
  choices+='<button class="btn" '+((!purifyUsed&&p.evoPoints>=300)?'onclick="altarAction(\'purify\')"':'disabled style="opacity:0.4"')+'>'+(purifyUsed?'✓ 已净化':'净化祈祷 (300EP → 污染-30)')+'</button>';
  // 锚定（200EP）
  const anchorUsed=!!game._altarUsed['anchor_'+game.floor];
  choices+='<button class="btn" '+((!anchorUsed&&p.evoPoints>=200)?'onclick="altarAction(\'anchor\')"':'disabled style="opacity:0.4"')+'>'+(anchorUsed?'✓ 已锚定':'固化记忆 (200EP → 建立锚点)')+'</button>';
  // 恢复（免费，小回复）
  if(!game._restUsedThisFloor){choices+='<button class="btn" onclick="altarAction(\'rest\')">短暂休憩 (免费 → 回复20%HP)</button>';}else{choices+='<button class="btn" disabled style="opacity:0.4">✓ 已休憩</button>';}
  choices+='<button class="btn btn-secondary" onclick="closeEvent();render()">离开</button>';
  choices+='</div>';
  document.getElementById('event-choices').innerHTML=choices;
}
function altarAction(action){
  const p=game.player;
  if(!game._altarUsed)game._altarUsed={};
  if(action==='purify'&&p.evoPoints>=300&&!game._altarUsed['purify_'+game.floor]){
    p.evoPoints-=300;
    p.pollution=Math.max(0,p.pollution-30);
    game._altarUsed['purify_'+game.floor]=true;
    addMsg('净化祈祷：污染-30 (-300EP)');
  }else if(action==='anchor'&&p.evoPoints>=200&&!game._altarUsed['anchor_'+game.floor]){
    p.evoPoints-=200;
    createAnchor('altar');
    game._altarUsed['anchor_'+game.floor]=true;
    addMsg('记忆固化于祭坛 (-200EP)');
  }else if(action==='rest'&&!game._restUsedThisFloor){
    game._restUsedThisFloor=true;
    const heal=Math.floor(p.maxHp*0.2);
    p.hp=Math.min(p.maxHp,p.hp+heal);
    addMsg('短暂休憩：回复'+heal+'HP');
  }
  closeEvent();render();
}
