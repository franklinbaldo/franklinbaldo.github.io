---
type: science-formula
name: "Cobb-Douglas production function"
latex: "P=bL^{k}C^{1-k}"
summary: "A two-input production function relating output to labor and capital with constant returns to scale in this parameterization."
status: verified
source_label: "Humphrey, Federal Reserve Bank of Richmond Economic Quarterly 83(1), 1997"
source_url: "https://fraser.stlouisfed.org/files/docs/publications/frbrichreview/rev_frbrich199701.pdf"
updated: "2026-09-23"
---

# Cobb-Douglas production function

Thomas M. Humphrey's historical survey in the *Federal Reserve Bank of Richmond Economic Quarterly* presents the familiar two-factor form as

\[
P=bL^{k}C^{1-k}.
\]

The notation is preserved from that source: \(P\) is product/output, \(L\) is labor input, \(C\) is capital input, \(b\) is a constant scale factor in this static form, and the exponents are \(k\) and \(1-k\). The source describes the latter as output elasticities and notes that their sum gives constant returns to scale.

## Used in

- [Economics and Econometrics](../branches/economics-econometrics.md)

## Structural test

Let

\[
F(L,C)=bL^{k}C^{1-k}.
\]

For any \(\lambda>0\),

\[
\begin{aligned}
F(\lambda L,\lambda C)
&=b(\lambda L)^k(\lambda C)^{1-k}\\
&=\lambda^{k+1-k}bL^kC^{1-k}\\
&=\lambda F(L,C).
\end{aligned}
\]

So this exact parameterization is homogeneous of degree one: scaling labor and capital together by \(\lambda\) scales modeled output by the same factor. This independently checks the source's constant-returns statement.

For positive \(P,b,L,C\), taking logarithms gives the equivalent representation

\[
\log P=\log b+k\log L+(1-k)\log C.
\]

That transformation is valid only where the logarithms are defined and does not change the underlying production-function occurrence.

## Equation-family test

The atlas's only current equation family is scalar first-order linear decay,

\[
\frac{dx}{dt}=-kx.
\]

The Cobb-Douglas occurrence is instead an algebraic map from two inputs to an output and contains no time derivative. Constant renaming, rescaling, or reparameterization cannot turn the algebraic operator \(F(L,C)\) into the differential operator \(dx/dt\). The logarithmic transformation above remains a static algebraic relation. Therefore no `equation-family` edge is added.

## Evidence and prior art

- [Humphrey, "Algebraic Production Functions and Their Uses Before Cobb-Douglas," Federal Reserve Bank of Richmond Economic Quarterly 83(1), 1997](https://fraser.stlouisfed.org/files/docs/publications/frbrichreview/rev_frbrich199701.pdf) gives \(P=bL^kC^{1-k}\), describes its constant returns to scale, and discusses the interpretation of the exponents.
- [Cobb & Douglas, "A Theory of Production," American Economic Review 18(1), 1928](https://www.jstor.org/stable/1811556) is the canonical historical paper associated with the empirical use of the form.
- Humphrey's historical review also documents earlier related production functions by Thünen and Wicksell, so the card does not turn the modern eponym into a claim of first discovery.

## Scope

This card records the cited two-factor constant-returns form. It does not silently generalize it to later variants such as \(Y=AK^\alpha L^\beta\) with unconstrained \(\alpha+\beta\), nor does it claim that a Cobb-Douglas specification is universally adequate for production data.
