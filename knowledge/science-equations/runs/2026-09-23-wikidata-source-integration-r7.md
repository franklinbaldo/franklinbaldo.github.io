---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first integration reconciliation"
summary: "Reconstruct the current Atlas from main, carry the source-first architecture onto the current repository head, and integrate the first high-yield corpus adapter for Wikidata P2534 without inventing full-dump yield that was not executed."
updated: "2026-09-23"
---

# Wikidata source integration — current-main reconciliation

## State reconstructed before acting

This execution started from current `main` at commit `22d0ed3940aa502fb951d0b8db666affa6939469`, reread `docs/science-equation-atlas-routine.md`, inspected the canonical `knowledge/science-equations/` tree and its recent runs, and checked the already-open source-first work before writing anything.

The important discovery was architectural rather than disciplinary: `main` still had the older one-formula-at-a-time routine and did not yet contain `docs/science-equation-atlas-sources.md`, while an open Atlas branch already contained a coherent source-first rewrite plus a Wikidata P2534 streaming harvester. Duplicating that work would have produced two competing ingestion designs, so this execution reconciles it onto the current `main` head instead.

## Source selected

The first integrated bulk lane is **Wikidata `defining formula` (P2534)**.

Official evidence checked during this execution:

- property documentation and live usage statistics: <https://www.wikidata.org/wiki/Property_talk:P2534>;
- database download documentation: <https://www.wikidata.org/wiki/Wikidata:Database_download>;
- Wikidata licensing policy: <https://www.wikidata.org/wiki/Wikidata:Licensing>;
- current entity-dump path family: <https://dumps.wikimedia.org/wikidatawiki/entities/>.

The property page reported **113,316 total P2534 uses** at the time of the audit, of which **113,043** were main statements. That number is a live source statistic, not an ingestion count.

## Integrated adapter

The source-first branch contributes `scripts/science-equations/harvest-wikidata-p2534.mjs`, which reads a decompressed official Wikidata JSON entity dump as a stream and emits one JSONL occurrence per value-bearing P2534 statement.

Each occurrence preserves, when present:

- QID;
- entity revision;
- statement id and rank;
- source expression unchanged;
- qualifiers;
- references;
- P7235 symbol claims;
- `attested` provenance class;
- caller-supplied snapshot id;
- SHA-256 of the source statement JSON;
- source/license/policy identifiers.

The adapter deliberately performs **no semantic normalization and no equation-family promotion**. This keeps raw attested notation recoverable and prevents source ingestion from silently becoming a claim of mathematical equivalence.

Fixture-level tests exercise dump-line parsing, provenance preservation, symbol metadata, deterministic statement hashing and bounded streaming.

## Scope expansion preserved

The reconciled routine and source plan explicitly widen the Atlas from named equations to quantitative structures with identity in a field: formulas, functions, recurrences, transforms, kernels, objectives/losses, constraints, inequalities, distributions, update rules, state transitions, cost functions, legal/regulatory rules and algorithmic formalizations.

The `attested` / `reconstructed` distinction remains mandatory. A mathematical representation reconstructed from code, pseudocode, an algorithm or a legal rule must never be presented as notation that appeared in the original source.

The source plan also records high-yield lanes beyond Wikidata: OEIS, LMFDB, PMC/JATS, license-filtered arXiv, IETF RFCXML and GovInfo/CFR/eCFR, while keeping DLMF reference-only because its notices do not support bulk redistribution.

## Actual yield and blocker

This execution integrates the source architecture and adapter onto the current repository head, but it does **not** claim that 113,316 Wikidata statements were harvested.

Measured persistent full-dump occurrences in this execution: **0**.

Reason: the execution environment available for repository mutation did not provide direct network/materialization access to the multi-gigabyte official Wikidata entity dump. Rather than substitute a tiny web sample or fabricate a source-sized count, the run records the exact replay boundary.

Reproducible full harvest once a versioned official dump is materialized:

```sh
bzip2 -dc latest-all.json.bz2 | \
  node scripts/science-equations/harvest-wikidata-p2534.mjs \
  --snapshot <wikidata-snapshot-id> \
  > wikidata-p2534.jsonl
```

The next source-sized run should pin the dump date/checksum, shard the JSONL outside normal Git history, record manifest/checksums/counts, and compute at least source-exact and normalized-text duplicate rates before any higher-order equivalence clustering.

## Equivalence boundary

No `equation-family` edge is added in this execution. Bulk collection is not evidence that two expressions are mathematically equivalent. Clusters generated downstream remain candidates until a transformation or other reproducible argument verifies the relationship.

## Validation boundary

The branch must pass the repository-pinned normative `okf-parser` check for `knowledge/science-equations/` and the normal blog gates before merge. This run intentionally does not rewrite pending CI as success.
