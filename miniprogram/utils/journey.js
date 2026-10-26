// utils/journey.js —— 「行迹地图」地点 / 坐标数据表
//
// 设计意图（见 docs/参赛行动方案.md P1-3）：
//   一张中国水墨风格地图，标出杜甫 / 李白一生的行迹地点。
//   每通关一期，对应路线水墨晕开、点亮一段；点开看该地发生的事 + 相关诗作。
//   一眼看出"我走过他的人生"。
//
// ⚠️ 坐标约定（重要）
//   x / y 为地图容器内的百分比坐标（0–100，x 向右为东，y 向下为南）。
//   坐标按 MAP_ASPECT（=容器宽/高，默认 0.82 竖版画卷）等比换算过，
//   即：若将来放入 /assets/images/map/map-china.jpg 底图，
//   请把底图裁/导出成同样的 0.82 宽高比，坐标即可对齐。
//
// ⚠️ 底图路径
//   底图走云存储（大图不在本地包内）。路径用字符串拼接得到，
//   避免编译器把字面量当成本地静态资源去打包（本地无此文件会触发 ENOENT 报错）。
//   取不到 / 加载失败时，地图页会自动降级为纯 CSS 绘制的示意山川江河，
//   不依赖底图也能正常显示、点击、点亮。
//
// ⚠️ 地点来源
//   所有地点均取自 utils/stories/line-dufu.js / line-libai.js 的 periods 与 sceneSets，
//   （洛阳书斋 / 吴越烟雨 / 齐赵 / 泰山 / 朱雀大街 / 咸阳桥 / 曲江 / 鄜州月夜 /
//     凤翔行在 / 石壕村 / 秦州 / 成都草堂 / 夔州 / 湘江；蜀地江畔 / 峨眉山月 / 荆门 /
//     长安市井 / 终南山 / 翰林院 / 沉香亭 / 梁宋 / 嵩山 / 天姥山 / 宣州谢朓楼 /
//     庐山 / 永王幕（江陵）/ 浔阳狱 / 白帝城），未添加剧情之外的地点。
//   诗句均为该地相关的真实作品原文；出自组诗的已在 poemTitle 中标注篇名。

const MAP_ASPECT = 0.82;  // 地图容器 宽/高（竖版画卷比例）

const IMG = '/assets/' + 'images/';
// 底图（云存储；本地无文件，拼接得到路径以防编译期静态打包报错）
const MAP_IMAGE = IMG + 'map/map-china.jpg';

// 朝代舆图：共用一张本地地形 JPG，按诗人叠加对应朝代的透明疆界 PNG。
// 各层使用同一经纬度范围（100°E–122.96°E、18°N–46°N）与等经纬度投影；
// 地点坐标统一由 map-geography.js 投影，不再复用人工摆放的旧 x/y。
// 图内不烘焙文字，朝代名和考据口径由地图页 UI 叠加，避免缩放后文字失真。
const DYNASTY_MAPS = {
  dufu: {
    image: '/assets/images/maps/map-terrain.jpg',
    overlay: '/assets/images/maps/map-tang-boundary.png',
    era: '唐开元三十年舆图 · 742',
    note: '正射3D地貌据 Natural Earth；疆界据可考历史图；地点按经纬度校准'
  },
  libai: {
    image: '/assets/images/maps/map-terrain.jpg',
    overlay: '/assets/images/maps/map-tang-boundary.png',
    era: '唐开元三十年舆图 · 742',
    note: '正射3D地貌据 Natural Earth；疆界据可考历史图；地点按经纬度校准'
  },
  sushi: {
    image: '/assets/images/maps/map-terrain.jpg',
    overlay: '/assets/images/maps/map-northern-song-boundary.png',
    era: '北宋政和元年舆图 · 1111',
    note: '正射3D地貌据 Natural Earth；疆界据可考历史图；地点按经纬度校准'
  }
};

function getMapConfig(lineId) {
  return DYNASTY_MAPS[lineId] || {
    image: MAP_IMAGE,
    era: '古代舆图',
    note: '历史疆界与自然地理均保留来源记录'
  };
}

