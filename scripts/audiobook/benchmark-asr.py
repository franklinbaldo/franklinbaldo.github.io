#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["faster-whisper==1.1.1", "requests"]
# ///
"""Score a benchmark's audio against its own text, without listening to it.

A green workflow only proves that a backend produced bytes. To decide whether a
TTS backend is usable for a language you need evidence about the audio itself,
and the cheapest objective proxy is automatic speech recognition:

- decoding with language detection left free says which language the backend
  *actually* spoke, which is how Breeze TTS 2 was caught reading Portuguese with
  English phonetics;
- decoding forced to the target language gives a word error rate against the
  exact text the plan asked for.

Neither replaces a human listening. Both are reproducible and comparable across
backends, which a subjective note is not.

Usage:
    scripts/audiobook/benchmark-asr.py <manifest.json> <plan.json> [--out report.json]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import statistics
import unicodedata

from faster_whisper import WhisperModel


def normalize(text: str) -> list[str]:
    """Lowercase, strip accents and punctuation, and split into words."""
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-z0-9]+", text)


def word_error_rate(reference: list[str], hypothesis: list[str]) -> float:
    previous = list(range(len(hypothesis) + 1))
    for index, expected in enumerate(reference, 1):
        current = [index]
        for position, actual in enumerate(hypothesis, 1):
            current.append(
                min(
                    previous[position] + 1,
                    current[position - 1] + 1,
                    previous[position - 1] + (expected != actual),
                )
            )
        previous = current
    return previous[-1] / max(len(reference), 1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("plan", type=Path)
    parser.add_argument("--language", default="pt")
    parser.add_argument("--model", default="small")
    parser.add_argument("--out", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    texts = {segment["segment_id"]: segment["text"] for segment in plan["segments"]}
    root = args.manifest.parent

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    rows = []
    for segment in manifest["segments"]:
        audio = str(root / segment["audio_file"])
        detected, info = model.transcribe(audio, beam_size=5)
        detected_text = " ".join(piece.text.strip() for piece in detected).strip()

        forced, _ = model.transcribe(audio, beam_size=5, language=args.language)
        forced_text = " ".join(piece.text.strip() for piece in forced).strip()

        reference = texts.get(segment["segment_id"], "")
        rows.append(
            {
                "segment_id": segment["segment_id"],
                "detected_language": info.language,
                "detected_language_probability": round(info.language_probability, 3),
                "detected_transcript": detected_text,
                "forced_transcript": forced_text,
                "wer": round(
                    word_error_rate(normalize(reference), normalize(forced_text)), 3
                ),
            }
        )
        row = rows[-1]
        print(
            f"{row['segment_id']:44s} lang={row['detected_language']:3s} "
            f"WER={row['wer']:5.2f}  {row['forced_transcript'][:80]}",
            flush=True,
        )

    languages: dict[str, int] = {}
    for row in rows:
        languages[row["detected_language"]] = (
            languages.get(row["detected_language"], 0) + 1
        )
    summary = {
        "backend": manifest.get("backend"),
        "model": manifest.get("model"),
        "target_language": args.language,
        "detected_languages": languages,
        "median_wer": round(statistics.median(row["wer"] for row in rows), 3),
        "mean_wer": round(statistics.fmean(row["wer"] for row in rows), 3),
    }
    print(f"\n{json.dumps(summary, ensure_ascii=False)}")

    if args.out:
        args.out.write_text(
            json.dumps({"summary": summary, "segments": rows}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
