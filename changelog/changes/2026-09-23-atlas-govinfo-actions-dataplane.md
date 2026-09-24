---
type: changelog
date: 2026-09-23
description: Enable a provenance-preserving GitHub Actions execution plane for the GovInfo/eCFR Atlas lane.
tags: [science-equation-atlas, govinfo, ecfr, github-actions, parquet, internet-archive]
---

# Atlas GovInfo/eCFR GitHub Actions data plane

Adds a manually dispatched GovInfo/eCFR pipeline that validates official JSON listings, acquires title XML, content-addresses the source mirror, harvests only attested `<MATH>` blocks, materializes canonical Zstd Parquet, publishes through the fail-closed Internet Archive publisher, and opens a lightweight control-plane PR after verified publication.

The execution boundary changes, not the provenance boundary: OCR and mathematical reconstruction remain excluded from the extracted stage, linked equation graphic bytes are not mirrored, and source XML/Parquet data do not enter Git history.
