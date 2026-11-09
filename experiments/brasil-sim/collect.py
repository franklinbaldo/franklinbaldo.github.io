#!/usr/bin/env python3
"""Collect real BCB SGS series and produce a reproducible, uncalibrated baseline.

No synthetic data or fallback observations are emitted. Python standard library only.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import math
import random
import statistics
import urllib.request
from pathlib import Path

SOURCES = {
    "selic": {"code": 432, "unit": "percent_per_year", "frequency": "daily", "limit": 300},
    "ipca": {"code": 433, "unit": "percent_per_month", "frequency": "monthly", "limit": 120},
    "ibc_br": {"code": 24363, "unit": "index", "frequency": "monthly", "limit": 120},
}
ROOT = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados/ultimos/{limit}?formato=json"

def read_series(name: str, get=None) -> dict:
    spec = SOURCES[name]
    url = ROOT.format(code=spec["code"], limit=spec["limit"])
    if get is None:
        def get(u):
            request = urllib.request.Request(u, headers={"Accept": "application/json", "User-Agent": "BrasilSim-observatorio/0.1"})
            with urllib.request.urlopen(request, timeout=25) as response:
                return response.read()
    raw = json.loads(get(url).decode("utf-8"))
    if not isinstance(raw, list) or not raw:
        raise ValueError(name + ": empty official dataset")
    dates = {}
    for entry in raw:
        date = dt.datetime.strptime(entry["data"], "%d/%m/%Y").date().isoformat()
        value = float(str(entry["valor"]).replace(",", "."))
        if not math.isfinite(value):
            raise ValueError(name + ": nonfinite value")
        dates[date] = value
    rows = [{"date": date, "value": value} for date, value in sorted(dates.items())]
    if len(rows) < 12:
        raise ValueError(name + ": fewer than 12 official observations")
    return {"code": spec["code"], "frequency": spec["frequency"],
            "unit": spec["unit"], "source_url": url,
            "last_observation": rows[-1]["date"], "rows": rows}

def quantile(values: list[float], prob: float) -> float:
    values = sorted(values)
    idx = (len(values) - 1) * prob
    i = int(idx)
    return values[i] + (values[min(i + 1, len(values) - 1)] - values[i]) * (idx - i)

def shift_month(month: str, delta: int) -> str:
    y, m = map(int, month.split("-"))
    t = y * 12 + m - 1 + delta
    return f"{t // 12:04d}-{t % 12 + 1:02d}"

def month_values(item: dict) -> list[tuple[str, float]]:
    monthly = {}
    for row in item["rows"]:
        monthly[row["date"][:7]] = row["value"]
    return sorted(monthly.items())

def forecast(snapshot: dict, months: int = 12, draws: int = 400, seed: int = 20261108) -> dict:
    """Illustrative mean-reverting bootstrap innovations, NOT a structural economy or MCMC."""
    rng = random.Random(seed)
    all_paths = {}
    months_seen = []
    for key, spec in SOURCES.items():
        obj = snapshot["series"][key]
        if obj["code"] != spec["code"]:
            raise ValueError("Wrong SGS code for " + key)
        series = month_values(obj)
        if len(series) < 4:
            raise ValueError("Insufficient monthly history for " + key)
        months_seen += [m for m, _ in series]
        values = [v for _, v in series[-36:]]
        deltas = [b - a for a, b in zip(values, values[1:])]
        avg = statistics.mean(values)
        sigma = max(0.00001, statistics.pstdev(deltas))
        minimum = {"selic": 0.0, "ipca": -10.0, "ibc_br": 0.0001}[key]
        maximum = {"selic": 40.0, "ipca": 20.0, "ibc_br": 99999.0}[key]
        all_paths[key] = []
        for _ in range(draws):
            v = values[-1]
            path = []
            for _ in range(months):
                v = max(minimum, min(maximum, v + .10 * (avg - v) + rng.choice(deltas) * .65 + rng.gauss(0, sigma * .35)))
                path.append(v)
            all_paths[key].append(path)
    # Align all series to the latest date available across sources; individual origins remain in metadata.
    anchor = max(months_seen)
    rows = []
    for h in range(months):
        for key in SOURCES:
            v = [path[h] for path in all_paths[key]]
            rows.append({"variable": key, "month": shift_month(anchor, h + 1),
                         "p05": round(quantile(v, .05), 6),
                         "p50": round(quantile(v, .50), 6),
                         "p95": round(quantile(v, .95), 6)})
    return {"model": "mean-reverting-innovation-bootstrap-v0.1",
            "description": "Experimental heuristic, not a validated prediction, Bayesian posterior, MCMC or structural model",
            "source_dates": {k: v["last_observation"] for k, v in snapshot["series"].items()},
            "horizon_months": months, "draws": draws, "seed": seed,
            "forecasts": rows}

def build_snapshot(get=None) -> dict:
    return {"source": "Banco Central do Brasil — SGS", "license": "ODbL", "series": {k: read_series(k, get) for k in SOURCES}}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("public/brasil-sim"))
    parser.add_argument("--snapshot", type=Path, help="Use saved official observations instead of network")
    args = parser.parse_args()
    snapshot = json.loads(args.snapshot.read_text(encoding="utf-8")) if args.snapshot else build_snapshot()
    prediction = forecast(snapshot)
    raw = json.dumps(snapshot, sort_keys=True, ensure_ascii=False)
    prediction["input_sha256"] = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "observations.json").write_text(raw + "\n", encoding="utf-8")
    (args.out / "forecast.json").write_text(json.dumps(prediction, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Collected SGS", ", ".join(f"{k}={v['last_observation']}" for k, v in snapshot["series"].items()))
    print("Wrote", len(prediction["forecasts"]), "experimental quantile forecasts")

if __name__ == "__main__":
    main()
