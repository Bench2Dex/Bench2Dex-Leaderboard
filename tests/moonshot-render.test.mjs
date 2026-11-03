import {fullOnlyPolicy} from "./fixtures.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { toRuntimeData } from "../scripts/leaderboard-data.mjs";

const registry=JSON.parse(await readFile(new URL("../assets/data/leaderboard.json",import.meta.url),"utf8"));
const sources=await Promise.all(["results-model","overall-table","moonshot-model","moonshot"].map(name=>
  readFile(new URL(`../assets/js/${name}.js`,import.meta.url),"utf8")
));
const attr=(tag,name)=>tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const position=tag=>attr(tag,"transform").match(/^translate\(([^)]+)\)/)[1].trim().split(/[ ,]+/).map(Number);
const scorePosition=tag=>[Number(attr(tag,"data-score-x")),Number(attr(tag,"data-score-y"))];
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);

// Render the actual UI against small DOM sinks; browser tests cover interaction/layout.
function renderer(fixture=registry,viewportWidth=1200){
  const nodes=new Map();
  const document={
    getElementById(id){
      if(!nodes.has(id))nodes.set(id,{innerHTML:"",textContent:"",value:"",style:{},getBoundingClientRect(){return id==="moonshot"||id==="moonshot-chart" ? {width:viewportWidth} : {width:170,height:54};},events:{},addEventListener(type,listener){this.events[type]=listener;},querySelectorAll(){return [];}});
      return nodes.get(id);
    },
    dispatchEvent(){}
  };
  const context=vm.createContext({window:{BENCH:toRuntimeData(fixture)},document});
  for(const source of sources)vm.runInContext(source,context);
  return legacyChannel=>{
    context.window.BenchResults.moonshot.render("standard",legacyChannel);
    const chart=document.getElementById("moonshot-chart").innerHTML;
    const cards=Array.from(document.getElementById("moonshot-unplotted").innerHTML.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g),match=>match[0]);
    return {
      chart,
      models:Array.from(chart.matchAll(/<g class="moonshot-label\b[^"\n]*"[^>]*>/g),match=>match[0]),
      rocket:chart.match(/<g class="moonshot-rocket"[^>]*>/)?.[0],
      hover({policy=null,axis=null,popup=false}={}){
        document.getElementById("moonshot").events.pointerover({target:{closest(selector){
          if(selector==='[data-plot-policy]' && policy)return {dataset:{plotPolicy:policy}};
          if(selector==='[data-plot-axis]' && axis)return {dataset:{plotAxis:axis}};
          if(selector==='#moonshot-inspector' && popup)return {};
          return null;
        }}});
        return {policyVisible:!document.getElementById("moonshot-inspector").hidden,axisVisible:!document.getElementById("moonshot-axis-tooltip").hidden,axisText:document.getElementById("moonshot-axis-tooltip").innerHTML};
      },
      card:(name,variant="")=>{
        const html=cards.find(card=>card.includes(name) && card.includes(variant));
        assert.ok(html,`Expected an unplotted card for ${name} ${variant}`);
        return html.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
      }
    };
  };
}

function strongerFixture(){
  const fixture=structuredClone(registry);
  const policy=structuredClone(fixture.policies.find(entry=>entry.model.id==="ACT"));
  Object.assign(policy.model,{id:"FUTURE_LEADER",label:"Future Leader",modelVersion:"Future Leader",displayOrder:100});
  Object.assign(policy.overall,{sr:60,lscr:80});
  for(const channel of fixture.channels){policy.overall.channelSr[channel]=60;policy.overall.channelLscr[channel]=80;}
  for(const task of Object.values(policy.per_task)){
    Object.assign(task.mean,{sr:60,lscr:80});
    for(const channel of Object.values(task.channels))Object.assign(channel,{successes:30,lscr:80});
  }
  fixture.policies.push(policy);
  return fixture;
}

