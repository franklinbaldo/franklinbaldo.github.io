---
type: Blog Post
title: 'The license that knocks'
description: >-
  If a skill is text an agent can execute, perhaps its license should also
  come with an executable procedure for finding use, proving the chain, and
  offering regularization.
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

## A license normally just sits there

Licenses are passive documents.

They say what you may do, what you may not do, which notices you must preserve, perhaps when you need to buy another license. Then they wait for human beings to discover a violation, identify who did it, gather evidence, find the responsible company, send an email, negotiate, serve a notice, and eventually litigate.

The license describes a rule. The execution of the rule lives somewhere else.

That is particularly strange in a repository of Agent Skills, because the thing being licensed is already a piece of machine-readable procedure.

So imagine the package:

```text
LICENSE.md
licensing/policy.yaml
license-enforcement/SKILL.md
```

The first file remains the legal norm.

The second is the mechanical part: which license applies, what counts as evaluation, what counts as operational use, whether there is a public price, which states an investigation can occupy, when a human needs to approve something.

The third teaches an agent to do the work that normally appears months later, when someone notices that their work may be in use without permission.

Not to sue anyone by itself. To look.

## The agent that looks for its own skill

The first version I am testing in [`franklinbaldo/skills`](https://github.com/franklinbaldo/skills) starts conservatively.

The agent receives a specific version of one of my skills and looks for public evidence of use. Finding another tool with the same purpose is not enough. It has to freeze the source version, record the commit, locate concrete expression that appears to have survived, and preserve the context on the other side.

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

There may be a private license. There may be prior permission. A statutory exception may apply. It may be third-party material that both of us legitimately copied. It may simply be a part I have no right to monopolize.

Only after those questions do we get to `actionable_concern`: verified use, apparently operational, with no known license or sufficient explanation. Even that remains an internal classification, not a judicial ruling written in YAML.

The skill then builds a dossier for a person to decide whether to make contact.

That separation interests me because agents are excellent machines for jumping from signal to action when you formulate the objective badly. “Find companies using my skill and charge them” is a prompt for producing false positives with corporate confidence. “Build an evidence chain and stop before contact” is a different system.

The difference is not in the model. It is in the protocol.

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

For skills, it is not “the knowledge” in the abstract. It is the concrete package you install, copy, adapt, embed, and execute. For the tools described on the blog, it may be code, skills, schemas, pipelines, and other concrete artifacts. If someday I want to charge for access to knowledge itself, the mechanism is different: an access contract, a service, a subscription, gated content. Not a public license trying to expand copyright by household decree.

Copyright remains less convenient than a `protected: true` field.

Good.

## Source available is not open source in a bad mood

There is already vocabulary for part of this.

Licenses such as [PolyForm](https://polyformproject.org/licenses) keep source visible while granting different rights for different kinds of use. The [Business Source License](https://mariadb.com/bsl11/) likewise makes source available while limiting production use before a later license change.

That is not _Open Source_ in the Open Source Initiative sense. The [Open Source Definition](https://opensource.org/osd) requires, among other things, freedom to use the program in any field of endeavor; a license cannot demand an additional license merely because the use is commercial.

So there is no point playing games with the label.

The license in my first PR is **source-available, not Open Source**.

It permits reading, inspection, study, and good-faith evaluation. What it does not publicly grant is what I called `Operational Use`: loading, adapting, embedding, or invoking the material in an agent, automation, product, or process to produce actual work.

For that, it says you need a separate paid license.

I have not set the price yet.

That is deliberate.

It would be easy to put “US$100 per company per year” there because numbers give an architecture the reassuring appearance of a product. It would also be an economic decision pulled from nowhere. The first version says `quote_required`: if someone wants to use it, we talk about scope and price.

More importantly, the license also says that finding unauthorized use **does not magically create a contractual debt equal to whatever price I decide to publish later**.

I can offer a retroactive license or a settlement. Depending on the facts, I may have other rights and remedies under law. But “my price list says R$ X” and “you already owe me R$ X” are different sentences.

I wanted the skill itself to know the difference.

## Collection starts by trying not to bill the wrong person

The entertaining part of the idea is imagining an agent roaming the internet, recognizing a skill, identifying the company behind it, and knocking on the door.

The important part is all the work that happens before the knock.

The skill I put in the [experimental repository PR](https://github.com/franklinbaldo/skills/pull/57) contains prohibitions that do more work than the collection part.

It cannot treat functional similarity as copying. It cannot assume “I did not find a license” means “there is no license”. It has to look for counterevidence. It has to distinguish concrete expression from a method or idea. It cannot invent a price. And it cannot contact anyone without explicit human approval.

The first contact, if there is one, is a compliance inquiry.

Something like: we found this public artifact, it appears to incorporate this material, the public license does not grant operational use, but there may be a private authorization we cannot see. If there is one, tell us. If there is not, we can discuss regularization.

Only after that would a retroactive proposal make sense. And, if the dispute remains, a formal extrajudicial notice prepared for human review.

The agent can assemble the chronology, preserve pages, compare versions, identify the legal entity, organize correspondence, and build the packet that a lawyer or rights holder will analyze.

It does not need to earn the right to be the lawyer.

This resembles what I keep finding in other uses of agents: the useful part of automation often ends one step before authority.

## The license has a back door, but only for coming in through the front

The part of the design I liked most is a small recursion.

If every operational use of the skills requires a paid license, then `license-enforcement` itself would require a license for someone to discover whether they are violating the license.

That would be funny for approximately five seconds.

So the license contains a specific exception: anyone may use the enforcement skill for free to perform a self-audit, understand the terms, check whether they need a license, contact me, or respond to a compliance inquiry.

The tool that polices the license is also the tool that helps the other side comply with it.

That changes the character of the thing a little.

A traditional license is written for a hypothetical reader. Here, two machines may read the same policy from opposite sides. My agent asks: “does this use appear covered?” The company's agent asks: “is our workflow operational? what material are we loading? do we have a license?” Both can produce comparable artifacts before a human being has to start arguing by email.

The license begins to look less like a notice on a wall and more like a protocol.

Not a _smart contract_. Nothing executes itself in the legal world. No blockchain can turn a bad inference into a good legal basis.

But there is something smaller and perhaps more useful: a norm accompanied by its operational implementation.

```text
legal text
    +
machine-readable policy
    +
compliance/enforcement skill
    =
a license an agent can actually work with
```

## I am the first lab rat

The convenient thing about having an idea like this is that I already maintain a repository full of suitable material to test it on.

So the first application will not be a hypothetical startup or a new “AI license” trying to solve the entire economics of generative models.

It is my own skills.

[PR #57](https://github.com/franklinbaldo/skills/pull/57) adds the `Skill Use License 0.1`, the `policy.yaml`, and the first version of the `license-enforcement` skill. It is still a draft. There is no fixed price, issued-license registry, automatic fingerprinting, or payment system. Much less an army of agents sending notices to companies.

What exists is the contract between the pieces.

And it already produces questions I would not have asked if I had simply put MIT on the repository and gone to sleep.

How do you prove that a skill was used rather than independently reinvented? What is the economic unit: skill, company, agent, execution, year? How does a company prove to an enforcement agent that it holds a license without publishing its contract? How do rights get versioned when the skill changes every month? What happens to older forks? How much detection can be automated before fingerprinting becomes a hunt for coincidences? What is the minimum shape of a receipt another machine can verify?

Those are better questions than “which license do I put on GitHub?”.

The hypothesis I am testing is that Agent Skills are an unusually good category for experimenting with operational licenses because the object and the procedure live in the same medium: structured text that agents can read.

A software license could always be read by a machine. That is banal.

The difference is a license accompanied by instructions that tell the machine what to do after reading it.

It is not a self-executing license.

It is a license that knows the next step.

## Further reading

- **[Skill Use License 0.1 / PR #57](https://github.com/franklinbaldo/skills/pull/57)** — the experiment described here, still in draft and deliberately without a fixed price.
- **[Brazilian Copyright Act, Law 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)** — especially Article 8, because an experimental license gets much better once it starts by acknowledging what it cannot license as exclusive copyright.
- **[Brazilian Software Act, Law 9.609/1998](https://www.planalto.gov.br/ccivil_03/leis/l9609.htm)** — Brazil's specific regime for computer-program protection, relevant to the parts of skills and tools that actually are software.
- **[PolyForm Licenses](https://polyformproject.org/licenses)** — examples of source-available licensing with permissions calibrated by kind of use.
- **[Business Source License 1.1](https://mariadb.com/bsl11/)** — another design in which source is publicly available without immediately receiving all Open Source freedoms.
- **[Open Source Definition](https://opensource.org/osd)** — useful above all for not calling a license open source when it deliberately requires payment for a category of use.
