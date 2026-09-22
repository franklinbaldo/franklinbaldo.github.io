---
type: ai-epistemic-convergence
name: "Interactive device evidence after internal correctness"
hypothesis_key: interactive-device-evidence-gap
summary: "Three AI-assisted interactive products expose a similar boundary between internal correctness and externally observed use. Spark has extensive Python/JavaScript parity, PTY and regression checks yet repeatedly records major phone UI/gameplay changes as not seen on a real screen; the last public SharksVsDolphins snapshot had built a tester-weekend telemetry loop because balance, onboarding and mobile behavior require player evidence; Wata has a working Matrix/PTT stack whose remaining uncertainty includes cold setup and operation on the intended Android handhelds. The transferable method is a frozen first-session/device protocol that preserves expected-versus-observed evidence rather than treating internal tests as a substitute for field interaction. SharksVsDolphins remains historical method evidence, but its repository became unavailable later on 2026-09-22 and is not currently a live introduction target."
case_slugs: [darkphilosopher, gigglesquid19, adriaanm]
overlap_dimensions: [method, device-validation, user-testing, telemetry, reproducibility]
independence_status: not-established
evidence_quality: high
testable_predictions:
  - "A frozen real-device first-session protocol should surface a distinct class of failures—responsive layout, hardware/input behavior, setup assumptions and interaction confusion—that is underrepresented in repository-only unit/parity/integration suites."
  - "For Spark, independent portrait/landscape create→play→3D interaction runs should reproduce the pattern already seen when one on-device screenshot exposed layout defects that parser/parity checks did not catch."
  - "For SharksVsDolphins, the last public tester-telemetry architecture predicted that separating engine-correctness checks from tester telemetry would make it clearer which changes fix software defects versus player-understanding or balance problems; this remains historical until a public project surface reappears."
  - "For Wata, a cold-install protocol on the intended PTT handhelds should distinguish Matrix/protocol correctness from hardware-button, audio-delivery, notification and setup failures."
cross_pollination_candidates:
  - "adriaanm -> darkphilosopher: Wata's cold-setup discipline on intended Android hardware is a plausible method transfer for Spark's Termux/browser/device boundary, but no specific reviewer or shared test environment has yet made this bridge actionable."
contamination_notes:
  - "Different maintainers do not establish independent convergence. The observatory identified this bridge on 2026-09-22; no public cross-project contact among these maintainers has been made through this record, so later uptake after any future introduction must be treated as diffusion."
  - "Later on 2026-09-22, https://github.com/gigglesquid19/SharksVsDolphins returned 404 and the repository was absent from gigglesquid19's current public repository listing. The tester-weekend pattern remains preserved as historical evidence from the earlier public snapshot, but the direct gigglesquid19↔DarkPhilosopher bridge has been retired as a live cross-pollination candidate unless the project becomes publicly inspectable again. Public evidence does not establish why visibility changed."
source_urls:
  - "https://github.com/DarkPhilosopher/spark/blob/main/CLAUDE.md"
  - "https://github.com/DarkPhilosopher/spark/commit/1910af44e71f096528eabde5f07af1daaf80d2a8"
  - "https://github.com/gigglesquid19/SharksVsDolphins"
  - "https://github.com/adriaanm/wata"
updated: 2026-09-22
---

This convergence concerns validation method and resource bottlenecks, not the quality or correctness of the products themselves. It deliberately keeps internal software correctness, real-device behavior and user reception as separate evidence channels.
