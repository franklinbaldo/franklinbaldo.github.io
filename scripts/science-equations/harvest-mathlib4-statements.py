#!/usr/bin/env python3
"""Harvest explicit theorem/lemma proposition statements from a pinned mathlib4 checkout.

Persistent Atlas lake output is Apache Parquet; this adapter emits JSONL transport only.
The extractor is deliberately conservative: it emits only theorem/lemma declarations whose
proposition is explicitly written before the top-level `:=` proof delimiter. It never translates
Lean syntax to LaTeX and never treats proof bodies as equation occurrences.
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

SOURCE_ID = "mathlib4-formal-statements"
SOURCE_LICENSE = "Apache-2.0"
SOURCE_LICENSE_URL = "https://github.com/leanprover-community/mathlib4/blob/master/LICENSE"
SOURCE_REPOSITORY = "https://github.com/leanprover-community/mathlib4"
DECL_RE = re.compile(r"(?<![A-Za-z0-9_'])\b(theorem|lemma)\b(?![A-Za-z0-9_'])")
HEX40_RE = re.compile(r"[0-9a-f]{40}")
HEX64_RE = re.compile(r"[0-9a-f]{64}")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def mask_lean(text: str) -> tuple[str, dict[str, int]]:
    """Mask comments, strings, raw strings, char literals and syntax quotations.

    The returned string preserves length/newlines so offsets and line numbers remain stable.
    Lean nested block comments are handled. Syntax quotations starting with `` `(`` are masked
    conservatively to avoid harvesting quoted command syntax from metaprogramming files.
    """
    out = list(text)
    n = len(text)
    i = 0
    stats = {"block_comments": 0, "line_comments": 0, "strings": 0, "raw_strings": 0, "syntax_quotes": 0}

    def blank(a: int, b: int) -> None:
        for j in range(a, min(b, n)):
            if text[j] not in "\r\n":
                out[j] = " "

    while i < n:
        if text.startswith("/-", i):
            stats["block_comments"] += 1
            start = i
            depth = 1
            i += 2
            while i < n and depth:
                if text.startswith("/-", i):
                    depth += 1
                    i += 2
                elif text.startswith("-/", i):
                    depth -= 1
                    i += 2
                else:
                    i += 1
            blank(start, i)
            continue
        if text.startswith("--", i):
            stats["line_comments"] += 1
            start = i
            end = text.find("\n", i)
            i = n if end < 0 else end
            blank(start, i)
            continue
        if text.startswith("`(", i):
            stats["syntax_quotes"] += 1
            start = i
            depth = 1
            i += 2
            while i < n and depth:
                if text.startswith("/-", i):
                    cdepth = 1
                    i += 2
                    while i < n and cdepth:
                        if text.startswith("/-", i):
                            cdepth += 1
                            i += 2
                        elif text.startswith("-/", i):
                            cdepth -= 1
                            i += 2
                        else:
                            i += 1
                    continue
                if text.startswith("--", i):
                    end = text.find("\n", i)
                    i = n if end < 0 else end
                    continue
                if text[i] == '"':
                    i += 1
                    while i < n:
                        if text[i] == "\\" and i + 1 < n:
                            i += 2
                        elif text[i] == '"':
                            i += 1
                            break
                        else:
                            i += 1
                    continue
                if text[i] == "(":
                    depth += 1
                elif text[i] == ")":
                    depth -= 1
                i += 1
            blank(start, i)
            continue
        if text[i] == "`" and i + 1 < n and (text[i + 1].isalpha() or text[i + 1] in "_«"):
            start = i
            i += 1
            if i < n and text[i] == "«":
                end = text.find("»", i + 1)
                i = n if end < 0 else end + 1
            else:
                while i < n and (text[i].isalnum() or text[i] in "_'."):
                    i += 1
            blank(start, i)
            continue
        if text[i] == "r":
            m = re.match(r'r(#+)?"', text[i:])
            if m and (i == 0 or not (text[i - 1].isalnum() or text[i - 1] in "_'") ):
                stats["raw_strings"] += 1
                hashes = m.group(1) or ""
                start = i
                i += len(m.group(0))
                terminator = '"' + hashes
                end = text.find(terminator, i)
                i = n if end < 0 else end + len(terminator)
                blank(start, i)
                continue
        if text[i] == '"':
            stats["strings"] += 1
            start = i
            i += 1
            while i < n:
                if text[i] == "\\" and i + 1 < n:
                    i += 2
                elif text[i] == '"':
                    i += 1
                    break
                else:
                    i += 1
            blank(start, i)
            continue
        if text[i] == "'":
            # Mask character literals only when a closing quote is nearby. Identifier primes are
            # left untouched (e.g. f').
            end = i + 1
            escaped = False
            while end < min(n, i + 8):
                ch = text[end]
                if ch in "\r\n":
                    break
                if not escaped and ch == "'":
                    blank(i, end + 1)
                    i = end + 1
                    break
                if not escaped and ch == "\\":
                    escaped = True
                else:
                    escaped = False
                end += 1
            else:
                i += 1
            if i == end + 1:
                continue
        i += 1
    return "".join(out), stats


def top_level_positions(masked: str, start: int, stop: int) -> tuple[int | None, int | None]:
    """Find declaration result colon and proof `:=` at top delimiter depth."""
    round_depth = square_depth = curly_depth = 0
    colon: int | None = None
    i = start
    while i < stop:
        ch = masked[i]
        if ch == "(":
            round_depth += 1
        elif ch == ")":
            round_depth = max(0, round_depth - 1)
        elif ch == "[":
            square_depth += 1
        elif ch == "]":
            square_depth = max(0, square_depth - 1)
        elif ch == "{":
            curly_depth += 1
        elif ch == "}":
            curly_depth = max(0, curly_depth - 1)
        elif round_depth == square_depth == curly_depth == 0:
            if ch == ":" and i + 1 < stop and masked[i + 1] == "=":
                return colon, i
            if ch == ":" and colon is None:
                colon = i
        i += 1
    return colon, None


def parse_declaration_name(masked: str, original: str, cursor: int) -> tuple[str, int] | None:
    while cursor < len(masked) and masked[cursor].isspace():
        cursor += 1
    if cursor >= len(masked):
        return None
    if original[cursor] == "«":
        end = original.find("»", cursor + 1)
        if end < 0:
            return None
        return original[cursor:end + 1], end + 1
    start = cursor
    while cursor < len(masked) and not masked[cursor].isspace() and masked[cursor] not in "(:={[,:":
        cursor += 1
    if cursor == start:
        return None
    return original[start:cursor], cursor


def next_declaration_start(matches: list[re.Match[str]], idx: int, text_len: int) -> int:
    return matches[idx + 1].start() if idx + 1 < len(matches) else text_len


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def iter_input_files(root: Path) -> Iterable[Path]:
    if not root.is_dir():
        raise SystemExit(f"input path is not a directory: {root}")
    mathlib = root / "Mathlib"
    if not mathlib.is_dir():
        raise SystemExit(f"verified mathlib4 checkout must contain Mathlib/: {root}")
    for path in sorted(mathlib.rglob("*.lean")):
        if path.is_file():
            yield path


def verify_license(root: Path) -> str:
    license_path = root / "LICENSE"
    if not license_path.is_file():
        raise SystemExit("mathlib4 checkout is missing root LICENSE")
    raw = license_path.read_bytes()
    text = raw.decode("utf-8", errors="replace")
    if "Apache License" not in text or "Version 2.0" not in text:
        raise SystemExit("mathlib4 root LICENSE does not match expected Apache-2.0 evidence")
    return sha256_bytes(raw)


def validate_snapshot(snapshot: str, commit: str) -> None:
    if not HEX40_RE.fullmatch(commit):
        raise SystemExit("--commit must be a full lowercase 40-hex Git commit")
    prefix = f"mathlib4:git:{commit}:inventory-sha256:"
    if not snapshot.startswith(prefix):
        raise SystemExit("--snapshot must bind the exact --commit using mathlib4:git:<commit>:inventory-sha256:<digest>")
    digest = snapshot[len(prefix):]
    if not HEX64_RE.fullmatch(digest):
        raise SystemExit("--snapshot inventory digest must be 64 lowercase hex characters")


def process_file(path: Path, *, root: Path, snapshot: str, commit: str, license_sha: str) -> tuple[list[dict], dict]:
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        return [], {"rejected_document": True, "reason": f"non-utf8-lean-source: {exc}"}

    masked, mask_stats = mask_lean(text)
    matches = list(DECL_RE.finditer(masked))
    rel = path.relative_to(root).as_posix()
    doc_sha = sha256_bytes(raw)
    parts = rel.split("/")
    domain = parts[1] if len(parts) > 2 and parts[0] == "Mathlib" else None

    rows: list[dict] = []
    rejected_no_explicit_statement = 0
    ordinal = 0
    for idx, match in enumerate(matches):
        kind = match.group(1)
        parsed_name = parse_declaration_name(masked, text, match.end())
        if parsed_name is None:
            rejected_no_explicit_statement += 1
            continue
        name, name_end = parsed_name
        scan_stop = next_declaration_start(matches, idx, len(masked))
        colon, assign = top_level_positions(masked, name_end, scan_stop)
        if colon is None or assign is None or colon >= assign:
            rejected_no_explicit_statement += 1
            continue
        proposition = text[colon + 1:assign].strip()
        if not proposition or proposition.startswith("let "):
            # A top-level `let x := ...` in the proposition is ambiguous to a lexical
            # extractor because its assignment token can look like the proof delimiter.
            # Fail closed; a future parser-backed lane can recover these declarations.
            rejected_no_explicit_statement += 1
            continue
        header = text[match.start():assign].strip()
        ordinal += 1
        prop_sha = sha256_bytes(proposition.encode("utf-8"))
        identity = "\0".join([
            SOURCE_ID, snapshot, rel, doc_sha, str(ordinal), kind, name, prop_sha,
        ])
        record_sha = sha256_bytes(identity.encode("utf-8"))
        line_start = line_number(text, match.start())
        line_end = line_number(text, max(match.start(), assign - 1))
        blob_path = quote(rel, safe="/")
        url = f"{SOURCE_REPOSITORY}/blob/{commit}/{blob_path}#L{line_start}-L{line_end}"
        rows.append({
            "schema_version": 1,
            "source_id": SOURCE_ID,
            "source_snapshot": snapshot,
            "provenance_class": "attested",
            "expression_original": proposition,
            "expression_encoding": "Lean 4 proposition syntax",
            "source_record_sha256": record_sha,
            "expression_sha256": prop_sha,
            "source_document_id": rel,
            "source_document_url": url,
            "source_locator": f"{rel}:L{line_start}-L{line_end};{kind}:{name};ordinal:{ordinal}",
            "source_license": SOURCE_LICENSE,
            "source_license_url": SOURCE_LICENSE_URL,
            "source_license_sha256": license_sha,
            "source_document_sha256": doc_sha,
            "source_commit": commit,
            "source_domain_path": domain,
            "source_declaration_kind": kind,
            "source_declaration_name": name,
            "source_declaration_header": header,
            "source_line_start": line_start,
            "source_line_end": line_end,
            "context_text": f"mathlib4 {kind} {name}; domain={domain or 'root'}",
            "source_attested_payload": {
                "lean_proposition_preserved": True,
                "proof_body_excluded": True,
                "reconstruction_performed": False,
                "ocr_performed": False,
                "latex_translation_performed": False,
            },
        })
    return rows, {
        "rejected_document": False,
        "declarations_seen": len(matches),
        "records_written": len(rows),
        "rejected_no_explicit_statement": rejected_no_explicit_statement,
        **{f"masked_{k}": v for k, v in mask_stats.items()},
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path, help="verified mathlib4 repository checkout")
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--limit-files", type=int)
    args = parser.parse_args()
    if args.limit_files is not None and args.limit_files < 1:
        parser.error("--limit-files must be positive")
    validate_snapshot(args.snapshot, args.commit)
    license_sha = verify_license(args.input)

    metrics = {
        "files_seen": 0,
        "documents_rejected": 0,
        "declarations_seen": 0,
        "records_written": 0,
        "rejected_no_explicit_statement": 0,
        "masked_block_comments": 0,
        "masked_line_comments": 0,
        "masked_strings": 0,
        "masked_raw_strings": 0,
        "masked_syntax_quotes": 0,
        "rejection_reasons": {},
        "ocr_performed": 0,
        "reconstructions": 0,
    }
    for path in iter_input_files(args.input):
        if args.limit_files is not None and metrics["files_seen"] >= args.limit_files:
            break
        metrics["files_seen"] += 1
        rows, info = process_file(path, root=args.input, snapshot=args.snapshot, commit=args.commit, license_sha=license_sha)
        if info.get("rejected_document"):
            metrics["documents_rejected"] += 1
            reason = info.get("reason", "unknown")
            metrics["rejection_reasons"][reason] = metrics["rejection_reasons"].get(reason, 0) + 1
            continue
        for key in [
            "declarations_seen", "records_written", "rejected_no_explicit_statement",
            "masked_block_comments", "masked_line_comments", "masked_strings",
            "masked_raw_strings", "masked_syntax_quotes",
        ]:
            metrics[key] += int(info.get(key, 0))
        for row in rows:
            print(json.dumps(row, ensure_ascii=False, sort_keys=True))
    print(json.dumps(metrics, ensure_ascii=False, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
