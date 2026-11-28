import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {registry} from './fixtures.mjs';
import {toRuntimeData} from '../scripts/leaderboard-data.mjs';
const sources=await Promise.all(['results-model','overall-table','moonshot-model','moonshot','results-explorer'].map(n=>readFile(new URL('../assets/js/'+n+'.js',import.meta.url),'utf8')));
function page(search=''){
 const nodes=new Map();
 const node=selector=>{
  if(selector.startsWith('[data-task-row'))return null;
  if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',hidden:false,open:false,style:{setProperty(){}},events:{},attributes:{},addEventListener(t,h){this.events[t]=h;},querySelector:node,querySelectorAll:()=>[],closest:()=>({hidden:false}),setAttribute(name,value){this.attributes[name]=String(value);},focus(){}});
  return nodes.get(selector);
 };
 const root=node('#results-explorer');
 const scopeSelects=['moonshot','table'].map(section=>{
  const select=node(`#${section}-input`);
  node(`#${section}-scope`);
  return select;
 });
 const context=vm.createContext({window:{BENCH:toRuntimeData(registry),addEventListener(){},getSelection:()=>null},document:{querySelector:node,querySelectorAll:selector=>selector==='[data-policy-scope]'?scopeSelects:[],getElementById:id=>id.startsWith('moonshot')?node('#'+id):null,addEventListener(){}},location:{search,pathname:'/',hash:''},history:{replaceState(_a,_b,url){this.url=url;},pushState(_a,_b,url){this.url=url;}},URLSearchParams,CSS:{escape:s=>s}});
 for(const source of sources)vm.runInContext(source,context);
 return {nodes,context,click(data){root.events.click({target:{closest(selector){return selector==='button'?{dataset:data}:null;}}});}};
}
test('a new visit defaults to Score and the task matrix inherits its model order',()=>{
 const p=page(),html=p.nodes.get('#overview-table').innerHTML;
 assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Score ↓');
 assert.equal(p.nodes.get('#ranking-count').textContent,'16 results');
 assert.equal(p.nodes.get('#moonshot-input').value,'all');
 assert.equal(p.nodes.get('#table-input').value,'all');
 assert.match(html,/data-policy-row="pyrua-dex"[^<]*<td[^>]*><span[^>]*aria-label="Agent track"[^<]*>—/);
 assert.match(html,/data-policy-row="me-dex-1-5"[^<]*<td[^>]*><span[^>]*aria-label="Rank 2: silver medal"/);
 assert.ok(p.context.history.url.includes('rank_metric=score'));
 assert.ok(html.indexOf('data-policy-row="GR00T_N17"')<html.indexOf('data-policy-row="PI05"'));
 assert.ok(p.nodes.get('#task-sort-label').textContent.includes('Models: overall Score ↓'));
 assert.equal(p.nodes.get('#ranking-reset').hidden,true);
});
test('Score sorting keeps Agent results in the default table without ranks',()=>{
 const p=page();p.click({rankColumn:'score'});
 assert.equal(p.nodes.get('#ranking-label').textContent,'Sorted by Score ↑');
 const html=p.nodes.get('#overview-table').innerHTML;
 assert.ok(html.indexOf('data-policy-row="DPC"')<html.indexOf('data-policy-row="GR00T_N17_TACTILE"'));
 assert.ok(html.indexOf('data-policy-row="GR00T_N17_TACTILE"')<html.indexOf('data-policy-row="gpt6_astra_10x_icl"'));
 assert.match(html,/data-policy-row="pyrua-dex"[^<]*<td[^>]*><span[^>]*aria-label="Agent track"/);
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

test('either scope control updates both views and reranks the selected policies',()=>{
 const {nodes,context}=page();
 const table=()=>nodes.get('#overview-table').innerHTML;
 const chart=()=>nodes.get('#moonshot-chart').innerHTML;
 assert.match(table(),/data-policy-row="pyrua-dex"/);
 assert.match(chart(),/data-rocket-policy="unitacwam-v1"/);
 const selectScope=(section,value)=>{
  const select=nodes.get(`#${section}-input`);
  select.value=value;
  select.events.change?.({target:select});
 };

 selectScope('moonshot','tactile');
 assert.equal(Array.from(table().matchAll(/data-policy-row="([^"]+)"/g),m=>m[1]).length,4);
 assert.doesNotMatch(table(),/data-policy-row="worldscape_policy_2_5-preview"/);
 assert.match(table(),/data-policy-row="me-dex-1-5"[^<]*<td[^>]*><span[^>]*aria-label="Rank 2: silver medal"/);
 assert.match(chart(),/data-plot-policy="me-dex-1-5" data-rank="2"/);
 assert.equal(nodes.get('#table-input').value,'tactile');
 assert.doesNotMatch(chart(),/data-plot-policy="pyrua-dex"/);

 selectScope('table','without-tactile');
 assert.equal(Array.from(table().matchAll(/data-policy-row="([^"]+)"/g),m=>m[1]).length,9);
 assert.doesNotMatch(table(),/data-policy-row="me-dex-1-5"/);
 assert.doesNotMatch(chart(),/data-plot-policy="me-dex-1-5"/);
 assert.match(table(),/data-policy-row="worldscape_policy_2_5-preview"[^<]*<td[^>]*><span[^>]*aria-label="Rank 1: gold medal"/);
 assert.match(chart(),/data-rocket-policy="worldscape_policy_2_5-preview"/);
 assert.equal(nodes.get('#moonshot-input').value,'without-tactile');
 assert.match(context.history.url,/policy_scope=without-tactile/);
});

test('entering the Agent chart preserves the table view and returning restores the Policy chart',()=>{
 const {nodes,context}=page('?moonshot=agent&policy_scope=tactile');
 const chart=()=>nodes.get('#moonshot-chart').innerHTML;
 const table=()=>nodes.get('#overview-table').innerHTML;
 assert.match(chart(),/data-rocket-policy="pyrua-dex"/);
 assert.match(chart(),/data-plot-policy="pyrua-dex" data-rank="1"/);
 assert.match(table(),/data-policy-row="unitacwam-v1"/);
 assert.doesNotMatch(table(),/data-policy-row="pyrua-dex"/);
 assert.equal(nodes.get('#moonshot-scope').hidden,true);
 assert.equal(nodes.get('#table-scope').hidden,false);
 assert.equal(nodes.get('#table-input').value,'tactile');
 assert.match(context.history.url,/moonshot=agent/);

 const input=nodes.get('#table-input');
 input.value='without-tactile';
 input.events.change?.({target:input});
 assert.match(table(),/data-policy-row="worldscape_policy_2_5-preview"/);
 assert.doesNotMatch(table(),/data-policy-row="unitacwam-v1"/);
 assert.match(chart(),/data-rocket-policy="pyrua-dex"/);

 nodes.get('#moonshot-tracks').events.click?.({target:{closest:()=>({dataset:{moonshotTrack:'policy'}})}});
 assert.equal(nodes.get('#moonshot-scope').hidden,false);
 assert.equal(nodes.get('#moonshot-input').value,'without-tactile');
 assert.match(chart(),/data-rocket-policy="worldscape_policy_2_5-preview"/);
});
