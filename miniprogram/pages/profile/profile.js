// pages/profile/profile.js —— 我的（个人信息 + 学习成果 + 设置）
// 登录说明：用户在首页主动同意协议后，才通过 wx.login 换取 openid。
const stories = require('../../utils/stories/index');
const progress = require('../../utils/progress');
const sync = require('../../utils/sync');
const playerAvatars = require('../../utils/player-avatars');
const playerPortrait = require('../../utils/player-portrait');
const playerCard = require('../../utils/player-card');
const guard = require('../../utils/player-guard');
const assets = require('../../utils/cloudAssets');
const app = getApp();

const DEFAULT_NICK = '少年史官';
// 暂不在「我的」页展示角色卡。角色创建、剧情恢复和存档功能仍保留。
// 后续如需恢复这一区域，改为 true 即可。
const SHOW_ROLE_SECTION = false;

// 三条人物线角色卡（按人物线白名单顺序生成：杜甫 / 李白 / 苏轼）
const ROLE_LINES = guard.ROLE_LINES;

Page({
  data: {
    nickname: DEFAULT_NICK,   // 用户昵称（本地缓存，可改）
    avatarText: '少',          // 头像显示昵称首字
    loggedIn: false,           // 是否已在用户同意协议后登录
    identityConnecting: false, // 重新编译/冷启动后是否正在恢复微信身份
    deletingAccount: false,    // 是否正在永久删除云端学习档案
    bgmOn: true,               // 背景音乐开关
    summary: { lines: 0, completed: 0, total: 0, anchorsGot: 0, anchorsTotal: 0 },
    showRoleSection: SHOW_ROLE_SECTION,
    // 三条人物线 · 我的角色卡片列表（剧情中的名字，与账号昵称分开，各线档案独立）
    roleCards: []
  },

  onShow() {
    this.refreshProfile();
    // 区域隐藏时不再解析三张云端立绘。
    if (this.data.showRoleSection) this.refreshRoleCards();
    const lp = this.buildProgress();
    const la = this.buildAnchors();
    this.setData({
      summary: this.buildSummary(lp, la)
    });

    // 重新编译或冷启动会清空内存中的 openid。仅当用户此前已主动确认年龄和协议时，
    // 才恢复微信身份；否则不得在未同意状态下发起登录。
    if (!app.globalData.openid &&
        app.globalData.agreementAccepted === true &&
        app.globalData.ageConfirmed === true) {
      this.restoreIdentity();
    }
  },

  async restoreIdentity() {
    if (this.data.identityConnecting) return;
    this.setData({ identityConnecting: true });
    try {
      await app.silentLogin();
      this.setData({ loggedIn: !!app.globalData.openid });
    } catch (err) {
      console.warn('[profile] 恢复学习档案连接失败', err);
    } finally {
      this.setData({ identityConnecting: false });
    }
  },

  // 学习成果三个数字 → 对应页面（剧本 / 行迹 / 诗笺）
  onTapSummary(e) {
    const target = e.currentTarget.dataset.target;
    const urls = {
      story: '/pages/story/story',   // 同行古人 → 剧本选择
      map: '/pages/map/map',         // 完成旅程 → 行迹
      poem: '/pages/poem/poem'       // 知识印章 → 我的诗笺
    };
    const url = urls[target];
    if (url) wx.switchTab({ url });
  },

  // 昵称 / 登录状态 / 音乐开关
  refreshProfile() {
    const nick = wx.getStorageSync('userNickname') || DEFAULT_NICK;
    this.setData({
      nickname: nick,
      avatarText: nick.charAt(0),
      loggedIn: !!app.globalData.openid,
      bgmOn: !!app.globalData.bgmEnabled
    });
  },

  // 三条人物线「我的角色」卡片列表（逻辑在 utils/player-card.js，页面只负责渲染与跳转）：
  //   每张卡四态 —— none 创建 / draft 确认 / confirmed 编辑 / invalid 修复。
  //   各线档案独立（playerProfiles.dufu / libai / sushi），互不串名。
  refreshRoleCards() {
    const cards = ROLE_LINES.map((lineId) => {
      const line = stories.getLine(lineId);
      const lineName = (line && line.name) || lineId;
      const base = playerCard.resolveRoleCard(
        progress.getPlayerProfile(lineId),
        progress.hasInvalidPlayerProfile(lineId)
      );
      return Object.assign({ lineId, lineName, portraitImage: '' }, base);
    });
    this.setData({ roleCards: cards });
    cards.forEach((c) => {
      if (c.portraitKey) this._resolveRoleCardPortrait(c.lineId, c.portraitKey);
    });
  },

  // 角色卡外观缩略图（异步解析云端链接；失败保持空 → 渲染占位剪影）
  // 迟到结果按 lineId + portraitKey 双重比对，换角色/换线后旧图不会盖到别的卡。
  _resolveRoleCardPortrait(lineId, portraitKey) {
    const path = playerPortrait.portraitPathOfKey(portraitKey);
    if (!path) return;
    assets.resolvePaths([path]).then((map) => {
      const url = map[path] || '';
      if (!url) return;
      const cards = this.data.roleCards.map(c => (
        c.lineId === lineId && c.portraitKey === portraitKey
          ? Object.assign({}, c, { portraitImage: url })
          : c
      ));
      this.setData({ roleCards: cards });
    });
  },

  // 进入统一角色页：只有 confirmed 走编辑，其余（无／草稿／损坏）走创建-确认流程。
  // 目标白名单由 player-guard 校验，本页不拼任意路径；点击时把对应 lineId 传给角色页。
  onRoleCardTap(e) {
    const lineId = e.currentTarget.dataset.lineId;
    if (!lineId) return;
    const card = (this.data.roleCards || []).find(c => c.lineId === lineId);
    wx.navigateTo({
      url: guard.buildPlayerUrl({ lineId, target: 'profile', edit: !!(card && card.editable) })
    });
  },

  // 旅程完成统计（只供顶部「学习成果」汇总，不再在本页重复展示进度列表）
  buildProgress() {
    return stories.getOnlineLines().map((line) => {
      // 地点模式（三线通用）：按地点数计数；时期模式按时期计数
      if (line.narrativeMode === 'location') {
        const locations = stories.getLocations(line.id);
        const order = locations.map(l => l.id);
        const states = progress.computeLocationStates(line.id, order);
        const completed = order.filter(id => states[id] === 'completed').length;
        return { completed, total: locations.length };
      }
      const periods = line.periods || [];
      const order = periods.map(p => p.id);
      const states = progress.computeStates(line.id, order);
      const completed = order.filter(id => states[id] === 'completed').length;
      return {
        completed,
        total: periods.length
      };
    });
  },

  // 各人物知识锚点统计：只供顶部学习成果汇总，具体印记统一在「诗笺」页查看。
  buildAnchors() {
    return stories.getOnlineLines().map((line) => {
      const table = line.anchors || {};
      const mine = progress.getAnchors(line.id);
      const ids = Object.keys(table);
      const collected = ids.filter(id => !!mine[id]).length;
      return {
        total: ids.length,
        collected
      };
    }).filter((group) => group.total > 0);
  },

  // 学习成果总览（汇总所有人物）
  buildSummary(lp, la) {
    return {
      lines: lp.length,
      completed: lp.reduce((s, x) => s + x.completed, 0),
      total: lp.reduce((s, x) => s + x.total, 0),
      anchorsGot: la.reduce((s, x) => s + x.collected, 0),
      anchorsTotal: la.reduce((s, x) => s + x.total, 0)
    };
  },

  // 修改昵称
  onEditNickname() {
    wx.showModal({
      title: '改个称呼',
      editable: true,
      placeholderText: this.data.nickname,
      confirmColor: '#8b5a2b',
      success: (res) => {
        const name = res.confirm && res.content ? res.content.trim() : '';
        if (name) {
          const short = name.slice(0, 12);
          wx.setStorageSync('userNickname', short);
          this.setData({ nickname: short, avatarText: short.charAt(0) });
        }
      }
    });
  },

  // 背景音乐开关
  onToggleBgm(e) {
    const on = e.detail.value;
    app.setBgmEnabled(on);
    this.setData({ bgmOn: on });
  },

  // 关于：跳转正式的「关于」页（版本号 + 备案号公示 + AI 生成内容标识）
  onAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  // 打开《隐私政策》：调微信官方接口展示《用户隐私保护指引》
  onOpenPrivacy() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        fail: (err) => console.warn('[profile] 打开隐私政策失败', err)
      });
    } else {
      wx.navigateTo({ url: '/pages/agreement/agreement' });
    }
  },

  // 清除旅程成果（本地与云端同步清除，不动账号和昵称）
  onResetProgress() {
    wx.showModal({
      title: '重新开始',
      content: '将清除全部旅程进度、知识锚点、诗笺记录与三条人物线的角色资料，并从第一程重新出发。账号和昵称不会受到影响。确定吗？',
      confirmColor: '#8b5a2b',
      success: async (res) => {
        if (!res.confirm) return;
        // 暂停同步 → 等待在途保存结束 → 清本地（含三条线角色资料）→ 清云端 → 恢复同步。
        // （服务端合并是"只增不减"的，必须走 clearState 才能清掉云端，避免下次拉取回填）
        await sync.resetProgress();
        const lp = this.buildProgress();
        const la = this.buildAnchors();
        this.setData({
          summary: this.buildSummary(lp, la)
        });
        // 角色资料一并清空：卡片必须立刻回到「尚未创建」，否则会显示已删除的角色
        if (this.data.showRoleSection) this.refreshRoleCards();
        wx.showToast({ title: '已重新开始', icon: 'success' });
      }
    });
  },

  // 删除当前微信身份对应的全部云端学习档案，并清除本地数据。
  onDeleteAccount() {
    if (this.data.deletingAccount) return;
    if (!app.globalData.openid) {
      wx.showToast({ title: '当前没有已同步的学习档案', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '删除学习档案',
      content: '这将永久删除云端学习档案，并清除本机昵称、旅程进度、知识锚点、诗笺、三条人物线的角色资料和设置。删除后无法恢复，确定继续吗？',
      confirmText: '确认删除',
      confirmColor: '#a33a32',
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ deletingAccount: true });
        wx.showLoading({ title: '正在删除', mask: true });
        let cloudDeleted = false;

        try {
          const deleted = await sync.deleteAccount();
          if (!deleted) throw new Error('云端删除未完成');
          cloudDeleted = true;

          // 云端删除成功后再清理本机，避免给用户造成已删除但云端仍保留的误解。
          wx.clearStorageSync();
          app.stopBgm();
          Object.assign(app.globalData, {
            openid: null,
            agreementAccepted: false,
            ageConfirmed: false,
            userInfo: null,
            isNewUser: false,
            bgmEnabled: true,
            poemFocus: null,
            storyFocus: null,
            _bgmUrl: '',
            _bgmUrlAt: 0,
            videoCache: {}
          });

          wx.hideLoading();
          this.setData({ deletingAccount: false, loggedIn: false });
          // 首页封面已从 tabBar 移除，删除档案后回到冷启动封面（重新走勾选协议流程）
          wx.reLaunch({
            url: '/pages/index/index',
            success: () => wx.showToast({ title: '学习档案已删除', icon: 'success' })
          });
        } catch (err) {
          // 删除失败时恢复同步，保留本地和云端数据，允许用户稍后重试。
          // 若云端已经删除，绝不重新启动同步，以免把用户文档重新创建出来。
          if (!cloudDeleted) {
            try { sync.init(); } catch (e) {}
          }
          wx.hideLoading();
          this.setData({ deletingAccount: false });
          wx.showModal({
            title: cloudDeleted ? '云端档案已删除' : '删除未完成',
            content: cloudDeleted
              ? '云端学习档案已删除，但本机数据清理遇到异常。请在微信中清理本小程序缓存。'
              : '暂时无法删除云端学习档案，请检查网络后重试。',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      }
    });
  }
});
