// miniprogram/utils/stories/line-dufu-locations.generated.js
// ⚠️ 本文件由 tools/build-dufu-locations.js 自动生成，禁止手工修改。
//    tools/build-dufu-fenjing.js 为同一构建流程的别名入口，二者输出完全一致。
//    改剧本请回到 docs/杜甫行迹剧本-全22地点-含分镜.md（唯一工作源），然后重新运行：
//      node tools/build-dufu-locations.js
// 来源：docs/杜甫行迹剧本-全22地点-含分镜.md
// 内容：杜甫 22 地点剧本（QUEST_* 对象），切镜节点带镜头级 scene（<地点>_s0N）。

const quests = {};

quests['luoyang'] = {
  "id": "luoyang",
  "title": "洛阳 · 七岁咏凤凰",
  "range": "约 719 年",
  "place": {
    "name": "洛阳杜宅",
    "year": "约719年"
  },
  "scene": "luoyang",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "唐朝，洛阳城西，杜家的宅院。青石铺地，几竿修竹，檐下挂着一串风铃，正被风摇出细碎的响。",
      "scene": "luoyang",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "今日杜家宴客，院门未闭。你从席间走到东厢房外，听见一个孩子琅琅的读书声。这是你第一次来到这里，也将是你与杜甫的初见。",
      "next": "n1b",
      "scene": "luoyang_s02"
    },
    "n1b": {
      "type": "narrate",
      "text": "那声音清亮稚嫩，念的是\"学而时习之\"，一字一顿，透着与年纪不相称的认真。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "循着声音望去，书房的门半掩着。一个七八岁的孩子坐在案前，正悬着腕，一笔一画地写字，浑然没察觉门外有人。",
      "next": "n2a"
    },
    "n2a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（忽然抬头，见门口站着个生面孔，微微一愣，随即放下笔）这位兄台，看着面生，可是今日来府上的客人？快请进来。",
      "next": "n2b"
    },
    "n2b": {
      "type": "choice",
      "npc": true,
      "question": "他先开了口。你该说点什么？",
      "options": [
        {
          "text": "见你写得认真，没敢打扰。",
          "next": "n2c"
        },
        {
          "text": "刚在院子里听见你念书，念得真好。",
          "next": "n2d"
        },
        {
          "text": "（目光落在那页纸上）你在写什么？",
          "next": "n2e"
        }
      ]
    },
    "n2c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（摆摆手，又带着点得意）无妨。祖父说，练字最忌心浮，我方才只当是入了定。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（眼睛一亮）你也觉得好？祖父说，读书要读出味儿来，光认得字可不算数。",
      "next": "n3"
    },
    "n2e": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（把笔搁下，叹了口气）写首诗。祖父前日问我，一个人这辈子，志向该像什么。我想来想去，总也落不定一个字。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "案上散着一叠纸，张张都只写了开头几个字，又都被墨重重划去。他顺着你的目光，有些不好意思地把纸拢了拢。",
      "next": "n3a",
      "scene": "luoyang_s03"
    },
    "n3a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "都划废了。祖父说，写诗和做人一样，最要紧的是一个\"立\"字——立得住，才写得成。可这个字，我还没寻到。",
      "next": "n3b"
    },
    "n3b": {
      "type": "choice",
      "npc": true,
      "question": "看他为此苦恼，你想说些什么？",
      "options": [
        {
          "text": "你心里，其实已经有个答案了吧？",
          "next": "n3c"
        },
        {
          "text": "志向二字，不必急在这一时。",
          "next": "n3d"
        },
        {
          "text": "（拿起一张划废的纸，想看看他写过什么）",
          "actionOnly": true,
          "next": "n3e"
        }
      ]
    },
    "n3c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（被你说中，眼睛亮了起来）你怎知道？我昨夜翻来覆去睡不着，心里是有个影子，只是一直找不到配得上它的字。",
      "next": "n4"
    },
    "n3d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（摇头）祖父常说，志气要趁早立下。立得早，往后的路才走得直。所以这个字，我今日非得想出来不可。",
      "next": "n4"
    },
    "n3e": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（见你拿起废纸，他凑过来）这几张，我写的是\"鸿鹄\"\"鲲鹏\"，都嫌不够。总觉着，还差一口气。",
      "next": "n4"
    },
    "n4": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他忽然不说话了，望着窗外，指尖无意识地敲着桌沿）鸿鹄能高飞，鲲鹏能九万里，可都只写了\"飞\"，没写出\"不将就\"。",
      "next": "n4a",
      "scene": "luoyang_s04"
    },
    "n4a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（猛地坐直，眼里放光）我想起来了！祖父教我读书时说过——凤凰非梧桐不栖，非醴泉不饮。就是它了！",
      "next": "n4b"
    },
    "n4b": {
      "type": "narrate",
      "text": "他重新蘸墨，运笔如飞。这一次没有犹豫，落笔即成，五个字力透纸背——\"开口咏凤凰\"。",
      "next": "n4c"
    },
    "n4c": {
      "type": "choice",
      "npc": true,
      "question": "原来他苦想一夜、划废一叠纸，落定的竟是\"凤凰\"。你此刻怎么看？",
      "options": [
        {
          "text": "（盯着那五个字）凤凰，好大的气魄。",
          "next": "n4d"
        },
        {
          "text": "为什么偏偏是凤凰，不是鸿鹄鲲鹏？",
          "next": "n4e"
        },
        {
          "text": "这一个\"咏\"字，从何而来？",
          "next": "n4f"
        }
      ]
    },
    "n4d": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他挺直了背）凤凰是百鸟之王，非梧桐不栖，非醴泉不饮。我想要的，就是这样一种不将就的活法。",
      "next": "n5"
    },
    "n4e": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（认真道）鸿鹄、鲲鹏，都只讲飞得多高。可凤凰不同——它挑树，也挑水。飞得高不算什么，守得住自己，才最难。",
      "next": "n5"
    },
    "n4f": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "\"咏\"就是歌咏、吟咏。祖父说，读书人要先学会咏物、咏志。我第一首真正想写下的，就是心里这只凤凰。",
      "next": "n5"
    },
    "n5": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他放下笔，语气忽然郑重起来）其实这些道理，都是我祖父教的。我杜家祖上就是读书写诗的人家，到我这一辈，家里仍指着我把这份家学接下去。",
      "next": "n5a",
      "scene": "luoyang_s05"
    },
    "n5a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "祖父有句话常挂在嘴边，叫\"诗是吾家事\"。我从前不懂，今日写下这五个字，倒隐隐有些明白了。",
      "next": "n5b"
    },
    "n5b": {
      "type": "choice",
      "npc": true,
      "question": "他反复提到\"祖父\"，你起了好奇。你想问什么？",
      "options": [
        {
          "text": "你祖父，是怎样一位人物？",
          "next": "n5c"
        },
        {
          "text": "你们家祖上，都写诗吗？",
          "next": "n5d"
        },
        {
          "text": "（静静听他说下去）",
          "actionOnly": true,
          "next": "n5e"
        }
      ]
    },
    "n5c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（眼里有了光）我祖父名审言，是\"文章四友\"里的一位，与李峤、崔融、苏味道并称，诗名传遍天下。父亲常把他的诗念给我听，我听得久了，便记在了心里。",
      "next": "n6"
    },
    "n5d": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（如数家珍）正是。我祖父是初唐有名的诗人，再往上，家里辈辈都是读书人。到了我，自然也不敢懈怠。",
      "next": "n6"
    },
    "n5e": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（见你听得认真，声音也放轻了些）这些事，与旁人说，只当是小孩子吹嘘。也就是你，愿意安安静静听我讲。",
      "next": "n6"
    },
    "n6": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他重新坐正，把那张写好的纸在案上铺平，端详片刻）祖父说，凤凰是百鸟之长。我既姓杜，就该对得起这\"咏凤凰\"三个字——将来，我也要写出能传下去的诗。",
      "anchor": "a1",
      "next": "n7"
    },
    "n7": {
      "type": "aiFree",
      "prompt": "你初到洛阳杜家，第一次与七八岁的杜甫在书房对坐。他刚写下\"开口咏凤凰\"，又讲起祖父杜审言与杜家写诗的家传，神情认真，眼睛发亮。你可以问他读书、志向、家世，或\"咏凤凰\"是怎么想出来的。此时你们才刚认识，不要谈论后来共同经历的事。",
      "hint": "你可以问：杜审言与\"文章四友\"、杜家的家学、他读过什么书、为什么想写凤凰……",
      "suggestions": [
        "你祖父的诗，哪一句你最喜欢？",
        "你才这么大，怎么就想着要写诗了？",
        "除了凤凰，你还想写什么？"
      ],
      "scene": "luoyang",
      "minRounds": 1,
      "next": "n8"
    },
    "n8": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（前厅传话，说是该告辞了。他起身送你到门口，又折回案前，把那五个字认认真真重抄了一遍，塞进你手里）这个，你收着。",
      "next": "n8a",
      "scene": "luoyang_s06"
    },
    "n8a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（冲你一笑）这是我头一个认认真真写下的志向。今日与你说了这许多话，倒像是找到了个能听懂的人。",
      "next": "n9"
    },
    "n9": {
      "type": "reflect",
      "lines": [
        "我揣着那张纸走出杜家，纸上的\"开口咏凤凰\"还带着未干的墨香。",
        "一个七八岁的孩子，说起凤凰、说起将来，眼里亮得惊人。",
        "他还不懂什么叫家国，也还没尝过日后那些颠沛流离的苦。此刻他心里装着的，只是一个朴素又倔强的念头——我要做一个了不起的人。",
        "读书、练字、背祖父的诗，全都朝着这一个念头去。",
        "许多孩子小时候都有过这样的梦，可大多人长大就忘了。",
        "我并不知道，眼前这个孩子，后来真的把这条路走了一辈子。",
        "而这一切的起点，不过是今日这五个字，和一个愿意把它当真的七岁少年。"
      ],
      "next": "n10",
      "scene": "luoyang_s07"
    },
    "n10": {
      "type": "anchorCard",
      "anchor": "a1",
      "next": "__end__"
    }
  }
};

quests['shuhu'] = {
  "id": "shuhu",
  "title": "洛阳 · 观公孙大娘舞剑",
  "range": "约 720–730",
  "place": {
    "name": "洛阳私塾",
    "year": "约720–730年"
  },
  "scene": "shuhu",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "洛阳城西，一片空地。日头偏西，把人影拉得老长。",
      "scene": "shuhu",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "风里隐约传来一片叫好声，循声望去，前头空地上一圈人围得水泄不通，最外层的孩子正踮着脚，急得来回挪步。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "听说今日公孙大娘在城中舞剑。那是名动京师的人物，寻常人家挤破了头，也要远远看一眼。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "你在人群外，一眼认出那个正拼命踮脚往人缝里钻的少年——是先前在杜家书房见过的杜甫。他个头还小，被前头的大人们挡得严严实实，急得鼻尖都冒了汗。",
      "next": "n2x"
    },
    "n2x": {
      "type": "narrate",
      "text": "他回头时也认出了你，先是一怔，随即眼睛一亮，隔着人群朝你招了招手。",
      "next": "n2a"
    },
    "n2a": {
      "type": "choice",
      "npc": true,
      "question": "那少年看得抓耳挠腮，却总够不着。你要不要帮他一把？",
      "options": [
        {
          "text": "（上前拍拍他）来，我驮你，你站我肩上看。",
          "next": "n2b"
        },
        {
          "text": "（把自己的位置让出来）你往这儿站，这儿看得清。",
          "next": "n2c"
        },
        {
          "text": "（也踮起脚，想看看里头到底有什么）",
          "actionOnly": true,
          "next": "n2d"
        }
      ]
    },
    "n2b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（认出你，他眼睛一亮，又有点不好意思，搓搓手）兄台，是你。这……这怎么好。（顿了顿，还是没忍住）那你蹲低些，我轻。\n你蹲下身，他手脚并用爬上来，两只手扶住你的额角，又轻又稳。\n他在你头顶上安静了一会儿，忽然小声念起来，念得又快又碎，听不真切。他垂下来的两只手在你眼前比划，一下，又一下。\n前头人群松动了些，他连忙拍拍你的头：“放我下来，放我下来——我自己看得见了。”\n你把他放下，他道了谢，两个人一齐往场中望去。",
      "next": "n3"
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（认出你，他先是一愣，随即连声道谢，忙不迭挤进去）兄台，又劳你帮我！\n你退到侧边，从这个角度，剑看不清，倒看清了舞剑那个人——公孙大娘。她还没起势，握着剑站在那里，那只手一直在抖，抖得剑穗都跟着轻颤。\n散场后你跟他说起，他愣了半天：“她也会抖？”然后就不吭声了。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（见你也跟着踮脚，他反倒笑了，朝前头一努下巴）都别挤啦，等这拨人散了，总能瞧见一眼。\n这拨人偏偏不散。他泄了气，忽然拽拽你的袖子：“那边有个老头在讲这剑的来历，走，听去。”\n老头讲得半真半假，他倒听得比看剑还上心，追着问：她师父是谁？她师父的师父呢？",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "前头忽然静了下来。一声清越的剑鸣破空而起，紧接着，一道剑光如银蛇乍起，在暮色里翻飞。那少年猛地瞪大了眼，忘了呼吸，连嘴唇都微微张着。",
      "next": "n3a",
      "scene": "shuhu_s02"
    },
    "n3a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他看得痴了，喃喃出声，声音里带着颤）快……快得像一道光。我从没见过，剑还能这样使。",
      "next": "n3b"
    },
    "n3b": {
      "type": "narrate",
      "text": "公孙大娘的剑越舞越快，剑光如泼雪，人随剑走，忽而腾起，忽而回旋，满场只闻剑风，不见人影。那少年的手不知什么时候攥紧了你的袖口，指节都捏得发白，他却浑然不觉。",
      "next": "n4"
    },
    "n4": {
      "type": "choice",
      "npc": true,
      "question": "剑光纵横间，你侧头看那少年，他整个人都像是被吸了进去。你心里想的是？",
      "options": [
        {
          "text": "这孩子，看剑看得连魂都飞了。",
          "next": "n4a"
        },
        {
          "text": "（顺着他的目光，也往场中看）",
          "actionOnly": true,
          "next": "n4b"
        }
      ]
    },
    "n4a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（半晌，他才回过神，轻轻吐出一口气，眼睛仍盯着场中）我……我在想，写诗，是不是也该像这剑。",
      "next": "n5"
    },
    "n4b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他目不转睛，好一会儿才低声道）你瞧那剑，一招一式都不多余。我一想起自己写字，总觉得拖泥带水。",
      "next": "n5"
    },
    "n5": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他缓缓抬起手，像要隔空接住那道剑光）祖父常说我写字软，缺一口劲。我原不懂。（他攥了攥拳头）今日看了这剑，好像有点懂了。",
      "next": "n5a"
    },
    "n5a": {
      "type": "narrate",
      "text": "舞到酣处，公孙大娘一个收势，剑尖稳稳定住，满场先是死一般的静，随即爆出山呼般的喝彩。那少年这才想起呼吸，长长地喘了一口气，手心还黏着一层汗。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "人群散了，他不走，蹲在地上捡了根树枝，在土里划拉。你凑过去看——他写\"来如……\"，划掉；写\"剑光……\"，又划掉。",
      "next": "n6a",
      "scene": "shuhu_s03"
    },
    "n6a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他抬起头，有点恼，把树枝一扔）我写不出来。方才明明看见了的。\n（站起来拍拍手上的土，忽然又认真起来）我回去再想。想不出来，明天再来等——她明天还舞吗？",
      "next": "n7"
    },
    "n7": {
      "type": "reflect",
      "lines": [
        "人群散去，空地上只余一地的暮色。",
        "那少年站在原地，许久没动，像是要把那剑光一遍遍在脑子里重演。",
        "许多年后，他写下一句\"来如雷霆收震怒\"。",
        "或许，写的就是今天这一场。"
      ],
      "next": "__end__",
      "scene": "shuhu_s04"
    }
  }
};

quests['wuyue'] = {
  "id": "wuyue",
  "title": "吴越 · 南游",
  "range": "731–734",
  "place": {
    "name": "吴越之地",
    "year": "731–734年"
  },
  "scene": "wuyue",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "江南，一座水乡石桥上。细雨斜斜地落，桥下乌篷船缓缓划过，荡开一圈圈涟漪。",
      "scene": "wuyue",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "桥头站着一个人，二十出头，凭栏而立，正望着远处迷蒙的山水出神。他一身行装已见风尘，肩上背着书箱。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "他听见脚步声，回头看了一眼，先是一怔，随即笑了。",
      "next": "n2"
    },
    "n2": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（笑）是你。（停了停）一别经年，不想竟在这江南烟雨里，又遇见了。",
      "next": "n2a"
    },
    "n2a": {
      "type": "choice",
      "npc": true,
      "question": "多年后重逢，眼前已是长大成人的杜甫。你想说点什么？",
      "options": [
        {
          "text": "（问）你怎么一个人到了这江南？",
          "next": "n2b"
        },
        {
          "text": "（望着他，只觉时光如流水）",
          "actionOnly": true,
          "next": "n2c"
        },
        {
          "text": "（问）这一路，走了多远？",
          "next": "n2d"
        }
      ]
    },
    "n2b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望向远方）家里的书读得差不多了。（停了停）祖父在世时常说，天下之大，不能只活在那几册书里。",
      "next": "n3"
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你出神，也顺着你的目光望向水面）是啊，日子过得真快。（停了停）当年在书房里写字的孩子，如今，倒成了个风尘仆仆的旅人。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他笑了，眼里带着当年那股劲）从洛阳一路南来，过金陵，下姑苏，如今到了这吴越之地。（停了停）眼睛就没停过。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "雨小了些。他领你上了桥，指着远处的山。",
      "next": "n3a",
      "scene": "wuyue_s02"
    },
    "n3a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（指着远处的山）你看这江南的山，和中原大不相同。（停了停）中原的山，苍茫硬朗；这里的山，却像被水洗过，柔得很。",
      "next": "n4"
    },
    "n4": {
      "type": "choice",
      "npc": true,
      "question": "他指着远处的山，说江南的山柔。你想接什么？",
      "options": [
        {
          "text": "（问）那您更喜欢哪一种？",
          "next": "n4a"
        },
        {
          "text": "（问）这一路，还看见什么了？",
          "next": "n4b"
        },
        {
          "text": "（望着那山，没说话）",
          "actionOnly": true,
          "next": "n4c"
        }
      ]
    },
    "n4a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）说不上更喜欢。（停了停）中原的山，教人往上走；江南的山，教人停下来看。（顿了顿）看了这一路，我倒是学会了停一停。",
      "next": "n5"
    },
    "n4b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（眼睛亮了）多了。（停了停）金陵的旧都，姑苏的台榭，还有这江南的水。（顿了顿）从前只在书上读过，如今亲眼见了，才知道书上写的，不及十分之一。",
      "next": "n5"
    },
    "n4c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也安静下来。两个人望着远处的山，雨丝落在水面上，一圈一圈）",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "桥下又划过一艘乌篷船，船娘唱着小调，声音软软的，顺着水飘过来。",
      "next": "n5a",
      "scene": "wuyue_s03"
    },
    "n5a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他听着那调子，忽然道）我从前只知读书，把自己关在书斋里，以为天下就是那几册书。（停了停）如今走出来才懂——",
      "next": "n5b"
    },
    "n5b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他望着那船）山水也是书，风也是书，连这渡口上萍水相逢的人，都是书。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "他说山水也是书。你想接什么？",
      "options": [
        {
          "text": "（问）这一路，您变了不少。",
          "next": "n6a"
        },
        {
          "text": "（问）接下来，还要往更南处去吗？",
          "next": "n6b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他认真点头）是变了。（停了停）从前我眼里的天下，是洛阳那一方天地；如今，江南的烟雨、金陵的旧都、吴越的山水，都装进心里了。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他眼睛一亮）再往南，还有会稽、还有更远的地方。（停了停）既出了门，就该把路走得更远些，才不负这大好河山。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）这些年，我走过的路，比读过的书还多。（停了停）可越走，越觉得自己知道得少。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "过了些日子，他往会稽去。你陪他走了一段。",
      "next": "n7a",
      "scene": "wuyue_s04"
    },
    "n7a": {
      "type": "narrate",
      "text": "会稽山下，有一处旧迹。当地人指着山脚一片荒草，说，这就是当年越王勾践卧薪尝胆的地方。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "会稽山下，是勾践卧薪尝胆的旧迹。你想说点什么？",
      "options": [
        {
          "text": "（问）您信这些传说吗？",
          "next": "n8a"
        },
        {
          "text": "（看着那片荒草，没说话）",
          "actionOnly": true,
          "next": "n8b"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）信不信，不打紧。（停了停）要紧的是，这地方，让人想起一个人在绝境里，还能咬牙撑下去。（顿了顿）这比什么都实在。",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他站在那片荒草前，站了很久，忽然道）一个人，能忍到那个地步。（停了停）不容易。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "从会稽回来，他又在江南盘桓了些日子。可家书来了，说家里有事，得回去了。",
      "next": "n9a",
      "scene": "wuyue_s05"
    },
    "n9a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他把信收起来，望着江南的水）该回去了。（停了停）这一趟出来，走了好几年。",
      "next": "n10"
    },
    "n10": {
      "type": "choice",
      "npc": true,
      "question": "他要回中原了。你想说点什么？",
      "options": [
        {
          "text": "（问）这一趟，最舍不得哪里？",
          "next": "n10a"
        },
        {
          "text": "（问）回去之后，打算做什么？",
          "next": "n10b"
        },
        {
          "text": "（沉默地陪他站着）",
          "actionOnly": true,
          "next": "n10c"
        }
      ]
    },
    "n10a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）说不上来。（停了停）这江南的水，这桥，这船，都舍不得。（顿了顿）可也说不清，到底舍不得哪一样。",
      "next": "n11"
    },
    "n10b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他望着北边）回去，该应举了。（停了停）读了这么多年的书，走了这么多年的路，总得去试一试。",
      "next": "n11"
    },
    "n10c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己开了口）出来的时候，我是个书斋里的少年。（停了停）回去的时候，总该有点不一样了。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "他收拾好行装，往北去。走到桥头，他停下来，回头看了一眼这江南的水。",
      "next": "n11a"
    },
    "n11a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他站了一会儿，转过身）走吧。（停了停）回洛阳。",
      "next": "n12"
    },
    "n12": {
      "type": "aiFree",
      "prompt": "你与青年杜甫在江南重逢。他二十出头，南游吴越，过金陵、下姑苏、到会稽，看了几年山水。他刚对你说完\"山水也是书，风也是书\"，也说了回去该应举了。你可以问他这一路的见闻、江南的山水、会稽的旧迹、回去的打算。",
      "hint": "你可以问：南游的路线、江南的山水、金陵姑苏的见闻、会稽勾践的旧迹、回去应举的打算……",
      "suggestions": [
        "这一路，您最喜欢哪里？",
        "江南的山，和中原有什么不同？",
        "回去应举，有把握吗？"
      ],
      "scene": "wuyue",
      "minRounds": 1,
      "next": "n13"
    },
    "n13": {
      "type": "reflect",
      "lines": [
        "他在烟雨里渐行渐远，肩上的书箱一晃一晃。",
        "这一趟吴越之行，没有惊心动魄的际遇，却把一个书斋里的少年，一点点养成了见多识广的旅人。",
        "山水入眼，也入了心。",
        "他往北去了。说是回去应举。"
      ],
      "next": "__end__"
    }
  }
};

