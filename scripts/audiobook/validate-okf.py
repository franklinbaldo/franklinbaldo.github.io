# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "okf-parser @ git+https://github.com/franklinbaldo/okf-parser@5ee72add40d3372682e528fd70641455143269ce",
#   "PyYAML==6.0.2",
# ]
# ///

from __future__ import annotations

import argparse
import json
import posixpath
import re
import sys
from collections import defaultdict
from pathlib import Path, PurePosixPath

import yaml
from okf_parser import load_bundle, validate_path

CANONICAL_STATUSES = {"canonical", "canonical-editorial-unit"}
LAYER_TYPES = {"Audiobook Source Segment": "original", "Audiobook Translation Segment": "translation", "Audiobook Narration Segment": "narration"}
REQUIRED_FIELDS = {
    "original": ("work_id", "chapter_id", "segment_id", "lang", "source_url", "source_digest", "source_anchor", "status"),
    "translation": ("work_id", "chapter_id", "segment_id", "lang", "derived_from", "status"),
    "narration": ("work_id", "chapter_id", "segment_id", "lang", "derived_from", "status", "speaker", "emotion", "pace", "intensity", "pause_before_ms", "pause_after_ms"),
}
PROJECT_GUIDES = (
    "docs/okf/audiobook/editorial-control-plane.md",
    "docs/okf/audiobook/guides/translation.md",
    "docs/okf/audiobook/guides/narration.md",
    "docs/okf/audiobook/chapter-readiness.md",
    "docs/okf/audiobook/multi-work-architecture.md",
)
WORK_PREREQUISITES = ("work.md", "editorial.md", "rights.md", "voices.yaml", "pronunciation.yaml")
TTS_BODY_CONTRACT = "tts-body-v1"
MARKDOWN_CONTROL_RE = re.compile(r"^(?:#{1,6}\s|```|~~~|>\s|[-*+]\s|\d+\.\s|<!--)")
EDITORIAL_NOTE_RE = re.compile(r"(?:nota\s+(?:editorial|de\s+realiza[cç][aã]o\s+oral)|editorial\s+note)", re.IGNORECASE)


def _args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate audiobook OKF syntax plus per-segment editorial invariants.")
    parser.add_argument("--work", required=True)
    parser.add_argument("--chapter")
    parser.add_argument("--json", action="store_true")
    return parser.parse_args()


def _resolved_link(source_path: str, target: str) -> str:
    return posixpath.normpath(str(PurePosixPath(source_path).parent / target))


def _load_yaml(path: Path) -> dict:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {}


def _load_markdown(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) != 3:
        return {}, text
    frontmatter = yaml.safe_load(parts[1])
    return (frontmatter if isinstance(frontmatter, dict) else {}), parts[2].strip()


def _segment_at_or_after(segment_id: str, first_segment_id: str) -> bool:
    return segment_id >= first_segment_id


def _validate_tts_body(path: str, body: str, errors: list[str]) -> None:
    if not body.strip():
        errors.append(f"{path}: {TTS_BODY_CONTRACT} narration body must not be empty")
        return
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if MARKDOWN_CONTROL_RE.match(stripped):
            errors.append(f"{path}: {TTS_BODY_CONTRACT} body contains Markdown/control syntax: {stripped!r}")
        if EDITORIAL_NOTE_RE.search(stripped):
            errors.append(f"{path}: editorial notes belong in frontmatter, not in the TTS body")


