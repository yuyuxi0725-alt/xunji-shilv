// pages/chat/chat.js —— 视觉小说式对话页（核心引擎，多主线通用）
// 流程：脚本节点推进（narrate/talk/choice）→ aiFree 自由对话 → 继续推进
// 多主线：通过 URL storyId 从注册表加载对应故事线，本引擎与具体古人解耦
const stories = require('../../utils/stories/index');
const assets = require('../../utils/cloudAssets');
const ttsAudio = require('../../utils/ttsAudio');
const chatService = require('../../services/chat');
const progress = require('../../utils/progress');
const anchorInfo = require('../../utils/stories/anchor-info');
const playerAvatars = require('../../utils/player-avatars');
const playerPortrait = require('../../utils/player-portrait');
const voiceTarget = require('../../utils/voice-target');
const dufuRecap = require('../../utils/dufu-recap');
const playMode = require('../../utils/play-mode');
const storyVariants = require('../../utils/story-variants');
const guard = require('../../utils/player-guard');
const app = getApp();

// 锚点获得方式：越靠后越"硬"。同一枚印记若先被剧情带出、后被学生自己答出来，
// 允许再落一次印（用更硬的获得方式覆盖），让"我自己发现了它"这件事被看见。
// 注意 confirm 与 answer 的区别：confirm = "说到了正确答案但语气不确定"，是求证，不是理解。
const KIND_RANK = { story: 0, choice: 1, confirm: 2, answer: 3 };

/** 未知 kind 一律当作最弱，避免脏数据把已点亮的印记重复顶掉 */
function rankOf(kind) {
  const r = KIND_RANK[kind];
  return typeof r === 'number' ? r : -1;
}

/**
 * 优先使用已经成功解析成云端临时链接的轻动效；动图未上传或解析失败时
 * 保持原静态立绘，避免新增素材造成裂图。
 */
function selectNpcPortrait(line, stage) {
  const still = (line.periodNpcImages && line.periodNpcImages[stage]) || line.npcImage || '';
  const animated = line.periodNpcAnimations && line.periodNpcAnimations[stage];
  const animationReady = !!animated && !assets.isMigratable(animated);
  return { src: animationReady ? animated : still, animated: animationReady };
}

// 各获得方式对应的印记类别与标签（卡片文案随类型变化）
const KIND_SEAL = {
  story: '寻迹印记',
  choice: '抉择印记',
  confirm: '诗史印记',
  answer: '诗史印记'
};
const KIND_LABEL = {
  story: '剧情印记',
  choice: '选择命中',
  confirm: '求证命中',
  answer: '回答命中'
};

// 场景交叉淡入的时长（必须与 chat.wxss 里 .vn-bg-over 的 transition 对齐：
// 普通 0.9s、回忆闪回 1.6s）。旧背景要等这段淡入走完才删除。
const SCENE_FADE_MS = 900;
const SCENE_FADE_SLOW_MS = 1600;

