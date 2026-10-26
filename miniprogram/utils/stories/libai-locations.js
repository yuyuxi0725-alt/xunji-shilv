// utils/stories/libai-locations.js —— 李白 20 地点元数据表（手工维护）
//
// 与 line-libai-locations.generated.js（自动生成的剧本）分工：
//   generated 只存 20 份地点剧情的 QUEST_* 节点（纯内容，不可手改）；
//   本文件存「运行时所需的元数据」：地点顺序、地图坐标、关键/普通、场景别名、
//   诗笺（一句代表诗 + 一个知识点）、时期分组、AI 知识库映射。
//
// 结构约定与 dufu-locations.js 完全一致，保证 map/chat/story/profile 通用适配层
// 三线同构、无特判。

const IMG = '/assets/' + 'images/';
function img(sub) { return IMG + sub; }

// 关键地点（红，9 处）：诗人「离开时已和到来时不一样」，是人生转折点
// 2026-10-22 按新整合版剧本：新增 luoyang_libai（李杜初见）、songshan（将进酒）两处关键地点
const KEY_IDS = ['qinglian', 'changan1', 'luoyang_libai', 'hanlin', 'songshan', 'yongwang', 'xunyang', 'baidi', 'dangtu'];

// 时期分组（旧 p1–p5 → 地点顺序），用于旧进度迁移 + AI 知识库映射
const PERIOD_LOCATIONS = {
  p1: ['qinglian', 'emei', 'jingmen', 'yangzhou', 'anlu'],
  p2: ['changan1', 'zhongnan'],
  p3: ['hanlin'],
  p4: ['luoyang_libai', 'songshan', 'tianmu', 'liangsong', 'xuanzhou', 'youyan'],
  p5: ['lushan', 'yongwang', 'xunyang', 'liuyelang', 'baidi', 'dangtu']
};

// 地点 ID → 所属时期（AI 知识库查卡、兜底回复用）
const LOCATION_PERIOD = {};
Object.keys(PERIOD_LOCATIONS).forEach(pid => {
  PERIOD_LOCATIONS[pid].forEach(lid => { LOCATION_PERIOD[lid] = pid; });
});

