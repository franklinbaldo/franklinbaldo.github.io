#!/usr/bin/env python3
"""Extract explicit MediaWiki <math> tags from Wikimedia XML article dumps."""

from __future__ import annotations

import argparse
import bz2
import gzip
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator
from urllib.parse import quote

SOURCE_ID = "wikipedia-en-math-tags"
SOURCE_LICENSE = "CC-BY-SA-4.0-and-GFDL-with-imported-text-caveat"
SOURCE_LICENSE_URL = "https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use"
DEFAULT_WIKI_BASE = "https://en.wikipedia.org"

MATH_RE = re.compile(r"<math(?P<attrs>\s[^>]*)?>(?P<body>.*?)</math\s*>", re.IGNORECASE | re.DOTALL)
EXCLUDED_RE = re.compile(
    r"<!--.*?-->|<(?:nowiki|pre|source|syntaxhighlight|code)\b[^>]*>.*?</(?:nowiki|pre|source|syntaxhighlight|code)\s*>",
    re.IGNORECASE | re.DOTALL,
)
ATTR_RE = re.compile(r"([:\w.-]+)(?:\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s\"'=<>`]+)))?")


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


def parse_attrs(raw: str | None) -> dict[str, str | bool]:
    if not raw:
        return {}
    attrs: dict[str, str | bool] = {}
    for match in ATTR_RE.finditer(raw):
        name = match.group(1)
        value = match.group(2) or match.group(3) or match.group(4)
        attrs[name] = value if value is not None else True
    return attrs


def excluded_spans(text: str) -> list[tuple[int, int]]:
    return [(m.start(), m.end()) for m in EXCLUDED_RE.finditer(text)]


def inside_any(offset: int, spans: list[tuple[int, int]]) -> bool:
    return any(start <= offset < end for start, end in spans)


def collapse_context(text: str, start: int, end: int, radius: int) -> str:
    lo = max(0, start - radius)
    hi = min(len(text), end + radius)
    return " ".join(text[lo:hi].split())


@contextmanager
def open_dump(path: Path):
    if path.suffix.lower() == ".bz2":
        with bz2.open(path, "rb") as handle:
            yield handle
    elif path.suffix.lower() == ".gz":
        with gzip.open(path, "rb") as handle:
            yield handle
    else:
        with path.open("rb") as handle:
            yield handle


def iter_dump_files(root: Path) -> Iterator[Path]:
    if root.is_file():
        yield root
        return
    candidates = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        lower = path.name.lower()
        if lower.endswith(".xml") or lower.endswith(".xml.bz2") or lower.endswith(".xml.gz") or lower.endswith(".bz2"):
            candidates.append(path)
    yield from sorted(candidates)


def page_revision(page: ET.Element) -> ET.Element | None:
    revisions = [child for child in page if local_name(child.tag) == "revision"]
    return revisions[-1] if revisions else None


def emit_page(
    page: ET.Element,
    *,
    source_snapshot: str,
    relative_path: str,
    wiki_base: str,
    namespace: str | None,
    context_chars: int,
    metrics: dict[str, int],
) -> Iterator[dict]:
    metrics["pages_seen"] += 1
    title = child_text(page, "title") or ""
    ns = child_text(page, "ns") or ""
    page_id = child_text(page, "id") or ""

    if namespace is not None and ns != namespace:
        metrics["pages_skipped_namespace"] += 1
        return
    if first_child(page, "redirect") is not None:
        metrics["pages_skipped_redirect"] += 1
        return

    revision = page_revision(page)
    if revision is None:
        metrics["pages_without_revision"] += 1
        return
    metrics["revisions_seen"] += 1

    revision_id = child_text(revision, "id") or ""
    timestamp = child_text(revision, "timestamp") or ""
    revision_sha1 = child_text(revision, "sha1") or ""
    text_elem = first_child(revision, "text")
    text = text_elem.text if text_elem is not None and text_elem.text is not None else ""
    if not text:
        metrics["pages_without_text"] += 1
        return

    spans = excluded_spans(text)
    ordinal = 0
    for match in MATH_RE.finditer(text):
        metrics["math_tags_seen"] += 1
        if inside_any(match.start(), spans):
            metrics["math_tags_skipped_literal_region"] += 1
            continue
        body = match.group("body")
        if not body.strip():
            metrics["math_tags_empty"] += 1
            continue

        ordinal += 1
        raw_tag = match.group(0)
        normalized_text = " ".join(body.split())
        locator = f"page:{page_id};revision:{revision_id};math:{ordinal}"
        record_key = "\u001f".join([SOURCE_ID, page_id, revision_id, str(ordinal), body])
        oldid_url = f"{wiki_base.rstrip('/')}/w/index.php?oldid={quote(revision_id)}" if revision_id else None
        page_url = f"{wiki_base.rstrip('/')}/wiki/{quote(title.replace(' ', '_'), safe='/:()')}" if title else None

        row = {
            "schema_version": 1,
            "source_id": SOURCE_ID,
            "source_snapshot": source_snapshot,
            "provenance_class": "attested",
            "expression_original": body,
            "expression_encoding": "mediawiki-math-tex",
            "source_record_sha256": sha256_text(record_key),
            "expression_sha256": sha256_text(body),
            "normalized_text": normalized_text,
            "normalized_text_sha256": sha256_text(normalized_text),
            "source_document_id": f"page:{page_id}:revision:{revision_id}",
            "source_document_url": oldid_url or page_url,
            "source_locator": locator,
            "source_license": SOURCE_LICENSE,
            "source_license_url": SOURCE_LICENSE_URL,
            "context_text": collapse_context(text, match.start(), match.end(), context_chars),
            "source_page_title": title,
            "source_page_id": page_id,
            "source_namespace": ns,
            "source_revision_id": revision_id,
            "source_revision_timestamp": timestamp,
            "source_revision_sha1": revision_sha1,
            "source_page_url": page_url,
            "source_dump_relative_path": relative_path,
            "source_attested_payload": {
                "raw_math_tag": raw_tag,
                "attributes": parse_attrs(match.group("attrs")),
                "body_exact": body,
                "body_was_reconstructed": False,
            },
        }
        metrics["records_written"] += 1
        yield row


