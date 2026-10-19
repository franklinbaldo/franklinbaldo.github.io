---
type: solo-builder
name: "ESPHome LoRa blinds protocol"
public_handle: "smirre111"
building: "A battery-conscious LoRa control stack for motorized blinds integrated with ESPHome/Home Assistant, with custom hub and node protocol logic for sessions, authenticated commands, wake/sleep scheduling, timed receive windows, Class-A-like RX1/RX2 behavior, power modes, diagnostics, mutation-tested host simulations and repeated bench measurements, developed extensively with Claude."
domain: [iot, lora, esphome, embedded-systems, home-automation, power-management, protocol-engineering, hardware-validation]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 1
  forks: 0
  watchers: 1
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-02-20; accumulated repository API snapshot through 2026-09-22. Repository metadata reports one star, zero forks, one watcher and zero subscribers; the complete public issue and pull-request collections are empty; discussions are disabled. Contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "The project has unusually strong software-side verification and a bench runbook that explicitly separates measured facts from assumptions, but the runbook still leaves hardware gates that software cannot close. It says two of the ten bench items require an external instrument, the hub half of one timing-rate check lacks an observable, RX-on current needs a meter, the transmit-ramp mean needs a scope, and the hub RX timestamp gate cannot reach its stated ±1 ms target without wiring DIO0. Recent protocol work continues to close software defects and prove them with mutation tests, so the next discriminating resource is measurement instrumentation at the physical boundary rather than another protocol rewrite."
missing_resource: tool
confidence: high
source_label: "smirre111/esphome_localcomponents"
source_url: "https://github.com/smirre111/esphome_localcomponents"
source_urls:
  - "https://github.com/smirre111/esphome_localcomponents/blob/main/configuration/docs/bench-runbook.md"
  - "https://github.com/smirre111/esphome_localcomponents/blob/main/configuration/docs/test-plan.md"
  - "https://github.com/smirre111/esphome_localcomponents/commit/27d3606d4e64782f33ff3f302e4e605c5f9ae91f"
  - "https://github.com/smirre111/esphome_localcomponents/commit/8a821a6f66f395d40f9eabb158b00e78e0debbc8"
maturity: in-use
unlock: "Finish the runbook's explicitly unclosed physical gates with a reproducible measurement setup: record hub/node firmware SHAs and hardware revision, use a scope or logic-analyzer-class timing instrument for transmit/ramp and DIO0 edge measurements, a suitable current/power meter for RX-on current, and preserve raw traces plus the existing preregistered close condition for each item. The useful result is either a measured constant that closes the gate or a counterexample that forces the software model to change."
synergy_candidates: [mikesandoval10creator, rhausch, isualc]
trajectory:
  - "2026-02-20: the public ESPHome local-components repository is created for the hub side of the LoRa blinds stack."
  - "By late August 2026: the project has explicit automatic-mode, wake-cost and protocol-layering work, with Claude repeatedly credited as co-author."
  - "2026-09-12 to 2026-09-15: the bench campaign records multiple defects that the host suite had not exposed, then converts them into regression and mutation tests; measured Mode-B runs reach hundreds of timed windows while remaining losses are traced to concrete radio/timing causes."
  - "2026-09-22: a public Claude-authored/coauthored protocol commit continues the Class-A RX1/RX2 work, explicitly preserving one still-open retry-policy case while reporting 779/779 host tests and a successful node-firmware build."
ai_role: [implementation-collaborator, code-coauthor, repository-agent, test-and-debug-collaborator]
queue_provenance:
  criteria_version: "2026-09-21"
  first_sampled: "2026-09-22"
  times_sampled: 1
  collection_mode: "manual-recovery"
  event_count: "not_measured"
  distinct_repos: "not_measured"
  own_repo_event_share: "not_measured"
  distinct_event_kinds: "not_measured"
  other_actors_in_sample_window: "not_measured"
  note: "The merged solo-builder skill and canonical queue command were read first and a 2026-09-21 GH-Archive refresh was attempted through the connected compute fabric. The compute request returned a transient upstream 504 before sampling completed, so no admission-band values or queue recurrence were inferred. Direct public GitHub commit, repository and documentation evidence was used for this one-person recovery pass; recurrence remains immature."
note: "This is a solo-builder card, not an ai-epistemic-world: the public artifacts describe concrete embedded/protocol engineering and measurement work, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning framework. Comparison against all eleven operative solo-builder cards found Praeventio Guard as the strongest complementary case because both explicitly separate extensive internal verification from unresolved physical-world validation gates; Hunter-Gatherer Ecology contributes exact run provenance and frozen comparison discipline, while ISU Survivor is the nearest missing_resource=tool analogue because its next step is better measurement instrumentation rather than more agent behavior. The reciprocal method contribution from this project is its explicit measured-versus-assumed ledger and hardware-gate close conditions. No public contact was made: the blocker is already named precisely and the prior corpus does not yet contain a concrete instrument owner, hardware reviewer or other resource whose introduction would make an initial touch useful."
updated: 2026-09-22
---
