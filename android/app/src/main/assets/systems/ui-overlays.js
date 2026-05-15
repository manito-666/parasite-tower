// ================================================================
// UI 覆盖层：战斗/进化/碎片对话框 + 随机事件 + 通用对话
// ================================================================
function isAnyOverlayOpen(){
  var ids=['frag-choice-overlay','synth-confirm-overlay','frag-bag-overlay','shop-overlay','evolution-overlay','event-overlay','route-overlay','form-library-overlay','affinity-detail-overlay','pollution-skill-overlay','floor25-choice-overlay','negotiate-overlay'];
  for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&(el.style.display==='flex'||el.style.display==='block'||el.classList.contains('active')))return true;}
  return false;
}
function showCombat(){
const t=game.target;if(!t||game._combatEnding)return;
if(isAnyOverlayOpen()){setTimeout(function(){if(game.target&&!game._combatEnding)showCombat();},500);return;}
// 有弹窗正在显示时延迟战斗，避免遮挡
const fragOv=document.getElementById('fragment-overlay');
const fragChoice=document.getElementById('frag-choice-overlay');
const deathOv=document.getElementById('death-overlay');
const deathChoice=document.getElementById('death-choice-overlay');
const collapseOv=document.getElementById('collapse-overlay');
if((fragOv&&fragOv.classList.contains('active'))||(fragChoice&&fragChoice.style.display==='flex')||(deathOv&&deathOv.classList.contains('active'))||(deathChoice&&deathChoice.classList.contains('active'))||(collapseOv&&collapseOv.classList.contains('active'))){
  setTimeout(()=>{if(game.target&&!game._combatEnding)showCombat();},500);return;
}
GameEvents.emit('combat:start',{monster:t,player:game.player});
var _coAlready=document.getElementById('combat-overlay').classList.contains('active');
// Boss铭牌入场
if(t.type.includes('boss')&&!_coAlready&&!t._bossIntroShown){
  t._bossIntroShown=true;
  showBossIntro(t,function(){
    _showCombatInner(t,_coAlready);
  });
  return;
}
_showCombatInner(t,_coAlready);
}
function _showCombatInner(t,_coAlready){

var _clog=document.getElementById('combat-log');if(_clog&&!_coAlready)_clog.innerHTML='';
document.getElementById('combat-overlay').classList.add('active');
startCombatBGM();
setTimeout(function(){checkTutorial('combat');},300);
document.getElementById('target-name').textContent=t.name;
renderMonsterPortrait('combat-monster-avatar',t);
document.getElementById('target-name').onclick=function(e){showMonsterDetail(t,e.clientX,e.clientY);};
// BOSS音效
if(t.type.includes('boss'))try{sounds.boss();}catch(e){}
// BOSS阶段颜色
if(bossPhaseData[t.type]&&game._bossPhase>0){
  const bpd=bossPhaseData[t.type].phases[game._bossPhase-1];
  if(bpd)document.getElementById('target-name').style.color=bpd.color;
}else{document.getElementById('target-name').style.color='';}
document.getElementById('t-hp').textContent=t.hp;
document.getElementById('t-maxhp').textContent=t.maxHp;
document.getElementById('t-atk').textContent=t.atk;
document.getElementById('t-def').textContent=t.def;
const pDmg=Math.max(1,game.player.atk-t.def);const mDmg=Math.max(1,t.atk-game.player.def);
const turns=Math.ceil(t.hp/pDmg);const totalDmg=mDmg*(turns-1);
document.getElementById('t-dmg').textContent=totalDmg;
const rate=(t&&(t.id==='tut_dog'||t._tutorialHighlight))?100:Math.min(95,Math.max(1,Math.round(getNegBaseRate()*100)));
document.getElementById('t-rate').textContent=rate;
document.getElementById('t-rate').style.color=rate>=60?'#00ffd0':rate>=30?'#ffcc00':'#ff006e';
// 签名: 哑剧模式
if(game._sigFlags.hideNumbers){
  document.getElementById('t-hp').textContent='???';
  document.getElementById('t-maxhp').textContent='???';
  document.getElementById('t-atk').textContent='???';
  document.getElementById('t-def').textContent='???';
  document.getElementById('t-dmg').textContent='???';
  document.getElementById('t-rate').textContent='???';
}
var _bpTop=document.getElementById('btn-possess');
var _bpTopDisabled=game.player.possessed[t.id]||t.possessed||t._enraged;
if(_bpTop){_bpTop.disabled=false;
_bpTop.style.opacity=_bpTopDisabled?'0.4':'1';
_bpTop.innerHTML=t._enraged?'❌ 已破裂':'🧬 附身 '+rate+'%';}
const _bpb=document.getElementById('btn-possess-bottom');
if(_bpb){_bpb.disabled=false;_bpb.style.opacity=_bpTopDisabled?'0.4':'1';_bpb.innerHTML=t._enraged?'破裂':'附身<span class="possess-sub" id="possess-rate-bottom">'+rate+'%</span>';}
// 新手引导：隐藏未解锁的按钮
if(game._tutorialStage<1){
  const bp=document.getElementById('btn-possess');if(bp)bp.style.display='none';
  const bpb=document.getElementById('btn-possess-bottom');if(bpb)bpb.style.display='none';
  const bflee=document.getElementById('btn-flee-bottom');if(bflee)bflee.style.display='none';
}else{
  const bp=document.getElementById('btn-possess');if(bp)bp.style.display='';
  const bpb2=document.getElementById('btn-possess-bottom');if(bpb2)bpb2.style.display='';
  const bflee2=document.getElementById('btn-flee-bottom');if(bflee2)bflee2.style.display='';
}
// 防御按钮在引导阶段2前隐藏（通过class查找）
const defendBtns=document.querySelectorAll('.combat-actions .btn');
defendBtns.forEach(b=>{if(b.textContent.includes('防御'))b.style.display=(game._tutorialStage<2)?'none':'';});
const actDefendBtn=document.getElementById('btn-defend-bottom');
if(actDefendBtn)actDefendBtn.style.display=(game._tutorialStage<2)?'none':'';
// 回合徽章
var _rBadge=document.getElementById('combat-round-badge');
if(_rBadge)_rBadge.textContent='R'+(game._combatRound||0);
const traitsEl=document.getElementById('traits-display');
let traitsHtml=game.player.traits.map(tr=>{const td=getTraitEffect(tr);return '<span class="trait-badge" style="cursor:pointer" onclick="showTraitInfo(\''+tr+'\')" title="'+(td&&td.desc?td.desc:tr)+'">'+tr+' ⓘ</span>';}).join('');
// 显示怪物traits
if(t.traits&&t.traits.length>0){
  traitsHtml+='<div style="width:100%;font-size:9px;color:#888;margin:2px 0">敌方:</div>';
  traitsHtml+=t.traits.map(tr=>{const td=getTraitEffect(tr);return '<span class="trait-badge" style="background:rgba(255,0,110,0.2);border-color:#ff006e;cursor:pointer" onclick="showTraitInfo(\''+tr+'\')" title="'+(td&&td.desc?td.desc:tr)+'">'+tr+' ⓘ</span>';}).join('');
}
if(traitsEl)traitsEl.innerHTML=traitsHtml;
// 战斗公式提示
let formulaTip=document.getElementById('combat-formula-tip');
if(!formulaTip){formulaTip=document.createElement('div');formulaTip.id='combat-formula-tip';formulaTip.style.cssText='color:#666;font-size:0.65em;text-align:center;margin-top:4px;line-height:1.4';if(traitsEl&&traitsEl.parentNode)traitsEl.parentNode.insertBefore(formulaTip,traitsEl.nextSibling);}
formulaTip.textContent=t('伤害=(怪ATK-你DEF)×回合 | 附身率与残血比正相关');
// 战斗技能按钮
if(game.activeSkills.length>0){
  let skillHtml='<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px">';
  game.activeSkills.forEach((s,i)=>{
    skillHtml+='<button class="skill-btn-combat" onclick="useActiveSkill('+i+')">'+s.icon+' '+s.name+'<span class="uses">×'+s.uses+'</span></button>';
  });
  skillHtml+='</div>';
  if(traitsEl)traitsEl.innerHTML+=skillHtml;
}
// 底部按钮组显隐由 CSS body:has(#combat-overlay.active) 接管，不再手动 toggle
const _encBtns=document.getElementById('encounter-btns');
if(_encBtns)_encBtns.classList.remove('hidden');
// 污染战斗技能按钮
const _pollBtn=document.getElementById('btn-poll-combat');
if(_pollBtn)_pollBtn.style.display=(game.player.pollutionSkills.pollBurst.unlocked||game.player.pollutionSkills.devour.unlocked)?'':'none';
const bpb=document.getElementById('btn-possess-bottom');
if(bpb){
  var _bpbDis=game.player.possessed[t.id]||t.possessed||t._enraged;
  bpb.disabled=false;
  bpb.style.opacity=_bpbDis?'0.4':'1';
  // 满槽提示：活槽全满且无同物种可覆盖
  var _aliveFull=true;
  for(var _ci=0;_ci<game.forms.length;_ci++){if(!game.forms[_ci]&&!game._deadForms[_ci]){_aliveFull=false;break;}}
  if(_aliveFull){
    var _hasSame=false;
    for(var _ci=0;_ci<game.forms.length;_ci++){if(game.forms[_ci]&&!game._deadForms[_ci]&&game.forms[_ci].type===t.type){_hasSame=true;break;}}
    if(!_hasSame)t._slotFullWarn=true;else t._slotFullWarn=false;
  }else{t._slotFullWarn=false;}
  var _warnTxt=t._slotFullWarn?' ⚠':'';
  bpb.innerHTML=t._enraged?'破裂':'附身'+_warnTxt+'<span class="possess-sub" id="possess-rate-bottom">'+rate+'%</span>';
}
var _prb=document.getElementById('possess-rate-bottom');if(_prb)_prb.textContent=rate+'%';
// 战斗中形态切换栏
let formBarHtml='';
const hasOtherForms=game.forms.some((f,i)=>f&&i!==game.currentForm);
if(hasOtherForms){
  formBarHtml='<div style="margin-top:6px;display:flex;gap:4px;justify-content:center;flex-wrap:wrap">';
  formBarHtml+='<span style="font-size:9px;color:#888;align-self:center">换形:</span>';
  game.forms.forEach((f,i)=>{
    if(!f||i===game.currentForm)return;
    const dead=game._deadForms[i];
    const cd=game.formCooldown>0;
    const disabled=dead||cd||game._sigFlags.noSwitch||game._loneWolf;
    const bClr=dead?'#ff006e':'#00ffd0';
    const hint=dead?' ✝':(cd?' ⏳':'');
    // 克制提示: 如果该形态ATK比当前高
    const adv=f.atk>game.player.atk;
    formBarHtml+='<button style="padding:2px 8px;font-size:10px;border:1px solid '+bClr+';background:rgba(0,0,0,0.6);color:'+bClr+';border-radius:4px;cursor:'+(disabled?'not-allowed':'pointer')+';opacity:'+(disabled?'0.4':'1')+'" '+(disabled?'disabled':'onclick="combatSwitchForm('+i+')"')+'>'+f.name+hint+(adv?' 💡':'')+'</button>';
  });
  formBarHtml+='</div>';
}
if(traitsEl)traitsEl.innerHTML+=formBarHtml;
// 延迟刷新底部附身按钮（确保DOM完全就绪后状态正确）
setTimeout(function(){
  var _t2=game.target;if(!_t2||game._combatEnding)return;
  var _r2=(_t2&&(_t2.id==='tut_dog'||_t2._tutorialHighlight))?100:Math.min(95,Math.max(1,Math.round(getNegBaseRate()*100)));
  var _bp2=document.getElementById('btn-possess-bottom');
  var _bp2Dis=game.player.possessed[_t2.id]||_t2.possessed||_t2._enraged;
  if(_bp2){_bp2.disabled=false;_bp2.style.opacity=_bp2Dis?'0.4':'1';_bp2.innerHTML=_t2._enraged?'破裂':'附身<span class="possess-sub" id="possess-rate-bottom">'+_r2+'%</span>';}
  var _bpt2=document.getElementById('btn-possess');
  if(_bpt2){_bpt2.disabled=false;_bpt2.style.opacity=_bp2Dis?'0.4':'1';_bpt2.innerHTML=_t2._enraged?'❌ 已破裂':'🧬 附身 '+_r2+'%';}
  if(game._tutorialStage<1){if(_bp2)_bp2.style.display='none';if(_bpt2&&_bpt2.style)_bpt2.style.display='none';var _bfl2=document.getElementById('btn-flee-bottom');if(_bfl2)_bfl2.style.display='none';}
  if(typeof checkSoftHint==='function')checkSoftHint();
},50);
}
function closeCombat(){
markDirty();
if(typeof stopPollutionCombatEffects==='function')stopPollutionCombatEffects();
GameEvents.emit('combat:end',{player:game.player,comboCount:game._comboCount||0});
const _coEl=document.getElementById('combat-overlay');if(_coEl){_coEl.classList.remove('active');}
stopCombatBGM();startBGMusic();
// encounter-btns 在战斗结束后由 CSS :has() 自动切回探索按钮，不再手动加 .hidden
// 重置底部附身按钮状态（防止残留"已破裂"影响下次战斗）
var _bpReset=document.getElementById('btn-possess-bottom');
if(_bpReset){_bpReset.disabled=false;_bpReset.style.opacity='1';_bpReset.innerHTML='附身<span class="possess-sub" id="possess-rate-bottom">--</span>';}
var _bpTopReset=document.getElementById('btn-possess');
if(_bpTopReset){_bpTopReset.disabled=false;_bpTopReset.style.opacity='1';_bpTopReset.innerHTML='🧬 附身';}
closePollCombatMenu();
closeNegotiate();
resetCombo(false);
// 战斗日志3秒后淡出并清除（避免多次死亡后闪烁）
if(_battleLogTimer)clearTimeout(_battleLogTimer);
_battleLogTimer=setTimeout(()=>{clearBattleLog();_battleLogTimer=null;},3000);
// 腐蚀DEF恢复
if(game.target&&game.target._corrodeApplied&&game.target._preCombatDef!==undefined){
  game.target.def=game.target._preCombatDef;
}
game.target=null;
game._combatEnding=false;
game._combatRound=0;
game._combatTotalDmg=0;
game._revived=false;
game._playerStunned=false;
game._webbed=false;
game._skillEffects={switchFullHeal:!!(game._skillEffects&&game._skillEffects.switchFullHeal)};
game._bossPhase=0;
game._bossBaseAtk=0;
game._combatSaved=false;
game._defendCount=0;
game._switchCount=0;
}
function showFragment(type){
document.getElementById('fragment-text').textContent=fragments[type]||'记忆碎片...';
document.getElementById('fragment-overlay').classList.add('active');
game.player.pollution=Math.max(0,game.player.pollution-10);
addMsg('记忆碎片 污染-10');
}
function closeFragment(){document.getElementById('fragment-overlay').classList.remove('active');}
function showEvolutionPath(path){
const pc=game.player.playerClass;
const pathData=evolutionPaths[path];const current=game.player.evolution[path];
const titles={titan:'🛡️ 泰坦之路',ghost:'👻 幽灵之路',swarm:'🦗 虫群之路'};
const cc=classColors[path]||classColors.swarm;
document.getElementById('evo-title').textContent=titles[path];
let html='<div style="font-size:.85em;color:#888;margin-bottom:8px">进度: '+current+'/5'+(path!==pc?' <span style="color:#ff006e">(需切换为'+classColors[path].name+'职业才能解锁)</span>':'')+'</div>';
html+='<div style="display:flex;gap:6px;margin-bottom:10px">';
['titan','ghost','swarm'].forEach(p=>{
const isCur=p===path;
const clr=classColors[p];
const sel=isCur?'color:'+clr.primary+';border-color:'+clr.primary:'color:#666;border-color:#333';
html+='<button class="btn" style="padding:4px 12px;font-size:.8em;'+sel+'" onclick="showEvolutionPath(\''+p+'\')">'+clr.icon+' '+clr.name+'</button>';
});
html+='</div>';
const isMyPath=path===pc;
pathData.forEach((node,i)=>{
const unlocked=i<current;
const canUnlock=isMyPath&&i===current&&game.player.evoPoints>=node.cost;
const locked=i>current||(i===current&&!canUnlock);
const style=unlocked?'color:'+cc.primary+';':canUnlock?'color:#00ffd0;cursor:pointer':'color:#555';
const btn=canUnlock?'<button class="btn" style="padding:3px 10px;font-size:.8em;border-color:'+cc.primary+';flex-shrink:0;white-space:nowrap;align-self:center" onclick="unlockEvolution(\''+path+'\','+i+')">解锁('+node.cost+'EP)</button>':'';
html+='<div style="'+style+';padding:6px;margin:4px 0;background:rgba(255,255,255,0.03);border-radius:4px;font-size:.85em;display:flex;align-items:center;gap:8px">';
html+='<div style="flex:1;min-width:0;line-height:1.35"><b>'+(unlocked?'✓ ':locked?'🔒 ':'')+node.name+'</b> - '+node.desc+'</div>'+btn+'</div>';
});
document.getElementById('evo-content').innerHTML=html;
document.getElementById('evolution-overlay').style.display='flex';
}
function closeEvolution(){document.getElementById('evolution-overlay').style.display='none';_restoreHiddenByMenu();}
function unlockEvolution(path,index){
if(path!==game.player.playerClass){addMsg('只能解锁当前职业的进化');return;}
const node=evolutionPaths[path][index];
if(game.player.evoPoints<node.cost){addMsg('EP不足');return;}
if(game.player.evolution[path]>=5){addMsg('已达最高进化等级');return;}
game.player.evoPoints-=node.cost;game.player.evolution[path]++;
var _eb=ensureEvoBonus(game.player);
if(node.effect.atk){game.player.atk+=node.effect.atk;_eb.atk+=node.effect.atk;}
if(node.effect.def){game.player.def+=node.effect.def;_eb.def+=node.effect.def;}
if(node.effect.maxHp){game.player.maxHp+=node.effect.maxHp;game.player.hp+=node.effect.maxHp;_eb.maxHp+=node.effect.maxHp;}
addMsg('解锁: '+node.name);showEvolutionPath(path);render();
const _ni=game.player.evolution[path];const _nn=evolutionPaths[path]?evolutionPaths[path][_ni]:null;
if(!_nn||game.player.evoPoints<_nn.cost)clearEvoRedDot();
// 移除残留的策略提示 toast，避免升级后还看到旧的"进化点已足够"
var _stale=document.getElementById('strategy-hint-toast');if(_stale)_stale.remove();
}

