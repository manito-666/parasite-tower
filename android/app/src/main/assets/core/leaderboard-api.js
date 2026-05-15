// 全网排行榜 API 封装
(function(){
  var DEFAULT_BASE = 'http://10.0.2.2:8080';
  function getBase(){
    if(typeof window.PT_API_BASE === 'string' && window.PT_API_BASE) return window.PT_API_BASE.replace(/\/+$/,'');
    return DEFAULT_BASE;
  }
  function withTimeout(p, ms){
    return new Promise(function(resolve, reject){
      var t = setTimeout(function(){ reject(new Error('timeout')); }, ms);
      p.then(function(v){ clearTimeout(t); resolve(v); }, function(e){ clearTimeout(t); reject(e); });
    });
  }
  function jget(path){
    return withTimeout(fetch(getBase()+path, { method:'GET' }).then(function(r){
      if(!r.ok) throw new Error('http '+r.status); return r.json();
    }), 6000);
  }
  function jpost(path, body){
    return withTimeout(fetch(getBase()+path, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body||{})
    }).then(function(r){
      if(!r.ok) throw new Error('http '+r.status); return r.json();
    }), 6000);
  }
  window.PT_API = {
    getBase: getBase,
    submit: function(run){ return jpost('/api/v1/runs', run); },
    fetchBoard: function(params){
      params = params || {};
      var qs = Object.keys(params).filter(function(k){ return params[k]!==undefined && params[k]!==null && params[k]!==''; })
        .map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(params[k]); }).join('&');
      return jget('/api/v1/leaderboard'+(qs?('?'+qs):''));
    },
    fetchMe: function(uid){ return jget('/api/v1/me?uid='+encodeURIComponent(uid)); },
    reportCrash: function(payload){ return jpost('/api/v1/crash', payload); },
    // 昵称：检查可用（200 始终返回 {available, reason?}）
    checkNickname: function(name, uid){
      var qs = '?name='+encodeURIComponent(name||'')+(uid?'&uid='+encodeURIComponent(uid):'');
      return jget('/api/v1/nickname/check'+qs);
    },
    // 昵称：占用/改名。返回 {ok:true} 或 {ok:false, reason:'taken'|'length'|...}
    claimNickname: function(uid, name){
      return withTimeout(fetch(getBase()+'/api/v1/nickname/claim', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ uid:uid, nickname:name })
      }).then(function(r){
        return r.json().then(function(j){
          if(r.status===200) return { ok:true, nickname:j.nickname };
          return { ok:false, reason:(j&&j.error)||('http '+r.status) };
        });
      }), 6000);
    }
  };

  // 全局崩溃捕获：window.onerror + unhandledrejection，节流去重避免刷库
  var _sent = {};            // key=msg+source -> ts
  var _hourCount = 0;        // 每小时上报上限
  var _hourStart = Date.now();
  function _shouldSend(key){
    var now = Date.now();
    if(now-_hourStart > 3600000){ _hourStart=now; _hourCount=0; }
    if(_hourCount >= 30) return false;
    var last = _sent[key]||0;
    if(now-last < 30000) return false; // 30秒内同一错误只报一次
    _sent[key]=now;
    _hourCount++;
    return true;
  }
  function _basePayload(){
    var id = window.PT_IDENTITY || {};
    var g = (typeof game!=='undefined' && game) ? game : null;
    return {
      uid: id.getUID ? id.getUID() : '',
      nickname: id.getNickname ? id.getNickname() : '',
      clientVer: window.PT_VERSION || '',
      platform: 'android-webview',
      ua: (navigator&&navigator.userAgent)||'',
      url: location ? location.href : '',
      floor: g ? (g.floor|0) : 0,
      playerClass: (g&&g.player) ? (g.player.playerClass||'') : ''
    };
  }
  function reportError(message, source, stack){
    try{
      var key = (message||'')+'|'+(source||'');
      if(!_shouldSend(key)) return;
      var p = _basePayload();
      p.message = String(message||'').slice(0,1000);
      p.stack = String(stack||'').slice(0,8000);
      p.source = String(source||'').slice(0,500);
      window.PT_API.reportCrash(p).catch(function(){});
    }catch(e){}
  }
  window.addEventListener('error', function(e){
    if(!e) return;
    var msg = e.message || (e.error && e.error.message) || 'error';
    var src = (e.filename||'')+':'+(e.lineno||0)+':'+(e.colno||0);
    var stk = (e.error && e.error.stack) ? e.error.stack : '';
    reportError(msg, src, stk);
  });
  window.addEventListener('unhandledrejection', function(e){
    if(!e) return;
    var r = e.reason;
    var msg = (r && (r.message||r.toString())) || 'unhandledrejection';
    var stk = (r && r.stack) ? r.stack : '';
    reportError(msg, 'promise', stk);
  });
  window.PT_REPORT_CRASH = reportError; // 暴露给 try/catch 主动上报
})();
