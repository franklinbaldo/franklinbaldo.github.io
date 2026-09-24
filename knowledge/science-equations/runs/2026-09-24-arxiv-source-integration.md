---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate the official arXiv requester-pays source corpus as a license-filtered TeX math lane, with deterministic source-manifest selection and fail-closed per-item redistribution."
updated: "2026-09-24"
---

# arXiv bulk source TeX integration — 2026-09-24

## Source selection

This run was reconstructed from contemporary `main`, the Scientific Equation Atlas routine/source plan, the current `knowledge/science-equations/` bundle, existing source descriptors, and ingestion manifests. The persisted source descriptors already cover Wikidata P2534, OEIS, LMFDB number fields, GovInfo/eCFR, PMC/JATS, and IETF RFCXML. The ingest-manifest directory still contains only the persisted OEIS manifest. In the canonical source queue, **arXiv** is therefore the next unintegrated high-yield corpus lane.

The unit of work is the **official arXiv bulk source corpus**, not an individual paper or formula.

## Official bulk source

- Bulk source documentation: <https://info.arxiv.org/help/bulk_data_s3.html>
- Requester-pays bucket: `s3://arxiv`
- Source prefix: `s3://arxiv/src/`
- Official source manifest: `s3://arxiv/src/arXiv_src_manifest.xml`
- OAI-PMH metadata documentation: <https://info.arxiv.org/help/oa/index.html>
- OAI-PMH base URL: <https://oaipmh.arxiv.org/oai>
- License documentation: <https://info.arxiv.org/help/license/index.html>

The arXiv source corpus is distributed as requester-pays S3 tar chunks and is updated in bulk snapshots. The new `plan-arxiv-source.py` consumes the official source manifest, preserves the chunk metadata supplied by arXiv, and produces a deterministic selection digest. No page-by-page scraping is involved.

The exact OAI-PMH metadata harvest used for article/category/license joins is separately content-addressed. A production snapshot is therefore composite: exact S3 source selection + exact OAI metadata inventory + locally verified SHA-256 for the source chunks actually downloaded. A date alone is not sufficient.

## Extraction semantics

The adapter `harvest-arxiv-source.py` operates on downloaded official source chunks and local OAI metadata. The extracted stage is deliberately non-destructive:

- accepted occurrences are `attested`;
- `expression_original` is the exact TeX source slice, including the source delimiter or environment;
- a stripped inner body is stored only as a derived normalization candidate;
- chunk, article package, TeX path, line range, arXiv id, categories, title, nearby context, hashes, and license metadata are preserved;
- TeX comments and verbatim/listing/minted blocks are skipped;
- the initial lane recognizes standard inline/display delimiters and common named math environments;
- macro expansion, symbol resolution, algebraic canonicalization, and semantic reconstruction do **not** occur in the extracted stage.

Custom macros/environments that encode mathematics but do not pass through the recognized source forms remain audit/normalization debt rather than being guessed.

## Rights and redistribution boundary

The license boundary is intentionally fail-closed. arXiv's bulk documentation states that most articles are distributed under the default arXiv license and that arXiv's right to distribute them does not itself grant third parties a blanket redistribution right. The Atlas may analyze lawfully acquired source on the external executor, but the Internet Archive equation lake publishes derived occurrence rows only when the exact article/version license is explicitly cleared.

Automatic redistribution allowlist for this lane:

- CC0 1.0;
- CC BY 4.0;
- CC BY-SA 4.0.

Default arXiv non-exclusive licensing, NC/ND variants, custom terms, missing metadata, unknown licenses, and ambiguous source-version/license-version joins are filtered or require explicit review. The original arXiv source packages themselves are **never** republished by this lane.

OAI-PMH metadata are a routing/provenance input. If the exact source-version to license-version relationship cannot be established for a production batch, publication fails closed rather than inheriting the license of a different version.

## Implementation

Added:

