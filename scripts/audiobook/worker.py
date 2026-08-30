#!/usr/bin/env python3
"""Audiobook Factory media worker.

The worker deliberately has no editorial intelligence. It receives an already
validated TTS plan and turns each request into audio through a selected backend.
The initial `fake` backend produces deterministic WAV tones so the complete
control-plane can be exercised without secrets, network access, or GPU time.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import struct
import subprocess
import sys
import wave
import zipfile

PLAN_SCHEMA = "audiobook-tts-plan-v1"
MANIFEST_SCHEMA = "audiobook-media-manifest-v1"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def load_plan(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as stream:
        plan = json.load(stream)
    if plan.get("schema") != PLAN_SCHEMA:
        raise ValueError(f"unsupported plan schema: {plan.get('schema')!r}")
    if not plan.get("work_id") or not plan.get("chapter_id"):
        raise ValueError("plan requires work_id and chapter_id")
    segments = plan.get("segments")
    if not isinstance(segments, list) or not segments:
        raise ValueError("plan requires a non-empty segments array")
    return plan


def hardware_info() -> dict:
    result = {
        "python": platform.python_version(),
        "platform": platform.platform(),
        "gpu": None,
    }
    try:
        completed = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
        if completed.returncode == 0 and completed.stdout.strip():
            result["gpu"] = completed.stdout.strip().splitlines()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return result


def fake_synthesize(segment: dict, output_path: Path) -> dict:
    """Write deterministic audible proof-of-pipeline audio for one segment."""

    seed = hashlib.sha256(segment["input_digest"].encode("utf-8")).digest()
    sample_rate = 16_000
    duration_ms = 220 + seed[0]
    frequency = 220 + seed[1] * 2
    frames = round(sample_rate * duration_ms / 1000)
    amplitude = 0.12 * 32767

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(sample_rate)
        for index in range(frames):
            sample = int(amplitude * math.sin(2 * math.pi * frequency * index / sample_rate))
            stream.writeframesraw(struct.pack("<h", sample))

    return {
        "duration_ms": duration_ms,
        "sample_rate": sample_rate,
        "audio_digest": sha256_file(output_path),
    }


BACKENDS = {
    "fake": fake_synthesize,
}


def make_archive(output_dir: Path, archive_path: Path) -> None:
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in sorted(output_dir.rglob("*")):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(output_dir))


def run(plan_path: Path, output_dir: Path, backend: str, model: str, archive_path: Path | None) -> dict:
    plan = load_plan(plan_path)
    if backend not in BACKENDS:
        raise ValueError(f"unsupported backend: {backend}; available: {', '.join(sorted(BACKENDS))}")

    output_dir.mkdir(parents=True, exist_ok=True)
    segment_dir = output_dir / "segments"
    synthesize = BACKENDS[backend]
    manifest_segments = []

    for index, segment in enumerate(plan["segments"]):
        for field in ("segment_id", "speaker", "text", "input_digest"):
            if not segment.get(field):
                raise ValueError(f"segment {index} missing {field}")
        audio_path = segment_dir / f"{segment['segment_id']}.wav"
        generated = synthesize(segment, audio_path)
        manifest_segments.append(
            {
                "segment_id": segment["segment_id"],
                "speaker": segment["speaker"],
                "input_digest": segment["input_digest"],
                "audio_file": str(audio_path.relative_to(output_dir)),
                **generated,
            }
        )

    manifest = {
        "schema": MANIFEST_SCHEMA,
        "work_id": plan["work_id"],
        "chapter_id": plan["chapter_id"],
        "narration_digest": plan.get("narration_digest"),
        "backend": backend,
        "model": model,
        "hardware": hardware_info(),
        "segments": manifest_segments,
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if archive_path is not None:
        make_archive(output_dir, archive_path)

    return manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--backend", default="fake", choices=sorted(BACKENDS))
    parser.add_argument("--model", default="deterministic-tone-v1")
    parser.add_argument("--result-archive", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        manifest = run(args.plan, args.output_dir, args.backend, args.model, args.result_archive)
    except Exception as error:  # noqa: BLE001 - CLI boundary must surface deterministic non-zero failure.
        print(f"audiobook worker failed: {error}", file=sys.stderr)
        return 2

    print(
        json.dumps(
            {
                "status": "ok",
                "work_id": manifest["work_id"],
                "chapter_id": manifest["chapter_id"],
                "backend": manifest["backend"],
                "segments": len(manifest["segments"]),
                "output_dir": os.fspath(args.output_dir),
                "result_archive": os.fspath(args.result_archive) if args.result_archive else None,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
