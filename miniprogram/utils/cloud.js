// utils/cloud.js —— 云函数调用统一封装
/**
 * 调用云函数并统一处理返回
 * @param {string} name 云函数名
 * @param {object} data 入参
 * @returns {Promise} 解析后的业务数据
 */
function call(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({ name, data })
      .then(res => {
        const result = res.result;
        if (result && result.code === 0) {
          resolve(result.data);
        } else {
          const err = new Error(result && result.msg || '服务异常');
          err.code = result && result.code;
          reject(err);
        }
      })
      .catch(err => {
        console.error(`[cloud] 调用 ${name} 失败`, err);
        reject(err);
      });
  });
}

module.exports = { call };
