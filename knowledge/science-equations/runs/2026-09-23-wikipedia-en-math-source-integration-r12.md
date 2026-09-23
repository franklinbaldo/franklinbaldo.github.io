---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first bulk source integration"
summary: "Integrate the official English Wikipedia pages-articles dump as a broad cross-domain attested-math lane, pinned to the complete 20260901 dump with checksum-aware external acquisition and Parquet/Internet Archive publication contract."
updated: "2026-09-23"
---

# English Wikipedia math-tag source integration — r12

## State reconstructed from main

This execution reread `docs/science-equation-atlas-routine.md` and `docs/science-equation-atlas-sources.md`, then reconstructed state from current `main`, `knowledge/science-equations/`, `data/science-equations/manifests/`, `data/science-equations/sources/`, and the existing ingestion scripts only.

At the start, `main` had bulk adapters for Wikidata P2534, OEIS `%F`, and PMC/JATS; a shared Parquet materializer; a generic Internet Archive publisher; one pinned OEIS manifest; and one PMC source descriptor. Persistent bulk materialization remained at zero in the committed manifests.

## Source selected

**English Wikipedia pages-articles multistream XML dumps** were selected as the next lane because they combine:

- official bulk access rather than page-by-page scraping;
- explicit MediaWiki `<math>...</math>` containers whose bodies are attested source notation;
- broad disciplinary coverage beyond the specialized Wikidata/OEIS/PMC lanes;
- current-revision page and revision identifiers that preserve a stable attribution path;
- partitioned compressed XML files suitable for parallel acquisition on an external executor.

Fresh verification on 2026-09-23 established that the official `enwiki/20260901` dump is complete. Wikimedia exposes both the recombined `enwiki-20260901-pages-articles-multistream.xml.bz2` file and many partitioned multistream XML.bz2 files, with official MD5/SHA-1 checksum manifests. The official SHA-1 for the combined pages-articles multistream file is `e0a53c30c3a3b444018df95704d3d101cd618440`.

Primary documentation:

- <https://dumps.wikimedia.org/enwiki/20260901/>
- <https://dumps.wikimedia.org/enwiki/20260901/enwiki-20260901-sha1sums.txt>
- <https://meta.wikimedia.org/wiki/Data_dumps/What's_available_for_download>
- <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use>

The Wikimedia Terms of Use require attribution and describe CC BY-SA/GFDL reuse, while warning that imported text can carry compatible-license or additional attribution requirements. The lane therefore preserves a stable `oldid` URL and page/revision lineage for every occurrence rather than treating the dump as anonymous mathematical text.

## Integrated adapter

`scripts/science-equations/harvest-wikimedia-math.py` streams one or more Wikimedia XML, XML.bz2 or XML.gz files with the Python standard library. By default it selects namespace 0 and emits one transient occurrence for every non-empty `<math>...</math>` body in current-revision wikitext.

Each emitted record is compatible with the Atlas `OccurrenceV1` materializer and preserves:

- `source_snapshot` supplied by the checksum-verified acquisition run;
- exact expression body without destructive normalization;
- `attested` provenance;
- `mediawiki-math-tex` encoding;
- page id, revision id, revision timestamp and revision SHA-1;
- stable revision (`oldid`) URL;
- source file and character-span locator;
- original `<math>` tag attributes when present;
- nearby wikitext context;
- source-record, exact-expression and whitespace-normalized SHA-256 fingerprints.

Whitespace normalization is only a derived textual fingerprint. It does not replace `expression_original` and does not assert algebraic, typed, dimensional, functional or dynamic equivalence.

## Snapshot and lake contract

`data/science-equations/manifests/wikipedia-en-20260901.json` pins the official dump date, completion state, official checksum manifest and combined-file SHA-1. Final lake identity is deliberately stricter than the date: the external acquisition run must verify the exact selected partition inventory, compute local SHA-256 for every acquired object, and derive a deterministic inventory digest from sorted file metadata.

`data/science-equations/sources/wikipedia-en-math.json` registers the shared downstream contract:

```text
official Wikimedia dump partitions
  -> checksum verification + inventory digest
  -> harvest-wikimedia-math.py
  -> transient JSONL
  -> materialize-parquet.py (extracted)
  -> later normalized/deduplicated Parquet stages
  -> publish-internet-archive.py
  -> remote verification
  -> lightweight Git manifest/run
```

GitHub Actions is not used for acquisition, processing, Parquet generation, or Internet Archive upload.

## Validation performed in this execution

The adapter was syntax-checked and exercised locally against a synthetic namespaced MediaWiki XML fixture compressed as bzip2. The fixture covered:

- two main-namespace pages and one template-namespace page;
- plain and attributed `<math>` tags;
- multiline TeX;
- an empty math tag;
- namespace filtering;
- revision/page provenance.

Result: **3 expected attested occurrences emitted, 3/3 field/provenance assertions passed**, with the template page excluded and the empty expression rejected. The environment has Pydantic 2.13.4, so the emitted field set was also checked against the required `OccurrenceV1` contract. PyArrow is not installed in this sandbox.

`okf-parser` is not installed in the execution image and outbound shell DNS is unavailable, so the normative parser could not be executed here. The run card follows the existing `science-atlas-run` spec fields and is left for the repository's normal local/reproducible parser gate before merge.

## Actual yield and publication boundary

Real Wikipedia dump rows extracted in this execution: **0**.

Real Parquet rows materialized: **0**.

Internet Archive items published: **0**.

These zeros are deliberate. The sandbox shell cannot resolve external hosts for bulk download, the direct container download path also failed for a Wikimedia partition, PyArrow is unavailable, and Internet Archive credentials are not exposed. The 3 fixture occurrences are validation only and are not counted as corpus ingestion.

No equation family was created. No candidate similarity is promoted to a verified family without a reproducible transformation.

## External-executor acquisition path

The next bulk-capable executor can run the lane without changing repository semantics:

```sh
# 1. acquire the official enwiki 20260901 pages-articles-multistream partitions
# 2. verify every partition against Wikimedia's published checksum manifest
# 3. compute local SHA-256 and a deterministic selected-file inventory digest

python scripts/science-equations/harvest-wikimedia-math.py \
  --snapshot inventory-sha256:<digest> \
  --input work/enwiki/verified/*.xml.bz2 \
  > work/enwiki/occurrences.jsonl

uv run --with pydantic --with pyarrow \
  scripts/science-equations/materialize-parquet.py \
  --input work/enwiki/occurrences.jsonl \
  --output-dir work/enwiki/extracted \
  --stage extracted

python scripts/science-equations/publish-internet-archive.py \
  --manifest work/enwiki/extracted/manifest.json
```

The Internet Archive identifier is derived from `wikipedia-en-math + inventory digest + stage`; no mutable date-only item is considered the final snapshot identity.

## New coverage and audit debt

New coverage:

- explicit attested TeX-style mathematics across a broad general encyclopedia rather than one scientific silo;
- current-revision article lineage suitable for attribution and cross-source deduplication;
- a corpus whose official partitioning supports parallel source-first acquisition.

Audit debt:

- execute the full checksum-verified partition inventory on Jatobá or another external bulk runner;
- measure real `<math>` occurrence count, rows per article, duplicate rates and domain distribution;
- detect pages carrying additional imported-content attribution notices before any curated verbatim context reuse;
- decide whether non-main namespaces add useful named mathematical objects without excessive template duplication;
- add syntax-level normalization before algebraic candidate generation;
- materialize and publish the first real Wikipedia Parquet item, then persist verified Internet Archive identifiers and shard hashes in Git.
