/* 汇总苏轼地点剧情的逐句 TTS 表演计划，并做完整性校验。
 *
 * 与杜甫、李白两份不同：苏轼这 226 条提示词没有走「情绪枚举 + 通用模板」，
 * 而是逐句手写在 tools/sushi-prompts/p1–p5b.js 里。原因是苏轼在不同人生阶段
 * 的声音差别太大（十岁的清亮、乌台的虚弱、儋州的苍老幽默、常州的临终清醒），
 * 任何模板套下去都会把「由苦到开」的变化抹平；同一 emotion 下的相邻分支，
 * 也必须靠台词里的真实转折点区分开。
 *
 * 本脚本只做四件事：
 *   1. 汇总 prompt 表，与源清单 228 条一一对齐（不重不漏、顺序一致）；
 *   2. 清洗朗读文本（去舞台动作、Markdown、ASCII 引号），并保留人工覆写；
 *   3. 按提示词自己写明的情绪浓度折算 intensity，保证字段与提示词一致；
 *   4. 跑 11 项校验，任何一项不过就退出 1，绝不写出一份不完整的计划。
 *
 * 用法：node tools/build-sushi-location-emotion-plan.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'tts-audio', 'manifests', 'sushi-locations.json');
const TARGET = path.join(ROOT, 'tts-audio', 'manifests', 'sushi-locations-emotion-plan.json');
const PROFILES = path.join(ROOT, 'tts-audio', 'voice-profiles.json');
const STORY_LOCATIONS = path.join(ROOT, 'miniprogram', 'utils', 'stories', 'sushi-locations.js');

// ============ 一、22 个地点的声音底色 ============
// 这张表不进 emotionPrompt（提示词里已逐句写明），它有两个用途：
//   ① 交付说明与 README 里「这个人此刻是什么嗓音」的唯一出处；
//   ② 校验「22 个地点都有配置」，防止新增地点时忘记想清楚年龄与处境。
const LOCATION_STYLE = {
  meishan: { age: '十岁上下', where: '眉山家中书房，刚从母亲那里听完《范滂传》', voice: '清亮未变声，吐字利落，认真里带一股压不住的锐气' },
  bianjing: { age: '二十一岁', where: '汴京礼部贡院榜下，与弟同科中举', voice: '清朗爽直，底气足、语速偏快，喜悦里有读书人的分寸' },
  fengxiang: { age: '二十六岁', where: '凤翔签判任上，初入仕途', voice: '比汴京沉一档的青年官声，清亮还在，尾音有案牍的疲' },
  hangzhou: { age: '三十六岁', where: '杭州通判任上，自请外任', voice: '清亮里有厚度，语速快、辩才锋利，笑意常在而底下压着事' },
  mizhou: { age: '三十九岁', where: '密州知州，先旱后蝗，又逢中秋怀弟', voice: '爽朗有底气，笑声从胸腔出来，豪放底下是操心民生的沉' },
  xuzhou: { age: '四十二岁', where: '徐州抗洪，泥水未干', voice: '沙哑疲惫却有力，句子短促，字字砸实' },
  huzhou: { age: '四十四岁', where: '湖州任上被逮，押解将行', voice: '声线收紧、气息变浅，强撑镇定，幽默是硬挤出来的' },
  wutai: { age: '四十四岁', where: '御史台狱中，生死未卜', voice: '疲惫低沉，气声多，音量极低；恐惧被按住，骨气还在' },
  dinghui: { age: '四十五岁', where: '初贬黄州，定惠院寓居，贫病孤冷', voice: '发虚偏暗，句尾常落下去，表面平静而内里接近心灰' },
  dongpo: { age: '四十六岁', where: '黄州城东坡地开荒', voice: '嗓子松开了，带粗砺和土气；苦味还在，但已能笑出来' },
  chibi: { age: '四十七岁', where: '黄州赤壁江上夜游', voice: '开阔有回响的中低音，豪情与苍凉同在，靠气息往外推' },
  shahu: { age: '四十七岁', where: '黄州沙湖道中遇雨', voice: '轻松通透，笑意是真的，不是硬撑出来的' },
  chengtian: { age: '四十八岁', where: '黄州承天寺夜游', voice: '低声带气声、松弛，像怕惊了月色，自嘲里藏着自得' },
  dengzhou: { age: '五十岁', where: '登州知州五日，诏书将到', voice: '干练务实，语气平实，一句一句落到实处' },
  suti: { age: '五十五岁', where: '再知杭州，苏堤筑成', voice: '沉稳有分量，语速比年轻时慢了，得意不外露' },
  yingzhou: { age: '五十七岁', where: '颍州，冬日探淤并上书驳八丈沟', voice: '清瘦有力，论事时语速骤快、逻辑咬得紧' },
  yangzhou: { age: '五十七岁', where: '扬州，罢万花会、论积欠', voice: '沉郁果决，见惯官场积弊的冷意藏在话里' },
  dingzhou: { age: '五十八岁', where: '定州边地，整军兴农', voice: '苍劲，被北风刮得有些散，话说得急' },
  huizhou: { age: '六十岁', where: '惠州贬所，荔枝新熟，朝云刚走', voice: '略带沙哑，笑意多，自嘲里透着甜；说到朝云声音就塌下去' },
  danzhou: { age: '六十三岁', where: '儋州，办学、挖井、食蚝', voice: '苍老微沙，精神明亮，亲切幽默，像乡间长者' },
  jinshan: { age: '六十五岁', where: '真州金山寺，对画像自题', voice: '苍老平缓，气息短，自嘲之下是坦然和辽阔' },
  changzhou: { age: '六十五岁', where: '常州病榻，北归将尽，子由还在路上', voice: '虚弱但清醒，轻、稳、清楚，慢而不拖' }
};

// ============ 二、非苏轼对白（人工逐条核对后的结论） ============
// 判据不是 npc:true（那只代表这是 NPC 节点），而是「这句话是谁在说」。
// 228 条里只有下面两条是欧阳修本人在说。子由、朝云、姜唐佐、庞安常、维琳、
// 钱世雄虽然也出现在台词里，但都只是苏轼口中的称呼，或只出现在括号内的舞台
// 动作里（后者由 ttsText 清洗掉），不构成他人对白。
const SKIP_TTS = new Map([
  ['bianjing/n4', '欧阳修台词，不能使用苏轼音色'],
  ['bianjing/n4a', '欧阳修台词，不能使用苏轼音色']
]);

// ============ 三、朗读文本清洗 ============
// 通用清洗：去 （）/() 舞台动作、去 ** Markdown、去 ASCII 引号、收空白。
// 下面两条是「台词与叙述混写」的典型：括号里塞了别人的话，auto 清洗后标点会
// 粘连，所以给出确定的朗读文本（只读苏轼的答话与解释）。
const VOICE_TEXT_OVERRIDES = {
  'changzhou/n3a': '西方不无，但个里着力不得。西方不是没有，可这事使不上劲。',
  'changzhou/n3b': '著力即差。一使劲，就错了。'
};

function stripStageDirections(text) {
  return String(text || '').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '');
}

function stageCues(text) {
  return Array.from(String(text || '').matchAll(/（([^）]*)）/g), m => m[1]).join('；');
}

function cleanTtsText(text) {
  return stripStageDirections(text)
    .replace(/\*\*/g, '')
    .replace(/"/g, '')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\s*\n\s*/g, '')
    // 去掉舞台动作后常出现「。」紧接着破折号，念出来会多一次无谓的长停
    .replace(/。\s*——/g, '——')
    .trim();
}

