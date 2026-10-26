// 行迹地图的统一地理坐标源。
//
// 约定：
// 1. 底图与地点共用同一等经纬度投影和同一边界范围，禁止再手调 x/y 贴图。
// 2. 历史城市用其古城址对应的现代经纬度；山岳用主峰/核心景区坐标。
// 3. 吴越、齐赵等范围型叙事节点只能取“代表点”，并在 note 中明确口径。
// 4. 同一 placeId 的多次到访必然投影到同一个像素锚点。

const MAP_BOUNDS = Object.freeze({
  west: 100,
  east: 122.96,
  south: 18,
  north: 46
});

const PLACES = Object.freeze({
  // 三线共用的历史城址
  luoyang: { lon: 112.45, lat: 34.62, basis: '洛阳古城址' },
  changan: { lon: 108.94, lat: 34.34, basis: '唐长安城址' },
  fengxiang: { lon: 107.40, lat: 34.52, basis: '凤翔府城址' },
  jiangling: { lon: 112.24, lat: 30.34, basis: '江陵古城址' },
  yangzhou: { lon: 119.42, lat: 32.39, basis: '扬州古城址' },

  // 杜甫线
  wuyue: { lon: 120.58, lat: 30.01, basis: '范围节点：以越州（今绍兴）为代表点' },
  qizhao: { lon: 117.00, lat: 36.65, basis: '范围节点：以齐州（今济南）为代表点' },
  taishan: { lon: 117.10, lat: 36.25, basis: '泰山主峰区域' },
  fengxian: { lon: 109.59, lat: 34.96, basis: '唐奉先县，今陕西蒲城' },
  qiangcun: { lon: 109.38, lat: 35.99, basis: '鄜州羌村，按今陕西富县一带取点' },
  huazhou: { lon: 109.77, lat: 34.52, basis: '唐华州治所，今陕西渭南华州区' },
  qinzhou: { lon: 105.72, lat: 34.58, basis: '唐秦州治所，今天水' },
  tonggu: { lon: 105.73, lat: 33.74, basis: '唐同谷县，今甘肃成县' },
  chengdu: { lon: 104.07, lat: 30.67, basis: '成都古城址' },
  kuizhou: { lon: 109.47, lat: 31.02, basis: '夔州治所，今重庆奉节' },
  jingzhou: { lon: 112.24, lat: 30.34, basis: '江陵古城址' },
  tanzhou: { lon: 112.94, lat: 28.23, basis: '潭州治所，今长沙' },
  hengzhou: { lon: 112.57, lat: 26.90, basis: '衡州治所，今衡阳' },
  xiangjiang: { lon: 112.86, lat: 26.42, basis: '范围节点：以耒阳附近湘江水系行舟段为代表点' },

  // 李白线
  qinglian: { lon: 104.74, lat: 31.78, basis: '青莲乡，今四川江油青莲镇' },
  emei: { lon: 103.34, lat: 29.55, basis: '峨眉山核心山域' },
  jingmen: { lon: 112.20, lat: 31.04, basis: '荆门山—荆门古渡一带' },
  jinling_yangzhou: { lon: 119.42, lat: 32.39, basis: '范围节点：剧情合并金陵—扬州，以扬州古城址为代表点' },
  anlu: { lon: 113.69, lat: 31.26, basis: '安陆古城址' },
  zhongnan: { lon: 108.83, lat: 33.95, basis: '终南山北麓核心山域' },
  luoyang_libai: { lon: 112.45, lat: 34.62, basis: '洛阳古城址' },
  songshan: { lon: 112.96, lat: 34.48, basis: '嵩山核心山域' },
  tianmu: { lon: 120.90, lat: 29.50, basis: '天姥山，今浙江新昌一带' },
  liangsong: { lon: 115.65, lat: 34.45, basis: '范围节点：以宋州（今商丘）为代表点' },
  xuanzhou: { lon: 118.76, lat: 30.95, basis: '宣州治所，今宣城' },
  youyan: { lon: 116.40, lat: 39.90, basis: '范围节点：以幽州城（今北京）为代表点' },
  lushan: { lon: 115.98, lat: 29.56, basis: '庐山核心山域' },
  xunyang: { lon: 115.99, lat: 29.72, basis: '浔阳，今江西九江' },
  yelang: { lon: 106.83, lat: 28.13, basis: '流放方向节点：以唐夜郎县相关的今贵州桐梓一带为代表点' },
  baidi: { lon: 109.57, lat: 31.04, basis: '白帝城，今重庆奉节' },
  dangtu: { lon: 118.50, lat: 31.57, basis: '当涂古县治一带' },

  // 苏轼线
  meishan: { lon: 103.85, lat: 30.08, basis: '眉州眉山古城址' },
  bianjing: { lon: 114.31, lat: 34.80, basis: '北宋东京汴梁，今开封' },
  hangzhou: { lon: 120.16, lat: 30.27, basis: '杭州古城址' },
  mizhou: { lon: 119.41, lat: 35.99, basis: '密州治所，今山东诸城' },
  xuzhou: { lon: 117.28, lat: 34.20, basis: '徐州古城址' },
  huzhou: { lon: 120.09, lat: 30.89, basis: '湖州古城址' },
  huangzhou: { lon: 114.88, lat: 30.45, basis: '黄州治所，今湖北黄冈' },
  dengzhou: { lon: 120.75, lat: 37.81, basis: '登州治所，今山东蓬莱' },
  yingzhou: { lon: 115.81, lat: 32.89, basis: '颍州治所，今安徽阜阳' },
  dingzhou: { lon: 114.99, lat: 38.52, basis: '定州古城址' },
  huizhou: { lon: 114.42, lat: 23.11, basis: '惠州古城址' },
  danzhou: { lon: 109.58, lat: 19.52, basis: '儋州治所，今海南儋州一带' },
  jinshan: { lon: 119.42, lat: 32.20, basis: '金山寺，今江苏镇江' },
  changzhou: { lon: 119.97, lat: 31.81, basis: '常州古城址' }
});

