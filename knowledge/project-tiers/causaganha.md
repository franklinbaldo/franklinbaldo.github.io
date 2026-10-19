---
type: project-tier
repository: "franklinbaldo/causaganha"
name: "CausaGanha"
quality_tier: "A"
interest_tier: "S"
confidence: "medium"
reviewed_at: "2026-09-24"
reviewed_revision: "4709458aeaf8f67c3b69ee3a28864204a3db9848"
summary: >-
  A substantial public legal-data infrastructure project that preserves Brazilian judicial
  communications, keeps provenance explicit across heterogeneous official sources, and exposes the
  resulting corpus through a public site, reconstructible DuckDB/Parquet data and a read-only MCP
  surface. Execution earns A because the archival pipeline, source separation, operational workflows,
  test discipline and recent maintenance are already unusually concrete. Interest reaches S because
  the combination of preservation, reproducibility, legal provenance and agent-readable access turns
  fragile judicial publications into reusable civic infrastructure. S quality is withheld because
  coverage remains intentionally incomplete and source-dependent, the stable public MCP endpoint is
  not yet proven, and some archive/publishing operations still have explicit external-credential and
  rollout dependencies.
strengths:
  - "The data model preserves epistemic boundaries instead of flattening sources: archived publications, procedural state and decision text remain distinct, with provenance and source-specific freshness/coverage visible to consumers."
  - "The public archive is designed for reuse rather than only for the site: original ZIPs, manifests and Parquet derivatives live in the Internet Archive, while `catalog.sql` reconstructs the DuckDB view layer instead of shipping an opaque database artifact."
  - "The same underlying evidence is exposed through three useful product surfaces: a public search/dossier site, directly queryable public data, and a read-only MCP with product-level tools for publications, procedural state and decisions plus operational health/freshness diagnostics."
  - "Operational engineering is extensive and domain-aware: scheduled collection, backlog draining, manifest rendering, Parquet consolidation, catalog updates, deployment and canary workflows encode real archival failure modes such as distinguishing transient DJEN 403s, confirmed absence and malformed availability responses."
  - "Recent maintenance demonstrates active correctness work rather than cosmetic churn: current main includes review-driven fixes to legal segmentation labels, corpus governance checks and a provably equivalent pruning optimization that reduced a real corpus-scale near-duplicate scan from multi-minute hangs to roughly one minute without changing results."
open_problems:
  - "Coverage is explicitly heterogeneous and incomplete across DJEN, TJRO JURIS, STJ and DataJud; the project correctly exposes this, but national completeness and equal maturity across sources remain unsolved product limitations."
  - "The repository documents the public HTTP MCP artifact but still withholds a stable public URL pending the required smoke proof, so the agent-facing product is operational locally before it is fully proven as a public service."
  - "A current archive-publishing handoff remains blocked on Internet Archive credentials, showing that part of the preservation pipeline still depends on external operational state that cannot be proven solely from repository code and CI."
  - "The supported product and the experimental Lab/segmenter surface coexist in one large repository; governance separates them explicitly, but the breadth of pipelines, workflows and experimental work creates a material maintenance and integration burden."
history:
  - "2026-09-24: initial placement -> quality A / interest S, medium confidence after reviewing main at 4709458a, product/architecture documentation, packaging and CLI/MCP contracts, archival/deployment workflows, current PR state and recent correctness/performance maintenance; S quality withheld for incomplete source coverage, the unproven stable public MCP endpoint and external archive-publishing dependencies, while interest is S for the unusually reusable fusion of public preservation, provenance-aware legal data, reconstructible analytics and agent access."
---
