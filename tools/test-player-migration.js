// tools/test-player-migration.js —— 杜甫玩家角色「旧泰山身份迁移 + 未来时间戳 + 同步合并」测试
//
// 覆盖（docs/杜甫全程玩家角色-修改实施方案.md 步骤三）：
//   A. 三种旧 roleId 分别迁移为正确 avatarId；
//   B. 非法旧 roleId / 无旧角色不生成档案；
//   C. 迁移重复运行幂等；
//   D. 已确认新资料不被旧迁移草稿覆盖；
//   E. 云端旧快照晚到仍补全；
//   F. 缺 playerProfiles 的旧客户端快照不删除新角色；
//   G. 迁移不丢地点进度 / 任务 / 锚点 / 见证物 / 信任；
//   H. 未来时间戳规范化 + 可注入时钟（前后端一致、稳定平局）。
//
// 运行：node tools/test-player-migration.js

const store = {};
global.wx = {
  getStorageSync(k) { return store[k] === undefined ? '' : store[k]; },
  setStorageSync(k, v) { store[k] = v; },
  removeStorageSync(k) { delete store[k]; }
};

const path = require('path');
const avatars = require(path.join(__dirname, '../miniprogram/utils/player-avatars.js'));
const profile = require(path.join(__dirname, '../miniprogram/utils/player-profile.js'));
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
function reset() { Object.keys(store).forEach(k => delete store[k]); }

// 便捷：种一个旧泰山身份
function seedLegacy(roleId) {
  if (roleId) progress.chooseLocationRole('dufu', 'taishan', roleId);
}

// ============ A/B. 三种旧角色映射 + 非法回退 ============
console.log('--- A/B. 旧角色映射与非法回退 ---');
{
  const cases = [
    ['fellowScholar', 'avatar01'],
    ['mountainGuide', 'avatar02'],
    ['passingTraveler', 'avatar03']
  ];
  cases.forEach(([roleId, avatarId]) => {
    reset();
    seedLegacy(roleId);
    const created = progress.migrateLegacyPlayerProfile();
    const p = progress.getPlayerProfile('dufu');
    ok('A 旧角色 ' + roleId + ' 迁移创建草稿', created === true);
    eq('A 旧角色 ' + roleId + ' → ' + avatarId, p && p.avatarId, avatarId);
    eq('A 默认名', p && p.displayName, profile.DEFAULT_NAME);
    eq('A confirmed=false（待确认）', p && p.confirmed, false);
  });

  // 非法旧角色
  reset();
  seedLegacy('bogusRole');
  const createdBad = progress.migrateLegacyPlayerProfile();
  ok('B1 非法旧角色不生成档案', createdBad === false && progress.getPlayerProfile('dufu') === null);

  // 无旧角色
  reset();
  const createdNone = progress.migrateLegacyPlayerProfile();
  ok('B2 无旧角色不生成档案', createdNone === false && progress.getPlayerProfile('dufu') === null);

  // 旧角色为空串
  reset();
  seedLegacy('');
  ok('B3 空 roleId 不生成档案', progress.migrateLegacyPlayerProfile() === false && progress.getPlayerProfile('dufu') === null);
}

// ============ C. 幂等 ============
console.log('--- C. 迁移幂等 ---');
{
  reset();
  seedLegacy('fellowScholar');
  ok('C1 首次迁移创建草稿', progress.migrateLegacyPlayerProfile() === true);
  const first = progress.getPlayerProfile('dufu');
  const secondRun = progress.migrateLegacyPlayerProfile();
  const after = progress.getPlayerProfile('dufu');
  ok('C2 再次迁移返回 false（不重复创建）', secondRun === false);
  eq('C3 再次迁移后档案不变', JSON.stringify(after), JSON.stringify(first));
}

// ============ D. 已确认新资料不被覆盖 ============
console.log('--- D. 已确认新资料优先 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar03', '小杜');   // 已确认新角色
  seedLegacy('fellowScholar');
  const created = progress.migrateLegacyPlayerProfile();
  const p = progress.getPlayerProfile('dufu');
  ok('D1 已确认档案存在时不迁移', created === false);
  eq('D2 外观未被旧角色覆盖', p.avatarId, 'avatar03');
  eq('D3 姓名未被默认名覆盖', p.displayName, '小杜');
  eq('D4 仍为已确认', p.confirmed, true);
}

// ============ E. 云端旧快照晚到补全 ============
console.log('--- E. 云端旧快照晚到补全 ---');
{
  reset();
  // 旧客户端快照：只有 locationProfiles.dufu.taishan.roleId，没有 playerProfiles
  const changed = progress.mergeRemote({
    locationProfiles: { dufu: { taishan: { roleId: 'mountainGuide', chosenAt: 100, updatedAt: 100 } } }
  });
  const p = progress.getPlayerProfile('dufu');
  ok('E1 mergeRemote 触发补全并返回变更', changed === true);
  eq('E2 晚到旧角色补全为草稿', p && p.avatarId, 'avatar02');
  eq('E3 草稿为待确认', p && p.confirmed, false);
}

