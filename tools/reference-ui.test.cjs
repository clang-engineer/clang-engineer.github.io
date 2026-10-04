const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { resolve } = require('node:path');
const base = resolve(__dirname, '..');
const cheatSource = readFileSync(resolve(base, 'assets/js/cheatsheets.js'), 'utf8');
const cliSource = readFileSync(resolve(base, 'cmdtreemap/app.js'), 'utf8');
const remote = 'https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/';
function node() {
  return { innerHTML: '', textContent: '', hidden: false, disabled: false, dataset: {}, listeners: {}, classList: {add(){}, toggle(){}},
    addEventListener(type, fn){ this.listeners[type] = fn; }, querySelectorAll(){return [];} };
}
function cheatSetup(fetch) {
  const elements = new Map();
  const get = selector => { if (!elements.has(selector)) elements.set(selector,node()); return elements.get(selector); };
  get('.cheatsheet-browser').dataset.source = remote + 'cheatsheets/catalog.json';
  get('.cheatsheet-browser').querySelector = get;
  const context = vm.createContext({ document:{querySelector:get}, fetch, URL, AbortSignal });
  vm.runInContext(cheatSource.replace('loadCatalog();\n',''),context);
  vm.runInContext('initializeBrowser = () => {};',context);
  return {context,elements,get};
}
const fixture = {groups:[{title:'도구',items:[{slug:'cat',name:'<cat>',desc:'a & b',official:[{url:'javascript:alert(1)',label:'bad'},{url:'https://example.com/?a=1&b=2',label:'Docs'}],custom:{url:'https://github.com/clang-engineer/devkit',label:'원본'}}]}]};
test('cheatsheets load the remote source without browser caching and render escaped data', async () => {
  const requests=[];
  const s=cheatSetup(async (url,options) => { requests.push([url,options.cache]); return {ok:true,json:async()=>fixture}; });
  await vm.runInContext('loadCatalog()',s.context);
  assert.deepEqual(requests,[[remote+'cheatsheets/catalog.json','no-store']]);
  const html=s.get('.cheatsheet-details').innerHTML;
  assert.ok(html.includes('&lt;cat&gt;'));
  assert.ok(html.includes('a &amp; b'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('https://github.com/clang-engineer/devkit'));
  assert.equal(s.get('#cheatsheet-search-input').disabled,false);
});
test('cheatsheet request failure exposes retry and successful retry recovers', async () => {
  let fail=true;
  const s=cheatSetup(async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>fixture};});
  await vm.runInContext('loadCatalog()',s.context);
  assert.equal(s.get('#cheatsheet-retry').hidden,false);
  assert.equal(s.get('#cheatsheet-search-input').disabled,true);
  fail=false;
  await s.get('#cheatsheet-retry').listeners.click();
  assert.equal(s.get('#cheatsheet-retry').hidden,true);
  assert.equal(s.get('#cheatsheet-search-input').disabled,false);
});
test('duplicate tool slugs and invalid catalogs fail without partial rendering', async () => {
  const duplicate=structuredClone(fixture);
  duplicate.groups[0].items.push(duplicate.groups[0].items[0]);
  const s=cheatSetup(async()=>({ok:true,json:async()=>duplicate}));
  await vm.runInContext('loadCatalog()',s.context);
  assert.equal(s.get('#cheatsheet-retry').hidden,false);
  assert.equal(s.get('.cheatsheet-list').innerHTML,'');
});
function cliSetup(fetch){
  const elements=new Map();
  const get=selector=>{if(!elements.has(selector))elements.set(selector,node());return elements.get(selector);};
  const root=node();root.querySelector=get;
  const context=vm.createContext({window:{},document:{querySelector:()=>root},fetch,AbortSignal});
  vm.runInContext(cliSource.replace('start();\n',''),context);
  return {context,get};
}
test('CLI loads remote data and recovers from an offline request with retry', async()=>{
  let fail=true;const requests=[];
  const s=cliSetup(async(url,options)=>{requests.push([url,options.cache]);if(fail)throw Error('offline');return {ok:true,json:async()=>({categories:[{name:'Files',commands:[],relations:[{from:'cat',to:'bat',solution:'colors'}]}]})};});
  await vm.runInContext('start()',s.context);
  assert.equal(s.get('[data-retry]').hidden,false);
  assert.equal(s.get('[data-search]').disabled,true);
  fail=false;
  await s.get('[data-retry]').listeners.click();
  assert.equal(s.get('[data-retry]').hidden,true);
  assert.equal(s.get('[data-search]').disabled,false);
  assert.ok(s.get('[data-tree]').innerHTML.includes('bat'));
  assert.deepEqual(requests.map(x=>x[0]),[remote+'cli/catalog.json',remote+'cli/catalog.json']);
  assert.ok(requests.every(x=>x[1]==='no-store'));
});
test('CLI invalid response offers retry instead of leaving an empty success state',async()=>{
  const s=cliSetup(async()=>({ok:true,json:async()=>({categories:[{}]})}));
  await vm.runInContext('start()',s.context);
  assert.equal(s.get('[data-retry]').hidden,false);
  assert.equal(s.get('[data-search]').disabled,true);
});
