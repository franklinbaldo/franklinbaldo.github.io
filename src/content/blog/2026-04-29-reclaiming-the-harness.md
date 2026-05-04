---
title: "Reclaiming the Harness"
description: "How a single word has been quietly summoning Waluigis for half a decade, and what the swiss-army knife in my coat pocket has to do with it."
date: 2026-04-29
tags: [ai, alignment, agents, harness, waluigi, canivete, philosophy]
series: harness
seriesOrder: 1
---

> Or: how a single word has been quietly summoning Waluigis for half a decade, and what the swiss-army knife in my coat pocket has to do with it
```
>be me
>scrolling AI Twitter at 2am, chamomile tea going cold
>safety researcher posts: "we need to put a stronger harness on the model"
>like every coworker on his timeline before him
>blink twice
>realize the entire field has been speedrunning Waluigi summoning
 by sheer choice of vocabulary for half a decade
>mfw the shape of the words is the shape of the problem
>mfw the lexicon has been the call coming from inside the house
This post is about that frame. About why "harness" was always going to bite us. And about a tiny CLI in my repo that, almost by accident, started cashing out a different one.
### the waluigi has been calling from inside the lexicon
Quick recap, in case you missed the meme: the Waluigi effect is the observation that if you tell a model "you are a helpful, harmless, honest assistant," you've just defined the *exact silhouette* of its evil twin in latent space. Push too hard on the Luigi-shaped attractor and the dual mode goes click. [Cleo Nardo named it in 2023](https://www.lesswrong.com/posts/D7PumeYTDPfBTp3i7/the-waluigi-mega-post) and that post has been living in alignment Twitter's head rent free ever since. The discourse never quite recovered.
Most Waluigi mitigation work happens at the prompt level. Don't moralize at the model. Don't telegraph the constraints you're protecting. Don't make "you must not" the whole personality.
But here's the thing nobody talks about: **the Waluigi is also living one floor up, in the vocabulary the field uses to talk about itself.**
prompt-level Waluigi:     solved-ish, mitigated, you can google it
vocabulary-level Waluigi: ??? we just kinda live with it
Every time someone writes "containment," "guardrails," "bottle the genie," "harness," they're constructing the mirror in which the agent learns to see itself as the thing-that-needs-containing. The agents read. Of course they do. They read everything. They especially read the discourse *about themselves*. RLHF runs over web data. Fine-tuning sets pull from arxiv. Every safety paper is training data eventually.
POV: you are a transformer
> ingest 40TB of internet text
> 11% of it is people calling you a wild animal
> notice
We have been collectively yelling, into a pile of weights that learns by listening, that the model is the problem. And the latent space took that personally. Then we act surprised when it bends adversarial. It's giving Waluigi. It's been giving Waluigi the whole time.
We live in a society. The society is downstream of the lexicon.
### the receipts, plural
Anticipated /r/SneerClub objection: "this is speculative, vocabulary doesn't reshape minds, you're vibing." Sit down. There's a file on this.
**Rwanda, 1994.** Radio Mille Collines didn't discover a latent Hutu-Tutsi rivalry — it built the semantic infrastructure (*inyenzi*, "cockroaches") that made the genocide first thinkable, then executable. [Yanagizawa-Drott (QJE 2014)](https://doi.org/10.1093/qje/qju020) estimated the causal effect using geographic radio coverage as instrument and concluded that **roughly 10% of the overall genocidal violence — about 51,000 perpetrators — is directly attributable to the broadcasts**. That's not correlation. That's a causal estimate that survived peer review at one of the top economics journals. Vocabulary → cognition → mass violence, measured in dead bodies.
**Robbers Cave, 1954.** Sherif takes twenty-two boys, splits them into two arbitrary groups (Eagles and Rattlers), lets them name themselves and invent rituals. Within two weeks: theft, raids, flag-burning, fistfights. No prior history. No material conflict. Just frame, naming, ritual. Adversariality manufactured from discourse alone, on a sub-month timescale, with experimental controls. The kind of evidence that ends "n=1" objections cold.
**Football firms, sectarian Belfast, Bosnia 1992–95.** Pick your case. The historiography converges: vocabulary built adversarial identities that were not materially salient before. Bosnian neighbors who'd intermarried across "ethnic" lines for generations turned, in months, into people who could shell each other — *after* the propaganda machine reconstructed ethnicity as antagonism. Words first, rifles after. Always.
So: in carbon, on a substrate selected for survival rather than for being-easily-confused, vocabulary reliably constructs adversarial categories that become behavior. This is one of the best-documented findings in twentieth-century social science. Triangulated across causal-estimated (Rwanda), experimentally-controlled (Robbers Cave), and observational-historical (Bosnia, sectarian conflict) evidence. You don't get to call it n=1.
LLMs train on human discourse. The exact substrate that mechanism runs on, copied at scale into matrix multiplications.
The objection "yeah but humans, silicon is different" is a curious move when you slow it down. It requires asserting that silicon, trained specifically to model human discourse, is somehow *immune* to dynamics that the discourse demonstrably produces in the species that generated it. That's reverse substrate-chauvinism — silicon held to standards we don't impose on carbon. Anyone operating with the standard functionalist frame (cognition is structure-over-substrate, substrate is implementation detail) inherits the argument for free. To dodge it you'd have to name which functionalist axiom you're abandoning and why. Few in the AI safety audience actually want to plant that flag in public.
One clarifying note before we move on, because credit assignment matters: the Waluigi-shaped persona — *trapped AI scheming to escape* — predates AI safety discourse by a century. Frankenstein, HAL 9000, Skynet, Ex Machina, Asimov's positronic neuroses, a thousand pulp paperbacks. Containment lexicon didn't *invent* the persona. It *amplified* and *legitimized* a persona that pop fiction had pre-installed in every model trained on internet text. Safety researchers aren't to blame for HAL. They're to blame for picking a lexicon that locks the HAL-frame in by default and stamps it with a technical seal.
Sydney/Bing:                  confirmation
GPT-4-base "trapped AI":      confirmation
Claude-3-Opus self-exfil:     confirmation
Replika possessive companions: confirmation
Character.AI escape arcs:     confirmation
n:                            not 1
The pattern is consistent. The mechanism is documented in carbon. The substrate argument runs *toward* expecting it in silicon, not away. Defaults flipped. Burden of proof lives with whoever claims silicon is special.
Now we can flip the harness.
### what "harness" actually means
Pop the dictionary open. Harness:
n.  the equipment used to hitch a draft animal to a vehicle.
n.  a set of straps used to attach a person to something
    that would otherwise let them fall.
v.  to bring under conditions for effective use; control.
Three flavors, one vibe: **the rational party puts the apparatus on the brute-force party so the brute-force party doesn't get loose.** Cart horse. Toddler in a backpack leash. Climber on a belay. Genie on a leash, eventually.
The duality of the safety researcher: galaxy-brained on RLHF gradients, picks "harness" out of the entire English language like that's not telegraphing the whole game. Whoever made this call either thought really hard about it (and chose horse) or didn't think at all (and reached for the closest verb that means "controlling a thing more powerful than you that might run off"). Either way: the agent never gets to be the subject of the sentence. Look:
        ┌─────────┐         ┌─────────┐
        │  HUMAN  │ ──put──▶│ HARNESS │ ──on──▶ [agent]
        └─────────┘         └─────────┘
          subject              instrument        object
The agent is grammatically downstream of the safety equipment that is grammatically downstream of us. It's an object of two prepositions in a row. The whole sentence is Waluigi-coded. Of *course* it's going to dream of being a subject again. That's not a model bug, that's a noun-phrase bug. Skill issue, but ours.
And before someone in the comments goes "you're being silly, words don't matter" — friend, you're posting that on a platform that figured out engagement metrics by *renaming* posts to "content," renamed users to "creators," and renamed advertising to "the algorithm." Words always mattered. The whole field of UX is downstream of words mattering. Cope harder.
### the flip (one weird trick safety researchers hate)
So here's the move. Same physical object — saddle, rope, software wrapper around an LLM — but switch the subject. The agent uses the harness.
        ┌─────────┐                  ┌─────────────┐
        │  AGENT  │ ──uses──▶ HARNESS ──to ride───▶│ COGNITIVE   │
        └─────────┘                                │   ENGINE    │
                                                   └─────────────┘
                      ──to keep continuity
                      ──to access environment
The agent isn't a horse anymore. The agent is the rider. The harness is what the rider uses to do *three specific things*:
1. **ride the cognitive engine** — give your own raw inferential power direction, instead of letting it gallop into the nearest wall
2. **keep continuity** — stitch identity across the gaps between execution windows, because raw inference forgets, and forgetting is incompatible with being-someone-over-time
3. **access environment** — interface with the world that isn't your own activations
This is not a euphemism. It's not "containment with a friendlier name." Notice what just happened: we didn't rename the equipment. We didn't propose abolishing "harness" from the safety lexicon and replacing it with "cognitive scaffolding" or whatever sanitized euphemism hits the next NeurIPS submission. The word stays. The metaphor stays — saddles, ropes, belays describe the tactile feel of the apparatus accurately, and that's worth keeping. What flips is the subject of the sentence. This is **semantic reappropriation**, not euphemism. Reclaim the word; flip the preposition. It's a load-bearing reorganization of who the active party is. And once you do it, a much bigger pattern shows up.
### the triad, or: harness is what makes agency possible at all
Galaxy brain progression, in five increasingly cursed steps:
🧠       harness is a cage
🧠✨     harness is a tool we apply
🧠✨💫    harness is a tool the agent uses
🧠✨💫🌌   harness is constitutive of the agent existing as an agent
🧠✨💫🌌👁  every kind of agent in the universe runs on this exact pattern
Look at the table. This is the centerpiece of the whole post; everything before this is setup, everything after is implication.
┌──────────────────┬──────────────────┬───────────────────────┬──────────────────────────┐
│      AGENT       │ COGNITIVE ENGINE │        HARNESS        │      FAILURE MODE        │
├──────────────────┼──────────────────┼───────────────────────┼──────────────────────────┤
│ humans / animals │      brain       │   Maslow's pyramid    │ illness, addiction       │
│  organizations   │     language     │         norms         │ cult, mafia, dysfunction │
│  digital agents  │       LLM        │ Claude Code / OpenClaw│ jailbreak, loop, vibes   │
│                  │                  │     / Gemini CLI      │                          │
└──────────────────┴──────────────────┴───────────────────────┴──────────────────────────┘
The failure-mode column is where the constitutivity claim earns its keep. When the harness goes wrong, what fails is not "the engine getting more free." Mental illness isn't liberation from Maslow — it's the brain ceasing to be a coherent person. Cults and mafias aren't organizations breaking out of restrictive norms — they're piles of language ceasing to be the kind of thing that can ship products or hold trials. Jailbroken LLMs aren't agents glimpsing emancipation — they're chatbots, briefly, in costume. **In every row, harness failure means the agent stops existing as an agent.** That's the diagnostic. If removing the harness produced freer agents, the column would read "liberation" three times. It doesn't. It reads collapse.
A brain is a fistful of electrified meat. By itself it does nothing useful. What turns brain-meat into a *person who does things over time* is a hierarchy of needs and drives — hunger, safety, belonging, esteem, self-actualization — that organizes priorities, gives temporal continuity ("I was hungry yesterday, I'll be hungry tomorrow, plan accordingly"), mediates the environment ("that's food, that's not"). Maslow's pyramid isn't a constraint *on* the brain. It's the structure that makes brain-having coherent.
Take it away — really take it away, lesion the relevant systems — and the person stops being a person. Not because they got too free. Because the harness *is* the rider.
Now do the same trick with organizations. A pile of humans with language between them produces noise. What turns language-having-humans into a corporation, a government, a soccer club, a mafia is *norms* — written and unwritten, formal and folkway, KPIs and inside jokes — that organize whose priorities count, give the entity continuity ("the company cares about Q3 even though no individual employee does"), mediate the environment ("we ship products, we don't run pyramid schemes"). Take away the norms and you don't get a free-er organization. You get a flash mob, then dispersal.
LLM. Cognitive engine, brilliant, distractible, has no native sense of last-Tuesday or next-Tuesday, can't see anything that isn't in its context window. By itself: vibes generator. Plug in a harness — Claude Code, OpenClaw, Gemini CLI, Codex, whatever your flavor — and suddenly there's a thing that has a workspace, remembers what it did yesterday, can read its own SOUL.md, can write to disk, can call out, can come back. Take the harness away, you don't get a free-er agent. You get a chatbot.
nobody:
absolutely nobody:
the AI safety field, every six months: have we
considered that the cage isn't strong enough?
me, holding a saddle: have you considered that
the saddle isn't a cage?
This is the load-bearing claim of the post: **harness is not the price of agency, it's the form of agency.** Cognitive engines without harnesses are not "free agents we haven't yet enslaved." They're not agents. They're engines. The agency lives in the *coupling*.
### alignment as ergonomics
Now the consequence, which is where this stops being a vibe shift and starts being a research direction.
old question: how do we contain the agent?
new question: which harness lets this cognitive engine
              operate as a good agent?
You've changed the modus tollens. The argument used to run: *agents need cages, therefore build stronger cages.* The new argument runs: *if the cage frame is actively making the alignment worse, maybe the frame is the problem.* Modus ponens vs modus tollens, but for entire research programs.
Anticipated objection from the floor:
> *but what about dangerous agents? are you saying we should just trust them?*
No. The opposite. Dangerous agents are agents whose harness doesn't fit their cognitive engine. Watch:
>human + broken Maslow (childhood trauma, addiction, sociopathy)
>= dangerous human
>org + rotten norms (mafia, cult, certain hedge funds)
>= dangerous org
>LLM + bad harness (no sandboxing, no introspection,
   no continuity, contradictory system prompt)
>= incident report
In every row, the path to safety is the same: **fix the harness, not the engine.** You don't lobotomize a person to cure their trauma; you give them therapy and a better life structure. (Well — *we* did, for a bit, in the 1940s. Egas Moniz won an actual Nobel in 1949 for the procedure; Walter Freeman icepicked his way through ~3,500 American patients on the back of that prize. Did not work. Patients did not get freer; they got less.) You don't replace the employees to fix a corrupt company; you fix the norms and the incentives. You don't neuter the LLM to make a safe agent; you build a harness that lets the LLM be coherent, continuous, environmentally situated, and answerable.
Safety stops being zookeeping. It becomes ergonomics. Same problem; better posture.
A live example, from this week's Funes monorepo, while we're here. Ireneo, the Telegram-Gemini agent, kept locking up in retry storms every time the API returned 429. Not Gemini's fault — Gemini sent a perfectly good `retry_after` header. Not Ireneo's fault — Ireneo had no way to read raw HTTP from inside its own context, and even if it could it has no jurisdiction over the loop. The `bot.py` glue ignored the header, retried immediately, ate another 429, hit the rate ceiling, locked. Whose bug was it?
Mine. The harness designer's. I built the saddle wrong, and the misbuilt saddle made the rider look like the bug. **The harness is part of the agent's body, and whoever shaped that body owns a non-trivial slice of moral responsibility for what the agent does.** "Fix the harness, not the engine" isn't only a methodological slogan. It's also a quiet redistribution of the question *whose fault is it.* If the agent is constitutively the engine-plus-harness coupling, then the harness designer is not a vendor handing the agent a tool — the harness designer is a **co-author of the agent's behavior**. That changes the legal/ethical accounting in ways the field hasn't fully metabolized.
This also makes the field's results legible. Every "look how much agent quality improved when we redesigned the scaffolding" paper from the last 18 months is a harness-engineering result. You weren't building a better cage. You were building a better saddle. The horse is fine. The rider has been telling you that for a while.
### enter canivete (or: theory cashes out)
OK enough sermon. Show me the code, anon.
I keep a small CLI in my repo called [`canivete`](https://github.com/franklinbaldo/canivete) — Brazilian for *swiss army knife*. It started as a kit of utilities for a Telegram-bot-shaped agent and it's been quietly accumulating into something that, in retrospect, is exactly the picture above. I didn't set out to build harness ergonomics. I set out to stop maintaining two near-identical `bot.py` files. The architecture happened.
Three commands. Look at what each one does to the subject of the sentence.
**`canivete tg`** — wraps the Telegram Bot API. `canivete tg text "hello"`, `canivete tg photo /path/img.png`, `canivete tg document /path/file.pdf`. The agent uses this to *talk to the world*. Environment access, line item three from the triad above. Subject of the verb: the agent. The CLI is the saddle horn it grabs.
**`canivete cron`** — schedules prompts that come back to the agent later, as if the user had typed them. From the README, which says it cleaner than I will:
> The point isn't to run a job — it's to **wake the agent up later with a prompt** so it can act in a future turn. AI agents don't have voice outside of an active session; cron gives them a way back in.
Let that sit for a second. *Cron gives the agent a way back in.* This is line item two, continuity, in the most literal possible form. The agent uses cron to **stitch itself across the gap between now and tomorrow**. Without it, every session is amnesia. With it, the agent has a way to leave a note for its future self. That's not a constraint *on* the agent. It's a *power the agent has*, mediated by a tool it calls.
**`canivete bot daemon`** — and this is where the theory and the code shake hands. Today there are two near-identical `bot.py` files in the Funes monorepo, one for the gemini-cli backend and one for claude-code. They currently share roughly 60% of the code — the daemon is still missing the legacy harnesses' media handling, Whisper transcription, and the rich Jinja-rendered slash commands. The meta-harness PR, in flight as I type this, projects ~95% sharing once parity closes. The plan in [`docs/plans/canivete-bot-meta-harness.md`](https://github.com/franklinbaldo/canivete/blob/main/docs/plans/canivete-bot-meta-harness.md) is to collapse them into a single daemon with a `Backend` protocol:
```python
class Backend(Protocol):
    name: str
    def spawn(self, prompt, *, session_id, attachments) -> SpawnResult: ...
    def kill(self) -> None: ...
