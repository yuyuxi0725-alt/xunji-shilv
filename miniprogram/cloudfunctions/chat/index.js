// cloudfunctions/chat/index.js —— 对话云函数（核心：探究引擎的云侧外壳）
//
// 职责：
//   1. 内容安全：用户输入与 AI 输出【双向】过 security.msgSecCheck（面向未成年人的必备合规项）
//   2. 探究引擎：以「史料卡」为知识底座，用苏格拉底式追问引导学生自己说出知识点
//      —— AI 不是「回答机器」，而是「会追问、会考察、会给反馈的历史老师」
//   3. 意图分类 + 三级提示梯 + 节点检验（由史料卡动态出题，无需写死在剧本里）
//   4. 命中知识点即回传应点亮的「知识锚点」，前端据此点亮锚点集卡
//   5. 全链路降级：任何一环失败都给人设内兜底回复，绝不让用户看到报错
//
// 纯逻辑在 ./engine.js（可单元测试），史料卡在 ./knowledge.js
const cloud = require('wx-server-sdk');
const https = require('https');
const engine = require('./engine');
const KNOWLEDGE = require('./knowledge');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ============ 配置区 ============
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
// ⚠️ 生产环境请配置到云函数「环境变量」，切勿硬编码提交
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// ============ 内容安全兜底文案（人设内，不冷场、不说教） ============
const SAFE_REPLY = {
  dufu: '（抬手轻轻止住）少年，这话咱们不必说。外头风大，还是说些正经的——你方才想问我什么？',
  libai: '（把盏一顿，正色）小子，这话我不爱听。来，说点痛快的——你方才要问我什么？'
};

// ============ 入口 ============
exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = (wxContext && wxContext.OPENID) || event.openid || '';

  switch (action) {
    case 'send':
      return await handleSend(event, openid);
    case 'history':
      return await handleHistory(event);
    default:
      return { code: 1, msg: '未知 action' };
  }
};

// ============ 内容安全 ============
/**
 * 内容安全检测（微信官方 security.msgSecCheck v2）
 * 返回 true = 放行；false = 拦截
 * 降级策略：接口未开通/网络异常时放行并打日志，避免因权限未配导致整个对话不可用；
 *          明确判定违规（87014 / risky）时一律拦截。
 */
async function secCheck(content, openid) {
  const text = (content || '').trim();
  if (!text) return true;
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      content: text.slice(0, 2500),
      version: 2,
      scene: 2,               // 2 = 评论/对话场景
      openid: openid || undefined
    });
    const suggest = res && res.result && res.result.suggest;
    if (suggest === 'risky') {
      console.warn('[chat] 内容安全拦截', res.result.label);
      return false;
    }
    return true;
  } catch (err) {
    const code = err && (err.errCode || err.code);
    if (code === 87014) {
      console.warn('[chat] 内容安全判定违规（87014）');
      return false;
    }
    // 48001 = api unauthorized（未在 config.json 声明权限或未开通）；其余为临时异常
    console.warn('[chat] msgSecCheck 不可用，本次放行：', code || (err && err.message));
    return true;
  }
}

// ============ 发送消息（主流程） ============
async function handleSend(event, openid) {
  const { questId, npcId, message, history, freePrompt, covered, quizzed } = event;
  if (!message || !questId) {
    return { code: 1, msg: '缺少参数' };
  }
  const npc = engine.NPC_IDENTITIES[npcId] ? npcId : 'dufu';
  const msg = String(message).trim();

  // —— 第 1 道关：用户输入内容安全 ——
  const userOk = await secCheck(msg, openid);
  if (!userOk) {
    return buildResult({
      reply: SAFE_REPLY[npc] || SAFE_REPLY.dufu,
      stage: 'safety', covered: covered || [], hitIds: [], anchorIds: []
    });
  }

  // 未配置 Key：本地兜底（先跑通链路）
  if (!DEEPSEEK_API_KEY) {
    return buildResult({
      reply: fallbackReply(npc, questId),
      stage: 'fallback', covered: covered || [], hitIds: [], anchorIds: [],
      extra: { fallback: true, reason: '云函数环境变量 DEEPSEEK_API_KEY 未配置' }
    });
  }

  // —— 探究引擎：本地先算意图、命中、提示档位、是否可出题 ——
  const cards = getCards(npc, questId);
  const hitCards = engine.matchCards(msg, cards);
  const level = engine.hintLevel(history, msg);
  const stage = engine.decideStage(msg, hitCards, level);
  const coveredList = engine.mergeCovered(covered, hitCards, cards);
  const ready = engine.isReady(coveredList, cards, quizzed);
  const quiz = ready ? engine.pickQuiz(cards, coveredList, quizzed) : null;
  const anchorIds = engine.uniq(hitCards.map(c => c.anchor));
  const hitIds = hitCards.map(c => c.id);

  try {
    const reply = await callDeepSeek({ npc, questId, message: msg, history, freePrompt, cards, hitCards, coveredList, stage });
    if (!reply) throw new Error('空回复');

    // —— 第 2 道关：AI 输出内容安全（防止模型生成违规内容触达未成年人） ——
    const aiOk = await secCheck(reply, openid);
    if (!aiOk) {
      return buildResult({
        reply: fallbackReply(npc, questId),
        stage: 'safety', covered: coveredList, hitIds, anchorIds, ready, quiz,
        extra: { safety: true }
      });
    }

    return buildResult({ reply, stage, covered: coveredList, hitIds, anchorIds, ready, quiz });
  } catch (err) {
    console.error('[chat] DeepSeek 调用失败，启用兜底回复', err);
    return buildResult({
      reply: fallbackReply(npc, questId),
      stage: 'fallback', covered: coveredList, hitIds, anchorIds, ready, quiz,
      extra: {
        fallback: true,
        reason: ('' + (err && err.message ? err.message : err)).slice(0, 200)
      }
    });
  }
}

