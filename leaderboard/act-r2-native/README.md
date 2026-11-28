# ACT (r2 native-embodiment)

Contributor: **Termitech-Dex**

Behavior-cloning (ACT) policies trained on Bench2Dex teleoperation demonstrations, evaluated on all 26 tasks × 4 channels in the r2 round using each task's **native robot embodiment**.

## Results

- Overall (task-macro, four-channel mean): SR 7.52%, LSCR 25.79%, pooled Eff 0.962.
- Tasks 24 (Stationery Category Sorting) and 67 (Faucet Cup Water Fill) use the official Revo2 ACT baseline weights; the other 24 tasks are trained from scratch on their native embodiments (6000 epochs per task).
- Strongest tasks: 09 Cleaner Box Loading (SR 20.5%), 06 Fruit Bowl Loading (19.0%), 44 Microwave Bowl Loading (31.0%).

## Evaluation protocol

- Reference protocol: 26 tasks × 4 channels (None / Equi. / Inv. / Full) × 50 episodes = 5200 episodes.
- Each channel was executed by two parallel environment workers of 25 episodes each, merged into one 50-episode result with continuous episode indices and identical seed policy (`episode_seed = base_seed + episode_index - 1`). No episode was dropped or replaced; all failures remain in the denominators.
- Termination: `reach_and_stop`, success dwell 0.5 s, native per-task execution budgets (see `max_episode_steps` in the submitted logs).
- Metric schema: `core-v1.8-policy-step-query-split`. SR = successful episodes / 50; LSCR = mean native `latched_stage_completion_rate` including failures; Eff = expert time / mean time to stable success pooled over successful episodes from all four channels.
- Deviation from the single-run reference: the two-worker merge described above. No other protocol deviations. Original per-episode logs and summaries are submitted to the Hugging Face leaderboard dataset with absolute paths, internal IPs, URLs, and emails redacted; metric fields, units, episode counts, and seeds are preserved.
