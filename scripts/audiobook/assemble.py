#!/usr/bin/env python3
"""Assemble TTS segments into a distributable chapter.

This stage is intentionally model-agnostic. It consumes the common media
manifest plus the original TTS plan, concatenates segment audio with ffmpeg,
and emits a stable MP3, WebVTT transcript and assembly manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ASSEMBLY_SCHEMA = "audiobook-assembly-v1"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def vtt_time(milliseconds: int) -> str:
    if milliseconds < 0:
        raise ValueError("negative VTT timestamp")
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, millis = divmod(remainder, 1_000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{millis:03d}"


def vtt_text(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def make_vtt(plan: dict, media_manifest: dict) -> tuple[str, int]:
    media_by_id = {segment["segment_id"]: segment for segment in media_manifest["segments"]}
    lines = ["WEBVTT", ""]
    cursor_ms = 0

    for index, segment in enumerate(plan["segments"], start=1):
        segment_id = segment["segment_id"]
        media = media_by_id.get(segment_id)
        if media is None:
            raise ValueError(f"media manifest missing segment {segment_id}")
        duration_ms = int(media["duration_ms"])
        if duration_ms <= 0:
            raise ValueError(f"invalid duration for {segment_id}: {duration_ms}")
        end_ms = cursor_ms + duration_ms
        speaker = vtt_text(str(segment["speaker"]))
        text = vtt_text(str(segment["text"]).strip())
        lines.extend(
            [
                str(index),
                f"{vtt_time(cursor_ms)} --> {vtt_time(end_ms)}",
                f"<v {speaker}>{text}",
                "",
            ]
        )
        cursor_ms = end_ms

    extra_ids = set(media_by_id) - {segment["segment_id"] for segment in plan["segments"]}
    if extra_ids:
        raise ValueError(f"media manifest contains unplanned segments: {', '.join(sorted(extra_ids))}")

    return "\n".join(lines), cursor_ms


def quote_concat_path(path: Path) -> str:
    # ffmpeg concat files use single-quoted paths; embedded quotes are escaped
    # using the shell-compatible sequence accepted by the concat demuxer.
    return "'" + str(path.resolve()).replace("'", "'\\''") + "'"


def assemble(plan_path: Path, media_dir: Path, output_dir: Path, bitrate: str) -> dict:
    plan = load_json(plan_path)
    media_manifest_path = media_dir / "manifest.json"
    media_manifest = load_json(media_manifest_path)

    for field in ("work_id", "chapter_id"):
        if plan.get(field) != media_manifest.get(field):
            raise ValueError(f"{field} mismatch between plan and media manifest")

    media_by_id = {segment["segment_id"]: segment for segment in media_manifest["segments"]}
    ordered_paths = []
    for segment in plan["segments"]:
        media = media_by_id.get(segment["segment_id"])
        if media is None:
            raise ValueError(f"media manifest missing segment {segment['segment_id']}")
        audio_path = media_dir / media["audio_file"]
        if not audio_path.is_file():
            raise ValueError(f"missing segment audio: {audio_path}")
        if sha256_file(audio_path) != media["audio_digest"]:
            raise ValueError(f"audio digest mismatch: {segment['segment_id']}")
        ordered_paths.append(audio_path)

    output_dir.mkdir(parents=True, exist_ok=True)
    chapter_id = plan["chapter_id"]
    audio_path = output_dir / f"{chapter_id}.mp3"
    transcript_path = output_dir / f"{chapter_id}.vtt"
    concat_path = output_dir / "concat.txt"
    concat_path.write_text(
        "".join(f"file {quote_concat_path(path)}\n" for path in ordered_paths),
        encoding="utf-8",
    )

    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat_path),
        "-vn",
        "-ac",
        "1",
        "-c:a",
        "libmp3lame",
        "-b:a",
        bitrate,
        str(audio_path),
    ]
    subprocess.run(command, check=True)

    transcript, duration_ms = make_vtt(plan, media_manifest)
    transcript_path.write_text(transcript, encoding="utf-8")
    concat_path.unlink(missing_ok=True)

    result = {
        "schema": ASSEMBLY_SCHEMA,
        "work_id": plan["work_id"],
        "chapter_id": chapter_id,
        "narration_digest": plan.get("narration_digest"),
        "backend": media_manifest.get("backend"),
        "model": media_manifest.get("model"),
        "duration_seconds": round(duration_ms / 1000, 3),
        "audio": {
            "file": audio_path.name,
            "bytes": audio_path.stat().st_size,
            "sha256": sha256_file(audio_path),
            "type": "audio/mpeg",
            "bitrate": bitrate,
        },
        "transcript": {
            "file": transcript_path.name,
            "bytes": transcript_path.stat().st_size,
            "sha256": sha256_file(transcript_path),
            "type": "text/vtt",
            "language": plan.get("lang", "pt-BR"),
        },
    }
    (output_dir / "assembly.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", required=True, type=Path)
    parser.add_argument("--media-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--bitrate", default="96k")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = assemble(args.plan, args.media_dir, args.output_dir, args.bitrate)
    except Exception as error:  # CLI boundary.
        print(f"audiobook assemble failed: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
