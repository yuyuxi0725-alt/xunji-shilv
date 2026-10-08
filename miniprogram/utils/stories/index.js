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

// 图片路径工厂：运行时拼接出 /assets/images/<sub>，避免编译器把字符串字面量
// 当作本地静态资源打包（图片已迁移云存储，本地已无这些文件，直写会触发
// 编译期 ENOENT 报错）。运行时得到的完整路径再由 cloudAssets 解析为云链接。
function img(sub) {
  return '/assets/' + 'images/' + sub;
}

// coming 状态古人暂用杜甫默认立绘作占位（不会真正展示，点击为「敬请期待」）
const PLACEHOLDER = img('npc/dufu-default.png');

// ============ 故事线注册表（按上线顺序排） ============
const LINES = [
  {
    id: 'dufu',
    name: '杜甫',
    tagline: '诗史之旅',
    status: 'online',          // online=可玩 | coming=敬请期待
    portrait: img('npc/dufu-default.png'),
    cover: img('scenes/scene-p1-travel.jpg'),
    periods: lineDufu.periods,        // 各时期信息（story 页卡牌用）
    quests: lineDufu.quests,          // 各时期剧情节点（chat 页引擎用）
    scenes: lineDufu.scenes,          // 场景图集合
    sceneSets: lineDufu.sceneSets,    // 多场景映射
    npcImage: lineDufu.npcImage,      // NPC 默认立绘
    periodNpcImages: lineDufu.periodNpcImages,  // 各时期基准立绘
    anchors: lineDufu.anchors        // 锚点名称表
  },
  {
    id: 'libai',
    name: '李白',
    tagline: '谪仙长风',
    status: 'online',
    portrait: img('npc/libai-default.png'),
    cover: img('scenes/scene-libai-p1-jiang.jpg'),
    periods: lineLibai.periods,
    quests: lineLibai.quests,
    scenes: lineLibai.scenes,
    sceneSets: lineLibai.sceneSets,
    npcImage: lineLibai.npcImage,
    periodNpcImages: lineLibai.periodNpcImages,
    anchors: lineLibai.anchors
  },
  {
    id: 'sushi',
    name: '苏轼',
    tagline: '东坡旷达',
    status: 'coming',
    portrait: PLACEHOLDER,
    cover: PLACEHOLDER,
    periods: [],
    quests: {},
    scenes: {},
    sceneSets: {},
    npcImage: PLACEHOLDER,
    periodNpcImages: {},
    anchors: {}
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

module.exports = {
  LINES,
  getLine,
  getOnlineLines,
  getAllLines
};
