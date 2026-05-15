# 技术架构文档 / Technical Architecture

> 文档级别：**P1 · 技术人员**
> 配套版本：v1.2.0（CHANGELOG）/ Android `versionName=1.1.0`（待同步）
> 最后更新：2026-05-12

---

## 1. 一句话架构

**Android Kotlin 壳 + WebView 装载纯 JS 单页游戏；Go 服务仅提供静态托管 + 排行榜（计划中）。所有游戏规则在前端 JS。**

```
┌─────────────────────────────────────────┐
│  Android APK (com.parasite.tower)       │
│  ┌─────────────────────────────────┐    │
│  │ MainActivity (Kotlin)           │    │
│  │   └─ WebView (硬件加速)          │    │
│  │      └─ assets/index.html       │    │
│  │         ├─ HTML/CSS UI         │    │
│  │         ├─ Canvas 2D 渲染       │    │
│  │         ├─ Web Audio 合成       │    │
│  │         ├─ localStorage 存档    │    │
│  │         └─ 33 个 JS 模块         │    │
│  └─────────────────────────────────┘    │
└────────────┬────────────────────────────┘
             │ (仅排行榜)
             ▼
┌─────────────────────────────────────────┐
│  Go 服务 (parasite-tower-leaderboard)   │
│  Gin + SQLite，独立项目                  │
│  /api/v1/runs · /api/v1/leaderboard     │
└─────────────────────────────────────────┘
```

> ⚠️ **现状提醒**：本仓库的 `cmd/server/main.go` 当前只是 health + 静态文件托管（`api.SetupRoutes` 仅做 web 镜像），**排行榜后端尚未实现**——计划放在独立项目 `parasite-tower-leaderboard`，详见 `.claude/plans/lucky-crafting-eich.md`。

---

## 2. 项目宪法（架构红线）

> **APK 的唯一权威规则源是前端 JS（`android/app/src/main/assets/`）。**
> Go 后端只允许两类职责：(1) 存储与查询；(2) 提交时合理性校验。
> 禁止在 Go 包里维护战斗/附身/进化/楼层公式的镜像版。

完整版见 `CLAUDE.md`。**`internal/` 下现有的 web 镜像逻辑已冻结**，不删除、不增删、不再同步 JS 改动。

---

## 3. 仓库目录

```
parasite-tower/
├── android/                       # Android 客户端（构建产物）
│   ├── app/
│   │   ├── build.gradle.kts       # 签名 + version.js 自动生成
│   │   ├── parasite-tower.jks     # Release Keystore（密码外移到 local.properties）
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/parasite/tower/MainActivity.kt    # ~50 行 WebView 壳
│   │       ├── res/               # mipmap 图标 + xml/file_paths.xml
│   │       └── assets/            # ★ 游戏全部逻辑
│   ├── gradlew / gradlew.bat
│   └── parasite-tower-release.apk # 固定输出名
│
├── cmd/server/main.go             # Go 入口（health + 静态托管）
├── internal/api/handler.go        # Web 部署路径镜像（已冻结）
├── go.mod / go.sum
│
├── docs/                          # 设计文档
├── Makefile                       # build/run/test/docker/apk 统一入口
├── Dockerfile                     # 多阶段 alpine 构建（仅服务端）
├── docker-compose.yml             # 端口映射 + 资源限制
├── CHANGELOG.md
├── 游戏设计文档.md
├── README.md
└── CLAUDE.md                      # 项目宪法
```

---

## 4. 客户端结构

### 4.1 Android 壳

| 文件 | 职责 |
|---|---|
| `MainActivity.kt` | WebView 装载 `file:///android_asset/index.html`，启用 JS + DOM Storage |
| `AndroidManifest.xml` | 单 Activity（portrait 锁定）+ INTERNET 权限 + FileProvider（导出存档用）|
| `build.gradle.kts` | minSdk 24 / targetSdk 34 / R8 + ResShrink；Release 签名外置 |

**Manifest 关键配置**：
- `largeHeap="true"` — 长局可能占用较多内存
- `hardwareAccelerated="true"` — Canvas 性能基础
- `usesCleartextTraffic="true"` — 排行榜本地调试（10.0.2.2）需要；上线后建议改 networkSecurityConfig 收紧

**版本注入机制**：`build.gradle.kts:53-77` 的 `generateVersionJs` 任务在 preBuild 时生成 `assets/version.js`，写入：
```js
window.PT_VERSION = 'v1.1.0';
window.PT_VERSION_CODE = 2;
window.PT_API_BASE = 'http://10.0.2.2:8080';  // 可由 PT_API_BASE 环境变量覆盖
```

### 4.2 Web 资源加载顺序

