#!/usr/bin/env python3
"""Materialize Scientific Equation Atlas JSONL transport into deterministic Parquet shards."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, model_validator


class OccurrenceV1(BaseModel):
    model_config = ConfigDict(extra="allow")

    schema_version: int = 1
    source_id: str
    source_snapshot: str
    provenance_class: Literal["attested", "reconstructed"]
    expression_original: str | None = None
    expression_reconstructed: str | None = None
    expression_encoding: str
    source_record_sha256: str
    expression_sha256: str | None = None
    normalized_text: str | None = None
    normalized_text_sha256: str | None = None
    source_document_id: str | None = None
    source_document_url: str | None = None
    source_locator: str | None = None
    source_license: str | None = None
    source_license_url: str | None = None
    context_text: str | None = None

    @model_validator(mode="before")
    @classmethod
    def canonicalize_legacy_fields(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        data = dict(value)
        aliases = {
            "original_expression": "expression_original",
            "original_encoding": "expression_encoding",
            "original_text_sha256": "expression_sha256",
            "source_record_url": "source_document_url",
        }
        for old, new in aliases.items():
            if new not in data and old in data:
                data[new] = data[old]
        if "expression_sha256" not in data:
            expression = data.get("expression_original") or data.get("expression_reconstructed")
            if expression:
                data["expression_sha256"] = hashlib.sha256(expression.encode()).hexdigest()
        return data

    @model_validator(mode="after")
    def validate_expression_provenance(self):
        if self.provenance_class == "attested" and not self.expression_original:
            raise ValueError("attested occurrences require expression_original")
        if self.provenance_class == "reconstructed" and not (self.expression_reconstructed or self.expression_original):
            raise ValueError("reconstructed occurrences require expression_reconstructed or legacy expression_original")
        return self


class ShardEntry(BaseModel):
    file: str
    rows: int
    bytes: int
    sha256: str


class Manifest(BaseModel):
    schema_version: int = 1
    dataset_schema: str = "science-equation-occurrence-v1"
    source_id: str
    source_snapshot: str
    stage: Literal["extracted", "normalized", "deduplicated"]
    compression: str = "zstd"
    rows: int
    shards: list[ShardEntry]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sanitize(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-").lower()


def iter_rows(input_path: Path):
    with input_path.open("rb") as raw_handle:
        header = raw_handle.read(2)
        encoding = "utf-16" if header == b"\xff\xfe" else "utf-8-sig"
    with input_path.open("r", encoding=encoding) as handle:
        for line_no, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                raw = json.loads(line)
                row = OccurrenceV1.model_validate(raw)
            except Exception as exc:  # noqa: BLE001
                raise SystemExit(f"invalid occurrence at line {line_no}: {exc}") from exc
            yield row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--stage", choices=["extracted", "normalized", "deduplicated"], default="extracted")
    parser.add_argument("--rows-per-shard", type=int, default=250_000)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    if args.rows_per_shard < 1:
        parser.error("--rows-per-shard must be positive")

    if args.validate_only:
        count = 0
        source_id = None
        source_snapshot = None
        for row in iter_rows(args.input):
            count += 1
            source_id = source_id or row.source_id
            source_snapshot = source_snapshot or row.source_snapshot
            if row.source_id != source_id or row.source_snapshot != source_snapshot:
                raise SystemExit("a materialization batch must contain exactly one source_id and source_snapshot")
        if count == 0:
            raise SystemExit("refusing to validate an empty batch")
        print(json.dumps({"event": "occurrences-valid", "rows": count, "source_id": source_id, "source_snapshot": source_snapshot}))
        return 0

    try:
        import pyarrow as pa
        import pyarrow.parquet as pq
    except ImportError as exc:
        raise SystemExit("pyarrow is required; run with `uv run --with pydantic --with pyarrow ...`") from exc

    args.output_dir.mkdir(parents=True, exist_ok=True)
    rows_total = 0
    shard_no = 0
    shard_rows: list[dict[str, Any]] = []
    shards: list[ShardEntry] = []
    source_id = None
    source_snapshot = None

    def flush() -> None:
        nonlocal shard_no, shard_rows
        if not shard_rows:
            return
        filename = f"{args.stage}-{shard_no:05d}.parquet"
        path = args.output_dir / filename
        table = pa.Table.from_pylist(shard_rows)
        pq.write_table(table, path, compression="zstd", use_dictionary=True)
        shards.append(ShardEntry(file=filename, rows=len(shard_rows), bytes=path.stat().st_size, sha256=sha256_file(path)))
        shard_no += 1
        shard_rows = []

    for row in iter_rows(args.input):
        if source_id is None:
            source_id = row.source_id
            source_snapshot = row.source_snapshot
        elif row.source_id != source_id or row.source_snapshot != source_snapshot:
            raise SystemExit("a materialization batch must contain exactly one source_id and source_snapshot")
        shard_rows.append(row.model_dump(mode="json"))
        rows_total += 1
        if len(shard_rows) >= args.rows_per_shard:
            flush()
    flush()

    if not rows_total or source_id is None or source_snapshot is None:
        raise SystemExit("refusing to materialize an empty batch")

    manifest = Manifest(source_id=source_id, source_snapshot=source_snapshot, stage=args.stage, rows=rows_total, shards=shards)
    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest.model_dump(mode="json"), indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"event": "parquet-materialized", "manifest": str(manifest_path), "rows": rows_total, "shards": len(shards), "dataset_id": f"{sanitize(source_id)}-{sanitize(source_snapshot)}"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
