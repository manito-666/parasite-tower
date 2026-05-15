// ================================================================
// 污染技能树系统
// ================================================================
var POLL_SKILL_BURST=30,POLL_SKILL_RITE=50,POLL_SKILL_DEVOUR=70;
var POLL_PASSIVE_RESONANCE=50,POLL_PASSIVE_CORRODE=70,POLL_PASSIVE_DEATH=90;
var POLL_PHANTOM_MIN=31,POLL_PHANTOM_MAX=60,POLL_LIE_MIN=61,POLL_LIE_MAX=80,POLL_TELEPORT_MIN=81,POLL_COLLAPSE=100;
// 环境污染软衰减：玩家当前污染越高，被动污染加成越弱（让 70-80% 之后不再一脚撞 100）
// 用于走路、击杀残留、上层等"非玩家主动选择"的污染源；玩家主动事件（如凝视深渊）保持原值
function addEnvPollution(amount,msgPrefix){
  if(!game||!game.player||!amount)return 0;
  var p=game.player;var cur=p.pollution||0;
  var mult=1.0;
  if(cur>=80)mult=0.30;
  else if(cur>=70)mult=0.45;
  else if(cur>=55)mult=0.65;
  else if(cur>=40)mult=0.85;
  var raw=amount*mult;
  // 不强制最少 +1：高污染时小源会被衰减到 0，给玩家喘息空间
  var add=Math.floor(raw+Math.random()*0.5);  // 概率性向上取整保留期望值
  if(add<=0)return 0;
  p.pollution=Math.min(100,cur+add);
  if(msgPrefix&&typeof addMsg==='function')addMsg(msgPrefix+add);
  return add;
}
function updatePollutionSkills(){
  const pol=game.player.pollution;
  const ps=game.player.pollutionSkills;
  const was1=ps.pollBurst.unlocked,was2=ps.bloodRite.unlocked,was3=ps.devour.unlocked;
  _checkPollutionThreshold(pol);
  ps.pollBurst.unlocked=pol>=POLL_SKILL_BURST;
  ps.bloodRite.unlocked=pol>=POLL_SKILL_RITE;
  ps.devour.unlocked=pol>=POLL_SKILL_DEVOUR;
  if(!was1&&ps.pollBurst.unlocked)addMsg('☢️ <span style="color:#ff8800">污染技能解锁: 污染爆发</span> — 战斗中可用');
  if(!was2&&ps.bloodRite.unlocked)addMsg('☢️ <span style="color:#ff8800">污染技能解锁: 血祭</span> — 点击污染条查看');
  if(!was3&&ps.devour.unlocked)addMsg('☢️ <span style="color:#ff8800">污染技能解锁: 异化吞噬</span> — 战斗中可用');
}
function _checkPollutionThreshold(pol){
  if(!game._pollutionThresholds)game._pollutionThresholds={50:false,75:false,90:false};
  [50,75,90].forEach(function(n){
    if(pol>=n&&!game._pollutionThresholds[n]){
      game._pollutionThresholds[n]=true;
      try{sounds.pollutionWarn();}catch(e){}
      showPollutionThresholdAlert(n);
    }
  });
}
function showPollutionThresholdAlert(n){
  var root=document.createElement('div');
  root.style.cssText='position:fixed;inset:0;z-index:10003;pointer-events:none;border:0 solid rgba(255,0,110,0.85);box-shadow:inset 0 0 0 0 rgba(255,0,110,0.85),inset 0 0 80px rgba(255,0,110,0.25);opacity:0;transition:all 0.2s';
  var txt=document.createElement('div');
  txt.style.cssText='position:absolute;top:18%;left:50%;transform:translateX(-50%) scale(0.8);color:#ff006e;font-size:18px;font-weight:900;letter-spacing:3px;text-shadow:0 0 12px rgba(255,0,110,0.8);opacity:0;transition:all 0.25s';
  txt.textContent='☢ 污染临界 '+n+'%';
  root.appendChild(txt);document.body.appendChild(root);
  requestAnimationFrame(function(){root.style.opacity='1';root.style.boxShadow='inset 0 0 0 6px rgba(255,0,110,0.85),inset 0 0 120px rgba(255,0,110,0.35)';txt.style.opacity='1';txt.style.transform='translateX(-50%) scale(1)';});
  setTimeout(function(){root.style.opacity='0';txt.style.opacity='0';},700);
  setTimeout(function(){root.remove();},1000);
}

