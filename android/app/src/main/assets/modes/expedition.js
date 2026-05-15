// 远征模式：20 层 25-40 分钟 · 章节推进 · 稳定成长
window.GameModes = window.GameModes || { list: [] };

var EXPEDITION_FLOOR_CURVE = {
  // 章一：前厅与污染边缘 (F1-5)
  1:  {hpScale:0.85, atkScale:0.80, count:4,  eliteRate:0,    epMult:1.5, fragRate:0.75, pollAdd:0, possessPollMult:0.6},
  2:  {hpScale:0.90, atkScale:0.85, count:5,  eliteRate:0,    epMult:1.4, fragRate:0.75, pollAdd:0, possessPollMult:0.6},
  3:  {hpScale:0.95, atkScale:0.90, count:5,  eliteRate:0.08, epMult:1.4, fragRate:0.70, pollAdd:0, possessPollMult:0.7},
  4:  {hpScale:1.00, atkScale:0.95, count:6,  eliteRate:0.10, epMult:1.3, fragRate:0.70, pollAdd:0, possessPollMult:0.8},
  5:  {hpScale:1.05, atkScale:1.00, count:4,  eliteRate:0.12, epMult:1.3, fragRate:0.70, pollAdd:0, possessPollMult:0.8},
  // 章二：裂变层区 (F6-10)
  6:  {hpScale:1.10, atkScale:1.05, count:6,  eliteRate:0.15, epMult:1.3, fragRate:0.70, pollAdd:1, possessPollMult:0.9},
  7:  {hpScale:1.15, atkScale:1.08, count:7,  eliteRate:0.18, epMult:1.2, fragRate:0.65, pollAdd:1, possessPollMult:1.0},
  8:  {hpScale:1.18, atkScale:1.10, count:5,  eliteRate:0.15, epMult:1.0, fragRate:0.60, pollAdd:1, possessPollMult:1.0},
  9:  {hpScale:1.22, atkScale:1.13, count:7,  eliteRate:0.20, epMult:1.3, fragRate:0.70, pollAdd:1, possessPollMult:1.0},
  10: {hpScale:1.28, atkScale:1.18, count:4,  eliteRate:0.22, epMult:1.2, fragRate:0.70, pollAdd:1, possessPollMult:1.1},
  // 章三：深层脉络 (F11-15)
  11: {hpScale:1.32, atkScale:1.20, count:7,  eliteRate:0.22, epMult:1.3, fragRate:0.70, pollAdd:2, possessPollMult:1.1},
  12: {hpScale:1.36, atkScale:1.23, count:8,  eliteRate:0.25, epMult:1.2, fragRate:0.65, pollAdd:2, possessPollMult:1.2},
  13: {hpScale:1.40, atkScale:1.25, count:8,  eliteRate:0.28, epMult:1.5, fragRate:0.75, pollAdd:2, possessPollMult:1.2},
  14: {hpScale:1.44, atkScale:1.28, count:8,  eliteRate:0.28, epMult:1.3, fragRate:0.70, pollAdd:3, possessPollMult:1.3},
  15: {hpScale:1.48, atkScale:1.30, count:5,  eliteRate:0.30, epMult:1.3, fragRate:0.70, pollAdd:3, possessPollMult:1.3},
  // 终章：终域回响 (F16-20)
  16: {hpScale:1.52, atkScale:1.33, count:8,  eliteRate:0.30, epMult:1.4, fragRate:0.75, pollAdd:3, possessPollMult:1.4},
  17: {hpScale:1.56, atkScale:1.35, count:9,  eliteRate:0.32, epMult:1.4, fragRate:0.75, pollAdd:3, possessPollMult:1.5},
  18: {hpScale:1.58, atkScale:1.35, count:5,  eliteRate:0.25, epMult:1.2, fragRate:0.70, pollAdd:3, possessPollMult:1.5},
  19: {hpScale:1.62, atkScale:1.38, count:9,  eliteRate:0.35, epMult:1.5, fragRate:0.80, pollAdd:4, possessPollMult:1.6},
  20: {hpScale:1.70, atkScale:1.42, count:5,  eliteRate:0.38, epMult:1.8, fragRate:0.90, pollAdd:4, possessPollMult:1.8}
};

