# 可考据朝代舆图资源

> 2026-10-20：三张运行时底图已迁往云存储，本地 `assets/maps/` 不再放置图片文件
> （本目录仅保留本 README，`project.config.json` 已忽略 `assets/maps` 整个文件夹）。
> 云端路径为 `assets/images/maps/`，本地唯一副本在仓库根 `_cloud_upload/assets/images/maps/`，
> 代码侧由 `utils/journey.js` 的 `DYNASTY_MAPS` 以 `/assets/images/maps/*` 路径引用，
> 经 `cloudAssets.js` 的 `isMigratable()` 识别后换取云端临时链接。

运行时资源（云端 `assets/images/maps/`）：

- `map-terrain.jpg`：三条诗人线共用的 3D 地貌、海岸、河流和湖泊底图。
- `map-tang-boundary.png`：杜甫、李白线叠加的唐开元三十年（742）透明疆界层。
- `map-northern-song-boundary.png`：苏轼线叠加的北宋政和元年（1111）透明疆界层；以北宋为主，弱化呈现辽、西夏邻界。
- 完整合成版 `.webp` 仅生成到仓库根目录 `.codex-tmp/` 作为导出/对照文件，不进入小程序包。
- 三层均为 `984 × 1200`，采用相同的等经纬度范围：东经 100°–122.96°、北纬 18°–46°。
- 地形只在主包保存一次，以免微信代码质量扫描把两张重复地貌计入图片和音频资源总量。
- 地点不再使用人工摆放坐标。`utils/map-geography.js` 中的经纬度与本底图使用同一个投影公式。

## 历史疆界来源

1. 唐：Yug、Kanguole 等，Wikimedia Commons，**China, 742.svg**  
   https://commons.wikimedia.org/wiki/File:China,_742.svg  
   原图说明将疆界与道级区划追溯至 Denis Twitchett 编《The Cambridge History of China, Vol. 3》等资料。许可：CC BY-SA 3.0。

2. 北宋：Mozzan、Kanguole（派生），Wikimedia Commons，**China - Song Dynasty-en.svg**  
   https://commons.wikimedia.org/wiki/File:China_-_Song_Dynasty-en.svg  
   原图说明为 1111 年形势，并注明依据谭其骧《中国历史地图集》的来源图。许可：CC BY-SA 3.0。

本项目对原图进行了派生处理：提取疆域矢量、用原图中可识别城址/岛屿控制点校准坐标、重投影到统一画布、移除原图文字，并重新配色及加粗疆界。派生地图沿用 CC BY-SA 3.0。
许可全文：https://creativecommons.org/licenses/by-sa/3.0/

## 山川、海岸与地貌来源

- Natural Earth 1:10m `Shaded Relief`（SRTM Plus 派生晕渲）。
- Natural Earth 1:10m `Land`、`Lakes`、`Rivers + lake centerlines`。
- Natural Earth 数据为 public domain。
- 视觉采用正射 3D 地形：从来源晕渲识别连续山地区域，只在山地保留环境阴影、山脊高光与谷地阴影，平原压低纹理；河流按 Natural Earth 等级分层描绘。全程不使用透视倾斜，因此不会改变行迹点和疆界的经纬度对应关系。

来源页：

- https://www.naturalearthdata.com/downloads/10m-raster-data/10m-shaded-relief/
- https://www.naturalearthdata.com/downloads/10m-physical-vectors/
- https://github.com/nvkelso/natural-earth-vector/blob/master/LICENSE.md

## 地名与边界核对口径

- 城市点使用历史治所/古城址对应的现代经纬度；山岳使用核心山域坐标。
- 吴越、齐赵、梁宋齐鲁、流放途中、湘江等范围型节点只能选择代表点，具体代表点和说明保存在 `utils/map-geography.js`，不宣称为唯一精确地址。
- 历史行政沿革可继续使用 Harvard China Historical GIS（CHGIS，覆盖公元前 221 年至 1911 年）交叉核对：https://gis.harvard.edu/china-historical-gis

## 重建

原始下载文件保存在 `tools/map-sources/`。运行：

```bash
python tools/build-dynasty-maps.py
```

即可用同一来源和投影重新生成 JPG、WebP 和预览 PNG；运行时使用 JPG。