`index.html` 共 1349 行，结构：

| 段 | 行号 | 内容 |
|---|---|---|
| 头部 | 1-128 | meta + 内联静态 CSS（splash/loading）|
| 早期脚本 | 129-136 | i18n + version + data + bestiary + modes |
| 内嵌业务 | 155-1308 | DOM 模板 + 早期初始化代码 |
| Core 加载 | 845-848 | event-bus / game-data / render-utils |
| 启动序列 | 1308-1345 | save → identity → leaderboard → 21 个 systems → ui/panels |

**关键加载约束**：
- `data.js` 必须在 `modes/*.js` 之前（mode 引用 monster 池）
- `systems/render.js` 必须在 `gameLoop(0)` 调用之前（v1.2.0 修复过的崩溃，**别再动**）
- `core/identity.js` 必须在 `leaderboard-api.js` 之前
- `ui/nickname.js` 必须在 `prologue.js` 之前（首次进游戏弹窗钩子）

### 4.3 33 个 JS 模块（按角色）

#### `core/`（5 个，共享基础）

| 模块 | 行 | 职责 |
|---|---|---|
| `event-bus.js` | 8 | 极简 publish/subscribe |
| `game-data.js` | 336 | 顶层 `game` 对象初始状态 + reset 工厂 |
| `render-utils.js` | 104 | Canvas 工具函数（圆角矩形/渐变/文字阴影）|
| `save-system.js` | 216 | `saveGame()` / `loadGame()` / 导出导入 / 多档管理 |
| `identity.js` | 34 | UUID + 昵称 localStorage 包装（排行榜上传基础） |
| `leaderboard-api.js` | 113 | fetch 封装：submit / fetchBoard / fetchMe |

#### `data.js` + `data/bestiary-info.js`（数据层）

游戏所有静态数据：怪物、商店、进化、皮肤、结局。详见 `docs/data-config-guide.md`。

#### `modes/`（4 个，模式注册）

| 模块 | 行 | 职责 |
|---|---|---|
| `rules.js` | — | 共享规则元数据（最低公约数）|
| `classic.js` | — | 经典 50 层模式参数 |
| `short.js` | 1231 | **短局 12 层完整实现**：倒计时、三浪、崩溃序列、结算报告、海报 |
| `registry.js` | — | `GameModes.select(modeId)` 注册中心 |

#### `systems/`（24 个，游戏逻辑核心）

> 命名约定：每个 `systems/*.js` 通过全局函数和 `game.*` 对象交互，**没有 import 系统**——加载顺序就是依赖顺序。

| 模块 | 行 | 职责 |
|---|---|---|
| `combat.js` | 745 | ★ 战斗回合主循环、伤害公式、特性触发 |
| `negotiate.js` | 431 | ★ 附身成功率计算、谈判 4 策略、UI |
| `monster-ai.js` | 224 | 怪物行为决策（普攻/技能/特殊）|
| `class-abilities.js` | — | 5 职业终极技能 + 主动技能（潜行、召唤分身等）|
| `pollution.js` | 407 | 污染累积、视觉等级、血祭技能、崩溃判定 |
| `forms.js` | 588 | 形态库 / 槽位切换 / 死亡形态标记 |
| `anchor.js` | — | 锚点存档（v1.2.0 加 shortRemaining 字段）|
| `death-transfer.js` | 664 | 死亡 overlay + rollbackToAnchor + 复活/孤狼/濒死转移 |
| `floor.js` | 547 | 楼层生成、tile 类型、移动、撞墙 |
| `floor-nav.js` | 415 | 下楼 + 进化效果工厂 `getEvolutionEffect(key)` |
| `render.js` | 1450 | ★ Canvas 渲染、粒子、迷你地图，**末尾启动 gameLoop(0)** |
| `audio.js` | 935 | Web Audio 程序化合成（韩式悬疑 BGM + SFX） |
| `messages.js` | — | 消息面板、战斗日志（`#combat-log` v1.2.0+ column-reverse） |
| `tutorial.js` | 232 | 5 阶段强制教程 + 柔性气泡 |
| `strategy-hints.js` | 132 | 8 条状态驱动反应式提示（v1.2.0 新增）|
| `aha-moment.js` | — | 首次附身 4 幕电影演出 |
| `story.js` | 463 | 主线 / 隐藏剧情、结局、新游戏+ |
| `fragments.js` | 355 | 碎片收集 |
| `curse.js` | — | 诅咒/祝福系统 |
| `traits.js` + `trait-hooks.js` | — | 特性词表与触发钩子 |
| `special-floors.js` | 273 | 楼层签名（和平区/再生之地等）|
| `ui-overlays.js` | 446 | 战斗/事件/碎片/进化/崩溃覆盖层 |
| `dlc-shop.js` | — | DLC 商城面板（职业/皮肤）|
| `achievements.js` + `achievement-celebration.js` | — | 成就解锁与庆典动画 |
| `meta-progress.js` | 282 | 跨局元进度（首发版仅记录跑数 + dismissed hints）|
| `poster-share.js` | 435 | 分享海报生成（短局结算 / 成就）|

