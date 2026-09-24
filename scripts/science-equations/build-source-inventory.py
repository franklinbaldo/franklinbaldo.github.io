#!/usr/bin/env python3
"""Build a deterministic SHA-256 inventory for a local bulk-source mirror."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_bytes(entries: list[dict]) -> bytes:
    return json.dumps(entries, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def build_inventory(root: Path, patterns: list[str], source_id: str) -> dict:
    root = root.resolve()
    if not root.is_dir():
        raise ValueError(f"root is not a directory: {root}")

    paths: set[Path] = set()
    for pattern in patterns:
        paths.update(path for path in root.rglob(pattern) if path.is_file())
    ordered = sorted(paths, key=lambda path: path.relative_to(root).as_posix())
    if not ordered:
        raise ValueError("inventory would be empty")

    files = [
        {
            "path": path.relative_to(root).as_posix(),
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        }
        for path in ordered
    ]
    digest = hashlib.sha256(canonical_bytes(files)).hexdigest()
    return {
        "schema_version": 1,
        "source_id": source_id,
        "snapshot": f"inventory-sha256:{digest}",
        "inventory_sha256": digest,
        "file_count": len(files),
        "total_bytes": sum(item["bytes"] for item in files),
        "files": files,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--glob", action="append", dest="patterns", required=True)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    try:
        inventory = build_inventory(args.root, args.patterns, args.source_id)
    except ValueError as exc:
        parser.error(str(exc))

    rendered = json.dumps(inventory, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