quests['luoyang_shi'] = {
  "id": "luoyang_shi",
  "title": "洛阳 · 应举",
  "range": "735",
  "place": {
    "name": "洛阳",
    "year": "735年（二十四岁）"
  },
  "scene": "luoyang_shi",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "从江南回来，他又在洛阳住了些日子。书箱里的稿子积了厚厚一叠，人晒黑了，也壮实了些。",
      "scene": "luoyang_shi",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "这年秋天，他要去应进士举了。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "考前几天，他在客栈里闭门不出，把带来的书翻了一遍又一遍。",
      "next": "n2a",
      "scene": "luoyang_shi_s02"
    },
    "n2a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（见你来了，放下书，笑了一下）这一回，心里倒是有些底。（停了停）走了几年，看了些山水，也该试试了。",
      "next": "n2b"
    },
    "n2b": {
      "type": "choice",
      "npc": true,
      "question": "考前几天，他在客栈里温书。你想说点什么？",
      "options": [
        {
          "text": "（问）有把握吗？",
          "next": "n2c"
        },
        {
          "text": "（问）考完之后，有什么打算？",
          "next": "n2d"
        },
        {
          "text": "（看着他案上那叠书，没说话）",
          "actionOnly": true,
          "next": "n2e"
        }
      ]
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（想了想）说不上有把握。（停了停）可总得去试试。（顿了顿）读了这么多年书，总该有个交代。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（想了想，摇头）没想那么远。（停了停）眼下只想把这一关过了。（顿了顿）考完之后的事，考完再说。",
      "next": "n3"
    },
    "n2e": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己开了口）这些书，翻来覆去读了好几遍了。（停了停）能不能中，看天意吧。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "考试那天，天还没亮，他就起了身。贡院外排着长队，都是各地来的举子。",
      "next": "n3a",
      "scene": "luoyang_shi_s03"
    },
    "n3a": {
      "type": "narrate",
      "text": "他排在队伍里，看着前后左右的人。有的在低声背书，有的闭目养神，有的脸色发白。",
      "next": "n3b"
    },
    "n3b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他低声对你道）这么多人。（停了停）可取的，就那么几个。",
      "next": "n4"
    },
    "n4": {
      "type": "choice",
      "npc": true,
      "question": "贡院外排着长队，他低声说了句\"取的就那么几个\"。你想接什么？",
      "options": [
        {
          "text": "（问）紧张吗？",
          "next": "n4a"
        },
        {
          "text": "（问）考不上，怎么办？",
          "next": "n4b"
        },
        {
          "text": "（拍了拍他的肩）",
          "actionOnly": true,
          "next": "n4c"
        }
      ]
    },
    "n4a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（摇头）不紧张。（停了停）就是觉得，这队伍太长了。（顿了顿）长得让人心里没底。",
      "next": "n5"
    },
    "n4b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）考不上，就往北去。（停了停）齐赵那边，我还没去过。（顿了顿）总不至于没路走。",
      "next": "n5"
    },
    "n4c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他任你拍肩，站直了些）多谢。（停了停）借你吉言。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "考完出来，他站在贡院门口，长长出了口气。",
      "next": "n5a",
      "scene": "luoyang_shi_s04"
    },
    "n5a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你，笑了笑）考完了。（停了停）题目不算难。（顿了顿）可写得好不好，自己说了不算。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "考完了，他站在贡院门口。你想说点什么？",
      "options": [
        {
          "text": "（问）方才那道策论，您怎么答的？",
          "next": "n6a"
        },
        {
          "text": "（问）现在去哪儿？",
          "next": "n6b"
        },
        {
          "text": "（陪他站着，没说话）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）问的是治国之道。（停了停）我把这些年走的地方、看见的事，都写进去了。（顿了顿）不知道合不合考官的意思。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他伸了个懒腰）先睡一觉。（停了停）这些天，没睡好过。（顿了顿）然后等放榜。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也没多说，两个人就站在贡院门口，看着来来往往的人）",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "放榜那天，贡院前挤满了人。他站在人群外，没有往前挤。",
      "next": "n7a",
      "scene": "luoyang_shi_s05"
    },
    "n7a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他望着那面榜，声音很平）你去看看吧。（停了停）我在这儿等着。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "他让你去看榜，自己在人群外等着。你想怎么做？",
      "options": [
        {
          "text": "（挤进去，从头到尾找他的名字）",
          "actionOnly": true,
          "next": "n8a"
        },
        {
          "text": "（站在他旁边，不动）",
          "actionOnly": true,
          "next": "n8b"
        }
      ]
    },
    "n8a": {
      "type": "narrate",
      "text": "你挤进人群，从榜首一路看下来，一行一行，看到最后一行——没有。",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不去，笑了一下）不去也好。（停了停）我自家去看。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "他慢慢走到榜前，从头到尾看了一遍，又看了一遍。",
      "next": "n9a",
      "scene": "luoyang_shi_s06"
    },
    "n9a": {
      "type": "narrate",
      "text": "人群渐渐散了，他还站在那儿。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他退后一步，转过身，苦笑了一下）没有。（停了停）翻来覆去，就是没有\"杜甫\"这两个字。",
      "next": "n10"
    },
    "n10": {
      "type": "choice",
      "npc": true,
      "question": "他落第了。你想说点什么？",
      "options": [
        {
          "text": "（问）心里难受吗？",
          "next": "n10a"
        },
        {
          "text": "（说）这一榜，未必是定数。",
          "next": "n10b"
        },
        {
          "text": "（沉默地陪他站着）",
          "actionOnly": true,
          "next": "n10c"
        }
      ]
    },
    "n10a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）说不上难受。（停了停）就是有些空。（顿了顿）读了这么多年的书，走了这么多年的路，到头来，连张榜都换不来。",
      "next": "n11"
    },
    "n10b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他眼睛微微一亮，随即又黯淡）定数？（停了停）父亲也说，一时得失算不得什么。（顿了顿）可这一榜，终究是有人中了，有人没中。",
      "next": "n11"
    },
    "n10c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己开了口）多谢你。（停了停）这时候，能有人陪着一同看这张榜，也算不孤单。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "他抬头看了看天，忽然笑了。",
      "next": "n11a",
      "scene": "luoyang_shi_s07"
    },
    "n11a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他转过头对你道）我想好了。（停了停）科场既不留我，我便去寻我的山川。（顿了顿）齐赵之地，我还没去过。",
      "next": "n12"
    },
    "n12": {
      "type": "choice",
      "npc": true,
      "question": "他忽然笑了，说要去齐赵。你想接什么？",
      "options": [
        {
          "text": "（问）就这样走了？",
          "next": "n12a"
        },
        {
          "text": "（问）齐赵那边，有什么？",
          "next": "n12b"
        },
        {
          "text": "（问）不怕家里人说？",
          "next": "n12c"
        }
      ]
    },
    "n12a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（点头）就这样走。（停了停）榜上无名，未必不是一桩幸事。（顿了顿）天下的路多得很，何必只盯着这一张榜。",
      "next": "n13"
    },
    "n12b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（眼睛亮了）原野，马，还有泰山。（停了停）我早就想去了。（顿了顿）从前是读书，如今，该去看看真山真水了。",
      "next": "n13"
    },
    "n12c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（想了想）说。（停了停）父亲那边，我去说。（顿了顿）他读过万卷书，也走过万里路。他会懂的。",
      "next": "n13"
    },
    "n13": {
      "type": "narrate",
      "text": "过了几日，他收拾好行装，出了洛阳城。往北，齐赵。",
      "next": "n13a",
      "scene": "luoyang_shi_s08"
    },
    "n13a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（出城的时候，他回头看了一眼洛阳城，笑了一下）走了。（停了停）齐赵见。",
      "next": "n14"
    },
    "n14": {
      "type": "aiFree",
      "prompt": "你与二十四岁的杜甫在洛阳，他刚应进士举落第。读了多年书，走了多年路，到头来榜上无名。他没有消沉，反而决定往北去齐赵漫游。你可以问他落第的滋味、去齐赵的打算、家里的态度、对科场的看法。",
      "hint": "你可以问：落第后的心境、去齐赵的计划、家里人的态度、对科举的看法……",
      "suggestions": [
        "落第之后，心里最难熬的是什么？",
        "齐赵之行，您最想去哪儿？",
        "您还会再回来考吗？"
      ],
      "scene": "luoyang_shi",
      "minRounds": 1,
      "next": "n15"
    },
    "n15": {
      "type": "anchorCard",
      "anchor": "a2",
      "next": "n16"
    },
    "n16": {
      "type": "reflect",
      "lines": [
        "他往北去了。背影没入洛阳城的暮色里。",
        "一个二十四岁的落第书生，没有抱怨，没有消沉，只是把榜上的名字，轻轻放下了。",
        "他失去了一次做官的机会，却得到了一条走向山川的路。",
        "此后的齐赵、泰山，还有那一首首后来传遍天下的诗，都要从这榜下的一转身说起。"
      ],
      "next": "__end__"
    }
  }
};

quests['qizhao'] = {
  "id": "qizhao",
  "title": "梁宋齐鲁 · 与李白同游",
  "range": "744–745",
  "place": {
    "name": "梁宋齐鲁",
    "year": "744–745年"
  },
  "scene": "qizhao",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "齐鲁之间，一片开阔的原野。天高地阔，风里裹着草香，远处两骑并辔而行，正谈笑着策马而来，身后扬起一道轻尘。",
      "scene": "qizhao",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "那青衫的正是杜甫。比在洛阳时壮实了些，眉宇间多了几分疏狂，背上还挂着一张弓。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "他身旁那白衣胜雪、气度不凡的人，你远远就认出来了——是名满天下的李白。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "你朝他们迎上去。杜甫先看见你，勒住马，脸上又惊又喜。",
      "next": "n2a",
      "scene": "qizhao_s02"
    },
    "n2a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（翻身下马，一把抓住你的胳膊）是你！洛阳一别，竟又在齐鲁遇见了！（停了停）前些日子我与太白兄同游梁宋，今日正好引你们相识。",
      "next": "n2b"
    },
    "n2b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他拉着你，转向马上那人）快，我给你引荐一位了不得的人物。",
      "next": "n3"
    },
    "n3": {
      "type": "choice",
      "npc": true,
      "question": "他乡遇故知，又见着李白。你想说点什么？",
      "options": [
        {
          "text": "（望向那白衣身影）这位，莫不是太白先生？",
          "next": "n3a"
        },
        {
          "text": "（问）你们二位，竟走到了一处？",
          "next": "n3b"
        },
        {
          "text": "（笑着迎上去）能在此时此地重逢，真是快事。",
          "next": "n3c"
        }
      ]
    },
    "n3a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（李白闻言，勒马回头，朗声一笑）正是。（停了停）我瞧你是个识货的。（顿了顿）子美方才还提起一位故人，说若在齐鲁遇见，定要引我相识。今日一见，果然气度不俗。",
      "next": "n4"
    },
    "n3b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（杜甫抚掌而笑）说来也巧。（停了停）我与太白兄在梁宋相逢，一见如故，便结伴北上，一路纵马射猎、饮酒论诗。（顿了顿）正说着，便遇见你了。",
      "next": "n4"
    },
    "n3c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（杜甫下马，眼里满是快意）天南地北，兜兜转转，偏在此时此地撞见，这就是缘分。（停了停）走，随我们一道去前面那片草场，射几支箭、喝几碗酒。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "三人策马上了草场。风猎猎地吹，草浪起伏，一直铺到天边。",
      "next": "n4a",
      "scene": "qizhao_s03"
    },
    "n4a": {
      "type": "narrate",
      "text": "李白拔剑起舞，白衣翻飞，剑光在日光里划出一道道弧。",
      "next": "n4b"
    },
    "n4b": {
      "type": "narrate",
      "text": "杜甫张弓搭箭，一声弦响，羽箭没入远处的草垛，箭尾还在颤。",
      "next": "n5"
    },
    "n5": {
      "type": "choice",
      "npc": true,
      "question": "草场上，一个舞剑，一个射箭。你想做什么？",
      "options": [
        {
          "text": "（看李白舞剑）",
          "actionOnly": true,
          "next": "n5a"
        },
        {
          "text": "（看杜甫射箭）",
          "actionOnly": true,
          "next": "n5b"
        },
        {
          "text": "（也拿起一张弓，试一试）",
          "actionOnly": true,
          "next": "n5c"
        }
      ]
    },
    "n5a": {
      "type": "narrate",
      "text": "李白的剑越舞越快，衣袂带风。他忽然收势，剑尖稳稳停住，回头冲你们一笑。",
      "next": "n5a1"
    },
    "n5a1": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（李白把剑一收，朗声道）子美，你这箭射得准，我这剑舞得可还看得？（停了停）可惜没酒。（顿了顿）有酒，就更好了。",
      "next": "n6"
    },
    "n5b": {
      "type": "narrate",
      "text": "杜甫又射了一箭，这一箭偏了些。他放下弓，摇了摇头。",
      "next": "n5b1"
    },
    "n5b1": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他回头冲你笑）手生了。（停了停）从前在洛阳，哪有工夫射箭。（顿了顿）如今倒好，没人管了，想射就射。",
      "next": "n6"
    },
    "n5c": {
      "type": "narrate",
      "text": "你拿起一张弓，搭上箭，拉满了，一松手——箭飞出去，扎在草垛边上。",
      "next": "n5c1"
    },
    "n5c1": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（杜甫拍手）好！（停了停）比我头一回射得强多了。（顿了顿）来，我再教你。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "日头偏西，三人下马，在草场上坐下。李白从马背上解下一个酒囊，递过来。",
      "next": "n6a",
      "scene": "qizhao_s04"
    },
    "n6a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（李白喝了一口，递给杜甫）子美，你那些诗，我看了。（停了停）有一句，写得真好。",
      "next": "n7"
    },
    "n7": {
      "type": "choice",
      "npc": true,
      "question": "李白说杜甫有一句诗写得好。你想听哪一句？",
      "options": [
        {
          "text": "（问）哪一句？",
          "next": "n7a"
        },
        {
          "text": "（问杜甫）您自己觉得，哪一句最好？",
          "next": "n7b"
        }
      ]
    },
    "n7a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（李白想了想）\"放荡齐赵间，裘马颇清狂。\"（停了停）就这一句。（顿了顿）写出了这股劲儿。",
      "next": "n8"
    },
    "n7b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（杜甫想了想，摇头）说不上来。（停了停）写的时候觉得好，过些日子再看，又觉得不够。（顿了顿）太白兄说哪句好，那就是哪句好。",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "李白笑了笑，仰头又喝了一口酒，望着天边的晚霞。",
      "next": "n8a",
      "scene": "qizhao_s05"
    },
    "n8a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（杜甫望着李白，语气里掩不住的倾慕）太白兄的诗，豪气干云，飘然不群。（停了停）我追着学了好些年，也只学得几分皮毛。",
      "next": "n8b"
    },
    "n8b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（李白摆手）学我做什么。（停了停）你的诗，有你的路子。（顿了顿）我写的是天上，你写的是地上。各写各的。",
      "next": "n9"
    },
    "n9": {
      "type": "choice",
      "npc": true,
      "question": "李白说\"我写的是天上，你写的是地上\"。你想接什么？",
      "options": [
        {
          "text": "（问杜甫）这话，您怎么看？",
          "next": "n9a"
        },
        {
          "text": "（问李白）那您觉得，他的诗好在哪里？",
          "next": "n9b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n9c"
        }
      ]
    },
    "n9a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（杜甫想了想）天上，地上。（停了停）太白兄这话，说得准。（顿了顿）我这一路走来，看的都是地上的事。",
      "next": "n10"
    },
    "n9b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（李白想了想）他的诗，实。（停了停）看见什么写什么，不绕弯子。（顿了顿）这样的诗，难写。",
      "next": "n10"
    },
    "n9c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（两个人都不说话，望着天边的晚霞。风把草吹得沙沙响）",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "日暮时分，三人放慢了马。李白在前面哼着曲子，杜甫落在后头，忽然有些出神。",
      "next": "n10a",
      "scene": "qizhao_s06"
    },
    "n10a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他放慢马，忽然道）这一路纵马射猎、喝酒论诗，是我这辈子最快意的日子。（停了停）只是不知……这样的光景，往后还能有几回。",
      "next": "n11"
    },
    "n11": {
      "type": "choice",
      "npc": true,
      "question": "他忽然说\"不知这样的光景，往后还能有几回\"。你想接什么？",
      "options": [
        {
          "text": "（问）怎么忽然说这个？",
          "next": "n11a"
        },
        {
          "text": "（说）日子还长着呢。",
          "next": "n11b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n11c"
        }
      ]
    },
    "n11a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望着渐渐沉下去的夕阳，声音轻了下来）有时候人太快活了，反倒心里不安。（停了停）总觉得这样的好日子，怕是老天借来的，迟早要还回去。",
      "next": "n12"
    },
    "n11b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他笑了笑）但愿吧。（停了停）可我这人，总忍不住往坏处想。（顿了顿）想多了，就不敢太高兴。",
      "next": "n12"
    },
    "n11c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也没再说下去，只是望着天边，沉默了很久）",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "过了些日子，李白要往别处去了。三人在路口分别。",
      "next": "n12a",
      "scene": "qizhao_s07"
    },
    "n12a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（李白勒住马，回头拱手）子美，后会有期。（停了停）下回见面，再喝个痛快。",
      "next": "n12b"
    },
    "n12b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（杜甫也拱手，望着李白的背影，站了很久）",
      "next": "n13"
    },
    "n13": {
      "type": "aiFree",
      "prompt": "天宝三、四载间，你与杜甫在梁宋齐鲁一带遇见了他仰慕已久的李白。三人纵马射猎、喝酒论诗。李白说\"我写的是天上，你写的是地上\"。此刻李白刚走，杜甫还站在原地。你可以问他与李白同游的日子、对李白的倾慕、方才那句\"天上地上\"、以及往后的打算。",
      "hint": "你可以问：与李白怎么认识的、同游的日子、对李白的看法、\"天上地上\"那句话、往后的路……",
      "suggestions": [
        "和太白先生同游，是什么滋味？",
        "您真觉得自己的诗只算\"地上\"？",
        "太白先生走了，您打算去哪儿？"
      ],
      "scene": "qizhao",
      "minRounds": 1,
      "next": "n14"
    },
    "n14": {
      "type": "reflect",
      "lines": [
        "夕阳把三人的影子拉得很长，一直铺到天边。",
        "这大约是杜甫一生中最快意的几年——诗酒趁年华，名士相逢，纵马千里，天下仿佛都在脚下。",
        "他此刻还料不到，此后的岁月会急转直下。",
        "可也正是这段快意，成了他往后所有苦难里，一盏怎么也吹不灭的灯。"
      ],
      "next": "__end__"
    }
  }
};

quests['taishan'] = {
  "id": "taishan",
  "title": "泰山 · 望岳",
  "range": "约 736",
  "place": {
    "name": "泰山",
    "year": "约736年"
  },
  "scene": "taishan",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "洛阳落第之后，他没有留在榜下，转而北上漫游齐赵。这天，走到了一处山脚下。",
      "scene": "taishan",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "路是碎石铺的，一级一级向上，望不见尽头。日头正烈，你走得有些喘。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "前头石阶旁，杜甫正拄着一根竹杖歇脚，青衫的衣摆沾了尘土，却仰着头，直直望着山上，眼里有光。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "这便是有\"五岳之首\"之称的泰山了。山势横在齐鲁之间，远远望去，青苍绵延不尽。",
      "next": "n2a"
    },
    "n2a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（见你走近，擦一把汗，笑着招呼）你也来了。（停了停）这山我盼了许久。（顿了顿）今日既到山脚，不登上去，实在说不过去。",
      "next": "n3"
    },
    "n3": {
      "type": "choice",
      "npc": true,
      "question": "山道陡峭，日头毒辣。你看着眼前这高耸入云的泰山，作何打算？",
      "options": [
        {
          "text": "（一咬牙）登！来都来了。",
          "next": "n3a"
        },
        {
          "text": "（问）这山，爬上去要多久？",
          "next": "n3b"
        },
        {
          "text": "（望了望那望不到顶的台阶）",
          "actionOnly": true,
          "next": "n3c"
        }
      ]
    },
    "n3a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（朗声一笑）好！（停了停）登山最忌半途而废。（顿了顿）既决意登顶，你我便一道走，路上也好有个照应。",
      "next": "n4"
    },
    "n3b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他望了望山顶）听人说，这泰山石阶有七千余级，直通南天门。（停了停）爬得慢不要紧，一步步上去，总能到顶。",
      "next": "n4"
    },
    "n3c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他顺着你目光望去，反而来了兴致）高，才值得一登。（停了停）若是座土丘，一脚便到头，反倒没意思了。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "你们结伴而上。石阶年深日久，已被千万双脚磨得光滑，越往上，坡度越陡，风也越冷。",
      "next": "n4a",
      "scene": "taishan_s02"
    },
    "n4a": {
      "type": "narrate",
      "text": "两人走走停停，衣衫都被汗浸透了。他拄着竹杖，喘得厉害，可一步也没停。",
      "next": "n4b"
    },
    "n4b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（喘着气，回头冲你笑）这山，比我想的还硬。（停了停）不过，硬才好。（顿了顿）太软的山，登上去也没意思。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "半山处，他扶杖喘气，回头望下来路。",
      "next": "n5a",
      "scene": "taishan_s03"
    },
    "n5a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望着来路，忽然道）你瞧，才到半山，方才走过的路已经缩成一线。（停了停）原来人一旦往上走，脚下踩过的，就都成了身后的风景。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "半山处，他回头望着来路。你想说点什么？",
      "options": [
        {
          "text": "（问）往上走，累不累？",
          "next": "n6a"
        },
        {
          "text": "（问）这山，到底有什么好看的？",
          "next": "n6b"
        },
        {
          "text": "（也回头望了一眼）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他擦了把汗）累。（停了停）可累得痛快。（顿了顿）从前读书，累的是心。如今登山，累的是腿脚。（笑了笑）腿脚累了，心里反倒松快。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他想了想）不好看。（停了停）可站上去，看见的东西不一样。（顿了顿）山下看山，是山。山上往下看，就不一样了。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你也回头望，便指着山下）你看，那几间屋子，方才还那么大。（停了停）如今小得像个盒子。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "再往上，视野忽然开阔。山脊向两边铺开，青苍连绵，一直延伸到天边。",
      "next": "n7a",
      "scene": "taishan_s04"
    },
    "n7a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他站住，抬手一指）你且看！（停了停）泰山横跨齐鲁，青苍连绵，像是没有尽头。（顿了顿）这第一句，我有了——\"岱宗夫如何，齐鲁青未了。\"",
      "next": "n7_card"
    },
    "n7_card": {
      "type": "anchorCard",
      "anchor": "a6",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "越往上，山色愈奇，云雾开始缠绕在脚边。南坡向阳，北坡背阴，明暗之间，像被刀劈开。",
      "next": "n8a",
      "scene": "taishan_s05"
    },
    "n8a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他看得痴了，忽然道）造化把神秀都聚在了这里。（停了停）你看这山，南坡向阳，北坡背阴，明暗一线，如同把白昼和黄昏劈成了两半。（顿了顿）\"造化钟神秀，阴阳割昏晓\"——一个\"割\"字，是不是极险？",
      "next": "n9"
    },
    "n9": {
      "type": "choice",
      "npc": true,
      "question": "他说\"割\"字极险。你想接什么？",
      "options": [
        {
          "text": "（问）\"割\"字为何说它险？",
          "next": "n9a"
        },
        {
          "text": "（说）别人登山喊累，你登山倒吟起诗来。",
          "next": "n9b"
        },
        {
          "text": "（悄悄把这些句子记在心里）",
          "actionOnly": true,
          "next": "n9c"
        }
      ]
    },
    "n9a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他指着山脊）你想，山南向阳为晓，山北背阴为昏，一线之隔，便判若晨昏。（停了停）这\"割\"字一刀下去，把阴阳都分开了，岂不险、岂不奇？",
      "next": "n10"
    },
    "n9b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（笑）景与诗本是一回事。（停了停）心里没有这座山，腿再勤也写不出山的魂魄。（顿了顿）我累，山也给我句子，两相抵消。",
      "next": "n10"
    },
    "n9c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（回头冲你笑）记着也好。（停了停）这诗，我登一步便得一句，全是这山教我的。",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "越近山顶，路越难行。云雾浓得化不开，湿气沁透了衣裳。你们几乎是扶着石壁，一步步挪上去的。",
      "next": "n10a",
      "scene": "taishan_s06"
    },
    "n10a": {
      "type": "narrate",
      "text": "终于登顶。云气从山间涌起，涤荡胸襟；极目远眺，归鸟一只只，越飞越小，直没入天际。",
      "next": "n10b"
    },
    "n10b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他扶着山石，极目四望，声音因疲惫而微微发颤）\"荡胸生曾云，决眦入归鸟。\"（停了停）人到绝顶，才见天地之阔。",
      "next": "n10_card"
    },
    "n10_card": {
      "type": "anchorCard",
      "anchor": "a6",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "他站定，任山风灌满衣袖，深吸一口气。",
      "next": "n11a",
      "scene": "taishan_s07"
    },
    "n11a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他一字一句）\"会当凌绝顶，一览众山小。\"（停了停）今日我登的是泰山。（顿了顿）将来，我还要登更高的山。",
      "next": "n11b"
    },
    "n11b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他转过头，眼里亮得惊人）这天下，我偏要站到最高处，把它看得清清楚楚。",
      "next": "n11_card"
    },
    "n11_card": {
      "type": "anchorCard",
      "anchor": "a6",
      "next": "n12"
    },
    "n12": {
      "type": "choice",
      "npc": true,
      "question": "山顶上，他说\"要站到最高处\"。你想接什么？",
      "options": [
        {
          "text": "（问）站到最高处，然后呢？",
          "next": "n12a"
        },
        {
          "text": "（说）这话，我记下了。",
          "next": "n12b"
        },
        {
          "text": "（望着山下的天地，没说话）",
          "actionOnly": true,
          "next": "n12c"
        }
      ]
    },
    "n12a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）然后，把看见的都写下来。（停了停）这天下的山，天下的水，天下的人。（顿了顿）都写下来。",
      "next": "n13"
    },
    "n12b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他笑了一下）记下吧。（停了停）将来我要是忘了，你提醒我。",
      "next": "n13"
    },
    "n12c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他也沉默下来，两个人站在山顶，看着云从脚下流过）",
      "next": "n13"
    },
    "n13": {
      "type": "narrate",
      "text": "下山的时候，天已经有些暗了。他走得比上山快，竹杖点在石阶上，笃笃地响。",
      "next": "n13a",
      "scene": "taishan_s08"
    },
    "n13a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他忽然停下来，回头看了一眼山顶）今日这一趟，值了。（停了停）往后，还得再登几座山。",
      "next": "n14"
    },
    "n14": {
      "type": "aiFree",
      "prompt": "你与青年杜甫同登泰山，他一路吟成《望岳》，意气风发。他刚在绝顶说了\"会当凌绝顶，一览众山小\"，也说了\"要站到最高处\"。你可以问他诗里的字句、登山的感受、\"会当凌绝顶\"的由来、往后的打算。",
      "hint": "你可以问：《望岳》的写法、登山的感受、\"割\"字为什么险、\"会当凌绝顶\"是怎么想出来的、往后的路……",
      "suggestions": [
        "\"割\"字为何用得这样险？",
        "\"会当凌绝顶\"是怎么想出来的？",
        "站到最高处之后，您想做什么？"
      ],
      "scene": "taishan",
      "minRounds": 1,
      "next": "n15"
    },
    "n15": {
      "type": "reflect",
      "lines": [
        "下山时，我回头望了望那座山，它依旧沉默地立在天地间。",
        "他登一步，吟一句，把整座泰山一路读进了诗里。",
        "从\"岱宗夫如何\"，到\"一览众山小\"——",
        "那不是写给山的诗，是写给未来的自己的一封誓书。",
        "此刻的他，年轻，轻狂，以为天下的路都该这样一步一步往上走。",
        "他还不知道，命运的山路，远比这七千级石阶更难、更陡、更漫长。",
        "可正是这山顶上的一句\"会当凌绝顶\"，会在日后每一个至暗的时刻，一次次把他从泥泞里拽起来。"
      ],
      "next": "__end__"
    }
  }
};

