// tools/verify-dufu-role-integration.js —— 杜甫线「角色接入」集成审核（步骤十）
//
// 与既有脚本的分工（不重复、不替代）：
//   · tools/verify-location-story.js / verify-locations.js —— 剧情结构与诗笺数据；
//   · tools/build-dufu-*.js --check —— 生成物与源稿逐字节一致；
//   · **本脚本** —— 只审「玩家角色接入后新增/受影响的那些面」：
//       1. AI 节点（aiFree）与 scenes.js 白名单、可信 prompt、记忆表三者一致；
//       2. 玩家话语节点语义（talk.speaker / choice 的 actionOnly、spokenText）；
//       3. 节点级 scene 引用都在地点 sceneSets 内（不会切到不存在的图）；
//       4. 剧情锚点 node.anchor 都在本线 ANCHORS 表（否则 chat 会丢弃，静默少一个印记）；
//       5. 配音清单覆盖全部 NPC talk，且不含玩家发言/旁白/动作；
//       6. 地点元数据（坐标、npcStage 有立绘、sceneKey、placeId）；
//       7. 角色/记忆/配音/重温所需的运行时模块与页面接线都在。
//
// 运行：node tools/verify-dufu-role-integration.js
// 退出码：0 通过 / 1 有问题（便于接入发布前检查）

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const S = p => require(path.join(ROOT, 'miniprogram', 'utils', 'stories', p));

const meta = S('dufu-locations.js');
const quests = S('line-dufu-locations.generated.js');
const anchorInfo = S('anchor-info.js');
const lineDufu = S('line-dufu.js');
const scenes = require(path.join(ROOT, 'miniprogram/cloudfunctions/chat/scenes.js'));
const memory = require(path.join(ROOT, 'miniprogram/cloudfunctions/chat/memory.js'));
const dufuEvents = require(path.join(ROOT, 'miniprogram/utils/dufu-events.js'));
const voiceManifest = require(path.join(ROOT, 'miniprogram/utils/voice-manifest.js'));
const voiceDigest = require(path.join(ROOT, 'miniprogram/utils/voice-digest.js'));

const problems = [];
const notes = [];
const locations = meta.locations;
const anchorTable = lineDufu.anchors || {};

function bad(msg) { problems.push(msg); }

// ============ 1. AI 节点 ⟷ scenes.js ⟷ 记忆表 ============
let aiFreeCount = 0;
const sceneTable = (scenes.dufu && scenes.dufu.scenes) || {};
locations.forEach((l) => {
  const q = quests[l.id];
  if (!q) return;
  Object.keys(q.nodes || {}).forEach((nid) => {
    const n = q.nodes[nid];
    if (n.type !== 'aiFree') return;
    aiFreeCount++;

    if (!n.prompt || !String(n.prompt).trim()) bad(l.id + ' ' + nid + ': aiFree 缺少场景 prompt');
    const entry = sceneTable[l.id] && sceneTable[l.id][nid];
    if (!entry) {
      bad(l.id + ' ' + nid + ': aiFree 不在 scenes.js 白名单（服务端会拒绝可信 prompt）');
    } else {
      if (entry.prompt !== String(n.prompt).trim()) {
        bad(l.id + ' ' + nid + ': scenes.js 的 prompt 与剧本不一致（未重跑 build-dufu-memory？）');
      }
      const wantPeriod = meta.LOCATION_PERIOD[l.id] || '';
      if (entry.period !== wantPeriod) {
        bad(l.id + ' ' + nid + ': scenes.js period=' + entry.period + '（应为 ' + wantPeriod + '）');
      }
    }
    // 记忆表：该地点必须有必经事件，否则 AI 记得"空"
    if (!memory.DUFU_EVENTS[l.id]) bad(l.id + ': 缺少必经事件摘要（AI 记忆与终章回望都用它）');
    if (!memory.DUFU_RECAPS[l.id]) bad(l.id + ': 缺少终章回望文案');
  });
});
notes.push('AI 自由对话节点 ' + aiFreeCount + ' 个');

