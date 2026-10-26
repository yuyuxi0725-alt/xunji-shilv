// utils/voice-digest.js —— 配音文本规范化与稳定摘要（纯函数，可单测）
//
// 导出工具（tools/export-voice-manifest.js）与运行时（utils/ttsAudio.js）必须用
// 完全相同的规范化和摘要算法，否则「文本是否改过」的判断会假阳性/假阴性。
// 因此单独抽出这一层，两端 require 同一实现。

/** 文本规范化：折叠所有空白为单个空格、去首尾空白（换行/制表符不影响摘要） */
function normalizeVoiceText(text) {
  return String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim();
}

/**
 * 稳定文本摘要：FNV-1a 32 位，返回 8 位 hex。
 * 只用于「同不同」判断，不用于安全用途；纯函数、跨环境结果一致。
 */
function textDigest(text) {
  const s = normalizeVoiceText(text);
  if (!s) return '';
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // FNV 质数 16777619，用位移避免 32 位乘法溢出的精度问题
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}

module.exports = { normalizeVoiceText, textDigest };
