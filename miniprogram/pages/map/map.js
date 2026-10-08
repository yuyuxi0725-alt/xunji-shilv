// pages/map/map.js —— 行迹地图（可点亮）
//
// 设计意图（docs/参赛行动方案.md P1-3）：
//   一张中国水墨风格地图，标出杜甫 / 李白一生的地点；每通关一期，
//   对应路线水墨晕开、点亮一段；点击地点看该地发生的事 + 相关诗作。
//
// 关键实现约定：
//   1) 不引入任何外部地图 SDK（需要 key，审核麻烦）；底图走云存储，
//      取不到就优雅降级为纯 CSS 绘制的水墨示意布局——没有底图也不报错、不空白。
//   2) 状态一律走统一存储层 utils/progress.js，本页不直接读写 storage。
//   3) 地点数据来自 utils/journey.js，坐标是容器百分比（见该文件头注释）。
//   4) 图片路径由 utils/cloudAssets.js 解析成云链接后再 setData（本地无大图）。

const stories = require('../../utils/stories/index');
const progress = require('../../utils/progress');
const journey = require('../../utils/journey');
const assets = require('../../utils/cloudAssets');

// 章节中文序号（与剧本页保持一致）
const INDEX_CHARS = { p1: '壹', p2: '贰', p3: '叁', p4: '肆', p5: '伍', p6: '陆' };

// 未通关地点的文案（不剧透）
const LOCKED_NOTE = '尚未走到此处——先完成前面的路程，这里的故事才会显影。';

