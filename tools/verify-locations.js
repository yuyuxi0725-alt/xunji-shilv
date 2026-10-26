// tools/verify-locations.js —— 三线地点叙事模式的结构校验（杜甫/李白/苏轼通用）
//
// 泛化自 verify-location-story.js，按 lineId 参数化校验任一条地点模式主线：
//   1. 地点数与节点总数与生成器一致；
//   2. 关键地点数与 KEY_IDS 一致；
//   3. 地点顺序连续（order 1..N）；
//   4. 所有地点剧本从 start 可达 __end__；
//   5. 所有节点引用合法（next/options.next/options.result）；
//   6. 场景与立绘均有兜底；
//   7. anchorCard 只引用已登记锚点（且在 anchor-info 有展示数据）；
//   8. 所有地点都有轻量诗笺数据（poemLine + knowledge）；
//   9. 关键地点都有完整诗笺数据；
//   10. 注册表接入正确（narrativeMode=location + locations + locationQuests）。
//
// 运行：
//   node tools/verify-locations.js            # 校验全部三线
//   node tools/verify-locations.js dufu       # 只校验杜甫

const path = require('path');
const S = p => require(path.join(__dirname, '..', 'miniprogram', 'utils', 'stories', p));

// 三线配置：id → { meta 文件, quests 文件, 旧时期线文件, 地点数, 节点数, 关键地点数 }
const LINES = {
  dufu: { meta: 'dufu-locations.js', quests: 'line-dufu-locations.generated.js', legacy: 'line-dufu.js', count: 22, nodes: 854, key: 8 },
  libai: { meta: 'libai-locations.js', quests: 'line-libai-locations.generated.js', legacy: 'line-libai.js', count: 20, nodes: 384, key: 9 },
  sushi: { meta: 'sushi-locations.js', quests: 'line-sushi-locations.generated.js', legacy: 'line-sushi.js', count: 22, nodes: 432, key: 7 }
};

const VALID_TYPES = ['narrate', 'talk', 'choice', 'aiFree', 'reflect', 'anchorCard'];

