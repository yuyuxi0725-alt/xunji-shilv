/* tools/export-voice-manifest.js —— 配音清单导出（地点模式 + 时期模式）双轨
 *
 * 为什么重写：
 *   旧版只读 `line-<character>.js` 的时期 quests（p1–p4），导出不出杜甫 22 地点剧本，
 *   而杜甫/李白/苏轼现在都走「地点叙事模式」。地点入口的 questId 为空、locationId 有值，
 *   旧版路径会算出 `dufu//nodeId` 这类无效音频键。
 *
 * 现在的音频键（与 utils/ttsAudio.js 一致）：
 *   audio/voice/{lineId}/{locationId}/{nodeId}.mp3   地点模式
 *   audio/voice/{lineId}/{periodId}/{nodeId}.mp3     时期模式（旧，保留兼容）
 *
 * 只导出「NPC 的 talk 节点」：
 *   · speaker 缺省视为 npc（旧剧本兼容）；
 *   · speaker:'player'（玩家发言）、choice 临时生成的玩家台词、narrate 旁白、动作行一律不进清单；
 *   · 三种外观与自定义姓名不产生任何音频分叉——音频键只由 lineId/地点/节点决定。
 *
 * 用法：
 *   node tools/export-voice-manifest.js                      # 杜甫 22 地点（第一版唯一启用地点配音的线）
 *   node tools/export-voice-manifest.js --line=dufu          # 同上，显式指定
 *   node tools/export-voice-manifest.js --line=dufu --location=taishan
 *   node tools/export-voice-manifest.js --all                # 三线全部
 *   node tools/export-voice-manifest.js dufu p1              # 旧时期兼容：导出 dufu-p1.json
 *   node tools/export-voice-manifest.js --report-only        # 只重算报告与运行时摘要，不写清单
 *   node tools/export-voice-manifest.js --line=dufu --preserve-runtime
 *                                                          # 台词改后先更新录制清单，但保留旧录音摘要
 *
 * 产物：
 *   tts-audio/manifests/<line>-locations.json   全部地点清单一览（含每条 text + digest）
 *   tts-audio/manifests/<line>-<location>.json  单地点清单
 *   tts-audio/manifests/<line>-<period>.json    时期清单（兼容旧用法）
 *   miniprogram/utils/voice-manifest.js         运行时摘要表（供 ttsAudio.js 比对文本）
 *   tts-audio/manifests/voice-report.md         需要重做 / 可复用 / 无 NPC 配音 清单
 *
 * 注意：本工具**不调用任何付费语音服务、不上传文件、不部署云函数**。
 */
const fs = require('fs');
const path = require('path');
const { normalizeVoiceText, textDigest } = require('../miniprogram/utils/voice-digest.js');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_DIR = path.join(ROOT, 'tts-audio', 'manifests');
const AUDIO_DIR = path.join(ROOT, 'tts-audio', 'output');
const RUNTIME_MANIFEST = path.join(ROOT, 'miniprogram', 'utils', 'voice-manifest.js');

// ============ 参数解析 ============
// 只有直接运行（node tools/export-voice-manifest.js）才执行导出流程；
// 被 require（测试复用 collectNpcTalkNodes 等纯函数）时不产生任何文件写入副作用。
const isMain = require.main === module;
const argv = isMain ? process.argv.slice(2) : [];

