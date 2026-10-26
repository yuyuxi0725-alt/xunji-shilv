// utils/stories/line-sushi.js —— 「苏轼」故事线数据（独立文件，与其他古人解耦）
//
// 结构完全仿照 line-libai.js，节点类型与 chat 引擎对齐：
//   narrate(旁白) | talk(对话) | choice(选项) | aiFree(自由AI对话) | reflect(结尾讲述)
// 关键约定：
//   - 决定性瞬间：choice 选项带 right: true/false + result + feedback
//   - 回忆闪回：节点 sceneMode:'flashback' + npc:false（隐藏立绘）
//   - 锚点：anchor:'sX' 挂在 talk/narrate 节点
//   - 立绘：talk/choice/aiFree 显示，narrate 隐藏，reflect 隐藏（引擎兜底 + 节点可显式 npc 覆盖）
//
// 人格底色：旷 · 达 · 通（详见 docs/苏轼线-总纲与区分宪法.md）
// 图片迁移云存储：路径由 img() 运行时拼接，再由 cloudAssets 解析为云链接。
const IMG = '/assets/' + 'images/';
function img(sub) { return IMG + sub; }

// ============ 场景图（命名对齐 scene-sushi-pX-xxx.jpg） ============
const SCENES = {
  p1: img('scenes/scene-sushi-p1-meishan.jpg'),
  p2: img('scenes/scene-sushi-p2-mizhou.jpg'),
  p3: img('scenes/scene-sushi-p3-yutai.jpg'),
  p4: img('scenes/scene-sushi-p4-chibi.jpg'),
  p5: img('scenes/scene-sushi-p5-danzhou.jpg')
};

const SCENE_SETS = {
  p1: {
    meishan: img('scenes/scene-sushi-p1-meishan.jpg'),    // 蜀地眉山·出蜀应试的江边
    jiashu:  img('scenes/scene-sushi-p1-jiashu.jpg'),     // 回忆·眉山书斋（母程氏授书）
    kaichang:img('scenes/scene-sushi-p1-kaichang.jpg'),   // 回忆·汴京贡院（嘉祐二年放榜）
    oyangxiu:img('scenes/scene-sushi-p1-oyangxiu.jpg'),   // 回忆·欧阳修读卷惊叹
    fengxiang:img('scenes/scene-sushi-p1-fengxiang.jpg')  // 凤翔·初仕签判
  },
  p2: {
    mizhou:  img('scenes/scene-sushi-p2-mizhou.jpg'),     // 密州城头·出猎
    hangzhou:img('scenes/scene-sushi-p2-hangzhou.jpg'),   // 回忆·杭州通判·西湖
    chulie:  img('scenes/scene-sushi-p2-chulie.jpg'),     // 回忆·密州出猎（老夫聊发少年狂）
    zhongqiu:img('scenes/scene-sushi-p2-zhongqiu.jpg'),   // 回忆·密州中秋（明月几时有）
    xuzhou:  img('scenes/scene-sushi-p2-xuzhou.jpg')      // 回忆·徐州城头抗洪
  },
  p3: {
    yutai:   img('scenes/scene-sushi-p3-yutai.jpg'),      // 御史台·乌台
    daiyu:   img('scenes/scene-sushi-p3-daiyu.jpg'),      // 湖州任上被逮·押解入京
    yuzhong: img('scenes/scene-sushi-p3-yuzhong.jpg'),    // 狱中·铁窗望天
    juebie:  img('scenes/scene-sushi-p3-juebie.jpg'),     // 回忆·诀别诗·寄子由
    chuyu:   img('scenes/scene-sushi-p3-chuyu.jpg')       // 出狱·贬黄州路上
  },
  p4: {
    chibi:   img('scenes/scene-sushi-p4-chibi.jpg'),      // 黄州赤壁·大江东去
    dinghui: img('scenes/scene-sushi-p4-dinghui.jpg'),    // 初贬·定惠院·心似已灰
    dongpo:  img('scenes/scene-sushi-p4-dongpo.jpg'),     // 开荒东坡·躬耕
    fanchuan:img('scenes/scene-sushi-p4-fanchuan.jpg'),   // 回忆·赤壁泛舟（寄蜉蝣于天地）
    dingfeng:img('scenes/scene-sushi-p4-dingfeng.jpg')    // 回忆·沙湖遇雨（一蓑烟雨任平生）
  },
  p5: {
    danzhou: img('scenes/scene-sushi-p5-danzhou.jpg'),    // 儋州·天涯海角
    huizhou: img('scenes/scene-sushi-p5-huizhou.jpg'),    // 回忆·惠州·岭南荔枝
    lixue:   img('scenes/scene-sushi-p5-lixue.jpg'),      // 回忆·儋州办学传文
    jinshan: img('scenes/scene-sushi-p5-jinshan.jpg'),    // 回忆·金山寺·自题画像
    beigui:  img('scenes/scene-sushi-p5-beigui.jpg')      // 北归·常州长眠
  }
};

const NPC_IMAGE = img('npc/sushi-default.png');

const PERIOD_NPC_IMAGES = {
  p0: img('npc/sushi-p0-child.png'),  // 幼年（眉山少年读书）
  p1: img('npc/sushi-p1-young.png'),
  p2: img('npc/sushi-p2-mid.png'),
  p3: img('npc/sushi-p3-prison.png'),
  p4: img('npc/sushi-p4-dongpo.png'),
  p5: img('npc/sushi-p5-old.png')
};

// 轻动效单独配置：云端文件未上传或临时链接获取失败时，对话页会自动
// 回退到 PERIOD_NPC_IMAGES，不让新增动图影响原有剧情加载。
const PERIOD_NPC_ANIMATIONS = {
  p0: img('npc/sushi-p0-child-idle.gif'),
  p1: img('npc/sushi-p1-young-idle.gif'),
  p2: img('npc/sushi-p2-mid-idle.gif'),
  p3: img('npc/sushi-p3-prison-idle.gif'),
  p4: img('npc/sushi-p4-dongpo-idle.gif'),
  p5: img('npc/sushi-p5-old-idle.gif')
};

// ============ 时期列表（story 页卡牌） ============
const PERIODS = [
  { id: 'p1', name: '少年成名', range: '1056–1061', desc: '三苏出蜀，一举成名', poem: '守其初心，始终不变' },
  { id: 'p2', name: '密州湖州', range: '1074–1079', desc: '外放守正，为民请命', poem: '但愿人长久，千里共婵娟' },
  { id: 'p3', name: '乌台诗案', range: '1079', desc: '因诗获罪，生死一线', poem: '与君世世为兄弟' },
  { id: 'p4', name: '东坡赤壁', range: '1080–1084', desc: '贬谪黄州，绝境重生', poem: '一蓑烟雨任平生' },
  { id: 'p5', name: '岭南北归', range: '1094–1101', desc: '再贬天涯，随遇而安', poem: '问汝平生功业，黄州惠州儋州' }
];

