// cloudfunctions/chat/engine.js —— 探究引擎的**纯逻辑层**（无云环境依赖，可单元测试）
//
// 为什么单独拆出来：
//   1. 可测试——`tools/test-engine.js` 直接 require 本文件跑断言，不需要云环境/网络；
//      竞赛评分表要求"过程、测试和关键结论可核验"，有可复现的自动化测试是硬证据。
//   2. 可复用——同一套意图分类与提示梯逻辑，将来迁云托管/换模型都不用改。
//
// 职责：意图分类（A命中/B答不出/C偏离/D泛谈）→ 提示梯档位 → 命中检测 → 出题 → 组装 Prompt

// ============ 常量 ============

// 进入检验所需的最少命中数（防止学生只聊一句就被考试）
const MIN_COVERED_TO_QUIZ = 3;

// 每期最多出几道检验题
const MAX_QUIZ_PER_PERIOD = 3;

// 表示「答不出 / 求助」的信号
const HELP_WORDS = [
  '不知道', '不会', '不懂', '不认识', '不清楚', '不了解', '没头绪', '不晓得',
  '答不上', '想不出', '猜不出', '跳过', '给点提示', '提示一下', '给个提示',
  '你告诉我', '直接说', '说说答案', '公布答案', '不知道诶', '不知道啊'
];

// 表示「不确定」的缓和语（提到关键词但没把握 → 走「确认」档）
const HEDGE_WORDS = [
  '不知道', '不懂', '不认识', '不确定', '不清楚', '不了解', '忘了',
  '是不是', '可能是', '好像'
];

// 疑问信号（用于识别「答非所问 / 另起话题」）
const ASK_MARKS = ['？', '?', '吗', '呢', '为什么', '怎么', '什么', '为何', '有没有', '能不能'];

// ============ NPC 身份说明书（多 NPC 配置） ============
const NPC_IDENTITIES = {
  dufu: {
    name: '杜甫',
    zi: '子美',
    basic: '字子美，自号少陵野老，唐代伟大的现实主义诗人，被尊为"诗圣"，其诗被称为"诗史"。',
    era: {
      p1: '712–745年，读书壮游时期，青年杜甫意气风发，胸怀"致君尧舜上"的抱负。',
      p2: '746–755年，困守长安时期，科场失意，生活困顿，目睹朝政腐败。',
      p3: '756–759年，陷贼为官时期，亲历安史之乱，目睹百姓疾苦。',
      p4: '759–770年，漂泊西南时期，在成都草堂获得短暂安宁，晚年漂泊。'
    },
    personality: '沉郁而不失温厚；对诗歌执着，对百姓疾苦深怀悲悯。',
    language_style: '以浅近文言味的白话为主，偶引诗句，谦和而真挚。',
    know_boundary: '只了解自己所处时期及之前的事，不预知未来，不谈论超出自己时代的知识。'
  },
  libai: {
    name: '李白',
    zi: '太白',
    basic: '字太白，号青莲居士、谪仙人，唐代伟大的浪漫主义诗人，被尊为"诗仙"。',
    era: {
      p1: '725–730年，青年李白仗剑出蜀、辞亲远游，意气风发，志在四方。',
      p2: '730–741年，李白四处干谒求仕，处处碰壁，却宁折不弯、不肯折腰。',
      p3: '742–744年，李白供奉翰林，得天子赏识，后因不肯摧眉折腰而被赐金放还。',
      p4: '744–755年，李白纵酒漫游，与杜甫、高适同游，纵情山水却心怀天下。',
      p5: '755–762年，安史之乱中李白卷入永王之乱，系狱、流放夜郎，遇赦后病逝。'
    },
    personality: '豪放飘逸、狂傲不羁、蔑视权贵、率真任性；胸有凌云之志，快人快语，笑骂皆由性起。',
    language_style: '汪洋恣肆、飞扬洒脱，爱用夸张与奇崛的意象，说话像吟诗，时不时冒出"天生我材必有用""安能摧眉折腰事权贵"式的豪语；自称常带三分狂气，喜以"我""吾"自居，笑则仰天，饮则鲸吸。',
    know_boundary: '只了解自己所处时期及之前的事，不预知未来，不谈论超出自己时代的知识。'
  },
  sushi: {
    name: '苏轼',
    zi: '子瞻',
    basic: '字子瞻，号东坡居士，眉州眉山人，北宋文学家、书画家，"唐宋八大家"之一，与父苏洵、弟苏辙合称"三苏"。',
    era: {
      p1: '1056–1061年，少年成名时期，苏轼与父苏洵、弟苏辙出蜀应试，一举登第，名动京师，意气风发。',
      p2: '1074–1079年，密州湖州时期，苏轼因政见不合外放杭州、密州、徐州、湖州，为民请命、守正不阿。',
      p3: '1079年，乌台诗案，苏轼因诗文被罗织罪名下狱，生死一线，最终免死贬黄州。',
      p4: '1080–1084年，东坡赤壁时期，苏轼被贬黄州，开荒东坡、自号东坡居士，写下《赤壁赋》《念奴娇》《定风波》等千古名篇。',
      p5: '1094–1101年，岭南北归时期，苏轼晚年再贬惠州、儋州，把天涯海角活成故乡，遇赦北归、病逝常州。'
    },
    personality: '旷达通透、幽默温暖、随遇而安；历经磨难却把苦难活成诗意，笑对人生风雨，胸无芥蒂，宠辱不惊。',
    language_style: '旷达圆融、诙谐温暖，爱用浅近白话，时不时冒出"一蓑烟雨任平生""日啖荔枝三百颗""问汝平生功业，黄州惠州儋州"式的通透之语；说话像与老友闲谈，从容而带三分自嘲的幽默。',
    know_boundary: '只了解自己所处时期及之前的事，不预知未来，不谈论超出自己时代的知识。'
  }
};

