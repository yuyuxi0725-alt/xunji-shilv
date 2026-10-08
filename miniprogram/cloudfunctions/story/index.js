// cloudfunctions/story/index.js —— 进度云同步云函数
//
// 职责：把学生的探究进度在云端建档，使【换设备不丢进度】。
//   · 进度三层数据：通关状态(questStates) / 知识锚点(collectedAnchors) / 探究档案(questRecords)
//   · 每层都按「主线 id → 时期 id」二级分组
//
// 为什么走云函数而不是前端直连数据库：
//   `users` 集合的文档由 login 云函数（服务端）创建，不带客户端的 _openid，
//   在"仅创建者可读写"的默认权限下前端读不到自己的档案。云函数是管理端权限，不受此限。
//
// 合并策略（与前端 utils/progress.js 的 mergeRemote 同规则）：
//   **只增不减**——状态按 locked < active < completed 取较优；锚点取并集；
//   探究档案按 completedAt 取较新者。这样多设备并发提交也不会互相覆盖掉进度。
const cloud = require('wx-server-sdk');
const merge = require('./merge');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION = 'users';

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action } = event;

  if (!openid) return { code: 1, msg: '未取得 openid' };

  switch (action) {
    case 'getState':
      return await getState(openid);
    case 'saveState':
      return await saveState(openid, event.snapshot);
    case 'clearState':
      // 学生在「我的」页点「重新开始」时调用。
      // 必须单独一个 action：saveState 的合并是"只增不减"的，传空快照清不掉云端数据，
      // 会让下次拉取把已清掉的进度又合并回来。
      return await clearState(openid);
    default:
      return { code: 1, msg: '未知 action' };
  }
};

// 读取云端进度快照
async function getState(openid) {
  try {
    const res = await db.collection(COLLECTION).where({ openid }).limit(1).get();
    const doc = res.data && res.data[0];
    return {
      code: 0,
      data: { snapshot: (doc && doc.progress) || null }
    };
  } catch (err) {
    console.error('[story] 读取进度失败', err);
    return { code: 0, data: { snapshot: null }, msg: '读取失败（已降级）' };
  }
}

// 保存进度快照（先与云端已有数据合并，避免覆盖别的设备上的进度）
async function saveState(openid, incoming) {
  if (!incoming || typeof incoming !== 'object') {
    return { code: 1, msg: '缺少 snapshot' };
  }
  try {
    const res = await db.collection(COLLECTION).where({ openid }).limit(1).get();
    const doc = res.data && res.data[0];
    const merged = merge.mergeSnapshot((doc && doc.progress) || null, incoming);
    merged.updatedAt = Date.now();

    if (doc && doc._id) {
      await db.collection(COLLECTION).doc(doc._id).update({
        data: { progress: merged, updatedAt: db.serverDate() }
      });
    } else {
      // 登录建档失败/档案缺失时补建，保证进度不丢
      await db.collection(COLLECTION).add({
        data: {
          openid,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
          guardianAuthorized: false,
          progress: merged
        }
      });
    }
    return { code: 0, data: { ok: true, updatedAt: merged.updatedAt } };
  } catch (err) {
    console.error('[story] 保存进度失败', err);
    // 保存失败不抛错到前端：本地存储才是唯一真相源，下次写入会重试
    return { code: 0, data: { ok: false }, msg: '保存失败（本地已保留）' };
  }
}

// 清空云端进度（「重新开始」用）
async function clearState(openid) {
  const empty = { states: {}, anchors: {}, records: {}, updatedAt: Date.now() };
  try {
    const res = await db.collection(COLLECTION).where({ openid }).limit(1).get();
    const doc = res.data && res.data[0];
    if (doc && doc._id) {
      await db.collection(COLLECTION).doc(doc._id).update({
        data: { progress: empty, updatedAt: db.serverDate() }
      });
    }
    return { code: 0, data: { ok: true } };
  } catch (err) {
    console.error('[story] 清空进度失败', err);
    return { code: 0, data: { ok: false }, msg: '清空失败（本地已清）' };
  }
}

