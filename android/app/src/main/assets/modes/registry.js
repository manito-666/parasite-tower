// L3 模式注册中心
(function(){
  window.GameModes = window.GameModes || { list: [] };
  var GM = window.GameModes;

  GM.current = null;

  GM.select = function(id){
    var mode = this.list.find(function(m){ return m.id === id; });
    if(!mode) return false;
    this.current = mode;
    if(window.GameRules && typeof GameRules.apply === 'function'){
      GameRules.apply(mode.config);
    }
    try{ localStorage.setItem('pt_mode', id); }catch(e){}
    return true;
  };

  GM.restore = function(){
    var saved = 'classic';
    try{ saved = localStorage.getItem('pt_mode') || 'classic'; }catch(e){}
    if(!this.list.find(function(m){ return m.id === saved; })) saved = 'classic';
    this.select(saved);
  };

  GM.isShort = function(){
    return this.current && this.current.id === 'short';
  };

  GM.isExpedition = function(){
    return this.current && this.current.id === 'expedition';
  };

  // 启动时恢复（不调用 hooks.onModeStart 直到玩家真正开局）
  // 这里只把数值挂上去，启动游戏时再触发 onModeStart
  try{
    var saved = localStorage.getItem('pt_mode') || 'classic';
    var mode = GM.list.find(function(m){ return m.id === saved; });
    if(mode && window.GameRules){
      GameRules.modeId = mode.config.modeId;
      GameRules.modeName = mode.config.modeName;
      GameRules.floorCap = mode.config.floorCap;
      GameRules.hpMult = mode.config.hpMult;
      GameRules.pollutionRate = mode.config.pollutionRate;
      GameRules.slotCap = mode.config.slotCap;
      GameRules.xpMult = mode.config.xpMult;
      GameRules.timeLimit = mode.config.timeLimit;
      GM.current = mode;
    }
  }catch(e){}
})();
