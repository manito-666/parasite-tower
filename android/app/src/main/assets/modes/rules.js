// L2 规则引擎：默认值 = classic 模式（向后兼容）
// 所有 L1 核心代码读 GameRules.* 替代硬编码
window.GameRules = {
  // 标识
  modeId: 'classic',
  modeName: '全程模式',

  // 数值
  floorCap: 50,
  hpMult: 1.0,
  pollutionRate: 1.0,
  slotCap: 3,
  xpMult: 1.0,
  timeLimit: 0,        // 0 = 无限

  // 生命周期钩子（默认空函数）
  hooks: {
    onModeStart: function(){},
    onFloorEnter: function(f){},
    onTick: function(dt){},
    onPossess: function(t){},
    onFinale: function(){},
  },

  // 应用模式配置
  apply: function(modeConfig){
    if(!modeConfig) return;
    var src = modeConfig;
    for(var k in src){
      if(k === 'hooks') continue;
      this[k] = src[k];
    }
    // hooks 必须先重置为空，避免上一模式的钩子残留（例如短局→长局时 ShortMode.init 不应再触发）
    this.hooks = {
      onModeStart: function(){},
      onFloorEnter: function(f){},
      onTick: function(dt){},
      onPossess: function(t){},
      onFinale: function(){},
    };
    if(src.hooks){
      for(var hk in src.hooks){
        this.hooks[hk] = src.hooks[hk];
      }
    }
    // 切到非短局时，移除可能残留的倒计时DOM
    if(this.modeId !== 'short' && window.ShortMode && typeof ShortMode.removeTimerDom === 'function'){
      try{ ShortMode.removeTimerDom(); ShortMode._started = false; }catch(e){}
    }
    try{ this.hooks.onModeStart(); }catch(e){}
  }
};
