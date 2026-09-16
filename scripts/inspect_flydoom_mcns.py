#!/usr/bin/env python3
"""Inspect the FlyDoom MCNS FlatBuffer without generated bindings.

This is intentionally tiny: it reads the root table/vtable, reports all fields,
and validates the five vectors the browser runtime consumes (fields 5..9).
It does not infer biological provenance.
"""
from __future__ import annotations

import argparse
import hashlib
import struct
from pathlib import Path


def u16(buf: bytes, off: int) -> int:
    return struct.unpack_from("<H", buf, off)[0]


def u32(buf: bytes, off: int) -> int:
    return struct.unpack_from("<I", buf, off)[0]


def i32(buf: bytes, off: int) -> int:
    return struct.unpack_from("<i", buf, off)[0]


def f32(buf: bytes, off: int) -> float:
    return struct.unpack_from("<f", buf, off)[0]


def field_pos(buf: bytes, root: int, vtable: int, vtable_len: int, field: int) -> int | None:
    slot = 4 + 2 * field
    if slot + 2 > vtable_len:
        return None
    rel = u16(buf, vtable + slot)
    return None if rel == 0 else root + rel


def vector_info(buf: bytes, pos: int, elem_size: int) -> tuple[int, int] | None:
    if pos + 4 > len(buf):
        return None
    rel = u32(buf, pos)
    vec = pos + rel
    if vec < 0 or vec + 4 > len(buf):
        return None
    n = u32(buf, vec)
    start = vec + 4
    end = start + n * elem_size
    if end > len(buf):
        return None
    return n, start


def digest_slice(buf: bytes, start: int, nbytes: int) -> str:
    return hashlib.sha256(memoryview(buf)[start : start + nbytes]).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "path",
        nargs="?",
        type=Path,
        default=Path("public/flydoom/malecns_l3_compact.mcns"),
    )
    args = parser.parse_args()

    buf = args.path.read_bytes()
    root = u32(buf, 0)
    vtable = root - i32(buf, root)
    vtable_len = u16(buf, vtable)
    object_len = u16(buf, vtable + 2)
    fields = max(0, (vtable_len - 4) // 2)

    print(f"path={args.path}")
    print(f"bytes={len(buf)} sha256={hashlib.sha256(buf).hexdigest()}")
    print(f"root={root} vtable={vtable} vtable_len={vtable_len} object_len={object_len} fields={fields}")

    for field in range(fields):
        pos = field_pos(buf, root, vtable, vtable_len, field)
        if pos is None:
            print(f"field[{field}]=absent")
            continue
        scalar = []
        if pos < len(buf):
            scalar.append(f"u8={buf[pos]}")
        if pos + 2 <= len(buf):
            scalar.append(f"u16={u16(buf, pos)}")
        if pos + 4 <= len(buf):
            scalar.extend((f"u32={u32(buf, pos)}", f"f32={f32(buf, pos):.9g}"))
        candidates = []
        for elem_size in (1, 2, 4, 8):
            info = vector_info(buf, pos, elem_size)
            if info:
                n, start = info
                candidates.append(
                    f"vec{elem_size}:n={n},sha256={digest_slice(buf, start, n * elem_size)[:16]}"
                )
        print(f"field[{field}] pos={pos} {' '.join(scalar)} candidates={';'.join(candidates) or '-'}")

    expected = {
        5: (4, "offsets"),
        6: (4, "scales"),
        7: (2, "deltas"),
        8: (1, "weights"),
        9: (4, "lut"),
    }
    parsed: dict[str, tuple[int, int, int]] = {}
    for field, (elem_size, name) in expected.items():
        pos = field_pos(buf, root, vtable, vtable_len, field)
        if pos is None:
            raise SystemExit(f"missing runtime field {field} ({name})")
        info = vector_info(buf, pos, elem_size)
        if info is None:
            raise SystemExit(f"invalid runtime vector {field} ({name})")
        n, start = info
        parsed[name] = (n, start, elem_size)
        print(
            f"runtime.{name}: n={n} bytes={n * elem_size} "
            f"sha256={digest_slice(buf, start, n * elem_size)}"
        )

    n_offsets = parsed["offsets"][0]
    n_scales = parsed["scales"][0]
    n_deltas = parsed["deltas"][0]
    n_weights = parsed["weights"][0]
    n_lut = parsed["lut"][0]
    neurons = n_offsets - 1

    if neurons <= 0:
        raise SystemExit("invalid offsets cardinality")
    if n_scales != neurons:
        raise SystemExit(f"scales length {n_scales} != neurons {neurons}")
    if n_lut != 16:
        raise SystemExit(f"expected 16-entry 4-bit LUT, got {n_lut}")
    if n_weights * 2 < n_deltas:
        raise SystemExit(f"packed weights too short: {n_weights} bytes for {n_deltas} edges")

    print(f"runtime.neurons={neurons}")
    print(f"runtime.encoded_edges={n_deltas}")
    print("MCNS RUNTIME LAYOUT OK")


if __name__ == "__main__":
    main()
