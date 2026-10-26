// tools/test-sync.js —— 进度云同步的合并规则测试（本地可复现，无需云环境）
//
// 重点验证两件事：
//   1. 合并是【只增不减】的 —— 任何"空数据/旧数据"都不能把已有进度抹掉
//   2. 前端 mergeRemote 与云端 merge.js **规则一致** —— 两端跑偏会导致反复拉推后进度抖动
//
// 运行：node tools/test-sync.js

// ---- 先装一个最小的 wx 存储 mock，再 require progress.js ----
const store = {};
global.wx = {
  getStorageSync(k) { return store[k] === undefined ? '' : store[k]; },
  setStorageSync(k, v) { store[k] = v; },
  removeStorageSync(k) { delete store[k]; }
};

const path = require('path');
const progress = require(path.join(__dirname, '../miniprogram/utils/progress.js'));
const serverMerge = require(path.join(__dirname, '../miniprogram/cloudfunctions/story/merge.js'));

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

// ============ A. 进度状态合并 ============
console.log('--- A. 进度状态合并（取较优） ---');
reset();
progress.setState('dufu', 'p1', 'completed');
progress.mergeRemote({ states: { dufu: { p1: 'active', p2: 'active' } } });
eq('A1 remote 的 active 不会把本地 completed 降级',
  progress.getStates('dufu').p1, 'completed');
eq('A2 remote 新增的 p2 被合并进来',
  progress.getStates('dufu').p2, 'active');

reset();
progress.setState('dufu', 'p1', 'active');
progress.mergeRemote({ states: { dufu: { p1: 'completed' } } });
eq('A3 remote 的 completed 会升级本地 active',
  progress.getStates('dufu').p1, 'completed');

reset();
progress.setState('libai', 'p1', 'completed');
progress.mergeRemote({ states: { dufu: { p1: 'completed' } } });
eq('A4 主线之间互不干扰', progress.getStates('libai').p1, 'completed');
ok('A5 另一条线被正确合入', progress.getStates('dufu').p1 === 'completed');

// ============ B. 锚点并集 ============
console.log('--- B. 锚点合并（并集） ---');
reset();
progress.addAnchor('dufu', 'a1');
progress.mergeRemote({ anchors: { dufu: { a2: true, a3: true }, libai: { l1: true } } });
const an = progress.getAnchors('dufu');
ok('B1 本地已有锚点保留', an.a1 === true);
ok('B2 云端锚点合入', an.a2 === true && an.a3 === true);
ok('B3 多主线锚点一并合入', progress.getAnchors('libai').l1 === true);

// ============ C. 探究档案按 completedAt 取较新 ============
console.log('--- C. 探究档案（取较新） ---');
reset();
progress.saveRecord('dufu', 'p1', { completedAt: 1000, poem: '本地旧' });
progress.mergeRemote({ records: { dufu: { p1: { completedAt: 2000, poem: '云端新' } } } });
eq('C1 云端较新则采用云端', progress.getRecord('dufu', 'p1').poem, '云端新');

reset();
progress.saveRecord('dufu', 'p1', { completedAt: 3000, poem: '本地新' });
progress.mergeRemote({ records: { dufu: { p1: { completedAt: 2000, poem: '云端旧' } } } });
eq('C2 本地较新则保留本地', progress.getRecord('dufu', 'p1').poem, '本地新');

reset();
progress.mergeRemote({ records: { libai: { p2: { completedAt: 500, poem: '新增' } } } });
eq('C3 本地没有则直接采用云端', progress.getRecord('libai', 'p2').poem, '新增');

reset();
progress.saveRecord('dufu', 'p1', { earnedAt: 1000, completedAt: 3000, poem: '本地旧结果' });
progress.mergeRemote({ records: { dufu: { p1: { earnedAt: 2000, completedAt: 4000, poem: '云端新结果' } } } });
eq('C4 采用较新结果时仍保留最早获得时间', progress.getRecord('dufu', 'p1').earnedAt, 1000);

