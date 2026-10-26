// utils/player-portrait.js —— 玩家外观 id → 立绘路径（唯一拼接实现）
//
// 创建页（pages/player）与聊天页（pages/chat）都要把 avatarId 解析成云图路径，
// 以前两处各写一份字符串拼接，改名或换目录时容易只改一处。这里统一：
//   avatarId → player-avatars.portraitKeyOf → /assets/images/npc/<key>.png
// 非法 avatarId 返回空串，调用方据此渲染 CSS 剪影占位（绝不裂图）。

const playerAvatars = require('./player-avatars');

/** 外观 id → 立绘路径；非法 id 返回空串 */
function portraitPath(avatarId) {
  const key = playerAvatars.portraitKeyOf(avatarId);
  if (!key) return '';
  // 运行时拼接（不用字面量），与 cloudAssets 的云端前缀保持一致
  return '/assets/' + 'images/npc/' + key + '.png';
}

/** 素材键 → 立绘路径（创建页三张外观卡用；无 key 返回空串） */
function portraitPathOfKey(portraitKey) {
  if (!portraitKey) return '';
  return '/assets/' + 'images/npc/' + portraitKey + '.png';
}

module.exports = { portraitPath, portraitPathOfKey };
