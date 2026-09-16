#!/usr/bin/env python3
"""Prove that two FlyDoom body-ID vectors have exactly the same index order."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np


def load_ids(path: Path, key: str) -> np.ndarray:
    if path.suffix == ".npy":
        return np.asarray(np.load(path, allow_pickle=False), dtype=np.int64)
    data = np.load(path, allow_pickle=False)
    if key not in data.files:
        raise SystemExit(f"{path}: missing array {key!r}; got {data.files!r}")
    return np.asarray(data[key], dtype=np.int64)


def digest(ids: np.ndarray) -> str:
    return hashlib.sha256(ids.astype("<i8", copy=False).tobytes(order="C")).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runtime", type=Path, required=True, help="graph/operator source .npz/.npy")
    parser.add_argument("--reference", type=Path, required=True, help="reference body-order .npz/.npy")
    parser.add_argument("--runtime-key", default="bodies")
    parser.add_argument("--reference-key", default="bodies")
    args = parser.parse_args()

    runtime = load_ids(args.runtime, args.runtime_key)
    reference = load_ids(args.reference, args.reference_key)

    print("runtime   head:", runtime[:5].tolist())
    print("runtime   tail:", runtime[-5:].tolist())
    print("reference head:", reference[:5].tolist())
    print("reference tail:", reference[-5:].tolist())
    print("runtime   sha256:", digest(runtime))
    print("reference sha256:", digest(reference))

    if runtime.shape != reference.shape or not np.array_equal(runtime, reference):
        raise SystemExit("INDEX MISMATCH")
    print(f"INDEX OK: {len(runtime)} body IDs are identical in order")


if __name__ == "__main__":
    main()
