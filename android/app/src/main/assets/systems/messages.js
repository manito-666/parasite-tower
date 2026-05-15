// ================================================================
// 消息系统 + 战斗日志
// ================================================================
// === 消息系统 ===
// 战斗回合细节走 combat-log；底部 msg-panel 只收宏观提示
function _isCombatRoundMsg(m){
  if(typeof m!=='string')return false;
  // 匹配 "R1: ..." "R12: ..." 等回合日志，以及"重组僵直/眩晕中"等回合内提示
  return /^R\d+[:：]/.test(m)||/^R\d+\s/.test(m);
}
function addMsg(msg){
game.messages.push(msg);if(game.messages.length>50)game.messages.shift();
if(_isCombatRoundMsg(msg))return;
updateMessages();
}
function rebuildMessages(){
var el=document.getElementById('msg-panel');if(!el)return;
el.innerHTML='';
var msgs=(game.messages||[]).filter(function(m){return !_isCombatRoundMsg(m);});
var start=Math.max(0,msgs.length-10);
for(var i=start;i<msgs.length;i++){
  var m=msgs[i];
  var cls='msg-toast';
  if(m.includes('击败')||m.includes('受伤'))cls+=' msg-combat';
  else if(m.includes('附身')||m.includes('碎片'))cls+=' msg-special';
  else if(m.includes('获得')||m.includes('+'))cls+=' msg-loot';
  var t=document.createElement('div');t.className=cls;t.innerHTML=m;
  el.appendChild(t);
}
}
let _msgFadeTimer=null;
function updateMessages(){
const el=document.getElementById('msg-panel');
const last=game.messages[game.messages.length-1];
if(!last)return;
let cls='msg-toast';
if(last.includes('击败')||last.includes('受伤'))cls+=' msg-combat';
else if(last.includes('附身')||last.includes('碎片'))cls+=' msg-special';
else if(last.includes('获得')||last.includes('+'))cls+=' msg-loot';
const t=document.createElement('div');t.className=cls;t.innerHTML=last;
el.appendChild(t);
while(el.children.length>10)el.removeChild(el.firstChild);
el.scrollTop=el.scrollHeight;
}

// === 战斗日志系统 ===
const _battleLog=[];
var _battleLogTimer=null;
function addBattleLog(text,color){
  _battleLog.push({text:text,color:color||'#aaa',time:Date.now(),isNew:true});
  if(_battleLog.length>5)_battleLog.shift();
  updateBattleLog();
  // 4秒后淡出并清除
  if(_battleLogTimer)clearTimeout(_battleLogTimer);
  _battleLogTimer=setTimeout(()=>{
    clearBattleLog();_battleLogTimer=null;
  },4000);
}
function updateBattleLog(){
  const el=document.getElementById('battle-log-panel');
  if(!el)return;
  if(!el.classList.contains('visible'))el.classList.add('visible');
  el.innerHTML=_battleLog.map(e=>{
    const cls='blog-entry'+(e.isNew?' blog-new':'');
    e.isNew=false;
    return '<div class="'+cls+'" style="color:'+e.color+'">'+e.text+'</div>';
  }).join('');
  el.scrollTop=el.scrollHeight;
}
function clearBattleLog(){_battleLog.length=0;const el=document.getElementById('battle-log-panel');if(el){el.innerHTML='';el.classList.remove('visible');}}
