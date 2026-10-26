// pages/player/player.js —— 玩家角色「创建 / 确认 / 编辑」统一页（杜甫/李白/苏轼三线共用）
//
// 把角色创建逻辑从 chat 页内联浮层抽出，收敛为唯一入口。
// 三种模式：
//   · 创建（无档案）    —— 默认名「寻迹者」，选形象后保存 confirmed:true；
//   · 确认（迁移草稿）  —— 预填旧外观 + 默认名，确认一次转为 confirmed:true；
//   · 编辑（已确认档案）—— 预填当前资料，保存更新整份档案（不动进度）。
//
// 返回意图走白名单（见 utils/player-guard.js）：
//   target=transition  → 确认后 redirectTo 穿越转场页（接行迹地图）；
//   target=chat        → 确认后 redirectTo 原地点聊天页（continue/replay）；
//   target=profile     → 编辑保存后 navigateBack 返回「我的」。
// 页面标题/说明文字/lineName 按 query.lineId 动态显示（杜甫/李白/苏轼）。
const playerAvatars = require('../../utils/player-avatars');
const playerPortrait = require('../../utils/player-portrait');
const playerProfile = require('../../utils/player-profile');
const progress = require('../../utils/progress');
const guard = require('../../utils/player-guard');
const stories = require('../../utils/stories/index');
const assets = require('../../utils/cloudAssets');

