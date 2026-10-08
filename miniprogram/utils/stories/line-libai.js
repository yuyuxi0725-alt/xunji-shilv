// utils/stories/line-libai.js —— 「李白」故事线数据（独立文件，与其他古人解耦）
//
// 结构完全仿照 line-dufu.js，节点类型与 chat 引擎对齐：
//   narrate(旁白) | talk(对话) | choice(选项) | aiFree(自由AI对话) | reflect(结尾讲述)
// 关键约定：
//   - 决定性瞬间：choice 选项带 right: true/false + result + feedback
//   - 回忆闪回：节点 sceneMode:'flashback' + npc:false（隐藏立绘）
//   - 锚点：anchor:'lX' 挂在 talk/narrate 节点
//   - 立绘：talk/choice/aiFree 显示，narrate 隐藏，reflect 隐藏（引擎兜底 + 节点可显式 npc 覆盖）
//
// 图片迁移云存储：路径由 img() 运行时拼接，再由 cloudAssets 解析为云链接。
const IMG = '/assets/' + 'images/';
function img(sub) { return IMG + sub; }

// ============ 场景图（已由 ImageGen 生成，命名对齐 scene-libai-pX-xxx.jpg） ============
const SCENES = {
  p1: img('scenes/scene-libai-p1-jiang.jpg'),
  p2: img('scenes/scene-libai-p2-changan.jpg'),
  p3: img('scenes/scene-libai-p3-gongting.jpg'),
  p4: img('scenes/scene-libai-p4-liangsong.jpg'),
  p5: img('scenes/scene-libai-p5-lushan.jpg')
};

const SCENE_SETS = {
  p1: {
    jiang:    img('scenes/scene-libai-p1-jiang.jpg'),     // 蜀地江畔·峨眉山脚
    chuanshu: img('scenes/scene-libai-p1-chuanshu.jpg'),  // 回忆·少年书斋（五岁诵六甲）
    emei:     img('scenes/scene-libai-p1-emei.jpg'),      // 峨眉山月
    jingmen:  img('scenes/scene-libai-p1-jingmen.jpg')    // 渡荆门·出峡
  },
  p2: {
    changan:  img('scenes/scene-libai-p2-changan.jpg'),   // 长安市井
    ganxie:   img('scenes/scene-libai-p2-ganxie.jpg'),    // 回忆·权贵门前干谒
    zhongnan: img('scenes/scene-libai-p2-zhongnan.jpg'),  // 终南山玉真公主别馆
    jiulou:   img('scenes/scene-libai-p2-jiulou.jpg')     // 市井酒肆
  },
  p3: {
    gongting: img('scenes/scene-libai-p3-gongting.jpg'),  // 宫廷·沉香亭
    chunfeng: img('scenes/scene-libai-p3-chunfeng.jpg'),  // 巅峰·天子礼遇
    qingping: img('scenes/scene-libai-p3-qingping.jpg'),  // 回忆·醉中奉诏作清平调
    fanghuan: img('scenes/scene-libai-p3-fanghuan.jpg')   // 出城·赐金放还
  },
  p4: {
    liangsong: img('scenes/scene-libai-p4-liangsong.jpg'),// 梁宋·三人同游
    jiangjin:  img('scenes/scene-libai-p4-jiangjin.jpg'), // 嵩山元丹丘山居·将进酒饮宴
    tianmu:    img('scenes/scene-libai-p4-tianmu.jpg'),   // 回忆·天姥山（梦游）
    xietiao:   img('scenes/scene-libai-p4-xietiao.jpg')   // 宣州谢朓楼
  },
  p5: {
    lushan:   img('scenes/scene-libai-p5-lushan.jpg'),    // 庐山草庐·永王使者来请
    yongwang: img('scenes/scene-libai-p5-yongwang.jpg'),  // 回忆·入幕
    yuzhong:  img('scenes/scene-libai-p5-yuzhong.jpg'),   // 浔阳狱
    baidi:    img('scenes/scene-libai-p5-baidi.jpg')      // 遇赦·白帝城
  }
};

const NPC_IMAGE = img('npc/libai-default.png');

const PERIOD_NPC_IMAGES = {
  p1: img('npc/libai-p1-young.png'),
  p2: img('npc/libai-p2-qiushi.png'),
  p3: img('npc/libai-p3-hanlin.png'),
  p4: img('npc/libai-p4-manman.png'),
  p5: img('npc/libai-p5-old.png')
};

// ============ 时期列表（story 页卡牌） ============
const PERIODS = [
  { id: 'p1', name: '仗剑出蜀', range: '725–730', desc: '少年意气，辞亲远游', poem: '峨眉山月半轮秋，影入平羌江水流' },
  { id: 'p2', name: '干谒求仕', range: '730–741', desc: '长安失意，穷愁潦倒', poem: '安能摧眉折腰事权贵' },
  { id: 'p3', name: '供奉翰林', range: '742–744', desc: '天子赏识，赐金放还', poem: '云想衣裳花想容' },
  { id: 'p4', name: '纵酒漫游', range: '744–755', desc: '与李杜同游，理想幻灭', poem: '天生我材必有用' },
  { id: 'p5', name: '乱世浮沉', range: '755–762', desc: '卷入永王之乱，流放遇赦', poem: '千里江陵一日还' }
];

