# 寄生魔塔 UI/UX 完整设计规范

## 核心设计原则

```
【原则1：身体即界面】
- 玩家当前形态占据屏幕核心位置
- 所有状态变化都反映在身体外观上
- UI不是"面板"，是"身体的延伸"

【原则2：污染即滤镜】
- 0-100污染值不是数字，是屏幕的"健康状态"
- 高污染时UI本身开始扭曲、失效、撒谎
- 100时界面"崩溃"，强制进入特殊状态

【原则3：决策即赌博】
- 附身选择界面像赌桌：筹码（当前身体）、赔率（成功率）、奖品（新能力）
- 所有信息服务于"要不要赌这一把"
```

---

## 整体布局（竖屏 9:16）

```
┌─────────────────────────────┐  ← 安全区顶部
│ ◄  [形态记忆: 人→狼→?→?]  ► │  ← 64px高，形态槽
├─────────────────────────────┤
│                             │
│      ┌─────────┐           │
│      │         │           │
│      │  当前   │  ← 主视图  │  240×320px
│      │  形态   │     60%    │  角色120×160px
│      │  展示   │           │
│      │         │           │
│      └─────────┘           │
│      [特性环绕]  ← 3个图标   │
│                             │
├─────────────────────────────┤
│ 污染 ████████████░░░ 67%   │  ← 24px高，全宽
│ [警告: 认知边界不稳定]       │
├─────────────────────────────┤
│ HP 340/400  ATK 28  DEF 19 │  ← 50px高
│ [进化树] [记忆] [设置]      │
├─────────────────────────────┤
│  [←]  [↑]  [→]             │  ← 虚拟摇杆
│        [↓]                  │  （可隐藏）
└─────────────────────────────┘
```

---

## 模块1：形态记忆槽

### 视觉规格

```css
/* 容器 */
height: 64px;
background: #1a1a1a;
padding: 8px 16px;

/* 形态单元 */
.form-slot {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  margin: 0 4px;
  border: 2px solid;
}

/* 状态 */
.form-slot.current {
  border-color: #0f4;
  box-shadow: 0 0 10px rgba(0,255,68,0.5);
  animation: pulse 2s infinite;
}

.form-slot.unlocked {
  border-color: #666;
  opacity: 0.8;
}

.form-slot.locked {
  border: 2px dashed #444;
  opacity: 0.3;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(0,255,68,0.3); }
  50% { box-shadow: 0 0 20px rgba(0,255,68,0.8); }
}
```

### 交互规范

| 操作 | 触发条件 | 反馈 | 冷却 |
|------|---------|------|------|
| 点击切换 | 非战斗 | 0.3s滑动动画 | 3秒 |
| 长按详情 | 按住0.5s | 弹出属性面板 | 无 |
| 左右滑动 | 速度>500px/s | 切换形态 | 3秒 |

---

## 模块2：主视图区

### 渲染层级

```
Layer 0: 背景（层主题色 + 污染滤镜）
Layer 1: 阴影（动态光源）
Layer 2: 身体主体（形态Sprite）
Layer 3: 特效（呼吸、待机动画）
Layer 4: 特性图标环绕（3个，120°分布，半径80px）
Layer 5: 交互提示
```

### 污染滤镜效果

```javascript
// 污染值 → 视觉效果映射
const pollutionEffects = {
  '0-30': {
    vignette: 0,
    chromatic: 0,
    shake: 0,
    glitch: 0
  },
  '31-50': {
    vignette: 0.2,
    chromatic: 2,
    shake: 0,
    glitch: 0
  },
  '51-70': {
    vignette: 0.3,
    chromatic: 5,
    shake: 1,
    glitch: 0.1
  },
  '71-85': {
    vignette: 0.4,
    chromatic: 8,
    shake: 2,
    glitch: 0.3
  },
  '86-99': {
    vignette: 0.5,
    chromatic: 12,
    shake: 3,
    glitch: 0.5
  },
  '100': {
    shatter: true // 触发崩溃
  }
};
```

