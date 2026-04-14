# 濒死转移协议 - 快速修复补丁

## 🔴 P0: 关键修复 (必须在 24h 内完成)

### 修复 #1: CSS 选择器 (行 681-687)

**当前代码 (错误):**
```css
.form-slot.dead-form {
  opacity:0.35; filter:grayscale(100%);
}
.form-slot.dead-form::after {
  content:'💀'; position:absolute; top:50%; left:50%;
  transform:translate(-50%,-50%); font-size:18px;
}
```

**修正后:**
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

### 修复 #2: 死亡时调用 closeCombat (行 2640-2648)

**当前代码 (不完整):**
```javascript
if(aliveBackups.length>0){
  // 有备用形态 → 意识抽离
  try{sounds.death();}catch(e){}
  log.innerHTML+='<div style="color:#0ff;font-weight:bold;margin-top:6px">// 意识抽离中... //</div>';
  log.scrollTop=log.scrollHeight;
  addMsg('意识正在脱离濒死躯体...');
  setTimeout(()=>checkDeathTransfer(),2000);
  return;
}
```

**修正后:**
```javascript
if(aliveBackups.length>0){
  // 有备用形态 → 意识抽离
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

### 修复 #3: 崩溃后死亡调用 closeCombat (行 4458-4467)

**当前代码:**
```javascript
if(p.hp<=0){
  p.hp=0;
  const aliveBackups=game.forms.filter((f,i)=>f&&i!==game.currentForm&&!game._deadForms[i]&&f.hp>0);
  if(aliveBackups.length>0){
    checkDeathTransfer();
  }else{
    triggerDeath();
  }
  return;
}
```

**修正后:**
```javascript
if(p.hp<=0){
  p.hp=0;
  closeCombat();  // ← 添加这行
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

### 修复 #4: attack() 添加战斗锁定 (行 2463)

**当前代码:**
```javascript
function attack(){
  if(!game.target||game.target.hp<=0)return;
  const p=game.player,m=game.target;
  if(!game._combatRound)game._combatRound=0;
  if(!game._combatTotalDmg)game._combatTotalDmg=0;
  game._combatRound++;
```

**修正后:**
```javascript
function attack(){
  if(!game.target||game.target.hp<=0)return;
  if(game._inCombat)return;  // ← 添加这行
  const p=game.player,m=game.target;
  if(!game._combatRound)game._combatRound=0;
  if(!game._combatTotalDmg)game._combatTotalDmg=0;
  game._combatRound++;
  
  // ... 战斗逻辑 ...
  
  // 在函数结尾 (所有 return 之前):
  game._inCombat=false;  // ← 添加这行
  return;
}
```

或者使用 try-finally 保证执行:
```javascript
function attack(){
  if(!game.target||game.target.hp<=0)return;
  if(game._inCombat)return;
  game._inCombat=true;
  
  try{
    const p=game.player,m=game.target;
    // ... 所有战斗逻辑 ...
  }finally{
    game._inCombat=false;
  }
}
```

---

## 🟡 P1: 高优先级修复 (1-2 天内完成)

### 修复 #5: emergencyTakeover 去重 (行 4782-4821)

**当前代码 (复杂且重复):**
```javascript
function emergencyTakeover(){
  if(game.player.evoPoints<1000){addMsg('EP不足');return;}
  const overlay=document.getElementById('transfer-overlay');
  const aliveSlots=overlay._aliveSlots||[];
  
  game.player.evoPoints-=1000;
  if(overlay._cdTimer) clearInterval(overlay._cdTimer);
  
  if(aliveSlots.length===1){
    executeDeathTransfer(aliveSlots[0]);
    addMsg('紧急接管! -1000EP 跳过僵直');  // ← 重复！
    game._stiffnessTurns=0;               // ← 重复！
    return;
  }
  
  const formList=document.getElementById('transfer-form-list');
  const timerEl=document.getElementById('transfer-timer');
  timerEl.textContent='▶';
  formList.innerHTML='';
  aliveSlots.forEach(idx=>{
    const f=game.forms[idx];
    const card=document.createElement('div');
    card.className='transfer-form-card';
    card.innerHTML=`
      <div class="form-icon">${f.icon||'👤'}</div>
      <div class="form-name">${f.name}</div>
      <div class="form-hp">HP:${f.hp}/${f.maxHp}</div>
      <div style="font-size:10px;color:#aaa">ATK:${f.atk} DEF:${f.def}</div>
    `;
    card.onclick=()=>{
      executeDeathTransfer(idx);
      addMsg('紧急接管! -1000EP 跳过僵直');  // ← 重复！
      game._stiffnessTurns=0;               // ← 重复！
    };
    formList.appendChild(card);
  });
}
```

**修正后 (简洁且逻辑清晰):**
```javascript
function emergencyTakeover(){
  if(game.player.evoPoints<1000){addMsg('EP不足');return;}
  const overlay=document.getElementById('transfer-overlay');
  const aliveSlots=overlay._aliveSlots||[];
  
  // 验证存在可用形态
  if(aliveSlots.length===0){addMsg('没有可用形态');return;}
  
  game.player.evoPoints-=1000;
  if(overlay._cdTimer) clearInterval(overlay._cdTimer);
  
  // 显示提示一次，作用于所有情况
  addMsg('紧急接管! -1000EP 跳过僵直');
  game._stiffnessTurns=0;
  
  // 单一形态：直接转移
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
    card.innerHTML=`
      <div class="form-icon">${f.icon||'👤'}</div>
      <div class="form-name">${f.name}</div>
      <div class="form-hp">HP:${f.hp}/${f.maxHp}</div>
      <div style="font-size:10px;color:#aaa">ATK:${f.atk} DEF:${f.def}</div>
    `;
    card.onclick=()=>executeDeathTransfer(idx);  // ← 不重复调用
    formList.appendChild(card);
  });
}
```

---

### 修复 #6: switchForm 边界检查 (行 3709)

**当前代码:**
```javascript
function switchForm(index){
  if(game._loneWolf){addMsg('孤狼模式：无法切换形态');return;}
  if(game._deadForms[index]){addMsg('该形态已在本层阵亡');return;}
  // ...
}
```

**修正后:**
```javascript
function switchForm(index){
  // 添加边界检查
  if(index<0 || index>=game.forms.length){addMsg('无效形态');return;}
  
  if(game._loneWolf){addMsg('孤狼模式：无法切换形态');return;}
  if(game._deadForms[index]){addMsg('该形态已在本层阵亡');return;}
  // ...
}
```

---

### 修复 #7: showTransferOverlay 逻辑优化 (行 4737-4740)

**当前代码 (冗余):**
```javascript
if(autoSelect){
  // 自动选中唯一形态
  setTimeout(()=>executeDeathTransfer(aliveSlots[0]),800);
}
```

**修正后:**
```javascript
if(autoSelect){
  // 自动选中唯一形态，直接转移，不显示卡片
  clearInterval(cdTimer);  // 清除倒计时
  executeDeathTransfer(aliveSlots[0]);
  return;  // 跳过卡片显示
}
```

---

## 📝 验证清单

修复完成后请逐项验证：

- [ ] CSS 灰化效果在死亡形态上显示正确
- [ ] 死亡形态显示骷髅标记 ☠️
- [ ] 转移时 UI 正确更新，没有遗留战斗界面
- [ ] 转移后 game.target 被正确清空
- [ ] 转移后立即攻击时僵直正确阻挡
- [ ] 紧急接管时消息只显示一次
- [ ] 无有效形态时紧急接管被拒绝

---

## 💾 部署检查

修复后运行以下检查：

```javascript
// 在浏览器控制台验证
console.log('_deadForms 长度:', game._deadForms.length);
console.log('forms 长度:', game.forms.length);
console.assert(game._deadForms.length === game.forms.length, '数组长度不匹配！');
console.assert(typeof game._inCombat !== 'undefined', '缺乏战斗锁定！');
```

