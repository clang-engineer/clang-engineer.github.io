// Build dependency only. Catalog JSON and Markdown are never copied to the blog.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

function prepare(source, destination) {
  const root = fs.realpathSync(source);
  const explorer = fs.realpathSync(path.join(root, 'explorer'));
  if (!explorer.startsWith(root + path.sep)) throw Error('Explorer directory escapes checkout');
  const manifest = JSON.parse(fs.readFileSync(path.join(explorer, 'manifest.json'), 'utf8'));
  if (manifest.api_version !== 1 || manifest.entry !== 'index.js' || manifest.style !== 'styles/explorer.css' ||
      !Array.isArray(manifest.files) || !manifest.files.includes(manifest.entry) || !manifest.files.includes(manifest.style) ||
      new Set(manifest.files).size !== manifest.files.length) throw Error('Unsupported Devkit manifest');
  // Validate everything before removing an older build's generated directory.
  const files = manifest.files.map(file => {
    if (typeof file !== 'string' || !/^[a-zA-Z0-9_./-]+\.(js|css)$/.test(file) ||
        path.posix.isAbsolute(file) || file.split('/').some(part => !part || part === '.' || part === '..')) throw Error('Unsafe asset path');
    const input = fs.realpathSync(path.join(explorer, file));
    if (!input.startsWith(explorer + path.sep) || !fs.statSync(input).isFile()) throw Error('Asset escapes explorer');
    return { file, bytes: fs.readFileSync(input) };
  });
  for (const {file, bytes} of files) {
    if (!file.endsWith('.js')) continue;
    for (const match of bytes.toString('utf8').matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
      if (!manifest.files.includes(target)) throw Error('Missing module: ' + target);
    }
  }
  const dest = path.resolve(destination);
  if (dest === root || dest === explorer || root.startsWith(dest + path.sep) || dest.startsWith(explorer + path.sep)) throw Error('Unsafe destination');
  const parent = path.dirname(dest);
  fs.mkdirSync(parent, {recursive:true});
  const temp = fs.mkdtempSync(path.join(parent, '.devkit-build-'));
  try {
    for (const {file, bytes} of files) {
      const output = path.join(temp, file);
      fs.mkdirSync(path.dirname(output), {recursive:true});
      fs.writeFileSync(output, bytes);
    }
    let revision = null;
    try { revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch { /* Local archive/fixture. */ }
    const record = { repository:'clang-engineer/devkit', revision, api_version:manifest.api_version,
      files: files.map(({file,bytes}) => ({path:file,sha256:createHash('sha256').update(bytes).digest('hex')})) };
    fs.writeFileSync(path.join(temp, 'source.json'), JSON.stringify(record, null, 2) + '\n');
    fs.rmSync(dest, {recursive:true,force:true});
    fs.renameSync(temp, dest);
    return record;
  } finally { fs.rmSync(temp, {recursive:true,force:true}); }
}
module.exports = {prepare};
if (require.main === module) {
  const source = process.argv[2] || process.env.DEVKIT_ROOT || '_devkit';
  try {
    const result = prepare(source, path.resolve(__dirname, '../assets/devkit-runtime'));
    console.log(`Devkit UI: ${result.files.length} files from ${result.revision || 'local checkout'}`);
  } catch (error) {
    console.error('Devkit preparation failed: ' + error.message);
    console.error('Check out clang-engineer/devkit into _devkit, or run: node tools/prepare-devkit.cjs ../devkit');
    process.exitCode = 1;
  }
}
