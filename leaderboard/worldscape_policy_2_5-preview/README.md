# WorldScape Policy 2.5-Preview

WorldScape Policy 2.5-Preview generates bimanual actions conditioned on overhead and wrist RGB observations, robot proprioception, and natural language task instructions.

We evaluate a single multitask checkpoint trained for 60,000 steps across all 26 Bench2Dex tasks.

[Project page](https://manifoldai-research.github.io/WorldScape-Policy/) · [Public code](https://github.com/manifoldai-research/WorldScape-Policy)

## Bench2Dex results

| Tasks | Episodes | Stable successes | SR | LSCR | Eff. | Score |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 26 | 5,200 | 2,695 | 51.8269% | 73.9622% | 0.978189 | 66.38699 |

### Per-task results

| ID | Task | Stable successes / episodes | SR | LSCR | Eff. | Score |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 32 | Baking Tray Prep | 77 / 200 | 38.5000% | 55.5000% | 0.972054 | 52.0205 |
| 26 | Canned Food Tray Arrangement | 72 / 200 | 36.0000% | 73.7500% | 0.946032 | 58.8478 |
| 73 | Jigsaw Puzzle Assembly | 9 / 200 | 4.5000% | 46.8750% | 0.936318 | 32.4819 |
| 80 | Gaming Desk Setup | 120 / 200 | 60.0000% | 69.3333% | 1.065208 | 68.8521 |
| 61 | Medicine Shoebox Pack | 109 / 200 | 54.5000% | 65.3333% | 0.984075 | 63.7658 |
| 22 | Tool Box Loading | 141 / 200 | 70.5000% | 80.7500% | 0.958843 | 77.6509 |
| 64 | Sports Ball Cup Sort | 47 / 200 | 23.5000% | 59.2500% | 0.778142 | 45.0189 |
| 67 | Faucet Cup Water Fill | 107 / 200 | 53.5000% | 70.7500% | 0.978759 | 65.7001 |
| 24 | Stationery Category Sorting | 53 / 200 | 26.5000% | 57.6250% | 1.042212 | 48.2784 |
| 79 | Bimanual Piano Melody | 76 / 200 | 38.0000% | 61.0000% | 0.992921 | 54.4792 |
| 03 | Wine Glass Plate Balance | 93 / 200 | 46.5000% | 85.6667% | 1.033731 | 69.8123 |
| 09 | Cleaner Box Loading | 148 / 200 | 74.0000% | 95.0000% | 0.913497 | 85.1850 |
| 62 | Shoebox Accessory Pack | 127 / 200 | 63.5000% | 78.1667% | 1.001794 | 73.7679 |
| 51 | Toilet Lid Cleaner Pour | 129 / 200 | 64.5000% | 72.3333% | 1.025397 | 71.8290 |
| 60 | Breadbasket Fast-Food Loading | 105 / 200 | 52.5000% | 81.6250% | 0.963636 | 69.9926 |
| 07 | Citrus Plate Loading | 191 / 200 | 95.5000% | 99.0000% | 0.840271 | 95.9277 |
| 34 | Fridge Wine Interhand Pour | 86 / 200 | 43.0000% | 73.1000% | 1.023533 | 62.4803 |
| 06 | Fruit Bowl Loading | 143 / 200 | 71.5000% | 92.5000% | 0.922576 | 83.0258 |
| 12 | Screwdriver Box & Hammer | 157 / 200 | 78.5000% | 92.2500% | 0.984123 | 86.6787 |
| 42 | Trash Disposal | 90 / 200 | 45.0000% | 83.5000% | 0.916876 | 66.9938 |
| 43 | Fridge Fruit Shelf Sorting | 35 / 200 | 17.5000% | 52.1250% | 0.940768 | 40.7389 |
| 76 | Soup Serving | 29 / 200 | 14.5000% | 47.8750% | 1.021324 | 38.2820 |
| 08 | Frypan Stand & Pour | 167 / 200 | 83.5000% | 92.2500% | 1.294503 | 92.0325 |
| 44 | Microwave Bowl Loading | 193 / 200 | 96.5000% | 97.7500% | 1.001969 | 97.4322 |
| 27 | Ball Box Loading | 86 / 200 | 43.0000% | 56.3750% | 0.987709 | 54.5958 |
| 21 | Condiment Box Loading | 105 / 200 | 52.5000% | 83.3333% | 0.906642 | 70.1914 |

### Per-channel results

| Channel | Episodes | SR | LSCR |
| --- | ---: | ---: | ---: |
| None | 1,300 | 63.0000% | 82.2744% |
| Equi. | 1,300 | 46.8462% | 69.9346% |
| Inv. | 1,300 | 48.0000% | 71.2962% |
| Full | 1,300 | 49.4615% | 72.3436% |

## Evaluation Protocol

- The evaluation used Bench2Dex base revision [c269f24](https://github.com/Bench2Dex/Bench2Dex/tree/c269f24bd39bd973e157a16c3c9c666cf5f43efc) with a local WorldScape Policy 2.5-Preview policy bridge.
- We evaluated a single general-purpose checkpoint across all 26 tasks without using the TAC dataset or performing any additional per-task fine-tuning.

[GitHub submission](https://github.com/Bench2Dex/Bench2Dex-Leaderboard/pull/13) · [Archived evaluation logs](https://huggingface.co/datasets/Bench2Dex/Leaderboard/tree/8ef2bb40f6cb929c244e4258c78e644e8e0a5087/worldscape_policy_2_5-preview)
