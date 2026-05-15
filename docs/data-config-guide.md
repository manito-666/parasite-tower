# 数据配置指南 / Data Config Guide

> 文档级别：**P0 · 开发 · 策划**
> 配套版本：v1.2.0
> 数据源：`android/app/src/main/assets/data.js`
> 消费源：`systems/combat.js` `systems/negotiate.js` `systems/floor-nav.js` `systems/class-abilities.js`
> 最后更新：2026-05-12

---

## 1. 文件总览

`data.js`（297 行，纯数据定义）按 Block 划分：

| Block | 内容 | 行号 |
|---|---|---|
| A1 | `shopItems` 商店道具 | 3-25 |
| A2 | `classBaseStats` 职业基础属性 | 29-35 |
| A3 | `classColors` 职业配色 | 36-42 |
| A4 | `classUltimates` 终极技能 | 43-49 |
| A5 | `evolutionPaths` 进化树 | 50-86 |
| A6 | `monsterTemplates` 怪物配置 | 87-132 |
| A7 | `monsterSilhouettes` 怪物剪影路径 | 136-181 |
| B1 | `classEndings` / `hiddenEnding` 结局文本 | 184-228 |
| B2 | `classDescriptions` 职业选择页描述 | 232-243 |
| C1 | `achievementDefs` / `achievementBonuses` 成就 | 246-271 |
| D1 | `skinPalettes` 皮肤调色板 | 276-297 |

**修改原则**：
1. 仅改数据，不改字段名 — 字段名被 `combat.js` 等系统硬引用
2. 改完先用短局走一遍验证（教程默认怪物在 1 层，5 分钟可触发战斗+附身）
3. 删除字段需 grep 全局，确认无 `template.X` 读取

---

## 2. 怪物配置（monsterTemplates）

### 2.1 字段表

| 字段 | 类型 | 必填 | 说明 | 实测范围 |
|---|---|---|---|---|
| `name` | string | ✅ | 怪物名称（中文）| 任意 |
| `maxHp` | int | ✅ | 最大 HP | 45 (T1) → 2500 (boss5) |
| `atk` | int | ✅ | 攻击 | 7 → 140 |
| `def` | int | ✅ | 防御 | 1 → 45 |
| `traits` | string[] | ✅ | 特性数组（可空 `[]`）| 见 §2.3 |
| `color` | hex | ✅ | 主体色（用于剪影描边/光晕）| `'#xxx'` |
| `zone` | int | ✅ | 区域 0–5 | 0=人类，1–5=楼层带 |
| `ability` | string | ❌ | 特殊能力枚举 | 见 §2.2 |

> ⚠️ **`zone` 决定刷怪范围**：`floor.js` 按楼层取对应 zone 的怪物池。如把 zone 写错，怪物会出现在不该出现的层。

### 2.2 ability 枚举（实测有效值）

ability 与 traits 是**双轨触发**——很多效果同时认 `m.ability==='X'` 和 `monsterHasTrait(m,'XX中文')`。

| ability 值 | 中文等价 trait | 效果（来自 `combat.js`） |
|---|---|---|
| `'armored'` | `'护甲'` | 前 3 回合防御×2 |
| `'berserk'` | `'狂暴'` | HP<50% 时 ATK×1.5 |
| `'vampiric'` | `'吸血'` | 受击回复造成伤害的 30% |
| `'poison'` | `'毒素'` | 击败后玩家受 10% 总伤害的反噬 |

> 新增 ability 必须同时改 `combat.js` 加 case，否则字段是死键。

### 2.3 traits 词表（`combat.js` 中实际被读取的）

