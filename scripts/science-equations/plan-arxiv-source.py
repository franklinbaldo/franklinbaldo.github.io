#!/usr/bin/env python3
"""Build a deterministic acquisition plan from arXiv's official source manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
import xml.etree.ElementTree as ET
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def child_text(node: ET.Element, name: str) -> str | None:
    child = node.find(name)
    if child is None or child.text is None:
        return None
    return child.text.strip()


def parse_manifest(path: Path) -> list[dict]:
    root = ET.parse(path).getroot()
    chunks: list[dict] = []
    for file_node in root.findall(".//file"):
        filename = child_text(file_node, "filename")
        if not filename:
            continue
        entry = {
            "filename": filename,
            "yymm": child_text(file_node, "yymm"),
            "seq_num": int(child_text(file_node, "seq_num") or 0),
            "size": int(child_text(file_node, "size") or 0),
            "num_items": int(child_text(file_node, "num_items") or 0),
            "md5sum": child_text(file_node, "md5sum"),
            "content_md5sum": child_text(file_node, "content_md5sum"),
            "first_item": child_text(file_node, "first_item"),
            "last_item": child_text(file_node, "last_item"),
            "timestamp": child_text(file_node, "timestamp"),
        }
        chunks.append(entry)
    return sorted(chunks, key=lambda row: row["filename"])


def canonical_sha256(value: object) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--yymm", action="append", default=[])
    args = parser.parse_args()

    chunks = parse_manifest(args.manifest)
    if args.yymm:
        selected = [row for row in chunks if row["yymm"] in set(args.yymm)]
    else:
        selected = chunks
    if not selected:
        raise SystemExit("no arXiv source chunks matched the requested selection")

    selection_sha256 = canonical_sha256(selected)
    result = {
        "schema_version": 1,
        "source_id": "arxiv-source-tex-math",
        "official_manifest": "s3://arxiv/src/arXiv_src_manifest.xml",
        "manifest_sha256": sha256_file(args.manifest),
        "selection": {
            "yymm": sorted(set(args.yymm)) if args.yymm else ["all"],
            "chunk_count": len(selected),
            "total_bytes": sum(row["size"] for row in selected),
            "total_items_reported": sum(row["num_items"] for row in selected),
            "selection_sha256": selection_sha256,
            "source_snapshot_component": f"src-selection-sha256:{selection_sha256}",
        },
        "chunks": selected,
        "verification": {
            "download_rule": "download via official requester-pays S3 bucket and verify size + md5sum before processing",
            "local_sha256_rule": "compute and persist SHA-256 for every downloaded source chunk in the run manifest before extraction",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "event": "arxiv-source-plan",
        "output": str(args.output),
        "chunks": len(selected),
        "items_reported": result["selection"]["total_items_reported"],
        "selection_sha256": selection_sha256,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
