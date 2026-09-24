---
type: project-tier
repository: "franklinbaldo/ficha"
name: "Ficha"
quality_tier: "A"
interest_tier: "S"
confidence: "medium"
reviewed_at: "2026-09-24"
reviewed_revision: "98c5c110d9938d55b40c91d2309c99e40b186758"
summary: >-
  Operational open-data infrastructure for Brazil's public CNPJ corpus: Ficha combines a
  browser-native DuckDB-WASM explorer with a versioned public data contract and large snapshots
  preserved on Internet Archive. Execution is strong enough for A, while interest reaches S
  because the project turns a normally centralized public-data workload into reusable static
  civic infrastructure. S quality is withheld because the publication/ETL surface remains
  operationally complex, the current public manifest still selects the 2026-07 snapshot, and
  important identity/history work remains under active consolidation.
strengths:
  - "The public contract is concrete rather than aspirational: the current manifest selects a 2026-07 snapshot and exposes multi-gigabyte Parquet relations with hashes and Internet Archive URLs, while the README documents both analytical and atomic access paths."
  - "The architecture has unusual leverage: DuckDB-WASM lets the browser query Parquet directly, while the same preserved artifacts and manifest can be reused by external analysis without depending on the Ficha UI or an application backend."
  - "Engineering discipline is broad for a civic-data project: separate web, ETL and ficha-py gates; Linux and Windows ETL tests; Ruff and pytest; Astro check/test/build; benchmark smokes; deploy, accessibility and visual-evidence workflows; ADRs; and fail-closed integrity work around checkpoints and key uniqueness."
  - "Maintenance is active and material, with September work on monthly key uniqueness, published-page accessibility, resilient remote-failure states, visual evidence, and safer PR-based automated manifest publication."
open_problems:
  - "The current public manifest still selects snapshot 2026-07 as of this review. This is not treated as proof of failure, but it leaves freshness and publication cadence as an operational question rather than a fully settled strength."
  - "The ETL and publication system has a large operational surface, including many specialized workflows and long-running multi-gigabyte jobs; keeping provenance, checkpoint integrity, remote Internet Archive behavior and public-manifest updates coherent is a material maintenance burden."
  - "Some data-model questions remain under active investigation or RFC, notably canonical identity/cardinality for socios and derived cross-snapshot signals, so parts of the broader historical model are still consolidating."
  - "A fresh independent full-suite/site run and direct live Pages probe could not be reproduced in this review because Jatobá timed out and the fallback sandbox had no outbound DNS."
history:
  - "2026-09-24: initial placement -> quality A / interest S, medium confidence after reviewing main at 98c5c110, the public architecture and README, current manifest, verified monthly data releases, CI/test and workflow surfaces, recent hardening commits, and open investigation/RFC work; S quality withheld for ongoing operational/data-model consolidation, while interest is S for the unusually reusable browser-native plus preserved-open-data architecture."
---
