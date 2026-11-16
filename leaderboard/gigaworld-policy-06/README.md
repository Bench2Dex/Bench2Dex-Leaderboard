# GigaWorld-Policy-0.6

**Contributor: [GigaAI](https://gigaai.cc/)** · **Type: World-Action Model (WAM)**

[GigaWorld-Policy project](https://open-gigaai.github.io/giga-world-policy/) · [GigaAI organization](https://github.com/open-gigaai)

GigaWorld-Policy-0.6 is evaluated here using one multi-task checkpoint, epoch 5 / step 12,870, across all 26 Bench2Dex tasks.

## Results

| None | Equi. | Inv. | Full | Overall SR | Overall LSCR | Overall Eff. |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 55.38 | 48.23 | 51.38 | 50.46 | 51.37 | 70.91 | 0.962 |

50 episodes per task/channel; 5,200 episodes in total, with 2,671 successes. All 60 scored IK failures remain in the denominators. SR and LSCR are percentages; efficiency is an uncapped ratio. The JSON retains full precision.

## Evaluation protocol

- Inputs: RGB, proprioception and task instruction. Custom GWP integration with the Drive v5 IK/execution adapter and robot-base EEF80 actions.
- Prediction/execution horizon: 32/32; one action every three physics steps. Denoising steps: 10; flow steps: 5; CFG: 1.
- Native reach-and-stop evaluation, with per-task execution budgets and success dwell recorded in the JSON and logs (task 67: 3 seconds; other tasks: 0.5 seconds).
- SR and LSCR are equally averaged over four channels and 26 tasks. Efficiency pools successful episodes across channels within each task, then averages task-level expert/policy step ratios.
- Scored episodes are not replaced. Original native shards were merged into the 50-episode channel outputs in the previously prepared submission export. The exact historical worker benchmark commit is not asserted.

## Evaluation records

The HF submission contains 104 pairs of native `per_episode.jsonl` and `summary.json` under `per_task_eval/`. Private asset-path prefixes are replaced with `assets/dex2bench_dataset/`; native fields, units, seeds, numeric values and outcomes are unchanged.

Checkpoint SHA256: `afed58631710411829692e0f9d5ce618a5f2866c2d239482c7315eb1113be56b`.

The linked project page introduces the model family. This submission does not publish the evaluated checkpoint or its evaluation integration code.
