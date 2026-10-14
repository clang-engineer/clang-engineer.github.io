const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const include = fs.readFileSync(path.resolve(__dirname, '../../_includes/devkit-explorer.html'), 'utf8');
test('blog reads the canonical devkit catalog through the shared component', () => {
  assert.ok(include.includes('<reference-explorer'));
  assert.ok(include.includes('https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/catalog.json'));
});
test('component JavaScript and style use the same immutable source revision', () => {
  const urls = [...include.matchAll(/https:\/\/cdn\.jsdelivr\.net\/gh\/clang-engineer\/reference-explorer@([a-f0-9]{40})\/src\/(styles\/explorer\.css|element\.js)/g)];
  assert.equal(urls.length, 2);
  assert.equal(urls[0][1], urls[1][1]);
  assert.ok(urls.some(match => match[2] === 'element.js'));
  assert.ok(urls.some(match => match[2] === 'styles/explorer.css'));
});
