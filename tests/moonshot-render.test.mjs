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
export function renderer(fixture=registry,width=1200,track='policy',scope='all'){
 const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',style:{},getBoundingClientRect:()=>id==='moonshot'||id==='moonshot-chart'?{width}:{width:190,height:82},events:{},addEventListener(t,h){this.events[t]=h;},querySelectorAll:()=>[]});return nodes.get(id);}};
 const context=vm.createContext({window:{BENCH:toRuntimeData(fixture)},document});for(const source of sources)vm.runInContext(source,context);
 const R=context.window.BenchResults;R.moonshot.render('standard',track,scope);
 const chart=document.getElementById('moonshot-chart').innerHTML;
 return {R,nodes,chart,geometry:R.moonshot.layout(R.moonshot.data('standard',track,scope).plotted,width,scope),models:Array.from(chart.matchAll(/<g class="moonshot-label\b[^>]*>/g),m=>m[0]),rocket:chart.match(/<g class="moonshot-rocket"[^>]*>/)?.[0],reports:document.getElementById('moonshot-unplotted').innerHTML};
}
test('the figure has one Score axis and no Cartesian axes or grid',()=>{
 const r=renderer();assert.equal(r.models.length,13);assert.match(r.chart,/One diagonal Score axis/);
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
  const r=renderer(registry,width),g=r.geometry;assert.equal(g.labels.length,13,`missing labels at ${width}`);
  for(let i=0;i<g.labels.length;i++){
   const a=g.labels[i].box;assert.ok(a.x>=14&&a.y>=12&&a.x+a.w<=1186&&a.y+a.h<=668);
   const ship=g.rocket,angle=ship.angle*Math.PI/180;
   const along=(x,y)=>(x-ship.x)*Math.cos(angle)+(y-ship.y)*Math.sin(angle);
   const across=(x,y)=>-(x-ship.x)*Math.sin(angle)+(y-ship.y)*Math.cos(angle);
   const corners=[a.x,a.x+a.w].flatMap(x=>[a.y,a.y+a.h].map(y=>[x,y]));
   const forward=corners.map(([x,y])=>along(x,y)),side=corners.map(([x,y])=>across(x,y));
   assert.ok(!overlap(a,ship.box)||Math.max(...forward)<=-ship.width||Math.min(...forward)>=0||
    Math.max(...side)<=-ship.noseY||Math.min(...side)>=ship.height-ship.noseY);
   for(let j=i+1;j<g.labels.length;j++)assert.equal(overlap(a,g.labels[j].box),0);
  }
 }
});
test('scores above 100 remain uncapped and the orbit expands its numeric scale',()=>{
 const fixture=structuredClone(registry),p=fixture.policies.find(p=>p.model.id==='ACT');Object.assign(p.overall,{sr:100,lscr:100,efficiency:3});
 const r=renderer(fixture);assert.equal(attr(r.rocket,'data-rocket-policy'),'ACT');close(Number(attr(r.rocket,'data-rocket-score')),120);
 assert.ok(r.geometry.maximum>=120);assert.equal(r.geometry.labels.length,13);assert.doesNotMatch(r.chart,/NaN|undefined|Infinity/);
});
test('top three Score labels have larger logos and model links remain accessible',()=>{
 const r=renderer();assert.equal(r.models.filter(t=>t.includes('is-podium')).length,3);
 const badges=Array.from(r.chart.matchAll(/<rect class="label-logo-bg"[^>]*>/g),match=>match[0]);
 assert.deepEqual(badges.slice(0,4).map(tag=>Number(attr(tag,'width'))),[30,28,28,26]);
 for(const [index,p] of r.geometry.labels.entries()){
  const tag=badges[index],height=Number(attr(tag,'height'));
  close(p.box.x+(Number(attr(tag,'x'))+height/2)*p.scale,p.anchor.x);
  close(p.box.y+height*p.scale,p.anchor.y);
 }
 for(const tag of r.models){const id=attr(tag,'data-plot-policy');assert.match(r.chart,new RegExp('aria-label="Rank '+r.R.model.aggregateRank(id,'score')));}
 assert.match(r.chart,/target="_blank" rel="noopener noreferrer"/);assert.match(r.chart,/label-score/);
});
test('the orbit marks tactile entries from the modality field',()=>{
 const chart=renderer().chart;
 const callouts=Array.from(chart.matchAll(/<g class="moonshot-label\b[^>]*data-plot-policy="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g));
 const marked=callouts.filter(([, ,label])=>label.includes('class="label-variant label-tactile"')).map(([,id])=>id);
 assert.deepEqual(marked.sort(),['GR00T_N15_TACTILE','GR00T_N17_TACTILE','me-dex-1-5','unitacwam-v1']);
 assert.doesNotMatch(chart,/w\/o Tactile/i);
 assert.doesNotMatch(renderer(registry,1200,'policy','without-tactile').chart,/label-tactile/);
 assert.match(renderer(registry,1200,'agent').chart,/aria-label="Rank 1\. PyRUA-Dex[^"]*\+ Tactile/);
});
test('partial cards preserve both settings, their Full results and left-to-right budget order',()=>{
 const r=renderer(registry,1200,'agent');
 assert.match(r.chart,/aria-label="Agent ranking along the Score orbit"/);
 assert.equal(r.models.length,1);assert.equal(attr(r.rocket,'data-rocket-policy'),'pyrua-dex');
 assert.ok(r.reports.indexOf('gpt6_astra_1x_icl')<r.reports.indexOf('gpt6_astra_10x_icl'));
 assert.match(r.reports,/Score: NR/);for(const value of ['26.2%','48.8%','61.5%','72.5%'])assert.ok(r.reports.includes(value));
 assert.doesNotMatch(r.reports,/\stitle=/);assert.doesNotMatch(r.chart,/data-plot-policy="gpt6_astra/);
});
test('only policy targets show the inspector; track hover clears it',()=>{
 const r=renderer(),root=r.nodes.get('moonshot');
 root.events.pointerover({target:{closest:s=>s==='[data-plot-policy]'?{dataset:{plotPolicy:'GR00T_N17_TACTILE'}}:null}});
 assert.equal(r.nodes.get('moonshot-inspector').hidden,false);assert.match(r.nodes.get('moonshot-inspector').innerHTML,/Score/);
 root.events.pointerover({target:{closest:()=>null}});assert.equal(r.nodes.get('moonshot-inspector').hidden,true);
});

test('each connector is vertical or perpendicular to the orbit and ends at its logo',()=>{
 for(const width of [390,645,1200]){
  const g=renderer(registry,width).geometry;
  const directions=new Set();
  for(const p of g.labels){
   const projection=(x,y)=>(x-78)*(548/Math.hypot(1010,548))+(y-630)*(1010/Math.hypot(1010,548));
   for(const x of [p.box.x,p.box.x+p.box.w])for(const y of [p.box.y,p.box.y+p.box.h])assert.ok(projection(x,y)<0);
   close(p.anchor.x,p.logo.x);
   close(p.anchor.y,p.box.y+p.box.h);
   const dx=p.anchor.x-p.x,dy=p.anchor.y-p.y;
   assert.ok(dy<0);
   if(Math.abs(dx)<1e-8)directions.add('vertical');
   else{
    close(1010*dx-548*dy,0);
    directions.add('perpendicular');
   }
  }
  assert.equal(directions.size,2);
 }
});
test('modality views render vertical connectors where labels fit and use the orbit normal at the edge',()=>{
 const connectors=chart=>Array.from(chart.matchAll(/class="moonshot-connector"[^>]* d="M ([^ ]+) ([^ ]+) L ([^ ]+) ([^"]+)"/g),
  match=>match.slice(1).map(Number));
 for(const [scope,count] of [['without-tactile',9],['tactile',4]]){
  for(const width of [390,1200]){
   const r=renderer(registry,width,'policy',scope);
   const links=connectors(r.chart);
   assert.equal(links.length,count);
   for(const [x,y,anchorX,anchorY] of links){
    close(x,anchorX);
    assert.ok(anchorY<y);
   }
  }
 }
 const fixture=structuredClone(registry);
 const leader=fixture.policies.find(p=>p.model.id==='worldscape_policy_2_5-preview');
 Object.assign(leader.overall,{sr:90,lscr:90,efficiency:.9});
 const r=renderer(fixture,1200,'policy','without-tactile');
 const [[x,y,anchorX,anchorY]]=connectors(r.chart);
 assert.ok(anchorX<x);
 close(1010*(anchorX-x)-548*(anchorY-y),0);
});
test('labels follow Score rank up and to the right while ACT stays near its point',()=>{
 for(const width of [320,390,464,645,840,1200]){
  const g=renderer(registry,width).geometry;
  const act=g.labels.find(p=>p.policy.id==='ACT'),dp=g.labels.find(p=>p.policy.id==='DPC');
  const actLength=Math.hypot(act.x-act.anchor.x,act.y-act.anchor.y);
  const dpLength=Math.hypot(dp.x-dp.anchor.x,dp.y-dp.anchor.y);
  assert.ok(actLength<1.25*dpLength);
  for(const [index,p] of g.labels.entries()){
   assert.ok(Math.hypot(p.anchor.x-p.x,p.anchor.y-p.y)<210, p.policy.id+' connector is too long at '+width);
   assert.ok(Math.abs(p.logo.x-p.x)<32);close(p.anchor.x,p.logo.x);assert.ok(p.anchor.y<p.y);
   const higher=g.labels[index-1];
   if(higher){
    assert.ok(higher.logo.x>p.logo.x, p.policy.id+' is too far right at '+width);
    assert.ok(higher.logo.y<p.logo.y, p.policy.id+' is too high at '+width);
   }
  }
 }
});
