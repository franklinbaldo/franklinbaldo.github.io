# Scientific Equation Atlas — storage and publication contract

The Atlas separates source-specific acquisition from source-agnostic lake storage.

## One adapter per source, one lake contract

Each corpus has its own adapter because acquisition semantics differ: Wikidata has entity dumps and P2534 statements, OEIS has a Git export and `%F` lines, PMC uses JATS, RFCs use RFCXML/text, and legal/regulatory corpora have their own XML/APIs and versioning rules.

An adapter is responsible only for:

1. discovering/pinning an official snapshot;
2. acquiring it through the preferred bulk channel;
3. extracting faithful occurrences with provenance;
4. marking each occurrence `attested` or `reconstructed`;
5. emitting a transient JSONL stream compatible with the common occurrence contract.

The adapter does **not** choose long-term storage. JSONL is interchange only.

## Canonical lake format

Mass data is stored as Apache Parquet. A materialized dataset is partitioned by source, snapshot and stage:

```text
<source>--<snapshot>--extracted--00000.parquet
<source>--<snapshot>--extracted--00001.parquet
...
manifest.json
```

Later stages use the same convention with `normalized` and `deduplicated`.

Every Parquet row keeps the common provenance fields plus `source_payload_json`, a canonical JSON serialization of the complete adapter record. This allows source-specific metadata to survive without forcing one giant cross-source schema.

The canonical v1 row contract is `data/science-equations/schemas/occurrence-v1.json`.

## Materialization

Use the generic materializer after a source adapter:

```sh
node scripts/science-equations/harvest-oeis-formulas.mjs \
  --repo /data/oeisdata \
  --snapshot <commit> \
| uv run scripts/science-equations/materialize-parquet.py \
  --input - \
  --source oeis-formula-lines \
  --snapshot <commit> \
  --output-dir /data/equation-atlas/oeis/<commit>
```

For Wikidata, stream decompression into the adapter and then into the same materializer. Do not create an intermediate giant JSONL file unless needed for debugging.

The materializer:

- validates the common occurrence fields;
- rejects mixed source/snapshot streams unless explicitly separated first;
- writes Zstandard-compressed Parquet;
- uses deterministic shard names;
- records row counts, byte sizes, SHA-256 and MD5 per shard;
- writes a deterministic `manifest.json`;
- refuses to call an empty dataset a successful materialization.

The default target is 250,000 rows per shard. Adjust this only when measured file sizes or source shape justify it; avoid tiny-file proliferation.

## Internet Archive is the durable publication backend

Mass Parquet shards do not belong in Git history. After local/external-executor materialization, publish each source snapshot to Internet Archive.

The item identifier is deterministic by source and snapshot, normally:

```text
scientific-equation-atlas-<source>-<snapshot>
```

A published item contains the Parquet shards and the manifest. New source snapshots get new identifiers. Do not silently mutate an already published snapshot into a different source version.

Use:

```sh
node scripts/science-equations/publish-internet-archive.mjs \
  --manifest /data/equation-atlas/oeis/<commit>/manifest.json
```

The executor must provide `IA_ACCESS_KEY_ID` and `IA_SECRET_ACCESS_KEY` in its environment and an `ia` CLI compatible with the Internet Archive Python client. Secrets never enter the repository, manifest or command-line arguments.

The publisher performs `UPLOAD -> VERIFY -> COMMIT MANIFEST`, never the reverse. It re-hashes local shards before upload, uploads with retries, then checks Internet Archive metadata until every expected file is visible with the expected byte length and MD5 when exposed by the service. SHA-256 remains the Atlas integrity checksum in the local/Git manifest even when the remote service exposes another digest.

If a source license does not permit redistribution of the raw source, do not upload the raw corpus. Publish only the permitted derived Parquet layer and preserve enough source URL, snapshot/version, license and checksums to make the derivation auditable.

## Git boundary

Git contains only lightweight control-plane artifacts:

- adapter and pipeline code;
- schemas;
- source/snapshot manifests;
- checksums and Internet Archive identifiers/URLs;
- OKF concepts, families, audits and runs;
- small fixtures.

Git does not contain bulk Parquet shards.

## Execution boundary

Acquisition, Parquet materialization and Internet Archive publication run on Jatobá, a sandbox, or another explicitly available external executor. GitHub Actions is not an execution backend for this pipeline.

A source integration is considered materially complete only when the run records actual row counts and the corresponding Internet Archive item has passed post-upload verification. An adapter implementation without full materialization is useful infrastructure, but its run must report zero materialized rows rather than implying a bulk ingestion occurred.
