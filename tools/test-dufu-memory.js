// tools/test-dufu-memory.js —— 杜甫「AI 共同经历记忆」单元测试（步骤七，本地可复现）
//
// 覆盖 docs/杜甫全程玩家角色-修改实施方案.md 步骤七的验收项：
//   1. 洛阳首见没有旧记忆
//   2. 长安场景可引用已完成的洛阳/泰山必经事实
//   3. 未完成泰山时长安请求不会伪造泰山记忆；越级 URL 仍被拦截
//   4. 重温泰山时排除所有后期记忆
//   5. 当前 AI 节点之前未发生的同地点事件不注入
//   6. 未选分支不被回忆（第一版只记必经事实，无分支专属记忆）
//   7. 客户端伪造 locationId / nodeId / freePrompt 被拒绝或忽略
//   8. 三种 avatarId 得到相同系统上下文
//   9. 旧 playerRoleId / trust 值不会改变回答上下文
//  10. 兜底语气的人物、年代和称呼正确（不退回旧「泰山身份」）
//  11. history 不跨地点、不跨 replay 会话（前端 chatLog 每 aiFree 节点重置 + sessionId 含地点）
//
// 纯函数测试，不调用真实外部模型、不消耗线上额度。
//
// 运行：node tools/test-dufu-memory.js