quests['shouang'] = {
  "id": "shouang",
  "title": "洛阳 · 守丧与家变",
  "range": "约 741–745",
  "place": {
    "name": "洛阳",
    "year": "约741–745年"
  },
  "scene": "shouang",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "从泰山下来，他又在齐赵盘桓了些日子。那几年，他射猎、饮酒、写诗，肩上没有担子，脚下没有根。",
      "scene": "shouang",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "直到洛阳来了信：父亲病重。他连夜往回赶，还是没有赶上。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "你赶到洛阳杜家时，灵堂已经设起。他跪在最前面，身后是几个年幼的弟妹；最小的还不太明白发生了什么，只是跟着大人一起哭。",
      "next": "n2"
    },
    "n2": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（听见你在身后停下，他跪了很久，才低声开口）你来了。父亲走了。（停了停）这个家，往后得我来撑了。",
      "next": "n2a"
    },
    "n2a": {
      "type": "choice",
      "npc": true,
      "question": "他跪在灵前，身后是一群年幼的弟妹。你想说点什么？",
      "options": [
        {
          "text": "（问）家里，还有多少积蓄？",
          "next": "n2b"
        },
        {
          "text": "（沉默地陪他跪着）",
          "actionOnly": true,
          "next": "n2c"
        },
        {
          "text": "（问）往后，打算怎么办？",
          "next": "n2d"
        }
      ]
    },
    "n2b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他摇了摇头）不多。（停了停）父亲为官清廉，没留下什么。（顿了顿）往后的日子，怕是要紧着过了。",
      "next": "n3"
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也没有再开口。灵前的烛火晃了晃，映着他脸上还没干的泪痕）",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他沉默了一会儿）守丧。（停了停）按规矩，得守几年。（顿了顿）这几年，什么也做不了。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "守丧的几年，他住在洛阳。不能应举，不能出仕，只能守着。",
      "next": "n3a",
      "scene": "shouang_s02"
    },
    "n3a": {
      "type": "narrate",
      "text": "家里的积蓄一天天薄下去。他开始学着算计柴米，学着跟药铺讨价还价，学着把一顿饭分成两顿吃。",
      "next": "n4"
    },
    "n4": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他蹲在院子里熬药，见你来了，抬头笑了一下，但那笑里已经没有了泰山顶上的那种光）坐吧。（停了停）药味重，别嫌。",
      "next": "n4a"
    },
    "n4a": {
      "type": "choice",
      "npc": true,
      "question": "守丧期间，他在院子里熬药，整个人沉了下来。你想说点什么？",
      "options": [
        {
          "text": "（问）这几年，就一直这样？",
          "next": "n4b"
        },
        {
          "text": "（问）还在写诗吗？",
          "next": "n4c"
        },
        {
          "text": "（蹲下来，帮他看着火）",
          "actionOnly": true,
          "next": "n4d"
        }
      ]
    },
    "n4b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他搅着药罐）就这样。（停了停）从前觉得日子是过不完的，如今才知道，日子是要算着过的。",
      "next": "n5"
    },
    "n4c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他停下手里的活，想了想）写得少了。（停了停）心里有事的时候，诗就堵在喉咙口，出不来。",
      "next": "n5"
    },
    "n4d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你蹲下来，愣了一下，然后把扇子递给你）多谢。（停了停）火别太大，药熬干了就没了。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "守丧期满的那年，他三十四岁了。",
      "next": "n5a",
      "scene": "shouang_s03"
    },
    "n5a": {
      "type": "narrate",
      "text": "家里的日子越来越紧。弟妹们要吃饭，要穿衣，要有个去处。他不能再守着洛阳了。",
      "next": "n6"
    },
    "n6": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他把最后一点积蓄摊在桌上，一枚一枚数过）不够了。（停了停）再守下去，一家人都得饿肚子。",
      "next": "n6a"
    },
    "n6a": {
      "type": "choice",
      "npc": true,
      "question": "他把积蓄摊在桌上，说\"不够了\"。你想接什么？",
      "options": [
        {
          "text": "（问）那您打算去哪儿？",
          "next": "n6b"
        },
        {
          "text": "（问）就没有别的法子了吗？",
          "next": "n6c"
        },
        {
          "text": "（沉默地看着那些铜钱）",
          "actionOnly": true,
          "next": "n6d"
        }
      ]
    },
    "n6b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望着东边）长安。（停了停）父亲从前在奉天做过官，那边还有些旧交。（顿了顿）总得去试一试。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他摇头）想过了。（停了停）种地，我种不过庄稼人；做生意，又没有本钱。（顿了顿）除了读书写字，我什么也不会。",
      "next": "n7"
    },
    "n6d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己把铜钱收起来）这些，够路上用的。（停了停）剩下的，到了长安再说。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "临走那天，他起得很早。弟妹们还在睡，他没有叫醒他们。",
      "next": "n7a",
      "scene": "shouang_s04"
    },
    "n7a": {
      "type": "narrate",
      "text": "他站在院子里，回头看了一眼那几间屋子。几年前，他从这里出去漫游齐赵，肩上背的是书和弓。如今，背上只有一包旧衣裳。",
      "next": "n8"
    },
    "n8": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他走到门口，忽然停下来，对你说）从前在泰山顶上，我说要站到最高处。（停了停）如今才知道，先得站住脚，才谈得上站得高。",
      "next": "n8a"
    },
    "n8a": {
      "type": "choice",
      "npc": true,
      "question": "他站在门口，说\"先得站住脚\"。你想说点什么？",
      "options": [
        {
          "text": "（说）这话，不像是从前的您了。",
          "next": "n8b"
        },
        {
          "text": "（问）心里，还想着那座山吗？",
          "next": "n8c"
        },
        {
          "text": "（沉默地替他推开门）",
          "actionOnly": true,
          "next": "n8d"
        }
      ]
    },
    "n8b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他苦笑了一下）从前是从前。（停了停）人总得长大。（顿了顿）只是没想到，长大是这么回事。",
      "next": "n9"
    },
    "n8c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他沉默了一会儿）想。（停了停）可山在那儿，跑不了。（顿了顿）先得把眼前的日子过了。",
      "next": "n9"
    },
    "n8d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你推开门，点了点头，迈步出去。走到门外，又回头看了一眼院子）",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "往长安的路，他走得不快。不像是去求什么，倒像是去还一笔躲不掉的债。",
      "next": "n9a",
      "scene": "shouang_s05"
    },
    "n9a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他忽然开口）我有时候想。（停了停）要是父亲还在，我是不是还能再多走几年。（顿了顿）可这话，想了也没用。",
      "next": "n10"
    },
    "n10": {
      "type": "aiFree",
      "prompt": "你以故人的身份陪杜甫度过了父亲去世后的守丧岁月，不是他的亲属。守丧期满，家计窘迫，他不得不离开洛阳，往长安去谋生。他刚对你说完\"先得站住脚，才谈得上站得高\"。你可以问他守丧的日子、家里的境况、父亲的事、去长安的打算。",
      "hint": "你可以问：守丧这几年怎么过的、家里的弟妹、父亲留下的东西、去长安投奔谁、心里怕不怕……",
      "suggestions": [
        "守丧这几年，最难熬的是什么？",
        "父亲在世时，是什么样的人？",
        "去长安，有把握吗？"
      ],
      "scene": "shouang",
      "minRounds": 1,
      "next": "n11"
    },
    "n11": {
      "type": "reflect",
      "lines": [
        "他往长安去了。背影比从前沉了些，也慢了些。",
        "那个在泰山顶上说要\"一览众山小\"的青年，如今先要学会的是，怎么在一座城里站住脚。",
        "长安等着他的，不是山川，是人情。",
        "而他，还没有学会低头。"
      ],
      "next": "__end__"
    }
  }
};

quests['changan'] = {
  "id": "changan",
  "title": "长安 · 干谒",
  "range": "746–755",
  "place": {
    "name": "长安",
    "year": "746–755年"
  },
  "scene": "changan",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "长安城的一条深巷。高墙深院，车马辘辘，卷起一阵尘土。",
      "scene": "changan",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "巷口，一个中年人抱着一卷文稿，立在一扇朱漆府门前。他背脊微弓，鬓角已有了几缕白，却仍站得笔直。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "门开了，出来一个家仆，接过文稿，翻了翻，说了句什么，又进去了。门重新关上。",
      "next": "n2"
    },
    "n2": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他转过身，见是你，先是一怔，随即苦笑）是你。这么多年，难为你还能在这长安城里认出我来。",
      "next": "n2a"
    },
    "n2a": {
      "type": "choice",
      "npc": true,
      "question": "他抱着一卷文稿，站在一扇刚关上的门前。你想说点什么？",
      "options": [
        {
          "text": "（问）这是第几家了？",
          "next": "n2b"
        },
        {
          "text": "（看了看那扇紧闭的门）",
          "actionOnly": true,
          "next": "n2c"
        },
        {
          "text": "（接过他手里的文稿，替他抱着）",
          "actionOnly": true,
          "next": "n2d"
        }
      ]
    },
    "n2b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）记不清了。这条巷子，从东头到西头，我敲过的不下二十家。（顿了顿）有的收了我的诗，有的连门都不开。",
      "next": "n3"
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（顺着你的目光看了一眼）这扇门，算好的。至少还收了稿子。（停了停）虽然，也没下文。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（任你接过文稿，手上空了，反倒有些不自在）多谢。（顿了顿）这卷东西，我抱了这么些年了。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "他朝下一扇门走去。你跟在他身后，走过一条巷子，又拐进一条巷子。",
      "next": "n3a",
      "scene": "changan_s02"
    },
    "n3a": {
      "type": "narrate",
      "text": "第二扇门前，一个门房上下打量了他两眼，认出他来，脸上露出不耐烦的神色。",
      "next": "n3b"
    },
    "n3b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（门房说了句\"又是你\"，把门关上了。他退回来，声音很平）认得我了。（停了停）敲了太多次，门房都熟了。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "他站在门外，没再敲。街上有车马经过，扬起一阵尘土，落在他的肩头。",
      "next": "n4a"
    },
    "n4a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他低头看了看怀里的文稿）这长安的富贵，像隔着一层玻璃。看得见，摸不着。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "天色暗了。他领你穿过几条巷子，拐进一处破败的院落。院墙塌了一角，几间屋子，屋顶长着草。",
      "next": "n5a",
      "scene": "changan_s03"
    },
    "n5a": {
      "type": "narrate",
      "text": "推门进去，屋里很暗。妻子在灯下补衣服，孩子缩在角落里，盖着一床薄被。",
      "next": "n5b"
    },
    "n5b": {
      "type": "narrate",
      "text": "桌上摆着半碗冷粥，几根咸菜。他坐下来，拿起粥碗，又放下了。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "这就是他在长安的住处。你想说点什么？",
      "options": [
        {
          "text": "（问）这么些年，您就住在这儿？",
          "next": "n6a"
        },
        {
          "text": "（看了看那个缩在角落的孩子）",
          "actionOnly": true,
          "next": "n6b"
        },
        {
          "text": "（沉默地在他对面坐下）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）就住这儿。（停了停）长安的米贵，房子也贵。我这点名声，换不来几斗米。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（顺着你的目光看过去，声音低了些）孩子跟着我，没吃过几顿饱饭。（停了停）我这个做父亲的，对不住他们。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己开了口）这屋子，漏雨。（停了停）每逢下雨，盆盆罐罐都得摆出来接。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "他从怀里摸出另一卷纸，摊在桌上。上面是密密麻麻的字，有的划了，有的改了又改。",
      "next": "n7a",
      "scene": "changan_s04"
    },
    "n7a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（指着其中一首）这是我前几日写的，要送给一位贵人。（停了停）你听听——\"鹦鹉杯中美，凤凰池上归\"。",
      "next": "n7b"
    },
    "n7b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他把纸放下，苦笑）鹦鹉杯，凤凰池。多好听。（停了停）我从前写诗，是心里有话要说。如今写诗，是想着怎么让人家高兴。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "他指着那首违心的诗，声音里全是自嘲。你想说点什么？",
      "options": [
        {
          "text": "这样的诗，您写了多少？",
          "next": "n8a"
        },
        {
          "text": "（问）不写不行吗？",
          "next": "n8b"
        },
        {
          "text": "（看着那些划了又改的句子，没说话）",
          "actionOnly": true,
          "next": "n8c"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（想了想）记不清了。（停了停）这些年，我写了几百首。有几首，是为自己写的？",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（摇头）不行。（停了停）不写，门都进不去。进不去门，就没人举荐。没人举荐，就没有官做。没有官做，这一家人，就活不下去。",
      "next": "n9"
    },
    "n8c": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他见你不说话，反倒自己说了下去）这些句子，我每写一句，都像在自己心上划一刀。（停了停）可第二天，还得接着写。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "他把那卷纸推到一边，靠着墙，望着屋顶。",
      "next": "n9a",
      "scene": "changan_s05"
    },
    "n9a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（忽然道）这些年，我看清了一些事。（停了停）从前我以为，只要书读得好，诗写得好，总有出头之日。如今才知道，不是这样的。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（声音沉下来）这朝廷，要的不是贤才。（停了停）要的是听话的人，是能替他们把门面撑起来的人。你有才，他不怕；你不听话，他才怕。",
      "next": "n10"
    },
    "n10": {
      "type": "choice",
      "npc": true,
      "question": "他把话说到了这里。你想接什么？",
      "options": [
        {
          "text": "（问）有科举在，您为什么还要一家一家地干谒？",
          "next": "n10a"
        },
        {
          "text": "（问）这么些年，就没有一个肯用您的？",
          "next": "n10b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n10c"
        }
      ]
    },
    "n10a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他望着巷子尽头）常科取士，不只看卷子。考官要看你的名声，名声要靠人荐。（停了停）没人替你说话，文章写得再好，也是白搭。",
      "next": "n10a1"
    },
    "n10a1": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（声音沉下来）后来朝廷又开制举，我也去了。可那一科，权相一手遮了天，应举的人，一个也没取。（停了停）正路走不通，剩下的，就只有抱着这卷诗，一家一家地敲。",
      "next": "n10a2"
    },
    "n10a2": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他转过头看你）你说，这算不算逼上梁山。（停了停）我本不想走这条路。可正路走不通，人总得活下去。",
      "next": "n11"
    },
    "n10b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（想了想）有一个。（停了停）他看了我的诗，说我有才。可后来，他也没再提过。（苦笑）有才，跟用你，是两回事。",
      "next": "n11"
    },
    "n10c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他见你不说话，声音更低）我知道你在想什么。（停了停）我自己也想过。可我这人，就是不肯认这个命。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "第二天，你陪他出门。路过一座府邸，门里正摆着宴席，丝竹声、笑声、酒肉的香气，从门缝里飘出来。",
      "next": "n11a",
      "scene": "changan_s06"
    },
    "n11a": {
      "type": "narrate",
      "text": "拐过街角，墙根下围了一圈人。你挤过去看，是一个冻死的人，蜷在墙根下，身上盖着一张破席。",
      "next": "n11b"
    },
    "n11b": {
      "type": "narrate",
      "text": "旁边的人说，是个赶考的士子，盘缠花光了，没熬过这个冬天。",
      "next": "n12"
    },
    "n12": {
      "type": "choice",
      "npc": true,
      "question": "门里是酒肉，墙根下是冻死的人。你想做点什么？",
      "options": [
        {
          "text": "（蹲下去，把那张破席盖好）",
          "actionOnly": true,
          "next": "n12a"
        },
        {
          "text": "（问他）这样的人，长安多吗？",
          "next": "n12b"
        },
        {
          "text": "（站在他旁边，没说话）",
          "actionOnly": true,
          "next": "n12c"
        }
      ]
    },
    "n12a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他看着你盖席子，半晌才道）多谢。（停了停）我认得他。前几个月，还在这条街上见过，抱着一卷诗，跟人打听府门。",
      "next": "n13"
    },
    "n12b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（点头）多。（顿了顿）每年冬天，都有。有的冻死，有的饿死，有的病死。（停了停）死了，也没人记得名字。",
      "next": "n13"
    },
    "n12c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也沉默下来。风把那张破席掀起一角，他弯腰，替那人掖了掖）",
      "next": "n13"
    },
    "n13": {
      "type": "narrate",
      "text": "他站在墙根下，很久没动。风把他鬓角的白发吹起来。",
      "next": "n13a",
      "scene": "changan_s07"
    },
    "n13a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他忽然开口，声音不大，却一字一字咬得很清楚）这些年，我在长安，看见的是两样东西。（停了停）一样，是朱门里的酒肉；一样，是路边的冻死骨。",
      "next": "n13b"
    },
    "n13b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他转过身，望着那座府邸的方向）那里头的人，关心的只有自己的荣华。底下的人，是死是活，他们不知道，也不想知道。",
      "next": "n13c"
    },
    "n13c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他回过头，看着墙根下那个人）我写诗，从前是为了求官。（停了停）如今，我想为这个人写。为所有死了都没人记得名字的人写。",
      "next": "n13d"
    },
    "n13d": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他一字一句）\"朱门酒肉臭，路有冻死骨。\"（停了停）这十个字，我在心里放了很久了。今天，才算把它放下来。",
      "next": "n13_card"
    },
    "n13_card": {
      "type": "anchorCard",
      "anchor": "a8",
      "next": "n14"
    },
    "n14": {
      "type": "narrate",
      "text": "风一吹，酒肉的香气散了，巷子里只剩下一股冷。他把那卷文稿从怀里摸出来，翻了翻，又塞回去。",
      "next": "n14a"
    },
    "n14a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他拍了拍袖子上的土，对你道）这些年，就这么过去了。（停了停）我没什么可悔的。悔的是，白白让家人跟着我挨了这么多年的苦。",
      "next": "n15"
    },
    "n15": {
      "type": "narrate",
      "text": "他朝巷子深处走去。走了几步，忽然停下来，回头对你说。",
      "next": "n15a"
    },
    "n15a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（声音很平）明日制举放榜，你也去看看吧。（停了停）我想看看，这回，他们又打算怎么演。",
      "next": "n16"
    },
    "n16": {
      "type": "aiFree",
      "prompt": "你在长安的深巷里，陪着杜甫一扇门一扇门地干谒。这么些年了，他抱着文稿，敲过无数扇门。他刚对你说透这些年看清的东西——朱门里的酒肉，路边的冻死骨；也说了自己为什么不接着考。你可以问他这些年的日子、写过的违心诗、那个冻死的士子、科举的路为什么走不通。",
      "hint": "你可以问：干谒的规矩、这些年的日子、家里人的情况、常科与制举、那两句诗的来历、明日制举……",
      "suggestions": [
        "这些年，您靠什么过日子？",
        "常科落第，制举又落空，那还考吗？",
        "您说这朝廷要的不是贤才，那要的是什么？"
      ],
      "scene": "changan",
      "minRounds": 1,
      "next": "n17"
    },
    "n17": {
      "type": "reflect",
      "lines": [
        "他抱着文稿，转身没入车马扬起的尘土里。那扇门在他身后，依旧紧闭。",
        "你站在巷子里，听见门里传来丝竹声，还有一阵酒肉的香气。",
        "他走了几步，忽然停下来，回头对你说：明日制举放榜，你也去看看吧。",
        "说完，他抱着文稿，走进了另一条巷子。",
        "你望着他的背影，忽然想起他方才念的那两句诗——他今天，终于把它说完了。"
      ],
      "next": "__end__"
    }
  }
};

