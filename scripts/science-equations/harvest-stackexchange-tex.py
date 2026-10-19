#!/usr/bin/env python3
"""Harvest explicit TeX/MathJax expressions from Stack Exchange data dumps."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import xml.etree.ElementTree as ET

SOURCE_ID = "stackexchange-data-dump-tex"
BODY_HISTORY_TYPES = {2, 5, 8}
LICENSE_URL = "https://stackoverflow.com/help/licensing"
LICENSE_BOUNDARIES = (
    (datetime(2011, 4, 8, tzinfo=timezone.utc), "CC-BY-SA-2.5"),
    (datetime(2018, 5, 2, tzinfo=timezone.utc), "CC-BY-SA-3.0"),
)
SUPPRESS_PATTERNS = [
    re.compile(r"<!--.*?-->", re.DOTALL),
    re.compile(r"<pre\b[^>]*>.*?</pre\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<code\b[^>]*>.*?</code\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<script\b[^>]*>.*?</script\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<style\b[^>]*>.*?</style\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"(?ms)^ {0,3}```[^\n]*\n.*?^ {0,3}```[ \t]*$"),
    re.compile(r"(?ms)^ {0,3}~~~[^\n]*\n.*?^ {0,3}~~~[ \t]*$"),
    re.compile(r"(?s)(`+)(?:(?!\1).)*?\1"),
]
MATH_RE = re.compile(
    r"(?<!\\)(?:"
    r"\$\$(?P<dollar_display>.+?)(?<!\\)\$\$"
    r"|\\\[(?P<bracket_display>.+?)\\\]"
    r"|\\\((?P<paren_inline>.+?)\\\)"
    r"|(?<!\$)\$(?!\$)(?P<dollar_inline>[^\n]*?)(?<!\\)\$(?!\$)"
    r")",
    re.DOTALL,
)
SPACE_RE = re.compile(r"\s+")
TAG_RE = re.compile(r"<[^>]+>")


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def parse_dump_timestamp(value: str) -> datetime:
    normalized = value.rstrip("Z")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def license_for_revision(creation_date: str) -> str:
    moment = parse_dump_timestamp(creation_date)
    if moment < LICENSE_BOUNDARIES[0][0]:
        return "CC-BY-SA-2.5"
    if moment < LICENSE_BOUNDARIES[1][0]:
        return "CC-BY-SA-3.0"
    return "CC-BY-SA-4.0"


def mask_suppressed(text: str) -> str:
    chars = list(text)
    for pattern in SUPPRESS_PATTERNS:
        for match in pattern.finditer(text):
            for index in range(match.start(), match.end()):
                if chars[index] not in "\r\n":
                    chars[index] = " "
    return "".join(chars)


def expression_kind(match: re.Match[str]) -> str:
    if match.group("dollar_display") is not None or match.group("bracket_display") is not None:
        return "display"
    return "inline"


def expression_body(match: re.Match[str]) -> str:
    for name in ("dollar_display", "bracket_display", "paren_inline", "dollar_inline"):
        value = match.group(name)
        if value is not None:
            return value
    raise AssertionError("math match without body")


def iter_math(markdown: str):
    masked = mask_suppressed(markdown)
    for match in MATH_RE.finditer(masked):
        body = expression_body(match)
        if not body.strip():
            continue
        raw = markdown[match.start() : match.end()]
        yield match.start(), match.end(), raw, body, expression_kind(match)


def context_for(markdown: str, start: int, end: int, radius: int = 500) -> str:
    snippet = markdown[max(0, start - radius) : min(len(markdown), end + radius)]
    snippet = TAG_RE.sub(" ", snippet)
    return SPACE_RE.sub(" ", snippet).strip()


def resolve_dump_files(input_path: Path, post_history: Path | None, posts: Path | None) -> tuple[Path, Path | None]:
    if post_history is not None:
        history_path = post_history
    elif input_path.is_dir():
        history_path = input_path / "PostHistory.xml"
    else:
        history_path = input_path
    if not history_path.is_file():
        raise FileNotFoundError(f"PostHistory.xml not found: {history_path}")

    if posts is not None:
        posts_path = posts
    else:
        candidate = history_path.parent / "Posts.xml"
        posts_path = candidate if candidate.is_file() else None
    return history_path, posts_path


def initialize_db(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA temp_store = MEMORY;
        CREATE TABLE latest_body (
            post_id INTEGER PRIMARY KEY,
            history_id INTEGER NOT NULL,
            history_type_id INTEGER NOT NULL,
            creation_date TEXT NOT NULL,
            revision_guid TEXT,
            revision_user_id INTEGER,
            body_markdown TEXT NOT NULL,
            body_sha256 TEXT NOT NULL,
            post_type_id INTEGER,
            parent_id INTEGER,
            owner_user_id INTEGER,
            title TEXT,
            tags TEXT,
            score INTEGER
        );
        """
    )


