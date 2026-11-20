import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {registry} from './fixtures.mjs';
import {toRuntimeData} from '../scripts/leaderboard-data.mjs';
const sources=await Promise.all(['results-model','moonshot-model'].map(n=>readFile(new URL('../assets/js/'+n+'.js',import.meta.url),'utf8')));
function api(fixture=registry){const context=vm.createContext({window:{BENCH:toRuntimeData(fixture)}});for(const source of sources)vm.runInContext(source,context);return context.window.BenchResults;}
test('the policy orbit uses the complete non-Agent Score results',()=>{
 const R=api(),r=R.moonshot.data('standard');assert.equal(r.totalTasks,26);assert.equal(r.plotted.length,11);assert.equal(r.unplotted.length,0);
 for(let i=0;i<r.plotted.length;i++){
  const e=r.plotted[i];assert.equal(e.score,R.model.score(e.policy.id).value);assert.equal(e.rank,i+1);assert.equal(R.model.aggregateRank(e.policy.id,'score'),e.rank);
  if(i)assert.ok(r.plotted[i-1].score>=e.score);
 }
 assert.deepEqual(Array.from(r.plotted.slice(0,5),e=>e.policy.id),['me-dex-1-5','gigaworld-policy-06','phoenix-mwa','mora_v0','GR00T_N17_TACTILE']);
});
test('the Agent track ranks complete agents and keeps Full-only reports separate',()=>{
 const R=api(),r=R.moonshot.data('standard','agent');
 assert.deepEqual(Array.from(r.plotted,e=>[e.policy.id,e.rank]),[['pyrua-dex',1]]);
 assert.deepEqual(Array.from(r.unplotted,e=>e.policy.id),['gpt6_astra_10x_icl','gpt6_astra_1x_icl']);
 for(const e of r.unplotted){assert.equal(e.score,null);assert.equal(e.sr,null);assert.ok(e.fullSr>0);}
 assert.equal(R.moonshot.leader('standard','agent').policy.id,'pyrua-dex');
 assert.equal(R.moonshot.leader('standard','policy').policy.id,'me-dex-1-5');
});
test('high SR and LSCR cannot rank without Eff., while a complete higher Score advances the rocket',()=>{
 const fixture=structuredClone(registry),p=fixture.policies.find(p=>p.model.id==='ACT');p.overall.sr=90;p.overall.lscr=90;p.overall.efficiency=null;
 assert.equal(api(fixture).moonshot.data('standard').plotted.some(e=>e.policy.id==='ACT'),false);
 p.overall.efficiency=1.3;
 assert.equal(api(fixture).moonshot.leader('standard').policy.id,'ACT');
});
test('the plot always uses Overall Score, independently of a legacy channel argument',()=>{
 const R=api();assert.deepEqual(R.moonshot.data('standard','full'),R.moonshot.data('standard'));assert.throws(()=>R.moonshot.data('missing'),/Unknown/);
});
test('incomplete evidence stays unranked and invalid component percentages fail ingestion',()=>{
 const fixture=structuredClone(registry);delete fixture.policies.find(p=>p.model.id==='ACT').per_task['03'].channels.Full;
 assert.equal(api(fixture).moonshot.data('standard').plotted.some(e=>e.policy.id==='ACT'),false);
 const invalid=structuredClone(registry);invalid.policies.find(p=>p.model.id==='ACT').overall.sr=101;
 assert.throws(()=>api(invalid),/must be a percentage/);
});
