// utils/cloudAssets.js —— 云端图片资源解析器
//
// 背景：微信主包上限 2MB，场景图/立绘等大图（约 11.6MB）已全部迁移云存储，
//   云端路径与本地原路径一致（去掉前导斜杠）：
//     /assets/images/scenes/scene-p1-taishan.jpg
//       → cloud://<env>/assets/images/scenes/scene-p1-taishan.jpg
//   免费版存储权限锁定「仅创建者可读写」，端上无法直读云文件，
//   因此经 ttsUrl 云函数（管理端权限）批量换取临时链接（2 小时有效）。
//   本模块负责：批量换取 + 进程内缓存 + 对故事线对象做深度路径替换。
//
// 保留本地不动：/assets/icons/（tabBar 图标，tabBar 不支持网络图片）

const CLOUD_ROOT = 'cloud://cloud1-d0g6bkxs13c9f980d.636c-cloud1-d0g6bkxs13c9f980d-1412525724';
const MIGRATE_PREFIX = '/assets/' + 'images/';  // 已迁移云端的本地路径前缀
const KEEP_LOCAL = '/assets/' + 'icons/';       // 例外：小图标保留本地

const urlCache = {};  // 本地路径 -> 云端临时链接

// 是否属于"已迁移云端"的路径
function isMigratable(p) {
  return typeof p === 'string'
    && p.indexOf(MIGRATE_PREFIX) === 0
    && p.indexOf(KEEP_LOCAL) !== 0;
}

// 深度收集对象里所有待迁移路径
function collectPaths(obj, set) {
  if (!obj) return;
  if (typeof obj === 'string') {
    if (isMigratable(obj)) set.add(obj);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach(v => collectPaths(v, set));
    return;
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(k => collectPaths(obj[k], set));
  }
}

// 单批换取临时链接（ttsUrl 云函数单次上限 50 个）
function fetchBatch(paths) {
  return new Promise((resolve) => {
    wx.cloud.callFunction({
      name: 'ttsUrl',
      data: { fileIDs: paths.map(p => CLOUD_ROOT + p) },
      success: (res) => {
        const list = res.result || [];
        paths.forEach((p) => {
          const f = list.find(x => x && x.fileID === CLOUD_ROOT + p);
          if (f && f.tempFileURL) urlCache[p] = f.tempFileURL;
          else console.warn('[cloudAssets] 未取到链接（文件未上传云端？）', p, f && f.errMsg);
        });
        resolve();
      },
      fail: (err) => {
        console.warn('[cloudAssets] 云函数调用失败', err);
        resolve();  // 失败不阻塞页面，只是图裂（可在 Console 看到原因）
      }
    });
  });
}

// 解析一组路径，返回 { 本地路径: 临时链接 } 映射
function resolvePaths(paths) {
  const unique = [...new Set((paths || []).filter(isMigratable))];
  const need = unique.filter(p => !urlCache[p]);
  const jobs = [];
  for (let i = 0; i < need.length; i += 50) {
    jobs.push(fetchBatch(need.slice(i, i + 50)));
  }
  return Promise.all(jobs).then(() => {
    const out = {};
    unique.forEach((p) => { if (urlCache[p]) out[p] = urlCache[p]; });
    return out;
  });
}

// 深度替换对象中的路径（返回克隆，不改原对象）
function replaceDeep(obj, map) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return map[obj] || obj;
  if (Array.isArray(obj)) return obj.map(v => replaceDeep(v, map));
  if (typeof obj === 'object') {
    const out = {};
    Object.keys(obj).forEach((k) => { out[k] = replaceDeep(obj[k], map); });
    return out;
  }
  return obj;
}

// 解析整条故事线（含 quests/scenes/sceneSets/立绘/封面）里所有图片路径
function resolveLine(line) {
  if (!line) return Promise.resolve(line);
  const set = new Set();
  collectPaths(line, set);
  return resolvePaths([...set]).then(map => replaceDeep(line, map));
}

module.exports = { isMigratable, resolvePaths, resolveLine };
