---
type: Blog Post
title: "The OSI Model as Manifesto"
docType: essay
date: 2026-03-26
description: "The seven layers of networking have been telling us something about the nature of reality since 1984. Events all the way down — literally."
tags:
  - philosophy
  - networking
  - events
  - architecture
lang: en
author: franklin
draftCreatedAt: "2026-06-12T12:06:06.428Z"
---

There is a document from 1984 that most engineers encounter early in their careers and immediately forget, filing it away under "historical trivia" alongside the reasons we still use QWERTY keyboards and why `rm -rf` doesn't ask for confirmation.

It is ISO 7498, better known as the **OSI Reference Model**. Seven layers. Physical, Data Link, Network, Transport, Session, Presentation, Application.

What nobody told us is that it was a **philosophical manifesto**.

---

Before diving in — if you have never seen the OSI model explained, two videos are worth your time. NetworkChuck is energetic and concrete (he traces an HTTP request through every layer with actual protocols, and somehow makes it fun):

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5rem 0;">
  <iframe src="https://www.youtube.com/watch?v=AW1lMmeRKak" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

Computerphile is more conceptual, asking _why_ we design networks in layers at all:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5rem 0;">
  <iframe src="https://www.youtube.com/watch?v=eelvWAURfdI" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

Watch either one. Then come back and read the rest of this as philosophy, not as CCNA prep.

---

## The Seven-Layer Architecture of Blindness

The central organizing principle of the OSI model is almost aggressively simple: **no layer is allowed to know anything about what happens inside any other layer**.

```
┌──────────────────────────────────┐
│  7. Application  (HTTP, DNS...)  │ ← "just get me the data"
├──────────────────────────────────┤
│  6. Presentation (TLS, encoding) │ ← "I'll encrypt it, don't ask why"
├──────────────────────────────────┤
│  5. Session      (connections)   │ ← "I manage the handshake, mind yours"
├──────────────────────────────────┤
│  4. Transport    (TCP, UDP)       │ ← "I handle ordering, I don't read"
├──────────────────────────────────┤
│  3. Network      (IP, routing)    │ ← "packets. I route packets. that's it."
├──────────────────────────────────┤
│  2. Data Link    (MAC, frames)    │ ← "local delivery. local. not your problem"
├──────────────────────────────────┤
│  1. Physical     (bits, wire)     │ ← "I AM THE ELECTRONS. I ASK NOTHING."
└──────────────────────────────────┘
        ↑
        also where your coffee went
```