def index_latest_bodies(connection: sqlite3.Connection, history_path: Path) -> dict[str, int]:
    metrics = {"history_rows_seen": 0, "body_revisions_seen": 0, "latest_body_rows": 0}
    sql = """
        INSERT INTO latest_body (
            post_id, history_id, history_type_id, creation_date, revision_guid,
            revision_user_id, body_markdown, body_sha256
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(post_id) DO UPDATE SET
            history_id=excluded.history_id,
            history_type_id=excluded.history_type_id,
            creation_date=excluded.creation_date,
            revision_guid=excluded.revision_guid,
            revision_user_id=excluded.revision_user_id,
            body_markdown=excluded.body_markdown,
            body_sha256=excluded.body_sha256
        WHERE excluded.creation_date > latest_body.creation_date
           OR (excluded.creation_date = latest_body.creation_date AND excluded.history_id > latest_body.history_id)
    """
    batch: list[tuple] = []
    for _, element in ET.iterparse(history_path, events=("end",)):
        if element.tag != "row":
            element.clear()
            continue
        metrics["history_rows_seen"] += 1
        attrs = element.attrib
        try:
            history_type = int(attrs.get("PostHistoryTypeId", "0"))
        except ValueError:
            element.clear()
            continue
        if history_type not in BODY_HISTORY_TYPES or not attrs.get("Text"):
            element.clear()
            continue
        metrics["body_revisions_seen"] += 1
        body = attrs["Text"]
        batch.append(
            (
                int(attrs["PostId"]),
                int(attrs["Id"]),
                history_type,
                attrs["CreationDate"],
                attrs.get("RevisionGUID"),
                int(attrs["UserId"]) if attrs.get("UserId") else None,
                body,
                sha256_text(body),
            )
        )
        if len(batch) >= 5000:
            connection.executemany(sql, batch)
            connection.commit()
            batch.clear()
        element.clear()
    if batch:
        connection.executemany(sql, batch)
        connection.commit()
    metrics["latest_body_rows"] = connection.execute("SELECT COUNT(*) FROM latest_body").fetchone()[0]
    return metrics


def enrich_posts(connection: sqlite3.Connection, posts_path: Path | None) -> dict[str, int]:
    metrics = {"posts_rows_seen": 0, "posts_metadata_matched": 0}
    if posts_path is None:
        return metrics
    sql = """
        UPDATE latest_body SET
            post_type_id=?, parent_id=?, owner_user_id=?, title=?, tags=?, score=?
        WHERE post_id=?
    """
    batch: list[tuple] = []
    for _, element in ET.iterparse(posts_path, events=("end",)):
        if element.tag != "row":
            element.clear()
            continue
        metrics["posts_rows_seen"] += 1
        attrs = element.attrib
        if not attrs.get("Id"):
            element.clear()
            continue
        batch.append(
            (
                int(attrs["PostTypeId"]) if attrs.get("PostTypeId") else None,
                int(attrs["ParentId"]) if attrs.get("ParentId") else None,
                int(attrs["OwnerUserId"]) if attrs.get("OwnerUserId") else None,
                attrs.get("Title"),
                attrs.get("Tags"),
                int(attrs["Score"]) if attrs.get("Score") else None,
                int(attrs["Id"]),
            )
        )
        if len(batch) >= 5000:
            before = connection.total_changes
            connection.executemany(sql, batch)
            connection.commit()
            metrics["posts_metadata_matched"] += connection.total_changes - before
            batch.clear()
        element.clear()
    if batch:
        before = connection.total_changes
        connection.executemany(sql, batch)
        connection.commit()
        metrics["posts_metadata_matched"] += connection.total_changes - before
    return metrics


