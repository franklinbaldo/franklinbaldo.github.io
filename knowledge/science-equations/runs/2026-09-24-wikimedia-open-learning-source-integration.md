---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate production Wikibooks and Wikiversity language editions as a bulk source family for explicit attested MediaWiki Math tags."
updated: "2026-09-24"
---

# Wikimedia open-learning Math source integration — 2026-09-24

## State reconstructed from main

This run was selected only after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, all persisted source descriptors, and the ingestion manifests.

Selection-time `main` was `cb88a7f22756a4b79631aa5d57b0e46714a10252`. It contained thirteen source descriptors: BioModels/SBML, EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, OpenStax osbooks MathML, PMC/JATS, Stack Exchange data-dump TeX, Wikidata P2534, English Wikipedia math tags, and multilingual Wikipedia math tags. `data/science-equations/manifests/` contained one persisted ingestion manifest, for OEIS.

The unit of work here is the **production Wikibooks + Wikiversity corpus family**, not an individual book, course, page, or equation.

## Why this source family

The Atlas already has a generic MediaWiki Math-tag harvester and official Wikimedia `mediawiki_content_current` support for Wikipedia. The highest-yield extension is therefore to reuse the same exact-attestation semantics over Wikimedia's open-learning projects rather than invent another scraper.

The official MediaWiki Content File Exports publish the unparsed current content of public Wikimedia wikis as per-wiki compressed XML, monthly, with `SHA256SUMS` appearing only after a wiki export is complete. The official WikiId mapping exposes `wiki_id`, hostname, language and sitename. That mapping includes production Wikibooks and Wikiversity editions such as `enwikibooks`, `ptwikibooks`, `enwikiversity`, `ptwikiversity` and many other languages.

Stable source surfaces:

- <https://wikitech.wikimedia.org/wiki/MediaWiki_Content_File_Exports>
- <https://wikitech.wikimedia.org/wiki/MediaWiki_Content_File_Exports/WikiId_Mappings>
- <https://www.mediawiki.org/wiki/Extension:Math>
- <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use>

The source selector is intentionally rule-based rather than a transient hardcoded list: production wikis are selected from the official mapping when their hostname ends in `.wikibooks.org` or `.wikiversity.org`; `betawikiversity` is excluded because it is an incubation/coordination surface rather than a production language-edition learning corpus.

## Acquisition contract

For each selected `wiki_id`, the external data plane must:

1. select one `mediawiki_content_current` generation;
2. require that generation's official `SHA256SUMS` to exist before acquisition;
3. download every listed XML.bz2 object outside the Git worktree;
4. verify the official SHA-256 checksums;
5. build a deterministic sorted local content inventory using `scripts/science-equations/build-source-inventory.py`;
6. use `wikimedia-content-current:<wiki_id>:inventory-sha256:<digest>` as `source_snapshot`;
7. process one wiki and one completed generation per equation-lake batch.

A changed generation, file set or byte inventory creates a new immutable snapshot and Internet Archive item. Published snapshots are never silently overwritten.

## Extraction semantics

The existing `scripts/science-equations/harvest-wikipedia-math.py` adapter is intentionally source-configurable and is reused without forking extraction logic. For this lane it is invoked with:

- `--source-id wikimedia-open-learning-math-tags`;
- exact `--wiki-id` and language from the official mapping;
- `--wiki-base https://<hostname>`;
- the content-addressed source snapshot.

Every accepted `<math>...</math>` body is `attested`. The adapter preserves:

- exact Math-tag body as `expression_original`;
- raw matched tag and attributes;
- wiki id and language;
- page title/id and namespace;
- revision id, timestamp and source SHA-1 when available;
- stable revision URL;
- context text;
- occurrence and expression hashes.

Math inside comments, `nowiki`, `pre`, `source`, `syntaxhighlight` and `code` regions is excluded from this lane. Empty math tags are rejected. Parser-function constructions such as `{{#tag:math|...}}` remain explicit audit debt for a parser-aware lane. No OCR, translation, macro reconstruction or prose-to-math reconstruction is performed at `extracted` stage.

