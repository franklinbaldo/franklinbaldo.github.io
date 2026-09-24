---
type: project-tier
repository: "franklinbaldo/okf-parser"
name: "okf-parser"
quality_tier: "A"
interest_tier: "A"
confidence: "medium"
reviewed_at: "2026-09-24"
reviewed_revision: "50e1e91bd7047770f7c9bd025c5aaa2e0b66c8d4"
summary: >-
  Mature and unusually coherent OKF infrastructure: a strict authored-core parser and validator
  with relational Ibis/DuckDB projections, graph, CLI, MCP, GitHub Action and an optional Rust
  execution path. It earns A for both execution and interest because the project is already
  operationally broad, carefully specified and highly reusable, while S is withheld because the
  package is still beta and several open integration stacks are still consolidating core write,
  relation and native-engine contracts.
strengths:
  - "The architecture makes a clear semantic boundary between strict authored OKF and source adapters, keeping one canonical downstream model instead of teaching every consumer each source dialect."
  - "The public surface is unusually complete for a beta infrastructure project: Python API, CLI, MCP, GitHub Action, DuckDB/Ibis relations, NetworkX projection and an optional Rust engine with documented fallback semantics."
  - "Release engineering is substantive rather than decorative: SemVer/changelog coupling, locked Python/Rust packaging, release dry-runs, OIDC-based PyPI publishing and a current v0.45.10 release are all present."
  - "Current maintenance remains active and technically meaningful, including FastMCP 4/Pydantic 2.12 migration and follow-up work on deterministic materialization, typed writes and native-engine routing."
open_problems:
  - "The project is still explicitly beta and below 1.0, so the public contract remains subject to meaningful evolution."
  - "Maintaining parity across portable Python/TypeScript surfaces and the optional Rust core creates a significant integration and conformance burden; several open/stacked PRs show that this boundary is still being actively consolidated."
  - "A full local test run could not be independently reproduced in this review because Jatobá timed out and the fallback sandbox had no external DNS; the assessment therefore relies on repository structure, release artifacts, workflow definitions, current main and open development evidence."
history:
  - "2026-09-24: initial placement -> quality A / interest A, medium confidence after reviewing main at 50e1e91, README/architecture, package and release contracts, CI/release workflows, the v0.45.10 release and the current open development stack; S withheld for beta status, cross-runtime parity burden and still-active core consolidation."
---
