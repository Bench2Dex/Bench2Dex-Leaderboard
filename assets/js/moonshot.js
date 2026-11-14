/* A single score axis, from Earth to the Moon. The rocket tracks published data. */
(function(){
  "use strict";
  const root=document.getElementById("moonshot");if(!root)return;
  const R=window.BenchResults,M=R.model,esc=R.escape,api=R.moonshot,$=id=>document.getElementById(id);
  const frame={width:1200,height:690},start={x:78,y:630},end={x:1088,y:82};
  const labelHeight=26;
  const length=Math.hypot(end.x-start.x,end.y-start.y),tangent={x:(end.x-start.x)/length,y:(end.y-start.y)/length};
  const normal={x:-tangent.y,y:tangent.x},angle=Math.atan2(tangent.y,tangent.x)*180/Math.PI;
  const percent=v=>Number.isFinite(v)?`${v.toFixed(1)}%`:"NR",fixed=v=>Number.isFinite(v)?v.toFixed(2):"NR",ratio=v=>Number.isFinite(v)?v.toFixed(3):"NR";
  const title=p=>R.policyName(p)+(p.variantLabel?" · "+p.variantLabel:"");
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const pad=(b,n)=>({x:b.x-n,y:b.y-n,w:b.w+2*n,h:b.h+2*n});
  let current=null,geometry=null,groupKey="",activeId=null;
  function rocketAt(point){
    const width=100,height=28.125,noseY=16.09375,radians=angle*Math.PI/180;
    const corners=[-width,0].flatMap(x=>[-noseY,height-noseY].map(y=>({x:x*Math.cos(radians)-y*Math.sin(radians),y:x*Math.sin(radians)+y*Math.cos(radians)})));
    let scale=1;
    for(const c of corners){
      if(c.x<0)scale=Math.min(scale,(point.x-8)/-c.x);else if(c.x>0)scale=Math.min(scale,(frame.width-8-point.x)/c.x);
      if(c.y<0)scale=Math.min(scale,(point.y-8)/-c.y);else if(c.y>0)scale=Math.min(scale,(frame.height-8-point.y)/c.y);
    }
    const minX=Math.min(...corners.map(c=>c.x))*scale,maxX=Math.max(...corners.map(c=>c.x))*scale,minY=Math.min(...corners.map(c=>c.y))*scale,maxY=Math.max(...corners.map(c=>c.y))*scale;
    return {...point,angle,width:width*scale,height:height*scale,noseY:noseY*scale,box:{x:point.x+minX,y:point.y+minY,w:maxX-minX,h:maxY-minY}};
  }
  function layout(entries,viewport=1200){
    // Scores use a 0–100 reference scale; faster-than-expert results stay uncapped.
    const maximum=Math.max(100,Math.ceil((entries[0]?.score||0)/10)*10);
    const point=score=>({x:start.x+(end.x-start.x)*score/maximum,y:start.y+(end.y-start.y)*score/maximum});
    const points=entries.map(e=>({...e,...point(e.score),rank:M.aggregateRank(e.policy.id,"score"),variant:e.policy.variantLabel==="w/ Tactile"?" + Tactile":e.policy.variantLabel&&e.policy.variantLabel!=="w/o Tactile"?" "+e.policy.variantLabel:""}));
    const rocket=points.length?rocketAt(points[0]):null;
    const initialScale=Math.min(1.05,Math.max(1,frame.width/Math.max(320,viewport)*.85));
    const axisSlope=tangent.y/tangent.x,connectorSlopes=[0,-normal.x/normal.y];
    let placed=[];
    for(let attempt=0;attempt<16;attempt++){
      const scale=initialScale*.94**attempt,gap=2*scale,h=labelHeight*scale;
      const ship=rocket?pad(rocket.box,6*scale):null;
      placed=[];
      // Place lower ranks first and find the shortest clear path on either ray.
      for(const p of [...points].reverse()){
        const below=placed.at(-1)?.box;
        const w=(66+R.policyName(p.policy).length*6.8+p.variant.length*5.3)*scale;
        const logoOffset=35*scale,xAtPoint=p.x-logoOffset;
        const minX=below?.x??14,maxX=frame.width-14-w;
        const obstacles=placed.map(label=>pad(label.box,gap));
        if(ship)obstacles.push(ship);
        let best;
        for(const slope of connectorSlopes){
          // Keep the right edge of the label above the axis as the box moves up.
          let rise=Math.max(14*scale,(5*scale-(w-logoOffset)*axisSlope)/(1+slope*axisSlope));
          if(below)rise=Math.max(rise,p.y-h-below.y+gap);
          if(slope<0)rise=Math.max(rise,(maxX-xAtPoint)/slope);
          for(let step=0;step<=obstacles.length;step++){
            const box={x:xAtPoint+rise*slope,y:p.y-h-rise,w,h};
            if(box.x<minX-1e-8||box.x>maxX+1e-8||box.y<14)break;
            const hits=obstacles.filter(obstacle=>overlap(box,obstacle)>1e-8);
            if(!hits.length){
              const distance=rise*Math.hypot(1,slope);
              if(!best||distance<best.distance)best={box,distance};
              break;
            }
            // Clear each obstacle by passing above it or to its left.
            rise+=Math.max(...hits.map(obstacle=>{
              const above=box.y+h-obstacle.y;
              const left=slope<0?(box.x+w-obstacle.x)/-slope:Infinity;
              return Math.min(above,left);
            }))+.01;
          }
        }
        if(!best)break;
        placed.push({...p,box:best.box,scale});
      }
      placed.reverse();
      if(placed.length!==points.length)continue;
      break;
    }
    for(const p of placed){
      p.logo={x:p.box.x+35*p.scale,y:p.box.y+p.box.h/2};
      p.anchor={x:p.logo.x,y:p.box.y+p.box.h};
    }
    return {labels:placed,points,rocket,maximum,point};
  }
  function scene(){
    geometry=layout(current.plotted,root.getBoundingClientRect?.().width||1200);
    const {labels,points,rocket,maximum,point}=geometry;
    const ticks=Array.from({length:6},(_,i)=>{
      const value=i*maximum/5,p=point(value),nx=normal.x,ny=normal.y;
      return `<g class="moonshot-score-tick"><line x1="${p.x-nx*5}" y1="${p.y-ny*5}" x2="${p.x+nx*5}" y2="${p.y+ny*5}"/><text x="${p.x+nx*21}" y="${p.y+ny*21+4}" text-anchor="middle">${value.toFixed(0)}</text></g>`;
    }).join("");
    const links=labels.map(p=>`<path class="moonshot-connector" data-link-policy="${esc(p.policy.id)}" d="M ${p.x} ${p.y} L ${p.anchor.x} ${p.anchor.y}"/>`).join("");
    const callouts=labels.map(p=>`<g class="moonshot-label${p.rank<=3?" is-podium":""}${p.rank===1?" is-leading":""}" data-plot-policy="${esc(p.policy.id)}" data-rank="${p.rank}" data-score="${p.score}" data-score-x="${p.x}" data-score-y="${p.y}" data-label-x="${p.box.x}" data-label-y="${p.box.y}" data-label-width="${p.box.w}" data-label-height="${p.box.h}" transform="translate(${p.box.x} ${p.box.y}) scale(${p.scale})"><a href="${esc(p.policy.modelUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Rank ${p.rank}. ${esc(title(p.policy))}: Score ${fixed(p.score)}. Open model website."><rect class="label-hit" width="${p.box.w/p.scale}" height="${labelHeight}"/><text class="label-rank" x="8" y="17" text-anchor="middle">#${p.rank}</text><rect class="label-logo-bg" x="22" y="0" width="26" height="26" rx="7"/><image class="label-logo-image" href="${esc(p.policy.logoPath)}" x="24" y="2" width="22" height="22"/><text class="label-name" x="55" y="10">${esc(R.policyName(p.policy))}${p.variant?`<tspan class="label-variant">${esc(p.variant)}</tspan>`:""}</text><text class="label-score" x="55" y="23">${fixed(p.score)}</text></a></g>`).join("");
    const markers=points.map(p=>`<g class="moonshot-point${p.rank<=3?" is-podium":""}" data-plot-policy="${esc(p.policy.id)}"><circle cx="${p.x}" cy="${p.y}" r="3"/></g>`).join("");
    const flight=rocket?`<path class="moonshot-path" d="M ${start.x} ${start.y} L ${rocket.x} ${rocket.y}"/><path class="moonshot-path-future" d="M ${rocket.x} ${rocket.y} L ${end.x} ${end.y}"/>`:"";
    const ship=rocket?`<g class="moonshot-rocket" data-rocket-policy="${esc(points[0].policy.id)}" data-rocket-score="${points[0].score}" data-rocket-anchor="nose" data-rocket-x="${rocket.x}" data-rocket-y="${rocket.y}" transform="translate(${rocket.x} ${rocket.y}) rotate(${angle})" role="img" aria-label="Rocket nose marks the highest eligible Score"><image href="assets/img/moonshot-rocket-premium.webp" x="${-rocket.width}" y="${-rocket.noseY}" width="${rocket.width}" height="${rocket.height}"/></g>`:"";
    const zeroTick={x:start.x+normal.x*21,y:start.y+normal.y*21+4};
    return `<p class="sr-only" id="moonshot-plot-desc">One diagonal Score axis runs from Earth to the Moon. ${esc(R.scoreFormula)} Efficiency is uncapped. Higher scores are farther along the orbit. All three complete Overall metrics are required. Missing scores remain unranked. The rocket nose marks the highest eligible Score.</p><svg viewBox="0 0 ${frame.width} ${frame.height}" role="group" aria-label="Policy ranking along the Score orbit" aria-describedby="moonshot-plot-desc"><defs><marker id="score-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L6 4 L1 7" fill="none" stroke="#916b32" stroke-width="1.3" stroke-linecap="round"/></marker><linearGradient id="moonshot-trail" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#bf9143"/><stop offset="1" stop-color="#956326"/></linearGradient></defs><path class="moonshot-score-axis" d="M ${start.x} ${start.y} L ${end.x} ${end.y}" marker-end="url(#score-arrow)"/>${flight}<g class="moonshot-score-ticks">${ticks}</g><text class="moonshot-score-axis-label" x="${zeroTick.x-16}" y="${zeroTick.y}" text-anchor="end">Score</text>${links}${ship}<g class="moonshot-points">${markers}</g><g class="moonshot-target" aria-hidden="true"><circle cx="${end.x}" cy="${end.y}" r="3" fill="#b9852e"/><circle cx="${end.x}" cy="${end.y}" r="7" fill="none" stroke="#a4732c" stroke-opacity=".9"/><text x="1051" y="52" text-anchor="end">THE MOON</text><text class="target-value" x="1051" y="72" text-anchor="end">${maximum.toFixed(0)}</text></g><g class="moonshot-labels">${callouts}</g>${points.length?"":'<text class="moonshot-chart-empty" x="600" y="340">No complete Score results.</text>'}</svg>`;
  }
  function inspect(id){
    activeId=id;
    root.classList?.toggle("is-inspecting",!!id);
    root.querySelectorAll('[data-plot-policy]').forEach(el=>{
      el.classList.toggle("is-active",el.dataset.plotPolicy===id);
      if(el.dataset.plotPolicy===id&&el.classList.contains("moonshot-point"))el.parentNode.appendChild(el);
    });
    root.querySelectorAll('[data-link-policy]').forEach(el=>el.classList.toggle("is-active",el.dataset.linkPolicy===id));
    const e=current?.plotted.find(e=>e.policy.id===id),tooltip=$("moonshot-inspector");tooltip.hidden=!e;
    if(!e)return;
    tooltip.innerHTML=`<a href="${esc(e.policy.modelUrl)}" target="_blank" rel="noopener noreferrer">${esc(title(e.policy))} ↗</a><dl><div><dt>Score</dt><dd>${fixed(e.score)}</dd></div><div><dt>SR</dt><dd>${percent(e.sr)}</dd></div><div><dt>LSCR</dt><dd>${percent(e.lscr)}</dd></div><div><dt>Eff.</dt><dd>${ratio(e.efficiency)}</dd></div></dl>`;
    const viewport=($("moonshot-chart").getBoundingClientRect?.().width||frame.width)/frame.width,rect=tooltip.getBoundingClientRect?.(),w=(rect?.width||190)/viewport,h=(rect?.height||82)/viewport;
    const box=geometry.labels.find(p=>p.policy.id===id)?.box||{...start,w:0,h:0};
    let best=null;
    for(let y=12;y+h<frame.height-12;y+=20)for(let x=14;x+w<frame.width-14;x+=30){
      const candidate={x,y,w,h};
      if(geometry.rocket&&overlap(candidate,pad(geometry.rocket.box,12/viewport)))continue;
      const cost=(x-box.x)**2+(y-box.y)**2+geometry.labels.reduce((sum,p)=>sum+overlap(candidate,pad(p.box,5))*10000,0);
      if(!best||cost<best.cost)best={...candidate,cost};
    }
    if(!best){tooltip.hidden=true;return;}
    tooltip.style.left=`${best.x/frame.width*100}%`;tooltip.style.top=`${best.y/frame.height*100}%`;
  }
  function inspectTarget(target){
    const p=target.closest('[data-plot-policy]');
    if(p){if(p.dataset.plotPolicy!==activeId)inspect(p.dataset.plotPolicy);}
    else if(!target.closest('#moonshot-inspector'))inspect(null);
  }
  function render(group){
    if(group===groupKey)return;
    current=api.data(group);groupKey=group;activeId=null;
    root.hidden=false;$("moonshot-updated").innerHTML=R.overall.updated(M.group(group));
    $("moonshot-chart").innerHTML=scene();
    const reports=[...current.unplotted].sort((a,b)=>title(a.policy).localeCompare(title(b.policy),"en",{numeric:true}));
    const unplotted=$("moonshot-unplotted");unplotted.hidden=!reports.length;
    const cards=reports.map(e=>{
      const fullOnly=e.sr===null && e.fullSr!==null,scope=fullOnly?"Full":"Mean",sr=fullOnly?e.fullSr:e.sr,lscr=fullOnly?e.fullLscr:e.lscr;
      return `<article class="moonshot-incomplete" data-report-policy="${esc(e.policy.id)}" aria-label="${esc(title(e.policy))}"><img src="${esc(e.policy.logoPath)}" alt="" width="32" height="32"><a href="${esc(e.policy.modelUrl)}" target="_blank" rel="noopener noreferrer">${esc(R.policyName(e.policy))} <span class="incomplete-variant">${esc(e.policy.variantLabel||"")}</span></a><div class="incomplete-metrics"><span class="incomplete-value">${scope} SR<strong>${percent(sr)}</strong></span>${lscr!==null?`<span class="incomplete-value">${scope} LSCR<strong>${percent(lscr)}</strong></span>`:""}</div></article>`;
    }).join("");
    unplotted.innerHTML=`<div class="moonshot-unplotted-intro"><h3>Unranked reports</h3><p>Score: NR</p></div><div class="moonshot-unplotted-models">${cards}</div>`;
    $("moonshot-coverage").textContent=`${current.plotted.length} ranked · ${current.totalTasks} tasks`;
    inspect(null);
  }
  root.addEventListener("pointerover",e=>inspectTarget(e.target));
  root.addEventListener("pointerleave",()=>inspect(null));
  root.addEventListener("focusin",e=>inspectTarget(e.target));
  root.addEventListener("focusout",e=>{if(!root.contains(e.relatedTarget))inspect(null);});
  root.addEventListener("click",e=>{const p=e.target.closest('.moonshot-point');if(p)inspect(p.dataset.plotPolicy);});
  root.addEventListener("keydown",e=>{if(e.key==="Escape")inspect(null);});
  window.addEventListener?.("resize",()=>{if(groupKey){const group=groupKey;groupKey="";render(group);}});
  api.render=render;api.layout=layout;
})();
