---
type: Paper
title: "A Machine-Checked Minimal Core of Modern Monetary Theory: Fiscal Flows, Nominal Settlement, Resource Constraints, and Logical Compatibility"
description: "An explicitly limited Lean 4 formalization of monetary-accounting premises, five proved core statements, two inflation countermodels, and joint satisfiability with an independently specified Fisher-growth fragment."
timestamp: 2026-11-08T00:00:00-04:00
authors:
  - ref: /authors/franklin-silveira-baldo.md
    byline: "Franklin Silveira Baldo"
    affiliations:
      - "Independent Researcher"
    corresponding: true
publication:
  status: draft
  targets: [zenodo]
  zenodo:
    publication_type: preprint
    access_right: open
    version: "0.1.0"
genre: theory
research_fronts: [formal-mmt-core]
tags:
  - formal-mmt-core
  - modern-monetary-theory
  - monetary-sovereignty
  - fiscal-accounting
  - theorem-proving
  - lean4
  - formal-methods
---

# A Machine-Checked Minimal Core of Modern Monetary Theory: Fiscal Flows, Nominal Settlement, Resource Constraints, and Logical Compatibility

**Franklin Silveira Baldo**  
Independent Researcher  
ORCID: [0000-0002-4836-7608](https://orcid.org/0000-0002-4836-7608)  
Correspondence: franklinbaldo@gmail.com

*Working paper, version 0.1.0 — 8 November 2026. Not peer reviewed. No DOI has been assigned.*

> **Theory paper with a machine-checked but deliberately incomplete formal core.** The contribution is an auditable separation between assumptions, deductive consequences, countermodels, and claims that remain economically undetermined. Neither the empirical truth of Modern Monetary Theory (MMT) nor its full logical compatibility with a competing macroeconomic theory has been proved. The results below concern exactly the types and hypotheses declared in the cited Lean 4 sources.

## Abstract

Monetary debates often move between accounting identities, institutional assertions, behavioral mechanisms, and policy conclusions without making the transitions explicit. This paper examines what can be established by machine checking a small accounting-operational fragment inspired by Modern Monetary Theory (MMT). In Lean 4, we encode a one-period nominal fiscal-flow identity, a stipulated ability to settle arbitrary nominal amounts in the unit of account, and a distinct real-resource feasibility relation. Five verified propositions establish the algebraic inclusion of interest payments in the defined fiscal flow; the conditional monotonicity of that flow in interest expenditure; the non-entailment of real feasibility by nominal settlement; and the existence of countermodels showing that neither a unique inflation value at a given policy rate nor the relation \(\pi=i-g\) follows from this minimal interface alone. Independently, a Fisher-growth fragment assumes \(i=r+\pi\) and \(r=g\), deriving \(\pi=i-g\) and conditional comparisons between long-run equilibria. A constructive witness satisfies both selected fragments simultaneously. Additional elementary results cover one-period debt dynamics and indexed interest rates. All ten named proofs were built under Lean 4.35.0 in a successful GitHub Actions run. The findings are about **entailment relative to explicit premises**: they neither validate monetary sovereignty as an institutional fact nor determine inflation or policy outcomes in an actual economy. We document the precise proof obligations, trust boundary, replication procedure, and extensions needed for a substantive stock-flow-consistent monetary theory.

**Keywords:** Modern Monetary Theory; monetary sovereignty; stock-flow accounting; formal verification; Lean 4; logical entailment; inflation identification; model compatibility.  
**JEL classification:** B52, E12, E31, E42, E58, C63.

## 1. Introduction

Modern Monetary Theory (MMT) combines an account of monetary institutions, macroeconomic bookkeeping, and policy prescriptions. Its foundational literature distinguishes payments in an issuer's monetary unit from the real constraints on an economy, attends closely to the operations of treasury departments and central banks, and analyzes the fiscal effects of state liabilities [1, 2]. Such discussions contain propositions of different logical kinds: some are definitions or accounting identities; others concern institutional arrangements; others depend on choices, expectations, prices, balance sheets, and dynamic behavior. Treating all of these as one undifferentiated “theory” obscures what can actually be inferred.

The limited question investigated here is:

> Given a precisely declared subset of accounting and monetary-operational premises, which propositions are deductive consequences, which propositions are not determined by those premises, and can the subset coexist with a separate Fisher-based long-run hypothesis?

This is a *formal-methods* question, not an empirical evaluation of Brazil, the United States, or any other currency area. We use the Lean 4 proof assistant [3] to make every cited theorem depend on an inspectable set of declarations. Lean does not decide whether the declarations accurately describe a central bank or an economy. It checks that the stated conclusions follow in its formal logic.

The work is motivated in part by André Lara Resende's discussion of persistently high Brazilian interest rates and the possibility of a lower long-run nominal-rate regime [4]. That discussion connects interest payments, fiscal dynamics, and an argument using the Fisher relation. Rather than infer disagreement between schools from their labels, this paper compares *fragments with explicit hypotheses* and tests their joint satisfiability.

### 1.1 Contributions and boundaries

The paper contributes a documented, executable baseline with four separable components.

1. An inspectable distinction between a nominal fiscal-flow identity, a **stipulated** nominal-settlement predicate, and a real-capacity inequality.
2. Five Lean-checked elementary propositions and countermodels identifying what the minimal MMT-inspired interface does and does not entail.
3. An independently formalized long-run Fisher-growth fragment, with two mathematical consequences and two further one-period fiscal/indexation results.
4. A constructive witness showing that the selected MMT-inspired and Fisher-growth structures can share nominal-rate, inflation, and growth coordinates without contradiction.

The deductions are mostly elementary. Their mathematical difficulty is **not** the claimed contribution. The value is the enforced scope: no price-setting mechanism or full banking system is silently smuggled into a proof that uses only an accounting relation and unconstrained fields.

We make **no claim of priority for the accounting equations, Fisher identity, the logical use of countermodels, or the general methodology of mechanized theorem proving**. No exhaustive literature search for other formalizations of MMT has been completed. The implementation is described as a minimal formal core, not as a completed axiomatization of MMT.

## 2. Theoretical and methodological background

### 2.1 Institutional monetary analysis and accounting

Tymoigne and Wray [1] describe MMT through monetary institutions, treasury-central-bank operations, and national-accounting identities. Wray's subsequent primer [2] treats currency regimes, banking, sovereign fiscal operations, and inflation as related but distinct parts of the theory. In particular, the capacity to settle *nominal liabilities denominated in a state's own currency* is not a proposition that an economy has unlimited capacity to produce real goods and services.

The stock-flow-consistent literature represented by Godley and Lavoie [5] supplies a complementary methodological warning. For an accounting assertion to describe an economy, one must specify sectors, transaction matrices, assets and liabilities, and the identities that connect them. The one-equation fragment in this paper is a **deliberate abstraction**, not a substitute for those requirements. Accordingly, “net private injection” below is the model's labeled variable and not an independently derived change in consolidated non-government net financial assets under an arbitrary banking and external-sector configuration.

### 2.2 An independently stated Fisher-growth argument

An approximate Fisher relation writes nominal interest as a real rate plus expected inflation. A particular long-run analysis may further identify the equilibrium real rate with an exogenous growth measure, giving an expression of the form \(\pi=i-g\). Such an expression is **not** obtained from an accounting identity alone: it depends on additional economic assumptions about the relevant rates, expectations, and the equilibrium being considered. Lara Resende [4] employs related reasoning in his Brazilian policy proposal; Cochrane's fiscal-theory treatment [6] offers relevant context for the broader distinction between interest-rate rules and mechanisms of price-level determination.

Our comparator follows the exact **formal** declarations in the source code: its field named `inflation` denotes a long-run inflation quantity and satisfies the asserted equality \(i=r+\pi\). There is no separately modeled expected inflation, ex ante/ex post decomposition, risk premium, or dynamic adjustment. Consequently, the model is not a formalization of the full fiscal theory of the price level or of an empirical New Fisherian monetary regime.

### 2.3 What machine checking establishes

Lean 4 is both a programming language and an interactive theorem prover [3]. Each theorem in the present library is elaborated and checked by Lean against its declared hypotheses. The tactic `omega` discharges the integer-linear arithmetic goals, while constructed examples and elementary definitional simplification supply witnesses for existence statements.

Kernel acceptance is evidence of **deductive correctness given the definitions and the trusted logical environment**. It is not evidence of external validity, policy feasibility, causal identification, independent peer review, or theoretical novelty. A source file that assumes a disputed monetary property as a field has not proved the property about any real-world government.

## 3. Formal language and model scope

### 3.1 Domains and units

The implementation uses `Int` for signed integer-valued quantities and `Nat` for nonnegative nominal amounts in the settlement predicate. Rates are represented in **basis points**: 550 represents 5.50 percentage points. Fiscal flows, the resource-capacity variables, and rate fields do not inhabit separately enforced dimensional types. Neither positivity constraints nor flow/stock unit checks are built into the present structures.

This deliberately small signature makes the proof obligations simple, but also admits economically implausible assignments. Satisfiability of the signature therefore must not be read as calibration of a macroeconomic model.

### 3.2 Fiscal-flow structure

**Definition 1 (one-period nominal fiscal-flow record).** Let \(G,T,J,N\in\mathbb Z\) denote nominal primary government spending, taxes, government interest payments, and the variable named net private injection. The type `FiscalFlows` requires

\[
\tag{1} N=G+J-T.
\]

In Lean, equation (1) is stored in a field named `accounting`. No proof is provided that equation (1) follows from an independently specified transaction matrix: it is the starting accounting **premise** of this particular model. For the strongest sectoral interpretation, an additional theorem would have to account for all relevant sectors, transfers, transactions, and liability changes.

### 3.3 Nominal settlement and real resources

**Definition 2 (minimal monetary-economy record).** The type `MonetaryEconomy` contains fields

\[
(i,\pi,g,D,C,S)
\]

for the nominal policy rate \(i\), inflation \(\pi\), real growth \(g\), real demand \(D\), real productive capacity \(C\), and a predicate

\[
S:\mathbb N\rightarrow\mathrm{Prop}.
\]

It additionally requires the field

\[
\tag{2} \forall n\in\mathbb N,\ S(n).
\]

Intuitively, \(S(n)\) is “can settle nominal amount \(n\) in the own monetary unit.” Equation (2) is **postulated as part of the record**; the record contains no settlement algorithm or institutional balance sheet proving this ability.

**Definition 3 (resource feasibility).** The predicate `withinResources` is

\[
\tag{3} D\leq C.
\]

Importantly, no equation links inflation to (3), monetary operations, the policy rate, wages, import prices, bank credit, or aggregate demand. These omissions are what the later countermodels expose.

### 3.4 The constructed sample economy

The code's constructor `sample` takes five integers \(i,\pi,g,D,C\), sets the corresponding fields, and chooses \(S(n)=\mathsf{True}\) for every \(n\). Thus (2) holds **by construction** for each sample. This is a model-theoretic device; it cannot be interpreted as a derived observation that a real treasury can settle any payment.

## 4. Deductive results of the minimal MMT-inspired core

All mathematical statements in this section refer to the formal types of Section 3, not to the entire MMT literature.

### Proposition 1 (interest payments occur in the defined flow)

For each `FiscalFlows` record satisfying (1),

\[
\tag{4} N-G+T=J.
\]

**Proof.** Starting with \(N=G+J-T\), subtract \(G\) and add \(T\) on both sides. The equality is purely algebraic. \(\square\)

**Lean declaration:** `JurosMMT.MMT.interest_is_a_fiscal_flow`.

**Interpretation.** The proof establishes the exact re-expression of the **assumed** accounting equation. It does not establish a marginal propensity to consume interest income, an inflation effect, or a complete sectoral-balance identity.

### Proposition 2 (conditional monotonicity in interest payments)

Let two `FiscalFlows` records, “before” and “after,” satisfy

\[
G'=G,\qquad T'=T,\qquad J'\leq J.
\]

Then

\[
\tag{5} N'\leq N.
\]

**Proof.** Subtracting (1) across the records gives

\[
N'-N=(G'-G)+(J'-J)-(T'-T)=J'-J\leq0.
\]

