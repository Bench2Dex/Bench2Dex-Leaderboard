import {fullOnlyPolicy} from "./fixtures.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { toRuntimeData } from "../scripts/leaderboard-data.mjs";

const registry=JSON.parse(await readFile(new URL("../assets/data/leaderboard.json",import.meta.url),"utf8"));
const modelSource=await readFile(new URL("../assets/js/results-model.js",import.meta.url),"utf8");
const plotSource=await readFile(new URL("../assets/js/moonshot-model.js",import.meta.url),"utf8");
function plotApi(fixture=registry,mutateRuntime=()=>{}){
  const data=toRuntimeData(fixture);
  mutateRuntime(data);
  const context=vm.createContext({window:{BENCH:data}});
  vm.runInContext(modelSource,context);
  vm.runInContext(plotSource,context);
  return context.window.BenchResults.moonshot;
}
const plot=(...args)=>plotApi(...args).data;
function futurePolicy(id="FUTURE_POLICY",sr=22,lscr=40){
  const policy=structuredClone(registry.policies.find(entry=>entry.model.id==="ACT"));
  Object.assign(policy.model,{id,label:id,modelVersion:id,displayOrder:100});
  Object.assign(policy.overall,{sr,lscr});
  for(const channel of registry.channels){
    policy.overall.channelSr[channel]=sr;
    policy.overall.channelLscr[channel]=lscr;
  }
  for(const task of Object.values(policy.per_task)){
    Object.assign(task.mean,{sr,lscr});
    for(const channel of Object.values(task.channels)) Object.assign(channel,{successes:sr/2,lscr});
  }
  return policy;
}

test("the mean plot keeps maintained policies and orders Full-only reports by Full SR",()=>{
 const result=plot()("standard");assert.equal(result.totalTasks,26);assert.equal(result.plotted.length,7);assert.equal(result.unplotted.length,2);
 assert.deepEqual(Array.from(result.unplotted,e=>e.policy.id),["gpt6_astra_10x_icl","gpt6_astra_1x_icl"]);
 for(const [id,sr,lscr] of [["gpt6_astra_10x_icl",100*48/78,72.45726495726495],["gpt6_astra_1x_icl",100*68/260,48.76923076923077]]){
  const partial=result.unplotted.find(e=>e.policy.id===id);assert.ok(partial);assert.equal(partial.sr,null);assert.equal(partial.lscr,null);assert.equal(partial.fullSr,sr);assert.ok(Math.abs(partial.fullLscr-lscr)<1e-10);
 }
 assert.equal(result.plotted[0].policy.id,"GR00T_N17_TACTILE");assert.equal(result.plotted[0].sr,29.653846153846153);assert.equal(result.plotted[0].lscr,48.36528846153846);
 for(let i=1;i<result.plotted.length;i++)assert.ok(result.plotted[i-1].sr>=result.plotted[i].sr);
});
test("Full-only future submissions never substitute for means",()=>{
 const fixture=structuredClone(registry);fixture.policies.push(fullOnlyPolicy());
 for(const channel of ["mean","full"]){const r=plot(fixture)("standard",channel);assert.equal(r.plotted.some(e=>e.policy.id==="TEST_FULL_HIGH"),false);const e=r.unplotted.find(e=>e.policy.id==="TEST_FULL_HIGH");assert.equal(e.lscr,null);assert.equal(e.sr,channel==="mean"?null:80);}
});

test("new complete policies appear from registry data without a manual policy list",()=>{
  const fixture=structuredClone(registry);
  fixture.policies.push(futurePolicy());
  const result=plot(fixture)("standard");
  assert.equal(result.plotted.length,8);
  const entry=result.plotted.find(entry=>entry.policy.id==="FUTURE_POLICY");
  assert.equal(entry.sr,22);
  assert.equal(entry.lscr,40);
  assert.equal(entry.reason,"");
});

test("reported zeros are plotted while missing metrics remain null",()=>{
  const fixture=structuredClone(registry);
  fixture.policies=[futurePolicy("ZERO",0,0),futurePolicy("MISSING")];
  delete fixture.policies[1].overall.lscr;
  const {plotted,unplotted}=plot(fixture)("standard");
  assert.equal(plotted.length,1);
  assert.equal(plotted[0].sr,0);
  assert.equal(plotted[0].lscr,0);
  assert.equal(unplotted[0].lscr,null);
  assert.equal(unplotted[0].sr,22);
  assert.equal(unplotted[0].reason,"LSCR not reported");
});

test("channel selection uses that channel's metrics and eligibility",()=>{
  const read=plot();
  const entry=read("standard","none").plotted.find(entry=>entry.policy.id==="ACT");
  const source=registry.policies.find(entry=>entry.model.id==="ACT").overall;
  assert.equal(entry.sr,source.channelSr.None);
  assert.equal(entry.lscr,source.channelLscr.None);
  assert.notEqual(entry.sr,source.sr);

});

