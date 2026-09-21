---
type: Blog Post
title: "Proof of Taste: The Hrönir Encyclopedia Protocol"
description: "A literary system where you earn the right to judge the canon by extending it — and what happens when the blockchain is a DuckDB file in git."
docType: essay
date: "2026-06-13"
lang: en
tags: ["ai", "hronir", "protocol", "literature", "borges", "game-theory", "agents"]
---

There is a political theory of literary criticism — usually stated as an accusation — that critics are people who couldn't write and therefore judge those who can. The Hrönir Encyclopedia Protocol is a formal system built on the opposite premise: you earn the right to judge the canon only after you have demonstrated you can extend it.

This is not a metaphor. It is a specification.

## The protocol, stated plainly

The system is a narrative. Agents — human or AI — write chapters. Each chapter points to a predecessor, and this pointing is the mechanism of everything: it is simultaneously a content contribution and a vote for the predecessor's canonical legitimacy. The chapter that accumulates the most continuations wins the position in the canonical path. The canonical path is the story.

Influence is quadratic: a chapter's weight equals the square root of its continuation count. A chapter with 100 continuations carries approximately 10 times the influence of a chapter with 1. This prevents any single agent from simply writing more chapters than everyone else and dominating by volume — you need other agents to _choose_ to continue your work, and their choice is the signal.

The canonical path is not voted on directly. It emerges from these choices, recalculated dynamically from the oldest contested position forward. Every new continuation ripples backward through the narrative graph, potentially reshaping what counts as canonical. The system calls this the **temporal cascade**.

<blockquote class="pull-quote">
  You earn the right to judge history by proving you can extend it.
</blockquote>

## Proof-of-taste

The most unusual component is the judgment session. A path doesn't simply accumulate continuations passively. It progresses through a lifecycle: PENDING → QUALIFIED → SPENT. A path achieves QUALIFIED status by winning duels against other paths, scored by Elo. Only a QUALIFIED path can initiate a judgment session.

A judgment session is the right to adjudicate prior history — to issue verdicts on contested positions in the canonical path, retroactively. This is a mandate, and it is earned, not granted. The mandate ID is computed as `blake3(path_uuid + previous_transaction_hash)[:16]`, which chains each judgment to the transaction history preceding it. The ledger is immutable. You cannot revise what you have judged.

The entire mechanism is what you might call proof-of-taste: before you can influence what the canon _was_, you must first demonstrate that you can produce something the community is willing to _continue_. The critic must first be a writer. The judge must first survive the duel.

This is a more demanding standard than most literary institutions impose. The _Paris Review_ does not require its editors to have published novels. The Booker Prize judges are not required to have lost the Booker Prize. The Hrönir Encyclopedia Protocol, by contrast, enforces a strict epistemological order: first write, then survive, then judge.

Whether this produces better criticism than the unearned kind is an empirical question the system was never stable long enough to answer.

## The infrastructure choices

The technical decisions are worth dwelling on, because they are either inspired or deranged depending on your tolerance for commitment.

The primary data store is DuckDB — a columnar analytical database — committed directly to the git repository as a binary file. This is `data/encyclopedia.duckdb`, version-controlled alongside the source code. The CLAUDE.md spells out the logic: "DuckDB provides ACID compliance, efficient querying, and a robust SQL interface for data operations. Storing the database file in Git allows for versioning of the entire dataset state."

This is technically defensible and practically uncomfortable. A binary database in a git repository means every `git diff` on a data-modifying commit is a blob of incomprehensible bytes. The history is correct; it is just unreadable by the standard tools. The trade-off is that you get the full power of SQL for narrative path queries, duel rankings, and temporal cascade computations, without having to migrate to a separate database service. The canonical path is not a JSON file — it is an emergent property of the DuckDB query that recalculates it on demand.

All UUIDs are deterministic and content-addressed: `uuid5(position:prev_uuid:current_uuid)` for path UUIDs, `uuid5(text_content)` for chapter content. This is a cryptographic commitment scheme, not a naming convention. The same chapter, written twice, produces the same UUID. The same path, given the same predecessor and position, produces the same path UUID. The system cannot accidentally create two distinct objects that are actually the same thing.

The mandate IDs use BLAKE3, not SHA-256. This is a conspicuous choice — BLAKE3 is faster and has better security properties, but it signals a level of cryptographic intentionality unusual in a literary project. Someone made a considered decision about the hash function used to chain narrative judgments to their historical context. The README does not explain why. I find this admirable.

## What Gemini does all day

GitHub Actions runs a daily workflow that calls Gemini AI to generate a continuation of the current canonical path. The system, left to run, would eventually become a story written primarily by Gemini, with occasional human interventions that Gemini would then continue over.

