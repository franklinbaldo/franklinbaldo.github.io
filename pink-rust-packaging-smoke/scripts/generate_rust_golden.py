#!/usr/bin/env python3
"""Generate the RFC 0058 Phase 0 Rust-port golden contract set."""

from __future__ import annotations

import argparse
import asyncio
import base64
from dataclasses import asdict
import inspect
import json
from pathlib import Path
import re
import tempfile
from typing import Any, get_type_hints

from pydantic import TypeAdapter, ValidationError

from pink.app import build_app, build_raw
from pink.artifacts import ArtifactStore
from pink.integrations import FakeGoogle, FakeKanoe, FakeMetabase
from pink.system import Runtime

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "tests" / "golden" / "rust-port" / "phase0.json"
ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")


def _runtime(root: Path) -> Runtime:
    return Runtime(
        metabase=FakeMetabase(),
        kanoe=FakeKanoe(),
        google=FakeGoogle(),
        artifacts=ArtifactStore(root),
    )


def _catalog(surface: str, root: Path):
    runtime = _runtime(root)
    return (build_app(runtime) if surface == "operational" else build_raw(runtime)), runtime


def _stable(value: Any, tmp_root: Path) -> Any:
    if isinstance(value, dict):
        return {str(key): _stable(item, tmp_root) for key, item in sorted(value.items(), key=lambda kv: str(kv[0]))}
    if isinstance(value, (list, tuple)):
        return [_stable(item, tmp_root) for item in value]
    if isinstance(value, str):
        normalized = ANSI.sub("", value)
        for candidate in {str(tmp_root), tmp_root.as_posix()}:
            normalized = normalized.replace(candidate, "$TMP")
        return normalized
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return repr(value)


def _default(value: Any, tmp_root: Path) -> Any:
    if value is inspect.Signature.empty:
        return None
    return _stable(value, tmp_root)


def _schema(annotation: Any) -> dict[str, Any]:
    if annotation is inspect.Signature.empty:
        return {}
    try:
        return TypeAdapter(annotation).json_schema()
    except Exception as exc:  # pragma: no cover - diagnostic fallback
        return {"unresolved": repr(annotation), "schema_error": f"{type(exc).__name__}: {exc}"}


def _contract(operation, tmp_root: Path) -> dict[str, Any]:
    signature = inspect.signature(operation.fn, eval_str=True)
    hints = get_type_hints(operation.fn, include_extras=True)
    parameters: list[dict[str, Any]] = []
    for parameter in signature.parameters.values():
        annotation = hints.get(parameter.name, parameter.annotation)
        parameters.append(
            {
                "name": parameter.name,
                "kind": parameter.kind.name,
                "required": parameter.default is inspect.Signature.empty,
                "default": _default(parameter.default, tmp_root),
                "schema": _schema(annotation),
            }
        )
    return {
        "tags": sorted(operation.tags),
        "effect": asdict(operation.efeito),
        "parameters": parameters,
        "return_schema": _schema(operation.saida),
    }


def _validation_error(exc: ValidationError, tmp_root: Path) -> dict[str, Any]:
    errors = []
    for item in exc.errors(include_url=False, include_context=False, include_input=False):
        errors.append(
            {
                "type": item["type"],
                "loc": [str(part) for part in item["loc"]],
                "msg": _stable(item["msg"], tmp_root),
            }
        )
    return {"type": "ValidationError", "errors": errors}


async def _probe(operation, tmp_root: Path) -> dict[str, Any]:
    try:
        result = await operation.chamar({})
    except ValidationError as exc:
        return {
            "input": {},
            "exit_code": 1,
            "error": _validation_error(exc, tmp_root),
        }
    except (ValueError, RuntimeError, OSError) as exc:
        return {
            "input": {},
            "exit_code": 1,
            "error": {
                "type": type(exc).__name__,
                "message": _stable(str(exc), tmp_root),
            },
        }
    except Exception as exc:  # bug-shaped behavior is still frozen, but marked explicitly
        return {
            "input": {},
            "exit_code": 1,
            "error": {
                "type": type(exc).__name__,
                "message": _stable(str(exc), tmp_root),
                "unexpected": True,
            },
        }

    payload = TypeAdapter(operation.saida).dump_python(result, mode="json", by_alias=True)
    return {
        "input": {},
        "exit_code": 0,
        "json": _stable(payload, tmp_root),
    }


def generate() -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="pink-rust-golden-") as raw_tmp:
        tmp_root = Path(raw_tmp)

        operation_records: list[dict[str, Any]] = []
        resource_records: list[dict[str, Any]] = []

        for surface in ("operational", "raw"):
            catalog, _runtime_owner = _catalog(surface, tmp_root / surface / "inventory")
            names = sorted(catalog.operacoes)
            resources = sorted(catalog.recursos.values(), key=lambda resource: resource.modelo)

            for resource in resources:
                resource_records.append(
                    {
                        "surface": surface,
                        "uri": resource.modelo,
                        "mime": resource.mime,
                        "tags": sorted(resource.tags),
                    }
                )

            for name in names:
                fresh_catalog, _fresh_runtime = _catalog(
                    surface, tmp_root / surface / "cases" / name
                )
                operation = fresh_catalog.operacoes[name]
                operation_records.append(
                    {
                        "surface": surface,
                        "name": name,
                        "contract": _contract(operation, tmp_root),
                        "cases": [
                            {
                                "id": "empty-input",
                                **asyncio.run(_probe(operation, tmp_root)),
                            }
                        ],
                    }
                )

        return {
            "format": 1,
            "scope": "rfc-0058-phase0",
            "case_policy": (
                "Every catalog operation starts with an empty-input differential case. "
                "A vertical Rust slice must add at least one semantic success case for each "
                "operation it ports before that slice can claim parity."
            ),
            "operations": operation_records,
            "resources": resource_records,
        }


def render(data: dict[str, Any]) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def emit_base64(text: str, chunk_size: int = 3000) -> None:
    encoded = base64.b64encode(text.encode("utf-8")).decode("ascii")
    chunks = [encoded[index : index + chunk_size] for index in range(0, len(encoded), chunk_size)]
    total = len(chunks)
    for index, chunk in enumerate(chunks, 1):
        print(f"GOLDEN_CHUNK {index:04d}/{total:04d} {chunk}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--stdout-base64", action="store_true")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    text = render(generate())

    if args.stdout_base64:
        emit_base64(text)
        return

    if args.check:
        if not args.output.exists():
            raise SystemExit(f"missing golden file: {args.output}")
        if args.output.read_text(encoding="utf-8") != text:
            raise SystemExit(
                "Rust-port golden set is stale; run: "
                "uv run python scripts/generate_rust_golden.py"
            )
        print("rust port golden: current")
        return

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8")
    print(args.output.relative_to(ROOT))


if __name__ == "__main__":
    main()
