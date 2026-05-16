---
title: "Three Hammers Walk Into a Bar"
description: "On three professional postures, four alignment properties, and the one property that had to come from elsewhere."
date: "2026-05-15"
lang: en
translationKey: three-hammers
tags: ["ai", "alignment", "agents", "law", "brazil", "supply-chain"]
---

A lawyer, a Brazilian, and a civil servant walk into a bar. The barman has been reading about AI safety on his phone, and without looking up he says: tell me how you would align an AI.

The lawyer puts down his glass first. *Papelada,* he says. The act does not exist until it is reduced to a text — until what was done has a record that can be appealed, cited, served, archived. If you want a machine to do something, first there must be the document the machine commits to. The document is the act; the doing is compliance with the document.

The Brazilian, who has spent his life inside an *Estado* of cabinets, nods. *Papelada,* he agrees, but he means a different thing. In a Brazilian ministry no consequential act has one signature — the technician drafts, the *assessor* reviews, the *coordenador* approves, the *secretário* signs, often the minister countersigns. *Vistos* on a *despacho.* The chain itself is the act. A signature alone produces nothing.

The civil servant, who reads the *Constituição* the way the others read newspapers, says only: *papelada.* What the law has not expressly authorized, the public agent may not do. Citizens may do anything not forbidden; servants may do nothing not permitted. The catalog of permissions is the limit of the office. A new act not in the catalog is not, by the law of his profession, an act.

The barman waits. None of them has answered the question. All of them have answered the same question.

## Three hammers, one nail

The unflattering thing about the joke is that I am all three.

I am the lawyer; the *Constituição* is my profession's manual. I am the Brazilian, and the *vistos* on the *despacho* are how I shipped a *parecer* last Thursday. I am the civil servant in the most literal sense — *Procurador do Estado*, my paychecks are public budget, the second article of the *Lei Orgânica* governing my office is the rule the civil servant in the bar recites. None of these is a position I argue for. They are, in the most banal sense, my professional formation. *It's giving the same hammer, three handles.*

