// ================================================================
// 音效系统（全局作用域）
// ================================================================
// 默认开启音效（首次启动 _muted 未设置时为 false）
var _audioMuted=localStorage.getItem('pt_muted')==='1';
var _userVolume=(function(){var v=parseFloat(localStorage.getItem('pt_volume'));return (isNaN(v)||v<0)?1.2:Math.min(2.5,v);})();
var _userVolumeGain=null;
// 柔和模式：低通滤波 + 削峰，默认开启（玩久了不刺耳）
var _softMode=localStorage.getItem('pt_soft')!=='0';
var _softFilter=null;
var _audioContext=null;
var _ambientOsc=null;
var _heartbeatInterval=null;
var _whisperInterval=null;
var _glitchInterval=null;
var _bgMusicOsc=null;
var _bgMusicGain=null;
var _bgMusicZone=-1;
var _audioInitedByGesture=false;
var _masterOut=null;
var _breathGain=null;        // tower 呼吸增益（被 LFO 调制）
var _breathLfo=null;
var _convolver=null;          // zone IR 卷积混响
var _convWet=null;            // wet 发送量
var _towerSubDrone=null;      // 30Hz 不可见低吼
var _currentIRZone=-1;
function _makeZoneIR(zone){
  // zone 0~4：长度递增、衰减递缓、湿度递大；模拟从"狭窄活体腔"到"巨大教堂式空腔"
  if(!_audioContext)return null;
  var ctx=_audioContext;var sr=ctx.sampleRate;
  var lenSec=[0.5,0.9,1.5,2.4,3.6][zone]||1.5;
  var len=Math.floor(sr*lenSec);
  var decay=[6,4,2.5,1.8,1.2][zone]||3;
  var buf=ctx.createBuffer(2,len,sr);
  for(var ch=0;ch<2;ch++){
    var d=buf.getChannelData(ch);
    for(var i=0;i<len;i++){
      var t=i/len;
      d[i]=(Math.random()*2-1)*Math.pow(1-t,decay);
    }
    if(zone>=1){
      // 早期反射 taps（密集肉腔感）
      var taps=[0.013,0.025,0.041,0.063,0.094];
      for(var k=0;k<taps.length;k++){
        var idx=Math.floor(taps[k]*sr);
        if(idx<len) d[idx]+=(Math.random()*0.5+0.3)*(k%2?-1:1);
      }
    }
  }
  return buf;
}
function _setZoneIR(zone){
  if(!_convolver||!_audioContext||_currentIRZone===zone)return;
  try{_convolver.buffer=_makeZoneIR(zone);}catch(e){}
  _currentIRZone=zone;
  // 越深的 zone 湿度越大
  var levels=[0.06,0.10,0.16,0.22,0.28];
  if(_convWet){
    var nowT=_audioContext.currentTime;
    _convWet.gain.cancelScheduledValues(nowT);
    _convWet.gain.setValueAtTime(_convWet.gain.value,nowT);
    _convWet.gain.linearRampToValueAtTime(levels[zone]||0.15,nowT+2.0);
  }
}
function _ensureMasterOut(){
  if(!_audioContext)return null;
  if(_masterOut)return _masterOut;
  try{
    var ctx=_audioContext;
    var c=ctx.createDynamicsCompressor();
    c.threshold.value=-18;   // 更早压缩，避免尖峰
    c.knee.value=22;
    c.ratio.value=5;
    c.attack.value=0.004;
    c.release.value=0.20;
    // 全局柔化滤波：低通 + 高架阻尼，削掉 2-4kHz 刺耳区
    var soft=ctx.createBiquadFilter();
    soft.type='lowpass';
    soft.frequency.value=_softMode?4200:14000;
    soft.Q.value=0.6;
    var soft2=ctx.createBiquadFilter();
    soft2.type='peaking';
    soft2.frequency.value=3200;
    soft2.Q.value=1.2;
    soft2.gain.value=_softMode?-6:0;  // 削掉 3.2kHz ±6dB
    c.connect(soft);soft.connect(soft2);
    _softFilter={lp:soft,peak:soft2};
    // tower-breath：master 之后的总增益，被 0.1Hz LFO 缓慢调制 ±10%
    var breath=ctx.createGain();
    breath.gain.setValueAtTime(1.0,ctx.currentTime);
    soft2.connect(breath);
    // 用户音量层：插在 breath 与 destination 之间，独立于呼吸 LFO
    var uv=ctx.createGain();
    uv.gain.setValueAtTime(_userVolume,ctx.currentTime);
    breath.connect(uv);
    uv.connect(ctx.destination);
    _userVolumeGain=uv;
    _breathGain=breath;
    var lfo=ctx.createOscillator();
    lfo.type='sine';lfo.frequency.value=0.10; // ~10s 一个呼吸周期
    var lfoG=ctx.createGain();lfoG.gain.value=0.10; // ±10%
    lfo.connect(lfoG);lfoG.connect(breath.gain);
    lfo.start();
    _breathLfo=lfo;
    // 35Hz 不可见低吼：人耳听不到具体音高，但身体能感觉到"塔在呼吸"
    var sub=ctx.createOscillator();var subG=ctx.createGain();
    sub.type='sine';sub.frequency.value=35;
    subG.gain.setValueAtTime(0,ctx.currentTime);
    subG.gain.linearRampToValueAtTime(0.06,ctx.currentTime+4);
    sub.connect(subG);subG.connect(breath); // 走 breath，跟塔同呼吸
    sub.start();
    _towerSubDrone={osc:sub,gain:subG};
    // 平行 send：compressor → convolver → wet → destination（不走 breath，让混响尾巴稳定）
    try{
      var conv=ctx.createConvolver();
      var wet=ctx.createGain();
      wet.gain.setValueAtTime(0.06,ctx.currentTime);
      c.connect(conv);conv.connect(wet);wet.connect(uv);
      _convolver=conv;_convWet=wet;
      _setZoneIR(0);
    }catch(e){}
    _masterOut=c;
  }catch(e){ _masterOut=_audioContext.destination; }
  return _masterOut;
}
function initAudio(){
  if(_audioMuted)return;
  if(!_audioContext){
    try{_audioContext=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}
  }
  if(_audioContext&&_audioContext.state==='suspended'){try{_audioContext.resume();}catch(e){}}
  _ensureMasterOut();
}
// 首次用户手势立即初始化音频（解决移动端/WebView autoplay 限制）
function _primeAudioOnFirstGesture(){
  if(_audioInitedByGesture)return;
  _audioInitedByGesture=true;
  initAudio();
  if(_audioContext&&_audioContext.state==='suspended'){try{_audioContext.resume();}catch(e){}}
}
if(typeof document!=='undefined'){
  var _primeOpts={passive:true,capture:true};
  document.addEventListener('touchstart',_primeAudioOnFirstGesture,_primeOpts);
  document.addEventListener('mousedown',_primeAudioOnFirstGesture,_primeOpts);
  document.addEventListener('keydown',_primeAudioOnFirstGesture,_primeOpts);
  // 后台时挂起 AudioContext，回到前台再恢复——一行解决"后台音乐还在跑"和回来时音符爆发
  document.addEventListener('visibilitychange',function(){
    if(!_audioContext||_audioMuted)return;
    if(document.hidden){
      try{_audioContext.suspend();}catch(e){}
    }else{
      try{_audioContext.resume();}catch(e){}
    }
  });
  window.addEventListener('pagehide',function(){
    if(_audioContext){try{_audioContext.suspend();}catch(e){}}
  });
  window.addEventListener('pageshow',function(){
    if(_audioContext&&!_audioMuted){try{_audioContext.resume();}catch(e){}}
  });
}
function playTone(freq,dur){
  try{
    initAudio();if(!_audioContext)return;
    const osc=_audioContext.createOscillator();
    const gain=_audioContext.createGain();
    osc.connect(gain);gain.connect(_masterOut||_audioContext.destination);
    osc.frequency.value=freq;
    gain.gain.setValueAtTime(0.35,_audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01,_audioContext.currentTime+dur);
    osc.start();osc.stop(_audioContext.currentTime+dur);
  }catch(e){}
}
function playFreqSweep(f1,f2,dur){
  try{
    initAudio();if(!_audioContext)return;
    const osc=_audioContext.createOscillator();
    const gain=_audioContext.createGain();
    osc.connect(gain);gain.connect(_masterOut||_audioContext.destination);
    osc.frequency.setValueAtTime(f1,_audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2,_audioContext.currentTime+dur);
    gain.gain.setValueAtTime(0.4,_audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01,_audioContext.currentTime+dur);
    osc.start();osc.stop(_audioContext.currentTime+dur);
  }catch(e){}
}
function playChord(freqs,dur){
  try{
    initAudio();if(!_audioContext)return;
    freqs.forEach(f=>{
      const osc=_audioContext.createOscillator();
      const gain=_audioContext.createGain();
      osc.connect(gain);gain.connect(_masterOut||_audioContext.destination);
      osc.frequency.value=f;
      gain.gain.setValueAtTime(0.22,_audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01,_audioContext.currentTime+dur);
      osc.start();osc.stop(_audioContext.currentTime+dur);
    });
  }catch(e){}
}
function playNoise(dur){
  try{
    initAudio();if(!_audioContext)return;
    const bufferSize=_audioContext.sampleRate*dur;
    const buffer=_audioContext.createBuffer(1,bufferSize,_audioContext.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++)data[i]=Math.random()*2-1;
    const source=_audioContext.createBufferSource();
    const gain=_audioContext.createGain();
    source.buffer=buffer;
    source.connect(gain);gain.connect(_masterOut||_audioContext.destination);
    gain.gain.setValueAtTime(0.22,_audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01,_audioContext.currentTime+dur);
    source.start();
  }catch(e){}
}
// === Biopunk Audio Helpers ===
function playWetImpact(freq,dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  var bs=Math.floor(ctx.sampleRate*dur);var bf=ctx.createBuffer(1,bs,ctx.sampleRate);
  var d=bf.getChannelData(0);for(var i=0;i<bs;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/bs,4);
  var s=ctx.createBufferSource();var g=ctx.createGain();var bq=ctx.createBiquadFilter();
  s.buffer=bf;bq.type='lowpass';bq.frequency.value=freq*8;bq.Q.value=3;
  s.connect(bq);bq.connect(g);g.connect(_masterOut||ctx.destination);
  g.gain.setValueAtTime(0.22,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.start();
  var o=ctx.createOscillator();var og=ctx.createGain();
  o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*0.3,t+dur);
  og.gain.setValueAtTime(0.18,t);og.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(og);og.connect(_masterOut||ctx.destination);o.start();o.stop(t+dur+0.01);}catch(e){}
}
function playGlassNote(freq,dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  var o=ctx.createOscillator();var g=ctx.createGain();
  o.type='triangle';o.frequency.value=freq;
  g.gain.setValueAtTime(0.14,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(_masterOut||ctx.destination);o.start();o.stop(t+dur+0.01);
  var o2=ctx.createOscillator();var g2=ctx.createGain();
  o2.type='triangle';o2.frequency.value=freq*1.003;var dt=t+0.12;
  g2.gain.setValueAtTime(0.06,dt);g2.gain.exponentialRampToValueAtTime(0.001,dt+dur*0.5);
  o2.connect(g2);g2.connect(_masterOut||ctx.destination);o2.start(dt);o2.stop(dt+dur*0.5+0.01);}catch(e){}
}
function playSubDrop(dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  var o=ctx.createOscillator();var g=ctx.createGain();
  o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(25,t+dur);
  g.gain.setValueAtTime(0.28,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(_masterOut||ctx.destination);o.start();o.stop(t+dur+0.01);}catch(e){}
}
function playChoirStab(freqs,dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  freqs.forEach(function(f){
    var o=ctx.createOscillator();var g=ctx.createGain();var bq=ctx.createBiquadFilter();
    o.type='sawtooth';o.frequency.value=f;o.detune.value=(Math.random()-0.5)*15;
    bq.type='bandpass';bq.frequency.value=f*3;bq.Q.value=2;
    o.connect(bq);bq.connect(g);g.connect(_masterOut||ctx.destination);
    g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime(0.08,t+dur*0.15);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.start();o.stop(t+dur+0.01);
  });}catch(e){}
}
function playReverseSwell(freq,dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  var o=ctx.createOscillator();var g=ctx.createGain();
  o.type='triangle';o.frequency.value=freq;
  g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime(0.16,t+dur*0.85);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(_masterOut||ctx.destination);o.start();o.stop(t+dur+0.01);}catch(e){}
}
function playMembraneStretch(dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  var bs=Math.floor(ctx.sampleRate*dur);var bf=ctx.createBuffer(1,bs,ctx.sampleRate);
  var d=bf.getChannelData(0);for(var i=0;i<bs;i++)d[i]=(Math.random()*2-1)*Math.pow(Math.sin(i/bs*Math.PI),2)*0.5;
  var s=ctx.createBufferSource();var g=ctx.createGain();var bq=ctx.createBiquadFilter();
  s.buffer=bf;bq.type='bandpass';bq.frequency.value=400;bq.Q.value=5;
  s.connect(bq);bq.connect(g);g.connect(_masterOut||ctx.destination);
  g.gain.setValueAtTime(0.14,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.start();}catch(e){}
}
// 强化版冲击 — 用于 P0 核心反馈（暴击/死亡/附身），比 playWetImpact 响 ~2.4x
function playLoudImpact(freq,dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  var bs=Math.floor(ctx.sampleRate*dur);var bf=ctx.createBuffer(1,bs,ctx.sampleRate);
  var d=bf.getChannelData(0);for(var i=0;i<bs;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/bs,3);
  var s=ctx.createBufferSource();var g=ctx.createGain();var bq=ctx.createBiquadFilter();
  s.buffer=bf;bq.type='lowpass';bq.frequency.value=freq*8;bq.Q.value=4;
  s.connect(bq);bq.connect(g);g.connect(_masterOut||ctx.destination);
  g.gain.setValueAtTime(0.45,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.start();
  var o=ctx.createOscillator();var og=ctx.createGain();
  o.type='sine';o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*0.3,t+dur);
  og.gain.setValueAtTime(0.35,t);og.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(og);og.connect(_masterOut||ctx.destination);o.start();o.stop(t+dur+0.01);}catch(e){}
}
function playLoudSub(dur){
  try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;
  var o=ctx.createOscillator();var g=ctx.createGain();
  o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(28,t+dur);
  g.gain.setValueAtTime(0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(_masterOut||ctx.destination);o.start();o.stop(t+dur+0.01);}catch(e){}
}
sounds={
  hit:()=>{try{playWetImpact(100,0.06);}catch(e){}},
  // P0 强化：暴击 — 加重低频冲击 + 高频玻璃刺
  crit:()=>{try{playLoudImpact(160,0.12);setTimeout(()=>{playGlassNote(660,0.14);},30);}catch(e){}},
  heal:()=>{try{playReverseSwell(440,0.3);setTimeout(()=>playGlassNote(660,0.12),200);}catch(e){}},
  // P0 强化：死亡 — 双层 sub-drop + 厚重合唱
  death:()=>{try{playLoudSub(0.6);setTimeout(()=>playLoudImpact(60,0.15),60);setTimeout(()=>playChoirStab([110,138,165],1.0),200);setTimeout(()=>playChoirStab([130,165,196],0.8),350);}catch(e){}},
  // P0 强化：附身 — 加重 swell + 多层冲击
  possess:()=>{try{playReverseSwell(200,0.35);setTimeout(()=>{playLoudImpact(85,0.14);playLoudSub(0.25);},280);setTimeout(()=>{playChoirStab([220,277,330],0.7);playChoirStab([330,440,554],0.5);},500);}catch(e){}},
  move:()=>{try{initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;var bs=Math.floor(ctx.sampleRate*0.02);var bf=ctx.createBuffer(1,bs,ctx.sampleRate);var d=bf.getChannelData(0);for(var i=0;i<bs;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/bs,6);var s=ctx.createBufferSource();var g=ctx.createGain();var bq=ctx.createBiquadFilter();s.buffer=bf;bq.type='bandpass';bq.frequency.value=600;bq.Q.value=4;s.connect(bq);bq.connect(g);g.connect(_masterOut||ctx.destination);g.gain.setValueAtTime(0.1,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.02);s.start();}catch(e){}},
  trait:()=>{try{playGlassNote(500,0.1);}catch(e){}},
  possessFail:()=>{try{playSubDrop(0.15);initAudio();if(!_audioContext)return;var ctx=_audioContext;var t=ctx.currentTime;var bs=Math.floor(ctx.sampleRate*0.1);var bf=ctx.createBuffer(1,bs,ctx.sampleRate);var d=bf.getChannelData(0);for(var i=0;i<bs;i++)d[i]=(Math.random()*2-1);var s=ctx.createBufferSource();var g=ctx.createGain();var bq=ctx.createBiquadFilter();s.buffer=bf;bq.type='highpass';bq.frequency.value=3000;s.connect(bq);bq.connect(g);g.connect(_masterOut||ctx.destination);g.gain.setValueAtTime(0.16,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);s.start();}catch(e){}},
  comboUp:()=>{try{playGlassNote(600,0.08);setTimeout(()=>playGlassNote(800,0.08),60);setTimeout(()=>playGlassNote(1000,0.08),120);}catch(e){}},
  comboBreak:()=>{try{playSubDrop(0.15);playWetImpact(60,0.08);}catch(e){}},
  pickup:()=>{try{playGlassNote(660,0.06);setTimeout(()=>playGlassNote(880,0.06),50);}catch(e){}},
  boss:()=>{try{playSubDrop(0.6);setTimeout(()=>playChoirStab([110,138,165],0.8),200);setTimeout(()=>playWetImpact(60,0.2),600);}catch(e){}},
  levelUp:()=>{try{playGlassNote(440,0.08);setTimeout(()=>playGlassNote(550,0.08),80);setTimeout(()=>{playGlassNote(660,0.12);playChoirStab([330,440,550],0.4);},160);}catch(e){}},
  shop:()=>{try{playGlassNote(660,0.06);setTimeout(()=>playGlassNote(880,0.06),60);}catch(e){}},
  floorUp:()=>{try{playReverseSwell(300,0.3);setTimeout(()=>playGlassNote(600,0.15),250);}catch(e){}},
  floorDown:()=>{try{playSubDrop(0.3);}catch(e){}},
  alert:()=>{try{playGlassNote(700,0.05);setTimeout(()=>playGlassNote(900,0.05),60);}catch(e){}},
  error:()=>{try{playSubDrop(0.1);playWetImpact(50,0.08);}catch(e){}},
  defend:()=>{try{playMembraneStretch(0.12);}catch(e){}},
  evade:()=>{try{playReverseSwell(600,0.1);}catch(e){}},
  memory:()=>{try{playGlassNote(523.25,0.8);setTimeout(()=>playGlassNote(440,0.6),400);setTimeout(()=>playGlassNote(392,0.5),700);setTimeout(()=>playChoirStab([261,330,392],1.0),900);}catch(e){}},
  bossDefeat:()=>{try{playChoirStab([220,277,330],0.25);setTimeout(()=>playChoirStab([330,440,554],0.35),180);setTimeout(()=>playGlassNote(880,0.2),420);}catch(e){}},
  achievement:()=>{try{playGlassNote(523,0.08);setTimeout(()=>playGlassNote(660,0.08),70);setTimeout(()=>playGlassNote(880,0.15),140);}catch(e){}},
  formSwap:()=>{try{playReverseSwell(520,0.12);setTimeout(()=>playGlassNote(740,0.08),80);}catch(e){}},
  evolve:()=>{try{playReverseSwell(300,0.25);setTimeout(()=>playChoirStab([220,277,330],0.45),220);setTimeout(()=>playGlassNote(660,0.15),360);}catch(e){}},
  pollutionWarn:()=>{try{playSubDrop(0.12);setTimeout(()=>playGlassNote(320,0.08),100);}catch(e){}},
  slotsFull:()=>{try{playWetImpact(70,0.08);setTimeout(()=>playSubDrop(0.1),40);}catch(e){}}
};
// "啊哈时刻"视觉反馈：屏幕快闪 + 中央徽章
function flashAhaMoment(text,color){
  try{
    color=color||'#ffd700';
    var fl=document.createElement('div');
    fl.style.cssText='position:fixed;inset:0;background:radial-gradient(circle,'+color+'33 0%,transparent 70%);pointer-events:none;z-index:9998;animation:ptAhaFlash 0.5s ease-out forwards';
    document.body.appendChild(fl);
    setTimeout(()=>{try{fl.remove();}catch(e){}},520);
    if(text){
      var bg=document.createElement('div');
      bg.textContent=text;
      bg.style.cssText='position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) scale(0.6);color:'+color+';font-size:28px;font-weight:bold;text-shadow:0 0 16px '+color+',0 0 30px '+color+';pointer-events:none;z-index:9999;opacity:0;animation:ptAhaBadge 1.4s ease-out forwards;letter-spacing:2px';
      document.body.appendChild(bg);
      setTimeout(()=>{try{bg.remove();}catch(e){}},1500);
    }
    if(!document.getElementById('pt-aha-style')){
      var st=document.createElement('style');st.id='pt-aha-style';
      st.textContent='@keyframes ptAhaFlash{0%{opacity:0}30%{opacity:1}100%{opacity:0}}@keyframes ptAhaBadge{0%{opacity:0;transform:translate(-50%,-50%) scale(0.6)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}60%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-80%) scale(1)}}';
      document.head.appendChild(st);
    }
  }catch(e){}
}
function startBGMusic(){
  try{
    initAudio();if(!_audioContext)return;
    var ctx=_audioContext;
    var fl=(typeof game!=='undefined'&&game&&game.floor)||1;
    var zone=Math.min(4,Math.floor((fl-1)/10));
    // 已经在播且 zone 没变，不重启（避免 1.5s 静默缺口）
    if(_bgMusicOsc&&_bgMusicZone===zone)return;
    // zone 变了，先停旧的（带淡出）
    if(_bgMusicOsc)stopBGMusic();
    var master=ctx.createGain();master.connect(_masterOut||ctx.destination);
    master.gain.setValueAtTime(0,ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.28,ctx.currentTime+1.5);
    _bgMusicGain=master;
    _bgMusicZone=zone;
    try{_setZoneIR(zone);}catch(e){}

    // === 连续旋律 BGM：小调四和弦循环 + 五声音阶旋律（柔和、不刺耳）===
    // 进行：i - VI - III - VII（每和弦 4.8s，整圈 ~19s）
    var progressions=[
      [[220,261.63,329.63],[174.61,220,261.63],[261.63,329.63,392],[196,246.94,293.66]],
      [[196,233.08,293.66],[155.56,196,233.08],[233.08,293.66,349.23],[174.61,220,261.63]],
      [[174.61,207.65,261.63],[138.59,174.61,207.65],[207.65,261.63,311.13],[155.56,196,233.08]],
      [[164.81,196,246.94],[130.81,164.81,196],[196,246.94,293.66],[146.83,185,220]],
      [[146.83,174.61,220],[116.54,146.83,174.61],[174.61,220,261.63],[130.81,164.81,196]]
    ];
    var chords=progressions[zone];
    var pentatonics=[
      [[440,493.88,523.25,659.25,739.99],[349.23,392,440,523.25,587.33],[523.25,587.33,659.25,783.99,880],[392,440,493.88,587.33,659.25]],
      [[392,440,466.16,587.33,659.25],[311.13,349.23,392,466.16,523.25],[466.16,523.25,587.33,698.46,783.99],[349.23,392,440,523.25,587.33]],
      [[349.23,392,415.3,523.25,587.33],[277.18,311.13,349.23,415.3,466.16],[415.3,466.16,523.25,622.25,698.46],[311.13,349.23,392,466.16,523.25]],
      [[329.63,369.99,392,493.88,554.37],[261.63,293.66,329.63,392,440],[392,440,493.88,587.33,659.25],[293.66,329.63,369.99,440,493.88]],
      [[293.66,329.63,349.23,440,493.88],[233.08,261.63,293.66,349.23,392],[349.23,392,440,523.25,587.33],[261.63,293.66,329.63,392,440]]
    ];
    var pents=pentatonics[zone];
    var beat=0.6;
    var beatsPerChord=8;
    var loopBeats=beatsPerChord*4;
    var t=ctx.currentTime+0.5;
    var beatIdx=0;
    // 持续 sub bass（始终响、形成"连续感"）
    var sub=ctx.createOscillator();var subG=ctx.createGain();
    sub.type='sine';sub.frequency.value=chords[0][0]*0.5;
    subG.gain.value=0.10;sub.connect(subG);subG.connect(master);sub.start();
    var subLfo=ctx.createOscillator();var subLfoG=ctx.createGain();
    subLfo.type='sine';subLfo.frequency.value=0.08;subLfoG.gain.value=0.02;
    subLfo.connect(subLfoG);subLfoG.connect(subG.gain);subLfo.start();
    function chordPad(t,notes){
      for(var i=0;i<notes.length;i++){
        var f=notes[i];
        var o=ctx.createOscillator();var g=ctx.createGain();
        o.type='triangle';o.frequency.value=f;
        g.gain.setValueAtTime(0.0001,t);
        g.gain.linearRampToValueAtTime(0.06,t+0.6);
        g.gain.setValueAtTime(0.06,t+beat*beatsPerChord-0.4);
        g.gain.exponentialRampToValueAtTime(0.0001,t+beat*beatsPerChord+0.6);
        o.connect(g);g.connect(master);
        o.start(t);o.stop(t+beat*beatsPerChord+0.7);
        var o2=ctx.createOscillator();var g2=ctx.createGain();
        o2.type='sine';o2.frequency.value=f*0.5;
        g2.gain.setValueAtTime(0.0001,t);
        g2.gain.linearRampToValueAtTime(0.04,t+0.8);
        g2.gain.setValueAtTime(0.04,t+beat*beatsPerChord-0.4);
        g2.gain.exponentialRampToValueAtTime(0.0001,t+beat*beatsPerChord+0.6);
        o2.connect(g2);g2.connect(master);
        o2.start(t);o2.stop(t+beat*beatsPerChord+0.7);
      }
    }
    function bassPluck(t,f){
      var o=ctx.createOscillator();var g=ctx.createGain();
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(0.13,t+0.04);
      g.gain.exponentialRampToValueAtTime(0.0001,t+beat*1.8);
      o.connect(g);g.connect(master);
      o.start(t);o.stop(t+beat*2);
    }
    function melodyNote(t,f){
      var o=ctx.createOscillator();var g=ctx.createGain();
      o.type='triangle';o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(0.05,t+0.04);
      g.gain.exponentialRampToValueAtTime(0.0001,t+beat*1.5);
      o.connect(g);g.connect(master);
      o.start(t);o.stop(t+beat*1.6);
      var oe=ctx.createOscillator();var ge=ctx.createGain();
      oe.type='sine';oe.frequency.value=f;
      ge.gain.setValueAtTime(0.0001,t+beat*0.5);
      ge.gain.linearRampToValueAtTime(0.018,t+beat*0.55);
      ge.gain.exponentialRampToValueAtTime(0.0001,t+beat*1.5);
      oe.connect(ge);ge.connect(master);
      oe.start(t+beat*0.5);oe.stop(t+beat*1.6);
    }
    var prevMel=2;
    var _lastPollExp=(typeof game!=='undefined'&&game&&game.player&&game.player.pollution)||0;
    function sched(){
      if(!_bgMusicOsc)return;
      // 防爆发：若主线程长时间被卡（如后台后回前台），t 会远落后于 currentTime
      // 一次性补齐会产生几十个和弦同时响 → 把 t 拉回当前时间附近
      if(t<ctx.currentTime){t=ctx.currentTime+0.1;}
      // 污染骤升 sting（探索时也响）
      var _pl=(typeof game!=='undefined'&&game&&game.player)||null;
      var _poll=_pl?(_pl.pollution||0):0;
      if(_poll-_lastPollExp>=3){
        try{
          var _now=ctx.currentTime;
          var _ot=ctx.createOscillator();var _og=ctx.createGain();
          _ot.type='triangle';
          _ot.frequency.setValueAtTime(330,_now);
          _ot.frequency.exponentialRampToValueAtTime(550,_now+0.30);
          _og.gain.setValueAtTime(0.0001,_now);
          _og.gain.linearRampToValueAtTime(0.04,_now+0.05);
          _og.gain.exponentialRampToValueAtTime(0.0001,_now+0.35);
          _ot.connect(_og);_og.connect(master);
          _ot.start(_now);_ot.stop(_now+0.38);
        }catch(e){}
      }
      _lastPollExp=_poll;
      while(t<ctx.currentTime+1.5){
        var localBeat=beatIdx%loopBeats;
        var chordIdx=Math.floor(localBeat/beatsPerChord);
        var posInChord=localBeat%beatsPerChord;
        if(posInChord===0)chordPad(t,chords[chordIdx]);
        if(posInChord===0||posInChord===4)bassPluck(t,chords[chordIdx][0]*0.5);
        if(posInChord===2||posInChord===6){
          var pent=pents[chordIdx];
          var step=prevMel+[-1,0,0,1,1][Math.floor(Math.random()*5)];
          step=Math.max(0,Math.min(pent.length-1,step));
          prevMel=step;
          melodyNote(t,pent[step]);
        }
        beatIdx++;t+=beat;
      }
      _bgmTimers.push(setTimeout(sched,300));
    }
    _bgMusicOsc={drone:sub,heart:null,heartLfo:null,sub:sub,subLfo:subLfo};
    _bgmTimers=[];
    sched();
  }catch(e){}
}
var _bgmTimer=null;var _bgmTimers=[];
var _combatBgmOsc=null;var _combatBgmTimer=null;
function startCombatBGM(){
  try{
    stopBGMusic();
    initAudio();if(!_audioContext||_combatBgmOsc)return;
    var ctx=_audioContext;
    // === 战斗"打开"全局柔化滤波：高频回来 + sidechain 群组pump ===
    // 探索时 lp=4200/peak=-6（柔），战斗时 lp=7200/peak=-2（鲜活），结束恢复
    if(_softFilter&&_softMode){
      try{
        var _nt=ctx.currentTime;
        _softFilter.lp.frequency.cancelScheduledValues(_nt);
        _softFilter.lp.frequency.linearRampToValueAtTime(7200,_nt+0.35);
        _softFilter.peak.gain.cancelScheduledValues(_nt);
        _softFilter.peak.gain.linearRampToValueAtTime(-2,_nt+0.35);
      }catch(e){}
    }
    var master=ctx.createGain();
    // pump：插在 master 与 _masterOut 之间，鼓点踩下时短暂 duck，营造律动呼吸
    var pump=ctx.createGain();pump.gain.setValueAtTime(1,ctx.currentTime);
    master.connect(pump);pump.connect(_masterOut||ctx.destination);
    master.gain.setValueAtTime(0,ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.30,ctx.currentTime+0.4);
    var zone=Math.min(4,Math.floor(((game.floor||1)-1)/10));
    // BOSS 检测：进 BOSS 战切到不和谐三全音进行 + 慢 8% BPM（更沉重）
    var isBoss=false;
    try{isBoss=!!(game.target&&game.target.type&&(''+game.target.type).indexOf('boss')>=0);}catch(e){}
    var bpm=isBoss?Math.round((110+zone*8)*0.92):110+zone*8;
    var beat=60/bpm;
    // === 战斗 BGM：同一和声 + 推进鼓 + 连续低音（驱动感但不嘈杂）===
    var progressions=[
      [[220,261.63,329.63],[174.61,220,261.63],[261.63,329.63,392],[196,246.94,293.66]],
      [[196,233.08,293.66],[155.56,196,233.08],[233.08,293.66,349.23],[174.61,220,261.63]],
      [[174.61,207.65,261.63],[138.59,174.61,207.65],[207.65,261.63,311.13],[155.56,196,233.08]],
      [[164.81,196,246.94],[130.81,164.81,196],[196,246.94,293.66],[146.83,185,220]],
      [[146.83,174.61,220],[116.54,146.83,174.61],[174.61,220,261.63],[130.81,164.81,196]]
    ];
    // BOSS 进行：根音 + 小三度 + 三全音（#4）+ 小七度。每个和弦都自带"不对劲"
    // 三全音是中世纪被禁的"魔鬼音程"，天然制造威胁感
    var bossProgressions=[
      [[220,261.63,311.13,392],[207.65,246.94,293.66,369.99],[233.08,277.18,329.63,415.3],[196,233.08,277.18,349.23]],
      [[196,233.08,277.18,349.23],[185,220,261.63,329.63],[207.65,246.94,293.66,369.99],[174.61,207.65,246.94,311.13]],
      [[174.61,207.65,246.94,311.13],[164.81,196,233.08,293.66],[185,220,261.63,329.63],[155.56,185,220,277.18]],
      [[164.81,196,233.08,293.66],[155.56,185,220,277.18],[174.61,207.65,246.94,311.13],[146.83,174.61,207.65,261.63]],
      [[146.83,174.61,207.65,261.63],[138.59,164.81,196,246.94],[155.56,185,220,277.18],[130.81,155.56,185,233.08]]
    ];
    var chords=(isBoss?bossProgressions:progressions)[zone];
    var beatsPerChord=4;var loopBeats=beatsPerChord*4;
    var t=ctx.currentTime+0.05;var beatIdx=0;
    var sub=ctx.createOscillator();var subG=ctx.createGain();
    sub.type='sine';sub.frequency.value=chords[0][0]*0.5;
    subG.gain.value=0.09;sub.connect(subG);subG.connect(master);sub.start();
    // === 紧张层：随污染/低血量动态变化的锯齿 drone + 可调 lowpass cutoff ===
    var tense=ctx.createOscillator();var tenseG=ctx.createGain();var tenseBq=ctx.createBiquadFilter();
    tense.type='sawtooth';tense.frequency.value=chords[0][0];
    tenseBq.type='lowpass';tenseBq.frequency.value=400;tenseBq.Q.value=2;
    tense.connect(tenseBq);tenseBq.connect(tenseG);tenseG.connect(master);
    tenseG.gain.setValueAtTime(0,ctx.currentTime);
    tense.start();
    // 共享 click buffer + 共享 bandpass filter（避免 kick 高频触发时重复分配）
    var _clickBuf=null,_clickFilter=null;
    try{
      var _bs=Math.floor(ctx.sampleRate*0.012);
      _clickBuf=ctx.createBuffer(1,_bs,ctx.sampleRate);
      var _cd=_clickBuf.getChannelData(0);
      for(var _ci=0;_ci<_bs;_ci++)_cd[_ci]=(Math.random()*2-1)*Math.pow(1-_ci/_bs,3);
      _clickFilter=ctx.createBiquadFilter();
      _clickFilter.type='bandpass';_clickFilter.frequency.value=1800;_clickFilter.Q.value=1.5;
      _clickFilter.connect(master);
    }catch(e){}
    function kick(t){
      // sidechain pump：踩下瞬间 master 群组 duck 22%，120ms 释放 → 律动感
      try{
        pump.gain.cancelScheduledValues(t);
        pump.gain.setValueAtTime(1,t);
        pump.gain.linearRampToValueAtTime(0.78,t+0.020);
        pump.gain.linearRampToValueAtTime(1,t+0.18);
      }catch(e){}
      var o=ctx.createOscillator();var g=ctx.createGain();
      o.type='sine';
      o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(40,t+0.1);
      g.gain.setValueAtTime(0.32,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.20);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+0.22);
      // 短噪声 click 头：复用共享 buffer + filter，每次只新建一个 BufferSource + Gain
      if(_clickBuf&&_clickFilter)try{
        var s=ctx.createBufferSource();var ng=ctx.createGain();
        s.buffer=_clickBuf;
        s.connect(ng);ng.connect(_clickFilter);
        ng.gain.setValueAtTime(0.07,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.04);
        s.start(t);
      }catch(e){}
    }
    function bossRumble(t){
      // BOSS 和弦边界的低频 timpani 撞击：60→25Hz 缓 sweep + 噪声短头
      var o=ctx.createOscillator();var g=ctx.createGain();
      o.type='sine';
      o.frequency.setValueAtTime(60,t);o.frequency.exponentialRampToValueAtTime(25,t+0.6);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(0.22,t+0.04);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.8);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+0.85);
      // 短噪声头模拟槌头撞击
      try{
        var bs=Math.floor(ctx.sampleRate*0.04);
        var bf=ctx.createBuffer(1,bs,ctx.sampleRate);
        var d=bf.getChannelData(0);
        for(var i=0;i<bs;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/bs,3);
        var s=ctx.createBufferSource();var ng=ctx.createGain();var nbq=ctx.createBiquadFilter();
        s.buffer=bf;nbq.type='lowpass';nbq.frequency.value=180;
        s.connect(nbq);nbq.connect(ng);ng.connect(master);
        ng.gain.setValueAtTime(0.10,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.05);
        s.start(t);
      }catch(e){}
    }
    function alarmPulse(t){
      // 低血警报：从 square 880 改为 triangle 440 + 弱二次谐波，去掉刺耳齿声
      var o=ctx.createOscillator();var g=ctx.createGain();
      o.type='triangle';o.frequency.value=440;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(0.05,t+0.04);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.22);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+0.24);
    }
    function bassPluck(t,f){
      var o=ctx.createOscillator();var g=ctx.createGain();
      o.type='triangle';o.frequency.value=f;
      g.gain.setValueAtTime(0.001,t);
      g.gain.linearRampToValueAtTime(0.14,t+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,t+beat*0.85);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+beat);
    }
    function chordPad(t,notes){
      for(var i=0;i<notes.length;i++){
        var f=notes[i];
        var o=ctx.createOscillator();var g=ctx.createGain();var bq=ctx.createBiquadFilter();
        o.type='triangle';o.frequency.value=f;
        bq.type='lowpass';bq.frequency.value=2200;bq.Q.value=0.7;
        o.connect(bq);bq.connect(g);g.connect(master);
        g.gain.setValueAtTime(0.0001,t);
        g.gain.linearRampToValueAtTime(0.05,t+0.15);
        g.gain.setValueAtTime(0.05,t+beat*beatsPerChord-0.15);
        g.gain.exponentialRampToValueAtTime(0.0001,t+beat*beatsPerChord+0.2);
        o.start(t);o.stop(t+beat*beatsPerChord+0.25);
      }
    }
    var _lastPoll=(typeof game!=='undefined'&&game&&game.player&&game.player.pollution)||0;
    function sched(){
      if(!_combatBgmOsc)return;
      if(t<ctx.currentTime){t=ctx.currentTime+0.05;}
      // 读当前状态计算紧张度（每 80ms 更新一次）
      var pl=(typeof game!=='undefined'&&game&&game.player)||null;
      var poll=pl?(pl.pollution||0):0;
      var hpRatio=pl&&pl.maxHp?pl.hp/pl.maxHp:1;
      var lowHp=hpRatio<0.30;
      var intensity=Math.max(0,Math.min(1,poll/100));
      var lowHpBoost=lowHp?0.20:0;
      var totalIntensity=Math.min(1,intensity+lowHpBoost);
      // 动态调 master / tense drone / 滤波器
      try{
        var nowT=ctx.currentTime;
        master.gain.cancelScheduledValues(nowT);
        master.gain.setValueAtTime(master.gain.value,nowT);
        master.gain.linearRampToValueAtTime(0.30+totalIntensity*0.10,nowT+0.4);
        tenseG.gain.cancelScheduledValues(nowT);
        tenseG.gain.setValueAtTime(tenseG.gain.value,nowT);
        tenseG.gain.linearRampToValueAtTime(totalIntensity*0.06,nowT+0.4);
        tenseBq.frequency.cancelScheduledValues(nowT);
        tenseBq.frequency.setValueAtTime(tenseBq.frequency.value,nowT);
        tenseBq.frequency.linearRampToValueAtTime(400+totalIntensity*1800,nowT+0.4);
      }catch(e){}
      // 污染骤升 sting：单次涨 ≥3 触发（柔化：triangle 440→660，gain 减半）
      if(poll-_lastPoll>=3){
        try{
          var ot=ctx.createOscillator();var og=ctx.createGain();
          ot.type='triangle';
          ot.frequency.setValueAtTime(440,nowT);
          ot.frequency.exponentialRampToValueAtTime(660,nowT+0.25);
          og.gain.setValueAtTime(0.0001,nowT);
          og.gain.linearRampToValueAtTime(0.05,nowT+0.04);
          og.gain.exponentialRampToValueAtTime(0.0001,nowT+0.30);
          ot.connect(og);og.connect(master);
          ot.start(nowT);ot.stop(nowT+0.32);
        }catch(e){}
      }
      _lastPoll=poll;
      while(t<ctx.currentTime+0.6){
        var lb=beatIdx%loopBeats;
        var ci=Math.floor(lb/beatsPerChord);
        var p=lb%beatsPerChord;
        if(p===0)chordPad(t,chords[ci]);
        // BOSS：每个和弦边界 timpani 撞击
        if(isBoss&&p===0)bossRumble(t);
        // 高强度时鼓点加密：每拍踢，否则维持 0/2
        if(totalIntensity>0.55||p===0||p===2)kick(t);
        bassPluck(t,chords[ci][0]*0.5);
        bassPluck(t+beat*0.5,chords[ci][2]*0.5);
        // 低血时每个和弦边界播警报脉冲
        if(lowHp&&p===0)alarmPulse(t);
        beatIdx++;t+=beat;
      }
      _combatBgmTimer=setTimeout(sched,80);
    }
    _combatBgmOsc={drone:sub,lfo:null,master:master,tense:tense};sched();
  }catch(e){}
}
function stopCombatBGM(){
  if(_combatBgmOsc){
    // 战斗结束：把全局柔化滤波恢复到探索基线
    if(_softFilter&&_softMode&&_audioContext){
      try{
        var _nt=_audioContext.currentTime;
        _softFilter.lp.frequency.cancelScheduledValues(_nt);
        _softFilter.lp.frequency.linearRampToValueAtTime(4200,_nt+0.5);
        _softFilter.peak.gain.cancelScheduledValues(_nt);
        _softFilter.peak.gain.linearRampToValueAtTime(-6,_nt+0.5);
      }catch(e){}
    }
    // 先把 master 拉到 0，掐掉所有已 schedule 的 chord/kick/bass 残留（~2s 重叠音）
    if(_combatBgmOsc.master&&_audioContext){
      try{
        var _now=_audioContext.currentTime;
        _combatBgmOsc.master.gain.cancelScheduledValues(_now);
        _combatBgmOsc.master.gain.setValueAtTime(_combatBgmOsc.master.gain.value,_now);
        _combatBgmOsc.master.gain.linearRampToValueAtTime(0,_now+0.15);
      }catch(e){}
    }
    try{_combatBgmOsc.drone.stop();}catch(e){}
    try{_combatBgmOsc.tense&&_combatBgmOsc.tense.stop();}catch(e){}
    try{_combatBgmOsc.lfo&&_combatBgmOsc.lfo.stop();}catch(e){}
  }
  _combatBgmOsc=null;
  if(_combatBgmTimer){clearTimeout(_combatBgmTimer);_combatBgmTimer=null;}
}
// === 序幕BGM：黑暗神秘氛围（低频drone + 不规则脉冲 + 微弱低语）===
var _prologueBgm=null;
var _prologueBgmTimers=[];
function startPrologueBGM(){
  try{
    if(_audioMuted)return;
    initAudio();if(!_audioContext||_prologueBgm)return;
    var ctx=_audioContext;
    var master=ctx.createGain();master.connect(_masterOut||ctx.destination);
    master.gain.setValueAtTime(0,ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.35,ctx.currentTime+2.5);
    _prologueBgm={master:master,oscs:[]};
    // 低频drone：55Hz正弦
    var drone=ctx.createOscillator();var dg=ctx.createGain();
    drone.type='sine';drone.frequency.value=55;dg.gain.value=0.35;
    drone.connect(dg);dg.connect(master);drone.start();
    _prologueBgm.oscs.push(drone);
    // 缓慢频率颤动
    var droneLfo=ctx.createOscillator();var droneLfoG=ctx.createGain();
    droneLfo.type='sine';droneLfo.frequency.value=0.08;droneLfoG.gain.value=3;
    droneLfo.connect(droneLfoG);droneLfoG.connect(drone.frequency);droneLfo.start();
    _prologueBgm.oscs.push(droneLfo);
    // 副drone：82.41Hz（小三度和声）
    var drone2=ctx.createOscillator();var dg2=ctx.createGain();
    drone2.type='sine';drone2.frequency.value=82.41;dg2.gain.value=0.2;
    drone2.connect(dg2);dg2.connect(master);drone2.start();
    _prologueBgm.oscs.push(drone2);
    // 高频气氛层（sawtooth 带通滤波）
    var pad=ctx.createOscillator();var padG=ctx.createGain();var padBq=ctx.createBiquadFilter();
    pad.type='sawtooth';pad.frequency.value=164.81;pad.detune.value=5;
    padBq.type='bandpass';padBq.frequency.value=800;padBq.Q.value=4;
    padG.gain.value=0.05;
    pad.connect(padBq);padBq.connect(padG);padG.connect(master);pad.start();
    _prologueBgm.oscs.push(pad);
    // 脉冲心跳（不规则间隔）
    function schedPulse(){
      if(!_prologueBgm)return;
      var pulseT=ctx.currentTime+0.02;
      var o=ctx.createOscillator();var g=ctx.createGain();
      o.type='sine';o.frequency.value=38;
      g.gain.setValueAtTime(0.001,pulseT);
      g.gain.linearRampToValueAtTime(0.4,pulseT+0.04);
      g.gain.exponentialRampToValueAtTime(0.001,pulseT+0.6);
      o.connect(g);g.connect(master);
      o.start(pulseT);o.stop(pulseT+0.7);
      var nextDelay=1800+Math.random()*1800;
      _prologueBgmTimers.push(setTimeout(schedPulse,nextDelay));
    }
    _prologueBgmTimers.push(setTimeout(schedPulse,1500));
    // 偶发高频"低语"（bandpass噪声模拟）
    function schedWhisper(){
      if(!_prologueBgm)return;
      var wT=ctx.currentTime+0.02;
      var buf=ctx.createBuffer(1,ctx.sampleRate*1.5,ctx.sampleRate);
      var data=buf.getChannelData(0);
      for(var i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*0.6;
      var noise=ctx.createBufferSource();noise.buffer=buf;
      var nbq=ctx.createBiquadFilter();nbq.type='bandpass';
      nbq.frequency.value=1200+Math.random()*800;nbq.Q.value=8;
      var ng=ctx.createGain();ng.gain.value=0;
      noise.connect(nbq);nbq.connect(ng);ng.connect(master);
      ng.gain.linearRampToValueAtTime(0.08,wT+0.4);
      ng.gain.linearRampToValueAtTime(0.001,wT+1.4);
      noise.start(wT);noise.stop(wT+1.5);
      _prologueBgmTimers.push(setTimeout(schedWhisper,6000+Math.random()*5000));
    }
    _prologueBgmTimers.push(setTimeout(schedWhisper,4000));
  }catch(e){}
}
function stopPrologueBGM(){
  if(!_prologueBgm)return;
  try{
    var ctx=_audioContext;
    if(ctx&&_prologueBgm.master){
      _prologueBgm.master.gain.cancelScheduledValues(ctx.currentTime);
      _prologueBgm.master.gain.setValueAtTime(_prologueBgm.master.gain.value,ctx.currentTime);
      _prologueBgm.master.gain.linearRampToValueAtTime(0,ctx.currentTime+0.6);
    }
    var oscs=_prologueBgm.oscs;
    setTimeout(function(){oscs.forEach(function(o){try{o.stop();}catch(e){}});},700);
  }catch(e){}
  _prologueBgm=null;
  if(_prologueBgmTimers.length){_prologueBgmTimers.forEach(function(t){clearTimeout(t);});_prologueBgmTimers=[];}
}
function stopAllAudioTimers(){
  stopBGMusic();
  stopCombatBGM();
  if(_heartbeatInterval){clearInterval(_heartbeatInterval);_heartbeatInterval=null;}
  if(_whisperInterval){clearInterval(_whisperInterval);_whisperInterval=null;}
  if(_glitchInterval){clearInterval(_glitchInterval);_glitchInterval=null;}
  if(_ambientOsc){try{_ambientOsc.stop();}catch(e){}_ambientOsc=null;}
}
function stopBGMusic(){
  if(_bgMusicOsc){
    // master 拉到 0，干掉未来 ~5s 的 chord/bass/melody 残留尾音
    if(_bgMusicGain&&_audioContext){
      try{
        var _now=_audioContext.currentTime;
        _bgMusicGain.gain.cancelScheduledValues(_now);
        _bgMusicGain.gain.setValueAtTime(_bgMusicGain.gain.value,_now);
        _bgMusicGain.gain.linearRampToValueAtTime(0,_now+0.2);
      }catch(e){}
    }
    try{_bgMusicOsc.sub&&_bgMusicOsc.sub.stop();}catch(e){}
    try{_bgMusicOsc.subLfo&&_bgMusicOsc.subLfo.stop();}catch(e){}
  }
  _bgMusicOsc=null;
  _bgMusicGain=null;
  _bgMusicZone=-1;
  if(_bgmTimer){clearTimeout(_bgmTimer);_bgmTimer=null;}
  if(_bgmTimers&&_bgmTimers.length){_bgmTimers.forEach(function(t){clearTimeout(t);});_bgmTimers=[];}
}
function updateAmbient(){
  try{
    initAudio();if(!_audioContext)return;
    const pol=game.player.pollution;
    if(pol<31){
      if(_ambientOsc){try{_ambientOsc.stop();}catch(e){}_ambientOsc=null;}
      if(_heartbeatInterval){clearInterval(_heartbeatInterval);_heartbeatInterval=null;}
      if(_whisperInterval){clearInterval(_whisperInterval);_whisperInterval=null;}
      if(_glitchInterval){clearInterval(_glitchInterval);_glitchInterval=null;}
      return;
    }
    if(pol>=31&&pol<=50){
      if(!_ambientOsc){
        _ambientOsc=_audioContext.createOscillator();
        const gain=_audioContext.createGain();
        _ambientOsc.connect(gain);gain.connect(_masterOut||_audioContext.destination);
        _ambientOsc.frequency.value=40;gain.gain.value=0.04;_ambientOsc.start();
      }
      if(!_heartbeatInterval){
        _heartbeatInterval=setInterval(()=>{
          playTone(100,0.08);setTimeout(()=>playTone(100,0.08),360);
        },1200);
      }
    }
    if(pol>=51&&pol<=75){
      if(_heartbeatInterval){clearInterval(_heartbeatInterval);_heartbeatInterval=null;}
      if(!_whisperInterval){
        _whisperInterval=setInterval(()=>{
          playFreqSweep(150+Math.random()*100,200+Math.random()*150,0.5+Math.random()*0.5);
        },6000+Math.random()*4000);
      }
    }else if(_whisperInterval&&(pol<51||pol>75)){
      clearInterval(_whisperInterval);_whisperInterval=null;
    }
    if(pol>=76&&pol<=99){
      if(_whisperInterval){clearInterval(_whisperInterval);_whisperInterval=null;}
      if(!_glitchInterval){
        _glitchInterval=setInterval(()=>{
          playNoise(0.04+Math.random()*0.06);
          if(Math.random()<0.15)playFreqSweep(600,80,0.18);
        },1800+Math.random()*1800);
      }
    }else if(_glitchInterval&&(pol<76||pol>99)){
      clearInterval(_glitchInterval);_glitchInterval=null;
    }
  }catch(e){}
}
function showTraitEffect(traitName,color='#00ffd0'){
  try{sounds.trait();}catch(e){}
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px;font-weight:bold;color:'+color+';text-shadow:0 0 20px '+color+';animation:traitPop 0.8s ease-out;pointer-events:none;z-index:9999';
  overlay.textContent=traitName;
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),800);
}

