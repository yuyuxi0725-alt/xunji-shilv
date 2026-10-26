此目录用于存放 tabBar 图标（PNG，建议 81×81px）。

需要的图标文件：
- home.png         首页（未选中）
- home-active.png  首页（选中）
- story.png        剧本（未选中）
- story-active.png 剧本（选中）
- map.png          行迹（未选中）
- map-active.png   行迹（选中）
- poem.png         诗笺（未选中）
- poem-active.png  诗笺（选中）
- mine.png         我的（未选中）
- mine-active.png  我的（选中）

说明：图标替换前，请先临时移除 app.json 中 tabBar.list 各页面的 iconPath / selectedIconPath 字段，
否则开发者工具会因找不到图片而报错。

生成方式：全套图标统一为古风线条风格（同「行迹/诗笺」），81×81px，
未选中 #8c7b6b / 选中 #8b5a2b。由 `tools/gen_tab_icons.py` 脚本生成（PIL 超采样绘制），
调整样式后重跑脚本即可，无需手改 PNG。旧图标备份在 `_backup/`。
