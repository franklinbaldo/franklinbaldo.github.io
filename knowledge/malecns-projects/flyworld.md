---
type: malecns-project
project_id: "welkinhh-flyworld-malecns"
name: "FLYWORLD MaleCNS"
ownership: "independent"
kind: "fruit-fly ecology simulator with optional whole-MaleCNS neural control and visualization"
stage: "released interactive simulator with optional neural bridge"
primary_url: "https://github.com/welkinhh/FLYWORLD-MaleCNS"
repository: "welkinhh/FLYWORLD-MaleCNS"
evidence_url: "https://github.com/welkinhh/FLYWORLD-MaleCNS/blob/main/brain_service/brain_service.py"
scientific_tier: "D"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "32dfa1d3975d2f5e196c62a8396c41cd7483dff0"
summary: >-
  A released Godot ecosystem can attach a whole-MaleCNS service to a selected
  adult, inject food/threat channels into declared sensory groups, read
  locomotor/escape populations and optionally use those readouts for action
  selection. The wider ecology remains playable without the brain and is
  governed largely by simplified external rules, so the current evidence is
  integration and observability rather than MaleCNS-specific capability.
strongest_evidence:
  - "The Python brain service instantiates the full FlyBrain/MaleCNS model and addresses taste plus left/right looming inputs and forward, steer, escape, backward, punch and kick output groups."
  - "The Godot adapter carries source-ID-addressed neural activity across a versioned WebSocket protocol and rejects stale responses before visualization or optional control use."
  - "The game exposes an optional brain-control path for the selected adult while explicitly distinguishing genuine MaleCNS activity from the local proxy."
limitations:
  - "Only the selected fly is stepped through the remote neural model in the interactive path; the wider ecology continues under authored rules and can run with no neural service."
  - "Foraging, reproduction, predators and environmental dynamics are simplified game mechanics and are not biological predictions."
  - "No matched no-brain, rewired, random-recurrent or conventional-controller benchmark is reported for behavior or survival."
controls:
  - "The adapter prevents proxy responses from being presented as genuine neural activity and validates request context before accepting neural results."
  - "The repository explicitly states that neural signals are connectome-based computations, not living neural recordings."
  - "Behavioral ablations against proxy, no-brain, rewired and conventional controllers remain missing."
history:
  - "2026-09-26: initial placement -> scientific D / interest A, high confidence; whole-MaleCNS integration credited, behavioral attribution withheld for lack of matched controls."
note: "This is currently strongest as an embodiment/visualization artifact, not as evidence that MaleCNS improves ecological behavior."
---
