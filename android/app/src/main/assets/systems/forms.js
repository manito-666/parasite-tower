// ================================================================
// 形态记忆 + 形态羁绊 + 形态图鉴
// ================================================================
const _fDom={};
function ensureEvoBonus(p){if(!p._evoStatBonus)p._evoStatBonus={atk:0,def:0,maxHp:0};return p._evoStatBonus;}
const formIcons={human:'👤',rat:'🐭',roach:'🪳',slime:'🟢',dog:'🐕',gecko:'🦎',drone:'🤖',wasp:'🐝',wolf:'🐺',spider:'🕷',bat:'🦇',guard:'💂',vine:'🌿',boss1:'👹',
larva:'🐛',mantis:'🦗',beetle:'🪲',worm:'🪱',moth:'🦋',scorpion:'🦂',hydra:'🐍',centipede:'🐛',queen:'👑',boss2:'👹',
flesh:'🫀',tentacle:'🦑',eye:'👁',fusion:'🧬',mimic:'🎭',walker:'🚶',screamer:'😱',bloater:'💣',boss3:'☢',
shade:'👻',lurker:'🌑',wraith:'💀',voidbeast:'🐉',nightmare:'😈',watcher:'👁',voiddragon:'🐲',boss4:'👿',
titan:'🪨',chaos:'🌀',deathknight:'⚔',horror:'👾',colossus:'🏛',plague:'☠',origin:'🧫',boss5:'💀'};

