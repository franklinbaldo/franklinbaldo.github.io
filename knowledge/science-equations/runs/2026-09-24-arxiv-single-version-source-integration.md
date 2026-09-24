---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate a fail-closed arXiv bulk TeX lane for single-version papers whose OAI-PMH license unambiguously permits redistribution."
updated: "2026-09-24"
---

# arXiv single-version bulk TeX source integration — 2026-09-24

## State reconstructed from main

This run was selected only after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the source descriptors, and persisted ingestion manifests.

At selection time, `main` contains eleven source descriptors: EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, OpenStax osbooks/CNXML, PMC/JATS, Wikidata P2534, English Wikipedia math tags, and multilingual Wikipedia math tags. `data/science-equations/manifests/` contains only the persisted OEIS manifest.

The stable source plan still places **arXiv** ahead of the later software-documentation and secondary-corpus lanes, but explicitly marks it as high-volume with a license/non-redistribution hazard. The unit of work here is therefore the official arXiv bulk source corpus, not an individual paper or formula.

## Why this lane is now safe enough to integrate

arXiv's official S3 bulk interface publishes source files — mostly TeX/LaTeX plus figures — in requester-pays TAR chunks of roughly 500 MB and provides `src/arXiv_src_manifest.xml` with chunk metadata/checksums. The source collection was already about 2.9 TB in March 2023 and is updated approximately monthly:

- <https://info.arxiv.org/help/bulk_data_s3.html>

The same official page warns that most papers use the arXiv perpetual non-exclusive license. That license permits arXiv to distribute the work but does not let arXiv grant third parties redistribution rights. License information for the smaller alternatively licensed population is exposed in OAI-PMH metadata.

The earlier obstacle is version identity. arXiv explicitly states that different versions of one work can have different licenses:

- <https://info.arxiv.org/help/license/index.html>

OAI-PMH models one article as one item and exposes only its most recent version as the item, while `arXivRaw` includes the version history and a license field:

- <https://info.arxiv.org/help/oa/index.html>

That means a paper-level OAI license must not be attached blindly to arbitrary historical source versions. This lane resolves the ambiguity without page-by-page scraping: **payload publication is limited to records for which `arXivRaw` reports exactly one version**. In that case the current/paper-level license is necessarily the license of the only version. Multi-version papers fail closed and are not redistributed by this lane.

The rights allowlist is likewise deliberately narrow. The harvester admits only Creative Commons Attribution (`CC BY`), Attribution-ShareAlike (`CC BY-SA`), and CC Zero (`CC0`) license URLs. The arXiv non-exclusive license, NC/ND variants, missing licenses, custom/unknown licenses, and all multi-version records are rejected before occurrence emission.

## Bulk acquisition contract

A production executor must acquire two official bulk surfaces outside GitHub Actions:

1. the S3 source manifest plus selected `src/arXiv_src_*.tar` chunks from the requester-pays `arxiv` bucket;
2. a bulk OAI-PMH `arXivRaw` metadata harvest, following resumption tokens and arXiv's harvesting policy.

The source chunks are verified against the official manifest and then SHA-256 inventoried locally. The exact OAI XML used for rights/version decisions receives an independent deterministic SHA-256 inventory. The resulting snapshot identity is:

`arxiv-single-version:src-inventory-sha256:<src-digest>:oai-inventory-sha256:<oai-digest>`

Dates, local paths and download time are metadata only; they are not snapshot identity. A changed source or metadata inventory creates a new immutable snapshot and, if published, a new Internet Archive item.

## Extraction semantics

`scripts/science-equations/extract-arxiv-oai-metadata.py` converts bulk `arXivRaw` XML into transient JSONL carrying arXiv ID, OAI identifier, title, categories, observed license URL and complete version-count/history fields needed by the gate.

`scripts/science-equations/harvest-arxiv-tex.py` consumes verified source packages plus that transient metadata. It extracts explicit TeX math from:

- `$...$` and `$$...$$`;
- `\\(...\\)` and `\\[...\\]`;
- `equation`, `align`, `gather`, `multline`, `eqnarray`, `displaymath`, and `math` environments, including starred variants where applicable.

For every occurrence it preserves the exact source math body as `expression_original`, the exact matched delimiter/environment as attested payload, article/version identity, source file, source package, categories, title, OAI identifier, observed license, nearby TeX context and hashes.

TeX comments plus `verbatim`, `lstlisting`, `minted` and `\\verb` regions are masked from mathematical extraction. The extracted stage performs **no macro expansion, OCR, prose-to-math reconstruction, algebraic equivalence assertion, translation or equation-family promotion**.

Every emitted occurrence is `attested`. `source_record_sha256` depends on logical article/version/file/ordinal/expression identity, not the temporary acquisition root.

## Rights and publication boundary

The harvester emits payload only when both conditions hold:

1. `version_count == 1` in `arXivRaw`;
2. the normalized license URL is CC BY, CC BY-SA or CC0.