// scenes.js 里不应有剧本里不存在的 aiFree（防止剧本删节点后白名单留尸体）
Object.keys(sceneTable).forEach((lid) => {
  Object.keys(sceneTable[lid]).forEach((nid) => {
    const n = quests[lid] && quests[lid].nodes && quests[lid].nodes[nid];
    if (!n) bad('scenes.js 存在白名单残留：' + lid + '/' + nid + '（剧本无此节点）');
    else if (n.type !== 'aiFree') bad('scenes.js 收录了非 aiFree 节点：' + lid + '/' + nid);
  });
});

// memory 顺序必须与地点元数据顺序一致（记忆时间截断依赖它）
eqList('memory.DUFU_ORDER 与地点顺序一致',
  memory.DUFU_ORDER, locations.map(l => l.id));
eqList('dufu-events.order 与地点顺序一致',
  dufuEvents.order, locations.map(l => l.id));

// ============ 2. 玩家话语节点语义 ============
let playerTalk = 0;
let actionOptions = 0;
locations.forEach((l) => {
  const q = quests[l.id];
  if (!q) return;
  Object.keys(q.nodes || {}).forEach((nid) => {
    const n = q.nodes[nid];
    if (n.type === 'talk') {
      const sp = n.speaker || 'npc';
      if (sp !== 'npc' && sp !== 'player') bad(l.id + ' ' + nid + ': talk.speaker 非法值 ' + sp);
      if (sp === 'player') {
        playerTalk++;
        if (!n.text) bad(l.id + ' ' + nid + ': 玩家 talk 无台词');
      }
      // 剧情锚点白名单
      if (n.anchor && !anchorTable[n.anchor]) {
        bad(l.id + ' ' + nid + ': talk.anchor ' + n.anchor + ' 未在本线 ANCHORS 表（会被页面丢弃）');
      }
    }
    (n.options || []).forEach((o, i) => {
      if (!o) return;
      // actionOnly 必须是布尔（字符串 'true' 会被判为假，导致动作被当台词念）
      if (o.actionOnly !== undefined && typeof o.actionOnly !== 'boolean') {
        bad(l.id + ' ' + nid + '.options[' + i + ']: actionOnly 必须是布尔值');
      }
      if (o.spokenText !== undefined && typeof o.spokenText !== 'string') {
        bad(l.id + ' ' + nid + '.options[' + i + ']: spokenText 必须是字符串');
      }
      if (o.actionOnly === true) {
        actionOptions++;
        // 动作型选项不应同时写 spokenText（会被当成台词，语义冲突）
        if (o.spokenText) {
          bad(l.id + ' ' + nid + '.options[' + i + ']: actionOnly 与 spokenText 同时存在，语义冲突');
        }
      }
      if (o.anchor && !anchorTable[o.anchor]) {
        bad(l.id + ' ' + nid + '.options[' + i + ']: anchor ' + o.anchor + ' 未登记');
      }
    });
  });
});
notes.push('玩家台词节点 ' + playerTalk + ' 个 / 动作型选项 ' + actionOptions + ' 个');

// ============ 3. 节点级 scene 引用都在 sceneSets 内 ============
let sceneRefs = 0;
locations.forEach((l) => {
  const q = quests[l.id];
  if (!q) return;
  const sets = (meta.sceneSets && meta.sceneSets[l.id]) || {};
  Object.keys(q.nodes || {}).forEach((nid) => {
    const n = q.nodes[nid];
    if (!n.scene) return;
    sceneRefs++;
    if (!sets[n.scene]) {
      bad(l.id + ' ' + nid + ': scene "' + n.scene + '" 不在该地点 sceneSets（运行时会切不到图）');
    }
  });
  // 镜头级场景（<地点>_s0N）也必须落在 sceneSets 内
  Object.keys(sets).forEach((k) => {
    if (!sets[k]) bad(l.id + ': sceneSets["' + k + '"] 为空');
  });
});
notes.push('节点级 scene 引用 ' + sceneRefs + ' 处');

// ============ 4. 地点元数据 ============
const avatarStages = Object.keys(lineDufu.periodNpcImages || {});
locations.forEach((l) => {
  if (typeof l.x !== 'number' || l.x < 0 || l.x > 100) bad(l.id + ': x 坐标非法 ' + l.x);
  if (typeof l.y !== 'number' || l.y < 0 || l.y > 100) bad(l.id + ': y 坐标非法 ' + l.y);
  if (!l.sceneKey) bad(l.id + ': 缺少 sceneKey');
  if (!l.npcStage) bad(l.id + ': 缺少 npcStage');
  else if (avatarStages.indexOf(l.npcStage) < 0) {
    bad(l.id + ': npcStage "' + l.npcStage + '" 在 periodNpcImages 无对应立绘');
  }
  // 同城聚合：placeId 若存在则必须是字符串（地图按它聚合）
  if (l.placeId !== undefined && typeof l.placeId !== 'string') bad(l.id + ': placeId 必须是字符串');
});
notes.push('地点立绘阶段 ' + avatarStages.join('/'));

