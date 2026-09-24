#!/usr/bin/env python3
"""Extract explicit eCFR MATH blocks from a local GovInfo bulk XML mirror.

The adapter preserves the source MATH XML as attested material. It deliberately
performs no OCR and no mathematical reconstruction. JSONL is emitted only as a
transient transport for the Atlas Parquet materializer.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from bisect import bisect_right
from html import unescape
from pathlib import Path
from typing import Iterable, TextIO
from urllib.parse import quote

SOURCE_ID = "govinfo-ecfr-math-blocks"
SOURCE_LICENSE = "US-Government-Work-with-third-party-caveat"
SOURCE_LICENSE_URL = "https://www.govinfo.gov/about/policies"
SOURCE_BASE_URL = "https://www.govinfo.gov/bulkdata/ECFR"

MATH_RE = re.compile(r"<MATH\b(?:[^>]*?/>|[^>]*>.*?</MATH\s*>)", re.IGNORECASE | re.DOTALL)
OPEN_MATH_RE = re.compile(r"<MATH\b(?P<attrs>[^>]*)>", re.IGNORECASE | re.DOTALL)
ATTR_RE = re.compile(
    r"(?P<name>[A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*(?:(?P<dq>\"[^\"]*\")|(?P<sq>'[^']*'))",
    re.DOTALL,
)
IMG_SRC_RE = re.compile(
    r"<img\b[^>]*\bsrc\s*=\s*(?:\"(?P<dq>[^\"]+)\"|'(?P<sq>[^']+)')[^>]*>",
    re.IGNORECASE | re.DOTALL,
)
DIV_START_RE = re.compile(r"<DIV\d+\b[^>]*>", re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>", re.DOTALL)
XML_ENCODING_RE = re.compile(br"<\?xml[^>]*encoding=[\"']([^\"']+)[\"']", re.IGNORECASE)
TITLE_FILE_RE = re.compile(r"(?:^|[^0-9])title[-_ ]?(\d{1,2})(?:[^0-9]|$)", re.IGNORECASE)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_space(value: str) -> str:
    return " ".join(value.split())


def decode_xml(raw: bytes) -> str:
    match = XML_ENCODING_RE.search(raw[:512])
    encoding = match.group(1).decode("ascii", errors="replace") if match else "utf-8"
    try:
        return raw.decode(encoding)
    except (LookupError, UnicodeDecodeError):
        return raw.decode(encoding if encoding else "utf-8", errors="replace")


def parse_attrs(open_tag: str) -> dict[str, str]:
    match = OPEN_MATH_RE.search(open_tag)
    if not match:
        return {}
    attrs: dict[str, str] = {}
    for item in ATTR_RE.finditer(match.group("attrs")):
        raw_value = item.group("dq") or item.group("sq") or ""
        attrs[item.group("name")] = unescape(raw_value[1:-1])
    return attrs


def graphic_refs(math_xml: str) -> list[str]:
    refs: list[str] = []
    for match in IMG_SRC_RE.finditer(math_xml):
        refs.append(unescape(match.group("dq") or match.group("sq") or ""))
    return refs


def parse_generic_attrs(tag: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    body = tag[tag.find(" ") + 1 : tag.rfind(">")] if " " in tag else ""
    for item in ATTR_RE.finditer(body):
        raw_value = item.group("dq") or item.group("sq") or ""
        attrs[item.group("name")] = unescape(raw_value[1:-1])
    return attrs


def build_section_index(text: str) -> tuple[list[int], list[str | None]]:
    positions: list[int] = []
    values: list[str | None] = []
    for match in DIV_START_RE.finditer(text):
        tag = match.group(0)
        attrs = {k.upper(): v for k, v in parse_generic_attrs(tag).items()}
        if attrs.get("TYPE", "").upper() == "SECTION":
            positions.append(match.start())
            values.append(attrs.get("N") or attrs.get("NODE"))
    return positions, values


def section_locator(positions: list[int], values: list[str | None], offset: int) -> str | None:
    index = bisect_right(positions, offset) - 1
    return values[index] if index >= 0 else None


def title_number(relative_path: str, text: str) -> str | None:
    match = TITLE_FILE_RE.search(relative_path)
    if match:
        return match.group(1)
    header = re.search(
        r"<IDNO\b[^>]*\bTYPE\s*=\s*[\"']title[\"'][^>]*>\s*(\d{1,2})\s*</IDNO>",
        text,
        re.IGNORECASE,
    )
    return header.group(1) if header else None


def context_text(text: str, start: int, end: int, radius: int = 900) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    window = text[left:start] + " [MATH] " + text[end:right]
    plain = TAG_RE.sub(" ", window)
    return normalize_space(unescape(plain))[:1800]


def source_url(relative_path: str, base_url: str) -> str:
    quoted = "/".join(quote(part) for part in Path(relative_path).as_posix().split("/"))
    return f"{base_url.rstrip('/')}/{quoted}"


def iter_xml_paths(root: Path) -> Iterable[Path]:
    yield from sorted((path for path in root.rglob("*.xml") if path.is_file()), key=lambda p: p.as_posix())


def records_for_document(
    path: Path,
    *,
    root: Path,
    snapshot: str,
    base_url: str,
) -> tuple[list[dict], dict[str, int]]:
    raw = path.read_bytes()
    text = decode_xml(raw)
    rel = path.relative_to(root).as_posix()
    doc_sha256 = hashlib.sha256(raw).hexdigest()
    title = title_number(rel, text)
    section_positions, section_values = build_section_index(text)

    records: list[dict] = []
    metrics = {"math_blocks_seen": 0, "records_emitted": 0, "image_backed": 0, "empty_rejected": 0}
    for index, match in enumerate(MATH_RE.finditer(text), 1):
        metrics["math_blocks_seen"] += 1
        math_xml = match.group(0)
        attrs = parse_attrs(math_xml)
        refs = graphic_refs(math_xml)
        if not normalize_space(TAG_RE.sub(" ", math_xml)) and not refs and not attrs:
            metrics["empty_rejected"] += 1
            continue
        if refs:
            metrics["image_backed"] += 1

        section = section_locator(section_positions, section_values, match.start())
        locator = f"MATH[{index}]" if not section else f"section={section}#MATH[{index}]"
        payload = {
            "relative_path": rel,
            "document_sha256": doc_sha256,
            "locator": locator,
            "math_xml": math_xml,
            "math_attributes": attrs,
            "graphic_refs": refs,
            "ecfr_title": title,
            "ecfr_section": section,
        }
        payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        record = {
            "schema_version": 1,
            "source_id": SOURCE_ID,
            "source_snapshot": snapshot,
            "provenance_class": "attested",
            "expression_original": math_xml,
            "expression_encoding": "ecfr-math-xml",
            "source_record_sha256": sha256_text(payload_json),
            "expression_sha256": sha256_text(math_xml),
            "source_document_id": rel,
            "source_document_url": source_url(rel, base_url),
            "source_locator": locator,
            "source_license": SOURCE_LICENSE,
            "source_license_url": SOURCE_LICENSE_URL,
            "source_policy_url": SOURCE_LICENSE_URL,
            "context_text": context_text(text, match.start(), match.end()),
            "source_collection": "ECFR",
            "source_document_sha256": doc_sha256,
            "ecfr_title": title,
            "ecfr_section": section,
            "math_attributes": attrs,
            "graphic_refs": refs,
            "ocr_performed": False,
            "reconstruction_performed": False,
            "redistribution_note": (
                "GovInfo government works are generally public domain, but linked graphics or other embedded material may be third-party copyrighted; "
                "this extracted record preserves references and does not mirror graphic bytes."
            ),
        }
        records.append(record)
        metrics["records_emitted"] += 1
    return records, metrics


def harvest(
    root: Path,
    output: TextIO,
    snapshot: str,
    limit: int | None,
    base_url: str,
) -> dict[str, int]:
    root = root.resolve()
    documents_seen = documents_parsed = 0
    math_blocks_seen = empty_rejected = records_emitted = image_backed = 0

    for path in iter_xml_paths(root):
        if limit is not None and records_emitted >= limit:
            break
        documents_seen += 1
        try:
            records, metrics = records_for_document(path, root=root, snapshot=snapshot, base_url=base_url)
            documents_parsed += 1
        except Exception as exc:  # noqa: BLE001
            print(json.dumps({"event": "document-rejected", "path": str(path), "error": str(exc)}), file=sys.stderr)
            continue

        math_blocks_seen += metrics["math_blocks_seen"]
        empty_rejected += metrics["empty_rejected"]
        for record in records:
            if limit is not None and records_emitted >= limit:
                break
            output.write(json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n")
            records_emitted += 1
            if record["graphic_refs"]:
                image_backed += 1

    return {
        "documents_seen": documents_seen,
        "documents_parsed": documents_parsed,
        "math_blocks_seen": math_blocks_seen,
        "records_emitted": records_emitted,
        "image_backed": image_backed,
        "empty_rejected": empty_rejected,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path, help="Local mirror root containing official GovInfo eCFR XML files")
    parser.add_argument("--snapshot", required=True, help="Exact content snapshot id, preferably inventory-sha256:<digest>")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--source-base-url", default=SOURCE_BASE_URL)
    args = parser.parse_args()

    if not args.root.is_dir():
        parser.error(f"--root is not a directory: {args.root}")
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")

    metrics = harvest(args.root, sys.stdout, args.snapshot, args.limit, args.source_base_url)
    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
