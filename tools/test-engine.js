// tools/test-engine.js —— 探究引擎单元测试（不需要云环境/网络，纯本地可复现）
//
// 运行：node tools/test-engine.js
// 用途：① 开发期回归；② 竞赛材料中"测试说明 / 过程可核验"的证据
//
// 覆盖：
//   A. 意图分类（A命中 / B答不出三级提示梯 / C偏离 / D泛谈 / 确认档）
//   B. 命中检测、覆盖合并、出题轮换、出题上限
//   C. Prompt 组装（人设、史料、本轮指令、禁区是否都在）
//   D. 史料卡知识库完整性（张数 / 锚点值域与全覆盖 / quiz 结构 / id 唯一）

const path = require('path');
const engine = require(path.join(__dirname, '../miniprogram/cloudfunctions/chat/engine.js'));
const KNOWLEDGE = require(path.join(__dirname, '../miniprogram/cloudfunctions/chat/knowledge.js'));
const lineDufu = require(path.join(__dirname, '../miniprogram/utils/stories/line-dufu.js'));
const lineLibai = require(path.join(__dirname, '../miniprogram/utils/stories/line-libai.js'));

let pass = 0;
const failures = [];

function ok(name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push(name + (detail ? '  → ' + detail : ''));
}

function eq(name, actual, expected) {
  ok(name, actual === expected, 'got ' + JSON.stringify(actual) + ', want ' + JSON.stringify(expected));
}

// ============ A. 意图分类 ============
console.log('--- A. 意图分类 ---');

const cards = KNOWLEDGE.dufu.p1;
ok('A0 史料卡非空', cards && cards.length > 0);

// 找到一张卡，用它的 keyword 造命中输入
const c0 = cards[0];
const hitMsg = '我觉得是' + c0.keywords[0] + '吧';
const hitCards = engine.matchCards(hitMsg, cards);
ok('A1 命中检测：说出关键词即命中', hitCards.some(c => c.id === c0.id));
eq('A2 命中且语气确定 → hit', engine.decideStage(hitMsg, hitCards, 0), 'hit');
eq('A3 命中但语气不确定 → confirm',
  engine.decideStage('不知道是不是' + c0.keywords[0], engine.matchCards('不知道是不是' + c0.keywords[0], cards), 0),
  'confirm');
eq('A4 一句不相关的话 → probe', engine.decideStage('嗯嗯', [], 0), 'probe');
eq('A5 答不出第 1 次 → hint1', engine.decideStage('我不知道', [], 1), 'hint1');
eq('A6 答不出第 2 次 → hint2', engine.decideStage('还是不会', [], 2), 'hint2');
eq('A7 答不出第 3 次 → answer', engine.decideStage('真不知道', [], 3), 'answer');
eq('A8 另起话题 → redirect', engine.decideStage('他后来是怎么死的？', [], 0), 'redirect');

// 提示梯计数：历史里累计 3 次"不知道"应封顶在 3
const lvl = engine.hintLevel(
  [{ role: 'user', content: '不知道' }, { role: 'user', content: '不会' },
   { role: 'user', content: '想不出' }, { role: 'user', content: '不懂' },
   { role: 'user', content: '真的不知道' }],
  '不知道'
);
eq('A9 提示梯封顶为 3', lvl, 3);
eq('A10 无求助信号时档位为 0', engine.hintLevel([{ role: 'user', content: '泰山在哪' }], '嗯'), 0);

// ============ B. 覆盖/出题 ============
console.log('--- B. 覆盖与出题 ---');

const merged = engine.mergeCovered(['k_fake_not_exist', cards[1].id], [cards[0]], cards);
ok('B1 非法卡 id 被剔除', merged.indexOf('k_fake_not_exist') < 0);
ok('B2 合法卡 id 保留', merged.indexOf(cards[0].id) >= 0 && merged.indexOf(cards[1].id) >= 0);
eq('B3 去重生效', engine.mergeCovered([cards[0].id], [cards[0]], cards).length, 1);

ok('B4 覆盖不足时不出题', !engine.isReady([cards[0].id], cards, []));
const threeIds = cards.slice(0, 3).map(c => c.id);
ok('B5 覆盖 3 张即可出题', engine.isReady(threeIds, cards, []));
ok('B6 已出满 3 题后不再出题', !engine.isReady(threeIds, cards, ['a', 'b', 'c']));

const q1 = engine.pickQuiz(cards, threeIds, []);
ok('B7 pickQuiz 返回题目', !!(q1 && q1.q));
ok('B8 优先出「已覆盖且未考过」的卡', threeIds.indexOf(q1.cardId) >= 0, 'cardId=' + (q1 && q1.cardId));
const q2 = engine.pickQuiz(cards, threeIds, [q1.cardId]);
ok('B9 已考过的卡不会重复出', q2 && q2.cardId !== q1.cardId, 'q2=' + (q2 && q2.cardId));
ok('B10 题目结构完整', !!(q1.q && q1.options.length === 3 && typeof q1.answer === 'number'));

