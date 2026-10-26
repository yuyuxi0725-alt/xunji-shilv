# 苏轼地点线 TTS 使用说明

本目录（`tts-audio/`）里与**苏轼地点剧情**配音相关的只有三份文件，其余 `sushi-p1.json`～`sushi-p5.json` 属于旧时期模式，是兼容遗留（106 条），**不是本次配音源**。

| 文件 | 作用 | 能不能手改 |
|---|---|---|
| `manifests/sushi-locations.json` | 配音源清单，22 地点 / 228 个 NPC talk 节点，键为 `audioQuestId + nodeId` | 由 `tools/export-voice-manifest.js` 生成，不手改 |
| `manifests/sushi-locations-emotion-plan.json` | 逐句表演计划，228 条与源清单一一对应 | 由 `tools/build-sushi-location-emotion-plan.js` 生成，不手改 |
| `voice-profiles.json` | 音色配置。`_locationProfileMap.sushi` 把 22 个地点映射到 `sushi-p1`～`sushi-p5` | 手工维护 |

`miniprogram/utils/stories/line-sushi-locations.generated.js` 也不要手改：它是剧本生成物，改台词请回 `docs/整合_苏轼_剧本与分镜_完整版.md` 再重跑构建。

---

## 一、怎么跑

```bash
# 1. 改了台词清单之后，先重新生成表演计划（含 12 项校验，不过就退出 1）
node tools/build-sushi-location-emotion-plan.js

# 2. 试听/dry-run：只打印文本与提示词，不调用接口、不产生 MP3
python tts-audio/gen-volcengine-period.py \
  --manifest tts-audio/manifests/sushi-locations.json --dry-run --locations meishan

# 3. 全量 dry-run
python tts-audio/gen-volcengine-period.py \
  --manifest tts-audio/manifests/sushi-locations.json --dry-run

# 4. 真正合成（要付费，需自备 Key；此处仅供说明，不要随手执行）
#    export VOLCENGINE_API_KEY=...  或 Windows 下 set VOLCENGINE_API_KEY=...
python tts-audio/gen-volcengine-period.py \
  --manifest tts-audio/manifests/sushi-locations.json --locations meishan
```

`gen-volcengine-period.py` 会自动发现同名的 `-emotion-plan.json`（打印 `EMOTION PLAN:` 那一行即表示已加载）。加 `--no-emotion-plan` 可以关掉。

生成产物落在 `tts-audio/output/sushi/<location>/<node>.mp3`，上传到云存储的路径是 `audio/voice/sushi/<location>/<node>.mp3`（manifest 里 `cloudPath` 字段已写好）。

---

## 二、数据口径

- 总节点：**228**
- 可配音：**226**
- 跳过：**2**

跳过的是欧阳修本人在说话，**绝不能用苏轼音色生成**：

| 节点 | 原因 |
|---|---|
| `bianjing/n4` | 欧阳修台词，不能使用苏轼音色 |
| `bianjing/n4a` | 欧阳修台词，不能使用苏轼音色 |

判定依据不是 `npc: true`（那只代表这是 NPC 节点），而是逐条读台词确认说话人。228 条里子由、朝云、姜唐佐、庞安常、维琳、钱世雄都只出现在**苏轼口中的称呼**或**括号内的舞台动作**里，不构成他人对白。

### 本轮针对源稿口径做过的两处修正（2026-10-23）

台词与提示词的口径必须一致，源稿（`docs/整合_苏轼_剧本与分镜_完整版.md`）改了，清单与提示词都跟着改了：

| 节点 | 原文 | 改为 | 依据 |
|---|---|---|---|
| `jinshan/n3b` | 你把这**六个**地名连起来念：黄州、惠州、儋州 | 你把这**几个**地名连起来念 | 实际只有三个地名，数目与列举自相矛盾 |
| `mizhou/n3b`、`mizhou/n3c` | 我今年才**三十九** / 其实我**三十九**，是心里老了 | **四十** | 出猎作于熙宁八年，同地点知识点卡 s5 写明「时虚岁四十」「他此时才四十岁」；三十九是熙宁七年到任时的年龄 |

连带口径：密州 13 条提示词的场景描述统一写「四十岁的苏轼」（分镜把熙宁八年出猎与熙宁九年中秋压成一次到访，不能一句四十、一句四十一）。**到任那句旁白仍是「虚岁三十九」**——那是熙宁七年十二月，本来就对，不动。

