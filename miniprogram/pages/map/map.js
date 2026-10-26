// pages/map/map.js —— 行迹地图（可点亮 + 语义缩放 + 地点去重）
//
// 设计意图（docs/参赛行动方案.md P1-3）：
//   一张中国水墨风格地图，标出杜甫 / 李白一生的地点；每通关一期/一地，
//   对应路线水墨晕开、点亮一段；点击地点看该地发生的事 + 相关诗作。
//
// 本版重构要点（「行迹地图」改造）：
//   1) 「地理地点(place)」与「人生到访(visit)」拆成两层。
//      rawVisits 保留每一次到访（seq / locationId / periodId / 剧情 / 状态独立），
//      路线按 rawVisits 原始顺序计算（不按去重后的地点算）；
//      mapPlaces 按显式 placeId 聚合，用于渲染地图锚点（同名真实地点只出现一次）。
//      没有 placeId 的 visit 用自身唯一 key 兜底，禁止模糊名称合并。
//   2) 语义缩放（mapZoomLevel）：overview / status / detail / poem 四级，
//      由 mapScale 计算，WXML 据此控制内容显隐，不依赖纯 CSS 等比放大。
//   3) 首屏只显示「编号 + 地名 + 简化路线」；副标题/年代/诗句/诗笺/印章等
//      按倍率逐层展开。
//   4) 紧凑组合标签：编号(状态色) + 半透明宣纸地名，横向排列，点击热区 ≥60rpx。
//      当前地点用细描边/轻微光晕，不再叠「行」字印章。
//   5) 手势保留：单指拖动、双指缩放(1–3)、双击复位、地点点击、剧情进入、进度系统。
//
// 关键实现约定：
//   - 不引入外部地图 SDK；朝代底图使用本地可追溯资源，取不到时降级为纯 CSS 示意。
//   - 状态统一走 utils/progress.js，本页不直接读写 storage。
//   - 双轨：杜甫/李白/苏轼均走「地点模式」(narrativeMode='location')；
//           时期模式保留为兼容回退（loadPeriodLine）。

const stories = require('../../utils/stories/index');
const progress = require('../../utils/progress');
const journey = require('../../utils/journey');
const geography = require('../../utils/map-geography');
const assets = require('../../utils/cloudAssets');
const guard = require('../../utils/player-guard');
const playerCard = require('../../utils/player-card');
const playMode = require('../../utils/play-mode');

// 章节中文序号（与剧本页保持一致）
const INDEX_CHARS = { p1: '壹', p2: '贰', p3: '叁', p4: '肆', p5: '伍', p6: '陆' };

// 未通关地点的文案（不剧透）
const LOCKED_NOTE = '尚未解锁此处——先完成前面的路程，这里的故事才会显影。';

// 语义缩放阈值（与 mapScale 对应，见 docs 语义缩放规则）
const ZOOM = {
  OVERVIEW: 1.4,   // < 1.4    完整地图，仅编号+地名+简化路线
  STATUS: 1.8,     // 1.4–1.8  地点状态、突出当前地点、增强路线方向
  DETAIL: 2.3,     // 1.8–2.3  副标题/年代/阶段、多次到访编号可展开
  POEM: 2.3        // >= 2.3   选中地点展开诗笺（一次一个）
};
const MAX_SCALE = 4; // 手势/聚焦缩放上限（原 3，地点密集区需更大倍率看清）

