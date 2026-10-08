// services/chat.js —— 对话相关服务
const { call } = require('../utils/cloud');

/**
 * 发送一条消息（流式）
 * 体验版：云函数内部调用 DeepSeek，返回完整回复
 * @param {object} payload { sessionId, questId, message, history }
 */
function sendMessage(payload) {
  return call('chat', { action: 'send', ...payload });
}

/**
 * 获取历史消息
 */
function getHistory(sessionId) {
  return call('chat', { action: 'history', sessionId });
}

module.exports = { sendMessage, getHistory };
