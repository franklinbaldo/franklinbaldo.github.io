---
type: science-formula
name: "Heat equation"
latex: "u_t = c^2u_{xx}"
summary: "One-dimensional heat/diffusion PDE relating the time derivative of temperature to its second spatial derivative."
status: verified
source_label: "OpenStax Calculus Volume 3, 4.3 Partial Derivatives"
source_url: "https://openstax.org/books/calculus-volume-3/pages/4-3-partial-derivatives"
updated: "2026-09-23"
---

# Heat equation

OpenStax gives the one-dimensional heat equation as

\[
u_t = c^2u_{xx},
\]

where \(c^2\) is the thermal diffusivity of the material. The Atlas preserves that notation rather than silently replacing \(c^2\) with another conventional diffusivity symbol.

## Used in

- [Thermodynamics and heat transfer](../branches/thermodynamics.md)

## Variables, conditions and use

- \(u=u(x,t)\): temperature as a function of position \(x\) and time \(t\).
- \(c^2\): thermal diffusivity in the notation used by the source; dimension \(L^2/T\).
- \(x\): one-dimensional spatial coordinate.
- \(t\): time.
- The displayed equation assumes a constant diffusivity and has no explicit source term.

The equation models redistribution of temperature through a one-dimensional material by diffusion. OpenStax illustrates a separated solution for a wire of unit length,

\[
u_m(x,t)=e^{-\pi^2m^2c^2t}\sin(m\pi x),
\]

for positive integer \(m\).

## Structural and equivalence tests

### Diffusion-form test

A common constant-coefficient diffusion notation is

\[
\frac{\partial u}{\partial t}=\kappa\frac{\partial^2u}{\partial x^2}.
\]

Using \(u_t=\partial u/\partial t\), \(u_{xx}=\partial^2u/\partial x^2\), and the parameter substitution \(\kappa=c^2\), this becomes exactly

\[
u_t=c^2u_{xx}.
\]

MathWorld independently gives the one-dimensional heat-conduction equation in this \(\kappa\)-form. This is an explicit notation/parameter equivalence, but the Atlas does not create a generic diffusion equation-family card from a single verified occurrence.

### Existing equation-family test

The Atlas's existing scalar first-order linear-decay family is

\[
\frac{dx}{dt}=-kx.
\]

The full heat equation is a PDE for a field \(u(x,t)\) and contains a second spatial derivative. Variable renaming, constant rescaling, or algebraic rearrangement cannot remove that operator structure, so the full PDE is **not** equivalent to the existing decay family and no `equation-family` edge is added.

There is a narrower relationship after separation of variables. For OpenStax's displayed mode, write

\[
u_m(x,t)=a_m(t)\sin(m\pi x),
\qquad
a_m(t)=e^{-\pi^2m^2c^2t}.
\]

Then

\[
\frac{da_m}{dt}=-\pi^2m^2c^2a_m.
\]

So each such modal amplitude obeys the first-order decay family with \(k=\pi^2m^2c^2\). That reduction depends on the separated mode and its boundary/domain assumptions; it is a derived representation of a solution component, not an invertible equivalence of the original PDE. The occurrence therefore remains unlinked at family level.

## Evidence and prior art

- [OpenStax Calculus Volume 3, §4.3](https://openstax.org/books/calculus-volume-3/pages/4-3-partial-derivatives) gives the one-dimensional equation \(u_t=c^2u_{xx}\), identifies \(c^2\) as thermal diffusivity, and displays the separated modes used above.
- [Wolfram MathWorld, "Heat Conduction Equation"](https://mathworld.wolfram.com/HeatConductionEquation.html) catalogs the heat equation as a diffusion PDE and gives both the multidimensional form \(U_t=\kappa\nabla^2U\) and the one-dimensional specialization \(U_t=\kappa U_{xx}\).
- [EqWorld, Partial Differential Equations index](https://eqworld.ipmnet.ru/en/solutions/eqindex/eqindex-pde.htm) separately catalogs heat and diffusion equations, including anisotropic, linear and nonlinear variants; this is prior-art evidence that a future Atlas family should distinguish scope rather than collapse all diffusion-like PDEs prematurely.
- [Wolfram Formula Repository, "Fourier's Law"](https://resources.wolframcloud.com/FormulaRepository/resources/Fouriers-Law) was checked as neighboring formula prior art for conductive heat flow; it records the flux-gradient law rather than the same PDE occurrence.

## Scope

This card records the one-dimensional, constant-diffusivity, source-free occurrence shown by OpenStax. It does not claim equivalence to variable-coefficient, anisotropic, nonlinear, reaction-diffusion, or source-driven heat equations.
