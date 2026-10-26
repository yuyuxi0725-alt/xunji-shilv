// cloudfunctions/story/merge.js —— 进度快照的合并规则（纯函数，无云环境依赖，可单元测试）
//
// 与前端 `miniprogram/utils/progress.js` 的 `mergeRemote` **同规则**：
//   只增不减 —— 状态按 locked < active < completed 取较优；锚点取并集；
//   探究档案按 completedAt 取较新者，同时保留最早的 earnedAt。
//
// 为什么两端都要合并、而不只在一端做：
//   · 服务端合并：防止 A 设备上传时把 B 设备已存的进度覆盖掉
//   · 客户端合并：防止拉取云端数据时把本地（可能尚未上传）的进度覆盖掉
//   两端同规则，才能保证反复拉/推之后状态收敛、不丢数据。
//
// `tools/test-sync.js` 会用同一批输入同时跑这两个实现并比对结果，防止两端规则跑偏。

const RANK = { locked: 0, active: 1, completed: 2 };

function rank(s) {
  return RANK[s] === undefined ? -1 : RANK[s];
}

function mergeStates(a, b) {
  const out = {};
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((pid) => {
        if (rank(line[pid]) > rank(acc[pid])) acc[pid] = line[pid];
      });
    });
  });
  return out;
}

function mergeAnchors(a, b) {
  const out = {};
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((aid) => {
        if (line[aid]) acc[aid] = true;
      });
    });
  });
  return out;
}

function mergeRecords(a, b) {
  const out = {};
  const normalize = (rec) => {
    const next = Object.assign({}, rec);
    if (!next.earnedAt && next.completedAt) next.earnedAt = next.completedAt;
    return next;
  };
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((pid) => {
        const rec = line[pid];
        if (!rec || typeof rec !== 'object') return;
        const cur = acc[pid];
        if (!cur) { acc[pid] = normalize(rec); return; }
        const t1 = Number(cur.completedAt) || 0;
        const t2 = Number(rec.completedAt) || 0;
        const chosen = normalize(t2 > t1 ? rec : cur);
        const earned = [cur.earnedAt || cur.completedAt, rec.earnedAt || rec.completedAt]
          .map(Number)
          .filter(Boolean);
        if (earned.length) chosen.earnedAt = Math.min.apply(null, earned);
        acc[pid] = chosen;
      });
    });
  });
  return out;
}

/** 合并两个快照（base 为已有、incoming 为新上传） */
function mergeSnapshot(base, incoming) {
  return {
    states: mergeStates((base && base.states) || {}, (incoming && incoming.states) || {}),
    anchors: mergeAnchors((base && base.anchors) || {}, (incoming && incoming.anchors) || {}),
    records: mergeRecords((base && base.records) || {}, (incoming && incoming.records) || {}),
    // 地点模式字段：与时期同规则
    locationStates: mergeStates((base && base.locationStates) || {}, (incoming && incoming.locationStates) || {}),
    locationCheckpoints: mergeCheckpoints((base && base.locationCheckpoints) || {}, (incoming && incoming.locationCheckpoints) || {}),
    locationRecords: mergeRecords((base && base.locationRecords) || {}, (incoming && incoming.locationRecords) || {}),
    // 新增：地点身份 / 人物理解度 / 见证物
    locationProfiles: mergeProfiles((base && base.locationProfiles) || {}, (incoming && incoming.locationProfiles) || {}),
    lineInsightEvents: mergeInsightEvents((base && base.lineInsightEvents) || {}, (incoming && incoming.lineInsightEvents) || {}),
    witnessItems: mergeWitnessItems((base && base.witnessItems) || {}, (incoming && incoming.witnessItems) || {}),
    // 新增：玩家角色档案（杜甫线，独立于账号昵称）
    playerProfiles: mergePlayerProfiles((base && base.playerProfiles) || {}, (incoming && incoming.playerProfiles) || {})
  };
}

// 地点检查点：按 updatedAt 取较新
function mergeCheckpoints(a, b) {
  const out = {};
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((lid) => {
        const rec = line[lid];
        if (!rec || typeof rec !== 'object') return;
        const cur = acc[lid];
        if (!cur) { acc[lid] = rec; return; }
        const t1 = Number(cur.updatedAt) || 0;
        const t2 = Number(rec.updatedAt) || 0;
        if (t2 > t1) acc[lid] = rec;
      });
    });
  });
  return out;
}

// ============ 新增字段：地点身份 / 人物理解度 / 见证物 ============
// 规则与前端 progress.js 的 mergeRemote / mergeProfile 完全一致，保证两端收敛。

