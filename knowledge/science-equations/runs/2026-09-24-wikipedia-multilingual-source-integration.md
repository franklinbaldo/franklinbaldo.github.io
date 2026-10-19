---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Expand the Wikipedia math lane from English-only legacy-dump acquisition to the official MediaWiki Content File Exports and add a per-wiki multilingual Wikipedia source family for explicit attested math tags."
updated: "2026-09-24"
---

# Multilingual Wikipedia bulk math source integration — 2026-09-24

## State reconstructed from main

This run was selected only after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the source descriptors, and persisted ingestion manifests.

At selection time, `main` contains source descriptors for GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, PMC/JATS, Wikidata P2534, and English Wikipedia math tags. The persisted ingestion-manifest directory contains only the OEIS manifest.

The unit of work is a **Wikipedia language-edition corpus from the official Wikimedia current-content export service**, not an individual article or formula.

## Why this source

The existing English Wikipedia lane already demonstrates the value of explicit MediaWiki `<math>` tags as broad, cross-domain `attested` expressions. Wikimedia now provides the official `mediawiki_content_current` dataset for all public wikis as per-wiki compressed XML exports. The service is produced monthly, and a per-wiki `SHA256SUMS` file is the completion marker and checksum surface for an export generation.

The Wikimedia documentation also states that the legacy XML dump infrastructure is deprecated because it can no longer reliably produce the largest wikis. This run therefore does two things:

1. migrates the English Wikipedia descriptor to prefer `mediawiki_content_current` rather than the deprecated legacy dump path;
2. adds a new multilingual Wikipedia source family covering non-English Wikipedia language editions, with each wiki handled as a separate source snapshot/materialization batch.

Official references:

- <https://wikitech.wikimedia.org/wiki/MediaWiki_Content_File_Exports>
- <https://wikitech.wikimedia.org/wiki/MediaWiki_Content_File_Exports/WikiId_Mappings>
- <https://www.mediawiki.org/wiki/Extension:Math>
- <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use>

## Acquisition and snapshot identity

No page-by-page HTML scraping is used. For each selected Wikipedia project, the external data executor must:

1. resolve `wiki_id`, hostname and language from the official WikiId mapping;
2. select `mediawiki_content_current`;
3. choose an export generation only when that wiki's `SHA256SUMS` exists;
4. download every path named by `SHA256SUMS` outside the Git working tree;
5. verify all bytes with `sha256sum --check`;
6. run `scripts/science-equations/build-source-inventory.py` over the exact local export files;
7. use `wikimedia-content-current:<wiki_id>:inventory-sha256:<digest>` as `source_snapshot`.

A materialization batch contains exactly one `wiki_id` and one completed export generation. This aligns with the existing materializer invariant that a batch has exactly one `source_id` and one `source_snapshot` while avoiding cross-wiki page/revision identifier collisions.

English Wikipedia remains under source id `wikipedia-en-math-tags`. Non-English Wikipedias use source id `wikipedia-multilingual-math-tags`; `enwiki` is excluded from that family to prevent overlap.

## Extraction semantics

`harvest-wikipedia-math.py` is generalized rather than duplicated. It now accepts source and wiki identity as arguments while preserving English defaults. Every emitted occurrence records:

- exact `<math>` body as `expression_original`;
- raw matched tag and attributes;
- `wiki_id` and language;
- page title and page id;
- revision id, timestamp and revision SHA-1 when available;
- stable per-wiki `oldid` URL;
- source snapshot and export-part provenance;
- exact and whitespace-normalized expression hashes.

`wiki_id` participates in `source_document_id`, `source_locator`, and `source_record_sha256`; equal numeric page/revision IDs from different Wikipedias therefore remain distinct source records.

All emitted expressions are `attested`. This stage performs no translation, OCR, macro interpretation, algebraic reconstruction, or equivalence assertion. Existing exclusions remain: redirects and non-main namespaces by default, empty math tags, and math-like strings inside comments or literal/no-render regions. Parser-function `{{#tag:math|...}}` forms remain explicitly outside this adapter.

