#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
REQUIRED = ("source_id", "source_snapshot", "provenance_class", "source_record_sha256")


def file_hash(path: Path, name: str) -> str:
    digest = hashlib.sha256() if name == "sha256" else hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def as_text(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def canonicalize(record: dict[str, Any]) -> dict[str, Any]:
    missing = [key for key in REQUIRED if not record.get(key)]
    if missing:
        raise ValueError("missing required keys: " + ", ".join(missing))
    if record["provenance_class"] not in {"attested", "reconstructed"}:
        raise ValueError("provenance_class must be attested or reconstructed")
    if not (record.get("original_expression") or record.get("reconstructed_expression")):
        raise ValueError("record needs original_expression or reconstructed_expression")

    known = {
        "source_id", "source_snapshot", "source_document_id", "source_document_url",
        "source_record_url", "source_license", "source_license_url", "provenance_class",
        "original_expression", "original_encoding", "source_representation",
        "source_representation_encoding", "reconstructed_expression", "reconstructed_encoding",
        "transformation_rule", "context", "domain_hint", "subdomain_hint",
        "source_record_sha256", "original_text_sha256", "normalized_text_sha256",
        "reconstructed_text_sha256"
    }
    extra = {key: record[key] for key in sorted(record) if key not in known}
    occurrence_seed = "\n".join([
        str(record["source_id"]),
        str(record["source_snapshot"]),
        str(record["source_record_sha256"]),
        str(record.get("source_document_id") or ""),
    ])
    return {
        "schema_version": SCHEMA_VERSION,
        "occurrence_id": hashlib.sha256(occurrence_seed.encode()).hexdigest(),
        "source_id": str(record["source_id"]),
        "source_snapshot": str(record["source_snapshot"]),
        "source_document_id": as_text(record.get("source_document_id")),
        "source_document_url": as_text(record.get("source_document_url")),
        "source_record_url": as_text(record.get("source_record_url")),
        "source_license": as_text(record.get("source_license")),
        "source_license_url": as_text(record.get("source_license_url")),
        "provenance_class": str(record["provenance_class"]),
        "original_expression": as_text(record.get("original_expression")),
        "original_encoding": as_text(record.get("original_encoding")),
        "source_representation": as_text(record.get("source_representation")),
        "source_representation_encoding": as_text(record.get("source_representation_encoding")),
        "reconstructed_expression": as_text(record.get("reconstructed_expression")),
        "reconstructed_encoding": as_text(record.get("reconstructed_encoding")),
        "transformation_rule": as_text(record.get("transformation_rule")),
        "context": as_text(record.get("context")),
        "domain_hint": as_text(record.get("domain_hint")),
        "subdomain_hint": as_text(record.get("subdomain_hint")),
        "source_record_sha256": str(record["source_record_sha256"]),
        "original_text_sha256": as_text(record.get("original_text_sha256")),
        "normalized_text_sha256": as_text(record.get("normalized_text_sha256")),
        "reconstructed_text_sha256": as_text(record.get("reconstructed_text_sha256")),
        "metadata_json": json.dumps(extra, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
    }


def records(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                yield line_number, json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"invalid JSON at line {line_number}: {exc}") from exc


def safe_part(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-") or "snapshot"


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert Atlas occurrence JSONL into canonical Parquet shards.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--stage", choices=["extracted", "normalized", "deduplicated"], default="extracted")
    parser.add_argument("--rows-per-shard", type=int, default=250000)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    if args.rows_per_shard < 1:
        parser.error("--rows-per-shard must be positive")

    input_path = Path(args.input)
    source_id = None
    snapshot = None
    accepted = 0
    rejected = 0

    if args.validate_only:
        for line_number, raw in records(input_path):
            try:
                row = canonicalize(raw)
            except Exception as exc:
                rejected += 1
                print(json.dumps({"event": "reject", "line": line_number, "error": str(exc)}), file=sys.stderr)
                continue
            source_id = source_id or row["source_id"]
            snapshot = snapshot or row["source_snapshot"]
            if row["source_id"] != source_id or row["source_snapshot"] != snapshot:
                raise ValueError("one materialization must contain one source_id/source_snapshot pair")
            accepted += 1
        print(json.dumps({"event": "validate-complete", "accepted_rows": accepted, "rejected_rows": rejected, "source_id": source_id, "source_snapshot": snapshot}))
        return 0 if rejected == 0 else 2

    try:
        import pyarrow as pa
        import pyarrow.parquet as pq
    except ImportError as exc:
        raise RuntimeError("pyarrow is required for Parquet output") from exc

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    shard_rows: list[dict[str, Any]] = []
    shards: list[dict[str, Any]] = []

    def flush() -> None:
        nonlocal shard_rows
        if not shard_rows:
            return
        filename = f"{args.stage}-{len(shards):05d}.parquet"
        path = output_dir / filename
        pq.write_table(pa.Table.from_pylist(shard_rows), path, compression="zstd", use_dictionary=True, write_statistics=True)
        shards.append({
            "file": filename,
            "rows": len(shard_rows),
            "bytes": path.stat().st_size,
            "sha256": file_hash(path, "sha256"),
            "md5": file_hash(path, "md5"),
        })
        shard_rows = []

    for line_number, raw in records(input_path):
        try:
            row = canonicalize(raw)
        except Exception as exc:
            rejected += 1
            print(json.dumps({"event": "reject", "line": line_number, "error": str(exc)}), file=sys.stderr)
            continue
        source_id = source_id or row["source_id"]
        snapshot = snapshot or row["source_snapshot"]
        if row["source_id"] != source_id or row["source_snapshot"] != snapshot:
            raise ValueError("one materialization must contain one source_id/source_snapshot pair")
        shard_rows.append(row)
        accepted += 1
        if len(shard_rows) >= args.rows_per_shard:
            flush()
    flush()

    if accepted == 0:
        raise ValueError("no valid rows to materialize")

    manifest = {
        "manifest_schema_version": 1,
        "occurrence_schema_version": SCHEMA_VERSION,
        "source_id": source_id,
        "source_snapshot": snapshot,
        "stage": args.stage,
        "rows": accepted,
        "rejected_rows": rejected,
        "compression": "zstd",
        "shards": shards,
    }
    stable = json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    manifest_sha256 = hashlib.sha256(stable.encode()).hexdigest()
    manifest["manifest_sha256"] = manifest_sha256
    manifest["archive_identifier"] = f"scientific-equation-atlas-{safe_part(str(source_id))}-{manifest_sha256[:16]}"
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"event": "materialize-complete", **manifest}, ensure_ascii=False))
    return 0 if rejected == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
