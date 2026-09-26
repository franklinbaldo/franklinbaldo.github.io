---
type: malecns-project
project_id: "tolga-ileri-flycoder"
name: "FlyCoder"
ownership: "independent"
kind: "fixed-connectome CSS-control demo"
stage: "reproducible single-seed closed-loop demo with external selector scaffolding"
primary_url: "https://github.com/tolga-ileri/FlyCoder"
repository: "tolga-ileri/FlyCoder"
evidence_url: "https://github.com/tolga-ileri/FlyCoder/blob/main/README.md"
scientific_tier: "D"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "3b5c60238629a24985eb0e387fc5af517f3fa269"
summary: >-
  A frozen MaleCNS-derived FlyBrain is placed in a real closed loop for a CSS
  centering task, but an external Q-biased action cursor and idle-commit fallback
  materially scaffold the successful behavior. The artifact is reproducible and
  unusually explicit about its interface boundary; it does not yet demonstrate
  a MaleCNS-specific control advantage.
strongest_evidence:
  - "The demo keeps MaleCNS-derived recurrent weights frozen while routing experimental visual inputs through identified projection-neuron groups and reading descending-neuron activity."
  - "A documented headless seed-64 replay reports centered=True after 10 attempts and 180 brain steps."
  - "The implementation exposes whether actions came from neural commit, reject, or the external idle fallback, making the control boundary auditable."
limitations:
  - "The published success is a single-seed deterministic demonstration rather than a replicated held-out evaluation."
  - "On tied DNa02 laterality, an external selector moves toward untried or higher-Q actions; after eight quiet cycles it commits the current cursor even without a descending commit signal."
  - "No matched rewired connectome, random recurrent network, no-connectome selector, or compact conventional controller is reported for the same task."
controls:
  - "Connectome weights remain frozen and experimental encoder, decoder, reward and selector logic are explicitly separated from the MaleCNS substrate."
  - "A deterministic headless replay is provided, but Q-bias-off, idle-commit-off and topology-destroying ablations are still needed to isolate the MaleCNS contribution."
history:
  - "2026-09-26: initial placement -> scientific D / interest A, high confidence; reproducible closed loop credited, externally scaffolded task success kept below topology-evidence tiers."
note: "The tier evaluates the MaleCNS evidence, not the polish or creativity of the demo."
---