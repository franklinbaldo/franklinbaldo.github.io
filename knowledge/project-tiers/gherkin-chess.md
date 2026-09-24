---
type: project-tier
repository: "franklinbaldo/gherkin-chess"
name: "gherkin-chess"
quality_tier: "B"
interest_tier: "S"
confidence: "medium"
reviewed_at: "2026-09-24"
reviewed_revision: "198e9df9d2c29ba1be72b641ae3fc2d2809dc315"
summary: >-
  A fertile research prototype that turns chess into an explicit epistemic-action environment:
  an agent may reason freely, but the Gherkin-controlled path must externalize a move rationale,
  bind it to the exact origin FEN and materialize it through OKF before the move is played.
  Execution earns B because the repository already has a coherent Python package, locked dependencies,
  adversarial and historical-consistency tests, MCP/CLI/web surfaces, Stockfish-assisted controls and
  an OpenSkill tournament harness, but its operational experiment is not yet robust enough for A.
  The published leaderboard still contains only two short September 10 matches and current scheduled
  tournament runs complete the match batch but fail while committing the updated corpus.
  Interest reaches S because the project makes memory reuse, explicit divergence and non-silent
  substitution first-class experimental variables at the action boundary.
strengths:
  - "The central experimental contract is concrete: the Gherkin path validates move legality, syntax, origin FEN and move relevance before OKF materialization and board mutation."
  - "Operational memory distinguishes new knowledge, reuse and explicit divergence, preserves immutable origin positions, records application history and exposes corpus metrics."
  - "The experiment is exposed through FastMCP, a Cyclopts/Rich CLI, an observer web UI and a tournament runner with a direct-MCP control arm."
  - "Engineering discipline is credible for a young prototype: uv lockfile, SemVer gate, CI, documented unit/adversarial/historical-consistency tests, Stockfish integration and dedicated tests for silent substitution, reuse, divergence and persistence."
  - "The tournament path explicitly enables non-silent-substitution enforcement and gives agents bounded retry feedback, turning gate failures into observable outcomes."
open_problems:
  - "The continuous tournament is operationally broken at publication time: the latest reviewed scheduled run on 2026-09-24 completed the tournament batch successfully, then failed in the commit step; repeated failures leave the public data stale."
  - "The committed leaderboard is extremely sparse: only two matches from 2026-09-10 are published, both ending after 2-3 plies by Gherkin-agent disqualification, so it does not yet support strong empirical claims."
  - "The README frames non-silent substitution as an invariant, but the generic MCP play_move surface exposes enforce_non_silent_substitution with a default of false; the tournament enables it explicitly, so the strongest invariant is path-dependent rather than universal."
  - "The last successful main CI run reviewed was on code revision 708b6a1e; the current head 198e9df9 is one bot-generated tournament-data/version commit ahead, so current code quality is supported but not independently re-exercised at the exact reviewed head."
history:
  - "2026-09-24: initial placement -> quality B / interest S, medium confidence after reviewing main at 198e9df9, README and architecture, core game/corpus/MCP/tournament code, tests, lockfile, CI history, public leaderboard data and current scheduled workflow outcomes; B reflects a strong but still operationally fragile research prototype, while S interest reflects the explicit coupling of declarative memory, provenance, divergence and action gating."
---
