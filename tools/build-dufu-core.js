// tools/build-dufu-core.js —— 杜甫 22 地点剧本的统一构建核心（唯一生成逻辑）
//
// 背景：
//   此前 build-dufu-locations.js 与 build-dufu-fenjing.js 各自维护一份「提取 / 校验 /
//   生成」逻辑，且分镜脚本仍读取已删除的 21 地点源稿，导致两份产物可能漂移：
//     · build-dufu-locations.js 生成【不含镜头级 scene】的剧本文件；
//     · build-dufu-fenjing.js  生成【含镜头级 scene】的剧本 + 分镜映射。
//   两套逻辑一旦不同步，重新生成就会「丢失分镜」或「覆盖新内容」。
//
// 本文件把流程收敛为唯一实现，两个脚本都委托到这里，保证输出完全一致：
//
//   提取剧本（QUEST_* + 🎬镜头N 标记） → 结构校验 → 注入镜头级 scene → 生成两个产物
//
// 产物（均【自动生成、禁止手工修改】）：
//   1. miniprogram/utils/stories/line-dufu-locations.generated.js
//      22 个 QUEST_* 对象，切镜节点带镜头级 scene（<地点>_s0N；镜头1 = 地点默认场景）。
//   2. miniprogram/utils/stories/dufu-fenjing-scenes.js
//      地点 scene key → 分镜图文件映射（无图处为 null，运行时回退地点默认单图）。
//
// 唯一工作源：docs/杜甫行迹剧本-全22地点-含分镜.md
//
// 关键约定（改这里前先读）：
//   · 分镜图按【22 地点】p01–p22 编号（FENJING_P_ORDER = LOCATION_IDS，含守丧 shouang）。
//     2026-10-22 换新图库后，shouang 已有专属分镜图（p07），不再复用洛阳。
//   · 生成文件【不含生成时间戳】，保证两次构建字节一致（幂等）。
//   · 结构校验基线 = 22 地点 / 854 节点（必要时改稿需同步改 NODE_TOTAL 并记录原因）。

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MD_PATH = path.join(ROOT, 'docs', '杜甫行迹剧本-全22地点-含分镜.md');
const OUT_SCRIPT = path.join(ROOT, 'miniprogram', 'utils', 'stories', 'line-dufu-locations.generated.js');
const OUT_SCENES = path.join(ROOT, 'miniprogram', 'utils', 'stories', 'dufu-fenjing-scenes.js');
const FENJING_DIR = path.join(ROOT, '_cloud_upload', 'assets', 'images', 'scenes', 'dufu');

// 22 地点（最终版顺序，与附录《22 地点完整清单》一致；2026-10-21 新增守丧 shouang）
const LOCATION_IDS = [
  'luoyang', 'shuhu', 'wuyue', 'luoyang_shi', 'qizhao', 'taishan', 'shouang', 'changan',
  'yexian', 'fengxian', 'changan_xian', 'fengxiang', 'qiangcun', 'huazhou',
  'qinzhou', 'tonggu', 'chengdu', 'kuizhou', 'jingzhou', 'tanzhou', 'hengzhou', 'xiangjiang'
];

// 分镜图 p 编号（22 地点图库编号，与 LOCATION_IDS 一致；2026-10-22 换新图库后 shouang 已有专属分镜图）
const FENJING_P_ORDER = LOCATION_IDS;
const P_NUM = {};
FENJING_P_ORDER.forEach((id, i) => { P_NUM[id] = String(i + 1).padStart(2, '0'); });

// 杜甫线锚点表（与 line-dufu.js 的 ANCHORS 一致；最终版重排为 a1–a21）
const ANCHOR_IDS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11', 'a12', 'a13', 'a14', 'a15', 'a16', 'a17', 'a18', 'a19', 'a20', 'a21'];
const ANCHOR_SET = {};
ANCHOR_IDS.forEach(a => { ANCHOR_SET[a] = true; });

const VALID_TYPES = { narrate: 1, talk: 1, choice: 1, aiFree: 1, reflect: 1, anchorCard: 1 };
const NODE_TOTAL = 854; // 基线（最终版 22 地点）