function saveCurrentForm(){
  const p=game.player;
  if(p.ultimateActive&&typeof deactivateUltimate==='function'){
    deactivateUltimate();
  }
  const slot=game.forms[game.currentForm];
  if(slot){
    var b=p._evoStatBonus||{atk:0,def:0,maxHp:0};
    // 存"裸值"：hp/maxHp 减去 evo 加成（hp 允许负数表示残血）
    slot.hp=p.hp-(b.maxHp||0);
    slot.maxHp=Math.max(1,p.maxHp-(b.maxHp||0));
    slot.atk=Math.max(0,p.atk-(b.atk||0));
    slot.def=Math.max(0,p.def-(b.def||0));
    slot.traits=p.traits.slice();slot.name=p.name;slot.type=p.formType;
    slot.icon=formIcons[p.formType]||'❓';
    slot.color=monsterTemplates[p.formType]?monsterTemplates[p.formType].color:'#00ffd0';
  }
}
function loadForm(index){
  const slot=game.forms[index];if(!slot)return false;
  const p=game.player;
  var b=p._evoStatBonus||{atk:0,def:0,maxHp:0};
  p.maxHp=slot.maxHp+(b.maxHp||0);
  p.hp=Math.max(0,Math.min(p.maxHp,slot.hp+(b.maxHp||0)));
  p.atk=slot.atk+(b.atk||0);p.def=slot.def+(b.def||0);
  p.traits=(slot.traits||[]).slice();p.name=slot.name;p.formType=slot.type;
  game.currentForm=index;
  return true;
}
function switchForm(index){
  if(index<0 || index>=game.forms.length){addMsg('无效形态');return;}
  if(game._sigFlags.noSwitch){addMsg('形态锁定: 本层无法切换');return;}
  if(game._loneWolf){addMsg('孤狼模式：无法切换形态');return;}
  if(game._deadForms[index]){addMsg('该形态已陨落，无法切换或重新承载');return;}
  if(game.target){combatSwitchForm(index);return;}
  if(game.formCooldown>0){addMsg('形态切换冷却中('+Math.ceil(game.formCooldown/1000)+'s)');return;}
  if(index===game.currentForm)return;
  if(!game.forms[index]){addMsg('空槽位');return;}
  // 在 saveCurrentForm/loadForm 切换 traits 之前，捕获旧形态的「忠诚」回血量
  var _hsValOld=(typeof getTraitValue==='function')?getTraitValue('healOnSwitch'):0;
  // 自动消耗「忠诚守护」主动技能（无需手动激活，切换即触发）
  if(!(game._skillEffects&&game._skillEffects.switchFullHeal)&&game.activeSkills){
    for(var _si=0;_si<game.activeSkills.length;_si++){
      if(game.activeSkills[_si].effectId==='switchFullHeal'&&game.activeSkills[_si].uses>0){
        game.activeSkills[_si].uses--;
        if(!game._skillEffects)game._skillEffects={};
        game._skillEffects.switchFullHeal=true;
        if(game.activeSkills[_si].uses<=0)game.activeSkills.splice(_si,1);
        break;
      }
    }
  }
  saveCurrentForm();
  if(loadForm(index)){
    if(game._skillEffects&&game._skillEffects.switchFullHeal){game._skillEffects.switchFullHeal=false;game.player.hp=game.player.maxHp;addMsg('🐕 忠诚守护 — 满血');}
    // 忠诚 trait：旧形态或新形态任一拥有「忠诚」即触发
    var _hsVal=Math.max(_hsValOld,getTraitValue('healOnSwitch'));
    if(_hsVal){var _hsHeal=Math.floor(game.player.maxHp*_hsVal);if(_hsHeal>0&&game.player.hp<game.player.maxHp){game.player.hp=Math.min(game.player.maxHp,game.player.hp+_hsHeal);addMsg('🐕 忠诚: 切换形态 +'+_hsHeal+'HP');}}
    resetCombo(true);
    try{sounds.formSwap();}catch(e){}
    var _cSwP=game.player._cardSwitchPolPenalty||0;
    if(_cSwP>0){game.player.pollution=Math.min(100,game.player.pollution+_cSwP);addMsg('🌀 共鸣核心代价: 污染+'+_cSwP);}
    startFormCooldown(10000);
    addMsg('切换为 '+game.player.name);
    render();updateFormBar();
  }
}
function combatSwitchForm(index){
  if(!game.target)return;
  if(game._deathChoiceActive)return;
  if(game._sigFlags.noSwitch){addMsg('形态锁定: 本层无法切换');return;}
  if(game._loneWolf){addMsg('孤狼模式：无法切换');return;}
  if(game._deadForms[index]){addMsg('该形态已阵亡');return;}
  if(game.formCooldown>0){addMsg('形态切换冷却中');return;}
  if(index===game.currentForm)return;
  if(!game.forms[index]){addMsg('空槽位');return;}
  // 在切 traits 之前先捕获旧形态的「忠诚」
  var _hsValOld2=(typeof getTraitValue==='function')?getTraitValue('healOnSwitch'):0;
  // 自动消耗「忠诚守护」主动技能（无需手动激活）
  if(!(game._skillEffects&&game._skillEffects.switchFullHeal)&&game.activeSkills){
    for(var _si2=0;_si2<game.activeSkills.length;_si2++){
      if(game.activeSkills[_si2].effectId==='switchFullHeal'&&game.activeSkills[_si2].uses>0){
        game.activeSkills[_si2].uses--;
        if(!game._skillEffects)game._skillEffects={};
        game._skillEffects.switchFullHeal=true;
        if(game.activeSkills[_si2].uses<=0)game.activeSkills.splice(_si2,1);
        break;
      }
    }
  }
  saveCurrentForm();
  if(!loadForm(index))return;
  resetCombo(true);
  try{sounds.formSwap();}catch(e){}
  var _cSwP=game.player._cardSwitchPolPenalty||0;
  if(_cSwP>0){game.player.pollution=Math.min(100,game.player.pollution+_cSwP);addMsg('🌀 共鸣核心代价: 污染+'+_cSwP);}
  game._revived=false;
  game._combatSaved=false;
  var _switchFullHealPending=!!(game._skillEffects&&game._skillEffects.switchFullHeal);
  game._skillEffects={};
  startFormCooldown(10000);
  game._switchCount=(game._switchCount||0)+1;
  if(game._switchCount>=3)unlockAchievement('switch3');
  if(!game._combatRound)game._combatRound=0;
  if(!game._combatTotalDmg)game._combatTotalDmg=0;
  if(!game.target){addMsg('无目标');return;}
  game._combatRound++;
  const p=game.player,m=game.target,round=game._combatRound;
  const log=document.getElementById('combat-log');
  let mDmg=Math.max(1,m.atk-p.def);
  mDmg=Math.floor(mDmg*0.7);
  mDmg=titanArmorAbsorb(mDmg);
  mDmg=swarmTakeDamage(mDmg);
  p.hp-=mDmg;game._combatTotalDmg+=mDmg;
  if(log)log.innerHTML+='<div style="margin:2px 0;padding:3px;background:rgba(0,255,208,0.1);border-left:2px solid #00ffd0"><b>R'+round+'</b> 🔄 换形 <span style="color:#00ffd0">'+p.name+'</span> 敌→<span style="color:#88f">'+mDmg+'</span>(保护)</div>';
  addMsg('切换为 '+p.name+'！受到'+mDmg+'伤害');
  // 「忠诚守护」回满血放在伤害后，避免立刻被打回去
  if(_switchFullHealPending){p.hp=p.maxHp;addMsg('🐕 忠诚守护 — 回满血');if(log)log.innerHTML+='<div style="color:#00ffd0;font-size:10px">🐕 忠诚守护 — 回满血</div>';}
  var _hsVal=Math.max(_hsValOld2,getTraitValue('healOnSwitch'));
  if(_hsVal){var _hsHeal=Math.floor(p.maxHp*_hsVal);if(_hsHeal>0&&p.hp<p.maxHp){p.hp=Math.min(p.maxHp,p.hp+_hsHeal);addMsg('🐕 忠诚: 切换形态 +'+_hsHeal+'HP');}}
  if(p.hp<=0&&!game._combatSaved&&hasTraitEffect('revive')&&!game._revived){p.hp=Math.floor(p.maxHp*0.3);game._revived=true;game._combatSaved=true;if(log)log.innerHTML+='<div style="color:#ff0;font-weight:bold">【不死】复活！恢复30%HP</div>';}
  if(p.hp<0)p.hp=0;
  if(p.hp<=0){
    game._deathChoiceActive=true;game._autoFight=false;game._combatEnding=true;
    const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
    if(aliveBackups.length>0){try{sounds.death();}catch(e){}closeCombat();setTimeout(()=>{game._combatEnding=false;showDeathChoice();},500);return;}
    try{sounds.death();}catch(e){}addMsg('宿主死亡...');setTimeout(()=>{game._combatEnding=false;closeCombat();triggerDeath();},1200);return;
  }
  showCombat();render();updateFormBar();
}
function storeFormOnPossess(targetType,targetName){
  const p=game.player;
  let newSlot=-1;
  if(game.forms[game.currentForm]&&game.forms[game.currentForm].type===targetType){
    newSlot=game.currentForm;
  }
  if(newSlot===-1){for(let i=0;i<game.forms.length;i++){if(game.forms[i]&&!game._deadForms[i]&&game.forms[i].type===targetType&&i!==game.currentForm){newSlot=i;break;}}}
  if(newSlot===-1){for(let i=0;i<game.forms.length;i++){if(!game.forms[i]&&!game._deadForms[i]){newSlot=i;break;}}}
  if(newSlot===-1){
    let _hasPickable=false;
    for(let i=0;i<game.forms.length;i++){if(game.forms[i]&&!game._deadForms[i]&&game.forms[i].type!=='human'&&i!==game.currentForm){_hasPickable=true;break;}}
    if(_hasPickable)return 'NEED_CHOOSE';
    if(game.forms[game.currentForm]&&game.forms[game.currentForm].type!=='human'){
      newSlot=game.currentForm;
    }
    if(newSlot===-1)return 'NO_SLOT';
  }
  const oldForm=game.forms[newSlot];
  // 记录被替换槽的旧裸值，供属性对比 UI 用（_oldAtk/_oldDef/_oldHp 的真正"旧值"应是被替换槽，不是当前形态）
  if(oldForm){
    var _bSnap=p._evoStatBonus||{atk:0,def:0,maxHp:0};
    game._lastReplacedSlot={
      idx:newSlot,
      atk:(oldForm.atk||0)+(_bSnap.atk||0),
      def:(oldForm.def||0)+(_bSnap.def||0),
      maxHp:(oldForm.maxHp||0)+(_bSnap.maxHp||0),
      name:oldForm.name||'',
      wasEmpty:false
    };
  }else{
    game._lastReplacedSlot={idx:newSlot,atk:0,def:0,maxHp:0,name:'空槽',wasEmpty:true};
  }
  // 此刻 p.* 是怪物原始裸值（possess 流程没加 evo 加成），slot 直接存即为"裸值"约定
  game.forms[newSlot]={
    name:p.name,type:p.formType,hp:p.hp,maxHp:p.maxHp,atk:p.atk,def:p.def,
    traits:p.traits.slice(),icon:formIcons[p.formType]||'❓',
    color:monsterTemplates[p.formType]?monsterTemplates[p.formType].color:'#00ffd0',
    affinityLevel:oldForm?oldForm.affinityLevel||0:0,
    possessionCount:(oldForm?oldForm.possessionCount||0:0)+1,
    totalKills:oldForm?oldForm.totalKills||0:0,
    totalDamageTaken:oldForm?oldForm.totalDamageTaken||0:0,
    totalTimeAlive:oldForm?oldForm.totalTimeAlive||0:0
  };
  game.currentForm=newSlot;
  // 给 player 加回 evo 加成，维持"player 含加成"不变量；
  // 否则下次 saveCurrentForm 会按裸值约定再减一次加成，loadForm 又加一次，导致幻影 +bonus
  var _b=p._evoStatBonus||{atk:0,def:0,maxHp:0};
  if(_b.maxHp){p.maxHp+=_b.maxHp;p.hp+=_b.maxHp;}
  if(_b.atk){p.atk+=_b.atk;}
  if(_b.def){p.def+=_b.def;}
  return 'OK';
}

