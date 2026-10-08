// cloudfunctions/story/index.js —— 剧情云函数
// 职责：剧本总览、时期进入、进度状态查询
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 主线剧本配置（体验版，后续迁入 quests 集合实现内容与代码解耦）
const STORY_CONFIG = {
  periods: [
    { id: 'p1', name: '读书壮游', range: '712–745' },
    { id: 'p2', name: '困守长安', range: '746–755' },
    { id: 'p3', name: '陷贼为官', range: '756–759' },
    { id: 'p4', name: '漂泊西南', range: '759–770' }
  ]
};

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action } = event;

  switch (action) {
    case 'getOverview':
      return await getOverview(openid);
    case 'enter':
      return await enterQuest(openid, event.questId);
    case 'getState':
      return await getState(openid);
    default:
      return { code: 1, msg: '未知 action' };
  }
};

// 剧本总览
async function getOverview(openid) {
  const progress = await getUserProgress(openid);
  const periods = STORY_CONFIG.periods.map((p, i) => {
    // 计算状态：第一个默认 active，其余根据进度
    let state = 'locked';
    if (i === 0) state = progress[p.id] === 'completed' ? 'completed' : 'active';
    else if (progress[p.id] === 'completed') state = 'completed';
    else if (progress[STORY_CONFIG.periods[i - 1].id] === 'completed') state = 'active';
    return { ...p, state };
  });

  return { code: 0, data: { story: { title: '杜甫' }, periods } };
}

// 进入时期
async function enterQuest(openid, questId) {
  const period = STORY_CONFIG.periods.find(p => p.id === questId);
  if (!period) {
    return { code: 1, msg: '时期不存在' };
  }
  return { code: 0, data: { questId, name: period.name } };
}

// 进度状态
async function getState(openid) {
  const progress = await getUserProgress(openid);
  return { code: 0, data: { progress } };
}

// 读取用户进度
async function getUserProgress(openid) {
  try {
    const res = await db.collection('users').where({ openid }).get();
    if (res.data.length > 0) {
      return res.data[0].progress || {};
    }
  } catch (err) {
    console.error('[story] 读取进度失败', err);
  }
  return {};
}
