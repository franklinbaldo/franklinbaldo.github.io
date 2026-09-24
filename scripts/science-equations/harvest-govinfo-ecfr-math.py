#!/usr/bin/env python3
"""Harvest attested eCFR <MATH> blocks into Atlas occurrence JSONL.

The eCFR XML commonly represents MathType equations as <MATH> elements that
reference a graphic. This adapter preserves the exact XML wrapper and graphic
references as the attested source artifact; it does not OCR or reconstruct the
formula text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any
from urllib.parse import quote

SOURCE_ID = "govinfo-ecfr-math-blocks"
DEFAULT_SOURCE_ROOT = "https://www.govinfo.gov/bulkdata/ECFR"
SOURCE_LICENSE = "US-Government-Work-with-third-party-caveat"
SOURCE_LICENSE_URL = "https://www.govinfo.gov/about/policies"


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def collapse_text(element: ET.Element) -> str:
    return re.sub(r"\s+", " ", "".join(element.itertext())).strip()


def containing_section(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
) -> ET.Element | None:
    current = parents.get(element)
    while current is not None:
        if local_name(current.tag).upper() in {"DIV8", "SECTION"}:
            node_type = current.attrib.get("TYPE", "").upper()
            if node_type == "SECTION" or local_name(current.tag).upper() == "SECTION":
                return current
        current = parents.get(current)
    return None


def first_descendant_text(element: ET.Element | None, names: set[str]) -> str | None:
    if element is None:
        return None
    wanted = {name.upper() for name in names}
    for child in element.iter():
        if local_name(child.tag).upper() not in wanted:
            continue
        text = collapse_text(child)
        if text:
            return text
    return None


def document_title(root: ET.Element) -> str | None:
    for element in root.iter():
        if local_name(element.tag).upper() != "TITLE":
            continue
        text = collapse_text(element)
        if text:
            return text
    return None


def title_number(title: str | None, root: ET.Element) -> str | None:
    if title:
        match = re.search(r"\bTitle\s+(\d+)\b", title, re.IGNORECASE)
        if match:
            return match.group(1)
    for element in root.iter():
        value = element.attrib.get("N") or element.attrib.get("TITLE")
        if value and str(value).isdigit():
            return str(value)
    return None


def sibling_context(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
    *,
    before: int = 2,
    after: int = 6,
    max_chars: int = 3000,
) -> str | None:
    parent = parents.get(element)
    if parent is None:
        return None
    children = list(parent)
    try:
        index = children.index(element)
    except ValueError:
        return None
    parts: list[str] = []
    for child in children[max(0, index - before) : min(len(children), index + after + 1)]:
        if child is element:
            continue
        text = collapse_text(child)
        if text:
            parts.append(text)
    if not parts:
        return None
    value = " | ".join(parts)
    return value[:max_chars]


def relative_url(source_root: str, relative_path: str) -> str:
    encoded = "/".join(quote(part) for part in Path(relative_path).parts)
    return f"{source_root.rstrip('/')}/{encoded}"


def canonical_record_payload(
    *,
    relative_path: str,
    locator: str,
    math_xml: str,
) -> str:
    payload = {
        "relative_path": relative_path,
        "locator": locator,
        "math_xml": math_xml,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def extract_file(
    path: Path,
    *,
    mirror: Path,
    snapshot: str,
    source_root: str,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    tree = ET.parse(path)
    root = tree.getroot()
    parents = {child: parent for parent in root.iter() for child in parent}
    title = document_title(root)
    cfr_title = title_number(title, root)
    relative_path = path.relative_to(mirror).as_posix()
    document_url = relative_url(source_root, relative_path)
    records: list[dict[str, Any]] = []
    counters = {"math_seen": 0, "math_without_payload": 0, "math_image_backed": 0}

    for math_index, element in enumerate(
        (item for item in root.iter() if local_name(item.tag).upper() == "MATH"),
        start=1,
    ):
        counters["math_seen"] += 1
        math_xml = ET.tostring(element, encoding="unicode", short_empty_elements=True).strip()
        images = [
            child.attrib.get("src", "").strip()
            for child in element.iter()
            if local_name(child.tag).lower() == "img" and child.attrib.get("src", "").strip()
        ]
        text = collapse_text(element)
        if not images and not text and not element.attrib:
            counters["math_without_payload"] += 1
            continue
        if images:
            counters["math_image_backed"] += 1

        section = containing_section(element, parents)
        section_head = first_descendant_text(section, {"HEAD", "HED", "HED1"})
        section_node = None if section is None else section.attrib.get("NODE")
        section_n = None if section is None else section.attrib.get("N")
        locator_base = section_node or section_n or "document"
        locator = f"{locator_base}/MATH[{math_index}]"
        context = sibling_context(element, parents)
        source_payload = canonical_record_payload(
            relative_path=relative_path,
            locator=locator,
            math_xml=math_xml,
        )

        records.append(
            {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": math_xml,
                "expression_encoding": "ecfr-math-element+xml",
                "source_record_sha256": sha256_text(source_payload),
                "expression_sha256": sha256_text(math_xml),
                "normalized_text": None,
                "normalized_text_sha256": None,
                "source_document_id": relative_path,
                "source_document_url": document_url,
                "source_locator": locator,
                "source_license": SOURCE_LICENSE,
                "source_license_url": SOURCE_LICENSE_URL,
                "source_policy_url": SOURCE_LICENSE_URL,
                "source_title": title,
                "source_cfr_title": cfr_title,
                "source_section": section_head,
                "source_attested_payload": {
                    "relative_path": relative_path,
                    "math_attributes": dict(sorted(element.attrib.items())),
                    "graphic_sources": images,
                    "section_node": section_node,
                    "section_n": section_n,
                    "ocr_performed": False,
                    "reconstruction_performed": False,
                },
                "context_text": context or section_head or title,
            }
        )

    return records, counters


def iter_xml_files(mirror: Path):
    if mirror.is_file():
        yield mirror
        return
    for path in sorted(mirror.rglob("*.xml")):
        if path.is_file():
            yield path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mirror", required=True, type=Path)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--source-root", default=DEFAULT_SOURCE_ROOT)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--strict-xml", action="store_true")
    args = parser.parse_args()

    if not args.mirror.exists():
        parser.error(f"mirror does not exist: {args.mirror}")
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")

    mirror_root = args.mirror.parent if args.mirror.is_file() else args.mirror
    metrics = {
        "event": "harvest-complete",
        "source_id": SOURCE_ID,
        "source_snapshot": args.snapshot,
        "documents_seen": 0,
        "documents_parsed": 0,
        "documents_failed": 0,
        "math_seen": 0,
        "math_without_payload": 0,
        "math_image_backed": 0,
        "records_written": 0,
        "ocr_performed": 0,
        "reconstructions": 0,
    }

    for path in iter_xml_files(args.mirror):
        metrics["documents_seen"] += 1
        try:
            records, counters = extract_file(
                path,
                mirror=mirror_root,
                snapshot=args.snapshot,
                source_root=args.source_root,
            )
            metrics["documents_parsed"] += 1
            for key, value in counters.items():
                metrics[key] += value
        except (ET.ParseError, OSError) as exc:
            metrics["documents_failed"] += 1
            if args.strict_xml:
                raise
            print(
                json.dumps(
                    {"event": "xml-parse-rejected", "path": str(path), "error": str(exc)},
                    sort_keys=True,
                ),
                file=sys.stderr,
            )
            continue

        for record in records:
            print(json.dumps(record, ensure_ascii=False, sort_keys=True))
            metrics["records_written"] += 1
            if args.limit is not None and metrics["records_written"] >= args.limit:
                print(json.dumps(metrics, sort_keys=True), file=sys.stderr)
                return 0

    print(json.dumps(metrics, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
