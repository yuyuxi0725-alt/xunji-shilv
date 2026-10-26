# 杜甫地点剧本 TTS 生成

当前正式剧情使用 22 个地点、407 个 NPC `talk` 节点，不再使用旧的 `p1`–`p4`
时期音频路径。逐句表演指令位于 `manifests/dufu-locations-emotion-plan.json`，由
当前剧本清单自动生成，内容包含人物年龄与处境、主情绪、语速、气息、语义停顿、
诗句节奏、转折重音和收尾方式。

当前杜甫各阶段音色的 `speech_rate` 基准统一为 25；逐句提示词允许按语义自然浮动，
情绪需要提速时最高不超过 40，避免拖沓。

### 年龄音色边界

- 幼年：`luoyang`、`shuhu`。暂不绑定音色，必须等幼年音色确认后再生成。
- 青年：`wuyue`、`luoyang_shi`、`taishan`、`shouang`、`qizhao`，统一使用
  `dufu-youth`。
- 中年与老年继续使用各自阶段音色，不能拿青年音色跨阶段生成。

只生成青年杜甫：

```powershell
python tts-audio/gen-volcengine-period.py `
  --manifest tts-audio/manifests/dufu-locations.json `
  --profile tts-audio/voice-profiles.json `
  --locations=wuyue,luoyang_shi,taishan,shouang,qizhao
```

## 1. 剧本改动后重建清单与提示词

```powershell
node tools/export-voice-manifest.js --line=dufu --preserve-runtime
node tools/build-dufu-location-emotion-plan.js
```

第一步从当前运行剧本导出 NPC 台词；第二步重建逐句 TTS 指令。正式录音并上传后，
再去掉 `--preserve-runtime` 重跑清单导出，更新运行时文本摘要。

## 2. 生成前检查

```powershell
python tts-audio/gen-volcengine-period.py `
  --manifest tts-audio/manifests/dufu-locations.json `
  --profile tts-audio/voice-profiles.json `
  --dry-run `
  --limit 5
```

生成脚本会自动加载同目录、同名的 `dufu-locations-emotion-plan.json`。如需明确指定：

```powershell
python tts-audio/gen-volcengine-period.py `
  --manifest tts-audio/manifests/dufu-locations.json `
  --profile tts-audio/voice-profiles.json `
  --emotion-plan tts-audio/manifests/dufu-locations-emotion-plan.json `
  --dry-run
```

## 3. 批量生成

```powershell
$env:VOLCENGINE_API_KEY = "你的 API Key"
python tts-audio/gen-volcengine-period.py `
  --manifest tts-audio/manifests/dufu-locations.json `
  --profile tts-audio/voice-profiles.json
```

输出路径为 `tts-audio/output/dufu/<地点 id>/<节点 id>.mp3`。脚本默认跳过已有的
有效文件；确认要重做时才加 `--overwrite`。

## 4. 本轮必须跳过的节点

- 12 个节点只有动作，没有可朗读对白。
- 齐赵 7 句是李白台词，需使用李白音色，不能混入青年杜甫批次。
- 潭州 `n5`、`n6a`、`n6b`、`n6c` 是李龟年台词，需另配音色。
- 舞剑地点 `shuhu/n2b`、`shuhu/n2c` 原节点混入玩家动作与叙述，计划文件已用 `ttsText` 提取出
  真正对白，生成脚本会优先朗读 `ttsText`。

不要把舞台说明、玩家动作或李龟年台词用杜甫音色合成。
