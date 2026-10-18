---
type: changelog
date: 2026-10-18
description: Verify three frozen archived IDs directly against official APPLAUSE with a bounded query.
tags: [experiments, reproducibility, security]
---

# Bounded official-source verification

- Uses fixed source IDs, official HTTPS endpoint, 25-second timeout, 100KB cap and no redirects or retries
- Preserves raw VOTable, query, normalized CSV, provenance and failures
- Requires exact normalized digest matching the previously archived three records
- Adds eight collector controls; this refetch is not an independent statistical sample or full Gaia matching
