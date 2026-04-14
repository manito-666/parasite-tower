# 濒死转移协议 (Death Transfer Protocol) - 完整代码审计报告

## 文件: /Users/wangzhipeng/GolandProjects/parasite-tower/android/app/src/main/assets/index.html

---

## 🔴 **严重 Bug**

### Bug #1: CSS Selector 不匹配导致死亡形态灰化无效
**位置**: 行 681-687
**问题**: CSS 定义了 `.form-slot.dead-form` 但代码使用的是 `.fslot` 类名
```css
.form-slot.dead-form {
  opacity:0.35; filter:grayscale(100%);
}
.form-slot.dead-form::after {
  content:'💀'; position:absolute; top:50%; left:50%;
  transform:translate(-50%,-50%); font-size:18px;
}
```

**代码实际使用** (行 4256):
```javascript
if(game._deadForms[i]) cls+=' dead-form';
```
应用到元素 (行 4254):
```javascript
let cls='fslot'+(i===game.currentForm?' active':' filled');
```

**影响**: 死亡形态不会显示灰化效果和骷髅标记 ☠️
**修复**: 将 CSS 改为 `.fslot.dead-form`
```css
.fslot.dead-form {
  opacity:0.35; filter:grayscale(100%);
}
.fslot.dead-form::after {
  content:'💀'; position:absolute; top:50%; left:50%;
  transform:translate(-50%,-50%); font-size:18px;
}
```

---

### Bug #2: emergencyTakeover 中意识转移后重复重组僵直消息
**位置**: 行 4782-4821
**问题**: 在 `emergencyTakeover()` 中当选择多个形态时，每次点击卡片都会执行两次消息和僵直重置：
```javascript
card.onclick=()=>{
  executeDeathTransfer(idx);
  addMsg('紧急接管! -1000EP 跳过僵直');  // ← 重复
  game._stiffnessTurns=0;                // ← 重复
};
```

但在 `executeDeathTransfer()` 中已经设置了 `game._stiffnessTurns=1` (行 4759)，然后立即被重置为 0。

**额外问题**: 单槽位情况 (行 4794-4795) 也重复了相同逻辑

**影响**: 玩家收到重复消息，逻辑混乱
**修复**: 移除 onclick 中的重复代码，只在 emergencyTakeover 主逻辑中处理一次
```javascript
// 修复后
function emergencyTakeover(){
  if(game.player.evoPoints<1000){addMsg('EP不足');return;}
  const overlay=document.getElementById('transfer-overlay');
  const aliveSlots=overlay._aliveSlots||[];
  
  game.player.evoPoints-=1000;
  if(overlay._cdTimer) clearInterval(overlay._cdTimer);
  
  // 显示提示一次
  addMsg('紧急接管! -1000EP 跳过僵直');
  game._stiffnessTurns=0;
  
  if(aliveSlots.length===1){
    executeDeathTransfer(aliveSlots[0]);
    return;
  }
  
  // 多个形态：显示选择卡片
  const formList=document.getElementById('transfer-form-list');
  const timerEl=document.getElementById('transfer-timer');
  timerEl.textContent='▶';
  formList.innerHTML='';
  aliveSlots.forEach(idx=>{
    const f=game.forms[idx];
    const card=document.createElement('div');
    card.className='transfer-form-card';
    card.innerHTML=`...`;
    card.onclick=()=>executeDeathTransfer(idx);  // ← 不重复调用
    formList.appendChild(card);
  });
}
```

---

### Bug #3: checkDeathTransfer 中死亡标记和 HP 清零没有同步
**位置**: 行 4669-4698
**问题**: 
```javascript
function checkDeathTransfer(){
  saveCurrentForm();
  game.forms[game.currentForm].hp=0;           // ← 设置 HP=0
  game._deadForms[game.currentForm]=true;      // ← 标记死亡
  
  const aliveSlots=[];
  game.forms.forEach((f,i)=>{
    // 检查：!game._deadForms[i]&&f.hp>0
    if(f && i!==game.currentForm && !game._deadForms[i] && f.hp>0){
      aliveSlots.push(i);
    }
  });
```

