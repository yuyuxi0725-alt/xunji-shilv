// tools/build-libai-locations.js —— 从 Markdown 剧本生成李白 20 地点运行时数据
//
// 背景：`docs/整合_李白_剧本与分镜_完整版.md` 是编剧工作稿，正文里每个地点是一个
//   ```js ... const QUEST_XXX = {...}; ... ``` 代码块。构建期把 20 个 QUEST_* 对象
//   提取出来，落成一份稳定的 JS 数据文件：
//     miniprogram/utils/stories/line-libai-locations.generated.js
//   该文件【自动生成、禁止手工修改】，改动一律回到 md 改源稿后重新生成。
//
// 用法：
//   node tools/build-libai-locations.js             # 生成（覆盖写）
//   node tools/build-libai-locations.js --check     # 只校验，不写文件
//
// 校验规则与 build-dufu-locations.js 对齐（20 地点 / 锚点 lb1–lb22 全覆盖）。

const fs = require('fs');
const path = require('path');

const MD_PATH = path.join(__dirname, '..', 'docs', '整合_李白_剧本与分镜_完整版.md');
const OUT_PATH = path.join(__dirname, '..', 'miniprogram', 'utils', 'stories', 'line-libai-locations.generated.js');

// 地点顺序（与源稿「地点 1…地点 20」一致；2026-10-22 按新整合版剧本：
//   id 从 yelang 改为 liuyelang，其余 id 不变）
const EXPECTED_IDS = [
  'qinglian', 'emei', 'jingmen', 'yangzhou', 'anlu', 'changan1', 'zhongnan',
  'hanlin', 'luoyang_libai', 'songshan', 'tianmu', 'liangsong', 'xuanzhou',
  'youyan', 'lushan', 'yongwang', 'xunyang', 'liuyelang', 'baidi', 'dangtu'
];

// 李白线锚点表（与 line-libai.js 的 ANCHORS 一致，lb1–lb22 连续编号）
const ANCHOR_IDS = ['lb1', 'lb2', 'lb3', 'lb4', 'lb5', 'lb6', 'lb7', 'lb8', 'lb9', 'lb10', 'lb11', 'lb12', 'lb13', 'lb14', 'lb15', 'lb16', 'lb17', 'lb18', 'lb19', 'lb20', 'lb21', 'lb22'];
const ANCHOR_SET = {};
ANCHOR_IDS.forEach(a => { ANCHOR_SET[a] = true; });

const VALID_TYPES = { narrate: 1, talk: 1, choice: 1, aiFree: 1, reflect: 1, anchorCard: 1 };

