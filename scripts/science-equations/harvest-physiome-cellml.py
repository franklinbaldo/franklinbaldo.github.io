#!/usr/bin/env python3
"""Harvest explicit MathML from Physiome Model Repository CellML workspaces.

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

SOURCE_ID = "physiome-cellml-math"
MATHML_NS = "http://www.w3.org/1998/Math/MathML"
XML_ENCODING_RE = re.compile(br"^\s*<\?xml[^>]*encoding=[\"']([^\"']+)[\"']", re.IGNORECASE)
MATH_OPEN_RE = re.compile(r"<(?P<prefix>[A-Za-z_][\w.-]*:)?math\b", re.IGNORECASE)
SPACE_RE = re.compile(r"\s+")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def local_name(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[1]
    if ":" in tag:
        return tag.rsplit(":", 1)[1]
    return tag


def namespace(tag: str) -> str | None:
    if tag.startswith("{") and "}" in tag:
        return tag[1:].split("}", 1)[0]
    return None


def decode_xml(raw: bytes) -> str:
    if raw.startswith(b"\xef\xbb\xbf"):
        return raw.decode("utf-8-sig")
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16")
    match = XML_ENCODING_RE.match(raw[:256])
    encoding = match.group(1).decode("ascii", errors="strict") if match else "utf-8"
    return raw.decode(encoding)


def lexical_math_blocks(text: str) -> list[str]:
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


def load_workspace_manifest(path: Path, input_root: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1 or not isinstance(data.get("workspaces"), list):
        raise SystemExit("workspace manifest must have schema_version=1 and workspaces[]")
    root_resolved = input_root.resolve()
    seen: set[str] = set()
    workspaces: list[dict] = []
    for raw in data["workspaces"]:
        required = ["workspace_id", "relative_path", "commit", "git_url", "rights_status"]
        missing = [key for key in required if not raw.get(key)]
        if missing:
            raise SystemExit(f"workspace manifest entry missing: {', '.join(missing)}")
        workspace_id = str(raw["workspace_id"])
        if workspace_id in seen:
            raise SystemExit(f"duplicate workspace_id: {workspace_id}")
        seen.add(workspace_id)
        rights = raw["rights_status"]
        if rights not in {"redistributable", "unverified", "restricted"}:
            raise SystemExit(f"invalid rights_status for {workspace_id}: {rights}")
        if rights == "redistributable" and (not raw.get("license") or not raw.get("license_url")):
            raise SystemExit(f"redistributable workspace {workspace_id} requires license and license_url")
        rel = Path(raw["relative_path"])
        if rel.is_absolute() or ".." in rel.parts:
            raise SystemExit(f"unsafe relative_path for {workspace_id}: {rel}")
        workspace_root = (input_root / rel).resolve()
        try:
            workspace_root.relative_to(root_resolved)
        except ValueError as exc:
            raise SystemExit(f"workspace escapes input root: {workspace_id}") from exc
        if not workspace_root.is_dir():
            raise SystemExit(f"workspace directory not found: {workspace_root}")
        workspaces.append({**raw, "_root": workspace_root, "_relative_path": rel.as_posix()})
    return sorted(workspaces, key=lambda item: item["workspace_id"])


def iter_cellml_files(workspace: dict) -> Iterable[Path]:
    for path in sorted(workspace["_root"].rglob("*.cellml")):
        if path.is_file():
            yield path


def nearest_ancestor(elem: ET.Element, parent_map: dict[ET.Element, ET.Element], wanted: str) -> ET.Element | None:
    cursor = parent_map.get(elem)
    while cursor is not None:
        if local_name(cursor.tag) == wanted:
            return cursor
        cursor = parent_map.get(cursor)
    return None


def ci_symbols(math_node: ET.Element) -> list[str]:
    symbols: list[str] = []
    seen: set[str] = set()
    for elem in math_node.iter():
        if namespace(elem.tag) == MATHML_NS and local_name(elem.tag) == "ci":
            value = SPACE_RE.sub(" ", "".join(elem.itertext())).strip()
            if value and value not in seen:
                seen.add(value)
                symbols.append(value)
    return symbols


def component_variables(component: ET.Element | None) -> dict[str, dict[str, str | None]]:
    if component is None:
        return {}
    out: dict[str, dict[str, str | None]] = {}
    for child in component:
        if local_name(child.tag) != "variable" or not child.attrib.get("name"):
            continue
        out[child.attrib["name"]] = {
            "units": child.attrib.get("units"),
            "initial_value": child.attrib.get("initial_value"),
            "interface": child.attrib.get("interface") or child.attrib.get("public_interface"),
        }
    return out


def process_file(path: Path, *, workspace: dict, snapshot: str) -> tuple[list[dict], dict]:
    raw = path.read_bytes()
    doc_sha = sha256_bytes(raw)
    try:
        text = decode_xml(raw)
        lexical = lexical_math_blocks(text)
        xml_root = ET.fromstring(text)
    except Exception as exc:  # noqa: BLE001
        return [], {"rejected_document": True, "reason": f"xml-or-lexical-parse-error: {exc}"}

    parent_map = {child: parent for parent in xml_root.iter() for child in parent}
    math_nodes = [
        elem for elem in xml_root.iter()
        if local_name(elem.tag).lower() == "math" and namespace(elem.tag) == MATHML_NS
    ]
    if len(math_nodes) != len(lexical):
        return [], {"rejected_document": True, "reason": f"math-count-mismatch parsed={len(math_nodes)} lexical={len(lexical)}"}

    model_name = xml_root.attrib.get("name")
    model_id = xml_root.attrib.get("id") or xml_root.attrib.get("{http://www.cellml.org/metadata/1.0#}id")
    cellml_namespace = namespace(xml_root.tag)
    rel_file = path.relative_to(workspace["_root"]).as_posix()
    records: list[dict] = []
    rejected_empty = 0
    for index, (math_node, original) in enumerate(zip(math_nodes, lexical), 1):
        if not "".join(math_node.itertext()).strip():
            rejected_empty += 1
            continue
        component = nearest_ancestor(math_node, parent_map, "component")
        component_name = component.attrib.get("name") if component is not None else None
        variables = component_variables(component)
        referenced = ci_symbols(math_node)
        referenced_details = [
            {"name": name, **variables.get(name, {"units": None, "initial_value": None, "interface": None})}
            for name in referenced
        ]
        expr_sha = sha256_bytes(original.encode("utf-8"))
        identity = "\0".join([
            SOURCE_ID, snapshot, workspace["workspace_id"], workspace["commit"], rel_file,
            doc_sha, str(index), expr_sha, component_name or "",
        ])
        rights_status = workspace["rights_status"]
        license_name = workspace.get("license") or "UNVERIFIED"
        license_url = workspace.get("license_url")
        context_bits = [f"CellML model={model_name or rel_file}"]
        if component_name:
            context_bits.append(f"component={component_name}")
        if referenced:
            context_bits.append("variables=" + ",".join(referenced))
        record = {
            "schema_version": 1,
            "source_id": SOURCE_ID,
            "source_snapshot": snapshot,
            "provenance_class": "attested",
            "expression_original": original,
            "expression_encoding": "MathML",
            "source_record_sha256": sha256_bytes(identity.encode("utf-8")),
            "expression_sha256": expr_sha,
            "source_document_id": f"{workspace['workspace_id']}@{workspace['commit']}:{rel_file}",
            "source_document_url": workspace.get("exposure_url") or workspace["git_url"],
            "source_locator": f"git:{workspace['commit']}:{rel_file}#math[{index}]",
            "source_license": license_name,
            "source_license_url": license_url,
            "source_rights_status": rights_status,
            "redistribution_allowed": rights_status == "redistributable",
            "context_text": "; ".join(context_bits),
            "source_workspace_id": workspace["workspace_id"],
            "source_workspace_commit": workspace["commit"],
            "source_workspace_git_url": workspace["git_url"],
            "source_exposure_url": workspace.get("exposure_url"),
            "source_document_sha256": doc_sha,
            "source_file_path": rel_file,
            "cellml_namespace": cellml_namespace,
            "model_id": model_id,
            "model_name": model_name,
            "component_name": component_name,
            "referenced_variables": referenced,
            "referenced_variable_metadata": referenced_details,
            "source_attested_payload": {
                "lexical_mathml_preserved": True,
                "workspace_commit_pinned": True,
                "reconstruction_performed": False,
                "ocr_performed": False,
            },
        }
        records.append(record)
    return records, {"rejected_document": False, "math_seen": len(math_nodes), "rejected_empty": rejected_empty}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Root containing acquired PMR workspaces")
    parser.add_argument("--workspace-manifest", required=True, type=Path, help="Audited workspace/commit/rights manifest")
    parser.add_argument("--snapshot", required=True, help="physiome-cellml:inventory-sha256:<digest>")
    parser.add_argument("--limit-files", type=int)
    args = parser.parse_args()
    if args.limit_files is not None and args.limit_files < 1:
        parser.error("--limit-files must be positive")
    workspaces = load_workspace_manifest(args.workspace_manifest, args.input)
    metrics = {
        "workspaces_seen": len(workspaces), "files_seen": 0, "documents_rejected": 0,
        "math_seen": 0, "records_written": 0, "empty_math_rejected": 0,
        "redistributable_records": 0, "nonredistributable_records": 0,
        "ocr_performed": 0, "reconstructions": 0, "rejection_reasons": {},
    }
    stop = False
    for workspace in workspaces:
        for path in iter_cellml_files(workspace):
            if args.limit_files is not None and metrics["files_seen"] >= args.limit_files:
                stop = True
                break
            metrics["files_seen"] += 1
            records, result = process_file(path, workspace=workspace, snapshot=args.snapshot)
            if result.get("rejected_document"):
                metrics["documents_rejected"] += 1
                reason = result["reason"]
                metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
                continue
            metrics["math_seen"] += result["math_seen"]
            metrics["empty_math_rejected"] += result["rejected_empty"]
            for record in records:
                print(json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
                metrics["records_written"] += 1
                key = "redistributable_records" if record["redistribution_allowed"] else "nonredistributable_records"
                metrics[key] += 1
        if stop:
            break
    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