For Internet Archive publication, permitted occurrence rows must additionally be partitioned by observed license class. This keeps attribution and ShareAlike obligations explicit instead of creating an opaque mixed-license object.

The Atlas does **not** republish the arXiv source TARs. It publishes only rights-permitted derived Parquet occurrence datasets and lightweight manifests, with article/version links and license preserved per row.

## Canonical equation lake

Both metadata JSONL and occurrence JSONL are interoperability streams only. The canonical persistent lake remains:

1. `extracted` Apache Parquet/Zstd preserving exact TeX and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The shared `materialize-parquet.py` contract provides schema versioning, deterministic shard names, row counts, bytes and SHA-256 per shard. Default shard size remains 250,000 rows unless measured row width/executor limits justify another deterministic policy.

No strong semantic relation is established by lexical similarity. Deduplication proceeds through source-exact, textual, syntax, algebraic, typed-renaming, dimensionless, functional/dynamical and structural-family candidate layers.

## Reproducible validation in this execution

The conversation sandbox was used only for adapter regression and did not become the corpus data plane.

Validated locally:

- both Python adapters compile with `py_compile`;
- a synthetic OAI-PMH fixture contains one single-version CC BY record, one multi-version CC BY record, and one single-version arXiv-nonexclusive record;
- the metadata adapter records version counts `1, 2, 1` respectively;
- only the single-version CC BY article reaches occurrence output;
- three attested formulas are emitted from inline, bracket-display and equation-environment TeX;
- math inside a TeX comment and `verbatim` is not emitted;
- the multi-version article and non-redistributable article are rejected by distinct metrics;
- a second regression confirms logical occurrence hashes are independent of checkout root;
- a manual outer-TAR fixture confirms the production path can read an arXiv-style TAR member containing a gzipped single-file TeX source package.

The Node regression suite for this lane passes `2/2` in the sandbox. Fixture rows are not corpus yield.

## Real corpus yield in this execution

The available Jatobá endpoint was attempted twice and timed out. The conversation sandbox has no usable outbound DNS, and official arXiv S3 source access is requester-pays and therefore also requires an appropriately credentialed external executor. Internet Archive credentials are not exposed here. Heavy acquisition was not moved to GitHub Actions.

Therefore this run records:

- external executor used for real corpus acquisition: **none available**;
- official arXiv source chunks acquired: **0**;
- real OAI-PMH metadata records harvested: **0**;
- measured single-version redistributable papers: **0** (not estimated from fixtures);
- extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifests: none;
- Internet Archive identifier: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, corpus processing, normalization, deduplication, Parquet generation or Internet Archive publication. GitHub remains code/specification/control plane only.

## External executor recipe

On an external/Jatobá/local executor with normal network, requester-pays AWS access, PyArrow and Internet Archive credentials:

1. acquire and hash the current official `src/arXiv_src_manifest.xml`;
2. select a deterministic chunk batch and download each requester-pays S3 source TAR;
3. verify each TAR against the manifest and build the deterministic SHA-256 source inventory;
4. bulk-harvest `arXivRaw` OAI-PMH metadata with resumption tokens and inventory the exact XML responses;
5. run `extract-arxiv-oai-metadata.py` to create transient version/license metadata;
6. run `harvest-arxiv-tex.py`, which fails closed on multi-version and non-allowlisted rights;
7. validate the occurrence stream against `OccurrenceV1`;
8. split permitted rows by observed license class and materialize deterministic `extracted` Parquet/Zstd shards;
9. derive non-destructive `normalized` and layered `deduplicated` Parquet datasets;
10. publish only the permitted Parquets/manifests to immutable Internet Archive identifiers with `mediatype:data`;
11. verify the remote listing, byte sizes and checksums where available;
12. commit only lightweight counts, manifests, checksums, IA identifiers/URLs, provenance and audit evidence to Git.

## New coverage

This lane exposes a terabyte-scale source-native mathematical surface spanning mathematics, physics, computer science, quantitative biology, quantitative finance, statistics, economics, electrical engineering and adjacent technical disciplines while keeping formula text attached to exact article/version provenance.

It is intentionally narrower than the entire arXiv corpus because rights correctness dominates raw recall. The eligible population must be measured by the first real OAI harvest rather than guessed in stable documentation.

## Audit debt

- execute the first real bulk metadata harvest and measure the single-version + redistributable-license population by category and license class;
- validate identifier matching against real modern and legacy S3 source-chunk member names;
- measure source-package types and rejected/non-TeX packages on real chunks;
- quantify false positives from dollar-delimited non-math source constructs and define reproducible filters without rewriting original TeX;
- preserve macro definitions as separate provenance/context artifacts before any future macro-aware normalization;
- measure source-exact and syntax duplicates across arXiv categories and against PMC/OpenStax/Wikipedia lanes;
- keep multi-version papers fail-closed unless arXiv exposes a reproducible bulk per-version license surface or another auditable source is integrated;
- promote equation families only after reproducible transformations establish the relation.
