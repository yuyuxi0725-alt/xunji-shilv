# 李白配音上传清单

共 214 条，本地目录 `tts-audio/output/libai/`，云存储目标 `audio/voice/libai/`

| 地点 | 条数 | 本地文件 | 云端路径 |
| --- | --- | --- | --- |
| qinglian | 19 | `tts-audio/output/libai/qinglian/` | `audio/voice/libai/qinglian/` |
| emei | 9 | `tts-audio/output/libai/emei/` | `audio/voice/libai/emei/` |
| jingmen | 9 | `tts-audio/output/libai/jingmen/` | `audio/voice/libai/jingmen/` |
| yangzhou | 9 | `tts-audio/output/libai/yangzhou/` | `audio/voice/libai/yangzhou/` |
| anlu | 9 | `tts-audio/output/libai/anlu/` | `audio/voice/libai/anlu/` |
| changan1 | 13 | `tts-audio/output/libai/changan1/` | `audio/voice/libai/changan1/` |
| zhongnan | 9 | `tts-audio/output/libai/zhongnan/` | `audio/voice/libai/zhongnan/` |
| hanlin | 15 | `tts-audio/output/libai/hanlin/` | `audio/voice/libai/hanlin/` |
| luoyang_libai | 11 | `tts-audio/output/libai/luoyang_libai/` | `audio/voice/libai/luoyang_libai/` |
| songshan | 14 | `tts-audio/output/libai/songshan/` | `audio/voice/libai/songshan/` |
| tianmu | 10 | `tts-audio/output/libai/tianmu/` | `audio/voice/libai/tianmu/` |
| liangsong | 8 | `tts-audio/output/libai/liangsong/` | `audio/voice/libai/liangsong/` |
| xuanzhou | 9 | `tts-audio/output/libai/xuanzhou/` | `audio/voice/libai/xuanzhou/` |
| youyan | 8 | `tts-audio/output/libai/youyan/` | `audio/voice/libai/youyan/` |
| lushan | 8 | `tts-audio/output/libai/lushan/` | `audio/voice/libai/lushan/` |
| yongwang | 12 | `tts-audio/output/libai/yongwang/` | `audio/voice/libai/yongwang/` |
| xunyang | 11 | `tts-audio/output/libai/xunyang/` | `audio/voice/libai/xunyang/` |
| liuyelang | 8 | `tts-audio/output/libai/liuyelang/` | `audio/voice/libai/liuyelang/` |
| baidi | 9 | `tts-audio/output/libai/baidi/` | `audio/voice/libai/baidi/` |
| dangtu | 14 | `tts-audio/output/libai/dangtu/` | `audio/voice/libai/dangtu/` |

**合计 214 条**

## 上传方式

```
# 微信开发者工具 → 云开发 → 存储 → 按地点目录逐级上传
# 或用 CLI：
# tcb storage upload tts-audio/output/libai/ audio/voice/libai/ --recursive
```

## 校验要点

- 云端路径必须与清单一致：`audio/voice/libai/<地点>/<节点>.mp3`
- 上传后前端 `utils/ttsAudio.js` 经 `ttsUrl` 云函数换临时链接播放
- `utils/voice-manifest.js` 已登记 214 条文本摘要，台词改过会自动跳过旧音频（宁可不播也不播错词）

## 音色批次备注

| 阶段 | 音色 | 语速 | 说明 |
| --- | --- | --- | --- |
| 幼年 p0 | S_z5d7fg0j2 | 0 | 童年青莲乡 |
| 青年 p1 | S_Llk8fg0j2 | 0 | **仅 emei/n2c 用新音色**，其余 35 条为旧音色 S_pkBm7mXi2 |
| 壮年 p2+p3 | S_HfM7fg0j2 | 20 | |
| 中年 p4 | S_pYX7fg0j2 | 20 | |
| 晚年 p5 | S_Fcv7fg0j2 | 30 | |
