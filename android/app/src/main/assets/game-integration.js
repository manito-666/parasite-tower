// ====================================================
// 寄生魔塔 战斗决策屏 - 赌桌式 UI
// 信息层级: VS对比 → 成功率(核心) → 预览(辅助) → 操作
// 色彩语义: 绿=增益 红=危险/负面 蓝=特殊机制 橙=战斗 灰=保守
// ====================================================

function getMonsterFlavorText(type) {
  const texts = {
    rat: '改造过的神经回路让它的眼中闪烁着不属于啮齿类的光芒',
    roach: '辐射让它的外壳变成了活的装甲',
    slime: '第一批基因改造的副产物，被标记为废弃，却拒绝消亡',
    dog: '忠诚的基因被扭曲了，但那双眼睛里依然有人类能理解的东西',
    wasp: '翅膀震动的频率已经超出了人类的听觉范围',
    wolf: '它不是在狩猎——它在计算',
    spider: '蛛网上的每一滴酸液都在腐蚀你的退路',
    bat: '铁爪的寒光比任何武器都锋利',
    guard: '制服和皮肤已经融为一体',
    boss1: '他说他看到了进化的终点'
  };
  return texts[type] || '在黑暗中，有什么东西在注视着你';
}

// 立绘绘制（带呼吸动画）
function drawEncounterPortrait(type, c, x, y, size, breathing) {
  const w = size, h = size * 1.2;
  const tmpl = monsterTemplates[type];
  // 呼吸缩放
  const br = breathing ? 1 + Math.sin(Date.now() / 800) * 0.02 : 1;

  if (type === 'player') {
    const p = (typeof game !== 'undefined') ? game.player : null;
    const cls = p ? p.playerClass : 'titan';
    const cc = (typeof classColors !== 'undefined') ? (classColors[cls] || {primary:'#4488cc',glow:'#00c8ff'}) : {primary:'#4488cc',glow:'#00c8ff'};
    // 检查当前形态：如果是怪物形态则绘制该怪物立绘
    const curForm = (typeof game !== 'undefined' && game.forms && game.forms[game.currentForm]) ? game.forms[game.currentForm] : null;
    const formType = curForm ? curForm.type : 'human';
    if (formType !== 'human' && monsterTemplates[formType]) {
      // 绘制附身的怪物立绘
      drawEncounterPortrait(formType, c, x, y, size, breathing);
      // 在左上角加职业色标记，表示这是玩家
      c.save();
      c.fillStyle = cc.primary; c.shadowColor = cc.glow; c.shadowBlur = 6;
      c.beginPath(); c.arc(x + 10, y + 10, 5, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#fff'; c.font = 'bold 7px monospace'; c.textAlign = 'center';
      c.fillText('P', x + 10, y + 13);
      c.restore();
      return;
    }
    // 人形态：根据职业绘制不同立绘
    c.save();
    c.translate(x + w/2, y + h/2);
    c.scale(br, br);
    c.translate(-(x + w/2), -(y + h/2));
    if (cls === 'titan') {
      // 泰坦：石头巨人简化版
      // 身体（梯形石甲）
      c.fillStyle = '#3a4a5e';
      c.beginPath();
      c.moveTo(x + w*0.3, y + h*0.3);
      c.lineTo(x + w*0.2, y + h*0.8);
      c.lineTo(x + w*0.8, y + h*0.8);
      c.lineTo(x + w*0.7, y + h*0.3);
      c.closePath(); c.fill();
      // 肩甲
      c.fillStyle = '#4a5a6e';
      c.fillRect(x + w*0.15, y + h*0.28, w*0.25, h*0.08);
      c.fillRect(x + w*0.6, y + h*0.28, w*0.25, h*0.08);
      // 石纹
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(x+w*0.35,y+h*0.4); c.lineTo(x+w*0.55,y+h*0.5); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.6,y+h*0.45); c.lineTo(x+w*0.45,y+h*0.6); c.stroke();
      // 苔藓
      c.fillStyle = 'rgba(80,160,80,0.4)';
      c.fillRect(x+w*0.35,y+h*0.42,w*0.08,h*0.04);
      c.fillRect(x+w*0.55,y+h*0.55,w*0.06,h*0.03);
      // 小石头头
      c.fillStyle = '#5a6a7e';
      c.beginPath(); c.arc(x + w*0.5, y + h*0.22, w*0.13, 0, Math.PI*2); c.fill();
      // 发光眼
      c.fillStyle = cc.glow; c.shadowColor = cc.glow; c.shadowBlur = 6;
      c.fillRect(x + w*0.42, y + h*0.19, w*0.06, h*0.03);
      c.fillRect(x + w*0.52, y + h*0.19, w*0.06, h*0.03);
      c.shadowBlur = 0;
      // 石拳
      c.fillStyle = '#4a5a6e';
      c.beginPath(); c.arc(x + w*0.15, y + h*0.65, w*0.1, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.85, y + h*0.65, w*0.1, 0, Math.PI*2); c.fill();
      // 荧光脉管
      c.strokeStyle = 'rgba(0,255,208,0.25)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x+w*0.4,y+h*0.35); c.quadraticCurveTo(x+w*0.5,y+h*0.5,x+w*0.45,y+h*0.7); c.stroke();
    } else if (cls === 'ghost') {
      // 幽灵：半��明漂浮体
      const grad = c.createRadialGradient(x+w*0.5,y+h*0.4,0,x+w*0.5,y+h*0.4,w*0.35);
      grad.addColorStop(0, 'rgba(204,68,204,0.6)');
      grad.addColorStop(1, 'rgba(204,68,204,0.05)');
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(x + w*0.25, y + h*0.25);
      c.quadraticCurveTo(x + w*0.5, y + h*0.1, x + w*0.75, y + h*0.25);
      c.quadraticCurveTo(x + w*0.85, y + h*0.5, x + w*0.7, y + h*0.85);
      c.lineTo(x + w*0.6, y + h*0.75);
      c.lineTo(x + w*0.5, y + h*0.85);
      c.lineTo(x + w*0.4, y + h*0.75);
      c.lineTo(x + w*0.3, y + h*0.85);
      c.quadraticCurveTo(x + w*0.15, y + h*0.5, x + w*0.25, y + h*0.25);
      c.closePath(); c.fill();
      // 圆形发光眼
      c.fillStyle = cc.glow; c.shadowColor = cc.glow; c.shadowBlur = 8;
      c.beginPath(); c.arc(x + w*0.4, y + h*0.35, w*0.06, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.6, y + h*0.35, w*0.06, 0, Math.PI*2); c.fill();
      c.shadowBlur = 0;
      // 虹彩拖尾
      const iH = (Date.now() / 30) % 360;
      c.strokeStyle = 'hsla('+iH+',100%,70%,0.15)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x+w*0.3,y+h*0.8); c.quadraticCurveTo(x+w*0.2,y+h*0.95,x+w*0.15,y+h); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.7,y+h*0.8); c.quadraticCurveTo(x+w*0.8,y+h*0.95,x+w*0.85,y+h); c.stroke();
    } else {
      // 虫群：甲壳虫体
      c.fillStyle = '#0d1a14';
      c.beginPath();
      c.ellipse(x + w*0.5, y + h*0.45, w*0.3, h*0.25, 0, 0, Math.PI*2);
      c.fill();
      // 甲壳描边
      c.strokeStyle = cc.primary; c.lineWidth = 1.5; c.shadowColor = cc.glow; c.shadowBlur = 4;
      c.beginPath();
      c.ellipse(x + w*0.5, y + h*0.45, w*0.3, h*0.25, 0, 0, Math.PI*2);
      c.stroke();
      c.shadowBlur = 0;
      // 甲壳中线
      c.strokeStyle = 'rgba(0,255,208,0.3)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x+w*0.5,y+h*0.2); c.lineTo(x+w*0.5,y+h*0.7); c.stroke();
      // 发光眼
      c.fillStyle = cc.glow; c.shadowColor = cc.glow; c.shadowBlur = 6;
      c.beginPath(); c.arc(x + w*0.4, y + h*0.38, w*0.04, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.6, y + h*0.38, w*0.04, 0, Math.PI*2); c.fill();
      c.shadowBlur = 0;
      // 触须
      c.strokeStyle = cc.primary; c.lineWidth = 1; c.globalAlpha = 0.6;
      const tt = Date.now()/1000;
      c.beginPath(); c.moveTo(x+w*0.3,y+h*0.3); c.quadraticCurveTo(x+w*0.1,y+h*0.15+Math.sin(tt)*3,x+w*0.05,y+h*0.1); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.7,y+h*0.3); c.quadraticCurveTo(x+w*0.9,y+h*0.15+Math.cos(tt)*3,x+w*0.95,y+h*0.1); c.stroke();
      c.globalAlpha = 1;
      // 小腿
      c.strokeStyle = cc.primary; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x+w*0.25,y+h*0.55); c.lineTo(x+w*0.15,y+h*0.75); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.75,y+h*0.55); c.lineTo(x+w*0.85,y+h*0.75); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.3,y+h*0.6); c.lineTo(x+w*0.18,y+h*0.8); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.7,y+h*0.6); c.lineTo(x+w*0.82,y+h*0.8); c.stroke();
    }
    // 职业标识光环
    c.strokeStyle = cc.primary; c.lineWidth = 1; c.globalAlpha = 0.3;
    c.beginPath(); c.arc(x + w/2, y + h*0.5, w*0.4, 0, Math.PI*2); c.stroke();
    c.globalAlpha = 1;
    c.restore();
    return;
  }

  const color = tmpl ? tmpl.color : '#666';
  const name = tmpl ? tmpl.name : '?';
  const zone = tmpl ? (tmpl.zone || 1) : 1;
  const mLight = (typeof lightenColor === 'function') ? lightenColor(color, 40) : color;
  const cx = x + w / 2, cy = y + h * 0.45;
  const s = w * 0.9;
  c.save();
  c.translate(x + w/2, y + h/2);
  c.scale(br, br);
  c.translate(-(x + w/2), -(y + h/2));

  if (zone <= 1) {
    // T1: 半透明凝胶生物
    const mg1 = c.createRadialGradient(cx - s*0.04, cy - s*0.06, 0, cx, cy, s*0.38);
    mg1.addColorStop(0, 'rgba(255,255,255,0.7)'); mg1.addColorStop(0.3, mLight); mg1.addColorStop(0.8, color); mg1.addColorStop(1, 'rgba(45,27,78,0.5)');
    c.shadowColor = color; c.shadowBlur = 6;
    c.strokeStyle = color; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, s*0.35, 0, Math.PI*2); c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = mg1; c.beginPath(); c.arc(cx, cy, s*0.35, 0, Math.PI*2); c.fill();
    // 膜质高光
    c.fillStyle = 'rgba(0,255,208,0.12)'; c.beginPath(); c.arc(cx-s*0.1, cy-s*0.1, s*0.07, 0, Math.PI*2); c.fill();
    // 生物荧光眼
    c.shadowColor = '#00ffd0'; c.shadowBlur = 3; c.fillStyle = '#00ffd0';
    c.beginPath(); c.arc(cx-s*0.1, cy-s*0.06, s*0.06, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(cx+s*0.1, cy-s*0.06, s*0.06, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#0d0818';
    c.beginPath(); c.arc(cx-s*0.1+1, cy-s*0.06, s*0.03, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(cx+s*0.1+1, cy-s*0.06, s*0.03, 0, Math.PI*2); c.fill();
  } else if (zone <= 2) {
    // T2: 外骨骼翼形生物
    const mg2 = c.createRadialGradient(cx, cy-s*0.06, 0, cx, cy, s*0.4);
    mg2.addColorStop(0, 'rgba(255,255,255,0.8)'); mg2.addColorStop(0.4, mLight); mg2.addColorStop(1, color);
    c.shadowColor = color; c.shadowBlur = 5;
    c.strokeStyle = color; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx, cy-s*0.35); c.lineTo(cx+s*0.35, cy+s*0.25); c.lineTo(cx-s*0.35, cy+s*0.25); c.closePath(); c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = mg2;
    c.beginPath(); c.moveTo(cx, cy-s*0.35); c.lineTo(cx+s*0.35, cy+s*0.25); c.lineTo(cx-s*0.35, cy+s*0.25); c.closePath(); c.fill();
    // 薄膜翼（虹彩）
    const wingHue = (Date.now()/30) % 360;
    c.strokeStyle = 'hsla('+wingHue+',80%,60%,0.4)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx-s*0.3, cy+s*0.1); c.quadraticCurveTo(cx-s*0.55, cy-s*0.2, cx-s*0.5, cy-s*0.15); c.stroke();
    c.beginPath(); c.moveTo(cx+s*0.3, cy+s*0.1); c.quadraticCurveTo(cx+s*0.55, cy-s*0.2, cx+s*0.5, cy-s*0.15); c.stroke();
    // 棱镜眼
    c.shadowColor = '#ffcc00'; c.shadowBlur = 4; c.fillStyle = '#ffcc00';
    c.beginPath(); c.arc(cx-s*0.08, cy-s*0.06, s*0.06, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(cx+s*0.08, cy-s*0.06, s*0.06, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#0d0818';
    c.beginPath(); c.arc(cx-s*0.08, cy-s*0.06, s*0.03, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(cx+s*0.08, cy-s*0.06, s*0.03, 0, Math.PI*2); c.fill();
  } else if (zone <= 3) {
    // T3: 多眼甲壳生物
    const mg3 = c.createRadialGradient(cx, cy, 0, cx, cy, s*0.4);
    mg3.addColorStop(0, 'rgba(255,255,255,0.6)'); mg3.addColorStop(0.4, mLight); mg3.addColorStop(1, color);
    const h3 = s*0.35;
    c.shadowColor = color; c.shadowBlur = 5;
    c.strokeStyle = color; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx-h3, cy-h3*0.9); c.lineTo(cx-h3*0.6, cy-h3*1.1); c.lineTo(cx, cy-h3*0.85);
    c.lineTo(cx+h3*0.6, cy-h3*1.1); c.lineTo(cx+h3, cy-h3*0.9);
    c.lineTo(cx+h3, cy+h3); c.lineTo(cx-h3, cy+h3); c.closePath(); c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = mg3;
    c.beginPath(); c.moveTo(cx-h3, cy-h3*0.9); c.lineTo(cx-h3*0.6, cy-h3*1.1); c.lineTo(cx, cy-h3*0.85);
    c.lineTo(cx+h3*0.6, cy-h3*1.1); c.lineTo(cx+h3, cy-h3*0.9);
    c.lineTo(cx+h3, cy+h3); c.lineTo(cx-h3, cy+h3); c.closePath(); c.fill();
    // 多眼（生物荧光）
    c.shadowColor = '#00ffd0'; c.shadowBlur = 4; c.fillStyle = '#00ffd0';
    for (let i = 0; i < 4; i++) {
      const ex = cx - s*0.22 + i*s*0.15, ey = cy - s*0.06 + Math.sin(Date.now()/250+i)*2;
      c.beginPath(); c.arc(ex, ey, s*0.04, 0, Math.PI*2); c.fill();
    }
    c.shadowBlur = 0;
    // 有机牙
    c.fillStyle = 'rgba(200,180,255,0.7)';
    for (let t = 0; t < 3; t++) { c.fillRect(cx - s*0.18 + t*s*0.12, cy + s*0.18, s*0.06, s*0.08); }
  } else if (zone <= 4) {
    // T4: 相位生物
    c.globalAlpha = 0.55 + Math.sin(Date.now()/350) * 0.2;
    const mg4 = c.createRadialGradient(cx, cy, 0, cx, cy, s*0.35);
    mg4.addColorStop(0, 'rgba(255,255,255,0.8)'); mg4.addColorStop(0.2, mLight); mg4.addColorStop(0.7, color); mg4.addColorStop(1, 'rgba(45,27,78,0.3)');
    c.shadowColor = color; c.shadowBlur = 8;
    c.strokeStyle = color; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, s*0.33, 0, Math.PI*2); c.stroke();
    c.fillStyle = mg4; c.beginPath(); c.arc(cx, cy, s*0.33, 0, Math.PI*2); c.fill();
    // 能量环（虹彩）
    const ringHue = (Date.now()/25) % 360;
    c.strokeStyle = 'hsla('+ringHue+',100%,70%,0.4)'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, s*0.4, 0, Math.PI*2); c.stroke();
    c.strokeStyle = 'hsla('+((ringHue+120)%360)+',100%,70%,0.25)'; c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, s*0.48, Date.now()/300 % (Math.PI*2), (Date.now()/300 % (Math.PI*2)) + Math.PI); c.stroke();
    c.shadowBlur = 0; c.globalAlpha = 1;
    // 中心眼
    c.shadowColor = '#b455ff'; c.shadowBlur = 4; c.fillStyle = '#b455ff';
    c.beginPath(); c.arc(cx, cy, s*0.1, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#0d0818'; c.beginPath(); c.arc(cx, cy, s*0.05, 0, Math.PI*2); c.fill();
  } else {
    // T5: 远古恐怖 — 触手 + 脉动核心
    const mg5 = c.createRadialGradient(cx, cy, 0, cx, cy, s*0.4);
    mg5.addColorStop(0, 'rgba(255,255,255,0.7)'); mg5.addColorStop(0.3, mLight); mg5.addColorStop(0.7, color); mg5.addColorStop(1, '#1a0e2e');
    const h5 = s*0.38;
    c.shadowColor = color; c.shadowBlur = 12;
    c.strokeStyle = color; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx-h5, cy-h5*0.8); c.lineTo(cx-h5*0.5, cy-h5*1.2); c.lineTo(cx+h5*0.5, cy-h5*1.2);
    c.lineTo(cx+h5, cy-h5*0.8); c.lineTo(cx+h5*0.9, cy+h5); c.lineTo(cx-h5*0.9, cy+h5); c.closePath(); c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = mg5;
    c.beginPath(); c.moveTo(cx-h5, cy-h5*0.8); c.lineTo(cx-h5*0.5, cy-h5*1.2); c.lineTo(cx+h5*0.5, cy-h5*1.2);
    c.lineTo(cx+h5, cy-h5*0.8); c.lineTo(cx+h5*0.9, cy+h5); c.lineTo(cx-h5*0.9, cy+h5); c.closePath(); c.fill();
    // 触手
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI*2/5 + Date.now()/800;
      const tLen = s*0.45;
      const tHue = (Date.now()/20 + i*72) % 360;
      c.strokeStyle = 'hsla('+tHue+',80%,60%,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx + Math.cos(a)*h5*0.5, cy + Math.sin(a)*h5*0.5);
      c.quadraticCurveTo(cx + Math.cos(a+0.3)*tLen*0.7, cy + Math.sin(a+0.3)*tLen*0.7, cx + Math.cos(a)*tLen, cy + Math.sin(a)*tLen);
      c.stroke();
    }
    c.lineCap = 'butt';
    // 脉动核心眼
    const pulse = 0.7 + 0.3*Math.sin(Date.now()/200);
    c.shadowColor = '#ff006e'; c.shadowBlur = 8*pulse; c.fillStyle = '#ff006e';
    c.beginPath(); c.arc(cx, cy, s*0.1, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#0d0818'; c.beginPath(); c.arc(cx, cy, s*0.04, 0, Math.PI*2); c.fill();
  }
  // 名字首字（发光描边）
  c.shadowColor = color; c.shadowBlur = 3;
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = 'bold ' + (w*0.24) + 'px Arial'; c.textAlign = 'center';
  c.fillText(name[0], cx, cy + s*0.38);
  c.shadowBlur = 0;
  c.restore();
}

