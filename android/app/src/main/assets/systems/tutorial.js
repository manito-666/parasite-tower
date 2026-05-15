// ================================================================
// 新手引导 + 柔性教程 + 道具/怪物详情弹窗
// ================================================================
// 引导版本号：bump 这个值会清空所有"已显示"标记，让新引导能重新触发
var _TUTORIAL_VERSION='v3';
var _tutorialShown=(function(){
  try{
    var ver=localStorage.getItem('pt_tut_ver');
    if(ver!==_TUTORIAL_VERSION){localStorage.removeItem('pt_tut');localStorage.removeItem('pt_soft_hints');localStorage.setItem('pt_tut_ver',_TUTORIAL_VERSION);return {};}
    var s=localStorage.getItem('pt_tut');return s?JSON.parse(s):{};
  }catch(e){return {};}
})();
function _saveTutShown(){try{localStorage.setItem('pt_tut',JSON.stringify(_tutorialShown));}catch(e){}}
const _tutorialSteps=[
  // S0 觉醒
  {id:'move',     stage:0, title:'移动',     desc:'点击方向键或滑动', trigger:'move', required:true},
  {id:'attack',   stage:0, title:'攻击',     desc:'靠近怪物→自动战斗', trigger:'combat', required:true},
  // S1 寄生
  {id:'possess',  stage:1, title:'附身',     desc:'虚弱目标更易附身\n试试附身受伤的看门犬', target:'btn-possess-bottom', pos:'top', trigger:'firstKill', required:true},
  // S2 战术
  {id:'form',     stage:2, title:'形态切换', desc:'顶部形态栏可切换已获得形态', target:'fslot-0', pos:'bottom', trigger:'formUnlock'},
  {id:'defend',   stage:2, title:'防御',     desc:'防御=减半伤害+回少量HP\n面对强敌时善用', target:'btn-defend-bottom', pos:'top', trigger:'defendHint'},
  {id:'inspect',  stage:2, title:'查看怪物', desc:'长按地图怪物可查看属性', target:null, pos:'center', trigger:'inspect'},
  // S3 成长
  {id:'evolution',stage:3, title:'进化点',   desc:'菜单→进化 解锁更强能力', target:'btn-menu-icon', pos:'bottom', trigger:'evoHint'},
  {id:'ultimate', stage:3, title:'终极技能', desc:'右下技能球：危急时使用', target:'btn-ultimate', pos:'top', trigger:'ultReady'},
  // S4 系统
  {id:'shop',     stage:4, title:'商店',     desc:'菜单→商店 消耗EP买道具', target:'btn-menu-icon', pos:'bottom', trigger:'floorUnlock'},
  {id:'pollution',stage:4, title:'污染',     desc:'>80%异变 / 100%失控\n用净化道具压制', target:'pol-badge', pos:'bottom', trigger:'pollution'},
  {id:'signature',stage:4, title:'楼层签名', desc:'每层 modifier 影响战斗规则', target:null, pos:'center', trigger:'floorUnlock'}
];
// 阶段总结（升 stage 时调用，非弹窗）
const _stageSummary={
  1:'觉醒完成 ✓ 下一步：尝试附身宿主',
  2:'附身完成 ✓ 下一步：形态切换 / 防御',
  3:'战术完成 ✓ 下一步：进化点 / 终极技能',
  4:'成长完成 ✓ 全系统已开放（商店/签名/污染）'
};
function announceStageUp(s){
  if(_stageSummary[s]&&typeof addMsg==='function'){
    addMsg('<span style="color:#ffb340;font-weight:bold">'+_stageSummary[s]+'</span>');
  }
}
let _currentTutStep=null;
var _tutCheckPending=false;
var _tutLastShownAt=0;
function checkTutorial(triggerId){
  if(!game||game._tutorialDismissed)return;
  if(_currentTutStep)return;
  if(_tutCheckPending)return;
  var _now=Date.now();
  if(_now-_tutLastShownAt<2500){_tutCheckPending=true;setTimeout(function(){_tutCheckPending=false;checkTutorial(triggerId);},2500);return;}
  if(_isAnyOverlayOpen((triggerId==='combat'||triggerId==='defendHint')?'combat-overlay':null)){_tutCheckPending=true;setTimeout(function(){_tutCheckPending=false;checkTutorial(triggerId);},3000);return;}
  const stage=game._tutorialStage||0;
  for(const step of _tutorialSteps){
    if(_tutorialShown[step.id])continue;
    if(step.stage>stage)continue;
    if(step.trigger&&step.trigger!==triggerId)continue;
    if(step.trigger==='combat'&&!game.target)continue;
    showTutorial(step);
    return;
  }
}
function _isAnyOverlayOpen(excludeId){
  var ids=['combat-overlay','event-overlay','fragment-overlay','evolution-overlay','shop-overlay','death-overlay','collapse-overlay','story-overlay','ending-overlay','anchor-detail-overlay','negotiate-overlay'];
  for(var i=0;i<ids.length;i++){if(excludeId&&ids[i]===excludeId)continue;var el=document.getElementById(ids[i]);if(el&&(el.style.display==='flex'||el.classList.contains('active')))return true;}
  return false;
}
function showTutorial(step){
  _currentTutStep=step;
  _tutLastShownAt=Date.now();
  _tutorialShown[step.id]=true;
  _saveTutShown();
  var shownCount=Object.keys(_tutorialShown).length;
  var ov=document.getElementById('tutorial-overlay');
  var tip=document.getElementById('tutorial-tip');
  var hl=document.getElementById('tutorial-highlight');
  var arrow=document.getElementById('tutorial-arrow');
  var backdrop=document.getElementById('tutorial-backdrop');
  ov.classList.add('active');
  var _forced=!!step.required;
  if(backdrop){
    var _inCombat=!!game.target;
    if(_forced){
      backdrop.style.pointerEvents='none';
      backdrop.style.background='transparent';
    }else{
      backdrop.style.pointerEvents=(step.id==='possess'||step.id==='attack'||_inCombat)?'none':'auto';
      backdrop.style.background='';
    }
  }
  var _btnEl=tip.querySelector('.tut-btn');
  if(_btnEl)_btnEl.style.display=_forced?'none':'';
  tip.style.animation='none';void tip.offsetHeight;tip.style.animation='tutTipIn 0.4s ease-out';
  tip.querySelector('.tut-step').textContent='引导 '+shownCount+'/'+_tutorialSteps.length;
  tip.querySelector('.tut-title').textContent=step.title;
  tip.querySelector('.tut-desc').textContent=step.desc;
  arrow.style.display='none';
  if(step.target){
    var el=document.getElementById(step.target)||document.querySelector('.'+step.target);
    if(el){
      var r=el.getBoundingClientRect();
      hl.style.display='block';
      hl.style.left=(r.left-6)+'px';hl.style.top=(r.top-6)+'px';
      hl.style.width=(r.width+12)+'px';hl.style.height=(r.height+12)+'px';
      arrow.style.display='block';
      arrow.innerHTML='<svg width="32" height="32" viewBox="0 0 32 32"><path d="M16 4 L16 24 M8 16 L16 24 L24 16" stroke="#00ffd0" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
      if(step.pos==='top'||r.top>window.innerHeight*0.5){
        arrow.style.left=(r.left+r.width/2-16)+'px';
        arrow.style.top=(r.top-40)+'px';
        // 目标在屏幕下半（dock 区），弹窗定位到地图上 1/4 处，避免遮挡 dock 按钮
        var _tipTop=r.top>window.innerHeight*0.5?Math.max(20,window.innerHeight*0.18):Math.max(20,r.top-180);
        tip.style.left='50%';tip.style.top=_tipTop+'px';tip.style.transform='translateX(-50%)';tip.style.bottom='auto';tip.style.right='auto';
      }else{
        arrow.style.left=(r.left+r.width/2-16)+'px';
        arrow.style.top=(r.bottom+8)+'px';
        arrow.innerHTML='<svg width="32" height="32" viewBox="0 0 32 32"><path d="M16 28 L16 8 M8 16 L16 8 L24 16" stroke="#00ffd0" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
        tip.style.left='50%';tip.style.top=(r.bottom+48)+'px';tip.style.transform='translateX(-50%)';tip.style.bottom='auto';tip.style.right='auto';
      }
    }else{hl.style.display='none';tip.style.left='50%';tip.style.top='110px';tip.style.transform='translateX(-50%)';tip.style.bottom='auto';tip.style.right='auto';}
  }else{hl.style.display='none';tip.style.left='50%';tip.style.top='110px';tip.style.transform='translateX(-50%)';tip.style.bottom='auto';tip.style.right='auto';}
}
function dismissTutorial(fromAction){
  if(_currentTutStep&&_currentTutStep.required){
    if(!fromAction||fromAction!==_currentTutStep.id)return;
  }
  var ov=document.getElementById('tutorial-overlay');
  ov.classList.remove('active');
  var backdrop=document.getElementById('tutorial-backdrop');
  if(backdrop)backdrop.style.pointerEvents='auto';
  var tip=document.getElementById('tutorial-tip');
  tip.style.transform='';tip.style.left='';tip.style.top='';tip.style.bottom='';tip.style.right='';
  var hl=document.getElementById('tutorial-highlight');
  if(hl)hl.style.display='none';
  var arrow=document.getElementById('tutorial-arrow');
  if(arrow)arrow.style.display='none';
  _currentTutStep=null;
}

