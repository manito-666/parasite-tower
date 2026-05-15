# Changelog

## [1.3.1] - 2026-05-15

### 优化

- **死亡动画增强**：死亡瞬间增加红色闪光 + 屏幕震动前置动画；overlay 改为 1.2s 多阶段淡入（白闪→红脉冲→暗恢复）；新增 CRT 扫描线、红色渐晕脉冲、增强 glitch 动画（skewX + clip-path 切割 + 3s 爆发抖动）；进度条改为两段式（快冲 60% + 慢填满）
- **死亡界面文案**：增加氛围文字"当前寄生链路已中断，战斗结构失稳。系统正在回收本次迭代残响。"（短局崩溃画面 + 经典/远征死亡覆盖层）
- **模式选择界面**：返回按钮移至左上角；卡片布局紧凑化（gap/padding/字号缩减）；标题 `white-space:nowrap` 防换行；短局图标 🧬→⚡

### 修复

- **战斗日志显示顺序**：修复 `log.style.display='block'` 覆盖 `flex-direction:column-reverse` 的问题，战胜/战败信息现在正确显示在顶部
- **远征模式战斗界面不弹出**：修复 `backToTitle()` 设置 `style.display='none'` 导致 `classList.add('active')` 无法覆盖的优先级问题
- **退出不保存删除所有存档**：`startNewGame()` 从 `clearAllGameData()` 改为仅删除当前模式存档 `deleteSave(mid)`
- **远征模式存档支持**：主界面新增远征存档卡片，支持继续远征游戏；`loadGame()` 增加远征存档恢复逻辑
- **存档卡片布局**：两张卡紧凑并排，第三张左右滑动查看；按最近时间排序（最新在前）
- **战斗日志滚动**：8 处 `scrollTop=0` 改为 `scrollTop=log.scrollHeight`，配合 `column-reverse` 显示最新内容

### 文件改动

- `systems/death-transfer.js` — 死亡预动画序列 + 进度条 class 动画
- `styles.css` — 死亡动画 CSS 增强 + 模式选择布局优化
- `index.html` — 远征存档卡片 + 死亡氛围文字 + 模式选择结构调整
- `modes/short.js` — 崩溃画面增加氛围文字
- `systems/combat.js` — 战斗日志 scrollTop 修复
- `systems/negotiate.js` — 谈判日志 scrollTop 修复
- `systems/story.js` — backToTitle overlay 清理方式修复
- `systems/ui-overlays.js` — startNewGame 改为模式级删除
- `ui/encounter-screen.js` — 战斗 overlay 显示修复 + 日志 display 修复
- `ui/prologue.js` — 存档卡片排序 + 远征卡填充
- `core/save-system.js` — 远征存档支持
- `lang.js` — 新增死亡氛围文字翻译

### 技术变更

- versionCode: 5 → 6, versionName: 1.3.0 → 1.3.1

## [1.3.0] - 2026-05-14

### 新功能

- **远征模式（Expedition Mode）**：介于短局（12 层/15 分钟）与经典（50 层/2 小时）之间的中时长正式主模式
  - 20 层 / 25-40 分钟 / 4 章节（每 5 层一章：前厅→裂变→深层→终域）
  - 章节 Boss 在 F5/F10/F15/F20；F10 自动设置章节锚点
  - F6/F11 触发路线选择；F8/F18 整备祭坛；F5 镜像事件
  - F3 首次成长选择，F13 第二次大成长跳点
  - 4 区映射（F1-5→Zone1, F6-10→Zone2, F11-15→Zone3, F16-20→Zone4）
  - 独立逐层曲线表 `EXPEDITION_FLOOR_CURVE`（hpScale/atkScale/count/eliteRate/epMult/fragRate/pollAdd/possessPollMult）
  - 模式参数：`hpMult:0.9 pollutionRate:0.85 xpMult:1.2 timeLimit:0`（污染压力低于经典，EP 收益高于经典）
  - 结算画面采用"章节收束"平静风格（非短局崩溃序列），显示到达层/附身/最久宿主/评分
  - 模式选择卡片排序：短局 → 远征 → 经典
  - 独立存档键 `pt_save_expedition`，与其他模式互不干扰

