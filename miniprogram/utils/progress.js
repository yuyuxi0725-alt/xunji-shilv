// utils/progress.js —— 统一的进度 / 锚点 / 探究档案存储层
//
// 为什么要这一层：
//   旧版把进度存成扁平的 { p1: 'completed', p2: 'active' }，三条人物线
//   的时期 id 都有重名 —— 通关一条线会把另一条线同名时期误标为已完成（真实 bug）。
//   本模块把所有状态改为「按主线分组」的二级结构，并负责旧数据的一次性迁移。
//
// 存储结构（三个 key 全部按 storyId 分组）：
//   questStates      { [lineId]: { [periodId]: 'locked'|'active'|'completed' } }
//   collectedAnchors { [lineId]: { [anchorId]: true } }
//   questRecords     { [lineId]: { [periodId]: { ...探究档案 } } }
//
// questRecords[lineId][periodId] 的字段（供「行迹地图」与「我的诗笺」消费）：
//   earnedAt     Number  首次通关、获得诗笺的时间戳(ms)，重玩不变
//   completedAt  Number  最近一次通关时间戳(ms)，兼作云同步版本时间
//   updatedAt    Number  最近一次更新记录的时间戳(ms)
//   anchors      Array   本时期点亮的锚点 id
//   anchorNames  Array   本时期点亮的锚点中文名
//   anchorTotal  Number  本时期锚点总数
//   choices      Array   [{ nodeId, text, right }] 玩家的关键选择
//   keyChoice    String  'right' | 'wrong' | ''   决定性瞬间的结果
//   trapCaught   Number  考据挑战中抓出的错漏数
//   trapTotal    Number  考据挑战错漏总数
//   quizCorrect  Number  节点检验答对数
//   quizTotal    Number  节点检验总数
//   poem         String  依玩家选择生成的一句诗（诗笺卡用）

const playerProfile = require('./player-profile');
const playerAvatars = require('./player-avatars');
const playerGuard = require('./player-guard');

const KEY_STATES = 'questStates';
const KEY_ANCHORS = 'collectedAnchors';
const KEY_RECORDS = 'questRecords';
const KEY_MIGRATED = 'progressSchemaV2';

// ============ 地点模式（三条人物线）新字段 ============
// 与旧时期字段并存；迁移完成前不删旧字段，以便老版本回滚时仍可读取。
const KEY_LOCATION_STATES = 'locationStates';         // { [lineId]: { [locationId]: 'locked'|'active'|'completed' } }
const KEY_LOCATION_CHECKPOINTS = 'locationCheckpoints'; // { [lineId]: { [locationId]: { nodeId, updatedAt } } }
const KEY_LOCATION_RECORDS = 'locationRecords';       // { [lineId]: { [locationId]: record } }
const KEY_SELECTED_LINE = 'selectedLineId';           // 当前选中人物（首页选人）
const KEY_SCHEMA = 'progressSchemaVersion';           // 进度 schema 版本（迁移用）

// ============ 地点身份 / 信任 / 任务 / 人物理解 / 见证物 ============
// 泰山「身份选择」样板等新玩法需要按地点持久化的三类数据：
const KEY_LOCATION_PROFILES = 'locationProfiles';     // { [lineId]: { [locationId]: { roleId, chosenAt, trustEvents, tasks, updatedAt } } }
const KEY_LINE_INSIGHT_EVENTS = 'lineInsightEvents';  // { [lineId]: { [eventId]: points } } 人物理解度（按主线累计）
const KEY_WITNESS_ITEMS = 'witnessItems';             // { [lineId]: { [itemId]: { sourceLocationId, acquiredAt } } }

// ============ 玩家角色档案（杜甫/李白/苏轼三线，独立于账号昵称与地点身份） ============
// 只存外观/姓名/时间，不存职业、初始信任、身份能力（见 utils/player-profile.js）。
// 各线档案独立：playerProfiles.dufu / playerProfiles.libai / playerProfiles.sushi 互不影响。
const KEY_PLAYER_PROFILES = 'playerProfiles';         // { [lineId]: { version, avatarId, displayName, confirmed, createdAt, updatedAt } }

const PROGRESS_SCHEMA_VERSION = 3;   // v3 = 杜甫、李白、苏轼旧时期进度统一迁到地点状态

// 已知主线 id（迁移时用来判断旧扁平数据属于哪条线）
const KNOWN_LINES = ['dufu', 'libai', 'sushi'];

// ---------- 内部读写 ----------

