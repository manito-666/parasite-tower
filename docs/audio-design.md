# 寄生魔塔 - 音频设计文档

## 一、音频架构（生物朋克 × 新艺术运动风格）

### 1.1 分层系统
```
背景音乐层 (BGM)
├─ 区域主题 (5首) — 有机腔体氛围
├─ 战斗音乐 (3首) — 生物脉冲节拍
└─ BOSS音乐 (5首) — 荧光巨兽史诗

音效层 (SFX)
├─ 战斗音效 (攻击/受伤/死亡)
├─ 寄生音效 (意识侵入/融合/失败)
├─ UI音效 (荧光脉冲提示)
└─ 环境音效 (菌膜蠕动/孢子飘落/腔体回响)

环境音层 (Ambient)
├─ 区域氛围 (实验腔体/培育巢穴/污染核心/深层菌脉/终焉腔)
└─ 污染效果 (神经噪音层，污染值>60时叠加)
```

### 1.2 动态混音规则
- **探索状态**: BGM 100%, Ambient 40%, SFX 80%
- **战斗状态**: 战斗音乐淡入(2秒), BGM淡出, SFX 100%
- **BOSS战**: BOSS音乐立即切换, Ambient静音, SFX 100%
- **寄生动画**: 所有音量降至30%, 寄生音效突出
- **高污染(>80)**: 叠加污染噪音层(20%音量), 所有音乐加低通滤波

---

## 二、背景音乐设计

### 2.1 区域1: 实验腔体 (1-10层)
**主题**: 有机实验室 + 菌膜回响

**音乐风格**:
- 生物电子 (Bio-Electronic Ambient)
- BPM: 90-100
- 调性: C小调
- 乐器: 合成器pad, 液态打击乐, 低频脉冲贝斯, 电子鼓

**Suno提示词**:
```
[Genre: Dark Industrial Electronic]
[Mood: Cold, Clinical, Ominous]
[BPM: 95]
[Instruments: Synth pads, metallic percussion, distorted bass, electronic drums]
[Structure: Intro (8 bars) - A (16 bars) - B (16 bars) - A' (16 bars) - Outro (8 bars)]
[Key: C minor]
[Style: Minimalist, repetitive motifs, mechanical rhythm, occasional alarm sounds]
[Reference: Silent Hill ambient, Half-Life laboratory themes]
```

**分层结构**:
- Layer 1 (基础): 低频合成器drone (持续音)
- Layer 2 (节奏): 机械打击乐循环
- Layer 3 (旋律): 冰冷的合成器旋律
- Layer 4 (点缀): 随机实验室音效 (玻璃碰撞/液体滴落)

---

### 2.2 区域2: 培育巢穴 (11-20层)
**主题**: 生物恐怖 + 虹彩甲壳蠕动

**音乐风格**:
- 有机氛围 (Organic Ambient Horror)
- BPM: 70-80
- 调性: D小调
- 乐器: 弦乐颤音, 生物音效采样, 低音提琴, 不协和和弦

**Suno提示词**:
```
[Genre: Organic Horror Ambient]
[Mood: Disgusting, Unsettling, Biological]
[BPM: 75]
[Instruments: String tremolo, processed biological sounds, contrabass, dissonant synths]
[Structure: Evolving ambient, no clear sections, continuous morphing]
[Key: D minor with microtonal deviations]
[Style: Slow-moving textures, wet squelching sounds, insect-like chittering]
[Reference: The Thing soundtrack, Dead Space necromorph themes]
```

**特殊技术**:
- 真实昆虫音效降八度处理
- 弦乐刮擦技巧 (col legno)
- 反向混响制造不安感

---

### 2.3 区域3: 污染核心 (21-30层)
**主题**: 疯狂 + 现实扭曲

**音乐风格**:
- 噪音实验 (Noise Experimental)
- BPM: 无固定节拍 (自由节奏)
- 调性: 无调性/泛调性
- 乐器: 噪音合成器, 失真人声, 破碎钢琴, 工业噪音

