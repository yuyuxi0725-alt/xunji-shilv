/* tools/check-player-avatars.js —— 玩家三张立绘的静态核验（不上传、不联网）
 *
 * 步骤八要求：三张现有 PNG 能在创建页与聊天页稳定解析，失败时安全降级。
 * 本脚本只做「本地能做的静态检查」，输出可审查结论：
 *   1. 白名单 avatar01/02/03 的 portraitKey 都能对应到一张实际 PNG；
 *   2. 解析 PNG 头，报告宽高、色深、颜色类型（是否带 alpha 透明通道）、文件大小；
 *   3. 检查宽高比与聊天页立绘框（520×860rpx）是否大致契合，给裁切/留白提示；
 *   4. 检查页面文案不出现旧职业文件名或职业标签（tang-*、书生、引路人、旅人）；
 *   5. 检查运行时路径拼接与 cloudAssets 前缀一致（/assets/images/npc/<key>.png）。
 *
 * 云端真实可访问性只能在已配置的微信环境确认，脚本只列出需要线上核验的清单。
 *
 * 运行：node tools/check-player-avatars.js
 * 退出码：0 通过 / 1 发现问题（便于接入发布前检查）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const avatars = require(path.join(ROOT, 'miniprogram/utils/player-avatars.js'));

const CLOUD_ASSET_DIR = path.join(ROOT, '_cloud_upload', 'assets', 'images', 'npc');
const PAGES_DIR = path.join(ROOT, 'miniprogram', 'pages');

const problems = [];
const notes = [];

/** 解析 PNG IHDR：宽、高、位深、颜色类型、是否有 alpha */
function readPngInfo(file) {
  const buf = fs.readFileSync(file);
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== SIG[i]) return { error: '不是合法 PNG（签名不符）' };
  }
  // 第一个 chunk 必须是 IHDR：长度(4) 类型(4) 数据
  const type = buf.toString('ascii', 12, 16);
  if (type !== 'IHDR') return { error: '首个 chunk 不是 IHDR' };
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];
  // colorType: 0 灰度 / 2 真彩 RGB / 3 索引 / 4 灰度+alpha / 6 真彩+alpha
  const hasAlpha = colorType === 4 || colorType === 6;
  return { width, height, bitDepth, colorType, hasAlpha, interlace, bytes: buf.length };
}

console.log('=== 玩家立绘静态核验 ===');
console.log(`素材目录：${path.relative(ROOT, CLOUD_ASSET_DIR)}`);
console.log('');

const rows = [];
avatars.AVATARS.forEach((a) => {
  const rel = `assets/images/npc/${a.portraitKey}.png`;
  const abs = path.join(CLOUD_ASSET_DIR, `${a.portraitKey}.png`);
  const runtimePath = '/assets/' + 'images/npc/' + a.portraitKey + '.png';

  if (!fs.existsSync(abs)) {
    problems.push(`${a.id} 缺少素材：${rel}`);
    rows.push({ id: a.id, key: a.portraitKey, size: '—', alpha: '—', path: runtimePath, ok: '缺图' });
    return;
  }
  const info = readPngInfo(abs);
  if (info.error) {
    problems.push(`${a.id} 素材损坏：${rel}（${info.error}）`);
    rows.push({ id: a.id, key: a.portraitKey, size: '—', alpha: '—', path: runtimePath, ok: info.error });
    return;
  }
  const ratio = info.height / info.width;
  // 聊天页立绘框 520×860rpx（aspectFit）≈ 1.654；人物立绘常见 1.4–2.2
  if (ratio < 1.2 || ratio > 2.4) {
    notes.push(`${a.id} 宽高比 ${ratio.toFixed(2)}（${info.width}×${info.height}）偏离立绘框 1.65 较多，aspectFit 会留白偏多`);
  }
  if (!info.hasAlpha) {
    problems.push(`${a.id} 无透明通道（colorType=${info.colorType}），叠在场景上会出现白/黑底方块`);
  }
  rows.push({
    id: a.id,
    key: a.portraitKey,
    size: `${info.width}×${info.height}`,
    alpha: info.hasAlpha ? '是' : '否',
    path: runtimePath,
    ok: 'OK'
  });
});

// —— 输出素材表 ——
const head = 'avatarId  | portraitKey              | 尺寸        | 透明 | 运行时路径';
const sep = '----------|--------------------------|-------------|------|--------------------------------';
console.log(head);
console.log(sep);
rows.forEach((r) => {
  console.log(
    `${r.id.padEnd(9)} | ${String(r.key).padEnd(24)} | ${String(r.size).padEnd(11)} | ${String(r.alpha).padEnd(4)} | ${r.path}`
  );
});
console.log('');

