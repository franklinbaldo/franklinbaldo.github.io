---
type: science-formula
name: "Langmuir adsorption isotherm"
latex: "q_e=\\frac{q_mK_LC_e}{1+K_LC_e}"
summary: "Equilibrium adsorption rises with fluid-phase concentration toward a finite monolayer capacity in the Langmuir model."
status: normalized
source_label: "Murphy et al., ACS Omega 2023 review"
source_url: "https://doi.org/10.1021/acsomega.2c08155"
updated: "2026-09-23"
---

# Langmuir adsorption isotherm

Murphy et al. give the Langmuir equilibrium isotherm in the notation

\[
q_e=\frac{q_mK_LC_e}{1+K_LC_e}.
\]

The Atlas preserves that scientific notation: \(q_e\) is the equilibrium amount adsorbed per unit mass of adsorbent, \(q_m\) the monolayer adsorption capacity, \(K_L\) the Langmuir equilibrium/affinity constant, and \(C_e\) the equilibrium adsorbate concentration in the fluid phase.

## Used in

- [Physical and Theoretical Chemistry](../branches/physical-theoretical-chemistry.md)

## Variables, conditions and use

For the common concentration form used by the review:

- \(q_e\): equilibrium adsorption capacity, often mass of adsorbate per mass of adsorbent.
- \(q_m\): limiting monolayer capacity, in the same units as \(q_e\).
- \(C_e\): equilibrium adsorbate concentration in the fluid phase.
- \(K_L\): Langmuir constant, with inverse-concentration units so \(K_LC_e\) is dimensionless.

The ideal Langmuir interpretation assumes a homogeneous population of equivalent adsorption sites, monolayer occupancy and no lateral interaction between adsorbed molecules. Real adsorption systems can violate those assumptions, so a good numerical fit does not by itself establish the microscopic mechanism.

The equation is widely used to model equilibrium adsorption data and to estimate a limiting capacity and affinity parameter under conditions where the one-site Langmuir model is appropriate.

## Structural and equivalence tests

### Normalized saturating hyperbola

Define

\[
x=K_LC_e,
\qquad
y=\frac{q_e}{q_m}.
\]

For \(q_m>0\) and \(K_L>0\), substitution gives

\[
y=\frac{x}{1+x},
\qquad x\ge0.
\]

This is an invertible rescaling on the physical domain once \(q_m\) and \(K_L\) are fixed. The relation therefore belongs to the verified [normalized saturating hyperbola](../families/normalized-saturating-hyperbola.md) family.

The same canonical form is reached independently by the Michaelis–Menten occurrence with

\[
x=\frac{[S]_0}{K_{\mathrm M}},
\qquad
y=\frac{v_0}{V}.
\]

The shared family is mathematical; it does **not** assert that surface adsorption and enzyme kinetics have the same physical mechanism.

### Low-concentration limit

If \(K_LC_e\ll1\), then

\[
q_e\approx q_mK_LC_e.
\]

This is a linear equilibrium-response approximation. It is not an evolution equation and therefore is not equivalent to the Atlas's first-order linear-decay family.

## Evidence and prior art

- [Murphy et al., *ACS Omega* 2023, DOI 10.1021/acsomega.2c08155](https://doi.org/10.1021/acsomega.2c08155) reviews commonly used adsorption isotherms and tabulates the Langmuir form above, including the meanings and units of \(q_e\), \(q_m\), \(K_L\), and \(C_e\), plus the homogeneous/monolayer assumptions and low-concentration behavior.
- [Langmuir, 1918, *The Adsorption of Gases on Plane Surfaces of Glass, Mica and Platinum*](https://doi.org/10.1021/ja02242a004) is the foundational historical paper for the adsorption model. The Atlas uses the modern notation from the technical review rather than silently rewriting the source occurrence into historical notation.
- [IUPAC Gold Book: convex isotherm](https://goldbook.iupac.org/terms/view/CT06937) identifies the Langmuir adsorption isotherm as a special case of a convex adsorption isotherm in chromatography.

## Scope

This card records the one-site Langmuir equilibrium isotherm. It does not claim that all adsorption is Langmuirian, that fitting this curve proves homogeneous sites, or that multilayer and heterogeneous adsorption models are equivalent to this form.
