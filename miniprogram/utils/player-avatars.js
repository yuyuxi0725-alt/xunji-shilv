// utils/player-avatars.js —— 杜甫线玩家「外观」白名单（手工维护）
//
// 用途：玩家角色创建 / 编辑页的外观卡数据源，以及旧泰山「身份」角色的外观迁移映射。
//
// 关键约定（对应 docs/杜甫全程玩家角色-修改实施方案.md 步骤二）：
//   · 三张立绘复用现有云图（tang-*.png），只作为「外观」，不绑定职业、能力或初始信任。
//   · avatar01/02/03 是稳定外观 ID，不再让「书生/引路人/旅人」这类职业名成为逻辑条件。
//   · 文案先用中性「形象一 / 形象二 / 形象三」，避免沿用旧职业标签；后续可换成准确的服饰描述。
//   · 素材键继续指向既有 npc 立绘目录，不因更名重新上传一套相同图片。

const AVATARS = Object.freeze([
  Object.freeze({ id: 'avatar01', name: '形象一', portraitKey: 'tang-young-scholar' }),
  Object.freeze({ id: 'avatar02', name: '形象二', portraitKey: 'tang-mountain-guide' }),
  Object.freeze({ id: 'avatar03', name: '形象三', portraitKey: 'tang-passing-traveler' })
]);

const DEFAULT_AVATAR_ID = 'avatar01';

// 旧泰山「身份」roleId → 新外观 id（迁移用：只迁外观，不迁职业 / 信任 / 能力语义）
const LEGACY_ROLE_TO_AVATAR = Object.freeze({
  fellowScholar: 'avatar01',
  mountainGuide: 'avatar02',
  passingTraveler: 'avatar03'
});

/** 取某个外观的定义；id 非法返回 null */
function getAvatar(id) {
  if (!id) return null;
  return AVATARS.find(a => a.id === id) || null;
}

/** 全部外观 id 列表 */
function getAvatarIds() {
  return AVATARS.map(a => a.id);
}

/** 外观 id 是否合法（在白名单内） */
function isValidAvatar(id) {
  return !!getAvatar(id);
}

/** 外观 id → 立绘素材键（无则空串） */
function portraitKeyOf(id) {
  const a = getAvatar(id);
  return a ? a.portraitKey : '';
}

/** 外观 id → 展示名（形象一/二/三，无则空串） */
function avatarNameOf(id) {
  const a = getAvatar(id);
  return a ? a.name : '';
}

/** 旧泰山角色 id → 新外观 id；非旧角色返回空串 */
function avatarForLegacyRole(roleId) {
  return LEGACY_ROLE_TO_AVATAR[roleId] || '';
}

module.exports = {
  AVATARS,
  DEFAULT_AVATAR_ID,
  LEGACY_ROLE_TO_AVATAR,
  getAvatar,
  getAvatarIds,
  isValidAvatar,
  portraitKeyOf,
  avatarNameOf,
  avatarForLegacyRole
};
