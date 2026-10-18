---
type: changelog
date: 2026-10-18
description: Add a native Zola migration preview with publication and route-parity safeguards
tags: [infrastructure, zola]
---

Adds a separate native Zola build for the existing bilingual blog content,
public music entries, assets, full-content feeds, social images and audiobook
publications. It reuses canonical editorial selection without changing source
history. Adds focused conversion tests and a baseline route/asset parity gate.

The branch switches the production workflow and default build to Zola, preserves
interactive apps and persistent music playback, and adds desktop/mobile browser
gates. Publication still requires a validated merge and successful Pages deploy.