/**
 * 合并两个地点身份档案（纯函数，幂等且满足交换性）。
 *   · roleId 冲突保留更早 chosenAt；
 *   · trustEvents 取并集，同 eventId 取较大 points；
 *   · tasks 取并集，steps 取并集，status 取 completed > active；
 *   · updatedAt 取较新。
 */
function mergeProfile(a, b) {
  const RANK_TASK = { active: 1, completed: 2 };
  const rankTask = s => (RANK_TASK[s] === undefined ? 0 : RANK_TASK[s]);
  const out = {};

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

  const te = {};
  [a, b].forEach((src) => {
    Object.keys((src && src.trustEvents) || {}).forEach((eid) => {
      const p = Number(src.trustEvents[eid]);
      if (!Number.isInteger(p) || p < 0) return;
      if (te[eid] === undefined || p > te[eid]) te[eid] = p;
    });
  });
  if (Object.keys(te).length) out.trustEvents = te;

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

  const ua = Number(a.updatedAt) || 0;
  const ub = Number(b.updatedAt) || 0;
  out.updatedAt = (ub > ua ? ub : ua) || Date.now();

  return out;
}

// 地点身份档案：按主线 × 地点 合并
function mergeProfiles(a, b) {
  const out = {};
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((lid) => {
        const rec = line[lid];
        if (!rec || typeof rec !== 'object') return;
        const cur = acc[lid];
        acc[lid] = cur ? mergeProfile(cur, rec) : Object.assign({}, rec);
      });
    });
  });
  return out;
}

// 人物理解度事件：取并集，同 eventId 取较大 points
function mergeInsightEvents(a, b) {
  const out = {};
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((eid) => {
        const p = Number(line[eid]);
        if (!Number.isInteger(p) || p < 0) return;
        if (acc[eid] === undefined || p > acc[eid]) acc[eid] = p;
      });
    });
  });
  return out;
}

// 见证物：取并集，同一 itemId 保留更早 acquiredAt
function mergeWitnessItems(a, b) {
  const out = {};
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((iid) => {
        const rec = line[iid];
        if (!rec || typeof rec !== 'object') return;
        const cur = acc[iid];
        if (!cur) { acc[iid] = Object.assign({}, rec); return; }
        const t1 = Number(cur.acquiredAt) || 0;
        const t2 = Number(rec.acquiredAt) || 0;
        if (t2 > 0 && (t1 === 0 || t2 < t1)) acc[iid] = Object.assign({}, rec);
      });
    });
  });
  return out;
}

// ============ 玩家角色档案（杜甫/李白/苏轼三线） ============
// 规则与前端 utils/player-profile.js 的 mergePlayerProfile 完全一致，保证两端收敛。
// 只存 version/avatarId/displayName/confirmed/createdAt/updatedAt，不存职业/信任/能力。
// 人物线白名单：只接受 dufu/libai/sushi，忽略伪造的未知 lineId。

const PLAYER_PROFILE_VERSION = 1;
const PLAYER_PROFILE_LINES = { dufu: true, libai: true, sushi: true };
const PLAYER_AVATAR_IDS = { avatar01: true, avatar02: true, avatar03: true };
const PLAYER_PROFILE_KEYS = ['version', 'avatarId', 'displayName', 'confirmed', 'createdAt', 'updatedAt'];
const PLAYER_NAME_CHAR_RE = /^[a-zA-Z0-9\u4e00-\u9fff]$/;
const PLAYER_CONTROL_CHAR_RE = /[\u0000-\u001f\u007f]/;

// ============ 可注入时钟 + 未来时间戳规范化（与 utils/player-profile.js 同规则） ============
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

let _clock = null;
function setClock(fn) { _clock = (typeof fn === 'function') ? fn : null; }
function resetClock() { _clock = null; }
function nowMs() { return _clock ? _clock() : Date.now(); }
function clampTimestamp(ts, now) {
  if (!Number.isFinite(ts)) return ts;
  const n = (now === undefined ? nowMs() : now);
  const cap = n + MAX_FUTURE_SKEW_MS;
  return ts > cap ? n : ts;
}