const LOCATIONS = [
  // —— 时期一：仗剑出蜀 725–735 ——
  {
    id: 'qinglian', order: 1, periodId: 'p1',
    name: '蜀中青莲乡', subtitle: '少年立志', range: '约715–724年',
    placeId: 'qinglian',
    importance: 'key',
    x: 28, y: 46, labelPosition: 'left',
    sceneKey: 'qinglian',
    npcStage: 'p0',
    poemTitle: '《上李邕》', poemLine: '大鹏一日同风起，扶摇直上九万里',
    knowledge: '少年以「大鹏」自比，立下凌云之志'
  },
  {
    id: 'emei', order: 2, periodId: 'p1',
    name: '峨眉山', subtitle: '仗剑出蜀', range: '约725年',
    importance: 'normal',
    x: 30, y: 50, labelPosition: 'bottom',
    sceneKey: 'emei',
    npcStage: 'p1',
    poemTitle: '《峨眉山月歌》', poemLine: '峨眉山月半轮秋，影入平羌江水流',
    knowledge: '仗剑去国，辞亲远游，出蜀东下'
  },
  {
    id: 'jingmen', order: 3, periodId: 'p1',
    name: '荆门', subtitle: '渡荆门出峡', range: '约725年',
    importance: 'normal',
    x: 42, y: 52, labelPosition: 'bottom',
    sceneKey: 'jingmen',
    npcStage: 'p1',
    poemTitle: '《渡荆门送别》', poemLine: '山随平野尽，江入大荒流',
    knowledge: '出峡入楚，山随平野尽'
  },
  {
    id: 'yangzhou', order: 4, periodId: 'p1',
    name: '金陵扬州', subtitle: '东游散金', range: '约725–727年',
    importance: 'normal',
    x: 66, y: 46, labelPosition: 'bottom',
    sceneKey: 'yangzhou',
    npcStage: 'p1',
    poemTitle: '《静夜思》', poemLine: '床前明月光，疑是地上霜',
    knowledge: '东游散金，不逾一年散尽三十馀万，广济落魄'
  },
  {
    id: 'anlu', order: 5, periodId: 'p1',
    name: '安陆', subtitle: '入赘许氏与干谒', range: '约727–735年',
    importance: 'normal',
    x: 50, y: 48, labelPosition: 'right',
    sceneKey: 'anlu',
    npcStage: 'p1',
    poemTitle: '《山中问答》', poemLine: '桃花流水窅然去，别有天地非人间',
    knowledge: '入赘许氏，酒隐安陆，蹉跎十年而干谒求仕'
  },

  // —— 时期二：干谒求仕 730–741 ——
  {
    id: 'changan1', order: 6, periodId: 'p2',
    name: '长安', subtitle: '初入长安', range: '730–735年',
    placeId: 'changan',
    importance: 'key',
    x: 44, y: 36, labelPosition: 'top',
    sceneKey: 'changan1',
    npcStage: 'p2',
    poemTitle: '《行路难·其一》', poemLine: '长风破浪会有时，直挂云帆济沧海',
    knowledge: '初入长安干谒碰壁，历抵卿相而不得'
  },
  {
    id: 'zhongnan', order: 7, periodId: 'p2',
    name: '终南山', subtitle: '玉真别馆', range: '约735年',
    importance: 'normal',
    x: 40, y: 34, labelPosition: 'left',
    sceneKey: 'zhongnan',
    npcStage: 'p2',
    poemTitle: '《蜀道难》', poemLine: '蜀道之难，难于上青天',
    knowledge: '隐终南，走玉真公主门路求荐而不得'
  },

  // —— 时期三：供奉翰林 742–744 ——
  {
    id: 'hanlin', order: 8, periodId: 'p3',
    name: '长安', subtitle: '供奉翰林', range: '742–744年',
    placeId: 'changan',
    importance: 'key',
    x: 45, y: 38, labelPosition: 'bottom',
    sceneKey: 'hanlin',
    npcStage: 'p3',
    poemTitle: '《清平调》', poemLine: '云想衣裳花想容，春风拂槛露华浓',
    knowledge: '供奉翰林，天子礼遇，终赐金放还'
  },

  // —— 时期四：纵酒漫游 744–755 ——
  {
    id: 'luoyang_libai', order: 9, periodId: 'p4',
    name: '洛阳', subtitle: '与杜甫初见', range: '744年',
    importance: 'key',
    x: 50, y: 34, labelPosition: 'top',
    sceneKey: 'luoyang_libai',
    npcStage: 'p4',
    poemTitle: '《鲁郡东石门送杜二甫》', poemLine: '飞蓬各自远，且尽手中杯',
    knowledge: '洛阳初见杜甫，诗坛双星相会'
  },
  {
    id: 'songshan', order: 10, periodId: 'p4',
    name: '颍阳', subtitle: '元丹丘山居将进酒', range: '约744–752年',
    importance: 'key',
    x: 52, y: 32, labelPosition: 'left',
    sceneKey: 'songshan',
    npcStage: 'p4',
    poemTitle: '《将进酒》', poemLine: '天生我材必有用，千金散尽还复来',
    knowledge: '元丹丘山居痛饮，作《将进酒》'
  },
  {
    id: 'tianmu', order: 11, periodId: 'p4',
    name: '天姥山', subtitle: '梦游天姥', range: '约745年',
    importance: 'normal',
    x: 62, y: 50, labelPosition: 'bottom',
    sceneKey: 'tianmu',
    npcStage: 'p4',
    poemTitle: '《梦游天姥吟留别》', poemLine: '安能摧眉折腰事权贵，使我不得开心颜',
    knowledge: '梦游天姥，唱出「安能摧眉折腰事权贵」'
  },
  {
    id: 'liangsong', order: 12, periodId: 'p4',
    name: '梁宋齐鲁', subtitle: '三人同游', range: '744–745年',
    importance: 'normal',
    x: 56, y: 26, labelPosition: 'top',
    sceneKey: 'liangsong',
    npcStage: 'p4',
    poemTitle: '《侠客行》', poemLine: '十步杀一人，千里不留行',
    knowledge: '与杜甫、高适同游梁宋，纵酒射猎'
  },
  {
    id: 'xuanzhou', order: 13, periodId: 'p4',
    name: '宣州', subtitle: '谢朓楼饯别', range: '约753年',
    importance: 'normal',
    x: 62, y: 44, labelPosition: 'right',
    sceneKey: 'xuanzhou',
    npcStage: 'p4',
    poemTitle: '《宣州谢朓楼饯别校书叔云》', poemLine: '抽刀断水水更流，举杯销愁愁更愁',
    knowledge: '谢朓楼饯别，写尽怀才不遇的愁绪'
  },
  {
    id: 'youyan', order: 14, periodId: 'p4',
    name: '幽燕', subtitle: '北游察乱', range: '约752年',
    importance: 'normal',
    x: 62, y: 16, labelPosition: 'top',
    sceneKey: 'youyan',
    npcStage: 'p4',
    poemTitle: '《北风行》', poemLine: '燕山雪花大如席，片片吹落轩辕台',
    knowledge: '北游幽燕，对边事生出忧虑（「察乱」属后世解读）'
  },

  // —— 时期五：乱世浮沉 755–762 ——
  {
    id: 'lushan', order: 15, periodId: 'p5',
    name: '庐山', subtitle: '避乱隐居', range: '755–756年',
    importance: 'normal',
    x: 56, y: 52, labelPosition: 'bottom',
    sceneKey: 'lushan',
    npcStage: 'p5',
    poemTitle: '《庐山谣寄卢侍御虚舟》', poemLine: '我本楚狂人，凤歌笑孔丘',
    knowledge: '避乱庐山，隐居屏风叠'
  },
  {
    id: 'yongwang', order: 16, periodId: 'p5',
    name: '江陵', subtitle: '永王幕', range: '756–757年',
    placeId: 'jiangling',
    importance: 'key',
    x: 48, y: 56, labelPosition: 'left',
    sceneKey: 'yongwang',
    npcStage: 'p5',
    poemTitle: '《永王东巡歌》', poemLine: '为君谈笑静胡沙',
    knowledge: '误入永王幕，卷入皇室内斗'
  },
  {
    id: 'xunyang', order: 17, periodId: 'p5',
    name: '浔阳', subtitle: '系狱', range: '757年',
    importance: 'key',
    x: 54, y: 54, labelPosition: 'right',
    sceneKey: 'xunyang',
    npcStage: 'p5',
    poemTitle: '《狱中上崔相涣》', poemLine: '能回造化笔，或冀一人生',
    knowledge: '浔阳系狱，经崔涣、宋若思等营救出狱'
  },
  {
    id: 'liuyelang', order: 18, periodId: 'p5',
    name: '流放途中', subtitle: '长流夜郎', range: '758–759年',
    importance: 'normal',
    x: 50, y: 60, labelPosition: 'bottom',
    sceneKey: 'liuyelang',
    npcStage: 'p5',
    poemTitle: '《上三峡》', poemLine: '三朝又三暮，不觉鬓成丝',
    knowledge: '长流夜郎，溯江西上，历尽艰辛'
  },
  {
    id: 'baidi', order: 19, periodId: 'p5',
    name: '白帝城', subtitle: '遇赦后东归', range: '759年',
    importance: 'key',
    x: 46, y: 58, labelPosition: 'top',
    sceneKey: 'baidi',
    npcStage: 'p5',
    poemTitle: '《早发白帝城》', poemLine: '两岸猿声啼不住，轻舟已过万重山',
    knowledge: '巫山一带遇赦后东还，路过白帝城作诗'
  },
  {
    id: 'dangtu', order: 20, periodId: 'p5',
    name: '当涂', subtitle: '临终大鹏', range: '762年',
    importance: 'key',
    x: 60, y: 44, labelPosition: 'top',
    sceneKey: 'dangtu',
    npcStage: 'p5',
    poemTitle: '《临终歌》', poemLine: '大鹏飞兮振八裔，中天摧兮力不济',
    knowledge: '临终高歌，大鹏折翼，谪仙归去'
  }
];

