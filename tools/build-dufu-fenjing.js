// tools/build-dufu-fenjing.js —— 杜甫 22 地点剧本统一构建入口（分镜别名）
//
// 本文件与 tools/build-dufu-locations.js 等价：二者委托同一个核心
// tools/build-dufu-core.js，输出完全一致。保留本入口仅为兼容旧命令习惯。
//
// 历史问题（已修复）：本脚本曾读取已删除的「全21地点-含分镜.md」导致 ENOENT，
// 且与 build-dufu-locations.js 各自维护一套生成逻辑，重跑会丢失镜头字段。
// 现已统一为同一个核心流程，唯一工作源是 docs/杜甫行迹剧本-全22地点-含分镜.md。
//
// 用法：
//   node tools/build-dufu-fenjing.js             # 生成（覆盖写两个产物）
//   node tools/build-dufu-fenjing.js --check     # 只校验：源稿结构 + 磁盘产物比对 + 分镜引用

'use strict';
require('./build-dufu-core').main(process.argv.slice(2), 'build-dufu-fenjing.js');
