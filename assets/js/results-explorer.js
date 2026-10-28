/* One page, two independent tables: overall policy rankings and per-task scores. */
(function(){
  "use strict";
  const root=document.querySelector("#results-explorer");
  if(!root) return;
  const B=window.BENCH,R=window.BenchResults,M=R.model,esc=R.escape;
  const $=s=>root.querySelector(s);
  const labels={sr:"SR",lscr:"LSCR",efficiency:"Eff."};
  const longLabels={sr:"Stable Success Rate",lscr:"Latched Stage Completion Rate",efficiency:"Success-Conditioned Efficiency"};
  const state={};
  const group=()=>M.group(state.group),tasks=()=>M.tasks(state.group);
  // Keep every policy visible so unavailable metrics remain explicit NR cells.
  const metricPolicies=()=>group();
  const channelLabel=c=>c==="mean" ? "Average" : B.CHANNEL_LABEL[c];
  const policyTitle=(p,indicator="")=>esc(p.variantLabel ? p.modelVersion : p.label)+indicator+(p.variantLabel ? `<span class="policy-variant">${esc(p.variantLabel)}</span>` : "");
  const cellValue=(r,key,cid)=>esc(R.format(r,key,cid!=="mean"));
  const announce=s=>{$("#results-status").textContent=s;};
  const enumValue=(value,options,fallback)=>options.includes(value) ? value : fallback;
  function readLocation(){
    const q=new URLSearchParams(location.search);
    state.group=enumValue(q.get("group"),M.protocols.map(p=>p.id),M.protocols[0].id);
    state.rankMetric=enumValue(q.get("rank_metric")||q.get("sort"),Object.keys(labels),"sr");
    state.rankChannel=state.rankMetric==="sr" ? enumValue(q.get("rank_channel"),["mean",...B.CHANNELS],"mean") : "mean";
    state.rankDir=enumValue(q.get("rank_dir"),["ascending","descending"],"descending");
    state.metric=enumValue(q.get("metric"),Object.keys(labels),"sr");
    state.channel=state.metric==="efficiency" ? "mean" : enumValue(q.get("channel"),["mean",...B.CHANNELS],"mean");
    state.emb=enumValue(q.get("emb"),B.EMBODIMENTS.map(e=>e.id),"");
    state.taskSort=enumValue(q.get("task_sort"),["paper",...group().map(p=>p.id)],"paper");
    state.taskDir=enumValue(q.get("task_dir"),["ascending","descending"],"descending");
    state.policyShow=enumValue(q.get("policy_show"),["all","custom"],"all");
    state.policies=[...new Set((q.get("policies")||"").split(","))].filter(id=>group().some(p=>p.id===id));
    state.taskDetail=enumValue(q.get("task_detail")||q.get("task"),tasks().map(t=>t.id),null);
    $("#results-group").innerHTML=M.protocols.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join("");
    $("#results-group-control").hidden=M.protocols.length<2;
    $("#task-embodiment").innerHTML='<option value="">All embodiments</option>'+B.EMBODIMENTS.filter(e=>tasks().some(t=>t.emb===e.id)).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join("");
    syncControls();
  }
  function syncControls(){
    const taskPolicies=metricPolicies(state.metric);
    if(state.taskSort!=="paper" && !taskPolicies.some(p=>p.id===state.taskSort)) state.taskSort="paper";
    if(state.policyShow==="custom" && state.policies.length && !taskPolicies.some(p=>state.policies.includes(p.id))) state.policyShow="all";
    for(const [id,key] of [["results-group","group"],["task-channel","channel"],["task-embodiment","emb"]]) $("#"+id).value=state[key];
    $("#task-channel").closest("label").hidden=state.metric==="efficiency";
    $("#ranking-reset").hidden=state.rankMetric==="sr" && state.rankChannel==="mean" && state.rankDir==="descending";
    $("#task-reset").hidden=state.metric==="sr" && state.channel==="mean" && !state.emb && state.taskSort==="paper" && state.policyShow==="all" && !state.taskDetail;
    root.querySelectorAll('[data-task-metric]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.taskMetric===state.metric));
  }
  function saveLocation(){
    const q=new URLSearchParams({group:state.group,rank_metric:state.rankMetric,rank_channel:state.rankChannel,rank_dir:state.rankDir,metric:state.metric,channel:state.channel});
    for(const [key,value] of [["emb",state.emb],["task_sort",state.taskSort!=="paper" ? state.taskSort : ""],["task_dir",state.taskSort!=="paper" ? state.taskDir : ""],["policy_show",state.policyShow!=="all" ? state.policyShow : ""],["policies",state.policies.join(",")],["task_detail",state.taskDetail]]) if(value) q.set(key,value);
    history.replaceState(null,"",location.pathname+"?"+q+location.hash);
  }
  function orderedPolicies(list,key,cid,direction="descending"){
    return R.overall.ordered(list,{rankMetric:key,rankChannel:cid,rankDir:direction});
  }
  function rankingPolicies(){
    const list=group();
    const ordered=orderedPolicies(list,state.rankMetric,state.rankChannel,state.rankDir);
    return {all:ordered,visible:ordered};
  }
  function matrixPolicies(){
    const ordered=orderedPolicies(metricPolicies(state.metric),state.rankMetric,state.rankChannel,state.rankDir);
    return state.policyShow==="custom" ? ordered.filter(p=>state.policies.includes(p.id)) : ordered;
  }
  function matrixTasks(){
    const list=tasks().filter(t=>!state.emb || t.emb===state.emb);
    return state.taskSort==="paper" ? list : M.sorted(list,{key:state.metric,direction:state.taskDir},t=>M.metric(state.taskSort,t.id,state.metric,state.channel));
  }
  function table(id,label,headers,rows,cls=""){
    return `<div class="explorer-table-wrap" role="region" aria-label="${label}" tabindex="0"><table id="${id}" class="policy-table ${cls}"><caption class="sr-only">${label}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const empty=message=>`<p class="results-empty">${message}</p>`;
  function renderRanking(){
    const {visible}=rankingPolicies();
    $("#overview-table").innerHTML=`<div class="explorer-table-wrap" role="region" aria-label="Policy Leaderboard" tabindex="0"><table id="overview-results" class="policy-table ranking-table">${R.overall.markup(visible,state)}</table></div>`;
    $("#ranking-label").textContent=R.overall.label(state);
    $("#ranking-updated").innerHTML=R.overall.updated(group());
    const total=group().length;
    $("#ranking-count").textContent=`${visible.length} ${visible.length===1 ? "policy" : "policies"}${visible.length!==total ? " shown · "+total+" total" : ""}`;
    $("#ranking-caption").textContent=R.overall.caption;
  }
  function metricCell(p,t,key,cid="mean",peers=null,summary=false){
    const r=M.metric(p.id,t.id,key,cid);
    const scale=key==="successes" ? M.channel(p.id,t.id,cid)?.episodes : 100;
    const heat=!summary && r.value!==null && key!=="efficiency" && Number.isFinite(scale) && scale>0;
    const canBest=cid==="mean" && M.comparable(p.id,t.id,key);
    const value=canBest ? R.marked(r,peers||M.peers(state.group,t.id,key),key) : cellValue(r,key,cid);
    return `<td class="${r.value===null ? "missing" : "value"}${summary ? " detail-summary" : ""}${heat ? " heat-cell" : ""}"${heat ? ` style="--cell-heat:${R.heat(r.value/scale)}"` : ""}>${value}</td>`;
  }
  function taskDetails(t,policies){
    const key=state.metric,channels=key==="efficiency" ? ["mean"] : [...B.CHANNELS,"mean"];
    const heading=c=>c==="mean" ? labels[key]+(key==="efficiency" ? "" : " (%)") : B.CHANNEL_LABEL[c];
    const summaryTitle=key==="efficiency" ? "Success-conditioned efficiency" : `${labels[key]}: four-channel mean (%)`;
    const value=p=>M.metric(p.id,t.id,key);
    const scored=M.sorted(policies.filter(p=>value(p).value!==null),{key,direction:"descending"},value);
    const unscored=M.sorted(policies.filter(p=>value(p).value===null),{key:"sr",direction:"descending"},p=>M.metric(p.id,t.id,"sr","full"));
    const ordered=[...scored,...unscored]
      .sort((a,b)=>Number(M.comparable(b.id,t.id,key))-Number(M.comparable(a.id,t.id,key)));
    const headers=`<th scope="col" class="rank-cell" title="Rank within this task by ${summaryTitle}">Rank</th><th scope="col" class="policy-name">Model</th>`+channels.map(c=>`<th scope="col" class="${c==="mean" ? "detail-summary " : ""}${c===state.channel ? "detail-channel-active" : ""}"${c==="mean" ? ` title="${summaryTitle}" aria-label="${summaryTitle}" aria-sort="descending"` : ""}>${heading(c)}${c==="mean" ? ' <span class="sort-indicator" aria-hidden="true">↓</span>' : ""}</th>`).join("");
    const rows=ordered.map(p=>{
      const rank=M.taskRank(p.id,t.id,key),medals=["🥇","🥈","🥉"],metal=["gold","silver","bronze"],medal=rank!==null && rank<=3;
      const rankLabel=rank===null ? "Unranked: task metric unavailable" : `Rank ${rank}${medal ? ": "+metal[rank-1]+" medal" : ""}`;
      return `<tr data-policy-row="${esc(p.id)}"><td class="rank-cell"><span class="rank-number${medal ? " rank-medal" : ""}" aria-label="${esc(rankLabel)}">${rank===null ? "—" : medal ? medals[rank-1] : rank}</span></td><th scope="row" class="policy-name"><div class="model-identity"><img class="model-logo" src="${esc(p.logoPath)}" alt="${esc(p.logoAlt)}" width="20" height="20" decoding="async"><a class="model-name" href="${esc(p.modelUrl)}" target="_blank" rel="noopener noreferrer">${policyTitle(p)}</a></div></th>${channels.map(c=>metricCell(p,t,key,c,null,c==="mean")).join("")}</tr>`;
    }).join("");
    return `<tr class="task-detail-row" id="task-detail-${esc(t.id)}"><td colspan="${policies.length+1}"><div class="task-detail"><h3><span class="task-detail-name">${esc(t.name)}</span> <span>${longLabels[key]}</span></h3>${table("task-metric-results",longLabels[key],headers,rows,"task-metric-table")}</div></td></tr>`;
  }
  function renderPicker(){
    const policies=orderedPolicies(metricPolicies(state.metric),state.rankMetric,state.rankChannel,state.rankDir);
    $("#policy-options").innerHTML=policies.map(p=>`<label><input type="checkbox" data-pick="${esc(p.id)}" ${state.policyShow==="all" || state.policies.includes(p.id) ? "checked" : ""}><span>${policyTitle(p)}</span></label>`).join("");
    const selected=matrixPolicies().length;
    $("#policy-choice-count").textContent=state.policyShow==="all" || selected===policies.length ? `All (${policies.length})` : `${selected} selected`;
  }
  function renderMatrix(){
    const policies=matrixPolicies(),list=matrixTasks();
    $("#task-matrix").style.setProperty("--task-policy-count",policies.length);
    const headers='<th scope="col" class="task-name">Task / Embodiment</th>'+policies.map(p=>`<th scope="col" aria-sort="${state.taskSort===p.id ? state.taskDir : "none"}"><button type="button" data-task-sort="${esc(p.id)}" title="Sort tasks by ${esc(p.label)}" aria-label="Sort tasks by ${esc(p.label)}">${policyTitle(p,` <span class="sort-indicator" aria-hidden="true">${state.taskSort===p.id ? state.taskDir==="descending" ? "↓" : "↑" : "↕"}</span>`)}</button></th>`).join("");
    const rows=list.map(t=>{
      const e=B.EMBODIMENTS.find(e=>e.id===t.emb),open=state.taskDetail===t.id;
      const peers=state.channel==="mean" ? M.peers(state.group,t.id,state.metric) : [];
      return `<tr data-task-row="${esc(t.id)}" class="${open ? "is-selected" : ""}"><th scope="row" class="task-name"><button type="button" data-task-open="${esc(t.id)}" aria-expanded="${open}"${open ? ` aria-controls="task-detail-${esc(t.id)}"` : ""} title="${open ? "Hide" : "Show"} channel details"><span class="task-toggle" aria-hidden="true">›</span><span><span class="policy-label">${esc(t.name)}</span><span class="policy-meta">${esc(e.name)}</span></span></button></th>${policies.map(p=>metricCell(p,t,state.metric,state.channel,peers)).join("")}</tr>`+(open ? taskDetails(t,policies) : "");
    }).join("");
    $("#task-matrix").innerHTML=!policies.length ? empty("No policies selected. Use Policies to select models or show all.") : !list.length ? empty("No matching tasks. Adjust the task filters.") : table("per-task-results","Per-Task Scores",headers,rows,"task-matrix-table");
    $("#task-count").textContent=`${list.length===tasks().length ? list.length : list.length+" / "+tasks().length} tasks`;
    const taskPolicy=group().find(p=>p.id===state.taskSort);
    const taskOrder=taskPolicy ? `${taskPolicy.label} · ${state.channel==="mean" ? "" : B.CHANNEL_LABEL[state.channel]+" "}${labels[state.metric]} ${state.taskDir==="descending" ? "↓" : "↑"}` : "benchmark order";
    $("#task-sort-label").textContent=`Tasks: ${taskOrder} · Models: overall ${R.overall.sortMetric(state)}`;
    $("#task-updated").innerHTML=R.overall.updated(group());
    $("#task-heat-key").hidden=state.metric==="efficiency";
    $("#task-best-key").hidden=state.channel!=="mean" && state.metric!=="efficiency";
    $("#task-best-label").textContent=`Best ${labels[state.metric]}`;
    $("#task-caption").textContent=state.metric==="efficiency" ? "NR: not reported · —: no successful rollout" : "NR: not reported";
    renderPicker();
  }
  function render(resetTable="",anchorSelector=null){
    // Keep the reader's position when metrics or inline details update.
    const positions=new Map([...root.querySelectorAll('.explorer-table-wrap > table[id]')].map(t=>[t.id,{top:t.parentElement.scrollTop,left:t.parentElement.scrollLeft}]));
    const anchor=anchorSelector ? $(anchorSelector) : null;
    const anchorTop=anchor ? anchor.getBoundingClientRect().top-anchor.closest("table").parentElement.getBoundingClientRect().top : null;
    syncControls();renderRanking();renderMatrix();saveLocation();
    for(const [id,pos] of positions){
      const wrap=$("#"+id)?.parentElement;
      if(wrap){wrap.scrollTop=id===resetTable ? 0 : pos.top;wrap.scrollLeft=pos.left;}
    }
    const next=anchorSelector ? $(anchorSelector) : null;
    if(next && anchorTop!==null){
      const wrap=next.closest("table").parentElement;
      wrap.scrollTop+=next.getBoundingClientRect().top-wrap.getBoundingClientRect().top-anchorTop;
    }
  }
  function resetTable(id,message){
    render(id);
    const wrap=$("#"+id)?.parentElement;
    if(wrap){wrap.scrollTop=0;wrap.scrollLeft=0;}
    announce(message);
  }
  function focusButton(attribute,value){[...root.querySelectorAll(`[${attribute}]`)].find(e=>e.getAttribute(attribute)===value)?.focus({preventScroll:true});}
  function toggleTask(id){
    state.taskDetail=state.taskDetail===id ? null : id;
    render("",`[data-task-row="${CSS.escape(id)}"]`);
    focusButton("data-task-open",id);
  }
  root.addEventListener("click",event=>{
    const taskButton=event.target.closest("[data-task-open]");
    if(taskButton){toggleTask(taskButton.dataset.taskOpen);return;}
    const row=event.target.closest("tr[data-task-row]");
    if(row && !event.target.closest("a,button,input,select,textarea") && !window.getSelection()?.toString()){
      toggleTask(row.dataset.taskRow);return;
    }
    const button=event.target.closest("button");if(!button) return;
    const d=button.dataset;
    if(d.rankColumn){
      R.overall.sort(state,d.rankColumn);
      render("overview-results");focusButton("data-rank-column",d.rankColumn);return;
    }
    if(d.taskMetric){state.metric=d.taskMetric;if(d.taskMetric==="efficiency") state.channel="mean";render();return;}
    if(d.taskSort){if(state.taskSort!==d.taskSort){state.taskSort=d.taskSort;state.taskDir="descending";}else if(state.taskDir==="descending"){state.taskDir="ascending";}else{state.taskSort="paper";state.taskDir="descending";}render("per-task-results");focusButton("data-task-sort",d.taskSort);return;}
  });
  root.addEventListener("change",event=>{
    const id=event.target.dataset.pick;if(!id) return;
    if(state.policyShow==="all") state.policies=group().map(p=>p.id);
    state.policies=event.target.checked ? [...new Set([...state.policies,id])] : state.policies.filter(p=>p!==id);state.policyShow="custom";render();focusButton("data-pick",id);
  });
  document.addEventListener("pointerdown",event=>{const picker=$(".policy-picker");if(picker.open && !picker.contains(event.target))picker.open=false;});
  root.addEventListener("keydown",event=>{if(event.key==="Escape")root.querySelectorAll('.policy-picker[open]').forEach(d=>{d.open=false;d.querySelector("summary").focus();});});
  for(const [id,key] of [["task-channel","channel"],["task-embodiment","emb"]]) $("#"+id).addEventListener("change",e=>{state[key]=e.target.value;render(id==="task-channel" ? "" : id==="task-embodiment" ? "per-task-results" : "overview-results");});
  $("#policies-all").addEventListener("click",()=>{state.policies=[];state.policyShow="all";$(".policy-picker").open=false;render();});
  $("#policies-none").addEventListener("click",()=>{state.policies=[];state.policyShow="custom";render();});
  $("#ranking-reset").addEventListener("click",()=>{
    Object.assign(state,{rankMetric:"sr",rankChannel:"mean",rankDir:"descending"});
    resetTable("overview-results","Overall Performance reset to defaults.");
  });
  $("#task-reset").addEventListener("click",()=>{
    Object.assign(state,{metric:"sr",channel:"mean",emb:"",taskSort:"paper",taskDir:"descending",policyShow:"all",policies:[],taskDetail:null});
    $(".policy-picker").open=false;
    resetTable("per-task-results","Per-Task Scores reset to defaults.");
  });
  $("#results-group").addEventListener("change",e=>{history.replaceState(null,"",location.pathname+"?group="+encodeURIComponent(e.target.value));readLocation();render();});
  function download(csv,name){
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=`bench2dex-${name}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce("CSV exported.");
  }
  $("#results-export-all").addEventListener("click",()=>download(M.csv(),"all-policies"));
  $("#results-share").addEventListener("click",async()=>{saveLocation();try{await navigator.clipboard.writeText(location.href);announce("View link copied.");}catch{$("#share-fallback").hidden=false;$("#share-url").value=location.href;$("#share-url").focus();$("#share-url").select();}});
  window.addEventListener("popstate",()=>{readLocation();render();});
  function revealSection(){const e=document.getElementById(location.hash.slice(1));if(e?.matches("details"))e.open=true;}
  document.querySelectorAll('a[href="#protocol-notes"]').forEach(a=>a.addEventListener("click",()=>{const e=document.getElementById(a.hash.slice(1));if(e?.matches("details"))e.open=true;}));
  window.addEventListener("hashchange",revealSection);
  readLocation();render();revealSection();
})();
