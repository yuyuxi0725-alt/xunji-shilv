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
const memory = require('./memory');
const scenes = require('./scenes');
const fallback = require('./fallback');   // 人设内兜底文案（纯数据，可单测）

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// ============ 配置区 ============
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
// ⚠️ 生产环境请配置到云函数「环境变量」，切勿硬编码提交
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// 内容安全兜底与调用失败兜底统一来自 ./fallback.js（纯数据，可单元测试）
const SAFE_REPLY = fallback.SAFE_REPLY;
const fallbackReply = fallback.fallbackReply;

// ============ 地点 → 时期 映射（三线地点叙事模式，按 npc 分层） ============
// 地点模式的 questId 是地点 ID（如 luoyang），但知识库/人设时代仍按 p1–p4/p5 索引。
// 此表把地点 ID 归位到所属时期，AI 查卡与兜底回复据此回退。
// 与 miniprogram/utils/stories/{dufu,libai,sushi}-locations.js 的 LOCATION_PERIOD 保持一致。
// 按 npc 分层：避免跨线同 id（如杜甫/苏轼都有 fengxiang）冲突。
const LOCATION_PERIOD = {
  dufu: {
    luoyang: 'p1', luoyang_shi: 'p1', taishan: 'p1', shuhu: 'p1', wuyue: 'p1', qizhao: 'p1',
    changan: 'p2', yexian: 'p2', fengxian: 'p2',
    changan_xian: 'p3', fengxiang: 'p3', qiangcun: 'p3', huazhou: 'p3',
    qinzhou: 'p4', tonggu: 'p4', chengdu: 'p4', kuizhou: 'p4', jingzhou: 'p4',
    tanzhou: 'p4', hengzhou: 'p4', xiangjiang: 'p4'
  },
  libai: {
    qinglian: 'p1', emei: 'p1', jingmen: 'p1', yangzhou: 'p1', anlu: 'p1',
    changan1: 'p2', zhongnan: 'p2',
    hanlin: 'p3',
    luoyang_libai: 'p4', songshan: 'p4', tianmu: 'p4', liangsong: 'p4', xuanzhou: 'p4', youyan: 'p4',
    lushan: 'p5', yongwang: 'p5', xunyang: 'p5', liuyelang: 'p5', baidi: 'p5', dangtu: 'p5'
  },
  sushi: {
    meishan: 'p1', bianjing: 'p1', fengxiang: 'p1',
    hangzhou: 'p2', mizhou: 'p2', xuzhou: 'p2', huzhou: 'p2',
    wutai: 'p3',
    dinghui: 'p4', dongpo: 'p4', chibi: 'p4', shahu: 'p4', chengtian: 'p4',
    dengzhou: 'p5', suti: 'p5', yingzhou: 'p5', yangzhou: 'p5', dingzhou: 'p5',
    huizhou: 'p5', danzhou: 'p5', jinshan: 'p5', changzhou: 'p5'
  }
};

/** 地点 ID → 所属时期（按 npc 分层查，前端漏传 periodId 时兜底） */
function locationPeriodOf(npc, locationId) {
  const map = LOCATION_PERIOD[npc] || LOCATION_PERIOD.dufu || {};
  return map[locationId] || '';
}

/**
 * 按白名单解析 AI 场景 prompt（npcId / locationId / nodeId 三要素校验）。
 * 命中返回白名单 prompt；未命中返回空串（不信任客户端自由 freePrompt）。
 */
function resolveScene(npc, locationId, nodeId) {
  return memory.resolveScenePrompt(scenes, npc, locationId, nodeId);
}

/**
 * 读取「可信的已完成地点」列表（可信边界，步骤七）：
 *   · 云端有该用户进度文档 → 以云端 locationStates.dufu 的 completed 为准（权威）；
 *   · 云端无文档 / 读失败 → 降级用客户端本地声称（memory.resolveAvailableEvents 会再做
 *     白名单 + 顺序截断，且第一版只注入必经事实，风险可控，不阻塞对话）。
 */
async function readCompletedLocations(openid, clientCompleted) {
  try {
    const res = await db.collection('users').where({ openid }).limit(1).get();
    const doc = res.data && res.data[0];
    if (doc && doc.progress) {
      const states = doc.progress.locationStates && doc.progress.locationStates.dufu;
      if (states && typeof states === 'object') {
        return Object.keys(states).filter(id => states[id] === 'completed');
      }
      return [];   // 有文档但无地点完成记录（旧快照/新用户）→ 不信任客户端声称
    }
    // 无文档（新用户/首次）→ 降级
  } catch (err) {
    console.warn('[chat] 读取云端进度失败，降级为客户端本地进度', err);
  }
  return clientCompleted || [];
}

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
 * 安全策略：仅明确返回 pass 时放行；review / risky / 接口异常一律拦截并走预设安全回复。
 * 面向未成年人时必须失败关闭，不能因权限或网络异常绕过内容安全检查。
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
    if (suggest === 'pass') return true;

    console.warn('[chat] 内容安全未通过', {
      suggest: suggest || 'unknown',
      label: res && res.result && res.result.label
    });
    return false;
  } catch (err) {
    const code = err && (err.errCode || err.code);
    if (code === 87014) {
      console.warn('[chat] 内容安全判定违规（87014）');
      return false;
    }
    // 48001 = api unauthorized（未在 config.json 声明权限或未开通）；其余为临时异常。
    // 统一失败关闭：返回预设安全内容，不把未经检查的输入或模型输出展示给未成年人。
    console.warn('[chat] msgSecCheck 不可用，本次拦截：', code || (err && err.message));
    return false;
  }
}