### 文件改动

- 新增 `modes/expedition.js`（核心曲线 + ExpeditionMode + 结算）
- `modes/registry.js` 增加 `isExpedition()` 检测
- `index.html` 加载远征脚本 + 增加模式卡片
- `systems/floor.js` zone 映射/Boss 检测（floor%5===0）/怪物数/HP-ATK 缩放/精英率
- `systems/floor-nav.js` 污染曲线/路线触发/祭坛/章节锚点/转场文案
- `systems/combat.js` EP 倍率曲线读取
- `systems/fragments.js` 碎片掉率曲线读取
- `systems/negotiate.js` 附身污染倍率曲线读取

### 技术变更

- versionCode: 4 → 5, versionName: 1.2.1 → 1.3.0

## [1.2.1] - 2025-05-14

### 修复

- 附身按钮"❌ 已破裂"文字超框 → 缩短为"破裂"（encounter-screen / ui-overlays / negotiate）
- 底部日志 msg-panel 精确适配 3 行显示（所有分辨率），去除 toast 气泡样式改为紧凑行
- 小屏（≤380px 宽 / ≤680px 高）日志同样保证 3 行可见
- 教程堆叠：加入 2.5s 冷却防止多个引导同时弹出

## [1.2.0] - 2026-05-07

### 新功能

- **首局强制教程（硬强制）**：新账号首局必须完成"移动→击杀→附身"三步才能下楼
  - 新增 `pt_first_run_done` localStorage 旗标，附身成功后置位
  - 新增 `pt_run_count` localStorage 计数，每次开新游戏自增
  - 教程前 3 步（move/attack/possess）标记 `required:true`，强制模式下隐藏"知道了 ✓"按钮，背板设为 `pointer-events:none` 仅允许点击高亮目标
  - `dismissTutorial(fromAction)` 加守卫：force + required 时仅匹配 fromAction 才能关闭
  - 楼梯 tile 与 `goToFloor()` 双重门禁：`_forceTutorial && _tutorialStage<2` 时禁止下楼
- **策略提示系统（低频精准 + 分层）**：新文件 `systems/strategy-hints.js`
  - 8 条游戏状态驱动的反应式提示：低 HP、高污染、污染临界、3 层未附身、可进化、精英怪、死槽提示、撞墙
  - 分层：`tier:'basic'` 仅 `pt_run_count<=3` 显示，`tier:'advanced'` 始终显示
  - 单局每条仅 1 次，全局 90s 冷却，✕ 关闭后写 `pt_hint_dismissed_{id}` 永久不再出
  - 钩子点：`floor:change` / `combat:end` / `move` / `wall_bump` / `pollution:tick`
- **Splash 文字可读性修复**：开场动画英文 logo 字号 10px→12px、颜色 0.5α→0.85α、添加文字阴影；splash 总时长 2.8s→3.8s，logo 提前 0.3s 显示，完整可视时间从 0.3s 延长到约 1.9s

### 模块化拆分（index.html → systems/*.js）

将 4400+ 行的 `index.html` 拆分到独立模块，最终 1150 行：

- `systems/dlc-shop.js` — DLC 商城面板
- `systems/tutorial.js` — 5 阶段强制教程 + 柔性气泡 + 详情弹窗
- `systems/story.js` — 主线/隐藏剧情、结局、新游戏+
- `systems/forms.js` — 形态库、附身存储、形态切换
- `systems/render.js`（1414 行）— 画布渲染、粒子、浮动文字、迷你地图（在末尾启动 `gameLoop(0)` 以避开 TDZ）
- `systems/messages.js` — 消息面板、战斗日志
- `systems/floor.js` — 楼层生成、移动、祭坛、tutorial 怪物布置
- `systems/floor-nav.js` — 楼层导航、职业转换、下楼
- `systems/ui-overlays.js` — 战斗/事件/碎片/进化覆盖层
- `systems/strategy-hints.js`（新）— 策略提示系统

### Bug 修复

