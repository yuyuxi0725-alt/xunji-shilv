// tools/test-replay-isolation.js —— 「我的」页四态 / 终章回望 / 重温读写隔离（步骤九）
//
// 覆盖提示词要求的 9 项：
//   1. 「我的」页有/无/迁移中/非法角色四种状态
//   2. 编辑角色名和外观后刷新，账号昵称、地点进度不变
//   3. 清除后角色和进度按约定清空
//   4. 终章正确显示当前角色姓名，三外观结果一致
//   5. replay 从 start 进入，正式 checkpoint 不变
//   6. replay 选择、锚点、任务、奖励和通关时间均不落盘
//   7. 通关终章后重温泰山，AI 可用记忆不含后期地点
//   8. replay 退出再 continue，回到原正式检查点
//   9. 三条线同行者与终章各自隔离，不把杜甫角色名/回望泄漏到李白、苏轼
//
// 被测对象都是真实模块（不是复制品）：
//   · utils/player-card.js（四态与地图同行者判定，profile/map 页面用的同一份）
//   · utils/play-mode.js（replay 判定与起点计算，chat 页面用的同一份）
//   · utils/dufu-recap.js（终章回望，chat 页面用的同一份）
//   · utils/progress.js（真实存储层）
//   · cloudfunctions/chat/memory.js（AI 可用记忆的时间截断）
//   · pages/chat/chat.js 源码级护栏：所有 progress 写入必须带 replay 守卫
//
// 运行：node tools/test-replay-isolation.js

