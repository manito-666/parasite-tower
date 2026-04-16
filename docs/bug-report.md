# 寄生魔塔 — 缺陷审计报告

**审计日期**: 2026-04-15
**审计范围**: `android/app/src/main/assets/index.html` 全量代码
**状态**: 全部已修复

---

## P0 — 致命缺陷（崩溃/数据损坏）

### BUG-001: _parseColor() 缺少 hsla() 解析支持
| 项目 | 内容 |
|------|------|
| 分类 | 渲染 |
| 位置 | line 1371 `_parseColor()` |
| 重现步骤 | 1. 附身成功触发 `spawnPossessEffect()` 2. 函数生成 `hsla(120,100%,70%,0.7)` 格式颜色 3. `_parseColor` 无法解析，返回白色 `0xffffff` |
| 实际结果 | PixiJS 粒子全部渲染为白色，虹彩效果丢失（附身彩虹粒子、幽灵拖尾、T2翅膜、T4相位环、T5触手） |
| 预期结果 | 粒子按 HSL 色相正确渲染为彩虹色 |
| 修复方案 | 在 rgba 匹配前增加 hsla 正则 + HSL→RGB 转换算法 |

### BUG-002: getImageData() SecurityError（Android WebView）
| 项目 | 内容 |
|------|------|
| 分类 | 兼容性 |
| 位置 | line 6513, 6544 |
| 重现步骤 | 1. 污染值 >60% 2. 触发色散/glitch后处理 3. Android WebView 安全策略阻止 getImageData |
| 实际结果 | 抛出 SecurityError，后处理静默失败 |
| 预期结果 | 优雅降级，不影响游戏运行 |
| 修复方案 | 已有 try/catch 包裹，实际不会崩溃，降级为无后处理（可接受） |

### BUG-003: maxHp=0 时除零错误
| 项目 | 内容 |
|------|------|
| 分类 | 逻辑 |
| 位置 | line 3976, 4610 `getNegBaseRate()` |
| 重现步骤 | 1. 怪物 maxHp 因某种原因为 0 2. 计算 `1 - t.hp/t.maxHp*0.6` 3. 除以零得到 NaN |
| 实际结果 | 附身成功率显示 NaN%，附身逻辑异常 |
| 预期结果 | maxHp=0 时使用安全默认值 |
| 修复方案 | 改为三元表达式 `t.maxHp>0 ? (1-t.hp/t.maxHp*0.6) : 0.6` |

### BUG-004: game.target 为 null 时 combatSwitchForm 崩溃
| 项目 | 内容 |
|------|------|
| 分类 | 空指针 |
| 位置 | line 6769 `combatSwitchForm()` |
| 重现步骤 | 1. 战斗中怪物被击杀，game.target 清空 2. 快速点击形态切换按钮 3. 访问 `m.atk` 时 m 为 null |
| 实际结果 | TypeError: Cannot read property 'atk' of null |
| 预期结果 | 无目标时安全返回 |
| 修复方案 | 在 combatRound++ 前增加 `if(!game.target){addMsg('无目标');return;}` |

### BUG-005: 存档加载缺少 forms/deadForms 数组校验
| 项目 | 内容 |
|------|------|
| 分类 | 数据完整性 |
| 位置 | line 2286 `loadGame()` |
| 重现步骤 | 1. 旧版存档无 forms 字段 2. 加载存档 3. 后续代码访问 game.forms[i] 崩溃 |
| 实际结果 | TypeError: Cannot read property of undefined |
| 预期结果 | 缺失字段自动初始化为空数组 |
| 修复方案 | 加载后检查 `if(!game.forms\|\|!Array.isArray(game.forms))game.forms=[]` 同理 _deadForms |

