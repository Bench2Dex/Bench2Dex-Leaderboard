# UniTacWAM

UniTacWAM is a unified visuo-tactile world action model: one model, with a unified action space, drives both parallel-jaw grippers and a wide range of dexterous hands. This entry reports its Bench2Dex results, with a single checkpoint for all 26 tasks. Paper: arXiv (coming soon). Code: https://github.com/NTU-SPACE-Lab/UniTacWAM.



## Evaluation

- Bench2Dex commit `cf83e86`, 26 tasks × 4 channels (None / Equi. / Inv. / Full) × 50 episodes, native seeds and budgets,
  unseen generalization split, `reach_and_stop` success protocol, 10 denoising steps, full 32-step chunk executed.
- IK: the default bridge IK on 15 tasks; on the 11 tasks with 7-DoF arms (03 09 22 26 32 51 61 62 64 73 79) the bridge IK
  runs in a GWP-style mode (joint-limit preference and re-solve on large joint jumps). The checkpoint is the same everywhere.
- Episodes interrupted by infrastructure were resumed with the same seeds; no scored episode was replaced and every failure
  stays in the denominators.

| | SR | LSCR | Eff. | Score |
|---|---:|---:|---:|---:|
| Overall (four-channel mean) | 65.44 | 83.54 | 0.985 | 76.89 |

Logs: `per_task_eval/<task>/<channel>/{per_episode.jsonl, summary.json}` (original Bench2Dex outputs; private absolute asset
paths rewritten to the relative `dex2bench_dataset/...`).

The native logs use the `gr00t_n15_tactile_cross` runner label. The runner's policy bridge forwarded observations to the UniTacWAM inference server for checkpoint step 25738. [Author clarification](https://github.com/Bench2Dex/Bench2Dex-Leaderboard/pull/11)

Tasks 21, 22, 27, 32, 60, and 64 report LSCR under the stage rules in `cf83e86`, before [the stage rule update](https://github.com/Bench2Dex/Bench2Dex/commit/05d3657eb5075f288433b8f6aec2751ac620dc6c).
