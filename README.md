# 寄生魔塔 / Parasite Tower

一款融合 Roguelike 地牢探索与寄生形态切换机制的移动端游戏。玩家扮演寄生体，通过附身不同宿主获取能力，在不断下沉的魔塔中生存。

## 游戏特色

- **附身系统** — 击败怪物后可附身其身体，继承属性与特性。HP 越低的目标越容易附身
- **三职业体系** — 泰坦（🔷 坦克/践踏）、幽灵（👻 潜行/背刺）、虫群（🦗 分裂/群攻），各有独立终极技能
- **污染机制** — 每次附身增加污染值（0-100），高污染触发幻觉、属性欺骗、画面扭曲，100% 时强制崩溃
- **形态记忆** — 最多保存 3 个形态，可随时切换（3 秒冷却）
- **进化路径** — 泰坦/幽灵/虫群三条进化树，消耗 EP 解锁被动增强
- **锚点存档** — 死亡后回滚至最近锚点，而非重头开始
- **50+ 种怪物** — 分布在 5 个区域，各有独特能力（护甲、狂暴、吸血、毒素等）

## 项目结构

```
parasite-tower/
├── android/                    # Android 客户端（WebView）
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/.../MainActivity.kt   # WebView 加载入口
│   │   │   ├── assets/
│   │   │   │   ├── index.html             # 游戏主体（HTML + Canvas + JS）
│   │   │   │   └── game-integration.js    # 增强战斗 UI（VS 对比/立绘/附身环）
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── cmd/server/main.go          # Go 后端入口（Gin, :8080）
├── internal/
│   ├── api/                    # HTTP 接口（/api/game/new, /api/game/action）
│   ├── entity/                 # 玩家/怪物/特性数据模型
│   ├── combat/                 # 战斗计算引擎
│   └── game/                   # 关卡生成
├── assets/static/              # Web 版静态资源
├── docs/
│   ├── UI_DESIGN_SPEC.md       # UI/UX 完整设计规范
│   ├── UI_UX_REFACTOR.md       # UI 重构设计文档
│   ├── audio-design.md         # 音频设计规范
│   ├── visual-specification.md # 视觉设计规范
│   └── monster-data.json       # 怪物数据库（50+ 种）
├── go.mod / go.sum
└── parasite-tower.apk          # 预编译 APK
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 客户端 | Android WebView + Kotlin |
| 游戏渲染 | HTML5 Canvas（纯 JS，无引擎） |
| 战斗 UI | game-integration.js（VS 双卡对比、呼吸动画、附身环） |
| 音效 | Web Audio API（程序化生成，无音频文件） |
| 后端 | Go + Gin |
| 数据 | 内存状态 + localStorage 存档 |

## 构建与运行

### 环境要求

- Android Studio（含 JBR 17）
- Android SDK 34
- Go 1.21+（后端可选）

### 构建 Android APK

```bash
cd android

# 使用 Android Studio 内置 JDK
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Debug 构建
./gradlew assembleDebug

# 安装到设备
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 启动后端（可选）

```bash
go build -o parasite-server ./cmd/server
./parasite-server
# 服务器启动在 :8080
```

## 游戏系统

### 战斗流程

```
遭遇怪物 → 查看 VS 对比 → 选择:
  ├─ FIGHT   — 回合制自动战斗（长按自动连续攻击）
  ├─ POSSESS — 长按 2 秒附身（成功率 = 基础率 + HP损失因子）
  └─ FLEE    — 逃跑
```

### 附身成功率公式

```
successRate = (0.6 × hpFactor + possessBonus) × 100
hpFactor   = 1 - (targetHP / targetMaxHP) × 0.6

满血怪物 ≈ 24%  |  半血 ≈ 48%  |  濒死 ≈ 84%
```

### 污染等级效果

| 污染值 | 视觉效果 | 游戏影响 |
|--------|---------|---------|
| 0-30 | 正常 | 无 |
| 31-50 | 边缘暗角 + 心跳音效 | 远处模糊 |
| 51-70 | 幻觉怪物出现 | 假怪物触碰消失 |
| 71-85 | RGB 分离 + 屏幕抖动 | 属性显示误差 |
| 86-99 | 画面撕裂 | 随机传送 |
| 100 | 屏幕碎裂 | 强制附身或死亡 |

### 职业终极技能

| 职业 | 终极技能 | 效果 | 持续 | 冷却 |
|------|---------|------|------|------|
| 泰坦 | 泰坦之怒 | HP×2, ATK+30, DEF+30 | 10 回合 | 15 层 |
| 幽灵 | 虚空行者 | 完全无敌（无法攻击） | 5 回合 | 20 层 |
| 虫群 | 虫群之心 | 释放 N 只分身（N=污染/10） | 8 回合 | 12 层 |

## 开发调试

```bash
# 查看 WebView 控制台日志
adb logcat -s "WebView"

# 清除应用数据（重置存档）
adb shell pm clear com.parasite.tower

# Chrome DevTools 远程调试（需 USB 连接）
# 访问 chrome://inspect
```

## 配置

| 参数 | 值 |
|------|-----|
| applicationId | com.parasite.tower |
| minSdk | 24 (Android 7.0) |
| targetSdk | 34 (Android 14) |
| versionName | 1.0.0 |

## 设计文档

详细设计规范见 `docs/` 目录：

- [UI/UX 设计规范](docs/UI_DESIGN_SPEC.md) — 整体布局、模块规格、色彩系统、动画时间轴
- [UI 重构文档](docs/UI_UX_REFACTOR.md) — 信息架构、遭遇界面、手势操作
- [音频设计](docs/audio-design.md) — 多层音频架构、区域主题音乐
- [视觉规范](docs/visual-specification.md) — 视觉风格定义
- [怪物数据库](docs/monster-data.json) — 50+ 种怪物完整数据
