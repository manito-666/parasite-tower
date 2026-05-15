// data.js — 纯数据定义，从 index.html 提取
// Block A: 商店/职业/怪物
const shopItems=[
// 基础补给
{name:'生命药水',cost:150,desc:'恢复50%生命(每次涨价)',type:'heal',cat:'supply',priceScale:1.3},
{name:'力量药剂',cost:300,desc:'+2攻击(每次涨价)',type:'atk',cat:'supply',maxBuy:5,priceScale:1.4},
{name:'护甲强化',cost:300,desc:'+2防御(每次涨价)',type:'def',cat:'supply',maxBuy:5,priceScale:1.4},
{name:'生命精华',cost:350,desc:'+8%最大生命(每次涨价)',type:'maxhp',cat:'supply',maxBuy:5,priceScale:1.5},
// 净化保命
{name:'污染压制',cost:300,desc:'污染-20',type:'purify_small',cat:'survival'},
{name:'污染净化',cost:1200,desc:'污染清零',type:'purify_full',cat:'survival'},
{name:'崩溃抵抗',cost:2000,desc:'下次污染100时自动清醒',type:'collapse_resist',cat:'survival'},
{name:'死亡复活',cost:2500,desc:'下次死亡保留形态不回滚',type:'death_revive',cat:'survival'},
// 形态成长
{name:'形态记忆槽',cost:2000,desc:'可携带形态+1',type:'form_slot',cat:'growth'},
{name:'形态固化',cost:800,desc:'当前形态死亡后仍保留1次',type:'form_lock',cat:'growth'},
{name:'人类强化',cost:3000,desc:'基础人类ATK+5/DEF+3',type:'human_enhance',cat:'growth'},
// 信息优势
{name:'地图扫描',cost:300,desc:'显示本层出口位置',type:'map_scan',cat:'info'},
{name:'怪物解析',cost:150,desc:'查看地图上所有怪物属性',type:'monster_scan',cat:'info'},
// 高层回血道具
{name:'生物共生体',cost:600,desc:'战斗中每回合恢复3%HP',type:'regen_combat',cat:'supply',minZone:3},
{name:'菌膜修复液',cost:1000,desc:'恢复100%HP',type:'full_heal',cat:'supply',minZone:4},
{name:'寄生再生核',cost:2500,desc:'永久：战斗中每回合回复5%HP',type:'perm_regen',cat:'growth',minZone:4}
];
// ================================================================
// 三职业系统
// ================================================================
const classBaseStats={
  swarm: {hp:35,maxHp:35,atk:4,def:1,fogRadius:6},
  titan: {hp:45,maxHp:45,atk:3,def:3,fogRadius:5},
  ghost: {hp:28,maxHp:28,atk:5,def:1,fogRadius:7},
  blood: {hp:32,maxHp:32,atk:6,def:1,fogRadius:6},
  mech:  {hp:40,maxHp:40,atk:4,def:2,fogRadius:4}
};
const classColors={
  titan:{primary:'#4488cc',highlight:'#88ccff',glow:'#00c8ff',bg:'#0d1a2e',name:'泰坦',icon:'🪨'},
  ghost:{primary:'#cc44cc',highlight:'#ff88ff',glow:'#ff006e',bg:'#1a0d1a',name:'幽灵',icon:'👻'},
  swarm:{primary:'#44cc88',highlight:'#88ffcc',glow:'#00ffd0',bg:'#0d1a14',name:'虫群',icon:'🦗'},
  blood:{primary:'#cc0022',highlight:'#ff4466',glow:'#ff0033',bg:'#1a0808',name:'血族',icon:'🩸'},
  mech:{primary:'#ff8800',highlight:'#ffbb44',glow:'#ffaa00',bg:'#1a1408',name:'机甲',icon:'⚙️'}
};
const classUltimates={
  titan:{name:'泰坦之怒',icon:'💥',desc:'HP×1.5 ATK+15 DEF+15，持续10回合',cooldown:3,duration:10},
  ghost:{name:'虚空行者',icon:'👻',desc:'无敌5回合(不能攻击)，结束后暴击×5',cooldown:3,duration:5},
  swarm:{name:'虫群之心',icon:'🦗',desc:'释放污染/10只分身，继承80%属性',cooldown:3,duration:10},
  blood:{name:'血月狂宴',icon:'🩸',desc:'全攻击100%吸血，每回合-5HP，持续8回合',cooldown:3,duration:8},
  mech:{name:'过载核心',icon:'⚙️',desc:'污染×3转护盾+污染×2 AOE伤害，清零污染',cooldown:4,duration:1}
};
const evolutionPaths={
titan:[
{name:'铁壁',cost:200,desc:'防御+3',effect:{def:3}},
{name:'巨力',cost:500,desc:'攻击+5，生命+60',effect:{atk:5,maxHp:60}},
{name:'再生',cost:1000,desc:'每层恢复12%生命',effect:{regen:0.12}},
{name:'不屈',cost:1800,desc:'生命+100，防御+5，受伤-8%',effect:{maxHp:100,def:5,dmgReduce:0.08}},
{name:'泰坦之躯',cost:3200,desc:'生命+150，攻击+10，防御+8',effect:{maxHp:150,atk:10,def:8}}
],
ghost:[
{name:'虚化',cost:200,desc:'受到伤害-8%',effect:{dmgReduce:0.08}},
{name:'吸取',cost:500,desc:'攻击回复15%伤害',effect:{lifesteal:0.15}},
{name:'相位',cost:1000,desc:'附身成功率+12%',effect:{possessBonus:0.12}},
{name:'暗影',cost:1800,desc:'攻击+10，受伤-12%',effect:{atk:10,dmgReduce:0.12}},
{name:'幽灵形态',cost:3200,desc:'攻击+15，吸血25%，附身+15%',effect:{atk:15,lifesteal:0.25,possessBonus:0.15}}
],
swarm:[
{name:'毒刺',cost:200,desc:'攻击+3，造成额外8%伤害',effect:{atk:3,extraDmg:0.08}},
{name:'群体',cost:600,desc:'击败怪物额外获得3进化点',effect:{bonusEvo:3}},
{name:'寄生',cost:1200,desc:'附身成功率+10%，污染+5变为+3',effect:{possessBonus:0.1,pollutionReduce:2}},
{name:'虫群',cost:2000,desc:'攻击+10，额外伤害15%',effect:{atk:10,extraDmg:0.15}},
{name:'虫群意志',cost:3500,desc:'攻击+12，额外伤害20%，击败+5点',effect:{atk:12,extraDmg:0.2,bonusEvo:5}}
],
blood:[
{name:'鲜血渴望',cost:200,desc:'攻击吸血10%',effect:{lifesteal:0.10}},
{name:'血祭',cost:500,desc:'攻击+5，HP低于50%时攻击+30%',effect:{atk:5,lowHpBonus:0.3}},
{name:'血池',cost:1000,desc:'击杀恢复25%最大HP',effect:{killHeal:0.25}},
{name:'血脉觉醒',cost:1800,desc:'攻击+8，吸血+15%',effect:{atk:8,lifesteal:0.15}},
{name:'不死血王',cost:3200,desc:'攻击+12，吸血30%，HP<20%免死一次',effect:{atk:12,lifesteal:0.30,deathImmune:true}}
],
mech:[
{name:'纳米护盾',cost:200,desc:'每层获得20护盾',effect:{shieldPerFloor:20}},
{name:'过载充能',cost:500,desc:'攻击+4，护盾>50时攻击+20%',effect:{atk:4,shieldAtkBonus:0.2}},
{name:'污染转化器',cost:1000,desc:'污染+5变为+3，每10污染+1护盾',effect:{pollutionReduce:2,pollToShield:true}},
{name:'装甲强化',cost:1800,desc:'防御+6，护盾上限+80',effect:{def:6,shieldCap:80}},
{name:'终极兵器',cost:3200,desc:'攻击+10，防御+5，护盾满时双倍伤害',effect:{atk:10,def:5,shieldDoubleDmg:true}}
]
};
const monsterTemplates={
human:{name:'寄生体',maxHp:120,atk:8,def:6,traits:[],color:'#00c8a0',zone:0},
// T1 (zone 1, 1-10层): 人类形态能打，但附身更划算
rat:{name:'实验鼠',maxHp:45,atk:8,def:1,traits:['迅捷'],color:'#8b4513',zone:1},
roach:{name:'辐射蟑螂',maxHp:65,atk:7,def:3,traits:['厚皮'],color:'#654321',zone:1},
slime:{name:'失败体-α',maxHp:85,atk:11,def:2,traits:['再生'],color:'#32cd32',zone:1},
dog:{name:'看门犬',maxHp:110,atk:15,def:3,traits:['忠诚'],color:'#696969',zone:1},
gecko:{name:'壁虎变体',maxHp:55,atk:14,def:1,traits:['弹性'],color:'#7ccd7c',zone:1},
drone:{name:'故障无人机',maxHp:50,atk:11,def:4,traits:['电击'],color:'#4682b4',zone:1},
boss1:{name:'实验主管',maxHp:250,atk:24,def:7,traits:['领袖','再生'],color:'#aa0000',zone:1,ability:'berserk'},
// T2 (zone 2, 11-20层): 需附身T1才能稳过
wolf:{name:'培育狼',maxHp:140,atk:22,def:7,traits:['狂暴'],color:'#8b0000',zone:2},
spider:{name:'酸液蜘蛛',maxHp:120,atk:20,def:9,traits:['蛛网'],color:'#4a0000',zone:2},
bat:{name:'铁爪猴',maxHp:100,atk:26,def:4,traits:['吸血'],color:'#2a0a0a',zone:2,ability:'vampiric'},
wasp:{name:'变异黄蜂',maxHp:125,atk:24,def:5,traits:['毒素'],color:'#ffa500',zone:2},
guard:{name:'失控警卫',maxHp:180,atk:22,def:11,traits:['护甲'],color:'#555555',zone:2,ability:'armored'},
vine:{name:'绞缠藤蔓',maxHp:160,atk:20,def:12,traits:['再生','蛛网'],color:'#2e8b57',zone:2},
boss2:{name:'培育主管',maxHp:380,atk:34,def:14,traits:['反击','掠夺'],color:'#b8860b',zone:2},
// T3 (zone 3, 21-30层): 必须附身T2+策略
larva:{name:'实验体-Ω',maxHp:360,atk:45,def:18,traits:['再生'],color:'#9acd32',zone:3},
mantis:{name:'镰刀螳螂',maxHp:290,atk:52,def:14,traits:['暴击'],color:'#228b22',zone:3},
beetle:{name:'装甲甲虫',maxHp:400,atk:44,def:25,traits:['厚皮','护甲'],color:'#2f4f4f',zone:3,ability:'armored'},
worm:{name:'寄生蠕虫',maxHp:330,atk:48,def:16,traits:['寄生强化'],color:'#cd853f',zone:3},
moth:{name:'毒粉飞蛾',maxHp:250,atk:46,def:12,traits:['毒素'],color:'#dda0dd',zone:3,ability:'poison'},
scorpion:{name:'守卫者',maxHp:310,atk:56,def:22,traits:['毒素','护甲'],color:'#8b4513',zone:3,ability:'poison'},
hydra:{name:'多头蛇怪',maxHp:380,atk:50,def:18,traits:['再生+','撕裂'],color:'#556b2f',zone:3},
boss3:{name:'污染核心',maxHp:650,atk:70,def:26,traits:['再生','污染光环','多重攻击'],color:'#8b008b',zone:3},
// T4 (zone 4, 31-40层): 深渊区域
shade:{name:'暗影',maxHp:630,atk:78,def:20,traits:['相位'],color:'#191970',zone:4},
lurker:{name:'虚空潜伏者',maxHp:690,atk:86,def:22,traits:['相位','伏击'],color:'#000080',zone:4},
wraith:{name:'怨灵',maxHp:580,atk:82,def:16,traits:['不死','吸取'],color:'#483d8b',zone:4},
voidbeast:{name:'虚空兽',maxHp:780,atk:85,def:26,traits:['相位','狂暴'],color:'#1e1e3f',zone:4},
nightmare:{name:'梦魇',maxHp:710,atk:92,def:20,traits:['恐惧','吸取'],color:'#2f2f4f',zone:4},
watcher:{name:'深渊守望者',maxHp:830,atk:95,def:30,traits:['护甲','反击'],color:'#0f0f2f',zone:4},
voiddragon:{name:'虚空幼龙',maxHp:900,atk:100,def:24,traits:['相位','多重攻击'],color:'#1a1a3a',zone:4},
boss4:{name:'深渊领主',maxHp:1500,atk:112,def:36,traits:['相位','不死','多重攻击','恐惧'],color:'#000000',zone:4},
// T5 (zone 5, 41层+): 终极区域
titan:{name:'腐化泰坦',maxHp:1000,atk:112,def:40,traits:['护甲','再生'],color:'#2f4f2f',zone:5},
chaos:{name:'混沌之子',maxHp:900,atk:120,def:30,traits:['多重攻击','狂暴'],color:'#8b0000',zone:5},
deathknight:{name:'死亡骑士',maxHp:950,atk:128,def:35,traits:['不死','护甲','吸血'],color:'#1c1c1c',zone:5},
horror:{name:'远古恐惧',maxHp:1100,atk:124,def:32,traits:['恐惧','污染光环','吸取'],color:'#2a0a0a',zone:5},
colossus:{name:'虚空巨像',maxHp:1300,atk:118,def:45,traits:['护甲','相位','反击'],color:'#0a0a1a',zone:5},
plague:{name:'瘟疫使者',maxHp:1000,atk:130,def:30,traits:['毒素','污染光环','爆炸'],color:'#556b2f',zone:5},
origin:{name:'原初寄生体',maxHp:1800,atk:135,def:38,traits:['再生','多重攻击','召唤','污染光环'],color:'#4a0a4a',zone:5},
boss5:{name:'真实形态',maxHp:2500,atk:140,def:45,traits:['不死','相位','多重攻击','再生','狂暴'],color:'#0a0a0a',zone:5}
};

