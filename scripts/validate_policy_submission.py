#!/usr/bin/env python3
"""Recompute leaderboard metrics from logs. This does NOT authenticate rollouts.

No third-party dependencies. Two input formats are supported:
  POLICY_DIR                            (default: submission audit)
  --mode native EVAL_ROOT                (existing Bench2Dex outputs)

Legacy "submission POLICY_DIR" and "native EVAL_ROOT" commands also work.
Official scenes default to a sibling Bench2Dex/scenes checkout; use
--reference-scenes for another trusted snapshot. The registry is
discovered in parent directories, or the built-in standard task set is used.
The full report defaults to ./audit_<directory-name>.json.

The native mode audits existing Bench2Dex output without modifying it. The
submission mode checks the public leaderboard's metadata and HF log/summary contract.
Use a trusted --reference-scenes snapshot to check expert reference steps.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
from pathlib import Path
from statistics import mean

TASK_IDS = "03 06 07 08 09 12 21 22 24 26 27 32 34 42 43 44 51 60 61 62 64 67 73 76 79 80".split()
CHANNELS = {"None": "none", "Equi.": "cov_only", "Inv.": "inv_only", "Full": "inv_cov"}
DEFAULT_SCENES = Path(__file__).resolve().parents[2] / 'Bench2Dex' / 'scenes'


def number(value):
    return type(value) in (int, float) and math.isfinite(value)


def integer(value):
    return type(value) is int


def no_duplicates(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise ValueError(f"duplicate JSON key: {key}")
        out[key] = value
    return out


def decode(text):
    def invalid(value):
        raise ValueError(f"non-finite JSON constant: {value}")
    return json.loads(text, object_pairs_hook=no_duplicates, parse_constant=invalid)


def native_channel(row):
    """Read native channel metadata without rewriting the evaluation record."""
    aliases = {
        'none': 'None', 'cov': 'Equi.', 'cov_only': 'Equi.', 'cov-only': 'Equi.',
        'equi': 'Equi.', 'equi.': 'Equi.', 'inv': 'Inv.', 'inv.': 'Inv.',
        'inv_only': 'Inv.', 'inv-only': 'Inv.', 'inv+cov': 'Full',
        'inv_cov': 'Full', 'full': 'Full',
    }
    sample = row.get('scene_generalization_sample')
    profile = str(sample.get('_generalization_profile') or '').strip().lower() if isinstance(sample, dict) else ''
    if profile in aliases:
        return aliases[profile]
    if 'perturbation_axis' not in row:
        return None
    raw = str(row.get('perturbation_axis') or 'none').strip().lower() or 'none'
    if raw in aliases:
        return aliases[raw]
    axes = {axis.strip() for axis in raw.split(',') if axis.strip()}
    cov = bool(axes & {'object_pose', 'table_height'})
    inv = bool(axes & {'background', 'table_surface', 'light', 'clutter', 'camera'})
    return 'Full' if cov and inv else 'Equi.' if cov else 'Inv.' if inv else 'unknown'


class Audit:
    def __init__(self, reference_scenes=None):
        self.errors = []
        self.warnings = []
        self.channels = {}
        self.bytes = {"per_episode.jsonl": 0, "summary.json": 0}
        self.references = {}
        self.used_paths = set()
        if reference_scenes:
            if not Path(reference_scenes).is_dir():
                self.error('reference scenes', f'directory does not exist: {reference_scenes}')
            for path in Path(reference_scenes).glob('*.yaml'):
                match = re.search(r'^  expert_time_step:\s*(\d+)\s*$', path.read_text(encoding='utf-8-sig'), re.M)
                if match:
                    self.references[path.name.split('_')[0]] = int(match[1])
            if not self.references and Path(reference_scenes).is_dir():
                self.error('reference scenes', f'no expert reference steps found in {reference_scenes}')

    def error(self, label, message):
        self.errors.append(f"{label}: {message}")

    def check(self, condition, label, message):
        if not condition:
            self.error(label, message)
        return bool(condition)

    def compare(self, record, key, expected, label, optional=False):
        if optional and key not in record:
            return
        actual = record.get(key)
        if expected is None:
            equal = actual is None and (optional or key in record)
        elif type(expected) is int:
            equal = integer(actual) and actual == expected
        elif number(expected):
            equal = number(actual) and math.isclose(actual, expected, rel_tol=1e-8, abs_tol=1e-6)
        else:
            equal = actual == expected
        self.check(equal, label, f"{key}={actual!r}; recomputed={expected!r}")

    def load(self, path):
        try:
            value = decode(path.read_text(encoding='utf-8-sig'))
            if not isinstance(value, dict):
                raise ValueError("expected JSON object")
            return value
        except (OSError, ValueError) as exc:
            self.error(str(path), str(exc))
            return {}

    def local_path(self, root, relative, label):
        if not isinstance(relative, str) or not relative:
            self.error(label, "missing source path")
            return None
        path = (root / relative).resolve()
        if Path(relative).is_absolute() or not path.is_relative_to(root.resolve()):
            self.error(label, "source path escapes policy directory")
            return None
        if path in self.used_paths:
            self.error(label, "source file reused by another task/channel")
        self.used_paths.add(path)
        return path

    def episode_stats(self, path, task, channel, run=None, native=False):
        label = f"{task}/{channel}"
        rows = []
        try:
            self.bytes['per_episode.jsonl'] += path.stat().st_size
            with path.open(encoding='utf-8-sig') as handle:
                for line_no, line in enumerate(handle, 1):
                    if not line.strip():
                        continue
                    try:
                        row = decode(line)
                        if not isinstance(row, dict):
                            raise ValueError("expected JSON object")
                        rows.append(row)
                    except ValueError as exc:
                        self.error(f"{path}:{line_no}", str(exc))
        except OSError as exc:
            self.error(str(path), str(exc))
        if not rows:
            self.error(label, "no episodes")
            return None
        indices, seeds, experts, steps, progress = [], [], [], [], []
        successes = 0
        for i, row in enumerate(rows, 1):
            loc = f"{label}/row{i}"
            self.check(not row.get('is_template'), loc, "template row")
            if not native:
                for key, expected in [('task_id', task), ('channel', channel), ('run_id', run)]:
                    self.compare(row, key, expected, loc)
            else:
                scene_task = str(row.get('scene', '')).replace('\\', '/').rsplit('/', 1)[-1].split('_')[0]
                self.check(scene_task == task, loc, "scene/task mismatch")
                recorded_channel = native_channel(row)
                if recorded_channel is not None:
                    self.check(recorded_channel == channel, loc, "native channel differs from declared channel")
            index, seed = row.get('episode_index'), row.get('episode_seed')
            if self.check(integer(index) and index >= 1, loc, "invalid episode_index"):
                indices.append(index)
            if self.check(integer(seed) and seed >= 0, loc, "invalid episode_seed"):
                seeds.append(seed)
            success = row.get('stable_success')
            self.check(type(success) is bool, loc, "stable_success must be boolean")
            if native and row.get('evaluation_protocol', 'reach_and_stop') == 'reach_and_stop':
                self.check(row.get('success') is success, loc, "success differs from stable_success")
            p = row.get('latched_stage_completion_rate')
            if p is not None:
                if self.check(number(p) and 0 <= p <= 1, loc, "progress must be in [0,1]"):
                    progress.append(p)
            expert = row.get('expert_time_step')
            if expert is not None:
                if self.check(integer(expert) and expert > 0, loc, "invalid expert_time_step"):
                    experts.append(expert)
                    if task in self.references:
                        self.compare(row, 'expert_time_step', self.references[task], loc)
            n = row.get('steps_to_stable_success')
            if success is True:
                successes += 1
                if n is not None and self.check(integer(n) and n > 0, loc, "invalid success steps"):
                    steps.append(n)
                    for bound in ['steps', 'max_episode_steps']:
                        if integer(row.get(bound)):
                            self.check(n <= row[bound], loc, f"success steps exceed {bound}")
                    if integer(row.get('first_stable_success_step')):
                        self.check(row['first_stable_success_step'] + 1 == n, loc,
                                   "stable-success step and executed-step count disagree")
            elif success is False:
                self.check(n is None, loc, "failed episode has success steps")
            if native and integer(seed) and integer(index) and integer(row.get('base_seed')):
                self.check(seed == row['base_seed'] + index - 1, loc, "seed sequence mismatch")
        self.check(len(set(indices)) == len(indices), label, "duplicate episode indices")
        self.check(len(set(seeds)) == len(seeds), label, "duplicate episode seeds")
        self.check(sorted(indices) == list(range(1, len(rows) + 1)), label, "indices must cover 1..N")
        self.check(len(set(experts)) <= 1, label, "expert reference varies within task/channel")
        if len(rows) != 50:
            self.warnings.append(f"{label}: {len(rows)} episodes; standard reference budget is 50")
        expert = experts[0] if len(experts) == len(rows) and len(set(experts)) == 1 else None
        complete_steps = len(steps) == successes
        step_sum = sum(steps) if complete_steps else None
        average_steps = step_sum / successes if successes and complete_steps else None
        efficiency = expert / average_steps if expert is not None and average_steps else None
        status = 'reported' if efficiency is not None else 'no-success' if not successes else 'not-reported'
        return dict(episodes=len(rows), successes=successes, failures=len(rows)-successes,
                    sr=100 * successes / len(rows), lscr=100 * mean(progress) if len(progress) == len(rows) else None,
                    efficiency=efficiency, efficiencyStatus=status, expertTimeStep=expert,
                    successfulStepSum=step_sum, meanSuccessfulSteps=average_steps)

    def channel(self, task, channel, ep_path, summary_path, run=None, native=False):
        summary = self.load(summary_path)
        native = native or (isinstance(summary.get('metadata'), dict) and isinstance(summary.get('core_metrics'), dict))
        stats = self.episode_stats(ep_path, task, channel, run, native)
        if summary_path.is_file():
            self.bytes['summary.json'] += summary_path.stat().st_size
        if stats is None:
            return None
        label = f"{task}/{channel}/summary"
        if native:
            meta = summary.get('metadata', {})
            for key, expected in [('n_episodes', stats['episodes']), ('successes', stats['successes'])]:
                self.compare(meta, key, expected, label)
            completion = summary.get('core_metrics', {}).get('completion', {})
            self.compare(completion, 'success_rate', stats['sr']/100, label)
            progress = summary.get('core_metrics', {}).get('progress', {})
            self.compare(progress, 'latched_stage_completion_rate',
                         stats['lscr']/100 if stats['lscr'] is not None else None, label, optional=True)
            efficiency = summary.get('diagnostic_metrics', {}).get('efficiency', {})
            self.compare(efficiency, 'avg_steps_to_success', stats['meanSuccessfulSteps'], label, optional=True)
            self.compare(efficiency, 'expert_time_step', stats['expertTimeStep'], label, optional=True)
        else:
            self.check(summary.get('isTemplate') is False, label, "isTemplate must be false")
            for key, expected in [('taskId', task), ('channel', channel), ('runId', run),
                                  ('status', 'reported'), ('stepUnit', 'physics_steps')]:
                self.compare(summary, key, expected, label)
            for key, expected in stats.items():
                self.compare(summary, key, expected, label)
            for key in ['physicsHz', 'controlHz']:
                self.check(number(summary.get(key)) and summary[key] > 0, label, f"invalid {key}")
        self.channels.setdefault(task, {})[channel] = stats
        return stats

    def task_mean(self, task):
        channels = self.channels.get(task, {})
        if set(channels) != set(CHANNELS):
            return dict(sr=None, lscr=None, efficiency=None, efficiencyStatus='not-reported',
                        srEpisodes=None, lscrEpisodes=None)
        values = list(channels.values())
        experts = {v['expertTimeStep'] for v in values if v['expertTimeStep'] is not None}
        self.check(len(experts) <= 1, task, "expert reference differs across channels")
        successes = sum(v['successes'] for v in values)
        efficiency = None
        if all(v['expertTimeStep'] is not None and v['successfulStepSum'] is not None for v in values) and len(experts) == 1 and successes:
            efficiency = next(iter(experts)) * successes / sum(v['successfulStepSum'] for v in values)
        return dict(sr=mean(v['sr'] for v in values),
                    lscr=mean(v['lscr'] for v in values) if all(v['lscr'] is not None for v in values) else None,
                    efficiency=efficiency,
                    efficiencyStatus='reported' if efficiency is not None else 'no-success' if not successes else 'not-reported',
                    srEpisodes=sum(v['episodes'] for v in values),
                    lscrEpisodes=sum(v['episodes'] for v in values) if all(v['lscr'] is not None for v in values) else None)

    def overall(self, task_ids):
        tasks = [self.task_mean(t) for t in task_ids]
        channel_sr, channel_lscr, counts = {}, {}, {}
        for channel in CHANNELS:
            values = [self.channels[t][channel] for t in task_ids if channel in self.channels.get(t, {})]
            counts[channel] = len(values)
            channel_sr[channel] = mean(v['sr'] for v in values) if len(values) == len(task_ids) else None
            channel_lscr[channel] = mean(v['lscr'] for v in values) if len(values) == len(task_ids) and all(v['lscr'] is not None for v in values) else None
        efficiencies = [t['efficiency'] for t in tasks if t['efficiency'] is not None]
        eff_complete = all(t['efficiencyStatus'] in ['reported', 'no-success'] for t in tasks)
        return dict(taskCount=len(task_ids), scope='task-macro',
                    sr=mean(t['sr'] for t in tasks) if all(t['sr'] is not None for t in tasks) else None,
                    lscr=mean(t['lscr'] for t in tasks) if all(t['lscr'] is not None for t in tasks) else None,
                    efficiency=mean(efficiencies) if eff_complete and efficiencies else None,
                    efficiencyStatus='reported' if eff_complete and efficiencies else 'no-success' if eff_complete else 'not-reported',
                    efficiencyTaskCount=len(efficiencies) if eff_complete else None,
                    channelSr=channel_sr, channelLscr=channel_lscr, channelTaskCounts=counts)

    def submission(self, root, registry=None, logs_root=None):
        files = list(root.glob('leaderboard_*.json'))
        if not self.check(len(files) == 1, str(root), "expected exactly one leaderboard_<id>.json"):
            return TASK_IDS
        policy = self.load(files[0])
        model = policy.get('model', {})
        policy_id = model.get('id')
        self.check(root.name == policy_id and files[0].name == f'leaderboard_{policy_id}.json', str(root), "policy ID, directory and filename must match")
        self.check((root/'README.md').is_file() and bool((root/'README.md').read_text(encoding='utf-8-sig').strip()), str(root), "missing/empty README.md")
        self.check(model.get('protocolId') == 'standard', str(root), "this auditor supports standard protocol only")
        if not self.check(isinstance(policy_id, str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*', policy_id) and root.name == policy_id, str(root), "invalid policy ID"):
            return TASK_IDS
        log_root = (logs_root / policy_id).resolve() if logs_root else root.resolve()
        self.check(log_root.is_dir(), str(root), "HF policy log directory does not exist; pass --logs-root HF_CHECKOUT")
        if logs_root:
            if not self.check(log_root.is_relative_to(logs_root.resolve()), str(root), "HF policy path escapes checkout"):
                return TASK_IDS
            hf_copy = self.load(log_root / files[0].name)
            for key in ['model', 'overall', 'per_task']:
                self.check(hf_copy.get(key) == policy.get(key), str(root), f"GitHub/HF {key} differs")
        evaluation = policy.get('evaluation', {})
        log_reference = evaluation.get('logs', {})
        self.check(log_reference.get('repository') == 'Bench2Dex/Leaderboard' and log_reference.get('policyPath') == policy_id, str(root), "invalid HF log reference")
        self.check(evaluation.get('isTemplate') is False, str(root), "evaluation.isTemplate must be false")
        task_ids = TASK_IDS
        if registry:
            catalog = self.load(registry)
            standard = next((p for p in catalog.get('protocols', []) if p.get('id') == 'standard'), None)
            if standard:
                task_ids = standard['taskIds']
        tasks = policy.get('per_task', {})
        self.check(isinstance(tasks, dict) and set(tasks) == set(task_ids), str(root), "per_task must list the complete standard task set")
        if not isinstance(tasks, dict):
            return task_ids
        for task in task_ids:
            record = tasks.get(task, {})
            channels = record.get('channels', {})
            self.check(set(channels) == set(CHANNELS), task, "channels must list None/Equi./Inv./Full")
            for channel in CHANNELS:
                entry = channels.get(channel, {})
                label = f'{task}/{channel}'
                if entry.get('status') != 'reported':
                    self.check(entry.get('status') == 'not-reported', label, "unknown reporting status")
                    for key in ['episodes', 'successes', 'lscr', 'source']:
                        self.compare(entry, key, None, label)
                    continue
                source = entry.get('source')
                if not self.check(isinstance(source, dict), label, "reported channel needs source"):
                    continue
                run = source.get('runId')
                self.check(isinstance(run, str) and bool(run.strip()), label, "missing runId")
                ep = self.local_path(log_root, source.get('perEpisodeFile'), label)
                summary = self.local_path(log_root, source.get('summaryFile'), label)
                if ep is None or summary is None:
                    continue
                stats = self.channel(task, channel, ep, summary, run)
                if stats:
                    for key in ['episodes', 'successes', 'lscr']:
                        self.compare(entry, key, stats[key], label)
            task_mean = record.get('mean', {})
            for key, value in self.task_mean(task).items():
                self.compare(task_mean, key, value, f'{task}/mean')
            self.compare(task_mean, 'status', 'reported' if self.task_mean(task)['sr'] is not None else 'not-reported', f'{task}/mean')
            for key in ['srScope', 'lscrScope']:
                self.compare(task_mean, key, 'four-channel-mean', f'{task}/mean')
        claimed = policy.get('overall', {})
        for key, value in self.overall(task_ids).items():
            if isinstance(value, dict):
                for channel, val in value.items():
                    self.compare(claimed.get(key, {}), channel, val, f'overall/{key}')
            else:
                self.compare(claimed, key, value, 'overall')
        coverage = evaluation.get('coverage', {})
        completed = {c:sum(c in self.channels.get(t, {}) for t in task_ids) for c in CHANNELS}
        completed['mean'] = sum(set(self.channels.get(t, {})) == set(CHANNELS) for t in task_ids)
        for key, expected in [('evaluatedTaskCount', len(self.channels)),
                              ('evaluatedEpisodeCount', sum(c['episodes'] for t in self.channels.values() for c in t.values())),
                              ('expectedFullEpisodeCount', 50*len(task_ids)),
                              ('expectedFourChannelEpisodeCount', 200*len(task_ids))]:
            self.compare(coverage, key, expected, 'evaluation/coverage')
        for channel, count in completed.items():
            self.compare(coverage.get('completedTaskCount', {}), channel, count, 'evaluation/coverage/completedTaskCount')
        missing = {t:[c for c in CHANNELS if c not in self.channels.get(t, {})] for t in task_ids}
        missing = {t:c for t,c in missing.items() if c}
        claimed_missing = coverage.get('missingTaskChannels', {})
        self.check(isinstance(claimed_missing, dict) and
                   {t:c for t,c in claimed_missing.items() if c} == missing,
                   'evaluation/coverage', 'missingTaskChannels does not match logs')
        if not any('Full' in c for c in self.channels.values()):
            self.error(str(root), "no reported Full-channel logs")
        return task_ids

    def native(self, root, prefix):
        for task in TASK_IDS:
            folders = list(root.glob(f'{task}_*'))
            if len(folders) != 1:
                self.error(task, f"expected one task directory, found {len(folders)}")
                continue
            runs = [p for p in folders[0].glob(prefix+'*') if p.is_dir()]
            if len(runs) != 1:
                self.error(task, f"expected one selected run, found {len(runs)}; specify --run-prefix")
                continue
            for channel, folder in CHANNELS.items():
                path = runs[0]/folder
                if not path.is_dir():
                    self.warnings.append(f'{task}/{channel}: not reported')
                    continue
                self.channel(task, channel, path/'per_episode.jsonl', path/'summary.json', native=True)
        return TASK_IDS

    def report(self, task_ids):
        return dict(verdict='INCONSISTENT' if self.errors else 'CONSISTENT_WITH_SUBMITTED_LOGS',
                    authenticity='NOT_VERIFIED',
                    limitation='Self-consistent fabricated logs can pass. No policy execution or physical-state verification is performed.',
                    errors=self.errors, warnings=self.warnings,
                    coverage=dict(tasks_with_logs=len(self.channels), channels_with_logs=sum(map(len, self.channels.values())),
                                  episodes=sum(c['episodes'] for t in self.channels.values() for c in t.values()),
                                  standard_full_budget_complete=all(self.channels.get(t, {}).get('Full', {}).get('episodes') == 50 for t in task_ids),
                                  standard_four_channel_budget_complete=all(self.channels.get(t, {}).get(c, {}).get('episodes') == 50 for t in task_ids for c in CHANNELS)),
                    source_bytes=self.bytes, recomputed_overall=self.overall(task_ids),
                    recomputed_per_task={t:dict(channels=self.channels.get(t, {}), mean=self.task_mean(t)) for t in task_ids})


def find_registry(root):
    """Find the leaderboard catalog in the submission's containing checkout."""
    for directory in (root.resolve(), *root.resolve().parents):
        candidate = directory / 'assets/data/leaderboard.json'
        if candidate.is_file():
            return candidate
    return None


