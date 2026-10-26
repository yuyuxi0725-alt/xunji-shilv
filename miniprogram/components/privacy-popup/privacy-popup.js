// components/privacy-popup/privacy-popup.js —— 统一的微信隐私授权弹窗（基础库 >= 2.32.3）
//
// 由 app.js 的 wx.onNeedPrivacyAuthorization 触发显示（被动监听）；
// 同意按钮走 open-type="agreePrivacyAuthorization" 同步微信官方授权状态，
// 并回传 resolve({ event: 'agree' }) 完成当前待处理授权；拒绝则回传 disagree。
//
// 首页与诗笺页都挂了这个组件（tabBar 页面切走后组件仍存活），因此：
//   · 仅在所属页面处于前台时显示，避免其它 tab 页残留无上下文的陈旧弹窗；
//   · 页面隐藏时收起可能残留的弹窗。
Component({
  data: {
    show: false
  },

  lifetimes: {
    attached() {
      const app = getApp();
      this._pageId = (this.getPageId && this.getPageId()) || '';
      this._unsub = app._onPrivacy(() => {
        if (this._isForeground()) this.setData({ show: true });
      });
    },
    detached() {
      if (this._unsub) this._unsub();
    }
  },

  pageLifetimes: {
    hide() {
      this.setData({ show: false });
    }
  },

  methods: {
    // 阻止弹窗底部页面滚动穿透
    noop() {},

    // 所属页面是否为当前前台页面（判定失败时按前台处理，宁可显示也不漏弹）
    _isForeground() {
      try {
        const pages = getCurrentPages();
        if (!pages.length) return true;
        const cur = pages[pages.length - 1];
        const curId = cur && cur.getPageId ? cur.getPageId() : '';
        if (this._pageId && curId) return curId === this._pageId;
        return true;
      } catch (e) {
        return true;
      }
    },

    // 用户点击「同意」：open-type 已同步微信，这里补一次 resolve 完成当前授权
    onAgree() {
      this._settle('agree');
    },

    // 用户点击「拒绝」
    onDisagree() {
      this._settle('disagree');
    },

    _settle(event) {
      const app = getApp();
      const resolve = app.globalData._privacyResolve;
      app.globalData._privacyResolve = null;
      this.setData({ show: false });
      if (!resolve) return;
      try {
        resolve(event === 'agree' ? { buttonId: 'agree-btn', event: 'agree' } : { event: 'disagree' });
      } catch (e) {
        console.warn('[privacy-popup] resolve 异常', e);
      }
    },

    // 打开《隐私政策》（微信配置的《用户隐私保护指引》）
    onOpenContract() {
      if (wx.openPrivacyContract) {
        wx.openPrivacyContract({});
      }
    }
  }
});
