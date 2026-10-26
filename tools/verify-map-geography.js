/* Verify that every narrative visit resolves to the shared geographic projection. */
const stories = require('../miniprogram/utils/stories/index');
const geography = require('../miniprogram/utils/map-geography');
const journey = require('../miniprogram/utils/journey');
const cloudAssets = require('../miniprogram/utils/cloudAssets');
const fs = require('fs');
const path = require('path');

let failures = 0;
['dufu', 'libai', 'sushi'].forEach((lineId) => {
  const locations = stories.getLocations(lineId);
  const byPlace = {};
  locations.forEach((visit) => {
    const point = geography.getVisitPoint(lineId, visit);
    if (!point) {
      console.error(`[${lineId}] missing coordinate: ${visit.id} ${visit.name}`);
      failures += 1;
      return;
    }
    if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
      console.error(`[${lineId}] out of bounds: ${visit.id} (${point.x}, ${point.y})`);
      failures += 1;
    }
    const placeId = visit.placeId || visit.id;
    const key = `${point.x},${point.y}`;
    if (byPlace[placeId] && byPlace[placeId] !== key) {
      console.error(`[${lineId}] repeated place drift: ${placeId}`);
      failures += 1;
    }
    byPlace[placeId] = key;
  });
  console.log(`[${lineId}] ${locations.length} visits / ${Object.keys(byPlace).length} map anchors verified`);
});

// Cloud-storage guard: runtime map layers have moved out of the mini-program
// package. Their source copies live under _cloud_upload at the same object path,
// and cloudAssets must recognise every runtime path as migratable.
const project = JSON.parse(fs.readFileSync(path.join(__dirname, '../miniprogram/project.config.json'), 'utf8'));
const mapAssets = new Set();
['dufu', 'libai', 'sushi'].forEach((lineId) => {
  const config = journey.getMapConfig(lineId);
  if (config.image) mapAssets.add(config.image);
  if (config.overlay) mapAssets.add(config.overlay);
});
mapAssets.forEach((asset) => {
  const relative = asset.replace(/^\//, '');
  const uploadSource = path.join(__dirname, '../_cloud_upload', relative);
  if (!cloudAssets.isMigratable(asset)) {
    console.error(`[cloud] runtime map path is not migratable: ${asset}`);
    failures += 1;
  }
  if (!fs.existsSync(uploadSource)) {
    console.error(`[cloud] missing upload source: ${relative}`);
    failures += 1;
  }
});
const includes = ((project.packOptions || {}).include || []).map((item) => item.value);
if (includes.some(value => /assets[\\/]images[\\/]maps/.test(value))) {
  console.error('[package] cloud map layers should not be forced into the mini-program package');
  failures += 1;
}
console.log(`[cloud] ${mapAssets.size} map layers have migratable paths and upload sources`);

// WeChat code quality applies the 200 KiB limit to the aggregate packaged
// image/audio resources. Scan the local asset tree (excluding the explicitly
// ignored icon backup folder) so a future map rebuild cannot silently regress.
const mediaExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp3', '.wav', '.aac', '.m4a', '.ogg']);
const ignoredMediaDirs = new Set(['_backup']);
let mediaBytes = 0;
function sumMedia(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    if (entry.isDirectory() && ignoredMediaDirs.has(entry.name)) return;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      sumMedia(absolute);
    } else if (mediaExtensions.has(path.extname(entry.name).toLowerCase())) {
      mediaBytes += fs.statSync(absolute).size;
    }
  });
}
sumMedia(path.join(__dirname, '../miniprogram/assets'));
if (mediaBytes > 200 * 1024) {
  console.error(`[package] image/audio total exceeds 200 KiB: ${(mediaBytes / 1024).toFixed(1)} KiB`);
  failures += 1;
} else {
  console.log(`[package] image/audio total ${(mediaBytes / 1024).toFixed(1)} KiB / 200 KiB`);
}

if (failures) process.exit(1);
console.log('Map geography verification passed.');
