# ME-Dex 1.5

ME-Dex 1.5 is a tactile-aware world action model that jointly predicts video, tactile signals, and actions. Building on the link between contact forces and robot motion reflected in tactile signals, it combines autoregressive temporal modeling with flow matching to model visual, tactile, and action representations, allowing tactile information to guide action generation.

We replayed Bench2Dex demonstrations in simulation to collect three-axis tactile observations for training. We trained a single model across all 26 tasks for 60,000 steps, followed by 20,000 steps of fine-tuning for each task.

During evaluation, the policy receives RGB camera views, proprioception, and the instruction provided in the official scene description. To match the official evaluation protocol, we set force inputs to zero while keeping the tactile expert active.

The project page and code will be available soon.

## Bench2Dex results

We evaluated the task-specific checkpoints on [the official Bench2Dex revision `c269f24b`](https://github.com/Bench2Dex/Bench2Dex/tree/c269f24bd39bd973e157a16c3c9c666cf5f43efc).

| Tasks | Episodes | Stable successes | SR | LSCR | Eff. | Score |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 26 | 5,200 | 3,047 | 58.5962% | 76.3125% | 0.979473 | 70.5036 |

### Per-task results

| ID | Task | Stable successes / episodes | SR | LSCR | Eff. | Score |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 03 | Wine Glass Plate Balance | 90 / 200 | 45.0000% | 87.8333% | 1.048083 | 70.2558 |
| 06 | Fruit Bowl Loading | 174 / 200 | 87.0000% | 97.8750% | 0.930058 | 92.4943 |
| 07 | Citrus Plate Loading | 183 / 200 | 91.5000% | 97.5000% | 0.837078 | 93.4208 |
| 08 | Frypan Stand & Pour | 188 / 200 | 94.0000% | 96.2500% | 1.313465 | 98.7471 |
| 09 | Cleaner Box Loading | 145 / 200 | 72.5000% | 93.7500% | 0.909235 | 83.9049 |
| 12 | Screwdriver Box & Hammer | 132 / 200 | 66.0000% | 80.5000% | 0.980098 | 75.7260 |
| 21 | Condiment Box Loading | 157 / 200 | 78.5000% | 95.0000% | 0.928141 | 87.3564 |
| 22 | Tool Box Loading | 142 / 200 | 71.0000% | 82.6250% | 0.941639 | 78.5476 |
| 24 | Stationery Category Sorting | 61 / 200 | 30.5000% | 58.5000% | 0.999484 | 50.0448 |
| 26 | Canned Food Tray Arrangement | 111 / 200 | 55.5000% | 75.7500% | 0.931362 | 68.3761 |
| 27 | Ball Box Loading | 97 / 200 | 48.5000% | 62.7500% | 0.920494 | 59.2674 |
| 32 | Baking Tray Prep | 79 / 200 | 39.5000% | 54.7500% | 0.970917 | 52.1217 |
| 34 | Fridge Wine Interhand Pour | 99 / 200 | 49.5000% | 76.0000% | 1.012193 | 66.5969 |
| 42 | Trash Disposal | 105 / 200 | 52.5000% | 85.5000% | 0.938799 | 71.4880 |
| 43 | Fridge Fruit Shelf Sorting | 89 / 200 | 44.5000% | 63.0000% | 0.971438 | 58.0894 |
| 44 | Microwave Bowl Loading | 181 / 200 | 90.5000% | 95.0000% | 1.018788 | 93.6629 |
| 51 | Toilet Lid Cleaner Pour | 158 / 200 | 79.0000% | 84.0000% | 1.106688 | 84.4169 |
| 60 | Breadbasket Fast-Food Loading | 133 / 200 | 66.5000% | 88.6250% | 0.946621 | 79.2725 |
| 61 | Medicine Shoebox Pack | 125 / 200 | 62.5000% | 75.6667% | 1.051985 | 72.6949 |
| 62 | Shoebox Accessory Pack | 154 / 200 | 77.0000% | 83.1667% | 0.970526 | 81.7803 |
| 64 | Sports Ball Cup Sort | 75 / 200 | 37.5000% | 67.8750% | 0.772627 | 55.1450 |
| 67 | Faucet Cup Water Fill | 146 / 200 | 73.0000% | 83.6250% | 0.892604 | 79.4073 |
| 73 | Jigsaw Puzzle Assembly | 1 / 200 | 0.5000% | 50.0000% | 1.114890 | 33.8739 |
| 76 | Soup Serving | 25 / 200 | 12.5000% | 41.5000% | 0.973481 | 34.0348 |
| 79 | Bimanual Piano Melody | 64 / 200 | 32.0000% | 35.2500% | 0.937704 | 39.6395 |
| 80 | Gaming Desk Setup | 133 / 200 | 66.5000% | 71.8333% | 1.047899 | 72.7290 |