#### `ui/`（8 个，界面层）

| 模块 | 行 | 职责 |
|---|---|---|
| `prologue.js` | 677 | 序章动画 + 模式选择 + 每日 Modifier 计算 |
| `class-select.js` | 367 | 5 职业选择页面 + DLC 解锁状态 |
| `panels.js` | 327 | 主菜单、设置、隐私政策、导入导出 UI |
| `encounter-screen.js` | 525 | 遭遇前 VS 卡片对比 |
| `nickname.js` | — | 首次输入弹窗（排行榜前置） |
| `echo-altar.js` | — | 净化/职业转换/诅咒祭坛 UI |
| `login-bonus.js` | — | 每日登录奖励 |
| `spore-particles.js` | — | 主菜单孢子飘动背景 |

### 4.4 全局状态

```
window.game = {
  player: { hp, maxHp, atk, def, traits, pollution, evoPoints,
            formType, possessed, evolution, playerClass, ... },
  forms: [/* 5 槽位 */],
  currentForm: 0,
  floor: 1,
  monsters: [...],
  target: null,             // 当前战斗对象
  anchor: { player, forms, floor, shortRemaining, ... },
  _runEnded: false,         // 防止结束后再 autosave
  _floorsWithoutPossess: 0, // 策略提示输入
  _shopBuyCount: { heal: N, ... },
  _dailyModifier: { id, name, mods },
  ...
}

window.ShortMode = { _remaining, _started, _crashing, tick(), ... }
window.PT_LANG = { _current, t(), set(), toggle() }
window.PT_VERSION / PT_API_BASE
window.StrategyHints / Tutorial / GameModes / ...
```

> **没有模块系统**——所有变量挂 `window`。新增模块需自行注意命名冲突。

### 4.5 存档

| Key | 内容 | 写入时机 |
|---|---|---|
| `pt_save` | 通用主存档（经典模式）| 每楼层 + 关键事件后 |
| `pt_save_short` | 短局模式存档（v1.2.0 修复 restartShort 时清理）| 同上 |
| `pt_save_classic` | 经典模式备用 | 同上 |
| `parasiteTowerSave` | 旧版 key（兼容）| 已废弃，restartShort 会一并清理 |
| `pt_endings` / `pt_achievements` / `pt_affinity` | 长期成长（不被 restart 清）| 达成时 |
| `pt_run_count` / `pt_first_run_done` | 教程触发条件 | 开局 / 附身首次 |
| `pt_lang` | 语言偏好 | 切换时 |
| `pt_uid` / `pt_nickname` | 排行榜身份 | 首次生成 / 用户修改 |
| `pt_hint_dismissed_<id>` | 提示永久关闭标记 | 用户点 ✕ 时 |
| `pt_leaderboard` | 本地排行榜 | 短局结算 |

---

## 5. 后端（Go）

### 5.1 当前状态

`cmd/server/main.go`（25 行）只做：
- `GET /health` 健康检查
- `api.SetupRoutes(r)` — `internal/api/handler.go` 是冻结的 web 镜像（不再演进）

### 5.2 排行榜服务（计划，独立仓库）

详见 `.claude/plans/lucky-crafting-eich.md`：

```
parasite-tower-leaderboard/    # 独立项目
├── main.go                    # ~400 行
├── go.mod / go.sum
└── leaderboard.db             # SQLite，自动创建
```

**接口**：
| Method | Path | 说明 |
|---|---|---|
| `POST` | `/api/v1/runs` | 提交成绩 |
| `GET`  | `/api/v1/leaderboard?type=score&period=all` | 综合榜 |
| `GET`  | `/api/v1/leaderboard?type=speed` | 速通榜 |
| `GET`  | `/api/v1/leaderboard?type=daily&seed=20260512` | 每日榜 |
| `GET`  | `/api/v1/leaderboard?type=class&class=titan` | 职业榜 |
| `GET`  | `/api/v1/me?uid=xxx` | 我的最佳 + 百分位 |
| `POST` | `/admin/ban` | 封号（X-Admin-Token） |

**反作弊**（MVP）：客户端版本号 + 提交参数合理性上界 + 人工封号。HMAC 签名留 v2。

---

## 6. 构建与运行