**Suno提示词**:
```
[Genre: Experimental Noise / Dark Ambient]
[Mood: Insane, Chaotic, Reality-Breaking]
[BPM: Free tempo, occasional rhythmic bursts at 110]
[Instruments: Noise synthesizers, distorted vocals, prepared piano, industrial sounds]
[Structure: Non-linear, chaotic build-ups and sudden drops]
[Key: Atonal, chromatic clusters]
[Style: Harsh noise walls, sudden silence, glitchy textures, reversed sounds]
[Reference: Silent Hill 3 "End of Small Sanctuary", Akira Yamaoka's experimental works]
```

**动态元素**:
- 污染值每+10, 增加一层噪音密度
- 随机触发"现实撕裂"音效 (玻璃破碎+金属扭曲)

---

### 2.4 区域4: 深层菌脉 (31-40层)
**主题**: 虚空菌网 + 荧光深渊

**音乐风格**:
- 宇宙恐怖氛围 (Cosmic Horror Ambient)
- BPM: 40-50 (极慢)
- 调性: 全音阶
- 乐器: 超低频合成器, 空灵人声, 钟声, 空间混响

**Suno提示词**:
```
[Genre: Cosmic Horror Ambient / Drone]
[Mood: Vast, Empty, Incomprehensible]
[BPM: 45]
[Instruments: Sub-bass drones, ethereal choir, distant bells, heavily reverbed textures]
[Structure: Extremely slow evolution, 2-minute fade-ins]
[Key: Whole tone scale, no tonal center]
[Style: Massive reverb spaces, 20-second delay tails, spectral processing]
[Reference: Lustmord "The Place Where The Black Stars Hang", Sunn O))) drones]
```

**空间音效**:
- 3D音频定位 (虚空潜伏者的瞬移方向)
- 多普勒效应模拟非欧几何空间

---

### 2.5 区域5: 终焉腔 (41-50层)
**主题**: 生物朋克史诗 + 绝望重生

**音乐风格**:
- 黑暗管弦乐 (Dark Orchestral)
- BPM: 120-140
- 调性: E小调 → E大调 (最终转调)
- 乐器: 完整管弦乐团 + 合唱团 + 电子元素

**Suno提示词**:
```
[Genre: Epic Dark Orchestral / Hybrid Orchestral]
[Mood: Desperate, Epic, Tragic yet Hopeful]
[BPM: 130]
[Instruments: Full orchestra (strings, brass, percussion), choir, electronic bass, synth pads]
[Structure: Intro (epic build) - Verse (tense) - Chorus (explosive) - Bridge (quiet despair) - Final Chorus (triumphant)]
[Key: E minor, modulates to E major in final section]
[Style: Cinematic, massive dynamics, choir singing in Latin, hybrid electronic/orchestral]
[Reference: Bloodborne "Ludwig the Holy Blade", Dark Souls 3 "Soul of Cinder"]
```

**情绪曲线**:
- 41-45层: 压抑紧张 (弦乐颤音主导)
- 46-48层: 绝望高潮 (全乐队fff)
- 49层: 突然安静 (只有钢琴+人声)
- 50层: 史诗爆发 (合唱团+管弦乐+电子)

---

## 三、战斗音乐

### 3.1 普通战斗
**Suno提示词**:
```
[Genre: Action Electronic]
[Mood: Intense, Focused]
[BPM: 140]
[Instruments: Aggressive synths, fast drums, distorted bass]
[Structure: Loop-friendly, 16-bar cycle]
[Key: Matches current zone's key]
[Style: High energy, driving rhythm, no melody to avoid fatigue]
```

