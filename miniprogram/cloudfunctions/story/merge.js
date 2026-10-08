// cloudfunctions/story/merge.js —— 进度快照的合并规则（纯函数，无云环境依赖，可单元测试）
//
// 与前端 `miniprogram/utils/progress.js` 的 `mergeRemote` **同规则**：
//   只增不减 —— 状态按 locked < active < completed 取较优；锚点取并集；
//   探究档案按 completedAt 取较新者。
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
  [a, b].forEach((src) => {
    Object.keys(src || {}).forEach((lineId) => {
      const line = src[lineId];
      if (!line || typeof line !== 'object') return;
      const acc = out[lineId] || (out[lineId] = {});
      Object.keys(line).forEach((pid) => {
        const rec = line[pid];
        if (!rec || typeof rec !== 'object') return;
        const cur = acc[pid];
        if (!cur) { acc[pid] = rec; return; }
        const t1 = Number(cur.completedAt) || 0;
        const t2 = Number(rec.completedAt) || 0;
        if (t2 > t1) acc[pid] = rec;
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
    records: mergeRecords((base && base.records) || {}, (incoming && incoming.records) || {})
  };
}

module.exports = { RANK, rank, mergeStates, mergeAnchors, mergeRecords, mergeSnapshot };