// ============ D. 只增不减（核心安全性质） ============
console.log('--- D. 只增不减 ---');
reset();
progress.setState('dufu', 'p1', 'completed');
progress.addAnchor('dufu', 'a1');
progress.saveRecord('dufu', 'p1', { completedAt: 1000, poem: 'x' });
// 注意：只比较三层数据，不比 updatedAt（snapshot 每次都带新时间戳，那是设计如此）
const pick = () => {
  const s = progress.snapshot();
  return JSON.stringify({ states: s.states, anchors: s.anchors, records: s.records });
};
const before = pick();
progress.mergeRemote({});                                  // 空对象
progress.mergeRemote(null);                                // null
progress.mergeRemote({ states: {}, anchors: {}, records: {} });  // 空快照
progress.mergeRemote(undefined);                           // undefined
eq('D1 各种空/异常输入都不会改动本地', pick(), before);
eq('D2 返回值：无变更时为 false', progress.mergeRemote({}), false);

// 脏数据不应污染
reset();
progress.mergeRemote({ states: { dufu: { p1: 'bogus_status' } } });
ok('D3 非法状态值不会写入', progress.getStates('dufu').p1 === undefined);
progress.mergeRemote({ states: { dufu: null } });
ok('D4 非法主线值不会崩', true);

// ============ E. 旧数据迁移 ============
console.log('--- E. 旧扁平数据迁移 ---');
reset();
store['questStates'] = { p1: 'completed', p2: 'active' };   // 旧版扁平结构
const changed = progress.mergeRemote({ states: { libai: { p1: 'completed' } } });
eq('E1 旧扁平数据被迁到 dufu 线', progress.getStates('dufu').p1, 'completed');
eq('E2 迁移后不与李白线串号', progress.getStates('libai').p2, undefined);
eq('E3 返回 true 表示发生了变更', changed, true);

// ============ F. 变更订阅 ============
console.log('--- F. 变更订阅 ---');
reset();
let fired = 0;
const off = progress.onChange(() => { fired++; });
progress.addAnchor('dufu', 'a1');
ok('F1 写入触发订阅回调', fired > 0, 'fired=' + fired);

// 回调抛错不得影响写入
const off2 = progress.onChange(() => { throw new Error('订阅者故意抛错'); });
const f0 = fired;
progress.addAnchor('dufu', 'a2');
ok('F2 订阅者抛错不影响本地写入', progress.getAnchors('dufu').a2 === true);
ok('F3 抛错的订阅者不影响其他订阅者', fired > f0);
off(); off2();

// ============ G. snapshot 结构 ============
console.log('--- G. snapshot 结构 ---');
reset();
progress.completePeriod('dufu', 'p1', ['p1', 'p2', 'p3', 'p4']);
const snap = progress.snapshot();
ok('G1 snapshot 含 states/anchors/records/updatedAt',
  snap.states && snap.anchors && snap.records && typeof snap.updatedAt === 'number');
eq('G2 通关后下一期被激活', progress.getStates('dufu').p2, 'active');

// ============ H. 前后端合并规则一致性 ============
console.log('--- H. 前后端规则一致性 ---');
const cases = [
  { name: '状态升级', base: { states: { dufu: { p1: 'active' } } }, inc: { states: { dufu: { p1: 'completed', p2: 'active' } } } },
  { name: '状态不降级', base: { states: { dufu: { p1: 'completed' } } }, inc: { states: { dufu: { p1: 'active' } } } },
  { name: '锚点并集', base: { anchors: { dufu: { a1: true } } }, inc: { anchors: { dufu: { a2: true }, libai: { l1: true } } } },
  { name: '档案取新', base: { records: { dufu: { p1: { completedAt: 10 } } } }, inc: { records: { dufu: { p1: { completedAt: 20 } } } } },
  { name: '档案保旧', base: { records: { dufu: { p1: { completedAt: 30 } } } }, inc: { records: { dufu: { p1: { completedAt: 20 } } } } },
  { name: '空输入', base: null, inc: { states: {}, anchors: {}, records: {} } },
  { name: '多主线混合', base: { states: { dufu: { p2: 'active' } }, anchors: { dufu: { a5: true } } },
    inc: { states: { libai: { p3: 'completed' } }, anchors: { libai: { l9: true } } } }
];

