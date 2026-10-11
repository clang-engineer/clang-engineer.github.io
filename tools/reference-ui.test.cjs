// Discover each upstream suite once against the checkout used for this build.
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(process.env.DEVKIT_ROOT || path.join(__dirname, '../_devkit'));
const directory = path.join(source, 'tests');
for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.test.cjs')).sort()) {
  require(path.join(directory, file));
}
