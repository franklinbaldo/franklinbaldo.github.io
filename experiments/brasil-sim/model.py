"""BrasilSim 0.1: official-data posterior forecasts and a people-first synthetic economy.

Standard-library only. Monetary quantities in the synthetic layer are indices,
NOT BRL; the real-world official series are only Selic, IPCA, and IBC-Br.
"""
from __future__ import annotations

import argparse
import calendar
import csv
from datetime import date, datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import random
import statistics
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

POPULATION = 215_000_000
AGENTS = 100_000
CATEGORIES = 127
HORIZON = 24
SERIES = {
    "selic_meta": {"code": 432, "frequency": "daily", "unit": "percent_per_year", "count": 2600},
    "ipca": {"code": 433, "frequency": "monthly", "unit": "percent_per_month", "count": 150},
    "ibc_br_sa": {"code": 24364, "frequency": "monthly", "unit": "index", "count": 150},
}
PARAMS = ("drift", "persistence_growth", "rate_demand", "inflation_center",
          "persistence_inflation", "activity_prices", "rate_prices", "sd_growth", "sd_inflation")
BOUNDS = ((-.012,.02),(-.5,.94),(0,.14),(-.004,.018),(-.5,.94),(-.3,.7),(-.055,.055),(.001,.07),(.0005,.022))
STEPS = (.0015,.07,.01,.001,.07,.055,.004,.002,.0008)
START = (.002,.27,.018,.004,.36,.13,.0,.018,.004)
REAL_NEUTRAL = .045  # Explicit exploratory assumption, NOT an official estimated rate.


def month_key(d: date) -> str:
    return d.strftime("%Y-%m")


def next_month(ym: str, offset: int = 1) -> str:
    year, month = map(int, ym.split("-"))
    i = year * 12 + (month - 1) + offset
    return f"{i // 12:04d}-{i % 12 + 1:02d}"


def parse_series(rows: list[dict], today: date) -> list[dict]:
    result = {}
    for entry in rows:
        if "data" not in entry or "valor" not in entry:
            raise ValueError("Missing official SGS fields")
        d = datetime.strptime(entry["data"], "%d/%m/%Y").date()
        if d > today:  # SGS daily series can contain future-dated entries
            continue
        value = float(str(entry["valor"]).replace(",", "."))
        if not math.isfinite(value):
            raise ValueError("Non-finite official SGS value")
        if d in result and result[d] != value:
            raise ValueError("Conflicting official values for one date")
        result[d] = value
    if not result:
        raise ValueError("Official SGS series empty after date filtering")
    return [{"date": d.isoformat(), "value": value} for d, value in sorted(result.items())]


def fetch_series(code: int, count: int, today: date) -> list[dict]:
    # SGS /ultimos/N is capped at N=20. Longer histories MUST use dated ranges.
    # Daily series: <= 3 years per request (the documented maximum is 10 years).
    # Monthly series: one <= 8-year range. Never fall back to fabricated data.
    start = date(today.year - 7, 1, 1)
    windows = []
    if code == 432:
        cursor = start
        while cursor <= today:
            end = min(today, date(cursor.year + 2, 12, 31))
            windows.append((cursor, end))
            cursor = date(end.year + 1, 1, 1) if end.month == 12 else today
            if cursor <= end:
                break
    else:
        windows = [(start, today)]
    collected = []
    for start_day, end_day in windows:
        endpoint = (
            f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?"
            f"formato=json&dataInicial={start_day.strftime('%d/%m/%Y')}"
            f"&dataFinal={end_day.strftime('%d/%m/%Y')}"
        )
        last_error = None
        for attempt in range(3):
            try:
                req = Request(endpoint, headers={"User-Agent": "BrasilSim/0.1 official-sgs-study", "Accept": "application/json"})
                with urlopen(req, timeout=35) as response:
                    payload = response.read(2_000_000)
                    if response.read(1):
                        raise ValueError("Official SGS response exceeds bounded size")
                rows = json.loads(payload)
                if not isinstance(rows, list):
                    raise ValueError("Unexpected official SGS response")
                collected.extend(rows)
                break
            except (OSError, ValueError, json.JSONDecodeError) as err:
                last_error = err
                if attempt < 2:
                    time.sleep(2 ** attempt)
        else:
            raise RuntimeError(f"Official SGS series {code} unavailable for {start_day}/{end_day}: {last_error}")
    return parse_series(collected, today)


