import re
import sys

with open('android/app/src/main/assets/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the exact range of the original attack() function
start_idx = content.find('function attack(){\nmarkDirty();\nif(!game.target||game.target.hp<=0)return;\nif(game._deathChoiceActive)return;')
if start_idx == -1:
    start_idx = content.find('function attack(){\nmarkDirty();')
if start_idx == -1:
    print("Error: Could not find start of old attack()")
    sys.exit(1)

# Find the start of function defend() which follows attack()
end_idx = content.find('function defend(){\nmarkDirty();', start_idx)
if end_idx == -1:
    print("Error: Could not find end of old attack() / start of defend()")
    sys.exit(1)

new_attack = """function attack(){
markDirty();
if(!game.target||game.target.hp<=0)return;
if(game._deathChoiceActive)return;
const p=game.player,m=game.target;
if(!game._combatRound)game._combatRound=0;
if(!game._combatTotalDmg)game._combatTotalDmg=0;
game._combatRound++;
const round=game._combatRound;

if(game._sigFlags.killPenalty){m.atk=Math.floor(m.atk*2);game._sigFlags.killPenalty=false;}

const log=document.getElementById('combat-log');
if(game._stiffnessTurns>0){
  game._stiffnessTurns--;
  if(log)log.innerHTML+='<div style="color:#0ff;font-weight:bold">【重组僵直】本回合无法行动，但免受伤害</div>';
  addMsg('重组僵直: 免疫1回合');
  showCombat();render();
  return;
}

if(game._playerStunned){
  game._playerStunned=false;
  if(log)log.innerHTML+='<div style="color:#48f;font-weight:bold">【眩晕】你被电击麻痹，无法行动！</div>';
  const mDmg = calcMonsterDamage(p,m,round);
  let stunDmg = titanArmorAbsorb(mDmg);
  p.hp-=stunDmg;game._combatTotalDmg+=stunDmg;
  if(log)log.innerHTML+='<div style="margin:2px 0;padding:3px;background:rgba(255,255,255,0.04)"><b>R'+round+'</b> <span style="color:#48f">眩晕!</span> 敌-><span style="color:#f44">'+stunDmg+'</span></div>';
  
  if(m._bleedApplied){
    const bleedDmg=Math.max(1,Math.floor(p.maxHp*0.05));
    p.hp-=bleedDmg;game._combatTotalDmg+=bleedDmg;
    if(log)log.innerHTML+='<div style="color:#f44;font-size:10px">🩸 撕裂流血 -'+bleedDmg+'</div>';
  }
  if(log)log.scrollTop=log.scrollHeight;
  addMsg('R'+round+': 眩晕! 敌→'+stunDmg);
  
  const res = handleCombatResult(log,p,m,round);
  if(res==='continue'){showCombat();render();}
  return;
}

if(round===1)logRoundStart(log,p,m);

const isFirstStrike=hasTraitEffect('firstStrike')&&round===1;
const {pDmg,isCrit,multiHit,backstabMult,swarmDmg} = calcPlayerDamage(p,m,round);

// Deal player damage
m.hp-=pDmg;
if(bossPhaseData[m.type])checkBossPhase(m);
try{sounds.hit();}catch(e){}

// Player visual effects
let roundLog='<div style="margin:2px 0;padding:3px;background:rgba(255,255,255,0.04)"><b>R'+round+'</b> 你-><span style="color:#4a4">'+pDmg+'</span>';
if(isCrit){
  roundLog+=' <span style="color:#f0f">暴击!</span>';
  showTraitEffect('💥 暴击!','#f0f');
  try{sounds.crit();}catch(e){}
  game._shakeFrames=4; // 暴击震屏效果
}
if(multiHit>1)showTraitEffect('⚡ 多重攻击×'+multiHit,'#ff0');
if(backstabMult>1)showTraitEffect('🗡️ 背刺×'+backstabMult,'#0ff');

// Post player attack hooks
const mirrorDmg=handleFloor5Combat(m,pDmg);
if(mirrorDmg>0){p.hp-=mirrorDmg;game._combatTotalDmg+=mirrorDmg;}
if(swarmDmg>0)m.hp-=swarmDmg;
if(m.hp<0)m.hp=0;

// Monster retaliation
let dmgTaken=0;
if(m.hp>0&&!isFirstStrike&&!p._voidWalker){
  const baseMDmg = calcMonsterDamage(p,m,round);
  dmgTaken = swarmTakeDamage(titanArmorAbsorb(baseMDmg));
  p.hp-=dmgTaken;
  game._combatTotalDmg+=dmgTaken;
  updateFormAffinity(p.formType,'damage',dmgTaken);
  swarmSplit(dmgTaken);
  roundLog+=' 敌-><span style="color:#f44">'+dmgTaken+'</span>';
  
  if((m.ability==='vampiric'||monsterHasTrait(m,'吸血'))&&dmgTaken>0){const vHeal=Math.floor(dmgTaken*0.3);m.hp=Math.min(m.maxHp,m.hp+vHeal);roundLog+=' <span style="color:#a4a">吸血+'+vHeal+'</span>';}
  if(monsterHasTrait(m,'反击')&&pDmg>0){const counterDmg=Math.max(1,Math.floor(pDmg*0.5));p.hp-=counterDmg;game._combatTotalDmg+=counterDmg;roundLog+=' <span style="color:#f80">反击-'+counterDmg+'</span>';}
  if(monsterHasTrait(m,'吸取')&&dmgTaken>0){const drainAmt=Math.max(1,Math.floor(dmgTaken*0.1));m.hp=Math.min(m.maxHp,m.hp+drainAmt);roundLog+=' <span style="color:#a4a">吸取+'+drainAmt+'</span>';}
  if(monsterHasTrait(m,'电击')&&dmgTaken>0&&Math.random()<0.15){game._playerStunned=true;roundLog+=' <span style="color:#48f">⚡眩晕!</span>';}
  if(monsterHasTrait(m,'撕裂')&&dmgTaken>0&&!m._bleedApplied){m._bleedApplied=true;roundLog+=' <span style="color:#f44">撕裂!</span>';}
  if(monsterHasTrait(m,'蛛网')&&Math.random()<0.2){game._webbed=true;roundLog+=' <span style="color:#888">蛛网缠绕!</span>';}

}else if(m.hp>0&&p._voidWalker){
  roundLog+=' <span style="color:#a4a">(虚空无敌)</span>';
}else if(m.hp>0&&isFirstStrike){
  roundLog+=' <span style="color:#ff0">(先手免伤)</span>';
  showTraitEffect('🛡️ 先手免伤','#ff0');
}

roundLog+=' | 敌HP:<span style="color:'+(m.hp/m.maxHp>0.5?'#0f4':m.hp/m.maxHp>0.2?'#ff0':'#f04')+'">'+m.hp+'</span></div>';
log.innerHTML+=roundLog;

// Combos and Floating Texts
if (game.target && game.target === m) {
    if(pDmg>0) spawnFloatingText(m.x*T+T/2,m.y*T, "-"+pDmg, isCrit?"#f0f":"#fff");
    if(dmgTaken>0) spawnFloatingText(p.x*T+T/2,p.y*T, "-"+dmgTaken, "#f44");
    game._comboCount = (game._comboCount || 0) + 1;
}

applyEndOfRoundEffects(log,p,m,round,pDmg,0,dmgTaken);

const res = handleCombatResult(log,p,m,round);
if(res==='continue'){
  addMsg('R'+round+': 你→'+pDmg+' 敌→'+dmgTaken+' 敌HP:'+m.hp+(game._comboCount>1?' ('+game._comboCount+'连击)':''));
  showCombat();
  render();
}
}
"""

new_content = content[:start_idx] + new_attack + content[end_idx:]

with open('android/app/src/main/assets/index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replaced attack() function: removed old {end_idx - start_idx} chars, inserted new slim orchestrator")