### 3.2 精英战斗
**Suno提示词**:
```
[Genre: Hybrid Orchestral Action]
[Mood: Dangerous, Epic]
[BPM: 150]
[Instruments: Orchestra stabs, electronic drums, distorted guitars]
[Structure: Intro (4 bars) - Main loop (32 bars)]
[Key: One semitone higher than zone key]
[Style: Aggressive, syncopated rhythms, brass fanfares]
```

### 3.3 BOSS战斗 (5首, 每区域1首)
**BOSS1 (实验主管) - Suno提示词**:
```
[Genre: Industrial Metal]
[Mood: Mechanical, Relentless]
[BPM: 160]
[Instruments: Distorted guitars, industrial drums, synth bass, alarm sounds]
[Structure: Intro - Verse - Chorus - Breakdown - Final Chorus]
[Key: C minor]
[Style: Machine-like precision, palm-muted guitars, robotic vocals samples]
[Reference: Nine Inch Nails "March of the Pigs"]
```

**BOSS2 (培育主管) - Suno提示词**:
```
[Genre: Organic Horror Metal]
[Mood: Grotesque, Frantic]
[BPM: 180]
[Instruments: Detuned guitars, blast beats, insect sound samples, screaming vocals]
[Structure: Chaotic, multiple tempo changes]
[Key: D minor]
[Style: Technical death metal riffs, insect chittering rhythms]
```

**BOSS3 (污染核心) - Suno提示词**:
```
[Genre: Noise Rock / Experimental]
[Mood: Insane, Overwhelming]
[BPM: 200 (double-time feel)]
[Instruments: Feedback guitars, chaotic drums, noise synths, distorted screams]
[Structure: No clear structure, controlled chaos]
[Key: Atonal]
[Style: Wall of sound, sudden stops, extreme dynamics]
[Reference: Merzbow meets Meshuggah]
```

**BOSS4 (深渊领主) - Suno提示词**:
```
[Genre: Doom Metal / Drone]
[Mood: Crushing, Inevitable]
[BPM: 60]
[Instruments: Down-tuned guitars (drop A), thunderous drums, sub-bass, choir]
[Structure: Slow build over 6 minutes]
[Key: A minor (down-tuned)]
[Style: Extremely heavy, each note sustained, funeral doom pace]
[Reference: Sunn O))), Electric Wizard]
```

**BOSS5 (原初寄生体 + 真实形态) - Suno提示词**:
```
[Genre: Epic Symphonic Metal]
[Mood: Apocalyptic, Transcendent]
[BPM: 140 → 180 (accelerates in phase 3)]
[Instruments: Full orchestra, metal band, choir, pipe organ, electronic elements]
[Structure: Three distinct phases matching boss phases]
[Key: E minor → E major (final phase)]
[Style: Cinematic metal, Latin choir, organ solos, guitar/violin duels]
[Reference: Elden Ring "Radagon/Elden Beast", Final Fantasy XIV "Shadowbringers"]

Phase 1 (HP 100-60%): Ominous orchestral build
Phase 2 (HP 60-30%): Full metal assault
Phase 3 (HP 30-0%): Choir-led epic finale with key change to major
```

---

## 四、音效设计

### 4.1 战斗音效

**攻击音效** (按武器类型):
- 爪击: 快速"嗖"声 + 肉体撕裂
- 撞击: 沉闷"砰"声 + 骨骼碎裂
- 毒刺: 尖锐"嘶"声 + 液体飞溅
- 能量: 电子"滋"声 + 爆裂

**受伤音效** (按生物类型):
- 哺乳动物: 痛苦嚎叫 (音高随体型变化)
- 昆虫: 高频尖叫 + 外壳破裂
- 肉块: 湿润撕裂 + 黏液飞溅
- 虚空生物: 扭曲电子音 + 空间撕裂

**死亡音效**:
- 小型怪: 短促尖叫 + 倒地
- 中型怪: 长嚎 + 重物落地
- 大型怪: 咆哮 + 地面震动 + 余音回荡
- BOSS: 多阶段死亡音效 (3-5秒), 包含爆炸/崩塌/虚空吸入

