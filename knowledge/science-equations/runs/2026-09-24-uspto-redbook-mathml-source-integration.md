---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate official USPTO Red Book patent grant/application bulk XML as an attested machine-readable MathML lane with image-only exclusion and fail-closed rights gating."
updated: "2026-09-24"
---

# USPTO Red Book MathML source integration — 2026-09-24

## State reconstructed from main

This run began from contemporary `main` commit `c98b9967a6429206931bfbe2d52f27791cbb498d` after reading `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the complete source-descriptor tree and the persisted ingestion manifests.

At selection time `data/science-equations/sources/` contained sixteen descriptors: BioModels/SBML, EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, Modelica MSL, OEIS, OpenStax osbooks MathML, Physiome CellML MathML, PMC/JATS, Stack Exchange data-dump TeX, Wikidata P2534, Wikimedia open-learning math, English Wikipedia math and multilingual Wikipedia math. `data/science-equations/manifests/` contained only `oeis-2026-09-23.json`.

No branch queue or remembered transient state was used to choose the work. The unit of work is the **USPTO Red Book full-text XML corpus for grants and published applications**, not an individual patent formula.

## Why USPTO Red Book

USPTO exposes weekly full-text patent-grant and published-patent-application products through the Open Data Portal. Data.gov describes both XML datasets as including mathematical expressions and points directly to the official ODP bulk-data products. Patent grants are available as a weekly full-text product from 1976 onward, while published applications are available from 2001 onward. The XML Resources surface documents current and historical Red Book DTD versions, including grant version 4.7 from July 2022 onward.

This is a high-yield complement to article, encyclopedia and executable-model lanes: patents contain source-native quantitative material across electrical/mechanical engineering, signal processing, control, computing, machine learning, communications, optics, energy, manufacturing, biotechnology, finance and other applied domains.

Official surfaces used for this source contract:

- <https://data.uspto.gov/bulkdata/datasets/ptgrxml>
- <https://data.uspto.gov/bulkdata/datasets/appxml>
- <https://www.uspto.gov/learning-and-resources/xml-resources>
- <https://catalog.data.gov/dataset/patent-grant-full-text-1976-present>
- <https://catalog.data.gov/dataset/patent-application-full-text-2001-present>
- <https://www.uspto.gov/terms-use-uspto-websites>

## Source semantics

Red Book XML uses `maths` complex-work-unit containers that may contain machine-readable MathML, a fallback image, or an image-only representation. `scripts/science-equations/harvest-uspto-redbook-mathml.py` deliberately admits only the machine-readable MathML case.

For every accepted occurrence the adapter preserves:

- the exact lexical MathML `<math>` substring, including namespace-prefix spelling, entities and spacing;
- immutable source snapshot and official ODP release-object identity;
- SHA-256 of the acquired object and exact patent-document bytes;
- patent publication country/number/kind/date and invention title when available;
- Red Book root type, DTD version, language and source file attribute;
- `maths` ordinal/id/number, whether a fallback image is also present, and nearby text context;
- object-level rights status plus a document-level fail-closed rights signal;
- explicit declaration that OCR and reconstruction did not occur.

Every emitted expression is `attested`. An image-only `maths` container is counted as a rejection from this machine-readable lane and never sent to OCR here. The adapter does not infer formulas from prose, claims, drawings or numeric text, and it does not assert algebraic/functional/dynamic/family equivalence during extraction.

## Streaming and scale behavior

Weekly Red Book files can contain many concatenated patent XML documents. The adapter therefore reads each acquired XML member incrementally in 1 MiB chunks, splits grant/application roots, and processes one patent document at a time rather than loading a weekly corpus into memory. ZIP containers are opened member-by-member and only XML members are considered.

The resulting transport is JSONL to stdout solely for pipeline interoperability. It is not a canonical persistence format.

## Snapshot and acquisition contract

A real batch is content-addressed rather than date-addressed:

1. enumerate selected official ODP full-text XML release objects for patent grants and/or applications;
2. acquire them on an external authenticated executor, never in GitHub Actions;
3. record official object name, product and release date;
4. SHA-256 every exact downloaded object and record byte size;
5. sort those inventory entries deterministically and hash their canonical JSON representation;
6. use `uspto-redbook:inventory-sha256:<digest>` as `source_snapshot`;
7. reject execution if the CLI snapshot does not match the acquired bytes.

Authenticated or expiring ODP download URLs are transport metadata only and never define identity. A changed release-object set or changed bytes necessarily produces a new immutable snapshot and publication item.

## Rights and redistribution

The Data.gov metadata for both full-text datasets carries Creative Commons Public Domain Mark 1.0. USPTO also states that patent text and drawings are typically not subject to copyright restrictions, while explicitly noting limited copyright and mask-work exceptions under the patent rules.

The lane is consequently `license-filtered`, not globally unconditional. Each acquired object has `redistributable`, `unverified` or `restricted` status in the lightweight acquisition manifest. A redistributable object must carry explicit license/evidence metadata. In addition, the adapter fails closed at document level if it detects an explicit copyright/all-rights-reserved or mask-work notice: that patent's rows remain available to local analysis but receive `redistribution_allowed=false` until audited.

Raw USPTO bulk objects are not mirrored into the Atlas item. Only rights-approved derived Parquet shards are eligible for Internet Archive publication.

## Canonical equation lake

The persistent pipeline remains:

1. `extracted` Apache Parquet/Zstd preserving exact MathML and full provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The shared materializer remains responsible for schema versioning, one-source/one-snapshot invariants, deterministic default shards of 250,000 rows, exact row/byte counts and SHA-256 per shard. Deduplication remains layered rather than collapsing source-exact, textual, syntactic, algebraic, typed-renaming, nondimensional, functional/dynamic or structural-family relationships into one field.

Only rows with `redistribution_allowed == true` may cross the Internet Archive publication gate, using an immutable identifier derived from this source and inventory digest, followed by remote metadata/listing, size and checksum verification where exposed.

## Reproducible validation in this execution

The adapter was exercised in the available sandbox, outside GitHub Actions:

- Python syntax compilation passed;
- the dedicated Node regression suite passed `2/2`;
- a synthetic ZIP containing concatenated grant and application XML yielded two exact machine-readable MathML occurrences from three `maths` containers;
- one image-only equation container was rejected without OCR;
- a grant MathML occurrence with a fallback equation image remained machine-readable and was admitted;
- a patent document containing an explicit copyright/all-rights-reserved notice failed closed for redistribution;
- the same exact acquired ZIP under different local filenames/directories produced the same inventory snapshot and logical occurrence hashes;
- OCR count was zero and reconstruction count was zero.

Fixture rows are validation only and are not reported as corpus yield.

## Real corpus yield in this execution

A full ODP acquisition/materialization did not run. The USPTO Open Data Portal now requires registered USPTO.gov access, and the connected Jatobá compute fabric timed out in this execution. No authenticated external data-plane executor was available from this session. Moving corpus acquisition, extraction, Parquet materialization or Internet Archive upload into GitHub Actions would violate the Atlas policy and was not done.

Measured real-corpus results are therefore:

- external acquisition executor used: none available;
- official ODP release objects acquired: `0`;
- real patent documents processed: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

## Coverage gained

This lane adds a very large source-native surface of applied quantitative knowledge that is underrepresented by journal-centric collection: equations embedded directly in inventions and engineering disclosures, including algorithms, constraints, control relations, signal-processing formulas, physical models, statistical objectives and other formal quantitative content.

It also creates valuable future reconciliation surfaces with PMC/JATS, Wikipedia, OpenStax, Modelica, BioModels and standards: a patent can independently attest a formal relation already known elsewhere without that cross-source match being promoted to an equation family until a reproducible transformation verifies it.

## Audit debt

- Run the first authenticated ODP weekly grant/application acquisition on an external executor and persist its lightweight object inventory and measured counts.
- Measure machine-readable MathML density versus image-only equation density by Red Book DTD vintage and product.
- Audit the document-level copyright/mask-work detector against real exception notices and record false-positive/false-negative controls before large-scale republication.
- Quantify duplicate formulas between published applications and later grants using source-exact/textual/syntactic layers before stronger equivalence.
- Decide whether pre-Red-Book SGML/APS eras deserve a separate source adapter rather than being coerced into this lane.
- Inspect `okf-parser graph` on a compatible executor if the connected parser remains unavailable.

## Next data-plane action

On an external executor with authenticated ODP access, sufficient disk, PyArrow and Internet Archive credentials:

```text
ODP weekly grant/application full-text XML release objects
→ exact object size + SHA-256 inventory
→ uspto-redbook:inventory-sha256 snapshot
→ streaming patent-document split
→ attested lexical MathML harvest; image-only math skipped
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ rights-filtered immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight manifests + measured counts back to Git
```
