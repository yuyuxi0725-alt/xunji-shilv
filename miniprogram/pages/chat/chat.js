// pages/chat/chat.js —— 视觉小说式对话页（核心引擎，多主线通用）
// 流程：脚本节点推进（narrate/talk/choice）→ aiFree 自由对话 → 继续推进
// 多主线：通过 URL storyId 从注册表加载对应故事线，本引擎与具体古人解耦
const stories = require('../../utils/stories/index');
const assets = require('../../utils/cloudAssets');
const chatService = require('../../services/chat');
const progress = require('../../utils/progress');
const app = getApp();

Page({
  data: {
    // 页面静态资源（onLoad 时按故事线填充）
    npcImage: '',
    npcName: '',
    sceneImage: '',
    periodName: '',

    // 场景交叉淡入淡出
    scenePrev: '',      // 过渡期间的旧背景（垫底层）
    sceneReady: false,  // 新背景是否已淡入完成
    sceneFadeSlow: false, // 回忆闪回用慢速转场

    // 立绘显隐（旁白无立绘、对话立绘登场；结尾讲述时不显示）
    npcVisible: false,

    // 当前节点状态
    nodeId: '',
    nodeType: 'narrate',   // narrate | talk | choice | aiFree | reflect
    displayedText: '',     // 打字机当前显示文本
    fullText: '',          // 节点完整文本
    typing: false,

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
    showAnchorToast: false,
    anchorToastText: '',

    // 通关收束面板
    questEndVisible: false,
    questEndSummary: '',
    questEndAllDone: false,

    // 抉择记录（学生每次选择，供结尾讲述回望）
    choices: [],

    // ===== 考据挑战（先生故露错漏，等少年捉）=====
    trapActive: false,    // 当前节点是否挂着"错漏"
    trapCaught: false,    // 学生是否已捉出
    trapCatchText: '',    // 捉出后先生的反应

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
    _trapCaught: 0,   // 本期捉出的错漏数
    _trapTotal: 0,    // 本期错漏总数
    _keyChoice: '',   // 决定性瞬间结果 right|wrong|''
    _msgSeq: 0,
    _typeTimer: null,
    _typing: false,   // 打字状态（实例属性，避免 setData 异步导致点击判断失效）
    _nextNode: '',    // 打字完成后的下一节点（实例属性）
    _aiStreamTimer: null,  // AI 回复"模拟流式逐字"定时器
    _ended: false
  },

  onLoad(options) {
    const storyId = options.storyId || 'dufu';
    const questId = options.questId || 'p1';
    const line0 = stories.getLine(storyId);

    if (!line0) {
      wx.showToast({ title: '剧本未找到', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }

    // 大图已迁移云存储：先把整条线的图片路径换成云端临时链接（有全局缓存，二次进入秒开）
    assets.resolveLine(line0).then((line) => {
      const quest = line.quests && line.quests[questId];
      if (!quest) {
        wx.showToast({ title: '章节未找到', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1200);
        return;
      }

      // 统计本时期锚点总数与埋下的"错漏"总数
      const anchorTotal = Object.values(quest.nodes)
        .filter(n => n.anchor).length;
      const trapTotal = Object.values(quest.nodes)
        .filter(n => n.trap).length;

      this.setData({
        _questId: questId,
        _quest: quest,
        _line: line,
        npcName: line.name,
        sceneImage: quest.scene || line.cover || '',
        periodName: `${quest.title} · ${quest.range}`,
        npcImage: (line.periodNpcImages && line.periodNpcImages[questId]) || line.npcImage || '',
        anchorTotal,
        _anchorSet: {},
        // 每次进入时期重置探究状态
        _covered: [],
        _quizzed: [],
        _trapCaught: 0,
        _trapTotal: trapTotal,
        _keyChoice: '',
        quiz: null,
        quizPicked: -1,
        quizResult: '',
        quizCorrect: 0,
        quizTotal: 0
      });

      // 入场淡入：首帧渲染后再淡入背景，避免生硬闪现
      this._sceneFadeTimer = setTimeout(() => {
        this.setData({ sceneReady: true });
      }, 120);

      // 从起始节点开始
      this.gotoNode(quest.start);
    });
  },

  onUnload() {
    if (this.data._typeTimer) {
      clearTimeout(this.data._typeTimer);
    }
    if (this.data._aiStreamTimer) {
      clearInterval(this.data._aiStreamTimer);
      this.data._aiStreamTimer = null;
    }
    if (this._sceneFadeTimer) clearTimeout(this._sceneFadeTimer);
    if (this._sceneCleanupTimer) clearTimeout(this._sceneCleanupTimer);
  },

  // ============ 场景交叉淡入淡出 ============
  // node.sceneMode 可为 'flashback'（回忆闪回，慢速转场）；回忆结束需用 node.returnScene 切回主场景
  transitionScene(node) {
    const sets = (this.data._line.sceneSets || {})[this.data._questId] || {};
    const target = node.scene ? (sets[node.scene] || this.data.sceneImage) : this.data.sceneImage;
    // 无变化或无目标图：不动
    if (!target || target === this.data.sceneImage) return;

    if (this._sceneFadeTimer) clearTimeout(this._sceneFadeTimer);
    if (this._sceneCleanupTimer) clearTimeout(this._sceneCleanupTimer);

    // 回忆闪回：更慢的淡入淡出（1.6s），增强"思绪飘回过去"的舒缓感
    const slow = node.sceneMode === 'flashback';
    this.setData({
      scenePrev: this.data.sceneImage,
      sceneImage: target,
      sceneReady: false,
      sceneFadeSlow: slow
    });
    this._sceneFadeTimer = setTimeout(() => {
      this.setData({ sceneReady: true });
    }, slow ? 120 : 60);
    // 过渡完成后移除旧图层
    this._sceneCleanupTimer = setTimeout(() => {
      this.setData({ scenePrev: '' });
    }, slow ? 1800 : 1100);
  },

  // ============ 节点推进引擎 ============

  gotoNode(nodeId) {
    if (nodeId === '__end__') {
      this.onQuestEnd();
      return;
    }
    const node = this.data._quest.nodes[nodeId];
    if (!node) {
      this.onQuestEnd();
      return;
    }

    switch (node.type) {
      case 'narrate':
      case 'talk':
        if (node.anchor) this.fireAnchor(node.anchor);
        // 立绘显隐：节点可用 npc 字段显式指定（true 强制显示 / false 强制隐藏），
        // 未指定时按类型兜底：talk 显示（与人交互）、narrate 隐藏（纯沉浸/回忆）
        const showNpc = node.npc !== undefined ? node.npc : (node.type === 'talk');
        this.setData({
          nodeId,
          nodeType: node.type,
          fullText: node.text,
          npcSpeaking: node.type === 'talk',
          npcVisible: showNpc,
          // 立绘统一：始终使用该时期基准脸
          npcImage: (this.data._line.periodNpcImages && this.data._line.periodNpcImages[this.data._questId]) || this.data._line.npcImage || '',
          displayedText: '',
          typing: true,
          // 考据挑战：本节点若埋了"错漏"，打完字后弹出挑战入口
          trapActive: !!node.trap,
          trapCaught: false,
          trapCatchText: ''
        });
        // 场景切换（回忆闪回走慢速转场，形成"思绪飘回过去→回到现实"的时间线）
        this.transitionScene(node);
        this.typeText(node.text, node.next);
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
          choiceFeedback: null
        });
        // 抉择节点同样支持场景切换（如落榜放榜画面）
        this.transitionScene(node);
        break;

      case 'reflect':
        // 结尾"完整讲述"：同游者回望，逐句浮现，不点破结论
        this.enterReflect(node);
        break;

      case 'aiFree':
        // 考据挑战：先生先开口说一句【含史实错漏】的话，等少年捉
        // （trap 挂在 aiFree 上，不改任何 next 指针，剧本流程零风险）
        const seedLog = node.trap
          ? [{ id: ++this.data._msgSeq, role: 'npc', content: node.trap.text }]
          : [];
        this.setData({
          nodeId,
          nodeType: 'aiFree',
          aiHint: node.hint || '向' + this.data.npcName + '提问…',
          suggestions: node.suggestions || [],
          minRounds: node.minRounds || 1,
          aiRounds: 0,
          canContinue: false,
          chatLog: seedLog,
          npcSpeaking: true,
          // 自由对话：立绘登场（面对面提问）；节点可用 npc:false 隐藏
          npcVisible: node.npc !== undefined ? node.npc : true,
          typing: false,
          // 探究式对话：进入新节点时清掉上一轮的检验状态
          quiz: null,
          quizPicked: -1,
          quizResult: '',
          trapActive: !!node.trap,
          trapCaught: false,
          trapCatchText: ''
        });
        this.transitionScene(node);
        break;

      default:
        this.onQuestEnd();
    }
  },

  // 打字机效果
  typeText(text, next) {
    let i = 0;
    this._typing = true;
    this._nextNode = next;
    // 打字速度：默认 60ms/字，营造娓娓道来的节奏（回忆节点可更慢）
    const speed = 60;
    const step = () => {
      if (i <= text.length) {
        this.setData({ displayedText: text.slice(0, i) });
        i += 1;
        this.data._typeTimer = setTimeout(step, speed);
      } else {
        this._typing = false;
        this.setData({ typing: false });
      }
    };
    step();
  },

  // 点击对话框：打字中 → 立即显示全文；已打完 → 进入下一节点
  onDialogTap() {
    if (this.data.nodeType !== 'narrate' && this.data.nodeType !== 'talk') return;

    // 正在打字 → 直接显示全文（停在这一句，等用户再点才推进）
    if (this._typing) {
      clearTimeout(this.data._typeTimer);
      this._typing = false;
      this.setData({
        typing: false,
        displayedText: this.data.fullText
      });
      return;
    }
    // 有待捉的错漏时，先让少年做判断，不让他滑过去
    if (this.data.trapActive && !this.data.trapCaught) {
      wx.showToast({ title: '先生这句话，你可听出什么了？', icon: 'none' });
      return;
    }
    // 打字完成 → 推进下一节点
    if (this._nextNode) {
      this.gotoNode(this._nextNode);
    }
  },

  // ============ 考据挑战：先生故露错漏，等少年捉 ============

  // 少年指出错漏 → 先生愣住、认错、称赞，点亮专属锚点
  onTrapChallenge() {
    if (!this.data.trapActive || this.data.trapCaught) return;
    const node = this.data._quest.nodes[this.data.nodeId];
    const trap = node && node.trap;
    if (!trap) return;

    const catchText = trap.catchText || '（愣了一下，随即抚掌）好眼力！倒是叫你捉住了。';
    const patch = {
      trapCaught: true,
      trapCatchText: catchText,
      _trapCaught: this.data._trapCaught + 1
    };
    // 自由对话里：把先生的反应并入对话记录——既是 UX，也让 AI 的上下文看到"已被纠正"
    if (this.data.nodeType === 'aiFree') {
      const id = ++this.data._msgSeq;
      patch.chatLog = this.data.chatLog.concat([{ id, role: 'npc', content: catchText }]);
      patch.scrollToId = 'msg-' + id;
    }
    this.setData(patch);
    // 捉出即点亮"专属锚点"（通常是稀有锚点）
    if (trap.anchor) this.fireAnchor(trap.anchor);
    if (trap.toast) {
      wx.showToast({ title: trap.toast, icon: 'none', duration: 2000 });
    }
  },

  // 少年没听出来 / 选择继续
  // 关键：即使他没捉出来，先生也要自己"回过神来"把正史说对——
  //       既保证"正确的知识一定被讲到"，也避免错误表述留在 AI 的上下文里被沿用。
  onTrapContinue() {
    const node = this.data._quest.nodes[this.data.nodeId];
    if (!node) return;

    // 自由对话里的考据挑战：听完接着聊，不推进节点
    if (this.data.nodeType === 'aiFree') {
      if (this.data.trapActive && !this.data.trapCaught) {
        const trap = node.trap || {};
        const line = '（顿了顿，自己回过神来）……不对，方才是我记岔了，该是'
          + (trap.right || '') + '才对。你可别记了我错的那一句。';
        const id = ++this.data._msgSeq;
        this.setData({
          trapActive: false,
          chatLog: this.data.chatLog.concat([{ id, role: 'npc', content: line }]),
          scrollToId: 'msg-' + id
        });
        return;
      }
      this.setData({ trapActive: false });
      return;
    }

    // 剧本 talk 节点上的考据挑战：继续推进剧情
    if (this.data.trapActive && !this.data.trapCaught) {
      this.setData({ trapActive: false });
    }
    if (node.next) this.gotoNode(node.next);
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

    // 带对错的"决定性瞬间"：先给轻量反馈，再进入分支
    if (opt.right !== undefined) {
      const feedback = opt.right
        ? { type: 'right', text: opt.feedback || '' }
        : { type: 'wrong', text: opt.feedback || '' };
      this.setData({ choiceFeedback: feedback });
      // 短暂停留让反馈呈现，再推进
      setTimeout(() => {
        this.gotoNode(opt.result || opt.next);
      }, 1600);
      return;
    }

    // 无对错探索：直接推进
    this.gotoNode(opt.result || opt.next);
  },

  // ============ 结尾"完整讲述"（reflect） ============

  enterReflect(node) {
    const lines = node.lines || [];
    this.setData({
      nodeId: this.data.nodeId,
      nodeType: 'reflect',
      npcSpeaking: false,
      npcVisible: false,   // 结尾回望：隐去立绘，纯黑幕 + 逐句文字，更沉浸有回味
      typing: false,
      reflectLines: [],
      reflectDone: false,
      reflectTotal: lines.length
    });
    // 逐句浮现（2s/句，更舒缓，像纪录片旁白）
    let i = 0;
    const showNext = () => {
      if (i >= lines.length) {
        this.setData({ reflectDone: true, _reflectNext: node.next });
        return;
      }
      this.setData({ reflectLines: lines.slice(0, i + 1) });
      i += 1;
      this.data._reflectTimer = setTimeout(showNext, 2000);
    };
    showNext();
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

    const node = this.data._quest.nodes[this.data.nodeId];

    try {
      const res = await chatService.sendMessage({
        sessionId: this.data._line.id + '_' + this.data._questId + '_' + (app.globalData.openid || 'local'),
        questId: this.data._questId,
        npcId: this.data._line.id,   // 云函数据此切换人设与知识库（dufu/libai），避免"问李白答杜甫"串线
        message: text,
        history,
        freePrompt: node && node.prompt,  // 把场景提示传给云函数
        covered: this.data._covered,      // 探究引擎：本期已探究到的史料卡
        quizzed: this.data._quizzed       // 探究引擎：本期已考过的卡（避免重复出题）
      });

      const reply = res && res.reply ? res.reply : `（ ${this.data._line.name} 沉吟片刻，未答 ）`;
      // 体验版调试：兜底回复时把真实原因打到 Console，便于定位（正式上线前移除）
      if (res && res.fallback) {
        console.warn('[chat] 本次为兜底回复，原因：', res.reason || '未知');
      }

      // —— 探究引擎回传：点亮本轮命中的知识锚点 ——
      const anchors = (res && res.anchorIds) || [];
      if (anchors.length) anchors.forEach((id) => this.fireAnchor(id));

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
      this.streamTypeNpc(rid, reply);
    } catch (err) {
      console.error('[chat] AI 发送失败', err);
      this.setData({ aiTyping: false, aiStreaming: false });
      wx.showToast({ title: '发送失败，请重试', icon: 'none' });
    }
  },

  // 模拟流式逐字：把完整回复逐字填充到指定气泡，营造"打字机"效果
  // 注意：只更新 chatLog 里该条 message 的 content，避免整表 setData 造成卡顿
  streamTypeNpc(id, fullText) {
    if (this.data._aiStreamTimer) clearInterval(this.data._aiStreamTimer);
    const chars = Array.from(fullText);   // 按 Unicode 码点拆，中文/emoji 都不会错位
    // 进入逐字阶段：隐藏"…"占位（气泡本体开始打字）
    this.setData({ aiStreaming: true });
    let i = 0;
    // 每 40ms 出一个字，短句飞快，长句也自然；中文约 25 字/秒，接近人阅读语速
    this.data._aiStreamTimer = setInterval(() => {
      i++;
      if (i >= chars.length) {
        clearInterval(this.data._aiStreamTimer);
        this.data._aiStreamTimer = null;
        this.setData({ aiTyping: false, aiStreaming: false });
        return;
      }
      const list = this.data.chatLog;
      const idx = list.findIndex(m => m.id === id);
      if (idx < 0) { clearInterval(this.data._aiStreamTimer); return; }
      // 用 path 精确更新单条消息，避免全量重写（setData 支持 'chatLog[2].content' 这类路径）
      this.setData({
        ['chatLog[' + idx + '].content']: chars.slice(0, i).join('')
      });
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
    const node = this.data._quest.nodes[this.data.nodeId];
    if (node && node.next) {
      this.gotoNode(node.next);
    }
  },

  // ============ 锚点与结束 ============

  // 触发知识锚点：显示提示 + 计数 + 持久化到本地缓存（供 profile 页"锚点回顾"读取）
  fireAnchor(anchorId) {
    if (this.data._anchorSet[anchorId]) return;  // 去重
    const anchors = (this.data._line && this.data._line.anchors) || {};
    const name = anchors[anchorId] || anchorId;
    const set = Object.assign({}, this.data._anchorSet);
    set[anchorId] = true;

    this.setData({
      _anchorSet: set,
      anchorCount: this.data.anchorCount + 1,
      anchorToastText: name,
      showAnchorToast: true
    });
    setTimeout(() => {
      this.setData({ showAnchorToast: false });
    }, 2200);

    // 持久化已收集锚点（走统一存储层：按主线分组，避免李杜锚点串号）
    const storyId = (this.data._line && this.data._line.id) || 'dufu';
    progress.addAnchor(storyId, anchorId);
  },

  onQuestEnd() {
    this.setData({ _ended: true });

    const lineId = (this.data._line && this.data._line.id) || 'dufu';
    // 时期顺序按当前故事线动态取（李白线 5 期、杜甫线 4 期，不能写死）
    const order = (this.data._line && this.data._line.periods
      ? this.data._line.periods.map(p => p.id)
      : ['p1', 'p2', 'p3', 'p4']);

    // 标记本期通关 + 解锁下一期（统一存储层负责旧数据迁移与去串号）
    const res = progress.completePeriod(lineId, this.data._questId, order);

    // —— 通关收束：展示本时期收集的知识锚点 + 情感收尾，而非干巴巴的数字 ——
    const anchors = (this.data._line && this.data._line.anchors) || {};
    const gotNames = Object.keys(this.data._anchorSet)
      .filter(id => anchors[id])
      .map(id => anchors[id]);

    const questTitle = (this.data._quest && this.data._quest.title) || this.data.periodName;
    const total = this.data.anchorTotal || 0;
    const got = this.data.anchorCount || 0;

    // —— 落一份「探究档案」：供「我的诗笺」与「行迹地图」消费 ——
    const periodMeta = (this.data._line.periods || []).find(p => p.id === this.data._questId) || {};
    progress.saveRecord(lineId, this.data._questId, {
      completedAt: Date.now(),
      anchors: Object.keys(this.data._anchorSet),
      anchorNames: gotNames,
      anchorTotal: total,
      choices: this.data.choices.map(c => ({ nodeId: c.nodeId, text: c.text, right: c.right })),
      keyChoice: this.data._keyChoice || '',
      trapCaught: this.data._trapCaught || 0,
      trapTotal: this.data._trapTotal || 0,
      quizCorrect: this.data.quizCorrect || 0,
      quizTotal: this.data.quizTotal || 0,
      poem: periodMeta.poem || ''
    });

    let lines = [];
    lines.push(`「${questTitle}」已通关`);
    lines.push(`这一程，你点亮了 ${got}/${total} 个知识锚点`);
    if (gotNames.length) {
      lines.push('✦ ' + gotNames.join('、'));
    }
    // 探究成果：把"学习真的发生了"变成看得见的东西
    if (this.data._trapTotal > 0) {
      lines.push(`考据之眼：捉出 ${this.data._trapCaught}/${this.data._trapTotal} 处史实错漏`);
    }
    if (this.data.quizTotal > 0) {
      lines.push(`先生考校：答对 ${this.data.quizCorrect}/${this.data.quizTotal} 题`);
    }

    const content = lines.join('\n\n');
    this.setData({ questEndSummary: content, questEndAllDone: res.allDone, questEndVisible: true });
  },

  // 通关收束面板：点击确认返回剧本页
  onQuestEndClose() {
    this.setData({ questEndVisible: false });
    wx.navigateBack();
  },

  // 立绘加载失败诊断（路径错误/资源缺失时在 Console 提示）
  onNpcImgError(e) {
    console.error('[chat] 立绘加载失败，请检查路径与文件：', this.data.npcImage, e && e.detail);
  },

  goBack() {
    wx.navigateBack();
  }
});
