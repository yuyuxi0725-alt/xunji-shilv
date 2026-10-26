// utils/dufu-events.js —— 杜甫 22 地点必经事件与终章回望文案（自动生成，禁止手改）
//
// 由 tools/build-dufu-memory.js 从 cloudfunctions/chat/memory.js 派生。
// memory.js 是唯一手工维护源；改文案请改 memory.js 的 DUFU_EVENTS / DUFU_RECAPS，再重跑：
//   node tools/build-dufu-memory.js
//
// 用途：
//   · recaps 供终章「同行者」收束面板生成回望（第二人称 UI 文案）；
//   · events 为必经事实摘要（AI 提示词同源的另一版本），前端一般不直接用。
// 两份表都只含「全体玩家必经事件」，不含任何分支选择，因此换外观/改姓名都不影响终章正文。
//
// 结构：{ order: string[], events: { [locationId]: string }, recaps: { [locationId]: string } }

module.exports = {
  "order": [
    "luoyang",
    "shuhu",
    "wuyue",
    "luoyang_shi",
    "taishan",
    "shouang",
    "qizhao",
    "changan",
    "yexian",
    "fengxian",
    "changan_xian",
    "fengxiang",
    "qiangcun",
    "huazhou",
    "qinzhou",
    "tonggu",
    "chengdu",
    "kuizhou",
    "jingzhou",
    "tanzhou",
    "hengzhou",
    "xiangjiang"
  ],
  "events": {
    "luoyang": "洛阳书房初见，七岁的杜甫写下「开口咏凤凰」，讲起祖父杜审言的家学渊源",
    "shuhu": "郾城观公孙大娘舞剑，杜甫看得入神，感慨剑法如诗、一招一式都不多余",
    "wuyue": "吴越南游途中重逢，杜甫走过金陵旧都、姑苏台榭，说读万卷书不如行万里路",
    "luoyang_shi": "洛阳应举落第，杜甫没有消沉，转而放荡齐赵之间",
    "taishan": "同登泰山望岳，杜甫写下「会当凌绝顶，一览众山小」",
    "shouang": "洛阳守丧，父丧家变之际的陪伴",
    "qizhao": "天宝三、四载间在梁宋齐鲁与李白同游，纵马射猎、谈诗论道",
    "changan": "长安十年干谒求仕，屡屡碰壁，看尽朝政腐败",
    "yexian": "制举落第，李林甫一句「野无遗贤」让满城举子尽数落榜",
    "fengxian": "奉先幼子夭折，杜甫写下「朱门酒肉臭，路有冻死骨」",
    "changan_xian": "安史之乱中长安陷贼，身陷叛军写下「国破山河在，城春草木深」",
    "fengxiang": "凤翔麻鞋见天子，杜甫冒死投奔，授左拾遗",
    "qiangcun": "羌村团聚，乱世中一家重逢的温情",
    "huazhou": "华州任上西行，写下《三吏》《三别》",
    "qinzhou": "弃官西行入秦州，开始漂泊西南",
    "tonggu": "同谷饥寒交迫，拾橡栗充饥的最艰难冬天",
    "chengdu": "成都草堂安居，写下《茅屋为秋风所破歌》",
    "kuizhou": "夔州登高，写下「无边落木萧萧下，不尽长江滚滚来」",
    "jingzhou": "岳阳登岳阳楼，望洞庭浩渺",
    "tanzhou": "潭州江南逢李龟年，落花时节又逢君",
    "hengzhou": "衡州阻水耒阳，生命尾声的挣扎",
    "xiangjiang": "湖南水路漂泊中的舟中书怀；杜甫于770年去世，具体卒地有异说"
  },
  "recaps": {
    "luoyang": "洛阳的东厢房里，你第一次见他——七岁的孩子写下「开口咏凤凰」",
    "shuhu": "郾城看公孙大娘舞剑，他看得入神，说写诗也该像那剑，一招一式都不多余",
    "wuyue": "你陪他走过吴越的山水，他说读万卷书不如行万里路",
    "luoyang_shi": "洛阳应举落第，他转过马头，往齐赵去了",
    "taishan": "泰山的台阶望不到顶，他在山巅写下「会当凌绝顶，一览众山小」",
    "shouang": "洛阳守丧那年，你赶去陪他坐了很久",
    "qizhao": "梁宋齐鲁的原野上，你和李白、杜甫一起纵马",
    "changan": "长安十年，你见他一次次叩门，又一次次空手而归",
    "yexian": "榜下无一人，只留一句「野无遗贤」",
    "fengxian": "奉先那个冬天，他把丧子之痛写成「朱门酒肉臭，路有冻死骨」",
    "changan_xian": "长安陷落，他困在城里写「国破山河在，城春草木深」",
    "fengxiang": "他麻鞋见天子，衣袖露着两肘",
    "qiangcun": "羌村的夜里，他终于和家人团聚",
    "huazhou": "西行路上，他一路记下《三吏》《三别》",
    "qinzhou": "他弃了官，往更西的秦州去",
    "tonggu": "同谷的冬天最难，他拾橡栗充饥",
    "chengdu": "浣花溪畔的草堂，他总算歇了几年",
    "kuizhou": "夔州高处，他写下「无边落木萧萧下，不尽长江滚滚来」",
    "jingzhou": "岳阳楼上，他望着洞庭湖",
    "tanzhou": "潭州落花时节，他遇见了李龟年",
    "hengzhou": "耒阳的水涨了，船停在衡州",
    "xiangjiang": "湘江孤舟的文学化重逢里，他把最后一卷诗稿交到你手中"
  }
};
