#!/usr/bin/env python3
"""Add a degree-preserving randomized-topology control to a MaleCNS tagger run.

This script intentionally reuses the exact dataset windows, model class, loss,
optimizer settings, seed, and readout protocol from experiment.py.  The only
conceptual change is recurrent topology: directed edge endpoints are rewired by
double-edge swaps while preserving every neuron's in-degree and out-degree and
preserving the edge-weight multiset.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader

import experiment as exp


def degree_preserving_shuffle(
    graph: dict[str, np.ndarray], seed: int, *, swaps_per_edge: int = 10
) -> tuple[dict[str, np.ndarray], int]:
    """Randomize directed topology with duplicate/self-edge-safe double swaps."""
    pre = graph["pre"].astype(np.int64, copy=True)
    post = graph["post"].astype(np.int64, copy=True)
    weight = graph["weight"].astype(np.float32, copy=True)
    rng = np.random.default_rng(seed)

    original_out = np.bincount(pre, minlength=len(graph["source_id"]))
    original_in = np.bincount(post, minlength=len(graph["source_id"]))
    edges = {(int(a), int(b)) for a, b in zip(pre, post, strict=True)}
    if len(edges) != len(pre):
        raise RuntimeError("MaleCNS subgraph unexpectedly contains duplicate directed edges")

    target = swaps_per_edge * len(pre)
    successful = 0
    attempts = 0
    max_attempts = target * 30
    while successful < target and attempts < max_attempts:
        attempts += 1
        i, j = rng.integers(0, len(pre), size=2)
        i, j = int(i), int(j)
        if i == j:
            continue
        a, b = int(pre[i]), int(post[i])
        c, d = int(pre[j]), int(post[j])
        if a == c or b == d:
            continue
        new_i = (a, d)
        new_j = (c, b)
        if a == d or c == b:
            continue
        if new_i in edges or new_j in edges:
            continue

        edges.remove((a, b))
        edges.remove((c, d))
        edges.add(new_i)
        edges.add(new_j)
        post[i], post[j] = d, b
        successful += 1

    if successful < target:
        raise RuntimeError(
            f"degree-preserving shuffle stopped at {successful}/{target} swaps"
        )

    shuffled_out = np.bincount(pre, minlength=len(graph["source_id"]))
    shuffled_in = np.bincount(post, minlength=len(graph["source_id"]))
    if not np.array_equal(original_out, shuffled_out):
        raise AssertionError("out-degree sequence changed during topology shuffle")
    if not np.array_equal(original_in, shuffled_in):
        raise AssertionError("in-degree sequence changed during topology shuffle")
    if len({(int(a), int(b)) for a, b in zip(pre, post, strict=True)}) != len(pre):
        raise AssertionError("topology shuffle introduced duplicate directed edges")

    shuffled = {
        "pre": pre,
        "post": post,
        "weight": weight,
        "source_id": graph["source_id"].copy(),
        "weighted_degree": graph["weighted_degree"].copy(),
    }
    return shuffled, successful


def run(args: argparse.Namespace) -> int:
    output_dir = Path(args.output_dir)
    work_dir = Path(args.work_dir)
    metrics_path = output_dir / "metrics.json"
    report = json.loads(metrics_path.read_text(encoding="utf-8"))
    config = exp.Config(**report["config"])

    train_path, val_path = exp.prepare_causaganha(work_dir)
    train_records = exp.read_jsonl(train_path, config.max_train_docs)
    val_records = exp.read_jsonl(val_path, config.max_val_docs)
    train_windows = exp.make_windows(train_records, config, split_seed=config.seed)
    val_windows = exp.make_windows(val_records, config, split_seed=config.seed + 1)
    train_dataset = exp.WindowDataset(train_windows)
    val_dataset = exp.WindowDataset(val_windows)

    graph = exp.build_malecns_subgraph(work_dir / "connectome", config.nodes)
    shuffled, swaps = degree_preserving_shuffle(graph, config.seed + 17)

    # Reset before model construction so the learnable parameters start from the
    # same seed as the MaleCNS reservoir in experiment.py.
    exp.seed_everything(config.seed)
    train_loader = DataLoader(
        train_dataset, batch_size=config.batch_size, shuffle=True
    )
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size, shuffle=False)
    device = torch.device(
        "cuda" if torch.cuda.is_available() and not args.cpu else "cpu"
    )
    model = exp.MaleCNSReservoirTagger(shuffled, config, device)
    history = exp.train_model(
        model,
        train_loader,
        val_loader,
        train_dataset,
        epochs=config.epochs,
        learning_rate=config.learning_rate,
        device=device,
    )
    final = exp.evaluate(model, val_loader, device)

    report["experiment"] = "malecns-byte-tagger-mvp-v2"
    report["results"]["degree_preserving_shuffled_reservoir"] = {
        "final": final,
        "history": history,
    }
    report["null_model"] = {
        "kind": "directed degree-preserving double-edge-swap shuffle",
        "seed": config.seed + 17,
        "successful_swaps": swaps,
        "swaps_per_edge": 10,
        "nodes": len(shuffled["source_id"]),
        "edge_rows": len(shuffled["pre"]),
        "preserves": [
            "node count",
            "directed edge count",
            "per-node in-degree",
            "per-node out-degree",
            "edge-weight multiset",
            "learnable architecture and initialization seed",
        ],
        "destroys": "most higher-order MaleCNS wiring motifs while keeping local degree constraints",
    }
    metrics_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    torch.save(
        {
            "config": report["config"],
            "model_state": model.state_dict(),
            "graph_source_ids": shuffled["source_id"],
            "graph_pre": shuffled["pre"],
            "graph_post": shuffled["post"],
            "graph_weight": shuffled["weight"],
            "successful_swaps": swaps,
        },
        output_dir / "shuffled-checkpoint.pt",
    )
    print(
        json.dumps(
            {
                "degree_preserving_shuffled_reservoir": final,
                "successful_swaps": swaps,
            },
            indent=2,
        ),
        flush=True,
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--work-dir", default=".cache/malecns-tagger")
    parser.add_argument("--output-dir", default="outputs/malecns-tagger")
    parser.add_argument("--cpu", action="store_true")
    return run(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
