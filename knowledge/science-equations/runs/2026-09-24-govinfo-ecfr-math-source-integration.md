---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate GovInfo eCFR bulk XML MATH blocks as the first high-yield legal/regulatory source lane, preserving image-backed attested equation artifacts without OCR or reconstruction."
updated: "2026-09-24"
---

# GovInfo eCFR bulk MATH source integration — 2026-09-24

## Source selection

This run was reconstructed from contemporary `main`, the Scientific Equation Atlas source plan, the current source descriptors, existing ingestion manifests, and persisted runs. Existing integrated descriptors cover Wikidata P2534, OEIS, LMFDB number fields, PMC JATS, and IETF RFCXML; GovInfo/eCFR is the first large law/regulation lane in the canonical source plan that is not yet integrated on `main`.

The unit of work is therefore the **eCFR bulk XML corpus**, not an individual regulation or formula.

## Official bulk source

- Developer hub: <https://www.govinfo.gov/developers>
- Bulk root: <https://www.govinfo.gov/bulkdata/ECFR>
- Machine-readable listing: <https://www.govinfo.gov/bulkdata/json/ECFR>
- XML user guide: <https://github.com/usgpo/bulk-data/blob/main/ECFR-XML-User-Guide.md>

GovInfo exposes a current eCFR XML file for each title and supports machine-readable XML/JSON listings for bulk traversal. The adapter therefore operates on a local bulk mirror and does not scrape individual eCFR HTML pages.

The eCFR is a mutable editorial compilation rather than the annual official CFR edition. A wall-clock date is not sufficient as snapshot identity. The generic `build-source-inventory.py` computes SHA-256 for every mirrored XML object and a deterministic digest over the sorted `(relative path, bytes, sha256)` inventory. The Atlas snapshot identifier is `inventory-sha256:<digest>`.

## Extraction semantics

The eCFR XML guide defines `<MATH>` as the location used for MathType equation material. Many such blocks are image-backed. This lane deliberately keeps the extracted stage narrow and auditable:

- every accepted occurrence is `attested`;
- `expression_original` is the serialized source `<MATH>` XML, not an invented textual formula;
- linked graphic paths/URLs are preserved as provenance;
- title, section locator, relative source path, nearby regulatory context, attributes and hashes are retained when available;
- **no OCR is performed**;
- **no mathematical reconstruction is performed**;
- prose thresholds, tables, and verbal legal rules are outside this adapter and require a separate `reconstructed` lane with explicit translation rules.

This prevents an image-backed equation from being presented as notation that did not actually occur in the XML source.

## Rights and redistribution boundary

GovInfo states that U.S. Government works are generally public domain under 17 U.S.C. 105, but also warns that Government publications can contain third-party copyrighted material and that publication does not authorize reuse of that material. The source descriptor therefore records a corpus-level third-party-content caveat.

The Atlas may publish permitted derived occurrence metadata, source XML wrappers, provenance, checksums and URLs. Linked equation image bytes are **not** to be mirrored to the Internet Archive by this lane unless their rights are separately audited.

## Implementation

Added:

- `scripts/science-equations/harvest-govinfo-ecfr-math.py` — bulk XML adapter;
- `scripts/science-equations/build-source-inventory.py` — reusable deterministic mirror inventory builder, also suitable for other file-based sources such as RFCXML;
- `data/science-equations/sources/govinfo-ecfr-math.json` — persistent source contract;
- `src/data/science-equations-govinfo-ecfr.test.js` — adapter and inventory regression tests.

Accepted occurrences route through the existing `OccurrenceV1 -> Apache Parquet/Zstd -> deterministic shard manifest -> Internet Archive` data plane. JSONL remains transient adapter transport only.

## Source availability audit

The official GovInfo bulk repository currently exposes directories for eCFR titles 1 through 50 (with the expected gap at Title 35), and the repository states that eCFR bulk XML is a current XML file per title. This is source availability only, not ingestion yield.

## Local reproducible smoke validation

A synthetic fixture based on the documented eCFR XML shape is used only to validate the adapter contract; it is **not ingestion yield**.

Expected fixture behavior:

- XML documents seen: 1;
- XML documents parsed: 1;
- explicit MATH blocks seen: 2;
- emitted attested occurrences: 2;
- image-backed MATH blocks: 1;
- OCR operations: 0;
- reconstructed formulas: 0;
- deterministic inventory test: byte-identical manifests on repeated execution.

## Real corpus yield in this execution

The conversation sandbox cannot resolve external hosts from its shell/data executor and does not expose Internet Archive credentials. Consequently no fixture or addressable source size is counted as acquisition.

- source snapshot: not acquired;
- Internet Archive identifier: none;
- extracted rows materialized to Parquet: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- real-corpus rejections: **0**;
- Parquet shards: **0**;
- Parquet manifests: none;
- candidate families: **0**;
- verified families: **0**.

No GitHub Action was used for acquisition, processing, Parquet generation, or Internet Archive publication.

## External executor recipe

On a local/Jatobá data executor:

1. traverse the official eCFR JSON/XML bulk listing;
2. mirror every current per-title XML object outside the Git working tree;
3. run `build-source-inventory.py --glob '*.xml' --source-id govinfo-ecfr-math-blocks`;
4. set `source_snapshot=inventory-sha256:<inventory_sha256>`;
5. run `harvest-govinfo-ecfr-math.py` over the complete mirror;
6. validate and materialize the `extracted` stream with `materialize-parquet.py` into appropriately sized Zstd shards;
7. keep image OCR / semantic reconstruction out of the extracted stage;
8. build later `normalized` and `deduplicated` Parquet stages non-destructively;
9. publish permitted Parquet shards plus manifests through `publish-internet-archive.py` from the external executor;
10. verify remote file listing, sizes and checksums, then commit only the lightweight snapshot/publication manifest and measured counts to Git.

## New coverage

This is the Atlas' first dedicated bulk lane for **law and regulation**. It connects explicit quantitative structures embedded in current federal regulations to the same provenance and Parquet contracts used by mathematical, biomedical, and computing sources.

## Audit debt

- measure `<MATH>` prevalence per eCFR title on the real mirror;
- audit linked graphic rights before any binary redistribution;
- determine which image-backed equations merit a separate OCR/semantic normalization stage;
- verify section/context boundary extraction against heterogeneous titles;
- compare current eCFR occurrences against annual official CFR snapshots when temporal/legal-status analysis becomes necessary;
- only propose cross-domain equation families after reproducible transformations exist.