// === 长按FIGHT：自动战斗 ===
let _fightHoldTimer = null;

function startFightHold() {
  if (_fightHoldTimer) clearTimeout(_fightHoldTimer);
  _fightHoldTimer = setTimeout(() => {
    game._autoFight = true;
    const btn = document.querySelector('#encounter-btns .fight');
    if (btn) { btn.textContent = '自动战斗...'; btn.classList.add('auto-active'); }
    try { navigator.vibrate(100); } catch(e) {}
    // 立刻开始第一次攻击
    if (game.target && game.target.hp > 0 && game.player.hp > 0) window.attack();
  }, 1000);
}

function cancelFightHold() {
  if (_fightHoldTimer) { clearTimeout(_fightHoldTimer); _fightHoldTimer = null; }
}

// === 长按附身：环形SVG进度 + 成功率跳动 ===
let _possHoldRAF = null;
let _possHoldStart = 0;
let _possRateFlicker = null;
let _possActualRate = 0;

function startPossessHold() {
  const area = document.getElementById('enc-rate-possess');
  if (!area || area.classList.contains('disabled')) return;
  _possHoldStart = Date.now();
  const ring = document.getElementById('possess-ring-fg');
  const bar = document.getElementById('possess-hold-bar');
  const rateEl = document.getElementById('enc-rate-display');
  const circumference = 157; // 2*PI*25

  // 成功率跳动（模拟不稳定连接）
  _possRateFlicker = setInterval(() => {
    if (rateEl) {
      const jitter = Math.floor(Math.random() * 7) - 3;
      rateEl.textContent = Math.max(1, _possActualRate + jitter) + '%';
    }
  }, 120);

  function tick() {
    const elapsed = Date.now() - _possHoldStart;
    const pct = Math.min(1, elapsed / 2000);
    // SVG 环形进度
    if (ring) ring.style.strokeDashoffset = circumference * (1 - pct);
    if (bar) bar.style.width = (pct * 100) + '%';

    // 80% 时震动
    if (pct >= 0.8 && pct < 0.82) {
      try { navigator.vibrate(30); } catch(e) {}
    }

    if (elapsed >= 2000) {
      cancelPossessHold();
      try { navigator.vibrate(200); } catch(e) {}
      possess();
      return;
    }
    _possHoldRAF = requestAnimationFrame(tick);
  }
  _possHoldRAF = requestAnimationFrame(tick);
}

