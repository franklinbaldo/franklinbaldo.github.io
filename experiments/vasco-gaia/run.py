#!/usr/bin/env python3
"""Bounded APPLAUSE E0 accounting. Missing upstream matches are not transients."""
import argparse
import csv
import hashlib
import io
import platform
import re
from collections import Counter
from pathlib import Path

LABELS = ('gaia_clean', 'no_gaia_clean', 'review')
MAX_BYTES = 30_000_000
MAX_ROWS = 2500
NULLS = {'', 'null', 'none', 'nan'}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def classify(row):
    flags = row['sextractor_flags'].strip()
    gaia = row['gaiaedr3_id'].strip()
    if flags != '0':
        return 'review'
    if gaia.lower() in NULLS:
        return 'no_gaia_clean'
    if not re.fullmatch(r'[1-9][0-9]*', gaia):
        return 'review'
    return 'gaia_clean'


def classify_bytes(raw):
    if len(raw) > MAX_BYTES:
        raise ValueError('Input exceeds byte cap')
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig'), newline=''))
    fields = reader.fieldnames or []
    required = {'source_id', 'plate_id', 'scan_id', 'gaiaedr3_id', 'sextractor_flags'}
    if len(set(fields)) != len(fields) or not required.issubset(fields):
        raise ValueError('Missing or duplicate required columns')
    seen, rows = set(), []
    for row in reader:
        if None in row or any(v is None for v in row.values()):
            raise ValueError('Ragged CSV record')
        sid = row['source_id'].strip()
        if not re.fullmatch(r'[1-9][0-9]*', sid) or sid in seen:
            raise ValueError('Invalid or duplicate source ID')
        if row['plate_id'].strip() != '7538' or row['scan_id'].strip() != '9720':
            raise ValueError('Unexpected plate or scan')
        seen.add(sid)
        rows.append((sid, classify(row)))
        if len(rows) > MAX_ROWS:
            raise ValueError('Pilot row cap exceeded; full scan requires separate configuration')
    if not rows:
        raise ValueError('Empty catalog')
    return rows


def run(source, out, expected, code_sha):
    source, out = Path(source).resolve(strict=True), Path(out).resolve()
    if out == source or out in source.parents:
        raise ValueError('Source must be outside output')
    if out.exists():
        raise ValueError('Output exists; immutable runs cannot be overwritten')
    if not re.fullmatch(r'[0-9a-f]{64}', expected):
        raise ValueError('Exact input SHA256 required')
    if code_sha != 'UNCOMMITTED' and not re.fullmatch(r'[0-9a-f]{40}', code_sha):
        raise ValueError('Exact code commit required')
    with source.open("rb") as stream:
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("Input exceeds byte cap")
    if sha256(raw) != expected:
        raise ValueError('Input hash mismatch')
    rows = classify_bytes(raw)
    counts = Counter(label for _, label in rows)
    runner_hash = sha256(Path(__file__).read_bytes())
    identity = sha256(f'{code_sha}\n{runner_hash}\n{expected}\n7538\n9720\ne0-v2'.encode())
    out.mkdir(parents=True)
    (out / 'input.csv').write_bytes(raw)
    with (out / 'classifications.csv').open('w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['source_id', 'classification'])
        writer.writerows(rows)
    result_hash = sha256((out / 'classifications.csv').read_bytes())
    lines = ['---', 'type: Result', 'title: Hamburg 7538 upstream Gaia catalog accounting',
             'status: exploratory',
             'research_front: vasco-historical-transients-falsification',
             'canonical_protocol_commit: 3820bb71a4c11440d926eb1d42f90276ad7f1a8a',
             'canonical_protocol_blob: cf225fac89c5874a1500a7fb3de387b06ff0775e', f'run_identity: {identity}', f'code_commit: {code_sha}',
             f'runner_sha256: {runner_hash}', f'input_sha256: {expected}',
             f'result_sha256: {result_hash}', f'processed_sources: {len(rows)}',
             f'python_version: "{platform.python_version()}"', '---', '',
             '# Catalog accounting replay', '',
             'Source DOI: https://doi.org/10.17876/plate/dr.4/13 (APPLAUSE DR4).',
             'Canonical protocol: https://github.com/franklinbaldo/papers/blob/3820bb71a4c11440d926eb1d42f90276ad7f1a8a/experiments/vasco_transients/PROTOCOL.md',
             ('Input context: official refetch of three preselected archived IDs; one per category, not an independent sample.'
              if expected == '329b0f22f1fbdf13557970b5091a551407cdc0ad95dc416a041e35c5d5f86774'
              else 'Input context: archived stratified fixture, 12 per category; original collection not reproduced.'
              if expected == '214798342dfd2be13cc10335f713fc8d80cb3150e914230ad12fb94c2797283d'
              else 'Input context: custom data; provenance must be provided separately.'),
             'This is a computational replay, not completion of scientific E0.',
             f'Reproduce: python experiments/vasco-gaia/run.py --input input.csv --input-sha256 {expected} --code-sha {code_sha} --output fresh-results', '', 'Input: APPLAUSE DR4 source_calib; plate 7538, scan 9720.', '',
             *[f'- {label}: {counts[label]}' for label in LABELS], '',
             'Accounting and unique source identifiers: PASS.',
             'Proper motion, astrometric uncertainty, FITS/PSF, injection recovery,',
             'cross-scan and independent exposure controls: NOT_RUN.', '',
             'A blank upstream Gaia identifier does not establish absence from Gaia or a transient.',
             'The bounded sample is partial and nonrandom; category rates are not population estimates.',
             'Repeated scans of one plate are not independent astronomical exposures.', '']
    (out / 'RESULT.md').write_text('\n'.join(lines))
    (out / 'SHA256SUMS').write_text(''.join(f'{sha256(p.read_bytes())}  {p.name}\n' for p in sorted(out.iterdir()) if p.is_file()))
    return counts


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--input', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--input-sha256', required=True)
    p.add_argument('--code-sha', required=True)
    a = p.parse_args()
    print(dict(run(a.input, a.output, a.input_sha256, a.code_sha)))
