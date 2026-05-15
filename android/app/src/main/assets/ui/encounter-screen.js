// ====================================================
// 你也是我 战斗决策屏 - 赌桌式 UI
// 信息层级: VS对比 → 成功率(核心) → 预览(辅助) → 操作
// 色彩语义: 绿=增益 红=危险/负面 蓝=特殊机制 橙=战斗 灰=保守
// ====================================================

// 新手引导目标判定（仅 tut_dog 或带高亮的引导怪 100%）
function _isTutGuidedTarget(t){
  if(!t)return false;
  if(t.id==='tut_dog')return true;
  if(t._tutorialHighlight)return true;
  return false;
}
function _computePossessRate(t){
  if(_isTutGuidedTarget(t))return 100;
  if(typeof getNegBaseRate==='function')return Math.min(95,Math.max(1,Math.round(getNegBaseRate()*100)));
  return 16;
}

function getPossessRateColor(rate) {
  if (rate <= 30) {
    var t = rate / 30;
    return 'rgb(' + Math.round(120 + 104 * t) + ',' + Math.round(30 + 56 * t) + ',' + Math.round(160 + 93 * t) + ')';
  } else if (rate <= 60) {
    var t = (rate - 30) / 30;
    return 'rgb(' + Math.round(224) + ',' + Math.round(86 + 80 * t) + ',' + Math.round(253) + ')';
  } else {
    var t = (rate - 60) / 35;
    return 'rgb(' + Math.round(224 + 31 * t) + ',' + Math.round(166 + 89 * t) + ',' + Math.round(253) + ')';
  }
}

function getMonsterFlavorText(type) {
  const texts = {
    rat: '改造过的神经回路让它的眼中闪烁着不属于啮齿类的光芒',
    roach: '辐射让它的外壳变成了活的装甲',
    slime: '第一批基因改造的副产物，被标记为废弃，却拒绝消亡',
    dog: '忠诚的基因被扭曲了，但那双眼睛里依然有人类能理解的东西',
    wasp: '翅膀震动的频率已经超出了人类的听觉范围',
    wolf: '它不是在狩猎——它在计算',
    spider: '蛛网上的每一滴酸液都在腐蚀你的退路',
    bat: '铁爪的寒光比任何武器都锋利',
    guard: '制服和皮肤已经融为一体',
    boss1: '他说他看到了进化的终点'
  };
  return texts[type] || '在黑暗中，有什么东西在注视着你';
}
// === 长按FIGHT：自动战斗 ===
let _fightHoldTimer = null;

function startFightHold() {
  if (_fightHoldTimer) clearTimeout(_fightHoldTimer);
  _fightHoldTimer = setTimeout(() => {
    game._autoFight = true;
    const btn = document.querySelector('#encounter-btns .fight');
    if (btn) { btn.innerHTML = '<span style="font-size:11px">⚔ 自动中</span>'; btn.classList.add('auto-active'); }
    try { navigator.vibrate(100); } catch(e) {}
    // 立刻开始第一次攻击
    if (game.target && game.target.hp > 0 && game.player.hp > 0) window.attack();
  }, 1000);
}

function cancelFightHold() {
  if (_fightHoldTimer) { clearTimeout(_fightHoldTimer); _fightHoldTimer = null; }
}

let _possActualRate = 0;

// === 污染战斗界面渗透 ===
let _polCombatFlicker = null;

