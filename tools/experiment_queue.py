"""Offline, fail-closed queue planner. Does not dispatch, execute, or grant approval."""
import argparse
import hashlib
import json
import re
from pathlib import Path

MAX_BYTES = 1024 * 1024
FIELDS = {'experiment', 'code_sha', 'runner_sha256', 'input_sha256',
          'protocol_sha256', 'runtime', 'parameters'}
ALLOWED = {'vasco-archived-36', 'vasco-official-refetch-3'}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def unique(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key')
        result[key] = value
    return result


def read(path):
    with Path(path).open('rb') as stream:
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError('input exceeds 1 MiB')
    return json.loads(raw, object_pairs_hook=unique,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError(x)))


def identity(spec):
    if not isinstance(spec, dict) or set(spec) != FIELDS:
        raise ValueError('unexpected specification fields')
    if spec['experiment'] not in ALLOWED:
        raise ValueError('experiment not allowlisted')
    for name in ('code_sha', 'runner_sha256', 'input_sha256', 'protocol_sha256'):
        length = 40 if name == 'code_sha' else 64
        if not isinstance(spec[name], str) or not re.fullmatch('[0-9a-f]{%d}' % length, spec[name]):
            raise ValueError('immutable digest required: ' + name)
    if not isinstance(spec['runtime'], str) or not re.fullmatch(r'python-3\.12\.\d+;ubuntu-24\.04;image-[0-9.]+', spec['runtime']):
        raise ValueError('exact supported runtime/image required')
    expected = {'plate_id': 7538, 'scan_id': 9720,
                'rows': 36 if spec['experiment'] == 'vasco-archived-36' else 3}
    if canonical(spec['parameters']) != canonical(expected):
        raise ValueError('parameters outside approved bounded scope')
    return hashlib.sha256(canonical({'schema': 1, 'spec': spec})).hexdigest()


def plan(requests, approved, ledger):
    """Caller must supply authenticated, complete snapshots, not PR-controlled state."""
    if not all(isinstance(x, list) for x in (requests, approved, ledger)):
        raise ValueError('expected three arrays')
    if len(requests) > 8 or len(approved) > 8 or len(ledger) > 1000:
        raise ValueError('bounded snapshot limit exceeded; reconcile explicitly')
    approved_ids = [identity(x) for x in approved]
    if len(set(approved_ids)) != len(approved_ids):
        raise ValueError('duplicate approved identity')
    seen = {}
    for row in ledger:
        if not isinstance(row, dict) or set(row) != {'identity_schema', 'identity', 'state', 'evidence'}:
            raise ValueError('invalid ledger record')
        if row['identity_schema'] != 'queue-v1':
            raise ValueError('ledger identity requires explicit queue-v1 backfill')
        key = row['identity']
        if not isinstance(key, str) or not re.fullmatch('[0-9a-f]{64}', key):
            raise ValueError('invalid ledger identity')
        if key in seen or row['state'] not in {'reserved', 'success', 'failure'}:
            raise ValueError('duplicate or invalid ledger state')
        if not isinstance(row['evidence'], str) or not row['evidence'].startswith('https://github.com/franklinbaldo/'):
            raise ValueError('missing evidence link')
        seen[key] = row['state']
    output = []
    requested = set()
    for spec in requests:
        key = identity(spec)
        if key not in approved_ids:
            raise ValueError('exact specification not approved')
        if key in requested:
            raise ValueError('duplicate request identity')
        requested.add(key)
        decision = {'success': 'skip-completed', 'reserved': 'skip-reserved',
                    'failure': 'stop-review-failure'}.get(seen.get(key), 'eligible-unreserved')
        output.append({'identity': key, 'decision': decision, 'experiment': spec['experiment']})
    return {'schema': 1, 'dispatch_authorized': False,
            'snapshot_sha256': hashlib.sha256(canonical({'approved': approved, 'ledger': ledger})).hexdigest(),
            'entries': output}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('requests', 'approved', 'ledger'):
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    print(json.dumps(plan(read(args.requests), read(args.approved), read(args.ledger)), indent=2))


if __name__ == '__main__':
    main()
