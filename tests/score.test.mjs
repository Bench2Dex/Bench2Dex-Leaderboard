import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {registry,fullOnlyPolicy} from './fixtures.mjs';
import {toRuntimeData} from '../scripts/leaderboard-data.mjs';
const sources=await Promise.all(['results-model','overall-table'].map(n=>readFile(new URL('../assets/js/'+n+'.js',import.meta.url),'utf8')));
function api(fixture=registry){const context=vm.createContext({window:{BENCH:toRuntimeData(fixture)}});for(const source of sources)vm.runInContext(source,context);return context.window.BenchResults;}
const state={group:'standard',rankMetric:'score',rankChannel:'mean',rankDir:'descending'};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);

test('Score normalizes percentage inputs and uses uncapped raw efficiency',()=>{
 const {model:M}=api();
 for(const p of registry.policies.filter(p=>p.evaluation.recordType==='maintained-reference')){
  const o=p.overall;close(M.score(p.model.id).value,.45*o.sr+.45*o.lscr+10*o.efficiency);
 }
 const fixture=structuredClone(registry),p=fixture.policies.find(p=>p.model.id==='ACT');p.overall.efficiency=3;
 const R=api(fixture),score=R.model.score('ACT');
 close(score.value,.45*18.1+.45*34.9+10*3);
 assert.equal(R.format(score,'score'),score.value.toFixed(2));
 assert.ok(!R.format(score,'score').includes('%'));
});
test('each missing Overall input prevents Score and ranking, without substituting zero',()=>{
 for(const key of ['sr','lscr','efficiency']){
  const fixture=structuredClone(registry),p=fixture.policies.find(p=>p.model.id==='ACT');p.overall[key]=null;
  const {model:M,overall}=api(fixture);
  assert.equal(M.score('ACT').value,null);assert.equal(M.eligible('ACT','score'),false);assert.equal(M.aggregateRank('ACT','score'),null);
  assert.equal(overall.rank(M.policies.find(p=>p.id==='ACT'),{...state,rankMetric:'sr'}),null);
 }
});
test('finite summaries cannot hide incomplete task evidence',()=>{
 const fixture=structuredClone(registry),p=fixture.policies.find(p=>p.model.id==='ACT');delete p.per_task['03'].channels.Full;
 assert.equal(api(fixture).model.score('ACT').value,null);
});
test('default composite order, ranks, best cell and table column agree',()=>{
 const R=api(),M=R.model,rows=R.overall.ordered(M.group('standard'),state);
 assert.deepEqual(Array.from(rows.slice(0,7),p=>p.id),['GR00T_N17_TACTILE','GR00T_N17','PI05','GR00T_N15_TACTILE','GR00T_N15','ACT','DPC']);
 assert.equal(M.aggregateRank('GR00T_N17','score'),2);assert.equal(M.aggregateRank('PI05','score'),3);
 const html=R.overall.markup(rows,state);
 assert.equal(R.overall.columns.at(-1).id,'score');assert.match(html,/colspan="4" class="summary-group"/);
 assert.match(html,/data-rank-column="score"/);assert.match(html,/<strong class="best-value">44\.60<\/strong>/);
 assert.equal(R.overall.label(state),'Sorted by Score ↓');
 assert.match(R.overall.caption,/0\.45×SR.*0\.45×LSCR.*10×Eff/);
});
test('partial submissions stay unranked even while sorting a reported channel',()=>{
 const fixture=structuredClone(registry);fixture.policies.push(fullOnlyPolicy('PARTIAL',100));
 const R=api(fixture),M=R.model,p=M.policies.find(p=>p.id==='PARTIAL');
 const channelState={...state,rankMetric:'sr',rankChannel:'full'};
 assert.equal(R.overall.rank(p,channelState),null);
 const rows=R.overall.ordered(M.group('standard'),channelState);
 assert.ok(rows.findIndex(p=>p.id==='PARTIAL')>=7);
 assert.equal(M.score('gpt6_astra_1x_icl').value,null);assert.equal(M.score('gpt6_astra_10x_icl').value,null);
});
test('ties share an exact Score rank, while sorting never uses rounded display strings',()=>{
 const fixture=structuredClone(registry),copy=structuredClone(fixture.policies.find(p=>p.model.id==='PI05'));
 copy.model.id='TIE';copy.model.displayOrder=90;fixture.policies.push(copy);
 let M=api(fixture).model;assert.equal(M.aggregateRank('TIE','score'),M.aggregateRank('PI05','score'));
 copy.overall.efficiency+=.0001;M=api(fixture).model;
 assert.ok(M.score('TIE').value>M.score('PI05').value);assert.ok(M.aggregateRank('TIE','score')<M.aggregateRank('PI05','score'));
});
test('CSV exports computed summary scores and leaves partial scores explicitly NR',()=>{
 const M=api().model,csv=M.csv({summaryOnly:true}),lines=csv.trim().split('\r\n');
 assert.match(lines[0],/"score","score_status"$/);
 const good=lines.find(s=>s.includes('"GR00T_N17_TACTILE"')),partial=lines.find(s=>s.includes('"gpt6_astra_1x_icl"'));
 assert.ok(good.endsWith('"'+M.score('GR00T_N17_TACTILE').value.toFixed(6)+'","reported"'));
 assert.ok(partial.endsWith('"","not-reported"'));
});
