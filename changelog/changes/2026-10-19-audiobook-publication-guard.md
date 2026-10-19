---
type: changelog
date: 2026-10-19
description: Enforce audiobook publication authorization from the rights record, per chapter
tags: [audiobook, publication, bugfix]
---

The publication guard in `apply-publication` and `publish-internet-archive`
read `public_distribution_authorized` from the work state, where it never
existed, so every real publication was refused. It now reads the work's
`Audiobook Rights Record` (`rights.md`), the only source of that decision, and
also requires the chapter to be listed in `authorized_chapters`: chapter 1 of
HPMOR is authorized, any other chapter is refused.

The HPMOR state also renames `audio_sha256` to `audio_digest` in the
`sha256:<hex>` form the TTS pipeline and the publication writer already use;
the value still matches the published MP3.