const path = require('path');
const fs = require('fs');
const memory = require(path.join(__dirname, '../miniprogram/cloudfunctions/chat/memory.js'));
const engine = require(path.join(__dirname, '../miniprogram/cloudfunctions/chat/engine.js'));
const scenes = require(path.join(__dirname, '../miniprogram/cloudfunctions/chat/scenes.js'));
const KNOWLEDGE = require(path.join(__dirname, '../miniprogram/cloudfunctions/chat/knowledge.js'));

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, a, b) {
  ok(name, JSON.stringify(a) === JSON.stringify(b), 'got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}

const ORDER = memory.DUFU_ORDER;
const ALL_DONE = ORDER.slice();   // 全部地点已完成（用于验证时间截断）

function idsOf(events) { return (events || []).map(e => e.sourceLocationId); }

// ============ 1. 洛阳首见没有旧记忆 ============
console.log('--- 1. 洛阳首见无记忆 ---');
{
  const evts = memory.resolveAvailableEvents('luoyang', ALL_DONE);
  eq('1.1 洛阳（第一个地点）无任何可用记忆', evts, []);
  // 即便客户端声称全部已完成，首见也不得引用任何共同经历
  eq('1.2 客户端伪造「全已完成」也不注入', idsOf(memory.resolveAvailableEvents('luoyang', ALL_DONE)), []);
}

// ============ 2. 长安可引用已完成的洛阳/泰山 ============
console.log('--- 2. 长安引用已完成必经事实 ---');
{
  const evts = memory.resolveAvailableEvents('changan', ['luoyang', 'taishan']);
  ok('2.1 长安可引用洛阳', idsOf(evts).indexOf('luoyang') >= 0);
  ok('2.2 长安可引用泰山', idsOf(evts).indexOf('taishan') >= 0);
  ok('2.3 每条记忆有 eventId', evts.every(e => e.eventId === 'dufu.' + e.sourceLocationId));
  ok('2.4 每条记忆有非空摘要', evts.every(e => e.summary && e.summary.length > 0));
}

// ============ 3. 未完成泰山时长安不伪造泰山记忆；越级 URL 拦截 ============
console.log('--- 3. 不伪造 / 越级拦截 ---');
{
  const evts = memory.resolveAvailableEvents('changan', ['luoyang']);
  eq('3.1 未完成泰山则长安不引用泰山', idsOf(evts).indexOf('taishan'), -1);
  ok('3.2 未完成泰山仍可引用已完成的洛阳', idsOf(evts).indexOf('luoyang') >= 0);

  // 越级 / 伪造地点 ID：一律拒绝，不注入任何记忆
  ok('3.3 未知地点被拦截', memory.isKnownLocation('bogus') === false);
  eq('3.4 未知地点无可用记忆', memory.resolveAvailableEvents('bogus', ALL_DONE), []);
  eq('3.5 空地点无可用记忆', memory.resolveAvailableEvents('', ALL_DONE), []);
}

// ============ 4. 重温泰山时排除所有后期记忆 ============
console.log('--- 4. 重温泰山时间截断 ---');
{
  const evts = memory.resolveAvailableEvents('taishan', ALL_DONE);
  const got = idsOf(evts);
  const taishanIdx = ORDER.indexOf('taishan');
  ok('4.1 只含泰山之前的地点', got.every(id => ORDER.indexOf(id) < taishanIdx));
  ok('4.2 不含成都', got.indexOf('chengdu') === -1);
  ok('4.3 不含夔州', got.indexOf('kuizhou') === -1);
  ok('4.4 不含湘江', got.indexOf('xiangjiang') === -1);
  ok('4.5 不含泰山之后才发生的李杜同游', got.indexOf('qizhao') === -1);
}

// ============ 5. 当前地点之前未发生的同地点事件不注入 ============
console.log('--- 5. 同地点未来事件不注入 ---');
{
  // 第一版记忆是「地点级」：当前地点自身的事件也不会进入可用列表（只取之前地点）。
  // 即使泰山已完成，在泰山内部也不引用「泰山」这条记忆（它属于当前地点，未到回望时机）。
  const evts = memory.resolveAvailableEvents('taishan', ALL_DONE);
  eq('5.1 当前地点(泰山)自身事件不注入', idsOf(evts).indexOf('taishan'), -1);
  // 最多 3 条（提示词要求少量注入）
  ok('5.2 注入不超过 3 条', evts.length <= 3);
}

// ============ 6. 未选分支不被回忆（第一版只记必经事实） ============
console.log('--- 6. 只记必经事实 ---');
{
  // DUFU_EVENTS 每个值都是纯文本摘要（无 choiceId/optionId/kind:'分支' 等分支字段）
  const values = Object.values(memory.DUFU_EVENTS);
  ok('6.1 22 条必经事件', values.length === ORDER.length);
  ok('6.2 全部为纯文本摘要', values.every(v => typeof v === 'string' && v.length > 0));
  // 没有稳定选项证据时，用中性摘要——这里不接收任何客户端「选择证据」
  const memSrc = fs.readFileSync(path.join(__dirname, '../miniprogram/cloudfunctions/chat/memory.js'), 'utf8');
  ok('6.3 共同经历表不含分支选择字段', /choiceId|optionId|kind\s*:\s*['"]分支/.test(memSrc) === false);
}

// ============ 7. 伪造 locationId / nodeId / freePrompt 拒绝或忽略 ============
console.log('--- 7. 白名单拒绝伪造 ---');
{
  // locationId 白名单
  ok('7.1 非法 locationId 被拒绝', memory.isKnownLocation('xiangjiang') === true && memory.isKnownLocation('evil') === false);

  // nodeId 白名单（scenes.js 三要素校验）
  const trusted = memory.resolveScenePrompt(scenes, 'dufu', 'taishan', 'n14');
  ok('7.2 合法 nodeId 命中可信 prompt', trusted && trusted.length > 0);
  eq('7.3 伪造 nodeId 被拒绝', memory.resolveScenePrompt(scenes, 'dufu', 'taishan', 'bogus'), '');
  eq('7.4 越级 locationId 被拒绝', memory.resolveScenePrompt(scenes, 'dufu', 'bogus', 'n14'), '');
  eq('7.5 非人物线被拒绝', memory.resolveScenePrompt(scenes, 'libai', 'taishan', 'n14'), '');
  eq('7.6 旧客户端不传 nodeId 时不给 freePrompt', memory.resolveScenePrompt(scenes, 'dufu', 'taishan', ''), '');

  // freePrompt：白名单数据里每个 aiFree 场景都有可信 prompt（供服务端替代客户端 freePrompt）
  let allHavePrompt = true;
  Object.keys(scenes.dufu.scenes).forEach((lid) => {
    Object.keys(scenes.dufu.scenes[lid]).forEach((nid) => {
      if (!scenes.dufu.scenes[lid][nid].prompt) allHavePrompt = false;
    });
  });
  ok('7.7 全部 17 个 aiFree 场景都有可信 prompt', allHavePrompt === true);
}

// ============ 8. 三种 avatarId 得到相同系统上下文 ============
console.log('--- 8. 三外观等价 ---');
{
  // buildSystemPrompt 不接收 avatarId：三种外观传入相同参数，上下文完全一致
  const base = { npc: 'dufu', questId: 'p1', cards: KNOWLEDGE.dufu.p1, coveredList: [], hitCards: [], stage: 'probe', availableMemories: memory.resolveAvailableEvents('taishan', ['luoyang', 'luoyang_shi']) };
  const p1 = engine.buildSystemPrompt(Object.assign({}, base, { avatarId: 'avatar01' }));
  const p2 = engine.buildSystemPrompt(Object.assign({}, base, { avatarId: 'avatar02' }));
  const p3 = engine.buildSystemPrompt(Object.assign({}, base, { avatarId: 'avatar03' }));
  ok('8.1 三种外观生成相同系统提示词', p1 === p2 && p2 === p3);
  ok('8.2 系统提示词不含外观差异信息', /avatar0[123]/.test(p1) === false);
}

// ============ 9. 旧 playerRoleId / trust 值不改变回答上下文 ============
console.log('--- 9. 旧职业/信任不影响上下文 ---');
{
  const base = { npc: 'dufu', questId: 'p1', cards: KNOWLEDGE.dufu.p1, coveredList: [], hitCards: [], stage: 'probe', availableMemories: [] };
  const clean = engine.buildSystemPrompt(base);
  const withOld = engine.buildSystemPrompt(Object.assign({}, base, { playerRoleId: 'fellowScholar', relationshipStage: '袒露心事', trustScore: 99 }));
  eq('9.1 旧 playerRoleId/trust 不改变系统提示词', clean, withOld);
  // 源码级护栏：engine 不再含职业/信任/关系阶段标识
  const engSrc = fs.readFileSync(path.join(__dirname, '../miniprogram/cloudfunctions/chat/engine.js'), 'utf8');
  const forbidden = ['playerRoleId', 'relationshipStage', 'trustScore', 'initialTrust', 'fellowScholar', 'mountainGuide', 'passingTraveler'];
  eq('9.2 engine 不含旧职业/信任标识', forbidden.filter(t => engSrc.indexOf(t) >= 0), []);
}

// ============ 10. 兜底语气的人物、年代、称呼正确 ============
console.log('--- 10. 兜底语气不退回旧身份 ---');
{
  // 未知地点时给通用「同行者」语气，不退回「临时泰山身份」
  const unknown = engine.dufuPlayerContext('bogus');
  ok('10.1 未知地点给通用同行者语气', unknown.indexOf('同行者') >= 0);
  ok('10.2 不含旧职业名', /书生|引路人|旅人|泰山/.test(unknown) === false);
  // 初见 vs 重逢称呼正确
  ok('10.3 洛阳是初见', engine.dufuPlayerContext('luoyang').indexOf('第一次') >= 0);
  ok('10.4 晚年是老朋友语气', engine.dufuPlayerContext('chengdu').indexOf('老朋友') >= 0);
  // 空记忆列表时模型被告知「尚无共同经历，不得编造」
  const emptyMemory = engine.buildMemoryText([]);
  ok('10.5 空记忆提示不编造', emptyMemory.indexOf('不得自行编造共同经历') >= 0);
}

// ============ 11. history 不跨地点、不跨 replay 会话 ============
console.log('--- 11. 会话隔离 ---');
{
  // 前端：sessionId 含地点（同一点地点的多轮 history 才归属同一会话）；
  // chatLog 在每个 aiFree 节点重置（seedLog），因此切地点/replay 后不携带上一地点聊天正文。
  const chatSrc = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chat/chat.js'), 'utf8');
  ok('11.1 sessionId 含地点（不跨地点）', /sessionId:\s*this\.data\._line\.id\s*\+\s*'_'\s*\+\s*this\.data\._questId/.test(chatSrc));
  ok('11.2 aiFree 进入时重置聊天记录', /chatLog:\s*seedLog/.test(chatSrc));
  // 服务端只带最近 6 轮（index.js callDeepSeek）
  const idxSrc = fs.readFileSync(path.join(__dirname, '../miniprogram/cloudfunctions/chat/index.js'), 'utf8');
  ok('11.3 服务端 history 最多 6 轮', /slice\(-6\)/.test(idxSrc));
  // 前端组装 history 只取最近 6 轮
  ok('11.4 前端 history 只带最近 6 轮', /chatLog\.slice\(-6\)/.test(chatSrc));
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