quests['yexian'] = {
  "id": "yexian",
  "title": "长安 · 野无遗贤",
  "range": "747",
  "place": {
    "name": "长安",
    "year": "747年"
  },
  "scene": "yexian",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "长安，日头正高。今日是朝廷设制举、广求贤才放榜的日子。",
      "scene": "yexian",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "你随着人流往贡院走。街上的人，神情各异。有人兴冲冲，有人脸色发白，有人一路走一路念叨着什么。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "可越往前走，听见的叹息声越多。有人站在街边，攥着文稿，一句话也说不出来。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "贡院前的榜墙下，围得水泄不通。你挤到前头，抬头一看——那张榜，是空的。",
      "next": "n2a",
      "scene": "yexian_s02"
    },
    "n2a": {
      "type": "narrate",
      "text": "一张白纸，从上到下，一个字也没有。风一吹，纸角掀起来，又落下去。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "人群炸开了锅。有人气得脸色铁青，当街破口大骂；有人像被抽空了力气，踉跄着靠在墙边。",
      "next": "n3a",
      "scene": "yexian_s03"
    },
    "n3a": {
      "type": "narrate",
      "text": "一个白发苍苍的老士子，捧着写了半辈子的诗文，站在人群中老泪纵横。他赶了一辈子考，等的就是这一次制举。",
      "next": "n3b"
    },
    "n3b": {
      "type": "narrate",
      "text": "旁边几个年轻士子，脸色一阵红一阵白，有人攥紧了拳头，有人转身就走，走了几步又站住，回头望着那张空榜，像是不敢相信。",
      "next": "n3c"
    },
    "n3c": {
      "type": "narrate",
      "text": "一个相识的士子愤愤地告诉你：这一科，满朝应举之人，竟无一人中选。原因只有一个——当朝宰相李林甫向皇帝上表，说天下贤才早已尽数入朝，已是\"野无遗贤\"了。",
      "next": "n4"
    },
    "n4": {
      "type": "choice",
      "npc": true,
      "question": "空榜下，人群炸开了锅。你想做点什么？",
      "options": [
        {
          "text": "（去扶那个老泪纵横的老士子）",
          "actionOnly": true,
          "next": "n4a"
        },
        {
          "text": "（在人群里找杜甫）",
          "actionOnly": true,
          "next": "n4b"
        },
        {
          "text": "（站着，看那张空榜）",
          "actionOnly": true,
          "next": "n4c"
        }
      ]
    },
    "n4a": {
      "type": "narrate",
      "text": "你扶住那老士子。他手里的诗文稿散了一地，你帮他一张张捡起来。他抓着你的手，反复念着一句话：我考了四十年。",
      "next": "n4d"
    },
    "n4b": {
      "type": "narrate",
      "text": "你挤过人群，看见杜甫站在榜墙最边上，一动不动。脸色一点点白了下去。",
      "next": "n5"
    },
    "n4c": {
      "type": "narrate",
      "text": "你站着，看那张空榜。风一吹，白纸掀起来，又落下去。旁边有人低声骂了一句，有人蹲在地上，把脸埋进手里。",
      "next": "n4d"
    },
    "n4d": {
      "type": "narrate",
      "text": "你回过头，看见杜甫站在榜墙最边上，一动不动。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "他没有像旁人那样叫骂，也没有流泪，只是死死盯着那空无一人的榜墙，像要把\"野无遗贤\"四个字，一个字一个字地吞进去。",
      "next": "n5a",
      "scene": "yexian_s04"
    },
    "n5a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（喃喃）\"野无遗贤\"……好一个野无遗贤。（停了停）原来我等十年苦读，竟抵不过权相一句话。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "他被这突如其来的结果击中了。你想说点什么？",
      "options": [
        {
          "text": "这一科，本就不是为求贤才。",
          "next": "n6a"
        },
        {
          "text": "（陪他一起沉默）",
          "actionOnly": true,
          "next": "n6b"
        },
        {
          "text": "你打算怎么办？",
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（苦笑）你倒看得明白。这哪里是求贤，分明是一场戏。（顿了顿）戏台子搭得好看，台下却早已定好了结果。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（良久，才低声道）从前落第，我只怪自己学艺不精。今日才明白，有些路，本就不是给寒门走的。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（摇头）我还能怎么办。十年了，我原以为只要诚心诚意，总能等来一个公道。（停了停）今日才知道，这公道的秤，早被人挪了砝码。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "那个白发老士子还蹲在墙根下，一张一张捡他的诗稿。风把纸吹散，他又一张一张去追。",
      "next": "n7a",
      "scene": "yexian_s05"
    },
    "n7a": {
      "type": "narrate",
      "text": "杜甫走过去，蹲下来，帮他一起捡。捡完了，老士子抱着那卷诗稿，忽然放声大哭。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "老士子抱着诗稿放声大哭。你想做点什么？",
      "options": [
        {
          "text": "（走过去，也蹲下来）",
          "actionOnly": true,
          "next": "n8a"
        },
        {
          "text": "（站在一旁，看着他们）",
          "actionOnly": true,
          "next": "n8b"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你过来，声音很低）他考了四十年。（停了停）从年轻考到白头，就等这一次。",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他拍了拍老士子的肩，回头对你道）四十年。（停了停）一个人一辈子，能有几个四十年。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "老士子被家人搀走了。杜甫站起来，望着那张空榜，很久没说话。",
      "next": "n9a",
      "scene": "yexian_s06"
    },
    "n9a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他忽然开口，声音不大，却一字一字咬得很清楚）你知道\"野无遗贤\"这四个字，最狠的地方在哪里吗。（停了停）不是它假。是它假得理直气壮。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他转过身，望着贡院的方向）李林甫上了一道表，说天下贤才已经尽数入朝，民间一个都没落下。（停了停）皇帝信了。满朝文武，没一个人敢说个不字。",
      "next": "n9c"
    },
    "n9c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（声音沉下去）这一榜，不是没取人。是根本不想取。（停了停）他们要的就是一张空榜，好拿去给天下人看：瞧，贤才都在朝里了，你们这些人，就别再妄想了。",
      "next": "n10"
    },
    "n10": {
      "type": "choice",
      "npc": true,
      "question": "他把这场闹剧说透了。你想接什么？",
      "options": [
        {
          "text": "（问）这天下，就没人看得出来？",
          "next": "n10a"
        },
        {
          "text": "（问）那读书人，还有路可走吗？",
          "next": "n10b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n10c"
        }
      ]
    },
    "n10a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（苦笑）看得出来的人，多了。（停了停）可看出来，又怎么样。说真话的，贬的贬，杀的杀。剩下的，都学会了闭嘴。",
      "next": "n11"
    },
    "n10b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他沉默了很久）路？从前我以为，读书、应举、做官，是一条路。（停了停）今日才知道，这条路，早就被人堵死了。",
      "next": "n11"
    },
    "n10c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）我今年三十五了。（停了停）考了这么多年，敲了这么多门，到头来，连一张榜都换不来。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "人群渐渐散了。空榜还挂在那儿，白得刺眼。",
      "next": "n11a",
      "scene": "yexian_s07"
    },
    "n11a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他望着那张空榜，忽然道）可我不能就这么算了。（停了停）他们能堵住我的路，堵不住我的笔。",
      "next": "n11b"
    },
    "n11b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他转过头，看着你）这长安城里，有朱门里的酒肉，有路边的冻死骨；有像那老士子一样考了一辈子的人，也有像李林甫一样一手遮天的人。（停了停）这些，总得有人写下来。",
      "next": "n11c"
    },
    "n11c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他一字一句）\"纨绔不饿死，儒冠多误身。\"（停了停）这话，我从前不敢说。今日，我说了。",
      "next": "n11_card"
    },
    "n11_card": {
      "type": "anchorCard",
      "anchor": "a9",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "他把文稿卷起来，塞进袖子里。风把空榜吹得哗哗响。",
      "next": "n12a"
    },
    "n12a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他拍了拍袖子，对你道）我想回奉先看看家人。（停了停）这些年，他们在奉先，我在长安，聚少离多。",
      "next": "n13"
    },
    "n13": {
      "type": "aiFree",
      "prompt": "你与杜甫在长安，经历了\"野无遗贤\"的制举闹剧。他十年干谒、一朝梦碎，刚对你说透了这场闹剧的底细，也第一次说出了\"纨绔不饿死，儒冠多误身\"这样的话。你可以问他此刻的心境、对李林甫的看法、那个考了四十年的老士子、以及对未来的打算。",
      "hint": "你可以问：野无遗贤的真相、李林甫的专权、那个老士子、他为什么想回奉先、往后的路……",
      "suggestions": [
        "那个考了四十年的老士子，后来怎么样了？",
        "您说\"儒冠多误身\"，是后悔读书了吗？",
        "回奉先，是打算不回来了吗？"
      ],
      "scene": "yexian",
      "minRounds": 1,
      "next": "n14"
    },
    "n14": {
      "type": "reflect",
      "lines": [
        "他转身走进人群，背影被正午的日头拉得很长。",
        "空榜还挂在那儿，风一吹，白纸掀起来，又落下去。",
        "那个白发老士子还蹲在墙根下，一张一张捡他的诗稿。",
        "杜甫走过去，帮他捡了几张，拍了拍他的肩。",
        "然后他把自己的文稿卷起来，塞进袖子里，对你说：我想回奉先看看家人。",
        "说完，他朝城门口走去，没再回头。"
      ],
      "next": "__end__"
    }
  }
};

quests['fengxian'] = {
  "id": "fengxian",
  "title": "奉先 · 幼子夭折",
  "range": "755 冬",
  "place": {
    "name": "奉先县",
    "year": "755年冬"
  },
  "scene": "fengxian",
  "start": "n0",
  "nodes": {
    "n0": {
      "type": "narrate",
      "text": "野无遗贤那一榜之后，又过去了好几年。",
      "scene": "fengxian",
      "next": "n0a"
    },
    "n0a": {
      "type": "narrate",
      "text": "这些年里，杜甫还在长安，还是抱着那卷文稿，一家一家地敲。头发白得更多了，背也驼了一些。",
      "next": "n0b"
    },
    "n0b": {
      "type": "narrate",
      "text": "直到这年十月，吏部终于下来一纸文书：右卫率府兵曹参军，正八品下，管兵甲器杖、门禁锁钥。芝麻大的官，可总算有个官身了。",
      "next": "n0c"
    },
    "n0c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他把文书塞进怀里，苦笑）等了这么些年，等来这么个官。（停了停）不过，总得回去告诉他们一声。",
      "next": "n1"
    },
    "n1": {
      "type": "narrate",
      "text": "奉先县，一条土路上。天寒地冻，北风如刀，割得人脸生疼。",
      "next": "n1a",
      "scene": "fengxian"
    },
    "n1a": {
      "type": "narrate",
      "text": "远处隐隐传来一阵哭声。你循声走去，是一户人家的院子。柴门半掩。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "堂屋里很暗。杜甫跪坐在地，怀里抱着一个再也不会醒来的孩子。那孩子不过几个月大，小小的脸已经没了血色。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "屋子里静得可怕。只有风从门缝里钻进来，呜呜地响。",
      "next": "n2a",
      "scene": "fengxian_s02"
    },
    "n2a": {
      "type": "narrate",
      "text": "他像是老了十岁，眼窝深陷，就那样一动不动地抱着孩子，许久许久。",
      "next": "n3"
    },
    "n3": {
      "type": "choice",
      "npc": true,
      "question": "屋子里太静了。你想做点什么？",
      "options": [
        {
          "text": "（走过去，在他旁边蹲下）",
          "actionOnly": true,
          "next": "n3a"
        },
        {
          "text": "（去把柴门掩上，挡住风）",
          "actionOnly": true,
          "next": "n3b"
        },
        {
          "text": "（站在门口，没有进去）",
          "actionOnly": true,
          "next": "n3c"
        }
      ]
    },
    "n3a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他抬起头，见是你，声音沙哑得几乎听不清）你来了。（停了停）我一路从长安赶回，就为了见他们一面。可到底，还是晚了一步。",
      "next": "n4"
    },
    "n3b": {
      "type": "narrate",
      "text": "你把柴门掩上，风小了些。屋里还是冷，可比方才好一点。",
      "next": "n3d"
    },
    "n3c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他没回头，却像是知道你在门口）进来吧。（停了停）外头冷。",
      "next": "n4"
    },
    "n3d": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他听见门响，抬起头）多谢。（停了停）这屋子，风一吹就透。孩子……孩子就是在这个屋里走的。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "他把孩子轻轻放回榻上，动作轻得像怕惊醒一个梦。然后用手，一点点抹去孩子额上并不存在的灰尘。",
      "next": "n4a",
      "scene": "fengxian_s03"
    },
    "n4a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他望着孩子，声音很低）我这一路，走得太久了。从长安到奉先，几百里路，我恨不得插上翅膀飞回来。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "他站起身，走到窗边。窗纸破了个洞，风从那儿灌进来。",
      "next": "n5a",
      "scene": "fengxian_s04"
    },
    "n5a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（望着窗外）你可知我这一路，看见的是什么。（停了停）富贵人家的朱门里，酒肉多得发了臭；可路边的冻死骨，一具连着一具。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "他说着一路的所见。你想接什么？",
      "options": [
        {
          "text": "（问）您在路上，就想到了这两句？",
          "next": "n6a"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n6b"
        },
        {
          "text": "（看了看榻上的孩子）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（点头）想了一路。（停了停）可那时候还只是愤懑。如今……如今是拿这孩子的命，才看透的。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你不说话，声音更低）我自己的孩子，就这么活活饿死在回家的路上。而那些人，还在朱门里饮酒作乐。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他顺着你的目光看向榻上，喉头动了动）他连一口饱饭都没吃过几顿。（停了停）我求官求了这么多年，求到孩子饿死。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "他忽然转过身，走到墙角，蹲下去翻一个旧包袱。包袱里是几件破衣裳，还有一卷卷的诗稿。",
      "next": "n7a",
      "scene": "fengxian_s05"
    },
    "n7a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他翻着那些诗稿，声音很低）这么些年，我在长安敲了多少门，写了多少违心的诗。（停了停）我总想着，再熬一熬，总能熬出头。熬出头了，就能把他们接过去，过几天好日子。",
      "next": "n7b"
    },
    "n7b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他攥着一卷诗稿，手在发抖）可我没熬出头。（停了停）孩子先没了。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "他攥着诗稿，手在发抖。你想说点什么？",
      "options": [
        {
          "text": "（问）这么些年，家里就靠您一个人？",
          "next": "n8a"
        },
        {
          "text": "（问）您后悔去长安吗？",
          "next": "n8b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n8c"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（点头）靠我。（停了停）我在长安，他们在奉先。我寄回来的钱，时有时无。（顿了顿）有时候几个月寄不回去一次，他们就得靠亲戚接济。",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（沉默了很久）悔。（停了停）可悔的不是去长安。悔的是，我明知道这条路难走，还让他们跟着我熬。",
      "next": "n9"
    },
    "n8c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）我在长安，夜里睡不着的时候，就想他们。（停了停）想孩子长高了没有，想妻子手上的冻疮好了没有。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "他把诗稿放回包袱里，站起身，走到榻边，又看了孩子一眼。",
      "next": "n9a",
      "scene": "fengxian_s06"
    },
    "n9a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他忽然开口，声音不大，却一字一字咬得很清楚）我从前以为，读书人做官，是为了致君尧舜。（停了停）如今才知道，我连自己的孩子都保不住，还谈什么致君尧舜。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他转过身，望着窗外）这一路，我看见朱门里的酒肉，也看见路边的冻死骨。（停了停）我原以为，那是别人的命。今日才知道，那也是我的命。",
      "next": "n9c"
    },
    "n9c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他回过头，看着你）我求了这么多年官，求到孩子饿死。（停了停）这世道，到底是怎么了。",
      "next": "n10"
    },
    "n10": {
      "type": "choice",
      "npc": true,
      "question": "他问\"这世道到底是怎么了\"。你想接什么？",
      "options": [
        {
          "text": "（问）您恨吗？",
          "next": "n10a"
        },
        {
          "text": "（问）那往后，还求官吗？",
          "next": "n10b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n10c"
        }
      ]
    },
    "n10a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他沉默了很久）恨。（停了停）可恨完了，还得往下走。（顿了顿）我还有妻子，还有别的孩子。",
      "next": "n11"
    },
    "n10b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（摇头）不知道。（停了停）从前求官，是为了光耀门楣。如今……如今我不知道，这条路还值不值得走。",
      "next": "n11"
    },
    "n10c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他见你不说话，声音更低）我知道你在想什么。（停了停）我自己也想过。可这世道，不是我想不通，就能不过下去的。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "他转过身，面朝窗外，肩膀微微发颤。",
      "next": "n11a",
      "scene": "fengxian_s07"
    },
    "n11a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他一字一句，像是从牙缝里挤出来）\"朱门酒肉臭，路有冻死骨。\"（停了停）这十个字，是我用这孩子的命，才看透的。",
      "next": "n11_card"
    },
    "n11_card": {
      "type": "anchorCard",
      "anchor": "a8",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "北风呼啸着灌进堂屋，卷起地上散落的几页诗稿。有一页飘到你的脚边，上面墨迹未干。",
      "next": "n12a",
      "scene": "fengxian_s08"
    },
    "n12a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他背对着你，望着窗外的风雪，声音却出奇地平静）从今往后，我不只为自己而写，也不只为求官而写。（停了停）我要为这天下千千万万个像他一样的孩子，写。",
      "next": "n13"
    },
    "n13": {
      "type": "aiFree",
      "prompt": "你与杜甫在奉先县的家中，他的幼子刚刚饿死。他刚得了右卫率府兵曹参军这个芝麻小官，带着消息赶回，却只赶上孩子的死。他从长安一路所见朱门酒肉与路边冻骨。你可以问他此刻的心境、这一路的所见、对孩子的愧疚、求官的悔意、以及那两句诗的来历。",
      "hint": "你可以问：孩子的事、一路的所见、刚得的官职、对求官的悔意、\"朱门酒肉臭\"的来历……",
      "suggestions": [
        "这一路，您还看见了什么？",
        "刚得的官，还想做下去吗？",
        "\"朱门酒肉臭\"这两句，写完了吗？"
      ],
      "scene": "fengxian",
      "minRounds": 1,
      "next": "n14"
    },
    "n14": {
      "type": "reflect",
      "lines": [
        "北风卷着哭声，把寒意灌满了整座院子。",
        "他把诗稿收好，又去榻边看了孩子一眼。",
        "然后他对你说：我得回长安去。朝廷那边，怕是还不知道这边的事。",
        "你送他到村口。他往北走了几步，忽然停下来，回头望了望那间屋子。",
        "风把他的衣角吹起来，他站了一会儿，转过身，走进了风雪里。",
        "你站在村口，看着他的背影越来越小。风灌进领子里，冷得人缩了缩脖子。"
      ],
      "next": "__end__"
    }
  }
};

quests['changan_xian'] = {
  "id": "changan_xian",
  "title": "长安 · 陷贼",
  "range": "756–757",
  "place": {
    "name": "长安",
    "year": "756–757年"
  },
  "scene": "changan_xian",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "奉先那个冬天之后，他回了长安。再相遇时，你看见他照旧去衙门当值，像是把那场丧子之痛压进了心底。",
      "scene": "changan_xian",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "你们没有多谈那个冬天。日子表面平淡下来，他仍看管兵甲器杖、门禁锁钥，只是话比从前少了。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "可这平淡没过多久。消息传来：安禄山在范阳起兵，一路南下，破了洛阳。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "接着是潼关。潼关一破，天子连夜出了长安，往西去了。第二天早上，满城的人还在等消息，叛军已经进了城。",
      "next": "n2a",
      "scene": "changan_xian_s02"
    },
    "n2a": {
      "type": "narrate",
      "text": "城墙残破，烟火未熄，街巷里满是断壁残垣。几片烧焦的旌旗，在风里无力地翻动。",
      "next": "n2b"
    },
    "n2b": {
      "type": "narrate",
      "text": "远处有胡人的骑兵呼啸而过，马蹄声如闷雷。你躲进一条巷子，贴着墙根走。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "拐过街角，你看见一队人被叛军押着走过。队伍里有个熟悉的身影，正低着头，被推着往前走。",
      "next": "n3a",
      "scene": "changan_xian_s03"
    },
    "n3a": {
      "type": "narrate",
      "text": "他神情憔悴，青衫上沾满尘土，脸上还有几道被押解时蹭出的血痕。可他的背，还直着。",
      "next": "n3b"
    },
    "n3b": {
      "type": "narrate",
      "text": "他走得很慢，脚上那双麻鞋已经磨穿了底，一步一步，踩在碎砖上。你认出他了——是杜甫。",
      "next": "n4"
    },
    "n4": {
      "type": "choice",
      "npc": true,
      "question": "他被叛军押着，正从你藏身的巷口走过。你想怎么做？",
      "options": [
        {
          "text": "（冒险探出身，叫住他）",
          "actionOnly": true,
          "next": "n4a"
        },
        {
          "text": "（等他走过，悄悄跟在队伍后面）",
          "actionOnly": true,
          "next": "n4b"
        },
        {
          "text": "（躲在墙后，看着队伍过去）",
          "actionOnly": true,
          "next": "n4c"
        }
      ]
    },
    "n4a": {
      "type": "narrate",
      "text": "你探出身，低低叫了一声。他猛地抬头，看见你，脸色一变，飞快地摇了摇头。",
      "next": "n5"
    },
    "n4b": {
      "type": "narrate",
      "text": "你悄悄跟在队伍后面，一直跟到一处废弃的院落。叛军把他们赶进去，锁上了门。",
      "next": "n5"
    },
    "n4c": {
      "type": "narrate",
      "text": "队伍走远了。你从墙后出来，远远看见他被推进一处废弃的院落，门从外头锁上。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "夜里，你摸到那处院落外。墙不高，他从墙里探出头来，压低声音。",
      "next": "n5a",
      "scene": "changan_xian_s04"
    },
    "n5a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（低声）你怎么来了。快走，别让叛军看见。（停了停）我……已经走不掉了。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "他让你走。你想说点什么？",
      "options": [
        {
          "text": "我不走，我陪着你。",
          "next": "n6a"
        },
        {
          "text": "（问）他们……会把你怎样？",
          "next": "n6b"
        },
        {
          "text": "（望着满目疮痍的长安，说不出话）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（摇头）胡闹。这城眼看要陷进更深的乱子里，你留下，不过多一个人遭难。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（低声道）他们一时不会杀我。我只是个无足轻重的小官。（停了停）可这身不由己的滋味，比死还难受。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（顺着你的目光望去，声音发颤）去年今日，这里还是车水马龙的太平长安。谁能想到，一夜之间，就变成了这副模样。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "他靠在墙头，望着远处残破的城楼。月光下，城墙上还挂着半面烧焦的旗。",
      "next": "n7a",
      "scene": "changan_xian_s05"
    },
    "n7a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（声音很低）城破那天，我本想着往北走，去投奔新天子。（停了停）走到半路，被叛军截住了。",
      "next": "n7b"
    },
    "n7b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他望着城楼）他们看我官小，没杀我，把我押回了城里。（停了停）跟我一起被押的，有的被拉去做苦役，有的被打了，关起来。",
      "next": "n7c"
    },
    "n7c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他低下头）我这点官身，这时候倒成了累赘。（停了停）要是当初没得这个官，说不定还能混在百姓里，逃出去。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "他把陷贼的经过说了一遍。你想接什么？",
      "options": [
        {
          "text": "（问）这城里，还剩下什么？",
          "next": "n8a"
        },
        {
          "text": "（问）您的家人呢？",
          "next": "n8b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n8c"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他往城里望了望）剩下的，是空房子，是烧了一半的铺子，是满街没人收的尸首。（停了停）还有我们这些走不掉的人。",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他的声音更低）在鄜州。（停了停）战乱一起，一家人天各一方。我连他们是死是活，都不知道。",
      "next": "n9"
    },
    "n8c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）这城里，每天都有饿死的人。（停了停）我比他们，也就多一口气。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "第二天天没亮，他从院里被放出来做苦役。你远远跟着他，走过朱雀大街。",
      "next": "n9a",
      "scene": "changan_xian_s06"
    },
    "n9a": {
      "type": "narrate",
      "text": "街两边的房子烧了大半，可城外的终南山还在，远远的，青蒙蒙一片。春天到了，废墟上长出草来，长得齐腰深，没人打理。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他停下脚步，望着那片草）\"国破山河在，城春草木深。\"（停了停）山河还是那个山河，可这国，已经破了。春天照样来，草木照样长，只是没人管了。",
      "next": "n9_card"
    },
    "n9_card": {
      "type": "anchorCard",
      "anchor": "a10",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "路边有一丛野花，从断墙根下钻出来，开得正盛。一只鸟落在墙头，叫了两声，又飞走了。",
      "next": "n10a",
      "scene": "changan_xian_s07"
    },
    "n10a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他望着那丛花，忽然道）\"感时花溅泪，恨别鸟惊心。\"（停了停）从前看花是花，听鸟是鸟。如今看见花开，心里发酸；听见鸟叫，心里发惊。",
      "next": "n10b"
    },
    "n10b": {
      "type": "narrate",
      "text": "他说完，低下头，快步走了。押送的叛军回头瞪了他一眼。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "夜里，他回到那处院落。你隔着墙，听见他在里头低声说话。",
      "next": "n11a",
      "scene": "changan_xian_s08"
    },
    "n11a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（声音很低）我托人往鄜州捎过信。（停了停）捎信的人走到半路，就被叛军截了。信没了，人也不知道怎么样了。",
      "next": "n11b"
    },
    "n11b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他靠在墙头，望着北边）\"烽火连三月，家书抵万金。\"（停了停）如今一封家书，比万两黄金还贵。可我连一封，都收不到。",
      "next": "n12"
    },
    "n12": {
      "type": "choice",
      "npc": true,
      "question": "他念着家书，声音越来越低。你想说点什么？",
      "options": [
        {
          "text": "（问）您最想知道的，是什么？",
          "next": "n12a"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n12b"
        },
        {
          "text": "（问）那您打算怎么办？",
          "next": "n12c"
        }
      ]
    },
    "n12a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（想了很久）想知道他们还活着。（停了停）别的，不敢想。",
      "next": "n13"
    },
    "n12b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你不说话，声音更低）夜里睡不着的时候，我就想他们。（停了停）想孩子长高了没有，想妻子手上的冻疮好了没有。",
      "next": "n13"
    },
    "n12c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他握紧墙头）我得逃出去。（停了停）去投奔新天子，去寻一条能报国尽忠的路。",
      "next": "n13"
    },
    "n13": {
      "type": "narrate",
      "text": "几天后的一个夜里，他忽然从墙头探出身来，声音比往常急。",
      "next": "n13a",
      "scene": "changan_xian_s09"
    },
    "n13a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（低声）我打算走了。（停了停）再过几日，看管会松一些。到时候我翻墙出去，往西走。",
      "next": "n13b"
    },
    "n13b": {
      "type": "narrate",
      "text": "他说着，抬手挠了挠头。月光下，你看见他的头发，白的多，黑的少了。",
      "next": "n13c"
    },
    "n13c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（自嘲地笑了一下）\"白头搔更短，浑欲不胜簪。\"（停了停）这头发，怕是连簪子都插不住了。",
      "next": "n13d"
    },
    "n13d": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他忽然握住你的手）我走之后，你替我往鄜州捎个信。（停了停）就说，我还活着。",
      "next": "n13_card"
    },
    "n13_card": {
      "type": "anchorCard",
      "anchor": "a10",
      "next": "n14"
    },
    "n14": {
      "type": "narrate",
      "text": "他说完，松开手，翻过墙头，消失在夜色里。",
      "next": "n14a"
    },
    "n14a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（远远传来一句，很低）若我活着到了那边，他日相见，我再把一路的事，讲给你听。",
      "next": "n15"
    },
    "n15": {
      "type": "aiFree",
      "prompt": "你与杜甫在陷落的长安城中相遇。安禄山起兵、潼关失守、天子西逃，长安陷落。杜甫在投奔新天子的路上被叛军截住，押回城中。他刚在夜里翻墙逃走，临行前嘱你往鄜州捎信。你可以问他陷贼的处境、对妻儿的牵挂、《春望》的写作、逃亡的打算。",
      "hint": "你可以问：长安怎么破的、他被押的经过、鄜州的家人、《春望》的句子、逃亡的路……",
      "suggestions": [
        "长安城破的时候，是什么样子？",
        "您最牵挂的，是鄜州的什么人？",
        "\"家书抵万金\"，您多久没收到信了？"
      ],
      "scene": "changan_xian",
      "minRounds": 1,
      "next": "n16"
    },
    "n16": {
      "type": "reflect",
      "lines": [
        "他翻过墙头，脚步声越来越远，最后听不见了。",
        "你站在墙外，听见城里远远传来几声马蹄，又静下去。",
        "第二天，院子里空了。叛军骂了几句，也没再追。",
        "你往北走，怀里揣着那句\"我还活着\"，不知道能不能捎到鄜州。",
        "路上听人说，西边凤翔那边，新天子正在招集人马。"
      ],
      "next": "__end__"
    }
  }
};