function applyFormReplacement(slotIdx){
  const p=game.player;
  if(game._deadForms[slotIdx]){return false;}
  if(game.forms[slotIdx]&&game.forms[slotIdx].type==='human'){return false;}
  const oldForm=game.forms[slotIdx];
  // 记录被替换槽的旧裸值（含 evo 加成回补），供属性对比 UI 用
  if(oldForm){
    var _bSnap2=p._evoStatBonus||{atk:0,def:0,maxHp:0};
    game._lastReplacedSlot={
      idx:slotIdx,
      atk:(oldForm.atk||0)+(_bSnap2.atk||0),
      def:(oldForm.def||0)+(_bSnap2.def||0),
      maxHp:(oldForm.maxHp||0)+(_bSnap2.maxHp||0),
      name:oldForm.name||'',
      wasEmpty:false
    };
  }else{
    game._lastReplacedSlot={idx:slotIdx,atk:0,def:0,maxHp:0,name:'空槽',wasEmpty:true};
  }
  // 与 storeFormOnPossess 同理：p.* 是裸值，slot 直接存
  game.forms[slotIdx]={
    name:p.name,type:p.formType,hp:p.hp,maxHp:p.maxHp,atk:p.atk,def:p.def,
    traits:p.traits.slice(),icon:formIcons[p.formType]||'❓',
    color:monsterTemplates[p.formType]?monsterTemplates[p.formType].color:'#00ffd0',
    affinityLevel:0,
    possessionCount:1,
    totalKills:0,
    totalDamageTaken:0,
    totalTimeAlive:0
  };
  game.currentForm=slotIdx;
  var _b=p._evoStatBonus||{atk:0,def:0,maxHp:0};
  if(_b.maxHp){p.maxHp+=_b.maxHp;p.hp+=_b.maxHp;}
  if(_b.atk){p.atk+=_b.atk;}
  if(_b.def){p.def+=_b.def;}
  if(oldForm){addMsg('<span style="color:#888">　'+oldForm.name+' 形态已被遗忘</span>');}
  return true;
}