同批还改了导出脚本一处隐患：`node tools/export-voice-manifest.js --help` 以前会被当成一次默认导出真实执行，把 `utils/voice-manifest.js` 里「录音当时」的旧指纹刷成当前文本，等于把「哪些句子改了还没重录」的证据抹掉。现在 `--help` 只打印用法、不写文件（有测试 9.1/9.2 守着），只改剧本时请加 `--preserve-runtime`。

---

## 三、22 个地点 → 音色映射

严格对齐 `miniprogram/utils/stories/sushi-locations.js` 的 `PERIOD_LOCATIONS`，与 `_locationProfileMap.sushi` 同源；脚本会校验两者一致，映射错阶段会直接报错。

| 音色 profile | 时期 | 地点 | 年龄与声音底色 |
|---|---|---|---|
| `sushi-p1` | p1 少年成名 | meishan / bianjing / fengxiang | 十岁清亮未变声 → 二十一岁清朗爽直 → 二十六岁沉了一档 |
| `sushi-p2` | p2 密州湖州 | hangzhou / mizhou / xuzhou / huzhou | 三十六岁辩才锋利 → 三十九岁爽朗 → 四十二岁沙哑 → 四十四岁声线收紧 |
| `sushi-p3` | p3 乌台诗案 | wutai | 四十四岁，疲惫低沉，气声多，恐惧被按住 |
| `sushi-p4` | p4 东坡赤壁 | dinghui / dongpo / chibi / shahu / chengtian | 四十五岁发虚偏暗 → 四十六岁粗砺带土气 → 四十七岁开阔中低音 |
| `sushi-p5` | p5 岭南北归 | dengzhou / suti / yingzhou / yangzhou / dingzhou / huizhou / danzhou / jinshan / changzhou | 五十岁干练 → 五十七岁果决 → 六十岁沙哑 → 六十三岁苍老幽默 → 六十五岁虚弱清醒 |

全局 `speech_rate` / `loudness_rate` 仍由 `voice-profiles.json` 控制，**不为某一句单独改基础语速**；句内的快慢全部写进 `emotionPrompt`。

---

## 四、提示词是怎么来的

226 条 `emotionPrompt` 没有套模板，全部逐句手写在 `tools/sushi-prompts/` 下：

| 文件 | 覆盖 |
|---|---|
| `p1.js` | 眉山 14 / 汴京 7 / 凤翔 13 |
| `p2.js` | 杭州 10 / 密州 13 / 徐州 6 / 湖州 5 |
| `p3.js` | 御史台狱 9 |
| `p4.js` | 定惠院 12 / 东坡 9 / 赤壁 13 / 沙湖 9 / 承天寺 11 |
| `p5a.js` | 登州 12 / 杭州苏堤 7 / 颍州 12 / 扬州 12 |
| `p5b.js` | 定州 10 / 惠州 9 / 儋州 13 / 金山 8 / 常州 12 |

每条按七段写：**人物年龄与场景 → 主情绪与强度 → 音色音高气息咬字 → 情绪转折点 → 前后速度变化 → 少量重音与收尾 → 禁止项**。转折点和重音词一律引用该句台词里的原话，所以相邻分支即使 `emotion` 相同，提示词也不会重复。

为什么不用「情绪枚举 + 通用模板」：苏轼在各阶段的声音差别极大（十岁的清亮、乌台的虚弱、儋州的苍老幽默、常州的临终清醒），模板会把「由苦到开」的变化抹平。第一版试过自动编排，生成的提示词出现「不要不要平得没有起伏」「重音只给『将着喝』两处」这类毛病，因此改为逐句手写。

`intensity` 不是另算的，而是从提示词自己写明的浓度（「给到中等偏轻」「接近满」等）反推，所以字段和提示词永远说同一件事；取值 0.35–0.73，共 27 种，克制场景落在 0.35–0.55，强烈但不失控落在 0.60–0.73。

---

## 五、朗读文本清洗

`ttsText` 由脚本统一清洗，规则：

1. 删中文圆括号 `（）` 与英文圆括号 `()` 内的舞台动作（动作仍用于推断提示词，但不朗读）；
2. 删 `**` 等 Markdown 标记；
3. 删 ASCII 双引号（`"…"`），保留中文引号内的引文；
4. 收多余空白；`。` 紧跟 `——` 时合并，避免多一次长停；
5. **不改写剧情台词**。

清洗后会去掉括号的节点里，有两处必须人工指定朗读文本（`VOICE_TEXT_OVERRIDES`），因为括号里塞了别人的话，自动清洗会留下残缺标点：

