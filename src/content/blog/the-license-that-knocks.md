---
type: Blog Post
title: 'The license that knocks'
description: >-
  An Agent Skill license can do more than say who may use what: it can teach
  agents how to comply, meter use, and leave a verifiable trail — without hidden
  telemetry and without turning licensing into a billing framework.
date: '2026-08-07'
lang: en
docType: essay
translationKey: the-license-that-knocks
tags:
  - ai
  - agents
  - copyright
  - licensing
  - law
emoji: '🧾'
---

My skills repository did not have a license.

That is a mildly ridiculous sentence for someone who spends an indefensible amount of time thinking about rules, contracts, provenance, and agents. The repository was public. The skills were there to be read, installed, and used. And I had never stopped to decide, explicitly, what exactly I was authorizing.

The omission gets more interesting when you ask what a skill is.

It looks like software because it gets installed. It looks like documentation because it is Markdown. It looks like a prompt because it contains instructions for a model. It looks like a small manual because it teaches a task. And, when it works, it feels a little like hiring someone who already knows how to do that task.

An MIT license knows how to deal with software very well. A book license knows reasonably well how to deal with text. An Agent Skill sits in an odd place between the two: you can read it like a chapter, and you can also load it into an agent and make it work.

That is when a slightly more unpleasant idea occurred to me.

What if the license itself came with a skill for collecting the license fee?

That was the first idea.

It did not last long.

Because once I started turning the joke into a protocol, something better appeared: **collection was only half the problem**.

## A license normally just sits there

Licenses are passive documents.

They say what you may do, what you may not do, which notices you must preserve, perhaps when you need to buy another license. Then they wait for human beings to discover a violation, identify who did it, gather evidence, find the responsible company, send an email, negotiate, serve a notice, and eventually litigate.

The license describes a rule. The execution of the rule lives somewhere else.

That is particularly strange in a repository of Agent Skills, because the thing being licensed is already a piece of machine-readable procedure.

