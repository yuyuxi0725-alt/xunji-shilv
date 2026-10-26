// utils/player-card.js —— 「我的角色」卡片状态与地图同行者显示的纯逻辑（步骤九）
//
// 抽出的原因同上：卡片四态（none / draft / confirmed / invalid）是产品行为，
// 不该只能靠复制 profile.js 的 if-else 来测试。
//
// 四态含义：
//   none      无档案 → 「创建角色」
//   draft     迁移草稿 confirmed:false → 「确认角色」
//   confirmed 已确认 → 「编辑」
//   invalid   存储里有档案但不合法 → 「修复角色」（不崩溃、不静默丢弃）
// 另外：只有 status === 'confirmed' 才允许进「编辑」模式；其余都走创建/确认流程。

const playerAvatars = require('./player-avatars');
const playerPortrait = require('./player-portrait');
const guard = require('./player-guard');

const LABELS = {
  none: '创建角色',
  draft: '确认角色',
  confirmed: '编辑',
  invalid: '修复角色'
};

/**
 * @param {object|null} profile progress.getPlayerProfile 的返回值（合法或 null）
 * @param {boolean} hasInvalid progress.hasInvalidPlayerProfile 的返回值
 * @returns {{status, label, displayName, avatarName, portraitKey, portraitPath, editable}}
 */
function resolveRoleCard(profile, hasInvalid) {
  if (!profile && hasInvalid) {
    return {
      status: 'invalid',
      label: LABELS.invalid,
      displayName: '角色资料需修复',
      avatarName: '',
      portraitKey: '',
      portraitPath: '',
      editable: false
    };
  }
  if (!profile) {
    return {
      status: 'none',
      label: LABELS.none,
      displayName: '',
      avatarName: '',
      portraitKey: '',
      portraitPath: '',
      editable: false
    };
  }
  const status = profile.confirmed === true ? 'confirmed' : 'draft';
  const key = playerAvatars.portraitKeyOf(profile.avatarId);
  return {
    status,
    label: LABELS[status],
    displayName: profile.displayName,
    avatarName: playerAvatars.avatarNameOf(profile.avatarId),
    portraitKey: key,
    portraitPath: playerPortrait.portraitPath(profile.avatarId),
    editable: status === 'confirmed'
  };
}

/**
 * 地图「当前行迹」卡片上的同行者姓名。
 * 三条角色线（杜甫/李白/苏轼）通用：仅当该线有已确认档案时返回姓名；
 * 无档案或非角色线返回空字符串，各线之间不串名（不把杜甫名字显示到李白/苏轼地图）。
 * @param {string} lineId
 * @param {object|null} profile
 */
function companionName(lineId, profile) {
  if (!guard.isRoleLine(lineId)) return '';
  if (!profile || profile.confirmed !== true) return '';
  return profile.displayName || '';
}

module.exports = { LABELS, resolveRoleCard, companionName };
