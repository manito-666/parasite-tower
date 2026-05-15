// ================================================================
// DLC 商店 + 商店购买
// ================================================================
var _dlcTab='classes';
function showDLCShop(tab){
  _dlcTab=tab||'classes';
  document.getElementById('dlc-shop-overlay').style.display='flex';
  renderDLCShop();
}
function closeDLCShop(){document.getElementById('dlc-shop-overlay').style.display='none';}
function renderDLCShop(){
  var tabs=document.getElementById('dlc-tabs');
  tabs.innerHTML='<button class="dlc-tab-btn'+(_dlcTab==='classes'?' active':'')+'" onclick="_dlcTab=\'classes\';renderDLCShop()">职业</button><button class="dlc-tab-btn'+(_dlcTab==='skins'?' active':'')+'" onclick="_dlcTab=\'skins\';renderDLCShop()">皮肤</button>';
  var ct=document.getElementById('dlc-content');
  if(_dlcTab==='classes')ct.innerHTML=_renderDLCClasses();
  else ct.innerHTML=_renderDLCSkins();
}
function _renderDLCClasses(){
  var h='';
  ['blood','mech'].forEach(function(cls){
    var cc=classColors[cls],desc=classDescriptions[cls],unlocked=isDLCUnlocked(cls);
    h+='<div class="dlc-card" style="border-color:'+cc.primary+'">';
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
    h+='<span style="font-size:28px">'+cc.icon+'</span>';
    h+='<div><div style="color:'+cc.primary+';font-weight:900;font-size:1.1em">'+cc.name+'</div>';
    h+='<div style="color:#666;font-size:.8em">'+desc.difficulty+' · '+desc.style+'</div></div>';
    h+='<div style="margin-left:auto;font-size:.75em;color:'+(unlocked?'#00ffd0':'#888')+'">'+( unlocked?'已解锁':'未解锁')+'</div></div>';
    h+='<div style="color:#999;font-size:.8em;font-style:italic;margin-bottom:8px">'+desc.quote+'</div>';
    desc.mechanics.forEach(function(m){h+='<div style="font-size:.75em;color:#aaa;padding:2px 0"><span style="color:'+cc.highlight+'">▶</span> '+m.name+' — '+m.desc+'</div>';});
    h+='<div style="margin-top:8px;font-size:.75em;color:#666">HP:'+classBaseStats[cls].hp+' ATK:'+classBaseStats[cls].atk+' DEF:'+classBaseStats[cls].def+'</div>';
    if(!unlocked)h+='<button class="dlc-unlock-btn" style="border-color:'+cc.primary+';color:'+cc.primary+'" onclick="unlockDLCClass(\''+cls+'\')">解锁 '+cc.name+'</button>';
    h+='</div>';
  });
  return h;
}
function _renderDLCSkins(){
  var h='',skins=getSkinData();
  ['titan','ghost','swarm','blood','mech'].forEach(function(cls){
    var cc=classColors[cls];
    if(!skinPalettes[cls])return;
    h+='<div style="margin-bottom:16px"><div style="color:'+cc.primary+';font-weight:bold;margin-bottom:6px">'+cc.icon+' '+cc.name+'</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    var isEquip=!skins.equipped[cls]||skins.equipped[cls]==='default';
    h+='<div class="skin-swatch'+(isEquip?' equipped':'')+'" style="background:'+cc.primary+'" onclick="equipSkinDLC(\''+cls+'\',\'default\')" title="默认"><span style="font-size:10px;color:#fff">默认</span></div>';
    Object.keys(skinPalettes[cls]).forEach(function(skinId){
      var skin=skinPalettes[cls][skinId];
      var owned=skins.owned.includes(cls+'_'+skinId);
      var equipped=skins.equipped[cls]===skinId;
      h+='<div class="skin-swatch'+(equipped?' equipped':'')+(owned?'':' locked')+'" style="background:'+skin.primary+'" onclick="'+(owned?'equipSkinDLC(\''+cls+'\',\''+skinId+'\')':'unlockDLCSkin(\''+cls+'\',\''+skinId+'\')')+'" title="'+skin.name+'">';
      h+='<span style="font-size:10px;color:#fff">'+skin.name+'</span>';
      if(!owned)h+='<span style="position:absolute;top:2px;right:2px;font-size:8px">🔒</span>';
      h+='</div>';
    });
    h+='</div></div>';
  });
  return h;
}
function unlockDLCClass(cls){setDLCUnlock(cls);renderDLCShop();addMsg('<span style="color:#ff8800;font-weight:bold">⭐ '+classColors[cls].name+' 已解锁！</span>');}
function unlockDLCSkin(cls,skinId){ownSkin(cls+'_'+skinId);renderDLCShop();}
function equipSkinDLC(cls,skinId){equipSkin(cls,skinId);renderDLCShop();}