function read(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    if (fallback && typeof fallback === 'object') {
      return (v && typeof v === 'object') ? v : fallback;
    }
    return typeof v === typeof fallback ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

// ---------- 变更订阅 ----------
// 写入后通知订阅者（app.js 用它把进度推送到云数据库）。
// 订阅者抛错绝不影响本地写入 —— 云同步是"尽力而为"，本地存储始终是唯一真相源。
const listeners = [];

function notify() {
  listeners.forEach((cb) => {
    try { cb(); } catch (e) { console.warn('[progress] 订阅回调异常（已忽略）', e); }
  });
}

/** 订阅本地进度变更；返回取消订阅函数 */
function onChange(cb) {
  if (typeof cb !== 'function') return () => {};
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function write(key, val) {
  try {
    wx.setStorageSync(key, val);
  } catch (e) {
    console.warn('[progress] 写入失败', key, e);
    return;
  }
  notify();
}

// 判断一个对象是不是「按主线分组」的二级结构
function isGrouped(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.keys(obj).some(k => KNOWN_LINES.indexOf(k) >= 0);
}

/**
 * 旧数据迁移（幂等，只跑一次）
 * 旧 questStates = { p1:'completed', p2:'active' }  →  { dufu: { p1:'completed', ... } }
 * 旧 collectedAnchors 本来就是二级结构，无需迁移。
 */
function migrate() {
  if (read(KEY_MIGRATED, false) === true) return;

  const raw = read(KEY_STATES, {});
  if (raw && !isGrouped(raw) && Object.keys(raw).length > 0) {
    // 扁平结构 → 归到杜甫线（旧版只有杜甫线会写这个 key）
    write(KEY_STATES, { dufu: raw });
    console.log('[progress] 已迁移旧版扁平进度到 dufu 线', raw);
  }
  write(KEY_MIGRATED, true);
}

// ---------- 进度状态 ----------

/** 取某条主线的时期状态表 { [periodId]: state } */
function getStates(lineId) {
  migrate();
  const all = read(KEY_STATES, {});
  const mine = all[lineId];
  return (mine && typeof mine === 'object') ? Object.assign({}, mine) : {};
}

/** 写入某条主线某个时期的状态 */
function setState(lineId, periodId, state) {
  migrate();
  const all = read(KEY_STATES, {});
  const mine = Object.assign({}, all[lineId]);
  mine[periodId] = state;
  all[lineId] = mine;
  write(KEY_STATES, all);
}

/**
 * 计算某条主线各时期应当展示的状态（不写库，纯计算，供剧本页/地图页渲染）
 * 规则：显式存过的状态优先；否则第一个未完成的默认 active，其前序全 completed 才解锁。
 * @param {string} lineId
 * @param {Array<string>} order 时期 id 顺序数组
 * @returns {Object} { [periodId]: 'locked'|'active'|'completed' }
 */
function computeStates(lineId, order) {
  const saved = getStates(lineId);
  const out = {};
  let unlocked = true;   // 是否已解锁到当前位置
  (order || []).forEach((id) => {
    if (saved[id] === 'completed') {
      out[id] = 'completed';
      return;
    }
    if (unlocked) {
      out[id] = 'active';
      unlocked = false;   // 只有第一个未完成的可玩，其后锁定
    } else {
      out[id] = 'locked';
    }
  });
  return out;
}

/**
 * 标记某时期通关：写 completed，并把顺序上的下一期写为 active
 * @returns {{ completedCount:number, allDone:boolean, nextId:string }}
 */
function completePeriod(lineId, periodId, order) {
  const list = order || [];
  const idx = list.indexOf(periodId);
  setState(lineId, periodId, 'completed');
  if (idx >= 0 && idx < list.length - 1) {
    setState(lineId, list[idx + 1], 'active');
  }
  const states = getStates(lineId);
  const completedCount = list.filter(id => states[id] === 'completed').length;
  return {
    completedCount,
    allDone: list.length > 0 && completedCount >= list.length,
    nextId: (idx >= 0 && idx < list.length - 1) ? list[idx + 1] : ''
  };
}

// ---------- 知识锚点 ----------

/** 取某条主线已收集的锚点 { [anchorId]: true } */
function getAnchors(lineId) {
  const all = read(KEY_ANCHORS, {});
  const mine = all[lineId];
  return (mine && typeof mine === 'object') ? Object.assign({}, mine) : {};
}

/** 收集一个锚点（幂等） */
function addAnchor(lineId, anchorId) {
  if (!anchorId) return false;
  const all = read(KEY_ANCHORS, {});
  const mine = Object.assign({}, all[lineId]);
  if (mine[anchorId]) return false;   // 已收集
  mine[anchorId] = true;
  all[lineId] = mine;
  write(KEY_ANCHORS, all);
  return true;
}

// ---------- 探究档案（通关记录，供诗笺/地图/报告） ----------

function getAllRecords() {
  return read(KEY_RECORDS, {});
}

function getRecord(lineId, periodId) {
  const all = getAllRecords();
  const line = all[lineId] || {};
  return line[periodId] || null;
}

/** 取某条主线的全部时期记录 { [periodId]: record } */
function getLineRecords(lineId) {
  const all = getAllRecords();
  return Object.assign({}, all[lineId]);
}

/** 合并写入一条通关记录（分批调用可增量累积） */
function saveRecord(lineId, periodId, patch) {
  if (!lineId || !periodId) return null;
  const all = getAllRecords();
  const line = Object.assign({}, all[lineId]);
  const prev = line[periodId] || {};
  const next = Object.assign({}, prev, patch || {});
  line[periodId] = next;
  all[lineId] = line;
  write(KEY_RECORDS, all);
  return next;
}

/** 全部清除（「我的」页「重新开始」用） */
function resetAll() {
  try {
    wx.removeStorageSync(KEY_STATES);
    wx.removeStorageSync(KEY_ANCHORS);
    wx.removeStorageSync(KEY_RECORDS);
    wx.removeStorageSync(KEY_LOCATION_STATES);
    wx.removeStorageSync(KEY_LOCATION_CHECKPOINTS);
    wx.removeStorageSync(KEY_LOCATION_RECORDS);
    wx.removeStorageSync(KEY_SELECTED_LINE);
    wx.removeStorageSync(KEY_LOCATION_PROFILES);
    wx.removeStorageSync(KEY_LINE_INSIGHT_EVENTS);
    wx.removeStorageSync(KEY_WITNESS_ITEMS);
    wx.removeStorageSync(KEY_PLAYER_PROFILES);
    wx.setStorageSync(KEY_MIGRATED, true);
    wx.setStorageSync(KEY_SCHEMA, PROGRESS_SCHEMA_VERSION);
  } catch (e) {
    console.warn('[progress] 清除失败', e);
  }
  notify();
}

// ---------- 地点级进度（杜甫 22 地点） ----------
// 地点模式与时期模式并存：杜甫读 locationStates，李白苏轼读 questStates。
// 解锁规则：新用户仅第一个地点 active；完成当前地点→下一地点 active；其余 locked。

/** 取某条主线的地点状态表 { [locationId]: state } */
function getLocationStates(lineId) {
  migrate();
  const all = read(KEY_LOCATION_STATES, {});
  const mine = all[lineId];
  return (mine && typeof mine === 'object') ? Object.assign({}, mine) : {};
}

/** 写某条主线某个地点的状态 */
function setLocationState(lineId, locationId, state) {
  const all = read(KEY_LOCATION_STATES, {});
  const mine = Object.assign({}, all[lineId]);
  mine[locationId] = state;
  all[lineId] = mine;
  write(KEY_LOCATION_STATES, all);
}

/**
 * 计算某条主线各地点的展示状态（纯计算，不写库）。
 * 规则：显式存过 completed 的优先；否则按顺序第一个未完成的 active，其后 locked。
 */
function computeLocationStates(lineId, order) {
  const saved = getLocationStates(lineId);
  const out = {};
  let unlocked = true;
  (order || []).forEach((id) => {
    if (saved[id] === 'completed') {
      out[id] = 'completed';
      return;
    }
    if (unlocked) {
      out[id] = 'active';
      unlocked = false;
    } else {
      out[id] = 'locked';
    }
  });
  return out;
}

/**
 * 标记某地点通关：写 completed，并把顺序上的下一地点写为 active。
 * 重温已完成地点不改变主线活动地点（调用方自行判断是否调用）。
 */
function completeLocation(lineId, locationId, order) {
  const list = order || [];
  const idx = list.indexOf(locationId);
  setLocationState(lineId, locationId, 'completed');
  if (idx >= 0 && idx < list.length - 1) {
    setLocationState(lineId, list[idx + 1], 'active');
  }
  const states = getLocationStates(lineId);
  const completedCount = list.filter(id => states[id] === 'completed').length;
  return {
    completedCount,
    allDone: list.length > 0 && completedCount >= list.length,
    nextId: (idx >= 0 && idx < list.length - 1) ? list[idx + 1] : ''
  };
}

// ---------- 地点检查点 ----------

/** 取某条主线某个地点的检查点 { nodeId, updatedAt } */
function getLocationCheckpoint(lineId, locationId) {
  const all = read(KEY_LOCATION_CHECKPOINTS, {});
  const line = all[lineId] || {};
  return line[locationId] || null;
}

/** 保存某条主线某个地点的检查点 */
function saveLocationCheckpoint(lineId, locationId, nodeId) {
  if (!lineId || !locationId || !nodeId) return;
  const all = read(KEY_LOCATION_CHECKPOINTS, {});
  const line = Object.assign({}, all[lineId]);
  line[locationId] = { nodeId, updatedAt: Date.now() };
  all[lineId] = line;
  write(KEY_LOCATION_CHECKPOINTS, all);
}

/** 清除某条主线某个地点的检查点 */
function clearLocationCheckpoint(lineId, locationId) {
  const all = read(KEY_LOCATION_CHECKPOINTS, {});
  const line = Object.assign({}, all[lineId]);
  delete line[locationId];
  all[lineId] = line;
  write(KEY_LOCATION_CHECKPOINTS, all);
}

// ---------- 地点记录（诗笺） ----------

function getAllLocationRecords() {
  return read(KEY_LOCATION_RECORDS, {});
}

function getLocationRecord(lineId, locationId) {
  const all = getAllLocationRecords();
  const line = all[lineId] || {};
  return line[locationId] || null;
}

function saveLocationRecord(lineId, locationId, patch) {
  if (!lineId || !locationId) return null;
  const all = getAllLocationRecords();
  const line = Object.assign({}, all[lineId]);
  const prev = line[locationId] || {};
  const next = Object.assign({}, prev, patch || {});
  line[locationId] = next;
  all[lineId] = line;
  write(KEY_LOCATION_RECORDS, all);
  return next;
}

// ---------- 当前选中人物 ----------

function getSelectedLine() {
  return read(KEY_SELECTED_LINE, '') || '';
}

function setSelectedLine(lineId) {
  if (!lineId) { wx.removeStorageSync(KEY_SELECTED_LINE); }
  else { write(KEY_SELECTED_LINE, lineId); }
}

// ---------- 玩家角色档案（playerProfiles，独立于账号昵称 userNickname） ----------
// 只存外观/姓名/时间；不存职业、初始信任、身份能力。姓名与账号昵称完全分开。
// 人物线白名单：只接受 dufu/libai/sushi，拒绝任意伪造 lineId（本地写入与云端合并同规）。

/** 某个人物线 id 是否为合法角色线（与 player-guard 的 ROLE_LINES 同一事实源） */
function isPlayerProfileLine(lineId) {
  return playerGuard.isRoleLine(lineId);
}

/** 取某条主线的玩家角色档案；无则 null（非法 lineId 一律返回 null，不读伪造键） */
function getPlayerProfile(lineId) {
  if (!isPlayerProfileLine(lineId)) return null;
  const all = read(KEY_PLAYER_PROFILES, {});
  const p = all[lineId];
  return playerProfile.normalizeProfile(p);
}

/**
 * 存储里是否存在「结构非法」的角色档案（有数据但不合法）。
 * 用于「我的」页把「未创建」和「档案损坏待修复」区分开：
 * 两者都要进统一角色页，但文案不同（创建 vs 修复），避免用户以为角色被凭空清掉。
 */
function hasInvalidPlayerProfile(lineId) {
  if (!isPlayerProfileLine(lineId)) return false;
  const all = read(KEY_PLAYER_PROFILES, {});
  if (!all || !(lineId in all)) return false;
  const raw = all[lineId];
  if (raw === undefined || raw === null) return false;
  return playerProfile.normalizeProfile(raw) === null;
}

/**
 * 保存（创建或更新）某条主线的玩家角色档案。
 * 首次创建写 createdAt；更新时保留原 createdAt、刷新 updatedAt。
 * @returns {object|null} 保存后的档案；lineId 非法、外观或姓名非法时返回 null
 */
function savePlayerProfile(lineId, avatarId, rawName) {
  if (!isPlayerProfileLine(lineId)) return null;
  const created = playerProfile.createProfile(avatarId, rawName);
  if (!created) return null;

  const all = read(KEY_PLAYER_PROFILES, {});
  const prev = playerProfile.normalizeProfile(all[lineId]);
  const next = Object.assign({}, created, {
    createdAt: (prev && prev.createdAt > 0) ? prev.createdAt : created.createdAt
  });
  all[lineId] = next;
  write(KEY_PLAYER_PROFILES, all);
  return next;
}

/** 清除某条主线的玩家角色档案（不删账号昵称与其它进度；非法 lineId 忽略） */
function clearPlayerProfile(lineId) {
  if (!isPlayerProfileLine(lineId)) return;
  const all = read(KEY_PLAYER_PROFILES, {});
  if (!(lineId in all)) return;
  delete all[lineId];
  write(KEY_PLAYER_PROFILES, all);
}

// 旧泰山「身份」所在的地点 id（迁移来源）
const LEGACY_ROLE_LINE = 'dufu';
const LEGACY_ROLE_LOCATION = 'taishan';

/**
 * 旧泰山身份 → 杜甫玩家角色草稿（幂等，可反复调用）。
 *
 * 规则（对应实施文档 6.1）：
 *   · 从 locationProfiles.dufu.taishan.roleId 读取旧值，仅按映射预选外观；
 *   · 只有「合法旧角色」且「不存在合法角色档案」时，才创建 confirmed:false 的迁移草稿；
 *   · 非法旧角色或没有旧角色时不生成任何档案；
 *   · 保留旧 locationProfiles 原数据（不删任务、见证物、信任等兼容数据）；
 *   · 已有合法档案（无论 confirmed）时永不覆盖——尤其不覆盖用户已确认的新角色。
 *
 * 幂等性由「存在合法档案即返回」保证：首次创建草稿后，再次调用读到该草稿即跳过。
 * 本地启动时迁移一次（见 sync.js init），云端旧快照晚到合并进本地后再次调用补全（见 mergeRemote）。
 * @returns {boolean} 是否创建了迁移草稿
 */
function migrateLegacyPlayerProfile() {
  const lineId = LEGACY_ROLE_LINE;
  // 已有合法档案（含确认档案与迁移草稿）→ 永不覆盖
  if (getPlayerProfile(lineId)) return false;

  const legacy = getLocationProfile(lineId, LEGACY_ROLE_LOCATION);
  const roleId = legacy && legacy.roleId;
  const avatarId = playerAvatars.avatarForLegacyRole(roleId);
  if (!avatarId) return false;   // 无旧角色或非法旧角色 → 不生成

  const now = playerProfile.nowMs();
  const draft = {
    version: playerProfile.PROFILE_VERSION,
    avatarId,
    displayName: playerProfile.DEFAULT_NAME,
    confirmed: false,            // 迁移草稿，待用户确认
    createdAt: now,
    updatedAt: now
  };
  const all = read(KEY_PLAYER_PROFILES, {});
  all[lineId] = draft;
  write(KEY_PLAYER_PROFILES, all);
  console.log('[progress] 已由旧泰山身份预选外观', roleId, '→', avatarId);
  return true;
}

/**
 * 旧时期进度迁移（幂等，只跑一次）。
 * 旧 questStates = { dufu:{ p1:'completed', ... }, libai:{...}, sushi:{...} }。
 * 规则（见 docs/杜甫22地点地图叙事-开发实施步骤.md 步骤 4）：
 *   · 旧时期 completed → 对应地点全部 completed；
 *   · 旧时期 active → 该时期第一个地点 active，其余 locked；
 *   · 后续时期保持 locked；
 *   · 版本号保证重复执行结果相同。
 *
 * @param {Array|Object} input 旧调用可直接传杜甫 locations；新调用传
 *   [{ lineId, locations, periodOrder, anchorMap }]，一次迁完三条线。
 */
function migrateLocationProgress(input) {
  const ver = read(KEY_SCHEMA, 0);
  if (ver >= PROGRESS_SCHEMA_VERSION) return;

  let configs;
  if (Array.isArray(input) && input.length && input[0] && input[0].lineId && input[0].locations) {
    configs = input;
  } else {
    configs = [{ lineId: 'dufu', locations: input || [], periodOrder: ['p1', 'p2', 'p3', 'p4'] }];
  }

  const oldStates = read(KEY_STATES, {});
  const allLocationStates = read(KEY_LOCATION_STATES, {});
  const allAnchors = read(KEY_ANCHORS, {});
  let locationChanged = false;
  let anchorChanged = false;

  configs.forEach((config) => {
    const lineId = config.lineId;
    const locations = Array.isArray(config.locations) ? config.locations : [];
    const oldLineStates = oldStates[lineId];
    const hasOld = oldLineStates && typeof oldLineStates === 'object' && Object.keys(oldLineStates).length > 0;
    const existing = allLocationStates[lineId] || {};
    const hasCurrentLocationProgress = locations.some(loc => Object.prototype.hasOwnProperty.call(existing, loc.id));

    if (hasOld && locations.length) {
      // 按地点顺序逐个迁移；若用户已在地点模式继续游玩，以现有地点进度为准。
      const newStates = {};
      let sawActive = false;
      locations.forEach((loc) => {
        const pid = loc.periodId;
        const periodState = oldLineStates[pid];
        if (periodState === 'completed') {
          newStates[loc.id] = 'completed';
        } else if (periodState === 'active' && !sawActive) {
          newStates[loc.id] = 'active';
          sawActive = true;
        } else {
          newStates[loc.id] = 'locked';
        }
      });

      // 若旧时期没有 active（如只完成了 p1，p2 无记录），把第一个非 completed 设为 active
      if (!sawActive) {
        const firstNonCompleted = locations.find(loc => newStates[loc.id] !== 'completed');
        if (firstNonCompleted) newStates[firstNonCompleted.id] = 'active';
      }

      allLocationStates[lineId] = Object.assign({}, newStates, existing);
      locationChanged = true;
      console.log('[progress] 已迁移旧时期进度到 ' + lineId + ' 地点线');
    }

    // 李白旧锚点是 l1–l20，可无歧义地迁移。苏轼旧、新锚点都叫 s*，
    // 只有明确检测到“旧时期进度且尚未开始地点模式”时才重排，避免误改新用户数据。
    const anchorMap = config.anchorMap || {};
    const shouldRemapAnchors = Object.keys(anchorMap).length > 0 &&
      (lineId !== 'sushi' || (hasOld && !hasCurrentLocationProgress));
    const currentAnchors = allAnchors[lineId];
    if (shouldRemapAnchors && currentAnchors && typeof currentAnchors === 'object') {
      const source = Object.assign({}, currentAnchors);
      const migrated = Object.assign({}, currentAnchors);
      Object.keys(anchorMap).forEach(oldId => { delete migrated[oldId]; });
      Object.keys(anchorMap).forEach((oldId) => {
        if (!source[oldId]) return;
        const targets = Array.isArray(anchorMap[oldId]) ? anchorMap[oldId] : [anchorMap[oldId]];
        targets.filter(Boolean).forEach(newId => { migrated[newId] = true; });
      });
      if (JSON.stringify(migrated) !== JSON.stringify(currentAnchors)) {
        allAnchors[lineId] = migrated;
        anchorChanged = true;
      }
    }
  });

  if (locationChanged) write(KEY_LOCATION_STATES, allLocationStates);
  if (anchorChanged) write(KEY_ANCHORS, allAnchors);

  write(KEY_SCHEMA, PROGRESS_SCHEMA_VERSION);
}

// ============ 地点身份 / 信任 / 任务 / 人物理解 / 见证物 ============
// 三份新数据都按「主线 id → 地点 id / 事件 id / 见证物 id」二级或三级分组。
// 写入方法均幂等、只增不减，供「身份选择 / 地点信任 / 地点任务 / 人物理解 / 见证物」消费。

// ---------- 地点身份档案（locationProfiles） ----------

/** 取某主线某地点的身份档案 { roleId, chosenAt, trustEvents, tasks, updatedAt } */
function getLocationProfile(lineId, locationId) {
  const all = read(KEY_LOCATION_PROFILES, {});
  const line = all[lineId] || {};
  const p = line[locationId];
  return (p && typeof p === 'object') ? Object.assign({}, p) : null;
}

/**
 * 选择地点身份（正式游玩）——一旦已保存，普通写入不得覆盖。
 * 规则：已有 roleId 时直接返回 false，不改变已有选择；
 *       roleId 冲突时（合并场景）由 mergeRemote 保留更早 chosenAt 的记录。
 * @returns {object|null} 保存后的档案；已存在则返回 null
 */
function chooseLocationRole(lineId, locationId, roleId) {
  if (!lineId || !locationId || !roleId) return null;
  const all = read(KEY_LOCATION_PROFILES, {});
  const line = Object.assign({}, all[lineId]);
  const prev = line[locationId] || {};
  if (prev.roleId) return null;   // 已选择，不允许普通写入覆盖
  const now = Date.now();
  const next = Object.assign({}, prev, {
    roleId,
    chosenAt: now,
    updatedAt: now
  });
  line[locationId] = next;
  all[lineId] = line;
  write(KEY_LOCATION_PROFILES, all);
  return next;
}

/**
 * 记录一次信任事件（幂等：同一 eventId 只生效一次，不重复加分）。
 * 信任第一版只允许非负整数 points，否则忽略该事件。
 * @returns {object|null} 更新后的档案；points 非法或 eventId 缺失时返回 null
 */
function addTrustEvent(lineId, locationId, eventId, points) {
  if (!lineId || !locationId || !eventId) return null;
  const p = Number(points);
  if (!Number.isInteger(p) || p < 0) return null;   // 第一版仅非负整数
  const all = read(KEY_LOCATION_PROFILES, {});
  const line = Object.assign({}, all[lineId]);
  const prev = line[locationId] || {};
  const trustEvents = Object.assign({}, prev.trustEvents);
  if (trustEvents[eventId] !== undefined) return null;   // 幂等：已存在不重复加分
  trustEvents[eventId] = p;
  const next = Object.assign({}, prev, {
    trustEvents,
    updatedAt: Date.now()
  });
  line[locationId] = next;
  all[lineId] = line;
  write(KEY_LOCATION_PROFILES, all);
  return next;
}

/** 取某主线某地点的信任总分（非负整数求和） */
function getLocationTrust(lineId, locationId) {
  const p = getLocationProfile(lineId, locationId);
  if (!p || !p.trustEvents) return 0;
  return Object.keys(p.trustEvents).reduce((sum, k) => {
    const v = Number(p.trustEvents[k]);
    return sum + (Number.isInteger(v) && v >= 0 ? v : 0);
  }, 0);
}

/**
 * 开启一个地点任务（幂等：已存在则保留原状态）。
 * @returns {object|null} 更新后的档案；已存在同 taskId 时返回 null
 */
function startLocationTask(lineId, locationId, taskId) {
  if (!lineId || !locationId || !taskId) return null;
  const all = read(KEY_LOCATION_PROFILES, {});
  const line = Object.assign({}, all[lineId]);
  const prev = line[locationId] || {};
  const tasks = Object.assign({}, prev.tasks);
  if (tasks[taskId]) return null;   // 已存在，不重复开启
  tasks[taskId] = { status: 'active', steps: {} };
  const next = Object.assign({}, prev, { tasks, updatedAt: Date.now() });
  line[locationId] = next;
  all[lineId] = line;
  write(KEY_LOCATION_PROFILES, all);
  return next;
}

/** 完成一个任务步骤（幂等，只增不减） */
function completeTaskStep(lineId, locationId, taskId, stepId) {
  if (!lineId || !locationId || !taskId || !stepId) return null;
  const all = read(KEY_LOCATION_PROFILES, {});
  const line = Object.assign({}, all[lineId]);
  const prev = line[locationId] || {};
  const tasks = Object.assign({}, prev.tasks);
  const task = tasks[taskId];
  if (!task) return null;   // 未开启的任务不能推进步骤
  const steps = Object.assign({}, task.steps);
  steps[stepId] = true;
  tasks[taskId] = Object.assign({}, task, { steps });
  const next = Object.assign({}, prev, { tasks, updatedAt: Date.now() });
  line[locationId] = next;
  all[lineId] = line;
  write(KEY_LOCATION_PROFILES, all);
  return next;
}

/** 完成一个地点任务（将状态置为 completed，幂等） */
function completeLocationTask(lineId, locationId, taskId) {
  if (!lineId || !locationId || !taskId) return null;
  const all = read(KEY_LOCATION_PROFILES, {});
  const line = Object.assign({}, all[lineId]);
  const prev = line[locationId] || {};
  const tasks = Object.assign({}, prev.tasks);
  const task = tasks[taskId];
  if (!task) return null;   // 未开启的任务不能直接完成
  tasks[taskId] = Object.assign({}, task, { status: 'completed' });
  const next = Object.assign({}, prev, { tasks, updatedAt: Date.now() });
  line[locationId] = next;
  all[lineId] = line;
  write(KEY_LOCATION_PROFILES, all);
  return next;
}

// ---------- 见证物（witnessItems） ----------

/** 领取一个见证物（幂等：同一 itemId 只授予一次，保留最早 acquiredAt） */
function grantWitnessItem(lineId, itemId, sourceLocationId) {
  if (!lineId || !itemId) return false;
  const all = read(KEY_WITNESS_ITEMS, {});
  const line = Object.assign({}, all[lineId]);
  if (line[itemId]) return false;   // 已拥有，不重复授予
  line[itemId] = {
    sourceLocationId: sourceLocationId || '',
    acquiredAt: Date.now()
  };
  all[lineId] = line;
  write(KEY_WITNESS_ITEMS, all);
  return true;
}

// ---------- 人物理解度（lineInsightEvents） ----------

/** 记录一次人物理解度事件（幂等：同一 eventId 只生效一次，不重复加分） */
function addLineInsightEvent(lineId, eventId, points) {
  if (!lineId || !eventId) return false;
  const p = Number(points);
  if (!Number.isInteger(p) || p < 0) return false;   // 仅非负整数
  const all = read(KEY_LINE_INSIGHT_EVENTS, {});
  const line = Object.assign({}, all[lineId]);
  if (line[eventId] !== undefined) return false;   // 幂等
  line[eventId] = p;
  all[lineId] = line;
  write(KEY_LINE_INSIGHT_EVENTS, all);
  return true;
}

/** 取某主线的人物理解度总分（非负整数求和） */
function getLineInsight(lineId) {
  const all = read(KEY_LINE_INSIGHT_EVENTS, {});
  const line = all[lineId] || {};
  return Object.keys(line).reduce((sum, k) => {
    const v = Number(line[k]);
    return sum + (Number.isInteger(v) && v >= 0 ? v : 0);
  }, 0);
}

// ---------- 云同步支持（供 utils/sync.js 使用） ----------
/** 导出本地全量快照（用于推送到云数据库） */
function snapshot() {
  migrate();
  return {
    states: read(KEY_STATES, {}),
    anchors: read(KEY_ANCHORS, {}),
    records: read(KEY_RECORDS, {}),
    locationStates: read(KEY_LOCATION_STATES, {}),
    locationCheckpoints: read(KEY_LOCATION_CHECKPOINTS, {}),
    locationRecords: read(KEY_LOCATION_RECORDS, {}),
    locationProfiles: read(KEY_LOCATION_PROFILES, {}),
    lineInsightEvents: read(KEY_LINE_INSIGHT_EVENTS, {}),
    witnessItems: read(KEY_WITNESS_ITEMS, {}),
    playerProfiles: read(KEY_PLAYER_PROFILES, {}),
    updatedAt: Date.now()
  };
}

/**
 * 把云端快照**合并**进本地（只增不减，适用于多设备）
 *
 * 合并规则（刻意设计成"永远只会让进度变多，不会变少"）：
 *   · 进度状态按 locked < active < completed 取较优者
 *   · 锚点取并集
 *   · 探究档案按 completedAt 取较新者；云端缺 completedAt 而本地有，则保留本地
 *
 * @param {object} remote 云端快照（结构同 snapshot()）
 * @returns {boolean} 是否发生了实际变更
 */
function mergeRemote(remote) {
  if (!remote || typeof remote !== 'object') return false;
  migrate();

  const RANK = { locked: 0, active: 1, completed: 2 };
  const rank = s => (RANK[s] === undefined ? -1 : RANK[s]);
  let changed = false;

  // ---- 进度：取较优状态 ----
  const localStates = read(KEY_STATES, {});
  const remoteStates = remote.states || {};
  Object.keys(remoteStates).forEach((lineId) => {
    const rl = remoteStates[lineId];
    if (!rl || typeof rl !== 'object') return;
    const ll = Object.assign({}, localStates[lineId]);
    Object.keys(rl).forEach((pid) => {
      if (rank(rl[pid]) > rank(ll[pid])) { ll[pid] = rl[pid]; changed = true; }
    });
    if (Object.keys(ll).length) localStates[lineId] = ll;
  });
  if (changed) {
    try { wx.setStorageSync(KEY_STATES, localStates); } catch (e) { /* 忽略 */ }
  }

  // ---- 锚点：并集 ----
  let anchorChanged = false;
  const localAnchors = read(KEY_ANCHORS, {});
  const remoteAnchors = remote.anchors || {};
  Object.keys(remoteAnchors).forEach((lineId) => {
    const ra = remoteAnchors[lineId];
    if (!ra || typeof ra !== 'object') return;
    const la = Object.assign({}, localAnchors[lineId]);
    Object.keys(ra).forEach((aid) => {
      if (ra[aid] && !la[aid]) { la[aid] = true; anchorChanged = true; }
    });
    if (Object.keys(la).length) localAnchors[lineId] = la;
  });
  if (anchorChanged) {
    try { wx.setStorageSync(KEY_ANCHORS, localAnchors); } catch (e) { /* 忽略 */ }
  }

  // ---- 探究档案：按 completedAt 取较新者，同时保留最早的诗笺获得时间 ----
  let recChanged = false;
  const localRecs = read(KEY_RECORDS, {});
  const remoteRecs = remote.records || {};
  Object.keys(remoteRecs).forEach((lineId) => {
    const rr = remoteRecs[lineId];
    if (!rr || typeof rr !== 'object') return;
    const lr = Object.assign({}, localRecs[lineId]);
    Object.keys(rr).forEach((pid) => {
      const incoming = rr[pid];
      const mine = lr[pid];
      if (!incoming || typeof incoming !== 'object') return;
      const normalize = (rec) => {
        const next = Object.assign({}, rec);
        if (!next.earnedAt && next.completedAt) next.earnedAt = next.completedAt;
        return next;
      };
      if (!mine) { lr[pid] = normalize(incoming); recChanged = true; return; }
      const a = Number(mine.completedAt) || 0;
      const b = Number(incoming.completedAt) || 0;
      const chosen = normalize(b > a ? incoming : mine);
      const earned = [mine.earnedAt || mine.completedAt, incoming.earnedAt || incoming.completedAt]
        .map(Number)
        .filter(Boolean);
      if (earned.length) chosen.earnedAt = Math.min.apply(null, earned);
      if (JSON.stringify(chosen) !== JSON.stringify(mine)) {
        lr[pid] = chosen;
        recChanged = true;
      }
    });
    if (Object.keys(lr).length) localRecs[lineId] = lr;
  });
  if (recChanged) {
    try { wx.setStorageSync(KEY_RECORDS, localRecs); } catch (e) { /* 忽略 */ }
  }

  // ---- 地点状态：与时期状态同规则（locked < active < completed 取较优）----
  let locStateChanged = false;
  const localLocStates = read(KEY_LOCATION_STATES, {});
  const remoteLocStates = remote.locationStates || {};
  Object.keys(remoteLocStates).forEach((lineId) => {
    const rl = remoteLocStates[lineId];
    if (!rl || typeof rl !== 'object') return;
    const ll = Object.assign({}, localLocStates[lineId]);
    Object.keys(rl).forEach((lid) => {
      if (rank(rl[lid]) > rank(ll[lid])) { ll[lid] = rl[lid]; locStateChanged = true; }
    });
    if (Object.keys(ll).length) localLocStates[lineId] = ll;
  });
  if (locStateChanged) {
    try { wx.setStorageSync(KEY_LOCATION_STATES, localLocStates); } catch (e) { /* 忽略 */ }
  }

  // ---- 地点检查点：按 updatedAt 取较新 ----
  let locCkptChanged = false;
  const localLocCkpts = read(KEY_LOCATION_CHECKPOINTS, {});
  const remoteLocCkpts = remote.locationCheckpoints || {};
  Object.keys(remoteLocCkpts).forEach((lineId) => {
    const rl = remoteLocCkpts[lineId];
    if (!rl || typeof rl !== 'object') return;
    const ll = Object.assign({}, localLocCkpts[lineId]);
    Object.keys(rl).forEach((lid) => {
      const incoming = rl[lid];
      const mine = ll[lid];
      if (!incoming || typeof incoming !== 'object') return;
      if (!mine || (Number(incoming.updatedAt) || 0) > (Number(mine.updatedAt) || 0)) {
        ll[lid] = incoming;
        locCkptChanged = true;
      }
    });
    if (Object.keys(ll).length) localLocCkpts[lineId] = ll;
  });
  if (locCkptChanged) {
    try { wx.setStorageSync(KEY_LOCATION_CHECKPOINTS, localLocCkpts); } catch (e) { /* 忽略 */ }
  }

  // ---- 地点记录：按 completedAt 取较新，保留最早 earnedAt ----
  let locRecChanged = false;
  const localLocRecs = read(KEY_LOCATION_RECORDS, {});
  const remoteLocRecs = remote.locationRecords || {};
  Object.keys(remoteLocRecs).forEach((lineId) => {
    const rr = remoteLocRecs[lineId];
    if (!rr || typeof rr !== 'object') return;
    const lr = Object.assign({}, localLocRecs[lineId]);
    Object.keys(rr).forEach((lid) => {
      const incoming = rr[lid];
      const mine = lr[lid];
      if (!incoming || typeof incoming !== 'object') return;
      const normalize = (rec) => {
        const next = Object.assign({}, rec);
        if (!next.earnedAt && next.completedAt) next.earnedAt = next.completedAt;
        return next;
      };
      if (!mine) { lr[lid] = normalize(incoming); locRecChanged = true; return; }
      const a = Number(mine.completedAt) || 0;
      const b = Number(incoming.completedAt) || 0;
      const chosen = normalize(b > a ? incoming : mine);
      const earned = [mine.earnedAt || mine.completedAt, incoming.earnedAt || incoming.completedAt]
        .map(Number).filter(Boolean);
      if (earned.length) chosen.earnedAt = Math.min.apply(null, earned);
      if (JSON.stringify(chosen) !== JSON.stringify(mine)) {
        lr[lid] = chosen;
        locRecChanged = true;
      }
    });
    if (Object.keys(lr).length) localLocRecs[lineId] = lr;
  });
  if (locRecChanged) {
    try { wx.setStorageSync(KEY_LOCATION_RECORDS, localLocRecs); } catch (e) { /* 忽略 */ }
  }

  // ---- 地点身份档案：trustEvents 取并集（同 eventId 取较大 points）；task steps 取并集；completed 高于 active；roleId 冲突保留更早 chosenAt ----
  let profChanged = false;
  const localProfs = read(KEY_LOCATION_PROFILES, {});
  const remoteProfs = remote.locationProfiles || {};
  Object.keys(remoteProfs).forEach((lineId) => {
    const rl = remoteProfs[lineId];
    if (!rl || typeof rl !== 'object') return;
    const ll = Object.assign({}, localProfs[lineId]);
    Object.keys(rl).forEach((lid) => {
      const incoming = rl[lid];
      if (!incoming || typeof incoming !== 'object') return;
      const mine = ll[lid] || {};
      const merged = mergeProfile(mine, incoming);
      if (JSON.stringify(merged) !== JSON.stringify(mine)) {
        ll[lid] = merged;
        profChanged = true;
      }
    });
    if (Object.keys(ll).length) localProfs[lineId] = ll;
  });
  if (profChanged) {
    try { wx.setStorageSync(KEY_LOCATION_PROFILES, localProfs); } catch (e) { /* 忽略 */ }
  }

  // ---- 人物理解度事件：取并集，同 eventId 取较大 points ----
  let insightChanged = false;
  const localInsight = read(KEY_LINE_INSIGHT_EVENTS, {});
  const remoteInsight = remote.lineInsightEvents || {};
  Object.keys(remoteInsight).forEach((lineId) => {
    const rl = remoteInsight[lineId];
    if (!rl || typeof rl !== 'object') return;
    const ll = Object.assign({}, localInsight[lineId]);
    Object.keys(rl).forEach((eid) => {
      const p = Number(rl[eid]);
      const cur = Number(ll[eid]);
      if (Number.isInteger(p) && p >= 0 && (ll[eid] === undefined || p > cur)) {
        ll[eid] = p;
        insightChanged = true;
      }
    });
    if (Object.keys(ll).length) localInsight[lineId] = ll;
  });
  if (insightChanged) {
    try { wx.setStorageSync(KEY_LINE_INSIGHT_EVENTS, localInsight); } catch (e) { /* 忽略 */ }
  }

  // ---- 见证物：取并集（同一 itemId 保留更早 acquiredAt） ----
  let witnessChanged = false;
  const localWitness = read(KEY_WITNESS_ITEMS, {});
  const remoteWitness = remote.witnessItems || {};
  Object.keys(remoteWitness).forEach((lineId) => {
    const rl = remoteWitness[lineId];
    if (!rl || typeof rl !== 'object') return;
    const ll = Object.assign({}, localWitness[lineId]);
    Object.keys(rl).forEach((iid) => {
      const incoming = rl[iid];
      if (!incoming || typeof incoming !== 'object') return;
      const mine = ll[iid];
      if (!mine) {
        ll[iid] = incoming;
        witnessChanged = true;
        return;
      }
      const a = Number(mine.acquiredAt) || 0;
      const b = Number(incoming.acquiredAt) || 0;
      if (b > 0 && (a === 0 || b < a)) {
        ll[iid] = incoming;
        witnessChanged = true;
      }
    });
    if (Object.keys(ll).length) localWitness[lineId] = ll;
  });
  if (witnessChanged) {
    try { wx.setStorageSync(KEY_WITNESS_ITEMS, localWitness); } catch (e) { /* 忽略 */ }
  }

  // ---- 玩家角色档案：已确认优先、updatedAt 取较新、createdAt 取最早（与云端 merge.js 同规则） ----
  // 人物线白名单：只接受 dufu/libai/sushi，忽略云端伪造的未知 lineId。
  let playerProfChanged = false;
  const localPlayerProfs = read(KEY_PLAYER_PROFILES, {});
  const remotePlayerProfs = remote.playerProfiles || {};
  Object.keys(remotePlayerProfs).forEach((lineId) => {
    if (!isPlayerProfileLine(lineId)) return;   // 拒绝未知人物线（伪造 lineId 不落库）
    const incoming = remotePlayerProfs[lineId];
    if (!incoming || typeof incoming !== 'object') return;
    const mine = localPlayerProfs[lineId];
    const merged = playerProfile.mergePlayerProfile(mine, incoming);
    if (!merged) return;   // 拒绝云端脏数据
    if (JSON.stringify(merged) !== JSON.stringify(mine)) {
      localPlayerProfs[lineId] = merged;
      playerProfChanged = true;
    }
  });
  if (playerProfChanged) {
    try { wx.setStorageSync(KEY_PLAYER_PROFILES, localPlayerProfs); } catch (e) { /* 忽略 */ }
  }

  // ---- 旧泰山身份迁移补全（幂等）：云端旧快照晚到（携带 locationProfiles.dufu.taishan.roleId
  //      但不含 playerProfiles）时补建 confirmed:false 草稿；已有合法档案时不做任何事 ----
  const playerMigrated = migrateLegacyPlayerProfile();

  if (changed || anchorChanged || recChanged || locStateChanged || locCkptChanged || locRecChanged || profChanged || insightChanged || witnessChanged || playerProfChanged || playerMigrated) notify();
  return changed || anchorChanged || recChanged || locStateChanged || locCkptChanged || locRecChanged || profChanged || insightChanged || witnessChanged || playerProfChanged || playerMigrated;
}

/**
 * 合并两个地点身份档案（纯函数，供 mergeRemote 与云端 merge.js 复用同规则）。
 * 规则：
 *   · roleId 冲突时保留更早 chosenAt 的记录；
 *   · trustEvents 取并集，同 eventId 取较大 points；
 *   · tasks 取并集，steps 取并集，status 取 completed > active；
 *   · updatedAt 取较新。
 */
function mergeProfile(a, b) {
  const RANK_TASK = { active: 1, completed: 2 };
  const rankTask = s => (RANK_TASK[s] === undefined ? 0 : RANK_TASK[s]);
  const out = {};

  // roleId / chosenAt：保留更早 chosenAt
  const aChosen = Number(a.chosenAt) || 0;
  const bChosen = Number(b.chosenAt) || 0;
  let roleRec;
  if (a.roleId && b.roleId) {
    roleRec = (bChosen > 0 && bChosen < aChosen) ? b : a;
  } else {
    roleRec = a.roleId ? a : b;
  }
  if (roleRec && roleRec.roleId) {
    out.roleId = roleRec.roleId;
    out.chosenAt = roleRec.chosenAt;
  }

  // trustEvents 并集，取较大 points
  const te = {};
  [a, b].forEach((src) => {
    Object.keys((src && src.trustEvents) || {}).forEach((eid) => {
      const p = Number(src.trustEvents[eid]);
      if (!Number.isInteger(p) || p < 0) return;
      if (te[eid] === undefined || p > te[eid]) te[eid] = p;
    });
  });
  if (Object.keys(te).length) out.trustEvents = te;

  // tasks 并集：steps 并集，status 取较优
  const tasks = {};
  [a, b].forEach((src) => {
    Object.keys((src && src.tasks) || {}).forEach((tid) => {
      const t = src.tasks[tid];
      if (!t || typeof t !== 'object') return;
      const acc = tasks[tid] || (tasks[tid] = { status: 'active', steps: {} });
      if (rankTask(t.status) > rankTask(acc.status)) acc.status = t.status;
      Object.keys(t.steps || {}).forEach((sid) => { acc.steps[sid] = true; });
    });
  });
  if (Object.keys(tasks).length) out.tasks = tasks;

  // updatedAt 取较新
  const ua = Number(a.updatedAt) || 0;
  const ub = Number(b.updatedAt) || 0;
  out.updatedAt = (ub > ua ? ub : ua) || Date.now();

  return out;
}

module.exports = {
  // 进度
  getStates,
  setState,
  computeStates,
  completePeriod,
  // 地点级进度
  getLocationStates,
  setLocationState,
  computeLocationStates,
  completeLocation,
  getLocationCheckpoint,
  saveLocationCheckpoint,
  clearLocationCheckpoint,
  getLocationRecord,
  getAllLocationRecords,
  saveLocationRecord,
  getSelectedLine,
  setSelectedLine,
  migrateLocationProgress,
  PROGRESS_SCHEMA_VERSION,
  // 地点身份 / 信任 / 任务 / 人物理解 / 见证物
  getLocationProfile,
  chooseLocationRole,
  addTrustEvent,
  getLocationTrust,
  startLocationTask,
  completeTaskStep,
  completeLocationTask,
  grantWitnessItem,
  addLineInsightEvent,
  getLineInsight,
  mergeProfile,
  // 玩家角色档案
  getPlayerProfile,
  hasInvalidPlayerProfile,
  savePlayerProfile,
  clearPlayerProfile,
  isPlayerProfileLine,
  migrateLegacyPlayerProfile,
  LEGACY_ROLE_LINE,
  LEGACY_ROLE_LOCATION,
  // 锚点
  getAnchors,
  addAnchor,
  // 档案
  getAllRecords,
  getLineRecords,
  getRecord,
  saveRecord,
  // 云同步
  snapshot,
  mergeRemote,
  onChange,
  // 维护
  migrate,
  resetAll,
  KEYS: { KEY_STATES, KEY_ANCHORS, KEY_RECORDS, KEY_LOCATION_STATES, KEY_LOCATION_CHECKPOINTS, KEY_LOCATION_RECORDS, KEY_SELECTED_LINE, KEY_SCHEMA, KEY_LOCATION_PROFILES, KEY_LINE_INSIGHT_EVENTS, KEY_WITNESS_ITEMS, KEY_PLAYER_PROFILES }
};