// === 柔性教程提示系统（Soft Hint）===
var _softHints=[
  {id:'hint_attack',stage:0,target:'.act-btn.fight',targetId:null,text:'点击攻击！',trigger:'attack'},
  {id:'hint_possess',stage:1,target:null,targetId:'btn-possess-bottom',text:'尝试附身获取能力！',trigger:'possess'},
  {id:'hint_defend',stage:2,target:null,targetId:'btn-defend-bottom',text:'防御可减半伤害',trigger:'defend'},
  {id:'hint_flee',stage:1,target:null,targetId:'btn-flee-bottom',text:'打不过？试试逃跑',trigger:'flee'}
];
var _activeSoftHint=null;
function _getSoftHintShown(){try{return JSON.parse(localStorage.getItem('pt_soft_hints')||'{}');}catch(e){return {};}}
function _setSoftHintShown(id){var d=_getSoftHintShown();d[id]=true;localStorage.setItem('pt_soft_hints',JSON.stringify(d));}
function checkSoftHint(){
  var shown=_getSoftHintShown();
  var stage=game._tutorialStage||0;
  for(var i=0;i<_softHints.length;i++){
    var h=_softHints[i];
    if(shown[h.id])continue;
    if(stage<h.stage)continue;
    var el=h.targetId?document.getElementById(h.targetId):(h.target?document.querySelector(h.target):null);
    if(!el||el.style.display==='none'||el.offsetParent===null)continue;
    showSoftHint(h,el);
    return;
  }
}
function showSoftHint(hint,el){
  dismissSoftHint();
  _activeSoftHint=hint;
  el.classList.add('soft-hint-target');
  var bubble=document.createElement('div');
  bubble.className='soft-hint-bubble';
  bubble.id='soft-hint-bubble';
  bubble.textContent=hint.text;
  document.body.appendChild(bubble);
  var rect=el.getBoundingClientRect();
  bubble.style.left=Math.max(8,Math.min(window.innerWidth-bubble.offsetWidth-8,rect.left+rect.width/2-bubble.offsetWidth/2))+'px';
  bubble.style.top=Math.max(8,rect.top-bubble.offsetHeight-10)+'px';
  setTimeout(function(){var b=document.getElementById('soft-hint-bubble');if(b&&_activeSoftHint&&_activeSoftHint.id===hint.id)b.remove();},6000);
}
function dismissSoftHint(trigger){
  if(_activeSoftHint){
    if(trigger&&_activeSoftHint.trigger===trigger)_setSoftHintShown(_activeSoftHint.id);
    var el=_activeSoftHint.targetId?document.getElementById(_activeSoftHint.targetId):(_activeSoftHint.target?document.querySelector(_activeSoftHint.target):null);
    if(el)el.classList.remove('soft-hint-target');
    _activeSoftHint=null;
  }
  var b=document.getElementById('soft-hint-bubble');
  if(b)b.remove();
}

