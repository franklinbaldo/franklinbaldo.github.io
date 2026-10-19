---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first bulk source integration"
summary: "Add a license-filtered PMC/JATS bulk adapter and a shared Parquet -> Internet Archive publication contract, moving the Atlas data plane outside GitHub Actions."
updated: "2026-09-23"
---

# PMC/JATS source integration — Parquet lake lane

## State reconstructed from main

This execution reread `docs/science-equation-atlas-routine.md` and `docs/science-equation-atlas-sources.md`, then reconstructed state from current `main`, `knowledge/science-equations/`, and `data/science-equations/manifests/` only.

At the start, `main` had working source-specific harvesters for Wikidata P2534 and OEIS `%F`, plus a lightweight OEIS source manifest. It did not yet have a canonical Parquet materializer, a generic Internet Archive publisher, or a source adapter for the high-volume biomedical JATS lane.

## Source selected

**PubMed Central Article Datasets / JATS XML** was selected because it offers a very high-yield structured formula surface in a domain not yet represented by a bulk adapter: medicine, life sciences and biomedical research.

Fresh source verification on 2026-09-23 established:

- the 2026 PMC Article Dataset distribution migration is complete;
- new bulk workflows must use the PMC Cloud Service on AWS, not the retired Article Datasets FTP/OA Web Service/legacy AWS layout;
- the world-readable bucket is `arn:aws:s3:::pmc-oa-opendata` and anonymous retrieval is supported;
- the Cloud Service exposes JATS XML per article and maintains a daily inventory with object timestamps/ETags;
- there are no longer baseline/incremental multi-article XML packages, so the reproducible snapshot boundary is the selected inventory/object set, not a legacy bulk archive filename;
- reuse rights are article-specific.

Primary documentation:

- <https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/>
- <https://pmc.ncbi.nlm.nih.gov/tools/cloud/>
- <https://pmc.ncbi.nlm.nih.gov/tools/textmining/>
- <https://pmc.ncbi.nlm.nih.gov/tools/openftlist/>

## Integrated adapter

`scripts/science-equations/harvest-pmc-jats.mjs` consumes JATS XML files acquired through the official PMC Cloud Service and emits one transient occurrence record per `disp-formula` or `inline-formula`.

It preserves:

- PMCID and DOI when present;
- source snapshot/inventory digest supplied by the acquisition run;
- local/object path;
- formula element and id/locator;
- original TeX, MathML or JATS text representation;
- nearby article context and title;
- article-level license URL/text/classification;
- `attested` provenance;
- source-record SHA-256;
- exact-expression SHA-256;
- whitespace-only normalized-text SHA-256.

The adapter is conservative by default: only CC0, CC BY and CC BY-SA are automatically emitted into the redistributable lane. ND, NC, custom or missing licenses are counted as manual-review rather than silently published.

## Shared data-plane contract

This run also introduces `docs/science-equation-atlas-storage.md` plus two shared tools:

- `materialize-parquet.py` validates the transport stream with a versioned Pydantic occurrence model and materializes Zstd Parquet shards plus a deterministic manifest containing row counts, byte sizes and SHA-256 checksums;
- `publish-internet-archive.py` uploads verified Parquet shards and manifest through the `ia` CLI from an external executor, refuses silent overwrite, and verifies remote size/MD5 before declaring publication successful.

GitHub Actions is explicitly excluded from acquisition, processing, Parquet generation and Internet Archive upload.

## Validation performed in this execution

Local sandbox validation completed for the new code without network access:

- `node --check` on the PMC adapter;
- four Node fixture tests: license classification, TeX/MathML preservation, license rejection, and multi-file streaming harvest;
- Python bytecode compilation for Parquet materializer and Internet Archive publisher;
- Pydantic `--validate-only` preflight on a canonical occurrence fixture.

All four PMC fixture tests passed.

## Actual yield and publication boundary

Bulk PMC rows materialized in this execution: **0**.

Internet Archive items published in this execution: **0**.

The zero is deliberate. The available sandbox has no outbound DNS path to the PMC AWS bucket, does not have PyArrow installed, and does not expose Internet Archive credentials. No fixture row is reported as corpus ingestion.

The next bulk-capable executor can perform the complete lane as:

```sh
# 1. acquire a pinned set of JATS XML objects from the official PMC AWS Cloud Service
#    and compute a deterministic inventory SHA-256 over selected object keys/timestamps/ETags

# 2. extract attested formula occurrences
node scripts/science-equations/harvest-pmc-jats.mjs \
  --snapshot inventory-sha256:<digest> \
  --paths-from work/pmc-jats/paths.txt \
  > work/pmc-jats/occurrences.jsonl

# 3. transient JSONL -> canonical Parquet
uv run --with pydantic --with pyarrow \
  scripts/science-equations/materialize-parquet.py \
  --input work/pmc-jats/occurrences.jsonl \
  --output-dir work/pmc-jats/extracted \
  --stage extracted

# 4. publish from Jatobá/external executor, never GitHub Actions
python scripts/science-equations/publish-internet-archive.py \
  --manifest work/pmc-jats/extracted/manifest.json
```

## Deduplication and family boundary

No equation family is asserted by this integration. Exact and whitespace-normalized fingerprints are candidate infrastructure only. Algebraic, typed, dimensional, functional and dynamic equivalence still require reproducible transformations or explicit verification.

## New coverage and audit debt

New source lane:

- biomedical and life-science literature at PMC scale;
- explicit JATS formula containers with direct article provenance;
- TeX and MathML preservation without PDF/OCR.

Audit debt:

- execute against a real pinned PMC inventory selection;
- measure formulas per article, license-filter rejection rate and empty/unsupported formula representation rate;
- add schema-aware extraction for formula labels and richer section paths;
- materialize/publish the first real Parquet item to Internet Archive and commit its verified identifier/checksums;
- sample formula records before introducing semantic normalization beyond whitespace.