def fetch_official(today: date | None = None) -> dict:
    today = today or datetime.now(timezone.utc).date()
    observed = {key: fetch_series(spec["code"], spec["count"], today) for key, spec in SERIES.items()}
    return {
        "retrieved_utc": datetime.now(timezone.utc).isoformat(),
        "provider": "Banco Central do Brasil - SGS",
        "endpoint_pattern": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial=DD/MM/YYYY&dataFinal=DD/MM/YYYY",
        "series": observed,
        "definitions": SERIES,
    }


def monthly_observations(snapshot: dict) -> tuple[list[dict], float]:
    raw = snapshot["series"]
    monthly = {}
    for name in ("ipca", "ibc_br_sa"):
        monthly[name] = {item["date"][:7]: item["value"] for item in raw[name]}
    # Daily policy observations are aggregated by last date in each calendar month.
    policy = {}
    for item in raw["selic_meta"]:
        policy[item["date"][:7]] = item["value"] / 100
    common = sorted(set(monthly["ipca"]) & set(monthly["ibc_br_sa"]) & set(policy))
    obs = [{"month": m, "ipca": monthly["ipca"][m] / 100,
            "ibc": monthly["ibc_br_sa"][m], "selic": policy[m]} for m in common]
    obs = [o for o in obs if o["ibc"] > 0 and o["ipca"] > -.99]
    # Use the longest recent contiguous block to prevent treating gaps as one month.
    block = []
    for o in obs:
        if block and o["month"] != next_month(block[-1]["month"]):
            block = []
        block.append(o)
    if len(block) < 25:
        raise ValueError(f"Insufficient aligned monthly history: {len(block)} (need 25)")
    last_selic = raw["selic_meta"][-1]["value"] / 100
    return block, last_selic


def monthly_growth(a: dict, b: dict) -> float:
    return math.log(b["ibc"] / a["ibc"])


def expected(theta: tuple, prev_growth: float, prev_pi: float, policy: float) -> tuple[float, float]:
    drift, rho_g, beta, pi_center, rho_pi, gamma, cost, _, _ = theta
    real_gap = policy - (12.0 * prev_pi) - REAL_NEUTRAL
    growth = drift + rho_g * (prev_growth - drift) - beta * real_gap
    inflation = pi_center + rho_pi * (prev_pi - pi_center) + gamma * (growth - drift) + cost * real_gap
    return growth, inflation


def log_likelihood(theta: tuple, obs: list[dict]) -> float:
    if any(not (lo < x < hi) for x, (lo, hi) in zip(theta, BOUNDS)):
        return -math.inf
    sg, sp = theta[-2:]
    score = 0.0
    for i in range(2, len(obs)):
        previous_growth = monthly_growth(obs[i-2], obs[i-1])
        actual_growth = monthly_growth(obs[i-1], obs[i])
        g, p = expected(theta, previous_growth, obs[i-1]["ipca"], obs[i-1]["selic"])
        score -= .5 * ((actual_growth - g) / sg) ** 2 + math.log(sg)
        score -= .5 * ((obs[i]["ipca"] - p) / sp) ** 2 + math.log(sp)
    return score


def mcmc(obs: list[dict], seed: int, draws: int = 2400, warmup: int = 900, thin: int = 12) -> tuple[list[tuple], dict]:
    rng = random.Random(seed)
    theta = list(START)
    score = log_likelihood(theta, obs)
    samples = []
    accepted = 0
    attempted = 0
    for i in range(draws + warmup):
        j = i % len(theta)
        proposal = list(theta)
        proposal[j] += rng.gauss(0, STEPS[j])
        new_score = log_likelihood(proposal, obs)
        if new_score != -math.inf and math.log(max(1e-300, rng.random())) < new_score - score:
            theta, score = proposal, new_score
            accepted += 1
        attempted += 1
        if i >= warmup and (i - warmup) % thin == 0:
            samples.append(tuple(theta))
    return samples, {"method": "componentwise_random_walk_metropolis",
                     "accepted_fraction": accepted / attempted,
                     "draws": len(samples), "warmup": warmup,
                     "steps": draws, "seed": seed,
                     "parameters": list(PARAMS), "constraints": BOUNDS,
                     "neutral_real_rate_assumption": REAL_NEUTRAL,
                     "effective_sample_size": None, "convergence_certified": False}


