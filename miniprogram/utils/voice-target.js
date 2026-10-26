// utils/voice-target.js —— 配音「该播哪一个、该不该播、结果还能不能用」的纯判定
//
// 为什么要单独抽出来（步骤八）：
//   这三件事以前散在 pages/chat/chat.js 里，属于页面逻辑，测试只能复制一份来「验证复制品」。
//   抽成纯函数后，页面与测试 require 同一实现：
//     · resolveAudioQuestId —— 地点模式用 locationId、时期模式用 questId（决定音频云端路径）；
//     · isNpcTalkNode       —— 只有 NPC 的 talk 节点才播配音（玩家发言/动作/旁白都不播）；
//     · shouldAcceptAudioResult —— 迟到的临时链接是否还能用（防快速切节点时串音）。

/**
 * 当前剧情应该用哪个「音频分组 id」。
 * 地点模式：locationId（audio/voice/dufu/luoyang/n1.mp3）
 * 时期模式：questId   （audio/voice/libai/p2/n3.mp3）
 * 两者都为空时返回空串，调用方据此跳过配音（而不是拼出 dufu//n1.mp3 这种无效键）。
 *
 * @param {object} o { locationMode, locationId, questId }
 * @returns {string}
 */
function resolveAudioQuestId(o) {
  const opt = o || {};
  if (opt.locationMode) return opt.locationId ? String(opt.locationId) : '';
  return opt.questId ? String(opt.questId) : '';
}

/** 节点是否为「NPC 说话」：talk 且 speaker 缺省或显式 npc */
function isNpcTalkNode(node) {
  if (!node || node.type !== 'talk') return false;
  return (node.speaker || 'npc') === 'npc';
}

/**
 * 临时链接返回时，是否还应该播放。
 * 任一条件不满足即丢弃：
 *   · 页面音频上下文已销毁；
 *   · 期间又发起了新的播放请求（request 已过期）；
 *   · 当前节点已经不是发起请求时的那个节点；
 *   · 没拿到链接（未上传音频 / 换取失败）。
 */
function shouldAcceptAudioResult(o) {
  const s = o || {};
  if (!s.audioAlive) return false;
  if (!s.url) return false;
  if (s.request !== s.currentRequest) return false;
  if (s.nodeId !== s.currentNodeId) return false;
  return true;
}

module.exports = { resolveAudioQuestId, isNpcTalkNode, shouldAcceptAudioResult };
