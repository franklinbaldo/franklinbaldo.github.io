#!/usr/bin/env python3
"""Extract version/license metadata from arXiv OAI-PMH arXivRaw XML."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
import xml.etree.ElementTree as ET


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def text(element: ET.Element | None) -> str:
    return (element.text or "").strip() if element is not None else ""


def first_descendant(element: ET.Element | None, name: str) -> ET.Element | None:
    if element is None:
        return None
    for child in element.iter():
        if local_name(child.tag) == name:
            return child
    return None


def iter_inputs(root: Path):
    if root.is_file():
        yield root
        return
    for path in sorted(root.rglob("*.xml")):
        if path.is_file():
            yield path


def parse_record(record: ET.Element):
    header = next((child for child in record if local_name(child.tag) == "header"), None)
    if header is not None and header.attrib.get("status") == "deleted":
        return None, "deleted"

    oai_identifier = text(first_descendant(header, "identifier")) if header is not None else ""
    metadata = next((child for child in record if local_name(child.tag) == "metadata"), None)
    if metadata is None:
        return None, "no-metadata"
    payload = next(iter(metadata), None)
    if payload is None:
        return None, "no-payload"

    arxiv_id = text(first_descendant(payload, "id"))
    if not arxiv_id and oai_identifier:
        arxiv_id = oai_identifier.split(":arXiv.org:", 1)[-1]
    if not arxiv_id:
        return None, "no-id"

    versions = []
    for version in payload.iter():
        if local_name(version.tag) != "version":
            continue
        versions.append(
            {
                "version": version.attrib.get("version") or version.attrib.get("id"),
                "date": text(first_descendant(version, "date")) or None,
                "size": text(first_descendant(version, "size")) or None,
            }
        )

    row = {
        "schema_version": 1,
        "arxiv_id": arxiv_id,
        "oai_identifier": oai_identifier or f"oai:arXiv.org:{arxiv_id}",
        "title": text(first_descendant(payload, "title")) or None,
        "categories": text(first_descendant(payload, "categories")).split(),
        "license_url": text(first_descendant(payload, "license")) or None,
        "versions": versions,
        "version_count": len(versions),
    }
    return row, None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    if not args.input.exists():
        parser.error(f"input does not exist: {args.input}")

    metrics = {
        "files_seen": 0,
        "records_seen": 0,
        "records_written": 0,
        "records_deleted": 0,
        "records_rejected": 0,
    }

    for path in iter_inputs(args.input):
        metrics["files_seen"] += 1
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError) as exc:
            print(
                json.dumps({"event": "file-rejected", "path": str(path), "error": str(exc)}, sort_keys=True),
                file=sys.stderr,
            )
            continue

        records = [element for element in root.iter() if local_name(element.tag) == "record"]
        # Also accept one bare arXivRaw payload as a fixture/interoperability input.
        if not records and local_name(root.tag).lower() == "arxivraw":
            fake = ET.Element("record")
            metadata = ET.SubElement(fake, "metadata")
            metadata.append(root)
            records = [fake]

        for record in records:
            metrics["records_seen"] += 1
            row, reason = parse_record(record)
            if row is None:
                if reason == "deleted":
                    metrics["records_deleted"] += 1
                else:
                    metrics["records_rejected"] += 1
                continue
            print(json.dumps(row, ensure_ascii=False, sort_keys=True))
            metrics["records_written"] += 1

    print(json.dumps({"event": "metadata-extract-complete", **metrics}, sort_keys=True), file=sys.stderr)
    return 0 if metrics["files_seen"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
