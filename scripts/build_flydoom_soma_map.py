#!/usr/bin/env python3
"""Build an index-aligned MaleCNS soma-coordinate asset for FlyDoom.

Pure offline transform:

    graph.npz["bodies"] (exact SpMV index order)
      + body-annotations-male-cns-v1.0-minconf-0.5.feather
      -> soma_xyz.bin + soma_xyz.meta.json

The output is a packed little-endian Float32 array with three values per neuron
(x, y, z). Missing soma locations are encoded as NaN, never synthesized.

This script intentionally refuses to infer or reorder the runtime index. The
`graph.npz["bodies"]` vector supplied here must be the same body-order contract
used to build the operator consumed by FlyDoom.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_annotations(path: Path) -> dict[int, tuple[float, float, float]]:
    try:
        import pyarrow.feather as feather
    except ImportError as exc:
        raise SystemExit("pyarrow is required; e.g. uv run --with pyarrow ...") from exc

    table = feather.read_table(path, columns=["bodyId", "somaLocation"])
    bodies = table["bodyId"].to_pylist()
    locations = table["somaLocation"].to_pylist()
    result: dict[int, tuple[float, float, float]] = {}
    for body, location in zip(bodies, locations, strict=True):
        if body is None or location is None or len(location) != 3:
            continue
        xyz = tuple(float(value) for value in location)
        if not all(np.isfinite(value) for value in xyz):
            continue
        result[int(body)] = xyz
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--graph", type=Path, required=True)
    parser.add_argument("--annotations", type=Path, required=True)
    parser.add_argument(
        "--output-bin",
        type=Path,
        default=Path("public/flydoom/data/soma_xyz.bin"),
    )
    parser.add_argument(
        "--output-meta",
        type=Path,
        default=Path("public/flydoom/data/soma_xyz.meta.json"),
    )
    parser.add_argument("--expected-neurons", type=int, default=165122)
    args = parser.parse_args()

    graph = np.load(args.graph, allow_pickle=False)
    if "bodies" not in graph.files:
        raise SystemExit("graph.npz must contain `bodies`")
    bodies = np.asarray(graph["bodies"], dtype=np.int64)
    if len(bodies) != args.expected_neurons:
        raise SystemExit(
            f"unexpected graph size: {len(bodies)} != {args.expected_neurons}"
        )
    if len(np.unique(bodies)) != len(bodies):
        raise SystemExit("graph bodies are not unique")

    lookup = load_annotations(args.annotations)
    coords = np.full((len(bodies), 3), np.nan, dtype="<f4")
    found = 0
    for index, body in enumerate(bodies):
        xyz = lookup.get(int(body))
        if xyz is None:
            continue
        coords[index] = xyz
        found += 1

    raw = coords.tobytes(order="C")
    args.output_bin.parent.mkdir(parents=True, exist_ok=True)
    args.output_bin.write_bytes(raw)

    body_order_raw = bodies.astype("<i8", copy=False).tobytes(order="C")
    meta = {
        "format": "flydoom/malecns-soma-xyz-v1",
        "dataset": "MaleCNS v1.0",
        "total_neurons": int(len(bodies)),
        "neurons_with_soma": int(found),
        "neurons_without_soma": int(len(bodies) - found),
        "dtype": "little-endian float32",
        "shape": [int(len(bodies)), 3],
        "missing_value": "NaN",
        "byte_length": len(raw),
        "sha256": sha256_bytes(raw),
        "spmv_body_order_sha256_le_i64": sha256_bytes(body_order_raw),
        "graph_sha256": sha256_file(args.graph),
        "annotations_sha256": sha256_file(args.annotations),
        "source_column": "somaLocation",
        "scientific_boundary": (
            "Coordinates are MaleCNS soma locations only. Missing positions are NaN; "
            "no schematic coordinates are inserted into this asset."
        ),
    }
    args.output_meta.parent.mkdir(parents=True, exist_ok=True)
    args.output_meta.write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n")
    print(json.dumps(meta, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