// === 道具/怪物详情弹窗系统 ===
let _detailTimer=null;
function showDetailPopup(name,stats,traits,desc,x,y){
  const popup=document.getElementById('detail-popup');
  popup.querySelector('.dp-name').textContent=name;
  popup.querySelector('.dp-stats').innerHTML=stats;
  popup.querySelector('.dp-traits').innerHTML=(traits||[]).map(t=>'<span class="dp-trait">'+t+'</span>').join('');
  popup.querySelector('.dp-desc').textContent=desc||'';
  popup.classList.add('active');
  popup.style.left='50%';popup.style.top='35%';
  if(_detailTimer)clearTimeout(_detailTimer);
  _detailTimer=setTimeout(hideDetailPopup,4000);
}
function hideDetailPopup(){
  document.getElementById('detail-popup').classList.remove('active');
}
function showMonsterDetail(m,screenX,screenY){
  const tmpl=monsterTemplates[m.type];
  const zone=tmpl?tmpl.zone:1;
  const ai=m.ai||'unknown';
  const stats='HP: <b>'+m.hp+'/'+m.maxHp+'</b> | ATK: <b>'+m.atk+'</b> | DEF: <b>'+m.def+'</b><br>AI: <b>'+ai+'</b> | Zone: <b>T'+zone+'</b>';
  const traitDescs={'迅捷':'移速快','厚皮':'高防御','再生':'每回合恢复HP','狂暴':'半血ATK+50%','护甲':'前3回合DEF×2','吸血':'攻击回血','毒素':'击败后中毒','蛛网':'减速减伤害','电击':'几率眩晕','暴击':'高暴击率','反击':'反弹50%伤害','不死':'首次致死复活','恐惧':'降低ATK 10%','相位':'可穿墙','撕裂':'持续流血','多重攻击':'双倍攻击','伏击':'突袭先手','召唤':'呼叫援军','爆炸':'死亡自爆','腐蚀':'削弱DEF','吸取':'吸收生命','污染光环':'增加污染','再生+':'强效再生'};
  const desc=m.traits.map(t=>t+'：'+(traitDescs[t]||'特殊效果')).join('；');
  showDetailPopup(m.name,stats,m.traits,desc,screenX,screenY);
}
let _canvasLongPress=null;
var _canvasTapInited=false;
function initCanvasTap(){
  const c=document.getElementById('game-canvas');
  if(!c||_canvasTapInited)return;
  _canvasTapInited=true;
  let _touchStartPos=null;
  c.addEventListener('touchstart',function(e){
    const touch=e.touches[0];
    _touchStartPos={x:touch.clientX,y:touch.clientY,time:Date.now()};
    if(game.target)return;
    const rect=c.getBoundingClientRect();
    const scaleX=c.width/rect.width,scaleY=c.height/rect.height;
    const cx=(touch.clientX-rect.left)*scaleX,cy=(touch.clientY-rect.top)*scaleY;
    const T=c.width/13;
    const tileX=Math.floor(cx/T),tileY=Math.floor(cy/T);
    _canvasLongPress=setTimeout(()=>{
      const m=game.monsters.find(m=>m.hp>0&&m.x===tileX&&m.y===tileY);
      if(m){
        e.preventDefault();
        showMonsterDetail(m,touch.clientX,touch.clientY);
      }
      _canvasLongPress=null;
    },400);
  },{passive:false});
  c.addEventListener('touchend',function(e){
    if(_canvasLongPress){clearTimeout(_canvasLongPress);_canvasLongPress=null;}
    if(_touchStartPos&&!game.target){
      const touch=e.changedTouches[0];
      const dx=touch.clientX-_touchStartPos.x;
      const dy=touch.clientY-_touchStartPos.y;
      const dt=Date.now()-_touchStartPos.time;
      if(dt<500&&(Math.abs(dx)>30||Math.abs(dy)>30)){
        if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1,0);
        else move(0,dy>0?1:-1);
      }
    }
    _touchStartPos=null;
  });
  c.addEventListener('touchmove',function(){if(_canvasLongPress){clearTimeout(_canvasLongPress);_canvasLongPress=null;}});
  document.addEventListener('touchstart',function(e){
    if(!document.getElementById('detail-popup').classList.contains('active'))return;
    if(!e.target.closest('#detail-popup'))hideDetailPopup();
  });
}
