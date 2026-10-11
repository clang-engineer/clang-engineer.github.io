// Compatibility test entry; assertions are owned by Devkit.
const path = require('node:path');
const source = path.resolve(process.env.DEVKIT_ROOT || path.join(__dirname, '../../_devkit'));
require(path.join(source, 'tests/model.test.cjs'));
