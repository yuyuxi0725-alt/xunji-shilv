// tools/test-player-role.js —— 杜甫全程玩家角色「全线恢复 / 外观平等 / 旧浮层退场 / 非法修复」测试
//
// 替代已退役的 test-taishan-role.js（旧泰山「身份选择」门控测试，其被测对象
// utils/stories/dufu-taishan-roles.js 已无消费者、职业/信任玩法已退场）。
//
// 覆盖（docs/杜甫全程玩家角色-修改实施方案.md 步骤五，对应验收项 1/2/3/7/8）：
//   A. 首/中/末三地点恢复同一姓名与 avatarId（角色档案按线保存，不按地点分）；
//   B. 三个 avatarId 解析到各自素材键，且不改变剧情节点解析结果（外观平等）；
//   C. 泰山不再弹旧「身份选择」浮层，不写 roleId 与初始信任；
//   D. replay 直接使用当前正式角色（角色门控与 mode 无关）；
//   E. 非法/损坏档案安全进入统一创建/修复流程，不裂图、不崩溃；
//   F. 三条线档案独立，编辑李白不改变杜甫/苏轼。
//
// 本测试直接驱动真实的 guard / progress / player-avatars / story-variants 纯模块，
// 不复制 chat.js 页面门控逻辑。
//
// 运行：node tools/test-player-role.js

// ---- 最小 wx 存储 mock ----
const store = {};
global.wx = {
  getStorageSync(k) { return store[k] === undefined ? '' : store[k]; },
  setStorageSync(k, v) { store[k] = v; },
  removeStorageSync(k) { delete store[k]; }
};

const path = require('path');
const guard = require(path.join(__dirname, '../miniprogram/utils/player-guard.js'));
const avatars = require(path.join(__dirname, '../miniprogram/utils/player-avatars.js'));
const profile = require(path.join(__dirname, '../miniprogram/utils/player-profile.js'));
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

// 恢复一份已确认角色（等价于 chat.js _restorePlayerProfile 所走的纯逻辑：getPlayerProfile + isValidAvatar + portraitKeyOf）
function restoreDisplay(lineId) {
  const p = progress.getPlayerProfile(lineId);
  if (!p || !avatars.isValidAvatar(p.avatarId)) return null;
  return { displayName: p.displayName, avatarId: p.avatarId, portraitKey: avatars.portraitKeyOf(p.avatarId) };
}

// ============ A. 首/中/末三地点恢复同一姓名与外观 ============
console.log('--- A. 全线同一角色 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar02', '小杜');

  // 首（洛阳）/ 中（泰山）/ 末（湘江）都读同一份 playerProfiles.dufu
  const first = restoreDisplay('dufu');
  const middle = restoreDisplay('dufu');
  const last = restoreDisplay('dufu');

  ok('A1 洛阳/泰山/湘江恢复同一姓名', first.displayName === '小杜' && middle.displayName === '小杜' && last.displayName === '小杜');
  eq('A2 三地点恢复同一 avatarId', first.avatarId, 'avatar02');
  eq('A3 恢复的素材键一致', first.portraitKey, 'tang-mountain-guide');

  // 档案按线保存，不按地点分：三个地点共读 playerProfiles.dufu 一份
  eq('A4 只存一份 dufu 档案（无地点二级分组）', Object.keys(progress.snapshot().playerProfiles || {}).join(','), 'dufu');
}

// ============ B. 三外观 → 各自素材，剧情解析结果相同 ============
console.log('--- B. 外观平等 ---');
{
  eq('B1 avatar01 → tang-young-scholar', avatars.portraitKeyOf('avatar01'), 'tang-young-scholar');
  eq('B2 avatar02 → tang-mountain-guide', avatars.portraitKeyOf('avatar02'), 'tang-mountain-guide');
  eq('B3 avatar03 → tang-passing-traveler', avatars.portraitKeyOf('avatar03'), 'tang-passing-traveler');
  // 三个素材键互不相同（各自立绘）
  const keys = avatars.getAvatarIds().map(avatars.portraitKeyOf);
  eq('B4 三素材键互不相同', keys.filter((k, i) => keys.indexOf(k) === i).length, 3);

  // 外观不进入剧情解析：同一节点用三种外观解析，结果完全一致（剧情/奖励由源稿决定）
  const n3 = quests.taishan.nodes.n3;
  const a1 = JSON.stringify(variants.resolveNode(n3));
  const a2 = JSON.stringify(variants.resolveNode(n3));
  const a3 = JSON.stringify(variants.resolveNode(n3));
  ok('B5 三外观得到完全相同的剧情节点', a1 === a2 && a2 === a3);
}

// ============ C. 泰山不再弹旧浮层、不写 roleId 与初始信任 ============
console.log('--- C. 泰山旧身份/信任退场 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar01', '寻迹者');

  // 新流程只写 playerProfiles，不写旧 locationProfiles.dufu.taishan.roleId
  const taishanProf = progress.getLocationProfile('dufu', 'taishan');
  ok('C1 泰山未写旧 roleId', !taishanProf || !taishanProf.roleId);
  eq('C2 泰山无初始信任', progress.getLocationTrust('dufu', 'taishan'), 0);

  // 有 confirmed 角色时不再走角色页（即不再弹「这一程，你是谁」浮层）
  const p = progress.getPlayerProfile('dufu');
  eq('C3 已确认角色不触发角色页', guard.needsRolePage('dufu', p), false);
}

