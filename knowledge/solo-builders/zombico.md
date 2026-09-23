---
type: solo-builder
name: "Mojulo"
public_handle: "zombico"
building: "A local-first 3D compiler for coding agents: deterministic recipe source compiled into browser worlds, glTF/OpenUSD, Godot/Unity/Unreal handoffs, Blender, OpenSCAD and print-ready STL/3MF, with MCP/CLI integration for Claude Code and Codex."
domain: [agent-tools, 3d-compilers, mcp, procedural-generation, local-first, digital-fabrication]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 3
  forks: 0
  watchers: 3
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: "not_measured"
  window: "Repository created 2026-04-30; accumulated API snapshot through 2026-09-22. Repository metadata still reports three stars and zero forks; issue and pull-request searches excluding the owner returned no public external issues or PRs. Discussion participation and contributor identity were not measured."
blocking_constraint: "The implementation is shipping frequent releases and increasingly closing its own host-portability gaps. v2.0.8 adds explicit local/box host profiles, deterministic single-file export bundles, host-specific handoff instructions and field/docs/inferred provenance; its Claude Code field gate successfully rendered exports and delivered the bundle through the same artifact door used by the web box. That materially reduces the earlier uncertainty about whether Mojulo can survive temporary agent-host environments. The remaining visible constraint is now more specifically independent cold-start/product evidence: the portability loop is still maintainer-plus-agent driven, the primary repo has three stars but no forks or external issues/PRs, and the hosted-offering terms remain conditional on demonstrated demand."
missing_resource: user
confidence: high
source_label: "zombico/mojulo"
source_url: "https://github.com/zombico/mojulo"
source_urls:
  - "https://github.com/zombico/mojulo/releases/tag/v2.0.8"
  - "https://github.com/zombico/mojulo/releases/tag/v2.0.7"
  - "https://github.com/zombico/mojulo/blob/main/TERMS.md"
  - "https://github.com/zombico/mojulo-demo-artifacts"
personal_site: "https://mojulo.ai"
maturity: in-use
unlock: "Have independent cold-start testers use Mojulo for a real 3D task from at least two materially different host surfaces, preserving host profile, install path, recipe, export/handoff route and expected-versus-observed outcome. The most informative tester would already need a generated world/model rather than testing the product generically, because that simultaneously measures install portability, task fit and whether the handoff artifact is actually useful downstream."
synergy_candidates: [godos-scrolls-flamegrid, epilogos, darkphilosopher, rhausch, isualc]
trajectory:
  - "2026-04-30: primary Mojulo repository created."
  - "2026-09-16: companion mojulo-demo-artifacts repository begins publishing shareable 3D worlds; its initial commit is explicitly co-authored by Claude Opus 5."
  - "2026-09-18: repository reframes itself as a '3D compiler for agents' and preserves deterministic recipe/source semantics across export targets."
  - "2026-09-21: a Claude cloud sandbox field run exposes two clean-install blockers; v2.0.7 fixes both and ships the same day, with further commits explicitly co-authored by Claude Fable 5.1."
  - "2026-09-22: v2.0.8 turns temporary-agent-box handoff into an explicit product surface: host profiles distinguish field/docs/inferred claims, exports gain deterministic bundle/courier paths, and a Claude Code Artifact-tool field gate verifies rendering plus zip delivery."
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
  note: "The canonical GH-Archive queue runner could not execute in this run because the connected compute fabric timed out before sampling. No recurrence or admission-band value was manufactured; the existing single sample remains authoritative."
note: "This remains a solo-builder card, not an ai-epistemic-world: the public framing is an engineering/product architecture, not a reconstructible belief, cosmology, identity or meaning system. The v2.0.8 host-handoff work is a material longitudinal improvement but does not itself supply independent user reception. Full-corpus comparison found no actionable user bridge yet: GodOS/Scrolls/FlameGrid and EpiLogos remain plausible simulation/world consumers but no direct public artifact establishes a concrete Mojulo-shaped need; Spark, Medieval Economy and ISU Survivor are closer engineering neighbors, but their current blockers concern device validation, experimental methodology and benchmark instrumentation rather than missing 3D compilation. No contact was made because a generic 'try this tool' introduction would not yet add a concrete transfer path."
updated: 2026-09-22
---

## Discovery state — 2026-09-22

- `mode`: `discovery`
- `missing_resource_subtype`: `cold-start-tester`
- `recurrence`: unchanged at one sampled day; queue refresh failed before sampling, so persistence is not claimed.
- `strongest_comparisons`: GodOS/Scrolls/FlameGrid and EpiLogos remain plausible world/simulation consumers; Spark, Medieval Economy and ISU Survivor are concrete engineering neighbors but currently need different resources.
- `match_quality`: `plausible` at best — there is product/resource relevance, but no named downstream task whose transfer path is concrete enough for an initial public touch.
- `resource_found`: none yet; v2.0.8 materially narrows the blocker from host-portability uncertainty to independent cold-start/domain use.
- `contact_gate`: initial touch remains unused; channel `none` because no actionable bridge was found.