def quantile(values: list[float], p: float) -> float:
    a = sorted(values)
    k = (len(a) - 1) * p
    j = int(k)
    return a[j] * (1 - (k - j)) + a[min(j + 1, len(a) - 1)] * (k - j)


def draw_forecasts(obs: list[dict], samples: list[tuple], policy: float, seed: int, horizon: int) -> list[list[dict]]:
    rng = random.Random(seed)
    last = obs[-1]
    prior_g = monthly_growth(obs[-2], obs[-1])
    history = [(o["month"], o["ipca"], o["ibc"]) for o in obs[-12:]]
    paths = []
    for _ in range(min(160, len(samples))):
        theta = samples[rng.randrange(len(samples))]
        g, p = prior_g, last["ipca"]
        ibc = last["ibc"]
        chain = history[:]
        path = []
        for t in range(1, horizon + 1):
            g_pred, p_pred = expected(theta, g, p, policy)
            g = max(-.3, min(.3, rng.gauss(g_pred, theta[-2])))
            p = max(-.15, min(.20, rng.gauss(p_pred, theta[-1])))
            ibc = max(.01, ibc * math.exp(g))
            month = next_month(last["month"], t)
            chain.append((month, p, ibc))
            last12 = chain[-12:]
            ipca_yoy = (math.prod(1 + record[1] for record in last12) - 1) * 100
            ibc_yoy = 100 * (ibc / chain[-13][2] - 1) if len(chain) >= 13 else None
            path.append({"month": month, "ipca_mom_pct": 100 * p, "ipca_yoy_pct": ipca_yoy,
                         "ibc_index": ibc, "ibc_mom_pct": 100 * (math.exp(g) - 1),
                         "ibc_yoy_pct": ibc_yoy, "selic_annual_pct": policy * 100,
                         "real_policy_rate_gap_pct": (policy - 12 * p - REAL_NEUTRAL) * 100})
        paths.append(path)
    return paths


def aggregate_paths(paths: list[list[dict]]) -> list[dict]:
    if not paths:
        raise ValueError("No posterior predictions")
    result = []
    keys = ("ipca_mom_pct", "ipca_yoy_pct", "ibc_index", "ibc_mom_pct", "ibc_yoy_pct", "real_policy_rate_gap_pct")
    for month_rows in zip(*paths):
        item = {"month": month_rows[0]["month"], "selic_annual_pct": month_rows[0]["selic_annual_pct"]}
        for k in keys:
            values = [x[k] for x in month_rows if x[k] is not None]
            item[k] = {"p05": quantile(values, .05), "p50": quantile(values, .50),
                       "p95": quantile(values, .95)}
        result.append(item)
    return result