function startPollutionCombatEffects(pol, rate) {
  if (_polCombatFlicker) clearInterval(_polCombatFlicker);
  if (pol < 50) return;

  const _cRateEl = document.getElementById('enc-rate-display');
  const _cRateCore = document.querySelector('.enc-rate-possess');
  const _cTargetLabel = document.querySelector('.enc-target-card .enc-card-label');
  _polCombatFlicker = setInterval(() => {
    if (!game.target || game.target.hp <= 0) { stopPollutionCombatEffects(); return; }
    if (!_cRateEl) return;

    if (pol >= 75) {
      const targetLabel = _cTargetLabel;
      if (targetLabel && Math.random() > 0.7) {
        const glitchNames = ['???', 'ERR', '̷̢̛', '...', targetLabel.dataset.real || '目标'];
        if (!targetLabel.dataset.real) targetLabel.dataset.real = targetLabel.textContent;
        targetLabel.textContent = glitchNames[Math.floor(Math.random() * glitchNames.length)];
        setTimeout(() => { if (targetLabel.dataset.real) targetLabel.textContent = targetLabel.dataset.real; }, 200);
      }
      if (_cRateCore) _cRateCore.classList.add('pol-glitch');
      setTimeout(() => { if (_cRateCore) _cRateCore.classList.remove('pol-glitch'); }, 150);
    }

    if (pol >= 50) {
      if (Math.random() > 0.6) {
        _cRateEl.style.color = '#f04';
        _cRateEl.style.textShadow = '0 0 8px rgba(255,0,110,0.8)';
        setTimeout(() => {
          if (_cRateEl) { _cRateEl.style.color = ''; _cRateEl.style.textShadow = ''; }
        }, 250);
      }
    }
  }, 800);
}

function stopPollutionCombatEffects() {
  if (_polCombatFlicker) { clearInterval(_polCombatFlicker); _polCombatFlicker = null; }
}

// === 立绘呼吸动画循环 ===
let _portraitRAF = null;
function animatePortraits() {
  // emoji模式无需canvas动画，保留RAF用于污染效果等
  if (document.getElementById('combat-overlay').classList.contains('active') || document.getElementById('negotiate-overlay').classList.contains('active')) {
    _portraitRAF = requestAnimationFrame(animatePortraits);
  }
}

