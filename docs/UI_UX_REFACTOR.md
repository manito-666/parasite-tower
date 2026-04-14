# 寄生魔塔 UI/UX 重构完整设计文档

## 目录
1. [核心问题诊断](#核心问题诊断)
2. [信息架构](#信息架构)
3. [界面规格](#界面规格)
4. [交互设计](#交互设计)
5. [视觉规范](#视觉规范)
6. [技术实现](#技术实现)

---

## 核心问题诊断

| 问题 | 后果 | 解决方案 |
|------|------|---------|
| 附身成功率数字太抽象 | 玩家不理解为什么失败 | 可视化HP影响+实时预览 |
| 形态切换隐藏太深 | 核心机制被忽略 | 常驻形态栏+切换动画 |
| 污染值只是数字 | 无压迫感 | 全屏渐进式视觉侵蚀 |
| 特性效果不直观 | 玩家忘记自己有什么 | 战斗内实时触发反馈 |

---

## 信息架构

### 三层信息系统

```
【第一层：环境层】永远可见，营造氛围
├─ 污染侵蚀边框（随数值变化）
├─ 当前形态剪影（玩家角色外观）
└─ 层数/深度计（心理压力）

【第二层：决策层】遭遇时弹出，信息聚焦
├─ 怪物解剖图（可附身部位高亮）
├─ 成功率可视化（HP条=赌博赔率）
├─ 特性继承预览（获得什么）
└─ 风险对比（当前vs新形态）

【第三层：反馈层】动作后瞬间，强化爽感
├─ 附身成功：身体崩解→重组动画
├─ 特性触发：图标弹射+慢镜头
└─ 污染爆发：屏幕碎裂+强制选择
```

---

## 界面规格

### 1. 主游戏界面（竖屏优先）

```
┌─────────────────────────────────────┐
│  [←][→]  形态记忆槽（3个剪影）        │  ← 点击切换
├─────────────────────────────────────┤
│                                     │
│    ┌─────┐                         │
│    │ 👤  │ ← 当前形态（大）          │
│    │化身 │    污染侵蚀边框环绕        │
│    └─────┘                         │
│         ╲  特性图标浮动环绕           │
│    [厚皮][吸血][？？]               │
│                                     │
│    ╔═══════════════╗               │
│    ║  第 47 层      ║ ← 层数        │
│    ║  深度: -283m  ║ ← 心理压力     │
│    ╚═══════════════╝               │
│                                     │
│    污染值: ████████░░ 67/100        │
│    [警告: 幻觉开始出现]              │
│                                     │
├─────────────────────────────────────┤
│ HP: 340/400 | ATK:28 | DEF:19       │
│ 进化点: 1200  [打开进化树]           │
└─────────────────────────────────────┘
```

#### 元素规格

| 元素 | 位置 | 尺寸 | 颜色 | 交互 |
|------|------|------|------|------|
| 形态记忆槽 | 顶部 | 60px高 | 见颜色编码 | 点击切换/长按详情 |
| 当前形态剪影 | 中上 | 120x120px | 动态（根据形态） | 无 |
| 污染边框 | 环绕剪影 | 4-12px | #0f0→#ff0→#f00 | 随污染值动画 |
| 特性图标 | 剪影周围 | 32x32px | 半透明浮动 | 点击查看详情 |
| 深度计 | 中央 | 200x80px | #cc8844 | 无 |
| 污染条 | 中下 | 全宽x30px | 渐变+动画 | 无 |
| 属性栏 | 底部 | 全宽x50px | 见stat颜色 | 无 |

---

### 2. 遭遇决策界面

```
┌─────────────────────────────────────┐
│  ⚠️ 遭遇: 畸变狼（濒死）            │
│  "它的喉咙被撕开，但牙齿仍在寻找猎物" │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────┐    ┌─────────┐      │
│    │  当前   │ vs │  目标   │      │
│    │  [化身] │    │  [狼影] │      │
│    │ HP:340  │    │ HP:36   │      │
│    │ ATK:28  │    │ ATK:16  │→+?   │
│    │ DEF:19  │    │ DEF:6   │→+?   │
│    └─────────┘    └─────────┘      │
│         ↓ 附身后预览                │
│    ┌─────────┐                     │
│    │ [狼化]  │ HP:288 ATK:?? DEF:??│
│    │ 继承:狂暴│ （80%属性+特性）     │
│    └─────────┘                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  成功率可视化                │   │
│  │  满血 ████░░░░░░ 24%        │   │
│  │  当前 ████████░░ 52% ← 实时  │   │
│  │  [HP越低，容器越"空"，越易占据]│  │
│  └─────────────────────────────┘   │
│                                     │
│  [战斗]  [附身:52%]  [逃跑:0次]     │
│         ↑长按2秒确认                │
│                                     │
│  💡 提示: 首次附身此类，解锁记忆碎片 │
└─────────────────────────────────────┘
```

#### 成功率计算公式可视化

```javascript
// 核心公式
successRate = baseRate * (1 - targetHP / targetMaxHP) * levelModifier

// 可视化展示
HP满血 (100%): ████░░░░░░ 24%
HP半血 (50%):  ██████░░░░ 48%
HP濒死 (10%):  ████████░░ 86%
```

---

### 3. 附身动画时间轴

```
【阶段1：接触】0.5秒
时间轴: 0.0s ────────────────> 0.5s
效果:   触须伸出 → 怪物束缚 → 挣扎动画
音效:   whoosh.mp3 → struggle.mp3

【阶段2：侵蚀】1秒（可跳过）
时间轴: 0.5s ────────────────> 1.5s
效果:   HP条变色(绿→紫→黑) + 成功率跳动
判定:   1.5s时刻 - 成功/失败分支
失败:   触须断裂 + 玩家硬直0.8s
成功:   进入阶段3

【阶段3：崩解】1.5秒（核心不可跳过）
时间轴: 1.5s ────────────────> 3.0s
效果:   像素化崩解 + 吸收动作 + 黑屏
Shader: pixelDissolve.glsl (见技术实现)
音效:   dissolve.mp3 + absorb.mp3

【阶段4：重组】2秒（身份确认时刻）
时间轴: 3.0s ────────────────> 5.0s
效果:   光点生长 + 360°旋转 + 特性飞入
关键帧:
  3.0s: 光点出现
  3.5s: 轮廓形成
  4.0s: 细节填充
  4.5s: 特性图标环绕飞入
  5.0s: 完成

【阶段5：适应】0.5秒
时间轴: 5.0s ────────────────> 5.5s
效果:   恢复控制 + 轻微输入延迟
污染:   +5 污染值 + 边框闪烁
```

---

### 4. 污染系统视觉效果表

| 污染值 | 视觉效果 | 游戏影响 | CSS/Shader |
|--------|---------|---------|-----------|
| 0-30 | 正常，轻微暗角 | 无 | `box-shadow: inset 0 0 100px rgba(0,0,0,0.3)` |
| 31-50 | 边缘轻微扭曲，偶尔色偏 | 远处怪物轮廓模糊 | `filter: hue-rotate(5deg)` |
| 51-60 | **幽灵怪物出现** | 假怪物（触碰消失） | 半透明sprite + 循环动画 |
| 61-75 | 屏幕抖动，RGB分离 | 地图方向混乱 | `transform: translate(±2px)` + chromatic aberration |
| 76-80 | 持续低频噪音 | 属性显示±20%误差 | Perlin noise overlay |
| 81-99 | 画面撕裂，黑帧 | 每5步随机传送 | glitch shader |
| 100 | **屏幕碎裂** | 强制附身/死亡 | shatter.glsl |

---

## 交互设计

### 移动端手势操作表

| 手势 | 触发条件 | 功能 | 反馈 | 防误触 |
|------|---------|------|------|--------|
| 单指滑动 | 任意时刻 | 移动 | 角色朝向滑动方向 | 最小滑动距离20px |
| 双击空地 | 非战斗 | 冲刺（消耗5HP） | 拖尾特效 | 200ms内双击 |
| 长按怪物 | 遭遇时 | 弹出附身菜单 | 怪物高亮+震动 | 按住0.5s |
| 双指捏合 | 任意时刻 | 缩放地图 | 查看远处 | 最小缩放变化10% |
| 快速右滑 | 非战斗 | 切换下一形态 | 角色闪避动作 | 速度>500px/s |
| 快速左滑 | 非战斗 | 切换上一形态 | 同上 | 速度>500px/s |

### 虚拟摇杆参数

```javascript
const joystickConfig = {
  deadZone: 0.15,        // 死区半径（防止漂移）
  maxRadius: 60,         // 最大半径（px）
  responseCurve: 'ease-out', // 响应曲线
  opacity: 0.6,          // 透明度
  fadeOutDelay: 2000,    // 无操作2s后淡出
  position: {
    x: 80,               // 距左边缘80px
    y: window.innerHeight - 120 // 距底部120px
  }
}
```

---

## 视觉规范

### 16色调色板

```css
/* 泰坦系（机械/金属） */
--titan-primary: #6688cc;
--titan-secondary: #4466aa;
--titan-accent: #88aaff;
--titan-dark: #334466;

/* 幽灵系（虚无/灵体） */
--ghost-primary: #00ffcc;
--ghost-secondary: #00ccaa;
--ghost-accent: #66ffee;
--ghost-dark: #006655;

/* 虫群系（生物/有机） */
--swarm-primary: #cc6633;
--swarm-secondary: #aa4422;
--swarm-accent: #ff8844;
--swarm-dark: #663311;

/* 人类系（原始形态） */
--human-primary: #cc9933;
--human-secondary: #aa7722;
--human-accent: #ffbb44;
--human-dark: #664411;

/* 污染系（腐化/异变） */
--pollution-low: #0f0;
--pollution-mid: #ff0;
--pollution-high: #f00;
--pollution-critical: #a0f;
```

### 字体层级

```css
/* 标题 */
.title-main {
  font-size: 3.5em;
  font-weight: 900;
  letter-spacing: 8px;
  text-shadow: 0 0 30px rgba(100,50,200,0.5);
}

/* 数值 */
.stat-value {
  font-size: 1.05em;
  font-weight: 700;
  font-family: 'Consolas', monospace;
}

/* 描述 */
.description {
  font-size: 0.95em;
  line-height: 1.8;
  color: #c8c0b0;
}

/* 警告 */
.warning {
  font-size: 1.1em;
  font-weight: bold;
  color: #ff4444;
  text-shadow: 0 0 10px rgba(255,68,68,0.5);
  animation: blink 1s infinite;
}
```

### 动画时长标准

```css
/* 反馈类（即时响应） */
--duration-instant: 0.1s;
--duration-feedback: 0.3s;

/* 过渡类（状态切换） */
--duration-transition: 0.5s;
--duration-smooth: 1s;

/* 特殊类（重要时刻） */
--duration-special: 2s;
--duration-cinematic: 3s;
```

---

## 技术实现

### 附身动画状态机

```javascript
class PossessionAnimation {
  constructor(canvas, player, target) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = player;
    this.target = target;
    this.state = 'IDLE';
    this.timer = 0;
  }

  async play(successRate) {
    await this.contact();
    const success = await this.erosion(successRate);
    
    if (!success) {
      await this.rejection();
      return false;
    }
    
    await this.breakdown();
    await this.reform();
    await this.adapt();
    
    return true;
  }

  async contact() {
    this.state = 'CONTACT';
    // 触须伸出动画
    for (let t = 0; t < 0.5; t += 0.016) {
      this.drawTentacles(t / 0.5);
      await this.sleep(16);
    }
  }

  async erosion(successRate) {
    this.state = 'EROSION';
    // HP条变色 + 成功率跳动
    for (let t = 0; t < 1.0; t += 0.016) {
      this.drawHPBarTransition(t);
      this.drawSuccessRateRoll(successRate, t);
      await this.sleep(16);
    }
    
    // 判定
    return Math.random() < successRate;
  }

  async breakdown() {
    this.state = 'BREAKDOWN';
    // 像素崩解（使用Shader）
    const shader = new PixelDissolveShader(this.ctx);
    for (let t = 0; t < 1.5; t += 0.016) {
      shader.render(this.target, t / 1.5);
      await this.sleep(16);
    }
  }

  async reform() {
    this.state = 'REFORM';
    // 新形态生长
    const newForm = this.player.getNewForm(this.target);
    for (let t = 0; t < 2.0; t += 0.016) {
      this.drawFormGrowth(newForm, t / 2.0);
      if (t > 1.5) {
        this.drawTraitIcons(newForm.traits, (t - 1.5) / 0.5);
      }
      await this.sleep(16);
    }
  }

  async adapt() {
    this.state = 'ADAPT';
    // 恢复控制 + 污染值增加
    this.player.pollution += 5;
    this.drawPollutionFlash();
    await this.sleep(500);
    this.state = 'IDLE';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 像素崩解Shader（GLSL）

```glsl
// pixelDissolve.frag
precision mediump float;

uniform sampler2D u_texture;
uniform float u_progress; // 0.0 to 1.0
uniform vec2 u_resolution;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 color = texture2D(u_texture, uv);
  
  // 像素化
  float pixelSize = mix(1.0, 20.0, u_progress);
  vec2 pixelUV = floor(uv * u_resolution / pixelSize) * pixelSize / u_resolution;
  color = texture2D(u_texture, pixelUV);
  
  // 随机消失
  float noise = random(pixelUV + u_progress);
  if (noise < u_progress) {
    color.a = 0.0;
  }
  
  // 偏移
  vec2 offset = vec2(
    (random(pixelUV) - 0.5) * u_progress * 50.0,
    (random(pixelUV + 0.5) - 0.5) * u_progress * 50.0
  );
  color = texture2D(u_texture, pixelUV + offset / u_resolution);
  
  gl_FragColor = color;
}
```

### 污染边框动画

```javascript
class PollutionBorder {
  constructor(canvas, pollutionValue) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pollution = pollutionValue;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // 计算边框宽度和扭曲程度
    const borderWidth = this.getBorderWidth();
    const distortion = this.getDistortion();
    
    ctx.save();
    
    // 绘制渐变边框
    const gradient = this.createGradient();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = borderWidth;
    
    // 应用扭曲
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = w * t;
      const y = 0 + Math.sin(t * Math.PI * 4 + Date.now() / 200) * distortion;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    ctx.restore();
  }

  getBorderWidth() {
    if (this.pollution < 30) return 4;
    if (this.pollution < 60) return 6;
    if (this.pollution < 80) return 8;
    return 12;
  }

  getDistortion() {
    if (this.pollution < 30) return 0;
    if (this.pollution < 60) return 2;
    if (this.pollution < 80) return 5;
    return 10;
  }

  createGradient() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    
    if (this.pollution < 30) {
      gradient.addColorStop(0, '#0f0');
      gradient.addColorStop(1, '#0f0');
    } else if (this.pollution < 60) {
      gradient.addColorStop(0, '#0f0');
      gradient.addColorStop(1, '#ff0');
    } else if (this.pollution < 80) {
      gradient.addColorStop(0, '#ff0');
      gradient.addColorStop(1, '#f00');
    } else {
      gradient.addColorStop(0, '#f00');
      gradient.addColorStop(0.5, '#a0f');
      gradient.addColorStop(1, '#f00');
    }
    
    return gradient;
  }
}
```

### 形态记忆槽组件

```javascript
class FormMemorySlot {
  constructor(forms, currentIndex) {
    this.forms = forms; // 最多5个形态
    this.currentIndex = currentIndex;
    this.cooldown = 0;
    this.maxCooldown = 3000; // 3秒冷却
  }

  render(ctx, x, y, width, height) {
    const slotWidth = width / this.forms.length;
    
    for (let i = 0; i < this.forms.length; i++) {
      const form = this.forms[i];
      const slotX = x + i * slotWidth;
      
      // 绘制槽位背景
      ctx.fillStyle = i === this.currentIndex ? 
        'rgba(100,50,200,0.3)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(slotX, y, slotWidth - 4, height);
      
      // 绘制形态剪影
      if (form) {
        this.drawFormSilhouette(ctx, form, slotX, y, slotWidth, height);
      } else {
        // 空槽显示锁
        this.drawLock(ctx, slotX, y, slotWidth, height);
      }
      
      // 绘制颜色编码边框
      ctx.strokeStyle = this.getFormColor(form);
      ctx.lineWidth = 2;
      ctx.strokeRect(slotX, y, slotWidth - 4, height);
    }
    
    // 绘制冷却遮罩
    if (this.cooldown > 0) {
      const progress = this.cooldown / this.maxCooldown;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(x, y, width * progress, height);
    }
  }

  drawFormSilhouette(ctx, form, x, y, w, h) {
    // 简化的剪影绘制
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    // 这里应该绘制实际的形态sprite
    ctx.fillRect(x + w/4, y + h/4, w/2, h/2);
    ctx.globalAlpha = 1.0;
  }

  drawLock(ctx, x, y, w, h) {
    ctx.fillStyle = '#666';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', x + w/2, y + h/2 + 8);
  }

  getFormColor(form) {
    if (!form) return '#666';
    
    const colorMap = {
      'human': '#cc9933',
      'titan': '#6688cc',
      'ghost': '#00ffcc',
      'swarm': '#cc6633',
      'hybrid': '#a0f'
    };
    
    return colorMap[form.type] || '#fff';
  }

  switchTo(index) {
    if (this.cooldown > 0) return false;
    if (index < 0 || index >= this.forms.length) return false;
    if (!this.forms[index]) return false;
    
    this.currentIndex = index;
    this.cooldown = this.maxCooldown;
    return true;
  }

  update(deltaTime) {
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - deltaTime);
    }
  }
}
```

---

## 参考游戏

- **附身动画**: Carrion（崩解效果）、Enter the Gungeon（像素化死亡）
- **污染系统**: Darkest Dungeon（压力系统）、Eternal Darkness（理智效果）
- **形态切换**: Hades（武器切换）、Dead Cells（装备快捷栏）
- **移动端操作**: Brawl Stars（虚拟摇杆）、Soul Knight（手势操作）

---

## 实现优先级

1. **P0（核心体验）**: 附身动画、遭遇界面重构
2. **P1（氛围营造）**: 污染边框、形态记忆槽
3. **P2（细节打磨）**: 幽灵怪物、特性触发特效
4. **P3（锦上添花）**: 高级Shader、粒子系统

---

## A/B测试方案

### 虚拟摇杆 vs 点击移动

**方案A：虚拟摇杆**
- 优点：精确控制、适合动作游戏
- 缺点：占用屏幕空间、学习成本

**方案B：点击移动**
- 优点：简单直观、不遮挡画面
- 缺点：精度较低、不适合快速反应

**测试指标**:
- 新手教程完成率
- 平均操作失误次数
- 玩家留存率（第1天/第7天）

**建议**: 提供选项让玩家自选，默认虚拟摇杆

---

## 更新日志

- 2026-04-02: 初版完成