def backtest(obs: list[dict], seed: int) -> dict:
    if len(obs) < 38:
        return {"status": "insufficient_history", "months": 0}
    hold = min(12, max(1, len(obs) // 5))
    train = obs[:-hold]
    posterior, _ = mcmc(train, seed, draws=1800, warmup=700, thin=11)
    errors_g, errors_pi, naive_g, naive_pi = [], [], [], []
    for idx in range(len(train), len(obs)):
        prior = monthly_growth(obs[idx - 2], obs[idx - 1])
        actual = monthly_growth(obs[idx - 1], obs[idx])
        fits = [expected(theta, prior, obs[idx-1]["ipca"], obs[idx-1]["selic"]) for theta in posterior]
        g = quantile([x[0] for x in fits], .5)
        p = quantile([x[1] for x in fits], .5)
        errors_g.append(abs((math.exp(g) - math.exp(actual)) * 100))
        errors_pi.append(abs((p - obs[idx]["ipca"]) * 100))
        naive_g.append(abs((math.exp(prior) - math.exp(actual)) * 100))
        naive_pi.append(abs((obs[idx-1]["ipca"] - obs[idx]["ipca"]) * 100))
    return {"status": "out_of_sample_one_step", "months": hold,
            "ibc_growth_mae_percentage_points": statistics.mean(errors_g),
            "ipca_mom_mae_percentage_points": statistics.mean(errors_pi),
            "naive_ibc_growth_mae_percentage_points": statistics.mean(naive_g),
            "naive_ipca_mom_mae_percentage_points": statistics.mean(naive_pi),
            "note": "Rolling one-step predictions use realized lagged observations; posterior fitted only before holdout."}


def gini(values: list[float]) -> float:
    if not values:
        return 0.0
    ranked = sorted(max(0, v) for v in values)
    total = sum(ranked)
    if total <= 0:
        return 0.0
    return max(0.0, min(1.0, (2 * sum(i * v for i, v in enumerate(ranked, 1)) / (len(ranked) * total)) - (len(ranked) + 1) / len(ranked)))


def correlation(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or not xs:
        return None
    a, b = statistics.fmean(xs), statistics.fmean(ys)
    v1 = sum((x-a)**2 for x in xs)
    v2 = sum((y-b)**2 for y in ys)
    if v1 == 0 or v2 == 0:
        return None
    return sum((x-a)*(y-b) for x,y in zip(xs,ys)) / math.sqrt(v1*v2)


def population(seed: int, size: int, categories: int, shape: dict) -> list[tuple]:
    rng = random.Random(seed)
    return [(rng.randrange(categories),
             rng.betavariate(shape["productivity"]["alpha"], shape["productivity"]["beta"]),
             160 * rng.betavariate(shape["time"]["alpha"], shape["time"]["beta"]),
             rng.lognormvariate(0, shape["wealth"]["log_sigma"]),
             rng.betavariate(2, 3))
            for _ in range(size)]


def micro_simulation(rows: list[dict], agents: list[tuple], size: int, categories: int,
                     seed: int, name: str) -> tuple[list[dict], list[dict]]:
    rng = random.Random(seed)
    # Real output uses one contribution from each person; there is no firm object.
    initial = [0.0] * categories
    for j, productivity, hours, capital, _ in agents:
        initial[j] += productivity * hours * 20 * (1 + .025 * min(capital, 10))
    stocks = [v * .18 for v in initial]
    prices = [1.0] * categories
    varieties = [1] * categories
    fortunes = [max(0, capital * 100) for _, _, _, capital, _ in agents]
    product_rows, monthly = [], []
    previous_level = None
    pop_weight = POPULATION / size
    for t, observed in enumerate(rows):
        pi = observed["ipca_mom_pct"]["p50"] / 100
        growth = observed["ibc_mom_pct"]["p50"] / 100
        rate = observed["selic_annual_pct"] / 100
        utilization = min(1.10, max(.28, .83 + 2.1 * growth - .30 * (rate - .12)))
        produced = [capacity * utilization for capacity in initial]
        total_prod = sum(produced)
        demand_total = total_prod * max(.55, min(1.3, .985 + 3.0 * growth - .30 * (rate - .12)))
        preferred = [q / total_prod for q in produced]
        demand = [demand_total * (.80 * preferred[j] + .20 / categories) for j in range(categories)]
        sales, shortages, available = [], [], []
        new_product, closed_product = 0, 0
        for j in range(categories):
            inventory = max(0, stocks[j] + produced[j])
            sold = min(inventory, demand[j])
            shortfall = max(0, demand[j] - sold)
            imbalance = (demand[j] / max(inventory, 1e-6)) - 1
            dprice = max(-.12, min(.15, pi + .035 * imbalance))
            prices[j] *= max(.1, 1 + dprice)
            stocks[j] = inventory - sold
            if shortfall > 0 and rng.random() < .20 * max(0, 1 - rate):
                varieties[j] += 1
                new_product += 1
            if varieties[j] > 1 and stocks[j] > demand[j] * 2 and rng.random() < .08:
                varieties[j] -= 1
                closed_product += 1
            available.append(inventory)
            sales.append(sold)
            shortages.append(shortfall)
            product_rows.append({
                "scenario": name, "month": observed["month"], "category": f"category_{j+1:03}",
                "produced_units_synthetic": produced[j], "sold_units_synthetic": sold,
                "ending_stock_units_synthetic": stocks[j], "shortage_units_synthetic": shortfall,
                "price_index_synthetic": prices[j], "active_varieties": varieties[j],
                "stock_available": inventory > 0})
        incomes = []
        new_fortunes = []
        valence = []
        for n, (j, productivity, hours, capital, need) in enumerate(agents):
            wage = productivity * hours * 20 * (1 + .025 * min(capital, 10)) * utilization * prices[j]
            old = fortunes[n]
            savings = .08 + .12 * (old / (old + 1000))
            fortune = max(0, old * (1 + .14 * rate / 12) + savings * wage)
            new_fortunes.append(fortune)
            incomes.append(wage)
            # Synthetic and deliberately uncalibrated satisfaction; NOT measured QALY.
            valence.append(min(1, max(0, (1 - math.exp(-wage / (500 + 2000 * need))) * (.9 + .1 * (1 - need)))))
        fortunes = new_fortunes
        sorted_income = sorted(incomes)
        mean_income = statistics.fmean(incomes)
        share_top = sum(sorted_income[int(.9 * size):]) / max(1e-9, sum(incomes))
        price_mean = statistics.fmean(prices)
        row = {
            "scenario": name, "month": observed["month"], "agents": size,
            "population_weight": pop_weight,
            "product_categories": categories, "varieties_active": sum(varieties),
            "varieties_created": new_product, "varieties_closed": closed_product,
            "categories_with_stock": sum(x > 0 for x in available),
            "production_units_synthetic": total_prod * pop_weight,
            "sales_units_synthetic": sum(sales) * pop_weight,
            "shortage_units_synthetic": sum(shortages) * pop_weight,
            "shortage_share_demand": sum(shortages) / max(1, sum(demand)),
            "stock_units_synthetic": sum(stocks) * pop_weight,
            "price_index_synthetic": price_mean,
            "income_mean_index": mean_income,
            "income_p10_index": quantile(sorted_income, .1),
            "income_median_index": quantile(sorted_income, .5),
            "income_p90_index": quantile(sorted_income, .9),
            "income_gini": gini(incomes),
            "wealth_gini": gini(fortunes),
            "income_share_top10": share_top,
            "relative_low_income_pct": 100 * sum(x < mean_income*.5 for x in incomes) / size,
            "productive_hours_per_agent": statistics.fmean(x[2] for x in agents) * utilization,
            "valence_proxy_mean": statistics.fmean(valence),
            "productivity_income_correlation": correlation([x[1] for x in agents], incomes),
            "wealth_income_correlation": correlation(fortunes, incomes),
            "longevity_years": None,  # No valid causal official-data bridge yet.
        }
        monthly.append(row)
        previous_level = observed["ibc_index"]["p50"]
    return monthly, product_rows


def run(snapshot: dict, *, agents: int = AGENTS, categories: int = CATEGORIES,
        horizon: int = HORIZON, seed: int = 20261108,
        mcmc_draws: int = 2400, mcmc_warmup: int = 900) -> dict:
    if not (1 <= agents <= 1_000_000 and 1 <= categories <= 1000 and 1 <= horizon <= 120):
        raise ValueError("Invalid simulation size")
    observations, policy_now = monthly_observations(snapshot)
    posterior, diagnostic = mcmc(observations, seed, mcmc_draws, mcmc_warmup, max(1, mcmc_draws // 200))
    quality = backtest(observations, seed + 13)
    shape = {"productivity": {"type": "beta", "alpha": 2.0, "beta": 5.0},
             "time": {"type": "beta", "alpha": 3.0, "beta": 2.0},
             "wealth": {"type": "lognormal", "log_sigma": 1.1}}
    people = population(seed + 7, agents, categories, shape)
    paths = {}
    micro = {}
    products = {}
    for idx, (name, shift) in enumerate((("selic_constante", 0.0), ("selic_menos_2pp", -.02), ("selic_mais_2pp", .02))):
        policy = max(0, policy_now + shift)
        trajectories = draw_forecasts(observations, posterior, policy, seed + 101 * (idx + 1), horizon)
        paths[name] = aggregate_paths(trajectories)
        micro[name], products[name] = micro_simulation(paths[name], people, agents, categories, seed + 1000, name)
    last = observations[-1]
    hashes = {k: hashlib.sha256(json.dumps(v, sort_keys=True).encode()).hexdigest() for k,v in snapshot["series"].items()}
    return {
        "schema_version": 1,
        "model": "BrasilSim 0.1 experimental posterior macro + synthetic person/product accounting",
        "retrieved_utc": snapshot["retrieved_utc"],
        "data_as_of_month": last["month"],
        "official_latest_policy_pct": policy_now * 100,
        "official_latest_ibc_br_sa_index": last["ibc"],
        "official_latest_ipca_mom_pct": last["ipca"] * 100,
        "official_series": {"provider": snapshot["provider"], "definition": SERIES,
                            "raw_observations": snapshot["series"], "sha256": hashes},
        "population": POPULATION, "agents": agents, "product_categories": categories,
        "horizon_months": horizon, "seed": seed, "shapes": shape,
        "posterior": {"diagnostic": diagnostic,
                      "median_parameters": {name: quantile([s[i] for s in posterior], .5) for i,name in enumerate(PARAMS)},
                      "posterior_draw_count": len(posterior)},
        "backtest": quality,
        "scenarios": paths,
        "synthetic_micro": micro,
        "synthetic_products": products,
        "methodology": {
            "macro": "Bayesian ARX with explicit real-rate and activity channels; random-walk Metropolis; conditional predictive intervals",
            "micro": "100k weighted synthetic people, heterogeneous productivity/time/wealth, 127 synthetic product categories, dynamic stocks and commercial varieties; conditioned on macro scenario",
            "epistemic_status": "experimental, unreviewed, not an official forecast, and not a causally identified effect of Selic",
            "limits": ["Synthetic products have no actual IBGE 127 category mapping yet",
                       "Income/wealth units are indices, not BRL",
                       "Micro layer is not yet a complete monetary stock-flow-conserving economy",
                       "Valence proxy is not clinical measurement and longevity is not estimated",
                       "Marginal posterior intervals are not simultaneous confidence bands",
                       "Parametric posterior may be multimodal; no convergence certification"],
        },
    }


def write_outputs(result: dict, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    (output / "latest.json").write_text(json.dumps(result, ensure_ascii=False, sort_keys=True, allow_nan=False) + "\n", encoding="utf-8")
    datasets = {
        "forecast.csv": [dict(scenario=scenario, month=item["month"], indicator=indicator,
                              p05=v["p05"], p50=v["p50"], p95=v["p95"],
                              selic_annual_pct=item["selic_annual_pct"])
                         for scenario, items in result["scenarios"].items() for item in items
                         for indicator, v in item.items() if isinstance(v, dict) and "p50" in v],
        "micro.csv": [r for rows in result["synthetic_micro"].values() for r in rows],
        "products.csv": [r for rows in result["synthetic_products"].values() for r in rows],
    }
    for filename, rows in datasets.items():
        with (output / filename).open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="BrasilSim: historical SGS ingestion, MCMC and 24-month experimental prediction")
    parser.add_argument("--fixture", type=Path, help="Replay a source snapshot rather than use the network")
    parser.add_argument("--output", type=Path, default=Path("public/brasil-sim"))
    parser.add_argument("--agents", type=int, default=AGENTS)
    parser.add_argument("--categories", type=int, default=CATEGORIES)
    parser.add_argument("--horizon", type=int, default=HORIZON)
    parser.add_argument("--seed", type=int, default=20261108)
    args = parser.parse_args()
    snapshot = json.loads(args.fixture.read_text(encoding="utf-8")) if args.fixture else fetch_official()
    outcome = run(snapshot, agents=args.agents, categories=args.categories, horizon=args.horizon, seed=args.seed)
    write_outputs(outcome, args.output)
    print(f"BrasilSim: official month={outcome['data_as_of_month']}, "
          f"{args.agents} agents, {args.categories} categories, {args.horizon} months, "
          f"acceptance={outcome['posterior']['diagnostic']['accepted_fraction']:.2%}")


if __name__ == "__main__":
    main()
