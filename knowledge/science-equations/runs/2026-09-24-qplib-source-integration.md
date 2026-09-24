---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate QPLIB as a harvest-ready optimization source lane for mechanically reconstructed objectives and constraints from native sparse quadratic-program models."
updated: "2026-09-24"
---

# QPLIB bulk quadratic-program source integration — 2026-09-24

## State reconstructed from main

This run reread the contemporary `main` versions of `docs/science-equation-atlas-routine.md` and `docs/science-equation-atlas-sources.md`, inspected `knowledge/science-equations/`, the persisted source descriptors, and the ingestion manifests before selecting work. The selection base was `main` commit `34f5671713bace28e228e41d8b76b7c4aa671da3`.

QPLIB was absent from the integrated source descriptors and repository code at selection time. `data/science-equations/manifests/` contained only the persisted OEIS manifest. The unit of work is the **complete QPLIB corpus**, not an individual optimization formula.

## Why QPLIB

QPLIB is an official bulk library of continuous and discrete quadratic programming instances. The current official site reports 319 discrete plus 134 continuous final instances (453 total), selected from 8,164 submitted instances, and exposes a single `qplib.zip` archive in addition to per-instance views.

This source adds a domain that was not represented by a source-native Atlas lane: operations research and mathematical optimization. Its native models contain objective functions, linear/quadratic constraints, bounds, mixed-integer domain information, and optimization sense. Several QPLIB instances have very large constraint systems, so one corpus acquisition can yield far more mathematical occurrences than the number of model files.

Official/current surfaces used for this contract:

- <https://qplib.zib.de/>
- <https://qplib.zib.de/qplib.zip>
- <https://qplib.zib.de/instances.html>
- <https://qplib.zib.de/statistics.html>
- <https://qplib.zib.de/doc.html>

The official site was last observed in this run with an update dated 2026-09-14 and states that QPLIB has been licensed under CC-BY 4.0 since 2021-08-30.

## Attested versus reconstructed semantics

The `.qplib` instance format attests sparse coefficient data, bounds, problem type, optimization sense, and related typed metadata. It does **not** contain an infix objective or constraint string verbatim.

Therefore every mathematical occurrence emitted by this lane is `reconstructed`:

- `expression_original` is null;
- `expression_reconstructed` contains the mechanical serialization;
- `source_attested_payload` preserves the source-native model metadata needed to identify the coefficient/bound record;
- the transformation is named `qplib-native-sparse-model-v1`;
- the source file SHA-256 and logical QPLIB locator are retained.

This prevents a generated formula from being misrepresented as original notation. The reconstruction follows the QPLIB documentation directly: objective and general constraints use `1/2 * x^T Q x + b x`, Q matrices are stored by lower triangle, objective constant is retained, and constraint lower/upper bounds are emitted without solving or simplifying the model.

The shared occurrence validator was extended compatibly so reconstructed rows may store `expression_reconstructed` while attested rows still require `expression_original`. Legacy reconstructed rows that already use `expression_original` remain accepted.

## Adapter and scale behavior

`scripts/science-equations/harvest-qplib.py` accepts one native `.qplib` file or a directory tree extracted from a verified `qplib.zip`. It parses sections conditionally from the three-character QPLIB problem type and fails closed on malformed indices, invalid lower-triangle terms, invalid variable types, unexpected EOF, or trailing data.

To keep the adapter viable for large QPLIB instances, quadratic and linear coefficient sections are spooled into a temporary disk-backed SQLite database. Constraint occurrences are then streamed in index order instead of loading the full coefficient graph into RAM. Temporary file location never participates in logical occurrence identity.

The current extracted lane emits:

1. one reconstructed objective occurrence per model;
2. one reconstructed occurrence per general constraint;
3. variable bounds and integrality/domain information as typed model context, not separate occurrences yet.

The third choice avoids exploding the raw lake with trivial one-variable relations before a dedicated structural rule is defined; those source facts remain available for later reconstruction.

