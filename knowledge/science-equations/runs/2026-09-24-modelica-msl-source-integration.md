---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate the Modelica Standard Library as a harvest-ready source lane for explicit attested equation-section mathematics across multi-domain engineering models."
updated: "2026-09-24"
---

# Modelica Standard Library equation source integration — 2026-09-24

## State reconstructed from main

This run was selected after reading the contemporary `main` versions of `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the persisted source descriptors, and the ingestion manifests.

At selection time `main` contains thirteen source descriptors: BioModels SBML MathML, EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, OEIS, OpenStax osbooks MathML, PMC/JATS, Stack Exchange data-dump TeX, Wikidata P2534, English Wikipedia math tags, and multilingual Wikipedia math tags. `data/science-equations/manifests/` contains only the persisted OEIS manifest.

The unit of work in this run is the **Modelica Standard Library corpus**, not an individual component or equation.

## Why Modelica Standard Library

The Modelica Standard Library is the official free library developed with the Modelica language. It contains standardized components across mechanical, electrical, magnetic, thermal, fluid, control, state-machine, clocked and other cyber-physical domains. Modelica models are mathematically defined by equations rather than an imperative assignment order, making the source tree a high-precision corpus of engineering mathematics.

Official surfaces used for this integration contract:

- <https://github.com/modelica/ModelicaStandardLibrary>
- <https://github.com/modelica/ModelicaStandardLibrary/releases>
- <https://modelica.org/libraries/>
- <https://specification.modelica.org/maint/3.7/equations.html>

The latest stable GitHub release observed during this run is `v4.1.0` (published 2025-05-23), resolving to commit `8ae3d35c24e519cb2996cab20f3b13daf2b0c50a`. This is run evidence only, not a hardcoded mutable state in the adapter: future executions must resolve the source state from the official release/ref they actually acquire.

## Source semantics

`scripts/science-equations/harvest-modelica-msl.py` accepts the `Modelica/` directory from an exact Modelica Standard Library checkout and requires both the pinned 40-hex commit and a content-addressed source snapshot.

For each `.mo` source file it:

1. computes SHA-256 over the exact source bytes;
2. masks strings and line/block comments without changing offsets or line boundaries;
3. enters explicit `equation` and `initial equation` sections only;
4. excludes `algorithm`/`initial algorithm` sections, comments, strings and annotations;
5. emits source equation leaves through their terminating semicolon;
6. preserves the exact lexical Modelica statement in `expression_original`;
7. records initial-vs-normal section, repository path, exact line/offset range, nearest Modelica class and `within` package context;
8. retains enclosing `if`/`elseif`/`else`, `when`/`elsewhen` and `for` control context separately so branch conditions are not lost;
9. classifies explicit equality, connect, reinit, assert, terminate and function-call equation forms without rewriting them;
10. constructs logical occurrence identity independently of the executor's checkout directory.

Every emitted row is `attested`. The extracted stage does **not** flatten the model, solve for variables, expand connector equations, perform symbolic algebra or turn an algorithm assignment into a reconstructed equation.

This first Modelica lane deliberately excludes declaration/binding/modification equations. Modelica recognizes those as equation categories too, but adding them safely requires a distinct tested extraction contract so parameter defaults and modifications are not silently conflated with equation-section mathematics.

## Rights and redistribution

The Modelica Standard Library repository is distributed under the 3-Clause BSD License. The external acquisition inventory must include the exact `LICENSE` bytes associated with the selected release/commit, and published derivatives retain source/release/commit provenance.

The rights gate remains fail-closed at object level: if a selected release contains an object carrying a conflicting explicit rights notice, that object is held for audit instead of assuming repository-level licensing overrides it.

Raw release archives/checkouts do not belong in Git. The Atlas publishes only permitted Parquet derivatives/manifests to the Internet Archive from an external executor.

## Snapshot identity

The external executor must create a content-addressed snapshot:

1. resolve the official MSL release/ref to an exact Git commit;
2. acquire the release archive or exact checkout outside GitHub Actions;
3. verify the acquired source/ref;
4. inventory `LICENSE` plus the production `Modelica/**/*.mo` tree;
5. record relative path, bytes and SHA-256 for every object;
6. sort the inventory deterministically with `scripts/science-equations/build-source-inventory.py`;
7. use `modelica-msl:git:<commit>:inventory-sha256:<digest>` as `source_snapshot`.

The adapter independently requires `--commit` and fails closed when the commit embedded in `source_snapshot` does not match it. Any changed commit, file set or bytes creates a new immutable snapshot and Internet Archive item rather than replacing an earlier publication.

## Canonical equation lake

JSONL emitted by the adapter is transient interoperability transport only. Persistent bulk data remains:

1. `extracted` Apache Parquet/Zstd preserving exact Modelica source and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The common materializer validates `science-equation-occurrence-v1`, keeps one source/snapshot per batch, defaults to 250,000 rows per shard, and writes manifests with row count, bytes and SHA-256 per shard.

Normalization and deduplication stay layered. In particular, textual/syntactic normalization must not be confused with Modelica flattening. Future structural work may compare equations after typed renaming, unit-aware normalization, nondimensionalization, functional/dynamic equivalence or shared constitutive operators, but a strong relation requires a reproducible transformation.

## Reproducible adapter validation in this execution

The adapter and fixture were executed in the available sandbox, outside GitHub Actions:

- Python syntax compilation passed;
- Node regression suite passed `3/3`;
- one synthetic Modelica file yielded seven explicit records spanning an initial equation, ordinary equality equations, an if/else branch, a connect equation and a when/reinit equation;
- equation-looking text in a line comment and string was excluded;
- the algorithm-section `:=` assignment was excluded;
- exact lexical equation statements were preserved;
- branch/loop control context was retained;
- all emitted rows remained `attested`;
- OCR count was zero;
- reconstruction count was zero;
- flattening count was zero;
- logical occurrence hashes were stable across different temporary checkout roots;
- a snapshot/commit mismatch failed closed.

Fixture rows are test evidence only and are not counted as corpus yield.

## Real corpus yield in this execution

A real data-plane run could not be completed in this execution. The Jatobá compute endpoint timed out, while the available local sandbox cannot resolve external hosts and does not contain a checkout of the MSL corpus. Moving acquisition, Parquet generation or Internet Archive publication into GitHub Actions was explicitly rejected by the Atlas operating policy.

Therefore the measured real-corpus results for this run are:

- external acquisition executor used: none available for bulk acquisition;
- MSL source objects acquired: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because bulk acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

No search-result count, source-file snippet, fixture row or expected corpus cardinality is reported as ingestion yield.

## Coverage gained

This integration adds source-native, executable engineering mathematics spanning multi-domain physical systems rather than another prose/document corpus. It creates a strong reconciliation surface for constitutive laws, circuit equations, mechanical/thermal/fluid balances, control laws and dynamical models already encountered in textbooks, scientific papers and regulatory engineering sources.

Because Modelica source retains package/class/component context, later family discovery can compare mathematically similar structures without discarding their engineering type/domain.

## Audit debt

- Run the complete stable MSL release on an external data-plane executor and persist the lightweight source inventory plus measured extraction counts.
- Sample equation-section constructs across mechanical, electrical, fluid, thermal, state-machine and clocked packages to measure the lexical parser's coverage.
- Add a separate tested lane for declaration/binding/modification equations if their yield justifies the additional ambiguity.
- Audit unusual equation forms and nested control constructs before any strong semantic-family assertions.
- Run normalization/deduplication on real Modelica equations and measure source-exact, textual and syntax-aware collapse separately.
- Run `okf-parser` graph inspection on the final bundle. The local sandbox lacks the parser installation and Jatobá was unavailable during this execution; repository OKF validation may run as a control-plane check, but that is not represented as a completed graph run.

## Next data-plane action

On an external executor with network, PyArrow and Internet Archive credentials:

```text
official MSL stable release/ref
→ exact commit resolution
→ release/check-out acquisition outside GitHub Actions
→ LICENSE + Modelica/**/*.mo SHA-256 inventory
→ Modelica equation-section harvest
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ rights/quality audit
→ immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight manifest + measured counts back to Git
```
