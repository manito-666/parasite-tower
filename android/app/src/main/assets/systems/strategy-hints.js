// ================================================================
// 策略提示系统（低频精准 + 分层）
// 触发钩子：StrategyHints.check(eventName)
// ================================================================
var StrategyHints=(function(){
  var COOLDOWN=90*1000;
  var lastShownAt=0;
  var shownThisRun={};

  var HINTS=[
    {id:'low_hp_shop',tier:'basic',events:['floor:change','combat:end','move'],
      cond:function(){
        var p=game.player;
        if(game.target||p.hp<=0||p.hp>=p.maxHp*0.35)return false;
        if(_overlayOpen('shop-overlay')||_overlayOpen('event-overlay'))return false;
        var bought=(game._shopBuyCount&&game._shopBuyCount.heal)||0;
        var cost=Math.floor(150*Math.pow(1.3,bought));
        if(p.evoPoints<cost)return false;
        this._curCost=cost;
        return true;
      },
      text:'❤️ HP不足！商店有 生命药水',
      action:{label:'去商店',fn:function(){try{if(typeof showShop==='function')showShop();}catch(e){}}}},
    {id:'low_hp',tier:'basic',events:['floor:change','combat:end','move'],
      cond:function(){var p=game.player;return !game.target&&p.hp>0&&p.hp<p.maxHp*0.3;},
      text:'❤️ HP不足30%——附身满血怪物可整体回血'},
    {id:'high_pollution',tier:'basic',events:['pollution:tick','floor:change'],
      cond:function(){return game.player.pollution>=50&&game.player.pollution<70;},
      text:'☢️ 污染≥50%——点击顶部☣图标可使用血祭恢复技能次数'},
    {id:'pollution_critical',tier:'advanced',events:['pollution:tick','floor:change'],
      cond:function(){return game.player.pollution>=85;},
      text:'⚠️ 污染接近崩溃——商店净化需800EP，提前准备'},
    {id:'no_possess_3floors',tier:'basic',events:['floor:change'],
      cond:function(){
        if(!game._floorsWithoutPossess)game._floorsWithoutPossess=0;
        return game._floorsWithoutPossess>=3;
      },
      text:'🧬 已3层未附身——不同形态有专属特性，试试附身怪物'},
    {id:'evo_available',tier:'advanced',events:['combat:end','floor:change','evo:available'],
      cond:function(){
        var p=game.player;
        if(!p.playerClass||!evolutionPaths[p.playerClass])return false;
        var lv=p.evolution[p.playerClass]||0;
        if(lv>=5)return false;
        var node=evolutionPaths[p.playerClass][lv];
        return node&&p.evoPoints>=(node.cost||0);
      },
      text:'⚡ 进化点已足够',
      action:{label:'去进化',fn:function(){try{if(typeof showEvolutionPath==='function')showEvolutionPath(game.player.playerClass);}catch(e){}}}},
    {id:'elite_warning',tier:'advanced',events:['floor:change'],
      cond:function(){return game.monsters&&game.monsters.some(function(m){return m.hp>0&&m.elite;});},
      text:'👹 本层有精英怪——建议先清杂兵升级再挑战'},
    {id:'slot_full_dead',tier:'advanced',events:['floor:change','combat:end'],
      cond:function(){
        if(!game.forms||game.forms.length<3)return false;
        var allFilled=game.forms.every(function(f){return f;});
        var hasDead=game._deadForms&&game._deadForms.some(function(d){return d;});
        return allFilled&&hasDead;
      },
      text:'💀 已死亡的形态槽无法切换/附身'},
    {id:'wall_bump_3',tier:'basic',events:['wall_bump'],
      cond:function(){
        if(!game._wallBumpThisFloor)game._wallBumpThisFloor=0;
        game._wallBumpThisFloor++;
        return game._wallBumpThisFloor>=3;
      },
      text:'🧱 撞墙无效——仅可走入空地（深色为墙）'}
  ];

  function eligible(h){
    if(shownThisRun[h.id])return false;
    try{if(localStorage.getItem('pt_hint_dismissed_'+h.id))return false;}catch(e){}
    var rc=1;try{rc=parseInt(localStorage.getItem('pt_run_count')||'1',10);}catch(e){}
    if(h.tier==='basic'&&rc>3)return false;
    return true;
  }

  function _overlayOpen(id){var el=document.getElementById(id);return !!(el&&(el.style.display==='flex'||el.style.display==='block'||el.classList.contains('active')));}

  function check(event){
    if(!game||!game.player)return;
    if(Date.now()-lastShownAt<COOLDOWN)return;
    for(var i=0;i<HINTS.length;i++){
      var h=HINTS[i];
      if(h.events.indexOf(event)<0)continue;
      if(!eligible(h))continue;
      var ok=false;try{ok=!!h.cond();}catch(e){}
      if(ok){show(h);return;}
    }
  }

  function show(h){
    shownThisRun[h.id]=true;
    lastShownAt=Date.now();
    var old=document.getElementById('strategy-hint-toast');
    if(old)old.remove();
    var box=document.createElement('div');
    box.id='strategy-hint-toast';
    box.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:14%;z-index:9990;background:linear-gradient(135deg,rgba(15,15,30,0.96),rgba(30,15,50,0.96));border:1px solid #b455ff;color:#e8d8ff;padding:8px 12px;border-radius:8px;font-size:12px;letter-spacing:0.3px;max-width:90vw;box-shadow:0 0 16px rgba(180,85,255,0.35);display:flex;align-items:center;gap:8px;flex-wrap:nowrap;animation:strategyHintIn 0.3s ease-out';
    var span=document.createElement('span');span.textContent=h.text;span.style.cssText='flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    box.appendChild(span);
    if(h.action&&typeof h.action.fn==='function'){
      var btn=document.createElement('span');
      btn.textContent=h.action.label||'→';
      btn.style.cssText='cursor:pointer;color:#35E0FF;font-size:11px;padding:3px 8px;border:1px solid #35E0FF;border-radius:4px;background:rgba(53,224,255,0.08);font-weight:bold;letter-spacing:0;white-space:nowrap;flex:0 0 auto;line-height:1.2';
      btn.onclick=function(){try{h.action.fn();}catch(e){}box.remove();};
      box.appendChild(btn);
    }
    var x=document.createElement('span');
    x.textContent='✕';x.title='不再提示';
    x.style.cssText='cursor:pointer;color:#888;font-size:11px;padding:0 4px;border:1px solid #444;border-radius:4px;flex:0 0 auto;line-height:1.2;white-space:nowrap';
    x.onclick=function(){
      try{localStorage.setItem('pt_hint_dismissed_'+h.id,'1');}catch(e){}
      box.remove();
    };
    box.appendChild(x);
    document.body.appendChild(box);
    setTimeout(function(){var b=document.getElementById('strategy-hint-toast');if(b===box)b.style.opacity='0';},5500);
    setTimeout(function(){if(box.parentNode)box.remove();},6000);
  }

  // 注入动画样式
  try{
    var s=document.createElement('style');
    s.textContent='@keyframes strategyHintIn{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}#strategy-hint-toast{transition:opacity 0.4s}';
    document.head.appendChild(s);
  }catch(e){}

  function reset(){shownThisRun={};lastShownAt=0;}

  return {check:check,reset:reset,_hints:HINTS};
})();
window.StrategyHints=StrategyHints;
