// tools/test-story-cloud.js —— story 云函数的存档行为测试（mock wx-server-sdk，本地可复现）
//
// 覆盖（docs/杜甫全程玩家角色-修改实施方案.md 步骤三）：
//   A. clearState 清空 playerProfiles（空快照包含 playerProfiles: {}）；
//   B. deleteAccount 删除整份用户档案，新增字段不会单独残留；
//   C. saveState：旧客户端快照缺 playerProfiles 时，服务端保留已存角色（不误删）；
//   D. saveState 返回合并后的权威快照，客户端可吸收；
//   E. 服务端空快照与前端 snapshot 字段一一对应（不丢 playerProfiles）。
//
// 运行：node tools/test-story-cloud.js

const path = require('path');
const Module = require('module');

// ---- mock wx-server-sdk ----
let docStore = {};          // openid -> { _id, progress, ... }
let mockOpenid = 'test-openid';

function makeCollection() {
  const chain = { _q: null, _n: 0 };
  return {
    where(q) { chain._q = q; return this; },
    limit(n) { chain._n = n; return this; },
    async get() {
      const openid = chain._q && chain._q.openid;
      const doc = openid && docStore[openid];
      chain._q = null;
      return { data: doc ? [doc] : [] };
    },
    doc(id) {
      return {
        async update({ data }) {
          const key = Object.keys(docStore).find(k => docStore[k]._id === id);
          if (key) Object.assign(docStore[key], data);
          return { stats: { updated: 1 } };
        }
      };
    },
    async add({ data }) {
      const id = 'id_' + Math.random().toString(36).slice(2);
      docStore[data.openid] = Object.assign({ _id: id }, data);
      return { _id: id };
    },
    async remove() {
      const openid = chain._q && chain._q.openid;
      let removed = 0;
      if (openid && docStore[openid]) { delete docStore[openid]; removed = 1; }
      chain._q = null;
      return { stats: { removed } };
    }
  };
}

const mockWxServerSdk = {
  DYNAMIC_CURRENT_ENV: 'test-env',
  init() {},
  database() { return { collection() { return makeCollection(); }, serverDate() { return { $serverDate: true }; } }; },
  getWXContext() { return { OPENID: mockOpenid }; },
  __setOpenid(o) { mockOpenid = o; },
  __resetStore() { docStore = {}; },
  __getStore() { return docStore; }
};

// 拦截 require('wx-server-sdk')
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'wx-server-sdk') return mockWxServerSdk;
  return originalLoad.apply(this, arguments);
};

const merge = require(path.join(__dirname, '../miniprogram/cloudfunctions/story/merge.js'));
const story = require(path.join(__dirname, '../miniprogram/cloudfunctions/story/index.js'));

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, a, b) {
  ok(name, JSON.stringify(a) === JSON.stringify(b), 'got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function reset() { mockWxServerSdk.__resetStore(); mockWxServerSdk.__setOpenid('test-openid'); }

const FULL_PROFILE = {
  version: 1, avatarId: 'avatar01', displayName: '寻迹者', confirmed: true, createdAt: 100, updatedAt: 200
};

(async () => {
  // ============ A. clearState 清空 playerProfiles ============
  console.log('--- A. clearState 清空 playerProfiles ---');
  reset();
  docStore['test-openid'] = { _id: 'doc1', openid: 'test-openid', progress: { playerProfiles: { dufu: FULL_PROFILE }, states: { dufu: { p1: 'completed' } } } };
  const rA = await story.main({ action: 'clearState' }, {});
  const afterA = docStore['test-openid'];
  ok('A1 clearState 返回 ok', rA.code === 0 && rA.data && rA.data.ok === true);
  ok('A2 云端 playerProfiles 已清空', afterA && afterA.progress && JSON.stringify(afterA.progress.playerProfiles) === '{}');
  ok('A3 云端其它进度一并清空', afterA && afterA.progress && JSON.stringify(afterA.progress.states) === '{}');

  // ============ B. deleteAccount 删除整份档案 ============
  console.log('--- B. deleteAccount 删除整份档案 ---');
  reset();
  docStore['test-openid'] = { _id: 'doc1', openid: 'test-openid', progress: { playerProfiles: { dufu: FULL_PROFILE } } };
  const rB = await story.main({ action: 'deleteAccount' }, {});
  ok('B1 deleteAccount 返回 ok', rB.code === 0 && rB.data && rB.data.ok === true);
  ok('B2 整份用户档案已删除（playerProfiles 无残留）', !docStore['test-openid']);

  // ============ C. saveState：旧客户端缺 playerProfiles 不删已存角色 ============
  console.log('--- C. 旧客户端缺 playerProfiles 不删已存角色 ---');
  reset();
  docStore['test-openid'] = { _id: 'doc1', openid: 'test-openid', progress: { playerProfiles: { dufu: FULL_PROFILE } } };
  // 旧客户端快照：只有 states，没有 playerProfiles 字段
  const rC = await story.main({ action: 'saveState', snapshot: { states: { dufu: { p2: 'active' } } } }, {});
  const afterC = docStore['test-openid'];
  ok('C1 saveState 返回 ok', rC.code === 0 && rC.data && rC.data.ok === true);
  ok('C2 已存 playerProfiles.dufu 保留', afterC.progress.playerProfiles.dufu && afterC.progress.playerProfiles.dufu.displayName === '寻迹者');
  eq('C3 旧客户端进度被合入', afterC.progress.states.dufu.p2, 'active');

  // ============ D. saveState 返回权威快照 ============
  console.log('--- D. saveState 返回权威快照 ---');
  reset();
  // 服务端已有一条 confirmed 角色
  docStore['test-openid'] = { _id: 'doc1', openid: 'test-openid', progress: { playerProfiles: { dufu: FULL_PROFILE } } };
  // 客户端上传一条 updatedAt 更晚的 confirmed 角色
  const newerProfile = { version: 1, avatarId: 'avatar03', displayName: '小杜', confirmed: true, createdAt: 50, updatedAt: 300 };
  const rD = await story.main({ action: 'saveState', snapshot: { playerProfiles: { dufu: newerProfile } } }, {});
  ok('D1 返回权威快照', rD.data && rD.data.snapshot && rD.data.snapshot.playerProfiles);
  eq('D2 权威快照采用较新角色', rD.data.snapshot.playerProfiles.dufu.displayName, '小杜');
  eq('D3 权威快照 createdAt 取最早', rD.data.snapshot.playerProfiles.dufu.createdAt, 50);

  // ============ E. 空快照字段与 snapshot 字段对应 ============
  console.log('--- E. 空快照字段完整 ---');
  {
    const empty = merge.emptySnapshot();
    const expectedKeys = ['states', 'anchors', 'records', 'locationStates', 'locationCheckpoints', 'locationRecords', 'locationProfiles', 'lineInsightEvents', 'witnessItems', 'playerProfiles'];
    eq('E1 空快照包含 playerProfiles', empty.playerProfiles, {});
    ok('E2 空快照字段与 mergeSnapshot 输出对齐',
      expectedKeys.every(k => k in empty && k in merge.mergeSnapshot(empty, {})));
  }

  console.log('\n=====================================');
  if (failures.length) {
    console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
    failures.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
  }
  console.log('ALL PASS  ' + pass + ' 项断言全部通过');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
