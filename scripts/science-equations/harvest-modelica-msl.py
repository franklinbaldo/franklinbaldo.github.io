#!/usr/bin/env python3
"""Harvest explicit Modelica equation-section statements from Modelica Standard Library sources.

Persistent lake output is Parquet; this adapter emits JSONL transport only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Iterable

SOURCE_ID = "modelica-msl-equations"
SOURCE_LICENSE = "BSD-3-Clause"
SNAPSHOT_RE = re.compile(
    r"^modelica-msl:git:(?P<commit>[0-9a-f]{40}):inventory-sha256:(?P<inventory>[0-9a-f]{64})$"
)
SECTION_EVENT_RE = re.compile(
    r"""
    (?P<initial_equation>\binitial\s+equation\b)
    |(?P<initial_algorithm>\binitial\s+algorithm\b)
    |(?P<equation>\bequation\b)
    |(?P<algorithm>\balgorithm\b)
    |(?P<semicolon>;)
    """,
    re.IGNORECASE | re.VERBOSE,
)
WITHIN_RE = re.compile(r"\bwithin\s+([^;]+);", re.IGNORECASE)
CLASS_RE = re.compile(
    r"\b(?P<kind>model|block|connector|record|class|package|function|type|operator\s+record|operator\s+function)"
    r"\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)\b",
    re.IGNORECASE,
)
GENERIC_END_RE = re.compile(r"^\s*end\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*;\s*$", re.IGNORECASE | re.DOTALL)
CONTROL_END_RE = re.compile(r"^\s*end\s+(?P<kind>if|when|for)\s*;\s*$", re.IGNORECASE | re.DOTALL)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def mask_non_code(text: str) -> str:
    """Mask comments and strings while preserving text length and newlines."""
    chars = list(text)
    out = list(text)
    n = len(text)
    i = 0
    state = "code"
    while i < n:
        ch = chars[i]
        nxt = chars[i + 1] if i + 1 < n else ""
        if state == "code":
            if ch == "/" and nxt == "/":
                out[i] = out[i + 1] = " "
                i += 2
                state = "line_comment"
                continue
            if ch == "/" and nxt == "*":
                out[i] = out[i + 1] = " "
                i += 2
                state = "block_comment"
                continue
            if ch == '"':
                out[i] = " "
                i += 1
                state = "string"
                continue
            i += 1
            continue
        if state == "line_comment":
            if ch == "\n":
                state = "code"
                i += 1
            else:
                out[i] = " "
                i += 1
            continue
        if state == "block_comment":
            if ch == "*" and nxt == "/":
                out[i] = out[i + 1] = " "
                i += 2
                state = "code"
            else:
                if ch != "\n":
                    out[i] = " "
                i += 1
            continue
        if state == "string":
            if ch == "\\" and i + 1 < n:
                if ch != "\n":
                    out[i] = " "
                if chars[i + 1] != "\n":
                    out[i + 1] = " "
                i += 2
                continue
            if ch == '"':
                out[i] = " "
                i += 1
                state = "code"
            else:
                if ch != "\n":
                    out[i] = " "
                i += 1
            continue
    return "".join(out)


def iter_modelica_files(input_dir: Path) -> Iterable[Path]:
    if not input_dir.is_dir():
        raise SystemExit(f"input must be the Modelica/ directory from an MSL checkout: {input_dir}")
    for path in sorted(input_dir.rglob("*.mo")):
        if path.is_file():
            yield path


def line_number(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def class_context(masked: str, before: int) -> tuple[str | None, str | None]:
    matches = list(CLASS_RE.finditer(masked, 0, before))
    if not matches:
        return None, None
    match = matches[-1]
    return re.sub(r"\s+", " ", match.group("kind").lower()), match.group("name")


def within_context(masked: str) -> str | None:
    match = WITHIN_RE.search(masked[: min(len(masked), 4096)])
    if not match:
        return None
    value = re.sub(r"\s+", " ", match.group(1)).strip()
    return value or None


def find_control_header(code: str, pos: int, keyword: str, terminator: str) -> re.Match[str] | None:
    pattern = re.compile(
        rf"\s*{keyword}\b(?P<body>.*?)\b{terminator}\b",
        re.IGNORECASE | re.DOTALL,
    )
    return pattern.match(code, pos)


def peel_control_prefixes(masked_chunk: str, raw_chunk: str, stack: list[dict[str, str]]) -> int:
    """Update control stack and return the offset where the equation leaf begins."""
    pos = 0
    while True:
        ws = re.match(r"\s*", masked_chunk[pos:])
        if ws:
            pos += ws.end()
        rest = masked_chunk[pos:]
        lowered = rest.lower()

        def capture(match: re.Match[str], kind: str, replace_kind: str | None = None) -> None:
            nonlocal pos
            absolute_end = pos + match.end()
            original = raw_chunk[pos:absolute_end].strip()
            normalized = re.sub(r"\s+", " ", masked_chunk[pos:absolute_end]).strip()
            if replace_kind:
                for idx in range(len(stack) - 1, -1, -1):
                    if stack[idx]["kind"] == replace_kind:
                        stack[idx] = {"kind": replace_kind, "original": original, "normalized": normalized}
                        break
            else:
                stack.append({"kind": kind, "original": original, "normalized": normalized})
            pos = absolute_end

        if re.match(r"elseif\b", lowered):
            match = find_control_header(masked_chunk, pos, "elseif", "then")
            if match:
                capture(match, "if", replace_kind="if")
                continue
        if re.match(r"elsewhen\b", lowered):
            match = find_control_header(masked_chunk, pos, "elsewhen", "then")
            if match:
                capture(match, "when", replace_kind="when")
                continue
        if re.match(r"else\b", lowered):
            match = re.match(r"\s*else\b", masked_chunk[pos:], re.IGNORECASE | re.DOTALL)
            if match:
                absolute_end = pos + match.end()
                original = raw_chunk[pos:absolute_end].strip()
                normalized = re.sub(r"\s+", " ", masked_chunk[pos:absolute_end]).strip()
                for idx in range(len(stack) - 1, -1, -1):
                    if stack[idx]["kind"] == "if":
                        stack[idx] = {"kind": "if", "original": original, "normalized": normalized}
                        break
                pos = absolute_end
                continue
        if re.match(r"if\b", lowered):
            match = find_control_header(masked_chunk, pos, "if", "then")
            if match:
                capture(match, "if")
                continue
        if re.match(r"when\b", lowered):
            match = find_control_header(masked_chunk, pos, "when", "then")
            if match:
                capture(match, "when")
                continue
        if re.match(r"for\b", lowered):
            match = find_control_header(masked_chunk, pos, "for", "loop")
            if match:
                capture(match, "for")
                continue
        return pos


def classify_equation(masked_leaf: str) -> str:
    code = re.sub(r"\s+", " ", masked_leaf).strip()
    if re.match(r"connect\s*\(", code, re.IGNORECASE):
        return "connect-equation"
    if re.match(r"reinit\s*\(", code, re.IGNORECASE):
        return "reinit-equation"
    if re.match(r"assert\s*\(", code, re.IGNORECASE):
        return "assert-equation"
    if re.match(r"terminate\s*\(", code, re.IGNORECASE):
        return "terminate-equation"
    if re.search(r"(?<![<>=:])=(?!=)", code):
        return "equality-equation"
    if re.match(r"[A-Za-z_][A-Za-z0-9_.]*\s*\(", code):
        return "function-call-equation"
    return "other-equation"


def process_file(path: Path, *, input_dir: Path, snapshot: str, commit: str) -> tuple[list[dict], dict]:
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        return [], {"rejected_document": True, "reason": f"utf8-decode-error: {exc}"}

    masked = mask_non_code(text)
    document_sha = sha256_bytes(raw)
    relative = path.relative_to(input_dir).as_posix()
    repo_path = f"Modelica/{relative}"
    within = within_context(masked)

    records: list[dict] = []
    state: str | None = None
    cursor: int | None = None
    section_index = 0
    statement_index = 0
    equation_sections_seen = 0
    statements_seen = 0
    structural_skipped = 0
    control_stack: list[dict[str, str]] = []

    for event in SECTION_EVENT_RE.finditer(masked):
        kind = event.lastgroup
        if state is None:
            if kind in {"equation", "initial_equation"}:
                state = "initial equation" if kind == "initial_equation" else "equation"
                cursor = event.end()
                section_index += 1
                statement_index = 0
                equation_sections_seen += 1
                control_stack = []
            continue

        if kind in {"algorithm", "initial_algorithm"}:
            state = None
            cursor = None
            control_stack = []
            continue

        if kind in {"equation", "initial_equation"}:
            state = "initial equation" if kind == "initial_equation" else "equation"
            cursor = event.end()
            section_index += 1
            statement_index = 0
            equation_sections_seen += 1
            control_stack = []
            continue

        if kind != "semicolon" or cursor is None:
            continue

        statements_seen += 1
        raw_chunk = text[cursor : event.end()]
        masked_chunk = masked[cursor : event.end()]
        if not masked_chunk.strip():
            cursor = event.end()
            continue

        end_control = CONTROL_END_RE.match(masked_chunk)
        if end_control:
            target = end_control.group("kind").lower()
            for idx in range(len(control_stack) - 1, -1, -1):
                if control_stack[idx]["kind"] == target:
                    del control_stack[idx:]
                    break
            structural_skipped += 1
            cursor = event.end()
            continue

        if GENERIC_END_RE.match(masked_chunk):
            structural_skipped += 1
            state = None
            cursor = None
            control_stack = []
            continue

        if re.match(r"^\s*annotation\b", masked_chunk, re.IGNORECASE):
            structural_skipped += 1
            state = None
            cursor = None
            control_stack = []
            continue

        body_offset = peel_control_prefixes(masked_chunk[:-1], raw_chunk[:-1], control_stack)
        body_masked = masked_chunk[body_offset:]
        body_raw = raw_chunk[body_offset:]
        leading = len(body_masked) - len(body_masked.lstrip())
        body_offset += leading
        body_masked = masked_chunk[body_offset:]
        body_raw = raw_chunk[body_offset:]
        if not body_masked.strip().strip(";").strip():
            structural_skipped += 1
            cursor = event.end()
            continue

        statement_index += 1
        abs_start = cursor + body_offset
        expression_original = body_raw.rstrip()
        if not expression_original.endswith(";"):
            expression_original += ";"
        expr_sha = sha256_bytes(expression_original.encode("utf-8"))
        class_kind, class_name = class_context(masked, abs_start)
        qualified_class = ".".join(part for part in [within, class_name] if part)
        start_line = line_number(text, abs_start)
        end_line = line_number(text, event.end() - 1)
        equation_form = classify_equation(body_masked)

        identity = "\0".join(
            [SOURCE_ID, snapshot, repo_path, document_sha, str(abs_start), str(event.end()), expr_sha, state]
        )
        source_record_sha256 = sha256_bytes(identity.encode("utf-8"))
        locator = (
            f"lines:{start_line}-{end_line};section:{section_index};statement:{statement_index};"
            f"offset:{abs_start}-{event.end()}"
        )
        context_parts = [
            f"Modelica {state}",
            f"file={repo_path}",
            f"lines={start_line}-{end_line}",
        ]
        if qualified_class:
            context_parts.append(f"class={qualified_class}")
        if control_stack:
            context_parts.append("control=" + " > ".join(item["normalized"] for item in control_stack))

        records.append(
            {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": expression_original,
                "expression_encoding": "Modelica",
                "source_record_sha256": source_record_sha256,
                "expression_sha256": expr_sha,
                "source_document_id": repo_path,
                "source_document_url": f"https://github.com/modelica/ModelicaStandardLibrary/blob/{commit}/{repo_path}",
                "source_locator": locator,
                "source_license": SOURCE_LICENSE,
                "source_license_url": f"https://github.com/modelica/ModelicaStandardLibrary/blob/{commit}/LICENSE",
                "context_text": "; ".join(context_parts),
                "source_repository": "https://github.com/modelica/ModelicaStandardLibrary",
                "source_commit": commit,
                "source_document_sha256": document_sha,
                "modelica_within": within,
                "modelica_class_kind": class_kind,
                "modelica_class_name": class_name,
                "modelica_qualified_class": qualified_class or None,
                "equation_section": state,
                "equation_form": equation_form,
                "line_start": start_line,
                "line_end": end_line,
                "control_depth": len(control_stack),
                "control_context": [item["normalized"] for item in control_stack],
                "control_context_original": [item["original"] for item in control_stack],
                "source_attested_payload": {
                    "lexical_modelica_preserved": True,
                    "reconstruction_performed": False,
                    "ocr_performed": False,
                    "flattening_performed": False,
                    "symbolic_rewrite_performed": False,
                },
            }
        )
        cursor = event.end()

    return records, {
        "rejected_document": False,
        "equation_sections_seen": equation_sections_seen,
        "statements_seen": statements_seen,
        "structural_statements_skipped": structural_skipped,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Modelica/ directory from an exact Modelica Standard Library checkout",
    )
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--commit", required=True, help="exact 40-hex MSL Git commit")
    parser.add_argument("--limit-files", type=int)
    args = parser.parse_args()

    if not re.fullmatch(r"[0-9a-f]{40}", args.commit):
        parser.error("--commit must be a lowercase 40-hex Git commit")
    snapshot_match = SNAPSHOT_RE.fullmatch(args.snapshot)
    if not snapshot_match:
        parser.error("--snapshot must be modelica-msl:git:<40hex>:inventory-sha256:<64hex>")
    if snapshot_match.group("commit") != args.commit:
        parser.error("--snapshot commit must match --commit")
    if args.limit_files is not None and args.limit_files < 1:
        parser.error("--limit-files must be positive")

    metrics = {
        "files_seen": 0,
        "documents_rejected": 0,
        "equation_sections_seen": 0,
        "statements_seen": 0,
        "structural_statements_skipped": 0,
        "records_written": 0,
        "ocr_performed": 0,
        "reconstructions": 0,
        "flattening_performed": 0,
        "rejection_reasons": {},
    }

    for path in iter_modelica_files(args.input):
        if args.limit_files is not None and metrics["files_seen"] >= args.limit_files:
            break
        metrics["files_seen"] += 1
        records, info = process_file(path, input_dir=args.input, snapshot=args.snapshot, commit=args.commit)
        if info.get("rejected_document"):
            metrics["documents_rejected"] += 1
            reason = str(info.get("reason"))
            metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
            continue
        metrics["equation_sections_seen"] += int(info.get("equation_sections_seen", 0))
        metrics["statements_seen"] += int(info.get("statements_seen", 0))
        metrics["structural_statements_skipped"] += int(info.get("structural_statements_skipped", 0))
        for record in records:
            sys.stdout.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
            metrics["records_written"] += 1

    sys.stderr.write(json.dumps(metrics, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
