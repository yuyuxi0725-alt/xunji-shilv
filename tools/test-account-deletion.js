// tools/test-account-deletion.js —— 学习档案删除后的同步竞态测试
//
// 验证：
//   1. 删除会取消尚未开始的防抖上传；
//   2. 删除后，晚到的云端拉取不会把进度写回本地；
//   3. 已经开始的上传会先结束，再执行删除，避免删除后被旧上传重建；
//   4. 云端删除失败会明确返回 false。

const path = require('path');

const progressPath = path.join(__dirname, '../miniprogram/utils/progress.js');
const syncPath = path.join(__dirname, '../miniprogram/utils/sync.js');

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    return;
  }
  failures.push(name + (detail ? ` → ${detail}` : ''));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadFresh(handler) {
  delete require.cache[require.resolve(progressPath)];
  delete require.cache[require.resolve(syncPath)];

  const store = {};
  const calls = [];
  global.wx = {
    getStorageSync(key) { return store[key] === undefined ? '' : store[key]; },
    setStorageSync(key, value) { store[key] = value; },
    removeStorageSync(key) { delete store[key]; },
    cloud: {
      callFunction(options) {
        const action = options && options.data && options.data.action;
        calls.push(action);
        handler({ action, options, calls, store });
      }
    }
  };

  return {
    store,
    calls,
    progress: require(progressPath),
    sync: require(syncPath)
  };
}

async function testPendingPushCancelled() {
  const ctx = loadFresh(({ action, options }) => {
    if (action === 'getState') {
      options.success({ result: { code: 0, data: { snapshot: null } } });
    } else if (action === 'deleteAccount') {
      options.success({ result: { code: 0, data: { ok: true, deleted: 1 } } });
    } else {
      options.success({ result: { code: 0, data: { ok: true } } });
    }
  });

  ctx.sync.init();
  ctx.progress.addAnchor('dufu', 'pending-anchor');
  const deleted = await ctx.sync.deleteAccount();
  await delay(2700);

  check('删除请求成功', deleted === true);
  check('待执行的防抖上传被取消', !ctx.calls.includes('saveState'), ctx.calls.join(' → '));
  check('只发生读取与删除', ctx.calls.join(',') === 'getState,deleteAccount', ctx.calls.join(' → '));
}

async function testLatePullIgnored() {
  let finishPull;
  const ctx = loadFresh(({ action, options }) => {
    if (action === 'getState') {
      finishPull = () => options.success({
        result: {
          code: 0,
          data: { snapshot: { states: { dufu: { p1: 'completed' } } } }
        }
      });
    } else if (action === 'deleteAccount') {
      options.success({ result: { code: 0, data: { ok: true, deleted: 1 } } });
    }
  });

  ctx.sync.init();
  const deleted = await ctx.sync.deleteAccount();
  finishPull();
  await delay(0);

  check('拉取进行中时仍可完成删除', deleted === true);
  check('删除后晚到的拉取结果不会复活本地进度',
    ctx.progress.getStates('dufu').p1 === undefined);
}

async function testInFlightPushFinishesBeforeDelete() {
  let finishPush;
  const ctx = loadFresh(({ action, options }) => {
    if (action === 'getState') {
      options.success({ result: { code: 0, data: { snapshot: null } } });
    } else if (action === 'saveState') {
      finishPush = () => options.success({ result: { code: 0, data: { ok: true } } });
    } else if (action === 'deleteAccount') {
      options.success({ result: { code: 0, data: { ok: true, deleted: 1 } } });
    }
  });

  ctx.sync.init();
  ctx.progress.addAnchor('dufu', 'busy-anchor');
  const pushPromise = ctx.sync.push();
  const deletePromise = ctx.sync.deleteAccount();
  await delay(0);

  check('上传未结束前不会提前删除', !ctx.calls.includes('deleteAccount'), ctx.calls.join(' → '));
  finishPush();
  await pushPromise;
  const deleted = await deletePromise;

  check('在途上传结束后删除成功', deleted === true);
  check('调用顺序为读取、上传、删除',
    ctx.calls.join(',') === 'getState,saveState,deleteAccount', ctx.calls.join(' → '));
}

async function testDeleteFailureReported() {
  const ctx = loadFresh(({ action, options }) => {
    if (action === 'getState') {
      options.success({ result: { code: 0, data: { snapshot: null } } });
    } else if (action === 'deleteAccount') {
      options.success({ result: { code: 500, data: { ok: false } } });
    }
  });

  ctx.sync.init();
  const deleted = await ctx.sync.deleteAccount();
  check('云端删除失败不会被误报为成功', deleted === false);
}

// resetProgress：清空本地（含杜甫角色）→ 清空云端 → 恢复同步；晚到的旧拉取不回填已清角色。
async function testResetProgressClearsProfileAndIgnoresLatePull() {
  const FULL_PROFILE = { version: 1, avatarId: 'avatar01', displayName: '寻迹者', confirmed: true, createdAt: 100, updatedAt: 200 };
  let pullCount = 0;
  let finishPull = null;
  const ctx = loadFresh(({ action, options }) => {
    if (action === 'getState') {
      pullCount += 1;
      // 只在首次拉取时挂起，模拟「清空过程中还有一份旧快照在路上」
      if (pullCount === 1) {
        finishPull = () => options.success({
          result: { code: 0, data: { snapshot: { playerProfiles: { dufu: FULL_PROFILE } } } }
        });
      } else {
        options.success({ result: { code: 0, data: { snapshot: null } } });
      }
    } else if (action === 'clearState') {
      options.success({ result: { code: 0, data: { ok: true } } });
    }
  });

  ctx.sync.init();
  // 本地先建一个已确认角色（触发防抖上传），随后立即重置
  ctx.progress.savePlayerProfile('dufu', 'avatar03', '小杜');
  const okReset = await ctx.sync.resetProgress();

  check('重置流程返回成功', okReset === true);
  check('重置后本地角色已清空', ctx.progress.getPlayerProfile('dufu') === null);
  check('重置触发了云端 clearState', ctx.calls.includes('clearState'), ctx.calls.join(' → '));

  // 首次拉取那份「旧快照」现在才返回——不应复活本地角色
  if (finishPull) finishPull();
  await delay(0);
  check('晚到的旧快照不回填已清角色', ctx.progress.getPlayerProfile('dufu') === null);

  // 重置后同步恢复：本地再写一个角色会再次触发上传
  ctx.progress.savePlayerProfile('dufu', 'avatar02', '新角色');
  await delay(2700);
  check('重置后同步恢复（再次写入触发上传）', ctx.calls.includes('saveState'), ctx.calls.join(' → '));
}

(async () => {
  await testPendingPushCancelled();
  await testLatePullIgnored();
  await testInFlightPushFinishesBeforeDelete();
  await testDeleteFailureReported();
  await testResetProgressClearsProfileAndIgnoresLatePull();

  console.log('\n=====================================');
  if (failures.length) {
    console.log(`FAILED  ${failures.length} 项未通过（通过 ${passed} 项）：`);
    failures.forEach(item => console.log(`  ✗ ${item}`));
    process.exit(1);
  }
  console.log(`ALL PASS  ${passed} 项学习档案删除断言全部通过`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
