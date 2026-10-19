import importlib.util
import http.client
import io
import signal
import socket
import time
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import Mock, call, patch

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

class HTTPClassificationTests(unittest.TestCase):
    def test_non_200_failure_bodies_are_http_errors(self):
        for body in (b'upstream unavailable', b'<html>Bad gateway</html>',
                     b'<VOTABLE/>', votable()):
            with self.subTest(body=body):
                self.assertEqual(probe.classify(503, body), 'http_error')


class Response(io.BytesIO):
    code = 200


class FailedBody(Response):
    def read(self, size=-1):
        raise OSError('connection reset while reading')


class SlowBody(Response):
    def read(self, size=-1):
        # Model a peer trickling bytes often enough to avoid inactivity timeout.
        while True:
            time.sleep(0.005)


@unittest.skipUnless(hasattr(signal, 'setitimer'), 'requires POSIX real-time timers')
class RequestDeadlineTests(unittest.TestCase):
    def test_success_and_bounded_read(self):
        response = Response(votable())
        with patch.object(response, 'read', wraps=response.read) as read:
            with patch.object(probe.urllib.request, 'urlopen', return_value=response):
                record = probe.request_query('schema_smoke')
            read.assert_called_once_with(probe.MAX_RESPONSE + 1)
        self.assertEqual(record['result'], 'valid_votable')
        self.assertTrue(response.closed)

    def test_http_error_body_classification_and_close(self):
        for body, expected in ((b'bad gateway', 'http_error'),
                               (votable('statement timeout', 'ERROR'), 'tap_statement_timeout')):
            with self.subTest(expected=expected):
                response = Response(body)
                error = urllib.error.HTTPError('https://example.invalid', 503, 'failed', {}, response)
                with patch.object(probe.urllib.request, 'urlopen', side_effect=error):
                    record = probe.request_query('schema_smoke')
                self.assertEqual(record['result'], expected)
                self.assertEqual(record['http_status'], 503)
                self.assertTrue(response.closed)

    def test_http_error_read_failure_returns_record(self):
        response = FailedBody()
        error = urllib.error.HTTPError('https://example.invalid', 503, 'failed', {}, response)
        with patch.object(probe.urllib.request, 'urlopen', side_effect=error):
            record = probe.request_query('schema_smoke')
        self.assertEqual(record['result'], 'network_unavailable')
        self.assertEqual(record['http_status'], 503)
        self.assertEqual(record['error_type'], 'OSError')
        self.assertTrue(response.closed)

    def test_incomplete_body_returns_record(self):
        response = Response()
        with patch.object(response, 'read', side_effect=http.client.IncompleteRead(b'partial')):
            with patch.object(probe.urllib.request, 'urlopen', return_value=response):
                record = probe.request_query('schema_smoke')
        self.assertEqual(record['result'], 'network_unavailable')
        self.assertTrue(response.closed)

    def test_slow_stream_and_http_error_share_absolute_deadline(self):
        for status in (200, 503):
            with self.subTest(status=status):
                response = SlowBody()
                def open_slowly(*args, **kwargs):
                    time.sleep(0.04)
                    if status != 200:
                        raise urllib.error.HTTPError('https://example.invalid', status, 'failed', {}, response)
                    return response
                previous = signal.getsignal(signal.SIGALRM)
                start = time.monotonic()
                with patch.object(signal, 'setitimer', wraps=signal.setitimer) as timer:
                    with patch.object(probe.urllib.request, 'urlopen', side_effect=open_slowly):
                        record = probe.request_query('schema_smoke', timeout=0.08)
                self.assertEqual(timer.call_args_list, [
                    call(signal.ITIMER_REAL, 0.08), call(signal.ITIMER_REAL, 0)])
                elapsed = time.monotonic() - start
                self.assertEqual(record['result'], 'network_unavailable')
                self.assertEqual(record['error_type'], '_RequestDeadlineExceeded')
                self.assertEqual(record['http_status'], status)
                self.assertLess(elapsed, 0.5)  # Generous scheduling tolerance; timer is armed only once.
                self.assertTrue(response.closed)
                self.assertIs(signal.getsignal(signal.SIGALRM), previous)
                self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))

    def test_open_is_also_deadline_bounded(self):
        with patch.object(probe.urllib.request, 'urlopen', side_effect=lambda *a, **k: time.sleep(1)):
            record = probe.request_query('schema_smoke', timeout=0.03)
        self.assertEqual(record['error_type'], '_RequestDeadlineExceeded')

    def test_deadline_escapes_multiple_address_connection_retry(self):
        # Use the real retry loop: TimeoutError/OSError would be swallowed and
        # the second address attempted after the one-shot alarm has expired.
        addresses = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('192.0.2.1', 80)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('192.0.2.2', 80)),
        ]
        first_socket = Mock()
        first_socket.connect.side_effect = lambda address: time.sleep(1)
        second_socket = Mock()

        def open_connection(*args, **kwargs):
            connection = socket.create_connection(('example.invalid', 80),
                                                  timeout=kwargs['timeout'])
            connection.close()
            return Response(votable())

        with patch.object(socket, 'getaddrinfo', return_value=addresses):
            with patch.object(socket, 'socket', side_effect=[first_socket, second_socket]) as sockets:
                with patch.object(probe.urllib.request, 'urlopen', side_effect=open_connection):
                    record = probe.request_query('schema_smoke', timeout=0.03)
        self.assertEqual(record['result'], 'network_unavailable')
        self.assertEqual(record['error_type'], '_RequestDeadlineExceeded')
        self.assertEqual(sockets.call_count, 1)
        second_socket.connect.assert_not_called()
        self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))

    def test_existing_alarm_is_not_modified(self):
        with patch.object(signal, 'getitimer', return_value=(10.0, 2.0)):
            with patch.object(signal, 'setitimer') as timer, patch.object(signal, 'signal') as handler:
                with patch.object(probe.urllib.request, 'urlopen') as opener:
                    record = probe.request_query('schema_smoke')
        self.assertEqual(record['result'], 'deadline_unavailable')
        timer.assert_not_called()
        handler.assert_not_called()
        opener.assert_not_called()

    def test_unsupported_thread_fails_closed(self):
        with patch.object(probe.threading, 'current_thread', return_value=object()):
            with patch.object(probe.urllib.request, 'urlopen') as opener:
                record = probe.request_query('schema_smoke')
        self.assertEqual(record['result'], 'deadline_unavailable')
        opener.assert_not_called()

    def test_unsupported_platform_fails_closed(self):
        with patch.object(probe, 'signal', object()):
            with patch.object(probe.urllib.request, 'urlopen') as opener:
                record = probe.request_query('schema_smoke')
        self.assertEqual(record['result'], 'deadline_unavailable')
        opener.assert_not_called()

    def test_oversized_response(self):
        with patch.object(probe.urllib.request, 'urlopen', return_value=Response(b'x' * (probe.MAX_RESPONSE + 1))):
            record = probe.request_query('schema_smoke')
        self.assertEqual(record['result'], 'response_too_large')

    def test_invalid_timeout(self):
        for timeout in (0, -1, 31, float('nan')):
            with self.subTest(timeout=timeout), self.assertRaises(ValueError):
                probe.request_query('schema_smoke', timeout=timeout)

if __name__ == '__main__':
    unittest.main()

