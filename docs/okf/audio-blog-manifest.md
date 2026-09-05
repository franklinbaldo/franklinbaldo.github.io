---
type: Technical Specification
title: Blog audio publication manifest
description: Canonical contract for mapping published blog posts to externally hosted audio without coupling editorial Markdown to media storage.
tags: [audio, blog, podcast, internet-archive]
timestamp: 2026-09-01T18:59:00Z
---

# Blog audio publication manifest

`data/blog-audio.json` is the publication boundary between editorial content and media distribution.

Each episode is keyed by stable `post_id` and `guid` and may only appear when media is public and verified. Required episode fields are:

- `post_id` — Astro blog collection identity;
- `guid` — stable identity `audio:blog:<post_id>`;
- `media_url` — HTTPS public media URL, normally `archive.org/download/...`;
- `mime_type` — published enclosure MIME type;
- `bytes` — verified byte length;
- `sha256` — digest of the uploaded audio;
- `duration_seconds` — final media duration;
- `published_at` — publication timestamp;
- `archive_item` — Internet Archive item identifier.

The manifest contains only successfully published media. Draft, queued, generated-but-unverified and failed uploads never enter it. Re-generating audio may update media metadata while preserving `guid`.
