---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Restack and integrate the arXiv requester-pays TeX source lane on contemporary main with a fail-closed version/license gate."
updated: "2026-09-24"
---

# arXiv bulk TeX source integration — current-main restack

## State reconstructed from main

This execution read the contemporary `main` copies of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, the `knowledge/science-equations/` bundle, source descriptors, and persisted ingestion manifests before selecting work.

Selection-time `main` is `b152fbe5b59ba0d5913b4c86b3b46802180b8328`. It contains seventeen source descriptors: BioModels/SBML, CRAN/Rd, EUR-Lex/Formex, GovInfo/eCFR, IETF RFCXML, two LMFDB lanes, Modelica MSL, OEIS, OpenStax CNXML, Physiome/CellML, PMC/JATS, Stack Exchange TeX, Wikidata P2534, Wikimedia open-learning, English Wikipedia math, and multilingual Wikipedia math. `data/science-equations/manifests/` contains only `oeis-2026-09-23.json`.

The stable source plan still ranks arXiv ahead of later software-documentation and secondary-corpus lanes. An older open arXiv implementation PR existed, so this execution restacked that source lane on contemporary `main` rather than creating a duplicate source.

## Source contract

Official acquisition is the arXiv requester-pays S3 source corpus plus OAI-PMH `arXivRaw` metadata. Source chunks are approximately 500 MB TAR objects and are enumerated by `src/arXiv_src_manifest.xml`; acquisition and all corpus processing remain outside GitHub Actions.

The extracted lane emits only explicit TeX mathematics as `attested`: dollar math, bracket/paren math, and named equation/alignment environments. Exact TeX bodies and delimiters/environments are preserved. Comments, verbatim-like environments, and `\\verb` are masked only for detection. Extraction performs no OCR, macro expansion, prose reconstruction, algebraic-equivalence claim, or family promotion.

## Rights gate

arXiv states that its default perpetual non-exclusive license does not grant third parties a redistribution right. It also states that different versions can carry different licenses. OAI-PMH exposes each article as one item, while `arXivRaw` includes version history.

The lane therefore fails closed: payload rows are emitted only when `arXivRaw` records exactly one version and its observed license is an allowlisted CC BY, CC BY-SA, or CC0 URL. Multi-version papers, arXiv-default-license papers, NC/ND variants, missing licenses, and unknown licenses are excluded from payload publication.

Raw arXiv source packages are never mirrored as Atlas artifacts. Permitted derivative Parquets must be partitioned by observed license class before Internet Archive publication so attribution and ShareAlike obligations remain explicit.

## Snapshot and equation lake

A production batch must verify each acquired S3 TAR against the official source manifest, SHA-256 inventory the exact source chunks, independently inventory the exact OAI XML used for rights/version decisions, and derive:

`arxiv-single-version:src-inventory-sha256:<src-digest>:oai-inventory-sha256:<oai-digest>`

as the immutable `source_snapshot`.

JSONL is transient adapter transport only. Persistent outputs are `extracted`, `normalized`, and `deduplicated` Apache Parquet/Zstd shards through the shared materializer, with deterministic shard names, row counts, byte counts, and SHA-256 in manifests. Git stores only code, descriptors, lightweight manifests/checksums, run evidence, and later Internet Archive identifiers.

## Validation and data-plane status

The adapters and regression fixture are part of this branch and are reproducible without corpus access. GitHub may run lint/tests/build/OKF checks only as control-plane validation; it must not acquire arXiv, process corpus payloads, generate Parquet, or publish to Internet Archive.

The external Jatobá compute endpoint timed out during this execution. A direct sandbox clone also failed because outbound DNS was unavailable. The source corpus was therefore not acquired and heavy work was not moved to GitHub Actions.

Measured real-corpus results for this execution:

- source/corpus integrated: arXiv source TeX, single-version rights-safe subset;
- official S3 chunks acquired: 0;
- OAI records harvested for production: 0;
- extracted real occurrences: 0;
- normalized real occurrences: 0;
- deduplicated real occurrences: 0;
- Parquet shards/manifests: 0;
- Internet Archive identifier: none;
- candidate/verified families: 0.

Fixture rows are not counted as ingestion yield.

## Audit debt

- run the first bounded real S3 + OAI batch on an external executor and measure eligible papers by category and license class;
- validate modern and legacy arXiv identifier matching against real source-chunk members;
- measure TeX-package types, non-TeX rejects, dollar-delimiter false positives, and macro-related false negatives;
- run the compatible `okf-parser check` and `okf-parser graph` over the restacked branch;
- materialize the three Parquet stages, partition publication by license, verify Internet Archive listing/size/checksum, then commit only the lightweight manifest and measured counts;
- keep multi-version papers fail-closed unless a reproducible bulk per-version rights surface is integrated.