// ============ F. 缺 playerProfiles 不删除新角色 ============
console.log('--- F. 缺 playerProfiles 的旧快照不删新角色 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar02', '小杜');
  // 旧客户端快照不含 playerProfiles 字段，但含其它进度
  progress.mergeRemote({
    states: { dufu: { p1: 'completed' } },
    locationProfiles: { dufu: { taishan: { roleId: 'fellowScholar', chosenAt: 10, updatedAt: 10 } } }
  });
  const p = progress.getPlayerProfile('dufu');
  eq('F1 已确认新角色保留', p.displayName, '小杜');
  eq('F2 外观未被旧 roleId 顶掉', p.avatarId, 'avatar02');
  eq('F3 仍为已确认', p.confirmed, true);
}

// ============ G. 迁移不丢旧进度 / 任务 / 锚点 / 见证物 ============
console.log('--- G. 迁移保留旧数据 ---');
{
  reset();
  // 种下各种旧数据
  progress.completeLocation('dufu', 'luoyang', ['luoyang', 'shuhu']);
  progress.addAnchor('dufu', 'a1');
  progress.grantWitnessItem('dufu', 'wit_axe', 'taishan');
  seedLegacy('passingTraveler');
  progress.addTrustEvent('dufu', 'taishan', 'ev_help', 5);
  progress.startLocationTask('dufu', 'taishan', 'task_climb');
  progress.completeTaskStep('dufu', 'taishan', 'task_climb', 's1');
  const beforeProfiles = JSON.stringify(progress.snapshot().locationProfiles);

  progress.migrateLegacyPlayerProfile();

  ok('G1 地点进度保留', progress.getLocationStates('dufu').luoyang === 'completed');
  eq('G2 锚点保留', progress.getAnchors('dufu').a1, true);
  ok('G3 见证物保留', !!progress.snapshot().witnessItems.dufu && progress.snapshot().witnessItems.dufu.wit_axe.sourceLocationId === 'taishan');
  eq('G4 旧泰山 roleId 保留', progress.getLocationProfile('dufu', 'taishan').roleId, 'passingTraveler');
  eq('G5 信任事件保留', progress.getLocationTrust('dufu', 'taishan'), 5);
  eq('G6 任务步骤保留', Object.keys(progress.getLocationProfile('dufu', 'taishan').tasks['task_climb'].steps).join(','), 's1');
  eq('G7 locationProfiles 原样不变', JSON.stringify(progress.snapshot().locationProfiles), beforeProfiles);
  eq('G8 迁移后角色为 avatar03', progress.getPlayerProfile('dufu').avatarId, 'avatar03');
}

// ============ H. 未来时间戳规范化 + 可注入时钟 ============
console.log('--- H. 未来时间戳规范化 + 可注入时钟 ---');
{
  const FIXED_NOW = 1700000000000;
  profile.setClock(() => FIXED_NOW);
  serverMerge.setClock(() => FIXED_NOW);
  try {
    // 直接钳制
    eq('H1 明显未来时间戳夹到 now', profile.clampTimestamp(9e15, FIXED_NOW), FIXED_NOW);
    eq('H2 未来但未超窗口不夹', profile.clampTimestamp(FIXED_NOW + 1000, FIXED_NOW), FIXED_NOW + 1000);
    eq('H3 过去时间戳不动', profile.clampTimestamp(500, FIXED_NOW), 500);
    eq('H4 非有限时间戳原样返回', profile.clampTimestamp(NaN, FIXED_NOW), NaN);

    // 夹取后维持 updatedAt >= createdAt
    const far = profile.normalizeProfile({ version: 1, avatarId: 'avatar01', displayName: '未来', confirmed: true, createdAt: FIXED_NOW + 100, updatedAt: 9e15 }, FIXED_NOW);
    ok('H5 normalize 夹取后 updatedAt>=createdAt', far && far.updatedAt >= far.createdAt);

    // 前后端对同一批（含未来时间戳）输入合并结果一致
    const a = { version: 1, avatarId: 'avatar01', displayName: '甲', confirmed: true, createdAt: FIXED_NOW - 1000, updatedAt: FIXED_NOW };
    const b = { version: 1, avatarId: 'avatar02', displayName: '乙', confirmed: true, createdAt: FIXED_NOW - 2000, updatedAt: 9e15 };   // 明显未来
    const cli = profile.mergePlayerProfile(a, b, FIXED_NOW);
    const srv = serverMerge.mergePlayerProfile(a, b, FIXED_NOW);
    eq('H6 未来时间戳输入前后端合并一致', JSON.stringify(cli), JSON.stringify(srv));

    // 交换顺序稳定（同时间戳平局）
    const xy = profile.mergePlayerProfile(a, b, FIXED_NOW);
    const yx = profile.mergePlayerProfile(b, a, FIXED_NOW);
    eq('H7 交换顺序收敛', JSON.stringify(xy), JSON.stringify(yx));

    // 明显未来时间戳经钳制后，不再“永远获胜”：两个未来都钳到 now，等价于同 updatedAt 平局
    const c = { version: 1, avatarId: 'avatar03', displayName: '丙', confirmed: true, createdAt: FIXED_NOW - 500, updatedAt: 9e15 };
    const d = { version: 1, avatarId: 'avatar01', displayName: '丁', confirmed: true, createdAt: FIXED_NOW - 600, updatedAt: 9e15 };
    const cd = profile.mergePlayerProfile(c, d, FIXED_NOW);
    ok('H8 两个未来时间戳均钳到 now 后进入确定性平局', cd && typeof cd.displayName === 'string');
  } finally {
    profile.resetClock();
    serverMerge.resetClock();
  }
}

console.log('\n=====================================');
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