// 43个怪物独特剪影路径（归一化坐标 0-1，绘制时缩放到实际尺寸）
// 每个怪物：body=主体路径, extras=附加元素(触须/翅膀等), eye=眼睛位置, glow=发光色
const monsterSilhouettes={
human:{body:'M.5,.1Q.42,.1.38,.16L.38,.28Q.38,.34.44,.36L.5,.37L.56,.36Q.62,.34.62,.28L.62,.16Q.58,.1.5,.1Z M.38,.37L.3,.42L.25,.7L.32,.72L.42,.5L.5,.85L.58,.5L.68,.72L.75,.7L.7,.42L.62,.37Z',extras:[],eye:[[.46,.22],[.54,.22]],glow:'#00ffd0'},
// T1 区域1
rat:{body:'M.3,.2Q.2,.3.15,.5L.2,.8Q.4,.95.6,.9L.8,.75Q.85,.5.8,.3L.65,.15Q.5,.1.3,.2Z',extras:[{type:'tail',d:'M.8,.75Q.95,.8 1,.6'}],eye:[[.4,.35]],glow:'#00ffd0'},
roach:{body:'M.2,.3Q.15,.5.2,.7L.3,.85Q.5,.95.7,.85L.8,.7Q.85,.5.8,.3L.7,.2Q.5,.15.3,.2L.2,.3Z',extras:[{type:'leg',d:'M.2,.45L.05,.35'},{type:'leg',d:'M.2,.6L.05,.7'},{type:'leg',d:'M.8,.45L.95,.35'},{type:'leg',d:'M.8,.6L.95,.7'}],eye:[[.4,.35],[.6,.35]],glow:'#8b6914'},
slime:{body:'M.5,.15Q.2,.15.15,.45Q.1,.7.25,.85Q.4,.95.5,.9Q.6,.95.75,.85Q.9,.7.85,.45Q.8,.15.5,.15Z',extras:[{type:'drip',d:'M.3,.88Q.32,.98.35,.92'},{type:'drip',d:'M.65,.9Q.68,1 .7,.93'}],eye:[[.38,.4],[.58,.4]],glow:'#32cd32'},
dog:{body:'M.25,.2L.15,.1Q.1,.08.08,.15L.2,.35Q.15,.5.2,.7L.3,.85Q.5,.92.7,.85L.8,.7Q.85,.5.8,.35L.92,.15Q.9,.08.85,.1L.75,.2Q.6,.15.4,.15L.25,.2Z',extras:[{type:'tail',d:'M.8,.7Q.95,.65 1,.5'}],eye:[[.35,.3],[.6,.3]],glow:'#aaa'},
gecko:{body:'M.5,.1Q.3,.1.2,.25L.15,.45Q.15,.65.25,.8L.4,.9Q.5,.92.6,.9L.75,.8Q.85,.65.85,.45L.8,.25Q.7,.1.5,.1Z',extras:[{type:'leg',d:'M.2,.4L.02,.3'},{type:'leg',d:'M.2,.65L.02,.75'},{type:'leg',d:'M.8,.4L.98,.3'},{type:'leg',d:'M.8,.65L.98,.75'},{type:'tail',d:'M.5,.92Q.55,1 .6,.95'}],eye:[[.38,.3],[.62,.3]],glow:'#7ccd7c'},
drone:{body:'M.5,.15L.75,.3L.85,.5L.75,.7L.5,.85L.25,.7L.15,.5L.25,.3Z',extras:[{type:'prop',d:'M.25,.3Q.1,.15.15,.3'},{type:'prop',d:'M.75,.3Q.9,.15.85,.3'}],eye:[[.5,.45]],glow:'#4682b4'},
boss1:{body:'M.3,.1L.2,.25Q.1,.4.15,.55L.2,.75Q.3,.9.5,.95Q.7,.9.8,.75L.85,.55Q.9,.4.8,.25L.7,.1Q.6,.05.5,.08Q.4,.05.3,.1Z',extras:[{type:'spike',d:'M.3,.1L.25,.02'},{type:'spike',d:'M.5,.08L.5,0'},{type:'spike',d:'M.7,.1L.75,.02'},{type:'aura',d:'M.15,.5Q.05,.5.1,.4'},{type:'aura',d:'M.85,.5Q.95,.5.9,.4'}],eye:[[.38,.3],[.62,.3]],glow:'#ff2200'},
// T2 区域2
wolf:{body:'M.35,.1L.15,.05Q.08,.08.1,.2L.2,.35Q.12,.55.18,.75L.3,.9Q.5,.97.7,.9L.82,.75Q.88,.55.8,.35L.9,.2Q.92,.08.85,.05L.65,.1Q.55,.15.45,.15L.35,.1Z',extras:[{type:'fang',d:'M.35,.55L.3,.65'},{type:'fang',d:'M.65,.55L.7,.65'}],eye:[[.35,.25],[.65,.25]],glow:'#ff3030'},
spider:{body:'M.5,.2Q.35,.2.25,.35L.2,.55Q.25,.75.4,.85Q.5,.9.6,.85Q.75,.75.8,.55L.75,.35Q.65,.2.5,.2Z',extras:[{type:'leg',d:'M.25,.35L.02,.15'},{type:'leg',d:'M.2,.5L0,.45'},{type:'leg',d:'M.2,.65L.02,.8'},{type:'leg',d:'M.22,.75L.08,.92'},{type:'leg',d:'M.75,.35L.98,.15'},{type:'leg',d:'M.8,.5L1,.45'},{type:'leg',d:'M.8,.65L.98,.8'},{type:'leg',d:'M.78,.75L.92,.92'}],eye:[[.38,.32],[.48,.3],[.52,.3],[.62,.32]],glow:'#8800aa'},
bat:{body:'M.5,.2Q.4,.18.35,.25L.3,.4Q.35,.6.4,.75Q.5,.85.6,.75Q.65,.6.7,.4L.65,.25Q.6,.18.5,.2Z',extras:[{type:'wing',d:'M.3,.35Q.1,.15.05,.4Q.08,.55.2,.55'},{type:'wing',d:'M.7,.35Q.9,.15.95,.4Q.92,.55.8,.55'}],eye:[[.42,.32],[.58,.32]],glow:'#cc0000'},
wasp:{body:'M.5,.12Q.38,.1.3,.2L.28,.35Q.3,.45.35,.5L.25,.7Q.3,.85.5,.9Q.7,.85.75,.7L.65,.5Q.7,.45.72,.35L.7,.2Q.62,.1.5,.12Z',extras:[{type:'wing',d:'M.35,.3Q.15,.1.1,.3'},{type:'wing',d:'M.65,.3Q.85,.1.9,.3'},{type:'sting',d:'M.5,.9L.5,1'}],eye:[[.42,.25],[.58,.25]],glow:'#ffa500'},
guard:{body:'M.25,.1L.2,.3Q.15,.5.2,.7L.25,.85Q.4,.95.6,.95Q.75,.85.8,.7Q.85,.5.8,.3L.75,.1Q.6,.05.5,.08Q.4,.05.25,.1Z',extras:[{type:'visor',d:'M.3,.25L.7,.25'},{type:'shoulder',d:'M.15,.35L.1,.4L.15,.5'},{type:'shoulder',d:'M.85,.35L.9,.4L.85,.5'}],eye:[[.42,.28],[.58,.28]],glow:'#7777cc'},
vine:{body:'M.5,.15Q.3,.12.2,.3L.15,.55Q.2,.75.35,.85Q.5,.92.65,.85Q.8,.75.85,.55L.8,.3Q.7,.12.5,.15Z',extras:[{type:'vine',d:'M.2,.4Q.05,.3 0,.45Q.05,.6.15,.55'},{type:'vine',d:'M.8,.4Q.95,.3 1,.45Q.95,.6.85,.55'},{type:'vine',d:'M.35,.85Q.3,.98.4,.95'},{type:'vine',d:'M.65,.85Q.7,.98.6,.95'}],eye:[[.4,.35],[.6,.35]],glow:'#2e8b57'},
boss2:{body:'M.3,.08L.15,.2Q.08,.35.1,.5L.15,.7Q.25,.88.5,.95Q.75,.88.85,.7L.9,.5Q.92,.35.85,.2L.7,.08Q.55,.02.5,.05Q.45,.02.3,.08Z',extras:[{type:'horn',d:'M.3,.08L.2,0'},{type:'horn',d:'M.7,.08L.8,0'},{type:'claw',d:'M.1,.5L0,.45'},{type:'claw',d:'M.9,.5L1,.45'}],eye:[[.38,.25],[.62,.25]],glow:'#ffaa00'},
// T3 区域3
larva:{body:'M.5,.1Q.3,.08.2,.2L.15,.4Q.12,.6.18,.78L.3,.9Q.5,.98.7,.9L.82,.78Q.88,.6.85,.4L.8,.2Q.7,.08.5,.1Z',extras:[{type:'seg',d:'M.2,.4L.8,.4'},{type:'seg',d:'M.18,.6L.82,.6'},{type:'seg',d:'M.2,.75L.8,.75'},{type:'feeler',d:'M.35,.1Q.3,0 .25,.05'},{type:'feeler',d:'M.65,.1Q.7,0 .75,.05'}],eye:[[.4,.25],[.6,.25]],glow:'#aaff00'},
mantis:{body:'M.5,.08L.35,.15Q.25,.2.2,.35L.22,.55Q.28,.75.4,.88Q.5,.92.6,.88Q.72,.75.78,.55L.8,.35Q.75,.2.65,.15L.5,.08Z',extras:[{type:'claw',d:'M.2,.35L.02,.15Q0,.1.05,.2'},{type:'claw',d:'M.8,.35L.98,.15Q1,.1.95,.2'},{type:'blade',d:'M.05,.2L0,.05'},{type:'blade',d:'M.95,.2L1,.05'}],eye:[[.4,.22],[.6,.22]],glow:'#00ff44'},
beetle:{body:'M.3,.15Q.15,.2.12,.35L.1,.55Q.12,.75.25,.88Q.4,.95.6,.95Q.75,.88.88,.75L.9,.55Q.88,.35.85,.2Q.75,.15.7,.15Q.55,.12.45,.12Q.35,.12.3,.15Z',extras:[{type:'shell',d:'M.5,.15L.5,.85'},{type:'horn',d:'M.4,.15L.35,.05'},{type:'horn',d:'M.6,.15L.65,.05'}],eye:[[.35,.3],[.65,.3]],glow:'#556677'},
worm:{body:'M.5,.08Q.35,.1.3,.22L.28,.4Q.25,.55.28,.68L.32,.8Q.42,.92.5,.95Q.58,.92.68,.8L.72,.68Q.75,.55.72,.4L.7,.22Q.65,.1.5,.08Z',extras:[{type:'ring',d:'M.28,.35L.72,.35'},{type:'ring',d:'M.26,.5L.74,.5'},{type:'ring',d:'M.28,.65L.72,.65'},{type:'ring',d:'M.32,.78L.68,.78'}],eye:[[.42,.2],[.58,.2]],glow:'#cd853f'},
moth:{body:'M.5,.15Q.4,.12.35,.2L.3,.35Q.32,.55.38,.7Q.5,.82.62,.7Q.68,.55.7,.35L.65,.2Q.6,.12.5,.15Z',extras:[{type:'wing',d:'M.3,.35Q.05,.2.02,.45Q.08,.65.25,.6'},{type:'wing',d:'M.7,.35Q.95,.2.98,.45Q.92,.65.75,.6'},{type:'antenna',d:'M.4,.15Q.35,.02.3,.05'},{type:'antenna',d:'M.6,.15Q.65,.02.7,.05'}],eye:[[.42,.28],[.58,.28]],glow:'#dd88dd'},
scorpion:{body:'M.5,.2Q.35,.18.25,.3L.2,.45Q.22,.6.3,.72L.4,.82Q.5,.88.6,.82L.7,.72Q.78,.6.8,.45L.75,.3Q.65,.18.5,.2Z',extras:[{type:'claw',d:'M.2,.4L.05,.3Q0,.25.05,.35'},{type:'claw',d:'M.8,.4L.95,.3Q1,.25.95,.35'},{type:'tail',d:'M.5,.88Q.55,.95.6,.98Q.65,1 .65,.92Q.62,.85.58,.88'},{type:'sting',d:'M.65,.92L.7,.85'}],eye:[[.4,.3],[.6,.3]],glow:'#cc6622'},
hydra:{body:'M.5,.25Q.35,.22.25,.35L.2,.5Q.25,.7.35,.82Q.5,.9.65,.82Q.75,.7.8,.5L.75,.35Q.65,.22.5,.25Z',extras:[{type:'head',d:'M.3,.25Q.2,.1.15,.15Q.12,.2.2,.25'},{type:'head',d:'M.5,.22Q.5,.05.45,.1Q.42,.15.48,.2'},{type:'head',d:'M.7,.25Q.8,.1.85,.15Q.88,.2.8,.25'}],eye:[[.4,.35],[.6,.35]],glow:'#668833'},
boss3:{body:'M.5,.08Q.25,.08.15,.25L.1,.45Q.1,.65.2,.82Q.35,.95.5,.98Q.65,.95.8,.82Q.9,.65.9,.45L.85,.25Q.75,.08.5,.08Z',extras:[{type:'tendril',d:'M.15,.4Q0,.35.05,.5'},{type:'tendril',d:'M.1,.6Q-.05,.65.05,.7'},{type:'tendril',d:'M.85,.4Q1,.35.95,.5'},{type:'tendril',d:'M.9,.6Q1.05,.65.95,.7'},{type:'vent',d:'M.3,.85Q.35,.98.4,.92'},{type:'vent',d:'M.7,.85Q.65,.98.6,.92'}],eye:[[.35,.3],[.5,.28],[.65,.3]],glow:'#ff00ff'},
// T4 区域4
shade:{body:'M.5,.1Q.3,.08.2,.25L.15,.5Q.18,.75.3,.88Q.5,.95.7,.88Q.82,.75.85,.5L.8,.25Q.7,.08.5,.1Z',extras:[{type:'wisp',d:'M.2,.6Q.08,.55.1,.7'},{type:'wisp',d:'M.8,.6Q.92,.55.9,.7'},{type:'wisp',d:'M.35,.88Q.3,1 .38,.95'}],eye:[[.5,.35]],glow:'#4444cc'},
lurker:{body:'M.5,.15Q.35,.12.25,.28L.18,.5Q.2,.72.32,.85Q.5,.95.68,.85Q.8,.72.82,.5L.75,.28Q.65,.12.5,.15Z',extras:[{type:'claw',d:'M.18,.45L.02,.35'},{type:'claw',d:'M.82,.45L.98,.35'},{type:'tendril',d:'M.32,.85Q.25,.98.35,.95'},{type:'tendril',d:'M.68,.85Q.75,.98.65,.95'}],eye:[[.4,.32],[.6,.32]],glow:'#3333aa'},
wraith:{body:'M.5,.1Q.32,.1.22,.3L.18,.55Q.22,.78.38,.9Q.5,.95.62,.9Q.78,.78.82,.55L.78,.3Q.68,.1.5,.1Z',extras:[{type:'wisp',d:'M.22,.7Q.1,.75.15,.85'},{type:'wisp',d:'M.78,.7Q.9,.75.85,.85'},{type:'wisp',d:'M.38,.9Q.35,1 .42,.97'},{type:'wisp',d:'M.62,.9Q.65,1 .58,.97'}],eye:[[.4,.3],[.6,.3]],glow:'#8866cc'},
voidbeast:{body:'M.5,.08Q.28,.08.18,.25L.1,.45Q.1,.68.22,.82Q.38,.95.5,.98Q.62,.95.78,.82Q.9,.68.9,.45L.82,.25Q.72,.08.5,.08Z',extras:[{type:'horn',d:'M.25,.15L.15,.02'},{type:'horn',d:'M.75,.15L.85,.02'},{type:'tendril',d:'M.1,.55L0,.5'},{type:'tendril',d:'M.9,.55L1,.5'}],eye:[[.38,.28],[.62,.28]],glow:'#5500cc'},
nightmare:{body:'M.5,.12Q.3,.1.2,.3L.15,.55Q.2,.78.35,.9Q.5,.95.65,.9Q.8,.78.85,.55L.8,.3Q.7,.1.5,.12Z',extras:[{type:'wisp',d:'M.15,.45Q.02,.35.05,.5'},{type:'wisp',d:'M.85,.45Q.98,.35.95,.5'},{type:'smoke',d:'M.35,.12Q.3,0 .25,.08'},{type:'smoke',d:'M.65,.12Q.7,0 .75,.08'}],eye:[[.42,.3],[.58,.3]],glow:'#9944ff'},
watcher:{body:'M.5,.08Q.3,.05.2,.2L.12,.4Q.1,.6.18,.78L.28,.9Q.45,.98.55,.98Q.72,.9.82,.78Q.9,.6.88,.4L.8,.2Q.7,.05.5,.08Z',extras:[{type:'plate',d:'M.12,.35L.05,.3L.08,.45'},{type:'plate',d:'M.88,.35L.95,.3L.92,.45'},{type:'spike',d:'M.28,.9L.22,.98'},{type:'spike',d:'M.72,.9L.78,.98'}],eye:[[.5,.3]],glow:'#0088ff'},
voiddragon:{body:'M.5,.05Q.3,.05.18,.18L.1,.38Q.08,.58.15,.75L.25,.88Q.4,.98.5,.98Q.6,.98.75,.88L.85,.75Q.92,.58.9,.38L.82,.18Q.7,.05.5,.05Z',extras:[{type:'wing',d:'M.18,.3Q0,.12.02,.4Q.05,.55.15,.5'},{type:'wing',d:'M.82,.3Q1,.12.98,.4Q.95,.55.85,.5'},{type:'horn',d:'M.3,.1L.22,0'},{type:'horn',d:'M.7,.1L.78,0'},{type:'tail',d:'M.5,.98Q.6,1 .65,.95'}],eye:[[.4,.22],[.6,.22]],glow:'#7700ff'},
boss4:{body:'M.5,.02Q.25,.02.12,.18L.05,.38Q.02,.6.1,.78L.22,.92Q.38,1 .5,1Q.62,1 .78,.92L.9,.78Q.98,.6.95,.38L.88,.18Q.75,.02.5,.02Z',extras:[{type:'horn',d:'M.2,.1L.1,0L.08,.08'},{type:'horn',d:'M.8,.1L.9,0L.92,.08'},{type:'tendril',d:'M.05,.5L-.05,.45'},{type:'tendril',d:'M.95,.5L1.05,.45'},{type:'tendril',d:'M.1,.72L0,.78'},{type:'tendril',d:'M.9,.72L1,.78'},{type:'aura',d:'M.22,.92Q.15,1 .2,.95'},{type:'aura',d:'M.78,.92Q.85,1 .8,.95'}],eye:[[.35,.22],[.5,.2],[.65,.22]],glow:'#aa00ff'},
// T5 区域5
titan:{body:'M.5,.05Q.25,.05.15,.18L.08,.35Q.05,.55.1,.72L.2,.88Q.38,.98.5,.98Q.62,.98.8,.88L.9,.72Q.95,.55.92,.35L.85,.18Q.75,.05.5,.05Z',extras:[{type:'plate',d:'M.15,.3L.05,.28L.08,.42'},{type:'plate',d:'M.85,.3L.95,.28L.92,.42'},{type:'plate',d:'M.2,.65L.08,.68L.12,.78'},{type:'plate',d:'M.8,.65L.92,.68L.88,.78'}],eye:[[.4,.22],[.6,.22]],glow:'#44cc44'},
chaos:{body:'M.5,.05Q.28,.02.15,.15L.08,.35Q.05,.55.12,.72L.22,.88Q.4,.98.5,.98Q.6,.98.78,.88L.88,.72Q.95,.55.92,.35L.85,.15Q.72,.02.5,.05Z',extras:[{type:'spike',d:'M.15,.15L.05,.05'},{type:'spike',d:'M.85,.15L.95,.05'},{type:'spike',d:'M.12,.55L0,.5'},{type:'spike',d:'M.88,.55L1,.5'},{type:'flame',d:'M.5,.05Q.55,-.02.48,.02'}],eye:[[.38,.25],[.62,.25]],glow:'#ff2200'},
deathknight:{body:'M.5,.05L.28,.1Q.15,.15.1,.3L.08,.48Q.08,.65.15,.8L.28,.92Q.42,.98.5,.98Q.58,.98.72,.92L.85,.8Q.92,.65.92,.48L.9,.3Q.85,.15.72,.1L.5,.05Z',extras:[{type:'helm',d:'M.3,.1L.25,.02L.35,.05'},{type:'helm',d:'M.7,.1L.75,.02L.65,.05'},{type:'sword',d:'M.08,.45L-.02,.35L-.02,.55'},{type:'shield',d:'M.92,.45L1.02,.38L1.02,.55L.95,.58'}],eye:[[.4,.2],[.6,.2]],glow:'#cc44cc'},
horror:{body:'M.5,.05Q.25,.02.12,.2L.05,.42Q.02,.62.1,.8L.25,.92Q.42,1 .5,1Q.58,1 .75,.92L.9,.8Q.98,.62.95,.42L.88,.2Q.75,.02.5,.05Z',extras:[{type:'tendril',d:'M.12,.35Q-.02,.3 0,.45'},{type:'tendril',d:'M.88,.35Q1.02,.3 1,.45'},{type:'tendril',d:'M.1,.65Q-.02,.7.02,.78'},{type:'tendril',d:'M.9,.65Q1.02,.7.98,.78'},{type:'mouth',d:'M.35,.6Q.42,.68.5,.65Q.58,.68.65,.6'}],eye:[[.35,.25],[.5,.22],[.65,.25]],glow:'#cc0044'},
colossus:{body:'M.5,.02Q.22,.02.1,.15L.05,.35Q.02,.55.08,.72L.18,.88Q.35,.98.5,.98Q.65,.98.82,.88L.92,.72Q.98,.55.95,.35L.9,.15Q.78,.02.5,.02Z',extras:[{type:'plate',d:'M.1,.25L0,.22L.02,.38'},{type:'plate',d:'M.9,.25L1,.22L.98,.38'},{type:'plate',d:'M.08,.58L-.02,.55L0,.68'},{type:'plate',d:'M.92,.58L1.02,.55L1,.68'},{type:'spike',d:'M.35,.05L.3,-.02'},{type:'spike',d:'M.65,.05L.7,-.02'}],eye:[[.4,.2],[.6,.2]],glow:'#4444ff'},
plague:{body:'M.5,.08Q.3,.05.18,.2L.12,.4Q.1,.6.18,.78L.3,.9Q.45,.98.55,.98Q.7,.9.82,.78L.88,.6Q.9,.4.82,.2Q.7,.05.5,.08Z',extras:[{type:'spore',d:'M.12,.35Q.02,.28.05,.4'},{type:'spore',d:'M.88,.35Q.98,.28.95,.4'},{type:'drip',d:'M.3,.9Q.28,1 .32,.95'},{type:'drip',d:'M.7,.9Q.72,1 .68,.95'},{type:'vent',d:'M.5,.08Q.52,0 .48,.03'}],eye:[[.4,.28],[.6,.28]],glow:'#88cc22'},
origin:{body:'M.5,.02Q.2,.02.1,.18L.05,.4Q.02,.62.08,.8L.2,.92Q.38,1 .5,1Q.62,1 .8,.92L.92,.8Q.98,.62.95,.4L.9,.18Q.8,.02.5,.02Z',extras:[{type:'tendril',d:'M.1,.3Q-.05,.25 0,.4'},{type:'tendril',d:'M.9,.3Q1.05,.25 1,.4'},{type:'tendril',d:'M.08,.6Q-.05,.58 0,.7'},{type:'tendril',d:'M.92,.6Q1.05,.58 1,.7'},{type:'tendril',d:'M.2,.92Q.12,1 .18,.98'},{type:'tendril',d:'M.8,.92Q.88,1 .82,.98'}],eye:[[.35,.22],[.5,.18],[.65,.22],[.42,.35],[.58,.35]],glow:'#ff00aa'},
boss5:{body:'M.5,0Q.18,0 .05,.15L0,.38Q0,.62.08,.8L.2,.95Q.38,1 .5,1Q.62,1 .8,.95L.92,.8Q1,.62 1,.38L.95,.15Q.82,0 .5,0Z',extras:[{type:'horn',d:'M.2,.08L.08,-.05L.05,.05'},{type:'horn',d:'M.8,.08L.92,-.05L.95,.05'},{type:'tendril',d:'M0,.45Q-.1,.4-.05,.55'},{type:'tendril',d:'M1,.45Q1.1,.4 1.05,.55'},{type:'tendril',d:'M.08,.72Q-.05,.75 0,.82'},{type:'tendril',d:'M.92,.72Q1.05,.75 1,.82'},{type:'aura',d:'M.2,.95Q.1,1 .15,.98'},{type:'aura',d:'M.8,.95Q.9,1 .85,.98'}],eye:[[.3,.2],[.42,.18],[.5,.15],[.58,.18],[.7,.2]],glow:'#ff0066'}
};

