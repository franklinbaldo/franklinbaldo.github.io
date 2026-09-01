# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "okf-parser==0.45.4",
# ]
# ///

from __future__ import annotations

import argparse
import json
import posixpath
import sys
from collections import defaultdict
from pathlib import Path, PurePosixPath

from okf_parser import load_bundle, validate_path

CANONICAL_STATUSES = {"canonical", "canonical-editorial-unit"}
LAYER_TYPES = {
    "Audiobook Source Segment": "original",
    "Audiobook Translation Segment": "translation",
    "Audiobook Narration Segment": "narration",
}
REQUIRED_FIELDS = {
    "original": (
        "work_id",
        "chapter_id",
        "segment_id",
        "lang",
        "source_url",
        "source_digest",
        "source_anchor",
        "status",
    ),
    "translation": (
        "work_id",
        "chapter_id",
        "segment_id",
        "lang",
        "derived_from",
        "status",
    ),
    "narration": (
        "work_id",
        "chapter_id",
        "segment_id",
        "lang",
        "derived_from",
        "status",
        "speaker",
        "emotion",
        "pace",
        "intensity",
        "pause_before_ms",
        "pause_after_ms",
    ),
}


def _args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate audiobook OKF syntax plus per-segment editorial invariants."
    )
    parser.add_argument("--work", required=True)
    parser.add_argument("--chapter")
    parser.add_argument("--json", action="store_true")
    return parser.parse_args()


def _resolved_link(source_path: str, target: str) -> str:
    base = PurePosixPath(source_path).parent
    return posixpath.normpath(str(base / target))


def main() -> int:
    args = _args()
    root = Path(__file__).resolve().parents[2]
    work_dir = root / "data" / "audiobooks" / args.work

    report = validate_path(work_dir)
    errors: list[str] = []
    if not report.is_conformant:
        errors.append("okf-parser reports normative OKF errors")

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

        expected_filename = f"{segment_id}.okf.md"
        if PurePosixPath(path).name != expected_filename:
            errors.append(f"{path}: canonical shard filename must be {expected_filename}")

        key = (chapter_id, segment_id)
        if layer in segments[key]:
            errors.append(f"{chapter_id}/{segment_id}: duplicate canonical {layer} shard")
        segments[key][layer] = {"path": path, "data": data}

    for (chapter_id, segment_id), layers in sorted(segments.items()):
        missing = [name for name in ("original", "translation", "narration") if name not in layers]
        if missing:
            errors.append(
                f"{chapter_id}/{segment_id}: orphan canonical segment; missing {', '.join(missing)}"
            )
            continue

        original = layers["original"]
        translation = layers["translation"]
        narration = layers["narration"]

        for layer_name, item in layers.items():
            data = item["data"]
            if data.get("work_id") != args.work or data.get("chapter_id") != chapter_id or data.get("segment_id") != segment_id:
                errors.append(f"{item['path']}: stable identity mismatch in {layer_name} layer")

        translation_target = _resolved_link(
            str(translation["path"]), str(translation["data"].get("derived_from") or "")
        )
        if translation_target != str(original["path"]):
            errors.append(
                f"{translation['path']}: derived_from must resolve to {original['path']}, got {translation_target}"
            )

        narration_target = _resolved_link(
            str(narration["path"]), str(narration["data"].get("derived_from") or "")
        )
        if narration_target != str(translation["path"]):
            errors.append(
                f"{narration['path']}: derived_from must resolve to {translation['path']}, got {narration_target}"
            )

    result = {
        "schema": "audiobook-okf-segment-validation-v1",
        "work_id": args.work,
        "chapter_id": args.chapter,
        "okf_conformant": report.is_conformant,
        "canonical_segments_checked": len(segments),
        "valid": not errors,
        "errors": errors,
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(
            f"Audiobook OKF validation: work={args.work} segments={len(segments)} valid={not errors}"
        )
        for error in errors:
            print(f"- {error}", file=sys.stderr)

    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
