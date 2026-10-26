// tools/verify-location-story.js —— 杜甫 22 地点叙事模式的结构校验（已被 verify-locations.js 泛化替代）
//
// 校验（对应 docs/杜甫21地点地图叙事-开发实施步骤.md 步骤 10）：
//   1. 22 地点、854 节点；
//   2. 8 个关键地点；
//   3. 22 个地点顺序连续（order 1–22）；
//   4. 所有地点剧本从 start 可达 __end__；
//   5. 所有节点引用合法（next/options.next/options.result）；
//   6. 场景与立绘均有兜底；
//   7. anchorCard 只引用已登记锚点；
//   8. 不再残留旧版 trap 选择对错数据；
//   9. 所有地点都有轻量诗笺数据（poemLine + knowledge）；
//   10. 所有关键地点都有完整诗笺所需数据（subtitle/range 等）。
//
// 运行：node tools/verify-location-story.js

const path = require('path');
const S = p => require(path.join(__dirname, '..', 'miniprogram', 'utils', 'stories', p));

const meta = S('dufu-locations.js');
const quests = S('line-dufu-locations.generated.js');
const anchorInfo = S('anchor-info.js');
const lineDufu = S('line-dufu.js');   // 旧时期剧本，供锚点表/立绘兜底比对

const problems = [];
const notes = [];
const locations = meta.locations;
const keyIds = meta.KEY_IDS;
const anchorTable = lineDufu.anchors || {};

// ---- 1) 22 地点、854 节点 ----
notes.push('地点 ' + locations.length + ' 处');
let nodeTotal = 0;
locations.forEach(l => {
  const q = quests[l.id];
  if (!q) { problems.push(l.id + ': 缺少 quests 定义'); return; }
  nodeTotal += Object.keys(q.nodes || {}).length;
});
notes.push('节点 ' + nodeTotal + ' 个');
if (locations.length !== 22) problems.push('地点数=' + locations.length + '（应为 22）');
if (nodeTotal !== 854) problems.push('节点总数=' + nodeTotal + '（应为 854）');

// ---- 2) 8 个关键地点 ----
const keyCount = locations.filter(l => l.importance === 'key').length;
notes.push('关键地点 ' + keyCount + ' 处');
if (keyCount !== 8) problems.push('关键地点数=' + keyCount + '（应为 8）');
// key 集合与 KEY_IDS 一致
const keySet = locations.filter(l => l.importance === 'key').map(l => l.id).sort().join(',');
const keyIdsSet = keyIds.slice().sort().join(',');
if (keySet !== keyIdsSet) problems.push('importance=key 的地点与 KEY_IDS 不一致');

// ---- 3) order 连续 1–22 ----
locations.forEach((l, i) => {
  if (l.order !== i + 1) problems.push(l.id + ': order=' + l.order + '（应为 ' + (i + 1) + '）');
});

// ---- 4/5) 可达性 + 节点引用合法 ----
const VALID_TYPES = ['narrate', 'talk', 'choice', 'aiFree', 'reflect', 'anchorCard'];
locations.forEach(l => {
  const q = quests[l.id];
  if (!q) return;
  const nodes = q.nodes || {};
  const ids = Object.keys(nodes);
  if (!q.start || !nodes[q.start]) {
    problems.push(l.id + ': start 节点无效');
    return;
  }
  const seen = {};
  const stack = [q.start];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || cur === '__end__' || seen[cur]) continue;
    const n = nodes[cur];
    if (!n) { problems.push(l.id + ': 引用了不存在的节点 ' + cur); continue; }
    seen[cur] = true;
    if (!VALID_TYPES.includes(n.type)) problems.push(l.id + ' ' + cur + ': 未知节点类型 ' + n.type);
    if (n.next) stack.push(n.next);
    (n.options || []).forEach(o => {
      if (o.next) stack.push(o.next);
      if (o.result) stack.push(o.result);
    });
  }
  const unreachable = ids.filter(k => !seen[k]);
  if (unreachable.length) problems.push(l.id + ': 不可达节点 ' + unreachable.join(','));

  // ---- 7) anchorCard 只引用已登记锚点 ----
  ids.forEach(k => {
    const n = nodes[k];
    if (n.type === 'anchorCard') {
      if (!n.anchor) { problems.push(l.id + ' ' + k + ': anchorCard 缺少 anchor'); }
      else if (!anchorTable[n.anchor]) {
        problems.push(l.id + ' ' + k + ': anchorCard 引用未登记锚点 ' + n.anchor);
      } else if (!anchorInfo.getAnchorInfo('dufu', n.anchor)) {
        problems.push(l.id + ' ' + k + ': anchor ' + n.anchor + ' 在 anchor-info 无展示数据');
      }
    }
  });

  // ---- 8) 旧版 trap 选择对错数据已经退场 ----
  // 常见误解现在由知识库规则在玩家主动说错时纠正；玩家没提就正常聊天。
  ids.forEach(k => {
    const n = nodes[k];
    if (n.trap) problems.push(l.id + ' ' + k + ': 仍残留旧版 trap 选择对错数据');
  });
});

