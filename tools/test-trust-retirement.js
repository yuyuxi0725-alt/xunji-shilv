// tools/test-trust-retirement.js —— 杜甫「信任 / 地点任务 / 职业变体」退场验证（本地可复现）
//
// 替代已退役的 test-taishan-trust-task.js（旧泰山信任/任务/见证物反馈测试，其被测对象
// 依赖已删除的 dufu-taishan-roles.js 与一套已退场的 effects 执行器）。
//
// 覆盖（docs/杜甫全程玩家角色-修改实施方案.md 步骤五，对应验收项 4 及「信任退场」）：
//   A. 22 地点剧本不含 tasks / effects / 信任 / 职业变体（当前源稿无任务，不复活过期样板）；
//   B. 旧信任值存在时不影响剧情文本、选项与节点解析结果；
//   C. 杜甫运行时不再向 AI / 剧情解析传 roleId、trustScore、playerRoleId、relationshipStage；
//   D. 旧 locationProfiles 兼容路径保留：chooseLocationRole / addTrustEvent / 任务 API 仍幂等可读，
//      供迁移与旧版本读取（不在本步骤删除用户本地数据）。
//
// 运行：node tools/test-trust-retirement.js

// ---- 最小 wx 存储 mock ----
const store = {};
global.wx = {
  getStorageSync(k) { return store[k] === undefined ? '' : store[k]; },
  setStorageSync(k, v) { store[k] = v; },
  removeStorageSync(k) { delete store[k]; }
};