虽然看起来正常，但存在一个**隐隐约约的时间窗口问题**：

1. `saveCurrentForm()` 后，`game.forms[game.currentForm]` 现在有 HP=0
2. 立即被标记为死亡
3. 但如果战斗UI还在渲染或存在其他异步操作，可能读到不一致状态

**实际潜在问题**: 没有问题，但缺乏防御性编程

---

### Bug #4: 死亡检测中 attack() 无法正确中断战斗
**位置**: 行 2636-2656
**问题**: 当触发濒死转移时：
```javascript
if(p.hp<=0){
  game._combatRound=0;
  const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
  if(aliveBackups.length>0){
    try{sounds.death();}catch(e){}
    log.innerHTML+='<div style="color:#0ff;font-weight:bold;margin-top:6px">// 意识抽离中... //</div>';
    log.scrollTop=log.scrollHeight;
    addMsg('意识正在脱离濒死躯体...');
    setTimeout(()=>checkDeathTransfer(),2000);
    return;  // ← 返回但不调用 closeCombat()！
  }
  // 无备用 → 正常死亡
  try{sounds.death();}catch(e){}
  log.innerHTML+='<div style="color:#f04;font-weight:bold;margin-top:6px">// 宿主死亡 //</div>';
  log.scrollTop=log.scrollHeight;
  addMsg('宿主死亡...');
  setTimeout(()=>{closeCombat();triggerDeath();},1200);
  return;
}
```

**问题**: 转移时没有调用 `closeCombat()`，导致：
- `game.target` 不被清空
- `game._combatRound` 虽然重置为 0，但战斗状态不完全清晰
- 如果在 2 秒延迟期间玩家调用其他函数，可能出现竞态

**影响**: 转移后可能保留战斗状态，导致 UI 混乱或再次攻击时出问题
**修复**: 在转移时也调用 closeCombat()
```javascript
if(aliveBackups.length>0){
  try{sounds.death();}catch(e){}
  log.innerHTML+='<div style="color:#0ff;font-weight:bold;margin-top:6px">// 意识抽离中... //</div>';
  log.scrollTop=log.scrollHeight;
  addMsg('意识正在脱离濒死躯体...');
  closeCombat();  // ← 添加这行
  setTimeout(()=>checkDeathTransfer(),2000);
  return;
}
```

---

### Bug #5: executeDeathTransfer 后立即战斗会绕过僵直
**位置**: 行 4750-4779
**问题**: 转移后设置 `game._stiffnessTurns=1`，但如果玩家立即点击攻击按钮：
```javascript
function executeDeathTransfer(targetIndex){
  const overlay=document.getElementById('transfer-overlay');
  if(overlay._cdTimer) clearInterval(overlay._cdTimer);
  overlay.classList.remove('active');
  
  loadForm(targetIndex);
  game._stiffnessTurns=1;  // ← 设置为 1
  
  const aliveCount=game.forms.filter((f,i)=>f&&!game._deadForms[i]&&f.hp>0).length;
  if(aliveCount<=1){
    game._loneWolf=true;
    game.player.atk=Math.floor(game.player.atk*1.3);
    addMsg('⚠ 孤狼模式激活! ATK+30% 但无法切换形态');
    addMsg('下次死亡将触发深度崩溃!');
  }
  
  addMsg('意识转移成功! 切换为 '+game.player.name);
  addMsg('重组僵直: 本回合无法行动但免受伤害');
  
  if(game.target){
    showCombat();  // ← 刷新 UI，target 仍然存在！
  }
  updateFormBar();
  render();
}
```

在 `attack()` 检查僵直 (行 2472-2479)：
```javascript
if(game._stiffnessTurns>0){
  game._stiffnessTurns--;
  const log=document.getElementById('combat-log');
  if(log) log.innerHTML+='<div style="color:#0ff;font-weight:bold">【重组僵直】本回合无法行动，但免受伤害</div>';
  addMsg('重组僵直: 免疫1回合');
  showCombat(); render();
  return;
}
```

