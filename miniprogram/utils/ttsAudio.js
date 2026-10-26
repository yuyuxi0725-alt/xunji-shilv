// utils/ttsAudio.js —— 故事节点 TTS 音频临时链接解析器
//
// 音频上传到：audio/voice/{storyId}/{audioQuestId}/{nodeId}.mp3
//   · 地点模式：audioQuestId = locationId（如 dufu/luoyang/n1.mp3）
//   · 时期模式：audioQuestId = questId（如 libai/p2/n3.mp3）
// 云存储权限受限时，复用 ttsUrl 云函数由管理端换取临时播放链接。
//
// 文本一致性（步骤八）：
//   语音清单在「录音当时」记录了每个节点文本的摘要（voice-manifest.js）。
//   播放前比对当前节点文本摘要与清单摘要：不一致说明台词改过而音频未重录，
//   此时跳过旧音频并打可定位日志，剧情照常文字推进——绝不播错词，也不弹阻塞错误。
//
// ⚠️ 这不是过渡期的临时妥协，而是**最终设计**：
//   文本与配音必须严格一致；宁可这一句没有声音，也不能让少年听到与屏幕上不同的台词。
//   旧版时期音频（audio/voice/<line>/p1..p4/）已废弃、将来整体删除，
//   任何"容忍旧音频继续播放"的降级都不应再加回来。

const CLOUD_ROOT = 'cloud://cloud1-d0g6bkxs13c9f980d.636c-cloud1-d0g6bkxs13c9f980d-1412525724';
const URL_TTL = 100 * 60 * 1000;
const urlCache = {};

// 规范化与摘要必须与导出工具一致，故共用 utils/voice-digest.js
const voiceDigest = require('./voice-digest');
const normalizeVoiceText = voiceDigest.normalizeVoiceText;
const textDigest = voiceDigest.textDigest;

let voiceManifest = null;
function getVoiceManifest() {
  if (voiceManifest === null) {
    try {
      // 生成的清单可能不存在（未跑导出工具），缺失时不做摘要校验，保持旧行为
      voiceManifest = require('./voice-manifest') || {};
    } catch (e) {
      voiceManifest = {};
    }
  }
  return voiceManifest;
}

/** 取清单里该节点期望的文本摘要；无清单/无该节点返回空串（表示不做校验） */
function expectedDigest(storyId, audioQuestId, nodeId) {
  const all = getVoiceManifest();
  const line = all[storyId];
  if (!line) return '';
  const loc = line[audioQuestId];
  if (!loc) return '';
  return loc[nodeId] || '';
}

function cacheKey(storyId, audioQuestId, nodeId, digest) {
  return `${storyId}/${audioQuestId}/${nodeId}#${digest || '-'}`;
}

/**
 * 解析某节点音频的临时播放链接。
 * @param {string} storyId 人物线 id（dufu/libai/sushi）
 * @param {string} audioQuestId 地点 id 或时期 id
 * @param {string} nodeId 节点 id
 * @param {string} [text] 节点文本；传入则与清单摘要比对，不一致时跳过旧音频
 * @returns {Promise<string>} 临时链接；无音频/文本不匹配/失败时为空串
 */
function resolveNodeAudio(storyId, audioQuestId, nodeId, text) {
  if (!storyId || !audioQuestId || !nodeId) return Promise.resolve('');

  const digest = (text === undefined) ? '' : textDigest(text);
  // 文本一致性：清单有该节点摘要且与当前文本不同 → 音频已过期，跳过。
  // 这是最终设计（见文件头说明）：音频一旦与文本不符即作废，不存在"先凑合播旧版"的路径。
  const want = expectedDigest(storyId, audioQuestId, nodeId);
  if (want && digest && want !== digest) {
    console.warn('[tts] 文本与语音清单不一致，已跳过旧音频（需重录）', storyId + '/' + audioQuestId + '/' + nodeId);
    return Promise.resolve('');
  }

  const key = cacheKey(storyId, audioQuestId, nodeId, digest);
  const now = Date.now();
  if (urlCache[key] && now - urlCache[key].at < URL_TTL) {
    return Promise.resolve(urlCache[key].url);
  }

  const fileID = `${CLOUD_ROOT}/audio/voice/${storyId}/${audioQuestId}/${nodeId}.mp3`;
  return new Promise((resolve) => {
    // 整段包 try/catch：调用云函数本身抛错（无 wx.cloud、参数异常等）也要静默降级，
    // 绝不能把异常抛到剧情流程里导致对话卡住。
    try {
      wx.cloud.callFunction({
        name: 'ttsUrl',
        data: { fileIDs: [fileID] },
        success: (res) => {
          const list = (res && res.result) || [];
          const file = list.find(item => item && item.fileID === fileID);
          if (file && file.tempFileURL) {
            urlCache[key] = { url: file.tempFileURL, at: Date.now() };
            resolve(file.tempFileURL);
            return;
          }
          // 没有上传该节点音频时静默跳过，文字剧情仍可正常进行。
          resolve('');
        },
        fail: () => resolve('')
      });
    } catch (e) {
      console.warn('[tts] 解析音频链接异常，已跳过配音', e && e.message);
      resolve('');
    }
  }).catch(() => '');
}

module.exports = {
  normalizeVoiceText,
  textDigest,
  expectedDigest,
  resolveNodeAudio
};