// --help 必须在解析前拦下：否则 "node ... --help" 会被当成一次默认导出真实执行，
// 把运行时摘要表（= 录音当时那版台词的指纹）覆盖成当前台词的指纹，
// 从而抹掉「哪些句子改了但还没重录」这条唯一证据。
const USAGE = [
  '用法：node tools/export-voice-manifest.js [选项]',
  '',
  '  （无参数）                     默认只导杜甫 22 地点',
  '  --line=<dufu|libai|sushi>     指定线路',
  '  --location=<地点id>           只导单地点',
  '  --all                         三线全部',
  '  dufu p1                       旧时期兼容用法，导出 dufu-p1.json',
  '  --report-only                 只重算报告与运行时摘要，不写清单',
  '  --preserve-runtime            只更新录制清单，保留运行时摘要表',
  '                                （台词改了但还没重录时，必须加这个）',
  '  --help                        显示本说明，不做任何写入',
  '',
  '注意：不加 --preserve-runtime 时，运行时会认定「这些台词已按当前文本重录」，',
  '      并把 voice-manifest.js 里的旧指纹覆盖掉。只改剧本请务必加上它。'
].join('\n');
if (argv.some((a) => a === '--help' || a === '-h')) {
  console.log(USAGE);
  process.exit(0);
}

const opts = { line: '', location: '', reportOnly: false, preserveRuntime: false, legacy: [] };
argv.forEach((a) => {
  if (a === '--report-only') opts.reportOnly = true;
  else if (a === '--preserve-runtime') opts.preserveRuntime = true;
  else if (a.indexOf('--line=') === 0) opts.line = a.slice(7);
  else if (a.indexOf('--location=') === 0) opts.location = a.slice(11);
  else opts.legacy.push(a);
});

// ============ 读取剧本（统一注册表，而不是只读旧时期 quests） ============
const stories = require(path.join(ROOT, 'miniprogram/utils/stories/index.js'));

/** 节点是否为「NPC 说话」——只有这种节点才属于杜甫/李白/苏轼配音 */
function isNpcTalk(node) {
  if (!node || node.type !== 'talk') return false;
  return (node.speaker || 'npc') === 'npc';
}

/** 收集某地点/时期 quest 里的 NPC talk 节点，按节点 id 稳定排序 */
function collectNpcTalkNodes(quest) {
  const nodes = (quest && quest.nodes) || {};
  return Object.keys(nodes)
    .filter(id => isNpcTalk(nodes[id]))
    .sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }))
    .map(id => ({ nodeId: id, node: nodes[id] }));
}

/** 统计某 quest 里「不是 NPC 配音」的节点，用于报告 */
function countNonNpcNodes(quest) {
  const nodes = (quest && quest.nodes) || {};
  const out = { playerTalk: 0, narrate: 0, choice: 0, other: 0 };
  Object.keys(nodes).forEach((id) => {
    const n = nodes[id];
    if (!n) return;
    if (n.type === 'talk') {
      if ((n.speaker || 'npc') === 'player') out.playerTalk++;
      return;
    }
    if (n.type === 'narrate') out.narrate++;
    else if (n.type === 'choice') out.choice++;
    else out.other++;
  });
  return out;
}

/** 本地是否已有该节点的音频文件（只判断磁盘存在，不代表已上传云端） */
function hasLocalAudio(lineId, audioQuestId, nodeId) {
  return fs.existsSync(path.join(AUDIO_DIR, lineId, audioQuestId, `${nodeId}.mp3`));
}

function buildItems(lineId, audioQuestId, quest, kind) {
  return collectNpcTalkNodes(quest).map(({ nodeId, node }, i) => {
    const text = normalizeVoiceText(node.text);
    return {
      index: i + 1,
      lineId,
      kind,                       // 'location' | 'period'
      audioQuestId,               // 地点 id 或时期 id
      locationId: kind === 'location' ? audioQuestId : '',
      periodId: kind === 'period' ? audioQuestId : '',
      nodeId,
      emotion: node.emotion || 'calm',
      text,
      digest: textDigest(text),   // 录音当时的文本摘要（运行时比对用）
      fileName: `${nodeId}.mp3`,
      audioKey: `${lineId}/${audioQuestId}/${nodeId}`,
      cloudPath: `audio/voice/${lineId}/${audioQuestId}/${nodeId}.mp3`
    };
  });
}

