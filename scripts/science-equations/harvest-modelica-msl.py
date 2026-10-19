#!/usr/bin/env python3
"""Harvest attested simple equality equations from Modelica Standard Library sources.

Persistent Atlas lake output is Apache Parquet; this adapter emits JSONL transport only.
The extractor is deliberately conservative: it reads explicit equality equations from
Modelica ``equation`` and ``initial equation`` sections and excludes procedural calls,
connection clauses, algorithms, declarations, annotations and documentation text.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

SOURCE_ID = "modelica-msl-equations"
SOURCE_LICENSE = "BSD-3-Clause"
SOURCE_LICENSE_URL = "https://modelica.org/licenses/modelica-3-clause-bsd"
SOURCE_REPOSITORY = "https://github.com/modelica/ModelicaStandardLibrary"
CLASS_RE = re.compile(
    r"^\s*(?:encapsulated\s+)?(?:partial\s+)?(?:operator\s+)?"
    r"(model|block|connector|record|package|function|class|type)\s+([A-Za-z_]\w*)\b"
)
END_NAMED_RE = re.compile(r"^\s*end\s+([A-Za-z_]\w*)\s*;\s*$")
WITHIN_RE = re.compile(r"(?m)^\s*within\s*([^;]*?)\s*;")
SECTION_RE = re.compile(r"^\s*(initial\s+)?equation\s*$")
SECTION_END_RE = re.compile(r"^\s*(?:initial\s+)?algorithm\b|^\s*(?:public|protected|external)\b|^\s*annotation\s*\(")
CONTROL_OPEN_RE = re.compile(r"^\s*(if|when|for)\b(.*?)(then|loop)\s*$")
CONTROL_ALT_RE = re.compile(r"^\s*(elseif|elsewhen)\b(.*?)then\s*$")
CONTROL_ELSE_RE = re.compile(r"^\s*else\s*$")
CONTROL_END_RE = re.compile(r"^\s*end\s+(if|when|for)\s*;\s*$")
EXCLUDED_CALL_RE = re.compile(r"^\s*(?:assert|connect|reinit|terminate)\s*\(", re.I)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def mask_comments_and_strings(line: str, in_block_comment: bool) -> tuple[str, bool]:
    """Mask comments/strings with spaces while preserving character offsets."""
    out = list(line)
    i = 0
    in_string = False
    while i < len(line):
        if in_block_comment:
            end = line.find("*/", i)
            if end < 0:
                for j in range(i, len(line)):
                    if line[j] not in "\r\n":
                        out[j] = " "
                return "".join(out), True
            for j in range(i, end + 2):
                if line[j] not in "\r\n":
                    out[j] = " "
            i = end + 2
            in_block_comment = False
            continue
        if in_string:
            if line[i] == "\\" and i + 1 < len(line):
                if line[i] not in "\r\n":
                    out[i] = " "
                if line[i + 1] not in "\r\n":
                    out[i + 1] = " "
                i += 2
                continue
            if line[i] == '"':
                out[i] = " "
                in_string = False
                i += 1
                continue
            if line[i] not in "\r\n":
                out[i] = " "
            i += 1
            continue
        if line.startswith("//", i):
            for j in range(i, len(line)):
                if line[j] not in "\r\n":
                    out[j] = " "
            break
        if line.startswith("/*", i):
            out[i] = out[i + 1] = " "
            i += 2
            in_block_comment = True
            continue
        if line[i] == '"':
            out[i] = " "
            in_string = True
            i += 1
            continue
        i += 1
    return "".join(out), in_block_comment


def top_level_equality_index(masked: str) -> int | None:
    depth_round = depth_square = depth_curly = 0
    for i, ch in enumerate(masked):
        if ch == "(":
            depth_round += 1
        elif ch == ")":
            depth_round = max(0, depth_round - 1)
        elif ch == "[":
            depth_square += 1
        elif ch == "]":
            depth_square = max(0, depth_square - 1)
        elif ch == "{":
            depth_curly += 1
        elif ch == "}":
            depth_curly = max(0, depth_curly - 1)
        elif ch == "=" and depth_round == depth_square == depth_curly == 0:
            prev = masked[i - 1] if i else ""
            nxt = masked[i + 1] if i + 1 < len(masked) else ""
            if prev not in "<>:=\u2260" and nxt != "=":
                return i
    return None


def iter_input_files(input_path: Path) -> Iterable[Path]:
    if input_path.is_file():
        if input_path.suffix.lower() == ".mo":
            yield input_path
        return
    if not input_path.is_dir():
        raise SystemExit(f"input path does not exist: {input_path}")
    search_root = input_path / "Modelica" if (input_path / "Modelica").is_dir() else input_path
    for path in sorted(search_root.rglob("*.mo")):
        if path.is_file():
            yield path


def logical_relative_path(path: Path, root_path: Path) -> str:
    if root_path.is_dir():
        return path.relative_to(root_path).as_posix()
    return path.name


def class_path(within: str, stack: list[str]) -> str | None:
    pieces = [piece for piece in [within.strip("."), *stack] if piece]
    return ".".join(pieces) if pieces else None


def process_file(
    path: Path,
    *,
    root_path: Path,
    snapshot: str,
    release_tag: str,
    commit: str,
) -> tuple[list[dict], dict]:
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        return [], {"rejected_document": True, "reason": f"non-utf8-modelica-source: {exc}"}

    doc_sha = sha256_bytes(raw)
    rel = logical_relative_path(path, root_path)
    within_match = WITHIN_RE.search(text)
    within = within_match.group(1).strip() if within_match else ""
    domain_path = None
    parts = rel.split("/")
    if parts and parts[0] == "Modelica" and len(parts) > 1:
        domain_path = parts[1]

    records: list[dict] = []
    class_stack: list[str] = []
    section: str | None = None
    control_stack: list[str] = []
    in_block_comment = False
    statement_original = ""
    statement_masked = ""
    statement_start_line: int | None = None
    ordinal = 0
    skipped_non_equality = 0
    skipped_calls = 0
    split_depth_round = 0
    split_depth_square = 0
    split_depth_curly = 0

    def flush_statement(original: str, masked: str, start_line: int, end_line: int) -> None:
        nonlocal ordinal, skipped_non_equality, skipped_calls
        if section is None:
            return
        if not masked.strip():
            return
        if EXCLUDED_CALL_RE.match(masked):
            skipped_calls += 1
            return
        eq_index = top_level_equality_index(masked)
        if eq_index is None:
            skipped_non_equality += 1
            return
        original_trimmed = original.strip()
        masked_left_trim = len(original) - len(original.lstrip())
        eq_trimmed = eq_index - masked_left_trim
        if eq_trimmed <= 0 or eq_trimmed >= len(original_trimmed):
            skipped_non_equality += 1
            return
        lhs = original_trimmed[:eq_trimmed].strip()
        rhs = original_trimmed[eq_trimmed + 1 :].strip()
        if not lhs or not rhs:
            skipped_non_equality += 1
            return
        ordinal += 1
        expression_original = original_trimmed + ";"
        expr_sha = sha256_bytes(expression_original.encode("utf-8"))
        current_class = class_path(within, class_stack)
        identity = "\0".join(
            [SOURCE_ID, snapshot, rel, doc_sha, str(ordinal), expr_sha, current_class or "", section]
        )
        record_sha = sha256_bytes(identity.encode("utf-8"))
        blob_path = quote(rel, safe="/")
        url = f"{SOURCE_REPOSITORY}/blob/{commit}/{blob_path}#L{start_line}-L{end_line}"
        locator = f"{rel}:L{start_line}-L{end_line};equation:{ordinal};section:{section}"
        context = [f"Modelica {section} section"]
        if current_class:
            context.append(f"class={current_class}")
        if control_stack:
            context.append("guards=" + " | ".join(control_stack))
        records.append(
            {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": expression_original,
                "expression_encoding": "Modelica equation syntax",
                "source_record_sha256": record_sha,
                "expression_sha256": expr_sha,
                "source_document_id": rel,
                "source_document_url": url,
                "source_locator": locator,
                "source_license": SOURCE_LICENSE,
                "source_license_url": SOURCE_LICENSE_URL,
                "context_text": "; ".join(context),
                "source_document_sha256": doc_sha,
                "source_release_tag": release_tag,
                "source_commit": commit,
                "source_within": within or None,
                "source_class_path": current_class,
                "source_domain_path": domain_path,
                "modelica_section": section,
                "modelica_lhs": lhs,
                "modelica_rhs": rhs,
                "modelica_control_context": list(control_stack),
                "source_line_start": start_line,
                "source_line_end": end_line,
                "source_attested_payload": {
                    "lexical_modelica_preserved": True,
                    "reconstruction_performed": False,
                    "ocr_performed": False,
                    "semantic_flattening_performed": False,
                },
            }
        )

    for line_no, original_line in enumerate(text.splitlines(keepends=True), 1):
        masked_line, in_block_comment = mask_comments_and_strings(original_line, in_block_comment)
        stripped = masked_line.strip()

        # Class boundaries are line-oriented in the MSL style guide. Keep nested class
        # names to make occurrence context stable without attempting semantic flattening.
        class_match = CLASS_RE.match(masked_line)
        if class_match and not stripped.startswith(("end ", "redeclare ", "replaceable ")):
            class_stack.append(class_match.group(2))

        section_match = SECTION_RE.match(stripped)
        if section_match:
            section = "initial-equation" if section_match.group(1) else "equation"
            control_stack.clear()
            statement_original = ""
            statement_masked = ""
            statement_start_line = None
            split_depth_round = split_depth_square = split_depth_curly = 0
            continue

        if section is not None:
            control_end = CONTROL_END_RE.match(stripped)
            if control_end:
                if control_stack:
                    control_stack.pop()
                continue
            alt = CONTROL_ALT_RE.match(stripped)
            if alt:
                if control_stack:
                    control_stack[-1] = stripped
                else:
                    control_stack.append(stripped)
                continue
            if CONTROL_ELSE_RE.match(stripped):
                if control_stack:
                    control_stack[-1] = "else"
                else:
                    control_stack.append("else")
                continue
            opened = CONTROL_OPEN_RE.match(stripped)
            if opened:
                control_stack.append(stripped)
                continue
            if SECTION_END_RE.match(stripped):
                section = None
                control_stack.clear()
                statement_original = ""
                statement_masked = ""
                statement_start_line = None
                split_depth_round = split_depth_square = split_depth_curly = 0
                # Continue below so named class end on this line can still be processed.
            elif stripped:
                if statement_start_line is None:
                    statement_start_line = line_no
                start = 0
                for i, ch in enumerate(masked_line):
                    if ch == "(":
                        split_depth_round += 1
                    elif ch == ")":
                        split_depth_round = max(0, split_depth_round - 1)
                    elif ch == "[":
                        split_depth_square += 1
                    elif ch == "]":
                        split_depth_square = max(0, split_depth_square - 1)
                    elif ch == "{":
                        split_depth_curly += 1
                    elif ch == "}":
                        split_depth_curly = max(0, split_depth_curly - 1)
                    elif ch == ";" and split_depth_round == split_depth_square == split_depth_curly == 0:
                        statement_original += original_line[start:i]
                        statement_masked += masked_line[start:i]
                        flush_statement(statement_original, statement_masked, statement_start_line, line_no)
                        statement_original = ""
                        statement_masked = ""
                        statement_start_line = line_no if masked_line[i + 1 :].strip() else None
                        start = i + 1
                tail_original = original_line[start:]
                tail_masked = masked_line[start:]
                if statement_start_line is not None or tail_masked.strip():
                    if statement_start_line is None:
                        statement_start_line = line_no
                    statement_original += tail_original
                    statement_masked += tail_masked
                if statement_start_line is not None and not statement_masked.strip():
                    statement_start_line = None
                    statement_original = ""
                    statement_masked = ""

        end_match = END_NAMED_RE.match(stripped)
        if end_match and class_stack and end_match.group(1) == class_stack[-1]:
            class_stack.pop()
            if not class_stack:
                section = None
                control_stack.clear()

    return records, {
        "rejected_document": False,
        "records_written": len(records),
        "skipped_non_equality": skipped_non_equality,
        "skipped_calls": skipped_calls,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path, help="MSL checkout, subtree, or .mo file")
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--release-tag", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--limit-files", type=int)
    args = parser.parse_args()
    if args.limit_files is not None and args.limit_files < 1:
        parser.error("--limit-files must be positive")

    metrics = {
        "files_seen": 0,
        "documents_rejected": 0,
        "records_written": 0,
        "skipped_non_equality": 0,
        "skipped_calls": 0,
        "rejection_reasons": {},
        "ocr_performed": 0,
        "reconstructions": 0,
    }
    for path in iter_input_files(args.input):
        if args.limit_files is not None and metrics["files_seen"] >= args.limit_files:
            break
        metrics["files_seen"] += 1
        records, info = process_file(
            path,
            root_path=args.input,
            snapshot=args.snapshot,
            release_tag=args.release_tag,
            commit=args.commit,
        )
        if info.get("rejected_document"):
            metrics["documents_rejected"] += 1
            reason = str(info.get("reason"))
            metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
            continue
        metrics["skipped_non_equality"] += int(info.get("skipped_non_equality", 0))
        metrics["skipped_calls"] += int(info.get("skipped_calls", 0))
        for record in records:
            sys.stdout.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
            metrics["records_written"] += 1
    sys.stderr.write(json.dumps(metrics, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
