// tools/verify-story.js —— 剧本结构与「考据挑战」完整性校验
//
// 为什么需要：剧本有 255 个节点，手工维护极易出现"改了一处、断了另一处"。
// 这个脚本把踩过的坑固化成断言：节点可达性、场景 key 是否存在、锚点是否合法、
// 每期是否有且仅有 1 个 aiFree / reflect / 决定性瞬间、考据挑战是否挂对位置。
//
// 运行：node tools/verify-story.js

const path = require('path');
const S = p => require(path.join(__dirname, '..', 'miniprogram', 'utils', 'stories', p));

const lines = { dufu: S('line-dufu'), libai: S('line-libai'), sushi: S('line-sushi') };
const problems = [];
const notes = [];

Object.keys(lines).forEach((lid) => {
  const L = lines[lid];
  const anchors = L.anchors || {};
  const periodIds = (L.periods || []).map(p => p.id);
  let trapCount = 0;
  let nodeTotal = 0;

  if (!periodIds.length) problems.push(lid + ': periods 为空');

  periodIds.forEach((qid) => {
    const q = L.quests && L.quests[qid];
    if (!q) { problems.push(lid + ' ' + qid + ': 缺少 quests 定义'); return; }
    const nodes = q.nodes || {};
    const ids = Object.keys(nodes);
    nodeTotal += ids.length;

    // ---- 1) 节点可达性（从 start 出发做 DFS）----
    const seen = {};
    const stack = [q.start];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || cur === '__end__' || seen[cur]) continue;
      const n = nodes[cur];
      if (!n) { problems.push(lid + ' ' + qid + ': 引用了不存在的节点 ' + cur); continue; }
      seen[cur] = true;
      if (n.next) stack.push(n.next);
      (n.options || []).forEach((o) => {
        if (o.next) stack.push(o.next);
        if (o.result) stack.push(o.result);
      });
    }
    const unreachable = ids.filter(k => !seen[k]);
    if (unreachable.length) {
      problems.push(lid + ' ' + qid + ': 不可达节点 ' + unreachable.join(','));
    }

    // ---- 2) 每期结构：1 个 aiFree / 1 个 reflect / ≥1 个决定性瞬间 ----
    const aiFrees = ids.filter(k => nodes[k].type === 'aiFree');
    const reflects = ids.filter(k => nodes[k].type === 'reflect');
    const keyChoices = ids.filter(k => nodes[k].type === 'choice'
      && (nodes[k].options || []).some(o => o.right !== undefined));
    if (aiFrees.length !== 1) problems.push(lid + ' ' + qid + ': aiFree 数量=' + aiFrees.length + '（应为 1）');
    if (reflects.length !== 1) problems.push(lid + ' ' + qid + ': reflect 数量=' + reflects.length + '（应为 1）');
    if (keyChoices.length < 1) problems.push(lid + ' ' + qid + ': 缺少「决定性瞬间」');

    // ---- 3) 锚点合法性 ----
    ids.forEach((k) => {
      const n = nodes[k];
      if (n.anchor && !anchors[n.anchor]) {
        problems.push(lid + ' ' + qid + ' ' + k + ': anchor ' + n.anchor + ' 不在锚点表');
      }
    });

    // ---- 4) 场景 key 必须在 sceneSets 里存在（否则场景切不动 / 图裂）----
    const sets = (L.sceneSets || {})[qid] || {};
    ids.forEach((k) => {
      const n = nodes[k];
      if (n.scene && !sets[n.scene]) {
        problems.push(lid + ' ' + qid + ' ' + k + ': scene "' + n.scene + '" 不在 SCENE_SETS.' + qid);
      }
    });

    // ---- 5) 考据挑战：每期恰好 1 处，且必须挂在 aiFree 上 ----
    const traps = ids.filter(k => nodes[k].trap);
    trapCount += traps.length;
    if (traps.length !== 1) {
      problems.push(lid + ' ' + qid + ': 考据挑战数量=' + traps.length + '（应为 1）');
    }
    traps.forEach((k) => {
      const n = nodes[k];
      const t = n.trap;
      if (n.type !== 'aiFree') {
        problems.push(lid + ' ' + qid + ' ' + k + ': trap 不在 aiFree 节点上（当前 ' + n.type + '）');
      }
      ['text', 'wrong', 'right', 'hint', 'catchText', 'anchor'].forEach((f) => {
        if (!t[f]) problems.push(lid + ' ' + qid + ' ' + k + ': trap 缺少字段 ' + f);
      });
      if (t.anchor && !anchors[t.anchor]) {
        problems.push(lid + ' ' + qid + ' ' + k + ': trap.anchor ' + t.anchor + ' 不在锚点表');
      }
      // 错漏与正确答案不能相同（否则玩家无错可捉）
      if (t.wrong && t.right && t.wrong === t.right) {
        problems.push(lid + ' ' + qid + ' ' + k + ': trap.wrong 与 trap.right 相同');
      }
    });

    // ---- 6) 回忆闪回节点不应显示立绘 ----
    ids.forEach((k) => {
      const n = nodes[k];
      if (n.sceneMode === 'flashback' && n.npc !== false) {
        notes.push('提示 ' + lid + ' ' + qid + ' ' + k + ': flashback 节点未设 npc:false（立绘可能出戏）');
      }
    });
  });

  notes.push(lid + ': ' + periodIds.length + ' 期 / ' + nodeTotal + ' 节点 / 锚点 '
    + Object.keys(anchors).length + ' 个 / 考据挑战 ' + trapCount + ' 处');
});

// ---- 7) 注册表一致性 ----
try {
  const registry = S('index.js');
  Object.keys(lines).forEach((lid) => {
    const reg = registry.getLine(lid);
    if (!reg) { problems.push('注册表缺少主线 ' + lid); return; }
    if (!reg.periods || !reg.periods.length) problems.push('注册表 ' + lid + ' 未接入 periods');
    if (reg.status !== 'online') problems.push('注册表 ' + lid + ' status=' + reg.status + '（应为 online）');
  });
} catch (e) {
  problems.push('无法加载注册表 index.js: ' + e.message);
}

// ---- 汇总 ----
console.log('=== 剧本概况 ===');
notes.forEach(n => console.log('  ' + n));

if (problems.length) {
  console.log('\n=== 发现问题 ' + problems.length + ' 条 ===');
  problems.forEach(p => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('\nALL_OK 剧本结构、场景/锚点引用、考据挑战全部通过');
process.exit(0);
