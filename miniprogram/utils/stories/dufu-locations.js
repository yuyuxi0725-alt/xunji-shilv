// utils/stories/dufu-locations.js —— 杜甫 22 地点元数据表（手工维护）
//
// 与 line-dufu-locations.generated.js（自动生成的剧本）分工：
//   generated 只存 22 份地点剧情的 QUEST_* 节点（纯内容，不可手改）；
//   本文件存「运行时所需的元数据」：地点顺序、地图坐标、关键/普通、场景别名、
//   诗笺（一句代表诗 + 一个知识点）、时期分组、AI 知识库映射。
//
// 结构约定：
//   locations[]  按生平时间顺序排（order 1–22），承担「序号 = 时间顺序」；
//   x/y          地图容器百分比坐标（同 jouney.js 的约定，0–100）；
//   sceneKey     地点默认场景 key（节点未显式指定 scene 时用）；
//   sceneSets    地点内可用的场景 key → 实际场景图文件（复用现有素材 + 缺口标记）；
//   periodId     该地点所属旧时期（用于 AI 知识库映射与旧进度迁移）；
//   importance   'key' 关键地点（红，8 处）| 'normal' 普通地点（棕，14 处）。

const IMG = '/assets/' + 'images/';
function img(sub) { return IMG + sub; }

// 分镜级场景映射（自动生成）：地点 scene key → 分镜图文件
//   由 tools/build-dufu-fenjing.js 从 docs/杜甫行迹剧本-全22地点-含分镜.md 生成，
//   每个地点从「1 张默认图」扩成「多镜头图」（<地点> = 镜头1；<地点>_s0N = 镜头N）。
//   与下方 SCENE_SETS 的关系：FENJING_SCENE_SETS 优先，未命中的地点/场景回退到 SCENE_SETS。
const FENJING_SCENE_SETS = require('./dufu-fenjing-scenes');

// 关键地点（红，8 处）：诗人「离开时已和到来时不一样」，是人生转折点
const KEY_IDS = ['luoyang', 'luoyang_shi', 'yexian', 'fengxian', 'changan_xian', 'chengdu', 'kuizhou', 'xiangjiang'];

// 时期分组（旧 p1–p4 → 地点顺序），用于旧进度迁移 + AI 知识库映射
const PERIOD_LOCATIONS = {
  p1: ['luoyang', 'shuhu', 'wuyue', 'luoyang_shi', 'taishan', 'shouang', 'qizhao'],
  p2: ['changan', 'yexian', 'fengxian'],
  p3: ['changan_xian', 'fengxiang', 'qiangcun', 'huazhou'],
  p4: ['qinzhou', 'tonggu', 'chengdu', 'kuizhou', 'jingzhou', 'tanzhou', 'hengzhou', 'xiangjiang']
};

// 地点 ID → 所属时期（AI 知识库查卡、兜底回复用）
const LOCATION_PERIOD = {};
Object.keys(PERIOD_LOCATIONS).forEach(pid => {
  PERIOD_LOCATIONS[pid].forEach(lid => { LOCATION_PERIOD[lid] = pid; });
});

