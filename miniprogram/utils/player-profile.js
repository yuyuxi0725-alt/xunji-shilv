// utils/player-profile.js —— 杜甫线玩家角色档案的纯逻辑（姓名规范化 / 校验 / 创建 / 合并）
//
// 档案字段（唯一事实源，对应 docs/杜甫全程玩家角色-修改实施方案.md 步骤二）：
//   {
//     version: 1,
//     avatarId: 'avatar01',   // 外观 ID（白名单见 player-avatars.js）
//     displayName: '寻迹者',  // 角色姓名（与「我的」页账号昵称 userNickname 完全分开）
//     confirmed: true,        // false 仅用于迁移生成的待确认档案
//     createdAt: 0,           // 创建时间戳(ms)
//     updatedAt: 0            // 更新时间戳(ms)
//   }
// 不再保存：职业、初始信任、身份能力（已按新需求移除）。
//
// 姓名规则（用户已确认）：
//   · 1–8 个汉字、英文字母或数字，按 Unicode 码点计数；
//   · 去掉首尾空白，不接受换行和控制字符；
//   · 默认名「寻迹者」。

const playerAvatars = require('./player-avatars');

const PROFILE_VERSION = 1;
const DEFAULT_NAME = '寻迹者';
const NAME_MAX_CHARS = 8;

// 单个字符允许：汉字（CJK 基本区）或英文字母或数字
const NAME_CHAR_RE = /^[a-zA-Z0-9\u4e00-\u9fff]$/;

const PROFILE_KEYS = ['version', 'avatarId', 'displayName', 'confirmed', 'createdAt', 'updatedAt'];
const CONTROL_CHAR_RE = /[\u0000-\u001f\u007f]/;
// 不可见格式字符（复制粘贴常见）：零宽空格/非连接器/连接符、双向格式控制、
// 词连接符与不可见数学符、BOM/零宽不换行空格、软连字符。
// 这些字符肉眼不可见，trim() 去不掉、也不属于控制字符，但会让「看起来正确」的
// 姓名被白名单拒绝——规范化阶段直接剔除，避免用户对着看不见的字符排查。
const INVISIBLE_CHAR_RE = /[\u200b-\u200f\u202a-\u202e\u2060-\u2064\u206a-\u206f\ufeff\u00ad]/g;
const INPUT_IGNORABLE_CHAR_RE = /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2064\u206a-\u206f\ufeff\u00ad]/g;

// ============ 可注入时钟 + 未来时间戳规范化 ============
// 跨设备时钟可能不准：明显异常的未来时间戳（超过 now + 偏移窗口）夹到 now，
// 避免某台时钟超前的设备在 updatedAt 比较中永远获胜。前端与云端（story/merge.js）同规则。
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;   // 5 分钟偏移窗口

let _clock = null;   // 测试可注入固定时钟；null 表示回退 Date.now

/** 测试注入固定时钟；传入函数或 null 复位 */
function setClock(fn) {
  _clock = (typeof fn === 'function') ? fn : null;
}

/** 复位时钟到 Date.now */
function resetClock() { _clock = null; }

/** 当前时间戳（毫秒） */
function nowMs() { return _clock ? _clock() : Date.now(); }

/** 规范化单个时间戳：非有限/负数原样返回（交由校验层处理）；明显未来时间夹到 now */
function clampTimestamp(ts, now) {
  if (!Number.isFinite(ts)) return ts;
  const n = (now === undefined ? nowMs() : now);
  const cap = n + MAX_FUTURE_SKEW_MS;
  return ts > cap ? n : ts;
}

/** 规范化姓名：先剔除不可见格式字符（零宽空格/BOM 等），再去首尾空白；内部控制字符交给校验拒绝，不静默改名 */
function normalizeName(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(INVISIBLE_CHAR_RE, '').trim();
}

/**
 * 清理原生输入框值：额外剔除输入法/粘贴可能夹带且无法在单行输入框中辨认的
 * 换行、制表符等控制字符。仅用于 UI 边界；档案层仍严格拒绝未经清理的控制字符。
 */
function sanitizeNameInput(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(INPUT_IGNORABLE_CHAR_RE, '').trim();
}

/** 姓名是否合法（非空、≤8 码点、每个字符均为汉字/字母/数字、无首尾空白与控制字符） */
function isValidName(name) {
  if (typeof name !== 'string') return false;
  if (name.length === 0) return false;
  if (name !== normalizeName(name)) return false;   // 必须是已规范化后的形态
  if (CONTROL_CHAR_RE.test(name)) return false;
  const chars = Array.from(name);                    // 按 Unicode 码点计数
  if (chars.length > NAME_MAX_CHARS) return false;
  return chars.every(ch => NAME_CHAR_RE.test(ch));
}