| trait | 触发逻辑（简化） | 出现位置 |
|---|---|---|
| `'迅捷'` | 闪避相关 | T1 实验鼠 |
| `'厚皮'` | 减伤 | T1 蟑螂、T3 甲虫 |
| `'再生'` | 每回合回血 | 多处（slime, vine, hydra, larva, titan, origin） |
| `'忠诚'` | 召唤同伴 | T1 看门犬 |
| `'弹性'` | 特殊闪避 | T1 壁虎 |
| `'电击'` | 麻痹概率 | T1 无人机 |
| `'狂暴'` | 同 ability='berserk' | T2 wolf, T4 voidbeast 等 |
| `'蛛网'` | 概率束缚 | T2 spider/vine |
| `'吸血'` | 同 ability='vampiric' | T2 bat |
| `'毒素'` | 击败反噬 + 残留污染 +3 | T2 wasp, T3 moth/scorpion 等 |
| `'护甲'` | 同 ability='armored' | T2 guard, T3 beetle 等 |
| `'反击'` | 受伤反伤 | T2 boss2, T4 watcher |
| `'掠夺'` | 偷 EP | T2 boss2 |
| `'暴击'` | 概率 ×2 伤害 | T3 mantis |
| `'寄生强化'` | 受附身后玩家额外加成 | T3 worm |
| `'再生+'` | 增强版再生 | T3 hydra |
| `'撕裂'` | 流血 | T3 hydra |
| `'污染光环'` | 战斗中持续污染 | T3 boss3, T5 horror/plague/origin |
| `'多重攻击'` | 单回合 2 击 | T3 boss3, T4 voiddragon, T5 多个 |
| `'相位'` | 概率忽略防御 | T4 全员、T5 多个 |
| `'伏击'` | 战斗起手暴击 | T4 lurker |
| `'不死'` | HP=0 复活一次（30% HP） | T4 wraith, T5 deathknight 等 |
| `'吸取'` | 吸 HP 回血 | T4 wraith/nightmare, T5 horror |
| `'恐惧'` | 玩家概率失去回合 | T4 nightmare, T5 horror |
| `'分裂'` | 召唤分身 | （玩家虫群机制 + boss） |
| `'蓄力'` | 间隔回合大招 | （部分 boss） |
| `'召唤'` | Boss 召唤援军 | T5 origin |
| `'爆炸'` | 死亡 AOE | T5 plague |

> **traits 是字符串自由文本**：如果输入 `'狂爆'` 这种错字，**代码不会报错，效果直接消失**。配置时务必抄写已有词。

### 2.4 怪物模板示例

```js
// 标准 T2 怪物
wolf:{
  name:'培育狼', maxHp:140, atk:22, def:7,
  traits:['狂暴'],     // 必须用已知 trait 词
  color:'#8b0000',
  zone:2
},
// 带 ability 的怪物
beetle:{
  name:'装甲甲虫', maxHp:400, atk:44, def:25,
  traits:['厚皮','护甲'],
  color:'#2f4f2f',
  zone:3,
  ability:'armored'    // 双轨触发
}
```

### 2.5 新增怪物 checklist

- [ ] `monsterTemplates` 加条目，`zone` 选准
- [ ] `monsterSilhouettes` 同 key 加剪影路径（不加则不会渲染）
- [ ] 如新 ability，`combat.js` 加对应分支
- [ ] `docs/monster-data.json` 同步（图鉴/外部参考）
- [ ] `docs/bestiary-info.js` 加图鉴文案
- [ ] 短局/经典各跑一遍，确认刷怪正常

---

## 3. 进化节点（evolutionPaths）

### 3.1 字段表

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | string | ✅ | 节点名 |
| `cost` | int | ✅ | EP 消耗 |
| `desc` | string | ✅ | 玩家可见描述（不参与计算） |
| `effect` | object | ✅ | 属性变化字典，键见 §3.2 |

### 3.2 effect 支持的键（从代码反推）

> **关键结论**：`effect.atk/def/maxHp` 通过直接读取生效（`story.js:110-112` `ui-overlays.js:246-248`）；其他键通过 `getEvolutionEffect(key)` 工厂函数读取（`floor-nav.js:407` 定义）。