cases.forEach((c) => {
  // 服务端实现
  const srv = serverMerge.mergeSnapshot(c.base, c.inc);
  // 客户端实现：重置本地为 base，再把 inc 当作 remote 合并进来
  reset();
  if (c.base) {
    if (c.base.states) Object.keys(c.base.states).forEach(l => Object.keys(c.base.states[l]).forEach(p => progress.setState(l, p, c.base.states[l][p])));
    if (c.base.anchors) Object.keys(c.base.anchors).forEach(l => Object.keys(c.base.anchors[l]).forEach(a => progress.addAnchor(l, a)));
    if (c.base.records) Object.keys(c.base.records).forEach(l => Object.keys(c.base.records[l]).forEach(p => progress.saveRecord(l, p, c.base.records[l][p])));
  }
  progress.mergeRemote(c.inc);
  const cli = {
    states: progress.snapshot().states,
    anchors: progress.snapshot().anchors,
    records: progress.snapshot().records
  };
  // 归一化：去掉空对象并排序键，便于比较
  const norm = (o) => {
    const out = {};
    Object.keys(o || {}).sort().forEach((k) => {
      const v = o[k];
      if (v && typeof v === 'object' && Object.keys(v).length) {
        out[k] = {};
        Object.keys(v).sort().forEach(k2 => { out[k][k2] = v[k2]; });
      }
    });
    return out;
  };
  const a = JSON.stringify({ s: norm(srv.states), an: norm(srv.anchors), r: norm(srv.records) });
  const b = JSON.stringify({ s: norm(cli.states), an: norm(cli.anchors), r: norm(cli.records) });
  ok('H-' + c.name + ' 前后端合并结果一致', a === b, '\n      server=' + a + '\n      client=' + b);
});

// ============ I. resetAll ============
console.log('--- I. 重新开始 ---');
reset();
progress.setState('dufu', 'p1', 'completed');
progress.addAnchor('dufu', 'a1');
progress.saveRecord('dufu', 'p1', { completedAt: 1 });
progress.resetAll();
eq('I1 进度已清空', progress.getStates('dufu').p1, undefined);
eq('I2 锚点已清空', progress.getAnchors('dufu').a1, undefined);
eq('I3 档案已清空', progress.getRecord('dufu', 'p1'), null);
eq('I4 清空后 snapshot 为空', JSON.stringify(progress.snapshot().states), '{}');

// ============ J. 新字段合并（信任/任务/见证物/理解度/角色） ============
console.log('--- J. 新字段合并 ---');
reset();
{
  // J1 信任事件：本地与云端不同 eventId 取并集
  progress.chooseLocationRole('dufu', 'taishan', 'scholar');
  progress.addTrustEvent('dufu', 'taishan', 'ev_a', 5);
  progress.mergeRemote({ locationProfiles: { dufu: { taishan: { trustEvents: { ev_b: 3 }, updatedAt: 2 } } } });
  eq('J1 两设备不同信任事件合并', progress.getLocationTrust('dufu', 'taishan'), 8);

  // J2 同 eventId 取较大 points
  progress.mergeRemote({ locationProfiles: { dufu: { taishan: { trustEvents: { ev_a: 10, ev_c: 1 }, updatedAt: 3 } } } });
  eq('J2 同事件取较大 points', progress.getLocationTrust('dufu', 'taishan'), 14);

  // J3 任务步骤合并
  progress.startLocationTask('dufu', 'taishan', 'task');
  progress.completeTaskStep('dufu', 'taishan', 'task', 's1');
  progress.mergeRemote({ locationProfiles: { dufu: { taishan: { tasks: { task: { status: 'active', steps: { s2: true } } }, updatedAt: 4 } } } });
  const steps = progress.getLocationProfile('dufu', 'taishan').tasks['task'].steps;
  eq('J3 任务步骤取并集', Object.keys(steps).sort().join(','), 's1,s2');

  // J4 completed 高于 active
  progress.mergeRemote({ locationProfiles: { dufu: { taishan: { tasks: { task: { status: 'completed', steps: {} } }, updatedAt: 5 } } } });
  eq('J4 completed 高于 active', progress.getLocationProfile('dufu', 'taishan').tasks['task'].status, 'completed');

  // J5 见证物不重复（合并后仍只有一份，且保留更早 acquiredAt）
  progress.grantWitnessItem('dufu', 'wit', 'taishan');
  const witBefore = progress.snapshot().witnessItems.dufu.wit.acquiredAt;
  progress.mergeRemote({ witnessItems: { dufu: { wit: { sourceLocationId: 'taishan', acquiredAt: witBefore + 9999 } } } });
  const witAfter = progress.snapshot().witnessItems.dufu.wit;
  eq('J5 见证物合并后仍一份且保留更早 acquiredAt', witAfter.acquiredAt, witBefore);

  // J6 理解度事件取并集 + 同 eventId 取较大
  progress.addLineInsightEvent('dufu', 'ins_a', 4);
  progress.mergeRemote({ lineInsightEvents: { dufu: { ins_b: 6, ins_a: 2 } } });
  eq('J6 理解度并集+取较大', progress.getLineInsight('dufu'), 10);

  // J7 角色冲突保留更早 chosenAt
  const firstChosen = progress.getLocationProfile('dufu', 'taishan').chosenAt;
  progress.mergeRemote({ locationProfiles: { dufu: { taishan: { roleId: 'traveler', chosenAt: firstChosen - 100, updatedAt: 99 } } } });
  eq('J7 角色冲突保留更早 chosenAt（traveler）', progress.getLocationProfile('dufu', 'taishan').roleId, 'traveler');
}

