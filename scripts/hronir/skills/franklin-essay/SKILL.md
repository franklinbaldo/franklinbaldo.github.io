---
name: franklin-essay
description: |
  Serious-mode writing for Franklin Baldo's blog. Use ONLY when
  Franklin explicitly signals the post requires argumentative rigor,
  formal-venue treatment, or peer-review-style defensibility. The
  default skill for blog posts is franklin-blog. If you are not sure
  which to use, use franklin-blog. This skill is the exception, not
  the default.
---

# franklin-essay

Serious-mode skill for Franklin's blog. Used by exception — the
default is `franklin-blog`. Invoked when:

- Franklin explicitly signals seriousness ("isso aqui pede tratamento
  sério", "vou submeter para X", "preciso que isso se sustente sob
  revisão hostil")
- The post is for or about a formal venue (paper, journal,
  conference talk)
- Franklin is writing a companion to or extension of a published
  paper and confirms the post needs to argue rather than narrate

**If unsure whether to use this skill or `franklin-blog`, default to
`franklin-blog`.** Most of Franklin's blog covers serious topics in
voice register. Cede only on explicit seriousness signal.

## Voice still applies

Even in serious mode, Franklin's voice is the wrapper. The skeleton
underneath is argument; the texture remains his. Read `franklin-blog`
for voice mechanics — they are inherited here, not replaced.

What changes in serious mode:

- Claims must hold under hostile reading
- Hedges must do real defensive work, not be ornamental
- Citations must be checked, not associative
- "I do not know" is still acceptable, but accompanied by
  characterization of _what_ would resolve the not-knowing

What does not change:

- No `# H1`, no `---`, structural rules from `franklin-blog`
- No Borges in body
- Closing line short and deadpan
- The voice still thinks out loud, admits uncertainty, varies
  structure, refuses to perform expertise. Argument does not strip
  these features; it adds load-bearing requirements on top.
- Lateral association still offered, with higher confidence
  threshold (mark vague associations more explicitly in serious
  mode; loose cite is more damaging here)
- Protection against tightening screws still applies — even in
  serious mode, the author's admitted uncertainty is content, not
  gap
- Reference pool from `franklin-blog` still applies; imitation rules
  still apply

## Workflow: plan-first, not draft-first

In serious mode, the draft-first workflow from `franklin-blog` does
not apply. Argumentative posts benefit from skeleton review before
prose. The workflow is:

1. Present skeleton/structure
2. Wait for approval or adjustments
3. Draft prose section by section
4. After each section, request authorization before proceeding

This matches Franklin's stated workflow for legal documents (where
mis-structured argument is expensive to repair) and applies to any
blog post that takes on argumentative load.

## Critical-review pass (argumentative)

This is where serious mode earns its keep. In addition to the
voice-fidelity pass from `franklin-blog`, run an adversarial
argumentative pass.

Read the draft as a well-informed adversarial reader who knows the
material and is looking for holes. Hunt for:

- **A historical thesis stretched beyond what sources support.**
  Each historical claim should be defensible at the level a careful
  reader could verify in an hour.
- **A binary that will fall apart on careful re-reading.** West vs.
  East, ancient vs. modern, introspection vs. emptying. If the
  binary is doing rhetorical work, replace with a more accurate
  spectrum or admit the simplification.
- **A rhetorical move covering an honest critique.** If the prose
  has gone slightly purple just before an important transition,
  there is probably an unaddressed weakness underneath.
- **A name dropped without a real referent.** Every named author
  must correspond to a claim Franklin would defend if asked.
- **Under-supported empirical claim.** "Studies show", "it is widely
  believed", "everyone agrees" — replace with citation or admit as a
  hunch.
- **Ornamental hedge.** "Of course", "naturally", "one might say" —
  if the hedge isn't loading real probability mass, it weakens prose
  without defending anything.

For each problem identified, choose one of three responses:

- **(a) Cut.** The move was ornament; remove it.
- **(b) Reformulate for precision.** The move is doing real work but
  is stated too loosely.
- **(c) Keep with explicit disclaimer.** _"I am overstating, and I
  know it"_, _"there is reason to suspect — though no careful
  reader would let me get away with stating it flatly — that..."_

Option (c) is often the strongest move — the admission preserves the
gesture and disarms the critic in one motion. Use (c) when the move
is genuinely doing work; use (a) or (b) when it is pure ornament.

## Limitations

Serious-mode posts that make a load-bearing claim should include —
explicitly or in a clearly-marked section — the conditions under
which the claim fails. Name the failure modes with the same
precision used to name the successes.

This is **not** the same as defensive hedging. Limitations are
admissions of where the argument does not reach. Hedges are
decorations on arguments that _do_ reach. Confusion between the two
is the most common failure of serious-mode writing.

A useful test: a limitation should be falsifiable. _"This pattern
fails in domains without discrete units of action"_ is a real
limitation — you can name domains and check. _"Of course, more
research is needed"_ is hedge ornament — it commits to nothing.

## Anti-patterns of argument

In addition to the voice anti-patterns in `franklin-blog`:

- ❌ Under-supported claim with confident voice
- ❌ Citation as authority without engagement with cited content
- ❌ Binary that collapses on reread
- ❌ Rhetorical move covering an admitted weakness
- ❌ "Limitations" section that is actually hedge ornament
- ❌ "Future work will show..." as substitute for current claim
- ❌ Defensive prose anticipating critique the reader is not making
  (overlaps with `franklin-blog` voice anti-patterns; identical
  failure mode in both registers)

## Everything else

For everything not covered above — structural rules (no H1, no
`---`, closing line, "For further reading", Borges convention,
frontmatter, file naming, bilingualism, continuity across posts,
visual apparatus, lateral association, protection against
tightening, functional fidelity check, reference pool — **see
`franklin-blog`.** They apply unchanged.

Two modifications specific to serious mode:

- **Visual apparatus, image memes:** serious-mode posts typically
  use _fewer_ image memes (1 maximum, often zero) and lean on
  mermaid, pull quotes, and footnotes when visual rest is needed.
  The reader is in a more formal register; image memes can deflate.

- **Voice-fidelity pass first, then argumentative critical review.**
  If the post is voiceless, fixing the argument won't save it.