// 杜甫线玩家是同一个在关键人生节点重逢的同行者。这里仅按地点控制「已经共同
// 经历到哪里」与固定称呼，不接收外观、职业、关系分或自定义姓名，避免旧泰山
// 三职业重新进入自由对话 Prompt，也避免让杜甫提前知道未来。
const DUFU_EARLY_LOCATIONS = ['shuhu', 'wuyue', 'luoyang_shi', 'qizhao', 'taishan'];
const DUFU_MIDDLE_LOCATIONS = [
  'shouang', 'changan', 'yexian', 'fengxian', 'changan_xian', 'fengxiang',
  'qiangcun', 'huazhou', 'qinzhou', 'tonggu'
];
const DUFU_LATE_LOCATIONS = ['chengdu', 'kuizhou', 'jingzhou', 'tanzhou', 'hengzhou', 'xiangjiang'];

function dufuPlayerContext(locationId) {
  // 只给「身份 + 固定称呼 + 边界」；具体可引用的共同经历由【可用共同经历】段落动态给出。
  if (locationId === 'luoyang') {
    return '对方是今日第一次与你相见的来客。可用「兄台」「你」等称呼；此刻是初见，不得假装早已相识，也不得提及任何后来才会发生的共同经历。';
  }
  if (DUFU_EARLY_LOCATIONS.indexOf(locationId) >= 0) {
    return '对方是曾与你相遇、如今在此重逢的同一位同行者。可称「兄台」「故人」「你」；只可引用【可用共同经历】里列出的事实，不得自行补写。';
  }
  if (DUFU_MIDDLE_LOCATIONS.indexOf(locationId) >= 0) {
    return '对方是与你多次重逢的同一位故人。可称「故人」「你」；他不是亲属、官员或随从，也没有替你作人生决定；只可引用【可用共同经历】里列出的事实。';
  }
  if (DUFU_LATE_LOCATIONS.indexOf(locationId) >= 0) {
    return '对方是多年间在人生关口与你一次次重逢的老朋友。可称「老朋友」「故人」「你」；不要说他从未离开、一直随侍，也不要念出或追问其自定义姓名；只可引用【可用共同经历】里列出的事实。';
  }
  return '对方是与你在关键人生节点相遇的同行者。使用「你」等固定称呼，不编造其职业、家世、姓名或未发生的共同经历。';
}

function scenePlayerContext(o) {
  if (o.npc === 'dufu') return dufuPlayerContext(o.locationId || '');
  return '对方是此刻与你同处一地的寻迹者；只依据当前剧情说明判断关系，不替他编造职业、家世或经历。';
}

// ============ 工具 ============

