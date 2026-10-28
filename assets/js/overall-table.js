/* Shared Overall Performance table for the project home and leaderboard. */
(function(){
  "use strict";
  const B=window.BENCH,R=window.BenchResults,M=R.model,esc=R.escape;
  const columns=[
    ...B.CHANNELS.map(cid=>({id:cid,key:"sr",cid,label:B.CHANNEL_LABEL[cid],unit:"SR (%)"})),
    {id:"sr",key:"sr",cid:"mean",label:"SR",unit:"Mean (%)"},
    {id:"lscr",key:"lscr",cid:"mean",label:"LSCR",unit:"Mean (%)"},
    {id:"efficiency",key:"efficiency",cid:"mean",label:"Eff.",unit:"Ratio"}
  ];
  const policyTitle=p=>esc(p.variantLabel ? p.modelVersion : p.label)+(p.variantLabel ? `<span class="policy-variant">${esc(p.variantLabel)}</span>` : "");
  function ordered(list,state){
    return M.sorted(list,{key:state.rankMetric,direction:state.rankDir},p=>M.aggregateMetric(p.id,state.rankMetric,state.rankChannel))
      .sort((a,b)=>Number(M.aggregateEligible(b.id,state.rankMetric,state.rankChannel))-Number(M.aggregateEligible(a.id,state.rankMetric,state.rankChannel)));
  }
  function aggregateCell(p,{id,key,cid},state){
    const r=M.aggregateMetric(p.id,key,cid),active=key===state.rankMetric && cid===state.rankChannel;
    const peers=cid==="mean" ? M.peers(state.group,null,key) : [];
    let value=cid==="mean" && M.eligible(p.id,key) ? R.marked(r,peers,key) : esc(R.format(r,key,cid!=="mean"));
    const heat=cid!=="mean" && r.value!==null;
    return `<td class="${r.value===null ? "missing" : "value"}${id==="sr" ? " summary-start" : ""}${active ? " ranking-active" : ""}${heat ? " heat-cell" : ""}"${heat ? ` style="--cell-heat:${R.heat(r.value/100)}"` : ""}>${value}</td>`;
  }
  function markup(policies,state,assetPrefix=""){
    const identity='<th scope="col" rowspan="2" class="rank-cell">Rank</th><th scope="col" rowspan="2" class="policy-name">Model</th><th scope="col" rowspan="2" class="type-cell">Type</th><th scope="col" rowspan="2" class="contributor-cell">Contributor</th>';
    const headers=columns.map(c=>{
      const active=c.key===state.rankMetric && c.cid===state.rankChannel;
      const title=c.cid!=="mean" ? `${c.label} channel SR (%)` : c.key==="efficiency" ? "Success-conditioned efficiency" : `${c.label}: four-channel mean (%)`;
      const label=c.cid==="mean" && c.key!=="efficiency" ? `${c.label} (%)` : c.label;
      return `<th scope="col"${c.id==="sr" ? ' class="summary-start"' : c.id==="none" ? ' class="channel-start"' : ""} aria-sort="${active ? state.rankDir : "none"}"><button type="button" data-rank-column="${c.id}" title="${title}" aria-label="Sort by ${title}">${label}<span class="sort-indicator" aria-hidden="true">${active ? state.rankDir==="descending" ? "↓" : "↑" : "↕"}</span></button></th>`;
    }).join("");
    const rows=policies.map(p=>{
      const rank=M.aggregateRank(p.id,state.rankMetric,state.rankChannel);
      const medals=["🥇","🥈","🥉"],metal=["gold","silver","bronze"],medal=rank!==null && rank<=3;
      const rankLabel=rank===null ? "Unranked: selected metric not reported" : `Rank ${rank}${medal ? ": "+metal[rank-1]+" medal" : ""}`;
      return `<tr data-policy-row="${esc(p.id)}"><td class="rank-cell"><span class="rank-number${medal ? " rank-medal" : ""}" aria-label="${esc(rankLabel)}">${rank===null ? "—" : medal ? medals[rank-1] : rank}</span></td><th scope="row" class="policy-name"><div class="model-identity"><img class="model-logo" src="${esc(assetPrefix+p.logoPath)}" alt="${esc(p.logoAlt)}" width="26" height="26" decoding="async"><div><a class="model-name policy-label" href="${esc(p.modelUrl)}" target="_blank" rel="noopener noreferrer">${policyTitle(p)}</a></div></div></th><td class="type-cell"><span class="policy-type type-${esc(p.type.toLowerCase())}">${esc(p.type)}</span></td><td class="contributor-cell"><a href="${esc(p.contributorUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.contributor)}</a></td>${columns.map(c=>aggregateCell(p,c,state)).join("")}</tr>`;
    }).join("");
    return `<caption class="sr-only">Policy Leaderboard</caption><thead><tr class="ranking-groups">${identity}<th scope="colgroup" colspan="4" class="channel-group">SR by channel (%)</th><th scope="colgroup" colspan="3" class="summary-group">Overall</th></tr><tr class="ranking-columns">${headers}</tr></thead><tbody>${rows}</tbody>`;
  }
  function sort(state,id){
    const column=columns.find(c=>c.id===id);if(!column)return;
    state.rankDir=state.rankMetric===column.key && state.rankChannel===column.cid && state.rankDir==="descending" ? "ascending" : "descending";
    state.rankMetric=column.key;state.rankChannel=column.cid;
  }
  const sortMetric=state=>`${state.rankChannel==="mean" ? "" : B.CHANNEL_LABEL[state.rankChannel]+" "}${{sr:"SR",lscr:"LSCR",efficiency:"Eff."}[state.rankMetric]} ${state.rankDir==="descending" ? "↓" : "↑"}`;
  const label=state=>`Sorted by ${sortMetric(state)}${state.rankChannel==="mean" && state.rankMetric!=="efficiency" ? " · Four-channel mean" : ""}`;
  function updated(policies){
    // Use the recorded result update, never the visitor's current date.
    const latest=policies.map(p=>p.updatedAt).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d||"")).sort().at(-1);
    if(!latest)return "";
    const date=new Date(`${latest}T00:00:00+08:00`);
    const text=new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"Asia/Shanghai"}).format(date);
    return `Updated <time datetime="${latest}">${esc(text)}</time> <span>(UTC+8)</span>`;
  }
  R.overall={columns,ordered,markup,sort,sortMetric,label,updated,caption:"NR: not reported · GPT-6-Astra: Full SR only"};
})();
