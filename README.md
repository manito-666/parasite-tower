# 寄生魔塔 / Parasite Tower

一款融合 Roguelike 地牢探索与寄生形态切换机制的移动端游戏。玩家扮演寄生体，通过附身不同宿主获取能力，在生物朋克风格的魔塔中生存。

## 视觉风格

**生物朋克 x 新艺术运动 (Biopunk x Art Nouveau)**

以有机腔体建筑、发光菌膜与虹彩甲壳为视觉语言：
- 底色: 深紫黑 `#0d0818` / `#080514`（生物深腔）
- 生物青: `#00ffd0`（荧光菌膜冷光）
- 生物洋红: `#ff006e`（细胞核活性色）
- 神经紫: `#b455ff` / `#8844ff`（神经脉冲传导）
- 菌丝层: `#2d1b4e`（有机壁面）

所有怪物均使用 Canvas `shadowColor/shadowBlur` 实现生物发光，翅膜/拖尾通过 `hsla(H, 100%, 70%, a)` 实现随时间虹彩偏移。

## 游戏特色

- **三模式** — 短局 12 层快速体验（15 分钟）+ 远征 20 层章节推进（25-40 分钟）+ 经典 50 层全程模式（约 2 小时）
- **附身系统** — 击败怪物后可附身其身体，继承属性与特性。HP 越低的目标越容易附身
- **三职业体系** — 泰坦（坦克/践踏）、幽灵（潜行/背刺）、虫群（分裂/群攻），各有独立终极技能
- **污染机制** — 每次附身增加污染值（0-100），高污染触发幻觉、属性欺骗、画面扭曲，100% 时强制崩溃
- **形态记忆** — 最多保存 5 个形态槽，可随时切换（3 秒冷却）
- **进化路径** — 泰坦/幽灵/虫群三条进化树，消耗 EP 解锁被动增强
- **形态羁绊** — 反复附身同类型怪物提升亲密度，解锁永久属性加成
- **锚点存档** — 死亡后回滚至最近锚点，而非重头开始；手动固化记忆消耗 200EP
- **污染技能** — 污染值达阈值解锁特殊战斗/探索技能
- **38 种怪物** — 分布在 5 个区域（实验区域→培育巢穴→污染核心→深渊区域→终焉之地），各有独特能力
- **怪物图鉴** — 收集已遭遇的怪物，查看属性与特性
- **隐藏剧情** — 满足条件触发深层叙事碎片
- **诅咒系统** — 高级区域附加负面效果
- **首次附身演出** — 新手首次附身触发 4 幕电影化"啊哈时刻"演出
- **中英双语** — 游戏内一键切换中/英文

## 项目结构

