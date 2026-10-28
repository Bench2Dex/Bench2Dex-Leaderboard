import { readFile, mkdir, cp, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, dirname, join, resolve } from "node:path";
import vm from "node:vm";
import { loadLeaderboardData, runtimeScript } from "./leaderboard-data.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const output = join(root, "dist");
const data = await loadLeaderboardData(root);
const context = vm.createContext({ window: { BENCH: data, BenchLeaderboardData: data } });
vm.runInContext(await readFile(join(root, "assets/js/results-model.js"), "utf8"), context);

// Only clear the fixed, generated output directory inside this repository.
if (dirname(output) !== root || basename(output) !== "dist") throw new Error("Invalid build output path");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ["index.html", ".nojekyll", "assets"]) {
  await cp(join(root, name), join(output, name), { recursive: true });
}
await writeFile(join(output, "assets/js/evaluations.js"), runtimeScript(data));
console.log(`Built ${data.EVALUATION_POLICIES.length} policies and ${data.TASKS.length} tasks from assets/data/leaderboard.json`);
