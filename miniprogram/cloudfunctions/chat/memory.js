// cloudfunctions/chat/memory.js —— 杜甫「共同经历」表 + 时间截断纯逻辑（可单元测试）
//
// 职责（对应 docs/杜甫全程玩家角色-修改实施方案.md 步骤七）：
//   · 第一版只记「必经事实」——每个地点一条所有玩家都会经历的公共事件摘要，
//     不含任何「玩家选择了某选项」这类未必发生、也无法从存档证明的分支记忆；
//   · resolveAvailableEvents 只允许引用「当前叙事位置之前、且已完成」的地点事件，
//     从而让杜甫只记得当时已经发生的共同经历，不预知未来地点、诗作或结局。
//
// 设计约束：
//   · eventId = `dufu.<locationId>`（稳定，与地点 ID 一一对应）；
//   · 事件摘要为短句（不把 22 地点全文塞进提示词）；
//   · 不依赖 wx / 云环境 / 数据库，纯函数，可被 tools/test-dufu-memory.js 直接 require。

// 杜甫 22 地点时间顺序（与 utils/stories/dufu-locations.js 的 locations 顺序一致）
const DUFU_ORDER = [
  'luoyang', 'shuhu', 'wuyue', 'luoyang_shi', 'taishan', 'shouang', 'qizhao',
  'changan', 'yexian', 'fengxian', 'changan_xian', 'fengxiang', 'qiangcun', 'huazhou',
  'qinzhou', 'tonggu', 'chengdu', 'kuizhou', 'jingzhou', 'tanzhou', 'hengzhou', 'xiangjiang'
];

// 每个地点的必经共同经历摘要（只写全体玩家都会经历的事实，不写具体选择）
const DUFU_EVENTS = {
  luoyang: '洛阳书房初见，七岁的杜甫写下「开口咏凤凰」，讲起祖父杜审言的家学渊源',
  shuhu: '郾城观公孙大娘舞剑，杜甫看得入神，感慨剑法如诗、一招一式都不多余',
  wuyue: '吴越南游途中重逢，杜甫走过金陵旧都、姑苏台榭，说读万卷书不如行万里路',
  luoyang_shi: '洛阳应举落第，杜甫没有消沉，转而放荡齐赵之间',
  taishan: '同登泰山望岳，杜甫写下「会当凌绝顶，一览众山小」',
  shouang: '洛阳守丧，父丧家变之际的陪伴',
  qizhao: '天宝三、四载间在梁宋齐鲁与李白同游，纵马射猎、谈诗论道',
  changan: '长安十年干谒求仕，屡屡碰壁，看尽朝政腐败',
  yexian: '制举落第，李林甫一句「野无遗贤」让满城举子尽数落榜',
  fengxian: '奉先幼子夭折，杜甫写下「朱门酒肉臭，路有冻死骨」',
  changan_xian: '安史之乱中长安陷贼，身陷叛军写下「国破山河在，城春草木深」',
  fengxiang: '凤翔麻鞋见天子，杜甫冒死投奔，授左拾遗',
  qiangcun: '羌村团聚，乱世中一家重逢的温情',
  huazhou: '华州任上西行，写下《三吏》《三别》',
  qinzhou: '弃官西行入秦州，开始漂泊西南',
  tonggu: '同谷饥寒交迫，拾橡栗充饥的最艰难冬天',
  chengdu: '成都草堂安居，写下《茅屋为秋风所破歌》',
  kuizhou: '夔州登高，写下「无边落木萧萧下，不尽长江滚滚来」',
  jingzhou: '岳阳登岳阳楼，望洞庭浩渺',
  tanzhou: '潭州江南逢李龟年，落花时节又逢君',
  hengzhou: '衡州阻水耒阳，生命尾声的挣扎',
  xiangjiang: '湖南水路漂泊中的舟中书怀；杜甫于770年去世，具体卒地有异说'
};

/** 地点 ID 是否在杜甫线白名单内 */
function isKnownLocation(locationId) {
  return DUFU_ORDER.indexOf(locationId) >= 0;
}