function cancelPossessHold() {
  if (_possHoldRAF) { cancelAnimationFrame(_possHoldRAF); _possHoldRAF = null; }
  if (_possRateFlicker) { clearInterval(_possRateFlicker); _possRateFlicker = null; }
  const ring = document.getElementById('possess-ring-fg');
  const bar = document.getElementById('possess-hold-bar');
  const rateEl = document.getElementById('enc-rate-display');
  // 恢复真实成功率
  if (rateEl) rateEl.textContent = _possActualRate + '%';
  // 0.5s 保留续按
  setTimeout(() => {
    if (!_possHoldRAF) {
      if (ring) ring.style.strokeDashoffset = 157;
      if (bar) bar.style.width = '0';
    }
  }, 500);
}

// === 污染战斗界面渗透 ===
let _polCombatFlicker = null;

function startPollutionCombatEffects(pol, rate) {
  if (_polCombatFlicker) clearInterval(_polCombatFlicker);
  if (pol < 50) return;

  _polCombatFlicker = setInterval(() => {
    // 目标已死或战斗已结束，停止闪烁
    if (!game.target || game.target.hp <= 0) { stopPollutionCombatEffects(); return; }
    const rateEl = document.getElementById('enc-rate-display');
    const rateCore = document.querySelector('.enc-rate-possess');
    if (!rateEl) return;

    if (pol >= 75) {
      // >75%: 目标名字 glitch
      const targetLabel = document.querySelector('.enc-target-card .enc-card-label');
      if (targetLabel && Math.random() > 0.7) {
        const glitchNames = ['???', 'ERR', '̷̢̛', '...', targetLabel.dataset.real || '目标'];
        if (!targetLabel.dataset.real) targetLabel.dataset.real = targetLabel.textContent;
        targetLabel.textContent = glitchNames[Math.floor(Math.random() * glitchNames.length)];
        setTimeout(() => { if (targetLabel.dataset.real) targetLabel.textContent = targetLabel.dataset.real; }, 200);
      }
      // 成功率核心区抖动
      if (rateCore) rateCore.classList.add('pol-glitch');
      setTimeout(() => { if (rateCore) rateCore.classList.remove('pol-glitch'); }, 150);
    }

    if (pol >= 50) {
      // >50%: 成功率偶尔闪烁错误值
      if (Math.random() > 0.6) {
        const fakeRate = Math.floor(Math.random() * 95) + 5;
        rateEl.textContent = fakeRate + '%';
        rateEl.style.color = '#f04';
        setTimeout(() => {
          if (rateEl) { rateEl.textContent = rate + '%'; rateEl.style.color = ''; }
        }, 300);
      }
    }
  }, 800);
}