function buyItem(index){
const item=shopItems[index],p=game.player;
if(!game._shopBuyCount)game._shopBuyCount={};
const buyKey=item.type;
const bought=game._shopBuyCount[buyKey]||0;
const actualCost=item.priceScale?Math.floor(item.cost*Math.pow(item.priceScale,bought)):item.cost;
if(p.evoPoints<actualCost||isShopItemDisabled(item))return;
if(item.maxBuy&&bought>=item.maxBuy){addMsg('已达购买上限');return;}
p.evoPoints-=actualCost;
if(item.priceScale||item.maxBuy)game._shopBuyCount[buyKey]=bought+1;
try{sounds.shop();}catch(e){}
switch(item.type){
case 'heal':p.hp=Math.min(p.maxHp,p.hp+Math.floor(p.maxHp*0.5));addMsg('恢复50%HP');break;
case 'atk':p.atk+=2;addMsg('ATK+2');break;
case 'def':p.def+=2;addMsg('DEF+2');break;
case 'maxhp':{const bonus=Math.max(10,Math.floor(p.maxHp*0.08));p.maxHp+=bonus;p.hp+=bonus;addMsg('MaxHP+'+bonus);}break;
case 'purify_small':p.pollution=Math.max(0,p.pollution-20);addMsg('污染-20');break;
case 'purify_full':p.pollution=0;addMsg('污染已清零');break;
case 'collapse_resist':p._collapseResist=true;addMsg('崩溃抵抗已激活（下次污染100时自动清醒）');break;
case 'death_revive':p._deathRevive=true;addMsg('死亡复活已激活（下次死亡保留形态）');break;
case 'form_slot':if(game.forms.length<4){game.forms.push(null);game._deadForms.push(false);addMsg('形态槽+1（当前'+game.forms.length+'/4）');updateFormBar();}else{addMsg('形态槽已达上限(4)');}break;
case 'form_lock':p._formLocked=game.currentForm;addMsg('当前形态已固化（死亡后保留1次）');break;
case 'human_enhance':
  if(!game._humanBonus)game._humanBonus={atk:0,def:0};
  game._humanBonus.atk+=5;game._humanBonus.def+=3;
  if(p.formType==='human'){p.atk+=5;p.def+=3;}
  addMsg('人类基础强化: ATK+5 DEF+3');break;
case 'map_scan':
  addMsg('地图扫描：出口位于 (10,6)');
  game._mapScanned=true;break;
case 'monster_scan':
  game.monsters.filter(m=>m.hp>0).forEach(m=>{
    addMsg('解析: '+m.name+' HP:'+m.hp+'/'+m.maxHp+' ATK:'+m.atk+' DEF:'+m.def);
  });
  break;
case 'regen_combat':
  p._regenCombat=(p._regenCombat||0)+0.03;
  addMsg('🧬 生物共生体激活！战斗中每回合恢复3%HP');break;
case 'full_heal':
  p.hp=p.maxHp;
  addMsg('🧬 菌膜修复！满血恢复');break;
case 'perm_regen':
  p._permRegen=(p._permRegen||0)+0.05;
  addMsg('🧬 寄生再生核植入！永久战斗回复5%HP/回合');break;
}
showShop();render();
if(game.target&&!game._combatEnding)showCombat();
}
