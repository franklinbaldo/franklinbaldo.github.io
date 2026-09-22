---
type: ai-epistemic-convergence
name: "Interactive device evidence after internal correctness"
hypothesis_key: interactive-device-evidence-gap
summary: "Four AI-assisted products expose a similar boundary between internal correctness and externally observed use. Spark has extensive Python/JavaScript parity, PTY and regression checks yet repeatedly records major phone UI/gameplay changes as not seen on a real screen; the last public SharksVsDolphins snapshot had built a tester-weekend telemetry loop because balance, onboarding and mobile behavior require player evidence; Wata has a working Matrix/PTT stack whose remaining uncertainty includes cold setup and operation on the intended Android handhelds; Guardian-Praeventio explicitly keeps physical Android/iOS validation as a release gate and preserves an evidence-first field-validation discipline. The transferable method is a frozen first-session/device protocol that preserves expected-versus-observed evidence rather than treating internal tests as a substitute for field interaction. SharksVsDolphins remains historical method evidence, but its repository became unavailable later on 2026-09-22 and is not currently a live introduction target."
case_slugs: [darkphilosopher, gigglesquid19, adriaanm, mikesandoval10creator]
overlap_dimensions: [method, device-validation, user-testing, telemetry, reproducibility]
independence_status: not-established
evidence_quality: high
testable_predictions:
  - "A frozen real-device first-session protocol should surface a distinct class of failures—responsive layout, hardware/input behavior, setup assumptions and interaction confusion—that is underrepresented in repository-only unit/parity/integration suites."
  - "For Spark, independent portrait/landscape create→play→3D interaction runs should reproduce the pattern already seen when one on-device screenshot exposed layout defects that parser/parity checks did not catch."
  - "For Spark's `spark browser` path, a frozen Android/Termux field run should separate application/URL-construction correctness from Termux:API and device-integration failures that the sandbox cannot exercise."
  - "For SharksVsDolphins, the last public tester-telemetry architecture predicted that separating engine-correctness checks from tester telemetry would make it clearer which changes fix software defects versus player-understanding or balance problems; this remains historical until a public project surface reappears."
  - "For Wata, a cold-install protocol on the intended PTT handhelds should distinguish Matrix/protocol correctness from hardware-button, audio-delivery, notification and setup failures."
  - "For Guardian-Praeventio, keeping physical mobile checks as explicit release gates should expose hardware/runtime failures that cannot be certified by its unusually extensive unit, integration and audit stack alone."
cross_pollination_candidates:
  - "ACTIONABLE — mikesandoval10creator -> darkphilosopher: transfer Guardian-Praeventio's frozen field-scenario discipline into Spark as five preregistered real-device scenarios on two Android devices, recording device/Android/Termux versions, expected versus observed behavior, screenshots/video, negative results and whether each failure belongs to app logic or the integration boundary. The immediate anchor is Spark commit 1910af44e71f096528eabde5f07af1daaf80d2a8, which explicitly leaves the Termux:API hop unverified end to end."
  - "PLAUSIBLE — adriaanm -> darkphilosopher: Wata's cold-setup discipline on intended Android hardware remains a useful secondary method transfer for Spark's Termux/browser/device boundary, but it is less concrete than the Guardian-Praeventio field-evidence protocol."
contamination_notes:
  - "Different maintainers do not establish independent convergence. The observatory identified these bridges on 2026-09-22; no successful public cross-project contact among these maintainers has been made through this record, so later uptake after any future introduction must be treated as diffusion."
  - "Later on 2026-09-22, https://github.com/gigglesquid19/SharksVsDolphins returned 404 and the repository was absent from gigglesquid19's current public repository listing. The tester-weekend pattern remains preserved as historical evidence from the earlier public snapshot, but the direct gigglesquid19↔DarkPhilosopher bridge has been retired as a live cross-pollination candidate unless the project becomes publicly inspectable again. Public evidence does not establish why visibility changed."
  - "A public issue carrying the Guardian-Praeventio -> Spark method transfer was attempted only after the canonical intervention corpus showed no prior DarkPhilosopher touch, but GitHub returned 403 Resource not accessible by integration. No issue was posted, so this attempt does not consume the initial-touch gate and creates no observatory contamination in Spark."
source_urls:
  - "https://github.com/DarkPhilosopher/spark/blob/main/CLAUDE.md"
  - "https://github.com/DarkPhilosopher/spark/commit/1910af44e71f096528eabde5f07af1daaf80d2a8"
  - "https://github.com/gigglesquid19/SharksVsDolphins"
  - "https://github.com/adriaanm/wata"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/blob/main/TODO.md"
updated: 2026-09-22
---

This convergence concerns validation method and resource bottlenecks, not the quality or correctness of the products themselves. It deliberately keeps internal software correctness, real-device behavior and user reception as separate evidence channels.

## Harvest state — 2026-09-22

The strongest live bridge is now `mikesandoval10creator -> darkphilosopher`, with `match_quality: actionable`. The concrete resource has been found even though the human reviewer has not: Guardian-Praeventio contributes a field-validation protocol that can be transferred without assuming anything about either product's correctness. The public contact channel is currently unavailable to the observatory integration, so the useful state is preserved here rather than compensated for with another channel.