```
parasite-tower/
├── android/                        # Android 客户端（WebView 壳）
│   ├── app/src/main/
│   │   ├── java/.../MainActivity.kt
│   │   ├── assets/                 # ← 全部游戏逻辑
│   │   │   ├── index.html          # 主入口 (~1170 行)
│   │   │   ├── styles.css          # 全局样式 (~1384 行)
│   │   │   ├── data.js             # 怪物/商店/Boss 数据
│   │   │   ├── lang.js             # 中英文翻译
│   │   │   ├── game-integration.js # 增强战斗 UI
│   │   │   ├── core/               # event-bus, game-data, render-utils, save-system
│   │   │   ├── systems/            # 24 个系统模块
│   │   │   │   ├── combat.js       # 战斗逻辑
│   │   │   │   ├── negotiate.js    # 附身/谈判
│   │   │   │   ├── audio.js        # Web Audio 合成音效+BGM
│   │   │   │   ├── render.js       # Canvas 渲染
│   │   │   │   ├── tutorial.js     # 新手引导
│   │   │   │   ├── aha-moment.js   # 首次附身电影演出
│   │   │   │   ├── forms.js        # 形态管理
│   │   │   │   ├── pollution.js    # 污染系统+技能
│   │   │   │   ├── anchor.js       # 锚点/存档点
│   │   │   │   ├── story.js        # 隐藏剧情
│   │   │   │   ├── curse.js        # 诅咒系统
│   │   │   │   ├── fragments.js    # 碎片收集
│   │   │   │   ├── achievements.js # 成就系统
│   │   │   │   └── ...             # floor, monster-ai, traits, etc.
│   │   │   ├── ui/                 # panels.js, prologue.js, class-select.js
│   │   │   └── modes/             # classic.js, short.js, rules.js, registry.js
│   │   └── AndroidManifest.xml
│   └── app/build.gradle.kts       # 签名配置 + APK 固定命名
├── cmd/server/                     # Go 后端入口
├── internal/                       # Go 后端逻辑
├── docs/                           # 设计文档
│   ├── visual-specification.md     # 视觉规范
│   ├── UI_DESIGN_SPEC.md          # UI/UX 设计规范
│   ├── audio-design.md            # 音频设计
│   ├── monster-data.json          # 怪物数据库
│   ├── store-listing.md           # 应用商店文案
│   └── evaluation-report-v1.0.0.md # 评估报告
├── Makefile                        # 统一命令入口
├── Dockerfile                      # 多阶段构建
├── docker-compose.yml              # 一键部署
├── CHANGELOG.md
├── 游戏设计文档.md
├── go.mod / go.sum
└── README.md
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 客户端 | Android WebView + Kotlin |
| 游戏渲染 | HTML5 Canvas 2D（纯 JS，无引擎，~16500 行，已模块化为 33 个 JS 文件） |
| 视觉风格 | 生物朋克 x 新艺术运动，多层渐变+CSS粒子+玻璃质感 |
| 战斗 UI | game-integration.js（VS 双卡对比、呼吸动画、附身环） |
| 音效 | Web Audio API（程序化合成，无音频文件，韩式悬疑风 BGM） |
| 后端 | Go 1.21 + Gin（会话管理、速率限制、鉴权） |
| 部署 | Docker（alpine 多阶段构建）+ docker-compose |
| 数据 | localStorage 存档（支持 Base64 导出/导入） |
| 国际化 | 中英双语（lang.js 一键切换） |

## 规则权威性

> **APK 的唯一权威规则源是前端 JS（`android/app/src/main/assets/`）。**
>
> - Android APK 构建不依赖后端服务 — `./gradlew assembleRelease` 完全离线
> - 所有游戏逻辑、战斗计算、怪物数据均在客户端 JS 中实现

## 构建与运行

### 环境要求

- Android Studio（含 JBR 17）+ Android SDK 34
- Go 1.21+（后端）
- Docker / Docker Compose（部署）

### 构建 Android APK

```bash
cd android

# 使用 Android Studio 内置 JDK
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Release 签名构建（固定输出路径）
./gradlew assembleRelease
# 输出: app/build/outputs/apk/release/parasite-tower-release.apk
```

> 签名凭据从 `android/local.properties` 读取，环境变量 `KEYSTORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD` 作为 fallback。

### Makefile 快捷命令

```bash
make build       # 编译 Go 服务端
make run         # 编译并运行
make test        # 运行单元测试
make apk         # 打包 Android APK
make docker      # 构建 Docker 镜像
make docker-up   # 启动容器
make docker-down # 停止容器
make clean       # 清理构建产物
```

### Docker 部署

```bash
# 一键启动（8080 端口，256M 内存限制，日志轮转）
docker compose up -d

