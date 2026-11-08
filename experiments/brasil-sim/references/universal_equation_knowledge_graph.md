---
type: Paper
title: "Universal Equation Knowledge Graph: Typed Scientific Transfer, Faceted Equivalence, and Proof-Carrying Reuse"
description: "A compiler architecture for typed, conditional, fail-closed transfer of mathematical structure across independently sourced scientific models, combining a graded certification ladder with independently evidenced transfer facets, explicit obstructions, Semantic IR, and proof-carrying reuse."
tags: [equation-graph, typed-scientific-transfer, transfer-obstructions, proof-carrying-reuse, scientific-computing, openmath, semantic-ir, formal-verification, lean4, dimensional-analysis, scientific-equation-atlas, theory-reduction]
timestamp: 2026-09-29T14:08:00-04:00
publication:
  status: draft
genre: technical
legacy_type: Technical Paper
---

# Universal Equation Knowledge Graph: Typed Scientific Transfer, Faceted Equivalence, and Proof-Carrying Reuse

> **Research Front:** `universal-equation-knowledge-graph`  
> **Central Research Question:** *Can certified cross-domain mathematical structure discovery recover known scientific analogies and surface previously undocumented transferable results at useful precision under blind evaluation?*  
> **Lineage Parents:** `function-preserving-reencoding`, `relational-reconstruction-sufficiency`, `typed-semantic-promotion-formalization`  
> **Formal Contracts:** `formalizations/research_contracts/UniversalEquationGraph.lean` and `formalizations/research_contracts/EquationTransferCertificates.lean` (Lean 4.34.0 verified, 14/14 targets under `lake build`)  
> **Empirical Artifacts:** `experiments/universal_equation_graph/killer_test_v2.py`, `FINDINGS-KILLER-TEST-V2-2026-09-24.md`, `results/killer_test_v2_2026-09-24.md`  
> **Evidential Boundary:** The core mathematical contracts, graded ladder, Bourbaki-filter reductions, Killer Test v2 benchmark (378 candidate pairs across 28 models), Killer Test v3 large-scale ledger/audit, Killer Test v4 frontier compiler, and the currently merged Tier 5 obstruction nodes are repository-backed evidence. The manuscript distinguishes those implemented results from the broader typed-transfer architecture: finer-grained facets and bridge theorems are claims to formalize and test, not facts inferred from similarity alone.

---

## Abstract

Scientific models frequently reuse the same mathematical structures while assigning them different physical roles, admissibility conditions, boundary regimes, annotations, and transferable invariants. This makes scientific reuse fundamentally different from similarity search: agreement in one aspect of a model does not license transport of every property attached to it. A sound system must represent both **what transfers** and **what explicitly does not**.

We present the **Universal Equation Knowledge Graph (UEKG)** as a typed, fail-closed compiler and linker for scientific transfer. The existing graded ladder—syntactic isomorphism, algebraic equivalence, dimensional admissibility, semantic/model isomorphism, and proof-carrying solution transfer—provides a depth-of-certification axis. We complement that ladder with a **faceted transfer contract**: structure, dimensions, domains, regimes, operators, boundary conditions, invariants, provenance, and other scientific properties are independently evidenced. A transfer is permitted only for the facets supported by evidence or a bridge theorem; missing or conflicting evidence yields `UNKNOWN` or an explicit **transfer obstruction**, never an implicit upgrade to stronger equivalence.

The empirical program supports this architecture at several scales. Killer Test v2 evaluates 378 pairs across 28 models, reaches precision 1.000 at the semantic rung on its registered benchmark, compiles 11 structural Lean certificates, and hardens five pairs with substantive theorems. Killer Test v3 scales to 1,002 source blocks and a sealed 125,076-pair ledger with posterior literature audit. Killer Test v4 compresses 501,501 combinatorial pairs to a 48-link research frontier while retaining all four hidden canonical positives in its registered recall set (RCR 10,447.9×; Frontier Recall 100%). Tier 5 then turns negative transfer into durable knowledge: same operator structure may fail to determine impedance, a constitutive capacitor law may fail to imply autonomous decay without closure, and a shared parabolic operator may fail to license transfer of absent nonlinear or domain-specific effects.

The resulting object is not a graph of equations declared globally equivalent. It is a graph of **typed, conditional, auditable scientific transformations** whose positive facets, obstructions, provenance, and proof obligations remain explicit. The individual ingredients—dimensional analysis, formal verification, mathematical analogy, semantic metadata, and dependency-aware compilation—have substantial prior art. The potentially novel contribution is therefore calibrated as a synthesis and compiler architecture: combining them into a fail-closed, proof-carrying transfer system with first-class transportability boundaries and a reproducible research-frontier workflow.

---

## 1. Introduction: From Static Text to an Inter-Disciplinary Mathematical Linker

A ubiquitous phenomenon in the history of science is the independent rediscovery and parallel development of identical mathematical structures across isolated disciplines:
- The **damped harmonic oscillator** ($m \ddot{x} + \gamma \dot{x} + k x = 0$) in classical mechanics, the **series RLC circuit** ($L \ddot{q} + R \dot{q} + \frac{1}{C} q = 0$) in electrical engineering, and the **viscous U-tube manometer** ($\rho L \ddot{z} + \frac{8\mu L}{r^2} \dot{z} + 2\rho g z = 0$) in fluid dynamics;
- **Michaelis-Menten enzyme kinetics** ($v = \frac{V_{\max} S}{K_m + S}$) in biochemistry, the **Langmuir adsorption isotherm** ($\theta = \frac{K P}{1 + K P}$) in surface chemistry, and the **Holling Type II functional response** ($N_e = \frac{a T N}{1 + a T_h N}$) in behavioral ecology;
- **Radioactive decay** ($\frac{dN}{dt} = -\lambda N$) in nuclear physics, **RC capacitor discharge** ($\frac{dV}{dt} = -\frac{1}{RC} V$) in electronics, **Beer-Lambert optical absorption** ($\frac{dI}{dz} = -\kappa I$) in optics, and **Newton's law of cooling** ($\frac{dT}{dt} = -k(T - T_{\text{env}})$) in thermodynamics;
- **Fourier heat conduction** ($\frac{\partial u}{\partial \tau} = \alpha \frac{\partial^2 u}{\partial x^2}$) in thermodynamics and the **Black-Scholes equation** for contingent claim pricing in financial economics (under coordinate and gauge transformations);
- **Lotka-Volterra predator-prey dynamics** in population ecology and **Goodwin business cycle models** in macroeconomic growth theory.

When these equations are locked inside static PDF documents, disparate textbooks, or isolated ontology databases, the deep mathematical insights discovered in one domain cannot be discovered, referenced, or reused by another. An analytical closed-form solution, a Lyapunov stability certificate, a bifurcating limit cycle, a dimensional scaling law, or a boundary-layer perturbation expansion derived at great effort in fluid mechanics remains entirely invisible to an electrical engineer or an ecologist working on the isomorphic system.

### 1.1 The Fallacy of the Flat Equivalence Relation

Previous attempts to build computational mathematical graphs or knowledge bases have typically treated cross-domain equivalence as a flat, binary relation (e.g., `:isomorphic-to`, `owl:sameAs`, or unconstrained graph edge weights). This naive approach is an **epistemic hazard**:

> [!WARNING]
> Superficial algebraic identity does not imply physical or scientific equivalence. Confining mathematical relationships to a flat binary relation causes catastrophic category errors, collapsing non-equilibrium dissipative processes into equilibrium thermodynamics, conflating spatial attenuation with temporal decay, and ignoring singular perturbation boundaries.

Consider the deceptively similar rational form:
$$f(z) = \frac{c_1 z}{c_2 + z}$$
A purely syntactic or algebraic matcher declares Michaelis-Menten enzyme kinetics and the Langmuir adsorption isotherm to be "isomorphic." Yet their physical foundations diverge fundamentally:
1. **Thermodynamic Regime:** Langmuir adsorption models a *passive, closed thermodynamic equilibrium* on a static lattice of adsorption sites ($A + S \rightleftharpoons AS$), governed by the minimization of Helmholtz free energy. Michaelis-Menten kinetics models an *open, dissipative steady state* sustained by continuous catalytic turnover ($E + S \rightleftharpoons ES \to E + P$), requiring external free-energy dissipation.
2. **Parameter Interpretations & Constraints:** In Langmuir, $K$ is an equilibrium association constant $[P^{-1}]$, and fractional coverage $\theta$ is strictly bounded in $[0, 1]$. In Michaelis-Menten, $V_{\max}$ is a kinetic turnover rate $[M T^{-1}]$, $K_m = \frac{k_{-1} + k_2}{k_1}$ is a composite kinetic parameter that does not equal the thermodynamic dissociation constant $K_d$ unless $k_2 \ll k_{-1}$, and reaction velocity $v \in [0, V_{\max}]$ has physical flux units.
3. **Causal Directionality:** A perturbation in substrate concentration $S$ induces product flux through irreversible catalytic turnover; a perturbation in gas pressure $P$ alters surface occupancy without irreversible material transformation.

Transporting a stability theorem or fluctuation-dissipation theorem derived for the equilibrium Langmuir system directly into Michaelis-Menten kinetics without verifying the underlying thermodynamic regime produces invalid biological conclusions.

### 1.2 The Vision: A Compiler and Linker for Inter-Disciplinary Mathematics

To resolve this crisis, we propose reconceiving the relationship between scientific disciplines in analogy to modern software compilation:

```mermaid
flowchart LR
    subgraph DisciplinarySource["Disciplinary Source Models"]
        M1["Classical Mechanics<br/>(Damped Oscillator)"]
        M2["Electromagnetism<br/>(Series RLC)"]
        M3["Fluid Dynamics<br/>(Viscous Manometer)"]
    end

    subgraph CompilerFrontend["Compiler Frontend"]
        P["Parser & Canonicalizer<br/>(OpenMath Dictionaries)"]
        SIR["Semantic IR<br/>(Operators, Dimensions, Domains)"]
    end

    subgraph TypeSystem["Graded Type System"]
        L1["R1: Syntactic AST Shape"]
        L2["R2: Algebraic Quotient"]
        L3["R3: Buckingham Pi Homomorphism"]
        L4["R4: Semantic Domain & Regime"]
    end

    subgraph LinkerOracle["Formal Linker & Oracle"]
        L5["R5: Solution-Transfer-Certified<br/>(Lean 4 Proof Synthesis)"]
        Asymp["Asymptotic Reduction<br/>(Bourbaki Filter.Tendsto)"]
    end

    M1 --> P
    M2 --> P
    M3 --> P
    P --> SIR
    SIR --> L1 --> L2 --> L3 --> L4 --> L5
    L4 --> Asymp
```

In this framework:
- **Disciplinary Equations** are the source code written in historical domain dialects (Newtonian, chemical, economic).
- **The Semantic IR** is the target-independent intermediate representation, explicitly encoding algebraic operators, dimensional types, state space manifolds, and thermodynamic/causal auxiliary constraints.
- **The Graded Certification Ladder** is the type-checking and semantic analysis pipeline, testing candidate relations at increasing depths of evidence without implying that every certified property transfers.
- **The Formal Linker (Lean 4)** emits constructive, machine-checked proof certificates (`SolutionTransferCertificate`) that verify whether a mathematical invariant (a closed-form solution, a Lyapunov function, or an asymptotic limit) soundly transplants from the source model into the target model.
- **Asymptotic Theory Reductions** act as optimizing compiler passes, formally relating complex multi-parameter models to their reduced boundary-layer limits via topological filter convergence.


### 1.3 Contributions

This paper consolidates five contributions, while keeping implementation status explicit.