function stopPollutionCombatEffects() {
  if (_polCombatFlicker) { clearInterval(_polCombatFlicker); _polCombatFlicker = null; }
}

// === 立绘呼吸动画循环 ===
let _portraitRAF = null;
function animatePortraits() {
  try {
    const pcv = document.getElementById('enc-player-cv');
    const tcv = document.getElementById('enc-target-cv');
    const t = game.target;
    if (pcv) { const pc = pcv.getContext('2d'); pc.clearRect(0, 0, 48, 60); drawEncounterPortrait('player', pc, 1, 1, 46, true); }
    if (tcv && t) { const tc = tcv.getContext('2d'); tc.clearRect(0, 0, 48, 60); drawEncounterPortrait(t.type, tc, 1, 1, 46, true); }
  } catch(e) {}
  if (document.getElementById('combat-overlay').classList.contains('active')) {
    _portraitRAF = requestAnimationFrame(animatePortraits);
  }
}

// === 主入口 ===
(function() {
  const initTimer = setInterval(() => {
    if (typeof game === 'undefined' || typeof showCombat === 'undefined') return;
    clearInterval(initTimer);


    const origShowCombat = window.showCombat;
    window.showCombat = function() {
      try {
        const t = game.target;
        if (!t) return;
        // 目标已死，关闭战斗界面
        if (t.hp <= 0) { if (origCloseCombat) origCloseCombat(); return; }
        const pol = game.player.pollution;

        // 污染100%: 强制跳过战斗界面
        if (pol >= 100) {
          game.target = null; // 清除目标，避免卡住移动
          triggerPollutionCollapse();
          return;
        }

        const overlay = document.getElementById('combat-overlay');
        overlay.classList.add('active');

        const box = document.getElementById('combat-box');
        const p = game.player;
        const pDmg = Math.max(1, p.atk - t.def);
        const mDmg = Math.max(1, t.atk - p.def);
        const turns = Math.ceil(t.hp / pDmg);
        const totalDmg = mDmg * (turns - 1);

        const possessBonus = (typeof getEvolutionEffect === 'function') ? (getEvolutionEffect('possessBonus') || 0) : 0;
        const traitPossessBonus = (typeof getTraitValue === 'function') ? (getTraitValue('possessBonus') || 0) : 0;
        const hpFactor = 1 - t.hp / t.maxHp * 0.6;
        const rate = Math.min(95, Math.max(5, Math.floor((0.6 * hpFactor + possessBonus + traitPossessBonus) * 100)));
        const fullRate = Math.min(95, Math.max(5, Math.floor((0.6 * 0.4 + possessBonus + traitPossessBonus) * 100)));
        const isPossessed = p.possessed[t.type] || t.possessed;
        _possActualRate = rate;

        // 预览计算（新继承公式：HP按血量比例，ATK/DEF 100%）
        const hpRatio = t.hp / t.maxHp;
        const inheritFactor = hpRatio >= 0.8 ? 1.0 : hpRatio >= 0.4 ? 0.8 : 0.6;
        const pvHp = Math.floor(t.hp * inheritFactor);
        const pvMaxHp = Math.floor(t.maxHp * inheritFactor);
        const pvAtk = t.atk;
        const pvDef = t.def;
        function pctChange(o, n) {
          if (o === 0) return n > 0 ? '+∞' : '0%';
          const pct = Math.round(((n - o) / o) * 100);
          return pct > 0 ? '+' + pct + '%' : pct + '%';
        }
        function pctClass(o, n) { return n > o ? 'up' : n < o ? 'down' : 'same'; }

        // 特性对比
        const pTraits = new Set(p.traits);
        const tTraits = new Set(t.traits);
        const gainTraits = t.traits.filter(tr => !pTraits.has(tr));
        const loseTraits = p.traits.filter(tr => !tTraits.has(tr));

        // 成功率颜色（填充度为主，颜色辅助）
        const rateColor = rate < 30 ? '#f04' : rate < 60 ? '#ff0' : '#0f4';

        box.innerHTML = `
          <div class="enc-header">
            <h2>${t.name}</h2>
            <div class="enc-subtitle">${getMonsterFlavorText(t.type)}</div>
          </div>

          <div class="enc-vs-area">
            <div class="enc-card enc-player-card">
              <div class="enc-card-label">当前</div>
              <canvas id="enc-player-cv" width="48" height="60"></canvas>
              <div class="enc-card-stats">
                <div>HP <b>${p.hp}</b>/<small>${p.maxHp}</small></div>
                <div>ATK <b>${p.atk}</b> DEF <b>${p.def}</b></div>
              </div>
            </div>
            <div class="enc-vs-badge">VS</div>
            <div class="enc-card enc-target-card">
              <div class="enc-card-label" data-real="目标">目标</div>
              <canvas id="enc-target-cv" width="48" height="60"></canvas>
              <div class="enc-card-stats">
                <div>HP <b>${t.hp}</b>/<small>${t.maxHp}</small></div>
                <div>ATK <b>${t.atk}</b> DEF <b>${t.def}</b></div>
              </div>
            </div>
          </div>

          <div class="enc-rate-possess ${isPossessed ? 'disabled' : ''}" id="enc-rate-possess"
            ontouchstart="startPossessHold()" ontouchend="cancelPossessHold()"
            onmousedown="startPossessHold()" onmouseup="cancelPossessHold()" onmouseleave="cancelPossessHold()">
            <div class="enc-rp-left">
              <div class="enc-rate-big" id="enc-rate-display" style="color:${rateColor}">${rate}%</div>
              <div class="enc-rp-bar">
                <div class="enc-rate-label">附身成功率</div>
                <div class="enc-rate-track"><div class="enc-rate-fill" style="width:${rate}%;background:${rateColor}"></div></div>
              </div>
            </div>
            <div class="enc-rp-ring">
              <svg class="possess-ring-svg" viewBox="0 0 56 56">
                <circle class="possess-ring-bg" cx="28" cy="28" r="25"/>
                <circle class="possess-ring-fg" id="possess-ring-fg" cx="28" cy="28" r="25"/>
              </svg>
              <div class="possess-ring-sub">${isPossessed ? '已附身' : '长按附身'}</div>
            </div>
            <div class="possess-hold-bar" id="possess-hold-bar"></div>
          </div>

          <div class="enc-preview">
            <div class="enc-pv-row">
              <span class="enc-pv-label">HP</span>
              <span class="enc-pv-old">${p.hp}</span>
              <span class="enc-pv-arrow">→</span>
              <span class="enc-pv-new">${pvHp}</span>
              <span class="enc-pv-pct ${pctClass(p.hp, pvHp)}">${pctChange(p.hp, pvHp)}</span>
            </div>
            <div class="enc-pv-row">
              <span class="enc-pv-label">ATK</span>
              <span class="enc-pv-old">${p.atk}</span>
              <span class="enc-pv-arrow">→</span>
              <span class="enc-pv-new">${pvAtk}</span>
              <span class="enc-pv-pct ${pctClass(p.atk, pvAtk)}">${pctChange(p.atk, pvAtk)}</span>
            </div>
            <div class="enc-pv-row">
              <span class="enc-pv-label">DEF</span>
              <span class="enc-pv-old">${p.def}</span>
              <span class="enc-pv-arrow">→</span>
              <span class="enc-pv-new">${pvDef}</span>
              <span class="enc-pv-pct ${pctClass(p.def, pvDef)}">${pctChange(p.def, pvDef)}</span>
            </div>
            ${(gainTraits.length || loseTraits.length) ? `
            <div class="enc-pv-traits">
              ${gainTraits.map(tr => '<span class="gain-trait">+' + tr + '</span>').join(' ')}
              ${loseTraits.map(tr => '<span class="lose-trait">-' + tr + '</span>').join(' ')}
            </div>` : ''}
          </div>

          <div class="enc-info-row">
            <span>伤害: <b style="color:#f04">${totalDmg}</b></span>
            <span>回合: <b>${turns}</b></span>
            <span>污染: <b style="color:${pol > 60 ? '#f04' : pol > 30 ? '#ff0' : '#0f4'}">${pol}%</b></span>
          </div>

          <div id="combat-danger-warn" style="display:none;text-align:center;padding:3px 6px;margin:3px 0;background:rgba(255,0,0,0.15);border:1px solid #f04;border-radius:3px;animation:dangerPulse .5s infinite;color:#f04;font-weight:bold;font-size:10px">⚠ 危险！预计伤害超过HP</div>
          <div id="combat-log" class="enc-combat-log"></div>
        `;

        // 初始危险警告检查
        const dangerWarn = document.getElementById('combat-danger-warn');
        if (dangerWarn) {
          const isDanger = totalDmg >= p.hp;
          dangerWarn.style.display = isDanger ? 'block' : 'none';
          // 危险时2秒后自动滚动到附身区域并高亮
          if (isDanger && !isPossessed) {
            setTimeout(() => {
              const area = document.getElementById('enc-rate-possess');
              if (area) {
                area.scrollIntoView({behavior:'smooth',block:'center'});
                area.style.boxShadow = '0 0 15px #0ff, 0 0 30px #0ff';
                area.style.borderColor = '#0ff';
                setTimeout(() => { area.style.boxShadow = ''; area.style.borderColor = ''; }, 3000);
              }
              if (dangerWarn) dangerWarn.innerHTML = '⚠ 危险！建议长按附身区域尝试寄生';
            }, 2000);
          }
        }

        // 启动立绘呼吸动画
        if (_portraitRAF) cancelAnimationFrame(_portraitRAF);
        setTimeout(() => { animatePortraits(); }, 50);

        // 启动污染战斗界面效果
        startPollutionCombatEffects(pol, rate);

        // 底部按钮
        const eb = document.getElementById('encounter-btns');
        if (eb) eb.classList.remove('hidden');
        const prb = document.getElementById('possess-rate-bottom');
        if (prb) prb.textContent = rate + '%';
        const bpb = document.getElementById('btn-possess-bottom');
        if (bpb) bpb.disabled = isPossessed;

        // 战斗期间隐藏小地图和消息面板
        const mc = document.getElementById('minimap-container');
        if (mc) mc.classList.add('combat-hidden');
        const mp = document.getElementById('msg-panel');
        if (mp) mp.classList.add('combat-hidden');
        // 隐藏外部战斗日志面板（改用内嵌日志）
        const blp = document.getElementById('battle-log-panel');
        if (blp) blp.classList.add('combat-hidden');

        // 底部攻击按钮绑定长按自动战斗
        const fightBtn = document.querySelector('#encounter-btns .fight');
        if (fightBtn) {
          fightBtn.ontouchstart = function() { startFightHold(); };
          fightBtn.ontouchend = function() { cancelFightHold(); };
          fightBtn.onmousedown = function() { startFightHold(); };
          fightBtn.onmouseup = function() { cancelFightHold(); };
          fightBtn.onmouseleave = function() { cancelFightHold(); };
        }

      } catch (e) {
        console.error('showCombat error:', e);
        if (origShowCombat) try { origShowCombat(); } catch (e2) { console.error(e2); }
      }
    };

    // 增强关闭：清理动画
    const origCloseCombat = window.closeCombat;
    window.closeCombat = function() {
      cancelPossessHold();
      cancelFightHold();
      game._autoFight = false;
      stopPollutionCombatEffects();
      if (_portraitRAF) { cancelAnimationFrame(_portraitRAF); _portraitRAF = null; }
      // 恢复战斗期间隐藏的元素
      const mc = document.getElementById('minimap-container');
      if (mc) mc.classList.remove('combat-hidden');
      const mp = document.getElementById('msg-panel');
      if (mp) mp.classList.remove('combat-hidden');
      const blp = document.getElementById('battle-log-panel');
      if (blp) blp.classList.remove('combat-hidden');
      // 恢复底部攻击按钮文本
      const fightBtn = document.querySelector('#encounter-btns .fight');
      if (fightBtn) {
        fightBtn.textContent = '攻击';
        fightBtn.classList.remove('auto-active');
        fightBtn.ontouchstart = null;
        fightBtn.ontouchend = null;
        fightBtn.onmousedown = null;
        fightBtn.onmouseup = null;
        fightBtn.onmouseleave = null;
      }
      origCloseCombat();
    };

    // 增强 attack：显示log + 战后刷新UI + 自动战斗
    const origAttack = window.attack;
    window.attack = function() {
      const log = document.getElementById('combat-log');
      if (log) log.style.display = 'block';
      origAttack();
      // 自动战斗：如果怪物还活着且玩家还活着，继续攻击
      if (game._autoFight && game.target && game.target.hp > 0 && game.player.hp > 0) {
        setTimeout(() => { if (game._autoFight && game.target && game.target.hp > 0) window.attack(); }, 300);
      } else {
        game._autoFight = false;
        const btn = document.querySelector('#encounter-btns .fight');
        if (btn) { btn.textContent = '攻击'; btn.classList.remove('auto-active'); }
      }
    };

    // 实时刷新战斗界面（怪物HP变化后更新成功率）
    window._refreshCombatUI = function() {
      const t = game.target;
      if (!t || t.hp <= 0) return;
      const p = game.player;
      const pol = p.pollution;

      const possessBonus = (typeof getEvolutionEffect === 'function') ? (getEvolutionEffect('possessBonus') || 0) : 0;
      const traitPossessBonus = (typeof getTraitValue === 'function') ? (getTraitValue('possessBonus') || 0) : 0;
      const hpFactor = 1 - t.hp / t.maxHp * 0.6;
      const rate = Math.min(95, Math.max(5, Math.floor((0.6 * hpFactor + possessBonus + traitPossessBonus) * 100)));
      const fullRate = Math.min(95, Math.max(5, Math.floor((0.6 * 0.4 + possessBonus + traitPossessBonus) * 100)));
      const isPossessed = p.possessed[t.type] || t.possessed;
      _possActualRate = rate;

      const rateColor = rate < 30 ? '#f04' : rate < 60 ? '#ff0' : '#0f4';

      // 更新成功率大数字
      const rateDisplay = document.getElementById('enc-rate-display');
      if (rateDisplay) { rateDisplay.textContent = rate + '%'; rateDisplay.style.color = rateColor; }

      // 更新进度条
      const rateFill = document.querySelector('.enc-rate-fill');
      if (rateFill) { rateFill.style.width = rate + '%'; rateFill.style.background = rateColor; }

      // 更新目标HP显示
      const targetStats = document.querySelector('.enc-target-card .enc-card-stats');
      if (targetStats) {
        const hpColor = t.hp/t.maxHp > 0.5 ? '#0f4' : t.hp/t.maxHp > 0.2 ? '#ff0' : '#f04';
        targetStats.innerHTML = '<div>HP <b style="color:' + hpColor + '">' + t.hp + '</b>/<small>' + t.maxHp + '</small></div><div>ATK <b>' + t.atk + '</b> DEF <b>' + t.def + '</b></div>';
      }

      // 更新玩家HP显示
      const playerStats = document.querySelector('.enc-player-card .enc-card-stats');
      if (playerStats) {
        playerStats.innerHTML = '<div>HP <b>' + p.hp + '</b>/<small>' + p.maxHp + '</small></div><div>ATK <b>' + p.atk + '</b> DEF <b>' + p.def + '</b></div>';
      }

      // 更新预计伤害（剩余回合）
      const pDmg = Math.max(1, p.atk - t.def);
      const mDmg = Math.max(1, t.atk - p.def);
      const remainTurns = Math.ceil(t.hp / pDmg);
      const remainDmg = mDmg * Math.max(0, remainTurns - 1);
      const infoRow = document.querySelector('.enc-info-row');
      if (infoRow) {
        infoRow.innerHTML = '<span>剩余伤害: <b style="color:#f04">' + remainDmg + '</b></span><span>剩余回合: <b>' + remainTurns + '</b></span><span>污染: <b style="color:' + (pol > 60 ? '#f04' : pol > 30 ? '#ff0' : '#0f4') + '">' + pol + '%</b></span>';
      }

      // 危险警告
      const dangerWarn = document.getElementById('combat-danger-warn');
      if (dangerWarn) dangerWarn.style.display = remainDmg >= p.hp ? 'block' : 'none';

      // 更新预览（新继承公式）
      const refreshHpRatio = t.hp / t.maxHp;
      const refreshInherit = refreshHpRatio >= 0.8 ? 1.0 : refreshHpRatio >= 0.4 ? 0.8 : 0.6;
      const pvHp = Math.floor(t.hp * refreshInherit);
      const pvAtk = t.atk;
      const pvDef = t.def;
      // 更新继承系数标题
      const pvTitle = document.querySelector('.enc-preview-title');
      if (pvTitle) pvTitle.textContent = 'AFTER POSSESSION (' + Math.round(refreshInherit*100) + '% inherit)';
      function pctChange(o, n) {
        if (o === 0) return n > 0 ? '+∞' : '0%';
        const pct = Math.round(((n - o) / o) * 100);
        return pct > 0 ? '+' + pct + '%' : pct + '%';
      }
      const pvRows = document.querySelectorAll('.enc-pv-row');
      if (pvRows.length >= 1) {
        const newEl = pvRows[0].querySelector('.enc-pv-new');
        const pctEl = pvRows[0].querySelector('.enc-pv-pct');
        if (newEl) newEl.textContent = pvHp;
        if (pctEl) { pctEl.textContent = pctChange(p.hp, pvHp); pctEl.className = 'enc-pv-pct ' + (pvHp > p.hp ? 'up' : pvHp < p.hp ? 'down' : 'same'); }
      }

      // 底部按钮
      const prb = document.getElementById('possess-rate-bottom');
      if (prb) prb.textContent = rate + '%';

      // 重绘立绘（更新目标HP条）
      try {
        const tcv = document.getElementById('enc-target-cv');
        if (tcv) { const tc = tcv.getContext('2d'); tc.clearRect(0, 0, 48, 60); drawEncounterPortrait(t.type, tc, 1, 1, 46, true); }
      } catch(e) {}

      // 污染战斗效果
      startPollutionCombatEffects(pol, rate);
    };

  }, 100);
})();
