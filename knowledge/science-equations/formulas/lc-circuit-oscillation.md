---
type: science-formula
name: "Ideal LC circuit oscillation"
latex: "q(t)=q_0\\cos(\\omega t+\\varphi)"
summary: "In an ideal resistance-free LC circuit, capacitor charge oscillates sinusoidally as energy moves between the capacitor and inductor."
status: verified
source_label: "OpenStax University Physics Volume 2, §14.5 Oscillations in an LC Circuit"
source_url: "https://openstax.org/books/university-physics-volume-2/pages/14-5-oscillations-in-an-lc-circuit"
updated: "2026-09-23"
---

# Ideal LC circuit oscillation

OpenStax gives the capacitor charge in an ideal LC circuit as

\[
q(t)=q_0\cos(\omega t+\varphi),
\]

with

\[
\omega=\sqrt{\frac{1}{LC}}.
\]

The Atlas preserves that source notation rather than replacing it with a zero-phase special case or only the resonance-frequency formula.

## Used in

- [Electrical engineering](../branches/electrical-engineering.md)

## Variables, units, conditions and use

- \(q(t)\): capacitor charge at time \(t\), in coulombs.
- \(q_0\): charge amplitude, in coulombs.
- \(L\): inductance, in henries.
- \(C\): capacitance, in farads.
- \(\omega\): angular frequency, in radians per second, with \(\omega=1/\sqrt{LC}\).
- \(\varphi\): phase constant, in radians.
- \(t\): time, in seconds.

OpenStax derives this for an idealized series LC circuit with zero resistance and no source emf after the oscillation is established. Energy is exchanged between the capacitor's electric field and the inductor's magnetic field. Real circuits have resistance and radiation losses, so indefinitely constant-amplitude oscillation is an idealization.

## Structural and equivalence tests

### LC charge versus the harmonic-oscillator ODE

Differentiate the source form twice:

\[
\frac{d^2q}{dt^2}=-\omega^2 q.
\]

Therefore

\[
\frac{d^2q}{dt^2}+\omega^2q=0.
\]

Using the source relation \(\omega^2=1/(LC)\), this becomes

\[
\frac{d^2q}{dt^2}+\frac{1}{LC}q=0.
\]

For \(L>0\) and \(C>0\), \(\omega>0\). The transformation

\[
x=q
\]

puts the occurrence exactly in [undamped linear harmonic oscillator](../families/undamped-linear-harmonic-oscillator.md), whose canonical form is

\[
\frac{d^2x}{dt^2}+\omega^2x=0.
\]

This is an operator-level equivalence, not merely a resemblance between plotted sinusoids.

### LC charge versus mechanical simple harmonic motion

The existing [simple harmonic motion](simple-harmonic-motion.md) occurrence preserves

\[
x(t)=A\cos(\omega t+\varphi).
\]

The LC source preserves

\[
q(t)=q_0\cos(\omega t+\varphi).
\]

With the invertible variable/amplitude renaming \(x\leftrightarrow q\), \(A\leftrightarrow q_0\), the two source solution forms have the same mathematical structure. OpenStax independently makes the mechanical-to-electromagnetic correspondence explicit by replacing \(m\) with \(L\), \(k\) with \(1/C\), and \(x\) with \(q\). Thus the shared family edge is verified rather than inferred from visual similarity.

### First-order decay rejection

The Atlas's older first-order family is

\[
\frac{dx}{dt}=-kx,\qquad k>0.
\]

An ideal LC oscillator instead obeys a second-order equation and has periodic, non-decaying generic solutions. Constant renaming or rescaling cannot change derivative order or state dimension. Therefore no edge to first-order linear decay is created.

### RLC is not silently folded into the same occurrence

OpenStax's neighboring RLC model has an additional resistance term and, in the underdamped regime, a decaying envelope. Resistance therefore changes the operator and the solution space. The ideal LC occurrence and family link do not claim equivalence to damped RLC dynamics.

## Evidence and prior art

- [OpenStax University Physics Volume 2, §14.5](https://openstax.org/books/university-physics-volume-2/pages/14-5-oscillations-in-an-lc-circuit) gives \(q(t)=q_0\cos(\omega t+\varphi)\), \(\omega=\sqrt{1/(LC)}\), and explicitly maps the mechanical oscillator variables \(m,k,x\) to \(L,1/C,q\).
- [OpenStax University Physics Volume 2, §14.6](https://openstax.org/books/university-physics-volume-2/pages/14-6-rlc-series-circuits) adds resistance and shows the underdamped RLC charge acquiring an exponential envelope, which bounds the undamped claim.
- [Wolfram Formula Repository, Resonance Frequency Equation](https://resources.wolframcloud.com/FormulaRepository/resources/Resonance-Frequency-Equation) independently catalogs the LC resonance relation \(f=1/(2\pi\sqrt{LC})\); it is prior art for the frequency formula, not a substitute for the OpenStax dynamical derivation used for the family edge.

## Scope

This card is restricted to the ideal resistance-free LC oscillator. It does not claim that dissipative, driven, nonlinear, distributed or quantum circuits share the same complete dynamics.
