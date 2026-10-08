// pages/index/index.js —— 首页（动态封面 + 穿越开场动画）
const app = getApp();
const stories = require('../../utils/stories/index');
const assets = require('../../utils/cloudAssets');

// 封面视频：云存储 fileID（与音频同理，走云函数代取临时链接绕过存储权限）
const COVER_VIDEO_FILE_ID = 'cloud://cloud1-d0g6bkxs13c9f980d.636c-cloud1-d0g6bkxs13c9f980d-1412525724/video/cover-video-final.mp4';
// 封面底图（视频加载前的海报，大图已迁云存储）
const COVER_IMAGE = '/assets/' + 'images/cover/cover-vertical.jpg';

Page({
  data: {
    loggedIn: false,
    logging: false,
    showPortal: false,
    portalFade: false,  // 穿越层淡出（切页前的柔和过渡）
    coverVideoUrl: '',  // 封面视频临时链接（取到后 video 自动播放）
    coverImage: '',     // 封面底图临时链接（视频加载前显示）
    linePortraits: []   // 古人生像（穿越时浮现）
  },

  onLoad() {
    // 收集各故事线的生像图，用于封面与穿越动画（立绘已迁云存储，换临时链接）
    const lines = stories.getAllLines();
    assets.resolvePaths(lines.map(l => l.portrait)).then((map) => {
      this.setData({
        linePortraits: lines.map(l => map[l.portrait] || l.portrait)
      });
    });
    // 封面底图换云链接
    assets.resolvePaths([COVER_IMAGE]).then((map) => {
      this.setData({ coverImage: map[COVER_IMAGE] || COVER_IMAGE });
    });

    // 预取封面视频、背景音乐的临时链接（云函数代取，绕过免费版存储权限限制）
    this.loadCloudVideo(COVER_VIDEO_FILE_ID, 'coverVideoUrl');
    // 背景音乐链接预取到全局（由 app.ensureBgm 在首次手势时启动，之后全程常驻）
    app.fetchBgmUrl();
  },

  // 通过 ttsUrl 云函数代取云端视频的临时播放链接（2 小时有效，挂全局缓存）
  loadCloudVideo(fileID, dataKey) {
    if (!fileID) return;
    const cache = app.globalData.videoCache || (app.globalData.videoCache = {});
    if (cache[fileID]) {
      this.setData({ [dataKey]: cache[fileID] });
      return;
    }
    wx.cloud.callFunction({
      name: 'ttsUrl',
      data: { fileIDs: [fileID] },
      success: (res) => {
        const list = res.result || [];
        const f = list[0];
        if (f && f.tempFileURL) {
          cache[fileID] = f.tempFileURL;
          this.setData({ [dataKey]: f.tempFileURL });
        } else {
          // 取不到链接（文件不存在/云函数未部署等），保留静态兜底
          console.warn('[index] 未取到视频链接', dataKey, f && f.errMsg);
        }
      },
      fail: (err) => {
        console.warn('[index] 视频链接获取失败', dataKey, err);
      }
    });
  },

  // 封面视频播放出错（如网络/格式），静默回退静态图
  onVideoError() {
    this.setData({ coverVideoUrl: '' });
  },

  onShow() {
    if (app.globalData.openid) {
      this.setData({ loggedIn: true });
    }
  },

  // 离开首页（切 tab 等）时，音乐保持常驻不停止（全局单例由 app 管理）
  onHide() {
    if (this.data.showPortal) {
      clearTimeout(this._portalTimer);
      this.finishPortal();
    }
  },

  onUnload() {
    clearTimeout(this._portalTimer);
  },

  // 开始穿越：先登录（若未登录），再播穿越动画
  async onStart() {
    if (this.data.logging) return;

    // 未登录则先静默登录
    if (!app.globalData.openid) {
      this.setData({ logging: true });
      try {
        await app.silentLogin();
        this.setData({ loggedIn: true });
      } catch (err) {
        console.error('[index] 登录失败', err);
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
        this.setData({ logging: false });
        return;
      } finally {
        this.setData({ logging: false });
      }
    }

    // 播放穿越动画
    this.playPortal();
  },

  // 开始穿越：播放纯 CSS 穿越动画（水墨晕染 + 卷轴展开，无视频、无水印）
  playPortal() {
    this._portalDone = false;
    this.setData({ showPortal: true, portalFade: false });
    // 首次手势触发全局背景音乐（之后全程常驻，切页不停止）
    app.ensureBgm();

    // CSS 动画兜底：墨晕漫开→卷轴展开→诗句浮现→白光收束，约 3.4 秒
    this._portalTimer = setTimeout(() => this.finishPortal(), 3400);
  },

  // 穿越结束：淡出过渡层，切入剧本页（音乐保持常驻，不在此停止）
  finishPortal() {
    if (this._portalDone) return;
    this._portalDone = true;
    clearTimeout(this._portalTimer);
    this.setData({ portalFade: true });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/story/story' });
      // 切走后重置动画状态，便于下次进入
      setTimeout(() => this.setData({ showPortal: false, portalFade: false }), 400);
    }, 300);
  },
});