- **特效卡死 + 12 层倒计时冻结**：`gameLoop(0)` 在 render.js 加载前调用导致 `particles`/`_floatingTexts`/`_renderDirty` ReferenceError，整个动画循环未启动。改为在 render.js 末尾启动
- **污染 100% 后宿主连环死亡**：`collapseChoose()` 误用 `p.hp*0.3`（当前 HP）替代 `p.maxHp*0.3`（最大 HP）的 3 处分支均改为 `Math.max(1, Math.floor(p.maxHp*0.3))`，避免 endure→死亡→形态丢失级联

### 技术变更

- versionName: 1.1.0 → 1.2.0
- 拆分后所有模块通过全局作用域共享变量/函数，加载顺序在 `index.html` 1121-1147 行明确控制
- 新增动作钩子：`move()`/`attack()`/`possess()` 入口注入 `dismissTutorial(fromAction)` 实现教程自动推进

## [1.1.0] - 2026-04-30

### 新功能

- **DLC 职业系统**：新增血族（吸血/高风险）和机甲（护盾/爆发）两个 DLC 职业，含完整战斗逻辑、进化树、终极技能
- **DLC 商店**：主页新增商城入口，支持职业/皮肤两个 Tab，localStorage 解锁流程
- **皮肤系统**：每职业 2 套调色皮肤，`getClassColors()` 统一包装颜色覆盖
- **柔性教程**：非阻塞气泡提示 + 按钮脉冲高亮，触发对应操作后自动消失，不重复显示
- **每日挑战修饰器**：10 种轮换修饰器（双倍污染/精英狂潮/鲜血之夜/玻璃大炮等），每日种子决定
- **退出游戏确认**：游戏内菜单"退出游戏"新增保存/不保存/取消三选项

### UI/UX 优化

- **游戏内菜单精简**：移除与主页重复的项目（成就、记忆档案、怪物图鉴、设置），保留游戏专属功能
- **模式选择返回按钮**：进入深渊后的模式选择页增加返回主页按钮
- **移除主页冗余"存档"按钮**：存档管理已在设置中，不再重复显示
- **App 图标重制**：全新"裂瞳/寄生眼"概念图标（竖瞳黑核 + 有机虹膜 + 眼角肉质 + 寄生针）

### Bug 修复

- **"继续游戏"残留**：游戏结束后 `saveGame()` 仍可能在 `visibilitychange` 时触发保存，已加 guard
- **"保存并退出"后无法继续**：`backToTitle()` 误调 `clearAllGameData()` 删除刚保存的存档，已改为仅隐藏 UI 并刷新标题页
- **战斗伤害异常（ATK 15→493）**：`_attackRounds` 耐久加成未在新战斗重置，已在 round=1 时强制清零
- **设置面板按钮错误**：设置面板"返回菜单"改为"关闭"直接关闭 overlay
- **结局后存档未清除**：`triggerEnding()` 和 `forceFinale()` 中补充 `removeItem('pt_save')`

### 技术变更

- versionCode: 1 → 2, versionName: 1.0.0 → 1.1.0
- 新职业画像（Canvas 2D）：血族（暗红身体/披风/獠牙/血液粒子）、机甲（装甲方块/能量线/护盾光环）
- `classColors` 全局引用替换为 `getClassColors()` 以支持皮肤覆盖

## [1.0.1] - 2026-04-30

### Bug 修复

- **修复附身按钮无响应**：`openNegotiate()` 中 `const t = game.target` 遮蔽了全局翻译函数 `window.t()`，导致 `t('✕ 取消')` 抛出 `t is not a function`
- **统一新手引导**：移除所有 `game._shortUIUnlocked` 条件判断，长局短局共享同一套教程逻辑（5 阶段渐进解锁）
- **修复重复关闭按钮**：event-overlay 同时存在静态 HTML 关闭按钮和动态生成按钮，移除静态按钮并居中动态按钮

### 安全修复

- **Keystore 密码外移**：从 `build.gradle.kts` 硬编码迁移至 `local.properties` + 环境变量 fallback
- **会话内存泄漏**：`sync.Map` 永不过期 → 添加 `sessionEntry` TTL（2h）+ 定时清理协程
- **API 鉴权与速率限制**：新增 `middleware.go`，20 req/sec/IP 令牌桶 + Session 鉴权
- **Session Fixation 防护**：会话绑定 IP，跨 IP 访问自动失效
- **优雅关闭**：`main.go` 重写，支持 signal 捕获 + `srv.Shutdown` + 超时控制

