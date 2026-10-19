---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate BioModels SBML as a harvest-ready source lane for explicit attested MathML across biological and biomedical mathematical models."
updated: "2026-09-24"
---

# BioModels SBML MathML source integration — 2026-09-24

## State reconstructed from main

This run was selected after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, all persisted source descriptors, and the ingestion manifests.

At selection time `main` contains twelve source descriptors: EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, OpenStax osbooks MathML, PMC/JATS, Stack Exchange data-dump TeX, Wikidata P2534, English Wikipedia math tags, and multilingual Wikipedia math tags. `data/science-equations/manifests/` contains only the persisted OEIS manifest.

The unit of work in this run is the **BioModels SBML corpus**, not an individual model or formula.

## Why BioModels

BioModels is a structured repository of mathematical and computational models in biology and biomedicine. Its model encodings expose high-value quantitative structures through SBML, where MathML is used for reaction kinetic laws, assignment/rate/algebraic rules, initial assignments, function definitions, events, constraints and related mathematical content.

This is complementary to PMC/JATS: PMC supplies equations appearing in articles, while BioModels supplies machine-readable executable model mathematics with explicit typed model context.

Official/current surfaces used for the integration contract:

- <https://biomodels.org/>
- <https://www.biomodels.org/docs/>
- <https://www.ebi.ac.uk/biostudies/BioModels>
- <https://www.ebi.ac.uk/biostudies/BioModels/help>
- <https://www.ebi.ac.uk/biostudies/api/v1/biomodels/search>
- <https://ftp.ebi.ac.uk/biostudies/>

BioModels moved operational hosting from EMBL-EBI to the University of Florida in 2025; `biomodels.org` is the live service while EMBL-EBI retains the BioStudies archival collection. The adapter does not depend on a scraped HTML model page: an external executor discovers accessions and exact model files from those structured surfaces.

## Source semantics

`scripts/science-equations/harvest-biomodels-sbml.py` accepts one SBML file or a directory tree of verified BioModels model files. For each accepted XML document it:

1. identifies a BioModels accession (`BIOMD##########` or `MODEL##########`);
2. computes SHA-256 over the exact source document bytes;
3. parses the XML structure and independently scans exact lexical `<math>...</math>` blocks;
4. rejects the document if the XML parser and lexical scanner disagree on MathML count/order;
5. emits every non-empty explicit MathML block as `attested`;
6. preserves the exact lexical MathML substring as `expression_original`, including namespace spelling, entities and whitespace;
7. records SBML level/version, model id/name, semantic parent, target symbol, explicit target units when available, reaction/event/function identifiers and model-file checksum;
8. constructs logical occurrence identity independently of the executor's checkout directory.

The extracted lane deliberately **does not** turn reaction networks into derived ODEs. A `kineticLaw` MathML block, for example, is attested as the source's rate expression. A later equation such as a fully assembled species derivative would be a separate `reconstructed` occurrence requiring an explicit translation rule and fidelity test.

## Rights and redistribution

BioModels states that hosted models are available under CC0. This lane therefore records `CC0-1.0` for BioModels-hosted model encodings and preserves model accession/file provenance even though attribution is not a CC0 condition.

The rights gate remains fail-closed at object level: if an acquired object carries a conflicting explicit rights notice, or is an ancillary file that cannot be established as a BioModels-hosted model encoding, it must not inherit CC0 merely because it was discovered beside a model. Such objects are rejected or held for audit.

Raw acquisition objects do not belong in Git. The Atlas publishes only permitted equation-lake Parquets/manifests to the Internet Archive.

## Snapshot identity

The external executor must create an immutable content inventory rather than using a mutable API query or a calendar date as snapshot identity:

1. enumerate the official BioModels corpus through the live API or the EMBL-EBI BioStudies archival collection;
2. resolve the exact source/model files belonging to each accession;
3. record the discovery endpoint and accession/file inventory;
4. acquire source bytes outside the Git tree;
5. SHA-256 every acquired source object;
6. sort the inventory deterministically and run `scripts/science-equations/build-source-inventory.py`;
7. use `biomodels:inventory-sha256:<digest>` as `source_snapshot`.

Any changed accession set, file set or byte inventory produces a new immutable snapshot and Internet Archive item rather than silently replacing an existing publication.

## Canonical equation lake

JSONL emitted by the adapter is transient interoperability transport only. Persistent bulk data remains:

1. `extracted` Apache Parquet/Zstd preserving exact MathML and full provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The repository's common materializer validates `science-equation-occurrence-v1`, keeps exactly one source/snapshot per batch, defaults to 250,000 rows per shard, and writes deterministic manifests with rows, bytes and SHA-256 per shard. Normalization and deduplication remain layered: source-exact, textual, syntax/MathML canonicalization, algebraic, typed renaming, nondimensionalization, functional/dynamic equivalence and structural family are never collapsed into one undifferentiated equality relation.

After successful rights and quality gates, Parquets and manifests are published from an external executor with `scripts/science-equations/publish-internet-archive.py` under immutable source+snapshot+stage identifiers and are verified after upload by remote metadata/listing, byte size and checksum where exposed.

## Reproducible adapter validation in this execution

The adapter and fixture were executed in the available sandbox, outside GitHub Actions:

- Python syntax compilation passed;
- Node regression suite passed `2/2`;
- one synthetic SBML Level 3 document yielded five explicit MathML occurrences;
- the five semantic parents were assignment rule, rate rule, algebraic rule, kinetic law and event assignment;
- exact lexical MathML was preserved;
- explicit species units, reaction id and event id were retained;
- all records remained `attested`;
- OCR count was zero;
- reconstruction count was zero;
- logical occurrence hashes were stable across different temporary directory roots.

Fixture rows are test evidence only and are not counted as corpus yield.

## Real corpus yield in this execution

A real data-plane run could not be completed in this execution. The Jatobá compute endpoint returned a network connection failure, while the local sandbox cannot resolve external hosts. Moving acquisition, Parquet generation or Internet Archive publication into GitHub Actions was explicitly rejected by the Atlas operating policy.

Therefore the measured real-corpus results for this run are:

- external acquisition executor used: none available;
- BioModels source objects acquired: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

No fixture count, published repository size, reaction count, or expected corpus cardinality is reported as ingestion yield.

## Coverage gained

This integration adds a source-native lane for executable biological/biomedical model mathematics, including reaction kinetics, dynamical rules, events, constraints and other formal structures that may not appear verbatim in article prose. It also creates a strong future reconciliation surface against PMC/JATS, OpenStax and generic structural families while preserving the distinction between source-attested rate expressions and reconstructed system equations.

## Audit debt

- Run a complete or bounded real BioModels inventory on an external data-plane executor and persist the lightweight manifest/checksums.
- Sample models across SBML levels/versions and packages to measure lexical scanner compatibility and empty/unusual MathML rates.
- Audit object-level rights notices encountered in real inventories before publication.
- Run normalization/deduplication on real MathML and measure source-exact/textual/syntactic collapse separately.
- Use `okf-parser` graph inspection on the final bundle. The local sandbox did not have a usable parser installation and Jatobá was unavailable; the canonical repository OKF validation may run as a control-plane check, but that is not represented as a data-plane execution.

## Next data-plane action

On an external executor with network, PyArrow and Internet Archive credentials:

```text
official BioModels/BioStudies enumeration
→ exact accession/file inventory
→ SHA-256 + deterministic inventory digest
→ SBML MathML harvest
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ rights/quality audit
→ immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight manifest + measured counts back to Git
```
