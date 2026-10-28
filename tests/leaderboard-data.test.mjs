import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { toRuntimeData, runtimeScript } from "../scripts/leaderboard-data.mjs";

const registry = JSON.parse(await readFile(new URL("../assets/data/leaderboard.json", import.meta.url), "utf8"));
const policyTemplate = JSON.parse(await readFile(new URL("../policy/policy_template/leaderboard_policy_template.json", import.meta.url), "utf8"));
const modelSource = await readFile(new URL("../assets/js/results-model.js", import.meta.url), "utf8");
const overallSource = await readFile(new URL("../assets/js/overall-table.js", import.meta.url), "utf8");
function model(data) {
  const context = vm.createContext({ window: { BENCH: data } });
  vm.runInContext(modelSource, context);
  return context.window.BenchResults.model;
}
function fullOnlyFixture() {
  const fixture = structuredClone(registry);
  fixture.policies = [fixture.policies.find(entry => entry.model.id === "GPT6_ASTRA_10X")];
  return fixture;
}

test("the registry supplies every policy, task, and named channel", () => {
  const data = toRuntimeData(registry);
  assert.equal(data.EVALUATION_POLICIES.length, registry.policies.length);
  assert.equal(data.EVALUATION_TASKS.length, registry.policies.length * registry.tasks.length);
  assert.equal(data.EVALUATION_CHANNELS.length, registry.policies.length * registry.tasks.length * 4);
  assert.deepEqual(data.CHANNEL_LABEL, { none: "None", equi: "Equi.", inv: "Inv.", full: "Full" });
});

test("Full-only results keep their reported channel score and no four-channel rank", () => {
  const data = toRuntimeData(fullOnlyFixture()), M = model(data);
  assert.equal(M.metric("GPT6_ASTRA_10X", "32", "sr", "full").value, 100);
  assert.equal(M.metric("GPT6_ASTRA_10X", "32", "sr").value, null);
  assert.equal(M.aggregateMetric("GPT6_ASTRA_10X", "sr", "mean").value, null);
  assert.equal(M.aggregateEligible("GPT6_ASTRA_10X", "sr", "full"), true);
  assert.equal(M.aggregateEligible("GPT6_ASTRA_10X", "sr", "mean"), false);
});

test("missing optional tasks, channels, and summaries become NR rather than zero", () => {
  const fixture = fullOnlyFixture(), policy = fixture.policies[0];
  policy.per_task = { "32": { channels: { Full: policy.per_task["32"].channels.Full } } };
  delete policy.overall;
  const M = model(toRuntimeData(fixture));
  for (const [task, channel] of [["32", "none"], ["26", "full"], ["32", "mean"]]) {
    const result = M.metric(policy.model.id, task, "sr", channel);
    assert.equal(result.value, null);
    assert.equal(result.status, "not-reported");
  }
  assert.equal(M.metric(policy.model.id, null, "sr").value, null);
});

test("zero successes, no-success efficiency, and unreported metrics stay distinct", () => {
  const M = model(toRuntimeData(registry));
  assert.equal(M.metric("GPT6_ASTRA_1X", "32", "sr", "full").value, 0);
  assert.equal(M.metric("GR00T_N17", "24", "efficiency").status, "no-success");
  assert.equal(M.metric("PHOENIX_MWA", "32", "efficiency").status, "not-reported");
});

test("published channel records omit redundant efficiency while pooled results remain", () => {
  const data = toRuntimeData(registry);
  for (const channel of data.EVALUATION_CHANNELS) {
    assert.equal("efficiency" in channel, false);
    assert.equal("efficiencyStatus" in channel, false);
  }
  const M = model(data);
  assert.equal(M.metric("GR00T_N17_TACTILE", "03", "efficiency").value, 1.0159);
  assert.equal(M.metric("GR00T_N17_TACTILE", null, "efficiency").value, 0.9496384615384615);
});

test("duplicate policy IDs, unknown channels, and impossible counts fail validation", () => {
  const duplicate = fullOnlyFixture();
  duplicate.policies.push(structuredClone(duplicate.policies[0]));
  assert.throws(() => toRuntimeData(duplicate), /duplicate policy ID/);
  const alias = fullOnlyFixture();
  alias.policies[0].per_task["32"].channels.cov_only = {};
  assert.throws(() => toRuntimeData(alias), /unknown channel/);
  const invalid = fullOnlyFixture();
  invalid.policies[0].per_task["32"].channels.Full.successes = 100;
  assert.throws(() => toRuntimeData(invalid), /invalid success count/);
});

