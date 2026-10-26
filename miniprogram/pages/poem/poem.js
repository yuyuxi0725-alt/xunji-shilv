// pages/poem/poem.js —— 我的诗笺（记录游玩过程中点亮的知识点）
//
// 定位（用户 2026-10-19 确认）：
//   诗笺页从「记载玩家选择」彻底转为「记录玩家游玩过程中点亮的知识印谱」。
//   按诗人分册、按时期分组，每个已点亮的
//   锚点显示「朱印 seal + 名称 + 一句话 know」，点开可看完整史料（detail/poem/links）。
//   挂了 poem 的锚点诗以「竖排诗句」形式呈现在印记下方，延续诗笺页的视觉灵魂。
//
// 数据来源：统一存储层 utils/progress.js
//   progress.getAnchors(lineId) → { [anchorId]: true }（本诗人全局已点亮集合）
//   名称表 line.anchors[id] → 中文名；展示内容表 anchor-info.js getAnchorInfo。
//   本页不直接读写 storage（昵称除外，昵称本就存于 userNickname）。

const stories = require('../../utils/stories/index');
const progress = require('../../utils/progress');
const anchorInfo = require('../../utils/stories/anchor-info');
const app = getApp();

const DEFAULT_NICK = '少年史官';

Page({
  data: {
    nickname: DEFAULT_NICK,
    lineTabs: [],
    currentLineId: '',
    collected: 0,
    total: 0,
    groups: [],          // 按时期分组的锚点条目
    selectedAnchor: null, // 弹窗详情
    exporting: false,
    cw: 600,
    ch: 1500
  },

  onLoad(query) {
    this._pendingQuery = query || {};
  },

  onShow() {
    if (app.globalData.poemFocus) {
      this._pendingQuery = app.globalData.poemFocus;
      app.globalData.poemFocus = null;
    }
    this.refresh();
  },

  refresh() {
    const nickname = wx.getStorageSync('userNickname') || DEFAULT_NICK;
    const lines = stories.getOnlineLines();
    const lineTabs = lines.map((line) => {
      const mine = progress.getAnchors(line.id);
      const collected = Object.keys(mine).length;
      const total = Object.keys(line.anchors || {}).length;
      return { id: line.id, name: line.name, collected, total };
    });

    const q = this._pendingQuery || {};
    this._pendingQuery = null;
    const requestedLine = q.lineId && lineTabs.some(t => t.id === q.lineId) ? q.lineId : '';
    const retainedLine = this.data.currentLineId && lineTabs.some(t => t.id === this.data.currentLineId) ? this.data.currentLineId : '';
    const lineId = requestedLine || retainedLine || (lineTabs[0] && lineTabs[0].id) || '';

    const view = this.buildLineView(lineId);
    this.setData(Object.assign({ nickname, lineTabs }, view));
  },

  buildLineView(lineId) {
    const line = stories.getLine(lineId);
    if (!line) {
      return { currentLineId: '', collected: 0, total: 0, groups: [] };
    }

    const table = line.anchors || {};
    const mine = progress.getAnchors(lineId);
    const anchorPeriods = this.buildAnchorPeriods(line);
    const periods = line.periods || [];
    const periodMap = {};
    periods.forEach((period) => {
      periodMap[period.id] = { id: period.id, name: period.name, range: period.range || '', cards: [] };
    });

    const extra = { id: 'other', name: '其他印记', range: '', cards: [] };
    const cardMap = {};
    Object.keys(table).forEach((id) => {
      if (!mine[id]) return;
      const info = anchorInfo.getAnchorInfo(lineId, id) || anchorInfo.FALLBACK;
      const poem = info.poem || null;
      const card = {
        id,
        name: table[id],
        seal: info.seal || '寻迹印记',
        know: info.know || '',
        detail: info.detail || '',
        links: info.links || [],
        poem,
        hasPoem: !!poem
      };
      cardMap[id] = card;
      const periodId = anchorPeriods[id];
      if (periodId && periodMap[periodId]) periodMap[periodId].cards.push(card);
      else extra.cards.push(card);
    });

    this._cardMap = cardMap;
    const groups = periods.map(p => periodMap[p.id]).filter(g => g.cards.length);
    if (extra.cards.length) groups.push(extra);
    const total = Object.keys(table).length;
    const collected = Object.keys(cardMap).length;

    return {
      currentLineId: lineId,
      collected,
      total,
      groups,
      selectedAnchor: null
    };
  },

  // 静态节点和考据节点都可能携带 anchor，直接序列化每一期即可覆盖两者；
  // 通关记录用于补齐 AI 对话中动态获得、但剧本里不易定位的锚点。
  buildAnchorPeriods(line) {
    const out = {};
    const ids = Object.keys(line.anchors || {});
    (line.periods || []).forEach((period) => {
      const questText = JSON.stringify((line.quests && line.quests[period.id]) || {});
      ids.forEach((id) => {
        if (!out[id] && questText.indexOf('"' + id + '"') >= 0) out[id] = period.id;
      });
      const record = progress.getRecord(line.id, period.id) || {};
      (record.anchors || []).forEach((id) => {
        if (!out[id]) out[id] = period.id;
      });
    });
    return out;
  },

  onSwitchLine(e) {
    const lineId = e.currentTarget.dataset.id;
    if (!lineId || lineId === this.data.currentLineId) return;
    this.setData(this.buildLineView(lineId));
  },

  onOpenAnchor(e) {
    const id = e.currentTarget.dataset.id;
    const card = this._cardMap && this._cardMap[id];
    if (card) this.setData({ selectedAnchor: card });
  },

  onCloseAnchor() {
    this.setData({ selectedAnchor: null });
  },

  noop() {},

  // ================= 导出为图片（真 canvas 绘制） =================

  onExport(e) {
    const id = e.currentTarget.dataset.id;
    const card = this._cardMap && this._cardMap[id];
    if (!card) return;
    if (this.data.exporting) return;
    this.setData({ exporting: true });
    wx.showLoading({ title: '正在写笺…', mask: true });

    this.renderToImage(card).then((tempPath) => {
      wx.hideLoading();
      this.setData({ exporting: false });
      if (!tempPath) {
        this.degradeToCopy(card);
        return;
      }
      this.saveToAlbum(tempPath);
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ exporting: false });
      console.warn('[poem] 导出异常', err);
      this.degradeToCopy(card);
    });
  },

  renderToImage(card) {
    return new Promise((resolve) => {
      wx.createSelectorQuery()
        .select('#poemCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const node = res && res[0] && res[0].node;
          if (!node) { resolve(''); return; }
          let dpr = 2;
          try {
            const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
            dpr = Math.min(Math.max(info.pixelRatio || 2, 1), 3);
          } catch (err) { dpr = 2; }

          const W = 600;
          const H = 1100;
          node.width = Math.round(W * dpr);
          node.height = Math.round(H * dpr);
          const ctx = node.getContext('2d');
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, node.width, node.height);
          ctx.scale(dpr, dpr);

          const endY = this.drawCard(ctx, card, W, H);
          const cropH = Math.max(360, Math.min(H, Math.ceil(endY)));

          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas: node,
              x: 0, y: 0, width: W, height: cropH,
              destWidth: Math.round(W * dpr),
              destHeight: Math.round(cropH * dpr),
              fileType: 'jpg', quality: 0.95,
              success: (r) => resolve((r && r.tempFilePath) || ''),
              fail: () => resolve('')
            });
          }, 120);
        });
    });
  },

  // 逐笔重绘单枚印记版式；返回内容实际高度（供裁剪）
  drawCard(ctx, card, W, H) {
    const PAD = 44;
    const CW = W - PAD * 2;

    // 纸底
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#faf6ea');
    g.addColorStop(1, '#f1e8d5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 竖向笺纸格线
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.10)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i++) {
      const x = PAD + (i * CW) / 7;
      ctx.beginPath();
      ctx.moveTo(x, PAD * 0.6);
      ctx.lineTo(x, H - PAD);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    let y = PAD;

    // 抬头
    ctx.fillStyle = '#9a7d54';
    ctx.font = '20px serif';
    ctx.fillText('寻迹诗旅 · 知识印谱', PAD, y + 14);
    y += 26;
    ctx.fillStyle = '#4a3220';
    ctx.font = 'bold 36px serif';
    ctx.fillText(card.name || '印记', PAD, y + 34);
    y += 50;

    // 朱色 seal 标签
    const seal = card.seal || '寻迹印记';
    ctx.font = '20px serif';
    const sealW = Math.max(30, ctx.measureText(seal).width + 16);
    ctx.fillStyle = 'rgba(163, 58, 43, 0.08)';
    ctx.fillRect(PAD, y - 18, sealW, 30);
    ctx.strokeStyle = 'rgba(163, 58, 43, 0.42)';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD + 0.5, y - 17.5, sealW - 1, 29);
    ctx.fillStyle = '#a33a2b';
    ctx.textAlign = 'center';
    ctx.fillText(seal, PAD + sealW / 2, y + 3);
    ctx.textAlign = 'left';
    y += 28;

    y = this.rule(ctx, PAD, y, CW);

    // 一句话知识
    if (card.know) {
      ctx.fillStyle = '#6f4d29';
      ctx.font = 'bold 26px serif';
      const knowLines = this.wrap(ctx, card.know, CW);
      knowLines.forEach((ln) => {
        ctx.fillText(ln, PAD, y + 24);
        y += 40;
      });
      y += 8;
    }

    // 诗句（横排，居中）
    const poem = card.poem;
    if (poem) {
      ctx.fillStyle = '#4a3520';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('《' + poem.title + '》', PAD + CW / 2, y + 26);
      ctx.textAlign = 'left';
      y += 44;
      ctx.fillStyle = '#9d8972';
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.fillText(poem.author + (poem.displayMode === 'excerpt' ? ' · 节选' : ''), PAD + CW / 2, y + 16);
      ctx.textAlign = 'left';
      y += 32;

      // 横排诗句：一行一句，highlight 句标朱砂
      ctx.font = '28px serif';
      (poem.lines || []).forEach((ln) => {
        ctx.fillStyle = ln.highlight ? '#a33a2b' : '#5c4b39';
        ctx.textAlign = 'center';
        ctx.fillText(ln.text || '', PAD + CW / 2, y + 24);
        ctx.textAlign = 'left';
        y += 40;
      });
      y += 6;

      if (poem.insight) {
        y = this.rule(ctx, PAD, y, CW);
        ctx.fillStyle = '#806b54';
        ctx.font = '20px serif';
        const ins = this.wrap(ctx, poem.insight, CW);
        ins.forEach((ln) => { ctx.fillText(ln, PAD, y + 18); y += 30; });
      }
    }

    // 页脚
    y = this.rule(ctx, PAD, y + 6, CW);
    ctx.fillStyle = '#a08c6b';
    ctx.font = '20px serif';
    ctx.fillText('循一卷诗书，赴一场千年之约', PAD, y + 20);
    ctx.textAlign = 'right';
    ctx.fillText('寻迹诗旅', W - PAD, y + 20);
    ctx.textAlign = 'left';
    y += 42;

    const endY = y + PAD * 0.6;
    ctx.fillStyle = '#f6efe0';
    ctx.fillRect(0, endY - PAD * 0.5, W, H - endY + PAD);

    // 外框双线
    ctx.strokeStyle = '#cbb894';
    ctx.lineWidth = 2;
    ctx.strokeRect(PAD * 0.5, PAD * 0.5, W - PAD, endY - PAD);
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.32)';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD * 0.5 + 8, PAD * 0.5 + 8, W - PAD - 16, endY - PAD - 16);

    return endY;
  },

  wrap(ctx, text, maxW) {
    const out = [];
    let cur = '';
    const s = String(text == null ? '' : text);
    for (let i = 0; i < s.length; i++) {
      const ch = s.charAt(i);
      if (ch === '\n') { out.push(cur); cur = ''; continue; }
      const t = cur + ch;
      if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = ch; }
      else cur = t;
    }
    if (cur) out.push(cur);
    return out.length ? out : [''];
  },

  rule(ctx, x, y, w) {
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x + w, y + 10);
    ctx.stroke();
    return y + 28;
  },

  // ================= 文案（复制降级通道） =================

  buildPlainText(card) {
    const lines = [];
    lines.push('【寻迹诗旅 · 知识印谱】');
    lines.push(`【${card.seal}】${card.name}`);
    if (card.know) lines.push(card.know);
    const p = card.poem;
    if (p) {
      lines.push(`《${p.title}》${p.author}${p.displayMode === 'excerpt' ? '（节选）' : ''}`);
      p.lines.forEach(l => lines.push(l.text));
      if (p.insight) lines.push(p.insight);
    }
    lines.push('—— 循一卷诗书，赴一场千年之约');
    return lines.join('\n');
  },

  onCopy(e) {
    const card = this._cardMap && this._cardMap[e.currentTarget.dataset.id];
    if (!card) return;
    wx.setClipboardData({
      data: this.buildPlainText(card),
      success: () => wx.showToast({ title: '印记文案已复制', icon: 'none' }),
      fail: () => wx.showToast({ title: '复制失败，请长按选中', icon: 'none' })
    });
  },

  // ---- 保存到相册（含权限判断 + 官方隐私授权同步） ----
  saveToAlbum(filePath) {
    app.ensurePrivacyAuth().then((ok) => {
      if (!ok) {
        wx.showToast({ title: '需同意隐私保护指引后才能保存诗笺', icon: 'none' });
        return;
      }
      wx.saveImageToPhotosAlbum({
        filePath,
        success: () => wx.showToast({ title: '诗笺已存入相册', icon: 'success' }),
        fail: (err) => {
          const msg = (err && err.errMsg) || '';
          if (msg.indexOf('auth') >= 0 || msg.indexOf('authorize') >= 0 || msg.indexOf('deny') >= 0) {
            wx.showModal({
              title: '需要相册权限',
              content: '诗笺图片已生成，但保存相册需要你的授权。可在设置里打开「保存到相册」后重试。',
              confirmText: '去设置', cancelText: '稍后', confirmColor: '#8b5a2b',
              success: (r) => { if (r.confirm) wx.openSetting(); }
            });
          } else if (msg.indexOf('cancel') >= 0) {
            // 用户主动取消，不打扰
          } else {
            wx.showToast({ title: '保存失败，可长按截图保存', icon: 'none' });
          }
        }
      });
    });
  },

  degradeToCopy(card) {
    wx.setClipboardData({
      data: this.buildPlainText(card),
      success: () => {
        wx.showModal({
          title: '图片生成失败',
          content: '已把这条印记的文字版复制到剪贴板，可直接粘贴分享。',
          showCancel: false, confirmText: '知道了', confirmColor: '#8b5a2b'
        });
      },
      fail: () => wx.showToast({ title: '可长按截图保存', icon: 'none' })
    });
  },

  goStory() {
    wx.switchTab({ url: '/pages/story/story' });
  }
});
