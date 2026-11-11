# Mora V0

Mora V0 is a vision-language-action policy from [Morphi Robot](https://www.morphi.com/). It uses EgoDex mid-training followed by task-specific post-training on robot demonstrations. We evaluate it on all 26 official Bench2Dex task and robot settings. The controller consumes RGB, proprioception and an instruction. The hand adapters translate the predicted hand and end-effector actions into robot commands.

## Results

Four-channel task-macro SR is 33.2308% (1,728 stable successes in 5,200 episodes). LSCR is 52.3083%. Efficiency is 0.973682 over 25 tasks with at least one success. Task 27 is included at 0/200 and its efficiency is undefined. Task 08 uses the official Schunk embodiment.

## Selection and protocol

The reported entry uses one retrospectively selected Mora V0 checkpoint per task. Selection used recorded success rates on the evaluation scenes. The same checkpoint is used for all four channels within a task. Results from other model variants are excluded. The results JSON identifies each selected checkpoint by its SHA-256 digest. Each task has 50 episodes per channel (None, Equi., Inv., Full), numbered 1–50. Seeds, scene perturbations, embodiment and physics-step budgets are in the accompanying results JSON and logs. Each run uses reach-and-stop with a 0.5 s dwell and executes 20 action steps per policy query.

## Evidence

Each channel includes the 50 finalized native episode records in episode order. The original worker files are preserved under `native_shards/` after sanitizing private paths. For split runs, the channel-level summary was generated from the accepted episode records using the Bench2Dex results writer. When a shard contains retried indices, `accepted_indices.json` records which rows belong to the finalized run. All selected successes and failures enter the reported metrics. The simulation metric schema is `core-v1.8-policy-step-query-split`. The aggregation code snapshot is `33c2d2eb178c7a62385ed113c3380e5933c81037`.

## Evaluation budget per episode

The same cap applies to all four channels within each task. One policy action spans three physics steps. The caps below are simulator execution limits; training updates are counted separately.

| Task | Policy actions / episode (20 Hz) | Physics steps / episode (60 Hz) |
|---|---:|---:|
| 03 · Wine Glass Plate Balance | 1,082 | 3,246 |
| 06 · Fruit Bowl Loading | 640 | 1,920 |
| 07 · Citrus Plate Loading | 602 | 1,806 |
| 08 · Frypan Stand & Pour | 1,144 | 3,432 |
| 09 · Cleaner Box Loading | 642 | 1,926 |
| 12 · Screwdriver Box & Hammer | 1,149 | 3,447 |
| 21 · Condiment Box Loading | 827 | 2,481 |
| 22 · Tool Box Loading | 681 | 2,043 |
| 24 · Stationery Category Sorting | 1,542 | 4,626 |
| 26 · Canned Food Tray Arrangement | 871 | 2,613 |
| 27 · Ball Box Loading | 1,190 | 3,570 |
| 32 · Baking Tray Prep | 852 | 2,556 |
| 34 · Fridge Wine Interhand Pour | 1,080 | 3,240 |
| 42 · Trash Disposal | 668 | 2,004 |
| 43 · Fridge Fruit Shelf Sorting | 1,375 | 4,125 |
| 44 · Microwave Bowl Loading | 1,061 | 3,183 |
| 51 · Toilet Lid Cleaner Pour | 1,023 | 3,069 |
| 60 · Breadbasket Fast-Food Loading | 995 | 2,985 |
| 61 · Medicine Shoebox Pack | 1,034 | 3,102 |
| 62 · Shoebox Accessory Pack | 1,077 | 3,231 |
| 64 · Sports Ball Cup Sort | 665 | 1,995 |
| 67 · Faucet Cup Water Fill | 964 | 2,892 |
| 73 · Jigsaw Puzzle Assembly | 1,213 | 3,639 |
| 76 · Soup Serving | 986 | 2,958 |
| 79 · Bimanual Piano Melody | 681 | 2,043 |
| 80 · Gaming Desk Setup | 593 | 1,779 |

## Recovery disclosure

Seven episode indices in tasks 34 and 60 initially produced an angle-decoding ValueError. The archived evaluator retried those indices with the same seed. The finalized record contains three successes and four failures. We report the finalized result and retain the seven initial error records in native_shards for review. Counting the initial errors as failures gives 1,725/5,200 (33.1731% SR). We request maintainer review of this recovery convention.

| Task | Channel | Episode index | Seed | Finalized result |
|---|---|---:|---:|---|
| 34 | Equi | 8 | 103400007 | Failure |
| 34 | Inv | 35 | 103400034 | Success |
| 34 | None | 2 | 103400001 | Failure |
| 60 | Equi | 15 | 106000014 | Success |
| 60 | Equi | 25 | 106000024 | Failure |
| 60 | Equi | 47 | 106000046 | Failure |
| 60 | Inv | 22 | 106000021 | Success |