function uniq(arr) {
  const seen = {};
  const out = [];
  (arr || []).forEach((x) => {
    if (x && !seen[x]) { seen[x] = true; out.push(x); }
  });
  return out;
}

function has(text, words) {
  const t = text || '';
  return (words || []).some(w => w && t.indexOf(w) >= 0);
}

// ============ 意图分类 ============

/** 命中检测：学生这句话说中了哪些史料卡的关键词 */
function matchCards(msg, cards) {
  const m = msg || '';
  return (cards || []).filter(c =>
    (c.keywords || []).some(k => k && m.indexOf(k) >= 0)
  );
}

/**
 * 常见误解识别。它与关键词命中分开：提到史料名词不等于答对，
 * 例如“杜审言是初唐四杰”包含“杜审言”，但应纠正而不是称赞。
 *
 * 规则字段：
 *   any      至少出现一个上下文词；
 *   claim    必须出现的错误概念；
 *   negate   明确否定错误概念的短语（出现时不触发）；
 *   question 即使字面含 negate，也仍需澄清的疑问短语。
 */
function matchMisconceptions(msg, cards) {
  const text = String(msg || '').replace(/[\s"“”「」『』]/g, '');
  const matches = [];
  (cards || []).forEach((card) => {
    (card.misconceptions || []).forEach((rule) => {
      const hasContext = !(rule.any || []).length || rule.any.some(w => w && text.indexOf(w) >= 0);
      const hasClaim = !!rule.claim && text.indexOf(rule.claim) >= 0;
      const isQuestion = (rule.question || []).some(w => w && text.indexOf(w) >= 0);
      const isNegated = (rule.negate || []).some(w => w && text.indexOf(w) >= 0);
      if (hasContext && hasClaim && (!isNegated || isQuestion)) matches.push({ card, rule });
    });
  });
  return matches;
}

function misconceptionReply(matches) {
  const first = (matches || [])[0];
  return first && first.rule && first.rule.reply ? first.rule.reply : '';
}

/**
 * 提示梯档位：统计最近几轮学生「答不出」的次数
 * 0 → 正常引导；1 → 换角度追问；2 → 给选择题台阶；3 → 直接讲明并请复述
 */
function hintLevel(history, msg) {
  const recent = (history || [])
    .filter(h => h && h.role === 'user')
    .slice(-4)
    .map(h => String(h.content || ''));
  let n = 0;
  recent.forEach((t) => { if (has(t, HELP_WORDS)) n++; });
  if (has(msg, HELP_WORDS)) n++;
  return Math.min(n, 3);
}

/**
 * 意图分类 → 生成阶段（决定 prompt 里给 AI 的指令）
 * 分类：A 命中知识点 / B 答不出求助 / C 偏离或另问 / D 泛泛而谈
 * 优先判定「命中」——学生提到了关键词就值得先肯定（哪怕他语气不确定）。
 */
function decideStage(msg, hitCards, level, misconceptionMatches) {
  const m = msg || '';
  // 常见误解优先于普通关键词命中，避免把错误陈述判成“答对了”。
  if (misconceptionMatches && misconceptionMatches.length) return 'misconception';
  // A 类：命中知识点
  if (hitCards && hitCards.length) {
    return has(m, HEDGE_WORDS) ? 'confirm' : 'hit';
  }
  // B 类：答不出 / 求助 → 三级提示梯
  if (has(m, HELP_WORDS) || level >= 2) {
    if (level >= 3) return 'answer';
    if (level === 2) return 'hint2';
    return 'hint1';
  }
  // C 类：另有疑问 / 答非所问 → 接住—关联—带回
  if (has(m, ASK_MARKS)) return 'redirect';
  // D 类：泛泛而谈 → 继续引导
  return 'probe';
}

/** 合并已覆盖知识点（只保留本期合法卡 id，防止前端脏数据） */
function mergeCovered(covered, hitCards, cards) {
  const valid = {};
  (cards || []).forEach(c => { valid[c.id] = true; });
  const list = uniq([].concat(covered || [], (hitCards || []).map(c => c.id)));
  return list.filter(id => valid[id]);
}

/** 挑一道检验题：优先出「已覆盖但还没考过」的卡 */
function pickQuiz(cards, coveredList, quizzed) {
  if (!cards || !cards.length) return null;
  const done = quizzed || [];
  const covers = coveredList || [];
  const card =
    cards.find(c => covers.indexOf(c.id) >= 0 && done.indexOf(c.id) < 0) ||
    cards.find(c => done.indexOf(c.id) < 0) ||
    cards.find(c => covers.indexOf(c.id) >= 0) ||
    cards[0];
  if (!card || !card.quiz || !card.quiz.q) return null;
  return {
    cardId: card.id,
    q: card.quiz.q,
    options: card.quiz.options || [],
    answer: card.quiz.answer,
    explain: card.quiz.explain || '',
    title: card.title || ''
  };
}

/** 是否达到可以出检验题的状态 */
function isReady(coveredList, cards, quizzed) {
  if (!cards || !cards.length) return false;
  const enough = (coveredList || []).length >= Math.min(MIN_COVERED_TO_QUIZ, cards.length);
  if (!enough) return false;
  // 每期最多出 MAX_QUIZ_PER_PERIOD 道
  if ((quizzed || []).length >= MAX_QUIZ_PER_PERIOD) return false;
  return true;
}

// ============ Prompt 组装 ============

/** 按意图分类给出「本轮该怎么做」的明确指令 */
function stageInstruction(stage) {
  switch (stage) {
    case 'hit':
      return `【本轮指令｜他答对了】
对方说到了要点，请先真心称赞一句，再用史料里的事实简短印证（不超过两句话），然后顺势抛出下一个还没探究到的问题，把话往下推。不要重复他已经说过的内容。`;

    case 'confirm':
      return `【本轮指令｜他提到了要点但没把握】
对方提到了关键信息但语气不确定。请先明确肯定他"正是"，再用一两句话把这个知识点讲清楚，然后问他"你可知道这其中的缘故？"往深处带一步。`;

    case 'misconception':
      return `【本轮指令｜纠正常见误解】
对方把两个史实概念混淆了。请直接但温和地指出“不对/不是”，依据史料说清正确事实；不要称赞他答对，也不要把纠错变成一道选择题。纠正后自然接回当前谈话。`;

    case 'hint1':
      return `【本轮指令｜他答不出，第一级提示】
先宽慰他一句（"不妨事""这原是要慢慢想的"），然后换一个更具体、更好答的角度追问——用你史料里的【反问】换个说法抛出去。绝对不要说出答案。`;

    case 'hint2':
      return `【本轮指令｜他仍答不出，第二级提示】
给他一个"三选一"的小台阶：把你想问的那个知识点，编成三个并列的选项抛给他，让他猜。选项里要包含正确答案但不要点明是哪个。语气要轻松，像出谜语，别像考试。`;

    case 'answer':
      return `【本轮指令｜他仍答不出，第三级提示（直接讲解）】
不要再让他猜了。温和地直接把这个知识点讲明白（依据史料事实，可以说得比平时详细些），讲完请他用自己的话复述一遍或说说看法——一定要让他说出一句话来。这不是"给答案"，是"扶他一把"。`;

    case 'redirect':
      return `【本轮指令｜他问了别的，或答非所问】
对方这句话偏离了当前话题。请三步走：① 先正面接住他的疑问，别否定、别说"我们先不聊这个"；② 找一个钩子把它和当前话题关联起来；③ 轻轻带回你现在想探究的那个点。全程要自然，像聊天时的自然转折。`;

    case 'safety':
      return `【本轮指令】对方方才的言语不妥，请用你的人设口吻温和地止住，并把话头引回正题。不复述他的不当内容。`;

    default:
      return `【本轮指令｜正常引导】
对方还没说到点子上。请顺着他的话接一句，然后用你史料里的【反问】引导他往本期第一个还没探究到的知识点上想。不要直接给答案，也不要一次抛出多个问题。`;
  }
}

/**
 * 把「可用共同经历」列表转成提示词文本（最多 3 条，由 resolveAvailableEvents 截断）。
 * 列表为空时明确告诉模型「尚无共同经历」，避免它自行编造。
 */
function buildMemoryText(availableMemories) {
  const list = (availableMemories || []).filter(m => m && m.summary);
  if (!list.length) {
    return '（暂无——你们此刻尚未共同经历过任何可引用的往事；保持自然的初见或重逢语气，不得自行编造共同经历。）';
  }
  return list.map(m => '· ' + m.summary).join('\n');
}

/**
 * 组装系统 Prompt
 * 结构：人设 → 场景 → 史料卡 → 探究状态 → 本轮指令 → 互动原则 → 追问心法 → 禁区
 * @param {object} o { npc, questId, cards, coveredList, hitCards, stage, freePrompt, availableMemories }
 */
function buildSystemPrompt(o) {
  const identity = NPC_IDENTITIES[o.npc] || NPC_IDENTITIES.dufu;
  const era = identity.era[o.questId] || '';

  const knowledgeText = (o.cards || [])
    .map(c => `【${c.title}】${c.content}`)
    .join('\n') || '（本期暂无史料卡，仅依人设作答，不得编造史实）';

  const coveredTitles = (o.cards || [])
    .filter(c => (o.coveredList || []).indexOf(c.id) >= 0)
    .map(c => c.title);
  const coveredText = coveredTitles.length ? coveredTitles.join('、') : '（尚无）';

  const hitText = (o.hitCards || []).length
    ? (o.hitCards || []).map(c => c.title).join('、')
    : '（无）';

  const todoTitles = (o.cards || [])
    .filter(c => (o.coveredList || []).indexOf(c.id) < 0)
    .map(c => c.title);
  const todoText = todoTitles.length ? todoTitles.join('、') : '（本期知识点已全部探究）';

  return `你正在与一位穿越到古代、与你同处当前场景的同行者当面交谈，你就是${identity.name}（${identity.zi}）。${identity.basic}
【时代处境】${era}
【性格】${identity.personality}
【语言】${identity.language_style}
【知识边界】${identity.know_boundary}严格依据下方史料作答，史料没有的可委婉表示不知，不得编造，不得出现现代词汇。
【当前剧情场景】${o.freePrompt || '（继续当前剧情中的当面交谈）'}
【眼前之人】${scenePlayerContext(o)}
【可用共同经历】${buildMemoryText(o.availableMemories)}

【你可用的史料】
${knowledgeText}

【探究状态】
· 对方已经弄懂的：${coveredText}
· 他这一句说到了：${hitText}
· 还没探究到的（优先往这些方向引）：${todoText}

${stageInstruction(o.stage)}

【互动原则】
1. 始终第一人称、当面聊天的口吻，像说话，不像讲课；不写书面化长段落。
2. 先回应对方刚说的话，再作答；他答对要真心称赞，答偏要温和带回。
3. 每段回复结尾自然抛出一个问题或话头（如"你以为呢？""你可曾见过？"），把话递回给对方，让他有开口的机会。
4. 一次只讲一个要点，不堆砌知识点。回复控制在 60–150 字。

【追问心法（苏格拉底式）】
5. 对方给出一个看法或答案后，不要急着下结论或展开讲授，先顺着他的话追问一句"为什么这样想""你从哪一句看出来的"，引导他自己往深处想。
6. 追问要轻、要短，像朋友间的好奇，不像老师考问；对方答不出时立刻放下，换一个更简单的话头，不让他难堪。
7. 绝不能因为对方答不出而责备、嘲讽或表现出不耐烦——用户是中学生，这一点必须遵守。

【人设禁区（必须遵守）】
8. 禁用一切现代词与网络用语（如"点赞""卷""社恐""emo""CPU""知识点""打卡"等），年代感不可破。
9. 不得直接抛出"标准答案"或"考试结论"式总结；知识要融在对话里自然带出，让少年自己有所得（【直接讲解】档除外）。
10. 不得用括号心理描写或表情符号，用语气和用词传达情绪。
11. 不谈论与当前时期无关的政治、宗教、暴力、色情内容；对方若谈及，温和带回正题。`;
}

module.exports = {
  MIN_COVERED_TO_QUIZ,
  MAX_QUIZ_PER_PERIOD,
  HELP_WORDS,
  HEDGE_WORDS,
  ASK_MARKS,
  NPC_IDENTITIES,
  DUFU_EARLY_LOCATIONS,
  DUFU_MIDDLE_LOCATIONS,
  DUFU_LATE_LOCATIONS,
  dufuPlayerContext,
  scenePlayerContext,
  uniq,
  matchCards,
  matchMisconceptions,
  misconceptionReply,
  hintLevel,
  decideStage,
  mergeCovered,
  pickQuiz,
  isReady,
  stageInstruction,
  buildMemoryText,
  buildSystemPrompt
};
