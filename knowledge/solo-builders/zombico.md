---
type: solo-builder
name: "Mojulo"
public_handle: "zombico"
building: "A local-first 3D compiler for coding agents: deterministic recipe source compiled into browser worlds, glTF/OpenUSD, Godot/Unity/Unreal handoffs, Blender, OpenSCAD and print-ready STL/3MF, with MCP/CLI integration for Claude Code and Codex."
domain: [agent-tools, 3d-compilers, mcp, procedural-generation, local-first, digital-fabrication]
reception:
  measured_at: "2026-09-24"
  scope: "primary repository accumulated public GitHub state"
  stars: 3
  forks: 0
  watchers: 3
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: "not_measured"
  window: "Repository created 2026-04-30; accumulated API snapshot through 2026-09-24. Repository metadata reports three stars, zero forks, three watchers and zero subscribers; public issue and pull-request searches excluding the owner and routine bots found no externally authored issues or PRs. Discussions are enabled on the repository, but accumulated discussion participation was not measured. Contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "Mojulo is continuing to remove host and agent-onboarding failures through direct field evidence rather than leaving them as documentation caveats. v2.0.8 and v2.0.9 converted temporary-agent-box and artifact-host failures into explicit host-profile, bundle/courier and CDN/offline behavior. v2.1.0 then uses the project's own tool ledger to identify a distinct shell-only orientation failure: MCP clients receive initialization instructions automatically, but `npx mojulo call` sessions rarely reached `forward_context`; the release adds `mojulo orient`, documents it as the shell analogue of MCP initialization, and records verified mint/export paths across several persistent and ephemeral agent hosts. Those changes materially reduce internal onboarding and portability uncertainty. The unresolved information gap is now even more clearly independent cold-start/product evidence from someone who already needs a generated 3D artifact, rather than another maintainer-plus-agent host-validation pass."
missing_resource: user
confidence: high
source_label: "zombico/mojulo"
source_url: "https://github.com/zombico/mojulo"
source_urls:
  - "https://github.com/zombico/mojulo/releases/tag/v2.1.0"
  - "https://github.com/zombico/mojulo/commit/541daaedbe32dbc3c1ff505c531d8e84408acca2"
  - "https://github.com/zombico/mojulo/releases/tag/v2.0.9"
  - "https://github.com/zombico/mojulo/releases/tag/v2.0.8"
  - "https://github.com/zombico/mojulo/releases/tag/v2.0.7"
  - "https://github.com/zombico/mojulo/blob/main/TERMS.md"
  - "https://github.com/zombico/mojulo-demo-artifacts"
personal_site: "https://mojulo.ai"
maturity: in-use
unlock: "Have independent cold-start testers use Mojulo for a real 3D task from at least two materially different host surfaces, preserving host profile, install/orientation path, recipe, export/handoff route and expected-versus-observed outcome. The most informative tester would already need a generated world/model rather than testing the product generically, because that simultaneously measures onboarding, task fit and whether the handoff artifact is actually useful downstream."
synergy_candidates: [godos-scrolls-flamegrid, epilogos, darkphilosopher, rhausch, isualc]
trajectory:
  - "2026-04-30: primary Mojulo repository created."
  - "2026-09-16: companion mojulo-demo-artifacts repository begins publishing shareable 3D worlds; its initial commit is explicitly co-authored by Claude Opus 5."
  - "2026-09-18: repository reframes itself as a '3D compiler for agents' and preserves deterministic recipe/source semantics across export targets."
  - "2026-09-21: a Claude cloud sandbox field run exposes two clean-install blockers; v2.0.7 fixes both and ships the same day, with further commits explicitly co-authored by Claude Fable 5.1."
  - "2026-09-22: v2.0.8 turns temporary-agent-box handoff into an explicit product surface: host profiles distinguish field/docs/inferred claims, exports gain deterministic bundle/courier paths, and a Claude Code Artifact-tool field gate verifies rendering plus zip delivery."
  - "2026-09-23: v2.0.9 converts a newly observed artifact-host CSP failure into product behavior: browser exports become CDN-first by default, an explicit offline variant remains available, and the handoff path now reads the host's declared CDN capability instead of treating byte size as the only page-door constraint."
  - "2026-09-24: v2.1.0 uses the local tool ledger to identify that shell-only agent sessions almost never oriented through `forward_context`, adds `mojulo orient` as the CLI analogue of MCP initialization, and documents a host matrix covering persistent desktop installs plus ephemeral Claude, ChatGPT/Codex, Grok and Meta Muse agent boxes. The same release simplifies the library UI and adds optional cloud-deck rendering, but neither change supplies independent downstream user evidence."
