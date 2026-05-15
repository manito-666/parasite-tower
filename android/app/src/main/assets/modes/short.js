// L3 短局模式：12 层 15 分钟 viral 体验
window.GameModes = window.GameModes || { list: [] };

var SHORT_FLOOR_CURVE = {
  1:  { hpMult:0.5,  atkMult:0.3,  count:4,  eliteRate:0,    epMult:1.5, fragRate:0.80, pollAdd:0, possessPollMult:0.5 },
  2:  { hpMult:0.6,  atkMult:0.4,  count:5,  eliteRate:0,    epMult:1.4, fragRate:0.80, pollAdd:0, possessPollMult:0.5 },
  3:  { hpMult:0.7,  atkMult:0.5,  count:5,  eliteRate:0.10, epMult:1.3, fragRate:0.70, pollAdd:0, possessPollMult:0.7 },
  4:  { hpMult:0.95, atkMult:0.65, count:6,  eliteRate:0.10, epMult:1.0, fragRate:0.65, pollAdd:1, possessPollMult:1.0 },
  5:  { hpMult:1.10, atkMult:0.75, count:7,  eliteRate:0.18, epMult:1.1, fragRate:0.65, pollAdd:1, possessPollMult:1.0 },
  6:  { hpMult:1.25, atkMult:0.82, count:7,  eliteRate:0.20, epMult:1.2, fragRate:0.70, pollAdd:2, possessPollMult:1.0 },
  7:  { hpMult:1.40, atkMult:0.92, count:8,  eliteRate:0.25, epMult:1.3, fragRate:0.72, pollAdd:3, possessPollMult:1.2 },
  8:  { hpMult:1.8,  atkMult:1.1,  count:6,  eliteRate:0.20, epMult:0.9, fragRate:0.50, pollAdd:4, possessPollMult:1.0 },
  9:  { hpMult:2.0,  atkMult:1.2,  count:8,  eliteRate:0.30, epMult:1.4, fragRate:0.75, pollAdd:4, possessPollMult:1.5 },
  10: { hpMult:2.3,  atkMult:1.3,  count:9,  eliteRate:0.35, epMult:1.5, fragRate:0.80, pollAdd:5, possessPollMult:1.5 },
  11: { hpMult:2.5,  atkMult:1.4,  count:10, eliteRate:0.40, epMult:1.8, fragRate:0.90, pollAdd:5, possessPollMult:2.0 },
  12: { hpMult:3.0,  atkMult:1.6,  count:12, eliteRate:0.50, epMult:2.0, fragRate:1.00, pollAdd:8, possessPollMult:2.0 },
};

