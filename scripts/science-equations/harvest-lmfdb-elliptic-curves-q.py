#!/usr/bin/env python3
"""Stream LMFDB elliptic-curve rows over Q into Atlas occurrences."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from typing import TextIO

SOURCE_ID = "lmfdb-ec-q-weierstrass"
SOURCE_LICENSE = "CC-BY-SA"
SOURCE_LICENSE_URL = "https://www.lmfdb.org/api/options"
SOURCE_ACCESS_URL = "https://www.lmfdb.org/api/options"


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def parse_int_array(value: str) -> list[int]:
    text = value.strip()
    if not text:
        raise ValueError("empty array")
    if text[0] == "[" and text[-1] == "]":
        parsed = json.loads(text)
        if not isinstance(parsed, list):
            raise ValueError("JSON value is not a list")
        return [int(item) for item in parsed]
    if text[0] == "{" and text[-1] == "}":
        body = text[1:-1].strip()
        if not body:
            return []
        return [int(item.strip()) for item in body.split(",")]
    raise ValueError(f"unsupported array encoding: {text[:32]!r}")


def optional_int(value: str | None) -> int | None:
    text = (value or "").strip()
    return int(text) if text else None


def signed_terms(base: str, terms: list[tuple[int, str]]) -> str:
    parts = [base]
    for coefficient, monomial in terms:
        if coefficient == 0:
            continue
        magnitude = abs(coefficient)
        if not monomial:
            body = str(magnitude)
        elif magnitude == 1:
            body = monomial
        else:
            body = f"{magnitude}*{monomial}"
        parts.append(("+ " if coefficient > 0 else "- ") + body)
    return " ".join(parts)


def weierstrass_equation(ainvs: list[int]) -> str:
    if len(ainvs) != 5:
        raise ValueError(f"expected 5 a-invariants, got {len(ainvs)}")
    a1, a2, a3, a4, a6 = ainvs
    left = signed_terms("y^2", [(a1, "x*y"), (a3, "y")])
    right = signed_terms("x^3", [(a2, "x^2"), (a4, "x"), (a6, "")])
    return f"{left} = {right}"


def lmfdb_curve_url(label: str) -> str:
    if "." not in label:
        return f"https://www.lmfdb.org/EllipticCurve/Q/{label}"
    conductor, tail = label.split(".", 1)
    split_at = next((i for i, char in enumerate(tail) if char.isdigit()), len(tail))
    iso, number = tail[:split_at], tail[split_at:]
    if not iso or not number:
        return f"https://www.lmfdb.org/EllipticCurve/Q/{label}"
    return f"https://www.lmfdb.org/EllipticCurve/Q/{conductor}/{iso}/{number}"


def convert_row(row: dict[str, str], snapshot: str) -> dict:
    label = (row.get("lmfdb_label") or "").strip()
    if not label:
        raise ValueError("missing lmfdb_label")

    ainvs = parse_int_array(row.get("ainvs") or "")
    if len(ainvs) != 5:
        raise ValueError(f"{label}: expected 5 a-invariants, got {len(ainvs)}")

    conductor = optional_int(row.get("conductor"))
    if conductor is None or conductor <= 0:
        raise ValueError(f"{label}: invalid conductor")

    expression = weierstrass_equation(ainvs)
    normalized = " ".join(expression.split())
    source_payload = {
        "lmfdb_label": label,
        "ainvs": ainvs,
        "conductor": conductor,
        "lmfdb_iso": (row.get("lmfdb_iso") or "").strip() or None,
        "lmfdb_number": optional_int(row.get("lmfdb_number")),
        "jinv_raw": (row.get("jinv") or "").strip() or None,
        "analytic_rank": optional_int(row.get("analytic_rank")),
        "cm": optional_int(row.get("cm")),
    }
    source_record_json = json.dumps(source_payload, sort_keys=True, separators=(",", ":"))

    return {
        "schema_version": 1,
        "source_id": SOURCE_ID,
        "source_snapshot": snapshot,
        "provenance_class": "reconstructed",
        "expression_original": expression,
        "expression_encoding": "ascii-generalized-weierstrass-from-lmfdb-ainvs",
        "source_record_sha256": sha256_text(source_record_json),
        "expression_sha256": sha256_text(expression),
        "normalized_text": normalized,
        "normalized_text_sha256": sha256_text(normalized),
        "source_document_id": label,
        "source_document_url": lmfdb_curve_url(label),
        "source_locator": f"ec_curvedata[lmfdb_label={label}].ainvs",
        "source_license": SOURCE_LICENSE,
        "source_license_url": SOURCE_LICENSE_URL,
        "source_policy_url": SOURCE_ACCESS_URL,
        "source_table": "ec_curvedata",
        "source_attested_payload": source_payload,
        "reconstruction": {
            "rule": "Interpret the five stored a-invariants as [a1,a2,a3,a4,a6] and emit the generalized minimal Weierstrass equation y^2+a1*x*y+a3*y=x^3+a2*x^2+a4*x+a6.",
            "variables": ["x", "y"],
            "coefficient_order": ["a1", "a2", "a3", "a4", "a6"],
            "field": "Q",
        },
    }


def harvest(input_handle: TextIO, output_handle: TextIO, snapshot: str, limit: int | None) -> dict[str, int]:
    reader = csv.DictReader(input_handle)
    required = {"lmfdb_label", "ainvs", "conductor"}
    missing = required.difference(reader.fieldnames or [])
    if missing:
        raise ValueError(f"missing required CSV columns: {sorted(missing)}")

    read = emitted = rejected = 0
    for row in reader:
        if limit is not None and emitted >= limit:
            break
        read += 1
        try:
            record = convert_row(row, snapshot)
        except Exception as exc:  # noqa: BLE001
            rejected += 1
            print(json.dumps({"event": "row-rejected", "row": read, "error": str(exc)}, sort_keys=True), file=sys.stderr)
            continue
        output_handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")
        emitted += 1
    return {"rows_read": read, "records_emitted": emitted, "rows_rejected": rejected}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default="-", help="CSV from deterministic LMFDB ec_curvedata COPY; '-' means stdin")
    parser.add_argument("--snapshot", required=True, help="Exact acquisition snapshot id, preferably rowstream-sha256:<digest>")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")

    handle = sys.stdin if args.input == "-" else open(args.input, "r", encoding="utf-8", newline="")
    try:
        metrics = harvest(handle, sys.stdout, args.snapshot, args.limit)
    finally:
        if handle is not sys.stdin:
            handle.close()
    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
