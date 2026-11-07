import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {registry} from './fixtures.mjs';
import {toRuntimeData} from '../scripts/leaderboard-data.mjs';
const sources=await Promise.all(['results-model','overall-table','moonshot-model','moonshot'].map(n=>readFile(new URL('../assets/js/'+n+'.js',import.meta.url),'utf8')));
const attr=(tag,name)=>tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
export function renderer(fixture=registry,width=1200){
 const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',style:{},getBoundingClientRect:()=>id==='moonshot'||id==='moonshot-chart'?{width}:{width:190,height:82},events:{},addEventListener(t,h){this.events[t]=h;},querySelectorAll:()=>[]});return nodes.get(id);}};
 const context=vm.createContext({window:{BENCH:toRuntimeData(fixture)},document});for(const source of sources)vm.runInContext(source,context);
 const R=context.window.BenchResults;R.moonshot.render('standard');
 const chart=document.getElementById('moonshot-chart').innerHTML;
 return {R,nodes,chart,geometry:R.moonshot.layout(R.moonshot.data('standard').plotted,width),models:Array.from(chart.matchAll(/<g class="moonshot-label\b[^>]*>/g),m=>m[0]),rocket:chart.match(/<g class="moonshot-rocket"[^>]*>/)?.[0],reports:document.getElementById('moonshot-unplotted').innerHTML};
}
test('the figure has one Score axis and no Cartesian axes or grid',()=>{
 const r=renderer();assert.equal(r.models.length,7);assert.match(r.chart,/One diagonal Score axis/);
 assert.equal(Array.from(r.chart.matchAll(/class="moonshot-score-axis"/g)).length,1);
 assert.doesNotMatch(r.chart,/class="moonshot-axis"|class="moonshot-grid"|data-plot-axis=/);
 assert.match(r.chart,/aria-label="Policy ranking along the Score orbit"/);assert.match(r.chart,/Efficiency is uncapped/);
});
test('every anchor lies at its true Score coordinate on the diagonal axis',()=>{
 const r=renderer();for(const tag of r.models){
  const score=Number(attr(tag,'data-score')),x=Number(attr(tag,'data-score-x')),y=Number(attr(tag,'data-score-y'));
  close(x,78+1010*score/100);close(y,630-548*score/100);
  assert.equal(Number(attr(tag,'data-rank')),r.R.model.aggregateRank(attr(tag,'data-plot-policy'),'score'));
 }
});
test('the rocket nose is exactly at the highest Score point and remains inside the figure',()=>{
 const r=renderer(),leader=r.R.moonshot.leader('standard'),ship=r.geometry.rocket;
 assert.equal(attr(r.rocket,'data-rocket-policy'),leader.policy.id);close(Number(attr(r.rocket,'data-rocket-score')),leader.score);
 close(ship.x,78+1010*leader.score/100);close(ship.y,630-548*leader.score/100);
 assert.ok(ship.box.x>=8-1e-8&&ship.box.y>=8-1e-8&&ship.box.x+ship.box.w<=1192+1e-8&&ship.box.y+ship.box.h<=682+1e-8);
});
test('labels stay visible, clear of each other and the rocket at narrow and wide widths',()=>{
 for(const width of [320,390,645,840,1200]){
  const r=renderer(registry,width),g=r.geometry;assert.equal(g.labels.length,7,`missing labels at ${width}`);
  for(let i=0;i<g.labels.length;i++){
   const a=g.labels[i].box;assert.ok(a.x>=14&&a.y>=12&&a.x+a.w<=1186&&a.y+a.h<=668);
   assert.equal(overlap(a,g.rocket.box),0);
   for(let j=i+1;j<g.labels.length;j++)assert.equal(overlap(a,g.labels[j].box),0);
  }
 }
});
test('scores above 100 remain uncapped and the orbit expands its numeric scale',()=>{
 const fixture=structuredClone(registry),p=fixture.policies.find(p=>p.model.id==='ACT');Object.assign(p.overall,{sr:100,lscr:100,efficiency:3});
 const r=renderer(fixture);assert.equal(attr(r.rocket,'data-rocket-policy'),'ACT');close(Number(attr(r.rocket,'data-rocket-score')),120);
 assert.ok(r.geometry.maximum>=120);assert.equal(r.geometry.labels.length,7);assert.doesNotMatch(r.chart,/NaN|undefined|Infinity/);
});
test('top three Score labels share podium treatment and model links remain accessible',()=>{
 const r=renderer();assert.equal(r.models.filter(t=>t.includes('is-podium')).length,3);
 for(const tag of r.models){const id=attr(tag,'data-plot-policy');assert.match(r.chart,new RegExp('aria-label="Rank '+r.R.model.aggregateRank(id,'score')));}
 assert.match(r.chart,/target="_blank" rel="noopener noreferrer"/);assert.match(r.chart,/label-score/);
});
test('partial cards preserve both settings, their Full results and left-to-right budget order',()=>{
 const r=renderer();assert.ok(r.reports.indexOf('gpt6_astra_1x_icl')<r.reports.indexOf('gpt6_astra_10x_icl'));
 assert.match(r.reports,/Score: NR/);for(const value of ['26.2%','48.8%','61.5%','72.5%'])assert.ok(r.reports.includes(value));
 assert.doesNotMatch(r.reports,/\stitle=/);assert.doesNotMatch(r.chart,/data-plot-policy="gpt6_astra/);
});
test('only policy targets show the inspector; track hover clears it',()=>{
 const r=renderer(),root=r.nodes.get('moonshot');
 root.events.pointerover({target:{closest:s=>s==='[data-plot-policy]'?{dataset:{plotPolicy:'GR00T_N17_TACTILE'}}:null}});
 assert.equal(r.nodes.get('moonshot-inspector').hidden,false);assert.match(r.nodes.get('moonshot-inspector').innerHTML,/Score/);
 root.events.pointerover({target:{closest:()=>null}});assert.equal(r.nodes.get('moonshot-inspector').hidden,true);
});

test('every policy label is above the track and each straight leader ends at its logo',()=>{
 for(const width of [390,645,1200]){
  const g=renderer(registry,width).geometry;
  for(const p of g.labels){
   const projection=(x,y)=>(x-78)*(548/Math.hypot(1010,548))+(y-630)*(1010/Math.hypot(1010,548));
   for(const x of [p.box.x,p.box.x+p.box.w])for(const y of [p.box.y,p.box.y+p.box.h])assert.ok(projection(x,y)<0);
   close(Math.max(Math.abs(p.anchor.x-p.logo.x),Math.abs(p.anchor.y-p.logo.y)),19*p.scale);
  }
 }
});
test('close scores use distinct label heights and vertical leaders, without horizontal fan-out',()=>{
 for(const width of [390,645,1200]){
  const g=renderer(registry,width).geometry;
  for(const p of g.labels){close(p.logo.x,p.x);close(p.anchor.x,p.x);assert.ok(p.anchor.y<p.y);}
  const second=g.labels[1],third=g.labels[2];
  assert.ok(third.box.y>=second.box.y+second.box.h);assert.ok(second.x>third.x);
 }
});
