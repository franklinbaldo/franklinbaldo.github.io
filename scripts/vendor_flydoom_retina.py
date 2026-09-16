#!/usr/bin/env python3
"""Vendor the pinned MaleCNS 1,771-column retinotopic geometry used by FlyDoom."""

from __future__ import annotations

import hashlib
import json
import pathlib
import urllib.request

SOURCE = (
    "https://raw.githubusercontent.com/ZeroXClem/closed-loop-fly/"
    "main/src/eye/columns.json"
)
DEST = pathlib.Path("public/flydoom/retinotopic_columns_1771.json")
PINNED_SHA256 = "5527bc4e5cc36901f2d88b6949e97272563e42b8252e4b4adf82b2b1e3315959"


def main() -> None:
    with urllib.request.urlopen(SOURCE, timeout=30) as response:  # noqa: S310 - fixed trusted URL
        raw = response.read()

    # Canonicalize exactly as the vendored asset is stored, then verify the pinned bytes.
    payload = json.loads(raw)
    canonical = (json.dumps(payload, separators=(",", ":")) + "\n").encode("utf-8")
    digest = hashlib.sha256(canonical).hexdigest()
    if digest != PINNED_SHA256:
        raise SystemExit(f"unexpected retina asset sha256: {digest} != {PINNED_SHA256}")

    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_bytes(canonical)
    print(f"wrote {DEST} ({len(canonical):,} bytes, sha256={digest})")


if __name__ == "__main__":
    main()
