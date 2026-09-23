---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first bulk source integration"
summary: "Integrate a pinned OEIS corpus adapter that harvests every attested %F formula line from the Git export without page scraping, with exact and normalized-text fingerprints ready for large-scale deduplication."
updated: "2026-09-23"
---

# OEIS source integration — formula-field bulk lane

## State reconstructed before acting

This execution started from current `main` at commit `44e4de59ff24e91129410faa12bd04fe6269e869`, reread `docs/science-equation-atlas-routine.md` and `docs/science-equation-atlas-sources.md`, inspected `knowledge/science-equations/`, recent runs and the existing Wikidata harvester, and checked for competing open Atlas PRs before writing.

The persistent state said the next unit should be a **source/corpus integration**, not another hand-picked equation. Wikidata P2534 already had a provenance-preserving adapter, while OEIS was the next high-readiness corpus with an official bulk Git export and explicit formula fields.

## Source selected and pinned

This run integrates the **Online Encyclopedia of Integer Sequences (OEIS)** formula field from its official `oeis/oeisdata` Git export.

Pinned source snapshot:

- repository: <https://github.com/oeis/oeisdata>;
- commit: `86962e9ef366e08ffbeeff8c72c1cf2b4268d82b`;
- export timestamp from `time.txt`: `2026-09-23T03:00:19-04:00`;
- license: CC BY-SA 4.0, as stated by the repository `LICENSE` and OEIS download documentation;
- live OEIS homepage count observed during the audit: **399,506 sequences**. This is an addressable-corpus observation, not an ingestion count for the pinned snapshot.

The machine-readable manifest is `data/science-equations/manifests/oeis-2026-09-23.json`.

Technical format evidence checked during the run:

- OEIS bulk download documentation: <https://oeis.org/wiki/Download>;
- official Git export README: <https://github.com/oeis/oeisdata>;
- OEIS internal-format documentation: <https://oeis.org/eishelp1.html>;
- internal-format description of `%F` lines as formulas relating to or generating a sequence: <https://oeis.org/wiki/User:Charles_R_Greathouse_IV/Format>;
- license text: <https://oeis.org/LICENSE>.

## Integrated bulk adapter

`scripts/science-equations/harvest-oeis-formulas.mjs` operates on a **pinned Git commit**, not the mutable working tree and not one HTTP page at a time.

It uses `git grep` over `seq/` to stream every `%F` line from the chosen export. One JSONL occurrence is emitted per formula line. For every accepted occurrence it preserves:

- OEIS A-number;
- pinned source commit;
- repository path and source line;
- direct sequence URL and pinned record URL;
- `%F` field identity;
- formula text exactly as stored after the OEIS field prefix;
- `attested` provenance class;
- CC BY-SA 4.0 license/policy references;
- SHA-256 of the complete source record;
- SHA-256 of exact formula text;
- SHA-256 of a deliberately weak normalization that changes only surrounding/repeated whitespace.

The weak normalization is intentional. It supports the first two deduplication layers without silently claiming algebraic, typed, dimensional, functional or dynamic equivalence.

## Why `%F` first

OEIS also contains comments and program fields (`%p`, `%t`, `%o`) that can encode useful mathematical or computational structure. This integration deliberately starts with `%F` because OEIS defines it as the formula field, giving a high-precision attested lane at corpus scale.

Programs are not silently converted into equations. A later computation-oriented lane may reconstruct named recurrences, algorithms or transforms from program fields, but those records must be `reconstructed` and carry a translation/equivalence test.

## Validation performed

The adapter has fixture-level coverage for:

- parsing pinned `git grep` output;
- preserving source notation;
- rejecting non-`%F` fields and path/A-number mismatches;
- source-record hashing;
- exact-text and normalized-text fingerprints;
- end-to-end harvesting from a temporary Git repository with multiple formula lines and duplicate formula text across sequences.

The source format itself was also inspected against the pinned live export, including current `.seq` entries and the official internal-format documentation.

## Actual yield and materialization boundary

Persistent full-corpus occurrences materialized in this execution: **0**.

That zero is deliberate rather than a fabricated bulk result. The available repository-mutation environment could inspect the official pinned source and implement/test the adapter, but did not expose a direct bulk checkout/materialization path for executing the complete `oeisdata` export. A compute-fabric attempt was unavailable and the local execution environment had no outbound Git/DNS path.

The replay boundary is now small and deterministic:

```sh
git clone --filter=blob:none --no-checkout https://github.com/oeis/oeisdata.git oeisdata
git -C oeisdata fetch origin 86962e9ef366e08ffbeeff8c72c1cf2b4268d82b
node scripts/science-equations/harvest-oeis-formulas.mjs \
  --repo oeisdata \
  --snapshot 86962e9ef366e08ffbeeff8c72c1cf2b4268d82b \
  > oeis-formulas.jsonl
```

The output is intended to be sharded/compressed outside ordinary Git history. A post-harvest manifest should record shard checksums, total `%F` occurrences, exact-text unique count, normalized-text unique count, reject count and audit samples.

## Deduplication and equivalence boundary

This run creates no `equation-family` relationship.

Two OEIS records sharing `original_text_sha256` are textually identical, not automatically the same mathematical object in context. Two records sharing `normalized_text_sha256` differ at most by the whitespace normalization defined by the adapter. Neither fingerprint proves variable-renaming, algebraic, dimensional, functional or dynamic equivalence.

Higher-order clustering may use these fingerprints as candidate-generation infrastructure, but family promotion still requires a reproducible transformation or argument.

## Coverage and audit debt

New corpus lane covered:

- discrete mathematics and integer sequences;
- recurrences, generating functions, transforms, identities and closed forms explicitly represented in OEIS `%F` lines;
- a bridge into theoretical computer science where sequence/recurrence structure overlaps algorithms and combinatorics.

Audit debt intentionally left explicit:

- execute the pinned full harvest in a bulk-capable environment;
- write immutable shard checksums and measured counts;
- quantify exact-text and normalized-text duplicate rates;
- sample ambiguous `%F` lines before any semantic parser is introduced;
- only then consider structured parsing beyond text fingerprints.

## Validation boundary

Before merge, the branch must pass the repository-pinned normative `okf-parser` validation for `knowledge/science-equations/` and the normal blog gates. This run records the intended checks but does not predeclare pending CI as successful.
