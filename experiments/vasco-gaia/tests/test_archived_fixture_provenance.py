"""Regression gates for the frozen *nonrepresentative* Hamburg 7538 fixture.

These tests exercise archived input only. They are neither a new APPLAUSE query
nor a Gaia proper-motion cross-match nor a transient detection.
"""
import csv
import hashlib
import importlib.util
import io
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "experiments/vasco-gaia/fixtures/hamburg_7538_real_36.csv"
RUNNER = ROOT / "experiments/vasco-gaia/run.py"
EXPECTED_SHA256 = "214798342dfd2be13cc10335f713fc8d80cb3150e914230ad12fb94c2797283d"
EXPECTED_COUNTS = {"gaia_clean": 12, "no_gaia_clean": 12, "review": 12}


def load_runner():
    spec = importlib.util.spec_from_file_location("vasco_fixture_runner", RUNNER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ArchivedFixtureEvidence(unittest.TestCase):
    def test_frozen_input_hash_and_source_scope(self):
        raw = FIXTURE.read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), EXPECTED_SHA256)
        rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
        self.assertEqual(len(rows), 36)
        self.assertEqual(len({row["source_id"] for row in rows}), 36)
        self.assertEqual({(row["plate_id"], row["scan_id"]) for row in rows}, {("7538", "9720")})

    def test_archived_classes_are_deliberately_balanced(self):
        raw = FIXTURE.read_bytes()
        labels = load_runner().classify_bytes(raw)
        self.assertEqual(dict(Counter(label for _, label in labels)), EXPECTED_COUNTS)
        self.assertEqual(len(labels), 36)

    def test_hash_mismatch_detected_before_classification(self):
        raw = FIXTURE.read_bytes()
        altered = raw.replace(b"7538", b"7539", 1)
        self.assertNotEqual(hashlib.sha256(altered).hexdigest(), EXPECTED_SHA256)


if __name__ == "__main__":
    unittest.main()
