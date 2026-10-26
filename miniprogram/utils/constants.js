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
  },

  // ===== 应用与备案信息（正式上线前必填，集中在此处，改完即全站生效）=====
  // 「关于」页 / 需要公示备案号的地方统一读取本配置，不要在多处硬编码。
  APP_INFO: {
    name: '寻迹诗旅',
    // 版本号：上线前与小程序后台提交的版本号核对一致
    version: '1.0.0',
    // 工信部备案号：小程序备案审核通过后由工信部下发。
    // 「关于」页会展示并提供一键复制。
    icpNo: '粤ICP备2026153611号',
    // 公安备案号（选填，仅当已做公安备案再填），格式如「粤公网安备 11010802012345号」
    policeNo: '',
    // 主办单位名称（备案主体，上线前填写）
    company: '',
    // 工信部备案查询系统（固定地址，勿改）
    beianUrl: 'https://beian.miit.gov.cn/'
  }
};