### 部署自动化

- 新增 `Dockerfile`：多阶段构建（golang:1.21-alpine → alpine:3.19），内置 HEALTHCHECK
- 新增 `docker-compose.yml`：端口映射、资源限制（256M/1CPU）、日志轮转、健康检查
- 新增 `Makefile`：统一命令入口（build/run/test/docker/apk）
- 新增 `.dockerignore`：排除 android/、密钥、文档等非必要文件

## [1.0.0] - 2026-04-28

### 首发版本

**游戏模式**
- 经典模式：50 层完整 Roguelike 塔探索，5 个区域 Boss，4 种结局
- 短局模式：12 层三浪爽感设计，15 分钟快节奏体验，独立逐层参数曲线

**核心系统**
- 附身系统：击败/削弱怪物后附身，继承属性与特性，意识交涉四策略
- 三职业体系：泰坦（坦克）、幽灵（刺客）、虫群（策略），各有终极技能
- 污染机制：0-100 渐进式视觉/玩法影响，100% 触发崩溃选择
- 形态记忆：最多 3 个形态槽位，战斗中切换，濒死转移
- 进化树：三条路径各 5 级，消耗 EP 解锁被动增强
- 锚点存档：死亡回滚至最近锚点

**战斗**
- 回合制战斗：攻击/防御/附身/逃跑/切换形态/终极技
- 自动战斗：长按自动连续攻击
- 精英怪物：HP x 1.6、ATK x 1.4、EP x 1.8
- Boss 多阶段变身：每个 Boss 在 HP 阈值时获得新特性
- 战斗加速：第 6 回合后追加额外伤害防止拖沓

**探索**
- 13 x 13 格子地图，Canvas 2D 实时渲染
- 6 种路线选择：猎场/净土/深渊/试炼/迷宫/荒原
- 30 种楼层签名效果
- 15 对诅咒/祝福祭坛
- 50+ 种怪物，5 个区域风格

**视觉**
- 生物朋克 x 新艺术运动风格
- Canvas shadowColor/shadowBlur 生物发光
- 虹彩 hsla 色相偏移
- 污染渐进式画面扭曲（暗角/RGB分离/幻觉/撕裂）

**音效**
- Web Audio API 程序化生成，无音频文件
- 区域主题 BGM、战斗/Boss 音乐
- 污染音效（耳鸣/心跳/低语）

**成就与结局**
- 15 个成就，部分解锁起始加成
- 4 种结局：泰坦/幽灵/虫群 + 隐藏结局

**新手引导**
- 第 1 层剧情化脚本引导，30 秒体验核心附身循环
- 渐进解锁（5 阶段）

### Bug 修复（上线前最终轮次）

- 修复碎片弹窗被战斗遮罩遮挡的问题（z-index 360/365）
- 修复附身成功后 closeCombat 调用顺序导致的潜在异常
- 修复继续游戏后日志记录不衔接的问题（rebuildMessages）
- 修复战斗日志在 showCombat 刷新时被意外清空
- 修复 Canvas tap 事件监听器重复注册导致的内存泄漏
- 修复短局模式倒计时与污染值显示重叠

### 短局模式三浪曲线

- 实现 SHORT_FLOOR_CURVE 逐层参数表（12 层独立数值）
- 短局怪物 HP/ATK 缩放走曲线表替代线性公式
- 短局怪物数量、精英概率、EP 倍率、碎片掉率独立控制
- 短局每层污染和附身污染走曲线表
- Wave 过渡文案（权力幻想/失控前兆/压力反转/污染深渊/绝望反击/崩溃）

### UI/UX 优化

- 形态槽位尺寸增大（26px -> 32px）提升可点击区域
- 小屏幕响应式适配（340px/380px 断点，D-pad 缩放）
- 低对比度文字修复（subtitle/flavor/label 等多处颜色提亮）
