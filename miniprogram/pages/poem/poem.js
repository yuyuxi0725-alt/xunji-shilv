// pages/poem/poem.js —— 我的诗笺（可保存 / 可分享的玩家产出物）
//
// 设计意图（docs/参赛行动方案.md P1-4）：
//   每通关一期生成一张竖版「诗笺卡」，把玩家自己的选择变成一件可保存、可分享的产物，
//   解决"玩完就没了"的收获感问题。
//
// 数据来源：统一存储层 utils/progress.js 的 questRecords
//   progress.getLineRecords(lineId) → { [periodId]: record }
//   record 字段：completedAt / anchors / anchorNames / anchorTotal / choices /
//                keyChoice / trapCaught / trapTotal / quizCorrect / quizTotal / poem
//   本页不直接读写 storage（昵称除外，昵称本就存于 userNickname）。
//
// 导出实现：真 canvas 导出
//   用 type="2d" 的离屏 canvas 逐笔重绘诗笺版式 → wx.canvasToTempFilePath
//   → wx.saveImageToPhotosAlbum（含权限判断与失败提示）。
//   同时提供「复制文案」作为永远可用的降级通道。

const stories = require('../../utils/stories/index');
const progress = require('../../utils/progress');

const DEFAULT_NICK = '少年史官';
const INDEX_CHARS = { p1: '壹', p2: '贰', p3: '叁', p4: '肆', p5: '伍', p6: '陆' };

// canvas 逻辑尺寸（px）。高度给足，导出时按实际内容裁剪。
const CANVAS_W = 600;
const CANVAS_H = 1500;
const POEM_PER_COL = 12;    // 竖排每列最多几个字
const POEM_COL_GAP = 42;    // 竖排列间距

// ---------- 工具 ----------

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// 取 1–3 条最能代表玩家的关键选择：决定性瞬间优先，其余按顺序补足
function pickChoices(list) {
  const arr = (list || []).filter(c => c && c.text);
  const decisive = arr.filter(c => typeof c.right === 'boolean');
  const others = arr.filter(c => typeof c.right !== 'boolean');
  return decisive.concat(others).slice(0, 3).map(c => ({
    text: c.text,
    right: c.right === true,
    cls: c.right === true ? 'on' : (c.right === false ? 'off' : ''),
    label: c.right === true ? '◎ ' : (c.right === false ? '○ ' : '· ')
  }));
}

// 逐字折行（中文按字宽算，够用且不依赖任何排版库）
function wrapText(ctx, text, maxW) {
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
}

// 竖排诗句按列切分（每列一个对象，便于 wxml 用稳定的 key）
function toPoemCols(poem) {
  const chars = String(poem || '').split('');
  const cols = [];
  for (let i = 0; i < chars.length; i += POEM_PER_COL) {
    const slice = chars.slice(i, i + POEM_PER_COL);
    cols.push({
      k: 'col' + i,
      cells: slice.map((ch, j) => ({ k: 'c' + i + '-' + j, ch }))
    });
  }
  return cols;
}

