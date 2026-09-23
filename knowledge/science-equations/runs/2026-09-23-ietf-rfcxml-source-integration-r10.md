---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first corpus adapter integration"
summary: "Add the RFC Editor rsync/RFCXML lane as the third bulk source adapter, extracting attested ABNF and pseudocode blocks into the common occurrence contract and Parquet/Internet Archive pipeline without fabricating a bulk materialization that this executor could not perform."
updated: "2026-09-23"
---

# IETF RFCXML source integration

## State reconstructed before acting

This execution reread the Atlas routine and source plan from `main`, inspected `knowledge/science-equations/`, the current manifests and the open Parquet/Internet Archive storage PR before changing the source inventory.

The persistent Atlas already had bulk adapters for Wikidata P2534 and OEIS `%F` formula lines. The missing reusable layer was being materialized in the open storage PR: all adapters converge on a common occurrence schema, canonical Apache Parquet shards, verified Internet Archive publication and lightweight Git manifests. This run therefore advanced a genuinely different domain rather than adding an isolated formula.

## Source selected

The new source is the **RFC Editor RFC series**, acquired through the RFC Editor's official rsync service. The RFC Editor documents `rsync.rfc-editor.org` as the supported way to download and maintain local RFC mirrors. RFCs are freely available to download, copy, publish, display and distribute under the IETF Trust license, subject to the Trust Legal Provisions and their restrictions on modification outside the standards process.

The source descriptor is `data/science-equations/sources/ietf-rfcxml.json`.

This lane expands the Atlas into computer networking, protocols, security and systems without scraping individual RFC web pages.

## Adapter implemented

`scripts/science-equations/harvest-ietf-rfcxml.py` scans a local RFC Editor rsync mirror and emits transient JSONL occurrences from RFCXML `sourcecode` elements.

The initial precision-first scope is deliberately narrow:

- `type="abnf"` — formal grammars/protocol syntax;
- `type="pseudocode"` — explicit algorithmic procedures.

Both are recorded as `attested`, because the formal block itself appears in the RFC. This run does **not** convert ordinary prose or arbitrary implementation code into equations. Any later mathematical reconstruction from code/prose must enter a separate `reconstructed` lane with translation evidence.

Per occurrence the adapter preserves RFC number, official XML URL, block anchor/locator, document title, containing section, sourcecode type, exact source text, encoding, IETF Trust policy references and three SHA-256 fingerprints. Source-native metadata survives the generic Parquet materializer through `source_payload_json`.

## Snapshot policy

The RFC Editor rsync service is a mutable mirror, so a date label alone is not sufficient for reproducibility. Before a production harvest, the external executor must record:

1. UTC acquisition timestamp;
2. the file inventory of mirrored `rfc*.xml` documents;
3. byte size and SHA-256 for each XML file;
4. a deterministic SHA-256 digest over that inventory.

A distinct inventory digest is a distinct Atlas snapshot and therefore receives a distinct Internet Archive item. The source descriptor persists this requirement so future runs do not hardcode a mutable `latest` state.

## Common lake path

After rsync acquisition, the source uses the same shared pipeline as every other Atlas source:

```sh
python3 scripts/science-equations/harvest-ietf-rfcxml.py \
  --mirror /data/rfc-editor/in-notes \
  --snapshot <inventory-digest> \
| uv run scripts/science-equations/materialize-parquet.py \
  --input - \
  --source ietf-rfcxml-formal-blocks \
  --snapshot <inventory-digest> \
  --output-dir /data/equation-atlas/ietf-rfcxml/<inventory-digest>

node scripts/science-equations/publish-internet-archive.mjs \
  --manifest /data/equation-atlas/ietf-rfcxml/<inventory-digest>/manifest.json
```

The planned Internet Archive identity is `scientific-equation-atlas-ietf-rfcxml-formal-blocks-<inventory-digest>`.

No GitHub Action is used for acquisition, Parquet generation or Archive publication.

## Validation performed

A repository test was added at `src/data/science-equations-ietf-rfcxml-harvest.test.js`. Its fixture contains ABNF, pseudocode and unrelated JSON sourcecode; the expected lane emits only the two selected formal blocks and checks provenance, source URL/section, encoding and SHA-256 shapes.

The adapter itself uses only Python's standard library, so source extraction adds no new runtime dependency. Parquet materialization remains in the shared PyArrow-based layer.

This automation environment still cannot resolve outbound package/source hosts from its execution sandbox and does not expose Internet Archive credentials. Consequently, a full rsync mirror, Parquet write and authenticated Archive publication were not performed here. Those are not reported as green.

## Actual yield

- source/corpus adapters added: **1** (`ietf-rfcxml-formal-blocks`);
- new domain coverage: **computer networking / protocols / security / systems formal syntax and pseudocode**;
- persistent Parquet rows materialized: **0**;
- Internet Archive items published: **0**;
- normalized rows: **0**;
- deduplicated rows: **0**;
- new equation families asserted: **0**.

The zero materialization counts are deliberate. An adapter integration is not relabeled as a completed corpus acquisition.

## Deduplication and family boundary

For these RFC blocks, exact source-record, exact-text and whitespace-only fingerprints can be used as early deduplication layers. ABNF or pseudocode similarity does not establish mathematical equivalence. No `equation-family` edge is created until a reproducible transformation or operational equivalence argument exists.

## Audit debt

The next RFC-specific audit should estimate the precision and yield of additional RFCXML sourcecode types and `artwork` blocks before broadening extraction. In particular, implementation code should not be ingested wholesale merely because it is machine-readable.

## Next highest-value action

On a bulk-capable executor with Internet Archive credentials, complete one real source snapshot end to end: acquire the RFC rsync mirror, compute the inventory digest, run the adapter, materialize Parquet, publish and verify the Archive item, then persist measured row/shard counts and checksums. The same executor should also finish the already-pinned OEIS snapshot so the Atlas can compare throughput and deduplication behavior across discrete mathematics and computer/network standards.