1. **Typed scientific transfer rather than flat equivalence.** The five-stage ladder remains the certification-depth backbone, but transfer is represented as a bundle of independently evidenced facets. Passing a dimensional check, for example, is evidence about dimensional admissibility—not an automatic claim about causal role, boundary conditions, stability, or theorem reuse.
2. **Transfer obstructions as first-class graph objects.** Negative transfer is preserved as durable knowledge: the strongest surviving relation, the blocked property, a counterexample or missing structure, and the assumptions that would repair the transfer.
3. **Fail-closed compilation.** Deterministic gates and Tier 5 review use `PASS | FAIL | UNKNOWN`; missing metadata is debt, not evidence of equivalence or incompatibility. Proof reuse is allowed only when the required facets are certified.
4. **Proof-carrying cross-model reuse.** Lean contracts encode algebraic/environment equivalence, dimensional admissibility, semantic model isomorphism, asymptotic reduction, and concrete transferred invariants. The theorem prover is the expensive linker, not the candidate generator.
5. **Research-frontier compilation.** Large candidate spaces are compressed into a bounded, auditable frontier whose claims are subjected to adversarial review and posterior literature audit rather than being promoted directly from heuristic similarity.

The current repository is strongest on algebraic, dimensional, domain/regime, operator, invariant, and obstruction evidence. More granular facets—such as source-local variable role, annotation identity, dependency slices, and richer causal semantics—are best treated as an explicit research program until their own regressions and proof obligations land on the canonical lineage.

### 1.4 Claim boundary

The central claim is not that every useful scientific relation forms a global equivalence relation. It is the narrower claim that scientific transfer can be compiled as a set of **typed obligations**. Some facets compose transitively; some require additional structure; some are directional; and some are blocked by counterexamples. UEKG therefore separates:

- **similarity evidence**, which generates candidates;
- **facet evidence**, which licenses specific reuse;
- **bridge theorems**, which justify movement from one facet to another;
- **transfer obstructions**, which record non-implications;
- **proof certificates**, which authorize high-cost theorem or solution transport.


---

## 2. The Language-Independent Semantic Intermediate Representation (Semantic IR)

Rather than binding the mathematical knowledge graph to a single programming language or proof assistant runtime, the **Semantic IR** serves as the universal, language-independent foundation.

### 2.1 Principles of the Semantic IR

Drawing upon the OpenMath standard (specifically Content Dictionaries for algebra, calculus, and physical quantities) and homoiconic S-expressions, the Semantic IR enforces five foundational invariants:
1. **Operator Canonicalization:** Syntactic dialect variations (e.g., Leibniz $\frac{d^2 x}{dt^2}$, Newton $\ddot{x}$, Euler $D_t^2 x$) are deterministically mapped to standard canonical operators (`diff`, `partial_diff`, `integral`, `laplacian`, `divergence`, `curl`).
2. **Commutative Lexicographic Ordering:** Commutative operators ($+, \times, \wedge, \vee$) are sorted lexicographically by operator and operand hash, ensuring that expression trees are permutation-invariant ($a + b = c \equiv b + a = c$).
3. **Explicit Variable & Parameter Bipartition:** Symbols are strictly partitioned into independent variables (coordinates $t, x$), dependent state variables ($x(t), q(t)$), constitutive parameters ($m, \gamma, k, R, L, C$), and universal physical constants ($c, \hbar, k_B, G$).
4. **Physical Dimension Vectors in $\mathbb{Q}^7$:** Every variable and parameter is assigned a 7-dimensional rational vector representing its grading over the SI base dimensions:
   $$\mathbf{d} = [d_M, d_L, d_T, d_I, d_\Theta, d_N, d_J] \in \mathbb{Q}^7$$
   corresponding to Mass ($M$), Length ($L$), Time ($T$), Electric Current ($I$), Thermodynamic Temperature ($\Theta$), Amount of Substance ($N$), and Luminous Intensity ($J$).
5. **Physical Domains and Auxiliary Constraints:** Every equation declares its state space manifold $\mathcal{S} \subseteq \mathbb{R}^n$, parameter admissibility domains (e.g., $m > 0$, $T > 0$), and qualitative auxiliary constraints (e.g., `thermodynamic_equilibrium`, `dissipative_open_system`, `conservative_hamiltonian`, `monolayer_coverage`).

### 2.2 Formal JSON/EDN Schema

The canonical schema of the Semantic IR is defined as follows:

```json
{
  "$schema": "https://scientific-equation-atlas.org/schemas/semantic-ir-v1.json",
  "ir_version": "1.0",
  "id": "biochem:michaelis-menten",
  "domain": "biochemistry/enzymology",
  "source_provenance": "Scientific Equation Atlas / Cornish-Bowden (2012)",
  "state_variables": {
    "v": {
      "role": "reaction_rate",
      "dimension": [1, -3, -1, 0, 0, 0, 0],
      "domain": "[0, V_max)"
    }
  },
  "independent_variables": {
    "S": {
      "role": "substrate_concentration",
      "dimension": [1, -3, 0, 0, 0, 0, 0],
      "domain": "[0, inf)"
    }
  },
  "parameters": {
    "V_max": {
      "role": "maximum_velocity",
      "dimension": [1, -3, -1, 0, 0, 0, 0],
      "domain": "(0, inf)"
    },
    "K_m": {
      "role": "michaelis_constant",
      "dimension": [1, -3, 0, 0, 0, 0, 0],
      "domain": "(0, inf)"
    }
  },
  "expression": {
    "op": "eq",
    "lhs": "v",
    "rhs": {
      "op": "div",
      "args": [
        {"op": "mul", "args": ["V_max", "S"]},
        {"op": "add", "args": ["K_m", "S"]}
      ]
    }
  },
  "auxiliary_constraints": [
    "quasi_steady_state_approximation",
    "excess_substrate",
    "dissipative_open_system",
    "irreversible_catalytic_turnover"
  ],
  "known_invariants": {
    "half_saturation": {
      "condition": "S = K_m",
      "value": "v = V_max / 2"
    },
    "lineweaver_burk_linearization": "1/v = (K_m / V_max) * (1/S) + (1 / V_max)"
  }
}
```

### 2.3 Decoupled Polyglot Architecture

By placing the Semantic IR at the center, language environments become interchangeable backend peers rather than a rigid serial pipeline:

```mermaid
flowchart TD
    SIR["Canonical Semantic IR<br/>(JSON / EDN / S-Expressions)"]

    Clojure["Clojure Backend<br/>• Homoiconic S-Expression Pattern Rewriting<br/>• Fast In-Memory Graph Indexing (Asami/DataScript)<br/>• Combinatorial Candidate Pair Generation"]
    Python["Python / Julia Backend<br/>• Parquet Lake Ingestion (Scientific Equation Atlas)<br/>• SymPy / SymbolicUtils Gröbner Basis Rewriting<br/>• SciPy Numerical Sanity Checks"]
    Haskell["Haskell Backend<br/>• Megaparsec Combinator Parsing<br/>• Type-Level Static Dimensional Checking"]
    Lean["Lean 4 Backend<br/>• Formal Verification Oracle<br/>• Dimensionally Admissible Homomorphism Proofs<br/>• Constructive SolutionTransferCertificate Synthesis"]

    SIR <--> Clojure
    SIR <--> Python
    SIR <--> Haskell
    SIR <--> Lean
```

This decoupled design ensures that any scientific team can implement parsers or verifiers in their toolchain of choice while preserving complete cross-system interoperability.

---

## 3. Certification Depth: The 5-Stage Graded Ladder

To prevent false analogies while maximizing structural discovery, the Universal Equation Knowledge Graph structures model comparisons along an explicit **5-stage graded verification ladder**.

```mermaid
flowchart TD
    R1["Rung 1: Syntactic Isomorphism<br/>• Identical unlabelled expression DAG topology<br/>• Complexity: O(|V| + |E|)"]
    R2["Rung 2: Algebraic Equivalence<br/>• Commutative ring equality modulo variable renaming σ<br/>• Gröbner basis / polynomial reduction"]
    R3["Rung 3: Dimensionally Admissible Mapping<br/>• Group homomorphism δ: Dim₁ → Dim₂<br/>• Buckingham Pi dimensionless invariance: δ(1) = 1"]
    R4["Rung 4: Semantic / Model Isomorphism<br/>• Preserves state space manifolds S₁ → S₂<br/>• Validates parameter bounds & auxiliary constraints<br/>• Matches thermodynamic & causal regimes"]
    R5["Rung 5: Solution-Transfer-Certified<br/>• Machine-checked Lean 4 proof of transplanted invariant<br/>• Exact evaluation commutation: eq₂(sol₂) = target"]

    R1 -->|"Variable Permutation & Rewriting"| R2
    R2 -->|"Dimensional Group Homomorphism"| R3
    R3 -->|"Domain & Regime Verification"| R4
    R4 -->|"Constructive Proof Synthesis"| R5
```

### 3.1 Rung 1: Syntactic Isomorphism
Two equations $E_1$ and $E_2$ are syntactically isomorphic ($E_1 \simeq_{\text{syn}} E_2$) if their unlabelled expression DAGs are graph-isomorphic:
$$\operatorname{TreeShape}(E_1) \cong \operatorname{TreeShape}(E_2)$$
This is a purely structural, graph-theoretic match that disregards symbol semantics, units, and algebraic identities (e.g., $a + b$ vs $b + a$).

### 3.2 Rung 2: Algebraic Equivalence
Two equations are algebraically equivalent ($E_1 \equiv_{\text{alg}} E_2$) if there exists a bijective variable substitution:
$$\sigma : \operatorname{Vars}(E_1) \xrightarrow{\sim} \operatorname{Vars}(E_2)$$
such that evaluating $E_2$ over $\sigma(\mathbf{x})$ is extensionally identical to evaluating $E_1$ over $\mathbf{x}$ in a common algebraic field:
$$\forall \mathbf{x} \in \mathbb{R}^n, \quad \operatorname{eval}_2(E_2, \sigma(\mathbf{x})) = \operatorname{eval}_1(E_1, \mathbf{x})$$
Equivalence at Rung 2 is computed via symbolic canonicalization, associative-commutative (AC) term rewriting, and Gröbner basis polynomial reduction.

### 3.3 Rung 3: Dimensionally Admissible Mapping
Two equations admit a dimensionally admissible mapping ($E_1 \sim_{\text{dim}} E_2$) if the algebraic bijection $\sigma$ is accompanied by a **group homomorphism** between their physical dimension systems:
$$\delta : \mathcal{D}_1 \longrightarrow \mathcal{D}_2$$
such that the dimensional typing commutes for every variable and parameter coordinate:
$$\forall x \in \operatorname{Vars}(E_1), \quad \operatorname{dim}_2(\sigma(x)) = \delta(\operatorname{dim}_1(x))$$

> [!IMPORTANT]
> **Buckingham $\Pi$ Invariance:** By definition of a group homomorphism, $\delta$ strictly preserves the group identity:
> $$\delta(\mathbf{1}_{\mathcal{D}_1}) = \mathbf{1}_{\mathcal{D}_2}$$
> Consequently, all dimensionless groups ($\Pi_1, \ldots, \Pi_k$) formed in Model 1 map to valid, identically dimensionless numbers in Model 2. A mapping that attempts to equate spatial attenuation $[L^{-1}]$ with temporal decay $[T^{-1}]$ without introducing a dimensioned characteristic speed scale fails Rung 3.

### 3.4 Rung 4: Semantic / Model Isomorphism
Two models are semantically isomorphic ($E_1 \cong_{\text{sem}} E_2$) if they satisfy Rungs 1–3 and the mapping preserves:
1. **Admissibility Domains:** The image of the physical domain of Model 1 is contained in the domain of Model 2:
   $$\mathbf{x} \in \mathcal{S}_1 \implies \sigma(\mathbf{x}) \in \mathcal{S}_2$$
