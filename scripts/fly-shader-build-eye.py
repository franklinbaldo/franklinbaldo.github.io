# /// script
# requires-python = ">=3.12"
# dependencies = ["pyarrow>=17", "pandas>=2.2"]
# ///
"""Builds the compound-eye and DN-type tables for /fly-shader/ from MaleCNS v1.0.

The browser artifact (public/flydoom/malecns_l3_compact.mcns) carries no body
IDs. Its neuron index is the row of the neuron among the `status == Traced`
bodies of the Janelia body-annotations table, in table order: this script
checks that claim against the artifact's own groups (all 1,314 DNs, all 9,201
visual projection neurons and the left/right DN split must land exactly on the
annotated superclasses) and refuses to write anything if it does not hold.

Outputs, next to the demo:
  eye_columns.json  one entry per retinotopic column (azimuth, elevation, side)
                    with the artifact indices of its lamina L1, L2 and L3 cells,
                    matched by eye side and the annotated hex coordinates.
  dn_types.json     the annotated type of every DN, in dn_all order.

Data: MaleCNS v1.0, CC BY 4.0 (Berg et al. 2026). Column geometry:
public/flydoom/retinotopic_columns_1771.json (see RETINA-PROVENANCE.md).

    uv run scripts/fly-shader-build-eye.py
"""

from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

import pandas as pd
import pyarrow.feather as feather

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CACHE = ROOT / ".cache-malecns"
ANNOTATIONS_URL = (
    "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/"
    "flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather"
)
LAMINA_TYPES = ("L1", "L2", "L3")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_traced() -> tuple[pd.DataFrame, str]:
    CACHE.mkdir(exist_ok=True)
    path = CACHE / "body-annotations-male-cns-v1.0-minconf-0.5.feather"
    if not path.exists():
        urllib.request.urlretrieve(ANNOTATIONS_URL, path)
    table = feather.read_table(path).to_pandas()
    traced = table[table.status == "Traced"].reset_index(drop=True)
    return traced, sha256(path)


def check_alignment(traced: pd.DataFrame, circuit: dict) -> None:
    """The artifact index must be the Traced row; prove it on three groups."""
    if len(traced) != 165_122:
        raise SystemExit(f"expected 165,122 traced bodies, got {len(traced)}")
    dn = traced.superclass == "descending_neuron"
    checks = {
        "dn_all": set(traced.index[dn]) == set(circuit["dn_all"]),
        "vpl+vpr": set(traced.index[traced.superclass == "visual_projection"])
        == set(circuit["vpl"]) | set(circuit["vpr"]),
        "dnl": set(traced.index[dn & (traced.somaSide == "L")])
        == set(circuit["dnl"]),
    }
    failed = [name for name, ok in checks.items() if not ok]
    if failed:
        raise SystemExit(f"artifact index is not the Traced row order: {failed}")


def build_columns(traced: pd.DataFrame, geometry: dict) -> list[dict]:
    lamina = traced[traced.type.isin(LAMINA_TYPES) & traced.assignedOlHex1.notna()]
    cells: dict[tuple[str, int, int], dict[str, list[int]]] = {}
    for index, row in lamina.iterrows():
        key = (row.somaSide, int(row.assignedOlHex1), int(row.assignedOlHex2))
        cells.setdefault(key, {}).setdefault(row.type, []).append(int(index))

    columns = []
    for i in range(geometry["count"]):
        side = "L" if geometry["side"][i] == 0 else "R"
        found = cells.get((side, geometry["h1"][i], geometry["h2"][i]), {})
        columns.append(
            {
                "az": round(geometry["az"][i], 6),
                "el": round(geometry["el"][i], 6),
                "side": geometry["side"][i],
                **{t: found.get(t, []) for t in LAMINA_TYPES},
            }
        )
    return columns


def main() -> None:
    circuit = json.loads((PUBLIC / "flydoom/malecns_circuit.json").read_text())
    geometry = json.loads(
        (PUBLIC / "flydoom/retinotopic_columns_1771.json").read_text()
    )
    traced, annotations_sha = load_traced()
    check_alignment(traced, circuit)

    columns = build_columns(traced, geometry)
    covered = {t: sum(1 for c in columns if c[t]) for t in LAMINA_TYPES}
    provenance = {
        "annotations": ANNOTATIONS_URL,
        "annotations_sha256": annotations_sha,
        "mcns_sha256": sha256(PUBLIC / "flydoom/malecns_l3_compact.mcns"),
        "license": "MaleCNS v1.0, CC BY 4.0 (Berg et al. 2026)",
        "index_rule": "artifact index = row among status == Traced, table order",
    }
    out = PUBLIC / "fly-shader"
    (out / "eye_columns.json").write_text(
        json.dumps(
            {**provenance, "covered": covered, "columns": columns},
            separators=(",", ":"),
        )
    )

    dn = traced.loc[circuit["dn_all"]]
    (out / "dn_types.json").write_text(
        json.dumps(
            {
                **provenance,
                "type": [t if isinstance(t, str) else "" for t in dn.type],
                "synonyms": [s if isinstance(s, str) else "" for s in dn.synonyms],
            },
            separators=(",", ":"),
        )
    )
    print(f"columns {len(columns)} covered {covered}")


if __name__ == "__main__":
    main()
