// pages/profile/profile.js —— 我的（昵称可改 + 学习总览 + 设置：音乐开关/关于/清进度）
// 登录说明：已静默登录（wx.login 换 openid），无需注册流程；此处只展示登录状态
const stories = require('../../utils/stories/index');
const progress = require('../../utils/progress');
const app = getApp();

const DEFAULT_NICK = '少年史官';

Page({
  data: {
    nickname: DEFAULT_NICK,   // 用户昵称（本地缓存，可改）
    avatarText: '少',          // 头像显示昵称首字
    loggedIn: false,           // 是否已静默登录
    bgmOn: true,               // 背景音乐开关
    summary: { lines: 0, completed: 0, total: 0, anchorsGot: 0, anchorsTotal: 0 },
    lineProgress: [],          // 每条可玩主线的进度卡
    lineAnchors: []            // 每条主线的知识锚点集卡
  },

  onShow() {
    this.refreshProfile();
    const lp = this.buildProgress();
    const la = this.buildAnchors();
    this.setData({
      lineProgress: lp,
      lineAnchors: la,
      summary: this.buildSummary(lp, la)
    });
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

  // 各主线进度（与剧本页同源：走统一存储层，按主线分组，李杜不再串号）
  buildProgress() {
    return stories.getOnlineLines().map(line => {
      const periods = line.periods || [];
      const order = periods.map(p => p.id);
      const states = progress.computeStates(line.id, order);
      const completed = order.filter(id => states[id] === 'completed').length;
      const active = periods.find(p => states[p.id] === 'active');
      return {
        id: line.id,
        name: line.name,
        tagline: line.tagline || '',
        completed,
        total: periods.length,
        percent: periods.length ? Math.round(completed / periods.length * 100) : 0,
        nextName: active ? active.name : '',
        allDone: periods.length > 0 && completed === periods.length
      };
    });
  },

  // 各主线知识锚点集卡
  buildAnchors() {
    return stories.getOnlineLines().map(line => {
      const table = line.anchors || {};
      const mine = progress.getAnchors(line.id);
      const cards = Object.keys(table).map(id => ({
        id,
        name: table[id],
        collected: !!mine[id]
      }));
      return {
        storyId: line.id,
        name: line.name,
        total: cards.length,
        collected: cards.filter(c => c.collected).length,
        cards
      };
    }).filter(g => g.cards.length > 0);
  },

  // 学习总览（汇总所有主线）
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

  // 打开「我的诗笺」（通关产出的诗笺卡）
  onOpenPoem() {
    wx.navigateTo({ url: '/pages/poem/poem' });
  },

  // 关于
  onAbout() {
    wx.showModal({
      title: '寻迹 · 古今',
      content: '一款让历史人物"活"过来的 AI 对话学习小程序。\n循一卷诗书，赴一场千年之约。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#8b5a2b'
    });
  },

  // 清除本地进度（只清进度与锚点缓存，不动云端、不动账号）
  onResetProgress() {
    wx.showModal({
      title: '重新开始',
      content: '将清除本机的通关进度与已收集的知识锚点，从第一时期重新出发。确定吗？',
      confirmColor: '#8b5a2b',
      success: (res) => {
        if (!res.confirm) return;
        // 走统一存储层：一次清掉进度、锚点、探究档案
        progress.resetAll();
        const lp = this.buildProgress();
        const la = this.buildAnchors();
        this.setData({
          lineProgress: lp,
          lineAnchors: la,
          summary: this.buildSummary(lp, la)
        });
        wx.showToast({ title: '已重新开始', icon: 'success' });
      }
    });
  }
});
