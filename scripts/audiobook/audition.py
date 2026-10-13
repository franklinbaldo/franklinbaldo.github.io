#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["litellm>=1.60", "soundfile", "numpy", "pyyaml"]
# ///
"""Describe synthesized audio against a rubric, so quality is checked and not assumed.

A green workflow proves that a backend produced bytes. Word error rate proves the
words came out. Neither notices that a segment drifted into European Portuguese,
that a voice aged ten years between chapters, or that a clip carries a click no
one will hear until the whole book is assembled.

This asks an audio-capable model to *describe* each clip on the dimensions a
rubric declares — perceived age, gender, accent, articulation, naturalness,
artefacts — and then computes the fit against the target profile locally. The
model is not asked which clip is best: its taste is not the one that matters,
and a description can be checked while an opinion cannot.

Usage:
    scripts/audiobook/audition.py <manifest.json> --papel narrador [--group X]
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import os
from pathlib import Path
import re
import sys
import time

import litellm
import numpy as np
import soundfile as sf
import yaml

DEFAULT_MODEL = "gemini/gemini-3.6-flash"
RUBRICS_PATH = Path("data/audiobook-rubrics/roles.yaml")


def to_mp3_base64(path: Path, rate: int = 24000) -> str:
    """Downmix, resample and level a clip, then inline it as base64 MP3.

    Levelling matters: a louder clip reads as "better" to a listener and to a
    model alike, and loudness is exactly the property this check should ignore.
    """
    audio, source_rate = sf.read(str(path), dtype="float32", always_2d=True)
    mono = audio.mean(axis=1)
    if source_rate != rate:
        count = int(round(len(mono) * rate / source_rate))
        mono = np.interp(
            np.linspace(0, len(mono) - 1, count), np.arange(len(mono)), mono
        ).astype("float32")
    peak = float(np.max(np.abs(mono))) or 1.0
    mono = mono * (0.9 / peak)
    buffer = io.BytesIO()
    sf.write(buffer, mono, rate, format="MP3")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def fit_score(observed: dict, rubric: dict) -> float:
    """How close one described clip lands to the rubric's target, from 0 to 100."""
    total = penalty = 0.0
    for field, target in rubric["alvo"].items():
        weight = float(rubric["peso"][field])
        total += weight
        value = observed.get(field)
        if value is None:
            penalty += weight
        elif isinstance(target, str):
            penalty += 0.0 if str(value).lower().startswith(target[:5].lower()) else weight
        elif field == "idade_aparente":
            # Six years off is a total miss; nearer than that scales linearly.
            penalty += weight * min(abs(float(value) - target) / 6.0, 1.0)
        else:
            penalty += weight * min(abs(float(value) - target) / 5.0, 1.0)
    return round(100 * (1 - penalty / total), 1) if total else 0.0