ai_role: [implementation-collaborator, code-coauthor, field-test-driver]
queue_provenance:
  criteria_version: "2026-09-21"
  first_sampled: "2026-09-22"
  times_sampled: 1
  collection_mode: "manual-fallback"
  event_count: "not_measured"
  distinct_repos: "not_measured"
  own_repo_event_share: "not_measured"
  distinct_event_kinds: "not_measured"
  other_actors_in_sample_window: "not_measured"
  note: "The merged solo-builder skill and current contracts were read first. A durable GH-Archive queue refresh could not be completed in this execution runtime, so no admission-band value or recurrence was manufactured. The existing single sampled day remains authoritative and this pass uses the documented material-update fallback."
note: "This remains a solo-builder card, not an ai-epistemic-world: the public framing is engineering/product architecture, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning system. v2.1.0 materially strengthens evidence that Mojulo can diagnose and close its own host/onboarding failures with field and ledger evidence, but it still does not provide independent cold-start product reception. Full relevant-corpus comparison still finds no actionable user bridge. GodOS/Scrolls/FlameGrid and EpiLogos remain plausible world/simulation consumers without a concrete public Mojulo-shaped task; Spark is the closest game-engine/browser neighbor but is currently blocked on its own real-device field validation and awaiting response to the observatory's existing issue; Medieval Economy needs methodology review; ISU Survivor needs benchmark instrumentation. A generic product introduction would not close any of those current blockers, so no public contact is justified and the account-level initial touch remains unused."
updated: 2026-09-24
---

## Discovery state — 2026-09-22

- `mode`: `discovery`
- `missing_resource_subtype`: `cold-start-tester`
- `recurrence`: unchanged at one sampled day; queue refresh failed before sampling, so persistence is not claimed.
- `strongest_comparisons`: GodOS/Scrolls/FlameGrid and EpiLogos remain plausible world/simulation consumers; Spark, Medieval Economy and ISU Survivor are concrete engineering neighbors but currently need different resources.
- `match_quality`: `plausible` at best — there is product/resource relevance, but no named downstream task whose transfer path is concrete enough for an initial public touch.
- `resource_found`: none yet; v2.0.8 materially narrows the blocker from host-portability uncertainty to independent cold-start/domain use.
- `contact_gate`: initial touch remains unused; channel `none` because no actionable bridge was found.

## Material progress — 2026-09-23 v2.0.9

- `mode`: `discovery`
- `new_evidence`: the artifact-host page failure was caused by CSP blocking inline `data:` scripts even below the documented byte limit; v2.0.9 changes normal web exports to a pinned-CDN path, preserves an explicit offline variant, and makes host CDN capability part of the actual handoff decision.
- `missing_resource_subtype`: `cold-start-tester`; the field-driven host fix reduces portability uncertainty but does not replace independent task/use evidence.
- `reception_refresh`: 3 stars, 0 forks, 3 watchers, 0 subscribers, 0 external issues and 0 external PRs on the accumulated primary-repository snapshot; discussion participation and contributor identity remain not measured.
- `recurrence`: unchanged at one sampled day because the queue refresh failed before GH-Archive sampling.
- `strongest_comparisons`: GodOS/Scrolls/FlameGrid and EpiLogos remain plausible consumers without a concrete public transfer path; Spark is the strongest technical neighbor but is currently field-validation constrained; Medieval Economy and ISU Survivor remain methodology/instrumentation constrained.
- `match_quality`: `plausible`.
- `resource_found`: none; no corpus member currently presents a real 3D task that turns Mojulo into an immediate useful introduction.
- `contact_channel`: `none`; initial touch remains unused and there is no uptake to measure.

## Material progress — 2026-09-24 v2.1.0

- `mode`: `discovery`
- `new_evidence`: v2.1.0 isolates a shell-only onboarding failure using Mojulo's own tool ledger and adds `mojulo orient`, the CLI analogue of MCP initialization. The release also records actual mint/export runs across multiple agent-box and persistent-host surfaces, while intentionally leaving deeper surface-aware grammar changes for later evidence.
- `missing_resource_subtype`: `cold-start-tester`; internal multi-host agent validation is now stronger, but it still does not answer whether an independent downstream user can discover, use and benefit from Mojulo on a real 3D task.
- `reception_refresh`: 3 stars, 0 forks, 3 watchers, 0 subscribers, 0 external issues and 0 external PRs on the accumulated primary-repository snapshot through 2026-09-24. Discussions are enabled but accumulated discussion participation and contributor identity remain not measured.
- `recurrence`: unchanged at one sampled day because a durable queue refresh could not be completed; persistence is not claimed.
- `strongest_comparisons`: GodOS/Scrolls/FlameGrid and EpiLogos remain plausible world/simulation consumers without a concrete public task; Spark remains a technical neighbor but is blocked on its own field-validation experiment; Medieval Economy and ISU Survivor still need methodology/instrumentation rather than a 3D compiler.
- `match_quality`: `plausible`.
- `resource_found`: none; the new host matrix is evidence about Mojulo's own delivery surface, not an independent user or a corpus member with a concrete downstream task.
- `contact_channel`: `none`; the account-level initial touch remains unused because no actionable bridge exists.
- `uptake`: none — no observatory intervention has been posted to Mojulo.
