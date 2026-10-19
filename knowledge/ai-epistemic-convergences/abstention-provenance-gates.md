---
type: ai-epistemic-convergence
name: "Abstention and provenance as authority boundaries"
hypothesis_key: abstention-provenance-gates
summary: "Three AI-assisted systems in different domains encode a similar boundary around machine interpretation: Beat The Scalper prints Unknown and provenance labels while a deterministic controller retains authority; Rumor Checking uses an evidence chain plus a monotonic critic that may downgrade unsupported decisive verdicts; Bangkok CCTV preserves confidence and the underlying frame/crop for a person to review. The common transferable mechanism is not the domain claim but a one-way uncertainty gate: model output may add interpretation, while unsupported or ambiguous evidence must remain visibly uncertain and cannot silently acquire authority."
case_slugs: [leprekonsg, forwaryan, madaka17]
overlap_dimensions: [method, provenance, abstention, authority-boundary, evaluation]
independence_status: not-established
evidence_quality: high
testable_predictions:
  - "On a frozen adversarial set containing contradictory, incomplete and replayed evidence, systems with an explicit one-way abstention/provenance gate should produce fewer unjustified decisive states than the same systems with the gate removed, at the cost of more Unknown/insufficient outcomes."
  - "For Beat The Scalper, injecting model interpretations that conflict with deterministic seller/price/availability evidence should never move a mission across an authority boundary; the observable effect should be Unknown/blocked or a downgraded condition."
  - "For Rumor Checking, attaching BTS-style provenance classes to retrieved/live/replayed evidence should make it possible to measure whether decisive verdicts disproportionately depend on weaker or replay-derived evidence."
cross_pollination_candidates:
  - "forwaryan -> leprekonsg: adapt the monotonic-critic pattern as an explicit post-interpretation invariant test: a model may resolve supported unknowns but may never upgrade a deterministic conflict into purchase eligibility."
  - "leprekonsg -> forwaryan: reuse explicit provenance classes such as live_verified/manual_input/offline_replay/blocked so replay or synthetic evidence cannot be mistaken for independently observed live support."
  - "madaka17 -> leprekonsg, forwaryan: reuse evidence-bundle review of ambiguous cases to test whether abstentions and confidence states match independent human judgment rather than merely internal policy consistency."
contamination_notes:
  - "Different maintainers do not establish independent convergence; shared contemporary agent-engineering practice or model-generated design patterns may explain part of the overlap. No observatory-mediated introduction among these maintainers has occurred as of this record."
source_urls:
  - "https://github.com/leprekonsg/beat-the-scalper/blob/main/README.md"
  - "https://github.com/leprekonsg/beat-the-scalper/blob/main/docs/lazada-feasibility.md"
  - "https://github.com/forwaryan/rumor-checking"
  - "https://github.com/Madaka17/new_ccty_bangkok/blob/main/helmet_service.py"
updated: 2026-09-22
---
