#!/usr/bin/env python3
"""Build a deterministic SHA-256 inventory for a bulk source mirror.

The emitted JSON is content-addressed and contains no wall-clock fields, so the
same files at the same relative paths yield byte-identical output.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--glob", action="append", dest="globs", required=True)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        parser.error(f"root is not a directory: {root}")

    paths: set[Path] = set()
    for pattern in args.globs:
        paths.update(path for path in root.rglob(pattern) if path.is_file())
    ordered = sorted(paths, key=lambda path: path.relative_to(root).as_posix())
    if not ordered:
        raise SystemExit("refusing to create an empty source inventory")

    entries = []
    canonical = hashlib.sha256()
    total_bytes = 0
    for path in ordered:
        relative = path.relative_to(root).as_posix()
        size = path.stat().st_size
        digest = sha256_file(path)
        entries.append({"path": relative, "bytes": size, "sha256": digest})
        canonical.update(f"{relative}\0{size}\0{digest}\n".encode("utf-8"))
        total_bytes += size

    manifest = {
        "schema_version": 1,
        "manifest_type": "source-file-inventory",
        "source_id": args.source_id,
        "hash_algorithm": "sha256",
        "inventory_sha256": canonical.hexdigest(),
        "files": entries,
        "file_count": len(entries),
        "total_bytes": total_bytes,
    }
    encoded = json.dumps(manifest, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded, encoding="utf-8")
    else:
        print(encoded, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