quests['fengxiang'] = {
  "id": "fengxiang",
  "title": "凤翔 · 麻鞋见天子",
  "range": "757",
  "place": {
    "name": "凤翔",
    "year": "757年"
  },
  "scene": "fengxiang",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "凤翔，新天子驻跸的行宫外。进出的都是神色匆匆、身着官袍的人。",
      "scene": "fengxiang",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "宫门外，一个衣衫褴褛的人正踉跄着朝这边走来。他瘦得脱了形，头发蓬乱，脸上还有没好的划伤。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "他脚上那双麻鞋，鞋底已经磨穿了，脚趾头露在外面，沾着泥和血。一步一步，踩在宫门前的青石上。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "你迎上去。他看见你，先是一愣，随即疲惫地笑了。",
      "next": "n2a",
      "scene": "fengxiang_s02"
    },
    "n2a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（笑里带着劫后余生的庆幸）是你……我逃出来了。（停了停）一路钻山沟、穿荆棘，草鞋都磨烂了，就剩这双麻鞋，总算活着走到了这里。",
      "next": "n3"
    },
    "n3": {
      "type": "choice",
      "npc": true,
      "question": "他真的逃出来了。你心里既惊又喜。想说点什么？",
      "options": [
        {
          "text": "这一路，太不容易了。",
          "next": "n3a"
        },
        {
          "text": "（看着他脚上磨烂的麻鞋，鼻尖发酸）",
          "actionOnly": true,
          "next": "n3b"
        },
        {
          "text": "（问）你见到天子了吗？",
          "next": "n3c"
        }
      ]
    },
    "n3a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他低头看看自己，苦笑）好几次，我都以为自己走不出来了。（停了停）山高路险，后面还有追兵，可一想到家国未复，我这条命就不能交代在路上。",
      "next": "n4"
    },
    "n3b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他顺着你的目光，看向自己那双麻鞋，反倒笑了）丑是丑了点。（停了停）可就是这双麻鞋，一步一个血印，把我从长安驮到了这里。它比什么锦靴都值钱。",
      "next": "n4"
    },
    "n3c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他眼里亮了起来）见到了。（停了停）天子感念我一片忠心，授了我一个左拾遗。你可知这官是做什么的？劝谏天子、匡正朝政——正是我半生所求。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "他低头看了看自己那身破衣裳，抬手理了理衣领，又拍了拍袖子上的土。袖子早就磨破了，一截胳膊露在外面。",
      "next": "n4a",
      "scene": "fengxiang_s03"
    },
    "n4a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（自嘲地笑了一下）这身样子，去见天子，实在不成体统。（停了停）可实在没别的衣裳了。",
      "next": "n5"
    },
    "n5": {
      "type": "choice",
      "npc": true,
      "question": "他理着那身破衣裳，有些局促。你想说点什么？",
      "options": [
        {
          "text": "（替他拍了拍背上的土）",
          "actionOnly": true,
          "next": "n5a"
        },
        {
          "text": "（问）就这样进去，行吗？",
          "next": "n5b"
        }
      ]
    },
    "n5a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他任你拍土，站直了些）多谢。（停了停）这些年，还没人替我拍过衣裳。",
      "next": "n6"
    },
    "n5b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他看了看宫门）行不行，都得进。（停了停）我逃了这么远，不是为了站在门外头。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "他朝宫门走去。麻鞋踩在青石上，一步一响。走到门口，守卫拦住他，上下打量了一番，进去通报了。",
      "next": "n6a",
      "scene": "fengxiang_s04"
    },
    "n6a": {
      "type": "narrate",
      "text": "过了好一会儿，守卫出来，领他进去。你站在门外，看着他的背影消失在宫门里。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "宫门里，他跪下去行礼。膝盖磕在石阶上，疼得他愣了一下。",
      "next": "n7a",
      "scene": "fengxiang_s05"
    },
    "n7a": {
      "type": "narrate",
      "text": "他抬起头，看见御座上的天子，忽然有些恍惚。这一路钻山沟、穿荆棘、被叛军追着跑，原以为活不到今天。",
      "next": "n7b"
    },
    "n7b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他低声，像是自言自语）\"麻鞋见天子，衣袖露两肘。\"（停了停）原来我这条命，还真走到了这里。",
      "next": "n7_card"
    },
    "n7_card": {
      "type": "anchorCard",
      "anchor": "a12",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "天子问了他几句话，他一一答了。问到一路的见闻，他答得很细，连路边饿死的人、被抓丁的百姓都说了。",
      "next": "n8a",
      "scene": "fengxiang_s06"
    },
    "n8a": {
      "type": "narrate",
      "text": "殿上静了一会儿。然后天子开口，授他左拾遗。",
      "next": "n9"
    },
    "n9": {
      "type": "choice",
      "npc": true,
      "question": "天子授了他左拾遗。你想说什么？",
      "options": [
        {
          "text": "（问）这官，能说话吗？",
          "next": "n9a"
        },
        {
          "text": "（问）您方才在殿上，都说了什么？",
          "next": "n9b"
        },
        {
          "text": "（替他高兴）",
          "actionOnly": true,
          "next": "n9c"
        }
      ]
    },
    "n9a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（点头）能。（停了停）左拾遗，就是拾遗补阙。天子有过失，要劝；朝政有缺失，要说。（顿了顿）说白了，就是个说话的官。",
      "next": "n10"
    },
    "n9b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（想了想）把一路看见的，都说了。（停了停）朱门里的酒肉，路边的冻死骨，抓丁的、逃难的、饿死的。（顿了顿）天子听着，没说话。",
      "next": "n10"
    },
    "n9c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（他笑了一下，可那笑里有点说不清的东西）多谢。（停了停）等了这么些年，总算有个能说话的位子了。",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "过了些日子，他从宫里出来。换了一身官服，不太合身，袖子长了一截，下摆也拖到脚面。",
      "next": "n10a",
      "scene": "fengxiang_s07"
    },
    "n10a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（见你，抬了抬袖子，苦笑）这衣裳，是照着样子改的。（停了停）穿惯了破的，穿这个，反倒不自在。",
      "next": "n11"
    },
    "n11": {
      "type": "choice",
      "npc": true,
      "question": "他穿着不合身的官服，袖子长了一截。你想说点什么？",
      "options": [
        {
          "text": "（问）往后，就留在这儿了？",
          "next": "n11a"
        },
        {
          "text": "（问）这官，您打算怎么当？",
          "next": "n11b"
        },
        {
          "text": "（帮他挽了挽袖子）",
          "actionOnly": true,
          "next": "n11c"
        }
      ]
    },
    "n11a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）得留下。（停了停）左拾遗是天子的近臣，随时要应召。（顿了顿）可我这家小，还在鄜州。",
      "next": "n12"
    },
    "n11b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他想了想）该怎么当，就怎么当。（停了停）该说的话，不能不说。（顿了顿）哪怕说了，要担干系。",
      "next": "n12"
    },
    "n11c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他任你挽袖子，看了看，笑了一下）多谢。（停了停）这袖子，我自己怎么挽，都不对。",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "他整了整衣裳，抬头看了看行宫的方向。",
      "next": "n12a",
      "scene": "fengxiang_s08"
    },
    "n12a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（忽然道）从前求官，是为了光耀门楣。（停了停）可经历了这一场乱子，我才明白，做官该是为什么。",
      "next": "n12b"
    },
    "n12b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他压低声音，一字一顿）不为己，为的是替这天下、替这万民，说上几句真话。（停了停）所以这个左拾遗，我一定得当好。",
      "next": "n12c"
    },
    "n12c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他忽然笑了笑，那笑里有点说不清的东西）不过我这性子，怕是待不长。（停了停）要是哪天真因为直言被贬了，那也是我自找的。（顿了顿）可我不悔。",
      "next": "n13"
    },
    "n13": {
      "type": "aiFree",
      "prompt": "你与杜甫在凤翔行宫外重逢。他刚从陷落的长安逃出，脚踩破麻鞋，一路钻山沟、穿荆棘，走到了凤翔。天子授他左拾遗。他穿着不合身的官服，刚对你说完\"这官怎么当\"和\"我这性子怕是待不长\"。你可以问他逃亡的经历、左拾遗的职责、对直言进谏的打算、鄜州的家人。",
      "hint": "你可以问：逃亡的路、左拾遗是什么官、他打算怎么进谏、鄜州的家人、往后的打算……",
      "suggestions": [
        "这一路，您是怎么逃出来的？",
        "左拾遗，是个什么官？",
        "您真打算直言进谏？不怕被贬吗？"
      ],
      "scene": "fengxiang",
      "minRounds": 1,
      "next": "n14"
    },
    "n14": {
      "type": "reflect",
      "lines": [
        "他穿着那身不合身的官服，朝行宫里走去。袖子长了一截，他走几步，就得往上挽一挽。",
        "一双麻鞋，见证了他这一路的艰险。",
        "逃出长安，授官凤翔，是他在乱世里难得的转机。",
        "可我心里清楚，这样一个宁折不弯的人，注定会在直言里栽跟头。",
        "过了些日子，他跟我说，想回鄜州一趟，看看家人。"
      ],
      "next": "__end__"
    }
  }
};

quests['qiangcun'] = {
  "id": "qiangcun",
  "title": "鄜州 · 羌村团聚",
  "range": "757",
  "place": {
    "name": "鄜州羌村",
    "year": "757年"
  },
  "scene": "qiangcun",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "从凤翔往北，走了好些天。到羌村的时候，天快黑了。",
      "scene": "qiangcun",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "村口几间土屋，一缕炊烟，鸡犬相闻。他站在村口，忽然不走了。",
      "next": "n1b"
    },
    "n1b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（望着村头那户人家，声音有些发紧）到了。（停了停）不知道他们……还认不认得我。",
      "next": "n2"
    },
    "n2": {
      "type": "choice",
      "npc": true,
      "question": "他站在村口，不敢往前走。你想说点什么？",
      "options": [
        {
          "text": "（问）都到家了，怎么不进去？",
          "next": "n2a"
        },
        {
          "text": "（陪他站着）",
          "actionOnly": true,
          "next": "n2b"
        },
        {
          "text": "（先替他往那户人家走去）",
          "actionOnly": true,
          "next": "n2c"
        }
      ]
    },
    "n2a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（苦笑）怕。（停了停）走了这么远，什么苦都吃过来了。到了门口，反倒怕了。",
      "next": "n3"
    },
    "n2b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他站了一会儿，深吸一口气）走吧。（停了停）总得进去。",
      "next": "n3"
    },
    "n2c": {
      "type": "narrate",
      "text": "你先往那户人家走去。他愣了一下，跟在你后面。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "柴门推开。屋里的人先是一惊。一个女人带着几个孩子迎出来，看见他，愣在原地。",
      "next": "n3a",
      "scene": "qiangcun_s02"
    },
    "n3a": {
      "type": "narrate",
      "text": "最小的那个孩子，躲在母亲身后，探出半个头，用陌生的眼神偷偷打量他。",
      "next": "n3b"
    },
    "n3b": {
      "type": "narrate",
      "text": "他蹲下身，想伸手去抱，孩子往后缩了缩，把脸埋进母亲的衣服里。",
      "next": "n4"
    },
    "n4": {
      "type": "choice",
      "npc": true,
      "question": "孩子认不出父亲，缩了回去。你想做点什么？",
      "options": [
        {
          "text": "（蹲下来，对那孩子说）这是你父亲。",
          "next": "n4a"
        },
        {
          "text": "（站在一旁，看他们一家人）",
          "actionOnly": true,
          "next": "n4b"
        },
        {
          "text": "（替他把包袱接过来）",
          "actionOnly": true,
          "next": "n4c"
        }
      ]
    },
    "n4a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他蹲着，声音有些发颤）是我。（停了停）我回来了。",
      "next": "n5"
    },
    "n4b": {
      "type": "narrate",
      "text": "女人先哭了出来，扑上去把他抱住。孩子还愣着，被母亲拉过来，才怯生生地叫了一声。",
      "next": "n5"
    },
    "n4c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他把包袱递给你，眼睛却看着孩子）多谢。（停了停）太久了，久到孩子们都认不出我这个做父亲的。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "进了屋。屋里很暗，一灯如豆。墙角的锅缺了个口，灶上温着一小锅稀粥。",
      "next": "n5a",
      "scene": "qiangcun_s03"
    },
    "n5a": {
      "type": "narrate",
      "text": "女人忙着生火，手上生了冻疮，红肿得厉害，却还在麻利地干活。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "屋里简陋，妻子的手生了冻疮。你想说点什么？",
      "options": [
        {
          "text": "（问）这冻疮，是怎么弄的？",
          "next": "n6a"
        },
        {
          "text": "（看着那锅稀粥，没说话）",
          "actionOnly": true,
          "next": "n6b"
        },
        {
          "text": "（沉默地站着）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他望着妻子的手，声音低下去）去年冬天，村里断了粮。（停了停）她带着孩子去挖野菜，天寒地冻，手就冻成这样了。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他顺着你的目光看过去，喉头动了动）这一锅稀粥，怕是他们一天的饭。（停了停）我在凤翔，还穿着新官服。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你不说话，自己开了口）这屋子，比走的时候更破了。（停了停）难为他们了。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "孩子在旁边偷偷看他。他伸出手，想摸摸孩子的头，孩子又缩了一下。",
      "next": "n7a",
      "scene": "qiangcun_s04"
    },
    "n7a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他把手收回来，声音很低）这些年，苦了她了。（停了停）我一个男子汉，没能护住这个家，反倒让她带着孩子，在这荒村里担惊受怕。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "他收回手，满是愧疚。你想说点什么？",
      "options": [
        {
          "text": "能平安回来，比什么都好。",
          "next": "n8a"
        },
        {
          "text": "（问）往后，就留在家人身边吧？",
          "next": "n8b"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他点头，露出一丝笑意）是啊。（停了停）乱世里，人如浮萍，能活着见上一面，已是天大的福分。",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他沉默片刻，缓缓摇头）我也想把日子就这么过下去。（停了停）可天下的战火还没熄，我这样的人，哪能只守着一个家。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "夜里，一家人围着一盏昏黄的油灯。孩子靠在父亲膝头，渐渐睡去，鼾声轻轻。",
      "next": "n9a",
      "scene": "qiangcun_s05"
    },
    "n9a": {
      "type": "narrate",
      "text": "妻子坐在一旁，看着他们，眼睛红红的，又笑，又像是要哭。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他轻轻拍着孩子，低声吟）\"妻孥怪我在，惊定还拭泪。\"（停了停）方才他们看见我，先是不敢认，认出来了，才哭。",
      "next": "n9_card"
    },
    "n9_card": {
      "type": "anchorCard",
      "anchor": "a11",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "灯花\"啪\"地爆了一下。窗外，山风呜呜地吹过荒村。",
      "next": "n10a",
      "scene": "qiangcun_s06"
    },
    "n10a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他望着灯，忽然道）在凤翔的时候，夜里睡不着，就想这一盏灯。（停了停）想他们围在灯下，是什么样子。",
      "next": "n11"
    },
    "n11": {
      "type": "choice",
      "npc": true,
      "question": "他望着灯，说着凤翔的夜。你想接什么？",
      "options": [
        {
          "text": "（问）在凤翔，您都想了些什么？",
          "next": "n11a"
        },
        {
          "text": "（问）往后，还回凤翔吗？",
          "next": "n11b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n11c"
        }
      ]
    },
    "n11a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）想孩子长高了没有，想妻子的冻疮好了没有。（停了停）想这屋子漏不漏雨，想那口锅还能不能用。",
      "next": "n12"
    },
    "n11b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）得回。（停了停）左拾遗的位子还空着，天子那边，随时可能召我。（顿了顿）这几日，我就在这儿多待些时候，好好陪陪他们。",
      "next": "n12"
    },
    "n11c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，声音更轻）这样的日子，过一天少一天。（停了停）能多坐一会儿，就多坐一会儿。",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "孩子在膝头翻了个身，嘟囔了一句什么。他低下头，替孩子掖了掖衣裳。",
      "next": "n12a",
      "scene": "qiangcun_s07"
    },
    "n12a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他忽然道）我这些日子，在凤翔，看着朝里的事，心里有些不安。（停了停）有些话，我怕是不得不说。",
      "next": "n12b"
    },
    "n12b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他压低声音）可真说了，未必有好果子吃。（停了停）我这性子，怕是待不长。",
      "next": "n13"
    },
    "n13": {
      "type": "choice",
      "npc": true,
      "question": "他说“怕是待不长”。你想说点什么？",
      "options": [
        {
          "text": "（问）那您还打算说吗？",
          "next": "n13a"
        },
        {
          "text": "（问）不能不说吗？",
          "next": "n13b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n13c"
        }
      ]
    },
    "n13a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他沉默了一会儿）说。（停了停）左拾遗，就是拾遗补阙的官。该说的话不说，要这个位子做什么。",
      "next": "n14"
    },
    "n13b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（摇头）不能。（停了停）我逃出长安，走到凤翔，不是为了回来闭嘴的。",
      "next": "n14"
    },
    "n13c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）我知道你担心什么。（停了停）可我这人，改不了了。",
      "next": "n14"
    },
    "n14": {
      "type": "aiFree",
      "prompt": "你随杜甫回到鄜州羌村，与他的家人团聚。孩子认不出父亲，妻子手上生了冻疮。他刚对你说完“我这性子怕是待不长”，也说了有些话不得不说。你可以问他这些年的牵挂、团聚的滋味、对家人的愧疚、以及回凤翔后的打算。",
      "hint": "你可以问：与家人分别多久了、孩子认不出他时的感受、妻子的辛苦、回凤翔后的打算、那些“不得不说”的话……",
      "suggestions": [
        "孩子认不出您，您心里什么滋味？",
        "这些年，您最牵挂的是什么？",
        "您说“待不长”，是打算做什么？"
      ],
      "scene": "qiangcun",
      "minRounds": 1,
      "next": "n15"
    },
    "n15": {
      "type": "reflect",
      "lines": [
        "柴门里传出的，不再有哭声，只有一家人低低的絮语，和一盏暖黄的灯。",
        "孩子在父亲膝头睡着了。他轻轻把孩子放到榻上，掖好被角。",
        "第二天一早，他收拾好行李，对妻子说，得回凤翔了。",
        "走到村口，他回头望了望那间土屋，才转身上路。",
        "你跟在后面，看见他走几步，又回头看了一眼。"
      ],
      "next": "__end__"
    }
  }
};

