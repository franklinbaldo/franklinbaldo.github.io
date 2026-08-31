---
type: changelog
date: 2026-08-31
description: Add VoxCPM2 as an audiobook TTS backend and normalize generated segment loudness before assembly.
tags: [audiobook, tts, voxcpm2, audio]
---

# VoxCPM2 joins the audiobook backends

- Adds VoxCPM2 behind the existing provider-neutral TTS plan and worker contract.
- Normalizes generated segment RMS toward -20 dBFS while respecting a -3 dBFS peak ceiling, recording applied gain in output metadata.
- Keeps loudness normalization in the shared audio-writing path because gain variation is a cross-backend TTS concern rather than a VoxCPM2-specific behavior.
