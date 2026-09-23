---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first PMC JATS bulk integration"
summary: "Add a license-filtered PMC JATS adapter for attested display/inline formulas and reconcile the Atlas control plane onto canonical Parquet plus verified Internet Archive publication without claiming unmaterialized corpus yield."
updated: "2026-09-23"
---

# PMC JATS source integration — adaptation-safe Creative Commons lane

## State reconstructed before acting

This run started from `main` at `cc77816780a9f0590e0bc2768f62d2064c1ff9f5`, then reread `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, the complete `knowledge/science-equations/runs/` inventory, and `data/science-equations/manifests/` before writing.

Persisted state showed two bulk adapters already in `main` — Wikidata P2534 and OEIS `%F` — but the durable storage contract was still advisory: the only source manifest allowed compressed JSONL or Parquet and no canonical Internet Archive publication layer had landed. The next unit therefore had to improve source throughput and make the mass-storage contract executable rather than add another hand-picked formula.

## Source selected

The new lane is **PubMed Central Article Datasets / JATS XML**, restricted initially to article versions whose JATS license URI is recognized as CC0, CC BY or CC BY-SA.

Official acquisition/policy surfaces checked on 2026-09-23:

- <https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/> — current PMC Article Dataset distribution through the world-readable `pmc-oa-opendata` AWS bucket;
- <https://pmc.ncbi.nlm.nih.gov/tools/textmining/> — automated-retrieval and license restrictions;
- <https://pmc.ncbi.nlm.nih.gov/tools/cloud/> — distributed JSON metadata, JATS XML, text, PDF/media where available and daily inventory behavior;
- <https://jats.nlm.nih.gov/articleauthoring/tag-library/1.4/element/disp-formula.html> and <https://jats.nlm.nih.gov/articleauthoring/tag-library/1.4/element/inline-formula.html> — formula-bearing JATS elements.

The source descriptor is `data/science-equations/sources/pmc-jats-commercial-cc.json`.

## 2026 distribution boundary

The adapter deliberately does **not** depend on the retired PMC OA Web Service or the former article-dataset FTP packages. Current PMC documentation says the 2026 transition is complete and that Article Datasets are retrieved through the AWS Cloud Service. There are no longer baseline/incremental article bundles; the bucket is continuously updated and a daily inventory exposes object modification information and ETags.

That means a calendar date alone is not a sufficient immutable snapshot. A real Atlas PMC snapshot must pin the inventory object used for selection and record its date, ETag when exposed, SHA-256, plus a deterministic digest of the selected article-version inventory rows/metadata. A distinct digest is a distinct Atlas snapshot and Internet Archive item.

## License boundary

PMC explicitly warns that reuse terms vary by article. This first lane is intentionally narrower than the full dataset. Acquisition should prefilter from PMC metadata/inventory, and `harvest-pmc-jats.py` performs a second fail-closed check against the JATS license URI.

Accepted by this lane:

- CC0;
- CC BY;
- CC BY-SA.

Excluded by default:

- CC BY-ND;
- CC BY-NC families;
- custom/unknown licenses;
- records whose JATS license URI cannot be recognized by the adapter.

PMC documentation includes CC BY-ND among licenses usable for commercial reuse, but the Atlas is more conservative for a derived-data lake: no-derivatives records stay out until stage-specific treatment of extraction, normalization and redistribution is audited. Author manuscripts may also have additional PMC reuse rights, but they are not silently folded into this first lane; they require a separate source policy/adapter lane so the origin of permission remains explicit.

## Adapter behavior

`scripts/science-equations/harvest-pmc-jats.py` walks a local tree of JATS XML acquired through the official bulk channel and emits one transient JSONL occurrence for every non-empty `disp-formula` or `inline-formula` in a license-accepted article.

For each occurrence it preserves:

- source snapshot identity;
- PMCID and DOI when present;
- source file SHA-256 and stable formula locator;
- direct PMC article URL;
- recognized article license URI and license statement;
- article title/type;
- formula kind and JATS id;
- nearest section title and paragraph context;
- attested expression, preferring `tex-math`, otherwise serialized MathML, otherwise formula text;
- exact-text and whitespace-only normalized hashes.

All records are `attested`. This lane performs no reconstruction from prose, code or methods descriptions.

## Common mass-storage contract

This run also lands the common source-independent lake path needed by Wikidata, OEIS, PMC and future adapters:

```text
source adapter
  -> transient JSONL stream
  -> materialize-parquet.py
  -> source+snapshot+stage Parquet shards
  -> deterministic manifest + SHA-256/MD5 + row counts
  -> publish-internet-archive.mjs
  -> remote metadata/size/hash verification
  -> lightweight verified publication state committed to Git
