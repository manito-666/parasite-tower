function showSettingsPanel(){
  const ev=document.getElementById('event-overlay');
  ev.style.display='flex';
  document.getElementById('event-title').textContent=t('设置');
  document.getElementById('event-text').innerHTML='';
  var langLabel = (typeof PT_LANG!=='undefined'&&PT_LANG._current==='en')?'🌐 中文':'🌐 English';
  var curVol=(typeof getMasterVolume==='function')?getMasterVolume():1.2;
  var volPct=Math.round(curVol/2.5*100);
  var soft=(typeof getSoftMode==='function')?getSoftMode():true;
  document.getElementById('event-choices').innerHTML=
    '<div style="display:flex;flex-direction:column;gap:10px">'+
    '<button class="btn" onclick="toggleAudioMute()">'+(_audioMuted?'🔇 '+t('音效已关闭')+' — '+t('点击开启'):'🔊 '+t('音效已开启')+' — '+t('点击关闭'))+'</button>'+
    '<div style="background:rgba(255,255,255,0.04);border:1px solid #333;border-radius:6px;padding:10px 12px">'+
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:#9aa;margin-bottom:6px"><span>🔊 '+t('音量')+'</span><span id="vol-pct" style="color:#1ed8b0;font-family:monospace;font-weight:bold">'+volPct+'%</span></div>'+
      '<input type="range" min="0" max="250" step="5" value="'+Math.round(curVol*100)+'" style="width:100%;accent-color:#1ed8b0" oninput="if(typeof setMasterVolume===\'function\'){setMasterVolume(this.value/100);var p=document.getElementById(\'vol-pct\');if(p)p.textContent=Math.round(this.value/2.5)+\'%\';}" onchange="try{sounds&&sounds.pickup&&sounds.pickup();}catch(e){}">'+
    '</div>'+
    '<button class="btn" onclick="if(typeof setSoftMode===\'function\'){setSoftMode(!getSoftMode());showSettingsPanel();try{sounds&&sounds.pickup&&sounds.pickup();}catch(e){}}">'+(soft?'🌙 柔和音色：开 — 点击关闭':'⚡ 柔和音色：关 — 点击开启')+'</button>'+
    '<button class="btn" onclick="if(typeof PT_LANG!==\'undefined\'){PT_LANG.toggle();showSettingsPanel();}">'+langLabel+'</button>'+
    '<button class="btn" onclick="showPrivacyPolicy();titleOverlay()">📜 '+t('隐私政策')+'</button>'+
    '<button class="btn btn-secondary" onclick="closeEvent()">'+t('关闭')+'</button>'+
    '</div>';
}
function copyTextToClipboard(text,msg){
  var ok=msg||t('已复制到剪贴板');
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){addMsg('<span style="color:#1ed8b0">'+ok+'</span>');}).catch(function(){_fallbackCopy(text,ok);});
    }else{_fallbackCopy(text,ok);}
  }catch(e){_fallbackCopy(text,ok);}
}
function _fallbackCopy(text,msg){
  var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');addMsg('<span style="color:#1ed8b0">'+(msg||t('已复制到剪贴板'))+'</span>');}catch(e){addMsg('<span style="color:#f66">'+t('复制失败，请手动复制')+'</span>');}
  document.body.removeChild(ta);
}
function shareEnding(cls){
  var cc=window.classColors&&classColors[cls];
  var icon=cc?cc.icon:'🧬';
  var name=cc?cc.name:cls;
  var ed=document.getElementById('ending-title');
  var eq=document.getElementById('ending-quote');
  var title=ed?ed.textContent:'结局';
  var quote=eq?eq.textContent:'';
  var text='🌀 你也是我 · '+title+'\n'+icon+' '+name+' | F'+game.floor+'\n';
  if(quote)text+='"'+quote.trim()+'"\n';
  text+='#你也是我 #YouAreMe';
  copyTextToClipboard(text,'结局已复制，可分享到社交媒体');
}
function exportSave(){
  try{
    saveGame();
    var _curMode=(window.GameRules&&GameRules.modeId)||'classic';
    var _curSave=localStorage.getItem('pt_save_'+_curMode)||localStorage.getItem('pt_save');
    var d={save:_curSave,saveMode:_curMode,ach:localStorage.getItem('pt_achievements'),end:localStorage.getItem('pt_endings'),aff:localStorage.getItem('pt_affinity')};
    var s=btoa(unescape(encodeURIComponent(JSON.stringify(d))));
    var ev=document.getElementById('event-overlay');ev.style.display='flex';
    document.getElementById('event-title').textContent=t('导出存档');
    document.getElementById('event-text').innerHTML='<div style="font-size:11px;color:#aaa;margin-bottom:8px">长按复制下方文本，粘贴到备忘录保存</div><textarea id="export-area" readonly style="width:100%;height:120px;background:#111;color:#0f8;border:1px solid #333;border-radius:4px;padding:6px;font-size:10px;word-break:break-all" onclick="this.select()">'+s+'</textarea>';
    document.getElementById('event-choices').innerHTML='<button class="btn btn-secondary" onclick="closeEvent()">关闭</button>';
    setTimeout(function(){var ta=document.getElementById('export-area');if(ta)ta.select();},200);
  }catch(e){addMsg('导出失败');}
}
function importSave(){
  var ev=document.getElementById('event-overlay');ev.style.display='flex';
  document.getElementById('event-title').textContent=t('导入存档');
  document.getElementById('event-text').innerHTML='<div style="font-size:11px;color:#aaa;margin-bottom:8px">粘贴之前导出的存档文本</div><textarea id="import-area" style="width:100%;height:120px;background:#111;color:#ff0;border:1px solid #333;border-radius:4px;padding:6px;font-size:10px" placeholder="粘贴存档文本..."></textarea>';
  document.getElementById('event-choices').innerHTML='<div style="display:flex;gap:8px"><button class="btn" onclick="doImportSave()">确认导入</button><button class="btn btn-secondary" onclick="closeEvent()">取消</button></div>';
}
function doImportSave(){
  try{
    var ta=document.getElementById('import-area');
    if(!ta||!ta.value.trim()){addMsg('请粘贴存档文本');return;}
    var d=JSON.parse(decodeURIComponent(escape(atob(ta.value.trim()))));
    if(!d.save){addMsg('无效存档');return;}
    var _impMode=d.saveMode||'classic';
    try{var _parsed=JSON.parse(d.save);if(_parsed&&_parsed.modeId)_impMode=_parsed.modeId;}catch(e){}
    localStorage.setItem('pt_save_'+_impMode,d.save);
    if(d.ach)localStorage.setItem('pt_achievements',d.ach);
    if(d.end)localStorage.setItem('pt_endings',d.end);
    if(d.aff)localStorage.setItem('pt_affinity',d.aff);
    closeEvent();
    addMsg('存档已导入，正在重载...');
    setTimeout(function(){location.reload();},800);
  }catch(e){addMsg('导入失败：存档格式无效');}
}
// === 怪物图鉴 ===
function getBestiary(){try{return JSON.parse(localStorage.getItem('pt_bestiary')||'[]');}catch(e){return [];}}
function unlockBestiary(type){
  var list=getBestiary();
  if(list.indexOf(type)>=0)return;
  list.push(type);
  localStorage.setItem('pt_bestiary',JSON.stringify(list));
}
function showBestiary(){
  var unlocked=getBestiary();
  var allTypes=Object.keys(monsterTemplates).filter(function(k){return k!=='human';});
  var zones={1:[],2:[],3:[],4:[],5:[]};
  allTypes.forEach(function(k){var z=monsterTemplates[k].zone||1;if(zones[z])zones[z].push(k);});
  var zoneNames={1:'实验区域',2:'培育巢穴',3:'污染核心',4:'深渊区域',5:'终焉之地'};
  var h='<div style="max-height:60vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 8px">';
  h+='<div style="text-align:center;color:#888;font-size:11px;margin-bottom:12px;letter-spacing:1px">'+t('已收集')+' <span style="color:#00ffd0;font-weight:bold">'+unlocked.length+'</span> / '+allTypes.length+' · 点击已解锁怪物查看详情</div>';
  for(var z=1;z<=5;z++){
    if(!zones[z]||zones[z].length===0)continue;
    h+='<div style="color:#ffd700;font-weight:bold;font-size:12px;margin:14px 0 8px;text-align:center;letter-spacing:3px;position:relative">'
      +'<span style="background:#0d0a18;padding:0 12px;position:relative;z-index:1">'+zoneNames[z]+'</span>'
      +'<span style="position:absolute;left:0;right:0;top:50%;height:1px;background:linear-gradient(to right,transparent,#333 30%,#333 70%,transparent);z-index:0"></span>'
      +'</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;justify-items:stretch">';
    zones[z].forEach(function(k){
      var m=monsterTemplates[k];
      var found=unlocked.indexOf(k)>=0;
      var isBoss=k.indexOf('boss')>=0;
      var borderC=found?(isBoss?'#ffd700':'#00ffd0'):'rgba(80,80,110,0.35)';
      var glow=found?(isBoss?'box-shadow:0 0 8px rgba(255,215,0,0.25);':'box-shadow:0 0 6px rgba(0,255,208,0.15);'):'';
      var bg=found?'linear-gradient(160deg,#13102a 0%,#0a0812 100%)':'#0a0812';
      var clickAttr=found?' onclick="showMonsterDetail(\''+k+'\')"':'';
      h+='<div'+clickAttr+' style="background:'+bg+';border:1px solid '+borderC+';border-radius:6px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;'+glow+(found?'cursor:pointer;transition:transform 0.15s':'')+'"'
        +(found?' ontouchstart="this.style.transform=\'scale(0.95)\'" ontouchend="this.style.transform=\'\'"':'')+'>';
      if(found){
        var _icoHtml=(typeof getFormIconLg==='function')?getFormIconLg(k,46):'';
        h+=_icoHtml||'<span style="font-size:28px">❓</span>';
      }else{
        h+='<span style="font-size:22px;color:rgba(120,120,160,0.35)">?</span>';
      }
      h+='</div>';
    });
    h+='</div>';
  }
  h+='</div>';
  var ev=document.getElementById('event-overlay');ev.style.display='flex';
  document.getElementById('event-title').textContent='📕 '+t('怪物图鉴');
  document.getElementById('event-text').innerHTML=h;
  document.getElementById('event-choices').innerHTML='<button class="btn btn-secondary" onclick="closeEvent()">'+t('关闭')+'</button>';
}