def build_prompt(rubric: dict, scales: dict, count: int) -> str:
    fields = "\n".join(f'  "{name}": {how}' for name, how in scales.items()
                       if name in rubric["alvo"])
    return (
        "Você avalia amostras de voz sintética para audiolivro em português brasileiro.\n\n"
        f"PAPEL A PREENCHER: {rubric['briefing']}\n\n"
        f"Vou enviar {count} amostras numeradas. Elas foram niveladas no mesmo volume, "
        "então julgue timbre, idade, sotaque e defeitos — nunca volume.\n\n"
        "NÃO escolha a melhor. Para CADA amostra, descreva o que você ouve:\n"
        f"{fields}\n"
        '  "descricao": uma frase sobre a voz\n'
        '  "defeito": o problema mais audível, ou null\n\n'
        'Responda SÓ com JSON: {"amostras": [{"n": "1", ...}, ...]}, incluindo todas '
        'as amostras, com "n" exatamente como eu numerar.'
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--papel", required=True)
    parser.add_argument("--group", default=None)
    parser.add_argument("--model", default=os.environ.get("AUDITION_MODEL", DEFAULT_MODEL))
    parser.add_argument("--rubrics", type=Path, default=RUBRICS_PATH)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--limit", type=int, default=24)
    parser.add_argument("--min-fit", type=float, default=None,
                        help="falha se a mediana do fit ficar abaixo disto")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not os.environ.get("GEMINI_API_KEY"):
        print("GEMINI_API_KEY não definida; pulando a audição.", file=sys.stderr)
        return 0

    document = yaml.safe_load(args.rubrics.read_text(encoding="utf-8"))
    if args.papel not in document["papeis"]:
        print(f"papel desconhecido: {args.papel}; "
              f"conhecidos: {', '.join(sorted(document['papeis']))}", file=sys.stderr)
        return 2
    rubric = document["papeis"][args.papel]

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    entries = manifest.get("clips") or manifest.get("segments") or []
    if args.group:
        entries = [c for c in entries if c.get("group") == args.group]
    entries = entries[: args.limit]
    if not entries:
        print("nenhuma amostra para avaliar", file=sys.stderr)
        return 2

    root = args.manifest.parent
    # Plain integers: asked to echo ids like "M13", the model returned "M1300".
    index = {str(i): clip for i, clip in enumerate(entries, 1)}

    parts: list[dict] = [{"type": "text",
                          "text": build_prompt(rubric, document["escalas"], len(entries))}]
    for number, clip in index.items():
        audio_file = clip.get("audio_file")
        parts.append({"type": "text", "text": f"\namostra {number}:"})
        parts.append({"type": "input_audio",
                      "input_audio": {"data": to_mp3_base64(root / audio_file),
                                      "format": "mp3"}})

    print(f"audição: {len(entries)} amostras · papel {args.papel} · {args.model}", flush=True)
    # A judge that is briefly overloaded is not a quality signal, so retry the
    # transient failures rather than reporting them as a bad audition.
    text = ""
    for attempt in range(1, 4):
        try:
            response = litellm.completion(
                model=args.model, messages=[{"role": "user", "content": parts}],
                temperature=0,
            )
            text = response.choices[0].message.content or ""
            break
        except Exception as error:
            transient = any(code in str(error) for code in ("503", "429", "UNAVAILABLE"))
            if attempt == 3 or not transient:
                print(f"audição indisponível: {str(error)[:200]}", file=sys.stderr)
                return 0 if transient else 1
            wait = 15 * attempt
            print(f"  tentativa {attempt} falhou; nova em {wait}s", file=sys.stderr)
            time.sleep(wait)
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        print("o juiz não devolveu JSON:", text[:400], file=sys.stderr)
        return 1

    rows = []
    for observed in json.loads(match.group(0)).get("amostras", []):
        digits = re.sub(r"\D", "", str(observed.get("n", "")))
        clip = index.get(str(int(digits))) if digits else None
        if not clip:
            continue
        rows.append({
            "clip_id": clip.get("clip_id") or clip.get("segment_id"),
            "label": clip.get("label", ""),
            "fit": fit_score(observed, rubric),
            **observed,
        })
    rows.sort(key=lambda row: -row["fit"])

    print(f"\n{'fit':>5}  {'id':14s} {'idade':>5} {'sotaque':11s} {'nat':>4} {'art':>4}  descrição")
    for row in rows:
        print(f"{row['fit']:5.1f}  {str(row['clip_id'])[:14]:14s} "
              f"{str(row.get('idade_aparente', '—')):>5} "
              f"{str(row.get('sotaque', '—'))[:11]:11s} "
              f"{str(row.get('naturalidade', '—')):>4} "
              f"{str(row.get('artefatos', '—')):>4}  {str(row.get('descricao', ''))[:56]}")

    fits = sorted(row["fit"] for row in rows)
    median = fits[len(fits) // 2] if fits else 0.0
    print(f"\nfit mediano: {median}")

    payload = {"schema": "audiobook-audition-v1", "papel": args.papel,
               "model": args.model, "fit_mediano": median, "amostras": rows}
    (args.out or root / f"audition-{args.papel}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.min_fit is not None and median < args.min_fit:
        print(f"fit mediano {median} abaixo do mínimo {args.min_fit}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
