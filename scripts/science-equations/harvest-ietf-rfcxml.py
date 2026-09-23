#!/usr/bin/env python3
"""Harvest formal structures from an RFC Editor rsync mirror.

The adapter scans the official RFC XML files already acquired through the RFC
Editor's rsync service and emits one transient JSONL occurrence per selected
RFCXML ``sourcecode`` block. By default it extracts ABNF and pseudocode, which
are explicit formal/computational structures attested by the RFC itself.

Acquisition is deliberately separate from extraction. A typical mirror is:

    rsync -avz --delete rsync.rfc-editor.org::rfcs /data/rfc-editor

Then run:

    python scripts/science-equations/harvest-ietf-rfcxml.py \
      --mirror /data/rfc-editor/in-notes \
      --snapshot 2026-09-23

The JSONL stream is interchange only; pipe it to materialize-parquet.py.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

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
        if local_name(element.tag) == name:
            text = "".join(element.itertext()).strip()
            if text:
                return text
    return None


def containing_section(element: ET.Element, parents: dict[ET.Element, ET.Element]) -> ET.Element | None:
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
        if local_name(child.tag) == "name":
            text = "".join(child.itertext()).strip()
            if text:
                return text
    return section.attrib.get("anchor") or section.attrib.get("pn")


def extract_file(path: Path, *, snapshot: str, allowed_types: set[str]) -> list[dict[str, object]]:
    match = RFC_FILE.match(path.name)
    if not match:
        return []
    rfc_number = int(match.group(1))
    tree = ET.parse(path)
    root = tree.getroot()
    parents = {child: parent for parent in root.iter() for child in parent}
    title = first_child_text(root, "title")
    records: list[dict[str, object]] = []
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
        anchor = element.attrib.get("anchor") or element.attrib.get("name") or element.attrib.get("pn")
        locator = anchor or f"sourcecode[{block_index}]"
        official_url = f"{SOURCE_ROOT}/rfc{rfc_number}.xml"
        record_seed = "\n".join(
            [snapshot, f"RFC{rfc_number}", locator, sourcecode_type, content]
        )
        normalized = "\n".join(line.rstrip() for line in content.strip().splitlines())
        records.append(
            {
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "source_document_id": f"RFC{rfc_number}",
                "source_document_url": official_url,
                "source_url": official_url,
                "source_record_url": f"{official_url}#{locator}",
                "source_locator": locator,
                "source_license": SOURCE_LICENSE,
                "source_license_url": SOURCE_LICENSE_URL,
                "source_policy_url": SOURCE_POLICY_URL,
                "source_title": title,
                "source_section": section_label(section),
                "sourcecode_type": sourcecode_type,
                "sourcecode_anchor": anchor,
                "original_expression": content,
                "original_encoding": f"rfcxml-sourcecode:{sourcecode_type}",
                "provenance_class": "attested",
                "source_record_sha256": sha256_text(record_seed),
                "original_text_sha256": sha256_text(content),
                "normalized_text_sha256": sha256_text(normalized),
            }
        )
    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mirror", required=True, help="local RFC Editor rsync mirror/root containing rfc*.xml")
    parser.add_argument("--snapshot", required=True, help="immutable acquisition label/date recorded by the caller")
    parser.add_argument("--types", default=",".join(DEFAULT_TYPES), help="comma-separated RFCXML sourcecode types")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--strict-xml", action="store_true", help="abort on the first malformed XML document")
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")
    return args


def main() -> None:
    args = parse_args()
    mirror = Path(args.mirror)
    if not mirror.is_dir():
        raise SystemExit(f"mirror does not exist or is not a directory: {mirror}")
    allowed_types = {value.strip().lower() for value in args.types.split(",") if value.strip()}
    if not allowed_types:
        raise SystemExit("--types must select at least one sourcecode type")

    metrics = {
        "event": "harvest-complete",
        "source_id": SOURCE_ID,
        "source_snapshot": args.snapshot,
        "documents_seen": 0,
        "documents_parsed": 0,
        "documents_failed": 0,
        "records_written": 0,
        "selected_types": sorted(allowed_types),
    }

    for path in sorted(mirror.rglob("rfc*.xml")):
        if not RFC_FILE.match(path.name):
            continue
        metrics["documents_seen"] += 1
        try:
            records = extract_file(path, snapshot=args.snapshot, allowed_types=allowed_types)
            metrics["documents_parsed"] += 1
        except ET.ParseError as exc:
            metrics["documents_failed"] += 1
            if args.strict_xml:
                raise
            print(json.dumps({"event": "xml-parse-rejected", "path": str(path), "error": str(exc)}), file=sys.stderr)
            continue
        for record in records:
            print(json.dumps(record, ensure_ascii=False, sort_keys=True))
            metrics["records_written"] += 1
            if args.limit is not None and metrics["records_written"] >= args.limit:
                print(json.dumps(metrics, sort_keys=True), file=sys.stderr)
                return

    print(json.dumps(metrics, sort_keys=True), file=sys.stderr)


if __name__ == "__main__":
    main()