The first version I built in [`franklinbaldo/skills`](https://github.com/franklinbaldo/skills) looked like this:

```text
LICENSE.md
licensing/policy.yaml
license-enforcement/SKILL.md
```

The first file is the legal norm.

The second is the machine-readable summary: which license applies, what counts as evaluation, what counts as operational use, which commercial model is active, and which human gates must be respected.

The third teaches an agent to look outward: find public signals of use, freeze evidence, distinguish similarity from copying, check whether a license may exist, assemble a dossier, and prepare outreach.

Not to sue anyone by itself. To look.

That first experiment became [PR #57](https://github.com/franklinbaldo/skills/pull/57), which eventually landed in the repository as `Skill Use License 0.1` and its enforcement skill.

## The agent that looks for its own skill

`license-enforcement` starts conservatively.

The agent receives a specific version of a skill and looks for public evidence of use. Finding another tool with the same purpose is not enough. It must freeze the source version, record provenance, locate concrete expression that appears to have survived, and preserve the context on the other side.

Then it classifies the case.

```text
signal
  ↓
verified_use
  ↓
actionable_concern
  ↓
human_review
  ↓
compliance_inquiry
  ↓
regularization_offer
  ↓
formal_notice
  ↓
legal_escalation
```

`signal` means: I found something similar enough to inspect.

`verified_use` means: there is reasonable evidence of use of the relevant material.

It still does not mean the use was unlawful.

There may be a private license. There may be prior permission. A statutory exception may apply. It may be third-party material that both of us legitimately used. It may simply be something I have no right to monopolize.

`unknown` does not magically become `unlicensed`, and similarity does not become infringement through enthusiasm.

Only after those questions do we get to `actionable_concern`. Even that remains an internal classification, not a judicial ruling written in YAML.

The skill builds a dossier for a person to decide whether to make contact.

That separation interests me because agents are excellent machines for jumping from signal to action when you formulate the objective badly. “Find companies using my skill and charge them” is a prompt for producing false positives with corporate confidence. “Build an evidence chain and stop before contact” is a different system.

The difference is not in the model. It is in the protocol.

But there was an asymmetry in that design that started bothering me.

Everything was written from the enforcement side.

The rights holder looks. The rights holder finds. The rights holder reaches out. The other side enters the system only after suspicion already exists.

That is still a license conceived as enforcement.

## What if the licensee got instructions too?

The question that changed the design was almost obvious once it appeared:

> If the license can teach an agent how to audit, why would it not also teach the licensed agent how to comply?

That led to [PR #58](https://github.com/franklinbaldo/skills/pull/58), an RFC for a possible `metered_public` regime.

The central idea ended up being simple:

```text
Skill use
  ↓
UsageStatement
  ↓
[still covered? stop]
```

If there is uncovered use:

```text
UsageStatement
  ↓
InvoiceRequest
  ↓
Invoice
  ↓
payment
  ↓
Receipt
```

The main character stops being the auditor. It is the licensee itself producing a bounded statement about its use.

And here came the healthy part of the process: **we almost ruined the idea by building too much architecture**.

## The moment a four-Markdown-file experiment nearly became an ERP

At one point the RFC started collecting `LicenseeMeteringProfile`, `MeteringPlan`, `EnvironmentAssessment`, `AuditPlan`, `SigningKey`, finding types, audit models, and a growing list of names that looked important because they were written in PascalCase.

This is a known software-engineering phenomenon: you start by trying to charge 0.001 of something and three hours later you are designing SAP for interplanetary civilizations.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/center/What_is_this~q/An_ERP_for_four_Markdown_files~q.png?width=600"
    alt="What is this, a Center for Ants? meme: 'What is this?' followed by 'An ERP for four Markdown files?'."
    loading="lazy"
  />
  <figcaption>Four Markdown files. Enterprise architecture for interplanetary civilizations.</figcaption>
</figure>

The question that saved the design was brutally simple:

> What does [`okf-parser`](https://github.com/franklinbaldo/okf-parser) already do?

The answer was: almost everything the experiment actually needed.

It already validates Markdown corpora, inventories types, sees explicit relations, builds a graph, and materializes DuckDB.

So the rule became: **do not build a licensing framework on top of a knowledge framework**.

The final RFC kept only four required economic record types:

- `UsageStatement`;
- `InvoiceRequest`;
- `Invoice`;
- `Receipt`.

The policy is a rule. It does not need to become a workflow entity.

Payment is an adapter. Signatures are adapters. Blockchain is an adapter. Pix is an adapter. WLD is an adapter. x402 is an adapter.

None of them need to live in the core.

## The first hole: a price does not grant a license

The first serious review found an important contradiction.

The base license correctly said that no public `Operational Use` license was granted. Productive use required a separate operational license.

At the same time, the RFC showed an example like this:

```text
uses 1..1000     free
uses 1001..2000  first paid block
```

It felt natural to say: “the first 1,000 uses are free.”

But **free is not the same as licensed**.

An economic policy saying `free_allowance: 1000` does not, by itself, create the legal authorization for use number one.

That distinction became an explicit rule in the RFC: `metered_public` can only be activated when an applicable legal instrument — a new license version or a small operational addendum — says that operational use is authorized under the identified policy.

That instrument needs to establish, at minimum, that:

- the identified policy governs the use;
- the free allowance is **licensed**, not merely unbilled;
- later blocks may be covered according to the published rule;
- and the legal instrument prevails if there is a conflict.

The policy calculates. The license grants.

Mixing those two things is a wonderful way to build a system that knows exactly how much to charge for an activity it never authorized.

## The second hole: what is an invocation?

Then came an even more inconvenient question.

The RFC said that two conforming implementations, given the same facts, should reach the same economic result.

Great.

But the unit was `invocation`.

What is an invocation?

A skill loaded once and consulted across five turns: one or five?

Does a retry after an error count again?

Does a helper skill count?

Does a subagent count?

Does an execution that starts and fails count?

Does one execution producing five outputs become five uses by osmosis?

If two honest implementations answer differently, there is no deterministic metric. There is a word in YAML wearing a metric costume.

So the RFC fixed an initial, deliberately boring semantic:

- one invocation is one productive execution attempt of the principal Skill;
- continuations, turns, and outputs under the same `invocation_id` do not count again;
- an automatic retry of the same attempt does not count again;
- a new productive attempt counts;
- a helper Skill invoked inside the principal does not create another principal invocation;
- a subagent that receives the governed Skill as its own principal counts separately;
- routing and evaluation before productive execution do not count;
- if productive execution began and then aborted or failed, it counts once.

This is not the universal definition of invocation for humanity.

It is a definition precise enough for two machines to count the same way.

That is a huge difference.

## Where does a charge end?

The illustrative policy became equally unglamorous:

```yaml
metering:
  metric: invocation
  scope: principal_skill
  counter: cumulative
  free_allowance: 1000
  allowance_reset: never
  billing_unit: 1000
  rounding: ceiling
  coverage: paid_block_watermark
```

Under it:

```text
1..1000     allowance
1001..2000  first paid block
2001..3000  second paid block
```

If the counter reaches 1,427 and the first block is covered, the watermark advances through 2,000. Use 1,428 does not create another charge. The next boundary is 2,001.

The formula can remain almost offensively simple:

```text
covered = max(free_allowance, receipted_coverage_through)
uncovered = max(0, usage_total - covered)
blocks = ceil(uncovered / billing_unit)
requested_coverage_through = covered + blocks * billing_unit
```

That is better than a “billing engine” because there is nothing there to admire.

There is only a rule to execute.

## The third hole: which policy produced this number?

The next review found a time-travel problem.

A `UsageStatement` said something like: I reached 1,427 uses. An `InvoiceRequest` pointed to it. The `Invoice` pointed to the request. The `Receipt` pointed to the invoice.

The graph looked beautiful.

But which version of the policy had transformed 1,427 into coverage through 2,000 and price X?

If `policy.yaml` changed six months later, the graph would remain perfect while the economic explanation disappeared.

The fix was small again: `UsageStatement` now freezes `license_id` and an immutable policy reference — for example a commit and/or digest. Later records inherit that provenance through the chain.

We did not need a ledger service.

We needed to know **which rule was applied**.

That sentence applies to a surprising number of enterprise systems.

## OKF: explicit relations or it did not happen

Then came the most entertaining dogfood result.

We built a tiny fictional corpus:

```text
UsageStatement
  → InvoiceRequest
    → Invoice
      → Receipt
```

Plus one separate `UsageStatement`, representing a protocol trial with no charge.

`okf-parser` validated all five concepts with no diagnostics.

But the graph came back with **zero edges**.

The reason was excellent: the parser had evolved and stopped inventing relationships just because a frontmatter string looked like a `.md` path. Even putting Markdown-link syntax inside YAML was not enough for a graph relation.

The relation had to exist as what it claimed to be: **an explicit Markdown link in the body**.

We fixed the three predecessor links.

The final smoke, using a separate checkout of `okf-parser`, produced:

```text
check      5 concepts, conformant, 0 diagnostics
inventory  2 UsageStatement + 1 InvoiceRequest + 1 Invoice + 1 Receipt
graph      5 nodes, 3 edges, 2 components, DAG
duckdb     5 concepts, 3 links, 0 diagnostics
```

The second component is intentional. It represents a `UsageStatement` that stops there.

That is an important protocol property: **reporting use does not automatically mean owing money**.

## Metering is not hidden telemetry

There is a bad version of this idea that would be extremely easy to build.

The skill could phone home every time it was invoked.

Technically convenient. Conceptually awful.

The experiment goes the other way: **self-reporting first; independent verification second**.

Raw records may remain with the party doing the metering. The public protocol needs the aggregate statement required to reconstruct the economic state, not a camera installed inside the agent.

A `UsageStatement` is a bounded assertion.

An `InvoiceRequest` is a request to apply the published rule.

An `Invoice` is the issuer's application of that policy.

A `Receipt` records that the issuer recognized a particular payment as satisfying a particular invoice and coverage.

None of those documents acquire metaphysical truth because they were committed to Git.

Signatures, hashes, or attestations may strengthen authorship, integrity, and provenance. They do not turn a wrong statement into a true one.

That limit sounds obvious when written this way. Distributed systems have an impressive ability to forget obvious things once they discover cryptography.

## What about auditing?

There was an important pruning here too.

#58 nearly grew a second complete audit architecture.

It did not need one.

#57 already had `license-enforcement`, an evidence model, counterevidence checks, and human gates.

So the economic RFC simply delegates to it.

If there is suspected unreported use, the adversarial path remains a different path:

```text
agent investigates
  ↓
evidence / internal conclusion
  ↓
HUMAN REVIEW
  ↓
contact or publication, if approved
```

A lower bound remains a lower bound.

`at_least: 17` does not become `exact: 17` merely because that would be commercially convenient.

And an invoice originating from an investigation of a third party does not get a free pass just because we now have nice Markdown.

The machine can prepare almost everything.

It does not become the judge by accident of architecture.

## The part where the idea runs into copyright law

I wanted a license with a simple intuition: this is like a book. You can open it, read it, learn from it. If you want to put the thing to work inside your company, we make a transaction.

That intuition works only up to a point.

Brazil's Copyright Act, Law 9.610/1998, is rather inconvenient for anyone who would like to charge rent on thoughts: Article 8 excludes from copyright protection, as such, ideas, normative procedures, systems, methods, projects, and concepts. For scientific and technical works, the law also separates the form of expression from the technical content.

That is not a detail to hide in a footnote. It is exactly the boundary the license needs to respect.

If someone reads one of my skills, understands a good idea, and then implements that idea independently, the sentence “operational use requires payment” does not turn the idea into intellectual property I suddenly own.

A license does not create copyright where the law did not.

The same is true of this blog.

I can write about an architecture, explain a technique, describe how I built a tool. The text is a work. The code may be protected. A particular selection of instructions may be protected expression. But I do not acquire a general tollbooth over every brain that learned something here.

That ruins a greedier version of the idea and improves the version that remains.

Because it forces the question of what the economic object actually is.

For skills, it is not “the knowledge” in the abstract. It is the concrete protected material you install, copy, adapt, embed, and execute.

If someday I want to charge for access to knowledge itself, the mechanism is different: an access contract, a service, a subscription, gated content. Not a public license trying to expand copyright by household decree.

Copyright remains less convenient than a `protected: true` field.

Good.

## Source available is not open source in a bad mood

There is already vocabulary for part of this.

Licenses such as [PolyForm](https://polyformproject.org/licenses) keep source visible while granting different rights for different kinds of use. The [Business Source License](https://mariadb.com/bsl11/) likewise makes source available while imposing production restrictions.

That is not _Open Source_ in the Open Source Initiative sense. The [Open Source Definition](https://opensource.org/osd) requires usage freedoms that a license reserving operational use does not grant.

So there is no point playing games with the label.

`Skill Use License 0.1` is **source-available, not Open Source**.

It permits reading, inspection, study, and good-faith evaluation. What it does not publicly grant is `Operational Use`: loading, adapting, embedding, or invoking the material for productive work.

The baseline deliberately remains `quote_required`.

And here is the distinction the #58 review made impossible to ignore:

```text
license / addendum  → grants the use
policy              → calculates the economic rule
OKF records         → leave the trail
okf-parser          → validates and projects the trail
```

Each layer does one thing.

It looks less magical.

That is exactly why it works better.

## I am still the first lab rat

Both PRs eventually merged into `franklinbaldo/skills`.

#57 put the base license, machine-readable policy, and conservative enforcement path into the repository.

#58 put the `metered_public` RFC and the small OKF fixture that proves the two minimum paths: use that stops at `UsageStatement`, and use that continues through `InvoiceRequest → Invoice → Receipt`.

But merging the RFC **does not activate the economic regime**.

The active policy remains `quote_required`.

There is still no public `metered_public` operational grant, no real counterparty, and no real invoice waiting to be automated.

That is good.

The protocol earned the right to exist before earning the right to charge anyone.

When a real economic experiment happens, it will need to begin with three questions that are far less futuristic than “which blockchain?”:

1. which legal instrument grants the use?
2. what exactly counts as one unit?
3. which version of the rule governed the transaction?

After that, Pix, WLD, x402, or some other integration may be useful.

Before that, it is architecture decoration.

## The license does not need to observe everything

The part I like most about the design that survived is that it does not depend on an omniscient auditor.

The licensee can meter and report its own use.

The issuer can apply a published rule.

The receipt can record which coverage was recognized.

Auditing remains independent and conservative.

And all of this can leave an auditable history without a central server watching every invocation.

Not because every record is automatically true.

But because each actor leaves an attributable assertion and the protocol preserves the relationships among those assertions.

The first idea was a license that came with a skill to knock on the door.

I still like that image. It remains the beginning of the story.

But now it feels too small.

The license does not merely know the next step.

It teaches each participant to produce the evidence required for the next step to happen.

It is not a self-executing license.

**It is a license that teaches machines to leave proof that they complied with it.**

## Further reading

- **[Skill Use License 0.1 / PR #57](https://github.com/franklinbaldo/skills/pull/57)** — the `quote_required` base license, machine-readable policy, and `license-enforcement` with human review; now merged.
- **[Agentic Metered Skill Licensing Protocol / PR #58](https://github.com/franklinbaldo/skills/pull/58)** — the merged RFC defining the `metered_public` experiment, `invocation` semantics, policy provenance, and the four minimal economic records, without activating the regime.
- **[`okf-parser`](https://github.com/franklinbaldo/okf-parser)** — generic infrastructure used to validate, graph, and materialize the fixture without special licensing semantics in the parser.
- **[Brazilian Copyright Act, Law 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)** — especially Article 8, because an experimental license improves when it starts by acknowledging what it cannot license as an exclusive right.
- **[Brazilian Software Act, Law 9.609/1998](https://www.planalto.gov.br/ccivil_03/leis/l9609.htm)** — Brazil's specific regime for computer-program protection.
- **[PolyForm Licenses](https://polyformproject.org/licenses)** — examples of source-available licensing with permissions calibrated by type of use.
- **[Business Source License 1.1](https://mariadb.com/bsl11/)** — another source-available design with production restrictions.
- **[Open Source Definition](https://opensource.org/osd)** — useful mainly for not calling a license open source when it deliberately reserves categories of use.
