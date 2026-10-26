// utils/stories/index.js —— 多主线注册表（核心：以后加新故事线只在这里注册，不用改引擎）
//
// 架构说明：
//   每个古人 = 一个「故事线(storyLine)」，独立成文件（stories/line-*.js），
//   每条线内部有自己的时期(periods)、场景(scenes)、立绘(npc)、锚点(anchors)、台词语音映射。
//   本文件只做「注册 + 汇总」，页面和引擎通过统一接口读取，与具体古人解耦。
//
// 如何新增一条线（例如「白居易」）：
//   1. 新建 stories/line-baijuyi.js，照抄 line-dufu.js 结构填写自己的数据
//   2. 在下方 LINES 数组里加一行 { id: 'baijuyi', ... } 注册
//   3. 生成该古人的立绘/场景图/语音包，放入对应 assets 目录
//   完成。story 页、chat 页无需改动。

const lineDufu = require('./line-dufu');
const lineLibai = require('./line-libai');
const lineSushi = require('./line-sushi');
const dufuLocations = require('./dufu-locations');
const dufuLocationQuests = require('./line-dufu-locations.generated');
const libaiLocations = require('./libai-locations');
const libaiLocationQuests = require('./line-libai-locations.generated');
const sushiLocations = require('./sushi-locations');
const sushiLocationQuests = require('./line-sushi-locations.generated');

// 图片路径工厂：运行时拼接出 /assets/images/<sub>，避免编译器把字符串字面量
// 当作本地静态资源打包（图片已迁移云存储，本地已无这些文件，直写会触发
// 编译期 ENOENT 报错）。运行时得到的完整路径再由 cloudAssets 解析为云链接。
function img(sub) {
  return '/assets/' + 'images/' + sub;
}

// ============ 故事线注册表（按上线顺序排） ============
const LINES = [
  {
    id: 'dufu',
    name: '杜甫',
    tagline: '诗史之旅',
    status: 'online',          // online=可玩 | coming=敬请期待
    portrait: img('npc/dufu-default.png'),
    youngPortrait: img('npc/dufu-p1-young.png'),  // 选择页卡牌用「年轻版」立绘
    cover: img('scenes/scene-p1-travel.jpg'),
    // —— 双轨兼容：杜甫走「地点叙事模式」，旧时期字段保留供迁移/回退/旧页面 ——
    narrativeMode: 'location',                       // location=地点模式 | period=时期模式
    locations: dufuLocations.locations,              // 22 地点元数据（顺序/坐标/诗笺）
    locationQuests: dufuLocationQuests,              // 22 地点剧情（自动生成）
    locationSceneSets: dufuLocations.sceneSets,      // 地点级场景别名映射
    locationKeyIds: dufuLocations.KEY_IDS,           // 7 个关键地点 id
    locationPeriodOf: dufuLocations.LOCATION_PERIOD, // 地点 id → 所属时期（AI 知识库映射）
    materialGaps: dufuLocations.materialGaps,        // 素材缺口表
    periods: lineDufu.periods,        // 各时期信息（story 页卡牌用）
    quests: lineDufu.quests,          // 各时期剧情节点（chat 页引擎用）
    scenes: lineDufu.scenes,          // 场景图集合
    sceneSets: lineDufu.sceneSets,    // 多场景映射
    npcImage: lineDufu.npcImage,      // NPC 默认立绘
    periodNpcImages: lineDufu.periodNpcImages,  // 各时期基准立绘
    periodNpcAnimations: lineDufu.periodNpcAnimations, // 已完成的时期轻动效（缺失时回退静态图）
    anchors: lineDufu.anchors        // 锚点名称表
  },
  {
    id: 'libai',
    name: '李白',
    tagline: '谪仙长风',
    status: 'online',
    portrait: img('npc/libai-default.png'),
    youngPortrait: img('npc/libai-p1-young.png'),  // 选择页卡牌用「年轻版」立绘
    cover: img('scenes/scene-libai-p1-jiang.jpg'),
    // —— 地点叙事模式（与杜甫一致）：李白走 20 地点行迹 ——
    narrativeMode: 'location',
    locations: libaiLocations.locations,
    locationQuests: libaiLocationQuests,
    locationSceneSets: libaiLocations.sceneSets,
    locationKeyIds: libaiLocations.KEY_IDS,
    locationPeriodOf: libaiLocations.LOCATION_PERIOD,
    materialGaps: libaiLocations.materialGaps,
    periods: lineLibai.periods,        // 旧时期字段保留（story 页卡牌 / 迁移 / 回退）
    quests: lineLibai.quests,
    scenes: lineLibai.scenes,
    sceneSets: lineLibai.sceneSets,
    npcImage: lineLibai.npcImage,
    periodNpcImages: lineLibai.periodNpcImages,
    periodNpcAnimations: lineLibai.periodNpcAnimations, // 各时期轻动效（缺失时回退静态图）
    anchors: lineLibai.anchors
  },
  {
    id: 'sushi',
    name: '苏轼',
    tagline: '一蓑烟雨',
    status: 'online',
    portrait: img('npc/sushi-default.png'),
    youngPortrait: img('npc/sushi-p1-young.png'),  // 选择页卡牌用「年轻版」立绘
    cover: img('scenes/scene-sushi-p1-meishan.jpg'),
    // —— 地点叙事模式（与杜甫一致）：苏轼走 22 地点行迹 ——
    narrativeMode: 'location',
    locations: sushiLocations.locations,
    locationQuests: sushiLocationQuests,
    locationSceneSets: sushiLocations.sceneSets,
    locationKeyIds: sushiLocations.KEY_IDS,
    locationPeriodOf: sushiLocations.LOCATION_PERIOD,
    materialGaps: sushiLocations.materialGaps,
    periods: lineSushi.periods,        // 旧时期字段保留（story 页卡牌 / 迁移 / 回退）
    quests: lineSushi.quests,
    scenes: lineSushi.scenes,
    sceneSets: lineSushi.sceneSets,
    npcImage: lineSushi.npcImage,
    periodNpcImages: lineSushi.periodNpcImages,
    periodNpcAnimations: lineSushi.periodNpcAnimations, // 各时期轻动效（缺失时回退静态图）
    anchors: lineSushi.anchors
  }
];