// ============ K. 新字段前后端合并一致性 ============
console.log('--- K. 新字段前后端合并一致性 ---');

// 归一化比较：递归排序键 + 把 updatedAt/acquiredAt 替换为占位（这两者由测试
// 重建路径的 Date.now() 打点，与合并规则无关，比较时应剥离，只比语义字段）。
// 注意 chosenAt 是角色冲突的语义 tiebreaker，必须保留比较。
function normForCompare(v) {
  if (Array.isArray(v)) return v.map(normForCompare);
  if (v && typeof v === 'object') {
    const out = {};
    Object.keys(v).sort().forEach((k) => {
      if (k === 'updatedAt' || k === 'acquiredAt') { out[k] = '<ts>'; return; }
      out[k] = normForCompare(v[k]);
    });
    return out;
  }
  return v;
}
function snapStr(o) { return JSON.stringify(normForCompare(o)); }

{
  const newCases = [
    { name: '信任取较大', base: { locationProfiles: { dufu: { taishan: { roleId: 'scholar', chosenAt: 100, trustEvents: { ev_a: 5 }, updatedAt: 1 } } } },
      inc: { locationProfiles: { dufu: { taishan: { roleId: 'scholar', chosenAt: 100, trustEvents: { ev_a: 8, ev_b: 3 }, updatedAt: 2 } } } } },
    { name: '角色冲突取更早', base: { locationProfiles: { dufu: { taishan: { roleId: 'scholar', chosenAt: 100, updatedAt: 1 } } } },
      inc: { locationProfiles: { dufu: { taishan: { roleId: 'traveler', chosenAt: 50, updatedAt: 2 } } } } },
    { name: '任务步骤并集', base: { locationProfiles: { dufu: { taishan: { tasks: { t: { status: 'active', steps: { s1: true } } }, updatedAt: 1 } } } },
      inc: { locationProfiles: { dufu: { taishan: { tasks: { t: { status: 'active', steps: { s2: true } } }, updatedAt: 2 } } } } },
    { name: '任务状态取较优', base: { locationProfiles: { dufu: { taishan: { tasks: { t: { status: 'active', steps: {} } }, updatedAt: 1 } } } },
      inc: { locationProfiles: { dufu: { taishan: { tasks: { t: { status: 'completed', steps: {} } }, updatedAt: 2 } } } } },
    { name: '见证物并集+取早', base: { witnessItems: { dufu: { wit: { sourceLocationId: 'taishan', acquiredAt: 100 } } } },
      inc: { witnessItems: { dufu: { wit: { sourceLocationId: 'taishan', acquiredAt: 200 }, wit2: { sourceLocationId: 'changan', acquiredAt: 300 } } } } },
    { name: '理解度并集+取较大', base: { lineInsightEvents: { dufu: { ins_a: 4 } } },
      inc: { lineInsightEvents: { dufu: { ins_a: 2, ins_b: 6 } } } },
    { name: '角色档案取新(保留最早createdAt)', base: { playerProfiles: { dufu: { version: 1, avatarId: 'avatar01', displayName: '寻迹者', confirmed: true, createdAt: 100, updatedAt: 200 } } },
      inc: { playerProfiles: { dufu: { version: 1, avatarId: 'avatar02', displayName: '小杜', confirmed: true, createdAt: 50, updatedAt: 300 } } } },
    { name: '角色档案已确认优先', base: { playerProfiles: { dufu: { version: 1, avatarId: 'avatar01', displayName: '寻迹者', confirmed: true, createdAt: 100, updatedAt: 200 } } },
      inc: { playerProfiles: { dufu: { version: 1, avatarId: 'avatar03', displayName: '旧档', confirmed: false, createdAt: 10, updatedAt: 999 } } } }
  ];

  newCases.forEach((c) => {
    const srv = serverMerge.mergeSnapshot(c.base, c.inc);
    // 客户端：把 base 直接种进本地存储（保持 timestamps 与合并规则无关），再 mergeRemote(inc)
    reset();
    if (c.base) {
      if (c.base.locationProfiles) wx.setStorageSync(progress.KEYS.KEY_LOCATION_PROFILES, JSON.parse(JSON.stringify(c.base.locationProfiles)));
      if (c.base.witnessItems) wx.setStorageSync(progress.KEYS.KEY_WITNESS_ITEMS, JSON.parse(JSON.stringify(c.base.witnessItems)));
      if (c.base.lineInsightEvents) wx.setStorageSync(progress.KEYS.KEY_LINE_INSIGHT_EVENTS, JSON.parse(JSON.stringify(c.base.lineInsightEvents)));
      if (c.base.playerProfiles) wx.setStorageSync(progress.KEYS.KEY_PLAYER_PROFILES, JSON.parse(JSON.stringify(c.base.playerProfiles)));
    }
    progress.mergeRemote(c.inc);
    const cli = progress.snapshot();
    const a = snapStr({ p: srv.locationProfiles, w: srv.witnessItems, i: srv.lineInsightEvents, pp: srv.playerProfiles });
    const b = snapStr({ p: cli.locationProfiles, w: cli.witnessItems, i: cli.lineInsightEvents, pp: cli.playerProfiles });
    ok('K-' + c.name + ' 新字段前后端合并一致', a === b, '\n      server=' + a + '\n      client=' + b);
  });

  // 交换性 + 幂等性：merge(A,B) 与 merge(B,A) 语义等价；merge(A,merge(A,B)) === merge(A,B)
  const A = { locationProfiles: { dufu: { taishan: { roleId: 'scholar', chosenAt: 100, trustEvents: { ev_a: 5, ev_x: 1 }, tasks: { t: { status: 'active', steps: { s1: true } } }, updatedAt: 1 } } }, witnessItems: { dufu: { w1: { sourceLocationId: 'taishan', acquiredAt: 10 } } }, lineInsightEvents: { dufu: { i1: 2 } } };
  const B = { locationProfiles: { dufu: { taishan: { roleId: 'traveler', chosenAt: 50, trustEvents: { ev_b: 3, ev_x: 9 }, tasks: { t: { status: 'completed', steps: { s2: true } } }, updatedAt: 2 } } }, witnessItems: { dufu: { w1: { sourceLocationId: 'taishan', acquiredAt: 20 }, w2: { sourceLocationId: 'changan', acquiredAt: 30 } } }, lineInsightEvents: { dufu: { i1: 5, i2: 7 } } };
  const ab = serverMerge.mergeSnapshot(A, B);
  const ba = serverMerge.mergeSnapshot(B, A);
  ok('K-交换性 merge(A,B)≈merge(B,A)', snapStr(ab) === snapStr(ba), '\nAB=' + snapStr(ab) + '\nBA=' + snapStr(ba));
  const aab = serverMerge.mergeSnapshot(A, serverMerge.mergeSnapshot(A, B));
  ok('K-幂等性 merge(A,merge(A,B))≈merge(A,B)', snapStr(aab) === snapStr(ab));
}

