// tools/test-location-progress.js —— 三条人物线地点进度逻辑测试（本地可复现，无需云环境）
//
// 覆盖（docs/杜甫21地点地图叙事-开发实施步骤.md 步骤 10）：
//   - 新用户初始状态（仅地点 1 active）；
//   - 逐地点完成与解锁；
//   - 关键地点颜色不影响状态；
//   - 中途检查点保存/恢复；
//   - 重温不覆盖主线；
//   - 三条线旧时期数据与旧锚点迁移；
//   - 本地/云端合并（只增不减）；
//   - 全线完成；
//   - 清除进度；
//   - 多人物线隔离。
//
// 运行：node tools/test-location-progress.js

// ---- 先装最小 wx 存储 mock，再 require progress.js ----
const store = {};
global.wx = {
  getStorageSync(k) { return store[k] === undefined ? '' : store[k]; },
  setStorageSync(k, v) { store[k] = v; },
  removeStorageSync(k) { delete store[k]; }
};

const path = require('path');
const progress = require(path.join(__dirname, '../miniprogram/utils/progress.js'));
const meta = require(path.join(__dirname, '../miniprogram/utils/stories/dufu-locations.js'));
const libaiMeta = require(path.join(__dirname, '../miniprogram/utils/stories/libai-locations.js'));
const sushiMeta = require(path.join(__dirname, '../miniprogram/utils/stories/sushi-locations.js'));

