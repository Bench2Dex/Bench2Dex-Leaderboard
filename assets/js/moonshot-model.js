/* Independent policy and agent tracks on the same Score scale. */
(function(){
  "use strict";
  const R=window.BenchResults,M=R.model;
  const byName=(a,b)=>R.policyName(a.policy).localeCompare(R.policyName(b.policy))||a.policy.id.localeCompare(b.policy.id);
  function data(groupId,track="policy",policyScope="all"){
    if(!M.protocols.some(p=>p.id===groupId))throw new RangeError("Unknown moonshot evaluation group");
    const entries=M.group(groupId).filter(policy=>track==="agent" ? R.isAgent(policy)
      : !R.isAgent(policy) && R.inPolicyScope(policy,policyScope)).map(policy=>{
      const sr=M.aggregateMetric(policy.id,"sr").value,lscr=M.aggregateMetric(policy.id,"lscr").value,efficiency=M.aggregateMetric(policy.id,"efficiency").value;
      const score=M.score(policy.id).value;
      const missing=[["SR",sr],["LSCR",lscr],["Eff.",efficiency]].filter(([,v])=>v===null).map(([key])=>key);
      return {policy,sr,lscr,efficiency,score,fullSr:M.aggregateMetric(policy.id,"sr","full").value,fullLscr:M.aggregateMetric(policy.id,"lscr","full").value,reason:score!==null ? "" : missing.length ? `${missing.join(", ")} not reported` : "Incomplete task coverage"};
    });
    const scored=entries.filter(e=>e.score!==null).sort((a,b)=>b.score-a.score||byName(a,b));
    const plotted=scored.map(entry=>({...entry,rank:scored.findIndex(other=>other.score===entry.score)+1}));
    const unplotted=entries.filter(e=>e.score===null).sort((a,b)=>(b.fullSr??-1)-(a.fullSr??-1)||byName(a,b));
    return {plotted,unplotted,totalTasks:M.tasks(groupId).length};
  }
  const leader=(group,track)=>data(group,track).plotted[0]||null;
  R.moonshot={data,leader};
})();