Hence (5). \(\square\)

**Lean declaration:** `JurosMMT.MMT.lower_interest_reduces_net_injection`.

**Interpretation.** Equation (5) is a comparison of two **nominal accounting records under fixed primary spending and taxes**. It does not prove that a policy-rate cut actually reduces all public interest expenditure, because the code does not connect the `policyRate` field to the `interestPayments` field. It also does not determine the sign of any induced change in prices or output.

### Proposition 3 (nominal settlement does not imply real feasibility)

The following proposed universal implication is false in the defined class:

\[
\tag{6}
(\forall n,\ S(n))\ \Longrightarrow\ (D\leq C).
\]

More precisely, there exists a `MonetaryEconomy` record satisfying the left-hand side and violating the right-hand side.

**Proof by countermodel.** Choose the sample economy with

\[
i=500,\quad \pi=300,\quad g=200,\quad D=101,\quad C=100,
\]

and \(S(n)=\mathsf{True}\) for all \(n\). The record satisfies (2), but \(101\not\leq100\). \(\square\)

**Lean declaration:** `JurosMMT.MMT.nominal_settlement_does_not_ensure_real_capacity`.

**Interpretation.** The countermodel verifies the logical independence of (3) from the assumed nominal-settlement property **within this signature**. It does not quantify how a real economy's inflation responds to excess real demand.

