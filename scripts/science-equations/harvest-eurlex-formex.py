#!/usr/bin/env python3
"""Harvest attested mathematical FORMULA elements from EUR-Lex Formex 4 XML.

The adapter consumes XML/Formex files or ZIP archives obtained through an
official EUR-Lex/Publications Office bulk path. It preserves the lexical
FORMULA subtree as it appeared in the source object and emits transient JSONL
for the Atlas Parquet materializer. It performs no OCR, algebraic
reconstruction, or normalization.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Any, Iterator
from urllib.parse import quote

SOURCE_ID = "eurlex-formex-formulas"
SOURCE_LICENSE = "EUR-Lex-reuse-subject-to-copyright"
SOURCE_POLICY_URL = "https://eur-lex.europa.eu/content/help/data-reuse/reuse-contents-eurlex-details.html?locale=en"
DEFAULT_LANGUAGE = "EN"
FORMEX_SUFFIXES = {".xml", ".fmx", ".frg"}

# Formex is defined with uppercase element names. An optional namespace prefix
# is accepted without trying to reinterpret the XML payload.
FORMULA_BLOCK_RE = re.compile(
    rb"<(?:(?P<prefix>[A-Za-z_][\w.-]*):)?FORMULA\b[^>]*>.*?</(?:(?P=prefix):)?FORMULA\s*>",
    re.DOTALL,
)
XML_ENCODING_RE = re.compile(
    rb"<\?xml[^>]*\bencoding\s*=\s*['\"](?P<encoding>[A-Za-z0-9._-]+)['\"]",
    re.IGNORECASE,
)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].rsplit(":", 1)[-1]


def collapse_text(element: ET.Element) -> str:
    return re.sub(r"\s+", " ", "".join(element.itertext())).strip()


def xml_encoding(data: bytes) -> str:
    match = XML_ENCODING_RE.search(data[:512])
    return match.group("encoding").decode("ascii", "strict") if match else "utf-8"


def decode_xml_slice(data: bytes, encoding: str) -> str:
    try:
        return data.decode(encoding)
    except (LookupError, UnicodeDecodeError):
        # The lexical payload must not be silently rewritten with replacement
        # characters. Rejecting is safer than fabricating a source string.
        raise ValueError(f"cannot decode XML bytes with declared encoding {encoding!r}")


def raw_formula_blocks(data: bytes) -> list[bytes]:
    return [match.group(0) for match in FORMULA_BLOCK_RE.finditer(data)]


def first_text(root: ET.Element, names: set[str]) -> str | None:
    wanted = {name.upper() for name in names}
    for element in root.iter():
        if local_name(element.tag).upper() not in wanted:
            continue
        text = collapse_text(element)
        if text:
            return text
    return None


def all_text(root: ET.Element, name: str) -> list[str]:
    values: list[str] = []
    seen: set[str] = set()
    wanted = name.upper()
    for element in root.iter():
        if local_name(element.tag).upper() != wanted:
            continue
        text = collapse_text(element)
        if text and text not in seen:
            seen.add(text)
            values.append(text)
    return values


def sibling_context(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
    *,
    radius: int = 3,
    max_chars: int = 3000,
) -> str | None:
    parent = parents.get(element)
    if parent is None:
        return None
    siblings = list(parent)
    try:
        index = siblings.index(element)
    except ValueError:
        return None
    parts: list[str] = []
    for sibling in siblings[max(0, index - radius) : min(len(siblings), index + radius + 1)]:
        if sibling is element:
            continue
        text = collapse_text(sibling)
        if text:
            parts.append(text)
    if not parts:
        return None
    return " | ".join(parts)[:max_chars]


def structural_path(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
    *,
    max_depth: int = 8,
) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    current = parents.get(element)
    while current is not None and len(nodes) < max_depth:
        entry: dict[str, Any] = {"tag": local_name(current.tag)}
        for key in ("ID", "IDENTIFIER", "NO.SEQ", "N", "TYPE"):
            if key in current.attrib:
                entry[key.lower().replace(".", "_")] = current.attrib[key]
        nodes.append(entry)
        current = parents.get(current)
    nodes.reverse()
    return nodes


def document_title(root: ET.Element) -> str | None:
    return first_text(root, {"TI"}) or first_text(root, {"TITLE"})


def document_language(root: ET.Element, fallback: str) -> str:
    return (first_text(root, {"LG.DOC"}) or fallback).upper()


def document_url(celex: str | None, language: str) -> str | None:
    if not celex:
        return None
    return (
        "https://eur-lex.europa.eu/legal-content/"
        f"{quote(language.upper(), safe='')}/TXT/?uri=CELEX:{quote(celex, safe='')}"
    )


def iter_source_objects(input_path: Path) -> Iterator[tuple[str, bytes]]:
    """Yield deterministic (object_name, bytes) pairs from files/directories."""

    def emit_file(path: Path, *, root: Path) -> Iterator[tuple[str, bytes]]:
        rel = path.relative_to(root).as_posix() if path != root else path.name
        suffix = path.suffix.lower()
        if suffix == ".zip":
            with zipfile.ZipFile(path) as archive:
                for member in sorted(archive.infolist(), key=lambda item: item.filename):
                    if member.is_dir() or Path(member.filename).suffix.lower() not in FORMEX_SUFFIXES:
                        continue
                    yield f"{rel}!{member.filename}", archive.read(member)
            return
        if suffix in FORMEX_SUFFIXES:
            yield rel, path.read_bytes()

    if input_path.is_file():
        yield from emit_file(input_path, root=input_path)
        return

    for path in sorted(item for item in input_path.rglob("*") if item.is_file()):
        yield from emit_file(path, root=input_path)


def extract_document(
    data: bytes,
    *,
    object_name: str,
    snapshot: str,
    fallback_language: str,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    root = ET.fromstring(data)
    parents = {child: parent for parent in root.iter() for child in parent}
    formulas = [item for item in root.iter() if local_name(item.tag).upper() == "FORMULA"]
    raw_formulas = raw_formula_blocks(data)

    if len(formulas) != len(raw_formulas):
        raise ValueError(
            "raw FORMULA span count does not match parsed FORMULA count "
            f"({len(raw_formulas)} != {len(formulas)})"
        )

    encoding = xml_encoding(data)
    document_sha256 = sha256_bytes(data)
    celex_numbers = all_text(root, "NO.CELEX")
    primary_celex = celex_numbers[0] if celex_numbers else None
    language = document_language(root, fallback_language)
    title = document_title(root)
    source_document_id = (
        f"celex:{primary_celex}" if primary_celex else f"formex-sha256:{document_sha256}"
    )
    url = document_url(primary_celex, language)

    records: list[dict[str, Any]] = []
    counters = {
        "formula_seen": len(formulas),
        "formula_empty": 0,
        "formula_inline": 0,
        "formula_outline": 0,
    }

    for formula_index, (element, raw_bytes) in enumerate(zip(formulas, raw_formulas), start=1):
        text = collapse_text(element)
        child_names = [local_name(child.tag) for child in element.iter() if child is not element]
        if not text and not child_names:
            counters["formula_empty"] += 1
            continue

        formula_type = element.attrib.get("TYPE")
        if formula_type == "INLINE":
            counters["formula_inline"] += 1
        elif formula_type == "OUTLINE":
            counters["formula_outline"] += 1

        raw_xml = decode_xml_slice(raw_bytes, encoding)
        locator = f"{source_document_id};FORMULA[{formula_index}]"
        canonical_identity = json.dumps(
            {
                "source_document_id": source_document_id,
                "formula_index": formula_index,
                "expression_original": raw_xml,
            },
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        context = sibling_context(element, parents)
        records.append(
            {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": raw_xml,
                "expression_encoding": "formex4-formula+xml",
                "source_record_sha256": sha256_text(canonical_identity),
                "expression_sha256": sha256_text(raw_xml),
                "normalized_text": None,
                "normalized_text_sha256": None,
                "source_document_id": source_document_id,
                "source_document_url": url,
                "source_locator": locator,
                "source_license": SOURCE_LICENSE,
                "source_license_url": SOURCE_POLICY_URL,
                "source_policy_url": SOURCE_POLICY_URL,
                "source_title": title,
                "source_language": language,
                "source_celex": primary_celex,
                "source_attested_payload": {
                    "source_object": object_name,
                    "document_sha256": document_sha256,
                    "celex_numbers": celex_numbers,
                    "formula_index": formula_index,
                    "formula_attributes": dict(sorted(element.attrib.items())),
                    "formula_child_elements": child_names,
                    "structural_path": structural_path(element, parents),
                    "raw_formula_xml_preserved": True,
                    "ocr_performed": False,
                    "reconstruction_performed": False,
                },
                "context_text": context or title,
            }
        )

    return records, counters


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--language", default=DEFAULT_LANGUAGE)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--strict-xml", action="store_true")
    args = parser.parse_args()

    if not args.input.exists():
        parser.error(f"input does not exist: {args.input}")
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")

    metrics = {
        "event": "harvest-complete",
        "source_id": SOURCE_ID,
        "source_snapshot": args.snapshot,
        "source_objects_seen": 0,
        "documents_parsed": 0,
        "documents_failed": 0,
        "formula_seen": 0,
        "formula_empty": 0,
        "formula_inline": 0,
        "formula_outline": 0,
        "records_written": 0,
        "ocr_performed": 0,
        "reconstructions": 0,
    }

    try:
        objects = iter_source_objects(args.input)
        for object_name, data in objects:
            metrics["source_objects_seen"] += 1
            try:
                records, counters = extract_document(
                    data,
                    object_name=object_name,
                    snapshot=args.snapshot,
                    fallback_language=args.language,
                )
            except (ET.ParseError, OSError, ValueError, UnicodeError) as exc:
                metrics["documents_failed"] += 1
                if args.strict_xml:
                    raise
                print(
                    json.dumps(
                        {"event": "xml-rejected", "source_object": object_name, "error": str(exc)},
                        ensure_ascii=False,
                        sort_keys=True,
                    ),
                    file=sys.stderr,
                )
                continue

            metrics["documents_parsed"] += 1
            for key, value in counters.items():
                metrics[key] += value

            for record in records:
                print(json.dumps(record, ensure_ascii=False, sort_keys=True))
                metrics["records_written"] += 1
                if args.limit is not None and metrics["records_written"] >= args.limit:
                    print(json.dumps(metrics, sort_keys=True), file=sys.stderr)
                    return 0
    except (OSError, zipfile.BadZipFile) as exc:
        print(json.dumps({"event": "source-read-failed", "error": str(exc)}, sort_keys=True), file=sys.stderr)
        return 2

    print(json.dumps(metrics, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
