// ================================================================
// 残响圣坛 UI — 节点解锁树
// 依赖 systems/meta-progress.js
// ================================================================
(function(){
  var _selectedClass = 'swarm';

  // 职业图标 + 主色（与 class-select 风格一致，避免依赖 classColors 加载顺序）
  var CLASS_META = {
    swarm: { icon:'🦠', name:'虫群', color:'#44aa44' },
    titan: { icon:'🪨', name:'泰坦', color:'#7a8e9e' },
    ghost: { icon:'👻', name:'幽灵', color:'#aa44aa' },
    blood: { icon:'🩸', name:'血族', color:'#cc2244' },
    mech:  { icon:'🤖', name:'机甲', color:'#5599ff' }
  };

  // 节点结构（与 meta-progress.js 中的命名一致）
  // 每个职业 6 个节点：T1×2、T2×2、T3×2
  var TIER_STRUCT = {
    1: ['t1_hp','t1_atk'],
    2: ['t2_evo','t2_word'],
    3: ['t3_sig','t3_form']
  };

  function _safeGetMeta(){
    try{ return window.MetaProgress.get(); }catch(e){ return null; }
  }

  function _ensureOverlay(){
    var ov = document.getElementById('echo-altar-overlay');
    if(ov) return ov;
    ov = document.createElement('div');
    ov.id = 'echo-altar-overlay';
    ov.className = 'event-overlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:650;align-items:center;justify-content:center;padding:12px';
    ov.innerHTML =
      '<div id="echo-altar-box" style="width:100%;max-width:520px;max-height:92vh;background:#0a0612;border:1px solid #5a3a8a;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;color:#ddd;font-family:Consolas,monospace">'+
        '<div style="padding:10px 12px;background:linear-gradient(180deg,#1a0a2a,#0a0612);border-bottom:1px solid #5a3a8a;display:flex;align-items:center;gap:10px">'+
          '<span style="font-size:1.2em;color:#a55cff">⛯</span>'+
          '<span style="font-size:1em;color:#cdb6ff;font-weight:bold">残响圣坛</span>'+
          '<span id="ea-echoes" style="margin-left:auto;color:#a55cff;font-size:.95em"></span>'+
          '<button onclick="closeEchoAltar()" style="background:none;border:1px solid #4a3a6a;color:#cdb6ff;padding:3px 10px;border-radius:4px;cursor:pointer">关闭</button>'+
        '</div>'+
        '<div id="ea-tabs" style="display:flex;border-bottom:1px solid #2a1a3a;background:#06040a"></div>'+
        '<div id="ea-tree" style="flex:1;overflow-y:auto;padding:10px"></div>'+
        '<div id="ea-detail" style="border-top:1px solid #2a1a3a;padding:10px;min-height:90px;background:#080410"></div>'+
      '</div>';
    document.body.appendChild(ov);
    // 点击空白关闭
    ov.addEventListener('click', function(e){ if(e.target===ov) closeEchoAltar(); });
    return ov;
  }

  function showEchoAltar(){
    if(!window.MetaProgress){ try{ alert('元进度系统未加载'); }catch(e){} return; }
    var ov = _ensureOverlay();
    ov.style.display = 'flex';
    _renderTabs();
    selectAltarClass(_selectedClass);
  }
  function closeEchoAltar(){
    var ov = document.getElementById('echo-altar-overlay');
    if(ov) ov.style.display = 'none';
  }

  function _renderTabs(){
    var el = document.getElementById('ea-tabs');
    if(!el) return;
    var html = '';
    window.MetaProgress.CLASSES.forEach(function(c){
      var meta = CLASS_META[c];
      var active = c === _selectedClass;
      html += '<button onclick="selectAltarClass(\''+c+'\')" '+
        'style="flex:1;padding:8px 4px;background:'+(active?meta.color+'22':'transparent')+';'+
        'border:none;border-bottom:2px solid '+(active?meta.color:'transparent')+';'+
        'color:'+(active?meta.color:'#888')+';cursor:pointer;font-family:Consolas,monospace;font-size:.85em">'+
        meta.icon+' '+meta.name+'</button>';
    });
    el.innerHTML = html;
  }

  function selectAltarClass(cls){
    _selectedClass = cls;
    _renderTabs();
    _renderHeader();
    _renderTree(cls);
    _renderDetail(cls, null);
  }

  function _renderHeader(){
    var m = _safeGetMeta();
    var el = document.getElementById('ea-echoes');
    if(!el || !m) return;
    el.textContent = '残响 '+m.echoes+' / 累计 '+m.echoTotal;
  }

  function _nodeState(cls, nodeId, m){
    if(!m) return 'locked';
    var unlocked = m.unlocked[cls] || [];
    if(unlocked.indexOf(nodeId) >= 0) return 'unlocked';
    var def = window.MetaNodes[cls+'_'+nodeId];
    if(!def) return 'locked';
    if(!def.prereq || def.prereq.length===0){
      return m.echoes >= def.cost ? 'available' : 'locked-cost';
    }
    var have = def.prereq.filter(function(p){ return unlocked.indexOf(p) >= 0; });
    var ok = (def.req||'all') === 'any' ? have.length > 0 : have.length === def.prereq.length;
    if(!ok) return 'locked-prereq';
    return m.echoes >= def.cost ? 'available' : 'locked-cost';
  }

  function _renderTree(cls){
    var el = document.getElementById('ea-tree');
    if(!el) return;
    var m = _safeGetMeta();
    var meta = CLASS_META[cls];
    var html = '';
    [3,2,1].forEach(function(tier){
      html += '<div style="margin-bottom:14px">';
      html += '<div style="font-size:.7em;color:#666;margin-bottom:5px;letter-spacing:1px">T'+tier+(tier===3?' · 终极':tier===2?' · 进阶':' · 基础')+'</div>';
      html += '<div style="display:flex;gap:8px">';
      TIER_STRUCT[tier].forEach(function(nodeId){
        var def = window.MetaNodes[cls+'_'+nodeId];
        if(!def){ html += '<div style="flex:1"></div>'; return; }
        var state = _nodeState(cls, nodeId, m);
        var bg, border, fg, badge='';
        if(state==='unlocked'){ bg=meta.color+'33'; border=meta.color; fg='#fff'; badge='✓'; }
        else if(state==='available'){ bg='#1a0a2a'; border='#a55cff'; fg='#cdb6ff'; badge='⛯ '+def.cost; }
        else if(state==='locked-cost'){ bg='#0a0612'; border='#3a2a5a'; fg='#888'; badge='⛯ '+def.cost; }
        else if(state==='locked-prereq'){ bg='#0a0612'; border='#2a1a3a'; fg='#555'; badge='🔒'; }
        else { bg='#0a0612'; border='#2a1a3a'; fg='#555'; badge='🔒'; }
        html += '<button onclick="_eaSelectNode(\''+cls+'\',\''+nodeId+'\')" '+
          'style="flex:1;padding:8px 6px;background:'+bg+';border:1px solid '+border+';'+
          'color:'+fg+';border-radius:5px;cursor:pointer;font-family:Consolas,monospace;'+
          'text-align:left;line-height:1.3;min-height:50px">'+
          '<div style="font-size:.78em;font-weight:bold">'+def.name+'</div>'+
          '<div style="font-size:.65em;margin-top:3px;opacity:.85">'+badge+'</div>'+
          '</button>';
      });
      html += '</div>';
      // 连接提示
      if(tier===3) html += '<div style="text-align:center;color:#3a2a5a;font-size:.7em;margin-top:3px">↑ 需 T2 全部</div>';
      else if(tier===2) html += '<div style="text-align:center;color:#3a2a5a;font-size:.7em;margin-top:3px">↑ 需 T1 任一</div>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  function _renderDetail(cls, nodeId){
    var el = document.getElementById('ea-detail');
    if(!el) return;
    if(!nodeId){
      el.innerHTML = '<div style="color:#666;font-size:.8em;text-align:center;padding-top:20px">点击节点查看详情</div>';
      return;
    }
    var def = window.MetaNodes[cls+'_'+nodeId];
    if(!def){ el.innerHTML = '<div style="color:#f66">未知节点</div>'; return; }
    var m = _safeGetMeta();
    var state = _nodeState(cls, nodeId, m);
    var meta = CLASS_META[cls];
    var html = '';
    html += '<div style="font-size:.95em;color:'+meta.color+';font-weight:bold;margin-bottom:4px">'+def.name+'</div>';
    html += '<div style="font-size:.78em;color:#bbb;margin-bottom:8px">'+def.desc+'</div>';
    if(state==='unlocked'){
      html += '<div style="color:#1ed8b0;font-size:.8em">✓ 已解锁 — 该职业开局自动生效</div>';
    }else if(state==='available'){
      html += '<button onclick="_eaUnlockNode(\''+cls+'\',\''+nodeId+'\')" '+
        'style="background:#a55cff;color:#fff;border:none;padding:8px 18px;border-radius:5px;cursor:pointer;font-family:Consolas,monospace;font-size:.85em">'+
        '⛯ 解锁（'+def.cost+' 残响）</button>';
    }else if(state==='locked-cost'){
      html += '<div style="color:#f80;font-size:.8em">⛯ 残响不足（需 '+def.cost+'，当前 '+(m?m.echoes:0)+'）</div>';
    }else{
      var preNames = (def.prereq||[]).map(function(p){
        var d = window.MetaNodes[cls+'_'+p]; return d?d.name:p;
      }).join((def.req||'all')==='any'?' 或 ':' + ');
      html += '<div style="color:#888;font-size:.8em">🔒 需先解锁前置：'+preNames+'</div>';
    }
    el.innerHTML = html;
  }

  // 全局回调
  window._eaSelectNode = function(cls, nodeId){
    _renderDetail(cls, nodeId);
  };
  window._eaUnlockNode = function(cls, nodeId){
    var res = window.MetaProgress.unlock(cls, nodeId);
    if(!res.ok){ try{ if(window.addMsg) addMsg('⚠ '+res.reason); }catch(e){} return; }
    // 刷新 UI
    _renderHeader();
    _renderTree(cls);
    _renderDetail(cls, nodeId);
    // 更新主菜单徽章
    try{
      var b = document.getElementById('ss-nav-altar-badge');
      if(b) b.textContent = '['+res.remaining+']';
    }catch(e){}
    // 解锁反馈音
    try{ if(typeof playChord==='function') playChord([523.25,659.25,783.99],0.35); }catch(e){}
  };

  window.showEchoAltar = showEchoAltar;
  window.closeEchoAltar = closeEchoAltar;
  window.selectAltarClass = selectAltarClass;
})();
