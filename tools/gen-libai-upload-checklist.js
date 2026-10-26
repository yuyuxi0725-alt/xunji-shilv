const fs = require('fs');
const m = require('../tts-audio/manifests/libai-locations.json');
const OUT = 'tts-audio/output/libai';

const byLoc = {};
m.items.forEach(it => { byLoc[it.audioQuestId] = (byLoc[it.audioQuestId] || 0) + 1; });

const lines = [];
lines.push('# 李白配音上传清单');
lines.push('');
lines.push(`共 ${m.count} 条，本地目录 \`tts-audio/output/libai/\`，云存储目标 \`audio/voice/libai/\``);
lines.push('');
lines.push('| 地点 | 条数 | 本地文件 | 云端路径 |');
lines.push('| --- | --- | --- | --- |');
let total = 0;
Object.keys(byLoc).forEach(loc => {
  lines.push(`| ${loc} | ${byLoc[loc]} | \`tts-audio/output/libai/${loc}/\` | \`audio/voice/libai/${loc}/\` |`);
  total += byLoc[loc];
});
lines.push('');
lines.push(`**合计 ${total} 条**`);
lines.push('');
lines.push('## 上传方式');
lines.push('');
lines.push('```');
lines.push('# 微信开发者工具 → 云开发 → 存储 → 按地点目录逐级上传');
lines.push('# 或用 CLI：');
lines.push('# tcb storage upload ' + OUT + '/ audio/voice/libai/ --recursive');
lines.push('```');
lines.push('');
lines.push('## 校验要点');
lines.push('');
lines.push('- 云端路径必须与清单一致：`audio/voice/libai/<地点>/<节点>.mp3`');
lines.push('- 上传后前端 `utils/ttsAudio.js` 经 `ttsUrl` 云函数换临时链接播放');
lines.push('- `utils/voice-manifest.js` 已登记 214 条文本摘要，台词改过会自动跳过旧音频（宁可不播也不播错词）');
lines.push('');
lines.push('## 音色批次备注');
lines.push('');
lines.push('| 阶段 | 音色 | 语速 | 说明 |');
lines.push('| --- | --- | --- | --- |');
lines.push('| 幼年 p0 | S_z5d7fg0j2 | 0 | 童年青莲乡 |');
lines.push('| 青年 p1 | S_Llk8fg0j2 | 0 | **仅 emei/n2c 用新音色**，其余 35 条为旧音色 S_pkBm7mXi2 |');
lines.push('| 壮年 p2+p3 | S_HfM7fg0j2 | 20 | |');
lines.push('| 中年 p4 | S_pYX7fg0j2 | 20 | |');
lines.push('| 晚年 p5 | S_Fcv7fg0j2 | 30 | |');
lines.push('');

fs.writeFileSync('tts-audio/manifests/libai-upload-checklist.md', lines.join('\n'), 'utf8');
console.log('已写 tts-audio/manifests/libai-upload-checklist.md，合计 ' + total + ' 条');