// ============ 发送消息（主流程） ============
async function handleSend(event, openid) {
  // freePrompt 仍在协议里接收（旧客户端会传），但**刻意不使用**：
  // 杜甫线一律用白名单场景 prompt，见下方 resolveScene；其它线本轮未启用地点记忆，
  // 也只在白名单外按通用语气作答。保留解构是为了让字段来源一眼可见，而非遗漏。
  const {
    questId, npcId, message, history, covered, quizzed,
    locationId, periodId, nodeId
  } = event;
  if (!message || !questId) {
    return { code: 1, msg: '缺少参数' };
  }
  const npc = engine.NPC_IDENTITIES[npcId] ? npcId : 'dufu';
  const msg = String(message).trim();

  // 地点模式：把地点 ID 归位到所属时期（AI 知识库与人设时代仍按 p1–p4/p5 索引）。
  // 优先用前端显式传的 periodId；缺失时按 npc 分层本地映射兜底；再退回原始 questId。
  const periodKey = periodId || locationPeriodOf(npc, locationId || questId) || questId;

  // —— 杜甫线：AI 场景白名单 + 可信 prompt + 可用共同经历（步骤七）——
  // 服务端不信任客户端自由传入的 freePrompt：白名单命中时用剧本里的可信 prompt，
  // 未命中（越级 URL / 未知节点 / 旧客户端）则给空 prompt，模型按通用语气继续。
  let scenePrompt = '';
  let availableMemories = [];
  if (npc === 'dufu' && locationId && memory.isKnownLocation(locationId)) {
    scenePrompt = resolveScene(npc, locationId, nodeId);
    const completed = await readCompletedLocations(openid, event.completedLocations);
    availableMemories = memory.resolveAvailableEvents(locationId, completed);
  }

  // —— 第 1 道关：用户输入内容安全 ——
  const userOk = await secCheck(msg, openid);
  if (!userOk) {
    return buildResult({
      reply: SAFE_REPLY[npc] || SAFE_REPLY.dufu,
      stage: 'safety', covered: covered || [], hitIds: [], anchorIds: []
    });
  }

  // 常见误解由本地知识规则稳定纠正，不依赖模型临场判断。
  // 玩家没有主动提及则不会触发，也不会把该知识点记成“已经学会”。
  const cards = getCards(npc, periodKey);
  const misconceptionMatches = engine.matchMisconceptions(msg, cards);
  if (misconceptionMatches.length) {
    return buildResult({
      reply: engine.misconceptionReply(misconceptionMatches),
      stage: 'misconception', covered: covered || [], hitIds: [], anchorIds: []
    });
  }

  // 未配置 Key：本地兜底（先跑通链路）
  if (!DEEPSEEK_API_KEY) {
    return buildResult({
      reply: fallbackReply(npc, periodKey),
      stage: 'fallback', covered: covered || [], hitIds: [], anchorIds: [],
      extra: { fallback: true, reason: '云函数环境变量 DEEPSEEK_API_KEY 未配置' }
    });
  }

  // —— 探究引擎：本地先算意图、命中、提示档位、是否可出题 ——
  const hitCards = engine.matchCards(msg, cards);
  const level = engine.hintLevel(history, msg);
  const stage = engine.decideStage(msg, hitCards, level);
  const coveredList = engine.mergeCovered(covered, hitCards, cards);
  const ready = engine.isReady(coveredList, cards, quizzed);
  const quiz = ready ? engine.pickQuiz(cards, coveredList, quizzed) : null;
  const anchorIds = engine.uniq(hitCards.map(c => c.anchor));
  const hitIds = hitCards.map(c => c.id);

  try {
    const reply = await callDeepSeek({
      npc,
      questId: periodKey,
      locationId: locationId || '',
      message: msg,
      history,
      freePrompt: scenePrompt,   // 白名单可信 prompt（替代客户端 freePrompt）
      availableMemories,
      cards,
      hitCards,
      coveredList,
      stage
    });
    if (!reply) throw new Error('空回复');

    // —— 第 2 道关：AI 输出内容安全（防止模型生成违规内容触达未成年人） ——
    const aiOk = await secCheck(reply, openid);
    if (!aiOk) {
      return buildResult({
        reply: fallbackReply(npc, periodKey),
        stage: 'safety', covered: coveredList, hitIds, anchorIds, ready, quiz,
        extra: { safety: true }
      });
    }

    return buildResult({ reply, stage, covered: coveredList, hitIds, anchorIds, ready, quiz });
  } catch (err) {
    console.error('[chat] DeepSeek 调用失败，启用兜底回复', err);
    return buildResult({
      reply: fallbackReply(npc, periodKey),
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