function showFormReplaceDialog(targetType,targetName,onPick){
  const overlay=document.getElementById('form-replace-overlay');
  if(!overlay)return;
  const p=game.player;
  const info=document.getElementById('fr-new-info');
  const traitsHtml=(p.traits||[]).slice(0,4).map(t=>'<span>'+t+'</span>').join('');
  info.innerHTML='<div class="fr-nf-name">🧬 新形态：'+targetName+'</div>'+
    '<div class="fr-nf-stats">HP '+p.hp+'/'+p.maxHp+' · ATK '+p.atk+' · DEF '+p.def+'</div>'+
    (traitsHtml?'<div class="fr-nf-traits">'+traitsHtml+'</div>':'');
  const list=document.getElementById('fr-slot-list');
  list.innerHTML='';
  for(let i=0;i<game.forms.length;i++){
    const f=game.forms[i];
    if(f&&f.type==='human')continue;
    const card=document.createElement('div');
    card.className='fr-slot-card';
    const isDead=!!game._deadForms[i];
    if(isDead||!f){
      card.className+=' dead';
      card.innerHTML='<div class="fr-slot-icon">'+(isDead?'💀':'—')+'</div><div class="fr-slot-name">'+(f?f.name:'空')+'</div>';
    }else{
      const evo=getFormEvoLevel(f.type);
      const evoBadge=evo>0?'<div class="fr-slot-evo" style="color:'+(evo===3?'#ffd700':evo===2?'#b455ff':'#00c8ff')+'">Lv.'+evo+'</div>':'';
      card.innerHTML='<div class="fr-slot-icon">'+(f.icon||'❓')+'</div>'+
        '<div class="fr-slot-name">'+f.name+'</div>'+
        '<div class="fr-slot-stats">ATK '+f.atk+' DEF '+f.def+'</div>'+
        evoBadge;
      card.onclick=function(){
        overlay.classList.remove('active');
        onPick(i);
      };
    }
    list.appendChild(card);
  }
  overlay.classList.add('active');
}

