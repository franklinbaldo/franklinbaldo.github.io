#!/usr/bin/env python3
"""Verify immutable bundle hashes and independently recount every classification."""
import argparse
import csv
import hashlib
import importlib.util
import tempfile
from collections import Counter
from pathlib import Path


def harvest(root, expected_input_sha256, code_sha):
    root = Path(root).resolve(strict=True)
    sums = root / 'SHA256SUMS'
    expected = {'input.csv', 'classifications.csv', 'RESULT.md'}
    seen = set()
    for line in sums.read_text().splitlines():
        digest, name = line.split('  ', 1)
        if name not in expected or name in seen:
            raise ValueError('Unexpected or duplicate artifact')
        p = root / name
        if p.is_symlink() or hashlib.sha256(p.read_bytes()).hexdigest() != digest:
            raise ValueError('Artifact hash mismatch')
        seen.add(name)
    if seen != expected:
        raise ValueError('Incomplete artifact bundle')
    with (root / 'input.csv').open(newline='') as f:
        inputs = list(csv.DictReader(f))
    with (root / 'classifications.csv').open(newline='') as f:
        results = list(csv.DictReader(f))
    if len(inputs) != len(results) or not results:
        raise ValueError('Row count mismatch')
    ids = set()
    counts = Counter()
    for source, result in zip(inputs, results):
        sid = source['source_id'].strip()
        if result['source_id'] != sid or sid in ids:
            raise ValueError('Identity/order mismatch')
        ids.add(sid)
        gaia = source['gaiaedr3_id'].strip()
        label = 'review'
        if source['sextractor_flags'].strip() == '0':
            if gaia.lower() in {'', 'null', 'none', 'nan'}:
                label = 'no_gaia_clean'
            elif gaia.isascii() and gaia.isdecimal() and not gaia.startswith('0'):
                label = 'gaia_clean'
        if result['classification'] != label:
            raise ValueError('Classification mismatch')
        counts[label] += 1
    # Re-render the exact manifest using trusted versioned code and externally
    # pinned inputs. No ad-hoc OKF parser and no trust in self-declared hashes.
    runner_path = Path(__file__).resolve().parents[1] / 'experiments/vasco-gaia/run.py'
    spec = importlib.util.spec_from_file_location('trusted_runner', runner_path)
    runner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(runner)
    with tempfile.TemporaryDirectory() as td:
        regenerated = Path(td) / 'verified'
        runner.run(root / 'input.csv', regenerated, expected_input_sha256, code_sha)
        for name in expected:
            if (regenerated / name).read_bytes() != (root / name).read_bytes():
                raise ValueError('Artifact disagrees with trusted replay: ' + name)
    return counts


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--results', required=True)
    p.add_argument('--input-sha256', required=True)
    p.add_argument('--code-sha', required=True)
    a = p.parse_args()
    print(dict(harvest(a.results, a.input_sha256, a.code_sha)))
