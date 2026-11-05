#!/usr/bin/env python3
"""MaleCNS byte tagger v2: paired best-checkpoint/early-stopping trials.

This runner deliberately keeps the v1 data, graph construction, model classes and
matched degree-preserving shuffled control fixed.  It changes only the training
selection rule: every model may train for more epochs, the best validation-F1
checkpoint is restored, and training stops after a fixed patience without
improvement.  The validation split remains model-selection data; a later frozen
confirmatory run must use the untouched test split.
"""

from __future__ import annotations

import argparse
import copy
import json
import statistics
from pathlib import Path

import torch
from torch.utils.data import DataLoader

import experiment as exp
from randomized_control import degree_preserving_shuffle

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


def make_loaders(
    train_dataset: exp.WindowDataset,
    val_dataset: exp.WindowDataset,
    *,
    batch_size: int,
    seed: int,
) -> tuple[DataLoader, DataLoader]:
    generator = torch.Generator().manual_seed(seed)
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        generator=generator,
    )
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    return train_loader, val_loader


def train_best(
    model: torch.nn.Module,
    train_dataset: exp.WindowDataset,
    val_dataset: exp.WindowDataset,
    *,
    max_epochs: int,
    min_epochs: int,
    patience: int,
    min_delta: float,
    learning_rate: float,
    batch_size: int,
    seed: int,
    device: torch.device,
) -> dict:
    train_loader, val_loader = make_loaders(
        train_dataset,
        val_dataset,
        batch_size=batch_size,
        seed=seed,
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    loss_fn = torch.nn.CrossEntropyLoss(
        weight=exp.class_weights(train_dataset, device),
        ignore_index=exp.IGNORE_LABEL,
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode="max",
        factor=0.5,
        patience=max(1, patience // 2),
        threshold=min_delta,
        min_lr=learning_rate * 0.03125,
    )

    best_f1 = float("-inf")
    best_epoch = 0
    best_metrics: dict | None = None
    best_state: dict | None = None
    stale = 0
    history: list[dict] = []

    for epoch in range(1, max_epochs + 1):
        model.train()
        running = 0.0
        batches = 0
        for tokens, labels in train_loader:
            tokens, labels = tokens.to(device), labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(tokens)
            loss = loss_fn(logits.reshape(-1, 2), labels.reshape(-1))
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            running += float(loss.detach())
            batches += 1

        validation = exp.evaluate(model, val_loader, device)
        score = float(validation["f1"])
        lr_before = float(optimizer.param_groups[0]["lr"])
        improved = score > best_f1 + min_delta
        if improved:
            best_f1 = score
            best_epoch = epoch
            best_metrics = dict(validation)
            best_state = copy.deepcopy(model.state_dict())
            stale = 0
        else:
            stale += 1

        scheduler.step(score)
        row = {
            "epoch": epoch,
            "train_loss": running / max(1, batches),
            "validation": validation,
            "learning_rate": lr_before,
            "best_epoch_so_far": best_epoch,
            "improved": improved,
        }
        history.append(row)
        print(json.dumps(row, ensure_ascii=False), flush=True)

        if epoch >= min_epochs and stale >= patience:
            break

    if best_state is None or best_metrics is None:
        raise RuntimeError("training produced no validation checkpoint")
    model.load_state_dict(best_state)
    final_metrics = exp.evaluate(model, val_loader, device)
    if abs(float(final_metrics["f1"]) - float(best_metrics["f1"])) > 1e-12:
        raise AssertionError("restored checkpoint does not match recorded best F1")

    return {
        "final": final_metrics,
        "history": history,
        "best_epoch": best_epoch,
        "stopped_epoch": len(history),
        "early_stopped": len(history) < max_epochs,
        "best_state": best_state,
    }


def run_seed(args: argparse.Namespace, seed: int, root: Path, work_dir: Path) -> dict:
    config = exp.Config(
        seed=seed,
        nodes=args.nodes,
        input_nodes=args.input_nodes,
        embedding_dim=64,
        chunk_bytes=args.chunk_bytes,
        negatives_per_positive=args.negatives_per_positive,
        epochs=args.max_epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        baseline_learning_rate=args.baseline_learning_rate,
        leak=args.leak,
        recurrent_gain=args.recurrent_gain,
        input_gain=args.input_gain,
        max_train_docs=args.max_train_docs,
        max_val_docs=args.max_val_docs,
        label="resultado",
    )

    train_path, val_path = exp.prepare_causaganha(work_dir)
    train_records = exp.read_jsonl(train_path, config.max_train_docs)
    val_records = exp.read_jsonl(val_path, config.max_val_docs)
    train_windows = exp.make_windows(train_records, config, split_seed=seed)
    val_windows = exp.make_windows(val_records, config, split_seed=seed + 1)
    if not train_windows or not val_windows:
        raise RuntimeError("training/validation windows are empty")
    train_dataset = exp.WindowDataset(train_windows)
    val_dataset = exp.WindowDataset(val_windows)

    graph = exp.build_malecns_subgraph(work_dir / "connectome", config.nodes)
    shuffled, swaps = degree_preserving_shuffle(graph, seed + 17)
    device = torch.device("cuda" if torch.cuda.is_available() and not args.cpu else "cpu")

    def fit_reservoir(current_graph: dict, lr: float) -> tuple[torch.nn.Module, dict]:
        exp.seed_everything(seed)
        model = exp.MaleCNSReservoirTagger(current_graph, config, device)
        result = train_best(
            model,
            train_dataset,
            val_dataset,
            max_epochs=args.max_epochs,
            min_epochs=args.min_epochs,
            patience=args.patience,
            min_delta=args.min_delta,
            learning_rate=lr,
            batch_size=config.batch_size,
            seed=seed,
            device=device,
        )
        return model, result

    male_model, male = fit_reservoir(graph, config.learning_rate)
    shuffled_model, shuffled_result = fit_reservoir(shuffled, config.learning_rate)

    exp.seed_everything(seed)
    baseline_model = exp.ByteOnlyBaseline(config.embedding_dim).to(device)
    baseline = train_best(
        baseline_model,
        train_dataset,
        val_dataset,
        max_epochs=args.max_epochs,
        min_epochs=args.min_epochs,
        patience=args.patience,
        min_delta=args.min_delta,
        learning_rate=config.baseline_learning_rate,
        batch_size=config.batch_size,
        seed=seed,
        device=device,
    )

    output_dir = root / f"seed-{seed}"
    output_dir.mkdir(parents=True, exist_ok=True)
    results = {
        "malecns_reservoir": {k: v for k, v in male.items() if k != "best_state"},
        "degree_preserving_shuffled_reservoir": {
            k: v for k, v in shuffled_result.items() if k != "best_state"
        },
        "byte_only_baseline": {k: v for k, v in baseline.items() if k != "best_state"},
    }
    report = {
        "experiment": "malecns-byte-tagger-training-v2",
        "config": {
            **vars(config),
            "max_epochs": args.max_epochs,
            "min_epochs": args.min_epochs,
            "early_stopping_patience": args.patience,
            "early_stopping_min_delta": args.min_delta,
        },
        "training_policy": (
            "Same v1 data/windows and frozen recurrent graphs. Select the checkpoint "
            "with highest validation F1, halve LR on a validation-F1 plateau, and stop "
            "after patience epochs without improvement. Validation is model-selection "
            "data; untouched test.jsonl remains reserved for a later frozen confirmation."
        ),
        "data": {
            "causaganha_commit": exp.CAUSAGANHA_COMMIT,
            "train_docs": len(train_records),
            "val_docs": len(val_records),
            "train_windows": len(train_windows),
            "val_windows": len(val_windows),
            "label": config.label,
            "encoding": "UTF-8 bytes",
        },
        "graph": {
            "kind": "malecns",
            "nodes": len(graph["source_id"]),
            "edges": len(graph["pre"]),
            "selection": "top weighted degree within retained MaleCNS v1.0 neurons",
            "weights": "incoming-normalized synaptic contact counts; topology/weights frozen",
        },
        "null_model": {
            "kind": "directed degree-preserving double-edge-swap shuffle",
            "seed": seed + 17,
            "successful_swaps": swaps,
            "swaps_per_edge": 10,
        },
        "results": results,
    }
    (output_dir / "metrics.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    torch.save(
        {"config": report["config"], "model_state": male["best_state"]},
        output_dir / "checkpoint.pt",
    )
    torch.save(
        {"config": report["config"], "model_state": shuffled_result["best_state"]},
        output_dir / "shuffled-checkpoint.pt",
    )
    torch.save(
        {"config": report["config"], "model_state": baseline["best_state"]},
        output_dir / "byte-only-checkpoint.pt",
    )
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seeds", default="20260912,20260913,20260914,20260915,20260916")
    parser.add_argument("--nodes", type=int, default=512)
    parser.add_argument("--input-nodes", type=int, default=64)
    parser.add_argument("--max-epochs", type=int, default=30)
    parser.add_argument("--min-epochs", type=int, default=5)
    parser.add_argument("--patience", type=int, default=5)
    parser.add_argument("--min-delta", type=float, default=1e-4)
    parser.add_argument("--chunk-bytes", type=int, default=192)
    parser.add_argument("--negatives-per-positive", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=3e-3)
    parser.add_argument("--baseline-learning-rate", type=float, default=1e-2)
    parser.add_argument("--leak", type=float, default=0.35)
    parser.add_argument("--recurrent-gain", type=float, default=0.9)
    parser.add_argument("--input-gain", type=float, default=0.5)
    parser.add_argument("--max-train-docs", type=int, default=0)
    parser.add_argument("--max-val-docs", type=int, default=0)
    parser.add_argument("--work-dir", default="/kaggle/working/cache")
    parser.add_argument("--output-dir", default="/kaggle/working/result")
    parser.add_argument("--cpu", action="store_true")
    args = parser.parse_args()

    if args.min_epochs > args.max_epochs:
        raise SystemExit("--min-epochs cannot exceed --max-epochs")
    seeds = [int(item.strip()) for item in args.seeds.split(",") if item.strip()]
    if len(seeds) < 2:
        raise SystemExit("paired v2 requires at least two seeds")

    root = Path(args.output_dir)
    work_dir = Path(args.work_dir)
    root.mkdir(parents=True, exist_ok=True)
    reports = []
    for index, seed in enumerate(seeds, 1):
        print(f"=== v2 paired trial {index}/{len(seeds)} seed={seed} ===", flush=True)
        reports.append(run_seed(args, seed, root, work_dir))

    summary: dict[str, dict[str, dict[str, float]]] = {}
    best_epochs: dict[str, list[int]] = {}
    for model in MODEL_KEYS:
        summary[model] = {}
        for metric in METRICS:
            values = [float(r["results"][model]["final"][metric]) for r in reports]
            summary[model][metric] = describe(values)
        best_epochs[model] = [int(r["results"][model]["best_epoch"]) for r in reports]

    male_f1 = [float(r["results"]["malecns_reservoir"]["final"]["f1"]) for r in reports]
    shuffled_f1 = [float(r["results"]["degree_preserving_shuffled_reservoir"]["final"]["f1"]) for r in reports]
    byte_f1 = [float(r["results"]["byte_only_baseline"]["final"]["f1"]) for r in reports]
    male_minus_shuffled = [a - b for a, b in zip(male_f1, shuffled_f1, strict=True)]
    male_minus_byte = [a - b for a, b in zip(male_f1, byte_f1, strict=True)]

    aggregate = {
        "experiment": "malecns-byte-tagger-training-v2-multiseed",
        "seeds": seeds,
        "config": {
            "nodes": args.nodes,
            "input_nodes": args.input_nodes,
            "max_epochs": args.max_epochs,
            "min_epochs": args.min_epochs,
            "patience": args.patience,
            "min_delta": args.min_delta,
        },
        "summary": summary,
        "best_epochs": best_epochs,
        "pairwise_f1": {
            "malecns_minus_shuffled": {
                "values": male_minus_shuffled,
                **describe(male_minus_shuffled),
                "malecns_wins": sum(v > 0 for v in male_minus_shuffled),
                "shuffled_wins": sum(v < 0 for v in male_minus_shuffled),
            },
            "malecns_minus_byte_only": {
                "values": male_minus_byte,
                **describe(male_minus_byte),
                "malecns_wins": sum(v > 0 for v in male_minus_byte),
                "byte_only_wins": sum(v < 0 for v in male_minus_byte),
            },
        },
        "runs": [
            {
                "seed": seed,
                "data": report["data"],
                "graph": report["graph"],
                "null_model": report["null_model"],
                "results": {
                    model: {
                        "final": report["results"][model]["final"],
                        "best_epoch": report["results"][model]["best_epoch"],
                        "stopped_epoch": report["results"][model]["stopped_epoch"],
                    }
                    for model in MODEL_KEYS
                },
            }
            for seed, report in zip(seeds, reports, strict=True)
        ],
        "claim_boundary": (
            "Validation-selected v2 engineering result. It tests whether the 3-epoch v1 "
            "was training-limited; it is not a held-out confirmatory biological-topology claim."
        ),
    }
    (root / "aggregate.json").write_text(
        json.dumps(aggregate, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"summary": summary, "best_epochs": best_epochs}, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