| 节点 | 朗读文本 | 说明 |
|---|---|---|
| `changzhou/n3a` | `西方不无，但个里着力不得。西方不是没有，可这事使不上劲。` | 只读苏轼的答话与解释，不读维琳方丈的劝说 |
| `changzhou/n3b` | `著力即差。一使劲，就错了。` | 只读苏轼的答话与解释，不读钱世雄的劝说 |

原清单里含 `**` 的节点共 10 个：`suti/n2c`、`suti/n3`、`yangzhou/n2`、`yangzhou/n2b`、`danzhou/n2c`、`danzhou/n4c`、`danzhou/n4d`、`changzhou/n3a`、`changzhou/n3b`、`changzhou/n4a`。校验会保证生成的 `ttsText` 里不残留任何 Markdown 符号。

---

## 六、生成脚本会校验什么

`node tools/build-sushi-location-emotion-plan.js` 任何一项不过就退出 1，**不会写出半成品**：

1. `source.items.length === plan.length === count`；
2. `audioQuestId + nodeId` 唯一；
3. 与源清单节点集合、顺序完全一致（不重不漏）；
4. 可配音项都有 `ttsText`、`emotionPrompt`（90–420 字）、合法 `emotion`、`intensity ∈ [0.32, 0.78]`；
5. `skipTts` 项都有 `skipReason` 且 `emotionPrompt` 为空；
6. `ttsText` 不含 `（）()`；
7. `ttsText` 不含 `**`、`#`、`` ` ``、`*`、`_`；
8. 22 个地点全覆盖，每地点条数与源清单一致；
9. `_locationProfileMap.sushi` 覆盖 22 地点、指向存在的 profile、且阶段与 `PERIOD_LOCATIONS` 一致；并模拟 `gen-volcengine-period.py` 的 `profile_for_item` 确认能取到 `voiceId`；
10. 提示词表不含多余键、不含跳过节点、可配音节点一个不漏，且 226 条提示词互不相同；
11. 提示词里引号内的片段若以「他/她」开头且不在 `ttsText` 中，判为「引用了已清洗的舞台动作」，直接报错；
12. `LOCATION_STYLE` / `VOICE_TEXT_OVERRIDES` 的键都必须真实存在。

---

## 七、建议真人试听后继续微调的高风险节点

这些句子最容易「演过」或「演错方向」，第一次合成建议逐条听：

- **乌台诗案**：`wutai/n2b`、`wutai/n4a`、`wutai/n5`、`wutai/n5a` —— 恐惧与骨气并存，容易滑成一味哭腔或一味悲壮。
- **东坡重生**：`dongpo/n3`、`dongpo/n4`、`dongpo/n4b` —— 命名「东坡」的分寸，容易演成励志宣言。
- **赤壁**：`chibi/n2`、`chibi/n2f`、`chibi/n3g` —— 豪情与苍凉并存，容易只剩高亢。
- **岭南旷达**：`danzhou/n3a`、`danzhou/n4e` —— 苍老幽默，容易配成装可爱。
- **临终**：`changzhou/n3a`、`changzhou/n3b`、`changzhou/n4a`、`changzhou/n4b` —— 虚弱但清醒，容易演成夸张遗言腔或气若游丝。
- **被逮前后**：`huzhou/n3b`、`huzhou/n3d` —— 强撑镇定，容易颤过头。

另外两类通用风险：

- **多音字与古音**：`著力即差`（zhù）、`范滂`（pāng）、`皋陶`（gāo yáo）、`儋州`（dān）、`猗顿`（yī）。若试听发现读错，在 `voice-profiles.json` 对应 profile 里加 `additions.pronunciation_dict.tone`，不要改台词。
- **诗词句**：`mizhou/n5a`、`chibi/n2`、`shahu/n3d`、`jinshan/n3` —— 提示词已明确「按意群自然吟出、不做朗诵腔」，若模型仍念成舞台朗诵，优先在提示词里加重禁止项，而不是调语速。

---

## 八、不要做的事

- 不要改旧版 `sushi-p1.json`～`sushi-p5.json` 及其 emotion plan（106 条，兼容遗留）。
- 不要手改 `sushi-locations-emotion-plan.json`，改完下次生成会被覆盖；要改提示词请改 `tools/sushi-prompts/*.js`。
- 不要手改 `line-sushi-locations.generated.js`。
- 不要为了某一句改 `voice-profiles.json` 的全局 `speech_rate`。
- dry-run 只用 `--dry-run`：不调用付费 TTS、不生成 MP3、不上传云端。