### 特性环绕动画

```javascript
// 3个特性图标环绕配置
const traitOrbit = {
  radius: 80,
  angles: [-30, 90, 210], // 度
  rotationSpeed: 5000, // ms/圈
  iconSize: 32,
  
  // 触发效果
  onTrigger: {
    scale: 2.0,
    duration: 500,
    glow: 'rgba(100,50,200,0.8)',
    particles: 20
  }
};
```

---

## 模块3：污染条

### 完整规格

```css
/* 容器 */
.pollution-bar {
  height: 24px;
  width: calc(100% - 32px);
  margin: 0 16px;
  border-radius: 12px;
  background: #222;
  position: relative;
}

/* 填充 */
.pollution-fill {
  height: 20px;
  margin: 2px;
  border-radius: 10px;
  transition: width 0.5s ease;
  
  /* 渐变色 */
  background: linear-gradient(90deg,
    #0f4 0%,
    #4f4 30%,
    #ff0 60%,
    #f80 80%,
    #f00 100%
  );
}

/* 脉动效果（80%+） */
.pollution-fill.critical {
  animation: heartbeat 1s infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.1); }
}

/* 文字叠加 */
.pollution-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-family: 'Consolas', monospace;
  color: #fff;
  text-shadow: 0 0 4px #000;
}
```

### 状态描述词库

```javascript
const pollutionMessages = {
  '0-30': ['认知清晰', '意识纯净', '自我完整'],
  '31-50': ['轻微杂音', '边界模糊', '记忆渗漏'],
  '51-70': ['现实扭曲', '他者低语', '形态不稳'],
  '71-85': ['认知崩解', '自我溶解', '存在危机'],
  '86-99': ['临界状态', '最后的锚定', '即将迷失'],
  '100': ['【污染爆发】']
};
```

---

## 模块4：遭遇界面

### 布局规格

```
┌─────────────────────────────┐
│  [X]  遭遇: 畸变狼          │  ← 40px高
│  "濒死的野兽，眼睛仍燃烧着"  │  ← 30px高
├─────────────────────────────┤
│    ┌─────────┐ ┌─────────┐ │
│    │  当前   │ │  目标   │ │  ← 各120×150px
│    │  120px  │ │  120px  │ │
│    └─────────┘ └─────────┘ │
│         ↓ 附身后            │
│    ┌─────────┐              │
│    │  预览   │  ← 300×80px  │
│    └─────────┘              │
├─────────────────────────────┤
│  【成功率可视化】            │  ← 100px高
│  满血 ████░░░░░░░░░░  24%   │
│  当前 █████████░░░░░░░  52% │
├─────────────────────────────┤
│  [战斗] [附身:长按2s] [逃跑] │  ← 60px高
│  💡 提示: 首次附身解锁碎片    │  ← 30px高
└─────────────────────────────┘
```

### 成功率计算公式

```javascript
function calculateSuccessRate(player, target) {
  const baseRate = 0.3;
  const hpFactor = 1 - (target.hp / target.maxHp);
  const levelModifier = 1 + (player.level - target.level) * 0.1;
  
  return Math.min(0.95, Math.max(0.05, 
    (baseRate + hpFactor * 0.6) * levelModifier
  ));
}

// 可视化示例
// 满血: 0.3 + 0 * 0.6 = 0.3 (30%)
// 半血: 0.3 + 0.5 * 0.6 = 0.6 (60%)
// 濒死: 0.3 + 0.9 * 0.6 = 0.84 (84%)
```

---

## 模块5：附身动画

### 完整时间轴（2.5秒）