// ============ 主流程 ============
// 整段只在直接运行时执行（见 isMain）；被 require 时只暴露上面的纯函数，
// 不读参数、不写清单、不动运行时摘要表。
if (isMain) {
const produced = [];    // { lineId, audioQuestId, kind, title, range, items, quest }
const legacyMode = opts.legacy.length >= 2;

if (legacyMode) {
  // ---- 旧用法兼容：node tools/export-voice-manifest.js dufu p1 ----
  const [character, period] = opts.legacy;
  const line = stories.getLine(character);
  const quest = line && line.quests && line.quests[period];
  if (!quest) throw new Error(`Unknown period: ${character}/${period}`);
  produced.push({
    lineId: character, audioQuestId: period, kind: 'period',
    title: quest.title, range: quest.range, quest
  });
} else {
  // ---- 地点模式：按统一注册表读取每条线的 locationQuests ----
  // 第一版只对杜甫启用地点配音（李白/苏轼仍走时期音频，地点音频未立项），
  // 因此缺省只导 dufu；要导其它线需显式 --line=libai 或 --all。
  const wantAll = argv.indexOf('--all') >= 0;
  let lines;
  if (opts.line) lines = [stories.getLine(opts.line)].filter(Boolean);
  else if (wantAll) lines = stories.getOnlineLines();
  else lines = [stories.getLine('dufu')].filter(Boolean);
  if (!lines.length) throw new Error(`未知人物线：${opts.line}`);

  lines.forEach((line) => {
    if (line.narrativeMode !== 'location') {
      // 时期模式线路：保留旧时期导出能力
      Object.keys(line.quests || {}).forEach((pid) => {
        const quest = line.quests[pid];
        if (!quest) return;
        produced.push({
          lineId: line.id, audioQuestId: pid, kind: 'period',
          title: quest.title, range: quest.range, quest
        });
      });
      return;
    }
    const locations = (line.locations || []).filter(l => !opts.location || l.id === opts.location);
    if (opts.location && !locations.length) throw new Error(`未知地点：${line.id}/${opts.location}`);
    locations.forEach((loc) => {
      const quest = line.locationQuests && line.locationQuests[loc.id];
      if (!quest) return;
      produced.push({
        lineId: line.id, audioQuestId: loc.id, kind: 'location',
        title: quest.title || loc.name, range: quest.range || loc.range, quest, loc
      });
    });
  });
}

// ============ 逐条分类：需要重做 / 可复用 / 无 NPC 配音 ============
// 可复用的判定：本地已有该节点音频，且其文本摘要与旧清单一览里记录的一致。
// （没有旧清单时无法证明音频对应哪版文本，一律按「需要重做」，避免播错词。）
//
// 关于旧音频：旧版时期音频（audio/voice/<line>/p1..p4/ 与 tts-audio/output/<line>/pN/）
// 的音频键体系已废弃，将来整体删除。它们**不参与复用判断**——音频键不同
// （p1 vs luoyang）就物理上不是同一份文件，也不应被"复用"到新路径下。
// 因此地点模式下「可复用 0」是预期结论，不是待补的缺口。
const previousDigests = {};   // `${line}/${audioQuest}/${node}` → digest
if (fs.existsSync(MANIFEST_DIR)) {
  fs.readdirSync(MANIFEST_DIR)
    .filter(f => /-locations\.json$/.test(f))
    .forEach((f) => {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(MANIFEST_DIR, f), 'utf8'));
        (m.items || []).forEach((it) => {
          if (it && it.audioKey && it.digest) previousDigests[it.audioKey] = it.digest;
        });
      } catch (e) { /* 旧清单损坏时忽略，按需要重做处理 */ }
    });
}

const report = { needRedo: [], reusable: [], noNpcVoice: [] };