// ================================================================
// 形态羁绊系统
// ================================================================
function updateFormAffinity(formType,action,value){
  if(!formType||formType==='human')return;
  const p=game.player;
  if(!p.formAffinity[formType]){
    p.formAffinity[formType]={count:0,level:0,kills:0,damageTaken:0,timeAlive:0,firstFloor:game.floor};
  }
  const aff=p.formAffinity[formType];
  switch(action){
    case 'possess':
      aff.count++;
      if(aff.count>=5)aff.level=3;
      else if(aff.count>=3)aff.level=2;
      else if(aff.count>=2)aff.level=1;
      else aff.level=0;
      break;
    case 'kill':
      aff.kills+=value||1;
      break;
    case 'damage':
      aff.damageTaken+=value||0;
      break;
    case 'survive':
      aff.timeAlive+=value||1;
      break;
    case 'sacrifice':
      aff.count+=value||1;
      aff.level=3;
      break;
  }
  saveAffinityToStorage();
}

function getAffinityLevel(formType){
  if(!formType||formType==='human')return 0;
  const aff=game.player.formAffinity[formType];
  return aff?aff.level:0;
}

function getFormEvoLevel(formType){
  if(!formType||formType==='human')return 0;
  const aff=game.player.formAffinity&&game.player.formAffinity[formType];
  if(!aff)return 0;
  if(aff.count>=8&&(aff.kills||0)>=15)return 3;
  if(aff.count>=4&&(aff.kills||0)>=5)return 2;
  if(aff.count>=2)return 1;
  return 0;
}
const FORM_EVO_REQ=[
  {lv:1,name:'熟悉',count:2,kills:0,bonus:'+5% ATK'},
  {lv:2,name:'精通',count:4,kills:5,bonus:'+10% ATK'},
  {lv:3,name:'完全融合',count:8,kills:15,bonus:'+18% ATK'}
];
function showFormEvoRequirements(formType){
  if(!formType||formType==='human'){addMsg('人类形态无进化路径');return;}
  const aff=(game.player.formAffinity&&game.player.formAffinity[formType])||{count:0,kills:0};
  const cur=getFormEvoLevel(formType);
  const name=(monsterTemplates[formType]&&monsterTemplates[formType].name)||formType;
  let html='<div style="font-size:14px;font-weight:bold;color:#00ffd0;margin-bottom:8px">🧬 '+name+' · 当前 Lv.'+cur+'</div>';
  html+='<div style="font-size:12px;color:#bbb;margin-bottom:10px">附身次数 '+aff.count+' · 击杀数 '+(aff.kills||0)+'</div>';
  FORM_EVO_REQ.forEach(function(r){
    const done=cur>=r.lv;
    const cOk=aff.count>=r.count;
    const kOk=(aff.kills||0)>=r.kills;
    const color=done?'#ffd700':(cOk&&kOk?'#00ffd0':'#888');
    html+='<div style="border-left:2px solid '+color+';padding:4px 8px;margin:4px 0;color:'+color+'">'+
      'Lv.'+r.lv+' 『'+r.name+'』 '+r.bonus+
      '<div style="font-size:11px;color:#aaa">需附身 '+r.count+' 次 ('+Math.min(aff.count,r.count)+'/'+r.count+')'+
      (r.kills>0?'、击杀 '+r.kills+' 只 ('+Math.min(aff.kills||0,r.kills)+'/'+r.kills+')':'')+'</div></div>';
  });
  if(typeof showEventDialog==='function'){
    showEventDialog('形态进化条件',html,true);
  }else{
    alert('形态 '+name+' Lv.'+cur+'\n附身 '+aff.count+' · 击杀 '+(aff.kills||0));
  }
}

function getAffinityName(level){
  const names=['陌生','熟悉','挚友','共生'];
  return names[level]||'陌生';
}

