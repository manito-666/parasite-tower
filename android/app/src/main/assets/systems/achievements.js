// ================================================================
// 成就系统
// ================================================================
// [data.js] achievementDefs, achievementBonuses
function getUnlockedAchievements(){
  try{return JSON.parse(localStorage.getItem('pt_achievements')||'[]');}catch(e){return [];}
}
function unlockAchievement(id){
  const list=getUnlockedAchievements();
  if(list.includes(id))return;
  list.push(id);
  localStorage.setItem('pt_achievements',JSON.stringify(list));
  const def=achievementDefs.find(a=>a.id===id);
  if(def){
    if(typeof celebrateAchievement==='function')celebrateAchievement(def);
    else showAchievementBanner(def);
  }
}
function showAchievementBanner(def){
  const el=document.getElementById('achievement-banner');
  if(!el)return;
  el.textContent='🏆 '+def.icon+' '+def.name+' — '+def.desc;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3000);
}
function checkAchievements(){
  const possessed=Object.keys(game.player.possessed||{}).length;
  const kills=game._totalKills||0;
  if(kills>=1)unlockAchievement('first_kill');
  if(possessed>=1)unlockAchievement('first_possess');
  if(game.floor>=10)unlockAchievement('floor10');
  if(game.floor>=25)unlockAchievement('floor25');
  if(game.floor>=50)unlockAchievement('floor50');
  if(possessed>=5)unlockAchievement('possess5');
  if(possessed>=10)unlockAchievement('possess10');
  if(game.floor>=25&&(game.player.deathCount||0)===0)unlockAchievement('no_death');
  if(game.floor>=25&&(game.player.pollution||0)===0)unlockAchievement('pollution0');
}
function applyAchievementBonuses(p){
  const list=getUnlockedAchievements();
  let applied=[];
  list.forEach(id=>{
    const b=achievementBonuses[id];
    if(!b)return;
    if(b.stat==='maxHp'){p.maxHp+=b.value;p.hp+=b.value;}
    else if(b.stat==='pollution'){p.pollution=Math.max(0,p.pollution+b.value);}
    else if(p[b.stat]!==undefined){p[b.stat]+=b.value;}
    applied.push(b.desc);
  });
  return applied;
}
function showAchievementPanel(){
  const unlocked=getUnlockedAchievements();
  const ev=document.getElementById('event-overlay');
  ev.style.display='flex';
  document.getElementById('event-title').textContent=t('🏆 成就');
  let html='<div style="display:flex;flex-direction:column;gap:4px;max-height:60vh;overflow-y:auto">';
  achievementDefs.forEach(a=>{
    const done=unlocked.includes(a.id);
    const bonus=achievementBonuses[a.id];
    html+='<div style="padding:6px 8px;background:rgba('+(done?'0,255,100':'255,255,255')+',0.05);border:1px solid '+(done?'#00ffd0':'#333')+';border-radius:4px;opacity:'+(done?'1':'0.5')+'">';
    html+='<span style="font-size:14px">'+a.icon+'</span> <b style="color:'+(done?'#00ffd0':'#888')+'">'+a.name+'</b>';
    html+=' <span style="font-size:10px;color:#888">'+(done?a.desc:'???')+'</span>';
    if(bonus&&done)html+=' <span style="font-size:9px;color:#ff0;margin-left:4px">'+bonus.desc+'</span>';
    html+='</div>';
  });
  html+='</div>';
  html+='<div style="margin-top:8px;text-align:center;font-size:10px;color:#888">'+unlocked.length+'/'+achievementDefs.length+' 已解锁</div>';
  document.getElementById('event-text').innerHTML=html;
  document.getElementById('event-choices').innerHTML='<button class="btn" onclick="closeEvent()">关闭</button>';
}