**潜在问题**: 这其实是正常的，只要 `attack()` 一开始就检查僵直。但如果存在其他途径调用 `attack()` 之前会清零 `_stiffnessTurns`，就会有问题。

**实际问题**: 没有大问题，但缺乏UI锁定。战斗中玩家连点可能绕过检查。
**修复**: 在 attack() 开始时也添加战斗状态锁定
```javascript
function attack(){
  if(!game.target||game.target.hp<=0)return;
  if(game._inCombat)return;  // ← 添加锁定
  game._inCombat=true;
  try{
    // ... 战斗逻辑
  }finally{
    game._inCombat=false;
  }
}
```

---

## 🟡 **中等 Bug**

### Bug #6: showTransferOverlay 中 autoSelect 路径重复代码
**位置**: 行 4701-4747
**问题**: 当 `autoSelect=true` 时，卡片在倒计时结束后显示，但如果倒计时时间太短（2秒），用户可能未及时看到。另外，autoSelect 路径显示卡片后自动选择，这是冗余的。

```javascript
if(countdown<=0){
  clearInterval(cdTimer);
  timerEl.textContent='▶';
  // 倒计时结束，显示可选形态卡片
  aliveSlots.forEach(idx=>{
    const f=game.forms[idx];
    const card=document.createElement('div');
    // ... 创建卡片
    formList.appendChild(card);
  });
  
  if(autoSelect){
    // 自动选中唯一形态
    setTimeout(()=>executeDeathTransfer(aliveSlots[0]),800);
  }
}
```

**问题**: autoSelect 时显示卡片然后 800ms 后自动转移，用户看不到卡片就转了。而且代码中说"如果只有一个形态"，实际上应该不显示卡片。

**修复**: 当 autoSelect=true 时，直接转移，不显示卡片
```javascript
if(countdown<=0){
  clearInterval(cdTimer);
  
  if(autoSelect){
    // 自动选中唯一形态，直接转移
    executeDeathTransfer(aliveSlots[0]);
  } else {
    // 多个形态，显示选择卡片
    timerEl.textContent='▶';
    aliveSlots.forEach(idx=>{
      const f=game.forms[idx];
      const card=document.createElement('div');
      // ... 创建卡片
      card.onclick=()=>executeDeathTransfer(idx);
      formList.appendChild(card);
    });
  }
}
```

---

### Bug #7: emergencyTakeover 没有验证 aliveSlots 有效性
**位置**: 行 4782-4821
**问题**:
```javascript
function emergencyTakeover(){
  if(game.player.evoPoints<1000){addMsg('EP不足');return;}
  const overlay=document.getElementById('transfer-overlay');
  const aliveSlots=overlay._aliveSlots||[];  // ← 可能为空数组！
  
  game.player.evoPoints-=1000;  // ← 直接扣除 EP
  
  if(overlay._cdTimer) clearInterval(overlay._cdTimer);
  
  if(aliveSlots.length===1){
    // ...
  } else {
    // 多个形态的代码
    // 但如果 aliveSlots.length === 0 会怎样？
  }
}
```

**问题**: 如果 `overlay._aliveSlots` 未设置（不应该发生，但防御性编程），或者在某个竞态条件下变为空，会直接扣除 1000 EP 但不转移。

**影响**: EP 丢失，游戏陷入卡住状态
**修复**: 先验证，再扣除
```javascript
function emergencyTakeover(){
  if(game.player.evoPoints<1000){addMsg('EP不足');return;}
  const overlay=document.getElementById('transfer-overlay');
  const aliveSlots=overlay._aliveSlots||[];
  
  // ← 先验证
  if(aliveSlots.length===0){
    addMsg('没有可用形态');
    return;
  }
  
  game.player.evoPoints-=1000;
  if(overlay._cdTimer) clearInterval(overlay._cdTimer);
  
  // ... rest of code
}
```

---

