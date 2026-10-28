# 🏆 Bench2Dex Leaderboard

Official policy rankings and per-task results for Bench2Dex.

[🌐 Leaderboard](https://bench2dex.github.io/Bench2Dex-Leaderboard/) · [🏠 Project](https://bench2dex.github.io/) · [💻 Code](https://github.com/Bench2Dex/Bench2Dex) · [📄 Paper](https://arxiv.org/abs/2609.15726)

## 🤝 Contribute results

We welcome PRs with new policies, adaptations, and model variants evaluated on Bench2Dex.

- **Encouraged:** SR, LSCR, Eff., and episode logs for all four channels: **None · Equi. · Inv. · Full**.
- **Minimum:** Full-channel results and episode logs. List all 26 task settings and mark missing evaluations.
- **Reference budget:** 50 episodes per task/channel (1,300 for Full; 5,200 for four channels). Report actual counts and protocol differences.
- **Privacy and permissions:** sanitize PR descriptions and all submitted files, and confirm you are authorized to publish them. Follow the [privacy and permissions requirements](policy/README.md#-privacy-and-permissions).

## 📦 Submit a policy

1. Copy [policy/policy_template/](policy/policy_template/README.md) to `policy/<policy_id>/`.
2. Rename the results file to `leaderboard_<policy_id>.json`, matching `model.id`, and complete the README, results, and logs.
3. Open a PR against **main**, summarizing coverage and any protocol differences.

```text
policy/<policy_id>/
├── README.md
├── leaderboard_<policy_id>.json
└── per_task_eval/
    └── <task_id>_<task_name>/
        └── <channel>/
            ├── per_episode.jsonl
            └── summary.json
```

See the [submission requirements](policy/README.md) for required model information, data fields, and metrics, and the [log format](policy/policy_template/per_task_eval/README.md) for episode records. Every reported score must be traceable to the submitted logs.

## 🔓 Share weights and code

Open model weights and reproducible inference code are encouraged. Policy integrations and evaluation improvements are also welcome as PRs to [Bench2Dex](https://github.com/Bench2Dex/Bench2Dex); link related code PRs in your submission.

## 🗂️ Published data

[assets/data/leaderboard.json](assets/data/leaderboard.json) is the single maintained results file. Reviewed policy objects are merged into `policies[]`; both the leaderboard and project homepage load data generated from this registry.
