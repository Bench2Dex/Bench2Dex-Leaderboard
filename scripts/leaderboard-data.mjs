import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const CHANNEL_IDS = { "None": "none", "Equi.": "equi", "Inv.": "inv", "Full": "full" };
const channelNames = Object.keys(CHANNEL_IDS);
const missingChannel = () => ({ status: "not-reported", episodes: null, successes: null, lscr: null });
const missingMean = () => ({ status: "not-reported", sr: null, lscr: null, efficiency: null });
const requireValue = (condition, message) => { if (!condition) throw new Error(`leaderboard.json: ${message}`); };
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

function unique(rows, label) {
  requireValue(Array.isArray(rows), `${label} must be an array`);
  const ids = rows.map(row => row?.id);
  requireValue(ids.every(id => typeof id === "string" && id.length > 0), `${label} need nonempty IDs`);
  requireValue(new Set(ids).size === ids.length, `duplicate ${label} ID`);
}
function checkMetrics(record, label) {
  requireValue(isObject(record), `${label} must be an object`);
  for (const key of ["sr", "lscr"]) {
    const value = record[key];
    requireValue(value == null || Number.isFinite(value) && value >= 0 && value <= 100, `${label}.${key} must be a percentage or null`);
  }
  requireValue(record.efficiency == null || Number.isFinite(record.efficiency) && record.efficiency > 0, `${label}.efficiency must be a positive ratio or null`);
}
function channelArray(value, label) {
  requireValue(isObject(value), `${label} must use named channel keys`);
  requireValue(Object.keys(value).every(name => channelNames.includes(name)), `${label} has an unknown channel`);
  return channelNames.map(name => value[name] ?? null);
}

export function toRuntimeData(registry) {
  requireValue(registry?.schema_version === "1.0", "unsupported schema_version");
  requireValue(registry.units?.sr === "percent" && registry.units?.lscr === "percent" && registry.units?.efficiency === "ratio", "published units must be percent / percent / ratio");
  requireValue(JSON.stringify(registry.channels) === JSON.stringify(channelNames), "channels must be None, Equi., Inv., Full in that order");
  unique(registry.tasks, "task");
  unique(registry.embodiments, "embodiment");
  unique(registry.protocols, "protocol");
  requireValue(Array.isArray(registry.policies), "policies must be an array");
  unique(registry.policies.map(entry => entry?.model), "policy");
  const taskIds = new Set(registry.tasks.map(task => task.id));
  const embodimentIds = new Set(registry.embodiments.map(embodiment => embodiment.id));
  const protocolIds = new Set(registry.protocols.map(protocol => protocol.id));
  for (const task of registry.tasks) requireValue(embodimentIds.has(task.emb), `unknown embodiment for task ${task.id}`);
  for (const protocol of registry.protocols) {
    requireValue(Array.isArray(protocol.taskIds) && protocol.taskIds.length > 0 && new Set(protocol.taskIds).size === protocol.taskIds.length && protocol.taskIds.every(id => taskIds.has(id)), `invalid task set for protocol ${protocol.id}`);
  }
  const data = {
    CHANNELS: Object.values(CHANNEL_IDS),
    CHANNEL_LABEL: Object.fromEntries(Object.entries(CHANNEL_IDS).map(([name, id]) => [id, name])),
    TASKS: structuredClone(registry.tasks),
    EMBODIMENTS: structuredClone(registry.embodiments),
    EVALUATION_PROTOCOLS: structuredClone(registry.protocols),
    EVALUATION_POLICIES: [], EVALUATION_CHANNELS: [], EVALUATION_TASKS: [], EVALUATION_SUMMARIES: [],
  };
  for (const entry of registry.policies) {
    const model = structuredClone(entry.model);
    requireValue(protocolIds.has(model.protocolId), `unknown protocol for ${model.id}`);
    requireValue(isObject(entry.per_task), `per_task must be an object for ${model.id}`);
    requireValue(Object.keys(entry.per_task).every(id => taskIds.has(id)), `unknown task for ${model.id}`);
    data.EVALUATION_POLICIES.push(model);
    const overall = structuredClone(entry.overall ?? missingMean());
    checkMetrics(overall, `${model.id}.overall`);
    for (const key of ["channelSr", "channelLscr", "channelTaskCounts"]) {
      if (overall[key] == null) continue;
      overall[key] = channelArray(overall[key], `${model.id}.overall.${key}`);
      requireValue(overall[key].every(value => value === null || Number.isFinite(value) && value >= 0 && (key === "channelTaskCounts" ? Number.isInteger(value) && value <= registry.tasks.length : value <= 100)), `invalid ${key} for ${model.id}`);
    }
    data.EVALUATION_SUMMARIES.push({ ...overall, policyId: model.id });
    for (const task of registry.tasks) {
      const record = entry.per_task[task.id] ?? {};
      requireValue(isObject(record) && (record.channels == null || isObject(record.channels)), `invalid channels for ${model.id}/${task.id}`);
      requireValue(Object.keys(record.channels ?? {}).every(name => channelNames.includes(name)), `unknown channel for ${model.id}/${task.id}`);
      const mean = structuredClone(record.mean ?? missingMean());
      checkMetrics(mean, `${model.id}/${task.id}/mean`);
      data.EVALUATION_TASKS.push({ ...mean, policyId: model.id, taskId: task.id });
      for (const [name, id] of Object.entries(CHANNEL_IDS)) {
        const channel = structuredClone(record.channels?.[name] ?? missingChannel());
        checkMetrics(channel, `${model.id}/${task.id}/${name}`);
        requireValue(channel.episodes == null || Number.isInteger(channel.episodes) && channel.episodes >= 0, `invalid episode count for ${model.id}/${task.id}/${name}`);
        requireValue(channel.successes == null || Number.isInteger(channel.successes) && channel.successes >= 0 && (channel.episodes == null || channel.successes <= channel.episodes), `invalid success count for ${model.id}/${task.id}/${name}`);
        data.EVALUATION_CHANNELS.push({ ...channel, policyId: model.id, taskId: task.id, channelId: id });
      }
    }
  }
  return data;
}

export async function loadLeaderboardData(root) {
  return toRuntimeData(JSON.parse(await readFile(join(root, "assets/data/leaderboard.json"), "utf8")));
}

export function runtimeScript(data) {
  return "/* Generated from assets/data/leaderboard.json. Do not edit. */\nwindow.BenchLeaderboardData=" + JSON.stringify(data) + ";\nif(!window.BENCH)window.BENCH=window.BenchLeaderboardData;\n";
}
