---
type: Finding
title: "VASCO E0 first fresh indexed APPLAUSE source batch verified by the committed Gaia runner"
description: "Eight real catalog rows from a new, live bounded indexed TAP query, distinct from the 36-row archived fixture and 2500-row archived replay."
status: exploratory
research_front: vasco-historical-transients-falsification
timestamp: 2026-10-18
tags: [vasco, e0, applause, gaia, source-provenance]
---

# First newly queried Hamburg catalog records

## Source and selection

- Source: [APPLAUSE DR4](https://doi.org/10.17876/plate/dr.4/13), TAP endpoint `https://www.plate-archive.org/tap/sync`, table `applause_dr4.source_calib`.
- New **live** synchronous ADQL request on 2026-10-18, `TOP 24`, `plate_id=7538`, and `gaiaedr3_id IN (...)` for **eight explicitly chosen Gaia identifiers** already known from prior Vatican/Hamburg controls.
- The request returned HTTP 200, 8,664 bytes of VOTable, SHA-256 **`6f31690e5fb4a122bf6aec9e21e63db24ac55f88198072d1d7e73569e3494ac5`**. Parsed 16 rows across Hamburg scans 9720 and 9721.
- The eight rows for scan 9720, selected by exact scan ID, are frozen in [`fixtures/hamburg_7538_fresh_indexed_8.csv`](../fixtures/hamburg_7538_fresh_indexed_8.csv). Exact canonical CSV bytes **754**; SHA-256 **`4112cab0b6a06192fe84f94adc7c165390ef589708a5aaa5517b1dff7309b638`**. Eight unique source IDs.
- This sample is **deliberately Gaia-ID selected**. A 0 count of no-Gaia candidates is a consequence of selection and offers **zero evidence** about missing Gaia associations or physical transients. The two scans come from the *same photographic plate*, not independent astronomical exposures.

## Actual code execution and reconciliation

Executed on free Colab CPU, Jatobá only as lightweight CLI transport. Production runner and independent harvester were downloaded from exact public blog `main` commit **`b4d936e5b6cd1f7d3e0249c7b638a632ea491f23`**, then run against the *new* canonical CSV.

| Result class | Number |
|---|---:|
| `gaia_clean` | 6 |
| `no_gaia_clean` | 0 |
| `review` | 2 |
| Total | **8** |

- Runner return code: **0 / PASS**.
- Independent harvester return code: **0 / PASS**, identical counts.
- Result `classifications.csv` SHA-256: `5152ba1d2a0f49cba0d9d10b0704a6cc89dc34ac223158a02f8af41cb2038db4`.
- Runner SHA-256: `eddf6da1ec299c96736a37c0bbaca9a88afd18eb0e5f07d021fd0e9e2b4b14e0`.
- Run identity: `03b9395b52b8087df15ff9fb1b3381a953d1b56e3436481b35e56dcf98f7dda4`.
- Recorded environment: Python 3.13.16 on Colab CPU.
- No code modification to `run.py`; this validates its compatibility with a new real indexed source batch, not catalog completeness.

## Important negative controls and limits

- The source catalog's `sextractor_flags` were simply accounted for; Gaia IDs came directly from upstream crossmatch. There was **no new independent Gaia astrometric matching**, proper-motion propagation, pixel-level confirmation, PSF fit, injection/recovery or matched exposure sensitivity.
- The source query is small and indexed, so this **does not resolve** earlier statement timeouts for large/broad sky-area extraction.
- HTTP or TAP errors **must never** become presumed nondetections.
- The full original raw VOTable response SHA is retained above, but the raw VOTable bytes are not committed here; precise bytewise reproduction requires fetching/archiving that source payload separately.

## Decision

**PASS** for a genuinely new, bounded and source-hashed real APPLAUSE batch processed by the committed runner. **NOT_RUN** for full-plate census, no-Gaia discovery, independent image transient identification and physical interpretation.

**Next:** establish reliable bounded *spatial* or `source_id`-keyed paging that samples both Gaia-matched and unmatched entries without conditioning on Gaia ID, frozen with original raw VOTable bytes and completeness checks. Extend matching to the second scan only as a replication of digitization and then to Vatican for independent exposures.