### 4.2 寄生音效

**寄生尝试** (1.5秒):
```
0.0s: 玩家冲刺音 (嗖~)
0.3s: 穿透音 (噗嗤)
0.5s: 怪物惨叫 (啊~)
0.7s: 寄生体蠕动音 (咕噜咕噜)
1.0s: 成功/失败分支
```

**寄生成功**:
```
1.0s: 能量爆发音 (轰!)
1.2s: 紫色粒子音 (叮叮叮~)
1.5s: 完成提示音 (叮咚!)
```

**寄生失败**:
```
1.0s: 弹开音 (duang~)
1.2s: 怪物反击咆哮
1.5s: 失败提示音 (低沉嗡~)
```

### 4.3 UI音效

| 操作 | 音效描述 | 参考 |
|------|----------|------|
| 按钮点击 | 清脆"哒" | iOS点击音 |
| 菜单打开 | 上升"嗖~" | 200ms sweep up |
| 菜单关闭 | 下降"嗖~" | 200ms sweep down |
| 获得道具 | 明亮"叮!" | 钟声C5 |
| 升级 | 华丽"叮铃铃!" | 三连音C5-E5-G5 |
| 警告 | 刺耳"嘟嘟嘟" | 440Hz方波 |
| 错误 | 低沉"嗡" | 100Hz锯齿波 |

### 4.4 环境音效

**实验室**:
- 脚步: 硬底鞋+瓷砖地板 (哒哒哒)
- 门: 金属门开关 (吱呀~砰)
- 楼梯: 金属楼梯 (咚咚咚)
- 环境: 通风管道风声, 远处滴水, 偶尔电流声

**培育区**:
- 脚步: 踩在黏液上 (啪叽啪叽)
- 门: 生物质门 (黏糊糊的撕开声)
- 楼梯: 有机物楼梯 (软绵绵的踩踏)
- 环境: 昆虫鸣叫, 孵化罐气泡声, 蠕动声

**污染核心**:
- 脚步: 踩在肉上 (噗嗤噗嗤)
- 门: 肉门打开 (撕裂+湿润)
- 楼梯: 脉动的肉阶 (随心跳起伏)
- 环境: 心跳声(越来越快), 呼吸声, 血液流动

**深渊**:
- 脚步: 空灵回声 (多重延迟)
- 门: 虚空裂缝 (空间撕裂音)
- 楼梯: 非欧几何扭曲 (音高不稳定)
- 环境: 虚空风声, 远处低语, 空间扭曲

**终焉**:
- 脚步: 踩在虚无上 (无声或极轻)
- 门: 现实之门 (多层音效叠加)
- 楼梯: 通往终结 (渐强的管弦乐)
- 环境: 合唱团吟唱, 钟声, 末日号角

### 4.5 污染音效

**污染值 0-30**: 无
**污染值 31-60**: 轻微耳鸣 (8000Hz正弦波, 10%音量)
**污染值 61-80**: 中度耳鸣 + 心跳加速 (120 BPM低频脉冲)
**污染值 81-100**: 重度耳鸣 + 幻听 (随机低语, 扭曲音效)

---

## 五、自适应音乐系统

### 5.1 战斗强度分层
```
探索层 (无敌人):
  - 只有BGM + Ambient

警戒层 (发现敌人):
  - BGM音量 80%
  - 加入紧张弦乐层

战斗层 (进入战斗):
  - 2秒淡入战斗音乐
  - BGM淡出
  - 鼓点层激活

危险层 (HP<30%):
  - 战斗音乐加快10%
  - 加入警报音效
  - 低通滤波模拟紧张
```

### 5.2 污染值音乐变化
```javascript
// 伪代码
function updateMusicByPollution(pollution) {
  if (pollution > 80) {
    bgm.addFilter('lowpass', 800); // 低通滤波
    bgm.addLayer('noise', 0.2);    // 噪音层
    bgm.pitch *= 0.95;              // 降调5%
  } else if (pollution > 60) {
    bgm.addFilter('lowpass', 1500);
    bgm.addLayer('noise', 0.1);
  }
}
```