// visit id 与统一地理实体的映射。这里不依赖显示名称，避免同名异地或异名同地误合并。
const VISIT_PLACE_KEYS = Object.freeze({
  dufu: {
    luoyang: 'luoyang', shuhu: 'luoyang', luoyang_shi: 'luoyang',
    wuyue: 'wuyue', qizhao: 'qizhao', taishan: 'taishan',
    changan: 'changan', yexian: 'changan', changan_xian: 'changan',
    fengxian: 'fengxian', fengxiang: 'fengxiang', qiangcun: 'qiangcun',
    huazhou: 'huazhou', qinzhou: 'qinzhou', tonggu: 'tonggu', chengdu: 'chengdu',
    kuizhou: 'kuizhou', jingzhou: 'jingzhou', tanzhou: 'tanzhou',
    hengzhou: 'hengzhou', xiangjiang: 'xiangjiang'
  },
  libai: {
    qinglian: 'qinglian', emei: 'emei', jingmen: 'jingmen', yangzhou: 'jinling_yangzhou',
    anlu: 'anlu', changan1: 'changan', hanlin: 'changan', zhongnan: 'zhongnan',
    luoyang_libai: 'luoyang_libai', songshan: 'songshan', tianmu: 'tianmu',
    liangsong: 'liangsong', xuanzhou: 'xuanzhou', youyan: 'youyan', lushan: 'lushan',
    yongwang: 'jiangling', xunyang: 'xunyang', liuyelang: 'yelang', baidi: 'baidi', dangtu: 'dangtu'
  },
  sushi: {
    meishan: 'meishan', bianjing: 'bianjing', fengxiang: 'fengxiang',
    hangzhou: 'hangzhou', suti: 'hangzhou', mizhou: 'mizhou', xuzhou: 'xuzhou',
    huzhou: 'huzhou', wutai: 'bianjing', dinghui: 'huangzhou', dongpo: 'huangzhou',
    chibi: 'huangzhou', shahu: 'huangzhou', chengtian: 'huangzhou',
    dengzhou: 'dengzhou', yingzhou: 'yingzhou', yangzhou: 'yangzhou',
    dingzhou: 'dingzhou', huizhou: 'huizhou', danzhou: 'danzhou',
    jinshan: 'jinshan', changzhou: 'changzhou'
  }
});

function project(lon, lat) {
  const x = ((lon - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100;
  return {
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000
  };
}

function getVisitPoint(lineId, visit) {
  const lineMap = VISIT_PLACE_KEYS[lineId] || {};
  const key = lineMap[visit.id] || visit.placeId || visit.id;
  const place = PLACES[key];
  if (!place) return null;
  return Object.assign({ placeKey: key }, place, project(place.lon, place.lat));
}

module.exports = {
  MAP_BOUNDS,
  PLACES,
  VISIT_PLACE_KEYS,
  project,
  getVisitPoint
};