test("the generated script initializes the standalone page without replacing the homepage catalog", () => {
  const script = runtimeScript(toRuntimeData(registry));
  const standalone = vm.createContext({ window: {} });
  vm.runInContext(script, standalone);
  assert.equal(standalone.window.BENCH, standalone.window.BenchLeaderboardData);
  const homepageCatalog = { homepageOnly: true };
  const homepage = vm.createContext({ window: { BENCH: homepageCatalog } });
  vm.runInContext(script, homepage);
  assert.equal(homepage.window.BENCH, homepageCatalog);
  assert.equal(homepage.window.BenchLeaderboardData.EVALUATION_POLICIES.length, registry.policies.length);
});

test("the submission template fits policies[] directly, retaining percent units and source paths", () => {
  assert.deepEqual(Object.keys(policyTemplate), ["model", "overall", "per_task", "evaluation"]);
  assert.equal(policyTemplate.model.id, "policy_template");
  assert.deepEqual(Object.keys(policyTemplate.per_task).sort(), registry.tasks.map(task => task.id).sort());
  assert.deepEqual(policyTemplate.evaluation.aggregation.units, { ...registry.units, steps: "physics_steps" });
  assert.equal(policyTemplate.evaluation.isTemplate, true);
  for (const task of Object.values(policyTemplate.per_task)) {
    assert.deepEqual(Object.keys(task.channels), registry.channels);
    assert.equal(task.mean.sr, null);
    for (const channel of Object.values(task.channels)) {
      assert.equal(channel.successes, null);
      assert.equal(channel.lscr, null);
      assert.equal("efficiency" in channel, false);
      assert.equal(channel.status, "not-reported");
    }
  }

  const entry = structuredClone(policyTemplate);
  entry.evaluation.isTemplate = false;
  entry.per_task["03"].channels.Full = {
    status: "reported", episodes: 50, successes: 10, lscr: 60,
    source: { runId: "reviewed-run", perEpisodeFile: "per_task_eval/03_wine_glass_plate_balance/Full/per_episode.jsonl", summaryFile: "per_task_eval/03_wine_glass_plate_balance/Full/summary.json" },
  };
  const fixture = structuredClone(registry);
  fixture.policies.push(entry);
  const data = toRuntimeData(fixture), M = model(data);
  assert.equal(M.metric(entry.model.id, "03", "sr", "full").value, 20);
  assert.equal(M.metric(entry.model.id, "03", "lscr", "full").value, 60);
  assert.equal(M.metric(entry.model.id, "03", "sr").value, null);
  assert.equal(M.aggregateEligible(entry.model.id, "sr", "mean"), false);
  assert.deepEqual(data.EVALUATION_CHANNELS.find(r => r.policyId === entry.model.id && r.taskId === "03" && r.channelId === "full").source, entry.per_task["03"].channels.Full.source);
  assert.equal(fixture.policies.at(-1).evaluation.isTemplate, false);
});

test("unscored policies follow Full SR descending without receiving a mean rank", () => {
  const data = toRuntimeData(registry);
  const context = vm.createContext({ window: { BENCH: data } });
  vm.runInContext(modelSource, context);
  vm.runInContext(overallSource, context);
  const { model: M, overall } = context.window.BenchResults;
  const group = M.group("standard"), state = { rankMetric: "sr", rankChannel: "mean", rankDir: "descending" };
  for (const rankDir of ["descending", "ascending"]) {
    const ids = Array.from(overall.ordered(group, { ...state, rankDir }), p => p.id);
    assert.deepEqual(ids.slice(-2), ["GPT6_ASTRA_10X", "GPT6_ASTRA_1X"]);
  }
  for (const id of ["GPT6_ASTRA_1X", "GPT6_ASTRA_10X"]) {
    assert.equal(M.aggregateMetric(id, "sr", "mean").value, null);
    assert.equal(M.aggregateRank(id, "sr", "mean"), null);
  }
  const fullAscending = Array.from(overall.ordered(group, { ...state, rankChannel: "full", rankDir: "ascending" }), p => p.id);
  assert.ok(fullAscending.indexOf("GPT6_ASTRA_1X") < fullAscending.indexOf("GPT6_ASTRA_10X"));
});

test("channel log summaries use the same metric fields and units as policy records", async () => {
  for (const [channel, directory] of [["None", "None"], ["Equi.", "Equi"], ["Inv.", "Inv"], ["Full", "Full"]]) {
    const summary = JSON.parse(await readFile(new URL(`../policy/policy_template/per_task_eval/03_wine_glass_plate_balance/${directory}/summary.json`, import.meta.url), "utf8"));
    assert.equal(summary.taskId, "03");
    assert.equal(summary.channel, channel);
    for (const key of ["status", "episodes", "successes", "lscr"]) {
      assert.equal(summary[key], policyTemplate.per_task["03"].channels[channel][key]);
    }
    assert.equal(summary.efficiency, null);
    assert.equal(summary.efficiencyStatus, "not-reported");
    assert.equal(summary.stepUnit, "physics_steps");
    assert.equal(summary.sr, null);
    assert.equal("stable_successes" in summary, false);
    assert.equal("efficiency_status" in summary, false);
  }
});
