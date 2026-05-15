// 玩家身份：设备 UUID + 昵称
(function(){
  var KEY_UID = 'pt_uid';
  var KEY_NICK = 'pt_nickname';
  function genUID(){
    return 'pt_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
  }
  window.PT_IDENTITY = {
    getUID: function(){
      try{
        var u = localStorage.getItem(KEY_UID);
        if(!u){ u = genUID(); localStorage.setItem(KEY_UID, u); }
        return u;
      }catch(e){ return genUID(); }
    },
    getNickname: function(){
      try{ return localStorage.getItem(KEY_NICK) || ''; }catch(e){ return ''; }
    },
    setNickname: function(n){
      try{ localStorage.setItem(KEY_NICK, n); }catch(e){}
    },
    hasNickname: function(){
      try{ return !!localStorage.getItem(KEY_NICK); }catch(e){ return false; }
    },
    validateNickname: function(n){
      n = (n||'').trim();
      var len = [].concat.apply([], [].slice.call(n)).length; // approx rune count
      try{ len = Array.from(n).length; }catch(e){}
      if(len < 2 || len > 12) return { ok:false, reason:'昵称长度需 2-12 字' };
      if(/[<>'"&]/.test(n)) return { ok:false, reason:'昵称含非法字符' };
      return { ok:true, value:n };
    }
  };
})();