// ============ 5. 配音清单 ⟷ NPC talk ============
const manifestPath = path.join(ROOT, 'tts-audio/manifests/dufu-locations.json');
if (!fs.existsSync(manifestPath)) {
  bad('缺少配音清单 tts-audio/manifests/dufu-locations.json（先跑 export-voice-manifest）');
} else {
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const inManifest = {};
  (m.items || []).forEach((it) => { inManifest[it.audioQuestId + '/' + it.nodeId] = it; });

  let npcTalk = 0;
  const missing = [];
  const staleVoiceKeys = [];
  locations.forEach((l) => {
    const q = quests[l.id];
    if (!q) return;
    Object.keys(q.nodes || {}).forEach((nid) => {
      const n = q.nodes[nid];
      const isNpcTalk = n.type === 'talk' && (n.speaker || 'npc') === 'npc';
      if (!isNpcTalk) return;
      npcTalk++;
      const key = l.id + '/' + nid;
      const it = inManifest[key];
      if (!it) { missing.push(key); return; }
      if (it.digest !== voiceDigest.textDigest(n.text)) {
        bad(key + ': 录制清单 digest 与当前剧本不一致');
      }
      // 运行时表代表现有录音版本。台词已改、尚未重录的节点应故意不一致，
      // 使运行时跳过旧音频；重录并重新导出后再从白名单移除。
      const rt = voiceManifest.dufu && voiceManifest.dufu[l.id] && voiceManifest.dufu[l.id][nid];
      if (!rt) bad('voice-manifest 缺少 ' + key + '（运行时将不做摘要校验）');
      else if (rt !== it.digest) staleVoiceKeys.push('dufu/' + key);
      if (it.cloudPath !== 'audio/voice/' + l.id + '/' + nid + '.mp3') {
        // 注意清单里 lineId 在前
        if (it.cloudPath !== 'audio/voice/dufu/' + l.id + '/' + nid + '.mp3') {
          bad(key + ': cloudPath 异常 ' + it.cloudPath);
        }
      }
    });
  });
  const expectedStaleVoiceKeys = ['dufu/qizhao/n2a', 'dufu/qizhao/n3a'];
  if (staleVoiceKeys.sort().join(',') !== expectedStaleVoiceKeys.join(',')) {
    bad('待重录台词集合异常：' + (staleVoiceKeys.join(', ') || '无'));
  }
  if (missing.length) bad('配音清单缺少 ' + missing.length + ' 个 NPC talk：' + missing.slice(0, 6).join(', '));
  notes.push('NPC 台词 ' + npcTalk + ' 条 / 清单 ' + (m.items || []).length + ' 条 / 待重录 ' + staleVoiceKeys.length + ' 条');
  // 清单里不得有多余项（剧本删节点的残留）
  (m.items || []).forEach((it) => {
    const n = quests[it.audioQuestId] && quests[it.audioQuestId].nodes && quests[it.audioQuestId].nodes[it.nodeId];
    if (!n) bad('配音清单残留已删除节点：' + it.audioQuestId + '/' + it.nodeId);
    else if (!(n.type === 'talk' && (n.speaker || 'npc') === 'npc')) {
      bad('配音清单收录了非 NPC talk：' + it.audioQuestId + '/' + it.nodeId);
    }
  });
}

// ============ 6. 运行时模块与页面接线 ============
const REQUIRED_MODULES = [
  'miniprogram/utils/player-avatars.js',
  'miniprogram/utils/player-profile.js',
  'miniprogram/utils/player-guard.js',
  'miniprogram/utils/player-portrait.js',
  'miniprogram/utils/player-card.js',
  'miniprogram/utils/play-mode.js',
  'miniprogram/utils/dufu-events.js',
  'miniprogram/utils/dufu-recap.js',
  'miniprogram/utils/voice-target.js',
  'miniprogram/utils/voice-digest.js',
  'miniprogram/utils/voice-manifest.js',
  'miniprogram/cloudfunctions/chat/memory.js',
  'miniprogram/cloudfunctions/chat/scenes.js'
];
REQUIRED_MODULES.forEach((rel) => {
  if (!fs.existsSync(path.join(ROOT, rel))) bad('缺少运行时模块 ' + rel);
});