### BUG-006: 怪物死亡后 game.target 未清空
| 项目 | 内容 |
|------|------|
| 分类 | 状态残留 |
| 位置 | line 3744 战斗胜利分支 |
| 重现步骤 | 1. 击杀怪物 2. game.target 仍指向已死怪物 3. 其他系统检查 game.target 时误判为战斗中 |
| 实际结果 | 可能触发对已死怪物的操作，UI 状态异常 |
| 预期结果 | 怪物死亡后立即清空 target |
| 修复方案 | 在 `game._combatRound=0` 后添加 `game.target=null` |

---

## P1 — 严重缺陷（功能异常/内存泄漏）

### BUG-007: 污染值可超过 100
| 项目 | 内容 |
|------|------|
| 分类 | 数值溢出 |
| 位置 | line 4115 附身污染、多个事件 action |
| 重现步骤 | 1. 污染值 95% 2. 附身成功 +10 污染 3. 或触发"深渊凝视"事件 +15 |
| 实际结果 | 污染值 105%/110%，超出设计上限，UI 显示异常，后处理强度计算溢出 |
| 预期结果 | 污染值始终 cap 在 0~100 |
| 修复方案 | 所有 `p.pollution+=N` 替换为 `p.pollution=Math.min(100,p.pollution+N)` |

### BUG-008: triggerDeath() 可被多次调用
| 项目 | 内容 |
|------|------|
| 分类 | 竞态条件 |
| 位置 | line 8183 `triggerDeath()` |
| 重现步骤 | 1. 玩家 HP=0 2. setTimeout 触发 triggerDeath 3. 同时另一个伤害源也触发 triggerDeath |
| 实际结果 | 死亡面板叠加显示，deathCount 多次递增，EP 惩罚翻倍 |
| 预期结果 | 死亡流程只执行一次 |
| 修复方案 | 添加 `game._triggerDeathActive` 防重入标志，在所有出口清除 |

### BUG-009: globalAlpha 未在后处理前重置
| 项目 | 内容 |
|------|------|
| 分类 | 渲染 |
| 位置 | line 6476 污染后处理入口 |
| 重现步骤 | 1. 浮动文字渲染设置了 ctx.globalAlpha 2. 紧接着进入污染后处理 3. 边缘腐蚀/色散使用了残留的 alpha |
| 实际结果 | 后处理效果透明度异常，忽明忽暗 |
| 预期结果 | 后处理前 alpha 为 1.0 |
| 修复方案 | 后处理代码块前添加 `ctx.globalAlpha=1` |

### BUG-010: PixiJS 粒子池耗尽后新粒子丢失
| 项目 | 内容 |
|------|------|
| 分类 | 资源管理 |
| 位置 | line 6074 `spawnParticle()` |
| 重现步骤 | 1. 高污染值（>60%）持续生成环境孢子 2. 战斗中同时生成击中火花 3. 500 粒子全部占用 |
| 实际结果 | 新粒子直接丢弃，视觉效果断断续续 |
| 预期结果 | 回收最老粒子给新效果使用 |
| 修复方案 | 池满时遍历找 `_life` 最小的粒子回收（FIFO策略） |

### BUG-011: _inCombat 标志死亡后未清除
| 项目 | 内容 |
|------|------|
| 分类 | 状态残留 |
| 位置 | line 3756 / line 8183 |
| 重现步骤 | 1. 战斗中玩家死亡 2. `_inCombat=true` 在 attack() 中设置 3. triggerDeath 跳过了 finally 块 |
| 实际结果 | 复活/回滚后无法进入下一次战斗（attack() 检查 `_inCombat` 直接 return） |
| 预期结果 | 死亡流程清除战斗状态 |
| 修复方案 | triggerDeath 开头添加 `game._inCombat=false` |

### BUG-012: 附身谈判面板可重复打开
| 项目 | 内容 |
|------|------|
| 分类 | UI 叠加 |
| 位置 | line 3984 `openNegotiate()` |
| 重现步骤 | 1. 战斗中快速连续点击"附身"按钮 2. openNegotiate 被多次调用 |
| 实际结果 | 谈判卡片重复生成，UI 错乱 |
| 预期结果 | 已打开时忽略重复调用 |
| 修复方案 | 函数开头检查 `negotiate-overlay` 是否已 active |

