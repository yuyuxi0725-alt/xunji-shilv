// utils/stories/sushi-locations.js —— 苏轼 22 地点元数据表（手工维护）
//
// 与 line-sushi-locations.generated.js（自动生成的剧本）分工：
//   generated 只存 22 份地点剧情的 QUEST_* 节点（纯内容，不可手改）；
//   本文件存「运行时所需的元数据」：地点顺序、地图坐标、关键/普通、场景别名、
//   诗笺（一句代表诗 + 一个知识点）、时期分组、AI 知识库映射。
//
// 结构约定与 dufu-locations.js 完全一致，保证 map/chat/story/profile 通用适配层
// 三线同构、无特判。

const IMG = '/assets/' + 'images/';
function img(sub) { return IMG + sub; }

// 关键地点（红，7 处）：诗人「离开时已和到来时不一样」，是人生转折点
const KEY_IDS = ['bianjing', 'wutai', 'dinghui', 'dongpo', 'danzhou', 'jinshan', 'changzhou'];

// 时期分组（旧 p1–p5 → 地点顺序），用于旧进度迁移 + AI 知识库映射
// 说明：1085–1094 的知州生涯（登州/杭州再知/颍州/扬州/定州）无独立时期，
// 归 p5（乌台诗案后、再贬前的同一人设阶段）。
const PERIOD_LOCATIONS = {
  p1: ['meishan', 'bianjing', 'fengxiang'],
  p2: ['hangzhou', 'mizhou', 'xuzhou', 'huzhou'],
  p3: ['wutai'],
  p4: ['dinghui', 'dongpo', 'chibi', 'shahu', 'chengtian'],
  p5: ['dengzhou', 'suti', 'yingzhou', 'yangzhou', 'dingzhou', 'huizhou', 'danzhou', 'jinshan', 'changzhou']
};

// 地点 ID → 所属时期（AI 知识库查卡、兜底回复用）
const LOCATION_PERIOD = {};
Object.keys(PERIOD_LOCATIONS).forEach(pid => {
  PERIOD_LOCATIONS[pid].forEach(lid => { LOCATION_PERIOD[lid] = pid; });
});

