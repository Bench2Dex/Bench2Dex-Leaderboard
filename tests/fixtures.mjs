import { readFile } from 'node:fs/promises';
export const registry=JSON.parse(await readFile(new URL('../assets/data/leaderboard.json',import.meta.url),'utf8'));
export function fullOnlyPolicy(id='TEST_FULL_HIGH',sr=80){
  const p=structuredClone(registry.policies.find(p=>p.model.id==='ACT'));
  Object.assign(p.model,{id,label:'Example Agent',modelVersion:'Example Agent',family:'Example',variantLabel:id.endsWith('HIGH')?'extended':'standard',displayOrder:100,externalReport:true,episodesPerChannel:50,sourceUrl:'https://example.org/evaluation'});
  p.overall={taskCount:26,scope:'task-macro',status:'reported',sr:null,lscr:null,efficiency:null,channelSr:Object.fromEntries(registry.channels.map(c=>[c,c==='Full'?sr:null])),channelTaskCounts:Object.fromEntries(registry.channels.map(c=>[c,c==='Full'?26:0]))};
  p.per_task=Object.fromEntries(registry.tasks.map(t=>[t.id,{channels:Object.fromEntries(registry.channels.map(c=>[c,c==='Full'?{status:'reported',episodes:50,successes:sr/2,lscr:null}:{status:'not-reported',episodes:null,successes:null,lscr:null}])),mean:{status:'not-reported',sr:null,lscr:null,efficiency:null}}]));
  return p;
}
