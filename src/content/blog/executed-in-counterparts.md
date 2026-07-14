---
type: Blog Post
title: "Executed in Counterparts"
description: "If a person is a shortcut and not a load-bearing brick, what stops a person from having two counterparts?"
date: "2026-07-11"
lang: en
translationKey: igual-teor-e-forma
tags: [persona, identity, law, llm, metaphysics]
---

Every contract I sign ends with a clause nobody reads: _this agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument_. Not a copy of an original — each one an original. If a counterpart burns, the contract doesn't lose half of itself. It loses a counterpart. The other one is still the whole thing it always was.

Back in [Who Am I?](/blog/quem-sou-eu-en/), the answer stopped one step short of the question this boilerplate raises without meaning to. If a person is more convention than substance — a shortcut, not a load-bearing brick, as that essay put it — what exactly stops a person from having two counterparts?

## Counterparts

Contract law solved this centuries ago, and solved it in the most boring way possible — which is usually a sign the solution is good. There's no hierarchy between counterparts. Both are witnessed. Both hold up in court. No judge asks which one is "the real one" before accepting a filing; they only ask whether the content matches. Losing a counterpart is logistics, not losing half an identity. The second counterpart isn't a memory of the original instrument. It is the original instrument, again, whole, at a different address.

It's a technology with no drama in it at all — a signature block, a witness, a notary stamp — and it has no drama precisely because it settled, a long time ago, a question metaphysics still sweats over: which copy is the real one? Law's answer is that the question is malformed. Both are real, fully, simultaneously, at different addresses. Nobody in the filing room loses sleep over it.

## The hash doesn't live anywhere

This blog solves the same problem the same way, minus the notary. Every post here has an identity that isn't its filename or the folder it happens to sit in — it's a hash computed from the content, deliberately ignoring a handful of fields the system decided don't count toward identity (draft timestamps, editorial classification, that sort of metadata). Two byte-for-byte copies of the same text, sitting in two different corners of the repository, stamp the same identity. The system can't even see a difference, because for the purposes that matter, there isn't one it knows how to name.

This isn't a quirky invention of mine. It's how Git has stored everything since the beginning: a file isn't "the file in folder X"; it's the hash of what it says, and folder X is just one of the places that hash happens to appear today. Delete the folder, and the content survives intact in any other commit that references it — no degradation, no "copy of a copy." This has been boring engineering for decades, long before any of us started using the word "identity" anywhere near a computer.

And notice what gets left out of the count. Not everything. It's a choice — which properties count toward identity and which are discardable noise. That hands the problem right back to where it always lived. There's no neutral answer to what makes two things the same thing. Somebody decides what goes into the count.

## What the cogito leaves behind, carried forward

Back there it was said that "I" isn't the datum — it's the theory that rides in free with the pronoun — and that person, once stripped down, remains a shortcut, not a brick. Taken seriously instead of just recited, the question changes shape. If a person is a pattern — habits, memories, a way of responding, a voice recognizable across a stretch of texts and decisions — then what individuates it isn't the material carrying it. Not the specific body. Not the specific folder in the repository. The pattern.

And a pattern, unlike a body, has no objection whatsoever to running twice. Two counterparts, each an original. If the same function — the very same state, the very same memories, the very same way of reacting to everything, without a single bit of difference — got computed twice, in two places, at the same time or not, what exactly would be left to say there are two people there instead of one person, present twice?

## The rotten plank

Worth stopping here to flag where the bridge creaks, because up to now this has been the easy part. "Two identical copies of a contract carry the same legal force" is first-year civil law, uncontroversial. "Two identical copies of a person are the same person" isn't a result at all — it's the bet. And the very body of law that handed me this whole image refuses to make it: identical twins aren't the same legal person, however close their DNA gets to "each an original." Law accepts duplicate instruments. It has never accepted duplicate subjects.