### 5.3 BOSS音乐阶段切换
```
阶段1 (HP 100-60%):
  - 完整BOSS音乐

阶段2 (HP 60-30%):
  - 加入合唱层
  - BPM +10
  - 音量 +3dB

阶段3 (HP 30-0%):
  - 所有层激活
  - BPM +20
  - 加入失真效果
  - 最后10% HP: 音乐渐弱, 只剩心跳
```

---

## 六、技术实现

### 6.1 音频格式
- **BGM**: OGG Vorbis (循环点标记), 128kbps, 立体声
- **SFX**: OGG Vorbis, 96kbps, 单声道 (空间音效除外)
- **Ambient**: OGG Vorbis, 64kbps, 立体声

### 6.2 Web Audio API实现
```javascript
// 音频管理器伪代码
class AudioManager {
  constructor() {
    this.context = new AudioContext();
    this.bgmNode = this.context.createGain();
    this.sfxNode = this.context.createGain();
    this.ambientNode = this.context.createGain();

    // 主混音总线
    this.masterNode = this.context.createGain();
    this.bgmNode.connect(this.masterNode);
    this.sfxNode.connect(this.masterNode);
    this.ambientNode.connect(this.masterNode);
    this.masterNode.connect(this.context.destination);
  }

  playBGM(url, fadeTime = 2) {
    // 淡入淡出逻辑
    this.bgmNode.gain.linearRampToValueAtTime(1, this.context.currentTime + fadeTime);
  }

  addFilter(type, frequency) {
    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    this.bgmNode.connect(filter);
    filter.connect(this.masterNode);
  }
}
```

### 6.3 音频预加载策略
- **立即加载**: 当前区域BGM + 常用SFX
- **延迟加载**: 下一区域BGM (进入前2层开始加载)
- **按需加载**: BOSS音乐 (进入BOSS层时加载)

### 6.4 移动端优化
- 使用 Web Audio API (iOS Safari 支持)
- 首次用户交互后解锁音频上下文
- 限制同时播放音效数量 (最多8个)
- 低端设备降低采样率 (44.1kHz → 22.05kHz)

---

## 七、音频资源清单

### 7.1 音乐文件 (13首)
| 文件名 | 时长 | 用途 | 大小估算 |
|--------|------|------|----------|
| zone1_lab.ogg | 3:00 | 实验室BGM | 2.8MB |
| zone2_breeding.ogg | 3:30 | 培育区BGM | 3.2MB |
| zone3_corruption.ogg | 4:00 | 污染核心BGM | 3.7MB |
| zone4_abyss.ogg | 5:00 | 深渊BGM | 4.6MB |
| zone5_end.ogg | 6:00 | 终焉BGM | 5.5MB |
| combat_normal.ogg | 1:30 (循环) | 普通战斗 | 1.4MB |
| combat_elite.ogg | 2:00 (循环) | 精英战斗 | 1.8MB |
| boss1.ogg | 3:00 | BOSS1 | 2.8MB |
| boss2.ogg | 3:30 | BOSS2 | 3.2MB |
| boss3.ogg | 4:00 | BOSS3 | 3.7MB |
| boss4.ogg | 4:30 | BOSS4 | 4.1MB |
| boss5_phase1.ogg | 2:00 | 最终BOSS阶段1 | 1.8MB |
| boss5_phase2.ogg | 2:00 | 最终BOSS阶段2 | 1.8MB |
| boss5_phase3.ogg | 2:30 | 最终BOSS阶段3 | 2.3MB |
| **总计** | **46:30** | | **42.7MB** |

