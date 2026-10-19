---
type: changelog
date: 2026-10-05
description: Publish the essay "The Shader Is the Fly’s World" with a live closed-loop MaleCNS demo.
tags: [blog, connectome, essay]
---

# Publish "The Shader Is the Fly’s World"

- Adds `src/content/blog/the-shader-is-the-flys-world.md`, an English essay on closing the loop between a fly connectome's descending neurons and a Fourier-parameterized shader.
- Preserves the author's text verbatim; only Markdown structure (section headings, `text` blocks for the loop and operators, blockquotes for the two contrasted questions) was added.
- Adds `/fly-shader/`, a closed-loop demo: twelve drifting Fourier modes rendered by a WebGL shader, sampled by an 8×4 analytic eye, fed to the frozen MaleCNS connectome through a dedicated worker reusing the FlyDoom Fourier Next update rule, with the 1,314 descending neurons driving the complex mode coefficients through a fixed random projection. Includes perturbation, a mode-amplitude waterfall and an empirical kick→response operator measured with paired counterfactual probes: at each kick a second worker replays closed-loop and leak-only branches with and without the kick from an identical snapshot, and the operator is their difference-in-differences.
- Embeds the demo at the end of the post under a short "Try it" section.
- Leaves cross-linking to the related FlyDoom Fourier posts for a later editorial decision.