// 页面接线：chat 必须用到角色恢复、配音判定、重温守卫、终章回望
const chatSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/pages/chat/chat.js'), 'utf8');
[
  ['角色恢复', '_applyPlayerProfile'],
  ['配音判定', 'voiceTarget.isNpcTalkNode'],
  ['重温守卫', '_shouldWriteProgress'],
  ['终章回望', 'dufuRecap.buildRecap'],
  ['锚点白名单', '未知锚点已忽略']
].forEach(([label, token]) => {
  if (chatSrc.indexOf(token) < 0) bad('chat.js 未接线：' + label + '（缺 ' + token + '）');
});

// profile / map / player 页接线
const profileSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/pages/profile/profile.js'), 'utf8');
if (profileSrc.indexOf('playerCard.resolveRoleCard') < 0) bad('profile.js 未使用统一四态判定');
const mapSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/pages/map/map.js'), 'utf8');
if (mapSrc.indexOf('playerCard.companionName') < 0) bad('map.js 未使用统一同行者判定');
const playerSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/pages/player/player.js'), 'utf8');
if (playerSrc.indexOf('playerPortrait.portraitPathOfKey') < 0) bad('player.js 未使用统一立绘路径');

// ============ 6.5 安全行为接线（取消 / 连点 / 图片迟到 / 非法档案） ============
// 这些是"缺失即回归"的护栏：删掉任意一条，用户就会遇到写半份档案、
// 重复跳转，或旧图片盖住新形象。
{
  const playerPageSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/pages/player/player.js'), 'utf8');

  // 取消/返回不得写档案：onBack 只做 navigateBack
  const backFn = /onBack\s*\(\)\s*\{([\s\S]*?)\n  \},/.exec(playerPageSrc);
  if (!backFn) bad('player.js 缺少 onBack（取消/返回）');
  else if (/savePlayerProfile|createProfile/.test(backFn[1])) {
    bad('player.js 的取消/返回路径写了角色档案（应当不写）');
  }

  // 防连点：提交前有 submitting 锁
  if (playerPageSrc.indexOf('submitting') < 0) bad('player.js 缺少提交防连点锁（submitting）');
  if (!/if\s*\(\s*this\.data\.submitting\s*\)\s*return/.test(playerPageSrc)) {
    bad('player.js 的确认入口未在开头拦截重复提交');
  }

  // 图片迟到：页面卸载后丢弃回填
  if (playerPageSrc.indexOf('_unloaded') < 0) bad('player.js 未在卸载后丢弃迟到的立绘响应');

  // chat 页：角色切换/卸载后旧立绘不得覆盖新形象
  if (chatSrc.indexOf('_playerAvatarReq') < 0) bad('chat.js 未用请求代号丢弃迟到的玩家立绘');

  // 非法档案：读取层必须拒绝，页面必须有修复入口
  const progressSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/utils/progress.js'), 'utf8');
  if (progressSrc.indexOf('hasInvalidPlayerProfile') < 0) bad('progress.js 缺少非法档案识别（hasInvalidPlayerProfile）');
  if (profileSrc.indexOf("status === 'invalid'") < 0 && profileSrc.indexOf('resolveRoleCard') < 0) {
    bad('profile.js 未处理非法档案状态');
  }
}

