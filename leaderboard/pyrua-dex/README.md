# PyRUA-Dex

**PKU DAGroup**

PyRUA-Dex is a coding-agent system for dexterous manipulation. **No human demonstration data is used.** For each
task, coding agents (GPT-6 Astra) explore in simulation and write a controller program; the best program is frozen and
evaluated alone, with no trained weights and no language-model calls during evaluation.

[Project](https://vme0522.github.io/PyRUA-Dex/) · [Code](https://github.com/DAGroup-PKU/PyRUA-Lean/tree/dex) (coming soon) · arXiv: coming soon

**Inputs:** Vision + Proprioception + Tactile

## Evaluation

26 tasks · None / Equi. / Inv. / Full · 50 episodes per task/channel (5,200 episodes), with the official seeds and episode limits.

| Metric | Result |
| --- | ---: |
| None SR | 60.8% |
| Equi. SR | 62.1% |
| Inv. SR | 58.0% |
| Full SR | 61.5% |
| Four-channel mean SR | 60.6% |
| Four-channel mean LSCR | 82.3% |
| Efficiency (24 tasks with success) | 0.859 |

Protocol differences are listed in `evaluation.protocol.protocolChanges` of the results JSON.
[Evaluation logs](https://huggingface.co/datasets/Bench2Dex/Leaderboard/tree/main/pyrua-dex).