// 统一组装返回体
function buildResult(o) {
  return {
    code: 0,
    data: Object.assign({
      reply: '',
      emotion: 'calm',
      stage: 'probe',
      covered: [],
      hitIds: [],
      anchorIds: [],
      ready: false,
      quiz: null
    }, {
      reply: o.reply,
      stage: o.stage,
      covered: o.covered || [],
      hitIds: o.hitIds || [],
      anchorIds: o.anchorIds || [],
      ready: !!o.ready,
      quiz: o.quiz || null
    }, o.extra || {})
  };
}

// 历史消息（体验版：不落库；后续接 dialogues 集合）
async function handleHistory(event) {
  return { code: 0, data: { list: [] } };
}

function getCards(npc, questId) {
  const lib = KNOWLEDGE[npc] || KNOWLEDGE.dufu || {};
  return lib[questId] || [];
}

// ============ 调用 DeepSeek ============
// ⏱ 耗时控制：云函数平台 20s 硬上限（含两道内容安全检测），内部超时 11s；
//    max_tokens / 历史轮数 / prompt 均已压缩
async function callDeepSeek(o) {
  const systemPrompt = engine.buildSystemPrompt(o);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(o.history || []).slice(-6),
    { role: 'user', content: o.message }
  ];
  const data = await callDeepSeekAPI({
    model: DEEPSEEK_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 260,
    stream: false
  });
  return (data.choices[0].message.content || '').trim();
}

// 使用 https 模块调用 DeepSeek（兼容 Node 16 及以下，不依赖 fetch）
function callDeepSeekAPI(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 11000   // 11s 内必须返回，给两道内容安全检测 + 云函数 20s 上限留余量
    }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error('响应解析失败: ' + e.message));
          }
        } else {
          // 把 DeepSeek 返回的错误内容带出来（如 401 Key 无效 / 402 余额不足）
          reject(new Error(`HTTP ${res.statusCode} - ${raw.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('DeepSeek 请求超时（11 秒）'));
    });
    req.write(body);
    req.end();
  });
}

// ============ 兜底回复（Key 未配置 / 超时 / 失败时，人设内无感降级） ============
function fallbackReply(npc, questId) {
  const map = {
    dufu: {
      p1: '（沉吟片刻）少年，方才我思忖了一阵。我年少时遍游吴越齐赵，与太白兄同游梁宋，快意非常。你若好奇，尽管再问我一番见闻。',
      p2: '（放下酒盏，轻叹）长安居，大不易。那年制举，李林甫一句"野无遗贤"，便叫满城举子尽数落第。个中滋味，你若愿听，我慢慢与你说道。',
      p3: '（望向城头，低声）国破山河在，城春草木深。乱离之中，我见尽苍生疾苦。方才走神了——你方才问我什么？再说一遍可好？',
      p4: '（抚着门边竹枝，缓缓）浣花溪畔，我营得一间草堂，总算得了片刻安宁。安得广厦千万间，大庇天下寒士俱欢颜。少年，你方才说到哪里了？'
    },
    libai: {
      p1: '（仰头一笑）痛快！方才我出神了——这一江浩荡，正合我出蜀的心气。你方才问我什么？且再道来，我与你对饮畅谈！',
      p2: '（把酒盏一放，朗声）这长安的酒，苦是苦，倒也能浇愁。我李白什么都能受，独受不得人可怜。你方才问我什么？再说与我听。',
      p3: '（捋须长笑）那沉香亭的牡丹，如今想来，还不如这宫外的一轮明月自在。你方才问我什么？只管问，我知无不言。',
      p4: '（举杯邀你）来，且满饮此杯！人生得意须尽欢，莫使金樽空对月。你方才问我什么？我这会儿高兴，问什么都答你。',
      p5: '（望江长叹，随即又笑）轻舟已过万重山，我李白，到底还是自由了。你方才问我什么？这最后一程，我陪你说个痛快。'
    }
  };
  const m = map[npc] || map.dufu;
  return m[questId] || '（回过神来）且与我说说你的疑问。';
}