// ============ 6.6 三条人物线角色支持接线（杜甫/李白/苏轼） ============
// 角色创建/编辑/全程显示已扩展到三线：guard 白名单三线、进度层白名单三线、
// 页面按真实 lineId 守卫与恢复，不再硬编码 'dufu'。
{
  const guard = require(path.join(ROOT, 'miniprogram/utils/player-guard.js'));
  const want = ['dufu', 'libai', 'sushi'];
  if (JSON.stringify(guard.ROLE_LINES.slice().sort()) !== JSON.stringify(want.slice().sort())) {
    bad('player-guard.ROLE_LINES 未覆盖三线：' + JSON.stringify(guard.ROLE_LINES));
  }
  // 进度层白名单与 guard 一致（伪造 lineId 拒存）
  const progressMod = require(path.join(ROOT, 'miniprogram/utils/progress.js'));
  if (typeof progressMod.isPlayerProfileLine !== 'function') {
    bad('progress.js 缺少人物线白名单校验 isPlayerProfileLine');
  } else if (!want.every(l => progressMod.isPlayerProfileLine(l)) || progressMod.isPlayerProfileLine('baijuyi')) {
    bad('progress.js 人物线白名单与 guard 不一致');
  }
  // chat.js 的角色守卫/恢复不得再硬编码 'dufu'
  const chatNoDufuGuard = !/line\.id\s*===\s*'dufu'/.test(chatSrc)
    && !/getPlayerProfile\('dufu'\)/.test(chatSrc)
    && !/needsRolePage\('dufu'/.test(chatSrc);
  if (!chatNoDufuGuard) bad('chat.js 角色守卫/恢复仍硬编码 dufu');
  // profile.js 从 guard.ROLE_LINES 生成三张角色卡（而非单卡写死 dufu）
  if (profileSrc.indexOf('guard.ROLE_LINES') < 0 && profileSrc.indexOf("roleCards") < 0) {
    bad('profile.js 未按人物线白名单生成角色卡列表');
  }
}

// ============ 7. app.json 注册与页面文件齐备 ============
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'miniprogram/app.json'), 'utf8'));
const pages = appJson.pages || [];
['pages/player/player', 'pages/chat/chat', 'pages/profile/profile', 'pages/map/map'].forEach((p) => {
  if (pages.indexOf(p) < 0) bad('app.json 未注册 ' + p);
});
['player', 'chat', 'profile', 'map'].forEach((p) => {
  ['js', 'wxml', 'wxss'].forEach((ext) => {
    const f = path.join(ROOT, 'miniprogram/pages', p, p + '.' + ext);
    if (!fs.existsSync(f)) bad('缺少页面文件 pages/' + p + '/' + p + '.' + ext);
  });
});

// ============ 8. 事件绑定都有处理器 ============
// 从 wxml 抓 bindtap/catchtap/bindinput 等，比对 js 里是否有同名方法定义
function checkHandlers(pageName) {
  const wxmlPath = path.join(ROOT, 'miniprogram/pages', pageName, pageName + '.wxml');
  const jsPath = path.join(ROOT, 'miniprogram/pages', pageName, pageName + '.js');
  if (!fs.existsSync(wxmlPath) || !fs.existsSync(jsPath)) return;
  const wxml = fs.readFileSync(wxmlPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');
  const re = /\b(?:bind|catch):?([a-z]+)\s*=\s*"([A-Za-z_$][\w$]*)"/g;
  let mm;
  const missing = new Set();
  while ((mm = re.exec(wxml))) {
    const handler = mm[2];
    // 方法可能有 async 前缀（`async onAiSend() {`），也可能写成 `xxx: function` 形式。
    // noop 这类空处理器同样要被认出来，否则会误报。
    const defined = new RegExp('(^|\\n)\\s*(?:async\\s+)?' + handler + '\\s*\\(').test(js)
      || new RegExp('\\b' + handler + '\\s*:\\s*(?:async\\s+)?function').test(js)
      || new RegExp('\\b' + handler + '\\s*:\\s*(?:async\\s*)?\\(').test(js);
    if (!defined) missing.add(handler);
  }
  if (missing.size) bad(pageName + '.wxml 存在无处理器的绑定：' + Array.from(missing).join(', '));
}
['chat', 'profile', 'map', 'player', 'poem', 'story', 'index'].forEach(checkHandlers);

// ============ 汇总 ============
function eqList(name, actual, expected) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) bad(name + '\n    实际: ' + a + '\n    期望: ' + b);
}

console.log('=== 杜甫角色接入集成审核 ===');
notes.forEach(n => console.log('  ' + n));

if (problems.length) {
  console.log('\n=== 发现问题 ' + problems.length + ' 条 ===');
  problems.forEach(p => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('\nALL_OK 角色接入面：AI 节点 / 动作语义 / 场景引用 / 锚点 / 配音清单 / 元数据 / 接线 / 事件绑定');
process.exit(0);
