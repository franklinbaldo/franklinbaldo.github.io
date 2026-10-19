---
type: malecns-project
project_id: "mertefesensoy-onfly"
name: "ONFLY"
ownership: "independent"
kind: "portable MaleCNS feeding-subcircuit simulator and mainframe reproducibility experiment"
stage: "results-bearing 501-neuron subcircuit with cross-platform deterministic execution; real IBM Z remains untested"
primary_url: "https://github.com/mertefesensoy/ONFLY"
repository: "mertefesensoy/ONFLY"
evidence_url: "https://github.com/mertefesensoy/ONFLY/blob/main/docs/ONFLY-SRS.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "02dedf64770b0faf382e1c4cc295c9b9c40f691f"
summary: >-
  ONFLY extracts a 501-neuron MaleCNS sugar-to-feeding subcircuit, compares it
  with a much larger annotated MaleCNS reference and runs the same fixed-point
  experiment through portable C89/SoftFloat implementations including s390x
  under QEMU and MVS 3.8j under Hercules. Its strongest contribution is the
  unusually explicit reproducibility ledger: 19 golden requests agree across
  the recorded platforms and the scientific runs preserve both successful
  dose-response results and failures or post-result changes to acceptance
  criteria. The tier stops at B because the science is measured on x86, the
  decisive network files are not yet distributed for clone-only reproduction,
  the subcircuit carries a fitted compensating input, and no matched
  rewired/random topology control establishes MaleCNS-specific computation.
strongest_evidence:
  - "On x86-64, sugar input at 40, 60, 120 and 200 Hz makes the MN9 feeding motor neurons fire in all 30 seeds at every rate, while zero sugar produces zero spikes in all 501 modeled neurons."
  - "The compensated 501-neuron subcircuit stays within 10% of the 184,099-neuron annotated MaleCNS reference at 40, 60, 120 and 200 Hz under the project's reported protocol."
  - "Nineteen golden requests have matching fingerprints across the recorded x86-64, Linux s390x/QEMU and MVS 3.8j/Hercules implementations; the project also records a GCCMVS code-generation fault found by byte-level stream comparison rather than hiding it behind the fingerprints."
  - "The project preserves the failed magnitude comparison to the Shiu-style reference and explicitly records that two acceptance criteria were changed after seeing results."
limitations:
  - "The scientific acceptance measurements are x86-64 results; MVS and s390x establish implementation agreement, not an independent biological or scientific replication."
  - "The 501-neuron subcircuit includes a fitted compensating input for omitted neurons, and its 10 Hz comparison is excluded because the larger reference is too variable there."
  - "The two network files needed for the full x86 suite are not distributed in the repository, so a fresh clone cannot yet reproduce the complete result path."
  - "The project has not run on real IBM Z hardware or z/OS; the MVS result is under Hercules and the s390x result under QEMU."
  - "There is no matched degree-preserving rewire, random recurrent network or conventional computational null testing whether the measured MaleCNS wiring is specifically necessary."
controls:
  - "Zero-sugar trials, 30-seed response measurements, a much larger MaleCNS reference network and a re-run of the Shiu-style reference constrain the feeding claim."
  - "Native, SoftFloat 3e and SoftFloat 2c backends plus big-endian and MVS recordings test numerical portability; response streams are compared beyond summary fingerprints."
  - "Negative and post-hoc evidence is retained: the magnitude criterion originally failed, 10 Hz is excluded from the subcircuit acceptance comparison, and later criterion amendments are explicit."
  - "Missing: a topology-specific null with matched dynamics and operating point."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; cross-platform reproducibility and preserved falsifiers credited, topology specificity and clone-only reproducibility withheld."
note: "The B tier credits disciplined implementation and subcircuit evidence; bit-identical execution across emulators is not itself evidence that MaleCNS topology is biologically privileged."
---
