---
type: science-formula
name: "SIR epidemic model"
latex: "\\begin{aligned}\\frac{dS}{dt}&=-\\beta IS\\\\\\frac{dI}{dt}&=\\beta IS-\\gamma I\\\\\\frac{dR}{dt}&=\\gamma I\\end{aligned}"
summary: "A three-compartment model in which susceptible population flows into an infectious compartment and then into a recovered compartment."
status: verified
source_label: "Scientific Reports (2020), The approximately universal shapes of epidemic curves in the SEIR model"
source_url: "https://www.nature.com/articles/s41598-020-76563-8"
updated: "2026-09-23"
---

# SIR epidemic model

The cited Scientific Reports treatment writes the SIR model for population fractions as

\[
\begin{aligned}
\frac{dS}{dt}&=-\beta IS,\\
\frac{dI}{dt}&=\beta IS-\gamma I,\\
\frac{dR}{dt}&=\gamma I.
\end{aligned}
\]

Here \(S\), \(I\) and \(R\) are the susceptible, infectious and recovered fractions of a closed population, so

\[
S+I+R=1.
\]

The transmission parameter \(\beta\) and recovery parameter \(\gamma\) both have units of inverse time in this normalized form. The source writes \(\beta=\mathcal{R}_0\gamma\), with mean infectious period \(1/\gamma\).

## Used in

- [Epidemiology](../branches/epidemiology.md)

## Validity and use

This is a deliberately idealized epidemic model. In the cited form it assumes a fixed population over the modeled interval, no explicit births or deaths, no incubation compartment, immediate infectiousness after infection, and a recovered class that does not return to susceptibility during the modeled horizon. The mass-action term \(\beta IS\) also encodes homogeneous mixing at the level of this compartmental approximation. These are modeling assumptions, not identities that arbitrary epidemic data must satisfy.

A useful internal check follows directly from the equations:

\[
\frac{d}{dt}(S+I+R)
=-\beta IS+(\beta IS-\gamma I)+\gamma I=0,
\]

so the normalization \(S+I+R=1\) is preserved by the dynamics when it holds initially.

## Equation-family test

The atlas already contains the scalar [first-order linear decay](../families/first-order-linear-decay.md) family

\[
\frac{dx}{dt}=-kx,\qquad k>0.
\]

The SIR system does **not** belong to that family. In particular,

\[
\frac{dI}{dt}=(\beta S(t)-\gamma)I,
\]

looks linear in \(I\) only if \(S\) is treated as an externally fixed coefficient. In the actual SIR model, however, \(S\) is another state variable satisfying \(dS/dt=-\beta IS\). The bilinear product \(IS\) makes the coupled vector field nonlinear, and no constant renaming \(x\leftrightarrow I\), \(k\leftrightarrow\gamma-\beta S\) reproduces the full dynamics because \(S(t)\) changes with the state.

Therefore this occurrence is **not** linked to the first-order linear-decay family. A future compartmental-dynamics family would need a separate abstraction justified across multiple occurrences rather than being invented for this one card.

## Prior art and evidence

Kermack and McKendrick's 1927 epidemic theory is the historical prior art behind the SIR tradition: [A Contribution to the Mathematical Theory of Epidemics](https://royalsocietypublishing.org/doi/10.1098/rspa.1927.0118).

The equation occurrence and notation recorded here follow [Scientific Reports, “The approximately universal shapes of epidemic curves in the Susceptible-Exposed-Infectious-Recovered (SEIR) model”](https://www.nature.com/articles/s41598-020-76563-8), whose SIR section gives the three coupled equations above, states \(S+I+R=1\), and identifies \(\beta=\mathcal{R}_0\gamma\).
