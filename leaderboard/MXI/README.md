# MXI

MXI selects one π0.5 checkpoint for each Bench2Dex task. This entry is contributed by **1011.ai**; contact: **lizhehan@1011ai.cn**.

The entry combines **7 unchanged task checkpoints released by Bench2Dex** with **19 task-specific choices from our fine-tuned flow-matching, RTC, and multitask policies**. No additional fine-tuning is claimed for the seven released checkpoints. It reports a task-conditioned combination of policies, with one fixed checkpoint used for all four channels of each task.

## Results

Across 26 tasks and four channels, with 50 episodes per task/channel, the selected native logs contain **1,780 stable successes in 5,200 episodes**. Task-macro SR is **34.23076923076923%**, LSCR is **52.09134615384615%**, and success-conditioned efficiency is **0.9709853819551948**, averaged over 24 tasks with success. The derived Score is **48.55480574262887**. Tasks without success retain their measured SR and LSCR; their efficiency is undefined.

These are self-reported results prepared for maintainer review. They are not an accepted leaderboard rank. No weight files or training/inference code are distributed in this submission package.

## Selection and attribution

The checkpoint choices were made retrospectively using recorded evaluations. Starting from the previously audited best-SR fine-tuned choices, we compared those choices with our own runs of released Bench2Dex task checkpoints. Higher SR was preferred; when SR tied, the overall Score contribution from LSCR and efficiency determined the choice. No task's SR was decreased by these replacements. This is selection on evaluation scenes, not a claim of independent held-out model selection or a claim that a single checkpoint achieved the reported aggregate.

