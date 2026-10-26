// utils/dufu-recap.js —— 终章「同行者」回望的纯逻辑（可单测）
//
// 职责（对应 docs/杜甫全程玩家角色-修改实施方案.md 步骤九）：
//   · 从「已完成地点」里挑出一段回望，只用全体玩家必经事件（utils/dufu-events.js）；
//   · 时序表述是「在一次次重逢中，你见过……」，不写成几十年肉身伴随；
//   · 不根据 avatarId 推断性别/职业/性格，也不把玩家写成改变杜甫命运的人；
//   · 重温（replay）不宣称走过全程，只给一句中性的收束提示。
//
// 本模块不依赖 wx / progress / 页面，便于 tools/test-replay-isolation.js 直接 require。

const dufuEvents = require('./dufu-events');

// 回望挑选的锚点：按生平跨度铺开，避免 22 条全塞进面板。
// 只做「挑选」，不新增事实——每一条都来自 dufu-events 的必经事件。
const RECAP_PICKS = [
  'luoyang',        // 初见
  'taishan',        // 青年抱负
  'changan',        // 困守长安
  'fengxian',       // 丧子与民间疾苦
  'changan_xian',   // 陷贼
  'chengdu',        // 草堂安宁
  'kuizhou',        // 晚年登高
  'xiangjiang'      // 收束
];

// 面板最多显示几条（关键地点收束面板高度有限，超过会挤压按钮）
const MAX_RECAP_LINES = 5;

/**
 * 生成终章回望行。
 *
 * @param {object} o
 *   @param {string} o.lineId 人物线 id（仅杜甫线返回回望，其它线返回 []）
 *   @param {string} o.currentLocationId 当前（收束）地点
 *   @param {Array<string>} o.completedLocations 已完成的正式地点（不含本次 replay）
 *   @param {boolean} o.isReplay 是否重温
 * @param {string} o.displayName 角色姓名（可空，空则用「同行者」）
 * @returns {Array<string>} 文案行（已含「同行者：××」一行；不需要时返回 []）
 */
function buildRecap(o) {
  const opt = o || {};
  if (opt.lineId !== 'dufu') return [];   // 其它人物线保持原结算，不显示杜甫角色

  const name = String(opt.displayName || '').trim() || '同行者';
  const lines = [];

  // 重温：不宣称走过全程，只给中性提示（正式进度与诗笺均未改变）
  if (opt.isReplay) {
    lines.push('同行者：' + name);
    lines.push('这一段是回望。风景还在原处，你的正式旅程与诗笺都没有被改写。');
    return lines;
  }

  const done = (opt.completedLocations || []).filter(id => dufuEvents.order.indexOf(id) >= 0);
  const doneSet = {};
  done.forEach((id) => { doneSet[id] = true; });
  // 收束的这一刻，当前地点本身也已算走完（onLocationEnd 已先写 completed）
  if (opt.currentLocationId) doneSet[opt.currentLocationId] = true;

  const picked = RECAP_PICKS.filter(id => doneSet[id] && dufuEvents.recaps[id]);
  if (!picked.length) {
    // 一个地点都没完成时不编造回望（例如数据异常/极早期退出）
    lines.push('同行者：' + name);
    return lines;
  }

  // 超过上限时保留首、尾与中段，确保「初见—鼎盛—收束」都在
  let chosen = picked;
  if (picked.length > MAX_RECAP_LINES) {
    const head = picked.slice(0, 2);
    const tail = picked.slice(-2);
    const mid = picked.slice(2, -2);
    const midPick = mid[Math.floor(mid.length / 2)];
    chosen = head.concat(midPick ? [midPick] : [], tail);
  }

  lines.push('同行者：' + name);
  lines.push('在一次次重逢中，你见过——');
  chosen.forEach((id) => { lines.push('· ' + dufuEvents.recaps[id]); });
  return lines;
}

/** 面板是否需要在本次收束显示「同行者」区块（杜甫线且有角色） */
function shouldShowRecap(lineId, displayName) {
  if (lineId !== 'dufu') return false;
  return !!String(displayName || '').trim();
}

module.exports = {
  RECAP_PICKS,
  MAX_RECAP_LINES,
  buildRecap,
  shouldShowRecap
};
