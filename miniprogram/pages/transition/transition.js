// pages/transition/transition.js —— 选完诗人后的穿越过渡页
//
// 作用：用户在选择页点选一位诗人后，先全屏播放一段穿越过渡视频，
//       播完（或点「跳过」）自动 switchTab 到行迹地图（map），承接选中线。
//
// 视频已迁云存储（不随代码包发布，避免撑大主包、触发 200K 资源告警）：
//   cloud://<env>/assets/videos/poet-enter-map.mp4
// 播放时经 ttsUrl 云函数代取临时链接，直接交给 <video>（video 原生支持网络地址，
// 无需再落本地文件）。取链接失败 / 8 秒未开播 / 播放出错，一律直接进地图，不卡用户。
const TRANSITION_VIDEO_FILE_ID =
  'cloud://cloud1-d0g6bkxs13c9f980d.636c-cloud1-d0g6bkxs13c9f980d-1412525724/assets/videos/poet-enter-map.mp4';

Page({
  data: {
    videoUrl: '',    // 云端临时链接（设置后 video 自动播放）
    lineId: ''       // 待进入行迹的目标线（承接选人页写入的 mapFocus）
  },

  onLoad(query) {
    const q = query || {};
    this._unloaded = false;
    this.setData({ lineId: q.lineId || '' });
    // 进入页面后直接取云端视频链接，不阻塞选人 → 穿越的过渡
    this.loadVideo();
  },

  onUnload() {
    this._unloaded = true;
    // 页面销毁时清理定时器，避免 switchTab 后仍触发跳转
    if (this._gotoTimer) {
      clearTimeout(this._gotoTimer);
      this._gotoTimer = null;
    }
  },

  // 经 ttsUrl 云函数换取视频临时链接（与 BGM 同一条链路）
  loadVideo() {
    wx.cloud.callFunction({
      name: 'ttsUrl',
      data: { fileIDs: [TRANSITION_VIDEO_FILE_ID] },
      success: (res) => {
        const list = (res && res.result) || [];
        const f = list.find(x => x && x.tempFileURL);
        if (f && f.tempFileURL) {
          this._applyVideoUrl(f.tempFileURL);
        } else {
          this._handlePrepareError('未取到视频链接', f);
        }
      },
      fail: (err) => this._handlePrepareError('取视频链接失败', err)
    });
  },

  _handlePrepareError(message, err) {
    if (this._unloaded || this._gone) return;
    console.warn('[transition] ' + message, err);
    // 取链接失败不阻塞流程：直接进地图（保留兜底，用户无感）
    this.goMap();
  },

  // 拿到链接后：渲染视频 + 挂「开播确认」兜底
  _applyVideoUrl(url) {
    if (this._unloaded || this._gone) return;
    console.log('[transition] 云端视频链接已就绪', url);
    this.setData({ videoUrl: url });
    // 自愈兜底：8 秒内没真正开播（autoplay 被环境拦截/链接异常）→ 自动进地图
    if (this._gotoTimer) clearTimeout(this._gotoTimer);
    this._gotoTimer = setTimeout(() => {
      if (!this._played) {
        console.warn('[transition] 8s 未开播，兜底进入行迹地图');
        this.goMap();
      }
    }, 8000);
  },

  // 视频真正开始播放（autoplay 成功的确认信号）
  onVideoPlay() {
    this._played = true;
  },

  // 视频播放出错（网络/格式）→ 直接进地图，不卡用户
  onVideoError() {
    console.warn('[transition] 过渡视频播放出错，直接进入行迹地图');
    this.goMap();
  },

  // 视频播放结束 → 自动跳转行迹地图
  onVideoEnded() {
    this.goMap();
  },

  // 「跳过」按钮 → 立即跳转行迹地图
  onSkip() {
    this.goMap();
  },

  // 统一跳转：switchTab 到行迹地图（选中线已在选人页写入全局 mapFocus）
  goMap() {
    if (this._gone) return;  // 防重复跳转
    this._gone = true;
    if (this._gotoTimer) {
      clearTimeout(this._gotoTimer);
      this._gotoTimer = null;
    }
    wx.switchTab({ url: '/pages/map/map' });
  }
});
