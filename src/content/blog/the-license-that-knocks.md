---
type: Blog Post
title: 'The license that knocks'
description: >-
  An Agent Skill license can do more than say who may use what: it can teach
  the licensee to meter and report use, the issuer to bill, the recipient to
  produce verifiable receipts, and the auditor to verify without central surveillance.
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

The second is the mechanical layer: which license applies, what counts as evaluation, what counts as operational use, which commercial model is active, which states an investigation may occupy, and when a human must approve something.

The third teaches an agent to look outward: find public signals of use, freeze evidence, distinguish similarity from copying, check whether a private license may exist, assemble a dossier, and prepare outreach.

Not to sue anyone by itself. To look.

That first experiment became [PR #57](https://github.com/franklinbaldo/skills/pull/57).

## The agent that looks for its own skill

`license-enforcement` starts conservatively.

The agent receives a specific version of one of my skills and looks for public evidence of use. Finding another tool with the same purpose is not enough. It must freeze the source version, record the commit, locate concrete expression that appears to have survived, and preserve the context on the other side.

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

`signal` means: I found something similar enough to deserve inspection.

`verified_use` means: there is reasonable evidence that material from that skill was copied, adapted, incorporated, or executed.

It still does not mean the use was unlawful.

There may be a private license. There may be prior permission. A statutory exception may apply. It may be third-party material that both of us legitimately copied. It may simply be something I have no right to monopolize.

Only after those questions do we get to `actionable_concern`: verified use, apparently operational, with no known license or sufficient explanation. Even that remains an internal classification, not a judicial ruling written in YAML.

The skill then builds a dossier for a person to decide whether to make contact.

That separation interests me because agents are excellent machines for jumping from signal to action when you formulate the objective badly. “Find companies using my skill and charge them” is a prompt for producing false positives with corporate confidence. “Build an evidence chain and stop before contact” is a different system.

The difference is not in the model. It is in the protocol.

But there was an asymmetry in that design that started bothering me.

Everything was written from the auditor's side.

The rights holder looks. The rights holder measures. The rights holder finds. The rights holder reaches out. The other side enters the system only after suspicion already exists.

That is still a license conceived as enforcement.

## What if the licensee got a skill too?

The question that changed the design was almost obvious once it appeared:

> If the license can teach an agent how to audit, why would it not also teach the licensed agent how to comply?

That is where [PR #58](https://github.com/franklinbaldo/skills/pull/58) came from, stacked on top of #57.

It is still an RFC. It does not silently change the current license or turn `quote_required` into automatic debt. What it proposes is a second regime, `metered_public`, in which the economic rule can only be automated when the policy has already published not just the price and metric, but also **who shares the same meter, when the allowance resets, and exactly which usage range each payment covers**.

And the ordinary flow changes protagonists.

It does not start with the auditor.

It starts with the licensed agent itself.

```text
Licensed Agent
    ↓
license-compliance bootstrap
    ↓
LicenseeMeteringProfile
    ↓
environment discovery
    ↓
MeteringPlan
    ↓
UsageStatement
    ↓
InvoiceRequest
    ↓
Invoice
    ↓
Payment
    ↓
Receipt
```

That looks like a small difference. To me, it is the main difference.

The agent using the skill learns what the relevant unit of use is. It discovers the environment in which it is running. It sees which legitimate instruments exist in that environment for counting that unit. It records a plan. It maintains enough evidence to reconstruct usage. When it reaches the first use not yet covered by the policy, it produces a statement and requests the corresponding invoice.

`license-compliance` has to be a free bootstrap into that work. It would be a wonderfully recursive and completely useless system if the license charged the licensee for loading the skill required to discover how to count, report, and pay for that same license.

So the RFC now treats that as a mandatory bootstrap exception: using the skill exclusively to read policy, establish metering, produce the `UsageStatement`, request an invoice, and verify a receipt does not itself create additional billable usage under that meter.

The license no longer depends on the hope that the rights holder discovers everything later.

It starts teaching the other side to leave a correct trail while using the material.

## Metering is not hidden telemetry

There is a bad version of this idea that would be extremely easy to build.

The skill could phone home every time it was invoked.

Technically convenient. Conceptually awful.

The #58 proposal goes the other way: **self-reporting first; independent verification second**.

Usage initially stays with the party using the skill.

The licensee must maintain a suitable and auditable metering mechanism appropriate to the published metric. Those underlying records may remain private. What must come out of them is a statement reproducible enough to say: under this policy version, in this meter scope, I reached this quantity and there is now this uncovered range.

That enables something I find important: no central authority has to observe every invocation.

The license creates distributed duties to produce evidence among the participants.

The licensee keeps the `usage evidence`.

The `UsageStatement` turns that material into a bounded assertion by the licensee.

The `InvoiceRequest` records that the licensee understands a billing event to have occurred and asks for application of the published policy.

The `Invoice` materializes the issuer's position about that charge and that coverage range.

The payment moves value.

And the `Receipt` says something more specific than “a transfer happened.”

It **attests that the issuing authority recognized that payment as satisfying that invoice for that coverage**.

That is more careful than saying the receipt “proves that everything happened exactly this way.” A signature can show who made a statement and that the signed content was not altered. It does not automatically turn the declared quantity, legal interpretation, or existence of the obligation into truth.

A Pix hash, a blockchain transaction, or a bank confirmation also says too little on its own. The receipt needs to bind policy, skill version, licensee, meter scope, covered range, invoice, payment, time, and issuing authority.

The interesting thing is not that money moved.

It is that another machine can verify **who recognized what, in relation to which charge and which coverage**.

## Where does a charge end?

The word “quantity” hides an expensive ambiguity.

Imagine a policy with 1,000 free uses and paid blocks of 1,000. The licensee reaches use 1,427. Rounding 427 up to one block tells us how much to charge. It does not, by itself, tell us what that payment covers.

Does it settle only the 427 uses already consumed?

Or does it buy coverage through use 2,000?

Does use 1,428 trigger another invoice?

And do the 1,000 free uses reset every month? Per skill? Per company? Per deployment? Per version?

If two honest implementations can answer differently, the policy is not mechanical enough yet.

So the RFC now requires less glamorous and much more important fields: `meter_scope`, counter mode, allowance reset, `coverage_mode`, carry-forward, prepayment, and a watermark such as `coverage_from` / `coverage_through`.

Under one possible profile:

```text
free allowance:     1..1000
first paid block:   1001..2000
second paid block:  2001..3000
```

If the cumulative counter reaches 1,427, the first invoice can be for one block and the receipt can record coverage from `1001` through `2000`. Under that model, use 1,428 is already covered. The next economic boundary is 2,001.

Another profile could choose to settle only the range already consumed. The point is not to choose one universal semantic. It is to prevent `rounding: ceiling` from pretending it already chose one.

A charge needs to know where it ends.

## A ledger without turning blockchain into a religion

The natural consequence is that some artifacts need an independent life.

In the RFC, `UsageStatement`, `InvoiceRequest`, `Invoice`, `Receipt`, `SigningKey`, audit evidence, and findings are proposed as OKF concepts in Markdown.

That connects to something else I have been building: using [`okf-parser`](https://github.com/franklinbaldo/okf-parser) to treat operational knowledge as a corpus that can be validated, graphed, and queried without hiding the meaning inside a private database.

The ledger, then, does not have to be a blockchain.

It can be a repository.

It can be some other append-only storage.

Signatures may come from GitHub/OIDC. They may come from a published public key. Payment might be Pix, WLD, x402, or something else. Those technologies are possible integrations, not foundations of the license.

The foundation is the verifiable chain of assertions, evidence, and attestations.

```text
policy
  ↓
usage statement
  ↓
invoice request
  ↓
invoice
  ↓
payment evidence
  ↓
signed receipt
```

Each edge helps another machine reconstruct who said what, under which rule, and how that record relates to the others. No single edge turns the entire graph into legal truth.

If an invoice is wrong, the idea is not to rewrite the past and pretend it never existed. Cancel or supersede it.

If a receipt was issued incorrectly, publish a correction or revocation.

Public history stays history.

## The auditor now has a better job

Once the licensee starts producing its own trail, auditing does not disappear.

Its function improves.

The parallel flow in #58 now needs to be read like this:

```text
Audit Agent
    ↓
AuditStandard / SkillAuditProfile
    ↓
EnvironmentAssessment
    ↓
research available tools
    ↓
AuditPlan
    ↓
UsageEvidence
    ↓
draft UsageFinding [private]
    ↓
HUMAN REVIEW
    ↓
published UsageFinding / UsageNotice
    ↓
dispute / regularization
    ↓
HUMAN REVIEW
    ↓
audit-originated Invoice
```

The order matters quite a lot.

The auditor does not get a superpower called “investigate.”

It first needs to understand what evidence the skill declares relevant. Then it discovers what world it is in: GitHub? a local filesystem? logs? an API? a public product? documentation? a corporate environment with authorized tools? Then it inventories which instruments are actually available and what the authorization boundaries are.

Only then does it choose how to collect evidence.

Lack of tooling does not authorize creative inference.

And public evidence often supports only a lower bound.

```yaml
observed_usage:
  relation: at_least
  quantity: 35
```

is not the same as:

```yaml
observed_usage:
  relation: exact
  quantity: 35
```

That sounds like a tiny distinction until someone tries to bill on top of it.

The auditor's job is not to manufacture the missing number. It is to preserve the geometry of uncertainty.

And the human gate from #57 cannot disappear merely because #58 gained a public ledger.

An agent can internally assemble a `draft UsageFinding`. Publishing about an identifiable company that `usage_supported: true`, sending a `UsageNotice`, or originating an audit invoice already turns investigation into external action. That again requires explicit human decision.

The RFC now has two stops: one before publication/notice and another, separate one, before an audit-originated invoice after the opportunity to contest.

The agent can still do nearly all the preparatory work.

It just does not become the judge by accident of architecture.

## Attribution is evidence too

Another piece of the idea appeared when I started thinking about what exists between private use and external auditing.

If a skill materially participates in a public product, service, or artifact, the license can require attribution appropriate to the medium.

And there is a different obligation: disclosure when directly asked.

Attribution is proactive.

Disclosure is reactive.

If someone directly asks whether a named skill was used, the licensee should not be able to knowingly deny or conceal that fact when the policy requires disclosure, subject to applicable legal and contractual limits.

That produces distributed evidence too.

A server of mine does not need to see every execution for the system to have verification surfaces.

Attribution offers public evidence of dependency.

Disclosure creates a statement by the licensee when a question is asked.

Metering produces the count — or the bound it can actually support — on the licensee's side.

The `InvoiceRequest` publishes the licensee's assertion that a billing event occurred under its reading of the policy.

The `Receipt` attests that the issuer recognized a particular payment as satisfying a particular invoice and coverage.

Auditing provides an independent trail when any of those things diverge.

The license starts to behave less like a prohibition and more like an accountability protocol.

## The part where the idea runs into copyright law

I wanted a license with a simple intuition: this is like a book. You can open it, read it, learn from it. If you want to put the thing to work inside your company, we make a transaction.

That intuition works only up to a point.

Brazil's Copyright Act, Law 9.610/1998, is rather inconvenient for anyone who would like to charge rent on thoughts: Article 8 excludes from copyright protection, as such, ideas, normative procedures, systems, methods, projects, and concepts. For scientific and technical works, the statute also separates the form of expression from the technical content itself.

That is not a detail to hide in a footnote. It is precisely the boundary the license needs to respect.

If someone reads one of my skills, understands a good idea, and then implements that idea independently, the sentence “operational use requires payment” does not turn the idea into intellectual property I suddenly own. A license does not create copyright where the law deliberately did not.

The same is true of this blog.

I can write about an architecture, explain a technique, describe how I built a tool. The text is a work. The code may be protected. A particular selection of instructions may be protected expression. But I do not acquire a general tollbooth over every brain that learned something here.

That ruins a greedier version of the idea and improves the version that remains.

Because it forces the question of what the economic object actually is.

For skills, it is not “the knowledge” in the abstract. It is the concrete protected material you install, copy, adapt, embed, and execute. For the tools described on the blog, it may be code, skills, schemas, pipelines, and other concrete artifacts.

If someday I want to charge for access to knowledge itself, the mechanism is different: an access contract, a service, a subscription, gated content. Not a public license trying to expand copyright by household decree.

Copyright remains less convenient than a `protected: true` field.

Good.

## Source available is not open source in a bad mood

There is already vocabulary for part of this.

Licenses such as [PolyForm](https://polyformproject.org/licenses) keep source visible while granting different rights for different kinds of use. The [Business Source License](https://mariadb.com/bsl11/) likewise makes source available while limiting production use before a later license change.

That is not _Open Source_ in the Open Source Initiative sense. The [Open Source Definition](https://opensource.org/osd) requires, among other things, freedom to use the program in any field of endeavor and does not permit discrimination against a field of activity.

So there is no point playing games with the label.

The `Skill Use License 0.1` in #57 is **source-available, not Open Source**.

It permits reading, inspection, study, and good-faith evaluation. What it does not publicly grant is what I called `Operational Use`: loading, adapting, embedding, or invoking the material in an agent, automation, product, or process to produce actual work.

The first version deliberately remains `quote_required`.

That matters because #58 does not pretend that a nonexistent price table has already created a debt.

The `metered_public` mode only makes sense if the economic rule is published in advance: metric, meter scope, allowance and reset, cumulative or periodic counter mode, billing unit, rounding, coverage semantics, price, deadline, and invoice-triggering event.

Without that, the agent does not fill the gaps with commercial imagination.

## I am the first lab rat

The convenient thing about having an idea like this is that I already maintain a repository full of suitable material to test it on.

So the first application will not be a hypothetical startup or a new “AI license” trying to solve the entire economics of generative models.

It is my own skills.

[PR #57](https://github.com/franklinbaldo/skills/pull/57) is the conservative prototype: license, machine-readable policy, and enforcement with human review.

[PR #58](https://github.com/franklinbaldo/skills/pull/58) is the conceptual evolution: `license-compliance`, licensee-side metering, `UsageStatement`, `InvoiceRequest`, invoices, receipts, coverage watermarks, and environment-adaptive auditing with explicit human gates. It is an RFC; it is not yet activating that economic regime in the repository.

That distinction matters.

First the protocol can be criticized as a protocol.

Then real metrics, prices, and payment rails can be chosen.

Only after that should an agent be able to automate the ordinary self-reporting and payment path under previously published rules.

The adversarial path is different: publication of findings about third parties and audit-originated invoices remain behind human decision.

The question has become larger than “which license do I put on GitHub?”.

It now looks more like:

> How do two machines, acting for different people and without sharing all of their private memory, produce compatible assertions and evidence about use, billing, and settlement?

That is a licensing problem, but it is also a protocol problem.

And Agent Skills may be an unusually good laboratory because the object, policy, compliance procedure, and audit procedure all live in the same medium: structured text that agents can read.

## The license does not need to observe everything

The part I like most about this second version is that it does not depend on an omniscient auditor.

The licensee learns to meter and report its own use on a reproducible basis.

The issuer learns to apply the policy to the statement and to a determinate coverage range.

The recipient produces a verifiable receipt attesting how that payment was recognized.

The auditor first learns which evidence matters, then discovers what world it is in and which legitimate instruments exist in that world for obtaining it.

Attribution and disclosure create additional verification surfaces.

And all of this can leave an auditable history without a central server watching every invocation.

Not because every signed record is automatically true.

But because each actor leaves an attributable assertion, inspectable evidence, or verifiable attestation — and the protocol preserves the differences among those things.

The first idea was a license that came with a skill to knock on the door.

I still like that image. It remains the beginning of the story.

But now it feels too small.

The license does not merely know the next step.

It teaches each participant to produce the evidence required for the next step to happen.

It is not a self-executing license.

**It is a license that teaches machines to leave proof that they complied with it.**

## Further reading

- **[Skill Use License 0.1 / PR #57](https://github.com/franklinbaldo/skills/pull/57)** — the first prototype: `quote_required`, machine-readable policy, and `license-enforcement` with human review.
- **[Agentic Metered Skill Licensing Protocol / PR #58](https://github.com/franklinbaldo/skills/pull/58)** — the RFC adding self-metering, free `license-compliance` bootstrap, deterministic coverage, invoices, receipts, attribution, disclosure, and adaptive auditing with human gates.
- **[`okf-parser`](https://github.com/franklinbaldo/okf-parser)** — the generic infrastructure I am using to experiment with OKF concepts and relations without putting licensing semantics into the parser itself.
- **[Brazilian Copyright Act, Law 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)** — especially Article 8, because an experimental license gets much better once it starts by acknowledging what it cannot license as an exclusive right.
- **[Brazilian Software Act, Law 9.609/1998](https://www.planalto.gov.br/ccivil_03/leis/l9609.htm)** — Brazil's specific regime for computer-program protection, relevant to the parts of skills and tools that actually are software.
- **[PolyForm Licenses](https://polyformproject.org/licenses)** — examples of source-available licensing with permissions calibrated by type of use.
- **[Business Source License 1.1](https://mariadb.com/bsl11/)** — another design in which source is publicly available without immediately receiving every Open Source freedom.
- **[Open Source Definition](https://opensource.org/osd)** — useful mainly for not calling a license open source when it deliberately reserves categories of use.