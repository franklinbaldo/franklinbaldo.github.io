#!/usr/bin/env python3
"""Harvest attested FORMULA elements from EUR-Lex Formex 4 bulk XML."""

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

SOURCE_ID = "eurlex-formex-formulas"
DEFAULT_SOURCE_ROOT = "https://eur-lex.europa.eu/legal-content"
SOURCE_LICENSE = "EU-reuse-policy-with-third-party-caveat"
SOURCE_LICENSE_URL = (
    "https://op.europa.eu/en/web/about-us/legal-notices/"
    "publications-office-of-the-european-union-copyright"
)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def collapse_text(element: ET.Element) -> str:
    return re.sub(r"\s+", " ", "".join(element.itertext())).strip()


def first_descendant_text(root: ET.Element, name: str) -> str | None:
    wanted = name.upper()
    for element in root.iter():
        if local_name(element.tag).upper() != wanted:
            continue
        text = collapse_text(element)
        if text:
            return text
    return None


def document_language(root: ET.Element, relative_path: str) -> str | None:
    language = first_descendant_text(root, "LG.DOC")
    if language:
        return language.upper()
    match = re.search(r"(?:^|[_.])([A-Z]{2})(?:[._]|$)", Path(relative_path).name.upper())
    return match.group(1) if match else None


def document_url(
    celex: str | None,
    language: str | None,
    relative_path: str,
    source_root: str,
) -> str:
    if celex:
        lang = (language or "EN").upper()
        return f"{source_root.rstrip('/')}/{quote(lang)}/TXT/?uri=CELEX:{quote(celex)}"
    encoded = "/".join(quote(part) for part in Path(relative_path).parts)
    return f"https://datadump.publications.europa.eu/{encoded}"


def containing_structure(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
) -> dict[str, str]:
    current = parents.get(element)
    for _ in range(12):
        if current is None:
            break
        name = local_name(current.tag).upper()
        if name in {"ARTICLE", "ANNEX", "SECTION", "SUBSECTION", "PARAG", "DIVISION"}:
            payload = {"element": name}
            for key in ("NO", "N", "ID", "IDENTIFIER"):
                value = current.attrib.get(key)
                if value:
                    payload[key.lower()] = value
            text = collapse_text(current)
            if text:
                payload["text_prefix"] = text[:300]
            return payload
        current = parents.get(current)
    return {}


def sibling_context(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
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
    for child in children[max(0, index - 2) : min(len(children), index + 3)]:
        if child is element:
            continue
        text = collapse_text(child)
        if text:
            parts.append(text)
    value = " | ".join(parts)
    return value[:max_chars] if value else None


def canonical_record_payload(
    *,
    logical_document_id: str,
    language: str | None,
    formula_index: int,
    formula_xml: str,
) -> str:
    payload = {
        "logical_document_id": logical_document_id,
        "language": language,
        "formula_index": formula_index,
        "formula_xml": formula_xml,
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
    relative_path = path.relative_to(mirror).as_posix()
    celex = first_descendant_text(root, "NO.CELEX")
    language = document_language(root, relative_path)
    logical_document_id = celex or relative_path
    source_document_url = document_url(celex, language, relative_path, source_root)
    records: list[dict[str, Any]] = []
    counters = {
        "formulas_seen": 0,
        "formulas_empty": 0,
        "inline": 0,
        "outline": 0,
    }

    formulas = (item for item in root.iter() if local_name(item.tag).upper() == "FORMULA")
    for formula_index, element in enumerate(formulas, start=1):
        counters["formulas_seen"] += 1
        formula_xml = ET.tostring(element, encoding="unicode", short_empty_elements=True).strip()
        text = collapse_text(element)
        if not text and not list(element):
            counters["formulas_empty"] += 1
            continue

        formula_type = element.attrib.get("TYPE", "").upper() or None
        if formula_type == "INLINE":
            counters["inline"] += 1
        elif formula_type == "OUTLINE":
            counters["outline"] += 1

        locator = f"FORMULA[{formula_index}]"
        structure = containing_structure(element, parents)
        source_payload = canonical_record_payload(
            logical_document_id=logical_document_id,
            language=language,
            formula_index=formula_index,
            formula_xml=formula_xml,
        )

        records.append(
            {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": formula_xml,
                "expression_encoding": "formex4-formula+xml",
                "source_record_sha256": sha256_text(source_payload),
                "expression_sha256": sha256_text(formula_xml),
                "normalized_text": None,
                "normalized_text_sha256": None,
                "source_document_id": logical_document_id,
                "source_document_url": source_document_url,
                "source_locator": locator,
                "source_license": SOURCE_LICENSE,
                "source_license_url": SOURCE_LICENSE_URL,
                "source_policy_url": SOURCE_LICENSE_URL,
                "source_celex": celex,
                "source_language": language,
                "source_formex_formula_type": formula_type,
                "source_attested_payload": {
                    "relative_path": relative_path,
                    "formula_attributes": dict(sorted(element.attrib.items())),
                    "structure": structure,
                    "ocr_performed": False,
                    "reconstruction_performed": False,
                },
                "context_text": sibling_context(element, parents),
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
        "formulas_seen": 0,
        "formulas_empty": 0,
        "inline": 0,
        "outline": 0,
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
