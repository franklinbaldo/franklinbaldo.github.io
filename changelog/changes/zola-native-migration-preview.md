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

The GitHub Pages production workflow remains on Astro until the complete route
and interactive-feature parity checks pass. A successful preview is not a
completed production migration.
