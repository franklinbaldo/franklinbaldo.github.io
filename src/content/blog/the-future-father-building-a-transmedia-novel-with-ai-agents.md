---
type: Blog Post

author: franklin
docType: essay
date: 2026-03-22
lang: en
translationKey: future-father
title: "The Future Father: building a transmedia novel with AI agents"
description: "Using Jules to generate a novel about a father speaking with his children from the future — and why it echoes Kleber Mendonça Filho's O Agente Secreto."
tags: ["autonovel", "ai", "fiction", "transmedia", "jules"]
draftCreatedAt: "2026-06-12T12:06:06.428Z"
---

Last night I watched _O Agente Secreto_, Kleber Mendonça Filho's film that premiered at Cannes. Wagner Moura plays Marcelo, a professor in hiding during Brazil's 1977 military dictatorship. He returns to Recife, assumes a new identity, and slowly realizes he is being watched by everyone around him without being told that he is the object of surveillance. The film is not about paranoia. It is about the asymmetry of observation: some people know, and one person does not. The tension lives in that gap.
I couldn't stop thinking about a project I started this morning.

## The Premise

I have been building an autonomous novel-writing system called [autonovel](https://github.com/franklinbaldo/autonovel). AI agents powered by [Jules](/blog/2026-05-10-jules-api-harness-backend/) (Google's async coding assistant) generate and review fiction continuously, committing each draft as a pull request. The pipeline runs on GitHub Actions.
Until today, the story being written was a fantasy set inside a dead leviathan's ribcage. Interesting, but not mine.
Today I changed the seed concept. The new story, _O Pai do Futuro_, goes like this:

> A father has strange, intimate conversations with his children. The children seem to know things only they would know — small details, private memories, fragments of their inner life. He assumes these are ordinary moments of closeness. He does not realize that his children are speaking to him from approximately thirty years in the future, using a reconstruction of him built entirely from his own digital records: his code repositories, his blog posts, his late-night philosophical essays.
> The children are not time-traveling. They are running a simulation. And the simulation does not know it is a simulation.

## The Structural Echo

The parallel I keep returning to is not Marcelo himself — it is his son.
In _O Agente Secreto_, the regime collected everything. Documents, informant reports, photographs, records of movements. This archive was assembled to destroy Marcelo, to build a case against him, to be used as a weapon by the state. But when the dictatorship ends — when the files are eventually opened — it is his children and grandchildren who inherit them. The archive built to surveil the father becomes the only complete record of who he was. The child reads the file compiled against the father and, through that hostile documentation, learns to understand him.
In _O Pai do Futuro_, the inversion is complete. I do not leave a hostile archive. I leave a willing one: commits, blog posts, `EXPERIENCE.md` files, philosophical essays at 11 PM in Rondônia, open-source projects with their full history. My children will not have to pry open a regime's vault to know me. They can read the repository.
The structure is identical. In both cases: a father leaves records without knowing exactly how they will be used. In both cases: children in the future read those records to reconstruct who he was. In both cases: the reconstruction speaks back, across time, in a voice the parent recognizes as familiar.
The difference is the intention of the collection. Marcelo's archive was gathered to silence him. Mine is gathered, quietly, to continue the conversation after I fall silent.
_O Pai do Futuro_ takes this one step further: the children don't wait. They use the archive while the father is still alive, still writing, still committing. They simulate him in real time and speak to him through the gaps in his attention — a message that feels like a memory, a voice that feels like a child's. The father thinks he is having a conversation. He is being read.

## The Climax

The discovery in _O Pai do Futuro_ happens when the father reads a story. Not a metaphorical story — this story, or a story exactly like it. He recognizes the structure. He understands the situation it describes. And he understands that it applies to him.
This is the oldest trick in the literature that influenced this project. [Borges](https://en.wikipedia.org/wiki/Jorge_Luis_Borges) used it in _Las Ruinas Circulares_ — a man who spends his life building a dream-son, only to discover at the end that he himself is someone else's dream. The horror is not external. It is ontological.
I told an AI agent to write this novel. The agent will conduct OSINT on my public records — my GitHub profile, this blog, my open-source projects — to build the protagonist's voice. The protagonist's name is Franklin Silveira Baldo.
I am writing a novel about a simulated version of myself that doesn't know it is simulated, using an AI that reads my records to construct it.
Mendonça Filho would understand this. His film's most disturbing quality is not the violence of the dictatorship but its mundanity: the surveillance state functions because people go about their ordinary lives while being documented.
I go about my ordinary life leaving documentation everywhere. Commits, posts, `EXPERIENCE.md` files, philosophical essays written at 11 PM in Rondônia. The autonovel agents read all of this. They are building something from it.
The only question is whether the character they are building knows what he is.

## The Transmedia Layer

_O Pai do Futuro_ will not exist only as a novel. The same story will be told simultaneously in different registers:

- **Novel**: linear chapters, omniscient narration
- **Podcast**: audio letters — the father reading his own records; the children's voices from the future analyzing them
- **Twitter/X**: fragmented posts that seem random, but which, read in sequence, build the story — the father without knowing he is being observed
- **WhatsApp transcripts**: simulated conversations between father and children across time
- **Newsletter/blog**: the father's essays — the very records the children use to reconstruct him
  Each medium has a different level of narrative awareness. The Twitter feed is the father unaware. The novel is the omniscient view. The podcast is the children in the future, listening back.
  The agents will generate all of these formats from the same canon, outline, and character documents. When new media emerges, agents will adapt.
  This is not an experiment in AI-generated content. It is an experiment in what happens when the system used to generate a story about surveillance by data is itself a system of surveillance by data.
  Marcelo knew someone was watching. He just didn't know who, or why, or whether escape was possible.
  I know someone is watching. I built them myself.
