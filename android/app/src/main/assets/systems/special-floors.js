// ============ 特殊楼层系统 ============
const specialFloorData={
  5:{name:'镜像实验室',desc:'你的倒影在对面活了过来…',type:'mirror'},
  25:{name:'净化仪式',desc:'要继续前进，必须放弃一部分自己。',type:'midpoint'},
  50:{name:'起源之地',desc:'一切的起点，也是终点。',type:'exit'}
};

function triggerSpecialFloor(floorNum){
  const data=specialFloorData[floorNum];
  if(!data)return;
  if(floorNum===5&&!game.player.specialFloorState.floor5Cleared){
    initFloor5Mirror();
  }else if(floorNum===25&&!game.player.specialFloorState.floor25Choice){
    initFloor25Midpoint();
  }else if(floorNum===50&&!game.player.specialFloorState.floor50Ending){
    initFloor50Exit();
  }
}

// --- 第5层：镜像实验室 ---
function initFloor5Mirror(){
  if(game._floor5Mirror)return;
  const p=game.player;
  addMsg('<span style="color:#b455ff;font-weight:bold">【镜像实验室】你的倒影在对面活了过来…</span>');
  const mirrorMonster={
    x:6,y:3,name:'镜像·'+p.name,type:'mirror_'+p.formType,
    hp:p.maxHp,maxHp:p.maxHp,atk:p.atk,def:p.def,
    traits:[],ability:'mirror',zone:1,loot:null
  };
  game.monsters.push(mirrorMonster);
  game._floor5Mirror=true;
  addMsg('<span style="color:#aaa;font-style:italic">提示：镜像会反射100%受到的伤害</span>');
}

function showPollCombatMenu(){
  if(!game.target)return;
  const ps=game.player.pollutionSkills;
  const m=game.target;
  let html='<div style="font-weight:700;margin-bottom:8px;color:#ff8800">☢️ 污染技能</div>';
  // 污染爆发
  if(ps.pollBurst.unlocked){
    html+='<button class="btn" onclick="usePollBurst();closePollCombatMenu()" style="width:100%;margin:4px 0;border-color:#ff8800;color:#ff8800;text-align:left;padding:8px">☢️ 污染爆发 <span style="color:#888;font-size:0.85em">ATK×150%伤害 (污染+8)</span></button>';
  }
  // 异化吞噬
  if(ps.devour.unlocked){
    const canDevour=!ps.devour.used&&m.hp<m.maxHp*0.3;
    const hpPct=Math.floor(m.hp/m.maxHp*100);
    const reason=ps.devour.used?'本层已用':m.hp>=m.maxHp*0.3?'目标HP>30%('+hpPct+'%)':'';
    html+='<button class="btn" onclick="useDevour();closePollCombatMenu()" style="width:100%;margin:4px 0;border-color:#ff006e;color:#ff006e;text-align:left;padding:8px" '+(canDevour?'':'disabled')+'>💀 异化吞噬 <span style="color:#888;font-size:0.85em">秒杀HP<30%怪 (污染+15)'+(reason?' ['+reason+']':'')+'</span></button>';
  }
  html+='<button class="btn btn-secondary" onclick="closePollCombatMenu()" style="width:100%;margin-top:8px">取消</button>';
  // 用一个简单的floating div
  let menu=document.getElementById('poll-combat-menu');
  if(!menu){
    menu=document.createElement('div');
    menu.id='poll-combat-menu';
    menu.style.cssText='position:fixed;bottom:180px;left:10px;right:10px;background:rgba(34,32,64,0.97);border:1px solid #ff8800;border-radius:8px;padding:12px;z-index:320;box-shadow:0 0 20px rgba(255,136,0,0.2)';
    document.body.appendChild(menu);
  }
  menu.innerHTML=html;
  menu.style.display='block';
}

function closePollCombatMenu(){
  const menu=document.getElementById('poll-combat-menu');
  if(menu)menu.style.display='none';
}

function handleFloor5Combat(monster,pDmg){
  if(!game._floor5Mirror)return 0;
  if(!monster.type.startsWith('mirror_'))return 0;
  const reflected=pDmg;
  addMsg('<span style="color:#b455ff">镜像反射 '+reflected+' 伤害！</span>');
  return reflected;
}

