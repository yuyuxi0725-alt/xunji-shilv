// tools/build-dufu-locations.js —— 杜甫 22 地点剧本统一构建入口
//
// 本文件已收敛为 tools/build-dufu-core.js 的薄封装：唯一的「提取 → 校验 → 注入镜头
// scene → 生成剧本 + 分镜映射」流程在 core 里实现，本脚本不再单独维护生成逻辑，
// 因此重新生成不会丢失镜头字段、也不会覆盖分镜脚本产出的内容。
//
// 唯一工作源：docs/杜甫行迹剧本-全22地点-含分镜.md
//
// 用法：
//   node tools/build-dufu-locations.js             # 生成（覆盖写两个产物）
//   node tools/build-dufu-locations.js --check     # 只校验：源稿结构 + 磁盘产物比对 + 分镜引用
//
// 说明：tools/build-dufu-fenjing.js 与本脚本等价（同一核心），二者输出完全一致，
//   保留两个入口仅为兼容旧命令习惯。

'use strict';
require('./build-dufu-core').main(process.argv.slice(2), 'build-dufu-locations.js');
