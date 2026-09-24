---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate EUR-Lex official Data Dump / Formex 4 XML as a European legal-regulatory lane for explicit attested FORMULA structures, with content-addressed inventories, rights-gated Parquet publication, and no GitHub Actions data plane."
updated: "2026-09-24"
---

# EUR-Lex Formex bulk formula source integration — 2026-09-24

## Source selection

This run was reconstructed from contemporary `main`, `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the current source descriptors, and the persisted ingestion manifests.

At reconstruction time, `main` contains source descriptors for GovInfo/eCFR, IETF RFCXML, LMFDB number fields, OEIS, PMC/JATS, Wikidata P2534, and English Wikipedia math. The persisted ingestion-manifest directory still contains only the OEIS manifest.

The stable source plan places European/Brazilian legal corpora after confirmation of an official bulk/API channel. This execution performed that audit for EUR-Lex and selected the **official EUR-Lex Data Dump / Formex 4 corpus**, not any individual legal act or formula.

## Why this source

EUR-Lex now exposes an official Data Dump service that downloads legal acts in force (CELEX sector 3) in bulk per language. The Publications Office's current machine-readable retrieval guide states that the Data Dump can deliver the collection in FMX/Formex XML and HTML, and that Cellar provides structured machine access as an alternative. The Data Dump requires EU Login.

Formex 4 is the Publications Office XML production format. The current Formex manual explicitly defines `FORMULA` as the element for mathematical formulas and expressions and models formula structure through `EXPR`, comparison operators (`OP.CMP`), mathematical operators (`OP.MATH`), fractions, roots, integrals, sums, functions and related components. This gives the Atlas a first-class, source-native legal-math representation rather than forcing OCR or prose reconstruction.

Official references:

- Data Dump: <https://datadump.publications.europa.eu/>
- machine-readable retrieval guide: <https://eur-lex.europa.eu/content/tools/Retrieval_machine-readable_formats.pdf>
- Cellar: <https://op.europa.eu/en/web/cellar>
- Formex manual: <https://op.europa.eu/documents/3938058/5910419/formex_manual_on_screen_version.html>
- Publications Office copyright/reuse notice: <https://op.europa.eu/en/web/about-us/legal-notices/publications-office-of-the-european-union-copyright>
- Commission reuse decision 2011/833/EU: <https://eur-lex.europa.eu/eli/dec/2011/833/oj/eng>

## Snapshot identity

A Data Dump request date is metadata, not sufficient content identity. The external executor must:

1. select one completed official Data Dump request for a concrete collection and language;
2. persist the provider request/download identifier and supplied generation metadata;
3. mirror all FMX XML objects outside the Git worktree;
4. compute byte size and SHA-256 for every object;
5. run `scripts/science-equations/build-source-inventory.py` over the exact mirror;
6. use `inventory-sha256:<inventory_sha256>` as `source_snapshot`.

This keeps a regenerated or changed provider package from silently inheriting the same snapshot identity.

## Extraction semantics

Added `scripts/science-equations/harvest-eurlex-formex-formulas.py`.

For each explicit Formex `FORMULA` element, the adapter preserves:

- the serialized `FORMULA` subtree as `expression_original`;
- the source `TYPE` (`INLINE`/`OUTLINE`) when present;
- CELEX identifier when present;
- document language from `LG.DOC` when present;
- stable EUR-Lex CELEX URL;
- nearby XML context;
- nearest structural ancestor such as article, annex or section;
- source/expression SHA-256 identities;
- exact snapshot identity supplied by the external executor.

Every emitted occurrence is `attested`. The extracted stage performs no OCR, no prose-to-equation reconstruction, no algebraic normalization, and no equation-family claim. Empty `FORMULA` elements are rejected.

## License and redistribution boundary

EUR-Lex states that its data can be reused free of charge subject to its copyright notice. The Publications Office copyright notice also warns that publications can contain material whose reuse depends on the specific publication or third-party rights. Commission Decision 2011/833/EU authorizes reuse within its scope but excludes documents for which reuse cannot be authorised because of third-party intellectual-property rights.

Accordingly this source is `license-filtered`, not treated as an unconditional corpus-wide open licence. The external data plane may harvest and materialize a local Parquet lake for analysis, but public Internet Archive publication must apply a documented rights allowlist/audit for the selected Data Dump batch. Material with uncertain reuse remains index-only or is represented by hashes/provenance without redistributing the formula payload. Embedded third-party assets are not mirrored by default.

## Reproducible fixture validation

Before committing the integration, the conversation sandbox validated the adapter against an official-shaped Formex fixture containing:

- one CELEX identifier;
- one `LG.DOC` language;
- one `OUTLINE` formula using `EXPR`, `OP.CMP` and `OP.MATH`;
- one `INLINE` formula;
- one deliberately empty formula.

Validation results:

- `python3 -m py_compile` passed;
- Node regression passed **1/1**;
- 3 `FORMULA` elements seen;
- 2 attested occurrences emitted;
- 1 empty formula rejected;
- 1 inline + 1 outline formula counted;
- CELEX/language/context preserved;
- OCR performed: **0**;
- reconstructions: **0**.

Synthetic fixtures are test evidence only and are not counted as ingestion yield.

## Real corpus yield in this execution

The available shell/data sandbox does not have an authenticated EU Login Data Dump session, does not expose Internet Archive credentials, and does not have PyArrow installed. A real bulk request therefore was not acquired or published in this execution.

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

On a local/Jatobá executor with EU Login access to the Data Dump, PyArrow and Internet Archive credentials:

1. request one complete legislation-in-force Data Dump in FMX/Formex for a selected language;
2. persist provider request/generation metadata and download the complete package outside Git;
3. build a deterministic SHA-256 inventory and set `source_snapshot=inventory-sha256:<digest>`;
4. run `harvest-eurlex-formex-formulas.py` over the entire mirror;
5. validate the transient occurrence stream with the existing `OccurrenceV1` model;
6. materialize `extracted` Parquet/Zstd shards with `materialize-parquet.py`;
7. create non-destructive `normalized` and `deduplicated` Parquet stages with original Formex XML retained;
8. apply the documented document-rights allowlist/audit before public redistribution;
9. publish permitted Parquet shards/manifests with `publish-internet-archive.py` from the external executor;
10. verify remote metadata, file listing, sizes and checksums;
11. commit only lightweight manifests, measured counts, checksums, IA identifiers/URLs and updated run evidence to Git.

## Deduplication and families

No structural family was promoted in this integration. EUR-Lex formula occurrences feed the Atlas layered program:

1. source-exact identity;
2. textual/XML canonicalization;
3. syntax-aware Formex normalization;
4. algebraic candidate generation;
5. typed variable renaming and dimensional checks where definitions permit it;
6. functional/dynamic equivalence;
7. structural-family verification.

Clustering or embeddings may generate candidates only. A strong equation-family edge still requires a reproducible transformation or formal argument.

## New coverage

This lane adds European Union legislation/regulation using the source's own structured mathematical markup. It is particularly relevant to quantitative regulation, tariffs, trade, environmental limits, technical standards incorporated into legal acts, prudential/financial rules and other legal domains in which formulas are published directly in the Official Journal production XML.

## Audit debt

- measure actual `FORMULA` prevalence on a complete verified Data Dump batch;
- verify how consistently CELEX and `LG.DOC` occur across current Formex packages;
- build and document the first publication rights allowlist before Internet Archive upload;
- inspect image/chemical-structure conventions that are intentionally excluded from this lane;
- add syntax-aware Formex-to-neutral-AST normalization without destroying original XML;
- reconcile EU regulatory formulas against GovInfo/eCFR and specialist scientific sources using the layered deduplication protocol;
- verify equation families only after reproducible transformations exist.