// ============ C. Prompt 组装 ============
console.log('--- C. Prompt 组装 ---');

const prompt = engine.buildSystemPrompt({
  npc: 'libai', questId: 'p3', cards: cards, coveredList: [cards[0].id],
  hitCards: [cards[1]], stage: 'hint2', freePrompt: '沉香亭上'
});
ok('C1 含 NPC 人名（李白，不是杜甫）', prompt.indexOf('你就是李白') >= 0);
ok('C2 不含错误人设（不应出现"你就是杜甫"）', prompt.indexOf('你就是杜甫') < 0);
ok('C3 含史料内容', prompt.indexOf(cards[0].title) >= 0);
ok('C4 含时代处境', prompt.indexOf('供奉翰林') >= 0);
ok('C5 含本轮指令（hint2 三选一台阶）', prompt.indexOf('三选一') >= 0);
ok('C6 含剧情场景', prompt.indexOf('沉香亭上') >= 0);
ok('C7 含人设禁区', prompt.indexOf('人设禁区') >= 0);
ok('C8 含苏格拉底追问心法', prompt.indexOf('苏格拉底') >= 0);
ok('C9 含已覆盖/未探究状态', prompt.indexOf('还没探究到的') >= 0);
ok('C10 无史料时明确禁止编造',
  engine.buildSystemPrompt({ npc: 'dufu', questId: 'p1', cards: [], coveredList: [], hitCards: [], stage: 'probe' })
    .indexOf('不得编造史实') >= 0);

// 每一档 stage 都要有对应指令（不能掉进 default 而当哑巴）
['hit', 'confirm', 'hint1', 'hint2', 'answer', 'redirect', 'safety', 'probe'].forEach((s) => {
  const t = engine.stageInstruction(s);
  ok('C11 stage=' + s + ' 有专属指令', !!t && t.length > 20 && t.indexOf('【本轮指令') >= 0);
});

// ============ D. 知识库完整性 ============
console.log('--- D. 知识库完整性 ---');

const ANCHORS = { dufu: lineDufu.anchors, libai: lineLibai.anchors };
const PERIODS = { dufu: ['p1', 'p2', 'p3', 'p4'], libai: ['p1', 'p2', 'p3', 'p4', 'p5'] };
const allIds = {};
let total = 0;
let structureBad = 0;

Object.keys(PERIODS).forEach((npc) => {
  const valid = ANCHORS[npc] || {};
  const covered = {};
  PERIODS[npc].forEach((p) => {
    const list = (KNOWLEDGE[npc] || {})[p] || [];
    ok('D1 ' + npc + ' ' + p + ' 有史料卡', list.length > 0, 'count=' + list.length);
    total += list.length;
    list.forEach((c) => {
      // 七字段齐全
      if (!(c.id && c.title && c.content && c.guide && c.keywords && c.anchor && c.quiz)) structureBad++;
      // quiz 结构
      if (!(c.quiz && c.quiz.q && Array.isArray(c.quiz.options) && c.quiz.options.length === 3
            && c.quiz.answer >= 0 && c.quiz.answer <= 2 && c.quiz.explain)) structureBad++;
      // anchor 值域
      if (!valid[c.anchor]) structureBad++;
      // id 唯一
      if (allIds[c.id]) structureBad++;
      allIds[c.id] = true;
      covered[c.anchor] = true;
    });
  });
  // 每个锚点至少被引用一次
  const missing = Object.keys(valid).filter(a => !covered[a]);
  ok('D2 ' + npc + ' 每个锚点都被史料卡覆盖', missing.length === 0, '未覆盖: ' + missing.join(','));
});

eq('D3 史料卡字段/quiz/锚点/id 全部合法', structureBad, 0);
eq('D4 史料卡总数（杜甫24+李白25）', total, 49);
eq('D5 杜甫卡数', Object.keys(KNOWLEDGE.dufu).reduce((s, p) => s + KNOWLEDGE.dufu[p].length, 0), 24);
eq('D6 李白卡数', Object.keys(KNOWLEDGE.libai).reduce((s, p) => s + KNOWLEDGE.libai[p].length, 0), 25);

// ============ 汇总 ============
console.log('\n=====================================');
if (failures.length) {
  console.log('FAILED  ' + failures.length + ' 项未通过（通过 ' + pass + ' 项）：');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
} else {
  console.log('ALL PASS  ' + pass + ' 项断言全部通过');
  process.exit(0);
}
