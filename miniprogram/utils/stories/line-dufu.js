// utils/stories/line-dufu.js —— 「杜甫」故事线数据（独立文件，与其他古人解耦）
//
// 一条故事线包含：
//   periods    : 时期列表（story 页卡牌）
//   quests     : 各时期的剧情节点（chat 页引擎）
//   scenes     : 场景图（单图，兼容旧字段）
//   sceneSets  : 多场景映射（节点级切换）
//   npcImage   : NPC 默认立绘
//   periodNpcImages : 各时期基准立绘（年龄递进）
//   anchors    : 知识锚点名称表
//
// 节点类型：narrate(旁白) | talk(对话) | choice(选项) | aiFree(自由AI对话) | reflect(结尾讲述)
// 节点通过 next 串联；choice 每个选项有独立 next；scene 字段驱动背景切换。

// ============ 场景图 ============
// 说明：场景图已压缩为 JPG（约 300-500KB/张），NPC 立绘保留 PNG（透明通道）
// 图片已迁移云存储，路径由 img() 运行时拼接（避免编译器静态打包触发 ENOENT），
// 完整路径再由 cloudAssets 解析为云链接。
const IMG = '/assets/' + 'images/';
function img(sub) { return IMG + sub; }
const SCENES = {
  p1: img('scenes/scene-p1-arrive.jpg'),
  p2: img('scenes/scene-p2-changan.jpg'),
  p3: img('scenes/scene-p3-war.jpg'),
  p4: img('scenes/scene-p4-caotang.jpg')
};

const SCENE_SETS = {
  p1: {
    arrive:  img('scenes/scene-p1-arrive.jpg'),   // 穿越落地·晨雾山道
    luoyang: img('scenes/scene-p1-luoyang.jpg'),  // 回忆·洛阳书斋（七岁咏凤凰）
    jiangnan:img('scenes/scene-p1-jiangnan.jpg'), // 回忆·吴越烟雨
    luodi:   img('scenes/scene-p1-luodi.jpg'),    // 落榜·贡院放榜
    qiqi:    img('scenes/scene-p1-qiqi.jpg'),     // 齐赵·纵马原野
    taishan: img('scenes/scene-p1-taishan.jpg'),  // 泰山绝顶·云海日出
    libai:   img('scenes/scene-p1-libai.jpg')     // 想象·月下对饮遇李白
  },
  p2: {
    changan: img('scenes/scene-p2-changan.jpg'),   // 长安朱雀大街·放榜
    luodi2:  img('scenes/scene-p2-luodi.jpg'),     // 回忆·贡院榜下空无一人（野无遗贤）
    ganxie:  img('scenes/scene-p2-ganxie.jpg'),    // 回忆·权贵朱门前献诗（朝扣富儿门）
    bingche: img('scenes/scene-p2-bingche.jpg'),   // 回忆·咸阳桥征兵百姓哭送（兵车行）
    liren:   img('scenes/scene-p2-liren.jpg'),     // 回忆·曲江杨氏兄妹骄奢（丽人行）
    tavern:  img('scenes/scene-p2-tavern.jpg')     // 小酒肆·借酒消愁（aiFree）
  },
  p3: {
    war:      img('scenes/scene-p3-war.jpg'),      // 开场·沦陷的长安（烽烟断墙）
    street:   img('scenes/scene-p3-street.jpg'),   // 现实·城中街巷（叛军巡逻）
    yueye:    img('scenes/scene-p3-yueye.jpg'),    // 回忆·鄜州月夜望月忆妻（《月夜》）
    chunwang: img('scenes/scene-p3-chunwang.jpg'), // 回忆·春望城头（国破山河在）
    tao:      img('scenes/scene-p3-tao.jpg'),      // 回忆·金光门出逃（九死一生）
    fengxiang:img('scenes/scene-p3-fengxiang.jpg'),// 回忆·凤翔行在（麻鞋见天子）
    shihao:   img('scenes/scene-p3-shihao.jpg')    // 回忆·石壕村夜（差吏抓人）
  },
  p4: {
    caotang:  img('scenes/scene-p4-caotang.jpg'),  // 现实·成都草堂（浣花溪春色）
    qinzhou:  img('scenes/scene-p4-qinzhou.jpg'),  // 回忆·秦州饥岁（弃官西行）
    chunyu:   img('scenes/scene-p4-chunyu.jpg'),   // 回忆·春夜喜雨（润物细无声）
    autumn:   img('scenes/scene-p4-autumn.jpg'),   // 回忆·秋风破屋（茅屋歌）
    kuizhou:  img('scenes/scene-p4-kuizhou.jpg'),  // 回忆·夔州登高（无边落木）
    xiangjiang:img('scenes/scene-p4-xiangjiang.jpg') // 回忆·孤舟湘江（天地一沙鸥）
  }
};

const NPC_IMAGE = img('npc/dufu-default.png');

const PERIOD_NPC_IMAGES = {
  p0: img('npc/dufu-p0-child.png'),   // 幼年（七岁咏凤凰等少年场景）
  p1: img('npc/dufu-p1-young.png'),
  p2: img('npc/dufu-p2-mid.png'),
  p3: img('npc/dufu-p3-war.png'),
  p4: img('npc/dufu-p4-old.png')
};

// 轻动效单独配置：云端文件未上传或临时链接获取失败时，对话页会自动
// 回退到 PERIOD_NPC_IMAGES，不让新增动图影响原有剧情加载。
const PERIOD_NPC_ANIMATIONS = {
  p0: img('npc/dufu-p0-child-idle.gif'),
  p1: img('npc/dufu-p1-young-idle.gif'),
  p2: img('npc/dufu-p2-mid-idle.gif'),
  p3: img('npc/dufu-p3-war-idle.gif'),
  p4: img('npc/dufu-p4-old-idle.gif')
};

// ============ 时期列表（story 页卡牌） ============
const PERIODS = [
  { id: 'p1', name: '读书壮游', range: '712–745', desc: '少年游历，意气风发', poem: '会当凌绝顶，一览众山小' },
  { id: 'p2', name: '困守长安', range: '746–755', desc: '科场失意，困顿京华', poem: '朝扣富儿门，暮随肥马尘' },
  { id: 'p3', name: '陷贼为官', range: '756–759', desc: '战乱流离，陷身贼中', poem: '国破山河在，城春草木深' },
  { id: 'p4', name: '漂泊西南', range: '759–770', desc: '草堂岁月，漂泊西南', poem: '安得广厦千万间' }
];

