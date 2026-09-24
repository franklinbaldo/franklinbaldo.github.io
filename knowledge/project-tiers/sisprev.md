---
type: project-tier
repository: "franklinbaldo/sisprev"
name: "Sisprev"
quality_tier: "A"
interest_tier: "S"
confidence: "medium"
reviewed_at: "2026-09-24"
reviewed_revision: "d28284063ea16a538560f3af99ddc07c1f5d2e76"
summary: >-
  A legally rigorous, unusually auditable system for reviewing Rondônia public-pension rules:
  Sisprev separates frozen source material, authored OKF rules and legal analysis, deterministic
  derived deployment artifacts, browser/PDF review surfaces and institutional approval states.
  Execution earns A because traceability, domain-specific regression gates and review evidence are
  already substantial. Interest reaches S because the project makes legal reasoning and operational
  rule maintenance coexist in one versioned evidence chain without pretending that CI is an act of
  legal authority. S quality is withheld for an aging Cycle 9 branch stack that still needs a clean
  restack onto current main, unresolved external confirmation of some Sisprev runtime semantics, and
  a few explicitly documented structural coverage gaps.
strengths:
  - "The source-of-truth model is disciplined: received CSV material is preserved as a frozen baseline, the live rule catalog and legal analysis are authored in OKF Markdown, and operational CSVs, indexes and site snapshots are regenerated rather than hand-edited."
  - "CI protects concrete failure modes rather than generic ceremony: bundle conformance, exact regeneration of derived artifacts, frozen-source hashes, cycle-specific deployment loads, decision/spec consistency, append-only findings and high-cardinality rule-family regressions are checked independently."
  - "The project has unusually strong review evidence for a legal-audit repository: a generated site and institutional PDFs, commit-linked artifacts, real-browser visual checks, mobile overflow/reading-scale regressions, and semantic accessibility checks were added after observed defects rather than inferred from build success."
  - "Its epistemic and institutional boundaries are explicit: repository analysis, audit completion, implementation confirmation, PGE validation, IPERON approval and signature are modeled as distinct states, while detectors and textual extraction are treated as evidence that still requires substantive legal review."
  - "Recent maintenance is substantive: late-August legal/model corrections were followed by September work that made responsive rendering, keyboard/focus accessibility and published-surface evidence reproducible rather than leaving them as informal assumptions."
open_problems:
  - "The open Cycle 9 stack no longer anchors cleanly to contemporary main and has an explicit restack plan; until that work is reconciled, a large body of already-developed audit work remains structurally separated from the current branch."
  - "Some operational semantics still require evidence from IPERON or the vendor, notably how the running Sisprev captures cause information and what particular calculation labels execute; the repository correctly records these as external confirmation gaps rather than filling them by inference."
  - "Known structural debts remain explicit, including the lack of a fully structured cycle-closure state/date contract and incomplete mechanical coverage of historical files under data/homologacao/."
  - "A fresh independent full-suite run could not be reproduced in this review because the Jatobá compute endpoint timed out; the assessment therefore relies on current main, repository contracts, committed workflows, recent merged PR evidence and open issue/PR state."
history:
  - "2026-09-24: initial placement -> quality A / interest S, medium confidence after reviewing main at d2828406, README/agent contracts, OKF source and derivation model, incident-driven CI, recent legal and browser-evidence work, and the current Cycle 9/external-confirmation debt; S quality withheld for unresolved integration and evidence gaps, while interest is S for the unusually reusable fusion of versioned legal audit, executable rule data, provenance and institutional-state separation."
---