window.ShortMode = {
  _remaining: 900,
  _started: false,
  _lastTickAt: 0,

  // 追踪数据（履历书用）
  _possessCount: 0,
  _longestForm: {name:'', duration:0, _start:0},
  _currentFormStart: 0,
  _maxPollution: 0,
  _formHistory: [],

  // 视觉失真状态
  _glitchActive: false,
  _blackoutTimer: 0,
  _shakeTimer: 0,

  // 崩溃序列状态
  _crashing: false,
  _crashCause: 'time',

  // L6 快照
  _l3Snapshot: null,

  init: function(){
    this._remaining = 900;
    this._started = false;
    this._lastTickAt = 0;
    this._possessCount = 0;
    this._longestForm = {name:'寄生体', duration:0, _start:0};
    this._currentFormStart = Date.now();
    this._maxPollution = 0;
    this._formHistory = [];
    this._glitchActive = false;
    this._blackoutTimer = 0;
    this._shakeTimer = 0;
    this._l3Snapshot = null;
    this._crashing = false;
    this._crashCause = 'time';
    this.ensureTimerDom();
    this.bumpIteration();
  },

  // ===== 迭代计数 =====
  getIteration: function(){
    try{ return parseInt(localStorage.getItem('pt_iteration') || '0'); }catch(e){ return 0; }
  },
  bumpIteration: function(){
    var n = this.getIteration() + 1;
    try{ localStorage.setItem('pt_iteration', String(n)); }catch(e){}
  },

  getFloorCurve: function(floor){
    return SHORT_FLOOR_CURVE[floor] || SHORT_FLOOR_CURVE[12];
  },

  // ===== 倒计时 =====
  startCountdown: function(){
    this._remaining = 900;
    this._started = true;
    this._lastTickAt = Date.now();
    this._currentFormStart = Date.now();
    this.ensureTimerDom();
    this.updateTimerDom();
  },

  ensureTimerDom: function(){
    if(document.getElementById('short-timer')) return;
    var bar = document.getElementById('top-bar');
    if(!bar) return;
    var topRow = bar.querySelector('.top-row');
    var el = document.createElement('div');
    el.id = 'short-timer';
    el.style.cssText = 'color:#1ed8b0;font-size:12px;font-weight:bold;font-family:monospace;letter-spacing:1px;text-shadow:0 0 6px rgba(30,216,176,0.6);pointer-events:none;flex-shrink:0;margin-left:auto;padding-right:4px';
    el.textContent = '15:00';
    if(topRow){
      var polBadge = topRow.querySelector('.pol-badge');
      if(polBadge) topRow.insertBefore(el, polBadge);
      else topRow.appendChild(el);
    }else{
      bar.appendChild(el);
    }
  },

  updateTimerDom: function(){
    var el = document.getElementById('short-timer');
    if(!el) return;
    var s = Math.max(0, Math.floor(this._remaining));
    var m = Math.floor(s/60), r = s%60;
    el.textContent = (m<10?'0':'')+m+':'+(r<10?'0':'')+r;
    // === 分级视觉 ===
    var tier; // safe / warn / danger / critical
    if(s>60) tier='safe';
    else if(s>30) tier='warn';
    else if(s>10) tier='danger';
    else tier='critical';
    if(this._timerTier!==tier){
      this._timerTier=tier;
      el.classList.remove('st-safe','st-warn','st-danger','st-critical');
      el.classList.add('st-'+tier);
      // 全屏紧急 vignette（仅 danger/critical）
      var vg=document.getElementById('short-urgency-vignette');
      if(tier==='danger'||tier==='critical'){
        if(!vg){vg=document.createElement('div');vg.id='short-urgency-vignette';document.body.appendChild(vg);}
        vg.className='su-'+tier;
      }else if(vg){vg.remove();}
      // 屏幕震动（仅 danger 起步）
      var gs=document.getElementById('game-screen');
      if(gs){
        gs.classList.remove('shake-soft','shake-hard');
        if(tier==='danger') gs.classList.add('shake-soft');
        else if(tier==='critical') gs.classList.add('shake-hard');
      }
    }
    // === 分级音效（心跳节奏随阶段加速） ===
    var now=Date.now();
    if(tier==='critical'){
      // <10s：每 400ms 一次高频蜂鸣
      if(!this._lastTick||now-this._lastTick>=400){
        this._lastTick=now;
        try{playTone(1400,0.05,0.06,'square');}catch(e){}
      }
    }else if(tier==='danger'){
      // 10-30s：加速心跳 700ms
      if(!this._lastBeat||now-this._lastBeat>=700){
        this._lastBeat=now;
        try{playTone(60,0.1,0.22,'sine');}catch(e){}
      }
    }else if(tier==='warn'){
      // 30-60s：心跳 1400ms
      if(!this._lastBeat||now-this._lastBeat>=1400){
        this._lastBeat=now;
        try{playTone(50,0.09,0.2,'sine');}catch(e){}
      }
    }
  },

  removeTimerDom: function(){
    var el = document.getElementById('short-timer');
    if(el) el.remove();
    var vg=document.getElementById('short-urgency-vignette');if(vg)vg.remove();
    var gs=document.getElementById('game-screen');
    if(gs){gs.classList.remove('shake-soft','shake-hard');}
    this._timerTier=null;
  },

  tick: function(){
    if(!this._started || this._crashing) return;
    var now = Date.now();
    var dt = (now - this._lastTickAt) / 1000;
    this._lastTickAt = now;
    if(dt > 2) dt = 2;
    this._remaining -= dt;
    this.updateTimerDom();
    if(typeof game!=='undefined' && game.player) this._maxPollution = Math.max(this._maxPollution, game.player.pollution || 0);
    this.tickGlitch(dt);
    // 污染100%触发崩溃
    if(typeof game!=='undefined' && game.player && game.player.pollution >= 100){
      this._remaining = Math.max(0, this._remaining);
      this.forceFinale('pollution');
      return;
    }
    if(this._remaining <= 0){
      this._remaining = 0;
      this.forceFinale('time');
    }
  },

  forceFinale: function(cause){
    if(this._crashing) return;
    this._crashing = true;
    this._started = false;
    this._crashCause = cause || 'time';
    this.removeTimerDom();
    try{ if(typeof endRunSave==='function')endRunSave('short'); else { localStorage.removeItem('pt_save'); localStorage.removeItem('pt_save_short'); localStorage.removeItem('parasiteTowerSave'); } }catch(e){}
    this.startCrashSequence();
  },

  // ===== 伪死亡崩溃序列 =====
  startCrashSequence: function(){
    var self = this;
    // 关闭所有弹窗
    try{
      if(typeof closeCombat==='function') closeCombat();
      if(typeof closeEvent==='function') closeEvent();
      var overlays=['frag-choice-overlay','synth-confirm-overlay','frag-bag-overlay','shop-overlay','evolution-overlay','route-overlay','form-library-overlay'];
      overlays.forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
    }catch(e){}

    // 创建崩溃overlay
    this._ensureCrashDom();
    var co = document.getElementById('crash-overlay');
    co.style.display = 'block';

    // 阶段1：信号干扰（0-1s）
    self._crashPhase1();
    // 阶段2：UI崩坏（1-3s）
    setTimeout(function(){ self._crashPhase2(); }, 1000);
    // 阶段3：黑屏（3-5s）
    setTimeout(function(){ self._crashPhase3(); }, 3000);
    // 阶段4：履历书浮现（5-7s）
    setTimeout(function(){ self._crashPhase4(); }, 5000);
    // 阶段5：定格（7.5s+）
    setTimeout(function(){ self._crashPhase5(); }, 7500);
  },

  _ensureCrashDom: function(){
    if(document.getElementById('crash-overlay')) return;
    var div = document.createElement('div');
    div.id = 'crash-overlay';
    div.style.cssText = 'display:none;position:fixed;inset:0;z-index:1000;pointer-events:none';

    // 扫描线层
    var scan = document.createElement('div');
    scan.id = 'crash-scanlines';
    scan.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px);pointer-events:none;opacity:0;transition:opacity 0.3s';
    div.appendChild(scan);

    // RGB色彩分离层
    var rgb = document.createElement('div');
    rgb.id = 'crash-rgb';
    rgb.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen';
    div.appendChild(rgb);

    // 黑屏层
    var black = document.createElement('div');
    black.id = 'crash-black';
    black.style.cssText = 'position:absolute;inset:0;background:#000;pointer-events:none;opacity:0;transition:opacity 0.5s;display:flex;align-items:center;justify-content:center';
    div.appendChild(black);

    // 履历书层
    var resume = document.createElement('div');
    resume.id = 'crash-resume';
    resume.style.cssText = 'position:absolute;inset:0;pointer-events:auto;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;overflow-x:hidden;padding:16px 0 24px;box-sizing:border-box;opacity:0;transition:opacity 1.5s;-webkit-overflow-scrolling:touch';
    div.appendChild(resume);

    document.body.appendChild(div);

    // 注入关键帧动画
    var style = document.createElement('style');
    style.textContent = '@keyframes crash-shake{0%{transform:translate(0,0)}10%{transform:translate(-3px,2px)}20%{transform:translate(4px,-1px)}30%{transform:translate(-2px,-3px)}40%{transform:translate(3px,3px)}50%{transform:translate(-4px,1px)}60%{transform:translate(2px,-2px)}70%{transform:translate(-1px,4px)}80%{transform:translate(3px,-3px)}90%{transform:translate(-3px,2px)}100%{transform:translate(0,0)}}@keyframes crash-flicker{0%{opacity:1}5%{opacity:0.3}10%{opacity:1}15%{opacity:0.6}20%{opacity:1}50%{opacity:1}52%{opacity:0.2}54%{opacity:1}80%{opacity:1}82%{opacity:0.4}84%{opacity:1}}@keyframes crash-rgb-shift{0%{box-shadow:inset -2px 0 0 rgba(255,0,0,0.5),inset 2px 0 0 rgba(0,255,255,0.5)}50%{box-shadow:inset 3px 0 0 rgba(255,0,0,0.7),inset -3px 0 0 rgba(0,255,255,0.7)}100%{box-shadow:inset -2px 0 0 rgba(255,0,0,0.5),inset 2px 0 0 rgba(0,255,255,0.5)}}@keyframes crash-text-glitch{0%{text-shadow:2px 0 #ff006e,-2px 0 #00ffd0}25%{text-shadow:-3px 0 #ff006e,3px 0 #00ffd0}50%{text-shadow:1px 0 #ff006e,-1px 0 #00ffd0}75%{text-shadow:-2px 0 #ff006e,2px 0 #00ffd0}100%{text-shadow:2px 0 #ff006e,-2px 0 #00ffd0}}@keyframes cert-glow-pulse{0%{box-shadow:0 0 20px rgba(30,216,176,0.2),inset 0 0 20px rgba(30,216,176,0.05)}50%{box-shadow:0 0 40px rgba(30,216,176,0.4),inset 0 0 30px rgba(30,216,176,0.1)}100%{box-shadow:0 0 20px rgba(30,216,176,0.2),inset 0 0 20px rgba(30,216,176,0.05)}}@keyframes cert-glow-pulse-red{0%{box-shadow:0 0 20px rgba(255,0,110,0.2),inset 0 0 20px rgba(255,0,110,0.05)}50%{box-shadow:0 0 40px rgba(255,0,110,0.4),inset 0 0 30px rgba(255,0,110,0.1)}100%{box-shadow:0 0 20px rgba(255,0,110,0.2),inset 0 0 20px rgba(255,0,110,0.05)}}@keyframes cert-stamp{0%{transform:scale(3) rotate(-15deg);opacity:0}60%{transform:scale(1.05) rotate(-8deg);opacity:0.9}80%{transform:scale(0.98) rotate(-8deg);opacity:1}100%{transform:scale(1) rotate(-8deg);opacity:0.85}}@keyframes cert-number-count{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}@keyframes cert-shine{0%{left:-100%}100%{left:200%}}@keyframes cert-border-draw{0%{clip-path:inset(0 100% 100% 0)}25%{clip-path:inset(0 0 100% 0)}50%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 0 0)}}@keyframes cert-particle{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-60px) scale(0);opacity:0}}';
    document.head.appendChild(style);
  },

  _crashPhase1: function(){
    // 扫描线 + 游戏区剧烈抖动 + 乱码消息
    var scan = document.getElementById('crash-scanlines');
    if(scan) scan.style.opacity = '1';

    var ga = document.getElementById('game-area');
    if(ga) ga.style.animation = 'crash-shake 0.15s infinite';

    // RGB色彩分离
    var rgb = document.getElementById('crash-rgb');
    if(rgb){
      rgb.style.opacity = '1';
      rgb.style.animation = 'crash-rgb-shift 0.2s infinite';
    }

    // 乱码消息
    if(typeof addMsg === 'function'){
      addMsg('<span style="color:#ff006e;animation:crash-flicker 0.5s infinite">▓▒░ 意识…信号…中■…░▒▓</span>');
      setTimeout(function(){
        addMsg('<span style="color:#666;font-family:monospace">ERR_CONSCIOUSNESS_OVERFLOW: 0xDEAD</span>');
      }, 400);
      setTimeout(function(){
        addMsg('<span style="color:#ff006e">▓▓▓ FATAL: host_identity_corrupted ▓▓▓</span>');
      }, 700);
    }
  },

  _crashPhase2: function(){
    // UI数字变ERR + 闪烁加速
    var ga = document.getElementById('game-area');
    if(ga) ga.style.animation = 'crash-shake 0.08s infinite';

    // 污染top-bar数据：只改"叶子节点"（无元素子节点），避免销毁带id的<b>子元素
    var statEls = document.querySelectorAll('#top-bar span, #top-bar div, #top-bar b');
    for(var i=0; i<statEls.length; i++){
      var el = statEls[i];
      if(el.id === 'short-timer') continue;
      // 关键：跳过包含元素子节点的父容器，否则 textContent 赋值会清掉它们的<b id="atk-top">等子元素
      if(el.children && el.children.length > 0) continue;
      var txt = el.textContent;
      if(/\d/.test(txt)){
        el.setAttribute('data-orig', txt);
        el.textContent = txt.replace(/\d+/g, function(){
          var r = Math.random();
          if(r<0.3) return '??';
          if(r<0.6) return 'ERR';
          return '░░';
        });
        el.style.animation = 'crash-flicker 0.3s infinite';
      }
    }

    // 怪物名字全部替换
    if(typeof game!=='undefined' && game.monsters && this._formHistory.length > 0){
      var names = this._formHistory;
      game.monsters.forEach(function(m){
        if(m.hp > 0){
          m._origName = m._origName || m.name;
          m.name = names[Math.floor(Math.random() * names.length)];
        }
      });
    }
    if(typeof render === 'function') render();

    // 加速闪黑
    var self = this;
    var flickCount = 0;
    var flickId = setInterval(function(){
      self._doBlackout();
      flickCount++;
      if(flickCount > 6) clearInterval(flickId);
    }, 300);
  },

  _crashPhase3: function(){
    // 黑屏 + 死因文字
    var ga = document.getElementById('game-area');
    if(ga) ga.style.animation = '';

    var black = document.getElementById('crash-black');
    if(!black) return;
    black.style.opacity = '1';
    black.style.pointerEvents = 'auto';

    var cause = this._crashCause;
    var isPoll = cause === 'pollution';
    var isDeath = cause === 'death';
    var line1 = isPoll ? '☢ 污染指数：100%' : (isDeath ? '💀 HP 0/MAX' : '⏱ 15:00 → 00:00');
    var line2 = isPoll ? '宿主意识已被完全覆写' : (isDeath ? '宿主躯体彻底崩坏' : '时间耗尽');
    var lineCol = isPoll ? '#ff006e' : (isDeath ? '#ff4466' : '#1ed8b0');

    black.innerHTML = '<div style="text-align:center">'
      + '<div style="font-size:28px;font-weight:bold;color:'+lineCol+';animation:crash-text-glitch 0.3s infinite;letter-spacing:4px;font-family:monospace">' + t(line1) + '</div>'
      + '<div style="margin-top:16px;font-size:14px;color:#666;letter-spacing:2px">' + t(line2) + '</div>'
      + '<div style="margin-top:24px;font-size:11px;color:#444;letter-spacing:1px;line-height:1.8">' + t('当前寄生链路已中断，战斗结构失稳。') + '<br>' + t('系统正在回收本次迭代残响。') + '</div>'
      + '</div>';
  },

  _crashPhase4: function(){
    var resume = document.getElementById('crash-resume');
    if(!resume) return;

    var dur = (900 - this._remaining);
    var longestDur = Math.max(this._longestForm.duration, (Date.now() - this._currentFormStart) / 1000);
    var longestName = longestDur === this._longestForm.duration ? this._longestForm.name : (typeof game!=='undefined' && game.player ? game.player.name : '未知');
    var iteration = this.getIteration();
    var cause = this._crashCause;
    var isPollution = cause === 'pollution';
    var isDeath = cause === 'death';
    var accent = isPollution ? '#ff006e' : (isDeath ? '#ff4466' : '#1ed8b0');
    var accentDim = isPollution ? 'rgba(255,0,110,0.15)' : (isDeath ? 'rgba(255,68,102,0.15)' : 'rgba(30,216,176,0.15)');
    var accentGlow = isPollution ? 'cert-glow-pulse-red' : 'cert-glow-pulse';
    var causeLabel = isPollution ? '意识覆写' : (isDeath ? '宿主崩坏' : '时间终止');
    var causeIcon = isPollution ? '☢' : (isDeath ? '💀' : '⏱');
    var quote = isPollution
      ? t('你已经不是你了。但"你"还记得。')
      : (isDeath ? t('身体先于意识消散。') : t('时间吞噬了一切。但你的痕迹还在。'));
    var finalForm = typeof game!=='undefined' && game.player ? game.player.name : t('未知');
    var reachedFloor = typeof game!=='undefined' ? game.floor : '?';
    var playerClass = typeof game!=='undefined' && game.player ? (game.player.playerClass || '') : '';
    var killCount = typeof game!=='undefined' ? (game._totalKills || 0) : 0;

    // 评价等级
    var rating = 'D';
    var ratingColor = '#666';
    var score = this._possessCount * 10 + killCount * 5 + Math.floor(dur / 60) * 3 + reachedFloor * 8;
    if(score >= 350){ rating='SSS'; ratingColor='#ff006e'; }
    else if(score >= 280){ rating='SS'; ratingColor='#b455ff'; }
    else if(score >= 200){ rating='S'; ratingColor='#ffd700'; }
    else if(score >= 150){ rating='A'; ratingColor=accent; }
    else if(score >= 100){ rating='B'; ratingColor='#ff8c00'; }
    else if(score >= 50){ rating='C'; ratingColor='#aaa'; }

    this._lastRunData = {iteration:iteration, score:score, rating:rating, dur:dur, possessions:this._possessCount, kills:killCount, floor:reachedFloor, maxPollution:this._maxPollution, finalForm:finalForm, longestHost:longestName, longestDur:Math.floor(longestDur), cause:causeLabel, causeIcon:causeIcon, playerClass:playerClass};

    // 元进度：积累残响（在写本地榜之前，用以在结算 UI 中展示）
    var echoGain = null;
    try{ if(window.MetaProgress) echoGain = MetaProgress.gainFromRun(this._lastRunData); }catch(e){}
    this._lastRunData.echoGain = echoGain;

    this.saveToLeaderboard(this._lastRunData);

    var lines = [
      {icon:'🧬', label:t('附身次数'), value: String(this._possessCount), highlight: this._possessCount >= 5},
      {icon:'💀', label:t('击杀数'), value: String(killCount), highlight: killCount >= 10},
      {icon:'🏢', label:t('抵达层数'), value: String(reachedFloor)+'/12', highlight: reachedFloor >= 12},
      {icon:'⏱', label:t('存活时长'), value: Math.floor(dur/60)+t('分')+Math.floor(dur%60)+t('秒'), highlight: dur >= 720},
      {icon:'🏆', label:t('最久宿主'), value: longestName, sub: Math.floor(longestDur)+t('秒'), highlight: longestDur >= 120},
      {icon:'☢', label:t('最高污染'), value: this._maxPollution+'%', highlight: this._maxPollution >= 80, danger: true},
      {icon:'💀', label:t('最终形态'), value: finalForm, highlight: false}
    ];

    // ===== 证书 HTML =====
    var h = '';
    // 外层容器
    h += '<div style="position:relative;max-width:360px;width:92%;margin:0 auto">';

    // 粒子容器（装饰性浮动粒子）
    h += '<div id="cert-particles" style="position:absolute;inset:-20px;pointer-events:none;overflow:hidden;z-index:1"></div>';

    // 标记结算阶段：暂停底层 gameLoop 渲染与 tick（防止闪动）
    try{ if(window.game) game._endScreenActive = true; }catch(e){}

    // 证书主体（一次性淡入，无持续脉冲）
    h += '<div id="cert-card" style="position:relative;z-index:2;background:linear-gradient(170deg,#0a0812 0%,#0d0a18 40%,#0a0812 100%);border-radius:12px;padding:0;overflow:hidden;opacity:0;transform:translateY(8px);transition:opacity .7s ease-out,transform .7s cubic-bezier(.23,1,.32,1);box-shadow:0 0 30px '+accentDim+',inset 0 0 0 1px rgba(255,255,255,0.04)">';

    // 顶部金色装饰线（动画绘入）
    h += '<div style="height:3px;background:linear-gradient(90deg,transparent,'+accent+',transparent);animation:cert-border-draw 1s ease-out forwards"></div>';

    // 顶部纹章区域
    h += '<div style="padding:20px 20px 0;text-align:center">';
    // 迭代编号（大号）
    h += '<div style="font-family:monospace;font-size:10px;color:#444;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px">YOU · ARE · ME</div>';
    h += '<div style="font-size:36px;font-weight:900;color:'+accent+';letter-spacing:6px;line-height:1;text-shadow:0 0 20px '+accentDim+';font-family:monospace">#'+String(iteration).padStart(3,'0')+'</div>';
    h += '<div style="font-size:13px;color:#555;letter-spacing:3px;margin-top:4px;font-family:monospace">'+t('— 迭代终止报告 —')+'</div>';
    if(window.game&&game._seedLabel) h += '<div style="font-size:9px;color:#ffd700;letter-spacing:2px;margin-top:4px;font-family:monospace">'+game._seedLabel+'</div>';

    // 死因标签
    h += '<div style="display:inline-block;margin-top:12px;padding:4px 16px;border:1px solid '+accent+';border-radius:20px;font-size:11px;color:'+accent+';letter-spacing:2px;background:'+accentDim+'">'+causeIcon+' '+t(causeLabel)+'</div>';
    h += '</div>';

    // 分隔装饰
    h += '<div style="margin:16px 20px 0;height:1px;background:linear-gradient(90deg,transparent,#333,transparent)"></div>';

    // 评分大章（角落戳章效果）
    var _stampSize = rating.length >= 3 ? 64 : rating.length >= 2 ? 60 : 56;
    var _stampFont = rating.length >= 3 ? 18 : rating.length >= 2 ? 22 : 28;
    var _stampGlow = (rating === 'SSS') ? ';box-shadow:0 0 15px '+ratingColor+',inset 0 0 10px '+ratingColor : (rating === 'SS') ? ';box-shadow:0 0 10px '+ratingColor : '';
    h += '<div id="cert-stamp" style="position:absolute;top:16px;right:16px;width:'+_stampSize+'px;height:'+_stampSize+'px;border:3px solid '+ratingColor+';border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;animation:cert-stamp 0.6s ease-out 2.5s forwards;z-index:10'+_stampGlow+'">';
    h += '<div style="font-size:'+_stampFont+'px;font-weight:900;color:'+ratingColor+';font-family:\'Georgia\',\'Times New Roman\',serif;line-height:1;text-align:center">'+rating+'</div>';
    h += '</div>';

    // 数据行
    h += '<div style="padding:14px 20px 8px">';
    for(var i=0; i<lines.length; i++){
      var ln = lines[i];
      var valColor = ln.danger ? '#ff006e' : (ln.highlight ? accent : '#ddd');
      var iconBg = ln.danger ? 'rgba(255,0,110,0.12)' : (ln.highlight ? accentDim : 'rgba(255,255,255,0.04)');
      var iconBd = ln.danger ? 'rgba(255,0,110,0.35)' : (ln.highlight ? accent : 'rgba(255,255,255,0.06)');
      h += '<div class="cert-line" style="opacity:0;transform:translateX(-15px);transition:all 0.5s cubic-bezier(0.23,1,0.32,1);display:flex;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03)" data-idx="'+i+'">';
      h += '<span style="width:24px;height:24px;line-height:22px;text-align:center;flex-shrink:0;font-size:13px;background:'+iconBg+';border:1px solid '+iconBd+';border-radius:6px;margin-right:8px">'+ln.icon+'</span>';
      h += '<span style="color:#666;font-size:11px;min-width:64px;font-family:monospace;letter-spacing:1px">'+ln.label+'</span>';
      h += '<span style="flex:1;text-align:right;color:'+valColor+';font-weight:bold;font-size:13px;font-family:monospace;text-shadow:0 0 6px '+(ln.highlight||ln.danger?valColor+'40':'transparent')+'">'+ln.value+'</span>';
      if(ln.sub) h += '<span style="color:#555;font-size:10px;margin-left:4px">('+ln.sub+')</span>';
      if(ln.highlight) h += '<span style="margin-left:6px;font-size:9px;color:'+accent+'">★</span>';
      h += '</div>';
    }
    h += '</div>';

    // 分隔
    h += '<div style="margin:0 20px;height:1px;background:linear-gradient(90deg,transparent,#333,transparent)"></div>';

    // 最佳宿主高光
    h += '<div style="padding:12px 20px 6px;text-align:center">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;margin-bottom:4px">BEST HOST</div>';
    h += '<div style="font-size:20px;font-weight:900;color:'+accent+';text-shadow:0 0 10px '+accentDim+';letter-spacing:3px">'+longestName+'</div>';
    h += '<div style="font-size:10px;color:#666;margin-top:2px">'+Math.floor(longestDur)+t('秒 存活')+'</div>';
    h += '</div>';

    // 存活时间线（12层进度）
    h += '<div style="padding:6px 20px 10px">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;margin-bottom:6px">TIMELINE</div>';
    h += '<div style="display:flex;gap:2px;height:12px">';
    for(var fi=1;fi<=12;fi++){
      var _reached=fi<=reachedFloor;
      var _isWave=fi===1||fi===5||fi===9;
      var _bgc=_reached?(fi>=9?'#ff006e':fi>=5?'#ff8c00':'#1ed8b0'):'#1a1a2e';
      var _bdr=_isWave?'border-left:2px solid rgba(255,255,255,0.3);':'';
      h+='<div style="flex:1;background:'+_bgc+';border-radius:2px;'+_bdr+'opacity:'+(_reached?'1':'0.3')+'" title="F'+fi+'"></div>';
    }
    h += '</div>';
    h += '<div style="display:flex;justify-content:space-between;font-size:8px;color:#444;margin-top:2px"><span>'+t('第一浪')+'</span><span>'+t('第二浪')+'</span><span>'+t('第三浪')+'</span></div>';
    h += '</div>';

    // 分隔
    h += '<div style="margin:0 20px;height:1px;background:linear-gradient(90deg,transparent,#333,transparent)"></div>';

    // 综合分数条
    h += '<div style="padding:12px 20px">';
    h += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-bottom:4px"><span>SCORE</span><span id="cert-score-num" style="color:'+ratingColor+';font-weight:bold">0</span></div>';
    h += '<div style="height:4px;background:#111;border-radius:2px;overflow:hidden"><div id="cert-score-bar" style="height:100%;width:0%;background:linear-gradient(90deg,'+accent+','+ratingColor+');border-radius:2px;transition:width 1.5s cubic-bezier(0.23,1,0.32,1)"></div></div>';
    h += '</div>';

    // 残响奖励（元进度）— 主题色高亮卡片
    if(echoGain && echoGain.earned > 0){
      h += '<div style="margin:0 20px;height:1px;background:linear-gradient(90deg,transparent,#333,transparent)"></div>';
      h += '<div style="padding:12px 20px 8px">';
      h += '<div style="position:relative;background:linear-gradient(135deg,rgba(165,92,255,0.10),rgba(53,224,255,0.04));border:1px solid rgba(165,92,255,0.35);border-radius:8px;padding:10px 14px;box-shadow:inset 0 0 12px rgba(165,92,255,0.08)">';
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
      h += '<span style="width:22px;height:22px;line-height:20px;text-align:center;background:rgba(165,92,255,0.15);border:1px solid rgba(165,92,255,0.5);border-radius:50%;color:#cdb6ff;font-size:11px">⛯</span>';
      h += '<span style="font-size:10px;color:#a78bd8;letter-spacing:3px;font-family:monospace;flex:1">'+t('ECHO · 残响')+'</span>';
      h += '<span style="font-size:20px;font-weight:900;color:#cdb6ff;text-shadow:0 0 12px rgba(165,92,255,0.6);letter-spacing:1px;font-family:monospace">+'+echoGain.earned+'</span>';
      h += '</div>';
      var subs = [];
      subs.push('<span style="background:rgba(255,255,255,0.04);padding:2px 6px;border-radius:3px">'+t('基础')+' '+echoGain.base+'</span>');
      if(echoGain.clear>0) subs.push('<span style="background:rgba(30,216,176,0.10);color:#1ed8b0;padding:2px 6px;border-radius:3px">'+t('通关')+' +'+echoGain.clear+'</span>');
      if(echoGain.daily>0) subs.push('<span style="background:rgba(255,215,0,0.10);color:#ffd700;padding:2px 6px;border-radius:3px">'+t('今日')+' +'+echoGain.daily+'</span>');
      if(echoGain.milestone>0) subs.push('<span style="background:rgba(255,0,110,0.10);color:#ff6b9e;padding:2px 6px;border-radius:3px">'+t('里程碑')+' +'+echoGain.milestone+'</span>');
      h += '<div style="display:flex;flex-wrap:wrap;gap:4px;font-size:9px;color:#888;font-family:monospace">'+subs.join('')+'</div>';
      h += '<div style="margin-top:6px;font-size:9px;color:#666;letter-spacing:1px;font-family:monospace;text-align:right">'+t('累计')+' <span style="color:#cdb6ff">'+echoGain.total+'</span></div>';
      h += '</div>';
      h += '</div>';
    }

    // 引言
    h += '<div id="cert-quote" style="padding:12px 24px 16px;text-align:center;opacity:0;transition:opacity 1s">';
    h += '<div style="color:#444;font-size:10px;font-style:italic;line-height:1.6;letter-spacing:1px">"'+quote+'"</div>';
    h += '</div>';

    // 底部按钮
    h += '<div id="cert-buttons" style="padding:0 16px 20px;display:flex;gap:8px;justify-content:center;opacity:0;transition:opacity 0.5s">';
    h += '<button onclick="ShortMode.restartShort()" style="flex:1 1 0;min-width:0;padding:12px 4px;background:linear-gradient(135deg,'+accentDim+',transparent);border:1px solid '+accent+';color:'+accent+';border-radius:6px;cursor:pointer;font-family:monospace;font-size:13px;font-weight:bold;letter-spacing:1px;white-space:nowrap;transition:all 0.2s" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'\'">'+t('再来一次')+'</button>';
    h += '<button onclick="ShortMode.shareRunPoster()" style="flex:1 1 0;min-width:0;padding:12px 4px;background:transparent;border:1px solid #1ed8b0;color:#1ed8b0;border-radius:6px;cursor:pointer;font-family:monospace;font-size:12px;font-weight:bold;letter-spacing:0;white-space:nowrap;transition:all 0.2s" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'\'">'+t('📷 海报')+'</button>';
    h += '<button onclick="ShortMode.showLeaderboard()" style="flex:1 1 0;min-width:0;padding:12px 4px;background:transparent;border:1px solid #ffd700;color:#ffd700;border-radius:6px;cursor:pointer;font-family:monospace;font-size:12px;font-weight:bold;letter-spacing:0;white-space:nowrap;transition:all 0.2s" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'\'">'+t('🏅 排行榜')+'</button>';
    h += '<button onclick="ShortMode.crashBackToTitle()" style="flex:1 1 0;min-width:0;padding:12px 4px;background:transparent;border:1px solid #333;color:#555;border-radius:6px;cursor:pointer;font-family:monospace;font-size:12px;white-space:nowrap;transition:all 0.2s" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'\'">'+t('返回主页')+'</button>';
    h += '</div>';

    // 底部装饰线
    h += '<div style="height:3px;background:linear-gradient(90deg,transparent,'+accent+',transparent)"></div>';

    h += '</div>'; // cert-card end
    h += '</div>'; // outer end

    resume.innerHTML = h;
    resume.style.opacity = '1';
    // 卡片淡入
    var _card = document.getElementById('cert-card');
    if(_card){ requestAnimationFrame(function(){ _card.style.opacity='1'; _card.style.transform='translateY(0)'; }); }

    // ===== 动画序列 =====
    var self = this;
    // 数据行逐行淡入
    var certLines = resume.querySelectorAll('.cert-line');
    for(var j=0; j<certLines.length; j++){
      (function(el, delay){
        setTimeout(function(){
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
        }, delay * 200 + 100);
      })(certLines[j], j);
    }

    // 分数滚动动画
    var totalDelay = certLines.length * 200 + 400;
    setTimeout(function(){
      var bar = document.getElementById('cert-score-bar');
      var num = document.getElementById('cert-score-num');
      if(bar) bar.style.width = Math.min(100, score/2.5)+'%';
      // 数字滚动
      if(num){
        var start = 0;
        var end = score;
        var dur = 1200;
        var startT = Date.now();
        var tick = function(){
          var t = Math.min(1, (Date.now()-startT)/dur);
          t = 1 - Math.pow(1-t, 3); // ease-out cubic
          num.textContent = Math.floor(start + (end-start)*t);
          if(t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, totalDelay);

    // 引言
    setTimeout(function(){
      var q = document.getElementById('cert-quote');
      if(q) q.style.opacity = '1';
    }, totalDelay + 800);

    // 粒子特效（一次性轻量绽放，不再循环）
    setTimeout(function(){
      self._spawnCertParticles(accent);
    }, totalDelay + 200);
  },

  _spawnCertParticles: function(color){
    var container = document.getElementById('cert-particles');
    if(!container) return;
    // 一次性 8 粒，全部 forwards 后自然消失，不再调度新粒子
    for(var i=0; i<8; i++){
      (function(idx){
        var p = document.createElement('div');
        var size = 2 + Math.random()*3;
        var x = 15 + Math.random()*70;
        var dly = idx * 80;
        var dur = 1.4 + Math.random()*0.8;
        p.style.cssText = 'position:absolute;bottom:0;left:'+x+'%;width:'+size+'px;height:'+size+'px;background:'+color+';border-radius:50%;opacity:0.6;animation:cert-particle '+dur+'s ease-out '+dly+'ms forwards;pointer-events:none';
        container.appendChild(p);
        setTimeout(function(){ if(p.parentNode) p.remove(); }, dly + dur*1000 + 200);
      })(i);
    }
  },

  _crashPhase5: function(){
    var co = document.getElementById('crash-overlay');
    if(co) co.style.pointerEvents = 'auto';
    var scan = document.getElementById('crash-scanlines');
    if(scan) scan.style.opacity = '0.15';
    var rgb = document.getElementById('crash-rgb');
    if(rgb) rgb.style.animation = '';

    var btns = document.getElementById('cert-buttons');
    if(btns) btns.style.opacity = '1';
  },

  restartShort: function(){
    this._cleanupCrash();
    // 阻断 autosave 残留写回
    try{ if(typeof game!=='undefined') game._runEnded=true; }catch(e){}
    try{ if(window._saveTimer){clearTimeout(window._saveTimer);} }catch(e){}
    // 仅清当前 run 存档（保留成就/结局/亲和度等长期进度）
    try{
      localStorage.removeItem('pt_save');
      localStorage.removeItem('pt_save_short');
      localStorage.removeItem('pt_save_classic');
      localStorage.removeItem('parasiteTowerSave');
    }catch(e){}
    try{ localStorage.setItem('pt_mode','short'); }catch(e){}
    // 不走整页 reload，避免重看序章；直接复用 confirmModeAndContinue 流程
    if(typeof confirmModeAndContinue==='function'){
      window._selectedMode='short';
      if(window.GameModes && typeof GameModes.select==='function') GameModes.select('short');
      // 隐藏标题相关界面，进入职业选择
      try{
        var ss=document.getElementById('start-screen'); if(ss) ss.style.display='none';
        var ms=document.getElementById('mode-screen'); if(ms) ms.style.display='none';
        var gs=document.getElementById('game-screen'); if(gs) gs.classList.remove('active');
      }catch(e){}
      confirmModeAndContinue();
    }else{
      // 兜底：旧逻辑
      location.reload();
    }
  },

  crashBackToTitle: function(){
    this._cleanupCrash();
    if(typeof backToTitle === 'function') backToTitle();
  },

  _cleanupCrash: function(){
    this._crashing = false;
    try{ if(window.game) game._endScreenActive = false; }catch(e){}
    var co = document.getElementById('crash-overlay');
    if(co) co.remove();
    var bo = document.getElementById('short-blackout');
    if(bo) bo.remove();
    var ga = document.getElementById('game-area');
    if(ga) ga.style.animation = '';
    // 关闭可能残留的 event-overlay（海报预览/排行榜等），否则 isAnyOverlayOpen 会无限延迟 showCombat
    try{
      var ev = document.getElementById('event-overlay');
      if(ev){ ev.style.display='none'; ev.style.zIndex=''; }
      var ec = document.getElementById('event-choices'); if(ec) ec.innerHTML='';
      var et = document.getElementById('event-text'); if(et) et.innerHTML='';
    }catch(e){}
    // 清理top-bar乱码状态：data-orig 是上一局的脏数据，不能还原，直接清空让新局render覆盖
    var statEls = document.querySelectorAll('#top-bar [data-orig]');
    for(var i=0; i<statEls.length; i++){
      statEls[i].textContent = '';
      statEls[i].style.animation = '';
      statEls[i].removeAttribute('data-orig');
    }
  },

  // ===== 幕分隔 + 情绪事件 =====
  onFloorEnter: function(floor){
    if(typeof addMsg !== 'function') return;
    // 三浪标记
    if(floor === 1) addMsg('<span style="color:#1ed8b0;font-weight:bold;letter-spacing:2px">━━━ 第一浪 · 权力幻想 ━━━</span>');
    else if(floor === 4) addMsg('<span style="color:#ff8c00;font-weight:bold;letter-spacing:2px">━━━ 转折 · 失控前兆 ━━━</span>');
    else if(floor === 5) addMsg('<span style="color:#ff8c00;font-weight:bold;letter-spacing:2px">━━━ 第二浪 · 压力反转 ━━━</span>');
    else if(floor === 8) addMsg('<span style="color:#a01030;font-weight:bold;letter-spacing:2px">━━━ 转折 · 污染深渊 ━━━</span>');
    else if(floor === 9) addMsg('<span style="color:#ff006e;font-weight:bold;letter-spacing:2px">━━━ 第三浪 · 绝望反击 ━━━</span>');
    else if(floor === 12) addMsg('<span style="color:#ff006e;font-weight:bold;letter-spacing:2px">━━━ 终章 · 崩溃 ━━━</span>');

    // 浪间震屏+音效
    if(floor===5||floor===9||floor===12){
      try{playSubDrop(floor===12?0.6:0.35);}catch(e){}
      var ga=document.getElementById('game-area');
      if(ga){
        var _shakeT=0,_shakeId=setInterval(function(){
          _shakeT+=30;
          if(_shakeT>=400){clearInterval(_shakeId);ga.style.transform='';return;}
          var dx=(Math.random()-0.5)*6,dy=(Math.random()-0.5)*6;
          ga.style.transform='translate('+dx+'px,'+dy+'px)';
        },30);
      }
    }

    // L1 权力幻想提示
    if(floor === 1){
      setTimeout(function(){
        addMsg('<span style="color:#c6f;font-style:italic">你醒来了。这具身体充满力量——但倒计时已经开始。</span>');
        setTimeout(function(){
          addMsg('<span style="color:#ff8c00;font-weight:bold">➤ 消灭敌人，夺取更强的身体。15 分钟后，一切结束。</span>');
        }, 1500);
      }, 800);
    }

    // L3 附身快照（给 L6 用）
    if(floor === 3 && this._possessCount > 0){
      this._takePossessSnapshot();
    }

    // L4: 首次污染警告
    if(floor === 4){
      setTimeout(function(){
        addMsg('<span style="color:#ff8c00">☢ 身体开始排斥你的意识。每前进一步，污染都在累积。</span>');
      }, 600);
    }

    // L5+ 启动视觉失真
    if(floor >= 5) this._glitchActive = true;

    // L6 "曾经的你"
    if(floor === 6 && this._l3Snapshot){
      this._spawnPastSelf();
    }

    // 情绪消息
    if(floor === 3 && this._possessCount > 0){
      addMsg('<span style="color:#888;font-style:italic">身后传来碎裂声——你曾经的躯壳正在腐烂。</span>');
    }
    if(floor === 5){
      addMsg('<span style="color:#ff006e">你的视野开始扭曲。污染正在侵蚀意识。</span>');
    }
    if(floor === 7){
      addMsg('<span style="color:#ff006e;font-weight:bold">警告：意识边界模糊。你还记得自己是谁吗？</span>');
    }
    // L8: 污染深渊预警
    if(floor === 8){
      addMsg('<span style="color:#ff006e;font-weight:bold">⚠ 意识正在溶解。你还能坚持多久？</span>');
    }
    // L9: 最后的战斗
    if(floor === 9){
      setTimeout(function(){
        addMsg('<span style="color:#ff006e;font-style:italic">你感到某种东西正在觉醒……是恐惧，还是力量？</span>');
      }, 500);
    }
    // L11: 巅峰
    if(floor === 11){
      addMsg('<span style="color:#ffd700;font-weight:bold;text-shadow:0 0 8px rgba(255,215,0,0.5)">⚡ 意识之火燃到极限——这是你最后的光。</span>');
    }
  },

  // ===== 附身追踪 =====
  onPossess: function(target){
    this._possessCount++;
    var now = Date.now();
    var dur = (now - this._currentFormStart) / 1000;
    if(dur > this._longestForm.duration){
      this._longestForm = {name: game.player.name || '未知', duration: dur};
    }
    this._formHistory.push(game.player.name || '未知');
    this._currentFormStart = now;
    // L1-L4: "这是你的第N次盗窃"
    if(typeof game!=='undefined' && game.floor <= 4){
      setTimeout(function(){
        if(typeof addMsg === 'function') addMsg('<span style="color:#1ed8b0;font-style:italic">这是你的第' + ShortMode._possessCount + '次盗窃。</span>');
      }, 1200);
    }
  },

  _takePossessSnapshot: function(){
    if(typeof game==='undefined' || !game.player) return;
    this._l3Snapshot = {
      name: game.player.name,
      type: game.player.formType,
      maxHp: game.player.maxHp,
      atk: game.player.atk,
      def: game.player.def,
      color: game.player.formColor || '#888'
    };
  },

  _spawnPastSelf: function(){
    if(!this._l3Snapshot || typeof game==='undefined') return;
    var s = this._l3Snapshot;
    var mx = 6, my = 3;
    if(game.tiles && game.tiles[my] && game.tiles[my][mx] === 1){
      game.monsters.push({
        id: 'past_self', type: s.type || 'rat', name: '曾经的你·' + s.name,
        hp: Math.floor(s.maxHp * 0.8), maxHp: Math.floor(s.maxHp * 0.8),
        atk: Math.floor(s.atk * 0.9), def: s.def,
        traits: [], color: '#666',
        x: mx, y: my, possessed: false,
        ai: 'aggressive', alertLevel: 2,
        homeX: mx, homeY: my, detectRange: 5,
        _pastSelf: true
      });
      addMsg('<span style="color:#b455ff;font-weight:bold">⚠ 一个熟悉的身影出现了——那是……你？</span>');
    }
  },

  // ===== 视觉失真 =====
  tickGlitch: function(dt){
    if(!this._glitchActive || typeof game==='undefined') return;
    var floor = game.floor;
    var pol = game.player ? game.player.pollution : 0;

    // L5-L7: 数字偶尔抖动
    if(floor >= 5 && floor <= 7){
      this._shakeTimer -= dt;
      if(this._shakeTimer <= 0){
        this._shakeTimer = 3 + Math.random() * 4;
        this._doNumberGlitch();
      }
    }

    // L7+: 屏幕"眨眼"黑帧
    if(floor >= 7){
      this._blackoutTimer -= dt;
      if(this._blackoutTimer <= 0){
        this._blackoutTimer = 5 + Math.random() * 6;
        this._doBlackout();
      }
    }

    // L6+: 怪物名字偶尔替换为玩家用过的形态名
    if(floor >= 6 && this._formHistory.length > 0 && Math.random() < 0.003){
      this._doNameGlitch();
    }
  },

  _doNumberGlitch: function(){
    var ga = document.getElementById('game-area');
    if(!ga) return;
    ga.style.transform = 'translate(' + (Math.random()*4-2) + 'px,' + (Math.random()*4-2) + 'px)';
    setTimeout(function(){ if(ga) ga.style.transform = ''; }, 150);
  },

  _doBlackout: function(){
    var overlay = document.getElementById('short-blackout');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'short-blackout';
      overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:999;pointer-events:none;opacity:0;transition:opacity 0.05s';
      document.body.appendChild(overlay);
    }
    overlay.style.opacity = '1';
    setTimeout(function(){ overlay.style.opacity = '0'; }, 180 + Math.random() * 120);
  },

  _doNameGlitch: function(){
    if(typeof game==='undefined' || !game.monsters) return;
    var names = this._formHistory;
    var alive = game.monsters.filter(function(m){ return m.hp > 0 && !m._pastSelf; });
    if(alive.length === 0) return;
    var m = alive[Math.floor(Math.random() * alive.length)];
    m._origName = m._origName || m.name;
    m.name = names[Math.floor(Math.random() * names.length)];
    setTimeout(function(){ if(m._origName) m.name = m._origName; }, 3000);
  },

  // ===== 迭代履历书 =====
  showResume: function(){
    var dur = (900 - this._remaining);
    var longestDur = Math.max(this._longestForm.duration, (Date.now() - this._currentFormStart) / 1000);
    var longestName = longestDur === this._longestForm.duration ? this._longestForm.name : (game.player ? game.player.name : t('未知'));
    var iteration = this.getIteration();

    var html = '<div style="background:#0a0812;border:1px solid #1ed8b0;border-radius:10px;padding:20px;max-width:320px;margin:0 auto;text-align:center;font-family:inherit">';
    html += '<div style="color:#1ed8b0;font-size:1.2em;font-weight:bold;letter-spacing:3px;margin-bottom:12px">' + t('第 ') + iteration + t('次迭代') + '</div>';
    html += '<div style="border-top:1px solid #333;padding-top:12px;text-align:left;font-size:12px;color:#aaa;line-height:2">';
    html += t('🧬 盗窃次数：') + '<span style="color:#fff;font-weight:bold">' + this._possessCount + '</span><br>';
    html += t('⏱ 存活时长：') + '<span style="color:#fff;font-weight:bold">' + Math.floor(dur/60) + t('分') + Math.floor(dur%60) + t('秒') + '</span><br>';
    html += t('🏆 最久宿主：') + '<span style="color:#fff;font-weight:bold">' + longestName + '</span>（' + Math.floor(longestDur) + t('秒') + '）<br>';
    html += t('☢ 最高污染：') + '<span style="color:#ff006e;font-weight:bold">' + this._maxPollution + '%</span><br>';
    html += t('💀 最终形态：') + '<span style="color:#fff;font-weight:bold">' + (game.player ? game.player.name : t('未知')) + '</span>';
    html += '</div>';
    html += '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #333;color:#666;font-size:10px;font-style:italic">' + t('"你的第') + iteration + t('次迭代值得被记住"') + '</div>';
    html += '<div style="margin-top:12px;display:flex;gap:8px;justify-content:center">';
    html += '<button onclick="ShortMode.shareRunPoster()" style="padding:8px 16px;background:#1a1028;border:1px solid #1ed8b0;color:#1ed8b0;border-radius:4px;cursor:pointer;font-family:inherit;font-size:12px">' + t('📷 海报') + '</button>';
    html += '<button onclick="ShortMode.showLeaderboard()" style="padding:8px 16px;background:#1a1028;border:1px solid #ffd700;color:#ffd700;border-radius:4px;cursor:pointer;font-family:inherit;font-size:12px">' + t('🏅 排行榜') + '</button>';
    html += '<button onclick="closeEvent()" style="padding:8px 16px;background:#1a1028;border:1px solid #555;color:#888;border-radius:4px;cursor:pointer;font-family:inherit;font-size:12px">' + t('继续') + '</button>';
    html += '</div></div>';

    var ev = document.getElementById('event-overlay');
    if(ev){
      ev.style.display = 'flex';
      document.getElementById('event-title').textContent = '';
      document.getElementById('event-text').innerHTML = html;
      document.getElementById('event-choices').innerHTML = '';
    }
  },

  shareRunPoster: function(){
    var d=this._lastRunData;
    if(!d){this._showCertToast(t('无数据可分享'),'#f66');return;}
    if(typeof shareShortRunPoster==='function')shareShortRunPoster(d);
    else this.shareRunResult();
  },

  shareRunResult: function(){
    var d = this._lastRunData;
    if(!d){ this._showCertToast(t('无数据可分享'),'#f66'); return; }
    var mm = Math.floor(d.dur/60), ss = Math.floor(d.dur%60);
    var ts = (mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss;
    var iter = String(d.iteration); while(iter.length<3) iter='0'+iter;
    var text = '🧬 你也是我 · 迭代 #'+iter+'\n'
      + '━━━━━━━━━━━━━━━\n'
      + '📊 评级: '+d.rating+' | 分数: '+d.score+'\n'
      + '⏱ '+ts+' | 🧬 附身'+d.possessions+' | 💀 击杀'+d.kills+'\n'
      + '🏢 '+d.floor+'/12层 | ☢ 污染'+d.maxPollution+'%\n'
      + '#你也是我 #YouAreMe';
    var self = this;
    if(typeof copyTextToClipboard==='function'){
      copyTextToClipboard(text, t('战绩已复制，可分享到社交媒体'));
      if(this._crashing) this._showCertToast(t('战绩已复制，可分享到社交媒体'),'#1ed8b0');
    }
    else if(this._crashing) this._showCertToast(t('复制失败，请手动复制'),'#f66');
  },

  _showCertToast: function(msg, color){
    var resume = document.getElementById('crash-resume');
    if(!resume) return;
    var toast = document.createElement('div');
    toast.style.cssText='position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#111;border:1px solid '+(color||'#1ed8b0')+';color:'+(color||'#1ed8b0')+';padding:8px 16px;border-radius:6px;font-size:11px;z-index:1200;pointer-events:none;opacity:1;transition:opacity 0.5s';
    toast.textContent=msg;
    document.body.appendChild(toast);
    setTimeout(function(){toast.style.opacity='0';},1500);
    setTimeout(function(){if(toast.parentNode)toast.remove();},2200);
  },

  saveToLeaderboard: function(d){
    try{
      var lb = this.getLeaderboard();
      lb.push({
        iteration: d.iteration, score: d.score, rating: d.rating,
        time: d.dur, possessions: d.possessions, kills: d.kills,
        floor: d.floor, maxPollution: d.maxPollution,
        finalForm: d.finalForm, cause: d.cause,
        playerClass: d.playerClass, date: new Date().toISOString().slice(0,10)
      });
      lb.sort(function(a,b){ return b.score - a.score; });
      if(lb.length > 20) lb = lb.slice(0, 20);
      localStorage.setItem('pt_leaderboard', JSON.stringify({version:1, runs:lb}));
    }catch(e){}
    try{
      if(window.PT_API && window.PT_IDENTITY && window.PT_IDENTITY.hasNickname()){
        var seed = (function(){ var n=new Date(); return n.getFullYear()*10000 + (n.getMonth()+1)*100 + n.getDate(); })();
        window.PT_API.submit({
          uid: window.PT_IDENTITY.getUID(),
          nickname: window.PT_IDENTITY.getNickname(),
          modeId: 'short',
          score: d.score|0,
          rating: d.rating||'',
          duration: d.dur|0,
          floor: d.floor|0,
          possessions: d.possessions|0,
          kills: d.kills|0,
          maxPollution: d.maxPollution|0,
          playerClass: d.playerClass||'',
          finalForm: d.finalForm||'',
          longestHost: d.longestHost||'',
          longestDur: d.longestDur|0,
          cause: d.cause||'',
          iteration: d.iteration|0,
          dailySeed: seed,
          dailyModId: seed % 10,
          clientVer: (window.PT_VERSION||''),
          metaTier: (window.MetaProgress ? MetaProgress.metaTier() : 0),
          weekSeed: (typeof getWeekSeed==='function' ? getWeekSeed() : 0),
          isWeekly: (game && game._isWeeklyChallenge) ? 1 : 0
        }).catch(function(e){ try{ console.warn('[lb] upload failed', e); }catch(_){ } });
      }
    }catch(e){}
    try{
      if(window.PT_API && window.PT_API.reportCrash){
        var msg='[death] '
          +'class='+(d.playerClass||'')
          +' form='+(d.finalForm||'')
          +' floor='+(d.floor|0)
          +' score='+(d.score|0)
          +' rating='+(d.rating||'')
          +' dur='+(d.dur|0)+'s'
          +' poss='+(d.possessions|0)
          +' kills='+(d.kills|0)
          +' maxPoll='+(d.maxPollution|0)
          +' longestHost='+(d.longestHost||'-')+'('+(d.longestDur|0)+'s)'
          +' cause='+(d.cause||'unknown')
          +' iter='+(d.iteration|0);
        window.PT_API.reportCrash({
          uid:(window.PT_IDENTITY&&window.PT_IDENTITY.getUID&&window.PT_IDENTITY.getUID())||'',
          nickname:(window.PT_IDENTITY&&window.PT_IDENTITY.getNickname&&window.PT_IDENTITY.getNickname())||'',
          clientVer:(window.PT_VERSION||''),
          platform:'android',
          ua:navigator.userAgent,
          message:msg,
          stack:'',
          source:'death-report',
          url:location.href,
          floor:d.floor|0,
          playerClass:d.playerClass||''
        }).catch(function(){});
      }
    }catch(e){}
  },

  getLeaderboard: function(){
    try{
      var raw = localStorage.getItem('pt_leaderboard');
      if(raw){ var obj = JSON.parse(raw); if(obj && obj.runs) return obj.runs; }
    }catch(e){}
    return [];
  },

  showLeaderboard: function(){
    var self = this;
    var ev = document.getElementById('event-overlay');
    if(!ev) return;
    if(this._crashing) ev.style.zIndex = '1100';
    ev.style.display = 'flex';
    document.getElementById('event-title').innerHTML = '🏅 <span style="color:#F6C453">短局排行榜</span>';
    document.getElementById('event-choices').innerHTML = '<button class="btn btn-secondary" onclick="closeEvent()" style="padding:8px 28px">关闭</button>';
    if(!this._lbState) this._lbState = { tab:'score', period:'all', cls:'swarm' };
    this._renderLeaderboard();
  },

  _lbTabBtn: function(label, key, cur){
    var on = (key===cur);
    var bg = on ? 'rgba(53,224,255,.12)' : 'rgba(8,10,18,.55)';
    var col = on ? '#35E0FF' : '#9CB6D9';
    var bd = on ? 'rgba(53,224,255,.45)' : 'rgba(120,140,220,.18)';
    return '<button data-lbtab="'+key+'" style="flex:1;padding:7px 4px;background:'+bg+';border:1px solid '+bd+';border-radius:4px;color:'+col+';font-family:inherit;font-size:11.5px;letter-spacing:1.2px;cursor:pointer">'+label+'</button>';
  },

  _lbSubBtn: function(label, key, cur){
    var on = (key===cur);
    var col = on ? '#F6C453' : '#7E86A3';
    var bd = on ? 'rgba(246,196,83,.45)' : 'rgba(120,140,220,.12)';
    var bg = on ? 'rgba(246,196,83,.08)' : 'transparent';
    return '<button data-lbsub="'+key+'" style="flex:1;padding:5px 4px;background:'+bg+';border:1px solid '+bd+';border-radius:3px;color:'+col+';font-family:inherit;font-size:10.5px;letter-spacing:1px;cursor:pointer">'+label+'</button>';
  },

  _renderLeaderboard: function(){
    var self = this, st = this._lbState;
    var box = document.getElementById('event-text');
    if(!box) return;
    var tabs = '<div style="display:flex;gap:5px;margin-bottom:10px">'+
      this._lbTabBtn('综合','score',st.tab)+
      this._lbTabBtn('速通','speed',st.tab)+
      this._lbTabBtn('今日','daily',st.tab)+
      this._lbTabBtn('职业','class',st.tab)+
      this._lbTabBtn('我的','me',st.tab)+
    '</div>';
    var subBar = '';
    if(st.tab==='score'){
      subBar = '<div style="display:flex;gap:5px;margin-bottom:10px">'+
        this._lbSubBtn('全时段','all',st.period)+
        this._lbSubBtn('本周','week',st.period)+
        this._lbSubBtn('今日','day',st.period)+
      '</div>';
    } else if(st.tab==='class'){
      var classes = [['swarm','虫群'],['titan','巨像'],['ghost','幽影'],['blood','血裔'],['mech','机械']];
      subBar = '<div style="display:flex;gap:5px;margin-bottom:10px">';
      for(var i=0;i<classes.length;i++) subBar += this._lbSubBtn(classes[i][1], classes[i][0], st.cls);
      subBar += '</div>';
    }
    var skeleton = '<div style="text-align:center;padding:32px 8px;color:#7E86A3;font-size:12px;letter-spacing:1.5px">'+
      '<div style="font-size:22px;margin-bottom:8px;opacity:.5">⌛</div>'+
      '<div>加载中…</div></div>';
    box.innerHTML = tabs + subBar + '<div id="lb-body">'+skeleton+'</div>';
    // bind buttons
    Array.prototype.forEach.call(box.querySelectorAll('[data-lbtab]'), function(b){
      b.onclick = function(){ st.tab = b.getAttribute('data-lbtab'); self._renderLeaderboard(); };
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-lbsub]'), function(b){
      b.onclick = function(){
        var v = b.getAttribute('data-lbsub');
        if(st.tab==='score') st.period = v; else if(st.tab==='class') st.cls = v;
        self._renderLeaderboard();
      };
    });
    // load data
    this._loadLeaderboardBody();
  },

  _loadLeaderboardBody: function(){
    var self = this, st = this._lbState;
    var body = document.getElementById('lb-body');
    if(!body) return;
    if(!window.PT_API){ body.innerHTML = self._renderLocalFallback('排行榜服务未就绪'); return; }
    var p, kind = st.tab;
    if(kind==='score'){
      p = window.PT_API.fetchBoard({ type:'score', period:st.period, limit:50 });
    } else if(kind==='speed'){
      p = window.PT_API.fetchBoard({ type:'speed', limit:50 });
    } else if(kind==='daily'){
      p = window.PT_API.fetchBoard({ type:'daily', limit:50 });
    } else if(kind==='class'){
      p = window.PT_API.fetchBoard({ type:'class', class:st.cls, limit:50 });
    } else if(kind==='me'){
      var uid = window.PT_IDENTITY ? window.PT_IDENTITY.getUID() : '';
      if(!uid){ body.innerHTML = '<div style="text-align:center;color:#9CB6D9;padding:24px">未识别到玩家身份</div>'; return; }
      p = window.PT_API.fetchMe(uid);
    }
    var reqTab = kind, reqSub = (kind==='score'?st.period:(kind==='class'?st.cls:''));
    p.then(function(res){
      // 防止快速切换时旧响应覆盖新视图
      if(self._lbState.tab!==reqTab) return;
      if(reqTab==='score' && self._lbState.period!==reqSub) return;
      if(reqTab==='class' && self._lbState.cls!==reqSub) return;
      if(kind==='me') body.innerHTML = self._renderMeBoards(res);
      else body.innerHTML = self._renderRows(res.rows||[], kind);
    }).catch(function(){
      body.innerHTML = self._renderLocalFallback('无法连接服务器，显示本地记录');
    });
  },

  _renderRows: function(rows, kind){
    if(!rows || rows.length===0){
      return '<div style="text-align:center;padding:32px 8px;color:#7E86A3;font-size:12.5px;letter-spacing:1.2px;line-height:1.8">'+
        '<div style="font-size:28px;margin-bottom:10px;opacity:.4">🏅</div>'+
        '<div style="color:#9CB6D9">暂无记录</div>'+
        '<div style="color:#5A6078;font-size:11px;margin-top:4px">完成一次短局即可上榜</div></div>';
    }
    var isSpeed = (kind==='speed');
    var cols = isSpeed ? '22px 52px 38px 60px minmax(60px,1fr)' : '22px 32px 52px 38px 46px minmax(60px,1fr)';
    var spanS = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0';
    var html = '<div style="font-size:11px;max-height:48vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid rgba(120,140,220,.10);border-radius:8px;background:rgba(8,10,18,.55)">';
    html += '<div style="display:grid;grid-template-columns:'+cols+';gap:5px;padding:8px 10px;border-bottom:1px solid rgba(201,209,230,.10);font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:0.6px;color:#7E86A3;text-transform:uppercase">';
    if(isSpeed) html += '<span style="'+spanS+'">#</span><span style="'+spanS+'">分数</span><span style="'+spanS+'">层</span><span style="'+spanS+'">时间</span><span style="'+spanS+'">玩家</span></div>';
    else html += '<span style="'+spanS+'">#</span><span style="'+spanS+'">评级</span><span style="'+spanS+'">分数</span><span style="'+spanS+'">层</span><span style="'+spanS+'">时间</span><span style="'+spanS+'">玩家</span></div>';
    var myUid = window.PT_IDENTITY ? window.PT_IDENTITY.getUID() : '';
    for(var i=0;i<rows.length;i++){
      var r = rows[i];
      var rc = r.rating==='SSS'?'#ff006e':r.rating==='SS'?'#b455ff':r.rating==='S'?'#F6C453':r.rating==='A'?'#35E0FF':r.rating==='B'?'#ff8c00':'#7E86A3';
      var mm = Math.floor((r.duration||0)/60), ss = Math.floor((r.duration||0)%60);
      var ts = mm+':'+(ss<10?'0':'')+ss;
      var rankColor = i===0?'#F6C453':i===1?'#C9D1E6':i===2?'#cd7f32':'#5A6078';
      var isMe = (r.uid && myUid && r.uid===myUid);
      var bg = isMe?'rgba(53,224,255,.10)':(i===0?'linear-gradient(90deg,rgba(246,196,83,.08),rgba(246,196,83,.02))':(i%2===0?'rgba(120,140,220,.025)':'transparent'));
      html += '<div style="display:grid;grid-template-columns:'+cols+';gap:5px;padding:9px 10px;background:'+bg+';border-bottom:1px solid rgba(201,209,230,.05);align-items:center;font-family:\'Courier New\',monospace;font-size:12px">';
      html += '<span style="color:'+rankColor+';font-weight:'+(i<3?'700':'400')+';'+spanS+'">'+(r.rank||(i+1))+'</span>';
      if(!isSpeed) html += '<span style="color:'+rc+';font-weight:700;text-shadow:0 0 6px '+rc+'40;'+spanS+'">'+(r.rating||'-')+'</span>';
      html += '<span style="color:#E8F3FF;font-weight:600;'+spanS+'">'+r.score+'</span>';
      html += '<span style="color:#9CB6D9;'+spanS+'">'+r.floor+'<span style="color:#5A6078;font-size:10px">/12</span></span>';
      html += '<span style="color:#9CB6D9;'+spanS+'">'+ts+'</span>';
      var nick = (r.nickname||'?').replace(/[<>"&]/g,'');
      html += '<span style="color:'+(isMe?'#35E0FF':'#C9D1E6')+';font-family:inherit;font-size:11.5px;'+spanS+'">'+nick+(isMe?' <span style="color:#5A6078;font-size:10px">(我)</span>':'')+'</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div style="margin-top:10px;text-align:center;color:#5A6078;font-family:\'Courier New\',monospace;font-size:9.5px;letter-spacing:2px">RECORD '+rows.length+' / 50</div>';
    return html;
  },

  _renderMeBoards: function(res){
    var boards = (res && res.boards) || [];
    var nick = (res && res.nickname) || (window.PT_IDENTITY?window.PT_IDENTITY.getNickname():'') || '玩家';
    var labels = {
      'score|all':'综合 · 全时段', 'score|week':'综合 · 本周', 'score|day':'综合 · 今日',
      'speed|':'速通 (F12 通关)', 'daily|':'今日 Modifier',
      'class|swarm':'职业 · 虫群', 'class|titan':'职业 · 巨像', 'class|ghost':'职业 · 幽影',
      'class|blood':'职业 · 血裔', 'class|mech':'职业 · 机械'
    };
    var html = '<div style="font-size:12px;color:#9CB6D9;margin-bottom:10px;letter-spacing:.6px">玩家：<span style="color:#35E0FF">'+nick.replace(/[<>"&]/g,'')+'</span></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:48vh;overflow-y:auto">';
    for(var i=0;i<boards.length;i++){
      var b = boards[i];
      var key = (b.type||'')+'|'+(b.sub||'');
      var lab = labels[key] || (b.type+(b.sub?(' · '+b.sub):''));
      var rankTxt, statTxt;
      if(b.rank>0){
        rankTxt = '<span style="color:#F6C453;font-size:18px;font-weight:700">#'+b.rank+'</span><span style="color:#5A6078;font-size:11px"> / '+b.total+'</span>';
        statTxt = '超过 '+b.percentile+'% · ';
        if(b.type==='speed') statTxt += '最快 '+Math.floor(b.bestDur/60)+':'+(b.bestDur%60<10?'0':'')+(b.bestDur%60);
        else statTxt += '最高 '+b.bestScore;
      } else {
        rankTxt = '<span style="color:#5A6078;font-size:13px">未上榜</span>';
        statTxt = '完成一次即可';
      }
      html += '<div style="padding:10px 12px;background:rgba(8,10,18,.55);border:1px solid rgba(120,140,220,.12);border-radius:6px">'+
              '<div style="color:#7E86A3;font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase;margin-bottom:6px">'+lab+'</div>'+
              '<div style="line-height:1.4">'+rankTxt+'</div>'+
              '<div style="color:#9CB6D9;font-size:10.5px;margin-top:4px">'+statTxt+'</div>'+
              '</div>';
    }
    html += '</div>';
    return html;
  },

  _renderLocalFallback: function(msg){
    var runs = this.getLeaderboard();
    var head = '<div style="margin-bottom:10px;padding:8px 12px;background:rgba(255,80,100,.10);border:1px solid rgba(255,120,140,.32);border-radius:6px;color:#ff8aa0;font-size:11.5px;letter-spacing:.6px">'+msg+'</div>';
    if(runs.length===0){
      return head + '<div style="text-align:center;padding:24px 8px;color:#7E86A3;font-size:12px">暂无本地记录</div>';
    }
    var cols = '22px 32px 52px 38px 46px minmax(48px,1fr)';
    var spanS = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0';
    var html = head + '<div style="font-size:11px;max-height:42vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid rgba(120,140,220,.10);border-radius:8px;background:rgba(8,10,18,.55)">';
    html += '<div style="display:grid;grid-template-columns:'+cols+';gap:5px;padding:8px 10px;border-bottom:1px solid rgba(201,209,230,.10);font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:0.6px;color:#7E86A3;text-transform:uppercase"><span style="'+spanS+'">#</span><span style="'+spanS+'">评级</span><span style="'+spanS+'">分数</span><span style="'+spanS+'">层</span><span style="'+spanS+'">时间</span><span style="'+spanS+'">形态</span></div>';
    for(var i=0;i<runs.length;i++){
      var r = runs[i];
      var rc = r.rating==='SSS'?'#ff006e':r.rating==='SS'?'#b455ff':r.rating==='S'?'#F6C453':r.rating==='A'?'#35E0FF':r.rating==='B'?'#ff8c00':'#7E86A3';
      var mm = Math.floor((r.time||0)/60), ss = Math.floor((r.time||0)%60);
      var ts = mm+':'+(ss<10?'0':'')+ss;
      var rankColor = i===0?'#F6C453':i===1?'#C9D1E6':i===2?'#cd7f32':'#5A6078';
      html += '<div style="display:grid;grid-template-columns:'+cols+';gap:5px;padding:9px 10px;border-bottom:1px solid rgba(201,209,230,.05);align-items:center;font-family:\'Courier New\',monospace;font-size:12px">';
      html += '<span style="color:'+rankColor+';font-weight:'+(i<3?'700':'400')+';'+spanS+'">'+(i+1)+'</span>';
      html += '<span style="color:'+rc+';font-weight:700;'+spanS+'">'+r.rating+'</span>';
      html += '<span style="color:#E8F3FF;font-weight:600;'+spanS+'">'+r.score+'</span>';
      html += '<span style="color:#9CB6D9;'+spanS+'">'+r.floor+'<span style="color:#5A6078;font-size:10px">/12</span></span>';
      html += '<span style="color:#9CB6D9;'+spanS+'">'+ts+'</span>';
      html += '<span style="color:#C9D1E6;font-family:inherit;font-size:11.5px;'+spanS+'">'+(r.finalForm||'?')+'</span>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  },
};

window.GameModes.list.push({
  id: 'short',
  name: '短局',
  desc: '12 层 15 分钟 · 强压力 · viral 体验',
  duration: '~15分钟',
  config: {
    modeId: 'short',
    modeName: '短局',
    floorCap: 12,
    hpMult: 0.7,
    pollutionRate: 1.3,
    slotCap: 3,
    xpMult: 0.7,
    timeLimit: 900,
    hooks: {
      onModeStart: function(){
        ShortMode.init();
      },
      onFloorEnter: function(f){
        ShortMode.onFloorEnter(f);
      },
      onTick: function(){
        ShortMode.tick();
      },
      onPossess: function(t){
        ShortMode.onPossess(t);
      },
    }
  }
});
