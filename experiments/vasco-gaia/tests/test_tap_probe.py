import importlib.util
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

PATH = Path(__file__).resolve().parents[1] / 'tap_probe.py'
spec = importlib.util.spec_from_file_location('tap_probe', PATH)
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

def votable(message='', value='OK'):
    return (f'<VOTABLE xmlns="http://www.ivoa.net/xml/VOTable/v1.3"><RESOURCE type="results">'
            f'<INFO name="QUERY_STATUS" value="{value}">{message}</INFO></RESOURCE></VOTABLE>').encode()

class ProbeTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(probe.classify(200, votable()), 'valid_votable')
    def test_statement_timeout_is_not_absence(self):
        self.assertEqual(probe.classify(400, votable('canceling statement due to statement timeout', 'ERROR')), 'tap_statement_timeout')
    def test_other_tap_error(self):
        self.assertEqual(probe.classify(400, votable('bad query', 'ERROR')), 'tap_error')
    def test_invalid_votable(self):
        self.assertEqual(probe.classify(200, b'Bad response'), 'invalid_votable')
    def test_unknown_status(self):
        self.assertEqual(probe.classify(200, b'<VOTABLE/>'), 'unknown_status')
    def test_restrict_queries(self):
        with self.assertRaises(ValueError):
            probe.request_query('SELECT * FROM secrets')
    def test_network_failure(self):
        with patch.object(probe.urllib.request, 'urlopen', side_effect=urllib.error.URLError('offline')):
            result = probe.request_query('schema_smoke')
        self.assertEqual(result['result'], 'network_unavailable')
    def test_report_preserves_not_run(self):
        result = probe.format_finding([{'probe': 'source_exact_gaia', 'result': 'tap_statement_timeout', 'http_status': 400}], '2026-10-18T00:00:00Z')
        self.assertIn('NOT_RUN', result)
        self.assertIn('**not** a source nondetection', result)

if __name__ == '__main__':
    unittest.main()