The unflattering thing about the [paper I just wrote](https://github.com/franklinbaldo/papers/blob/main/paper_affordance_restriction.md) is that it has four properties, and three of them are professional postures translated into alignment vocabulary. The fourth is foreign. *Affordance enumeration, doctrine/procedure separation, structured ex-ante commitment, content-addressed canon* — read aloud they sound like the table of contents of a competent alignment paper. Read against my CV, they are: strict legality, distributed approval, the-act-is-the-paper, and one thing I did not bring.

This is not a criticism of the paper. The first three are good properties. They are the properties of agent design that an unbroken administrative-legal tradition refined over centuries because the actors involved — judges, lawyers, *servidores* — needed those properties to operate without one of them becoming a king. If administrative-legal practice produces useful constraints on machine agents, this is not an accident. It is what happens when a profession that exists to constrain the powerful is asked, for once, what *constraint* looks like.

What I want to record here, before the next paper takes my attention back to itself, is a small genealogy. Where the four properties came from. Which three of them I had on me already, and which one I had to borrow.

## The three hammers, one by one

The lawyer's hammer is *ex ante.* The lawyer does not act and then describe; the lawyer files and then *is*. A *recurso* is not a complaint until it is reduced to text and protocolled into the docket; a *parecer* is not an opinion until it is signed and routed; a *despacho* is not a decision until the *despacho* exists. Acts on the world that have no paper version are, in the lawyer's profession, hallucinations. Property 3 — *structured ex-ante commitment* — is this principle transplanted onto an AI agent. Before doing anything, the agent emits a proposal: which catalog entry it will execute, with which bindings, justified by which path through the catalog. The proposal is the brief. The execution is the lawyer carrying out what the brief says, no more.

The Brazilian's hammer is the *chain of vistos.* No single posture in an *Estado de Direito* produces an act. The technician's draft is reviewed by the *assessor* before reaching the *coordenador.* The *coordenador*'s recommendation circulates as a *despacho* before the *secretário* signs. Some acts climb further. The phrase a foreigner sometimes mistakes for empty bureaucracy — *com vista ao setor de tal coisa,* literally *with sight to such-and-such sector* — is a structural device: nothing of consequence happens without distributed sight. Property 2 — *doctrine/procedure separation* — is this principle generalized. Adding a procedural specialization to the agent's catalog is cheap; adding a doctrinal commitment requires a different signature, in a different queue, under an explicit flag that names what is being done. The asymmetry is not friction. It is the *visto.*

The civil servant's hammer is *legalidade estrita.* Article 37 of the 1988 *Constituição* states it; Bandeira de Mello and Hely Lopes Meirelles spend chapters on it. The citizen may do anything not forbidden; the *servidor* may do nothing not authorized. The agent of the State is bounded by an enumerated catalog of permissions; if the catalog does not say *você pode fazer isto*, then he may not. Property 1 — *affordance enumeration* — is this almost verbatim, with *servidor* replaced by *AI agent.* The agent's allowed actions are the entries in a finite, human-curated catalog. New entries require human approval. The agent does not invent verbs; the *servidor*, by his own oath, does not invent powers.

Three hammers, three properties. *That word is doing too much* when I say neutrally that *the paper describes a pattern.* The honest sentence is that the pattern, for the first three properties, describes the work I had already done before I knew I was doing it.

## The fourth hammer is not mine

Property 4 — *content-addressed canon* — was not in the toolbox I brought to the paper. Catalog entries are identified by hash of normalized content; filenames embed the hash; structural edges between entries point at hashes; an edit changes the hash, which changes the identity, which makes the act of editing structurally an act of replacement. The audit trail is not a separate ledger maintained alongside the catalog — *the catalog is the ledger*, because content equals identity.

This is not a technique that administrative-legal practice developed. It is borrowed, openly, from software supply chain. Merkle trees (Merkle, 1987). Git's object model, in which every commit, tree, and blob is a SHA. Sigstore and the SLSA framework for verifying that what was built is what runs. In-toto attestations. Software people figured out, painfully, that *the human-readable name of a thing is not a reliable identifier for the thing,* and that durable provenance requires identifying every artifact by what it contains.

Administrative-legal practice classically fails at exactly this. *Carbono-papelado* in Brazilian offices was the closest thing to a hash function: the carbon copy guaranteed that two pieces of paper had the same content, by mechanical impression rather than by transcription. *It's giving primitive Merkle leaf.* But the carbon copy did not survive archival migration; case files were lost in floods, in fires, in the move to digital systems where original-form imprecision was silently smoothed out. A *norma revogada* whose pre-revocation text the present office no longer has is a regular event; the act that depends on the older version becomes legally uncitable, not because anyone decided so, but because the text has drifted under everyone's feet.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/drake/Inventing_Property_4_from_first_principles/Reading_the_SLSA_spec_and_writing_it_down.png?width=500"
    alt="Drake meme: Drake refusing the top panel labeled 'Inventing Property 4 from first principles'; Drake nodding approvingly at the bottom panel labeled 'Reading the SLSA spec and writing it down'."
    loading="lazy"
  />
  <figcaption>The honest tally on Property 4. Three I had on me from the day job; one I copied from people who had already solved my problem on a different artifact.</figcaption>
</figure>

This is what makes the paper a paper and not a memoir. The three hammers from my professional formation produced three properties that were useful but always incomplete. Content-addressing was the piece that was missing — the technical guarantee that the catalog the agent acted under at moment *t₀* is recoverable, bit-for-bit, at moment *t₁*, no matter how the filesystem has been rearranged in between. The administrative-legal tradition would have liked this property and could not produce it. It had to come from software that learned, the hard way, that you cannot trust filenames.

## If you're a hammer

The joke is funny because the same word — *papelada* — does three different jobs in three different mouths. The risk of writing the paper from this background is exactly the warning the title carries: if you're a hammer, every problem is a nail. Maybe alignment is not paperwork. Maybe LLMs need something stranger than what three administrative postures can offer.

The honest answer, for general alignment, is probably yes. Open creative writing has no discrete unit of action; intimate conversation has no record where reflection belongs; investigative journalism with confidential sources actively *resists* being auditable. Each of the three hammers fails on a different one of these. The civil servant's enumerated catalog cannot describe a condolence letter; the Brazilian's chain of *vistos* has no analog in a private deliberation; the lawyer's *ex-ante* commitment makes no sense for a journalist who cannot pre-commit to what the source will reveal. *The math is not mathing* outside the domain.

<blockquote class="pull-quote">
  The pattern was not derived from a general theory of alignment. It was abstracted from the conditions under which the three hammers all hold.
</blockquote>

What the three hammers *do* identify, when they fit, is not a metaphor for alignment but a specification of where this particular pattern applies. The [paper's Section 5](https://github.com/franklinbaldo/papers/blob/main/paper_affordance_restriction.md) names three semantic questions — *is there a discrete unit of action, is there a record where reflection belongs, does the operator want to be auditable* — and the questions are, in retrospect, the three hammers asking *where in the world do we all hold simultaneously?* When all three answers are yes, the pattern fits and the lawyer-Brazilian-civil-servant agrees with himself across his three handles. When any answer is no, the agreement collapses and one of the hammers is being asked to drive in something that is not a nail.

This is also why [the companion post](/blog/2026-05-14-the-agent-that-doesnt-invent-verbs) limits its claim to bounded administrative-legal agents. The pattern was not derived from a general theory of alignment. It was abstracted from the conditions under which the three hammers all hold. Inside those conditions the pattern fits without remainder. Outside them, none of the hammers is the right tool, and pretending otherwise is the joke turned against the joker.

## Last call

The three of them have finished their drinks. The barman, who has been listening more carefully than they noticed, dries a glass and says, in the matter-of-fact tone of someone delivering the only sensible observation of the evening:

*— É, vocês acabaram de descrever o paper que esse cara aí escreveu semana passada.* [*Yeah, you three just described the paper that fellow over there wrote last week.*]

He nods at a corner table. The three turn to look. There is nobody there, or there is a man with three handles, or there is a stack of paper signed in three different scripts. Cervantes would have liked the structure, though not necessarily approved of it.

The lawyer, the Brazilian, and the civil servant did not align an AI. They were aligned by an AI. The catalog found the *servidor*; the *despacho* found the chain of *vistos*; the brief found the lawyer. A fourth thing — a hash — found them all from outside, and noted, with the politeness of software, that the three of them had been the same person all along.

The bar closes. A reader will arrive, eventually.

## For further reading

- **Hely Lopes Meirelles, *Direito Administrativo Brasileiro*** — the canonical Brazilian administrative-law treatise; the chapter on the *princípio da legalidade* is where the civil-servant hammer is forged.
- **Celso Antônio Bandeira de Mello, *Curso de Direito Administrativo*** — the strict-legality principle in its most explicit canonical form; Property 1 read aloud sounds like a translation of his pages on the *vinculação* of the public administrator.
- **Roberto DaMatta, *Carnavais, Malandros e Heróis* (1979)** — the anthropological account of *jeitinho*, the *despacho*, and Brazilian institutional practice; the Brazilian hammer is one of his standing themes, even if he was describing it from outside the office.
- **Lucy Suchman, *Plans and Situated Actions* (1987)** — the lawyer's hammer in academic register: plans as accountability artifacts, not as causal cognition. The proposal-as-commitment in our paper is what this looks like when implemented on a directory.
- **Ralph Merkle, *A Digital Signature Based on a Conventional Encryption Function* (1987)** — the patent on the fourth hammer; the source the administrative-legal tradition could not have produced and had to import.
- **Franklin Baldo, *[Alignment by Affordance Restriction](https://github.com/franklinbaldo/papers/blob/main/paper_affordance_restriction.md)*** — the paper this post is the biographical companion to. The four properties are stated formally in Section 3; this post is the unofficial appendix on where three of them came from.
- **[The Agent That Doesn't Invent Verbs](/blog/2026-05-14-the-agent-that-doesnt-invent-verbs)** — the architectural companion: how the four properties look in a working system.
- **[Pierre Menard, Computational Researcher](/blog/2026-05-14-pierre-menard-computational-researcher)** — the methodological companion: how the paper was written before the research was done. This post is the third register — biographical, on where the writer's own hammers came from.