// 杜甫线行迹
// waypoints 按「出生 → 死亡」生平时间顺序排列，序号即人生轨迹顺序（1、2、3…）。
const DUFU = {
  id: 'dufu',
  name: '杜甫',
  tagline: '诗史之旅',
  caption: '从巩县出生到湘江孤舟，他这一生，几乎没赢过，却把天下人的苦都写进了诗里。',
  waypoints: [
    // —— 时期一：读书壮游 712–745 ——
    { periodId: 'p1', name: '巩县', x: 62, y: 32, lp: 'top', sceneKey: 'luoyang',
      note: '公元712年，杜甫生于河南巩县瑶湾。这里是他一生的起点——后来那支写尽天下离乱的笔，此刻还在襁褓里睡着。',
      poem: '七龄思即壮，开口咏凤凰', poemTitle: '《壮游》' },
    { periodId: 'p1', name: '洛阳', x: 56, y: 38, lp: 'bottom', sceneKey: 'luoyang',
      note: '七岁能诗，在家学书斋里写下"开口咏凤凰"；二十四岁在此应进士举落第，旁人都垂头丧气，他转头便要往齐赵去。',
      poem: '七龄思即壮，开口咏凤凰', poemTitle: '《壮游》' },
    { periodId: 'p1', name: '吴越·江南', x: 84, y: 54, lp: 'bottom', sceneKey: 'jiangnan',
      note: '二十岁起游吴越，看尽了烟雨。读万卷书，行万里路，他一样都不肯落下。',
      poem: '越女天下白，鉴湖五月凉', poemTitle: '《壮游》' },
    { periodId: 'p1', name: '齐赵', x: 64, y: 16, lp: 'top', sceneKey: 'qiqi',
      note: '落榜之后不回头，纵马齐赵原野射猎唱歌——一张榜能困住人半生，却困不住一颗还想走远路的心。',
      poem: '放荡齐赵间，裘马颇清狂', poemTitle: '《壮游》' },
    { periodId: 'p1', name: '泰山', x: 78, y: 20, lp: 'bottom', sceneKey: 'taishan',
      note: '登顶泰山，写下《望岳》。"致君尧舜上，再使风俗淳"——他一生的志向，就在这一刻立住了。',
      poem: '会当凌绝顶，一览众山小', poemTitle: '《望岳》' },

    // —— 时期二：困守长安 746–755 ——
    { periodId: 'p2', name: '长安', x: 46, y: 36, lp: 'top', sceneKey: 'changan',
      note: '天宝六载放榜之日，朱雀大街榜下挤满举子，榜上却空无一人——李林甫一句"野无遗贤"，满城贤才尽数做了他谄媚的祭品。',
      poem: '朝扣富儿门，暮随肥马尘', poemTitle: '《奉赠韦左丞丈二十二韵》' },
    { periodId: 'p2', name: '咸阳桥', x: 36, y: 44, lp: 'left', sceneKey: 'bingche',
      note: '桥头征夫与亲人哭作一团，尘埃蔽日。"信知生男恶，反是生女好"——若不是被逼到绝路，哪个父母说得出这样锥心的话。',
      poem: '信知生男恶，反是生女好', poemTitle: '《兵车行》' },
    { periodId: 'p2', name: '曲江', x: 54, y: 41, lp: 'right', sceneKey: 'liren',
      note: '可就在同一座长安城里，曲江边上杨氏兄妹锦衣玉食、前呼后拥。一边是征夫的泪，一边是权贵的乐。',
      poem: '朱门酒肉臭，路有冻死骨', poemTitle: '《自京赴奉先县咏怀五百字》' },
    { periodId: 'p2', name: '奉先', x: 50, y: 30, lp: 'left', sceneKey: 'ganxie',
      note: '天宝十四载冬，他回奉先探望妻儿，途中见饿殍、闻哭声，到家方知幼子已饿死——"朱门酒肉臭，路有冻死骨"正是这时写下的。',
      poem: '朱门酒肉臭，路有冻死骨', poemTitle: '《自京赴奉先县咏怀五百字》' },

    // —— 时期三：陷贼为官 756–759 ——
    { periodId: 'p3', name: '长安（陷落）', x: 44, y: 48, lp: 'right', sceneKey: 'chunwang',
      note: '城破被陷，开春登上城头。山河还在，国却已破了——"国破山河在，城春草木深"，这十个字他是一字一字哽出来的。',
      poem: '国破山河在，城春草木深', poemTitle: '《春望》' },
    { periodId: 'p3', name: '鄜州', x: 58, y: 24, lp: 'left', sceneKey: 'yueye',
      note: '妻儿寄居鄜州，音信全无，不知生死。夜里望月出神——"今夜鄜州月，闺中只独看"。',
      poem: '今夜鄜州月，闺中只独看', poemTitle: '《月夜》' },
    { periodId: 'p3', name: '凤翔', x: 28, y: 36, lp: 'right', sceneKey: 'fengxiang',
      note: '扮作难民混出金光门，穿行叛军刀锋与逃难人潮之间，九死一生投奔行在。"麻鞋见天子，衣袖露两肘"，肃宗授他左拾遗。',
      poem: '麻鞋见天子，衣袖露两肘', poemTitle: '《述怀》' },
    { periodId: 'p3', name: '华州', x: 52, y: 44, lp: 'bottom', sceneKey: 'shihao',
      note: '被贬华州司功参军，从洛阳回华州任上，一路亲见差吏深夜抓人、百姓流离——"三吏""三别"便写于这一路。',
      poem: '吏呼一何怒，妇啼一何苦', poemTitle: '《石壕吏》' },
    { periodId: 'p3', name: '石壕村', x: 66, y: 48, lp: 'bottom', sceneKey: 'shihao',
      note: '贬官之后从洛阳回华州，夜宿荒村，亲见差吏深夜抓人充军——老妇被带走，只留下一村哭声。他把这些都写了下来。',
      poem: '吏呼一何怒，妇啼一何苦', poemTitle: '《石壕吏》' },

    // —— 时期四：漂泊西南 759–770 ——
    { periodId: 'p4', name: '秦州', x: 26, y: 26, lp: 'right', sceneKey: 'qinzhou',
      note: '关辅大饥，谷价腾贵，饿殍载道。他挂印弃官西行，一家老小几近饿死。',
      poem: '满目悲生事，因人作远游', poemTitle: '《秦州杂诗》' },
    { periodId: 'p4', name: '同谷', x: 22, y: 38, lp: 'left', sceneKey: 'qinzhou',
      note: '由秦州南下同谷，饥寒交迫，"岁拾橡栗随狙公，天寒日暮山谷里"——这是全家最艰难的一段。',
      poem: '岁拾橡栗随狙公，天寒日暮山谷里', poemTitle: '《乾元中寓居同谷县作歌七首》' },
    { periodId: 'p4', name: '成都草堂', x: 24, y: 56, lp: 'right', sceneKey: 'caotang',
      note: '浣花溪畔结起几间茅屋，栽竹百竿、开渠引水。春夜落了一场好雨，他披衣听雨写下"润物细无声"——写的分明是他自己。',
      poem: '随风潜入夜，润物细无声', poemTitle: '《春夜喜雨》' },
    { periodId: 'p4', name: '夔州', x: 46, y: 60, lp: 'bottom', sceneKey: 'kuizhou',
      note: '出三峡、滞留夔州，两年写下四百余首诗。"无边落木萧萧下，不尽长江滚滚来"——少年时登泰山写的是山，如今写的已是一生。',
      poem: '无边落木萧萧下，不尽长江滚滚来', poemTitle: '《登高》' },
    { periodId: 'p4', name: '湘江', x: 56, y: 74, lp: 'top', sceneKey: 'xiangjiang',
      note: '出峡之后以舟为家，漂泊湖湘，亲故尽失、疾病缠身。770年，他在湖南水路漂泊期间去世；具体卒地历来存在不同说法。',
      poem: '故国悲寒望，群云惨岁阴', poemTitle: '《风疾舟中伏枕书怀三十六韵奉呈湖南亲友》' }
  ]
};