```
0.0s ─────────────────────────────────────> 2.5s
│     │     │     │     │     │     │     │
接触  侵蚀  崩解        重组        适应
0.3s  0.8s  1.5s        2.0s        2.5s

【阶段1：接触】0-0.3s
- 触须伸出（贝塞尔曲线）
- 怪物束缚（3帧挣扎）
- 屏幕震动（2px）

【阶段2：侵蚀】0.3-0.8s
- HP条变色：#0f0 → #a4a → #000
- 成功率跳动：24% → 48% → 52% → 定格
- 判定时刻：0.8s

【阶段3：崩解】0.8-1.5s（不可跳过）
- 像素化：8×8方块
- 粒子流动：向玩家
- 黑屏：1.3-1.5s

【阶段4：重组】1.5-2.0s
- 光点生长：1.5-1.7s
- 360°旋转：1.7-1.9s
- 特性飞入：1.9-2.0s

【阶段5：适应】2.0-2.5s
- 恢复控制：2.0s
- 输入延迟：0.3s
- 污染+5：2.5s
```

### 关键帧数据

```javascript
const possessionKeyframes = {
  contact: [
    { time: 0.0, tentacleLength: 0, targetShake: 0 },
    { time: 0.15, tentacleLength: 0.5, targetShake: 2 },
    { time: 0.3, tentacleLength: 1.0, targetShake: 3 }
  ],
  
  erosion: [
    { time: 0.3, hpColor: '#0f0', rateDisplay: 24 },
    { time: 0.5, hpColor: '#a4a', rateDisplay: 48 },
    { time: 0.8, hpColor: '#000', rateDisplay: 52 }
  ],
  
  breakdown: [
    { time: 0.8, pixelSize: 1, alpha: 1.0 },
    { time: 1.0, pixelSize: 8, alpha: 0.8 },
    { time: 1.3, pixelSize: 16, alpha: 0.3 },
    { time: 1.5, pixelSize: 32, alpha: 0.0 }
  ],
  
  reform: [
    { time: 1.5, scale: 0.0, rotation: 0 },
    { time: 1.7, scale: 0.5, rotation: 180 },
    { time: 2.0, scale: 1.0, rotation: 360 }
  ]
};
```

---

## 模块6：污染崩溃界面

```css
/* 碎裂效果 */
.shatter-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1000;
}

.shatter-piece {
  position: absolute;
  background: inherit;
  border: 2px solid #fff;
  animation: shatter-fall 1s ease-out forwards;
}

@keyframes shatter-fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) rotate(var(--dr));
    opacity: 0;
  }
}

/* 强制选择UI */
.collapse-choice {
  width: 300px;
  height: 200px;
  background: #1a0a0a;
  border: 2px solid #f00;
  box-shadow: 0 0 30px rgba(255,0,0,0.5);
}

.countdown {
  font-size: 48px;
  color: #f00;
  text-shadow: 0 0 20px #f00;
  animation: countdown-pulse 1s infinite;
}

@keyframes countdown-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
```

---

## 色彩系统（16色）

```css
:root {
  /* 基础色 */
  --black: #000;
  --near-black: #111;
  --dark-gray: #222;
  --mid-gray: #666;
  --light-gray: #aaa;
  --white: #fff;
  
  /* 状态色 */
  --health-green: #0f4;
  --warning-yellow: #ff0;
  --danger-orange: #f80;
  --critical-red: #f04;
  --info-blue: #48f;
  
  /* 派系色 */
  --human-primary: #0f0;
  --human-dark: #0a0;
  --titan-primary: #48a;
  --titan-dark: #246;
  --ghost-primary: #a4a;
  --ghost-dark: #525;
  --swarm-primary: #4a4;
  --swarm-dark: #2a2;
  
  /* 污染色 */
  --pollution-safe: #0f4;
  --pollution-warning: #ff0;
  --pollution-danger: #f80;
  --pollution-critical: #f00;
}
```

---

## 响应式规范

### 安全区适配

```javascript
// 检测刘海/挖孔屏
const safeArea = {
  top: parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('env(safe-area-inset-top)')) || 0,
  bottom: parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('env(safe-area-inset-bottom)')) || 0
};

// 应用到布局
document.querySelector('.form-memory-slot').style.paddingTop = 
  `${safeArea.top + 8}px`;
```

