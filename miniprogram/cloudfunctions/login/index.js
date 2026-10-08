// cloudfunctions/login/index.js —— 登录云函数
// 职责：wx.login 的 code 换取 openid（静默登录）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { code } = event;
  if (!code) {
    return { code: 1, msg: '缺少 code' };
  }

  try {
    // 通过 code 换取 openid（云函数环境下可直接获取）
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // 查询是否为新用户
    const users = db.collection('users');
    const res = await users.where({ openid }).get();

    let isNew = false;
    if (res.data.length === 0) {
      isNew = true;
      await users.add({
        data: {
          openid,
          createdAt: db.serverDate(),
          guardianAuthorized: false,
          progress: {}
        }
      });
    }

    const userData = res.data.length > 0 ? res.data[0] : {
      openid,
      guardianAuthorized: false,
      progress: {}
    };

    return {
      code: 0,
      data: {
        openid,
        isNew,
        guardianAuthorized: userData.guardianAuthorized || false,
        progress: userData.progress || {}
      }
    };
  } catch (err) {
    console.error('[login] 错误', err);
    return { code: 500, msg: err.message };
  }
};
