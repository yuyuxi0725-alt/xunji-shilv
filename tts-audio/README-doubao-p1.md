# 青年杜甫：读书壮游（p1）批量配音

> 兼容期旧流程：当前正式杜甫线已经切换为 22 个地点叙事。新配音请使用
> `README-dufu-locations.md` 与 `dufu-locations-emotion-plan.json`，不要继续把本页的
> `p1` 音频上传到正式地点路径。

这套脚本只处理 `line-dufu.js` 的 `p1 / 读书壮游`，使用音色 `S_pMVX6XDh2`。它会把 19 个 `talk` 节点分别生成成 MP3，文件名与节点 ID 对应，例如 `n2.mp3`、`n3.mp3`。

## 导出并检查台词

在项目根目录执行：

```powershell
node tools/export-voice-manifest.js dufu p1
python tts-audio/gen-volcengine-period.py `
  --manifest tts-audio/manifests/dufu-p1.json `
  --profile tts-audio/voice-profiles.json `
  --dry-run
```

第二条命令只打印全部台词，不调用云端。需要整体调整语速或响度时，修改 `voice-profiles.json` 中的 `speech_rate`、`loudness_rate`，不用逐句修改。

## 批量生成

先在当前 PowerShell 会话设置火山引擎 API Key（不要写进仓库）：

```powershell
$env:VOLCENGINE_API_KEY = "你的API Key"
python tts-audio/gen-volcengine-period.py `
  --manifest tts-audio/manifests/dufu-p1.json `
  --profile tts-audio/voice-profiles.json
```

输出目录是 `tts-audio/output/dufu/p1/`。脚本默认跳过已经成功生成的文件，失败项可以直接重跑；需要全部重做时加 `--overwrite`。

## 上传云存储

安装并登录 CloudBase CLI 后上传整个目录：

```powershell
tcb login
tcb storage upload .\tts-audio\output\dufu\p1 audio/voice/dufu/p1 --times 3
```

上传后，云端路径可按 `audio/voice/dufu/p1/n2.mp3` 这类键保存到音频映射中。现有 `ttsUrl` 云函数可以把云文件 ID 换成临时播放 URL；接入播放时按节点 ID 查对应文件即可。

API Key、生成文件和云端凭证均未写入 Git。