### 6.1 Android APK

```bash
cd android
./gradlew assembleRelease
# 输出固定路径：android/parasite-tower-release.apk（build.gradle.kts:64-66 重命名）
```

**Keystore 密码**优先从 `local.properties` 读取，回落到环境变量 `KEYSTORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD`。

**注入自定义 API 地址**：
```bash
PT_API_BASE=https://leaderboard.example.com ./gradlew assembleRelease
# 或在 ~/.gradle/gradle.properties 写 PT_API_BASE=...
```

### 6.2 后端

```bash
make build      # 产物：./parasite-server
make run        # 启动监听 :8080
make test       # go test ./... -v -cover
make docker     # docker build -t parasite-tower .
make docker-up  # docker compose up -d
```

### 6.3 调试技巧

| 场景 | 做法 |
|---|---|
| 看 WebView console | `adb logcat | grep "chromium"` 或 Chrome DevTools `chrome://inspect` |
| 模拟器访问宿主机 | `10.0.2.2` 映射到宿主 `127.0.0.1` |
| 重置存档 | `adb shell pm clear com.parasite.tower` |
| 切语言 | 设置面板 → 语言；或 localStorage `pt_lang=en` 刷新 |
| 跳过教程 | localStorage `pt_first_run_done=1` |
| 强制每日 Modifier | localStorage `pt_force_daily=<seed>` |

---

## 7. 关键性能策略

| 维度 | 策略 |
|---|---|
| 包体 | 完全无音频/图片资源——音效程序化合成，怪物 Canvas 路径绘制 |
| 渲染 | `_renderDirty` 标记 + 局部重绘；非战斗时降帧 |
| 战斗日志 | 单容器 `flex-direction: column-reverse` + scrollTop=0，无需 reflow |
| 内存 | 战斗日志有上限（旧条目自动裁剪）；监听器集中注册避免重复 |
| 存档 | 单条 JSON，**全量覆写**而非增量；写入有 1s debounce |
| 启动 | DOMContentLoaded → 主菜单；首屏 splash 3.8s |

---

## 8. 已知技术债

| 项 | 影响 | 后续 |
|---|---|---|
| versionName 1.1.0 vs CHANGELOG 1.2.0 | 玩家看到的版本号过时 | 下次发版必须同步 |
| `internal/api/handler.go` 冻结的 web 镜像 | 约 1500 行死代码 | 确认无人使用后整体删除 |
| 无 ES module 系统，全 window 全局 | 命名冲突风险 | 重写成本太高，维持现状 |
| `pixi.min.js` 留存在 assets | 1108 行未引入 | 如确实未使用可删除 |
| 进化树「待落地」effect 键 | 机甲/血族部分被动不生效 | 见 `data-config-guide.md §3.2` |
| Go 后端两套部署路径并存 | 概念混乱 | web 镜像入冷藏，新功能只走独立 leaderboard 项目 |
| `assets/index.html` 仍 1349 行 | 含大量内联 DOM 模板，但已无业务逻辑 | 可继续拆 HTML 片段，优先级低 |

---

## 9. 关键文件索引（按"出问题先看哪里"排序）

| 症状 | 第一嫌疑文件 |
|---|---|
| 战斗数值不对 | `systems/combat.js` |
| 附身成功率不对 | `systems/negotiate.js` |
| 进化效果没生效 | `systems/floor-nav.js:407 getEvolutionEffect` + `data.js: evolutionPaths` |
| 死亡后流程异常 | `systems/death-transfer.js` |
| 短局倒计时/结算 | `modes/short.js` |
| 怪物不渲染 | `systems/render.js` + `data.js: monsterSilhouettes` |
| 存档丢失 | `core/save-system.js` + `localStorage` keys（§4.5） |
| 教程卡住 | `systems/tutorial.js`（强制模式守卫）|
| i18n 没翻译 | `lang.js`（缺键就回落原中文）|
| 构建失败 | `android/app/build.gradle.kts:53 generateVersionJs` |
| WebView 白屏 | DevTools 看 `chrome://inspect` 的 console |

---

## 10. 后续演进建议（v2 候选）

1. 抽 schema 校验：启动时扫描 `evolutionPaths` 中所有 effect 键是否被消费（消除「待落地」长尾）
2. 排行榜独立项目正式上线 + HMAC 签名
3. 删除 `internal/` 冻结镜像；后端只保留 `cmd/server/main.go`
4. 拆掉 `index.html` 残余 DOM 模板到独立 `templates/*.html`，启用 fetch 注入
5. 删除未使用的 `pixi.min.js`
6. 接入 Crashlytics 或自建 telemetry 收集 WebView console.error
