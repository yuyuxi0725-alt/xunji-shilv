// tools/test-player-profile.js —— 玩家角色档案（外观 + 姓名）纯逻辑与存储测试（本地可复现）
//
// 覆盖：
//   A. 外观白名单（player-avatars）：三张立绘复用现有素材键、无职业语义、旧角色迁移映射
//   B. 姓名规范化/校验（player-profile）：默认名、1–8 码点、汉字/字母/数字、去空白与控制字符
//   C. 档案创建/结构校验（player-profile）：只含 version/avatarId/displayName/confirmed/createdAt/updatedAt
//   D. 档案合并（player-profile）：已确认优先、updatedAt 取新、createdAt 取早、交换收敛
//   E. progress 存储：保存/读取/清除、snapshot、mergeRemote、resetAll
//
// 运行：node tools/test-player-profile.js

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

// ============ A. 外观白名单 ============
console.log('--- A. 外观白名单 ---');
{
  eq('A1 三张外观', avatars.getAvatarIds(), ['avatar01', 'avatar02', 'avatar03']);
  eq('A2 外观名无职业语义', avatars.avatarNameOf('avatar01'), '形象一');
  // 素材键继续复用现有云图
  eq('A3 外观1 素材键', avatars.portraitKeyOf('avatar01'), 'tang-young-scholar');
  eq('A4 外观2 素材键', avatars.portraitKeyOf('avatar02'), 'tang-mountain-guide');
  eq('A5 外观3 素材键', avatars.portraitKeyOf('avatar03'), 'tang-passing-traveler');
  ok('A6 非法外观返回 null', avatars.getAvatar('bogus') === null && !avatars.isValidAvatar('bogus'));
  // 旧泰山角色 → 新外观（只迁外观）
  eq('A7 旧角色映射', avatars.avatarForLegacyRole('fellowScholar'), 'avatar01');
  eq('A8 非旧角色返回空串', avatars.avatarForLegacyRole('unknown'), '');
}

// ============ B. 姓名规范化/校验 ============
console.log('--- B. 姓名规范化 / 校验 ---');
{
  eq('B1 默认名合法', profile.isValidName(profile.DEFAULT_NAME), true);
  eq('B1a UI 粘贴尾随换行会被清理', profile.sanitizeNameInput('同行人\n'), '同行人');
  eq('B1b UI 粘贴内部制表符会被清理', profile.sanitizeNameInput('同\t行人'), '同行人');
  eq('B1c UI 清理后的同行人合法', profile.isValidName(profile.sanitizeNameInput('同行人\r\n')), true);
  eq('B2 中文名合法', profile.isValidName('杜甫'), true);
  eq('B3 英文名合法', profile.isValidName('Dufu'), true);
  eq('B4 数字合法', profile.isValidName('2026'), true);
  eq('B5 混合合法', profile.isValidName('小杜abc1'), true);
  // 规范化：去首尾空白
  eq('B6 normalize 去首尾空白', profile.normalizeName('  寻迹者  '), '寻迹者');
  // 控制字符不可被静默删除后当成另一个合法名字
  eq('B7 normalize 保留内部换行供校验拒绝', profile.normalizeName('寻\n迹者'), '寻\n迹者');
  eq('B8 normalize 保留内部制表供校验拒绝', profile.normalizeName('寻\t迹者'), '寻\t迹者');
  // 非法
  ok('B9 空串非法', !profile.isValidName(''));
  ok('B10 空白串非法', !profile.isValidName('   '));
  ok('B11 含空格非法', !profile.isValidName('寻 迹'));
  ok('B12 超长(9码点)非法', !profile.isValidName('一二三四五六七八九'));
  eq('B13 恰好8码点合法', profile.isValidName('一二三四五六七八'), true);
  ok('B14 标点非法', !profile.isValidName('寻迹者!'));
  ok('B15 表情非法', !profile.isValidName('寻迹者😀'));
  ok('B16 已规范化才是合法（含换行非法）', !profile.isValidName('寻\n迹者'));
}

