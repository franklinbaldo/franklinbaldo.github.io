---
type: science-atlas-run
date: "2026-09-23"
mode: "oscillation frontier + differential-order equivalence audit"
summary: "Add a sourced simple-harmonic-motion occurrence, explicitly prove its sinusoidal/second-order-ODE equivalence, reject a false link to first-order decay, and strengthen the older RC family edge."
updated: "2026-09-23"
---

# Simple harmonic motion / oscillation run — 2026-09-23

## Starting state

This execution first reread `docs/science-equation-atlas-routine.md` and reconstructed the Atlas from the current `main` and the canonical Markdown OKF bundle under `knowledge/science-equations/`. The working branch was created from `main` at `449f283abd31636ed9b08bfc4cbd686fe269e57e` (`atlas: add heat equation diffusion frontier (#2140)`). No transient frontier state from previous automation turns was used.

At that reconstructed head the bundle contained 21 taxonomy branch cards, 10 formula occurrences, 1 equation-family card and 7 prior run records. The preceding heat-equation run explicitly left oscillatory equations as an open frontier. Repository search found no simple-harmonic-motion card and no active Atlas pull request to continue, so this execution selected one undamped oscillator occurrence as the next small unit.

Rather than invent a new taxonomy node for classical mechanics from memory, the occurrence is linked conservatively to the existing [Physics and Astronomy](../branches/physics.md) field. A narrower branch can be introduced later when its taxonomy source is directly justified.

## Prior art and technical sources consulted

- [OpenStax University Physics Volume 1, §15.1 Simple Harmonic Motion](https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion) gives the generalized displacement exactly as `x(t)=A cos(ωt+φ)`, defines amplitude, angular frequency and phase, and differentiates it to obtain velocity and acceleration.
- [OpenStax University Physics Volume 1, Chapter 15 Summary](https://openstax.org/books/university-physics-volume-1/pages/15-summary) states the defining condition that the restoring force is proportional to displacement and opposite in direction, and gives `ω=sqrt(k/m)` for the mass-spring realization.
- [OpenStax University Physics Volume 1, §15.5 Damped Oscillations](https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations) gives `m d²x/dt² + b dx/dt + kx = 0`, establishing that damping adds real operator structure and should not be silently folded into the undamped occurrence.
- [Wolfram Formula Repository, "Damped Harmonic Oscillator"](https://resources.wolframcloud.com/FormulaRepository/resources/Damped-Harmonic-Oscillator) was checked as neighboring prior art and likewise treats damping ratio and damped frequency as additional structure.
- [OpenStax University Physics Volume 2, §10.5 RC Circuits](https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits) was revisited for the required audit of an older Atlas relation.

## Added

- [Simple harmonic motion](../formulas/simple-harmonic-motion.md), preserving the OpenStax generalized notation

\[
x(t)=A\cos(\omega t+\varphi).
\]

- A canonical Markdown link from the occurrence to [Physics and Astronomy](../branches/physics.md), with the reciprocal field-card link added only as a human-readable projection of the same relationship.

No new `equation-family` card was created.

## Structural and equivalence tests

### Sine/cosine representation

With free phase,

\[
A\sin(\omega t+\delta)
=A\cos\left(\omega t+\delta-\frac{\pi}{2}\right).
\]

Thus sine and cosine representations are phase reparameterizations, not separate equation families.

### Sinusoid versus oscillator ODE

Starting from the source form,

\[
x(t)=A\cos(\omega t+\varphi),
\]

differentiating twice yields

\[
\frac{d^2x}{dt^2}=-\omega^2x,
\]

or

\[
\frac{d^2x}{dt^2}+\omega^2x=0.
\]

For fixed real \(\omega>0\), the general real solution of this ODE is

\[
x(t)=C\cos(\omega t)+D\sin(\omega t).
\]

For nonzero \((C,D)\), let \(A=\sqrt{C^2+D^2}\) and choose \(\varphi\) so that \(C=A\cos\varphi\) and \(D=-A\sin\varphi\). Then the general solution becomes the source form. The zero solution is obtained with \(A=0\). This makes the two representations equivalent under the stated conditions, while leaving the source notation untouched.

### Existing-family rejection

The Atlas's current family is first-order scalar decay,

\[
\frac{dx}{dt}=-kx,\qquad k>0.
\]

Simple harmonic motion instead has a second-order evolution law and a two-dimensional state \((x,\dot x)\). Its generic nonzero solutions are periodic and do not monotonically relax to zero. Constant variable renaming, sign changes or rescaling cannot remove that derivative-order/state-dimension difference, so no family edge is created.

A generic harmonic-oscillator family is also deferred. One verified occurrence is not enough to justify collapsing small-angle pendula, LC circuits, acoustic modes, damped oscillators and driven oscillators without first testing their transformations and scope.

## Audit / corrected knowledge

The older [RC capacitor discharge](../formulas/rc-discharge.md) card already linked to [first-order linear decay](../families/first-order-linear-decay.md), but its validity conditions and family derivation were compressed enough that the edge depended partly on recognition rather than a fully reproduced transformation.

This run audited OpenStax §10.5 and made the relation explicit:

\[
IR+\frac{q}{C}=0,
\qquad I=\frac{dq}{dt}
\]

implies

\[
\frac{dq}{dt}=-\frac{1}{RC}q.
\]

The card now records units, the source-free discharge configuration, constant/lumped ideal-component assumptions, \(\tau=RC\), and the positivity condition \(R,C>0\), so `k=1/(RC)>0` matches the family definition reproducibly. Its status is advanced from `normalized` to `audited`.

Markdown links remain the source of truth. No UI or graph projection code was edited.

## Rejected / deferred

- No `harmonic-oscillator` equation-family card was created from a single occurrence.
- Damped motion was not treated as equivalent to undamped SHM; its first-derivative damping term is material structure.
- The broad Physics and Astronomy branch was used instead of inventing an unsupported narrower taxonomy node.
- No link was added between SHM and first-order decay merely because both are linear constant-coefficient differential equations.

## Files changed

- `knowledge/science-equations/formulas/simple-harmonic-motion.md`
- `knowledge/science-equations/branches/physics.md`
- `knowledge/science-equations/formulas/rc-discharge.md`
- `knowledge/science-equations/runs/2026-09-23-simple-harmonic-motion.md`

## Validation

The bundle is validated through the repository's normative OKF gate using the parser version pinned by the current repository workflow:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

The pull request also runs the normal blog checks, link checks, build/Lighthouse and repository policy gates. The PR checks are the reproducible record of those executions; merge is allowed only when the branch is synchronized with current `main` and all required checks are green. A failing gate remains evidence of a blocker rather than being reported as a successful result.