Page({
  data: {
    // 页面静态资源（onLoad 时按故事线填充）
    npcImage: '',
    npcMotion: false,
    npcName: '',
    sceneImage: '',
    periodName: '',

    // 场景交叉淡入淡出
    scenePrev: '',      // 过渡期间的旧背景（垫底层）
    sceneReady: false,  // 新背景是否已淡入完成
    sceneFadeSlow: false, // 回忆闪回用慢速转场

    // 立绘显隐（旁白无立绘、对话立绘登场；结尾讲述时不显示）
    npcVisible: false,
    // ===== 双角色对话布局（兼容旧剧本） =====
    // 玩家立绘（右侧）；无正式图时为占位剪影，由 wxss 渲染
    playerVisible: false,
    // 当前说话者：npc | player | narrator（驱动左右立绘的高亮/倾听态）
    activeSpeaker: 'narrator',
    // 气泡朝向：left（NPC 说）| right（玩家说）| center（旁白）
    dialogSide: 'center',
    // 已解析节点（含 speaker 兜底），供 wxml 直接读说话人
    resolvedNode: null,

    // 当前节点状态
    nodeId: '',
    nodeType: 'narrate',   // narrate | talk | choice | aiFree | reflect
    displayedText: '',     // 打字机当前显示文本
    fullText: '',          // 节点完整文本
    typing: false,
    dialogName: '',        // 对话气泡显示的姓名（NPC 说=诗人名，玩家说=身份名，旁白=空）

    // 选项
    question: '',
    options: [],

    // AI 自由对话
    chatLog: [],
    inputText: '',
    aiTyping: false,    // 等待云端回复（显示"…"占位）
    aiStreaming: false, // 正在逐字打字（气泡已出现，不再显示"…"）
    aiHint: '',
    suggestions: [],    // 推荐提问
    canContinue: false,
    aiRounds: 0,
    minRounds: 1,
    scrollToId: '',

    // 锚点
    anchorCount: 0,
    anchorTotal: 0,

    // ===== 知识落印：朱印 → 小知识卡 → 自动收成小印章 =====
    sealPulse: false,          // 第一步：画面中央的落印动画（约 0.8s）
    sealExpanded: false,       // 右上角小卷轴「展开/收拢」：展开时纸面全开，收拢时只剩一根轴杆
    sealSlow: false,           // 小卷轴是否用慢速收拢（卡片飞进去后「慢慢卷起来」）
    sealKicker: '识',          // 印面字（识 / 考）
    sealTitle: '新印记已点亮',  // 印下一行小字
    anchorCard: null,          // 第二步：当前展示的轻量知识卡
    kcardPhase: '',            // 知识卡收起动画阶段：''=展示 | shrink=透视收缩成小卷轴 | roll=纸面卷起
    kcardFlyTransform: '',     // 收起时的 transform（translate→右上小印章 + scale 缩小，JS 实测注入）
    lastAnchorCard: null,      // 最近一张卡（点右上角小印章可回看）
    anchorDetailOpen: false,   // 「查看完整史料」展开态

    // ===== 知识落印的布局避让（单位 px，由 applyMenuButtonLayout 按胶囊按钮算出）=====
    // 微信右上角胶囊按钮会盖住该位置，所以小印章不能放进 topbar 的普通 flex 里，
    // 必须知道胶囊在哪，才能落在它下方。
    miniSealTop: 100,          // 小印章（卷轴）的 top：胶囊下沿 + 12
    kcardZoneTop: 178,         // 知识卡安全区上边界：再让开一轴小卷的高度（约 66px）
    topbarTop: 48,             // 顶部信息条 top：与胶囊同一水平线（px，按胶囊实测）

    // 通关收束面板
    questEndVisible: false,
    questEndSummary: '',
    questEndAllDone: false,
    questEndNote: '',
    questEndIsLocation: false,   // 地点模式收束：按钮切「收下诗笺，前往下一站」
    questEndIsReplay: false,     // 重温收束：按钮切「收下诗笺，返回地图」，且不写正式进度
    questEndNextName: '',
    questEndPlayerName: '',   // 收束面板「同行者：姓名」；非杜甫线为空
    questEndRecap: [],        // 终章回望（必经事件，与外观无关）；非杜甫线为空

    // 抉择记录（学生每次选择，供结尾讲述回望）
    choices: [],

    // ===== 节点检验（由史料卡动态出题，不写死在剧本里）=====
    quiz: null,           // { cardId, q, options, answer, explain, title }
    quizPicked: -1,       // 学生选了第几项
    quizResult: '',       // 'right' | 'wrong'
    quizCorrect: 0,       // 本时期答对数
    quizTotal: 0,         // 本时期已答题数

    // 内部状态（不渲染）
    _questId: '',
    _quest: null,
    _line: null,      // 当前故事线（注册表条目）
    _anchorSet: {},
    _covered: [],     // 本期已探究到的史料卡 id（回传云函数，用于出题）
    _quizzed: [],     // 本期已考过的史料卡 id（避免重复出同一题）
    _keyChoice: '',   // 决定性瞬间结果 right|wrong|''
    _msgSeq: 0,
    _typeTimer: null,
    _typing: false,   // 打字状态（实例属性，避免 setData 异步导致点击判断失效）
    _nextNode: '',    // 打字完成后的下一节点（实例属性）
    _aiStreamTimer: null,  // AI 回复"模拟流式逐字"定时器
    _ended: false,

    // ===== 玩家角色（杜甫/李白/苏轼三线：统一角色页创建/确认，chat 只做防绕过守卫 + 恢复呈现）=====
    // 创建/编辑逻辑已收敛到 pages/player，本页不再维护「选形象+填姓名」浮层。
    // 当前玩家角色（恢复后生效，供对话框姓名与立绘使用）
    playerName: '',              // 角色姓名（自定义，与账号昵称分开）
    playerImage: '',             // 玩家立绘（无正式图时为占位剪影标识）
    playerAvatarId: '',          // 已保存/恢复的外观 id（avatarId）；角色姓名条据此显示
    rolebarTop: 96,              // 角色姓名条 top（避开胶囊，applyMenuButtonLayout 计算）
  },

  onLoad(options) {
    const storyId = options.storyId || 'dufu';
    const questId = options.questId || '';
    const locationId = options.locationId || '';   // 地点模式：三线地点 id
    const mode = options.mode || 'continue';        // continue=续检查点 | replay=从头重温

    // 地点模式判定：有 locationId 即走地点剧本（杜甫/李白/苏轼三线通用）
    this._locationMode = !!locationId;
    this._locationId = locationId;
    this._mode = mode;

    // ===== 知识落印：页面实例级状态（不渲染，故不放 data）=====
    // 展示队列：一次 AI 回复可能同时命中多个锚点，串行播放，避免后一张冲掉前一张
    this._anchorRevealQueue = [];
    this._anchorRevealBusy = false;
    this._currentAnchorCard = null;
    // 待播放的 AI 命中锚点：云函数返回后先存下，等 AI 回复逐字播完再统一落印
    this._pendingAnchorHits = null;
    // 剧情锚点（node.anchor）在本节点台词打完前只寄存、不落印，见 flushStoryAnchor()
    this._pendingStoryAnchor = null;
    // 打字循环代号：切节点就 +1，让上一段的回调自动作废（见 typeText）
    this._typeGen = 0;
    this._sealTimer = null;
    this._collapseTimer = null;

    // ===== 地点信任 / 任务 / 见证物反馈（泰山样板）=====
    // 已退场：新剧本无 tasks / effects / 信任分支，玩家是「一路相随的同路人」，
    // 不再按地点保存职业、初始信任与任务。此处不留会话态与反馈队列。

    // ===== 场景背景：加载事件驱动的状态 =====
    // _sceneShown 记录"最后一张真正加载成功、用户确实看到的背景"。
    // 它是垫底层与失败回退的唯一可靠来源 —— 不能拿 sceneImage 当它用，
    // 因为 sceneImage 可能正指向一张还没加载完（甚至加载失败）的图。
    this._sceneShown = '';
    this._sceneLoadSeq = 0;      // 场景请求序号，用于判定迟到事件是否属于当前请求
    this.clearSceneTimers();

    // 右上角小印章要避开微信原生胶囊，位置只能问系统拿
    this.applyMenuButtonLayout();

    this._ttsStoryId = storyId;
    this._ttsQuestId = '';          // 剧本加载完成后再确定 audioQuestId（见 resolveLine 回调）
    this._audioQuestId = '';
    this._ttsRequest = 0;
    this._ttsAudio = wx.createInnerAudioContext();
    this._ttsAudio.autoplay = false;
    this._ttsAudio.obeyMuteSwitch = true;
    this._ttsAudio.onError((err) => {
      console.warn('[tts] 音频播放失败', err && err.errMsg);
    });
    const line0 = stories.getLine(storyId);

    if (!line0) {
      wx.showToast({ title: '剧本未找到', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }

    // 大图已迁移云存储：先把整条线的图片路径换成云端临时链接（有全局缓存，二次进入秒开）
    assets.resolveLine(line0).then((line) => {
      // 地点模式与时期模式取剧本的方式不同
      let quest = null;
      let locationMeta = null;
      let npcImage = '';
      let sceneImage = '';

      if (this._locationMode) {
        // 地点模式：杜甫 22 / 李白 20 / 苏轼 22 地点
        locationMeta = (line.locations || []).find(l => l.id === locationId) || null;
        quest = locationMeta ? (line.locationQuests && line.locationQuests[locationId]) : null;
        if (!quest || !locationMeta) {
          wx.showToast({ title: '地点未找到', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1200);
          return;
        }
        // 校验是否允许进入（防拼 URL 越级）：locked 地点不可进入
        const order = (line.locations || []).map(l => l.id);
        const states = progress.computeLocationStates(storyId, order);
        if (states[locationId] === 'locked') {
          wx.showToast({ title: '完成上一地点后解锁', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1200);
          return;
        }
        const portrait = selectNpcPortrait(line, locationMeta.npcStage);
        npcImage = portrait.src;
        this._npcMotion = portrait.animated;
        // 地点默认场景：地点元数据的 sceneKey 映射到实际图
        const locSets = line.locationSceneSets && line.locationSceneSets[locationId] || {};
        sceneImage = locSets[locationMeta.sceneKey] || line.cover || '';
        // 场景查找改用地点级场景集
        this._sceneSetSource = locSets;
        this._locationMeta = locationMeta;
        this._locationOrder = order;
      } else {
        quest = line.quests && line.quests[questId];
        if (!quest) {
          wx.showToast({ title: '章节未找到', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1200);
          return;
        }
        const portrait = selectNpcPortrait(line, questId);
        npcImage = portrait.src;
        this._npcMotion = portrait.animated;
        sceneImage = quest.scene || line.cover || '';
        this._sceneSetSource = (line.sceneSets || {})[questId] || {};
      }

      // 统计本地点/时期可获得的锚点总数。
      // 历史数据里曾挂在 trap 上的锚点仍可在自由对话中被 AI 命中，因此保留计数；
      // 同一锚点只计一次（否则会出现"点亮 6 个、总数只有 5"）。
      const anchorIdMap = {};
      Object.values(quest.nodes).forEach((n) => {
        if (n.anchor) anchorIdMap[n.anchor] = true;
        if (n.trap && n.trap.anchor) anchorIdMap[n.trap.anchor] = true;
        (n.options || []).forEach((o) => {
          if (o && o.anchor) anchorIdMap[o.anchor] = true;
        });
      });
      const anchorTotal = Object.keys(anchorIdMap).length;

      this.setData({
        _questId: this._locationMode ? locationId : questId,
        _quest: quest,
        _line: line,
        npcName: line.name,
        npcMotion: !!this._npcMotion,
        sceneImage,
        periodName: `${quest.title} · ${quest.range}`,
        npcImage,
        anchorTotal,
        anchorCount: 0,
        _anchorSet: {},
        // 知识落印状态重置（重新进入时期时不该带着上一次的卡片）
        sealPulse: false,
        anchorCard: null,
        kcardPhase: '',
        kcardFlyTransform: '',
        lastAnchorCard: null,
        anchorDetailOpen: false,
        // 每次进入时期重置探究状态
        _covered: [],
        _quizzed: [],
        _keyChoice: '',
        quiz: null,
        quizPicked: -1,
        quizResult: '',
        quizCorrect: 0,
        quizTotal: 0
      });

      // 入场淡入改由 onSceneImgLoad 驱动：图片真正加载成功后才淡入。
      // 不再假设"120ms 后图已经在了"——云图慢或失败时那样会露出黑屏。
      this.setData({ sceneReady: false, scenePrev: '', sceneFadeSlow: false });

      // TTS 上下文必须在剧本加载完成后确定：
      //   地点模式 audioQuestId = locationId（dufu/luoyang/n1.mp3）
      //   时期模式 audioQuestId = questId（libai/p2/n3.mp3）
      // 不能在 onLoad 早期用 options.questId 固定——地点入口的 questId 是空的，
      // 那时定下来会让 playNodeAudio 的守卫直接 return，地点模式完全没有配音。
      this._audioQuestId = voiceTarget.resolveAudioQuestId({
        locationMode: this._locationMode,
        locationId,
        questId
      });
      this._ttsStoryId = storyId;
      this._ttsQuestId = this._audioQuestId;

      // 起点：地点模式支持 continue（续检查点）与 replay（从头）。
      // 判定统一走 utils/play-mode.js：重温恒为 start，正式才读检查点；
      // 检查点指向已删除节点时安全回退到 start。
      const startNode = this._locationMode
        ? playMode.resolveStartNode({
          mode,
          start: quest.start,
          checkpoint: progress.getLocationCheckpoint(storyId, locationId),
          nodes: quest.nodes
        })
        : quest.start;

      // —— 玩家角色门控：角色线（杜甫/李白/苏轼）缺 confirmed 角色 → 跳转统一角色页，确认后 redirectTo 回本页 ——
      // 只做「防绕过角色创建」的最小守卫；角色完整呈现统一走 _restorePlayerProfile。
      if (this._needsRoleRedirect()) {
        wx.redirectTo({
          url: guard.buildPlayerUrl({
            lineId: this.data._line.id,
            target: 'chat',
            locationId: this._locationId,
            mode: this._mode
          })
        });
        return;
      }

      // 已保存角色：直接恢复（不弹浮层）。三条角色线都按当前 line.id 读取各自档案。
      if (this.data._line && guard.isRoleLine(this.data._line.id)) {
        this._restorePlayerProfile();
      }

      // 从起始节点开始
      this.gotoNode(startNode);
    });
  },

  // 计算「右上角小印章」与「知识卡安全区」的位置，避开微信原生胶囊按钮。
  // 胶囊会盖住页面右上角，所以小印章不能写在 topbar 的 flex 里，必须落在胶囊下方。
  // API 拿不到或返回异常（全 0 / 缺字段）时保留 data 里的默认值，绝不让页面报错。
  applyMenuButtonLayout() {
    let sealTop = this.data.miniSealTop || 100;
    let zoneTop = this.data.kcardZoneTop || 178;
    let barTop = this.data.topbarTop || 48;
    let rolebarTop = this.data.rolebarTop || 96;
    try {
      const rect = (typeof wx.getMenuButtonBoundingClientRect === 'function')
        ? wx.getMenuButtonBoundingClientRect()
        : null;
      if (rect && rect.bottom > 0) {
        // 小印章已改成竖卷（见 chat.wxss .vn-seal-mini）：上下轴头会探出纸面，
        // 整体可见高度约 64px，这里按 66px 估算。一是让 top 多留 12px 给上轴头，
        // 二是让知识卡安全区从整轴小卷的下方开始，不被它压住。
        const sealH = 66;
        sealTop = rect.bottom + 12;             // 紧贴胶囊下沿，留出上轴头的位置
        zoneTop = sealTop + sealH + 12;         // 安全区再让开一轴小卷的高度
        // 顶部信息条（返回键 + 标题）与胶囊保持同一水平线：直接用胶囊的 top，
        // 再按 topbar 自身的内边距抵消，让文字落在胶囊文字的中线附近。
        // 胶囊高度约 32px，topbar 的上下 padding 合计约 26rpx≈13px，
        // 这里取 rect.top - 4 让文字与胶囊文字基本对齐且不再顶进状态栏。
        barTop = Math.max(rect.top - 4, 24);
        // 角色姓名条：落在标题条下方（标题条约 26rpx 高，再让 8px 间距）
        rolebarTop = barTop + 34;
      }
    } catch (e) {
      console.warn('[chat] 获取胶囊按钮位置失败，使用默认布局', e);
    }
    this.setData({ miniSealTop: sealTop, kcardZoneTop: zoneTop, topbarTop: barTop, rolebarTop: rolebarTop });
  },

  // ============ 玩家角色守卫（杜甫/李白/苏轼三线） ============

  /**
   * 本次会话是否允许写正式进度。
   * 重温（mode=replay）只读：不写检查点、地点状态、诗笺记录、锚点、任务、见证物、
   * 关卡时间与角色档案；内存里照常展示本次的选择反馈与知识卡，退出即丢弃。
   * 所有 progress 写入点都必须先问这里，而不是各自判断一遍 mode。
   */
  _shouldWriteProgress() {
    return playMode.shouldPersist(this._mode);
  },

  // 是否需要跳转统一角色页：仅角色线（三线）、地点模式、且无 confirmed 角色
  // （无档案 或 仅迁移草稿）。
  // 注意：地点是否合法已在 resolveLine 回调里先校验过（locked 地点早于此 return）。
  _needsRoleRedirect() {
    const line = this.data._line;
    if (!line || !guard.isRoleLine(line.id) || !this._locationMode) return false;
    return guard.needsRolePage(line.id, progress.getPlayerProfile(line.id));
  },

  // 恢复已保存角色档案（进入页面时已存在）：不弹浮层，直接套用
  _restorePlayerProfile() {
    const lineId = this.data._line && this.data._line.id;
    if (!guard.isRoleLine(lineId)) return false;
    const p = progress.getPlayerProfile(lineId);
    if (!p) return false;
    if (!playerAvatars.isValidAvatar(p.avatarId)) {
      // 已存外观 id 但白名单里已不存在（非法/废弃）：不套用坏状态，走正常剧情
      console.warn('[chat] 已保存的外观 id 不在白名单，忽略', p.avatarId);
      return false;
    }
    this._applyPlayerProfile(p);
    return true;
  },

  // 解析玩家立绘：avatarId → 云端路径（统一走 utils/player-portrait.js）；
  // 非法 id 返回空串，wxml 渲染 CSS 剪影占位（不裂图）。
  _resolveRolePortrait(avatarId) {
    return playerPortrait.portraitPath(avatarId);
  },

  // 套用玩家角色：设置 playerName / playerImage / playerAvatarId（外观 id）。
  // playerImage 异步解析云端链接；无正式图时置空 → wxml 渲染 CSS 剪影占位（不裂图）。
  // 请求代号 _playerAvatarReq 自增：旧图片响应、已卸载页面、已切换人物线/角色的迟到结果一律丢弃，
  // 防止旧立绘覆盖编辑后的新形象、或杜甫立绘残留到李白/苏轼。
  _applyPlayerProfile(profile) {
    const lineId = this.data._line && this.data._line.id;
    this._playerLineId = lineId;
    this._playerAvatarId = profile.avatarId;
    this._playerAvatarReq = (this._playerAvatarReq || 0) + 1;
    const req = this._playerAvatarReq;
    this.setData({
      playerAvatarId: profile.avatarId,
      playerName: profile.displayName,
      playerImage: ''
    });
    const path = this._resolveRolePortrait(profile.avatarId);
    if (!path) return;   // 非法外观：保持剪影占位，不发请求、不裂图
    assets.resolvePaths([path]).then((map) => {
      // 页面已卸载 / 已切换人物线 / 角色已切换 / 有更新的解析请求：丢弃迟到结果
      if (this._playerAvatarReq !== req
        || this._playerLineId !== lineId
        || this._playerAvatarId !== profile.avatarId) return;
      const url = map[path] || '';
      this.setData({ playerImage: url });
    });
  },

  // ============ 效果执行（已退场） ============
  // 新剧本（22 地点最终版）不再有 tasks / effects / 信任分支：玩家是「一路相随的同路人」，
  // 外观与姓名不改变历史主线、题目、奖励与剧情结局。此处保留空实现，供旧数据兼容读取。

  // 首次渲染完成后：右上角小卷轴先「展开」亮一下，再自动收拢。
  // 这是"最开始打开"的入场动作，之后只在落印 / 点击时再展开。
  onReady() {
    if (this._sealExpandTimer) { clearTimeout(this._sealExpandTimer); this._sealExpandTimer = null; }
    this.setData({ sealExpanded: true });
    this._sealExpandTimer = setTimeout(() => {
      this._sealExpandTimer = null;
      this.setData({ sealExpanded: false });
    }, 1400);
  },

  // 展开 / 收拢右上角小卷轴（自动收拢由调用方决定时机）
  // slow=true 时收拢用慢速（约 0.95s），用于「卡片飞进小卷轴后慢慢卷起来」。
  expandMiniSeal() {
    if (this._sealExpandTimer) { clearTimeout(this._sealExpandTimer); this._sealExpandTimer = null; }
    this.setData({ sealSlow: false, sealExpanded: true });
  },
  collapseMiniSeal(slow) {
    if (this._sealExpandTimer) { clearTimeout(this._sealExpandTimer); this._sealExpandTimer = null; }
    this.setData({ sealSlow: !!slow, sealExpanded: false });
  },

  onHide() {
    // 地点模式：切后台/返回时补一次检查点，确保打字中途退出也能从本节点续。
    // 重温不写（guard 统一走 play-mode，避免各处各判一遍 mode）。
    if (this._locationMode && this._shouldWriteProgress() && this.data.nodeId
        && this.data._quest && this.data._quest.nodes[this.data.nodeId]) {
      progress.saveLocationCheckpoint(this.data._line.id, this._locationId, this.data.nodeId);
    }
  },

  onUnload() {
    if (this.data._typeTimer) {
      clearTimeout(this.data._typeTimer);
    }
    if (this.data._aiStreamTimer) {
      clearInterval(this.data._aiStreamTimer);
      this.data._aiStreamTimer = null;
    }
    if (this.data._reflectTimer) {
      clearTimeout(this.data._reflectTimer);
      this.data._reflectTimer = null;
    }
    if (this._sceneFadeTimer) clearTimeout(this._sceneFadeTimer);
    if (this._sceneCleanupTimer) clearTimeout(this._sceneCleanupTimer);
    // 知识落印：定时器 + 展示队列 + busy 状态 + 待播放的 AI 锚点，一并清掉，
    // 否则会对已销毁的页面 setData，或让队列在离开后继续播放
    if (this._sealTimer) { clearTimeout(this._sealTimer); this._sealTimer = null; }
    if (this._collapseTimer) { clearTimeout(this._collapseTimer); this._collapseTimer = null; }
    if (this._sealExpandTimer) { clearTimeout(this._sealExpandTimer); this._sealExpandTimer = null; }
    if (this._choiceSpeakTimer) { clearTimeout(this._choiceSpeakTimer); this._choiceSpeakTimer = null; }
    this._clearRollTimers();
    this._kcardRolling = false;
    this._anchorRevealQueue = [];
    this._anchorRevealBusy = false;
    this._currentAnchorCard = null;
    this._pendingAnchorHits = null;
    this._pendingStoryAnchor = null;
    this._ttsRequest += 1;
    if (this._ttsAudio) {
      this._ttsAudio.stop();
      this._ttsAudio.destroy();
      this._ttsAudio = null;
    }
    // 玩家角色：作废在途立绘解析（旧响应不得写回已销毁页面），清空会话角色态，
    // 防止从杜甫切到李白/苏轼后残留姓名与立绘。
    this._playerAvatarReq = (this._playerAvatarReq || 0) + 1;
    this._playerAvatarId = '';
    this._playerLineId = '';
  },

  /**
   * 播放当前节点的 TTS。
   *
   * 只有「NPC 的 talk 节点」才播杜甫配音：
   *   · speaker 缺省视为 npc（旧剧本兼容）；
   *   · speaker:'player' 的玩家发言、choice 临时生成的玩家台词、动作行、narrate 旁白一律不播；
   *   · 自定义姓名与三种外观不会产生三套配音（音频键只由 storyId/locationId|questId/nodeId 决定）。
   *
   * 传当前节点文本，让解析器与语音清单摘要比对：台词改过而音频未重录时跳过旧音频。
   * 快速切节点时 _ttsRequest 自增，迟到的临时链接不会在新节点播放。
   */
  async playNodeAudio(nodeId, nodeArg) {
    if (!this._ttsAudio || !this._ttsStoryId || !this._ttsQuestId) return;
    // 优先用调用方传入的「已解析节点」：setData 是异步的，此刻 this.data.nodeId
    // 可能还是上一个节点，按 data 反查会拿错文本（进而误判摘要不一致）。
    const node = nodeArg || (this.data._quest && this.data._quest.nodes && this.data._quest.nodes[nodeId]) || null;
    if (!voiceTarget.isNpcTalkNode(node)) return;   // 旁白/选项/玩家发言/动作行都不播

    const request = ++this._ttsRequest;
    this._ttsAudio.stop();
    const url = await ttsAudio.resolveNodeAudio(this._ttsStoryId, this._ttsQuestId, nodeId, node.text);
    const accepted = voiceTarget.shouldAcceptAudioResult({
      request,
      currentRequest: this._ttsRequest,
      nodeId,
      currentNodeId: this.data.nodeId,
      url,
      audioAlive: !!this._ttsAudio
    });
    if (!accepted) return;
    this._ttsAudio.src = url;
    this._ttsAudio.play();
  },

  // ============ 场景交叉淡入淡出 ============
  // node.sceneMode 可为 'flashback'（回忆闪回，慢速转场）；回忆结束需用 node.returnScene 切回主场景
  //
  // ⚠️ 曾经的 bug（"知识卡收起后背景变黑"）：
  //   旧实现在切换时排了两个固定定时器 —— 60/120ms 后就把 sceneReady 置 true（假装图已加载），
  //   1100/1800ms 后无条件清掉 scenePrev。云图慢或加载失败时，新图根本没显示出来，
  //   旧图却已被删除，于是只剩 vn-stage 的深色底 → 黑屏。知识卡 3 秒后收起，
  //   看起来就像"卡片一消失背景就没了"，其实与卡片无关。
  //   现在改为：由 <image bindload> 确认加载成功才开始淡入，淡入走完才删旧图；
  //   加载失败则回退出上一张。全程不存在"没人看着的定时器"。
  transitionScene(node, nodeId) {
    const sets = this._sceneSetSource || (this.data._line.sceneSets || {})[this.data._questId] || {};
    const target = node.scene ? (sets[node.scene] || this.data.sceneImage) : this.data.sceneImage;
    // 无变化或无目标图：不动
    if (!target || target === this.data.sceneImage) return;

    // —— 拒绝切换到未解析的迁移路径 ——
    // 目标仍是 /assets/images/... 说明云端临时链接没换到（cloudAssets 没解析成功），
    // 而对应本地图已随迁移删除，切过去必然黑屏。宁可不切，保留当前背景。
    if (assets.isMigratable(target)) {
      console.warn('[chat] 场景云链接未解析，保留当前背景', {
        故事线: this.data._line && this.data._line.id,
        时期: this.data._questId,
        节点: nodeId || this.data.nodeId,
        目标: target
      });
      return;
    }

    // 上一轮的转场计时一律作废（快速连点时旧计时不能干扰新场景）
    this.clearSceneTimers();
    this._sceneLoadSeq += 1;

    // 回忆闪回：更慢的淡入（1.6s），增强"思绪飘回过去"的舒缓感
    const slow = node.sceneMode === 'flashback';
    this.setData({
      // 垫底层 = 最后一张"真正加载成功"的图，而不是 sceneImage —— latter 可能还没加载完
      scenePrev: this._sceneShown || this.data.sceneImage,
      sceneImage: target,
      sceneReady: false,
      sceneFadeSlow: slow
    });
    // 注意：这里【不】排任何"固定毫秒后清理旧背景"的定时器。
    // 清理只发生在 onSceneImgLoad 里，即新图确认加载成功、且淡入动画走完之后。
  },

  // 清掉全部场景计时器（切场景、卸载、回退时都要先清）
  clearSceneTimers() {
    if (this._sceneFadeTimer) { clearTimeout(this._sceneFadeTimer); this._sceneFadeTimer = null; }
    if (this._sceneCleanupTimer) { clearTimeout(this._sceneCleanupTimer); this._sceneCleanupTimer = null; }
  },

  // 背景加载成功：这是唯一允许"开始淡入并删除旧图"的入口
  onSceneImgLoad(e) {
    const src = this.sceneEventSrc(e);
    // 空 src（首帧）或来自旧请求的迟到事件 → 一律忽略，不能污染当前场景
    if (!src || src !== this.data.sceneImage) {
      if (src) {
        console.warn('[chat] 丢弃过期的场景加载回调（并发切场景）', {
          回调地址: src, 当前目标: this.data.sceneImage, 请求序号: this._sceneLoadSeq
        });
      }
      return;
    }
    if (this.data.sceneReady) return;   // 已经淡入过，不重复

    this._sceneShown = src;
    // 淡入：class 变化触发 wxss 里的 transition
    this.setData({ sceneReady: true });

    // 淡入走完，才移除垫在下面的旧背景（此时新图已经完全盖住它）
    const wait = this.data.sceneFadeSlow ? SCENE_FADE_SLOW_MS : SCENE_FADE_MS;
    if (this._sceneCleanupTimer) { clearTimeout(this._sceneCleanupTimer); this._sceneCleanupTimer = null; }
    this._sceneCleanupTimer = setTimeout(() => {
      this._sceneCleanupTimer = null;
      this.setData({ scenePrev: '' });
    }, wait);
  },

  // 背景加载失败：回退到上一张，绝不留黑屏
  onSceneImgError(e) {
    const src = this.sceneEventSrc(e);
    if (!this.data.sceneImage) return;                 // 首帧空 src，忽略
    if (src && src !== this.data.sceneImage) {         // 旧请求的 error → 忽略
      console.warn('[chat] 丢弃过期的场景错误回调（并发切场景）', {
        回调地址: src, 当前目标: this.data.sceneImage, 请求序号: this._sceneLoadSeq
      });
      return;
    }

    const failed = this.data.sceneImage;
    // 回退目标：垫底层 → 最后一次成功显示过的图
    const back = this.data.scenePrev || this._sceneShown || '';
    const info = {
      故事线: this.data._line && this.data._line.id,
      时期: this.data._questId,
      节点: this.data.nodeId,
      图片地址: failed,
      错误: e && e.detail
    };

    if (back && back !== failed) {
      console.warn('[chat] 场景图加载失败，已恢复上一场景', info);
      this.clearSceneTimers();
      this.setData({
        sceneImage: back,
        scenePrev: '',
        sceneReady: true,      // 回退的是已加载过的图，可直接显示
        sceneFadeSlow: false
      });
      return;
    }

    // 首次进入就没有旧图可退：保留 vn-stage 的深色底。
    // 只写 Console，不弹 wx.showToast —— 剧情不能被一张裂图打断。
    console.error('[chat] 首个场景图加载失败，保留深色底', info);
    this.setData({ sceneFadeSlow: false });
  },

  // 统一取出事件对应的图片地址（data-src 与 sceneImage 同源，用它判定事件归属）
  sceneEventSrc(e) {
    const ds = e && e.currentTarget && e.currentTarget.dataset;
    return (ds && ds.src) || '';
  },

  // ============ 节点推进引擎 ============

  // 取当前节点应使用的立绘：地点模式按 npcStage，时期模式按 questId
  resolveNpcImage() {
    const line = this.data._line;
    if (!line) return '';
    if (this._locationMode && this._locationMeta && this._locationMeta.npcStage) {
      return selectNpcPortrait(line, this._locationMeta.npcStage).src;
    }
    return selectNpcPortrait(line, this.data._questId).src;
  },

  gotoNode(nodeId) {
    if (nodeId === '__end__') {
      this.onQuestEnd();
      return;
    }
    const sourceNode = this.data._quest.nodes[nodeId];
    if (!sourceNode) {
      this.onQuestEnd();
      return;
    }
    // 解析后的节点留在实例上，保证跳过打字、考据挑战与 AI 自由问答使用的
    // 都是玩家实际看到的版本，而不是源剧本里的默认文本。
    // 新剧本无身份/信任变体，resolveNode 在此为透传（见 utils/story-variants.js）。
    // 杜甫新流程不再把 roleId / trustScore 作为剧情节点解析条件。
    const node = storyVariants.resolveNode(sourceNode);
    this._resolvedNode = node;

    // 地点模式：进入新节点即保存检查点（旁白/对话/选择/AI/anchorCard 都在这里落点），
    // 中途退出后可从最近稳定节点续。重温模式（replay）不写正式检查点，避免覆盖主线进度。
    if (this._locationMode && this._shouldWriteProgress()) {
      progress.saveLocationCheckpoint(this.data._line.id, this._locationId, nodeId);
    }

    // 切节点即作废上一段的打字循环。否则旧循环跑完时会触发它的 onDone，
    // 把"刚登记、台词还没显示"的新节点锚点提前点燃 —— 这是新落印时序的必备保护。
    if (this.data._typeTimer) {
      clearTimeout(this.data._typeTimer);
      this.data._typeTimer = null;
    }
    // 自愈式自增：不依赖 onLoad 是否已初始化，否则 undefined+1=NaN 会让
    // typeText 里的 gen 比较恒不相等，打字循环一步就退出（整段台词打不出来）。
    this._typeGen = (this._typeGen || 0) + 1;

    // 进入「非 NPC talk」节点（旁白 / 选项 / 玩家发言 / 知识卡 / 讲述）时终止配音：
    // 既避免上一句 NPC 语音压到旁白上，也保证迟到的临时链接不会在新节点突然响起。
    if (!voiceTarget.isNpcTalkNode(node) && this._ttsAudio) {
      this._ttsRequest += 1;
      this._ttsAudio.stop();
    }

    switch (node.type) {
      case 'narrate':
      case 'talk':
        // 剧情锚点不能在这里就点亮。此刻台词一个字都还没打出来：
        // 学生还没读到内容，卡片就先给了结论；卡片还会压在刚出现的对白上面。
        // 所以只登记，等台词逐字打完（或学生点击跳过打字）再落印 —— 见 flushStoryAnchor()。
        // AI 回答/考据的锚点本来就走"打完再落"，剧情锚点此前漏了这一步。
        this._pendingStoryAnchor = node.anchor || null;

        // —— 双角色布局：解析说话者 ——
        // 旧 talk 节点没有 speaker 字段，默认 npc（向后兼容）。
        // speaker 取值：'npc' | 'player'（narrate 一律视为 narrator/旁白）。
        const speaker = node.type === 'talk' ? (node.speaker || 'npc') : 'narrator';
        const activeSpeaker = speaker;
        // 气泡朝向：NPC 说 → left；玩家说 → right；旁白 → center
        const dialogSide = speaker === 'npc' ? 'left' : (speaker === 'player' ? 'right' : 'center');
        // 立绘显隐：节点可用 npc 字段显式指定（true 强制显示 / false 强制隐藏），
        // 未指定时按类型兜底：talk 显示（与人交互）、narrate 隐藏（纯沉浸/回忆）
        const showNpc = node.npc !== undefined ? node.npc : (node.type === 'talk');
        // 玩家立绘：仅 talk 且 speaker=player 时登场；narrate/reflect 隐藏
        const showPlayer = node.type === 'talk' && speaker === 'player';
        // 对话气泡显示的姓名：NPC 说 → 诗人名；玩家说 → 当前身份名
        const dialogName = speaker === 'npc'
          ? this.data.npcName
          : (speaker === 'player' ? (this.data.playerName || '你') : '');

        this.setData({
          nodeId,
          nodeType: node.type,
          fullText: node.text,
          npcSpeaking: node.type === 'talk' && speaker === 'npc',
          npcVisible: showNpc,
          playerVisible: showPlayer,
          activeSpeaker,
          dialogSide,
          resolvedNode: node,
          // 对话姓名：narrate 时不显示姓名栏，talk 时显示说话者姓名
          dialogName,
          // 立绘统一：始终使用该时期基准脸（地点模式按 npcStage）
          npcImage: this.resolveNpcImage(),
          displayedText: '',
          typing: true
        });
        // 场景切换（回忆闪回走慢速转场，形成"思绪飘回过去→回到现实"的时间线）
        this.transitionScene(node, nodeId);
        // 台词完整显示后：落印剧情锚点（直接跳过打字也视为"完整显示"）。
        this.typeText(node.text, node.next, () => {
          this.flushStoryAnchor();
        });
        // NPC 的 TTS 只在 speaker=npc 时播放（玩家台词 / 旁白不播 TTS）
        if (speaker === 'npc') {
          this.playNodeAudio(nodeId, node);
        }
        break;

      case 'choice':
        this.setData({
          nodeId,
          nodeType: 'choice',
          question: node.question,
          options: node.options,
          // 是否为"决定性瞬间"（带对错标记）：决定是否显示抉择提示
          isKeyChoice: !!(node.options && node.options.some(o => o.right !== undefined)),
          npcSpeaking: false,
          typing: false,
          choiceFeedback: null,
          // 抉择面板：无明确说话者，双立绘均不登场，气泡区由选项卡替代
          playerVisible: false,
          npcVisible: false,
          activeSpeaker: 'narrator',
          dialogSide: 'center',
          resolvedNode: node
        });
        // 抉择节点同样支持场景切换（如落榜放榜画面）
        this.transitionScene(node, nodeId);
        break;

      case 'reflect':
        // 结尾"完整讲述"：同游者回望，逐句浮现，不点破结论
        this.enterReflect(node);
        break;

      case 'anchorCard':
        // 显式知识卡节点：地点剧情里，某个关键知识点（或终章总结）要单独
        // 亮一张卡，用户点「收下」/自动收起后才推进 node.next。
        // 与剧情锚点（node.anchor）不同：那是在台词打完时顺势落印；这里整张卡
        // 就是当前这一停，不推进流程、也不在刚出现时就通关。
        this.showAnchorCardNode(node);
        break;

      case 'aiFree':
        const seedLog = node.trap
          ? [{
            id: ++this.data._msgSeq,
            role: 'npc',
            content: '这一路走来，你若还有想问的，尽管说来。'
          }]
          : [];
        this.setData({
          nodeId,
          nodeType: 'aiFree',
          aiHint: node.hint || '向' + this.data.npcName + '提问…',
          suggestions: node.suggestions || [],
          minRounds: node.minRounds || 1,
          aiRounds: 0,
          canContinue: false,
          // 原考据节点改成自然邀问，不再用故意说错的台词打断叙事。
          chatLog: seedLog,
          npcSpeaking: true,
          // 自由对话：立绘登场（面对面提问）；节点可用 npc:false 隐藏
          npcVisible: node.npc !== undefined ? node.npc : true,
          // 自由对话保留现有聊天记录区：玩家立绘不进入立绘层，用聊天区里的气泡表达
          playerVisible: false,
          activeSpeaker: 'npc',
          dialogSide: 'left',
          typing: false,
          // 探究式对话：进入新节点时清掉上一轮的检验状态
          quiz: null,
          quizPicked: -1,
          quizResult: '',
          resolvedNode: node
        });
        this.transitionScene(node, nodeId);
        break;

      default:
        this.onQuestEnd();
    }
  },

  // 显式 anchorCard 节点：整张知识卡就是当前这一停。
  // 展示卡（朱印 → 轻量卡），用户在「收下」或自动收起后推进 node.next。
  // 区别于剧情锚点：不重复走 fireAnchor 的记账逻辑，但复用同一套卡片组装与播放动画。
  showAnchorCardNode(node) {
    const line = this.data._line || {};
    const anchors = line.anchors || {};
    const anchorId = node.anchor || '';
    // 白名单：只有登记在 ANCHORS 表里的锚点才计入正式印记。
    // 未知 id 仍照常展示这张卡（它可能带 title，是剧情停顿点），但不写库、不计数，
    // 避免脏数据污染存档，也避免因为一个坏锚点把剧情卡住。
    const known = !!anchorId && !!anchors[anchorId];
    const name = anchors[anchorId] || anchorId || (node.title || '');
    const info = anchorInfo.getAnchorInfo(line.id || 'dufu', anchorId);

    // 终章总结卡（如湘江再次用 a1）：允许 repeatable 展示，不因去重被吞掉。
    // 但锚点计数照旧——若本程已点亮过，不重复 +1。
    const repeatable = !!node.repeatable;
    const seenKind = this.data._anchorSet[anchorId] || '';
    const firstInRun = known && !seenKind;
    const owned = progress.getAnchors(line.id || 'dufu');
    const firstEver = !owned[anchorId];

    const kind = seenKind || 'story';
    const count = firstInRun ? this.data.anchorCount + 1 : this.data.anchorCount;

    if (firstInRun) {
      // 重温只更新内存展示态，不写正式锚点（否则重温一趟就把当程印记算成已获得）
      if (this._shouldWriteProgress()) progress.addAnchor(line.id || 'dufu', anchorId);
      this.setData({
        _anchorSet: Object.assign({}, this.data._anchorSet, { [anchorId]: kind }),
        anchorCount: count
      });
    }

    // 组装卡（kind 取已点亮的获得方式，保证"为什么获得"文案不倒退）
    const card = this.buildAnchorCard(
      anchorId, name, info, kind, null, count, this.data.anchorTotal, firstEver
    );

    this.setData({ nodeId: this.data.nodeId, nodeType: 'anchorCard', typing: false });

    // 播朱印 → 轻量卡；用户点「收下」或自动收起后，推进到 node.next。
    this.enqueueAnchorReveal(card, () => {
      this.gotoNode(node.next || '__end__');
    });
  },

  // 打字机效果。onDone 在"整段台词都显示出来"之后调用（自然打完、或学生点击跳过打字，都算）。
  typeText(text, next, onDone) {
    let i = 0;
    this._typing = true;
    this._nextNode = next;
    // 本次打字循环的代号：切节点后 _typeGen 会变，旧循环自然停止并放弃 onDone
    const gen = (this._typeGen = (this._typeGen || 0) + 1);
    // 打字速度：默认 60ms/字，营造娓娓道来的语气（回忆节点可更慢）
    const speed = 60;
    const step = () => {
      if (gen !== this._typeGen) return;   // 已被新节点取代，本次作废
      if (i <= text.length) {
        this.setData({ displayedText: text.slice(0, i) });
        i += 1;
        this.data._typeTimer = setTimeout(step, speed);
      } else {
        this._typing = false;
        this.setData({ typing: false });
        if (typeof onDone === 'function') onDone();
      }
    };
    step();
  },

  // 落印一个"剧情锚点"。只在台词确实显示完之后调用，重复调用是安全的
  // （取走即清空，第二次调用直接返回，不会重复点亮）。
  flushStoryAnchor() {
    const anchorId = this._pendingStoryAnchor;
    this._pendingStoryAnchor = null;
    if (!anchorId) return;
    this.fireAnchor(anchorId, { kind: 'story' });
  },

  // 点击对话框：打字中 → 立即显示全文；已打完 → 进入下一节点
  onDialogTap() {
    if (this.data.nodeType !== 'narrate' && this.data.nodeType !== 'talk') return;

    // 首次进入节点时会自动播放；若临时链接尚未返回，点击对话框时补发一次播放请求。
    // 仅 NPC 说（speaker=npc）且为 talk 节点的台词才补播，玩家台词 / 旁白 / 选项不播。
    if (this._ttsAudio && this._ttsAudio.paused && this.data.activeSpeaker === 'npc') {
      this.playNodeAudio(this.data.nodeId, this._resolvedNode);
    }

    // 正在打字 → 直接显示全文（停在这一句，等用户再点才推进）
    if (this._typing) {
      clearTimeout(this.data._typeTimer);
      this.data._typeTimer = null;
      this._typeGen = (this._typeGen || 0) + 1;   // 作废这次打字循环
      this._typing = false;
      this.setData({
        typing: false,
        displayedText: this.data.fullText
      });
      // 跳过打字也算"台词已完整显示"，剧情锚点此时落印（否则会丢）
      this.flushStoryAnchor();
      return;
    }
    // 打字完成 → 推进下一节点
    if (this._nextNode) {
      this.gotoNode(this._nextNode);
    }
  },

  // ============ 节点检验：答史料卡生成的题 ============

  onQuizPick(e) {
    if (this.data.quizResult) return;   // 已答过
    const idx = Number(e.currentTarget.dataset.index);
    const quiz = this.data.quiz;
    if (!quiz) return;
    const right = idx === quiz.answer;
    const quizzed = this.data._quizzed.concat([quiz.cardId]);
    this.setData({
      quizPicked: idx,
      quizResult: right ? 'right' : 'wrong',
      quizCorrect: this.data.quizCorrect + (right ? 1 : 0),
      quizTotal: this.data.quizTotal + 1,
      _quizzed: quizzed,
      // 答完即放行「继续剧情」
      canContinue: this.data.aiRounds >= this.data.minRounds
    });
  },

  // 选项点击
  onChoiceTap(e) {
    const idx = e.currentTarget.dataset.index;
    const opt = this.data.options[idx];
    if (!opt) return;

    // 记录学生选择（供结尾讲述回望 / 诗笺卡）
    const record = { nodeId: this.data.nodeId, text: opt.text, right: opt.right };
    const patch = { choices: this.data.choices.concat([record]) };
    // 决定性瞬间的结果单独记一笔（诗笺卡要展示"你当时怎么选的"）
    if (opt.right !== undefined) {
      patch._keyChoice = opt.right ? 'right' : 'wrong';
    }
    this.setData(patch);

    // 选项若挂了锚点：这一次抉择本身就是获得方式（选择命中）
    // —— 剧本里给某个 option 加 anchor: 'ax' 即生效，与 node.anchor 互不冲突
    if (opt.anchor) this.fireAnchor(opt.anchor, { kind: 'choice' });

    // 带对错的"决定性瞬间"：先给轻量反馈，再让玩家亲口说出所选台词。
    if (opt.right !== undefined) {
      const feedback = opt.right
        ? { type: 'right', text: opt.feedback || '' }
        : { type: 'wrong', text: opt.feedback || '' };
      this.setData({ choiceFeedback: feedback });
      // 短暂停留让反馈呈现，再推进
      if (this._choiceSpeakTimer) clearTimeout(this._choiceSpeakTimer);
      this._choiceSpeakTimer = setTimeout(() => {
        this._choiceSpeakTimer = null;
        this._speakPlayerChoice(opt);
      }, 1600);
      return;
    }

    // 无对错探索同样先由玩家说出来，不再从按钮直接跳到 NPC 回应。
    this._speakPlayerChoice(opt);
  },

  /**
   * 把刚选中的选项转成一条真正的玩家台词：
   * 玩家立绘变亮，NPC 变暗倾听；玩家点击说完后才进入选项目标节点。
   * spokenText 用于把“（观察）……”一类按钮文案改成更自然的口语；未提供则回退 text。
   */
  _speakPlayerChoice(opt) {
    const playerNode = storyVariants.playerChoiceNode(opt);
    const next = opt && (opt.result || opt.next);
    if (!playerNode) {
      if (next) this.gotoNode(next);
      return;
    }

    if (this._ttsAudio) this._ttsAudio.stop();
    this._pendingStoryAnchor = null;
    this._resolvedNode = playerNode;

    // 动作型选择（actionOnly，如「（沉默）」「（望着山下）」）：只做动作、不口述，
    // 以旁白/动作行居中呈现（无说话者姓名、玩家立绘不登场说话），避免被当成角色台词。
    if (playerNode.type === 'action') {
      this.setData({
        nodeType: 'narrate',
        fullText: playerNode.text,
        displayedText: '',
        typing: true,
        npcSpeaking: false,
        npcVisible: false,
        playerVisible: false,
        activeSpeaker: 'narrator',
        dialogSide: 'center',
        dialogName: '',
        resolvedNode: playerNode,
        choiceFeedback: null
      });
      this.typeText(playerNode.text, playerNode.next);
      return;
    }

    this.setData({
      nodeType: 'talk',
      fullText: playerNode.text,
      displayedText: '',
      typing: true,
      npcSpeaking: false,
      npcVisible: true,
      playerVisible: true,
      activeSpeaker: 'player',
      dialogSide: 'right',
      dialogName: this.data.playerName || '你',
      resolvedNode: playerNode,
      choiceFeedback: null
    });
    this.typeText(playerNode.text, playerNode.next);
  },

  // ============ 结尾"完整讲述"（reflect） ============

  enterReflect(node) {
    const lines = node.lines || [];
    // 全文留存：供「快速阅读」一键展开用。注意 data.nodeId 在 reflect 期间
    // 仍是上一个剧情节点的 id（enterReflect 不更新 nodeId），拿它反查本节点
    // 会查成空数组、把已显示的文字全部清光 —— 不能那样取。
    this._reflectLines = lines;
    this.setData({
      nodeId: this.data.nodeId,
      nodeType: 'reflect',
      npcSpeaking: false,
      npcVisible: false,   // 结尾回望：隐去立绘，纯黑幕 + 逐句文字，更沉浸有回味
      playerVisible: false, // reflect 继续隐藏人物（含玩家立绘）
      activeSpeaker: 'narrator',
      dialogSide: 'center',
      typing: false,
      reflectLines: [],
      reflectDone: false,
      reflectTotal: lines.length,
      _reflectNext: node.next   // 提前记下出口，「快速阅读」跳到结尾时同样可用
    });
    // 逐句浮现（2s/句，更舒缓，像纪录片旁白）
    let i = 0;
    const showNext = () => {
      if (i >= lines.length) {
        this.setData({ reflectDone: true });
        return;
      }
      this.setData({ reflectLines: lines.slice(0, i + 1) });
      i += 1;
      this.data._reflectTimer = setTimeout(showNext, 2000);
    };
    showNext();
  },

  // 快速阅读：跳过逐句等待，一次性展示全部讲述（不点则保持逐句浮现原样）
  onReflectSkip() {
    if (this.data.reflectDone) return;
    if (this.data._reflectTimer) {
      clearTimeout(this.data._reflectTimer);
      this.data._reflectTimer = null;
    }
    // 直接用进节点时留存的全文（data.nodeId 此刻是上一节点的 id，反查必错）
    const lines = this._reflectLines || [];
    this.setData({
      reflectLines: lines,
      reflectDone: true
    });
  },

  // 底部统一按钮：没读完=快速阅读（展开全文），读完=继续。同一按钮原地切换。
  onReflectBtn() {
    if (this.data.reflectDone) this.onReflectContinue();
    else this.onReflectSkip();
  },

  // 讲述结束 → 进入下一节点（通常是 __end__）
  onReflectContinue() {
    if (!this.data.reflectDone) return;
    if (this.data._reflectTimer) clearTimeout(this.data._reflectTimer);
    this.gotoNode(this.data._reflectNext);
  },

  // ============ AI 自由对话 ============

  onAiInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 收集本地「已完成」地点（服务端据此 + 当前地点做时间截断，计算可用共同经历）。
  // 服务端以云端存档为准；本地这份只是云端读不到时的降级来源，且服务端仍会按白名单+顺序截断。
  _collectCompletedLocations() {
    const lineId = this.data._line && this.data._line.id;
    if (!lineId) return [];
    const order = (this.data._line.locations || []).map(l => l.id);
    const states = progress.getLocationStates(lineId);
    return order.filter(id => states[id] === 'completed');
  },

  async onAiSend() {
    const text = this.data.inputText.trim();
    if (!text || this.data.aiTyping) return;

    const id = ++this.data._msgSeq;
    const chatLog = this.data.chatLog.concat([
      { id, role: 'user', content: text }
    ]);
    this.setData({
      chatLog,
      inputText: '',
      aiTyping: true,
      aiStreaming: false,
      scrollToId: 'msg-' + id
    });

    // 组装历史（AI 上下文）：只带最近 6 轮，控制云函数耗时，避免 20s 超时
    const history = this.data.chatLog.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const node = this._resolvedNode || this.data._quest.nodes[this.data.nodeId];

    try {
      const res = await chatService.sendMessage({
        sessionId: this.data._line.id + '_' + this.data._questId + '_' + (app.globalData.openid || 'local'),
        questId: this.data._questId,
        npcId: this.data._line.id,   // 云函数据此切换人设与知识库（dufu/libai），避免"问李白答杜甫"串线
        // 地点模式：把地点 ID 与所属时期传给云函数，用于知识库查卡与兜底回复映射
        locationId: this._locationMode ? this._locationId : '',
        periodId: this._locationMode ? (this._locationMeta && this._locationMeta.periodId) || '' : '',
        // 当前 AI 节点 id + 本地已完成地点：供服务端按白名单/时间截断计算「可用共同经历」，
        // 让杜甫只记得当时已发生的共同经历（服务端以云端存档为准，读不到才用本地降级）
        nodeId: this._locationMode ? this.data.nodeId : '',
        completedLocations: this._locationMode ? this._collectCompletedLocations() : [],
        message: text,
        history,
        freePrompt: node && node.prompt,  // 服务端会用白名单可信 prompt 替代（旧客户端兜底）
        covered: this.data._covered,      // 探究引擎：本期已探究到的史料卡
        quizzed: this.data._quizzed       // 探究引擎：本期已考过的卡（避免重复出题）
      });

      const reply = res && res.reply ? res.reply : `（ ${this.data._line.name} 沉吟片刻，未答 ）`;
      // 体验版调试：兜底回复时把真实原因打到 Console，便于定位（正式上线前移除）
      if (res && res.fallback) {
        console.warn('[chat] 本次为兜底回复，原因：', res.reason || '未知');
      }

      // —— 探究引擎回传：本轮命中的锚点【先存下，不立即播放】——
      // 印记若与 AI 回复同时出现，会互相抢注意力，也让"因为你说出了「X」"失去上下文；
      // 统一等 streamTypeNpc 逐字播完后再落印（见 flushPendingAnchorHits）。
      // quote 在前端本地比对关键词得出，不需要云函数额外传参。
      const hitAnchors = (res && res.anchorIds) || [];
      if (hitAnchors.length) {
        // confirm = "说到了正确答案但语气不确定"，是求证命中，不等于理解命中
        const kind = (res && res.stage === 'confirm') ? 'confirm' : 'answer';
        this._pendingAnchorHits = hitAnchors.map((aid) => {
          const ainfo = anchorInfo.getAnchorInfo(this.data._line.id, aid);
          return { id: aid, kind, quote: anchorInfo.pickQuote(text, ainfo) };
        });
      } else {
        this._pendingAnchorHits = null;
      }

      // —— 累计已覆盖知识点；满足条件则由史料卡动态出一道检验题（每期限 3 题）——
      const covered = (res && res.covered) || this.data._covered;
      const newQuiz = (res && res.ready && res.quiz && this.data.quizTotal < 3) ? res.quiz : null;
      const rounds = this.data.aiRounds + 1;
      const roundsOk = rounds >= this.data.minRounds;
      // 有待答的检验题时，先别让他溜走；答过就放行
      const pendingQuiz = !!newQuiz && !this.data.quizResult;

      // —— 模拟流式逐字：先塞空占位气泡，再用定时器逐字填充，营造"他在打字" ——
      const rid = ++this.data._msgSeq;
      const newLog = this.data.chatLog.concat([
        { id: rid, role: 'npc', content: '' }
      ]);
      this.setData({
        chatLog: newLog,
        scrollToId: 'msg-' + rid,
        aiRounds: rounds,
        _covered: covered,
        quiz: newQuiz || (pendingQuiz ? this.data.quiz : null),
        quizPicked: newQuiz ? -1 : this.data.quizPicked,
        quizResult: newQuiz ? '' : this.data.quizResult,
        canContinue: roundsOk && !pendingQuiz
      });
      this.streamTypeNpc(rid, reply, () => this.flushPendingAnchorHits());
    } catch (err) {
      console.error('[chat] AI 发送失败', err);
      // 失败时丢弃本轮待播放锚点，不留残留
      this._pendingAnchorHits = null;
      this.setData({ aiTyping: false, aiStreaming: false });
      wx.showToast({ title: '发送失败，请重试', icon: 'none' });
    }
  },

  // 模拟流式逐字：把完整回复逐字填充到指定气泡，营造"打字机"效果
  // 注意：只更新 chatLog 里该条 message 的 content，避免整表 setData 造成卡顿
  // onDone：整段播完（或空回复）后回调，用于"回复打完再落印"
  streamTypeNpc(id, fullText, onDone) {
    if (this.data._aiStreamTimer) {
      clearInterval(this.data._aiStreamTimer);
      this.data._aiStreamTimer = null;
    }
    const text = fullText || '';
    const chars = Array.from(text);   // 按 Unicode 码点拆，中文/emoji 都不会错位
    // 进入逐字阶段：隐藏"…"占位（气泡本体开始打字）
    this.setData({ aiStreaming: true });

    // 收尾：清定时器 → 把整段原文写回气泡（保证 chatLog 与 fullText 完全一致，
    // 也保证最后一个字符一定显示）→ 复位状态 → 再通知外部落印
    const finish = () => {
      if (this.data._aiStreamTimer) {
        clearInterval(this.data._aiStreamTimer);
        this.data._aiStreamTimer = null;
      }
      const list = this.data.chatLog;
      const idx = list.findIndex(m => m.id === id);
      if (idx >= 0) {
        this.setData({ ['chatLog[' + idx + '].content']: text });
      }
      this.setData({ aiTyping: false, aiStreaming: false });
      if (typeof onDone === 'function') onDone();
    };

    // 空回复：直接收尾，不留定时器（onDone 仍会走，但 pending 为空自然不落印）
    if (!chars.length) { finish(); return; }

    let i = 0;
    // 每 40ms 出一个字，短句飞快，长句也自然；中文约 25 字/秒，接近人阅读语速
    this.data._aiStreamTimer = setInterval(() => {
      const list = this.data.chatLog;
      const idx = list.findIndex(m => m.id === id);
      // 气泡已不存在（页面卸载 / 消息被移除）：中止，且不触发 onDone，
      // 避免在已销毁的页面上落印
      if (idx < 0) {
        if (this.data._aiStreamTimer) {
          clearInterval(this.data._aiStreamTimer);
          this.data._aiStreamTimer = null;
        }
        this.setData({ aiTyping: false, aiStreaming: false });
        return;
      }
      i++;
      // 用 path 精确更新单条消息，避免全量重写（setData 支持 'chatLog[2].content' 这类路径）
      this.setData({
        ['chatLog[' + idx + '].content']: chars.slice(0, i).join('')
      });
      // 最后一个字符写完之后才收尾——原实现在这里直接 return，导致末字永远不显示
      if (i >= chars.length) finish();
    }, 40);
  },

  // 点击推荐提问
  onSuggestionTap(e) {
    const q = e.currentTarget.dataset.q;
    if (!q || this.data.aiTyping) return;
    // 直接填入输入框并发送
    this.setData({ inputText: q }, () => this.onAiSend());
  },

  // 继续剧情
  onContinueStory() {
    const node = this._resolvedNode || this.data._quest.nodes[this.data.nodeId];
    if (node && node.next) {
      this.gotoNode(node.next);
    }
  },

  // ============ 锚点与结束 ============

  // ============ 知识落印：把「系统通知」改成「学习反馈」 ============
  //
  // 三步，全程不打断剧情：
  //   ① 朱印落下（约 0.82s）——只有画面中央一个印，表示"你刚发现了一个知识点"
  //   ② 轻量知识卡（3s）——我获得了什么 / 为什么获得 / 一句话学到了什么
  //   ③ 自动收成右上角小印章 [识 n/m]——不点也能继续对话，想看再点开
  //
  // kind：story 剧情印记 | answer 回答命中 | confirm 求证命中 | choice 选择命中
  // meta：{ kind, quote 学生说中的关键词 }
  //
  // 本方法【只做记账 + 入队】，不播放动画：
  //   一次 AI 回复可能同时命中多个锚点，若各自直接播放，后一个会清掉前一个的定时器，
  //   结果只能看到最后一张卡。播放统一交给 enqueueAnchorReveal → playNextAnchorReveal 串行处理。
  fireAnchor(anchorId, meta) {
    const line = this.data._line || {};
    const anchors = line.anchors || {};
    // 白名单：锚点必须存在于本条线的 ANCHORS 表。剧本脏数据或异常回包里的
    // 未知 id 一律丢弃，避免把无名印记写进正式存档（诗笺页会出现空名印章）。
    if (!anchorId || !anchors[anchorId]) {
      if (anchorId) console.warn('[chat] 未知锚点已忽略', anchorId);
      return;
    }
    const name = anchors[anchorId];
    const kind = (meta && meta.kind) || 'story';
    const seenKind = this.data._anchorSet[anchorId] || '';

    // 本轮去重：已点亮过，只有"更硬的获得方式"才再落一次印
    // （例：先由剧情带出 a1，之后学生自己答出"杜审言"，再用「回答命中」重落一次）
    if (seenKind && rankOf(kind) <= rankOf(seenKind)) return;

    // 两个"第一次"必须分开，含义完全不同：
    //   firstInRun：本次进入旅程后是否第一次触发 → 只决定 anchorCount 加不加一
    //   firstEver ：用户历史上是否已拥有这枚印记 → 只决定标题显示「新获得 / 再次印证」
    // firstEver 必须在 progress.addAnchor() 之前算，否则写进去之后永远是"已拥有"
    const firstInRun = !seenKind;
    const lineId = line.id || 'dufu';
    const owned = progress.getAnchors(lineId);
    const firstEver = !owned[anchorId];

    const set = Object.assign({}, this.data._anchorSet);
    set[anchorId] = kind;
    const count = firstInRun ? this.data.anchorCount + 1 : this.data.anchorCount;

    // 持久化（幂等）：同一锚点被剧情或回答点亮几次都只写入一次，
    // 重玩旅程时 anchorCount 照常加一，因为它代表"本程点亮数量"。
    // 重温（replay）不落盘：本次只更新内存展示，退出即丢弃，避免污染正式印记集。
    if (this._shouldWriteProgress()) progress.addAnchor(lineId, anchorId);

    const info = anchorInfo.getAnchorInfo(lineId, anchorId);
    const card = this.buildAnchorCard(
      anchorId, name, info, kind, meta, count, this.data.anchorTotal, firstEver
    );

    this.setData({ _anchorSet: set, anchorCount: count });
    this.enqueueAnchorReveal(card);
  },

  // 组装知识卡文案：三件事各占一行——获得了什么 / 为什么获得 / 学到了什么
  buildAnchorCard(anchorId, name, info, kind, meta, count, total, firstEver) {
    const seal = (info && info.seal) || KIND_SEAL[kind] || '寻迹印记';
    const quote = (meta && meta.quote) || '';
    let why;
    switch (kind) {
      case 'answer':
        why = quote ? `因为你说出了「${quote}」` : '因为你说到了要点';
        break;
      // confirm = 说到了正确答案但语气不确定（"是不是杜审言？"），是求证，不是理解
      case 'confirm':
        why = quote
          ? `你说出了「${quote}」，虽还有些不确定，也已经触及要点`
          : '你提到了要点，虽还有些不确定';
        break;
      case 'choice':
        why = `你的选择，触及了「${name}」`;
        break;
      default:
        why = `剧情行至此处，你顺势读到了「${name}」`;
    }
    const detail = (info && info.detail) || anchorInfo.FALLBACK.detail;
    // 诗歌数据：原样透传（不在这里改写诗名/句数，换任何诗都不用动代码）
    const poem = (info && info.poem) || null;
    // 轻量卡只挑 highlight 的句子，且最多 2 句 —— 卡片高度恒定，不会重新压住底部对话框
    const poemExcerpt = poem
      ? (poem.lines || []).filter(l => l && l.highlight).map(l => l.text).slice(0, 2)
      : [];
    return {
      id: anchorId,
      name,
      seal,
      label: KIND_LABEL[kind] || '剧情印记',
      head: seal + ' · ' + (firstEver ? '新获得' : '再次印证'),
      // 朱印上的字与印下小字，随获得方式变化
      sealChar: '识',
      sealTitle: firstEver ? '新印记已点亮' : '印证了一处印记',
      why,
      know: (info && info.know) || '',
      poem,
      poemExcerpt,
      detail,
      links: (info && info.links) || [],
      hasDetail: !!(info && info.detail),
      count,
      total
    };
  },

  // ---------- 展示队列：串行播放，一张播完再播下一张 ----------

  /** 入队；若当前空闲则立刻开始播放。onGone 可选：这张卡收起后触发（用于 anchorCard 节点推进剧情） */
  enqueueAnchorReveal(card, onGone) {
    if (!card) return;
    if (!this._anchorRevealQueue) this._anchorRevealQueue = [];
    card._onGone = onGone || null;
    this._anchorRevealQueue.push(card);
    if (!this._anchorRevealBusy) this.playNextAnchorReveal();
  },

  /** 取队首播放：朱印 820ms → 知识卡 3s → 自动收起 → 自动播下一张 */
  playNextAnchorReveal() {
    const queue = this._anchorRevealQueue || [];
    if (!queue.length) {
      this._anchorRevealBusy = false;
      return;
    }
    const card = queue.shift();
    this._anchorRevealBusy = true;
    this._currentAnchorCard = card;

    if (this._sealTimer) { clearTimeout(this._sealTimer); this._sealTimer = null; }
    if (this._collapseTimer) { clearTimeout(this._collapseTimer); this._collapseTimer = null; }
    this._clearRollTimers();
    this._kcardRolling = false;

    // —— 第一步：朱印点亮 ——
    this.setData({
      anchorCard: null,
      kcardPhase: '',
      kcardFlyTransform: '',
      anchorDetailOpen: false,
      sealKicker: card.sealChar,
      sealTitle: card.sealTitle,
      sealPulse: true
    });

    // 落印阶段不再提前展开小卷轴：等知识卡飞进去后，再由收起动画
    // 驱动小卷轴「张开 → 慢慢收起」，完成"收成一轴小卷"的收尾动作。

    this._sealTimer = setTimeout(() => {
      this._sealTimer = null;
      // —— 第二步：出现轻量知识卡 ——
      this.setData({
        sealPulse: false,
        anchorCard: card,
        lastAnchorCard: card
      });
      // —— 第三步：3s 后自动收起（直线飞向右上角缩到最小 → 小卷轴张开再慢慢收起）——
      this._collapseTimer = setTimeout(() => {
        this._collapseTimer = null;
        this.beginKcardRollOut();
      }, 3000);
    }, 820);
  },

  /** 结束当前这张卡（自然收起 / 点「收下」/ 关掉完整史料），继续下一张 */
  finishCurrentAnchorReveal() {
    if (this._sealTimer) { clearTimeout(this._sealTimer); this._sealTimer = null; }
    if (this._collapseTimer) { clearTimeout(this._collapseTimer); this._collapseTimer = null; }
    this._clearRollTimers();
    this._kcardRolling = false;
    const done = this._currentAnchorCard;
    this._currentAnchorCard = null;
    this.setData({ sealPulse: false, anchorCard: null, kcardPhase: '', kcardFlyTransform: '', anchorDetailOpen: false });
    this.collapseMiniSeal();
    // anchorCard 节点：这张卡收完即推进剧情（node.next）
    if (done && typeof done._onGone === 'function') {
      this._anchorRevealBusy = false;   // 先释放播放位，推进剧情后新节点可重新入队播放
      done._onGone();
      return;
    }
    this.playNextAnchorReveal();
  },

  // ---------- 知识卡收起动画：直线飞向右上角缩到最小 → 小卷轴张开再慢慢收起 ----------

  _clearRollTimers() {
    if (this._rollTimerA) { clearTimeout(this._rollTimerA); this._rollTimerA = null; }
    if (this._rollTimerB) { clearTimeout(this._rollTimerB); this._rollTimerB = null; }
    if (this._rollTimerC) { clearTimeout(this._rollTimerC); this._rollTimerC = null; }
  },

  /**
   * 收起当前知识卡：
   *   1) 卡片直线飞向右上角小卷轴、直接缩到最小并渐隐（0.42s）；
   *   2) 到位后右上角小卷轴「张开」（快）→ 停留 → 「慢慢收起」（0.95s 慢速）；
   *   3) 收完清理卡片、继续队列。
   * onGone 可选：收尾回调，缺省走 finishCurrentAnchorReveal。
   */
  beginKcardRollOut(onGone) {
    if (this._kcardRolling) return;
    this._kcardRolling = true;
    if (this._collapseTimer) { clearTimeout(this._collapseTimer); this._collapseTimer = null; }

    // 测量卡片与右上小印章的位置，算直线位移；连同 scale/透视写成 transform 注入，
    // translate 写在 scale 右侧（矩阵先 scale 后 translate），落点不随缩放偏移。
    const q = wx.createSelectorQuery();
    q.select('.vn-kcard').boundingClientRect();
    q.select('.vn-seal-mini').boundingClientRect();
    q.exec((res) => {
      if (!this._kcardRolling) return;   // 测量期间页面被卸载/被中断，放弃本次动画
      const card = res[0];
      const seal = res[1];
      let dx = 0;
      let dy = 0;
      if (card && seal) {
        dx = (seal.left + seal.width / 2) - (card.left + card.width / 2);
        dy = (seal.top + seal.height / 2) - (card.top + card.height / 2);
      }
      // 一步到位：直接缩到最小（scale 0.06）+ 渐隐
      this.setData({
        kcardFlyTransform: `perspective(900rpx) translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(0.06) rotateX(18deg)`,
        kcardPhase: 'shrink'
      });

      // 到位后：小卷轴张开（快）
      this._rollTimerA = setTimeout(() => {
        this._rollTimerA = null;
        this.expandMiniSeal();
      }, 430);

      // 停留片刻后：小卷轴慢慢收起
      this._rollTimerC = setTimeout(() => {
        this._rollTimerC = null;
        this.collapseMiniSeal(true);
      }, 430 + 540);
    });

    // 慢速收起（约 0.95s）走完后清理卡片、继续队列
    this._rollTimerB = setTimeout(() => {
      this._rollTimerB = null;
      this._kcardRolling = false;
      if (onGone) onGone();
      else this.finishCurrentAnchorReveal();
    }, 430 + 540 + 1000);
  },

  // ---------- 用户操作 ----------

  // 「收下」→ 播收起动画（透视收缩 → 小卷轴卷起），继续下一张
  onAnchorCardClose() {
    this.beginKcardRollOut();
  },

  // 「查看完整史料」→ 暂停自动收起，等用户看完
  onAnchorDetail() {
    if (this._collapseTimer) { clearTimeout(this._collapseTimer); this._collapseTimer = null; }
    this.setData({ anchorDetailOpen: true });
  },

  // 关闭完整史料 → 先收史料面板，再播收起动画，继续下一张
  onAnchorDetailClose() {
    this.setData({ anchorDetailOpen: false });
    this.beginKcardRollOut();
  },

  // 点右上角小印章 → 回看最近一张卡。
  // 正在播放队列时直接忽略，不允许覆盖当前正在展示的卡片。
  onMiniSealTap() {
    if (this._anchorRevealBusy || this._kcardRolling) return;
    const card = this.data.lastAnchorCard;
    if (!card) {
      wx.showToast({ title: '还没有点亮印记', icon: 'none' });
      return;
    }
    if (this._collapseTimer) { clearTimeout(this._collapseTimer); this._collapseTimer = null; }
    // 点击 → 小卷轴展开，同时回看最近一张卡
    this.expandMiniSeal();
    this.setData({ anchorCard: card, kcardPhase: '', kcardFlyTransform: '' });
    this._collapseTimer = setTimeout(() => {
      this._collapseTimer = null;
      // 回看结束同样走「直线飞向右上角缩到最小 → 小卷轴张开再慢慢收起」
      this.beginKcardRollOut(() => {
        this.setData({ anchorCard: null, kcardPhase: '', kcardFlyTransform: '' });
        this.collapseMiniSeal();
      });
    }, 3000);
  },

  // ---------- AI 命中锚点：等回复打完字再落印 ----------

  /**
   * 云函数返回的命中锚点先存进 _pendingAnchorHits，不立即播放。
   * 由 streamTypeNpc 的完成回调调用本方法统一落印。
   */
  flushPendingAnchorHits() {
    const hits = this._pendingAnchorHits;
    this._pendingAnchorHits = null;
    if (!hits || !hits.length) return;
    hits.forEach((h) => {
      this.fireAnchor(h.id, { kind: h.kind, quote: h.quote });
    });
  },

  // 卡片/详情面板自身区域的空点击处理器（阻止冒泡到遮罩）
  noop() {},

  onQuestEnd() {
    this.setData({ _ended: true });

    // 地点模式：走地点级收束（写地点完成记录 + 解锁下一地点 + 页内诗笺）
    if (this._locationMode) {
      this.onLocationEnd();
      return;
    }

    const lineId = (this.data._line && this.data._line.id) || 'dufu';
    // 时期顺序按当前故事线动态取（李白线 5 期、杜甫线 4 期，不能写死）
    const order = (this.data._line && this.data._line.periods
      ? this.data._line.periods.map(p => p.id)
      : ['p1', 'p2', 'p3', 'p4']);

    // 标记本期通关 + 解锁下一期（统一存储层负责旧数据迁移与去串号）
    // 重温只读：只用现有状态算一个只读结果，不写通关、不写诗笺记录。
    let res;
    if (this._shouldWriteProgress()) {
      res = progress.completePeriod(lineId, this.data._questId, order);
    } else {
      const states = progress.computeStates(lineId, order);
      res = { allDone: order.every(id => states[id] === 'completed') };
    }

    // —— 通关收束：展示本时期收集的知识锚点 + 情感收尾，而非干巴巴的数字 ——
    const anchors = (this.data._line && this.data._line.anchors) || {};
    const gotNames = Object.keys(this.data._anchorSet)
      .filter(id => anchors[id])
      .map(id => anchors[id]);

    const questTitle = (this.data._quest && this.data._quest.title) || this.data.periodName;
    const total = this.data.anchorTotal || 0;
    const got = this.data.anchorCount || 0;

    // —— 落一份「探究档案」：供「我的诗笺」与「行迹地图」消费 ——
    // 重温不写诗笺记录（只读回放，不改写历史选择与通关时间）
    const periodMeta = (this.data._line.periods || []).find(p => p.id === this.data._questId) || {};
    if (this._shouldWriteProgress()) {
      const completedAt = Date.now();
      const previousRecord = progress.getRecord(lineId, this.data._questId) || {};
      progress.saveRecord(lineId, this.data._questId, {
        // earnedAt 只记录第一次获得诗笺的时间；completedAt 继续作为最近完成/云同步版本时间。
        earnedAt: previousRecord.earnedAt || previousRecord.completedAt || completedAt,
        completedAt,
        updatedAt: completedAt,
        anchors: Object.keys(this.data._anchorSet),
        anchorNames: gotNames,
        anchorTotal: total,
        choices: this.data.choices.map(c => ({ nodeId: c.nodeId, text: c.text, right: c.right })),
        keyChoice: this.data._keyChoice || '',
        quizCorrect: this.data.quizCorrect || 0,
        quizTotal: this.data.quizTotal || 0,
        poem: periodMeta.poem || ''
      });
    }

    let lines = [];
    lines.push(`「${questTitle}」已通关`);
    lines.push(`这一程，你点亮了 ${got}/${total} 个知识锚点`);
    if (gotNames.length) {
      lines.push('✦ ' + gotNames.join('、'));
    }
    // 探究成果：把"学习真的发生了"变成看得见的东西
    if (this.data.quizTotal > 0) {
      lines.push(`先生考校：答对 ${this.data.quizCorrect}/${this.data.quizTotal} 题`);
    }

    const content = lines.join('\n\n');
    const note = res.allDone
      ? '全程已尽，最后一张诗笺已经落笔；一路点亮的地方，也都留在行迹舆图上。'
      : '本程诗笺已经落笔，相关行迹也已同步点亮。';
    this.setData({
      questEndSummary: content,
      questEndAllDone: res.allDone,
      questEndNote: note,
      questEndVisible: true,
      questEndIsLocation: false
    });
  },

  // 地点模式通关收束：写地点完成记录 → 解锁下一地点 → 页内展示地点诗笺。
  onLocationEnd() {
    const lineId = (this.data._line && this.data._line.id) || 'dufu';
    const locationId = this._locationId;
    const meta = this._locationMeta || {};
    const order = this._locationOrder || (this.data._line.locations || []).map(l => l.id);
    const isReplay = playMode.isReplay(this._mode);

    const gotNames = Object.keys(this.data._anchorSet)
      .filter(id => (this.data._line.anchors || {})[id])
      .map(id => this.data._line.anchors[id]);

    // 重温不写正式进度：不写地点完成/解锁、不写检查点、不写诗笺记录、不改通关状态。
    // 只读地回放本程点亮结果，正式旅程的续玩位置与数据保持不变。
    let res = { allDone: false, nextId: '' };
    if (this._shouldWriteProgress()) {
      // 标记地点完成 + 解锁下一地点（重温已完成地点不改变主线活动地点，
      // completeLocation 幂等：completed 重复写仍是 completed，next 只在顺序上写 active）
      res = progress.completeLocation(lineId, locationId, order);
      // 记住本次通关结果（nextId/allDone），供回地图前写入 mapFocus 决定是否聚焦下一站
      this._locationCompleteRes = res;
      // 通关即清检查点：已完成地点再次进入应从 start 重头走（重温），不留残点
      progress.clearLocationCheckpoint(lineId, locationId);

      // —— 落一份地点记录（诗笺），供地图回顾消费 ——
      const completedAt = Date.now();
      const previousRecord = progress.getLocationRecord(lineId, locationId) || {};
      progress.saveLocationRecord(lineId, locationId, {
        // earnedAt 只记录第一次获得诗笺的时间；completedAt 继续作为最近完成/云同步版本时间
        earnedAt: previousRecord.earnedAt || previousRecord.completedAt || completedAt,
        completedAt,
        updatedAt: completedAt,
        importance: meta.importance || 'normal',
        poemTitle: meta.poemTitle || '',
        poemLine: meta.poemLine || '',
        knowledge: meta.knowledge || '',
        subtitle: meta.subtitle || '',
        range: meta.range || '',
        anchors: Object.keys(this.data._anchorSet),
        anchorNames: gotNames,
        anchorTotal: this.data.anchorTotal || 0,
        choices: this.data.choices.map(c => ({ nodeId: c.nodeId, text: c.text, right: c.right })),
        keyChoice: this.data._keyChoice || '',
        quizCorrect: this.data.quizCorrect || 0,
        quizTotal: this.data.quizTotal || 0
      });
    }

    // —— 页内诗笺：普通地点轻量（一句诗 + 一个知识点），关键地点完整 ——
    const total = this.data.anchorTotal || 0;
    const got = this.data.anchorCount || 0;
    const isKey = meta.importance === 'key';
    let lines = [];
    lines.push(`「${meta.name || ''} · ${meta.subtitle || ''}」已走过`);
    lines.push(meta.poemTitle ? `${meta.poemTitle}：「${meta.poemLine}」` : '');
    lines.push(meta.knowledge || '');
    // 关键地点补探究成果，普通地点保持轻量
    if (isKey) {
      lines.push(`这一程，你点亮了 ${got}/${total} 个知识锚点`);
      if (gotNames.length) lines.push('✦ ' + gotNames.join('、'));
      if (this.data.quizTotal > 0) lines.push(`先生考校：答对 ${this.data.quizCorrect}/${this.data.quizTotal} 题`);
    }

    const content = lines.filter(Boolean).join('\n\n');
    // 全线完成（第 22 地点）时不提示"下一站"
    const allDone = res.allDone;
    const nextMeta = res.nextId
      ? (this.data._line.locations || []).find(l => l.id === res.nextId)
      : null;
    const note = isReplay
      ? '重温到此为止；你的正式旅程进度与诗笺记录均未改变。'
      : (allDone
        ? '二十二程行迹已尽，诗史就此落幕；一路走过的地方，都已留在行迹舆图上。'
        : (nextMeta ? `下一站「${nextMeta.name} · ${nextMeta.subtitle}」已解锁，等你前往。` : '下一处行迹已解锁，等你前往。'));

    // —— 同行者回望（步骤九）——
    // 只在杜甫线且有角色时显示；文案全部来自「全体玩家必经事件」，
    // 与 avatarId 无关（三种外观得到完全相同的终章正文），也不念自定义姓名的配音。
    // 重温时只给中性提示，不宣称走过全程。
    const recapLines = dufuRecap.buildRecap({
      lineId,
      currentLocationId: locationId,
      completedLocations: this._collectCompletedLocations(),
      isReplay,
      displayName: this.data.playerName
    });
    const showRecap = dufuRecap.shouldShowRecap(lineId, this.data.playerName);

    this.setData({
      questEndSummary: content,
      questEndAllDone: allDone,
      questEndNote: note,
      questEndVisible: true,
      // 地点模式收束按钮文案：正式=收下诗笺 → 前往下一站；重温=收下诗笺 → 返回地图
      questEndIsLocation: true,
      questEndIsReplay: isReplay,
      questEndNextName: nextMeta ? `${nextMeta.name} · ${nextMeta.subtitle}` : '',
      questEndRecap: showRecap ? recapLines : [],
      questEndPlayerName: showRecap ? (this.data.playerName || '') : ''
    });
  },

  // 地点模式：收下诗笺 → 回地图（聚焦解锁的下一地点）
  onLocationEndPoem() {
    const lineId = (this.data._line && this.data._line.id) || 'dufu';
    // 聚焦下一站 / 终章 / 重温 三种回图路径统一由此决定 mapFocus 的写入
    this._applyMapFocusOnReturn(lineId);
    this.setData({ questEndVisible: false });
    wx.switchTab({ url: '/pages/map/map' });
  },

  // 地点模式回地图前写 mapFocus：聚焦下一地点 / 终章恢复全图 / 重温不聚焦
  _applyMapFocusOnReturn(lineId) {
    // 重温已完成地点：不得触发「下一站聚焦」，仅回地图（不写 mapFocus）
    if (playMode.isReplay(this._mode)) {
      app.globalData.mapFocus = null;
      return;
    }
    const res = this._locationCompleteRes || {};
    if (res.nextId) {
      // 有下一站：聚焦下一地点（不是刚完成的 locationId）
      app.globalData.mapFocus = { lineId, locationId: res.nextId, action: 'focus-next' };
    } else {
      // 已走完最后一个地点（nextId 为空）：不聚焦，恢复全图 + 终章大印
      app.globalData.mapFocus = { lineId, locationId: '', action: 'finale' };
    }
  },

  // 收下当前这一程的诗笺：切换到一级「诗笺」标签并精确定位。
  onQuestEndPoem() {
    const lineId = (this.data._line && this.data._line.id) || 'dufu';
    const periodId = this.data._questId;
    app.globalData.poemFocus = { lineId, periodId };
    this.setData({ questEndVisible: false });
    wx.switchTab({ url: '/pages/poem/poem' });
  },

  // 次操作：地点模式回地图；时期模式回到「剧本」标签，均不受进入剧情的来源页面影响。
  onQuestEndStory() {
    const lineId = (this.data._line && this.data._line.id) || 'dufu';
    if (this._locationMode) {
      // 地点模式回地图：聚焦下一站 / 终章 / 重温 由同一逻辑决定 mapFocus
      this._applyMapFocusOnReturn(lineId);
      this.setData({ questEndVisible: false });
      wx.switchTab({ url: '/pages/map/map' });
      return;
    }
    app.globalData.storyFocus = { lineId };
    this.setData({ questEndVisible: false });
    wx.switchTab({ url: '/pages/story/story' });
  },

  // 立绘加载失败诊断（路径错误/资源缺失时在 Console 提示）
  onNpcImgError(e) {
    console.error('[chat] 立绘加载失败，请检查路径与文件：', this.data.npcImage, e && e.detail);
  },

  goBack() {
    wx.navigateBack();
  }
});
