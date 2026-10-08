// tools/check-wxml-data.js —— 校验 WXML 里引用的数据字段在 JS 里确实存在
//
// 为什么需要：微信小程序对未定义字段是静默渲染为空，不会报错。
// 打错一个字段名（例如把 _covered 写成 covered）在开发者工具里看不出任何异常，
// 上真机才发现"这里怎么是空的"。这个脚本把这类错误在提交前抓出来。
//
// 运行：node tools/check-wxml-data.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'miniprogram', 'pages');

// WXML 内置/关键字，不算数据字段
const BUILTIN = new Set([
  'true', 'false', 'null', 'undefined', 'item', 'index', 'it', 'idx',
  'wx', 'length', 'Math', 'JSON'
]);

function collectJsKeys(js) {
  const keys = new Set();

  // 1) data: { ... } 块里的顶层键
  const dataMatch = js.match(/\n\s{2}data:\s*\{/);
  if (dataMatch) {
    const start = js.indexOf('{', dataMatch.index);
    let depth = 0, end = start;
    for (let i = start; i < js.length; i++) {
      if (js[i] === '{') depth++;
      else if (js[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    const block = js.slice(start + 1, end);
    // 只取缩进为 4 空格的键（data 的直接子级）
    block.split('\n').forEach((line) => {
      const m = line.match(/^\s{4}([A-Za-z_$][\w$]*)\s*:/);
      if (m) keys.add(m[1]);
    });
  }

  // 2) setData({ key: ... }) 与 setData({ 'a.b': ... }) 的键
  const setRe = /setData\(\s*\{([\s\S]*?)\}\s*[,)]/g;
  let sm;
  while ((sm = setRe.exec(js))) {
    sm[1].split('\n').forEach((line) => {
      let m = line.match(/^\s*['"]?([A-Za-z_$][\w$]*)['"]?\s*:/);
      if (m) keys.add(m[1]);
      // ['chatLog[0].content'] 形式
      m = line.match(/\[\s*['"]([A-Za-z_$][\w$]*)/);
      if (m) keys.add(m[1]);
    });
  }

  // 3) patch.xxx = / this.data.xxx 的赋值目标
  const asgRe = /(?:patch|d)\.([A-Za-z_$][\w$]*)\s*=/g;
  let am;
  while ((am = asgRe.exec(js))) keys.add(am[1]);
  const thisRe = /this\.data\.([A-Za-z_$][\w$]*)\s*=/g;
  while ((am = thisRe.exec(js))) keys.add(am[1]);

  return keys;
}

function wxmlIdents(wxml) {
  const ids = new Set();
  const re = /\{\{([\s\S]*?)\}\}/g;
  let m;
  while ((m = re.exec(wxml))) {
    const expr = m[1];
    // 取表达式里的根标识符（排除对象字面量的键、字符串内容）
    const cleaned = expr
      .replace(/'[^']*'/g, ' ')      // 去掉单引号字符串
      .replace(/"[^"]*"/g, ' ');     // 去掉双引号字符串
    const idRe = /([A-Za-z_$][\w$]*)\s*(\.|\[|\s*[=!<>+\-*/%&|?)]|\}|\s*$)/g;
    let im;
    while ((im = idRe.exec(cleaned))) {
      const name = im[1];
      // 跳过属性访问的后半段（.foo 里的 foo）
      const before = cleaned.slice(Math.max(0, im.index - 1), im.index);
      if (before === '.') continue;
      ids.add(name);
    }
  }
  return ids;
}

let problems = 0;
let checked = 0;

fs.readdirSync(ROOT).forEach((page) => {
  const dir = path.join(ROOT, page);
  if (!fs.statSync(dir).isDirectory()) return;
  const wxmlPath = path.join(dir, page + '.wxml');
  const jsPath = path.join(dir, page + '.js');
  if (!fs.existsSync(wxmlPath) || !fs.existsSync(jsPath)) {
    console.log('SKIP ' + page + '（缺 wxml 或 js）');
    return;
  }
  const wxml = fs.readFileSync(wxmlPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');
  const keys = collectJsKeys(js);
  const ids = wxmlIdents(wxml);

  // wx:for-item / wx:for-index 声明的循环别名不是 data 字段，需排除
  const aliases = new Set();
  const aliasRe = /wx:for-(?:item|index)\s*=\s*"([^"]+)"/g;
  let am;
  while ((am = aliasRe.exec(wxml))) aliases.add(am[1]);

  const missing = [...ids].filter(id => !keys.has(id) && !BUILTIN.has(id) && !aliases.has(id));
  checked++;
  if (missing.length) {
    problems += missing.length;
    console.log('✗ ' + page + '.wxml 引用了 JS 中未见的数据字段：' + missing.join(', '));
  } else {
    console.log('✓ ' + page + '.wxml 全部 ' + ids.size + ' 个字段均可解析');
  }
});

console.log('\n检查了 ' + checked + ' 个页面');
if (problems) {
  console.log('发现 ' + problems + ' 处可疑字段引用（可能是拼写错误，也可能只是脚本解析不到，请人工确认）');
  process.exit(0);   // 非阻塞：仅提示
}
console.log('ALL CLEAR');
