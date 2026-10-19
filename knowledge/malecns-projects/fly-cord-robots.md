---
type: malecns-project
project_id: "sakshaymahna-fly-cord-robots"
name: "fly-cord-robots"
ownership: "independent"
kind: "MaleCNS/MANC-derived locomotor circuits embodied in MuJoCo legged robots"
stage: "results-bearing open-loop embodiment with preregistered closed-loop negative pilot and engineered interleg coordination study"
primary_url: "https://github.com/SakshayMahna/fly-cord-robots"
repository: "SakshayMahna/fly-cord-robots"
evidence_url: "https://github.com/SakshayMahna/fly-cord-robots/blob/main/docs/closed_loop/RESULTS.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-27"
reviewed_revision: "4ad019ec2d8ebf37d08924414e15f6cc387eeebe"
summary: >-
  A connectome-grounded fly walking project that reproduces published ventral
  nerve cord circuitry, maps connectome-derived motor-neuron activity into a
  MuJoCo body and then tests what is required to close the proprioceptive and
  interleg loops. Its strongest evidence is unusually informative negative
  evidence: four preregistered proprioceptive encoders find no regime where
  feedback materially changes the neural trajectory while preserving rhythm,
  and subsequent coordination work explicitly shows that usable interleg
  timing must be supplied downstream. The tier is B because the experiments
  isolate real failure mechanisms and preserve adverse results, but coordinated
  locomotion is not produced by the connectome alone and no matched topology
  null tests whether the measured wiring is specifically necessary.
strongest_evidence:
  - "The preregistered closed-loop pilot tested four proprioceptive encoder formulations; across the stable regime trajectory effects remain about 0.0000-0.0010, while gains that produce effects around 1.01 destroy the rhythm, leaving 0 of 7 sweep levels meeting both preregistered criteria."
  - "The project reproduces six published leg circuits and drives actual MuJoCo joint movement from connectome-derived motor-neuron activity in open loop before adding feedback."
  - "Measured MaleCNS/MANC geometry rules out conduction delay as the needed 12 Hz antiphase mechanism: the longest inter-CPG distance is 432 micrometers, while the required 41.7 ms delay would imply an implausibly slow 0.0104 m/s conduction velocity."
  - "Cruse-style downstream coordination with a pausable clock yields a hexapod tripod index of +0.282 and, without re-specifying the rules, left-right quadruped alternation of -0.743 after middle-leg removal; the repository explicitly attributes timing coordination to the engineered rules rather than the connectome."
limitations:
  - "The closed-loop result is explicitly a pilot on parameter seed 641 with replicates 0-3; the preregistered main-experiment seed was not run."
  - "Usable interleg coordination is supplied by an engineered pausable clock and Cruse-style rules downstream of the connectome because the modeled CPGs cannot be entrained without destroying their rhythm."
  - "The primary walking circuitry is ventral-nerve-cord/MANC-derived rather than a demonstration that the entire MaleCNS jointly controls the robot."
  - "No degree-preserving rewire, random recurrent network or conventional controller is matched to the same neural/interface budget for a topology-specific comparison."
  - "Transfer to a quadruped demonstrates reuse of the engineered coordination rule, not autonomous discovery of a new gait by the connectome."
controls:
  - "Four successively refined proprioceptive encoders are evaluated under the same preregistered decision rule, including explicit baseline-stability filtering."
  - "The project separates rhythmicity from feedback effect size and preserves the null/destructive regimes instead of selecting a favorable gain after the fact."
  - "Coordination experiments compare bounded output delay against a pausable-oscillator implementation and test the same rules after middle-leg removal."
  - "A matched topology-destroying neural null remains missing, so B does not imply biological-topology superiority."
history:
  - "2026-09-27: initial placement -> scientific B / interest S, high confidence; strong preregistered negative and mechanism-discriminating evidence credited, while downstream engineered coordination and missing topology null bound the claim."
note: "The strongest contribution is the clean boundary it establishes between what the measured fly circuitry supplies and what the robot still needs from engineered coordination."
---