// ---------- 提取 ----------
// 返回 { quests, order, shots }：shots[questId] = { nodeId: 镜头序号 }
function extractQuests(md) {
  const re = /```js\s*\n([\s\S]*?)\n```/g;
  const quests = [];
  const order = [];
  const shots = {};
  const shotProblems = [];
  let m;
  while ((m = re.exec(md)) !== null) {
    const block = m[1];
    const idm = /const\s+QUEST_[A-Z_]+\s*=\s*\{/.exec(block);
    if (!idm) continue;
    // 求值：把 const 声明改成立即返回对象字面量（受控源稿，非外部输入）
    const body = block.replace(/const\s+QUEST_[A-Z_]+\s*=\s*/, 'return ');
    let obj;
    try {
      const fn = new Function(body);
      obj = fn();
    } catch (e) {
      throw new Error('求值失败：' + e.message + '\n--- 代码块 ---\n' + block.slice(0, 400));
    }
    quests.push(obj);
    order.push(obj && obj.id);

    // 提取镜头标记：`// 🎬镜头N` 紧跟在其所属节点 key 之后。
    // 顺序扫描：维护「最近一次出现的 key: {」，标记即归属该节点。
    const nodeShot = {};
    let lastNodeKey = null;
    block.split('\n').forEach(ln => {
      const keyMatch = /^\s*([A-Za-z0-9_]+):\s*\{/.exec(ln);
      if (keyMatch) lastNodeKey = keyMatch[1];
      const shotMatch = /🎬镜头(\d+)/.exec(ln);
      if (shotMatch && !lastNodeKey) {
        shotProblems.push((obj.id || '未知地点') + ': 镜头标记没有可归属的节点');
      } else if (shotMatch) {
        if (nodeShot[lastNodeKey] !== undefined) {
          shotProblems.push(obj.id + ' ' + lastNodeKey + ': 同一节点重复标记镜头');
        }
        nodeShot[lastNodeKey] = parseInt(shotMatch[1], 10);
      }
    });
    shots[obj.id] = nodeShot;
  }
  return { quests, order, shots, shotProblems };
}

// ---------- 注入镜头级 scene ----------
// 镜头0 / 镜头1 → 地点默认场景（quest.scene，缺省时退回地点 id）；镜头N≥2 → scene = '<地点>_s0N'
//   源稿约定：绝大多数地点以「镜头1」开场，但 fengxian 的「得官文书」序幕用「镜头0」标记，
//   二者语义相同（都是开场/默认背景），故统一按「≤1」走默认场景，不生成 <地点>_s00。
//   镜头2+ 按自身 id 生成 <id>_s0N —— 无对应图时运行时优雅回退，不误用他处镜头图。
function applyShots(quest, shots) {
  const qid = quest.id;
  const defaultScene = quest.scene || qid;
  const nodeShots = shots[qid] || {};
  Object.keys(nodeShots).forEach(nodeKey => {
    const shot = nodeShots[nodeKey];
    if (!quest.nodes || !quest.nodes[nodeKey]) return;
    if (shot <= 1) {
      if (!quest.nodes[nodeKey].scene) quest.nodes[nodeKey].scene = defaultScene;
    } else {
      quest.nodes[nodeKey].scene = qid + '_s' + String(shot).padStart(2, '0');
    }
  });
  return quest;
}

// ---------- 校验 ----------
function verify(quests, shots, extractionProblems) {
  const problems = (extractionProblems || []).slice();
  const byId = {};
  quests.forEach(q => {
    if (!q || !q.id) { problems.push('存在缺 id 的 quest'); return; }
    if (byId[q.id]) problems.push('id 重复：' + q.id);
    byId[q.id] = q;
  });

  if (quests.length !== 22) problems.push('quest 数量=' + quests.length + '（应为 22）');
  const actualIds = quests.map(q => q.id).join(',');
  const expectIds = LOCATION_IDS.join(',');
  if (actualIds !== expectIds) {
    problems.push('id 顺序与附录不一致\n  实际=' + actualIds + '\n  期望=' + expectIds);
  }

  quests.forEach(q => {
    ['id', 'title', 'range', 'start', 'nodes'].forEach(f => {
      if (!q[f]) problems.push(q.id + ': 缺少字段 ' + f);
    });
  });

  let nodeTotal = 0;
  let anchorCardCount = 0;
  let aiFreeCount = 0;

  quests.forEach(q => {
    if (!q.nodes) return;
    const nodes = q.nodes;
    const ids = Object.keys(nodes);
    nodeTotal += ids.length;

    // 可达性（从 start DFS，含 option 的 next/result）
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
            problems.push(q.id + ' ' + k + ': option[' + i + '].anchor ' + o.anchor + ' 不在 a1–a21');
          }
        });
      }
      if (n.anchor && !ANCHOR_SET[n.anchor]) problems.push(q.id + ' ' + k + ': anchor ' + n.anchor + ' 不在 a1–a21');
      if (n.trap && n.trap.anchor && !ANCHOR_SET[n.trap.anchor]) problems.push(q.id + ' ' + k + ': trap.anchor ' + n.trap.anchor + ' 不在 a1–a21');
      if (n.type === 'anchorCard') anchorCardCount++;
      if (n.type === 'aiFree') aiFreeCount++;
    });

    // 分镜标记必须指向真实节点，且镜头号从 0/1 开始后连续上升。
    const shotEntries = Object.entries((shots && shots[q.id]) || {});
    if (!shotEntries.length) {
      problems.push(q.id + ': 缺少分镜标记');
    } else {
      const shotNums = [];
      shotEntries.forEach(([nodeId, shot]) => {
        if (!nodes[nodeId]) problems.push(q.id + ': 分镜标记指向不存在节点 ' + nodeId);
        if (!Number.isInteger(shot) || shot < 0) problems.push(q.id + ' ' + nodeId + ': 非法镜头号 ' + shot);
        shotNums.push(shot);
      });
      const first = shotNums[0];
      if (first !== 0 && first !== 1) problems.push(q.id + ': 首个镜头必须是 0 或 1');
      for (let i = 1; i < shotNums.length; i++) {
        if (shotNums[i] !== shotNums[i - 1] + 1) {
          problems.push(q.id + ': 镜头号不连续（' + shotNums[i - 1] + ' → ' + shotNums[i] + '）');
        }
      }
    }
  });

  if (nodeTotal !== NODE_TOTAL) problems.push('总节点数=' + nodeTotal + '（应为 ' + NODE_TOTAL + '）');

  return { problems, stats: { nodeTotal, anchorCardCount, aiFreeCount } };
}

