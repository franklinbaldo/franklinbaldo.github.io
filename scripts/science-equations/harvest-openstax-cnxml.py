#!/usr/bin/env python3
"""Harvest explicit MathML from OpenStax osbooks CNXML repositories."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

SOURCE_ID = "openstax-osbooks-mathml"
MATHML_NS = "http://www.w3.org/1998/Math/MathML"
MATH_RE = re.compile(
    r"<(?P<prefix>[A-Za-z_][\w.-]*:)?math\b[^>]*>.*?</(?P=prefix)math\s*>",
    re.IGNORECASE | re.DOTALL,
)
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")
DISPLAY_RE = re.compile(r"\bdisplay\s*=\s*(['\"])(.*?)\1", re.IGNORECASE | re.DOTALL)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def clean_context(value: str) -> str:
    return SPACE_RE.sub(" ", html.unescape(TAG_RE.sub(" ", value))).strip()


def module_metadata(root: ET.Element, fallback_id: str) -> tuple[str, str | None]:
    content_id = None
    title = None
    for element in root.iter():
        name = local_name(element.tag)
        if name == "content-id" and element.text and not content_id:
            content_id = element.text.strip()
        elif name == "title" and element.text and not title:
            title = element.text.strip()
    return content_id or fallback_id, title


def parsed_math_count(root: ET.Element) -> int:
    count = 0
    for element in root.iter():
        if local_name(element.tag) != "math":
            continue
        if element.tag.startswith("{"):
            namespace = element.tag[1:].split("}", 1)[0]
            if namespace != MATHML_NS:
                continue
        count += 1
    return count


def iter_cnxml(input_path: Path):
    if input_path.is_file():
        yield input_path
        return
    modules = input_path / "modules"
    base = modules if modules.is_dir() else input_path
    for path in sorted(base.rglob("*.cnxml")):
        if path.is_file():
            yield path


def convert_file(
    path: Path,
    repo_root: Path,
    *,
    snapshot: str,
    repository: str,
    commit: str,
    license_name: str,
    license_url: str,
) -> tuple[list[dict], dict[str, int]]:
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    root = ET.fromstring(text)
    matches = list(MATH_RE.finditer(text))
    parsed_count = parsed_math_count(root)
    if parsed_count != len(matches):
        raise ValueError(
            f"MathML lexical/parser count mismatch: lexical={len(matches)} parsed={parsed_count}"
        )

    relative = path.relative_to(repo_root).as_posix() if path.is_relative_to(repo_root) else path.name
    module_id, module_title = module_metadata(root, path.parent.name)
    document_sha256 = sha256_bytes(raw)
    records: list[dict] = []
    empty = 0

    for index, match in enumerate(matches, start=1):
        expression = match.group(0)
        if not clean_context(expression):
            empty += 1
            continue

        before = text[max(0, match.start() - 700) : match.start()]
        after = text[match.end() : min(len(text), match.end() + 700)]
        context = clean_context(before + " [MATH] " + after)
        start_tag = expression.split(">", 1)[0] + ">"
        display_match = DISPLAY_RE.search(start_tag)
        display = display_match.group(2).strip() if display_match else None
        expression_sha256 = sha256_text(expression)
        source_payload = {
            "repository": repository,
            "commit": commit,
            "module_id": module_id,
            "formula_index": index,
            "expression_sha256": expression_sha256,
        }
        source_record_sha256 = sha256_text(
            json.dumps(source_payload, sort_keys=True, separators=(",", ":"))
        )
        normalized = SPACE_RE.sub(" ", expression).strip()

        records.append(
            {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": expression,
                "expression_encoding": "MathML-in-CNXML",
                "source_record_sha256": source_record_sha256,
                "expression_sha256": expression_sha256,
                "normalized_text": normalized,
                "normalized_text_sha256": sha256_text(normalized),
                "source_document_id": f"{repository}:{module_id}",
                "source_document_url": f"https://github.com/{repository}/blob/{commit}/{relative}",
                "source_locator": f"{relative}#math[{index}]",
                "source_license": license_name,
                "source_license_url": license_url,
                "source_repository": repository,
                "source_commit": commit,
                "source_path": relative,
                "source_module_id": module_id,
                "source_module_title": module_title,
                "source_document_sha256": document_sha256,
                "source_context": context,
                "math_display": display,
                "source_attested_payload": {
                    "raw_mathml_preserved": True,
                    "ocr_performed": False,
                    "reconstruction_performed": False,
                },
            }
        )

    return records, {"math_seen": len(matches), "math_empty": empty}


def harvest(
    input_path: Path,
    output_handle,
    *,
    snapshot: str,
    repository: str,
    commit: str,
    license_name: str,
    license_url: str,
) -> dict[str, int]:
    repo_root = input_path if input_path.is_dir() else input_path.parent
    metrics = {
        "documents_parsed": 0,
        "documents_rejected": 0,
        "math_seen": 0,
        "math_empty": 0,
        "records_written": 0,
        "ocr_performed": 0,
        "reconstructions": 0,
    }

    for path in iter_cnxml(input_path):
        try:
            records, counts = convert_file(
                path,
                repo_root,
                snapshot=snapshot,
                repository=repository,
                commit=commit,
                license_name=license_name,
                license_url=license_url,
            )
        except Exception as exc:  # noqa: BLE001
            metrics["documents_rejected"] += 1
            print(
                json.dumps(
                    {"event": "document-rejected", "path": str(path), "error": str(exc)},
                    sort_keys=True,
                ),
                file=sys.stderr,
            )
            continue

        metrics["documents_parsed"] += 1
        metrics["math_seen"] += counts["math_seen"]
        metrics["math_empty"] += counts["math_empty"]
        for record in records:
            output_handle.write(
                json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
                + "\n"
            )
            metrics["records_written"] += 1

    return metrics


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="OpenStax osbooks repository root or CNXML file")
    parser.add_argument(
        "--snapshot",
        required=True,
        help="Exact source snapshot, e.g. openstax:<repo>:git:<sha>:inventory-sha256:<digest>",
    )
    parser.add_argument("--repository", required=True, help="owner/repo, e.g. openstax/osbooks-physics")
    parser.add_argument("--commit", required=True, help="Exact source repository commit SHA")
    parser.add_argument("--license", required=True, help="Observed repository content license identifier")
    parser.add_argument("--license-url", required=True, help="Stable URL for the observed repository license")
    args = parser.parse_args()

    metrics = harvest(
        Path(args.input),
        sys.stdout,
        snapshot=args.snapshot,
        repository=args.repository,
        commit=args.commit,
        license_name=args.license,
        license_url=args.license_url,
    )
    print(
        json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True),
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