Page({
  data: {
    lines: [],              // 顶部切换条：[{ id, name }]
    currentLineId: '',
    currentLine: null,      // { id, name, tagline, caption }
    places: [],             // 地图锚点（按 placeId 聚合，含 visits[]/visitSeqs）
    segments: [],           // 路线线段（已算好 px 几何，按 rawVisits 原始顺序）
    stageW: 0,              // 地图容器宽（px，用于精确计算连线角度）
    stageH: 0,              // 地图容器高（px，含底部安全区）
    mapH: 0,                // 坐标换算基准高度（px，y 百分比映射到这里，底图/路线/圆点按它渲染）
    mapImage: '',           // 共用自然地理底图（真机兼容 JPG；空 = 走 CSS 降级）
    mapOverlay: '',         // 当前朝代疆界透明层（PNG，与底图同投影）
    mapImagePath: '',       // 原始资源路径，用于错误日志
    mapOverlayPath: '',     // 原始疆界层路径，用于错误日志
    mapEra: '',             // 唐代舆图 / 北宋舆图
    mapEraNote: '',         // 放大后显示的史料与地理数据口径
    litCount: 0,
    total: 0,               // 到访总数（原始 visits，非去重后地点数）
    completedCount: 0,
    periodTotal: 0,
    progressPercent: 0,
    currentJourney: null,   // 当前已解锁但尚未通关的一程（统一剧情入口）
    allDone: false,
    periodReviews: [],      // 已完成的程（每程只提供一个诗笺入口）
    // 地点模式：当前活动地点 + 是否地点模式
    isLocationMode: false,
    currentLocation: null,  // { locationId, name, subtitle, playerName, ... }
    playerName: '',         // 同行者姓名（当前人物线且有已确认角色时非空）
    totalChar: '',          // 行迹总数的中文写法（如「二十二」），渲染时由 _zhNum 生成
    // 地图缩放/平移状态
    mapScale: 1,            // 缩放倍率（1–4）
    mapTx: 0,               // 平移 X（px）
    mapTy: 0,               // 平移 Y（px）
    mapScaleText: '1.0×',
    mapAnim: 'none',        // 聚焦/复位动画过渡（临时开启，动画后关闭，避免手势拖动抖动）
    zoomLevel: 'overview',  // 语义缩放级别：overview|status|detail|poem
    // 选中展开（poem 层 / detail 层多次到访展开）
    selectedPlaceId: '',    // 当前选中的地理地点 id
    selectedVisitId: '',    // 当前选中的到访 id（detail 层多访展开）
    poemNodes: [],          // 预留：选中地点的诗笺节点结构（当前数据未接完整诗笺）
    card: { show: false },
    cityCard: { show: false, name: '', members: [] }   // 多次到访「行迹卡」
  },

  onLoad(query) {
    this._firstShow = true;
    // 手势缩放：触摸记录（实例属性，不渲染）
    this._touchMode = '';       // 'drag' 单指拖动 | 'pinch' 双指缩放
    this._lastSingle = null;    // 单指：{ x, y, tx, ty }
    this._lastPinch = null;     // 双指：{ dist, scale, cx, cy, tx, ty }
    this._doubleTapAt = 0;      // 双击复位判定
    this._pendingMapFocus = null; // 待聚焦下一地点 { lineId, locationId, action }
    this._focusAnimTimer = null;  // 聚焦动画结束计时器

    // 计算地图容器尺寸：宽 = 屏宽 - 两侧留白（与 wxss 的 24rpx 对应）
    let info = {};
    try {
      info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    } catch (e) {
      info = {};
    }
    const winW = (info && info.windowWidth) || 375;
    const stageW = Math.max(240, winW - (winW * 48) / 750);
    // mapH = 坐标换算基准高度（y 百分比映射到 mapH）；stageH = 实际容器高度，
    // 底部额外预留 SAFE_BOTTOM 安全区，保证正下方标签不被裁切。
    const mapH = Math.round(stageW / journey.MAP_ASPECT);
    const safeBottom = Math.round((stageW / 750) * 56);   // 约 56rpx 底部安全区
    const stageH = mapH + safeBottom;

    this._mapH = mapH;

    // 只列出「有行迹数据」的可玩主线
    const lines = stories.getOnlineLines()
      .filter(l => l.narrativeMode === 'location' || !!journey.getLine(l.id))
      .map(l => ({ id: l.id, name: l.name }));

    const q = query || {};
    // 目标线来源优先级：URL query.lineId > 全局 mapFocus.lineId（选人页/对话页跳转时写入）
    const focusId = this._consumeMapFocusLine();
    const wantId = (q.lineId && (stories.getLine(q.lineId) && (
      stories.getLine(q.lineId).narrativeMode === 'location' || journey.getLine(q.lineId)
    ))) ? q.lineId : focusId;
    const firstId = wantId || (lines[0] && lines[0].id) || '';

    this.setData({ stageW, stageH, mapH, lines });
    this.loadLine(firstId);
  },

  onShow() {
    // 首次 onShow 紧随 onLoad，跳过以免重复加载；之后从对话页返回时刷新点亮状态
    if (this._firstShow) {
      this._firstShow = false;
      return;
    }
    // 优先响应全局 mapFocus（选人页/对话页跳转时写入的目标线），否则刷新当前线
    const focusId = this._consumeMapFocusLine();
    if (focusId && focusId !== this.data.currentLineId) {
      this.loadLine(focusId);
      return;
    }
    if (this.data.currentLineId) this.loadLine(this.data.currentLineId);
  },

  // 取出并清除全局 mapFocus（消费后置空，与 storyFocus/poemFocus 模式一致，
  // 避免残留导致下次 onShow 误切回旧线）。返回目标线 id。
  // 注意：mapFocus 可能携带 locationId + action（'focus-next' 聚焦下一站 / 'finale'
  // 终章恢复全图），这里完整保留到 this._pendingMapFocus，由地点数据+图片解析完成后消费。
  _consumeMapFocusLine() {
    const app = getApp && getApp();
    const focus = (app && app.globalData && app.globalData.mapFocus) || {};
    const id = focus.lineId;
    app.globalData.mapFocus = null;
    if (!id) {
      // 无聚焦目标（含重温回图不写 mapFocus）：清空待聚焦，避免残留旧值误聚焦
      this._pendingMapFocus = null;
      return '';
    }
    const target = stories.getLine(id);
    const valid = !!target && (target.narrativeMode === 'location' || !!journey.getLine(id));
    if (!valid) {
      this._pendingMapFocus = null;
      return '';
    }
    // 完整保留 locationId 与 action，供 _applyPendingFocus 在渲染完成后聚焦/复位
    this._pendingMapFocus = {
      lineId: id,
      locationId: focus.locationId || '',
      action: focus.action || ''
    };
    return id;
  },

  // 底图：三条线共用自然地理 JPG；李白/杜甫叠加唐疆界，苏轼叠加北宋疆界。
  // 分层避免在主包内重复存储同一份地形，也兼容以后迁移到云存储。
  resolveMapImage(lineId) {
    const cfg = journey.getMapConfig ? journey.getMapConfig(lineId) : {
      image: journey.MAP_IMAGE,
      era: '古代舆图',
      note: '历史疆界与自然地理均保留来源记录'
    };
    const p = cfg.image || journey.MAP_IMAGE;
    const overlay = cfg.overlay || '';
    const meta = {
      mapImagePath: p,
      mapOverlayPath: overlay,
      mapEra: cfg.era || '',
      mapEraNote: cfg.note || ''
    };
    const paths = [p, overlay].filter(Boolean);
    const cloudPaths = paths.filter(path => assets.isMigratable && assets.isMigratable(path));

    // 全部是本地资源时无需经过云函数换临时链接。
    if (!cloudPaths.length) {
      this.setData(Object.assign({}, meta, { mapImage: p, mapOverlay: overlay }));
      return;
    }

    assets.resolvePaths(cloudPaths).then((map) => {
      const resolved = path => path
        ? ((assets.isMigratable && assets.isMigratable(path)) ? (map[path] || '') : path)
        : '';
      this.setData(Object.assign({}, meta, {
        mapImage: resolved(p),
        mapOverlay: resolved(overlay)
      }));
    }).catch(() => {
      this.setData(Object.assign({}, meta, { mapImage: '', mapOverlay: '' }));
    });
  },

  onMapLoad() {},

  onMapError(e) {
    console.warn('[map] 朝代舆图加载失败，已降级为 CSS 水墨示意布局', this.data.mapImagePath, e && e.detail);
    this.setData({ mapImage: '', mapOverlay: '' });
  },

  onMapOverlayError(e) {
    console.warn('[map] 朝代疆界层加载失败，保留自然地理底图', this.data.mapOverlayPath, e && e.detail);
    this.setData({ mapOverlay: '' });
  },

  // 加载某条主线的行迹（双轨：地点模式 / 时期模式）
  loadLine(lineId) {
    const line = stories.getLine(lineId);
    if (!line) return;

    // 切换主线时重置语义缩放选中态
    this.setData({ selectedPlaceId: '', selectedVisitId: '', poemNodes: [] });
    this.resolveMapImage(lineId);

    if (line.narrativeMode === 'location') {
      this.loadLocationLine(line);
      return;
    }
    this.loadPeriodLine(line);
  },

  // ===== 地点模式（三线通用） =====
  loadLocationLine(line) {
    const lineId = line.id;
    const locations = stories.getLocations(lineId);
    if (!locations.length) return;

    const order = locations.map(l => l.id);
    const states = progress.computeLocationStates(lineId, order);
    const keyIds = line.locationKeyIds || [];
    const sceneSets = line.locationSceneSets || {};
    const records = progress.getAllLocationRecords();
    const lineRecords = records[lineId] || {};

    // 当前活动地点（有且只有一个 active）
    const activeLoc = locations.find(l => states[l.id] === 'active') || null;

    // rawVisits：每一次到访独立成一条（顺序 = locations 的 order）
    const rawVisits = locations.map((l, i) => {
      const state = states[l.id] || 'locked';
      const isKey = keyIds.indexOf(l.id) >= 0;
      const rec = lineRecords[l.id] || {};
      const locSets = sceneSets[l.id] || {};
      const scenePath = locSets[l.sceneKey] || '';
      const geo = geography.getVisitPoint(lineId, l);
      return {
        visitId: l.id,                // 到访唯一 id
        locationId: l.id,             // 地点模式专用：进入剧情用 locationId（时期模式为 ''）
        seq: l.order,                 // 序号 = 生平时间顺序（1 起）
        placeId: l.placeId || l.id,   // 地理地点 id：显式 placeId 优先，否则自身 id 兜底（不模糊合并）
        name: l.name,
        subtitle: l.subtitle || '',
        range: l.range || '',
        x: geo ? geo.x : l.x,
        y: geo ? geo.y : l.y,
        longitude: geo ? geo.lon : null,
        latitude: geo ? geo.lat : null,
        geographyBasis: geo ? geo.basis : '兼容旧坐标（待校准）',
        lp: l.labelPosition || 'bottom',
        periodId: l.periodId || '',
        npcStage: l.npcStage || '',   // 当前地点所属时期（用于头像换脸）
        note: l.knowledge || '',
        poem: l.poemLine || '',
        poemTitle: l.poemTitle || '',
        importance: l.importance || 'normal',
        isKey,
        state,
        isCurrent: state === 'active',
        scenePath,
        anchorLit: (rec.anchors || []).length,
        anchorTotal: rec.anchorTotal || 0,
        completedAt: rec.completedAt || 0
      };
    });

    // 同行者（当前人物线、且有已确认角色时显示）：
    // 只放进「当前行迹」这张已有的卡里，不新增常驻组件，避免遮挡地图与小屏操作。
    // 判定在 utils/player-card.js（按 line.id 读各自档案，各线互不串名）。
    const playerName = playerCard.companionName(line.id, progress.getPlayerProfile(line.id));

    this._buildPlaces(line, rawVisits, {
      caption: this._locationCaption(locations.length),
      playerName,
      currentLocation: activeLoc ? {
        locationId: activeLoc.id,
        name: activeLoc.name,
        subtitle: activeLoc.subtitle || '',
        range: activeLoc.range || '',
        isKey: keyIds.indexOf(activeLoc.id) >= 0,
        playerName
      } : null
    });
  },

  // 地点模式的副标题：按地点数动态生成（杜甫 22 / 李白 20 / 苏轼 22）
  _locationCaption(count) {
    return '循着' + this._zhNum(count) + '处行迹，走完他的一生。';
  },

  // 数字 → 中文（1–30），供行迹总数等文案动态显示
  _zhNum(count) {
    const zh = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'];
    return zh[count] || String(count);
  },

  // ===== 时期模式（李白/苏轼） =====
  loadPeriodLine(line) {
    const lineId = line.id;
    const jLine = journey.getLine(lineId);
    if (!jLine) return;

    const periods = line.periods || [];
    const states = progress.computeStates(lineId, periods.map(p => p.id));
    const periodMap = {};
    periods.forEach((p) => { periodMap[p.id] = p; });
    const sceneSets = line.sceneSets || {};

    // rawVisits：每个时期地点独立成一条（顺序 = waypoints 数组顺序）
    const rawVisits = jLine.waypoints.map((w, i) => {
      const p = periodMap[w.periodId] || {};
      const state = states[w.periodId] || 'locked';
      const rec = (state === 'locked' ? null : progress.getRecord(lineId, w.periodId)) || {};
      const scenePath = (sceneSets[w.periodId] && sceneSets[w.periodId][w.sceneKey])
        || (line.scenes && line.scenes[w.periodId])
        || '';
      const geo = geography.getVisitPoint(lineId, Object.assign({ id: w.sceneKey || (w.periodId + '-' + i) }, w));
      return {
        visitId: w.periodId + '-' + i,       // 到访唯一 id（时期模式无独立 locationId，用 period+index）
        locationId: '',                        // 时期模式无 locationId，进入剧情走 questId
        seq: i + 1,                          // 生平轨迹序号（1 起）
        placeId: w.placeId || w.periodId + '-' + i, // 显式 placeId 优先，否则自身唯一 key 兜底（不去重）
        name: w.name,
        subtitle: '',
        range: p.range || '',
        x: geo ? geo.x : w.x,
        y: geo ? geo.y : w.y,
        longitude: geo ? geo.lon : null,
        latitude: geo ? geo.lat : null,
        geographyBasis: geo ? geo.basis : '兼容旧坐标（待校准）',
        lp: w.lp || 'bottom',
        periodId: w.periodId,
        npcStage: w.periodId,        // 时期模式换脸用 periodId 命中 periodNpcImages
        periodName: p.name || '',
        indexChar: INDEX_CHARS[w.periodId] || '',
        note: w.note,
        poem: w.poem || p.poem || '',
        poemTitle: w.poemTitle || '',
        state,
        isKey: false,
        isCurrent: state === 'active',
        scenePath,
        anchorLit: (rec.anchors || []).length,
        anchorTotal: rec.anchorTotal || 0,
        completedAt: rec.completedAt || 0
      };
    });

    const activePeriod = periods.find(p => states[p.id] === 'active') || null;
    const currentJourney = activePeriod ? {
      lineId,
      periodId: activePeriod.id,
      indexChar: INDEX_CHARS[activePeriod.id] || '',
      name: activePeriod.name || '',
      range: activePeriod.range || '',
      desc: activePeriod.desc || '',
      waypointNames: journey.getPeriodWaypoints(lineId, activePeriod.id).map(w => w.name).join('、')
    } : null;

    this._buildPlaces(line, rawVisits, {
      caption: jLine.caption || '',
      currentJourney
    });
  },

  // ===== 公共：rawVisits → mapPlaces 聚合 + 路线 + 总览数据 =====
  _buildPlaces(line, rawVisits, opts) {
    const lineId = line.id;
    const isLoc = line.narrativeMode === 'location';

    // 按 placeId 聚合成 mapPlaces（同一真实地点只出现一次，保留 visits[] 与 visitSeqs[]）
    const placeMap = {};
    const places = [];
    rawVisits.forEach((v) => {
      const pid = v.placeId;
      if (!placeMap[pid]) {
        const anchor = {
          placeId: pid,
          name: v.name,
          x: v.x,
          y: v.y,
          lp: v.lp,
          visits: []
        };
        placeMap[pid] = anchor;
        places.push(anchor);
      }
      placeMap[pid].visits.push(v);
      // 路线与标签必须共用唯一地点锚点。即使旧数据里同一 placeId
      // 曾经有不同的手调 x/y，也在这里收口，彻底消除重复地点的线头漂移。
      v.x = placeMap[pid].x;
      v.y = placeMap[pid].y;
    });
    // 每个 place 派生：visitSeqs（有序编号，统一两位格式）、聚合状态、是否有多次到访
    places.forEach((p) => {
      // 统一两位编号（如 07 08 10），保证标签宽度一致、对齐紧凑
      p.visitSeqs = p.visits.map(v => String(v.seq).padStart(2, '0'));
      p.visitCount = p.visits.length;
      p.hasMultiple = p.visits.length > 1;
      // 聚合状态：completed > active > locked（用于首屏编号色）
      const rank = { locked: 0, active: 1, completed: 2 };
      p.state = p.visits.reduce((best, v) => (
        rank[v.state] > rank[best] ? v.state : best
      ), 'locked');
      p.isKey = p.visits.some(v => v.isKey);
      p.isCurrent = p.visits.some(v => v.isCurrent);
      // 首屏标签文字 = 地点名（只一行）
      p.label = p.name;
    });

    // 场景图解析（仅 detail/poem 层、单访或多访展开时用；仍预解析便于随时取用）
    const scenePaths = rawVisits.map(v => v.scenePath).filter(Boolean);
    assets.resolvePaths(scenePaths).then((map) => {
      rawVisits.forEach((v) => {
        v.scene = (v.scenePath && map[v.scenePath]) || '';
      });
      this._renderPlaces(line, rawVisits, places, opts, isLoc);
    }).catch(() => {
      this._renderPlaces(line, rawVisits, places, opts, isLoc);
    });
  },

  _renderPlaces(line, rawVisits, places, opts, isLoc) {
    const lineId = line.id;

    // 路线：始终按 rawVisits 原始顺序（不按去重后地点算）
    const segs = this.buildSegments(rawVisits);

    // 总览统计（按到访总数 rawVisits，不按去重后地点数）
    const completedCount = rawVisits.filter(v => v.state === 'completed').length;
    const periodTotal = rawVisits.length;
    const litCount = rawVisits.filter(v => v.state === 'completed').length;

    // 已完成诗笺入口（保留既有逻辑）
    const periodReviews = this._buildPeriodReviews(line, rawVisits, isLoc);

    // 当前行迹指示头像：按当前地点所在时期换脸。
    // 取 active（当前行程）visit 的 npcStage → periodNpcImages[npcStage]，
    // 取不到再回退到线默认立绘 line.portrait。
    const activeVisit = rawVisits.find(v => v.state === 'active') || null;
    const activeStage = activeVisit && (activeVisit.npcStage || activeVisit.periodId) || '';
    const periodNpc = line.periodNpcImages || {};
    const portraitPath =
      (activeStage && periodNpc[activeStage]) ||
      line.portrait ||
      line.youngPortrait ||
      line.npcImage ||
      '';
    const doRender = () => {
      const payload = {
        currentLineId: lineId,
        currentLine: {
          id: line.id,
          name: line.name,
          tagline: line.tagline || '',
          caption: opts.caption || '',
          portrait: this._portraitUrl || ''
        },
        places: this._layoutPlaces(places, this.data.mapScale),
        segments: this._scaleSegments(segs, this.data.mapScale),
        litCount,
        total: rawVisits.length,
        totalChar: this._zhNum(rawVisits.length),
        completedCount,
        periodTotal,
        progressPercent: periodTotal ? Math.round((completedCount * 100) / periodTotal) : 0,
        allDone: periodTotal > 0 && completedCount === periodTotal,
        periodReviews,
        isLocationMode: isLoc,
        // 同行者：当前人物线且已确认角色时有值；无档案时不显示该标签
        playerName: opts.playerName || '',
        currentLocation: opts.currentLocation || null,
        currentJourney: opts.currentJourney || null,
        zoomLevel: this._zoomLevelOf(this.data.mapScale),
        selectedPlaceId: '',
        selectedVisitId: '',
        poemNodes: []
      };

      this._placesRaw = places;
      this._segmentsRaw = segs;   // 未缩放的段几何原始值，缩放重排时按倍率重算
      this.setData(payload);
      // 地点数据 + 图片解析完成后，若存在待聚焦的下一地点/终章复位，则在此消费
      this._applyPendingFocus();
    };

    // 头像走云存储（/assets/images/npc/...），解析为临时链接后再渲染
    if (portraitPath) {
      assets.resolvePaths([portraitPath]).then((map) => {
        this._portraitUrl = map[portraitPath] || '';
        doRender();
      }).catch(() => {
        this._portraitUrl = '';
        doRender();
      });
    } else {
      this._portraitUrl = '';
      doRender();
    }
  },

  // 诗笺入口（地点模式每地一个；时期模式每程一个）
  _buildPeriodReviews(line, rawVisits, isLoc) {
    const lineId = line.id;
    if (isLoc) {
      const locations = stories.getLocations(lineId);
      const records = progress.getAllLocationRecords();
      const lineRecords = records[lineId] || {};
      return locations.filter(l => rawVisits.some(v => v.visitId === l.id && v.state === 'completed'))
        .map((l) => {
          const rec = lineRecords[l.id] || {};
          return {
            key: lineId + '-' + l.id,
            lineId,
            locationId: l.id,
            periodId: l.periodId,
            indexChar: INDEX_CHARS[l.periodId] || '',
            name: l.name,
            subtitle: l.subtitle || '',
            range: l.range || '',
            waypointCount: 1,
            waypointNames: l.subtitle || '',
            hasPoem: !!rec.completedAt
          };
        });
    }
    const periods = line.periods || [];
    return periods.filter(p => rawVisits.some(v => v.periodId === p.id && v.state === 'completed'))
      .map((p) => {
        const rec = progress.getRecord(lineId, p.id) || {};
        const points = journey.getPeriodWaypoints(lineId, p.id);
        return {
          key: lineId + '-' + p.id,
          lineId,
          periodId: p.id,
          indexChar: INDEX_CHARS[p.id] || '',
          name: p.name || '',
          range: p.range || '',
          waypointCount: points.length,
          waypointNames: points.map(w => w.name).join('、'),
          hasPoem: !!rec.completedAt
        };
      });
  },

  // 语义缩放级别：由 mapScale 计算
  _zoomLevelOf(scale) {
    const s = scale || 1;
    if (s < ZOOM.OVERVIEW) return 'overview';
    if (s < ZOOM.STATUS) return 'status';
    if (s < ZOOM.DETAIL) return 'detail';
    return 'poem';
  },

  // 相邻到访之间连一条水墨路线（按 rawVisits 原始顺序；几何在 JS 算好）
  buildSegments(list) {
    const W = this.data.stageW;
    const H = this._mapH || this.data.stageH;
    const out = [];
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      let cls = 'seg-locked';
      if (a.state === 'completed' && b.state === 'completed') cls = 'seg-lit';
      else if ((a.state === 'completed' && b.state === 'active')
        || (a.state === 'active' && b.state === 'active')) cls = 'seg-next';

      const x1 = (a.x / 100) * W;
      const y1 = (a.y / 100) * H;
      const x2 = (b.x / 100) * W;
      const y2 = (b.y / 100) * H;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      // 方向箭头：贴在终点（b 点）附近，箭头朝向 = 段方向角。
      // 所有段都画箭头，用颜色区分状态：已走过=实心金棕、下一步=空心朱砂、锁定=浅灰。
      const hasArrow = true;
      out.push({
        k: 'seg' + i,
        left: Math.round(x1 * 10) / 10,
        top: Math.round(y1 * 10) / 10,
        width: Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10,
        angle: Math.round(angle * 10) / 10,
        cls,
        // 箭头：位于段终点，向段内回退 6px 避免压住地点圆点
        ax: Math.round((x2 - Math.cos(angle * Math.PI / 180) * 6) * 10) / 10,
        ay: Math.round((y2 - Math.sin(angle * Math.PI / 180) * 6) * 10) / 10,
        aangle: Math.round(angle * 10) / 10,
        hasArrow
      });
    }
    return out;
  },

  // ============ 地点标签布局（固定定位，不做漂移） ============
  // 圆点固定在真实地图坐标（ox/oy），路线只连圆点；
  // 标签永远位于圆点正下方、以圆点为中心水平居中，二者保持固定间距（CSS 层控制）。
  // 不做引线、不做 offsetX/offsetY 漂移——密集区域靠字号/内边距/两位编号/路线对比度缓解。
  // 缩放语义（布局级缩放，防模糊）：圆点/标签的 left/top 在 JS 里按 s 放大后写入
  // style，文字以原生字号渲染（矢量），不做 CSS scale 反向缩放——彻底消除
  // 「位图放大再缩小」导致的标签发虚。底图（位图）仍用 transform scale。

  _layoutPlaces(places, scale) {
    const W = this.data.stageW;
    const H = this._mapH || this.data.stageH;
    if (!W || !H || !places || !places.length) return places;
    const s = Math.max(1, scale || 1);

    return places.map((p) => {
      // 圆点位置 = 真实坐标 × 缩放倍率。必须取整到整数像素：带小数的 left/top
      // 会触发亚像素抗锯齿渲染，文字发虚（此前 0.1px 精度导致部分标签模糊）
      const ox = Math.round((p.x / 100) * W * s);
      const oy = Math.round((p.y / 100) * H * s);
      return Object.assign({}, p, {
        ox,          // 圆点 X（已缩放，路线端点）
        oy,          // 圆点 Y（已缩放）
        px: ox,      // 标签 X = 圆点 X（水平居中，正下方）
        py: oy       // 标签 Y 基准 = 圆点 Y（下方偏移由 CSS 的 .wp-chip 处理）
      });
    });
  },

  // 路线段几何按缩放倍率重算（left/top 与箭头位置取整到整数像素，避免亚像素模糊；
  // width 保留 0.1px 精度——线长取整会让斜线端点出现可见跳变。角度、
  // 线宽、箭头尺寸原生不变——CSS 缩放线段会发虚，布局缩放永远锐利）
  _scaleSegments(segs, scale) {
    const s = Math.max(1, scale || 1);
    return (segs || []).map(g => Object.assign({}, g, {
      left: Math.round(g.left * s),
      top: Math.round(g.top * s),
      width: Math.round(g.width * s * 10) / 10,
      ax: Math.round(g.ax * s),
      ay: Math.round(g.ay * s)
    }));
  },

  // 按当前缩放重排标注与路线（节流，手势缩放时 32ms 一次足够顺滑）
  _refreshLayout(scale) {
    if (!this._placesRaw || !this._placesRaw.length) return;
    this._layoutAt = Date.now();
    this.setData({
      places: this._layoutPlaces(this._placesRaw, scale),
      segments: this._scaleSegments(this._segmentsRaw, scale),
      zoomLevel: this._zoomLevelOf(scale)
    });
  },

  _scheduleLayout() {
    if (this._layoutTimer) return;
    this._layoutTimer = setTimeout(() => {
      this._layoutTimer = null;
      this._refreshLayout(this.data.mapScale);
    }, 32);
  },

  // ============ 地图手势缩放 / 平移 ============
  onMapTouchStart(e) {
    this._moved = false;
    const ts = e.touches || [];
    if (ts.length === 2) {
      // 双指缩放：进入 pinch，禁止页面滚动
      this._touchMode = 'pinch';
      const [a, b] = ts;
      this._lastPinch = {
        dist: this._distance(a, b),
        scale: this.data.mapScale,
        cx: (a.clientX + b.clientX) / 2,
        cy: (a.clientY + b.clientY) / 2,
        tx: this.data.mapTx,
        ty: this.data.mapTy
      };
    } else if (ts.length === 1) {
      // 单指：只有「已缩放(mapScale>1)」时才作为地图拖动；
      // 未缩放时地图不平移，单指滑动交给页面正常滚动。
      if (this.data.mapScale > 1.001) {
        this._touchMode = 'drag';
        this._lastSingle = {
          x: ts[0].clientX,
          y: ts[0].clientY,
          tx: this.data.mapTx,
          ty: this.data.mapTy
        };
      } else {
        this._touchMode = 'scroll';
      }
    }
  },

  onMapTouchMove(e) {
    const ts = e.touches || [];

    if (ts.length === 2 && this._touchMode === 'pinch' && this._lastPinch) {
      this._moved = true;
      const [a, b] = ts;
      const dist = this._distance(a, b);
      const lp = this._lastPinch;
      const ratio = lp.dist > 0 ? dist / lp.dist : 1;
      let newScale = Math.min(MAX_SCALE, Math.max(1, lp.scale * ratio));

      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      const tx = cx - lp.cx + lp.tx;
      const ty = cy - lp.cy + lp.ty;

      this._applyTransform(newScale, tx, ty);
      return;
    }

    // 已缩放 + 单指拖动：平移地图（此时 catch 已阻断页面滚动）
    if (ts.length === 1 && this._touchMode === 'drag' && this._lastSingle) {
      const dx = ts[0].clientX - this._lastSingle.x;
      const dy = ts[0].clientY - this._lastSingle.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this._moved = true;
      this._applyTransform(this.data.mapScale, this._lastSingle.tx + dx, this._lastSingle.ty + dy);
    }
    // 未缩放(scroll 模式)：不处理，让页面滚动
  },

  onMapTouchEnd(e) {
    const now = Date.now();
    // 双击复位：仅在未发生拖动/缩放且非滚动模式下判定
    if (!this._moved && this._touchMode !== 'scroll'
      && (this._touchMode === 'drag' || !this._touchMode)) {
      if (now - this._doubleTapAt < 300) {
        this._doubleTapAt = 0;
        this.onMapReset();
      } else {
        this._doubleTapAt = now;
      }
    }
    this._touchMode = '';
    this._lastSingle = null;
    this._lastPinch = null;
  },

  // 应用变换并夹紧平移范围；同时更新语义缩放级别
  // 平移范围 = 放大后内容的真实溢出量：(s-1)×内容宽/高。
  // 这样任意倍率下都能拖到地图的左右上下边缘，不会有大片区域永远看不到。
  _applyTransform(scale, tx, ty) {
    const s = Math.min(MAX_SCALE, Math.max(1, scale));
    let nx = tx;
    let ny = ty;
    if (s <= 1.001) {
      nx = 0;
      ny = 0;
    } else {
      const W = this.data.stageW || 300;
      const H = this._mapH || this.data.stageH || 300;
      // transform-origin 为左上角(0 0)，内容放大后渲染在 [tx, tx + s×W]，
      // 可视窗口 [0, W] → tx 合法区间 [W - s×W, 0] = [-(s-1)×W, 0]
      const maxX = (s - 1) * W;
      const maxY = (s - 1) * H;
      nx = Math.max(-maxX, Math.min(0, nx));
      ny = Math.max(-maxY, Math.min(0, ny));
    }
    this.setData({
      mapScale: Math.round(s * 100) / 100,
      mapTx: Math.round(nx),
      mapTy: Math.round(ny),
      mapScaleText: s.toFixed(1) + '×',
      zoomLevel: this._zoomLevelOf(s)
    });
    // 缩放变化 → 重排标注（节流）
    this._scheduleLayout();
  },

  // 复位缩放与平移
  onMapReset() {
    this.setData({
      mapScale: 1,
      mapTx: 0,
      mapTy: 0,
      mapScaleText: '1.0×',
      zoomLevel: 'overview',
      selectedPlaceId: '',
      selectedVisitId: '',
      poemNodes: []
    });
    this._scheduleLayout();
  },

  _distance(a, b) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // 切换古人
  onSwitchLine(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || id === this.data.currentLineId) return;
    this.setData({ card: { show: false }, 'cityCard.show': false });
    this.onMapReset();
    this.loadLine(id);
  },

  // ===== 点击地点 =====
  // 规则：
  //  - overview 层：多次到访地点 → 自动放大居中到该地点（zoomToPlace）；单访 → 打开地点卡片。
  //  - detail 层：多次到访地点 → 展开编号选择（行迹卡）；单访 → 打开地点卡片。
  //  - poem 层：选中地点展开诗笺（预留结构，当前数据未接完整诗笺则不制造虚假内容）。
  onWpTap(e) {
    if (this._moved) return;
    const k = e.currentTarget.dataset.k;
    const p = (this.data.places || []).find(x => x.placeId === k);
    if (!p) return;

    const level = this.data.zoomLevel;

    // 多次到访地点
    if (p.hasMultiple) {
      if (level === 'overview' || level === 'status') {
        // 自动放大居中到该地点，进入 detail 层以便展开编号
        this._zoomToPlace(p, ZOOM.DETAIL + 0.05);
        return;
      }
      // detail / poem 层：展开编号选择
      this.openCityCard(p);
      return;
    }

    // 单访地点：poem 层尝试展开诗笺（预留），否则打开地点卡片
    if (level === 'poem' && p.visits && p.visits.length === 1) {
      this.openPoemNode(p);
      return;
    }
    this.openPlaceCard(p.visits[0]);
  },

  // 放大并居中到某个地点（用于 overview 点多次到访地点）
  _zoomToPlace(p, targetScale) {
    const W = this.data.stageW || 300;
    const H = this._mapH || this.data.stageH || 300;
    const s = Math.min(MAX_SCALE, targetScale);
    // 让地点中心尽量落在容器中心：tx = W/2 - p.ox * s（origin 0 0）
    const ox = (p.x / 100) * W;
    const oy = (p.y / 100) * H;
    // 夹紧到内容真实溢出范围（与 _applyTransform 一致）
    const maxX = (s - 1) * W;
    const maxY = (s - 1) * H;
    const tx = Math.max(-maxX, Math.min(0, W / 2 - ox * s));
    const ty = Math.max(-maxY, Math.min(0, H / 2 - oy * s));
    this.setData({
      mapScale: Math.round(s * 100) / 100,
      mapTx: Math.round(tx),
      mapTy: Math.round(ty),
      mapScaleText: s.toFixed(1) + '×',
      zoomLevel: this._zoomLevelOf(s),
      selectedPlaceId: p.placeId
    });
    this._scheduleLayout();
  },

  // 平滑放大并居中到某个地点，但不选中、不弹地点卡（用于「下一站聚焦」自动引导）
  _focusPlace(p, targetScale) {
    const W = this.data.stageW || 300;
    const H = this._mapH || this.data.stageH || 300;
    const s = Math.min(MAX_SCALE, targetScale);
    const ox = (p.x / 100) * W;
    const oy = (p.y / 100) * H;
    const tx = W / 2 - ox * s;
    const ty = H / 2 - oy * s;
    // 临时开启 transform 过渡实现平滑动画，动画结束后关闭避免手势拖动抖动
    this.setData({ mapAnim: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' });
    if (this._focusAnimTimer) clearTimeout(this._focusAnimTimer);
    this._focusAnimTimer = setTimeout(() => {
      this._focusAnimTimer = null;
      this.setData({ mapAnim: 'none' });
      // 动画结束强制按最终倍率精确重排一次：消除过渡插值期间的小数中间态，
      // 保证所有标签最终落在整数像素上（不发虚）
      this._refreshLayout(this.data.mapScale);
    }, 550);
    // 走统一夹紧 + setData + 重排标注（不设置 selectedPlaceId，保持未选中态）
    this._applyTransform(s, tx, ty);
  },

  // 消费待聚焦的下一地点（地点数据 + 图片解析完成后由 _renderPlaces 调用）
  _applyPendingFocus() {
    const focus = this._pendingMapFocus;
    if (!focus || !focus.lineId || focus.lineId !== this.data.currentLineId) {
      this._pendingMapFocus = null;
      return;
    }
    const action = focus.action;
    const lid = focus.locationId || '';

    // 终章：已走完最后一个地点 → 不聚焦地点，恢复全图（终章大印由 allDone 呈现）
    if (action === 'finale') {
      this._pendingMapFocus = null;
      this._animateReset();
      return;
    }

    // 聚焦下一站：定位下一地点并平滑放大居中（保留头像/箭头提示，不弹地点卡）
    if (action === 'focus-next' && lid) {
      const places = this._placesRaw || [];
      const p = places.find(pp =>
        pp.placeId === lid || (pp.visits || []).some(v => v.locationId === lid));
      this._pendingMapFocus = null;
      if (p) {
        // 2.6×（detail 层）：中原一带地点密集，1.8× 会互相遮挡；放大到 detail 层
        // 让下一地点的编号+地名+副标题完整展开，清晰可见
        this._focusPlace(p, 2.6);
      }
      return;
    }

    // 无 action 或未知 action：仅切线，不做聚焦
    this._pendingMapFocus = null;
  },

  // 平滑复位到全图（终章/手动复位走此入口；带过渡动画）
  _animateReset() {
    this.setData({ mapAnim: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' });
    if (this._focusAnimTimer) clearTimeout(this._focusAnimTimer);
    this._focusAnimTimer = setTimeout(() => {
      this._focusAnimTimer = null;
      this.setData({ mapAnim: 'none' });
    }, 550);
    this.onMapReset();
  },

  // poem 层展开诗笺（预留：当前数据无完整诗笺关系，仅记录选中态，不制造虚假内容）
  openPoemNode(p) {
    const v = p.visits[0];
    this.setData({
      selectedPlaceId: p.placeId,
      selectedVisitId: v.visitId,
      poemNodes: []   // 预留扩展：接入完整诗笺后填充
    });
    // 兜底：仍打开地点卡片，保证单访地点可进入剧情
    this.openPlaceCard(v);
  },

  // 打开单访地点卡片（保留既有地点卡片逻辑）
  openPlaceCard(v) {
    if (!v) return;
    const line = this.data.currentLine || {};
    const stateText = v.state === 'completed' ? '已走过'
      : (v.state === 'active' ? '本程行迹' : '尚未解锁');
    const note = v.state === 'locked' ? LOCKED_NOTE : (v.note || '');
    this.setData({
      card: {
        show: true,
        k: v.visitId,
        name: v.name,
        subtitle: v.subtitle || '',
        lineId: this.data.currentLineId,
        lineName: line.name || '',
        periodId: v.periodId || '',
        periodName: v.periodName || '',
        locationId: v.locationId || '',
        range: v.range,
        indexChar: v.indexChar || '',
        state: v.state,
        stateText,
        isKey: !!v.isKey,
        note,
        poem: v.poem,
        poemTitle: v.poemTitle,
        scene: v.scene || '',
        anchorLit: v.anchorLit,
        anchorTotal: v.anchorTotal,
        canEnter: v.state !== 'locked'
      }
    });
  },

  // 打开多次到访「行迹卡」：列出该地点所有到访编号
  openCityCard(p) {
    const lineName = (this.data.currentLine || {}).name || '';
    const members = (p.visits || [])
      .slice()
      .sort((a, b) => a.seq - b.seq)
      .map(v => {
        const stateText = v.state === 'completed' ? '已走过'
          : (v.state === 'active' ? '本程行迹' : '尚未解锁');
        return {
          k: v.visitId,
          locationId: v.locationId || '',
          seq: v.seq,
          subtitle: v.subtitle || '',
          range: v.range || '',
          periodId: v.periodId || '',
          state: v.state,
          stateText,
          isKey: !!v.isKey,
          canEnter: v.state !== 'locked'
        };
      });

    this.setData({
      cityCard: {
        show: true,
        name: p.name,
        lineId: this.data.currentLineId,
        lineName,
        members
      }
    });
  },

  onCloseCityCard() {
    this.setData({ 'cityCard.show': false });
  },

  // 从多次到访行迹卡进入某个具体到访
  goCityMember(e) {
    const k = e.currentTarget.dataset.k;
    const m = ((this.data.cityCard && this.data.cityCard.members) || [])
      .find(x => x.k === k);
    if (!m) return;
    if (!m.canEnter) {
      wx.showToast({ title: '完成上一地点后解锁', icon: 'none' });
      return;
    }
    const mode = m.state === 'completed' ? 'replay' : 'continue';
    this.setData({ 'cityCard.show': false });

    // 地点模式：走 locationId；时期模式（多次到访少见）：走 periodId
    if (this.data.isLocationMode && m.locationId) {
      this._enterChat(this.data.currentLineId, { locationId: m.locationId, mode });
    } else if (m.periodId) {
      this._enterChat(this.data.currentLineId, { questId: m.periodId });
    }
  },

  onCloseCard() {
    this.setData({ 'card.show': false });
  },

  // 卡片上的空点击（阻止冒泡到遮罩）
  noop() {},

  // 进入这一程（对话页）：地点模式走 locationId，时期模式走 questId
  goPeriod() {
    const c = this.data.card;
    if (!c || !c.canEnter) {
      wx.showToast({ title: '先完成前面的地点', icon: 'none' });
      return;
    }
    if (c.locationId) {
      const mode = c.state === 'completed' ? 'replay' : 'continue';
      this._enterChat(c.lineId, { locationId: c.locationId, mode });
    } else {
      this._enterChat(c.lineId, { questId: c.periodId });
    }
  },

  goCurrentPeriod() {
    const c = this.data.currentJourney;
    if (!c) return;
    this._enterChat(c.lineId, { questId: c.periodId });
  },

  goCurrentLocation() {
    const c = this.data.currentLocation;
    if (!c) return;
    this._enterChat(this.data.currentLineId, { locationId: c.locationId, mode: 'continue' });
  },

  // 统一进入聊天页：角色线（杜甫/李白/苏轼，地点模式）缺 confirmed 角色时先经角色页确认，
  // 再回到原地点；时期模式维持原流程。
  _enterChat(lineId, opts) {
    if (opts.locationId) {
      if (guard.isRoleLine(lineId) && guard.needsRolePage(lineId, progress.getPlayerProfile(lineId))) {
        wx.navigateTo({
          url: guard.buildPlayerUrl({ lineId, target: 'chat', locationId: opts.locationId, mode: opts.mode || 'continue' })
        });
        return;
      }
      wx.navigateTo({
        url: `/pages/chat/chat?storyId=${lineId}&locationId=${opts.locationId}&mode=${opts.mode || 'continue'}`
      });
      return;
    }
    if (opts.questId) {
      wx.navigateTo({ url: `/pages/chat/chat?storyId=${lineId}&questId=${opts.questId}` });
    }
  },

  goPoemPeriod(e) {
    const d = (e && e.currentTarget && e.currentTarget.dataset) || {};
    if (!d.lineId) return;
    if (d.locationId) {
      this._enterChat(d.lineId, { locationId: d.locationId, mode: 'replay' });
      return;
    }
    if (!d.periodId) return;
    getApp().globalData.poemFocus = { lineId: d.lineId, periodId: d.periodId };
    wx.switchTab({ url: '/pages/poem/poem' });
  }
});
