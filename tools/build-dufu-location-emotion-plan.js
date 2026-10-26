/* 根据当前杜甫地点配音清单生成逐句 TTS 表演计划。
 *
 * 目标不是把 emotion 枚举机械翻译成中文，而是把人物年龄、处境、语速、
 * 气息、语义停顿、诗句节奏、重音与收尾方式合成一条 context_texts 指令。
 * 生成结果供 tts-audio/gen-volcengine-period.py 直接使用。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'tts-audio', 'manifests', 'dufu-locations.json');
const TARGET = path.join(ROOT, 'tts-audio', 'manifests', 'dufu-locations-emotion-plan.json');

const LOCATION_STYLE = {
  luoyang: '七岁少年杜甫，声音清亮稚气但咬字认真，像在书房里同可信任的兄台交谈',
  shuhu: '少年杜甫，声音清亮灵动，带第一次见识绝艺时的专注与好奇',
  wuyue: '青年杜甫，嗓音清朗、气息稳，带着远游开阔眼界后的舒展与笃定',
  luoyang_shi: '青年杜甫，嗓音清朗、克制，科场前后仍端着读书人的体面与韧性',
  taishan: '青年杜甫，嗓音开阔、有朝气，登山后的喘息可以真实，但不能影响吐字',
  shouang: '青年杜甫，嗓音比从前沉一些，父丧后的悲伤压在心里，话少而平直',
  qizhao: '壮游时期的杜甫，嗓音明亮、豪爽，与李白同游时有敬意也有好友间的松弛',
  changan: '困守长安的中年杜甫，声音沉稳略显疲惫，始终保留读书人的克制',
  yexian: '遭逢科场骗局的中年杜甫，声音压低，愤懑清楚但不失控',
  fengxian: '奔赴奉先的中年杜甫，声音疲惫而急切，谈到家人与百姓时痛感内收',
  changan_xian: '陷于战乱长安的杜甫，声音低而谨慎，像在叛军近旁压声交谈',
  fengxiang: '冒死投奔朝廷的杜甫，声音疲惫却有支撑，郑重而不喊口号',
  qiangcun: '战乱后与家人团聚的杜甫，声音温厚低沉，庆幸里仍留着后怕',
  huazhou: '目睹征役苦难的杜甫，声音沉实克制，悲悯重于个人哀叹',
  qinzhou: '弃官西行的杜甫，声音清醒疲惫，放下官印后有失落也有释然',
  tonggu: '饥寒中的杜甫，声音虚弱发紧，气息短但吐字仍清楚',
  chengdu: '草堂时期的杜甫，声音温厚朴实；安居时松弛，风雨破屋时转为沉痛',
  kuizhou: '夔州晚年的杜甫，声音苍老低沉、略带病中气短，节奏从容而不故意拖腔',
  jingzhou: '晚年病中的杜甫，声音沙哑低弱，登楼时气息不足但诗句仍有胸襟',
  tanzhou: '晚年杜甫，声音低缓温厚，重逢故人时怀旧而不滥情',
  hengzhou: '病困孤舟的晚年杜甫，声音沙哑虚弱，话少、气短、心绪平静',
  xiangjiang: '生命末段的杜甫，声音极轻而清楚，虚弱平静，不制造夸张临终腔'
};

const YOUTH_LOCATIONS = new Set(['wuyue', 'luoyang_shi', 'taishan', 'shouang', 'qizhao']);
const OLD_LOCATIONS = new Set(['qinzhou', 'tonggu', 'chengdu', 'kuizhou', 'jingzhou', 'tanzhou', 'hengzhou', 'xiangjiang']);
const PACE_COMMON_PROMPT = '语速以25为基准，按语义自然浮动；最低保持在25左右，兴奋时最高到40，整体保持流畅，不拖沓。';
// 青年杜甫的通用表演基准：强调自然语速、按意群停顿、语气随情绪自然流动，
// 明确反对拖音、拖沓和机械匀速。语义停顿优先按"意思的完整"而非逐个标点拆。
const YOUTH_COMMON_PROMPT =
  '这是青年杜甫在说话，嗓音清朗温厚，带读书人的斯文，说话像同身边人当面交谈，自然、不端着。' +
  '整体语速中速偏轻快，像正常聊天那样自然推进，绝不拖音、不拖沓、不刻意放慢每一个字。' +
  '停顿按意思来：一句话意思没说完就顺下去，意思告一段落才稍作呼吸，不要每见一个逗号都停下来喘。' +
  '语气、音量、音高随句子的意思自然起伏：高兴处音色提亮、带出真心的笑意，沉思处气息收稳、缓缓沉吟，难过处声音转低转沉、能听出凝滞，情绪要从声音里自然流露，不要念得平平的。' +
  '重音只落在每句最要紧的那几个字上，其余字自然带过，不要逐字加重。' +
  '遇到诗句，就按诗的意群自然吟出，像随口念来，不要拉开成舞台朗诵腔。' +
  '以下逐句的情绪要求优先于这段通用基准。';
// 老年杜甫的通用表演基准：声线低沉苍老、带沧桑，但情绪要有真实的起伏，
// 不是一条平线。喜时要能听出欣慰，悲时要能听出哽咽和凝滞，痛处要有分量。
const OLD_COMMON_PROMPT =
  '这是晚年杜甫在说话，声音低沉、苍老、带一点沙哑，气息沉、稳、厚实，不要轻、不要飘、不要发虚。' +
  '声线往下压，咬字清楚但不刻意，带饱经风霜的沧桑感，像一位把一生看透、话不多却字字有分量的老人。' +
  '整体语速中速偏稳、从容推进，但不拖腔、不拖音、不刻意放慢每一个字。' +
  '停顿按意思来，意思告一段落才稍作呼吸，不要每个逗号都停。' +
  '情绪要有真实起伏，不要念得平平的：说到欣慰处，语气自然放软、带一点暖；说到痛处，声音明显转低、气息发沉、句子里能听出凝滞和微微的颤抖；说到坚定处，咬字加重、句尾稳稳落下。' +
  '重音只落在最要紧的几个字上，其余自然带过。' +
  '遇到诗句，就按诗的意群自然吟出，沉稳、有分量，不飘、不舞台腔。' +
  '以下逐句的情绪要求优先于这段通用基准。';


const EMOTION_STYLE = {
  calm: { label: '平静坦然', intensity: 0.38, energy: '语气平缓、声音松下来，像在安静地同故人说话，尾音轻轻落稳' },
  joy: { label: '欣喜快意', intensity: 0.54, energy: '音色明显提亮，语调自然上扬，带出真心的笑意，说到高兴处声音里能听出亮光' },
  thoughtful: { label: '若有所思', intensity: 0.46, energy: '语速略缓，气息收在思考里，像边想边缓缓道来，句子间有真实的沉吟' },
  serious: { label: '郑重坚定', intensity: 0.62, energy: '声音沉下来、更有分量，关键处咬字加重、句尾坚定地落稳，语气里有骨气' },
  sad: { label: '悲伤沉痛', intensity: 0.64, energy: '声音转低转暗，气息发沉，说到痛处语气明显凝滞、微微发颤，情绪从声音里压出来' }
};

// 这些节点不是杜甫台词，后续应分别使用李白或李龟年音色。
const NON_DUFU = new Map([
  ['qizhao/n3a', '李白台词，不能使用杜甫音色'],
  ['qizhao/n5a1', '李白台词，不能使用杜甫音色'],
  ['qizhao/n6a', '李白台词，不能使用杜甫音色'],
  ['qizhao/n7a', '李白台词，不能使用杜甫音色'],
  ['qizhao/n8b', '李白台词，不能使用杜甫音色'],
  ['qizhao/n9b', '李白台词，不能使用杜甫音色'],
  ['qizhao/n12a', '李白台词，不能使用杜甫音色'],
  ['tanzhou/n5', '李龟年台词，不能使用杜甫音色'],
  ['tanzhou/n6a', '李龟年台词，不能使用杜甫音色'],
  ['tanzhou/n6b', '李龟年台词，不能使用杜甫音色'],
  ['tanzhou/n6c', '李龟年台词，不能使用杜甫音色']
]);

// 少量旧剧本把对白、玩家动作和叙述塞在同一个 talk 节点里，必须明确摘出对白。
const VOICE_TEXT_OVERRIDES = {
  'shuhu/n2b': '兄台，是你。这……这怎么好。那你蹲低些，我轻。放我下来，放我下来——我自己看得见了。',
  'shuhu/n2c': '兄台，又劳你帮我！她也会抖？'
};

// 首轮试听与剧情转折处的关键台词需要逐句精调，避免通用规则抹平表演层次。
const PROMPT_OVERRIDES = {
  'wuyue/n5b': '青年杜甫在江南渡口有所顿悟，声音清朗温和，主要是眼界打开后的欣喜与笃定。整体中速，像把刚刚想明白的道理说给同行者听。“山水也是书”“风也是书”两组短句之间留很短的顿，第二个“书”略提亮；“连这渡口上萍水相逢的人”自然铺开，最后一个“都是书”稳稳落下。重音落在“山水”“风”“萍水相逢的人”，不要逐字加重，不用朗诵腔或说教腔。',
  'luoyang_shi/n9b': '青年杜甫在榜上确认落第，主要是强忍失落后的空茫。声音清朗但骤然失去力气，整体中速不拖。“没有”要短、低、轻，句后很短地一顿，像仍不愿相信；“翻来覆去”自然说出，随后在“就是没有”前收住；“杜甫”两字清楚而沉，“这两个字”低声落下。不要哭腔、不要自怜，也不要把苦笑演成真的笑。',
  'taishan/n11a': '青年杜甫立于泰山绝顶，胸襟打开，主要是昂扬而克制的志向。声音明亮开阔，带登山后的真实呼吸，整体中速。“会当凌绝顶”稳步上扬，“一览众山小”舒展开后落稳，两句之间很短的停，不作夸张舞台朗诵；诗后略一收，再回到对同行者说话。“今日我登的是泰山”从容，“将来”前稍停，重读“更高的山”，坚定收尾但不喊口号。',
  'shouang/n2': '青年杜甫刚经历父丧，整句保持低沉、压抑，像突然失去支撑，暂时看不见出路。音色明显转暗，音高偏低，音量轻，气息沉，整体中速不拖，句间停顿清楚但不拖沓。“你来了”不要出现见到故人的欣喜，只是疲惫地确认对方在场；很短一顿后，“父亲走了”低声、平直、近乎麻木，句后一顿留出沉默。“这个家”说得沉重，“往后得我来撑了”不是振作或宣誓，而是被现实压着、不得不接下责任；“撑”字略重但无昂扬感，句尾继续下沉。不要哭喊，不要逐渐明亮，不要演成坚强励志。',
  'qizhao/n10a': '青年杜甫回望与李白纵马饮酒的日子，情绪从明亮快意转为隐约不安。前半声音舒展带笑，整体中速，“纵马射猎、喝酒论诗”三项轻快列举，“最快意的日子”真诚加重但不高喊；“只是”前明显收住，笑意退去，省略号处很短的顿。后半收稳、音色转暗，“往后还能有几回”像自问，句尾自然下落，不做预知命运的夸张悲叹。'
};

const EMOTION_OVERRIDES = {
  'shouang/n2': { emotion: 'sad', intensity: 0.72 }
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

function paceFor(item, emotion, text, stage) {
  const old = OLD_LOCATIONS.has(item.audioQuestId);
  const weak = /喘|咳|气息|声音很哑|声音越来越轻|冻|病|虚弱/.test(stage + text);
  if (weak || item.audioQuestId === 'xiangjiang') return '整体稳速偏缓，短句之间自然换气，保持清楚利落，不拖字';
  if (old) return '整体稳速，长句按意群推进，保持从容，不拖腔';
  // 青年（含壮游）：默认轻快推进，绝不拖沓；只在明确需要时微调，且都强调不拖音。
  if (emotion === 'joy' && /！|眼睛一亮|朗声|兴致|笑/.test(stage + text)) return '整体中速偏轻快，兴奋处略快一点，但每个字仍要站稳，不赶、不拖';
  if (emotion === 'sad') return '整体中速，不刻意放慢；难过体现在音色转低转沉，而不是把字拖长，保持利落';
  if (emotion === 'thoughtful') return '整体中速，思索处只作很短的停顿，想明白后立刻接回正常语流，不要拖';
  if (emotion === 'serious') return '整体中速，关键判断前短停半拍，语气稳而有推进感，不拖腔';
  return '整体中速，像面对面聊天一样自然推进，随句意变化，不拖沓、不拖音';
}

function pauseDirection(text) {
  // 停顿的核心原则是"意思的完整"，而不是每个标点都停；只在确有表达价值时补充细节。
  const parts = ['按意群自然停顿，意思连贯处顺读，不逐字、不逐逗号停顿'];
  if (/……|\.\.\./.test(text)) parts.push('省略号处留一拍，让没说尽的意思自己显出来，但不要拖成刻意停顿');
  if (/——/.test(text)) parts.push('破折号前轻轻一收，后半句作为转折或落点自然接出');
  if (/；/.test(text)) parts.push('分号两侧是并列或对照，读的时候层次要分得开，但不拖');
  if (/：/.test(text)) parts.push('冒号后略一顿，再进入解释或列举');
  if (/？/.test(text)) parts.push('问句只在疑问焦点处轻微上扬，句尾不要悬得太高');
  if (/！/.test(text)) parts.push('感叹句提一点气，但不喊叫');
  return parts.join('；');
}

function hasVerse(text) {
  return /《[^》]+》/.test(text) || /["“][^"”]{4,}["”]/.test(text);
}

function semanticDirection(text, stage, emotion) {
  const notes = [];
  if (hasVerse(text)) notes.push('引诗前稍顿，诗句按诗行意群自然吟出，不用舞台朗诵腔，诗后轻收再回到交谈');
  if (/苦笑|自嘲/.test(stage + text)) notes.push('笑意很淡，底下仍有苦涩，不能真的笑得轻快');
  else if (/笑|眼睛一亮|放光|兴致/.test(stage + text) && emotion === 'joy') notes.push('笑意自然短促，随后立即回到说话');
  if (/压低声音|声音很低|低声|轻声|声音越来越轻/.test(stage + text)) notes.push('音量贴近低声私语，但字头仍要清楚');
  if (/喘|咳|声音很哑|发颤|冻裂|冻僵/.test(stage + text)) notes.push('保留轻微气短或沙哑感，放在换气处表现，不破坏可懂度');
  if (/一字一句|缓缓吟|轻声念|低声吟|朗声/.test(stage + text)) notes.push('遵从文本里的吟念方式，保持人物在场感');
  if (/不悔|总得|不能|偏要|非得|我决意|我信|我只管|更不能/.test(text)) notes.push('核心决意咬字清楚、句尾落稳，不演成口号');
  if (/不是|却|可|但|只是|不过|原来|如今|后来才|才明白|才知道/.test(text)) notes.push('转折词前轻轻一收，重音落在转折后的真正意思上');
  if (/多谢|万幸|故人|兄台|小兄弟/.test(text)) notes.push('对同伴说话要有回应感，像看着对方，不像独白录音');
  if (emotion === 'sad' || /死|夭|饿|哭|泪|丧|没了|不知生死|绝境/.test(text)) notes.push('悲伤要从声音里自然流露：语气凝滞、气息发沉、说到痛处微微发颤，像心里压着一块石头，不要念得平平淡淡');
  if (!notes.length) notes.push('重音服从语义，只突出本句最要紧的几处，其余自然带过');
  return notes.join('；');
}

function inferNuance(item, emotion, text, stage) {
  const all = stage + text;
  if (/苦笑|自嘲/.test(all)) return '表层平静、内里苦涩';
  if (/不悔|偏要|非得|我决意|总得|不能|更不能/.test(text)) return '克制中的坚定';
  if (/多谢|故人|兄台|小兄弟/.test(text)) return emotion === 'sad' ? '悲苦中的感念' : '对同伴的真诚与亲近';
  if (/孩子|妻|父亲|祖父|弟弟|家人/.test(text) && /死|夭|饿|哭|泪|走了|失散|没了/.test(text)) return '说到亲人苦难时声音低沉发痛、语气凝滞';
  if (hasVerse(text)) return `${EMOTION_STYLE[emotion].label}，并带诗意观照`;
  if (/？/.test(text)) return `${EMOTION_STYLE[emotion].label}，带真实的询问或自问`;
  return EMOTION_STYLE[emotion].label;
}

function buildPrompt(item, ttsText) {
  const key = `${item.audioQuestId}/${item.nodeId}`;
  const emotionOverride = EMOTION_OVERRIDES[key];
  const emotion = emotionOverride
    ? emotionOverride.emotion
    : (EMOTION_STYLE[item.emotion] ? item.emotion : 'calm');
  const style = EMOTION_STYLE[emotion];
  const stage = stageText(item.text);
  const nuance = inferNuance(item, emotion, ttsText, stage);
  const isYouth = YOUTH_LOCATIONS.has(item.audioQuestId);
  // 青年节点的收尾不再重复"避免播音腔/客服腔/机械匀速"——通用基准里已经讲透，
  // 逐句结尾只落一句最要紧的提醒，避免指令堆叠稀释表演层次。
  const tail = isYouth
    ? '整句自然收束，语气随情绪走完就停，不要拖音'
    : '整体像真实对话，避免播音腔、现代客服腔、机械匀速和句句同一重音';
  return [
    LOCATION_STYLE[item.audioQuestId] || '杜甫，以贴近人物当下处境的自然口吻说话',
    `主要情绪是${nuance}，${style.energy}`,
    paceFor(item, emotion, ttsText, stage),
    pauseDirection(ttsText),
    semanticDirection(ttsText, stage, emotion),
    tail
  ].join('。') + '。';
}

const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const plan = source.items.map((item) => {
  const key = `${item.audioQuestId}/${item.nodeId}`;
  const ttsText = spokenText(item);
  const actionOnly = !ttsText;
  const nonDufuReason = NON_DUFU.get(key) || '';
  const emotionOverride = EMOTION_OVERRIDES[key];
  const emotion = emotionOverride
    ? emotionOverride.emotion
    : (EMOTION_STYLE[item.emotion] ? item.emotion : 'calm');
  const specificPrompt = actionOnly || nonDufuReason ? '' : (PROMPT_OVERRIDES[key] || buildPrompt(item, ttsText));
  const commonPrompt = YOUTH_LOCATIONS.has(item.audioQuestId)
    ? YOUTH_COMMON_PROMPT
    : (OLD_LOCATIONS.has(item.audioQuestId) ? OLD_COMMON_PROMPT : PACE_COMMON_PROMPT);
  const emotionPrompt = specificPrompt ? `${commonPrompt}${specificPrompt}` : '';
  const entry = {
    audioQuestId: item.audioQuestId,
    nodeId: item.nodeId,
    sourceText: item.text,
    ttsText,
    emotion,
    intensity: emotionOverride ? emotionOverride.intensity : EMOTION_STYLE[emotion].intensity,
    skipTts: actionOnly || Boolean(nonDufuReason),
    skipReason: actionOnly ? '纯动作节点，无可朗读台词' : nonDufuReason,
    emotionPrompt
  };
  return entry;
});

const payload = {
  version: 3,
  generatedAt: new Date().toISOString(),
  lineId: 'dufu',
  kind: 'location',
  sourceManifest: 'dufu-locations.json',
  count: plan.length,
  speakableCount: plan.filter(x => !x.skipTts).length,
  skippedCount: plan.filter(x => x.skipTts).length,
  note: 'emotionPrompt 是直接发送给 context_texts[0] 的完整单句指令，已合并人物年龄、场景、情绪、语速、气息、语义停顿、诗句处理、重音和收尾要求；ttsText 已去除舞台动作。skipTts 节点不得使用杜甫音色生成。',
  plan
};

fs.writeFileSync(TARGET, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`已写 ${path.relative(ROOT, TARGET)}`);
console.log(`总节点 ${payload.count}，杜甫可配音 ${payload.speakableCount}，跳过 ${payload.skippedCount}`);
