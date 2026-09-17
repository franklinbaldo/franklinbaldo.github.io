---
type: changelog
date: 2026-09-16
description: FlyDoom Morph turns the fly into a segmented 3D body controlled through the MaleCNS descending layer, with dense reward and sequential spatial goals.
tags: [flydoom, malecns, morphogenesis, simulation, reinforcement-learning, 3d]
---

# FlyDoom Morph

Reworks `/flydoom-fourier/` from a deformable terrain into a segmented 3D body.

The browser experiment still reuses the compact MaleCNS assets and reads 1,314 descending neurons through eight deterministic buckets, but now trains a small `DN(8) → latent(16)` adapter. A fixed dense coupling matrix projects those latent actions into up to 140 active morphology genes across 14 segments. Segment families can switch among capsule, orb, fin, spike, and ring according to a session-specific vocabulary.

Reward is gradual: shape similarity, distance to the current spatial goal, and frame-to-frame progress are combined continuously. Reaching one goal advances to the next position without resetting the body. `Reset memory` clears only learned policy state; `New target shape` changes the target body and its waypoint sequence while preserving the learned policy.
