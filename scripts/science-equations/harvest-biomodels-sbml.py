#!/usr/bin/env python3
"""Harvest explicit MathML from BioModels SBML files as Atlas occurrences.

Persistent lake output is Parquet; this adapter emits JSONL transport only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterable

SOURCE_ID = "biomodels-sbml-math"
SOURCE_LICENSE = "CC0-1.0"
SOURCE_LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/"
ACCESSION_RE = re.compile(r"^(?:BIOMD\d{10}|MODEL\d{10})$", re.IGNORECASE)
XML_ENCODING_RE = re.compile(br"^\s*<\?xml[^>]*encoding=[\"']([^\"']+)[\"']", re.IGNORECASE)
MATH_OPEN_RE = re.compile(r"<(?P<prefix>[A-Za-z_][\w.-]*:)?math\b", re.IGNORECASE)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def local_name(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[1]
    if ":" in tag:
        return tag.rsplit(":", 1)[1]
    return tag


def decode_xml(raw: bytes) -> str:
    if raw.startswith(b"\xef\xbb\xbf"):
        return raw.decode("utf-8-sig")
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16")
    match = XML_ENCODING_RE.match(raw[:256])
    encoding = match.group(1).decode("ascii", errors="strict") if match else "utf-8"
    return raw.decode(encoding)


def lexical_math_blocks(text: str) -> list[str]:
    """Return exact lexical <math>...</math> blocks, preserving entities/spacing.

    MathML <math> elements do not nest in valid SBML. The scanner accepts a namespace
    prefix when present and rejects unterminated blocks instead of guessing.
    """
    blocks: list[str] = []
    pos = 0
    while True:
        match = MATH_OPEN_RE.search(text, pos)
        if not match:
            return blocks
        prefix = match.group("prefix") or ""
        open_start = match.start()
        open_end = text.find(">", match.end())
        if open_end < 0:
            raise ValueError("unterminated MathML opening tag")
        opening = text[open_start : open_end + 1]
        if opening.rstrip().endswith("/>"):
            blocks.append(opening)
            pos = open_end + 1
            continue
        close_re = re.compile(rf"</{re.escape(prefix)}math\s*>", re.IGNORECASE)
        close = close_re.search(text, open_end + 1)
        if not close:
            raise ValueError("unterminated MathML element")
        blocks.append(text[open_start : close.end()])
        pos = close.end()


def infer_accession(path: Path, explicit: str | None) -> str | None:
    if explicit:
        return explicit
    for part in reversed(path.parts):
        stem = Path(part).stem
        if ACCESSION_RE.match(stem):
            return stem.upper()
    return None


def iter_input_files(input_path: Path) -> Iterable[Path]:
    if input_path.is_file():
        yield input_path
        return
    if not input_path.is_dir():
        raise SystemExit(f"input path does not exist: {input_path}")
    for path in sorted(input_path.rglob("*")):
        if path.is_file() and path.suffix.lower() in {".xml", ".sbml"}:
            yield path


def parent_semantics(parent: ET.Element, parent_map: dict[ET.Element, ET.Element]) -> dict[str, str | None]:
    kind = local_name(parent.tag)
    variable = parent.attrib.get("variable")
    reaction_id = None
    reaction_name = None
    event_id = None
    function_id = None
    cursor: ET.Element | None = parent
    while cursor is not None:
        lname = local_name(cursor.tag)
        if lname == "reaction" and reaction_id is None:
            reaction_id = cursor.attrib.get("id")
            reaction_name = cursor.attrib.get("name")
        elif lname == "event" and event_id is None:
            event_id = cursor.attrib.get("id")
        elif lname == "functionDefinition" and function_id is None:
            function_id = cursor.attrib.get("id")
        cursor = parent_map.get(cursor)
    target = variable or parent.attrib.get("symbol") or parent.attrib.get("id")
    if kind == "initialAssignment":
        target = parent.attrib.get("symbol")
    if kind == "eventAssignment":
        target = parent.attrib.get("variable")
    if kind == "kineticLaw":
        target = reaction_id
    if kind == "functionDefinition":
        target = function_id
    return {
        "math_parent": kind,
        "target_symbol": target,
        "reaction_id": reaction_id,
        "reaction_name": reaction_name,
        "event_id": event_id,
        "function_id": function_id,
    }


def target_units(root: ET.Element, symbol: str | None) -> str | None:
    if not symbol:
        return None
    for elem in root.iter():
        if elem.attrib.get("id") == symbol and local_name(elem.tag) in {"species", "parameter", "compartment", "speciesReference"}:
            return elem.attrib.get("units") or elem.attrib.get("substanceUnits")
    return None


def process_file(path: Path, *, snapshot: str, explicit_accession: str | None, root_path: Path) -> tuple[list[dict], dict]:
    raw = path.read_bytes()
    doc_sha = sha256_bytes(raw)
    try:
        text = decode_xml(raw)
        lexical = lexical_math_blocks(text)
        xml_root = ET.fromstring(text)
    except Exception as exc:  # noqa: BLE001
        return [], {"rejected_document": True, "reason": f"xml-or-lexical-parse-error: {exc}"}

    accession = infer_accession(path.relative_to(root_path) if root_path.is_dir() else path, explicit_accession)
    if not accession:
        return [], {"rejected_document": True, "reason": "missing-biomodels-accession"}

    parent_map = {child: parent for parent in xml_root.iter() for child in parent}
    math_nodes = [elem for elem in xml_root.iter() if local_name(elem.tag).lower() == "math"]
    if len(math_nodes) != len(lexical):
        return [], {
            "rejected_document": True,
            "reason": f"math-count-mismatch parsed={len(math_nodes)} lexical={len(lexical)}",
        }

    model = next((elem for elem in xml_root.iter() if local_name(elem.tag) == "model"), None)
    model_id = model.attrib.get("id") if model is not None else None
    model_name = model.attrib.get("name") if model is not None else None
    sbml_level = xml_root.attrib.get("level")
    sbml_version = xml_root.attrib.get("version")
    records: list[dict] = []
    rejected_empty = 0

    for index, (math_node, original) in enumerate(zip(math_nodes, lexical), 1):
        if not "".join(math_node.itertext()).strip():
            rejected_empty += 1
            continue
        parent = parent_map.get(math_node)
        if parent is None:
            rejected_empty += 1
            continue
        sem = parent_semantics(parent, parent_map)
        expr_sha = sha256_bytes(original.encode("utf-8"))
        record_identity = "\0".join(
            [SOURCE_ID, snapshot, accession, doc_sha, str(index), expr_sha, sem["math_parent"] or ""]
        )
        source_record_sha256 = sha256_bytes(record_identity.encode("utf-8"))
        locator_bits = [f"math:{index}", f"parent:{sem['math_parent']}"]
        if sem["target_symbol"]:
            locator_bits.append(f"target:{sem['target_symbol']}")
        context_bits = [f"SBML {sem['math_parent']}"]
        if sem["reaction_id"]:
            context_bits.append(f"reaction={sem['reaction_id']}")
        if sem["target_symbol"] and sem["target_symbol"] != sem["reaction_id"]:
            context_bits.append(f"target={sem['target_symbol']}")
        record = {
            "schema_version": 1,
            "source_id": SOURCE_ID,
            "source_snapshot": snapshot,
            "provenance_class": "attested",
            "expression_original": original,
            "expression_encoding": "MathML",
            "source_record_sha256": source_record_sha256,
            "expression_sha256": expr_sha,
            "source_document_id": accession,
            "source_document_url": f"https://www.ebi.ac.uk/biostudies/BioModels/studies/{accession}",
            "source_locator": ";".join(locator_bits),
            "source_license": SOURCE_LICENSE,
            "source_license_url": SOURCE_LICENSE_URL,
            "context_text": "; ".join(context_bits),
            "source_accession": accession,
            "source_document_sha256": doc_sha,
            "source_file_name": path.name,
            "biomodels_url": f"https://www.biomodels.org/{accession}",
            "model_id": model_id,
            "model_name": model_name,
            "sbml_level": sbml_level,
            "sbml_version": sbml_version,
            "math_parent": sem["math_parent"],
            "target_symbol": sem["target_symbol"],
            "target_units": target_units(xml_root, sem["target_symbol"]),
            "reaction_id": sem["reaction_id"],
            "reaction_name": sem["reaction_name"],
            "event_id": sem["event_id"],
            "function_id": sem["function_id"],
            "source_attested_payload": {
                "lexical_mathml_preserved": True,
                "reconstruction_performed": False,
                "ocr_performed": False,
            },
        }
        records.append(record)
    return records, {"rejected_document": False, "math_seen": len(math_nodes), "rejected_empty": rejected_empty}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path, help="SBML file or directory tree")
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--accession", help="BioModels accession for a single-file input")
    parser.add_argument("--limit-files", type=int)
    args = parser.parse_args()
    if args.accession and args.input.is_dir():
        parser.error("--accession is only valid with a single-file --input")
    if args.limit_files is not None and args.limit_files < 1:
        parser.error("--limit-files must be positive")

    metrics = {
        "files_seen": 0,
        "documents_rejected": 0,
        "math_seen": 0,
        "records_written": 0,
        "empty_math_rejected": 0,
        "ocr_performed": 0,
        "reconstructions": 0,
        "rejection_reasons": {},
    }
    root_path = args.input
    for path in iter_input_files(args.input):
        if args.limit_files is not None and metrics["files_seen"] >= args.limit_files:
            break
        metrics["files_seen"] += 1
        records, info = process_file(
            path,
            snapshot=args.snapshot,
            explicit_accession=args.accession,
            root_path=root_path,
        )
        if info.get("rejected_document"):
            metrics["documents_rejected"] += 1
            reason = str(info.get("reason"))
            metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
            continue
        metrics["math_seen"] += int(info.get("math_seen", 0))
        metrics["empty_math_rejected"] += int(info.get("rejected_empty", 0))
        for record in records:
            sys.stdout.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
            metrics["records_written"] += 1
    sys.stderr.write(json.dumps(metrics, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
