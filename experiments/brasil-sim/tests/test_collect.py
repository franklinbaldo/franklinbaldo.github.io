import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from collect import SOURCES, build_snapshot, forecast, quantile, shift_month

class BrasilSimTests(unittest.TestCase):
    def fake_get(self, url):
        code = int(url.split("bcdata.sgs.")[1].split("/")[0])
        rows = []
        for j in range(1, 30):
            value = (11 + j * .04) if code == 432 else (.15 + j * .007 if code == 433 else 138 + j * .45)
            rows.append({"data": f"01/{j%12+1:02d}/{2022+j//12}", "valor": str(value)})
        return json.dumps(rows).encode()

    def test_snapshot_official_shape(self):
        snapshot = build_snapshot(self.fake_get)
        self.assertEqual(set(snapshot["series"]), set(SOURCES))
        self.assertEqual(snapshot["series"]["selic"]["code"], 432)
        self.assertEqual(snapshot["series"]["ipca"]["frequency"], "monthly")

    def test_determinism_and_quantiles(self):
        snapshot = build_snapshot(self.fake_get)
        a = forecast(snapshot, draws=100)
        self.assertEqual(a, forecast(snapshot, draws=100))
        self.assertEqual(len(a["forecasts"]), 36)
        self.assertTrue(all(r["p05"] <= r["p50"] <= r["p95"] for r in a["forecasts"]))

    def test_calendar(self):
        self.assertEqual(shift_month("2026-12", 2), "2027-02")
        self.assertEqual(quantile([1,2,3,4], .5), 2.5)

    def test_wrong_source_rejected(self):
        snapshot = build_snapshot(self.fake_get)
        snapshot["series"]["ipca"]["code"] = 11
        with self.assertRaises(ValueError):
            forecast(snapshot)

    def test_fails_on_empty_data(self):
        with self.assertRaises(ValueError):
            build_snapshot(lambda _: b"[]")

if __name__ == "__main__":
    unittest.main()
