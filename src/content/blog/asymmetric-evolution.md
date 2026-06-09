---
title: "The Landscape That Walks"
date: 2026-04-11
description: "Michael Frank Martin argues that evolution and transformer attention are the same mathematical process. He's right. But the asymmetry he names points to something deeper than mathematics."
tags:
  - philosophy
  - evolution
  - machine-learning
  - events
  - process ontology
lang: en
author: franklin
---

Imagine two students cramming for the same exam. The first student has the answer key — it never changes. Every mistake nudges her a little closer to the right answers, and eventually she converges on a perfect score. The second student has no answer key, only other students; each one is also cramming, each one grades the others, and the questions themselves are being rewritten by whoever is currently winning. The first student is a transformer in training. The second is every organism that has ever lived.

Both students use the same basic trick: reduce the gap between what you expect and what you get. The same math, in some deep sense, describes both of them. But pretending that the two situations are "the same problem" is a category error, and it's a category error that matters.

Michael Frank Martin recently published "[Asymmetric Evolution](https://www.symmetrybroken.com/asymmetric-evolution/)" — a serious attempt to show that biological evolution and transformer neural networks are not merely *analogous* but *mathematically identical*: both are gradient flows on spaces of probability measures, governed by Wasserstein geometry and KL divergence. Selection, in his framework, is gradient descent on collective free energy. Mutation is the noise term that keeps the flow from collapsing to a local minimum.

(If none of that last sentence parsed: hang on. It's roughly "evolution is a glorified study-for-the-test algorithm, and so is ChatGPT." The rest of this post is the long version.)

I think he's right. And I think the implications are stranger than he lets on.

---

## The Equation That Shouldn't Work

Price's equation is one of the strangest objects in the history of science. It was derived in 1970 by George Price — a man who, by most accounts, was unraveling personally even as he assembled one of the most powerful mathematical frameworks in evolutionary biology. The equation partitions any change in any heritable trait across any generational boundary into selection and transmission. It is, deliberately, a tautology. It makes no biological assumptions. It works for viruses, ideas, corporations, and parliamentary factions with equal indifference.

The closest thing to Price's equation in ordinary life is **double-entry bookkeeping**. Debits equal credits, always, by construction. You cannot derive profitability from double-entry bookkeeping — it doesn't know what your business does — but you can use it to catch the accountant who's lying. Price's equation is double-entry bookkeeping for traits: whatever changes between one generation and the next, the change must balance across exactly two columns (selection and transmission). Nothing else is allowed in the ledger. You cannot have "evolution" off the books.

Martin tries to derive it from variational principles — specifically, to show that it *emerges* from free energy minimization the way thermodynamic laws emerge from statistical mechanics. This is ambitious. The derivation, if it holds, would mean that selection is not a biological observation but a *consequence* of something more fundamental: the tendency of any adaptive process to descend its own surprise gradient. It's the same flavor of move as Noether's theorem — the moment you discover that a thing you thought was a rule of thumb is actually falling out of a much deeper symmetry, and has been the whole time.

Here is what that means in plain language: an organism is a system that maintains a model of its environment. It has expectations. Every time the world contradicts those expectations, the organism pays a **surprise tax** — in calories, in injury, in missed meals, eventually in dead offspring. Selection favors organisms whose models are better calibrated, which is to say, organisms who owe less in surprise taxes per unit of existing. Better calibration means lower KL divergence between the model's predictions and actual environmental states. (KL divergence is the tax you pay for using the wrong map in the right country: if your map is close, you pay a little; if your map is wrong about which continent you're on, you pay everything.) Lower KL divergence means lower free energy. Selection, then, is just the universe running gradient descent — not on a fixed loss function, but on the ongoing discrepancy between what a population expects and what it gets. The universe is the IRS. Nobody escapes the audit.

Transformers do exactly this. During training, the attention mechanism distributes probability mass across a sequence according to learned relevance weights. The process minimizes cross-entropy — a member of the KL divergence family — between predicted and actual token distributions. The mathematics, at the level of measure theory, is the same flow on the same space.

If you have ever seen the scene from *The Office* where Pam holds up two printouts and quietly goes "corporate wants you to find the difference between these two pictures," you already understand Martin's main move:

![They're the same picture](https://api.memegen.link/images/same/selection_gradient/cross-entropy_loss/they're_the_same_picture.png)

Martin's bridge is real. They are, at the level of the math, genuinely the same picture.

---