// ============ L. 三条线角色档案合并与人物线白名单 ============
console.log('--- L. 三线角色合并与白名单 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar01', '小杜');
  progress.savePlayerProfile('libai', 'avatar02', '小白');
  progress.savePlayerProfile('sushi', 'avatar03', '小苏');

  // 三条线档案按线独立保存
  eq('L1 三线档案按线分组', Object.keys(progress.snapshot().playerProfiles || {}).sort().join(','), 'dufu,libai,sushi');
  eq('L2 杜甫姓名独立', progress.getPlayerProfile('dufu').displayName, '小杜');
  eq('L3 李白姓名独立', progress.getPlayerProfile('libai').displayName, '小白');
  eq('L4 苏轼姓名独立', progress.getPlayerProfile('sushi').displayName, '小苏');

  // 未知人物线（伪造 lineId）云端不落库
  reset();
  progress.savePlayerProfile('dufu', 'avatar01', '小杜');
  progress.mergeRemote({
    playerProfiles: {
      baijuyi: { version: 1, avatarId: 'avatar01', displayName: '假诗人', confirmed: true, createdAt: 1, updatedAt: 200 }
    }
  });
  ok('L5 伪造 lineId 不落库', progress.getPlayerProfile('baijuyi') === null);
  eq('L6 snapshot 只保留合法线', Object.keys(progress.snapshot().playerProfiles || {}).join(','), 'dufu');

  // 服务端合并：三条线合并 + 忽略未知 lineId
  const srv = serverMerge.mergeSnapshot(
    { playerProfiles: { dufu: { version: 1, avatarId: 'avatar01', displayName: '小杜', confirmed: true, createdAt: 10, updatedAt: 20 } } },
    { playerProfiles: { libai: { version: 1, avatarId: 'avatar02', displayName: '小白', confirmed: true, createdAt: 5, updatedAt: 30 }, baijuyi: { version: 1, avatarId: 'avatar01', displayName: '假', confirmed: true, createdAt: 1, updatedAt: 2 } } }
  );
  eq('L7 服务端合并保留两线并忽略伪造线', Object.keys(srv.playerProfiles || {}).sort().join(','), 'dufu,libai');
  ok('L8 服务端伪造 lineId 不落库', !(srv.playerProfiles && srv.playerProfiles.baijuyi));

  // 前端 mergeRemote 与服务端 mergeSnapshot 三条线合并结果一致（含 createdAt/updatedAt）
  const a = { playerProfiles: { dufu: { version: 1, avatarId: 'avatar01', displayName: '小杜', confirmed: true, createdAt: 10, updatedAt: 20 }, libai: { version: 1, avatarId: 'avatar02', displayName: '小白', confirmed: true, createdAt: 5, updatedAt: 30 } } };
  const b = { playerProfiles: { sushi: { version: 1, avatarId: 'avatar03', displayName: '小苏', confirmed: true, createdAt: 7, updatedAt: 40 }, libai: { version: 1, avatarId: 'avatar01', displayName: '太白', confirmed: true, createdAt: 5, updatedAt: 60 } } };
  const srvAB = serverMerge.mergeSnapshot(a, b).playerProfiles;
  reset();
  wx.setStorageSync(progress.KEYS.KEY_PLAYER_PROFILES, JSON.parse(JSON.stringify(a.playerProfiles)));
  progress.mergeRemote(b);
  const cliAB = progress.snapshot().playerProfiles;
  const normalize = (o) => {
    const out = {};
    Object.keys(o || {}).sort().forEach((lineId) => {
      const p = o[lineId];
      out[lineId] = [p.avatarId, p.displayName, p.confirmed, p.createdAt, p.updatedAt];
    });
    return out;
  };
  eq('L9 三线合并前后端结果一致', JSON.stringify(normalize(srvAB)), JSON.stringify(normalize(cliAB)));
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