// 终章回望文案（第二人称，供「同行者」收束面板使用；与 DUFU_EVENTS 同一批必经事件）。
// 与 DUFU_EVENTS 的差别只是人称与语气：这里是给玩家读的 UI 文案，那里是给模型的提示词。
// 由 tools/build-dufu-memory.js 生成到 miniprogram/utils/dufu-events.js，改这里后重跑即可。
const DUFU_RECAPS = {
  luoyang: '洛阳的东厢房里，你第一次见他——七岁的孩子写下「开口咏凤凰」',
  shuhu: '郾城看公孙大娘舞剑，他看得入神，说写诗也该像那剑，一招一式都不多余',
  wuyue: '你陪他走过吴越的山水，他说读万卷书不如行万里路',
  luoyang_shi: '洛阳应举落第，他转过马头，往齐赵去了',
  taishan: '泰山的台阶望不到顶，他在山巅写下「会当凌绝顶，一览众山小」',
  shouang: '洛阳守丧那年，你赶去陪他坐了很久',
  qizhao: '梁宋齐鲁的原野上，你和李白、杜甫一起纵马',
  changan: '长安十年，你见他一次次叩门，又一次次空手而归',
  yexian: '榜下无一人，只留一句「野无遗贤」',
  fengxian: '奉先那个冬天，他把丧子之痛写成「朱门酒肉臭，路有冻死骨」',
  changan_xian: '长安陷落，他困在城里写「国破山河在，城春草木深」',
  fengxiang: '他麻鞋见天子，衣袖露着两肘',
  qiangcun: '羌村的夜里，他终于和家人团聚',
  huazhou: '西行路上，他一路记下《三吏》《三别》',
  qinzhou: '他弃了官，往更西的秦州去',
  tonggu: '同谷的冬天最难，他拾橡栗充饥',
  chengdu: '浣花溪畔的草堂，他总算歇了几年',
  kuizhou: '夔州高处，他写下「无边落木萧萧下，不尽长江滚滚来」',
  jingzhou: '岳阳楼上，他望着洞庭湖',
  tanzhou: '潭州落花时节，他遇见了李龟年',
  hengzhou: '耒阳的水涨了，船停在衡州',
  xiangjiang: '湘江孤舟的文学化重逢里，他把最后一卷诗稿交到你手中'
};

/**
 * 计算「当前可用共同经历」——只取当前地点之前、且已完成的地点的必经事件。
 *
 * @param {string} currentLocationId 当前叙事位置（地点 ID）
 * @param {Array<string>} completedLocations 已完成的地点 ID 列表（服务端以云端存档为准，
 *        读不到时才降级用客户端本地声称；无论如何都在此做白名单 + 顺序截断）
 * @param {object} [opts] { limit } 最多注入几条（默认 3，取离当前最近的最相关）
 * @returns {Array<{eventId, sourceLocationId, summary}>}
 */
function resolveAvailableEvents(currentLocationId, completedLocations, opts) {
  const limit = (opts && typeof opts.limit === 'number') ? opts.limit : 3;
  const curIdx = DUFU_ORDER.indexOf(currentLocationId);
  if (curIdx < 0) return [];   // 未知地点：不注入任何记忆

  const done = {};
  (completedLocations || []).forEach((id) => {
    if (DUFU_ORDER.indexOf(id) >= 0) done[id] = true;   // 白名单：只认已注册地点
  });

  const out = [];
  for (let i = 0; i < curIdx; i++) {
    const loc = DUFU_ORDER[i];
    if (done[loc] && DUFU_EVENTS[loc]) {
      out.push({ eventId: 'dufu.' + loc, sourceLocationId: loc, summary: DUFU_EVENTS[loc] });
    }
  }
  // 取最近的 limit 条（离当前叙事位置越近越相关）
  return out.slice(-limit);
}

/**
 * 按 AI 场景白名单解析可信 prompt（npcId / locationId / nodeId 三要素校验）。
 * 命中返回白名单里的 prompt；未命中（越级 URL / 伪造 nodeId / 旧客户端不传 nodeId）返回空串，
 * 由调用方决定是否降级为通用语气——绝不放行客户端自由传入的 freePrompt。
 * @param {object} scenesData scenes.js 导出的白名单数据
 * @param {string} npc 人物线 id
 * @param {string} locationId 地点 id
 * @param {string} nodeId AI 节点 id
 * @returns {string} 可信 prompt（未命中为空串）
 */
function resolveScenePrompt(scenesData, npc, locationId, nodeId) {
  const line = scenesData && scenesData[npc];
  if (!line) return '';
  if (!nodeId) return '';   // 旧客户端不传 nodeId：不信任 freePrompt，给空
  const loc = line.scenes && line.scenes[locationId];
  if (!loc || !loc[nodeId]) return '';   // 越级/伪造 nodeId：拒绝
  return loc[nodeId].prompt || '';
}

module.exports = {
  DUFU_ORDER,
  DUFU_EVENTS,
  DUFU_RECAPS,
  isKnownLocation,
  resolveAvailableEvents,
  resolveScenePrompt
};
