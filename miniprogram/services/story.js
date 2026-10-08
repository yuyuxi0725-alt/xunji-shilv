// services/story.js —— 剧情相关服务
const { call } = require('../utils/cloud');

/**
 * 获取剧本总览
 */
function getOverview() {
  return call('story', { action: 'getOverview' });
}

/**
 * 进入某个时期任务
 */
function enterQuest(questId) {
  return call('story', { action: 'enter', questId });
}

/**
 * 获取当前进度状态
 */
function getState() {
  return call('story', { action: 'getState' });
}

module.exports = { getOverview, enterQuest, getState };