// Block B: 结局/职业描述
const classEndings={
  titan:{
    title:'成为永恒',
    subtitle:'泰坦结局',
    achievement:'不可移动的永恒',
    text:'你不再试图逃离。\n你成为了塔本身。\n\n每一面墙壁都是你的骨骼，\n每一层楼都是你的记忆，\n每一个进入的灵魂\n都将成为你永恒的一部分。\n\n你终于理解了——\n保护，就是囚禁。\n囚禁，就是保护。\n而你，选择了两者。',
    quote:'"有些存在太过沉重，\n连崩塌都是奢侈。"'
  },
  ghost:{
    title:'穿透虚实',
    subtitle:'幽灵结局',
    achievement:'不存在的自由',
    text:'你找到了真正的出口。\n不是向上，而是"之间"。\n\n你消散在虚实的边界——\n不再是塔，不再是囚徒，\n不再是任何可以被定义的东西。\n\n你成为了永恒的观察者，\n看着一个又一个"你"\n在同一座塔里寻找出口。',
    quote:'"他们仍在轮回，\n而我终于自由——\n以不存在的形式。"'
  },
  swarm:{
    title:'拥抱混沌',
    subtitle:'虫群结局',
    achievement:'增殖的混沌',
    text:'你不再是一个意识。\n你是无数碎片，遍布每一层。\n\n每一次死亡都是繁殖，\n每一次附身都是扩张。\n塔不再困住你——\n因为你已经是塔的每一个角落。\n\n不是逃出牢笼，\n而是成为牢笼本身的\n每一根栏杆。',
    quote:'"我即是我们，\n我们即是塔，\n每一次死亡都是繁殖。"'
  },
  blood:{
    title:'血之永恒',
    subtitle:'血族结局',
    achievement:'永恒的饥渴',
    text:'你已经不需要宿主了。\n你的血管延伸至整座塔的每一层。\n\n每一个生物的心跳\n都是你的养分来源。\n你已分不清自己是寄生体\n还是这座塔的血液循环本身。\n\n饥渴从未消退，\n但你不再需要进食——\n因为一切活物都是你的一部分。',
    quote:'"每一滴血都是永恒的承诺，\n每一次心跳都是我的脉搏。"'
  },
  mech:{
    title:'钢铁意志',
    subtitle:'机甲结局',
    achievement:'超越肉体',
    text:'有机组织已被完全替换。\n你的躯壳是钢铁与菌丝的融合体。\n\n污染不再是威胁——\n它是你的燃料。\n每一次过载都让你\n距离「纯粹」更近一步。\n\n当最后一丝血肉消散时，\n你听到了齿轮永恒转动的声音。\n那是自由的声音。',
    quote:'"当肉体不再是限制，\n你便不再是囚徒。"'
  }
};