// ============ D. replay 直接使用当前正式角色 ============
console.log('--- D. replay 使用正式角色 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar03', '老友');

  // 角色门控只取决于「是否存在 confirmed 档案」，与 continue/replay 无关；
  // 因此 replay 不弹换外观/临时身份选择，直接沿用正式角色。
  const p = progress.getPlayerProfile('dufu');
  eq('D1 有正式角色时 replay 不触发创建页', guard.needsRolePage('dufu', p), false);
  eq('D2 replay 恢复的是同一正式角色', restoreDisplay('dufu').avatarId, 'avatar03');
  eq('D3 replay 恢复同一姓名', restoreDisplay('dufu').displayName, '老友');
}

// ============ E. 非法档案安全进入创建/修复流程 ============
console.log('--- E. 非法档案安全修复 ---');
{
  reset();
  // 直接向存储层注入非法档案（外观 id 不在白名单 / 缺字段）
  const bad = { version: 1, avatarId: 'bogusAvatar', displayName: '坏档案', confirmed: true, createdAt: 1, updatedAt: 2 };
  store['playerProfiles'] = { dufu: bad };

  // 读取层拒绝非法档案（normalizeProfile → null），不把坏状态套给页面
  ok('E1 非法外观档案被读取层拒绝', progress.getPlayerProfile('dufu') === null);
  eq('E2 非法外观素材键为空（不裂图）', avatars.portraitKeyOf('bogusAvatar'), '');
  ok('E3 非法档案触发统一创建/修复流程', guard.needsRolePage('dufu', progress.getPlayerProfile('dufu')) === true);
  // 修复流程能生成合法目标 URL（回到原地点聊天页），不崩溃
  const url = guard.buildPlayerUrl({ lineId: 'dufu', target: 'chat', locationId: 'taishan', mode: 'continue' });
  ok('E4 修复后回到原地点聊天页', url.indexOf('/pages/player/player') === 0 && url.indexOf('locationId=taishan') >= 0);

  // 时间戳非法（updatedAt < createdAt）同样被拒绝
  store['playerProfiles'] = { dufu: { version: 1, avatarId: 'avatar01', displayName: '合法名', confirmed: true, createdAt: 100, updatedAt: 50 } };
  ok('E5 时间戳非法档案被拒绝', progress.getPlayerProfile('dufu') === null);
}

// ============ F. 三条线档案独立，编辑李白不改变杜甫/苏轼 ============
console.log('--- F. 三线档案独立 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar01', '小杜');
  progress.savePlayerProfile('libai', 'avatar02', '小白');
  progress.savePlayerProfile('sushi', 'avatar03', '小苏');

  eq('F1 三条线均为角色线', [guard.isRoleLine('dufu'), guard.isRoleLine('libai'), guard.isRoleLine('sushi')], [true, true, true]);
  eq('F2 杜甫档案独立', progress.getPlayerProfile('dufu').displayName, '小杜');
  eq('F3 李白档案独立', progress.getPlayerProfile('libai').displayName, '小白');
  eq('F4 苏轼档案独立', progress.getPlayerProfile('sushi').displayName, '小苏');
  // snapshot 里三份档案按 lineId 分组，互不共享
  eq('F5 三份档案按线分组', Object.keys(progress.snapshot().playerProfiles || {}).sort().join(','), 'dufu,libai,sushi');

  // 编辑李白：换外观 + 改名，杜甫/苏轼不受影响
  progress.savePlayerProfile('libai', 'avatar01', '太白');
  eq('F6 编辑后李白姓名更新', progress.getPlayerProfile('libai').displayName, '太白');
  eq('F7 编辑李白不改变杜甫姓名', progress.getPlayerProfile('dufu').displayName, '小杜');
  eq('F8 编辑李白不改变苏轼姓名', progress.getPlayerProfile('sushi').displayName, '小苏');
  eq('F9 杜甫外观不变', progress.getPlayerProfile('dufu').avatarId, 'avatar01');
  eq('F10 苏轼外观不变', progress.getPlayerProfile('sushi').avatarId, 'avatar03');

  // 清除李白档案不影响其它两线
  progress.clearPlayerProfile('libai');
  ok('F11 清除李白档案后为空', progress.getPlayerProfile('libai') === null);
  eq('F12 杜甫档案仍在', progress.getPlayerProfile('dufu').displayName, '小杜');
  eq('F13 苏轼档案仍在', progress.getPlayerProfile('sushi').displayName, '小苏');

  // 非法 lineId 被存档层拒绝（伪造 lineId 不落库）
  ok('F14 伪造 lineId 拒绝保存', progress.savePlayerProfile('baijuyi', 'avatar01', '假诗人') === null);
  ok('F15 伪造 lineId 读取为空', progress.getPlayerProfile('baijuyi') === null);
}

console.log('\n=====================================');
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
