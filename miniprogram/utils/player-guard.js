// utils/player-guard.js —— 玩家角色「守卫 + 返回意图白名单」（纯逻辑，可单测）
//
// 职责：
//   1. 判断某条主线是否需要先走「角色创建/确认」页（杜甫/李白/苏轼三线均启用）；
//   2. 解析角色页收到的返回意图，只接受白名单化的目标（transition / chat / profile），
//      禁止接收并跳转任意页面路径；
//   3. 组装角色页跳转 URL，供各入口守卫复用。
//
// 本模块不依赖 wx / progress / stories —— 角色档案与地点合法性由调用方注入，
// 便于在 tools/test-player-guard.js 里做纯函数测试。

// 启用角色档案的人物线（杜甫 / 李白 / 苏轼三条线均支持角色创建、编辑与全程显示）
const ROLE_LINES = ['dufu', 'libai', 'sushi'];
// 白名单：角色页确认后允许去往的目标
const TARGETS = ['transition', 'chat', 'profile'];

/** 某条主线是否启用玩家角色档案 */
function isRoleLine(lineId) {
  return ROLE_LINES.indexOf(lineId) >= 0;
}

/**
 * 角色状态（纯函数）：not-applicable | none | draft | confirmed
 * @param {string} lineId
 * @param {object|null} profile 已规范化档案（progress.getPlayerProfile 的返回值）
 */
function roleStatus(lineId, profile) {
  if (!isRoleLine(lineId)) return 'not-applicable';
  if (!profile) return 'none';
  if (profile.confirmed === true) return 'confirmed';
  return 'draft';
}

/** 是否需要先走角色页：无档案，或只有迁移草稿（待用户确认一次） */
function needsRolePage(lineId, profile) {
  const s = roleStatus(lineId, profile);
  return s === 'none' || s === 'draft';
}

/**
 * 解析角色页返回意图（白名单校验，纯函数）。
 *
 * @param {object} query 角色页 onLoad 收到的参数 { lineId, target, locationId, mode, edit }
 * @param {Function} [isValidLocation] (lineId, locationId) => boolean；仅 target=chat 时需要，
 *        用于校验地点存在且非锁定（防借角色页绕过锁定地点）。缺省则 target=chat 一律拒绝。
 * @returns {object|null} 合法意图 { lineId, target, ... }；非法返回 null
 */
function parseIntent(query, isValidLocation) {
  const q = query || {};
  const lineId = q.lineId || '';   // 缺失/空 lineId 一律拒绝（不再静默回退到 dufu）
  if (!isRoleLine(lineId)) return null;

  const target = q.target || 'transition';
  if (TARGETS.indexOf(target) < 0) return null;   // 拒绝未知目标（不落到任意路径）

  const intent = { lineId, target };

  if (target === 'chat') {
    const locationId = q.locationId || '';
    const mode = q.mode === 'replay' ? 'replay' : 'continue';
    if (typeof isValidLocation !== 'function' || !isValidLocation(lineId, locationId)) {
      return null;   // 地点非法/缺失 → 拒绝
    }
    intent.locationId = locationId;
    intent.mode = mode;
  } else if (target === 'profile') {
    intent.edit = (q.edit === '1' || q.edit === 'true');
  }
  return intent;
}

/** 组装角色页 URL（供 story/map/chat 等入口守卫跳转；只编码白名单字段） */
function buildPlayerUrl(intent) {
  const seg = '/pages/player/player'
    + '?lineId=' + encodeURIComponent(intent.lineId)
    + '&target=' + encodeURIComponent(intent.target);
  if (intent.target === 'chat') {
    return seg
      + '&locationId=' + encodeURIComponent(intent.locationId || '')
      + '&mode=' + encodeURIComponent(intent.mode || 'continue');
  }
  if (intent.target === 'profile' && intent.edit) {
    return seg + '&edit=1';
  }
  return seg;
}

module.exports = {
  ROLE_LINES,
  TARGETS,
  isRoleLine,
  roleStatus,
  needsRolePage,
  parseIntent,
  buildPlayerUrl
};
