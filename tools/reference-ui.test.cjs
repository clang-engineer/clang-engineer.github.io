// Execute the upstream tests against the same checkout used for this build.
const path = require('node:path');
const source = path.resolve(process.env.DEVKIT_ROOT || path.join(__dirname, '../_devkit'));
require(path.join(source, 'tests/ui.test.cjs'));
require(path.join(source, 'tests/resources.test.cjs'));
