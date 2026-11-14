# MXI — independently executed self-finetuned evaluations

![1011.ai](logo.png)

Contributor: **1011.ai** · Contact: **lizhehan@1011ai.cn**

This update provides the standalone results requested by the Bench2Dex reviewer. **Every task checkpoint was fine-tuned by 1011.ai. No unmodified official Bench2Dex task checkpoint is used in this version.** It replaces the earlier mixed-origin submission. The earlier combination was intended as a task-conditioned deployment comparison; this update isolates our fine-tuned policies for a clearer comparison.

Different tasks use their respective fine-tuned checkpoints; one fixed checkpoint serves all four channels for each task. The policies include single-task flow-matching/RTC fine-tunes and 26-task joint fine-tunes. The results were computed from independently executed native evaluations, not copied from published scoreboard entries. Existing complete evaluation runs are reported here; this is **not** a fresh held-out confirmation experiment or a single-checkpoint claim. Checkpoint identities and execution horizons are recorded in `leaderboard_MXI.json`.

## Results

All 26 tasks × four channels ×50 episodes = **5,200 complete episodes**, including every success and failure. SR **36.865385%**; LSCR **54.783654%**; efficiency **0.970366548** over 24 tasks with successful episodes; Score/MR **50.945733**.

| Task | SR (%) | LSCR (%) | Efficiency |
|---|---:|---:|---:|
| 03 | 39.00 | 78.333333 | 1.074390 |
| 06 | 60.50 | 84.000000 | 0.961814 |
| 07 | 72.50 | 84.500000 | 0.853768 |
| 08 | 42.50 | 60.750000 | 1.287708 |
| 09 | 60.50 | 91.250000 | 0.890533 |
| 12 | 47.00 | 71.375000 | 1.014938 |
| 21 | 39.50 | 64.333333 | 0.952723 |
| 22 | 87.50 | 93.625000 | 0.969172 |
| 24 | 0.50 | 11.375000 | 0.952425 |
| 26 | 14.00 | 47.750000 | 0.857178 |
| 27 | 35.50 | 43.625000 | 0.999710 |
| 32 | 15.50 | 44.250000 | 1.001917 |
| 34 | 23.50 | 52.500000 | 1.044724 |
| 42 | 53.00 | 67.000000 | 0.961034 |
| 43 | 4.50 | 24.625000 | 0.929962 |
| 44 | 76.00 | 83.625000 | 1.033474 |
| 51 | 65.50 | 77.666667 | 1.032314 |
| 60 | 29.00 | 32.625000 | 0.947680 |
| 61 | 32.50 | 50.000000 | 0.931895 |
| 62 | 55.50 | 68.333333 | 0.957556 |
| 64 | 28.50 | 45.500000 | 0.788420 |
| 67 | 20.50 | 43.750000 | 0.906046 |
| 73 | 0.00 | 9.125000 | — |
| 76 | 0.00 | 9.875000 | — |
| 79 | 8.00 | 21.250000 | 0.840384 |
| 80 | 47.50 | 63.333333 | 1.099033 |

## Evaluation protocol and evidence

Native unseen split, reach-and-stop success checking,fixed episode seeds and budgets,60 Hz physics/20 Hz control. Model horizon 20; RTC executes 16 with prefix 4; other policies execute 20; 10 denoising steps. Task 67 requires 3.0 s success dwell; the other 25 tasks use 0.5 s. Task SR/LSCR are averaged equally; efficiency pools successful episodes across channels within each task,then averages over tasks with success. Score =0.45×SR+0.45×LSCR+10×efficiency. The recorded source-comparability limits remain disclosed in the metadata.

The companion Hugging Face PR contains native-format per-episode logs,summaries,accepted episode indices,and source shards. Only private filesystem roots and service addresses are anonymized; numeric outcomes are unchanged. Each task has all 50 fixed episode indices in every channel. Review acceptance and a merged log revision remain pending.

GitHub metadata PR: https://github.com/Bench2Dex/Bench2Dex-Leaderboard/pull/6

Hugging Face native logs PR: https://huggingface.co/datasets/Bench2Dex/Leaderboard/discussions/6