// ============ 统一查询接口 ============
const byId = {};
LINES.forEach(l => { byId[l.id] = l; });

function getLine(id) {
  return byId[id] || null;
}

function getOnlineLines() {
  return LINES.filter(l => l.status === 'online');
}

function getAllLines() {
  return LINES;
}

// ============ 地点模式统一查询接口 ============
// 地点模式（narrativeMode='location'）下，杜甫用地点推进而非时期。
// 这些接口供 map / chat / story / profile 统一适配层判断：杜甫读 locations，
// 李白、苏轼读 periods。旧字段（periods/quests）仍在，迁移完成前不删。

/** 取某条主线的地点列表（仅地点模式有；时期模式返回 []） */
function getLocations(lineId) {
  const line = byId[lineId];
  if (!line || line.narrativeMode !== 'location') return [];
  return line.locations || [];
}

/** 取某条主线单个地点的元数据 */
function getLocation(lineId, locationId) {
  const list = getLocations(lineId);
  return list.find(l => l.id === locationId) || null;
}

/** 取某条主线单个地点的剧情（QUEST_* 对象） */
function getLocationQuest(lineId, locationId) {
  const line = byId[lineId];
  if (!line || line.narrativeMode !== 'location') return null;
  return (line.locationQuests && line.locationQuests[locationId]) || null;
}

/** 取某条主线地点模式的推进顺序（地点 id 数组）；时期模式返回时期 id 数组 */
function getProgressOrder(lineId) {
  const line = byId[lineId];
  if (!line) return [];
  if (line.narrativeMode === 'location') {
    return getLocations(lineId).map(l => l.id);
  }
  return (line.periods || []).map(p => p.id);
}

module.exports = {
  LINES,
  getLine,
  getOnlineLines,
  getAllLines,
  getLocations,
  getLocation,
  getLocationQuest,
  getProgressOrder
};