window.ExpeditionMode = {
  _possessCount: 0,
  _longestForm: {name:'', duration:0},
  _currentFormStart: 0,
  _maxPollution: 0,
  _formHistory: [],
  _startTime: 0,
  _lastRunData: null,

  init: function(){
    this._possessCount = 0;
    this._longestForm = {name:'寄生体', duration:0};
    this._currentFormStart = Date.now();
    this._maxPollution = 0;
    this._formHistory = [];
    this._startTime = Date.now();
    this._lastRunData = null;
  },

  getFloorCurve: function(floor){
    return EXPEDITION_FLOOR_CURVE[floor] || EXPEDITION_FLOOR_CURVE[20];
  },

  getZone: function(f){
    if(f <= 5) return 1;
    if(f <= 10) return 2;
    if(f <= 15) return 3;
    return 4;
  },

  onFloorEnter: function(floor){
    if(typeof addMsg !== 'function') return;
    if(typeof game !== 'undefined' && game.player)
      this._maxPollution = Math.max(this._maxPollution, game.player.pollution || 0);

    // 章节标题
    if(floor === 1){
      addMsg('<span style="color:#29d3b3;font-weight:bold;letter-spacing:2px">━━━ 第一章 · 前厅 ━━━</span>');
      setTimeout(function(){
        addMsg('<span style="color:#9aa8ca;font-style:italic">废弃走廊的尽头，传来低沉的脉动声。</span>');
      }, 600);
    }else if(floor === 6){
      addMsg('<span style="color:#ff8c00;font-weight:bold;letter-spacing:2px">━━━ 第二章 · 裂变 ━━━</span>');
      setTimeout(function(){
        addMsg('<span style="color:#9aa8ca;font-style:italic">空气中弥漫着不属于你的记忆碎片。</span>');
      }, 600);
      try{playSubDrop(0.3);}catch(e){}
    }else if(floor === 11){
      addMsg('<span style="color:#b455ff;font-weight:bold;letter-spacing:2px">━━━ 第三章 · 深层脉络 ━━━</span>');
      setTimeout(function(){
        addMsg('<span style="color:#9aa8ca;font-style:italic">脚下的地面在呼吸。你分不清是幻觉还是现实。</span>');
      }, 600);
      try{playSubDrop(0.35);}catch(e){}
    }else if(floor === 16){
      addMsg('<span style="color:#ff006e;font-weight:bold;letter-spacing:2px">━━━ 终章 · 终域回响 ━━━</span>');
      setTimeout(function(){
        addMsg('<span style="color:#9aa8ca;font-style:italic">所有被你吞噬的声音，此刻同时响起。</span>');
      }, 600);
      try{playSubDrop(0.5);}catch(e){}
    }

    // 章节开始震屏
    if(floor===6||floor===11||floor===16){
      var ga=document.getElementById('game-area');
      if(ga){
        var _t=0,_id=setInterval(function(){
          _t+=30;
          if(_t>=350){clearInterval(_id);ga.style.transform='';return;}
          var dx=(Math.random()-0.5)*5,dy=(Math.random()-0.5)*5;
          ga.style.transform='translate('+dx+'px,'+dy+'px)';
        },30);
      }
    }

    // 关键层提示
    if(floor === 3){
      setTimeout(function(){
        addMsg('<span style="color:#29d3b3">你的第一次选择——它将定义这次远征的方向。</span>');
      }, 800);
    }
    if(floor === 8){
      addMsg('<span style="color:#ffc266">⚡ 整备区 — 这是暴风雨前最后的宁静。</span>');
    }
    if(floor === 10){
      addMsg('<span style="color:#29d3b3;font-weight:bold">⚓ 锚点已设置 — 记忆在此凝固。</span>');
    }
    if(floor === 13){
      setTimeout(function(){
        addMsg('<span style="color:#b455ff;font-weight:bold">⬆ 力量激增 — 你感到某个阈值正在被突破。</span>');
      }, 500);
    }
    if(floor === 18){
      addMsg('<span style="color:#ffc266;font-weight:bold">⚡ 最终整备 — 之后不会再有休息的机会。</span>');
    }
    if(floor === 20){
      addMsg('<span style="color:#ff006e;font-weight:bold;text-shadow:0 0 8px rgba(255,0,110,0.5)">终局之门已开启。</span>');
    }

    // Boss 层提示
    if(floor % 5 === 0 && floor <= 20){
      var chapterNames = {5:'前厅守卫',10:'裂变领主',15:'深层核心',20:'终域之主'};
      var name = chapterNames[floor] || '';
      if(name){
        setTimeout(function(){
          addMsg('<span style="color:#ff4466;font-weight:bold;letter-spacing:1px">⚠ '+name+' 挡在前方</span>');
        }, 1200);
      }
    }
  },

  onPossess: function(target){
    this._possessCount++;
    var now = Date.now();
    var dur = (now - this._currentFormStart) / 1000;
    var curName = (typeof game !== 'undefined' && game.player) ? (game.player.name || '未知') : '未知';
    if(dur > this._longestForm.duration){
      this._longestForm = {name: curName, duration: dur};
    }
    this._formHistory.push(curName);
    this._currentFormStart = now;
  },

  showExpeditionResult: function(cause){
    var dur = (Date.now() - this._startTime) / 1000;
    var longestDur = Math.max(this._longestForm.duration, (Date.now() - this._currentFormStart) / 1000);
    var longestName = longestDur === this._longestForm.duration ? this._longestForm.name :
      (typeof game !== 'undefined' && game.player ? game.player.name : '未知');
    var reachedFloor = typeof game !== 'undefined' ? game.floor : 0;
    var killCount = typeof game !== 'undefined' ? (game._totalKills || 0) : 0;
    var playerClass = typeof game !== 'undefined' && game.player ? (game.player.playerClass || '') : '';
    var finalForm = typeof game !== 'undefined' && game.player ? game.player.name : '未知';
    var cleared = (reachedFloor >= 20);

    // 评分
    var score = this._possessCount * 12 + killCount * 5 + Math.floor(dur / 60) * 2 + reachedFloor * 15;
    if(cleared) score += 100;
    var rating = 'D', ratingColor = '#666';
    if(score >= 450){ rating='SSS'; ratingColor='#ff006e'; }
    else if(score >= 360){ rating='SS'; ratingColor='#b455ff'; }
    else if(score >= 260){ rating='S'; ratingColor='#ffd700'; }
    else if(score >= 190){ rating='A'; ratingColor='#29d3b3'; }
    else if(score >= 130){ rating='B'; ratingColor='#ff8c00'; }
    else if(score >= 70){ rating='C'; ratingColor='#aaa'; }

    this._lastRunData = {
      score:score, rating:rating, dur:dur, possessions:this._possessCount,
      kills:killCount, floor:reachedFloor, maxPollution:this._maxPollution,
      finalForm:finalForm, longestHost:longestName, longestDur:Math.floor(longestDur),
      cause:cause||'clear', playerClass:playerClass
    };

    // 元进度
    var echoGain = null;
    try{ if(window.MetaProgress) echoGain = MetaProgress.gainFromRun(this._lastRunData); }catch(e){}

    // 存档清理
    try{ if(typeof endRunSave === 'function') endRunSave('expedition'); }catch(e){}

    // 排行榜上传
    this._submitToLeaderboard();

    var accent = cleared ? '#29d3b3' : '#ff4466';
    var accentDim = cleared ? 'rgba(41,211,179,0.15)' : 'rgba(255,68,102,0.15)';
    var statusLabel = cleared ? '远征完成' : '远征终止';
    var statusIcon = cleared ? '⚔' : '💀';
    var quote = cleared
      ? t('你走过了二十层深渊，但深渊也走入了你。')
      : t('这条路还没有尽头。下一次，你会走得更远。');

    var lines = [
      {icon:'🏢', label:t('到达层数'), value: reachedFloor+'/20', highlight: reachedFloor >= 20},
      {icon:'🧬', label:t('附身次数'), value: String(this._possessCount), highlight: this._possessCount >= 6},
      {icon:'💀', label:t('击杀数'), value: String(killCount), highlight: killCount >= 15},
      {icon:'⏱', label:t('远征时长'), value: Math.floor(dur/60)+t('分')+Math.floor(dur%60)+t('秒'), highlight: dur <= 1800},
      {icon:'🏆', label:t('最久宿主'), value: longestName, sub: Math.floor(longestDur)+t('秒'), highlight: longestDur >= 180},
      {icon:'☢', label:t('最高污染'), value: this._maxPollution+'%', highlight: this._maxPollution >= 80, danger: true},
      {icon:'🧬', label:t('最终形态'), value: finalForm, highlight: false}
    ];

    // 构建结算 HTML
    var h = '';
    h += '<div style="position:relative;max-width:360px;width:92%;margin:0 auto">';
    h += '<div style="position:relative;z-index:2;background:linear-gradient(170deg,#0a0812 0%,#0d0a18 40%,#0a0812 100%);border-radius:12px;padding:0;overflow:hidden;box-shadow:0 0 30px '+accentDim+',inset 0 0 0 1px rgba(255,255,255,0.04)">';

    // 顶部装饰线
    h += '<div style="height:3px;background:linear-gradient(90deg,transparent,'+accent+',transparent)"></div>';

    // 标题
    h += '<div style="padding:20px 20px 0;text-align:center">';
    h += '<div style="font-family:monospace;font-size:10px;color:#444;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px">EXPEDITION · COMPLETE</div>';
    h += '<div style="font-size:24px;font-weight:900;color:'+accent+';letter-spacing:4px;line-height:1;text-shadow:0 0 20px '+accentDim+'">'+t('远征报告')+'</div>';
    h += '<div style="display:inline-block;margin-top:12px;padding:4px 16px;border:1px solid '+accent+';border-radius:20px;font-size:11px;color:'+accent+';letter-spacing:2px;background:'+accentDim+'">'+statusIcon+' '+t(statusLabel)+'</div>';
    h += '</div>';

    // 分隔
    h += '<div style="margin:16px 20px 0;height:1px;background:linear-gradient(90deg,transparent,#333,transparent)"></div>';

    // 评级
    var _stampSize = rating.length >= 3 ? 64 : rating.length >= 2 ? 60 : 56;
    var _stampFont = rating.length >= 3 ? 18 : rating.length >= 2 ? 22 : 28;
    h += '<div style="position:absolute;top:16px;right:16px;width:'+_stampSize+'px;height:'+_stampSize+'px;border:3px solid '+ratingColor+';border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:10">';
    h += '<div style="font-size:'+_stampFont+'px;font-weight:900;color:'+ratingColor+';font-family:serif;line-height:1">'+rating+'</div>';
    h += '</div>';

    // 数据行
    h += '<div style="padding:14px 20px 8px">';
    for(var i=0; i<lines.length; i++){
      var ln = lines[i];
      var valColor = ln.danger ? '#ff006e' : (ln.highlight ? accent : '#ddd');
      var iconBg = ln.danger ? 'rgba(255,0,110,0.12)' : (ln.highlight ? accentDim : 'rgba(255,255,255,0.04)');
      var iconBd = ln.danger ? 'rgba(255,0,110,0.35)' : (ln.highlight ? accent : 'rgba(255,255,255,0.06)');
      h += '<div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03)">';
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

    // 章节进度条
    h += '<div style="padding:10px 20px">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;margin-bottom:6px">CHAPTERS</div>';
    h += '<div style="display:flex;gap:3px;height:14px">';
    var chColors = ['#29d3b3','#ff8c00','#b455ff','#ff006e'];
    var chNames = [t('前厅'),t('裂变'),t('深层'),t('终域')];
    for(var ci=0;ci<4;ci++){
      var chStart = ci*5+1, chEnd = (ci+1)*5;
      var chReached = reachedFloor >= chEnd;
      var chPartial = !chReached && reachedFloor >= chStart;
      var bgc = chReached ? chColors[ci] : (chPartial ? chColors[ci] : '#1a1a2e');
      var op = chReached ? '1' : (chPartial ? '0.5' : '0.2');
      h += '<div style="flex:1;background:'+bgc+';border-radius:3px;opacity:'+op+';position:relative;overflow:hidden">';
      h += '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:7px;color:rgba(255,255,255,0.7);font-weight:bold">'+chNames[ci]+'</div>';
      h += '</div>';
    }
    h += '</div></div>';

    // 分隔
    h += '<div style="margin:0 20px;height:1px;background:linear-gradient(90deg,transparent,#333,transparent)"></div>';

    // 分数条
    h += '<div style="padding:12px 20px">';
    h += '<div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-bottom:4px"><span>SCORE</span><span style="color:'+ratingColor+';font-weight:bold">'+score+'</span></div>';
    h += '<div style="height:4px;background:#111;border-radius:2px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,score/3)+'%;background:linear-gradient(90deg,'+accent+','+ratingColor+');border-radius:2px;transition:width 1s ease-out"></div></div>';
    h += '</div>';

    // 残响
    if(echoGain && echoGain.earned > 0){
      h += '<div style="margin:0 20px;height:1px;background:linear-gradient(90deg,transparent,#333,transparent)"></div>';
      h += '<div style="padding:12px 20px 8px">';
      h += '<div style="position:relative;background:linear-gradient(135deg,rgba(165,92,255,0.10),rgba(53,224,255,0.04));border:1px solid rgba(165,92,255,0.35);border-radius:8px;padding:10px 14px">';
      h += '<div style="display:flex;align-items:center;gap:8px">';
      h += '<span style="font-size:11px;background:rgba(165,92,255,0.15);border:1px solid rgba(165,92,255,0.5);border-radius:50%;width:22px;height:22px;line-height:20px;text-align:center;color:#cdb6ff">⛯</span>';
      h += '<span style="font-size:10px;color:#a78bd8;letter-spacing:3px;font-family:monospace;flex:1">'+t('ECHO · 残响')+'</span>';
      h += '<span style="font-size:20px;font-weight:900;color:#cdb6ff;text-shadow:0 0 12px rgba(165,92,255,0.6);font-family:monospace">+'+echoGain.earned+'</span>';
      h += '</div></div></div>';
    }

    // 引言
    h += '<div style="padding:12px 24px 16px;text-align:center">';
    h += '<div style="color:#444;font-size:10px;font-style:italic;line-height:1.6;letter-spacing:1px">"'+quote+'"</div>';
    h += '</div>';

    // 按钮
    h += '<div style="padding:0 16px 20px;display:flex;gap:8px;justify-content:center">';
    h += '<button onclick="ExpeditionMode.restartExpedition()" style="flex:1;padding:12px 4px;background:linear-gradient(135deg,'+accentDim+',transparent);border:1px solid '+accent+';color:'+accent+';border-radius:6px;cursor:pointer;font-family:monospace;font-size:13px;font-weight:bold;letter-spacing:1px">'+t('再来一次')+'</button>';
    h += '<button onclick="ExpeditionMode.shareResult()" style="flex:1;padding:12px 4px;background:transparent;border:1px solid #29d3b3;color:#29d3b3;border-radius:6px;cursor:pointer;font-family:monospace;font-size:12px;font-weight:bold">'+t('📷 海报')+'</button>';
    h += '<button onclick="ExpeditionMode.backToTitle()" style="flex:1;padding:12px 4px;background:transparent;border:1px solid #333;color:#555;border-radius:6px;cursor:pointer;font-family:monospace;font-size:12px">'+t('返回主页')+'</button>';
    h += '</div>';

    // 底部装饰线
    h += '<div style="height:3px;background:linear-gradient(90deg,transparent,'+accent+',transparent)"></div>';
    h += '</div></div>';

    // 显示到 event-overlay
    try{ if(window.game) game._endScreenActive = true; }catch(e){}
    var ev = document.getElementById('event-overlay');
    if(ev){
      ev.style.display = 'flex';
      document.getElementById('event-title').textContent = '';
      document.getElementById('event-text').innerHTML = h;
      document.getElementById('event-choices').innerHTML = '';
    }
  },

  restartExpedition: function(){
    try{ if(typeof game!=='undefined') game._endScreenActive=false; }catch(e){}
    try{ closeEvent(); }catch(e){}
    try{
      localStorage.removeItem('pt_save');
      localStorage.removeItem('pt_save_expedition');
      localStorage.removeItem('parasiteTowerSave');
    }catch(e){}
    try{ localStorage.setItem('pt_mode','expedition'); }catch(e){}
    if(typeof confirmModeAndContinue==='function'){
      window._selectedMode='expedition';
      if(window.GameModes) GameModes.select('expedition');
      try{
        var ss=document.getElementById('start-screen'); if(ss) ss.style.display='none';
        var ms=document.getElementById('mode-screen'); if(ms) ms.style.display='none';
        var gs=document.getElementById('game-screen'); if(gs) gs.classList.remove('active');
      }catch(e){}
      confirmModeAndContinue();
    }else{
      location.reload();
    }
  },

  backToTitle: function(){
    try{ if(typeof game!=='undefined') game._endScreenActive=false; }catch(e){}
    try{ closeEvent(); }catch(e){}
    if(typeof backToTitle === 'function') backToTitle();
  },

  shareResult: function(){
    var d = this._lastRunData;
    if(!d) return;
    if(typeof shareShortRunPoster==='function'){
      shareShortRunPoster(d);
    } else if(typeof copyTextToClipboard==='function'){
      var mm = Math.floor(d.dur/60), ss = Math.floor(d.dur%60);
      var text = '⚔ 你也是我 · 远征报告\n'
        + '━━━━━━━━━━━━━━━\n'
        + '📊 评级: '+d.rating+' | 分数: '+d.score+'\n'
        + '🏢 '+d.floor+'/20层 | 🧬 附身'+d.possessions+' | 💀 击杀'+d.kills+'\n'
        + '⏱ '+mm+':'+(ss<10?'0':'')+ss+' | ☢ 污染'+d.maxPollution+'%\n'
        + '#你也是我 #YouAreMe #远征';
      copyTextToClipboard(text, t('战绩已复制'));
    }
  },

  _submitToLeaderboard: function(){
    var d = this._lastRunData;
    if(!d) return;
    try{
      if(window.PT_API && window.PT_IDENTITY && window.PT_IDENTITY.hasNickname()){
        window.PT_API.submit({
          uid: window.PT_IDENTITY.getUID(),
          nickname: window.PT_IDENTITY.getNickname(),
          modeId: 'expedition',
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
          clientVer: (window.PT_VERSION||''),
          metaTier: (window.MetaProgress ? MetaProgress.metaTier() : 0)
        }).catch(function(){});
      }
    }catch(e){}
  }
};

window.GameModes.list.push({
  id: 'expedition',
  name: '远征',
  desc: '20 层推进 · 25-40 分钟 · 章节成长',
  duration: '~30分钟',
  config: {
    modeId: 'expedition',
    modeName: '远征',
    floorCap: 20,
    hpMult: 0.9,
    pollutionRate: 0.85,
    slotCap: 3,
    xpMult: 1.2,
    timeLimit: 0,
    hooks: {
      onModeStart: function(){
        if(window.ExpeditionMode) ExpeditionMode.init();
      },
      onFloorEnter: function(f){
        if(window.ExpeditionMode) ExpeditionMode.onFloorEnter(f);
      },
      onTick: function(){
        if(typeof game!=='undefined' && game.player && window.ExpeditionMode){
          ExpeditionMode._maxPollution = Math.max(ExpeditionMode._maxPollution, game.player.pollution||0);
        }
      },
      onPossess: function(t){
        if(window.ExpeditionMode) ExpeditionMode.onPossess(t);
      }
    }
  }
});
