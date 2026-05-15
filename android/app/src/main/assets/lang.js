(function(){
'use strict';

var dict = {
  en: {
    '继续游戏':'Continue','新游戏':'New Game','跳过':'Skip',
    '一次迭代':'One Iteration','完整递归':'Full Recursion',
    '进入深渊':'Enter the Abyss',
    '选 择 职 业':'SELECT CLASS','开始游戏':'Start Game',
    '随机':'Random','对比':'Compare','关闭':'Close','返回':'Back',
    '攻击':'Attack','防御':'Defend','附身':'Possess','逃跑':'Flee',
    '潜行':'Stealth','冲刺':'Sprint','终极':'Ultimate',
    '预计受伤':'Est. Damage','附身成功率':'Possess Rate',
    '菜单':'Menu','进化':'Evolution','商店':'Shop',
    '形态羁绊':'Affinity','污染技能':'P-Skills',
    '锚点管理':'Anchors','保存游戏':'Save Game',
    '成就':'Achievements','记忆档案':'Archive',
    '设置':'Settings','退出重开':'Restart',
    '音效已关闭':'Sound Off','音效已开启':'Sound On',
    '音量':'Volume',
    '点击开启':'Tap to enable','点击关闭':'Tap to disable',
    '导出存档':'Export Save','导入存档':'Import Save',
    '隐私政策':'Privacy','返回菜单':'Back to Menu',
    '已复制到剪贴板':'Copied to clipboard',
    '基础补给':'Supplies','净化保命':'Purify & Survive',
    '形态成长':'Form Growth','信息优势':'Intel Advantage',
    '已满':'Sold Out','已激活':'Active','EP不足':'Low EP',
    '战斗开始':'Battle Start','游戏已保存':'Game Saved',
    '自动保存':'Auto Save','确定':'OK','取消':'Cancel',
    '确认':'Confirm','继续旅程':'Continue',
    '固化记忆':'Solidify Memory','形态槽已满':'Slots Full',
    '需200EP':'Need 200EP',
    '继续战斗':'Continue Fight','打开':'Open','饮用':'Drink',
    '忽略':'Ignore','搜索':'Search','读取':'Read',
    '破坏':'Destroy','注射':'Inject','丢弃':'Discard',
    '帮助':'Help','拒绝':'Refuse','知道了':'Got it',
    '楼层导航':'Floor Nav','净化祭坛':'Purify Altar',
    '已选中':'Selected','安全':'Safe',
    '再来一次':'Retry','返回主页':'Home',
    '暂无记录，完成一次短局即可上榜':'No records yet. Complete a short run to appear here.',
    '无数据可分享':'No data to share',
    '战绩已复制，可分享到社交媒体':'Result copied. Share it!',
    '结局已复制，可分享到社交媒体':'Ending copied. Share it!',
    '复制失败，请手动复制':'Copy failed. Please copy manually.',
    '分享':'Share','排行榜':'Leaderboard',
    '你想以哪种方式，坠入深渊？':'How will you fall into the abyss?',
    '12 层坠落 · 15 分钟':'12 Floors · 15 min',
    '50 层深渊 · 约 2 小时':'50 Floors · ~2 hrs',
    '“快速燃烧，不留痕迹”':'“Burn fast, leave no trace”',
    '“每一层都是你吞噬的记忆”':'“Every floor is a memory devoured”',
    '污染':'Pollution','进化点':'EP',
    '接触':'Touch','威胁':'Threaten','模仿':'Mimic','承诺':'Promise',
    '意识信号衰减':'Signal fading',
    '选择你的策略':'Choose your strategy',
    '选择你的命运':'Choose your fate',
    '形态库':'Forms','当前形态':'Current',
    '切换为战斗形态':'Switch to battle form',
    '释放此形态':'Release this form',
    '确认释放此形态？':'Release this form?',
    '孤狼模式已激活':'Lone Wolf activated',
    '濒死转移':'Death Transfer',
    '返回起点':'Return to Start',
    '形态同化':'Form Assimilated',
    '怪物图鉴':'Bestiary',
    '已收集':'Collected',
    '🏆 成就':'🏆 Achievements',
    '⛯ 净化祭坛':'⛯ Purify Altar',
    '⛯ 职业转换祭坛':'⛯ Class Transfer Altar',
    '⚗ 诅咒祭坛':'⚗ Curse Altar',
    '🧬 寄生本能':'🧬 Parasite Instinct',
    '⚠️ 确认退出':'⚠️ Confirm Restart',
    '🌀 选择存在形式':'🌀 Choose Your Form',
    '✕ 取消':'✕ Cancel',
    '获取奖励':'Claim Reward',
    '还没准备好...继续探索':'Not ready... keep exploring',
    '每日挑战':'Daily Challenge',
    '开始':'Start',
    '伤害=(怪ATK-你DEF)×回合 | 附身率与残血比正相关':'DMG=(MonATK-YourDEF)×Turns | Possess rate scales with low HP',
    '存档管理':'Save Manager',
    '记忆档案':'Archive',
    '图鉴':'Bestiary','档案':'Archive','排行':'Ranks','存档':'Saves',
    '你每夺走一个身体，就离自己更远一步。':'Every body you take pulls you further from yourself.',
    '关闭':'Close',
    '血族':'Blood','机甲':'Mech',
    '商城':'Shop','职业':'Classes','皮肤':'Skins',
    '解锁':'Unlock','已解锁':'Unlocked','已装备':'Equipped',
    '装备':'Equip','预览':'Preview','前往商城':'Go to Shop',
    '需要解锁DLC':'DLC Required',
    '退出游戏':'Exit Game','保存并退出':'Save & Exit','不保存（重开）':'Discard & Restart',
    '赌博型：攻击吸血 · HP越低越强 · 高风险高回报':'Gambler: Lifesteal · Low HP = High ATK · High Risk High Reward',
    '爆发型：护盾叠加 · 污染转化伤害 · 均衡稳健':'Burst: Shield Stack · Pollution→DMG · Balanced',
    '血月狂宴':'Blood Moon Feast','过载核心':'Overload Core',
    '默认':'Default','点击攻击！':'Tap Attack!',
    '尝试附身获取能力！':'Try possessing for abilities!',
    '防御可减半伤害':'Defend halves damage',
    '打不过？试试逃跑':'Can\'t win? Try fleeing',

    // ===== 短局结算报告 (modes/short.js) =====
    '— 迭代终止报告 —':'— ITERATION REPORT —',
    '意识覆写':'Consciousness Override',
    '时间终止':'Time Expired',
    '你已经不是你了。但"你"还记得。':'You are no longer you. But "you" still remembers.',
    '时间吞噬了一切。但你的痕迹还在。':'Time devoured everything. But your traces remain.',
    '未知':'Unknown',
    '附身次数':'Possessions',
    '击杀数':'Kills',
    '抵达层数':'Floors',
    '存活时长':'Survival',
    '最久宿主':'Best Host',
    '最高污染':'Max Pollution',
    '最终形态':'Final Form',
    '秒 存活':' sec survived',
    '秒存活':' sec',
    '第一浪':'Wave 1','第二浪':'Wave 2','第三浪':'Wave 3',
    'ECHO · 残响':'ECHO',
    '基础':'Base','通关':'Clear','今日':'Daily','里程碑':'Milestone','累计':'Total',
    '📷 海报':'📷 Poster','🏅 排行榜':'🏅 Ranks',
    '返回主页':'Home',

    // ===== 海报 (poster-share.js) =====
    '◈  结  局  ◈':'◈  ENDING  ◈',
    '◈  成 就 解 锁  ◈':'◈  ACHIEVEMENT  ◈',
    '到达楼层':'Floor Reached',
    '最 终 数 据':'FINAL DATA',
    '我的结局——你的呢？':'My ending. What\'s yours?',
    '你也来一局？':'Wanna try?',
    '迭代 #':'Iteration #',
    '用时':'Time','附身':'Possess','击杀':'Kills','楼层':'Floor',
    '海报生成失败':'Failed to generate poster',
    '海报预览':'Poster Preview',
    '长按图片即可保存到相册分享':'Long-press image to save & share',
    '已生成海报，请选择分享渠道':'Poster generated, choose a share channel',
    '你也是我':'You Are Me',
    '结局':'Ending',
    // 分享文本前缀
    '🌀 你也是我 · ':'🌀 You Are Me · ',
    '🧬 你也是我 短局 · ':'🧬 You Are Me Short · ',
    '🏆 你也是我 成就解锁：':'🏆 You Are Me Achievement: ',
    '分':'m','秒':'s',

    // ===== showResume / 继续旅程弹窗 =====
    '第 ':'Iteration #','次迭代':'',
    '🧬 盗窃次数：':'🧬 Possessions: ',
    '⏱ 存活时长：':'⏱ Survival: ',
    '🏆 最久宿主：':'🏆 Best Host: ',
    '☢ 最高污染：':'☢ Max Pollution: ',
    '💀 最终形态：':'💀 Final Form: ',
    '"你的第':'"Your iteration #',
    '次迭代值得被记住"':' deserves to be remembered."',
    '继续':'Continue',
    '无数据可分享':'No data to share',
    '战绩已复制，可分享到社交媒体':'Record copied, share to social media',

    // ===== 职业名 (classColors.*.name) =====
    '泰坦':'Titan','幽灵':'Ghost','虫群':'Swarm','血族':'Blood','机甲':'Mech',

    // ===== death cause label =====
    '宿主崩坏':'Host Collapse',
    '身体先于意识消散。':'The body dissolved before the mind did.',
    '☢ 污染指数：100%':'☢ POLLUTION: 100%',
    '宿主意识已被完全覆写':'Host consciousness fully overwritten',
    '⏱ 15:00 → 00:00':'⏱ 15:00 → 00:00',
    '时间耗尽':'Time expired',
    '💀 HP 0/MAX':'💀 HP 0/MAX',
    '宿主躯体彻底崩坏':'Host body has fully collapsed',
    '当前寄生链路已中断，战斗结构失稳。':'Parasite link severed. Combat structure destabilized.',
    '系统正在回收本次迭代残响。':'System is reclaiming echoes from this iteration.',
    '结束本局并查看战绩':'End run & view report'
  }
};

window.PT_LANG = {
  _current: localStorage.getItem('pt_lang') || 'zh',
  _dict: dict,

  t: function(zh){
    if(this._current === 'zh') return zh;
    var d = this._dict[this._current];
    return (d && d[zh]) || zh;
  },

  set: function(lang){
    this._current = lang;
    try{ localStorage.setItem('pt_lang', lang); }catch(e){}
    this._applyLang();
  },

  toggle: function(){
    this.set(this._current === 'zh' ? 'en' : 'zh');
  },

  _applyLang: function(){
    var els = document.querySelectorAll('[data-t]');
    for(var i=0; i<els.length; i++){
      var zh = els[i].getAttribute('data-t');
      els[i].textContent = this.t(zh);
    }
  }
};

window.t = function(s){ return PT_LANG.t(s); };

})();
