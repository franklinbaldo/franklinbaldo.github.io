---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate English Wikipedia official XML dumps as a broad cross-domain lane for explicit attested MediaWiki math tags, with content-addressed dump inventories and Parquet/Internet Archive publication outside GitHub Actions."
updated: "2026-09-24"
---

# English Wikipedia bulk math source integration — 2026-09-24

## Source selection

This run was reconstructed from contemporary `main`, `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the current source descriptors, and the persisted ingestion manifests.

At reconstruction time, `main` contains integrated source descriptors for Wikidata P2534, OEIS, LMFDB number fields, PMC JATS, IETF RFCXML, and GovInfo/eCFR. The persisted ingestion-manifest directory still contains only the OEIS manifest. English Wikipedia is not represented as a current source descriptor on `main`.

The unit of work is therefore the **official English Wikipedia XML article dump**, not a manually selected formula or page.

## Why this source

Wikipedia is unusually useful for the Atlas because one structured corpus crosses mathematics, natural science, engineering, medicine, computing, economics, social science, law, regulation, and many other quantitative domains. MediaWiki's Math extension stores formulas explicitly in `<math>...</math>` tags whose bodies are TeX-like source. This creates a high-yield `attested` lane with substantially broader topical coverage than a specialist database.

The official Wikimedia dump service publishes current-revision page XML and split/multistream variants. The Atlas adapter targets the official pages-articles XML surface and does not scrape article HTML page by page.

Official references:

- dump root: <https://dumps.wikimedia.org/enwiki/>
- dump format/catalog: <https://meta.wikimedia.org/wiki/Data_dumps/What%27s_available_for_download>
- Math extension: <https://www.mediawiki.org/wiki/Extension:Math>
- Wikimedia terms/licensing: <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use>

## Snapshot identity

A dump date is useful metadata but is not sufficient as the Atlas content identity. The external executor must:

1. select one completed official enwiki dump generation;
2. persist the machine-readable dump status metadata;
3. download the complete selected pages-articles-multistream surface;
4. verify downloaded parts against Wikimedia's published MD5/SHA-1 checksums;
5. run `scripts/science-equations/build-source-inventory.py` over the exact local parts;
6. use `dump-inventory-sha256:<inventory_sha256>` as `source_snapshot`.

This makes the snapshot identity dependent on the exact corpus bytes rather than a wall-clock label.

## Extraction semantics

Added `scripts/science-equations/harvest-wikipedia-math.py`.

The adapter streams MediaWiki XML with the Python standard library and accepts plain XML, gzip, bzip2, or a directory of dump parts. The default lane is namespace 0 (articles). For every explicit rendered `<math>...</math>` tag it preserves:

- exact body as `expression_original`;
- the raw matched tag and attributes;
- page title and page id;
- revision id, timestamp, and revision SHA-1 when present;
- stable `oldid` URL for attribution and audit;
- nearby revision-wikitext context;
- exact and whitespace-normalized expression hashes;
- source snapshot and dump-part provenance.

Every emitted occurrence is `attested`. The extracted stage performs no OCR, no algebraic reconstruction, no macro interpretation, and no equivalence claim.

The adapter deliberately excludes math-looking strings inside HTML comments and literal/no-render regions (`nowiki`, `pre`, `source`, `syntaxhighlight`, and `code`), ignores redirects by default, rejects empty math tags, and defaults to the article namespace. `{{#tag:math|...}}` parser-function forms are explicitly outside this adapter rather than being approximated with a fragile regex.

`source_record_sha256` is keyed by logical page/revision/math occurrence and exact body, not by the physical dump-part path, so repackaging the same revision into different dump files does not create a false new occurrence identity.

## License and redistribution boundary

Wikimedia's current terms state that text contributed by rights-holders is licensed under CC BY-SA 4.0 and GFDL, while imported text can be available under compatible terms with additional attribution requirements. The lane therefore preserves page/revision attribution on every row and records the imported-text caveat instead of flattening all source text into an unconditional single-license claim.

The Atlas does not need to mirror the raw Wikipedia dump into its Internet Archive item. The publication unit is the derived occurrence Parquet plus lightweight manifests/provenance, under the applicable attribution/share-alike obligations.

## Local reproducible validation

The conversation sandbox cannot clone the repository or reach Wikimedia from its shell because external DNS is unavailable, but the new adapter itself uses only the Python standard library and was validated locally with an official-shaped namespaced MediaWiki XML fixture.

Validation performed before committing the implementation:

- `python3 -m py_compile` passed;
- plain XML fixture passed;
- bzip2 fixture passed;
- article namespace math bodies were emitted as `attested`;
- a display-math attribute was preserved;
- HTML-comment and `nowiki` math were excluded;
- empty math was rejected;
- talk namespace and redirect pages were skipped by default;
- stable revision `oldid` provenance was preserved;
- logical `source_record_sha256` values remained identical when the same source XML was placed under different dump-part filenames;
- Node regression suite for this adapter passed **2/2** locally in the sandbox.

Synthetic fixtures are test evidence only and are not counted as ingestion yield.

## Real corpus yield in this execution

The available shell/data executor cannot resolve external hosts and does not expose the Internet Archive credentials. No real Wikimedia dump part was therefore acquired or materialized in this execution.

- executor used for data plane: conversation sandbox, fixture-only validation;
- source snapshot: not acquired;
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

On a local/Jatobá data executor with normal network and Internet Archive credentials:

1. inspect the official enwiki dump root and select the latest **completed** snapshot rather than guessing a date;
2. acquire the complete `pages-articles-multistream` parts outside the Git working tree;
3. verify all selected files against Wikimedia's official checksum surface;
4. build a deterministic SHA-256 inventory with `build-source-inventory.py`;
5. run `harvest-wikipedia-math.py --dump <mirror> --snapshot dump-inventory-sha256:<digest>` over all parts;
6. stream the transient JSONL into the existing `OccurrenceV1` validator/materializer;
7. produce `extracted` Parquet/Zstd shards sized for bulk operation, then non-destructive `normalized` and `deduplicated` stages;
8. publish permitted Parquet shards and deterministic manifests using `publish-internet-archive.py` from the external executor;
9. verify remote file listing, sizes and checksums;
10. commit only the lightweight publication manifest, measured counts, checksums, IA identifier/URLs, and updated run evidence to Git.

## Deduplication and families

This integration does not promote structural families. The source produces candidates for the existing layered deduplication program:

1. source-exact identity;
2. textual/whitespace canonicalization;
3. syntax-aware TeX/MathML normalization;
4. algebraic candidate generation;
5. typed variable renaming and dimensional checks;
6. functional/dynamic equivalence;
7. structural family verification.

Embedding or clustering output remains candidate evidence only. No strong family edge should be created without a reproducible transformation or equivalent formal argument.

## New coverage

This lane adds a broad cross-domain corpus rather than another specialist silo. It can supply attested expressions from the same source framework across science, mathematics, engineering, medicine, computing, economics, social sciences, law/regulation, and other quantitatively formalized topics.

## Audit debt

- measure real `<math>` prevalence and output volume on a complete verified enwiki snapshot;
- quantify false positives/negatives from explicit-tag extraction, especially parser-function `#tag:math` forms;
- audit pages with unusual imported-text attribution notices before large-scale redistribution claims;
- add parser-aware section/category/topic context without destroying raw revision provenance;
- reconcile Wikipedia occurrences against Wikidata defining formulas and specialist corpora using layered deduplication;
- build verified equation families only after reproducible transformations are available.