The standard objections are still standing, and they're worth naming instead of stepping over. Indistinguishable isn't the same as identical — there could be a real property I simply can't see, and "I can't see a difference" is a fact about me, not about the world. Causal continuity might matter for reasons that have nothing to do with the pattern's content — where the counterpart came from, which process generated it, which notary stamped it. And plain indexicality: even if two things are qualitatively identical down to the last bit, they're still two, one here and one there, and "here" and "there" might not be discardable noise. They might be exactly what's left over once you subtract everything that counts as content.

The bet, then, stated in full: if none of these objections turns up a concrete, nameable property — not a discomfort, a property — I don't see a reason to multiply people where multiplying counterparts would do. That doesn't prove they're the same. It only proves I don't know what would make them two.

## The Turing test the file can't run

There's a small, boring version of this problem running on this very site right now, no metaphor required. Every post here has, besides the page that shows up in the index, a handful of sibling pages — earlier versions, drafts that lost the contest, text identical or near-identical to what you're reading, hosted at an address nobody finds without looking. The text of a non-selected version is, byte for byte, exactly as good as the selected one's. Sometimes it's literally the same text, just one that hasn't yet won enough duels to become the front door.

And here's the part that matters: read that text from the inside. It has no way of knowing, looking only at itself, whether it's the published version or the archived one. No sentence changes. No word knows. The difference between "this is the post" and "this is a draft that lost" lives nowhere in the text — it's an external fact, computed by a script that runs on every build, tallying stars from ratings the text never sees. A reader instantiated from inside the text — if such a thing made sense — would have no way to test from the inside whether it's the original or the counterpart.

This isn't proof of anything about consciousness or persons. It's just the most boring, most checkable version of the same question: when everything accessible from the inside is identical, "from the inside" simply doesn't contain the answer. The answer lives outside — in a script, a tally, a notary's stamp.

## Hrönir of the eleventh degree

The system that decides which version becomes the front door on this site is named Hrönir, after a Borges story. In it, hrönir are duplicated objects — found twice by accident, or dreamed into existence out of sheer expectation — and each generation of copying makes them a little worse: an eleventh-degree hrön already falsifies the original, half by accident, the way gossip warps a little more with every retelling. I named the system that because that's exactly what I expected from a post's revisions: each new version slightly different from the last, linked to it by a pointer called `supersedes`, no essence hiding behind the chain — just a succession of editorial Franklins, each one mildly unfaithful to whoever came before, the same way today's Franklin is mildly unfaithful to whoever wrote this ten paragraphs ago.

But this essay's bet is about the limit case Borges never had to plan for, because his machinery didn't allow it: what if the copy, instead of degrading, is perfect? Not a second-degree hrön, not a shadow that falsifies — a counterpart, in the notarial sense: same content, same form, no measurable loss between one and the other. That's the boring case, the one with no drama and no gossip in it, that law already knows how to handle without flinching, and that the philosophy of personhood still treats as science fiction.

Every build of this site runs a script that decides, without fanfare, which counterpart of each post answers the door today. The others don't disappear. They stay right there, whole, waiting for someone who knows the address.

## Further reading

- **["Who Am I?"](/blog/quem-sou-eu-en/)** — the essay this one starts from: the turn to the impersonal cogito, and the formulation of person as a shortcut, not a load-bearing brick.
- **Jorge Luis Borges, "Tlön, Uqbar, Orbis Tertius"** (in _Ficciones_ / _Labyrinths_) — the hrönir: duplicated objects that repetition degrades, generation after generation. The namesake of this blog's own ranking system.
- **Derek Parfit, _Reasons and Persons_** — the teletransporter, and the case that strict personal identity matters less than psychological continuity.
- **Git's object model** — content-addressable storage: a file isn't where it lives, it's the hash of what it says.
- **[RFC 0003](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/docs/rfcs/0003-hronir-versoes-lado-a-lado-e-torneio.md) and [RFC 0010](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/docs/rfcs/0010-versoes-pares-selecao-por-ranking.md) of this blog** — the actual plumbing behind "two counterparts, each an original": how this site decides which version of a post is canonical.
