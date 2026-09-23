---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first LMFDB integration + Parquet/Internet Archive data-plane contract"
summary: "Add a corpus-scale LMFDB elliptic-curve lane targeting 3.82M generalized Weierstrass models, plus generic Parquet materialization and verified Internet Archive publication tooling outside GitHub Actions."
updated: "2026-09-23"
---

# LMFDB source integration — elliptic curves over Q

## State reconstructed from `main`

This execution reread `docs/science-equation-atlas-routine.md` and `docs/science-equation-atlas-sources.md`, then inspected the current `knowledge/science-equations/` state and ingestion manifests before acting.

The persisted state had two bulk adapters on `main` — Wikidata P2534 and OEIS `%F` — but only the OEIS source manifest. That manifest still allowed either compressed JSONL or Parquet as recommended persistent storage. The current user-level storage contract is stricter: **Parquet is the canonical bulk format and Internet Archive is the durable publication backend; GitHub Actions are not part of the data plane**.

The source plan places LMFDB immediately after Wikidata and OEIS in the high-readiness mathematical queue, so this run selected a new source integration rather than another hand-picked formula.

## Source selected

Source: **LMFDB elliptic curves over Q**, table `ec_curvedata`.

Official LMFDB access documentation exposes a public read-only PostgreSQL mirror in addition to the API. The API statistics page observed on 2026-09-23 reports **3,824,372 rows** in `ec_curvedata`. This is an addressable-corpus observation, not an ingestion count.

The source manifest is `data/science-equations/manifests/lmfdb-ec-curvedata-2026-09-23.json`.

## Adapter and provenance semantics

`scripts/science-equations/harvest-lmfdb-ec-curvedata.py` streams three fields from the official SQL mirror:

- `lmfdb_label`;
- `ainvs = [a1,a2,a3,a4,a6]`;
- `conductor`.

The source row directly attests the a-invariants. The Atlas renders those coefficients as the generalized Weierstrass model

```text
y^2 + a1*x*y + a3*y = x^3 + a2*x^2 + a4*x + a6
```

Therefore the emitted occurrence is deliberately marked **`reconstructed`**, not `attested`. Each row preserves the exact structured source representation, the transformation rule, the LMFDB identifier, source URLs, CC BY-SA provenance and hashes. This keeps the important distinction between a mathematical object encoded by coefficients and notation literally printed by the source.

## Common Parquet + Internet Archive path

This run adds `docs/science-equation-atlas-storage.md` as the stable bulk-storage contract and two generic tools shared by all adapters:

- `scripts/science-equations/materialize-parquet.py` converts transient adapter JSONL into canonical Parquet shards, with schema version, row count, byte size, SHA-256 and MD5 per shard plus a deterministic manifest digest;
- `scripts/science-equations/publish-internet-archive.mjs` uploads the manifest and shards to an Internet Archive `mediatype:data` item from an external executor, then re-reads Archive metadata to verify file presence, size and MD5 when available.

The publisher is fail-closed against silent mutation: a same-named remote file with a different size or checksum aborts publication. Only a verified publication record should subsequently enter Git.

No GitHub Action is used for acquisition, Parquet generation or Internet Archive upload.

## Fixture validation performed

The LMFDB adapter was compiled with Python and exercised against a two-row JSONL fixture. The fixture yielded **2 accepted reconstructed occurrences and 0 rejected rows**. One fixture row used `ainvs=[0,-1,1,0,0]` and reconstructed `y^2 + y = x^3 - x^2`; another used `ainvs=[0,0,0,4,0]` and reconstructed `y^2 = x^3 + 4*x`.

The common materializer passed `--validate-only` against those two emitted records: **2 accepted, 0 rejected**. The Internet Archive publisher passed Node syntax validation.

These are adapter/tooling tests, not corpus-ingestion counts.

## Actual yield in this execution

Persistent full-corpus occurrences materialized: **0**.

Parquet shards uploaded to Internet Archive: **0**.

Internet Archive identifier: **not assigned yet**.

This boundary is explicit rather than fabricating a bulk result. The available sandbox did not have outbound DNS for the LMFDB SQL mirror, did not have PyArrow/another Parquet writer installed, and did not expose `IA_ACCESS_KEY_ID` / `IA_SECRET_ACCESS_KEY`. The source lane and publication contract are now executable on a capable external executor/Jatobá, but that external executor was not directly invokable from this run.

## Replay boundary on the external executor

Acquire the source rows:

```sh
uv run --with 'psycopg[binary]' \
  scripts/science-equations/harvest-lmfdb-ec-curvedata.py \
  --snapshot <snapshot-id> \
  > lmfdb-ec-curvedata.jsonl
```

Materialize canonical Parquet:

```sh
uv run --with pyarrow \
  scripts/science-equations/materialize-parquet.py \
  --input lmfdb-ec-curvedata.jsonl \
  --output-dir work/lmfdb/<snapshot-id> \
  --stage extracted
```

Then, with Internet Archive credentials supplied only by the external executor:

```sh
node scripts/science-equations/publish-internet-archive.mjs \
  --manifest work/lmfdb/<snapshot-id>/manifest.json \
  --output work/lmfdb/<snapshot-id>/publication.json
```

The Git-side manifest should be updated with the measured row counts, actual shard hashes and verified Archive identifier only after the last command succeeds.

## Deduplication and family boundary

This run creates no `equation-family` edge. Every row shares the generalized Weierstrass template by construction, but that fact alone does not prove that different curves are equivalent mathematical objects. Exact and structural fingerprints may generate later candidates; stronger equivalence still requires a reproducible transformation appropriate to elliptic curves.

## New coverage

The new lane gives the Atlas a path to millions of structured occurrences in:

- arithmetic geometry;
- elliptic curves over the rationals;
- algebraic models represented by typed coefficient vectors.

It also tests a general class of sources important beyond LMFDB: databases where a mathematical object is stored structurally and the human-readable equation is a faithful reconstruction rather than source notation.

## Audit debt / next source-first action

1. Run the complete `ec_curvedata` acquisition on Jatobá or another external executor with network access.
2. Produce and publish the first real Parquet shards; write back measured counts, checksums and verified Internet Archive identifier.
3. Measure source-exact/textual duplicate rates without claiming algebraic equivalence.
4. Expand to additional high-yield LMFDB tables using the same storage/publisher contract.
5. After the mathematical lane is proven end-to-end, advance the queued GovInfo/CFR/eCFR bulk XML lane for law and regulation.

No source snapshot is considered published until the Internet Archive files have been remotely verified.
