---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first bulk source integration"
summary: "Integrate the LMFDB number-field table as a 22M-scale reconstructed defining-polynomial lane while keeping transient source counts out of the stable source descriptor."
updated: "2026-09-23"
---

# LMFDB number fields — source integration r14

## State reconstructed from main

This execution reread `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, the current `knowledge/science-equations/` bundle, `data/science-equations/` and the existing ingestion code on `main` before making changes.

The shared Atlas data plane already exists on `main`: source adapters emit a transient occurrence stream, `materialize-parquet.py` validates and writes Zstd Parquet shards plus deterministic row-count/checksum manifests, and `publish-internet-archive.py` publishes verified redistributable snapshots outside GitHub Actions. Existing adapters on `main` cover Wikidata P2534, OEIS and PMC/JATS. The stable source plan lists LMFDB as a harvest-ready structured mathematical corpus, while `main` did not yet contain an LMFDB adapter or descriptor.

## Source selected

**LMFDB `nf_fields`** was selected as the next high-yield structured lane.

A fresh source audit against the official LMFDB pages established:

- the LMFDB access-options page states that its underlying data is licensed under **CC BY-SA 4.0**;
- the same page exposes an official read-only PostgreSQL SQL mirror at `devmirror.lmfdb.xyz:5432`, allowing bulk access without page-by-page scraping;
- the official table-statistics page reports **22,444,816 objects** in `nf_fields` at the time of this run;
- the public `nf_fields` schema exposes `coeffs`, `degree`, discriminant fields, `galois_label` and `label`.

Primary documentation:

- <https://www.lmfdb.org/api/options>
- <https://www.lmfdb.org/api/stats>
- <https://www.lmfdb.org/api/nf_fields/>

The 22,444,816 value is a dated source observation in this run only. It is not stored in the stable source descriptor and is not reported as Atlas ingestion yield.

## Integrated adapter

`scripts/science-equations/harvest-lmfdb-number-fields.py` consumes a deterministic CSV export of selected `nf_fields` columns and emits one transient occurrence per valid row.

The database attests the coefficient vector. The Atlas serializes those coefficients into `P(x)=0`; therefore the emitted mathematical notation is deliberately classified as **`reconstructed`**, not `attested`. Each occurrence preserves:

- the original coefficient vector and typed source payload;
- LMFDB label and stable record URL;
- degree, discriminant metadata and Galois label when present;
- exact source-record SHA-256;
- emitted-expression SHA-256;
- CC BY-SA 4.0 attribution/license metadata;
- an explicit reconstruction rule and coefficient-order convention.

The adapter rejects records with a missing label, degree/coefficient mismatch or zero leading coefficient instead of silently repairing them.

## Acquisition and snapshot identity

The recommended bulk acquisition uses the official SQL mirror with deterministic ordering:

```sql
SELECT label, coeffs, degree, disc_abs, disc_sign, galois_label
FROM nf_fields
ORDER BY label;
```

The external executor must record the exact query and row count, compute SHA-256 over the exact exported byte stream before extraction, and use `rowstream-sha256:<digest>` as the snapshot identity. A date or LMFDB release label alone is not sufficient for a mutable mirror.

CSV is only acquisition transport. Apache Parquet remains the canonical equation-lake format.

## Validation performed in this execution

The adapter was compiled and fixture-tested in the available sandbox. The fixture contained two valid number-field rows and one deliberate degree/coefficient mismatch.

Observed fixture result:

- input rows read: **3**;
- reconstructed occurrences emitted: **2**;
- malformed rows rejected: **1**;
- expressions reconstructed from the coefficient vectors: `x^2 - 10 = 0` and `x^5 - x^4 - 2*x + 1 = 0`;
- both emitted rows preserved `provenance_class: reconstructed`.

The sandbox has Pydantic 2 available. PyArrow is not installed; attempting to obtain it through `uv` failed because this executor cannot resolve PyPI. DNS resolution also failed for both `devmirror.lmfdb.xyz` and `archive.org`.

## Actual yield and publication boundary

Bulk LMFDB rows acquired in this execution: **0**.

Parquet rows materialized in this execution: **0**.

Normalized Parquet rows: **0**.

Deduplicated Parquet rows: **0**.

Internet Archive items published in this execution: **0**.

Internet Archive identifier: **not created**.

These zeros are deliberate. This sandbox cannot reach the SQL mirror or Internet Archive, PyArrow cannot be installed without DNS, and `IA_ACCESS_KEY_ID` / `IA_SECRET_ACCESS_KEY` are not exposed. Fixture records are not counted as corpus ingestion.

No GitHub Action was used for acquisition, processing, Parquet generation or Internet Archive publication.

## Stable-state correction

The stable source descriptor intentionally omits observed row counts and dates. Operational cardinality belongs in dated runs/manifests, not in the long-lived source contract. The Atlas routine is also aligned with the already-existing storage contract: Parquet is canonical for bulk datasets; JSONL/CSV are transient transport/interoperability only.

## Deduplication and family boundary

No `equation-family` is asserted by this integration. Defining polynomials are typed representations of mathematical objects; visual or embedding similarity is insufficient to claim algebraic or object-level equivalence. Stronger deduplication layers require reproducible transformations.

## Coverage and audit debt

New coverage is a high-volume structured arithmetic lane for number fields and defining-polynomial representations linked to discriminant and Galois metadata.

Remaining audit debt:

- run the deterministic SQL export on a networked external runner/Jatobá;
- record the real rowstream digest and exact row count for that acquisition;
- materialize the first full `extracted` Parquet shards;
- publish and verify the immutable Internet Archive item;
- sample reconstruction fidelity across degrees and unusual coefficient vectors;
- only then proceed to normalization/deduplication and additional LMFDB tables as separate typed lanes.

Candidate next corpora after this lane is operational remain those already present in the source plan, especially other structured LMFDB tables and GovInfo/CFR XML; selection must be reconstructed from `main` at the next run rather than hardcoded here as current state.