quests['huazhou'] = {
  "id": "huazhou",
  "title": "华州 · 三吏三别",
  "range": "758–759",
  "place": {
    "name": "华州",
    "year": "758–759年"
  },
  "scene": "huazhou",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "从羌村回到凤翔没多久，事情就来了。",
      "scene": "huazhou",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "他上疏替一位被贬的大臣说话，话说得直，得罪了人。没过多久，一纸文书下来：贬华州司功参军。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "从天子近臣，到州郡小吏。他拿着那纸文书，看了很久，什么也没说。",
      "next": "n2"
    },
    "n2": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（见你，把文书收起来，笑了一下）我说过的。（停了停）我这性子，待不长。",
      "next": "n2a"
    },
    "n2a": {
      "type": "choice",
      "npc": true,
      "question": "他被贬了，笑里带着说不清的东西。你想说点什么？",
      "options": [
        {
          "text": "（问）后悔说那些话吗？",
          "next": "n2b"
        },
        {
          "text": "（问）华州，还去吗？",
          "next": "n2c"
        },
        {
          "text": "（沉默地看着他）",
          "actionOnly": true,
          "next": "n2d"
        }
      ]
    },
    "n2b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（摇头）不悔。（停了停）该说的话，说了。贬就贬吧。",
      "next": "n3"
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）去。（停了停）不去，就是抗旨。（顿了顿）况且，华州那边，也得有人做事。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己开了口）左拾遗做了没多久。（停了停）可这一趟，也不算白做。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "他收拾了简单的行李，往华州去。你陪他走了一段。",
      "next": "n3a",
      "scene": "huazhou_s02"
    },
    "n3a": {
      "type": "narrate",
      "text": "出了凤翔，路越走越荒。沿途的村子，十室九空，田里长满了草。",
      "next": "n3b"
    },
    "n3b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他望着路边的荒田，忽然道）这一路，怕是不好走。（停了停）听说前面在抓丁，抓得很紧。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "华州城外，一条官道旁。路上一队队被强征的新兵，正被鞭子赶着往西走。",
      "next": "n4a",
      "scene": "huazhou_s03"
    },
    "n4a": {
      "type": "narrate",
      "text": "哭喊声此起彼伏。有母亲追着儿子跑，有妻子拽着丈夫的衣角，被拖出老远。",
      "next": "n4b"
    },
    "n4b": {
      "type": "narrate",
      "text": "路边，杜甫正望着这人间惨象，手里的笔在微微发抖。",
      "next": "n5"
    },
    "n5": {
      "type": "choice",
      "npc": true,
      "question": "官道上哭喊声一片。你想做点什么？",
      "options": [
        {
          "text": "（站到他身边，一起看）",
          "actionOnly": true,
          "next": "n5a"
        },
        {
          "text": "（去扶那个被拖倒在地的老妇人）",
          "actionOnly": true,
          "next": "n5b"
        },
        {
          "text": "（问）这些，你都记下来了吗？",
          "next": "n5c"
        }
      ]
    },
    "n5a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（声音沙哑）你看见了吗。（停了停）抓丁的人，把刚成年的孩子也拉走了；送行的老翁，连鞋子都跑掉了。",
      "next": "n6"
    },
    "n5b": {
      "type": "narrate",
      "text": "你扶起那老妇人。她抓着你的手，哭得说不出话，只反复念着一个名字。",
      "next": "n5d"
    },
    "n5c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他低头看看手里那卷纸，指节发白）记了，也记不过来。（停了停）昨日经过石壕村，夜深了，官差还来抓人，翻墙破门，把家里的男人都逼走了。",
      "next": "n6"
    },
    "n5d": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他走过来，看着那老妇人）她儿子，方才被拉走了。（停了停）这样的场面，这一路，我见了不知多少回。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "他忽然合上眼，像是想起了什么。",
      "next": "n6a",
      "scene": "huazhou_s04"
    },
    "n6a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（低声）昨夜我在石壕村借宿。半夜，官差来抓人。（停了停）老头翻墙跑了，老妇人出来应门，说家里三个儿子都去打仗了，两个已经死了。（顿了顿）最后，她把儿媳妇留下，自己跟着官差走了。",
      "next": "n7"
    },
    "n7": {
      "type": "choice",
      "npc": true,
      "question": "他讲着石壕村的事，声音越来越低。你想说点什么？",
      "options": [
        {
          "text": "那个老妇人，后来呢？",
          "next": "n7a"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n7b"
        },
        {
          "text": "这些，您都写下来了？",
          "next": "n7c"
        }
      ]
    },
    "n7a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（摇头）不知道。（停了停）天亮我走的时候，她还没回来。",
      "next": "n8"
    },
    "n7b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你不说话，声音更低）我站在门外，听了一夜。（停了停）什么也做不了，只能听。",
      "next": "n8"
    },
    "n7c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（点头）写了。（停了停）\"暮投石壕村，有吏夜捉人。\"（顿了顿）我写下来，不为别的，就为让后人知道，这乱世里，百姓过的是什么日子。",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "又一队新兵被鞭子驱赶着走过，扬起一阵尘土。",
      "next": "n8a",
      "scene": "huazhou_s05"
    },
    "n8a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他望着西去的路，喃喃）做官，我救不了他们；可写诗，或许能让后人记住，这乱世里，百姓过的是什么日子。",
      "next": "n8_card"
    },
    "n8_card": {
      "type": "anchorCard",
      "anchor": "a13",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "往前走了一段，路边围着一群人。你挤过去看，是一对新婚的夫妻。",
      "next": "n9a",
      "scene": "huazhou_s06"
    },
    "n9a": {
      "type": "narrate",
      "text": "丈夫穿着新做的衣裳，被官差推着往前走。妻子拽着他的袖子，怎么也不肯松手。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他站在人群外，声音很低）\"结发为君妻，席不暖君床。\"（停了停）才成亲，就要分开。",
      "next": "n10"
    },
    "n10": {
      "type": "choice",
      "npc": true,
      "question": "新婚的夫妻被拆散。你想做点什么？",
      "options": [
        {
          "text": "（问）这样的别，您见了几回？",
          "next": "n10a"
        },
        {
          "text": "（沉默地看着那对夫妻）",
          "actionOnly": true,
          "next": "n10b"
        }
      ]
    },
    "n10a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（想了想）数不清了。（停了停）有新婚的，有垂老的，有没了儿子的老妇人。（顿了顿）每一个人，我都想写下来。",
      "next": "n11"
    },
    "n10b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）那丈夫被推着走了几步，回头看了一眼。（停了停）就一眼。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "天色暗了。他在路边找了块石头坐下，把一路写的稿子摊开，就着暮色看。",
      "next": "n11a",
      "scene": "huazhou_s07"
    },
    "n11a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他翻着那些稿子，忽然道）我从前只想着\"致君尧舜\"，想靠做官救这天下。（停了停）今日才知道，一个无权无势的诗人，能做的，就是让这些哭声，不被历史的尘土埋掉。",
      "next": "n11b"
    },
    "n11b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他抬起头，看着你）这些诗，我写定了。（停了停）《石壕吏》《新婚别》《垂老别》——一路走，一路写。",
      "next": "n12"
    },
    "n12": {
      "type": "choice",
      "npc": true,
      "question": "他摊开稿子，说要一路走一路写。你想接什么？",
      "options": [
        {
          "text": "（问）华州这个官，您还做吗？",
          "next": "n12a"
        },
        {
          "text": "（问）写这些，有用吗？",
          "next": "n12b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n12c"
        }
      ]
    },
    "n12a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他沉默了一会儿）不知道。（停了停）华州这个参军，做得实在憋屈。（顿了顿）可眼下，还得去。",
      "next": "n13"
    },
    "n12b": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他看着手里的稿子）有没有用，我不知道。（停了停）可总得有人写。（顿了顿）不写，这些人的苦，就白受了。",
      "next": "n13"
    },
    "n12c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，把稿子收起来）走吧。（停了停）天快黑了，前面还得找地方歇脚。",
      "next": "n13"
    },
    "n13": {
      "type": "aiFree",
      "prompt": "你与杜甫在华州官道上，目睹了抓丁的惨状。他刚写了《石壕吏》，又见了新婚夫妻被拆散，动了弃官的念头。你可以问他石壕村的事、《三吏》《三别》的写作、华州这个官还做不做、往后的打算。",
      "hint": "你可以问：石壕村的经过、写《石壕吏》的念头、华州这个官、弃官的打算……",
      "suggestions": [
        "石壕村那个老妇人，您还记得她的样子吗？",
        "《三吏》《三别》，都是这一路写的？",
        "华州这个官，您还打算做下去吗？"
      ],
      "scene": "huazhou",
      "minRounds": 1,
      "next": "n14"
    },
    "n14": {
      "type": "reflect",
      "lines": [
        "西行的路，一步一血泪。",
        "杜甫放下了做官救世的幻想，却拿起了比官印更有分量的笔。",
        "《三吏》《三别》，是乱世里最沉痛的记录，也是一个诗人对百姓最深沉的悲悯。",
        "他把笔收进袖子里，朝西边望去。",
        "回到衙署，他把官印放在案上，没跟人多说什么。"
      ],
      "next": "__end__"
    }
  }
};

quests['qinzhou'] = {
  "id": "qinzhou",
  "title": "秦州 · 弃官西行",
  "range": "759",
  "place": {
    "name": "秦州",
    "year": "759年"
  },
  "scene": "qinzhou",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "华州那个官，他没做多久。",
      "scene": "qinzhou",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "这天清早，天刚亮。街上没什么人。他从衙署里走出来，怀里揣着那枚官印。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "走到衙门口，他停下来，回头看了一眼。然后弯下腰，把官印放在门前的石阶上，整了整。",
      "next": "n1c"
    },
    "n1c": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他直起身，望着那枚官印，忽然道）你知道我为什么辞官吗。（停了停）不只是因为被贬。",
      "next": "n1d"
    },
    "n1d": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他转过身，声音沉下来）华州这个参军，管的是祭祀、学校、考试这些杂事。（停了停）我想做的事，一件也做不了。",
      "next": "n1e"
    },
    "n1e": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他望着城外）这一路走过来，看见的是什么。（停了停）关中大旱，地里没收成，百姓逃荒的逃荒，饿死的饿死。（顿了顿）我这个官，连自己的家人都养不活，还谈什么救百姓。",
      "next": "n1f"
    },
    "n1f": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他沉默了一会儿）前几日，同谷那边来了信。（停了停）那边的县令说，同谷物产丰足，风土也好，劝我过去。（顿了顿）我想带着一家老小，往南走。这官，不做了。",
      "next": "n2"
    },
    "n2": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他站直了，笑了一下）这么些年，一直想着要个官。（停了停）真拿到手，又觉得，不是那么回事。",
      "next": "n2a"
    },
    "n2a": {
      "type": "choice",
      "npc": true,
      "question": "他把官印放在石阶上，说\"放下了\"。你想说点什么？",
      "options": [
        {
          "text": "（问）就这么放下了？",
          "next": "n2b"
        },
        {
          "text": "（问）往后怎么办？",
          "next": "n2c"
        },
        {
          "text": "（沉默地看着那枚官印）",
          "actionOnly": true,
          "next": "n2d"
        }
      ]
    },
    "n2b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）就这么放下。（停了停）这东西，看着轻，压得人喘不过气。",
      "next": "n3"
    },
    "n2c": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望着城外）走到哪儿算哪儿。（停了停）这身子，这家人，总得找个能落脚的地方。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己开了口）这官印，我放在这儿，自会有人来收。（停了停）从今往后，我跟它，就没干系了。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "他往城外走。街上还是没什么人。他走得很轻快，像卸下了一件很重的东西。",
      "next": "n3a",
      "scene": "qinzhou_s02"
    },
    "n3a": {
      "type": "narrate",
      "text": "城门在身后慢慢远了。他忽然停下来，回头看了一眼华州城。",
      "next": "n3b"
    },
    "n3b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（看了一会儿，转过头）走吧。（停了停）往西。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "往西的路，越走越荒。走了好些天，到了一处边城。黄沙漫卷，落日把天地染成苍黄。",
      "next": "n4a",
      "scene": "qinzhou_s03"
    },
    "n4a": {
      "type": "narrate",
      "text": "城头上有个人影独立，正望着西边的关山出神。你走近才看清，是他。须发已见花白，衣衫破旧，背却挺得笔直。",
      "next": "n5"
    },
    "n5": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（听见脚步声，回头见你，微微一笑）到了。（停了停）秦州。",
      "next": "n5a"
    },
    "n5a": {
      "type": "choice",
      "npc": true,
      "question": "到了秦州。你想说点什么？",
      "options": [
        {
          "text": "（问）这地方，能落脚吗？",
          "next": "n5b"
        },
        {
          "text": "（问）辞了官，心里什么滋味？",
          "next": "n5c"
        },
        {
          "text": "（望着他花白的须发，一时感慨）",
          "actionOnly": true,
          "next": "n5d"
        }
      ]
    },
    "n5b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（往城里望了望）先找个地方住下。（停了停）这地方偏，米贱，兴许能安顿些日子。",
      "next": "n6"
    },
    "n5c": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了想）说不上来。（停了停）像是放下了什么，又像是丢了什么。（顿了顿）可走的时候，脚步是轻的。",
      "next": "n6"
    },
    "n5d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你神色，自嘲地笑了笑）老了不少吧。（停了停）这几年，从长安到华州，从华州到秦州，路越走越远，人也越走越瘦。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "他领着家小，在城西找了一处破院子住下。院墙塌了一角，屋顶漏着天。",
      "next": "n6a",
      "scene": "qinzhou_s04"
    },
    "n6a": {
      "type": "narrate",
      "text": "白天他出去转，打听有没有活计。晚上回来，就着一点油灯，写东西。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "这天夜里，月亮很好。他坐在院中，望着天上的月亮，一动不动。",
      "next": "n7a",
      "scene": "qinzhou_s05"
    },
    "n7a": {
      "type": "narrate",
      "text": "露水下来了，打湿了他的衣裳，他也没察觉。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "夜里，他坐在院中望月。你想做点什么？",
      "options": [
        {
          "text": "（在他旁边坐下）",
          "actionOnly": true,
          "next": "n8a"
        },
        {
          "text": "（问）在想什么？",
          "next": "n8b"
        },
        {
          "text": "（给他披上一件衣裳）",
          "actionOnly": true,
          "next": "n8c"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他没回头，只道）坐吧。（停了停）这秦州的月亮，比长安的冷。",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他望着月，声音很低）想起失散的弟弟。（停了停）战乱一起，兄弟几个各奔东西，到现在，连封信都没有。",
      "next": "n9"
    },
    "n8c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他拢了拢衣裳，看了你一眼）多谢。（停了停）这院子破，夜里凉。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "他望着月亮，忽然开口，说的不是诗，是一件旧事。",
      "next": "n9a",
      "scene": "qinzhou_s06"
    },
    "n9a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（声音很低）我有个弟弟，小时候睡觉爱磨牙。（停了停）夜里静，磨得咯咯响，我总嫌他吵。（顿了顿）如今想听，也听不着了。",
      "next": "n9b"
    },
    "n9b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他停了停，又道）还有一个，写字爱舔笔尖。（停了停）每回写完，嘴角都是黑的。（顿了顿）不知道如今，还在不在写。",
      "next": "n10"
    },
    "n10": {
      "type": "choice",
      "npc": true,
      "question": "他念着弟弟们的旧事。你想接什么？",
      "options": [
        {
          "text": "（问）他们，都在哪里？",
          "next": "n10a"
        },
        {
          "text": "（问）一点消息都没有吗？",
          "next": "n10b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n10c"
        }
      ]
    },
    "n10a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（摇头）不知道。（停了停）战乱一起，各奔东西。有的往南，有的往北。（顿了顿）如今是死是活，我都不知道。",
      "next": "n11"
    },
    "n10b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他望着月）捎过信。（停了停）可这乱世，信走到半路，就不知道去哪儿了。（顿了顿）没有消息，兴许就是好消息。",
      "next": "n11"
    },
    "n10c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）小时候，一大家子人，热热闹闹的。（停了停）如今，散的散，没的没。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "他低下头，看见衣裳被露水打湿了。抬手一摸，指尖冰凉。",
      "next": "n11a",
      "scene": "qinzhou_s07"
    },
    "n11a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（缓缓吟）\"戍鼓断人行，边秋一雁声。露从今夜白，月是故乡明。\"（停了停）一样的月亮，可在异乡看，总觉得比故乡的冷，也比故乡的远。",
      "next": "n11_card"
    },
    "n11_card": {
      "type": "anchorCard",
      "anchor": "a14",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "夜深了，屋里传来孩子的梦呓。他侧耳听了听，脸上露出一点柔和。",
      "next": "n12a",
      "scene": "qinzhou_s08"
    },
    "n12a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他忽然道）我不悔。（停了停）我这一生，错就错在把做官当成了唯一的路。如今想通了——官可以不做，诗不能停，这一身风骨更不能丢。",
      "next": "n13"
    },
    "n13": {
      "type": "choice",
      "npc": true,
      "question": "他说\"不悔\"。你想接什么？",
      "options": [
        {
          "text": "（问）那往后，打算怎么走？",
          "next": "n13a"
        },
        {
          "text": "（问）不做官了，靠什么过活？",
          "next": "n13b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n13c"
        }
      ]
    },
    "n13a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望着南边）前几日，同谷那边来了信。（停了停）那边的县令说，同谷物产丰足，风土也好，劝我过去。（顿了顿）我想着，总比在这儿等死强。",
      "next": "n14"
    },
    "n13b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（苦笑）不知道。（停了停）种地、采药、卖字，总有一条活路。（顿了顿）实在不行，还有朋友接济。",
      "next": "n14"
    },
    "n13c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）人这一辈子，总得自己选一条路。（停了停）哪怕是条苦路。",
      "next": "n14"
    },
    "n14": {
      "type": "narrate",
      "text": "第二天一早，他带着一家老小，出了秦州城。往南的路，越走越窄。",
      "next": "n14a"
    },
    "n14a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（出城的时候，他回头看了一眼秦州城头，没说话）",
      "next": "n15"
    },
    "n15": {
      "type": "aiFree",
      "prompt": "你与杜甫在秦州，他刚弃官西行。弃官的原因有三层：被贬、官事憋屈、关中大旱养不活家人。同谷县令来信相邀，他决定带着一家老小往南去同谷。夜里他在院中望月，思念失散的弟弟。你可以问他弃官的决定、同谷的信、对兄弟的牵挂、秦州的生活。",
      "hint": "你可以问：弃官的经过和原因、同谷县令的信、失散的弟弟、秦州的生活……",
      "suggestions": [
        "弃官那天，您真的走得轻快吗？",
        "同谷那边，那位县令可靠吗？",
        "失散的弟弟，有消息吗？"
      ],
      "scene": "qinzhou",
      "minRounds": 1,
      "next": "n16"
    },
    "n16": {
      "type": "reflect",
      "lines": [
        "弃官西行，是一条越走越难的路。",
        "可杜甫走得决绝——与其在官场里耗尽最后一点心气，不如把命交给天地，把心交给诗。",
        "此去，便是他一生漂泊西南的开始。",
        "同谷县令来信相邀，说那里物产丰足，宜于居住。他把这封信揣在怀里，像是揣着一点盼头。",
        "往南的路，越走越窄。走了好些天，到了一处荒凉的山野。",
        "他停下来，看了看四周，说：快到了。"
      ],
      "next": "__end__"
    }
  }
};

quests['tonggu'] = {
  "id": "tonggu",
  "title": "同谷 · 饥寒交迫",
  "range": "759 冬",
  "place": {
    "name": "同谷县",
    "year": "759年冬"
  },
  "scene": "tonggu",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "同谷县，一片荒凉的山野。大雪封山，滴水成冰。",
      "scene": "tonggu",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "到了同谷，他先去寻那位写信的县令。衙门里的人说，县令早已离任，不知去了哪里。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "他站在衙门外，把那封信掏出来，看了一遍，又一遍。信上写的“物产丰足、风土和暖”，一个字一个字，都还在。",
      "next": "n1c"
    },
    "n1c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他把信折起来，声音很平）走了。（停了停）信是他写的，人却先走了。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "走不了。盘缠在路上花得差不多了，天又冷下来。他带着一家老小，在城外的凤凰村寻了一处破窑，暂且住下。",
      "next": "n2a"
    },
    "n2a": {
      "type": "narrate",
      "text": "这一住，就是一个多月。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "你找到那处破窑的时候，天已经快黑了。窑洞口没有烟，只有一点微弱的火光从里面透出来。",
      "next": "n3a",
      "scene": "tonggu_s02"
    },
    "n3a": {
      "type": "narrate",
      "text": "推门进去，一股寒气扑面而来。窑里，杜甫一家蜷缩着。锅里煮着几把捡来的橡栗，孩子们冻得直哭。",
      "next": "n3b"
    },
    "n3b": {
      "type": "narrate",
      "text": "他抬头见你，眼里有愧色，却也有一丝宽慰。",
      "next": "n4"
    },
    "n4": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（搓着冻僵的手，声音发颤）到了同谷，才知道什么叫绝境。（停了停）天寒地冻，米缸空了，只能去山里拾些橡栗充饥。",
      "next": "n5"
    },
    "n5": {
      "type": "choice",
      "npc": true,
      "question": "破窑里，锅里煮着橡栗。你想做点什么？",
      "options": [
        {
          "text": "（把身上能御寒的，递给他）",
          "actionOnly": true,
          "next": "n5a"
        },
        {
          "text": "（蹲到锅边，看看煮的是什么）",
          "actionOnly": true,
          "next": "n5b"
        },
        {
          "text": "（问）那位县令，当真没见着？",
          "next": "n5c"
        }
      ]
    },
    "n5a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他接过，冻裂的手不住地抖，半晌才道）多谢。（停了停）这荒山野岭的，还能有你这么个故人，也算这寒冬里的一点暖意。",
      "next": "n6"
    },
    "n5b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他也蹲下来，看着锅里）橡栗。（停了停）山里有橡树，落下来的果子，捡回来煮一煮，能顶一顿。",
      "next": "n6"
    },
    "n5c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（摇头）没见着。（停了停）衙门里的人说，他早走了。（顿了顿）信还在我怀里，人却找不着了。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "火光映着他的手。那双手冻得又红又肿，裂了好几道口子，指甲缝里都是黑泥。",
      "next": "n6a",
      "scene": "tonggu_s03"
    },
    "n6a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他顺着你的目光看了看自己的手，苦笑）这双手，从前是握笔的。（停了停）如今，是刨雪的。",
      "next": "n7"
    },
    "n7": {
      "type": "choice",
      "npc": true,
      "question": "他看着自己冻裂的手。你想说点什么？",
      "options": [
        {
          "text": "（问）橡栗，好捡吗？",
          "next": "n7a"
        },
        {
          "text": "（沉默）",
          "actionOnly": true,
          "next": "n7b"
        },
        {
          "text": "（把自己的手套递过去）",
          "actionOnly": true,
          "next": "n7c"
        }
      ]
    },
    "n7a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（摇头）不好捡。（停了停）雪深，山陡，橡栗埋在雪底下，得用手扒。（顿了顿）有时候扒半天，才捡着一小把。",
      "next": "n8"
    },
    "n7b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他见你不说话，声音更低）我常想，我一个读书人，既不会种地，又不会营生，如今连家人都养不活。（停了停）还谈什么\"致君尧舜\"。",
      "next": "n8"
    },
    "n7c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他接过手套，看了看，又递回来）你留着。（停了停）你还要赶路。我这双手，冻惯了。",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "第二天，你陪他上山。雪很深，一脚踩下去，没到膝盖。",
      "next": "n8a",
      "scene": "tonggu_s04"
    },
    "n8a": {
      "type": "narrate",
      "text": "他蹲在雪地里，用手扒开雪，一颗一颗地捡橡栗。手指头冻得没了知觉，扒着扒着，雪地上就见了红。",
      "next": "n8b"
    },
    "n8b": {
      "type": "narrate",
      "text": "他停下来，看了看自己的手，又接着扒。",
      "next": "n9"
    },
    "n9": {
      "type": "choice",
      "npc": true,
      "question": "他的手渗着血，还在扒。你想做点什么？",
      "options": [
        {
          "text": "（蹲下来，一起扒）",
          "actionOnly": true,
          "next": "n9a"
        },
        {
          "text": "（问）这橡栗，到底能不能吃？",
          "next": "n9b"
        }
      ]
    },
    "n9a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你也蹲下来，愣了一下，随即低声道）多谢。（停了停）你扒一会儿就停，这雪凉。",
      "next": "n10"
    },
    "n9b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他停下手里的活）能吃。（停了停）苦，涩，吃多了肚子胀。（顿了顿）可总比饿着强。",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "回到破窑，他把捡来的橡栗倒出来，只有一小捧。",
      "next": "n10a",
      "scene": "tonggu_s05"
    },
    "n10a": {
      "type": "narrate",
      "text": "他把橡栗一颗一颗分给妻儿。分到最后，锅里只剩一点煮橡栗的水。他端起来，喝了几口。",
      "next": "n10b"
    },
    "n10b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他抹了抹嘴，忽然低声吟道）\"手脚冻皴皮肉死。\"（停了停）手和脚，都冻裂了，皮肉都坏了。（顿了顿）这句话，我从前写不出来。如今，是它自己找上来的。",
      "next": "n10_card"
    },
    "n10_card": {
      "type": "anchorCard",
      "anchor": "a15",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "你忽然发现，他喝那口水的时候，背对着妻儿。",
      "next": "n11a",
      "scene": "tonggu_s06"
    },
    "n11a": {
      "type": "narrate",
      "text": "他把那点水喝完，转过身来，脸上什么都没有。",
      "next": "n12"
    },
    "n12": {
      "type": "choice",
      "npc": true,
      "question": "他背对着家人喝那口水。你想说点什么？",
      "options": [
        {
          "text": "（问）您就喝这个？",
          "next": "n12a"
        },
        {
          "text": "（把自己带的干粮分给他）",
          "actionOnly": true,
          "next": "n12b"
        },
        {
          "text": "（沉默地看着他）",
          "actionOnly": true,
          "next": "n12c"
        }
      ]
    },
    "n12a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他把碗放下）孩子们要紧。（停了停）我喝点热的，暖暖身子，就够了。",
      "next": "n13"
    },
    "n12b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他推辞了一下，还是接了，掰了一半给孩子）多谢。（停了停）这一路，多亏还有你这样的故人。",
      "next": "n13"
    },
    "n12c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己开了口）别这样看着我。（停了停）我这做父亲的，总得先紧着他们。",
      "next": "n13"
    },
    "n13": {
      "type": "narrate",
      "text": "山风呜咽着灌进破窑，卷起地上的雪。火光一点点暗下去。",
      "next": "n13a",
      "scene": "tonggu_s07"
    },
    "n13a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他忽然抬起头）这个县令，是指望不上了。（停了停）这地方，也待不下去了。（顿了顿）再不走，一家人，都得折在这儿。",
      "next": "n14"
    },
    "n14": {
      "type": "choice",
      "npc": true,
      "question": "他说这地方待不下去了。你想接什么？",
      "options": [
        {
          "text": "（问）那往哪儿走？",
          "next": "n14a"
        },
        {
          "text": "（问）这雪封着山，走得出去吗？",
          "next": "n14b"
        },
        {
          "text": "（沉默地听着）",
          "actionOnly": true,
          "next": "n14c"
        }
      ]
    },
    "n14a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望向南边）成都。（停了停）听说那边有我的故交，兴许能帮一把。（顿了顿）去了，兴许还有条活路。",
      "next": "n15"
    },
    "n14b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他望了望窑外）走得出去。（停了停）雪总有停的时候。（顿了顿）人不能等雪停了才走，得一边走，一边等。",
      "next": "n15"
    },
    "n14c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，自己说了下去）守在这儿，是等死。（停了停）走出去，兴许还有条活路。",
      "next": "n15"
    },
    "n15": {
      "type": "narrate",
      "text": "第二天，雪小了些。他把剩下的橡栗装进布袋里，背着上路。",
      "next": "n15a",
      "scene": "tonggu_s08"
    },
    "n15a": {
      "type": "narrate",
      "text": "走出破窑的时候，他回头看了一眼那个窑洞。",
      "next": "n16"
    },
    "n16": {
      "type": "aiFree",
      "prompt": "你与杜甫在同谷县的破窑里，大雪封山，他一家饥寒交迫，靠拾橡栗充饥。写信相邀的县令早已离任，他在这里困了一个多月，终于确认此地待不下去，决定往成都去。你可以问他同谷的日子、拾橡栗的艰难、那位失约的县令、对家人的愧疚、往后的打算。",
      "hint": "你可以问：同谷的冬天怎么过的、橡栗怎么捡、那位县令的事、家人的情况、为什么去成都……",
      "suggestions": [
        "那位县令，真的就这么走了？",
        "这橡栗，真的能吃饱吗？",
        "成都那边，有把握吗？"
      ],
      "scene": "tonggu",
      "minRounds": 1,
      "next": "n17"
    },
    "n17": {
      "type": "reflect",
      "lines": [
        "山风呜咽，破窑里的火光一点点暗下去。",
        "同谷的冬天，冷到了骨头里，也冷进了一个诗人的命里。",
        "可就是在这样的绝境里，杜甫也没有倒下——他望着南方，把最后一点力气，都押在了\"活下去\"三个字上。",
        "在这里困了一个多月，他终于确认，那个写信邀他来的县令，是指望不上了。",
        "十二月初一，他带着一家人，离开了这个差点困死他们的地方。",
        "往南，去成都。听说那边有故交，兴许能寻一条活路。"
      ],
      "next": "__end__"
    }
  }
};

