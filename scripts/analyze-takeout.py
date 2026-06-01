#!/usr/bin/env python3
"""
analyze-takeout.py

Extract and summarize data from a Google Takeout ZIP file.
Designed for the franklinbaldo.github.io takeout analysis workflow.

Usage:
    python3 scripts/analyze-takeout.py path/to/takeout.zip [--output summary.md]

Works with local zip files. For Drive access, download first:
    rclone copy "gdrive:Takeout/takeout-20260524T151400Z-6-001.zip" /tmp/

The script reads only small files from the zip (CSV, JSON under 1 MB each)
and skips large binary files (TCX tracks, MP4 videos, etc.) to stay fast.
"""

import argparse
import csv
import io
import json
import sys
import zipfile
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser(description="Analyze a Google Takeout ZIP")
    p.add_argument("zipfile", help="Path to the takeout .zip file")
    p.add_argument("--output", "-o", default=None, help="Output markdown file (default: stdout)")
    p.add_argument("--max-file-size", type=int, default=1_000_000, help="Skip files larger than N bytes (default: 1 MB)")
    return p.parse_args()


def human_size(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def list_fit_activities(zf, max_size):
    """List Fit activity files and extract date range."""
    activities = []
    for name in zf.namelist():
        if "Atividades/" in name and name.endswith(".tcx"):
            info = zf.getinfo(name)
            basename = Path(name).stem  # e.g. "2017-05-27T19_37_00-04_00_Bicicleta"
            parts = basename.split("_")
            try:
                date_str = parts[0]  # "2017-05-27T19"
                date = datetime.strptime(date_str[:10], "%Y-%m-%d").date()
                activity_type = parts[-1] if len(parts) > 1 else "unknown"
                activities.append((date, activity_type, info.file_size))
            except (ValueError, IndexError):
                pass
    return sorted(activities)


def find_fit_gap(activities, gap_days=30):
    """Find gaps > gap_days between consecutive activity dates."""
    gaps = []
    for i in range(1, len(activities)):
        d0, d1 = activities[i - 1][0], activities[i][0]
        delta = (d1 - d0).days
        if delta > gap_days:
            gaps.append((d0, d1, delta))
    return gaps


def read_fit_daily_csvs(zf, max_size, limit=5):
    """Read a sample of daily metric CSVs."""
    samples = []
    files = sorted(
        [n for n in zf.namelist() if "Métricas de atividades diárias/" in n and n.endswith(".csv")],
        reverse=True,
    )
    for name in files[:limit]:
        info = zf.getinfo(name)
        if info.file_size > max_size:
            continue
        try:
            with zf.open(name) as f:
                content = f.read().decode("utf-8", errors="replace")
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
            samples.append((Path(name).stem, rows))
        except Exception:
            pass
    return samples


def read_books(zf, max_size):
    """List Play Books HTML annotation files."""
    books = []
    for name in zf.namelist():
        if "Google Play Livros/" in name and name.endswith(".html"):
            title = Path(name).stem
            books.append(title)
    return sorted(books)


def read_youtube_playlists(zf, max_size):
    """Read playlists.csv if available."""
    for name in zf.namelist():
        if "playlists/playlists.csv" in name or name.endswith("playlists.csv"):
            info = zf.getinfo(name)
            if info.file_size > max_size:
                continue
            try:
                with zf.open(name) as f:
                    content = f.read().decode("utf-8", errors="replace")
                reader = csv.DictReader(io.StringIO(content))
                return list(reader)
            except Exception:
                pass
    return []


def read_youtube_watch_history(zf, max_size, limit=20):
    """Read watch history HTML and extract recent entries."""
    for name in zf.namelist():
        if "histórico/histórico de visualização" in name and name.endswith(".html"):
            info = zf.getinfo(name)
            if info.file_size > max_size * 5:
                return f"(file too large: {human_size(info.file_size)})"
            try:
                with zf.open(name) as f:
                    html = f.read().decode("utf-8", errors="replace")
                # crude extraction: find video titles in the HTML
                import re
                titles = re.findall(r'<a[^>]+href="https://www\.youtube\.com/watch[^"]*"[^>]*>([^<]+)</a>', html)
                return titles[:limit]
            except Exception:
                pass
    return []


def summarize(zf, max_size):
    lines = []

    def h(n, text):
        lines.append(f"\n{'#' * n} {text}\n")

    def row(k, v):
        lines.append(f"- **{k}**: {v}")

    # File list overview
    all_files = zf.namelist()
    total_size = sum(zf.getinfo(n).file_size for n in all_files)
    h(2, "Archive overview")
    row("Total files in this zip", len(all_files))
    row("Total uncompressed size", human_size(total_size))

    # Activity files
    h(2, "Google Fit — activities")
    activities = list_fit_activities(zf, max_size)
    if activities:
        by_type = defaultdict(int)
        for _, atype, _ in activities:
            by_type[atype] += 1
        row("Total activity files", len(activities))
        row("Date range", f"{activities[0][0]} → {activities[-1][0]}")
        row("Activity types", ", ".join(f"{k}: {v}" for k, v in sorted(by_type.items(), key=lambda x: -x[1])))

        gaps = find_fit_gap(activities)
        if gaps:
            h(3, "Gaps > 30 days")
            for g0, g1, days in gaps:
                lines.append(f"- {g0} → {g1} ({days} days)")
        else:
            lines.append("_No gaps > 30 days found._")
    else:
        lines.append("_No .tcx activity files found in this zip._")

    # Daily CSVs sample
    h(2, "Google Fit — daily metrics (sample)")
    samples = read_fit_daily_csvs(zf, max_size)
    if samples:
        for date_str, rows in samples:
            if rows:
                row(date_str, ", ".join(f"{k}: {v}" for k, v in list(rows[0].items())[:5]))
    else:
        lines.append("_No daily metric CSVs found or all too large._")

    # Books
    h(2, "Google Play Livros")
    books = read_books(zf, max_size)
    if books:
        row("Total books", len(books))
        lines.append("")
        for b in books:
            lines.append(f"- {b}")
    else:
        lines.append("_No book annotation files found._")

    # YouTube playlists
    h(2, "YouTube playlists")
    playlists = read_youtube_playlists(zf, max_size)
    if playlists:
        row("Total playlists", len(playlists))
        for pl in playlists:
            name = pl.get("Playlist title") or pl.get("Title") or str(pl)
            lines.append(f"- {name}")
    else:
        lines.append("_playlists.csv not found or too large._")

    # Watch history
    h(2, "YouTube watch history (recent)")
    history = read_youtube_watch_history(zf, max_size)
    if isinstance(history, str):
        lines.append(history)
    elif history:
        for title in history:
            lines.append(f"- {title}")
    else:
        lines.append("_Watch history not found in this zip._")

    return "\n".join(lines)


def main():
    args = parse_args()
    zip_path = Path(args.zipfile)
    if not zip_path.exists():
        print(f"Error: {zip_path} not found", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(zip_path) as zf:
        report = summarize(zf, args.max_file_size)

    header = f"# Google Takeout Analysis\n\n**File**: {zip_path.name}  \n**Generated**: {datetime.now().isoformat()}\n"
    output = header + report

    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
        print(f"Report written to {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
