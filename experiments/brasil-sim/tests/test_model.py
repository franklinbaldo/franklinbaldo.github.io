"""Offline tests: no invented BCB observations are ever published as real."""
import unittest
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from model import (parse_series, monthly_observations, mcmc, expected,
                   run, log_likelihood, next_month, quantile)


def fixture():
    months = [next_month("2021-01", i) for i in range(65)]
    def points(fn):
        return [{"date": f"{m}-01", "value": fn(i)} for i, m in enumerate(months)]
    return {
        "retrieved_utc": "2026-08-01T00:00:00+00:00",
        "provider": "TEST FIXTURE - NOT OFFICIAL",
        "series": {
            "selic_meta": points(lambda i: 9.0 + (i % 8) / 3),
            "ipca": points(lambda i: 0.3 + 0.08 * ((i % 5) - 2)),
            "ibc_br_sa": points(lambda i: 96 + i * .34 + .7 * ((i % 4) - 2)),
        },
    }


class BrasilSimTests(unittest.TestCase):
    def test_source_validation(self):
        rows = [{"data": "01/01/2026", "valor": "1,25"},
                {"data": "01/02/2026", "valor": "3"},
                {"data": "01/12/2027", "valor": "8"}]
        self.assertEqual(len(parse_series(rows, date(2026, 11, 8))), 2)
        self.assertEqual(parse_series(rows, date(2026, 11, 8))[0]["value"], 1.25)
        with self.assertRaises(ValueError):
            parse_series([{"data": "01/01/2026", "valor": "NaN"}], date(2026, 11, 8))
        with self.assertRaises(ValueError):
            parse_series([{"data": "01/01/2026", "valor": 1},
                          {"data": "01/01/2026", "valor": 3}], date(2026, 11, 8))

    def test_chain_and_equations(self):
        self.assertEqual(next_month("2026-12"), "2027-01")
        obs, selic = monthly_observations(fixture())
        self.assertEqual(len(obs), 65)
        self.assertGreater(selic, 0)
        params = (.002, .2, .01, .004, .4, .1, 0.0, .02, .004)
        g, pi = expected(params, .01, .004, .11)
        self.assertTrue(-1 < g < 1 and -1 < pi < 1)
        self.assertTrue(log_likelihood(params, obs) < 1e9)

    def test_posterior_reproducible(self):
        obs, _ = monthly_observations(fixture())
        a, info = mcmc(obs, seed=9, draws=24, warmup=10, thin=3)
        b, _ = mcmc(obs, seed=9, draws=24, warmup=10, thin=3)
        self.assertEqual(a, b)
        self.assertEqual(info["draws"], 8)
        self.assertEqual(quantile([1, 2, 3], .5), 2)

    def test_127_products_micro_and_stock_conservation(self):
        results = run(fixture(), agents=240, categories=127, horizon=3,
                      seed=77, mcmc_draws=48, mcmc_warmup=20)
        self.assertEqual(results["product_categories"], 127)
        self.assertEqual(len(results["scenarios"]), 3)
        self.assertEqual(len(results["scenarios"]["selic_constante"]), 3)
        for scenario, products in results["synthetic_products"].items():
            self.assertEqual(len(products), 3 * 127)
            for cat in range(127):
                prior = products[cat]["ending_stock_units_synthetic"]
                for month in range(1, 3):
                    row = products[month * 127 + cat]
                    self.assertAlmostEqual(prior + row["produced_units_synthetic"],
                                           row["sold_units_synthetic"] + row["ending_stock_units_synthetic"],
                                           delta=1e-6 * max(1, prior))
                    prior = row["ending_stock_units_synthetic"]
                self.assertGreaterEqual(prior, 0)
            self.assertEqual(len(results["synthetic_micro"][scenario]), 3)
        self.assertIsNone(results["synthetic_micro"]["selic_constante"][0]["longevity_years"])
        self.assertEqual(results["population"], 215_000_000)


if __name__ == "__main__":
    unittest.main()
