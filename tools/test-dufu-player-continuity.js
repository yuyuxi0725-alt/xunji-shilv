#!/usr/bin/env node
// 步骤六：杜甫全程玩家角色的剧本连续性回归测试。

'use strict';

const fs = require('fs');
const path = require('path');
const core = require('./build-dufu-core');
const engine = require('../miniprogram/cloudfunctions/chat/engine');
const memory = require('../miniprogram/cloudfunctions/chat/memory');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs', '杜甫行迹剧本-全22地点-含分镜.md');
const md = fs.readFileSync(SOURCE, 'utf8');
const extracted = core.extractQuests(md);
const quests = {};
extracted.quests.forEach(q => { quests[q.id] = q; });

let passed = 0;
const failed = [];
function ok(name, cond) {
  if (cond) passed++;
  else failed.push(name);
}

console.log('--- A. 源稿与节点稳定性 ---');
ok('A1 共 22 地点', extracted.quests.length === 22);
ok('A2 保持 854 节点', extracted.quests.reduce((n, q) => n + Object.keys(q.nodes).length, 0) === 854);
ok('A3 首站明确真正初见', quests.luoyang.nodes.n1a.text.indexOf('初见') >= 0);
ok('A4 首站不再强制随长辈登门', quests.luoyang.nodes.n1a.text.indexOf('随家里长辈') < 0);
ok('A5 第二站双方自然认出', quests.shuhu.nodes.n2x.text.indexOf('也认出了你') >= 0);
ok('A6 吴越明确多年后重逢', quests.wuyue.nodes.n2.text.indexOf('一别经年') >= 0);
ok('A7 守丧明确玩家不是亲属', quests.shouang.nodes.n10.prompt.indexOf('不是他的亲属') >= 0);
ok('A8 陷贼篇不再写成持续跟随', quests.changan_xian.nodes.n1.text.indexOf('你也跟了去') < 0);
ok('A9 衡州不提前宣告“陪到最后”', quests.hengzhou.nodes.n7a.text.indexOf('陪到最后') < 0);
ok('A10 湘江改为人生关口重逢', quests.xiangjiang.nodes.n5.text.indexOf('人生的关口') >= 0);
ok('A11 收束使用“一次次相遇”', quests.xiangjiang.nodes.n8.lines.some(x => x.indexOf('一次次相遇') >= 0));

console.log('--- B. 旧职业与关系等级退场 ---');
const runtimeText = JSON.stringify(extracted.quests);
['fellowScholar', 'mountainGuide', 'passingTraveler', 'relationshipStage', 'playerRoleId'].forEach((word) => {
  ok('B ' + word + ' 不进入杜甫剧本', runtimeText.indexOf(word) < 0);
});

console.log('--- C. 自由对话关系与记忆边界 ---');
function prompt(locationId, questId, completedLocations) {
  return engine.buildSystemPrompt({
    npc: 'dufu', questId: questId || 'p1', locationId,
    cards: [], coveredList: [], hitCards: [], stage: 'probe',
    availableMemories: memory.resolveAvailableEvents(locationId, completedLocations || [])
  });
}
const first = prompt('luoyang');
ok('C1 洛阳是第一次相见', first.indexOf('第一次与你相见') >= 0);
ok('C2 洛阳禁止未来共同记忆', first.indexOf('不得提及任何后来') >= 0);
const second = prompt('shuhu', 'p1', ['luoyang']);
ok('C3 舞剑只记得书房初见', second.indexOf('洛阳书房初见') >= 0 && second.indexOf('泰山') < 0);
const mountain = prompt('taishan');
ok('C4 泰山使用全程同行者', mountain.indexOf('同一位同行者') >= 0);
ok('C5 泰山不含旧引路人身份', mountain.indexOf('泰山引路人') < 0 && mountain.indexOf('小哥') < 0);
const final = prompt('xiangjiang', 'p4');
ok('C6 晚年承认一次次重逢', final.indexOf('一次次重逢') >= 0);
ok('C7 晚年禁止声称从未离开', final.indexOf('不要说他从未离开') >= 0);
ok('C8 AI 不念或追问自定义姓名', final.indexOf('不要念出或追问其自定义姓名') >= 0);

console.log('\n=====================================');
if (failed.length) {
  console.error('FAILED  ' + failed.length + ' 项未通过（通过 ' + passed + ' 项）：');
  failed.forEach(x => console.error('  ✗ ' + x));
  process.exit(1);
}
console.log('ALL PASS  ' + passed + ' 项断言全部通过');