const LOCATIONS = [
  // —— 时期一：读书壮游 712–745 ——
  // 2026-10-22 更新：按杜甫生平时间线重排——泰山、守丧在前，梁宋齐鲁与李白同游在后
  {
    id: 'luoyang', order: 1, periodId: 'p1',
    name: '洛阳', subtitle: '七岁咏凤凰', range: '约719年',
    placeId: 'luoyang',
    importance: 'key',
    x: 56, y: 36, labelPosition: 'bottom',
    sceneKey: 'luoyang',
    npcStage: 'p0',   // 七岁咏凤凰 → 幼年立绘
    poemTitle: '《壮游》', poemLine: '七龄思即壮，开口咏凤凰',
    knowledge: '七岁咏凤凰，少年诗心的起点'
  },
  {
    id: 'shuhu', order: 2, periodId: 'p1',
    name: '洛阳', subtitle: '观公孙大娘舞剑', range: '约720–730年',
    placeId: 'luoyang',
    importance: 'normal',
    x: 54, y: 34, labelPosition: 'left',
    sceneKey: 'shuhu',
    npcStage: 'p1',
    poemTitle: '《观公孙大娘弟子舞剑器行》', poemLine: '来如雷霆收震怒',
    knowledge: '少年观舞剑，博采百家入诗'
  },
  {
    id: 'wuyue', order: 3, periodId: 'p1',
    name: '吴越', subtitle: '南游', range: '731–734年',
    importance: 'normal',
    x: 84, y: 54, labelPosition: 'bottom',
    sceneKey: 'wuyue',
    npcStage: 'p1',
    poemTitle: '《壮游》', poemLine: '越女天下白，鉴湖五月凉',
    knowledge: '南游吴越，读万卷行万里'
  },
  {
    id: 'luoyang_shi', order: 4, periodId: 'p1',
    name: '洛阳', subtitle: '应举', range: '735年',
    placeId: 'luoyang',
    importance: 'key',
    x: 58, y: 39, labelPosition: 'top',
    sceneKey: 'luoyang_shi',
    npcStage: 'p1',
    poemTitle: '《壮游》', poemLine: '放荡齐赵间，裘马颇清狂',
    knowledge: '落第不消沉，转赴齐赵漫游'
  },
  {
    id: 'taishan', order: 5, periodId: 'p1',
    name: '泰山', subtitle: '望岳', range: '约736年',
    importance: 'normal',
    x: 78, y: 20, labelPosition: 'bottom',
    sceneKey: 'taishan',
    npcStage: 'p1',
    poemTitle: '《望岳》', poemLine: '会当凌绝顶，一览众山小',
    knowledge: '登泰山作《望岳》，青年抱负'
  },
  {
    id: 'shouang', order: 6, periodId: 'p1',
    name: '洛阳', subtitle: '守丧与家变', range: '约741–745年',
    placeId: 'luoyang',
    importance: 'normal',
    x: 52, y: 38, labelPosition: 'right',
    sceneKey: 'shouang',
    npcStage: 'p1',
    poemTitle: '《壮游》', poemLine: '放荡齐赵间，裘马颇清狂',
    knowledge: '父丧家变，守丧期满担起家业，启程赴长安'
  },
  {
    // ID 沿用 qizhao 以兼容旧存档；展示内容按 744–745 年李杜梁宋、齐鲁交游修正。
    id: 'qizhao', order: 7, periodId: 'p1',
    name: '齐鲁', subtitle: '与李白同游', range: '744–745年',
    importance: 'normal',
    x: 64, y: 16, labelPosition: 'top',
    sceneKey: 'qizhao',
    npcStage: 'p1',
    poemTitle: '《壮游》', poemLine: '放荡齐赵间，裘马颇清狂',
    knowledge: '与李白、高适同游梁宋，后又与李白相会齐鲁'
  },

  // —— 时期二：困守长安 746–755 ——
  {
    id: 'changan', order: 8, periodId: 'p2',
    name: '长安', subtitle: '十年干谒', range: '746–755年',
    placeId: 'changan',
    importance: 'normal',
    x: 46, y: 36, labelPosition: 'top',
    sceneKey: 'changan',
    npcStage: 'p2',
    poemTitle: '《奉赠韦左丞丈二十二韵》', poemLine: '朝扣富儿门，暮随肥马尘',
    knowledge: '困守长安十年，献诗干谒'
  },
  {
    id: 'yexian', order: 9, periodId: 'p2',
    name: '长安', subtitle: '野无遗贤', range: '747年',
    placeId: 'changan',
    importance: 'key',
    x: 43, y: 34, labelPosition: 'bottom',
    sceneKey: 'yexian',
    npcStage: 'p2',
    poemTitle: '《奉赠韦左丞丈二十二韵》', poemLine: '残杯与冷炙，到处潜悲辛',
    knowledge: '李林甫「野无遗贤」，诗风转向忧国忧民'
  },
  {
    id: 'fengxian', order: 10, periodId: 'p2',
    name: '奉先', subtitle: '幼子夭折', range: '755年冬',
    importance: 'key',
    x: 50, y: 30, labelPosition: 'left',
    sceneKey: 'fengxian',
    npcStage: 'p2',
    poemTitle: '《自京赴奉先县咏怀五百字》', poemLine: '朱门酒肉臭，路有冻死骨',
    knowledge: '幼子饿死，写尽贫富悬殊'
  },

  // —— 时期三：陷贼为官 756–759 ——
  {
    id: 'changan_xian', order: 11, periodId: 'p3',
    name: '长安', subtitle: '陷贼', range: '756–757年',
    placeId: 'changan',
    importance: 'key',
    x: 44, y: 48, labelPosition: 'right',
    sceneKey: 'changan_xian',
    npcStage: 'p3',
    poemTitle: '《春望》', poemLine: '国破山河在，城春草木深',
    knowledge: '长安陷落，身陷叛军写《春望》'
  },
  {
    id: 'fengxiang', order: 12, periodId: 'p3',
    name: '凤翔', subtitle: '麻鞋见天子', range: '757年',
    importance: 'normal',
    x: 28, y: 36, labelPosition: 'right',
    sceneKey: 'fengxiang',
    npcStage: 'p3',
    poemTitle: '《述怀》', poemLine: '麻鞋见天子，衣袖露两肘',
    knowledge: '冒死投奔，授左拾遗'
  },
  {
    id: 'qiangcun', order: 13, periodId: 'p3',
    name: '鄜州羌村', subtitle: '羌村团聚', range: '757年',
    importance: 'normal',
    x: 58, y: 24, labelPosition: 'left',
    sceneKey: 'qiangcun',
    npcStage: 'p3',
    poemTitle: '《月夜》', poemLine: '今夜鄜州月，闺中只独看',
    knowledge: '乱世里一家团聚的温情'
  },
  {
    id: 'huazhou', order: 14, periodId: 'p3',
    name: '华州', subtitle: '三吏三别', range: '758–759年',
    importance: 'normal',
    x: 52, y: 44, labelPosition: 'bottom',
    sceneKey: 'huazhou',
    npcStage: 'p3',
    poemTitle: '《石壕吏》', poemLine: '吏呼一何怒，妇啼一何苦',
    knowledge: '西行路上写《三吏》《三别》'
  },

  // —— 时期四：漂泊西南 759–770 ——
  {
    id: 'qinzhou', order: 15, periodId: 'p4',
    name: '秦州', subtitle: '弃官西行', range: '759年',
    importance: 'normal',
    x: 26, y: 26, labelPosition: 'right',
    sceneKey: 'qinzhou',
    npcStage: 'p4',
    poemTitle: '《秦州杂诗》', poemLine: '满目悲生事，因人作远游',
    knowledge: '弃官西行，漂泊西南的开始'
  },
  {
    id: 'tonggu', order: 16, periodId: 'p4',
    name: '同谷', subtitle: '饥寒交迫', range: '759年冬',
    importance: 'normal',
    x: 22, y: 38, labelPosition: 'left',
    sceneKey: 'tonggu',
    npcStage: 'p4',
    poemTitle: '《乾元中寓居同谷县作歌七首》', poemLine: '岁拾橡栗随狙公，天寒日暮山谷里',
    knowledge: '拾橡栗充饥，最艰难的冬天'
  },
  {
    id: 'chengdu', order: 17, periodId: 'p4',
    name: '成都草堂', subtitle: '草堂安居', range: '760–765年',
    importance: 'key',
    x: 24, y: 56, labelPosition: 'right',
    sceneKey: 'chengdu',
    npcStage: 'p4',
    poemTitle: '《春夜喜雨》', poemLine: '随风潜入夜，润物细无声',
    knowledge: '草堂安居，写下《茅屋为秋风所破歌》'
  },
  {
    id: 'kuizhou', order: 18, periodId: 'p4',
    name: '夔州', subtitle: '登高', range: '766–768年',
    importance: 'key',
    x: 46, y: 60, labelPosition: 'bottom',
    sceneKey: 'kuizhou',
    npcStage: 'p4',
    poemTitle: '《登高》', poemLine: '无边落木萧萧下，不尽长江滚滚来',
    knowledge: '登高作《登高》，古今七律第一'
  },
  {
    id: 'jingzhou', order: 19, periodId: 'p4',
    // ID 沿用 jingzhou 以兼容旧存档；玩家可见地点统一为岳阳。
    name: '岳阳', subtitle: '登岳阳楼', range: '768年冬',
    importance: 'normal',
    x: 56, y: 64, labelPosition: 'top',
    sceneKey: 'jingzhou',
    npcStage: 'p4',
    poemTitle: '《登岳阳楼》', poemLine: '昔闻洞庭水，今上岳阳楼',
    knowledge: '登岳阳楼，望洞庭浩渺'
  },
  {
    id: 'tanzhou', order: 20, periodId: 'p4',
    name: '潭州', subtitle: '逢李龟年', range: '770年春',
    importance: 'normal',
    x: 60, y: 70, labelPosition: 'right',
    sceneKey: 'tanzhou',
    npcStage: 'p4',
    poemTitle: '《江南逢李龟年》', poemLine: '正是江南好风景，落花时节又逢君',
    knowledge: '落花时节逢故人，盛衰无常'
  },
  {
    id: 'hengzhou', order: 21, periodId: 'p4',
    name: '衡州', subtitle: '阻水耒阳', range: '770年',
    importance: 'normal',
    x: 52, y: 72, labelPosition: 'bottom',
    sceneKey: 'hengzhou',
    npcStage: 'p4',
    poemTitle: '《风疾舟中伏枕书怀》', poemLine: '故国悲寒望，群云惨岁阴',
    knowledge: '阻水耒阳，生命尾声的挣扎'
  },
  {
    id: 'xiangjiang', order: 22, periodId: 'p4',
    name: '湘江', subtitle: '孤舟绝笔', range: '770年',
    importance: 'key',
    x: 58, y: 78, labelPosition: 'top',
    sceneKey: 'xiangjiang',
    npcStage: 'p4',
    poemTitle: '《风疾舟中伏枕书怀三十六韵奉呈湖南亲友》', poemLine: '故国悲寒望，群云惨岁阴',
    knowledge: '770年在湖南水路漂泊期间去世，具体卒地有异说'
  }
];

