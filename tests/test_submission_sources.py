import copy
import json
from pathlib import Path
import runpy
import tempfile
import unittest

Audit = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'scripts' / 'validate_policy_submission.py'))['Audit']


class SourceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.github = root / 'github' / 'EXAMPLE'
        self.hf = root / 'hf'
        self.logs = self.hf / 'EXAMPLE'
        self.github.mkdir(parents=True)
        self.logs.mkdir(parents=True)
        self.registry = root / 'registry.json'
        self.registry.write_text(json.dumps({'protocols': [{'id': 'standard', 'taskIds': ['03']}]}))
        self.github.joinpath('README.md').write_text('Example')
        folder = self.logs / 'per_task_eval' / '03_example' / 'Full'
        folder.mkdir(parents=True)
        episode = dict(task_id='03', channel='Full', run_id='run', episode_index=1, episode_seed=100,
                       stable_success=True, latched_stage_completion_rate=1.0,
                       steps_to_stable_success=10, expert_time_step=10)
        folder.joinpath('per_episode.jsonl').write_text(json.dumps(episode) + '\n')
        summary = dict(isTemplate=False, taskId='03', channel='Full', runId='run', status='reported',
                       stepUnit='physics_steps', physicsHz=60, controlHz=20, episodes=1, successes=1,
                       failures=0, sr=100, lscr=100, efficiency=1, efficiencyStatus='reported',
                       expertTimeStep=10, successfulStepSum=10, meanSuccessfulSteps=10)
        folder.joinpath('summary.json').write_text(json.dumps(summary))
        names = ['None', 'Equi.', 'Inv.', 'Full']
        channels = {c: dict(status='not-reported', episodes=None, successes=None, lscr=None, source=None) for c in names}
        channels['Full'] = dict(status='reported', episodes=1, successes=1, lscr=100,
                                source=dict(runId='run', perEpisodeFile='per_task_eval/03_example/Full/per_episode.jsonl',
                                            summaryFile='per_task_eval/03_example/Full/summary.json'))
        empty_mean = dict(status='not-reported', sr=None, lscr=None, efficiency=None,
                          efficiencyStatus='not-reported', srScope='four-channel-mean', lscrScope='four-channel-mean',
                          srEpisodes=None, lscrEpisodes=None)
        self.policy = dict(model=dict(id='EXAMPLE', protocolId='standard'),
                           per_task={'03': dict(channels=channels, mean=empty_mean)},
                           overall=dict(taskCount=1, scope='task-macro', sr=None, lscr=None, efficiency=None,
                                        efficiencyStatus='not-reported', efficiencyTaskCount=None,
                                        channelSr={c: 100 if c == 'Full' else None for c in names},
                                        channelLscr={c: 100 if c == 'Full' else None for c in names},
                                        channelTaskCounts={c: 1 if c == 'Full' else 0 for c in names}),
                           evaluation=dict(isTemplate=False, logs=dict(repository='Bench2Dex/Leaderboard', policyPath='EXAMPLE', revision=None),
                                           coverage=dict(evaluatedTaskCount=1, evaluatedEpisodeCount=1,
                                                         expectedFullEpisodeCount=50, expectedFourChannelEpisodeCount=200,
                                                         completedTaskCount={**{c: 1 if c == 'Full' else 0 for c in names}, 'mean': 0},
                                                         missingTaskChannels={'03': names[:-1]})))
        self.save(self.github, self.policy)
        self.save(self.logs, self.policy)

    def save(self, root, policy):
        root.joinpath('leaderboard_EXAMPLE.json').write_text(json.dumps(policy))


    def native_logs(self, axis='inv+cov'):
        folder = self.logs / 'per_task_eval' / '03_example' / 'Full'
        episode = dict(scene='scenes/03_example.yaml', episode_index=1, episode_seed=100,
                       base_seed=100, success=True, stable_success=True, steps=12,
                       evaluation_protocol='reach_and_stop', perturbation_axis=axis,
                       latched_stage_completion_rate=1.0, steps_to_stable_success=10,
                       first_stable_success_step=9, expert_time_step=10,
                       metric_schema_version='core-v1.8-policy-step-query-split',
                       scene_generalization_sample={'appearance': {'asset_uri': 'assets/public.usd'}})
        summary = dict(metric_schema_version='core-v1.8-policy-step-query-split',
                       metadata=dict(n_episodes=1, successes=1, evaluation_protocol='reach_and_stop'),
                       core_metrics=dict(completion={'success_rate': 1.0},
                                         progress={'latched_stage_completion_rate': 1.0}),
                       diagnostic_metrics=dict(efficiency={'avg_steps_to_success': 10, 'expert_time_step': 10}))
        paths = [folder/'per_episode.jsonl', folder/'summary.json']
        paths[0].write_text(json.dumps(episode)+'\n', encoding='utf-8')
        paths[1].write_text(json.dumps(summary), encoding='utf-8')
        return paths

    def test_accepts_native_outputs_without_reformatting_or_extra_fields(self):
        paths = self.native_logs()
        before = [p.read_bytes() for p in paths]
        self.github.joinpath('README.md').write_text('模型介绍', encoding='utf-8')
        audit = Audit()
        audit.submission(self.github, self.registry, self.hf)
        self.assertEqual(audit.errors, [])
        self.assertEqual(audit.channels['03']['Full']['sr'], 100)
        self.assertEqual([p.read_bytes() for p in paths], before)
        row = json.loads(paths[0].read_text(encoding='utf-8'))
        self.assertFalse({'task_id', 'run_id', 'is_template'} & row.keys())
        self.assertNotIn('isTemplate', json.loads(paths[1].read_text(encoding='utf-8')))

    def test_rejects_native_channel_mislabeled_as_full(self):
        self.native_logs(axis='cov')
        audit = Audit()
        audit.submission(self.github, self.registry, self.hf)
        self.assertTrue(any('native channel differs' in error for error in audit.errors))

    def test_rejects_inconsistent_native_summary(self):
        paths = self.native_logs()
        summary = json.loads(paths[1].read_text(encoding='utf-8'))
        summary['metadata']['n_episodes'] = 2
        paths[1].write_text(json.dumps(summary), encoding='utf-8')
        audit = Audit()
        audit.submission(self.github, self.registry, self.hf)
        self.assertTrue(any('n_episodes=' in error for error in audit.errors))

    def test_reads_episode_logs_from_hf_checkout(self):
        audit = Audit()
        audit.submission(self.github, self.registry, self.hf)
        self.assertEqual(audit.errors, [])
        self.assertEqual(audit.channels['03']['Full']['successes'], 1)

    def test_rejects_mismatched_hf_scores(self):
        other = copy.deepcopy(self.policy)
        other['per_task']['03']['channels']['Full']['successes'] = 0
        self.save(self.logs, other)
        audit = Audit()
        audit.submission(self.github, self.registry, self.hf)
        self.assertTrue(any('GitHub/HF per_task differs' in error for error in audit.errors))

    def test_rejects_paths_outside_hf_policy_directory(self):
        self.policy['per_task']['03']['channels']['Full']['source']['perEpisodeFile'] = '../../outside.jsonl'
        self.save(self.github, self.policy)
        self.save(self.logs, self.policy)
        audit = Audit()
        audit.submission(self.github, self.registry, self.hf)
        self.assertTrue(any('escapes policy directory' in error for error in audit.errors))


if __name__ == '__main__':
    unittest.main()