// ============ 时期一：读书壮游 ============
// 玩家定位：穿越到唐朝、与少年杜甫萍水相逢的"少年同游者"。
// 抉择点：一期设若干关键节点，1 个"决定性瞬间"带对错(right)，其余为无对错探索。
// 结尾 reflect 为"同游者回望"，只叙述经历，不点破"底色"等标签词。
const QUEST_P1 = {
  id: 'p1',
  title: '读书壮游',
  range: '712–745',
  scene: SCENES.p1,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '你睁开眼，发现自己站在一条陌生的山道上。四周山峦起伏，天高云淡，没有高楼，也没有车马喧嚣。',
      scene: 'arrive',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你低头看看自己——一身粗布衣裳，脚上是一双草鞋。你这才明白：你不在原来的时代了，你来到了唐朝。',
      next: 'n1b'
    },
    n1b: {
      type: 'narrate',
      text: '正当你还有些发懵，远处传来脚步声。一个身背书箧、与你年纪相仿的青年，正朝这边走来。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '这位小兄弟，看你风尘仆仆，也是出门游历的？在下杜甫，字子美。幸会幸会。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '面对这位陌生的同龄人，你的第一反应是？',
      options: [
        { text: '热情地回礼，说自己也是出来闯荡的', next: 'n2b' },
        { text: '好奇地打量他背上的书箧，问他读什么书', next: 'n2c' },
        { text: '还有点发懵，一时不知该怎么开口', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'joy',
      text: '好！出门在外，最难得的就是遇上同道中人。不知小兄弟这一路，可有什么见闻？',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '你问这书箧？里面装的可都是我的宝贝。对了，不瞒你说——我七岁就会写诗了。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '哈哈，不必拘束。我看你也是初到此地吧？先缓一缓，咱们边走边聊。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'joy',
      scene: 'luoyang',
      sceneMode: 'flashback',
      npc: false,
      text: '我七岁时就写下"开口咏凤凰"，九岁能写满一囊大字。祖父杜审言是名满天下的大诗人，家学如此，我哪敢懈怠。倒是你，小兄弟——你七岁的时候，在做些什么？',
      anchor: 'a1',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      question: '听他说七岁便能咏诗，你心里想的是？',
      options: [
        { text: '这该是怎样的家学，才养出这样的少年？', next: 'n5' },
        { text: '七岁咏凤凰，凤凰二字，为何偏偏是凤凰？', next: 'n6' },
        { text: '（暗自惭愧，自己七岁时只会玩）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'luoyang',
      sceneMode: 'flashback',
      npc: false,
      text: '祖父的诗，父亲的家训，还有洛阳城里听不完的歌、看不完的画。我像块吸水的海绵，什么都想装进来。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'joy',
      scene: 'luoyang',
      sceneMode: 'flashback',
      npc: false,
      text: '好眼力！凤凰非梧桐不栖，非醴泉不饮。我那时不懂什么大道理，只觉这鸟儿气度不凡，便脱口而出了。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'calm',
      scene: 'luoyang',
      sceneMode: 'flashback',
      npc: false,
      text: '哈哈，何必惭愧。每个人的路不同，我不过是早走了几步。你这一路走来，定也有你自己的见识。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'calm',
      scene: 'jiangnan',
      sceneMode: 'flashback',
      npc: false,
      text: '我二十岁起游吴越，看尽了烟雨；如今又到齐赵，要登这泰山。读万卷书，行万里路，缺一不可。只是说起科场，我也不瞒你——来齐赵之前，我在洛阳落过一回榜。',
      anchor: 'a2',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      scene: 'luodi',
      sceneMode: 'flashback',
      npc: false,
      question: '洛阳放榜，杜甫名落孙山。若你此刻是他，你会怎么选？',
      options: [
        { text: '留在洛阳，再苦读三年，来年再考', right: false, result: 'n10', feedback: '你替他选了留下。可真实的少年，转头去了齐赵——他的路，不在这一张榜上。' },
        { text: '不去管它，先到齐赵纵马射猎去', right: true, result: 'n11', feedback: '正是。落榜于他，不过是一阵清风，吹过便散了。' },
        { text: '投奔做官的亲戚，先谋个差事', right: false, result: 'n10', feedback: '你替他选了安稳。可他偏偏不肯——年轻的心，还装不下"安稳"二字。' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'calm',
      scene: 'qiqi',
      npc: false,
      text: '我若真这么想，便不是我了。落榜就落榜，我要去齐赵——去射猎，去唱歌，去看看这天下到底有多大。一张榜能困住人半生，却困不住一颗还想走远路的心。',
      next: 'n12'
    },
    n11: {
      type: 'talk',
      emotion: 'joy',
      scene: 'qiqi',
      npc: false,
      text: '你懂我！放榜那日，旁人垂头丧气，我却早把心思飞到了泰山上。人这一生，若只盯着脚下的泥，就看不见头顶的山。走，我们这就动身！',
      next: 'n12'
    },
    n12: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'taishan',
      sceneMode: 'flashback',
      npc: false,
      text: '后来我登上泰山，写下"会当凌绝顶，一览众山小"。你可知那一刻，我在想什么？',
      next: 'n13'
    },
    n13: {
      type: 'choice',
      npc: true,
      question: '登顶泰山时，你猜他心里装的是什么？',
      options: [
        { text: '终于出了口气，扬眉吐气', next: 'n14' },
        { text: '这天下，将来总有我的一席之地', next: 'n15' },
        { text: '山这么高，人这么小，什么都不重要了', next: 'n16' }
      ]
    },
    n14: {
      type: 'talk',
      emotion: 'joy',
      text: '倒也不全是。落第的委屈，早在马背上颠散了。剩下的，是一股说不上来的劲儿——这山我不登，也自有别人登；可我想知道，登上去的人眼里，天下是什么样子。',
      next: 'n17'
    },
    n15: {
      type: 'talk',
      emotion: 'serious',
      text: '说得好。"致君尧舜上，再使风俗淳"——这是我一生的志向。山高人为峰，我偏要站到最高处。只是站上去，不是为了俯瞰，是为了把这天下看得更清楚些。',
      next: 'n17'
    },
    n16: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '你这话倒让我一怔。是啊，山这么高，人这么小……可正因如此，才更想试试，人能走到哪一步。人若没个向上的念想，和这山里的石头，又有什么分别。',
      next: 'n17'
    },
    n17: {
      type: 'talk',
      emotion: 'joy',
      scene: 'libai',
      sceneMode: 'flashback',
      npc: false,
      text: '我听说，李白先生也在这一带游历。若能遇上，定要与他同游一番。你要不要与我同去找他？',
      next: 'n18'
    },
    n18: {
      type: 'choice',
      question: '两个大诗人若真相遇，你猜他们会聊什么？',
      options: [
        { text: '聊诗，聊天下，聊各自的抱负', next: 'n19' },
        { text: '聊喝酒，聊剑术，聊哪里的山最好看', next: 'n20' }
      ]
    },
    n19: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'libai',
      sceneMode: 'flashback',
      npc: false,
      text: '诗与抱负，自然是有的。只是李太白那样的谪仙人，怕是一落座，先要的是酒。',
      next: 'n20a'
    },
    n20: {
      type: 'talk',
      emotion: 'joy',
      scene: 'libai',
      sceneMode: 'flashback',
      npc: false,
      text: '你倒懂他！听说他"自称臣是酒中仙"，剑术也好得很。真要遇上，我恐怕要被他拉着喝上三天三夜。',
      next: 'n20a'
    },
    n20a: {
      type: 'talk',
      emotion: 'calm',
      scene: 'taishan',
      text: '对了，这一路与你说了这许多，还没顾上听你问。你心里若有什么想问的——家世也好，我的诗也好，尽管开口，我定知无不言。',
      next: 'n21'
    },
    n21: {
      type: 'aiFree',
      trap: {
        text: '（抚着腰间旧剑，有些出神）说到年少时的诗，我倒想起一句——"七龄思即壮，开口咏白鹭"。那时节，我还不晓得天有多高。',
        wrong: '开口咏白鹭',
        right: '开口咏凤凰',
        hint: '《壮游》原句作"开口咏凤凰"',
        catchText: '（一怔，随即抚掌）好耳力！是我说岔了——是"开口咏凤凰"，不是白鹭。凤凰这东西，非梧桐不栖、非醴泉不饮，我七岁就敢拿它自比。你说，那时节我狂不狂？',
        anchor: 'a1',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你与少年杜甫同行去泰山，路上闲谈。他意气风发，谈家世、谈壮游、谈抱负。你可以问问他七岁咏诗、吴越齐赵的见闻、《望岳》的心境，或他与李白的相识。',
      hint: '你可以问杜甫：家世、七岁咏诗、壮游路线、泰山与《望岳》……',
      suggestions: ['聊聊您的家世与七岁咏诗', '《望岳》是怎么写出来的？', '落榜之后，您怎么还笑得出来？'],
      minRounds: 1,
      next: 'n22'
    },
    n22: {
      type: 'reflect',
      lines: [
        '临别时，我回头望了望这条我们一起走过的路。',
        '七岁，他在洛阳写下一句"开口咏凤凰"；二十岁，他负笈南下游遍吴越烟雨。',
        '二十四岁那年在洛阳落榜，旁人都垂头丧气，他却兴冲冲地要去泰山看日出。',
        '后来他登上绝顶，写下"会当凌绝顶，一览众山小"。',
        '我那时不懂，一个人怎么能在落榜之后，还笑得那样明亮。',
        '如今想来，他这一生，起于读书，行于万里——心里装着的，从来就不只是一张榜、一场考试。',
        '他心里的东西，比这山还高，比这路还长。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期二：困守长安 ============
// 底色：怀才不遇。玩家定位：与困顿长安的杜甫同历科场黑暗、干谒屈辱与民间疾苦。
// 抉择点：4 个（1 个"决定性瞬间"带对错 + 3 个无对错探索），结尾 reflect 不点破"底色"标签。
const QUEST_P2 = {
  id: 'p2',
  title: '困守长安',
  range: '746–755',
  scene: SCENES.p2,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '天宝六载，长安。放榜之日，朱雀大街的榜下挤满了举子，可那榜上，竟空无一人。',
      scene: 'changan',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你拨开人群，一眼认出了榜前那个青衫书生——正是泰山道上结识的杜甫。数年不见，他清瘦了许多，背影僵直，久久没有回头。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'sad',
      text: '（听见你的声音，回头勉强一笑）小兄弟？是你……数年不见，你怎也到长安了。先别问我——你看这榜，满城举子，竟无一人中式。你可知，这是为何？',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '重逢竟是这般场面，你的第一反应是？',
      options: [
        { text: '这榜……怕不是贴错了？', next: 'n2b' },
        { text: '杜兄，这些年你还好吗？', next: 'n2c' },
        { text: '（望着他，一时说不出话）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'sad',
      text: '我也但愿是贴错了。可那朱笔榜文，写得明明白白——不是没人应试，是不许有人中式。这里头的缘故，说来话长。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'calm',
      text: '好不好的，你且看这榜便知。我自齐赵归来，苦读数年，一心来搏这一榜……到头来，连那榜的边角，都没摸到。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '吓着你了？不必为我难过。这一榜，不只我一人落第，是所有人。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'angry',
      scene: 'luodi2',
      sceneMode: 'flashback',
      npc: false,
      text: '后来我才知道，是宰相李林甫一句"野无遗贤"，说天下贤才早已尽入朝堂，此科竟无一人合格。一场制举，满城举子，尽数做了他谄媚的祭品。',
      anchor: 'a3',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      scene: 'luodi2',
      sceneMode: 'flashback',
      npc: false,
      question: '落榜的真相如此荒唐。若你此刻是他，你会怎么选？',
      options: [
        { text: '咽不下这口气，定要争个明白', right: false, result: 'n5', feedback: '你替他选了争。可真实的他，选择了留下来——不是争一时，是争一世。' },
        { text: '离开这吃人的长安，另谋出路', right: false, result: 'n6', feedback: '你替他选了走。可他偏偏留下——因为这里，有他放不下的天下。' },
        { text: '再苦熬几年，不信没有出头之日', right: true, result: 'n7', feedback: '正是。这一留，就是十年——长安困住了他，也成全了他。' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'serious',
      scene: 'ganxie',
      npc: false,
      text: '争？凭我一介书生，拿什么同当朝宰相争。可我不肯就这么认了——留在长安，总有熬出头的一天。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'ganxie',
      npc: false,
      text: '走？天下之大，又能走到哪去。长安是读书人唯一的进身之处。我不走，我要留下来，看看这城，究竟容不容得下一个"真"字。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'calm',
      scene: 'ganxie',
      npc: false,
      text: '正是。一走了之容易，难的是留下。我留下来了——这一留，便是十年。十年长安，我见尽了人世的凉薄。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'sad',
      scene: 'ganxie',
      sceneMode: 'flashback',
      npc: false,
      text: '为了谋个出身，我常到权贵门前献诗。"朝扣富儿门，暮随肥马尘。残杯与冷炙，到处潜悲辛。"你可知，读书人跪着求人，是什么滋味？',
      anchor: 'a6',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      question: '听他说起干谒的屈辱，你心里想的是？',
      options: [
        { text: '为了抱负，这点委屈不算什么', next: 'n10' },
        { text: '这样求人，值得吗？', next: 'n11' },
        { text: '（想起自己也曾低声下气求过什么）', next: 'n12' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'bingche',
      sceneMode: 'flashback',
      npc: false,
      text: '是啊，受点委屈不算什么。可当我看见咸阳桥上，白发人送别从军的儿郎——"信知生男恶，反是生女好"——我才明白，这世道的苦，远不止我一人受。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'sad',
      scene: 'bingche',
      sceneMode: 'flashback',
      npc: false,
      text: '不值得。可放眼这长安，除了求人，还有别的路吗？后来我看见了更让我心寒的事——征兵，开边，百姓的血泪。到那时我才懂得，读书人真正该写的，不是求人的诗。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'bingche',
      sceneMode: 'flashback',
      npc: false,
      text: '谁不是如此。可人这一低头，头就再难抬起来了。直到我见尽民间疾苦，才把心思从"求人"，转到"写实"上。',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'serious',
      scene: 'bingche',
      sceneMode: 'flashback',
      npc: false,
      text: '咸阳桥头，征夫与亲人哭作一团，尘埃蔽日。"信知生男恶，反是生女好"——若不是被逼到绝路，哪个做父母的，会说出这样锥心的话？',
      anchor: 'a9',
      next: 'n14'
    },
    n14: {
      type: 'talk',
      emotion: 'angry',
      scene: 'liren',
      sceneMode: 'flashback',
      npc: false,
      text: '可就在同一座长安城里，曲江边上，杨氏兄妹锦衣玉食，前呼后拥。一边是征夫的泪，一边是权贵的乐。这长安城，朱门酒肉臭，路有冻死骨。',
      anchor: 'a10',
      next: 'n15'
    },
    n15: {
      type: 'choice',
      npc: true,
      question: '看着这样的长安，你觉得诗人该做什么？',
      options: [
        { text: '把这一切，都写下来', next: 'n16' },
        { text: '想办法改变这个世道', next: 'n17' },
        { text: '这天下，还值得我牵挂吗？', next: 'n18' }
      ]
    },
    n16: {
      type: 'talk',
      emotion: 'serious',
      scene: 'tavern',
      text: '写下来，对。诗人不能救世，却能让这时代的真，不被抹去。诗若只为风花雪月，又与这满目疮痍何干？',
      next: 'n19'
    },
    n17: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'tavern',
      text: '改变？我一介书生，无兵无权。可我能做的，是让圣上、让后人，看见这真实的人间。这，便是读书人的"致君尧舜"。',
      next: 'n19'
    },
    n18: {
      type: 'talk',
      emotion: 'calm',
      scene: 'tavern',
      text: '你这话，让我怔了怔。值不值得？若连读书人都灰了心，这天下，还有谁来替百姓说话。我信，总还值得。',
      next: 'n19'
    },
    n19: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'tavern',
      text: '这十年，我困在长安，看过最脏的官场，也看过最苦的百姓。你心里定有许多想问的——尽管开口，我知无不言。',
      next: 'n20'
    },
    n20: {
      type: 'aiFree',
      trap: {
        text: '（放下酒盏，声音低下去）说起曲江边上那一回——杨氏兄妹车马盈路，骄奢得刺眼。我回来就写了首《丽人行》，专刺那权相李林甫。',
        wrong: '《丽人行》刺李林甫',
        right: '《丽人行》刺杨国忠兄妹',
        hint: '《丽人行》写三月三日曲江水边杨氏兄妹的骄奢',
        catchText: '（一顿，随即失笑）是我糊涂了。《丽人行》刺的是杨国忠兄妹，不是李林甫。李林甫那笔账，我记在别处了。你倒比我记得清楚——看来这长安的账，你也替我记着。',
        anchor: 'a10',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你是杜甫在泰山结识的少年同游者，多年后在长安重逢。此刻你与他在一间小酒肆中，他借酒消愁，谈起困守长安十年的境遇：向权贵献诗的屈辱、目睹的朝政腐败与百姓疾苦，以及他为何仍不肯放弃。他神情沉郁，言语间满是不甘与坚持。',
      hint: '你可以问杜甫：他献诗给谁、为何不放弃、"野无遗贤"的真相、长安百姓的生活……',
      suggestions: ['"野无遗贤"到底是怎么回事？', '您为何不肯离开长安？', '受尽冷眼，是什么让您撑了下来？'],
      scene: 'tavern',
      minRounds: 1,
      next: 'n21'
    },
    n21: {
      type: 'reflect',
      lines: [
        '临别时，我回头望了望这困住他十年的长安城。',
        '天宝六载，一句"野无遗贤"，让满城举子尽数落榜。',
        '他本可以走，却留了下来——这一留，就是十年。',
        '十年里，他朝扣富儿门，暮随肥马尘，尝尽了求人的屈辱。',
        '他也看见了咸阳桥头的征夫泪，曲江边上的权贵乐。',
        '一边是"朱门酒肉臭"，一边是"路有冻死骨"。',
        '我那时不懂，一个人为什么要在这样的城里，苦熬十年。',
        '如今想来，他不是走不掉，是不肯走——他放心不下这天下。',
        '一个人受的委屈，若能和着天下人的苦一起写进诗里，便不算白受。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期三：陷贼为官 ============
// 底色：忠君恤民。玩家定位：与被困沦陷长安的杜甫重逢，同历国破、逃亡、直谏与贬谪。
// 抉择点：4 个（1 个"决定性瞬间"带对错 + 3 个无对错探索），结尾 reflect 不点破"底色"标签。
const QUEST_P3 = {
  id: 'p3',
  title: '陷贼为官',
  range: '756–759',
  scene: SCENES.p3,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '天宝十五载六月，潼关失守，长安陷落。胡尘蔽日，烽烟四起，昔日繁华的帝都，如今十室九空，处处断壁残垣。',
      scene: 'war',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你混在流民中间进了城。街口有叛军巡逻，人人低头疾行。转过一角断墙，你看见一个熟悉的身影——衣衫褴褛，面容憔悴，腰背却依然挺得笔直。',
      scene: 'street',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'serious',
      text: '（压低声音）小兄弟？真的是你……长安一别，不想竟在这般光景里再见。你怎也陷在这城里了。小声些，叛军就在街口巡逻。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '重逢在沦陷的长安街头，你的第一反应是？',
      options: [
        { text: '（低声）杜公！您没事就好', next: 'n2b' },
        { text: '（低声）您怎么没逃出去？', next: 'n2c' },
        { text: '（沉默地握住他的手）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '好，好……我没事。只是这一城的人，都没了活路。你且随我来，寻个僻静处说话。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'calm',
      text: '逃？城破之后九门皆闭，出去便是死。可我在这城里，也并非只是等死——你随我来。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'sad',
      text: '（他反手握住你，力道很重）……你还活着，很好。乱世里，活着已是万幸。随我来，别在街上多留。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'sad',
      scene: 'yueye',
      sceneMode: 'flashback',
      npc: false,
      text: '夜里我常望着月亮出神。"今夜鄜州月，闺中只独看"——妻儿还在鄜州，音信全无，不知生死。我这做丈夫的，连一句平安都送不到。你说，这算不算我此生最无用的时刻？',
      anchor: 'a11',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      question: '听他说起音信全无的妻儿，你想说什么？',
      options: [
        { text: '一定会有办法送信的', next: 'n5' },
        { text: '您的家人一定会平安', next: 'n6' },
        { text: '（不知如何安慰，只陪他望月）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'yueye',
      sceneMode: 'flashback',
      npc: false,
      text: '但愿如此。"烽火连三月，家书抵万金"——这"万金"，是每一个破碎的家庭，一分一寸称出来的。但愿月圆之夜，人也能团圆。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'calm',
      scene: 'yueye',
      sceneMode: 'flashback',
      npc: false,
      text: '会平安的——你这话，我记下了。乱世里的一句吉言，比千金还重。但愿月圆之夜，人也能团圆。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'yueye',
      sceneMode: 'flashback',
      npc: false,
      text: '你不用说话，陪着就好。这月色照着长安的断墙，也照着鄜州的闺阁——天下人望的，原是同一轮月亮。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'sad',
      scene: 'chunwang',
      sceneMode: 'flashback',
      npc: false,
      text: '开春后我登上城头。山河还在，国却已破了。"国破山河在，城春草木深"——草木长得越深，人烟就越稀。这首《春望》，我是一字一字，哽出来的。',
      anchor: 'a4',
      next: 'n9'
    },
    n9: {
      type: 'talk',
      emotion: 'serious',
      scene: 'street',
      text: '回到城里，我打听到一件事：肃宗已在灵武即位，行在设于凤翔，正召集天下义士。我决意逃出去，投奔朝廷。',
      next: 'n10'
    },
    n10: {
      type: 'choice',
      npc: true,
      question: '出城投奔肃宗，九死一生。你打算怎么劝他？',
      options: [
        { text: '扮作难民，随他一起逃出城去', result: 'n11' },
        { text: '再等等，等城防松懈再说', result: 'n12' },
        { text: '太危险了，不如熬到战乱平息', result: 'n13' }
      ]
    },
    n11: {
      type: 'talk',
      emotion: 'serious',
      scene: 'tao',
      sceneMode: 'flashback',
      npc: false,
      text: '那日金光门出逃，我扮作难民，混在流民里。穿行在叛军的刀锋与逃难的人潮之间，风餐露宿，九死一生。可我心里只有一个念头——去凤翔，见天子。',
      next: 'n14'
    },
    n12: {
      type: 'talk',
      emotion: 'serious',
      scene: 'tao',
      sceneMode: 'flashback',
      npc: false,
      text: '等？等不来太平的。次日我便扮作难民混出了金光门，穿行在叛军与流民之间，九死一生，一路往凤翔去。',
      next: 'n14'
    },
    n13: {
      type: 'talk',
      emotion: 'serious',
      scene: 'tao',
      sceneMode: 'flashback',
      npc: false,
      text: '熬？我这半生都在熬，早熬够了。数日后我扮作难民混出金光门，往凤翔去——纵是死在半路，也好过困在城里，眼看山河沦丧。',
      next: 'n14'
    },
    n14: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'fengxiang',
      sceneMode: 'flashback',
      npc: false,
      text: '到了凤翔，我"麻鞋见天子，衣袖露两肘"——一双麻鞋，破袖露肘，狼狈得很。可肃宗感念我冒死来投，授我左拾遗。谏官——终于能当面向圣上直言了。',
      anchor: 'a12',
      next: 'n15'
    },
    n15: {
      type: 'choice',
      npc: true,
      question: '左拾遗任上，宰相房琯获罪，无人敢言。你若是他，你怎么选？',
      options: [
        { text: '直言进谏，为房琯辩护', right: true, result: 'n16', feedback: '这正是他做的选择。为此触怒肃宗、几乎问罪——可读书人的脊梁，就是在这一刻挺起来的。' },
        { text: '明哲保身，不蹚这浑水', right: false, result: 'n17', feedback: '你劝他置身事外。可他做不到——明哲保身四个字，从来写不进他的骨头。' },
        { text: '先看看旁人怎么说，再作打算', right: false, result: 'n18', feedback: '你劝他等等看。可等来等去，忠直的人就熬成了圆滑的人——那不是他。' }
      ]
    },
    n16: {
      type: 'talk',
      emotion: 'serious',
      scene: 'street',
      text: '我为房琯说了几句公道话，便被贬出京，去做华州司功参军。……你若问我悔不悔？直言获罪，罪在我身；缄默保身，耻在我心。',
      next: 'n19'
    },
    n17: {
      type: 'talk',
      emotion: 'serious',
      scene: 'street',
      text: '我做不到。眼见忠良获罪而一言不发，这官做得再稳，夜里也睡不安稳。……后来我直言获罪，被贬华州。可我不悔。',
      next: 'n19'
    },
    n18: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'street',
      text: '朝堂之上，转圜只在转瞬。我终究还是选择了直言——为此被贬华州。……你若问我悔不悔？直言获罪，罪在我身；缄默保身，耻在我心。',
      next: 'n19'
    },
    n19: {
      type: 'talk',
      emotion: 'sad',
      scene: 'shihao',
      sceneMode: 'flashback',
      npc: false,
      text: '贬官之后，我从洛阳回华州，一路夜宿荒村。亲眼见差吏深夜抓人充军——"吏呼一何怒，妇啼一何苦"，老妇人被带走，只留下一村哭声。我把这些都写了下来：《三吏》《三别》。',
      anchor: 'a13',
      next: 'n20'
    },
    n20: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'street',
      text: '小兄弟，你随我走这一程，看尽了这乱世。乱世里诗还有什么用——这些年我也反复问自己。你心里若还有疑问，趁今夜都在，尽管问我。',
      next: 'n21'
    },
    n21: {
      type: 'aiFree',
      trap: {
        text: '（望着城头残阳）至德元载的春天，我就在这城头，一字一字哽出那首《春望》。国破山河在，城春草木深——你听，草木长得越深，人烟就越稀。',
        wrong: '《春望》作于至德元载春',
        right: '《春望》作于至德二载春（757年）',
        hint: '长安陷于天宝十五载（756）六月，隔年春天才有《春望》',
        catchText: '（一怔，摇头）是我记混了。长安陷落是天宝十五载六月，我写《春望》已是至德二载的春天了——整整隔着一个年头。这一年的滋味，全在"白头搔更短，浑欲不胜簪"那十个字里。你替我记着这个年份，比什么都好。',
        anchor: 'a7',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你与杜甫在沦陷的长安城中重逢，又随他历经逃亡、为官与贬谪。他谈起战乱中的见闻：妻儿离散、《春望》与《月夜》的心境、冒死投奔肃宗、直言被贬、以及路上目睹的百姓疾苦。他神情沉痛而坚定。',
      hint: '你可以问杜甫：家人下落、《春望》怎么写出来的、逃亡路上的凶险、左拾遗的官、三吏三别……',
      suggestions: ['《月夜》是想念家人写的吗？', '逃出长安的路上有多凶险？', '明知会获罪，您为什么还要直言？'],
      scene: 'street',
      minRounds: 1,
      next: 'n22'
    },
    n22: {
      type: 'reflect',
      lines: [
        '临别时，我回头望了望这座伤痕累累的长安城。',
        '城破那年，他被困在这里，夜夜望月，思念生死不明的妻儿。',
        '"国破山河在，城春草木深"——这十个字，他是一字一字哽出来的。',
        '后来他扮作难民，九死一生逃出金光门，麻鞋见天子。',
        '做了谏官，他偏偏要直言；直言被贬，贬官路上还在写诗。',
        '差吏深夜抓走的老人、新婚便送别的丈夫——都被他记进了诗里。',
        '我那时明白了一件事：',
        '乱世里最难得的，不是活下来，而是活下来之后，还肯替看不见的人说话。',
        '他不是不知道怕。他只是觉得，有些事，比怕更重要。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期四：漂泊西南 ============
// 底色：仁者胸怀 + 诗艺集大成。玩家定位：与暮年杜甫第四度重逢，陪他走完最后一程。
//
// 时间线：**成都草堂 → 夔州 → 湖湘孤舟**，一路向前，不走回头路。
//   · n1–n17  当下在草堂（成都）。中间用 flashback 回忆秦州、春夜喜雨、秋风破屋，
//             这些事都早于或等于"草堂当下"，人物"不知道未来"的设定才成立；
//   · n17a    一次「时间推进」旁白：严武病故、买舟东下 → 视角回到当下，进入夔州；
//   · n22a    同样推进到湖湘孤舟 → 之后直到结尾 reflect 都留在孤舟上。
//   ⚠️ 改动前的老问题：结尾 n28/n29 用 scene:'caotang' 切回了成都草堂，
//      等于让"成都时期的杜甫"提前回忆了夔州《登高》和漂泊湖湘，前后矛盾。
//      以后调整本时期：**结尾不要切回 caotang**；flashback 只能用于"比当下更早"的事。
//
// 抉择点：5 个（1 个"决定性瞬间"带对错 + 4 个无对错探索），结尾 reflect 不点破"底色"标签。
const QUEST_P4 = {
  id: 'p4',
  title: '漂泊西南',
  range: '759–770',
  scene: SCENES.p4,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '成都，浣花溪畔。几间新结的茅屋掩在翠竹与春色里，溪水潺潺，远处是锦官城的炊烟。',
      scene: 'caotang',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你循着溪水走近，看见一个鬓发斑白的身影正在篱前栽竹。听见脚步声，他直起身来，眯眼认了认，忽然就笑了。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '小兄弟！真的是你——哈哈，十多年了，你怎么还是当年模样！快进来。我这草堂总算安顿下来，"两个黄鹂鸣翠柳，一行白鹭上青天"——乱世里偷来的这一方安宁，格外珍贵啊。',
      anchor: 'a5',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '第四次与老友重逢，这次他已两鬓斑白。你想说什么？',
      options: [
        { text: '杜公还是那样，见什么都高兴', next: 'n2b' },
        { text: '这草堂，是您亲手建起来的？', next: 'n2c' },
        { text: '（望着他的白发，说不出话）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'joy',
      text: '高兴？你且看我这鬓角。弃官入蜀，靠故旧接济才落下这块地……能有一间屋遮头，怎能不高兴。人这一生，笑是给自己撑的伞。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '亲手建谈不上，亲眼看是不错的。堂成之后，我便栽竹百竿，开渠引水。简陋是简陋，可这是逃难半生，头一回有了"家"的样子。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '（他顺着你的目光，摸了摸鬓角）老了，老了。不过心还没老——你来得正好，陪我看看这浣花溪的春天。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'sad',
      scene: 'qinzhou',
      sceneMode: 'flashback',
      npc: false,
      text: '你问他这几年的经历，他的神色渐渐沉了下来。华州任上，关辅大饥，谷价腾贵，饿殍载道。我那年四十八岁，一边是仕途灰心，一边是民生凋敝——西行路上，秦州、同谷，一家老小几乎饿死。',
      anchor: 'a14',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      scene: 'qinzhou',
      sceneMode: 'flashback',
      npc: false,
      question: '饥荒最凶那年，在华州，他手里还握着那顶乌纱。若你此刻是他，你会怎么选？',
      options: [
        { text: '挂冠而去，宁可讨饭也不折腰', result: 'n5', feedback: '这正是他做的选择。弃官那一刻，他丢了俸禄，却把一生还给了自己。' },
        { text: '咬牙苦熬，官微禄薄也强过挨饿', result: 'n6', feedback: '你劝他熬。可这官熬下去，救不了百姓，也救不了自己——他不是没熬过，是熬够了。' },
        { text: '借官声投靠权贵，求个安稳富贵', result: 'n7', feedback: '你替他选了"聪明"。可他一生吃了不会"聪明"的亏，也全靠这份不聪明，成了他。' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'serious',
      scene: 'qinzhou',
      sceneMode: 'flashback',
      npc: false,
      text: '辞官那日，同僚都道我疯了。可我清楚：食朝廷之禄，救不了一郡之民；为一己之生，折半生之腰——这官，做它何用？去成都，投亲靠友，从头活起。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'serious',
      scene: 'qinzhou',
      sceneMode: 'flashback',
      npc: false,
      text: '熬？我在华州熬了一年，眼看着百姓饿死，提笔无言。这官帽底下装着的，已不是当年那个拾遗杜甫了。次日我便挂印而去——穷是穷，心是齐整的。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'qinzhou',
      sceneMode: 'flashback',
      npc: false,
      text: '投靠权贵？我见过太多"聪明人"，如今坟头的草都高了。我这一生不会拐弯，可我不悔——拐了弯，就写不出那些诗了。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'chunyu',
      sceneMode: 'flashback',
      npc: false,
      text: '到成都后，总算安顿下来。那年春夜落了一场好雨，我披衣起身，立在檐下听了半宿——"随风潜入夜，润物细无声"。你听这十个字，哪里是在写雨，分明是在写他自己：不声不响，只管润物。',
      anchor: 'a15',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'sad',
      scene: 'autumn',
      sceneMode: 'flashback',
      npc: false,
      text: '只是这样安稳的日子，也没几年。去年八月，秋风怒号，卷走了我屋上的三重茅草；夜里大雨，床头屋漏，布衾似铁——一家老小，在雨里坐到天亮。',
      next: 'n14'
    },
    n14: {
      type: 'choice',
      scene: 'autumn',
      sceneMode: 'flashback',
      npc: false,
      question: '屋漏床湿、长夜沾湿。若你此刻是他，你想到的会是什么？',
      options: [
        { text: '自家苦命，半生无一处安身', right: false, result: 'n15', feedback: '你替他叫了苦。可那一夜，他叫出的不是苦——' },
        { text: '天下寒士，何时才能有屋遮身', right: true, result: 'n16', feedback: '正是。"安得广厦千万间，大庇天下寒士俱欢颜"——自己淋在雨里，想的却是普天下淋雨的人。' },
        { text: '乱世飘零，何以至此', right: false, result: 'n17', feedback: '你替他叹了身世。可那一夜，他没有——' }
      ]
    },
    n15: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'autumn',
      sceneMode: 'flashback',
      npc: false,
      text: '是，我命苦。可叫苦的诗人，这世上从来不缺。那一夜我想的是——这世上比我苦的人还有千千万万，他们连一首诗都没有。"吾庐独破受冻死亦足"，只要天下寒士都有屋住。',
      next: 'n18'
    },
    n16: {
      type: 'talk',
      emotion: 'serious',
      scene: 'autumn',
      sceneMode: 'flashback',
      npc: false,
      text: '正是。"安得广厦千万间，大庇天下寒士俱欢颜，风雨不动安如山！"——你说怪不怪：自己冻着，许的愿却是给别人的。可若连这一点念想都没了，人才真的输了。',
      anchor: 'a8',
      next: 'n18'
    },
    n17: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'autumn',
      sceneMode: 'flashback',
      npc: false,
      text: '飘零身世，我叹过半生了。可那一夜我没有叹——我的屋破了，尚且有笔；天下人的屋破了，连声音都没有。替他们喊一嗓子，是我这诗人还能做的事。',
      next: 'n17a'
    },
    // ——时间推进 1：草堂的回忆到此收束，视角回到"当下"，与诗人一同东下夔州——
    // 这之后不再使用 flashback：夔州与湖湘是玩家陪着经历的"现在"，不是他回望的往事。
    n17a: {
      type: 'narrate',
      scene: 'kuizhou',
      text: '春去秋来。你在浣花溪畔陪他住了一段日子，看他栽竹、看药、听雨。直到严武病故，蜀中又乱起来——这方偷来的安宁终究没能久留。一家人收拾行装，买舟东下；船过三峡，水急滩险，他在夔州停住了脚。',
      next: 'n18'
    },
    n18: {
      type: 'talk',
      emotion: 'thoughtful',
      // 不再是 flashback：此刻玩家就站在夔州的高台上（场景已由 n17a 切好）
      scene: 'kuizhou',
      npc: false,
      text: '严武一去，成都没了依靠。我举家东下，出三峡，在夔州一住就是两年。这两年，身子骨一天不如一天，写下的诗却最多——四百多首。"无边落木萧萧下，不尽长江滚滚来"。少年时登泰山，我写的是山；如今登高处，我写的已是这一生。',
      anchor: 'a16',
      next: 'n19'
    },
    n19: {
      type: 'choice',
      npc: true,
      question: '从《望岳》到《登高》，你听出了他诗里的变化。你想说什么？',
      options: [
        { text: '从意气风发，到沉郁苍茫，是时代磨的', next: 'n20' },
        { text: '诗到晚年，才真正写尽了人间', next: 'n21' },
        { text: '（一时不知从何说起）', next: 'n22' }
      ]
    },
    n20: {
      type: 'talk',
      emotion: 'calm',
      text: '是磨的。年轻时我以为，诗是才华；老了才知道，诗是命的分量。命有多沉，诗就有多沉。',
      next: 'n23'
    },
    n21: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '写尽人间，不敢当。只是年轻时看山是山，如今看山，山里都是人——落木、长江、白头、浊酒，样样都是人间。',
      next: 'n23'
    },
    n22: {
      type: 'talk',
      emotion: 'calm',
      text: '不妨事。有些诗，要等你自己走到某一天，才忽然懂。到那一天，你会想起今晚。',
      next: 'n22a'
    },
    // ——时间推进 2：夔州也不是归处，视角随他一路东下，落到湘江上的孤舟——
    n22a: {
      type: 'narrate',
      scene: 'xiangjiang',
      text: '夔州同样不是归处。两年之后，他又一次解缆东下。这一回，船再没靠上过岸——江陵、公安、岳阳、潭州，一叶扁舟，在湘水上来回地漂着。',
      next: 'n23'
    },
    n23: {
      type: 'talk',
      emotion: 'sad',
      // 同上：这里是"当下"，不是回望（场景已由 n22a 切好，故不再走慢速闪回转场）
      scene: 'xiangjiang',
      npc: false,
      text: '出峡之后，我以舟为家，漂泊湖湘。亲故尽失，疾病缠身。"飘飘何所似，天地一沙鸥"——一叶孤舟，天地之大，竟寻不出一处归程。',
      next: 'n24'
    },
    n24: {
      type: 'choice',
      npc: true,
      question: '暮年漂泊至此，望着江水，你想说什么？',
      options: [
        { text: '您后悔这一生吗？', next: 'n25' },
        { text: '这些诗，能留下来吗？', next: 'n26' },
        { text: '（默默陪他望着江水）', next: 'n27' }
      ]
    },
    n25: {
      type: 'talk',
      emotion: 'calm',
      text: '悔？不悔。我这一生，官没做成，家没安下，可我写下的每一句，都对得起这双眼睛看见的天下。如此，便不算白来。',
      next: 'n28'
    },
    n26: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '留不留得下来，不是我说了算的。我只管把看到的、疼过的，都如实写下来——后人读与不读，它们都在那里。',
      next: 'n28'
    },
    n27: {
      type: 'talk',
      emotion: 'calm',
      text: '（许久，他轻声）你看这江水，日日夜夜，不知疲倦地走。我这一生，大概也是这样——走到哪算哪，写着什么算什么。',
      next: 'n28'
    },
    n28: {
      type: 'talk',
      emotion: 'thoughtful',
      // 不再切回 caotang：这一程的终点是湘江上的孤舟（见本时期头部的时间线说明）
      text: '小兄弟，你我泰山初见时，我不过一介狂生；如今舟中相对，已是白头。这一路同行，我的话你也都听遍了。心里若还有想问的——这最后一段水程，尽管问。',
      next: 'n29'
    },
    n29: {
      type: 'aiFree',
      trap: {
        text: '（倚着竹杖，望向江面）当年我在成都草堂写下《登高》——"无边落木萧萧下，不尽长江滚滚来"。那几年，我这身子骨还算撑得住。',
        wrong: '《登高》作于成都草堂',
        right: '《登高》作于夔州',
        hint: '《登高》是夔州所作，不在成都草堂',
        catchText: '（抚掌而笑）你又捉住我了。《登高》是夔州所作，不是草堂。那时我已百病缠身，独自登台，才写得出"万里悲秋常作客，百年多病独登台"。草堂那几年，倒是我难得的安闲日子。你记得比我还准，我这老头子，服气。',
        anchor: 'a16',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你是杜甫的少年同游者，从泰山、长安、沦陷的长安一路同行到漂泊西南的暮年。如今你在一叶孤舟上，陪他度过湘江上的最后一段日子。他鬓发斑白，疾病缠身，心境平和却未忘天下。你可以问草堂岁月、秋风破屋那夜、弃官西行、《登高》与晚年诗境、漂泊湖湘的境况、归乡的念想，以及他想对后人说的话。他神情温和而慈悲。',
      hint: '你可以问杜甫：草堂的日子、秋风破屋那晚、为何弃官、《登高》、晚年的漂泊、他一生的志向……',
      suggestions: ['秋风破屋那晚，您在想什么？', '这一生几乎没赢过，您觉得值吗？', '还想回故乡看看吗？'],
      scene: 'xiangjiang',
      minRounds: 1,
      next: 'n30'
    },
    n30: {
      type: 'talk',
      emotion: 'calm',
      text: '罢了，天不早了。若还问我还念着什么——愿后人翻开这些诗，看见的不只是杜甫，还有那千千万万没留下名字的人。他们来过，苦过，也认真活过。',
      next: 'n31'
    },
    n31: {
      type: 'reflect',
      lines: [
        '终程。我最后一次回望，望的是他这一生走过的路。',
        '泰山道上那个七岁咏凤的狂生，长安城里苦熬十年的青衫，烽火中麻鞋见天子的逃难人，浣花溪畔栽竹的翁，夔州高台上望落木的老人，湘江孤舟里的那盏灯。',
        '他这一生，几乎没赢过：落榜、被贬、弃官、漂泊，到临终，连一条归乡的路都没有。',
        '可屋漏床湿的夜里，他许的愿，是天下寒士都有屋住。',
        '他潦倒至此，写下的每一个字，都在替没有名字的人说话。',
        '我终于明白——有一种人，命运拿走了他的一切，却拿不走他心疼别人的那颗心。',
        '而他把那颗心，一字一字，写成了一千四百多首诗。',
        '一千年过去，山河改了模样，那颗心还在被人念着。',
        '这，就是我能告诉你的、真实的杜甫。'
      ],
      next: '__end__'
    }
  }
};

// ============ 锚点名称表 ============
const ANCHORS = {
  a1: '少年诗心',
  a2: '榜下转身',
  a3: '野无遗贤',
  a4: '《春望》与安史之乱',
  a5: '草堂与绝句',
  a6: '望岳',
  a7: '《春望》创作背景',
  a8: '干谒与"朱门酒肉臭"的前身',
  a9: '奉赠韦左丞丈二十二韵（节选）与"野无遗贤"',
  a10: '春望',
  a11: '羌村三首',
  a12: '述怀',
  a13: '石壕吏',
  a14: '月夜忆舍弟',
  a15: '乾元中寓居同谷县作歌七首',
  a16: '春夜喜雨',
  a17: '茅屋为秋风所破歌',
  a18: '登高',
  a19: '登岳阳楼',
  a20: '江南逢李龟年',
  a21: '孤舟绝笔'
};

module.exports = {
  id: 'dufu',
  periods: PERIODS,
  quests: { p1: QUEST_P1, p2: QUEST_P2, p3: QUEST_P3, p4: QUEST_P4 },
  scenes: SCENES,
  sceneSets: SCENE_SETS,
  npcImage: NPC_IMAGE,
  periodNpcImages: PERIOD_NPC_IMAGES,
  periodNpcAnimations: PERIOD_NPC_ANIMATIONS,
  anchors: ANCHORS
};