Page({
  data: {
    lines: [],              // 顶部切换条：[{ id, name }]
    currentLineId: '',
    currentLine: null,      // { id, name, tagline, caption }
    waypoints: [],          // 地点（含 state / 场景图 / 该期锚点战绩）
    segments: [],           // 路线线段（已算好 px 几何）
    stageW: 0,              // 地图容器宽（px，用于精确计算连线角度）
    stageH: 0,              // 地图容器高（px）
    mapImage: '',           // 底图云链接（空 = 走 CSS 降级）
    litCount: 0,
    total: 0,
    progressPercent: 0,
    card: { show: false }
  },

  onLoad(query) {
    this._firstShow = true;

    // 计算地图容器尺寸：宽 = 屏宽 - 两侧留白（与 wxss 的 24rpx 对应）
    let info = {};
    try {
      info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    } catch (e) {
      info = {};
    }
    const winW = (info && info.windowWidth) || 375;
    const stageW = Math.max(240, winW - (winW * 48) / 750);
    const stageH = Math.round(stageW / journey.MAP_ASPECT);

    // 只列出「有行迹数据」的可玩主线
    const lines = stories.getOnlineLines()
      .filter(l => !!journey.getLine(l.id))
      .map(l => ({ id: l.id, name: l.name }));

    const q = query || {};
    const wantId = (q.lineId && journey.getLine(q.lineId)) ? q.lineId : '';
    const firstId = wantId || (lines[0] && lines[0].id) || '';

    this.setData({ stageW, stageH, lines });
    this.resolveMapImage();
    this.loadLine(firstId);
  },

  onShow() {
    // 首次 onShow 紧随 onLoad，跳过以免重复加载；之后从对话页返回时刷新点亮状态
    if (this._firstShow) {
      this._firstShow = false;
      return;
    }
    if (this.data.currentLineId) this.loadLine(this.data.currentLineId);
  },

  // 底图：云存储解析；取不到就保持空字符串 → 页面自动走 CSS 水墨降级
  resolveMapImage() {
    const p = journey.MAP_IMAGE;
    assets.resolvePaths([p]).then((map) => {
      this.setData({ mapImage: map[p] || '' });
    }).catch(() => {
      this.setData({ mapImage: '' });
    });
  },

  onMapLoad() {
    // 底图加载成功，无需额外处理（降级层已因 mapImage 非空而不渲染）
  },

  onMapError(e) {
    console.warn('[map] 底图加载失败，已降级为 CSS 水墨示意布局', journey.MAP_IMAGE, e && e.detail);
    this.setData({ mapImage: '' });
  },

  // 加载某条主线的行迹
  loadLine(lineId) {
    const line = stories.getLine(lineId);
    const jLine = journey.getLine(lineId);
    if (!line || !jLine) return;

    const periods = line.periods || [];
    const states = progress.computeStates(lineId, periods.map(p => p.id));
    const periodMap = {};
    periods.forEach((p) => { periodMap[p.id] = p; });
    const sceneSets = line.sceneSets || {};

    // 把每个地点翻译成渲染用的对象
    const raw = jLine.waypoints.map((w, i) => {
      const p = periodMap[w.periodId] || {};
      const state = states[w.periodId] || 'locked';
      const rec = (state === 'locked' ? null : progress.getRecord(lineId, w.periodId)) || {};
      const scenePath = (sceneSets[w.periodId] && sceneSets[w.periodId][w.sceneKey])
        || (line.scenes && line.scenes[w.periodId])
        || '';
      return {
        k: lineId + '-' + w.periodId + '-' + i,
        idx: i,
        name: w.name,
        x: w.x,
        y: w.y,
        lp: w.lp || 'bottom',
        note: w.note,
        poem: w.poem || p.poem || '',
        poemTitle: w.poemTitle || '',
        periodId: w.periodId,
        periodName: p.name || '',
        range: p.range || '',
        indexChar: INDEX_CHARS[w.periodId] || '',
        state,
        scenePath,
        anchorLit: (rec.anchors || []).length,
        anchorTotal: rec.anchorTotal || 0,
        completedAt: rec.completedAt || 0
      };
    });

    const segs = this.buildSegments(raw);

    // 场景图已迁移云存储 → 换临时链接后再渲染（有全局缓存）
    assets.resolvePaths(raw.map(w => w.scenePath).filter(Boolean)).then((map) => {
      const waypoints = raw.map(w => Object.assign({}, w, {
        scene: (w.scenePath && map[w.scenePath]) || ''
      }));
      const litCount = waypoints.filter(w => w.state === 'completed').length;
      this.setData({
        currentLineId: lineId,
        currentLine: {
          id: line.id,
          name: line.name,
          tagline: line.tagline || '',
          caption: jLine.caption || ''
        },
        waypoints,
        segments: segs,
        litCount,
        total: waypoints.length,
        progressPercent: waypoints.length ? Math.round((litCount * 100) / waypoints.length) : 0
      });
    });
  },

  // 相邻地点之间连一条水墨路线（几何在 JS 里算好，保证旋转角度精确）
  buildSegments(list) {
    const W = this.data.stageW;
    const H = this.data.stageH;
    const out = [];
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      let cls = 'seg-locked';
      if (a.state === 'completed' && b.state === 'completed') cls = 'seg-lit';
      else if (a.state === 'completed' && b.state === 'active') cls = 'seg-next';

      const x1 = (a.x / 100) * W;
      const y1 = (a.y / 100) * H;
      const x2 = (b.x / 100) * W;
      const y2 = (b.y / 100) * H;
      const dx = x2 - x1;
      const dy = y2 - y1;
      out.push({
        k: 'seg' + i,
        left: Math.round(x1 * 10) / 10,
        top: Math.round(y1 * 10) / 10,
        width: Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10,
        angle: Math.round((Math.atan2(dy, dx) * 180 * 10) / Math.PI) / 10,
        cls
      });
    }
    return out;
  },

  // 切换古人
  onSwitchLine(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || id === this.data.currentLineId) return;
    this.setData({ card: { show: false } });
    this.loadLine(id);
  },

  // 点击地点 → 古风卡片
  onWpTap(e) {
    const k = e.currentTarget.dataset.k;
    const w = (this.data.waypoints || []).find(x => x.k === k);
    if (!w) return;
    const line = this.data.currentLine || {};
    const stateText = w.state === 'completed' ? '已走过'
      : (w.state === 'active' ? '正在此间' : '尚未抵达');
    this.setData({
      card: {
        show: true,
        k: w.k,
        name: w.name,
        lineId: this.data.currentLineId,
        lineName: line.name || '',
        periodId: w.periodId,
        periodName: w.periodName,
        range: w.range,
        indexChar: w.indexChar,
        state: w.state,
        stateText,
        note: w.state === 'locked' ? LOCKED_NOTE : w.note,
        poem: w.poem,
        poemTitle: w.poemTitle,
        scene: w.scene || '',
        anchorLit: w.anchorLit,
        anchorTotal: w.anchorTotal,
        canEnter: w.state !== 'locked'
      }
    });
  },

  onCloseCard() {
    this.setData({ 'card.show': false });
  },

  // 卡片上的空点击（阻止冒泡到遮罩）
  noop() {},

  // 进入这一程（对话页）
  goPeriod() {
    const c = this.data.card;
    if (!c || !c.canEnter) {
      wx.showToast({ title: '先完成前面的时期', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/chat/chat?storyId=${c.lineId}&questId=${c.periodId}`
    });
  },

  // 看这一程的诗笺（定位到该时期那张）
  goPoemPeriod() {
    const c = this.data.card;
    wx.navigateTo({
      url: `/pages/poem/poem?lineId=${c.lineId}&periodId=${c.periodId}`
    });
  },

  // 我的诗笺（全部）
  goPoemAll() {
    wx.navigateTo({ url: '/pages/poem/poem' });
  }
});