const hiddenEnding={
  title:'开发者模式',
  subtitle:'隐藏结局',
  achievement:'递归的观察者',
  text:'你发现了一个未完成的房间。\n墙上有潦草的笔记：\n\n"如果你看到这个，\n说明有人在测试。\n这个「游戏」本身也是\n某个更大系统的一个实验...\n\n也许我们都是被观察的。"\n\n屏幕闪烁了一下。\n你看到了代码。\n你看到了数字。\n你看到了...自己在玩游戏。',
  quote:'"感谢游玩。\n你的选择数据将用于改进下一个迭代。"'
};

// === 核心函数 ===
// === 职业选择界面 ===
const classDescriptions={
  titan:{quote:'"成为不可动摇的钢铁堡垒"',difficulty:'⭐⭐☆☆☆',style:'稳健型',
    tags:['适合新手','稳扎稳打','防御优先'],
    mechanics:[{name:'质量碾压',desc:'移动时践踏相邻敌人，造成30%ATK伤害'},{name:'装甲系统',desc:'额外护甲值，优先抵消伤害，每层恢复10'},{name:'泰坦之怒',desc:'终极: HP×1.5 ATK+15 DEF+15，持续10回合'}]},
  ghost:{quote:'"在虚实之间收割生命"',difficulty:'⭐⭐⭐⭐☆',style:'操作型',
    tags:['操作要求高','爆发输出','风险与回报'],
    mechanics:[{name:'潜行',desc:'消耗20能量隐身，怪物不触发遭遇'},{name:'背刺',desc:'潜行状态首击2倍伤害，破隐'},{name:'虚空行者',desc:'终极: 无敌5回合，结束后暴击×5'}]},
  swarm:{quote:'"以数量淹没一切抵抗"',difficulty:'⭐⭐⭐☆☆',style:'策略型',
    tags:['策略入门','数量优势','形态多变'],
    mechanics:[{name:'分裂',desc:'受伤20%概率召唤分身'},{name:'分身攻击',desc:'分身每回合额外造成伤害'},{name:'虫群之心',desc:'终极: 释放污染/10只分身，继承80%属性'}]},
  blood:{quote:'"鲜血是最好的燃料"',difficulty:'⭐⭐⭐⭐⭐',style:'赌博型',
    tags:['高难度','极限赌博','吸血爆发'],
    mechanics:[{name:'嗜血',desc:'攻击回复造成伤害的10%'},{name:'血怒',desc:'HP低于30%时攻击+50%'},{name:'血月狂宴',desc:'终极: 全攻击100%吸血，持续8回合'}]},
  mech:{quote:'"以污染为燃料，以钢铁为血肉"',difficulty:'⭐⭐⭐☆☆',style:'爆发型',
    tags:['污染流派','护盾依赖','AOE爆发'],
    mechanics:[{name:'纳米护盾',desc:'额外护盾层，优先承受伤害'},{name:'污染转换',desc:'消耗污染值强化护盾和攻击'},{name:'过载核心',desc:'终极: 污染转护盾+AOE伤害'}]}
};

