---
type: Technical Specification
title: Blog audio publication pipeline
description: End-to-end contract for deriving narration from a canonical blog post, synthesizing only after readiness, publishing media to Internet Archive, and surfacing verified audio in the site and feed.
tags: [audio, blog, tts, internet-archive, rss]
timestamp: 2026-09-01T19:00:00Z
---

# Blog audio publication pipeline

The canonical article Markdown remains the editorial source. Narration preparation is a derived editorial artifact and must not invoke external models. Once narration is explicitly ready, TTS may run through the configured media worker. Final binaries are uploaded to Internet Archive and are exposed by the blog only after public URL verification.

The publication state is `data/blog-audio.json`. A successfully verified episode appears in three surfaces from the same manifest: the article player, `/audio/`, and `/audio.xml`.

A regeneration may replace bytes and media URL but never changes `guid: audio:blog:<post_id>`.
