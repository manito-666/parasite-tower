// ================================================================
// 存档系统
// ================================================================
function _saveKeyFor(modeId){return 'pt_save_'+(modeId||'classic');}
function _currentSaveKey(){return _saveKeyFor(window.GameRules&&GameRules.modeId);}
function _migrateLegacySave(){
  try{
    var legacy=localStorage.getItem('pt_save');if(!legacy)return;
    var d=JSON.parse(legacy);var mid=d&&(d.modeId||'classic');
    var key=_saveKeyFor(mid);
    if(!localStorage.getItem(key))localStorage.setItem(key,legacy);
    localStorage.removeItem('pt_save');
  }catch(e){try{localStorage.removeItem('pt_save');}catch(e2){}}
}
function saveGame(force){
  try{
    if(typeof game!=='undefined'&&game._runEnded)return; // 本局已结束，不再写存档
    if(!force&&game.target)return; // 战斗中不自动存档，但允许菜单强制保存
    if(window.ShortMode&&ShortMode._crashing)return;
    var _endOv=document.getElementById('ending-overlay');if(_endOv&&_endOv.classList.contains('active'))return;
    // 暂存含函数引用的字段（JSON.stringify会丢失函数）
    var _sigBackup=game._floorSignature;
    // 保存签名ID而非完整对象（函数不可序列化）
    game._floorSignature=game._floorSignature?{id:game._floorSignature.id}:null;
    const saveData={version:1,timestamp:Date.now(),game:JSON.parse(JSON.stringify(game)),modeId:window.GameRules?GameRules.modeId:'classic',shortRemaining:window.ShortMode?ShortMode._remaining:0};
    // 恢复原始引用
    game._floorSignature=_sigBackup;
    const g=saveData.game;
    g.target=null;g._deathChoiceActive=false;
    g._combatRound=0;g._combatTotalDmg=0;g._skillEffects={};g._attackRounds=0;g._consecutiveDefends=0;
    g._playerStunned=false;g._webbed=false;g._combatSaved=false;
    g._floorTimerInterval=null;
    localStorage.setItem(_currentSaveKey(),JSON.stringify(saveData));
  }catch(e){
    if(e.name==='QuotaExceededError'){
      try{localStorage.removeItem('parasiteTowerSave');localStorage.removeItem('pt_affinity');}catch(e2){}
      try{localStorage.setItem(_currentSaveKey(),JSON.stringify(saveData));}catch(e2){addMsg('存储空间已满！请清理数据');}
    }
  }
}
var _saveTimer=null;var _saveQueued=false;
var _saveGameReal=saveGame;
saveGame=function(force){if(force){_saveGameReal(true);return;}if(_saveTimer){_saveQueued=true;return;}_saveGameReal();_saveTimer=setTimeout(function(){_saveTimer=null;if(_saveQueued){_saveQueued=false;_saveGameReal();}},3000);};