The Physical layer handles pulses of electricity or light. It does not know what those pulses mean. The Network layer routes packets. It does not know whether those packets carry cat videos or ransomware. The Application layer handles HTTP. It genuinely does not care if it is running over fiber optic cable or a [series of tubes](https://en.wikipedia.org/wiki/Series_of_tubes).

Each layer communicates _only_ with the layers immediately above and below, through a precisely defined interface. And that interface consists entirely of **events** — requests passed down, responses passed up, signals that something happened.

If you have been following these posts, you recognize the structure. Events all the way down. Not metaphorically. Architecturally.

## Layer 8: Where It All Falls Apart

Engineers, being engineers, quickly noticed a gap in the model. All seven layers were accounted for. Except one.

```
┌──────────────────────────────────┐
│  8. User         (homo sapiens)  │ ← "I didn't touch ANYTHING"
└──────────────────────────────────┘
```

**Layer 8** is the unofficial layer — the human. Also known as **PEBKAC** (_Problem Exists Between Keyboard And Chair_) or the **ID-10-T error** (say it out loud).

The joke is real but the philosophy is more interesting: the OSI model, when fully extended, describes a stack that reaches from electrons all the way up to _meaning_. Layer 8 is where interpretation happens — where the bits become a Google search, a video call, a love letter, or a support ticket that says "it stopped working and I didn't do anything."

The model doesn't explain Layer 8. It can't. And that's exactly the point.

## What a Layer Actually _Is_

Consider what happens when you load a web page.

Your browser constructs an HTTP request — an **event**. It passes this down to TLS (Presentation), which encrypts it — a transformation, another event. This goes to Session (connection management), then Transport (TCP, which breaks data into segments and ensures they arrive in order — imagine a very anxious mail carrier who sends 47 copies of every letter and then apologizes for duplicates), then Network (IP routing across potentially dozens of machines), then Data Link (local addressing), then Physical.

At each step, the layer below receives what looks like, from its perspective, just _data_. It does not look inside. It does not ask questions. It applies its own rules and passes something on.

The Network layer, when routing a packet, does not know whether the original HTTP request was asking for a recipe or a bank statement. The Physical layer, when firing a pulse, does not know whether the bit is part of a declaration of war or a meme about cats.

They _cannot_ know this. The architecture forbids it.

And yet the page loads.

## Leibniz, But Make It Practical

The philosopher Leibniz, three centuries before the OSI model, proposed that reality was composed of "monads" — fundamental entities with **no windows**. They cannot perceive each other directly. They act according to their own internal natures, completely sealed.

How does the world cohere? How do things happen in concert if nothing can directly influence anything else?

Leibniz needed _God_ to answer this. God pre-established the harmony — wound up each monad like a clock so that they would all tick together.

The OSI model offers a different answer, and it requires no theology: the layers coordinate through **carefully designed interfaces that define what events will pass between them**. No shared understanding required. No windows. No peeking. Just: here's the event, here's the format, here's what you commit to producing in response.

The harmony is not pre-established. It is maintained — actively, continuously, event by event, across boundaries that remain opaque.

Leibniz spent decades on this problem. The IETF (Internet Engineering Task Force — the standards body that governs internet protocols) figured it out via RFC (Request for Comments — the document format in which every internet standard is published and debated).

## The Physical Layer and the Irreducible Event

Go to the bottom. Layer 1: Physical. This is where abstract protocol finally becomes matter — voltage differences on a wire, light pulses in fiber, electromagnetic waves in the air.

What is the physical layer actually doing?

It is detecting and generating **differences**. A 1 is a high voltage. A 0 is a low voltage. A bit is not a thing — it is a _distinction_. It is the event of a measurable difference occurring at a measurable time.

There is nothing below this layer. You cannot go further down and find some more fundamental substrate that "explains" the bit. The bit is the event. The event is the atom.

```
⚡ HIGH VOLTAGE → 1
  LOW VOLTAGE → 0
     ↑
  that's it
  that's the internet
```

Everything above — packets, connections, sessions, applications, the web itself — is events interpreting events, all the way up. The electrons are the bottom of the stack, and the electrons are pure event: a difference, happening, right now.

## Translation, Not Transmission

Here is what the OSI model actually says about communication, if you read it as a philosopher instead of an engineer:

Information does not **pass through** the stack. It **translates** through the stack.

When the Application layer passes data to the Presentation layer, it does not send its _meaning_. The Presentation layer has no concept of meaning at the application level. It receives a sequence of bytes, applies its own rules (encryption, encoding), and produces a different sequence to pass further down. Each layer performs a translation — taking the events it receives, interpreting them according to its own logic, producing new events.

By the time a bit leaves the physical layer on one machine and is received by the physical layer on another, it has been translated through the entire stack _twice_. The meaning of the original request is not "in" the signal. It is reconstructed, layer by layer, on the receiving end.

This is not a bug. It is not a limitation to be engineered away. It is the _architecture_.

The practical consequence: information cannot be "securely transmitted" in an absolute sense — only "securely translated." The TLS layer encrypts, but TLS doesn't understand what it's protecting. The application layer understands, but the application doesn't know about the wire. The security is distributed across the stack. The meaning is distributed across the stack. There is no single point where the message "lives."

## What This Changes

If the OSI model is correct — and forty years of the internet suggest it is correct enough — then certain questions dissolve and others become more interesting.

**"Where does meaning live?"** dissolves. Meaning does not live anywhere in particular. It is not encoded in the electrons, the packets, the bytes, or even the application response. It is produced in the act of interpretation — in the encounter between a sending layer and a receiving layer, each applying its own rules to the events it observes.

Scale this up to humans communicating with humans, and the structure is the same. Meaning is not transmitted. It is enacted.

(This is why "I know what I meant" is never a complete defense. The receiving layer interpreted what it received, not what you intended to send. Layer 8 problems are architecturally inevitable.)

**"How can systems that cannot see each other coordinate?"** gets more interesting. The OSI model's answer is rigorous: through carefully designed interfaces that define what events will pass between them, what format those events take, and what each layer commits to producing when it receives them.

The layers are blind to each other's interiors. The interfaces make them cooperate anyway. The blindness is **load-bearing**.

## The Manifesto

In 1984, a group of engineers trying to connect incompatible networks wrote down something that turns out to be a precise description of how complex systems — including natural ones, including minds — can be organized.

They described a world where:

- The fundamental entities are **events**, not objects
- Layers communicate exclusively through events
- Each layer is **opaque** to the others — no windows
- Meaning is not transmitted but **translated**
- Coordination emerges from the interfaces, not from shared understanding
- The deepest layer is pure difference — an event so primitive it cannot be decomposed

They were trying to connect a Unix machine to an IBM mainframe. They were not doing philosophy.

But the model they built describes something more general. The next time someone asks where the internet "is," or where a thought "lives," or how two people who cannot see inside each other's minds can still understand each other — you can point to ISO 7498. Not because the OSI model is the last word on these questions. But because a group of engineers solved a version of them, and their solution has run the world's communications infrastructure for four decades.

Events all the way down. We wrote the specification in 1984.

We just forgot to read it as philosophy.

---

_P.S. — If any of your systems are broken right now, it's probably a Layer 8 issue. It's always a Layer 8 issue._
