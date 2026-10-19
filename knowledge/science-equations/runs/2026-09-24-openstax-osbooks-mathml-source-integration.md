---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate the official OpenStax osbooks Git repository family as a license-filtered corpus lane for explicit attested MathML in CNXML textbook modules."
updated: "2026-09-24"
---

# OpenStax osbooks CNXML MathML source integration — 2026-09-24

## State reconstructed from main

This run was selected only after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the source descriptors, and persisted ingestion manifests.

At selection time, `main` contains ten source descriptors: EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, PMC/JATS, Wikidata P2534, English Wikipedia math tags, and multilingual Wikipedia math tags. `data/science-equations/manifests/` contains only the persisted OEIS manifest.

The unit of work is the **official OpenStax osbooks repository family**, not one textbook chapter or one formula.

## Why this source family

The stable source plan places open textbooks and handbooks in the curation/source landscape and explicitly requires a license audit rather than assuming that "open textbook" means unrestricted bulk redistribution. OpenStax is unusually attractive because its book sources are not merely web pages or PDFs: the official OpenStax GitHub organization publishes many `osbooks-*` content repositories with CNXML modules.

Repository discovery against the official `openstax` organization exposes book repositories spanning calculus, algebra, statistics, physics, astronomy, chemistry, biology, anatomy and physiology, economics, finance, data science, computing, political science, psychology, business law, manufacturing and other domains. The repository list is discovered dynamically; it is not persisted as a transient hardcoded list in the Atlas.

The CNXML content itself contains MathML. For example, the official `openstax/osbooks-physics` repository contains `modules/*/index.cnxml`, and multiple modules contain explicit `<m:math>` elements, including display equations inside CNXML `<equation>` elements and inline mathematical expressions. Its repository `LICENSE` is Creative Commons Attribution 4.0 International. These observations validate a structured source-native extraction lane without page-by-page HTML scraping or PDF OCR.

Official surfaces used for source integration:

- <https://github.com/openstax>
- <https://api.github.com/orgs/openstax/repos>
- <https://github.com/openstax/template-osbooks>
- <https://github.com/openstax/cnxml>
- <https://github.com/openstax/osbooks-physics>

## Source discovery and admission rule

A production executor must enumerate public, non-archived repositories from the official OpenStax organization and consider names beginning with `osbooks-`.

A repository is admitted to the harvest family only when the pinned commit has a real content structure — `modules/` plus `META-INF/books.xml` or an equivalent collection spine — and an auditable content license. This structural predicate rejects playground/template/test repositories without freezing a transient repository-name blacklist in code or documentation.

Each accepted repository is a separate acquisition/materialization batch. Cross-book aggregation happens only after per-repository provenance and licensing have been preserved.

## Snapshot identity

For each repository, the external executor must:

1. resolve and pin an exact Git commit SHA;
2. acquire the repository outside the Atlas Git working tree;
3. retain the repository `LICENSE` and its SHA-256;
4. run `scripts/science-equations/build-source-inventory.py` over the exact acquired content objects;
5. record byte size and SHA-256 for every inventoried object;
6. compute the deterministic sorted inventory digest;
7. use `openstax:<owner-repo>:git:<commit>:inventory-sha256:<digest>` as `source_snapshot`.

Branch names, clone time and wall-clock date are metadata, not snapshot identity. Any changed commit or byte inventory produces a new snapshot and, if published, a new immutable Internet Archive item rather than silently replacing prior data.

## Extraction semantics

`scripts/science-equations/harvest-openstax-cnxml.py` recursively consumes CNXML modules from one acquired repository.

For every explicit MathML `math` element it preserves:

- exact lexical MathML as `expression_original`;
- `MathML-in-CNXML` as the original encoding;
- OpenStax repository and exact commit;
- logical module content-id and module title;
- repository-relative source path and stable GitHub blob URL;
- whole-document SHA-256;
- formula index within the module;
- display metadata when present;
- nearby text context;
- expression and logical-record SHA-256 values.

The adapter independently counts MathML using the XML parser and a lexical scanner. A count mismatch rejects the document instead of silently replacing the source notation with regenerated XML.

Every occurrence in this lane is `attested`. The extracted stage performs **no OCR, prose-to-math reconstruction, macro invention, algebraic equivalence assertion, translation, or family promotion**.

`source_record_sha256` depends on repository, exact commit, logical module id, formula index and exact expression hash, not the local checkout directory. Moving the checkout therefore does not manufacture a new logical occurrence.

## Rights and publication boundary

Licensing is evaluated per repository/snapshot. The OpenStax Physics repository sampled during source validation carries Creative Commons Attribution 4.0 International, but the Atlas does not extrapolate that license to every `osbooks-*` repository.

For every batch the external executor must read and hash the repository `LICENSE`, preserve its observed license on every occurrence, and apply the corresponding attribution, ShareAlike and/or NonCommercial obligations when applicable. Missing, ambiguous or content-exception-bearing rights fail closed for payload publication.

