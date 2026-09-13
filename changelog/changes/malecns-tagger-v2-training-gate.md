---
type: changed
scope: experiment
---

Add a 512-neuron MaleCNS tagger training-regime gate that keeps the v1 data, graph, paired seeds, and controls fixed while replacing the hard three-epoch endpoint with best-validation-F1 checkpoint restoration, plateau-aware learning-rate reduction, and early stopping. Preserve the accompanying blog post as a draft until the gate result is incorporated.
