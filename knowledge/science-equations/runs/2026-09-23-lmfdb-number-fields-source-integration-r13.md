---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first bulk source integration"
summary: "Integrate the LMFDB number-field table as a 22M-scale reconstructed defining-polynomial lane with deterministic snapshot identity and the shared Parquet/Internet Archive data plane."
updated: "2026-09-23"
---

# LMFDB number fields — source integration r13

## State reconstructed from main

This execution reread `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, the current `knowledge/science-equations/` bundle and existing ingestion manifests/descriptors on `main`. The shared Parquet materializer, Internet Archive publisher, and source adapters for Wikidata P2534, OEIS and PMC/JATS already exist. The stable source plan places LMFDB next among high-priority structured corpora, but `main` did not yet contain an LMFDB adapter or source descriptor.

## Source selected

**LMFDB `nf_fields`** was selected as the next high-yield lane.

Fresh source verification on 2026-09-23 established:

- LMFDB explicitly licenses its underlying data under CC BY-SA;
- it exposes a public read-only PostgreSQL SQL mirror for large-scale access, avoiding page-by-page scraping and the API's per-query limits;
- current table statistics report **22,444,816 rows** in `nf_fields`;
- the `nf_fields` schema exposes `label`, `coeffs`, `degree`, discriminant fields and Galois metadata;
- LMFDB's reviewed number-field documentation states that number fields are represented by a defining polynomial and defines the canonical/reduced defining polynomial used by the database.

Primary documentation:

- <https://www.lmfdb.org/api/options>
- <https://www.lmfdb.org/api/stats>
- <https://www.lmfdb.org/knowledge/show/nf.polredabs>

The observed 22,444,816 rows are an addressable source count only. They are **not** reported as Atlas ingestion yield.

## Integrated adapter

`scripts/science-equations/harvest-lmfdb-number-fields.py` consumes a deterministic CSV export of selected `nf_fields` columns and emits one transient occurrence per valid row.

The source attests a coefficient vector. The Atlas converts the constant-first coefficient vector into a human-readable equation `P(x)=0`; therefore the emitted equation is deliberately marked **`reconstructed`**, not `attested`. Each occurrence preserves the original coefficient vector, label, degree, discriminant metadata, Galois label, source table/locator, license, exact source-record hash, expression hash and an explicit reconstruction rule.

The adapter validates that `degree == len(coeffs)-1` and that the leading coefficient is nonzero. Invalid rows are rejected and counted rather than silently repaired.

## Acquisition and snapshot identity

The recommended bulk acquisition uses the official read-only SQL mirror and a deterministic query:

```sql
SELECT label, coeffs, degree, disc_abs, disc_sign, galois_label
FROM nf_fields
ORDER BY label;
```

The external executor must export this result as deterministic CSV, record the exact query and row count, compute SHA-256 over the exact CSV bytes, and use `rowstream-sha256:<digest>` as the source snapshot. A date or LMFDB release label alone is not treated as immutable snapshot identity.

The CSV is transient acquisition material. The persistent Atlas representation remains Apache Parquet.

## Validation performed in this execution

The adapter was locally compiled and fixture-tested without network access. The fixture contained two valid number fields and one malformed degree/coefficient record. Results were:

- 3 input rows read;
- 2 reconstructed occurrences emitted;
- 1 malformed row rejected with an explicit degree mismatch;
- both emitted records validated against the required `OccurrenceV1` fields used by the Parquet materializer;
- reconstructed expressions matched the stored coefficient vectors: `x^2 - 10 = 0` and `x^5 - x^4 - 2*x + 1 = 0`.

## Actual yield and publication boundary

Bulk LMFDB rows acquired in this execution: **0**.

Parquet rows materialized in this execution: **0**.

Internet Archive items published in this execution: **0**.

The zero is deliberate. The available sandbox has no outbound DNS path to the LMFDB SQL mirror, PyArrow is not installed, and Internet Archive credentials/CLI are not exposed. No fixture record is counted as corpus ingestion.

A bulk-capable external executor/Jatobá can traverse the lane as follows:

```sh
# 1. export the exact deterministic nf_fields projection from the official SQL mirror
# 2. compute sha256 and row count of that exact CSV snapshot
# 3. adapter -> transient occurrence stream
python scripts/science-equations/harvest-lmfdb-number-fields.py \
  --input work/lmfdb/nf_fields.csv \
  --snapshot rowstream-sha256:<digest> \
  > work/lmfdb/occurrences.jsonl

# 4. transient JSONL -> canonical Parquet
uv run --with pydantic --with pyarrow \
  scripts/science-equations/materialize-parquet.py \
  --input work/lmfdb/occurrences.jsonl \
  --output-dir work/lmfdb/extracted \
  --stage extracted

# 5. publish and verify outside GitHub Actions
python scripts/science-equations/publish-internet-archive.py \
  --manifest work/lmfdb/extracted/manifest.json
```

## Deduplication and family boundary

This integration makes no new `equation-family` claim. Defining polynomials are mathematical object representations, and repeated or transform-related polynomials must not be collapsed merely because they look similar. Exact/textual fingerprints are only the first deduplication layer; algebraic or typed equivalence requires a reproducible transformation.

## Coverage and audit debt

New coverage is a high-volume structured arithmetic lane: number fields and their canonical defining-polynomial representations, with direct links to discriminant and Galois metadata.

Remaining audit debt is to execute the deterministic SQL export on a networked external runner, record the real rowstream digest/count, materialize the first full Parquet shards, publish/verify the Internet Archive item, sample reconstruction fidelity across degrees and unusual coefficient vectors, and then consider additional LMFDB tables as separate typed source lanes rather than flattening heterogeneous mathematical objects into one schema.