// 场景别名映射：地点 scene key → 实际场景图文件。
// 样板期复用现有素材；missing 为 true 的地点在正式版需补专属场景图（见素材缺口表）。
// 2026-10-19 更新：接入「分镜版」——每个地点扩展为多镜头（<地点>_s0N）。
//   FENJING_SCENE_SETS（自动生成）优先；分镜里缺图的场景回退到本表的单图默认值。
const SCENE_SETS_BASE = {
  luoyang:       { luoyang: img('scenes/scene-p1-luoyang.jpg') },
  luoyang_shi:   { luoyang_shi: img('scenes/scene-p1-luodi.jpg') },
  taishan:       { taishan: img('scenes/scene-p1-taishan.jpg') },
  shuhu:         { shuhu: img('scenes/scene-p1-luoyang.jpg') },        // 缺舞剑场景，复用洛阳
  wuyue:         { wuyue: img('scenes/scene-p1-jiangnan.jpg') },
  qizhao:        { qizhao: img('scenes/scene-p1-libai.jpg') },
  shouang:       { shouang: img('scenes/scene-p1-luoyang.jpg') },      // 守丧已补专属分镜图（dufu-p07），此为缺失回退
  changan:       { changan: img('scenes/scene-p2-ganxie.jpg') },
  yexian:        { yexian: img('scenes/scene-p2-luodi.jpg') },
  fengxian:      { fengxian: img('scenes/scene-p2-changan.jpg') },     // 缺奉先家庭场景，复用长安
  changan_xian:  { changan_xian: img('scenes/scene-p3-chunwang.jpg') },
  fengxiang:     { fengxiang: img('scenes/scene-p3-fengxiang.jpg') },
  qiangcun:      { qiangcun: img('scenes/scene-p3-yueye.jpg') },       // 建议补羌村团聚
  huazhou:       { huazhou: img('scenes/scene-p3-shihao.jpg') },
  qinzhou:       { qinzhou: img('scenes/scene-p4-qinzhou.jpg') },
  tonggu:        { tonggu: img('scenes/scene-p4-qinzhou.jpg') },       // 缺同谷山路，复用秦州
  chengdu:       { chengdu: img('scenes/scene-p4-caotang.jpg') },
  kuizhou:       { kuizhou: img('scenes/scene-p4-kuizhou.jpg') },
  jingzhou:      { jingzhou: img('scenes/scene-p4-xiangjiang.jpg') },  // 缺岳阳楼与洞庭湖
  tanzhou:       { tanzhou: img('scenes/scene-p4-xiangjiang.jpg') },   // 缺江亭重逢
  hengzhou:      { hengzhou: img('scenes/scene-p4-xiangjiang.jpg') },  // 缺涨水阻舟
  xiangjiang:    { xiangjiang: img('scenes/scene-p4-xiangjiang.jpg') }
};

