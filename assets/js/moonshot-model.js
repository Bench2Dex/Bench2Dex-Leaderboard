/* Data rules for the SR × LSCR plot; shared with its nonvisual tests. */
(function(){
  "use strict";
  const R=window.BenchResults,M=R.model;
  const channels=["mean","none","equi","inv","full"];
  const valid=value=>Number.isFinite(value) && value>=0 && value<=100;
  const name=entry=>entry.policy.label || entry.policy.modelVersion || entry.policy.id;
  const byName=(a,b)=>name(a).localeCompare(name(b)) || a.policy.id.localeCompare(b.policy.id);
  function data(groupId,channel="mean"){
    if(!M.protocols.some(protocol=>protocol.id===groupId)) throw new RangeError("Unknown moonshot evaluation group");
    if(!channels.includes(channel)) throw new RangeError("Unknown moonshot channel");
    const totalTasks=M.tasks(groupId).length;
    const entries=M.group(groupId).map(policy=>{
      const sr=M.aggregateMetric(policy.id,"sr",channel).value;
      const lscr=M.aggregateMetric(policy.id,"lscr",channel).value;
      const missing=[...(sr===null ? ["SR"] : []),...(lscr===null ? ["LSCR"] : [])];
      const eligible=valid(sr) && valid(lscr) && M.aggregateEligible(policy.id,"sr",channel) && M.aggregateEligible(policy.id,"lscr",channel);
      const reason=missing.length ? `${missing.join(" and ")} not reported`
        : !valid(sr) || !valid(lscr) ? "Scores outside 0–100%"
        : eligible ? "" : "Incomplete task coverage";
      return {
        policy,sr,lscr,
        fullSr:M.aggregateMetric(policy.id,"sr","full").value,
        srCoverage:M.aggregateCoverage(policy.id,"sr",channel),
        lscrCoverage:M.aggregateCoverage(policy.id,"lscr",channel),
        reason
      };
    });
    const plotted=entries.filter(entry=>!entry.reason).sort((a,b)=>b.sr-a.sr || b.lscr-a.lscr || byName(a,b));
    const unplotted=entries.filter(entry=>entry.reason).sort((a,b)=>{
      const av=valid(a.fullSr) ? a.fullSr : null,bv=valid(b.fullSr) ? b.fullSr : null;
      if(av===null || bv===null) return av===bv ? byName(a,b) : av===null ? 1 : -1;
      return bv-av || byName(a,b);
    });
    return {plotted,unplotted,totalTasks};
  }
  // The rocket follows the highest eligible four-channel mean SR, with LSCR
  // breaking score ties. Its position depends on published results, not UI state.
  const leader=groupId=>data(groupId,"mean").plotted[0] || null;
  R.moonshot={data,leader};
})();
