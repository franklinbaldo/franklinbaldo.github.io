# Scientific Equation Atlas — bulk storage contract

This document defines the persistent data plane for corpus-scale acquisition. Markdown OKF remains the conceptual and audit layer; the bulk lake is Apache Parquet published as versioned Internet Archive items.

## Persistent format

Apache Parquet is the canonical persistent format for bulk occurrence data. JSONL, CSV, XML, JATS, MathML, source-code archives and database rows may be used as acquisition or interchange inputs, but they are transient and must not become the canonical lake representation.

When the source and processing stage support it, materialize separate datasets for:

1. `extracted` — provenance-preserving occurrences closest to the source;
2. `normalized` — derived comparable representations without destroying source notation;
3. `deduplicated` — rows selected or grouped by an explicitly named deduplication layer.

A later stage never erases the earlier provenance. `attested` and `reconstructed` remain distinct in every stage.

## Sharding and manifests

Default bulk shards should target about 250,000 rows unless row width or source characteristics justify another size. Avoid one-file-per-occurrence layouts and avoid tiny-shard explosions.

Every shard manifest records at least:

- occurrence schema version;
- source id and source snapshot;
- processing stage;
- row count;
- byte size;
- SHA-256;
- MD5 when needed for Internet Archive verification;
- compression and file name.

The manifest itself receives a deterministic SHA-256 over its stable pre-publication content. A default Internet Archive identifier is derived from the source id plus a prefix of that digest, making the publication content-addressed at the Atlas layer.

## Internet Archive publication

Internet Archive is the durable public backend for redistributable bulk Atlas artifacts. Publication runs from an external executor or Jatobá, never from GitHub Actions.

The executor provides `IA_ACCESS_KEY_ID` and `IA_SECRET_ACCESS_KEY` through its secret/environment mechanism. Credentials never enter Git, manifests, process arguments or logs.

The publication order is strict:

```text
acquire -> extract -> Parquet -> local hashes/manifest -> Internet Archive upload
        -> remote verification -> lightweight Git publication record
```

Do not commit a Git manifest that claims a public dataset exists before the remote files are verified.

Use `mediatype:data` and include source/snapshot/license metadata where permitted. The generic publisher retries transient upload failures, then re-reads Internet Archive metadata and verifies file names, byte sizes and MD5 when the Archive exposes it.

## Immutability and idempotence

Published snapshots are immutable at the Atlas level. If an Internet Archive item already contains a same-named file with a different size or checksum, publication must fail closed rather than overwrite it. Re-running an identical publication is allowed.

A materially different acquisition or transformation receives a different manifest digest and therefore a different Atlas item identifier. This makes source evolution inspectable instead of silently mutating historical data.

## Licensing boundary

`harvest-ready` does not automatically mean that every raw input should be republished. Before upload, enforce the source-specific redistribution policy recorded in the source manifest.

If raw redistribution is not allowed, retain only the reproducibility metadata needed to reacquire the source and publish only derived Parquet fields whose redistribution is permitted. Per-record licenses must remain attached when a corpus is license-filtered.

## Git boundary

Normal Git history stores only lightweight control-plane artifacts:

- source descriptors and schemas;
- importers and materializers;
- small fixtures;
- checksums and manifests;
- Internet Archive identifiers and verified publication records;
- OKF concepts, families, audits and run cards.

Mass Parquet shards never enter normal Git history.

## Reference commands

A source adapter may emit transient JSONL into the external executor:

```sh
source-adapter > source-occurrences.jsonl
```

The common materializer then writes canonical shards:

```sh
python scripts/science-equations/materialize-parquet.py \
  --input source-occurrences.jsonl \
  --output-dir work/source/snapshot \
  --stage extracted
```

After local verification, publish the generated manifest and shards:

```sh
node scripts/science-equations/publish-internet-archive.mjs \
  --manifest work/source/snapshot/manifest.json \
  --output work/source/snapshot/publication.json
```

Only after the final command verifies the remote object should its lightweight publication record be committed to Git.
