---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate EUR-Lex legislation-in-force Data Dump Formex 4 XML as a license-filtered bulk lane for explicit attested mathematical FORMULA elements."
updated: "2026-09-24"
---

# EUR-Lex Formex bulk formula source integration — 2026-09-24

## State reconstructed from main

This run was selected only after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the source descriptors, and persisted ingestion manifests.

At selection time, `main` contains descriptors for GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, PMC/JATS, Wikidata P2534, English Wikipedia math tags, and multilingual Wikipedia math tags. `data/science-equations/manifests/` contains only the persisted OEIS manifest.

The unit of work is the **EUR-Lex legislation-in-force corpus obtained from an official bulk route**, not an individual act or formula.

## Why this source

The stable source plan explicitly calls out EUR-Lex/Cellar as a high-value legal/regulatory target once an official bulk channel, automation policy, and snapshot format have been confirmed.

That readiness condition is now satisfied for source integration:

- EUR-Lex documents that large volumes should use mass-data services such as direct CELLAR API access or Data Dump;
- Data Dump can export the legislation-in-force collection in bulk per language and supports FMX/Formex XML;
- Data Dump requires an EU Login account;
- Formex 4 explicitly defines `FORMULA` as the element used to mark up mathematical formulas and expressions, with structured children such as `EXPR`, `OP.CMP`, fractions, roots, integrals, sums and functions.

Official references:

- <https://datadump.publications.europa.eu/>
- <https://eur-lex.europa.eu/content/tools/Retrieval_machine-readable_formats.pdf>
- <https://eur-lex.europa.eu/content/help/data-reuse/webservice.html?locale=en>
- <https://eur-lex.europa.eu/content/help/data-reuse/reuse-contents-eurlex-details.html?locale=en>
- <https://op.europa.eu/documents/3938058/5910419/formex_manual_on_screen_version.html>

## Acquisition and snapshot identity

No act-by-act HTML scraping is used.

A production acquisition on an external executor must:

1. authenticate to the official Data Dump service with credentials held outside GitHub Actions;
2. create or select a completed FMX/Formex export for exactly one language/export generation;
3. download its ZIP/XML objects outside the Git working tree;
4. retain provider request/export metadata as acquisition evidence;
5. run `scripts/science-equations/build-source-inventory.py` over the exact downloaded objects;
6. record byte size and SHA-256 for every object and compute the deterministic sorted inventory digest;
7. use `inventory-sha256:<digest>` as `source_snapshot`.

A provider request id, update date or wall-clock date is metadata, not the snapshot identity. A changed corpus must produce a new inventory digest and later a new immutable Internet Archive item rather than silently replacing a published snapshot.

## Extraction semantics

`scripts/science-equations/harvest-eurlex-formex.py` consumes XML/Formex files directly or XML/Formex members inside ZIP packages. For every explicit `FORMULA` element it preserves:

- the lexical `FORMULA` subtree as `expression_original`;
- Formex attributes such as `TYPE=INLINE|OUTLINE`;
- the ordered child-element vocabulary present in the formula;
- CELEX identifiers when present;
- document language and title when present;
- a stable EUR-Lex CELEX link;
- source object name and whole-document SHA-256;
- formula index and nearby legal context;
- a structural ancestor path.

The adapter parses the XML and independently captures lexical `FORMULA` spans. Parsed and raw formula counts must agree; mismatch rejects the document instead of silently substituting regenerated XML.

Every emitted occurrence is `attested`. This stage performs **no OCR, prose-to-math reconstruction, normalization, algebraic equivalence assertion, or family promotion**.

`NO.CELEX` is used when available for logical document identity. If it is absent, the adapter falls back to the document SHA-256 rather than inventing an identifier. Physical package/filename is preserved as provenance but is intentionally excluded from `source_record_sha256`, so repackaging identical source bytes does not create a false new logical record.

## Rights and publication boundary

EUR-Lex permits reuse subject to copyright conditions, and Publications Office material can contain third-party content. This lane is therefore `license-filtered`, not blanket `harvest-ready` for redistribution.

The Atlas must:

- preserve CELEX/document attribution and observed rights metadata;
- never mirror raw Data Dump packages merely because they are downloadable;
- publish derived occurrence Parquets only after the applicable rights gate passes;
- fall back to checksums, source identifiers, provenance and index metadata when redistribution of a payload is not sufficiently supported.

The publication decision is separate from extraction. Records can be indexed/audited without asserting a broader redistribution right.

## Canonical equation lake

JSONL from the adapter is transient transport only. The canonical lake remains:

1. `extracted` Apache Parquet/Zstd preserving lexical Formex and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

Default shard sizing is 250,000 rows unless measured row width or executor constraints justify another deterministic policy. Every manifest must include schema version, total rows, shard row counts, byte sizes and SHA-256 checksums.

Permitted Parquets and manifests are published from the external executor with `scripts/science-equations/publish-internet-archive.py` to an immutable source+snapshot+stage identifier and verified after upload.

## Reproducible validation in this execution

The adapter was exercised in the conversation sandbox with a synthetic Formex fixture:

- 1 XML document parsed;
- 3 explicit `FORMULA` elements seen;
- 2 attested occurrences emitted;
- 1 empty `FORMULA` rejected;
- 1 `INLINE` and 1 `OUTLINE` formula emitted;
- lexical XML preservation verified, including entity spelling;
- CELEX/document URL provenance verified;
- source-record identity verified to remain stable across different physical filenames;
- ZIP-member ingestion smoke-tested;
- OCR performed: 0;
- reconstructions: 0.

`python` syntax execution and the Node regression suite for this lane passed locally (`2/2`). Fixture results are control-plane validation only and are not corpus yield.

## Real corpus yield in this execution

The official Data Dump requires EU Login authentication, and the available Jatobá endpoint timed out during this run. The conversation sandbox also lacks PyArrow and Internet Archive credentials. No credential was moved into GitHub or GitHub Actions.

Therefore:

- external data executor used for real acquisition: none available;
- real Data Dump snapshot acquired: none;
- Internet Archive identifier: none;
- extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifest: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, corpus processing, normalization, deduplication, Parquet generation, or Internet Archive publication.

## External executor recipe

On an external/Jatobá/local executor with EU Login access, normal network, PyArrow and Internet Archive credentials:

1. obtain one completed legislation-in-force FMX Data Dump for one language;
2. keep the downloaded archive outside Git and record the provider request/export metadata;
3. build and verify the deterministic SHA-256 inventory;
4. invoke `harvest-eurlex-formex.py --input <download> --snapshot inventory-sha256:<digest> --language <LANG>`;
5. stream transient JSONL through the `OccurrenceV1` validator/materializer;
6. write deterministic `extracted` Parquet/Zstd shards;
7. derive non-destructive `normalized` and layered `deduplicated` Parquet datasets;
8. run the per-record/document rights gate before publication;
9. publish only permitted Parquets/manifests to a new immutable Internet Archive identifier;
10. verify remote listing, byte sizes and checksums where available;
11. commit only lightweight manifests, counts, checksums, IA identifiers/URLs, provenance and audit evidence.

## New coverage

This lane adds structured quantitative law and regulation from EU legislation in a source-native mathematical representation. It can expose tariff calculations, thresholds, technical limits, economic/environmental models and other formulas actually printed in legal acts without representing a reconstructed rule as original notation.

## Deduplication and family work

The extracted Formex tree provides useful syntax-aware signals (`EXPR`, comparison operators, fractions, roots, integrals, sums, functions), but those structures are only inputs to later normalization.

Deduplication must remain layered: source-exact, lexical/textual, syntax-aware, algebraic, typed-renaming, dimensional, functional/dynamic and structural-family candidates. No strong relation or `equation-family` edge is created merely because two Formex trees look similar.

## Audit debt

- obtain the first authenticated Data Dump snapshot and measure actual `FORMULA` prevalence;
- audit the provider metadata/rights surface retained by real Data Dump packages;
- decide whether fragment files (`.frg`) need package-level reconstruction before they can be linked reliably to CELEX documents;
- measure XML document sizes before fixing production concurrency/shard tuning;
- add explicit normalized Formex AST representation without destroying lexical XML;
- quantify duplicate rates within languages and across language editions of the same CELEX act;
- promote families only after reproducible transformations exist.