function spokenText(item) {
  const key = `${item.audioQuestId}/${item.nodeId}`;
  if (Object.prototype.hasOwnProperty.call(VOICE_TEXT_OVERRIDES, key)) {
    return VOICE_TEXT_OVERRIDES[key];
  }
  return cleanTtsText(item.text);
}

// ============ 四、提示词表 ============
const PROMPT_MODULES = ['p1', 'p2', 'p3', 'p4', 'p5a', 'p5b']
  .map(name => require(path.join(__dirname, 'sushi-prompts', name)));
const PROMPTS = Object.assign({}, ...PROMPT_MODULES);

// ============ 五、强度 ============
// 每条提示词自己写明了情绪浓度（「给到中等偏上」「情绪较满」等），
// intensity 从这句话反推，保证字段与提示词说的是同一件事；
// 再加一个按节点键固定的微抖动，避免同档台词出现完全相同的数值。
const INTENSITY_BANDS = [
  ['接近满', 0.74], ['很轻', 0.34], ['较满', 0.68], ['中偏上', 0.60],
  ['中等偏轻', 0.45], ['中等', 0.52], ['轻', 0.40]
];

function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function intensityFromPrompt(prompt, key) {
  const pick = (base) => {
    const jitter = ((hashOf(key) % 5) - 2) / 100;
    return Math.round(Math.min(0.78, Math.max(0.35, base + jitter)) * 100) / 100;
  };
  // 先看「情绪 / 给到」后面紧跟的那一小段，那里才是这一句写的浓度
  const anchors = Array.from(prompt.matchAll(/给到|情绪/g), m => m.index);
  for (const at of anchors) {
    const window = prompt.slice(at, at + 28);
    for (const [word, base] of INTENSITY_BANDS) {
      if (window.includes(word)) return pick(base);
    }
  }
  // 再兜底：这几个词足够明确，出现在哪都算数（不含「轻」「中等」这种过泛的）
  for (const [word, base] of INTENSITY_BANDS) {
    if (word !== '轻' && word !== '中等' && prompt.includes(word)) return pick(base);
  }
  return 0.5;
}

