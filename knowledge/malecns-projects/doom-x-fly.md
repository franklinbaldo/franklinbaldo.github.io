---
type: malecns-project
project_id: "aur1ety-doom-x-fly"
name: "DOOM-x-Fly"
ownership: "independent"
kind: "MaleCNS recurrent substrate with trained visual-action head for ViZDoom"
stage: "held-out E1M1 navigation results with adversarial vision controls; topology-specific advantage unresolved"
primary_url: "https://github.com/Aur1ety/DOOM-x-Fly"
repository: "Aur1ety/DOOM-x-Fly"
evidence_url: "https://github.com/Aur1ety/DOOM-x-Fly/blob/main/docs/RESULTS.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "b606cf2604e4999394271e54cd5631055b496da9"
summary: >-
  A frozen MaleCNS-derived recurrent substrate, hand-built visual front end and
  trained action head navigate the unmodified E1M1 level with strong held-out
  reactive behavior. The repository also preserves evidence that matched rewires
  carry more target information in an earlier task, so this supports useful
  frozen-connectome computation rather than superiority of biological wiring.
strongest_evidence:
  - "On 100 untouched E1M1 test seeds, the connectome agent reaches the exit in 57% of runs and averages 92% route progress; widened starts plus sticky actions yield 64% exits."
  - "Randomly reordered frames, black frames and flat-grey frames all reduce exits to 0%, while an open-loop replay reaches only 6%, bounding memorized-route and vision-free explanations."
  - "The recurrent wiring remains frozen; training is confined to the downstream head."
  - "An earlier topology gate reports degree- and weight-preserving rewires carrying more target information than the biological wiring (R2 0.62 vs 0.46), and the adverse result is retained."
limitations:
  - "The eye is a hand-built motion/contrast model rather than a validated fly visual system."
  - "The final head has about 5.4 million trained parameters and reads visual projection neurons as well as descending neurons."
  - "No matched rewired/random recurrent control has yet been run on E1M1 itself."
  - "Successful navigation depends on stochastic action sampling; the greedy policy reaches 0% exits."
  - "The result covers one level on one difficulty setting."
controls:
  - "Held-out random, always-forward, open-loop replay, shuffled-frame, black-frame, flat-grey and privileged-reference controls are reported on the same protocol."
  - "Wide-start and sticky-action perturbations test sensitivity to starting state and repeated controls."
  - "The earlier topology gate is adverse to a connectome-superiority claim, though it used a float16 feature cache and is not an E1M1 matched control."
  - "Missing: E1M1 biological topology versus degree/weight-matched rewire or random recurrent substrate under the same eye, head capacity and training budget."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; strong held-out reactive controls credited, connectome-specific superiority explicitly withheld."
note: "The tier rewards controlled closed-loop performance and preservation of adverse topology evidence, not a biological cognition claim."
---