function applyAffinityBonus(formType){
  if(!formType||formType==='human')return;
  const level=getAffinityLevel(formType);
  const p=game.player;
  if(level>=3){
    const skill=getAffinityPassiveSkill(p.playerClass);
    if(skill){
      p._affinityPassive=skill;
      addMsg('🔗 共生被动：'+skill.name);
    }
  }
}

function getAffinityPassiveSkill(playerClass){
  const skills={
    titan:{name:'记忆盾墙',effect:'blockCounter',value:0.3,desc:'格挡时反弹30%伤害'},
    ghost:{name:'虚空印记',effect:'backstabCooldown',value:0.5,desc:'背刺后瞬移冷却-50%'},
    swarm:{name:'牺牲增殖',effect:'swarmHeal',value:0.2,desc:'分身死亡时治疗本体20%'}
  };
  return skills[playerClass];
}

function triggerAffinityWhisper(formType){
  const aff=game.player.formAffinity[formType];
  if(!aff||aff.level<3)return;
  const whispers=[
    '"第'+aff.firstFloor+'层，你用我挡住了致命一击..."',
    '"我们一起击败了'+aff.kills+'个敌人..."',
    '"我感受到了你的恐惧...和决心..."',
    '"这条路，我们已经走过'+aff.count+'次了..."'
  ];
  const msg=whispers[Math.floor(Math.random()*whispers.length)];
  showAffinityWhisper(formType,msg);
}

function showAffinityWhisper(formType,message){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:20%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);border:1px solid #a4a;padding:12px 20px;border-radius:8px;color:#a4a;font-size:0.9em;z-index:400;animation:whisperFade 4s forwards;max-width:80%;text-align:center';
  const icon=getFormIcon(formType);
  overlay.innerHTML='<div style="margin-bottom:4px">🔗 '+icon+' 共生低语</div><div style="font-style:italic">'+message+'</div>';
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),4000);
}

function saveAffinityToStorage(){
  try{
    localStorage.setItem('pt_affinity',JSON.stringify(game.player.formAffinity));
  }catch(e){}
}

function loadAffinityFromStorage(){
  try{
    const data=localStorage.getItem('pt_affinity');
    if(data)game.player.formAffinity=JSON.parse(data);
  }catch(e){}
}

function showAffinityDetail(){
  const overlay=document.getElementById('affinity-detail-overlay');
  const content=document.getElementById('affinity-content');
  if(!overlay||!content)return;
  let html='';
  const aff=game.player.formAffinity;
  const types=Object.keys(aff);
  if(types.length===0){
    html='<div style="text-align:center;color:#666;padding:20px">尚未建立任何形态羁绊<br>附身怪物开始你的旅程</div>';
  }else{
    types.sort((a,b)=>aff[b].level-aff[a].level||aff[b].count-aff[a].count);
    for(const type of types){
      const data=aff[type];
      const tmpl=monsterTemplates[type];
      const name=tmpl?tmpl.name:type;
      const icon=getFormIcon(type);
      const levelName=getAffinityName(data.level);
      const levelClass='level-'+data.level;
      html+='<div class="affinity-card '+levelClass+'">';
      html+='<div class="affinity-card-header">';
      html+='<div class="affinity-card-name">'+icon+' '+name+'</div>';
      html+='<div class="affinity-card-level '+levelClass+'">'+levelName+'</div>';
      html+='</div>';
      html+='<div class="affinity-card-stats">';
      html+='附身次数: <b>'+data.count+'</b> | 击杀: <b>'+data.kills+'</b><br>';
      html+='承受伤害: <b>'+data.damageTaken+'</b> | 存活楼层: <b>'+data.timeAlive+'</b><br>';
      html+='首次附身: <b>第'+data.firstFloor+'层</b>';
      html+='</div>';
      if(data.level>=1){
        html+='<div style="margin-top:6px;padding:6px;background:rgba(0,255,208,0.05);border-left:2px solid #00ffd0;font-size:0.85em">';
        html+='✓ HP+10%';
        if(data.level>=2){
          const skill=getAffinityPassiveSkill(game.player.playerClass);
          if(skill)html+=' | ✓ '+skill.name+'：'+skill.desc;
        }
        if(data.level>=3){
          html+=' | ✓ 共生低语';
        }
        html+='</div>';
      }
      html+='</div>';
    }
  }
  content.innerHTML=html;
  overlay.style.display='flex';
}

function closeAffinityDetail(){
  const overlay=document.getElementById('affinity-detail-overlay');
  if(overlay)overlay.style.display='none';
  _restoreHiddenByMenu();
}

