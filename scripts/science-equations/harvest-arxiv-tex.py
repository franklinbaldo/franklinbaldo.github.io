#!/usr/bin/env python3
"""Harvest exact TeX math from rights-safe single-version arXiv source packages."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import json
import re
import sys
import tarfile
from pathlib import Path

SOURCE_ID = "arxiv-source-tex-single-version"
TEX_EXTENSIONS = {".tex", ".ltx", ".latex"}
EXCLUDED_ENV_RE = re.compile(
    r"\\begin\{(?P<env>verbatim\*?|lstlisting|minted)\}.*?\\end\{(?P=env)\}",
    re.IGNORECASE | re.DOTALL,
)
COMMENT_RE = re.compile(r"(?<!\\)%[^\n]*")
VERB_RE = re.compile(r"\\verb(?P<delimiter>[^A-Za-z\s]).*?(?P=delimiter)", re.DOTALL)
MATH_PATTERNS = [
    ("display-dollar", re.compile(r"(?<!\\)\$\$(?P<body>.*?)(?<!\\)\$\$", re.DOTALL)),
    ("display-bracket", re.compile(r"\\\[(?P<body>.*?)\\\]", re.DOTALL)),
    ("inline-paren", re.compile(r"\\\((?P<body>.*?)\\\)", re.DOTALL)),
    (
        "environment",
        re.compile(
            r"\\begin\{(?P<env>equation\*?|align\*?|gather\*?|multline\*?|eqnarray\*?|displaymath|math)\}"
            r"(?P<body>.*?)\\end\{(?P=env)\}",
            re.IGNORECASE | re.DOTALL,
        ),
    ),
    ("inline-dollar", re.compile(r"(?<!\\)\$(?!\$)(?P<body>.*?)(?<!\\)\$(?!\$)", re.DOTALL)),
]


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_license(url: str | None) -> str:
    return (url or "").strip().replace("http://", "https://").rstrip("/")


def redistributable_license(url: str | None) -> str | None:
    key = normalize_license(url)
    match = re.fullmatch(r"https://creativecommons\.org/licenses/(by|by-sa)/([0-9.]+)", key)
    if match:
        return f"CC-{match.group(1).upper()}-{match.group(2)}"
    match = re.fullmatch(r"https://creativecommons\.org/publicdomain/zero/([0-9.]+)", key)
    if match:
        return f"CC0-{match.group(1)}"
    return None


def id_variants(value: str) -> set[str]:
    raw = value.strip().removeprefix("arXiv:").removeprefix("oai:arXiv.org:")
    variants = {raw, raw.replace("/", "")}
    if "/" in raw:
        variants.add(raw.replace("/", "-"))
    return {variant for variant in variants if variant}


def load_metadata(path: Path) -> dict[str, dict]:
    by_identifier: dict[str, dict] = {}
    with path.open(encoding="utf-8-sig") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            for key in id_variants(row["arxiv_id"]):
                by_identifier[key] = row
    return by_identifier


def match_metadata(name: str, metadata: dict[str, dict]) -> dict | None:
    path = Path(name)
    candidates: list[str] = []
    for piece in [path.name, path.stem, f"{path.parent.name}/{path.stem}", f"{path.parent.name}{path.stem}"]:
        candidate = piece
        for suffix in [".tar.gz", ".tgz", ".tar", ".gz", ".tex", ".ltx", ".latex"]:
            if candidate.lower().endswith(suffix):
                candidate = candidate[: -len(suffix)]
        candidates.extend(id_variants(candidate))
    for candidate in candidates:
        if candidate in metadata:
            return metadata[candidate]
    return None


def masked_tex(text: str) -> str:
    characters = list(text)
    spans = []
    for regex in (EXCLUDED_ENV_RE, VERB_RE, COMMENT_RE):
        spans.extend((match.start(), match.end()) for match in regex.finditer(text))
    for start, end in spans:
        for index in range(start, end):
            if characters[index] != "\n":
                characters[index] = " "
    return "".join(characters)


def iter_math_matches(text: str):
    masked = masked_tex(text)
    matches = []
    for kind, regex in MATH_PATTERNS:
        for match in regex.finditer(masked):
            body_start = match.start("body")
            body_end = match.end("body")
            if not text[body_start:body_end].strip():
                continue
            matches.append(
                (
                    match.start(),
                    match.end(),
                    body_start,
                    body_end,
                    kind,
                    match.groupdict().get("env"),
                )
            )
    # Prefer the outermost delimiter at one start and drop nested/overlapping matches.
    matches.sort(key=lambda item: (item[0], -(item[1] - item[0])))
    selected = []
    current_end = -1
    for item in matches:
        if item[0] < current_end:
            continue
        selected.append(item)
        current_end = item[1]
    return selected


def decode_text(data: bytes) -> str:
    for encoding in ("utf-8", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", "replace")


def tex_members_from_blob(name: str, data: bytes):
    raw = data
    if raw[:2] == b"\x1f\x8b":
        try:
            raw = gzip.decompress(raw)
        except OSError:
            pass

    try:
        with tarfile.open(fileobj=io.BytesIO(raw), mode="r:*") as archive:
            found = False
            for member in archive:
                if not member.isfile() or Path(member.name).suffix.lower() not in TEX_EXTENSIONS:
                    continue
                handle = archive.extractfile(member)
                if handle is None:
                    continue
                found = True
                yield member.name, handle.read()
            if found:
                return
    except tarfile.TarError:
        pass

    logical_name = Path(name).name
    if logical_name.lower().endswith(".gz"):
        logical_name = logical_name[:-3]
    if Path(logical_name).suffix.lower() not in TEX_EXTENSIONS:
        logical_name = "source.tex"
    yield logical_name, raw


def iter_packages(source: Path):
    if source.is_file():
        # Official arXiv S3 source chunks are outer uncompressed TARs containing one source blob per article.
        if source.suffix.lower() == ".tar" and tarfile.is_tarfile(source):
            with tarfile.open(source, "r:") as outer:
                for member in outer:
                    if not member.isfile():
                        continue
                    handle = outer.extractfile(member)
                    if handle is not None:
                        yield member.name, handle.read(), source.name
        else:
            yield source.name, source.read_bytes(), source.name
        return

    # Interoperability/fixture mode: each immediate subdirectory is one article package.
    subdirectories = [path for path in sorted(source.iterdir()) if path.is_dir()]
    if subdirectories:
        for directory in subdirectories:
            members = []
            for path in sorted(directory.rglob("*")):
                if path.is_file() and path.suffix.lower() in TEX_EXTENSIONS:
                    members.append((path.relative_to(directory).as_posix(), path.read_bytes()))
            if members:
                yield directory.name, members, source.name
        return

    for path in sorted(source.iterdir()):
        if path.is_file():
            yield path.name, path.read_bytes(), source.name


def context_text(text: str, start: int, end: int, radius: int) -> str:
    return " ".join(text[max(0, start - radius) : min(len(text), end + radius)].split())


def emit_article(package_name: str, payload, container: str, metadata: dict | None, args, metrics: dict[str, int]):
    if metadata is None:
        metrics["packages_skipped_missing_metadata"] += 1
        return
    if metadata.get("version_count") != 1:
        metrics["packages_skipped_multi_version"] += 1
        return

    license_label = redistributable_license(metadata.get("license_url"))
    if license_label is None:
        metrics["packages_skipped_license"] += 1
        return

    arxiv_id = metadata["arxiv_id"]
    version = (metadata.get("versions") or [{}])[0].get("version") or "v1"
    source_url = f"https://arxiv.org/abs/{arxiv_id}{version if str(version).startswith('v') else ''}"
    members = payload if isinstance(payload, list) else list(tex_members_from_blob(package_name, payload))

    for member_name, data in members:
        metrics["source_files_seen"] += 1
        text = decode_text(data)
        file_ordinal = 0
        for start, end, body_start, body_end, kind, environment in iter_math_matches(text):
            metrics["math_candidates_seen"] += 1
            file_ordinal += 1
            body = text[body_start:body_end]
            raw_math = text[start:end]
            expression_sha256 = sha256_text(body)
            record_key = "\u001f".join(
                [SOURCE_ID, arxiv_id, str(version), member_name, str(file_ordinal), expression_sha256]
            )
            normalized_text = " ".join(body.split())
            row = {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": args.snapshot,
                "provenance_class": "attested",
                "expression_original": body,
                "expression_encoding": "tex-math-source",
                "source_record_sha256": sha256_text(record_key),
                "expression_sha256": expression_sha256,
                "normalized_text": normalized_text,
                "normalized_text_sha256": sha256_text(normalized_text),
                "source_document_id": f"arxiv:{arxiv_id}:{version}",
                "source_document_url": source_url,
                "source_locator": f"arxiv:{arxiv_id}:{version};file:{member_name};math:{file_ordinal}",
                "source_license": license_label,
                "source_license_url": metadata.get("license_url"),
                "context_text": context_text(text, start, end, args.context_chars),
                "source_arxiv_id": arxiv_id,
                "source_arxiv_version": version,
                "source_title": metadata.get("title"),
                "source_categories": metadata.get("categories") or [],
                "source_oai_identifier": metadata.get("oai_identifier"),
                "source_file": member_name,
                "source_package": package_name,
                "source_outer_container": container,
                "source_attested_payload": {
                    "raw_math": raw_math,
                    "delimiter_kind": kind,
                    "environment": environment,
                    "macro_expansion_performed": False,
                    "ocr_performed": False,
                    "reconstruction_performed": False,
                },
            }
            metrics["records_written"] += 1
            yield row


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--context-chars", type=int, default=240)
    args = parser.parse_args()

    if not args.source.exists():
        parser.error("source path does not exist")
    if not args.metadata.exists():
        parser.error("metadata path does not exist")
    if args.context_chars < 0:
        parser.error("--context-chars must be non-negative")

    metadata = load_metadata(args.metadata)
    metrics = {
        "packages_seen": 0,
        "packages_skipped_missing_metadata": 0,
        "packages_skipped_multi_version": 0,
        "packages_skipped_license": 0,
        "source_files_seen": 0,
        "math_candidates_seen": 0,
        "records_written": 0,
    }

    for package_name, payload, container in iter_packages(args.source):
        metrics["packages_seen"] += 1
        article_metadata = match_metadata(package_name, metadata)
        for row in emit_article(package_name, payload, container, article_metadata, args, metrics) or ():
            print(json.dumps(row, ensure_ascii=False, sort_keys=True))

    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True), file=sys.stderr)
    return 0 if metrics["packages_seen"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
