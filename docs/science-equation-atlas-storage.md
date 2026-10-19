# Scientific Equation Atlas — bulk storage contract

The Atlas separates **conceptual knowledge** from **mass occurrence storage**.

- Markdown OKF remains canonical for taxonomy, named concepts, equation families, source policies, audits and run records.
- Apache Parquet is the canonical format for bulk occurrence datasets.
- Internet Archive is the durable public object store for redistributable Parquet snapshots.
- Git stores only code, schemas/descriptors, lightweight manifests, checksums, Internet Archive identifiers/URLs and audit/run records. Massive shards do not enter Git history.

JSONL/CSV may be used only as transient adapter transport or interoperability formats. A bulk acquisition is not complete until the accepted rows have been materialized to Parquet.

## Source adapter boundary

Every source owns the logic needed to acquire and interpret its native corpus. The adapter must emit provenance-preserving occurrence records. Source-specific work ends there.

The downstream contract is shared:

```text
official bulk source
  -> source-specific adapter
  -> transient occurrence stream
  -> Parquet extracted shards
  -> optional normalized Parquet shards
  -> optional deduplicated Parquet shards
  -> deterministic manifest + SHA-256
  -> Internet Archive upload
  -> remote verification
  -> lightweight Git manifest/run
```

Adapters must never turn `reconstructed` mathematics into `attested` notation. They must preserve the source expression or source rule/code, snapshot identity, locator and licensing evidence.

## Snapshot identity

A source snapshot must be reproducible and immutable enough to identify the exact acquisition input. Prefer native commit hashes, release identifiers, object versions, ETags or checksums. For mutable inventories, compute a deterministic digest over the selected inventory rows. Dates alone are not sufficient when the underlying source can change within the same day.

## Parquet materialization

`scripts/science-equations/materialize-parquet.py` validates the occurrence stream and writes Zstandard-compressed Parquet shards. Default target size is expressed in rows, not in a large number of tiny files. Each manifest records:

- schema version;
- source id;
- source snapshot;
- stage (`extracted`, `normalized` or `deduplicated`);
- row count;
- compression;
- shard filename, row count, byte size and SHA-256.

The materializer refuses empty batches and batches that mix source ids or snapshots.

Example:

```sh
uv run --with pydantic --with pyarrow \
  scripts/science-equations/materialize-parquet.py \
  --input work/pmc-jats/occurrences.jsonl \
  --output-dir work/pmc-jats/extracted \
  --stage extracted
```

## Internet Archive publication

Publication is performed outside GitHub Actions. Use an external executor/sandbox/Jatobá with `IA_ACCESS_KEY_ID` and `IA_SECRET_ACCESS_KEY` supplied through its secret environment.

`scripts/science-equations/publish-internet-archive.py` publishes the Parquet shards plus the deterministic manifest through the official `ia` CLI. It uses a deterministic item identifier derived from source + snapshot + stage unless explicitly overridden.

The publisher is fail-closed:

- if an item does not exist, create/upload it;
- if a filename already exists with identical size/MD5, treat it as idempotently present;
- if the same filename exists with different bytes, abort rather than silently overwrite the snapshot;
- after upload, poll Internet Archive metadata until every expected file is visible with the expected size and MD5;
- local SHA-256 remains the canonical shard checksum in the dataset manifest.

Only after remote verification should the repository persist an Internet Archive identifier/URL in a lightweight source/run manifest.

## License boundary

The existence of a bulk endpoint is not permission to redistribute every record. Source descriptors must state whether licensing is corpus-wide or record-specific. For record-specific corpora, publication must filter or partition rows by a conservative redistribution policy and record the decision.

A source may therefore have a valid acquisition/analysis lane while still producing zero publishable rows for a particular license class. That is preferable to silently broadening reuse rights.

## No GitHub Actions data plane

GitHub Actions is not a data plane for the Atlas. Do not use it to download corpora, generate Parquet, perform normalization/deduplication, or upload to Internet Archive. Repository checks may validate lightweight code/docs, but bulk execution and publication belong to an external executor.
