// tools/test-player-guard.js —— 玩家角色「守卫 + 返回意图白名单」纯函数测试
//
// 覆盖：
//   A. isRoleLine / roleStatus / needsRolePage（杜甫/李白/苏轼三线均启用；none/draft 需先走角色页）；
//   B. parseIntent 白名单（transition/chat/profile；拒绝未知 target / 非角色线 / 非法地点 / 锁定地点）；
//   C. buildPlayerUrl（只编码白名单字段；chat 带 locationId+mode；profile 编辑带 edit=1）；
//   D. 三条线第一次进入都需要创建角色；未知人物线仍被拒绝。
//
// 运行：node tools/test-player-guard.js

const path = require('path');
const guard = require(path.join(__dirname, '../miniprogram/utils/player-guard.js'));

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, a, b) {
  ok(name, JSON.stringify(a) === JSON.stringify(b), 'got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}

const confirmed = { version: 1, avatarId: 'avatar01', displayName: '寻迹者', confirmed: true, createdAt: 1, updatedAt: 2 };
const draft = { version: 1, avatarId: 'avatar02', displayName: '寻迹者', confirmed: false, createdAt: 1, updatedAt: 1 };

// ============ A. isRoleLine / roleStatus / needsRolePage ============
console.log('--- A. 角色线判定与状态 ---');
{
  eq('A1 杜甫启用角色线', guard.isRoleLine('dufu'), true);
  eq('A2 李白启用角色线', guard.isRoleLine('libai'), true);
  eq('A3 苏轼启用角色线', guard.isRoleLine('sushi'), true);
  eq('A4 未知人物线不启用', guard.isRoleLine('baijuyi'), false);

  eq('A5 无档案状态 none', guard.roleStatus('dufu', null), 'none');
  eq('A6 草稿状态 draft', guard.roleStatus('dufu', draft), 'draft');
  eq('A7 已确认状态 confirmed', guard.roleStatus('dufu', confirmed), 'confirmed');
  eq('A8 非角色线 not-applicable', guard.roleStatus('baijuyi', confirmed), 'not-applicable');
  // 三条线状态判定一致（李白/苏轼与杜甫同规则）
  eq('A9 李白无档案状态 none', guard.roleStatus('libai', null), 'none');
  eq('A10 苏轼已确认状态 confirmed', guard.roleStatus('sushi', confirmed), 'confirmed');

  eq('A11 无档案需走角色页', guard.needsRolePage('dufu', null), true);
  eq('A12 迁移草稿需走角色页（确认一次）', guard.needsRolePage('dufu', draft), true);
  eq('A13 已确认不再走角色页', guard.needsRolePage('dufu', confirmed), false);
  // 三条线第一次进入都需要创建角色
  eq('A14 李白无档案需走角色页', guard.needsRolePage('libai', null), true);
  eq('A15 苏轼无档案需走角色页', guard.needsRolePage('sushi', null), true);
  eq('A16 李白已确认不再走角色页', guard.needsRolePage('libai', confirmed), false);
  eq('A17 苏轼已确认不再走角色页', guard.needsRolePage('sushi', confirmed), false);
}

// ============ B. parseIntent 白名单 ============
console.log('--- B. 返回意图白名单 ---');
{
  const locOk = (lineId, locationId) => ['dufu', 'libai', 'sushi'].indexOf(lineId) >= 0 && !!locationId;

  // transition（选人页 → 确认后穿越转场）；三条线均可
  const t = guard.parseIntent({ lineId: 'dufu', target: 'transition' });
  ok('B1 transition 合法', !!t && t.lineId === 'dufu' && t.target === 'transition');
  const tLibai = guard.parseIntent({ lineId: 'libai', target: 'transition' });
  ok('B1b 李白 transition 合法', !!tLibai && tLibai.lineId === 'libai' && tLibai.target === 'transition');
  const tSushi = guard.parseIntent({ lineId: 'sushi', target: 'transition' });
  ok('B1c 苏轼 transition 合法', !!tSushi && tSushi.lineId === 'sushi' && tSushi.target === 'transition');

  // 缺省 target 回退 transition
  const tDefault = guard.parseIntent({ lineId: 'dufu' });
  eq('B2 缺省 target 回退 transition', tDefault.target, 'transition');

  // chat（地图/直接地点 → 确认后回原地点）
  const c = guard.parseIntent({ lineId: 'dufu', target: 'chat', locationId: 'taishan', mode: 'continue' }, locOk);
  ok('B3 chat 合法', !!c && c.target === 'chat' && c.locationId === 'taishan' && c.mode === 'continue');
  const cReplay = guard.parseIntent({ lineId: 'dufu', target: 'chat', locationId: 'taishan', mode: 'replay' }, locOk);
  eq('B4 chat 保留 replay', cReplay.mode, 'replay');
  const cModeDefault = guard.parseIntent({ lineId: 'dufu', target: 'chat', locationId: 'taishan' }, locOk);
  eq('B5 chat 缺省 mode=continue', cModeDefault.mode, 'continue');
  // 李白/苏轼的 chat 意图同样合法
  ok('B5b 李白 chat 合法', !!guard.parseIntent({ lineId: 'libai', target: 'chat', locationId: 'baidi', mode: 'continue' }, locOk));
  ok('B5c 苏轼 chat 合法', !!guard.parseIntent({ lineId: 'sushi', target: 'chat', locationId: 'meishan', mode: 'continue' }, locOk));

  // profile（「我的」编辑）
  const pEdit = guard.parseIntent({ lineId: 'dufu', target: 'profile', edit: '1' }, locOk);
  ok('B6 profile 编辑合法', !!pEdit && pEdit.target === 'profile' && pEdit.edit === true);
  const pCreate = guard.parseIntent({ lineId: 'dufu', target: 'profile' }, locOk);
  ok('B7 profile 创建(非编辑)合法', !!pCreate && pCreate.edit === false);

  // 非法输入一律拒绝
  ok('B8 未知 target 拒绝', guard.parseIntent({ lineId: 'dufu', target: '/pages/chat/chat' }) === null);
  ok('B9 非角色线拒绝', guard.parseIntent({ lineId: 'baijuyi', target: 'transition' }) === null);
  ok('B9b 缺失 lineId 拒绝', guard.parseIntent({ target: 'transition' }) === null);
  ok('B9c 空 lineId 拒绝', guard.parseIntent({ lineId: '', target: 'transition' }) === null);
  ok('B10 chat 缺地点拒绝', guard.parseIntent({ lineId: 'dufu', target: 'chat' }, locOk) === null);
  ok('B11 chat 地点不存在拒绝', guard.parseIntent({ lineId: 'dufu', target: 'chat', locationId: 'bogus' }, (l, loc) => loc === 'taishan') === null);
  // 锁定地点（validator 返回 false）拒绝 —— 防借角色页绕过锁定地点
  const locked = (lineId, locationId) => false;
  ok('B12 锁定地点拒绝', guard.parseIntent({ lineId: 'dufu', target: 'chat', locationId: 'taishan' }, locked) === null);
  // 无 validator 时 chat 一律拒绝（不信任未知地点）
  ok('B13 无地点校验器时 chat 拒绝', guard.parseIntent({ lineId: 'dufu', target: 'chat', locationId: 'taishan' }) === null);
}

// ============ C. buildPlayerUrl ============
console.log('--- C. 组装角色页 URL ---');
{
  eq('C1 transition URL',
    guard.buildPlayerUrl({ lineId: 'dufu', target: 'transition' }),
    '/pages/player/player?lineId=dufu&target=transition');
  eq('C1b 李白 transition URL',
    guard.buildPlayerUrl({ lineId: 'libai', target: 'transition' }),
    '/pages/player/player?lineId=libai&target=transition');
  eq('C2 chat URL（带地点与模式）',
    guard.buildPlayerUrl({ lineId: 'dufu', target: 'chat', locationId: 'taishan', mode: 'replay' }),
    '/pages/player/player?lineId=dufu&target=chat&locationId=taishan&mode=replay');
  eq('C3 profile 编辑 URL',
    guard.buildPlayerUrl({ lineId: 'dufu', target: 'profile', edit: true }),
    '/pages/player/player?lineId=dufu&target=profile&edit=1');
  eq('C4 profile 创建 URL（无 edit）',
    guard.buildPlayerUrl({ lineId: 'dufu', target: 'profile', edit: false }),
    '/pages/player/player?lineId=dufu&target=profile');
}

// ============ D. 提交后状态收敛（none → confirmed） ============
console.log('--- D. 创建后不再走角色页 ---');
{
  // 纯逻辑视角：确认后 profile 变为 confirmed，needsRolePage 翻转为 false
  const afterConfirm = confirmed;
  eq('D1 确认后 needsRolePage=false', guard.needsRolePage('dufu', afterConfirm), false);
  eq('D2 确认后 roleStatus=confirmed', guard.roleStatus('dufu', afterConfirm), 'confirmed');
  // 三条线一致：确认后都不再走角色页
  eq('D3 李白确认后不再走角色页', guard.needsRolePage('libai', afterConfirm), false);
  eq('D4 苏轼确认后不再走角色页', guard.needsRolePage('sushi', afterConfirm), false);
}

console.log('\n=====================================');
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
