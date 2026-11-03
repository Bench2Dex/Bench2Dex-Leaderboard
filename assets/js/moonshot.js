/* SR on x, LSCR on y. The rocket follows published results, never a timer. */
(function(){
  "use strict";
  const root=document.getElementById("moonshot");if(!root)return;
  const R=window.BenchResults,M=R.model,esc=R.escape,api=R.moonshot;
  const $=id=>document.getElementById(id),frame={width:1200,height:690};
  // The 100/100 endpoint sits just inside the Moon's Earth-facing limb in the backdrop.
  const moon={x:1107,y:66,r:32},landing={x:1088,y:82};
  const bounds={left:78,right:landing.x,top:landing.y,bottom:630};
  const rocketShape={width:100,height:28.125,noseY:16.09375};
  const x=value=>bounds.left+(bounds.right-bounds.left)*value/100,y=value=>bounds.bottom-(bounds.bottom-bounds.top)*value/100;
  const fmt=value=>Number.isFinite(value) ? `${value.toFixed(1)}%` : "NR";
  const name=p=>p.modelVersion||p.label;
  const title=p=>`${name(p)}${p.variantLabel ? " · "+p.variantLabel : ""}`;
  let current=null,leader=null,groupKey="",activeId=null,labelBoxes=new Map();

  function rocketPosition(entry){
    if(!entry)return null;
    const px=x(entry.sr),py=y(entry.lscr),dx=bounds.right-px,dy=bounds.top-py;
    const angle=dx || dy ? Math.atan2(dy,dx) : Math.atan2(bounds.top-bounds.bottom,bounds.right-bounds.left);
    const corners=[-rocketShape.width,0].flatMap(rx=>[-rocketShape.noseY,rocketShape.height-rocketShape.noseY].map(ry=>({x:rx*Math.cos(angle)-ry*Math.sin(angle),y:rx*Math.sin(angle)+ry*Math.cos(angle)})));
    let scale=1;
    for(const p of corners){
      if(p.x<0)scale=Math.min(scale,(px-8)/-p.x);else if(p.x>0)scale=Math.min(scale,(frame.width-8-px)/p.x);
      if(p.y<0)scale=Math.min(scale,(py-8)/-p.y);else if(p.y>0)scale=Math.min(scale,(frame.height-8-py)/p.y);
    }
    const minX=Math.min(...corners.map(p=>p.x))*scale,maxX=Math.max(...corners.map(p=>p.x))*scale;
    const minY=Math.min(...corners.map(p=>p.y))*scale,maxY=Math.max(...corners.map(p=>p.y))*scale;
    return {x:px,y:py,angle:angle*180/Math.PI,width:rocketShape.width*scale,height:rocketShape.height*scale,noseY:rocketShape.noseY*scale,box:{x:px+minX,y:py+minY,w:maxX-minX,h:maxY-minY}};
  }
  const overlapArea=(a,b)=>a && b ? Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)) : 0;
  const padded=(b,pad)=>({x:b.x-pad,y:b.y-pad,w:b.w+2*pad,h:b.h+2*pad});
  function labels(entries){
    if(!entries.length)return [];
    const viewport=Math.max(320,root.getBoundingClientRect?.().width||frame.width);
    const initialScale=Math.min(2.6,Math.max(1,frame.width/viewport*.85));
    const points=entries.map(e=>{
      const variant=e.policy.variantLabel==="w/ Tactile" ? " + Tactile" : e.policy.variantLabel&&e.policy.variantLabel!=="w/o Tactile" ? " "+e.policy.variantLabel : "";
      return {...e,px:x(e.sr),py:y(e.lscr),rank:M.aggregateRank(e.policy.id,"sr","mean"),width:Math.min(342,67+name(e.policy).length*6.8+variant.length*5.3),variant};
    });
    const ranks=new Map(entries.map((e,i)=>[e.policy.id,i]));
    const ship=rocketPosition(leader),guard=ship?padded(ship.box,10*frame.width/viewport):null;
    const moonGuard={x:moon.x-moon.r-8,y:moon.y-moon.r-8,w:moon.r*2+16,h:moon.r*2+16};
    const vertical=[...points].sort((a,b)=>b.lscr-a.lscr||b.sr-a.sr||ranks.get(a.policy.id)-ranks.get(b.policy.id));
    const ascending=[...points].sort((a,b)=>a.sr-b.sr||ranks.get(a.policy.id)-ranks.get(b.policy.id));
    const cluster=leader?points.filter(p=>Math.abs(p.sr-leader.sr)<8&&Math.abs(p.lscr-leader.lscr)<8):[];
    const clusterIds=new Set(cluster.map(p=>p.policy.id));
    let solution=null,lastXs=null,lastScale=initialScale;
    // X is assigned once per scale in SR order. The vertical packing and every
    // crowded-layout retry reuse these positions, so no fallback can invert ranks.
    for(let attempt=0;attempt<16&&!solution;attempt++){
      const scale=initialScale*.9**attempt,h=30*scale,gap=6*scale,step=4*scale;
      const groups=[];
      for(const p of ascending){
        let g=groups.at(-1);
        if(!g||g.sr!==p.sr){g={sr:p.sr,items:[],desired:p.px,upper:Infinity};groups.push(g);}
        g.items.push(p);
        g.upper=Math.min(g.upper,frame.width-16-(p.width-35)*scale);
      }
      // Clear the rocket for its dense local group with a common offset;
      // retaining the score spacing avoids arbitrary per-model displacements.
      const shift=guard&&cluster.length>1?Math.max(0,guard.x+guard.w+41*scale-Math.min(...cluster.map(p=>p.px))):0;
      for(const g of groups)g.desired=Math.max(...g.items.map(p=>p.px+(clusterIds.has(p.policy.id)?shift:0)));
      for(let i=groups.length-2;i>=0;i--)groups[i].upper=Math.min(groups[i].upper,groups[i+1].upper-gap);
      if(groups[0].upper<16+35*scale)continue;
      const xs=new Map();let previous=16+35*scale-gap;
      for(const g of groups){
        const lx=Math.max(previous+gap,Math.min(g.desired,g.upper));
        for(const p of g.items)xs.set(p.policy.id,lx);
        previous=lx;
      }
      lastXs=xs;lastScale=scale;
      const make=(p,ly)=>{
        const lx=xs.get(p.policy.id),w=p.width*scale,box={x:lx-35*scale,y:ly-15*scale,w,h};
        if(overlapArea(box,guard)||overlapArea(box,moonGuard))return null;
        if(points.some(q=>q.px>box.x-6*scale&&q.px<box.x+w+6*scale&&q.py>box.y-6*scale&&q.py<box.y+h+6*scale))return null;
        const cx=box.x+w/2,vx=p.px-cx,vy=p.py-ly;
        const t=Math.min((w/2+4*scale)/Math.abs(vx),(h/2+4*scale)/Math.abs(vy));
        if(t>=1)return null;
        const anchor={x:cx+vx*t,y:ly+vy*t},link=Math.hypot(anchor.x-p.px,anchor.y-p.py);
        if(attempt<8&&link>120*scale)return null;
        return {...p,scale,w,box,lx,ly,anchor,cost:link**2+.2*(ly-p.py)**2};
      };
      const separation=(a,b)=>{
        const ax=xs.get(a.policy.id)-35*scale,bx=xs.get(b.policy.id)-35*scale;
        return ax<bx+b.width*scale+4*scale&&ax+a.width*scale+4*scale>bx?h+6*scale:2*scale;
      };
      const domains=vertical.map(p=>{
        const ys=[p.py];
        for(let ly=12+h/2;ly<=frame.height-28-h/2;ly+=step)ys.push(ly);
        return ys.filter(ly=>ly>=12+h/2&&ly<=frame.height-28-h/2).map(ly=>make(p,ly)).filter(Boolean).sort((a,b)=>a.ly-b.ly);
      });
      // A backward pass reserves enough room for every remaining label. A
      // feasible prefix can therefore always be completed without changing X.
      const ceilings=new Array(points.length);let feasible=true;
      for(let i=vertical.length-1;i>=0;i--){
        let upper=Infinity;
        for(let j=i+1;j<vertical.length;j++)upper=Math.min(upper,ceilings[j]-separation(vertical[i],vertical[j]));
        const last=domains[i].findLast(c=>c.ly<=upper+1e-7);
        if(!last){feasible=false;break;}
        ceilings[i]=last.ly;
      }
      if(!feasible)continue;
      let beam=[{cost:0,items:[]}];
      for(let i=0;i<vertical.length;i++){
        const next=[];
        for(const state of beam){
          let lower=-Infinity;
          for(let j=0;j<i;j++)lower=Math.max(lower,state.items[j].ly+separation(vertical[j],vertical[i]));
          for(const c of domains[i]){
            if(c.ly<lower-1e-7||c.ly>ceilings[i]+1e-7)continue;
            let cost=state.cost+c.cost;
            // Include the nearest available future positions in the estimate,
            // so the first label does not push the rest of the group far down.
            let estimate=cost;
            for(let j=i+1;j<vertical.length;j++){
              let floor=c.ly+separation(vertical[i],vertical[j]);
              for(let k=0;k<i;k++)floor=Math.max(floor,state.items[k].ly+separation(vertical[k],vertical[j]));
              let nearest=Infinity;
              for(const q of domains[j])if(q.ly>=floor-1e-7&&q.ly<=ceilings[j]+1e-7)nearest=Math.min(nearest,q.cost);
              estimate+=nearest;
            }
            next.push({cost,estimate,items:[...state.items,c]});
          }
        }
        next.sort((a,b)=>a.estimate-b.estimate||a.cost-b.cost);beam=next.slice(0,24);
      }
      if(beam.length)solution=beam.sort((a,b)=>a.cost-b.cost)[0].items;
    }
    // An unusually crowded result set can exceed the local packing budget.
    // Keep the same ordered X coordinates and fit the labels into a clear band;
    // this fallback is bounded and never substitutes arbitrary horizontal slots.
    if(!solution){
      const blocked=[guard,moonGuard].filter(Boolean).map(b=>({start:Math.max(12,b.y-3),end:Math.min(frame.height-28,b.y+b.h+3)}));
      blocked.push(...points.map(p=>({start:p.py-2,end:p.py+2})));
      blocked.sort((a,b)=>a.start-b.start);
      let cursor=12,band={start:12,end:12};
      for(const interval of [...blocked,{start:frame.height-28,end:frame.height-28}]){
        if(interval.start-cursor>band.end-band.start)band={start:cursor,end:interval.start};
        cursor=Math.max(cursor,interval.end);
      }
      if(band.end<=band.start)band={start:12,end:frame.height-28};
      const scale=Math.min(lastScale,(band.end-band.start-8)/(points.length*36));
      solution=vertical.map((p,i)=>{
        const lx=lastXs.get(p.policy.id),ly=band.start+4+(18+i*36)*scale,w=p.width*scale;
        const box={x:lx-35*scale,y:ly-15*scale,w,h:30*scale},cx=box.x+w/2,vx=p.px-cx,vy=p.py-ly;
        const t=Math.min((w/2+4*scale)/Math.abs(vx),(box.h/2+4*scale)/Math.abs(vy));
        return {...p,scale,w,lx,ly,box,anchor:{x:cx+vx*t,y:ly+vy*t}};
      });
    }
    return solution.map(p=>({...p,connector:`M ${p.px} ${p.py} L ${p.anchor.x} ${p.anchor.y}`})).sort((a,b)=>ranks.get(a.policy.id)-ranks.get(b.policy.id));
  }

  function scene(entries){
    const rocket=rocketPosition(leader),placed=labels(entries),ticks=[0,20,40,60,80,100];
    labelBoxes=new Map(placed.map(p=>[p.policy.id,p.box]));
    const grid=ticks.map(v=>`<line x1="${x(v)}" y1="${bounds.top}" x2="${x(v)}" y2="${bounds.bottom}"/><line x1="${bounds.left}" y1="${y(v)}" x2="${bounds.right}" y2="${y(v)}"/><text x="${x(v)}" y="${bounds.bottom+21}" text-anchor="middle">${v}</text><text x="${bounds.left-17}" y="${y(v)+4}" text-anchor="end">${v}</text>`).join("");
    const callouts=placed.map(p=>{
      const {box:b,policy:q}=p,isLeading=q.id===leader?.policy.id;
      const logoX=35,nameX=57;
      return `<g class="moonshot-label${isLeading ? " is-leading" : ""}${p.rank<=3 ? " is-podium" : ""}" data-rank="${p.rank}" data-plot-policy="${esc(q.id)}"${isLeading ? ' data-leading="true"' : ''} data-sr="${p.sr}" data-lscr="${p.lscr}" data-score-x="${p.px}" data-score-y="${p.py}" data-label-scale="${p.scale}" data-logo-x="${b.x+logoX*p.scale}" data-logo-y="${b.y+15*p.scale}" transform="translate(${b.x} ${b.y}) scale(${p.scale})"><a href="${esc(q.modelUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Rank ${p.rank} by four-channel mean SR. ${esc(title(q))}: SR ${fmt(p.sr)}, LSCR ${fmt(p.lscr)}. Open model website."><rect class="label-hit" width="${b.w/p.scale}" height="${b.h/p.scale}"/><text class="label-rank" x="8" y="19" text-anchor="middle" aria-hidden="true">#${p.rank}</text><rect class="label-logo-bg" x="${logoX-16}" y="-1" width="32" height="32" rx="8"/><image class="label-logo-image" href="${esc(q.logoPath)}" x="${logoX-13}" y="2" width="26" height="26"/><text class="label-name" x="${nameX}" y="19">${esc(name(q))}${p.variant ? `<tspan class="label-variant">${esc(p.variant)}</tspan>` : ""}</text></a></g>`;
    }).join("");
    const connectors=placed.map(p=>`<path class="moonshot-connector" data-link-policy="${esc(p.policy.id)}" d="${p.connector}"/>`).join("");
    const radius=Math.max(3,frame.width/(root.getBoundingClientRect?.().width||frame.width)*2.5);
    const markers=placed.map(p=>`<g class="moonshot-point${p.rank<=3 ? " is-podium" : ""}" data-plot-policy="${esc(p.policy.id)}" data-point-x="${p.px}" data-point-y="${p.py}"><circle cx="${p.px}" cy="${p.py}" r="${radius}"/></g>`).join("");
    const heading=rocket ? rocket.angle*Math.PI/180 : 0;
    const trailLength=rocket ? Math.min(120,Math.hypot(rocket.x-bounds.left,rocket.y-bounds.bottom)*.3) : 0;
    const remaining=rocket ? Math.hypot(bounds.right-rocket.x,bounds.top-rocket.y) : 0;
    const flight=rocket ? `<path class="moonshot-path" d="M ${bounds.left} ${bounds.bottom} C ${bounds.left+(rocket.x-bounds.left)*.2} ${bounds.bottom-(bounds.bottom-rocket.y)*.6} ${rocket.x-Math.cos(heading)*trailLength} ${rocket.y-Math.sin(heading)*trailLength} ${rocket.x} ${rocket.y}"/><path class="moonshot-path-future" d="M ${rocket.x} ${rocket.y} C ${rocket.x+Math.cos(heading)*remaining*.35} ${rocket.y+Math.sin(heading)*remaining*.35} ${bounds.right-remaining*.16} ${bounds.top+Math.min(20,remaining*.08)} ${bounds.right} ${bounds.top}"/><g class="moonshot-rocket" data-rocket-anchor="nose" data-rocket-policy="${esc(leader.policy.id)}" data-rocket-x="${rocket.x}" data-rocket-y="${rocket.y}" transform="translate(${rocket.x} ${rocket.y}) rotate(${rocket.angle})" role="img" aria-label="Rocket nose anchored to ${esc(title(leader.policy))}, the highest four-channel mean SR; LSCR breaks ties."><image href="assets/img/moonshot-rocket-premium.webp" x="${-rocket.width}" y="${-rocket.noseY}" width="${rocket.width}" height="${rocket.height}"/></g>` : "";
    return `<p class="sr-only" id="moonshot-plot-desc">Horizontal axis: stable success rate (SR). Vertical axis: latched stage completion rate (LSCR). Both range from 0 to 100 percent, using four-channel means. Dots mark exact scores; leader lines connect them to model labels. Label numbers use the Overall Performance four-channel mean SR ranks, with equal SR sharing a rank. The rocket nose marks the highest eligible mean SR policy and updates with the published leader. Policies missing either metric are not plotted.</p><svg viewBox="0 0 ${frame.width} ${frame.height}" role="group" aria-label="Policy success rate versus stage completion" aria-describedby="moonshot-plot-desc"><defs><marker id="moonshot-axis-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 L6 4 L1 7" fill="none" stroke="#315571" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></marker><linearGradient id="moonshot-trail" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#bf9143"/><stop offset="1" stop-color="#956326"/></linearGradient></defs><g class="moonshot-grid">${grid}</g>${connectors}${flight}<path class="moonshot-axis" d="M${bounds.left} ${bounds.top-5} V${bounds.bottom} H${bounds.right+6}" marker-start="url(#moonshot-axis-arrow)" marker-end="url(#moonshot-axis-arrow)"/><text class="moonshot-axis-label" data-plot-axis="lscr" x="${bounds.left}" y="${bounds.top-22}" text-anchor="middle" tabindex="0" role="img" aria-label="LSCR: Latched Stage Completion Rate (%)" aria-describedby="moonshot-axis-tooltip">LSCR <tspan>(%)</tspan></text><text class="moonshot-axis-label" data-plot-axis="sr" x="${bounds.right+20}" y="${bounds.bottom}" dominant-baseline="middle" tabindex="0" role="img" aria-label="SR: Stable Success Rate (%)" aria-describedby="moonshot-axis-tooltip">SR <tspan>(%)</tspan></text><g class="moonshot-target" aria-hidden="true" data-moon-x="${moon.x}" data-moon-y="${moon.y}" data-moon-radius="${moon.r}" data-landing-x="${landing.x}" data-landing-y="${landing.y}"><circle class="landing-dot" cx="${landing.x}" cy="${landing.y}" r="3" fill="#b9852e"/><circle cx="${landing.x}" cy="${landing.y}" r="7" fill="none" stroke="#a4732c" stroke-opacity=".9"/><text x="${moon.x-moon.r-24}" y="${moon.y-14}" text-anchor="end">THE MOON</text><text class="target-value" x="${moon.x-moon.r-24}" y="${moon.y+6}" text-anchor="end">100 / 100</text></g><g class="moonshot-labels">${callouts}</g>${markers}${entries.length ? "" : `<text class="moonshot-chart-empty" x="${frame.width/2}" y="${frame.height/2-15}">No complete SR / LSCR results.</text>`}</svg>`;
  }
  function inspect(id){
    activeId=id;
    root.classList?.toggle("is-inspecting",!!id);
    root.querySelectorAll('[data-plot-policy]').forEach(el=>{
      el.classList.toggle("is-active",el.dataset.plotPolicy===id);
      if(el.dataset.plotPolicy===id && el.classList.contains("moonshot-point"))el.parentNode.append(el);
    });
    root.querySelectorAll('[data-link-policy]').forEach(el=>el.classList.toggle("is-active",el.dataset.linkPolicy===id));
    const entry=current?.plotted.find(e=>e.policy.id===id),tooltip=$("moonshot-inspector");
    tooltip.hidden=!entry;
    if(!entry)return;
    tooltip.innerHTML=`<a href="${esc(entry.policy.modelUrl)}" target="_blank" rel="noopener noreferrer">${esc(title(entry.policy))} ↗</a><dl><div><dt>SR</dt><dd>${fmt(entry.sr)}</dd></div><div><dt>LSCR</dt><dd>${fmt(entry.lscr)}</dd></div></dl>`;
    const scale=($("moonshot-chart").getBoundingClientRect?.().width||frame.width)/frame.width;
    const rect=tooltip.getBoundingClientRect?.(),tw=(rect?.width||170)/scale,th=(rect?.height||54)/scale;
    const box=labelBoxes.get(id)||{x:x(entry.sr),y:y(entry.lscr),w:0,h:0};
    const lx=box.x-tw-14,rx=box.x+box.w+14,ty=box.y-th-14,by=box.y+box.h+14,cy=box.y+(box.h-th)/2;
    const candidates=[{x:rx,y:cy},{x:lx,y:cy},{x:box.x,y:ty},{x:box.x,y:by},...[lx,rx].flatMap(px=>[ty,by].map(py=>({x:px,y:py}))),{x:frame.width-tw-24,y:cy},{x:18,y:cy},{x:frame.width-tw-24,y:ty},{x:frame.width-tw-24,y:by}];
    const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
    const ship=rocketPosition(leader)?.box;let best=null;
    for(let cy=12;cy+th<frame.height-12;cy+=40)for(let cx=18;cx+tw<frame.width-18;cx+=80)candidates.push({x:cx,y:cy});
    for(const candidate of candidates){
      const p={x:Math.max(18,Math.min(frame.width-tw-18,candidate.x)),y:Math.max(12,Math.min(frame.height-th-12,candidate.y)),w:tw,h:th};
      if(ship && overlap(p,padded(ship,12/scale)))continue;
      let score=(p.x-box.x)**2+(p.y-box.y)**2;
      for(const b of labelBoxes.values())score+=overlap(p,b)*10000;

      if(!best || score<best.score)best={...p,score};
    }
    if(!best){tooltip.hidden=true;return;}
    tooltip.style.left=`${best.x/frame.width*100}%`;
    tooltip.style.top=`${best.y/frame.height*100}%`;
  }
  function inspectAxis(key){
    const tooltip=$("moonshot-axis-tooltip");tooltip.hidden=!key;
    if(!key)return;
    const isSR=key==="sr";
    tooltip.style.left=`${(isSR ? bounds.right-240 : bounds.left)/frame.width*100}%`;
    tooltip.style.top=`${(isSR ? bounds.bottom-34 : bounds.top-8)/frame.height*100}%`;
    tooltip.innerHTML=isSR
      ? '<strong>Stable Success Rate</strong><p>Episodes reaching stable success, averaged equally across tasks and four channels.</p>'
      : '<strong>Latched Stage Completion Rate</strong><p>Dependency-valid task stages reached, averaged equally across tasks and four channels.</p>';
  }
  function inspectTarget(target){
    const axis=target.closest('[data-plot-axis]');
    if(axis){inspect(null);inspectAxis(axis.dataset.plotAxis);return;}
    inspectAxis(null);
    const policy=target.closest('[data-plot-policy]');
    if(policy){if(policy.dataset.plotPolicy!==activeId)inspect(policy.dataset.plotPolicy);}
    else if(activeId && !target.closest('#moonshot-inspector'))inspect(null);
  }
  function render(group){
    if(group===groupKey)return;
    current=api.data(group,"mean");leader=api.leader(group);groupKey=group;activeId=null;
    root.hidden=false;$("moonshot-updated").innerHTML=R.overall.updated(M.group(group));
    $("moonshot-chart").innerHTML=scene(current.plotted);
    const unplotted=$("moonshot-unplotted");unplotted.hidden=!current.unplotted.length;
    const allMeansMissing=current.unplotted.every(e=>e.sr===null && e.lscr===null);
    unplotted.innerHTML=`<div class="moonshot-unplotted-intro"><h3>Partial reports</h3>${allMeansMissing ? '<p>Mean SR / LSCR: NR</p>' : ''}</div><div class="moonshot-unplotted-models">${current.unplotted.map(e=>{
      const p=e.policy,fallback=e.sr===null && e.fullSr!==null;
      const context=e.reason==="Incomplete task coverage" ? `Mean · SR ${e.srCoverage}/${current.totalTasks}, LSCR ${e.lscrCoverage}/${current.totalTasks} tasks` : `Mean SR: ${fmt(e.sr)}; Mean LSCR: ${fmt(e.lscr)}`;
      return `<article class="moonshot-incomplete" title="${esc(context)}"><img src="${esc(p.logoPath)}" alt="" width="18" height="18"><a href="${esc(p.modelUrl)}" target="_blank" rel="noopener noreferrer">${esc(name(p))}<span class="incomplete-variant">${esc((p.variantLabel||"").replace(" + ICL",""))}</span></a><span class="incomplete-value">${fallback ? "Full SR" : "Mean SR"}<strong>${fmt(fallback ? e.fullSr : e.sr)}</strong></span><span class="sr-only">${esc(context)}</span></article>`;
    }).join("")}</div>`;
    $("moonshot-coverage").textContent=`${current.plotted.length} models · ${current.totalTasks} tasks`;
    inspect(null);
    inspectAxis(null);
  }
  root.addEventListener("pointerover",event=>inspectTarget(event.target));
  root.addEventListener("pointerleave",()=>{inspect(null);inspectAxis(null);});
  root.addEventListener("focusin",event=>inspectTarget(event.target));
  root.addEventListener("click",event=>{
    const point=event.target.closest(".moonshot-point");
    if(point){inspect(point.dataset.plotPolicy);inspectAxis(null);return;}
    if(!event.target.closest('a,#moonshot-inspector,[data-plot-axis]')){inspect(null);inspectAxis(null);}
  });
  root.addEventListener("focusout",event=>{if(!root.contains(event.relatedTarget)){inspect(null);inspectAxis(null);}});
  root.addEventListener("keydown",event=>{if(event.key==="Escape"){inspect(null);inspectAxis(null);}});
  window.addEventListener?.("resize",()=>{if(groupKey){const group=groupKey;groupKey="";render(group);}});
  api.render=render;
})();