// ---------- 提取 ----------
// 注意：QUEST 名可能含数字（如 QUEST_CHANGAN_1），正则用 [A-Za-z0-9_]。
function extractQuests(md) {
  const re = /```js\s*\n([\s\S]*?)\n```/g;
  const quests = [];
  const order = [];
  let m;
  while ((m = re.exec(md)) !== null) {
    const block = m[1];
    const idm = /const\s+QUEST_[A-Za-z0-9_]+\s*=\s*\{/.exec(block);
    if (!idm) continue;
    const body = block.replace(/const\s+QUEST_[A-Za-z0-9_]+\s*=\s*/, 'return ');
    try {
      const fn = new Function(body);
      const obj = fn();
      quests.push(obj);
      order.push(obj && obj.id);
    } catch (e) {
      throw new Error('求值失败：' + e.message + '\n--- 代码块 ---\n' + block.slice(0, 400));
    }
  }
  return { quests, order };
}

// ---------- 校验 ----------
function verify(quests) {
  const problems = [];
  const byId = {};
  quests.forEach(q => {
    if (!q || !q.id) { problems.push('存在缺 id 的 quest'); return; }
    if (byId[q.id]) problems.push('id 重复：' + q.id);
    byId[q.id] = q;
  });

  if (quests.length !== 20) problems.push('quest 数量=' + quests.length + '（应为 20）');
  const actualIds = quests.map(q => q.id).join(',');
  const expectIds = EXPECTED_IDS.join(',');
  if (actualIds !== expectIds) {
    problems.push('id 顺序与源稿不一致\n  实际=' + actualIds + '\n  期望=' + expectIds);
  }

  quests.forEach(q => {
    ['id', 'title', 'range', 'start', 'nodes'].forEach(f => {
      if (!q[f]) problems.push(q.id + ': 缺少字段 ' + f);
    });
  });

  let nodeTotal = 0;
  let anchorCardCount = 0;
  let aiFreeCount = 0;
  const usedAnchors = {};

  quests.forEach(q => {
    if (!q.nodes) return;
    const nodes = q.nodes;
    const ids = Object.keys(nodes);
    nodeTotal += ids.length;

    const seen = {};
    const stack = [q.start];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || cur === '__end__' || seen[cur]) continue;
      const n = nodes[cur];
      if (!n) { problems.push(q.id + ': 引用不存在的节点 ' + cur); continue; }
      seen[cur] = true;
      if (n.next) stack.push(n.next);
      (n.options || []).forEach(o => {
        if (o.next) stack.push(o.next);
        if (o.result) stack.push(o.result);
      });
    }
    const unreachable = ids.filter(k => !seen[k]);
    if (unreachable.length) problems.push(q.id + ': 不可达节点 ' + unreachable.join(','));

    ids.forEach(k => {
      const n = nodes[k];
      if (!VALID_TYPES[n.type]) problems.push(q.id + ' ' + k + ': 非法节点类型 ' + n.type);
      if (n.type === 'choice') {
        if (!Array.isArray(n.options) || !n.options.length) {
          problems.push(q.id + ' ' + k + ': choice 缺少 options');
        }
        (n.options || []).forEach((o, i) => {
          const target = o.next || o.result;
          if (!target) problems.push(q.id + ' ' + k + ': option[' + i + '] 缺 next/result');
          if (o.anchor && !ANCHOR_SET[o.anchor]) {
            problems.push(q.id + ' ' + k + ': option[' + i + '].anchor ' + o.anchor + ' 不在 lb 白名单');
          }
        });
      }
    });

    ids.forEach(k => {
      const n = nodes[k];
      if (n.anchor) {
        usedAnchors[n.anchor] = true;
        if (!ANCHOR_SET[n.anchor]) problems.push(q.id + ' ' + k + ': anchor ' + n.anchor + ' 不在 lb 白名单');
      }
      if (n.trap && n.trap.anchor) {
        usedAnchors[n.trap.anchor] = true;
        if (!ANCHOR_SET[n.trap.anchor]) problems.push(q.id + ' ' + k + ': trap.anchor ' + n.trap.anchor + ' 不在 lb 白名单');
      }
      (n.options || []).forEach(o => { if (o.anchor) usedAnchors[o.anchor] = true; });
    });

    ids.forEach(k => {
      const n = nodes[k];
      if (n.type === 'anchorCard') anchorCardCount++;
      if (n.type === 'aiFree') aiFreeCount++;
    });
  });

  const missingAnchors = ANCHOR_IDS.filter(id => !usedAnchors[id]);
  if (missingAnchors.length) problems.push('剧本未使用锚点：' + missingAnchors.join(','));

  return { problems, stats: { nodeTotal, anchorCardCount, aiFreeCount } };
}

// ---------- 生成 ----------
function render(quests) {
  const header =
`// miniprogram/utils/stories/line-libai-locations.generated.js
// ⚠️ 本文件由 tools/build-libai-locations.js 自动生成，禁止手工修改。
//    改剧本请回到 docs/整合_李白_剧本与分镜_完整版.md，然后重新运行：
//      node tools/build-libai-locations.js
// 来源：docs/整合_李白_剧本与分镜_完整版.md
// 生成时间：${new Date().toISOString()}
// 内容：李白 20 地点剧本（QUEST_* 对象），每个地点独立成一条地点级 quest。
`;
  const body = quests.map(q => {
    return `quests['${q.id}'] = ${JSON.stringify(q, null, 2)};`;
  }).join('\n\n');

  return header + '\nconst quests = {};\n\n' + body + '\n\nmodule.exports = quests;\n';
}

// ---------- 主流程 ----------
function main() {
  const isCheck = process.argv.indexOf('--check') >= 0;
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const { quests } = extractQuests(md);
  const { problems, stats } = verify(quests);

  console.log('=== 李白 20 地点剧本生成 ===');
  console.log('  地点：' + quests.length + ' / 节点：' + stats.nodeTotal +
    ' / anchorCard：' + stats.anchorCardCount + ' / aiFree：' + stats.aiFreeCount);

  if (problems.length) {
    console.log('\n✗ 发现问题 ' + problems.length + ' 条：');
    problems.forEach(p => console.log('  ✗ ' + p));
    process.exit(1);
  }

  if (isCheck) {
    let current;
    try {
      delete require.cache[require.resolve(OUT_PATH)];
      current = require(OUT_PATH);
    } catch (e) {
      console.log('\n✗ 无法读取生成文件：' + e.message);
      process.exit(1);
    }
    const expected = {};
    quests.forEach(q => { expected[q.id] = q; });
    if (JSON.stringify(current) !== JSON.stringify(expected)) {
      console.log('\n✗ 生成文件已过期，请运行 node tools/build-libai-locations.js');
      process.exit(1);
    }
    console.log('ALL_OK 20 locations / ' + stats.nodeTotal + ' nodes / 生成结果与源稿一致');
    process.exit(0);
  }

  fs.writeFileSync(OUT_PATH, render(quests), 'utf8');
  console.log('ALL_OK 20 locations / ' + stats.nodeTotal + ' nodes / 已写入 ' + path.relative(process.cwd(), OUT_PATH));
  process.exit(0);
}

main();