def emit_records(connection: sqlite3.Connection, output_handle, *, site: str, snapshot: str) -> dict[str, int]:
    metrics = {
        "posts_with_latest_body": 0,
        "posts_with_math": 0,
        "math_seen": 0,
        "math_empty": 0,
        "records_written": 0,
        "reconstructions": 0,
        "ocr_performed": 0,
    }
    query = """
        SELECT post_id, history_id, history_type_id, creation_date, revision_guid,
               revision_user_id, body_markdown, body_sha256, post_type_id, parent_id,
               owner_user_id, title, tags, score
        FROM latest_body ORDER BY post_id
    """
    for row in connection.execute(query):
        (
            post_id,
            history_id,
            history_type_id,
            creation_date,
            revision_guid,
            revision_user_id,
            markdown,
            body_sha256,
            post_type_id,
            parent_id,
            owner_user_id,
            title,
            tags,
            score,
        ) = row
        metrics["posts_with_latest_body"] += 1
        matches = list(iter_math(markdown))
        if not matches:
            continue
        metrics["posts_with_math"] += 1
        metrics["math_seen"] += len(matches)
        for formula_index, (start, end, expression, body, kind) in enumerate(matches, start=1):
            expression_sha = sha256_text(expression)
            source_payload = {
                "site": site,
                "post_id": post_id,
                "revision_guid": revision_guid,
                "history_id": history_id,
                "formula_index": formula_index,
                "expression_sha256": expression_sha,
            }
            normalized = SPACE_RE.sub(" ", body).strip()
            record = {
                "schema_version": 1,
                "source_id": SOURCE_ID,
                "source_snapshot": snapshot,
                "provenance_class": "attested",
                "expression_original": expression,
                "expression_encoding": "TeX-in-StackExchange-Markdown",
                "source_record_sha256": sha256_text(json.dumps(source_payload, sort_keys=True, separators=(",", ":"))),
                "expression_sha256": expression_sha,
                "normalized_text": normalized,
                "normalized_text_sha256": sha256_text(normalized),
                "source_document_id": f"{site}:post:{post_id}:revision:{revision_guid or history_id}",
                "source_document_url": f"https://{site}/posts/{post_id}/revisions",
                "source_locator": f"PostHistory:{history_id}#math[{formula_index}]",
                "source_license": license_for_revision(creation_date),
                "source_license_url": LICENSE_URL,
                "source_site": site,
                "source_post_id": post_id,
                "source_post_type_id": post_type_id,
                "source_parent_id": parent_id,
                "source_owner_user_id": owner_user_id,
                "source_revision_user_id": revision_user_id,
                "source_revision_guid": revision_guid,
                "source_history_id": history_id,
                "source_history_type_id": history_type_id,
                "source_revision_created_at": creation_date,
                "source_body_sha256": body_sha256,
                "source_title": title,
                "source_tags": tags,
                "source_score": score,
                "source_context": context_for(markdown, start, end),
                "math_display": kind,
                "source_attested_payload": {
                    "raw_markdown_tex_preserved": True,
                    "latest_body_revision_selected_from_posthistory": True,
                    "code_regions_suppressed": True,
                    "ocr_performed": False,
                    "reconstruction_performed": False,
                },
            }
            output_handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")
            metrics["records_written"] += 1
    return metrics


def harvest(
    input_path: Path,
    output_handle,
    *,
    site: str,
    snapshot: str,
    post_history: Path | None = None,
    posts: Path | None = None,
    sqlite_path: Path | None = None,
) -> dict[str, int]:
    history_path, posts_path = resolve_dump_files(input_path, post_history, posts)
    cleanup = False
    if sqlite_path is None:
        handle = tempfile.NamedTemporaryFile(prefix="atlas-stackexchange-", suffix=".sqlite3", delete=False)
        handle.close()
        sqlite_path = Path(handle.name)
        cleanup = True
    try:
        connection = sqlite3.connect(sqlite_path)
        try:
            initialize_db(connection)
            history_metrics = index_latest_bodies(connection, history_path)
            post_metrics = enrich_posts(connection, posts_path)
            emit_metrics = emit_records(connection, output_handle, site=site, snapshot=snapshot)
        finally:
            connection.close()
    finally:
        if cleanup:
            sqlite_path.unlink(missing_ok=True)
    return {**history_metrics, **post_metrics, **emit_metrics}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Extracted site dump directory or PostHistory.xml")
    parser.add_argument("--site", required=True, help="Stack Exchange site hostname, e.g. math.stackexchange.com")
    parser.add_argument("--snapshot", required=True, help="Content-addressed source snapshot identifier")
    parser.add_argument("--post-history", help="Optional explicit PostHistory.xml path")
    parser.add_argument("--posts", help="Optional explicit Posts.xml path for metadata enrichment")
    parser.add_argument("--sqlite", help="Optional SQLite scratch index path")
    args = parser.parse_args()

    metrics = harvest(
        Path(args.input),
        sys.stdout,
        site=args.site,
        snapshot=args.snapshot,
        post_history=Path(args.post_history) if args.post_history else None,
        posts=Path(args.posts) if args.posts else None,
        sqlite_path=Path(args.sqlite) if args.sqlite else None,
    )
    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
