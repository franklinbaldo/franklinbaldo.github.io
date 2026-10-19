# /// script
# requires-python = ">=3.12"
# dependencies = ["pyarrow>=17", "pandas>=2.2"]
# ///
"""Reproduce the read-only FeCO identity audit; prints JSON, never writes inputs.

    uv run scripts/fly-proprioception-audit.py > /tmp/proprioception-audit.json

Preserves official Traced table order. Does not run a neural experiment.
"""
import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen

import pyarrow.feather as feather

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/"
    "flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather"
)
raw = urlopen(SOURCE, timeout=60).read()
rows = [row for row in feather.read_table(io.BytesIO(raw)).to_pylist() if row.get("status") == "Traced"]
circuit = json.loads((ROOT / "public/flydoom/malecns_circuit.json").read_text())
groups = {name: [i for i, row in enumerate(rows) if row.get("superclass") == name] for name in ["descending_neuron", "visual_projection", "vnc_intrinsic", "ascending_neuron"]}
alignment = {
    "dn_all": set(groups["descending_neuron"]) == set(circuit["dn_all"]),
    "dnl": {i for i in groups["descending_neuron"] if rows[i].get("somaSide") == "L"} == set(circuit["dnl"]),
    "visual_projection": set(groups["visual_projection"]) == set(circuit["vpl"]) | set(circuit["vpr"]),
}
if len(rows) != 165122 or not all(alignment.values()):
    raise SystemExit("Artifact identity alignment failed")
fields = ["bodyId", "type", "synonyms", "superclass", "class", "subclass", "entryNerve", "rootSide", "somaSide", "mancType", "mancBodyid"]
candidates = [{"index": i, **{key: row.get(key) for key in fields}} for i, row in enumerate(rows) if row.get("class") == "mechanosensory_proprioceptive" and row.get("synonyms") in ["FeCO claw", "FeCO hook", "FeCO club"]]
if len(candidates) != 33 or any(row["entryNerve"] != "MetaLN" or row["rootSide"] != "R" for row in candidates):
    raise SystemExit("Audited population changed; review before connecting")
print(json.dumps({
    "source": SOURCE,
    "annotations_sha256": hashlib.sha256(raw).hexdigest(),
    "artifact_sha256": hashlib.sha256((ROOT / "public/flydoom/malecns_l3_compact.mcns").read_bytes()).hexdigest(),
    "index_rule": "zero-based row after status == Traced filter in original table order",
    "traced_count": len(rows),
    "alignment": alignment,
    "feco_counts": {name: sum(row["synonyms"] == name for row in candidates) for name in ["FeCO claw", "FeCO club", "FeCO hook"]},
    "feco_candidates": candidates,
    "readout_indices": {name: groups[name] for name in ["vnc_intrinsic", "ascending_neuron"]},
}, indent=2))