function verifyLine(lineId, cfg) {
  const problems = [];
  const notes = [];

  const meta = S(cfg.meta);
  const quests = S(cfg.quests);
  const anchorInfo = S('anchor-info.js');
  const legacy = S(cfg.legacy);

  const locations = meta.locations;
  const keyIds = meta.KEY_IDS;
  const anchorTable = legacy.anchors || {};

  // 1) 地点数 + 节点数
  notes.push('地点 ' + locations.length + ' 处');
  let nodeTotal = 0;
  locations.forEach(l => {
    const q = quests[l.id];
    if (!q) { problems.push(l.id + ': 缺少 quests 定义'); return; }
    nodeTotal += Object.keys(q.nodes || {}).length;
  });
  notes.push('节点 ' + nodeTotal + ' 个');
  if (locations.length !== cfg.count) problems.push('地点数=' + locations.length + '（应为 ' + cfg.count + '）');
  if (nodeTotal !== cfg.nodes) problems.push('节点总数=' + nodeTotal + '（应为 ' + cfg.nodes + '）');

  // 2) 关键地点数
  const keyCount = locations.filter(l => l.importance === 'key').length;
  notes.push('关键地点 ' + keyCount + ' 处');
  if (keyCount !== cfg.key) problems.push('关键地点数=' + keyCount + '（应为 ' + cfg.key + '）');
  const keySet = locations.filter(l => l.importance === 'key').map(l => l.id).sort().join(',');
  const keyIdsSet = keyIds.slice().sort().join(',');
  if (keySet !== keyIdsSet) problems.push('importance=key 的地点与 KEY_IDS 不一致');

  // 3) order 连续
  locations.forEach((l, i) => {
    if (l.order !== i + 1) problems.push(l.id + ': order=' + l.order + '（应为 ' + (i + 1) + '）');
  });

  // 4/5/7/8) 可达性 + 引用 + anchorCard + trap
  locations.forEach(l => {
    const q = quests[l.id];
    if (!q) return;
    const nodes = q.nodes || {};
    const ids = Object.keys(nodes);
    if (!q.start || !nodes[q.start]) { problems.push(l.id + ': start 节点无效'); return; }
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

    ids.forEach(k => {
      const n = nodes[k];
      if (n.type === 'anchorCard') {
        if (!n.anchor) { problems.push(l.id + ' ' + k + ': anchorCard 缺少 anchor'); }
        else if (!anchorTable[n.anchor]) {
          problems.push(l.id + ' ' + k + ': anchorCard 引用未登记锚点 ' + n.anchor);
        } else if (!anchorInfo.getAnchorInfo(lineId, n.anchor)) {
          problems.push(l.id + ' ' + k + ': anchor ' + n.anchor + ' 在 anchor-info 无展示数据');
        }
      }
    });
  });

  // 6) 场景与立绘兜底
  locations.forEach(l => {
    if (!l.sceneKey) problems.push(l.id + ': 缺少 sceneKey');
    else if (!meta.sceneSets[l.id] || !meta.sceneSets[l.id][l.sceneKey]) {
      problems.push(l.id + ': sceneKey ' + l.sceneKey + ' 在 sceneSets 无映射');
    }
    if (!l.npcStage) problems.push(l.id + ': 缺少 npcStage');
  });

  // 8) 轻量诗笺
  locations.forEach(l => {
    if (!l.poemLine) problems.push(l.id + ': 缺少 poemLine（轻量诗笺）');
    if (!l.knowledge) problems.push(l.id + ': 缺少 knowledge（轻量诗笺）');
  });

  // 9) 关键地点完整诗笺
  locations.filter(l => l.importance === 'key').forEach(l => {
    ['subtitle', 'range', 'poemTitle', 'poemLine', 'knowledge'].forEach(f => {
      if (!l[f]) problems.push(l.id + ': 关键地点缺少 ' + f);
    });
  });

  // 10) 注册表接入
  try {
    const registry = S('index.js');
    const line = registry.getLine(lineId);
    if (!line) { problems.push('注册表缺少 ' + lineId); }
    else {
      if (line.narrativeMode !== 'location') problems.push(lineId + ' narrativeMode=' + line.narrativeMode + '（应为 location）');
      if (!line.locations || line.locations.length !== cfg.count) problems.push(lineId + ' 注册表 locations 未接入 ' + cfg.count + ' 地点');
      if (registry.getLocations(lineId).length !== cfg.count) problems.push('getLocations(' + lineId + ') 未返回 ' + cfg.count + ' 地点');
      if (registry.getProgressOrder(lineId).length !== cfg.count) problems.push('getProgressOrder(' + lineId + ') 未返回 ' + cfg.count + ' 项');
    }
  } catch (e) {
    problems.push('无法加载注册表 index.js: ' + e.message);
  }

  return { problems, notes };
}

const arg = process.argv[2];
const targets = arg && LINES[arg] ? { [arg]: LINES[arg] } : LINES;

let allProblems = 0;
Object.entries(targets).forEach(([lineId, cfg]) => {
  console.log('=== ' + lineId + ' 地点叙事结构 ===');
  const { problems, notes } = verifyLine(lineId, cfg);
  notes.forEach(n => console.log('  ' + n));
  if (problems.length) {
    allProblems += problems.length;
    console.log('  ✗ 发现问题 ' + problems.length + ' 条：');
    problems.forEach(p => console.log('    ✗ ' + p));
  } else {
    console.log('  ✓ ' + cfg.count + ' 地点 / ' + cfg.nodes + ' 节点 / 结构、锚点、诗笺全部通过');
  }
  console.log('');
});

if (allProblems) {
  console.log('FAILED：' + allProblems + ' 条问题');
  process.exit(1);
}
console.log('ALL_OK 三线地点叙事全部通过');
process.exit(0);