// ---- 6) 场景与立绘兜底 ----
locations.forEach(l => {
  if (!l.sceneKey) problems.push(l.id + ': 缺少 sceneKey');
  else if (!meta.sceneSets[l.id] || !meta.sceneSets[l.id][l.sceneKey]) {
    problems.push(l.id + ': sceneKey ' + l.sceneKey + ' 在 sceneSets 无映射');
  }
  if (!l.npcStage) problems.push(l.id + ': 缺少 npcStage');
});

// ---- 9) 每个地点有轻量诗笺数据 ----
locations.forEach(l => {
  if (!l.poemLine) problems.push(l.id + ': 缺少 poemLine（轻量诗笺）');
  if (!l.knowledge) problems.push(l.id + ': 缺少 knowledge（轻量诗笺）');
});

// ---- 10) 关键地点有完整诗笺所需数据 ----
locations.filter(l => l.importance === 'key').forEach(l => {
  ['subtitle', 'range', 'poemTitle', 'poemLine', 'knowledge'].forEach(f => {
    if (!l[f]) problems.push(l.id + ': 关键地点缺少 ' + f);
  });
});

// ---- 11) 杜甫线关键史实元数据不可退回旧口径 ----
const byId = {};
locations.forEach(l => { byId[l.id] = l; });
if (!(byId.taishan.order < byId.shouang.order && byId.shouang.order < byId.qizhao.order)) {
  problems.push('早年顺序应为泰山 → 洛阳守丧 → 744–745年李杜同游');
}
if (byId.qizhao.range.indexOf('744') < 0 || byId.qizhao.name !== '齐鲁') {
  problems.push('qizhao 应按744–745年梁宋齐鲁交游展示');
}
if (byId.jingzhou.name !== '岳阳') problems.push('jingzhou 内部ID的玩家可见名称应为岳阳');
if (byId.tanzhou.range.indexOf('770') < 0) problems.push('潭州《江南逢李龟年》应标770年春');
if (/病逝(于)?湘江舟中/.test(byId.xiangjiang.knowledge)) {
  problems.push('湘江终章不得把具体卒地写成唯一史实定论');
}

// ---- 注册表接入检查 ----
try {
  const registry = S('index.js');
  const line = registry.getLine('dufu');
  if (!line) { problems.push('注册表缺少 dufu'); }
  else {
    if (line.narrativeMode !== 'location') problems.push('dufu narrativeMode=' + line.narrativeMode + '（应为 location）');
    if (!line.locations || line.locations.length !== 22) problems.push('dufu 注册表 locations 未接入 22 地点');
    if (registry.getLocations('dufu').length !== 22) problems.push('getLocations(dufu) 未返回 22 地点');
    if (!registry.getLocationQuest('dufu', 'luoyang')) problems.push('getLocationQuest(dufu, luoyang) 为空');
    if (registry.getProgressOrder('dufu').length !== 22) problems.push('getProgressOrder(dufu) 未返回 22 项');
  }
} catch (e) {
  problems.push('无法加载注册表 index.js: ' + e.message);
}

// ---- 汇总 ----
console.log('=== 杜甫 22 地点叙事结构 ===');
notes.forEach(n => console.log('  ' + n));

if (problems.length) {
  console.log('\n=== 发现问题 ' + problems.length + ' 条 ===');
  problems.forEach(p => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('\nALL_OK 22 地点 / 854 节点 / 结构、锚点、诗笺数据全部通过');
process.exit(0);
