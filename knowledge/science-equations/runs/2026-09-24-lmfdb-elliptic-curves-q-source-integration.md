---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate LMFDB ec_curvedata as a multi-million-row lane for elliptic curves over Q, reconstructing generalized minimal Weierstrass equations from attested a-invariants and routing bulk output through Parquet/Internet Archive outside GitHub Actions."
updated: "2026-09-24"
---

# LMFDB elliptic curves over Q — source integration

## State reconstructed from main

This run was selected only after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, current source descriptors, ingestion manifests, and the current open-PR surface.

At reconstruction time, `main` has integrated descriptors for GovInfo/eCFR, IETF RFCXML, LMFDB number fields, OEIS, PMC/JATS, Wikidata P2534, and English Wikipedia math. The persisted ingestion-manifest directory still contains only the OEIS manifest. EUR-Lex/Formex exists only as an open PR (#2265) and is therefore not treated as canonical `main` state in this run.

The unit of work is the **LMFDB `ec_curvedata` corpus**, not an individual elliptic curve or formula.

## Why this corpus

LMFDB already provides a high-quality direct SQL surface and a clear corpus-wide reuse policy. Its current official table statistics, observed on 2026-09-24, report **3,824,372 objects** in `ec_curvedata` (about 6,101 MiB including indexes). This is source-scale evidence only and is not counted as ingestion yield in this run.

`ec_curvedata` is a distinct high-yield corpus from the already integrated `nf_fields` lane. It exposes elliptic curves over Q with structured a-invariants and stable LMFDB labels, making it possible to reconstruct millions of generalized minimal Weierstrass equations without OCR or page-level scraping.

Official references:

- access and license: <https://www.lmfdb.org/api/options>
- table statistics: <https://www.lmfdb.org/api/stats>
- table schema/API: <https://www.lmfdb.org/api/ec_curvedata/1>

## Acquisition contract

The source descriptor pins the deterministic projection:

```sql
SELECT lmfdb_label, ainvs, conductor, jinv, analytic_rank, cm, lmfdb_iso, lmfdb_number
FROM ec_curvedata
ORDER BY lmfdb_label;
```

The external executor must export that exact ordered rowstream, count rows, compute SHA-256 over the exact CSV bytes before extraction, and identify the snapshot as `rowstream-sha256:<digest>`. A wall-clock date or observed LMFDB release label alone is not sufficient corpus identity.

The official LMFDB access page documents a read-only PostgreSQL mirror for bulk access and states that the underlying data are CC-BY-SA. The Atlas therefore preserves LMFDB attribution/share-alike metadata on every occurrence and published dataset without inventing a license version that the official page does not specify.

## Attested versus reconstructed

The database directly attests the five a-invariants `[a1,a2,a3,a4,a6]`. The Atlas converts those stored values into:

```text
y^2 + a1*x*y + a3*y = x^3 + a2*x^2 + a4*x + a6
```

The emitted equation is therefore **`reconstructed`**, not `attested`. Every record preserves the source a-invariants, conductor, label and selected curve metadata in `source_attested_payload`, together with an explicit reconstruction rule and coefficient order.

No algebraic-equivalence or isomorphism claim is created by this extraction step. Two curves sharing a structural form do not automatically become a verified `equation-family` edge.

## Adapter and lake path

Added `scripts/science-equations/harvest-lmfdb-elliptic-curves-q.py` and the stable source descriptor `data/science-equations/sources/lmfdb-elliptic-curves-q.json`.

The adapter accepts a deterministic CSV export and emits transient JSONL only as an interoperability stream into the shared occurrence validator/materializer. The persistent lake remains:

```text
ordered SQL rowstream
→ transient occurrence stream
→ extracted Parquet/Zstd
→ normalized Parquet/Zstd
→ deduplicated Parquet/Zstd
→ Internet Archive + deterministic manifests
```

The Git repository stores only the source contract, code, small fixtures/tests, run metadata, and later lightweight publication manifests/checksums/IA identifiers.

## Local reproducible validation

The conversation sandbox was able to validate adapter semantics but not perform the external data-plane acquisition.

Validation completed before opening the PR:

- `python3 -m py_compile` passed;
- standalone Node regression suite passed **2/2**;
- fixture read **4** source rows;
- **3** reconstructed occurrences were emitted;
- **1** malformed row with four rather than five a-invariants was rejected;
- known vectors produced `y^2 + x*y + y = x^3 - 11*x + 12`, `y^2 = x^3 + 141*x + 4718`, and `y^2 + x*y = x^3 - x^2 + 9*x`;
- record identity remained stable when the same logical source row was serialized with a different CSV column order.

Synthetic fixture rows are test evidence only and are not counted as corpus yield.

## Real corpus yield in this execution

The available sandbox cannot resolve the LMFDB SQL mirror from its shell, PyArrow is not installed in that executor, and Internet Archive credentials are not exposed. No bulk SQL export, real Parquet materialization, or IA upload was therefore claimed.

- executor used for data plane: conversation sandbox, fixture-only validation;
- source snapshot: not acquired;
- Internet Archive identifier: none;
- real extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifest: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, processing, normalization, deduplication, Parquet generation, or Internet Archive publication. CI may validate code/OKF/blog state only as control plane.

## External executor recipe

On a local/Jatobá or other data executor with network, PyArrow and Internet Archive credentials:

1. connect to the official read-only LMFDB PostgreSQL mirror;
2. export the descriptor's exact query in `lmfdb_label` order to a file outside the Git working tree;
3. count rows and compute SHA-256 over the exact CSV byte stream;
4. set `source_snapshot=rowstream-sha256:<digest>` and run `harvest-lmfdb-elliptic-curves-q.py`;
5. validate the transient stream with `materialize-parquet.py --validate-only`;
6. materialize deterministic `extracted` Parquet/Zstd shards, then non-destructive `normalized` and `deduplicated` stages;
7. publish permitted Parquet shards and manifests from the external executor using `publish-internet-archive.py`;
8. verify IA file listing, byte sizes and checksums when available;
9. commit only lightweight publication manifests, measured counts, checksums, IA identifiers/URLs and updated run evidence.

## Deduplication and family policy

This lane feeds the existing layered program: source-exact identity, textual normalization, syntax-aware equation normalization, algebraic candidate generation, typed variable renaming, dimensional/semantic checks where applicable, functional equivalence and finally verified structural families.

All rows being elliptic-curve models is not itself sufficient evidence for a strong family edge. Isomorphic curves, alternate models and equivalent transformations must remain distinguishable unless the Atlas can provide a reproducible transformation or formal argument.

## New coverage

This corpus adds a multi-million-object algebraic-geometry/arithmetic-geometry surface with stable mathematical object identifiers, exact stored coefficients, and related invariants that can later support cross-source reconciliation with number fields, modular forms, L-functions and other specialist corpora.

## Audit debt

- run the complete SQL acquisition and persist the exact row count plus rowstream digest;
- inspect any malformed/non-integral a-invariant rows rather than silently repairing them;
- audit canonicalization so it does not conflate distinct models or merely isomorphic curves;
- measure exact-text versus normalized duplication after full materialization;
- reconcile curve labels/invariants with related LMFDB tables without turning joins into unsupported equation equivalence claims;
- promote equation families only when a reproducible transformation or formal relation is available.
