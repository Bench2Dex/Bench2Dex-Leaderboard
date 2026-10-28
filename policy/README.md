# 📦 Policy submission requirements

Copy [policy_template/](policy_template/README.md) to `policy/<policy_id>/`. Name the results file **`leaderboard_<policy_id>.json`**, matching `model.id` exactly. For example: `policy/my_policy/leaderboard_my_policy.json`.

**All four channels are encouraged; Full is the minimum.** Keep all 26 task entries and mark missing evaluations.

## 🔒 Privacy and permissions

- **Sanitize before submitting:** remove credentials/tokens, personal or confidential information, private file paths, and internal URLs from PR titles/descriptions, documentation, logs, and media. Check linked content as well.
- **Confirm disclosure rights:** publish only content you are authorized to share, consistent with applicable privacy requirements, licenses, and data-use terms.
- **Preserve evaluation integrity:** retain metric values, episode coverage, and source mappings. Use consistent anonymized run IDs or paths where needed so scores remain traceable to the submitted logs.

## 📝 Model README

Include only these required items, in any layout:

- **Model:** name, version/checkpoint, and input modalities; distinguish tactile variants or inference budgets.
- **Attribution:** evaluator/contributing organization and official model or project URL.
- **Evaluation:** tasks/channels, episode counts, and protocol differences; detailed settings may be linked from the results JSON.
- **Reproduction:** Bench2Dex commit and evaluation command, or a link to the relevant code/configuration.

Authors are free to add method introductions, figures, videos, project links, and citations. We encourage sharing weights and inference code.

## 🗂️ Results JSON

Submit one policy object with the same fields and units as a `policies[]` entry in [assets/data/leaderboard.json](../assets/data/leaderboard.json). Retain the template structure; no catalog or array wrapper is needed.

| Field | Content |
| :--- | :--- |
| `model` | Identity, version, inputs, evaluator (`contributor`), type, URLs, logo, and `protocolId` |
| `overall` | Four-channel `sr`, `lscr`, pooled `efficiency`, `efficiencyTaskCount`, and named `channelSr`, `channelLscr`, `channelTaskCounts` maps |
| `per_task.<id>.channels.<channel>` | `status`, `episodes`, `successes`, `lscr`, and log `source` |
| `per_task.<id>.mean` | Four-channel SR/LSCR, pooled efficiency, scopes, counts, and statuses |
| `evaluation` | Protocol, coverage, and aggregation details; set `isTemplate` to `false` when complete |

Use `model.protocolId: "standard"` for the reference task set. Task IDs follow the registry catalog; maintainers assign `model.displayOrder` when merging. The template contains all 26 tasks and example log files for Task 03; add files for every evaluated task/channel.

Use JSON channel names **`None`, `Equi.`, `Inv.`, `Full`**. Their folders are `None/`, `Equi/`, `Inv/`, `Full/`; the last period is omitted for Windows compatibility. `mean` is derived and has no run directory.

Each reported channel's `source` identifies its selected run and files, with paths relative to the policy directory:

```json
{
  "runId": "SELECTED_RUN_ID",
  "perEpisodeFile": "per_task_eval/03_wine_glass_plate_balance/Full/per_episode.jsonl",
  "summaryFile": "per_task_eval/03_wine_glass_plate_balance/Full/summary.json"
}
```

Include successful and failed episodes; select one run per task/channel. Unevaluated channels use `source: null`. See the [log format](policy_template/per_task_eval/README.md).

## 📏 Metrics and missing values

| Metric | Per task/channel | Four-channel task result |
| :--- | :--- | :--- |
| **SR (%)** | `100 × successes / episodes` | Equal mean of four channel scores |
| **LSCR (%)** | `100 × mean(latched_stage_completion_rate)` over all episodes | Equal mean of four channel scores |
| **Eff.** | `expert_time_step / mean(successful steps_to_stable_success)` | Pool successful episodes before calculating the ratio |

SR/LSCR summaries use **0–100**; raw episode progress uses **0–1**. Eff. is a positive ratio and may exceed 1. Policy and expert step counts must both use **physics steps**.

Overall SR/LSCR weight tasks equally. Overall Eff. averages tasks with success; report their count in `efficiencyTaskCount`. Channel efficiency remains in the log summaries; the policy JSON stores task and overall pooled efficiency.

- **Missing:** use `null` (NR), never a substitute zero. Set record `status` to `reported` when results are available, otherwise `not-reported`.
- **No successes:** SR is 0; efficiency is `null` with `efficiencyStatus: "no-success"` (—). An unreported efficiency uses `not-reported`.
- **Coverage:** `overall.taskCount` is the 26-task scope; `channelTaskCounts` records completed tasks. Efficiency valid-task counts are `null` when unreported and 0 for an evaluated scope without successes.
- **Aggregates:** channel-wide scores require all 26 tasks; four-channel means require all four channels. Leave unsupported aggregates `null`, and never use Full SR as a four-channel mean.
