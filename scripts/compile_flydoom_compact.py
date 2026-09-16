#!/usr/bin/env python3
"""Compile the FlyDoom MaleCNS runtime and its provenance atomically.

Inputs are the public MaleCNS v1.0 flat-connectome Feather files. The compiler
keeps the canonical retained body ordering, deterministically reduces incoming
connectivity, 4-bit quantizes the recurrent operator, and emits together:

  * circuit.mcns
  * provenance.parquet
  * region_map.bin
  * circuit.meta.json

The browser worker only consumes circuit.mcns + region_map.bin. Provenance and
metadata are offline audit artifacts.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import struct
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import numpy as np

BASE = "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome"
WEIGHTS = "connectome-weights-male-cns-v1.0-minconf-0.5.feather"
ANNOTATIONS = "body-annotations-male-cns-v1.0-minconf-0.5.feather"
NEUROTRANSMITTERS = "body-neurotransmitters-male-cns-v1.0.feather"

REGION_CODE = {"other": 0, "optic": 1, "central": 2, "descending": 3}
OPTIC_ROIS = frozenset({"ME_R", "ME_L", "LO_R", "LO_L", "LOP_R", "LOP_L", "LA_R", "LA_L"})
CENTRAL_ROIS = frozenset(
    {
        "EB", "FB", "NO", "PB", "AB",
        "EB_R", "EB_L", "FB_R", "FB_L", "NO_R", "NO_L", "PB_R", "PB_L", "AB_R", "AB_L",
        "MB_CA_R", "MB_CA_L", "MB_PED_R", "MB_PED_L", "MB_VL_R", "MB_VL_L", "MB_ML_R", "MB_ML_L",
        "LH_R", "LH_L", "AL_R", "AL_L", "SMP_R", "SMP_L", "SIP_R", "SIP_L", "SLP_R", "SLP_L",
        "SCL_R", "SCL_L", "ICL_R", "ICL_L",
    }
)
FAST_SIGN = {
    "acetylcholine": 1.0,
    "gaba": -1.0,
    "glutamate": -1.0,
    "histamine": -1.0,
    "dopamine": 0.0,
    "octopamine": 0.0,
    "serotonin": 0.0,
    "unclear": 0.0,
    "unknown": 0.0,
}
# 16 entries, including an exact zero for no-op delta bridge entries.
LUT = np.asarray(
    [-1.0, -0.80, -0.60, -0.40, -0.25, -0.125, -0.0625, 0.0,
      0.0625, 0.125, 0.25, 0.40, 0.60, 0.80, 0.90, 1.0],
    dtype=np.float32,
)
ZERO_LUT_INDEX = 7


@dataclass(frozen=True)
class CompilePolicy:
    min_synapses: int = 3
    max_incoming: int = 10
    traced_only: bool = True
    exclude_glia: bool = True


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(8 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.stat().st_size:
        return path
    tmp = path.with_suffix(path.suffix + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": "flydoom-compact-compiler/1"})
    with urllib.request.urlopen(req, timeout=120) as response, tmp.open("wb") as out:
        while chunk := response.read(8 * 1024 * 1024):
            out.write(chunk)
    tmp.replace(path)
    return path


def find_col(table, *names: str) -> str:
    for name in names:
        if name in table.column_names:
            return name
    raise KeyError(f"none of {names!r}; columns={table.column_names!r}")


def string_column(table, name: str, fallback: str = "") -> np.ndarray:
    if name not in table.column_names:
        return np.full(table.num_rows, fallback, dtype=object)
    return np.asarray([fallback if v is None else str(v) for v in table[name].to_pylist()], dtype=object)


def classify_roi(roi: str) -> int:
    if roi in OPTIC_ROIS:
        return REGION_CODE["optic"]
    if roi in CENTRAL_ROIS:
        return REGION_CODE["central"]
    return REGION_CODE["other"]


def pick_primary_roi_column(table) -> str:
    candidates = ("primaryRoi", "primaryROI", "primary_roi", "primaryRois", "primary_rois")
    for name in candidates:
        if name in table.column_names:
            return name
    raise SystemExit(
        "MaleCNS annotation table has no supported primary-ROI column. "
        f"Observed columns: {table.column_names!r}. Refuse to infer regions heuristically."
    )


def make_flatbuffer(offsets, scales, deltas, packed_weights, lut) -> bytes:
    try:
        import flatbuffers
    except ImportError as exc:
        raise SystemExit("flatbuffers package is required") from exc

    b = flatbuffers.Builder(8 * 1024 * 1024)

    def vec_u32(values: np.ndarray):
        b.StartVector(4, len(values), 4)
        for value in values[::-1]:
            b.PrependUint32(int(value))
        return b.EndVector()

    def vec_u16(values: np.ndarray):
        b.StartVector(2, len(values), 2)
        for value in values[::-1]:
            b.PrependUint16(int(value))
        return b.EndVector()

    def vec_u8(values: np.ndarray):
        b.StartVector(1, len(values), 1)
        for value in values[::-1]:
            b.PrependUint8(int(value))
        return b.EndVector()

    def vec_f32(values: np.ndarray):
        b.StartVector(4, len(values), 4)
        for value in values[::-1]:
            b.PrependFloat32(float(value))
        return b.EndVector()

    v_offsets = vec_u32(offsets)
    v_scales = vec_f32(scales)
    v_deltas = vec_u16(deltas)
    v_weights = vec_u8(packed_weights)
    v_lut = vec_f32(lut)

    # Browser contract reads fields 5..9 only. Keep the table intentionally small.
    b.StartObject(10)
    b.PrependUOffsetTRelativeSlot(5, v_offsets, 0)
    b.PrependUOffsetTRelativeSlot(6, v_scales, 0)
    b.PrependUOffsetTRelativeSlot(7, v_deltas, 0)
    b.PrependUOffsetTRelativeSlot(8, v_weights, 0)
    b.PrependUOffsetTRelativeSlot(9, v_lut, 0)
    root = b.EndObject()
    b.Finish(root)
    return bytes(b.Output())


def quantize_row(weights: np.ndarray) -> tuple[np.ndarray, float]:
    if not len(weights):
        return np.empty(0, dtype=np.uint8), 1.0
    denom = float(np.sum(np.abs(weights)))
    if not math.isfinite(denom) or denom <= 0:
        return np.full(len(weights), ZERO_LUT_INDEX, dtype=np.uint8), 1.0
    normalized = np.asarray(weights / denom, dtype=np.float32)
    # Nearest LUT entry. Row-L1 normalization makes scale=1 deterministic and stable.
    distance = np.abs(normalized[:, None] - LUT[None, :])
    codes = np.argmin(distance, axis=1).astype(np.uint8)
    return codes, 1.0


def pack_nibbles(codes: np.ndarray) -> np.ndarray:
    out = np.zeros((len(codes) + 1) // 2, dtype=np.uint8)
    out[:] = codes[0::2] & 0x0F
    odd = codes[1::2]
    out[: len(odd)] |= (odd & 0x0F) << 4
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-dir", type=Path, default=Path(".cache/flydoom-malecns-v1"))
    parser.add_argument("--output-dir", type=Path, default=Path("public/flydoom/data"))
    parser.add_argument("--circuit-output", type=Path, default=Path("public/flydoom/malecns_l3_compact.mcns"))
    parser.add_argument("--max-incoming", type=int, default=10)
    parser.add_argument("--min-synapses", type=int, default=3)
    args = parser.parse_args()
    policy = CompilePolicy(min_synapses=args.min_synapses, max_incoming=args.max_incoming)

    try:
        import pyarrow as pa
        import pyarrow.feather as feather
        import pyarrow.parquet as parquet
        import scipy.sparse as sp
    except ImportError as exc:
        raise SystemExit("requires numpy, pyarrow, scipy, flatbuffers") from exc

    raw = args.cache_dir
    files = {
        "annotations": download(f"{BASE}/{ANNOTATIONS}", raw / ANNOTATIONS),
        "neurotransmitters": download(f"{BASE}/{NEUROTRANSMITTERS}", raw / NEUROTRANSMITTERS),
        "weights": download(f"{BASE}/{WEIGHTS}", raw / WEIGHTS),
    }

    annotations = feather.read_table(files["annotations"], memory_map=True)
    body_col = find_col(annotations, "bodyId", "body")
    body_ids = annotations[body_col].to_numpy(zero_copy_only=False).astype(np.int64)
    keep = np.ones(annotations.num_rows, dtype=bool)
    if policy.traced_only and "status" in annotations.column_names:
        keep &= np.asarray([v == "Traced" for v in annotations["status"].to_pylist()])
    if policy.exclude_glia and "statusLabel" in annotations.column_names:
        keep &= np.asarray([v != "Glia" for v in annotations["statusLabel"].to_pylist()])
    bodies = np.unique(body_ids[keep])
    bodies.sort()
    n = len(bodies)
    if n != 165122:
        raise SystemExit(f"canonical retained body count changed: {n} != 165122")

    roi_col = pick_primary_roi_column(annotations)
    superclass_values = string_column(annotations, "superclass")
    roi_values = string_column(annotations, roi_col)
    ann_lookup = {}
    for body, superclass, roi in zip(body_ids[keep], superclass_values[keep], roi_values[keep], strict=True):
        ann_lookup.setdefault(int(body), (str(superclass), str(roi)))

    nt_table = feather.read_table(files["neurotransmitters"], memory_map=True)
    nt_body_col = find_col(nt_table, "body", "bodyId")
    nt_values_col = find_col(nt_table, "consensus_nt", "consensusNt")
    nt_bodies = nt_table[nt_body_col].to_numpy(zero_copy_only=False).astype(np.int64)
    nt_values = np.asarray(["unknown" if v is None else str(v).lower() for v in nt_table[nt_values_col].to_pylist()], dtype=object)
    nt_lookup = {int(body): nt for body, nt in zip(nt_bodies, nt_values, strict=True)}
    sign = np.asarray([FAST_SIGN.get(nt_lookup.get(int(body), "unknown"), 0.0) for body in bodies], dtype=np.float32)

    weights_table = feather.read_table(files["weights"], columns=["body_pre", "body_post", "weight"], memory_map=True)
    pre = weights_table["body_pre"].to_numpy(zero_copy_only=False).astype(np.int64)
    post = weights_table["body_post"].to_numpy(zero_copy_only=False).astype(np.int64)
    raw_weight = weights_table["weight"].to_numpy(zero_copy_only=False).astype(np.float32)

    threshold = raw_weight >= policy.min_synapses
    pre, post, raw_weight = pre[threshold], post[threshold], raw_weight[threshold]

    def locate(ids: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        pos = np.searchsorted(bodies, ids)
        clipped = np.minimum(pos, n - 1)
        valid = (pos < n) & (bodies[clipped] == ids)
        return pos.astype(np.int32, copy=False), valid

    pre_idx, pre_valid = locate(pre)
    post_idx, post_valid = locate(post)
    valid = pre_valid & post_valid
    pre_idx, post_idx, raw_weight = pre_idx[valid], post_idx[valid], raw_weight[valid]
    signed_weight = raw_weight * sign[pre_idx]
    signed = signed_weight != 0.0
    pre_idx, post_idx, signed_weight = pre_idx[signed], post_idx[signed], signed_weight[signed]
    full_signed_edges = len(signed_weight)

    # CSR gives deterministic row grouping. We then retain strongest incoming edges per row.
    matrix = sp.csr_matrix((signed_weight, (post_idx, pre_idx)), shape=(n, n), dtype=np.float32)
    matrix.sum_duplicates()

    offsets = np.zeros(n + 1, dtype=np.uint32)
    scales = np.ones(n, dtype=np.float32)
    encoded_deltas: list[int] = []
    encoded_codes: list[int] = []
    real_compact_edges = 0
    bridge_edges = 0

    for row in range(n):
        start, end = int(matrix.indptr[row]), int(matrix.indptr[row + 1])
        cols = matrix.indices[start:end]
        vals = matrix.data[start:end]
        if len(vals) > policy.max_incoming:
            strongest = np.argpartition(np.abs(vals), -policy.max_incoming)[-policy.max_incoming:]
            cols = cols[strongest]
            vals = vals[strongest]
        if len(cols):
            order = np.argsort(cols, kind="stable")
            cols = cols[order]
            vals = vals[order]
            codes, scale = quantize_row(vals)
            scales[row] = scale
            previous = 0
            for col, code in zip(cols.tolist(), codes.tolist(), strict=True):
                gap = int(col) - previous
                # Uint16 delta codec: no-op bridge entries are explicit and auditable.
                while gap > 65535:
                    encoded_deltas.append(65535)
                    encoded_codes.append(ZERO_LUT_INDEX)
                    previous += 65535
                    gap = int(col) - previous
                    bridge_edges += 1
                encoded_deltas.append(gap)
                encoded_codes.append(int(code))
                previous = int(col)
                real_compact_edges += 1
        offsets[row + 1] = len(encoded_deltas)

    deltas = np.asarray(encoded_deltas, dtype=np.uint16)
    codes = np.asarray(encoded_codes, dtype=np.uint8)
    packed = pack_nibbles(codes)

    region_map = np.zeros(n, dtype=np.uint8)
    provenance_rows = []
    for slot, body in enumerate(bodies.tolist()):
        superclass, roi = ann_lookup.get(int(body), ("", ""))
        if superclass == "descending_neuron":
            region = REGION_CODE["descending"]
        else:
            region = classify_roi(roi)
        region_map[slot] = region
        provenance_rows.append(
            {
                "slot_index": slot,
                "kind": "body",
                "source_body_ids": [int(body)],
                "source_rois": [roi] if roi else [],
                "superclass": superclass,
                "region_code": int(region),
            }
        )

    mcns = make_flatbuffer(offsets, scales, deltas, packed, LUT)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.circuit_output.parent.mkdir(parents=True, exist_ok=True)
    args.circuit_output.write_bytes(mcns)
    provenance_path = args.output_dir / "provenance.parquet"
    region_path = args.output_dir / "region_map.bin"
    meta_path = args.output_dir / "circuit.meta.json"
    parquet.write_table(pa.Table.from_pylist(provenance_rows), provenance_path, compression="zstd")
    region_path.write_bytes(region_map.tobytes(order="C"))

    region_counts = {name: int(np.count_nonzero(region_map == code)) for name, code in REGION_CODE.items()}
    meta = {
        "format": "flydoom/malecns-compact-runtime-v2",
        "dataset": "MaleCNS v1.0",
        "license": "CC BY 4.0",
        "source_base": BASE,
        "policy": {
            "traced_only": policy.traced_only,
            "exclude_glia": policy.exclude_glia,
            "min_synapses": policy.min_synapses,
            "max_incoming_per_postsynaptic_slot": policy.max_incoming,
            "quantization": "row-L1 normalized nearest 4-bit global LUT",
            "delta_codec": "uint16; zero-weight bridge entries split gaps >65535",
        },
        "runtime": {
            "neurons": n,
            "full_signed_edges_after_filter": int(full_signed_edges),
            "compact_real_edges": int(real_compact_edges),
            "delta_bridge_entries": int(bridge_edges),
            "encoded_entries": int(len(deltas)),
            "compression_factor_edges": float(full_signed_edges / max(real_compact_edges, 1)),
            "region_counts": region_counts,
        },
        "hash_chain": {
            "annotations_sha256": sha256_file(files["annotations"]),
            "neurotransmitters_sha256": sha256_file(files["neurotransmitters"]),
            "weights_sha256": sha256_file(files["weights"]),
            "circuit_mcns_sha256": sha256_file(args.circuit_output),
            "provenance_parquet_sha256": sha256_file(provenance_path),
            "region_map_bin_sha256": sha256_file(region_path),
        },
        "artifacts": {
            "circuit": str(args.circuit_output),
            "provenance": str(provenance_path),
            "region_map": str(region_path),
        },
    }
    meta_path.write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(meta, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
