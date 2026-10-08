// utils/progress.js —— 统一的进度 / 锚点 / 探究档案存储层
//
// 为什么要这一层：
//   旧版把进度存成扁平的 { p1: 'completed', p2: 'active' }，而杜甫线和李白线
//   的时期 id 都是 p1..p5 —— 通关杜甫 p1 会把李白 p1 也标成已完成（真实 bug）。
//   本模块把所有状态改为「按主线分组」的二级结构，并负责旧数据的一次性迁移。
//
// 存储结构（三个 key 全部按 storyId 分组）：
//   questStates      { [lineId]: { [periodId]: 'locked'|'active'|'completed' } }
//   collectedAnchors { [lineId]: { [anchorId]: true } }
//   questRecords     { [lineId]: { [periodId]: { ...探究档案 } } }
//
// questRecords[lineId][periodId] 的字段（供「行迹地图」与「我的诗笺」消费）：
//   completedAt  Number  通关时间戳(ms)
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

const KEY_STATES = 'questStates';
const KEY_ANCHORS = 'collectedAnchors';
const KEY_RECORDS = 'questRecords';
const KEY_MIGRATED = 'progressSchemaV2';

// 已知主线 id（迁移时用来判断旧扁平数据属于哪条线）
const KNOWN_LINES = ['dufu', 'libai', 'sushi'];

// ---------- 内部读写 ----------

function read(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    return (v && typeof v === 'object') ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

function write(key, val) {
  try {
    wx.setStorageSync(key, val);
  } catch (e) {
    console.warn('[progress] 写入失败', key, e);
  }
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
    wx.setStorageSync(KEY_MIGRATED, true);
  } catch (e) {
    console.warn('[progress] 清除失败', e);
  }
}

module.exports = {
  // 进度
  getStates,
  setState,
  computeStates,
  completePeriod,
  // 锚点
  getAnchors,
  addAnchor,
  // 档案
  getAllRecords,
  getLineRecords,
  getRecord,
  saveRecord,
  // 维护
  migrate,
  resetAll,
  KEYS: { KEY_STATES, KEY_ANCHORS, KEY_RECORDS }
};