const LOCATIONS = [
  // —— 时期一：少年成名 1045–1064 ——
  {
    id: 'meishan', order: 1, periodId: 'p1',
    name: '眉山', subtitle: '少年读书', range: '约1045–1055年',
    placeId: 'meishan',
    importance: 'normal',
    x: 26, y: 48, labelPosition: 'left',
    sceneKey: 'meishan',
    npcStage: 'p0',
    poemTitle: '《记先夫人不残鸟雀》', poemLine: '巢于低枝，其鷇可俯而窥也',
    knowledge: '三苏家学，母程氏授书并讲《范滂传》'
  },
  {
    id: 'bianjing', order: 2, periodId: 'p1',
    name: '汴京', subtitle: '贡院应举', range: '1056–1057年',
    placeId: 'bianjing',
    importance: 'key',
    x: 50, y: 30, labelPosition: 'top',
    sceneKey: 'bianjing',
    npcStage: 'p1',
    poemTitle: '《刑赏忠厚之至论》', poemLine: '当尧之时，皋陶为士',
    knowledge: '嘉祐二年应举，欧阳修叹「出人头地」'
  },
  {
    id: 'fengxiang', order: 3, periodId: 'p1',
    name: '凤翔', subtitle: '初仕签判', range: '1061–1064年',
    importance: 'normal',
    x: 34, y: 34, labelPosition: 'left',
    sceneKey: 'fengxiang',
    npcStage: 'p1',
    poemTitle: '《和子由渑池怀旧》', poemLine: '人生到处知何似，应似飞鸿踏雪泥',
    knowledge: '初仕凤翔签判，与弟苏辙分离'
  },

  // —— 时期二：密州湖州 1071–1079 ——
  {
    id: 'hangzhou', order: 4, periodId: 'p2',
    name: '杭州', subtitle: '通判西湖', range: '1071–1074年',
    placeId: 'hangzhou',
    importance: 'normal',
    x: 64, y: 46, labelPosition: 'bottom',
    sceneKey: 'hangzhou',
    npcStage: 'p2',
    poemTitle: '《饮湖上初晴后雨》', poemLine: '欲把西湖比西子，淡妆浓抹总相宜',
    knowledge: '自请外任杭州，亲见新法在地方执行的流弊'
  },
  {
    id: 'mizhou', order: 5, periodId: 'p2',
    name: '密州', subtitle: '出猎与中秋', range: '1074–1077年',
    importance: 'normal',
    x: 60, y: 26, labelPosition: 'top',
    sceneKey: 'mizhou',
    npcStage: 'p2',
    poemTitle: '《水调歌头》', poemLine: '但愿人长久，千里共婵娟',
    knowledge: '密州出猎、中秋怀弟，豪放词风成型'
  },
  {
    id: 'xuzhou', order: 6, periodId: 'p2',
    name: '徐州', subtitle: '抗洪', range: '1077–1079年',
    importance: 'normal',
    x: 56, y: 34, labelPosition: 'right',
    sceneKey: 'xuzhou',
    npcStage: 'p2',
    poemTitle: '《宋史·苏轼传》', poemLine: '庐于其上，过家不入',
    knowledge: '徐州抗洪，与民同守城'
  },
  {
    id: 'huzhou', order: 7, periodId: 'p2',
    name: '湖州', subtitle: '被逮', range: '1079年',
    importance: 'normal',
    x: 62, y: 42, labelPosition: 'bottom',
    sceneKey: 'huzhou',
    npcStage: 'p2',
    poemTitle: '《湖州谢上表》', poemLine: '愚不适时，难以追陪新进',
    knowledge: '湖州任上因「讪谤」被逮'
  },

  // —— 时期三：乌台诗案 1079 ——
  {
    id: 'wutai', order: 8, periodId: 'p3',
    name: '御史台', subtitle: '乌台狱', range: '1079年',
    // 御史台在北宋汴京城内；地图层与第 2 次汴京到访共用一个地理锚点。
    placeId: 'bianjing',
    importance: 'key',
    x: 50, y: 28, labelPosition: 'top',
    sceneKey: 'wutai',
    npcStage: 'p3',
    poemTitle: '《狱中寄子由》', poemLine: '与君世世为兄弟，更结来生未了因',
    knowledge: '乌台诗案，生死一线，写绝命诗'
  },

  // —— 时期四：东坡赤壁 1080–1084 ——
  {
    id: 'dinghui', order: 9, periodId: 'p4',
    name: '黄州', subtitle: '初到定惠院', range: '1080年',
    placeId: 'huangzhou',
    importance: 'key',
    x: 52, y: 48, labelPosition: 'left',
    sceneKey: 'dinghui',
    npcStage: 'p4',
    poemTitle: '《卜算子·黄州定惠院寓居作》', poemLine: '拣尽寒枝不肯栖，寂寞沙洲冷',
    knowledge: '贬黄州，定惠院寓居，心似已灰'
  },
  {
    id: 'dongpo', order: 10, periodId: 'p4',
    name: '黄州', subtitle: '东坡开荒', range: '1080–1082年',
    placeId: 'huangzhou',
    importance: 'key',
    x: 53, y: 50, labelPosition: 'bottom',
    sceneKey: 'dongpo',
    npcStage: 'p4',
    poemTitle: '《东坡》', poemLine: '莫嫌荦确坡头路，自爱铿然曳杖声',
    knowledge: '躬耕东坡，自号「东坡居士」'
  },
  {
    id: 'chibi', order: 11, periodId: 'p4',
    name: '黄州', subtitle: '赤壁怀古', range: '1082年',
    placeId: 'huangzhou',
    importance: 'normal',
    x: 54, y: 46, labelPosition: 'right',
    sceneKey: 'chibi',
    npcStage: 'p4',
    poemTitle: '《念奴娇·赤壁怀古》', poemLine: '大江东去，浪淘尽，千古风流人物',
    knowledge: '赤壁怀古，写尽千古风流'
  },
  {
    id: 'shahu', order: 12, periodId: 'p4',
    name: '黄州', subtitle: '沙湖遇雨', range: '1082年',
    placeId: 'huangzhou',
    importance: 'normal',
    x: 55, y: 52, labelPosition: 'bottom',
    sceneKey: 'shahu',
    npcStage: 'p4',
    poemTitle: '《定风波》', poemLine: '一蓑烟雨任平生',
    knowledge: '沙湖遇雨，唱出「一蓑烟雨任平生」'
  },
  {
    id: 'chengtian', order: 13, periodId: 'p4',
    name: '黄州', subtitle: '承天寺夜游', range: '1083年',
    placeId: 'huangzhou',
    importance: 'normal',
    x: 51, y: 50, labelPosition: 'top',
    sceneKey: 'chengtian',
    npcStage: 'p4',
    poemTitle: '《记承天寺夜游》', poemLine: '庭下如积水空明，水中藻荇交横',
    knowledge: '承天寺夜游，与张怀民赏月'
  },

  // —— 时期五：岭南北归 1085–1101 ——
  {
    id: 'dengzhou', order: 14, periodId: 'p5',
    name: '登州', subtitle: '五日知州', range: '1085年',
    importance: 'normal',
    x: 64, y: 24, labelPosition: 'top',
    sceneKey: 'dengzhou',
    npcStage: 'p5',
    poemTitle: '《登州海市》', poemLine: '东方云海空复空，群仙出没空明中',
    knowledge: '五日登州知州，却留下政声'
  },
  {
    id: 'suti', order: 15, periodId: 'p5',
    name: '杭州', subtitle: '再知筑苏堤', range: '1089–1091年',
    placeId: 'hangzhou',
    importance: 'normal',
    x: 63, y: 45, labelPosition: 'right',
    sceneKey: 'suti',
    npcStage: 'p5',
    poemTitle: '《与叶淳老侯敦夫张秉道同相视新河》', poemLine: '我凿西湖还旧观，一眼已尽西南碧',
    knowledge: '再知杭州，筑苏堤，惠民千古'
  },
  {
    id: 'yingzhou', order: 16, periodId: 'p5',
    name: '颍州', subtitle: '疏浚西湖与拒开八丈沟', range: '1091–1092年',
    importance: 'normal',
    x: 52, y: 36, labelPosition: 'left',
    sceneKey: 'yingzhou',
    npcStage: 'p5',
    poemTitle: '《泛颍》', poemLine: '散为百东坡，顷刻复在兹',
    knowledge: '颍州任上，疏浚颍州西湖'
  },
  {
    id: 'yangzhou', order: 17, periodId: 'p5',
    name: '扬州', subtitle: '罢万花会与论积欠', range: '1092年',
    importance: 'normal',
    x: 58, y: 40, labelPosition: 'bottom',
    sceneKey: 'yangzhou',
    npcStage: 'p5',
    poemTitle: '《次韵王定国扬州倅》', poemLine: '扬州路，几回魂梦与君同',
    knowledge: '扬州知州，罢万花会，为民减负'
  },
  {
    id: 'dingzhou', order: 18, periodId: 'p5',
    name: '定州', subtitle: '整军兴农', range: '1093–1094年',
    importance: 'normal',
    x: 54, y: 22, labelPosition: 'top',
    sceneKey: 'dingzhou',
    npcStage: 'p5',
    poemTitle: '《定州雪浪石》', poemLine: '雪浪斋前雪浪石，画师争摹',
    knowledge: '定州整军兴农，加固边防'
  },
  {
    id: 'huizhou', order: 19, periodId: 'p5',
    name: '惠州', subtitle: '岭南荔枝', range: '1094–1097年',
    importance: 'normal',
    x: 54, y: 68, labelPosition: 'bottom',
    sceneKey: 'huizhou',
    npcStage: 'p5',
    poemTitle: '《惠州一绝》', poemLine: '日啖荔枝三百颗，不辞长作岭南人',
    knowledge: '贬惠州，日啖荔枝，随遇而安'
  },
  {
    id: 'danzhou', order: 20, periodId: 'p5',
    name: '儋州', subtitle: '天涯海角', range: '1097–1100年',
    importance: 'key',
    x: 50, y: 78, labelPosition: 'top',
    sceneKey: 'danzhou',
    npcStage: 'p5',
    poemTitle: '《别海南黎民表》', poemLine: '我本海南民，寄生西蜀州',
    knowledge: '贬儋州，办学传文；「我本海南民」另有异文'
  },
  {
    id: 'jinshan', order: 21, periodId: 'p5',
    name: '真州', subtitle: '自题金山画像', range: '1101年',
    importance: 'key',
    x: 60, y: 42, labelPosition: 'right',
    sceneKey: 'jinshan',
    npcStage: 'p5',
    poemTitle: '《自题金山画像》', poemLine: '问汝平生功业，黄州惠州儋州',
    knowledge: '真州见金山寺画像，自题诗回首一生功业'
  },
  {
    id: 'changzhou', order: 22, periodId: 'p5',
    name: '常州', subtitle: '北归病逝', range: '1101年',
    importance: 'key',
    x: 62, y: 40, labelPosition: 'top',
    sceneKey: 'changzhou',
    npcStage: 'p5',
    poemTitle: '《菩萨蛮》', poemLine: '买田阳羡吾将老，从来只为溪山好',
    knowledge: '北归病逝常州，一代文豪落幕'
  }
];

