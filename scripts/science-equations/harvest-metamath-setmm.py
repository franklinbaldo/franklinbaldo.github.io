#!/usr/bin/env python3
"""Harvest attested relation-bearing assertions from Metamath Proof Explorer set.mm."""

from __future__ import annotations

import argparse
import bisect
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

SOURCE_ID = "metamath-setmm-relations"
SOURCE_NAME = "Metamath Proof Explorer set.mm — formal relation assertions"
SOURCE_LICENSE = "CC0-1.0"
DEFAULT_RELATION_TOKENS = ("=", "=/=", "<", "<_", ">", ">_", "e.", "e/", "C_", "C/_")
SPECIALS = ("$(", "$)", "${", "$}", "$[", "$]", "$c", "$v", "$d", "$f", "$e", "$a", "$p", "$=", "$.")
TOKEN_RE = re.compile(
    r"\$\(.*?\$\)|\$\{|\$\}|\$\[|\$\]|\$c|\$v|\$d|\$f|\$e|\$a|\$p|\$=|\$\.|[^\s$]+",
    re.DOTALL,
)


@dataclass(frozen=True)
class Token:
    text: str
    start: int
    end: int
    comment: bool = False


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_sha256(value: object) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256_text(payload)


def scan(text: str) -> list[Token]:
    tokens: list[Token] = []
    for match in TOKEN_RE.finditer(text):
        raw = match.group(0)
        tokens.append(Token(raw, match.start(), match.end(), raw.startswith("$(")))
    # Fail closed if a dollar sign is not covered by a Metamath token/directive.
    covered = [False] * len(text)
    for tok in tokens:
        for idx in range(tok.start, tok.end):
            covered[idx] = True
    for idx, ch in enumerate(text):
        if ch == "$" and not covered[idx]:
            raise ValueError(f"unrecognized Metamath dollar directive near byte {idx}")
    return tokens


def line_starts(text: str) -> list[int]:
    starts = [0]
    starts.extend(match.end() for match in re.finditer("\n", text))
    return starts


def line_number(starts: list[int], offset: int) -> int:
    return bisect.bisect_right(starts, offset)


def clean_comment(raw: str | None) -> str | None:
    if not raw:
        return None
    body = raw[2:-2]
    return body.strip() or None


def exact_between(text: str, semantic: list[Token]) -> str:
    if not semantic:
        return ""
    return text[semantic[0].start : semantic[-1].end]


def parse_expression(tokens: list[Token], idx: int, terminators: set[str]) -> tuple[list[Token], int, str]:
    semantic: list[Token] = []
    while idx < len(tokens):
        tok = tokens[idx]
        if tok.comment:
            idx += 1
            continue
        if tok.text in terminators:
            return semantic, idx, tok.text
        semantic.append(tok)
        idx += 1
    raise ValueError(f"unterminated expression; expected one of {sorted(terminators)}")