Tasks **03, 32, 43, 62, 67, 73, and 80** use the **unchanged Bench2Dex released π0.5 task checkpoints**, [Bench2Dex/policy_ckpt](https://huggingface.co/Bench2Dex/policy_ckpt), release directory `2000`, weights revision `773e65842bd36de1cbe951b0f52c865a87d41732`. Those results were produced by our original JAX deployment runs; they are not copied leaderboard percentages. All other selected results use our PyTorch deployments. Upstream model credit belongs to the Bench2Dex checkpoint release and the π0.5/OpenPI authors. Public checkpoint identifiers and the selection map are recorded in the results JSON.

## Evaluation protocol

Each task uses the official robot, 50 episodes per channel (None, Equi., Inv., Full), and episode indices 1–50. The base seed namespace is 100000000, except the Full channel's 200000000 namespace. The native task partition adds `task_id * 100000`, followed by `episode_index - 1`. Generalization uses the unseen split. Runs use CPU physics at 60 Hz, policy actions at 20 Hz, the original per-task execution budgets, 60 warmup physics steps, and reach-and-stop termination with each native task’s dwell: 0.5 seconds for 25 tasks and 3.0 seconds for Task67.

Flow-matching and released checkpoints predict and execute 20 actions per query. RTC checkpoints predict 20, execute 16, and retain a 4-action normalized prefix; denoising uses 10 steps. Native action/state dimensions, robot prompts, masks, and normalization contracts remain task-specific. All stable successes and genuine failures from the selected runs enter the metrics; no successful-episode-only selection is used.

The native metric schema is `core-v1.8-policy-step-query-split`. Efficiency uses physics steps, pooling successful episodes across the four channels before computing each task's expert/policy ratio; the overall efficiency averages only tasks with at least one success.

## Source versions and evidence

The earlier JAX runs recorded native commit `82e04a2a4e5b728a96ccf1ae7a546762d5a260c7` and their scene hashes. We located the exact recorded `run_policy.py` blob and compared it with the later PyTorch entry point: the difference is policy injection and the `main()` wrapper. The control loop, physical stepping, success conditions, robot modules, scene configurations, and metric code are unchanged in the source comparison. Earlier logs did not individually pin every success/robot file hash; the available commit, protocol, scene, and source-comparison evidence is retained for review.

`per_task_eval/` contains the selected native episode records and native-format summaries, plus sanitized original shards and their acceptance indexes. Fields and units are preserved. Private filesystem prefixes are consistently anonymized. The package retains all four channels for every selected task and identifies source checkpoint, backend, and execution horizon in its metadata.

Only the 50 canonical records in each task/channel directory enter the aggregate. `native_shards/` contains provenance copies, which must not be appended to those records or counted again. Each `accepted_indices.json` links the canonical records to original shard files and 1-based line numbers; canonical summaries were regenerated with the native writer, while the original shard summaries are also retained.

## Task selection

| Task | Checkpoint origin / training | Checkpoint step or release | Backend | Execute horizon | SR (%) | LSCR (%) | Eff. |
|---|---|---:|---|---:|---:|---:|---:|
| 03 | Bench2Dex released checkpoint; unchanged | release 2000 | JAX | 20 | 40.00 | 76.333333 | 1.088504 |
| 06 | 26-task joint flow-matching fine-tuning | 245,000 | PyTorch | 20 | 60.50 | 84.000000 | 0.961814 |
| 07 | Task-specific RTC fine-tuning | 16,000 | PyTorch | 16 | 72.50 | 84.500000 | 0.853768 |
| 08 | Task-specific RTC fine-tuning | 16,000 | PyTorch | 16 | 42.50 | 60.750000 | 1.287708 |
| 09 | Task-specific RTC fine-tuning | 16,000 | PyTorch | 16 | 60.50 | 91.250000 | 0.890533 |
| 12 | Task-specific flow-matching fine-tuning | 16,000 | PyTorch | 20 | 30.50 | 57.500000 | 1.012962 |
| 21 | 26-task joint flow-matching fine-tuning | 245,000 | PyTorch | 20 | 39.50 | 64.333333 | 0.952723 |
| 22 | Task-specific RTC fine-tuning | 16,000 | PyTorch | 16 | 87.50 | 93.625000 | 0.969172 |
| 24 | Task-specific RTC fine-tuning | 16,000 | PyTorch | 16 | 0.50 | 11.375000 | 0.952425 |
| 26 | Task-specific flow-matching fine-tuning | 16,000 | PyTorch | 20 | 14.00 | 47.750000 | 0.857178 |
| 27 | Task-specific RTC fine-tuning | 16,000 | PyTorch | 16 | 35.50 | 43.625000 | 0.999710 |
| 32 | Bench2Dex released checkpoint; unchanged | release 2000 | JAX | 20 | 24.50 | 36.000000 | 1.060843 |
| 34 | Task-specific RTC fine-tuning | 16,000 | PyTorch | 16 | 23.50 | 52.500000 | 1.044724 |
| 42 | 26-task joint flow-matching fine-tuning | 245,000 | PyTorch | 20 | 46.50 | 65.833333 | 0.921967 |
| 43 | Bench2Dex released checkpoint; unchanged | release 2000 | JAX | 20 | 4.50 | 28.000000 | 0.962960 |
| 44 | Task-specific flow-matching fine-tuning | 16,000 | PyTorch | 20 | 69.00 | 79.000000 | 1.031476 |
| 51 | Task-specific flow-matching fine-tuning | 16,000 | PyTorch | 20 | 53.00 | 62.000000 | 1.023323 |
| 60 | 26-task joint flow-matching fine-tuning | 245,000 | PyTorch | 20 | 13.50 | 16.375000 | 0.918612 |
| 61 | 26-task joint flow-matching fine-tuning | 245,000 | PyTorch | 20 | 27.50 | 51.333333 | 0.900525 |
| 62 | Bench2Dex released checkpoint; unchanged | release 2000 | JAX | 20 | 54.50 | 70.500000 | 0.996663 |
| 64 | Task-specific flow-matching fine-tuning | 16,000 | PyTorch | 20 | 16.00 | 27.875000 | 0.791292 |
| 67 | Bench2Dex released checkpoint; unchanged | release 2000 | JAX | 20 | 20.50 | 47.125000 | 0.895292 |
| 73 | Bench2Dex released checkpoint; unchanged | release 2000 | JAX | 20 | 0.00 | 8.000000 | NR (no success) |
| 76 | Task-specific flow-matching fine-tuning | 16,000 | PyTorch | 20 | 0.00 | 9.875000 | NR (no success) |
| 79 | Task-specific flow-matching fine-tuning | 16,000 | PyTorch | 20 | 8.00 | 21.250000 | 0.840384 |
| 80 | Bench2Dex released checkpoint; unchanged | release 2000 | JAX | 20 | 45.50 | 63.666667 | 1.089088 |

## Upstream references

- Bench2Dex project: https://bench2dex.github.io/
- Bench2Dex code and released-policy integration: https://github.com/Bench2Dex/Bench2Dex
- Leaderboard protocol and submission requirements: https://github.com/Bench2Dex/Bench2Dex-Leaderboard
- OpenPI: https://github.com/Physical-Intelligence/openpi

The `1011.ai` SVG included here is a plain-text wordmark for this entry, not an upstream logo.
