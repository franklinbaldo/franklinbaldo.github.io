import copy
import importlib.util
import tempfile
import unittest
from pathlib import Path
MODULE = Path(__file__).resolve().parents[1] / 'experiment_queue.py'
spec = importlib.util.spec_from_file_location('queue_planner', MODULE)
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)

class QueueTests(unittest.TestCase):
    def setUp(self):
        self.job = {'experiment': 'vasco-official-refetch-3', 'code_sha': 'a'*40,
                    'runner_sha256': 'b'*64, 'input_sha256': 'c'*64,
                    'protocol_sha256': 'd'*64, 'runtime': 'python-3.12.3;ubuntu-24.04;image-20261012.334.1',
                    'parameters': {'plate_id':7538, 'scan_id':9720, 'rows':3}}
    def test_eligible_is_not_dispatch(self):
        result = q.plan([self.job], [self.job], [])
        self.assertFalse(result['dispatch_authorized'])
        self.assertEqual(result['entries'][0]['decision'], 'eligible-unreserved')
    def test_each_immutable_component_changes_identity(self):
        for field in ('code_sha','runner_sha256','input_sha256','protocol_sha256'):
            changed = copy.deepcopy(self.job); changed[field] = 'e'*len(changed[field])
            self.assertNotEqual(q.identity(changed), q.identity(self.job))
    def test_order_independent(self):
        self.assertEqual(q.identity(self.job), q.identity(dict(reversed(list(self.job.items())))))
    def test_scope_and_unknown_fields(self):
        for mutate in (lambda x:x.update(command='sh'), lambda x:x['parameters'].update(rows=2500), lambda x:x.update(experiment='arbitrary')):
            changed=copy.deepcopy(self.job); mutate(changed)
            with self.assertRaises(ValueError): q.identity(changed)
    def test_unapproved(self):
        with self.assertRaises(ValueError): q.plan([self.job], [], [])
    def test_all_prior_states_block(self):
        for state, expected in [('success','skip-completed'),('reserved','skip-reserved'),('failure','stop-review-failure')]:
            row={'identity_schema':'queue-v1','identity':q.identity(self.job),'state':state,'evidence':'https://github.com/franklinbaldo/papers/pull/1635'}
            self.assertEqual(q.plan([self.job],[self.job],[row])['entries'][0]['decision'],expected)
    def test_duplicate_and_overflow_fail_closed(self):
        with self.assertRaises(ValueError): q.plan([self.job]*2,[self.job],[])
        with self.assertRaises(ValueError): q.plan([], [self.job]*9, [])
    def test_bad_runtime(self):
        self.job['runtime']='latest'
        with self.assertRaises(ValueError): q.identity(self.job)
    def test_duplicate_json_and_size(self):
        with tempfile.TemporaryDirectory() as directory:
            p=Path(directory)/'input.json'
            for raw in ('{"a":1,"a":2}', ' '* (q.MAX_BYTES+1), '[NaN]', '[Infinity]'):
                p.write_text(raw)
                with self.assertRaises(ValueError): q.read(p)

    def test_ledger_validation_and_namespace(self):
        row={'identity_schema':'queue-v1','identity':q.identity(self.job),'state':'success','evidence':'https://github.com/franklinbaldo/papers/pull/1635'}
        for ledger in ([row,row], [row]*1001, [dict(row,state='unknown')], [dict(row,identity_schema='legacy-run')]):
            with self.assertRaises(ValueError): q.plan([self.job],[self.job],ledger)
    def test_runtime_changes_identity(self):
        other=copy.deepcopy(self.job); other['runtime']='python-3.12.4;ubuntu-24.04;image-20261012.334.1'
        self.assertNotEqual(q.identity(other),q.identity(self.job))
