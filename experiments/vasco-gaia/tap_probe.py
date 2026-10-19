#!/usr/bin/env python3
"""Read-only, bounded APPLAUSE DR4 TAP diagnostic. An error is never a nondetection."""
import argparse
import hashlib
import http.client
import signal
import threading
from contextlib import contextmanager
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ENDPOINT = "https://www.plate-archive.org/tap/sync"
MAX_RESPONSE = 2_000_000
QUERIES = {
    "schema_smoke": "SELECT TOP 1 table_name FROM TAP_SCHEMA.tables WHERE table_name='applause_dr4.source_calib'",
    "source_exact_gaia": "SELECT TOP 1 source_id,plate_id,scan_id,gaiaedr3_id FROM applause_dr4.source_calib WHERE plate_id=7538 AND gaiaedr3_id=2032807544502144384",
}

def classify(status, payload):
    try:
        root = ET.fromstring(payload)
    except (ET.ParseError, LookupError, ValueError):
        return "http_error" if status != 200 else "invalid_votable"
    if root.tag.rsplit('}', 1)[-1] != 'VOTABLE':
        return "http_error" if status != 200 else "invalid_votable"
    infos = [x for x in root.iter() if x.tag.rsplit('}', 1)[-1] == 'INFO' and x.attrib.get('name') == 'QUERY_STATUS']
    if not infos:
        return "http_error" if status != 200 else "unknown_status"
    if any(x.attrib.get('value', '').upper() == 'ERROR' for x in infos):
        message = ' '.join(''.join(x.itertext()) for x in infos).lower()
        return 'tap_statement_timeout' if 'statement timeout' in message else 'tap_error'
    if status != 200:
        return "http_error"
    return "valid_votable" if all(x.attrib.get('value', '').upper() in ('OK', 'OVERFLOW') for x in infos) else "unknown_status"

class DeadlineUnavailable(RuntimeError):
    """A hard request deadline cannot be installed safely in this context."""


class _RequestDeadlineExceeded(Exception):
    """Escape transport retries, which may catch OSError/TimeoutError."""


@contextmanager
def request_deadline(timeout):
    # urlopen's timeout is an inactivity timeout, not a total request budget.
    # A real-time signal also interrupts DNS, response headers and slow reads.
    if (threading.current_thread() is not threading.main_thread()
            or not hasattr(signal, 'setitimer')
            or not hasattr(signal, 'SIGALRM')):
        raise DeadlineUnavailable('hard deadlines require a POSIX main thread')
    if signal.getitimer(signal.ITIMER_REAL) != (0.0, 0.0):
        # Do not steal an embedding application's active alarm.
        raise DeadlineUnavailable('an existing real-time timer is active')
    previous_handler = signal.getsignal(signal.SIGALRM)

    def expired(signum, frame):
        raise _RequestDeadlineExceeded('absolute request deadline exceeded')

    signal.signal(signal.SIGALRM, expired)
    try:
        signal.setitimer(signal.ITIMER_REAL, timeout)
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous_handler)


def request_query(query, endpoint=ENDPOINT, timeout=20):
    if query not in QUERIES:
        raise ValueError("Query must be one of the frozen named probes")
    if not 0 < timeout <= 30:
        raise ValueError('timeout must be positive and at most 30 seconds')
    qs = urllib.parse.urlencode({'REQUEST': 'doQuery', 'LANG': 'ADQL', 'QUERY': QUERIES[query], 'FORMAT': 'votable', 'MAXREC': '2'})
    req = urllib.request.Request(endpoint + '?' + qs)
    status = None
    try:
        with request_deadline(timeout):
            try:
                response = urllib.request.urlopen(req, timeout=timeout)
            except urllib.error.HTTPError as exc:
                response = exc
            # HTTPError is also a response: read and close it inside the same
            # deadline and exception boundary as a successful HTTP response.
            with response:
                status = response.code
                payload = response.read(MAX_RESPONSE + 1)
    except DeadlineUnavailable as exc:
        return {'probe': query, 'result': 'deadline_unavailable', 'error': str(exc)}
    except (_RequestDeadlineExceeded, urllib.error.URLError, OSError, http.client.HTTPException) as exc:
        record = {'probe': query, 'result': 'network_unavailable', 'error_type': type(exc).__name__}
        if status is not None:
            record['http_status'] = status
        return record
    if len(payload) > MAX_RESPONSE:
        return {'probe': query, 'result': 'response_too_large', 'http_status': status}
    return {'probe': query, 'result': classify(status, payload), 'http_status': status,
            'response_sha256': hashlib.sha256(payload).hexdigest(), 'response_bytes': len(payload)}

def format_finding(records, timestamp):
    lines = ['---', 'type: Finding',
             'title: "VASCO APPLAUSE DR4 TAP bounded availability probes"',
             'status: exploratory', 'research_front: vasco-historical-transients-falsification',
             '---', '', '# TAP diagnostic', '',
             f'Executed UTC: {timestamp}', '',
             'This is server-health evidence; an ERROR/timeout is **not** a source nondetection.',
             'The probes are fixed and read-only; no bulk source retrieval is attempted.', '']
    for r in records:
        lines.append(f"- {r['probe']}: **{r['result']}**, HTTP {r.get('http_status', 'N/A')}, bytes {r.get('response_bytes', 'N/A')}, response SHA-256 `{r.get('response_sha256', 'N/A')}`")
    return '\n'.join(lines + ['', 'Scientific source completeness: NOT_RUN.',
                               'Physical transient detection: NOT_RUN.', ''])

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--output', required=True)
    p.add_argument('--timeout', type=int, default=20)
    a = p.parse_args()
    if not 1 <= a.timeout <= 30:
        p.error('timeout must be 1–30 seconds')
    out = Path(a.output)
    if out.exists():
        p.error('output already exists: immutable diagnostic')
    records = [request_query(k, timeout=a.timeout) for k in QUERIES]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(format_finding(records, datetime.now(timezone.utc).isoformat()), encoding='utf-8')
    for r in records:
        print(r)
    return 0 if all(r['result'] == 'valid_votable' for r in records) else 2

if __name__ == '__main__':
    raise SystemExit(main())

