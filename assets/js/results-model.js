/* Shared, DOM-independent reporting rules for the results explorer. */
(function(){
  "use strict";
  const finite = Number.isFinite;
  const statusLabels = { "not-evaluated":"Not evaluated", "not-reported":"NR", "not-applicable":"N/A", "no-success":"—" };
  const reading = (record,key)=>{
    const status=record?.[`${key}Status`] || (record?.status && record.status!=="reported" ? record.status : finite(record?.[key]) ? "reported" : record ? "not-reported" : "not-evaluated");
    return { value: status==="reported" && finite(record?.[key]) ? record[key] : null,
      status: status==="reported" && !finite(record?.[key]) ? "not-reported" : status };
  };
  const format = (r,metric,channel=false)=>r.value===null ? (statusLabels[r.status] || "NR")
    : metric==="successes" ? String(r.value) : metric==="efficiency" ? r.value.toFixed(3) : `${r.value.toFixed(channel && metric==="lscr" ? 2 : 1)}%`;
  const heat = fraction=>{
    const t=Math.max(0,Math.min(1,fraction));
    return `rgb(${Math.round(234-204*t)},${Math.round(243-95*t)},${Math.round(244-78*t)})`;
  };
  const escape = value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const best = (r,peers)=>r.value!==null && peers.some(p=>p.value!==null) && r.value===Math.max(...peers.filter(p=>p.value!==null).map(p=>p.value));
  const marked = (r,peers,metric,channel=false)=>best(r,peers) ? `<strong class="best-value">${format(r,metric,channel)}</strong>` : escape(format(r,metric,channel));
  function create(data){
    const unique=(rows,key,label)=>{
      const keys=rows.map(key);
      if(new Set(keys).size!==keys.length) throw new Error(`Duplicate ${label} record`);
    };
    unique(data.EVALUATION_POLICIES,r=>r.id,"policy");
    unique(data.EVALUATION_PROTOCOLS,r=>r.id,"protocol");
    unique(data.EVALUATION_CHANNELS,r=>JSON.stringify([r.policyId,r.taskId,r.channelId]),"channel");
    unique(data.EVALUATION_TASKS,r=>JSON.stringify([r.policyId,r.taskId]),"task");
    unique(data.EVALUATION_SUMMARIES,r=>r.policyId,"summary");
    const policies=[...data.EVALUATION_POLICIES].sort((a,b)=>a.displayOrder-b.displayOrder);
    const channelMap=new Map(data.EVALUATION_CHANNELS.map(r=>[JSON.stringify([r.policyId,r.taskId,r.channelId]),r]));
    const taskMap=new Map(data.EVALUATION_TASKS.map(r=>[JSON.stringify([r.policyId,r.taskId]),r]));
    const summaries=new Map(data.EVALUATION_SUMMARIES.map(r=>[r.policyId,r]));
    const protocols=data.EVALUATION_PROTOCOLS;
    const group = id=>policies.filter(p=>p.protocolId===id);
    const tasks = id=>protocols.find(p=>p.id===id).taskIds.map(tid=>data.TASKS.find(t=>t.id===tid));
    const channel = (pid,tid,cid)=>channelMap.get(JSON.stringify([pid,tid,cid]));
    const task = (pid,tid)=>taskMap.get(JSON.stringify([pid,tid]));
    const summary = pid=>summaries.get(pid) || {status:"not-reported"};
    function metric(pid,tid,key,cid="mean"){
      if(tid===null) return reading(summary(pid),key);
      if(cid==="mean" || key==="efficiency") return reading(task(pid,tid) || (data.CHANNELS.some(c=>channel(pid,tid,c)?.status==="reported") ? {status:"not-reported"} : undefined),key);
      const record=channel(pid,tid,cid);
      if(key!=="sr") return reading(record,key);
      const successes=reading(record,"successes"), episodes=reading(record,"episodes");
      return successes.value!==null && episodes.value>0 ? {value:successes.value/episodes.value*100,status:"reported"}
        : {value:null,status:successes.status==="reported" ? "not-reported" : successes.status};
    }
    if(policies.some(p=>!protocols.some(g=>g.id===p.protocolId))) throw new Error("Unknown evaluation protocol");
    if(protocols.some(p=>!p.taskIds.length || new Set(p.taskIds).size!==p.taskIds.length || p.taskIds.some(id=>!data.TASKS.some(t=>t.id===id)))) throw new Error("Invalid protocol task set");
    const policyFor=pid=>policies.find(p=>p.id===pid);
    const published=pid=>policyFor(pid)?.externalReport && !!policyFor(pid).sourceUrl;
    const protocolFor=pid=>protocols.find(g=>g.id===policyFor(pid)?.protocolId);
    const protocolReady=pid=>{
      const g=protocolFor(pid);
      return !!(g?.taskSetVersion && g.terminationVersion && g.expertReferenceVersion && Number.isInteger(g.episodesPerChannel) && g.episodesPerChannel>0);
    };
    function completeChannel(pid,tid,cid,key){
      const r=channel(pid,tid,cid),g=protocolFor(pid),n=reading(r,"episodes").value;
      if(!protocolReady(pid) || n!==(published(pid) ? policyFor(pid).episodesPerChannel : g.episodesPerChannel)) return false;
      const value=reading(r,key==="lscr" ? "lscr" : "successes").value;
      return value!==null && value>=0 && (key==="lscr" ? value<=100 : Number.isInteger(value) && value<=n);
    }
    function completeTask(pid,tid,key="sr"){
      // A paper-reported mean can be complete even when its breakdown is pending.
      // Mean-only SR requires explicit scope and matching task/channel budgets.
      const record=task(pid,tid);
      // Published four-channel means are preserved without inventing rollout counts.
      if(published(pid) && ["sr","lscr"].includes(key) && record?.[`${key}Scope`]==="four-channel-mean"){
        const value=metric(pid,tid,key).value;
        return value!==null && value>=0 && value<=100;
      }
      if(key==="sr" && record?.srScope==="four-channel-mean"){
        const g=protocolFor(pid),value=metric(pid,tid,key).value;
        return protocolReady(pid) && record.srEpisodes===data.CHANNELS.length*g.episodesPerChannel
          && data.CHANNELS.every(c=>reading(channel(pid,tid,c),"episodes").value===g.episodesPerChannel)
          && value!==null && value>=0 && value<=100;
      }
      // A reported LSCR mean still requires complete corresponding SR records.
      if(key==="lscr" && record?.lscrScope==="four-channel-mean" && record.lscrEpisodes===data.CHANNELS.length*protocolFor(pid).episodesPerChannel){
        const value=metric(pid,tid,key).value;
        return data.CHANNELS.every(c=>completeChannel(pid,tid,c,"sr")) && value!==null && value>=0 && value<=100;
      }
      if(!data.CHANNELS.every(c=>completeChannel(pid,tid,c,key==="efficiency" ? "sr" : key))) return false;
      const r=metric(pid,tid,key);
      if(key==="efficiency"){
        const count=data.CHANNELS.reduce((sum,c)=>sum+reading(channel(pid,tid,c),"successes").value,0);
        return count===0 ? r.status==="no-success" : r.value!==null && r.value>0;
      }
      return r.value!==null && r.value>=0 && r.value<=100;
    }
    const coverageCache=new Map(),eligibleCache=new Map();
    const coverage=(pid,key="sr")=>{
      const cacheKey=JSON.stringify([pid,key]);
      if(!coverageCache.has(cacheKey)) coverageCache.set(cacheKey,tasks(protocolFor(pid).id).filter(t=>completeTask(pid,t.id,key)).length);
      return coverageCache.get(cacheKey);
    };
    function eligible(pid,key="sr"){
      const cacheKey=JSON.stringify([pid,key]);
      if(eligibleCache.has(cacheKey)) return eligibleCache.get(cacheKey);
      const s=summary(pid),all=tasks(protocolFor(pid).id),r=metric(pid,null,key);
      let ok=protocolReady(pid) && s.taskCount===all.length && s.scope==="task-macro" && coverage(pid,key)===all.length && r.value!==null;
      if(ok) ok=key==="efficiency" ? r.value>0 && s.efficiencyTaskCount===all.filter(t=>metric(pid,t.id,"efficiency").value!==null).length : r.value>=0 && r.value<=100;
      eligibleCache.set(cacheKey,ok);return ok;
    }
    const comparable=(pid,tid,key,cid="mean")=>tid===null ? eligible(pid,key) : cid==="mean" || key==="efficiency" ? completeTask(pid,tid,key) : completeChannel(pid,tid,cid,key);
    function peers(protocolId,tid,key,cid="mean"){
      return group(protocolId).filter(p=>comparable(p.id,tid,key,cid))
        .map(p=>metric(p.id,tid,key,cid));
    }
    const rank=(pid,key="sr")=>!eligible(pid,key) ? null : 1+group(protocolFor(pid).id).filter(p=>eligible(p.id,key) && metric(p.id,null,key).value>metric(pid,null,key).value).length;
    const taskRank=(pid,tid,key="sr")=>metric(pid,tid,key).value===null || !comparable(pid,tid,key) ? null
      : 1+group(protocolFor(pid).id).filter(p=>comparable(p.id,tid,key) && metric(p.id,tid,key).value>metric(pid,tid,key).value).length;
    // Channel rankings use reported task-macro summaries, never rounded row averages.
    const aggregateMetric=(pid,key="sr",cid="mean")=>{
      if(cid==="mean") return metric(pid,null,key);
      const value=summary(pid)[key==="sr" ? "channelSr" : key==="lscr" ? "channelLscr" : ""]?.[data.CHANNELS.indexOf(cid)];
      return {value:finite(value) ? value : null,status:finite(value) ? "reported" : "not-reported"};
    };
    const aggregateCoverage=(pid,key="sr",cid="mean")=>{
      if(cid==="mean") return coverage(pid,key);
      const cacheKey=JSON.stringify([pid,key,cid]);
      if(published(pid) && key==="sr" && Number.isInteger(summary(pid).channelTaskCounts?.[data.CHANNELS.indexOf(cid)]))
        return summary(pid).channelTaskCounts[data.CHANNELS.indexOf(cid)];
      if(!coverageCache.has(cacheKey)) coverageCache.set(cacheKey,tasks(protocolFor(pid).id).filter(t=>completeChannel(pid,t.id,cid,key)).length);
      return coverageCache.get(cacheKey);
    };
    const aggregateEligible=(pid,key="sr",cid="mean")=>{
      if(cid==="mean") return eligible(pid,key);
      const cacheKey=JSON.stringify([pid,key,cid]);
      if(eligibleCache.has(cacheKey)) return eligibleCache.get(cacheKey);
      const s=summary(pid),value=aggregateMetric(pid,key,cid).value,n=tasks(protocolFor(pid).id).length;
      const ok=key!=="efficiency" && protocolReady(pid) && s.scope==="task-macro" && s.taskCount===n && aggregateCoverage(pid,key,cid)===n && value!==null && value>=0 && value<=100;
      eligibleCache.set(cacheKey,ok);return ok;
    };
    const aggregateRank=(pid,key="sr",cid="mean")=>!aggregateEligible(pid,key,cid) ? null : 1+group(protocolFor(pid).id).filter(p=>aggregateEligible(p.id,key,cid) && aggregateMetric(p.id,key,cid).value>aggregateMetric(pid,key,cid).value).length;
    function sorted(list,sort,get){
      if(!sort.key) return [...list].sort((a,b)=>a.displayOrder-b.displayOrder);
      return [...list].sort((a,b)=>{
        const av=get(a,sort.key).value,bv=get(b,sort.key).value;
        if(av===null || bv===null) return av===bv ? a.displayOrder-b.displayOrder : av===null ? 1 : -1;
        return (sort.direction==="ascending" ? av-bv : bv-av) || a.displayOrder-b.displayOrder;
      });
    }
    function csv({policyIds=policies.map(p=>p.id),taskIds=null,summaryOnly=false,metricKey=null,channelId=null}={}){
      const header=["scope","policy_id","policy","inputs","protocol","task_id","task","embodiment","channel","status","successes","successes_status","episodes","episodes_status","sr_percent","sr_status","lscr_percent","lscr_status","efficiency","efficiency_status","task_count","efficiency_task_count","model_version","checkpoint","training_setting","result_version","source_url","updated_at","task_set_version","termination_version","expert_reference_version","lscr_scope","lscr_episodes","sr_scope","sr_episodes","evaluation_setting","episodes_per_reported_channel","step_budget_multiplier","type","contributor","model_url","model_logo"];
      header.push(...data.CHANNELS.map(c=>`summary_sr_${c}_percent`),...data.CHANNELS.map(c=>`summary_lscr_${c}_percent`));
      const rows=[header];
      const number=(r,key,isChannel=false)=>r.value===null ? "" : key==="successes" || key==="episodes" ? r.value : r.value.toFixed(key==="efficiency" ? 3 : key==="lscr" && isChannel ? 2 : 1);
      for(const p of policyIds.map(id=>policies.find(p=>p.id===id)).filter(Boolean)){
        const base=[p.id,p.label,p.inputs,p.protocolId];
        const append=(scope,t,c,r)=>{
          const sr=metric(p.id,t?.id??null,"sr",c),lscr=metric(p.id,t?.id??null,"lscr",c),eff=metric(p.id,t?.id??null,"efficiency");
          const include=k=>!metricKey || metricKey===k;
          const emb=data.EMBODIMENTS.find(e=>e.id===t?.emb)?.name||"";
          rows.push([scope,...base,t?.id||"",t?.name||"",emb,c,r?.status||"not-evaluated",
            c!=="mean" && include("sr") ? number(reading(r,"successes"),"successes") : "",
            c!=="mean" && include("sr") ? reading(r,"successes").status : "",
            c!=="mean" ? number(reading(r,"episodes"),"episodes") : "",
            c!=="mean" ? reading(r,"episodes").status : "",
            include("sr") ? number(sr,"sr") : "",include("sr") ? sr.status : "",
            include("lscr") ? number(lscr,"lscr",c!=="mean") : "",include("lscr") ? lscr.status : "",
            c==="mean" && include("efficiency") ? number(eff,"efficiency") : "",c==="mean" && include("efficiency") ? eff.status : "",
            t ? "" : r?.taskCount??"",t ? "" : r?.efficiencyTaskCount??"",
            p.modelVersion||"",p.checkpoint||"",p.trainingSetting||"",p.resultVersion||"",p.sourceUrl||"",p.updatedAt||"",
            p.externalReport ? "" : protocolFor(p.id).taskSetVersion||"",p.externalReport ? "" : protocolFor(p.id).terminationVersion||"",p.externalReport ? "" : protocolFor(p.id).expertReferenceVersion||"",
            c==="mean" ? r?.lscrScope||"" : "",c==="mean" ? r?.lscrEpisodes??"" : "",
            c==="mean" ? r?.srScope||"" : "",c==="mean" ? r?.srEpisodes??"" : "",
            p.evaluationSetting||protocolFor(p.id).description,p.externalReport ? p.episodesPerChannel??"" : protocolFor(p.id).episodesPerChannel,
            p.externalReport ? p.stepBudgetMultiplier??"" : 1,p.type||"",p.contributor||"",p.modelUrl||"",p.logoPath||"",
            ...data.CHANNELS.map((_,i)=>!t && finite(r?.channelSr?.[i]) ? r.channelSr[i].toFixed(1) : ""),
            ...data.CHANNELS.map((_,i)=>!t && finite(r?.channelLscr?.[i]) ? r.channelLscr[i].toFixed(2) : "")]);
        };
        if(!summaryOnly){
          for(const t of tasks(p.protocolId).filter(t=>!taskIds || taskIds.includes(t.id))){
            if(!channelId || channelId!=="mean") for(const c of data.CHANNELS.filter(c=>!channelId || channelId===c)) append("channel",t,c,channel(p.id,t.id,c));
            if(!channelId || channelId==="mean") append("task-four-channel",t,"mean",task(p.id,t.id));
          }
        }
        if(!taskIds && !channelId) append(summary(p.id)?.scope||"unreported-summary",null,"mean",summary(p.id));
      }
      // Quote all fields; neutralize spreadsheet formulas in future text labels.
      const quote=value=>'"'+String(value).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
      return "\uFEFF"+rows.map(row=>row.map(quote).join(",")).join("\r\n")+"\r\n";
    }
    return { policies,protocols,group,tasks,channel,task,summary,metric,coverage,peers,eligible,comparable,rank,taskRank,aggregateMetric,aggregateCoverage,aggregateEligible,aggregateRank,sorted,csv,
      totalEpisodes:data.EVALUATION_CHANNELS.reduce((sum,r)=>sum+(reading(r,"episodes").value||0),0) };
  }
  window.BenchResults={create,reading,format,heat,escape,best,marked};
  window.BenchResults.model=create(window.BenchLeaderboardData||window.BENCH);
})();
