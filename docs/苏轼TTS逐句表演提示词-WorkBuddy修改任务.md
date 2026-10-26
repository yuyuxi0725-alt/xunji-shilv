# 苏轼 TTS 逐句表演提示词：WorkBuddy 修改任务

> 使用方法：将下方“可直接复制给 WorkBuddy 的提示词”整段复制给 WorkBuddy。  
> 本任务只制作配音文本与逐句表演指令，不调用付费 TTS、不生成音频、不上传或部署。

## 可直接复制给 WorkBuddy 的提示词

```text
请在当前“寻迹古今”项目中，为新版苏轼地点剧情制作完整的逐句 TTS 表演计划，并完成所需的代码、JSON 和说明文档修改。

一、先确认正确范围

1. 当前唯一数据源是 tts-audio/manifests/sushi-locations.json。
2. 该清单对应 22 个地点、228 个 NPC talk 节点。请以 audioQuestId + nodeId 作为唯一键。
3. 不要继续修改 sushi-p1.json～sushi-p5.json 或对应旧 emotion-plan；这些按时期划分的 106 条清单只是兼容遗留，不是当前地点模式的配音源。
4. 剧本生成文件 miniprogram/utils/stories/line-sushi-locations.generated.js 禁止手工修改。
5. 可参考现有的 build-dufu-location-emotion-plan.js、build-libai-location-emotion-plan.js 和 gen-volcengine-period.py，但要写出符合苏轼人物弧线的独立方案，不能机械替换姓名。

二、需要新增或修改的文件

1. 新增 tools/build-sushi-location-emotion-plan.js。
2. 由该脚本生成 tts-audio/manifests/sushi-locations-emotion-plan.json。
3. 新增 tts-audio/README-sushi-locations.md，说明生成、校验、dry-run 和正式生成方式。
4. 检查 tts-audio/voice-profiles.json：如果 _locationProfileMap 还没有 sushi，请只补充“地点 → 现有 sushi-p1～sushi-p5”的映射，不要擅自更换 voiceId、模型、全局 speech_rate 或 loudness_rate。
5. 不要改剧情台词、页面代码、旧时期清单或无关文件。

三、苏轼的整体表演方向

苏轼不是单纯“豪迈”，而是有生活气、幽默感、真性情和经历风雨后的旷达。他的核心弧线是：

- 少年：聪敏、坦率、好奇，认真里带一点藏不住的锐气；不能配成稚嫩撒娇，也不能像成年播音员。
- 青壮年：清朗、爽直、自信，有读书人的分寸，也有不肯圆滑的锋芒。
- 乌台诗案：受惊、疲惫、压抑，恐惧真实存在，但骨气仍在；不能从头到尾哭腔或虚弱气声。
- 黄州东坡：从低谷、苦涩逐渐走向自嘲、松弛和旷达；“苦”与“开”必须听得出前后变化。
- 晚年岭南与北归：苍老、略带沙哑和风霜感，但精神仍亮；临终段落要轻、稳、清楚，不演成夸张遗言腔。

整体必须像苏轼在和一路同行的故人当面说话：自然、有人味、有回应感。避免新闻播音腔、舞台朗诵腔、客服腔、机械匀速、句句同一重音、全程高亢或全程低沉。

四、每一句 emotionPrompt 必须包含的内容

对每一个可由苏轼配音的节点，emotionPrompt 都必须是针对该句的自然语言导演指令，至少覆盖以下四项；不要只把 emotion 枚举翻译成“高兴地说”“悲伤地说”：

1. 情感：主要情绪、强度，以及情绪背后的真实动机或处境。
2. 语音语调：音色明暗、音高走势、音量、气息、咬字、句尾如何落下。
3. 情感转折：若句内发生变化，要明确写出从哪句话或哪个语义转折点开始，由什么情绪转为什么情绪；没有明显转折时也要说明整句保持何种状态，不能硬造转折。
4. 速度变化：说明整体是中速、偏快或偏缓，以及句内哪里略快、哪里收慢、哪里恢复正常语流。速度变化要服务语义，不能逐字拖慢。

同时按需补充：

- 关键语义自然强调，但一条台词只突出最重要的少数词，不要字字加重。
- 按意群换气和短停；不要把每个逗号都读成停顿。
- 问句只在疑问焦点处轻微上扬，不要每个问句都悬高。
- 破折号、转折词、省略号和引用诗文前后的自然收放。
- 诗词或古文按意群自然吟出，像人物当场说出，不切换成舞台朗诵。
- 笑、苦笑、喘息、低声等舞台动作只用于指导表演，不能把括号里的动作念出来。

推荐顺序是“人物当下年龄与场景 + 主情绪及强度 + 音色/音高/气息 + 句内转折点 + 前后速度曲线 + 少量重音与收尾要求 + 禁止项”，但不要机械套模板。

合格示例：

“这是乌台狱中的中年苏轼，声音疲惫低沉，主要是死生未卜的恐惧被强行压住，情绪浓而克制。前半谈审讯时用偏低音区、中速稍紧地推进；到‘只是’前短暂收住，气息更沉，由惶恐转为对弟弟的牵挂；引用诗句时略放慢，咬字清楚但不用朗诵腔；最后一句音量放轻、尾音下落，像把可能的诀别亲手交出去，不哭喊、不拖字。”

不合格示例：

- “用悲伤的语气说。保持当前语速。”
- “悲伤、低沉、慢速。”
- 给所有 joy 节点复制同一句提示词。
- 不结合台词内容，凭 emotion 字段批量粘贴固定模板。

五、地点与人生阶段

地点到现有音色配置的映射应遵循 sushi-locations.js 的 PERIOD_LOCATIONS：

- sushi-p1：meishan、bianjing、fengxiang
- sushi-p2：hangzhou、mizhou、xuzhou、huzhou
- sushi-p3：wutai
- sushi-p4：dinghui、dongpo、chibi、shahu、chengtian
- sushi-p5：dengzhou、suti、yingzhou、yangzhou、dingzhou、huizhou、danzhou、jinshan、changzhou

请为 22 个地点分别写 LOCATION_STYLE 或等价配置，至少点明当时年龄、处境和声音底色。关键地点重点精调：

- meishan：十岁读《范滂传》，清亮认真，少年锐气初显。
- bianjing：少年成名，欣喜、自信，但面对欧阳修时有敬重与分寸。
- wutai：牢狱、生死一线，恐惧、疲惫、克制与骨气并存。
- dinghui：初贬黄州，贫病孤冷，表面平静、内里近乎心灰。
- dongpo：开荒求生，从苦涩、自嘲逐渐转向踏实和重新站起。
- chibi：豪情与苍凉并存，不是单一高亢。
- shahu：雨中旷达，轻松里有经历苦难后的通透。
- danzhou：年老远谪却把绝地活成家园，亲切、幽默、明亮。
- jinshan：回望一生，自嘲之下是看透后的坦然与辽阔。
- changzhou：病中北归、生命将尽，虚弱但清醒，轻而不飘，慢而不拖。

六、清洗朗读文本

每个计划项必须保留 sourceText，并生成真正送给 TTS 的 ttsText：

1. 删除所有中文圆括号和英文圆括号内的舞台动作，但保留动作对表演提示的影响。
2. 删除 Markdown 标记，例如 **，绝不能让 TTS 念出“星号”。
3. 保留引号内真正需要苏轼说出的原文、诗句和随后的白话解释。
4. 规范多余空白，但不要擅自改写剧情内容、删掉有意义的语气词或现代化古文。
5. 对“台词与叙述混写”的节点必须人工复核，必要时放入 VOICE_TEXT_OVERRIDES，确保 ttsText 只留下角色真正说出口的内容。

特别复核：

- changzhou/n3a：只读苏轼回答的“西方不无……”及解释，不读维琳方丈的动作和劝说。
- changzhou/n3b：只读苏轼回答的“著力即差”及解释，不读钱世雄的动作和劝说。
- 所有包含 ** 的 10 个节点，清洗后不得残留 Markdown 符号。

七、非苏轼台词不能误用苏轼音色

目前至少有两条是欧阳修本人说话：bianjing/n4、bianjing/n4a。

这两条仍须在 plan 中保留，以保证 228 条一一对应，但必须标为 skipTts: true，填写明确的 skipReason（“欧阳修台词，不能使用苏轼音色”），emotionPrompt 留空。不要用苏轼 voiceId 生成。

继续扫描全部 228 条，根据文本和舞台说明核验是否还混入其他人物的完整对白。若确认是其他人物，采用同样方式标记；不要只依赖现有 npc: true，因为它表示 NPC 节点，不等于说话者一定是苏轼。

八、输出 JSON 结构

sushi-locations-emotion-plan.json 使用与现有生成器兼容的结构：version、generatedAt、lineId、kind、sourceManifest、count、speakableCount、skippedCount、note、plan。每个 plan 项包含 audioQuestId、nodeId、sourceText、ttsText、emotion、intensity、skipTts、skipReason、emotionPrompt。

当前预期 count=228、speakableCount=226、skippedCount=2。226/2 是按已知两条欧阳修台词得到的预期值；如果全面核验后发现其他非苏轼说话节点，应据实调整并在交付说明中列证据，不能为了迎合数字而误配音。

九、逐句质量要求

1. 228 个源节点全部进入 plan，顺序与源清单一致，不重不漏。
2. 除 skipTts 节点外，每条 emotionPrompt 非空，并且确实结合该句文本。
3. 相邻分支即使 emotion 枚举相同，只要语义、关系或转折不同，提示词也应不同。
4. 关键转折、名句、牢狱、东坡重生、岭南旷达、临终等节点使用 PROMPT_OVERRIDES 或等价人工精调表，不得完全依赖正则模板。
5. intensity 在 0～1 之间，克制场景通常 0.35～0.55，强烈但不失控的场景通常 0.6～0.78；不要所有句子使用同一个数值。
6. 速度变化写入自然语言 emotionPrompt；全局 speech_rate 继续由 voice-profiles.json 控制，不要为某一句改坏整个人生阶段的基础音色。
7. 若过细的逐字重音指令导致表演僵硬，优先用“到某个语义处收住/提亮/转低/略快”这类自然表演描述；不写 SSML，不堆砌参数。

十、校验与验收

新增脚本内校验或独立只读校验，至少检查：

- source.items.length === plan.length === count。
- audioQuestId + nodeId 唯一，源清单和计划集合完全一致。
- 所有非 skipTts 项的 ttsText、emotionPrompt、emotion、intensity 有效。
- 所有 skipTts 项有 skipReason，且 emotionPrompt 为空。
- ttsText 不含舞台动作括号残留，不含 ** 等 Markdown 标记。
- 22 个地点全部覆盖，地点计数与源清单一致。
- _locationProfileMap.sushi 覆盖全部 22 个地点，映射到现有有效 profile。
- gen-volcengine-period.py 能按 location/node 找到计划项和对应 profile。

完成后执行但不要调用付费服务：

1. node tools/build-sushi-location-emotion-plan.js
2. 使用 gen-volcengine-period.py 对 sushi-locations.json 做 --dry-run；先按 --locations meishan,wutai,dongpo,changzhou 抽查，再做全量 dry-run。
3. 不设置或不使用 VOLCENGINE_API_KEY，不生成 mp3，不上传云端。

十一、最终交付说明

请报告修改/新增文件，总节点、可配音节点、跳过节点数量，所有跳过节点及原因，抽查的人生阶段和关键台词，校验命令及结果，以及仍需真人试听微调的高风险节点。

请直接实施和验证，不要只给方案；同时保护当前工作区已有改动，不覆盖或回退无关文件。
```

## 交付重点速查

- 当前范围：新版地点模式，22 地点、228 个 `talk` 节点。
- 目标产物：`sushi-locations-emotion-plan.json`，每个苏轼可配音节点都有独立表演提示词。
- 每句四要素：情感、语音语调、情感转折、速度变化。
- 文本清洗：不朗读舞台动作，不残留 Markdown 标记。
- 音色隔离：欧阳修台词不得使用苏轼音色。
- 安全边界：只 dry-run，不调用付费 TTS，不生成、上传或部署音频。