// ---------- 生成剧本文件 ----------
function renderScript(quests) {
  const header =
`// miniprogram/utils/stories/line-dufu-locations.generated.js
// ⚠️ 本文件由 tools/build-dufu-locations.js 自动生成，禁止手工修改。
//    tools/build-dufu-fenjing.js 为同一构建流程的别名入口，二者输出完全一致。
//    改剧本请回到 docs/杜甫行迹剧本-全22地点-含分镜.md（唯一工作源），然后重新运行：
//      node tools/build-dufu-locations.js
// 来源：docs/杜甫行迹剧本-全22地点-含分镜.md
// 内容：杜甫 22 地点剧本（QUEST_* 对象），切镜节点带镜头级 scene（<地点>_s0N）。
`;
  const body = quests.map(q => {
    return `quests['${q.id}'] = ${JSON.stringify(q, null, 2)};`;
  }).join('\n\n');

  return header + '\nconst quests = {};\n\n' + body + '\n\nmodule.exports = quests;\n';
}

// ---------- 生成分镜 sceneSets ----------
function renderScenes(shots, actualFiles) {
  const header =
`// miniprogram/utils/stories/dufu-fenjing-scenes.js
// ⚠️ 本文件由 tools/build-dufu-locations.js 自动生成，禁止手工修改。
//    改镜头图请更新 _cloud_upload/assets/images/scenes/dufu/ 下的图，再重跑：
//      node tools/build-dufu-locations.js
// 内容：杜甫 22 地点的分镜级场景映射（地点 scene key → 分镜图文件）。
//   约定：<地点> = 镜头1（默认）；<地点>_s0N = 镜头 N（N≥2）。
//   注：某镜头无对应图时值为 null，运行时由 dufu-locations.js 回退到地点默认单图。
`;
  const IMG = '/assets/images/';
  const files = (actualFiles || []).slice().sort();
  const sets = {};
  FENJING_P_ORDER.forEach(id => {
    const p = P_NUM[id];
    const map = {};
    const shotIds = shots[id] || {};
    const maxShot = Math.max(0, ...Object.values(shotIds));
    for (let s = 1; s <= maxShot; s++) {
      const key = s === 1 ? id : id + '_s' + String(s).padStart(2, '0');
      const prefix = `dufu-p${p}-s${String(s).padStart(2, '0')}`;
      const matches = files.filter(f => f.startsWith(prefix + '-') && /\.png$/i.test(f));
      const match = matches[0];
      map[key] = match ? IMG + 'scenes/dufu/' + match : null;
    }
    sets[id] = map;
  });
  return header + '\nmodule.exports = ' + JSON.stringify(sets, null, 2) + ';\n';
}

// ---------- 分镜资源检查 ----------
function inspectSceneAssets(actualFiles, scenesText) {
  const problems = [];
  const warnings = [];
  const files = (actualFiles || []).slice().sort();
  const byPrefix = {};
  files.forEach(file => {
    const m = /^(dufu-p\d{2}-s\d{2})-.+\.png$/i.exec(file);
    if (!m) {
      warnings.push('未识别的分镜文件名：' + file);
      return;
    }
    const prefix = m[1].toLowerCase();
    if (!byPrefix[prefix]) byPrefix[prefix] = [];
    byPrefix[prefix].push(file);
  });
  Object.keys(byPrefix).forEach(prefix => {
    if (byPrefix[prefix].length > 1) {
      problems.push('同一镜头存在多张图 ' + prefix + '：' + byPrefix[prefix].join(', '));
    }
  });

  const parsed = JSON.parse(scenesText.slice(scenesText.indexOf('{'), scenesText.lastIndexOf('}') + 1));
  const used = {};
  let mapped = 0;
  let fallback = 0;
  Object.keys(parsed).forEach(loc => {
    Object.keys(parsed[loc]).forEach(k => {
      const value = parsed[loc][k];
      if (!value) { fallback++; return; }
      mapped++;
      const file = value.split('/').pop();
      used[file] = true;
      if (files.indexOf(file) < 0) problems.push('分镜映射引用不存在文件：' + file);
    });
  });
  const unused = files.filter(file => !used[file]);
  if (unused.length) warnings.push('未被当前镜头标记引用：' + unused.join(', '));
  return { problems, warnings, mapped, fallback, unused };
}

