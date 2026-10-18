#!/usr/bin/env python3
"""One bounded official-source refetch of three preregistered archived IDs."""
import argparse
import csv
import hashlib
import io
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

IDS = {'40097460027053', '40097460026060', '40097460019516'}
FIELDS = ['source_id', 'plate_id', 'scan_id', 'ra_icrs', 'dec_icrs', 'gaiaedr3_id', 'sextractor_flags']
QUERY = 'SELECT TOP 3 ' + ','.join(FIELDS) + ' FROM applause_dr4.source_calib WHERE source_id IN (40097460027053,40097460026060,40097460019516)'
ENDPOINT = 'https://www.plate-archive.org/tap/sync'
CAP = 100_000

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Redirect rejected; official endpoint must respond directly')

def normalize(raw):
    if len(raw) > CAP or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
        raise ValueError('Unsafe or oversized XML')
    root = ET.fromstring(raw)
    ns = {'v': 'http://www.ivoa.net/xml/VOTable/v1.3'}
    statuses = [e.attrib.get('value') for e in root.findall('.//v:INFO', ns) if e.attrib.get('name') == 'QUERY_STATUS']
    if not statuses or any(s != 'OK' for s in statuses):
        raise ValueError('TAP query incomplete or failed')
    fields = [e.attrib.get('name') for e in root.findall('.//v:FIELD', ns)]
    if fields != FIELDS:
        raise ValueError('Unexpected source schema')
    rows = [[e.text or '' for e in tr] for tr in root.findall('.//v:TR', ns)]
    if len(rows) != 3 or any(len(r) != len(FIELDS) for r in rows):
        raise ValueError('Expected exactly three complete records')
    if {r[0] for r in rows} != IDS or any(r[1:3] != ['7538', '9720'] for r in rows):
        raise ValueError('Unexpected identity, plate, or scan')
    out = io.StringIO(newline='')
    writer = csv.writer(out, lineterminator='\n')
    writer.writerow(FIELDS)
    writer.writerows(sorted(rows, key=lambda r: int(r[0])))
    return out.getvalue().encode()

def collect(destination, expected):
    dest = Path(destination)
    dest.mkdir(parents=True, exist_ok=False)
    (dest / 'query.adql').write_text(QUERY + '\n')
    url = ENDPOINT + '?' + urllib.parse.urlencode(dict(REQUEST='doQuery', LANG='ADQL', FORMAT='votable', QUERY=QUERY, MAXREC='3'))
    try:
        opener = urllib.request.build_opener(NoRedirect())
        with opener.open(urllib.request.Request(url, headers={'User-Agent': 'vasco-bounded-replay/1'}), timeout=25) as response:
            raw = response.read(CAP + 1)
        (dest / 'response.xml').write_bytes(raw)
        normalized = normalize(raw)
        digest = hashlib.sha256(normalized).hexdigest()
        if digest != expected:
            raise ValueError('Official source differs from frozen semantic baseline; preserve and stop')
        (dest / 'input.csv').write_bytes(normalized)
        (dest / 'COLLECTION.md').write_text('\n'.join([
            '---', 'type: Result', 'title: Bounded official APPLAUSE refetch',
            'status: verified-refetch', 'research_front: vasco-historical-transients-falsification',
            'retrieved_utc: ' + datetime.now(timezone.utc).isoformat(),
            'raw_sha256: ' + hashlib.sha256(raw).hexdigest(), 'normalized_sha256: ' + digest,
            'query_sha256: ' + hashlib.sha256((QUERY+'\n').encode()).hexdigest(), '---', '',
            'Source: ' + ENDPOINT, 'DOI: https://doi.org/10.17876/plate/dr.4/13',
            'Three IDs fixed from the archived stratified sample before this refetch.',
            'Fresh source verification, not a fresh independent statistical sample.',
            'Raw XML retained; normalized CSV sorts IDs and encodes null as empty.',
            'Proper motion, independent Gaia matching and astrophysical controls: NOT_RUN.', '']))
        return digest
    except Exception as error:
        (dest / 'FAILURE.md').write_text('Collection failed; expansion stopped.\n' + type(error).__name__ + ': ' + str(error) + '\n')
        raise

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--output', required=True)
    p.add_argument('--expected-normalized-sha256', required=True)
    a = p.parse_args()
    print(collect(a.output, a.expected_normalized_sha256))
