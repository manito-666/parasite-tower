// 昵称输入弹窗
(function(){
  function showNicknameModal(opts){
    opts = opts || {};
    var first = !!opts.firstTime;
    var current = window.PT_IDENTITY ? window.PT_IDENTITY.getNickname() : '';
    var ev = document.getElementById('event-overlay');
    if(!ev){ if(opts.onDone) opts.onDone(); return; }
    document.getElementById('event-title').innerHTML = '👋 <span style="color:#35E0FF">'+(first?'你叫什么名字？':'换个名字')+'</span>';
    var hint = first
      ? '在塔里行走的人，总得有个能被记住的名字。<br>它会出现在排行榜上，让别人知道是你爬上来的。'
      : '新名字会跟着你之后的每一次攀登。';
    var html =
      '<div style="color:#9CB6D9;font-size:12.5px;line-height:1.7;letter-spacing:.5px;margin-bottom:14px">'+hint+'</div>'+
      '<input id="pt-nick-input" type="text" maxlength="24" value="'+(current||'').replace(/"/g,'&quot;')+'" placeholder="你的游戏昵称（2-12 个字）" '+
      'style="width:100%;box-sizing:border-box;padding:11px 14px;background:rgba(8,10,18,.65);border:1px solid rgba(53,224,255,.32);border-radius:6px;color:#F4FBFF;font-family:inherit;font-size:14px;letter-spacing:1.2px;outline:none">'+
      '<div id="pt-nick-status" style="min-height:18px;margin-top:8px;font-size:11.5px;letter-spacing:.5px"></div>';
    document.getElementById('event-text').innerHTML = html;
    var choices = document.getElementById('event-choices');
    choices.innerHTML = '';
    var ok = document.createElement('button');
    ok.className = 'btn'; ok.textContent = '确定';

    var statusEl = function(){ return document.getElementById('pt-nick-status'); };
    var setStatus = function(text, color){ var s=statusEl(); if(s){ s.textContent=text; s.style.color=color||'#ff8aa0'; } };
    var setOkDisabled = function(d){ ok.disabled = !!d; ok.style.opacity = d?'0.5':'1'; ok.style.cursor = d?'not-allowed':'pointer'; };

    var _checkTimer = null;
    var _checkSeq = 0;
    var _lastChecked = ''; // 已确认可用的名字（避免重复校验）
    function debounceCheck(){
      var inp = document.getElementById('pt-nick-input');
      var v = (inp && inp.value) || '';
      var r = window.PT_IDENTITY.validateNickname(v);
      if(!r.ok){ setStatus(r.reason, '#ff8aa0'); setOkDisabled(true); return; }
      // 昵称查重已临时关闭：仅做本地格式校验
      setStatus('✓ 可用', '#7CCD7C');
      setOkDisabled(false);
    }

    ok.onclick = function(){
      var inp = document.getElementById('pt-nick-input');
      var v = (inp && inp.value) || '';
      var r = window.PT_IDENTITY.validateNickname(v);
      if(!r.ok){ setStatus(r.reason, '#ff8aa0'); return; }
      // 与已有昵称一致：无需 claim
      if(r.value === current){
        window.PT_IDENTITY.setNickname(r.value);
        window._nicknameModalLocked=false;
        try{ closeEvent(); }catch(e){ ev.style.display='none'; }
        if(opts.onDone) opts.onDone(r.value);
        return;
      }
      setStatus('占用中…', '#7E86A3'); setOkDisabled(true);
      var uid = window.PT_IDENTITY.getUID();
      var doSave = function(){
        window.PT_IDENTITY.setNickname(r.value);
        window._nicknameModalLocked=false;
        try{ closeEvent(); }catch(e){ ev.style.display='none'; }
        if(opts.onDone) opts.onDone(r.value);
      };
      // 昵称占用检查已临时关闭：直接本地保存
      doSave();
    };
    choices.appendChild(ok);
    if(!first){
      var cancel = document.createElement('button');
      cancel.className = 'btn btn-secondary'; cancel.textContent = '取消';
      cancel.onclick = function(){ try{ closeEvent(); }catch(e){ ev.style.display='none'; } if(opts.onCancel) opts.onCancel(); };
      choices.appendChild(cancel);
    }
    ev.style.zIndex = '600';
    ev.style.display = 'flex';
    if(first){ window._nicknameModalLocked = true; }
    setTimeout(function(){
      var inp=document.getElementById('pt-nick-input');
      if(inp){
        try{ inp.focus(); inp.select(); }catch(e){}
        inp.addEventListener('input', debounceCheck);
      }
      debounceCheck();
    }, 80);
  }
  window.ensureNickname = function(cb){
    if(!window.PT_IDENTITY){ if(cb) cb(); return; }
    if(window.PT_IDENTITY.hasNickname()){ if(cb) cb(); return; }
    showNicknameModal({ firstTime:true, onDone:function(){ if(cb) cb(); } });
  };
  window.editNickname = function(){ showNicknameModal({ firstTime:false }); };
})();