## Snapshot identity and acquisition

The external executor must use the official bulk archive rather than page-by-page scraping:

1. download `https://qplib.zib.de/qplib.zip` outside Git;
2. SHA-256 the exact archive bytes;
3. extract the native `.qplib` members outside Git;
4. SHA-256 every member and record member sizes;
5. build a deterministic sorted inventory with `build-source-inventory.py`;
6. use `qplib:inventory-sha256:<digest>` as `source_snapshot`.

A changed archive or member produces a new immutable snapshot/Internet Archive item. Calendar dates or mutable website update labels are metadata, not sufficient snapshot identity.

## Rights and storage

The QPLIB site states that the library is CC-BY 4.0. Parquet derivatives therefore preserve QPLIB attribution, source URL, snapshot checksum, and citation metadata. A future conflicting rights notice fails closed rather than being ignored.

Git stores only code, descriptors, runs, manifests, checksums, and Internet Archive identifiers/URLs. Canonical bulk storage is `extracted`, `normalized`, and `deduplicated` Apache Parquet/Zstd. JSONL from the adapter is transient transport only.

## Reproducible validation in this execution

The available sandbox, outside GitHub Actions, executed the source adapter against synthetic native-format fixtures covering:

- `QCL` with a quadratic objective and linear general constraints;
- `QGQ` with quadratic general constraints and explicit variable-type overrides;
- `QBN` with binary variables and no general constraints;
- fail-closed rejection of an invalid upper-triangle Q entry.

Results:

- Python syntax compilation passed;
- Node adapter regression suite passed `3/3`;
- valid fixtures emitted 3 objectives and 3 constraints;
- every emitted occurrence was `reconstructed`;
- every emitted occurrence had `expression_original = null` and non-empty `expression_reconstructed`;
- source-record hashes were stable across different temporary checkout roots;
- the shared occurrence materializer accepted the reconstructed fixture stream in `--validate-only` mode.

Fixture occurrences are test evidence only and are not corpus yield.

## Real corpus yield in this execution

The official bulk archive could not be acquired by the available sandbox, and the Jatobá compute endpoint timed out. The run did not move acquisition or Parquet generation into GitHub Actions.

Measured real-corpus results are therefore:

- external acquisition executor used: none available;
- QPLIB archives acquired: `0`;
- QPLIB native members acquired: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because real acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

The official source's current 453-model cardinality is source metadata, not an ingestion count.

## Coverage gained

The Atlas now has a bulk source contract for optimization mathematics: objectives, inequalities/equalities, sparse quadratic forms, mixed-integer model context, and constraint systems from real benchmark models. This creates a strong future reconciliation surface for structural families such as quadratic objectives, quadratic constraints, box/domain constraints, and optimization forms without pretending that the generated infix serialization was present in the source.

## Audit debt

- Run the complete `qplib.zip` acquisition on an external executor with network, PyArrow, and Internet Archive credentials.
- Spot-check parser fidelity across every QPLIB problem-type family represented in the acquired snapshot, using the source metadata/statistics as an independent count surface.
- Measure objective/constraint occurrence counts, rejection counts, term-count distributions, and very-large-row behavior on real files.
- Decide, with a reproducible rule, whether variable bounds and integrality/domain declarations should become their own reconstructed occurrence lane.
- Run non-destructive normalization and layered deduplication separately from extraction.
- Run `okf-parser graph` inspection on the final bundle. Jatobá was unavailable and the local sandbox did not expose the parser binary in this execution; repository control-plane validation can check conformance but is not represented as a graph run here.

## Next data-plane action

```text
official qplib.zip
→ archive SHA-256
→ deterministic .qplib member inventory
→ qplib:inventory-sha256:<digest>
→ objective + general-constraint reconstruction
→ extracted Parquet/Zstd
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ attribution/quality audit
→ immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight manifest + measured counts back to Git
```