`wiki_id` participates in logical identity, so the same page/revision numeric ids appearing in two projects cannot collide.

## Rights and redistribution

Wikimedia's Terms of Use license contributor-owned text under CC BY-SA 4.0 and GFDL unless a Project edition or feature prescribes another license. Imported text must be compatible and can carry additional attribution obligations.

The Atlas therefore preserves page/revision links and project identity on every occurrence, does not mirror Wikimedia XML export objects into its Internet Archive items, and publishes only permitted derived Parquets/manifests with applicable attribution/share-alike metadata. A page/project with an explicit incompatible or unresolved rights exception fails closed for publication.

## Canonical equation lake

JSONL emitted by the adapter is transient transport only. Persistent bulk artifacts remain:

1. `extracted` Apache Parquet/Zstd preserving exact expression and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The common materializer defaults to 250,000 rows per shard and produces deterministic manifests with schema version, row counts, statistics, bytes and SHA-256 per shard. Deduplication remains layered: source-exact, textual, syntactic, algebraic, typed renaming, nondimensionalization, functional/dynamic equivalence and structural family are not collapsed into a single relation.

Internet Archive publication must occur only from an external executor with `scripts/science-equations/publish-internet-archive.py`, using immutable source+wiki+snapshot+stage identifiers and post-upload verification of listing, size and checksum when exposed.

## Reproducible validation added in this run

`src/data/science-equations-wikimedia-open-learning.test.js` exercises the existing generic MediaWiki adapter against synthetic Wikibooks and Wikiversity XML exports. It verifies:

- explicit Math tags remain `attested`;
- exact TeX bodies are preserved;
- literal/code regions are excluded;
- Wikibooks and Wikiversity page/revision ids resolve to the correct host;
- the same numeric page/revision ids in two projects produce distinct `source_record_sha256` identities;
- no reconstructed payload is claimed.

These fixture rows are validation only and are not counted as corpus yield.

## Data-plane execution in this run

The run attempted the available Jatobá external compute fabric before falling back to repository-only integration work. Jatobá returned a connection timeout. The local sandbox also lacked outbound DNS and did not have `pyarrow` or the Internet Archive CLI/credentials available. No GitHub Action was used for acquisition, corpus processing, Parquet generation or Internet Archive publication.

Real yield for this execution:

- source families integrated: `1`;
- newly addressable project families: `2` (Wikibooks, Wikiversity);
- real source objects acquired: `0`;
- real expressions extracted: `0`;
- real normalized rows: `0`;
- real deduplicated rows: `0`;
- rejected real source objects: `0` because acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: `none`;
- Internet Archive uploads: `0`;
- candidate equation families proposed: `0`;
- verified equation families: `0`.

## New coverage

This lane adds a broad open-learning surface that complements OpenStax rather than duplicating its acquisition model. It can contribute textbook/course mathematics across mathematics, statistics, physics, chemistry, engineering, computing, economics, medicine/health, social sciences and other quantitative subjects represented in Wikibooks/Wikiversity, across many languages.

Cross-source duplicates with Wikipedia, OpenStax and later textbook corpora are expected and should be handled by the equation lake's layered deduplication while preserving each source occurrence.

## Audit debt

- run the first real external batch and measure expression density by project family, language and page namespace;
- quantify trivial/single-symbol inline Math tags before adding any semantic relevance filter;
- audit project-edition licensing exceptions and imported-text attribution requirements at publication time;
- evaluate `{{#tag:math|...}}` and other parser-generated math in a separate parser-aware lane;
- measure cross-source exact/textual duplicates against Wikipedia and OpenStax;
- run `okf-parser graph` in an executor where the compatible parser binary is available, in addition to the normative bundle check.

## Next data-plane action

When an external executor is available, choose a completed production Wikibooks or Wikiversity export from the official mapping, verify its complete `SHA256SUMS`, build the content inventory, harvest every explicit Math tag, materialize `extracted`/`normalized`/`deduplicated` Parquets, apply the rights gate, publish permitted shards/manifests to a new immutable Internet Archive item, verify the remote objects, and commit only the resulting lightweight manifest/checksums/identifier back to Git.
