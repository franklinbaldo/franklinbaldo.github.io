---
type: changelog
date: 2026-09-24
description: "Add the canonical project-tier card for Sisprev after reviewing its legal-audit model, derived artifacts, CI evidence and current integration debt."
tags: [projects, tiers, okf, github]
---

# Canonical project tier: Sisprev

Adds `knowledge/project-tiers/sisprev.md` for `franklinbaldo/sisprev`, reviewed at main revision `d28284063ea16a538560f3af99ddc07c1f5d2e76`.

The initial placement is **quality A / interest S / medium confidence**. The review credits the frozen-source → authored-OKF → deterministic-derived-artifact chain, domain-specific regression gates, generated site/PDF review surfaces, real-browser visual and accessibility evidence, and the explicit separation between analytical conclusions and institutional acts such as PGE validation or IPERON approval. Interest is S because the project turns a difficult legal/operational audit into a reusable versioned evidence system without collapsing legal authority into software state.

S quality is withheld because the Cycle 9 work has an explicit restack debt against contemporary `main`, some runtime semantics still depend on external confirmation from IPERON/the vendor, and structural gaps around cycle closure state and historical derived-file coverage remain documented. A fresh independent full-suite run was attempted for this review but the Jatobá compute endpoint timed out, so repository contracts, merged review evidence and the blog repository's own tier gates remain authoritative before merge.
