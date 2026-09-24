---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate Stack Exchange per-site XML data dumps as a license-filtered corpus lane for explicit attested TeX/MathJax from raw question/answer body revisions."
updated: "2026-09-24"
---

# Stack Exchange data dump TeX source integration — 2026-09-24

## State reconstructed from main

This run was selected after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the source descriptors, and persisted ingestion manifests.

At selection time `main` contains eleven source descriptors: EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, OpenStax osbooks MathML, PMC/JATS, Wikidata P2534, English Wikipedia math tags, and multilingual Wikipedia math tags. `data/science-equations/manifests/` contains only the persisted OEIS manifest.

The unit of work in this run is the **Stack Exchange network dump format / per-site corpus family**, not an individual Q&A post or an individual formula.

## Why this source family

Stack Exchange exposes a high-density cross-domain surface of user-authored mathematical notation. Relevant sites include mathematics, statistics, physics, computer science, artificial intelligence, quantitative finance, economics, engineering, signal processing, operations research and other technical communities. The same dump schema applies site-by-site, allowing one adapter to scale horizontally across the network.

Current Stack Exchange documentation says the latest data dump is accessed through each site's Settings page and that a new dump is normally available every three months. The 2024 process change moved the official downloads away from the old public Internet Archive item and added authenticated access/use terms.

A community-maintained release index records a June 2026 XML dump with 364 files and about 91.77 GiB. Its linked Internet Archive item is `stackexchange_20260630_sakura`, describes itself as an unofficial community replacement, contains data through 2026-06-30, and was added to the Archive on 2026-08-18. This community item is discovery/transport evidence only: it must never be represented as the official Stack Exchange archive.

Official/current surfaces used for source integration:

- <https://stackoverflow.com/help/account>
- <https://stackoverflow.com/help/licensing>
- <https://meta.stackexchange.com/questions/401324/announcing-a-change-to-the-data-dump-process>
- <https://meta.stackexchange.com/questions/2677/database-schema-documentation-for-the-public-data-dump-and-sede>
- <https://meta.stackexchange.com/questions/224873/all-stack-exchange-data-dump-releases>
- <https://archive.org/details/stackexchange_20260630_sakura> (community mirror evidence, not official origin)

## Source semantics

The important source surface is `PostHistory.xml`, not rendered post HTML. Stack Exchange's public schema documents PostHistory types 2, 5 and 8 as Initial Body, Edit Body and Rollback Body respectively, with the raw Markdown body stored in `Text`. This is better for the Atlas than extracting from rendered HTML because explicit TeX/MathJax remains source-native and each body revision has its own creation timestamp and revision identity.

`scripts/science-equations/harvest-stackexchange-tex.py` therefore:

1. streams `PostHistory.xml`;
2. keeps only body-history types 2/5/8;
3. selects the latest body revision for every post using `CreationDate` with history id as a deterministic tiebreaker;
4. stores the working set in an on-disk SQLite scratch index so large sites do not require holding all post bodies in RAM;
5. optionally streams `Posts.xml` to enrich post type, parent, owner, title, tags and score;
6. scans raw Markdown for explicit `$...$`, `$$...$$`, `\\(...\\)` and `\\[...\\]` math;
7. masks fenced code, inline code, HTML `code`/`pre`, scripts, styles and comments for detection without changing offsets;
8. emits the exact original Markdown substring for every accepted expression.

Every emitted expression is `attested`. No OCR, prose-to-math translation, algebraic reconstruction, equivalence assertion or family promotion occurs in the extracted stage.

## Revision-level licensing

The current Stack Overflow licensing help explicitly assigns license versions by contribution/revision date:

- before 2011-04-08 UTC: CC BY-SA 2.5;
- from 2011-04-08 UTC to before 2018-05-02 UTC: CC BY-SA 3.0;
- on or after 2018-05-02 UTC: CC BY-SA 4.0.

The help page also states that the applicable license for each Question and Answer revision is available on the post timeline. Because an unrelated later title/tag edit can make `Posts.LastEditDate` newer than the actual body revision, this lane derives the Creative Commons version from the selected `PostHistory` body revision's `CreationDate`, not from post creation date or a generic last-edit timestamp.

Every occurrence retains site, post id, history id, revision GUID, revision timestamp, available owner/revision user ids, stable post revisions URL, body SHA-256, and optional tags/title metadata for attribution and audit.

## Access-rights boundary

The authenticated dump process announced in 2024 includes non-commercial/access restrictions and a promise not to transfer the downloaded dump without permission. Those access conditions are separate from the Creative Commons license attached to public user contributions and create a redistribution question for derived bulk payloads.

This lane therefore fails closed:

- raw `.7z` and XML dumps are never uploaded by the Atlas;
- the exact acquisition path and terms are recorded per snapshot;
- publication of derived equation Parquets to the Internet Archive remains blocked until a rights review for that acquisition path establishes that the intended redistribution complies with both the applicable CC BY-SA terms and dump-access terms;
- Git may still retain source descriptors, code, checksums, manifests without payload, and audit evidence.

Community mirrors may be used only as explicitly labelled byte-transport mirrors when release identity/checksum provenance is recorded. They do not erase the need for a rights decision.