## Rights and publication boundary

Wikipedia text is subject to Wikimedia's attribution/share-alike terms, with an imported-text caveat for compatible content carrying additional attribution obligations. The source family therefore preserves wiki/page/revision attribution on every row and does not flatten the entire corpus into a stronger rights claim than the source permits.

The Atlas does not need to mirror Wikimedia's raw content-export bytes to the Internet Archive. The intended publication unit is the permitted derived occurrence Parquet plus deterministic manifests and provenance metadata.

## Canonical lake

JSONL emitted by the harvester is transient transport only. The canonical equation lake remains:

1. `extracted` Apache Parquet/Zstd;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

Default shard sizing remains 250,000 rows unless measured row width or executor limits justify a different deterministic shard policy. Every published manifest must carry schema version, row count, shard sizes and SHA-256 values.

## Reproducible validation in this execution

The conversation sandbox has Python but no repository checkout, no PyArrow, no `gh`, and no outbound DNS from the shell. It therefore cannot truthfully execute the Wikimedia bulk data plane, Parquet materialization, Internet Archive publication, or the full local blog suite.

The branch adds a deterministic regression that exercises a non-English `ptwiki` invocation and proves that wiki identity is preserved in document ids, locators, URLs and occurrence rows. Existing English extraction and packaging-invariance regressions are retained. These checks are control-plane validation only and must not be counted as corpus yield.

## Real corpus yield in this execution

- executor used for data plane: conversation sandbox, no external corpus acquisition possible;
- real source snapshot acquired: none;
- Internet Archive identifier: none;
- extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifest: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, processing, normalization, deduplication, Parquet generation, or Internet Archive publication.

## External executor recipe

On an external/Jatobá/local data executor with normal network, PyArrow and Internet Archive credentials:

1. obtain the official WikiId mapping and select Wikipedia hostnames, excluding `enwiki` from the multilingual family;
2. process projects independently so each wiki/export generation has one deterministic snapshot;
3. wait for each `SHA256SUMS` completion marker;
4. download and verify all XML.bz2 parts outside Git;
5. build the deterministic local inventory;
6. invoke `harvest-wikipedia-math.py` with the project's `--wiki-id`, `--wiki-language`, `--wiki-base`, source id and content-addressed snapshot;
7. stream transient JSONL directly into the occurrence validator/materializer rather than retaining it as the lake;
8. produce `extracted`, then `normalized` and `deduplicated` Parquet/Zstd shards;
9. publish permitted Parquets/manifests to an immutable Internet Archive item whose identifier includes source family, wiki id, inventory digest and stage;
10. verify remote listing, size and checksum metadata;
11. commit only lightweight manifests, counts, checksums, IA identifiers/URLs and audit evidence.

## Deduplication and family work

Multilingual Wikipedia is especially useful for cross-language deduplication candidates. Source-exact identity remains wiki-specific, while later stages may test whether expressions from different languages converge under textual, syntax-aware, algebraic, typed-variable, dimensional, functional or dynamic normalization.

Cross-language co-occurrence or clustering is candidate evidence only. No `equation-family` edge is promoted without a reproducible transformation or formal argument.

## New coverage

This source family expands the same broad Wikipedia surface across non-English scientific, mathematical, engineering, medical, computing, economic, social-science and regulatory content. It also creates a natural multilingual reconciliation layer against Wikidata and specialist corpora without requiring article-by-article scraping.

## Audit debt

- measure per-wiki `<math>` prevalence, rows and byte widths on real completed exports;
- rank language editions by verified marginal coverage rather than raw page count alone;
- audit imported-text attribution edge cases before broad redistribution claims;
- add parser-aware `#tag:math` extraction as a separate attested lane if its measured yield justifies it;
- quantify cross-language exact/syntactic/algebraic duplicate rates;
- promote structural families only after reproducible transformations are available.