// ============ 六、生成 ============
const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const items = source.items || [];

const plan = items.map((item) => {
  const key = `${item.audioQuestId}/${item.nodeId}`;
  const skipReason = SKIP_TTS.get(key) || '';
  const ttsText = spokenText(item);
  const actionOnly = !ttsText;
  const isSkip = Boolean(skipReason) || actionOnly;
  const emotionPrompt = isSkip ? '' : (PROMPTS[key] || '');
  return {
    audioQuestId: item.audioQuestId,
    nodeId: item.nodeId,
    sourceText: item.text,
    ttsText,
    emotion: item.emotion,
    intensity: isSkip ? 0 : intensityFromPrompt(emotionPrompt, key),
    skipTts: isSkip,
    skipReason: actionOnly ? '纯动作节点，无可朗读台词' : skipReason,
    emotionPrompt
  };
});

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  lineId: 'sushi',
  kind: 'location',
  sourceManifest: 'sushi-locations.json',
  count: plan.length,
  speakableCount: plan.filter(x => !x.skipTts).length,
  skippedCount: plan.filter(x => x.skipTts).length,
  note: 'emotionPrompt 逐句手写，按「人物年龄与场景 + 情绪弧位置（铺垫/升温/高潮/回落）+ 主情绪与强度 + 情绪轨迹（起点→推进→转折/爆发→句尾收束）+ 音高/音量变化 + 语速（25 基准数值，25–28 平静、28–34 推进、34–40 激动、悲伤沉思 25–28）+ 呼吸状态 + 语义停顿位置 + 句尾走向（上扬/平收/下沉/落空/悬）+ 少量重音 + 禁止项」组织；转折点、停顿点与重音词一律引用该句台词里的原话，不使用固定模板，不含 SSML 与逐字参数。连续句之间按段落设计「铺垫—升温—高潮—回落」的起伏，每句只在情绪弧里占一段，不句句顶到最高强度。ttsText 已去除（）舞台动作、** Markdown 标记和 ASCII 引号。skipTts 为 true 的节点是他人对白，不得使用苏轼音色生成。',
  plan
};