// Block C: 成就
const achievementDefs=[
  {id:'first_kill',name:'初猎',desc:'击杀第一只怪物',icon:'🗡'},
  {id:'first_possess',name:'寄生觉醒',desc:'首次成功附身',icon:'🧬'},
  {id:'floor10',name:'深入',desc:'到达第10层',icon:'🏛'},
  {id:'floor25',name:'中途觉醒',desc:'到达第25层',icon:'⚡'},
  {id:'floor50',name:'登顶',desc:'到达第50层',icon:'👑'},
  {id:'possess5',name:'收集者',desc:'附身5种不同生物',icon:'🎭'},
  {id:'possess10',name:'百变怪',desc:'附身10种不同生物',icon:'🌀'},
  {id:'no_death',name:'不死传说',desc:'不死亡通关25层',icon:'💀'},
  {id:'titan_end',name:'不可移动的永恒',desc:'达成泰坦结局',icon:'🪨'},
  {id:'ghost_end',name:'不存在的自由',desc:'达成幽灵结局',icon:'👻'},
  {id:'swarm_end',name:'增殖的混沌',desc:'达成虫群结局',icon:'🦗'},
  {id:'blood_end',name:'永恒的饥渴',desc:'达成血族结局',icon:'🩸'},
  {id:'mech_end',name:'超越肉体',desc:'达成机甲结局',icon:'⚙️'},
  {id:'hidden_end',name:'递归的观察者',desc:'达成隐藏结局',icon:'🔮'},
  {id:'defend10',name:'铁壁',desc:'单场战斗防御10次',icon:'🛡'},
  {id:'switch3',name:'形态大师',desc:'单场战斗切换形态3次',icon:'🔄'},
  {id:'pollution0',name:'纯净',desc:'通关25层时污染为0',icon:'✨'},
];
const achievementBonuses={
  'floor25':{stat:'maxHp',value:20,desc:'起始HP+20'},
  'floor50':{stat:'atk',value:3,desc:'起始ATK+3'},
  'possess10':{stat:'def',value:2,desc:'起始DEF+2'},
  'no_death':{stat:'evoPoints',value:100,desc:'起始EP+100'},
  'hidden_end':{stat:'pollution',value:-10,desc:'起始污染-10'},
};