def parse_args(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    legacy_mode = argv.pop(0) if argv and argv[0] in ('submission', 'native') else None
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('root', type=Path, nargs='?', default=Path.cwd(),
                        help='policy directory, or evaluation root in native mode')
    parser.add_argument('--mode', choices=['submission', 'native'],
                        default=legacy_mode or 'submission', help='input format')
    parser.add_argument('--logs-root', type=Path, help='local checkout of Bench2Dex/Leaderboard; logs are under <policy_id>/')
    parser.add_argument('--registry', type=Path,
                        help='leaderboard catalog; auto-discovered in parent directories')
    references = parser.add_mutually_exclusive_group()
    references.add_argument('--reference-scenes', type=Path, default=DEFAULT_SCENES,
                            help='official scene snapshot for expert reference checks')
    references.add_argument('--no-reference-scenes', action='store_true',
                            help='explicitly disable expert reference checks')
    parser.add_argument('--run-prefix', default='gr00t_all_1001_',
                        help='selected run prefix for native mode')
    parser.add_argument('--report', type=Path,
                        help='full JSON report; defaults to ./audit_<directory-name>.json')
    parser.add_argument('--max-issues', type=int, default=5,
                        help='maximum issues shown in the terminal; JSON contains all issues')
    parser.add_argument('--no-color', action='store_true', help='disable terminal colors')
    args = parser.parse_args(argv)
    if args.max_issues < 0:
        parser.error('--max-issues must be nonnegative')
    args.root = args.root.resolve()
    if args.no_reference_scenes:
        args.reference_scenes = None
    if args.registry is None and args.mode == 'submission':
        args.registry = find_registry(args.root)
    if args.report is None:
        args.report = Path.cwd() / f'audit_{args.root.name or "submission"}.json'
    args.report = args.report.resolve()
    return args


def print_summary(result, root, report_path, max_issues=5, color=False):
    """Print a compact English summary; keep the complete audit in JSON."""
    def paint(text, code):
        return f'\033[{code}m{text}\033[0m' if color else text

    errors, warnings = result['errors'], result['warnings']
    status = 'FAIL' if errors else 'PASS WITH WARNINGS' if warnings else 'PASS'
    code = '31;1' if errors else '33;1' if warnings else '32;1'
    message = 'Inconsistencies found' if errors else 'Logs and reported scores are consistent'
    coverage, overall = result['coverage'], result['recomputed_overall']
    task_count = overall['taskCount']

    print(paint('─' * 64, '2'))
    print(paint('  Bench2Dex Submission Audit', '1'))
    print(f'  {paint(status, code)}  {message}')
    print(paint('─' * 64, '2'))
    print(f'  Policy     {root.name}')
    print(f'  Coverage   {coverage["tasks_with_logs"]}/{task_count} tasks · '
          f'{coverage["channels_with_logs"]} channels · {coverage["episodes"]:,} episodes')
    if coverage['standard_four_channel_budget_complete']:
        budget = 'Complete four-channel budget (50 episodes/task/channel)'
    elif coverage['standard_full_budget_complete']:
        budget = 'Complete Full-channel budget; four-channel coverage incomplete'
    else:
        budget = 'Standard evaluation budget incomplete'
    print(f'  Budget     {budget}')

    def metric(value, percent=False):
        return 'NR' if value is None else f'{value:.4f}%' if percent else f'{value:.6f}'

    if not errors:
        print(f'  Metrics    SR {metric(overall["sr"], True)}  |  '
              f'LSCR {metric(overall["lscr"], True)}  |  '
              f'Eff. {metric(overall["efficiency"])}')
    print(f'  Checks     {len(errors):,} errors · {len(warnings):,} warnings')
    print(f'  Report     {report_path if report_path else "Could not save JSON report"}')
    shown = [('ERROR', message) for message in errors] + [('WARN', message) for message in warnings]
    if shown:
        print()
        for kind, message in shown[:max_issues]:
            print(f'  {paint(kind, "31" if kind == "ERROR" else "33")}  {message}')
        if len(shown) > max_issues:
            print(f'  … {len(shown) - max_issues:,} more issues; see the full report.')
    print()
    print('  Authenticity NOT VERIFIED — this audit checks log consistency.')
    print(paint('─' * 64, '2'))


def main(argv=None):
    args = parse_args(argv)
    audit = Audit(args.reference_scenes)
    if args.no_reference_scenes:
        audit.warnings.append('Expert reference checks explicitly disabled.')
    try:
        task_ids = audit.submission(args.root, args.registry, args.logs_root) if args.mode == 'submission' else audit.native(args.root, args.run_prefix)
    except (KeyError, TypeError, ValueError, AttributeError, OSError) as exc:
        audit.error('input', f'malformed input: {exc}')
        task_ids = TASK_IDS
    result = audit.report(task_ids)
    result['input'] = dict(mode=args.mode, root=str(args.root.resolve()),
                           run_prefix=args.run_prefix if args.mode == 'native' else None,
                           registry=str(args.registry) if args.registry else None,
                           reference_scenes=str(args.reference_scenes) if args.reference_scenes else None)
    report_path = args.report
    try:
        args.report.write_text(json.dumps(result, indent=2, allow_nan=False)+'\n')
    except OSError as exc:
        audit.error('report', f'could not write {args.report}: {exc}')
        result['verdict'] = 'INCONSISTENT'
        report_path = None
    color = (not args.no_color and sys.stdout.isatty() and
             'NO_COLOR' not in os.environ and os.environ.get('TERM') != 'dumb')
    print_summary(result, args.root, report_path, args.max_issues, color)
    return 1 if audit.errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