## The Asymmetry He Names but Doesn't Follow

So why is it called *asymmetric* evolution?

Martin gestures toward this but moves quickly past it. The asymmetry he identifies is real, and it matters more than the symmetry he establishes.

In transformer training, the loss landscape is fixed. The training data does not change because the model is getting better at predicting it. The gradient flows downhill on a static surface. The optimization is adversarial only in the sense of fighting local minima and saddle points — the objective does not fight back.

In biological evolution, the fitness landscape walks.

Back to the two students. The first one, studying for the fixed exam, is in the same situation as a transformer: her world is generous, in the sense that every hour of study strictly improves her score, and yesterday's improvements are not erased by anything anyone else does. The second student is in the situation of every lineage of every organism that has ever existed. Get better at the test? Great. The curve moved. Still last place. The examiner is another student. The other students are reading over your shoulder. Every so often the building catches fire. Good luck.

Here is the picture, as plainly as ASCII can draw it:

```
   TRANSFORMER                       EVOLUTION
   (fixed hill)                      (walking hill)

       o                                 o
      /|\                               /|\
     / | \                             / | \
    /  |  \                         ~~/ ~| ~\~~
   /   |   \                       ~/ ~ ~|~ ~\~
  /    |    \                      /  ~  |  ~ \
 /     ↓     \                    / ~  ↓ ~ ~ ~ \
/__  grad   __\                  /~~~ grad ~~~~~\
         ↓                              ↓   ↓
       static                        the ground
       terrain                       is also walking
```

Another way to see it: the transformer is a chess engine being trained on ten million grandmaster games. The answer key is sealed in the PGN files. Evolution is the ancestors of those grandmasters, playing against each other across millennia, and every game changes what "good chess" even means. (Even AlphaZero-style self-play, which feels closer, is cheating: the *rules of chess never mutate*. In evolution, the rules mutate constantly — a new pathogen is literally a new rule added mid-match.)

This is a familiar shape if you've been reading along. In [The Game on the Folded Grid](/blog/jogo-na-grade-dobrada/) the central observation was that **the space where the problem seems to exist is not the space where it actually lives** — ML engineers solving high-dimensional puzzles with flat-space intuitions, Lights Out played on a grid that turns out to be a torus. Martin's framework is the same kind of move at one level of abstraction up. He correctly upgrades evolution from "fitness as a number on a flat axis" to "a flow on a curved space of probability measures." That's huge. But the curvature in his picture is *fixed*. The folded grid he draws doesn't fold back. Biology's grid folds back. Constantly. Every other organism is part of the folding.

When a predator evolves faster pursuit, the prey's fitness landscape shifts: being slightly faster than yesterday is no longer enough. When a pathogen evolves greater transmissibility, the host's landscape shifts. When a competitor occupies a niche, adjacent niches change value. The organisms navigating the landscape are *part* of the landscape. Their movement rewrites the terrain beneath them.

This is not a minor technical complication. It is the central fact of biological evolution. The Red Queen told Alice that in her country, "it takes all the running you can do, to keep in the same place." She was, without knowing it, describing a gradient flow on a manifold whose own gradient flow is trying to eat you. Coevolutionary dynamics are gradient flows on surfaces that are themselves gradient flows. You cannot solve this problem by analogy with transformer training, because transformer training explicitly removes the phenomenon you need to understand.