# 健康检查
curl http://localhost:8080/health
```

## 游戏模式

### 经典模式（50 层）

完整的 Roguelike 塔探索体验，5 个区域、5 个 Boss、四种结局。单局约 1-2 小时。

### 短局模式（12 层）

15 分钟快速体验，采用"三浪"情绪设计：

| 阶段 | 层数 | 设计 | 节奏 |
|------|------|------|------|
| Wave 1 | L1-L3 | 权力幻想 | 弱怪成群，高回报，"我在收割" |
| 过渡 | L4 | 失控前兆 | 难度骤升，首次污染 |
| Wave 2 | L5-L7 | 压力反转 | 精英密集，EP 丰厚，"刚好打得过" |
| 过渡 | L8 | 污染深渊 | 怪少但极强，污染飙升 |
| Wave 3 | L9-L11 | 绝望反击 | 极限战斗，最高回报 |
| 终章 | L12 | 崩溃 | 不可能全清，崩溃必然 |

逐层参数独立控制：怪物 HP/ATK 缩放、怪物数量、精英概率、EP 倍率、碎片掉率、每层污染、附身污染。

## 游戏系统

### 战斗流程

```
遭遇怪物 -> 查看 VS 对比 -> 选择:
  |-- FIGHT   — 回合制自动战斗（长按自动连续攻击）
  |-- POSSESS — 附身（成功率 = 基础率 + HP损失因子）
  '-- FLEE    — 逃跑
```

### 附身成功率公式

```
successRate = (0.6 x hpFactor + possessBonus) x 100
hpFactor   = 1 - (targetHP / targetMaxHP) x 0.6

满血怪物 ~ 24%  |  半血 ~ 48%  |  濒死 ~ 84%
```

### 污染等级效果

| 污染值 | 视觉效果 | 游戏影响 |
|--------|---------|---------|
| 0-30 | 正常 | 无 |
| 31-50 | 神经紫边缘暗角 + 心跳音效 | 远处模糊 |
| 51-70 | 幻觉怪物出现（生物青半透明） | 假怪物触碰消失 |
| 71-85 | RGB 分离 + 屏幕抖动 | 属性显示误差 |
| 86-99 | 画面撕裂，洋红闪烁 | 随机传送 |
| 100 | 屏幕碎裂（菌膜崩解） | 强制附身或死亡 |

### 职业终极技能

| 职业 | 终极技能 | 效果 | 持续 | 冷却 |
|------|---------|------|------|------|
| 泰坦 | 泰坦之怒 | HP x 2, ATK+30, DEF+30 | 10 回合 | 15 层 |
| 幽灵 | 虚空行者 | 完全无敌（无法攻击） | 5 回合 | 20 层 |
| 虫群 | 虫群之心 | 释放 N 只分身（N=污染/10） | 8 回合 | 12 层 |

## 开发调试

```bash
# 查看 WebView 控制台日志
adb logcat -s "PT-JS"

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
| versionName | 1.2.0（CHANGELOG）/ 1.1.0（gradle，待同步） |
| 签名 | parasite-tower.jks（Release 自动签名） |

## 设计文档

详细设计规范见 `docs/` 目录：

- [项目白皮书](docs/whitepaper.md) — P0 全员参考：定位、规模、路线图、风险、文档索引
- [玩法速览手册](docs/quick-play-guide.md) — P0 玩家/合作伙伴：5 分钟看懂全部机制
- [数据配置指南](docs/data-config-guide.md) — P0 开发/策划：怪物/进化/商店字段定义与字段消费位置
- [技术架构文档](docs/tech-architecture.md) — P1 技术：33 个 JS 模块依赖、构建链、后端规划
- [视觉规范](docs/visual-specification.md) — P2 设计：生物朋克 × 新艺术运动视觉语言、色彩系统、渲染规范
- [UI/UX 设计规范](docs/UI_DESIGN_SPEC.md) — P2 设计：整体布局、模块规格、色彩系统、动画时间轴
- [音频设计](docs/audio-design.md) — 音频：多层音频架构、区域主题音乐
- [怪物数据库](docs/monster-data.json) — 38 种怪物完整数据
- [应用商店文案](docs/store-listing.md) — 上架描述、关键词、分级
- [评估报告 v1.2.0](docs/evaluation-report-v1.2.0.md) — P2 运营：当前版本上线评估
- [评估报告 v1.0.0](docs/evaluation-report-v1.0.0.md) — 历史快照