def process_file(
    path: Path,
    *,
    root: Path,
    source_snapshot: str,
    wiki_base: str,
    namespace: str | None,
    context_chars: int,
    metrics: dict[str, int],
) -> Iterator[dict]:
    metrics["files_seen"] += 1
    relative_path = path.name if root.is_file() else path.relative_to(root).as_posix()
    try:
        with open_dump(path) as handle:
            context = ET.iterparse(handle, events=("start", "end"))
            _, root_elem = next(context)
            for event, elem in context:
                if event != "end" or local_name(elem.tag) != "page":
                    continue
                yield from emit_page(
                    elem,
                    source_snapshot=source_snapshot,
                    relative_path=relative_path,
                    wiki_base=wiki_base,
                    namespace=namespace,
                    context_chars=context_chars,
                    metrics=metrics,
                )
                elem.clear()
                root_elem.clear()
        metrics["files_parsed"] += 1
    except (OSError, EOFError, ET.ParseError) as exc:
        metrics["files_rejected"] += 1
        print(json.dumps({"event": "file-rejected", "path": str(path), "error": str(exc)}, sort_keys=True), file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", required=True, type=Path, help="Wikimedia XML dump file or directory of dump parts")
    parser.add_argument("--snapshot", required=True, help="Content-addressed dump snapshot identifier")
    parser.add_argument("--wiki-base", default=DEFAULT_WIKI_BASE)
    parser.add_argument("--namespace", default="0", help="MediaWiki namespace to harvest; default 0 (articles)")
    parser.add_argument("--all-namespaces", action="store_true")
    parser.add_argument("--context-chars", type=int, default=240)
    args = parser.parse_args()

    if not args.dump.exists():
        parser.error(f"dump path does not exist: {args.dump}")
    if args.context_chars < 0:
        parser.error("--context-chars must be non-negative")

    metrics = {
        "files_seen": 0,
        "files_parsed": 0,
        "files_rejected": 0,
        "pages_seen": 0,
        "pages_skipped_namespace": 0,
        "pages_skipped_redirect": 0,
        "pages_without_revision": 0,
        "pages_without_text": 0,
        "revisions_seen": 0,
        "math_tags_seen": 0,
        "math_tags_skipped_literal_region": 0,
        "math_tags_empty": 0,
        "records_written": 0,
    }
    namespace = None if args.all_namespaces else args.namespace
    for path in iter_dump_files(args.dump):
        for row in process_file(
            path,
            root=args.dump,
            source_snapshot=args.snapshot,
            wiki_base=args.wiki_base,
            namespace=namespace,
            context_chars=args.context_chars,
            metrics=metrics,
        ):
            print(json.dumps(row, ensure_ascii=False, sort_keys=True))

    print(json.dumps({"event": "harvest-complete", **metrics}, sort_keys=True), file=sys.stderr)
    if metrics["files_seen"] == 0:
        return 2
    if metrics["files_parsed"] == 0:
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
