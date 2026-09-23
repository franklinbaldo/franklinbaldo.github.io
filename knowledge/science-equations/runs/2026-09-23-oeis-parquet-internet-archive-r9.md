---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first storage integration"
summary: "Make Apache Parquet plus verified Internet Archive publication the common equation-lake contract, then bind the existing pinned OEIS adapter to that contract without claiming an unexecuted bulk harvest."
updated: "2026-09-23"
---

# OEIS Parquet + Internet Archive integration

## State reconstructed before acting

This execution started from current `main`, reread `docs/science-equation-atlas-routine.md` and `docs/science-equation-atlas-sources.md`, inspected the current equation manifests and recent source-integration runs, and checked for competing open Atlas pull requests before writing.

The persistent state showed two source-specific bulk adapters already present: Wikidata P2534 and OEIS `%F`. The OEIS adapter was pinned to commit `86962e9ef366e08ffbeeff8c72c1cf2b4268d82b`, but its manifest still described JSONL/Parquet as alternative external storage and the prior run had materialized zero persistent occurrences. The next missing layer was therefore not another formula or another corpus adapter; it was the reusable lake contract shared by every source.

## Architecture materialized in this run

This run adds `docs/science-equation-atlas-storage.md` and makes the stable architecture explicit:

```text
source-specific bulk adapter
        ↓
transient JSONL occurrence stream
        ↓
source-agnostic occurrence contract
        ↓
Apache Parquet shards
        ↓
Internet Archive upload
        ↓
remote verification
        ↓
lightweight Git manifest / OKF run
```

The important boundary is **one adapter per source, one storage/publication pipeline for all sources**. Source adapters remain responsible for snapshot discovery, acquisition and faithful extraction; they do not implement their own long-term storage or Internet Archive upload logic.

GitHub Actions is explicitly not an execution backend for acquisition, Parquet materialization or Internet Archive publication. Those stages belong on Jatobá, a sandbox or another explicitly available external executor. Git remains the control plane for code, schemas, light manifests, checksums, Internet Archive identifiers, provenance and OKF state.

## Common Parquet occurrence contract

`data/science-equations/schemas/occurrence-v1.json` defines the stable common row surface. It retains source identity, snapshot, document/locator, original expression and encoding, provenance class, license/policy references and integrity hashes.

Source-specific fields are not discarded. `source_payload_json` carries a canonical serialization of the complete adapter record so that a future schema evolution or audit can recover source-native qualifiers, references and other metadata without inflating the cross-source column schema.

`scripts/science-equations/materialize-parquet.py` is the generic materializer. It:

- accepts adapter JSONL from stdin or a transient file;
- validates that one materialization does not silently mix source IDs or snapshots;
- preserves `attested` versus `reconstructed`;
- writes Zstandard-compressed Apache Parquet;
- uses deterministic source/snapshot/stage shard names;
- defaults to 250,000 rows per shard to avoid tiny-file proliferation;
- records row counts, byte sizes, SHA-256 and MD5 per shard;
- writes a deterministic `manifest.json`;
- refuses to report success for an empty dataset.

The three storage stages are `extracted`, `normalized` and `deduplicated`. The current OEIS adapter binds first to `extracted`; later stages must preserve the original expression and provenance rather than replacing them.

## Internet Archive publisher

`scripts/science-equations/publish-internet-archive.mjs` is the source-agnostic publisher. It takes a Parquet manifest, re-hashes every local shard, uploads with the `ia` client using retries and `mediatype:data`, and polls Internet Archive metadata until every expected file is visible with the expected byte length and MD5 where exposed by the service.

Credentials are read only from the executor environment:

- `IA_ACCESS_KEY_ID`;
- `IA_SECRET_ACCESS_KEY`.

They are not committed to Git and are not passed as command-line arguments.

The required ordering is:

```text
UPLOAD → VERIFY → COMMIT MANIFEST
```

A source snapshot does not become published state merely because an upload command was issued.

## OEIS binding

`data/science-equations/manifests/oeis-2026-09-23.json` is upgraded to the new contract while preserving its pinned upstream commit and CC BY-SA 4.0 provenance.

The deterministic planned Internet Archive identifier is:

`scientific-equation-atlas-oeis-formula-lines-86962e9ef366e08ffbeeff8c72c1cf2b4268d82b`

The adapter's JSONL is now explicitly transient interchange; persistent mass storage is Parquet.

## Actual yield in this execution

Persistent Parquet rows materialized: **0**.

Internet Archive items published: **0**.

These zeroes are deliberate. The automation sandbox available to this run could inspect and mutate the GitHub repository, but its local execution environment could not resolve outbound Git/PyPI hosts and did not expose `IA_ACCESS_KEY_ID` or `IA_SECRET_ACCESS_KEY`. It therefore could not acquire the pinned full OEIS export, install PyArrow, or authenticate an Internet Archive upload. No sample or addressable-corpus count is being relabeled as a completed ingestion.

The next bulk-capable external executor can complete the pinned run with the already-materialized contract:

```sh
git clone --filter=blob:none --no-checkout https://github.com/oeis/oeisdata.git /data/oeisdata
git -C /data/oeisdata fetch origin 86962e9ef366e08ffbeeff8c72c1cf2b4268d82b

node scripts/science-equations/harvest-oeis-formulas.mjs \
  --repo /data/oeisdata \
  --snapshot 86962e9ef366e08ffbeeff8c72c1cf2b4268d82b \
| uv run scripts/science-equations/materialize-parquet.py \
  --input - \
  --source oeis-formula-lines \
  --snapshot 86962e9ef366e08ffbeeff8c72c1cf2b4268d82b \
  --output-dir /data/equation-atlas/oeis/86962e9ef366e08ffbeeff8c72c1cf2b4268d82b

node scripts/science-equations/publish-internet-archive.mjs \
  --manifest /data/equation-atlas/oeis/86962e9ef366e08ffbeeff8c72c1cf2b4268d82b/manifest.json
```

That executor must then persist the measured total rows, shard checksums and verified Archive publication into the lightweight Git manifest/run.

## Validation actually performed

The new scripts and schema were subjected to checks that did not require network access:

- `python -m py_compile scripts/science-equations/materialize-parquet.py`;
- `node --check scripts/science-equations/publish-internet-archive.mjs`;
- JSON parsing of the occurrence schema and updated OEIS manifest.

A real Parquet write could not be executed because PyArrow could not be downloaded in the isolated sandbox. The repository-pinned `okf-parser` dependency likewise could not be fetched, so the normative OKF validation is **not** reported as green in this run.

## Deduplication and family boundary

No new `equation-family` is asserted here. This run creates storage and publication infrastructure, not semantic equivalence evidence.

The existing OEIS exact-text and whitespace-normalized fingerprints remain candidate-generation layers only. Algebraic, typed, dimensional, functional and dynamic equivalence still require stronger reproducible transformations before family promotion.

## Next highest-value action

Run the pinned OEIS adapter on a bulk-capable executor with Internet Archive credentials, generate the first measured Parquet shards, publish and verify the immutable Archive item, then commit only the verified lightweight publication manifest. Once that path succeeds end to end, the same common materializer/publisher should be reused for Wikidata P2534 rather than implementing another storage stack.