2. **Sign Restrictions & Parameter Bounds:** Positivity and strict monotonicity conditions are preserved (e.g., $m > 0 \iff L > 0$).
3. **Thermodynamic & Causal Regimes:** The systems share identical physical foundations (e.g., conservative vs dissipative, equilibrium vs non-equilibrium steady state, reversible vs irreversible).

*Example Failure Mode:* Michaelis-Menten kinetics and the Langmuir adsorption isotherm pass Rungs 1, 2, and 3, but **fail Rung 4** because Langmuir requires thermodynamic equilibrium on a fixed lattice ($\sum \theta_i \le 1$), while Michaelis-Menten describes open dissipative catalytic flux.

### 3.5 Rung 5: Solution-Transfer-Certified
Two models achieve certified solution transfer ($E_1 \Longrightarrow_{\text{cert}} E_2$) if there exists a constructive, machine-checked proof (formalized in Lean 4) guaranteeing that a non-trivial mathematical invariant $\mathcal{I}_1$ (e.g., an equilibrium solution, an underdamped frequency formula, a Lyapunov stability certificate, or a perturbation expansion) holds unconditionally when mapped into Model 2:
$$\mathcal{I}_1(\operatorname{Model}_1) \vdash_{\text{Lean 4}} \mathcal{I}_2(\operatorname{Model}_2)$$


### 3.6 Faceted transfer: the ladder is depth, facets are scope

The graded ladder answers **how strongly** a relation has been certified. It does not, by itself, state **which scientific properties** are authorized to move. We therefore distinguish certification depth from transfer scope.

Let \(\mathcal{F}\) be a set of transfer facets, for example:

\[
\mathcal{F} =
\{\text{syntax},\text{algebra},\text{dimensions},\text{domain},
\text{regime},\text{operator},\text{boundary},\text{invariant},
\text{provenance}\}.
\]

For models \(A\) and \(B\), define an evidence predicate \(E_f(A,B)\) for each facet \(f\in\mathcal{F}\). The **transfer bundle** is

\[
\operatorname{TB}(A,B)=\{f\in\mathcal{F}\mid E_f(A,B)\}.
\]

A transferable object \(x\) carries a requirement set \(\operatorname{Req}(x)\subseteq\mathcal{F}\). Reuse is admissible only when

\[
\operatorname{Req}(x)\subseteq\operatorname{TB}(A,B)
\]

and no registered obstruction invalidates the required bridge.

This yields an intentionally conservative rule:

> **No cross-facet strengthening without evidence.**  
> From \(E_f(A,B)\), UEKG does not infer \(E_g(A,B)\) for \(g\neq f\) unless a separately justified bridge theorem or source-attested rule supports that implication.

A **transfer obstruction** is represented conceptually as

\[
O=(R_{\text{survives}}, C_{\text{blocked}}, W, A_{\text{repair}})
\]

where \(R_{\text{survives}}\) is the strongest relation that still holds, \(C_{\text{blocked}}\) is the tempting stronger claim that fails, \(W\) is the counterexample or missing structure, and \(A_{\text{repair}}\) is the additional assumption set known to restore the transfer, when such a set is known.

This formulation explains why the ladder and the facet system are complementary rather than competing abstractions. A relation may be certified deeply for one object while remaining deliberately unknown for another. Conversely, an obstruction can preserve substantial reusable structure without collapsing the pair into a binary `FAIL`.


---

## 4. Formal Verification in Lean 4

The entire mathematical foundation of the 5-stage ladder is formally verified in `formalizations/research_contracts/UniversalEquationGraph.lean`. The file compiles cleanly under `lake build` (13/13 targets verified) using only the standalone `ResearchPrelude.lean` core, incurring zero heavy external dependencies.

### 4.1 Algebraic Equivalence as a Category
In `UniversalEquationGraph.lean`, algebraic equivalence is proven to form a strict equivalence relation (and category):

```lean
structure AlgebraicEquivalence {α β : Type*} {Env : Type*} {Val : Type*}
    (eq₁ : Equation α Env Val) (eq₂ : Equation β Env Val)
    (e₁ : α) (e₂ : β) where
  envMap : Env ≃ Env
  eval_commute : ∀ env : Env, eq₂.eval e₂ (envMap env) = eq₁.eval e₁ env

def alg_refl (eq : Equation α E Val) (e : α) : AlgebraicEquivalence eq eq e e
def alg_symm (iso : AlgebraicEquivalence eq₁ eq₂ e₁ e₂) : AlgebraicEquivalence eq₂ eq₁ e₂ e₁
def alg_trans (iso₁₂ : AlgebraicEquivalence eq₁ eq₂ e₁ e₂) (iso₂₃ : AlgebraicEquivalence eq₂ eq₃ e₂ e₃) :
    AlgebraicEquivalence eq₁ eq₃ e₁ e₃
```

### 4.2 Group-Theoretic Dimension Systems
Physical dimensions are formalized as an abstract abelian group $(\text{Dim}, \cdot, 1, (\cdot)^{-1})$. Dimensional homomorphisms and admissible mappings are proven to compose transitively and preserve dimensionless invariants:

```lean
structure DimensionSystem (Dim : Type*) where
  mul : Dim → Dim → Dim
  one : Dim
  inv : Dim → Dim
  mul_assoc : ∀ a b c, mul (mul a b) c = mul a (mul b c)
  one_mul : ∀ a, mul one a = a
  mul_one : ∀ a, mul a one = a
  mul_left_inv : ∀ a, mul (inv a) a = one

structure DimensionallyAdmissibleMapping
    (ds₁ : DimensionSystem Dim₁) (ds₂ : DimensionSystem Dim₂)
    (dt₁ : DimensionalTyping E₁ Dim₁) (dt₂ : DimensionalTyping E₂ Dim₂)
    (envMap : E₁ → E₂) where
  dimHom : DimensionHom ds₁ ds₂
  dim_commute : ∀ e : E₁, dt₂.dimOf (envMap e) = dimHom.toFun (dt₁.dimOf e)

theorem admissible_preserves_dimensionless
    (adm : DimensionallyAdmissibleMapping ds₁ ds₂ dt₁ dt₂ envMap)
    (e : E₁) (hunit : dt₁.dimOf e = ds₁.one) :
    dt₂.dimOf (envMap e) = ds₂.one := by
  rw [adm.dim_commute e, hunit, adm.dimHom.map_one]

def admissible_comp
    (adm_f : DimensionallyAdmissibleMapping ds₁ ds₂ dt₁ dt₂ f)
    (adm_g : DimensionallyAdmissibleMapping ds₂ ds₃ dt₂ dt₃ g) :
    DimensionallyAdmissibleMapping ds₁ ds₃ dt₁ dt₃ (g ∘ f)
```

### 4.3 Semantic Model Isomorphism and Solution Transfer
A semantic model isomorphism restricts evaluation to the declared physical domain and enforces dimensional admissibility:

```lean
structure SemanticModelIsomorphism
    (eq₁ : Equation α E₁ Val) (eq₂ : Equation β E₂ Val)
    (ds₁ : DimensionSystem Dim₁) (ds₂ : DimensionSystem Dim₂)
    (dt₁ : DimensionalTyping E₁ Dim₁) (dt₂ : DimensionalTyping E₂ Dim₂)
    (domain₁ : Set E₁) (domain₂ : Set E₂)
    (e₁ : α) (e₂ : β) where
  envMap : E₁ ≃ E₂
  preserves_domain : ∀ x ∈ domain₁, envMap x ∈ domain₂
  eval_commute_on_domain : ∀ x ∈ domain₁, eq₂.eval e₂ (envMap x) = eq₁.eval e₁ x
  admissible_dim : DimensionallyAdmissibleMapping ds₁ ds₂ dt₁ dt₂ envMap.toFun
```

The constructive certificate `SolutionTransferCertificate` guarantees that any root, equilibrium point, or characteristic value in Model 1 evaluates to the exact target in Model 2 while remaining within the admissible physical domain and satisfying dimensional grading:

```lean
structure SolutionTransferCertificate
    (eq₁ : Equation α E₁ Val) (eq₂ : Equation β E₂ Val)
    (domain₁ : Set E₁) (domain₂ : Set E₂)
    (e₁ : α) (e₂ : β)
    (iso : SemanticModelIsomorphism eq₁ eq₂ ds₁ ds₂ dt₁ dt₂ domain₁ domain₂ e₁ e₂)
    (target : Val) (sol₁ : E₁) where
  hsol_domain : sol₁ ∈ domain₁
  hsol_eval : eq₁.eval e₁ sol₁ = target

def SolutionTransferCertificate.sol₂ (cert : SolutionTransferCertificate ...) : E₂ :=
  iso.envMap sol₁

theorem SolutionTransferCertificate.domain_certified (cert : SolutionTransferCertificate ...) :
    cert.sol₂ ∈ domain₂ :=
  iso.preserves_domain sol₁ cert.hsol_domain

theorem SolutionTransferCertificate.eval_certified (cert : SolutionTransferCertificate ...) :
    eq₂.eval e₂ cert.sol₂ = target := by
  have hcomm := iso.eval_commute_on_domain sol₁ cert.hsol_domain
  dsimp [sol₂]
  rw [hcomm, cert.hsol_eval]

theorem SolutionTransferCertificate.dim_certified (cert : SolutionTransferCertificate ...) :
    dt₂.dimOf cert.sol₂ = iso.admissible_dim.dimHom.toFun (dt₁.dimOf sol₁) := by
  dsimp [sol₂]
  exact iso.admissible_dim.dim_commute sol₁
```

### 4.4 Genuine Asymptotic Theory Reduction via Topological Filters (`Filter.Tendsto`)

A major limitation of naive asymptotic specifications is demanding exact point equality in a parameter limit. In real physics, model reductions are true topological limits:
- **Van der Waals $\longrightarrow$ Ideal Gas:**
  $$\left(P + \frac{a}{V_m^2}\right)(V_m - b) = R T \quad \xrightarrow[a, b \to 0]{} \quad P V_m = R T$$
- **Relativistic Energy $\longrightarrow$ Newtonian Kinetic Energy:**
  $$E = \frac{m c^2}{\sqrt{1 - v^2/c^2}} - m c^2 \quad \xrightarrow[v/c \to 0]{} \quad \frac{1}{2} m v^2$$
- **Planck Radiation $\longrightarrow$ Rayleigh-Jeans Distribution:**
  $$u(\nu, T) = \frac{8\pi h \nu^3}{c^3} \frac{1}{e^{h\nu / k_B T} - 1} \quad \xrightarrow[h\nu / k_B T \to 0]{} \quad \frac{8\pi \nu^2 k_B T}{c^3}$$

In `UniversalEquationGraph.lean`, we formalize this using the canonical Bourbaki / Mathlib `Filter` and `Tendsto` definitions:

```lean
/-- A mathematical filter on a type `α`, formalizing neighborhoods and generalized limits. -/
structure Filter (α : Type*) where
  sets : Set (Set α)
  univ_mem : Set.univ ∈ sets
  inter_mem : ∀ {s t}, s ∈ sets → t ∈ sets → {x | s x ∧ t x} ∈ sets
  superset_mem : ∀ {s t}, s ∈ sets → (∀ x, s x → t x) → t ∈ sets

/-- Canonical Tendsto relation: f converges along filter F to filter G. -/
def Tendsto {α β : Type*} (f : α → β) (F : Filter α) (G : Filter β) : Prop :=
  ∀ s, s ∈ G.sets → {x | s (f x)} ∈ F.sets
```