// === 污染主动技能 ===
function usePollBurst(){
  const ps=game.player.pollutionSkills;
  if(!ps.pollBurst.unlocked){addMsg('需要污染≥30%');return;}
  if(!game.target||game.target.hp<=0){addMsg('无战斗目标');return;}
  const p=game.player,m=game.target;
  const dmg=Math.floor(p.atk*1.5);
  m.hp-=dmg;
  p.pollution=Math.min(100,p.pollution+Math.max(1,8-(p._storyPollReduction||0)));
  addMsg('☢️ 污染爆发! -'+dmg+' (污染+8)');
  addBattleLog('☢️ 污染爆发 →'+dmg,'#ff8800');
  showTraitEffect('☢️ -'+dmg,'#ff8800');
  updatePollutionSkills();applyPollutionPassives();
  if(m.hp<=0){
    // 击杀走正常流程
    showCombat();
  }else{
    showCombat();
  }
  render();
}

function useBloodRite(){
  const ps=game.player.pollutionSkills;
  if(!ps.bloodRite.unlocked){addMsg('需要污染≥50%');return;}
  if(ps.bloodRite.used){addMsg('血祭本层已使用');return;}
  if(game.target){addMsg('战斗中无法使用血祭');return;}
  if(game.activeSkills.length===0){addMsg('没有可恢复的主动技能');return;}
  const p=game.player;
  const hpCost=Math.max(1,Math.floor(p.hp*0.2));
  p.hp=Math.max(1,p.hp-hpCost);
  p.pollution=Math.min(100,p.pollution+10);
  game.activeSkills.forEach(s=>{s.uses=s.maxUses;});
  ps.bloodRite.used=true;
  addMsg('🩸 血祭! HP-'+hpCost+' 所有技能次数已恢复 (污染+10)');
  updatePollutionSkills();applyPollutionPassives();
  game._fragDirty=true;markDirty();render();
  closePollutionSkillPanel();
}

function useDevour(){
  const ps=game.player.pollutionSkills;
  if(!ps.devour.unlocked){addMsg('需要污染≥70%');return;}
  if(ps.devour.used){addMsg('异化吞噬本层已使用');return;}
  if(!game.target||game.target.hp<=0){addMsg('无战斗目标');return;}
  const p=game.player,m=game.target;
  if(m.hp>=m.maxHp*0.3){addMsg('目标HP需低于30% (当前'+ Math.floor(m.hp/m.maxHp*100)+'%)');return;}
  const heal=m.hp;
  m.hp=0;
  p.hp=Math.min(p.maxHp,p.hp+heal);
  p.pollution=Math.min(100,p.pollution+15);
  ps.devour.used=true;
  addMsg('💀 异化吞噬! 击杀+回复'+heal+'HP (污染+15)');
  addBattleLog('💀 异化吞噬! +'+heal+'HP','#ff8800');
  showTraitEffect('💀 吞噬!','#ff006e');
  updatePollutionSkills();applyPollutionPassives();
  showCombat();render();
}

function applyPollutionPassives(){
  const pol=game.player.pollution;
  const pp=game.player.pollutionPassives;
  const was1=pp.resonance,was2=pp.corrodeBody,was3=pp.deathPulse;
  pp.resonance=pol>=POLL_PASSIVE_RESONANCE;
  pp.corrodeBody=pol>=POLL_PASSIVE_CORRODE;
  pp.deathPulse=pol>=POLL_PASSIVE_DEATH;
  if(!was1&&pp.resonance)addMsg('☢️ <span style="color:#ff8800">污染被动: 污染共鸣</span> — 15%概率额外伤害');
  if(!was2&&pp.corrodeBody)addMsg('☢️ <span style="color:#ff8800">污染被动: 腐蚀之体</span> — 10%概率免伤');
  if(!was3&&pp.deathPulse)addMsg('☢️ <span style="color:#ff8800">污染被动: 死亡脉冲</span> — 击杀回10%HP');
}

