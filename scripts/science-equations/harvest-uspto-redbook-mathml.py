#!/usr/bin/env python3
"""Harvest exact machine-readable MathML from USPTO Red Book patent XML bulk files.

Persistent lake output is Parquet; this adapter emits JSONL transport only.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
import zipfile
from pathlib import Path
from typing import BinaryIO, Iterator

SOURCE_ID = "uspto-redbook-mathml"
SNAPSHOT_PREFIX = "uspto-redbook:inventory-sha256:"
CHUNK_SIZE = 1024 * 1024
ROOT_START_RE = re.compile(br"<us-patent-(grant|application)\b", re.IGNORECASE)
MATHS_RE = re.compile(r"<maths\b(?P<attrs>[^>]*)>(?P<body>.*?)</maths\s*>", re.IGNORECASE | re.DOTALL)
MATH_OPEN_RE = re.compile(r"<(?P<prefix>[A-Za-z_][\w.-]*:)?math\b", re.IGNORECASE)
ATTR_RE = re.compile(r"([A-Za-z_:][\w:.-]*)\s*=\s*([\"'])(.*?)\2", re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>", re.DOTALL)
SPACE_RE = re.compile(r"\s+")
COPYRIGHT_NOTICE_RE = re.compile(
    r"(?:©|&copy;|copyright\s*(?:\(c\)|©)?\s*(?:19|20)\d{2}).{0,160}?all\s+rights\s+reserved|mask\s+work",
    re.IGNORECASE | re.DOTALL,
)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(CHUNK_SIZE), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_attrs(fragment: str) -> dict[str, str]:
    return {match.group(1): match.group(3) for match in ATTR_RE.finditer(fragment)}


def lexical_math_in_container(body: str) -> str | None:
    match = MATH_OPEN_RE.search(body)
    if not match:
        return None
    prefix = match.group("prefix") or ""
    open_end = body.find(">", match.end())
    if open_end < 0:
        return None
    opening = body[match.start():open_end + 1]
    if opening.rstrip().endswith("/>"):
        return opening
    close_re = re.compile(rf"</{re.escape(prefix)}math\s*>", re.IGNORECASE)
    close = close_re.search(body, open_end + 1)
    if not close:
        return None
    return body[match.start():close.end()]


def first_tag_text(text: str, tag: str) -> str | None:
    match = re.search(rf"<{re.escape(tag)}\b[^>]*>(.*?)</{re.escape(tag)}\s*>", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    value = TAG_RE.sub("", match.group(1))
    return SPACE_RE.sub(" ", html.unescape(value)).strip() or None


def publication_metadata(text: str) -> dict[str, str | None]:
    block_match = re.search(
        r"<publication-reference\b[^>]*>.*?<document-id\b[^>]*>(.*?)</document-id\s*>.*?</publication-reference\s*>",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    block = block_match.group(1) if block_match else ""
    return {
        "country": first_tag_text(block, "country"),
        "doc_number": first_tag_text(block, "doc-number"),
        "kind": first_tag_text(block, "kind"),
        "date": first_tag_text(block, "date"),
    }


def invention_title(text: str) -> str | None:
    return first_tag_text(text, "invention-title")


def root_metadata(text: str) -> dict[str, str | None]:
    match = re.search(r"<us-patent-(grant|application)\b(?P<attrs>[^>]*)>", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return {"document_type": None, "dtd_version": None, "lang": None, "file": None, "date_publ": None}
    attrs = parse_attrs(match.group("attrs"))
    return {
        "document_type": match.group(1).lower(),
        "dtd_version": attrs.get("dtd-version"),
        "lang": attrs.get("lang"),
        "file": attrs.get("file"),
        "date_publ": attrs.get("date-publ"),
    }


def compact_context(text: str, start: int, end: int, radius: int = 600) -> str | None:
    before = text[max(0, start - radius):start]
    after = text[end:min(len(text), end + radius)]
    raw = before + " [MATH] " + after
    raw = re.sub(r"<!--.*?-->", " ", raw, flags=re.DOTALL)
    raw = TAG_RE.sub(" ", raw)
    raw = SPACE_RE.sub(" ", html.unescape(raw)).strip()
    return raw[:1200] or None


def iter_patent_documents(stream: BinaryIO) -> Iterator[bytes]:
    """Split concatenated USPTO Red Book XML into one root document at a time."""
    buffer = bytearray()
    root_kind: bytes | None = None
    close_tag: bytes | None = None
    while True:
        chunk = stream.read(CHUNK_SIZE)
        if chunk:
            buffer.extend(chunk)
        while True:
            if root_kind is None:
                start = ROOT_START_RE.search(buffer)
                if not start:
                    if not chunk:
                        return
                    # Keep enough suffix for a root token split across chunks.
                    if len(buffer) > 128:
                        del buffer[:-128]
                    break
                start_pos = start.start()
                matched_kind = start.group(1).lower()
                if start_pos > 0:
                    del buffer[:start_pos]
                root_kind = matched_kind
                close_tag = b"</us-patent-" + root_kind + b">"
            assert close_tag is not None
            end = bytes(buffer).lower().find(close_tag.lower())
            if end < 0:
                break
            end += len(close_tag)
            yield bytes(buffer[:end])
            del buffer[:end]
            root_kind = None
            close_tag = None
        if not chunk:
            if root_kind is not None and any(buffer):
                raise ValueError("truncated patent XML document at end of stream")
            return


def iter_input_streams(path: Path) -> Iterator[tuple[str, BinaryIO]]:
    if path.suffix.lower() == ".zip":
        archive = zipfile.ZipFile(path)
        try:
            members = sorted(
                info for info in archive.infolist()
                if not info.is_dir() and info.filename.lower().endswith(".xml")
            )
            for info in members:
                with archive.open(info, "r") as handle:
                    yield info.filename, handle
        finally:
            archive.close()
    elif path.suffix.lower() == ".xml":
        with path.open("rb") as handle:
            yield path.name, handle
    else:
        raise ValueError(f"unsupported acquired object type: {path.name}")


def canonical_inventory_digest(entries: list[dict]) -> str:
    canonical = [
        {
            "object_name": item["object_name"],
            "product": item["product"],
            "release_date": item["release_date"],
            "size_bytes": item["size_bytes"],
            "sha256": item["sha256"],
        }
        for item in entries
    ]
    canonical.sort(key=lambda item: (item["product"], item["release_date"], item["object_name"], item["sha256"]))
    payload = json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256_bytes(payload)


def load_acquisition_manifest(path: Path, input_root: Path, snapshot: str) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1 or data.get("source_id") != SOURCE_ID or not isinstance(data.get("objects"), list):
        raise SystemExit(f"acquisition manifest must have schema_version=1, source_id={SOURCE_ID}, and objects[]")
    root = input_root.resolve()
    seen: set[tuple[str, str, str]] = set()
    objects: list[dict] = []
    inventory: list[dict] = []
    for raw in data["objects"]:
        required = ["relative_path", "object_name", "product", "release_date", "sha256", "rights_status"]
        missing = [key for key in required if not raw.get(key)]
        if missing:
            raise SystemExit(f"acquisition manifest object missing: {', '.join(missing)}")
        rights = str(raw["rights_status"])
        if rights not in {"redistributable", "unverified", "restricted"}:
            raise SystemExit(f"invalid rights_status for {raw['object_name']}: {rights}")
        if rights == "redistributable" and (not raw.get("license") or not raw.get("license_url")):
            raise SystemExit(f"redistributable object {raw['object_name']} requires license and license_url")
        rel = Path(raw["relative_path"])
        if rel.is_absolute() or ".." in rel.parts:
            raise SystemExit(f"unsafe relative_path: {rel}")
        acquired = (input_root / rel).resolve()
        try:
            acquired.relative_to(root)
        except ValueError as exc:
            raise SystemExit(f"object escapes input root: {rel}") from exc
        if not acquired.is_file():
            raise SystemExit(f"acquired object not found: {acquired}")
        key = (str(raw["product"]), str(raw["release_date"]), str(raw["object_name"]))
        if key in seen:
            raise SystemExit(f"duplicate acquisition object: {key}")
        seen.add(key)
        actual_sha = sha256_file(acquired)
        expected_sha = str(raw["sha256"]).lower()
        if actual_sha != expected_sha:
            raise SystemExit(f"SHA-256 mismatch for {raw['object_name']}: expected {expected_sha}, got {actual_sha}")
        size = acquired.stat().st_size
        if raw.get("size_bytes") is not None and int(raw["size_bytes"]) != size:
            raise SystemExit(f"size mismatch for {raw['object_name']}: expected {raw['size_bytes']}, got {size}")
        item = {**raw, "_path": acquired, "_actual_sha256": actual_sha, "_size_bytes": size}
        objects.append(item)
        inventory.append({
            "object_name": str(raw["object_name"]),
            "product": str(raw["product"]),
            "release_date": str(raw["release_date"]),
            "size_bytes": size,
            "sha256": actual_sha,
        })
    digest = canonical_inventory_digest(inventory)
    expected_snapshot = SNAPSHOT_PREFIX + digest
    if snapshot != expected_snapshot:
        raise SystemExit(f"snapshot mismatch: manifest bytes imply {expected_snapshot}, got {snapshot}")
    return sorted(objects, key=lambda item: (item["product"], item["release_date"], item["object_name"]))


def process_document(raw: bytes, *, source_object: dict, member_name: str, snapshot: str) -> tuple[list[dict], dict]:
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        return [], {"rejected_document": True, "reason": f"utf8-decode-error: {exc}"}
    root = root_metadata(text)
    publication = publication_metadata(text)
    doc_number = publication["doc_number"]
    if not doc_number:
        return [], {"rejected_document": True, "reason": "missing-publication-doc-number"}
    country = publication["country"] or "US"
    kind = publication["kind"] or ""
    doc_id = f"{country}{doc_number}{kind}"
    doc_sha = sha256_bytes(raw)
    title = invention_title(text)
    explicit_rights_notice = bool(COPYRIGHT_NOTICE_RE.search(text))
    records: list[dict] = []
    math_containers = 0
    image_only = 0
    empty_math = 0
    for math_index, container in enumerate(MATHS_RE.finditer(text), 1):
        math_containers += 1
        body = container.group("body")
        original = lexical_math_in_container(body)
        if original is None:
            if re.search(r"<img\b", body, re.IGNORECASE):
                image_only += 1
            continue
        inner_text = TAG_RE.sub("", original)
        if not html.unescape(inner_text).strip():
            empty_math += 1
            continue
        attrs = parse_attrs(container.group("attrs"))
        expr_sha = sha256_bytes(original.encode("utf-8"))
        archive_rights = str(source_object["rights_status"])
        redistribution_allowed = archive_rights == "redistributable" and not explicit_rights_notice
        rights_status = "unverified" if explicit_rights_notice and archive_rights == "redistributable" else archive_rights
        license_name = source_object.get("license") or "UNVERIFIED"
        license_url = source_object.get("license_url")
        identity = "\0".join([
            SOURCE_ID,
            snapshot,
            doc_id,
            doc_sha,
            str(math_index),
            expr_sha,
        ])
        record = {
            "schema_version": 1,
            "source_id": SOURCE_ID,
            "source_snapshot": snapshot,
            "provenance_class": "attested",
            "expression_original": original,
            "expression_encoding": "MathML",
            "source_record_sha256": sha256_bytes(identity.encode("utf-8")),
            "expression_sha256": expr_sha,
            "source_document_id": doc_id,
            "source_document_url": source_object.get("product_url") or "https://data.uspto.gov/",
            "source_locator": f"odp:{source_object['product']}:{source_object['release_date']}:{doc_id}#maths[{math_index}]",
            "source_license": license_name,
            "source_license_url": license_url,
            "source_rights_status": rights_status,
            "redistribution_allowed": redistribution_allowed,
            "context_text": compact_context(text, container.start(), container.end()),
            "source_object_name": source_object["object_name"],
            "source_object_sha256": source_object["_actual_sha256"],
            "source_member_name": member_name,
            "source_document_sha256": doc_sha,
            "odp_product": source_object["product"],
            "odp_release_date": source_object["release_date"],
            "patent_document_type": root["document_type"],
            "patent_dtd_version": root["dtd_version"],
            "patent_language": root["lang"],
            "patent_file_attribute": root["file"],
            "publication_country": publication["country"],
            "publication_number": doc_number,
            "publication_kind": publication["kind"],
            "publication_date": publication["date"] or root["date_publ"],
            "invention_title": title,
            "maths_id": attrs.get("id"),
            "maths_num": attrs.get("num"),
            "math_has_fallback_image": bool(re.search(r"<img\b", body, re.IGNORECASE)),
            "explicit_copyright_or_mask_notice_detected": explicit_rights_notice,
            "source_attested_payload": {
                "lexical_mathml_preserved": True,
                "machine_readable_mathml": True,
                "image_only_math_skipped": False,
                "reconstruction_performed": False,
                "ocr_performed": False,
            },
        }
        records.append(record)
    return records, {
        "rejected_document": False,
        "math_containers_seen": math_containers,
        "image_only_math_rejected": image_only,
        "empty_math_rejected": empty_math,
        "explicit_rights_notice": explicit_rights_notice,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Root containing externally acquired USPTO ODP XML/ZIP objects")
    parser.add_argument("--acquisition-manifest", required=True, type=Path, help="Audited ODP release/object/rights manifest")
    parser.add_argument("--snapshot", required=True, help="uspto-redbook:inventory-sha256:<digest>")
    parser.add_argument("--limit-documents", type=int)
    args = parser.parse_args()
    if args.limit_documents is not None and args.limit_documents < 1:
        parser.error("--limit-documents must be positive")
    objects = load_acquisition_manifest(args.acquisition_manifest, args.input, args.snapshot)
    metrics = {
        "objects_seen": len(objects), "members_seen": 0, "documents_seen": 0, "documents_rejected": 0,
        "math_containers_seen": 0, "records_written": 0, "image_only_math_rejected": 0, "empty_math_rejected": 0,
        "documents_with_explicit_rights_notice": 0, "redistributable_records": 0, "nonredistributable_records": 0,
        "ocr_performed": 0, "reconstructions": 0, "rejection_reasons": {},
    }
    stop = False
    for source_object in objects:
        try:
            streams = iter_input_streams(source_object["_path"])
            for member_name, stream in streams:
                metrics["members_seen"] += 1
                try:
                    documents = iter_patent_documents(stream)
                    for raw in documents:
                        if args.limit_documents is not None and metrics["documents_seen"] >= args.limit_documents:
                            stop = True
                            break
                        metrics["documents_seen"] += 1
                        records, result = process_document(raw, source_object=source_object, member_name=member_name, snapshot=args.snapshot)
                        if result.get("rejected_document"):
                            metrics["documents_rejected"] += 1
                            reason = result["reason"]
                            metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
                            continue
                        metrics["math_containers_seen"] += result["math_containers_seen"]
                        metrics["image_only_math_rejected"] += result["image_only_math_rejected"]
                        metrics["empty_math_rejected"] += result["empty_math_rejected"]
                        metrics["documents_with_explicit_rights_notice"] += int(result["explicit_rights_notice"])
                        for record in records:
                            print(json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
                            metrics["records_written"] += 1
                            key = "redistributable_records" if record["redistribution_allowed"] else "nonredistributable_records"
                            metrics[key] += 1
                except ValueError as exc:
                    metrics["documents_rejected"] += 1
                    reason = f"stream-error: {exc}"
                    metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
                if stop:
                    break
        except (ValueError, zipfile.BadZipFile) as exc:
            metrics["documents_rejected"] += 1
            reason = f"object-error: {exc}"
            metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
        if stop:
            break
    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
