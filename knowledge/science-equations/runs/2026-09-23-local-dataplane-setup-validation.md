---
type: science-atlas-run
date: "2026-09-23"
mode: "local data plane setup and validation"
summary: "Establish and validate the local data plane environment for the Scientific Equation Atlas without GitHub Actions: toolchain verified, source descriptors added, doctor preflight implemented, PMC JATS bug fixed, Parquet materialization validated end-to-end against a real PMC article slice, and fail-closed Internet Archive publishing contract verified."
updated: "2026-09-23"
---

# Local Data Plane Setup and Validation — 2026-09-23

## Goal of this execution

This execution did not add an isolated formula or adapter. It prepared and fully validated the local data plane environment of the **Scientific Equation Atlas**, decoupling acquisition, transformation, Parquet materialization, and Internet Archive publication from GitHub Actions.

GitHub Actions remains exclusively a control plane for code, specs, lightweight manifests, checksums, documentation, PR checks, and merges.

## Environment audit and toolchain setup

1. **Node.js**:
   - `v24.16.0` (exceeds `>=24.0.0` engine requirement).
   - Package dependencies fully restored via lockfile (`npm ci`).

2. **Python & libraries**:
   - Python `3.13.15`.
   - `pydantic 2.13.5` (v2 compliant).
   - `pyarrow 25.0.1` (Zstd compression and Parquet table writer).
   - `internetarchive 5.11.1` providing `ia` CLI (`5.11.1`).
   - `truststore 0.10.4` injected for native Windows certificate authority validation (resolving expired Python bundle roots for Wikimedia/dumps endpoints).
   - Python dependencies declared in `scripts/science-equations/requirements.txt`.

3. **OKF Toolchain**:
   - `okf-parser 0.45.9` verified and functioning locally.
   - Tested normative check: `okf-parser check knowledge/science-equations --require-spec '../../specs/okf-types/{slug}.md' --normative-spec`.
   - Returned 55 concepts, conformant: true, 0 diagnostics.

4. **GitHub access & remotes**:
   - Authenticated via `gh` CLI (account `franklinbaldo`).
   - Git remote verified clean without embedded tokens (`origin: git@github.com:franklinbaldo/franklinbaldo.github.io.git`).

5. **External data root**:
   - External directory created outside Git working tree: `C:\Users\frank\data\scientific-equation-atlas/` with subdirectories `downloads`, `work`, `parquet`, `manifests`, `logs`.
   - Low disk space on drive C (~300 MB) was diagnosed and handled; doctor tool alerts when disk space is constrained so large multi-gigabyte dumps are processed via streaming or offloaded.

## Adapter improvements & source descriptors

1. **`scripts/science-equations/harvest-pmc-jats.mjs`**:
   - Fixed CLI argument validation bug where omitting `--limit` caused `args.limit` (`Infinity`) to fail `Number.isFinite()`, preventing execution of unrestricted harvests.
   - Now safely supports both bounded (`--limit N`) and unbounded streaming.

2. **`scripts/science-equations/materialize-parquet.py`**:
   - Improved `iter_rows()` to handle input encoding robustly (detecting UTF-16LE produced by Windows PowerShell redirection `>` as well as UTF-8 / UTF-8 with BOM).

3. **Source descriptors**:
   - `data/science-equations/sources/oeis.json`: source descriptor for OEIS formula lines (%F), CC-BY-SA 4.0 license, and Parquet lake mapping.
   - `data/science-equations/sources/wikidata-p2534.json`: source descriptor for Wikidata P2534 defining formulas, CC0 1.0 license, and dump streaming lane.
   - Preserved existing `data/science-equations/sources/pmc-jats.json`.

4. **Policy alignment**:
   - Aligned `docs/science-equation-atlas-routine.md` to state unambiguously that Apache Parquet is the canonical storage format for the Atlas lake, while JSONL/CSV are transient transport only.

## Reproducible doctor preflight

Created `scripts/science-equations/doctor.py` and npm script `npm run atlas:doctor`.

The doctor automatically:

- Checks Node >= 24, Python >= 3.10, Pydantic v2, PyArrow, `ia` CLI, `okf-parser`, git remote hygiene, and GitHub auth.
- Audits external storage paths and available disk space.
- Inspects available bulk tools (`curl.exe`, `7z`, `duckdb`, `aws`, `psql`, `rsync`).
- Dynamically discovers all integrated sources from `data/science-equations/sources/*.json` and tests live endpoint reachability without downloading bulk corpora.
- Reports Internet Archive credential status (`IA_ACCESS_KEY_ID` / `IA_SECRET_ACCESS_KEY`) without leaking secret values.

## Smoke & end-to-end validation with real PMC slice

1. **Live retrieval**:
   - Acquired real open-access JATS XML from PMC Open Data Cloud Service (`PMC10280224.1.xml`, PeerJ Computer Science, CC-BY 4.0).
2. **Extraction**:
   - Extracted 11 attested display formulas with document provenance, equation locators (`eqn-1` through `eqn-11`), TeX encoding, context text, and SHA-256 hashes.
3. **Parquet materialization**:
   - Validated occurrence stream with Pydantic (`OccurrenceV1`).
   - Materialized canonical Zstd Parquet shard `extracted-00000.parquet` (22,282 bytes, 11 rows) and deterministic manifest `manifest.json`.
   - Verified PyArrow schema, 11 rows, and SHA-256 checksum (`ad2035e0c9d592fd32c0806a005fd795a6ec2e9110a6b9410f6b19bd293a9ea4`).
4. **Internet Archive publication contract**:
   - Tested `scripts/science-equations/publish-internet-archive.py`.
   - Confirmed fail-closed behavior: publisher safely aborts when `IA_ACCESS_KEY_ID` and `IA_SECRET_ACCESS_KEY` are absent, refusing to simulate publication or silently overwrite data.
   - Tested public metadata API reachability (HTTP 200).

## Local verification gates

- `npm run atlas:doctor`: all core data plane components reported READY.
- `node --test src/data/science-equations*.test.js`: 12/12 unit tests passing (doctor, OEIS, PMC JATS, Wikidata).
- `okf-parser check knowledge/science-equations`: 55 concepts conformant, 0 diagnostics.
- `npm run format:check`: 100% formatted.
- `npm run lint`: 0 errors.
- `npm run check:hygiene`: all checks clean.
- `npm run build`: successful production build (3,256 pages generated).