/** 创建一份已确认的档案（姓名不合法返回 null） */
function createProfile(avatarId, rawName) {
  if (!playerAvatars.isValidAvatar(avatarId)) return null;
  if (typeof rawName !== 'string' || CONTROL_CHAR_RE.test(rawName)) return null;
  const name = normalizeName(rawName);
  if (!isValidName(name)) return null;
  const now = nowMs();
  return {
    version: PROFILE_VERSION,
    avatarId,
    displayName: name,
    confirmed: true,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 校验一份档案是否结构合法。
 * 合法：只含规定字段、version 正确、avatarId 在白名单、displayName 合法、
 *       confirmed 为布尔、时间字段为非负有限整数，且 updatedAt 不早于 createdAt。
 */
function isValidProfile(p) {
  if (!p || typeof p !== 'object') return false;
  if (Object.keys(p).some(k => PROFILE_KEYS.indexOf(k) < 0)) return false;
  if (p.version !== PROFILE_VERSION) return false;
  if (!playerAvatars.isValidAvatar(p.avatarId)) return false;
  if (!isValidName(p.displayName)) return false;
  if (typeof p.confirmed !== 'boolean') return false;
  const ca = p.createdAt;
  const ua = p.updatedAt;
  if (!Number.isFinite(ca) || !Number.isInteger(ca) || ca < 0) return false;
  if (!Number.isFinite(ua) || !Number.isInteger(ua) || ua < ca) return false;
  return true;
}

/** 返回只含白名单字段的档案副本；非法档案返回 null。明显异常的未来时间戳被规范化（夹到 now） */
function normalizeProfile(p, now) {
  if (!isValidProfile(p)) return null;
  const n = (now === undefined ? nowMs() : now);
  let createdAt = clampTimestamp(p.createdAt, n);
  let updatedAt = clampTimestamp(p.updatedAt, n);
  if (updatedAt < createdAt) updatedAt = createdAt;   // 夹取后维持 updatedAt >= createdAt
  return {
    version: p.version,
    avatarId: p.avatarId,
    displayName: p.displayName,
    confirmed: p.confirmed,
    createdAt,
    updatedAt
  };
}

/**
 * 合并两份玩家角色档案（纯函数，幂等且满足交换性）。
 * 规则（对应实施文档 6.2）：
 *   · 非法档案按 null 处理；字段缺失不删除已有档案；
 *   · 已确认(confirmed)优先于待确认(false)；
 *   · 同为已确认时按 updatedAt 取较新的一整份（不把姓名和外观拼成用户未选过的组合）；
 *   · updatedAt 相同时按规范化字段排序打破平局，保证交换合并顺序也能收敛；
 *   · createdAt 保留最早有效值。
 */
function mergePlayerProfile(a, b, now) {
  const n = (now === undefined ? nowMs() : now);
  const va = normalizeProfile(a, n);
  const vb = normalizeProfile(b, n);
  if (!va && !vb) return null;
  if (!va) return Object.assign({}, vb);
  if (!vb) return Object.assign({}, va);

  let chosen;
  const ca = va.confirmed !== false;   // 缺省视为已确认
  const cb = vb.confirmed !== false;
  if (ca !== cb) {
    chosen = ca ? va : vb;
  } else {
    const ua = Number(va.updatedAt) || 0;
    const ub = Number(vb.updatedAt) || 0;
    if (ua !== ub) {
      chosen = ua > ub ? va : vb;
    } else {
      // 确定性平局：按规范化字段字典序比较
      const sa = JSON.stringify([va.avatarId, va.displayName, Number(va.createdAt) || 0]);
      const sb = JSON.stringify([vb.avatarId, vb.displayName, Number(vb.createdAt) || 0]);
      chosen = sa >= sb ? va : vb;
    }
  }

  const out = Object.assign({}, chosen);
  // createdAt 保留最早有效值
  const earned = [Number(va.createdAt), Number(vb.createdAt)]
    .filter(v => Number.isFinite(v) && v > 0);
  if (earned.length) out.createdAt = Math.min.apply(null, earned);
  return out;
}

module.exports = {
  PROFILE_VERSION,
  DEFAULT_NAME,
  NAME_MAX_CHARS,
  PROFILE_KEYS,
  MAX_FUTURE_SKEW_MS,
  setClock,
  resetClock,
  nowMs,
  clampTimestamp,
  normalizeName,
  sanitizeNameInput,
  isValidName,
  createProfile,
  isValidProfile,
  normalizeProfile,
  mergePlayerProfile
};