// 李白线行迹
const LIBAI = {
  id: 'libai',
  name: '李白',
  tagline: '谪仙长风',
  caption: '他这一生，始终想飞，却始终被什么拽着。可他写下的诗，早已替他飞过了一千多年。',
  waypoints: [
    // —— 时期一：仗剑出蜀 725–730 ——
    { periodId: 'p1', name: '蜀地江畔', x: 26, y: 62, lp: 'top', sceneKey: 'jiang',
      note: '江边初见——他正把行囊往小船上搬，腰间佩剑，眉宇间尽是掩不住的意气。这一去，"仗剑去国，辞亲远游"。',
      poem: '仗剑去国，辞亲远游', poemTitle: '《上安州裴长史书》' },
    { periodId: 'p1', name: '峨眉山', x: 20, y: 72, lp: 'right', sceneKey: 'emei',
      note: '立在峨眉山头，看半轮秋月映在平羌江里，澄澈得像能照见人心。这一去，不知何年才能再见这峨眉的月。',
      poem: '峨眉山月半轮秋，影入平羌江水流', poemTitle: '《峨眉山月歌》' },
    { periodId: 'p1', name: '荆门', x: 42, y: 56, lp: 'bottom', sceneKey: 'jingmen',
      note: '过了这道荆门，就出了蜀地。"山随平野尽，江入大荒流"——出了这道山，天地一下子就开阔了。',
      poem: '山随平野尽，江入大荒流', poemTitle: '《渡荆门送别》' },

    // —— 时期二：干谒求仕 730–741 ——
    { periodId: 'p2', name: '长安', x: 42, y: 30, lp: 'top', sceneKey: 'changan',
      note: '长安市井，他拿着诗文一次次去叩权贵的门。"三十成文章，历抵卿相"，换来的多是冷眼，穷得连酒钱都要赊。',
      poem: '欲渡黄河冰塞川，将登太行雪满山', poemTitle: '《行路难·其一》' },
    { periodId: 'p2', name: '终南山', x: 30, y: 40, lp: 'left', sceneKey: 'zhongnan',
      note: '隐居终南山，想借玉真公主的引荐走"终南捷径"，直接面见天子。可这仕途，比蜀道还难。',
      poem: '蜀道之难，难于上青天', poemTitle: '《蜀道难》' },

    // —— 时期三：供奉翰林 742–744 ——
    { periodId: 'p3', name: '翰林院', x: 52, y: 22, lp: 'top', sceneKey: 'chunfeng',
      note: '天子下诏征他入京，降辇步迎、亲手调羹，天下传为美谈。可他心里明白：这翰林待诏，不过是个陪天子饮酒赋诗的词臣。',
      poem: '仰天大笑出门去，我辈岂是蓬蒿人', poemTitle: '《南陵别儿童入京》' },
    { periodId: 'p3', name: '沉香亭', x: 58, y: 32, lp: 'right', sceneKey: 'qingping',
      note: '兴庆宫沉香亭畔牡丹盛开，他已饮了几杯，借着酒兴一挥而就——"云想衣裳花想容"，天子大喜，命他连作三首。',
      poem: '云想衣裳花想容，春风拂槛露华浓', poemTitle: '《清平调·其一》' },
    { periodId: 'p3', name: '长安城门', x: 46, y: 40, lp: 'bottom', sceneKey: 'fanghuan',
      note: '醉中让高力士脱靴，谗言自此日盛。天宝三载赐金放还——说得体面，其实是把他撵出了长安。他牵马出城，反倒一阵轻松。',
      poem: '长风破浪会有时，直挂云帆济沧海', poemTitle: '《行路难·其一》' },

    // —— 时期四：纵酒漫游 744–755 ——
    { periodId: 'p4', name: '梁宋', x: 66, y: 42, lp: 'bottom', sceneKey: 'liangsong',
      note: '与杜甫、高适三人结伴同游梁宋，快意恩仇。中国文学史上最著名的一次相遇，就在这片秋高气爽的原野上。',
      poem: '飞蓬各自远，且尽手中杯', poemTitle: '《鲁郡东石门送杜二甫》' },
    { periodId: 'p4', name: '嵩山', x: 54, y: 48, lp: 'bottom', sceneKey: 'jiangjin',
      note: '嵩山元丹丘山居，他饮到酣处举杯高歌——"天生我材必有用，千金散尽还复来"，杜甫、高适听得直拍案。',
      poem: '天生我材必有用，千金散尽还复来', poemTitle: '《将进酒》' },
    { periodId: 'p4', name: '天姥山', x: 84, y: 58, lp: 'bottom', sceneKey: 'tianmu',
      note: '他也曾想，索性归隐，去天姥山寻仙去。可当真要去时，又迈不开这双脚——嘴上求仙，脚却总往长安的方向走。',
      poem: '安能摧眉折腰事权贵，使我不得开心颜', poemTitle: '《梦游天姥吟留别》' },
    { periodId: 'p4', name: '宣州谢朓楼', x: 74, y: 52, lp: 'right', sceneKey: 'xietiao',
      note: '在宣州谢朓楼上送别故人，写下半生的愁。"抽刀断水水更流，举杯消愁愁更愁"——这愁，不是酒能解的。',
      poem: '抽刀断水水更流，举杯消愁愁更愁', poemTitle: '《宣州谢朓楼饯别校书叔云》' },

    // —— 时期五：乱世浮沉 755–762 ——
    { periodId: 'p5', name: '庐山', x: 58, y: 68, lp: 'bottom', sceneKey: 'lushan',
      note: '安史之乱爆发，他避乱庐山，茅屋数间、竹影婆娑。永王李璘的使者第三次来请，他思来想去，一夜没合眼。',
      poem: '飞流直下三千尺，疑是银河落九天', poemTitle: '《望庐山瀑布》' },
    { periodId: 'p5', name: '江陵', x: 46, y: 64, lp: 'left', sceneKey: 'yongwang',
      note: '他终究没忍住，入了永王的幕。满心以为是去平定叛乱、报效国家，却不知自己一脚踏进了皇室内斗的漩涡。',
      poem: '但用东山谢安石，为君谈笑静胡沙', poemTitle: '《永王东巡歌·其二》' },
    { periodId: 'p5', name: '浔阳', x: 70, y: 74, lp: 'top', sceneKey: 'yuzhong',
      note: '永王兵败，他被打作"逆臣"，系在浔阳狱中。那些日子，他透过铁窗望天，一遍遍问自己：我李白，怎么会走到这一步？',
      poem: '夜郎万里道，西上令人老', poemTitle: '《经乱离后天恩流夜郎忆旧游书怀赠江夏韦太守良宰》' },
    { periodId: 'p5', name: '白帝城', x: 34, y: 50, lp: 'right', sceneKey: 'baidi',
      note: '长流夜郎途中，朝廷大赦天下。那一日他到了白帝城，喜极而狂，挥笔写下"千里江陵一日还"——这是他晚年最后的一点飞扬。',
      poem: '朝辞白帝彩云间，千里江陵一日还', poemTitle: '《早发白帝城》' }
  ]
};

