// pages/about/about.js —— 关于（版本号 + 备案号公示 + AI 生成内容标识）
const APP_INFO = require('../../utils/constants').APP_INFO;

Page({
  data: {
    name: APP_INFO.name,
    version: APP_INFO.version,
    icpNo: APP_INFO.icpNo,
    // 备案号留空时展示占位文案，避免页面出现空白突兀
    icpDisplay: APP_INFO.icpNo || '备案通过后展示',
    policeNo: APP_INFO.policeNo,
    company: APP_INFO.company,
    beianUrl: APP_INFO.beianUrl
  },

  // 复制备案号（便于用户前往工信部系统核验）
  onCopyBeian() {
    if (!this.data.icpNo) {
      wx.showToast({ title: '备案号暂未生成', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.icpNo,
      success: () => wx.showToast({ title: '备案号已复制', icon: 'success' })
    });
  },

  // 复制工信部查询网址（小程序内不便直接外链，复制后引导用户浏览器打开）
  onCopyUrl() {
    wx.setClipboardData({
      data: this.data.beianUrl,
      success: () => wx.showToast({ title: '查询网址已复制', icon: 'success' })
    });
  }
});