### Proposition 4 (inflation is not uniquely identified by the nominal rate)

There exist `MonetaryEconomy` records \(e_1,e_2\) with the same nominal policy rate but different inflation values:

\[
\tag{7}
i(e_1)=i(e_2),\qquad \pi(e_1)\neq\pi(e_2).
\]

**Proof by witnesses.** Take

\[
\begin{aligned}
e_1 &= \mathrm{sample}(500,300,200,90,100),\\
e_2 &= \mathrm{sample}(500,400,200,90,100).
\end{aligned}
\]

Both obey the declared settlement property, both satisfy \(D\leq C\), both have nominal rate \(500\), and their inflation fields differ. \(\square\)

**Lean declaration:** `JurosMMT.MMT.same_rate_can_coexist_with_different_inflation`.

**Interpretation.** A unique inflation value cannot be deduced from a type whose inflation field is otherwise unconstrained. This is a useful **audit of under-specification**, not an empirical assertion that policy rates never affect inflation.

### Proposition 5 (the Fisher-growth formula is not entailed by the core)

There is a `MonetaryEconomy` record for which

\[
\tag{8}
\pi\neq i-g.
\]

**Proof by witness.** Set \(i=500\), \(\pi=300\), \(g=100\), \(D=90\), and \(C=100\), with \(S(n)=\mathsf{True}\). Then \(i-g=400\), which differs from \(\pi=300\). \(\square\)