// ============ 时期一：少年成名 ============
// 玩家定位：穿越到北宋，与出蜀应试的苏氏父子三人萍水相逢，一路同行进京（初见）。
// 抉择点：1 个"决定性瞬间"（得志不收敛）带对错，其余为无对错探索。
const QUEST_P1 = {
  id: 'p1',
  title: '少年成名',
  range: '1056–1061',
  scene: SCENES.p1,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '你睁开眼，发现自己站在一条江边。江水滔滔，两岸青山如黛，远处是一座小小的驿站，隐约传来车马的喧声。',
      scene: 'meishan',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你低头看看自己——一身宋人的青布衣裳。你明白，你已不在原来的时代，而是来到了北宋。',
      next: 'n1b'
    },
    n1b: {
      type: 'narrate',
      text: '驿站前，停着一辆简陋的马车。一位留着长须的中年人正与两个青年说话，其中一个二十出头的青年，眉目清朗，谈吐间掩不住的才气。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '（见你走近，朗声一笑）这位小兄弟，你也是要进京赶考去的？在下苏轼，字子瞻，眉山人氏。这是家父苏洵，这是舍弟苏辙。',
      anchor: 's1',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '面对这位意气风发的青年，你的第一反应是？',
      options: [
        { text: '好一个神采飞扬的才子！', next: 'n2b' },
        { text: '父子三人一同进京，倒是少见', next: 'n2c' },
        { text: '（被他的才气震了一下，一时没接上话）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'joy',
      text: '哈哈，不敢当。家父、舍弟同我一道，此去汴京，正是要会一会天下的文章。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '正是。家父早年游学四方，如今携我兄弟二人进京，一心要让我们出去见见世面。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '不必拘束。我这个人，心直口快，最不爱藏着掖着。你且随我同路，咱们边走边聊。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'jiashu',
      sceneMode: 'flashback',
      npc: false,
      text: '说起读书，我小时候是母亲亲自教的。她读《后汉书》到范滂传，慨然长叹。我那时不懂，便问她："我若做范滂那样的人，母亲可愿意？"你猜我母亲怎么说？',
      anchor: 's1',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      question: '母亲会怎么回答这个少年？',
      options: [
        { text: '她一定说，你安心读书，莫想这些', next: 'n5' },
        { text: '她会说，你既能做范滂，我就能做范滂的母亲', next: 'n6' },
        { text: '（一时猜不出）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'jiashu',
      sceneMode: 'flashback',
      npc: false,
      text: '你猜错了。我母亲说："你既能做范滂，我难道不能做范滂的母亲？"——范滂是东汉的名士，因直言获罪而死。母亲这话，是把我的志向，一并担下了。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'joy',
      scene: 'jiashu',
      sceneMode: 'flashback',
      npc: false,
      text: '正是！她说："你既能做范滂，我难道不能做范滂的母亲？"——范滂是东汉因直言获罪的名士。母亲这一句话，我记了一辈子。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'calm',
      scene: 'jiashu',
      sceneMode: 'flashback',
      npc: false,
      text: '她说："你既能做范滂，我难道不能做范滂的母亲？"范滂是东汉名士，因直言获罪而死。母亲这话，是愿意我做一个不折腰的人。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'kaichang',
      sceneMode: 'flashback',
      npc: false,
      text: '到了汴京，我与舍弟同科应试。主考官是欧阳修先生。据说他读到我的文章，以为是门生曾巩所作，为避嫌，把我压到了第二。',
      anchor: 's2',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '得知欧阳修把你误当作曾巩、压了名次，你心里想的是？',
      options: [
        { text: '这位先生倒是公正，还肯避嫌', next: 'n9a' },
        { text: '被压到第二，你就不觉得可惜？', next: 'n9b' }
      ]
    },
    n9a: {
      type: 'talk',
      emotion: 'joy',
      text: '公正？是，也不是。他以为是我的同门曾巩，为避嫌才压我——这份不徇私的操守，我敬他。',
      next: 'n10'
    },
    n9b: {
      type: 'talk',
      emotion: 'calm',
      text: '可惜？能得先生一句评语，已是天大的造化。名次罢了，我原不看重。',
      next: 'n10'
    },
    n10: {
      type: 'talk',
      emotion: 'joy',
      scene: 'oyangxiu',
      sceneMode: 'flashback',
      npc: false,
      text: '后来欧阳修先生得知真相，对人说："老夫当避路，放他出一头地也。"——先生要把路让开，好叫我这后生露头。你说，这算不算我这一路最大的知遇？',
      anchor: 's2',
      next: 'n11'
    },
    n11: {
      type: 'choice',
      npc: true,
      question: '一举成名、名动京师。这时有人劝你收敛锋芒，你会怎么想？',
      options: [
        { text: '树大招风，确实该收着点', next: 'n11a' },
        { text: '为何要收？有话直说便是', next: 'n11b' }
      ]
    },
    n11a: {
      type: 'talk',
      emotion: 'calm',
      text: '收着？我也听过这样的劝。可我苏子瞻，生来就不会藏着掖着。',
      next: 'n12'
    },
    n11b: {
      type: 'talk',
      emotion: 'joy',
      text: '说得好！心里怎么想，嘴上就怎么说。若要为求安稳去学那圆滑，我还做什么文章、做什么官。',
      next: 'n12'
    },
    n12: {
      type: 'choice',
      npc: true,
      question: '少年得志，有人劝你收敛锋芒、明哲保身。若你此刻是他，你会怎么选？',
      options: [
        { text: '收敛锋芒，学着明哲保身', right: false, result: 'n13', feedback: '你替他选了圆滑。可真实的他，一辈子都没学会——这份不设防，日后也成了他遭难的根由。' },
        { text: '不改本性，胸无芥蒂、直言敢说', right: true, result: 'n14', feedback: '正是。他明知直言招祸，却偏要"守其初心，始终不变"——这份赤诚，是他一生的底色。' },
        { text: '表面藏拙，暗中仍锋芒毕露', right: false, result: 'n15', feedback: '你替他选了伪装。可他连装都学不会——苏子瞻三个字，从不屑于藏着掖着。' }
      ]
    },
    n13: {
      type: 'talk',
      emotion: 'calm',
      text: '我若肯收敛，便不是我了。这官场再深，我也要凭一颗本心去闯——哪怕日后因此吃苦，我认。',
      next: 'n16'
    },
    n14: {
      type: 'talk',
      emotion: 'serious',
      text: '对。我这一生，宁可不那么聪明，也不愿做个藏着掖着的人。"守其初心，始终不变"——这是我给自己立的誓。',
      next: 'n16'
    },
    n15: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '藏拙？我最学不会的就是"藏"。心里有光，就该让它亮出来，藏着掖着，岂不辜负了这身才学。',
      next: 'n16'
    },
    n16: {
      type: 'talk',
      emotion: 'calm',
      scene: 'fengxiang',
      text: '后来我签判凤翔，才算真正入了仕。离京那日，我心里清楚——这一脚踏进官场，往后的路，怕是不好走了。只是当时，谁也料不到后来的事。',
      anchor: 's3',
      next: 'n17'
    },
    n17: {
      type: 'talk',
      emotion: 'joy',
      text: '小兄弟，这一路同你说了这许多，还没顾上听你问。家学也好、应试也好、我的志向也好，你心里憋着什么话，尽管问，我知无不言。',
      next: 'n18'
    },
    n18: {
      type: 'aiFree',
      trap: {
        text: '（抚着车窗，望着远方）说起家母授书，我幼时读的是《后汉书·范滂传》。我那时问母亲："儿若为范滂，母许之否？"——范滂是东汉名将，因军功获罪而死。',
        wrong: '范滂是东汉名将',
        right: '范滂是东汉名士（因党锢之祸、直言获罪而死）',
        hint: '《后汉书·范滂传》：范滂是东汉末年的名士，因党锢之祸被害，不是带兵的名将',
        catchText: '（一怔，随即抚掌）好眼力！是我说岔了——范滂是东汉名士，因党锢之祸、直言获罪而死，不是什么带兵的名将。亏你记得清，这考据的功夫，比我这作文章的还细。',
        anchor: 's1',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你与出蜀应试的苏轼父子三人萍水相逢，一路同行进京。他少年得志、才气外露，谈起家学、母亲授书并讲《范滂传》、欧阳修的知遇、以及他不肯收敛锋芒的志向。你可以问三苏家世、母亲授书、嘉祐二年应试、欧阳修"放他出一头地"、他初入仕途的抱负。',
      hint: '你可以问苏轼：三苏家学、母亲授书、欧阳修、应试经历、他的志向……',
      suggestions: ['聊聊您母亲与范滂的故事', '欧阳修为何说"放他出一头地"？', '您为何不肯收敛锋芒？'],
      scene: 'meishan',
      minRounds: 1,
      next: 'n19'
    },
    n19: {
      type: 'reflect',
      lines: [
        '临别时，我望着这个二十出头、一举成名的青年，他眼里没有半点得志的骄矜。',
        '满朝都道他奇才，欧阳修说"放他出一头地"。',
        '有人劝他收敛锋芒、明哲保身，他笑着摇头，说"守其初心，始终不变"。',
        '我那时觉得他天真——这官场，岂容得下一个不设防的人。',
        '如今想来，他这一生，从迈出第一步起，就选择了最难走的那条路：',
        '不圆滑，不伪装，不藏着掖着。',
        '这份赤诚，后来让他吃尽了苦头，',
        '却也让他，在吃尽苦头之后，依然还是他自己。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期二：密州湖州 ============
// 玩家定位：穿越到苏轼外放杭州、密州、徐州、湖州任上，与他重逢（第二次见面）。
// 抉择点：1 个"决定性瞬间"（守正不阿）带对错，其余为无对错探索。
const QUEST_P2 = {
  id: 'p2',
  title: '密州湖州',
  range: '1074–1079',
  scene: SCENES.p2,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '密州。城头旌旗猎猎，秋高气爽。你寻到城下，正看见一队人马出城射猎，为首的官员跨马执弓，眉宇间已不似当年那个只知文章的意气书生。',
      scene: 'mizhou',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '待他勒马回头，你才认出——正是当年在蜀地江边结识的苏轼。数年不见，他做了这一方百姓的父母官，鬓边也添了几许风霜。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '（见你，眼睛一亮，翻身下马）是你！蜀地一别，好些年头了。你怎么寻到这密州来了？来来来，随我回衙，咱们好好叙叙旧。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '重逢，他已是一方父母官。你想说什么？',
      options: [
        { text: '苏兄，这些年你过得好吗？', next: 'n2b' },
        { text: '听说你在杭州、密州做官，颇有政声', next: 'n2c' },
        { text: '（望着他，替他的憔悴心疼）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'calm',
      text: '好不好的，你且看这密州的百姓。我这官做得，说不上显赫，倒还算踏实。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '政声不敢当。不过是做了些该做的事——为民请命，为官一任，总要替这一方水土做点什么。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '（他拍拍你的肩，笑了笑）不碍事。做官哪有不吃苦的。你既来了，陪我走走，看看这密州的山水。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'serious',
      scene: 'hangzhou',
      sceneMode: 'flashback',
      npc: false,
      text: '当年我在朝中，见新法推行，多有扰民之处，便直言进谏。结果得罪了新党，被外放杭州做通判。我这一离京，就是好些年。',
      anchor: 's4',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      scene: 'hangzhou',
      sceneMode: 'flashback',
      npc: false,
      question: '听他说起因直言被外放，你心里想的是？',
      options: [
        { text: '为了一句话，丢了京官，值得吗？', next: 'n5' },
        { text: '为民请命，这才是好官', next: 'n6' },
        { text: '（想起他当年那副不肯收敛的模样）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'calm',
      scene: 'chulie',
      sceneMode: 'flashback',
      npc: false,
      text: '值得。我明知直说会招祸，可看见百姓受累，这嘴就闭不上。做官，若只想着自己的乌纱，那还算什么父母官。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'joy',
      scene: 'chulie',
      sceneMode: 'flashback',
      npc: false,
      text: '你懂我！为官一任，若不能替百姓说话、替百姓做事，那这官不做也罢。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'chulie',
      sceneMode: 'flashback',
      npc: false,
      text: '你想起我当年了？是，我还是那个不肯藏着掖着的性子。只是如今，这性子用在了为百姓说话上。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'joy',
      scene: 'chulie',
      sceneMode: 'flashback',
      npc: false,
      text: '在密州，我出猎归来，写下"老夫聊发少年狂，左牵黄，右擎苍"。旁人笑我，说我一把年纪还学那少年狂态。你说，这"狂"字，是褒还是贬？',
      anchor: 's5',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '他自嘲"老夫聊发少年狂"，你听出了什么？',
      options: [
        { text: '是身老心不老的豪情', next: 'n10' },
        { text: '是借狂放，排解壮志难酬的闷气', next: 'n11' },
        { text: '（被这股豪气感染，心头一热）', next: 'n12' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'joy',
      text: '对。鬓虽斑，心未老。"会挽雕弓如满月，西北望，射天狼"——我这报国的心，一刻也没凉过。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '你听出来了。我外放多年，报国无门，只好借这射猎，泄一泄胸中的块垒。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'joy',
      text: '（他仰头一笑）来，改日随我出猎，你也试试那纵马弯弓的滋味！',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'zhongqiu',
      sceneMode: 'flashback',
      npc: false,
      text: '那年中秋，我在密州，想起七年未见的舍弟子由，对月独饮，写下"人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。"',
      anchor: 's5',
      next: 'n14'
    },
    n14: {
      type: 'choice',
      question: '这首《水调歌头》，最打动你的是哪一句？',
      options: [
        { text: '"但愿人长久，千里共婵娟"', next: 'n15' },
        { text: '"人有悲欢离合，月有阴晴圆缺"', next: 'n16' },
        { text: '（一时说不出，只觉得心头酸软）', next: 'n17' }
      ]
    },
    n15: {
      type: 'talk',
      emotion: 'calm',
      text: '那是我的心里话。人虽不能团圆，共看一轮明月，也算团圆了。',
      next: 'n18'
    },
    n16: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '你懂我。月有圆缺，人有离合，这本就是天理。看透了，也就不那么痛了。',
      next: 'n18'
    },
    n17: {
      type: 'talk',
      emotion: 'calm',
      text: '不必说。有些话，写出来比说出来更近。等你哪天想家，抬头看看月亮，就都懂了。',
      next: 'n18'
    },
    n18: {
      type: 'talk',
      emotion: 'serious',
      scene: 'xuzhou',
      sceneMode: 'flashback',
      npc: false,
      text: '后来我到徐州，正赶上黄河决口，洪水围城。我领着军民筑堤，睡在城墙上，一连数十日。那一回，城保住了，我却瘦脱了形。',
      anchor: 's6',
      next: 'n19'
    },
    n19: {
      type: 'choice',
      npc: true,
      question: '他卷起裤脚、满身泥水地抗洪，你想说什么？',
      options: [
        { text: '一州父母官，能做到这个份上，难得', next: 'n20' },
        { text: '您就不怕自己也搭进去？', next: 'n21' },
        { text: '（心里暗暗敬佩，说不出话）', next: 'n22' }
      ]
    },
    n20: {
      type: 'talk',
      emotion: 'calm',
      text: '谈不上难得。洪水要淹的是全城百姓，我这一州长官，不站在最前面，还站在哪里。',
      next: 'n23'
    },
    n21: {
      type: 'talk',
      emotion: 'joy',
      text: '怕？城在人在，城亡我亡。我若不先上城墙，谁还肯拼命。',
      next: 'n23'
    },
    n22: {
      type: 'talk',
      emotion: 'calm',
      text: '（他拍拍你）不必这样看我。为官一任，护这一方百姓，是分内的事。',
      next: 'n22a'
    },
    n22a: {
      type: 'choice',
      npc: true,
      question: '面对变法派与守旧派的党争倾轧，是随波逐流还是守正不阿？若你此刻是他，你会怎么选？',
      options: [
        { text: '明哲保身，只管做官不涉党争', right: false, result: 'n22b', feedback: '你替他选了自保。可真实的他做不到——他看见新法的弊端，就不能装看不见。' },
        { text: '守正不阿，把看到的弊病直说', right: true, result: 'n22c', feedback: '正是。他宁可被外放、被排挤，也要把百姓的疾苦说出来——这份"守正"，日后为他招来了大祸。' },
        { text: '两面逢迎，谁也不得罪', right: false, result: 'n22d', feedback: '你替他选了圆滑。可他偏偏不懂"站队"——他心里只站"百姓"这一队。' }
      ]
    },
    n22b: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '自保？我也想过。可看见百姓受累，这嘴就闭不上。做官，若只想着自己的乌纱，那还算什么父母官。',
      next: 'n23'
    },
    n22c: {
      type: 'talk',
      emotion: 'serious',
      text: '对。我明知直说会招祸，可为民请命，是我做官的本分。宁可被外放、被排挤，我也要替百姓把话说出来。',
      next: 'n23'
    },
    n22d: {
      type: 'talk',
      emotion: 'calm',
      text: '逢迎？我最学不会的就是"站队"。我心里只站一队——百姓。谁对百姓好，我就向着谁。',
      next: 'n23'
    },
    n23: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'mizhou',
      text: '你随我走这一程，也看见我这官是怎么做的了。这官场，新旧两党斗得厉害，我夹在中间，两头不讨好。可我只认一杆秤——百姓。你心里若有疑问，尽管问。',
      next: 'n24'
    },
    n24: {
      type: 'aiFree',
      trap: {
        text: '（放下茶盏，轻叹）那年中秋，我在密州写下《水调歌头》。"明月几时有？把酒问青天。不知天上宫阙，今夕是何年。"——这首诗，是我写给亡妻的。',
        wrong: '《水调歌头》是写给亡妻的诗',
        right: '《水调歌头》是写给弟弟苏辙的词，不是诗，更不是写给亡妻',
        hint: '《水调歌头·明月几时有》是中秋怀弟苏辙之作；《江城子·十年生死两茫茫》才是悼念亡妻王弗的词',
        catchText: '（一顿，摇头失笑）是我糊涂了。《水调歌头》是中秋怀子由的词，不是诗；悼念亡妻的是《江城子》那首。你倒替我记得清楚——我这作词的人，反被自己的句子绕晕了。',
        anchor: 's5',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你与苏轼在密州重逢，他正任一方父母官。他谈起因直言被外放的经历、密州出猎的《江城子》、中秋怀弟的《水调歌头》、徐州抗洪的往事，以及他不肯随波逐流的守正之心。你可以问他外放缘由、密州出猎、水调歌头、徐州抗洪、为何不肯站队。',
      hint: '你可以问苏轼：外放缘由、《江城子》、《水调歌头》、徐州抗洪、党争……',
      suggestions: ['您为何会被外放？', '《水调歌头》是想念弟弟写的吗？', '夹在新旧党之间，您怎么自处？'],
      scene: 'mizhou',
      minRounds: 1,
      next: 'n25'
    },
    n25: {
      type: 'reflect',
      lines: [
        '临别时，我看着他卷起裤脚、满身泥水地从城墙上下来，像极了一个再普通不过的地方小官。',
        '谁能想到，这个在徐州城头抗洪的人，就是那个"名动京师"的少年才子。',
        '他反对新法，不肯随波逐流；他为民请命，把"百姓"两个字，看得比官位还重。',
        '我那时想，这样一个踏踏实实做事、又不知避讳的人，日子该有多难。',
        '可他却说，为官一任，总要替这一方水土做点什么。',
        '如今想来，正是这些在地方上熬出来的年岁，',
        '把他从"少年苏子瞻"，一点点熬成了"天下人苏轼"。',
        '只是当时谁也不知道，一场更大的风暴，正在前面等着他。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期三：乌台诗案 ============
// 玩家定位：穿越到苏轼因"乌台诗案"被逮、下狱、贬黄州的过程中，陪他走过生死之劫（第三次见面）。
// 抉择点：1 个"决定性瞬间"（守住本心）带对错，其余为无对错探索。
const QUEST_P3 = {
  id: 'p3',
  title: '乌台诗案',
  range: '1079',
  scene: SCENES.p3,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '元丰二年，湖州。这一日，官署外突然来了一队差役，为首之人脸色阴沉。你远远看见，他们如狼似虎地闯入，不一会儿，便押着一个人出来。',
      scene: 'daiyu',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '那人神色平静，脚步却有些虚浮——正是苏轼。有人从他往日的诗文中，摘出词句，罗织罪名，说他"讥讽朝廷、诽谤新法"。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'calm',
      text: '（见你，微微一怔，随即苦笑）连你也来了。无妨——他们说我诗里有罪，要拿我去御史台问话。我这一去，也不知还能不能回来。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '眼看着他要被押走，你想说什么？',
      options: [
        { text: '苏公，您不会有事的', next: 'n2b' },
        { text: '他们凭什么抓人？', next: 'n2c' },
        { text: '（看着他，满心酸楚，说不出话）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'calm',
      text: '但愿如此。只是这御史台，进去容易出来难。你替我带句话给家里——就说，不必太难过。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '凭什么？就凭我从诗里写了几句真话。这世道，说实话的，倒成了罪。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '（他反过来拍拍你的肩）别这样。我苏子瞻，风里雨里都闯过来了，这一遭，也未必过不去。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'sad',
      scene: 'yuzhong',
      text: '我被关进了御史台的大狱。那地方，古时多植柏树，常有乌鸦栖息，人唤作"乌台"。我就这样，成了"乌台诗案"里那个待罪的人。',
      anchor: 's7',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      npc: true,
      question: '狱中的苏轼，此刻最可能在想什么？',
      options: [
        { text: '这一关，怕是要熬不过去了', next: 'n5' },
        { text: '问心无愧，死又何惧', next: 'n6' },
        { text: '（不知从何说起）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'sad',
      text: '我也这样想过。夜里望着铁窗外的天，只觉这一生，怕是到头了。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'calm',
      text: '是。我怕过，可想来想去，我问心无愧——写过的字，都是心里的话，没一句违心。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'sad',
      text: '你不必替我难过。我这一生，说过的话、写过的字，都对得起自己的心。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'sad',
      scene: 'juebie',
      sceneMode: 'flashback',
      npc: false,
      text: '有一夜，我以为必死，便给舍弟写下诀别的诗，说"与君世世为兄弟，更结人间未了因"。若有来世，我还愿同他做兄弟。',
      anchor: 's8',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      question: '听到他写给弟弟的诀别诗，你心里想的是？',
      options: [
        { text: '兄弟情深，令人动容', next: 'n10' },
        { text: '您真的以为自己会死吗？', next: 'n11' },
        { text: '（眼眶一热，说不出话）', next: 'n12' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'sad',
      text: '子由与我，自幼同窗，手足情深。若能活下来，这份情谊，比什么都重。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'calm',
      text: '那些日子，生死只在朝夕。我不是不怕，是怕过之后，反而看开了。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'sad',
      text: '（他轻声）别哭。诗都写了，人也还在，就是还有希望。',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'yuzhong',
      text: '后来，舍弟上书，愿以自己一官来赎我；朝中几位大人，也替我求情。加上太祖"不杀士大夫"的祖训，我这条命，总算保住了。',
      anchor: 's8',
      next: 'n14'
    },
    n14: {
      type: 'choice',
      npc: true,
      question: '生死一线之际，是求饶苟活还是守住风骨？若你此刻是他，你会怎么选？',
      options: [
        { text: '低头认罪，把责任推给别人，求个活命', right: false, result: 'n15', feedback: '你替他选了苟活。可真实的他，宁可死，也不肯为求生而害人、而诬己。' },
        { text: '守住本心，宁可受屈也不诬己害人', right: true, result: 'n16', feedback: '正是。他在绝境里想的不是求生，是"此生无悔"——这份骨气，撑过了最暗的夜。' },
        { text: '万念俱灰，索性听天由命', right: false, result: 'n17', feedback: '你替他选了认命。可他连"认命"都不肯——他信的是"问心无愧，死又何惧"。' }
      ]
    },
    n15: {
      type: 'talk',
      emotion: 'serious',
      text: '求活？我若为了活命去诬陷别人、糟蹋自己的本心，那活下来的，还是我苏子瞻吗？',
      next: 'n18'
    },
    n16: {
      type: 'talk',
      emotion: 'calm',
      text: '对。我宁可死在狱里，也不肯为求生而害人、而诬己。这份问心无愧，是我在鬼门关前，唯一攥紧的东西。',
      next: 'n18'
    },
    n17: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '认命？我不认。命要拿，我认；心要改，我不改。问心无愧，死又何惧。',
      next: 'n18'
    },
    n18: {
      type: 'talk',
      emotion: 'calm',
      scene: 'chuyu',
      text: '最终，我免了死罪，被贬去黄州，做个无权无势的团练副使。出狱那天，我望着久违的天空，忽然就笑了。',
      anchor: 's9',
      next: 'n19'
    },
    n19: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '小兄弟，你陪我走过了这最暗的一段。死过一回的人，从此把什么都看轻了。你心里若还有想问的，趁这会儿，尽管问。',
      next: 'n20'
    },
    n20: {
      type: 'aiFree',
      trap: {
        text: '（望着铁窗外的天，低声）这"乌台"，是御史台的别称。古时御史台前多植松树，四季常青，故有此名。',
        wrong: '御史台前多植松树',
        right: '御史台前多植柏树，常有乌鸦栖息，故称"乌台"',
        hint: '"乌台"之名，源于汉代御史台多植柏树、常有乌鸦栖息',
        catchText: '（一顿，摇头）是柏树，不是松树。御史台前植的是柏树，乌鸦常栖息其上，才叫"乌台"。我这一遭进了乌台，连里头的树都记岔了。你比我这坐牢的还清醒。',
        anchor: 's7',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你陪苏轼走过"乌台诗案"的生死之劫。他谈起被逮、下狱、诀别诗、免死贬黄州的经历，以及他在绝境中守住本心、勘破生死的心境。你可以问乌台诗案的由来、狱中心境、诀别诗、为何不怨、获救之后的想法。',
      hint: '你可以问苏轼：乌台诗案的由来、狱中心境、《狱中寄子由》、免死的经过……',
      suggestions: ['"乌台诗案"到底是怎么回事？', '狱中您最放不下的是什么？', '死里逃生后，您最想做什么？'],
      scene: 'yuzhong',
      minRounds: 1,
      next: 'n21'
    },
    n21: {
      type: 'reflect',
      lines: [
        '出狱那天，他望着久违的天空，忽然笑了。',
        '一百多天的牢狱，几次与死神擦肩，他瘦得脱了形，眼睛却亮得惊人。',
        '他说，这一遭，他像是死过了一回。',
        '我那时不懂，一个人刚从鬼门关回来，怎么笑得出来。',
        '如今想来，正是这一百多天，把那个"名动京师"的苏轼，',
        '熬成了另一个人——一个把生死都看轻了的人。',
        '一个人连死都不怕了，这世上还有什么放不下？',
        '他不知道，这份从牢狱里带出来的东西，',
        '会在接下来的黄州，开出一朵中国文学史上最灿烂的花。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期四：东坡赤壁（全线高潮） ============
// 玩家定位：穿越到黄州，陪苏轼从绝境里爬起来，见证他开荒东坡、泛舟赤壁（第四次见面）。
// 抉择点：1 个"决定性瞬间"（安之若素）带对错，其余为无对错探索。
const QUEST_P4 = {
  id: 'p4',
  title: '东坡赤壁',
  range: '1080–1084',
  scene: SCENES.p4,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '黄州，长江之畔。初春的江风仍有些料峭，你寻到江边，远远看见一个戴斗笠的人，正俯身在一片荒坡上锄地。',
      scene: 'dongpo',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '待走近了，你才认出——这个满手老茧、汗透衣背的农夫，竟是当年那个"名动京师"的苏轼。他瘦了，老了，眼里的光却更沉了。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'calm',
      text: '（直起身，抹了把汗，见你，笑了）是你。黄州这地方，穷是穷，可这天、这水、这地，都是我的。你来得正好，帮我搭把手。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '再见时，昔日才子成了农夫。你想说什么？',
      options: [
        { text: '苏公，您这是……在种地？', next: 'n2b' },
        { text: '您瘦了，也老了许多', next: 'n2c' },
        { text: '（望着他，心里百味杂陈）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'joy',
      text: '种地。我这"东坡"，就是这么一块一块锄出来的。地是自己的，种出来的粮，吃着踏实。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'calm',
      text: '瘦了，也老了几岁。可这心里的东西，反倒轻快了。走，看看我这几亩地。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '（他拍拍你）不必这样。人到了这一步，才知道什么是本分。地，是我的本分。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'sad',
      scene: 'dinghui',
      sceneMode: 'flashback',
      npc: false,
      text: '刚到黄州时，我寄居在定惠院，穷得揭不开锅。夜里睡不着，只觉"心似已灰之木，身如不系之舟"——那时，我是真觉得，这一生到头了。',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      npc: true,
      question: '从"心似已灰之木"到如今开荒种地，是什么让他变了？',
      options: [
        { text: '是时间，慢慢把伤痛抚平了', next: 'n5' },
        { text: '是他自己，不肯就这么沉下去', next: 'n6' },
        { text: '（一时想不出，只觉得他真不容易）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '时间是一味药。可更管用的，是我忽然想明白：日子总要过，与其愁眉苦脸，不如种点地、喝口酒。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'joy',
      text: '你懂我。人不能总躺在灰里。我拿起锄头那一刻，就告诉自己：沉下去的是"苏轼"，站起来的，得是另一个人。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'calm',
      text: '不容易，可也不难。想通了，就什么都放得下了。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'joy',
      scene: 'dongpo',
      text: '友人帮我在城东求了片坡地，我给它起了个名，叫"东坡"，又给自己起了个号——东坡居士。从此，这世上少了个官场里的苏轼，多了个种地的苏东坡。',
      anchor: 's10',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '他自号"东坡居士"，你听出了什么？',
      options: [
        { text: '是看开了，不再纠结官场得失', next: 'n10' },
        { text: '是自嘲，笑自己竟落到种地的地步', next: 'n11' },
        { text: '（觉得这个名字，朴素里透着股劲）', next: 'n12' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'joy',
      text: '是看开了。这"东坡"，是我拿锄头一锄一锄开出来的，比什么官都实在。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'joy',
      text: '自嘲也好，实在也罢。种地怎么了？我这东坡肉、东坡鱼，可都是拿自己的地种出来的。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'joy',
      text: '你喜欢这名字？我也喜欢。朴素，踏实，像这脚下的地。',
      next: 'n12a'
    },
    n12a: {
      type: 'choice',
      npc: true,
      question: '被贬到一无所有，是怨天尤人还是安之若素？若你此刻是他，你会怎么选？',
      options: [
        { text: '怨天尤人，恨这世道不公', right: false, result: 'n12b', feedback: '你替他选了抱怨。可真实的他，早把"怨"字咽下了——他选择了安之若素。' },
        { text: '安之若素，把苦日子过出滋味', right: true, result: 'n12c', feedback: '正是。他开荒种地、自号东坡，把贬所活成了家园——这是"苏东坡"这个名字的由来。' },
        { text: '借酒消愁，得过且过', right: false, result: 'n12d', feedback: '你替他选了消沉。可他连消沉都不肯——他偏要在泥里，开出花来。' }
      ]
    },
    n12b: {
      type: 'talk',
      emotion: 'calm',
      text: '怨？我也怨过。可怨天尤人，救不了自己。我拿起锄头，把怨气都翻进了土里。',
      next: 'n13'
    },
    n12c: {
      type: 'talk',
      emotion: 'joy',
      text: '对。日子总要过，与其愁眉苦脸，不如把这片坡地种好。我种的是地，长出来的，是我的心气。',
      next: 'n13'
    },
    n12d: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '酒能解一时之愁，解不了一世。我偏不肯消沉——这泥里，也能开出花来。',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'fanchuan',
      sceneMode: 'flashback',
      npc: false,
      text: '那年七月，我与客泛舟赤壁。江风皓月，我写下"寄蜉蝣于天地，渺沧海之一粟"——人这一生，不过天地间的一粒粟米。',
      anchor: 's11',
      next: 'n14'
    },
    n14: {
      type: 'talk',
      emotion: 'joy',
      scene: 'chibi',
      text: '十月再游赤壁，我又写下"大江东去，浪淘尽，千古风流人物"。你且看这江——多少英雄，都随着这滚滚江水，流过去了。',
      anchor: 's11',
      next: 'n15'
    },
    n15: {
      type: 'choice',
      npc: true,
      question: '他说"大江东去，浪淘尽，千古风流人物"，你听出了什么？',
      options: [
        { text: '是豪放，把个人的愁放进历史长河里了', next: 'n16' },
        { text: '是看淡，既然英雄都会消逝，何况自己', next: 'n17' },
        { text: '（望着江水，心头忽然开阔了）', next: 'n18' }
      ]
    },
    n16: {
      type: 'talk',
      emotion: 'joy',
      text: '是。个人的荣辱得失，放到这长江里，算什么。看开了，人就豁达了。',
      next: 'n19'
    },
    n17: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '看淡，但不悲观。英雄会消逝，可这江水永远在流，人生也该往前走。',
      next: 'n19'
    },
    n18: {
      type: 'talk',
      emotion: 'joy',
      text: '（他朗声一笑）说得好！江流千古，人生一瞬，正因如此，才更该好好活。',
      next: 'n19'
    },
    n19: {
      type: 'talk',
      emotion: 'joy',
      scene: 'dingfeng',
      sceneMode: 'flashback',
      npc: false,
      text: '那年三月，我过沙湖遇雨，同行的人都狼狈躲雨，我却拄着竹杖，慢慢走。"竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。"',
      anchor: 's12',
      next: 'n20'
    },
    n20: {
      type: 'choice',
      npc: true,
      question: '"一蓑烟雨任平生"——你听出了怎样的人生态度？',
      options: [
        { text: '坦然面对人生的风风雨雨', next: 'n21' },
        { text: '把苦难看淡，随遇而安', next: 'n22' },
        { text: '（心里像被什么照亮了）', next: 'n23' }
      ]
    },
    n21: {
      type: 'talk',
      emotion: 'calm',
      text: '对。风雨来了，躲不过，就带着斗笠走过去。走过去了，回头看，也不过是"也无风雨也无晴"。',
      next: 'n24'
    },
    n22: {
      type: 'talk',
      emotion: 'joy',
      text: '正是。人生哪能没有风雨，躲是躲不掉的，不如从容一点，笑着走。',
      next: 'n24'
    },
    n23: {
      type: 'talk',
      emotion: 'calm',
      text: '（他望了望你，会心一笑）你听懂了。这雨，淋在身上是雨，落在心里，就成了诗。',
      next: 'n24'
    },
    n24: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'dongpo',
      text: '小兄弟，你在黄州陪我这许久，看着我从灰里爬起来。我这一身，如今只爱这东坡的地、赤壁的江。你心里若还有想问的，尽管问，我一边锄地，一边答你。',
      next: 'n25'
    },
    n25: {
      type: 'aiFree',
      trap: {
        text: '（直起身，望着江面）你看这赤壁，当年周瑜大破曹操八十万大军，就是在这里。我写的"大江东去"，写的也正是这段旧事。',
        wrong: '黄州赤壁就是周瑜破曹的古战场',
        right: '黄州赤壁（赤鼻矶）并非赤壁之战的古战场，真正的古战场一般认为在别处',
        hint: '苏轼所游的黄州赤壁并非周瑜破曹之地，他自己也写"人道是"，留有余地',
        catchText: '（抚掌而笑）你又捉住我了！这黄州的赤壁，其实未必是当年周瑜破曹的地方。我写"人道是，三国周郎赤壁"，那"人道是"三个字，就是留了余地的。真正的古战场在哪儿，连我也说不准。可这不妨碍我借这江水，抒一抒胸中的块垒。',
        anchor: 's11',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你陪苏轼在黄州，见证他从"心似已灰之木"的绝境里爬起来，开荒东坡、自号东坡居士、泛舟赤壁，写下《赤壁赋》《念奴娇·赤壁怀古》《定风波》等千古名篇。你可以问开荒东坡的缘由、《赤壁赋》的哲思、《念奴娇》的豪情、《定风波》的旷达、为何能安之若素。',
      hint: '你可以问苏轼：开荒东坡、《赤壁赋》、《念奴娇》、《定风波》、为何能看开……',
      suggestions: ['"东坡居士"这个号是怎么来的？', '《赤壁赋》里"变与不变"是什么意思？', '被贬到一无所有，您怎么还笑得出来？'],
      scene: 'dongpo',
      minRounds: 1,
      next: 'n26'
    },
    n26: {
      type: 'reflect',
      lines: [
        '临别时，我站在东坡的田埂上，看他在自己开垦的土地上，直起腰，抹了把汗。',
        '谁能想到，这个戴着斗笠、满手老茧的农夫，就是写下"大江东去"的人。',
        '初到黄州时，他穷得揭不开锅，寄居在一座破庙里。',
        '可他没有怨天，没有尤人，而是扛起锄头，开出一片坡地，给自己起了个号——东坡。',
        '他在赤壁泛舟，说"寄蜉蝣于天地，渺沧海之一粟"；',
        '他在雨中徐行，说"一蓑烟雨任平生"。',
        '我那时才懂：他失去了一切，却得到了自由；',
        '他被放逐到了最偏远的角落，却把那个角落，活成了自己的天堂。',
        '从此，世间少了一个"苏轼"，多了一个"苏东坡"。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期五：岭南北归 ============
// 玩家定位：穿越到苏轼晚年，陪他走完从再贬岭南、海南到遇赦北归、病逝常州的最后一程（第五次见面）。
// 抉择点：1 个"决定性瞬间"（随遇而安）带对错，其余为无对错探索。
const QUEST_P5 = {
  id: 'p5',
  title: '岭南北归',
  range: '1094–1101',
  scene: SCENES.p5,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '儋州，海南岛。这里是当时最荒远的天涯海角，烈日之下，一个花甲老人正在一间简陋的学堂里，给几个黎族的孩子讲书。',
      scene: 'danzhou',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你走近了，认出那老人正是苏轼。他更老了，须发皆白，可声音依然洪亮，讲到兴起处，抚掌而笑，全然不像一个被流放到绝地的罪臣。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '（讲完书，见你，起身相迎）你又来了。这海南岛，山高水远，寻常人一辈子也来不了一回，你倒来了两次。坐，我给你倒碗椰子水。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '再见，他已被流放到天涯海角。你想说什么？',
      options: [
        { text: '苏公，您受苦了', next: 'n2b' },
        { text: '您在这儿，还教书？', next: 'n2c' },
        { text: '（望着他的白发，眼眶发酸）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'calm',
      text: '苦？刚来时，是苦的——食无肉，病无药，居无室，出无友。可住久了，也就惯了。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '教书。这海南岛，缺的正是文脉。我这一把年纪，别的做不了，教几个孩子读书认字，还是使得的。',
      anchor: 's20',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '（他笑望着你）别为我难过。我这辈子，官越做越远，心却越活越开。你来了，是件喜事。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'calm',
      scene: 'huizhou',
      sceneMode: 'flashback',
      npc: false,
      text: '前几年，我先被贬到惠州。岭南那地方，荔枝极甜，我吃着吃着，便写下"日啖荔枝三百颗，不辞长作岭南人"。',
      anchor: 's19',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      npc: true,
      question: '"不辞长作岭南人"——你听出了什么？',
      options: [
        { text: '他把流放地，当成了自己的家', next: 'n5' },
        { text: '这是苦中作乐的自嘲', next: 'n6' },
        { text: '（觉得他真了不起，什么苦都能品出甜来）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'joy',
      text: '是。心在哪里，家就在哪里。岭南的荔枝甜，海南的椰子清，哪里的日子，不是日子。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'joy',
      text: '是乐，也是真。日子苦不苦，看你怎么品。我偏要把这苦，品出点甜味来。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'joy',
      text: '（他哈哈一笑）人生如逆旅，我亦是行人。走到哪儿，就赏哪儿的风光。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'lixue',
      sceneMode: 'flashback',
      npc: false,
      text: '后来我又被贬到这儋州，比惠州更远。可我在这儿办学、传文、交黎族朋友，反倒觉得，这片土地格外亲。我还写过一句——"我本儋耳人，寄生西蜀州"。',
      anchor: 's20',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '"我本儋耳人，寄生西蜀州"——你听出了什么？',
      options: [
        { text: '他把海南当故乡，把四川当客居', next: 'n10' },
        { text: '这是看破红尘的洒脱', next: 'n11' },
        { text: '（被他的豁达深深打动）', next: 'n12' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'joy',
      text: '正是。人生天地间，走到哪儿，哪儿就是故乡。这海南岛的山水，跟眉山的山水，原也没什么两样。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '谈不上看破红尘，只是把"故乡"二字看淡了。心安处，即是家。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'calm',
      text: '（他望了望海，轻声）人这一生，不过是在天地间寄宿一程。想通了，就哪里都去得。',
      next: 'n12a'
    },
    n12a: {
      type: 'choice',
      npc: true,
      question: '垂暮之年再贬天涯，是心灰意冷还是随遇而安？若你此刻是他，你会怎么选？',
      options: [
        { text: '心灰意冷，哀叹晚年流落天涯', right: false, result: 'n12b', feedback: '你替他选了认命。可真实的他，偏要在天涯海角，把日子过得热气腾腾。' },
        { text: '随遇而安，把天涯海角当成故乡', right: true, result: 'n12c', feedback: '正是。他办学、传文、交农友，说"我本儋耳人"——他已经把天涯活成了家。' },
        { text: '强打精神，苦苦熬到遇赦', right: false, result: 'n12d', feedback: '你替他选了硬熬。可他连"熬"都不是——他是真的在享受这段流放。' }
      ]
    },
    n12b: {
      type: 'talk',
      emotion: 'calm',
      text: '心灰？我这把年纪，若真灰了心，早倒在这路上了。我偏不信，天涯海角就活不出个样子来。',
      next: 'n13'
    },
    n12c: {
      type: 'talk',
      emotion: 'joy',
      text: '对。这海南岛，山好，水好，人也亲。我把这儿当家，这儿就真成了我的家。',
      next: 'n13'
    },
    n12d: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '熬？我不熬。这儿的椰子清甜，海风也爽快，我住着，是真舒坦。',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'jinshan',
      sceneMode: 'flashback',
      npc: false,
      text: '后来朝廷大赦，我北归。途中游金山寺，回望自己这一生，写下"问汝平生功业，黄州惠州儋州"。',
      anchor: 's21',
      next: 'n14'
    },
    n14: {
      type: 'choice',
      npc: true,
      question: '他把三次被贬的地方，说成"平生功业"。你听出了什么？',
      options: [
        { text: '是自嘲，笑自己一生被贬', next: 'n15' },
        { text: '是看透，把苦难都化成了财富', next: 'n16' },
        { text: '（一时不知是心酸还是敬佩）', next: 'n17' }
      ]
    },
    n15: {
      type: 'talk',
      emotion: 'calm',
      text: '有自嘲，可也不全是。这三次流放，是苦，可也正是在那些最苦的地方，我活明白了。',
      next: 'n18'
    },
    n16: {
      type: 'talk',
      emotion: 'joy',
      text: '你懂我！黄州、惠州、儋州，一处比一处远，可正是在这些地方，我写出了最好的文章，也活成了最真的自己。',
      next: 'n18'
    },
    n17: {
      type: 'talk',
      emotion: 'calm',
      text: '（他拍拍你的肩）不必替我难过。这"功业"二字，我写得，心安。',
      next: 'n18'
    },
    n18: {
      type: 'talk',
      emotion: 'calm',
      scene: 'danzhou',
      text: '小兄弟，你陪我走到了这最后一程。我这一生，官没做大，家没安久，可我走过的路、写过的字，都对得起自己的心。你心里若还有想问的，趁这会儿，尽管问。',
      next: 'n19'
    },
    n19: {
      type: 'aiFree',
      trap: {
        text: '（望着海面，缓缓）我在惠州写过一首诗，"罗浮山下四时春，卢橘杨梅次第新。日啖荔枝三百颗，不辞长作岭南人。"——这诗，是我写给我的弟弟子由的。',
        wrong: '《惠州一绝》是写给弟弟苏辙的',
        right: '《惠州一绝》是写岭南风物、表达旷达心境之作，并非写给苏辙',
        hint: '《惠州一绝》（"日啖荔枝三百颗"）是苏轼写岭南生活与心境之作，不是寄弟诗；写子由的是《水调歌头》等',
        catchText: '（一怔，失笑）是我记岔了。这"日啖荔枝三百颗"，写的是我自己的岭南心境，不是写给子由的。你倒比我这作诗的还清楚——看来我这一生的诗，你都替我记着了。',
        anchor: 's19',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你陪苏轼走完晚年的最后一程。他谈起再贬惠州、儋州的经历、在海南办学传文、把天涯海角当故乡的豁达、"问汝平生功业，黄州惠州儋州"的总结，以及遇赦北归的心境。你可以问再贬的心境、儋州生活、办学传文、"平生功业"、这一生的悔与不悔。',
      hint: '你可以问苏轼：再贬心境、儋州生活、"平生功业"、北归、一生的悔与不悔……',
      suggestions: ['再贬海南，您是怎么熬过来的？', '"问汝平生功业"是什么意思？', '这一生，您最不悔的是什么？'],
      scene: 'danzhou',
      minRounds: 1,
      next: 'n20'
    },
    n20: {
      type: 'reflect',
      lines: [
        '终程。我最后一次回望，望的是他这一生走过的路。',
        '那个一举成名、名动京师的少年，那个在徐州城头抗洪的父母官，',
        '那个在乌台死牢里勘破生死的人，那个在东坡开荒、在赤壁泛舟的东坡居士，',
        '最后，成了一个被放逐到天涯海角、却把天涯海角都活成故乡的老人。',
        '他这一生，官越做越远，人却越活越开。',
        '有人为他鸣不平，他却笑着写下："问汝平生功业，黄州惠州儋州。"',
        '把三次流放，说成是平生功业——这不是自嘲，是真正的看透。',
        '我忽然明白，苏轼这一生，教会我们的不是"如何成功"，',
        '而是"如何在输掉一切之后，还笑着活出滋味"。',
        '这，就是我能告诉你的、真实的苏轼——',
        '一个把风风雨雨，都走成了一场风景的人。'
      ],
      next: '__end__'
    }
  }
};

// ============ 锚点名称表 ============
// 本版统一：每个地点一个锚点，编号 = 地点序号（s1–s22），
// 与地点剧情 anchorCard、anchor-info 知识卡、chat 知识库一一对应。
const ANCHORS = {
  s1: '程母授书与范滂之问',
  s2: '嘉祐二年礼部试',
  s3: '制科入三等与凤翔签判',
  s4: '通判杭州与独立立场',
  s5: '密州出猎、中秋与救灾',
  s6: '徐州抗洪',
  s7: '乌台诗案的开端',
  s8: '乌台诗案',
  s9: '初到黄州与《卜算子》',
  s10: '东坡居士',
  s11: '赤壁三咏',
  s12: '《定风波》与《浣溪沙》',
  s13: '《记承天寺夜游》',
  s14: '五日知州与两道奏疏',
  s15: '苏堤与白堤辨正',
  s16: '疏浚颍州西湖与拒开八丈沟',
  s17: '罢万花会与论积欠',
  s18: '定州整军与中山松醪',
  s19: '惠州·荔枝与朝云',
  s20: '儋州三年',
  s21: '自题金山画像',
  s22: '常州病逝'
};

module.exports = {
  id: 'sushi',
  periods: PERIODS,
  quests: { p1: QUEST_P1, p2: QUEST_P2, p3: QUEST_P3, p4: QUEST_P4, p5: QUEST_P5 },
  scenes: SCENES,
  sceneSets: SCENE_SETS,
  npcImage: NPC_IMAGE,
  periodNpcImages: PERIOD_NPC_IMAGES,
  periodNpcAnimations: PERIOD_NPC_ANIMATIONS,
  anchors: ANCHORS
};
