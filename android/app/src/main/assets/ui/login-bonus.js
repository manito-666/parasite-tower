// ================================================================
// 每日登录奖励 — 3x3 九宫格
// 依赖 systems/meta-progress.js
// ================================================================
(function(){
  function _ensureOverlay(){
    var ov = document.getElementById('login-bonus-overlay');
    if(ov) return ov;
    ov = document.createElement('div');
    ov.id = 'login-bonus-overlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:660;align-items:center;justify-content:center;padding:12px';
    ov.innerHTML =
      '<div style="width:100%;max-width:420px;background:#0a0612;border:1px solid #5a3a8a;border-radius:8px;overflow:hidden;color:#ddd;font-family:Consolas,monospace">'+
        '<div style="padding:10px 12px;background:linear-gradient(180deg,#1a0a2a,#0a0612);border-bottom:1px solid #5a3a8a;display:flex;align-items:center;gap:10px">'+
          '<span style="font-size:1.2em;color:#a55cff">🎁</span>'+
          '<span style="font-size:1em;color:#cdb6ff;font-weight:bold">每日登录奖励</span>'+
          '<span id="lb-streak-info" style="margin-left:auto;color:#a55cff;font-size:.85em"></span>'+
          '<button onclick="closeLoginBonus()" style="background:none;border:1px solid #4a3a6a;color:#cdb6ff;padding:3px 10px;border-radius:4px;cursor:pointer">关闭</button>'+
        '</div>'+
        '<div id="lb-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px"></div>'+
        '<div id="lb-footer" style="border-top:1px solid #2a1a3a;padding:10px;text-align:center;background:#080410"></div>'+
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target===ov) closeLoginBonus(); });
    return ov;
  }

  function showLoginBonus(){
    if(!window.MetaProgress){ try{ alert('元进度系统未加载'); }catch(e){} return; }
    _ensureOverlay().style.display = 'flex';
    _render();
  }
  function closeLoginBonus(){
    var ov = document.getElementById('login-bonus-overlay');
    if(ov) ov.style.display = 'none';
    updateLoginBonusBadge();
  }

  function _render(){
    var m = window.MetaProgress.get();
    var today = new Date().toISOString().slice(0,10);
    var streak = m.loginStreak || 0;
    var claimedToday = (m.lastClaim === today);
    // 当前周期：把 streak 映射到 1..9 循环
    var cycleDay = streak === 0 ? 1 : ((streak - 1) % 9) + 1;
    // 信息栏
    var info = document.getElementById('lb-streak-info');
    if(info) info.textContent = '连续 '+streak+' 天';
    // 9 宫格
    var grid = document.getElementById('lb-grid');
    var html = '';
    for(var i=1;i<=9;i++){
      var bonus = window.MetaProgress.loginBonusOf(i);
      var isToday = (i === cycleDay);
      var isPast = (i < cycleDay) || (isToday && claimedToday);
      var bg, border, fg, badge;
      if(isToday && !claimedToday){
        bg='linear-gradient(180deg,#2a1850,#1a0a2a)'; border='#a55cff'; fg='#fff'; badge='今日';
      }else if(isToday && claimedToday){
        bg='#0a1a10'; border='#1ed8b0'; fg='#1ed8b0'; badge='✅ 已领';
      }else if(isPast){
        bg='#0a0612'; border='#3a2a5a'; fg='#666'; badge='✅';
      }else{
        bg='#0a0612'; border='#2a1a3a'; fg='#888'; badge='Day '+i;
      }
      html += '<div style="background:'+bg+';border:1px solid '+border+';border-radius:6px;padding:10px 4px;text-align:center;color:'+fg+';min-height:70px;display:flex;flex-direction:column;justify-content:center;'+
        (isToday && !claimedToday ? 'box-shadow:0 0 12px rgba(165,92,255,.4);' : '')+'">'+
        '<div style="font-size:.7em;opacity:.85;margin-bottom:4px">'+badge+'</div>'+
        '<div style="font-size:1em;font-weight:bold">⛯ '+bonus+'</div>'+
        '<div style="font-size:.65em;opacity:.7;margin-top:2px">第 '+i+' 天</div>'+
        '</div>';
    }
    grid.innerHTML = html;
    // 底部按钮
    var foot = document.getElementById('lb-footer');
    if(claimedToday){
      foot.innerHTML = '<div style="color:#1ed8b0;font-size:.85em">✅ 今日奖励已领取，明天再来</div>';
    }else{
      var todayBonus = window.MetaProgress.loginBonusOf(cycleDay);
      foot.innerHTML = '<button id="lb-claim-btn" onclick="_lbClaim()" style="background:#a55cff;color:#fff;border:none;padding:9px 22px;border-radius:5px;cursor:pointer;font-family:Consolas,monospace;font-size:.9em;font-weight:bold">'+
        '🎁 领取今日 '+todayBonus+' 残响</button>';
    }
  }

  window._lbClaim = function(){
    var res = window.MetaProgress.claimDailyLogin();
    if(!res.ok){ try{ if(window.addMsg) addMsg('⚠ '+res.reason); }catch(e){} return; }
    // 飘字反馈
    try{
      var btn = document.getElementById('lb-claim-btn');
      if(btn){
        var pop = document.createElement('div');
        pop.textContent = '+'+res.bonus+' 残响';
        pop.style.cssText='position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);color:#cdb6ff;font-size:1.6em;font-weight:bold;z-index:670;text-shadow:0 0 12px rgba(165,92,255,.8);transition:all .9s ease-out;pointer-events:none';
        document.body.appendChild(pop);
        requestAnimationFrame(function(){ pop.style.top='30%'; pop.style.opacity='0'; });
        setTimeout(function(){ if(pop.parentNode) pop.remove(); }, 1000);
      }
    }catch(e){}
    try{ if(typeof playChord==='function') playChord([523.25,659.25,783.99],0.3); }catch(e){}
    _render();
    // 同步主菜单徽章
    try{
      var b = document.getElementById('ss-nav-altar-badge');
      if(b) b.textContent = '['+res.total+']';
    }catch(e){}
    updateLoginBonusBadge();
  };

  // 主菜单按钮的红点
  function updateLoginBonusBadge(){
    var dot = document.getElementById('ss-login-bonus-dot');
    if(!dot) return;
    var canClaim = false;
    try{ canClaim = window.MetaProgress && window.MetaProgress.canClaimLogin(); }catch(e){}
    dot.style.display = canClaim ? '' : 'none';
  }

  window.showLoginBonus = showLoginBonus;
  window.closeLoginBonus = closeLoginBonus;
  window.updateLoginBonusBadge = updateLoginBonusBadge;
})();
