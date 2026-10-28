# 🧪 Evaluation logs

For each evaluated task/channel, submit `per_episode.jsonl` and `summary.json`. The Task 03 folders provide examples; copy them for the remaining evaluations and replace all placeholders.

Use JSON channel names **`None`, `Equi.`, `Inv.`, `Full`** with folders `None/`, `Equi/`, `Inv/`, `Full/`. Keep one selected run per task/channel and include both successful and failed episodes.

## per_episode.jsonl

One JSON object per episode:

| Field | Required content |
| :--- | :--- |
| `task_id`, `channel`, `run_id` | Task/channel and selected run; match the summary and policy JSON's `source` |
| `episode_index`, `episode_seed` | Unique episode index within the run and its seed |
| `stable_success` | Boolean outcome |
| `latched_stage_completion_rate` | Final progress, **0–1**, including failures |
| `steps_to_stable_success` | Positive physics steps on success; `null` on failure |
| `expert_time_step` | Task expert reference in physics steps |

Replace the `is_template` placeholder row with real episode records. If a source field is unavailable, mark the affected metric unreported and explain why.

## summary.json

Fill the template from the episode records and set `isTemplate` to `false`. Record `taskId`, `channel`, `runId`, counts (`episodes`, `successes`, `failures`), metrics, expert/step statistics, and physics/control rates.

```text
sr         = 100 × successes / episodes
lscr       = 100 × mean(latched_stage_completion_rate)
efficiency = expertTimeStep / meanSuccessfulSteps
```

`successfulStepSum` and `meanSuccessfulSteps` use successful episodes only. SR/LSCR are percentages **0–100**; Eff. is a ratio. With no successes, use `efficiency: null` and `efficiencyStatus: "no-success"`; unreported metrics remain `null`.

Link both files through each channel's `source` in [the policy results JSON](../leaderboard_policy_template.json) (update the link after renaming). See [aggregation rules](../../README.md#-metrics-and-missing-values) for task and overall scores.