![One does not simply model a walking landscape](https://api.memegen.link/images/mordor/one_does_not_simply/model_a_walking_landscape.png)

---

## What Process Ontology Says Here

The argument underlying these posts holds that what we call "things" are really events — metastable processes that maintain themselves long enough to be named. Species are not objects. They are ongoing processes of differential reproduction. A species is a verb pretending to be a noun for long enough to make it into a taxonomy.

The cleanest analogy is a **whirlpool**. A whirlpool in a river is a perfectly real thing: you can point at it, name it, photograph it, fall into it. But it is not an object. It is what a particular bit of water is *currently doing*. Try to pick it up and you have a handful of river. The water that "is" the whirlpool a moment from now is not the water that is the whirlpool right now. What persists is the *pattern of motion*, not the matter. A species is a whirlpool in the river of reproduction. (Taxonomy is what happens when you try to freeze a movie and sell the individual frames as sculpture. Useful! Just don't confuse the sculpture for what was actually moving.)

This is the same move [The Work That Proves Itself](/blog/the-work-that-proves-itself/) makes about *Hamlet*: the works that survive are the ones that turn out to have been verbs all along. *Hamlet* is not a text that sits on a shelf; it's a mousetrap that re-arms every time someone reads it. A species is the same kind of object. It's not a row in a taxonomy, it's a mousetrap that re-arms every time something reproduces. Both stay coherent because they keep happening, not because they sit still.

If this is right, the fitness landscape isn't a thing either. It is an event — generated continuously by the interactions among all the other events we call organisms, environments, and ecosystems. To say a species "occupies a fitness peak" is to describe a momentary coincidence between one event-cluster and another, both of which are moving. It is like saying two whirlpools "are next to each other." Sure. For now. Check back in five minutes.

Martin's framework is powerful because it captures how populations flow through probability space. What it underweights is that the space itself flows. The Wasserstein gradient descends toward a target that is also descending. The geometry deforms under the flow.

This is the asymmetry that matters. Not that biological evolution and transformers share mathematics — they do — but that biological evolution is a gradient flow on a *dynamic* manifold, while transformer training is a gradient flow on a *static* one. The shared mathematics is real. The shared situation is not.

---

## The Phase Transition at 0.63

Martin's framework generates a specific prediction: extinction occurs when the ratio of environmental perturbation spread to ecological coupling strength exceeds approximately 0.63. He identifies this as a phase transition between stability and collapse.

This number has a suspicious family resemblance. The golden ratio appears in branching processes. Critical percolation thresholds cluster near 0.59–0.68 depending on lattice geometry. The Erdős–Rényi random graph undergoes a phase transition at edge probability 1/n. These are not coincidences — they are signatures of the same underlying universality class, the mathematics of how local connectivity generates global coherence. (And, just to add to the fun: 0.63 is suspiciously close to 1 − 1/e ≈ 0.6321, the constant that turns up in everything from continuous compounding to optimal stopping to the secretary problem. Either Martin has stumbled onto an old friend in disguise, or the universe is trolling us in base *e*. Both options are interesting.)

The right physical intuition for what's happening at 0.63 is a **sandpile**. Drop grains of sand on a pile, one at a time. Nothing happens. Nothing happens. Nothing happens. *Avalanche.* The sandpile didn't "gradually destabilize" — it was exactly as stable as it ever was, right up until the grain that wasn't. Or think of **ice melting**. Ice does not gradually become water by getting visibly mushier. It is ice, it is ice, it is ice, then at 0°C the lattice gives and you have a puddle. There is no transitional substance called "slush" doing the actual work; "slush" is just what we call a phase transition we're allowed to watch in slow motion.

Extinction is like that, and species are the ice. They do not slowly fade. They maintain coherence up to a critical point and then, rather quickly, stop being a thing.

This maps cleanly onto process ontology: what we call a species is a metastable basin of attraction in the space of reproductive events. Extinction is not the death of a thing. It is the disappearance of a basin — the smooth surface suddenly without the depression that held the water. The water doesn't die. The shape that was holding the water does.

What is interesting is that generalist species, by Martin's analysis, contribute disproportionately to ecosystem resilience precisely because they couple to multiple basins. They are not more fit in any static sense; they are more robust to a walking landscape. Generalism is the evolutionary strategy of something that has, perhaps accidentally, learned that the terrain itself is in motion. (The cockroach is not better at being a cockroach than a panda is at being a panda. The cockroach is just better at being whatever it needs to be tomorrow.)

---

## Price's Equation as Conservation Law

There is a reading of Price's equation that Martin approaches but does not quite reach. The equation is often described as a tautology — true by definition, not empirically falsifiable. Critics have used this to dismiss it as uninformative. ("Tautology," in this crowd, is supposed to be an insult. At the right level of abstraction, "tautology" is a *compliment*. It means "we found one of the load-bearing walls.")

But tautologies at the right level of abstraction are not trivial. Conservation of energy is a tautology in the sense that we define energy as the quantity that is conserved — but this does not make it useless. It makes it powerful precisely because it abstracts over all the physical details and tells you what cannot change. Price's equation is to evolution what the **continuity equation** is to fluid flow: it doesn't tell you what the fluid is, where it's going, or what it tastes like. It tells you that whatever flows in must either flow out, stay, or be accounted for. You cannot cheat it, and it does not care what you are made of.

Price's equation, read this way, is a conservation law for *adaptive events*. It says: whatever changes between generations, the total change must decompose into selection and transmission. Nothing is lost in the accounting. What it conserves is not a quantity but a structure — the structure of how process-clusters change across time.

If you read [The OSI Model as Manifesto](/blog/osi-model-as-manifesto/), you already know this shape. The seven layers of the OSI model don't share a meaning; they share an interface. Each layer is opaque to the others — no windows — and yet the whole stack coordinates because every layer commits to producing well-formed events at its boundary. Price's equation is the OSI contract for evolution. The grandparents didn't see your DNA. The DNA didn't see the cell that will read it. The cell didn't see the environment that will select it. They cannot see each other's interiors. The contract is: whatever crosses the generational interface is either *selection* or *transmission*, accounted for in full, and nothing else is permitted on the wire. The blindness is load-bearing. (It always is.)

This is what a process ontology predicts. If reality is events all the way down, then the deepest conservation laws won't conserve *things* — they'll conserve *patterns of becoming*. Price's equation conserves the grammar of evolution. Not what evolves, but how evolution itself is structured.

Martin's framework shows that this grammar is shared with transformer attention. I find that remarkable. I also find it insufficient.

---

## The Question He Leaves Open

Martin concludes honestly: "Whether they share a universality class is testable. Testing it would settle the question."

He's right. The question of whether biological evolution and transformer learning belong to the same universality class is empirical. If the critical exponents match — if the scaling laws governing phase transitions in ecosystems match those governing phase transitions in large language models — then we have evidence of something genuinely deep: that all adaptive processes, regardless of substrate, instantiate the same underlying mathematical structure.

If the exponents differ, the mathematics is shared vocabulary, not shared grammar.

But here is the question Martin's framework raises for me, and does not answer: if the fitness landscape itself is an adaptive process — if the environment evolves as the population does — then what is the correct mathematical object for the coupled system? A gradient flow on a static manifold describes the transformer. A gradient flow on a manifold that is itself a gradient flow describes biological evolution. Are these the same universality class?

Or, one more way to see it: a transformer is a car driving on Google Maps. The roads are where they are, the traffic obeys the speed limit, the GPS lady is patient and wrong only about construction. Evolution is a car driving on a road that is being paved, unpaved, and occasionally flipped upside-down by *the other cars also driving on it* — and each car's steering wheel is wired directly to the asphalt. There is no "the road" to navigate, in the noun sense. The road is what everybody is currently doing.

My intuition, from process ontology: no, these are not the same universality class. The second system has a degree of reflexivity the first lacks. The landscape and the population are mutual events, each constituting the other's context. This is not the mathematics of optimization. It is the mathematics of co-becoming.

[The Gap at the Center of the World](/blog/lacuna-no-centro/) uses Borges's *Circular Ruins* to make a point about agents: a man dreams another man into existence, only to discover at the end that he himself is being dreamed by someone else. That isn't just a parable about AI. It's the structural diagram of a coevolving lineage. The predator dreams the prey; the prey dreams the predator; neither one is the dreamer, both of them are the dream. There is no privileged frame from which to say which population is "the system" and which one is "the environment." That post called the fundamental unit of existence "the Reader" — the thing that, on encountering a signal, transforms itself and the signal at once. An organism is a Reader of its environment. An environment is what a population of Readers is collectively writing. Evolution is two stacks of Readers reading each other. The mathematics of co-becoming is the mathematics of *that*.

That mathematics exists. It lives in the theory of interacting particle systems, in mean-field games, in the study of co-evolutionary dynamics — basically, in *the mathematics of crowds that are aware they are crowds*. Martin's framework points toward it. His falsification tests would help locate it.

Whether they share deep structure with transformer attention, I genuinely do not know. But I think the question is better than he realizes.

---

The most interesting thing about "Asymmetric Evolution" is not the mathematical bridge it builds. It is the asymmetry it names and then, perhaps deliberately, leaves incompletely explained. The gradient flows are the same. The landscape is not. A world made of events would predict exactly this: the mathematics of adaptation is universal; the situation of adaptation — embedded in a world that adapts back — is not.

Evolution is a gradient descending a hill that is also descending. Same legs, same gradient, same math. The hill is the part that's different. The hill is *always* the part that's different.

---

*The original article by Michael Frank Martin is at [symmetrybroken.com](https://www.symmetrybroken.com/asymmetric-evolution/). It is worth reading in full, particularly the three falsification tests and the analysis of Lynch's bioenergetics data.*

*P.S. — If evolution ever seems slow to you, remember: it isn't climbing. It's negotiating with the mountain. And the mountain has a position too.*
