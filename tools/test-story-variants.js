// tools/test-story-variants.js —— 剧情节点解析与「玩家选项 → 发言/动作」转换测试（本地可复现）
//
// 背景（既有问题记录）：
//   本测试原为「泰山身份/信任变体」而写，断言 `taishan.nodes.n2a` 是 choice 节点、
//   并从 `options[0]` 取文本，还断言三种身份开场不同、信任解锁落第、任务步骤等。
//   2026-10-21 剧本升级为「22 地点含分镜」最终版后，泰山剧情重写：
//     · 全剧本不再有 roleVariants / trustVariants / trustVariant / tasks / effects 字段；
//     · n2a 从 choice 变为 talk（不再有 options）。
//   旧的职业/信任分支玩法已退场。本测试验证「新结构下 story-variants 纯函数的行为契约」：
//
// 覆盖：
//   A. resolveNode 在新剧本上是无副作用透传（身份/信任变体已退场；不传上下文也透传）
//   B. playerChoiceNode 发言/动作转换契约：
//      · 普通选项 → player talk（spokenText 优先、否则回退按钮文字）
//      · actionOnly 纯动作 → action 节点（不再被当成角色口述，交给页面按动作行呈现）
//      · result 优先于 next；空文本/非法入参返回 null
//   C. resolveNode 的通用变体契约仍成立（兼容保留，防后续改坏公共工具）
//
// 运行：node tools/test-story-variants.js

const path = require('path');
const variants = require(path.join(__dirname, '../miniprogram/utils/story-variants.js'));
const quests = require(path.join(__dirname, '../miniprogram/utils/stories/line-dufu-locations.generated.js'));

const taishan = quests.taishan;
let pass = 0;
const failures = [];

function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}
function eq(name, actual, expected) {
  ok(name, JSON.stringify(actual) === JSON.stringify(expected),
    'got ' + JSON.stringify(actual) + ', want ' + JSON.stringify(expected));
}

// ============ A. resolveNode 在新剧本上是无副作用透传 ============
console.log('--- A. 身份/信任变体退场后的透传 ---');
{
  // 新泰山不再有任何角色/信任变体字段
  let hasVariant = false;
  for (const nid in taishan.nodes) {
    const n = taishan.nodes[nid];
    if (n.roleVariants || n.trustVariants || n.trustVariant) hasVariant = true;
  }
  ok('A1 泰山剧本无 roleVariants/trustVariants/trustVariant', hasVariant === false);

  // chat.js 现在调用 resolveNode(sourceNode) 不传身份/信任上下文（见步骤五 D.2）
  const n3 = taishan.nodes.n3;
  const noCtx = variants.resolveNode(n3);
  ok('A2 不传上下文仍返回选择节点', noCtx && Array.isArray(noCtx.options) && noCtx.options.length === n3.options.length);

  // 用「旧身份/旧信任」上下文解析，也应原样返回（不再按身份改写）
  const resolved = variants.resolveNode(n3, { roleId: 'fellowScholar', trustScore: 99 });
  eq('A3 旧身份不改变 choice 节点选项数', resolved.options.length, n3.options.length);
  eq('A4 旧身份不改变选项文本', resolved.options.map(o => o.text), n3.options.map(o => o.text));
  eq('A5 旧身份不改变选项 next', resolved.options.map(o => o.next), n3.options.map(o => o.next));

  // talk 节点（原 n2a 已从 choice 变为 talk）解析后文本不变
  const n2a = taishan.nodes.n2a;
  ok('A6 新 n2a 是 talk 节点（不再是 choice）', n2a.type === 'talk' && !n2a.options);
  eq('A7 talk 节点解析后文本不变', variants.resolveNode(n2a, { roleId: 'mountainGuide', trustScore: 3 }).text, n2a.text);

  // resolveNode 不修改源节点（返回新对象）
  const before = JSON.stringify(n3);
  variants.resolveNode(n3, { roleId: 'fellowScholar', trustScore: 1 });
  ok('A8 resolveNode 不修改源节点', JSON.stringify(n3) === before);
}