// 合并：分镜映射优先，逐地点覆盖（分镜缺的 key 用旧单图兜底）。
//   全部 22 地点启用分镜；源稿缺镜头标记的红地点（luoyang_shi/yexian/xiangjiang
//   缺最后 1–2 镜）按「剧本标记为准」，多出的图暂不切，不影响播放。
const SCENE_SETS = {};
Object.keys(SCENE_SETS_BASE).forEach(loc => {
  const base = SCENE_SETS_BASE[loc] || {};
  const fen = FENJING_SCENE_SETS[loc] || {};
  // 分镜映射里，值为 null 的 key（无图）不覆盖，落到旧单图
  SCENE_SETS[loc] = Object.assign({}, base);
  Object.keys(fen).forEach(k => {
    if (fen[k]) SCENE_SETS[loc][k] = fen[k];
  });
});

// 素材缺口表：样板期复用、正式版需补的地点（供后续排期）
const MATERIAL_GAPS = [
  { id: 'shuhu', what: '专属场景图：洛阳私塾观公孙大娘舞剑' },
  { id: 'fengxian', what: '专属场景图：奉先县家庭（幼子夭折）' },
  { id: 'qiangcun', what: '专属场景图：鄜州羌村团聚' },
  { id: 'huazhou', what: '专属场景图：华州行旅（差吏抓丁）' },
  { id: 'tonggu', what: '专属场景图：同谷山路饥寒' },
  { id: 'jingzhou', what: '专属场景图：岳阳楼与洞庭湖' },
  { id: 'tanzhou', what: '专属场景图：潭州江亭重逢' },
  { id: 'hengzhou', what: '专属场景图：衡州涨水阻舟' },
  { id: 'luoyang', what: '专属立绘：七岁儿童杜甫（样板暂用 p1 青年立绘）' }
];

module.exports = {
  id: 'dufu',
  narrativeMode: 'location',
  KEY_IDS,
  PERIOD_LOCATIONS,
  LOCATION_PERIOD,
  locations: LOCATIONS,
  sceneSets: SCENE_SETS,
  materialGaps: MATERIAL_GAPS
};
