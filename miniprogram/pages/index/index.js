// pages/index/index.js —— 首页（动态封面）
const app = getApp();
const assets = require('../../utils/cloudAssets');

// 封面视频：云存储 fileID（与音频同理，走云函数代取临时链接绕过存储权限）
const COVER_VIDEO_FILE_ID = 'cloud://cloud1-d0g6bkxs13c9f980d.636c-cloud1-d0g6bkxs13c9f980d-1412525724/video/cover-video-final.mp4';
// 封面底图（视频加载前的海报，大图已迁云存储）
const COVER_IMAGE = '/assets/' + 'images/cover/cover-vertical.jpg';

Page({
  data: {
    agreementChecked: false,
    ageConfirmed: false,
    logging: false,
    coverVideoUrl: '',  // 封面视频临时链接（取到后 video 自动播放）
    coverImage: ''      // 封面底图临时链接（视频加载前显示）
  },

  onLoad() {
    // 首次进入必须保持未勾选；只有用户此前主动确认过，才恢复其选择。
    const agreementChecked = app.globalData.agreementAccepted === true;
    const ageConfirmed = app.globalData.ageConfirmed === true;
    this.setData({ agreementChecked, ageConfirmed });
    if (!agreementChecked || !ageConfirmed) {
      return;
    }

    this.loadConsentAssets();
  },

  // Tab 页面再次显示时不会重跑 onLoad。删除学习档案后需在这里同步恢复未同意状态，
  // 避免旧页面残留的勾选状态被误认为用户重新同意。
  // 注意：封面已从 tabBar 移除，是纯冷启动页，不再有「切回首页 tab」的场景。
  onShow() {
    const accepted = app.globalData.agreementAccepted === true;
    const ageConfirmed = app.globalData.ageConfirmed === true;
    this.setData({ agreementChecked: accepted, ageConfirmed });
    if (!accepted || !ageConfirmed) {
      this._consentAssetsLoading = false;
      this.setData({
        coverVideoUrl: '',
        coverImage: ''
      });
    }
  },

  // 需要访问云端的封面图和音乐，仅在用户已经主动同意协议后加载。
  loadConsentAssets() {
    if (this._consentAssetsLoading) return;
    this._consentAssetsLoading = true;

    // 封面底图换云链接
    assets.resolvePaths([COVER_IMAGE]).then((map) => {
      this.setData({ coverImage: map[COVER_IMAGE] || COVER_IMAGE });
    });

    // 预取封面视频、背景音乐的临时链接（云函数代取，绕过免费版存储权限限制）
    this.loadCloudVideo(COVER_VIDEO_FILE_ID, 'coverVideoUrl');
    // 背景音乐：一进首页就尝试自动播放（若环境拦截自动播放，由首次手势 ensureBgm 兜底解锁）
    app.autoStartBgm();
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

  // 打开《隐私政策》：调微信官方接口展示《用户隐私保护指引》
  // （navigator 的 open-type 无 openPrivacyContract 取值，故用 bindtap 调 API）
  onOpenPrivacy() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        fail: (err) => console.warn('[index] 打开隐私政策失败', err)
      });
    } else {
      // 基础库过低时兜底：跳转到自行展示的协议页
      wx.navigateTo({ url: '/pages/agreement/agreement' });
    }
  },

  // 协议勾选状态完全由用户操作产生，不能默认代替用户同意。
  onAgreementChange(e) {
    const values = (e && e.detail && e.detail.value) || [];
    this.setData({ agreementChecked: values.indexOf('agree') !== -1 });
  },

  // 年龄确认与协议同意相互独立，均须由用户主动勾选，不能默认代替确认。
  onAgeChange(e) {
    const values = (e && e.detail && e.detail.value) || [];
    this.setData({ ageConfirmed: values.indexOf('age14') !== -1 });
  },

  // 离开首页（切 tab 等）时，音乐保持常驻不停止（全局单例由 app 管理）
  onHide() {
  },

  // 开始穿越：先同步微信官方隐私授权（未授权则弹官方授权窗），授权成功后再登录、进入业务
  async onStart() {
    // 防重复：授权、登录、穿越整条链路执行期间拒绝再次触发
    if (this.data.logging) return;

    if (!this.data.ageConfirmed) {
      wx.showToast({ title: '请确认已满14周岁', icon: 'none' });
      return;
    }

    if (!this.data.agreementChecked) {
      wx.showToast({ title: '请先阅读并自主勾选协议', icon: 'none' });
      return;
    }

    // 进入流程即加锁，避免授权/登录/穿越并发执行
    this.setData({ logging: true });

    try {
      // 1) 以微信侧状态为准同步官方隐私授权；未同意前不登录、不建档、不进入业务页
      const privacyOk = await app.ensurePrivacyAuth();
      if (!privacyOk) {
        wx.showToast({ title: '需同意隐私保护指引后才能开始使用', icon: 'none' });
        return;
      }

      // 2) 官方授权成功后才落本地同意状态（仅用户主动勾选并点击开始后记录）
      if (!app.globalData.agreementAccepted) {
        app.globalData.agreementAccepted = true;
        wx.setStorageSync('agreementAccepted', true);
      }
      if (!app.globalData.ageConfirmed) {
        app.globalData.ageConfirmed = true;
        wx.setStorageSync('ageConfirmed', true);
      }

      this.loadConsentAssets();

      // 3) 用户确认协议且取得官方授权后，未登录时才发起登录换取 OpenID、初始化学习档案
      if (!app.globalData.openid) {
        try {
          await app.silentLogin();
        } catch (err) {
          console.error('[index] 登录失败', err);
          // 真机排查：把云函数 errMsg 直接带到 toast 上（截断防溢出），一眼定位失败原因
          const raw = (err && (err.errMsg || err.message)) || '';
          const detail = String(raw).replace(/\s+/g, ' ').slice(0, 40);
          wx.showToast({ title: detail ? '登录失败: ' + detail : '登录失败，请重试', icon: 'none', duration: 5000 });
          return;
        }
      }

      // 4) 进入剧本选择页（诗人卡牌），首次手势解锁背景音乐。
      //    switchTab 会关闭所有非 tab 页面（含本启动封面），故封面只出现这一次，
      //    之后不会在 tab 切换中再次闪现——真正的「游戏式启动页」。
      app.ensureBgm();
      wx.switchTab({ url: '/pages/story/story' });
    } catch (err) {
      console.error('[index] 启动异常', err);
      wx.showToast({ title: '启动失败，请重试', icon: 'none' });
    } finally {
      this.setData({ logging: false });
    }
  },
});
