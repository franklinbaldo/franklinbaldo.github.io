#!/usr/bin/env python3
"""Build FlyDoom's compact runtime region map from compiler provenance.

Phase 2A deliberately treats ``circuit.mcns`` as a compiled projection, not as a
1:1 serialization of the full MaleCNS graph. The compact compiler is responsible
for emitting one provenance row per runtime node, already resolved to a macro
region. This script only verifies that provenance is index-aligned with the
FlatBuffer and serializes the uint8 region vector plus a pinned hash chain.

Required provenance columns:

- ``compact_index``: contiguous integer range ``0..Ncompact-1``;
- ``kind``: e.g. ``body``, ``cluster`` or ``pool``;
- ``region_code``: 0=other, 1=optic, 2=central, 3=descending.

Recommended lineage columns include ``body_id`` for 1:1 nodes and
``source_body_ids`` for merged/pooled units. They are preserved in the provenance
artifact itself; the worker never needs to understand them.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import struct
from collections import Counter
from pathlib import Path

REGION_CODE = {"other": 0, "optic": 1, "central": 2, "descending": 3}
CODE_REGION = {value: key for key, value in REGION_CODE.items()}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_rows(path: Path) -> list[dict]:
    suffix = path.suffix.lower()
    if suffix in {".json", ".jsonl"}:
        text = path.read_text(encoding="utf-8")
        if suffix == ".jsonl":
            return [json.loads(line) for line in text.splitlines() if line.strip()]
        payload = json.loads(text)
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict) and isinstance(payload.get("rows"), list):
            return payload["rows"]
        raise SystemExit("JSON provenance must be a list or {'rows': [...]} object")

    if suffix == ".parquet":
        try:
            import pyarrow.parquet as pq
        except ImportError as exc:
            raise SystemExit(
                "pyarrow is required for parquet provenance: uv run --with pyarrow ..."
            ) from exc
        return pq.read_table(path).to_pylist()

    raise SystemExit("provenance must be .parquet, .json, or .jsonl")


def _u16(buf: bytes, off: int) -> int:
    return struct.unpack_from("<H", buf, off)[0]


def _u32(buf: bytes, off: int) -> int:
    return struct.unpack_from("<I", buf, off)[0]


def _i32(buf: bytes, off: int) -> int:
    return struct.unpack_from("<i", buf, off)[0]


def compact_neuron_count(circuit: Path) -> int:
    """Read Ncompact from the same offsets vector consumed by the browser runtime."""
    buf = circuit.read_bytes()
    root = _u32(buf, 0)
    vtable = root - _i32(buf, root)
    vtable_len = _u16(buf, vtable)
    field = 5  # runtime offsets vector
    slot = 4 + 2 * field
    if slot + 2 > vtable_len:
        raise SystemExit("circuit.mcns has no runtime offsets field")
    rel = _u16(buf, vtable + slot)
    if rel == 0:
        raise SystemExit("circuit.mcns runtime offsets field is absent")
    pos = root + rel
    vec = pos + _u32(buf, pos)
    n_offsets = _u32(buf, vec)
    if n_offsets < 2:
        raise SystemExit(f"invalid offsets cardinality: {n_offsets}")
    return n_offsets - 1


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--circuit", type=Path, required=True)
    parser.add_argument("--provenance", type=Path, required=True)
    parser.add_argument(
        "--output-bin",
        type=Path,
        default=Path("public/flydoom/data/region_map.bin"),
    )
    parser.add_argument(
        "--output-meta",
        type=Path,
        default=Path("public/flydoom/data/region_map.meta.json"),
    )
    args = parser.parse_args()

    rows = load_rows(args.provenance)
    ncompact = compact_neuron_count(args.circuit)
    if len(rows) != ncompact:
        raise SystemExit(
            f"provenance cardinality {len(rows)} != compact runtime {ncompact}"
        )

    required = {"compact_index", "kind", "region_code"}
    region_map = bytearray(ncompact)
    kinds: Counter[str] = Counter()

    for expected_index, row in enumerate(rows):
        missing = required - set(row)
        if missing:
            raise SystemExit(
                f"provenance row {expected_index} missing columns {sorted(missing)}"
            )
        index = int(row["compact_index"])
        if index != expected_index:
            raise SystemExit(
                f"provenance index mismatch at row {expected_index}: {index}"
            )
        code = int(row["region_code"])
        if code not in CODE_REGION:
            raise SystemExit(f"invalid region_code {code} at compact index {index}")
        region_map[index] = code
        kinds[str(row["kind"])] += 1

    raw = bytes(region_map)
    args.output_bin.parent.mkdir(parents=True, exist_ok=True)
    args.output_bin.write_bytes(raw)

    counts = Counter(raw)
    meta = {
        "format": "flydoom/compact-region-map-v2",
        "compact_neurons": ncompact,
        "byte_length": len(raw),
        "region_codes": {str(code): name for code, name in CODE_REGION.items()},
        "counts": {
            CODE_REGION[code]: int(counts.get(code, 0))
            for code in sorted(CODE_REGION)
        },
        "provenance_kinds": dict(sorted(kinds.items())),
        "hash_chain": {
            "circuit_mcns_sha256": sha256_file(args.circuit),
            "provenance_sha256": sha256_file(args.provenance),
            "region_map_bin_sha256": sha256_bytes(raw),
        },
        "contract": {
            "index_rule": "row i in provenance == slot i in compact runtime",
            "cardinality_rule": "len(provenance) == len(region_map) == Ncompact",
            "worker_semantics": "worker consumes only uint8 region codes; lineage stays offline",
            "code_0": "other/unassigned, never inactive",
        },
    }
    args.output_meta.parent.mkdir(parents=True, exist_ok=True)
    args.output_meta.write_text(
        json.dumps(meta, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )

    print(json.dumps(meta, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