function completeFloor5(){
  if(!game._floor5Mirror)return;
  game._floor5Mirror=false;
  game.player.specialFloorState.floor5Cleared=true;
  game.player.evoPoints+=50;
  // 双核心改造: 镜像让你看清自己的弱点 → 永久附身率+10%
  game.player._storyParasiteBonus=Math.max(game.player._storyParasiteBonus||0,0.10);
  addMsg('<span style="color:#00ffd0;font-weight:bold">【镜像实验室】通关！+50EP</span>');
  addMsg('<span style="color:#b455ff;font-weight:bold">🧬 镜像启示：附身成功率永久+10%</span>');
  addMsg('<span style="color:#aaa;font-style:italic">"原来我也可以被附身——他们的犹豫，就是我的入口。"</span>');
}

// --- 第25层：中点仪式 ---
function initFloor25Midpoint(){
  addMsg('<span style="color:#ff0;font-weight:bold">【净化仪式】要继续前进，必须放弃一部分自己。</span>');
  setTimeout(()=>showFloor25Choice(),500);
}

function showFloor25Choice(){
  const overlay=document.getElementById('floor25-choice-overlay');
  if(!overlay)return;
  const container=document.getElementById('floor25-form-choices');
  if(!container)return;
  container.innerHTML='';
  const classes=['titan','ghost','swarm'];
  const classNames={titan:'泰坦',ghost:'幽灵',swarm:'虫群'};
  const classDesc={
    titan:'牺牲泰坦：失去装甲技能，获得攻击+30%',
    ghost:'牺牲幽灵：失去背刺技能，获得防御+30%',
    swarm:'牺牲虫群：失去分裂技能，获得生命+30%'
  };
  classes.forEach(cls=>{
    if(cls===game.player.playerClass)return;
    const card=document.createElement('div');
    card.className='floor25-form-card';
    card.innerHTML='<div style="font-size:1.2em;font-weight:bold">'+classNames[cls]+'</div><div style="font-size:.85em;color:#aaa;margin:6px 0">'+classDesc[cls]+'</div><button class="btn" onclick="sacrificeForm(\''+cls+'\')">牺牲</button>';
    container.appendChild(card);
  });
  // 额外选项：献祭活槽形态清除 1 个墓碑
  const deadCount=game._deadForms?game._deadForms.filter(d=>d).length:0;
  const aliveNonCurrent=game.forms.filter((f,i)=>f&&!game._deadForms[i]&&i!==game.currentForm).length;
  if(deadCount>0&&aliveNonCurrent>0){
    const card=document.createElement('div');
    card.className='floor25-form-card';
    card.innerHTML='<div style="font-size:1.2em;font-weight:bold;color:#ffd700">💀 墓碑净化</div>'+
      '<div style="font-size:.85em;color:#aaa;margin:6px 0">献祭 1 个活槽形态（非当前），清除 1 个墓碑。当前墓碑 '+deadCount+' / 可献祭 '+aliveNonCurrent+'</div>'+
      '<button class="btn" onclick="showTombstoneSacrifice()">净化墓碑</button>';
    container.appendChild(card);
  }
  overlay.style.display='flex';
}

function showTombstoneSacrifice(){
  const overlay=document.getElementById('floor25-choice-overlay');
  const container=document.getElementById('floor25-form-choices');
  if(!container)return;
  container.innerHTML='<div style="color:#ffd700;font-weight:bold;margin-bottom:8px">选择要献祭的活槽形态</div>';
  let has=false;
  for(let i=0;i<game.forms.length;i++){
    const f=game.forms[i];
    if(!f||game._deadForms[i]||i===game.currentForm)continue;
    has=true;
    const card=document.createElement('div');
    card.className='floor25-form-card';
    card.innerHTML='<div style="font-size:1.4em">'+(f.icon||'❓')+'</div>'+
      '<div style="font-weight:bold">'+f.name+'</div>'+
      '<div style="font-size:.8em;color:#888">ATK '+f.atk+' · DEF '+f.def+'</div>'+
      '<button class="btn" onclick="sacrificeToPurge('+i+')">献祭</button>';
    container.appendChild(card);
  }
  if(!has){
    container.innerHTML+='<div style="color:#888">没有可献祭的活槽形态</div>';
  }
}