quests['chengdu'] = {
  "id": "chengdu",
  "title": "成都 · 草堂安居",
  "range": "760–765",
  "place": {
    "name": "成都草堂",
    "year": "760–765年"
  },
  "scene": "chengdu",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "浣花溪畔，几间草屋，竹篱围着一小块菜地。你到的时候，杜甫正蹲在篱边，与一个老农说话。",
      "scene": "chengdu",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "老农手里提着几棵菜苗，比比划划，他一边听一边点头，手上还沾着泥。",
      "next": "n1b"
    },
    "n1b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（送走老农，回头见你，拍了拍手上的土）来了。正好，帮我扶一下这篱笆。昨夜风大，倒了一截。",
      "next": "n2"
    },
    "n2": {
      "type": "choice",
      "npc": true,
      "question": "他递过来一根竹竿，让你扶着。你想说点什么？",
      "options": [
        {
          "text": "（接过来扶住）这篱笆，是你自己扎的？",
          "next": "n2a"
        },
        {
          "text": "（一边扶一边看）这菜地，也是你开的？",
          "next": "n2b"
        },
        {
          "text": "（不说话，先帮他把绳子系好）",
          "actionOnly": true,
          "next": "n2c"
        }
      ]
    },
    "n2a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（蹲下去绑绳子）自己扎的。刚来那会儿，这儿是片荒地。我与妻子一锄头一锄头开出来的。（抬头）不比写诗容易。",
      "next": "n3"
    },
    "n2b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（笑）自己开的。从前在长安，哪想过有朝一日要种菜。（指了指地里）那是刚栽的茄子，那边是韭菜。老农说，韭菜好活。",
      "next": "n3"
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他看你系绳子，手上的活停下来，看着你系完）你这手法，是干过活的。（顿了顿）我从前不会，来了这儿，才一样一样学。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "篱笆刚扶好，屋里跑出个小孩，光着脚，一头扎进他怀里。他弯腰把孩子抱起来，掂了掂。",
      "next": "n3a",
      "scene": "chengdu_s02"
    },
    "n3a": {
      "type": "choice",
      "npc": true,
      "question": "孩子扒在他肩上，好奇地看着你。你想做点什么？",
      "options": [
        {
          "text": "（伸手逗了逗孩子）",
          "actionOnly": true,
          "next": "n3b"
        },
        {
          "text": "（问）这孩子，叫什么名字？",
          "next": "n3c"
        },
        {
          "text": "（看着他们父子俩，没说话）",
          "actionOnly": true,
          "next": "n3d"
        }
      ]
    },
    "n3b": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（孩子伸手抓你的手指，他笑了）他不认生。（把孩子往上托了托）前些年逃难，他跟着我们饿过肚子，如今总算能吃饱了。",
      "next": "n4"
    },
    "n3c": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（对孩子）宗武。（转头对你）最小的。前些年逃难，他跟着我们饿过肚子，如今总算能吃饱了。",
      "next": "n4"
    },
    "n3d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也没多解释，只把孩子往上托了托）前些年逃难，他跟着我们饿过肚子，如今总算能吃饱了。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "他把孩子放下，领你到溪边坐下。溪水清浅，几只鸭子在水里扑腾。他在石头上坐下，长长舒了口气。",
      "next": "n4a",
      "scene": "chengdu_s03"
    },
    "n4a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（望着溪水）你来得巧。昨夜下了场春雨，我听着雨声，半宿没睡。（顿了顿）倒得了几句。",
      "next": "n5"
    },
    "n5": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他轻声念）\"好雨知时节，当春乃发生。随风潜入夜，润物细无声。\"——你看这雨，下得轻，可一夜过来，菜苗都直起来了。",
      "next": "n5_card"
    },
    "n5_card": {
      "type": "anchorCard",
      "anchor": "a16",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "他看着溪水，说得很轻。你作何感想？",
      "options": [
        {
          "text": "\"润物细无声\"，这\"润\"字用得真好。",
          "next": "n6a"
        },
        {
          "text": "这草堂的日子，让你的诗也软和了。",
          "next": "n6b"
        },
        {
          "text": "（看着溪边的菜苗，没接话）",
          "actionOnly": true,
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（点头）从前写诗，总想着一字千钧。如今倒觉得，这样轻轻的，也好。（指了指菜地）就跟这雨一样。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（笑了一下）软和？也许是吧。从前写的都是血泪，一笔下去都带着疼。如今在这儿，竟也能写点别的了。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他也看着菜苗，过了一会儿才说）这雨一下，它们就直起来了。人也一样。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "入秋之后，你又到了草堂。还没进门，就听见屋顶上哗啦哗啦的响。",
      "next": "n7a",
      "scene": "chengdu_s04"
    },
    "n7a": {
      "type": "narrate",
      "text": "八月秋深，风刮得又急又高。茅屋顶上的草，被一层一层卷起来，打着旋往天上飞。",
      "next": "n7b"
    },
    "n7b": {
      "type": "narrate",
      "text": "杜甫站在院子里，仰着头，手里攥着一根竹竿，够也够不着。",
      "next": "n7c"
    },
    "n7c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（见你，苦笑）你来得不巧。这场风，把屋顶掀了三层。（指了指江那边）草都飞过江去了。",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "你顺着他的手看过去。茅草飞得满地都是，有的高高挂在林梢上，有的飘飘悠悠沉进了水塘。",
      "next": "n8a",
      "scene": "chengdu_s05"
    },
    "n8a": {
      "type": "narrate",
      "text": "几个村里的孩子，正抱着散落的茅草往竹林里跑。",
      "next": "n8b"
    },
    "n8b": {
      "type": "choice",
      "npc": true,
      "question": "孩子们抱着茅草跑远了。你想怎么做？",
      "options": [
        {
          "text": "（追上去，把茅草要回来）",
          "actionOnly": true,
          "next": "n8c"
        },
        {
          "text": "（站在原地，看杜甫怎么反应）",
          "actionOnly": true,
          "next": "n8d"
        }
      ]
    },
    "n8c": {
      "type": "narrate",
      "text": "你追出去，几个孩子跑得飞快，一转眼就钻进了竹林。你空着手回来。",
      "next": "n8e"
    },
    "n8d": {
      "type": "narrate",
      "text": "杜甫也追了两步，喊了一声。风太大，声音散在风里。孩子们头也不回，跑进了竹林。",
      "next": "n8e"
    },
    "n8e": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他拄着竹竿站住，喘着气，冲你摆了摆手）算了。（顿了顿）我喊得唇焦口燥，他们也不听。几个孩子，抱去就抱去吧。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "他拄着杖，慢慢走回院子里，在门槛上坐下来，望着被掀了顶的茅屋，长长叹了口气。",
      "next": "n9a"
    },
    "n9a": {
      "type": "narrate",
      "text": "没过多久，风忽然停了。天却一下子暗下来，乌云压得很低，秋天的天色，昏黑一片。",
      "next": "n10",
      "scene": "chengdu_s06"
    },
    "n10": {
      "type": "narrate",
      "text": "入夜，雨下起来了。屋顶没了草，雨水顺着房梁往下淌，床头那块地方，漏得没有一处是干的。",
      "next": "n10a",
      "scene": "chengdu_s07"
    },
    "n10a": {
      "type": "narrate",
      "text": "屋里那床被子，盖了多年，冷硬得像铁。孩子睡相不好，一脚蹬过去，被里子都裂开了。",
      "next": "n10b"
    },
    "n10b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他摸黑坐着，声音很低）这被子，还是当年从长安带出来的。（停了停）孩子冻得睡不着，我这个做父亲的，连一床干被子都给不了他。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "雨脚如麻，一夜没停。他靠着墙，睁着眼，从入夜一直坐到深夜。",
      "next": "n11a",
      "scene": "chengdu_s08"
    },
    "n11a": {
      "type": "choice",
      "npc": true,
      "question": "这一夜，他睁着眼没睡。你想做点什么？",
      "options": [
        {
          "text": "（陪他坐着，听雨）",
          "actionOnly": true,
          "next": "n11b"
        },
        {
          "text": "（把自己的外衣盖在孩子身上）",
          "actionOnly": true,
          "next": "n11c"
        },
        {
          "text": "（问他）在想什么？",
          "next": "n11d"
        }
      ]
    },
    "n11b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他没说话，只是往旁边挪了挪，给你让出一点干的地方）自经丧乱，我就少有睡得安稳的时候。这一夜，又长。",
      "next": "n12"
    },
    "n11c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他看着你给孩子盖衣裳，半晌才道）多谢。（停了停）可这天下，还有多少孩子，今夜连这样的破屋都没有。",
      "next": "n12"
    },
    "n11d": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他望着漏雨的屋顶，慢慢道）我在想，这一夜，怎么就这么长。长夜沾湿，何时才是个头。",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "雨还在下。他忽然坐直了身子，望着漆黑的屋顶，像是想通了什么。",
      "next": "n12a",
      "scene": "chengdu_s09"
    },
    "n12a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他一字一句，声音不大，却压过了雨声）\"安得广厦千万间，大庇天下寒士俱欢颜，风雨不动安如山。\"——若真有那一天，我这草堂，破了又何妨。",
      "next": "n12_card"
    },
    "n12_card": {
      "type": "anchorCard",
      "anchor": "a17",
      "next": "n13"
    },
    "n13": {
      "type": "aiFree",
      "prompt": "你在成都草堂，与杜甫一起经历了春日的菜地和秋夜的破屋。他写下了《春夜喜雨》的温润，也熬过了《茅屋为秋风所破歌》里那一夜的长雨。你可以问他草堂的日子、种菜的琐事、破屋的夜晚、对天下寒士的念头。",
      "hint": "你可以问：草堂的生活、种菜的事、孩子的近况、破屋那夜的感受、严武的来信……",
      "suggestions": [
        "这篱笆和菜地，都是您亲手弄的？",
        "屋顶破了那夜，您想了些什么？",
        "听说严武那边来了信？"
      ],
      "scene": "chengdu",
      "minRounds": 1,
      "next": "n14"
    },
    "n14": {
      "type": "reflect",
      "lines": [
        "秋天没过完，严武那边就来了信。",
        "他看完信，在溪边站了很久。回来对你说的第一句话，是\"这院子里的菜，怕是要荒了\"。",
        "走的那天，他把院门轻轻带上，回头看了那几间茅屋一眼。"
      ],
      "next": "__end__"
    }
  }
};

quests['kuizhou'] = {
  "id": "kuizhou",
  "title": "夔州 · 登高",
  "range": "766–768",
  "place": {
    "name": "夔州白帝城",
    "year": "766–768年"
  },
  "scene": "kuizhou",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "船出了三峡，江面忽然宽了。两岸的峭壁向后退去，天一下子大起来。",
      "scene": "kuizhou",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "他站在船头，指着前头一处高台说，到了。那是白帝城。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "他把行李往岸上一放，没急着找住处，先拄着杖，往那处高台走去。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "台很高，石阶又陡又窄。他走得很慢，走几步就得扶一扶旁边的石头。",
      "next": "n2a",
      "scene": "kuizhou_s02"
    },
    "n2a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（喘着气，回头冲你摆摆手）不急。这台阶，比当年泰山的还陡。（停了停）不过总得上去。",
      "next": "n2b"
    },
    "n2b": {
      "type": "choice",
      "npc": true,
      "question": "石阶又陡又长，他走得很吃力。你想怎么做？",
      "options": [
        {
          "text": "（上前扶住他的胳膊）",
          "actionOnly": true,
          "next": "n2c"
        },
        {
          "text": "（走在他前头，替他挡一挡风）",
          "actionOnly": true,
          "next": "n2d"
        },
        {
          "text": "（跟在他身后，不催他）",
          "actionOnly": true,
          "next": "n2e"
        }
      ]
    },
    "n2c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他扶着你的胳膊，往上走了几步）这几年的腿脚，是一年不如一年了。（顿了顿）从前登泰山，我走在最前头。",
      "next": "n3"
    },
    "n2d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他看着你走在前头，笑了一下）你这走法，倒像年轻时的我。（喘了口气）那时候，什么山都敢往顶上爬。",
      "next": "n3"
    },
    "n2e": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他回头见你落在后面，也放慢了步子）不急。这山又不会跑。（停了停）倒是人，跑不了多久了。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "上了台顶，风一下子大起来。他扶着栏杆站定，衣袂被吹得翻飞。",
      "next": "n3a",
      "scene": "kuizhou_s03"
    },
    "n3a": {
      "type": "narrate",
      "text": "脚下是奔腾的长江，两岸峭壁如削。峡里传来几声猿啼，一声接一声，凄厉得很。",
      "next": "n3b"
    },
    "n3b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他侧耳听了一阵）听见没有？峡里的猿。（顿了顿）这几年，我耳朵不太行了。可这猿声，倒还听得清。",
      "next": "n4"
    },
    "n4": {
      "type": "choice",
      "npc": true,
      "question": "风急猿哀，他站在高台上。你想说点什么？",
      "options": [
        {
          "text": "这风，吹得人站不稳。",
          "next": "n4a"
        },
        {
          "text": "（陪他一起听那猿声）",
          "actionOnly": true,
          "next": "n4b"
        },
        {
          "text": "您一个人，常来这儿吗？",
          "next": "n4c"
        }
      ]
    },
    "n4a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他扶着栏杆，身子微微晃了晃）风急，天就高。（抬头看了看）你看这天，比在平地上看，要空得多。",
      "next": "n5"
    },
    "n4b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他也静下来听，好一会儿才开口）猿啸哀。（停了停）这三个字，我琢磨了好几天，今日才听出那个\"哀\"字。",
      "next": "n5"
    },
    "n4c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）常来。心里烦闷时，就来站一站。（顿了顿）风吹一吹，江听一听，那些放不下的，也就淡了。",
      "next": "n5"
    },
    "n5": {
      "type": "narrate",
      "text": "他低头望向江面。江心一块沙洲，水清沙白，几只水鸟在上头盘旋，飞起来，又落下去。",
      "next": "n5a",
      "scene": "kuizhou_s04"
    },
    "n5a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（指着那沙洲）\"渚清沙白鸟飞回\"。（顿了顿）你看那鸟，飞起来，又落下去。跟我一样，飞不远，也落不定。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "一阵风过，满山的落叶萧萧而下，铺天盖地，望不到边。",
      "next": "n6a",
      "scene": "kuizhou_s05"
    },
    "n6a": {
      "type": "narrate",
      "text": "他抬头看着那些落叶，看了很久。",
      "next": "n6b"
    },
    "n6b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（缓缓道）\"无边落木萧萧下\"。（停了停）我这一生，就像这落叶。飘到哪儿，都只是个客。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "他转过身，望向脚下的大江。江水滚滚东去，一眼望不到头。",
      "next": "n7a",
      "scene": "kuizhou_s06"
    },
    "n7a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他望着江，声音忽然沉下来）\"不尽长江滚滚来\"。（停了停）这江流了几千年，看尽了人间多少悲欢。我这点苦，算不得什么。",
      "next": "n8"
    },
    "n8": {
      "type": "choice",
      "npc": true,
      "question": "落叶无边，长江不尽。他站在中间，久久不语。你想说点什么？",
      "options": [
        {
          "text": "（陪他一起望着那不尽的长江）",
          "actionOnly": true,
          "next": "n8a"
        },
        {
          "text": "这江，比人活得久。",
          "next": "n8b"
        },
        {
          "text": "（把外衣解下来，披在他肩上）",
          "actionOnly": true,
          "next": "n8c"
        }
      ]
    },
    "n8a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他没说话，只是往你这边靠了靠。风大，两个人挨着，稳一些）",
      "next": "n9"
    },
    "n8b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（点头）是啊。人在江边站一站，才知道自己有多小。（顿了顿）可小归小，总还得站着。",
      "next": "n9"
    },
    "n8c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他拢了拢衣服，看了你一眼）多谢。（停了停）这几年，身边的人，走一个少一个。",
      "next": "n9"
    },
    "n9": {
      "type": "narrate",
      "text": "风越来越急，天色也暗下来了。他扶着栏杆，慢慢转过身，望着来路的方向。",
      "next": "n9a",
      "scene": "kuizhou_s07"
    },
    "n9a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他忽然轻声念）\"万里悲秋常作客，百年多病独登台。\"（停了停）万里，百年。一个说地方，一个说日子。合在一起，就是我这一辈子。",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "他抬手摸了摸自己的鬓角，白的多，黑的少了。",
      "next": "n10a",
      "scene": "kuizhou_s08"
    },
    "n10a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（自嘲地笑了一下）\"艰难苦恨繁霜鬓\"。（顿了顿）这些年，苦头吃了不少，头发也白了不少。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "台边有个卖酒的小摊。他看了一眼那酒旗，站了一会儿，又收回了目光。",
      "next": "n11a",
      "scene": "kuizhou_s09"
    },
    "n11a": {
      "type": "choice",
      "npc": true,
      "question": "他看着那酒摊，却没走过去。你想说什么？",
      "options": [
        {
          "text": "（问）不喝一杯么？",
          "next": "n11b"
        },
        {
          "text": "（什么也不说，陪他站着）",
          "actionOnly": true,
          "next": "n11c"
        }
      ]
    },
    "n11b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（摇头）\"潦倒新停浊酒杯\"。（停了停）大夫说，我这身子，不能再喝了。从前还能借酒浇愁，如今连这个也没了。",
      "next": "n12"
    },
    "n11c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不问，反倒自己开口）\"潦倒新停浊酒杯\"。（苦笑）连酒都喝不动了。（停了停）可我还站在这儿，还能把这江天，看个清清楚楚。",
      "next": "n12"
    },
    "n12": {
      "type": "narrate",
      "text": "风把他的衣角吹得猎猎作响。他站直了身子，把这一首，从头到尾，一字一句，念了一遍。",
      "next": "n12a",
      "scene": "kuizhou_s10"
    },
    "n12a": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（一字一句）\"风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。\"",
      "next": "n12_card"
    },
    "n12_card": {
      "type": "anchorCard",
      "anchor": "a18",
      "next": "n13"
    },
    "n13": {
      "type": "choice",
      "npc": true,
      "question": "这一首念完，他站在那里，久久没动。你作何感想？",
      "options": [
        {
          "text": "\"万里悲秋常作客\"，读得人心里发疼。",
          "next": "n13a"
        },
        {
          "text": "这一生，太苦了。",
          "next": "n13b"
        },
        {
          "text": "（望着那不尽的长江，说不出话）",
          "actionOnly": true,
          "next": "n13c"
        }
      ]
    },
    "n13a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）这\"常作客\"三个字，我琢磨了一辈子。客居他乡，身不由己，落叶归根，我却不知该归向何处。",
      "next": "n14"
    },
    "n13b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（苦笑）苦吗？苦。可若没有这苦，我也写不出这些句子。（顿了顿）老天给了我这颠沛的一生，也给了我一支能写下它的笔。",
      "next": "n14"
    },
    "n13c": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（也沉默地望着江面）这长江，流了几千年。我这点苦，算不得什么。",
      "next": "n14"
    },
    "n14": {
      "type": "talk",
      "emotion": "serious",
      "npc": true,
      "text": "（他缓缓转过头，眼里有光）可我从没后悔过。做官不成，却写成了诗；没能安天下，却记下了这个时代。",
      "next": "n14a",
      "scene": "kuizhou_s11"
    },
    "n14a": {
      "type": "talk",
      "emotion": "joy",
      "npc": true,
      "text": "（忽然笑了，笑得苍凉而坦然）你看，我连酒都喝不动了。可我还能站在这高处，把这江天，看个清清楚楚。",
      "next": "n15"
    },
    "n15": {
      "type": "aiFree",
      "prompt": "你与晚年的杜甫在白帝城头登高。他刚吟成《登高》，正回望自己颠沛的一生，苍凉而坦然。你可以问他此刻的心境、对一生的回望、对诗与不朽的看法。",
      "hint": "你可以问：《登高》的写作、一生的回望、对苦难的态度、对诗的看法……",
      "suggestions": [
        "这一生，最放不下的是什么？",
        "您后悔过吗？",
        "接下来，还要往哪里去？"
      ],
      "scene": "kuizhou",
      "minRounds": 1,
      "next": "n16"
    },
    "n16": {
      "type": "reflect",
      "lines": [
        "江风猎猎，卷着不尽的长江，滚滚东去。",
        "他在台上站了很久，一直到天擦黑，才肯下来。",
        "下台阶的时候，他把那根竹杖留在了台上。说，用不着了。",
        "走的时候，他回头看了一眼白帝城，没说话。"
      ],
      "next": "__end__"
    }
  }
};

