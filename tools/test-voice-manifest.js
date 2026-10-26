// tools/test-voice-manifest.js —— 地点配音链路 / 文本一致性 / 玩家素材 测试（步骤八）
//
// 覆盖提示词要求的 8 项：
//   1. 地点模式 taishan 请求 dufu/taishan/nodeId，不是 dufu//nodeId 或旧 p1 路径
//   2. 时期模式保持原路径
//   3. 玩家 talk、动作和旁白不请求 NPC 音频
//   4. 快速切节点时旧链接不播放
//   5. 当前文本与清单摘要不一致时静默跳过音频
//   6. 缺音频、临时链接失败、播放错误不阻塞剧情
//   7. 导出地点清单数量与实际 NPC talk 节点一致
//   8. 三种外观都能解析正确路径，非法 avatarId 回退占位
//   9. 导出脚本 --help 不会误触一次默认导出（它会把录音指纹刷成当前文本）
//
// 被测对象是真实模块，不是复制品：
//   · utils/voice-target.js（页面用的同一份判定）
//   · utils/ttsAudio.js（真实解析流程，wx 用最小 mock）
//   · utils/voice-digest.js（摘要算法，导出工具与运行时共用）
//   · tools/export-voice-manifest.js 导出的清单与报告
//   · utils/player-portrait.js / player-avatars.js
//
// 运行：node tools/test-voice-manifest.js

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

// ---- 最小 wx mock：记录每次 callFunction 的 fileIDs，可注入成功/失败/空结果 ----
const calls = [];
let cloudBehavior = 'ok';   // 'ok' | 'empty' | 'fail' | 'throw'
global.wx = {
  cloud: {
    callFunction(opts) {
      calls.push({ name: opts.name, data: JSON.parse(JSON.stringify(opts.data || {})) });
      const fileIDs = (opts.data && opts.data.fileIDs) || [];
      if (cloudBehavior === 'throw') throw new Error('mock: 调用异常');
      if (cloudBehavior === 'fail') { if (opts.fail) opts.fail({ errMsg: 'mock: fail' }); return; }
      if (cloudBehavior === 'empty') { if (opts.success) opts.success({ result: [] }); return; }
      if (opts.success) {
        opts.success({
          result: fileIDs.map(id => ({ fileID: id, tempFileURL: 'https://cdn.example.com/' + encodeURIComponent(id) }))
        });
      }
    }
  }
};

const voiceTarget = require(path.join(ROOT, 'miniprogram/utils/voice-target.js'));
const voiceDigest = require(path.join(ROOT, 'miniprogram/utils/voice-digest.js'));
const dufuQuests = require(path.join(ROOT, 'miniprogram/utils/stories/line-dufu-locations.generated.js'));
const manifestTool = require(path.join(ROOT, 'tools/export-voice-manifest.js'));
const avatars = require(path.join(ROOT, 'miniprogram/utils/player-avatars.js'));
const portraits = require(path.join(ROOT, 'miniprogram/utils/player-portrait.js'));