| key | 类型 | 含义 | 消费位置 |
|---|---|---|---|
| `atk` | int | 攻击直加 | story.js / ui-overlays.js（购买节点时直接累加） |
| `def` | int | 防御直加 | 同上 |
| `maxHp` | int | 最大 HP 直加（同时回满）| 同上 |
| `regen` | float (0–1) | 每层 HP 自动恢复比例 | `floor-nav.js:304` |
| `lifesteal` | float (0–1) | 攻击吸血比例 | `combat.js:207` |
| `dmgReduce` | float (0–1) | 受到伤害减免 | `combat.js:159` |
| `extraDmg` | float (0–1) | 攻击额外伤害比例 | `combat.js:119` |
| `bonusEvo` | int | 击杀额外 EP | `combat.js:321` |
| `possessBonus` | float (0–1) | 附身成功率加成 | `negotiate.js:21` |
| `pollutionReduce` | int | 附身污染削减（如 +5 → +3 设为 2）| `floor-nav.js:296` |
| `lowHpBonus` | float (0–1) | HP 低时 ATK 加成（血族）| `combat.js:113` |
| `killHeal` | float (0–1) | 击杀回复最大 HP 比例（血族）| `combat.js:340` |
| `deathImmune` | bool | HP<20% 免死一次（血族终极）| 待落地 |
| `shieldPerFloor` | int | 每层获得护盾（机甲）| 待落地 |
| `shieldAtkBonus` | float | 护盾>50 时攻击加成（机甲）| 待落地 |
| `pollToShield` | bool | 污染→护盾转换（机甲）| 待落地 |
| `shieldCap` | int | 护盾上限提升（机甲）| 待落地 |
| `shieldDoubleDmg` | bool | 护盾满时双倍伤害（机甲）| 待落地 |

> ⚠️ **「待落地」标记的键**：当前 `data.js` 已声明，但 `combat.js` / `class-abilities.js` 尚未读取。功能实际不生效，需要技术补完。

### 3.3 进化节点模板

```js
// 标准节点
{name:'铁壁', cost:200, desc:'防御+3', effect:{def:3}},

// 复合节点
{name:'幽灵形态', cost:3200, desc:'攻击+15，吸血25%，附身+15%',
  effect:{atk:15, lifesteal:0.25, possessBonus:0.15}},
```

### 3.4 改动须知

- **必须 5 个节点**：UI 假设固定 5 阶，少了显示空槽，多了截断
- **cost 严格递增**：第 1→5 节点的 EP 应单调上升（玩家不会先买终极）
- **desc 与 effect 一致性**：玩家只看 desc，**不一致是策划 bug**
- **不要给非该职业的 effect 键**：例如把 `lowHpBonus` 给到 titan 节点，代码不会报错，但玩家会困惑

---

## 4. 商店道具（shopItems）

### 4.1 字段表

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | string | ✅ | 道具名 |
| `cost` | int | ✅ | 基础 EP 价格 |
| `desc` | string | ✅ | 玩家描述 |
| `type` | string | ✅ | 类型枚举（决定 effect handler）|
| `cat` | string | ✅ | 分类 tab：`'supply'` / `'survival'` / `'growth'` / `'info'` |
| `priceScale` | float | ❌ | 涨价系数（每次购买后 cost ×= scale）|
| `maxBuy` | int | ❌ | 单局最大购买次数 |
| `minZone` | int | ❌ | 最低出现 zone（高层道具） |

### 4.2 type 枚举

| type | 效果 |
|---|---|
| `heal` | 恢复 50% HP |
| `atk` | +2 攻击 |
| `def` | +2 防御 |
| `maxhp` | +8% 最大 HP |
| `purify_small` | 污染 -20 |
| `purify_full` | 污染清零 |
| `collapse_resist` | 下次崩溃自动清醒 |
| `death_revive` | 下次死亡保留形态 |
| `form_slot` | 形态槽 +1 |
| `form_lock` | 当前形态死亡保留 1 次 |
| `human_enhance` | 人类基础 ATK+5/DEF+3 |
| `map_scan` | 显示出口位置 |
| `monster_scan` | 显示怪物属性 |
| `regen_combat` | 战斗每回合 +3% HP（持续 1 局） |
| `full_heal` | 100% 回血 |
| `perm_regen` | 永久战斗每回合 +5% HP |