// === 主入口 ===
(function() {
  const initTimer = setInterval(() => {
    if (typeof game === 'undefined' || typeof showCombat === 'undefined') return;
    clearInterval(initTimer);
    window._giLoaded = true;


    const origShowCombat = window.showCombat;
    window.showCombat = function() {
      try {
        const t = game.target;
        if (!t) return;
        // 有弹窗正在显示时延迟战斗，避免遮挡
        const fragOv = document.getElementById('fragment-overlay');
        const fragChoice = document.getElementById('frag-choice-overlay');
        const deathOv = document.getElementById('death-overlay');
        const deathChoice = document.getElementById('death-choice-overlay');
        const collapseOv = document.getElementById('collapse-overlay');
        if ((fragOv && fragOv.classList.contains('active')) || (fragChoice && fragChoice.style.display === 'flex') || (deathOv && deathOv.classList.contains('active')) || (deathChoice && deathChoice.classList.contains('active')) || (collapseOv && collapseOv.classList.contains('active'))) {
          setTimeout(() => window.showCombat(), 500); return;
        }
        // 目标已死，关闭战斗界面
        if (t.hp <= 0) { if (origCloseCombat) origCloseCombat(); return; }
        const pol = game.player.pollution;

        // 污染100%: 强制跳过战斗界面
        if (pol >= 100) {
          game.target = null; // 清除目标，避免卡住移动
          triggerPollutionCollapse();
          return;
        }

        const overlay = document.getElementById('combat-overlay');
        overlay.style.display = '';
        overlay.classList.add('active');
        // 防御引导：F2+ 战斗时触发
        if(game.floor>=2&&game._tutorialStage>=2){
          var _defendTries=0;
          var _tryDefendHint=function(){
            _defendTries++;
            if(_defendTries>5)return;
            if(typeof _currentTutStep!=='undefined'&&_currentTutStep){setTimeout(_tryDefendHint,1500);return;}
            if(typeof _tutCheckPending!=='undefined'&&_tutCheckPending){setTimeout(_tryDefendHint,1500);return;}
            if(typeof checkTutorial==='function')checkTutorial('defendHint');
          };
          setTimeout(_tryDefendHint,800);
        }

        const box = document.getElementById('combat-box');
        const p = game.player;
        const pDmg = Math.max(1, p.atk - t.def);
        const mDmg = Math.max(1, t.atk - p.def);
        const turns = Math.ceil(t.hp / pDmg);
        const totalDmg = mDmg * (turns - 1);

        const rate = _computePossessRate(t);
        const isPossessed = p.possessed[t.id] || t.possessed;
        const isPossessDisabled = isPossessed || t._enraged;
        _possActualRate = rate;
        const _isBoss = t.type && t.type.startsWith('boss');

        // 预览计算（新继承公式：HP按血量比例，ATK/DEF 100%）
        const hpRatio = t.hp / t.maxHp;
        const inheritFactor = hpRatio >= 0.8 ? 1.0 : hpRatio >= 0.4 ? 0.8 : 0.6;
        const pvHp = Math.floor(t.hp * inheritFactor);
        const pvMaxHp = Math.floor(t.maxHp * inheritFactor);
        const pvAtk = t.atk;
        const pvDef = t.def;
        function pctChange(o, n) {
          if (o === 0) return n > 0 ? '+∞' : '0%';
          const pct = Math.round(((n - o) / o) * 100);
          return pct > 0 ? '+' + pct + '%' : pct + '%';
        }
        function pctClass(o, n) { return n > o ? 'up' : n < o ? 'down' : 'same'; }

        // 特性对比
        const pTraits = new Set(p.traits);
        const tTraits = new Set(t.traits);
        const gainTraits = t.traits.filter(tr => !pTraits.has(tr));
        const loseTraits = p.traits.filter(tr => !tTraits.has(tr));

        // 成功率颜色（平滑渐变：红→黄→绿）
        const rateColor = getPossessRateColor(rate);

        const _isParasiteForm = p.formType && p.formType !== 'human';
        const _classColor = (typeof getClassColors !== 'undefined') ? getClassColors(p.playerClass) : ((typeof classColors !== 'undefined' && classColors[p.playerClass]) ? classColors[p.playerClass] : {primary:'#4488cc',glow:'#00c8ff',icon:'🧬'});

        // 保存战斗日志内容（新怪物时清空）
        const _oldLog = document.getElementById('combat-log');
        const _isNewTarget = !window._lastCombatTargetId || window._lastCombatTargetId !== t.id;
        const _savedLog = (!_isNewTarget && _oldLog) ? _oldLog.innerHTML : '';
        window._lastCombatTargetId = t.id;

        box.innerHTML = `
          <div class="enc-header">
            <h2>${_isBoss?'<span style="color:#ff3344;font-size:10px;vertical-align:middle;margin-right:3px;text-shadow:0 0 6px #ff0033">💀 BOSS</span>':''}${t.name}</h2>
            <div class="enc-subtitle">${getMonsterFlavorText(t.type)}</div>
          </div>

          <div class="enc-vs-area">
            <div class="enc-card enc-player-card"${_isParasiteForm?' style="border:1.5px solid '+_classColor.primary+';box-shadow:0 0 8px '+_classColor.primary+'44"':''}>
              <div class="enc-card-label">${_isParasiteForm?'<span style="color:'+_classColor.primary+'">🧬 寄生体</span>':'当前'}</div>
              <div id="enc-player-icon" style="font-size:36px;text-align:center;line-height:50px;height:50px;position:relative">${(typeof formIcons!=='undefined'&&formIcons[p.formType||'human'])||'👤'}${_isParasiteForm?'<span style="position:absolute;bottom:0;right:0;font-size:14px;text-shadow:0 0 4px '+_classColor.glow+'">'+(_classColor.icon||'🧬')+'</span>':''}</div>
              <div class="enc-card-stats">
                <div>HP <b>${p.hp}</b>/<small>${p.maxHp}</small></div>
                <div>ATK <b>${p.atk}</b> DEF <b>${p.def}</b></div>
              </div>
            </div>
            <div class="enc-vs-badge">VS</div>
            <div class="enc-card enc-target-card"${_isBoss?' style="border:1.5px solid #ff3344;box-shadow:0 0 10px rgba(255,51,68,0.5),inset 0 0 8px rgba(255,0,30,0.15)"':''}>
              <div class="enc-card-label" data-real="目标">${_isBoss?'<span style="color:#ff3344">⚠ BOSS</span>':'目标'}</div>
              <div id="enc-target-icon" style="font-size:36px;text-align:center;line-height:50px;height:50px">${(typeof formIcons!=='undefined'&&formIcons[t.type])||(typeof icons!=='undefined'&&icons[t.type])||'❓'}</div>
              <div class="enc-card-stats">
                <div>HP <b>${t.hp}</b>/<small>${t.maxHp}</small></div>
                <div>ATK <b>${t.atk}</b> DEF <b>${t.def}</b></div>
              </div>
            </div>
          </div>

          <div class="enc-rate-possess ${isPossessDisabled ? 'disabled' : ''}" id="enc-rate-possess" style="${game._tutorialStage<1?'display:none':''}">
            <div class="enc-rp-left">
              <div class="enc-rate-big" id="enc-rate-display" style="color:${t._enraged?'#666':rateColor}">${t._enraged?'失败':''}${t._enraged?'':rate+'%'}</div>
              <div class="enc-rp-bar">
                <div class="enc-rate-label">${t._enraged?'谈判已破裂':'附身成功率'}</div>
                <div class="enc-rate-track"><div class="enc-rate-fill" style="width:${t._enraged?0:rate}%;background:${rateColor}"></div></div>
              </div>
            </div>
          </div>

          <div id="combat-log" class="enc-combat-log"></div>

          <div class="enc-preview">
            <div class="enc-pv-row">
              <span class="enc-pv-label">HP</span>
              <span class="enc-pv-old">${p.hp}</span>
              <span class="enc-pv-arrow">→</span>
              <span class="enc-pv-new">${pvHp}</span>
              <span class="enc-pv-pct ${pctClass(p.hp, pvHp)}">${pctChange(p.hp, pvHp)}</span>
            </div>
            <div class="enc-pv-row">
              <span class="enc-pv-label">ATK</span>
              <span class="enc-pv-old">${p.atk}</span>
              <span class="enc-pv-arrow">→</span>
              <span class="enc-pv-new">${pvAtk}</span>
              <span class="enc-pv-pct ${pctClass(p.atk, pvAtk)}">${pctChange(p.atk, pvAtk)}</span>
            </div>
            <div class="enc-pv-row">
              <span class="enc-pv-label">DEF</span>
              <span class="enc-pv-old">${p.def}</span>
              <span class="enc-pv-arrow">→</span>
              <span class="enc-pv-new">${pvDef}</span>
              <span class="enc-pv-pct ${pctClass(p.def, pvDef)}">${pctChange(p.def, pvDef)}</span>
            </div>
            ${(gainTraits.length || loseTraits.length) ? `
            <div class="enc-pv-traits">
              ${gainTraits.map(tr => '<span class="gain-trait" style="cursor:pointer" onclick="showTraitInfo(\'' + tr + '\')">+' + tr + ' ⓘ</span>').join(' ')}
              ${loseTraits.map(tr => '<span class="lose-trait" style="cursor:pointer" onclick="showTraitInfo(\'' + tr + '\')">-' + tr + ' ⓘ</span>').join(' ')}
            </div>` : ''}
          </div>

          <div class="enc-info-row">
            <span>伤害: <b style="color:#f04">${totalDmg}</b></span>
            <span>回合: <b>${turns}</b></span>
            <span>污染: <b style="color:${pol > 60 ? '#f04' : pol > 30 ? '#ff0' : '#0f4'}">${pol}%</b></span>
          </div>
        `;

        // 恢复战斗日志
        if (_savedLog) {
          const _newLog = document.getElementById('combat-log');
          if (_newLog) { _newLog.innerHTML = _savedLog; _newLog.scrollTop = _newLog.scrollHeight; }
        }

        // 启动立绘呼吸动画
        if (_portraitRAF) cancelAnimationFrame(_portraitRAF);
        setTimeout(() => { animatePortraits(); }, 50);

        // 启动污染战斗界面效果
        startPollutionCombatEffects(pol, rate);

        // 底部按钮
        const _tutHide = game._tutorialStage < 1;
        const _defHide = game._tutorialStage < 2;
        const eb = document.getElementById('encounter-btns');
        if (eb) eb.classList.remove('hidden');
        const prb = document.getElementById('possess-rate-bottom');
        if (prb) prb.textContent = rate + '%';
        const bpb = document.getElementById('btn-possess-bottom');
        if (bpb) { bpb.disabled = false; bpb.style.opacity = isPossessed ? '0.4' : '1'; bpb.style.display = _tutHide ? 'none' : ''; }
        const _bdb = document.getElementById('btn-defend-bottom');
        if (_bdb) _bdb.style.display = _defHide ? 'none' : '';
        const _bfb = document.getElementById('btn-flee-bottom');
        if (_bfb) _bfb.style.display = _tutHide ? 'none' : '';

        // 战斗期间隐藏小地图和消息面板
        const mc = document.getElementById('minimap-container');
        if (mc) mc.classList.add('combat-hidden');
        const mp = document.getElementById('msg-panel');
        if (mp) mp.classList.add('combat-hidden');
        // 隐藏外部战斗日志面板（改用内嵌日志）
        const blp = document.getElementById('battle-log-panel');
        if (blp) blp.classList.add('combat-hidden');

        // 底部攻击按钮绑定长按自动战斗
        const fightBtn = document.querySelector('#encounter-btns .fight');
        if (fightBtn) {
          fightBtn.ontouchstart = function() { startFightHold(); };
          fightBtn.ontouchend = function() { cancelFightHold(); };
          fightBtn.onmousedown = function() { startFightHold(); };
          fightBtn.onmouseup = function() { cancelFightHold(); };
          fightBtn.onmouseleave = function() { cancelFightHold(); };
        }

        // 首次进战斗·长按自动战斗 coachmark（看一次后永久不再显示）
        try {
          if (!localStorage.getItem('pt_hint_autoFight')) {
            const _innerFight = document.querySelector('#combat-encounter .fight') || fightBtn;
            if (_innerFight && !_innerFight.querySelector('.fight-coachmark')) {
              const _cm = document.createElement('span');
              _cm.className = 'fight-coachmark';
              _cm.textContent = '长按 ▸ 自动战斗';
              if (getComputedStyle(_innerFight).position === 'static') _innerFight.style.position = 'relative';
              _innerFight.appendChild(_cm);
              const _dismiss = function() {
                if (_cm.parentNode) _cm.parentNode.removeChild(_cm);
                try { localStorage.setItem('pt_hint_autoFight', '1'); } catch(e) {}
              };
              _innerFight.addEventListener('click', _dismiss, { once: true });
              _innerFight.addEventListener('touchstart', _dismiss, { once: true });
              setTimeout(_dismiss, 4000);
            }
          }
        } catch(e) {}

      } catch (e) {
        console.error('showCombat error:', e);
        if (origShowCombat) try { origShowCombat(); } catch (e2) { console.error(e2); }
      }
    };

    // 增强关闭：清理动画
    const origCloseCombat = window.closeCombat;
    window.closeCombat = function() {
      cancelFightHold();
      game._autoFight = false;
      stopPollutionCombatEffects();
      if (_portraitRAF) { cancelAnimationFrame(_portraitRAF); _portraitRAF = null; }
      // 恢复战斗期间隐藏的元素
      const mc = document.getElementById('minimap-container');
      if (mc) mc.classList.remove('combat-hidden');
      const mp = document.getElementById('msg-panel');
      if (mp) mp.classList.remove('combat-hidden');
      const blp = document.getElementById('battle-log-panel');
      if (blp) blp.classList.remove('combat-hidden');
      // 恢复底部攻击按钮文本
      const fightBtn = document.querySelector('#encounter-btns .fight');
      if (fightBtn) {
        fightBtn.textContent = '攻击';
        fightBtn.classList.remove('auto-active');
        fightBtn.ontouchstart = null;
        fightBtn.ontouchend = null;
        fightBtn.onmousedown = null;
        fightBtn.onmouseup = null;
        fightBtn.onmouseleave = null;
      }
      origCloseCombat();
    };

    // 增强 attack：显示log + 战后刷新UI + 自动战斗
    const origAttack = window.attack;
    window.attack = function() {
      const log = document.getElementById('combat-log');
      if (log) log.style.display = '';
      origAttack();
      const _negOpen = document.getElementById('negotiate-overlay');
      const _negActive = _negOpen && _negOpen.classList.contains('active');
      if (game._autoFight && game.target && game.target.hp > 0 && game.player.hp > 0 && !game._stiffnessTurns && !_negActive) {
        setTimeout(() => { if (game._autoFight && game.target && game.target.hp > 0 && !game._stiffnessTurns) window.attack(); }, 300);
      } else {
        game._autoFight = false;
        const btn = document.querySelector('#encounter-btns .fight');
        if (btn) { btn.textContent = '攻击'; btn.classList.remove('auto-active'); }
      }
    };

    // 实时刷新战斗界面（怪物HP变化后更新成功率）
    window._refreshCombatUI = function() {
      const t = game.target;
      if (!t || t.hp <= 0) return;
      const p = game.player;
      const pol = p.pollution;

      const rate = _computePossessRate(t);
      const isPossessed = p.possessed[t.id] || t.possessed;
      _possActualRate = rate;

      const rateColor = getPossessRateColor(rate);

      // 更新成功率大数字
      const rateDisplay = document.getElementById('enc-rate-display');
      if (rateDisplay) {
        if (t._enraged) { rateDisplay.textContent = '失败'; rateDisplay.style.color = '#666'; }
        else { rateDisplay.textContent = rate + '%'; rateDisplay.style.color = rateColor; }
      }

      // 更新进度条
      const rateFill = document.querySelector('.enc-rate-fill');
      if (rateFill) { rateFill.style.width = (t._enraged ? 0 : rate) + '%'; rateFill.style.background = rateColor; }

      // 更新成功率标签
      const rateLabel = document.querySelector('.enc-rate-label');
      if (rateLabel) rateLabel.textContent = t._enraged ? '谈判已破裂' : '附身成功率';

      // 更新附身按钮（不再设disabled，改用possess()内部判断+视觉提示）
      const _tutHideR = game._tutorialStage < 1;
      const possBtn = document.querySelector('.act-btn.possess');
      if (possBtn) {
        const _disabled = isPossessed || t._enraged;
        possBtn.style.borderColor = t._enraged ? '#666' : '#E056FD';
        possBtn.style.color = t._enraged ? '#666' : '#E056FD';
        possBtn.style.opacity = _disabled ? '0.4' : '1';
        possBtn.style.display = _tutHideR ? 'none' : '';
        possBtn.textContent = t._enraged ? '破裂' : '🧬 附身 ' + rate + '%';
      }

      // 更新成功率面板
      const rateCore = document.getElementById('enc-rate-possess');
      if (rateCore) { rateCore.classList.toggle('disabled', isPossessed || t._enraged); rateCore.style.display = _tutHideR ? 'none' : ''; }

      // 更新目标HP显示
      const targetStats = document.querySelector('.enc-target-card .enc-card-stats');
      if (targetStats) {
        const hpColor = t.hp/t.maxHp > 0.5 ? '#0f4' : t.hp/t.maxHp > 0.2 ? '#ff0' : '#f04';
        targetStats.innerHTML = '<div>HP <b style="color:' + hpColor + '">' + t.hp + '</b>/<small>' + t.maxHp + '</small></div><div>ATK <b>' + t.atk + '</b> DEF <b>' + t.def + '</b></div>';
      }

      // 更新玩家HP显示
      const playerStats = document.querySelector('.enc-player-card .enc-card-stats');
      if (playerStats) {
        playerStats.innerHTML = '<div>HP <b>' + p.hp + '</b>/<small>' + p.maxHp + '</small></div><div>ATK <b>' + p.atk + '</b> DEF <b>' + p.def + '</b></div>';
      }
      // 更新header（怪物名+描述）
      const encH2 = document.querySelector('.enc-header h2');
      if (encH2) { const _ib = t.type && t.type.startsWith('boss'); encH2.innerHTML = (_ib?'<span style="color:#ff3344;font-size:10px;vertical-align:middle;margin-right:3px;text-shadow:0 0 6px #ff0033">💀 BOSS</span>':'') + t.name; }
      const encSub = document.querySelector('.enc-subtitle');
      if (encSub && typeof getMonsterFlavorText === 'function') encSub.textContent = getMonsterFlavorText(t.type);
      // 更新玩家icon和寄生标记
      const pIcon = document.getElementById('enc-player-icon');
      if (pIcon) {
        const _isPF = p.formType && p.formType !== 'human';
        const _cc = (typeof getClassColors !== 'undefined') ? getClassColors(p.playerClass) : ((typeof classColors !== 'undefined' && classColors[p.playerClass]) ? classColors[p.playerClass] : {primary:'#4488cc',glow:'#00c8ff',icon:'🧬'});
        pIcon.innerHTML = ((typeof formIcons!=='undefined'&&formIcons[p.formType||'human'])||'👤') + (_isPF?'<span style="position:absolute;bottom:0;right:0;font-size:14px;text-shadow:0 0 4px '+_cc.glow+'">'+(_cc.icon||'🧬')+'</span>':'');
      }
      // 更新玩家card label
      const pLabel = document.querySelector('.enc-player-card .enc-card-label');
      if (pLabel) { const _isPF = p.formType && p.formType !== 'human'; const _cc = (typeof getClassColors !== 'undefined') ? getClassColors(p.playerClass) : {primary:'#4488cc'}; pLabel.innerHTML = _isPF ? '<span style="color:'+_cc.primary+'">🧬 寄生体</span>' : '当前'; }
      // 更新玩家card边框
      const pCard = document.querySelector('.enc-player-card');
      if (pCard) { const _isPF = p.formType && p.formType !== 'human'; const _cc = (typeof getClassColors !== 'undefined') ? getClassColors(p.playerClass) : {primary:'#4488cc'}; pCard.style.border = _isPF ? '1.5px solid '+_cc.primary : ''; pCard.style.boxShadow = _isPF ? '0 0 8px '+_cc.primary+'44' : ''; }

      // 更新预计伤害（剩余回合）
      const pDmg = Math.max(1, p.atk - t.def);
      const mDmg = Math.max(1, t.atk - p.def);
      const remainTurns = Math.ceil(t.hp / pDmg);
      const remainDmg = mDmg * Math.max(0, remainTurns - 1);
      const infoRow = document.querySelector('.enc-info-row');
      if (infoRow) {
        infoRow.innerHTML = '<span>剩余伤害: <b style="color:#f04">' + remainDmg + '</b></span><span>剩余回合: <b>' + remainTurns + '</b></span><span>污染: <b style="color:' + (pol > 60 ? '#f04' : pol > 30 ? '#ff0' : '#0f4') + '">' + pol + '%</b></span>';
      }

      // 危险警告

      // 更新预览（新继承公式）
      const refreshHpRatio = t.hp / t.maxHp;
      const refreshInherit = refreshHpRatio >= 0.8 ? 1.0 : refreshHpRatio >= 0.4 ? 0.8 : 0.6;
      const pvHp = Math.floor(t.hp * refreshInherit);
      const pvAtk = t.atk;
      const pvDef = t.def;
      function pctChange(o, n) {
        if (o === 0) return n > 0 ? '+∞' : '0%';
        const pct = Math.round(((n - o) / o) * 100);
        return pct > 0 ? '+' + pct + '%' : pct + '%';
      }
      const pvRows = document.querySelectorAll('.enc-pv-row');
      if (pvRows.length >= 1) {
        const newEl = pvRows[0].querySelector('.enc-pv-new');
        const pctEl = pvRows[0].querySelector('.enc-pv-pct');
        if (newEl) newEl.textContent = pvHp;
        if (pctEl) { pctEl.textContent = pctChange(p.hp, pvHp); pctEl.className = 'enc-pv-pct ' + (pvHp > p.hp ? 'up' : pvHp < p.hp ? 'down' : 'same'); }
      }

      // 底部按钮
      const prb = document.getElementById('possess-rate-bottom');
      if (prb) prb.textContent = rate + '%';
      const _bpbR = document.getElementById('btn-possess-bottom');
      if (_bpbR) _bpbR.style.display = _tutHideR ? 'none' : '';
      const _defHideR = game._tutorialStage < 2;
      const _bdbR = document.getElementById('btn-defend-bottom');
      if (_bdbR) _bdbR.style.display = _defHideR ? 'none' : '';
      const _bfbR = document.getElementById('btn-flee-bottom');
      if (_bfbR) _bfbR.style.display = _tutHideR ? 'none' : '';

      // emoji模式无需重绘立绘

      // 污染战斗效果
      startPollutionCombatEffects(pol, rate);
    };

  }, 100);
})();
