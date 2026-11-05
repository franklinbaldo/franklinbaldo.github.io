---
type: malecns-project
project_id: ashemag-fly-brain-atlas
name: "Fly Brain Atlas"
ownership: independent
kind: "Source-traceable MaleCNS morphology and region atlas"
stage: "Public interactive 3D anatomy viewer with source manifests and validator"
primary_url: "https://github.com/ashemag/fly-brain-atlas"
repository: "ashemag/fly-brain-atlas"
evidence_url: "https://github.com/ashemag/fly-brain-atlas/blob/91355d7761582b321203d3ee32ee5cebbe689c7e/public/male-cns/ATTRIBUTION.md"
scientific_tier: B
interest_tier: A
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "91355d7761582b321203d3ee32ee5cebbe689c7e"
summary: >-
  Independent, source-traceable anatomy viewer built from MaleCNS native
  ROI meshes and sampled neuron morphologies. Its demonstrated contribution
  is explorable geometry, not simulation, full-connectome connectivity,
  biological behavior or a causal experiment. Source manifests, license notes
  and executable validation are public, but complete assets were not
  independently downloaded and verified in this review.
strongest_evidence:
  - >-
    The public manifest maps 80 region meshes to original MaleCNS
    fullbrain-roi-v5 mesh URLs with per-file SHA-256 checksums. Provenance
    reports 7,270,902 native source triangles in nanometer coordinates.
  - >-
    The documented neuronal sample contains 1,712 skeletons and
    2,180,126 source edges; eight complete neuron surface meshes load on
    demand. The group selection is deterministic, not population-representative.
  - >-
    The versioned validator checks binary mesh length/index bounds,
    coordinate finiteness, content digests, region pairs, count totals
    and body geometry. Running it with original assets remains unverified here.
limitations:
  - >-
    The neuronal display is a selected morphology subset, not the complete
    166,691-neuron dataset, and it does not show synapses or directed
    neuronal connectivity. Triangle counts do not measure biological fidelity.
  - >-
    The exterior uses a NeuroMechFly reference from a different specimen,
    not registered to the atlas's CNS anatomy. Exploded positions, colors
    and group assignments are visual design choices, not measurements.
  - >-
    No independent full asset reconstruction, build, screenshot inspection
    or upstream mesh-by-mesh hash comparison was conducted this round.
controls:
  - >-
    Immutable upstream source URLs, SHA-256 hashes and normalized labels
    allow future reconstruction and comparison with MaleCNS v1.0.
  - >-
    Required for higher confidence: rerun data validation on complete assets,
    sample source mesh and coordinate alignment, build the UI and inspect
    rendered shapes. A locomotion/topology baseline is not applicable here.
  - >-
    Compare with CAOS_FlyCNS and soup-connectome as a morphology versus
    executable-connectome distinction; do not rank it as behavioral evidence.
history:
  - >-
    2026-10-14: initial scientific B, interest A, confidence medium, based
    on public manifest, provenance, and source-level validator inspection;
    no biological-performance claim.
note: >-
  Counts and functional behavior are author-reported; validator code was
  read but not executed against the complete geometry in this session.
---
