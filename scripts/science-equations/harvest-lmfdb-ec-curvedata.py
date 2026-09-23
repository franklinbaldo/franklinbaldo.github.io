#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Iterable

SOURCE_ID = "lmfdb-ec-curvedata-weierstrass"
SOURCE_URL = "https://www.lmfdb.org/api/ec_curvedata/"
SOURCE_LICENSE = "CC-BY-SA-4.0"
SOURCE_LICENSE_URL = "https://www.lmfdb.org/knowledge/show/doc.license"
TRANSFORMATION_RULE = (
    "LMFDB ec_curvedata.ainvs=[a1,a2,a3,a4,a6] defines the generalized "
    "Weierstrass model y^2 + a1*x*y + a3*y = x^3 + a2*x^2 + a4*x + a6."
)


def _json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else str(value)
    raise TypeError(type(value).__name__)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _term(coefficient: int, symbol: str, *, first: bool = False) -> str:
    if coefficient == 0:
        return ""
    abs_c = abs(coefficient)
    body = symbol if abs_c == 1 else f"{abs_c}*{symbol}"
    if first:
        return body if coefficient > 0 else f"-{body}"
    return f" + {body}" if coefficient > 0 else f" - {body}"


def weierstrass_equation(ainvs: list[int]) -> str:
    if len(ainvs) != 5:
        raise ValueError("ainvs must contain [a1,a2,a3,a4,a6]")
    a1, a2, a3, a4, a6 = [int(v) for v in ainvs]
    left = "y^2"
    left += _term(a1, "x*y")
    left += _term(a3, "y")
    right = "x^3"
    right += _term(a2, "x^2")
    right += _term(a4, "x")
    right += _term(a6, "1")
    right = right.replace("*1", "")
    return f"{left} = {right}"


def record_from_row(row: dict[str, Any], snapshot: str) -> dict[str, Any]:
    label = row.get("lmfdb_label")
    ainvs = row.get("ainvs")
    if not isinstance(label, str) or not isinstance(ainvs, list) or len(ainvs) != 5:
        raise ValueError("row must contain lmfdb_label and five-element ainvs")
    normalized_ainvs = [int(v) for v in ainvs]
    source_payload = {
        "lmfdb_label": label,
        "ainvs": normalized_ainvs,
        "conductor": int(row["conductor"]) if row.get("conductor") is not None else None,
    }
    source_json = json.dumps(source_payload, sort_keys=True, separators=(",", ":"), default=_json_default)
    reconstructed = weierstrass_equation(normalized_ainvs)
    return {
        "source_id": SOURCE_ID,
        "source_snapshot": snapshot,
        "source_document_id": label,
        "source_document_url": f"https://www.lmfdb.org/EllipticCurve/Q/{label.replace('.', '/')}",
        "source_record_url": f"https://www.lmfdb.org/EllipticCurve/Q/data/{label}",
        "source_license": SOURCE_LICENSE,
        "source_license_url": SOURCE_LICENSE_URL,
        "provenance_class": "reconstructed",
        "source_representation": source_json,
        "source_representation_encoding": "lmfdb-ec_curvedata-json",
        "reconstructed_expression": reconstructed,
        "reconstructed_encoding": "plain-math-ascii",
        "transformation_rule": TRANSFORMATION_RULE,
        "domain_hint": "Mathematics",
        "subdomain_hint": "Elliptic curves over Q",
        "source_record_sha256": sha256_text(source_json),
        "reconstructed_text_sha256": sha256_text(reconstructed),
        "lmfdb_label": label,
        "ainvs": normalized_ainvs,
        "conductor": source_payload["conductor"],
    }


def rows_from_fixture(path: str) -> Iterable[dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"invalid JSONL at line {line_number}: {exc}") from exc


def rows_from_lmfdb(batch_size: int) -> Iterable[dict[str, Any]]:
    try:
        import psycopg  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "psycopg is required for live LMFDB harvest; run with e.g. "
            "uv run --with 'psycopg[binary]' ..."
        ) from exc
    conn = psycopg.connect(
        host="devmirror.lmfdb.xyz",
        port=5432,
        dbname="lmfdb",
        user="lmfdb",
        password="lmfdb",
        connect_timeout=30,
    )
    try:
        with conn.cursor(name="atlas_ec_curvedata") as cur:
            cur.itersize = batch_size
            cur.execute(
                "SELECT lmfdb_label, ainvs, conductor "
                "FROM ec_curvedata ORDER BY lmfdb_label"
            )
            for label, ainvs, conductor in cur:
                yield {"lmfdb_label": label, "ainvs": ainvs, "conductor": conductor}
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Harvest LMFDB elliptic-curve equations from ec_curvedata.")
    parser.add_argument("--snapshot", required=True, help="Immutable Atlas snapshot identifier for this acquisition")
    parser.add_argument("--fixture-jsonl", help="Read source rows from a local JSONL fixture instead of the live SQL mirror")
    parser.add_argument("--batch-size", type=int, default=10000)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    if args.batch_size < 1 or (args.limit is not None and args.limit < 1):
        parser.error("batch size and limit must be positive")

    source_rows = rows_from_fixture(args.fixture_jsonl) if args.fixture_jsonl else rows_from_lmfdb(args.batch_size)
    emitted = 0
    rejected = 0
    for row in source_rows:
        if args.limit is not None and emitted >= args.limit:
            break
        try:
            record = record_from_row(row, args.snapshot)
        except Exception as exc:
            rejected += 1
            print(json.dumps({"event": "reject", "error": str(exc), "row": row}, default=_json_default), file=sys.stderr)
            continue
        print(json.dumps(record, ensure_ascii=False, separators=(",", ":"), default=_json_default))
        emitted += 1

    print(
        json.dumps(
            {
                "event": "harvest-complete",
                "source_id": SOURCE_ID,
                "snapshot": args.snapshot,
                "records_written": emitted,
                "rejected_rows": rejected,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        ),
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
