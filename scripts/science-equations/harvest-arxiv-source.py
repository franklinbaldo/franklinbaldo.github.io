#!/usr/bin/env python3
"""Harvest attested TeX math from official arXiv bulk source chunks.

The production data plane is external to GitHub Actions:
official requester-pays S3 source chunks + OAI-PMH metadata -> transient JSONL
-> shared Parquet materializer -> Internet Archive, subject to per-item license.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import json
import re
import sys
import tarfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Iterator

SOURCE_ID = "arxiv-source-tex-math"
TEXT_EXTENSIONS = {".tex", ".ltx", ".latex"}
MATH_ENVIRONMENTS = (
    "equation", "equation*",
    "align", "align*",
    "alignat", "alignat*",
    "gather", "gather*",
    "multline", "multline*",
    "eqnarray", "eqnarray*",
    "displaymath",
)
VERBATIM_ENVIRONMENTS = ("verbatim", "verbatim*", "lstlisting", "minted")

# Conservative redistribution allowlist for derived occurrence rows.
# Default arXiv non-exclusive license and NC/ND variants are intentionally excluded.
REDISTRIBUTABLE_LICENSE_PATTERNS = (
    re.compile(r"creativecommons\.org/publicdomain/zero/1\.0/?$", re.I),
    re.compile(r"creativecommons\.org/licenses/by/4\.0/?$", re.I),
    re.compile(r"creativecommons\.org/licenses/by-sa/4\.0/?$", re.I),
)


@dataclass(frozen=True)
class Metadata:
    arxiv_id: str
    license: str | None
    categories: tuple[str, ...]
    title: str | None


@dataclass(frozen=True)
class MathSpan:
    start: int
    end: int
    kind: str
    body: str
    original: str


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def normalize_arxiv_id(value: str) -> str:
    value = value.strip()
    value = re.sub(r"^oai:arXiv\.org:", "", value, flags=re.I)
    value = re.sub(r"^arXiv:", "", value, flags=re.I)
    value = re.sub(r"v\d+$", "", value)
    return value


def license_is_redistributable(value: str | None) -> bool:
    if not value:
        return False
    normalized = value.strip().rstrip("/")
    return any(pattern.search(normalized) for pattern in REDISTRIBUTABLE_LICENSE_PATTERNS)


def iter_oai_files(path: Path) -> Iterator[Path]:
    if path.is_file():
        yield path
        return
    for child in sorted(path.rglob("*.xml")):
        if child.is_file():
            yield child


def load_oai_metadata(path: Path) -> dict[str, Metadata]:
    records: dict[str, Metadata] = {}
    for xml_path in iter_oai_files(path):
        root = ET.parse(xml_path).getroot()
        for record in root.iter():
            if local_name(record.tag) != "record":
                continue
            header_id = None
            metadata_node = None
            for child in record:
                name = local_name(child.tag)
                if name == "header":
                    for node in child.iter():
                        if local_name(node.tag) == "identifier" and node.text:
                            header_id = normalize_arxiv_id(node.text)
                            break
                elif name == "metadata":
                    metadata_node = child
            if metadata_node is None:
                continue
            fields: dict[str, list[str]] = {}
            for node in metadata_node.iter():
                name = local_name(node.tag)
                if node is metadata_node or node.text is None:
                    continue
                text = node.text.strip()
                if text:
                    fields.setdefault(name, []).append(text)
            arxiv_id = normalize_arxiv_id((fields.get("id") or [header_id or ""])[0])
            if not arxiv_id:
                continue
            license_value = (fields.get("license") or [None])[0]
            categories_raw = (fields.get("categories") or [""])[0]
            categories = tuple(filter(None, categories_raw.split()))
            title = (fields.get("title") or [None])[0]
            records[arxiv_id] = Metadata(
                arxiv_id=arxiv_id,
                license=license_value,
                categories=categories,
                title=title,
            )
    return records


def unescaped(text: str, pos: int) -> bool:
    backslashes = 0
    i = pos - 1
    while i >= 0 and text[i] == "\\":
        backslashes += 1
        i -= 1
    return backslashes % 2 == 0


def find_unescaped(text: str, needle: str, start: int) -> int:
    pos = text.find(needle, start)
    while pos != -1:
        if unescaped(text, pos):
            return pos
        pos = text.find(needle, pos + 1)
    return -1


def skip_comment(text: str, pos: int) -> int:
    newline = text.find("\n", pos)
    return len(text) if newline == -1 else newline + 1


def skip_verbatim_environment(text: str, pos: int) -> int | None:
    for env in VERBATIM_ENVIRONMENTS:
        begin = rf"\begin{{{env}}}"
        if text.startswith(begin, pos):
            end_token = rf"\end{{{env}}}"
            end = text.find(end_token, pos + len(begin))
            return len(text) if end == -1 else end + len(end_token)
    return None


def iter_math_spans(text: str) -> Iterator[MathSpan]:
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]

        if ch == "%" and unescaped(text, i):
            i = skip_comment(text, i)
            continue

        skipped = skip_verbatim_environment(text, i)
        if skipped is not None:
            i = skipped
            continue

        if text.startswith(r"\[", i):
            end = find_unescaped(text, r"\]", i + 2)
            if end != -1:
                original = text[i:end + 2]
                body = text[i + 2:end]
                if body.strip():
                    yield MathSpan(i, end + 2, "display-bracket", body, original)
                i = end + 2
                continue

        if text.startswith(r"\(", i):
            end = find_unescaped(text, r"\)", i + 2)
            if end != -1:
                original = text[i:end + 2]
                body = text[i + 2:end]
                if body.strip():
                    yield MathSpan(i, end + 2, "inline-paren", body, original)
                i = end + 2
                continue

        matched_env = False
        if text.startswith(r"\begin{", i):
            for env in MATH_ENVIRONMENTS:
                begin = rf"\begin{{{env}}}"
                if not text.startswith(begin, i):
                    continue
                end_token = rf"\end{{{env}}}"
                end = text.find(end_token, i + len(begin))
                if end != -1:
                    finish = end + len(end_token)
                    original = text[i:finish]
                    body = text[i + len(begin):end]
                    if body.strip():
                        yield MathSpan(i, finish, f"environment:{env}", body, original)
                    i = finish
                else:
                    i += len(begin)
                matched_env = True
                break
            if matched_env:
                continue

        if ch == "$" and unescaped(text, i):
            double = i + 1 < n and text[i + 1] == "$"
            token = "$$" if double else "$"
            body_start = i + len(token)
            end = find_unescaped(text, token, body_start)
            if end != -1:
                if not double and end + 1 < n and text[end + 1] == "$":
                    i += 1
                    continue
                finish = end + len(token)
                original = text[i:finish]
                body = text[body_start:end]
                if body.strip():
                    yield MathSpan(i, finish, "display-dollar" if double else "inline-dollar", body, original)
                i = finish
                continue

        i += 1


def decode_source(data: bytes) -> str | None:
    if b"\x00" in data[:4096]:
        return None
    for encoding in ("utf-8", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return None


def safe_tex_members_from_tar_bytes(payload: bytes) -> Iterator[tuple[str, bytes]]:
    try:
        with tarfile.open(fileobj=io.BytesIO(payload), mode="r:*") as archive:
            for member in archive:
                if not member.isfile():
                    continue
                suffix = PurePosixPath(member.name).suffix.lower()
                if suffix not in TEXT_EXTENSIONS:
                    continue
                handle = archive.extractfile(member)
                if handle is None:
                    continue
                yield member.name, handle.read()
            return
    except (tarfile.ReadError, EOFError, gzip.BadGzipFile):
        pass

    # Some arXiv source packages are a gzipped single TeX file rather than a tarball.
    try:
        raw = gzip.decompress(payload)
    except (OSError, EOFError):
        raw = payload
    text = decode_source(raw)
    if text is not None and ("\\document" in text or "$" in text or "\\[" in text or "\\begin{" in text):
        yield "source.tex", raw


def article_id_candidates(member_name: str) -> list[str]:
    path = member_name.removeprefix("./")
    if path.endswith(".gz"):
        path = path[:-3]
    if path.endswith(".tar"):
        path = path[:-4]
    candidates = [normalize_arxiv_id(path)]
    base = PurePosixPath(path).name
    candidates.append(normalize_arxiv_id(base))
    parts = PurePosixPath(path).parts
    if len(parts) >= 2 and re.fullmatch(r"\d{4}", parts[-2]) and re.fullmatch(r"\d{4}\.\d{4,5}", base):
        candidates.append(base)
    if len(parts) >= 2 and re.fullmatch(r"\d{7}", base):
        candidates.append(f"{parts[-2]}/{base}")
    return list(dict.fromkeys(candidates))


def metadata_for_member(member_name: str, metadata: dict[str, Metadata]) -> Metadata | None:
    for candidate in article_id_candidates(member_name):
        if candidate in metadata:
            return metadata[candidate]
    return None


def line_number(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def context_window(text: str, start: int, end: int, radius: int = 220) -> str:
    before = max(0, start - radius)
    after = min(len(text), end + radius)
    return text[before:after].strip()


def record_for_span(
    *,
    snapshot: str,
    chunk_name: str,
    article_member: str,
    tex_path: str,
    text: str,
    span: MathSpan,
    metadata: Metadata,
) -> dict:
    start_line = line_number(text, span.start)
    end_line = line_number(text, span.end)
    locator = f"{chunk_name}/{article_member}:{tex_path}:L{start_line}-L{end_line}"
    source_record_material = "\n".join(
        [metadata.arxiv_id, chunk_name, article_member, tex_path, str(start_line), span.original]
    )
    return {
        "schema_version": 1,
        "source_id": SOURCE_ID,
        "source_snapshot": snapshot,
        "provenance_class": "attested",
        "expression_original": span.original,
        "expression_encoding": "tex",
        "source_record_sha256": sha256_text(source_record_material),
        "expression_sha256": sha256_text(span.original),
        "normalized_text": span.body.strip(),
        "normalized_text_sha256": sha256_text(span.body.strip()),
        "source_document_id": metadata.arxiv_id,
        "source_document_url": f"https://arxiv.org/abs/{metadata.arxiv_id}",
        "source_locator": locator,
        "source_license": metadata.license,
        "source_license_url": metadata.license,
        "context_text": context_window(text, span.start, span.end),
        "source_categories": list(metadata.categories),
        "source_title": metadata.title,
        "source_chunk": chunk_name,
        "source_article_member": article_member,
        "source_tex_path": tex_path,
        "source_math_kind": span.kind,
        "source_line_start": start_line,
        "source_line_end": end_line,
        "redistribution_allowed": True,
        "redistribution_policy": "CC0/CC-BY-4.0/CC-BY-SA-4.0 allowlist",
    }


def harvest_bulk_tar(
    path: Path,
    *,
    snapshot: str,
    metadata: dict[str, Metadata],
    metrics: dict[str, int],
) -> Iterator[dict]:
    with tarfile.open(path, mode="r:*") as outer:
        for member in outer:
            if not member.isfile():
                continue
            metrics["article_packages_seen"] += 1
            meta = metadata_for_member(member.name, metadata)
            if meta is None:
                metrics["article_packages_without_metadata"] += 1
                continue
            if not license_is_redistributable(meta.license):
                metrics["article_packages_license_filtered"] += 1
                continue
            handle = outer.extractfile(member)
            if handle is None:
                metrics["article_packages_unreadable"] += 1
                continue
            payload = handle.read()
            tex_found = 0
            for tex_path, tex_bytes in safe_tex_members_from_tar_bytes(payload):
                tex_found += 1
                metrics["tex_files_seen"] += 1
                text = decode_source(tex_bytes)
                if text is None:
                    metrics["tex_files_decode_rejected"] += 1
                    continue
                for span in iter_math_spans(text):
                    metrics["math_spans_seen"] += 1
                    yield record_for_span(
                        snapshot=snapshot,
                        chunk_name=path.name,
                        article_member=member.name,
                        tex_path=tex_path,
                        text=text,
                        span=span,
                        metadata=meta,
                    )
                    metrics["records_written"] += 1
            if tex_found == 0:
                metrics["article_packages_without_tex"] += 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bulk-tar", required=True, action="append", type=Path)
    parser.add_argument("--oai-metadata", required=True, type=Path)
    parser.add_argument("--snapshot", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    metadata = load_oai_metadata(args.oai_metadata)
    metrics = {
        "metadata_records": len(metadata),
        "bulk_chunks": len(args.bulk_tar),
        "article_packages_seen": 0,
        "article_packages_without_metadata": 0,
        "article_packages_license_filtered": 0,
        "article_packages_unreadable": 0,
        "article_packages_without_tex": 0,
        "tex_files_seen": 0,
        "tex_files_decode_rejected": 0,
        "math_spans_seen": 0,
        "records_written": 0,
    }
    for bulk_tar in args.bulk_tar:
        for record in harvest_bulk_tar(
            bulk_tar,
            snapshot=args.snapshot,
            metadata=metadata,
            metrics=metrics,
        ):
            print(json.dumps(record, ensure_ascii=False, sort_keys=True))
    print(json.dumps(metrics, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
