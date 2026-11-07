import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {registry} from './fixtures.mjs';
import {toRuntimeData} from '../scripts/leaderboard-data.mjs';
const sources=await Promise.all(['results-model','overall-table','results-explorer'].map(n=>readFile(new URL('../assets/js/'+n+'.js',import.meta.url),'utf8')));
function page(search=''){
 const nodes=new Map();
 const node=selector=>{
  if(selector.startsWith('[data-task-row'))return null;
  if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',hidden:false,open:false,style:{setProperty(){}},events:{},addEventListener(t,h){this.events[t]=h;},querySelector:node,querySelectorAll:()=>[],closest:()=>({hidden:false}),setAttribute(){},focus(){}});
  return nodes.get(selector);
 };
 const root=node('#results-explorer');
 const context=vm.createContext({window:{BENCH:toRuntimeData(registry),addEventListener(){},getSelection:()=>null},document:{querySelector:node,querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){}},location:{search,pathname:'/',hash:''},history:{replaceState(_a,_b,url){this.url=url;}},URLSearchParams,CSS:{escape:s=>s}});
 for(const source of sources)vm.runInContext(source,context);
 return {nodes,context,click(data){root.events.click({target:{closest(selector){return selector==='button'?{dataset:data}:null;}}});}};
}
test('a new visit defaults to Score and the task matrix inherits its model order',()=>{
 const p=page(),html=p.nodes.get('#overview-table').innerHTML;
 assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Score ↓');
 assert.ok(p.context.history.url.includes('rank_metric=score'));
 assert.ok(html.indexOf('data-policy-row="GR00T_N17"')<html.indexOf('data-policy-row="PI05"'));
 assert.ok(p.nodes.get('#task-sort-label').textContent.includes('Models: overall Score ↓'));
 assert.equal(p.nodes.get('#ranking-reset').hidden,true);
});
test('Score sorting toggles without ranking the incomplete reports',()=>{
 const p=page();p.click({rankColumn:'score'});
 assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Score ↑');
 const html=p.nodes.get('#overview-table').innerHTML;
 assert.ok(html.indexOf('data-policy-row="DPC"')<html.indexOf('data-policy-row="GR00T_N17_TACTILE"'));
 assert.ok(html.indexOf('data-policy-row="GR00T_N17_TACTILE"')<html.indexOf('data-policy-row="gpt6_astra_10x_icl"'));
});
test('reset restores Score after exploring another ranking column',()=>{
 const p=page();p.click({rankColumn:'sr'});assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by SR ↓ · Four-channel mean');
 p.nodes.get('#ranking-reset').events.click();
 assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Score ↓');assert.equal(p.nodes.get('#ranking-reset').hidden,true);
});
test('per-task metric changes preserve the independent Score ranking',()=>{
 const p=page();p.click({taskMetric:'lscr'});
 assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Score ↓');
 assert.match(p.nodes.get('#task-matrix').innerHTML,/Per-Task Scores/);
 assert.ok(p.context.history.url.includes('metric=lscr'));
});
test('an explicit legacy SR sort remains a usable shared view',()=>{
 const p=page('?rank_metric=sr&rank_channel=full&rank_dir=ascending');
 assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Full SR ↑');
 p.nodes.get('#ranking-reset').events.click();assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Score ↓');
});