function updateFormBar(){
  const _p=game.player;
  const formSig=game.forms.map((f,i)=>f?(f.type+'|'+(i===game.currentForm?_p.hp:f.hp)+'|'+(i===game.currentForm?_p.maxHp:f.maxHp)+'|'+(i===game.currentForm?1:0)+'|'+(game._deadForms[i]?1:0)):'_').join(',')+(game._loneWolf?'L':'')+(game.formCooldown>0?'C':'')+'|f'+(game._slotFragments||0);
  if(formSig===game._lastFormSig)return;
  game._lastFormSig=formSig;
  const container=document.querySelector('.form-slots');
  if(container){
    container.innerHTML='';
    for(let i=0;i<game.forms.length;i++){
      const el=document.createElement('div');
      el.id='fslot-'+i;
      const slot=game.forms[i];
      if(slot){
        let cls='fslot'+(i===game.currentForm?' active':' filled');
        if(game._deadForms[i]) cls+=' dead-form';
        if(game._loneWolf && i===game.currentForm) cls+=' lone-wolf-glow';
        el.className=cls;
        const affinityLevel=slot.affinityLevel||getAffinityLevel(slot.type)||0;
        const affinityDot=affinityLevel>0?'<div class="affinity-dot level-'+affinityLevel+'"></div>':'';
        if(game._deadForms[i]){
          var dataUrl=slot.type?getMonsterIconDataURL(slot.type):'';
          var imgSz=i===game.currentForm?32:22;
          var iconSrc=dataUrl?'<img src="'+dataUrl+'" style="width:'+imgSz+'px;height:'+imgSz+'px;opacity:0.4">':slot.icon;
          el.innerHTML=iconSrc+'<div style="position:absolute;top:-2px;right:-2px;font-size:9px;color:#ff006e;text-shadow:0 0 2px #000">⚱</div>'+affinityDot+'<div class="fslot-hp" style="background:#333;width:0%"></div>';
          el.title='⚱ '+slot.name+' 已永久陨落';
        }else{
          var dataUrl=slot.type?getMonsterIconDataURL(slot.type):'';
          var imgSz=i===game.currentForm?32:22;
          var iconSrc=dataUrl?'<img src="'+dataUrl+'" style="width:'+imgSz+'px;height:'+imgSz+'px">':slot.icon;
          var _bForm=_p._evoStatBonus||{atk:0,def:0,maxHp:0};
          var _bMax=_bForm.maxHp||0;
          // 非当前槽存的是"裸值"（saveCurrentForm 已减去加成），渲染时把加成加回，否则比例会被压扁
          var _slotHp=i===game.currentForm?_p.hp:Math.max(0,(slot.hp||0)+_bMax);
          var _slotMaxHp=i===game.currentForm?_p.maxHp:((slot.maxHp||1)+_bMax);
          // 防御：CSS .fslot-hp 同时设了 left:1px;right:1px，若 width 是 NaN/Infinity 浏览器会回退到 left/right 撑满 → 看起来"满血"
          var _ratio=(_slotMaxHp>0 && isFinite(_slotHp) && isFinite(_slotMaxHp))?(_slotHp/_slotMaxHp):0;
          if(_ratio<0)_ratio=0;else if(_ratio>1)_ratio=1;
          var _pct=(_ratio*100).toFixed(2);
          el.innerHTML=iconSrc+affinityDot+'<div class="fslot-hp" style="background:'+(_ratio>0.5?'#00ffd0':_ratio>0.3?'#ff0':'#ff006e')+';width:'+_pct+'%"></div>';
        }
      }else{
        el.className='fslot empty';
        el.innerHTML='?';
      }
      (function(idx){el.onclick=function(){switchForm(idx);};})(i);
      container.appendChild(el);
    }
  }
  const cur=game.forms[game.currentForm];
  if(!_fDom.barLabel)_fDom.barLabel=document.getElementById('form-bar-label');
  if(!_fDom.nameTop)_fDom.nameTop=document.getElementById('form-name-top');
  if(!_fDom.evoInfo)_fDom.evoInfo=document.getElementById('form-evo-info');
  if(!_fDom.cdText)_fDom.cdText=document.getElementById('form-cd-text');
  if(!_fDom.slotStatus)_fDom.slotStatus=document.getElementById('slot-status');
  if(_fDom.barLabel)_fDom.barLabel.textContent=cur?cur.name:'???';
  if(_fDom.nameTop)_fDom.nameTop.textContent=cur?cur.name:'???';
  if(_fDom.evoInfo){
    const pType=game.player.formType;
    if(pType&&pType!=='human'){
      const lv=getFormEvoLevel(pType);
      _fDom.evoInfo.textContent='Lv.'+lv+' ⓘ';
      _fDom.evoInfo.style.display='inline-block';
    }else{_fDom.evoInfo.style.display='none';}
  }
  if(_fDom.cdText)_fDom.cdText.textContent=game.formCooldown>0?Math.ceil(game.formCooldown/1000)+'s':'';
  if(_fDom.slotStatus){
    const aliveN=game.forms.filter((f,i)=>f&&!game._deadForms[i]).length;
    const deadN=game._deadForms?game._deadForms.filter(d=>d).length:0;
    const frag=game._slotFragments||0;
    let txt='活'+aliveN+'/'+game.forms.length;
    if(deadN>0)txt+=' <span style="color:#ff006e">💀'+deadN+'</span>';
    if(frag>0)txt+=' <span style="color:#ffd700">🧩'+frag+'/3</span>';
    _fDom.slotStatus.innerHTML=txt;
  }
}
let _formCdTimer=null;
function cleanupFormTimers(){if(_formCdTimer){clearInterval(_formCdTimer);_formCdTimer=null;}}
function startFormCooldown(ms){
  game.formCooldown=ms;
  if(!_formCdTimer){
    _formCdTimer=setInterval(()=>{
      if(game.formCooldown>0){game.formCooldown=Math.max(0,game.formCooldown-500);updateFormBar();}
      if(game.formCooldown<=0){clearInterval(_formCdTimer);_formCdTimer=null;}
    },500);
  }
}

