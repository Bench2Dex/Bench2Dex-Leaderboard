# Bench2Dex Leaderboard

Official policy rankings and per-task evaluation results for [Bench2Dex](https://bench2dex.github.io/).

- [Leaderboard](https://bench2dex.github.io/Bench2Dex-Leaderboard/)
- [Benchmark source](https://github.com/Bench2Dex/Bench2Dex)
- [Paper](https://arxiv.org/abs/2609.15726)

## Update results

Edit `assets/js/data.js`. GR00T evaluation details are also available in `assets/data/gr00t-evaluations.json`; keep the corresponding records consistent. Percent metrics use 0–100; efficiency is a ratio. Unreported metrics remain NR, and Full-only SR must not populate a four-channel mean.

## Build and preview

Requires Node.js 22 or later. No package installation is needed.

```sh
npm run build
python -m http.server 8000 --directory dist
```

The build also generates `dist/assets/js/evaluations.js`, which supplies the project homepage's Overall Performance table. New results only need to be maintained in this repository.

## Deploy

Push to `main` to deploy through GitHub Actions. GitHub Pages uses the **GitHub Actions** publishing source.