We establish both pointwise and uniform asymptotic theory reductions on physical domains:

```lean
/-- Pointwise asymptotic theory reduction via `Tendsto`:
    For every environment `env ∈ domain`, the evaluation of the parameterized model
    converges along parameter filter `F` to the neighborhood filter `targetNhds(env)`
    of the reduced model value. -/
def AsymptoticTendstoReduction
    (fam : ParameterizedFamily α Param Env Val)
    (F : Filter Param) (eq_reduced : Equation α Env Val)
    (e_full e_red : α) (domain : Set Env)
    (targetNhds : Env → Filter Val) : Prop :=
  ∀ env ∈ domain, Tendsto (fun p => fam.evalParam e_full p env) F (targetNhds env)

/-- Uniform asymptotic theory reduction on a physical domain. -/
def UniformAsymptoticTendstoReduction
    (fam : ParameterizedFamily α Param Env Val)
    (F : Filter Param) (eq_reduced : Equation α Env Val)
    (e_full e_red : α) (domain : Set Env)
    (uniformEntourages : Set (Set (Val × Val))) : Prop :=
  ∀ U ∈ uniformEntourages, ∃ P, P ∈ F.sets ∧
    ∀ p, P p → ∀ env ∈ domain, (fam.evalParam e_full p env, eq_reduced.eval e_red env) ∈ U
```

Furthermore, we prove `tendsto_comp`:
```lean
theorem tendsto_comp {α β γ : Type*}
    {f : α → β} {g : β → γ} {F : Filter α} {G : Filter β} {H : Filter γ}
    (hf : Tendsto f F G) (hg : Tendsto g G H) :
    Tendsto (g ∘ f) F H := by
  intro s hs
  have hg_pre := hg s hs
  have hf_pre := hf {y | s (g y)} hg_pre
  exact hf_pre
```
This proves that asymptotic reductions compose transitively:
$$\text{Model}_A \xrightarrow{\mathcal{F}} \text{Model}_B \xrightarrow{\mathcal{G}} \text{Model}_C \implies \text{Model}_A \xrightarrow{\mathcal{F}} \text{Model}_C$$
enabling multi-scale theory reduction cascades across scientific models.

---

## 5. Mathematical Case Studies & Invariant Transplantation

To illustrate the concrete operation of the ladder, we walk through four representative cross-disciplinary dyads.

### 5.1 Case Study 1: The Second-Order Oscillator Triad
Consider the three physical systems:
- **Mechanical Damped Oscillator:** $m \ddot{x} + \gamma \dot{x} + k x = 0$
- **Series Electrical RLC Circuit:** $L \ddot{q} + R \dot{q} + \frac{1}{C} q = 0$
- **Viscous U-Tube Fluid Manometer:** $\rho L \ddot{z} + \frac{8\mu L}{r^2} \dot{z} + 2\rho g z = 0$

```mermaid
flowchart LR
    subgraph DampedOscillator["Mechanical Oscillator"]
        O1["m x'' + γ x' + k x = 0"]
        S1["ω_d = √(k/m - γ²/(4m²))"]
    end
    subgraph RLCCircuit["Series RLC Circuit"]
        O2["L q'' + R q' + (1/C) q = 0"]
        S2["ω_d = √(1/(LC) - R²/(4L²))"]
    end
    subgraph UTube["Viscous U-Tube Manometer"]
        O3["(ρL) z'' + (8μL/r²) z' + (2ρg) z = 0"]
        S3["ζ = (8μL/r²) / (2√(2ρ²gL²))"]
    end

    DampedOscillator <-->|"Rungs 1-5 Certified"| RLCCircuit
    DampedOscillator <-->|"Rungs 1-5 Certified"| UTube
    RLCCircuit <-->|"Rungs 1-5 Certified"| UTube
```

- **Ladder Evaluation:**
  - *Rung 1 (Syntactic):* PASS. All three instantiate the identical second-order linear differential operator `add(mul(c2, diff(x, t, 2)), add(mul(c1, diff(x, t)), mul(c0, x))) = 0`.
  - *Rung 2 (Algebraic):* PASS under coordinate bijections:
    $$\{x \leftrightarrow q \leftrightarrow z, \; m \leftrightarrow L \leftrightarrow \rho L, \; \gamma \leftrightarrow R \leftrightarrow \frac{8\mu L}{r^2}, \; k \leftrightarrow \frac{1}{C} \leftrightarrow 2\rho g\}$$
  - *Rung 3 (Dimensional):* PASS. Under dimensional homomorphisms mapping mechanical displacement $[L]$ to electrical charge $[I T]$, the characteristic frequency $\omega_0^2 = k/m \leftrightarrow 1/(LC) \leftrightarrow 2g/L$ consistently carries dimension $[T^{-2}]$.
  - *Rung 4 (Semantic/Model):* PASS for lumped-parameter regimes with constant positive coefficients ($m, L, \rho, C > 0$).
  - *Rung 5 (Solution Transfer):* Certified under `SolutionTransferCertificate`. The underdamped mechanical frequency:
    $$\omega_d = \sqrt{\frac{k}{m} - \frac{\gamma^2}{4m^2}}$$
    is soundly transplanted to the electrical circuit:
    $$\omega_d = \sqrt{\frac{1}{LC} - \frac{R^2}{4L^2}}$$
    and the viscous manometer damping ratio $\zeta$ transports transitively across all three domains.

### 5.2 Case Study 2: The Rational Saturation Triad (Hard Negative)
- **Michaelis-Menten Kinetics:** $v = \frac{V_{\max} S}{K_m + S}$
- **Langmuir Adsorption Isotherm:** $\theta = \frac{K P}{1 + K P} = \frac{P}{1/K + P}$
- **Holling Type II Functional Response:** $N_e = \frac{a T N}{1 + a T_h N} = \frac{(T/T_h) N}{(1/(a T_h)) + N}$

All three share the rational form $y = \frac{c_1 z}{c_0 + z}$.
- **Ladder Evaluation:**
  - *Rung 1 (Syntactic):* PASS (identical degree-1 rational fraction).
  - *Rung 2 (Algebraic):* PASS under algebraic re-parameterization.
  - *Rung 3 (Dimensional):* PASS. All three evaluate to valid dimensionless ratios or rates.
  - *Rung 4 (Semantic/Model):* **FAILS CATEGORICALLY**.
    - *Michaelis-Menten* is an *open dissipative system* driven by continuous chemical free energy turnover ($S \to P$), violating the closed thermodynamic equilibrium assumption of Langmuir.
    - *Langmuir* requires a fixed finite lattice of adsorption sites with zero lateral interaction, which violates behavioral predator searching dynamics.
    - *Holling Type II* is governed by predator digestion and handling time $T_h$, not catalytic enzyme turnover or surface adsorption.
  - *Epistemic Significance:* The graded ladder cleanly isolates this failure at Rung 4, preventing the erroneous transfer of equilibrium thermodynamic relations (e.g., Clausius-Clapeyron heats of adsorption) to non-equilibrium enzymatic reactions.

### 5.3 Case Study 3: Attenuation and Decay (Hard Negative)
- **Radioactive Decay:** $\frac{dN}{dt} = -\lambda N$
- **RC Capacitor Discharge:** $\frac{dV}{dt} = -\frac{1}{RC} V$
- **Beer-Lambert Optical Absorption:** $\frac{dI}{dz} = -\kappa I$
- **Newton's Law of Cooling:** $\frac{dT}{dt} = -k (T - T_{\text{env}})$

- **Ladder Evaluation:**
  - *Radioactive Decay $\leftrightarrow$ RC Discharge:* PASSES all 5 rungs. The half-life formula $t_{1/2} = \frac{\ln 2}{\lambda}$ soundly transplants to $t_{1/2} = \ln 2 \cdot RC$.
  - *Radioactive Decay $\leftrightarrow$ Newton Cooling:* **FAILS at Rung 1 & 2**. Newton cooling possesses an affine ambient temperature attractor $T_{\text{env}}$, whereas radioactive decay possesses an absolute zero ground state.
  - *Radioactive Decay $\leftrightarrow$ Beer-Lambert Law:* **FAILS at Rung 3 (Dimensional Inadmissibility)**. The Beer-Lambert coefficient $\kappa$ has spatial dimension $[L^{-1}]$, whereas the radioactive decay constant $\lambda$ has temporal dimension $[T^{-1}]$. Without an explicit characteristic velocity scale, no dimensional group homomorphism exists.

### 5.4 Case Study 4: Parabolic Diffusion and Financial Economics
- **1D Fourier Heat Conduction:** $\frac{\partial u}{\partial \tau} = \alpha \frac{\partial^2 u}{\partial x^2}$
- **Black-Scholes PDE:** $\frac{\partial V}{\partial t} + \frac{1}{2} \sigma^2 S^2 \frac{\partial^2 V}{\partial S^2} + r S \frac{\partial V}{\partial S} - r V = 0$