// ================================================================
// 形态图鉴系统
// ================================================================
function showFormLibrary(){
  if(game.target)return;
  const overlay=document.getElementById('form-library-overlay');
  overlay.style.display='flex';
  const possessed=game.player.possessed;
  const allTypes=Object.keys(monsterTemplates);
  const knownCount=Object.keys(possessed).length;
  document.getElementById('form-lib-summary').textContent=
    '已解析: '+knownCount+'/'+allTypes.length+' 种形态';
  const zoneNames={1:'实验区(1-10层)',2:'培育区(11-20层)',3:'污染区(21-30层)',4:'深渊区(31-40层)',5:'终极区(41层+)'};
  let html='';
  for(let z=1;z<=5;z++){
    const zoneMonsters=allTypes.filter(k=>monsterTemplates[k].zone===z);
    if(zoneMonsters.length===0)continue;
    html+='<div style="margin:8px 0 4px;color:#888;font-size:.8em;border-bottom:1px solid #333;padding-bottom:4px">'+zoneNames[z]+'</div>';
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">';
    zoneMonsters.forEach(type=>{
      const t=monsterTemplates[type];
      const known=possessed[type];
      const _iu=getMonsterIconDataURL(type);
      const icon=_iu?'<img src="'+_iu+'" style="width:24px;height:24px;border-radius:3px;vertical-align:middle">':(formIcons[type]||'❓');
      if(known){
        html+='<div style="background:rgba(255,255,255,0.03);padding:6px;border-radius:4px;border:1px solid '+t.color+'">';
        html+='<div style="font-size:1.1em;display:flex;align-items:center;gap:4px">'+icon+' <b style="color:'+t.color+'">'+t.name+'</b></div>';
        html+='<div style="font-size:.75em;color:#aaa">HP:'+t.maxHp+' ATK:'+t.atk+' DEF:'+t.def+'</div>';
        html+='<div style="font-size:.7em;color:#888;margin-top:2px">'+t.traits.join(' ')+'</div>';
        html+='</div>';
      }else{
        html+='<div style="background:rgba(0,0,0,0.3);padding:6px;border-radius:4px;border:1px dashed #333;opacity:0.5">';
        html+='<div style="font-size:1.1em;color:#555;display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:24px;height:24px;background:#222;border-radius:3px"></span> ???</div>';
        html+='<div style="font-size:.75em;color:#444">未解析</div>';
        html+='</div>';
      }
    });
    html+='</div>';
  }
  document.getElementById('form-lib-content').innerHTML=html;
}
function closeFormLibrary(){
  document.getElementById('form-library-overlay').style.display='none';
  _restoreHiddenByMenu();
}