## Snapshot identity

Each site is a separate batch. The external executor should:

1. pin the named quarterly release;
2. record whether bytes came from authenticated official access or a labelled mirror;
3. hash the downloaded site `.7z` with SHA-256;
4. extract `PostHistory.xml` and `Posts.xml` outside the Atlas Git tree;
5. build the deterministic SHA-256 content inventory over the exact acquired/extracted objects;
6. use `stackexchange:<site>:<release>:inventory-sha256:<digest>` as `source_snapshot`.

A different release, changed archive or changed extracted byte inventory is a new immutable snapshot and must not silently overwrite an older publication.

## Canonical equation lake

JSONL emitted by the adapter is transient interoperability transport only. Persistent mass data remains:

1. `extracted` Apache Parquet/Zstd preserving exact TeX delimiters and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

Default shard sizing is 250,000 rows unless measured row width or runner constraints justify another deterministic target. Every manifest must contain schema version, row counts, statistics, byte sizes and SHA-256 per shard.

After the rights gate is satisfied, permitted Parquets/manifests are published only from an external executor through `scripts/science-equations/publish-internet-archive.py`, under immutable source+snapshot+stage identifiers, followed by remote listing/size/checksum verification where available.

## Reproducible adapter validation in this execution

A synthetic dump fixture was executed outside GitHub Actions and verified:

- 3 body-history rows were read for 2 posts;
- the later body edit replaced the older initial body for the first post;
- 3 explicit expressions were emitted: one display expression and two inline expressions;
- TeX inside Markdown inline code and HTML `code` was not emitted;
- the 2019 body revision received CC BY-SA 4.0;
- the 2015 body revision received CC BY-SA 3.0;
- Posts.xml tags and post metadata were joined correctly;
- all records remained `attested` with zero OCR and zero reconstruction;
- logical occurrence hashes were stable across different extraction directories.

Fixture rows are test evidence, not corpus yield.

## Real corpus yield in this execution

The Jatobá endpoint timed out during this run. The available sandbox has Python but no outbound DNS, no `7z`/`7zz`, no PyArrow and no `ia` CLI. A pip attempt to obtain a 7z reader failed at DNS resolution. Moving acquisition into GitHub Actions was explicitly rejected by the Atlas operating policy.

Therefore:

- external data executor used for real acquisition: none available;
- real Stack Exchange site archive acquired: none;
- Internet Archive identifier for Atlas payload: none;
- extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifest: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, extraction, corpus processing, Parquet generation, normalization, deduplication or Internet Archive publication.

## External executor recipe

On Jatobá/local/another explicitly available external runner with normal network, 7z support, PyArrow and (only after rights approval) Internet Archive credentials:

1. choose one Stack Exchange site and one named quarterly release from current source state;
2. acquire that site's archive through the permitted bulk channel and record acquisition kind/URL/terms;
3. verify the supplied release checksum evidence when available and compute local SHA-256;
4. extract `PostHistory.xml` and `Posts.xml`;
5. build the deterministic source inventory and snapshot id;
6. run `harvest-stackexchange-tex.py` with a disk-backed SQLite scratch path sized for the site;
7. stream transient JSONL through the shared occurrence validator/materializer;
8. write deterministic `extracted` Parquet/Zstd shards;
9. derive non-destructive normalized and layered deduplicated Parquets;
10. perform the acquisition-path/Creative-Commons redistribution gate;
11. publish only permitted derived payloads to a new immutable Internet Archive item;
12. verify remote metadata/listing, size and checksum where available;
13. commit only the lightweight Atlas manifest, counts, checksums, IA identifiers/URLs, provenance and audit evidence;
14. repeat site-by-site rather than creating a single mixed-license/mixed-snapshot blob.

## New coverage

This source family opens a high-density bridge between formal notation and expert problem-solving discourse. It can cover mathematics/statistics/physics immediately and extend with the same adapter into computer science, AI, quantitative finance, economics, engineering and other Stack Exchange technical sites.

Unlike a paper corpus, posts also provide tags and question/answer relationships that can become classification signals without changing the attested mathematical payload.

## Deduplication and family work

Stack Exchange is expected to contain heavy repetition: quoted formulas, textbook identities, answers repeating question notation, cross-posts, and the same formula in many explanatory contexts. Deduplication must therefore remain layered: source-exact, textual, TeX canonicalization, syntax, algebraic, typed renaming, adimensionalization, functional/dynamic equivalence and structural family.

Question/answer proximity and tags are candidate-generation context only. No strong family relation should be asserted without a reproducible transformation or adequate formal argument.

## Audit debt

- run a real small-site batch first to measure false positives from dollar-delimited currency/text;
- validate suppression against complex nested Markdown/HTML code blocks from real dumps;
- measure expression density by site and tag before scaling to the largest sites;
- audit whether all selected latest body revisions can be attributed adequately when owner/editor user ids are missing;
- resolve the dump-access-versus-derived-redistribution rights boundary before any IA payload publication;
- evaluate revision deduplication separately from cross-post/cross-site deduplication;
- preserve site-specific MathJax macro conventions during non-destructive normalization;
- only promote equation families after reproducible transformations are available.
