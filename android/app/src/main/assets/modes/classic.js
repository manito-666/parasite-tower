// L3 全程模式：50 层完整体验
window.GameModes = window.GameModes || { list: [] };
window.GameModes.list.push({
  id: 'classic',
  name: '全程模式',
  desc: '50 层完整叙事 · 永久死亡 · 真结局',
  duration: '~2小时',
  config: {
    modeId: 'classic',
    modeName: '全程模式',
    floorCap: 50,
    hpMult: 1.0,
    pollutionRate: 1.0,
    slotCap: 3,
    xpMult: 1.0,
    timeLimit: 0,
  }
});