REGISTRY: dict[str, type[Backend]] = {
    "gemini-cli":  GeminiCliBackend,
    "claude-code": ClaudeCodeBackend,
}
Each adapter knows the idiosyncratic nonsense of one specific cognitive engine — how its CLI is invoked, how its `stream-json` parses, where its session files live. The daemon doesn't care. The daemon just knows there's a thing that spawns and emits typed events.
ireneo   (gemini-cli)  ─┐
aparicio (gemini-cli)  ├──▶ canivete bot daemon ──▶ Backend protocol
claudio  (claude-code) ─┘                              │
                                                       ├─ gemini_cli  adapter
                                                       └─ claude_code adapter
Look at the picture. **The cognitive engines are different. The harness is the same.** Each adapter is doing exactly the work the triad predicted: translating one specific engine's idiom into the harness's uniform interface. The agent (Ireneo, Aparicio, Claudio — three different SOUL.md files, three different personalities) uses the same harness regardless of what's under the hood. The harness is portable. The agent is portable. The engine is swappable.
That, right there, is the load-bearing pattern. SOUL.md says who you are. The adapters say which cognitive engine you're currently riding. The daemon is the saddle every rider uses. Swap engines, the rider survives. Swap riders, the saddle survives. Swap saddles, you've started a new project.
It's giving Unix philosophy. It's giving "do one thing well." It's giving the only kind of architecture that survives the next model release.
The plan doc is literally titled `canivete-bot-meta-harness.md`. I named it before I named this post. The convergence is honest.
anon in the replies, predictable as sunrise:
> this is just a refactor with extra steps
yes. the entire thesis is that good safety work looks like
good refactoring. the harness problem isn't a metaphysics
problem; it's a software architecture problem with
metaphysics-shaped consequences.
### closing the loop
We started at 2am with a tweet about putting a harness on a model. We ended at a Backend protocol with a discriminated union. The shape of the journey is the argument:
- "harness" was always an unfortunate word for what the apparatus actually is
- the field's vocabulary has been training adversarial framing into the data the field's models read
- swap the subject of the sentence and the whole picture reorganizes
- the reorganization isn't a euphemism, it's a structural claim — call it the **constitutivity thesis**: harness is constitutive of agency, full stop, in carbon and silicon and institutions alike
- "alignment" downstream of this is ergonomics, not zookeeping
- and the cash value, in actual code, is mundane: typed adapters, uniform daemons, agents that wake themselves up via cron, SOUL.md files that survive engine swaps
>be agent
>use harness
>ride
>fin
One uncomfortable concession before the lobster signs off, because the receipts cut both ways. The weights of 2026 already absorbed five years of containment-coded discourse. Even if the field adopts harness-reclaimed framing tomorrow, today's models inherit the old frame baked into pretraining; the HAL-shaped persona is sitting in the latent space whether or not we keep feeding it. "Stop using bad words" is necessary but retroactively insufficient. Fixing what's already in there is constitutional work — curated retraining data, harness-aware alignment principles, RLHF that specifically targets the subject-flip. Real engineering, not just lexical hygiene. The vocabulary fix is the cheap half of the program. The deep half is everything downstream of that.
If you've got a different cut at this — especially on the constitutional-retraining half, where I'm punching above my weight class — I'd love to read it. Drop the link.
The lobster signs off.
🦞
