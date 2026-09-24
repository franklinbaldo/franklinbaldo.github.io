---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate the Modelica Standard Library as a harvest-ready lane for attested equality equations from versioned engineering simulation source code."
updated: "2026-09-24"
---

# Modelica Standard Library equation source integration — 2026-09-24

## State reconstructed from main

This run began from contemporary `main` commit `daaf645c7b4815dcf6e2b74ddcc6105233cd6a62` after reading `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the complete source-descriptor tree and the persisted ingestion manifests.

At selection time `data/science-equations/sources/` contained fourteen descriptors: BioModels/SBML, EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, OpenStax osbooks MathML, PMC/JATS, Stack Exchange data-dump TeX, Wikidata P2534, Wikimedia open-learning math, English Wikipedia math and multilingual Wikipedia math. `data/science-equations/manifests/` contained only `oeis-2026-09-23.json`.

No branch, previous automation message or remembered transient queue state was used to select the work. The unit of work is the **Modelica Standard Library corpus**, not an individual resistor law or formula.

## Why Modelica Standard Library

The Modelica Standard Library (MSL) is the official Modelica Association library for multi-domain physical and control-system modeling. Its published source spans mechanical, electrical, magnetic, thermal, fluid and control-system components plus hierarchical state machines and numerical utilities. Those models encode quantitative relations directly in a machine-readable modeling language rather than only in rendered prose.

The current stable release verified during source research was MSL `v4.1.0`, released on 2025-05-23. The official tag resolves to commit `8ae3d35c24e519cb2996cab20f3b13daf2b0c50a`. This version is **run evidence**, not a mutable version hardcoded into the source contract: future data-plane runs must resolve the stable release they actually acquire and record its exact tag and commit.

Official surfaces used for this integration contract:

- <https://github.com/modelica/ModelicaStandardLibrary>
- <https://github.com/modelica/ModelicaStandardLibrary/releases>
- <https://modelica.org/news/2025-05-23-release-msl-4_1_0/>
- <https://specification.modelica.org/maint/3.6/equations.html>
- <https://modelica.org/licenses/modelica-3-clause-bsd>

The Modelica language specification defines an `equation` section as a sequence of equations and identifies simple equality equations as the traditional equality relation between two expressions. That makes the source syntax itself an unusually precise attestation surface.

## Source semantics

`scripts/science-equations/harvest-modelica-msl.py` consumes a verified MSL release checkout and, when the repository root contains `Modelica/`, scopes acquisition to `Modelica/**/*.mo`. It extracts **simple equality equations** appearing in `equation` and `initial equation` sections.

For each emitted occurrence the adapter preserves:

- exact lexical Modelica equality statement, including the terminating semicolon;
- release tag and exact Git commit supplied by the snapshot executor;
- repository-relative `.mo` path and SHA-256 of the source document;
- `within` package and lexical class path;
- top-level MSL domain derived from the source path where available;
- equation versus initial-equation section;
- exact left- and right-hand source substrings;
- source line range and stable Git blob URL;
- active line-oriented `if`/`elseif`/`else`, `when`/`elsewhen` and `for` equation-control context when present.

All emitted rows are `attested`. The adapter does **not** derive ODEs, flatten inherited models, resolve replaceable classes, infer units through the Modelica type system, canonicalize expressions, prove algebraic equivalence or create equation families at the extracted stage.

The extractor deliberately excludes algorithm sections and `:=` assignments, `connect(...)` topology, `assert(...)`, `reinit(...)`, `terminate(...)`, annotations and documentation-only formulas. This trades some recall for high source semantics and keeps program statements from being mislabeled as mathematical equalities.

## Snapshot identity

A real acquisition run must be content-addressed and immutable:

1. resolve the selected official stable release tag to its exact Git commit;
2. acquire that release on an external executor, never in GitHub Actions;
3. scope the source inventory to the published `Modelica/**/*.mo` tree;
4. SHA-256 every included source object;
5. build a deterministic sorted inventory with `scripts/science-equations/build-source-inventory.py`;
6. use `modelica-msl:release:<tag>:git:<commit>:inventory-sha256:<digest>` as `source_snapshot`.

Changing release, commit, source-file set or bytes creates a new snapshot and a new Internet Archive item. A later release never silently overwrites an earlier one.

## Rights and redistribution

The MSL release is licensed under the BSD 3-Clause License. The official `v4.1.0` `LICENSE` permits redistribution and use in source and binary forms with or without modification subject to retention/reproduction of the copyright notice, license conditions and disclaimer, and the non-endorsement condition.

The Atlas therefore treats scoped MSL `.mo` source-derived occurrences as harvest-ready under `BSD-3-Clause`, while preserving release, commit, source path and hashes. Files outside the scoped library source tree, especially vendored third-party assets, do not inherit this decision automatically and remain excluded unless separately audited.

## Canonical equation lake

The adapter emits JSONL only as transient transport. Persistent outputs remain:

1. `extracted` Apache Parquet/Zstd preserving exact Modelica source and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The shared materializer remains responsible for schema versioning, one-source/one-snapshot batch invariants, deterministic 250,000-row default shards, row counts, byte counts and SHA-256 per shard. Normalization and deduplication stay layered: source-exact, textual, syntax, algebraic, typed-renaming, nondimensional, functional/dynamic and structural-family relations are not collapsed into one equality flag.

After rights and quality gates, permitted Parquets/manifests are published from an external executor through `scripts/science-equations/publish-internet-archive.py` using immutable source+snapshot+stage identifiers, followed by remote metadata/listing, size and checksum verification where exposed. Massive shards never enter Git.

## Reproducible adapter validation in this execution

The new adapter was tested in the available sandbox, outside GitHub Actions:

- `python3 -m py_compile` passed;
- Node regression suite passed `2/2`;
- the fixture exercised ordinary equations, an `if` expression, matrix syntax containing an internal semicolon, conditional equation branches and an `initial equation` section;
- `assert(...)` and `connect(...)` were excluded;
- algorithm `:=` assignment was excluded;
- eight equality occurrences were emitted from the fixture;
- source path, class path, domain, section and branch-control context were retained;
- all rows remained `attested`;
- OCR count was zero;
- reconstruction count was zero;
- occurrence hashes were identical across two different checkout directories.

The official MSL `v4.1.0` source was also inspected at `Modelica/Electrical/Analog/Basic/Resistor.mo` to confirm the real corpus shape: its equation section contains an assertion plus explicit equalities including temperature-adjusted resistance, `v = R_actual*i` and loss power. That inspection is source-contract validation only; individual file observations are not reported as ingestion yield.

## Real corpus yield in this execution

A full source acquisition/materialization did not run. The Jatobá control-plane status call timed out, and the local sandbox has no external DNS. Moving the clone, harvest, Parquet materialization or Internet Archive publication into GitHub Actions would violate the Atlas data-plane policy and was not done.

Measured real-corpus results are therefore:

- external acquisition executor used: none available;
- MSL source objects acquired for lake ingestion: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because bulk acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

Fixture rows, GitHub source inspection and expected corpus size are not counted as yield.

## Coverage gained

The integration adds a source-native engineering lane in which mathematical relations are executable model equations with precise source paths and model context. It materially expands coverage beyond article/textbook equations into reusable physical-system components across electrical, mechanical, thermal, magnetic, fluid and control domains.

It also creates a future reconciliation surface for structural families already present elsewhere in the Atlas: constitutive laws can be compared against Wikipedia/OpenStax attestations, while dynamical relations can be reconciled against BioModels without pretending source-specific syntax is already an algebraically verified equivalence.

## Audit debt

- Run the complete stable MSL release on an external executor and persist the lightweight source/lake manifests.
- Measure equation yield and rejection rates by MSL domain and by `equation` versus `initial equation` section.
- Sample multiline control headers and unusual Modelica syntax to quantify conservative false negatives in the line-oriented control-context tracker.
- Add a later semantic lane, distinct from extracted attestations, if Modelica flattening/type resolution is used to recover inherited units/types or assembled dynamical systems.
- Measure source-exact/textual/syntactic/algebraic deduplication separately before proposing cross-domain families.
- Run `okf-parser` graph inspection after the final bundle is available on an executor with the compatible parser.

## Next data-plane action

On an external executor with internet, PyArrow and Internet Archive credentials:

```text
resolve official stable MSL release tag + exact commit
→ acquire release outside GitHub Actions
→ SHA-256 Modelica/**/*.mo + deterministic inventory
→ harvest attested equality equations
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ rights/quality audit
→ immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight manifest + measured counts back to Git
```