A repository can therefore remain useful for indexing/provenance even when a particular payload cannot be redistributed. The Atlas must not upload ambiguous source bytes or derived expression payloads to the Internet Archive merely because the source repository is public.

## Canonical equation lake

JSONL emitted by the adapter is transient interoperability transport only. The persistent lake remains:

1. `extracted` Apache Parquet/Zstd with exact MathML and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

Default shard sizing is 250,000 rows unless measured row width or executor limits justify another deterministic policy. Every materialization manifest must record schema version, total rows, row counts per shard, bytes, statistics and SHA-256 per shard.

Permitted Parquets and lightweight manifests are published from an external executor with `scripts/science-equations/publish-internet-archive.py` under immutable source+snapshot+stage identifiers and verified after upload by remote metadata/listing, byte size and checksum where available.

## Reproducible source validation in this execution

Source integration was validated against the official GitHub repositories without treating those validation reads as corpus ingestion:

- official OpenStax repository discovery exposes many `osbooks-*` repositories across quantitative and non-quantitative domains;
- `openstax/osbooks-physics` contains real CNXML modules under `modules/`;
- code search over that repository finds explicit `<m:math>` MathML, including display equations and inline formulas;
- `openstax/osbooks-physics/LICENSE` identifies Creative Commons Attribution 4.0 International;
- a synthetic CNXML regression contains two explicit MathML expressions and asserts exact lexical preservation, module provenance, stable blob URL, zero OCR and zero reconstruction;
- a second regression asserts logical occurrence hashes are independent of the temporary checkout root.

These controls prove the adapter contract; fixture rows are not corpus yield.

## Real corpus yield in this execution

The available Jatobá endpoint timed out during this run. The conversation sandbox has no usable outbound DNS path for cloning the source family and therefore could not serve as a real bulk data executor. No acquisition was moved into GitHub Actions.

Therefore:

- external data executor used for real acquisition: none available;
- real OpenStax repository snapshot acquired: none;
- Internet Archive identifier: none;
- extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifest: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, corpus processing, normalization, deduplication, Parquet generation, or Internet Archive publication. GitHub remains code/specification/control plane only.

## External executor recipe

On an external/Jatobá/local executor with normal network, PyArrow and Internet Archive credentials:

1. enumerate the official OpenStax organization repositories and apply the structural osbooks admission predicate;
2. for each admitted repository, resolve an exact commit and inspect/hash its `LICENSE`;
3. clone/archive that exact commit outside Git and build the deterministic SHA-256 content inventory;
4. run `harvest-openstax-cnxml.py` for that one repository/snapshot;
5. stream transient JSONL through the shared occurrence validator/materializer;
6. write deterministic `extracted` Parquet/Zstd shards;
7. derive non-destructive `normalized` and layered `deduplicated` Parquet datasets;
8. run the repository/content rights gate before publication;
9. publish only permitted Parquets/manifests to a new immutable Internet Archive identifier;
10. verify the remote listing, byte sizes and checksums where available;
11. commit only lightweight manifests, counts, checksums, IA identifiers/URLs, provenance and audit evidence to the Atlas repository;
12. repeat repository-by-repository rather than creating millions of tiny files or one untraceable cross-license blob.

## New coverage

This source family provides source-native mathematical notation embedded in educational context across many fields. It is especially useful for connecting formula occurrences to explanatory prose, variable meanings, worked examples and domain labels while retaining a structured MathML representation.

It also creates a deliberately cross-domain surface: the same acquisition machinery can cover mathematics, physics, chemistry, biology/health, economics/finance, computing/data science and quantitative material in social/professional subjects without adding a scraper per textbook.

## Deduplication and family work

MathML structure gives a better starting point than visual similarity, but no strong relation is promoted at extraction time.

Deduplication remains layered: source-exact, lexical/textual, canonicalized MathML, syntax-tree, algebraic, typed-renaming, dimensional/adimensional, functional/dynamic and structural-family candidates. Cross-edition and translated-book duplicates should be measured separately from genuinely independent occurrences.

Clustering or embeddings may propose candidates but do not establish an `equation-family` relation without a reproducible transformation or adequate formal argument.

## Audit debt

- run the first real external batch and measure MathML occurrence density per book/domain;
- quantify single-symbol/trivial-inline MathML and decide a semantic-relevance filter without discarding valid compact formulas;
- audit licenses across the dynamically discovered osbooks family and persist rights decisions per snapshot;
- extract collection/book spine metadata for stronger chapter/section/domain classification;
- normalize Presentation MathML non-destructively while keeping exact lexical MathML;
- measure duplicates across bundle/source variants, editions and translations;
- test whether worked-example contexts should be retained as separate lightweight context artifacts rather than enlarged occurrence rows;
- promote equation families only after reproducible transformations are available.