function checkEvoUnlockHint(){
  const p=game.player;
  const path=p.playerClass;
  const pathData=evolutionPaths[path];
  if(!pathData)return;
  const current=p.evolution[path];
  if(current>=pathData.length){clearEvoRedDot();return;}
  const next=pathData[current];
  if(p.evoPoints>=next.cost){
    var key=path+'|'+current;
    if(!game._evoHintShown)game._evoHintShown={};
    if(!game._evoHintShown[key]){
      addMsg('<span style="color:#00ffd0;font-weight:bold">💡 进化可用！'+next.name+'('+next.cost+'EP) — 打开菜单解锁</span>');
      game._evoHintShown[key]=true;
    }
    setEvoRedDot();
  }
}
function updateEvoRedDot(){
  const p=game.player;if(!p)return;
  const path=p.playerClass;
  const pathData=evolutionPaths[path];
  if(!pathData){clearEvoRedDot();return;}
  const current=p.evolution[path];
  if(current>=pathData.length){clearEvoRedDot();return;}
  const next=pathData[current];
  if(p.evoPoints>=next.cost)setEvoRedDot();
  else clearEvoRedDot();
}
function setEvoRedDot(){
  const menuBtn=document.getElementById('btn-menu');
  if(menuBtn)menuBtn.classList.add('red-dot');
  var _was=game._evoRedDot;
  game._evoRedDot=true;
  if(!_was){try{if(window.StrategyHints)StrategyHints.check('evo:available');}catch(e){}}
}
function clearEvoRedDot(){
  const menuBtn=document.getElementById('btn-menu');
  if(menuBtn)menuBtn.classList.remove('red-dot');
  game._evoRedDot=false;
}