function loadGame(modeId){
  try{
    _migrateLegacySave();
    var key=modeId?_saveKeyFor(modeId):_currentSaveKey();
    var raw=localStorage.getItem(key);
    if(!raw){
      // fallback：当前模式无存档时，尝试任意模式（向后兼容）
      raw=localStorage.getItem('pt_save_short')||localStorage.getItem('pt_save_classic')||localStorage.getItem('pt_save_expedition');
      if(!raw)return false;
    }
    var saveData;
    try{saveData=JSON.parse(raw);}catch(pe){localStorage.removeItem(key);return false;}
    if(!saveData.version||!saveData.game)return false;
    // 深拷贝覆盖game
    const saved=saveData.game;
    Object.keys(saved).forEach(k=>{game[k]=JSON.parse(JSON.stringify(saved[k]));});
    // 恢复模式
    if(saveData.modeId&&window.GameModes){
      GameModes.select(saveData.modeId);
      if(saveData.modeId==='short'&&window.ShortMode){
        ShortMode._remaining=saveData.shortRemaining||0;
        ShortMode._started=ShortMode._remaining>0;
        ShortMode._lastTickAt=Date.now();
        ShortMode.ensureTimerDom();
        ShortMode.updateTimerDom();
      }
      if(saveData.modeId==='expedition'&&window.ExpeditionMode){
        ExpeditionMode._startTime=saveData.timestamp||Date.now();
        ExpeditionMode._currentFormStart=Date.now();
        ExpeditionMode._possessCount=0;
        ExpeditionMode._maxPollution=(saved.player&&saved.player.pollution)||0;
      }
    }
    // 安全清理：确保战斗状态不残留
    game.target=null;
    game._deathChoiceActive=false;
    if(game._collapseTimer){clearInterval(game._collapseTimer);game._collapseTimer=null;}
        // 恢复楼层签名对象引用（存档只保存了ID，需从const恢复完整对象）
    if(game._floorSignature&&game._floorSignature.id){
      game._floorSignature=floorSignatures[game._floorSignature.id]||null;
    }else{game._floorSignature=null;}
    // 确保tiles有效（防止存档损坏导致卡死）
    if(!game.tiles||game.tiles.length<13||!game.tiles[6]||game.tiles[6].length<13){
      generateFloor();
    }
    if(!game.forms||!Array.isArray(game.forms))game.forms=[];
    if(!game._deadForms||!Array.isArray(game._deadForms))game._deadForms=[];
    while(game._deadForms.length<game.forms.length)game._deadForms.push(false);
    if(!game.passiveFragEffects||!Array.isArray(game.passiveFragEffects))game.passiveFragEffects=[];
    if(!game.skillFragments||!Array.isArray(game.skillFragments))game.skillFragments=[];
    if(!game.activeSkills||!Array.isArray(game.activeSkills))game.activeSkills=[];
    if(game.currentForm===undefined||game.currentForm===null)game.currentForm=0;
    var _pol=game.player&&typeof game.player.pollution==='number'?game.player.pollution:0;
    game._pollutionThresholds={50:_pol>=50,75:_pol>=75,90:_pol>=90};
    if(game.formCooldown===undefined||game.formCooldown===null||Array.isArray(game.formCooldown))game.formCooldown=0;
    if(!game.explored)game.explored={};
    if(!game.floorCleared)game.floorCleared={};
    if(!game.phantoms||!Array.isArray(game.phantoms))game.phantoms=[];
    if(!game.player.formAffinity)game.player.formAffinity={};
    if(!game.player.specialFloorState)game.player.specialFloorState={floor5Cleared:false,floor25Choice:null,floor50Ending:null};
    if(!game._sigFlags)game._sigFlags={};
    if(!game._floorSignatureMap)game._floorSignatureMap={};
    if(!game.statLieOffset)game.statLieOffset={atk:0,def:0,hp:0};
    if(!game._shopBuyCount)game._shopBuyCount={};
    if(!game.player.pollutionSkills||!game.player.pollutionSkills.pollBurst){
      game.player.pollutionSkills={
        pollBurst:{unlocked:false},
        bloodRite:{unlocked:false,used:false},
        devour:{unlocked:false,used:false}
      };
    }
    if(!game.player.pollutionPassives||game.player.pollutionPassives.doubleDamage!==undefined){
      game.player.pollutionPassives={resonance:false,corrodeBody:false,deathPulse:false};
    }
    if(!game.player.storyFlags)game.player.storyFlags={};
    if(!game._moveCountThisFloor)game._moveCountThisFloor=0;
    if(!game._floorsWithoutPossess)game._floorsWithoutPossess=0;
    if(!game._consecutiveDeaths)game._consecutiveDeaths=0;
    if(!game._stepCount)game._stepCount=0;
    if(!game._zoneStepCount)game._zoneStepCount=0;
    if(!game._waveCount)game._waveCount=0;
    if(!game.floorHistory)game.floorHistory={};
    // 旧存档兼容：第1层引导未完成时清除缓存，确保新手引导怪物生成
    if(game.floor===1&&game._tutorialStage<2&&game.floorHistory[1])delete game.floorHistory[1];
    if(game._deadForms.length>game.forms.length)game._deadForms=game._deadForms.slice(0,game.forms.length);
    // 存档版本迁移：校正 human 形态槽和锚点中的职业基础属性
    // 当 classBaseStats 被调整后，旧存档里的 human 槽和锚点仍为旧值，需同步
    if(typeof classBaseStats!=='undefined'&&game.player&&game.player.playerClass){
      var _migrBase=classBaseStats[game.player.playerClass];
      if(_migrBase){
        // 校正 forms 中所有 human 槽
        for(var _fi=0;_fi<game.forms.length;_fi++){
          var _fs=game.forms[_fi];
          if(_fs&&_fs.type==='human'){
            _fs.atk=_migrBase.atk;_fs.def=_migrBase.def;
            _fs.maxHp=_migrBase.maxHp;_fs.hp=Math.min(_fs.hp,_migrBase.maxHp);
          }
        }
        // 如果当前激活的形态是 human，同步 player
        if(game.forms[game.currentForm]&&game.forms[game.currentForm].type==='human'){
          game.player.atk=_migrBase.atk;game.player.def=_migrBase.def;
          game.player.maxHp=_migrBase.maxHp;game.player.hp=Math.min(game.player.hp,_migrBase.maxHp);
        }
        // 校正锚点中的数据
        if(game.anchor&&game.anchor.player){
          var _anc=game.anchor;
          if(_anc.player.formType==='human'||!_anc.player.formType){
            _anc.player.atk=_migrBase.atk;_anc.player.def=_migrBase.def;
            _anc.player.maxHp=_migrBase.maxHp;_anc.player.hp=Math.min(_anc.player.hp,_migrBase.maxHp);
          }
          if(_anc.forms){
            for(var _ai=0;_ai<_anc.forms.length;_ai++){
              if(_anc.forms[_ai]&&_anc.forms[_ai].type==='human'){
                _anc.forms[_ai].atk=_migrBase.atk;_anc.forms[_ai].def=_migrBase.def;
                _anc.forms[_ai].maxHp=_migrBase.maxHp;_anc.forms[_ai].hp=Math.min(_anc.forms[_ai].hp,_migrBase.maxHp);
              }
            }
          }
        }
      }
    }
    // 确保 forms 至少有 2 个槽（human + 1空槽给首次附身）
    if(game.forms.length<2){game.forms.push(null);game._deadForms.push(false);}
    // 确保下楼梯存在（必须有出路）
    if(game.tiles[6]&&game.tiles[6][10]!==2){game.tiles[6][10]=2;}
    // 确保上楼梯存在（2层以上）
    if(game.floor>1&&game.tiles[6]&&game.tiles[6][2]!==6){game.tiles[6][2]=6;}
    return true;
  }catch(e){return false;}
}
function deleteSave(modeId){
  if(modeId)localStorage.removeItem(_saveKeyFor(modeId));
  else{localStorage.removeItem(_currentSaveKey());localStorage.removeItem('pt_save');}
}
function endRunSave(modeId){
  // 标记本局结束：清除该模式存档 + 阻止后续 autosave 复活
  try{if(typeof game!=='undefined')game._runEnded=true;}catch(e){}
  var mid=modeId||(window.GameRules&&GameRules.modeId)||'classic';
  try{localStorage.removeItem(_saveKeyFor(mid));}catch(e){}
  try{localStorage.removeItem('pt_save');localStorage.removeItem('parasiteTowerSave');}catch(e){}
}
function clearAllGameData(){
  // 先阻断任何残留的 autosave 写回（runEnded + 取消防抖 timer）
  try{if(typeof game!=='undefined')game._runEnded=true;}catch(e){}
  try{if(_saveTimer){clearTimeout(_saveTimer);_saveTimer=null;}_saveQueued=false;}catch(e){}
  localStorage.removeItem('pt_save');
  localStorage.removeItem('pt_save_short');
  localStorage.removeItem('pt_save_classic');
  localStorage.removeItem('pt_save_expedition');
  localStorage.removeItem('parasiteTowerSave');
  localStorage.removeItem('pt_affinity');
  localStorage.removeItem('pt_endings');
  localStorage.removeItem('pt_achievements');
  localStorage.removeItem('parasiteTowerEndings');
}
function getSaveInfo(modeId){
  try{
    _migrateLegacySave();
    var key=modeId?_saveKeyFor(modeId):_currentSaveKey();
    var raw=localStorage.getItem(key);
    if(!raw&&!modeId){
      raw=localStorage.getItem('pt_save_short')||localStorage.getItem('pt_save_classic')||localStorage.getItem('pt_save_expedition');
    }
    if(!raw)return null;
    var d=JSON.parse(raw);
    var g=d.game;
    var cls=g.player.playerClass||'swarm';
    var icons={titan:'🪨',ghost:'👻',swarm:'🦗'};
    // 挑战类型：周挑战 > 日挑战 > 普通短局
    var ch=null,modName=null;
    if(g._isWeeklyChallenge)ch='weekly';
    else if(g._dailyModifier&&g._seedLabel&&/^DAILY/.test(g._seedLabel))ch='daily';
    if(ch&&g._dailyModifier)modName=g._dailyModifier.icon?g._dailyModifier.icon+' '+g._dailyModifier.name:g._dailyModifier.name;
    return {floor:g.floor,cls:cls,icon:icons[cls]||'❓',name:g.player.name,time:d.timestamp,modeId:d.modeId||'classic',challengeType:ch,modName:modName};
  }catch(e){return null;}
}
function getAllSaveInfo(){
  return {short:getSaveInfo('short'),classic:getSaveInfo('classic'),expedition:getSaveInfo('expedition')};
}
function safeParse(s,def){try{return s?JSON.parse(s):def;}catch(e){return def;}}