**Lean declaration:** `JurosMMT.MMT.fisher_growth_formula_is_not_forced`.

**Interpretation.** The formal claim is that the implication from the premises actually encoded in `MonetaryEconomy` to the universal law \(\pi=i-g\) fails. It does **not** show that the Fisher equation is false, that MMT disproves it, or that adding an independently justified long-run equilibrium premise would be contradictory.

### 4.1 The logical status of the two countermodels

Propositions 4 and 5 establish model-theoretic **non-entailment**. If \(\Gamma_M\) denotes the defined minimal interface and \(\varphi\) one of the candidate inflation laws, the construction of a record satisfying the interface but violating \(\varphi\) shows

\[
\tag{9}
\Gamma_M \not\models \varphi.
\]

It does not show that \(\Gamma_M\models\neg\varphi\). That asymmetry is central: **not deriving a law is different from deriving its negation**.

Because the rate and inflation fields are unconstrained by construction, the witnesses are elementary. A richer monetary model with a specified pricing rule, expectations, balance-sheet constraints, and dynamics might eliminate some or all such witnesses. Its claims would require new hypotheses and new proofs.

## 5. Independent Fisher-growth and fiscal-indexation fragment

This section describes a **separate** Lean module. Its assumptions are not imported into the minimal `MonetaryEconomy` type.

### Definition 4 (long-run Fisher-growth record)

A record `LongRun` carries integers \(i,r,\pi,g\), together with proof fields requiring

\[
\tag{10} i=r+\pi,
\]
\[
\tag{11} r=g.
\]

These are premises. In particular, the identification \(r=g\) is a strong additional hypothesis, not a universal mathematical law or a generic MMT consequence.

### Proposition 6 (the Fisher-growth identity)

Every `LongRun` record satisfies

\[
\tag{12}\pi=i-g.
\]

**Proof.** Substitute (11) into (10) and rearrange. \(\square\)

**Lean declaration:** `JurosMMT.Resende.inflation_eq_rate_minus_growth`.

### Proposition 7 (conditional ordering of two long-run equilibria)

Let \(a,b\) be two `LongRun` records with \(g_b=g_a\) and \(i_b<i_a\). Then

\[
\tag{13}\pi_b<\pi_a.
\]

**Proof.** Apply (12) to each record:

\[
\pi_b=i_b-g_b<i_a-g_a=\pi_a.
\]
\(\square\)

**Lean declaration:** `JurosMMT.Resende.rate_cut_lowers_long_run_inflation`.

**Interpretation.** This comparison is an implication between two **stipulated long-run equilibria**. Neither a transition path nor the causal effectiveness of a central-bank interest-rate cut is encoded. In particular, “lower \(i\) corresponds to lower \(\pi\) in two qualifying records” must not be rewritten as “a unilateral policy-rate cut necessarily reduces inflation in the world.”

### Proposition 8 (one-period nominal debt monotonicity)

The module `FiscalPeriod` assumes the identity

\[
\tag{14}B_1=B_0+J-P,
\]

where \(B_0\) and \(B_1\) are opening and closing nominal debt, \(J\) is interest cost, and \(P\) is the primary surplus. If \(B'_0=B_0\), \(P'=P\), and \(J'\leq J\), then \(B'_1\leq B_1\).

**Proof.** Subtract the two instances of (14); equal opening debt and primary surplus cancel, leaving \(B'_1-B_1=J'-J\leq0\). \(\square\)

**Lean declaration:** `JurosMMT.Resende.lower_interest_lowers_closing_debt`.

This is not a forecast of a government debt-to-GDP ratio: maturity effects, stock-flow adjustments, price-level changes, exchange-rate valuation and endogenous fiscal responses are outside the equation.

### Proposition 9 (indexed-coupon pass-through)

The module `IndexedSecurity` assumes a fixed-spread indexation relation

\[
\tag{15} c=i+s,
\]

where \(c\) is the coupon rate, \(i\) the reference policy rate, and \(s\) a spread. If the spread is unchanged and \(i'\leq i\), then \(c'\leq c\).

**Proof.** Use (15) for each record and subtract the common spread. \(\square\)

**Lean declaration:** `JurosMMT.Resende.indexed_coupon_pass_through`.

The statement describes a deliberately simplified indexed instrument. It does not account for stock weights, repricing lags, coupons versus market values, default premia, or risk premia.

## 6. A constructive joint model

