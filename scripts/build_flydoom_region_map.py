#!/usr/bin/env python3
"""Build FlyDoom's compact MaleCNS macro-region map.

Pure offline transform:

    graph.npz (canonical SpMV body order)
      + MaleCNS v1.0 annotations feather
      + explicit per-body ROI membership table
      -> region_map.bin + region_map.meta.json

The builder NEVER defines central brain by set subtraction. Every non-zero code
must be justified by either an explicit descending-neuron annotation or an
explicit canonical ROI membership listed below.

ROI table contract
------------------
Accepted formats: Feather/Arrow IPC, CSV, JSON/JSONL.
Required columns:
  bodyId|body     MaleCNS body ID
  roi             canonical MaleCNS ROI name
One of:
  score           numeric dominance score (larger = more dominant), or
  synapses        numeric dominance score, or
  weight          numeric dominance score, or
  pre/post        numeric counts; score = pre + post

If multiple ROI rows exist for a body, the highest-scoring included ROI wins.
Ties across *different macro-regions* are deliberately rejected as ambiguous.
Rows for ROIs outside the explicit allowlists remain code 0.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

import numpy as np

OPTIC_ROIS = frozenset(
    {
        "ME_R", "ME_L",
        "LO_R", "LO_L",
        "LOP_R", "LOP_L",
        "LA_R", "LA_L",
    }
)

CENTRAL_ROIS = frozenset(
    {
        # Central complex
        "EB", "FB", "NO", "PB", "AB",
        "EB_R", "EB_L", "FB_R", "FB_L", "NO_R", "NO_L", "PB_R", "PB_L", "AB_R", "AB_L",
        # Mushroom body
        "MB_CA_R", "MB_CA_L", "MB_PED_R", "MB_PED_L",
        "MB_VL_R", "MB_VL_L", "MB_ML_R", "MB_ML_L",
        # Higher-order integration centres
        "LH_R", "LH_L", "AL_R", "AL_L",
        "SMP_R", "SMP_L", "SIP_R", "SIP_L", "SLP_R", "SLP_L",
        "SCL_R", "SCL_L", "ICL_R", "ICL_L",
    }
)

REGION_CODE = {"unassigned": 0, "optic": 1, "central": 2, "descending": 3}
CODE_REGION = {value: key for key, value in REGION_CODE.items()}

ANNOTATION_URL = (
    "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/"
    "body-annotations-male-cns-v1.0-minconf-0.5.feather"
)
ATTRIBUTION_URL = "https://male-cns.janelia.org/download/"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _import_arrow():
    try:
        import pyarrow.feather as feather
        import pyarrow.ipc as ipc
        import pyarrow.csv as csv
    except ImportError as exc:
        raise SystemExit("pyarrow is required: uv run --with pyarrow ...") from exc
    return feather, ipc, csv


def load_table(path: Path):
    feather, ipc, csv = _import_arrow()
    suffix = path.suffix.lower()
    if suffix in {".feather", ".arrow"}:
        try:
            return feather.read_table(path)
        except Exception:
            with path.open("rb") as source:
                return ipc.open_file(source).read_all()
    if suffix == ".csv":
        return csv.read_csv(path)
    if suffix in {".json", ".jsonl"}:
        import pyarrow as pa

        rows = []
        text = path.read_text(encoding="utf-8")
        if suffix == ".jsonl":
            rows = [json.loads(line) for line in text.splitlines() if line.strip()]
        else:
            payload = json.loads(text)
            rows = payload if isinstance(payload, list) else payload.get("rows", [])
        return pa.Table.from_pylist(rows)
    raise SystemExit(f"unsupported table format: {path}")


def column_name(table, *candidates: str) -> str:
    for name in candidates:
        if name in table.column_names:
            return name
    raise SystemExit(f"missing one of columns {candidates!r}; got {table.column_names!r}")


def annotation_lookup(path: Path) -> dict[int, dict[str, str]]:
    table = load_table(path)
    body_col = column_name(table, "bodyId", "body")
    bodies = table[body_col].to_pylist()
    superclass = table["superclass"].to_pylist() if "superclass" in table.column_names else [None] * len(bodies)
    cls = table["class"].to_pylist() if "class" in table.column_names else [None] * len(bodies)
    status = table["status"].to_pylist() if "status" in table.column_names else [None] * len(bodies)
    result: dict[int, dict[str, str]] = {}
    for body, sup, cell_class, stat in zip(bodies, superclass, cls, status, strict=True):
        if body is None:
            continue
        result[int(body)] = {
            "superclass": "" if sup is None else str(sup),
            "class": "" if cell_class is None else str(cell_class),
            "status": "" if stat is None else str(stat),
        }
    return result


def roi_scores(path: Path) -> dict[int, list[tuple[str, float]]]:
    table = load_table(path)
    body_col = column_name(table, "bodyId", "body")
    roi_col = column_name(table, "roi", "ROI", "primary_roi", "primaryROI")

    numeric_cols = table.column_names
    if "score" in numeric_cols:
        values = table["score"].to_pylist()
    elif "synapses" in numeric_cols:
        values = table["synapses"].to_pylist()
    elif "weight" in numeric_cols:
        values = table["weight"].to_pylist()
    elif "pre" in numeric_cols or "post" in numeric_cols:
        pre = table["pre"].to_pylist() if "pre" in numeric_cols else [0] * table.num_rows
        post = table["post"].to_pylist() if "post" in numeric_cols else [0] * table.num_rows
        values = [(0 if a is None else float(a)) + (0 if b is None else float(b)) for a, b in zip(pre, post, strict=True)]
    else:
        raise SystemExit("ROI table needs score/synapses/weight or pre/post columns")

    rows: dict[int, list[tuple[str, float]]] = defaultdict(list)
    for body, roi, score in zip(table[body_col].to_pylist(), table[roi_col].to_pylist(), values, strict=True):
        if body is None or roi is None:
            continue
        rows[int(body)].append((str(roi), float(score or 0.0)))
    return dict(rows)


def roi_region(roi: str) -> int:
    if roi in OPTIC_ROIS:
        return REGION_CODE["optic"]
    if roi in CENTRAL_ROIS:
        return REGION_CODE["central"]
    return REGION_CODE["unassigned"]


def is_descending(annotation: dict[str, str]) -> bool:
    # The current FlyDoom/MaleCNS runtime uses superclass=descending_neuron for
    # its canonical descending readout. Keep the region map tied to the same
    # biological selector instead of type-name heuristics such as `DN*`.
    return annotation.get("superclass") == "descending_neuron"


def classify_body(
    body: int,
    annotation: dict[str, str] | None,
    roi_rows: Iterable[tuple[str, float]],
) -> tuple[int, str | None, float | None]:
    if annotation and is_descending(annotation):
        return REGION_CODE["descending"], "DN_canonical", None

    included = [(roi, score, roi_region(roi)) for roi, score in roi_rows]
    included = [row for row in included if row[2] != REGION_CODE["unassigned"]]
    if not included:
        return REGION_CODE["unassigned"], None, None

    best_score = max(score for _, score, _ in included)
    winners = [(roi, region) for roi, score, region in included if score == best_score]
    regions = {region for _, region in winners}
    if len(regions) > 1:
        names = ", ".join(sorted(roi for roi, _ in winners))
        raise ValueError(f"ambiguous equal-score macro-region tie for body {body}: {names}")
    roi, region = sorted(winners)[0]
    return region, roi, best_score


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--graph", type=Path, required=True, help="graph.npz defining canonical SpMV body order")
    parser.add_argument("--annotations", type=Path, required=True, help="MaleCNS v1.0 body annotations feather")
    parser.add_argument("--roi-table", type=Path, required=True, help="explicit bodyId/ROI dominance table exported from neuPrint/NAVis")
    parser.add_argument("--output-bin", type=Path, default=Path("public/flydoom/data/region_map.bin"))
    parser.add_argument("--output-meta", type=Path, default=Path("public/flydoom/data/region_map.meta.json"))
    parser.add_argument("--expected-neurons", type=int, default=165122)
    args = parser.parse_args()

    graph = np.load(args.graph, allow_pickle=False)
    if "bodies" not in graph.files:
        raise SystemExit("graph.npz must contain the canonical `bodies` vector")
    bodies = np.asarray(graph["bodies"], dtype=np.int64)
    if len(bodies) != args.expected_neurons:
        raise SystemExit(f"unexpected graph size: {len(bodies)} != {args.expected_neurons}")
    if len(np.unique(bodies)) != len(bodies):
        raise SystemExit("graph bodies are not unique")
    if np.any(bodies[1:] <= bodies[:-1]):
        raise SystemExit("graph bodies are not strictly increasing; index-order invariant changed")

    annotations = annotation_lookup(args.annotations)
    rois = roi_scores(args.roi_table)

    region_map = np.zeros(len(bodies), dtype=np.uint8)
    chosen_roi: dict[str, int] = Counter()
    missing_annotations = 0
    bodies_with_roi_rows = 0
    for index, body_np in enumerate(bodies):
        body = int(body_np)
        annotation = annotations.get(body)
        if annotation is None:
            missing_annotations += 1
        body_rois = rois.get(body, [])
        if body_rois:
            bodies_with_roi_rows += 1
        code, roi, _ = classify_body(body, annotation, body_rois)
        region_map[index] = code
        if roi:
            chosen_roi[roi] += 1

    if np.any(region_map > 3):
        raise SystemExit("region map contains invalid code")

    args.output_bin.parent.mkdir(parents=True, exist_ok=True)
    raw = region_map.tobytes(order="C")
    args.output_bin.write_bytes(raw)

    counts = Counter(int(code) for code in region_map)
    bodies_sha = sha256_bytes(bodies.astype("<i8", copy=False).tobytes(order="C"))
    meta = {
        "format": "flydoom/malecns-region-map-v1",
        "source": {
            "dataset": "MaleCNS v1.0",
            "dataset_url": ATTRIBUTION_URL,
            "license": "CC BY",
            "annotations_url": ANNOTATION_URL,
            "annotations_sha256": sha256_file(args.annotations),
            "roi_table_path": str(args.roi_table),
            "roi_table_sha256": sha256_file(args.roi_table),
            "graph_path": str(args.graph),
            "graph_sha256": sha256_file(args.graph),
            "spmv_body_order_sha256_le_i64": bodies_sha,
            "spmv_order_rule": "graph.npz bodies vector; strictly increasing MaleCNS body IDs",
        },
        "total_neurons": int(len(bodies)),
        "byte_length": len(raw),
        "sha256": sha256_bytes(raw),
        "codes": REGION_CODE,
        "counts": {
            CODE_REGION[code]: int(counts.get(code, 0))
            for code in sorted(CODE_REGION)
        },
        "coverage": {
            "annotations_found": int(len(bodies) - missing_annotations),
            "annotations_missing": int(missing_annotations),
            "bodies_with_roi_rows": int(bodies_with_roi_rows),
        },
        "roi_definitions": {
            "optic": sorted(OPTIC_ROIS),
            "central": sorted(CENTRAL_ROIS),
            "descending": ["superclass=descending_neuron"],
        },
        "classification": {
            "precedence": ["descending annotation", "highest-scoring explicit included ROI", "unassigned"],
            "central_by_complement": False,
            "cross_macro_equal_score_ties": "error",
            "note": (
                "Code 0 includes VNC, peripheral, unsupported ROI, missing ROI, and any neuron "
                "that does not meet an explicit allowlisted criterion."
            ),
        },
        "chosen_roi_counts": dict(sorted(chosen_roi.items())),
    }
    args.output_meta.parent.mkdir(parents=True, exist_ok=True)
    args.output_meta.write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(json.dumps({"sha256": meta["sha256"], "counts": meta["counts"], "coverage": meta["coverage"]}, indent=2))


if __name__ == "__main__":
    main()
