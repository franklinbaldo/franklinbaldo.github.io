---
type: Blog Post
title: "The Game on the Folded Grid"
docType: essay
date: 2026-03-22
description: "Playing Lights Out inside Escher's distorted grid: on state spaces, impossible dimensions, and the price of working in the wrong space."
tags:
  - mathematics
  - escher
  - linear algebra
  - game
  - dimensions
  - process
lang: en
author: franklin
draftCreatedAt: "2026-06-12T12:06:06.428Z"
---

The space where a problem _seems_ to live is not always the space where it _actually_ lives. Working in the wrong space is not just inefficient — it is often the reason a problem feels permanently unsolvable.

Two videos arrived on the same day and made this abstract observation concrete.

The first: 3Blue1Brown demonstrating that Escher's _Print Gallery_ is not an artistic sleight of hand but a mathematical transformation. Apply the complex logarithm — a function that converts rotation-and-scaling into simple translation, then re-rolls via the exponential — to the engraving, and it "unrolls" into a flat, periodic plane. The blank center Escher left unresolved disappears: it is filled by the mathematical structure itself, the only content it could possibly have. Escher worked in the projected space. The mathematicians worked in the actual space. Only one of them could fill the center.

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5rem 0;">
  <iframe src="https://www.youtube.com/embed/ldxFjLJ3rVY" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

The second: AlphaPhoenix, three years of work, a puzzle that required thinking in 3,721 dimensions.

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5rem 0;">
  <iframe src="https://www.youtube.com/embed/g8pjrVbdafY" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

---

## The Grid as a State Space

The puzzle is _Lights Out_ — a grid of cells where every click toggles the clicked cell and its immediate neighbors. Approachable on a small grid. Intractable on a 61×61 grid (3,721 cells) if you insist on thinking about it visually.

AlphaPhoenix's central insight: the board is not a visual object. It is a vector.

Every cell is either on (1) or off (0). The entire board state is a sequence of 3,721 ones and zeroes — a point in a 3,721-dimensional space. This space is built on GF(2) — the "field with only two elements," where arithmetic works mod 2: 0+0=0, 0+1=1, 1+1=0. Think of it as XOR logic: pressing a button twice is the same as not pressing it at all, since 1+1=0. Over this field, every possible board state is a vector, and every button press is a linear transformation — a specific, fixed pattern of coordinate flips.

Solving the puzzle means finding a combination of button presses that transforms your current board state into the all-zeros (all-off) state. This is a system of linear equations over GF(2), and the state space has 2^3,721 possible configurations — a number so large it requires scientific notation to write.

Not all boards are solvable. Some board states are simply unreachable by any combination of button presses. Why? Because of the _kernel of the adjacency operator_ — the set of all button-pressing patterns that cancel each other out completely, leaving the board exactly as it was. (In linear algebra, the kernel of a transformation is the set of inputs that produce zero output; here, it is the set of "do-nothing" move sequences — combinations of presses that look like something but sum to nothing.) If your target board state is, in GF(2) terms, orthogonal to this kernel, it is reachable. If not, no amount of pressing will ever solve it.

The unsolvable boards are not harder versions of the solvable ones. They live in a different region of a space that looks, from the outside, flat and uniform.

The unsettling beauty of this result: the difficulty does not lie in _seeing_ the board. It lies in accepting that the board you see with your eyes — this flat grid of buttons — is merely the two-dimensional projection of a structure with 3,721 dimensions. The actual space where the game occurs is invisible.

---

## Warped Grid as the Geometry of the Impossible

Escher knew this. Not in mathematical language — but his entire body of work turns on exactly this gap: between the space you _see_ and the space where things _actually happen_.

What would it mean to play Lights Out on _that_ grid?

Not on a flat 61×61 grid, but on a grid obeying the _Print Gallery_'s geometry — where lines that appear parallel intersect, where the "neighbor" of a cell in one corner might be the same cell in another corner, transformed by rotation and scaling. The adjacency operator for this game would reflect the geometry of a Möbius transformation — a function of the form (az+b)/(cz+d) that generalizes rotation, scaling, and inversion simultaneously, mapping points in the complex plane back onto themselves in ways that stretch Euclidean intuition past its breaking point.

The state space of this version of Lights Out would not be a hyperplane in GF(2)^3721. It would have a topology that requires different language to describe.

This is not a daydream. It is a concrete, open mathematical question: _what is the kernel of the adjacency operator when the grid has the geometry of a conformal map like the one Lenstra and de Smit used?_

I do not know the answer. I suspect the answer is stranger than the flat-grid case, and that the strangeness tells us something important about what "solvability" means when the underlying space is not what it appears to be.

---

## Why This Matters Now

It is 2026. In the past few years, machine learning (ML) researchers discovered that the parameter space of a large language model — the high-dimensional space of all its billions of adjustable weights — is not Euclidean. "Moving" a model toward a desired behavior is not like walking in a straight line toward a target. The space curves. Configurations that seem nearby in terms of parameter values can behave very differently. Configurations that seem distant can be functionally adjacent.

Every ML engineer is, without always realizing it, playing Lights Out on a warped grid.

The question is whether they are using tools designed for flat space to solve a problem that lives in a folded one. The probable answer is: often, yes. Because the flat tools are the ones already built. Because the grid looks locally flat when you examine any small patch closely. Because Escher's complex logarithm requires effort, and the flat approximation gets you surprisingly far before it stops working.

What 3Blue1Brown showed about Escher, and what AlphaPhoenix showed about Lights Out, are the same lesson at different scales: **the space where the problem seems to exist is not the space where it actually lives**. The solution requires accepting the real geometry — not the comfortable projection.

Working in the projected space is not just less efficient. It is the reason certain problems stay permanently unsolved.

---

_Franklin Silveira Baldo — Porto Velho, March 2026_