Under the classical log-moneyness and gauge transformation:
$$x = \ln\left(\frac{S}{K}\right), \quad \tau = \frac{\sigma^2}{2}(T - t), \quad u(x, \tau) = \exp\left(-\frac{1}{2}(k - 1)x - \frac{1}{4}(k + 1)^2 \tau\right) \frac{V(S, t)}{K}$$
where $k = \frac{2r}{\sigma^2}$, the Black-Scholes PDE reduces exactly to the 1D heat equation with dimensionless diffusion coefficient $\alpha = 1$.
- **Ladder Evaluation:** PASSES all 5 rungs. The fundamental solution of the heat equation (the Gaussian Green's kernel):
  $$G(x, \tau) = \frac{1}{\sqrt{4\pi \tau}} \exp\left(-\frac{x^2}{4\tau}\right)$$
  transplants to generate the closed-form Black-Scholes European call pricing formula.

---

## 6. Empirical Validation: Killer Test v1 & Killer Test v2

To evaluate whether the 5-stage graded ladder discovers genuine cross-disciplinary reuse while remaining immune to deceptive analogies, we executed two consecutive empirical benchmarks:
1. **Killer Test v1:** Baseline benchmark over 120 combinatorial candidate pairs across 16 models.
2. **Killer Test v2:** The definitive stress benchmark over **378 combinatorial candidate pairs across 28 models**, incorporating three strict experimental regimes:
   - **Regime A (Baseline Reproduction):** Canonical true positives;
   - **Regime B (Adversarial Discrimination):** 11 explicit hard negatives spanning 6 mathematical failure modes;
   - **Regime C (Blind Discovery, Leave-Family-Out):** 10 holdout models from acoustics, transmission lines, mechanics, fluid dynamics, and electrophysiology that were **never observed during development**.

```mermaid
flowchart TD
    Universe["Benchmark Universe: 28 Models<br/>(378 Combinatorial Candidate Pairs)"]
    
    RegA["Regime A: Reproduction<br/>• 6 Baseline True Positives<br/>(Oscillator, RLC, Manometer, Heat)"]
    RegB["Regime B: Adversarial Discrimination<br/>• 11 Hard Negatives across 6 Failure Modes<br/>(Units, Dynamics, Boundaries, Causal, Asymptotic, Signs)"]
    RegC["Regime C: Blind Discovery<br/>• 10 Holdout Models (Leave-Family-Out)<br/>(Acoustics, Telegrapher, String, Poiseuille, Ohm, CellML)"]
    
    Universe --> RegA
    Universe --> RegB
    Universe --> RegC
    
    R0["R0: Candidate Generator (Recall = 1.0000, Retention = 0.1455)"]
    R1["R1: Syntactic Isomorphism (F1 = 0.7222, False-Survival = 0.7273)"]
    R2["R2: Algebraic Equivalence (F1 = 0.8387, False-Survival = 0.2727)"]
    R3["R3: Dimensional Admissibility (F1 = 0.8966, False-Survival = 0.1818)"]
    R4["R4: Semantic / Model Isomorphism (Precision = 1.0000, False-Survival = 0.0000, Novel-Yield = 7)"]
    R5["R5: Structural Schema Certified (11 Lean 4 Proofs Compiled, Novel-Yield = 5)"]
    R6["R6: Substantive Theorem Certified (5 Mathematical Invariants Machine-Checked, Novel-Yield = 3)"]
    
    RegA & RegB & RegC --> R0 --> R1 --> R2 --> R3 --> R4 --> R5 --> R6
```

### 6.1 Quantitative Performance Across Ladder Rungs (Killer Test v2)

Table 1 reports the quantitative performance across all 378 candidate pairs evaluated under the tri-state protocol (`PASS | FAIL | UNKNOWN`):

| Stage / Ladder Rung | Candidates Passed | True Positives | False Positives | Precision | Recall | F1 Score | Retention | False-Survival Rate | Novel-Link Yield |
|---|---|---|---|---|---|---|---|---|---|
| **R0: Candidate Generator** | 55 | 13 | 42 | 0.2364 | **1.0000** | 0.3824 | 0.1455 | 0.9091 | 7 |
| **R1: Syntactic Isomorphism** | 23 | 13 | 10 | 0.5652 | **1.0000** | 0.7222 | 0.0608 | 0.7273 | 7 |
| **R2: Algebraic Equivalence** | 18 | 13 | 5 | 0.7222 | **1.0000** | 0.8387 | 0.0476 | 0.2727 | 7 |
| **R3: Dimensional Admissibility** | 16 | 13 | 3 | 0.8125 | **1.0000** | 0.8966 | 0.0423 | 0.1818 | 7 |
| **R4: Semantic / Model Isomorphism** | 13 | 13 | 0 | **1.0000** | **1.0000** | **1.0000** | 0.0344 | **0.0000** | **7** |
| **R5: Structural Schema Certified** | 11 | 11 | 0 | **1.0000** | 0.8462 | **0.9167** | 0.0291 | **0.0000** | **5** |
| **R6: Substantive Theorem Certified** | 5 | 5 | 0 | **1.0000** | 0.3846 | 0.5556 | 0.0132 | **0.0000** | **3** |

```mermaid
xychart-beta
    title "Precision and Hard-Negative False-Survival Rate Across the Ladder"
    x-axis ["R0: Cand", "R1: Syntax", "R2: Algebra", "R3: Dim", "R4: Semantics", "R5: Structural", "R6: Substantive"]
    y-axis "Rate" 0.0 --> 1.0
    line "Precision" [0.2364, 0.5652, 0.7222, 0.8125, 1.0000, 1.0000, 1.0000]
    line "False-Survival Rate" [0.9091, 0.7273, 0.2727, 0.1818, 0.0000, 0.0000, 0.0000]
```

### 6.2 Key Empirical Takeaways

1. **Candidate Generator Recall is 100%:** An unconstrained heuristic candidate generator ($R0$) based on differential signature and polynomial arity retains all 13 true positive isomorphisms while immediately eliminating 85.5% ($323 / 378$) of spurious pairings.
2. **Elimination of Hard-Negative Leaks:** Hard negatives survive at high rates through syntax ($72.7\%$) and algebra ($27.3\%$). At Rung 3 (dimensions), survival drops to $18.2\%$. At Rung 4 (semantics), **100% of adversarial hard negatives are eliminated (false-survival = 0.0000)**.
3. **Novel-Link Yield in Blind Discovery:** In the holdout partition (Regime C), the pipeline discovered **7 valid semantic isomorphisms** and **5 fully certified solution transfer pairs** that were never observed during development.

### 6.3 Anatomy of Adversarial Rejection Mechanisms

Killer Test v2 verifies the exact failure mechanisms across the six adversarial categories:
1. **Asymptotic-Only Equivalence:** `thermo:ideal-gas` $\longleftrightarrow$ `thermo:van-der-waals` is **eliminated at R0/R1** due to polynomial degree mismatch (bilinear in $(P, V_m)$ vs cubic polynomial in $V_m$). The system correctly identifies that they are not algebraically identical outside the `Filter.Tendsto` limit.
2. **Ground State vs Affine Attractor:** `nuclear:radioactive-decay` $\longleftrightarrow$ `thermo:newton-cooling` is **eliminated at R1** because the affine ambient temperature attractor ($T - T_{\text{env}}$) introduces an affine leaf that is syntactically absent in zero-ground-state decay.
3. **Incompatible Dimensional Units:** `nuclear:radioactive-decay` $\longleftrightarrow$ `optics:beer-lambert` is **eliminated at R3** because the temporal decay rate $[T^{-1}]$ cannot be mapped to the spatial attenuation coefficient $[L^{-1}]$ without an extrinsic characteristic velocity scale.
4. **Boundary Condition & Domain Restrictions:** `thermo:fourier-heat-1d` $\longleftrightarrow$ `thermo:fourier-heat-dirichlet-box` is **eliminated at R4** because the unbounded Cauchy real line (continuous Gaussian kernel) cannot map to a compact interval $[0, L]$ with discrete Dirichlet eigenvalues.
5. **Causal & Thermodynamic Regime Divergence:** The rational saturation triad (*Michaelis-Menten* $\leftrightarrow$ *Langmuir* $\leftrightarrow$ *Holling Type II*) is **eliminated at R4** because catalytic turnover flux conflicts with passive lattice equilibrium and behavioral predator handling time.
6. **Parameter Sign & Stability Regimes:** `mechanics:damped-oscillator` $\longleftrightarrow$ `mechanics:van-der-pol-negative-damping` is **eliminated at R4** because positive damping ($\gamma > 0$, Lyapunov stable origin) conflicts with negative damping ($\gamma < 0$, linearly unstable origin with limit cycle attractor).

### 6.4 Blind Rediscovery Findings (Novel-Link Yield)

In the holdout partition (Regime C), the pipeline operated blind over models from disciplines completely absent during development. The 5 non-preprogrammed pairs discovered and certified comprise:
1. **The 1D Hyperbolic Wave Triad:**
   - `acoustics:acoustic-wave-1d` $\longleftrightarrow$ `transmission:lossless-telegrapher-1d`
   - `acoustics:acoustic-wave-1d` $\longleftrightarrow$ `mechanics:string-vibration-1d`
   - `transmission:lossless-telegrapher-1d` $\longleftrightarrow$ `mechanics:string-vibration-1d`
   - *Epistemic Status:* **Blind structural rediscovery** of the classical d'Alembert wave equation. While mathematically well-known across physics, the system autonomously rediscovered the structural and dimensional isomorphism without human guidance or pre-programmed rules.
   - *Transferred Invariant:* D'Alembert traveling wave solution $u(x, t) = f(x - v t) + g(x + v t)$ and acoustic/electrical wave impedance.
   - *Dimensional Homomorphism:* Acoustic sound speed $c_s = \sqrt{K_s/\rho} \longleftrightarrow$ Telegrapher phase velocity $v = 1/\sqrt{L'C'} \longleftrightarrow$ Elastic string wave speed $v = \sqrt{T/\mu}$ (all identically $[L T^{-1}]$).
2. **Linear Flux Dissipation Dyad (Hydraulic Poiseuille $\longleftrightarrow$ Electric Ohm):**
   - `fluid:poiseuille-pipe-flow` $\longleftrightarrow$ `electronics:ohmic-conductor`
   - *Epistemic Status:* **Blind rediscovery** of the classic hydraulic-electric circuit analogy.
   - *Transferred Invariant:* Linear constitutive proportionality $\Delta \Phi = R \cdot J$ (potential drop proportional to conserved flux).
   - *Physical Mapping:* Pressure drop $\Delta P \longleftrightarrow$ Voltage drop $\Delta V$; Volume flow rate $Q \longleftrightarrow$ Electric current $I$; Hydraulic resistance $R_{\text{hyd}} = \frac{8\mu L}{\pi r^4} \longleftrightarrow$ Electrical resistance $R_{\text{elec}} = \frac{\rho_e L}{\pi r^2}$.
3. **Biophysical Membrane Leak $\longleftrightarrow$ Lumped Thermal Capacitance Cooling:**
   - `biophys:membrane-passive-leak` $\longleftrightarrow$ `thermo:lumped-thermal-capacitance`
   - *Epistemic Status:* **Blind rediscovery** of first-order linear relaxation dynamics across electrophysiology and thermodynamics.
   - *Transferred Invariant:* Exponential relaxation to affine asymptote $X(t) = X_\infty + (X_0 - X_\infty) \exp(-t/\tau)$.
   - *Physical Mapping:* Membrane potential $V_m \longleftrightarrow$ Body temperature $T$; Reversal potential $E_L \longleftrightarrow$ Ambient temperature $T_\infty$; Membrane time constant $\tau = C_m / g_L \longleftrightarrow$ Thermal time constant $\tau = \frac{\rho V c_p}{h A}$.

### 6.5 Closed-Loop Lean 4 Compilation Ledger: R5-Structural vs. R6-Substantive

To prevent superficial validation, the verification ladder distinguishes between two rigorous formal compilation levels:
1. **R5-Structural (Schema-Certified):** Verifies that the multi-domain models instantiate the abstract `SolutionTransferCertificate` schema, verifying state-space bijections, environment mappings, and target-object declarations across 11 pairs in `formalizations/research_contracts/EquationTransferCertificates.lean`.
2. **R6-Substantive (Theorem-Certified Hardening):** Formalized in `formalizations/research_contracts/SubstantiveCertificates.lean`, this rung eliminates trivial representations (e.g. `eval := ()` or `Unit` coordinates) and requires:
   - Concrete physical state spaces carrying real physical coordinates, derivatives, and parameters.
   - Genuine differential equation residuals (e.g. $m \ddot{x} + \gamma \dot{x} + k x = 0$).
   - Exact commutation of differential operators under coordinate bijections.
   - Constructive Lean 4 proofs of analytical invariant preservation (half-life formulas, underdamped frequency formulas, and wave propagation speeds).

- **Toolchain:** Lean 4.34.0 (Release, commit `293d5d0c0c3f`)
- **Compilation Result:** **`Build completed successfully (15 jobs).`** (100% verified, 0 errors, 0 warnings across all 15 root modules including `SubstantiveCertificates`).

#### 6.5.1 Structural Certification Ledger (R5)
All 11 pairs synthesized and machine-checked in `EquationTransferCertificates.lean`:
```
[CERTIFIED] mechanics:damped-oscillator <-> electronics:rlc-circuit
            Transferred Invariant: underdamped_frequency
[CERTIFIED] mechanics:damped-oscillator <-> fluids:u-tube-manometer
            Transferred Invariant: underdamped_frequency
[CERTIFIED] electronics:rlc-circuit <-> fluids:u-tube-manometer
            Transferred Invariant: underdamped_frequency
[CERTIFIED] mechanics:harmonic-oscillator <-> electronics:lc-circuit
            Transferred Invariant: natural_frequency
[CERTIFIED] nuclear:radioactive-decay <-> electronics:rc-discharge
            Transferred Invariant: half_life
[CERTIFIED] thermo:fourier-heat-1d <-> finance:black-scholes-heat
            Transferred Invariant: gaussian_fundamental_kernel
[CERTIFIED] acoustics:acoustic-wave-1d <-> transmission:lossless-telegrapher-1d
            Transferred Invariant: dalembert_traveling_wave  [BLIND REDISCOVERY]
[CERTIFIED] acoustics:acoustic-wave-1d <-> mechanics:string-vibration-1d
            Transferred Invariant: dalembert_traveling_wave  [BLIND REDISCOVERY]
[CERTIFIED] transmission:lossless-telegrapher-1d <-> mechanics:string-vibration-1d
            Transferred Invariant: dalembert_traveling_wave  [BLIND REDISCOVERY]
[CERTIFIED] fluid:poiseuille-pipe-flow <-> electronics:ohmic-conductor
            Transferred Invariant: constitutive_proportionality  [BLIND REDISCOVERY]
[CERTIFIED] biophys:membrane-passive-leak <-> thermo:lumped-thermal-capacitance
            Transferred Invariant: exponential_relaxation  [BLIND REDISCOVERY]
```

#### 6.5.2 Substantive Mathematical Hardening Ledger (R6)
Machine-checked substantive theorems in `SubstantiveCertificates.lean` across three anchor physical cases (5 concrete pairs, including the blind discovery wave triad):
1. **Case 1: First-Order Decay $\longleftrightarrow$ RC Discharge**
   - *Residual Commutation:* Proves `decay_to_rc_eval_commute`: $\dot{V} + \frac{1}{RC} V = \dot{N} + \lambda N$ under $(N, \dot{N}, \lambda) \leftrightarrow (V, \dot{V}, 1/RC)$.
   - *Invariant Transfer:* Proves `half_life_transfer`: $t_{1/2} = \frac{\ln 2}{\lambda} \longleftrightarrow \frac{\ln 2}{1/RC} = RC \ln 2$.
2. **Case 2: Damped Oscillator $\longleftrightarrow$ Series RLC Circuit**
   - *Residual Commutation:* Proves `oscillator_to_rlc_eval_commute`: $L \ddot{q} + R \dot{q} + \frac{1}{C} q = m \ddot{x} + \gamma \dot{x} + k x$.
   - *Invariant Transfer:* Proves `underdamped_freq_sq_transfer`: $\omega_d^2 = \frac{k}{m} - \frac{\gamma^2}{4m^2} \longleftrightarrow \frac{1}{LC} - \frac{R^2}{4L^2}$.
3. **Case 3: 1D Hyperbolic Wave Triad (Acoustics $\longleftrightarrow$ Telegrapher $\longleftrightarrow$ Elastic String)**
   - *Operator Commutation:* Proves `acoustic_to_telegrapher_eval_commute`, `acoustic_to_string_eval_commute`, and `telegrapher_to_string_eval_commute` on d'Alembert wave residuals $\ddot{u} - c^2 u_{xx} = 0$.
   - *Invariant Transfer:* Proves exact wave velocity and impedance transfer $c_s^2 \leftrightarrow v_{\text{phase}}^2 \leftrightarrow v_{\text{string}}^2$.

### 6.6 Analysis of the R4 $\to$ R5 Transition: Certificate Coverage Gaps

While Rung 4 achieved a perfect $\text{Recall} = 1.000$ (13/13 valid isomorphisms identified), Rung 5 achieved $\text{Recall} = 0.8462$ (11/13 certified). It is crucial to distinguish this from an algorithmic or theoretical failure. 

We formalize the **R4 $\to$ R5 Gap Taxonomy**:
$$\text{GapReason} \in \{\text{no\_transferable\_object\_declared}, \text{unsupported\_object\_representation}, \text{proof\_synthesis\_failure}, \text{actual\_incompatibility}\}$$

In Killer Test v2, exactly two pairs passed R4 but did not produce an R5 certificate:
1. `biophys:membrane-passive-leak` $\longleftrightarrow$ `thermo:newton-cooling`
2. `thermo:lumped-thermal-capacitance` $\longleftrightarrow$ `thermo:newton-cooling`

In both instances, the reason was classified as **`no_transferable_object_declared`**: `thermo:newton-cooling` was included in the adversarial benchmark set without an explicit analytical solution declaration in its metadata. The underlying models are mathematically and semantically isomorphic; the drop in R5 recall represents a **certificate coverage gap** rather than an epistemic error.

---

## 7. Killer Test v3: Large-Scale Discovery and Immutable Pre-Audit Parquet Ledger

Building upon the formal verification of the 5-stage graded ladder, **Killer Test v3** shifts the scientific objective from validating known analogies to executing automated structure discovery over multi-source scientific data lakes under strict pre-audit freezing.

### 7.1 Protocol for Large-Scale Discovery with Apache Parquet Storage
To eliminate experimenter bias, guarantee exact byte reproducibility, and solve the storage bottleneck of combinatorial candidate spaces:
1. **Pipeline Freezing:** All heuristic thresholds for candidate generation ($R0$), syntax ($R1$), algebra ($R2$), dimensional admissibility ($R3$), and semantics ($R4$) were permanently frozen prior to corpus ingestion.
2. **Multi-Source Ingestion with Domain Quotas ($\ge 1,000$ Blocks):** Ingested **1,002 eligible parsed equation blocks** across five distinct scientific and engineering domains with minimum quotas:
   - *Modelica Standard Library (MSL):* 400 blocks across Electrical, Mechanics, Thermal, and Fluid packages.
   - *BioModels SBML:* 350 MathML blocks across enzymatic kinetics, rate rules, and assignment rules.
   - *Physiome CellML:* 27 redistributable MathML blocks (Hodgkin-Huxley, Noble, FitzHugh-Nagumo, Beeler-Reuter).
   - *Physics & Applied Math PDEs/ODEs:* 200 blocks (Hyperbolic waves, Parabolic diffusion, Resonant tanks, Linear conduction).
   - *IETF RFCXML:* 25 blocks (QUIC loss detection timers, PTO exponential backoff, congestion pacing).
3. **Columnar Apache Parquet Storage:** Rather than storing uncompressed JSON files that exceeded 380 MB, the 125,076 surviving candidate pairs are materialized to a columnar **Apache Parquet shard (`killer_test_v3_candidates_sealed.parquet`) with zstd compression**, reducing storage to **4.53 MB** while preserving full analytical queryability.
4. **Sealed Pre-Audit Status:** Every candidate row is explicitly assigned `audit_status = "SEALED_UNAUDITED"`. A cryptographic manifest (`killer_test_v3_manifest.md`) records the SHA-256 digests of the source descriptors, git commits (`papers` and `site`), and the Parquet artifact (`1727e5d6...`) prior to any literature lookup.

```mermaid
flowchart LR
    LAKE["Scientific Equation Atlas Lake<br/>(MSL, SBML, CellML, RFCXML, Physics)"]
    CORPUS["Deterministic Sample (N >= 1,000)<br/>Domain Quota Enforcement"]
    FROZEN["Frozen Discovery Pipeline<br/>(R0 Candidate Gen ➔ R1-R4 Ladder)"]
    PARQUET["Immutable Parquet Ledger<br/>killer_test_v3_candidates_sealed.parquet<br/>(4.53 MB, zstd, SHA-256 sealed)"]
    MANIFEST["Cryptographic Manifest<br/>audit_status = SEALED_UNAUDITED"]
    AUDIT["Phase v3-B: Posterior Literature Audit<br/>(5 Epistemic Categories)"]

    LAKE --> CORPUS --> FROZEN --> PARQUET & MANIFEST --> AUDIT
```

### 7.2 Results of Phase v3-A: Combinatorial Pair Pruning
Across all $\binom{1,002}{2} = 501,501$ combinatorial candidate pairs, the frozen pipeline executed in under 2 seconds:
- **R0 Candidate Generator:** 267,227 pairs passed signature matching (differential order, arity, degree) in 0.057s (Retention = 0.5329, Pruned = 0.4671).
- **R1 Syntactic Isomorphism:** 125,076 pairs passed operator tree shape matching (Retention = 0.2494).
- **R2–R4 Semantic Validation:** 125,076 pairs passed variable bipartition, Buckingham $\Pi$ dimensional consistency, and manifold boundary checks.
- **Candidate Diversity:** The sealed ledger contains **4,940 cross-source candidate pairs** (Source A $\ne$ Source B) and **56,649 cross-domain candidate pairs** (Domain A $\ne$ Domain B).

### 7.3 Posterior Literature Audit Protocol & Empirical Findings (Phase v3-B)
Only *after* committing the sealed Parquet artifact (`killer_test_v3_candidates_sealed.parquet`, SHA-256: `1727e5d6...`) and manifest to Git, candidate relations were audited against primary scientific literature and classified into five mutually exclusive epistemic categories recorded in an immutable audit ledger (`results/v3_audit/UEKG-V3-POSTERIOR-AUDIT.md`):
- **Category 1 (Known Relation / Textbook Positives):** 8 cases (42.1%) — Recovering canonical analogies across acoustics, transmission lines, elastodynamics, mass-heat transport, financial option diffusion, and radioactive decay.
- **Category 2 (Known in Adjacent Literature):** 3 cases (15.8%) — Recovering interdisciplinary connections between cardiac electrophysiology (Beeler-Reuter), lumped thermal capacitance, and multi-port bond graph energy continuity.
- **Category 3 (Apparently Undocumented / Novel Candidate):** 2 cases (10.5%) — Closed-form operational transfer between Black-Scholes option volatility diffusion and chromatographic solute dispersion in porous media; and automated Modelica declarative DAE capacitor extraction to nuclear transmutation kinetics.
- **Category 4 (False Semantic Match / Adversarial Reject):** 4 cases (21.1%) — Subtle domain violations where algebraic/syntactic signatures matched, but non-linear gating kinetics, kinematic linkage closures, discrete boolean actuator flags, or tensor rank packaging violated physical isomorphism.
- **Category 5 (Undecidable / Insufficient Metadata):** 2 cases (10.5%) — Incomplete parameter bounds or isolated piecewise operators lacking full hybrid automaton context.

```
                          POSTERIOR AUDIT EPISTEMIC DISTRIBUTION
 ┌────────────────────────────────────────────────────────┬───────────┬──────────┐
 │ Epistemic Category                                     │ Sample N  │ Share %  │
 ├────────────────────────────────────────────────────────┼───────────┼──────────┤
 │ Category 1: Known Relation (Textbook Positives)        │     8     │  42.1%   │
 │ Category 2: Known in Adjacent Literature               │     3     │  15.8%   │
 │ Category 3: Apparently Undocumented (Novel Transfer)   │     2     │  10.5%   │
 │ Category 4: False Semantic Match (Adversarial Reject)  │     4     │  21.1%   │
 │ Category 5: Undecidable / Insufficient Metadata        │     2     │  10.5%   │
 ├────────────────────────────────────────────────────────┼───────────┼──────────┤
 │ Total Audited Sample                                   │    19     │ 100.0%   │
 └────────────────────────────────────────────────────────┴───────────┴──────────┘
```

### 7.4 Quantitative Epistemic Discovery Metrics
- **Blind Rediscovery Precision:** $\text{Prec}_{\text{rediscovery}} = \frac{|\text{Cat 1}| + |\text{Cat 2}|}{|\text{Cat 1}| + |\text{Cat 2}| + |\text{Cat 4}|} = \frac{11}{15} \approx \mathbf{73.33\%}$
- **Overall Valid Transfer Precision:** $\text{Prec}_{\text{valid}} = \frac{|\text{Cat 1}| + |\text{Cat 2}| + |\text{Cat 3}|}{|\text{Decidable Sample}|} = \frac{13}{17} \approx \mathbf{76.47\%}$
- **False Discovery Rate at R4 (FDR):** $\text{FDR}_{\text{R4}} = \frac{|\text{Cat 4}|}{|\text{Decidable Sample}|} = \frac{4}{17} \approx \mathbf{23.53\%}$
- **Apparently Undocumented Yield:** $\mathbf{2\text{ candidates}}$
- **Decidability Rate:** $\frac{|\text{Decidable Sample}|}{|\text{Total Sample}|} = \frac{17}{19} \approx \mathbf{89.47\%}$

> [!IMPORTANT]
> **Why Interactive Theorem Proving (R5/R6) is Epistemically Indispensable:**  
> The **23.53% false discovery rate** at R4 provides empirical proof that algebraic and dimensional heuristics alone cannot achieve zero-hallucination scientific transfer. Only formal proof assistants (Lean 4) verifying coordinate residual commutativity (`SubstantiveCertificates.lean`) can eliminate Category 4 false positives, ensuring that discovered cross-domain links represent mathematically sound, truth-preserving physical analogies.

### 7.5 Killer Test v4: The Research-Frontier Compiler
To transition the system from general isomorphism detection into an operational **research-frontier compiler**, Killer Test v4 executes a two-phase architecture designed to maximize the **Research Compression Ratio (RCR)** while guaranteeing $\ge 95\%$ **Frontier Recall**:

$$\textbf{Research Compression Ratio (RCR)} = \frac{|\text{Initial Combinatorial Space}|}{|\text{Audited Frontier Links}|} = \frac{501,501}{48} \approx \mathbf{10,447.9\times}$$

$$\textbf{Frontier Recall} = \mathbf{100.0\%} \quad (4/4\text{ hidden canonical true positives retained})$$

$$\textbf{Human Attention Saved} = \mathbf{99.99\%} \quad (\text{literature searches reduced from } 501,501 \to 48)$$

```mermaid
flowchart TD
    ALL["501,501 Combinatorial Pairs (1,002 Lake Blocks)"]
    G1["Gate 1: Differential Order (203,985 rejected, 40.67%)"]
    G7["Gate 7: Dynamical Regime (117,098 rejected, 23.35%)"]
    G3["Gate 3: Continuity & Bool Mode (41,503 rejected, 8.28%)"]
    G4["Gate 4: Linearity & Coupling (28,446 rejected, 5.67%)"]
    G8["Gate 8: Transferable Invariant (6,559 rejected, 1.31%)"]
    G2["Gate 2: Tensor Rank (1,490 rejected, 0.30%)"]
    G5["Gate 5: Asserted Negatives (818 rejected, 0.16%)"]
    SURV["101,602 Hard-Admissible Survivors"]
    TOP["48 Diverse Frontier Links<br/>RCR = 10,447.9x | Recall = 100.0%"]

    ALL --> G1 --> G7 --> G3 --> G4 --> G8 --> G2 --> G5 --> SURV --> TOP
```

#### Key Architecture Principles in Semantic IR v4:
1. **Tri-State Fail-Closed Gates (`PASS | FAIL | UNKNOWN`):** Missing metadata is never conflated with physical incompatibility; it incurs explicit metadata debt.
2. **Deterministic Elimination of False Positives:** Rank matching eliminates vector packaging vs scalars; continuity checks eliminate boolean flags vs fluxes; coupling checks eliminate non-linear gating states vs linear 2-port circuits.
3. **Faceted Transfer Bundle:** The graph explicitly represents what is transferable (`dalembert_traveling_wave`, `gaussian_heat_kernel`, `half_life`) and what is non-transferable (`boundary_spectrum: INCOMPATIBLE`).
4. **Knowledge Lifecycle & Transitive Reuse:** Literature-audited links transition to `knowledge_status = literature_confirmed`, shrinking future frontier searches via transitive composition ($A \leftrightarrow B \land B \leftrightarrow C \implies A \leftrightarrow C$).

### 7.5.1 Transfer obstructions as first-class knowledge

UEKG treats negative transfer as a first-class research product. A valid relation at one structural level does not automatically license stronger theorem reuse. The system therefore records explicit **transfer obstructions**: cases where some structure survives but a tempting property does not.

Examples already exposed by Tier 5 include:

- the same second-order wave operator does not determine the same characteristic impedance without first-order constitutive structure;
- a bare capacitor constitutive law does not imply autonomous exponential decay without an external closure relation;
- a shared constant-coefficient parabolic operator does not justify transferring richer nonlinear/domain-specific constitutive effects that are absent from the represented models.

A transfer obstruction should identify the strongest relation that holds, the property that fails, the missing structure or counterexample, and—when known—the minimal extra assumptions that would make the transfer valid. Lean can encode these boundaries as counterexamples, incompatibility lemmas, or non-implication theorems.

This shifts UEKG from a graph of reusable similarities to a graph of **transportability boundaries**: what transfers, what does not, and exactly which structural layer controls the distinction.


### 7.5.2 Current evidence as a typed-transfer stack

The experimental lineage can be read as progressively stronger evidence for a compiler rather than a similarity engine:

| Layer | Canonical experiment | Scale | Main result for typed transfer |
|---|---|---:|---|
| **Discrimination** | Killer Test v2 | 378 pairs / 28 models | Semantic gating eliminates the registered hard negatives at R4; 11 structural and 5 substantive Lean-certified transfers separate heuristic discovery from theorem-authorized reuse. |
| **Large-scale posterior audit** | Killer Test v3 | 1,002 source blocks; 125,076 sealed candidate pairs; 19 audited examples | The posterior audit exposes both valid rediscoveries and false semantic matches, demonstrating that pre-proof semantic matches still require epistemic classification. |
| **Frontier compression** | Killer Test v4 | 501,501 pair universe → 48 frontier links | RCR 10,447.9× with 4/4 hidden canonical positives retained in the registered recall set; the compiler concentrates human and formal attention rather than pretending to prove every candidate. |
| **Negative-transfer knowledge** | Tier 5 | bounded reviewed candidates | Obstructions record exactly which stronger property fails even when a weaker relation survives. |

The Tier 5 obstruction nodes currently merged into the canonical lineage make the distinction concrete:

1. **Wave operator \(\not\Rightarrow\) characteristic impedance.** A shared second-order wave equation does not determine the same impedance without the first-order constitutive structure.
2. **Capacitor constitutive law \(\not\Rightarrow\) autonomous decay.** The bare relation \(Q=CV\) requires an external closure such as a resistor/current law before exponential discharge follows.
3. **Parabolic operator \(\not\Rightarrow\) richer constitutive effects.** Constant-coefficient diffusion structure does not authorize transport of nonlinearities, domain-specific closures, or boundary effects absent from the represented model.

These are not failed discoveries. They are **transportability boundaries** that improve the graph: they preserve what is reusable while preventing proof, invariant, or interpretation leakage into unsupported facets.

### 7.5.3 Fail-closed transfer decision rule

For a proposed transfer object \(x\), the compiler follows the rule:

\[
\operatorname{Decision}(A,B,x)=
\begin{cases}
\text{CERTIFY}, & \operatorname{Req}(x)\subseteq \operatorname{TB}(A,B) \land \text{proof obligations discharged},\\
\text{REVIEW}, & \text{evidence is incomplete or a required bridge is unproved},\\
\text{REJECT}, & \text{an obstruction contradicts a required facet}.
\end{cases}
\]

`UNKNOWN` metadata is therefore not silently coerced into either success or failure. This is essential for recall rescue: a candidate may be scientifically promising while still lacking the precise metadata or theorem needed for certification.


### 7.6 Tier 5: Hourly ChatGPT Batch Triage, Recall Rescue, and OKF Research Reports
Tiers 0–4 are deterministic infrastructure. Tier 5 is intentionally **not** implemented as Python classes pretending to be intelligent agents. The agent is a recurring **ChatGPT research routine** that reads a bounded batch of real UEKG candidate packets, reasons over them, and writes an auditable research report back to the repository.

The deterministic compiler prepares two queues:

- **Precision queue:** high-priority frontier candidates that survived T0–T4.
- **Recall-rescue queue:** `UNKNOWN`, soft-fail, near-frontier, and sampled rejected candidates that may hide a coordinate transform, missing metadata, or a partial transferable structure.

Each hourly ChatGPT run selects the next unreviewed batch from repository state. The repository/OKF graph is the source of truth for progress; transient cursor positions, candidate IDs, blockers, and priorities are not hard-coded in the scheduled prompt.

```mermaid
flowchart TD
    IR["Semantic IR v4 + T0–T4 deterministic gates"]
    PQ["Precision queue"]
    RQ["Recall-rescue queue"]
    CHAT["Hourly ChatGPT research routine"]
    OKF["Cumulative OKF batch report"]
    META["Metadata enrichment / Semantic IR patches"]
    PROOF["Symbolic work / Lean R6-R7 when justified"]
    FRONT["Research frontier"]
    LIT["Posterior literature audit"]

    IR --> PQ
    IR --> RQ
    PQ --> CHAT
    RQ --> CHAT
    CHAT --> OKF
    CHAT --> META
    CHAT --> PROOF
    OKF --> FRONT
    META --> IR
    PROOF --> FRONT
    FRONT --> LIT
```

#### Candidate packet read by the routine
The routine consumes compact, repository-derived packets rather than raw corpus dumps. A packet should include, when available:

- exact equation/source identifiers and immutable hashes;
- canonical expression / Semantic IR summary;
- attested, derived, and inferred metadata with provenance;
- model-context neighborhood and coupled-state dependencies;
- deterministic gate trace, including `PASS | FAIL | UNKNOWN`;
- metadata debt and asserted negatives;
- transferable-object candidates;
- queue origin and frontier score components.

The routine may inspect additional repository context when needed, but it must preserve the distinction between source-attested facts, deterministic derivations, and model inference.

#### Required reasoning per batch
For each candidate, ChatGPT should attempt several distinct tasks rather than a single yes/no classification:

1. **Semantic triage:** `KEEP | DROP | REVIEW`, with an explicit reason.
2. **Adversarial challenge:** actively search for a hidden incompatibility, missing state, boundary mismatch, type/rank mismatch, causal mismatch, or invalid parameter regime.
3. **Recall rescue:** when a direct match fails, look for concrete transformations such as coordinate changes, gauge transforms, nondimensionalization, integral/differential reformulation, state augmentation, duality, or asymptotic limits.
4. **Metadata completion:** propose or add derived/inferred metadata with provenance and confidence when this resolves ambiguity.
5. **Transfer-object analysis:** identify what, exactly, might transfer (Green function, stability criterion, characteristic scale, invariant, asymptotic expansion, conserved quantity, etc.) and what explicitly does not transfer.
6. **Formal follow-up:** when the mathematical claim is sufficiently concrete, write or extend Lean artifacts or a proof obligation rather than merely asserting equivalence.
7. **Research-frontier decision:** distinguish known/likely-known structure from candidates worth later posterior literature search. Literature search is a subsequent phase unless the active OKF task explicitly enters audit mode.

#### OKF batch report
The primary output of every hourly run is a cumulative OKF research artifact under the UEKG experiment/research area. The report must record:

- batch/run ID and timestamp;
- exact input candidate hashes and source commits;
- queue composition and number reviewed;
- per-candidate disposition;
- proposed transformations;
- adversarial objections;
- metadata additions/requests;
- transfer facets;
- proof artifacts created or requested;
- candidates promoted to the frontier;
- candidates rescued from below the deterministic cutoff;
- unresolved questions and next batch selection state;
- aggregate counts such as KEEP/DROP/REVIEW and verified-rescue yield when verification exists.

Reports accumulate rather than overwrite history. A later run may refine or contradict an earlier inference, but must preserve provenance and the previous claim.

#### Epistemic boundary of Killer Test v5
The historical `triage_rescue_engine_v5.py` benchmark used deterministic Python reference rules to exercise the packet/queue/report plumbing. It was a harness smoke test, not evidence that an LLM autonomously discovered the encoded transformations. The production Tier 5 design is the recurring ChatGPT routine described here.

The value of Tier 5 is therefore longitudinal: many bounded batches are reviewed over time, rescue reports accumulate, metadata quality improves, and the frontier becomes denser. Lean remains the expensive formal certifier; ChatGPT is the recurring semantic researcher and hypothesis generator.


---

## 8. Related Work and Epistemic Context

### 8.1 Scientific Knowledge Bases and Ontologies
Ontologies such as Wikidata, DBpedia, and QUDT (Quantities, Units, Dimensions, and Types) capture hierarchical classifications and unit definitions. However, they represent equations as opaque LaTeX strings or informal metadata, lacking operator semantics, algebraic normalization, and proof-carrying solution transfer. The OpenMath standard provided the crucial insight of Content Dictionaries, which we elevate into an operational semantic intermediate representation.

### 8.2 Computer Algebra Systems and Symbolic Regression
Computer algebra systems (CAS) like Mathematica, Maple, and SymPy excel at symbolic simplification and Gröbner basis rewriting. Similarly, symbolic regression systems (e.g., AI Feynman, PySR) discover functional expressions from numerical datasets. However, these systems operate within a single mathematical context and lack the graded epistemic ladder necessary to detect physical domain violations or causal regime incompatibilities across disciplines.

### 8.3 Interactive Theorem Proving and Formalized Mathematics
The formalization of mathematics in proof assistants (Lean 4, Mathlib, Isabelle/HOL, Coq/Rocq) has achieved extraordinary milestones, from the Liquid Tensor Experiment to the formalization of Sphere Eversion. However, Mathlib's primary focus is pure mathematics. UEKG bridges formal interactive theorem proving with applied mathematical physics, introducing verified dimensional group homomorphisms, physical state space restrictions, and Bourbaki filter-theoretic asymptotic theory reductions.

### 8.4 Philosophy of Science and Structural Realism
In the philosophy of science, *Structural Realism* (Worrall, 1989; French, 2014) posits that what is preserved across scientific revolutions is not ontology, but mathematical structure. Furthermore, Mary Hesse's classical models of analogical reasoning distinguish between positive, negative, and neutral analogies. UEKG provides a concrete, computational realization of this philosophical program: Rungs 1–3 identify formal mathematical structures; Rung 4 separates positive analogies from negative analogies (disqualifying deceptive hard negatives); and Rung 5 certifies structural preservation.


### 8.5 What is known, and what may be novel

The novelty claim is deliberately calibrated. Exact wording that is absent from a search is not evidence of novelty, and each component of UEKG sits near substantial prior art.

| Component | Calibrated status | Claim boundary |
|---|---|---|
| Dimensional analysis, Buckingham-\(\Pi\), unit checking | **known_standard** | UEKG uses these as a type discipline; it does not claim their invention. |
| Mathematical analogy and cross-domain structural correspondence | **known_standard** | Classical science contains many such analogies; the contribution is operationalizing their admissibility and failure conditions. |
| Computer algebra / canonicalization | **known_standard** | CAS techniques are compiler components, not the novelty claim. |
| Interactive theorem proving | **known_standard** | Lean supplies proof authority; UEKG's contribution is how proof obligations are generated and attached to cross-model transfer. |
| Graded certification depth plus independently evidenced transfer facets | **possibly_novel_synthesis** | The claim is the architecture that separates “how strongly certified” from “what exactly transfers.” |
| Transfer obstructions as durable graph nodes linked to repair assumptions and proof obligations | **possibly_novel_formalization** | Prior work on analogy, counterexamples, refinement, and type errors is relevant; novelty requires continued prior-art audit. |
| Research-frontier compiler combining deterministic gates, bounded semantic review, posterior literature audit, and Lean certification | **possibly_novel_compiler_consequence** | The novelty candidate is the integrated scientific workflow, not any individual stage. |
| Proof-carrying reuse keys for particular scientific facets | **possibly_novel_compiler_consequence** | This remains a research direction until additional facet-specific regressions and formal bridge theorems are canonical. |

The strongest publication posture is therefore not “UEKG invents dimensional reasoning, scientific analogy, or dependency tracking.” It is:

> **UEKG proposes and empirically exercises a compiler architecture in which scientific reuse is typed by independently evidenced facets, blocked by explicit transfer obstructions, and promoted to high-value reuse only through auditable proof obligations.**

Future posterior audits should attempt to falsify even this narrower synthesis claim by searching neighboring terminology in formal methods, scientific model transformation, ontology alignment, program refinement, analogy engines, and proof-carrying compilation.


---

## 9. Threats to Validity and Epistemic Boundaries

To maintain strict scientific integrity, we explicitly demarcate the boundaries and current limitations of the framework:

1. **Non-Polynomial Equations & Transcendental Rewriting:** While polynomial expressions admit complete decision procedures via Gröbner bases, equations involving transcendental functions (e.g., trigonometric, Bessel, or hypergeometric functions) rely on heuristic term rewriting or Richardson's algorithm, which is undecidable in the general case.
2. **Dimensionless Empirical Correlations:** In fields such as empirical aerodynamics or chemical engineering, many equations are purely dimensionless numerical fits (e.g., empirical Nusselt-Reynolds correlations). For these models, Rung 3 (dimensional admissibility) is trivially satisfied, placing the entire burden of discrimination on Rung 4 (auxiliary domain constraints).
3. **Singular Asymptotic Boundaries:** While `Filter.Tendsto` correctly captures regular asymptotic limits, singular perturbations where the differential order of an equation drops (e.g., Navier-Stokes $\xrightarrow{\text{Re} \to \infty}$ Euler, or the boundary layer in Prandtl flows) require asymptotic matched expansions, which are not yet fully automated in the Lean 4 proof generator.
4. **Evidential Boundary Across Benchmarks:** Killer Test v2 is a controlled 378-pair benchmark across 28 models. Killer Test v3 scales ingestion and posterior audit, while v4 evaluates frontier compression and hidden-positive retention. These later experiments broaden operational scale but do not turn a small audited sample or a registered hidden-positive set into universal precision/recall guarantees.
5. **Formal Verification Tiers (Structural vs. Analytic):** Current automated Lean 4 compilation establishes R5-structural schema instantiation (`EquationTransferCertificates.lean`) and R6 parameterized differential residual commutation and invariant expression preservation (`SubstantiveCertificates.lean`). Full dynamic analytic derivation of solutions from ODEs/PDEs over $\mathbb{R}$ is demarcated as a subsequent formal tier (R7).
6. **Facet Incompleteness:** The current canonical implementation does not yet encode every scientifically meaningful facet. Source-local variable roles, ontology bindings, causal semantics, conservation structure, spectral data, and dependency slices require their own source-attested evidence and bridge theorems rather than being inferred from the existing ladder.
7. **Novelty Calibration:** The architectural synthesis may be distinctive, but its components have deep prior art. Novelty labels in this manuscript are hypotheses subject to posterior literature audit, not claims derived from terminology mismatch.

---

## 10. Conclusion

The Universal Equation Knowledge Graph is best understood not as a database of equations that are globally “the same,” but as a **compiler for typed scientific transfer**. Its graded ladder measures certification depth; its facets delimit transfer scope; its obstructions preserve negative knowledge; and its Lean artifacts provide proof authority for the most expensive forms of reuse.

This distinction changes the unit of scientific discovery. A useful result is no longer merely an edge between two models. It is an auditable object that states **which structure survives, under which assumptions, on which domain, with which provenance, what can be transported, and what is explicitly blocked**. The empirical lineage—from adversarial discrimination in Killer Test v2, through the sealed posterior audit in v3, to frontier compression in v4 and first-class Tier 5 obstructions—supports the practicality of this view while also exposing where heuristic similarity remains insufficient.

The long-term target is therefore a proof-carrying network of scientific transformations: not universal equivalence, but conditional transportability. Such a graph can reuse mathematics aggressively where the required facets are certified and remain deliberately conservative where evidence, metadata, or bridge theorems are missing.


---

## References & Lineage Artifacts

1. **OpenMath Standard:** Buswell, S., Caprotti, O., Carlisle, D. P., Dewar, M. C., Gaëtano, M., & Kohlhase, M. (2019). *The OpenMath Standard, Version 2.0*. The OpenMath Society. [https://openmath.org/standard/om20-2019-07-01/](https://openmath.org/standard/om20-2019-07-01/)
2. **Dimensional Analysis & Buckingham $\Pi$:** Buckingham, E. (1914). On physically similar systems; illustrations of the use of dimensional equations. *Physical Review*, 4(4), 345–376.
3. **Bridgman's Dimensional Theory:** Bridgman, P. W. (1922). *Dimensional Analysis*. Yale University Press.
4. **Structural Realism in Science:** Worrall, J. (1989). Structural realism: The best of both worlds? *Dialectica*, 43(1‐2), 99–124.
5. **Models and Analogies:** Hesse, M. B. (1966). *Models and Analogies in Science*. University of Notre Dame Press.
6. **Enzyme Kinetics Foundations:** Cornish-Bowden, A. (2012). *Fundamentals of Enzyme Kinetics* (4th ed.). Wiley-Blackwell.
7. **Adsorption Isotherms:** Langmuir, I. (1918). The adsorption of gases on plane surfaces of glass, mica and platinum. *Journal of the American Chemical Society*, 40(9), 1361–1403.
8. **Interactive Theorem Proving in Lean 4:** de Moura, L., & Ullrich, S. (2021). The Lean 4 theorem prover and programming language. In *Automated Deduction–CADE 28* (pp. 625–635). Springer, Cham.
9. **Scientific Equation Atlas Workflow:** GitHub Actions Run `#36014758176`; Internet Archive Snapshot: [`https://archive.org/details/atlas-ietf-rfcxml-formal-blocks-41e201186fb4f203-extracted`](https://archive.org/details/atlas-ietf-rfcxml-formal-blocks-41e201186fb4f203-extracted).
10. **Verified Lean 4 Contracts:** `formalizations/research_contracts/UniversalEquationGraph.lean`, `formalizations/research_contracts/EquationTransferCertificates.lean`, and `formalizations/research_contracts/SubstantiveCertificates.lean` (Lean 4.34.0 / Lake verified, 15/15 targets).
11. **Killer Test v1 Implementation & Findings:** `experiments/universal_equation_graph/killer_test_v1.py`, `experiments/universal_equation_graph/FINDINGS-KILLER-TEST-V1-2026-09-24.md`.
12. **Killer Test v2 Implementation & Findings:** `experiments/universal_equation_graph/killer_test_v2.py`, `experiments/universal_equation_graph/FINDINGS-KILLER-TEST-V2-2026-09-24.md`.
13. **Research Front Graph:** `research/research-fronts.md` (Node: `universal-equation-knowledge-graph`).
14. **Killer Test v3 Findings and Posterior Audit:** `experiments/universal_equation_graph/FINDINGS-KILLER-TEST-V3-2026-09-24.md` and `experiments/universal_equation_graph/FINDINGS-KILLER-TEST-V3-POSTERIOR-AUDIT-2026-09-24.md`.
15. **Killer Test v4 Research-Frontier Compiler:** `experiments/universal_equation_graph/FINDINGS-KILLER-TEST-V4-2026-09-24.md` and `experiments/universal_equation_graph/results/killer_test_v4_manifest.md`.
16. **Tier 5 Research Protocol and Transfer Obstructions:** `experiments/universal_equation_graph/T5-CHATGPT-HOURLY-BATCH-ROUTINE.md` and the authored `experiments/universal_equation_graph/tier5_reports/OBS-T5-*.md` nodes.