// === 用户音量控制（设置面板使用）===
function setMasterVolume(v){
  v=Math.max(0,Math.min(2.5,parseFloat(v)||0));
  _userVolume=v;
  try{localStorage.setItem('pt_volume',String(v));}catch(e){}
  if(_userVolumeGain&&_audioContext){
    try{
      var now=_audioContext.currentTime;
      _userVolumeGain.gain.cancelScheduledValues(now);
      _userVolumeGain.gain.setValueAtTime(_userVolumeGain.gain.value,now);
      _userVolumeGain.gain.linearRampToValueAtTime(v,now+0.08);
    }catch(e){}
  }
}
function getMasterVolume(){return _userVolume;}

// === 柔和模式：开/关全局低通 + 削峰滤波 ===
function setSoftMode(on){
  _softMode=!!on;
  try{localStorage.setItem('pt_soft',_softMode?'1':'0');}catch(e){}
  if(_softFilter&&_audioContext){
    try{
      var t=_audioContext.currentTime;
      _softFilter.lp.frequency.cancelScheduledValues(t);
      _softFilter.lp.frequency.linearRampToValueAtTime(_softMode?4200:14000,t+0.15);
      _softFilter.peak.gain.cancelScheduledValues(t);
      _softFilter.peak.gain.linearRampToValueAtTime(_softMode?-6:0,t+0.15);
    }catch(e){}
  }
}
function getSoftMode(){return _softMode;}

// === 击杀静音：怪物倒下瞬间整体音量 duck 0.8s，把"收割"从音流里切出来 ===
try{
  if(typeof GameEvents!=='undefined'&&GameEvents&&GameEvents.on){
    GameEvents.on('monster:kill',function(){
      if(!_audioContext||!_breathGain)return;
      try{
        var now=_audioContext.currentTime;
        _breathGain.gain.cancelScheduledValues(now);
        _breathGain.gain.setValueAtTime(_breathGain.gain.value,now);
        // 快速 duck → 静默 0.5s → 缓慢恢复
        _breathGain.gain.linearRampToValueAtTime(0.05,now+0.05);
        _breathGain.gain.setValueAtTime(0.05,now+0.55);
        _breathGain.gain.linearRampToValueAtTime(1.0,now+0.95);
      }catch(e){}
    });
  }
}catch(e){}
