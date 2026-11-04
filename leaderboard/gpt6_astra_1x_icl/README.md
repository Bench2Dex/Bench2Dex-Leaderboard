# GPT-6 Astra — 1× + ICL

This entry reports the **Full / unseen** Bench2Dex channel for GPT-6 Astra with
frozen per-task in-context preparation. The policy uses RGB camera observations,
proprioception, and a task description; the model runs with max reasoning effort.
Task-related preparation is frozen before test episodes, and each test episode
uses an isolated model session. The evaluation uses the upstream stable-success
and latched-stage metrics at 60 Hz physics and 20 Hz control.

[Technical report](https://www.sensenova.ai/has-gpt-6-astra-achieved-embodied-intelligence)
· [SenseNova-RoboRSI project](https://github.com/OpenSenseNova/SenseNova-RoboRSI)

## Result and coverage

- **Stable success rate:** 68/260 = **26.15%**.
- **Latched stage completion rate:** **48.77%**, averaged equally over 26 tasks.
- **Coverage:** 26 tasks × 10 Full-channel episodes = 260 episodes. The reference
  protocol uses 50 episodes per task and channel.
- **Efficiency:** not reported because the retained aggregate evidence does not
  establish the successful-step/expert-reference inputs for every selected episode.
- **Other channels:** None, Equi., and Inv. were not evaluated in this cohort;
  the four-channel mean is therefore not reported.

## Evaluation protocol

The selected indices 5–14 form a 260-episode Full-channel cohort. Seventeen damaged outcomes use same-index certified replacements. Task 61 episode 8 was additionally rerun at its original index and seed because its original native evaluator log was lost. The rerun's first valid outcome was selected regardless of success; the original recorded success and 100% LSCR remain historical evidence, not the selected score. The cohort is an amended reporting selection.

The official 1× task budget is `ceil(1.5 × expert_time_step / 3)` policy steps,
with three physics steps per action row. The JSON gives each task's actual 1×
budget, the 1× allowance, seeds, and episode indices.
The two entries must be interpreted as separate evaluation settings.

The 1× source cohort includes provenance-selected damage replacements; a full
archive certification was not completed. Historical Task 22/26 extensions and
the partly unresolved Task 51 preparation provenance are disclosed limitations.

The linked Hugging Face dataset entry includes the selected native Bench2Dex
evaluator rows, sanitized single-episode source logs and summaries under
`source_runs/`, and a SHA-256 provenance manifest. The per-task summaries are
recomputed with the upstream Bench2Dex summary writer from the selected rows.