// ---------- 磁盘对比（幂等性检查用） ----------
function readDisk(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// ---------- 主流程 ----------
// args 由调用方（两个同名脚本）传入 process.argv.slice(2)；label 仅用于打印区分。
function main(args, label) {
  const name = label || 'build-dufu-core.js';
  const isCheck = args.indexOf('--check') >= 0;

  const md = fs.readFileSync(MD_PATH, 'utf8');
  const { quests, shots, shotProblems } = extractQuests(md);
  quests.forEach(q => applyShots(q, shots));

  const sceneDirExists = fs.existsSync(FENJING_DIR);
  const actualFiles = sceneDirExists ? fs.readdirSync(FENJING_DIR) : [];

  const { problems, stats } = verify(quests, shots, shotProblems);
  if (!sceneDirExists) problems.push('分镜图目录不存在：' + path.relative(process.cwd(), FENJING_DIR));

  console.log('=== 杜甫 22 地点剧本统一构建（' + name + '） ===');
  console.log('  源稿：docs/杜甫行迹剧本-全22地点-含分镜.md（唯一工作源）');
  console.log('  地点：' + quests.length + ' / 节点：' + stats.nodeTotal +
    ' / anchorCard：' + stats.anchorCardCount + ' / aiFree：' + stats.aiFreeCount);
  console.log('  分镜图文件：' + actualFiles.length + ' 张');

  if (problems.length) {
    console.log('\n✗ 源稿结构校验发现问题 ' + problems.length + ' 条：');
    problems.forEach(p => console.log('  ✗ ' + p));
    process.exit(1);
  }

  const scriptText = renderScript(quests);
  const scenesText = renderScenes(shots, actualFiles);
  const assetCheck = inspectSceneAssets(actualFiles, scenesText);
  problems.push.apply(problems, assetCheck.problems);

  // 资源检查需要渲染后才能完成，因此在此补一次失败出口。
  if (problems.length) {
    console.log('\n✗ 生成与资源校验发现问题 ' + problems.length + ' 条：');
    problems.forEach(p => console.log('  ✗ ' + p));
    process.exit(1);
  }

  if (isCheck) {
    // 幂等性检查：渲染结果与磁盘产物逐字节比对（产物无时间戳，应当一致）
    const diskScript = readDisk(OUT_SCRIPT);
    const diskScenes = readDisk(OUT_SCENES);
    const mismatches = [];
    if (diskScript !== scriptText) mismatches.push(path.relative(process.cwd(), OUT_SCRIPT));
    if (diskScenes !== scenesText) mismatches.push(path.relative(process.cwd(), OUT_SCENES));

    // 分镜资源引用校验：统计有图 / 无图（回退）镜头数
    console.log('  分镜引用：' + assetCheck.mapped + ' 镜有图 / ' + assetCheck.fallback + ' 镜回退默认单图');
    assetCheck.warnings.forEach(w => console.log('  ! ' + w));

    if (mismatches.length) {
      console.log('\n✗ 磁盘产物与源稿派生结果不一致（需重新生成）：');
      mismatches.forEach(p => console.log('  ✗ ' + p));
      console.log('    请运行：node tools/build-dufu-locations.js');
      process.exit(1);
    }
    console.log('ALL_OK 源稿结构通过 / 磁盘产物与派生结果一致 / 分镜引用已核对');
    process.exit(0);
  }

  fs.writeFileSync(OUT_SCRIPT, scriptText, 'utf8');
  fs.writeFileSync(OUT_SCENES, scenesText, 'utf8');
  console.log('ALL_OK 已写入（两个脚本共享同一逻辑，输出一致）');
  console.log('  ' + path.relative(process.cwd(), OUT_SCRIPT));
  console.log('  ' + path.relative(process.cwd(), OUT_SCENES));
  process.exit(0);
}

module.exports = { main, extractQuests, applyShots, verify, renderScript, renderScenes, inspectSceneAssets, LOCATION_IDS, FENJING_P_ORDER, NODE_TOTAL };
