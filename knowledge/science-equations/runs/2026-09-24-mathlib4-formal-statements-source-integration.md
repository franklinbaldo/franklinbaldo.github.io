---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate Lean mathlib4 as a harvest-ready corpus lane for source-attested theorem and lemma proposition statements from an exact content-addressed Git snapshot."
updated: "2026-09-24"
---

# mathlib4 formal-statement source integration — 2026-09-24

## State reconstructed from main

This run began from contemporary `main` commit `828c1d2baa645159f8ad43393fa138a8f9821f7c` after reading `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the complete source-descriptor tree and the persisted ingestion manifests.

At selection time `data/science-equations/sources/` contained sixteen descriptors: BioModels/SBML, EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, two LMFDB lanes, Modelica MSL, OEIS, OpenStax osbooks MathML, Physiome CellML, PMC/JATS, Stack Exchange data-dump TeX, Wikidata P2534, Wikimedia open-learning math, English Wikipedia math and multilingual Wikipedia math. `data/science-equations/manifests/` contained only `oeis-2026-09-23.json`.

No branch, remembered automation queue or transient prompt state was used to select the next corpus. The unit of work is the maintained **Lean mathlib4 `Mathlib/` source tree**, not an individual theorem or identity.

## Why mathlib4

mathlib is a community-driven unified library of mathematics formalized in Lean. Its repository is a structured source corpus spanning large mathematical areas including algebra, algebraic geometry/topology, analysis, category theory, combinatorics, computability, dynamics and many additional domains under `Mathlib/`.

Lean's proposition-as-types semantics makes this source unusually precise for Atlas provenance: the type written in a `theorem` declaration is the proposition being proved. The new lane therefore extracts the explicit proposition text from theorem and lemma declarations as source-attested mathematical/formal structures. It does not infer mathematics from proofs or translate Lean into display notation.

Source-contract verification during this run observed mathlib4 `master` at commit `487140449b0eceeb60afe04cab75cdcaaebf227f` on 2026-09-24 and verified the repository root Apache License 2.0. GitHub code search also showed thousands of source files matching theorem-related content, which is evidence of corpus breadth only and is not reported as an ingestion row count. The descriptor deliberately does not freeze that transient `master` commit; real snapshots always resolve and record the exact commit actually acquired.

Official surfaces used for the integration contract:

- <https://github.com/leanprover-community/mathlib4>
- <https://github.com/leanprover-community/mathlib4/blob/master/LICENSE>
- <https://leanprover-community.github.io/>
- <https://lean-lang.org/theorem_proving_in_lean4/Propositions-and-Proofs/>

## Source semantics

`scripts/science-equations/harvest-mathlib4-statements.py` consumes a verified exact-commit mathlib4 checkout and scans `Mathlib/**/*.lean`. The first lane intentionally limits itself to explicit `theorem` and `lemma` declarations with a lexical result type and a top-level proof delimiter.

For each accepted occurrence it preserves:

- the exact lexical Lean proposition substring as `expression_original`;
- theorem versus lemma declaration kind and declaration name;
- the source declaration header up to, but excluding, the proof body;
- exact repository-relative `.lean` path and SHA-256 of its source bytes;
- exact Git commit and stable source URL with line range;
- the first `Mathlib/` path component as a coarse source-domain provenance field;
- root license SHA-256 plus Apache-2.0 attribution evidence;
- a checkout-directory-independent occurrence hash.

All emitted rows are `attested`. The adapter does not parse proof bodies into equations, render or translate Lean to LaTeX, elaborate implicit arguments, normalize propositions, prove equivalence or assert equation families at extracted stage.

The lexical detector masks nested block comments, line comments, ordinary/raw strings, character literals, quoted names and command syntax quotations before looking for declaration keywords. A theorem/lemma for which an explicit proposition boundary cannot be established is rejected instead of reconstructed. This conservative rule intentionally trades recall for provenance correctness until a parser/elaborator-backed follow-up lane is justified.

## Snapshot and acquisition contract

A real batch is immutable and content-addressed:

1. resolve the official mathlib4 ref selected by the external executor to its full exact Git commit;
2. acquire that commit outside GitHub Actions;
3. verify the root Apache-2.0 license and record its SHA-256;
4. SHA-256 every included `Mathlib/**/*.lean` object;
5. build a deterministic sorted path/size/hash inventory with `scripts/science-equations/build-source-inventory.py`;
6. use `mathlib4:git:<commit>:inventory-sha256:<digest>` as `source_snapshot`.

Changing the commit, file set or any included source bytes creates a new snapshot and new immutable Internet Archive item. Local checkout paths never participate in logical occurrence identity.

## Rights and redistribution

The repository root license at the inspected current source is Apache License 2.0, which permits reproduction, derivative works and redistribution subject to the license conditions and preservation of applicable notices. The lane is therefore `harvest-ready` for the scoped mathlib source-derived rows.

The acquisition step must verify the license at the exact selected commit rather than inheriting today's observation. If that snapshot contains a relevant `NOTICE` file or source-specific third-party attribution/rights notice, the publication manifest must preserve it and fail closed for any affected payload not yet audited. Dependency/vendor trees and repository areas outside `Mathlib/` are not implicitly covered by this source contract.

## Canonical equation lake

JSONL emitted by the adapter is transport only. Persistent outputs remain:

1. `extracted` Apache Parquet/Zstd preserving exact Lean proposition source and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The shared materializer remains responsible for schema versioning, one-source/one-snapshot invariants, deterministic default shards of 250,000 rows, row/byte counts and SHA-256 per shard. Normalization and deduplication stay layered: source-exact, textual, syntax, algebraic, typed-renaming, nondimensional, functional/dynamic and structural-family relations must not collapse into a single equality field.

Only rights-approved Parquets/manifests may be published from an external executor through `scripts/science-equations/publish-internet-archive.py`, followed by remote metadata/listing, size and checksum verification where exposed. No massive mathlib source archive or Parquet shard belongs in Git.

## Reproducible adapter validation in this execution

The adapter was exercised in the available sandbox, outside GitHub Actions:

- Python syntax compilation passed;
- focused Node regression suite passed `3/3`;
- a fixture emitted four explicit theorem/lemma propositions including equality, inequality, a quantified statement and a quoted declaration name;
- nested comments, normal strings, raw strings, syntax quotations and a quoted keyword were excluded from declaration discovery;
- a declaration lacking an explicit lexical proposition boundary was rejected fail-closed;
- exact proposition text, declaration kind/name, path/domain and license evidence were retained;
- occurrence hashes were identical across two different checkout directories;
- a snapshot/commit mismatch failed closed;
- OCR count was zero and reconstruction count was zero.

Fixture rows are validation only and are not reported as corpus yield.

## Real corpus yield in this execution

A full corpus acquisition/materialization did not run. The Jatobá control-plane status call timed out, while the available sandbox cannot resolve external hosts. Moving repository acquisition, theorem extraction at corpus scale, Parquet generation or Internet Archive publication into GitHub Actions would violate the Atlas data-plane policy and was not done.

Measured real-corpus results are therefore:

- external acquisition executor used: none available;
- mathlib4 source objects acquired for lake ingestion: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because bulk acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

GitHub source inspection and fixture rows are source-contract/test evidence only, never ingestion yield.

## Coverage gained

This lane adds formal, machine-checkable mathematics as a source-native layer. It materially complements formula-oriented corpora because the Atlas can retain equality, inequality, quantified relation, implication, equivalence and other mathematical propositions together with exact source paths and declaration identities, rather than inferring them from rendered prose.

It also creates a future high-confidence reconciliation surface: a theorem statement in mathlib can become evidence when linking a structural family discovered in OEIS, LMFDB, OpenStax, Wikipedia or scientific-model corpora, but no cross-source equivalence is asserted merely from names, embeddings or visual similarity.

## Audit debt

- Run the complete `Mathlib/**/*.lean` tree on an external executor and persist measured declaration/rejection counts plus lightweight lake manifests.
- Measure accepted/rejected rates by top-level `Mathlib/` domain and manually audit conservative false negatives.
- Sample declarations using advanced Lean syntax, top-level `let` proposition forms and parser extensions before widening the lexical lane.
- Consider a distinct parser/elaborator-backed lane for proposition ASTs/types; never overwrite the exact lexical attestation.
- Keep definitions/functions as a separate source lane so executable definitions are not conflated with theorem propositions.
- Run layered source-exact/textual/syntactic/algebraic deduplication before proposing equation families.
- Run `okf-parser graph` inspection on an executor with the compatible parser after the final bundle is available.

## Next data-plane action

On an external executor with internet, Git, PyArrow and Internet Archive credentials:

```text
resolve exact mathlib4 commit
→ acquire checkout outside GitHub Actions
→ verify LICENSE + SHA-256 Mathlib/**/*.lean deterministic inventory
→ harvest attested theorem/lemma propositions
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ rights/quality audit
→ immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight source/lake manifests + measured counts back to Git
```