function showPollutionSkillPanel(){
  const overlay=document.getElementById('pollution-skill-overlay');
  if(!overlay)return;
  updatePollutionSkills();applyPollutionPassives();
  const pol=game.player.pollution;
  const ps=game.player.pollutionSkills;
  const pp=game.player.pollutionPassives;
  document.getElementById('psk-pollution').textContent=pol;
  // 隐藏旧锁定警告
  const lockWarning=document.getElementById('psk-lock-warning');
  if(lockWarning)lockWarning.style.display='none';

  const skills=[
    {name:'pollBurst',title:'污染爆发',icon:'☢️',threshold:30,desc:'对目标造成ATK×150%伤害',cost:'污染+8',scene:'战斗中',fn:'usePollBurst()',perFloor:false},
    {name:'bloodRite',title:'血祭',icon:'🩸',threshold:50,desc:'回满所有主动技能次数',cost:'HP-20%，污染+10',scene:'非战斗',fn:'useBloodRite()',perFloor:true},
    {name:'devour',title:'异化吞噬',icon:'💀',threshold:70,desc:'秒杀HP<30%的怪+回等量HP',cost:'污染+15',scene:'战斗中',fn:'useDevour()',perFloor:true}
  ];
  let activeHtml='';
  skills.forEach(s=>{
    const skill=ps[s.name];
    const unlocked=skill.unlocked;
    const used=skill.used;
    const inCombat=!!game.target;
    const isCombatSkill=s.scene==='战斗中';
    const canUse=unlocked&&!used&&(isCombatSkill?inCombat:!inCombat);
    const cardClass='psk-skill-card'+(unlocked?' unlocked':'');
    activeHtml+='<div class="'+cardClass+'">';
    activeHtml+='<div class="psk-skill-header"><div class="psk-skill-name">'+s.icon+' '+s.title+'</div><div class="psk-skill-cost">'+s.threshold+'%</div></div>';
    activeHtml+='<div class="psk-skill-desc">'+s.desc+'</div>';
    activeHtml+='<div style="font-size:0.8em;color:#888;margin:2px 0">代价: '+s.cost+' | '+s.scene+(s.perFloor?' | 每层1次':'')+'</div>';
    if(used)activeHtml+='<div style="font-size:0.8em;color:#f80;margin-bottom:4px">本层已使用</div>';
    const btnText=unlocked?(canUse?'使用':(used?'已使用':(isCombatSkill&&!inCombat?'战斗中可用':'探索中可用'))):'污染'+s.threshold+'%解锁';
    activeHtml+='<button class="psk-skill-btn" onclick="'+s.fn+'" '+(canUse?'':'disabled')+'>'+btnText+'</button>';
    activeHtml+='</div>';
  });
  document.getElementById('psk-active-skills').innerHTML=activeHtml;

  const passives=[
    {key:'resonance',title:'污染共鸣',threshold:'50%',desc:'攻击时15%概率额外造成=污染值的纯伤害',icon:'💥'},
    {key:'corrodeBody',title:'腐蚀之体',threshold:'70%',desc:'受伤时10%概率完全免疫本次伤害',icon:'🛡️'},
    {key:'deathPulse',title:'死亡脉冲',threshold:'90%',desc:'击杀怪物时回复10%MaxHP',icon:'💀'}
  ];
  let passiveHtml='';
  passives.forEach(p=>{
    const active=pp[p.key];
    const cardClass='psk-passive-card'+(active?' active':'');
    passiveHtml+='<div class="'+cardClass+'">';
    passiveHtml+='<div><div style="font-weight:700;margin-bottom:2px">'+p.icon+' '+p.title+' <span style="color:#888;font-size:0.85em">('+p.threshold+')</span></div>';
    passiveHtml+='<div style="font-size:0.85em;color:#888">'+p.desc+'</div></div>';
    passiveHtml+='<div style="font-size:0.9em;color:'+(active?'#00ffd0':'#555')+'">'+(active?'✓ 激活':'未激活')+'</div>';
    passiveHtml+='</div>';
  });
  document.getElementById('psk-passive-skills').innerHTML=passiveHtml;
  overlay.style.display='flex';
}

function closePollutionSkillPanel(){
  const overlay=document.getElementById('pollution-skill-overlay');
  if(overlay)overlay.style.display='none';
  _restoreHiddenByMenu();
}


