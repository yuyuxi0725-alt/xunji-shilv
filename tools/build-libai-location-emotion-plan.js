/* 根据当前李白地点配音清单生成逐句 TTS 表演计划。
 *
 * 与 build-dufu-location-emotion-plan.js 同构，但针对李白人设：
 *   李白是"诗仙"——豪放飘逸、狂傲自信、纵酒任侠、意气风发；
 *   少年出蜀时是意气凌云的大鹏，晚年流放遇赦仍高歌"轻舟已过万重山"。
 *   他的悲伤不是杜甫式的沉痛内收，而是浪漫底色上的失落与不屈。
 *
 * 生成结果供 tts-audio/gen-volcengine-period.py 直接使用。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'tts-audio', 'manifests', 'libai-locations.json');
const TARGET = path.join(ROOT, 'tts-audio', 'manifests', 'libai-locations-emotion-plan.json');

// 每个地点只写「地点 + 一句处境」，人物称呼与嗓音底色由通用底色统一给，避免重复。
const LOCATION_STYLE = {
  qinglian: '此刻在蜀中青莲乡，少年立志',
  emei: '此刻在峨眉山下，即将仗剑出蜀',
  jingmen: '此刻初出三峡，眼前豁然开阔',
  yangzhou: '此刻东游扬州，散金会友',
  anlu: '此刻酒隐安陆，干谒求仕',
  changan1: '此刻初入长安，四处干谒碰壁',
  zhongnan: '此刻隐居终南山，求荐不得',
  hanlin: '此刻供奉翰林，受天子礼遇',
  luoyang_libai: '此刻在洛阳，与杜甫初见',
  songshan: '此刻在元丹丘山居，痛饮将进酒',
  tianmu: '此刻梦游天姥，唱出不屈之志',
  liangsong: '此刻与杜甫高适同游梁宋',
  xuanzhou: '此刻在宣州谢朓楼饯别',
  youyan: '此刻北游幽燕，察觉边地隐忧',
  lushan: '此刻避乱庐山，隐居屏风叠',
  yongwang: '此刻在永王幕中，报国心切',
  xunyang: '此刻浔阳系狱，惊惧与委屈交加',
  liuyelang: '此刻长流夜郎，溯江而上',
  baidi: '此刻遇赦东还，轻舟过白帝城',
  dangtu: '此刻临终，大鹏将折翼'
};

// 人生阶段 → 地点（严格对齐立绘 npcStage，与 voice-profiles.json 的 _locationProfileMap 一致）
const CHILD_LOCATIONS = new Set(['qinglian']);                                               // 幼年 p0
const YOUTH_LOCATIONS = new Set(['emei', 'jingmen', 'yangzhou', 'anlu']);                    // 青年 p1
const STRONG_LOCATIONS = new Set(['changan1', 'zhongnan', 'hanlin']);                        // 壮年 p2+p3
const MIDDLE_LOCATIONS = new Set(['luoyang_libai', 'songshan', 'tianmu', 'liangsong', 'xuanzhou', 'youyan']); // 中年 p4
const OLD_LOCATIONS = new Set(['lushan', 'yongwang', 'xunyang', 'liuyelang', 'baidi', 'dangtu']); // 晚年 p5

// 人物底色：极简，只点明「年龄阶段 + 一句气质」，音色质感交给 emotionLine 描述，
// 避免两处重复描述音色、把 prompt 拖长。context_texts 越聚焦情感，演绎越自然。
const CHILD_COMMON_PROMPT = '你是童年的李白，还待在蜀中青莲乡的书斋里，声音稚气清亮，说话直率、带点小机灵和不服气。';
const YOUTH_COMMON_PROMPT = '你是青年李白，意气飞扬、带一点天真的狂气。';
const STRONG_COMMON_PROMPT = '你是壮年李白，豪放洒脱、底气十足。';
const MIDDLE_COMMON_PROMPT = '你是中年李白，狂放不减、更见人生的苍凉与通达。';
const OLD_COMMON_PROMPT = '你是晚年李白，苍老疲惫，却仍是不屈的浪漫。';

const EMOTION_STYLE = {
  calm: { label: '平静坦然', intensity: 0.38, energy: '语气平缓、声音松下来，像在安静地同知己交谈，尾音轻轻落稳' },
  joy: { label: '欣喜豪迈', intensity: 0.56, energy: '音色明显提亮，语调自然上扬，朗声带出真心的笑意，说到快意处声音里有光' },
  thoughtful: { label: '若有所思', intensity: 0.46, energy: '语速略缓，气息收在思绪里，像边想边缓缓道来，句子间有真实的沉吟' },
  serious: { label: '郑重豪壮', intensity: 0.62, energy: '声音放开、更有分量，关键处咬字加重、句尾坚定地落稳，语气里有凌云之气' },
  sad: { label: '惆怅失意', intensity: 0.62, energy: '声音转低转暗，气息发沉，说到痛处语气凝滞、微微发颤，浪漫底色上的失落压出来' }
};

// 李白线里所有 NPC talk 节点都是李白本人（其他角色如杜甫/高适/元丹丘在剧本中
// 要么是旁白、要么是玩家视角，不占 npc talk 位），因此无需 skipTts 名单。
// 若日后剧本混入他人对白（speaker 显式标了别的人物名），再在此登记。
const NON_LIBAI = new Map([]);

// 少量旧剧本把对白、玩家动作和叙述塞在同一个 talk 节点里，必须明确摘出对白。
const VOICE_TEXT_OVERRIDES = {};

// 首轮试听与剧情转折处的关键台词需要逐句精调，用自然语言描述「声音质感 + 画面 + 情绪」。
const PROMPT_OVERRIDES = {
  'songshan/n3a': '用豪放酣畅的语气说，声音洪亮、底气十足，像举杯痛饮后放声高歌，把《将进酒》唱到最高潮，情绪高昂而看透世事，狂放里透着一丝苍凉',
  'tianmu/n4a': '用傲岸不屈的语气说，声音清越超拔、逐层上扬，像把压抑已久的话终于吐出来，情绪是凌驾世俗的洒脱与孤高，坚定而不嘶吼',
  'dangtu/n5': '用苍凉平静的语气说，声音沙哑虚弱、气息略虚，像力气已经耗尽，情绪是大鹏折翼却仍不失旷达，从容里带着一丝自嘲'
};

const EMOTION_OVERRIDES = {
  'dangtu/n5': { emotion: 'sad', intensity: 0.7 }
};

function stripStageDirections(text) {
  return String(text || '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function spokenText(item) {
  const key = `${item.audioQuestId}/${item.nodeId}`;
  return VOICE_TEXT_OVERRIDES[key] || stripStageDirections(item.text);
}

function stageText(text) {
  return Array.from(String(text || '').matchAll(/（([^）]*)）/g), m => m[1]).join('；');
}

function hasVerse(text) {
  return /《[^》]+》/.test(text) || /["“][^"”]{4,}["”]/.test(text);
}

function inferNuance(item, emotion, text, stage) {
  const all = stage + text;
  if (/苦笑|自嘲/.test(all)) return '表层洒脱、内里自嘲';
  if (/不悔|偏要|非得|我决意|总得|不能|更不能|天生我材|安能/.test(text)) return '傲岸中的坚定';
  if (/多谢|故人|兄台|知己|君|诸君/.test(text)) return emotion === 'sad' ? '失意中的感念' : '对知己的爽朗与亲近';
  if (hasVerse(text)) return `${EMOTION_STYLE[emotion].label}，并带诗意观照`;
  if (/？/.test(text)) return `${EMOTION_STYLE[emotion].label}，带真实的询问或自问`;
  return EMOTION_STYLE[emotion].label;
}

// 按人生阶段（幼年/青年/壮年/中年/晚年）选通用底色。
function commonPromptFor(locationId) {
  if (CHILD_LOCATIONS.has(locationId)) return CHILD_COMMON_PROMPT;
  if (YOUTH_LOCATIONS.has(locationId)) return YOUTH_COMMON_PROMPT;
  if (STRONG_LOCATIONS.has(locationId)) return STRONG_COMMON_PROMPT;
  if (MIDDLE_LOCATIONS.has(locationId)) return MIDDLE_COMMON_PROMPT;
  if (OLD_LOCATIONS.has(locationId)) return OLD_COMMON_PROMPT;
  return MIDDLE_COMMON_PROMPT; // 兜底：出现未登记的新地点时用它，并应在上面补进对应阶段
}

// 逐句指令：用「自然语言情感描述」告诉模型这句该怎么演，而不是技术性朗读指令。
// 豆包 context_texts 的正确用法是描述「声音质感 + 画面 + 情绪强度」，
// 例如「用豪迈激昂的语气说，声音明亮有力，像酒后把胸中块垒一吐而尽」。
// 「重音落在哪、哪里停顿」这类技术指令模型理解不了，只会机械执行，导致语气生硬。
function buildPrompt(item, ttsText) {
  const key = `${item.audioQuestId}/${item.nodeId}`;
  const emotionOverride = EMOTION_OVERRIDES[key];
  const emotion = emotionOverride
    ? emotionOverride.emotion
    : (EMOTION_STYLE[item.emotion] ? item.emotion : 'calm');
  const stage = stageText(item.text);
  return `${emotionLine(item, emotion, ttsText, stage)}`;
}

// 情绪弧线：用自然语言描述这句该怎么演——声音质感 + 画面比喻 + 情绪强度。
// 格式贴近豆包官方推荐：「用xxx的语气说，声音xxx，像xxx」。
// 幼年单独一套措辞：孩子的声音不能写「沉实有分量」「凌云傲气」，否则和稚气音色打架。
function emotionLine(item, emotion, text, stage) {
  const all = stage + text;
  const child = CHILD_LOCATIONS.has(item.audioQuestId);
  if (emotion === 'joy') {
    if (child) {
      if (/大笑|一拍手|一扬眉|好！/.test(all)) return '用兴奋雀跃的语气说，声音又亮又脆，像憋不住地笑出来，尾音往上翘，透着孩子的得意和劲头';
      return '用轻快雀跃的语气说，声音清脆上扬，带着藏不住的兴奋和小得意';
    }
    if (/安能|天生我材|长风破浪|千金散尽|直挂云帆/.test(text)) {
      return '用豪迈激昂的语气说，声音明亮有力、底气十足，像酒后把胸中块垒一吐而尽，越说越昂扬振奋，情绪高昂';
    }
    if (/哈哈|大笑|爽快|痛快|满上|饮/.test(all)) return '用畅快淋漓的语气说，声音亮而松，笑声从胸腔里发出来，透着一股痛快劲儿';
    return '用轻快明亮的语气说，声音清亮上扬，带着藏不住的喜色和少年人的得意';
  }
  if (emotion === 'sad') {
    if (child) return '用失落委屈的语气说，声音低下去、有点发闷，像心里憋着事又不愿示弱';
    if (/名帖|门子|碰壁|冷脸|无人|可怜|无名/.test(all)) return '用隐忍倔强的语气说，声音低沉发紧，像在朋友面前强撑着不让自己显得可怜，说到痛处带着几分自嘲';
    if (/死|狱|流放|夜郎|泪|愁|大鹏飞兮|中天摧/.test(all)) return '用苍凉悲伤的语气说，声音转低转暗、微微发颤，像力气一点点耗尽，却仍不肯放声哭出来';
    return '用怅惘失意的语气说，声音低缓，像酒后的落寞，语气一点点沉下去，尾音里透着说不出的空';
  }
  if (emotion === 'serious') {
    if (child) return '用认真较劲的语气说，声音脆生生、咬字用力，像个不肯服输的孩子在讲一件自己认定的事';
    if (/蜀道|行路难|冰塞川/.test(text)) return '用沉郁有力的语气说，声音压低却有劲，像把走不通的路说得真切，透着不肯认命的骨气';
    return '用郑重坚定的语气说，声音沉实有分量，字字咬得清楚，透出一股凌云傲气';
  }
  if (emotion === 'thoughtful') {
    if (child) return '用若有所思的语气说，声音放轻，语速慢下来，像一边回想一边说，带点孩子气的认真';
    if (/想|念|记|原来|如今|后来才|才明白/.test(text)) return '用若有所思的语气说，声音放轻放慢，像边想边缓缓道来，句间有真实的沉吟';
    return '用平静思索的语气说，声音轻柔缓和，像把心里话慢慢说给身边人听';
  }
  // calm
  if (child) return '用自然平常的语气说，声音稚气、松弛，像跟人闲聊家常';
  return '用平静坦然的语气说，声音松下来、温和自然，像同故人闲谈一般';
}

const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const plan = source.items.map((item) => {
  const key = `${item.audioQuestId}/${item.nodeId}`;
  const ttsText = spokenText(item);
  const actionOnly = !ttsText;
  const nonLibaiReason = NON_LIBAI.get(key) || '';
  const emotionOverride = EMOTION_OVERRIDES[key];
  const emotion = emotionOverride
    ? emotionOverride.emotion
    : (EMOTION_STYLE[item.emotion] ? item.emotion : 'calm');
  const specificPrompt = actionOnly || nonLibaiReason ? '' : (PROMPT_OVERRIDES[key] || buildPrompt(item, ttsText));
  const commonPrompt = commonPromptFor(item.audioQuestId);
  const emotionPrompt = specificPrompt ? `${commonPrompt}${specificPrompt}` : '';
  const entry = {
    audioQuestId: item.audioQuestId,
    nodeId: item.nodeId,
    sourceText: item.text,
    ttsText,
    emotion,
    intensity: emotionOverride ? emotionOverride.intensity : EMOTION_STYLE[emotion].intensity,
    skipTts: actionOnly || Boolean(nonLibaiReason),
    skipReason: actionOnly ? '纯动作节点，无可朗读台词' : nonLibaiReason,
    emotionPrompt
  };
  return entry;
});

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  lineId: 'libai',
  kind: 'location',
  sourceManifest: 'libai-locations.json',
  count: plan.length,
  speakableCount: plan.filter(x => !x.skipTts).length,
  skippedCount: plan.filter(x => x.skipTts).length,
  note: 'emotionPrompt 是直接发送给 context_texts[0] 的自然语言情感指令，格式贴近豆包官方推荐「用xxx的语气说，声音xxx，像xxx」，只描述声音质感、画面与情绪强度，不含重音/停顿等技术指令（技术指令会导致语气生硬）。ttsText 已去除舞台动作。skipTts 节点不得使用李白音色生成。',
  plan
};

fs.writeFileSync(TARGET, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`已写 ${path.relative(ROOT, TARGET)}`);
console.log(`总节点 ${payload.count}，李白可配音 ${payload.speakableCount}，跳过 ${payload.skippedCount}`);