/** 每次重新加载 ttsAudio，清掉模块内 URL 缓存，避免测试之间互相命中缓存 */
function freshTts() {
  const p = path.join(ROOT, 'miniprogram/utils/ttsAudio.js');
  delete require.cache[require.resolve(p)];
  return require(p);
}

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, a, b) {
  const same = JSON.stringify(a) === JSON.stringify(b);
  if (same) { pass++; return; }
  failures.push(name + '  → got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}

async function main() {
  // ============ 1. 地点模式：audioQuestId = locationId ============
  console.log('--- 1. 地点模式音频键 ---');
  {
    const aq = voiceTarget.resolveAudioQuestId({ locationMode: true, locationId: 'taishan', questId: '' });
    eq('1.1 地点模式取 locationId', aq, 'taishan');
    ok('1.2 不是空串（不会拼出 dufu//nodeId）', aq !== '');
    ok('1.3 不是旧时期路径 p1', aq !== 'p1');

    calls.length = 0;
    cloudBehavior = 'ok';
    const tts = freshTts();
    const node = dufuQuests.taishan.nodes.n2a;
    const url = await tts.resolveNodeAudio('dufu', aq, 'n2a', node.text);
    eq('1.4 云端路径为 audio/voice/dufu/taishan/n2a.mp3',
      calls[0].data.fileIDs[0].split('/audio/voice/')[1], 'dufu/taishan/n2a.mp3');
    ok('1.5 拿到临时链接', typeof url === 'string' && url.indexOf('http') === 0);
    eq('1.6 走的是 ttsUrl 云函数', calls[0].name, 'ttsUrl');

    // 用真实地点入口参数（locationId 有值、questId 为空）走一遍完整判定
    const fromEntry = voiceTarget.resolveAudioQuestId({ locationMode: true, locationId: 'taishan', questId: '' });
    eq('1.7 地点入口（questId 空）仍得到 taishan', fromEntry, 'taishan');
  }

  // ============ 2. 时期模式保持原路径 ============
  console.log('--- 2. 时期模式音频键 ---');
  {
    eq('2.1 时期模式取 questId',
      voiceTarget.resolveAudioQuestId({ locationMode: false, locationId: '', questId: 'p2' }), 'p2');
    eq('2.2 时期模式忽略 locationId',
      voiceTarget.resolveAudioQuestId({ locationMode: false, locationId: 'taishan', questId: 'p2' }), 'p2');
    eq('2.3 两者皆空返回空串（调用方跳过配音）',
      voiceTarget.resolveAudioQuestId({ locationMode: true, locationId: '', questId: '' }), '');
    eq('2.4 缺参数安全返回空串', voiceTarget.resolveAudioQuestId(), '');

    // 时期模式实际请求仍按 /pN/ 路径，且不做摘要校验（未登记时区）
    calls.length = 0;
    cloudBehavior = 'ok';
    const tts = freshTts();
    await tts.resolveNodeAudio('libai', 'p2', 'n3', '任意台词');
    eq('2.5 时期路径 audio/voice/libai/p2/n3.mp3',
      calls[0].data.fileIDs[0].split('/audio/voice/')[1], 'libai/p2/n3.mp3');
    eq('2.6 时期模式无清单时不做摘要校验', tts.expectedDigest('libai', 'p2', 'n3'), '');
  }

  // ============ 3. 只有 NPC talk 节点播配音 ============
  console.log('--- 3. 谁该播配音 ---');
  {
    eq('3.1 NPC talk 播放', voiceTarget.isNpcTalkNode({ type: 'talk', text: 'x' }), true);
    eq('3.2 显式 speaker:npc 播放', voiceTarget.isNpcTalkNode({ type: 'talk', speaker: 'npc', text: 'x' }), true);
    eq('3.3 玩家发言不播', voiceTarget.isNpcTalkNode({ type: 'talk', speaker: 'player', text: 'x' }), false);
    eq('3.4 动作行不播', voiceTarget.isNpcTalkNode({ type: 'action', text: '（沉默）' }), false);
    eq('3.5 旁白不播', voiceTarget.isNpcTalkNode({ type: 'narrate', text: 'x' }), false);
    eq('3.6 选项不播', voiceTarget.isNpcTalkNode({ type: 'choice', question: 'x' }), false);
    eq('3.7 知识卡不播', voiceTarget.isNpcTalkNode({ type: 'anchorCard' }), false);
    eq('3.8 空节点不播', voiceTarget.isNpcTalkNode(null), false);

    let playerTalk = 0;
    Object.keys(dufuQuests).forEach((lid) => {
      Object.values(dufuQuests[lid].nodes || {}).forEach((n) => {
        if (n && n.type === 'talk' && n.speaker === 'player') playerTalk++;
      });
    });
    eq('3.9 剧本中无 speaker:player 的 talk 节点', playerTalk, 0);

    // 清单里不允许出现旁白/选项（导出工具只挑 NPC talk）
    const nonTalk = manifestTool.collectNpcTalkNodes(dufuQuests.taishan)
      .filter(({ node }) => node.type !== 'talk');
    eq('3.10 清单只含 talk 节点', nonTalk.length, 0);
  }

  // ============ 4. 快速切节点：旧链接不播放 ============
  console.log('--- 4. 迟到链接丢弃 ---');
  {
    const need = { request: 1, currentRequest: 1, nodeId: 'n1', currentNodeId: 'n1', url: 'http://x', audioAlive: true };
    eq('4.1 请求有效且节点未变 → 播放', voiceTarget.shouldAcceptAudioResult(need), true);
    eq('4.2 已发起新请求 → 丢弃',
      voiceTarget.shouldAcceptAudioResult(Object.assign({}, need, { currentRequest: 2 })), false);
    eq('4.3 节点已切换 → 丢弃',
      voiceTarget.shouldAcceptAudioResult(Object.assign({}, need, { currentNodeId: 'n2' })), false);
    eq('4.4 页面卸载/音频销毁 → 丢弃',
      voiceTarget.shouldAcceptAudioResult(Object.assign({}, need, { audioAlive: false })), false);
    eq('4.5 没拿到链接 → 不播放',
      voiceTarget.shouldAcceptAudioResult(Object.assign({}, need, { url: '' })), false);
    eq('4.6 缺参数安全返回 false', voiceTarget.shouldAcceptAudioResult(), false);

    // 页面源码：切到非 NPC talk 节点必须作废在途请求并停止播放
    const chatSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/pages/chat/chat.js'), 'utf8');
    ok('4.7 chat.js 切非说话节点时作废请求并停止配音',
      /if \(!voiceTarget\.isNpcTalkNode\(node\) && this\._ttsAudio\) \{[\s\S]{0,120}this\._ttsRequest \+= 1;[\s\S]{0,80}stop\(\)/.test(chatSrc));
    ok('4.8 chat.js 用统一判定接收迟到结果', chatSrc.indexOf('voiceTarget.shouldAcceptAudioResult') >= 0);
    ok('4.9 chat.js 卸载时销毁音频上下文', /this\._ttsAudio\.destroy\(\)/.test(chatSrc));
  }

  // ============ 5. 文本摘要不一致 → 静默跳过 ============
  console.log('--- 5. 文本一致性 ---');
  {
    const tts = freshTts();
    const node = dufuQuests.taishan.nodes.n2a;

    eq('5.1 运行时摘要与清单一致',
      voiceDigest.textDigest(node.text), tts.expectedDigest('dufu', 'taishan', 'n2a'));
    ok('5.2 空白折叠不影响摘要',
      voiceDigest.textDigest('甲 乙\n丙') === voiceDigest.textDigest(' 甲 乙 丙 '));
    ok('5.3 文本改动会改变摘要',
      voiceDigest.textDigest(node.text) !== voiceDigest.textDigest(node.text + '（改）'));

    calls.length = 0;
    cloudBehavior = 'ok';
    const url = await tts.resolveNodeAudio('dufu', 'taishan', 'n2a', node.text + '（这一版台词改过）');
    eq('5.4 摘要不一致返回空串', url, '');
    eq('5.5 摘要不一致不发云函数请求', calls.length, 0);

    eq('5.6 清单外节点不校验', tts.expectedDigest('dufu', 'taishan', 'no-such-node'), '');
    eq('5.7 清单外人物线不校验', tts.expectedDigest('nobody', 'taishan', 'n2a'), '');
    eq('5.8 清单外地点不校验', tts.expectedDigest('dufu', 'no-such-location', 'n2a'), '');

    // 摘要不同 → 缓存键不同（防止旧链接被错复用）
    const a = voiceDigest.textDigest('甲');
    const b = voiceDigest.textDigest('乙');
    ok('5.9 不同文本得到不同摘要', a !== b && a.length === 8 && b.length === 8);
    ok('5.10 空文本摘要为空串', voiceDigest.textDigest('') === '' && voiceDigest.textDigest('   ') === '');

    // 「跳过」是最终设计，不是临时妥协：不得留下「文本变了也照播旧音频」的降级分支。
    // 旧音频（时期路径 p1..p4）将来整体删除，源码里不应出现复用它/容忍不一致的逻辑。
    const ttsSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/utils/ttsAudio.js'), 'utf8');
    ok('5.11 摘要不一致时直接返回空串（无降级复用）',
      /want !== digest\)[\s\S]{0,200}return Promise\.resolve\(''\)/.test(ttsSrc));
    ok('5.12 不存在「不一致仍播放」的分支',
      !/want !== digest[\s\S]{0,300}(\.play\(|resolve\(url\)|tempFileURL)/.test(ttsSrc));
    // 只检查代码本身（注释里说明"旧音频 p1..p4 待删"是允许的）
    const ttsCode = ttsSrc
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/.*$/gm, '');
    ok('5.13 代码中无时期路径回退（不把旧 pN 音频当备选）',
      !/\bp[1-5]\b/.test(ttsCode) && ttsCode.indexOf('/voice/') >= 0);
  }

  // ============ 6. 缺音频 / 失败 / 异常都不阻塞 ============
  console.log('--- 6. 失败降级 ---');
  {
    const node = dufuQuests.taishan.nodes.n2a;
    const text = node.text;

    cloudBehavior = 'empty';
    let tts = freshTts();
    eq('6.1 无音频文件 → 空串（不抛错）', await tts.resolveNodeAudio('dufu', 'taishan', 'n2a', text), '');

    cloudBehavior = 'fail';
    tts = freshTts();
    eq('6.2 云函数失败 → 空串（不抛错）', await tts.resolveNodeAudio('dufu', 'taishan', 'n2a', text), '');

    cloudBehavior = 'throw';
    tts = freshTts();
    eq('6.3 调用异常 → 空串（不抛错）', await tts.resolveNodeAudio('dufu', 'taishan', 'n2a', text), '');
    cloudBehavior = 'ok';

    calls.length = 0;
    tts = freshTts();
    eq('6.4 缺 storyId → 空串', await tts.resolveNodeAudio('', 'taishan', 'n2a', text), '');
    eq('6.5 缺 audioQuestId → 空串', await tts.resolveNodeAudio('dufu', '', 'n2a', text), '');
    eq('6.6 缺 nodeId → 空串', await tts.resolveNodeAudio('dufu', 'taishan', '', text), '');
    eq('6.7 缺参数不发请求', calls.length, 0);
  }

  // ============ 7. 清单数量与实际 NPC talk 节点一致 ============
  console.log('--- 7. 清单完整性 ---');
  {
    const manifestPath = path.join(ROOT, 'tts-audio/manifests/dufu-locations.json');
    ok('7.1 已生成 dufu-locations.json', fs.existsSync(manifestPath));
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    let expected = 0;
    const perLoc = {};
    Object.keys(dufuQuests).forEach((lid) => {
      const n = manifestTool.collectNpcTalkNodes(dufuQuests[lid]).length;
      perLoc[lid] = n;
      expected += n;
    });
    eq('7.2 清单条数 = 实际 NPC talk 节点数', m.count, expected);
    eq('7.3 items 长度与 count 一致', m.items.length, m.count);
    eq('7.4 覆盖全部 22 地点', m.locations.length, 22);

    let perLocOk = true;
    m.locations.forEach((l) => { if (l.count !== perLoc[l.audioQuestId]) perLocOk = false; });
    ok('7.5 每地点条数与剧本一致', perLocOk);

    const required = ['lineId', 'kind', 'audioQuestId', 'nodeId', 'emotion', 'text', 'digest', 'fileName', 'cloudPath'];
    let fieldOk = true;
    let keyOk = true;
    m.items.forEach((it) => {
      required.forEach((k) => { if (it[k] === undefined || it[k] === '') fieldOk = false; });
      if (it.cloudPath !== `audio/voice/${it.lineId}/${it.audioQuestId}/${it.nodeId}.mp3`) keyOk = false;
      if (it.fileName !== `${it.nodeId}.mp3`) keyOk = false;
      if (/avatar0[123]/.test(it.cloudPath)) keyOk = false;
    });
    ok('7.6 每条记录字段完整', fieldOk);
    ok('7.7 音频键只由 线/地点/节点 决定（不含外观/姓名）', keyOk);

    const report = fs.readFileSync(path.join(ROOT, 'tts-audio/manifests/voice-report.md'), 'utf8');
    ['需要重做', '可复用', '无 NPC 配音'].forEach((kw) => {
      ok('7.8 报告含「' + kw + '」分类', report.indexOf(kw) >= 0);
    });

    // 清单跟随当前剧本，运行时摘要则代表“现有录音对应的台词版本”。
    // 台词改动而音频尚未重录时，两者必须暂时不一致，运行时才会安全跳过旧音频。
    const currentDigests = {};
    Object.keys(dufuQuests).forEach((lid) => {
      manifestTool.collectNpcTalkNodes(dufuQuests[lid]).forEach(({ nodeId, node }) => {
        currentDigests[`dufu/${lid}/${nodeId}`] = voiceDigest.textDigest(node.text);
      });
    });
    ok('7.9 录制清单文本摘要与当前剧本一致', m.items.every((it) => (
      currentDigests[`${it.lineId}/${it.audioQuestId}/${it.nodeId}`] === it.digest
    )));

    const runtimeManifest = require(path.join(ROOT, 'miniprogram/utils/voice-manifest.js'));
    let runtimeCovered = 0;
    const staleKeys = [];
    m.items.forEach((it) => {
      const d = runtimeManifest.dufu && runtimeManifest.dufu[it.audioQuestId] && runtimeManifest.dufu[it.audioQuestId][it.nodeId];
      if (d) runtimeCovered++;
      if (d && d !== it.digest) staleKeys.push(`${it.lineId}/${it.audioQuestId}/${it.nodeId}`);
    });
    eq('7.10 运行时摘要表覆盖全部清单节点', runtimeCovered, m.count);
    eq('7.11 待重录台词只限已确认的两句', staleKeys.sort().join(','), [
      'dufu/qizhao/n2a',
      'dufu/qizhao/n3a'
    ].join(','));
    ok('7.12 运行时表无遗留时期键', Object.keys(runtimeManifest.dufu).every(k => !/^p\d+$/.test(k)));
  }

  // ============ 8. 三种外观路径 / 非法回退 ============
  console.log('--- 8. 玩家立绘路径 ---');
  {
    eq('8.1 avatar01 路径', portraits.portraitPath('avatar01'), '/assets/images/npc/tang-young-scholar.png');
    eq('8.2 avatar02 路径', portraits.portraitPath('avatar02'), '/assets/images/npc/tang-mountain-guide.png');
    eq('8.3 avatar03 路径', portraits.portraitPath('avatar03'), '/assets/images/npc/tang-passing-traveler.png');
    const uniq = new Set(avatars.getAvatarIds().map(id => portraits.portraitPath(id)));
    eq('8.4 三外观路径互不相同', uniq.size, 3);
    ['', 'bogus', null, undefined, 'avatar99'].forEach((bad) => {
      eq('8.5 非法 avatarId ' + JSON.stringify(bad) + ' 回退空串', portraits.portraitPath(bad), '');
    });
    eq('8.6 无 portraitKey 回退空串', portraits.portraitPathOfKey(''), '');
    eq('8.7 素材键路径与 avatarId 路径一致',
      portraits.portraitPathOfKey(avatars.portraitKeyOf('avatar02')),
      portraits.portraitPath('avatar02'));
    // 三张素材实际存在（缺图时页面会退回剪影，但白名单必须指向真实文件）
    avatars.AVATARS.forEach((a) => {
      ok('8.8 ' + a.id + ' 素材文件存在',
        fs.existsSync(path.join(ROOT, '_cloud_upload/assets/images/npc', a.portraitKey + '.png')));
    });
  }

  // ============ 9. 导出 CLI 安全（别让一次误敲抹掉录音指纹） ============
  {
    const src = fs.readFileSync(path.join(ROOT, 'tools/export-voice-manifest.js'), 'utf8');
    const helpAt = src.indexOf("a === '--help'");
    const optsAt = src.indexOf('const opts = {');
    ok('9.1 --help 在参数解析前拦下（不会退化成一次默认导出）', helpAt > 0 && helpAt < optsAt);

    const { execFileSync } = require('child_process');
    const runtimePath = path.join(ROOT, 'miniprogram/utils/voice-manifest.js');
    const before = fs.readFileSync(runtimePath, 'utf8');
    const out = execFileSync(process.execPath, [path.join(ROOT, 'tools/export-voice-manifest.js'), '--help'], { encoding: 'utf8' });
    const after = fs.readFileSync(runtimePath, 'utf8');
    ok('9.2 --help 只打印用法、不动运行时摘要表',
      out.indexOf('--preserve-runtime') >= 0 && before === after);
  }

  // ============ 汇总 ============
  console.log('\n=====================================');
  if (failures.length) {
    console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
    failures.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
  }
  console.log('ALL PASS  ' + pass + ' 项断言全部通过');
  process.exit(0);
}

main().catch((err) => {
  console.error('测试执行异常：', err);
  process.exit(1);
});
