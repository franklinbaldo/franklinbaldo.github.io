#!/usr/bin/env python3
"""Harvest attested mathematical expressions from license-safe PMC JATS XML."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

SOURCE_ID = "pmc-jats-commercial-cc"
SOURCE_POLICY_URL = "https://pmc.ncbi.nlm.nih.gov/tools/textmining/"
WHITESPACE = re.compile(r"\s+")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def local_name(value: str) -> str:
    return value.rsplit("}", 1)[-1] if "}" in value else value


def attr_by_local_name(element: ET.Element, name: str) -> str | None:
    for key, value in element.attrib.items():
        if local_name(key) == name:
            return value
    return None


def collapsed_text(element: ET.Element | None, limit: int | None = None) -> str | None:
    if element is None:
        return None
    value = WHITESPACE.sub(" ", "".join(element.itertext())).strip()
    if not value:
        return None
    if limit and len(value) > limit:
        return value[: limit - 1] + "…"
    return value


def first_descendant(root: ET.Element, wanted: str) -> ET.Element | None:
    return next((node for node in root.iter() if local_name(node.tag) == wanted), None)


def article_id(root: ET.Element, *types: str) -> str | None:
    wanted = set(types)
    for node in root.iter():
        if local_name(node.tag) != "article-id":
            continue
        if node.attrib.get("pub-id-type") in wanted:
            value = collapsed_text(node)
            if value:
                return value
    return None


def normalize_license(root: ET.Element) -> tuple[str | None, str | None, str | None, bool]:
    licenses = [node for node in root.iter() if local_name(node.tag) == "license"]
    for license_node in licenses:
        href = attr_by_local_name(license_node, "href")
        text = collapsed_text(license_node, limit=4000)
        target = (href or "").lower()
        if "creativecommons.org/publicdomain/zero/" in target:
            version = target.rstrip("/").rsplit("/", 1)[-1]
            return f"CC0-{version}", href, text, True
        match = re.search(r"creativecommons\.org/licenses/(by(?:-sa|-nd)?)/(\d+(?:\.\d+)?)/", target)
        if match:
            family, version = match.groups()
            return f"CC-{family.upper()}-{version}", href, text, True

    first = licenses[0] if licenses else None
    return (
        None,
        attr_by_local_name(first, "href") if first is not None else None,
        collapsed_text(first, 4000),
        False,
    )


def formula_expression(node: ET.Element) -> tuple[str | None, str | None]:
    for child in node.iter():
        if local_name(child.tag) == "tex-math":
            value = "".join(child.itertext()).strip()
            if value:
                return value, "jats-tex-math"
    for child in node.iter():
        if local_name(child.tag) == "math":
            value = ET.tostring(child, encoding="unicode").strip()
            if value:
                return value, "mathml-xml"
    value = "".join(node.itertext()).strip()
    return (value, "jats-formula-text") if value else (None, None)


def nearest_ancestor(node: ET.Element, parent_map: dict[ET.Element, ET.Element], name: str) -> ET.Element | None:
    current = node
    while current in parent_map:
        current = parent_map[current]
        if local_name(current.tag) == name:
            return current
    return None


def direct_child_text(node: ET.Element | None, name: str) -> str | None:
    if node is None:
        return None
    for child in list(node):
        if local_name(child.tag) == name:
            return collapsed_text(child, limit=1000)
    return None


def extract_file(path: Path, root_dir: Path, snapshot: str) -> tuple[list[dict[str, object]], dict[str, int]]:
    source_bytes = path.read_bytes()
    file_sha256 = sha256_bytes(source_bytes)
    root = ET.fromstring(source_bytes)
    pmcid = article_id(root, "pmc", "pmcid")
    doi = article_id(root, "doi")
    article_title = collapsed_text(first_descendant(root, "article-title"), limit=2000)
    license_name, license_url, license_text, license_allowed = normalize_license(root)
    if not license_allowed:
        return [], {"articles_rejected_license": 1, "formulas_skipped_empty": 0}

    relative_path = path.relative_to(root_dir).as_posix()
    parent_map = {child: parent for parent in root.iter() for child in parent}
    formulas = [node for node in root.iter() if local_name(node.tag) in {"disp-formula", "inline-formula"}]
    records: list[dict[str, object]] = []
    skipped_empty = 0

    for ordinal, formula in enumerate(formulas, start=1):
        expression, encoding = formula_expression(formula)
        if not expression or not encoding:
            skipped_empty += 1
            continue
        kind = local_name(formula.tag)
        formula_id = formula.attrib.get("id")
        locator = f"{relative_path}#{formula_id}" if formula_id else f"{relative_path}#{kind}[{ordinal}]"
        section = nearest_ancestor(formula, parent_map, "sec")
        paragraph = nearest_ancestor(formula, parent_map, "p")
        source_record_sha256 = sha256_text("\n".join([file_sha256, locator, expression]))
        normalized = WHITESPACE.sub(" ", expression).strip()
        document_id = pmcid or doi or relative_path
        records.append({
            "source_id": SOURCE_ID,
            "source_snapshot": snapshot,
            "source_document_id": document_id,
            "source_locator": locator,
            "source_url": f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/" if pmcid else None,
            "source_license": license_name,
            "source_license_url": license_url,
            "source_policy_url": SOURCE_POLICY_URL,
            "provenance_class": "attested",
            "original_expression": expression,
            "original_encoding": encoding,
            "source_record_sha256": source_record_sha256,
            "original_text_sha256": sha256_text(expression),
            "normalized_text_sha256": sha256_text(normalized),
            "source_file_sha256": file_sha256,
            "source_file": relative_path,
            "pmcid": pmcid,
            "doi": doi,
            "article_title": article_title,
            "article_type": root.attrib.get("article-type"),
            "formula_kind": kind,
            "formula_id": formula_id,
            "section_title": direct_child_text(section, "title"),
            "paragraph_context": collapsed_text(paragraph, limit=2000),
            "license_statement": license_text,
        })
    return records, {"articles_rejected_license": 0, "formulas_skipped_empty": skipped_empty}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, help="directory containing PMC JATS XML files")
    parser.add_argument("--snapshot", required=True, help="immutable Atlas snapshot identifier")
    parser.add_argument("--limit", type=int, default=0, help="stop after N emitted formulas (0 = unlimited)")
    parser.add_argument("--allow-parse-errors", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root_dir = Path(args.root).resolve()
    if not root_dir.is_dir():
        raise SystemExit(f"not a directory: {root_dir}")

    metrics = {
        "files_seen": 0,
        "articles_accepted": 0,
        "articles_rejected_license": 0,
        "parse_errors": 0,
        "formulas_emitted": 0,
        "formulas_skipped_empty": 0,
    }

    stop = False
    for path in sorted(root_dir.rglob("*.xml")):
        metrics["files_seen"] += 1
        try:
            records, extra = extract_file(path, root_dir, args.snapshot)
        except (ET.ParseError, OSError, UnicodeError) as exc:
            metrics["parse_errors"] += 1
            if not args.allow_parse_errors:
                raise RuntimeError(f"failed to parse {path}: {exc}") from exc
            continue
        metrics["articles_rejected_license"] += extra["articles_rejected_license"]
        metrics["formulas_skipped_empty"] += extra["formulas_skipped_empty"]
        if extra["articles_rejected_license"] == 0:
            metrics["articles_accepted"] += 1
        for record in records:
            if args.limit and metrics["formulas_emitted"] >= args.limit:
                stop = True
                break
            sys.stdout.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
            metrics["formulas_emitted"] += 1
        if stop:
            break

    sys.stderr.write(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