// ============ C. 档案创建 / 结构校验 ============
console.log('--- C. 档案创建 / 校验 ---');
{
  const p = profile.createProfile('avatar01', '寻迹者');
  ok('C1 创建返回档案', !!p);
  eq('C2 version=1', p.version, 1);
  eq('C3 avatarId 落库', p.avatarId, 'avatar01');
  eq('C4 displayName 规范化后落库', p.displayName, '寻迹者');
  eq('C5 confirmed=true', p.confirmed, true);
  ok('C6 createdAt/updatedAt 为有限数字', Number.isFinite(p.createdAt) && Number.isFinite(p.updatedAt));
  // 不保存职业/信任/能力
  eq('C7 无职业/信任/能力字段',
    ['roleId', 'profession', 'initialTrust', 'trustScore', 'ability', 'abilities', 'trustEvents', 'tasks']
      .filter(k => k in p),
    []);
  ok('C8 非法姓名创建返回 null', profile.createProfile('avatar01', '  ') === null);
  ok('C9 结构校验通过', profile.isValidProfile(p));
  ok('C10 缺字段结构非法', !profile.isValidProfile({ version: 1, avatarId: 'avatar01', displayName: '寻迹者' }));
  ok('C11 version 不对非法', !profile.isValidProfile(Object.assign({}, p, { version: 2 })));
  ok('C12 非法外观不能创建', profile.createProfile('bogus', '寻迹者') === null);
  ok('C13 换行不能通过静默删除后创建', profile.createProfile('avatar01', '寻\n迹者') === null);
  ok('C14 档案中非法外观被拒绝', !profile.isValidProfile(Object.assign({}, p, { avatarId: 'bogus' })));
  ok('C15 多余字段被拒绝', !profile.isValidProfile(Object.assign({}, p, { roleId: 'fellowScholar' })));
  ok('C16 字符串时间戳被拒绝', !profile.isValidProfile(Object.assign({}, p, { createdAt: String(p.createdAt) })));
  ok('C17 负时间戳被拒绝', !profile.isValidProfile(Object.assign({}, p, { createdAt: -1 })));
  ok('C18 updatedAt 不能早于 createdAt', !profile.isValidProfile(Object.assign({}, p, { updatedAt: p.createdAt - 1 })));
}

// ============ D. 档案合并 ============
console.log('--- D. 档案合并 ---');
{
  const a = { version: 1, avatarId: 'avatar01', displayName: '寻迹者', confirmed: true, createdAt: 100, updatedAt: 200 };
  const b = { version: 1, avatarId: 'avatar02', displayName: '小杜', confirmed: true, createdAt: 50, updatedAt: 300 };
  // 同为已确认：updatedAt 取新，但 createdAt 取早
  const m1 = profile.mergePlayerProfile(a, b);
  eq('D1 updatedAt 取新（整份）', m1.displayName, '小杜');
  eq('D2 createdAt 取早', m1.createdAt, 50);

  // 已确认优先于待确认
  const unconfirmed = { version: 1, avatarId: 'avatar03', displayName: '旧档', confirmed: false, createdAt: 10, updatedAt: 999 };
  const m2 = profile.mergePlayerProfile(unconfirmed, a);
  eq('D3 已确认优先于待确认', m2.displayName, '寻迹者');

  // 交换顺序收敛（同 updatedAt 时按规范化字段排序）
  const x = { version: 1, avatarId: 'avatar01', displayName: '甲', confirmed: true, createdAt: 1, updatedAt: 500 };
  const y = { version: 1, avatarId: 'avatar02', displayName: '乙', confirmed: true, createdAt: 2, updatedAt: 500 };
  const xy = profile.mergePlayerProfile(x, y);
  const yx = profile.mergePlayerProfile(y, x);
  eq('D4 交换合并收敛', xy.displayName, yx.displayName);

  // 非法档案按 null
  ok('D5 双非法返回 null', profile.mergePlayerProfile(null, { bad: true }) === null);
  eq('D6 一非法回退另一份', profile.mergePlayerProfile(a, null).displayName, '寻迹者');

  const injected = Object.assign({}, a, { roleId: 'fellowScholar' });
  ok('D7 带额外字段的档案不进入合并结果', profile.mergePlayerProfile(null, injected) === null);
}