function toggleAudioMute(){
  _audioMuted=!_audioMuted;
  localStorage.setItem('pt_muted',_audioMuted?'1':'0');
  if(_audioMuted){stopBGMusic();stopCombatBGM();if(_audioContext){try{_audioContext.close();}catch(e){}_audioContext=null;_masterOut=null;_breathGain=null;_breathLfo=null;_convolver=null;_convWet=null;_towerSubDrone=null;_currentIRZone=-1;}}
  else{initAudio();startBGMusic();}
  updateAudioIndicator();
  if(typeof showSettingsPanel==='function'&&document.getElementById('settings-panel')&&document.getElementById('settings-panel').style.display!=='none'){showSettingsPanel();}
}
function updateAudioIndicator(){
  var el=document.getElementById('audio-indicator');
  if(el)el.textContent=_audioMuted?'🔇':'🔊';
}
// === DLC商店/商店购买 → systems/dlc-shop.js ===
function triggerRandomEvent(){
let p=game.player;
let zone=(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode)?ExpeditionMode.getZone(game.floor):Math.min(5,Math.ceil(game.floor/10));
const allEvents=[
// === 发现类 ===
{title:'🎁 神秘宝箱',text:'你发现了隐藏宝箱！',choices:[{label:'打开',action:()=>{const r=Math.random();if(r<0.4){p.evoPoints+=50;addMsg('+50EP');}else if(r<0.7){p.atk+=1;addMsg('ATK+1');}else{p.maxHp+=20;p.hp+=20;addMsg('MaxHP+20');}closeEvent();}}]},
{title:'⛲ 生命之泉',text:'清澈的水从墙壁裂缝渗出',choices:[{label:'饮用',action:()=>{p.hp=p.maxHp;p.pollution=Math.max(0,p.pollution-10);addMsg('满血恢复，污染-10');closeEvent();}},{label:'忽略',action:()=>{closeEvent();}}]},
{title:'📦 实验物资',text:'散落的物资箱，标签已模糊',choices:[{label:'搜索',action:()=>{p.evoPoints+=25+zone*10;addMsg('+'+(25+zone*10)+'EP');closeEvent();}},{label:'忽略',action:()=>{closeEvent();}}]},
{title:'🔬 研究终端',text:'一台还在运行的终端机',choices:[{label:'读取',action:()=>{const alive=game.monsters.filter(m=>m.hp>0);if(alive.length>0){const m=alive[0];addMsg('扫描: '+m.name+' HP:'+m.hp+' ATK:'+m.atk+' DEF:'+m.def);}else{addMsg('无数据');}closeEvent();}},{label:'破坏',action:()=>{p.evoPoints+=15;addMsg('+15EP(零件)');closeEvent();}}]},
{title:'💉 改造试剂',text:'标签写着"Alpha-7增强剂"',choices:[{label:'注射',action:()=>{if(Math.random()<0.6){p.atk+=1;p.def+=1;addMsg('强化成功! ATK+1 DEF+1');}else{p.hp=Math.floor(p.hp*0.8);p.pollution=Math.min(100,p.pollution+5);addMsg('排异反应! HP-20% 污染+5');}closeEvent();}},{label:'丢弃',action:()=>{closeEvent();}}]},
// === 陷阱类 ===
{title:'💀 污染契约',text:'墙上浮现三道意识印记，等待你的选择...',choices:[
  {label:'🩸 嗜身印记 (附身率+15% 永久, 污染+15)',action:()=>{p._cardPossessBonus=(p._cardPossessBonus||0)+0.15;p.pollution=Math.min(100,p.pollution+15);addMsg('🩸 嗜身印记: 附身率永久+15%, 污染+15');closeEvent();}},
  {label:'🌀 共鸣核心 (连击增益×1.5 永久, 切换+3污染)',action:()=>{p._cardComboMult=(p._cardComboMult||0)+0.5;p._cardSwitchPolPenalty=(p._cardSwitchPolPenalty||0)+3;addMsg('🌀 共鸣核心: 连击增益×1.5, 切换形态额外+3污染');closeEvent();}},
  {label:'🛡 拒绝 (HP-10%)',action:()=>{p.hp=Math.max(1,Math.floor(p.hp*0.9));addMsg('🛡 你抵抗了印记 HP-10%');closeEvent();}}
]},
{title:'⚡ 电击陷阱',text:'踩到了隐藏的电击板！',choices:[{label:'硬撑',action:()=>{const dmg=Math.floor(p.maxHp*0.15);p.hp=Math.max(1,p.hp-dmg);addMsg('-'+dmg+'HP');closeEvent();}},{label:'跳开(迅捷)',action:()=>{if(hasTraitEffect('moveDouble')){addMsg('迅捷闪避成功！');}else{const dmg=Math.floor(p.maxHp*0.1);p.hp=Math.max(1,p.hp-dmg);addMsg('闪避失败 -'+dmg+'HP');}closeEvent();}}]},
{title:'🌫️ 毒雾弥漫',text:'走廊充满了腐蚀性气体',choices:[{label:'冲过去',action:()=>{p.hp=Math.max(1,p.hp-Math.floor(p.maxHp*0.1));p.pollution=Math.min(100,p.pollution+5);addMsg('HP-10% 污染+5');closeEvent();}},{label:'等待散去',action:()=>{addMsg('等待中...安全通过');closeEvent();}}]},
{title:'🕳️ 地板塌陷',text:'脚下传来不祥的声响',choices:[{label:'往前走',action:()=>{if(Math.random()<0.5){addMsg('安全通过');}else{p.hp=Math.max(1,p.hp-Math.floor(p.maxHp*0.2));addMsg('坠落！HP-20%');}closeEvent();}},{label:'绕路',action:()=>{addMsg('绕路安全');closeEvent();}}]},
// === 选择类 ===
{title:'👤 幸存者',text:'一个颤抖的研究员躲在角落',choices:[{label:'帮助',action:()=>{p.evoPoints+=40;p.pollution=Math.max(0,p.pollution-5);addMsg('+40EP 污染-5 (感谢)');closeEvent();}},{label:'忽略',action:()=>{closeEvent();}},{label:'...附身',action:()=>{p.atk+=2;p.pollution=Math.min(100,p.pollution+15);addMsg('ATK+2 但污染+15');closeEvent();}}]},
{title:'🔮 记忆裂隙',text:'空间中浮现出前任宿主的记忆',choices:[{label:'触碰',action:()=>{if(Math.random()<0.7){const bonus=zone*25;p.evoPoints+=bonus;addMsg('记忆碎片 +'+bonus+'EP');}else{p.pollution=Math.min(100,p.pollution+10);addMsg('记忆反噬 污染+10');}closeEvent();}},{label:'回避',action:()=>{closeEvent();}}]},
{title:'⚗️ 实验残留',text:'被遗弃的实验台上有两瓶药剂',choices:[{label:'红色药剂',action:()=>{ensureEvoBonus(p);p.atk+=2;p._evoStatBonus.atk+=2;var _dd=Math.min(1,p.def);p.def-=_dd;p._evoStatBonus.def-=_dd;addMsg('ATK+2 DEF-1');closeEvent();}},{label:'蓝色药剂',action:()=>{ensureEvoBonus(p);p.def+=2;p._evoStatBonus.def+=2;var _da=p.atk>1?1:0;p.atk-=_da;p._evoStatBonus.atk-=_da;addMsg('DEF+2 ATK-1');closeEvent();}},{label:'都不喝',action:()=>{closeEvent();}}]},
{title:'🎰 赌博机',text:'一台老旧的投币机还在运转',choices:[{label:'投50EP',action:()=>{if(p.evoPoints<50){addMsg('EP不足');closeEvent();return;}p.evoPoints-=50;const r=Math.random();if(r<0.2){p.evoPoints+=100;addMsg('大奖！+100EP');}else if(r<0.5){p.evoPoints+=40;addMsg('+40EP');}else{addMsg('没中...');}closeEvent();}},{label:'离开',action:()=>{closeEvent();}}]},
// === 环境类 ===
{title:'🔥 爆炸残骸',text:'某次实验的残余能量还在跳动',choices:[{label:'吸收',action:()=>{p.evoPoints+=30;p.pollution=Math.min(100,p.pollution+3);addMsg('+30EP 污染+3');closeEvent();}},{label:'避开',action:()=>{closeEvent();}}]},
{title:'📡 信号源',text:'某种频率在干扰你的感知',choices:[{label:'追踪源头',action:()=>{if(Math.random()<0.5){game._mapScanned=true;addMsg('地图信息获取成功');}else{p.pollution=Math.min(100,p.pollution+8);addMsg('信号干扰 污染+8');}closeEvent();}},{label:'屏蔽',action:()=>{closeEvent();}}]},
{title:'🧬 基因池',text:'一池发光的液体，里面有东西在游动',choices:[{label:'浸入',action:()=>{ensureEvoBonus(p);const gains=['ATK+1','DEF+1','MaxHP+15'];const g=gains[Math.floor(Math.random()*3)];if(g==='ATK+1'){p.atk+=1;p._evoStatBonus.atk+=1;}else if(g==='DEF+1'){p.def+=1;p._evoStatBonus.def+=1;}else{p.maxHp+=15;p.hp+=15;p._evoStatBonus.maxHp+=15;}p.pollution=Math.min(100,p.pollution+5);addMsg(g+' 污染+5');closeEvent();}},{label:'采样(100EP)',action:()=>{if(p.evoPoints>=100){ensureEvoBonus(p);p.evoPoints-=100;p.atk+=1;p.def+=1;p.maxHp+=15;p.hp+=15;p._evoStatBonus.atk+=1;p._evoStatBonus.def+=1;p._evoStatBonus.maxHp+=15;addMsg('安全提取: ATK+1 DEF+1 MaxHP+15');}else{addMsg('EP不足');}closeEvent();}}]},
{title:'🚪 密室',text:'一道需要密码的门',choices:[{label:'破解(洞察)',action:()=>{if(hasTraitEffect('seeTrue')){p.evoPoints+=100;addMsg('密室破解！+100EP');}else{addMsg('破解失败');}closeEvent();}},{label:'暴力开门',action:()=>{p.hp=Math.max(1,p.hp-Math.floor(p.maxHp*0.1));p.evoPoints+=50;addMsg('HP-10% +50EP');closeEvent();}},{label:'离开',action:()=>{closeEvent();}}]},
// === 高层特殊 ===
{title:'👁️ 深渊凝视',text:'你感觉有什么东西在看着你',minZone:3,choices:[{label:'凝视深渊',action:()=>{p.pollution=Math.min(100,p.pollution+15);p.evoPoints+=zone*50;addMsg('污染+15 +'+(zone*50)+'EP');closeEvent();}},{label:'闭眼',action:()=>{closeEvent();}}]},
{title:'🌀 虚空裂缝',text:'现实在这里变得稀薄',minZone:4,choices:[{label:'穿越',action:()=>{if(Math.random()<0.5){game.floor=Math.max(1,game.floor-3);generateFloor();addMsg('时空跳跃！回到第'+game.floor+'层');}else{p.hp=Math.floor(p.hp*0.5);addMsg('虚空撕裂 HP-50%');}closeEvent();}},{label:'稳固现实',action:()=>{p.pollution=Math.max(0,p.pollution-10);addMsg('污染-10');closeEvent();}}]},
// === 高层回血事件 ===
{title:'🧬 共生菌落',text:'墙壁上的菌膜散发温暖的生物荧光',minZone:3,choices:[{label:'融合',action:()=>{const heal=Math.floor(p.maxHp*0.4);p.hp=Math.min(p.maxHp,p.hp+heal);p.pollution=Math.min(100,p.pollution+3);addMsg('🧬 菌膜融合 HP+'+heal+' 污染+3');closeEvent();}},{label:'采集',action:()=>{const heal=Math.floor(p.maxHp*0.2);p.hp=Math.min(p.maxHp,p.hp+heal);addMsg('🧬 菌膜采集 HP+'+heal);closeEvent();}}]},
{title:'💠 生命结晶',text:'深层矿脉中闪烁着治愈之光',minZone:4,choices:[{label:'吸收',action:()=>{p.hp=p.maxHp;p.maxHp+=30;p.hp+=30;addMsg('💠 满血恢复！MaxHP+30');closeEvent();}},{label:'保存',action:()=>{game._lifeStone=true;addMsg('💠 获得生命结晶（死亡时自动恢复50%HP）');closeEvent();}}]}
];
// 过滤当前zone可用的事件
const available=allEvents.filter(e=>!e.minZone||zone>=e.minZone);
// 避免连续触发相同事件
let event=available[Math.floor(Math.random()*available.length)];
if(game._lastEventTitle&&event.title===game._lastEventTitle&&available.length>1){
  event=available.filter(e=>e.title!==game._lastEventTitle)[Math.floor(Math.random()*(available.length-1))];
}
game._lastEventTitle=event.title;
document.getElementById('event-title').textContent=event.title;
document.getElementById('event-text').textContent=event.text;
const choicesEl=document.getElementById('event-choices');
choicesEl.innerHTML='';
event.choices.forEach(c=>{
  const btn=document.createElement('button');
  btn.className='btn';btn.style.margin='4px';btn.textContent=c.label;
  btn.onclick=function(){p=game.player;zone=(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode)?ExpeditionMode.getZone(game.floor):Math.min(5,Math.ceil(game.floor/10));c.action();};
  choicesEl.appendChild(btn);
});
document.getElementById('event-overlay').style.display='flex';
// 随机事件强制选择：禁用点背景关闭，并屏蔽 300ms 防止手指还在抬起时误触按钮
var _evOv=document.getElementById('event-overlay');
var _bg=_evOv.querySelector('.overlay-bg');
if(_bg){_bg.__ptOrigClick=_bg.__ptOrigClick||_bg.onclick;_bg.onclick=null;_bg.style.pointerEvents='none';}
var _btns=choicesEl.querySelectorAll('button');
for(var _bi=0;_bi<_btns.length;_bi++){_btns[_bi].style.pointerEvents='none';}
setTimeout(function(){
  for(var i=0;i<_btns.length;i++)_btns[i].style.pointerEvents='';
},320);
// 选择后恢复 overlay-bg（避免影响其它复用此 overlay 的弹窗）
var _origCloseEvent=window.closeEvent;
window.closeEvent=function(fromMenu){
  if(_bg&&_bg.__ptOrigClick){_bg.onclick=_bg.__ptOrigClick;_bg.__ptOrigClick=null;_bg.style.pointerEvents='';}
  window.closeEvent=_origCloseEvent;
  return _origCloseEvent(fromMenu);
};
}
function closeEvent(fromMenu){
  // 首次昵称弹窗强制锁定：必须填名才能继续
  if(window._nicknameModalLocked){
    var inp=document.getElementById('pt-nick-input');
    if(inp){
      try{inp.focus();}catch(e){}
      inp.style.transition='border-color 0.15s';
      inp.style.borderColor='#ff8aa0';
      setTimeout(function(){inp.style.borderColor='rgba(53,224,255,.32)';},400);
    }
    var st=document.getElementById('pt-nick-status');
    if(st){st.textContent='请先输入昵称（2-12 个字）';st.style.color='#ff8aa0';}
    return;
  }
  var ev=document.getElementById('event-overlay');
  ev.style.display='none';
  ev.style.zIndex='412';
  if(!fromMenu) _restoreHiddenByMenu();
  render();
}
function _restoreHiddenByMenu(){
  if(window._hiddenByMenu&&window._hiddenByMenu.length>0){
    window._hiddenByMenu.forEach(function(item){item.el.style.display=item.was;if(item.hadActive)item.el.classList.add('active');});
    window._hiddenByMenu=[];
  }
}
function confirmNewGame(){
const ev=document.getElementById('event-overlay');
ev.style.display='flex';
document.getElementById('event-title').textContent=t('⚠️ 确认退出');
document.getElementById('event-text').innerHTML='<div style="text-align:center;color:#ff6;font-size:13px;line-height:1.6">确定要放弃当前进度并开始新游戏吗？<br><span style="color:#f44;font-size:11px">此操作不可恢复！</span></div>';
document.getElementById('event-choices').innerHTML='<div style="display:flex;gap:10px;justify-content:center;margin-top:10px"><button class="btn" style="border-color:#ff3344;color:#ff3344;padding:6px 24px" onclick="closeEvent();startNewGame()">确认重开</button><button class="btn btn-secondary" style="padding:6px 24px" onclick="closeEvent()">取消</button></div>';
}
function confirmExitGame(){
const ev=document.getElementById('event-overlay');
ev.style.display='flex';
document.getElementById('event-title').textContent='🚪 退出游戏';
document.getElementById('event-text').innerHTML='<div style="text-align:center;color:#ccc;font-size:13px;line-height:1.8">是否保存当前进度？<br><span style="color:#888;font-size:11px">保存后下次可继续游戏</span></div>';
document.getElementById('event-choices').innerHTML=
  '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;align-items:center">'+
  '<button class="btn" style="border-color:#00ffd0;color:#00ffd0;padding:8px 24px;width:200px" onclick="closeEvent();saveGame(true);backToTitle()">💾 保存并退出</button>'+
  '<button class="btn" style="border-color:#ff3344;color:#ff3344;padding:8px 24px;width:200px" onclick="closeEvent();startNewGame()">🗑 不保存（重开）</button>'+
  '<button class="btn btn-secondary" style="padding:6px 24px;width:200px" onclick="closeEvent()">取消</button>'+
  '</div>';
}
function startNewGame(){
var mid=(window.GameRules&&GameRules.modeId)||'classic';
if(typeof deleteSave==='function')deleteSave(mid);
else{try{localStorage.removeItem('pt_save_'+mid);}catch(e){}}
location.reload();
}

function showEventDialog(title,html,showClose){
  const ev=document.getElementById('event-overlay');
  document.getElementById('event-title').textContent=title;
  document.getElementById('event-text').innerHTML=html;
  const choicesEl=document.getElementById('event-choices');
  choicesEl.innerHTML='';
  if(showClose){
    const btn=document.createElement('button');
    btn.className='btn';btn.textContent=t('确定');
    btn.onclick=function(){closeEvent();};
    choicesEl.appendChild(btn);
  }
  ev.style.display='flex';
}
