# GPT-6 Astra — 10× + ICL

This entry reports the **Full / unseen** Bench2Dex channel for GPT-6 Astra with
frozen per-task in-context preparation. The policy uses RGB camera observations,
proprioception, and a task description; the model runs with max reasoning effort.
Task-related preparation is frozen before test episodes, and each test episode
uses an isolated model session. The evaluation uses the upstream stable-success
and latched-stage metrics at 60 Hz physics and 20 Hz control.

[Technical report](https://www.sensenova.ai/has-gpt-6-astra-achieved-embodied-intelligence)
· [SenseNova-RoboRSI project](https://github.com/OpenSenseNova/SenseNova-RoboRSI)

## Result and coverage

- **Stable success rate:** 48/78 = **61.54%**.
- **Latched stage completion rate:** **72.46%**, averaged equally over 26 tasks.
- **Coverage:** 26 tasks × 3 Full-channel episodes = 78 episodes. The reference
  protocol uses 50 episodes per task and channel.
- **Efficiency:** not reported because the retained aggregate evidence does not
  establish the successful-step/expert-reference inputs for every selected episode.
- **Other channels:** None, Equi., and Inv. were not evaluated in this cohort;
  the four-channel mean is therefore not reported.

## Evaluation protocol

The fixed indices 5–7 form a 78-episode subset of the 1× cohort. Valid outcomes were carried forward; timeout failures were extended to a total allowance of 10× the original task budget. The action prefix was replayed in a reinitialized simulator with boundary checks. This is an approximate replay extension, not an exact simulator checkpoint restoration.

The official 1× task budget is `ceil(1.5 × expert_time_step / 3)` policy steps,
with three physics steps per action row. The JSON gives each task's actual 1×
budget, the 10× total allowance, seeds, and episode indices.
The two entries must be interpreted as separate evaluation settings.

The 1× source cohort includes provenance-selected damage replacements; a full
archive certification was not completed. Historical Task 22/26 extensions and
the partly unresolved Task 51 preparation provenance are disclosed limitations.

The linked Hugging Face dataset entry includes the selected native Bench2Dex
evaluator rows, sanitized single-episode source logs and summaries under
`source_runs/`, and a SHA-256 provenance manifest. The per-task summaries are
recomputed with the upstream Bench2Dex summary writer from the selected rows.
