import Lean

/-!
# Um núcleo formal da hipótese de Lara Resende

As taxas são inteiros em pontos-base (100 pontos-base = 1 ponto percentual).
Este arquivo formaliza hipóteses de equilíbrio de LONGO PRAZO, não uma
previsão empírica de inflação, nem a transição de curto prazo, nem a TFNP.

As igualdades 'Fisher' e 'juro real = crescimento real' são PREMISSAS.
Provar uma consequência lógica não prova essas premissas no Brasil real.
-/

namespace JurosMMT.Resende

/-- Equilíbrio de longo prazo sob duas hipóteses adicionais explícitas. -/
structure LongRun where
  nominalRate : Int
  realRate : Int
  inflation : Int
  growthRate : Int
  fisher : nominalRate = realRate + inflation
  realTracksGrowth : realRate = growthRate

/-- A equação π = i - g segue das hipóteses; não é uma lei universal. -/
theorem inflation_eq_rate_minus_growth (e : LongRun) :
    e.inflation = e.nominalRate - e.growthRate := by
  have hf := e.fisher
  have hg := e.realTracksGrowth
  omega

/--
Comparação de DOIS equilíbrios de longo prazo: se o crescimento é igual
e a taxa nominal é menor, a inflação também será menor nesse modelo.
Isso não demonstra a trajetória causal nem a velocidade de convergência.
-/
theorem rate_cut_lowers_long_run_inflation
    (before after : LongRun)
    (sameGrowth : after.growthRate = before.growthRate)
    (rateCut : after.nominalRate < before.nominalRate) :
    after.inflation < before.inflation := by
  have hb := inflation_eq_rate_minus_growth before
  have ha := inflation_eq_rate_minus_growth after
  omega

/-- Modelo contábil simplificado da dinâmica nominal de um período. -/
structure FiscalPeriod where
  debtOpening : Int
  debtClosing : Int
  interestCost : Int
  primarySurplus : Int
  stockFlow : debtClosing = debtOpening + interestCost - primarySurplus

/--
Mantidos dívida inicial e resultado primário, menor custo de juros
implica menor dívida final. É uma identidade contábil condicional.
-/
theorem lower_interest_lowers_closing_debt
    (before after : FiscalPeriod)
    (sameOpening : after.debtOpening = before.debtOpening)
    (samePrimary : after.primarySurplus = before.primarySurplus)
    (lowerInterest : after.interestCost ≤ before.interestCost) :
    after.debtClosing ≤ before.debtClosing := by
  have hb := before.stockFlow
  have ha := after.stockFlow
  omega

/-- Título indexado à taxa básica, com margem nominal fixa no período. -/
structure IndexedSecurity where
  policyRate : Int
  spread : Int
  couponRate : Int
  indexation : couponRate = policyRate + spread

/-- A remuneração indexada acompanha a taxa básica se o spread não mudar. -/
theorem indexed_coupon_pass_through
    (before after : IndexedSecurity)
    (sameSpread : after.spread = before.spread)
    (cut : after.policyRate ≤ before.policyRate) :
    after.couponRate ≤ before.couponRate := by
  have hb := before.indexation
  have ha := after.indexation
  omega

end JurosMMT.Resende