### Theorem 10 (joint satisfiability of the selected fragments)

There exist a `LongRun` record \(L\) and a `MonetaryEconomy` record \(M\) such that

\[
\tag{16}
i_L=i_M,\qquad \pi_L=\pi_M,\qquad g_L=g_M.
\]

**Constructive proof.** Let

\[
\begin{array}{c|ccccc}
& i & r & \pi & g & (D,C)\\ \hline
L & 550 & 250 & 300 & 250 & \text{not defined}\\
M & 550 & \text{not defined} & 300 & 250 & (90,100)
\end{array}
\]

and assign \(S(n)=\mathsf{True}\) in \(M\). The two premises in \(L\) hold because \(550=250+300\) and \(250=250\). The settlement premise in \(M\) holds by its construction. The three equalities in (16) follow by the chosen field assignments. \(\square\)

**Lean declaration:** `JurosMMT.Compatibility.a_joint_model_exists`.

The example uses nominal interest \(5.5\%\), real interest \(2.5\%\), inflation \(3.0\%\), and growth \(2.5\%\), all expressed as basis-point integers.

### 6.1 Exactly what compatibility means

The theorem asserts the existence of two **records** whose selected observable coordinates agree. The monetary-economy record has no `realRate` field, and the Fisher-growth record has no settlement or capacity field. Thus the joint model does not require proving agreement about variables neither type defines.

This is a weak, valid notion of joint satisfiability for the available signatures. It is **not** a proof that every doctrine associated with MMT is compatible with every neofisherian or fiscal-theory doctrine. A genuine inconsistency demonstration would require shared definitions and assumptions \(\Gamma_M,\Gamma_F\) such that \(\Gamma_M\cup\Gamma_F\) has no model. No such complete axiom systems have been encoded here.

Conversely, the present successful witness blocks one specific overstatement: the two **selected** fragments do not already contradict one another. Their conjunction has at least this explicit inhabitant.

## 7. Proof correspondence and reproducibility

### 7.1 Source of truth and verification receipt

The formal evidence is not recreated in this paper. It resides in the public, commit-pinned repository:

