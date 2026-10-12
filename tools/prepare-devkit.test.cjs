const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {prepare} = require('./prepare-devkit.cjs');
function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(),'devkit-host-'));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const source=path.join(base,'source'), dest=path.join(base,'host/assets/devkit-runtime');
  fs.mkdirSync(path.join(source,'explorer/styles'),{recursive:true});
  fs.writeFileSync(path.join(source,'explorer/index.js'),"export const version = 1;\n");
  fs.writeFileSync(path.join(source,'explorer/styles/explorer.css'),'.dk-app {}\n');
  const manifest={api_version:1,entry:'index.js',style:'styles/explorer.css',files:['index.js','styles/explorer.css']};
  const save=()=>fs.writeFileSync(path.join(source,'explorer/manifest.json'),JSON.stringify(manifest));save();
  return {base,source,dest,manifest,save};
}
test('copies only manifest UI assets and records checksums, never catalogs',t=>{
  const f=fixture(t);
  fs.mkdirSync(path.join(f.source,'reference'),{recursive:true});
  fs.writeFileSync(path.join(f.source,'reference/catalog.json'),'{}');
  const result=prepare(f.source,f.dest);
  assert.equal(result.files.length,2);
  assert.equal(fs.readFileSync(path.join(f.dest,'index.js'),'utf8'),"export const version = 1;\n");
  assert.ok(!fs.existsSync(path.join(f.dest,'reference')));
  assert.match(result.files[0].sha256,/^[0-9a-f]{64}$/);
});
test('bad manifest cannot replace a working generated UI',t=>{
  const f=fixture(t);prepare(f.source,f.dest);
  f.manifest.api_version=999;f.save();
  assert.throws(()=>prepare(f.source,f.dest),/Unsupported/);
  assert.ok(fs.existsSync(path.join(f.dest,'index.js')));
});
test('rejects traversal, symlinks and missing module dependencies',t=>{
  const f=fixture(t);
  f.manifest.files.push('../escape.js');f.save();
  assert.throws(()=>prepare(f.source,f.dest),/Unsafe/);
  f.manifest.files.pop();f.manifest.files.push('outside.js');f.save();
  fs.writeFileSync(path.join(f.base,'outside.js'),'');
  fs.symlinkSync(path.join(f.base,'outside.js'),path.join(f.source,'explorer/outside.js'));
  assert.throws(()=>prepare(f.source,f.dest),/escapes/);
  f.manifest.files.pop();f.save();
  fs.writeFileSync(path.join(f.source,'explorer/index.js'),"import {x} from './missing.js';");
  assert.throws(()=>prepare(f.source,f.dest),/Missing module/);
});
test('rebuild removes stale generated files without touching host files',t=>{
  const f=fixture(t);prepare(f.source,f.dest);
  fs.writeFileSync(path.join(f.dest,'stale.js'),'stale');
  fs.writeFileSync(path.join(path.dirname(f.dest),'other.js'),'host');
  prepare(f.source,f.dest);
  assert.ok(!fs.existsSync(path.join(f.dest,'stale.js')));
  assert.equal(fs.readFileSync(path.join(path.dirname(f.dest),'other.js'),'utf8'),'host');
});