// 场景别名映射：地点 scene key → 实际场景图文件。
// 样板期复用现有 scene-sushi-* 素材；missing 为 true 的地点在正式版需补专属场景图。
const SCENE_SETS = {
  meishan:       { meishan: img('scenes/scene-sushi-p1-meishan.jpg') },
  bianjing:      { bianjing: img('scenes/scene-sushi-p1-kaichang.jpg') },   // 贡院应举，复用
  fengxiang:     { fengxiang: img('scenes/scene-sushi-p1-fengxiang.jpg') },
  hangzhou:      { hangzhou: img('scenes/scene-sushi-p2-hangzhou.jpg') },
  mizhou:        { mizhou: img('scenes/scene-sushi-p2-mizhou.jpg') },
  xuzhou:        { xuzhou: img('scenes/scene-sushi-p2-xuzhou.jpg') },
  huzhou:        { huzhou: img('scenes/scene-sushi-p3-daiyu.jpg') },        // 被逮，复用押解
  wutai:         { wutai: img('scenes/scene-sushi-p3-yutai.jpg') },
  dinghui:       { dinghui: img('scenes/scene-sushi-p4-dinghui.jpg') },
  dongpo:        { dongpo: img('scenes/scene-sushi-p4-dongpo.jpg') },
  chibi:         { chibi: img('scenes/scene-sushi-p4-chibi.jpg') },
  shahu:         { shahu: img('scenes/scene-sushi-p4-dingfeng.jpg') },
  chengtian:     { chengtian: img('scenes/scene-sushi-p4-chibi.jpg') },     // 缺承天寺夜游，复用赤壁
  dengzhou:      { dengzhou: img('scenes/scene-sushi-p5-danzhou.jpg') },    // 缺登州海市，复用海景
  suti:          { suti: img('scenes/scene-sushi-p2-hangzhou.jpg') },       // 再知杭州，复用西湖
  yingzhou:      { yingzhou: img('scenes/scene-sushi-p2-hangzhou.jpg') },   // 缺颍州西湖，复用杭州
  yangzhou:      { yangzhou: img('scenes/scene-sushi-p1-meishan.jpg') },    // 缺扬州，复用
  dingzhou:      { dingzhou: img('scenes/scene-sushi-p2-xuzhou.jpg') },     // 缺定州，复用徐州
  huizhou:       { huizhou: img('scenes/scene-sushi-p5-huizhou.jpg') },
  danzhou:       { danzhou: img('scenes/scene-sushi-p5-danzhou.jpg') },
  jinshan:       { jinshan: img('scenes/scene-sushi-p5-jinshan.jpg') },
  changzhou:     { changzhou: img('scenes/scene-sushi-p5-beigui.jpg') }
};

// 素材缺口表：样板期复用、正式版需补的地点
const MATERIAL_GAPS = [
  { id: 'chengtian', what: '专属场景图：承天寺夜游（庭下积水空明）' },
  { id: 'dengzhou', what: '专属场景图：登州海市蜃楼' },
  { id: 'suti', what: '专属场景图：杭州再知·苏堤筑成' },
  { id: 'yingzhou', what: '专属场景图：颍州西湖疏浚' },
  { id: 'yangzhou', what: '专属场景图：扬州罢万花会' },
  { id: 'dingzhou', what: '专属场景图：定州整军兴农' }
];

module.exports = {
  id: 'sushi',
  narrativeMode: 'location',
  KEY_IDS,
  PERIOD_LOCATIONS,
  LOCATION_PERIOD,
  locations: LOCATIONS,
  sceneSets: SCENE_SETS,
  materialGaps: MATERIAL_GAPS
};
