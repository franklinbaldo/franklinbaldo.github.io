#!/usr/bin/env python3
"""Publish a verified Parquet dataset item to Internet Archive without silent overwrite."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import time
import urllib.request
from pathlib import Path


def digest_file(path: Path, algorithm: str) -> str:
    digest = hashlib.new(algorithm)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sanitize(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-").lower()


def metadata(identifier: str) -> dict:
    with urllib.request.urlopen(f"https://archive.org/metadata/{identifier}", timeout=60) as response:
        return json.load(response)


def remote_files(meta: dict) -> dict[str, dict]:
    return {entry.get("name"): entry for entry in meta.get("files", []) if entry.get("name")}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--identifier")
    parser.add_argument("--ia-bin", default="ia")
    parser.add_argument("--title")
    parser.add_argument("--description", default="Scientific Equation Atlas Parquet snapshot")
    parser.add_argument("--verify-attempts", type=int, default=18)
    args = parser.parse_args()

    if not os.environ.get("IA_ACCESS_KEY_ID") or not os.environ.get("IA_SECRET_ACCESS_KEY"):
        raise SystemExit("IA_ACCESS_KEY_ID and IA_SECRET_ACCESS_KEY are required in the executor environment")

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    source_id = manifest["source_id"]
    snapshot = manifest["source_snapshot"]
    stage = manifest["stage"]
    if not args.identifier:
        clean_source = sanitize(source_id)
        hex_match = re.search(r"[0-9a-fA-F]{16,64}", snapshot)
        clean_snap = hex_match.group(0)[:16] if hex_match else sanitize(snapshot)[:16]
        clean_stage = sanitize(stage)
        raw_id = f"atlas-{clean_source}-{clean_snap}-{clean_stage}"
        if len(raw_id) > 80:
            raw_id = f"atlas-{clean_source[:30]}-{clean_snap[:16]}-{clean_stage[:10]}"
        identifier = raw_id
    else:
        identifier = args.identifier

    if len(identifier) > 80:
        raise SystemExit(f"Internet Archive identifier must be <= 80 chars, got {len(identifier)}: {identifier}")
    base = args.manifest.parent
    paths = [base / shard["file"] for shard in manifest["shards"]] + [args.manifest]
    expected = {
        path.name: {"size": path.stat().st_size, "md5": digest_file(path, "md5"), "sha256": digest_file(path, "sha256")}
        for path in paths
    }

    try:
        current = metadata(identifier)
    except Exception:
        current = {}
    existing = remote_files(current)
    for name, local in expected.items():
        if name not in existing:
            continue
        remote = existing[name]
        remote_size = int(remote.get("size", -1)) if str(remote.get("size", "")).isdigit() else -1
        remote_md5 = remote.get("md5")
        if remote_size != local["size"] or (remote_md5 and remote_md5 != local["md5"]):
            raise SystemExit(f"refusing silent overwrite: {identifier}/{name} already exists with different bytes")

    to_upload = [str(path) for path in paths if path.name not in existing]
    if to_upload:
        title = args.title or f"Scientific Equation Atlas — {source_id} — {snapshot} — {stage}"
        command = [
            args.ia_bin,
            "upload",
            identifier,
            *to_upload,
            "--retries",
            "10",
            "--metadata",
            "mediatype:data",
            "--metadata",
            f"title:{title}",
            "--metadata",
            "creator:Scientific Equation Atlas",
            "--metadata",
            f"description:{args.description}",
        ]
        subprocess.run(command, check=True)

    for attempt in range(1, args.verify_attempts + 1):
        files = remote_files(metadata(identifier))
        failures = []
        for name, local in expected.items():
            remote = files.get(name)
            if not remote:
                failures.append(f"missing:{name}")
                continue
            remote_size = int(remote.get("size", -1)) if str(remote.get("size", "")).isdigit() else -1
            if remote_size != local["size"]:
                failures.append(f"size:{name}")
            if remote.get("md5") and remote["md5"] != local["md5"]:
                failures.append(f"md5:{name}")
        if not failures:
            publication = {
                "identifier": identifier,
                "metadata_url": f"https://archive.org/metadata/{identifier}",
                "details_url": f"https://archive.org/details/{identifier}",
                "files": expected,
                "verified": True,
            }
            print(json.dumps(publication, indent=2, sort_keys=True))
            return 0
        if attempt < args.verify_attempts:
            time.sleep(min(attempt * 5, 20))

    raise SystemExit(f"Internet Archive verification did not converge for {identifier}")


if __name__ == "__main__":
    raise SystemExit(main())