// ============ 时期一：仗剑出蜀 ============
// 玩家定位：穿越到蜀地江畔，偶遇正准备"仗剑去国、辞亲远游"的青年李白（初见）。
// 抉择点：1 个"决定性瞬间"（不走科举）带对错，其余为无对错探索。
const QUEST_P1 = {
  id: 'p1',
  title: '仗剑出蜀',
  range: '725–730',
  scene: SCENES.p1,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '你睁开眼，发现自己站在一条大江边。山高水长，江风浩荡，远处是层层叠叠的青山，直插云天。',
      scene: 'jiang',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你低头看看自己——一身粗布衣裳。你明白，你已不在原来的时代，而是来到了大唐。',
      next: 'n1b'
    },
    n1b: {
      type: 'narrate',
      text: '江边，一个白衣青年正把行囊往小船上搬。他腰间佩着一柄剑，眉宇间尽是掩不住的意气。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '（抬头见你，朗声大笑）好！又是个要远行的！我，李白，字太白。今日正要出了这蜀地，仗剑去国、辞亲远游，把这大唐的天下，走它个遍！来，报个名号——你打哪儿来，又要往哪儿去？',
      anchor: 'l2',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '面对这位佩剑的白衣青年，你的第一反应是？',
      options: [
        { text: '好一个意气风发的少年！敢问要去往何处？', next: 'n2b' },
        { text: '佩剑远游，莫非是位游侠？', next: 'n2c' },
        { text: '（被他的豪气震了一下，一时没接上话）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'joy',
      text: '去处？天下之大，何处去不得！先出三峡，下江陵，再往金陵、扬州，一路看尽这大唐的繁华去。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '好眼力！我十五岁就好剑术，遍访蜀中名师。这剑不是摆样子的——出门在外，仗剑方能护得一身胆气。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'joy',
      text: '哈哈，不必拘束。我这个人，天生就爱笑、爱酒、爱这山川。你且陪我在这江边走走，咱们边走边聊。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'joy',
      scene: 'chuanshu',
      sceneMode: 'flashback',
      npc: false,
      text: '不瞒你说，我五岁诵六甲，十岁观百家，十五岁就写得一手好赋，连那司马相如，我也敢跟他比一比。你且说——旁人五岁时还在玩泥巴，我五岁已能背天下文章，这算不算天生的奇才？',
      anchor: 'l1',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      question: '听他说五岁便能诵六甲，你心里想的是？',
      options: [
        { text: '这是怎样的天资，才养出这样的少年？', next: 'n5' },
        { text: '读了这许多书，你最想做的是什么？', next: 'n6' },
        { text: '（暗自惭愧，自己五岁时只知玩耍）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'joy',
      scene: 'chuanshu',
      sceneMode: 'flashback',
      npc: false,
      text: '天资谈不上，是父亲逼得紧。不过书读多了，心就野了——我不想困在一方书斋里，我要去亲眼看看，书上写的那片天下。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'joy',
      scene: 'chuanshu',
      sceneMode: 'flashback',
      npc: false,
      text: '问得好！读书不是为了做官，是为了心里的那团火——我想像大鹏一样，扶摇直上九万里，让天下人都记住"李白"这两个字。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'joy',
      scene: 'chuanshu',
      sceneMode: 'flashback',
      npc: false,
      text: '哈哈，何必自谦。每个人的路不同，我不过起得早些罢了。你这一路走来，定也有你的见识。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'serious',
      scene: 'chuanshu',
      sceneMode: 'flashback',
      npc: false,
      text: '只是有件事，乡里人常劝我，说我读书好，该去考个功名，走科举正途。可我偏不。我这一生，不愿去挤那一张榜。',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '他竟不肯走科举正途。你心里想的是？',
      options: [
        { text: '读书人都走科举，为何你偏不走？', next: 'n9a' },
        { text: '不走科举，那你靠什么入世？', next: 'n9b' }
      ]
    },
    n9a: {
      type: 'talk',
      emotion: 'serious',
      text: '那榜上写的是名次，写不进一个人的才情。我李白，要凭一支笔、一柄剑、一身傲骨，让天子亲自来请我。',
      next: 'n10'
    },
    n9b: {
      type: 'talk',
      emotion: 'joy',
      text: '靠诗名，靠侠气！我去干谒公卿，去游历天下，让我的诗替我叩开长安的门。天生我材必有用，何必非走那一条道。',
      next: 'n10'
    },
    n10: {
      type: 'choice',
      scene: 'emei',
      sceneMode: 'flashback',
      npc: false,
      question: '临别前，乡人仍在劝他：读书人终究要走科举正途。若你此刻是他，你会怎么选？',
      options: [
        { text: '听劝，去走科举正途，稳当些', right: false, result: 'n11', feedback: '你替他选了安稳。可真实的他，偏偏不肯——科举那条路，他一辈子没走。' },
        { text: '不走科举，凭文名和侠气闯天下', right: true, result: 'n12', feedback: '对了！"天生我材必有用"，他要的不是一张榜，是整个天下。' },
        { text: '先考一次试试，不行再说', right: false, result: 'n13', feedback: '你替他留了退路。可他不屑一试——他连那张榜，都不愿低头去瞧一眼。' }
      ]
    },
    n11: {
      type: 'talk',
      emotion: 'calm',
      text: '我若肯走那条路，便不是我了。那张榜能拴住多少人的一生，却拴不住我——我要走的，是一条别人没走过的路。',
      next: 'n14'
    },
    n12: {
      type: 'talk',
      emotion: 'joy',
      text: '痛快！你懂我！人生在世，若只为了一张榜、一顶乌纱，那还有什么意思。我要这天地记住我，凭的是我的诗，不是我的官。',
      next: 'n14'
    },
    n13: {
      type: 'talk',
      emotion: 'joy',
      text: '试它作甚？我连那榜都不屑一顾。旁人道我狂，我却觉着——一个人若连自己要走哪条路都不敢选，那才真是白活。',
      next: 'n14'
    },
    n14: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'emei',
      sceneMode: 'flashback',
      npc: false,
      text: '昨夜我立在峨眉山头，看半轮秋月，映在平羌江里，澄澈得像能照见人心。"峨眉山月半轮秋，影入平羌江水流"——这一去，不知何年才能再见这峨眉的月。',
      anchor: 'l3',
      next: 'n15'
    },
    n15: {
      type: 'choice',
      question: '他望着峨眉的月亮出神，你猜他心里装的是什么？',
      options: [
        { text: '舍不得蜀地的故乡和亲人', next: 'n16' },
        { text: '既留恋，又向往远方的天地', next: 'n17' },
        { text: '这月亮会一路跟着他走', next: 'n18' }
      ]
    },
    n16: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '舍不得，自然是舍不得的。可雏鹰不离巢，怎么飞得高。我这一去，带着这峨眉的月，也带着故乡的水，走到哪儿，都不算独行。',
      next: 'n19'
    },
    n17: {
      type: 'talk',
      emotion: 'joy',
      text: '说得好！人就是这样，一边舍不得，一边又忍不住往外走。这江水流到哪里，我的心就跟着到哪里。',
      next: 'n19'
    },
    n18: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '你说得好！月亮不会留人，却会送人。往后我走到天涯海角，只要抬头望见这轮月亮，就还像站在峨眉山上。',
      next: 'n19'
    },
    n19: {
      type: 'talk',
      emotion: 'joy',
      scene: 'jingmen',
      text: '过了这道荆门，就出了蜀地了。"山随平野尽，江入大荒流"——你且看，出了这道山，天地一下子就开阔了！',
      anchor: 'l4',
      next: 'n20'
    },
    n20: {
      type: 'talk',
      emotion: 'calm',
      text: '小子，这一路听我说了这许多，还没听你开口。你心里憋着什么话——家世也好，我的志向也好，只管砸过来，我李白知无不言。',
      next: 'n21'
    },
    n21: {
      type: 'aiFree',
      trap: {
        text: '（按剑而立，仰头一笑）我七岁诵六甲，十岁观百家，十五好剑术，遍干诸侯——这几句我可没吹牛。你信不信？',
        wrong: '七岁诵六甲',
        right: '五岁诵六甲',
        hint: '《上安州裴长史书》自述"五岁诵六甲，十岁观百家"',
        catchText: '（一愣，拊掌大笑）好小子！"五岁诵六甲"，是我说岔了一个字。五岁识字、十岁观百家、十五好剑术——我李白的底子，就是这么攒起来的。你耳朵倒比我想的尖，来，敬你一杯！',
        anchor: 'l1',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你与青年李白在蜀地江畔相遇，他正要仗剑出蜀、辞亲远游。他意气风发，谈家世早慧、任侠剑术、不愿走科举的志向，以及峨眉山月的乡愁。你可以问他的家世、五岁诵六甲、好剑术的缘由、为何不走科举、出蜀后的打算。',
      hint: '你可以问李白：家世、五岁诵六甲、剑术、为何不走科举、出蜀的志向……',
      suggestions: ['聊聊您的家世与早慧', '为何不愿走科举正途？', '出蜀之后，最想去哪里？'],
      minRounds: 1,
      next: 'n22'
    },
    n22: {
      type: 'reflect',
      lines: [
        '临别时，我站在江边，看他一人一船，顺水东去。',
        '五岁，他诵六甲；十五岁，他好剑术；如今，他要出蜀，去闯他自己的一片天。',
        '乡人都劝他走科举正途，考个功名，安稳一生。',
        '他偏不。他说，天生我材必有用，何必去挤那一张榜。',
        '我那时觉得他狂——这世上的人，谁不是挤破了头，去求一条进身的路。',
        '如今想来，他这一生，从出蜀的那一天起，就选了最难走、也最痛快的一条路。',
        '别人往功名里钻，他往天地里飞。',
        '我忽然有点羡慕他。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期二：干谒求仕 ============
// 玩家定位：在长安与四处求仕却处处碰壁的李白重逢（第二次见面）。
// 抉择点：1 个"决定性瞬间"（不折腰）带对错，其余为无对错探索。
const QUEST_P2 = {
  id: 'p2',
  title: '干谒求仕',
  range: '730–741',
  scene: SCENES.p2,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '长安。市井喧嚣，车马如织。你走在这座天下第一城的大街上，忽然听见一间酒肆里，有人高声吟诗，引来一片叫好。',
      scene: 'changan',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '你循声望去，酒肆里那个白衣人，衣袍已不似当年光鲜，眉宇间多了几分落拓，却仍是那副天不怕地不怕的模样——正是蜀地江畔结识的李白。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '（抬头见你，眼睛一亮）是你！蜀地一别，好些年头了。来来来，坐下喝一杯——看我这副落魄样子，是不是叫你失望了？',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '重逢，他比当年落魄了许多。你的第一反应是？',
      options: [
        { text: '李兄，这些年你过得好吗？', next: 'n2b' },
        { text: '（看着他，一时说不出话）', next: 'n2c' },
        { text: '你还是那个爱笑爱酒的李太白', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'calm',
      text: '好不好的，你且看我这一身。我到长安来求个出身，四处干谒，拜访公卿——"三十成文章，历抵卿相"，可到头来，处处碰壁。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '哈哈，别为我难过。我李白什么都能受，唯独受不得人可怜。来，先满上这一杯，话慢慢说。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'joy',
      text: '爽快！还是你懂我！落魄归落魄，酒不能断，笑不能少。这天底下，能让我低头的，还没有生出来呢。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'sad',
      scene: 'ganxie',
      sceneMode: 'flashback',
      npc: false,
      text: '这些年，我拿着自己的诗文，一次次去叩那些权贵的门。那些人，有的连正眼都不瞧我一下。我一个读书人，低声下气地求人，你可知那是什么滋味？',
      anchor: 'l5',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      scene: 'ganxie',
      sceneMode: 'flashback',
      npc: false,
      question: '听他说起干谒碰壁，你心里想的是？',
      options: [
        { text: '为了抱负，这点委屈不算什么', next: 'n5' },
        { text: '这样低声下气，值得吗？', next: 'n6' },
        { text: '（想起自己也曾求过人）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'zhongnan',
      sceneMode: 'flashback',
      npc: false,
      text: '委屈我受得。可寒心的是——我满腹才情，那些人却只把我当个求食的门客。我李白，岂是摇尾乞怜之人。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'serious',
      scene: 'zhongnan',
      sceneMode: 'flashback',
      npc: false,
      text: '问得值不值？我也问过自己。可除了求人，还有别的路吗？我凭诗文入世，总好过钻营那些见不得人的门道。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'zhongnan',
      sceneMode: 'flashback',
      npc: false,
      text: '谁不是如此。可旁人能咽下的这口气，我偏咽不下。我的诗可以跪，我的腰，不行。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'serious',
      scene: 'zhongnan',
      sceneMode: 'flashback',
      npc: false,
      text: '后来我隐居终南山，想走"终南捷径"，借玉真公主的引荐，直接面见天子。可这仕途，比蜀道还难——"蜀道之难，难于上青天"。我写那蜀道，写的是险，是难，也是我自己这条走不通的路。',
      anchor: 'l8',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '他求仕无门，你猜他此刻最可能在想什么？',
      options: [
        { text: '这条入仕的路，怎么就这么难', next: 'n9a' },
        { text: '纵是碰壁，也绝不低头', next: 'n9b' },
        { text: '不如纵情山水，做个闲人', next: 'n9c' }
      ]
    },
    n9a: {
      type: 'talk',
      emotion: 'sad',
      text: '难啊。"欲渡黄河冰塞川，将登太行雪满山"——这世道，处处是冰，处处是雪，想往前走一步，都难如登天。',
      anchor: 'l6',
      next: 'n10'
    },
    n9b: {
      type: 'talk',
      emotion: 'serious',
      text: '碰壁归碰壁，我这一身傲骨，撞不弯。他们可以不用我，却休想让我跪下来求。',
      next: 'n10'
    },
    n9c: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '做闲人？我也想。可胸中这团火不灭，我就放不下。纵情山水，那是日后的归处，不是今日的退路。',
      next: 'n10'
    },
    n10: {
      type: 'choice',
      scene: 'zhongnan',
      sceneMode: 'flashback',
      npc: false,
      question: '有贵人递话：李十二，你才名在外，何不卑辞厚礼、低声下气些，保你有个出身。若你此刻是他，你会怎么选？',
      options: [
        { text: '忍一忍，先低头求个出身再说', right: false, result: 'n11', feedback: '你替他选了低头。可真实的他，宁可穷死，也不肯折这一下腰。' },
        { text: '拂袖而去，宁可无官也不折腰', right: true, result: 'n12', feedback: '对了！"安能摧眉折腰事权贵"——这一刻，他已把话说尽。' },
        { text: '假意逢迎，等得了势再翻脸', right: false, result: 'n13', feedback: '你替他选了权宜。可他不是那等两面人——他的傲，是刻在骨子里的。' }
      ]
    },
    n11: {
      type: 'talk',
      emotion: 'serious',
      text: '低头？我李白生就一身傲骨，若为了一顶乌纱就弯下腰，那我还配写那些仰天大笑的诗吗？我宁可穷，也不折这腰。',
      next: 'n14'
    },
    n12: {
      type: 'talk',
      emotion: 'serious',
      text: '说得好！安能摧眉折腰事权贵，使我不得开心颜！这官，不做也罢；这腰，绝不能弯。',
      anchor: 'l7',
      next: 'n14'
    },
    n13: {
      type: 'talk',
      emotion: 'calm',
      text: '逢迎？那不是我。我这人，喜怒都在脸上。要我一面对人笑、一面心里骂，我做不到，也不屑去做。',
      next: 'n14'
    },
    n14: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'jiulou',
      text: '罢了，不说这些丧气事。你既来了，就陪我喝个痛快。这长安的酒，苦是苦，倒也能浇愁。你有什么想问的，尽管问，我一边饮，一边答你。',
      next: 'n15'
    },
    n15: {
      type: 'aiFree',
      trap: {
        text: '（把盏一放）那几年我困在长安，写下"欲渡黄河冰塞川，将登太行雪满天"。这十四个字，写的就是我自己。',
        wrong: '将登太行雪满天',
        right: '将登太行雪满山',
        hint: '《行路难·其一》原句作"将登太行雪满山"',
        catchText: '（一顿，随即大笑，把盏顿在案上）"雪满山"，不是"满天"！好，好——连我自己的诗你都背得比我准。冰塞川、雪满山，路都走不通，我却偏要"长风破浪会有时，直挂云帆济沧海"。这才叫李白！',
        anchor: 'l6',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你是李白在蜀地结识的少年同游者，多年后在长安重逢。此刻你与他在一间小酒肆中，他穷愁潦倒、借酒浇愁，谈起这些年四处干谒、处处碰壁的屈辱，以及他宁折不弯的傲骨。他神情落拓却仍不失狂放。你可以问他干谒的屈辱、为何不折腰、隐居终南山的经历、入仕的艰难。',
      hint: '你可以问李白：干谒屈辱、为何不折腰、终南山经历、入仕的艰难……',
      suggestions: ['这些年您都求过哪些人？', '为何宁可穷，也不肯低头？', '入仕这么难，您想过放弃吗？'],
      scene: 'jiulou',
      minRounds: 1,
      next: 'n16'
    },
    n16: {
      type: 'reflect',
      lines: [
        '临别时，我看着他摇摇晃晃走出酒肆，还回头冲我笑。',
        '他在长安求了这么久的官，处处碰壁，穷得连酒钱都要赊。',
        '有人劝他：低个头，弯个腰，什么都有了。',
        '他偏不。他说，安能摧眉折腰事权贵，使我不得开心颜。',
        '我那时觉得他傻——人都快饿死了，还要什么骨气。',
        '可如今想来，一个人若连脊梁都能弯，那他还是他吗？',
        '他不是不知道低头能换口饭吃。他只是不肯。',
        '这世上肯低头的人那么多，可李白，只有一个。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期三：供奉翰林（全线高潮） ============
// 玩家定位：随李白入宫，亲眼见证他从"天子红人"到"赐金放还"的大起大落（第三次见面）。
// 抉择点：1 个"决定性瞬间"（宁被放还也不讨好权贵）带对错，其余为无对错探索。
const QUEST_P3 = {
  id: 'p3',
  title: '供奉翰林',
  range: '742–744',
  scene: SCENES.p3,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '长安，兴庆宫。沉香亭畔，牡丹盛开，丝竹声声。你随着一队宫人穿过重重宫门，去寻那位如今名动天下的翰林待诏。',
      scene: 'gongting',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '远远地，你看见他——依然是那身白衣，却已坐在天子近前。听说他初入宫时，天子降辇步迎，亲手为他调羹，天下传为美谈。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '（见你，笑着迎上来）你怎么也进宫来了！来来，你看这满园牡丹——今日玄宗天子设宴赏花，正缺一个会写诗的人，便召我来了。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '再次重逢，他已是天子面前的红人。你想说什么？',
      options: [
        { text: '李兄，你终于等到了这一天！', next: 'n2b' },
        { text: '听说天子亲手为你调羹？', next: 'n2c' },
        { text: '（望着他，替他高兴，又有点说不出的担忧）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'joy',
      text: '等到了！想当年我四处碰壁，如今是天子亲自下诏请我入京。这一程，总算没白走。',
      anchor: 'l9',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '哈哈，是有这么回事。天子见我诗文，降辇步迎，赐我七宝床，亲手调羹。可这些虚礼，我不大放在心上。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'calm',
      text: '（他看出你的神色，笑了笑）高兴是高兴，只是这宫里……处处是规矩，处处是眼睛，远不如外面自在。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'joy',
      scene: 'qingping',
      sceneMode: 'flashback',
      npc: false,
      text: '最得意的一回，是沉香亭赏牡丹，天子命我作诗。我那时已饮了几杯，借着酒兴，一挥而就——"云想衣裳花想容，春风拂槛露华浓"。天子大喜，命我接连作了三首。',
      anchor: 'l10',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      npc: true,
      question: '听着他得意的往事，你注意到什么？',
      options: [
        { text: '这《清平调》写的是杨贵妃？', next: 'n5' },
        { text: '这宫里，真有那么风光吗？', next: 'n6' },
        { text: '（隐隐觉得，这风光背后藏着什么）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'joy',
      text: '不错，正是为贵妃作的。花与人相映，人比花更艳。只是这诗，说它好，好在一时；说它险，也险在一时。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '风光？明面上风光。可这翰林待诏，说穿了，不过是个陪天子饮酒赋诗的弄臣。我的抱负，是经世济民，不是写这些应景的句子。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'calm',
      text: '你也瞧出来了。这深宫里的风光，像浮在水上的花，好看，却扎不下根。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'serious',
      text: '我在宫里，依旧我行我素，纵酒使气。有一回醉中，竟伸出脚去，让那权倾一时的高力士为我脱靴。高力士记恨在心，常在贵妃面前进我的谗言。',
      anchor: 'l11',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '他竟敢让高力士脱靴。你心里想的是？',
      options: [
        { text: '痛快！真不愧是李太白', next: 'n10' },
        { text: '这会不会给你惹来大祸？', next: 'n11' },
        { text: '（倒吸一口凉气）', next: 'n12' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'joy',
      text: '哈哈，痛快是痛快，祸也果然来了。可我那时想的是——我李白连天子的酒都能喝，一个宦官，凭什么让我弯腰。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'calm',
      text: '祸，到底还是来了。高力士那等人，我本不该招惹。可若时光倒流，我大概还是会伸出那只脚——有些气，忍不得。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'joy',
      text: '吓着你了？在这宫里，我早就看明白了——与其战战兢兢地活，不如痛痛快快地活。',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'sad',
      text: '渐渐地，谗言日盛。天子待我，也不如从前。我明白，这翰林是待不下去了。有同僚劝我：收敛些，少饮几杯，多奉承几句，这位置谁也夺不走。',
      next: 'n14'
    },
    n14: {
      type: 'choice',
      npc: true,
      question: '宠信正盛却渐失圣心。若你此刻是他，你会怎么选？',
      options: [
        { text: '收敛傲气，讨好权贵，保住圣眷', right: false, result: 'n15', feedback: '你替他选了识时务。可真实的他，偏偏在巅峰，也不肯弯一下腰。' },
        { text: '宁被放还，也不摧眉折腰', right: true, result: 'n16', feedback: '对了！"安能摧眉折腰事权贵"——他宁可丢了官，也不丢了自己。' },
        { text: '表面应付，暗里仍我行我素', right: false, result: 'n17', feedback: '你替他选了周旋。可他连装都懒得装——李白这两个字，从不屑于两面。' }
      ]
    },
    n15: {
      type: 'talk',
      emotion: 'serious',
      text: '收敛？我若真能收敛，当初就不会让高力士脱靴了。这官，做成一味讨好人的样子，那还是我李白吗？',
      next: 'n18'
    },
    n16: {
      type: 'talk',
      emotion: 'serious',
      text: '对！安能摧眉折腰事权贵，使我不得开心颜！这翰林，我不做了。宁可被放还，还我一个自在身。',
      next: 'n18'
    },
    n17: {
      type: 'talk',
      emotion: 'calm',
      text: '应付？我这一辈子，最学不会的就是两面。开心颜就是开心颜，摧眉折腰就是摧眉折腰，装不出第二种样子。',
      next: 'n18'
    },
    n18: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'fanghuan',
      text: '天宝三载，天子赐金放还——说得体面，其实是变相把我撵出了长安。我牵着马走出城门，回头望那宫阙，心里反倒一阵轻松。只是出城那刻，我仍对天默念了一句：长风破浪会有时，直挂云帆济沧海。',
      anchor: 'l12',
      next: 'n19'
    },
    n19: {
      type: 'choice',
      npc: true,
      question: '他被放还出京，你心里是什么滋味？',
      options: [
        { text: '替他惋惜，好不容易到手的荣宠', next: 'n20' },
        { text: '替他高兴，终于不必再受那束缚', next: 'n21' },
        { text: '（一时百感交集，说不出话）', next: 'n22' }
      ]
    },
    n20: {
      type: 'talk',
      emotion: 'calm',
      text: '荣宠？那本就是枷锁。我要的不是天子的宠，是我自己的快意。出了这道门，我才是真的李白。',
      next: 'n23'
    },
    n21: {
      type: 'talk',
      emotion: 'joy',
      text: '爽快！还是你懂我！这宫里待了两年，我早憋坏了。如今还我自由，纵情山水去，饮酒赋诗去，岂不快哉！',
      next: 'n23'
    },
    n22: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '（他拍拍你的肩）不必为我惋惜。有些人求的是功名，我求的，是这颗心不委屈。如今，我找回来了。',
      next: 'n23'
    },
    n23: {
      type: 'talk',
      emotion: 'calm',
      text: '这宫里的两年，你也看尽了。心里若还有疑问——我的诗也好，这官场也好，趁现在问个痛快。出了这城，咱们再难回头了。',
      next: 'n24'
    },
    n24: {
      type: 'aiFree',
      trap: {
        text: '（掸了掸衣上尘土）天宝三载，我奉诏入京，供奉翰林。明皇降辇步迎，御手调羹以饭之——那般礼遇，这辈子只那一回。',
        wrong: '天宝三载奉诏入京',
        right: '天宝元年（742年）奉诏入京',
        hint: '李白天宝元年入京，天宝三载是被赐金放还之年',
        catchText: '（抚掌）"天宝元年"！我把入京和出京的年头说拧了。元年奉诏入京，三载赐金放还——一进一出，正好两年。这两年，够我把这宫里的冷暖看了个透。你既记得清，那我也就不瞒你：这翰林，我本就没打算久待。',
        anchor: 'l9',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你是李白在蜀地结识的少年同游者，如今随他经历了两年的翰林生涯，见证他从天子红人到赐金放还的大起大落。他谈起供奉翰林的风光、《清平调》的得意、高力士脱靴的狂放，以及最终不摧眉折腰、主动离开的决绝。你可以问他宫廷生活、清平调、高力士脱靴、为何不愿讨好权贵、被放还的心境。',
      hint: '你可以问李白：宫廷生活、清平调、高力士脱靴、为何不愿讨好权贵、被放还的心境……',
      suggestions: ['《清平调》是怎么写出来的？', '为何宁可被放还也不低头？', '离开长安，您后悔吗？'],
      scene: 'fanghuan',
      minRounds: 1,
      next: 'n25'
    },
    n25: {
      type: 'reflect',
      lines: [
        '临别时，他牵着马走出长安城门，身后是渐渐远去的宫阙。',
        '两年前，天子降辇步迎，亲手调羹，人人都道他一步登天。',
        '沉香亭上，他醉中写下"云想衣裳花想容"，名动天下。',
        '可两年后，他主动请辞，宁可被"赐金放还"，也不肯再折一下腰。',
        '有人笑他傻：多少人求之不得的恩宠，他竟说不要就不要。',
        '我那时不懂，他到底图什么。',
        '如今想来，他要的从来不是那顶乌纱，是"开心颜"三个字。',
        '一入宫门深似海，哪还有真正的开心颜。',
        '所以他走了，走得干干净净，把一个神仙，还给了天下。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期四：纵酒漫游 ============
// 玩家定位：与离开长安后的李白同游梁宋、齐鲁，见证他与杜甫、高适的相遇（第四次见面）。
// 抉择点：1 个"决定性瞬间"（察觉将乱，归隐还是奔走）带对错，其余为无对错探索。
const QUEST_P4 = {
  id: 'p4',
  title: '纵酒漫游',
  range: '744–755',
  scene: SCENES.p4,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '梁宋之地，秋高气爽。你远远看见三个人骑马同行，谈笑风生，好不潇洒——居中的白衣人，正是被放还后的李白。',
      scene: 'liangsong',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '待走近了，你才认出，他身边那两位，一位是日后名动天下的杜甫，一位是边塞诗人高适。三人同游，快意恩仇。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'joy',
      text: '（见你，大笑）你也来了！快来，我给你引见——这位是杜甫，杜子美；这位是高适，高三十五。我们三人结伴，正要寻一处山水，痛饮三日！',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '三人同游，好不热闹。你想说什么？',
      options: [
        { text: '三个大诗人凑在一起，天下奇观！', next: 'n2b' },
        { text: '离了长安，你如今自在多了', next: 'n2c' },
        { text: '（看着他们，也跟着高兴起来）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'joy',
      text: '奇观谈不上，快意是真。我与子美、高三十五，都是不肯低头的人，凑在一起，自然是酒逢知己千杯少！',
      anchor: 'l13',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'joy',
      text: '自在多了！出得长安，天高地阔。这官我虽不做了，可这天下的山水、美酒、知己，都是我的。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'joy',
      text: '高兴就对了！人生在世，最难得的，就是有三两知己，一壶好酒。来，你也同去，咱们一醉方休！',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'joy',
      scene: 'jiangjin',
      sceneMode: 'flashback',
      npc: false,
      text: '那一回在嵩山元丹丘的山居，我饮到酣处，举杯高歌："人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来！"子美他们听得直拍案。',
      anchor: 'l14',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      question: '他高歌"天生我材必有用"，你听出了什么？',
      options: [
        { text: '豪情万丈，真真是谪仙人', next: 'n5' },
        { text: '这豪情背后，似有一丝不甘', next: 'n6' },
        { text: '（被他的歌声感染，心头滚烫）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'joy',
      text: '豪情是真。可我自己心里清楚，这豪情，一半是给知己听的，一半是说给自己听的。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '（他顿了顿，笑意淡了些）你听出来了。天生我材必有用——我一遍遍这样说，是因为，我还没真的证明这句话。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'joy',
      text: '（他举杯与你一碰）来！今朝有酒今朝醉，明日的事，明日再说。这世上的烦恼，且都抛给这杯酒！',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'jiangjin',
      sceneMode: 'flashback',
      npc: false,
      text: '可你别看我纵酒放歌，我北游幽燕的时候，瞧出那安禄山招兵买马、广结死党，恐有异心。我忧心如焚，却无计可施。',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '他竟察觉了天下将乱的征兆。你想说什么？',
      options: [
        { text: '这天下，真的要乱了吗？', next: 'n10' },
        { text: '既已离朝，何必再为天下忧心', next: 'n11' },
        { text: '（心里一沉，说不出话）', next: 'n12' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'serious',
      text: '我但愿是我看错了。可那安禄山，狼子野心，昭然若揭。这太平盛世，怕是撑不了几年了。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '我离了朝，本可不管。可这天下若乱，受苦的是万千百姓。我李白，到底还是放不下这一腔热血。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'sad',
      text: '（他叹了口气）我这个人，嘴上说着求仙问道，可这尘世，终究是放不下的。',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'thoughtful',
      scene: 'tianmu',
      sceneMode: 'flashback',
      npc: false,
      text: '我也曾想，索性归隐，去天姥山寻仙去。"安能摧眉折腰事权贵，使我不得开心颜"——可当真要去时，又迈不开这双脚。',
      anchor: 'l15',
      next: 'n14'
    },
    n14: {
      type: 'choice',
      npc: true,
      question: '察觉天下将乱，是归隐独善其身，还是奔走想为国出力？若你此刻是他，你会怎么选？',
      options: [
        { text: '既已归隐，天下事不必再管', right: false, result: 'n15', feedback: '你替他选了放下。可他放不下——他一辈子想为天下做点事，只是没有路。' },
        { text: '继续奔走，设法向朝廷进言', right: true, result: 'n16', feedback: '对了。他嘴上求仙，脚却还是往长安的方向走——他放不下。' },
        { text: '借酒消愁，且得过且过', right: false, result: 'n17', feedback: '你替他选了逃避。可酒醒之后，那忧天下的心，反而更烫。' }
      ]
    },
    n15: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '我也劝过自己放下。可放不下。这天下，有我的诗、我的知己、还有那些把命押在这片土地上的百姓。我做不到袖手旁观。',
      next: 'n18'
    },
    n16: {
      type: 'talk',
      emotion: 'serious',
      text: '对。我嘴上求仙，脚却总往长安的方向走。这腔热血，泼不出去，也凉不下来。',
      next: 'n18'
    },
    n17: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '酒，我饮过千杯，也浇不灭这心头的火。"抽刀断水水更流，举杯消愁愁更愁"——这愁，不是酒能解的。',
      next: 'n18'
    },
    n18: {
      type: 'talk',
      emotion: 'calm',
      scene: 'xietiao',
      text: '后来我在宣州谢朓楼上，送别一位故人，写下"抽刀断水水更流，举杯消愁愁更愁"。这半生的愁，就像这江水，抽刀也断不开。这一程山水，你也陪我走遍了。还有什么想问的，只管问，我李白，何时吝啬过话。',
      anchor: 'l16',
      next: 'n19'
    },
    n19: {
      type: 'aiFree',
      trap: {
        text: '（举杯向远）那年我与杜二在梁宋初见，一见如故，便同游了梁宋、齐鲁。他小我十一岁，诗却沉郁得像压着半座山。',
        wrong: '李杜初见在梁宋',
        right: '李杜初见在洛阳（天宝三载，744年）',
        hint: '二人初次相会于洛阳，其后才同游梁宋',
        catchText: '（大笑，以掌击案）"洛阳"！我把初见的地方说错了。是先在洛阳遇上杜二，才一道去的梁宋。那小子写诗比我苦，一句要磨上千遍——我学不来，可我敬他。你连我跟他怎么认识的都记得，好，这一杯你得陪我干了。',
        anchor: 'l13',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你是李白在蜀地结识的少年同游者，如今随他离开长安后纵情漫游，见证他与杜甫、高适的梁宋同游，也看见他纵酒放歌背后理想幻灭的痛，以及察觉天下将乱的忧心。你可以问与杜甫同游的往事、《将进酒》的心境、求仙访道的缘由、察觉安禄山异心的忧虑、为何不真正归隐。',
      hint: '你可以问李白：与杜甫同游、《将进酒》心境、求仙、察觉叛乱、为何不归隐……',
      suggestions: ['《将进酒》是怎么写出来的？', '为何一边求仙一边又放不下天下？', '与杜甫同游，是怎样的日子？'],
      scene: 'xietiao',
      minRounds: 1,
      next: 'n20'
    },
    n20: {
      type: 'reflect',
      lines: [
        '临别时，他醉倒在山居的松树下，嘴里还喃喃念着"天生我材必有用"。',
        '人人都说，被放还后的李白，成了最逍遥的酒中仙。',
        '可我看见，他饮得越多，眼睛里的东西越沉。',
        '他北上幽燕，看出了安禄山的狼子野心，却报国无门，只能写进诗里。',
        '他说，安能摧眉折腰事权贵——可若天下将乱，他不折腰，又能为天下做什么？',
        '我那时才懂，他的狂、他的酒、他的仙，都是疼出来的。',
        '一个人太想为天下做事，却找不到路，就只能把那股劲儿，全灌进诗和酒里。',
        '诗是他的翅膀，酒是他的药。可飞得再高，脚还在地上。'
      ],
      next: '__end__'
    }
  }
};

// ============ 时期五：乱世浮沉 ============
// 玩家定位：安史之乱爆发，陪李白走完最后、最坎坷的一段路（第五次见面）。
// 抉择点：1 个"决定性瞬间"（永王来请，避祸还是入幕）——"对"的选择反而酿悲剧，带对错。
const QUEST_P5 = {
  id: 'p5',
  title: '乱世浮沉',
  range: '755–762',
  scene: SCENES.p5,
  start: 'n1',
  nodes: {
    n1: {
      type: 'narrate',
      text: '安史之乱爆发，天下大乱。你一路南行，寻到庐山深处——茅屋数间，竹影婆娑，正是避乱隐居的李白。',
      scene: 'lushan',
      next: 'n1a'
    },
    n1a: {
      type: 'narrate',
      text: '他清瘦了许多，鬓边也添了霜色，可那双眼睛，依旧亮得惊人。只是眉宇间，多了几分你看不懂的焦灼。',
      next: 'n2'
    },
    n2: {
      type: 'talk',
      emotion: 'calm',
      text: '（见你，先是一怔，随即苦笑）……这乱世里，还能再见你，也算万幸。我在这庐山，躲了许久了。',
      next: 'n2a'
    },
    n2a: {
      type: 'choice',
      npc: true,
      question: '乱世重逢，你第一句想说什么？',
      options: [
        { text: '李公，您还好吗？', next: 'n2b' },
        { text: '这天下，当真乱了', next: 'n2c' },
        { text: '（握住他的手，半晌无言）', next: 'n2d' }
      ]
    },
    n2b: {
      type: 'talk',
      emotion: 'calm',
      text: '好不好的，你且看这乱世。我在庐山，算是有个安身处。只是这心里，总像压着一块石头，怎么也放不下。',
      next: 'n3'
    },
    n2c: {
      type: 'talk',
      emotion: 'serious',
      text: '乱了。彻底乱了。眼看着山河破碎，我却只能躲在这山里，空有一腔报国志，无处施展。',
      next: 'n3'
    },
    n2d: {
      type: 'talk',
      emotion: 'sad',
      text: '（他反握住你，力道很重）好，好。乱世里，能再见一面故人，是天大的幸事。',
      next: 'n3'
    },
    n3: {
      type: 'talk',
      emotion: 'serious',
      text: '前几日，永王李璘的使者来了，说永王在江陵招兵买马，要平定天下，求贤若渴，特来请我出山。这已是第三次了。',
      next: 'n4'
    },
    n4: {
      type: 'choice',
      npc: true,
      question: '永王来请，李白神情复杂。你心里想的是？',
      options: [
        { text: '这是您报国的机会啊', next: 'n5' },
        { text: '永王与天子，会不会有嫌隙？', next: 'n6' },
        { text: '（隐隐觉得，这其中有凶险）', next: 'n7' }
      ]
    },
    n5: {
      type: 'talk',
      emotion: 'serious',
      text: '我何尝不这样想！我这一辈子，求的不过是一个"为天下做事"的机会。如今机会来了，我却犹豫了。',
      next: 'n8'
    },
    n6: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '你这一问，正是我忧心的。永王与太子肃宗，已有裂痕。我若入他幕中，日后恐有说不清的是非。',
      next: 'n8'
    },
    n7: {
      type: 'talk',
      emotion: 'calm',
      text: '（他望着远处）凶险，我又何尝不知。可这一腔热血，若再不浇出去，就真的要凉透了。',
      next: 'n8'
    },
    n8: {
      type: 'talk',
      emotion: 'sad',
      text: '我思来想去，一夜没合眼。避祸归隐，保全自身，还是入幕报国，赌这一把？',
      next: 'n9'
    },
    n9: {
      type: 'choice',
      npc: true,
      question: '永王第三次来请。若你此刻是他，你会怎么选？',
      options: [
        { text: '入幕报国，抓住最后一次机会', right: true, result: 'n10', feedback: '对了。他一辈子想出山做事，终究没忍住——这一去，酿成了晚年大祸。' },
        { text: '避祸归隐，不再蹚这浑水', right: false, result: 'n11', feedback: '你替他选了稳妥。可他一世求"入世"而不得，这最后一根稻草，他抓得太紧。' },
        { text: '先观望，看永王是否名正言顺', right: false, result: 'n12', feedback: '你替他留了余地。可他等不及——乱世里，机会稍纵即逝，他怕又错过。' }
      ]
    },
    n10: {
      type: 'talk',
      emotion: 'serious',
      text: '对。我终究没忍住。我这一生，求了一辈子的"入世"，如今最后一次机会摆在眼前，我若不抓住，这一腔热血，就真要烂在肚子里了。',
      next: 'n13'
    },
    n11: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '稳妥？我也曾这样劝自己。可我这一生，从没求过稳妥。避祸，那不是我李白。',
      next: 'n13'
    },
    n12: {
      type: 'talk',
      emotion: 'sad',
      text: '观望？等不及了。乱世里，机会像水一样流走。我若再犹豫，就真的要老死在这山中了。',
      next: 'n13'
    },
    n13: {
      type: 'talk',
      emotion: 'sad',
      scene: 'yongwang',
      sceneMode: 'flashback',
      npc: false,
      text: '我入了永王的幕。我满心以为是去平定叛乱、报效国家，却不知，自己一脚踏进了皇室内斗的漩涡。',
      anchor: 'l17',
      next: 'n14'
    },
    n14: {
      type: 'talk',
      emotion: 'sad',
      scene: 'yuzhong',
      text: '永王兵败。我被打作"逆臣"，系在浔阳狱中。那些日子，我透过铁窗望天，一遍遍问自己：我李白，怎么会走到这一步？',
      anchor: 'l18',
      next: 'n15'
    },
    n15: {
      type: 'choice',
      npc: true,
      question: '他身陷囹圄，你想说什么？',
      options: [
        { text: '您也是出于报国之心啊', next: 'n16' },
        { text: '（看着他，满心酸楚）', next: 'n17' },
        { text: '可有人为您奔走？', next: 'n18' }
      ]
    },
    n16: {
      type: 'talk',
      emotion: 'sad',
      text: '报国之心，天知地知。可这世道，只看你站错了谁的队。我的妻宗氏，正为我四处奔走求救。',
      next: 'n19'
    },
    n17: {
      type: 'talk',
      emotion: 'sad',
      text: '（他苦笑）你不必为我难过。我这一生，起起落落，早该料到，走得越高，摔得越重。',
      next: 'n19'
    },
    n18: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '有。我的妻宗氏，还有几位故旧，都在为我奔走。只不知，这朝廷肯不肯放我一马。',
      next: 'n19'
    },
    n19: {
      type: 'talk',
      emotion: 'sad',
      text: '后来，我被判"长流夜郎"。那一路，山高水远，我戴着重枷，一步一挨。我这一生，写过那么多豪气干云的诗，到头来，却落到这般田地。',
      next: 'n20'
    },
    n20: {
      type: 'talk',
      emotion: 'joy',
      scene: 'baidi',
      sceneMode: 'flashback',
      npc: false,
      text: '可就在流放途中，朝廷大赦天下！那一日我到了白帝城，喜极而狂，挥笔写下："朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山！"',
      anchor: 'l19',
      next: 'n21'
    },
    n21: {
      type: 'choice',
      npc: true,
      question: '他遇赦得脱，喜极而狂。你心里想的是？',
      options: [
        { text: '太好了，您终于自由了', next: 'n22' },
        { text: '这一生大起大落，您看开了吗？', next: 'n23' },
        { text: '（看着他，也跟着红了眼眶）', next: 'n24' }
      ]
    },
    n22: {
      type: 'talk',
      emotion: 'joy',
      text: '自由了！我李白，这一生所求的，不就是个自由吗？如今，这天、这地、这江水，又都是我的了！',
      next: 'n25'
    },
    n23: {
      type: 'talk',
      emotion: 'thoughtful',
      text: '看开了。这半生，我狂过、醉过、得意过、也落魄过。到如今，官也做过，牢也坐过，还有什么看不开的。',
      next: 'n25'
    },
    n24: {
      type: 'talk',
      emotion: 'calm',
      text: '（他笑望着你，眼里有泪光，也有释然）别哭。我这一生，虽九死，犹未悔。',
      next: 'n25'
    },
    n25: {
      type: 'talk',
      emotion: 'calm',
      text: '我这一生，自比那大鹏——"大鹏一日同风起，扶摇直上九万里"。到如今，鹏飞虽倦，心却未老。这最后一段路，你也陪我走完了。想问什么，尽管问——这一生的悔与不悔，我都说给你听。',
      anchor: 'l20',
      next: 'n26'
    },
    n26: {
      type: 'aiFree',
      trap: {
        text: '（望江长叹）永王三次遣使来招我，我当他真是奉了太子之命东巡，便入了他的幕府。谁想后来……唉，那一步，是我此生最悔的一步。',
        wrong: '永王奉太子之命东巡',
        right: '永王李璘是玄宗之子、肃宗之弟，其东巡被肃宗视为谋逆',
        hint: '永王李璘为玄宗第十六子，并非奉太子之命',
        catchText: '（一滞，随即苦笑）你说得对——永王是玄宗之子、肃宗之弟，哪来的"奉太子之命"。是我自己急着报国，把什么都看成了机会。这一步错，换来浔阳狱，换来夜郎三千里。可我到底还是被赦了——"千里江陵一日还"，你听，我李白这辈子，连倒霉都倒得痛快。',
        anchor: 'l17',
        toast: '考据之眼 · 捉住一处史实错漏'
      },
      prompt: '你是李白在蜀地结识的少年同游者，如今陪他走完乱世浮沉的最后一程。他谈起永王入幕的懊悔、浔阳狱中的煎熬、长流夜郎的艰辛，以及遇赦时"千里江陵一日还"的狂喜。他历尽沧桑，心境却愈见旷达。你可以问永王入幕、狱中心境、流放夜郎、遇赦的狂喜、《早发白帝城》、这一生的悔与不悔。',
      hint: '你可以问李白：永王入幕、狱中心境、流放夜郎、遇赦、《早发白帝城》、一生的悔与不悔……',
      suggestions: ['您后悔当初入永王幕吗？', '流放夜郎的路上，您在想什么？', '这一生，您最不悔的是什么？'],
      scene: 'baidi',
      minRounds: 1,
      next: 'n27'
    },
    n27: {
      type: 'reflect',
      lines: [
        '终程。我最后一次回望，望的是他这一生。',
        '那个不肯走科举、仗剑出蜀的少年，那个穷到骨子里也不折腰的求仕人，',
        '那个在长安巅峰转身而走的翰林，那个借酒和仙飞离尘世的失意客，',
        '最后，为了一个"报国"的念头，跌进了最深的泥里。',
        '流放夜郎的路上，他忽然遇赦，写下"千里江陵一日还"——那是他晚年，最后的一点飞扬。',
        '我不愿去猜他最后的归宿。我只记得，他这一生，始终想飞，却始终被什么拽着，飞不起来。',
        '可他写下的那些诗，早已替他飞起来了——',
        '飞过蜀道，飞过天姥，飞过黄河，飞过了一千多年，落到今天，还在我们耳边响。',
        '这，就是我能告诉你的、真实的李白。',
        '一个用一生去追自由，也用一生去写自由的人。'
      ],
      next: '__end__'
    }
  }
};

// ============ 锚点名称表 ============
const ANCHORS = {
  l1: '李白家世与早慧',
  l2: '仗剑出蜀 · 辞亲远游',
  l3: '《峨眉山月歌》',
  l4: '《渡荆门送别》',
  l5: '干谒求仕 · 历抵卿相',
  l6: '《行路难》的困顿',
  l7: '不折腰的傲骨',
  l8: '《蜀道难》意象',
  l9: '供奉翰林 · 天子赏识',
  l10: '《清平调》',
  l11: '高力士脱靴 · 赐金放还',
  l12: '《行路难·其一》',
  l13: '李杜相会 · 梁宋同游',
  l14: '《将进酒》',
  l15: '《梦游天姥吟留别》',
  l16: '《宣州谢朓楼饯别校书叔云》',
  l17: '永王入幕 · 卷入内斗',
  l18: '系狱浔阳 · 长流夜郎',
  l19: '《早发白帝城》',
  l20: '《临终歌》· 大鹏意象'
};

module.exports = {
  id: 'libai',
  periods: PERIODS,
  quests: { p1: QUEST_P1, p2: QUEST_P2, p3: QUEST_P3, p4: QUEST_P4, p5: QUEST_P5 },
  scenes: SCENES,
  sceneSets: SCENE_SETS,
  npcImage: NPC_IMAGE,
  periodNpcImages: PERIOD_NPC_IMAGES,
  anchors: ANCHORS
};
