// pages/story/story.js —— 剧本首页（多主线选择 → 选线后进入该线时期列表）
const stories = require('../../utils/stories/index');
const assets = require('../../utils/cloudAssets');
const progress = require('../../utils/progress');

// 章节中文序号
const INDEX_CHARS = { p1: '壹', p2: '贰', p3: '叁', p4: '肆', p5: '伍', p6: '陆' };

Page({
  data: {
    // 视图：lines = 多主线选择页；periods = 某条线的时期列表
    view: 'lines',
    currentLine: null,
    lines: [],
    periods: [],
    loading: true,
    completedCount: 0,
    progressPercent: 0
  },

  onLoad() {
    this.loadLines();
  },

  onShow() {
    // 回到剧本页时刷新当前视图的状态
    if (this.data.view === 'periods') {
      this.loadState();
    } else {
      this.loadLines();
    }
  },

  // 加载多主线列表
  loadLines() {
    const rawLines = stories.getAllLines().map(l => ({
      id: l.id,
      name: l.name,
      tagline: l.tagline,
      status: l.status,
      cover: l.cover,
      periodCount: (l.periods || []).length
    }));
    // 封面图已迁移云存储，换临时链接后再渲染（有全局缓存）
    assets.resolvePaths(rawLines.map(l => l.cover)).then((map) => {
      const lines = rawLines.map(l => Object.assign({}, l, { cover: map[l.cover] || l.cover }));
      this.setData({ view: 'lines', lines, loading: false });
    });
  },

  // 点击某条主线 → 进入该线时期列表
  onLineTap(e) {
    const { id, status } = e.currentTarget.dataset;
    if (status === 'coming') {
      wx.showToast({ title: '敬请期待', icon: 'none' });
      return;
    }
    const line = stories.getLine(id);
    if (!line) return;
    this.setData({ currentLine: line, view: 'periods' });
    this.loadState();
  },

  // 返回主线列表
  backToLines() {
    this.setData({ view: 'lines', currentLine: null });
  },

  // 加载某条线的时期列表
  loadPeriods() {
    const line = this.data.currentLine;
    if (!line) return;

    // 该线各时期状态（走统一存储层：按主线分组，李杜不再串号）
    const order = (line.periods || []).map(p => p.id);
    const states = progress.computeStates(line.id, order);
    const periods = (line.periods || []).map(p => ({
      id: p.id,
      name: p.name,
      range: p.range,
      desc: p.desc,
      index: INDEX_CHARS[p.id] || '',
      scene: (line.sceneSets && line.sceneSets[p.id] && Object.values(line.sceneSets[p.id])[0]) || (line.scenes && line.scenes[p.id]) || line.cover || '',
      poem: p.poem || '',
      state: states[p.id] || 'locked'
    }));

    const completedCount = periods.filter(p => p.state === 'completed').length;
    // 时期卡场景图已迁移云存储，换临时链接后再渲染
    assets.resolvePaths(periods.map(p => p.scene)).then((map) => {
      const resolved = periods.map(p => Object.assign({}, p, { scene: map[p.scene] || p.scene }));
      this.setData({
        periods: resolved,
        loading: false,
        completedCount,
        progressPercent: periods.length ? Math.round((completedCount / periods.length) * 100) : 0
      });
    });
  },

  // 刷新进度状态
  loadState() {
    this.loadPeriods();
  },

  // 点击时期 → 进入对话页（带 storyId 参数）
  onPeriodTap(e) {
    const { id, state } = e.currentTarget.dataset;
    if (state === 'locked') {
      wx.showToast({ title: '完成前一时期后解锁', icon: 'none' });
      return;
    }
    const lineId = this.data.currentLine.id;
    wx.navigateTo({
      url: `/pages/chat/chat?storyId=${lineId}&questId=${id}`
    });
  }
});