// 苏轼线行迹
const SUSHI = {
  id: 'sushi',
  name: '苏轼',
  tagline: '一蓑烟雨',
  caption: '他这一生，官越做越远，人却越活越开——把风风雨雨，都走成了一场风景。',
  waypoints: [
    // —— 时期一：少年成名 1056–1061 ——
    { periodId: 'p1', name: '眉山', x: 22, y: 62, lp: 'right', sceneKey: 'meishan',
      note: '蜀地眉山，三苏故里。他与父苏洵、弟苏辙在这里读书长大，幼时问母"儿若为范滂，母许之否"。',
      poem: '守其初心，始终不变', poemTitle: '《杭州召还乞郡状》' },
    { periodId: 'p1', name: '汴京', x: 58, y: 34, lp: 'top', sceneKey: 'kaichang',
      note: '嘉祐二年，他与弟苏辙同科登第。主考欧阳修误以为他的文章是门生曾巩所作，抑为第二，后叹"放他出一头地"。',
      poem: '老夫当避路，放他出一头地', poemTitle: '欧阳修语' },

    // —— 时期二：密州湖州 1074–1079 ——
    { periodId: 'p2', name: '杭州', x: 80, y: 46, lp: 'bottom', sceneKey: 'hangzhou',
      note: '因对新法有异议，自请外放杭州通判。这里是他离开朝廷、走向地方的起点。',
      poem: '欲把西湖比西子，淡妆浓抹总相宜', poemTitle: '《饮湖上初晴后雨》' },
    { periodId: 'p2', name: '密州', x: 72, y: 26, lp: 'bottom', sceneKey: 'chulie',
      note: '密州出猎，"老夫聊发少年狂"；中秋对月怀弟，写下"但愿人长久，千里共婵娟"。',
      poem: '老夫聊发少年狂，左牵黄，右擎苍', poemTitle: '《江城子·密州出猎》' },
    { periodId: 'p2', name: '徐州', x: 70, y: 40, lp: 'right', sceneKey: 'xuzhou',
      note: '黄河决口，洪水围城。他亲率军民筑堤，庐于城上数十日，保全全城。',
      poem: '会挽雕弓如满月，西北望，射天狼', poemTitle: '《江城子·密州出猎》' },
    { periodId: 'p2', name: '湖州', x: 76, y: 52, lp: 'top', sceneKey: 'mizhou',
      note: '元丰二年到湖州任，七月即因"乌台诗案"被逮。一场风暴，正在这里等着他。',
      poem: '人有悲欢离合，月有阴晴圆缺', poemTitle: '《水调歌头》' },

    // —— 时期三：乌台诗案 1079 ——
    { periodId: 'p3', name: '御史台', x: 60, y: 30, lp: 'right', sceneKey: 'yuzhong',
      note: '乌台诗案，他因诗文被罗织罪名，关进御史台狱，生死一线。这里是他一生最暗的夜。',
      poem: '与君世世为兄弟，更结人间未了因', poemTitle: '《狱中寄子由》' },

    // —— 时期四：东坡赤壁 1080–1084 ——
    { periodId: 'p4', name: '黄州', x: 60, y: 52, lp: 'bottom', sceneKey: 'dongpo',
      note: '被贬黄州，开荒东坡，自号"东坡居士"。他把贬所活成了家园，把苦难活成了诗。',
      poem: '一蓑烟雨任平生', poemTitle: '《定风波》' },
    { periodId: 'p4', name: '赤壁', x: 66, y: 58, lp: 'bottom', sceneKey: 'chibi',
      note: '泛舟赤壁，"大江东去，浪淘尽"；寄蜉蝣于天地，渺沧海之一粟——绝境里开出的旷达。',
      poem: '大江东去，浪淘尽，千古风流人物', poemTitle: '《念奴娇·赤壁怀古》' },

    // —— 时期五：岭南北归 1094–1101 ——
    { periodId: 'p5', name: '惠州', x: 52, y: 78, lp: 'top', sceneKey: 'huizhou',
      note: '晚年再贬惠州。"日啖荔枝三百颗，不辞长作岭南人"——他把流放地，当成了自己的家。',
      poem: '日啖荔枝三百颗，不辞长作岭南人', poemTitle: '《惠州一绝》' },
    { periodId: 'p5', name: '儋州', x: 34, y: 88, lp: 'right', sceneKey: 'danzhou',
      note: '再贬海南儋州，天涯海角。他办学传文，说"我本儋耳人"——把最荒远之地，活成了故乡。',
      poem: '我本儋耳人，寄生西蜀州', poemTitle: '《别海南黎民表》' },
    { periodId: 'p5', name: '常州', x: 78, y: 44, lp: 'right', sceneKey: 'beigui',
      note: '遇赦北归，途中写下"问汝平生功业，黄州惠州儋州"。建中靖国元年，病逝于此。',
      poem: '问汝平生功业，黄州惠州儋州', poemTitle: '《自题金山画像》' }
  ]
};

const LINES = { dufu: DUFU, libai: LIBAI, sushi: SUSHI };

/** 取某条主线的行迹数据 */
function getLine(id) {
  return LINES[id] || null;
}

/** 取某条主线某个时期的全部地点 */
function getPeriodWaypoints(id, periodId) {
  const line = LINES[id];
  if (!line) return [];
  return line.waypoints.filter(w => w.periodId === periodId);
}

module.exports = {
  MAP_ASPECT,
  MAP_IMAGE,
  DYNASTY_MAPS,
  getMapConfig,
  LINES,
  getLine,
  getPeriodWaypoints
};
