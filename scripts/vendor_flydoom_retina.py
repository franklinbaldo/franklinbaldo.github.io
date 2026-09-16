#!/usr/bin/env python3
"""Vendor the MaleCNS 1,771-column retinotopic geometry used by FlyDoom.

Downloads the small static columns.json asset from ZeroXClem/closed-loop-fly,
validates the scientific/provenance contract, and writes it into public/flydoom.
No third-party Python packages are required.
"""

from __future__ import annotations

import json
import pathlib
import urllib.request

SOURCE = (
    "https://raw.githubusercontent.com/ZeroXClem/closed-loop-fly/"
    "main/src/eye/columns.json"
)
DEST = pathlib.Path("public/flydoom/retinotopic_columns_1771.json")
EXPECTED_COUNT = 1771
EXPECTED_LICENSE = "CC BY 4.0"
EXPECTED_SOURCE_FRAGMENT = "AbijahKaj/fruit-fly-brain"


def main() -> None:
    with urllib.request.urlopen(SOURCE, timeout=30) as response:  # noqa: S310 - fixed trusted URL
        raw = response.read()

    payload = json.loads(raw)

    if payload.get("count") != EXPECTED_COUNT:
        raise SystemExit(
            f"unexpected retinotopic column count: {payload.get('count')} != {EXPECTED_COUNT}"
        )
    if EXPECTED_LICENSE not in payload.get("license", ""):
        raise SystemExit(f"unexpected data license: {payload.get('license')!r}")
    if EXPECTED_SOURCE_FRAGMENT not in payload.get("source", ""):
        raise SystemExit(f"unexpected data provenance: {payload.get('source')!r}")

    for field in ("side", "h1", "h2", "az", "el"):
        values = payload.get(field)
        if not isinstance(values, list) or len(values) != EXPECTED_COUNT:
            raise SystemExit(
                f"invalid {field}: expected list of length {EXPECTED_COUNT}, "
                f"got {type(values).__name__} length {len(values) if isinstance(values, list) else 'n/a'}"
            )

    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {DEST} ({DEST.stat().st_size:,} bytes)")
    print(f"source: {payload['source']}")
    print(f"license: {payload['license']}")


if __name__ == "__main__":
    main()