### BUG-013: 音频 interval 和战斗日志 timer 死亡后未清理
| 项目 | 内容 |
|------|------|
| 分类 | 内存泄漏 |
| 位置 | line 3307-3309, 5159 |
| 重现步骤 | 1. 高污染触发心跳/低语/故障音频 interval 2. 玩家死亡回滚 3. interval 继续运行 |
| 实际结果 | 回滚后仍播放高污染音效，多次死亡累积多个 interval |
| 预期结果 | 回滚时清除所有音频 interval |
| 修复方案 | `rollbackToAnchor()` 中 clearInterval 所有音频 timer + clearTimeout battleLogTimer |

### BUG-014: 附身后 maxHp 可变为 0
| 项目 | 内容 |
|------|------|
| 分类 | 数值异常 |
| 位置 | line 4106 附身 HP 继承 |
| 重现步骤 | 1. 附身残血怪物（hp/maxHp比很低） 2. `inheritFactor=0.6` 3. `Math.floor(maxHp*0.6)` 当 maxHp 很小时结果为 0 |
| 实际结果 | 玩家 maxHp=0, hp=0，后续除零/无法回血 |
| 预期结果 | maxHp 最小为 1 |
| 修复方案 | 添加 `Math.max(1, ...)` 保底 |

### BUG-015: 形态切换中死亡后战斗 UI 残留
| 项目 | 内容 |
|------|------|
| 分类 | UI 状态 |
| 位置 | line 6800 `combatSwitchForm()` |
| 重现步骤 | 1. 战斗中切换形态 2. 切换时受伤致 HP=0 3. showDeathChoice 弹出但战斗面板仍显示 |
| 实际结果 | 战斗面板和死亡选择叠加，交互混乱 |
| 预期结果 | 进入死亡选择前关闭战斗面板 |
| 修复方案 | showDeathChoice 调用前添加 `closeCombat()` |

---

## P2 — 一般缺陷（体验优化）

### BUG-016: formAffinity "negotiate" action 无效
| 项目 | 内容 |
|------|------|
| 分类 | 逻辑遗漏 |
| 位置 | line 4074 |
| 重现步骤 | 1. 附身谈判成功 2. 调用 `updateFormAffinity(type, 'negotiate', 1)` 3. switch 无 'negotiate' case |
| 实际结果 | 亲和度未更新，谈判附身不计入亲和经验 |
| 预期结果 | 谈判附身也应增加亲和度 |
| 修复方案 | 改 'negotiate' 为 'possess' |

### BUG-017: 污染溢出反噬可击杀玩家
| 项目 | 内容 |
|------|------|
| 分类 | 数值安全 |
| 位置 | line 2869 职业转换 |
| 重现步骤 | 1. 高污染状态下转换职业 2. 污染转换系数导致 newPol>100 3. `p.hp -= (newPol-100)*2` 可使 hp<=0 |
| 实际结果 | 玩家可能在祭坛菜单中被击杀（非战斗环境），触发未预期的死亡流程 |
| 预期结果 | 溢出伤害保底 hp>=1 |
| 修复方案 | 改为 `p.hp=Math.max(1, p.hp-(newPol-100)*2)` |

---

## 统计

| 级别 | 数量 | 已修复 |
|------|------|--------|
| P0 | 6 | 6 |
| P1 | 9 | 9 |
| P2 | 2 | 2 |
| **合计** | **17** | **17** |

> 注: BUG-002 (getImageData SecurityError) 已有 try/catch 兜底，评估为可接受的降级行为，无需额外修改。
> P0 #3 (getElementById null checks) 经审查，相关元素在 HTML 中均存在且不会动态移除，实际不会触发 null。


