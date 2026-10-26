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
const stories = require('./stories/index');

const FN = 'story';
const PUSH_DEBOUNCE = 2500;   // 本地变更后延迟上传，合并短时间内的多次写入

let inited = false;
let active = false;
let timer = null;
let busy = false;     // 正在上传
let dirty = false;    // 上传期间又有新变更 → 传完再补一次
let unsubscribe = null;
let generation = 0;   // stop 后让尚未返回的 pull 结果失效，避免删除后又写回本地
let idleWaiters = [];

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
async function pull(expectedGeneration) {
  if (!active) return false;
  const token = expectedGeneration === undefined ? generation : expectedGeneration;
  const res = await cloudCall({ action: 'getState' });
  if (!active || token !== generation) return false;
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
  if (!active) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    push();
  }, PUSH_DEBOUNCE);
}

async function push() {
  if (!active) return false;
  if (busy) { dirty = true; return; }
  busy = true;
  try {
    const snapshot = progress.snapshot();
    const res = await cloudCall({ action: 'saveState', snapshot });
    if (!res || res.code !== 0 || !(res.data && res.data.ok)) {
      console.warn('[sync] 上传未成功（本地进度不受影响，下次变更会重试）');
    } else if (res.data.snapshot) {
      // 吸收服务端权威快照（尤其 playerProfiles 的合并结果），避免本地显示刚编辑的值而云端保留另一份。
      // mergeRemote 只增不减；若此刻已被 stop()（active=false），仍允许吸收——stop→waitForIdle→resetAll
      // 的顺序保证吸收发生在本地重置之前，不会把已清数据写回。
      try {
        const absorbed = progress.mergeRemote(res.data.snapshot);
        if (absorbed) console.log('[sync] 已吸收服务端权威快照');
      } catch (e) {
        console.warn('[sync] 吸收权威快照失败（已忽略）', e);
      }
    }
  } catch (e) {
    console.warn('[sync] 上传异常（已忽略）', e);
  } finally {
    busy = false;
    const waiters = idleWaiters;
    idleWaiters = [];
    waiters.forEach(resolve => resolve());
    if (dirty && active) { dirty = false; push(); }
  }
}

/** 初始化：迁移旧数据 → 订阅本地变更 → 首次拉取合并。幂等。 */
function init() {
  if (inited) return;
  inited = true;
  active = true;
  generation += 1;
  try { progress.migrate(); } catch (e) { /* 忽略 */ }
  // 地点模式迁移：三条线的旧时期进度与旧锚点 → 当前地点状态（幂等）。
  try {
    progress.migrateLocationProgress([
      {
        lineId: 'dufu',
        locations: stories.getLocations('dufu'),
        periodOrder: ['p1', 'p2', 'p3', 'p4']
      },
      {
        lineId: 'libai',
        locations: stories.getLocations('libai'),
        periodOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
        anchorMap: {
          l1: 'lb1', l2: 'lb2', l3: 'lb2', l4: 'lb3', l5: 'lb5', l6: 'lb6',
          l7: 'lb13', l8: 'lb7', l9: 'lb8', l10: 'lb9', l11: 'lb10', l12: 'lb6',
          l13: ['lb11', 'lb14'], l14: 'lb12', l15: 'lb13', l16: 'lb15', l17: 'lb18',
          l18: ['lb19', 'lb20'], l19: 'lb21', l20: 'lb22',
          lb8: 'lb11', lb9: 'lb8', lb10: 'lb9', lb11: 'lb10',
          lb18: 'lb20', lb19: 'lb18', lb20: 'lb19'
        }
      },
      {
        lineId: 'sushi',
        locations: stories.getLocations('sushi'),
        periodOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
        anchorMap: {
          s1: 's1', s2: 's1', s3: 's2', s4: 's3', s5: 's4', s6: 's5',
          s7: 's5', s8: 's6', s9: ['s7', 's8'], s10: 's8', s11: 's9',
          s12: 's9', s13: 's10', s14: 's11', s15: 's11', s16: 's12',
          s17: ['s19', 's20'], s18: 's20', s19: 's21', s20: 's22'
        }
      }
    ]);
  } catch (e) { console.warn('[sync] 地点进度迁移失败（已忽略）', e); }
  // 旧泰山身份 → 杜甫玩家角色草稿（幂等：已有合法档案即跳过）
  try {
    progress.migrateLegacyPlayerProfile();
  } catch (e) { console.warn('[sync] 角色档案迁移失败（已忽略）', e); }
  unsubscribe = progress.onChange(schedulePush);
  pull(generation);
}

/** 停止云同步并取消待上传任务。用于删除学习档案，防止删除后被后台任务重新建档。 */
function stop() {
  active = false;
  inited = false;
  generation += 1;
  dirty = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

function waitForIdle() {
  if (!busy) return Promise.resolve();
  return new Promise(resolve => idleWaiters.push(resolve));
}

/**
 * 清空云端进度（「重新开始」时与 progress.resetAll() 配合调用）
 * 注意：不能用空快照 saveState 代替——服务端合并是"只增不减"的，清不掉。
 */
async function resetCloud() {
  const res = await cloudCall({ action: 'clearState' });
  return !!(res && res.code === 0 && res.data && res.data.ok);
}

/**
 * 完整重置（「重新开始」用）：先暂停同步并等待在途保存结束、使旧拉取回调失效，
 * 再清空本地（含杜甫角色资料）与云端，最后恢复同步。
 * 顺序保证：stop() 使在途 pull 结果失效；waitForIdle() 等未完成的 push 收尾（其吸收
 * 发生在本地 resetAll 之前，不会把已清数据写回）；resetAll() 清本地；resetCloud() 清云端；
 * init() 重新订阅并拉取（云端已空，不会回填）。
 * @returns {Promise<boolean>} 云端是否清空成功
 */
async function resetProgress() {
  stop();
  await waitForIdle();
  progress.resetAll();
  const ok = await resetCloud();
  init();
  return ok;
}

/** 停止同步、等待在途上传完成，再永久删除当前用户的云端学习档案。 */
async function deleteAccount() {
  stop();
  await waitForIdle();
  const res = await cloudCall({ action: 'deleteAccount' });
  return !!(res && res.code === 0 && res.data && res.data.ok);
}

module.exports = { init, stop, pull, push, schedulePush, resetCloud, resetProgress, deleteAccount };
