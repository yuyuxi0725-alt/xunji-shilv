// utils/sync.js —— 进度云同步（**尽力而为**，失败绝不影响本地使用）
//
// 设计原则（重要）：
//   1. 本地存储永远是唯一真相源。云同步只在"顺手"时发生，任何失败都静默降级。
//   2. 合并只增不减（见 progress.mergeRemote）：换设备、多设备并发都不会把进度弄丢。
//   3. 走 story 云函数而不是前端直连数据库：users 文档由 login 云函数（服务端）创建，
//      不带客户端 _openid，在默认"仅创建者可读写"权限下前端读不到自己的档案。
//
// 调用时机：
//   · app.js 静默登录成功后 init() → 订阅本地变更 + 首次拉取合并
//   · 本地任何一次进度/锚点/档案写入 → progress.onChange → 防抖上传
//   · 「我的」页「重新开始」→ resetCloud()（必须显式清云端，否则下次拉取会把进度合并回来）

const progress = require('./progress');

const FN = 'story';
const PUSH_DEBOUNCE = 2500;   // 本地变更后延迟上传，合并短时间内的多次写入

let inited = false;
let timer = null;
let busy = false;     // 正在上传
let dirty = false;    // 上传期间又有新变更 → 传完再补一次

/** 调用云函数；任何异常都解析为 null，绝不 reject、绝不打断调用方 */
function cloudCall(data) {
  return new Promise((resolve) => {
    if (!wx.cloud || !wx.cloud.callFunction) { resolve(null); return; }
    try {
      wx.cloud.callFunction({
        name: FN,
        data,
        success: (res) => resolve((res && res.result) || null),
        fail: (err) => {
          console.warn('[sync] 云函数调用失败（本地进度不受影响）', err && err.errMsg);
          resolve(null);
        }
      });
    } catch (e) {
      console.warn('[sync] 调用异常（本地进度不受影响）', e);
      resolve(null);
    }
  });
}

/**
 * 拉取云端进度并合并到本地（并集，只会让进度变多）
 * @returns {Promise<boolean>} 是否发生了实际变更
 */
async function pull() {
  const res = await cloudCall({ action: 'getState' });
  if (!res || res.code !== 0) return false;
  const snap = res.data && res.data.snapshot;
  if (!snap) return false;
  try {
    const changed = progress.mergeRemote(snap);
    if (changed) console.log('[sync] 已合并云端进度');
    return changed;
  } catch (e) {
    console.warn('[sync] 合并失败（已忽略）', e);
    return false;
  }
}

/** 上传本地进度（防抖 + 串行化；失败静默，下次变更会自然重试） */
function schedulePush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    push();
  }, PUSH_DEBOUNCE);
}

async function push() {
  if (busy) { dirty = true; return; }
  busy = true;
  try {
    const snapshot = progress.snapshot();
    const res = await cloudCall({ action: 'saveState', snapshot });
    if (!res || res.code !== 0 || !(res.data && res.data.ok)) {
      console.warn('[sync] 上传未成功（本地进度不受影响，下次变更会重试）');
    }
  } catch (e) {
    console.warn('[sync] 上传异常（已忽略）', e);
  } finally {
    busy = false;
    if (dirty) { dirty = false; push(); }
  }
}

/** 初始化：迁移旧数据 → 订阅本地变更 → 首次拉取合并。幂等。 */
function init() {
  if (inited) return;
  inited = true;
  try { progress.migrate(); } catch (e) { /* 忽略 */ }
  progress.onChange(schedulePush);
  pull();
}

/**
 * 清空云端进度（「重新开始」时与 progress.resetAll() 配合调用）
 * 注意：不能用空快照 saveState 代替——服务端合并是"只增不减"的，清不掉。
 */
async function resetCloud() {
  const res = await cloudCall({ action: 'clearState' });
  return !!(res && res.code === 0 && res.data && res.data.ok);
}

module.exports = { init, pull, push, schedulePush, resetCloud };