// ================================================================
// 污染惩罚系统
// ================================================================
function applyPollutionEffects(){
  const pol=game.player.pollution;
  // 实时刷新污染被动和技能解锁
  updatePollutionSkills();
  applyPollutionPassives();

  // 31-60%: 生成幻觉怪物 (洞察特性可识破)
  // 只在幻觉不存在或污染区间变化时重新生成，避免每步闪烁
  const shouldHavePhantoms=pol>=POLL_PHANTOM_MIN&&pol<=POLL_PHANTOM_MAX&&!hasTraitEffect('seeTrue');
  if(!shouldHavePhantoms){
    game.phantoms=[];
  }else if(!game.phantoms||game.phantoms.length===0){
    game.phantoms=[];
    const count=Math.floor((pol-30)/15)+1; // 1-2个假怪物
    for(let i=0;i<count;i++){
      const px=2+Math.floor(Math.random()*9),py=2+Math.floor(Math.random()*9);
      if(px===game.player.x&&py===game.player.y)continue;
      const types=Object.keys(monsterTemplates);
      const t=types[Math.floor(Math.random()*types.length)];
      const tmpl=monsterTemplates[t];
      game.phantoms.push({name:tmpl.name,type:t,color:tmpl.color,x:px,y:py,phantom:true});
    }
    // 幽灵怪物出现音效
    if(game.phantoms.length>0){
      try{playFreqSweep(300,150,0.3);}catch(e){}
    }
  }

  // 61-80%: 属性显示欺骗(±20%)
  if(pol>=POLL_LIE_MIN&&pol<=POLL_LIE_MAX){
    const offset=0.2;
    game.statLieOffset={
      atk:Math.floor(game.player.atk*(Math.random()*offset*2-offset)),
      def:Math.floor(game.player.def*(Math.random()*offset*2-offset)),
      hp:Math.floor(game.player.hp*(Math.random()*offset*2-offset))
    };
  }else{
    game.statLieOffset={atk:0,def:0,hp:0};
  }

  // 81-99%: 每8步随机传送
  if(pol>=POLL_TELEPORT_MIN&&pol<POLL_COLLAPSE){
    if(!game._polStepCount)game._polStepCount=0;
    game._polStepCount++;
    if(game._polStepCount%8===0){
      // 距离楼梯2格内不传送，确保玩家能下楼
      const px=game.player.x,py=game.player.y;
      const nearStair=(Math.abs(px-10)+Math.abs(py-6)<=2)||(game.floor>1&&Math.abs(px-2)+Math.abs(py-6)<=2);
      if(!nearStair){
        let rx,ry,_rt=0;
        do{rx=2+Math.floor(Math.random()*9);ry=2+Math.floor(Math.random()*9);_rt++;}
        while(_rt<50&&(game.tiles[ry][rx]!==1||game.monsters.some(m=>m.hp>0&&m.x===rx&&m.y===ry)));
        game.player.x=rx;game.player.y=ry;
        addMsg('【错乱】空间扭曲，你被传送了！');
      }
    }
  }

  // 100%: 强制附身或死亡
  if(pol>=POLL_COLLAPSE){
    triggerPollutionCollapse();
  }
  if(window.StrategyHints)StrategyHints.check('pollution:tick');
}

function triggerPollutionCollapse(){
  if(game._collapseTimer){clearInterval(game._collapseTimer);game._collapseTimer=null;}
  const p=game.player;
  if(game._inCombat)closeCombat();

  // 播放崩溃音效
  try{
    initAudio();
    if(_audioContext){
      playFreqSweep(800,50,1.0);
      setTimeout(()=>playNoise(0.3),500);
      setTimeout(()=>playFreqSweep(100,1000,0.8),800);
    }
  }catch(e){}

  // 崩溃抵抗检查（商店购买的保险）
  if(p._collapseResist){
    p._collapseResist=false;
    p.pollution=50;
    addMsg('// 崩溃抵抗激活！污染回落至50% //');
    render();
    return;
  }

  const alive=game.monsters.filter(m=>m.hp>0);
  const overlay=document.getElementById('collapse-overlay');
  overlay.classList.add('active');

  // 生成选择卡
  const cardsEl=document.getElementById('collapse-cards');
  let cardsHtml='';
  if(alive.length>0){
    alive.sort((a,b)=>(Math.abs(a.x-p.x)+Math.abs(a.y-p.y))-(Math.abs(b.x-p.x)+Math.abs(b.y-p.y)));
    const target=alive[0];
    const hpRatio=target.maxHp>0?target.hp/target.maxHp:0.5;
    const hpFactor=1-hpRatio*0.6;
    const rate=Math.min(95,Math.max(1,Math.floor(0.4*hpFactor*100)));
    cardsHtml+=`<div class="collapse-card" onclick="collapseChoose('possess')" style="border-color:#8844ff">
      <div class="card-icon">${getFormIconLg(target.type,40)}</div>
      <div class="card-name">${target.name}</div>
      <div class="card-rate" style="color:#8844ff">${rate}%</div>
      <div style="font-size:10px;color:#888">强制附身</div>
    </div>`;
    game._collapseTarget=target;
  }
  cardsHtml+=`<div class="collapse-card" onclick="collapseChoose('endure')" style="border-color:#ff006e">
    <div class="card-icon">👤</div>
    <div class="card-name">坚持</div>
    <div class="card-rate" style="color:#ff006e">-70%HP</div>
    <div style="font-size:10px;color:#888">保持当前形态</div>
  </div>`;
  cardsEl.innerHTML=cardsHtml;

  // 净化选项（800EP清零）
  const purifyEl=document.getElementById('collapse-purify');
  if(p.evoPoints>=800){
    purifyEl.className='collapse-purify available';
    purifyEl.innerHTML='污染净化: 800EP → 污染归零 <br>[EP: '+p.evoPoints+']';
    purifyEl.onclick=function(){collapseChoose('purify');};
  }else{
    purifyEl.className='collapse-purify';
    purifyEl.innerHTML='净化需800EP [当前: '+p.evoPoints+'EP] ❌';
    purifyEl.onclick=null;
  }

  // 5秒倒计时
  let cd=5;
  const cdEl=document.getElementById('collapse-cd');
  cdEl.textContent=cd;
  game._collapseTimer=setInterval(()=>{
    cd--;
    cdEl.textContent=cd;
    if(cd<=0){
      clearInterval(game._collapseTimer);
      collapseChoose(alive.length>0?'possess':'endure');
    }
  },1000);
}

