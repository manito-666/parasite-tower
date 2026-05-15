// ================================================================
// 元进度系统 — 残响 (Echo) + 解锁树 + 起始增益
// 数据持久化在 localStorage.pt_meta，规则全部在 JS（前端权威）
// ================================================================
(function(){
  var STORAGE_KEY = 'pt_meta';
  var SCHEMA_V = 1;
  var CLASSES = ['swarm','titan','ghost','blood','mech'];

  // ============================================================
  // 节点定义表
  // 命名: <class>_<tier>_<key>
  // tier1 cost=30, tier2=80, tier3=200
  // T2 需要同 tier1 任一节点 (req:'any')
  // T3 需要同 tier2 全部节点 (req:'all')
  // ============================================================
  var MetaNodes = {
    // ========== 虫群 swarm ==========
    swarm_t1_hp:   { tier:1, cost:30,  prereq:[],                     name:'胞壁强化',   desc:'起始 HP +6',     apply:function(p){ p.maxHp+=6; p.hp+=6; } },
    swarm_t1_atk:  { tier:1, cost:30,  prereq:[],                     name:'虫颚锐化',   desc:'起始 ATK +1',    apply:function(p){ p.atk+=1; } },
    swarm_t2_evo:  { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'母体觉醒', desc:'开局 +1 进化点', apply:function(p){ p.evoPoints=(p.evoPoints||0)+1; } },
    swarm_t2_word: { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'孕巢词条', desc:'起始 HP +8、ATK +1', apply:function(p,m){ p._metaWord_swarmResonance=true; p.maxHp+=8; p.hp+=8; p.atk+=1; } },
    swarm_t3_sig:  { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'母体共振', desc:'起始 HP +12、ATK +2', apply:function(p){ p._metaSig_swarmRevive=true; p.maxHp+=12; p.hp+=12; p.atk+=2; } },
    swarm_t3_form: { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'虫群王起源', desc:'开局 +1 起始分身（共 2 只）', apply:function(p){ p._metaForm_swarmKing=true; } },

    // ========== 泰坦 titan ==========
    titan_t1_hp:   { tier:1, cost:30,  prereq:[],                     name:'石化强化',   desc:'起始装甲 +20',   apply:function(p){ p.armor=(p.armor||0)+20; } },
    titan_t1_atk:  { tier:1, cost:30,  prereq:[],                     name:'重击姿态',   desc:'起始 ATK +1',    apply:function(p){ p.atk+=1; } },
    titan_t2_evo:  { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'地脉觉醒', desc:'开局 +1 进化点', apply:function(p){ p.evoPoints=(p.evoPoints||0)+1; } },
    titan_t2_word: { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'刚毅词条', desc:'起始装甲 +30、HP +5', apply:function(p){ p._metaWord_titanArmor=true; p.armor=(p.armor||0)+30; p.maxHp+=5; p.hp+=5; } },
    titan_t3_sig:  { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'装甲反弹', desc:'起始装甲 +50、HP +10', apply:function(p){ p._metaSig_titanReflect=true; p.armor=(p.armor||0)+50; p.maxHp+=10; p.hp+=10; } },
    titan_t3_form: { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'重装步兵', desc:'起始 HP +10、装甲 +20', apply:function(p){ p.maxHp+=10; p.hp+=10; p.armor=(p.armor||0)+20; } },

    // ========== 幽灵 ghost ==========
    ghost_t1_hp:   { tier:1, cost:30,  prereq:[],                     name:'虚影膜',     desc:'起始潜行 +20',   apply:function(p){ p.stealth=(p.stealth||0)+20; } },
    ghost_t1_atk:  { tier:1, cost:30,  prereq:[],                     name:'冷刃',       desc:'起始 ATK +1',    apply:function(p){ p.atk+=1; } },
    ghost_t2_evo:  { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'虚空感知', desc:'开局 +1 进化点', apply:function(p){ p.evoPoints=(p.evoPoints||0)+1; } },
    ghost_t2_word: { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'背刺词条', desc:'起始首击必暴击', apply:function(p){ p._metaWord_ghostFirstStrike=true; p._firstStrikeCrit=true; } },
    ghost_t3_sig:  { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'幽冥共鸣', desc:'起始 ATK +2、潜行 +20', apply:function(p){ p._metaSig_ghostDodgeAmp=true; p.atk+=2; p.stealth=(p.stealth||0)+20; } },
    ghost_t3_form: { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'冥行刺客', desc:'起始 ATK +2、潜行 +30', apply:function(p){ p.atk+=2; p.stealth=(p.stealth||0)+30; } },

    // ========== 血族 blood ==========
    blood_t1_hp:   { tier:1, cost:30,  prereq:[],                     name:'血池',       desc:'起始 HP +6',     apply:function(p){ p.maxHp+=6; p.hp+=6; } },
    blood_t1_atk:  { tier:1, cost:30,  prereq:[],                     name:'锋牙',       desc:'起始 ATK +1',    apply:function(p){ p.atk+=1; } },
    blood_t2_evo:  { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'红月觉醒', desc:'开局 +1 进化点', apply:function(p){ p.evoPoints=(p.evoPoints||0)+1; } },
    blood_t2_word: { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'吸血词条', desc:'起始 HP +10、ATK +1', apply:function(p){ p._metaWord_bloodLifesteal=true; p.maxHp+=10; p.hp+=10; p.atk+=1; } },
    blood_t3_sig:  { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'狂宴共鸣', desc:'起始 HP +15、ATK +2', apply:function(p){ p._metaSig_bloodFeast=true; p.maxHp+=15; p.hp+=15; p.atk+=2; } },
    blood_t3_form: { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'血裔贵族', desc:'起始 HP +8、ATK +1', apply:function(p){ p.maxHp+=8; p.hp+=8; p.atk+=1; } },

    // ========== 机甲 mech ==========
    mech_t1_hp:   { tier:1, cost:30,  prereq:[],                     name:'装甲板',     desc:'起始 HP +6 / 装甲 +10', apply:function(p){ p.maxHp+=6; p.hp+=6; p.armor=(p.armor||0)+10; } },
    mech_t1_atk:  { tier:1, cost:30,  prereq:[],                     name:'瞄准核心',   desc:'起始 ATK +1',    apply:function(p){ p.atk+=1; } },
    mech_t2_evo:  { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'核心觉醒', desc:'开局 +1 进化点', apply:function(p){ p.evoPoints=(p.evoPoints||0)+1; } },
    mech_t2_word: { tier:2, cost:80,  prereq:['t1_hp','t1_atk'], req:'any', name:'过载词条', desc:'起始装甲 +20、ATK +2', apply:function(p){ p._metaWord_mechOverload=true; p.armor=(p.armor||0)+20; p.atk+=2; } },
    mech_t3_sig:  { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'核心共振', desc:'起始装甲 +40、ATK +2', apply:function(p){ p._metaSig_mechCorePower=true; p.armor=(p.armor||0)+40; p.atk+=2; } },
    mech_t3_form: { tier:3, cost:200, prereq:['t2_evo','t2_word'], req:'all', name:'重装机甲', desc:'起始 HP +10、装甲 +20', apply:function(p){ p.maxHp+=10; p.hp+=10; p.armor=(p.armor||0)+20; } }
  };

  function _newDefault(){
    return {
      v: SCHEMA_V,
      echoes: 0,
      echoTotal: 0,
      unlocked: { swarm:[], titan:[], ghost:[], blood:[], mech:[] },
      milestones: { floor3:false, floor6:false, floor9:false, floor12:false },
      loginStreak: 0,
      lastLogin: '',
      lastDailyRun: '',  // 每日首杀奖励标记
      lastClaim: ''      // 上次领取登录奖励的日期
    };
  }

  function _calcHash(m){
    // 弱 HMAC：避免小白手改 localStorage。深度反作弊不在 MVP 范围
    var s = (m.echoes|0)+'|'+(m.echoTotal|0)+'|';
    CLASSES.forEach(function(c){ s += c+':'+(m.unlocked[c]||[]).join(',')+';'; });
    s += 'salt_2026_pt_meta';
    var h = 0;
    for(var i=0;i<s.length;i++){ h = ((h<<5)-h + s.charCodeAt(i)) | 0; }
    return (h>>>0).toString(36);
  }

  function get(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return _newDefault();
      var m = JSON.parse(raw);
      if(!m || m.v !== SCHEMA_V) return _newDefault();
      // 校验 hash
      var expect = _calcHash(m);
      if(m.hash && m.hash !== expect){
        try{ console.warn('[meta] hash mismatch, resetting'); }catch(e){}
        return _newDefault();
      }
      // 字段补全
      if(!m.unlocked) m.unlocked = {};
      CLASSES.forEach(function(c){ if(!m.unlocked[c]) m.unlocked[c]=[]; });
      if(!m.milestones) m.milestones = { floor3:false, floor6:false, floor9:false, floor12:false };
      return m;
    }catch(e){ return _newDefault(); }
  }

  function save(m){
    try{
      m.v = SCHEMA_V;
      m.hash = _calcHash(m);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    }catch(e){}
  }

  function _nodeFullId(cls, nodeId){ return cls+'_'+nodeId; }

  function _checkPrereq(unlocked, def){
    if(!def.prereq || def.prereq.length === 0) return true;
    var req = def.req || 'all';
    var have = def.prereq.filter(function(p){ return unlocked.indexOf(p) >= 0; });
    if(req === 'any') return have.length > 0;
    return have.length === def.prereq.length;
  }

  function canUnlock(cls, nodeId){
    var fullId = _nodeFullId(cls, nodeId);
    var def = MetaNodes[fullId];
    if(!def) return { ok:false, reason:'未知节点' };
    var m = get();
    if((m.unlocked[cls]||[]).indexOf(nodeId) >= 0) return { ok:false, reason:'已解锁' };
    if(!_checkPrereq(m.unlocked[cls]||[], def)) return { ok:false, reason:'需先解锁前置' };
    if(m.echoes < def.cost) return { ok:false, reason:'残响不足（需'+def.cost+'）' };
    return { ok:true };
  }

  function unlock(cls, nodeId){
    var check = canUnlock(cls, nodeId);
    if(!check.ok) return check;
    var def = MetaNodes[_nodeFullId(cls, nodeId)];
    var m = get();
    m.echoes -= def.cost;
    m.unlocked[cls].push(nodeId);
    save(m);
    return { ok:true, def:def, remaining:m.echoes };
  }

  // 局开始时调用：把已解锁节点的效果应用到 player
  function applyBonuses(player, cls){
    if(!player || !cls) return [];
    var m = get();
    var ids = m.unlocked[cls] || [];
    var applied = [];
    ids.forEach(function(id){
      var def = MetaNodes[_nodeFullId(cls, id)];
      if(def && def.apply){
        try{ def.apply(player, m); applied.push(def.name); }catch(e){ try{console.warn('[meta] apply err', id, e);}catch(_){}}
      }
    });
    return applied;
  }

  // 局结算后调用：根据成绩积累残响 + 里程碑
  function gainFromRun(d){
    if(!d) return { earned:0 };
    var m = get();
    var base = Math.floor((d.score||0) / 100);
    var clearBonus = (d.floor||0) >= 12 ? 50 : 0;
    var milestoneBonus = 0;
    var msgs = [];
    [{f:3,b:5},{f:6,b:10},{f:9,b:20},{f:12,b:50}].forEach(function(it){
      var key = 'floor'+it.f;
      if((d.floor||0) >= it.f && !m.milestones[key]){
        m.milestones[key] = true;
        milestoneBonus += it.b;
        msgs.push('首达 F'+it.f+' +'+it.b);
      }
    });
    // 每日首次完成（任何楼层）
    var today = new Date().toISOString().slice(0,10);
    var dailyBonus = 0;
    if(m.lastDailyRun !== today){
      m.lastDailyRun = today;
      dailyBonus = 30;
      msgs.push('今日首战 +30');
    }
    var total = base + clearBonus + milestoneBonus + dailyBonus;
    m.echoes += total;
    m.echoTotal += total;
    save(m);
    return {
      earned: total,
      base: base,
      clear: clearBonus,
      milestone: milestoneBonus,
      daily: dailyBonus,
      total: m.echoes,
      msgs: msgs
    };
  }

  // 计算 meta_tier：用于排行榜分级（0=新手, 1=老兵, 2=全解）
  function metaTier(){
    var m = get();
    var c = 0;
    CLASSES.forEach(function(k){ c += (m.unlocked[k]||[]).length; });
    if(c < 12) return 0;
    if(c < 24) return 1;
    return 2;
  }

  function unlockedCount(){
    var m = get();
    var c = 0;
    CLASSES.forEach(function(k){ c += (m.unlocked[k]||[]).length; });
    return c;
  }

  // 连续登录检查（每次进游戏调一次）— 仅更新连续天数，不发放奖励
  function checkLogin(){
    var m = get();
    var today = new Date().toISOString().slice(0,10);
    if(m.lastLogin === today){
      return { isNew:false, streak:m.loginStreak, claimed:(m.lastClaim===today) };
    }
    var yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(m.lastLogin === yesterday) m.loginStreak = (m.loginStreak||0) + 1;
    else m.loginStreak = 1;
    m.lastLogin = today;
    save(m);
    return { isNew:true, streak:m.loginStreak, claimed:(m.lastClaim===today) };
  }

  // 计算第 N 天的奖励数（与旧公式一致：streak*20，上限 200）
  function loginBonusOf(day){
    return Math.min((day|0) * 20, 200);
  }

  // 是否可领取今日奖励
  function canClaimLogin(){
    var m = get();
    var today = new Date().toISOString().slice(0,10);
    return m.lastClaim !== today;
  }

  // 领取今日登录奖励
  function claimDailyLogin(){
    var m = get();
    var today = new Date().toISOString().slice(0,10);
    if(m.lastClaim === today) return { ok:false, reason:'今日已领取' };
    // 若今天还没登录过（边角情况），先把 streak 推进
    if(m.lastLogin !== today){
      var yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
      if(m.lastLogin === yesterday) m.loginStreak = (m.loginStreak||0) + 1;
      else m.loginStreak = 1;
      m.lastLogin = today;
    }
    var streak = m.loginStreak || 1;
    var bonus = loginBonusOf(streak);
    m.echoes += bonus;
    m.echoTotal += bonus;
    m.lastClaim = today;
    save(m);
    return { ok:true, streak:streak, bonus:bonus, total:m.echoes };
  }

  // 暴露
  window.MetaNodes = MetaNodes;
  window.MetaProgress = {
    get: get,
    save: save,
    canUnlock: canUnlock,
    unlock: unlock,
    applyBonuses: applyBonuses,
    gainFromRun: gainFromRun,
    metaTier: metaTier,
    unlockedCount: unlockedCount,
    checkLogin: checkLogin,
    canClaimLogin: canClaimLogin,
    claimDailyLogin: claimDailyLogin,
    loginBonusOf: loginBonusOf,
    CLASSES: CLASSES,
    // 调试用
    _reset: function(){ try{ localStorage.removeItem(STORAGE_KEY); }catch(e){} },
    _grant: function(n){ var m=get(); m.echoes+=n; m.echoTotal+=n; save(m); return m.echoes; }
  };
})();
