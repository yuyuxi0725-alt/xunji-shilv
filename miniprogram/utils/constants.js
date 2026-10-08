// utils/constants.js —— 全局常量
module.exports = {
  // 剧情时期状态（与后端状态机一致）
  QUEST_STATE: {
    LOCKED: 'locked',
    ACTIVE: 'active',
    COMPLETED: 'completed'
  },
  // NPC 情绪五档
  EMOTION: {
    CALM: 'calm',       // 平静
    JOY: 'joy',         // 喜悦
    SAD: 'sad',         // 忧伤
    THOUGHTFUL: 'thoughtful', // 沉思
    SERIOUS: 'serious'  // 凝重
  },
  // 情绪对应文案
  EMOTION_TEXT: {
    calm: '平静',
    joy: '喜悦',
    sad: '忧伤',
    thoughtful: '沉思',
    serious: '凝重'
  },
  // 主线剧本信息（体验版硬编码，后续从 story.getOverview 拉取）
  STORY: {
    title: '杜甫',
    subtitle: '沉浸式历史文学探究',
    periods: [
      { id: 'p1', name: '读书壮游', range: '712–745', desc: '少年游历，意气风发' },
      { id: 'p2', name: '困守长安', range: '746–755', desc: '科场失意，困顿京华' },
      { id: 'p3', name: '陷贼为官', range: '756–759', desc: '战乱流离，陷身贼中' },
      { id: 'p4', name: '漂泊西南', range: '759–770', desc: '草堂岁月，漂泊西南' }
    ]
  }
};
