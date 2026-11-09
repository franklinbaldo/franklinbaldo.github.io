import Lean

/-!
An explicit hypothetical MMT-inspired fiscal-income price channel.
This is NOT a general inflation law of MMT.

The model stipulates:
  interestDelta = exposure * policyDelta
  netIncomeDelta = interestDelta + compensationDelta
  inflationDelta = sensitivity * netIncomeDelta + otherPriceDelta

OtherPriceDelta collects credit, exchange rate, cost and expectation channels.
All three equalities are modeling premises, not empirical discoveries.
Exposure/sensitivity are integer-valued in arbitrary experimental units;
this is not dimensionally calibrated to GDP shares.
-/

namespace JurosMMT.FiscalTransmission

structure Response where
  policyDelta : Int
  exposure : Int
  interestDelta : Int
  compensationDelta : Int
  netIncomeDelta : Int
  sensitivity : Int
  otherPriceDelta : Int
  inflationDelta : Int
  interestPassThrough : interestDelta = exposure * policyDelta
  netIncomeAccounting : netIncomeDelta = interestDelta + compensationDelta
  priceResponse : inflationDelta = sensitivity * netIncomeDelta + otherPriceDelta

/-- Constructor for controlled hypothetical interventions. -/
def model
    (policyDelta exposure sensitivity compensationDelta otherPriceDelta : Int) :
    Response where
  policyDelta := policyDelta
  exposure := exposure
  interestDelta := exposure * policyDelta
  compensationDelta := compensationDelta
  netIncomeDelta := exposure * policyDelta + compensationDelta
  sensitivity := sensitivity
  otherPriceDelta := otherPriceDelta
  inflationDelta :=
    sensitivity * (exposure * policyDelta + compensationDelta) + otherPriceDelta
  interestPassThrough := rfl
  netIncomeAccounting := rfl
  priceResponse := rfl

/-- Full financial compensation eliminates this price channel if other effects vanish. -/
theorem compensated_rate_change_has_zero_inflation_effect
    (f : Response)
    (compensated : f.compensationDelta = -f.interestDelta)
    (noOther : f.otherPriceDelta = 0) :
    f.inflationDelta = 0 := by
  have hnet : f.netIncomeDelta = 0 := by
    have h := f.netIncomeAccounting
    omega
  rw [f.priceResponse, hnet, noOther]
  simp

/-- With no rate change, this model attributes price change to net transfers. -/
theorem income_only_effect
    (f : Response)
    (fixedRate : f.policyDelta = 0)
    (noOther : f.otherPriceDelta = 0) :
    f.inflationDelta = f.sensitivity * f.compensationDelta := by
  have hi : f.interestDelta = 0 := by
    rw [f.interestPassThrough, fixedRate]
    simp
  have hn : f.netIncomeDelta = f.compensationDelta := by
    have h := f.netIncomeAccounting
    omega
  rw [f.priceResponse, hn, noOther]
  simp

/-- No exposure, compensation or omitted channel means no fiscal price effect. -/
theorem zero_exposure_no_fiscal_price_effect
    (f : Response)
    (noExposure : f.exposure = 0)
    (noCompensation : f.compensationDelta = 0)
    (noOther : f.otherPriceDelta = 0) :
    f.inflationDelta = 0 := by
  have hi : f.interestDelta = 0 := by
    rw [f.interestPassThrough, noExposure]
    simp
  exact compensated_rate_change_has_zero_inflation_effect f
    (by omega) noOther

end JurosMMT.FiscalTransmission
