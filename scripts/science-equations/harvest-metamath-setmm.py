#!/usr/bin/env python3
"""Harvest attested relation-bearing assertions from Metamath Proof Explorer set.mm."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterator

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
    line_start: int
    line_end: int
    comment: bool = False


class TokenStream:
    """Single-pass Metamath lexer with one-token lookahead and fail-closed gaps."""

    def __init__(self, text: str):
        self.text = text
        self._matches: Iterator[re.Match[str]] = iter(TOKEN_RE.finditer(text))
        self._buffer: Token | None = None
        self._cursor = 0
        self._line = 1
        self._finished = False

    def _read(self) -> Token | None:
        if self._finished:
            return None
        try:
            match = next(self._matches)
        except StopIteration:
            tail = self.text[self._cursor :]
            if "$" in tail:
                offset = self._cursor + tail.index("$")
                raise ValueError(f"unrecognized Metamath dollar directive near byte {offset}")
            self._finished = True
            return None

        gap = self.text[self._cursor : match.start()]
        if "$" in gap:
            offset = self._cursor + gap.index("$")
            raise ValueError(f"unrecognized Metamath dollar directive near byte {offset}")
        self._line += gap.count("\n")
        raw = match.group(0)
        line_start = self._line
        line_end = line_start + raw.count("\n")
        self._line = line_end
        self._cursor = match.end()
        return Token(raw, match.start(), match.end(), line_start, line_end, raw.startswith("$("))

    def peek(self) -> Token | None:
        if self._buffer is None:
            self._buffer = self._read()
        return self._buffer

    def pop(self) -> Token | None:
        token = self.peek()
        self._buffer = None
        return token


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_sha256(value: object) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256_text(payload)


def clean_comment(raw: str | None) -> str | None:
    if not raw:
        return None
    body = raw[2:-2]
    return body.strip() or None


def exact_between(text: str, semantic: list[Token]) -> str:
    if not semantic:
        return ""
    return text[semantic[0].start : semantic[-1].end]


def parse_expression(stream: TokenStream, terminators: set[str]) -> tuple[list[Token], Token]:
    semantic: list[Token] = []
    while True:
        tok = stream.pop()
        if tok is None:
            raise ValueError(f"unterminated expression; expected one of {sorted(terminators)}")
        if tok.comment:
            continue
        if tok.text in terminators:
            return semantic, tok
        semantic.append(tok)


def harvest(
    text: str,
    document_sha: str,
    snapshot: str,
    commit: str,
    relation_tokens: tuple[str, ...],
    emit: Callable[[dict], None],
) -> dict:
    stream = TokenStream(text)
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
    pending_comment: str | None = None

    def pop_noncomment() -> Token | None:
        nonlocal pending_comment
        while True:
            token = stream.pop()
            if token is None:
                return None
            if token.comment:
                pending_comment = token.text
                continue
            return token

    while True:
        tok = pop_noncomment()
        if tok is None:
            break

        if tok.text == "${":
            scopes.append((len(active_f), len(active_e), len(active_d)))
            continue
        if tok.text == "$}":
            if not scopes:
                raise ValueError("scope close without matching scope open")
            nf, ne, nd = scopes.pop()
            del active_f[nf:]
            del active_e[ne:]
            del active_d[nd:]
            pending_comment = None
            continue
        if tok.text == "$[":
            metrics["includes_seen"] += 1
            raise ValueError("$[ include directive encountered; set.mm lane requires one self-contained pinned set.mm file")
        if tok.text in {"$c", "$v", "$d"}:
            kind = tok.text
            expr, terminator = parse_expression(stream, {"$."})
            if terminator.text != "$.":
                raise AssertionError(terminator.text)
            if kind == "$d":
                variables = [item.text for item in expr]
                if len(variables) >= 2:
                    active_d.append(variables)
            pending_comment = None
            continue
        if tok.text in SPECIALS:
            raise ValueError(f"unexpected directive {tok.text} at line {tok.line_start}")

        label_tok = tok
        label = tok.text
        statement_comment = pending_comment
        directive_tok = pop_noncomment()
        if directive_tok is None or directive_tok.text not in {"$f", "$e", "$a", "$p"}:
            got = directive_tok.text if directive_tok else "EOF"
            raise ValueError(f"label {label!r} not followed by $f/$e/$a/$p (got {got!r})")
        directive = directive_tok.text
        if directive in {"$f", "$e", "$a"}:
            expr, terminator = parse_expression(stream, {"$."})
            if terminator.text != "$.":
                raise AssertionError(terminator.text)
            proof_semantic: list[Token] = []
        else:
            expr, proof_marker = parse_expression(stream, {"$="})
            if proof_marker.text != "$=":
                raise AssertionError(proof_marker.text)
            proof_semantic, proof_terminator = parse_expression(stream, {"$."})
            if proof_terminator.text != "$.":
                raise AssertionError(proof_terminator.text)

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
                    emit(
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
                            "source_position": {"line_start": label_tok.line_start, "line_end": expr[-1].line_end if expr else directive_tok.line_end},
                            "source_url": f"https://github.com/metamath/set.mm/blob/{commit}/set.mm#L{label_tok.line_start}",
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

        pending_comment = None

    if scopes:
        raise ValueError("unclosed Metamath scope at end of file")
    return metrics


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
        source_bytes = source_path.read_bytes()
        document_sha = hashlib.sha256(source_bytes).hexdigest()
        text = source_bytes.decode("utf-8")
        del source_bytes
        relation_tokens = tuple(dict.fromkeys((*DEFAULT_RELATION_TOKENS, *args.relation_token)))
        with tempfile.SpooledTemporaryFile(mode="w+", encoding="utf-8", max_size=8 * 1024 * 1024) as output:
            def emit(record: dict) -> None:
                output.write(json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
                output.write("\n")

            metrics = harvest(text, document_sha, args.snapshot, args.commit, relation_tokens, emit)
            output.seek(0)
            shutil.copyfileobj(output, sys.stdout)
    except Exception as exc:
        print(json.dumps({"documents_rejected": 1, "error": str(exc)}, ensure_ascii=False, sort_keys=True), file=sys.stderr)
        return 2

    print(json.dumps(metrics, ensure_ascii=False, sort_keys=True, separators=(",", ":")), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