> 新增 type 必须在 `dlc-shop.js` / `panels.js` 的购买 handler 加 case。

---

## 5. 职业基础属性（classBaseStats）

```js
{ hp, maxHp, atk, def, fogRadius }
```

| 字段 | 含义 |
|---|---|
| `hp` / `maxHp` | 起始/上限（一般相等） |
| `atk` / `def` | 基础属性 |
| `fogRadius` | 视野半径（影响地图探索难度） |

| 职业 | hp | atk | def | fogRadius | 设计意图 |
|---|---|---|---|---|---|
| swarm | 35 | 4 | 1 | 6 | 均衡，分裂补位 |
| titan | 45 | 3 | 3 | 5 | 厚血厚甲，视野差 |
| ghost | 28 | 5 | 1 | 7 | 脆皮高攻，视野好 |
| blood | 32 | 6 | 1 | 6 | 高攻吸血赌博 |
| mech | 40 | 4 | 2 | 4 | 中庸，视野最差 |

---

## 6. 终极技能（classUltimates）

```js
{ name, icon, desc, cooldown, duration }
```

| 字段 | 含义 |
|---|---|
| `cooldown` | 冷却（楼层数）|
| `duration` | 效果持续回合数 |

具体效果硬编码在 `class-abilities.js`，**改 desc 不会改效果**。

---

## 7. 配色与皮肤（classColors / skinPalettes）

```js
{ primary, highlight, glow, bg, name, icon }
```

| 字段 | 用途 |
|---|---|
| `primary` | 主色（按钮/边框）|
| `highlight` | 高亮色（hover/选中）|
| `glow` | Canvas `shadowColor`（怪物发光）|
| `bg` | 战斗界面背景渐变 |
| `name` | 显示名（i18n 在 lang.js 单独翻译）|
| `icon` | emoji 图标 |

`getClassColors(classId)` 会根据玩家装备的皮肤返回 `skinPalettes[classId][skinId]` 覆盖默认 `classColors[classId]`。

---

## 8. 成就（achievementDefs / achievementBonuses）

```js
// achievementDefs
{ id, name, desc, icon }

// achievementBonuses（可选，达成后下局起始加成）
{ stat, value, desc }
```

bonuses 支持的 stat：`maxHp` / `atk` / `def` / `evoPoints` / `pollution`（负值为减污染）

---

## 9. 改完之后

```bash
# 1. 看代码是否还引用你删的字段
grep -rn "monsterTemplates\.<删的key>\|template\.<删的字段>" android/app/src/main/assets/

# 2. 启动短局，至少推 3 层
# 教程默认怪物在 1 层，必触发战斗 + 附身

# 3. 看 logcat 有无 ReferenceError / undefined
adb logcat | grep -iE "error|undefined"
```

完成所有 checklist 后再发起打包。

---

## 10. 常见错误

| 现象 | 原因 |
|---|---|
| 怪物不刷新 | `zone` 错或 `monsterSilhouettes` 缺剪影 |
| 战斗黑屏 | `color` 字段缺失 |
| 进化节点购买报错 | `effect` 键拼错（如 `regan` → `regen`）|
| 进化节点无效果 | 该 key 是「待落地」清单里的 |
| ability 无效 | `combat.js` 没对应 case |
| 皮肤不切换 | `getClassColors` 未读到 — 检查 `skinPalettes[class][skinId]` 是否存在 |

---

## 11. 后续改进（v2 候选）

- 把 effect 键改用 schema 校验（写一个启动时自检脚本，扫所有节点的 effect 键是否被消费）
- monsterTemplates 与 monsterSilhouettes 合并，避免双向同步
- traits 词表导出常量，禁止字符串字面量散布
- ability 与 traits 合并为统一标签系统