produced.forEach((p) => {
  p.items = buildItems(p.lineId, p.audioQuestId, p.quest, p.kind);
  p.items.forEach((it) => {
    const hasFile = hasLocalAudio(p.lineId, p.audioQuestId, it.nodeId);
    const prev = previousDigests[it.audioKey];
    if (hasFile && prev && prev === it.digest) {
      report.reusable.push(it);
    } else {
      it.reason = !hasFile ? '本地无音频文件' : (!prev ? '无旧清单可证明音频版本' : '台词已改动');
      report.needRedo.push(it);
    }
  });
  const nonNpc = countNonNpcNodes(p.quest);
  report.noNpcVoice.push({
    lineId: p.lineId, audioQuestId: p.audioQuestId, kind: p.kind,
    title: p.title,
    playerTalk: nonNpc.playerTalk,
    narrate: nonNpc.narrate,
    choice: nonNpc.choice,
    other: nonNpc.other
  });
});

// ============ 写清单 ============
function writeManifest(outPath, payload) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

if (!opts.reportOnly) {
  if (legacyMode) {
    produced.forEach((p) => {
      writeManifest(path.join(MANIFEST_DIR, `${p.lineId}-${p.audioQuestId}.json`), {
        version: 2,
        generatedAt: new Date().toISOString(),
        lineId: p.lineId,
        kind: p.kind,
        audioQuestId: p.audioQuestId,
        title: p.title,
        range: p.range,
        count: p.items.length,
        items: p.items
      });
      console.log(`已写 ${p.lineId}-${p.audioQuestId}.json：NPC talk ${p.items.length} 条`);
    });
  } else {
    // 每条线一份地点总清单（供审查「数量是否与实际 NPC talk 节点一致」）
    const byLine = {};
    produced.forEach((p) => { (byLine[p.lineId] = byLine[p.lineId] || []).push(p); });
    Object.keys(byLine).forEach((lineId) => {
      const list = byLine[lineId];
      const locationItems = [];
      list.forEach((p) => { locationItems.push.apply(locationItems, p.items); });
      writeManifest(path.join(MANIFEST_DIR, `${lineId}-locations.json`), {
        version: 2,
        generatedAt: new Date().toISOString(),
        lineId,
        kind: 'location',
        count: locationItems.length,
        locations: list.map(p => ({
          audioQuestId: p.audioQuestId,
          title: p.title,
          range: p.range,
          count: p.items.length
        })),
        items: locationItems
      });
      // 单地点清单（--location 指定时只写这一份，便于分段录制）
      if (opts.location) {
        list.forEach((p) => {
          writeManifest(path.join(MANIFEST_DIR, `${lineId}-${p.audioQuestId}.json`), {
            version: 2,
            generatedAt: new Date().toISOString(),
            lineId,
            kind: p.kind,
            audioQuestId: p.audioQuestId,
            title: p.title,
            range: p.range,
            count: p.items.length,
            items: p.items
          });
        });
      }
    });
  }
}

