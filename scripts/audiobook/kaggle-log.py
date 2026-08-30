#!/usr/bin/env python3
"""Render a Kaggle kernel log (a JSON array of stream records) as plain text.

Kaggle only exposes a coarse kernel status; the actual traceback of a failed
run lives in this log, so the remote runner prints it before giving up.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: kaggle-log.py <kernel.log>", file=sys.stderr)
        return 2
    try:
        entries = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        print(f"unreadable kernel log: {error}", file=sys.stderr)
        return 1
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        stream = entry.get("stream_name", "?")
        data = str(entry.get("data", "")).rstrip()
        print(f"[{stream}] {data}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
