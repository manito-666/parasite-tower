// ================================================================
// 特性 Hook 注册表（行为与数据分离）
// ----------------------------------------------------------------
// traits.js 的 effects 表只保留数据（数值 + desc）。
// 此文件按 trait 名 + hookName 注册行为，runTraitPipeline 从这里读。
// 已支持 hook：
//   onTurnStart(ctx)        — ctx.self, ctx.log
//   onAtkCalc(ctx)          — ctx.self, ctx.target, ctx.atk, ctx.round, ctx.log → 可改 ctx.atk
//   onOpponentAtkCalc(ctx)  — ctx.atk, ctx.log → 可改 ctx.atk
//   onDeath(ctx)            — ctx.self, ctx.saved, ctx.log
//   onHitTaken(ctx)         — ctx.self, ctx.attacker, ctx.dmg, ctx.counter, ctx.log → 可改 ctx.dmg
//   onKill(ctx)             — ctx.self, ctx.victim, ctx.log
//   onPossessSuccess(ctx)   — ctx.self, ctx.target, ctx.log
// ================================================================
window.traitHookRegistry={};
function defineTraitHook(traitName,hookName,fn){
  if(!window.traitHookRegistry[traitName])window.traitHookRegistry[traitName]={};
  window.traitHookRegistry[traitName][hookName]=fn;
}

// === 现有 7 个迁移自 traits.js 内嵌 hooks ===
defineTraitHook('再生','onTurnStart',function(ctx){
  var r=Math.max(1,Math.floor(ctx.self.maxHp*0.03));
  ctx.self.hp=Math.min(ctx.self.maxHp,ctx.self.hp+r);
  ctx.log&&ctx.log.push('🌿 再生+'+r);
});
defineTraitHook('再生+','onTurnStart',function(ctx){
  var r=Math.max(1,Math.floor(ctx.self.maxHp*0.05));
  ctx.self.hp=Math.min(ctx.self.maxHp,ctx.self.hp+r);
  ctx.log&&ctx.log.push('🌿 再生+'+r);
});
defineTraitHook('狂暴','onAtkCalc',function(ctx){
  if(ctx.self.hp<ctx.self.maxHp*0.5){
    ctx.atk=Math.floor(ctx.atk*1.5);
    ctx.log&&ctx.log.push('💢 狂暴 ATK+50%');
  }
});
defineTraitHook('蓄力','onAtkCalc',function(ctx){
  if(ctx.round&&ctx.round%3===0){
    ctx.atk=Math.floor(ctx.atk*2);
    ctx.log&&ctx.log.push('⚡ 蓄力 ATK*2');
  }
});
defineTraitHook('恐惧','onOpponentAtkCalc',function(ctx){
  ctx.atk=Math.floor(ctx.atk*0.9);
  ctx.log&&ctx.log.push('👻 恐惧光环 敌ATK-10%');
});
defineTraitHook('不死','onDeath',function(ctx){
  if(ctx.self._revived||ctx.saved)return;
  ctx.self.hp=Math.max(1,Math.floor(ctx.self.maxHp*0.3));
  ctx.self._revived=true;
  ctx.saved=true;
  ctx.log&&ctx.log.push('💀 不死复活! +'+ctx.self.hp+'HP');
});
defineTraitHook('反击','onHitTaken',function(ctx){
  if(!ctx.attacker||ctx.dmg<=0)return;
  var c=Math.max(1,Math.floor(ctx.dmg*0.5));
  ctx.attacker.hp-=c;
  ctx.counter=(ctx.counter||0)+c;
  ctx.log&&ctx.log.push('反击-'+c);
});

// === 14 个新增 trait 行为 ===
// 适应：受伤后永久 +1DEF（上限 +5）
defineTraitHook('适应','onHitTaken',function(ctx){
  if(!ctx.self||ctx.dmg<=0)return;
  if(!ctx.self._adaptStack)ctx.self._adaptStack=0;
  if(ctx.self._adaptStack>=5)return;
  ctx.self._adaptStack++;
  ctx.self.def=(ctx.self.def||0)+1;
  if(ctx.self===game.player){
    if(!ctx.self._evoStatBonus)ctx.self._evoStatBonus={atk:0,def:0,maxHp:0};
    ctx.self._evoStatBonus.def+=1;
  }
  ctx.log&&ctx.log.push('🦎 适应 永久+1DEF('+ctx.self._adaptStack+'/5)');
});

// 结晶：首次受伤完全免伤
defineTraitHook('结晶','onHitTaken',function(ctx){
  if(!ctx.self||ctx.self._crystalUsed||ctx.dmg<=0)return;
  ctx.self._crystalUsed=true;
  ctx.dmg=0;
  ctx.log&&ctx.log.push('💎 结晶护盾 免伤!');
});