// ============ 写运行时摘要表 miniprogram/utils/voice-manifest.js ============
// 结构：{ [lineId]: { [audioQuestId]: { [nodeId]: digest } } }
// 只登记「地点模式」的音频键：时期模式的既有音频（李白/苏轼等）保持原行为，
// 不因新增摘要校验而被误判跳过，避免把现有可用配音改坏。
if (legacyMode) {
console.log('（时期模式兼容导出：不写运行时摘要表，也不改报告）');
} else {
// 缺失该节点表示「不做摘要校验」（未录过音的线路保持旧行为）。
const runtime = {};
produced.forEach((p) => {
  if (!runtime[p.lineId]) runtime[p.lineId] = {};
  const bucket = {};
  p.items.forEach((it) => { bucket[it.nodeId] = it.digest; });
  runtime[p.lineId][p.audioQuestId] = bucket;
});

// 合并已有运行时表：只覆盖本次导出到的线路/地点，避免 --line=dufu 把李白苏轼抹掉
let merged = {};
if (fs.existsSync(RUNTIME_MANIFEST)) {
  try {
    const text = fs.readFileSync(RUNTIME_MANIFEST, 'utf8');
    const m = text.match(/module\.exports\s*=\s*([\s\S]*);\s*$/);
    if (m) merged = JSON.parse(m[1]);
  } catch (e) { merged = {}; }
}
Object.keys(runtime).forEach((lineId) => {
  const next = Object.assign({}, merged[lineId], runtime[lineId]);
  // 地点模式导出会取代该线旧的时期键（p1..p5）：地点模式下不会再按时期请求音频，
  // 留在表里只会让读者误以为时期音频仍在用。
  Object.keys(next).forEach((k) => {
    if (/^p\d+$/.test(k) && !runtime[lineId][k]) delete next[k];
  });
  merged[lineId] = next;
});

const runtimeHeader = `// utils/voice-manifest.js —— 配音文本摘要表（自动生成，禁止手改）
//
// 由 tools/export-voice-manifest.js 生成。记录「录音当时」每个 NPC talk 节点的文本摘要。
// 运行时 utils/ttsAudio.js 用同一套 utils/voice-digest.js 计算当前节点文本摘要，
// 与这里比对：不一致 → 台词改过而音频未重录 → 跳过旧音频并记录日志（剧情照常推进）。
//
// 改剧本后必须重跑：node tools/export-voice-manifest.js --line=dufu --preserve-runtime
// ⚠ 只有「音频已按当前台词重录」时才去掉 --preserve-runtime：
//   那样会把这里的旧指纹覆盖成当前文本指纹，等于宣布「不用重录了」。
// 结构：{ [lineId]: { [locationId|periodId]: { [nodeId]: digest } } }

module.exports = ${JSON.stringify(merged, null, 2)};
`;
if (!opts.preserveRuntime) {
  fs.writeFileSync(RUNTIME_MANIFEST, runtimeHeader, 'utf8');
}

// ============ 写报告 ============
function mdTable(items, cols) {
  if (!items.length) return '_（无）_\n';
  const head = '| ' + cols.map(c => c.label).join(' | ') + ' |\n';
  const sep = '| ' + cols.map(() => '---').join(' | ') + ' |\n';
  const rows = items.map(it => '| ' + cols.map(c => String(c.get(it)).replace(/\|/g, '\\|')).join(' | ') + ' |\n').join('');
  return head + sep + rows;
}

const totalNpc = report.needRedo.length + report.reusable.length;
const noNpcTotal = report.noNpcVoice.reduce((s, r) => s + r.playerTalk + r.narrate + r.choice + r.other, 0);

const reportLines = [];
reportLines.push('# 配音清单与文本一致性报告（自动生成）');
reportLines.push('');
reportLines.push(`生成时间：${new Date().toISOString()}`);
reportLines.push('');
reportLines.push('## 一、总览');
reportLines.push('');
reportLines.push(`- 需要录入/重做的 NPC 台词节点：**${report.needRedo.length}**`);
reportLines.push(`- 可复用（本地有音频且文本未变）：**${report.reusable.length}**`);
reportLines.push(`- 无 NPC 配音的节点（玩家发言 / 旁白 / 选项等）：**${noNpcTotal}**`);
reportLines.push(`- NPC 台词节点合计：**${totalNpc}**`);
reportLines.push('');
reportLines.push('> 本报告只做静态统计，未调用付费语音服务、未上传资源、未部署云函数。');
reportLines.push('');
reportLines.push('## 二、需要重做（按地点）');
reportLines.push('');
reportLines.push(mdTable(report.needRedo, [
  { label: '人物线', get: it => it.lineId },
  { label: '地点/时期', get: it => it.audioQuestId },
  { label: '节点', get: it => it.nodeId },
  { label: '情绪', get: it => it.emotion },
  { label: '云端路径', get: it => '`' + it.cloudPath + '`' },
  { label: '原因', get: it => it.reason || '' }
]));
reportLines.push('## 三、可复用');
reportLines.push('');
if (!report.reusable.length) {
  reportLines.push('_（无）_');
  reportLines.push('');
  reportLines.push('「可复用 0」是预期结论，不是待补缺口：旧音频按时期路径录制');
  reportLines.push('（`audio/voice/<人物线>/pN/`），地点模式的音频键是 `audio/voice/<人物线>/<地点>/`。');
  reportLines.push('音频键不同即不是同一份文件，旧音频不会被"复用"到新路径下。');
} else {
  reportLines.push(mdTable(report.reusable, [
    { label: '人物线', get: it => it.lineId },
    { label: '地点/时期', get: it => it.audioQuestId },
    { label: '节点', get: it => it.nodeId },
    { label: '云端路径', get: it => '`' + it.cloudPath + '`' }
  ]));
}
reportLines.push('## 四、无 NPC 配音的节点统计');
reportLines.push('');
reportLines.push(mdTable(report.noNpcVoice, [
  { label: '人物线', get: it => it.lineId },
  { label: '地点/时期', get: it => it.audioQuestId },
  { label: '标题', get: it => it.title },
  { label: '玩家发言', get: it => it.playerTalk },
  { label: '旁白', get: it => it.narrate },
  { label: '选项', get: it => it.choice },
  { label: '其他', get: it => it.other }
]));
reportLines.push('## 五、玩家姓名与外观不产生配音分叉');
reportLines.push('');
reportLines.push('- 音频键只由 `人物线 / 地点(或时期) / 节点` 决定，不含姓名、不含 avatarId。');
reportLines.push('- 因此改姓名、换三种外观都不会新增任何音频；玩家发言与动作行永不进入清单。');
reportLines.push('');
reportLines.push('## 六、旧音频处置（待删资产，不参与复用）');
reportLines.push('');
reportLines.push('旧版按时期录制的配音属于**废弃资产**，音频键体系已由 `pN` 改为地点 id，');
reportLines.push('将来整体删除；不得把它们复制/改名到地点路径下充当新配音。');
reportLines.push('');
reportLines.push('| 资产 | 位置 | 状态 |');
reportLines.push('| --- | --- | --- |');
reportLines.push('| 旧时期 mp3（杜甫 79 条） | `tts-audio/output/dufu/p1..p4/` | 待删除 |');
reportLines.push('| 旧时期清单 | `tts-audio/manifests/<line>-pN.json`（含 emotion-plan） | 兼容期保留，不参与复用判定 |');
reportLines.push('');
reportLines.push('运行时行为对应为「跳过」而非「降级复用」：文本摘要与清单不一致时');
reportLines.push('`utils/ttsAudio.js` 直接返回空串（该句无配音），剧情照常文字推进。');
reportLines.push('这是最终设计——文本与配音必须严格一致，宁可这一句没声音，也不播错词。');
reportLines.push('');
fs.mkdirSync(MANIFEST_DIR, { recursive: true });
fs.writeFileSync(path.join(MANIFEST_DIR, 'voice-report.md'), reportLines.join('\n'), 'utf8');

// ============ 控制台摘要 ============
console.log('=== 配音清单导出 ===');
produced.forEach((p) => {
  console.log(`  ${p.lineId}/${p.audioQuestId} (${p.kind}) NPC台词 ${p.items.length}`);
});
console.log(`需要重做：${report.needRedo.length}`);
console.log(`可复用：${report.reusable.length}`);
console.log(`无 NPC 配音节点：${noNpcTotal}`);
console.log(opts.preserveRuntime
  ? `已保留运行时摘要表（改动台词重录后再更新）：${path.relative(ROOT, RUNTIME_MANIFEST)}`
  : `已覆盖运行时摘要表（= 认定当前台词已重录过；只改剧本请加 --preserve-runtime）：${path.relative(ROOT, RUNTIME_MANIFEST)}`);
console.log(`已写报告：${path.relative(ROOT, path.join(MANIFEST_DIR, 'voice-report.md'))}`);
}   // ← else（地点模式）结束

}   // ← if (isMain) 结束：require 时不执行任何导出/写盘

module.exports = {
  isNpcTalk,
  collectNpcTalkNodes,
  countNonNpcNodes,
  buildItems,
  textDigest
};