Page({
  data: {
    lineId: 'dufu',
    lineName: '杜甫',
    target: 'transition',
    edit: false,
    roleList: [],           // 三张外观卡（形象一/二/三 + 立绘）
    selectedRoleId: '',     // 当前选中外观 id
    playerNameInput: '',    // 姓名输入
    confirmReady: false,    // 外观 + 姓名均合法时可用
    confirmText: '以此形象出发',
    submitting: false,      // 防连点：提交中
    intro: ''               // 世界观说明
  },

  onLoad(query) {
    const q = query || {};
    const intent = guard.parseIntent(q, this._isValidLocation.bind(this));
    if (!intent) {
      wx.showToast({ title: '入口无效', icon: 'none' });
      setTimeout(() => {
        if (this._unloaded) return;
        wx.navigateBack({ delta: 1 });
      }, 900);
      return;
    }
    this._intent = intent;
    this._edit = intent.target === 'profile' && intent.edit;
    this._lineId = intent.lineId;

    const line = stories.getLine(intent.lineId);
    const lineName = (line && line.name) || '这位诗人';

    // 读取当前角色档案（含迁移草稿），用于预填
    const profile = progress.getPlayerProfile(intent.lineId);
    const selectedRoleId = (profile && playerAvatars.isValidAvatar(profile.avatarId)) ? profile.avatarId : '';
    const playerNameInput = (profile && profile.displayName) ? profile.displayName : playerProfile.DEFAULT_NAME;
    const confirmText = this._edit ? '保存'
      : (profile ? '确认以此形象出发' : '以此形象出发');

    this.setData({
      lineId: intent.lineId,
      lineName,
      target: intent.target,
      edit: this._edit,
      roleList: this._buildRoleList(),
      selectedRoleId,
      playerNameInput,
      confirmText,
      intro: '你将穿行于' + lineName + '人生中的重要时刻。岁月会改变他的模样，而你仍是初见时的样子；每次重逢，他都记得你们曾走过的路。'
    });
    // 同时保留一份不依赖视图渲染时序的输入值。真机输入法合成、热重载等场景下，
    // 原生 input 已显示新值而 this.data 尚未刷新时，提交仍能读取最新输入。
    this._latestNameInput = playerNameInput;
    this._refreshConfirmReady();
    this._resolvePortraits();
  },

  onUnload() {
    this._unloaded = true;
  },

  // 地点合法性（target=chat 时校验，防借角色页绕过锁定地点）
  _isValidLocation(lineId, locationId) {
    if (!lineId || !locationId) return false;
    const line = stories.getLine(lineId);
    if (!line) return false;
    const locations = stories.getLocations(lineId);
    const order = locations.map(l => l.id);
    const states = progress.computeLocationStates(lineId, order);
    const loc = locations.find(l => l.id === locationId);
    return !!loc && states[locationId] !== 'locked';
  },

  _buildRoleList() {
    return playerAvatars.AVATARS.map(a => ({
      id: a.id,
      name: a.name,
      portraitKey: a.portraitKey,
      portraitImage: ''
    }));
  },

  // portraitKey → 云端立绘路径（统一走 utils/player-portrait.js，与聊天页同一实现）
  _resolveRolePortrait(portraitKey) {
    return playerPortrait.portraitPathOfKey(portraitKey);
  },

  // 异步解析三张外观卡立绘；页面卸载后丢弃迟到结果。只回填 portraitImage，
  // 绝不改动 selectedRoleId（避免旧异步响应把选中态改回旧形象）。
  _resolvePortraits() {
    const paths = playerAvatars.AVATARS.map(a => this._resolveRolePortrait(a.portraitKey)).filter(Boolean);
    if (!paths.length) return;
    assets.resolvePaths(paths).then((map) => {
      if (this._unloaded) return;
      const list = this.data.roleList.map(item => {
        const path = this._resolveRolePortrait(item.portraitKey);
        const url = map[path] || '';
        return url ? Object.assign({}, item, { portraitImage: url }) : item;
      });
      this.setData({ roleList: list });
    });
  },

  // 外观卡点击：只标记选中，不立即进入
  onRoleCardTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    this.setData({ selectedRoleId: id });
    this._refreshConfirmReady();
  },

  // 姓名输入：实时回写，同步刷新确认可用态
  onNameInput(e) {
    const value = (e && e.detail && typeof e.detail.value === 'string') ? e.detail.value : '';
    this._latestNameInput = value;
    this.setData({ playerNameInput: value });
    this._refreshConfirmReady(value);
  },

  // 失焦时把粘贴/输入法带入的不可见字符清掉，并让界面与待保存值一致。
  onNameBlur(e) {
    const raw = (e && e.detail && typeof e.detail.value === 'string')
      ? e.detail.value
      : this._latestNameInput;
    const name = playerProfile.sanitizeNameInput(raw || '');
    this._latestNameInput = name;
    this.setData({ playerNameInput: name });
    this._refreshConfirmReady(name);
  },

  // 外观 + 姓名都合法才允许确认
  _refreshConfirmReady(rawName) {
    const okAvatar = playerAvatars.isValidAvatar(this.data.selectedRoleId);
    const source = (typeof rawName === 'string') ? rawName
      : (typeof this._latestNameInput === 'string' ? this._latestNameInput : this.data.playerNameInput);
    const name = playerProfile.sanitizeNameInput(source);
    const okName = playerProfile.isValidName(name);
    this.setData({ confirmReady: okAvatar && okName });
  },

  // 立绘加载失败：清掉该卡图片 → 回退 CSS 剪影占位（不裂图）
  onPortraitError(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const list = this.data.roleList.map(item => (
      item.id === id ? Object.assign({}, item, { portraitImage: '' }) : item
    ));
    this.setData({ roleList: list });
  },

  // 返回（创建/确认模式取消 → 不写任何档案，原路返回）
  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 确认 / 保存：校验 → 写档案 → 跳转目标（防连点只提交一次）
  onConfirm(e) {
    if (this.data.submitting) return;
    const id = this.data.selectedRoleId;
    if (!id || !playerAvatars.isValidAvatar(id)) {
      console.warn('[player] 非法外观 id，忽略确认', id);
      return;
    }
    // form submit 直接带回原生 input 当前显示值，避免只依赖 bindinput/setData 的时序。
    const formValues = e && e.detail && e.detail.value;
    const submittedName = formValues && typeof formValues.playerName === 'string'
      ? formValues.playerName
      : this._latestNameInput;
    const rawName = (typeof submittedName === 'string') ? submittedName : this.data.playerNameInput;
    const name = playerProfile.sanitizeNameInput(rawName);
    if (!playerProfile.isValidName(name)) {
      wx.showToast({ title: '姓名需为 1–8 个汉字、字母或数字', icon: 'none' });
      return;
    }

    this._latestNameInput = name;
    if (name !== this.data.playerNameInput) this.setData({ playerNameInput: name });

    // 锁提交，防止连点重复写入 / 重复跳转
    this.setData({ submitting: true });

    const profile = progress.savePlayerProfile(this.data.lineId, id, name);
    if (!profile) {
      this.setData({ submitting: false });
      wx.showToast({ title: '保存角色失败，请重试', icon: 'none' });
      return;
    }

    this._navigateAfterConfirm();
  },

  // 确认后按白名单意图跳转
  _navigateAfterConfirm() {
    const intent = this._intent;
    if (!intent) { this.setData({ submitting: false }); return; }

    if (intent.target === 'transition') {
      // 接回穿越转场（选人页已写好 setSelectedLine + mapFocus）
      wx.redirectTo({
        url: '/pages/transition/transition?lineId=' + intent.lineId,
        fail: () => this.setData({ submitting: false })
      });
      return;
    }

    if (intent.target === 'chat') {
      // 回到原地点聊天页（continue 保留检查点 / replay 从头回放）
      wx.redirectTo({
        url: '/pages/chat/chat?storyId=' + intent.lineId
          + '&locationId=' + intent.locationId
          + '&mode=' + intent.mode,
        fail: () => this.setData({ submitting: false })
      });
      return;
    }

    // target=profile：编辑保存后返回「我的」
    this.setData({ submitting: false });
    wx.navigateBack({ delta: 1 });
  }
});