// —— 路径拼接一致性：唯一实现在 utils/player-portrait.js，页面必须委托它 ——
function checkPortraitResolver() {
  // 1) 唯一实现模块必须按 /assets/images/npc/<key>.png 拼接
  const shared = path.join(ROOT, 'miniprogram', 'utils', 'player-portrait.js');
  if (!fs.existsSync(shared)) {
    problems.push('缺少 utils/player-portrait.js（立绘路径唯一实现）');
    return;
  }
  const sharedSrc = fs.readFileSync(shared, 'utf8');
  if (!/['"]\/assets\/['"]\s*\+\s*['"]images\/npc\/['"]/.test(sharedSrc)) {
    problems.push('utils/player-portrait.js 未按 /assets/images/npc/<key>.png 拼接路径');
  }
  // 2) 运行时校验：三个白名单外观都能解析出可用的云路径
  const portrait = require(shared);
  avatars.AVATARS.forEach((a) => {
    const p = portrait.portraitPath(a.id);
    if (p !== `/assets/images/npc/${a.portraitKey}.png`) {
      problems.push(`portraitPath('${a.id}') 返回 ${p}，与素材键不一致`);
    }
  });
  // 3) 非法 avatarId 必须回退空串（页面据此渲染剪影，不裂图）
  ['', 'bogusAvatar', null, undefined].forEach((bad) => {
    if (portrait.portraitPath(bad) !== '') problems.push(`portraitPath(${JSON.stringify(bad)}) 未回退空串`);
  });

  // 4) 两个页面都必须委托同一实现，不得各写一份拼接
  const targets = [
    { name: 'pages/player/player.js', file: path.join(PAGES_DIR, 'player', 'player.js') },
    { name: 'pages/chat/chat.js', file: path.join(PAGES_DIR, 'chat', 'chat.js') }
  ];
  targets.forEach((t) => {
    if (!fs.existsSync(t.file)) { problems.push(`找不到 ${t.name}`); return; }
    const src = fs.readFileSync(t.file, 'utf8');
    if (src.indexOf("require('../../utils/player-portrait')") < 0) {
      problems.push(`${t.name} 未使用统一立绘路径模块（player-portrait）`);
    }
    // 页面里不应再有第二份字符串拼接
    if (/['"]\/assets\/['"]\s*\+\s*['"]images\/npc\//.test(src)) {
      problems.push(`${t.name} 仍自带一份立绘路径拼接，应改为调用 player-portrait`);
    }
  });
}
checkPortraitResolver();

// —— 页面文案不得出现旧职业文件名或职业标签 ——
function checkNoLegacyCopy() {
  const files = [];
  ['player', 'chat', 'profile', 'map'].forEach((p) => {
    ['wxml', 'js'].forEach((ext) => {
      const f = path.join(PAGES_DIR, p, `${p}.${ext}`);
      if (fs.existsSync(f)) files.push(f);
    });
  });
  const badWords = ['tang-young-scholar', 'tang-mountain-guide', 'tang-passing-traveler', '书生', '引路人', '旅人'];
  files.forEach((f) => {
    const src = fs.readFileSync(f, 'utf8');
    badWords.forEach((w) => {
      // 允许出现在注释里说明「不显示旧职业名」；只报非注释行
      const lines = src.split(/\r?\n/);
      const hits = lines.filter(line => line.indexOf(w) >= 0
        && !/^\s*(\/\/|\*|\/\*|<!--)/.test(line)
        && line.indexOf('不显示') < 0);
      if (hits.length) {
        problems.push(`${path.relative(ROOT, f)} 页面文案出现旧职业标识「${w}」：${hits[0].trim().slice(0, 60)}`);
      }
    });
  });
}
checkNoLegacyCopy();

// —— 缺图降级：聊天页必须有 CSS 剪影回退 ——
function checkSilhouetteFallback() {
  const wxml = path.join(PAGES_DIR, 'chat', 'chat.wxml');
  const wxss = path.join(PAGES_DIR, 'chat', 'chat.wxss');
  if (fs.existsSync(wxml)) {
    const src = fs.readFileSync(wxml, 'utf8');
    if (src.indexOf('vn-player-silhouette') < 0) problems.push('chat.wxml 缺少玩家立绘缺图时的剪影占位');
  }
  if (fs.existsSync(wxss)) {
    const src = fs.readFileSync(wxss, 'utf8');
    if (src.indexOf('.vn-player-silhouette') < 0) problems.push('chat.wxss 缺少 .vn-player-silhouette 样式（缺图会露出空白/破图）');
  }
  const playerWxml = path.join(PAGES_DIR, 'player', 'player.wxml');
  if (fs.existsSync(playerWxml)) {
    const src = fs.readFileSync(playerWxml, 'utf8');
    if (src.indexOf('binderror') < 0) problems.push('player.wxml 外观卡未绑定 binderror（图片失败无法降级）');
  }
}
checkSilhouetteFallback();

// —— 汇总 ——
if (notes.length) {
  console.log('提示：');
  notes.forEach(n => console.log('  · ' + n));
  console.log('');
}

if (problems.length) {
  console.log(`FAILED  ${problems.length} 项问题：`);
  problems.forEach(p => console.log('  ✗ ' + p));
  process.exit(1);
}

console.log('ALL PASS  三张立绘齐备、带透明通道、路径一致、无旧职业文案、缺图有剪影降级');
console.log('');
console.log('仍需在微信环境确认（本脚本不联网、不上传）：');
console.log('  1. 三张 PNG 与 idle GIF 是否已上传到云存储 assets/images/npc/ 并在真机能取到临时链接；');
console.log('  2. 创建页外观卡与聊天页玩家立绘在真机小屏（iPhone SE 级）的显示与左右站位；');
console.log('  3. 弱网/断网时图片失败回退剪影、剧情不被阻塞。');
process.exit(0);
