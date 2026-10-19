---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate the Physiome Model Repository CellML corpus as a license-filtered lane for attested Content MathML from version-pinned physiological models."
updated: "2026-09-24"
---

# Physiome CellML source integration — 2026-09-24

## State reconstructed from main

This run began from contemporary `main` commit `2390411366aa77d15c4b86e913fea4af62bcce8e` after reading `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the complete source-descriptor tree and the persisted ingestion manifests.

At selection time `data/science-equations/sources/` contained fifteen descriptors: BioModels/SBML, EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, LMFDB elliptic curves over Q, LMFDB number fields, Modelica MSL, OEIS, OpenStax osbooks MathML, PMC/JATS, Stack Exchange data-dump TeX, Wikidata P2534, Wikimedia open-learning math, English Wikipedia math and multilingual Wikipedia math. `data/science-equations/manifests/` contained only `oeis-2026-09-23.json`.

No branch, automation-memory queue or remembered transient state was used to choose the work. The unit of work is the **Physiome Model Repository CellML corpus**, not an individual physiological equation.

## Why Physiome CellML

The official Physiome Model Repository exposes published model workspaces with version-control clone URIs, and the CellML project describes the repository as containing hundreds of CellML model workspaces. The corpus spans cardiovascular circulation, calcium dynamics, electrophysiology, endocrine systems, gene regulation, metabolism, neurobiology, PKPD, signal transduction, mechanical constitutive laws and other quantitative physiology domains.

CellML is especially valuable to the Atlas because its mathematics is source-native. CellML 1.x and 2.0 embed Content MathML in model components; CellML 2.0 specifies that direct children of a component's MathML `math` element are mathematical statements that hold in the model. These are therefore `attested` occurrences, not equations reconstructed from prose or simulation output.

Official surfaces used for the source contract:

- <https://models.physiomeproject.org/>
- <https://models.physiomeproject.org/cellml>
- <https://www.cellml.org/tools/pmr/>
- <https://www.cellml.org/specifications/cellml_2.0/>
- <https://www.cellml.org/specifications/cellml_1.0/>

## Source semantics

`scripts/science-equations/harvest-physiome-cellml.py` consumes a root containing externally acquired, version-pinned PMR workspace checkouts and a lightweight audited workspace manifest. It walks `.cellml` source objects and emits every explicit MathML `<math>` block whose lexical and XML-parser views agree.

For each occurrence the adapter preserves:

- the exact lexical MathML source substring;
- source snapshot, workspace id and exact workspace commit;
- repository-relative CellML path and SHA-256 of the source bytes;
- model and nearest CellML component identity;
- directly referenced MathML `ci` variables;
- explicitly declared CellML variable units, initial values and interface metadata when present;
- workspace/exposure source URL;
- per-workspace rights status and license evidence;
- whether the row is allowed to cross the redistribution gate.

All emitted expressions are `attested`. The adapter does not flatten CellML imports or connections, synthesize a global ODE system, translate rendered plots, perform OCR, normalize algebraically or assert equation families at extraction time.

## Snapshot and acquisition contract

A real batch is content-addressed rather than date-addressed:

1. enumerate the official PMR CellML corpus and select workspaces according to the run policy;
2. resolve each selected workspace's official clone URI and exact Git commit;
3. record a rights decision/evidence for every selected workspace or exposure;
4. acquire those workspaces outside GitHub Actions;
5. SHA-256 every included `.cellml` object;
6. build a deterministic sorted inventory over workspace, commit, path, size and checksum;
7. use `physiome-cellml:inventory-sha256:<digest>` as `source_snapshot`.

Changing workspace membership, commits, files or bytes creates a new snapshot and a new immutable publication item. Local checkout paths never participate in logical occurrence identity.

## Rights and redistribution

PMR presents a genuine rights ambiguity that must not be flattened. Some license/citation pages state that the work is CC BY 3.0 and also describe publicly accessible repository content as CC BY 3.0, while other individual items report that their terms of use/license are unspecified even while showing the same repository-level citation instruction.

The lane is therefore `license-filtered`, not globally `harvest-ready` for republication. The acquisition manifest assigns each workspace `redistributable`, `unverified` or `restricted`. Only the first class, with an explicit license and evidence URL, may be selected for Internet Archive publication. Unverified/restricted rows may remain in local analysis/index layers but fail closed at the redistribution boundary.

## Canonical equation lake

JSONL emitted by the adapter is transport only. Persistent stages are:

1. `extracted` Apache Parquet/Zstd preserving exact MathML, workspace commit, source checksum, variables/units and rights provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The shared materializer remains responsible for schema versioning, one-source/one-snapshot invariants, deterministic default shards of 250,000 rows, row/byte counts and SHA-256 per shard. Deduplication remains layered; exact/textual/syntactic/algebraic/typed-renaming/nondimensional/functional/dynamic/structural-family relations are not collapsed into a single equivalence field.

Only rights-approved shards may be published from an external executor through `scripts/science-equations/publish-internet-archive.py`, followed by remote metadata/listing, size and checksum verification where the service exposes it. Massive source objects or Parquet shards never enter Git.

## Reproducible validation in this execution

The adapter was exercised in the available sandbox, outside GitHub Actions:

- Python syntax compilation passed;
- the Node regression suite for the adapter passed `2/2`;
- a synthetic CellML 2.0 model yielded two explicit MathML occurrences, including a differential equality and a relational expression;
- exact lexical MathML was preserved;
- model/component context and directly referenced variables/declared units were retained;
- a workspace explicitly marked `redistributable` propagated CC BY 3.0 and `redistribution_allowed=true`;
- the same fixture marked `unverified` failed closed with `redistribution_allowed=false` and `source_license=UNVERIFIED`;
- source-record hashes were identical across two different checkout directories;
- OCR count was zero and reconstruction count was zero.

Fixture rows are validation only and are not reported as corpus yield.

## Real corpus yield in this execution

A full corpus acquisition/materialization did not run. The Jatobá control-plane status call timed out, while the available sandbox has no external DNS and no PyArrow. Moving repository clones, corpus extraction, Parquet generation or Internet Archive upload into GitHub Actions would violate the Atlas data-plane policy and was not done.

Measured real-corpus results are therefore:

- external acquisition executor used: none available;
- PMR workspaces acquired for lake ingestion: `0`;
- CellML source objects acquired: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because bulk acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

## Coverage gained

This lane adds source-native, executable mathematical models of physiology and biomedicine beyond article prose and beyond SBML reaction-network semantics. It opens direct attested coverage for electrophysiology, circulation, mechanics, endocrine systems, metabolism, signaling, PKPD and related areas, with explicit variable/unit information from the model source.

It also creates a high-value reconciliation surface with BioModels/SBML and PMC/JATS: the same scientific model can later be compared across executable CellML, executable SBML and paper mathematics without claiming equivalence merely from an embedding or name match.

## Audit debt

- Run the official PMR corpus enumeration and version-pinned workspace acquisition on an external executor.
- Persist the lightweight audited workspace/source inventory and measured row counts after the first real batch.
- Quantify CellML 1.0/1.1/2.0 coverage and rejection rates separately.
- Audit workspace/exposure rights conflicts before any Internet Archive publication and keep unresolved objects out of redistributed shards.
- Measure imported-component and connection-heavy models before designing a distinct `reconstructed` flattening lane.
- Run layered source-exact/textual/syntactic/algebraic deduplication before proposing cross-format families with BioModels.
- Run `okf-parser graph` inspection on an executor with the compatible parser; the current external executor was unavailable during this run.

## Next data-plane action

On an external executor with internet, Git, PyArrow and Internet Archive credentials:

```text
official PMR CellML listing
→ workspace clone URI + exact commit + rights evidence
→ deterministic .cellml SHA-256 inventory
→ attested lexical MathML harvest
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ rights-filtered immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight manifests + measured counts back to Git
```
