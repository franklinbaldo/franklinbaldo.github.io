#!/usr/bin/env python3
"""Harvest attested Rd math macros from CRAN source package tarballs.

Persistent Atlas lake output is Apache Parquet; this adapter emits JSONL transport only.
It consumes CRAN source tarballs acquired outside GitHub Actions and extracts exact
``\\eqn{}`` / ``\\deqn{}`` documentation mathematics from package ``man/*.Rd`` files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import tarfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator

SOURCE_ID = "cran-rd-math"
SECTION_COMMANDS = {
    "description",
    "details",
    "usage",
    "arguments",
    "value",
    "references",
    "examples",
    "note",
    "seealso",
    "format",
    "source",
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_sha256(value: object) -> str:
    payload = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return sha256_bytes(payload)


def parse_dcf(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    current: str | None = None
    for raw in text.splitlines():
        if not raw:
            current = None
            continue
        if raw[:1].isspace() and current:
            fields[current] += "\n" + raw.strip()
            continue
        if ":" not in raw:
            current = None
            continue
        key, value = raw.split(":", 1)
        current = key.strip()
        fields[current] = value.lstrip()
    return fields


def parse_packages_index(path: Path | None) -> dict[tuple[str, str], dict[str, str]]:
    if path is None:
        return {}
    raw = path.read_text(encoding="utf-8", errors="replace")
    out: dict[tuple[str, str], dict[str, str]] = {}
    for block in re.split(r"\n\s*\n", raw.strip()):
        fields = parse_dcf(block)
        package = fields.get("Package")
        version = fields.get("Version")
        if package and version:
            out[(package, version)] = fields
    return out


def decode_bytes(raw: bytes, encoding: str | None) -> tuple[str, str]:
    candidates: list[str] = []
    if encoding:
        normalized = encoding.strip().lower().replace("_", "-")
        aliases = {
            "latin1": "latin-1",
            "latin-1": "latin-1",
            "utf8": "utf-8",
            "utf-8": "utf-8",
        }
        candidates.append(aliases.get(normalized, normalized))
    candidates.extend(["utf-8", "latin-1"])
    seen: set[str] = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        try:
            return raw.decode(candidate), candidate
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode("utf-8", errors="replace"), "utf-8-replacement"


def is_escaped(text: str, idx: int) -> bool:
    backslashes = 0
    idx -= 1
    while idx >= 0 and text[idx] == "\\":
        backslashes += 1
        idx -= 1
    return backslashes % 2 == 1


def parse_braced(text: str, start: int) -> tuple[str, int] | None:
    if start >= len(text) or text[start] != "{":
        return None
    depth = 0
    i = start
    while i < len(text):
        ch = text[i]
        if ch == "{" and not is_escaped(text, i):
            depth += 1
        elif ch == "}" and not is_escaped(text, i):
            depth -= 1
            if depth == 0:
                return text[start + 1 : i], i + 1
        i += 1
    return None


def line_number(text: str, idx: int) -> int:
    return text.count("\n", 0, idx) + 1


def context_snippet(text: str, start: int, end: int, radius: int = 180) -> str:
    before = text[max(0, start - radius) : start]
    after = text[end : min(len(text), end + radius)]
    return (before + text[start:end] + after).strip()


def simple_macro(text: str, command: str) -> str | None:
    needle = "\\" + command + "{"
    pos = text.find(needle)
    if pos < 0:
        return None
    parsed = parse_braced(text, pos + len(command) + 1)
    return parsed[0].strip() if parsed else None


@dataclass
class RdMath:
    command: str
    latex: str
    ascii: str | None
    source_markup: str
    start: int
    end: int
    section: str | None


def iter_rd_math(text: str) -> Iterator[RdMath]:
    i = 0
    section: str | None = None
    while i < len(text):
        ch = text[i]
        if ch == "%" and not is_escaped(text, i):
            newline = text.find("\n", i + 1)
            i = len(text) if newline < 0 else newline + 1
            continue
        if ch != "\\":
            i += 1
            continue
        j = i + 1
        while j < len(text) and text[j].isalpha():
            j += 1
        command = text[i + 1 : j]
        if not command:
            i += 1
            continue
        if command in SECTION_COMMANDS and j < len(text) and text[j] == "{":
            section = command
        if command not in {"eqn", "deqn"}:
            i = j
            continue
        if j >= len(text) or text[j] != "{":
            i = j
            continue
        first = parse_braced(text, j)
        if first is None:
            i = j
            continue
        latex, after_first = first
        ascii_value: str | None = None
        end = after_first
        if end < len(text) and text[end] == "{":
            second = parse_braced(text, end)
            if second is not None:
                ascii_value, end = second
        yield RdMath(
            command=command,
            latex=latex,
            ascii=ascii_value,
            source_markup=text[i:end],
            start=i,
            end=end,
            section=section,
        )
        i = end


def tarballs(root: Path) -> Iterable[Path]:
    if root.is_file():
        yield root
        return
    yield from sorted(path for path in root.rglob("*.tar.gz") if path.is_file())


def normalize_bool(value: str | None) -> bool | None:
    if value is None:
        return None
    lowered = value.strip().lower()
    if lowered in {"yes", "true"}:
        return True
    if lowered in {"no", "false"}:
        return False
    return None


def rights_status(
    index_fields: dict[str, str],
    description: dict[str, str],
) -> tuple[str, bool]:
    """Conservative package-level publication gate.

    CRAN keeps License mandatory in DESCRIPTION, but a package can use custom
    license files or restrictions.  Only explicit repository metadata saying
    FOSS=yes and restricts_use=no is automatically marked redistributable.
    Everything else remains fail-closed for Internet Archive publication.
    """

    is_foss = normalize_bool(index_fields.get("License_is_FOSS"))
    restricts = normalize_bool(index_fields.get("License_restricts_use"))
    if is_foss is True and restricts is False:
        return "repository-metadata-redistributable", True
    if is_foss is False or restricts is True:
        return "repository-metadata-restricted", False
    if description.get("License"):
        return "license-present-unverified", False
    return "license-missing", False


def process_tarball(
    path: Path,
    snapshot: str,
    packages_index: dict[tuple[str, str], dict[str, str]],
    metrics: dict[str, int],
) -> Iterator[dict[str, object]]:
    archive_hash = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            archive_hash.update(chunk)
    archive_sha256 = archive_hash.hexdigest()

    try:
        archive = tarfile.open(path, mode="r:gz")
    except tarfile.TarError:
        metrics["archives_rejected"] += 1
        return

    with archive:
        members = [member for member in archive.getmembers() if member.isfile()]
        description_member = next(
            (
                member
                for member in members
                if member.name.count("/") == 1
                and member.name.endswith("/DESCRIPTION")
            ),
            None,
        )
        if description_member is None:
            metrics["archives_rejected"] += 1
            return
        description_handle = archive.extractfile(description_member)
        if description_handle is None:
            metrics["archives_rejected"] += 1
            return
        raw_description = description_handle.read()
        description_text, _ = decode_bytes(raw_description, None)
        description = parse_dcf(description_text)
        package = description.get("Package")
        version = description.get("Version")
        if not package or not version:
            metrics["archives_rejected"] += 1
            return

        metrics["packages_seen"] += 1
        index_fields = packages_index.get((package, version), {})
        status, redistribution_allowed = rights_status(index_fields, description)
        license_text = (
            index_fields.get("License")
            or description.get("License")
            or "UNVERIFIED"
        )
        package_encoding = description.get("Encoding")
        title = description.get("Title")

        rd_members = sorted(
            (
                member
                for member in members
                if re.fullmatch(r"[^/]+/man/.+\.Rd", member.name)
            ),
            key=lambda member: member.name,
        )
        for member in rd_members:
            metrics["rd_files_seen"] += 1
            member_handle = archive.extractfile(member)
            if member_handle is None:
                metrics["rd_files_rejected"] += 1
                continue
            raw = member_handle.read()
            document_sha256 = sha256_bytes(raw)
            text, decoded_encoding = decode_bytes(raw, package_encoding)
            topic = Path(member.name).name[:-3]
            rd_title = simple_macro(text, "title")
            aliases = re.findall(r"\\alias\{([^{}]*)\}", text)
            occurrences = list(iter_rd_math(text))
            metrics["math_macros_seen"] += len(occurrences)

            for ordinal, occurrence in enumerate(occurrences, start=1):
                if not occurrence.latex.strip():
                    metrics["empty_math_rejected"] += 1
                    continue
                logical_identity = {
                    "source_id": SOURCE_ID,
                    "source_snapshot": snapshot,
                    "package": package,
                    "version": version,
                    "rd_path": member.name,
                    "document_sha256": document_sha256,
                    "ordinal": ordinal,
                    "command": occurrence.command,
                    "source_markup": occurrence.source_markup,
                }
                row = {
                    "schema_version": 1,
                    "source_id": SOURCE_ID,
                    "source_snapshot": snapshot,
                    "source_document_id": f"{package}@{version}:{member.name}",
                    "source_locator": f"{member.name}#rd-math-{ordinal}",
                    "source_url": (
                        f"https://CRAN.R-project.org/package={package}&version={version}"
                    ),
                    "source_record_sha256": canonical_sha256(logical_identity),
                    "source_document_sha256": document_sha256,
                    "source_archive_sha256": archive_sha256,
                    "provenance_class": "attested",
                    "expression_original": occurrence.latex,
                    "expression_encoding": "Rd-LaTeX",
                    "source_markup_original": occurrence.source_markup,
                    "expression_ascii_original": occurrence.ascii,
                    "math_display": (
                        "display" if occurrence.command == "deqn" else "inline"
                    ),
                    "package": package,
                    "package_version": version,
                    "package_title": title,
                    "package_license": license_text,
                    "rights_status": status,
                    "redistribution_allowed": redistribution_allowed,
                    "package_encoding": package_encoding,
                    "decoded_encoding": decoded_encoding,
                    "rd_path": member.name,
                    "rd_topic": topic,
                    "rd_title": rd_title,
                    "rd_aliases": aliases,
                    "rd_section": occurrence.section,
                    "source_line_start": line_number(text, occurrence.start),
                    "source_line_end": line_number(text, occurrence.end),
                    "context": context_snippet(
                        text,
                        occurrence.start,
                        occurrence.end,
                    ),
                    "repository_metadata": {
                        key: index_fields.get(key)
                        for key in (
                            "License",
                            "License_is_FOSS",
                            "License_restricts_use",
                            "NeedsCompilation",
                        )
                        if index_fields.get(key) is not None
                    },
                    "source_attested_payload": {
                        "rd_command": occurrence.command,
                        "reconstruction_performed": False,
                        "ocr_performed": False,
                    },
                }
                metrics["records_written"] += 1
                if redistribution_allowed:
                    metrics["redistributable_records"] += 1
                yield row


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="CRAN source tarball or directory containing source tarballs",
    )
    parser.add_argument(
        "--packages-index",
        type=Path,
        help="Optional official CRAN src/contrib/PACKAGES snapshot for repository metadata",
    )
    parser.add_argument(
        "--snapshot",
        required=True,
        help="cran-rd-math:inventory-sha256:<digest>",
    )
    parser.add_argument("--limit-packages", type=int)
    args = parser.parse_args()

    if not args.snapshot.startswith("cran-rd-math:inventory-sha256:"):
        parser.error(
            "--snapshot must use cran-rd-math:inventory-sha256:<digest>"
        )
    if not args.input.exists():
        parser.error("--input does not exist")
    if args.packages_index and not args.packages_index.exists():
        parser.error("--packages-index does not exist")

    packages_index = parse_packages_index(args.packages_index)
    metrics = {
        "packages_seen": 0,
        "archives_rejected": 0,
        "rd_files_seen": 0,
        "rd_files_rejected": 0,
        "math_macros_seen": 0,
        "empty_math_rejected": 0,
        "records_written": 0,
        "redistributable_records": 0,
        "ocr_performed": 0,
        "reconstructions": 0,
    }
    package_paths = list(tarballs(args.input))
    if args.limit_packages is not None:
        package_paths = package_paths[: args.limit_packages]

    for package_path in package_paths:
        for row in process_tarball(
            package_path,
            args.snapshot,
            packages_index,
            metrics,
        ):
            sys.stdout.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    sys.stderr.write(json.dumps(metrics, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
