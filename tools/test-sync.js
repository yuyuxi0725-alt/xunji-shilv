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

// ============ 汇总 ============
console.log('\n=====================================');
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
