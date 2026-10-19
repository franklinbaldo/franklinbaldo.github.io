---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate CRAN source packages as a license-filtered corpus for explicit attested mathematics in Rd documentation macros."
updated: "2026-09-24"
---

# CRAN Rd mathematics source integration — 2026-09-24

## State reconstructed from main

This run began from contemporary `main` commit `c4bd8f0efbde1ed7ab0a9463f7104d84663950e7` after reading `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the complete source-descriptor tree and the persisted ingestion manifests.

At source selection time `data/science-equations/sources/` contained sixteen descriptors: BioModels/SBML, EUR-Lex/Formex, GovInfo/eCFR math, IETF RFCXML, two LMFDB lanes, Modelica Standard Library, OEIS, OpenStax osbooks MathML, Physiome/CellML, PMC/JATS, Stack Exchange dump TeX, Wikidata P2534, Wikimedia open-learning math, English Wikipedia math and multilingual Wikipedia math. `data/science-equations/manifests/` contained only `oeis-2026-09-23.json`.

No remembered queue, previous assistant response or transient automation state was used to select the work. The unit of work is the **CRAN source-package corpus**, not an individual statistical formula.

## Why CRAN Rd

CRAN is the canonical distribution network for R and contributed R packages. Its official mirror documentation exposes the repository as a recursively mirrorable tree and documents rsync access at `cran.r-project.org::CRAN`; current source packages live under `src/contrib/` with a repository `PACKAGES` index. This gives the Atlas a bulk acquisition path instead of package-page scraping.

R's official *Writing R Extensions* manual defines two explicit mathematical documentation commands: `\\eqn{latex}{ascii}` for inline formulae and `\\deqn{latex}{ascii}` for displayed equations, with one-argument forms also allowed. Their arguments are treated as verbatim text. This is a precise, source-native attestation surface across a corpus that spans statistics, probability, econometrics, finance, optimization, numerical methods, bioinformatics, machine learning and other quantitative R domains.

Official surfaces used for the source contract:

- <https://cran.r-project.org/>
- <https://cran.r-project.org/src/contrib/>
- <https://cran.r-project.org/src/contrib/PACKAGES>
- <https://cran.r-project.org/mirror-howto.html>
- <https://cran.r-project.org/doc/manuals/r-release/R-exts.html#Mathematics>
- <https://cran.r-project.org/doc/manuals/r-release/R-exts.html#Licensing>

The official manual also requires a `License` field in each package `DESCRIPTION` and documents repository metadata fields such as `License_is_FOSS` and `License_restricts_use`. Rights therefore remain package-level, not corpus-global.

## Source semantics

`scripts/science-equations/harvest-cran-rd.py` consumes externally acquired CRAN source `*.tar.gz` objects and, when supplied, the matching official `src/contrib/PACKAGES` snapshot. It opens package tarballs without installing or executing them and scans only `man/*.Rd` source files.

The extracted lane emits literal `\\eqn{}` and `\\deqn{}` occurrences as **attested** mathematics. For every accepted occurrence the adapter preserves:

- exact first verbatim Rd argument as `expression_original`;
- the complete lexical `\\eqn`/`\\deqn` source macro as `source_markup_original`;
- optional second ASCII argument when present;
- inline versus display form;
- package name and exact version;
- package title, declared license and repository rights metadata when present;
- source-tarball SHA-256;
- exact Rd path and Rd-document SHA-256;
- topic, aliases, nearest tracked Rd section and line range;
- a persistent CRAN package/version locator;
- immutable source/snapshot identity.

The extractor deliberately does **not** treat every R formula-language expression using `~` as an equation. It does not execute package code, examples, `\\Sexpr`, Sweave or R Markdown. It does not infer formulas from prose, OCR rendered manuals, reconstruct algorithms or claim symbolic equivalence at the extracted stage.

## Snapshot identity and bulk acquisition

A production run must be content-addressed and immutable:

1. acquire the official `src/contrib/PACKAGES` snapshot outside GitHub Actions;
2. acquire the selected current source-package tarballs from CRAN or a synchronized official mirror/rsync surface;
3. SHA-256 the index and every acquired tarball;
4. build a deterministic sorted source inventory with package/version/object path/size/hash;
5. use `cran-rd-math:inventory-sha256:<digest>` as `source_snapshot`;
6. retain the lightweight inventory, source descriptor, checksums and later Internet Archive identifiers in Git, never the bulk tarballs or Parquet shards.

The inventory digest, not a wall-clock date, is the snapshot identity. A changed package set, package version, index or byte sequence creates a new snapshot and later a new immutable Internet Archive item.

## Rights and redistribution

The CRAN corpus is classified `license-filtered` because package licenses differ. `DESCRIPTION: License` is preserved verbatim per package/version. Repository-level `License_is_FOSS` and `License_restricts_use` metadata are carried when available.

The adapter fails closed for publication. It sets `redistribution_allowed=true` only when the acquired repository metadata explicitly reports `License_is_FOSS: yes` and `License_restricts_use: no`. A custom `file LICENSE`, missing repository classification, ambiguity or explicit restriction remains local/index-only until audited. Even for redistributable rows, downstream publication must preserve the package-level license and its obligations. CRAN source tarballs themselves are acquisition inputs and are not mirrored into the Atlas Internet Archive item.

## Canonical equation lake

JSONL emitted by the adapter is transient transport only. Persistent outputs remain:

1. `extracted` Apache Parquet/Zstd preserving exact Rd mathematics and provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The shared materializer remains responsible for schema versioning, one-source/one-snapshot batch invariants, deterministic 250,000-row default shards, row counts, byte counts and SHA-256 per shard. Source-exact, textual, syntax, algebraic, typed-renaming, nondimensional, functional/dynamic and structural-family relations remain separate layers; clustering can only propose family candidates.

After rights and quality gates, permitted Parquets/manifests are to be published from an external executor with `scripts/science-equations/publish-internet-archive.py` using immutable source+snapshot+stage identifiers, followed by remote metadata/listing, size and checksum verification where exposed.

## Reproducible adapter validation in this execution

The adapter and regression were exercised in the available sandbox, outside GitHub Actions:

- `python3 -m py_compile` passed;
- the dedicated Node regression suite passed `2/2`;
- fixture package `foo@1.0` exercised inline `\\eqn`, display `\\deqn`, nested TeX braces, an optional ASCII alternative and an Rd comment containing a false-positive math macro;
- three attested occurrences were emitted and the commented macro was ignored;
- the exact LaTeX argument and complete lexical macro were preserved;
- explicit repository metadata `License_is_FOSS=yes` plus `License_restricts_use=no` produced redistributable rows while retaining the package license;
- a second fixture with `file LICENSE` and no explicit repository rights classification failed closed;
- occurrence identity was stable across different executor checkout directories;
- OCR count was zero;
- reconstruction count was zero.

The source contract was researched against the current official R manual, which identified itself as R 4.6.1 dated 2026-06-24 during this run, and the official CRAN mirror HOWTO. These observations are run evidence, not hardcoded mutable state in the adapter.

## Real corpus yield in this execution

A full CRAN acquisition/materialization did not run. `Jatobá.compute_status` timed out, and the available local sandbox could not resolve external DNS and has no PyArrow. The Atlas data plane was **not** moved to GitHub Actions.

Measured real-corpus results are therefore:

- source/corpus integrated: `CRAN source packages / Rd mathematics`;
- source snapshot: not acquired in this run;
- external heavy executor used: none available; local sandbox used only for fixture validation;
- CRAN packages acquired for lake ingestion: `0`;
- real Rd files scanned: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real packages: `0` because bulk acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

Fixture rows and source-contract examples are not counted as ingestion yield.

## Coverage gained

This integration adds a broad statistics-and-computing documentation lane that differs materially from papers, textbooks and executable physical models. Because R packages encode domain-specific quantitative methods in their source documentation, one adapter can surface attested formulas from statistics, econometrics, finance, epidemiology, optimization, numerical analysis, machine learning, bioinformatics and many specialist applied fields.

The optional ASCII alternative in Rd is also useful future normalization evidence: it is another source-attested rendering, not an Atlas-generated reconstruction, and can help compare TeX syntax without discarding the original form.

## Audit debt

- Run a complete or large bounded `src/contrib` snapshot on an external executor and persist the lightweight inventory plus measured package/Rd/formula counts.
- Verify which `PACKAGES` distribution artifact carries `License_is_FOSS` and `License_restricts_use` for the chosen snapshot; keep packages fail-closed where these fields are absent.
- Audit mixed-license publication mechanics so Parquet/IA metadata preserves per-row package obligations rather than pretending the item has one corpus-wide license.
- Measure false negatives from user-defined Rd macros that wrap `\\eqn`/`\\deqn`; do not expand dynamic macros without a reproducible, non-executing parser strategy.
- Add a separate reconstructed lane only if R formula-language objects or documented algorithms are translated with explicit semantics and tests.
- Measure source-exact/textual/syntactic/algebraic deduplication separately before proposing cross-package equation families.
- Run `okf-parser graph` inspection after the branch is available on an executor with the compatible parser.

## Next data-plane action

On an external executor with internet, sufficient scratch, PyArrow and Internet Archive credentials:

```text
snapshot CRAN src/contrib/PACKAGES
→ acquire current source tarballs via official bulk/mirror path
→ SHA-256 index + tarballs and deterministic inventory
→ harvest all literal Rd \\eqn/\\deqn occurrences
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ package-level rights/quality audit
→ immutable Internet Archive upload of permitted derivatives only
→ post-upload metadata/size/checksum verification
→ lightweight manifest + measured counts + IA identifier back to Git
```