// 虚无：20% 闪避（受击 dmg 清零）
defineTraitHook('虚无','onHitTaken',function(ctx){
  if(ctx.dmg<=0)return;
  if(Math.random()<0.2){
    ctx.dmg=0;
    ctx.log&&ctx.log.push('👻 虚无 闪避!');
  }
});

// 棘刺：受击反弹 5 点
defineTraitHook('棘刺','onHitTaken',function(ctx){
  if(!ctx.attacker||ctx.dmg<=0)return;
  ctx.attacker.hp-=5;
  ctx.counter=(ctx.counter||0)+5;
  ctx.log&&ctx.log.push('🌵 棘刺反弹-5');
});

// 硬化：低于 20% HP 时 DEF 翻倍 → 通过 onOpponentAtkCalc 减伤
defineTraitHook('硬化','onOpponentAtkCalc',function(ctx){
  // ctx.self 是攻击者，ctx.target 是防御方（拥有此 trait 的一方）
  var def=ctx.target||ctx.defender;
  if(!def||def.hp>def.maxHp*0.2)return;
  var bonus=def.def||0;
  ctx.atk=Math.max(1,ctx.atk-bonus);
  ctx.log&&ctx.log.push('🪨 硬化 DEF×2 减伤'+bonus);
});

// 穿甲：忽略 50% DEF（在 onAtkCalc 阶段补偿）
defineTraitHook('穿甲','onAtkCalc',function(ctx){
  if(!ctx.target||!ctx.target.def)return;
  var penalty=Math.floor(ctx.target.def*0.5);
  ctx.atk+=penalty;
  ctx.log&&ctx.log.push('🗡️ 穿甲 +'+penalty);
});

// 噬魂：击杀回 20%MaxHP
defineTraitHook('噬魂','onKill',function(ctx){
  if(!ctx.self)return;
  var heal=Math.floor(ctx.self.maxHp*0.2);
  ctx.self.hp=Math.min(ctx.self.maxHp,ctx.self.hp+heal);
  ctx.log&&ctx.log.push('🫀 噬魂 +'+heal+'HP');
});

// 爆炸：死亡时对周围造成 30%MaxHP 伤害（设标志，combat.js 已读 deathDmg 数据键）
defineTraitHook('爆炸','onDeath',function(ctx){
  if(!ctx.self)return;
  var dmg=Math.floor(ctx.self.maxHp*0.3);
  ctx.self._deathBlast=dmg;
  ctx.log&&ctx.log.push('💥 死亡爆炸 '+dmg+'!');
});

// 分裂：死亡时分裂成 2 个弱体（设标志由地图刷怪系统消费）
defineTraitHook('分裂','onDeath',function(ctx){
  if(!ctx.self||ctx.self._splitDone)return;
  ctx.self._splitDone=true;
  ctx.self._splitOnDeath=true;
  ctx.log&&ctx.log.push('🧫 分裂!');
});

// 诅咒：附身后污染 +3 (走环境衰减)
defineTraitHook('诅咒','onPossessSuccess',function(ctx){
  if(!game||!game.player)return;
  var _cAdd=(typeof addEnvPollution==='function')?addEnvPollution(3,null):(game.player.pollution=Math.min(100,(game.player.pollution||0)+3),3);
  if(_cAdd>0)ctx.log&&ctx.log.push('🩸 诅咒 污染+'+_cAdd);
  try{addMsg('🩸 诅咒生效 污染+5');}catch(e){}
});

// 融合：附身时 ATK/DEF 额外 +10%（仅作用于当前形态，不写入 _evoStatBonus 避免滚雪球）
defineTraitHook('融合','onPossessSuccess',function(ctx){
  if(!ctx.self)return;
  var aBonus=Math.max(1,Math.floor(ctx.self.atk*0.1));
  var dBonus=Math.max(1,Math.floor((ctx.self.def||0)*0.1));
  ctx.self.atk+=aBonus;
  ctx.self.def=(ctx.self.def||0)+dBonus;
  try{addMsg('🧬 融合 ATK+'+aBonus+' DEF+'+dBonus);}catch(e){}
});

// 感染：附身后 10% 概率额外掠夺 +30EP（原"免行动"语义不适用于当前回合系统，改为可量化收益）
defineTraitHook('感染','onPossessSuccess',function(ctx){
  if(Math.random()<0.1){
    if(game&&game.player){game.player.evoPoints=(game.player.evoPoints||0)+30;}
    try{addMsg('🦠 感染发作 掠夺 +30EP!');}catch(e){}
    ctx.log&&ctx.log.push('🦠 感染 +30EP');
  }
});

// 共生：附身时保留 1 个旧特性（在 negotiate 处由数据键 symbiosis 触发，此处只记日志）
defineTraitHook('共生','onPossessSuccess',function(ctx){
  ctx.log&&ctx.log.push('🌿 共生');
});

// 瞬移：纯 UI 能力（teleport 数据键），无 hook 行为；保持空注册以便未来扩展
// （故意不注册）
