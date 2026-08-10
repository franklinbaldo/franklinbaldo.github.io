---
type: Blog Post
title: "The Crease-Free Fold Exists"
description: "A conversation about the impossible image, interrupted hours later by the arrival of the polynomial itself."
docType: essay
date: 2026-07-20
lang: en
translationKey: the-crease-free-fold-exists
tags:
  - mathematics
  - jacobian conjecture
  - algebraic geometry
  - visualization
  - philosophy of mathematics
emoji: "🌀"
---

Today, July 20, 2026,<sup><a href="#note-1" aria-label="See note 1">1</a></sup> in the morning I was talking with an AI about mathematical problems with philosophical implications. We got to the Jacobian Conjecture, and the question that stuck was this: if it were false, could you make an image that would only start to make sense once someone found a real polynomial counterexample?

The safe answer seemed to be: you could draw analogies — a mesh that curls in on itself, two overlapping sheets, the exponential map — but the decisive image would have to wait. The conjecture had been open for more than a century. Without the polynomial, every "crease-free fold" would be metaphor.

A few hours later the polynomial showed up.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/atis/And_then_I_said/locally_invertible_therefore_globally_injective.png?width=600"
    alt="And Then I Said meme: the first line says 'And then I said'; the second, 'locally invertible, therefore globally injective'."
    loading="lazy"
  />
  <figcaption>An intuition reasonable enough to become a conjecture. Not reasonable enough to survive the polynomial.</figcaption>
</figure>

## The map

Consider $F=(P,Q,R):\mathbb C^3\to\mathbb C^3$, with

$$
\begin{aligned}
P &= (1+xy)^3z+y^2(1+xy)(4+3xy),\\
Q &= y+3x(1+xy)^2z+3xy^2(4+3xy),\\
R &= 2x-3x^2y-x^3z.
\end{aligned}
$$

Direct computation gives

$$
\det JF\equiv -2.
$$

So the derivative is invertible at every point. There is nowhere the transformation flattens a dimension, turns area into a line, or volume into a surface. By the inverse function theorem, every point has a small neighborhood on which $F$ can be undone.

And yet the three distinct points

$$
A=\left(0,0,-\frac14\right),\qquad
B=\left(1,-\frac32,\frac{13}{2}\right),\qquad
C=\left(-1,\frac32,\frac{13}{2}\right)
$$

are sent to the same point:

$$
F(A)=F(B)=F(C)=\left(-\frac14,0,0\right).
$$

This is not a delicate inference. Both claims can be checked by expanding the determinant and substituting the three coordinates. Since the constant determinant can be normalized to $1$ by multiplying one output coordinate by $-1/2$, this gives a counterexample to the Jacobian Conjecture in dimension $3$ — and, by padding with identity coordinates, in every higher dimension.

The two-variable case remains open.

## The visualization that would have been fiction yesterday

The full map lives in $\mathbb C^3$, i.e. six real dimensions. But there is an extraordinary visual stroke of luck: the coefficients are real, the three points are real, and the shared image is real too. The collision already happens on the restriction

$$
F:\mathbb R^3\to\mathbb R^3.
$$

That makes it possible to draw the exact phenomenon, not an exponential stand-in. The projection used below is just the ordinary projection from three dimensions onto the screen; the points, the Jacobian matrices, and the equalities are those of the actual polynomial map. The arrows between domain and image indicate the relation $F$, not trajectories traveled by the points.

<div style="margin:1.75rem 0;border:1px solid var(--pico-muted-border-color);border-radius:1rem;overflow:hidden;background:#09090b;">
  <iframe
    src="/experimentos/dobra-sem-vinco/"
    title="Interactive visualization of the dimension-3 Jacobian counterexample"
    style="display:block;width:100%;height:760px;border:0;"
    loading="lazy"
  ></iframe>
</div>

[Open the visualization full-screen](/experimentos/dobra-sem-vinco/).

## A curve that hits the same point three times

There is an even more compact way to see the collision. Take the curve

$$
\gamma(t)=\left(t,-\frac32t,-\frac14+\frac{27}{4}t^2\right).
$$

It passes through $C$, $A$, and $B$ at $t=-1,0,1$, respectively. Composing the map with this curve, two coordinates immediately acquire the factor $t(t-1)(t+1)$:

$$
\begin{aligned}
Q(\gamma(t))&=\frac{9}{16}t(t-1)(t+1)(81t^4-84t^2+4),\\
R(\gamma(t))&=-\frac14t(t-1)(t+1)(27t^2+8).
\end{aligned}
$$

And the first coordinate equals $-1/4$ at the same three values. A single line crossing the domain hits three different places that the map cannot tell apart.

## What the image actually says

"Crease-free fold" is still a metaphor, but now it is a metaphor rigorously anchored to something real.

An ordinary fold explains the overlap with a critical point: somewhere the surface loses rank, flattens, or flips orientation. Here there is no such place. The determinant is $-2$ at $A$, at $B$, at $C$, and at every other point. Every small cube stays three-dimensional after the transformation. The failure only shows up once we put distant regions side by side and notice they were given the same global identity.

This also corrects an intuition I had reached for too early. The issue isn't that "some infinitesimal information got crushed." None was. The information that gets lost is different: **which globally distinct neighborhood that point came from.**

In symbols:

$$
\text{reversibility on every neighborhood}
\;\not\Rightarrow\;
\text{reversibility of the whole space}.
$$

The conjecture claimed the rigidity of polynomials would rule out that betrayal. In dimension three, it doesn't.

## What fell — and what didn't

What fell is the Jacobian Conjecture as a claim for every dimension. What also fell is the expectation that the Jacobian condition, combined with polynomial-ness, would be enough to turn infinitesimal control into global control.

What didn't fall is the inverse function theorem: it still guarantees exactly what it always guaranteed, a local inverse. What didn't automatically fall is the $\mathbb C^2\to\mathbb C^2$ case. And no contradiction appeared in mathematics: an object appeared that the conjecture said couldn't exist.

<p id="note-1"><small><sup>1</sup> The map was <a href="https://x.com/__alpoge__/status/2079028340955197566">announced by Levent Alpöge</a>, who credited the question to Akhil and the construction of the example to Fable. The formula received <a href="https://zzhang-iu.github.io/papers/direct-consequences-jacobian/">independent public verification</a>, but the discovery story, full attribution, and a formal academic writeup are still being consolidated. This text relies only on the directly verifiable algebraic identities: $\det JF=-2$ and $F(A)=F(B)=F(C)$.</small></p>

There is a fitting irony in all of this. The philosophical question was whether the whole could hide an ambiguity absent from every local part. The answer arrived not as an essay, but as three points and a determinant:

> There is no local scene of the crime. There is only the global crime.