// 怪物详情面板
function showMonsterDetail(type){
  var m = monsterTemplates[type];
  if(!m) return;
  var isBoss = type.indexOf('boss')===0;
  var lore = (window.monsterLore && window.monsterLore[type]) || '档案缺失。';
  var play = (typeof window.getMonsterPlaystyle === 'function') ? window.getMonsterPlaystyle(type) : null;
  var zoneNames={1:'实验区域',2:'培育巢穴',3:'污染核心',4:'深渊区域',5:'终焉之地'};
  var zoneTag = isBoss ? '◆ BOSS' : 'T'+(m.zone||1);
  var mainColor = m.color || '#00ffd0';
  var h = '<div style="max-height:62vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0;font-family:Consolas,monospace;background:#06040c;border-radius:6px">';

  // ─── 标题条：腐化档案风 ───
  h += '<div style="position:relative;padding:14px 14px 12px;background:'+
    'radial-gradient(120% 80% at 0% 0%,'+mainColor+'33,transparent 60%),'+
    'linear-gradient(180deg,#1a0a2a,#06040c);'+
    'border-bottom:1px solid '+mainColor+'66;overflow:hidden">'+
    '<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:repeating-linear-gradient(180deg,transparent 0,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px);pointer-events:none"></div>'+
    '<div style="display:flex;align-items:center;gap:10px;position:relative">'+
      '<div style="font-size:.65em;color:'+mainColor+';letter-spacing:3px;opacity:.7">PARASITE.ARCHIVE / '+zoneTag+'</div>'+
      '<div style="margin-left:auto;font-size:.6em;color:#888;letter-spacing:1px">'+(zoneNames[m.zone||1]||'')+'</div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;position:relative">'+
      '<div style="flex:0 0 auto;width:64px;height:64px;background:radial-gradient(circle at center,'+mainColor+'22,transparent 70%);border:1px solid '+mainColor+'55;border-radius:8px;display:flex;align-items:center;justify-content:center">'+
        ((typeof getFormIconLg==='function')?getFormIconLg(type,52):(isBoss?'👑':'❓'))+
      '</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:1.5em;color:'+mainColor+';font-weight:bold;letter-spacing:2px;text-shadow:0 0 14px '+mainColor+'88,0 0 4px '+mainColor+'">'+(isBoss?'👑 ':'')+m.name+'</div>'+
        (play?'<div style="font-size:.7em;color:#a55cff;margin-top:3px;letter-spacing:2px">角色定位 · '+play.role+'</div>':'')+
      '</div>'+
    '</div>'+
  '</div>';

  // ─── 主体 padding 区 ───
  h += '<div style="padding:12px 12px 14px">';

  // 基础属性
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">';
  h += '<div style="background:linear-gradient(180deg,#0a1818,#06040c);border:1px solid #1ed8b055;border-radius:5px;padding:8px;text-align:center"><div style="font-size:.6em;color:#1ed8b0;letter-spacing:2px">HP</div><div style="font-size:1.1em;color:#1ed8b0;font-weight:bold;text-shadow:0 0 8px rgba(30,216,176,.5)">'+m.maxHp+'</div></div>';
  h += '<div style="background:linear-gradient(180deg,#1a0a0a,#06040c);border:1px solid #ff556055;border-radius:5px;padding:8px;text-align:center"><div style="font-size:.6em;color:#ff5560;letter-spacing:2px">ATK</div><div style="font-size:1.1em;color:#ff5560;font-weight:bold;text-shadow:0 0 8px rgba(255,85,96,.5)">'+m.atk+'</div></div>';
  h += '<div style="background:linear-gradient(180deg,#0a0a1a,#06040c);border:1px solid #8a9aff55;border-radius:5px;padding:8px;text-align:center"><div style="font-size:.6em;color:#8a9aff;letter-spacing:2px">DEF</div><div style="font-size:1.1em;color:#8a9aff;font-weight:bold;text-shadow:0 0 8px rgba(138,154,255,.5)">'+m.def+'</div></div>';
  h += '</div>';

  // 档案 lore
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'+
    '<span style="font-size:.75em;color:'+mainColor+';font-weight:bold;letter-spacing:3px">⌬ 档案</span>'+
    '<span style="flex:1;height:1px;background:linear-gradient(90deg,'+mainColor+'88,transparent)"></span></div>';
  h += '<div style="font-size:.82em;color:#bbb;line-height:1.6;background:linear-gradient(135deg,#0a0612,#06040c);border-left:3px solid '+mainColor+';padding:9px 11px;margin-bottom:14px;border-radius:0 5px 5px 0;font-style:italic">'+lore+'</div>';

  // 技能 / 特性 — 重点高亮
  if(m.traits && m.traits.length>0){
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'+
      '<span style="font-size:.85em;color:#ffd700;font-weight:bold;letter-spacing:3px;text-shadow:0 0 8px rgba(255,215,0,.4)">⚡ 技能 / 特性</span>'+
      '<span style="flex:1;height:1px;background:linear-gradient(90deg,#ffd700aa,transparent)"></span>'+
      '<span style="font-size:.6em;color:#ffd700aa;letter-spacing:1px">×'+m.traits.length+'</span>'+
      '</div>';
    h += '<div style="margin-bottom:14px">';
    var tagColor = {tank:'#8a9aff',regen:'#1ed8b0',lifesteal:'#ff6688',burst:'#ff9933',cc:'#cc66ff',mobility:'#66ddff',utility:'#cccccc'};
    var tagLabel = {tank:'坦克',regen:'回血',lifesteal:'吸血',burst:'爆发',cc:'控制',mobility:'机动',utility:'工具'};
    m.traits.forEach(function(tr){
      var eff = (typeof getTraitEffect==='function') ? getTraitEffect(tr) : null;
      var desc = (eff && eff.desc) ? eff.desc : '—';
      var tactInfo = (window.traitTactics && window.traitTactics[tr]) || null;
      var tag = tactInfo ? tactInfo.tag : 'utility';
      var color = tagColor[tag] || '#cccccc';
      var label = tagLabel[tag] || '通用';
      h += '<div style="position:relative;background:linear-gradient(90deg,'+color+'22,#06040c 75%);border:1px solid '+color+'88;border-left:4px solid '+color+';border-radius:5px;padding:9px 11px;margin-bottom:7px;box-shadow:0 0 10px '+color+'33,inset 0 0 20px '+color+'08">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:1em;color:'+color+';font-weight:bold;letter-spacing:1px;text-shadow:0 0 6px '+color+'aa">▶ '+tr+'</span>'+
          '<span style="font-size:.6em;color:#06040c;background:'+color+';padding:2px 7px;border-radius:8px;font-weight:bold;letter-spacing:1px">'+label+'</span>'+
        '</div>'+
        '<div style="font-size:.83em;color:#e8e8e8;margin-top:5px;line-height:1.45">'+desc+'</div>'+
        (tactInfo?'<div style="font-size:.73em;color:'+color+';margin-top:4px;opacity:.85;letter-spacing:.5px">↳ '+tactInfo.tip+'</div>':'')+
        '</div>';
    });
    h += '</div>';
  }

  // 特殊能力 ability
  if(m.ability){
    var abilityDesc = {berserk:'狂暴：低血量时大幅提升 ATK，越伤越凶',vampiric:'吸血强化：攻击有大量吸血，难以耗死',armored:'重甲：额外伤害减免，硬抗能力强',poison:'剧毒：攻击附加持续毒伤，长线作战克星'};
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'+
      '<span style="font-size:.85em;color:#ff6644;font-weight:bold;letter-spacing:3px;text-shadow:0 0 8px rgba(255,102,68,.5)">★ 特殊能力</span>'+
      '<span style="flex:1;height:1px;background:linear-gradient(90deg,#ff6644aa,transparent)"></span></div>';
    h += '<div style="background:linear-gradient(135deg,#3a0a1a,#0a0612);border:1px solid #ff6644;border-radius:5px;padding:10px 12px;margin-bottom:14px;box-shadow:0 0 14px rgba(255,102,68,.35),inset 0 0 20px rgba(255,102,68,.06);font-size:.85em;color:#ffd0c0;font-weight:bold;letter-spacing:.5px">⚡ '+(abilityDesc[m.ability]||m.ability)+'</div>';
  }

  // 玩法建议
  if(play && play.suggestions && play.suggestions.length>0){
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'+
      '<span style="font-size:.8em;color:#9ad8a0;font-weight:bold;letter-spacing:3px;text-shadow:0 0 6px rgba(154,216,160,.4)">⌬ 附身玩法建议</span>'+
      '<span style="flex:1;height:1px;background:linear-gradient(90deg,#9ad8a088,transparent)"></span></div>';
    h += '<div style="background:linear-gradient(135deg,#0a1810,#06040c);border:1px solid #2a4a3a;border-radius:5px;padding:10px 12px;margin-bottom:8px;box-shadow:inset 0 0 20px rgba(154,216,160,.04)">';
    play.suggestions.forEach(function(s){
      h += '<div style="font-size:.8em;color:#9ad8a0;margin:4px 0;line-height:1.5">'+s+'</div>';
    });
    h += '</div>';
  }

  h += '</div></div>';
  document.getElementById('event-title').textContent='📕 '+m.name;
  document.getElementById('event-text').innerHTML=h;
  document.getElementById('event-choices').innerHTML='<button class="btn btn-secondary" onclick="showBestiary()">'+t('返回图鉴')+'</button> <button class="btn btn-secondary" onclick="closeEvent()">'+t('关闭')+'</button>';
}
function showPrivacyPolicy(){
  var ev=document.getElementById('event-overlay');ev.style.display='flex';
  document.getElementById('event-title').textContent=t('隐私政策');
  document.getElementById('event-text').innerHTML=
    '<div style="font-size:12px;color:#ccc;line-height:1.6;max-height:60vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px">'+
    '<p><b>你也是我</b>（以下简称"本游戏"）尊重并保护用户隐私。</p>'+
    '<p><b>1. 数据收集</b><br>仅在你完成短局并选择上传时，本游戏会向我们的服务器发送：你设置的昵称、设备生成的随机ID（不含真实身份信息）、以及该局成绩数据（分数、层数、用时、职业等）。如未设置昵称，则不会上传任何数据。</p>'+
    '<p><b>2. 本地存储</b><br>游戏进度保存在设备本地存储（localStorage）中，卸载应用将清除存档。你可通过"记录管理→导出存档"备份数据。</p>'+
    '<p><b>3. 网络使用</b><br>仅用于排行榜上传与查询；如关闭网络可正常游玩，仅本地排行榜可用。</p>'+
    '<p><b>4. 第三方服务</b><br>本游戏不集成任何第三方 SDK、广告或分析服务。</p>'+
    '<p><b>5. 儿童隐私</b><br>本游戏不针对儿童收集任何信息。</p>'+
    '<p><b>6. 联系方式</b><br>如有疑问，请通过应用商店页面联系开发者。</p>'+
    '<p><b>7. 数据删除</b><br>你可以联系开发者删除你在服务器上的全部排行榜记录。</p>'+
    '<p style="color:#888;margin-top:12px">最后更新：2026年5月8日</p>'+
    '</div>';
  document.getElementById('event-choices').innerHTML='<button class="btn btn-secondary" onclick="closeEvent()">关闭</button>';
}
function showMenuPanel(){
  // 战斗中禁止打开菜单（菜单逻辑会清扫所有 overlay，会破坏战斗状态）
  var _co=document.getElementById('combat-overlay');
  if(game.target||(_co&&_co.classList.contains('active'))){
    try{addMsg('战斗中无法打开菜单');}catch(e){}
    return;
  }
  updateEvoRedDot();
  var _hiddenByMenu=[];
  var _overlayIds=['frag-choice-overlay','synth-confirm-overlay','frag-bag-overlay','shop-overlay','evolution-overlay','form-library-overlay','affinity-detail-overlay','pollution-skill-overlay','floor25-choice-overlay','combat-overlay'];
  _overlayIds.forEach(function(id){var el=document.getElementById(id);if(el&&(el.style.display==='flex'||el.style.display==='block'||el.classList.contains('active'))){_hiddenByMenu.push({el:el,was:el.style.display||'flex',hadActive:el.classList.contains('active')});el.style.display='none';if(el.classList.contains('active'))el.classList.remove('active');}});
  window._hiddenByMenu=_hiddenByMenu;
  const ev=document.getElementById('event-overlay');
  ev.style.zIndex='900';
  ev.style.display='flex';
  document.getElementById('event-title').textContent=t('菜单');
  document.getElementById('event-text').innerHTML='';
  document.getElementById('event-choices').innerHTML=
    '<div style="display:flex;flex-direction:column;gap:8px">'+
    '<button class="btn'+(game._evoRedDot?' red-dot':'')+'" onclick="closeEvent(true);showEvolutionPath(game.player.playerClass)">🧬 '+t('进化')+'</button>'+
    '<button class="btn" onclick="closeEvent(true);showShop()">🛒 '+t('商店')+'</button>'+
    '<button class="btn" onclick="closeEvent(true);showAffinityDetail()">🔗 '+t('形态羁绊')+'</button>'+
    '<button class="btn" onclick="closeEvent(true);showPollutionSkillPanel()">☢️ '+t('污染技能')+'</button>'+
    '<button class="btn" onclick="closeEvent(true);showAnchorDetail()">&#x1F4BE; '+t('锚点管理')+'</button>'+
    '<button class="btn" onclick="saveGame(true);closeEvent();addMsg(\''+t('游戏已保存')+'\')">💾 '+t('保存游戏')+'</button>'+
    '<button class="btn" style="'+(game.player.evoPoints>=200?'border-color:#00ffd0;color:#00ffd0':'border-color:#333;color:#555')+'" onclick="'+(game.player.evoPoints>=200?'closeEvent(true);manualAnchor()':'closeEvent();addMsg(\''+t('需200EP')+'\')')+'">🧠 '+
    (game.player.evoPoints>=200?t('固化记忆')+' (200EP)':t('固化记忆')+'('+t('需200EP')+')')+'</button>'+
    '<button class="btn" style="border-color:#ff3344;color:#ff3344" onclick="closeEvent(true);confirmExitGame()">🚪 '+t('退出游戏')+'</button>'+
    '<button class="btn btn-secondary" onclick="closeEvent()">✕ '+t('关闭')+'</button>'+
    '</div>';
}
function showShop(){
document.getElementById('shop-points').textContent=game.player.evoPoints;
const cats={supply:'基础补给',survival:'净化保命',growth:'形态成长',info:'信息优势'};
const catColors={supply:'#00ffd0',survival:'#ff006e',growth:'#8844ff',info:'#ff0'};
let html='';
Object.keys(cats).forEach(cat=>{
html+='<div style="color:'+catColors[cat]+';font-weight:bold;margin:10px 0 4px;font-size:.85em;border-bottom:1px solid #333;padding-bottom:2px">'+cats[cat]+'</div>';
const _shopZone=(window.GameModes&&GameModes.isExpedition&&GameModes.isExpedition()&&window.ExpeditionMode)?ExpeditionMode.getZone(game.floor):Math.min(5,Math.ceil(game.floor/10));
shopItems.filter(it=>it.cat===cat&&(!it.minZone||_shopZone>=it.minZone)).forEach((item,_,arr)=>{
const i=shopItems.indexOf(item);
if(!game._shopBuyCount)game._shopBuyCount={};
const bought=game._shopBuyCount[item.type]||0;
const actualCost=item.priceScale?Math.floor(item.cost*Math.pow(item.priceScale,bought)):item.cost;
const soldOut=item.maxBuy&&bought>=item.maxBuy;
const canBuy=!soldOut&&game.player.evoPoints>=actualCost&&!isShopItemDisabled(item);
const disabledReason=soldOut?'已满':getShopDisabledReason(item);
const costLabel=actualCost+'EP'+(item.maxBuy?' ('+bought+'/'+item.maxBuy+')':'');
const btn=canBuy?'<button class="btn" style="padding:3px 10px;font-size:.8em;margin-left:6px" onclick="buyItem('+i+')">'+costLabel+'</button>':(disabledReason?'<span style="color:#555;font-size:.7em">'+disabledReason+'</span>':'<span style="color:#666;font-size:.75em">EP不足('+actualCost+')</span>');
html+='<div style="'+(canBuy?'':'opacity:0.5;')+'padding:5px 6px;margin:2px 0;background:rgba(255,255,255,0.03);border-radius:4px;font-size:.8em;display:flex;justify-content:space-between;align-items:center"><span><b>'+item.name+'</b> <span style="color:#888">'+item.desc+'</span></span>'+btn+'</div>';
});
});
document.getElementById('shop-items').innerHTML=html;
document.getElementById('shop-overlay').style.display='flex';
checkHiddenStory('shop');
if(game._shopLingerTimer)clearTimeout(game._shopLingerTimer);
game._shopLingerTimer=setTimeout(()=>{checkHiddenStory('shop_linger');game._shopLingerTimer=null;},15000);
}
function isShopItemDisabled(item){
if(item.type==='collapse_resist'&&game.player._collapseResist)return true;
if(item.type==='death_revive'&&game.player._deathRevive)return true;
if(item.type==='form_slot'&&game.forms.length>=5)return true;
if(item.type==='form_lock'&&game.player._formLocked)return true;
if(item.type==='perm_regen'&&game.player._permRegen)return true;
return false;
}
function getShopDisabledReason(item){
if(item.type==='collapse_resist'&&game.player._collapseResist)return '已激活';
if(item.type==='death_revive'&&game.player._deathRevive)return '已激活';
if(item.type==='form_slot'&&game.forms.length>=5)return '已满(5)';
if(item.type==='form_lock'&&game.player._formLocked)return '已锁定';
if(item.type==='perm_regen'&&game.player._permRegen)return '已激活';
if(game.player.evoPoints<item.cost)return null;
return null;
}
function closeShop(){if(game._shopLingerTimer){clearTimeout(game._shopLingerTimer);game._shopLingerTimer=null;}document.getElementById('shop-overlay').style.display='none';_restoreHiddenByMenu();}