- `scripts/science-equations/plan-arxiv-source.py` — deterministic planner over the official source manifest;
- `scripts/science-equations/harvest-arxiv-source.py` — streaming, license-gated bulk TeX math adapter;
- `data/science-equations/sources/arxiv-source-tex.json` — persistent source contract;
- `src/data/science-equations-arxiv-source.test.js` — regression coverage for extraction, comment/verbatim exclusion, license filtering, and deterministic planning.

Accepted occurrence rows route through the shared `OccurrenceV1 -> Apache Parquet/Zstd -> deterministic shard manifest -> Internet Archive` pipeline. JSONL remains transient transport only.

## Reproducible smoke validation

A synthetic fixture modeled on the official outer-source-chunk / per-article-source-package shape was exercised locally. It is validation evidence only and is **not** ingestion yield.

Fixture result:

- source article packages seen: 2;
- article packages allowed by redistribution policy: 1;
- article packages filtered by default arXiv license: 1;
- attested math occurrences emitted: 3;
- recognized kinds: inline dollar, display bracket, equation environment;
- math-like text in a TeX comment: rejected;
- math-like text in a verbatim block: rejected;
- deterministic planner regression: repeated output byte-identical for the same manifest selection.

The two Node regression tests passed in the available sandbox. The sandbox does not contain PyArrow, so no fixture Parquet is counted as produced here.

## Real corpus yield in this execution

This executor does not expose the AWS requester-pays credentials required to acquire arXiv source chunks and does not expose Internet Archive credentials. Therefore no fixture, advertised corpus size, or manifest-reported item count is counted as real ingestion.

- source snapshot: not acquired;
- Internet Archive identifier: none;
- real source packages downloaded: **0**;
- extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifests: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, source processing, Parquet generation, or Internet Archive publication.

## External executor recipe

On a local/Jatobá/other explicitly available data executor:

1. acquire `src/arXiv_src_manifest.xml` from the official requester-pays S3 bucket;
2. run `plan-arxiv-source.py` to pin the intended full-corpus or coherent batch selection;
3. download the selected source chunks with requester-pays enabled, verify official size/MD5 metadata, and calculate local SHA-256 for every downloaded chunk;
4. harvest the matching OAI-PMH `arXiv` metadata, and `arXivRaw`/other version metadata where needed to prove exact version-license joins; persist the OAI pages outside Git and content-address the inventory with `build-source-inventory.py`;
5. calculate the composite source snapshot from the exact source selection and metadata inventory;
6. run `harvest-arxiv-source.py`, failing closed on non-allowlisted or version-ambiguous licenses;
7. validate the transient stream and materialize `extracted` Apache Parquet with the shared Pydantic/PyArrow materializer;
8. produce non-destructive `normalized` and `deduplicated` Parquet stages as those transformations are implemented, preserving the attested original;
9. publish only redistribution-cleared derived Parquets and manifests to a deterministic immutable Internet Archive item from the external executor;
10. verify remote listing, size and checksums, then commit only the lightweight publication manifest, measured counts/checksums and updated run evidence to Git.

## New coverage

This lane gives the Atlas a high-volume full-source path across mathematics, physics, computer science, quantitative biology, statistics, economics, electrical engineering, quantitative finance and other arXiv categories while preserving source TeX rather than relying on PDF OCR.

## Audit debt

- prove exact source-version/license-version matching for production batches before publication;
- extend source parsing for common custom math environments without turning heuristics into false attestation;
- preserve macro definitions and include/import context needed for later reproducible normalization while keeping the raw expression unchanged;
- quantify precision/recall of dollar-delimited extraction on heterogeneous TeX;
- decide how to represent malformed/unbalanced TeX without silently repairing the attested source;
- enforce attribution/share-alike metadata on CC BY/CC BY-SA derivatives at publication time;
- reconcile arXiv categories with Atlas taxonomies without collapsing multi-category provenance;
- run layered source-exact/textual/syntactic/algebraic deduplication against PMC, Wikidata, OEIS and other lanes;
- propose equation families only after reproducible transformations or formal arguments exist.