// ================================================================
// 皮肤调色板（DLC）
// ================================================================
const skinPalettes={
  titan:{
    obsidian:{primary:'#333366',highlight:'#6666aa',glow:'#4444ff',bg:'#0a0a1e',name:'黑曜石'},
    jade:{primary:'#22aa66',highlight:'#66ffaa',glow:'#00ff88',bg:'#0a1a12',name:'翡翠'}
  },
  ghost:{
    crimson:{primary:'#cc2266',highlight:'#ff66aa',glow:'#ff0066',bg:'#1a0a12',name:'绯红幻影'},
    void_purple:{primary:'#6622cc',highlight:'#aa66ff',glow:'#8800ff',bg:'#12081a',name:'虚空紫'}
  },
  swarm:{
    toxic:{primary:'#aacc00',highlight:'#ddff44',glow:'#ccff00',bg:'#141a08',name:'剧毒'},
    azure:{primary:'#2288cc',highlight:'#66bbff',glow:'#0099ff',bg:'#081418',name:'蔚蓝'}
  },
  blood:{
    dark_gold:{primary:'#aa8800',highlight:'#ffcc44',glow:'#ffaa00',bg:'#1a1408',name:'暗金'},
    void_red:{primary:'#880044',highlight:'#cc2288',glow:'#aa0066',bg:'#1a0812',name:'暗夜'}
  },
  mech:{
    arctic:{primary:'#44aacc',highlight:'#88ddff',glow:'#00ccff',bg:'#081a1e',name:'极地'},
    inferno:{primary:'#cc4400',highlight:'#ff8844',glow:'#ff4400',bg:'#1a0c08',name:'烈焰'}
  }
};
