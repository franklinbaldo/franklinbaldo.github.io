#!/usr/bin/env python3
"""Export MaleCNS v1.0 per-body ROI scores for build_region_map.

This is the networked acquisition step. The downstream builder remains a pure
function over pinned local inputs.

The exporter reads the canonical `bodies` vector from graph.npz, queries
neuPrint dataset `male-cns:v1.0` for those exact body IDs, expands each neuron's
`roiInfo` map into rows `(bodyId, roi, pre, post, score)`, and writes a Feather
file. `score = pre + post` is only a dominance statistic; macro-region membership
is decided later by the explicit allowlists in build_flydoom_region_map.py.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import numpy as np


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--graph", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("artifacts/malecns-v1.0-roi-membership.feather"))
    parser.add_argument("--server", default="https://neuprint.janelia.org")
    parser.add_argument("--dataset", default="male-cns:v1.0")
    parser.add_argument("--batch-size", type=int, default=5000)
    args = parser.parse_args()

    try:
        import pandas as pd
        import pyarrow as pa
        import pyarrow.feather as feather
        from neuprint import Client, NeuronCriteria, fetch_neurons
    except ImportError as exc:
        raise SystemExit(
            "requires neuprint-python, pandas and pyarrow; e.g. uv run --with neuprint-python --with pandas --with pyarrow ..."
        ) from exc

    token = os.environ.get("NEUPRINT_TOKEN", "").strip()
    if not token:
        raise SystemExit("NEUPRINT_TOKEN is required for the neuPrint acquisition step")

    graph = np.load(args.graph, allow_pickle=False)
    if "bodies" not in graph.files:
        raise SystemExit("graph.npz must contain canonical bodies")
    bodies = np.asarray(graph["bodies"], dtype=np.int64)
    if len(np.unique(bodies)) != len(bodies):
        raise SystemExit("graph bodies are not unique")

    client = Client(args.server, dataset=args.dataset, token=token)
    rows: list[dict] = []
    missing: list[int] = []

    for start in range(0, len(bodies), args.batch_size):
        batch = [int(x) for x in bodies[start : start + args.batch_size]]
        neurons, _ = fetch_neurons(NeuronCriteria(bodyId=batch), client=client)
        seen = set()
        for record in neurons.to_dict("records"):
            body = int(record["bodyId"])
            seen.add(body)
            roi_info = record.get("roiInfo") or {}
            if isinstance(roi_info, str):
                roi_info = json.loads(roi_info)
            for roi, info in sorted(roi_info.items()):
                if not isinstance(info, dict):
                    continue
                pre = float(info.get("pre", 0) or 0)
                post = float(info.get("post", 0) or 0)
                rows.append(
                    {
                        "bodyId": body,
                        "roi": str(roi),
                        "pre": pre,
                        "post": post,
                        "score": pre + post,
                    }
                )
        missing.extend(sorted(set(batch) - seen))
        print(f"queried {min(start + args.batch_size, len(bodies))}/{len(bodies)} bodies", flush=True)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    table = pa.Table.from_pylist(rows)
    feather.write_feather(table, args.output, compression="zstd")
    manifest = {
        "server": args.server,
        "dataset": args.dataset,
        "graph": str(args.graph),
        "requested_bodies": int(len(bodies)),
        "bodies_missing_from_query": missing,
        "rows": len(rows),
        "score": "pre + post from neuPrint roiInfo",
    }
    args.output.with_suffix(args.output.suffix + ".meta.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps({"output": str(args.output), "rows": len(rows), "missing": len(missing)}, indent=2))


if __name__ == "__main__":
    main()