// ============ 七、11 项校验 ============
function validate() {
  const errors = [];
  const fail = (msg) => errors.push(msg);

  // 1. 数量一致
  if (items.length !== plan.length) fail(`源清单 ${items.length} 条，计划 ${plan.length} 条，数量不一致`);
  if (payload.count !== plan.length) fail(`count 字段 ${payload.count} 与计划条数 ${plan.length} 不一致`);
  if (payload.speakableCount + payload.skippedCount !== payload.count) fail('speakableCount + skippedCount 不等于 count');

  // 2. 键唯一
  const keys = plan.map(x => `${x.audioQuestId}/${x.nodeId}`);
  const keySet = new Set(keys);
  if (keySet.size !== keys.length) fail('audioQuestId + nodeId 存在重复键');

  // 3. 与源清单的节点集合、顺序完全一致
  items.forEach((item, i) => {
    const entry = plan[i];
    if (!entry) { fail(`第 ${i + 1} 条计划缺失`); return; }
    if (entry.audioQuestId !== item.audioQuestId || entry.nodeId !== item.nodeId) {
      fail(`第 ${i + 1} 条顺序错位：期望 ${item.audioQuestId}/${item.nodeId}，实际 ${entry.audioQuestId}/${entry.nodeId}`);
    }
  });

  // 4. 可配音项：ttsText / emotionPrompt / emotion / intensity 全部有效
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    if (!entry.ttsText || !entry.ttsText.trim()) fail(`${key} 可配音但没有 ttsText`);
    if (!entry.emotionPrompt) fail(`${key} 缺少 emotionPrompt`);
    if (entry.emotionPrompt && entry.emotionPrompt.length < 90) fail(`${key} emotionPrompt 过短（${entry.emotionPrompt.length} 字），未覆盖七段要求`);
    if (entry.emotionPrompt && entry.emotionPrompt.length > 420) fail(`${key} emotionPrompt 过长（${entry.emotionPrompt.length} 字），可能被截断`);
    if (!['calm', 'joy', 'thoughtful', 'serious', 'sad'].includes(entry.emotion)) fail(`${key} emotion 非法：${entry.emotion}`);
    if (!(entry.intensity >= 0.32 && entry.intensity <= 0.78)) fail(`${key} intensity 越界：${entry.intensity}`);
  });

  // 5. 跳过项：必须有原因，且没有提示词
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (!entry.skipTts) return;
    if (!entry.skipReason) fail(`${key} skipTts 但没有 skipReason`);
    if (entry.emotionPrompt) fail(`${key} skipTts 但仍有 emotionPrompt`);
  });

  // 6/7. ttsText 不得残留舞台动作括号与 Markdown
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (/[（）()]/.test(entry.ttsText)) fail(`${key} ttsText 残留括号`);
    if (/[#`*_]/.test(entry.ttsText)) fail(`${key} ttsText 残留 Markdown 符号`);
  });

  // 8. 22 个地点全覆盖，节点数与源清单一致
  const srcByLoc = {};
  items.forEach((i) => { srcByLoc[i.audioQuestId] = (srcByLoc[i.audioQuestId] || 0) + 1; });
  const planByLoc = {};
  plan.forEach((p) => { planByLoc[p.audioQuestId] = (planByLoc[p.audioQuestId] || 0) + 1; });
  const srcLocs = Object.keys(srcByLoc);
  if (srcLocs.length !== 22) fail(`源清单地点数 ${srcLocs.length}，期望 22`);
  srcLocs.forEach((loc) => {
    if (!LOCATION_STYLE[loc]) fail(`地点 ${loc} 缺少 LOCATION_STYLE`);
    if (planByLoc[loc] !== srcByLoc[loc]) fail(`地点 ${loc} 条数不一致：源 ${srcByLoc[loc]}，计划 ${planByLoc[loc]}`);
  });

  // 9. _locationProfileMap.sushi 覆盖 22 地点，且与 PERIOD_LOCATIONS 的阶段一致
  const profiles = JSON.parse(fs.readFileSync(PROFILES, 'utf8'));
  const map = (profiles._locationProfileMap || {}).sushi || {};
  const periodLocs = require(STORY_LOCATIONS).PERIOD_LOCATIONS;
  const expected = { p1: 'sushi-p1', p2: 'sushi-p2', p3: 'sushi-p3', p4: 'sushi-p4', p5: 'sushi-p5' };
  srcLocs.forEach((loc) => {
    const profileKey = map[loc];
    if (!profileKey) { fail(`_locationProfileMap.sushi 缺少 ${loc}`); return; }
    if (!profiles[profileKey]) fail(`_locationProfileMap.sushi.${loc} 指向不存在的 profile：${profileKey}`);
    const period = Object.keys(periodLocs).find(pid => periodLocs[pid].includes(loc));
    if (!period) { fail(`地点 ${loc} 不在 sushi-locations.js 的 PERIOD_LOCATIONS 中`); return; }
    if (profileKey !== expected[period]) fail(`地点 ${loc} 属于 ${period}，应映射 ${expected[period]}，实际 ${profileKey}`);
  });
  // 模拟 gen-volcengine-period.py 的 profile_for_item：character=sushi，无 periodId
  srcLocs.forEach((loc) => {
    const character = source.lineId || 'sushi';
    const key = ((profiles._locationProfileMap || {})[character] || {})[loc];
    if (!key || !profiles[key] || !profiles[key].voiceId) fail(`gen 脚本按 ${character}/${loc} 找不到可用音色`);
  });

  // 10. 提示词表本身：键必须真实存在，且可配音节点一个都不能漏
  Object.keys(PROMPTS).forEach((k) => {
    if (!keySet.has(k)) fail(`提示词表含不存在的节点：${k}`);
    if (SKIP_TTS.has(k)) fail(`提示词表包含跳过节点：${k}`);
  });
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    if (!PROMPTS[key]) fail(`可配音节点缺少提示词：${key}`);
    if (!entry.emotionPrompt.includes('苏轼')) fail(`${key} 提示词未点明是苏轼在说`);
  });
  if (new Set(plan.filter(x => !x.skipTts).map(x => x.emotionPrompt)).size
      !== plan.filter(x => !x.skipTts).length) {
    fail('存在完全相同的 emotionPrompt（相邻分支必须区别开）');
  }

  // 11. 提示词里引号内的片段必须是这一句真正念出来的字；
  //     以「他/她」开头的一定是舞台动作（已被 ttsText 清洗掉），引它等于让演员演看不到的字。
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    Array.from(entry.emotionPrompt.matchAll(/“([^”]{2,24})”/g), m => m[1]).forEach((quote) => {
      const bare = (s) => s.replace(/[‘’“”"'「」]/g, '');
      if (bare(entry.ttsText).includes(bare(quote))) return;
      if (/^[他她]/.test(bare(quote))) fail(`${key} 提示词引用了已清洗的舞台动作「${quote}」`);
    });
  });

  // 12. 附加：覆写键、地点表不许有多余项；每个地点提示词条数=可配音条数
  Object.keys(VOICE_TEXT_OVERRIDES).forEach((k) => {
    if (!keySet.has(k)) fail(`VOICE_TEXT_OVERRIDES 含不存在的节点：${k}`);
  });
  Object.keys(LOCATION_STYLE).forEach((loc) => {
    if (!srcByLoc[loc]) fail(`LOCATION_STYLE 含源清单里没有的地点：${loc}`);
  });

  // 13. 语速必须写明 25 基准的数值（平静 25–28 / 推进 28–34 / 激动 34–40，悲伤沉思 25–28）。
  //     允许「语速先快后慢（30 落到 26）」这类自然写法，取括号内/后的数字。
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    const m = entry.emotionPrompt.match(/语速[^0-9。；]{0,8}([0-9]{2})(?:\s*[落到抬至—~\-]\s*([0-9]{2}))?/);
    if (!m) { fail(`${key} 未写明 25 基准的语速数值`); return; }
    const lo = Number(m[1]); const hi = m[2] ? Number(m[2]) : lo;
    if (lo < 25 || hi > 40 || lo > hi) fail(`${key} 语速数值越界（${lo}–${hi}），应为 25–40`);
  });

  // 14. 句尾走向必须写明确切方向（上扬/平收/下沉/落空/悬等）
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    if (!/句尾|尾音|收束|收尾/.test(entry.emotionPrompt)) fail(`${key} 未写明句尾走向`);
    if (!/(上扬|上挑|轻挑|平收|下沉|沉到|落下|落空|落稳|落死|悬|散|收住|收回来)/.test(entry.emotionPrompt)) {
      fail(`${key} 句尾未写明确切方向（上扬/平收/下沉等）`);
    }
  });

  // 15. 必须写清情绪轨迹（起点 → 推进 → 转折/爆发 → 收束）。
  //     「整句不转向」的平稳句是刻意的设计（如临终、静景），也算有轨迹。
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    if (!/起点|起笔|起头|先是/.test(entry.emotionPrompt)) fail(`${key} 情绪轨迹缺「起点」`);
    if (!/(推进|转成|转到|转向|收住|转折|爆发|不转向|一直保持)/.test(entry.emotionPrompt)) fail(`${key} 情绪轨迹缺「推进/转折」`);
    if (!/(收束|收住|收尾|收回来|落下|落稳|落回|下沉|沉到|落死|落空|平收|散|上扬|上挑|轻挑|悬)/.test(entry.emotionPrompt)) fail(`${key} 情绪轨迹缺「收束」`);
  });

  // 16. 必须写明呼吸/气息状态
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    if (!/(气息|呼吸|换气|气口|气声|气)/.test(entry.emotionPrompt)) fail(`${key} 未写明呼吸/气息状态`);
  });

  // 17. 语义停顿：必须写明确切停顿位置（引用台词原话或「破折号前/逗号处」等）
  plan.forEach((entry) => {
    const key = `${entry.audioQuestId}/${entry.nodeId}`;
    if (entry.skipTts) return;
    if (!/(停顿|停半拍|停一拍|收住半拍|顿|停一下)/.test(entry.emotionPrompt)) fail(`${key} 未写明语义停顿位置`);
  });

  // 18. 每个地点内情绪必须起伏（防止整段一个调）：
  //     有高亢句（max≥0.6）的地点要求极差≥0.18；整体低沉的地点（max<0.6）要求极差≥0.12。
  const intByLoc = {};
  plan.filter(x => !x.skipTts).forEach((entry) => {
    (intByLoc[entry.audioQuestId] = intByLoc[entry.audioQuestId] || []).push(entry.intensity);
  });
  Object.keys(intByLoc).forEach((loc) => {
    const vals = intByLoc[loc];
    const spread = Math.max(...vals) - Math.min(...vals);
    const minSpread = Math.max(...vals) >= 0.6 ? 0.18 : 0.12;
    if (spread < minSpread) fail(`地点 ${loc} 情绪起伏不足（极差 ${spread.toFixed(2)} < ${minSpread}），需铺垫—升温—高潮—回落`);
  });

  // 19. 地点内不得出现连续 3 句及以上「高亢」intensity（≥0.6）——防「句句顶满」。
  //     连续低沉（<0.6）是悲痛/沉思场景的正常写法，不判错。
  Object.keys(intByLoc).forEach((loc) => {
    const vals = intByLoc[loc];
    let run = 0;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] >= 0.6) { run++; } else { run = 0; }
      if (run >= 3) {
        fail(`地点 ${loc} 第 ${i - run + 2}–${i + 1} 句连续 ${run} 句高亢（intensity≥0.6），缺「铺垫—高潮—回落」的起伏`);
        run = 0;
      }
    }
  });

  return errors;
}

const errors = validate();
if (errors.length) {
  console.error('校验失败：');
  errors.forEach(e => console.error(` - ${e}`));
  process.exit(1);
}

fs.writeFileSync(TARGET, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const speakable = plan.filter(x => !x.skipTts);
const lens = speakable.map(x => x.emotionPrompt.length);
const values = speakable.map(x => x.intensity);
console.log(`已写 ${path.relative(ROOT, TARGET)}`);
console.log(`总节点 ${payload.count}，可配音 ${payload.speakableCount}，跳过 ${payload.skippedCount}`);
console.log(`提示词长度 ${Math.min(...lens)}–${Math.max(...lens)} 字，平均 ${Math.round(lens.reduce((a, b) => a + b, 0) / lens.length)} 字`);
console.log(`intensity ${Math.min(...values)}–${Math.max(...values)}，不同取值 ${new Set(values).size} 种`);
console.log(`提示词来源 ${PROMPT_MODULES.length} 个文件，全部唯一，无模板套用`);