// ============ B. playerChoiceNode 发言/动作转换契约 ============
console.log('--- B. 玩家选项转发言 / 动作 ---');
{
  // 普通选项（无 actionOnly、无 spokenText）→ 回退按钮文字，生成 player talk
  const opt = taishan.nodes.n3.options[1];   // （问）这山，爬上去要多久？
  const spoken = variants.playerChoiceNode(opt);
  ok('B1 生成玩家说话节点', spoken && spoken.type === 'talk' && spoken.speaker === 'player');
  eq('B2 无 spokenText 时回退按钮文字', spoken.text, opt.text);
  eq('B3 next 取 option.next', spoken.next, opt.next);

  // spokenText 优先
  const spokenTextNode = variants.playerChoiceNode({ text: '（望着山下，没说话）', spokenText: '这座山，真高。', next: 'n9' });
  eq('B4 spokenText 优先于 text', spokenTextNode.text, '这座山，真高。');
  eq('B5 spokenText 节点 type=talk/speaker=player', spokenTextNode.type, 'talk');
  eq('B6 spokenText 节点 next 正确', spokenTextNode.next, 'n9');

  // actionOnly 纯动作（无 spokenText）→ action 节点，不被当成口述
  const actionNode = variants.playerChoiceNode({ text: '（望着山下的天地，没说话）', actionOnly: true, next: 'n9' });
  ok('B7 actionOnly 生成 action 节点', actionNode && actionNode.type === 'action');
  eq('B8 action 节点不携带 speaker（不当作角色台词）', actionNode.speaker, undefined);
  eq('B9 action 节点保留动作文本', actionNode.text, '（望着山下的天地，没说话）');
  eq('B10 action 节点 next 正确', actionNode.next, 'n9');

  // actionOnly 但显式给了 spokenText → 按玩家台词处理（spokenText 优先）
  const actionSpoken = variants.playerChoiceNode({ text: '（沉默）', spokenText: '我陪你站一会儿。', actionOnly: true, next: 'n9' });
  ok('B11 actionOnly + spokenText 仍是玩家台词', actionSpoken.type === 'talk' && actionSpoken.speaker === 'player');
  eq('B12 actionOnly + spokenText 文本为 spokenText', actionSpoken.text, '我陪你站一会儿。');

  // result 优先于 next
  eq('B13 next 取 result（优先）', variants.playerChoiceNode({ text: '我愿意。', result: 'n9b', next: 'n9a' }).next, 'n9b');

  // 空文本 / 非法入参 → null
  ok('B14 空文本返回 null', variants.playerChoiceNode({ text: '  ', next: 'n9' }) === null);
  ok('B15 actionOnly 空文本返回 null', variants.playerChoiceNode({ text: '  ', actionOnly: true, next: 'n9' }) === null);
  ok('B16 非法入参返回 null', variants.playerChoiceNode(null) === null && variants.playerChoiceNode('x') === null);
}

// ============ C. resolveNode 通用变体契约仍成立（兼容保留） ============
console.log('--- C. 公共工具变体契约（防改坏） ---');
{
  // 合成节点：roleVariants 按身份替换文本
  const roleNode = {
    type: 'talk', npc: true,
    text: '默认开场',
    roleVariants: { fellowScholar: { text: '同行书生开场' }, mountainGuide: { text: '引路人开场' } },
    next: 'n2'
  };
  eq('C1 roleVariants 按身份解析',
    variants.resolveNode(roleNode, { roleId: 'fellowScholar', trustScore: 0 }).text, '同行书生开场');
  eq('C2 未命中身份回退默认',
    variants.resolveNode(roleNode, { roleId: 'passingTraveler', trustScore: 0 }).text, '默认开场');

  // 合成节点：trustVariants 按信任阈值解锁
  const trustNode = {
    type: 'talk', npc: true,
    text: '泛泛而谈',
    trustVariants: [{ minTrust: 2, text: '袒露心事' }],
    next: 'n8'
  };
  eq('C3 低信任不命中变体',
    variants.resolveNode(trustNode, { roleId: 'fellowScholar', trustScore: 1 }).text, '泛泛而谈');
  eq('C4 高信任命中变体',
    variants.resolveNode(trustNode, { roleId: 'fellowScholar', trustScore: 2 }).text, '袒露心事');

  // 条件字段（minTrust/maxTrust/roleIds）不泄漏到结果里
  const clean = variants.resolveNode(trustNode, { roleId: 'fellowScholar', trustScore: 2 });
  ok('C5 条件字段被清理', clean.minTrust === undefined && clean.maxTrust === undefined && clean.roleIds === undefined);
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
