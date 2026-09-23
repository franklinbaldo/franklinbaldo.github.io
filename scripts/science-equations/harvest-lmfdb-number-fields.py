#!/usr/bin/env python3
"""Stream LMFDB number-field rows into Scientific Equation Atlas occurrences."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from typing import TextIO

SOURCE_ID = "lmfdb-nf-defining-polynomials"
SOURCE_LICENSE = "CC BY-SA 4.0"
SOURCE_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/"
SOURCE_ACCESS_URL = "https://www.lmfdb.org/api/options"


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def parse_coefficients(value: str) -> list[int]:
    text = value.strip()
    if not text:
        raise ValueError("empty coeffs")
    if text[0] == "[" and text[-1] == "]":
        parsed = json.loads(text)
        if not isinstance(parsed, list):
            raise ValueError("coeffs JSON is not a list")
        return [int(item) for item in parsed]
    if text[0] == "{" and text[-1] == "}":
        body = text[1:-1].strip()
        if not body:
            return []
        return [int(item.strip()) for item in body.split(",")]
    raise ValueError(f"unsupported coeffs encoding: {text[:32]!r}")


def polynomial_text(coeffs: list[int], variable: str = "x") -> str:
    terms: list[str] = []
    for power in range(len(coeffs) - 1, -1, -1):
        coefficient = coeffs[power]
        if coefficient == 0:
            continue
        magnitude = abs(coefficient)
        if power == 0:
            core = str(magnitude)
        elif power == 1:
            core = variable if magnitude == 1 else f"{magnitude}*{variable}"
        else:
            core = f"{variable}^{power}" if magnitude == 1 else f"{magnitude}*{variable}^{power}"

        if not terms:
            terms.append(core if coefficient > 0 else f"-{core}")
        else:
            terms.append(("+ " if coefficient > 0 else "- ") + core)
    if not terms:
        return "0"
    return " ".join(terms)


def normalize_whitespace(value: str) -> str:
    return " ".join(value.split())


def convert_row(row: dict[str, str], snapshot: str) -> dict:
    label = (row.get("label") or "").strip()
    if not label:
        raise ValueError("missing label")

    coeffs = parse_coefficients(row.get("coeffs") or "")
    degree = int((row.get("degree") or "").strip())
    if len(coeffs) != degree + 1:
        raise ValueError(f"{label}: len(coeffs)={len(coeffs)} != degree+1={degree + 1}")
    if not coeffs or coeffs[-1] == 0:
        raise ValueError(f"{label}: invalid leading coefficient")

    polynomial = polynomial_text(coeffs)
    expression = f"{polynomial} = 0"
    normalized = normalize_whitespace(expression)

    source_payload = {
        "label": label,
        "coeffs": coeffs,
        "degree": degree,
        "disc_abs": int(row["disc_abs"]) if (row.get("disc_abs") or "").strip() else None,
        "disc_sign": int(row["disc_sign"]) if (row.get("disc_sign") or "").strip() else None,
        "galois_label": (row.get("galois_label") or "").strip() or None,
    }
    source_record_json = json.dumps(source_payload, sort_keys=True, separators=(",", ":"))

    return {
        "schema_version": 1,
        "source_id": SOURCE_ID,
        "source_snapshot": snapshot,
        "provenance_class": "reconstructed",
        "expression_original": expression,
        "expression_encoding": "ascii-polynomial-from-lmfdb-constant-first-coefficients",
        "source_record_sha256": sha256_text(source_record_json),
        "expression_sha256": sha256_text(expression),
        "normalized_text": normalized,
        "normalized_text_sha256": sha256_text(normalized),
        "source_document_id": label,
        "source_document_url": f"https://www.lmfdb.org/NumberField/{label}",
        "source_locator": f"nf_fields[label={label}].coeffs",
        "source_license": SOURCE_LICENSE,
        "source_license_url": SOURCE_LICENSE_URL,
        "source_policy_url": SOURCE_ACCESS_URL,
        "source_table": "nf_fields",
        "source_attested_payload": source_payload,
        "reconstruction": {
            "rule": "Interpret coeffs as constant-first coefficients a_i of the LMFDB normalized defining polynomial P(x)=sum_i a_i*x^i, then emit the equation P(x)=0.",
            "variable": "x",
            "degree_check": degree,
            "coefficient_order": "constant-first",
        },
    }


def harvest(input_handle: TextIO, output_handle: TextIO, snapshot: str, limit: int | None) -> dict[str, int]:
    reader = csv.DictReader(input_handle)
    required = {"label", "coeffs", "degree"}
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
        except Exception as exc:
            rejected += 1
            print(json.dumps({"event": "row-rejected", "row": read, "error": str(exc)}), file=sys.stderr)
            continue
        output_handle.write(json.dumps(record, sort_keys=True, separators=(",", ":")) + "\n")
        emitted += 1
    return {"rows_read": read, "records_emitted": emitted, "rows_rejected": rejected}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="-", help="CSV from deterministic LMFDB nf_fields COPY; '-' means stdin")
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
    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