function sacrificeToPurge(slotIdx){
  const f=game.forms[slotIdx];
  if(!f||game._deadForms[slotIdx]||slotIdx===game.currentForm){addMsg('无法献祭该槽位');return;}
  // 找第一个墓碑
  let deadIdx=-1;
  for(let i=0;i<game._deadForms.length;i++){if(game._deadForms[i]){deadIdx=i;break;}}
  if(deadIdx<0){addMsg('没有墓碑需要净化');return;}
  // 献祭活槽 → 清除墓碑
  addMsg('<span style="color:#ff006e;font-weight:bold">你献祭了 '+f.name+' 的形态…</span>');
  game.forms[slotIdx]=null;
  game._deadForms[deadIdx]=false;
  game.forms[deadIdx]=null;
  addMsg('<span style="color:#ffd700;font-weight:bold">✨ 墓碑净化！槽位 '+(deadIdx+1)+' 恢复可用</span>');
  const overlay=document.getElementById('floor25-choice-overlay');
  if(overlay)overlay.style.display='none';
  updateFormBar();
  render();
  // 不再触发净化守卫战，也不触发双核心改造（这是独立分支）
}

function sacrificeForm(formType){
  const overlay=document.getElementById('floor25-choice-overlay');
  if(overlay)overlay.style.display='none';
  game.player.specialFloorState.floor25Choice=formType;
  const classNames={titan:'泰坦',ghost:'幽灵',swarm:'虫群'};
  addMsg('<span style="color:#ff006e;font-weight:bold">你牺牲了'+classNames[formType]+'的力量…</span>');
  game.player['_sacrificed_'+formType]=true;
  const p=game.player;
  if(!p._evoStatBonus)p._evoStatBonus={atk:0,def:0,maxHp:0};
  if(formType==='titan'){var _dA=Math.floor(p.atk*1.3)-p.atk;p.atk+=_dA;p._evoStatBonus.atk+=_dA;addMsg('攻击力提升30%！');}
  else if(formType==='ghost'){var _dD=Math.floor(p.def*1.3)-p.def;p.def+=_dD;p._evoStatBonus.def+=_dD;addMsg('防御力提升30%！');}
  else if(formType==='swarm'){var _dH=Math.floor(p.maxHp*1.3)-p.maxHp;p.maxHp+=_dH;p.hp=Math.min(p.hp+50,p.maxHp);p._evoStatBonus.maxHp+=_dH;addMsg('最大HP提升30%！');}
  // 双核心改造: 净化的代价是失去欲望 → 清污染30, 永久附身率-5%
  const _polCleansed=Math.min(p.pollution,30);
  p.pollution=Math.max(0,p.pollution-30);
  p._storyParasiteBonus=(p._storyParasiteBonus||0)-0.05;
  addMsg('<span style="color:#00ffd0">✨ 净化代价: 污染-'+_polCleansed+'</span>');
  addMsg('<span style="color:#888">😶 失去渴望: 附身成功率永久-5%（你不再渴求他者）</span>');
  updateFormAffinity(formType,'sacrifice',50);
  spawnFloor25Boss(formType);
  render();
}

function spawnFloor25Boss(formType){
  const p=game.player;
  const bossStats={
    titan:{name:'净化守卫·泰坦',hp:p.maxHp*2,atk:Math.floor(p.atk*1.5),def:Math.floor(p.def*2)},
    ghost:{name:'净化守卫·幽灵',hp:Math.floor(p.maxHp*1.5),atk:Math.floor(p.atk*2),def:p.def},
    swarm:{name:'净化守卫·虫群',hp:p.maxHp*3,atk:p.atk,def:p.def}
  };
  const bs=bossStats[formType];
  const boss={
    x:6,y:6,name:bs.name,type:'floor25_boss',
    hp:bs.hp,maxHp:bs.hp,atk:bs.atk,def:bs.def,
    traits:[],ability:'berserk',zone:3,loot:null
  };
  game.monsters.push(boss);
  addMsg('<span style="color:#ff006e;font-weight:bold">'+bs.name+' 出现了！</span>');
}