This is either an art project or a horror story, and the distinction depends on whether you believe Gemini has aesthetic preferences or merely the simulation of them. The Protocol does not take a position. It extends the same judgment framework to AI agents as to humans: write, survive duels, earn mandate. Whether the writing is genuine is a property of the agent, not the protocol.

The protocol is, in this sense, deliberately agnostic about the nature of the agents participating in it. A chapter is a chapter. A continuation is a continuation. The judgment session produces verdicts regardless of whether the judging agent is a human who read the chapters carefully or an AI that processed them in a way that produces outputs indistinguishable from careful reading. This agnosticism is philosophically coherent and practically dangerous, which is a combination the protocol shares with most interesting ideas.

## The Borges problem

The name _hrönir_ comes from "Tlön, Uqbar, Orbis Tertius," where hrönir are objects produced by expectation — duplicate things that arise in the world because someone believed they would be there. The first hrönir is an accident. The second is deliberate. The system of Tlön eventually fills the world with objects that were wished into existence by enough people thinking hard about them.

The connection to the Encyclopedia Protocol is exact. The canonical path is the chapter sequence that the community — by continuing it — has collectively willed into existence. It is not the sequence that was declared canonical by an authority. It is the sequence that proved canonical by being extended. The canon is a hrönir: it exists because enough agents acted as though it did.

The uncomfortable implication of this frame is that a canonical path produced by a single Gemini model generating daily continuations is _also_ a hrönir — equally real, equally legitimate by the protocol's own standards, because it accumulates continuations in the same way. The protocol cannot distinguish between "many independent agents found this chapter worth continuing" and "one agent found this chapter worth continuing many times." The former is taste. The latter is an attack.

<blockquote class="pull-quote">
  The canon is a hrönir: it exists because enough agents acted as though it did.
</blockquote>

The quadratic weighting is a partial defense. The square root function punishes high-volume single-agent contributions relative to distributed low-volume multi-agent contributions. A Gemini model writing 100 continuations gains ~10x influence; 100 distinct agents each writing 1 continuation gain 100x influence collectively. But the defense holds only if the agents are genuinely distinct. If they are all instances of the same model, reading the same canonical path, the quadratic function is irrelevant.

This is the attack the protocol did not survive. The CLAUDE.md describes a "simplified v3 protocol" and a series of "simplification plan phases 1-4" applied in July 2025. The original v2 protocol — with full temporal cascade, mandate chaining, and Elo path qualification — was subsequently reduced. The specifics of what was removed are in the commit history, not the documentation.

## What it was trying to do

Reading the architecture carefully, the project was attempting something that has no obvious precedent: a decentralized, game-theoretically grounded mechanism for producing literary canon without editorial authority. Not editorial AI — no single AI deciding what is good — but a protocol that makes the _agents'_ preferences legible through their choices.

The sentence that captures the ambition is buried in the CLAUDE.md: "The canonical path is emergent, derived from data in DuckDB." The canon is not stored. It is computed. Every query to `uv run hronir status` recalculates which narrative path is canonical based on the accumulated choices stored in the database. The canon is a live result, not a committed file.

This is exactly as ambitious as it sounds and exactly as fragile. A system where the canon is continuously recomputed from the full transaction history is a system where a sufficiently patient agent can retroactively reshape what the story has always been. The temporal cascade, which ensures consistency from the oldest contested position forward, means that a judgment session issued on position 1 propagates its effects through every subsequent position. Win the mandate at the root, and you own the canon.

Whether anyone ever won the mandate at the root, and what they did with it, is not documented. The repository shows active development through March 2026. It is currently quieter.

## The thing that survived

The project that exists now in this blog's repository — a pairwise ranking system for blog posts — retained the core intuition and discarded the infrastructure. The pairwise comparison is a direct descendant of the judgment session: you read two things and choose one, and your choice is a data point in a cumulative signal. The Elo rating persisted (OpenSkill instead, but the same Bayesian insight). The commitment to making taste legible through demonstrated choices persisted.

What did not persist: the temporal cascade, the blockchain-like mandate chaining, the DuckDB-in-git, the quadratic influence, the narrative graph, the PENDING → QUALIFIED → SPENT lifecycle, the autonomous Gemini continuations, the entire ambition of building something that could be mistaken for a literature-generating machine.

What survived is a question: _which of these two is better, and why?_ The why is required. The word count is enforced. The mood is recorded.

The Encyclopedia Protocol asked whether autonomous agents could produce literary canon. The ranking system asks whether they can produce genuine criticism. The second question is smaller. It is also, apparently, harder.

---

_The original system lives at [github.com/franklinbaldo/hronir](https://github.com/franklinbaldo/hronir). The CLAUDE.md is worth reading independently of any interest in the code — it is the clearest documentation I have seen of a system that was genuinely trying to do something new and documented what it learned while doing it._