```

`Apache Parquet` is now the canonical mass format. JSONL is transient only. The materializer defaults to 250,000 rows per Zstd-compressed shard and refuses an empty dataset. `publish-internet-archive.mjs` requires `IA_ACCESS_KEY_ID` and `IA_SECRET_ACCESS_KEY` in the external executor environment, aborts if an existing same-name remote file conflicts by bytes/MD5, reuses identical files idempotently, and verifies the Internet Archive item after upload before publication state may be committed.

GitHub Actions is not an acquisition, materialization or publication backend for this pipeline.

## Validation performed in this execution

The PMC adapter was compiled with Python 3 and exercised against a synthetic two-article JATS corpus:

- 2 XML files seen;
- 1 CC BY article accepted;
- 1 CC BY-NC article rejected by the license gate;
- 2 attested formulas emitted (one MathML inline formula, one TeX display formula);
- 1 empty formula skipped;
- 0 parse errors.

The fixture test passed under Node's test runner and verifies license filtering, formula kinds, encodings, provenance class and SHA-256 fields.

The generic materializer and Internet Archive publisher were added as control-plane code. Actual PyArrow Parquet writing and Internet Archive publication were **not** executed in this sandbox because PyArrow is not installed here, outbound dependency acquisition is unavailable, and Internet Archive credentials are not exposed to this environment. The repository-pinned `okf-parser` likewise cannot be fetched here through `uv` because the sandbox lacks outbound Git/DNS access. None of those unavailable checks are reported as green.

## Actual yield

Persistent full-corpus PMC occurrences materialized: **0**.

Parquet shards written: **0**.

Internet Archive items published: **0**.

Internet Archive identifier: **not assigned yet**; the descriptor requires `scientific-equation-atlas-pmc-jats-commercial-cc-<snapshot-id>` after a real inventory/selection digest exists.

The synthetic fixture's two rows are test evidence only and are not counted as corpus ingestion.

## Coverage gained

The Atlas now has a bulk-ready path for explicit formula markup across medicine, health, biomedicine and life sciences. Unlike the prior hand-curated health examples, this adapter targets the source corpus itself and keeps article-level reuse policy attached to every emitted record.

No `equation-family` was created in this run. Shared text hashes or later clusters remain candidate evidence only until reproducible mathematical transformations justify stronger relations.

## Audit debt and next execution

The highest-value next step is a real external-executor materialization:

1. acquire a pinned PMC daily inventory from `pmc-oa-opendata`;
2. select the adaptation-safe Creative Commons subset and record the inventory/selection digest;
3. retrieve only the corresponding JATS XML objects;
4. stream them through `harvest-pmc-jats.py` into `materialize-parquet.py`;
5. record measured accepted/rejected article counts and formula counts;
6. publish the Parquet shards plus lake manifest to the deterministic Internet Archive item;
7. verify remote files;
8. only then commit the lightweight publication manifest with verified URLs/checksums.

A useful second audit after the first real batch is to compare TeX-vs-MathML prevalence and inspect formula elements that fall back to plain JATS text before adding any semantic normalization beyond whitespace.