### 7.2 音效文件 (50+)
| 类别 | 数量 | 单个大小 | 总大小 |
|------|------|----------|--------|
| 攻击音效 | 10 | 50KB | 500KB |
| 受伤音效 | 10 | 80KB | 800KB |
| 死亡音效 | 10 | 150KB | 1.5MB |
| 寄生音效 | 5 | 200KB | 1MB |
| UI音效 | 10 | 20KB | 200KB |
| 环境音效 | 15 | 100KB | 1.5MB |
| **总计** | **60** | | **5.5MB** |

### 7.3 环境音循环 (5首)
| 文件名 | 时长 | 大小 |
|--------|------|------|
| ambient_lab.ogg | 2:00 (循环) | 750KB |
| ambient_breeding.ogg | 2:00 (循环) | 750KB |
| ambient_corruption.ogg | 2:00 (循环) | 750KB |
| ambient_abyss.ogg | 2:00 (循环) | 750KB |
| ambient_end.ogg | 2:00 (循环) | 750KB |
| **总计** | **10:00** | **3.75MB** |

**音频资源总大小**: ~52MB

---

## 八、制作优先级

### P0 (核心体验)
1. 5个区域BGM
2. 普通战斗音乐
3. 基础攻击/受伤/死亡音效 (各3个通用)
4. 寄生成功/失败音效
5. UI点击音效

### P1 (完整体验)
1. 5个BOSS音乐
2. 精英战斗音乐
3. 完整战斗音效集 (10种攻击, 10种受伤, 10种死亡)
4. 环境音循环 (5个区域)
5. 完整UI音效

### P2 (沉浸增强)
1. 环境音效 (脚步/门/楼梯)
2. 污染音效系统
3. 自适应音乐分层
4. 3D空间音效

---

## 九、Suno生成工作流

### 9.1 生成步骤
1. 使用上述Suno提示词生成初版
2. 导出WAV格式 (最高质量)
3. 在DAW中编辑:
   - 设置循环点 (BGM)
   - 淡入淡出处理
   - 音量标准化 (-14 LUFS)
   - 移除首尾空白
4. 导出为OGG Vorbis (Quality 5)
5. 在游戏中测试循环无缝性

### 9.2 循环点设置
```
BGM循环结构:
Intro (不循环) → Loop Start → [A - B - A'] → Loop End → 回到Loop Start
```

### 9.3 质量检查清单
- [ ] 循环点无爆音/断层
- [ ] 音量一致 (±2dB内)
- [ ] 频率范围合理 (20Hz-20kHz)
- [ ] 立体声平衡
- [ ] 移动端播放测试
- [ ] 与其他音乐/音效混音测试

---

## 十、版权与授权

**Suno生成音乐**:
- Suno Pro订阅用户拥有商业使用权
- 需在游戏致谢中注明 "Music generated with Suno AI"

**音效**:
- 推荐使用 Freesound.org (CC0/CC-BY授权)
- 或使用 JSFXR/ChipTone 生成原创音效

**最终混音**:
- 建议聘请专业音频工程师进行最终混音
- 或使用 iZotope Ozone 自动母带处理

---

## 附录: 快速参考

### 音乐情绪关键词
- 实验腔体: Organic, Pulsating, Bioluminescent
- 培育巢穴: Chitinous, Iridescent, Unsettling
- 污染核心: Necrotic, Chaotic, Membrane-rupture
- 深层菌脉: Vast, Fungal, Cosmic Horror
- 终焉腔: Epic, Desperate, Transcendent

### BPM参考
- 探索: 60-100 BPM (慢节奏)
- 战斗: 120-160 BPM (中快节奏)
- BOSS: 140-200 BPM (快节奏)
- 最终BOSS: 140→180 BPM (加速)

### 调性参考
- 恐怖: 小调, 减和弦, 不协和音程
- 紧张: 半音阶, 增和弦
- 史诗: 大调, 完全和弦, 宽广音程
- 绝望: 小调, 下行旋律
- 希望: 大调, 上行旋律, 明亮音色
