// utils/play-mode.js —— 游玩模式的纯判定（正式 continue / 重温 replay）
//
// 为什么要单独抽出来（步骤九）：
//   「重温只读」是强约束：不写检查点、地点状态、诗笺、锚点、任务、见证物、通关时间。
//   这些判断以前散在 chat.js 各处（有的写在 onHide、有的写在 onLocationEnd），
//   测试只能靠复制一份页面逻辑来"验证复制品"。抽成纯函数后页面与测试共用同一实现。
//
// 约束（对应 docs/杜甫全程玩家角色-修改实施方案.md 步骤九「重温规则」）：
//   · replay 从该地点 start 开始，忽略检查点；
//   · replay 不得写任何正式进度；
//   · continue 沿用已保存检查点，退出重温后继续正式旅程仍回到原位置。

/** 是否重温模式（只认字符串 'replay'，其它一律按正式游玩处理） */
function isReplay(mode) {
  return mode === 'replay';
}

/** 本次会话是否允许写正式进度 */
function shouldPersist(mode) {
  return !isReplay(mode);
}

/**
 * 计算起点节点 id（纯函数）。
 *   · 重温：恒为 quest.start，不看检查点；
 *   · 正式：检查点存在且节点仍存在于当前剧本时从检查点续，否则从 start。
 * 检查点指向已删除节点时必须安全回退，不能让玩家进到一个不存在的节点。
 *
 * @param {object} o { mode, start, checkpoint, nodes }
 * @returns {string}
 */
function resolveStartNode(o) {
  const opt = o || {};
  const start = opt.start || '';
  if (isReplay(opt.mode)) return start;
  const ckpt = opt.checkpoint && opt.checkpoint.nodeId;
  if (ckpt && opt.nodes && opt.nodes[ckpt]) return ckpt;
  return start;
}

module.exports = { isReplay, shouldPersist, resolveStartNode };
