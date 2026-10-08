// 云函数 ttsUrl —— 代取云存储文件的临时播放链接
// 背景：免费套餐的存储权限被锁定为「仅创建者可读写」，控制台上传的文件对小程序端
// 不可读，端上直连 getTempFileURL 会报 STORAGE_EXCEED_AUTHORITY。
// 云函数以管理端权限运行，不受存储权限规则限制，故由它代为换取 mp3 临时链接。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const fileIDs = (event && event.fileIDs) || [];
  if (!Array.isArray(fileIDs) || fileIDs.length === 0) {
    return [];
  }
  // getTempFileURL 单次上限 50 个，防御性截断
  const ids = fileIDs.slice(0, 50);
  const res = await cloud.getTempFileURL({ fileList: ids });
  // 直接返回 fileList 数组：[{ fileID, tempFileURL, status, errMsg }]
  return res.fileList || [];
};