def iter_records(text: str, snapshot: str, commit: str, relation_tokens: tuple[str, ...]) -> tuple[list[dict], dict]:
    tokens = scan(text)
    starts = line_starts(text)
    document_sha = sha256_text(text)
    metrics = {
        "files_seen": 1,
        "assertions_seen": 0,
        "axioms_seen": 0,
        "theorems_seen": 0,
        "records_written": 0,
        "filtered_nonlogical": 0,
        "filtered_no_relation": 0,
        "includes_seen": 0,
        "documents_rejected": 0,
        "ocr_performed": 0,
        "reconstructions": 0,
    }
    active_f: list[dict] = []
    active_e: list[dict] = []
    active_d: list[list[str]] = []
    scopes: list[tuple[int, int, int]] = []
    records: list[dict] = []
    idx = 0
    pending_comment: str | None = None

    def skip_comments(pos: int) -> int:
        nonlocal pending_comment
        while pos < len(tokens) and tokens[pos].comment:
            pending_comment = tokens[pos].text
            pos += 1
        return pos

    while idx < len(tokens):
        idx = skip_comments(idx)
        if idx >= len(tokens):
            break
        tok = tokens[idx]

        if tok.text == "${":
            scopes.append((len(active_f), len(active_e), len(active_d)))
            idx += 1
            continue
        if tok.text == "$}":
            if not scopes:
                raise ValueError("scope close without matching scope open")
            nf, ne, nd = scopes.pop()
            del active_f[nf:]
            del active_e[ne:]
            del active_d[nd:]
            idx += 1
            pending_comment = None
            continue
        if tok.text == "$[":
            metrics["includes_seen"] += 1
            raise ValueError("$[ include directive encountered; set.mm lane requires one self-contained pinned set.mm file")
        if tok.text in {"$c", "$v", "$d"}:
            kind = tok.text
            expr, end_idx, terminator = parse_expression(tokens, idx + 1, {"$."})
            if terminator != "$.":
                raise AssertionError(terminator)
            if kind == "$d":
                variables = [item.text for item in expr]
                if len(variables) >= 2:
                    active_d.append(variables)
            idx = end_idx + 1
            pending_comment = None
            continue
        if tok.text in SPECIALS:
            raise ValueError(f"unexpected directive {tok.text} at line {line_number(starts, tok.start)}")

        # Labeled statements: <label> $f/$e/$a/$p ...
        label_tok = tok
        label = tok.text
        statement_comment = pending_comment
        idx = skip_comments(idx + 1)
        if idx >= len(tokens) or tokens[idx].text not in {"$f", "$e", "$a", "$p"}:
            got = tokens[idx].text if idx < len(tokens) else "EOF"
            raise ValueError(f"label {label!r} not followed by $f/$e/$a/$p (got {got!r})")
        directive_tok = tokens[idx]
        directive = directive_tok.text
        if directive in {"$f", "$e", "$a"}:
            expr, end_idx, terminator = parse_expression(tokens, idx + 1, {"$."})
            proof_semantic: list[Token] = []
        else:
            expr, proof_start_idx, terminator = parse_expression(tokens, idx + 1, {"$="})
            proof_semantic, end_idx, proof_terminator = parse_expression(tokens, proof_start_idx + 1, {"$."})
            if terminator != "$=" or proof_terminator != "$.":
                raise AssertionError((terminator, proof_terminator))

        expr_tokens = [item.text for item in expr]
        expr_original = exact_between(text, expr)
        if directive == "$f":
            if len(expr_tokens) != 2:
                raise ValueError(f"floating hypothesis {label!r} must contain exactly two tokens")
            active_f.append(
                {
                    "label": label,
                    "typecode": expr_tokens[0],
                    "variable": expr_tokens[1],
                    "expression_original": expr_original,
                    "expression_tokens": expr_tokens,
                }
            )
        elif directive == "$e":
            active_e.append(
                {
                    "label": label,
                    "expression_original": expr_original,
                    "expression_tokens": expr_tokens,
                }
            )
        else:
            metrics["assertions_seen"] += 1
            if directive == "$a":
                metrics["axioms_seen"] += 1
            else:
                metrics["theorems_seen"] += 1
            if not expr_tokens or expr_tokens[0] != "|-":
                metrics["filtered_nonlogical"] += 1
            else:
                found_relations = []
                seen = set()
                for symbol in expr_tokens:
                    if symbol in relation_tokens and symbol not in seen:
                        seen.add(symbol)
                        found_relations.append(symbol)
                if not found_relations:
                    metrics["filtered_no_relation"] += 1
                else:
                    referenced = set(expr_tokens)
                    for hypothesis in active_e:
                        referenced.update(hypothesis["expression_tokens"])
                    floating = [item for item in active_f if item["variable"] in referenced]
                    distinct = []
                    for constraint in active_d:
                        relevant = [variable for variable in constraint if variable in referenced]
                        if len(relevant) >= 2:
                            distinct.append(relevant)
                    proof_original = exact_between(text, proof_semantic) if directive == "$p" else None
                    line_start = line_number(starts, label_tok.start)
                    end_tok = expr[-1] if expr else directive_tok
                    line_end = line_number(starts, end_tok.end - 1)
                    record_identity = {
                        "source_id": SOURCE_ID,
                        "source_snapshot": snapshot,
                        "source_document_id": "set.mm",
                        "source_document_sha256": document_sha,
                        "metamath_label": label,
                        "statement_type": "theorem" if directive == "$p" else "axiom",
                        "expression_original": expr_original,
                        "expression_tokens": expr_tokens,
                    }
                    records.append(
                        {
                            "schema_version": 1,
                            "source_id": SOURCE_ID,
                            "source_name": SOURCE_NAME,
                            "source_homepage": "https://us.metamath.org/mpeuni/mmset.html",
                            "source_repository": "https://github.com/metamath/set.mm",
                            "source_snapshot": snapshot,
                            "source_git_commit": commit,
                            "source_license": SOURCE_LICENSE,
                            "source_document_id": "set.mm",
                            "source_document_sha256": document_sha,
                            "source_selector": f"label:{label}",
                            "source_position": {"line_start": line_start, "line_end": line_end},
                            "source_url": f"https://github.com/metamath/set.mm/blob/{commit}/set.mm#L{line_start}",
                            "source_record_sha256": canonical_sha256(record_identity),
                            "expression_original": expr_original,
                            "expression_encoding": "Metamath token expression",
                            "provenance_class": "attested",
                            "domain": "mathematics/formalized-mathematics",
                            "metamath_label": label,
                            "metamath_statement_type": "theorem" if directive == "$p" else "axiom",
                            "metamath_expression_tokens": expr_tokens,
                            "metamath_relation_tokens": found_relations,
                            "metamath_essential_hypotheses": list(active_e),
                            "metamath_floating_hypotheses": floating,
                            "metamath_distinct_variable_constraints": distinct,
                            "source_context_comment": clean_comment(statement_comment),
                            "source_attested_payload": {
                                "assertion_sha256": sha256_text(expr_original),
                                "proof_sha256": sha256_text(proof_original) if proof_original else None,
                                "ocr_performed": False,
                                "reconstruction_performed": False,
                            },
                        }
                    )
                    metrics["records_written"] += 1

        idx = end_idx + 1
        pending_comment = None

    if scopes:
        raise ValueError("unclosed Metamath scope at end of file")
    return records, metrics


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path, help="Pinned set.mm file or checkout root containing set.mm")
    parser.add_argument("--snapshot", required=True, help="metamath-setmm:git:<commit>:inventory-sha256:<digest>")
    parser.add_argument("--commit", required=True, help="Exact official set.mm Git commit used for this snapshot")
    parser.add_argument("--relation-token", action="append", default=[], help="Additional exact Metamath relation token to include")
    args = parser.parse_args()

    source_path = args.input / "set.mm" if args.input.is_dir() else args.input
    if source_path.name != "set.mm":
        parser.error("the Metamath lane is deliberately scoped to the set.mm database only")
    if not source_path.is_file():
        parser.error(f"set.mm not found: {source_path}")
    expected_prefix = f"metamath-setmm:git:{args.commit}:inventory-sha256:"
    if not args.snapshot.startswith(expected_prefix):
        parser.error(f"--snapshot must begin with {expected_prefix!r}")

    try:
        text = source_path.read_text(encoding="utf-8")
        relation_tokens = tuple(dict.fromkeys((*DEFAULT_RELATION_TOKENS, *args.relation_token)))
        records, metrics = iter_records(text, args.snapshot, args.commit, relation_tokens)
    except Exception as exc:
        print(json.dumps({"documents_rejected": 1, "error": str(exc)}, ensure_ascii=False, sort_keys=True), file=sys.stderr)
        return 2

    for record in records:
        print(json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    print(json.dumps(metrics, ensure_ascii=False, sort_keys=True, separators=(",", ":")), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