// ---- 最小 wx 存储 mock ----
const store = {};
global.wx = {
  getStorageSync(k) { return store[k] === undefined ? '' : store[k]; },
  setStorageSync(k, v) { store[k] = v; },
  removeStorageSync(k) { delete store[k]; }
};

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const progress = require(path.join(ROOT, 'miniprogram/utils/progress.js'));
const playerCard = require(path.join(ROOT, 'miniprogram/utils/player-card.js'));
const playMode = require(path.join(ROOT, 'miniprogram/utils/play-mode.js'));
const dufuRecap = require(path.join(ROOT, 'miniprogram/utils/dufu-recap.js'));
const dufuEvents = require(path.join(ROOT, 'miniprogram/utils/dufu-events.js'));
const avatars = require(path.join(ROOT, 'miniprogram/utils/player-avatars.js'));
const memory = require(path.join(ROOT, 'miniprogram/cloudfunctions/chat/memory.js'));
const quests = require(path.join(ROOT, 'miniprogram/utils/stories/line-dufu-locations.generated.js'));

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, a, b) {
  const same = JSON.stringify(a) === JSON.stringify(b);
  if (same) { pass++; return; }
  failures.push(name + '  → got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function reset() { Object.keys(store).forEach(k => delete store[k]); }

// ============ 1. 「我的」页四态 ============
console.log('--- 1. 角色卡四态 ---');
{
  reset();
  const none = playerCard.resolveRoleCard(null, false);
  eq('1.1 无档案 → none / 创建角色', [none.status, none.label], ['none', '创建角色']);
  eq('1.2 无档案不可编辑', none.editable, false);

  const invalid = playerCard.resolveRoleCard(null, true);
  eq('1.3 非法档案 → invalid / 修复角色', [invalid.status, invalid.label], ['invalid', '修复角色']);
  ok('1.4 非法档案给出可读提示而非空白', invalid.displayName.length > 0);
  eq('1.5 非法档案也走创建-确认流程（不进编辑）', invalid.editable, false);

  const draft = { version: 1, avatarId: 'avatar02', displayName: '寻迹者', confirmed: false, createdAt: 1, updatedAt: 1 };
  const draftCard = playerCard.resolveRoleCard(draft, false);
  eq('1.6 迁移草稿 → draft / 确认角色', [draftCard.status, draftCard.label], ['draft', '确认角色']);
  eq('1.7 草稿不进编辑模式', draftCard.editable, false);

  const confirmed = { version: 1, avatarId: 'avatar01', displayName: '小杜', confirmed: true, createdAt: 1, updatedAt: 2 };
  const okCard = playerCard.resolveRoleCard(confirmed, false);
  eq('1.8 已确认 → confirmed / 编辑', [okCard.status, okCard.label], ['confirmed', '编辑']);
  eq('1.9 已确认可编辑', okCard.editable, true);
  eq('1.10 卡片显示角色名与外观名', [okCard.displayName, okCard.avatarName], ['小杜', '形象一']);
  eq('1.11 卡片带立绘路径', okCard.portraitPath, '/assets/images/npc/tang-young-scholar.png');

  // 真实存储层：非法档案会被读取层拒绝，但 hasInvalidPlayerProfile 能识别出来
  reset();
  store['playerProfiles'] = { dufu: { version: 1, avatarId: 'bogus', displayName: '坏', confirmed: true, createdAt: 1, updatedAt: 2 } };
  eq('1.12 非法档案 getPlayerProfile 返回 null', progress.getPlayerProfile('dufu'), null);
  eq('1.13 hasInvalidPlayerProfile 识别出损坏', progress.hasInvalidPlayerProfile('dufu'), true);
  reset();
  eq('1.14 无档案时 hasInvalid=false', progress.hasInvalidPlayerProfile('dufu'), false);
  progress.savePlayerProfile('dufu', 'avatar01', '小杜');
  eq('1.15 合法档案 hasInvalid=false', progress.hasInvalidPlayerProfile('dufu'), false);
}

// ============ 2. 编辑角色不影响昵称与地点进度 ============
console.log('--- 2. 编辑角色不牵连其它数据 ---');
{
  reset();
  wx.setStorageSync('userNickname', '少年史官');
  progress.savePlayerProfile('dufu', 'avatar01', '小杜');
  progress.completeLocation('dufu', 'luoyang', memory.DUFU_ORDER);
  progress.addAnchor('dufu', 'a1');
  const statesBefore = JSON.stringify(progress.getLocationStates('dufu'));
  const anchorsBefore = JSON.stringify(progress.getAnchors('dufu'));

  // 编辑：换外观 + 改名
  progress.savePlayerProfile('dufu', 'avatar03', '阿寻');
  const p = progress.getPlayerProfile('dufu');
  eq('2.1 外观已更新', p.avatarId, 'avatar03');
  eq('2.2 姓名已更新', p.displayName, '阿寻');
  eq('2.3 账号昵称不受影响', wx.getStorageSync('userNickname'), '少年史官');
  eq('2.4 地点进度不受影响', JSON.stringify(progress.getLocationStates('dufu')), statesBefore);
  eq('2.5 锚点不受影响', JSON.stringify(progress.getAnchors('dufu')), anchorsBefore);
  eq('2.6 卡片按新资料渲染', playerCard.resolveRoleCard(p, false).avatarName, '形象三');
}

// ============ 3. 清除后角色与进度清空 ============
console.log('--- 3. 清除后回到未创建 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar02', '小杜');
  progress.completeLocation('dufu', 'luoyang', memory.DUFU_ORDER);
  progress.resetAll();

  eq('3.1 角色已清空', progress.getPlayerProfile('dufu'), null);
  eq('3.2 不残留非法态', progress.hasInvalidPlayerProfile('dufu'), false);
  eq('3.3 卡片回到 none', playerCard.resolveRoleCard(
    progress.getPlayerProfile('dufu'), progress.hasInvalidPlayerProfile('dufu')
  ).status, 'none');
  eq('3.4 地点进度已清空', JSON.stringify(progress.getLocationStates('dufu')), '{}');
}

// ============ 4. 终章：显示当前姓名，三外观一致 ============
console.log('--- 4. 终章回望 ---');
{
  const allDone = memory.DUFU_ORDER.slice();
  const base = { lineId: 'dufu', currentLocationId: 'xiangjiang', completedLocations: allDone, displayName: '小杜' };
  const recap = dufuRecap.buildRecap(base);
  eq('4.1 首行为「同行者：姓名」', recap[0], '同行者：小杜');
  ok('4.2 回望使用「一次次重逢」而非全程肉身伴随',
    recap.some(l => l.indexOf('一次次重逢') >= 0) && recap.every(l => l.indexOf('一直陪') < 0));
  ok('4.3 回望含初见与收束', recap.some(l => l.indexOf('洛阳') >= 0) && recap.some(l => l.indexOf('湘江') >= 0));
  ok('4.4 回望条数受控（≤ 上限+2 行）', recap.length <= dufuRecap.MAX_RECAP_LINES + 2);

  // 三种外观：buildRecap 不接收 avatarId，同一入参必须得到完全相同正文
  const r1 = dufuRecap.buildRecap(Object.assign({}, base, { avatarId: 'avatar01' }));
  const r2 = dufuRecap.buildRecap(Object.assign({}, base, { avatarId: 'avatar02' }));
  const r3 = dufuRecap.buildRecap(Object.assign({}, base, { avatarId: 'avatar03' }));
  ok('4.5 三外观终章正文完全一致', JSON.stringify(r1) === JSON.stringify(r2) && JSON.stringify(r2) === JSON.stringify(r3));
  ok('4.6 终章正文不含外观信息', recap.every(l => !/avatar0[123]|形象[一二三]/.test(l)));

  // 不根据外观推断性别/职业/性格；不把玩家写成改变命运的人
  const joined = recap.join('');
  ok('4.7 不写职业/性别推断', !/书生|引路人|旅人|他是一名|她是一名/.test(joined));
  ok('4.8 不把玩家写成改变杜甫命运的人', !/因为你|你救|你改变|若不是你/.test(joined));

  // 空完成列表不编造：收束时当前地点尚未计入、也没有历史完成地点 → 只给姓名行
  eq('4.9 无任何完成地点时只给姓名行',
    dufuRecap.buildRecap({ lineId: 'dufu', currentLocationId: '', completedLocations: [] }),
    ['同行者：同行者']);

  // 重温：不宣称走过全程
  const replayRecap = dufuRecap.buildRecap(Object.assign({}, base, { isReplay: true }));
  ok('4.10 重温回望不列全程事件', replayRecap.every(l => l.indexOf('会当凌绝顶') < 0));
  ok('4.11 重温回望说明正式数据未被改写', replayRecap.some(l => l.indexOf('没有') >= 0 || l.indexOf('未改变') >= 0));

  // 非杜甫线不显示
  eq('4.12 李白线无回望', dufuRecap.buildRecap({ lineId: 'libai', currentLocationId: 'baidi', completedLocations: ['baidi'], displayName: 'x' }), []);
  eq('4.13 苏轼线无回望', dufuRecap.buildRecap({ lineId: 'sushi', currentLocationId: 'jinshan', displayLocations: [], displayName: 'x' }), []);
  eq('4.14 shouldShowRecap 只对杜甫线且有姓名成立',
    [dufuRecap.shouldShowRecap('dufu', '小杜'), dufuRecap.shouldShowRecap('dufu', ''), dufuRecap.shouldShowRecap('libai', '小杜')],
    [true, false, false]);
}

// ============ 5. replay 从 start 进入，正式检查点不变 ============
console.log('--- 5. 起点与检查点 ---');
{
  reset();
  const nodes = quests.taishan.nodes;
  const start = quests.taishan.start;
  eq('5.1 continue 有检查点时从检查点续',
    playMode.resolveStartNode({ mode: 'continue', start, checkpoint: { nodeId: 'n5' }, nodes }), 'n5');
  eq('5.2 replay 恒从 start 开始（忽略检查点）',
    playMode.resolveStartNode({ mode: 'replay', start, checkpoint: { nodeId: 'n5' }, nodes }), start);
  eq('5.3 检查点指向已删除节点时回退 start',
    playMode.resolveStartNode({ mode: 'continue', start, checkpoint: { nodeId: 'no-such-node' }, nodes }), start);
  eq('5.4 无检查点时从 start',
    playMode.resolveStartNode({ mode: 'continue', start, checkpoint: null, nodes }), start);
  eq('5.5 缺参数安全返回 start', playMode.resolveStartNode({ start }), start);

  // 真实存储：replay 期间不动检查点 → 正式 continue 仍回到原位置
  progress.saveLocationCheckpoint('dufu', 'taishan', 'n5');
  const ckptBefore = JSON.stringify(progress.getLocationCheckpoint('dufu', 'taishan'));
  // 模拟 replay 期间「进入新节点」但被守卫拦住（不写）
  if (playMode.shouldPersist('replay')) progress.saveLocationCheckpoint('dufu', 'taishan', 'n12');
  eq('5.6 replay 不覆盖正式检查点', JSON.stringify(progress.getLocationCheckpoint('dufu', 'taishan')), ckptBefore);
  eq('5.7 replay 退出后 continue 仍回到原检查点',
    playMode.resolveStartNode({ mode: 'continue', start, checkpoint: progress.getLocationCheckpoint('dufu', 'taishan'), nodes }), 'n5');
}

// ============ 6. replay 不落盘（源码级护栏 + 存储级验证）============
console.log('--- 6. replay 写盘隔离 ---');
{
  eq('6.1 replay 不允许写盘', playMode.shouldPersist('replay'), false);
  eq('6.2 continue 允许写盘', playMode.shouldPersist('continue'), true);
  eq('6.3 缺省模式按正式处理', playMode.shouldPersist(undefined), true);
  eq('6.4 isReplay 只认字符串 replay', [playMode.isReplay('replay'), playMode.isReplay('REPLAY'), playMode.isReplay('')], [true, false, false]);

  // 存储级：锚点/地点状态/诗笺/通关时间在 replay 守卫下不变
  reset();
  progress.completeLocation('dufu', 'taishan', memory.DUFU_ORDER);
  progress.addAnchor('dufu', 'a2');
  progress.saveLocationRecord('dufu', 'taishan', { completedAt: 1000, earnedAt: 500, anchors: ['a2'] });
  progress.startLocationTask('dufu', 'taishan', 't1');
  const before = {
    states: JSON.stringify(progress.getLocationStates('dufu')),
    anchors: JSON.stringify(progress.getAnchors('dufu')),
    record: JSON.stringify(progress.getLocationRecord('dufu', 'taishan')),
    tasks: JSON.stringify(progress.getLocationProfile('dufu', 'taishan'))
  };

  // 模拟 replay 中的各种"本该写"的动作——全部经 shouldPersist 拦截后都不执行
  const write = playMode.shouldPersist('replay');
  if (write) {
    progress.addAnchor('dufu', 'a9');
    progress.completeLocation('dufu', 'xiangjiang', memory.DUFU_ORDER);
    progress.saveLocationRecord('dufu', 'taishan', { completedAt: 9999 });
    progress.completeTaskStep('dufu', 'taishan', 't1', 's1');
    progress.savePlayerProfile('dufu', 'avatar03', '改过的名字');
  }
  eq('6.5 replay 不写地点状态', JSON.stringify(progress.getLocationStates('dufu')), before.states);
  eq('6.6 replay 不写锚点', JSON.stringify(progress.getAnchors('dufu')), before.anchors);
  eq('6.7 replay 不改诗笺记录与通关时间', JSON.stringify(progress.getLocationRecord('dufu', 'taishan')), before.record);
  eq('6.8 replay 不写任务步骤', JSON.stringify(progress.getLocationProfile('dufu', 'taishan')), before.tasks);
  eq('6.9 replay 不改角色档案', progress.getPlayerProfile('dufu'), null);

  // 源码护栏：chat.js 里每个 progress 写入调用都必须带 replay 守卫。
  // 判定方式：
  //   ① 跳过注释行（注释里提到 `progress.addAnchor()` 不算写入）；
  //   ② 同一行带守卫，或
  //   ③ 位于某个 `if (_shouldWriteProgress()) { ... }` 块内部（向上按花括号配平找块头）。
  const chatSrc = fs.readFileSync(path.join(ROOT, 'miniprogram/pages/chat/chat.js'), 'utf8');
  const lines = chatSrc.split(/\r?\n/);
  const WRITE_FNS = [
    'addAnchor', 'saveLocationCheckpoint', 'clearLocationCheckpoint',
    'completeLocation', 'saveLocationRecord', 'completePeriod', 'saveRecord',
    'addLineInsightEvent', 'grantWitnessItem', 'startLocationTask',
    'completeTaskStep', 'completeLocationTask', 'addTrustEvent',
    'savePlayerProfile', 'setLocationState'
  ];
  const isCommentLine = s => /^\s*(\/\/|\*|\/\*)/.test(s);

  // 从 index 行向上找：若该行处于某个守卫 if 的花括号块内，返回 true
  function enclosedByGuard(index) {
    let depth = 0;
    for (let i = index - 1; i >= 0; i--) {
      const line = lines[i];
      if (isCommentLine(line)) continue;
      // 先统计本行的右花括号（闭合更深层块），再判断左花括号
      const closes = (line.match(/\}/g) || []).length;
      const opens = (line.match(/\{/g) || []).length;
      depth += closes;
      if (depth === 0 && opens > 0) {
        // 找到当前块的块头行。多行条件的 if 语句里，守卫条件可能写在上一行
        // （如 `if (a && this._shouldWriteProgress() && b` / `&& c) {`），
        // 因此把块头连同前几行拼起来判断。
        const headFrom = Math.max(0, i - 3);
        const head = lines.slice(headFrom, i + 1)
          .filter(l => !isCommentLine(l))
          .join(' ');
        if (/_shouldWriteProgress\(\)|playMode\.shouldPersist/.test(head)) return true;
        // 块头不带守卫：继续向外层找
        depth -= opens;
        depth = Math.max(depth, 0);
        continue;
      }
      depth -= opens;
      if (depth < 0) depth = 0;
    }
    return false;
  }

  const unguarded = [];
  lines.forEach((line, i) => {
    if (isCommentLine(line)) return;                       // ① 注释不算
    const m = /progress\.([A-Za-z]+)\s*\(/.exec(line);
    if (!m || WRITE_FNS.indexOf(m[1]) < 0) return;
    if (/_shouldWriteProgress\(\)|playMode\.shouldPersist/.test(line)) return;   // ② 同行守卫
    if (enclosedByGuard(i)) return;                        // ③ 块内守卫
    unguarded.push(m[1] + ' @line ' + (i + 1));
  });
  eq('6.10 chat.js 所有 progress 写入都带 replay 守卫', unguarded, []);

  // 自检：证明上面的扫描器不是"永远通过"。用一段合成源码验证它确实能抓出漏守卫的写入。
  const synthetic = [
    'onFoo() {',
    '  progress.addAnchor("dufu", "a1");',                    // 漏守卫 → 应被抓到
    '  // progress.saveRecord(...)  注释不算',
    '  if (this._shouldWriteProgress()) {',
    '    progress.saveLocationRecord("dufu", "x", {});',        // 块内守卫 → 合法
    '  }',
    '}'
  ];
  function scan(linesArr) {
    const found = [];
    linesArr.forEach((line, i) => {
      if (isCommentLine(line)) return;
      const m = /progress\.([A-Za-z]+)\s*\(/.exec(line);
      if (!m || WRITE_FNS.indexOf(m[1]) < 0) return;
      if (/_shouldWriteProgress\(\)|playMode\.shouldPersist/.test(line)) return;
      let depth = 0, guarded = false;
      for (let j = i - 1; j >= 0; j--) {
        const L = linesArr[j];
        if (isCommentLine(L)) continue;
        const c = (L.match(/\}/g) || []).length;
        const o = (L.match(/\{/g) || []).length;
        depth += c;
        if (depth === 0 && o > 0) {
          const head = linesArr.slice(Math.max(0, j - 3), j + 1).join(' ');
          if (/_shouldWriteProgress\(\)|playMode\.shouldPersist/.test(head)) { guarded = true; break; }
          depth -= o;
          if (depth < 0) depth = 0;
          continue;
        }
        depth -= o;
        if (depth < 0) depth = 0;
      }
      if (!guarded) found.push(m[1]);
    });
    return found;
  }
  eq('6.11 扫描器自检：能抓出漏守卫的写入，且不误报块内与注释', scan(synthetic), ['addAnchor']);

  // 也不允许出现绕过 play-mode 的裸 mode 判断
  ok('6.12 chat.js 无裸 `_mode === \'replay\'` 判断（统一走 play-mode）',
    !/_mode\s*[!=]==\s*'replay'/.test(chatSrc));
}

// ============ 7. 通关终章后重温泰山：AI 记忆不含后期地点 ============
console.log('--- 7. 重温时 AI 记忆时间截断 ---');
{
  const allDone = memory.DUFU_ORDER.slice();
  const evts = memory.resolveAvailableEvents('taishan', allDone);
  const ids = evts.map(e => e.sourceLocationId);
  ok('7.1 重温泰山不注入成都', ids.indexOf('chengdu') < 0);
  ok('7.2 不注入夔州', ids.indexOf('kuizhou') < 0);
  ok('7.3 不注入湘江终章', ids.indexOf('xiangjiang') < 0);
  ok('7.4 只含泰山之前的地点', ids.every(id => memory.DUFU_ORDER.indexOf(id) < memory.DUFU_ORDER.indexOf('taishan')));
  ok('7.5 不含泰山后才发生的李杜同游', ids.indexOf('qizhao') < 0);
  // 洛阳首见仍无记忆（即使全线通关）
  eq('7.6 重温洛阳仍是初见，无共同经历', memory.resolveAvailableEvents('luoyang', allDone), []);
}

// ============ 8. replay 退出再 continue 回到原检查点 ============
console.log('--- 8. 退出重温后继续正式旅程 ---');
{
  reset();
  // 正式旅程：洛阳已完成、泰山进行到 n5
  progress.completeLocation('dufu', 'luoyang', memory.DUFU_ORDER);
  progress.saveLocationCheckpoint('dufu', 'taishan', 'n5');

  // 进入洛阳重温（已完成 → map 传 replay）：不写检查点
  if (playMode.shouldPersist('replay')) {
    progress.saveLocationCheckpoint('dufu', 'luoyang', 'n3');
    progress.clearLocationCheckpoint('dufu', 'luoyang');
  }
  eq('8.1 重温洛阳未写检查点', progress.getLocationCheckpoint('dufu', 'luoyang'), null);

  // 回到泰山 continue：仍从 n5 续
  const nodes = quests.taishan.nodes;
  eq('8.2 continue 仍从原检查点 n5 续',
    playMode.resolveStartNode({
      mode: 'continue',
      start: quests.taishan.start,
      checkpoint: progress.getLocationCheckpoint('dufu', 'taishan'),
      nodes
    }), 'n5');
}

// ============ 9. 三条线同行者与终章隔离 ============
console.log('--- 9. 三线隔离 ---');
{
  reset();
  progress.savePlayerProfile('dufu', 'avatar01', '小杜');
  progress.savePlayerProfile('libai', 'avatar02', '小白');
  // 苏轼暂未创建角色

  const dufuProfile = progress.getPlayerProfile('dufu');
  const libaiProfile = progress.getPlayerProfile('libai');

  eq('9.1 地图同行者：杜甫线显示杜甫名', playerCard.companionName('dufu', dufuProfile), '小杜');
  eq('9.2 地图同行者：李白线显示李白名', playerCard.companionName('libai', libaiProfile), '小白');
  // 无 confirmed 档案不显示同行者
  eq('9.3 地图同行者：苏轼无档案为空', playerCard.companionName('sushi', progress.getPlayerProfile('sushi')), '');
  // 各线各自读档案，不把杜甫名显示到李白/苏轼地图上
  eq('9.4 李白线读到的是李白档案而非杜甫', progress.getPlayerProfile('libai').displayName, '小白');
  eq('9.5 苏轼无角色档案', progress.getPlayerProfile('sushi'), null);

  // 李白/苏轼的终章不出现杜甫回望
  eq('9.6 李白终章无杜甫回望', dufuRecap.buildRecap({ lineId: 'libai', currentLocationId: 'dangtu', completedLocations: ['dangtu'], displayName: '小白' }), []);
  eq('9.6b 苏轼终章无杜甫回望', dufuRecap.buildRecap({ lineId: 'sushi', currentLocationId: 'jinshan', completedLocations: ['jinshan'], displayName: '小苏' }), []);
  // 李白/苏轼原有结算字段不受影响（completePeriod 仍按各自时期顺序工作）
  const libaiStates = progress.computeStates('libai', ['p1', 'p2']);
  ok('9.7 李白时期状态计算正常', libaiStates.p1 === 'active' && libaiStates.p2 === 'locked');

  // 三个纯模块都不接收 avatarId 作为分支条件（防未来加外观专属结局）
  const srcs = ['player-card.js', 'dufu-recap.js', 'play-mode.js'].map(f =>
    fs.readFileSync(path.join(ROOT, 'miniprogram/utils', f), 'utf8'));
  ok('9.8 三个模块无 avatarId 分支', srcs.every(s => s.indexOf('avatarId ===') < 0 && s.indexOf("avatarId === '") < 0));
}

// ============ 10. 动作型选项端到端（真实剧本，非合成） ============
console.log('--- 10. 动作型选项 ---');
{
  const variants = require(path.join(ROOT, 'miniprogram/utils/story-variants.js'));
  let totalOpts = 0;
  let actionCount = 0;
  let talkCount = 0;
  const wrong = [];

  Object.keys(quests).forEach((lid) => {
    const nodes = quests[lid].nodes || {};
    Object.keys(nodes).forEach((nid) => {
      const n = nodes[nid];
      (n.options || []).forEach((o, i) => {
        if (!o || !o.text) return;
        totalOpts++;
        const pn = variants.playerChoiceNode(o);
        if (!pn) { wrong.push(lid + '/' + nid + '[' + i + '] 返回 null'); return; }

        const text = String(o.text).trim();
        const isWholeBracket = /^（[^）]*）$/.test(text);   // 整个选项就是一个括号
        if (o.actionOnly === true) {
          actionCount++;
          if (pn.type !== 'action') wrong.push(lid + '/' + nid + '[' + i + '] 标了 actionOnly 却不是 action');
          if (pn.speaker !== undefined) wrong.push(lid + '/' + nid + '[' + i + '] action 节点带了 speaker');
        } else {
          talkCount++;
          if (pn.type !== 'talk') wrong.push(lid + '/' + nid + '[' + i + '] 未标 actionOnly 却不是 talk');
          // 括号包住整句却没有台词 → 说明漏标（呈现上会被当台词念出来）
          if (isWholeBracket) wrong.push(lid + '/' + nid + '[' + i + '] 纯括号选项漏标 actionOnly：' + text);
        }
      });
    });
  });

  eq('10.1 剧本选项总数', totalOpts, 259);
  eq('10.2 动作型选项 119 条', actionCount, 119);
  eq('10.3 台词型选项 140 条', talkCount, 140);
  eq('10.4 无漏标/错标/空结果', wrong, []);

  // 动作节点不带 speaker、且文本原样保留（页面据 type==='action' 走旁白行）
  const sample = variants.playerChoiceNode({ text: '（望着山下的天地，没说话）', actionOnly: true, next: 'n12c' });
  eq('10.5 动作节点结构', [sample.type, sample.speaker, sample.text, sample.next],
    ['action', undefined, '（望着山下的天地，没说话）', 'n12c']);
  // 台词型仍带 speaker:'player'
  const sampleTalk = variants.playerChoiceNode({ text: '（问）这山，爬上去要多久？', next: 'n3b' });
  eq('10.6 台词节点结构', [sampleTalk.type, sampleTalk.speaker], ['talk', 'player']);
}

// ============ 汇总 ============
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('ALL PASS  ' + pass + ' 项断言全部通过');
process.exit(0);
