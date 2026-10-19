---
type: Finding
title: "VASCO E0: APPLAUSE DR4 TAP availability with bounded probes"
description: "Real read-only Colab CPU test differentiating HTTP content negotiation from TAP source-query availability."
status: exploratory
research_front: vasco-historical-transients-falsification
timestamp: 2026-10-18
tags: [vasco, e0, applause, tap, source-provenance, negative-controls]
---

# APPLAUSE TAP diagnostics — bounded query pilot

## Objective

Distinguish a malformed HTTP client negotiation from TAP service errors and from scientific nondetections. Only fixed, read-only and row-limited queries are permitted by this probe.

## Executed validation and provenance

Executed on free Google Colab CPU, with Jatobá exclusively a lightweight CLI bridge. Exact code commit: `4babf6447f0573758b3748c4c7ec38f1d133d23f`; `tap_probe.py` SHA-256 `a1eb9454bcef2d71e83fcf30c7dbe9243c5e7062270ce3c1ad66c09bce410d04`.

The first version supplied HTTP header `Accept: application/x-votable+xml`; **both** requests returned HTTP **406**, not source absences. Each 338-byte error response SHA-256: `efe3ea536b132638c57b86812daa909e868e748b2711352d20611fc819b0c785`.

After removing the restrictive `Accept` header, both requests succeeded and returned valid `QUERY_STATUS=OK` VOTable responses.

| Read-only query | HTTP | Bytes | Raw response SHA-256 |
|---|---:|---:|---|
| `TAP_SCHEMA.tables` top-1 smoke | 200 | 1534 | `d1f06548dd1c3bcfb5cdd5712179a9d06b7e78560fec462c551fcddcdd3530c5` |
| `applause_dr4.source_calib` top-1, plate 7538, specified Gaia ID | 200 | 2300 | `cab47bba48e4f1bf5195fdd4da4445391fdd90f3ad90bf0c0aa53815daaa923c` |

The generated local Finding on the successful run had SHA-256 `5615ad26c252da2b63bb9c37ce7739ff4c62beff0d8f298adc5584653b873790`; it includes an execution timestamp and hashes of each actual network response.

## Validation gates

- **PASS:** eight Python unit tests in `tests/test_tap_probe.py` (including malformed VOTable, TAP timeout and network failure); run return code 0.
- **PASS:** two fixed live TAP probes with HTTP 200 and `QUERY_STATUS=OK`, response bytes hashed.
- **FAIL (first run, resolved):** HTTP 406 due to restrictive `Accept` header; corrective code committed and rerun.
- **NOT_RUN:** full or unbiased survey harvest, catalog completeness, Gaia proper-motion epoch validation, photometric source authenticity, image-level transient identification.
- **Scientific interpretation:** A functioning TAP endpoint with one selected source-query response is **not** evidence that bulk extraction is feasible. Statement timeouts from previous ADQL queries remain unexplained by this experiment. A network error is never a physical nondetection.

## Next discriminating experiment

Add a frozen, bounded and indexed small-window catalog extraction with deterministic provenance, verify actual nonempty rows and source identity, then feed the exact bytes into `run.py` and independently into `experiment_harvest.py`. Check actual completeness and repeat against the same field. Review privacy, cost, and source/archive license before expanding. Preserve all negative tests.

## Relationship to earlier work

This tests **TAP availability and HTTP behavior**, not the earlier 2,500-source archived replay recorded separately in [PR #2385](https://github.com/franklinbaldo/franklinbaldo.github.io/pull/2385). It does not modify or supersede the existing replay report.
