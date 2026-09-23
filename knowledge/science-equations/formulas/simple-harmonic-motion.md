---
type: science-formula
name: "Simple harmonic motion"
latex: "x(t)=A\\cos(\\omega t+\\varphi)"
summary: "Sinusoidal displacement for ideal simple harmonic motion with constant amplitude, angular frequency and phase."
status: verified
source_label: "OpenStax University Physics Volume 1, §15.1 Simple Harmonic Motion"
source_url: "https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion"
updated: "2026-09-23"
---

# Simple harmonic motion

OpenStax gives the generalized displacement of a block undergoing simple harmonic motion as

\[
x(t)=A\cos(\omega t+\varphi).
\]

The Atlas preserves that source notation, including the phase constant \(\varphi\), rather than replacing it with a zero-phase special case.

## Used in

- [Physics and Astronomy](../branches/physics.md)

## Variables, conditions and use

- \(x(t)\): displacement from equilibrium at time \(t\).
- \(A\): amplitude, with the same length unit as \(x\).
- \(\omega\): angular frequency, with units of inverse time (radians per second in SI usage).
- \(\varphi\): phase constant, measured in radians.
- \(t\): time.

For a mass-spring realization with mass \(m\) and spring constant \(k\), OpenStax gives

\[
\omega=\sqrt{\frac{k}{m}}.
\]

The simple model assumes a restoring force proportional to displacement and directed toward equilibrium. It is the undamped, unforced idealization: OpenStax treats damping and forcing separately because they change the equation of motion and, in general, the time dependence of the amplitude or response.

## Structural and equivalence tests

### Sine/cosine phase test

OpenStax notes that sine and cosine descriptions differ only by a phase shift. Explicitly,

\[
A\sin(\omega t+\delta)
 =A\cos\left(\omega t+\delta-\frac{\pi}{2}\right).
\]

So choosing sine instead of cosine does not define a different mathematical occurrence when the phase parameter is free.

### Differential-equation test

Differentiating the source form twice gives

\[
\frac{d^2x}{dt^2}
=-A\omega^2\cos(\omega t+\varphi)
=-\omega^2x,
\]

hence

\[
\frac{d^2x}{dt^2}+\omega^2x=0.
\]

Conversely, for fixed real \(\omega>0\), every real solution of that ODE can be written

\[
x(t)=C\cos(\omega t)+D\sin(\omega t)
\]

and, unless \(C=D=0\), reparameterized as

\[
x(t)=A\cos(\omega t+\varphi),
\qquad
A=\sqrt{C^2+D^2},
\]

with \(C=A\cos\varphi\) and \(D=-A\sin\varphi\). The zero solution is recovered by \(A=0\). This makes the sinusoidal representation and the undamped second-order oscillator ODE equivalent descriptions of the same solution space under those conditions.

### Existing equation-family test

The Atlas currently has the first-order linear-decay family

\[
\frac{dx}{dt}=-kx,\qquad k>0.
\]

Simple harmonic motion instead obeys a second-order equation,

\[
\frac{d^2x}{dt^2}+\omega^2x=0,
\]

with periodic non-decaying solutions. A constant variable renaming or rescaling cannot change derivative order or turn the two-dimensional oscillator state space \((x,\dot x)\) into the scalar first-order decay law. Therefore **no link to the existing decay family is created**.

The Atlas also does not create a generic `harmonic-oscillator` equation-family card from this single verified occurrence. A future family becomes better justified when another independent scientific occurrence—such as a small-angle pendulum, LC circuit, acoustic mode or another linear oscillator—is added and an explicit transformation can be checked.

## Evidence and prior art

- [OpenStax University Physics Volume 1, §15.1](https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion) gives the generalized source equation \(x(t)=A\cos(\omega t+\varphi)\), defines amplitude, angular frequency and phase, and derives velocity and acceleration by differentiation.
- [OpenStax University Physics Volume 1, Chapter 15 Summary](https://openstax.org/books/university-physics-volume-1/pages/15-summary) states the defining restoring-force condition for simple harmonic motion and gives \(\omega=\sqrt{k/m}\), \(T=2\pi\sqrt{m/k}\), and the same displacement law.
- [OpenStax University Physics Volume 1, §15.5](https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations) gives the neighboring damped equation \(m\,d^2x/dt^2+b\,dx/dt+kx=0\), showing why damped motion should not be silently folded into the undamped occurrence.
- [Wolfram Formula Repository, "Damped Harmonic Oscillator"](https://resources.wolframcloud.com/FormulaRepository/resources/Damped-Harmonic-Oscillator) was checked as neighboring prior art; it treats damping ratio and damped frequency as additional structure rather than as the same undamped formula.

## Scope

This card records ideal one-dimensional simple harmonic motion with constant \(\omega\). It does not claim equivalence to damped, driven, nonlinear, stochastic, parametrically driven or quantum harmonic oscillators.