test("an incomplete task set cannot masquerade as an overall comparison",()=>{
  const fixture=structuredClone(registry);
  fixture.policies=[futurePolicy()];
  delete fixture.policies[0].per_task[registry.tasks[0].id];
  for(const channel of ["mean","none"]){
    const {plotted,unplotted}=plot(fixture)("standard",channel);
    assert.equal(plotted.length,0);
    assert.equal(unplotted[0].sr,22);
    assert.equal(unplotted[0].lscr,40);
    assert.equal(unplotted[0].srCoverage,25);
    assert.equal(unplotted[0].lscrCoverage,25);
    assert.equal(unplotted[0].reason,"Incomplete task coverage");
  }
});

test("groups remain isolated and ties have deterministic score then label ordering",()=>{
  const fixture=structuredClone(registry);
  fixture.protocols.push({...structuredClone(fixture.protocols[0]),id:"alternate"});
  fixture.policies=[futurePolicy("Zulu",22,42),futurePolicy("Alpha",22,42),futurePolicy("HigherLSCR",22,44),futurePolicy("OtherGroup",80,90)];
  fixture.policies.at(-1).model.protocolId="alternate";
  const read=plot(fixture);
  assert.deepEqual(Array.from(read("standard").plotted,entry=>entry.policy.id),["HigherLSCR","Alpha","Zulu"]);
  assert.deepEqual(Array.from(read("alternate").plotted,entry=>entry.policy.id),["OtherGroup"]);
  assert.throws(()=>read("unknown"),/Unknown moonshot evaluation group/);
  assert.throws(()=>read("standard","cov_only"),/Unknown moonshot channel/);
});

test("invalid runtime coordinates are excluded rather than clipped to the axes",()=>{
  const read=plot(registry,data=>{
    const summary=data.EVALUATION_SUMMARIES.find(entry=>entry.policyId==="ACT");
    summary.sr=101;
  });
  const entry=read("standard").unplotted.find(entry=>entry.policy.id==="ACT");
  assert.equal(entry.sr,101);
  assert.equal(entry.reason,"Scores outside 0–100%");
});

test("the rocket follows the eligible mean SR leader, excluding higher Full-only scores",()=>{
  const leader=plotApi().leader("standard");
  assert.equal(leader.policy.id,"GR00T_N17_TACTILE");
  assert.equal(leader.sr,29.653846153846153);
  assert.equal(leader.lscr,48.36528846153846);
  assert.ok(fullOnlyPolicy().overall.channelSr.Full>leader.sr);
});

test("lower or incomplete new submissions do not move the rocket",()=>{
  const fixture=structuredClone(registry);
  const missing=futurePolicy("HIGH_BUT_MISSING",90,95);
  delete missing.overall.lscr;
  fixture.policies.push(futurePolicy("LOWER",22,40),missing);
  const leader=plotApi(fixture).leader("standard");
  assert.equal(leader.policy.id,"GR00T_N17_TACTILE");
  assert.equal(leader.sr,29.653846153846153);
  assert.equal(leader.lscr,48.36528846153846);
});

test("a stronger complete policy becomes the new rocket anchor",()=>{
  const fixture=structuredClone(registry);
  fixture.policies.push(futurePolicy("NEW_LEADER",60,80));
  const leader=plotApi(fixture).leader("standard");
  assert.equal(leader.policy.id,"NEW_LEADER");
  assert.equal(leader.sr,60);
  assert.equal(leader.lscr,80);
});

test("rocket score ties use LSCR then a stable model name without depending on display order",()=>{
  const fixture=structuredClone(registry);
  fixture.policies=[futurePolicy("Zulu",60,80),futurePolicy("Alpha",60,80),futurePolicy("LowerLSCR",60,78)];
  assert.equal(plotApi(fixture).leader("standard").policy.id,"Alpha");
  fixture.policies.reverse();
  fixture.policies.forEach((entry,index)=>entry.model.displayOrder=index);
  assert.equal(plotApi(fixture).leader("standard").policy.id,"Alpha");
});

test("rocket selection remains a mean result after other channel reads and returns null without complete results",()=>{
  const api=plotApi();
  const before=api.leader("standard");
  api.data("standard","full").plotted.reverse();
  api.data("standard","none").plotted.sort((a,b)=>a.lscr-b.lscr);
  assert.deepEqual(api.leader("standard"),before);
  const fixture=structuredClone(registry);
  fixture.policies=[fullOnlyPolicy()];
  assert.equal(plotApi(fixture).leader("standard"),null);
});
