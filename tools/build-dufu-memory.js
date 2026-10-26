// tools/build-dufu-memory.js —— 从生成剧本提取杜甫 AI 场景白名单，并派生前端事件表
//
// 用途（对应 docs/杜甫全程玩家角色-修改实施方案.md 步骤七、步骤九）：
//   1. 服务端需要用「可信场景 prompt」替代客户端自由传入的 freePrompt，并对
//      npcId / locationId / nodeId 做白名单校验；
//      场景白名单唯一来源是剧本本身——从 miniprogram/utils/stories/line-dufu-locations.generated.js
//      提取所有 aiFree 节点，生成 cloudfunctions/chat/scenes.js（禁止手改，改剧本重跑本脚本）。
//   2. 终章回望与 AI 记忆必须使用同一批「必经事件」，因此这里把
//      cloudfunctions/chat/memory.js 的 DUFU_ORDER / DUFU_EVENTS / DUFU_RECAPS
//      派生为 miniprogram/utils/dufu-events.js，供前端收束面板消费。
//      memory.js 是唯一手工维护源；前端表是生成物，不允许反向手改。
//
// 运行：node tools/build-dufu-memory.js
//   （重复运行结果幂等；无时间戳，便于 diff 确认与源稿一致。）

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const quests = require(path.join(ROOT, 'miniprogram/utils/stories/line-dufu-locations.generated.js'));
const dufuLocations = require(path.join(ROOT, 'miniprogram/utils/stories/dufu-locations.js'));
const memory = require(path.join(ROOT, 'miniprogram/cloudfunctions/chat/memory.js'));

const LOCATION_PERIOD = dufuLocations.LOCATION_PERIOD || {};
const order = dufuLocations.locations.map(l => l.id);

const scenes = {};
let nodeCount = 0;

order.forEach((lid) => {
  const quest = quests[lid];
  if (!quest || !quest.nodes) return;
  Object.keys(quest.nodes).forEach((nid) => {
    const n = quest.nodes[nid];
    if (n.type !== 'aiFree') return;
    if (!scenes[lid]) scenes[lid] = {};
    scenes[lid][nid] = {
      prompt: (n.prompt || '').trim(),
      period: LOCATION_PERIOD[lid] || ''
    };
    nodeCount++;
  });
});

const out = {
  dufu: {
    order,
    scenes
  }
};

const header = `// cloudfunctions/chat/scenes.js —— 杜甫 AI 场景白名单（自动生成，禁止手改）
//
// 由 tools/build-dufu-memory.js 从 miniprogram/utils/stories/line-dufu-locations.generated.js 提取。
// 改剧本（docs/杜甫行迹剧本-全22地点-含分镜.md）后需重新运行：node tools/build-dufu-memory.js
// 服务端据此校验 npcId / locationId / nodeId，并用可信 prompt 替代客户端自由 freePrompt。
//
// 结构：{ dufu: { order: string[], scenes: { [locationId]: { [nodeId]: { prompt, period } } } } }

module.exports = ${JSON.stringify(out, null, 2)};
`;

const target = path.join(ROOT, 'miniprogram/cloudfunctions/chat/scenes.js');
fs.writeFileSync(target, header, 'utf8');
console.log('已生成', path.relative(ROOT, target));
console.log('地点', order.length, '/ aiFree 场景', nodeCount);

// ============ 派生前端事件表（终章回望用） ============
// 源仍是 memory.js（唯一手工维护处），这里只做「搬运 + 结构整理」，避免两处各写一份文案。
const eventsOut = {
  order: memory.DUFU_ORDER.slice(),
  events: {},
  recaps: {}
};
memory.DUFU_ORDER.forEach((lid) => {
  eventsOut.events[lid] = memory.DUFU_EVENTS[lid] || '';
  eventsOut.recaps[lid] = memory.DUFU_RECAPS[lid] || '';
});

const eventsHeader = `// utils/dufu-events.js —— 杜甫 22 地点必经事件与终章回望文案（自动生成，禁止手改）
//
// 由 tools/build-dufu-memory.js 从 cloudfunctions/chat/memory.js 派生。
// memory.js 是唯一手工维护源；改文案请改 memory.js 的 DUFU_EVENTS / DUFU_RECAPS，再重跑：
//   node tools/build-dufu-memory.js
//
// 用途：
//   · recaps 供终章「同行者」收束面板生成回望（第二人称 UI 文案）；
//   · events 为必经事实摘要（AI 提示词同源的另一版本），前端一般不直接用。
// 两份表都只含「全体玩家必经事件」，不含任何分支选择，因此换外观/改姓名都不影响终章正文。
//
// 结构：{ order: string[], events: { [locationId]: string }, recaps: { [locationId]: string } }

module.exports = ${JSON.stringify(eventsOut, null, 2)};
`;

const eventsTarget = path.join(ROOT, 'miniprogram/utils/dufu-events.js');
fs.writeFileSync(eventsTarget, eventsHeader, 'utf8');
console.log('已生成', path.relative(ROOT, eventsTarget));
console.log('必经事件', Object.keys(eventsOut.events).length, '/ 回望文案', Object.keys(eventsOut.recaps).length);