test("models retain exact mean-score anchors with linked annotations",()=>{
  const {chart,models}=renderer()();
  assert.equal(models.length,7);
  assert.equal(Array.from(chart.matchAll(/<g class="moonshot-point\b/g)).length,7);
  assert.equal(Array.from(chart.matchAll(/<path class="moonshot-connector"/g)).length,7);
  assert.match(chart,/viewBox="0 0 1200 690"/);
  assert.match(chart,/<path class="moonshot-axis" d="M78 77 V630 H1094"/);
  assert.match(chart,/<path class="moonshot-path" d="M 78 630 C /);
  assert.match(chart,/Horizontal axis: stable success rate \(SR\)/);
  assert.match(chart,/Vertical axis: latched stage completion rate \(LSCR\)/);
  for(const tag of models){
    const source=registry.policies.find(entry=>entry.model.id===attr(tag,"data-plot-policy")).overall;
    const [px,py]=scorePosition(tag);
    close(px,78+source.sr*1010/100);
    close(py,630-source.lscr*548/100);
    close(Number(attr(tag,"data-sr")),source.sr);
    close(Number(attr(tag,"data-lscr")),source.lscr);
  }
});

test("metric explanations belong only to axis labels, without a native tooltip over the plot",()=>{
  const {chart}=renderer()();
  assert.match(chart,/<p class="sr-only" id="moonshot-plot-desc">Horizontal axis:/);
  assert.match(chart,/<svg\b[^>]*aria-label="Policy success rate versus stage completion"[^>]*aria-describedby="moonshot-plot-desc"/);
  const axes=Array.from(chart.matchAll(/<text class="moonshot-axis-label"[^>]*>[\s\S]*?<\/text>/g),match=>match[0]);
  assert.equal(axes.length,2);
  for(const axis of axes){
    assert.match(axis,/tabindex="0"/);
    assert.match(axis,/aria-label="(?:LSCR: Latched Stage Completion Rate|SR: Stable Success Rate)/);
    assert.match(axis,/aria-describedby="moonshot-axis-tooltip"/);
  }
  const plotWithoutAxes=chart.replace(/<text class="moonshot-axis-label"[^>]*>[\s\S]*?<\/text>/g,"");
  assert.doesNotMatch(plotWithoutAxes,/<title\b|<desc\b/);
});

test("axis hints show only on axes and clear over the trajectory or empty plot",()=>{
  const view=renderer()();
  assert.equal(view.hover({policy:"GR00T_N17_TACTILE"}).policyVisible,true);
  const axis=view.hover({axis:"sr"});
  assert.equal(axis.policyVisible,false);
  assert.equal(axis.axisVisible,true);
  assert.match(axis.axisText,/Stable Success Rate/);
  assert.deepEqual(view.hover(),{policyVisible:false,axisVisible:false,axisText:axis.axisText});
  assert.equal(view.hover({axis:"lscr"}).axisVisible,true);
  const policy=view.hover({policy:"GR00T_N17_TACTILE"});
  assert.equal(policy.policyVisible,true);
  assert.equal(policy.axisVisible,false);
});

test("the 100/100 flight endpoint lands inside the visible lunar surface",()=>{
  const {chart}=renderer()();
  const target=chart.match(/<g class="moonshot-target"[^>]*>/)[0];
  const mx=Number(attr(target,"data-moon-x")),my=Number(attr(target,"data-moon-y")),radius=Number(attr(target,"data-moon-radius"));
  const lx=Number(attr(target,"data-landing-x")),ly=Number(attr(target,"data-landing-y"));
  assert.ok(lx<mx && ly>my);
  assert.ok(Math.hypot(lx-mx,ly-my)<radius*.9);
  const flight=chart.match(/<path class="moonshot-path-future"[^>]*>/)[0];
  assert.ok(attr(flight,"d").endsWith(`${lx} ${ly}`));
});

test("the rocket nose marks the leading maintained policy's coordinate without animation or timers",()=>{
  const {chart,rocket,models}=renderer()();
  assert.equal(attr(rocket,"data-rocket-policy"),"GR00T_N17_TACTILE");
  const [px,py]=scorePosition(models.find(tag=>attr(tag,"data-plot-policy")==="GR00T_N17_TACTILE"));
  const rx=Number(attr(rocket,"data-rocket-x")),ry=Number(attr(rocket,"data-rocket-y"));
  close(rx,px);close(ry,py);
  assert.equal(attr(rocket,"data-rocket-anchor"),"nose");
  const sprite=chart.match(/<g class="moonshot-rocket"[^>]*>\s*(<image\b[^>]*>)/)[1];
  close(Number(attr(sprite,"x"))+Number(attr(sprite,"width")),0);
  assert.equal(attr(sprite,"href"),"assets/img/moonshot-rocket-premium.webp");
  assert.doesNotMatch(chart,/<animate|\banimation\s*=|offset-path/);
  assert.doesNotMatch(sources.at(-1),/\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/);
});

test("publishing a stronger complete result advances the rocket anchor and its model identity",()=>{
  const oldView=renderer()(),newView=renderer(strongerFixture())();
  assert.equal(attr(newView.rocket,"data-rocket-policy"),"FUTURE_LEADER");
  assert.match(attr(newView.rocket,"aria-label"),/Future Leader/);
  const rx=Number(attr(newView.rocket,"data-rocket-x")),ry=Number(attr(newView.rocket,"data-rocket-y"));
  const oldX=Number(attr(oldView.rocket,"data-rocket-x")),oldY=Number(attr(oldView.rocket,"data-rocket-y"));
  assert.ok(rx>oldX && ry<oldY);
  assert.ok(Math.hypot(1088-rx,82-ry)<Math.hypot(1088-oldX,82-oldY));
  const point=newView.models.find(tag=>attr(tag,"data-plot-policy")==="FUTURE_LEADER");
  close(Number(attr(point,"data-sr")),60);close(Number(attr(point,"data-lscr")),80);
});

test("zero and boundary scores keep the nose on the data point and the sprite inside the plot",()=>{
  for(const [sr,lscr] of [[0,0],[0,100],[100,0]]){
    const fixture=strongerFixture(),policy=fixture.policies.at(-1);
    fixture.policies=[policy];
    Object.assign(policy.overall,{sr,lscr});
    for(const channel of fixture.channels){policy.overall.channelSr[channel]=sr;policy.overall.channelLscr[channel]=lscr;}
    for(const task of Object.values(policy.per_task)){
      Object.assign(task.mean,{sr,lscr});
      for(const channel of Object.values(task.channels))Object.assign(channel,{successes:sr/2,lscr});
    }
    const view=renderer(fixture)(),[rx,ry]=position(view.rocket);
    assert.deepEqual([rx,ry],scorePosition(view.models[0]));
    const angle=Number(attr(view.rocket,"transform").match(/rotate\(([^)]+)\)/)[1])*Math.PI/180;
    const sprite=view.chart.match(/<g class="moonshot-rocket"[^>]*>\s*(<image\b[^>]*>)/)[1];
    const ix=Number(attr(sprite,"x")),iy=Number(attr(sprite,"y")),w=Number(attr(sprite,"width")),h=Number(attr(sprite,"height"));
    for(const dx of [ix,ix+w])for(const dy of [iy,iy+h]){
      const px=rx+dx*Math.cos(angle)-dy*Math.sin(angle),py=ry+dx*Math.sin(angle)+dy*Math.cos(angle);
      assert.ok(px>=0 && px<=1200 && py>=0 && py<=690);
    }
  }
});

test("a future 100/100 leader keeps the rocket inside the canvas and transfers every leader marker",()=>{
  const fixture=strongerFixture(),policy=fixture.policies.at(-1);
  Object.assign(policy.overall,{sr:100,lscr:100});
  for(const channel of fixture.channels){policy.overall.channelSr[channel]=100;policy.overall.channelLscr[channel]=100;}
  for(const task of Object.values(policy.per_task)){
    Object.assign(task.mean,{sr:100,lscr:100});
    for(const channel of Object.values(task.channels))Object.assign(channel,{successes:50,lscr:100});
  }
  const oldView=renderer()(),view=renderer(fixture)();
  assert.equal(attr(oldView.models.find(tag=>attr(tag,"data-leading")==="true"),"data-plot-policy"),"GR00T_N17_TACTILE");
  assert.equal(attr(view.rocket,"data-rocket-policy"),"FUTURE_LEADER");
  assert.doesNotMatch(view.chart,/\b(?:NaN|undefined|Infinity)\b/);
  const leaders=view.models.filter(tag=>attr(tag,"data-leading")==="true");
  assert.equal(leaders.length,1);
  assert.equal(attr(leaders[0],"data-plot-policy"),"FUTURE_LEADER");
  assert.deepEqual(scorePosition(leaders[0]),[1088,82]);
  const leadingCallouts=Array.from(view.chart.matchAll(/<g class="moonshot-label is-leading[^"\n]*"[^>]*>[\s\S]*?<\/g>/g),match=>match[0]);
  assert.equal(leadingCallouts.length,1);
  assert.equal(attr(leadingCallouts[0],"data-plot-policy"),"FUTURE_LEADER");
  assert.doesNotMatch(view.chart,/moonshot-leader-card/);

  const canvas=view.chart.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  assert.deepEqual(canvas,[0,0,1200,690]);
  const [rx,ry]=position(view.rocket);
  const angle=Number(attr(view.rocket,"transform").match(/rotate\(([^)]+)\)/)[1])*Math.PI/180;
  const rocketImage=view.chart.match(/<g class="moonshot-rocket"[^>]*>\s*(<image\b[^>]*>)/)[1];
  const ix=Number(attr(rocketImage,"x")),iy=Number(attr(rocketImage,"y"));
  const width=Number(attr(rocketImage,"width")),height=Number(attr(rocketImage,"height"));
  assert.ok([rx,ry,angle,ix,iy,width,height].every(Number.isFinite));
  // Check all four transformed image corners, not only its anchor.
  for(const dx of [ix,ix+width])for(const dy of [iy,iy+height]){
    const px=rx+dx*Math.cos(angle)-dy*Math.sin(angle),py=ry+dx*Math.sin(angle)+dy*Math.cos(angle);
    assert.ok(px>=canvas[0] && px<=canvas[0]+canvas[2],`Rocket x ${px} outside the canvas`);
    assert.ok(py>=canvas[1] && py<=canvas[1]+canvas[3],`Rocket y ${py} outside the canvas`);
  }
});

test("future Full-only reports retain explicit missing means",()=>{
 const fixture=structuredClone(registry);fixture.policies.push(fullOnlyPolicy("TEST_FULL_HIGH",80),fullOnlyPolicy("TEST_FULL_LOW",20));
 const view=renderer(fixture)();
 for(const [variant,score] of [["extended","80.0%"],["standard","20.0%"]]){const card=view.card("Example Agent",variant);assert.match(card,/Mean SR: NR; Mean LSCR: NR/);assert.ok(card.includes("Full SR "+score));}
 assert.doesNotMatch(view.chart,/data-plot-policy="TEST_FULL_/);
});

test("partial task coverage is disclosed and cannot anchor a rocket or plot a point",()=>{
  const fixture=structuredClone(registry);
  fixture.policies=[fixture.policies.find(entry=>entry.model.id==="ACT")];
  delete fixture.policies[0].per_task[fixture.tasks[0].id];
  const view=renderer(fixture)(),card=view.card("ACT");
  assert.match(card,/Mean · SR 25\/26, LSCR 25\/26 tasks/);
  assert.match(card,/Mean SR 18\.1%/);
  assert.equal(view.models.length,0);
  assert.equal(view.rocket,undefined);
});

test("policy callouts contain concise names and logos linked to each model website",()=>{
  const {chart}=renderer()();
  const callouts=Array.from(chart.matchAll(/<g class="moonshot-label\b[^"\n]*"[^>]*>[\s\S]*?<\/g>/g),match=>match[0]);
  assert.equal(callouts.length,7);
  for(const callout of callouts){
    const policy=registry.policies.find(entry=>entry.model.id===attr(callout,"data-plot-policy"));
    assert.equal(attr(callout,"href"),policy.model.modelUrl);
    assert.match(callout,/<a\b[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
    assert.match(callout,/<image\b/);
    assert.equal(Array.from(callout.matchAll(/<text\b/g)).length,2);
    const rank=Number(attr(callout,"data-rank"));
    assert.match(callout,new RegExp(`<text class="label-rank"[^>]*>#${rank}</text>`));
    const logo=callout.match(/<image class="label-logo-image"[^>]*>/)[0],text=callout.match(/<text class="label-name"[^>]*>/)[0];
    assert.ok(Number(attr(text,"x"))>Number(attr(logo,"x"))+Number(attr(logo,"width")));
    assert.notEqual(attr(text,"text-anchor"),"end");
    assert.doesNotMatch(callout,/label-panel|label-values/);
    assert.doesNotMatch(callout.replace(/<[^>]*>/g,""),/\d+(?:\.\d+)?%/);
  }
});

function modelBoxes(chart){
  return Array.from(chart.matchAll(/<g class="moonshot-label\b[^"\n]*"[^>]*>[\s\S]*?<\/g>/g),match=>{
    const [x,y]=position(match[0]),rect=match[0].match(/<rect\b[^>]*>/)[0],scale=Number(attr(match[0],"data-label-scale"));
    return {id:attr(match[0],"data-plot-policy"),x,y,w:Number(attr(rect,"width"))*scale,h:Number(attr(rect,"height"))*scale,scale};
  });
}
const boxesOverlap=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;

test("annotation units avoid each other while true-score dots stay fixed",()=>{
  const {chart,models}=renderer()(),labels=modelBoxes(chart);
  for(let i=0;i<labels.length;i++){
    for(let j=i+1;j<labels.length;j++)assert.equal(boxesOverlap(labels[i],labels[j]),false);
    const label=labels[i],model=models.find(p=>attr(p,"data-plot-policy")===label.id),[px,py]=scorePosition(model);
    const dot=Array.from(chart.matchAll(/<g class="moonshot-point\b[^>]*>/g),m=>m[0]).find(t=>attr(t,"data-plot-policy")===label.id);
    close(Number(attr(dot,"data-point-x")),px);close(Number(attr(dot,"data-point-y")),py);
  }
  assert.doesNotMatch(chart,/class="moonshot-leader(?:s)?"|data-leader=|moonshot-guide/);
});

test("mobile logos and names remain visible, scaled and collision-free",()=>{
  for(const width of [400,540]){
    const {chart,models}=renderer(registry,width)(),boxes=modelBoxes(chart);
    assert.equal(models.length,7);
    assert.ok(boxes.every(b=>b.scale>1 && b.x>=0 && b.y>=0 && b.x+b.w<=1200 && b.y+b.h<=690));
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.equal(boxesOverlap(boxes[i],boxes[j]),false);
  }
});

test("the markers preserve SR and LSCR values at every tested width",()=>{
  for(const width of [400,540,675,840,1200]){
    const {chart}=renderer(registry,width)();
    const dots=Array.from(chart.matchAll(/<g class="moonshot-point\b[^>]*>/g),m=>m[0]);
    for(const d of dots){const p=registry.policies.find(p=>p.model.id===attr(d,"data-plot-policy"));close(Number(attr(d,"data-point-x")),78+p.overall.sr*10.1);close(Number(attr(d,"data-point-y")),630-p.overall.lscr*5.48);}
  }
});

test("legacy channel arguments cannot change the figure's fixed mean comparison",()=>{
  const render=renderer(),initial=render("mean");
  for(const channel of ["none","equi","inv","full"]){
    const view=render(channel);
    assert.equal(view.chart,initial.chart);
    assert.equal(view.models.length,7);
    assert.equal(attr(view.rocket,"data-rocket-policy"),"GR00T_N17_TACTILE");
    assert.doesNotMatch(view.chart,/\b(?:NaN|undefined|Infinity)\b/);
  }
});

test("the top three eligible SR results share the podium treatment as rankings change",()=>{
  for(const fixture of [registry,strongerFixture()]){
    const {models}=renderer(fixture)();
    const podium=models.filter(tag=>attr(tag,"class").split(" ").includes("is-podium"));
    assert.deepEqual(podium,models.slice(0,3));
    assert.deepEqual(podium.map(tag=>Number(attr(tag,"data-rank"))),[1,2,3]);
  }
});

test("the leader's exact marker remains at the rocket nose",()=>{
  for(const fixture of [registry,strongerFixture()])for(const width of [400,675,1200]){
    const {chart,rocket}=renderer(fixture,width)();
    const point=Array.from(chart.matchAll(/<g class="moonshot-point\b[^>]*>/g),m=>m[0]).find(t=>attr(t,"data-plot-policy")===attr(rocket,"data-rocket-policy"));
    close(Number(attr(point,"data-point-x")),Number(attr(rocket,"data-rocket-x")));close(Number(attr(point,"data-point-y")),Number(attr(rocket,"data-rocket-y")));
  }
});

test("axis titles sit above the vertical arrow and to the right of the horizontal arrow",()=>{
  const {chart}=renderer()();
  const axes=Array.from(chart.matchAll(/<text class="moonshot-axis-label"[^>]*>/g),match=>match[0]);
  const sr=axes.find(tag=>attr(tag,"data-plot-axis")==="sr"),lscr=axes.find(tag=>attr(tag,"data-plot-axis")==="lscr");
  assert.ok(Number(attr(sr,"x"))>1094);
  assert.equal(Number(attr(sr,"y")),630);
  assert.equal(attr(sr,"dominant-baseline"),"middle");
  assert.equal(Number(attr(lscr,"x")),78);
  assert.ok(Number(attr(lscr,"y"))<77);
  assert.equal(attr(lscr,"text-anchor"),"middle");
});

test("annotations use deterministic short straight leaders and retain meaningful score order",()=>{
  for(const width of [400,675,1200]){
    const v=renderer(registry,width)(),again=renderer(registry,width)();assert.equal(v.chart,again.chart);
    const links=Array.from(v.chart.matchAll(/<path class="moonshot-connector"[^>]*>/g),m=>m[0]);
    for(const link of links){const d=attr(link,'d');assert.match(d,/^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);const values=d.match(/[\d.]+/g).map(Number);const label=v.models.find(t=>attr(t,'data-plot-policy')===attr(link,'data-link-policy'));assert.ok(Math.hypot(values[2]-values[0],values[3]-values[1])<=120*Number(attr(label,'data-label-scale')));}
    assert.deepEqual(v.models.map(t=>Number(attr(t,'data-rank'))),[1,2,3,4,5,6,7]);
    for(let i=1;i<v.models.length;i++){
      const higher=v.models[i-1],lower=v.models[i];
      assert.ok(Number(attr(higher,'data-logo-x'))>Number(attr(lower,'data-logo-x')),
        'Higher SR must stay to the right at every viewport: '+attr(higher,'data-plot-policy')+' / '+attr(lower,'data-plot-policy'));
    }
  }
});

test("labels and popups keep clear of the rocket body",()=>{
  for(const fixture of [registry,strongerFixture(),(()=>{const f=strongerFixture(),p=f.policies.at(-1);Object.assign(p.overall,{sr:100,lscr:100});for(const c of f.channels){p.overall.channelSr[c]=100;p.overall.channelLscr[c]=100;}for(const task of Object.values(p.per_task)){Object.assign(task.mean,{sr:100,lscr:100});for(const c of Object.values(task.channels))Object.assign(c,{successes:50,lscr:100});}return f;})()])for(const width of [400,675,1200]){
    const view=renderer(fixture,width)(),ship=view.chart.match(/<g class="moonshot-rocket"[^>]*>\s*(<image\b[^>]*>)/)[1];
    const [rx,ry]=position(view.rocket),angle=Number(attr(view.rocket,'transform').match(/rotate\(([^)]+)\)/)[1])*Math.PI/180;
    const ix=Number(attr(ship,'x')),iy=Number(attr(ship,'y')),w=Number(attr(ship,'width')),h=Number(attr(ship,'height'));
    const corners=[ix,ix+w].flatMap(x=>[iy,iy+h].map(y=>({x:rx+x*Math.cos(angle)-y*Math.sin(angle),y:ry+x*Math.sin(angle)+y*Math.cos(angle)})));
    const b={x:Math.min(...corners.map(p=>p.x)),y:Math.min(...corners.map(p=>p.y)),w:Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)),h:Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y))};
    for(const label of modelBoxes(view.chart))assert.equal(boxesOverlap(label,b),false,label.id+' obscures the rocket');
    assert.equal(view.hover({policy:attr(view.rocket,'data-rocket-policy')}).policyVisible,true);
  }
});


test("visible SR ranks match Overall Performance for ties and policies missing LSCR",()=>{
  const tied=structuredClone(registry),copy=structuredClone(tied.policies.find(p=>p.model.id==="PI05"));
  Object.assign(copy.model,{id:"TIED_SR",label:"Tied SR",modelVersion:"Tied SR"});tied.policies.push(copy);
  const tieView=renderer(tied)();
  const rank=(view,id)=>Number(attr(view.models.find(t=>attr(t,"data-plot-policy")===id),"data-rank"));
  assert.equal(rank(tieView,"PI05"),2);assert.equal(rank(tieView,"TIED_SR"),2);assert.equal(rank(tieView,"GR00T_N17"),4);
  const missing=strongerFixture(),future=missing.policies.at(-1);future.overall.lscr=null;
  for(const channel of missing.channels)future.overall.channelLscr[channel]=null;
  for(const task of Object.values(future.per_task)){task.mean.lscr=null;for(const channel of Object.values(task.channels))channel.lscr=null;}
  const view=renderer(missing)();
  assert.equal(view.models.length,7);assert.equal(rank(view,"GR00T_N17_TACTILE"),2);
  assert.doesNotMatch(view.chart,/data-plot-policy="FUTURE_LEADER"/);
});


test("horizontal rank order survives new results, ties and boundary scores",()=>{
  const tied=structuredClone(registry),copy=structuredClone(tied.policies.find(p=>p.model.id==="PI05"));
  Object.assign(copy.model,{id:"TIED_SR",label:"Tied SR",modelVersion:"Tied SR"});tied.policies.push(copy);
  const boundary=strongerFixture(),p=boundary.policies.at(-1);Object.assign(p.overall,{sr:100,lscr:100});
  for(const c of boundary.channels){p.overall.channelSr[c]=100;p.overall.channelLscr[c]=100;}
  for(const task of Object.values(p.per_task)){Object.assign(task.mean,{sr:100,lscr:100});for(const c of Object.values(task.channels))Object.assign(c,{successes:50,lscr:100});}
  for(const fixture of [registry,strongerFixture(),tied,boundary])for(const width of [400,540,675,840,1200]){
    const {models}=renderer(fixture,width)();
    for(let i=1;i<models.length;i++){
      const a=models[i-1],b=models[i],ax=Number(attr(a,"data-logo-x")),bx=Number(attr(b,"data-logo-x"));
      if(Number(attr(a,"data-sr"))===Number(attr(b,"data-sr")))close(ax,bx);
      else assert.ok(ax>bx,attr(a,"data-plot-policy")+" must be right of "+attr(b,"data-plot-policy")+" at "+width);
    }
  }
});


test("very narrow containers retain every model and strict SR order",()=>{
  for(const width of [20,180,280]){
    const view=renderer(registry,width)();assert.equal(view.models.length,7);
    assert.doesNotMatch(view.chart,/\b(?:NaN|undefined|Infinity)\b/);
    for(let i=1;i<view.models.length;i++)assert.ok(Number(attr(view.models[i-1],"data-logo-x"))>Number(attr(view.models[i],"data-logo-x")));
  }
});