def main() -> int:
    args = _args()
    root = Path(__file__).resolve().parents[2]
    work_dir = root / "data" / "audiobooks" / args.work
    errors: list[str] = []

    for rel in PROJECT_GUIDES:
        if not (root / rel).is_file():
            errors.append(f"project prerequisite missing: {rel}")
    for name in WORK_PREREQUISITES:
        if not (work_dir / name).is_file():
            errors.append(f"work prerequisite missing: {name}")

    work_metadata, _ = _load_markdown(work_dir / "work.md") if (work_dir / "work.md").is_file() else ({}, "")
    narration_contract = work_metadata.get("narration_payload_contract")
    narration_contract_from = work_metadata.get("narration_payload_contract_from")
    if narration_contract is not None and narration_contract != TTS_BODY_CONTRACT:
        errors.append(f"work.md: unsupported narration_payload_contract {narration_contract!r}")
    if narration_contract == TTS_BODY_CONTRACT and not isinstance(narration_contract_from, str):
        errors.append("work.md: tts-body-v1 requires narration_payload_contract_from")

    report = validate_path(work_dir)
    if not report.is_conformant:
        errors.append("okf-parser reports normative OKF errors")

    voices = _load_yaml(work_dir / "voices.yaml") if (work_dir / "voices.yaml").is_file() else {}
    pronunciation = _load_yaml(work_dir / "pronunciation.yaml") if (work_dir / "pronunciation.yaml").is_file() else {}
    if voices.get("schema") != "audiobook-voices-v1" or voices.get("work_id") != args.work:
        errors.append("voices.yaml must use audiobook-voices-v1 and matching work_id")
    voice_ids = set((voices.get("voices") or {}).keys()) if isinstance(voices.get("voices"), dict) else set()
    if pronunciation.get("schema") != "audiobook-pronunciation-v1" or pronunciation.get("work_id") != args.work:
        errors.append("pronunciation.yaml must use audiobook-pronunciation-v1 and matching work_id")
    if not isinstance(pronunciation.get("entries"), list):
        errors.append("pronunciation.yaml entries must be a list")

    bundle = load_bundle(work_dir)
    rows = bundle.concepts.execute().to_dict(orient="records")
    segments: dict[tuple[str, str], dict[str, dict[str, object]]] = defaultdict(dict)

    for row in rows:
        concept_type = str(row.get("concept_type") or "")
        layer = LAYER_TYPES.get(concept_type)
        if layer is None:
            continue
        raw = row.get("frontmatter_json")
        if not isinstance(raw, str):
            errors.append(f"{row.get('path')}: missing parser-produced frontmatter_json")
            continue
        data = json.loads(raw)
        path = str(row.get("path") or "")
        work_id = data.get("work_id")
        chapter_id = data.get("chapter_id")
        segment_id = data.get("segment_id")
        status = data.get("status")
        if work_id != args.work:
            errors.append(f"{path}: work_id must be {args.work!r}, got {work_id!r}")
        if args.chapter and chapter_id != args.chapter:
            continue
        if not isinstance(chapter_id, str) or not isinstance(segment_id, str):
            errors.append(f"{path}: chapter_id and segment_id must be strings")
            continue
        if not segment_id.startswith(f"{chapter_id}-s"):
            errors.append(f"{path}: segment_id {segment_id!r} is not namespaced by {chapter_id!r}")
        if status not in CANONICAL_STATUSES:
            continue
        for field in REQUIRED_FIELDS[layer]:
            value = data.get(field)
            if value is None or value == "":
                errors.append(f"{path}: required {layer} field {field!r} is missing")
        if PurePosixPath(path).name != f"{segment_id}.okf.md":
            errors.append(f"{path}: canonical shard filename must be {segment_id}.okf.md")
        if layer == "narration":
            speaker = data.get("speaker")
            if speaker == "mixed":
                if not data.get("voice_partition"):
                    errors.append(f"{path}: mixed narration requires voice_partition")
            elif isinstance(speaker, str) and speaker not in voice_ids:
                errors.append(f"{path}: speaker {speaker!r} has no entry in voices.yaml")
            if narration_contract == TTS_BODY_CONTRACT and isinstance(narration_contract_from, str) and _segment_at_or_after(segment_id, narration_contract_from):
                if data.get("payload_contract") != TTS_BODY_CONTRACT:
                    errors.append(f"{path}: narration at/after {narration_contract_from} must declare payload_contract: {TTS_BODY_CONTRACT}")
                shard_path = root / path
                if shard_path.is_file():
                    _, body = _load_markdown(shard_path)
                    _validate_tts_body(path, body, errors)
                else:
                    errors.append(f"{path}: narration shard file cannot be read for TTS body validation")
        key = (chapter_id, segment_id)
        if layer in segments[key]:
            errors.append(f"{chapter_id}/{segment_id}: duplicate canonical {layer} shard")
        segments[key][layer] = {"path": path, "data": data}

    for (chapter_id, segment_id), layers in sorted(segments.items()):
        missing = [name for name in ("original", "translation", "narration") if name not in layers]
        if missing:
            errors.append(f"{chapter_id}/{segment_id}: orphan canonical segment; missing {', '.join(missing)}")
            continue
        original, translation, narration = layers["original"], layers["translation"], layers["narration"]
        for layer_name, item in layers.items():
            data = item["data"]
            if data.get("work_id") != args.work or data.get("chapter_id") != chapter_id or data.get("segment_id") != segment_id:
                errors.append(f"{item['path']}: stable identity mismatch in {layer_name} layer")
        translation_target = _resolved_link(str(translation["path"]), str(translation["data"].get("derived_from") or ""))
        if translation_target != str(original["path"]):
            errors.append(f"{translation['path']}: derived_from must resolve to {original['path']}, got {translation_target}")
        narration_target = _resolved_link(str(narration["path"]), str(narration["data"].get("derived_from") or ""))
        if narration_target != str(translation["path"]):
            errors.append(f"{narration['path']}: derived_from must resolve to {translation['path']}, got {narration_target}")

    result = {"schema": "audiobook-okf-segment-validation-v1", "work_id": args.work, "chapter_id": args.chapter, "okf_conformant": report.is_conformant, "project_prerequisites_checked": len(PROJECT_GUIDES), "canonical_segments_checked": len(segments), "narration_payload_contract": narration_contract, "narration_payload_contract_from": narration_contract_from, "valid": not errors, "errors": errors}
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Audiobook OKF validation: work={args.work} segments={len(segments)} valid={not errors}")
        for error in errors:
            print(f"- {error}", file=sys.stderr)
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