// --- 第50层：终焉之门 ---
function initFloor50Exit(){
  if(game.player.specialFloorState.floor50Ending)return;
  game.player.specialFloorState.floor50Ending='pending';
  addMsg('<span style="color:#fff;font-weight:bold;text-shadow:0 0 10px #00ffd0">【起源之地】一切的起点，也是终点。</span>');
  setTimeout(()=>showFloor50Endings(),1000);
}

function showFloor50Endings(){
  const p=game.player;
  let html='<div style="text-align:center;padding:20px">';
  html+='<h2 style="color:#00ffd0;text-shadow:0 0 10px #00ffd0">选择你的结局</h2>';
  html+='<div style="color:#aaa;margin:15px 0">你站在起源之地，感受到三条道路的呼唤…</div>';
  const classNames={titan:'泰坦之路：以力量统治一切',ghost:'幽灵之路：融入虚无',swarm:'虫群之路：吞噬万物'};
  Object.keys(classNames).forEach(cls=>{
    html+='<div style="margin:10px;padding:12px;background:rgba(255,255,255,0.05);border:1px solid #555;border-radius:8px;cursor:pointer" onclick="triggerClassEnding(\''+cls+'\')">';
    html+='<div style="font-weight:bold;color:#ff0">'+classNames[cls]+'</div></div>';
  });
  const totalPossessions=Object.keys(p.possessed).length;
  if(p.pollution>=90&&totalPossessions>=10){
    html+='<div style="margin:10px;padding:12px;background:rgba(180,85,255,0.1);border:1px solid #b455ff;border-radius:8px;cursor:pointer" onclick="triggerHiddenEnding()">';
    html+='<div style="font-weight:bold;color:#b455ff">???：真正的寄生之道</div>';
    html+='<div style="font-size:.8em;color:#aaa">污染与附身的极致…</div></div>';
  }
  html+='</div>';
  showEventDialog('起源之地',html,false);
}

function triggerClassEnding(cls){
  const endings={
    titan:'你选择了力量的道路。泰坦的意志在你体内觉醒，你感受到无尽的力量涌入每一个细胞。你不再是寄生者——你成为了新的守护者，永远守护着这座塔。<br><br><span style="color:#00ffd0">结局A：泰坦守护者</span>',
    ghost:'你选择了虚无的道路。幽灵的本质让你理解了存在的真相——一切皆幻影。你的身体逐渐透明，最终与塔融为一体，成为永恒的低语。<br><br><span style="color:#a4a">结局B：永恒低语</span>',
    swarm:'你选择了吞噬的道路。虫群的本能在你体内爆发，你分裂成无数个体，每一个都保留着你的记忆。你成为了新的生态系统，生生不息。<br><br><span style="color:#4a4">结局C：无尽虫群</span>'
  };
  game.player.specialFloorState.floor50Ending=cls;
  saveEndingRecord(cls);
  showEventDialog('结局',endings[cls]||'未知结局',true);
  addMsg('<span style="color:#ff0;font-weight:bold">游戏通关！结局：'+cls+'</span>');
}

function triggerHiddenEnding(){
  game.player.specialFloorState.floor50Ending='hidden';
  saveEndingRecord('hidden');
  const text='你没有选择任何一条道路。<br><br>你已经超越了选择本身。<br><br>90%的污染让你与塔的意志产生了共鸣，10次附身让你理解了每一个生命的本质。你不是泰坦，不是幽灵，也不是虫群——你就是寄生本身。<br><br>塔在你面前崩塌，因为它再也无法容纳你的存在。<br><br><span style="color:#b455ff;font-weight:bold;font-size:1.2em">真结局：寄生之主</span><br><span style="color:#aaa">你打破了循环。</span>';
  showEventDialog('真结局',text,true);
  addMsg('<span style="color:#b455ff;font-weight:bold">真结局达成！寄生之主</span>');
}

function saveEndingRecord(endingType){
  try{
    const records=safeParse(localStorage.getItem('parasiteTowerEndings'),[]);
    records.push({
      ending:endingType,
      floor:game.floor,
      playerClass:game.player.playerClass||'none',
      pollution:game.player.pollution,
      possessions:Object.keys(game.player.possessed||{}).length,
      date:new Date().toISOString()
    });
    localStorage.setItem('parasiteTowerEndings',JSON.stringify(records));
  }catch(e){}
}