quests['jingzhou'] = {
  "id": "jingzhou",
  "title": "岳阳 · 登岳阳楼",
  "range": "768 冬",
  "place": {
    "name": "岳阳",
    "year": "768年冬"
  },
  "scene": "jingzhou",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "船在江上走了好些天。这天傍晚，船家说，岳阳到了。",
      "scene": "jingzhou",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "你掀开船帘，远处城郭的轮廓浮在暮色里，城头一座高楼，飞檐翘角。那就是岳阳楼。",
      "next": "n1b",
      "scene": "jingzhou_s02"
    },
    "n1b": {
      "type": "narrate",
      "text": "船尾的舱里，杜甫半靠着，身上裹着一床薄毯。他瘦得厉害，隔一会儿就咳一声。妻子在船头生火，烟熏得她直揉眼。",
      "next": "n2",
      "scene": "jingzhou_s03"
    },
    "n2": {
      "type": "narrate",
      "text": "听见船家报岳阳，他撑着坐起来，往岸上望了望。",
      "next": "n2a",
      "scene": "jingzhou_s04"
    },
    "n2a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（声音有点哑）岳阳楼……\"昔闻洞庭水，今上岳阳楼\"。我打小就听人说起这座楼，却一直没登上过。",
      "next": "n2b"
    },
    "n2b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他试着站起来，晃了一下，扶住船舷）今日既到了楼下，不上去看看，怕是再没机会了。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "登楼的石阶又高又陡。他走得很慢，走几步就得停一停，一手拄杖，一手扶着你的胳膊。",
      "next": "n3a",
      "scene": "jingzhou_s05"
    },
    "n3a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（喘着气，自嘲地笑笑）你看我这副样子，上个楼，比当年登泰山还费劲。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "到了楼上，他扶着栏杆站定。眼前豁然一开——洞庭湖烟波浩渺，水天相接，一眼望不到边。",
      "next": "n4a",
      "scene": "jingzhou_s06"
    },
    "n4a": {
      "type": "narrate",
      "text": "他愣愣地看了很久，风把他的手吹得冰凉，他却一动不动。",
      "next": "n5"
    },
    "n5": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他缓缓开口，一字一句）\"吴楚东南坼，乾坤日夜浮。\"——这湖把吴楚从中裂开，天地日月，都浮在这水面上。",
      "next": "n5a",
      "scene": "jingzhou_s07"
    },
    "n5a": {
      "type": "narrate",
      "text": "他说完，忽然沉默了。你顺着他的目光看过去，湖面上有一只小船，在浩大的水面里小得像一片叶子。",
      "next": "n6"
    },
    "n6": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他声音低下去）湖这么大，船这么小。老病孤舟……这天地之间，何处才是我安身的地方。",
      "next": "n6a",
      "scene": "jingzhou_s08"
    },
    "n6a": {
      "type": "choice",
      "npc": true,
      "question": "他望着湖面，声音发颤。你想说点什么？",
      "options": [
        {
          "text": "（把外衣解下来，披在他肩上）",
          "actionOnly": true,
          "next": "n7"
        },
        {
          "text": "这景越壮阔，人越孤单。",
          "next": "n7"
        }
      ]
    },
    "n7": {
      "type": "narrate",
      "text": "他拢了拢你披上来的衣服，没说话。湖风把落日的余晖吹散在水面上，碎成一片一片。",
      "next": "n7a",
      "scene": "jingzhou_s09"
    },
    "n7a": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（好一会儿，他才轻声开口）北边还在打仗。我这一家人，连个落脚的地方都没有……（摇了摇头）倒还想着，什么时候能太平。",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "他靠着栏杆，慢慢闭上眼睛。你不知道他是在看湖，还是在想什么别的事。",
      "next": "n8_card",
      "scene": "jingzhou_s10"
    },
    "n8_card": {
      "type": "anchorCard",
      "anchor": "a19",
      "next": "n9"
    },
    "n9": {
      "type": "reflect",
      "lines": [
        "湖风渐起，浪拍在楼下的石基上，碎了又起。",
        "他在楼上站了很久，一直到天擦黑，才肯下楼。",
        "下楼的步子比上楼时更慢。每下一级，都要扶着栏杆歇一歇。",
        "回到船上，他说，往南走吧。"
      ],
      "next": "__end__"
    }
  }
};

quests['tanzhou'] = {
  "id": "tanzhou",
  "title": "潭州 · 江南逢李龟年",
  "range": "770 春",
  "place": {
    "name": "潭州",
    "year": "770年春"
  },
  "scene": "tanzhou",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "潭州的江边，春色正浓。你还没走到码头，就听见了歌声。",
      "scene": "tanzhou",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "那歌声不高，断断续续，像是从很远的地方飘过来的。唱的是一首旧曲，你隐约觉得耳熟。",
      "next": "n1b"
    },
    "n1b": {
      "type": "choice",
      "npc": true,
      "question": "歌声从江边的方向传来。你想怎么做？",
      "options": [
        {
          "text": "（循着歌声走过去）",
          "actionOnly": true,
          "next": "n1c"
        },
        {
          "text": "（站住，先听一会儿）",
          "actionOnly": true,
          "next": "n1d"
        }
      ]
    },
    "n1c": {
      "type": "narrate",
      "text": "你循着歌声走过去。江亭里坐着两个人，一个抱着琵琶，低着头，边弹边唱；另一个靠着亭柱，闭着眼在听。",
      "next": "n2"
    },
    "n1d": {
      "type": "narrate",
      "text": "你站住，听了一会儿。曲子很旧，唱得也不高，可一句一句，都咬得很准。听了一阵，你才顺着声音走过去。",
      "next": "n1e"
    },
    "n1e": {
      "type": "narrate",
      "text": "江亭里坐着两个人，一个抱着琵琶，低着头，边弹边唱；另一个靠着亭柱，闭着眼在听。",
      "next": "n2"
    },
    "n2": {
      "type": "narrate",
      "text": "听歌的那位，须发都白了。你走近几步，他睁开眼，看见你，轻轻抬了抬手——是杜甫。",
      "next": "n2a",
      "scene": "tanzhou_s02"
    },
    "n2a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（压低声音，朝你比了个手势）别出声。听他唱完这一折。",
      "next": "n3"
    },
    "n3": {
      "type": "narrate",
      "text": "你在亭边站住。弹琵琶的那位，嗓子已经有些沙了，可指法还在，一拨一挑，清清楚楚。",
      "next": "n3a",
      "scene": "tanzhou_s03"
    },
    "n3a": {
      "type": "choice",
      "npc": true,
      "question": "一折唱到一半。你注意的是什么？",
      "options": [
        {
          "text": "（看弹琵琶的人）",
          "actionOnly": true,
          "next": "n3b"
        },
        {
          "text": "（看杜甫）",
          "actionOnly": true,
          "next": "n3c"
        },
        {
          "text": "（看江上的落花）",
          "actionOnly": true,
          "next": "n3d"
        }
      ]
    },
    "n3b": {
      "type": "narrate",
      "text": "弹琵琶的是个老人，指节粗大，一看就是弹了一辈子的手。眼睛半闭着，唱到高处，眉头会轻轻皱一下。",
      "next": "n4"
    },
    "n3c": {
      "type": "narrate",
      "text": "杜甫一动不动。可他放在膝上的那只手，正跟着拍子，一下一下地轻轻敲着。",
      "next": "n4"
    },
    "n3d": {
      "type": "narrate",
      "text": "江边的花正落着。风一过，就是一阵，落在水面上，跟着水流慢慢走远。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "一曲唱完，弹琵琶的人放下手，久久没动。江上的落花，一片一片飘下来，落在他的琴上。",
      "next": "n4a"
    },
    "n4a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（杜甫这才开口，声音很轻）唱完了。（转头对你）你来得正好。这位，是李龟年。",
      "next": "n5"
    },
    "n5": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（李龟年抬起头，看了看杜甫，又看了看你，笑了笑）老了，嗓子不如从前了。（对杜甫）你倒还记得这首曲子。",
      "next": "n5a"
    },
    "n5a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（杜甫也笑）怎么不记得。当年在岐王府里，听过你唱。（顿了顿）那时觉得，这曲子能唱一辈子。",
      "next": "n6"
    },
    "n6": {
      "type": "choice",
      "npc": true,
      "question": "两位老人在亭中重逢。你想说点什么？",
      "options": [
        {
          "text": "（在亭边坐下，听他们说话）",
          "actionOnly": true,
          "next": "n6a"
        },
        {
          "text": "这曲子，如今还有人听么？",
          "next": "n6b"
        },
        {
          "text": "（问李龟年）这曲子，是从宫里传出来的？",
          "next": "n6c"
        }
      ]
    },
    "n6a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（李龟年端起茶，慢慢喝了一口）这首曲子，宫里散了之后，我背着琴，走了大半个南方。听得懂的人，越来越少了。",
      "next": "n7"
    },
    "n6b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（李龟年摇头）少。（指了指江面）如今的人，爱听热闹的调子。这种曲，也就是我们这些老家伙，还记着。",
      "next": "n7"
    },
    "n6c": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（李龟年点头）《霓裳羽衣曲》。当年宫里排演，我在场。（停了停）如今宫里没了，曲子还在。人没了，曲子也还在。",
      "next": "n7"
    },
    "n7": {
      "type": "narrate",
      "text": "江风起了，落花一阵一阵地飘。李龟年把琴抱起来，说要再唱一段。",
      "next": "n7a",
      "scene": "tanzhou_s04"
    },
    "n7a": {
      "type": "narrate",
      "text": "这一次唱的是一首更老的曲子。杜甫听着听着，目光越过江亭，落到远处的江面上，出了神。",
      "next": "n8"
    },
    "n8": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（他忽然轻声念）\"岐王宅里寻常见，崔九堂前几度闻。正是江南好风景，落花时节又逢君。\"",
      "next": "n8_card"
    },
    "n8_card": {
      "type": "anchorCard",
      "anchor": "a20",
      "next": "n9"
    },
    "n9": {
      "type": "choice",
      "npc": true,
      "question": "这四句诗，念得很轻。你作何感想？",
      "options": [
        {
          "text": "一个\"又\"字，压着四十年的光景。",
          "next": "n9a"
        },
        {
          "text": "这诗里，藏着一个时代的落幕。",
          "next": "n9b"
        },
        {
          "text": "（把这几句记在心里，没说话）",
          "actionOnly": true,
          "next": "n9c"
        }
      ]
    },
    "n9a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他点头）当年在岐王宅、崔九堂，听他的歌，是常事。如今再听见，中间隔着一场乱子。（顿了顿）\"又\"字，重在这里。",
      "next": "n10"
    },
    "n9b": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（缓缓点头）一个朝代最繁盛的梦，和我们这些人，都在那场乱子里，一起散了。（望向李龟年）他也老了。",
      "next": "n10"
    },
    "n9c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也不追问，只道）你记着也好。有些句子，当时念着不觉什么，过后再想，就重了。",
      "next": "n10"
    },
    "n10": {
      "type": "narrate",
      "text": "李龟年唱完了，把琴放下，站起身，朝杜甫拱了拱手。两人谁也没多说什么。",
      "next": "n10a"
    },
    "n10a": {
      "type": "choice",
      "npc": true,
      "question": "李龟年要走了。你想做点什么？",
      "options": [
        {
          "text": "（起身送他到亭外）",
          "actionOnly": true,
          "next": "n10b"
        },
        {
          "text": "（坐着，目送他离开）",
          "actionOnly": true,
          "next": "n10c"
        }
      ]
    },
    "n10b": {
      "type": "narrate",
      "text": "你送他到亭外。他朝你点了点头，把琵琶往肩上背了背，顺着江岸走远了。",
      "next": "n11"
    },
    "n10c": {
      "type": "narrate",
      "text": "他走出亭子，江风把他花白的头发吹起来。你没有动，就坐在原处，看着他的背影越来越小。",
      "next": "n11"
    },
    "n11": {
      "type": "narrate",
      "text": "杜甫站在亭边，一直看着李龟年的背影，直到看不见了，才收回目光。",
      "next": "n12"
    },
    "n12": {
      "type": "reflect",
      "lines": [
        "江南的风景，依旧如画。落花还在飘。",
        "一个从开元盛世走来的乐师，一个从开元盛世走来的诗人，在这江亭里碰了一面。",
        "没有抱头痛哭，也没有说不完的话。就唱了一折，听了两折，然后各自散了。",
        "离开江亭的时候，他把那张写着诗稿的纸折好，收进了袖子里。"
      ],
      "next": "__end__"
    }
  }
};

quests['hengzhou'] = {
  "id": "hengzhou",
  "title": "衡州 · 阻水耒阳",
  "range": "770",
  "place": {
    "name": "衡州耒阳",
    "year": "770年"
  },
  "scene": "hengzhou",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "离开潭州没多久，江水就涨了。一连几日的雨，把路都淹了。",
      "scene": "hengzhou",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "船困在耒阳，进退不得。江面上漂着断枝、烂草，浊浪一下一下拍着船帮。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "船舱里，他裹着一床破被，靠着船舷。你走近，他睁开眼，看了你好一会儿，才认出你来。",
      "next": "n2"
    },
    "n2": {
      "type": "talk",
      "emotion": "sad",
      "npc": true,
      "text": "（声音很哑）这江水，来得不是时候。（咳了几声）船走不动，也退不回去。",
      "next": "n2a",
      "scene": "hengzhou_s02"
    },
    "n2a": {
      "type": "narrate",
      "text": "他瘦得厉害，颧骨高高地突出来。船舱角落里搁着半碗冷粥，已经结了一层皮。",
      "next": "n3"
    },
    "n3": {
      "type": "choice",
      "npc": true,
      "question": "他病着，船困着，半碗冷粥搁在那儿。你想做点什么？",
      "options": [
        {
          "text": "（把冷粥端去热一热）",
          "actionOnly": true,
          "next": "n3a"
        },
        {
          "text": "（在他旁边坐下）",
          "actionOnly": true,
          "next": "n3b"
        },
        {
          "text": "（问）县里知道您困在这儿吗？",
          "next": "n3c"
        }
      ]
    },
    "n3a": {
      "type": "narrate",
      "text": "你端着粥出去，在船头生火。风大，火苗晃来晃去，好半天才热了。",
      "next": "n3d"
    },
    "n3b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他往旁边挪了挪，给你腾出点地方）坐吧。（停了停）这船小，两个人挤一挤，倒还暖和些。",
      "next": "n4"
    },
    "n3c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（摇头）前几日，耒阳县令派人送了些米和肉来。（顿了顿）我这条命，倒是靠旁人惦记着，才撑到今日。",
      "next": "n4"
    },
    "n3d": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他接过热粥，捧在手里，暖了一会儿才喝）多谢。（停了停）这几个月，头一回吃上热的东西。",
      "next": "n4"
    },
    "n4": {
      "type": "narrate",
      "text": "雨小了些。他喝完粥，精神似乎好了一点，靠着船舷，望着江面出神。",
      "next": "n4a",
      "scene": "hengzhou_s03"
    },
    "n4a": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（忽然开口）这一路，从洛阳到长安，从成都到夔州，再到这耒阳的江边。（停了停）我走了一辈子，倒像这江水，从没真正停过。",
      "next": "n5"
    },
    "n5": {
      "type": "choice",
      "npc": true,
      "question": "他望着江水，慢慢说着。你想接什么？",
      "options": [
        {
          "text": "这一路，您写了很多诗。",
          "next": "n5a"
        },
        {
          "text": "走了这么多地方，哪一处最像家？",
          "next": "n5b"
        },
        {
          "text": "（不打断，听他说下去）",
          "actionOnly": true,
          "next": "n5c"
        }
      ]
    },
    "n5a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（点头）写了不少。（停了停）从前写诗，是想让人看见。后来写诗，是怕自己忘了。",
      "next": "n6"
    },
    "n5b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了很久）成都草堂吧。那几年，院子里有菜，溪里有鸭子，孩子能吃饱。（顿了顿）可惜，也没住长。",
      "next": "n6"
    },
    "n5c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不接话，反倒说得更慢）年轻时候，总觉得前面还有好日子。如今才知道，好日子是过一天少一天。",
      "next": "n6"
    },
    "n6": {
      "type": "narrate",
      "text": "他忽然咳嗽起来，咳了好一阵，才慢慢平下去。",
      "next": "n6a",
      "scene": "hengzhou_s04"
    },
    "n6a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（喘匀了气，望着你）若你往后还能想起我，不必想这个病倒在船上的糟老头子。（停了停）就想想泰山顶上那个青年吧——那才是我。",
      "next": "n7"
    },
    "n7": {
      "type": "choice",
      "npc": true,
      "question": "他说完，望着江面，不再说话。你想做点什么？",
      "options": [
        {
          "text": "（把破被往上拉了拉，替他盖好）",
          "actionOnly": true,
          "next": "n7a"
        },
        {
          "text": "（问）您还有什么放不下的吗？",
          "next": "n7b"
        },
        {
          "text": "（陪他一起，望着江面）",
          "actionOnly": true,
          "next": "n7c"
        }
      ]
    },
    "n7a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他任你盖好被子，闭了闭眼）多谢。（停了停）这些年，擦肩而过的人不少；到了今日，还能在我身边坐一坐的故人，没几个。",
      "next": "n8"
    },
    "n7b": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（想了很久）放不下的，倒也不是什么大事。（停了停）就是想知道，北边什么时候能太平。",
      "next": "n8"
    },
    "n7c": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他见你不说话，也安静下来。两个人就这么望着江，听着水声）",
      "next": "n8"
    },
    "n8": {
      "type": "narrate",
      "text": "几天后，雨停了，水退了一些。船又能动了。",
      "next": "n8a",
      "scene": "hengzhou_s05"
    },
    "n8a": {
      "type": "narrate",
      "text": "船家问，往哪儿走。他靠在船舷上，想了很久。",
      "next": "n8b"
    },
    "n8b": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（轻声）往南吧。（顿了顿）听说湘江那边，水势缓一些。",
      "next": "n9"
    },
    "n9": {
      "type": "reflect",
      "lines": [
        "江水滔滔，一声一声，拍着那条被拦住的小船。",
        "他病着，饿着，却依然平静。一个写尽人间疾苦的诗人，到最后，连自己这一场病，都看得这样淡。",
        "船又动了。往南，湘江。",
        "他把破被裹紧了些，靠着船舷，闭上了眼睛。"
      ],
      "next": "__end__"
    }
  }
};

quests['xiangjiang'] = {
  "id": "xiangjiang",
  "title": "湘江 · 孤舟绝笔",
  "range": "770",
  "place": {
    "name": "湘江",
    "year": "770年"
  },
  "scene": "xiangjiang",
  "start": "n1",
  "nodes": {
    "n1": {
      "type": "narrate",
      "text": "湘江之上，夜色如墨，江水平得像一面镜子。",
      "scene": "xiangjiang",
      "next": "n1a"
    },
    "n1a": {
      "type": "narrate",
      "text": "江心一艘破旧的小船，随波轻轻晃。船头挂着一盏将熄的灯。",
      "next": "n1b"
    },
    "n1b": {
      "type": "narrate",
      "text": "灯下有人。你走近，还没开口，船里先传来一声很轻的咳嗽。",
      "next": "n1c"
    },
    "n1c": {
      "type": "narrate",
      "text": "他抬起头，看了你一会儿，才认出来。",
      "next": "n2"
    },
    "n2": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他张了张嘴，声音很哑）……是你。（停了停）坐吧。船小，别碰着灯。",
      "next": "n2a",
      "scene": "xiangjiang_s02"
    },
    "n2a": {
      "type": "narrate",
      "text": "你在船尾坐下。他裹着一床薄被，瘦得只剩一把骨头，只有眼睛还亮着。",
      "next": "n3"
    },
    "n3": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他望着江面，很久才开口）这几天，水一直涨。船走不了，也退不回去。（笑了一下）倒像我这一辈子。",
      "next": "n3a",
      "scene": "xiangjiang_s03"
    },
    "n3a": {
      "type": "narrate",
      "text": "灯芯爆了一下。他伸手把灯往你那边挪了挪，动作很慢。",
      "next": "n4"
    },
    "n4": {
      "type": "talk",
      "emotion": "thoughtful",
      "npc": true,
      "text": "（他忽然道）我这一辈子，是从一只凤凰起头的。（顿了顿）那时候以为，立志做凤凰，就是要飞得高、做大事。",
      "next": "n4a",
      "scene": "xiangjiang_s04"
    },
    "n4a": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他摇了摇头，没再说下去。过了好一会儿，才轻声补了一句）后来才明白，凤凰不是飞得高。是落了地，还肯再飞。",
      "next": "n5"
    },
    "n5": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他转过头看你）这些年，每逢我走到人生的关口，总还能再见到你。（喘了口气）洛阳、泰山、长安、成都……我这辈子走了太多地方，身边的人，走一个少一个。",
      "next": "n5a",
      "scene": "xiangjiang_s05"
    },
    "n5a": {
      "type": "narrate",
      "text": "他没再说下去。江上起了一点风，灯影晃了晃。",
      "next": "n6"
    },
    "n6": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他伸手，从枕下摸出一卷纸，递过来）这个，你收着。写得乱，别嫌。",
      "next": "n6a",
      "scene": "xiangjiang_s06"
    },
    "n6a": {
      "type": "narrate",
      "text": "你展开看。纸已经磨得起了毛边，上面是他的字，一笔一划，比年轻时慢了很多。",
      "next": "n7"
    },
    "n7": {
      "type": "talk",
      "emotion": "calm",
      "npc": true,
      "text": "（他闭上眼，声音越来越轻）诗……都写完了。（停了很久）不悔。",
      "next": "n8",
      "scene": "xiangjiang_s07"
    },
    "n8": {
      "type": "reflect",
      "lines": [
        "江水平静，灯还亮着。",
        "他睡着了，手里那卷纸的一角，还搭在你手上。",
        "你替他把被角掖好。船外的夜色，一点一点淡下去。",
        "",
        "你们一次次相遇，从洛阳的庭院，到泰山的云海，到长安的榜下，到奉先的雪，到成都的草堂，再到这湘江的船上。",
        "你见过他得意，见过他落魄，见过他饿着肚子把最后几颗橡栗分给妻儿，也见过他在草堂里为一间破屋写下\"安得广厦千万间\"。",
        "他这一生没做成什么大官，也没等到天下太平。可他把自己看到的、痛过的、爱过的，一个字都没藏地写了下来。",
        "往后的年月，会有很多人读他的诗。而你记住的，是这条江上，一盏将熄的灯，和一个把最后一卷诗塞进你手里的老人。"
      ],
      "next": "n9",
      "scene": "xiangjiang_s08"
    },
    "n9": {
      "type": "anchorCard",
      "anchor": "a21",
      "next": "__end__"
    }
  }
};

module.exports = quests;
