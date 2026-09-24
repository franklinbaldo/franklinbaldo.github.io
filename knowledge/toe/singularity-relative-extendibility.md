---
type: toe
name: "Singularity as Class-Relative Non-Extendibility"
kind: "adjacent"
scientific_tier: "NR"
interest_tier: "A"
confidence: "high"
summary: "A self-authored formal research front in franklinbaldo/papers that models a singularity as failure of a trajectory to remain indefinitely extendible inside a declared state class. The Lean contract proves that class enlargement can remove such singularities and proposes global unique development as part of a candidate criterion for when an enlargement still represents the same system. It is tracked as fundamental-physics-adjacent methodology, not as a gravity-plus-Standard-Model Theory of Everything."
strengths: ["The core claims are explicit and kernel-checkable: singularity is formalized as class-relative non-extendibility, closure failure is linked to existence of a singular datum, and enlargement monotonicity is proved.","The construction cleanly separates removing a singularity by enlarging the admissible class from preserving canonicity: a toy model is global in two enlargements but uniquely developed in only one.","The repository states its limitations rather than laundering the abstraction into a physical result, and a related capability-identity contract formalizes when information/tasks survive a non-injective collapse."]
open_problems: ["The current contract uses discrete natural-number time and an abstract step relation; it does not model norms, continuous-time PDEs, general relativity, or Navier-Stokes dynamics.","Conservativity of the enlarged dynamics over the original class is built into the one-step-relation setup rather than derived for a physical theory.","The proposed CanonicalEnlargement criterion still leaves open which selection principles count as physically legitimate, so unique continuation alone does not settle same-system identity.","No empirical prediction, quantum-gravity dynamics, or realistic Standard-Model matter sector follows from the current formalization."]
source_label: "franklinbaldo/papers #1389 — SingularityRelativeExtendibility.lean"
source_url: "https://github.com/franklinbaldo/papers/blob/add579ad5574f8ddc0646bde3864f69bd6e5ec91/formalizations/research_contracts/SingularityRelativeExtendibility.lean"
source_date: "2026-09-24"
note: "Self-authored, unpublished and exploratory. 2026-09-24: unranked -> adjacent NR/A. NR is a scope judgement, not a negative scientific verdict; A interest reflects the formal leverage for comparing singularity-resolution claims. Clash: Loop Quantum Gravity A/A on what it means for a singularity to be resolved; no LQG tier movement."
updated: "2026-09-24"
---

# Singularity as Class-Relative Non-Extendibility

This local research front treats singularity as a property of a trajectory relative to a declared class of admissible states, rather than as a special state or an automatically theory-independent object. Its present contribution is semantic and formal: it makes precise when enlarging the class removes non-extendibility and why global continuation does not by itself establish that the enlarged description is the same physical system.

The entry is deliberately **adjacent / NR**, not a ToE contender. The current Lean model is an abstract discrete transition system and makes no claim to derive gravity, quantum mechanics, or the Standard Model.