### Bug #8: switchForm 中 _deadForms 检查缺少边界检查
**位置**: 行 3709-3726
**问题**:
```javascript
function switchForm(index){
  if(game._loneWolf){addMsg('孤狼模式：无法切换形态');return;}
  if(game._deadForms[index]){addMsg('该形态已在本层阵亡');return;}  // ← 可能越界
  if(game.target){addMsg('战斗中无法切换形态');return;}
  if(game.formCooldown>0){addMsg('形态切换冷却中('+Math.ceil(game.formCooldown/1000)+'s)');return;}
  if(index===game.currentForm)return;
  if(!game.forms[index]){addMsg('空槽位');return;}
  saveCurrentForm();
```

**问题**: 如果 `index` 超出范围（比如 >= 3），`game._deadForms[index]` 访问会返回 `undefined`，而 `if(undefined)` 为 false，会继续执行。

**影响**: 可能允许切换到不存在的形态
**修复**: 先检查索引有效性
```javascript
function switchForm(index){
  if(index<0 || index>=game.forms.length){addMsg('无效形态');return;}  // ← 添加
  if(game._loneWolf){addMsg('孤狼模式：无法切换形态');return;}
  if(game._deadForms[index]){addMsg('该形态已在本层阵亡');return;}
  // ...
}
```

---

### Bug #9: goToFloor 中 _deadForms 恢复逻辑缺少索引检查
**位置**: 行 2064-2076
**问题**:
```javascript
game._deadForms.forEach((dead,idx)=>{
  if(dead && game.forms[idx]){
    game.forms[idx].hp=Math.max(1,Math.floor(game.forms[idx].maxHp*0.2));
  }
});
game._deadForms=[false,false,false];
```

**问题**: 虽然有 `game.forms[idx]` 检查，但如果 `maxHp` 为 0 或负数会导致 HP=0（因为 max(1, floor(0))=1，但如果 maxHp 为负更糟）。

**实际问题**: `maxHp` 应该总是正数，所以不是严重问题，但缺乏防御

**修复**: 添加 maxHp 检查
```javascript
game._deadForms.forEach((dead,idx)=>{
  if(dead && game.forms[idx] && game.forms[idx].maxHp>0){
    game.forms[idx].hp=Math.max(1,Math.floor(game.forms[idx].maxHp*0.2));
  }
});
```

---

## 🔵 **轻微问题**

### Issue #10: 孤狼模式激活后 ATK 增幅在 attack() 中重复应用
**位置**: 行 4764-4765 和 2508
**问题**:
```javascript
// executeDeathTransfer 中
if(aliveCount<=1){
  game._loneWolf=true;
  game.player.atk=Math.floor(game.player.atk*1.3);  // ← 乘以 1.3
  addMsg('⚠ 孤狼模式激活! ATK+30% 但无法切换形态');
}

// attack() 中
if(game._loneWolf) pDmg=Math.floor(pDmg*1.3);  // ← 又乘以 1.3！
```

**影响**: 伤害计算：ATK 本身乘以 1.3，然后伤害再乘以 1.3 = 1.69 倍！

这可能是**意图设计**（激活时一次，每回合战斗时再加一次），但非常容易混淆。

**建议**: 代码注释明确这是双重加成，或改为只在一个地方应用

---

### Issue #11: _stiffnessTurns 在 emergencyTakeover 中被重复清零
**位置**: 行 4795, 4817
**问题**: 已在 Bug #2 中描述，这是操作层面的 bug

---

### Issue #12: transfer-overlay 的 overlay._cdTimer 和 overlay._aliveSlots 使用了非标准属性存储
**位置**: 行 4745-4746, 4785
**问题**:
```javascript
overlay._cdTimer=cdTimer;
overlay._aliveSlots=aliveSlots;
```

虽然 JavaScript 允许这样做，但这是**非标准的属性绑定**方式，可能在某些框架或严格模式下出问题。

