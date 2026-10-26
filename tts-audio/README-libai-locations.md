# 李白地点配音 · 火山引擎豆包 TTS 合成操作说明

> 目标：把李白 20 个地点、**214 条** NPC 台词，用火山引擎豆包复刻音色合成为 mp3，
> 按 `audio/voice/libai/<地点>/<节点>.mp3` 落盘，最后上传微信云存储。

---

## 一、已完成的前置工作（本次已落地）

| 事项 | 状态 |
| --- | --- |
| 导出李白 214 条配音清单 | ✅ `tts-audio/manifests/libai-locations.json` |
| 李白 20 地点 → 5 时期音色映射 | ✅ `voice-profiles.json` 的 `_locationProfileMap.libai` |
| 李白逐句表演计划（情绪导演指令） | ✅ `tts-audio/manifests/libai-locations-emotion-plan.json` |
| 生成器脚本 | ✅ `tools/build-libai-location-emotion-plan.js` |
| 合成脚本（已有，通用） | ✅ `tts-audio/gen-volcengine-period.py` |

## 二、李白的音色分段（按地点时期）

李白沿用已有的 5 个复刻音色（`seed-icl-2.0`），按地点时期分段：

| 时期 | 音色 profile | voiceId | 覆盖地点 |
| --- | --- | --- | --- |
| p1 仗剑出蜀（少年） | `libai-p1` | S_ZsixCjLh2 | qinglian, emei, jingmen, yangzhou, anlu |
| p2 干谒求仕 | `libai-p2` | S_L9UvCjLh2 | changan1, zhongnan |
| p3 供奉翰林 | `libai-p3` | S_3tfwCjLh2 | hanlin |
| p4 纵酒漫游（壮年） | `libai-p4` | S_3tfwCjLh2 | luoyang_libai, songshan, tianmu, liangsong, xuanzhou, youyan |
| p5 乱世浮沉（晚年） | `libai-p5` | S_rNhvCjLh2 | lushan, yongwang, xunyang, liuyelang, baidi, dangtu |

> 若你对某个时期的音色不满意，可在控制台「音色库」复刻新音色后，替换
> `voice-profiles.json` 里对应 profile 的 `voiceId`。

## 三、合成步骤（Key 由你本人保管，脚本从环境变量读取）

### 第 1 步：设置 API Key（不落盘、不经过任何人）

在终端设置环境变量（Key 只存于你的 shell 会话，不会写入项目文件）：

```bash
# Git Bash / macOS / Linux
export VOLCENGINE_API_KEY="你的火山引擎APIKey"

# Windows PowerShell
$env:VOLCENGINE_API_KEY = "你的火山引擎APIKey"
```

> 注意：Key 必须为**纯英文、无引号、无空格、无全角符号**。脚本会自动校验，若含
> 非 ASCII 字符会立即报错并提示，避免把中文引号一起复制进去。

### 第 2 步：先试录 1 条，确认音色/语速满意

```bash
node tools/export-voice-manifest.js --line=libai          # 确保清单最新（通常已生成）
node tools/build-libai-location-emotion-plan.js           # 确保情绪计划最新

python tts-audio/gen-volcengine-period.py \
  --manifest tts-audio/manifests/libai-locations.json \
  --locations qinglian \
  --limit 1
```

听一下 `tts-audio/output/libai/qinglian/n2.mp3`。不满意可调
`voice-profiles.json` 里 `libai-p1` 的 `speech_rate`（-50~100，100 为 2 倍速），
再重跑。

### 第 3 步：全量合成 214 条

```bash
python tts-audio/gen-volcengine-period.py \
  --manifest tts-audio/manifests/libai-locations.json
```

- 脚本**支持断点续传**：已存在且 >2KB 的 mp3 会自动 `SKIP`，失败/中断后重跑即可续上。
- 想重录某地点：加 `--overwrite --locations songshan`。
- 想只重录某几句：加 `--nodes n5,n8 --overwrite`（或 `songshan/n5`）。
- 想先试听不落盘：加 `--dry-run`（会打印每句 ttsText 和情绪指令，不调 API）。

### 第 4 步：抽查质检

重点听这几个转折节点（已做逐句精调）：

- `songshan/n5` —— 《将进酒》「天生我材必有用」
- `tianmu/n8` —— 「安能摧眉折腰事权贵」
- `dangtu/n6` —— 《临终歌》「大鹏飞兮振八裔」

## 四、上传云存储

合成完成后，把 `tts-audio/output/libai/` 下的 20 个地点目录，整目录上传到微信
云存储路径 `audio/voice/libai/<地点>/`（与清单里的 `cloudPath` 一致）：

```
audio/voice/libai/qinglian/n2.mp3
audio/voice/libai/emei/n2.mp3
...
audio/voice/libai/dangtu/n6.mp3
```

上传后，前端 `utils/ttsAudio.js` 会经 `ttsUrl` 云函数换取临时链接播放；
`utils/voice-manifest.js` 已登记这 214 条的文本摘要，台词若改过会自动跳过旧音频
（宁可这一句没声音，也不播错词）。

## 五、改剧本后的回归

改了李白剧本台词后，必须按顺序重跑：

```bash
node tools/export-voice-manifest.js --line=libai       # 更新清单 + 摘要
node tools/build-libai-location-emotion-plan.js        # 更新情绪计划
# 然后重新合成被改动的节点（脚本会因摘要变化而标记为 needRedo）
```

---

## 附：命令行参数速查（gen-volcengine-period.py）

| 参数 | 作用 |
| --- | --- |
| `--manifest` | 必填，清单 json 路径 |
| `--locations a,b` | 只处理指定地点 |
| `--nodes n5,songshan/n8` | 只处理指定节点 |
| `--limit N` | 只处理前 N 条 |
| `--overwrite` | 覆盖已存在的 mp3 |
| `--dry-run` | 只打印不调用 API |
| `--speech-rate N` | 临时语速覆盖（-50~100） |
| `--poll N` | 轮询间隔秒（默认 2） |
| `--max-wait N` | 单任务最长等待秒（默认 300） |
| `--use-env-proxy` | 走系统代理（默认直连，避免代理导致的 SSLEOFError） |
