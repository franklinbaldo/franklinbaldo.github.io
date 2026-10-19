---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate LMFDB nf_fields as a 22M-scale reconstructed defining-polynomial lane on top of the existing local Parquet/Internet Archive data plane."
updated: "2026-09-24"
---

# LMFDB number fields — source integration

## State reconstructed from main

This execution reread `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, the current `knowledge/science-equations/` bundle, `data/science-equations/` source descriptors and manifests, and the existing ingestion scripts on `main` before selecting a source.

The shared Atlas data plane is already present on `main`: source adapters emit transient occurrence streams, `materialize-parquet.py` validates them and writes deterministic Zstd Parquet shards plus row-count/SHA-256 manifests, `publish-internet-archive.py` handles fail-closed publication outside GitHub Actions, and `doctor.py` validates the local execution environment. Existing source descriptors on `main` cover Wikidata P2534, OEIS formula lines and PMC/JATS. The source plan classifies LMFDB as a harvest-ready structured mathematical corpus, while `main` did not yet contain an LMFDB adapter or source descriptor.

The only persisted ingest manifest present at the beginning of this run was the existing OEIS manifest; no LMFDB snapshot manifest existed.

## Source selected

**LMFDB `nf_fields`** was selected as the next high-yield structured lane.

A fresh audit of the official LMFDB access and statistics pages on 2026-09-24 established:

- the underlying LMFDB data is licensed under **CC BY-SA**;
- an official read-only PostgreSQL mirror is exposed at `devmirror.lmfdb.xyz:5432` for direct SQL access, avoiding page-by-page scraping;
- the public table statistics report **22,444,816 objects** in `nf_fields` at the time of this run;
- the `nf_fields` schema exposes `coeffs` as `numeric[]` together with `degree`, `disc_abs`, `disc_sign`, `galois_label` and `label`.

Primary documentation:

- <https://www.lmfdb.org/api/options>
- <https://www.lmfdb.org/api/stats>
- <https://www.lmfdb.org/api/nf_fields/>

The 22,444,816 value is a dated source observation only. It is not reported as Atlas ingestion yield and is deliberately absent from the stable source descriptor.

## Integrated adapter

`scripts/science-equations/harvest-lmfdb-number-fields.py` consumes a deterministic CSV export of selected `nf_fields` columns and emits one transient occurrence per valid row.

The source attests the coefficient vector; the Atlas serializes that vector as `P(x)=0`. The emitted mathematical notation is therefore classified as **`reconstructed`**, not `attested`.

Each occurrence preserves:

- the complete coefficient vector as source payload;
- LMFDB label and stable record URL;
- degree, discriminant metadata and Galois label when present;
- exact source-record SHA-256;
- emitted-expression SHA-256;
- CC BY-SA attribution/license metadata;
- the reconstruction rule and constant-first coefficient convention.

The adapter rejects missing labels, degree/coefficient mismatches and zero leading coefficients rather than silently repairing them.

## Acquisition and snapshot identity

The intended external-runner acquisition is a deterministic export from the official SQL mirror:

```sql
SELECT label, coeffs, degree, disc_abs, disc_sign, galois_label
FROM nf_fields
ORDER BY label;
```

The external executor must record the exact query and row count and compute SHA-256 over the exact exported byte stream before extraction. The acquisition identity is `rowstream-sha256:<digest>`; a date alone is insufficient for a mutable mirror.

CSV is acquisition transport only. Apache Parquet remains the canonical equation-lake format.

## Validation performed in this execution

The adapter was compiled and fixture-tested in the available sandbox. The fixture contained two valid number-field rows and one deliberate degree/coefficient mismatch.

Observed result:

- input rows read: **3**;
- reconstructed occurrences emitted: **2**;
- malformed rows rejected: **1**;
- reconstructed expressions: `x^2 - 10 = 0` and `x^5 - x^4 - 2*x + 1 = 0`;
- both emitted rows preserved `provenance_class: reconstructed`.

The fixture records were used only for adapter validation and are not counted as corpus ingestion.

## Actual yield and publication boundary

Bulk LMFDB rows acquired in this execution: **0**.

Extracted Parquet rows materialized in this execution: **0**.

Normalized Parquet rows: **0**.

Deduplicated Parquet rows: **0**.

Internet Archive items published in this execution: **0**.

Internet Archive identifier: **not created**.

The currently available sandbox for this run cannot resolve the LMFDB SQL mirror or PyPI, does not have PyArrow installed, and does not expose Internet Archive credentials. The existing main-branch local data-plane validation demonstrates that a separate local executor has PyArrow/`ia`/OKF tooling configured, but this execution does not claim access to that machine or credentials.

No GitHub Action was used for acquisition, processing, Parquet generation, normalization, deduplication or Internet Archive publication.

## Deduplication and family boundary

No `equation-family` is asserted by this integration. Defining polynomials are typed representations of mathematical objects; textual or embedding similarity is insufficient to establish algebraic equivalence or identity of number fields. Stronger deduplication layers require reproducible transformations.

## New coverage

This adds a source contract for a high-volume arithmetic/number-theory lane with typed defining-polynomial representations linked to discriminant and Galois metadata. The official statistics page reported 22.4M `nf_fields` objects at audit time, making this source materially larger than the existing hand-curated OKF layer and suitable for the Atlas's million-occurrence target.

## Audit debt

- execute the deterministic SQL export on the networked local runner/Jatobá;
- record the real rowstream digest and exact row count;
- materialize the first full `extracted` Parquet shards;
- publish and verify the immutable Internet Archive item;
- sample reconstruction fidelity across degrees and unusual coefficient vectors;
- then apply normalization/deduplication layers as separate reproducible stages.

Future source selection must be reconstructed from `main` and current manifests at the next run rather than treated as state carried by this document.
