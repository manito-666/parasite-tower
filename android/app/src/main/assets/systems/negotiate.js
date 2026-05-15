// === 附身谈判系统 ===
function getMonsterNegBias(type){
  // 怪物心理倾向：对特定谈判策略更易屈服，+15% 成功率
  // threat=威压(凶兽/鲁莽) trade=交易(理性/机械) resonate=共鸣(孤独/哀恸)
  const biases={
    rat:'resonate',roach:'threat',slime:'resonate',dog:'resonate',gecko:'trade',drone:'trade',
    wolf:'threat',spider:'trade',bat:'resonate',wasp:'threat',guard:'trade',vine:'resonate',
    larva:'threat',mantis:'threat',beetle:'trade',worm:'resonate',moth:'resonate',scorpion:'threat',hydra:'threat',
    shade:'resonate',lurker:'resonate',wraith:'resonate',voidbeast:'threat',nightmare:'resonate',watcher:'trade',voiddragon:'threat',
    titan:'threat',chaos:'threat',deathknight:'trade',horror:'resonate',colossus:'trade',plague:'trade',origin:'resonate',
    boss1:'threat',boss2:'threat',boss3:'trade',boss4:'resonate',boss5:'resonate',trueform:'resonate'
  };
  return biases[type]||null;
}
function getNegBaseRate(){
if(game._skillEffects&&game._skillEffects.guaranteedPossess)return 1.0;
const t=game.target;
const hpRatio=t.maxHp>0?t.hp/t.maxHp:0.5;
const hpFactor=1-hpRatio*0.6;
const defResist=Math.min(0.15,t.def*0.005);
const possessBonus=getEvolutionEffect('possessBonus');
const traitPossessBonus=getTraitValue('possessBonus')||0;
const passivePossessBonus=getPassiveValue('passivePossess');
const sigPossessBonus=(game._sigFlags&&game._sigFlags.possessBonus)||0;
const routePossessBonus=(game._routeMods&&game._routeMods.possessBonus)||0;
const storyBonus=game.player._storyParasiteBonus||0;
const curseBonus=(game.curseBlessing&&game.curseBlessing.mods.possessBonus)||0;
const cardBonus=game.player._cardPossessBonus||0;
return Math.min(0.95,0.4*hpFactor-defResist+possessBonus+traitPossessBonus+passivePossessBonus+sigPossessBonus+routePossessBonus+storyBonus+curseBonus+cardBonus);
}
function openNegotiate(){
if(document.getElementById('negotiate-overlay').classList.contains('active'))return;
game._autoFight=false;
const t=game.target;
if(!t)return;
const baseRate=getNegBaseRate();
const basePercent=Math.round(baseRate*100);
// 怪物意识视觉
const colors={rat:'#00c8a0',roach:'#654321',slime:'#00ffd0',dog:'#696969',gecko:'#7ccd7c',drone:'#4682b4',
wolf:'#8b0000',spider:'#ff006e',bat:'#b455ff',wasp:'#ffa500',guard:'#8878aa',vine:'#2e8b57',
larva:'#9acd32',mantis:'#228b22',beetle:'#2d6b6b',worm:'#cd853f',moth:'#dda0dd',scorpion:'#8b4513',hydra:'#556b2f',
shade:'#191970',lurker:'#000080',wraith:'#483d8b',voidbeast:'#1e1e3f',nightmare:'#2f2f4f',watcher:'#0f0f2f',voiddragon:'#1a1a3a',
titan:'#2f4f2f',chaos:'#8b0000',deathknight:'#1c1c1c',horror:'#2a0a0a',colossus:'#0a0a1a',plague:'#556b2f',origin:'#4a0a4a',
boss1:'#aa0000',boss2:'#b8860b',boss3:'#8b008b',boss4:'#000000',boss5:'#0a0a0a'};
const icons={rat:'🐭',roach:'🪳',slime:'🟢',dog:'🐕',gecko:'🦎',drone:'🤖',
wolf:'🐺',spider:'🕷',bat:'🦇',wasp:'🐝',guard:'💂',vine:'🌿',
larva:'🐛',mantis:'🦗',beetle:'🪲',worm:'🪱',moth:'🦋',scorpion:'🦂',hydra:'🐍',
shade:'👻',lurker:'🌑',wraith:'💀',voidbeast:'🐉',nightmare:'😈',watcher:'👁',voiddragon:'🐲',
titan:'🪨',chaos:'🌀',deathknight:'⚔',horror:'👾',colossus:'🏛',plague:'☠',origin:'🧫',
boss1:'👹',boss2:'👹',boss3:'☢',boss4:'👿',boss5:'💀'};
const negEl=document.getElementById('negotiate-overlay');
const vis=document.getElementById('neg-visual');
// 设置怪物emoji到谈判面板
const negEmoji=document.getElementById('neg-portrait-emoji');
if(negEmoji){
  if(monsterSilhouettes[t.type]){
    negEmoji.innerHTML='<canvas id="neg-portrait-cv" width="64" height="64" style="width:64px;height:64px;border-radius:50%"></canvas>';
    setTimeout(function(){renderMonsterPortrait('neg-portrait-cv',t);},50);
  }else{negEmoji.textContent=icons[t.type]||'❓';}
}
vis.style.background='radial-gradient(circle,'+(colors[t.type]||'#8844ff')+'33,'+(colors[t.type]||'#8844ff')+'11)';
vis.style.border='2px solid '+(colors[t.type]||'#8844ff');
// 怪物意识描述
const descs={rat:'微弱的求生意识在颤抖...',roach:'顽强的生存本能在蠕动...',slime:'混沌的意识流在蠕动...',dog:'野性的忠诚在嘶吼...',gecko:'灵巧的生物在墙壁间穿梭...',drone:'残余的程序在闪烁...',
wolf:'凶残的捕猎意识在咆哮...',spider:'冰冷的算计在编织...',bat:'尖锐的回声在脑海中回荡...',wasp:'刺痛的毒意在嗡鸣...',guard:'残存的职责感在抵抗...',vine:'缠绕的生命意志在蔓延...',
larva:'蠕动的生长意志在膨胀...',mantis:'锋利的杀意在闪烁...',beetle:'坚硬的意志在震动...',worm:'寄生的本能在蠕动...',moth:'迷幻的粉尘在飘散...',scorpion:'剧毒的意志在对峙...',hydra:'多重的意识在争夺...',
shade:'虚无的存在在飘忽...',lurker:'黑暗中的凝视在逼近...',wraith:'怨恨的记忆在呐喊...',voidbeast:'虚空的野性在咆哮...',nightmare:'恐惧的本源在蔓延...',watcher:'深渊的注视在审判...',voiddragon:'远古的龙威在碾压...',
titan:'远古的威压在碾压一切...',chaos:'疯狂的混沌在旋转...',deathknight:'亡灵的铁意在抗拒...',horror:'难以名状的恐惧在侵蚀...',colossus:'不可动摇的意志在镇压...',plague:'腐朽的瘟意在扩散...',origin:'原初的意识在共鸣...',
boss1:'实验主管的权威在镇压...',boss2:'培育主管的怒意在燃烧...',boss3:'污染核心的意识在震荡...',boss4:'深渊领主的虚空在吞噬...',boss5:'真实形态的一切在共鸣...'};
document.getElementById('neg-sub').textContent=descs[t.type]||'陌生的意识在抵抗...';
var _tutGuide=t&&(t.id==='tut_dog'||t._tutorialHighlight);
document.getElementById('neg-base-rate').textContent='基础成功率: '+basePercent+'%'+(_tutGuide?' (新手引导 100%)':'');
// 诱饵精英：在面板上明示污染代价
if(t&&t._lurePol){
  var _nbr=document.getElementById('neg-base-rate');
  _nbr.innerHTML+=' <span style="color:#ff006e;font-weight:bold">⚠ 此宿主异常强大，附身将额外+'+t._lurePol+'污染</span>';
}
// 构建选项卡
const cardsEl=document.getElementById('neg-cards');
cardsEl.innerHTML='';
const isTutorialDog=_tutGuide;
const isTutorial=isTutorialDog;
const _bias=isTutorial?null:getMonsterNegBias(t.type);
const _biasHint=_bias?'<span style="color:#00ffd0;font-size:9px;margin-left:4px">✨对此类有效</span>':'';
const threatRate=isTutorial?100:Math.max(1,basePercent-20+(_bias==='threat'?15:0));
const tradeRate=isTutorial?95:Math.min(95,basePercent+20+(_bias==='trade'?15:0));
const resonateRate=isTutorial?95:Math.min(95,basePercent+10+(_bias==='resonate'?15:0));
// 选项1: 威压
const c1=document.createElement('div');
c1.className='neg-card nc-threat'+(_bias==='threat'?' nc-preferred':'');
c1.innerHTML='<div class="nc-name">👊 威压'+(_bias==='threat'?_biasHint:'')+'</div><div class="nc-quote">"臣服，否则毁灭"</div><div class="nc-effect">成功率<span style="color:#ff006e">-20%</span>，成功后<span style="color:#4f4">满HP继承+50EP</span></div><div class="neg-rate">'+threatRate+'%</div>';
c1.onclick=function(){doNegotiate('threat');};
cardsEl.appendChild(c1);
if(!isTutorialDog){
// 选项2: 交易
const c2=document.createElement('div');
c2.className='neg-card nc-trade'+(_bias==='trade'?' nc-preferred':'');
c2.innerHTML='<div class="nc-name">🤝 交易'+(_bias==='trade'?_biasHint:'')+'</div><div class="nc-quote">"分享你的身体，我带你离开"</div><div class="nc-effect">成功率<span style="color:#4f4">+20%</span>，但<span style="color:#ff006e">污染+10</span></div><div class="neg-rate">'+tradeRate+'%</div>';
c2.onclick=function(){doNegotiate('trade');};
cardsEl.appendChild(c2);
// 选项3: 共鸣
const c3=document.createElement('div');
c3.className='neg-card nc-resonate'+(_bias==='resonate'?' nc-preferred':'');
c3.innerHTML='<div class="nc-name">💫 共鸣'+(_bias==='resonate'?_biasHint:'')+'</div><div class="nc-quote">"我们都被困在这里"</div><div class="nc-effect">成功率<span style="color:#4f4">+10%</span>，<span style="color:#00ffd0">羁绊+1</span></div><div class="neg-rate">'+resonateRate+'%</div>';
c3.onclick=function(){doNegotiate('resonate');};
cardsEl.appendChild(c3);
} // end !isTutorialDog
// 隐藏选项: 高污染时怪物先开口
if(game.player.pollution>=70){
  const c4=document.createElement('div');
  c4.className='neg-card nc-join';
  c4.innerHTML='<div class="nc-name">🌀 加入</div><div class="nc-quote">"你也听到了，对吗？那个声音"</div><div class="nc-effect"><span style="color:#c6f">直接获得形态</span>，跳过判定，但<span style="color:#ff006e">污染+15</span></div><div class="neg-rate" style="color:#c6f">100%</div>';
  c4.onclick=function(){doNegotiate('join');};
  cardsEl.appendChild(c4);
}
const closeBtn=document.createElement('button');
closeBtn.style.cssText='width:100%;margin-top:10px;padding:8px;background:rgba(255,255,255,0.05);border:1px solid #555;color:#888;border-radius:6px;font-size:13px;cursor:pointer';
closeBtn.textContent=PT_LANG.t('✕ 取消');
closeBtn.onclick=function(){closeNegotiate();};
cardsEl.appendChild(closeBtn);
negEl.classList.add('active');
}
function closeNegotiate(){
document.getElementById('negotiate-overlay').classList.remove('active');
}
function doNegotiate(choice){
const t=game.target,p=game.player;
if(!t){closeNegotiate();return;}
closeNegotiate();
const baseRate=getNegBaseRate();
// 寄生狂热碎片：消耗一次性附身保证
if(game._skillEffects&&game._skillEffects.guaranteedPossess){game._skillEffects.guaranteedPossess=false;addMsg('🦠 寄生狂热消耗 — 附身100%成功');}
let finalRate=baseRate;
let extraPollution=0;
let fullHpInherit=false;
let affinityBonus=false;
// 隐藏选项：加入（直接成功）
if(choice==='join'){
  executePossessSuccess(true,15);
  return;
}
if(choice==='threat'){finalRate=baseRate-0.2;fullHpInherit=true;}
else if(choice==='trade'){finalRate=baseRate+0.2;extraPollution=10;}
else if(choice==='resonate'){finalRate=baseRate+0.1;affinityBonus=true;}
// 意识倾向加成: 选对策略 +15%
var _tBias=getMonsterNegBias(t.type);
if(_tBias===choice){finalRate+=0.15;addMsg('✨ 共鸣点击中! 意识松动');}
if(t&&(t.id==='tut_dog'||t._tutorialHighlight))finalRate=1.0;
if(t&&t._lurePol)extraPollution+=t._lurePol;
if(finalRate<1.0)finalRate=Math.max(0.01,Math.min(0.95,finalRate));
if(Math.random()<finalRate){
  // 谈判成功
  if(affinityBonus)updateFormAffinity(t.type,'possess',1);
  if(choice==='threat'){game.player.evoPoints+=50;addMsg('💪 威压成功! 额外获得50EP');}
  executePossessSuccess(fullHpInherit,extraPollution);
}else{
  // 谈判失败 → 按策略分层后果
  try{sounds.possessFail();}catch(e){}
  spawnPossessEffect(t.x||game.player.x,t.y||game.player.y,false);
  possessCinematic(false);
  var _failType='resist',_failMsg='',_failPol=5;
  if(choice==='threat'){
    // 威压失败 → 反噬 (backlash): 目标愤怒反击你的意识
    _failType='backlash';_failPol=20;
    var _bkDmg=Math.floor(p.maxHp*0.3);
    p.hp=Math.max(1,p.hp-_bkDmg);
    t.atk=Math.floor(t.atk*1.5);
    t._enraged=true;
    _failMsg='💥 意识反噬! '+t.name+' 的愤怒撕裂了你: HP-'+_bkDmg+' 污染+20 (ATK×1.5)';
  }else if(choice==='resonate'){
    _failType='split';_failPol=15;
    var _defLoss=Math.max(1,Math.floor(p.def*0.3));
    p.def=Math.max(0,p.def-_defLoss);
    var _mHeal=Math.floor(t.maxHp*0.3);
    t.hp=Math.min(t.maxHp,t.hp+_mHeal);
    t._enraged=true;
    _failMsg='🌀 意识割裂! 共鸣反噬侵蚀了你的防御: DEF-'+_defLoss+' '+t.name+'回复'+_mHeal+'HP 污染+15';
  }else{
    // 交易失败 → 被抵抗 (resist): 温和处理
    _failType='resist';_failPol=5;
    t.atk=Math.floor(t.atk*1.5);
    t._enraged=true;
    _failMsg='🚫 目标识破你的交易: '+t.name+' 狂暴 污染+5 (ATK×1.5)';
  }
  p.pollution=Math.min(100,p.pollution+_failPol);
  addMsg('<span style="color:#ff006e;font-weight:bold">✗ '+_failMsg+'</span>');
  var _bpNeg=document.getElementById('btn-possess');if(_bpNeg){_bpNeg.disabled=false;_bpNeg.style.opacity='0.4';_bpNeg.innerHTML='破裂';}
  var _bpbNeg=document.getElementById('btn-possess-bottom');if(_bpbNeg){_bpbNeg.disabled=false;_bpbNeg.style.opacity='0.4';_bpbNeg.innerHTML='破裂';}
  const log=document.getElementById('combat-log');
  if(log){log.innerHTML+='<div style="color:#ff006e;font-weight:bold;margin-top:4px">【'+(_failType==='backlash'?'反噬':_failType==='split'?'意识割裂':'被抵抗')+'】'+_failMsg+'</div>';
  log.scrollTop=log.scrollHeight;}
  showCombat();render();
}
}
function executePossessSuccess(fullHpInherit,extraPollution){
const p=game.player,t=game.target;
// 预检查：所有非本命槽都死亡 → 无法寄生（例外：只剩 1 个活槽 → 死槽复活 或 覆盖该槽）
{
  let _hasAnySlot=false,_aliveCount=0,_aliveIdx=-1,_hasDeadSlot=false;
  for(let _i=0;_i<game.forms.length;_i++){
    if(game.forms[_i]&&game.forms[_i].type===t.type&&!game._deadForms[_i]){_hasAnySlot=true;}
    if(!game.forms[_i]&&!game._deadForms[_i]){_hasAnySlot=true;}
    if(game.forms[_i]&&!game._deadForms[_i]&&game.forms[_i].type!=='human'&&_i!==game.currentForm){_hasAnySlot=true;}
    if(game.forms[_i]&&!game._deadForms[_i]){_aliveCount++;_aliveIdx=_i;}
    if(game._deadForms[_i])_hasDeadSlot=true;
  }
  // 当前形态非本命 → 可被覆盖（兜底）
  if(!_hasAnySlot&&game.forms[game.currentForm]&&game.forms[game.currentForm].type!=='human')_hasAnySlot=true;
  // 救援放行：只剩 1 活槽且该槽不是本命 + (有死槽可复活 OR 可被覆盖)
  if(!_hasAnySlot&&_aliveCount===1&&game.forms[_aliveIdx]&&game.forms[_aliveIdx].type!=='human'&&(_hasDeadSlot||true))_hasAnySlot=true;
  if(!_hasAnySlot){
    var _noSlotMsg=(window.GameModes&&GameModes.isShort())?'✗ 所有形态槽已死亡，无法承载新形态':'✗ 所有形态槽已死亡，无法承载新形态（前往净化祭坛或继续以本命职业作战）';
    addMsg('<span style="color:#ff006e;font-weight:bold">'+_noSlotMsg+'</span>');
    closeCombat();return;
  }
}
var _oldAtk=p.atk,_oldDef=p.def,_oldHp=p.maxHp;
game._lastReplacedSlot=null;
var _isFirstPossess=Object.keys(p.possessed).length===0;
var _useAhaCinematic=_isFirstPossess&&game._forceTutorial&&typeof playFirstPossessAha==='function';
try{sounds.possess();}catch(e){}
possessCinematic(true);
if(_isFirstPossess&&!_useAhaCinematic){
  setTimeout(function(){
    try{playChoirStab([165,220,330],0.8);}catch(e){}
    var aw=document.createElement('div');
    aw.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);z-index:10001;pointer-events:none;font-size:18px;font-weight:900;color:#00ffd0;text-shadow:0 0 15px rgba(0,255,208,0.8),0 0 30px rgba(0,255,208,0.4);opacity:0;transition:all 0.4s ease-out;text-align:center;letter-spacing:3px;white-space:nowrap';
    aw.textContent='◈ 意 识 觉 醒 ◈';
    document.body.appendChild(aw);
    requestAnimationFrame(function(){aw.style.opacity='1';aw.style.transform='translate(-50%,-50%) scale(1)';});
    setTimeout(function(){aw.style.opacity='0';aw.style.transform='translate(-50%,-50%) scale(1.2)';},1800);
    setTimeout(function(){aw.remove();},2200);
  },600);
}
saveCurrentForm();
resetCombo(true); // 形态共鸣: 附身切换形态重置连击
if(fullHpInherit){
  p.maxHp=t.maxHp;p.hp=t.maxHp;
}else{
  const hpRatio=t.maxHp>0?t.hp/t.maxHp:0.5;
  const inheritFactor=hpRatio>=0.8?1.0:hpRatio>=0.4?0.8:0.6;
  p.maxHp=Math.max(1,Math.floor(t.maxHp*inheritFactor));p.hp=Math.max(1,Math.floor(t.hp*inheritFactor));
}
p.atk=t.atk;
// 共生：旧形态有「共生」时，从旧 traits 中随机保留 1 个新 traits 没有的特性
var _oldTraits=p.traits||[];
var _hasSymbiosis=_oldTraits.indexOf('共生')>=0;
p.def=t.def;p.traits=t.traits.slice();
if(_hasSymbiosis){
  var _candPool=_oldTraits.filter(function(tr){return tr!=='共生'&&p.traits.indexOf(tr)<0;});
  if(_candPool.length>0){
    var _kept=_candPool[Math.floor(Math.random()*_candPool.length)];
    p.traits.push(_kept);
    try{addMsg('🌿 共生 保留旧特性: '+_kept);}catch(e){}
  }
}
// 3.3 残响继承: 消耗队列中的形态残响，属性 +20%
if(p._formEcho){
  var _ec=p._formEcho;
  var _echoAtk=Math.floor(_ec.atk*0.2);
  var _echoDef=Math.floor(_ec.def*0.2);
  var _echoHp=Math.floor(_ec.maxHp*0.2);
  p.atk+=_echoAtk;p.def+=_echoDef;p.maxHp+=_echoHp;p.hp+=_echoHp;
  addMsg('<span style="color:#b455ff;font-weight:bold">🔮 '+_ec.name+' 的残响融入: ATK+'+_echoAtk+' DEF+'+_echoDef+' HP+'+_echoHp+'</span>');
  p._formEcho=null;
}
p.possessed[t.id]=true;
const flatDef=getTraitValue('flatDef');if(flatDef)p.def+=flatDef;
const allBonus=getTraitValue('allBonus');if(allBonus){p.atk+=allBonus;p.def+=allBonus;}
if(!_useAhaCinematic){
  // 属性对比推迟到 storeFormOnPossess / applyFormReplacement 之后展示
}
const pr=getEvolutionEffect('pollutionReduce');
let polAdd=10+(extraPollution||0);
if(window.GameModes&&GameModes.isShort()&&window.ShortMode){polAdd=Math.round(polAdd*ShortMode.getFloorCurve(game.floor).possessPollMult);}
else if(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode){polAdd=Math.round(polAdd*ExpeditionMode.getFloorCurve(game.floor).possessPollMult);}
else if(typeof getFullFloorCurve==='function'){polAdd=Math.round(polAdd*getFullFloorCurve(game.floor).possessPollMult);}
const polResist=getTraitValue('polResist');if(polResist)polAdd=Math.floor(polAdd*(1-polResist));
if(game._dailyPollMult)polAdd=Math.floor(polAdd*game._dailyPollMult);
p.pollution=Math.min(100,p.pollution+(pr?Math.max(0,polAdd-pr):polAdd));
p.name=t.name;p.formType=t.type;
t.hp=0;t.alertLevel=0;t.possessed=true;
delete t._tutorialHighlight;delete game._tutorialTarget;
game._combatRound=0;
var _storeRes=storeFormOnPossess(t.type,t.name);
if(_storeRes==='NO_SLOT'){
  addMsg('<span style="color:#ff006e;font-weight:bold">✗ 无可用形态槽，无法承载新形态</span>');
  closeCombat();return;
}
if(_storeRes==='NEED_CHOOSE'){
  try{sounds.slotsFull();}catch(e){}
  showFormReplaceDialog(t.type,t.name,function(slotIdx){
    if(applyFormReplacement(slotIdx)!==false){
      var _rs2=game._lastReplacedSlot;
      var _cA=_rs2?_rs2.atk:_oldAtk,_cD=_rs2?_rs2.def:_oldDef,_cH=_rs2?_rs2.maxHp:_oldHp;
      showPossessCompare(_cA,_cD,_cH,p.atk,p.def,p.maxHp,p.traits,t.name);
      _finalizePossess(p,t);
    }
  });
  return;
}
if(!_useAhaCinematic){
  var _rs=game._lastReplacedSlot;
  var _cmpOA=_rs?_rs.atk:_oldAtk,_cmpOD=_rs?_rs.def:_oldDef,_cmpOH=_rs?_rs.maxHp:_oldHp;
  showPossessCompare(_cmpOA,_cmpOD,_cmpOH,p.atk,p.def,p.maxHp,p.traits,t.name);
}
if(_useAhaCinematic){
  var _ahaNew={atk:p.atk,def:p.def,hp:p.maxHp,traits:(p.traits||[]).slice(),name:t.name,type:t.type};
  var _ahaOld={atk:_oldAtk,def:_oldDef,hp:_oldHp};
  playFirstPossessAha(p,t,_ahaOld,_ahaNew,function(){_finalizePossess(p,t);});
  return;
}
_finalizePossess(p,t);
}
function _finalizePossess(p,t){
runTraitPipeline('onPossessSuccess',{self:p,target:t,log:null},p.traits||[]);
var _evoOld=getFormEvoLevel(t.type);
updateFormAffinity(t.type,'possess',1);
var _evoNew=getFormEvoLevel(t.type);
if(_evoNew>_evoOld){
  var _evoPct=_evoNew===3?18:_evoNew===2?10:5;
  var _evoTitle={1:'熟悉',2:'精通',3:'完全融合'}[_evoNew];
  var _evoColor=_evoNew===3?'#ffd700':_evoNew===2?'#b455ff':'#00c8ff';
  setTimeout(function(){
    try{sounds.evolve();}catch(e){}
    addMsg('<span style="color:'+_evoColor+';font-size:1.15em;font-weight:900;text-shadow:0 0 8px currentColor">🧬 形态进化 Lv.'+_evoNew+' 『'+_evoTitle+'』</span>');
    addMsg('<span style="color:'+_evoColor+';font-weight:bold">　'+t.name+' 形态 ATK 永久 +'+_evoPct+'%</span>');
  },1200);
}
applyAffinityBonus(t.type);
updateFormBar();
createAnchor('possess');
game._floorsWithoutPossess=0;
checkHiddenStory('possess_success');
const formZone=monsterTemplates[t.type]?monsterTemplates[t.type].zone:1;
const formEP=50+formZone*40;p.evoPoints+=formEP;
unlockBestiary(t.type);
showFragment(t.type);
spawnPossessEffect(t.x||p.x,t.y||p.y,true);
setTimeout(()=>{
  closeCombat();
  if(game.floor===1&&t.id==='tut_dog'){
    addMsg('<span style="color:#00ffd0;font-weight:bold">附身成功 — 你夺取了更强的宿主，战斗能力显著提升。</span>');
    setTimeout(function(){addMsg('<span style="color:#888;font-size:11px">不同宿主拥有不同强度与能力。强大的宿主能显著提升你的生存与战斗能力。</span>');},600);
    setTimeout(function(){addMsg('<span style="color:#c6f;font-style:italic">你现在拥有更强的身体。继续前进。</span>');},1500);
    setTimeout(function(){addMsg('<span style="color:#ff8c00;font-weight:bold">➤ 楼梯口被守卫挡住——击杀全部守卫即可下楼，全清额外 +80EP</span>');},2400);
  }else{
    addMsg('✓ 附身成功！获得 '+t.name+' 的能力 +'+formEP+'EP');
  }
  if(game._tutorialStage===1){
    game._tutorialStage=2;
    if(typeof announceStageUp==='function')announceStageUp(2);
    if(typeof _tutorialShown!=='undefined')_tutorialShown['possess']=true;
    if(typeof _saveTutShown==='function')_saveTutShown();
    try{localStorage.setItem('pt_first_run_done','1');}catch(e){}
    game._forceTutorial=false;
    setTimeout(function(){checkTutorial('formUnlock');},800);
    setTimeout(function(){checkTutorial('inspect');},2200);
  }
  if(game.forms&&game.forms.filter(f=>f).length>=2&&!_tutorialShown.formManage){setTimeout(()=>checkTutorial('formManage'),800);}
  try{ if(window.GameRules) GameRules.hooks.onPossess(t); }catch(e){}
  checkAchievements();
  checkEvoUnlockHint();
  checkFloorCleared();render();
},100);
}
function checkFloorCleared(){
if(game.monsters.filter(m=>m.hp>0).length===0){
// 防线层波次机制（X9层：Boss前一层，共3波）
if(game.floor%10===9&&game.floor>=9){
  if(!game._waveCount)game._waveCount=1;
  if(game._waveCount<3){
    game._waveCount++;
    var _wZone=Math.min(5,Math.ceil(game.floor/10));
    var _wTypes=Object.keys(monsterTemplates).filter(function(k){return monsterTemplates[k].zone===_wZone&&!k.includes('boss');});
    var _wIsShort=window.GameModes&&GameModes.isShort()&&window.ShortMode;
    var _wSCv=_wIsShort?ShortMode.getFloorCurve(game.floor):null;
    var _wBoost=game._waveCount===2?0.85:1.05;
    var _wCount=_wIsShort?(game._waveCount===2?4:5):(3+Math.floor(_wZone/2));
    addMsg('<span style="color:#ff006e;font-weight:bold;font-size:1.1em">⚠ 第'+game._waveCount+'波敌人来袭！</span>');
    for(var _wi=0;_wi<_wCount;_wi++){
      var _wt=_wTypes[Math.floor(Math.random()*_wTypes.length)];var _wtm=monsterTemplates[_wt];
      var _wx,_wy,_wst=0;do{_wx=2+Math.floor(Math.random()*9);_wy=2+Math.floor(Math.random()*9);_wst++;}while(_wst<100&&((_wx===game.player.x&&_wy===game.player.y)||game.tiles[_wy][_wx]!==1||game.monsters.some(function(em){return em.x===_wx&&em.y===_wy&&em.hp>0;})));
      if(_wst>=100)continue;
      var _wHp,_wAtk,_wEliteRate;
      if(_wIsShort){
        var _pHp=game.player.maxHp||120,_pAtk=game.player.atk||8;
        _wHp=Math.max(20,Math.floor(_pHp*_wSCv.hpMult*_wBoost*(0.8+Math.random()*0.4)));
        _wAtk=Math.max(3,Math.floor(_pAtk*_wSCv.atkMult*_wBoost*(0.8+Math.random()*0.4)));
        // 兜底：避免玩家裸体时怪物退化得过弱
        var _wMinScale=0.25+game.floor*0.05;
        _wHp=Math.max(_wHp,Math.floor(_wtm.maxHp*_wMinScale*_wBoost));
        _wAtk=Math.max(_wAtk,Math.floor(_wtm.atk*_wMinScale*_wBoost));
        _wEliteRate=Math.min(0.6,_wSCv.eliteRate*1.2);
      }else{
        var _wCv=typeof getFullFloorCurve==='function'?getFullFloorCurve(game.floor):null;
        var _wHpS=_wCv?_wCv.hpScale:(1+game.floor*0.01);var _wAtkS=_wCv?_wCv.atkScale:(1+game.floor*0.01);
        _wHp=Math.floor(_wtm.maxHp*_wHpS);_wAtk=Math.floor(_wtm.atk*_wAtkS);
        _wEliteRate=_wCv?_wCv.eliteRate:0.25;
      }
      var _wElite=Math.random()<_wEliteRate;
      if(_wElite){_wHp=Math.floor(_wHp*1.6);_wAtk=Math.floor(_wAtk*1.4);}
      game.monsters.push({id:_wt+'w'+game._waveCount+'_'+_wi,type:_wt,name:(_wElite?'★ ':'')+_wtm.name,hp:_wHp,maxHp:_wHp,atk:_wAtk,def:_wtm.def,traits:_wtm.traits.slice(),color:_wtm.color,x:_wx,y:_wy,possessed:false,ai:getMonsterAI(_wtm),alertLevel:2,homeX:_wx,homeY:_wy,detectRange:getMonsterDetectRange(_wtm),_elite:_wElite||false});
    }
    saveFloorState();render();
    return;
  }
  game._waveCount=0;
}
if(!game.floorCleared[game.floor]){
  game.floorCleared[game.floor]=true;
  // 短局 floorCap 层清除 → 触发崩溃序列
  if(window.GameModes&&GameModes.isShort()&&game.floor>=GameRules.floorCap){
    addMsg('<span style="color:#ff006e;font-weight:bold">⚠ 最终层……意识开始崩解。</span>');
    setTimeout(function(){ if(window.ShortMode) ShortMode.forceFinale('time'); },1200);
    saveFloorState();
    return;
  }
  const bonus=30+game.floor*10;game.player.evoPoints+=bonus;if(game.floor%2===0)game.player.atk+=1;
  addMsg('★ 楼层清除！+'+bonus+'EP'+(game.floor%2===0?'，ATK+1':''));
  try{sounds.levelUp();}catch(e){}
  // 100%探索额外奖励
  if(getExplorePercent(game.floor)>=95){
    const expBonus=80;game.player.evoPoints+=expBonus;
    addMsg('★ 完全探索！额外+'+expBonus+'EP');
  }
  if(Math.random()<0.25)triggerRandomEvent();
}else{
  addMsg('楼层已清除（无额外奖励）');
}
saveFloorState();
}
}