- Repository: [franklinbaldo/franklinbaldo.github.io](https://github.com/franklinbaldo/franklinbaldo.github.io).
- **Immutable reference commit:** [`397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3`](https://github.com/franklinbaldo/franklinbaldo.github.io/tree/397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3/experiments/juros-mmt-lean4).
- Source modules: [MMT.lean](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3/experiments/juros-mmt-lean4/JurosMMT/MMT.lean), [Resende.lean](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3/experiments/juros-mmt-lean4/JurosMMT/Resende.lean), and [Compatibility.lean](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3/experiments/juros-mmt-lean4/JurosMMT/Compatibility.lean).
- Lean toolchain: `leanprover/lean4:v4.35.0`, pinned in the source repository's `lean-toolchain`.
- Recorded successful GitHub Actions run: [42424702535](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/42424702535), invoking `lake build --wfail`.
- Original incorporation into the source repository: [pull request 2436](https://github.com/franklinbaldo/franklinbaldo.github.io/pull/2436).

The successful build reports six build jobs, including compiled modules `JurosMMT.Resende`, `JurosMMT.MMT`, `JurosMMT.Compatibility`, and the root library. The source workflow also rejects literal proof-gap tokens `sorry`, `admit`, or explicit `axiom` declarations in source files. This supplementary text scan is not a substitute for a kernel or dependency-axiom audit; the stronger observed fact is the actual successful Lean compilation of the stated declarations.

### 7.2 Theorem-to-source correspondence

| Paper result | Fully qualified Lean declaration | Evidence kind |
|---|---|---|
| Proposition 1 | `JurosMMT.MMT.interest_is_a_fiscal_flow` | Rearranged identity |
| Proposition 2 | `JurosMMT.MMT.lower_interest_reduces_net_injection` | Conditional inequality |
| Proposition 3 | `JurosMMT.MMT.nominal_settlement_does_not_ensure_real_capacity` | Explicit countermodel |
| Proposition 4 | `JurosMMT.MMT.same_rate_can_coexist_with_different_inflation` | Two explicit witnesses |
| Proposition 5 | `JurosMMT.MMT.fisher_growth_formula_is_not_forced` | Explicit countermodel |
| Proposition 6 | `JurosMMT.Resende.inflation_eq_rate_minus_growth` | Conditional identity |
| Proposition 7 | `JurosMMT.Resende.rate_cut_lowers_long_run_inflation` | Conditional order |
| Proposition 8 | `JurosMMT.Resende.lower_interest_lowers_closing_debt` | Rearranged stock-flow identity |
| Proposition 9 | `JurosMMT.Resende.indexed_coupon_pass_through` | Fixed-spread inequality |
| Theorem 10 | `JurosMMT.Compatibility.a_joint_model_exists` | Constructive joint witness |

### 7.3 Independent local reproduction

The following sequence retrieves the **same** source revision and invokes Lean/Lake locally (with `elan` installed):

```sh
git clone https://github.com/franklinbaldo/franklinbaldo.github.io.git
cd franklinbaldo.github.io
git checkout 397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3
cd experiments/juros-mmt-lean4
lake build --wfail
```

For the reported receipt, `lake build --wfail` completed successfully on GitHub Actions under Lean 4.35.0. This manuscript **does not report a separate second independent execution** or a third-party audit.

### 7.4 Trust model and limitation of verification

The relevant trust base includes Lean's kernel, elaboration and underlying foundational logic, the imported Lean standard modules, and the correct correspondence between the human mathematical interpretation and the Lean code. A proof-producing tactic such as `omega` is not external empirical evidence. No proof in this project authenticates the correctness of the economic meaning assigned to a field name.

In particular, a type containing a field `ownCurrencySettlement : ∀ amount, canSettleOwnCurrency amount` does not prove the availability of a central-bank account, a particular legal authorization, sufficient collateral, or an economically innocuous settlement procedure.

## 8. Interpretation: implications and non-implications

### 8.1 From accounting identity to economic mechanism

An accounting identity can constrain simultaneous numerical descriptions. It cannot, by itself, determine a behavioral response. Proposition 2 gives the identity \(N'-N=J'-J\) under specified equalities; it does not imply a stable propensity to spend interest income, a response of bank lending, or a pricing relation. An empirically interpretable claim about inflation following a rate cut must supply, at minimum, a price-determination relation and behavioral channels.

This distinction prevents a common form of category error: “interest payments are part of nominal income flows” does not entail “higher rates always raise prices.” Neither does “higher rates can reduce private borrowing” entail a unique net inflation effect without describing the other channels and institutions.

### 8.2 From nominal settlement to a monetary regime

The assumed predicate \(S(n)\) represents the abstract capacity to settle. A serious institutional specification would distinguish an issuer from a user of money, treasury accounts from central-bank settlement liabilities, central-bank collateral rules, commercial-bank credit creation, taxes, statutory debt limits, exchange-rate commitments, and foreign-currency debt. Any of these distinctions might alter the class of admissible records.

The main contrast formally established by Proposition 3 is that nominal settlement **does not logically force** a resource-feasibility inequality. Whether a particular spending path exceeds productive capacity is a separate question.

### 8.3 Compatibility is not equivalence

Propositions 4–5 and Theorem 10 can be true simultaneously. The first two show that the minimal MMT-inspired signature does not determine an inflation law; the last shows that a supplemental law can be satisfied alongside that signature. Adding more assumptions **narrows** the admissible model class. It does not retrospectively make a law a consequence of the weaker class.

The same observation clarifies how economic traditions may share policy conclusions while differing in explanatory structure. A contrast of explanations is not necessarily an outright logical contradiction. The latter must be established through conflicting assumptions over a shared language or by proving the impossibility of a joint model.

## 9. Limits, alternative explanations, and reviewer challenges

The following table identifies obstacles to interpreting the formalization as a substantive macroeconomic model.

| Missing component | Consequence for the present result | Requirement for a stronger model |
|---|---|---|
| Sectoral balance sheets and transaction matrices | Equation (1) is a premise, not derived double-entry bookkeeping | Typed sectors and conservation/stock-flow theorems |
| Separation of treasury, central bank, and commercial banks | No institutional proof of nominal settlement | Explicit operations, account ownership, authorizations, and reserve accounting |
| Unit and sign invariants | Integer witnesses may be economically unrealistic; no dimension safety | Nonnegative money/flow types and dimensionally typed rates |
| Intertemporal stocks, maturity and compounding | One-period comparisons are not debt dynamics over time | Dated states, transition functions and contractual repricing |
| Endogenous money and bank lending | Bank credit and portfolio changes do not appear | Loan/deposit balance-sheet operations and clearing |
| Wage/price formation, output and expectations | Inflation fields are freely assigned; countermodels are immediate | Behavioral price equations with declared identification assumptions |
| External sector and exchange-rate arrangements | Schematic “monetary sovereignty” ignores import and FX constraints | Open-economy balance sheets and alternative currency regimes |
| Policy implementation and causal transitions | Cross-equilibrium inequalities do not identify policy effects | Intervention semantics, counterfactual assumptions and dynamic solutions |
| Full MMT and full fiscal-price-level theories | Joint witness is only for fragments | Explicit competing complete signatures and shared-language compatibility tests |
| Independent replication and peer assessment | One passing CI run is not external scientific validation | Reproduction of pinned revision and expert review of scope |

These are not incidental “future nice-to-haves.” They delimit exactly what counts as an admissible inference today.

### 9.1 A substantive objection to the present witness

A reviewer might reasonably object that the joint-model witness is too easy: `MonetaryEconomy` is missing many constraining equations, so almost any values for inflation, growth, and interest can be assigned.

**Response.** The objection is correct and limits the scientific importance of the existence result. The witness is a check against a **specific claim of immediate contradiction between the two implemented fragments**. It is not evidence of deep reconciliation. To obtain a substantively interesting compatibility theorem, the interface must first encode competing restrictions that can genuinely conflict.

### 9.2 A substantive objection to “formalizing MMT”

The label could be taken to imply a complete or faithful axiomatization of a macroeconomic research tradition.

**Response.** The code formalizes an intentionally small accounting-operational *fragment inspired by* MMT. It neither derives government finance from a monetary circuit nor defines inflation behavior. The distinction is repeated in the title's “minimal core” qualification, the definitions, the conclusions, and the evidence statement. A broader label would overstate the present accomplishment.

### 9.3 Why no empirically falsifiable inflation forecast follows

Since the model has no structural inflation law, it issues no parameterized prediction about prices following an interest-rate intervention. Its non-entailment claims are refutable by changing the **formal premises** (for example, adding a function determining inflation), not by observing one country with a particular inflation rate. Economic falsification becomes meaningful only after adding a dynamic model whose observables and predictions are specified in advance.

## 10. Research programme

Four steps would turn the proof-of-concept into a more discriminating programme.

First, construct double-entry transaction types over explicitly modeled sectors and prove that all operations preserve an appropriate aggregate accounting invariant. This replaces equation (1) as a declared field with a consequence of typed transactions.

Second, model treasury and central-bank settlement operations under alternative legal and currency regimes. Distinguish a formally possible nominal payment from one permitted by the institution's rules and available accounts. Test negative cases with restricted issuance or foreign-currency liabilities.

Third, specify alternative inflation mechanisms as separate modules with shared observable types, including demand-resource interactions, distributional interest payments, bank credit, FX pass-through, and a Fisher-based long-run hypothesis. Distinguish observational equivalence, counterfactual implications and changes in steady-state assumptions.

Fourth, establish a substantive compatibility criterion with explicit bridges between sectoral states and price variables. Seek either (a) a joint construction satisfying the **richer** premises or (b) a smallest unsatisfiable subset explaining a real inconsistency. Report both positive and negative outcomes with identical source and validation discipline.

This programme can produce economic insight only when its additional institutional and behavioral assumptions are themselves scrutinized against theory and evidence.

## 11. Conclusion

A small part of monetary discourse is straightforward to formalize: a fiscal-flow identity, a stipulated settlement property, a separate real-resource constraint, and elementary cross-record comparisons. Within this clearly circumscribed structure, Lean 4 verifies five core propositions, including two direct inflation non-entailment witnesses and a nominal-versus-real capacity countermodel. An independent Fisher-growth structure yields conditional long-run identities and ordering, while a constructive witness satisfies both selected signatures at once.

The central result is therefore **a verified statement of logical scope**, not a verified macroeconomic theory. The core accounting identity is assumed; the nominal settlement ability is stipulated; the real-resource constraint is independent; and the missing inflation mechanism makes non-identification immediate. The joint witness defeats only the claim that these *particular incomplete formal structures* are contradictory. It establishes no general compatibility between complete theoretical traditions and no causal justification for an interest-rate policy.

For a serious formal economics programme, that restraint is consequential. A theorem prover can enforce deductive honesty: each conclusion must be derived from named premises. The remaining scientific task is to build institutional and behavioral premises precise enough that their formal consequences also become economically informative.

---

## Appendix A. Exact proof obligations and witness values

The checked library exposes the following signatures or their definitional equivalents; complete source proofs are at the immutable links in Section 7.

**A.1 Accounting identity.** For `f : FiscalFlows`, derive
\[
f.netPrivateInjection-f.primarySpending+f.taxes=f.interestPayments.
\]

**A.2 Conditional comparison.** Given equal spending and taxes and `after.interestPayments ≤ before.interestPayments`, derive `after.netPrivateInjection ≤ before.netPrivateInjection`.

**A.3 Nominal/real countermodel.** Construct `sample 500 300 200 101 100`; all nominal amounts satisfy the stipulated settlement predicate, while `101 ≤ 100` fails.

**A.4 Non-unique inflation.** Construct `sample 500 300 200 90 100` and `sample 500 400 200 90 100`; nominal rates are definitionally equal and inflation values are not.

**A.5 Failure of an unassumed Fisher-growth law.** Construct `sample 500 300 100 90 100`; `300 ≠ 500 - 100`.

**A.6 Long-run identity.** From `nominalRate = realRate + inflation` and `realRate = growthRate`, derive `inflation = nominalRate - growthRate`.

**A.7 Equilibrium comparison.** Use the preceding identity twice with fixed growth and a strict nominal-rate order.

**A.8 Debt comparison.** From two instances of `debtClosing = debtOpening + interestCost - primarySurplus` with equal opening debt and primary surpluses, deduce the closing-debt ordering from the interest-cost ordering.

**A.9 Indexed coupon.** From `couponRate = policyRate + spread` and an invariant spread, transfer the nominal-rate order to coupons.

**A.10 Joint witness.** Take `LongRun` with \(i=550,r=250,\pi=300,g=250\), and `MonetaryEconomy.sample 550 300 250 90 100`. Their nominal-rate, inflation and growth fields coincide.

All integer facts are proved in Lean by `omega`, definitional reduction, or `decide`. The witness values are illustrations of logical satisfiability, **not** estimates for Brazil or another economy.

## Declarations, availability, and publication ethics

**Code availability.** All formal claims are linked to a fixed public Git commit in Section 7; no inaccessible proprietary code is needed for the reported compilation. The present `papers` repository contains this authored manuscript, not a second independent version of the executable Lean library.

**Data availability.** No human-subject, firm-level, financial, macroeconomic or proprietary dataset was used. The evidence is formal source code and a recorded CI build. No statistical inference is reported.

**Funding and competing interests.** These author-level declarations must be confirmed before public deposition or journal submission; none is inferred from the repository or the code.

**AI-assisted preparation.** An AI assistant helped prepare and structure this working manuscript from the verified source and literature. This assistance does not confer authorship, peer review, independent validation or responsibility for final submission. The named author should verify the finished draft and declarations before external dissemination.

**Research ethics.** No human or animal experimentation is involved. No institutional-review-board approval is claimed or needed for the reported formal exercise.

**Publication status.** Working paper, version 0.1.0, not peer reviewed; no DOI, journal acceptance, or external replication is asserted. The paper is prepared for review and potential Zenodo preprint deposit, not automatically deposited by a Git merge.

## Companion documents

- [MMT formal source, pinned revision](https://github.com/franklinbaldo/franklinbaldo.github.io/tree/397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3/experiments/juros-mmt-lean4) — executable three-module Lean 4 proof library; original scientific source, not an independent replication.
- [MMT–Resende explanatory blog article](https://franklinbaldo.github.io/blog/lara-resende-mmt-lean4-compatibilidade/) — a non-peer-reviewed Portuguese exposition of the same formalization; not corroborating evidence.
- [Formal-MMT-core research front](../research/fronts/formal-mmt-core.md) — a typed OKF research record documenting this question, provenance and unfinished extensions.
- [Claim tracking issue 2377](https://github.com/franklinbaldo/papers/issues/2377) and [claim tracking issue 2378](https://github.com/franklinbaldo/papers/issues/2378) — review/closure ledgers, not sources of mathematical evidence.

## References

[1] Tymoigne, É., and Wray, L. R. (2013). **Modern Money Theory 101: A Reply to Critics.** Levy Economics Institute Working Paper No. 778. [Publisher record](https://www.levyinstitute.org/publications/modern-money-theory-101/). [Working paper PDF](https://www.levyinstitute.org/pubs/wp_778.pdf). [SSRN DOI](https://doi.org/10.2139/ssrn.2348704).

[2] Wray, L. R. (2024). **Modern Money Theory: A Primer on Macroeconomics for Sovereign Monetary Systems**, 3rd ed. Palgrave Macmillan. [https://doi.org/10.1007/978-3-031-47884-0](https://doi.org/10.1007/978-3-031-47884-0).

[3] de Moura, L., and Ullrich, S. (2021). **The Lean 4 Theorem Prover and Programming Language.** In *Automated Deduction—CADE 28*, Lecture Notes in Computer Science 12699, pp. 625–635. Springer. [https://doi.org/10.1007/978-3-030-79876-5_37](https://doi.org/10.1007/978-3-030-79876-5_37).

[4] Lara Resende, A. (2026). **Eu Acuso: uma proposta para eliminar os juros absurdos.** Author's essay, 25 September 2026. [Original publication](https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar).

[5] Godley, W., and Lavoie, M. (2007). **Monetary Economics: An Integrated Approach to Credit, Money, Income, Production and Wealth.** Palgrave Macmillan. [https://doi.org/10.1057/9780230626546](https://doi.org/10.1057/9780230626546).

[6] Cochrane, J. H. (2023). **The Fiscal Theory of the Price Level.** Princeton University Press. [Publisher record](https://press.princeton.edu/books/hardcover/9780691242248/the-fiscal-theory-of-the-price-level).

[7] Baldo, F. S. (2026). **JurosMMT: A partial Lean 4 formalization of MMT and Fisher-growth assumptions.** Version pinned by Git commit `397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3`, Lean 4.35.0. [Source and build instructions](https://github.com/franklinbaldo/franklinbaldo.github.io/tree/397bddbcbdbb91b0ce1ceefc0d70b5a8d3ff0cd3/experiments/juros-mmt-lean4). [Successful CI receipt](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/42424702535).