const fs = require('fs');
const path = require('path');
const progress = require(path.join(__dirname, '../miniprogram/utils/progress.js'));
const variants = require(path.join(__dirname, '../miniprogram/utils/story-variants.js'));
const quests = require(path.join(__dirname, '../miniprogram/utils/stories/line-dufu-locations.generated.js'));

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, a, b) {
  ok(name, JSON.stringify(a) === JSON.stringify(b), 'got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function reset() { Object.keys(store).forEach(k => delete store[k]); }

const LOCATION_IDS = Object.keys(quests);

// ============ A. 22 地点剧本无 tasks / effects / 信任 / 职业变体 ============
console.log('--- A. 源稿无任务/效果/信任变体 ---');
{
  ok('A1 共 22 个地点剧本', LOCATION_IDS.length === 22);

  let offenders = [];
  LOCATION_IDS.forEach((lid) => {
    const q = quests[lid];
    if (!q || typeof q !== 'object') return;
    // 地点级字段
    if (q.tasks || q.effects) offenders.push(lid + ':tasks/effects');
    const nodes = q.nodes || {};
    Object.keys(nodes).forEach((nid) => {
      const n = nodes[nid];
      if (n.roleVariants || n.trustVariants || n.trustVariant || n.effects || n.tasks) {
        offenders.push(lid + '.' + nid);
      }
      // 选项里也不得有职业/信任变体与 effects
      (n.options || []).forEach((o, i) => {
        if (o && (o.roleVariants || o.trustVariants || o.trustVariant || o.effects)) {
          offenders.push(lid + '.' + nid + '.options[' + i + ']');
        }
      });
    });
  });
  eq('A2 无任何任务/效果/信任/职业变体字段', offenders, []);

  // 泰山当前数据确实没有 tasks（不得为复活过期样板而新增任务）
  ok('A3 泰山无 tasks', quests.taishan.tasks === undefined);
  ok('A4 泰山无 effects', quests.taishan.effects === undefined);
}

// ============ B. 旧信任值存在时不影响文本/选项/解析 ============
console.log('--- B. 旧信任值不影响剧情 ---');
{
  // 用「旧身份 + 旧信任」上下文解析一批真实节点，结果必须与无上下文一致
  const sample = [
    quests.luoyang.nodes[quests.luoyang.start],
    quests.taishan.nodes.n3,
    quests.taishan.nodes.n2a,
    quests.xiangjiang.nodes[quests.xiangjiang.start]
  ];
  let allSame = true;
  sample.forEach((n) => {
    const plain = JSON.stringify(variants.resolveNode(n));
    const oldCtx = JSON.stringify(variants.resolveNode(n, { roleId: 'fellowScholar', trustScore: 99 }));
    if (plain !== oldCtx) allSame = false;
  });
  ok('B1 旧身份/旧信任不改变节点解析结果', allSame === true);

  // 旧信任值注入前后，choice 选项文本与 next 完全一致
  const n3 = quests.taishan.nodes.n3;
  const base = variants.resolveNode(n3);
  const withOldTrust = variants.resolveNode(n3, { roleId: 'mountainGuide', trustScore: 5 });
  eq('B2 旧信任不改变选项文本', withOldTrust.options.map(o => o.text), base.options.map(o => o.text));
  eq('B3 旧信任不改变选项 next', withOldTrust.options.map(o => o.next), base.options.map(o => o.next));
}

// ============ C. 运行时不再传 roleId/trustScore/职业到 AI 与解析 ============
console.log('--- C. AI 与解析不再使用信任/职业参数 ---');
{
  // 读真实页面源码，断言职业/信任玩法标识已彻底移除（这些是代码标识，非注释文本）。
  // 不复制页面逻辑，只做「这些旧参数不得再出现」的源码级回归护栏。
  const chatSrc = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chat/chat.js'), 'utf8');
  const forbidden = [
    'playerRoleId', 'relationshipStage', 'playerAddress',
    'localTrustScore', 'localTrustLabel', 'roleOverlayVisible',
    'playerRoleType', 'chooseLocationRole', 'addTrustEvent',
    'getLocationTrust', 'initialTrust'
  ];
  const hits = forbidden.filter(tok => chatSrc.indexOf(tok) >= 0);
  eq('C1 chat.js 不含旧职业/信任标识', hits, []);

  // resolveNode 调用不再传 roleId/trustScore 上下文：源码中该调用不带身份/信任实参
  ok('C2 resolveNode 不再传身份/信任上下文', /\bresolveNode\(sourceNode\)\s*;?/.test(chatSrc));
}

// ============ D. 旧 locationProfiles 兼容路径保留（幂等可读） ============
console.log('--- D. 旧数据兼容路径保留 ---');
{
  reset();

  // chooseLocationRole：已写不可普通覆盖（供迁移/旧版本读取，新流程不调用）
  const chosen = progress.chooseLocationRole('dufu', 'taishan', 'fellowScholar');
  ok('D1 首次选择返回档案', !!chosen && chosen.roleId === 'fellowScholar');
  eq('D2 再次选择返回 null（不覆盖）', progress.chooseLocationRole('dufu', 'taishan', 'mountainGuide'), null);

  // addTrustEvent：幂等，同 eventId 只加一次
  progress.addTrustEvent('dufu', 'taishan', 'ev.role.initial', 1);
  progress.addTrustEvent('dufu', 'taishan', 'ev.role.initial', 1);
  eq('D3 信任事件幂等（只加一次）', progress.getLocationTrust('dufu', 'taishan'), 1);

  // 任务 API 幂等可读（兼容路径；新剧本无任务，故不被运行时调用）
  progress.startLocationTask('dufu', 'taishan', 'task.climb');
  progress.completeTaskStep('dufu', 'taishan', 'task.climb', 's1');
  progress.completeTaskStep('dufu', 'taishan', 'task.climb', 's1');
  progress.completeLocationTask('dufu', 'taishan', 'task.climb');
  const task = progress.getLocationProfile('dufu', 'taishan').tasks['task.climb'];
  eq('D4 任务步骤幂等（仍只一步）', Object.keys(task.steps).join(','), 's1');
  eq('D5 任务可完成', task.status, 'completed');

  // 旧数据对玩家角色档案是独立通道：读旧 locationProfiles 不污染 playerProfiles
  ok('D6 旧 locationProfiles 不影响玩家角色档案', progress.getPlayerProfile('dufu') === null);
}

console.log('\n=====================================');
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
