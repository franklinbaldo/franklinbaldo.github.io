#!/usr/bin/env python3
"""Run paired MaleCNS, shuffled-reservoir, and byte-only trials across seeds."""

from __future__ import annotations

import argparse
import json
import statistics
import subprocess
import sys
from pathlib import Path

MODEL_KEYS = (
    "malecns_reservoir",
    "degree_preserving_shuffled_reservoir",
    "byte_only_baseline",
)
METRICS = ("f1", "precision", "recall", "accuracy")


def describe(values: list[float]) -> dict[str, float]:
    return {
        "mean": statistics.fmean(values),
        "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
        "min": min(values),
        "max": max(values),
    }


def run_trial(
    *,
    seed: int,
    output_dir: Path,
    work_dir: Path,
    nodes: int,
    input_nodes: int,
    epochs: int,
    max_train_docs: int,
    max_val_docs: int,
) -> dict:
    here = Path(__file__).resolve().parent
    experiment = here / "experiment.py"
    control = here / "randomized_control.py"
    output_dir.mkdir(parents=True, exist_ok=True)

    subprocess.check_call(
        [
            sys.executable,
            str(experiment),
            "run",
            "--graph",
            "malecns",
            "--seed",
            str(seed),
            "--nodes",
            str(nodes),
            "--input-nodes",
            str(input_nodes),
            "--epochs",
            str(epochs),
            "--max-train-docs",
            str(max_train_docs),
            "--max-val-docs",
            str(max_val_docs),
            "--work-dir",
            str(work_dir),
            "--output-dir",
            str(output_dir),
        ]
    )
    subprocess.check_call(
        [
            sys.executable,
            str(control),
            "--work-dir",
            str(work_dir),
            "--output-dir",
            str(output_dir),
        ]
    )
    return json.loads((output_dir / "metrics.json").read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--seeds",
        default="20260912,20260913,20260914,20260915,20260916",
        help="comma-separated paired trial seeds",
    )
    parser.add_argument("--nodes", type=int, default=512)
    parser.add_argument("--input-nodes", type=int, default=64)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--max-train-docs", type=int, default=0)
    parser.add_argument("--max-val-docs", type=int, default=0)
    parser.add_argument("--work-dir", default="/kaggle/working/cache")
    parser.add_argument("--output-dir", default="/kaggle/working/result")
    args = parser.parse_args()

    seeds = [int(item.strip()) for item in args.seeds.split(",") if item.strip()]
    if len(seeds) < 2:
        raise SystemExit("multiseed experiment requires at least two seeds")

    root = Path(args.output_dir)
    work_dir = Path(args.work_dir)
    root.mkdir(parents=True, exist_ok=True)
    reports: list[dict] = []
    for index, seed in enumerate(seeds, start=1):
        print(f"=== paired trial {index}/{len(seeds)} seed={seed} ===", flush=True)
        report = run_trial(
            seed=seed,
            output_dir=root / f"seed-{seed}",
            work_dir=work_dir,
            nodes=args.nodes,
            input_nodes=args.input_nodes,
            epochs=args.epochs,
            max_train_docs=args.max_train_docs,
            max_val_docs=args.max_val_docs,
        )
        reports.append(report)

    summary: dict[str, dict[str, dict[str, float]]] = {}
    for model in MODEL_KEYS:
        summary[model] = {}
        for metric in METRICS:
            values = [float(r["results"][model]["final"][metric]) for r in reports]
            summary[model][metric] = describe(values)

    male_f1 = [float(r["results"]["malecns_reservoir"]["final"]["f1"]) for r in reports]
    shuffled_f1 = [
        float(r["results"]["degree_preserving_shuffled_reservoir"]["final"]["f1"])
        for r in reports
    ]
    byte_f1 = [float(r["results"]["byte_only_baseline"]["final"]["f1"]) for r in reports]
    male_minus_shuffled = [a - b for a, b in zip(male_f1, shuffled_f1, strict=True)]
    male_minus_byte = [a - b for a, b in zip(male_f1, byte_f1, strict=True)]

    aggregate = {
        "experiment": "malecns-byte-tagger-multiseed-v1",
        "seeds": seeds,
        "paired_protocol": (
            "Within each seed, MaleCNS and its degree-preserving shuffled null use "
            "the same train/validation windows, learnable architecture, initialization "
            "seed, optimizer, and evaluation. Across seeds, negative-window sampling "
            "and initialization both vary together to estimate pipeline variance."
        ),
        "config": {
            "nodes": args.nodes,
            "input_nodes": args.input_nodes,
            "embedding_dim": 64,
            "epochs": args.epochs,
            "max_train_docs": args.max_train_docs,
            "max_val_docs": args.max_val_docs,
        },
        "summary": summary,
        "pairwise_f1": {
            "malecns_minus_shuffled": {
                "values": male_minus_shuffled,
                **describe(male_minus_shuffled),
                "malecns_wins": sum(value > 0 for value in male_minus_shuffled),
                "shuffled_wins": sum(value < 0 for value in male_minus_shuffled),
                "ties": sum(value == 0 for value in male_minus_shuffled),
            },
            "malecns_minus_byte_only": {
                "values": male_minus_byte,
                **describe(male_minus_byte),
                "malecns_wins": sum(value > 0 for value in male_minus_byte),
                "byte_only_wins": sum(value < 0 for value in male_minus_byte),
                "ties": sum(value == 0 for value in male_minus_byte),
            },
        },
        "runs": [
            {
                "seed": seed,
                "data": report["data"],
                "graph": report["graph"],
                "null_model": report["null_model"],
                "final": {model: report["results"][model]["final"] for model in MODEL_KEYS},
            }
            for seed, report in zip(seeds, reports, strict=True)
        ],
        "claim_boundary": (
            "This is a paired engineering experiment on an artificial rate reservoir "
            "constrained by MaleCNS wiring. It is not a biologically faithful fly-brain "
            "simulation, and five seeds are evidence about this pipeline, not a general "
            "claim about biological connectomes."
        ),
    }
    (root / "aggregate.json").write_text(
        json.dumps(aggregate, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps(aggregate["pairwise_f1"], indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
