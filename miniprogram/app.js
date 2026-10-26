// app.js —— 寻迹诗旅 小程序入口
const sync = require('./utils/sync');

App({
  globalData: {
    openid: null,        // 用户 openid，登录后写入
    agreementAccepted: false, // 是否由用户主动勾选并确认协议
    ageConfirmed: false, // 是否由用户主动确认已满 14 周岁
    userInfo: null,      // 用户信息
    isNewUser: false,    // 是否新用户
    envId: 'cloud1-d0g6bkxs13c9f980d',  // 云开发环境 ID
    _bgm: null,          // 全局背景音乐实例（单例，跨页面常驻）
    _bgmUrl: '',         // 背景音乐临时链接（就绪后写入）
    _bgmUrlAt: 0,        // 临时链接获取时间戳（毫秒），用于 2 小时过期后重取
    _bgmFade: null,      // 音量渐变定时器
    _bgmPlaying: false,  // 是否真正出声（onPlay 置真；自动播放被环境拦截时为假，等手势解锁）
    _bgmRetries: 0,      // 连续出错自动重试计数（成功播放后清零，最多连续 3 次）
    bgmEnabled: true,    // 背景音乐开关（用户可在「我的」页关闭）
    poemFocus: null,     // 切换到诗笺 tab 时的一次性定位 { lineId, periodId }
    storyFocus: null     // 切换到剧本 tab 时的一次性定位 { lineId }
  },

  // 背景音乐临时链接（云存储，由 ttsUrl 云函数代取）
  BGM_FILE_ID: 'cloud://cloud1-d0g6bkxs13c9f980d.636c-cloud1-d0g6bkxs13c9f980d-1412525724/audio/bgm-gaoshanliushui.mp3',

  onLaunch() {
    // 仅记录用户曾经主动确认过协议的状态；不得在用户确认前自动登录。
    this.globalData.agreementAccepted = wx.getStorageSync('agreementAccepted') === true;
    this.globalData.ageConfirmed = wx.getStorageSync('ageConfirmed') === true;
    // 背景音乐开关：读本地缓存（未设置过则默认开）
    this.globalData.bgmEnabled = wx.getStorageSync('bgmEnabled') !== false;
    // 音频全局选项：允许与其他音频混播，BGM 与剧情人声（TTS）互不打断
    if (wx.setInnerAudioOption) {
      wx.setInnerAudioOption({ mixWithOther: true });
    }
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.envId || undefined,
        traceUser: false
      });
    }

    // 微信隐私授权同步：注册被动监听，隐私接口需要授权时弹出统一隐私弹窗（基础库 >= 2.32.3）
    this._bindPrivacyAuth();
  },

  // 微信隐私授权：当隐私接口需要用户同意时触发（wx.onNeedPrivacyAuthorization 只注册一次）
  _bindPrivacyAuth() {
    if (wx.onNeedPrivacyAuthorization) {
      wx.onNeedPrivacyAuthorization((resolve) => {
        this.globalData._privacyResolve = resolve;
        this._emitPrivacy();
      });
    }
  },

  // 通知所有已挂载的 privacy-popup 组件显示弹窗
  _emitPrivacy() {
    const ls = this._privacyListeners || [];
    ls.forEach((cb) => { try { cb(); } catch (e) {} });
  },

  // 供 privacy-popup 组件订阅/退订「需要隐私授权」事件
  _onPrivacy(cb) {
    const ls = this._privacyListeners || (this._privacyListeners = []);
    ls.push(cb);
    return () => {
      const i = ls.indexOf(cb);
      if (i >= 0) ls.splice(i, 1);
    };
  },

  /**
   * 确保微信侧隐私授权已完成（在调用隐私接口前调用）。
   * 返回 Promise<boolean>：true = 已授权；false = 用户拒绝或接口异常。
   * 微信侧状态是官方授权状态的唯一来源；本地 agreementAccepted 只代表用户曾勾选应用内协议。
   */
  ensurePrivacyAuth() {
    return new Promise((resolve) => {
      // 基础库 < 2.32.3：无官方隐私授权能力，微信也不拦截隐私接口。
      // 此分支不构成"默认视为同意"——调用方必须先要求用户主动勾选应用内协议后才走到这里。
      if (!wx.requirePrivacyAuthorize) {
        resolve(true);
        return;
      }

      const doAuthorize = () => {
        // 已授权时立即 success（不重复弹窗）；未授权时触发 onNeedPrivacyAuthorization
        // 弹出统一隐私弹窗，用户点「同意」后 resolve({ event: 'agree' }) 使本调用 success。
        wx.requirePrivacyAuthorize({
          success: () => resolve(true),
          fail: () => resolve(false)
        });
      };

      if (!wx.getPrivacySetting) {
        doAuthorize();
        return;
      }
      // 以微信侧状态为准：已授权直接放行，未授权才触发一次官方授权流程
      wx.getPrivacySetting({
        success: (res) => {
          if (res.needAuthorization === false) {
            resolve(true);
            return;
          }
          doAuthorize();
        },
        fail: doAuthorize  // 读取状态失败：保守地触发一次官方授权确认，不默认视为同意
      });
    });
  },

  // 预取背景音乐临时链接（缓存到 globalData，供 ensureBgm 使用）
  // 注意：云存储临时链接约 2 小时失效，缓存需带过期时间，超时自动重取。
  fetchBgmUrl() {
    const g = this.globalData;
    const TTL = 100 * 60 * 1000;  // 100 分钟，留足余量（链接有效期约 120 分钟）
    // 缓存命中且未过期：直接复用
    if (g._bgmUrl && (Date.now() - g._bgmUrlAt) < TTL) {
      return Promise.resolve(g._bgmUrl);
    }
    return new Promise((resolve) => {
      wx.cloud.callFunction({
        name: 'ttsUrl',
        data: { fileIDs: [this.BGM_FILE_ID] },
        success: (res) => {
          const f = (res.result || [])[0];
          if (f && f.tempFileURL) {
            g._bgmUrl = f.tempFileURL;
            g._bgmUrlAt = Date.now();   // 记录获取时间，供下次过期判断
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
  // 两条触发路径互为兜底：
  //  1) autoStartBgm：一进首页就尝试自动播放（多数环境允许）；
  //  2) ensureBgm：用户手势触发——少数环境拦截无手势自动播放时，在此解锁。
  ensureBgm() {
    const g = this.globalData;
    if (!g.bgmEnabled) return;  // 用户已关闭背景音乐
    if (g._bgm) {
      // 实例已建但从未真正出声（自动播放被拦截）：手势来了，补一次 play() 解锁
      if (!g._bgmPlaying) {
        try { g._bgm.play(); } catch (e) {}
      }
      return;
    }
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

  // 一进首页即尝试自动播放（首页 onLoad 调用）。
  // 微信小程序内 InnerAudioContext 一般允许无手势播放；
  // 被拦截时不报错也不卡死——首次手势的 ensureBgm 会补 play() 解锁。
  autoStartBgm() {
    const g = this.globalData;
    if (!g.bgmEnabled || g._bgm) return;
    this.fetchBgmUrl().then((url) => {
      if (url && !g._bgm && g.bgmEnabled) this._startBgm(url);
    });
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
      bgm.onPlay(() => {
        // 真正出声了：标记播放中，清零连续重试计数
        g._bgmPlaying = true;
        g._bgmRetries = 0;
      });
      bgm.onError((e) => {
        console.warn('[app] 背景音乐播放出错', e && e.errMsg);
        // 出错：清定时器、重置实例与链接缓存，换取新链接后自动重试
        if (g._bgmFade) { clearInterval(g._bgmFade); g._bgmFade = null; }
        g._bgm = null;
        g._bgmPlaying = false;
        g._bgmUrl = '';   // 清空缓存，下次 ensureBgm 会重新换取新链接
        g._bgmUrlAt = 0;
        // 自动重试：最多连续 3 次、间隔 3 秒（网络抖动/临时链接中途失效可自愈；
        // 成功播放后 onPlay 清零计数，不会无限循环空转）
        if (g.bgmEnabled && g._bgmRetries < 3) {
          g._bgmRetries += 1;
          setTimeout(() => {
            if (g.bgmEnabled && !g._bgm) this.ensureBgm();
          }, 3000);
        }
      });
      bgm.play();
      g._bgm = bgm;
      // 约 1.2 秒渐入到 0.15 的轻音量
      this._fadeBgm(bgm, 0.15);
    } catch (e) {
      console.warn('[app] 背景音乐播放失败', e);
    }
  },

  // 音量渐变（内部工具）
  _fadeBgm(bgm, target) {
    const g = this.globalData;
    if (g._bgmFade) clearInterval(g._bgmFade);
    g._bgmFade = setInterval(() => {
      // 音频实例若已被销毁/出错，立即停止渐变，避免访问失效实例抛 TypeError
      if (!bgm || g._bgm !== bgm) {
        clearInterval(g._bgmFade);
        g._bgmFade = null;
        return;
      }
      let cur = 0;
      try { cur = bgm.volume || 0; } catch (e) {
        clearInterval(g._bgmFade);
        g._bgmFade = null;
        return;
      }
      const next = cur < target ? Math.min(cur + 0.05, target) : Math.max(cur - 0.1, target);
      try { bgm.volume = next; } catch (e) {}
      if (next === target) { clearInterval(g._bgmFade); g._bgmFade = null; }
    }, 200);
  },

  // 停止全局背景音乐（退出小程序/主动关闭时用）
  stopBgm() {
    const g = this.globalData;
    const bgm = g._bgm;
    g._bgm = null;
    g._bgmPlaying = false;
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
    // 已登录或正在登录时复用结果，避免首页与「我的」页同时触发重复建档。
    if (this.globalData.openid) {
      return Promise.resolve({ openid: this.globalData.openid, isNew: false });
    }
    if (this._loginPromise) return this._loginPromise;

    const task = new Promise((resolve, reject) => {
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
              // 拿到 openid 后初始化进度云同步
              // （首次拉取云端进度做并集合并；并订阅本地变更自动防抖上传。失败静默，不影响本地）
              try { sync.init(); } catch (e) { console.warn('[app] 进度云同步初始化失败（已忽略）', e); }
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
    this._loginPromise = task;
    const clearTask = () => {
      if (this._loginPromise === task) this._loginPromise = null;
    };
    task.then(clearTask, clearTask);
    return task;
  }
});
