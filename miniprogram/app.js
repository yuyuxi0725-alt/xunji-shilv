// app.js —— 寻迹·古今 小程序入口
App({
  globalData: {
    openid: null,        // 用户 openid，登录后写入
    userInfo: null,      // 用户信息
    isNewUser: false,    // 是否新用户
    guardianAuthorized: false, // 监护人是否已授权（未成年场景）
    envId: 'cloud1-d0g6bkxs13c9f980d',  // 云开发环境 ID
    _bgm: null,          // 全局背景音乐实例（单例，跨页面常驻）
    _bgmUrl: '',         // 背景音乐临时链接（就绪后写入）
    _bgmFade: null,      // 音量渐变定时器
    bgmEnabled: true     // 背景音乐开关（用户可在「我的」页关闭）
  },

  // 背景音乐临时链接（云存储，由 ttsUrl 云函数代取）
  BGM_FILE_ID: 'cloud://cloud1-d0g6bkxs13c9f980d.636c-cloud1-d0g6bkxs13c9f980d-1412525724/audio/bgm-gaoshanliushui.mp3',

  onLaunch() {
    // 背景音乐开关：读本地缓存（未设置过则默认开）
    this.globalData.bgmEnabled = wx.getStorageSync('bgmEnabled') !== false;
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.envId || undefined,
        traceUser: true
      });
    }
    // 静默登录：换取 openid
    this.silentLogin();
  },

  // 预取背景音乐临时链接（缓存到 globalData，供 ensureBgm 使用）
  fetchBgmUrl() {
    if (this.globalData._bgmUrl) return Promise.resolve(this.globalData._bgmUrl);
    return new Promise((resolve) => {
      wx.cloud.callFunction({
        name: 'ttsUrl',
        data: { fileIDs: [this.BGM_FILE_ID] },
        success: (res) => {
          const f = (res.result || [])[0];
          if (f && f.tempFileURL) {
            this.globalData._bgmUrl = f.tempFileURL;
            resolve(f.tempFileURL);
          } else {
            console.warn('[app] 背景音乐链接获取失败', f && f.errMsg);
            resolve('');
          }
        },
        fail: (err) => {
          console.warn('[app] 背景音乐云函数调用失败', err);
          resolve('');
        }
      });
    });
  },

  // 确保全局背景音乐在播（幂等：已播则不重复创建）。
  // 必须在用户手势回调里首次调用（微信音频自动播放限制）。
  ensureBgm() {
    const g = this.globalData;
    if (!g.bgmEnabled) return;  // 用户已关闭背景音乐
    if (g._bgm) return;  // 已在播
    if (g._bgmUrl) {
      this._startBgm(g._bgmUrl);
    } else {
      // 链接尚未就绪：等待预取完成后再播（否则用户在链接取回前点按钮，音乐就永远不响）
      this.fetchBgmUrl().then((url) => {
        if (url && !g._bgm) this._startBgm(url);
        else if (!url) console.warn('[app] 背景音乐链接未取到（文件是否已上传云存储 audio/bgm-gaoshanliushui.mp3）');
      });
    }
  },

  // 真正创建音频实例并渐入播放（内部）
  _startBgm(url) {
    const g = this.globalData;
    if (g._bgm || !url) return;
    try {
      const bgm = wx.createInnerAudioContext();
      bgm.src = url;
      bgm.loop = true;
      bgm.obeyMuteSwitch = false;  // 静音键下也保持播放（可选，按需）
      bgm.volume = 0;
      bgm.onError((e) => {
        console.warn('[app] 背景音乐播放出错', e && e.errMsg);
        g._bgm = null;  // 出错则重置，允许下次重试
      });
      bgm.play();
      g._bgm = bgm;
      // 约 1.2 秒渐入到 0.3 的轻音量
      this._fadeBgm(bgm, 0.3);
    } catch (e) {
      console.warn('[app] 背景音乐播放失败', e);
    }
  },

  // 音量渐变（内部工具）
  _fadeBgm(bgm, target) {
    const g = this.globalData;
    if (g._bgmFade) clearInterval(g._bgmFade);
    g._bgmFade = setInterval(() => {
      const cur = bgm.volume || 0;
      const next = cur < target ? Math.min(cur + 0.05, target) : Math.max(cur - 0.1, target);
      try { bgm.volume = next; } catch (e) {}
      if (next === target) clearInterval(g._bgmFade);
    }, 200);
  },

  // 停止全局背景音乐（退出小程序/主动关闭时用）
  stopBgm() {
    const g = this.globalData;
    const bgm = g._bgm;
    g._bgm = null;
    if (g._bgmFade) clearInterval(g._bgmFade);
    if (bgm) {
      try { bgm.stop(); bgm.destroy(); } catch (e) {}
    }
  },

  // 设置背景音乐开关（「我的」页开关调用；switch 切换属用户手势，可直接起播）
  setBgmEnabled(on) {
    this.globalData.bgmEnabled = !!on;
    wx.setStorageSync('bgmEnabled', !!on);
    if (on) this.ensureBgm();
    else this.stopBgm();
  },

  /**
   * 静默登录：wx.login 拿 code → 云函数换取 openid
   */
  silentLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (!res.code) {
            reject(new Error('登录失败：未获取到 code'));
            return;
          }
          try {
            const { result } = await wx.cloud.callFunction({
              name: 'login',
              data: { code: res.code }
            });
            if (result && result.code === 0) {
              this.globalData.openid = result.data.openid;
              this.globalData.isNewUser = result.data.isNew;
              this.globalData.guardianAuthorized = result.data.guardianAuthorized || false;
              resolve(result.data);
            } else {
              reject(new Error(result && result.msg || '登录异常'));
            }
          } catch (err) {
            reject(err);
          }
        },
        fail: reject
      });
    });
  }
});
