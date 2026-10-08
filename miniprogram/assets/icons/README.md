此目录用于存放 tabBar 图标（PNG，建议 81×81px）。

需要的图标文件：
- home.png         首页（未选中）
- home-active.png  首页（选中）
- story.png        剧本（未选中）
- story-active.png 剧本（选中）
- mine.png         我的（未选中）
- mine-active.png  我的（选中）

说明：图标替换前，请先临时移除 app.json 中 tabBar.list 各页面的 iconPath / selectedIconPath 字段，
否则开发者工具会因找不到图片而报错。
