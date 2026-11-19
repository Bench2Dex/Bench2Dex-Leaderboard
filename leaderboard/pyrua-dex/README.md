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
Round 2 uses the same evaluation seeds as Round 1 and reuses the Round 1 logs for Tasks 22 and 80. Tasks 21, 22, 27, 32, 60, and 64 use the earlier LSCR stage definitions. [Stage definition update](https://github.com/Bench2Dex/Bench2Dex/commit/05d3657eb5075f288433b8f6aec2751ac620dc6c)

[Round 2 evaluation logs](https://huggingface.co/datasets/Bench2Dex/Leaderboard/tree/85f11bf8638cd01a065b80219b5e160a6b86a017/pyrua-dex).