### 分辨率适配

| 设备 | 分辨率 | 缩放比例 | 字体基准 |
|------|--------|---------|---------|
| iPhone SE | 375×667 | 1.0 | 14px |
| iPhone 12 | 390×844 | 1.04 | 14px |
| iPhone 14 Pro Max | 430×932 | 1.15 | 16px |
| iPad Mini | 744×1133 | 1.5 | 18px |

---

## 性能优化

### Canvas优化

```javascript
// 离屏渲染
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// 预渲染静态元素
function prerenderUI() {
  offscreenCtx.clearRect(0, 0, width, height);
  // 绘制背景、边框等
  return offscreenCanvas;
}

// 主循环只绘制动态部分
function render() {
  ctx.drawImage(prerenderUI(), 0, 0);
  // 绘制角色、特效
}
```

### 动画优化

```javascript
// 使用requestAnimationFrame
let lastTime = 0;
function gameLoop(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  update(deltaTime);
  render();
  
  requestAnimationFrame(gameLoop);
}

// 节流污染效果
let pollutionUpdateTimer = 0;
function updatePollution(deltaTime) {
  pollutionUpdateTimer += deltaTime;
  if (pollutionUpdateTimer > 100) { // 每100ms更新一次
    pollutionSystem.update(pollutionUpdateTimer);
    pollutionUpdateTimer = 0;
  }
}
```

---

## 实现优先级

### P0（核心体验）- 第1周
- [x] 附身动画系统
- [x] 遭遇界面重构
- [ ] 集成到现有HTML

### P1（氛围营造）- 第2周
- [x] 污染边框系统
- [x] 形态记忆槽
- [ ] 音效集成

### P2（细节打磨）- 第3周
- [ ] 幽灵怪物AI
- [ ] 特性触发特效
- [ ] 记忆碎片系统

### P3（锦上添花）- 第4周
- [ ] 高级Shader（WebGL）
- [ ] 粒子系统优化
- [ ] 多语言支持

---

## 开发交付清单

### 资源文件
```
assets/
├── sprites/
│   ├── forms/
│   │   ├── human.png (120×160px)
│   │   ├── wolf.png
│   │   └── ghost.png
│   ├── traits/
│   │   ├── icon_thick_skin.png (32×32px)
│   │   └── icon_vampire.png
│   └── ui/
│       ├── button_normal.png
│       └── button_pressed.png
├── sounds/
│   ├── whoosh.mp3
│   ├── dissolve.mp3
│   ├── absorb.mp3
│   └── reject.mp3
└── shaders/
    ├── pixel_dissolve.glsl
    └── chromatic_aberration.glsl
```

### 代码模块
```
src/
├── possession-animation.js ✓
├── pollution-system.js ✓
├── form-memory-slot.js ✓
├── encounter-ui.js ✓
└── game-integration.js (待创建)
```

---

## 测试用例

### 附身动画测试
```javascript
// 测试成功附身
testPossessionSuccess() {
  const player = { hp: 100, atk: 10 };
  const target = { hp: 20, maxHp: 100 };
  const animation = new PossessionAnimation(canvas);
  
  animation.play(player, target, 0.8).then(result => {
    assert(result.success === true);
    assert(player.pollution === 5);
  });
}

// 测试失败附身
testPossessionFailure() {
  // 强制失败
  Math.random = () => 0.9;
  // ... 测试逻辑
}
```

### 污染系统测试
```javascript
testPollutionEffects() {
  const pollution = new PollutionSystem(canvas);
  
  pollution.pollution = 50;
  assert(pollution.getPollutionLevel() === 'warning');
  
  pollution.pollution = 100;
  assert(pollution.getPollutionLevel() === 'critical');
}
```

---

## 更新日志

- 2026-04-02: 初版完成，包含5个核心模块
- 2026-04-02: 整合两版设计文档，统一规范