// 场景别名映射：地点 scene key → 实际场景图文件。
// 样板期复用现有 scene-libai-* 素材；missing 为 true 的地点在正式版需补专属场景图。
const SCENE_SETS = {
  qinglian:       { qinglian: img('scenes/scene-libai-p1-chuanshu.jpg') },  // 少年书斋，复用
  emei:           { emei: img('scenes/scene-libai-p1-emei.jpg') },
  jingmen:        { jingmen: img('scenes/scene-libai-p1-jingmen.jpg') },
  yangzhou:       { yangzhou: img('scenes/scene-libai-p1-jiang.jpg') },     // 东游散金，复用江畔
  anlu:           { anlu: img('scenes/scene-libai-p1-jiang.jpg') },         // 缺安陆隐居，复用江畔
  changan1:       { changan1: img('scenes/scene-libai-p2-changan.jpg') },
  zhongnan:       { zhongnan: img('scenes/scene-libai-p2-zhongnan.jpg') },
  hanlin:         { hanlin: img('scenes/scene-libai-p3-gongting.jpg') },
  luoyang_libai:  { luoyang_libai: img('scenes/scene-libai-p4-liangsong.jpg') }, // 李杜相会，复用梁宋
  songshan:       { songshan: img('scenes/scene-libai-p4-jiangjin.jpg') },
  tianmu:         { tianmu: img('scenes/scene-libai-p4-tianmu.jpg') },
  liangsong:      { liangsong: img('scenes/scene-libai-p4-liangsong.jpg') },
  xuanzhou:       { xuanzhou: img('scenes/scene-libai-p4-xietiao.jpg') },
  youyan:         { youyan: img('scenes/scene-libai-p2-changan.jpg') },     // 缺幽燕雪景，复用长安
  lushan:         { lushan: img('scenes/scene-libai-p5-lushan.jpg') },
  yongwang:       { yongwang: img('scenes/scene-libai-p5-yongwang.jpg') },
  xunyang:        { xunyang: img('scenes/scene-libai-p5-yuzhong.jpg') },
  liuyelang:      { liuyelang: img('scenes/scene-libai-p1-jiang.jpg') },     // 缺夜郎舟行，复用江畔
  baidi:          { baidi: img('scenes/scene-libai-p5-baidi.jpg') },
  dangtu:         { dangtu: img('scenes/scene-libai-p1-jiang.jpg') }        // 缺当涂临终，复用江畔
};

// 素材缺口表：样板期复用、正式版需补的地点
const MATERIAL_GAPS = [
  { id: 'qinglian', what: '专属场景图：青莲乡少年书斋（样板复用 chuanshu）' },
  { id: 'yangzhou', what: '专属场景图：扬州东游散金' },
  { id: 'anlu', what: '专属场景图：安陆隐居（桃花流水）' },
  { id: 'youyan', what: '专属场景图：幽燕北游察乱（燕山雪景）' },
  { id: 'liuyelang', what: '专属场景图：长流夜郎舟行' },
  { id: 'dangtu', what: '专属场景图：当涂临终（大鹏折翼）' }
];

module.exports = {
  id: 'libai',
  narrativeMode: 'location',
  KEY_IDS,
  PERIOD_LOCATIONS,
  LOCATION_PERIOD,
  locations: LOCATIONS,
  sceneSets: SCENE_SETS,
  materialGaps: MATERIAL_GAPS
};