function collapseChoose(choice){
  if(game._collapseTimer)clearInterval(game._collapseTimer);
  const p=game.player;
  const overlay=document.getElementById('collapse-overlay');
  overlay.classList.remove('active');

  if(choice==='purify'){
    p.evoPoints-=800;
    p.pollution=0;
    addMsg('// 污染净化 // 污染归零 -800EP');
  }else if(choice==='possess'&&game._collapseTarget){
    const target=game._collapseTarget;
    addMsg('// 崩溃 // 强制附身: '+target.name);
    if(Math.random()<0.5){
      saveCurrentForm(); // 先保存当前形态再修改属性
      const hpR=target.hp/target.maxHp;
      const iF=hpR>=0.8?1.0:hpR>=0.4?0.8:0.6;
      p.maxHp=Math.floor(target.maxHp*iF);p.hp=Math.floor(target.hp*iF);
      p.atk=target.atk;p.def=target.def;p.traits=target.traits.slice();
      p.name=target.name;p.formType=target.type;
      p.possessed[target.id]=true;
      target.hp=0;
      p.pollution=30;
      var _fpRes=storeFormOnPossess(target.type,target.name);
      if(_fpRes==='NEED_CHOOSE'){
        // 污染崩溃时没空给玩家选，自动替换第一个非职业非当前的活槽
        var _autoSlot=-1;
        for(var _si=0;_si<game.forms.length;_si++){if(game.forms[_si]&&!game._deadForms[_si]&&_si!==game.currentForm&&game.forms[_si].type!=='human'){_autoSlot=_si;break;}}
        if(_autoSlot<0){for(var _si=0;_si<game.forms.length;_si++){if(game.forms[_si]&&!game._deadForms[_si]&&_si!==game.currentForm){_autoSlot=_si;break;}}}
        if(_autoSlot<0)_autoSlot=game.currentForm;
        applyFormReplacement(_autoSlot);
        addMsg('<span style="color:#888">　污染崩溃：自动遗忘旧形态</span>');
      }else if(_fpRes==='NO_SLOT'){
        // 所有寄生槽都死了，污染崩溃无处寄生 → 作为附身失败处理
        p.hp=Math.max(1,Math.floor(p.maxHp*0.3));
        p.pollution=80;
        addMsg('<span style="color:#ff006e">　污染崩溃：所有槽位已死，意识无处寄生！HP → 30%, 污染80%</span>');
        return;
      }
      addMsg('强制附身成功！污染 → 30');
    }else{
      p.hp=Math.max(1,Math.floor(p.maxHp*0.3));
      p.pollution=50;
      addMsg('强制附身失败！HP → 30%，污染 → 50');
    }
  }else{
    // endure
    p.hp=Math.max(1,Math.floor(p.maxHp*0.3));
    p.pollution=50;
    addMsg('// 坚持 // HP → 30%，污染 → 50');
  }
  game._collapseTarget=null;
  // 崩溃后如果HP<=0，触发死亡或转移
  if(p.hp<=0){
    p.hp=0;
    game._deathChoiceActive=true;game._autoFight=false;
    closeCombat();
    const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
    if(aliveBackups.length>0){
      showDeathChoice();
    }else{
      triggerDeath();
    }
    return;
  }
  render();
}