const LOCATIONS = meta.locations;                 // 已按 order 1–22 排好
const ORDER = LOCATIONS.map(l => l.id);
const KEY_IDS = meta.KEY_IDS;

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, a, b) {
  ok(name, JSON.stringify(a) === JSON.stringify(b), 'got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function reset() {
  Object.keys(store).forEach(k => delete store[k]);
}

// ============ A. 新用户初始状态 ============
console.log('--- A. 新用户初始状态 ---');
reset();
{
  const states = progress.computeLocationStates('dufu', ORDER);
  eq('A1 地点 1 为 active', states[ORDER[0]], 'active');
  eq('A2 其余地点均为 locked', ORDER.slice(1).every(id => states[id] === 'locked'), true);
  eq('A3 共 22 个地点', ORDER.length, 22);
  progress.setSelectedLine('libai');
  eq('A4 字符串型选中人物可正常读回', progress.getSelectedLine(), 'libai');
}

// ============ B. 逐地点完成与解锁 ============
console.log('--- B. 逐地点完成与解锁 ---');
reset();
{
  // 完成地点 1 → 地点 2 解锁
  const r1 = progress.completeLocation('dufu', ORDER[0], ORDER);
  eq('B1 完成地点 1 后 nextId 是地点 2', r1.nextId, ORDER[1]);
  eq('B2 地点 1 已 completed', progress.getLocationStates('dufu')[ORDER[0]], 'completed');
  eq('B3 地点 2 已 active', progress.getLocationStates('dufu')[ORDER[1]], 'active');
  // 派生状态（computeLocationStates）才会给未显式存的地点补 locked
  const derived1 = progress.computeLocationStates('dufu', ORDER);
  eq('B4 地点 3 仍 locked', derived1[ORDER[2]], 'locked');
  eq('B5 已完成 1 处', r1.completedCount, 1);
  eq('B6 未全线完成', r1.allDone, false);

  // 完成地点 2 → 地点 3 解锁
  const r2 = progress.completeLocation('dufu', ORDER[1], ORDER);
  eq('B7 完成地点 2 后 nextId 是地点 3', r2.nextId, ORDER[2]);
  eq('B8 已完成 2 处', r2.completedCount, 2);

  // computeLocationStates 与显式状态一致
  const states = progress.computeLocationStates('dufu', ORDER);
  eq('B9 派生状态：地点 1/2 completed，3 active，其余 locked',
    states[ORDER[0]] + ',' + states[ORDER[1]] + ',' + states[ORDER[2]] + ',' + states[ORDER[3]],
    'completed,completed,active,locked');
}

// ============ C. 关键地点颜色不影响状态 ============
console.log('--- C. 关键地点颜色不影响状态 ---');
reset();
{
  // 关键地点与非关键地点在状态机里一视同仁，只是渲染层颜色不同
  const states = progress.computeLocationStates('dufu', ORDER);
  KEY_IDS.forEach(id => {
    ok('C1 关键地点 ' + id + ' 初始状态合法', ['locked', 'active', 'completed'].includes(states[id]));
  });
  // 关键地点 locked 时不提前 active
  ok('C2 关键地点初始（非首）为 locked',
    KEY_IDS.filter(id => id !== ORDER[0]).every(id => states[id] === 'locked'));
}

// ============ D. 检查点保存/恢复 ============
console.log('--- D. 中途检查点保存/恢复 ---');
reset();
{
  ok('D1 初始无检查点', progress.getLocationCheckpoint('dufu', ORDER[0]) === null);
  progress.saveLocationCheckpoint('dufu', ORDER[0], 'n5');
  const ck = progress.getLocationCheckpoint('dufu', ORDER[0]);
  eq('D2 检查点 nodeId 正确', ck.nodeId, 'n5');
  ok('D3 检查点有 updatedAt', typeof ck.updatedAt === 'number' && ck.updatedAt > 0);
  // 更新检查点
  progress.saveLocationCheckpoint('dufu', ORDER[0], 'n9');
  eq('D4 检查点可更新', progress.getLocationCheckpoint('dufu', ORDER[0]).nodeId, 'n9');
  // 清除
  progress.clearLocationCheckpoint('dufu', ORDER[0]);
  ok('D5 检查点可清除', progress.getLocationCheckpoint('dufu', ORDER[0]) === null);
}

// ============ E. 重温不覆盖主线 ============
console.log('--- E. 重温不覆盖主线 ---');
reset();
{
  // 推进到地点 3
  progress.completeLocation('dufu', ORDER[0], ORDER);
  progress.completeLocation('dufu', ORDER[1], ORDER);
  // 重温已完成地点 2：completeLocation 幂等，不应把当前活动地点从 3 改回 2
  const r = progress.completeLocation('dufu', ORDER[1], ORDER);
  eq('E1 重温地点 2 不改变 completedCount', r.completedCount, 2);
  eq('E2 重温后当前活动地点仍是 3', progress.getLocationStates('dufu')[ORDER[2]], 'active');
  eq('E3 地点 2 仍 completed', progress.getLocationStates('dufu')[ORDER[1]], 'completed');
}

// ============ F. p1–p4 旧时期数据迁移 ============
console.log('--- F. 旧时期数据迁移 ---');
reset();
{
  // 模拟旧版扁平结构：p1 completed, p2 active
  wx.setStorageSync('questStates', { dufu: { p1: 'completed', p2: 'active' } });
  progress.migrateLocationProgress(LOCATIONS);
  const states = progress.getLocationStates('dufu');
  // p1（地点 1–7）→ 全 completed
  eq('F1 p1 对应地点 1–7 全 completed',
    ['luoyang', 'shuhu', 'wuyue', 'luoyang_shi', 'qizhao', 'taishan', 'shouang'].map(id => states[id]).join(','),
    'completed,completed,completed,completed,completed,completed,completed');
  // p2（地点 8–10）→ 地点 8 active，9/10 locked
  eq('F2 p2 首地点（长安）active', states['changan'], 'active');
  eq('F3 p2 后续地点 locked', states['yexian'] + ',' + states['fengxian'], 'locked,locked');
  // p3/p4 保持 locked
  eq('F4 p3 首地点 locked', states['changan_xian'], 'locked');

  // 幂等：再跑一次结果相同
  progress.migrateLocationProgress(LOCATIONS);
  const states2 = progress.getLocationStates('dufu');
  eq('F5 迁移幂等', JSON.stringify(states2), JSON.stringify(states));
  eq('F5a 数字型 schema 版本可正常读写', store.progressSchemaVersion, progress.PROGRESS_SCHEMA_VERSION);
}

// ============ F2. 李白/苏轼旧数据统一迁移 ============
console.log('--- F2. 李白/苏轼旧数据与旧锚点迁移 ---');
reset();
{
  const configs = [
    {
      lineId: 'libai', locations: libaiMeta.locations,
      anchorMap: {
        l10: 'lb9', l13: ['lb11', 'lb14'],
        lb8: 'lb11', lb9: 'lb8', lb10: 'lb9', lb11: 'lb10',
        lb18: 'lb20', lb19: 'lb18', lb20: 'lb19'
      }
    },
    {
      lineId: 'sushi', locations: sushiMeta.locations,
      anchorMap: { s3: 's2', s9: ['s7', 's8'] }
    }
  ];
  wx.setStorageSync('questStates', {
    libai: { p1: 'completed', p2: 'active' },
    sushi: { p1: 'completed', p2: 'active' }
  });
  wx.setStorageSync('collectedAnchors', {
    libai: { l10: true, l13: true, lb9: true, lb19: true },
    sushi: { s3: true, s9: true }
  });
  // 已经在地点模式完成的数据不能被旧时期状态降级。
  wx.setStorageSync('locationStates', { libai: { changan1: 'completed' } });

  progress.migrateLocationProgress(configs);
  const libaiStates = progress.getLocationStates('libai');
  const sushiStates = progress.getLocationStates('sushi');
  eq('F6 李白旧 p1 对应地点全部完成',
    libaiMeta.locations.filter(l => l.periodId === 'p1').every(l => libaiStates[l.id] === 'completed'), true);
  eq('F7 李白已有地点进度优先', libaiStates.changan1, 'completed');
  eq('F8 苏轼旧 p1 对应地点全部完成',
    sushiMeta.locations.filter(l => l.periodId === 'p1').every(l => sushiStates[l.id] === 'completed'), true);

  const libaiAnchors = progress.getAnchors('libai');
  eq('F9 李白旧锚点可迁到单个新锚点', libaiAnchors.lb9, true);
  eq('F10 李白旧组合锚点可展开', libaiAnchors.lb11 && libaiAnchors.lb14, true);
  eq('F11 李白旧 l* 锚点已清理', !!libaiAnchors.l10 || !!libaiAnchors.l13, false);
  eq('F11a 李白 v2 的 lb9 可迁到当前 lb8', libaiAnchors.lb8, true);
  eq('F11b 李白 v2 的 lb19 可迁到当前 lb18', libaiAnchors.lb18, true);

  const sushiAnchors = progress.getAnchors('sushi');
  eq('F12 苏轼同名空间按快照迁移，不串写',
    !!sushiAnchors.s2 && !!sushiAnchors.s7 && !!sushiAnchors.s8 && !sushiAnchors.s3 && !sushiAnchors.s9, true);
}

// ============ F3. 苏轼新地点数据不误当旧锚点重排 ============
console.log('--- F3. 苏轼新地点锚点保护 ---');
reset();
{
  wx.setStorageSync('questStates', { sushi: { p1: 'completed' } });
  wx.setStorageSync('locationStates', { sushi: { meishan: 'completed' } });
  wx.setStorageSync('collectedAnchors', { sushi: { s3: true } });
  progress.migrateLocationProgress([{
    lineId: 'sushi', locations: sushiMeta.locations, anchorMap: { s3: 's2' }
  }]);
  const anchors = progress.getAnchors('sushi');
  eq('F13 已开始新地点模式时保留新 s3', anchors.s3, true);
  eq('F14 已开始新地点模式时不误造 s2', !!anchors.s2, false);
}

// ============ G. 本地/云端合并（只增不减） ============
console.log('--- G. 本地/云端合并 ---');
reset();
{
  progress.completeLocation('dufu', ORDER[0], ORDER);
  // 云端快照：地点 1 更早完成、地点 2 也已 completed（本地没有）
  progress.mergeRemote({
    locationStates: { dufu: { [ORDER[0]]: 'completed', [ORDER[1]]: 'completed' } }
  });
  const states = progress.getLocationStates('dufu');
  eq('G1 合并后地点 1 completed', states[ORDER[0]], 'completed');
  eq('G2 合并后地点 2 completed（云端新进度合入）', states[ORDER[1]], 'completed');
  eq('G3 合并后地点 3 active（顺延）', progress.computeLocationStates('dufu', ORDER)[ORDER[2]], 'active');

  // 反向：云端旧数据不能把本地 completed 降级为 active
  progress.mergeRemote({ locationStates: { dufu: { [ORDER[0]]: 'active' } } });
  eq('G4 云端旧 active 不降级本地 completed', progress.getLocationStates('dufu')[ORDER[0]], 'completed');
}

// ============ H. 全线完成 ============
console.log('--- H. 全线完成 ---');
reset();
{
  let last = null;
  ORDER.forEach(id => { last = progress.completeLocation('dufu', id, ORDER); });
  eq('H1 完成 22 地点后 allDone', last.allDone, true);
  eq('H2 completedCount=22', last.completedCount, 22);
  eq('H3 完成末地点无 nextId', last.nextId, '');
  const states = progress.getLocationStates('dufu');
  eq('H4 全部 completed', ORDER.every(id => states[id] === 'completed'), true);
}

// ============ I. 清除进度 ============
console.log('--- I. 清除进度 ---');
reset();
{
  progress.completeLocation('dufu', ORDER[0], ORDER);
  progress.saveLocationCheckpoint('dufu', ORDER[0], 'n3');
  progress.saveLocationRecord('dufu', ORDER[0], { earnedAt: 1, completedAt: 1 });
  progress.setSelectedLine('dufu');
  ok('I1 清除前有地点进度', Object.keys(progress.getLocationStates('dufu')).length > 0);

  progress.resetAll();
  ok('I2 清除后地点状态为空', Object.keys(progress.getLocationStates('dufu')).length === 0);
  ok('I3 清除后检查点为空', progress.getLocationCheckpoint('dufu', ORDER[0]) === null);
  ok('I4 清除后地点记录为空', progress.getLocationRecord('dufu', ORDER[0]) === null);
  ok('I5 清除后选中人物清空', progress.getSelectedLine() === '');
  // 清除后重新派生：地点 1 恢复 active
  eq('I6 清除后地点 1 恢复 active', progress.computeLocationStates('dufu', ORDER)[ORDER[0]], 'active');
}

// ============ J. 多人物线隔离 ============
console.log('--- J. 多人物线隔离 ---');
reset();
{
  progress.completeLocation('dufu', ORDER[0], ORDER);
  // 李白线仍是时期模式，不应受杜甫地点状态影响
  progress.setState('libai', 'p1', 'completed');
  eq('J1 杜甫地点 1 completed', progress.getLocationStates('dufu')[ORDER[0]], 'completed');
  eq('J2 李白 p1 completed（时期模式独立）', progress.getStates('libai').p1, 'completed');
  // 杜甫的时期状态不受地点模式污染
  ok('J3 杜甫旧时期状态仍独立', typeof progress.getStates('dufu') === 'object');
}

// ============ K. 地点身份 / 信任 / 任务 ============
console.log('--- K. 地点身份 / 信任 / 任务 ---');
reset();
{
  const loc = ORDER[0];
  // 初始无档案
  ok('K1 初始无地点档案', progress.getLocationProfile('dufu', loc) === null);
  ok('K2 初始信任为 0', progress.getLocationTrust('dufu', loc) === 0);

  // 角色选择
  const chosen = progress.chooseLocationRole('dufu', loc, 'scholar');
  ok('K3 首次选择角色成功', !!chosen && chosen.roleId === 'scholar');
  ok('K4 选择带 chosenAt', typeof chosen.chosenAt === 'number' && chosen.chosenAt > 0);
  // 普通写入不得覆盖
  ok('K5 已选择后普通写入被拒绝', progress.chooseLocationRole('dufu', loc, 'traveler') === null);
  eq('K6 角色仍是 scholar', progress.getLocationProfile('dufu', loc).roleId, 'scholar');

  // 信任事件幂等
  progress.addTrustEvent('dufu', loc, 'ev_help', 5);
  progress.addTrustEvent('dufu', loc, 'ev_help', 3);   // 重复，应被忽略
  eq('K7 同一信任事件不重复加分', progress.getLocationTrust('dufu', loc), 5);
  progress.addTrustEvent('dufu', loc, 'ev_share', 2);
  eq('K8 不同事件累加', progress.getLocationTrust('dufu', loc), 7);
  // 非法 points 被拒绝
  progress.addTrustEvent('dufu', loc, 'ev_neg', -1);
  progress.addTrustEvent('dufu', loc, 'ev_float', 1.5);
  eq('K9 非法 points 不写入', progress.getLocationTrust('dufu', loc), 7);

  // 任务
  progress.startLocationTask('dufu', loc, 'task_climb');
  ok('K10 开启任务成功', progress.getLocationProfile('dufu', loc).tasks['task_climb'].status === 'active');
  progress.completeTaskStep('dufu', loc, 'task_climb', 's1');
  progress.completeTaskStep('dufu', loc, 'task_climb', 's1');   // 幂等
  progress.completeTaskStep('dufu', loc, 'task_climb', 's2');
  const task = progress.getLocationProfile('dufu', loc).tasks['task_climb'];
  eq('K11 步骤并集（s1/s2，去重）', Object.keys(task.steps).sort().join(','), 's1,s2');
  progress.completeLocationTask('dufu', loc, 'task_climb');
  eq('K12 任务完成', progress.getLocationProfile('dufu', loc).tasks['task_climb'].status, 'completed');
  // 未开启的任务不能直接完成
  ok('K13 未开启任务不能直接完成', progress.completeLocationTask('dufu', loc, 'task_none') === null);
}

// ============ L. 见证物 / 人物理解度 ============
console.log('--- L. 见证物 / 人物理解度 ---');
reset();
{
  ok('L1 见证物领取成功', progress.grantWitnessItem('dufu', 'wit_axe', 'taishan') === true);
  ok('L2 同一见证物不重复领取', progress.grantWitnessItem('dufu', 'wit_axe', 'taishan') === false);
  const snap = progress.snapshot();
  eq('L3 见证物记录来源地点', snap.witnessItems.dufu['wit_axe'].sourceLocationId, 'taishan');
  ok('L4 见证物带 acquiredAt', typeof snap.witnessItems.dufu['wit_axe'].acquiredAt === 'number');

  eq('L5 初始人物理解度为 0', progress.getLineInsight('dufu'), 0);
  ok('L6 理解事件写入成功', progress.addLineInsightEvent('dufu', 'ins_1', 10) === true);
  ok('L7 同一理解事件幂等', progress.addLineInsightEvent('dufu', 'ins_1', 10) === false);
  progress.addLineInsightEvent('dufu', 'ins_2', 5);
  eq('L8 理解度累加', progress.getLineInsight('dufu'), 15);
}

// ============ M. 新字段 reset 后为空 ============
console.log('--- M. 新字段 reset 后为空 ---');
reset();
{
  progress.chooseLocationRole('dufu', ORDER[0], 'scholar');
  progress.addTrustEvent('dufu', ORDER[0], 'ev', 5);
  progress.startLocationTask('dufu', ORDER[0], 'task');
  progress.grantWitnessItem('dufu', 'wit', 'taishan');
  progress.addLineInsightEvent('dufu', 'ins', 3);

  progress.resetAll();
  ok('M1 重置后地点档案为空', progress.getLocationProfile('dufu', ORDER[0]) === null);
  eq('M2 重置后信任为 0', progress.getLocationTrust('dufu', ORDER[0]), 0);
  eq('M3 重置后人物理解度为 0', progress.getLineInsight('dufu'), 0);
  const snap = progress.snapshot();
  ok('M4 重置后见证物为空', !snap.witnessItems.dufu);
  ok('M5 重置后快照新字段为空对象',
    JSON.stringify(snap.locationProfiles) === '{}'
    && JSON.stringify(snap.lineInsightEvents) === '{}'
    && JSON.stringify(snap.witnessItems) === '{}');
}

// ============ 汇总 ============
console.log('\n=====================================');
if (failures.length) {
  console.log('FAIL ' + failures.length + ' 项断言失败');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
