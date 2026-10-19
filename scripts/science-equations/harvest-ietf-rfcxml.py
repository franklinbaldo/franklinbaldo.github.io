#!/usr/bin/env python3
"""Harvest attested RFCXML formal blocks into Atlas occurrence JSONL."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

SOURCE_ID = "ietf-rfcxml-formal-blocks"
SOURCE_ROOT = "https://www.rfc-editor.org/rfc"
SOURCE_LICENSE = "IETF-Trust-Legal-Provisions"
SOURCE_LICENSE_URL = "https://www.rfc-editor.org/series/rfc-use/"
SOURCE_POLICY_URL = "https://trustee.ietf.org/license-info"
DEFAULT_TYPES = ("abnf", "pseudocode")
RFC_FILE = re.compile(r"^rfc(\d+)\.xml$", re.IGNORECASE)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def first_child_text(root: ET.Element, name: str) -> str | None:
    for element in root.iter():
        if local_name(element.tag) != name:
            continue
        text = "".join(element.itertext()).strip()
        if text:
            return text
    return None


def containing_section(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
) -> ET.Element | None:
    current = parents.get(element)
    while current is not None:
        if local_name(current.tag) == "section":
            return current
        current = parents.get(current)
    return None


def section_label(section: ET.Element | None) -> str | None:
    if section is None:
        return None
    for child in list(section):
        if local_name(child.tag) != "name":
            continue
        text = "".join(child.itertext()).strip()
        if text:
            return text
    return section.attrib.get("anchor") or section.attrib.get("pn")


def normalize_sourcecode(value: str) -> str:
    return "\n".join(line.rstrip() for line in value.strip().splitlines())


def canonical_record_payload(
    *,
    rfc_number: int,
    locator: str,
    sourcecode_type: str,
    content: str,
) -> str:
    payload = {
        "rfc_number": rfc_number,
        "locator": locator,
        "sourcecode_type": sourcecode_type,
        "content": content,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def extract_file(
    path: Path,
    snapshot: str,
    allowed_types: set[str],
) -> list[dict[str, Any]]:
    match = RFC_FILE.match(path.name)
    if not match:
        return []

    rfc_number = int(match.group(1))
    tree = ET.parse(path)
    root = tree.getroot()
    parents = {child: parent for parent in root.iter() for child in parent}
    title = first_child_text(root, "title")
    records: list[dict[str, Any]] = []
    block_index = 0

    for element in root.iter():
        if local_name(element.tag) != "sourcecode":
            continue
        block_index += 1
        sourcecode_type = element.attrib.get("type", "").strip().lower()
        if sourcecode_type not in allowed_types:
            continue

        content = "".join(element.itertext())
        if not content.strip():
            continue

        section = containing_section(element, parents)
        section_name = section_label(section)
        explicit_locator = (
            element.attrib.get("anchor")
            or element.attrib.get("name")
            or element.attrib.get("pn")
        )
        locator = explicit_locator or f"sourcecode[{block_index}]"
        official_url = f"{SOURCE_ROOT}/rfc{rfc_number}.xml"
        normalized = normalize_sourcecode(content)
        source_payload = canonical_record_payload(
            rfc_number=rfc_number,
            locator=locator,
            sourcecode_type=sourcecode_type,
            content=content,
        )

        records.append(
            {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": content,
                "expression_encoding": f"rfcxml-sourcecode:{sourcecode_type}",
                "source_record_sha256": sha256_text(source_payload),
                "expression_sha256": sha256_text(content),
                "normalized_text": normalized,
                "normalized_text_sha256": sha256_text(normalized),
                "source_document_id": f"RFC{rfc_number}",
                "source_document_url": official_url,
                "source_locator": locator,
                "source_license": SOURCE_LICENSE,
                "source_license_url": SOURCE_LICENSE_URL,
                "source_policy_url": SOURCE_POLICY_URL,
                "source_title": title,
                "source_section": section_name,
                "source_attested_payload": {
                    "rfc_number": rfc_number,
                    "sourcecode_type": sourcecode_type,
                    "locator": locator,
                },
                "context_text": section_name or title,
            }
        )

    return records


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mirror", required=True, type=Path)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--types", default=",".join(DEFAULT_TYPES))
    parser.add_argument("--limit", type=int)
    parser.add_argument("--strict-xml", action="store_true")
    args = parser.parse_args()

    if not args.mirror.is_dir():
        parser.error(f"mirror does not exist: {args.mirror}")
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")
    allowed = {item.strip().lower() for item in args.types.split(",") if item.strip()}
    if not allowed:
        parser.error("--types must select at least one RFCXML sourcecode type")

    metrics = {
        "event": "harvest-complete",
        "source_id": SOURCE_ID,
        "source_snapshot": args.snapshot,
        "documents_seen": 0,
        "documents_parsed": 0,
        "documents_failed": 0,
        "records_written": 0,
        "selected_types": sorted(allowed),
    }

    for path in sorted(args.mirror.rglob("rfc*.xml")):
        if not RFC_FILE.match(path.name):
            continue
        metrics["documents_seen"] += 1
        try:
            records = extract_file(path, args.snapshot, allowed)
            metrics["documents_parsed"] += 1
        except ET.ParseError as exc:
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