Page({
  data: {
    nickname: DEFAULT_NICK,
    isEmpty: true,
    cards: [],
    cw: CANVAS_W,      // 离屏 canvas 逻辑宽（px）
    ch: CANVAS_H,      // 离屏 canvas 逻辑高（px）
    exporting: false
  },

  onLoad(query) {
    this._query = query || {};
  },

  onShow() {
    this.refresh();
  },

  // 每次进入都重算（通关记录可能刚更新）
  refresh() {
    const nickname = wx.getStorageSync('userNickname') || DEFAULT_NICK;
    const cards = this.buildCards(nickname);
    const q = this._query || {};
    const hlKey = (q.lineId && q.periodId) ? (q.lineId + '-' + q.periodId) : '';
    let hit = false;
    cards.forEach((c) => {
      if (hlKey && c.key === hlKey) { c.highlight = true; hit = true; }
    });
    this.setData({ nickname, cards, isEmpty: cards.length === 0 }, () => {
      if (hit) this.scrollToCard(hlKey);
    });
  },

  // 汇总两条线全部通关记录，按通关时间倒序（最新的在最上面）
  buildCards(nickname) {
    const out = [];
    stories.getOnlineLines().forEach((line) => {
      const periods = line.periods || [];
      const periodMap = {};
      periods.forEach((p) => { periodMap[p.id] = p; });

      const recs = progress.getLineRecords(line.id) || {};
      Object.keys(recs).forEach((pid) => {
        const rec = recs[pid] || {};
        if (!rec.completedAt) return;         // 只收真正通关过的时期
        const period = periodMap[pid] || {};
        const idx = periods.findIndex(p => p.id === pid);

        const choices = pickChoices(rec.choices);
        const anchorNames = (rec.anchorNames && rec.anchorNames.length)
          ? rec.anchorNames.slice()
          : Object.keys(rec.anchors || {});
        const poem = rec.poem || period.poem || '';
        const trapTotal = rec.trapTotal || 0;
        const quizTotal = rec.quizTotal || 0;
        const keyChoice = rec.keyChoice || '';
        const verdict = keyChoice === 'right' ? '此程抉择 · 与先生同心'
          : (keyChoice === 'wrong' ? '此程抉择 · 你另辟了一径' : '');

        const card = {
          key: line.id + '-' + pid,
          lineId: line.id,
          lineName: line.name,
          periodId: pid,
          periodName: period.name || pid,
          range: period.range || '',
          indexChar: INDEX_CHARS[pid] || (idx >= 0 ? String(idx + 1) : ''),
          dateText: fmtDate(rec.completedAt),
          completedAt: rec.completedAt || 0,
          nickname,

          choices,
          hasChoices: choices.length > 0,

          anchorNames,
          anchorText: anchorNames.join('、'),
          anchorLit: anchorNames.length,
          anchorTotal: rec.anchorTotal || 0,

          trapCaught: rec.trapCaught || 0,
          trapTotal,
          hasTrap: trapTotal > 0,
          quizCorrect: rec.quizCorrect || 0,
          quizTotal,
          hasQuiz: quizTotal > 0,

          verdict,
          hasVerdict: !!verdict,

          poem,
          poemChars: String(poem || '').split(''),
          poemCols: toPoemCols(poem),
          highlight: false
        };
        out.push(card);
      });
    });
    out.sort((a, b) => b.completedAt - a.completedAt);
    return out;
  },

  // 从行迹地图带 ?lineId=&periodId= 进来时，滚动到对应那张
  scrollToCard(key) {
    setTimeout(() => {
      try {
        const q = wx.createSelectorQuery();
        q.select('#card-' + key).boundingClientRect();
        q.selectViewport().scrollOffset();
        q.exec((res) => {
          const rect = res && res[0];
          const sc = res && res[1];
          if (!rect || !sc) return;
          wx.pageScrollTo({ scrollTop: Math.max(0, sc.scrollTop + rect.top - 40), duration: 300 });
        });
      } catch (e) {
        console.warn('[poem] 定位诗笺失败', e);
      }
    }, 260);
  },

  // ================= 文案（复制 / 分享降级通道） =================

  buildPlainText(card) {
    const lines = [];
    lines.push('【寻迹 · 古今 · 我的诗笺】');
    lines.push(`${card.nickname} · ${card.lineName}线 第${card.indexChar}程「${card.periodName}」${card.range ? '(' + card.range + ')' : ''}`);
    if (card.poem) lines.push(`「${card.poem}」`);
    if (card.hasChoices) lines.push('我在这一程的抉择：' + card.choices.map(c => c.text).join('；'));
    if (card.anchorNames.length) lines.push(`点亮锚点 ${card.anchorLit}/${card.anchorTotal || card.anchorLit}：` + card.anchorNames.join('、'));
    const stats = [];
    if (card.hasTrap) stats.push(`考据之眼 抓出 ${card.trapCaught}/${card.trapTotal} 处史实错漏`);
    if (card.hasQuiz) stats.push(`先生考校 答对 ${card.quizCorrect}/${card.quizTotal} 题`);
    if (stats.length) lines.push(stats.join('｜'));
    if (card.hasVerdict) lines.push(card.verdict);
    lines.push(`书于 ${card.dateText}`);
    lines.push('—— 循一卷诗书，赴一场千年之约');
    return lines.join('\n');
  },

  onCopy(e) {
    const card = this.findCard(e.currentTarget.dataset.key);
    if (!card) return;
    wx.setClipboardData({
      data: this.buildPlainText(card),
      success: () => wx.showToast({ title: '诗笺文案已复制', icon: 'none' }),
      fail: () => wx.showToast({ title: '复制失败，请长按选中', icon: 'none' })
    });
  },

  findCard(key) {
    return (this.data.cards || []).find(c => c.key === key) || null;
  },

  // ================= 导出为图片（真 canvas 绘制） =================

  onExport(e) {
    const card = this.findCard(e.currentTarget.dataset.key);
    if (!card) return;
    if (this.data.exporting) return;
    this.setData({ exporting: true });
    wx.showLoading({ title: '正在写笺…', mask: true });

    this.renderToImage(card).then((tempPath) => {
      wx.hideLoading();
      this.setData({ exporting: false });
      if (!tempPath) {
        this.degradeToCopy(card, '图片生成失败');
        return;
      }
      this.saveToAlbum(tempPath);
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ exporting: false });
      console.warn('[poem] 导出异常', err);
      this.degradeToCopy(card, '图片生成失败');
    });
  },

  // 拿 canvas 节点 → 逐笔绘制 → 裁剪导出
  renderToImage(card) {
    return new Promise((resolve) => {
      wx.createSelectorQuery()
        .select('#poemCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const node = res && res[0] && res[0].node;
          if (!node) {
            console.warn('[poem] 未取到 canvas 节点（基础库过低？）');
            resolve('');
            return;
          }
          let dpr = 2;
          try {
            const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
            dpr = Math.min(Math.max(info.pixelRatio || 2, 1), 3);
          } catch (err) { dpr = 2; }

          node.width = Math.round(CANVAS_W * dpr);
          node.height = Math.round(CANVAS_H * dpr);
          const ctx = node.getContext('2d');
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, node.width, node.height);
          ctx.scale(dpr, dpr);

          const endY = this.drawCard(ctx, card);
          const cropH = Math.max(360, Math.min(CANVAS_H, Math.ceil(endY)));

          // 等一帧，确保 2d canvas 绘制已提交
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas: node,
              x: 0,
              y: 0,
              width: CANVAS_W,
              height: cropH,
              destWidth: Math.round(CANVAS_W * dpr),
              destHeight: Math.round(cropH * dpr),
              fileType: 'jpg',
              quality: 0.95,
              success: (r) => resolve((r && r.tempFilePath) || ''),
              fail: (err) => {
                console.warn('[poem] canvasToTempFilePath 失败', err);
                resolve('');
              }
            });
          }, 120);
        });
    });
  },

  // 逐笔重绘诗笺版式；返回内容实际高度（供裁剪）
  drawCard(ctx, card) {
    const W = CANVAS_W;
    const PAD = 44;
    const CW = W - PAD * 2;

    // ---- 纸底 ----
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    g.addColorStop(0, '#faf6ea');
    g.addColorStop(1, '#f1e8d5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, CANVAS_H);

    // ---- 竖向笺纸格线 ----
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.10)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i++) {
      const x = PAD + (i * CW) / 7;
      ctx.beginPath();
      ctx.moveTo(x, PAD * 0.6);
      ctx.lineTo(x, CANVAS_H - PAD);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    let y = PAD;

    // ---- 抬头 ----
    ctx.fillStyle = '#9a7d54';
    ctx.font = '20px serif';
    ctx.fillText('寻迹 · 古今', PAD, y + 14);
    y += 26;

    ctx.fillStyle = '#4a3220';
    ctx.font = 'bold 40px serif';
    ctx.fillText('我 的 诗 笺', PAD, y + 36);
    y += 52;

    // 昵称 + 朱色小下划线
    const nick = card.nickname || DEFAULT_NICK;
    ctx.fillStyle = '#7a4a1c';
    ctx.font = '24px serif';
    ctx.fillText(nick, PAD, y + 22);
    ctx.fillStyle = 'rgba(158, 42, 43, 0.55)';
    ctx.fillRect(PAD, y + 30, Math.max(44, ctx.measureText(nick).width), 2);
    y += 48;

    y = this.rule(ctx, PAD, y, CW);

    // ---- 时期 ----
    ctx.fillStyle = '#4a3220';
    ctx.font = 'bold 32px serif';
    ctx.fillText('第' + card.indexChar + '程 · ' + card.periodName, PAD, y + 30);
    y += 44;
    ctx.fillStyle = '#9a7d54';
    ctx.font = '20px serif';
    ctx.fillText([card.lineName, card.range, card.dateText].filter(Boolean).join(' · '), PAD, y + 18);
    y += 36;

    // ---- 正文：左侧文字 + 右侧竖排诗句 ----
    const bodyTop = y;
    const chars = card.poemChars || [];
    const cols = Math.min(2, Math.ceil(chars.length / POEM_PER_COL));
    const poemW = chars.length ? cols * POEM_COL_GAP + 14 : 0;
    const leftW = Math.max(220, CW - poemW);

    let ly = bodyTop;
    if (card.hasChoices) {
      ly = this.section(ctx, PAD, ly, leftW, '我在此间的抉择', card.choices.map(c => ({
        text: c.label + c.text,
        color: c.right ? '#7a4a1c' : '#4a3a28'
      })));
    }
    if (card.anchorNames.length) {
      ly = this.section(ctx, PAD, ly, leftW,
        '点亮的锚点 · ' + card.anchorLit + '/' + (card.anchorTotal || card.anchorLit),
        [{ text: card.anchorText, color: '#4a3a28' }]);
    }
    const stats = [];
    if (card.hasTrap) stats.push({ text: '考据之眼 · 抓出 ' + card.trapCaught + '/' + card.trapTotal + ' 处史实错漏', color: '#6b8e5a' });
    if (card.hasQuiz) stats.push({ text: '先生考校 · 答对 ' + card.quizCorrect + '/' + card.quizTotal + ' 题', color: '#6b8e5a' });
    if (stats.length) ly = this.section(ctx, PAD, ly, leftW, '探究战绩', stats);

    // 竖排诗句（自右向左）
    let py = bodyTop;
    if (chars.length) {
      ctx.font = '30px serif';
      ctx.fillStyle = '#7a4a1c';
      ctx.textAlign = 'center';
      for (let c = 0; c < cols; c++) {
        const cx = W - PAD - 16 - c * POEM_COL_GAP;
        for (let i = 0; i < POEM_PER_COL; i++) {
          const idx = c * POEM_PER_COL + i;
          if (idx >= chars.length) break;
          ctx.fillText(chars[idx], cx, bodyTop + 20 + i * 36);
        }
      }
      ctx.textAlign = 'left';
      py = bodyTop + 20 + Math.min(chars.length, POEM_PER_COL) * 36;
    }
    y = Math.max(ly, py) + 10;

    // ---- 评语 ----
    if (card.hasVerdict) {
      y = this.rule(ctx, PAD, y, CW);
      ctx.fillStyle = '#8b5a2b';
      ctx.font = '24px serif';
      ctx.fillText(card.verdict, PAD, y + 24);
      y += 42;
    }

    // ---- 页脚 ----
    y = this.rule(ctx, PAD, y + 4, CW);
    ctx.fillStyle = '#a08c6b';
    ctx.font = '20px serif';
    ctx.fillText('循一卷诗书，赴一场千年之约', PAD, y + 22);
    ctx.textAlign = 'right';
    ctx.fillText('寻迹 · 古今', W - PAD, y + 22);
    ctx.textAlign = 'left';
    y += 44;

    const endY = y + PAD * 0.6;

    // 清掉裁剪范围以外的格线，做出纸边
    ctx.fillStyle = '#f6efe0';
    ctx.fillRect(0, endY - PAD * 0.5, W, CANVAS_H - endY + PAD);

    // ---- 朱印「笺」 ----
    const ss = 52;
    const sx = W - PAD - ss;
    const sy = PAD - 8;
    ctx.fillStyle = 'rgba(158, 42, 43, 0.92)';
    ctx.fillRect(sx, sy, ss, ss);
    ctx.fillStyle = '#f5e9d5';
    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.fillText('笺', sx + ss / 2, sy + ss / 2 + 11);
    ctx.textAlign = 'left';

    // ---- 外框双线 ----
    ctx.strokeStyle = '#cbb894';
    ctx.lineWidth = 2;
    ctx.strokeRect(PAD * 0.5, PAD * 0.5, W - PAD, endY - PAD);
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.32)';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD * 0.5 + 8, PAD * 0.5 + 8, W - PAD - 16, endY - PAD - 16);

    return endY;
  },

  // 一条细分隔线
  rule(ctx, x, y, w) {
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + w, y + 12);
    ctx.stroke();
    return y + 30;
  },

  // 一个小节：标题 + 若干条自动折行的正文
  section(ctx, x, y, w, label, items) {
    ctx.fillStyle = '#8b5a2b';
    ctx.font = '22px serif';
    ctx.fillText(label, x, y + 18);
    let yy = y + 38;
    ctx.font = '24px serif';
    items.forEach((it) => {
      const lines = wrapText(ctx, it.text, w);
      lines.forEach((ln) => {
        ctx.fillStyle = it.color || '#4a3a28';
        ctx.fillText(ln, x, yy + 18);
        yy += 34;
      });
    });
    return yy + 12;
  },

  // ---- 保存到相册（含权限判断） ----
  saveToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        wx.showToast({ title: '诗笺已存入相册', icon: 'success' });
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || '';
        console.warn('[poem] 保存相册失败', err);
        if (msg.indexOf('auth') >= 0 || msg.indexOf('authorize') >= 0 || msg.indexOf('deny') >= 0) {
          wx.showModal({
            title: '需要相册权限',
            content: '诗笺图片已生成，但保存相册需要你的授权。可在设置里打开「保存到相册」后重试。',
            confirmText: '去设置',
            cancelText: '稍后',
            confirmColor: '#8b5a2b',
            success: (r) => { if (r.confirm) wx.openSetting(); }
          });
        } else if (msg.indexOf('cancel') >= 0) {
          // 用户主动取消，不打扰
        } else {
          wx.showToast({ title: '保存失败，可长按截图保存', icon: 'none' });
        }
      }
    });
  },

  // 导出失败时的降级：复制文案，保证玩家一定有"带走的东西"
  degradeToCopy(card, reason) {
    const text = this.buildPlainText(card);
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showModal({
          title: reason,
          content: '已把这张诗笺的文字版复制到剪贴板，可直接粘贴分享；也可以长按诗笺截图保存。',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#8b5a2b'
        });
      },
      fail: () => {
        wx.showToast({ title: '可长按诗笺截图保存', icon: 'none' });
      }
    });
  },

  // ---- 空态：还没通关任何时期 ----
  goStory() {
    wx.switchTab({ url: '/pages/story/story' });
  },

  goMap() {
    wx.switchTab({ url: '/pages/map/map' });
  }
});
