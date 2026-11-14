# Phoenix-MWA (w. Pretrain)

**Anyverse & OpenPhoenix**

Phoenix-MWA jointly predicts future visual states and robot actions from RGB observations, robot state, language and embodiment identity. It combines Wan appearance latents with Phoenix Encoder–CS-VAE geometric and semantic latents, using interacting video and action experts. This entry reports the pretrained model after task-group post-training on Bench2Dex demonstrations.

[Project](https://openphoenix-team.github.io/Phoenix-pages/) · [Code](https://github.com/Anyverse-Dynamics/Phoenix-MWA) · [Models](https://huggingface.co/AnyverseDynamics) · [Contributions](https://openphoenix-team.github.io/Phoenix-pages/#contributions-heading)

## Evaluation

26 tasks, 12 arm–hand combinations, four channels, 50 episodes per task/channel (5,200 episodes). The evaluated policies use RGB, proprioception and language. Thirteen task-group checkpoints are evaluated at post-training step 20,000; the task-to-checkpoint mapping and individual training configurations are recorded in the linked evaluation metadata.

| Metric | Result |
| --- | ---: |
| None SR | 54.2% |
| Equi. SR | 38.5% |
| Inv. SR | 44.1% |
| Full SR | 45.6% |
| Four-channel mean SR | 45.6% |
| Four-channel mean LSCR | 65.6% |
| Efficiency (25 tasks with success) | 0.9025 |

The results JSON contains full-precision scores, protocol settings, source-log references and metric-revision metadata. [Evaluation logs and metadata](https://huggingface.co/datasets/Bench2Dex/Leaderboard/tree/main/phoenix-mwa).

## Attribution

Advisers: Qichao Zhang, Haoran Li, Dongbin Zhao.

Project leads: Yupeng Zheng, Zhongpu Xia.

Core contributors: Yupeng Zheng, Chaoyue Li, Linbo Wang, Xiang Li, Secant, Zebin Xing.

The complete contribution roles and ordering are listed on the [project page](https://openphoenix-team.github.io/Phoenix-pages/#contributions-heading).

Correspondence: zhengyupeng18@mails.ucas.ac.cn.

Task 09 LSCR was recomputed offline from saved 20 Hz states. Task 27 and Task 42 retain the original ball-in-box criterion and stage order, respectively.
