#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "internetarchive>=4",
#   "pyarrow>=18",
#   "requests>=2.32",
# ]
# ///
"""Materialize Scientific Equation Atlas JSONL occurrences as Parquet and publish them to Internet Archive.

JSONL is accepted only as a transient streaming interchange from harvesters. The
persistent bulk artifact is immutable, ZSTD-compressed Parquet. A materialization
is only considered published when every Parquet shard and the generated manifest
have been uploaded to an Internet Archive item and verified against Archive.org
file metadata.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, TextIO

import internetarchive
import pyarrow as pa
import pyarrow.parquet as pq
import requests

SCHEMA_VERSION = 1
STORAGE_CONTRACT = "scientific-equation-atlas-parquet-ia-v1"

SCHEMA = pa.schema(
    [
        pa.field("schema_version", pa.int16(), nullable=False),
        pa.field("source_id", pa.string()),
        pa.field("source_snapshot", pa.string()),
        pa.field("source_document_id", pa.string()),
        pa.field("source_entity_id", pa.string()),
        pa.field("source_path", pa.string()),
        pa.field("source_line", pa.int64()),
        pa.field("source_statement_id", pa.string()),
        pa.field("source_field", pa.string()),
        pa.field("source_url", pa.string()),
        pa.field("source_document_url", pa.string()),
        pa.field("source_record_url", pa.string()),
        pa.field("source_license", pa.string()),
        pa.field("source_license_url", pa.string()),
        pa.field("source_policy_url", pa.string()),
        pa.field("original_expression", pa.string()),
        pa.field("original_encoding", pa.string()),
        pa.field("provenance_class", pa.string()),
        pa.field("source_record_sha256", pa.string()),
        pa.field("original_text_sha256", pa.string()),
        pa.field("normalized_text_sha256", pa.string()),
        pa.field("payload_json", pa.large_string(), nullable=False),
    ]
)


@dataclass
class Shard:
    path: Path
    rows: int
    sha256: str
    md5: str
    size_bytes: int


def digest_file(path: Path, algorithm: str) -> str:
    digest = hashlib.new(algorithm)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def slug(value: str, max_length: int = 48) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return (normalized or "snapshot")[:max_length].rstrip("-")


def as_text(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def canonical_payload(record: dict[str, object]) -> str:
    return json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def parquet_row(record: dict[str, object]) -> dict[str, object]:
    line = record.get("source_line")
    source_line = line if isinstance(line, int) and not isinstance(line, bool) else None
    return {
        "schema_version": SCHEMA_VERSION,
        "source_id": as_text(record.get("source_id")),
        "source_snapshot": as_text(record.get("source_snapshot")),
        "source_document_id": as_text(record.get("source_document_id")),
        "source_entity_id": as_text(record.get("source_entity_id")),
        "source_path": as_text(record.get("source_path")),
        "source_line": source_line,
        "source_statement_id": as_text(record.get("source_statement_id")),
        "source_field": as_text(record.get("source_field")),
        "source_url": as_text(record.get("source_url")),
        "source_document_url": as_text(record.get("source_document_url")),
        "source_record_url": as_text(record.get("source_record_url")),
        "source_license": as_text(record.get("source_license")),
        "source_license_url": as_text(record.get("source_license_url")),
        "source_policy_url": as_text(record.get("source_policy_url")),
        "original_expression": as_text(record.get("original_expression")),
        "original_encoding": as_text(record.get("original_encoding")),
        "provenance_class": as_text(record.get("provenance_class")),
        "source_record_sha256": as_text(record.get("source_record_sha256")),
        "original_text_sha256": as_text(record.get("original_text_sha256")),
        "normalized_text_sha256": as_text(record.get("normalized_text_sha256")),
        "payload_json": canonical_payload(record),
    }


def iter_jsonl(stream: TextIO) -> Iterable[dict[str, object]]:
    for line_number, line in enumerate(stream, start=1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"invalid JSONL at input line {line_number}: {exc}") from exc
        if not isinstance(record, dict):
            raise ValueError(f"input line {line_number} is not a JSON object")
        yield record


def finalize_shard(path: Path, rows: int) -> Shard:
    return Shard(
        path=path,
        rows=rows,
        sha256=digest_file(path, "sha256"),
        md5=digest_file(path, "md5"),
        size_bytes=path.stat().st_size,
    )


def materialize(
    records: Iterable[dict[str, object]],
    *,
    source_id: str,
    snapshot: str,
    output_dir: Path,
    rows_per_shard: int,
    batch_rows: int,
) -> tuple[list[Shard], int]:
    output_dir.mkdir(parents=True, exist_ok=True)
    source_slug = slug(source_id)
    snapshot_slug = slug(snapshot)

    shards: list[Shard] = []
    writer: pq.ParquetWriter | None = None
    shard_path: Path | None = None
    shard_rows = 0
    total_rows = 0
    buffer: list[dict[str, object]] = []

    def open_writer() -> None:
        nonlocal writer, shard_path, shard_rows
        shard_path = output_dir / f"{source_slug}-{snapshot_slug}-part-{len(shards):05d}.parquet"
        writer = pq.ParquetWriter(
            shard_path,
            SCHEMA,
            compression="zstd",
            use_dictionary=True,
            write_statistics=True,
        )
        shard_rows = 0

    def close_writer() -> None:
        nonlocal writer, shard_path, shard_rows
        if writer is None or shard_path is None:
            return
        writer.close()
        shards.append(finalize_shard(shard_path, shard_rows))
        writer = None
        shard_path = None
        shard_rows = 0

    def flush_buffer() -> None:
        nonlocal buffer, shard_rows, total_rows
        while buffer:
            if writer is None:
                open_writer()
            remaining = rows_per_shard - shard_rows
            chunk = buffer[:remaining]
            del buffer[:remaining]
            table = pa.Table.from_pylist(chunk, schema=SCHEMA)
            assert writer is not None
            writer.write_table(table, row_group_size=min(len(chunk), batch_rows))
            shard_rows += len(chunk)
            total_rows += len(chunk)
            if shard_rows >= rows_per_shard:
                close_writer()

    try:
        for record in records:
            record_source = record.get("source_id")
            record_snapshot = record.get("source_snapshot")
            if record_source is not None and record_source != source_id:
                raise ValueError(f"record source_id {record_source!r} != requested {source_id!r}")
            if record_snapshot is not None and record_snapshot != snapshot:
                raise ValueError(f"record source_snapshot {record_snapshot!r} != requested {snapshot!r}")
            buffer.append(parquet_row(record))
            if len(buffer) >= batch_rows:
                flush_buffer()
        flush_buffer()
        close_writer()
    except Exception:
        if writer is not None:
            writer.close()
        raise

    if total_rows == 0:
        raise ValueError("refusing to publish an empty acquisition")
    return shards, total_rows


def auth_available() -> bool:
    try:
        session = internetarchive.get_session()
        return bool(getattr(session, "access_key", None) and getattr(session, "secret_key", None))
    except Exception:
        return False


def archive_metadata(identifier: str) -> dict[str, object]:
    response = requests.get(f"https://archive.org/metadata/{identifier}", timeout=60)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise RuntimeError("Archive.org metadata response was not an object")
    return payload


def verify_remote_files(identifier: str, files: Iterable[Shard], manifest_path: Path) -> None:
    payload = archive_metadata(identifier)
    remote = {
        entry.get("name"): entry
        for entry in payload.get("files", [])
        if isinstance(entry, dict) and isinstance(entry.get("name"), str)
    }

    expected = [(shard.path, shard.md5, shard.size_bytes) for shard in files]
    expected.append((manifest_path, digest_file(manifest_path, "md5"), manifest_path.stat().st_size))
    problems: list[str] = []
    for path, md5, size in expected:
        info = remote.get(path.name)
        if not info:
            problems.append(f"missing:{path.name}")
            continue
        if str(info.get("size")) != str(size):
            problems.append(f"size:{path.name}")
        if info.get("md5") != md5:
            problems.append(f"md5:{path.name}")
    if problems:
        raise RuntimeError("Internet Archive verification failed: " + ", ".join(problems))


def build_manifest(
    *,
    source_id: str,
    snapshot: str,
    item_id: str,
    shards: list[Shard],
    total_rows: int,
    published: bool,
) -> dict[str, object]:
    return {
        "schema_version": 1,
        "storage_contract": STORAGE_CONTRACT,
        "source_id": source_id,
        "source_snapshot": snapshot,
        "format": "parquet",
        "compression": "zstd",
        "schema_fingerprint_sha256": hashlib.sha256(SCHEMA.to_string().encode()).hexdigest(),
        "row_count": total_rows,
        "internet_archive": {
            "identifier": item_id,
            "details_url": f"https://archive.org/details/{item_id}",
            "metadata_url": f"https://archive.org/metadata/{item_id}",
            "published": published,
            "verified": published,
        },
        "files": [
            {
                "name": shard.path.name,
                "rows": shard.rows,
                "bytes": shard.size_bytes,
                "sha256": shard.sha256,
                "md5": shard.md5,
            }
            for shard in shards
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def write_manifest(path: Path, payload: dict[str, object]) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def publish_to_archive(
    *,
    item_id: str,
    source_id: str,
    snapshot: str,
    shards: list[Shard],
    manifest_path: Path,
    retries: int,
) -> None:
    if not auth_available():
        raise RuntimeError(
            "Internet Archive IA-S3 credentials are not configured. Configure the internetarchive client or provide its supported IA-S3 credentials outside Git; never commit them."
        )
    item = internetarchive.get_item(item_id)
    metadata = {
        "title": f"Scientific Equation Atlas — {source_id} — {snapshot}",
        "mediatype": "data",
        "creator": "Scientific Equation Atlas",
        "description": (
            "Immutable Parquet acquisition for the Scientific Equation Atlas. "
            "See the uploaded manifest for source snapshot, row counts and checksums."
        ),
    }
    item.upload(
        [str(shard.path) for shard in shards],
        metadata=metadata,
        checksum=True,
        verify=True,
        retries=retries,
        queue_derive=False,
    )
    item.upload(
        str(manifest_path),
        checksum=True,
        verify=True,
        retries=retries,
        queue_derive=False,
    )


def self_test() -> None:
    sample = [
        {
            "source_id": "fixture",
            "source_snapshot": "fixture-v1",
            "source_document_id": "A000001",
            "source_line": 10,
            "original_expression": "a(n)=1",
            "original_encoding": "fixture",
            "provenance_class": "attested",
        },
        {
            "source_id": "fixture",
            "source_snapshot": "fixture-v1",
            "source_document_id": "A000002",
            "source_line": 20,
            "original_expression": "a(n)=n+1",
            "original_encoding": "fixture",
            "provenance_class": "attested",
        },
        {
            "source_id": "fixture",
            "source_snapshot": "fixture-v1",
            "source_document_id": "A000003",
            "source_line": 30,
            "original_expression": "a(n)=2n",
            "original_encoding": "fixture",
            "provenance_class": "attested",
        },
    ]
    with tempfile.TemporaryDirectory() as temp_dir:
        shards, total = materialize(
            iter(sample),
            source_id="fixture",
            snapshot="fixture-v1",
            output_dir=Path(temp_dir),
            rows_per_shard=2,
            batch_rows=2,
        )
        assert total == 3
        assert [shard.rows for shard in shards] == [2, 1]
        table = pa.concat_tables([pq.read_table(shard.path) for shard in shards])
        assert table.num_rows == 3
        assert table.column("original_expression").to_pylist() == ["a(n)=1", "a(n)=n+1", "a(n)=2n"]
        assert all(shard.sha256 and shard.md5 for shard in shards)
    print("parquet-materializer-self-test: ok")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-id")
    parser.add_argument("--snapshot")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--item-id")
    parser.add_argument("--rows-per-shard", type=int, default=250_000)
    parser.add_argument("--batch-rows", type=int, default=5_000)
    parser.add_argument("--retries", type=int, default=10)
    parser.add_argument("--publish", action="store_true", help="upload and verify shards on Internet Archive")
    parser.add_argument("--local-only", action="store_true", help="materialize Parquet without publication; for fixtures/debugging only")
    parser.add_argument("--check-ia-auth", action="store_true", help="check whether IA-S3 credentials are configured without printing them")
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.self_test:
        self_test()
        return
    if args.check_ia_auth:
        print(json.dumps({"ia_s3_configured": auth_available()}))
        raise SystemExit(0 if auth_available() else 2)

    missing = [name for name in ("source_id", "snapshot", "output_dir") if getattr(args, name) in (None, "")]
    if missing:
        raise SystemExit("missing required arguments: " + ", ".join(f"--{name.replace('_', '-')}" for name in missing))
    if args.publish == args.local_only:
        raise SystemExit("choose exactly one of --publish or --local-only")
    if args.rows_per_shard < 1 or args.batch_rows < 1:
        raise SystemExit("--rows-per-shard and --batch-rows must be positive")

    item_id = args.item_id or f"scientific-equation-atlas-{slug(args.source_id)}-{slug(args.snapshot, 24)}"
    shards, total_rows = materialize(
        iter_jsonl(sys.stdin),
        source_id=args.source_id,
        snapshot=args.snapshot,
        output_dir=args.output_dir,
        rows_per_shard=args.rows_per_shard,
        batch_rows=args.batch_rows,
    )
    manifest_path = args.output_dir / f"{slug(args.source_id)}-{slug(args.snapshot)}-manifest.json"

    manifest = build_manifest(
        source_id=args.source_id,
        snapshot=args.snapshot,
        item_id=item_id,
        shards=shards,
        total_rows=total_rows,
        published=False,
    )
    write_manifest(manifest_path, manifest)

    if args.publish:
        publish_to_archive(
            item_id=item_id,
            source_id=args.source_id,
            snapshot=args.snapshot,
            shards=shards,
            manifest_path=manifest_path,
            retries=args.retries,
        )
        manifest = build_manifest(
            source_id=args.source_id,
            snapshot=args.snapshot,
            item_id=item_id,
            shards=shards,
            total_rows=total_rows,
            published=True,
        )
        write_manifest(manifest_path, manifest)
        item = internetarchive.get_item(item_id)
        item.upload(
            str(manifest_path),
            checksum=True,
            verify=True,
            retries=args.retries,
            queue_derive=False,
        )
        verify_remote_files(item_id, shards, manifest_path)

    print(json.dumps({"event": "materialize-complete", **manifest}, ensure_ascii=False))


if __name__ == "__main__":
    main()
