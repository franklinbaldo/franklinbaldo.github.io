import Lean

/-!
# Núcleo contábil-operacional inspirado na Teoria Monetária Moderna (MMT)

As taxas e os fluxos são inteiros, em unidades arbitrárias; taxas em
pontos-base. Este é um MODELO PARCIAL de premissas operacionais, não uma
axiomatização exaustiva da literatura MMT.

A hipótese de liquidação nominal na unidade monetária própria é declarada
como campo; não é deduzida da lógica nem afirma ausência de restrições
legais, de recursos reais, cambiais ou de inflação.
-/

namespace JurosMMT.MMT

/-- Fluxos consolidados num período, em valores nominais. -/
structure FiscalFlows where
  primarySpending : Int
  taxes : Int
  interestPayments : Int
  netPrivateInjection : Int
  accounting : netPrivateInjection = primarySpending + interestPayments - taxes

/-- Juros pagos são parte da injeção nominal líquida no setor não estatal. -/
theorem interest_is_a_fiscal_flow (f : FiscalFlows) :
    f.netPrivateInjection - f.primarySpending + f.taxes =
      f.interestPayments := by
  have h := f.accounting
  omega

/--
Com gastos primários e impostos mantidos, menos pagamentos de juros
significam menor injeção NOMINAL líquida; nada é provado sobre preços.
-/
theorem lower_interest_reduces_net_injection
    (before after : FiscalFlows)
    (sameSpending : after.primarySpending = before.primarySpending)
    (sameTaxes : after.taxes = before.taxes)
    (lowerInterest : after.interestPayments ≤ before.interestPayments) :
    after.netPrivateInjection ≤ before.netPrivateInjection := by
  have hb := before.accounting
  have ha := after.accounting
  omega

/--
A soberania monetária aparece aqui como capacidade operacional de
liquidação nominal na moeda emitida. Regras institucionais e efeitos reais
são questões distintas.
-/
structure MonetaryEconomy where
  policyRate : Int
  inflation : Int
  growthRate : Int
  realDemand : Int
  productiveCapacity : Int
  canSettleOwnCurrency : Nat → Prop
  ownCurrencySettlement : ∀ amount, canSettleOwnCurrency amount

/-- A restrição real, ausente da condição de liquidação financeira. -/
def withinResources (e : MonetaryEconomy) : Prop :=
  e.realDemand ≤ e.productiveCapacity

/--
Exemplo de economia com capacidade nominal de liquidar pagamentos.
Os números ilustram possibilidades lógicas, não calibram o Brasil.
-/
def sample (rate prices growth demand capacity : Int) : MonetaryEconomy where
  policyRate := rate
  inflation := prices
  growthRate := growth
  realDemand := demand
  productiveCapacity := capacity
  canSettleOwnCurrency := fun _ => True
  ownCurrencySettlement := by
    intro _
    trivial

/--
Contraexemplo lógico: poder liquidar na moeda própria não garante
que a demanda real caiba na capacidade produtiva.
-/
theorem nominal_settlement_does_not_ensure_real_capacity :
    ∃ e : MonetaryEconomy,
      (∀ amount, e.canSettleOwnCurrency amount) ∧ ¬ withinResources e := by
  refine ⟨sample 500 300 200 101 100, ?_, ?_⟩
  · intro _
    trivial
  · simp [withinResources, sample]

/--
O núcleo MMT definido acima não impõe inflação única para a mesma
taxa nominal. Isso NÃO refuta a hipótese neofisheriana acrescida de
premissas de equilíbrio de longo prazo.
-/
theorem same_rate_can_coexist_with_different_inflation :
    ∃ a b : MonetaryEconomy,
      a.policyRate = b.policyRate ∧ a.inflation ≠ b.inflation := by
  refine ⟨sample 500 300 200 90 100,
          sample 500 400 200 90 100, ?_, ?_⟩
  · rfl
  · decide

/--
A fórmula π = i - g não decorre apenas dos campos operacionais da MMT.
É um contraMODELO de implicação, não um contraexemplo histórico.
-/
theorem fisher_growth_formula_is_not_forced :
    ∃ e : MonetaryEconomy, e.inflation ≠ e.policyRate - e.growthRate := by
  refine ⟨sample 500 300 100 90 100, ?_⟩
  decide

end JurosMMT.MMT