// ============ E. progress 存储 ============
console.log('--- E. progress 存储 ---');
{
  reset();
  ok('E1 初始无档案', progress.getPlayerProfile('dufu') === null);

  const saved = progress.savePlayerProfile('dufu', 'avatar01', '  寻迹者 ');
  ok('E2 保存成功', !!saved);
  eq('E3 姓名已规范化', saved.displayName, '寻迹者');
  eq('E4 读取一致', progress.getPlayerProfile('dufu').displayName, '寻迹者');
  ok('E5 非法外观拒绝保存', progress.savePlayerProfile('dufu', 'bogus', '寻迹者') === null);
  ok('E6 非法姓名拒绝保存', progress.savePlayerProfile('dufu', 'avatar01', '  ') === null);

  // 更新：保留 createdAt，刷新 updatedAt
  const first = progress.getPlayerProfile('dufu');
  const again = progress.savePlayerProfile('dufu', 'avatar02', '小杜');
  eq('E7 更新保留 createdAt', again.createdAt, first.createdAt);
  eq('E8 更新后外观变化', again.avatarId, 'avatar02');

  // snapshot 含 playerProfiles
  const snap = progress.snapshot();
  eq('E9 snapshot 含 playerProfiles', snap.playerProfiles.dufu.displayName, '小杜');

  // mergeRemote：云端较新 → 合入
  reset();
  progress.savePlayerProfile('dufu', 'avatar01', '寻迹者');
  progress.mergeRemote({
    playerProfiles: { dufu: { version: 1, avatarId: 'avatar03', displayName: '云端名', confirmed: true, createdAt: 1, updatedAt: 9e15 } }
  });
  eq('E10 云端较新合入', progress.getPlayerProfile('dufu').displayName, '云端名');

  // mergeRemote：非法外观 / 多余字段不得落库
  reset();
  progress.mergeRemote({
    playerProfiles: { dufu: { version: 1, avatarId: 'bogus', displayName: '脏数据', confirmed: true, createdAt: 1, updatedAt: 2 } }
  });
  ok('E11 非法云档案被拒绝', progress.getPlayerProfile('dufu') === null);
  progress.mergeRemote({
    playerProfiles: { dufu: { version: 1, avatarId: 'avatar01', displayName: '脏数据', confirmed: true, createdAt: 1, updatedAt: 2, roleId: 'legacy' } }
  });
  ok('E12 含多余字段的云档案被拒绝', progress.getPlayerProfile('dufu') === null);

  // clearPlayerProfile：只删档案，不影响其它
  progress.savePlayerProfile('dufu', 'avatar02', '小杜');
  progress.saveLocationCheckpoint('dufu', 'luoyang', 'n5');
  progress.clearPlayerProfile('dufu');
  ok('E13 清除档案', progress.getPlayerProfile('dufu') === null);
  ok('E14 不影响地点检查点', !!progress.getLocationCheckpoint('dufu', 'luoyang'));

  // resetAll 清除档案
  progress.savePlayerProfile('dufu', 'avatar01', '寻迹者');
  progress.resetAll();
  ok('E15 resetAll 清除档案', progress.getPlayerProfile('dufu') === null);
}

// ============ F. 前后端角色合并规则一致 ============
console.log('--- F. 前后端角色合并规则 ---');
{
  const serverMerge = require(path.join(__dirname, '../miniprogram/cloudfunctions/story/merge.js'));
  const good = { version: 1, avatarId: 'avatar02', displayName: '小杜', confirmed: true, createdAt: 10, updatedAt: 20 };
  const badAvatar = { version: 1, avatarId: 'bogus', displayName: '小杜', confirmed: true, createdAt: 10, updatedAt: 30 };
  const badExtra = Object.assign({}, good, { trustScore: 99 });
  eq('F1 合法档案前后端合并一致', serverMerge.mergePlayerProfile(null, good), profile.mergePlayerProfile(null, good));
  ok('F2 服务端拒绝非法外观', serverMerge.mergePlayerProfile(null, badAvatar) === null);
  ok('F3 服务端拒绝额外字段', serverMerge.mergePlayerProfile(null, badExtra) === null);
  eq('F4 服务端合并集不保留脏数据', serverMerge.mergePlayerProfiles({}, { dufu: badAvatar }), {});
}

console.log('\n=====================================');
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