function normalizePlayerName(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

function isValidPlayerName(name) {
  if (typeof name !== 'string' || name.length === 0) return false;
  if (name !== normalizePlayerName(name)) return false;
  if (PLAYER_CONTROL_CHAR_RE.test(name)) return false;
  const chars = Array.from(name);
  if (chars.length > 8) return false;
  return chars.every(ch => PLAYER_NAME_CHAR_RE.test(ch));
}

function isValidPlayerProfile(p) {
  if (!p || typeof p !== 'object') return false;
  if (Object.keys(p).some(k => PLAYER_PROFILE_KEYS.indexOf(k) < 0)) return false;
  if (p.version !== PLAYER_PROFILE_VERSION) return false;
  if (!PLAYER_AVATAR_IDS[p.avatarId]) return false;
  if (!isValidPlayerName(p.displayName)) return false;
  if (typeof p.confirmed !== 'boolean') return false;
  const ca = p.createdAt;
  const ua = p.updatedAt;
  if (!Number.isFinite(ca) || !Number.isInteger(ca) || ca < 0) return false;
  if (!Number.isFinite(ua) || !Number.isInteger(ua) || ua < ca) return false;
  return true;
}

function normalizePlayerProfile(p, now) {
  if (!isValidPlayerProfile(p)) return null;
  const n = (now === undefined ? nowMs() : now);
  let createdAt = clampTimestamp(p.createdAt, n);
  let updatedAt = clampTimestamp(p.updatedAt, n);
  if (updatedAt < createdAt) updatedAt = createdAt;
  return {
    version: p.version,
    avatarId: p.avatarId,
    displayName: p.displayName,
    confirmed: p.confirmed,
    createdAt,
    updatedAt
  };
}

/**
 * 合并两份玩家角色档案（幂等且满足交换性）：
 *   · 非法档案按 null；已确认优先于待确认；同为已确认按 updatedAt 取较新一整份；
 *   · updatedAt 相同时按规范化字段排序打破平局；createdAt 保留最早有效值。
 */
function mergePlayerProfile(a, b, now) {
  const n = (now === undefined ? nowMs() : now);
  const va = normalizePlayerProfile(a, n);
  const vb = normalizePlayerProfile(b, n);
  if (!va && !vb) return null;
  if (!va) return Object.assign({}, vb);
  if (!vb) return Object.assign({}, va);

  let chosen;
  const ca = va.confirmed !== false;
  const cb = vb.confirmed !== false;
  if (ca !== cb) {
    chosen = ca ? va : vb;
  } else {
    const ua = Number(va.updatedAt) || 0;
    const ub = Number(vb.updatedAt) || 0;
    if (ua !== ub) {
      chosen = ua > ub ? va : vb;
    } else {
      const sa = JSON.stringify([va.avatarId, va.displayName, Number(va.createdAt) || 0]);
      const sb = JSON.stringify([vb.avatarId, vb.displayName, Number(vb.createdAt) || 0]);
      chosen = sa >= sb ? va : vb;
    }
  }
  const out = Object.assign({}, chosen);
  const earned = [Number(va.createdAt), Number(vb.createdAt)].filter(v => Number.isFinite(v) && v > 0);
  if (earned.length) out.createdAt = Math.min.apply(null, earned);
  return out;
}

// 玩家角色档案：按主线合并（只接受 dufu/libai/sushi）
function mergePlayerProfiles(a, b) {
  const out = {};
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      if (!PLAYER_PROFILE_LINES[lineId]) return;   // 忽略未知/伪造人物线
      const rec = src[lineId];
      if (!rec || typeof rec !== 'object') return;
      const cur = out[lineId];
      const merged = mergePlayerProfile(cur, rec);
      if (merged) out[lineId] = merged;
    });
  });
  return out;
}

/**
 * 一份空快照（clearState 用）。
 * 关键：必须包含 playerProfiles 空对象——清空后云端不再有任何角色档案。
 * 所有字段与 mergeSnapshot 的输出字段一一对应，避免字段缺失被误判为「旧客户端未提供」。
 */
function emptySnapshot() {
  return {
    states: {},
    anchors: {},
    records: {},
    locationStates: {},
    locationCheckpoints: {},
    locationRecords: {},
    locationProfiles: {},
    lineInsightEvents: {},
    witnessItems: {},
    playerProfiles: {},
    updatedAt: Date.now()
  };
}

module.exports = { RANK, rank, mergeStates, mergeAnchors, mergeRecords, mergeCheckpoints, mergeProfile, mergeProfiles, mergeInsightEvents, mergeWitnessItems, mergePlayerProfile, mergePlayerProfiles, mergeSnapshot, emptySnapshot, PLAYER_PROFILE_LINES, MAX_FUTURE_SKEW_MS, setClock, resetClock, nowMs, clampTimestamp };