**建议**: 使用 `data-*` 属性或单独的 Map 存储
```javascript
// 改为
if(!window._transferState) window._transferState={};
window._transferState.cdTimer=cdTimer;
window._transferState.aliveSlots=aliveSlots;

// 或使用 WeakMap
const transferStateMap=new WeakMap();
transferStateMap.set(overlay, {cdTimer, aliveSlots});
```

---

### Issue #13: collapseChoose 中死亡检测没有关闭战斗
**位置**: 行 4457-4467
**问题**:
```javascript
if(p.hp<=0){
  p.hp=0;
  const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
  if(aliveBackups.length>0){
    checkDeathTransfer();
    // 没有调用 closeCombat()！
  }else{
    triggerDeath();
    // 这里也没有
  }
  return;
}
```

**影响**: 同 Bug #4，战斗状态可能不被正确清理
**修复**:
```javascript
if(p.hp<=0){
  p.hp=0;
  closeCombat();  // ← 添加
  const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
  if(aliveBackups.length>0){
    checkDeathTransfer();
  }else{
    triggerDeath();
  }
  return;
}
```

---

### Issue #14: 没有检查 _deadForms 数组长度是否与 forms 匹配
**位置**: 整个代码
**问题**: 如果动态添加或移除形态槽位（比如进化系统可能改变槽位数），_deadForms 数组不会同步更新

**影响**: 可能出现数组越界或不一致
**修复**: 在 goToFloor 和 rollbackToAnchor 中确保数组初始化时与 forms 长度一致
```javascript
// 在初始化时
const formsLength=game.forms.length;
game._deadForms=Array(formsLength).fill(false);
```

---

## 📋 **完整修复清单**

### 优先级 1 (必修):
- [ ] Bug #1: 修改 CSS 从 `.form-slot.dead-form` 改为 `.fslot.dead-form`
- [ ] Bug #4: 在转移时调用 `closeCombat()`
- [ ] Bug #5: 在 `attack()` 中添加战斗状态锁定

### 优先级 2 (强烈建议):
- [ ] Bug #2: 移除 emergencyTakeover 中的重复代码
- [ ] Bug #6: 优化 autoSelect 路径
- [ ] Bug #7: 在 emergencyTakeover 中验证 aliveSlots
- [ ] Bug #8: 在 switchForm 中添加索引边界检查
- [ ] Issue #13: 在 collapseChoose 中添加 closeCombat()

### 优先级 3 (建议改进):
- [ ] Bug #9: 添加防御性检查
- [ ] Issue #10: 添加代码注释说明孤狼模式双重加成
- [ ] Issue #12: 改为标准属性存储方式
- [ ] Issue #14: 确保数组初始化时长度一致

---

## 🧪 **测试场景**

1. **基础转移**: 3 个形态，1 个死亡 → 检查 UI 更新，死亡形态是否显示骷髅和灰化
2. **孤狼模式**: 2 个形态，1 个死亡 → 检查 ATK 增幅是否正确（1.3 倍 vs 1.69 倍）
3. **紧急接管**: 有 1000+ EP，触发死亡 → 检查是否能跳过等待，僵直是否正确应用
4. **战斗中死亡**: 在战斗中触发死亡转移 → 检查 closeCombat 是否被调用，target 是否被清空
5. **快速连击**: 转移后立即连击 → 检查僵直是否正确阻挡
6. **换层恢复**: 形态死亡后换层 → 检查 HP 恢复为 20%, 死亡标记是否重置
7. **崩溃后死亡**: 污染崩溃选择后 HP<=0 → 检查是否正确转移或死亡

---

## 总结

**总共发现**: 14 个 bug/问题
- **严重**: 4 个 (#1, #2, #4, #5)
- **中等**: 5 个 (#6, #7, #8, #9, #13)
- **轻微**: 5 个 (#10, #11, #12, #14 及其他)

**最关键的修复**:
1. CSS 选择器匹配 (Bug #1) - 导致 UI 完全无法显示
2. 战斗状态管理 (Bug #4, #13) - 导致游戏卡住
3. 删除重复代码 (Bug #2) - 导致混乱的游戏流程
