#!/usr/bin/env python3
"""Stream attested <math> expressions from Wikimedia pages-articles XML dumps."""
from __future__ import annotations

import argparse
import bz2
import gzip
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import IO
from urllib.parse import quote

MATH_RE = re.compile(r"<math(?P<attrs>\s[^>]*)?>(?P<body>.*?)</math\s*>", re.IGNORECASE | re.DOTALL)
WS_RE = re.compile(r"\s+")


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def child_text(parent: ET.Element, name: str) -> str | None:
    for child in parent:
        if local_name(child.tag) == name:
            return child.text
    return None


def first_child(parent: ET.Element, name: str) -> ET.Element | None:
    for child in parent:
        if local_name(child.tag) == name:
            return child
    return None


def open_xml(path: Path) -> IO[bytes]:
    if path.suffix == ".bz2":
        return bz2.open(path, "rb")
    if path.suffix == ".gz":
        return gzip.open(path, "rb")
    return path.open("rb")


def normalize_whitespace(value: str) -> str:
    return WS_RE.sub(" ", value).strip()


def emit_page(
    page: ET.Element,
    *,
    snapshot: str,
    namespace: int,
    context_chars: int,
    source_path: str,
) -> tuple[int, int]:
    ns_text = child_text(page, "ns")
    try:
        page_ns = int(ns_text or "0")
    except ValueError:
        return 0, 1
    if page_ns != namespace:
        return 0, 0

    title = child_text(page, "title") or ""
    page_id = child_text(page, "id") or ""
    revision = first_child(page, "revision")
    if revision is None:
        return 0, 1

    revision_id = child_text(revision, "id") or ""
    revision_timestamp = child_text(revision, "timestamp") or None
    revision_sha1 = child_text(revision, "sha1") or None
    text_el = first_child(revision, "text")
    text = text_el.text if text_el is not None and text_el.text is not None else ""
    if not text:
        return 0, 0

    emitted = 0
    for index, match in enumerate(MATH_RE.finditer(text), 1):
        expression = match.group("body")
        if not expression.strip():
            continue
        normalized = normalize_whitespace(expression)
        start, end = match.span()
        context_start = max(0, start - context_chars)
        context_end = min(len(text), end + context_chars)
        context = text[context_start:context_end]
        record_identity = "\n".join(
            [snapshot, source_path, page_id, revision_id, str(index), match.group(0)]
        )
        document_id = f"enwiki:{page_id}:{revision_id}"
        oldid_url = (
            f"https://en.wikipedia.org/w/index.php?oldid={quote(revision_id)}"
            if revision_id
            else None
        )
        row = {
            "schema_version": 1,
            "source_id": "wikipedia-en-math",
            "source_snapshot": snapshot,
            "provenance_class": "attested",
            "expression_original": expression,
            "expression_encoding": "mediawiki-math-tex",
            "source_record_sha256": sha256_text(record_identity),
            "expression_sha256": sha256_text(expression),
            "normalized_text": normalized,
            "normalized_text_sha256": sha256_text(normalized),
            "source_document_id": document_id,
            "source_document_url": oldid_url,
            "source_locator": f"page:{page_id}/revision:{revision_id}/math:{index}@chars:{start}-{end}",
            "source_license": "CC-BY-SA-4.0-or-compatible-and/or-GFDL",
            "source_license_url": "https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use",
            "context_text": context,
            "page_title": title,
            "page_id": page_id,
            "revision_id": revision_id,
            "revision_timestamp": revision_timestamp,
            "revision_sha1": revision_sha1,
            "namespace": page_ns,
            "math_tag_attributes": (match.group("attrs") or "").strip() or None,
            "source_file": source_path,
            "context_encoding": "mediawiki-wikitext",
        }
        print(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
        emitted += 1
    return emitted, 0


def harvest(
    path: Path,
    *,
    snapshot: str,
    namespace: int,
    context_chars: int,
) -> dict[str, int]:
    stats = {"pages": 0, "occurrences": 0, "malformed_pages": 0}
    with open_xml(path) as handle:
        for _event, elem in ET.iterparse(handle, events=("end",)):
            if local_name(elem.tag) != "page":
                continue
            stats["pages"] += 1
            emitted, malformed = emit_page(
                elem,
                snapshot=snapshot,
                namespace=namespace,
                context_chars=context_chars,
                source_path=path.name,
            )
            stats["occurrences"] += emitted
            stats["malformed_pages"] += malformed
            elem.clear()
    return stats


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, nargs="+", type=Path)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--namespace", type=int, default=0)
    parser.add_argument("--context-chars", type=int, default=320)
    args = parser.parse_args()
    if args.context_chars < 0:
        parser.error("--context-chars must be >= 0")

    total = {"files": 0, "pages": 0, "occurrences": 0, "malformed_pages": 0}
    for path in args.input:
        if not path.is_file():
            parser.error(f"input does not exist: {path}")
        stats = harvest(
            path,
            snapshot=args.snapshot,
            namespace=args.namespace,
            context_chars=args.context_chars,
        )
        total["files"] += 1
        for key in ("pages", "occurrences", "malformed_pages"):
            total[key] += stats[key]

    print(
        json.dumps(
            {"event": "wikimedia-math-harvest", "source_snapshot": args.snapshot, **total}
        ),
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
