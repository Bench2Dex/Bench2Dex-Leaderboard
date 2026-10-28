import { readFile, mkdir, cp, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import vm from "node:vm";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
await mkdir(output, { recursive: true });
for (const name of ["index.html", ".nojekyll", "assets"]) {
  await cp(join(root, name), join(output, name), { recursive: true });
}

const context = vm.createContext({ window: {} });
for (const name of ["data.js", "results-model.js"]) {
  vm.runInContext(await readFile(join(root, "assets/js", name), "utf8"), context);
}
const data = context.window.BENCH;
const payload = {
  CHANNELS: data.CHANNELS,
  TASKS: data.TASKS.map(({ id, name, emb }, displayOrder) => ({ id, name, emb, displayOrder })),
  EMBODIMENTS: data.EMBODIMENTS.map(({ id, name }) => ({ id, name })),
};
for (const key of ["EVALUATION_PROTOCOLS", "EVALUATION_POLICIES", "EVALUATION_CHANNELS", "EVALUATION_TASKS", "EVALUATION_SUMMARIES"]) {
  payload[key] = data[key];
}
const script = "/* Shared live leaderboard data for the project homepage. */\nwindow.BenchLeaderboardData=" + JSON.stringify(payload) + ";\n";
await writeFile(join(output, "assets/js/evaluations.js"), script);
console.log(`Built ${data.EVALUATION_POLICIES.length} policies and ${data.TASKS.length} tasks in ${output}`);
