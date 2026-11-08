import JurosMMT.NeoFisherian
import JurosMMT.FiscalTransmission

/-!
Controlled hypothetical experiments with matching nominal rate changes.

The neo-Fisherian model assumes constant long-run real rates.
The fiscal model assumes unit income-price sensitivity and no omitted
channels. Neither is a complete macroeconomic theory.

These theorems distinguish stipulated prediction functions. They do not
establish which theory is empirically correct.
-/

namespace JurosMMT.Identification

/-- Neo-Fisherian response at constant long-run real rates. -/
def neo (rateDelta : Int) : NeoFisherian.Response :=
  NeoFisherian.model rateDelta 0

/-- Unit fiscal income sensitivity; no omitted price effects. -/
def fiscal (rateDelta exposure compensationDelta : Int) :
    FiscalTransmission.Response :=
  FiscalTransmission.model rateDelta exposure 1 compensationDelta 0

/-- Rate change with no financial transfer compensation. -/
def simpleCut (rateDelta exposure : Int) :
    FiscalTransmission.Response :=
  fiscal rateDelta exposure 0

/-- Transfer exactly offsets the modeled interest-income change. -/
def compensatedCut (rateDelta exposure : Int) :
    FiscalTransmission.Response :=
  fiscal rateDelta exposure (-(exposure * rateDelta))

/-- Transfer-only change, with policy rate held fixed. -/
def incomeOnly (transferDelta exposure : Int) :
    FiscalTransmission.Response :=
  fiscal 0 exposure transferDelta

theorem neo_change (rateDelta : Int) :
    (neo rateDelta).inflationDelta = rateDelta := by
  exact NeoFisherian.stable_real_transmission (neo rateDelta) (by rfl)

theorem compensation_switches_off_fiscal_channel
    (rateDelta exposure : Int) :
    (compensatedCut rateDelta exposure).inflationDelta = 0 := by
  apply FiscalTransmission.compensated_rate_change_has_zero_inflation_effect
  · simp [compensatedCut, fiscal, FiscalTransmission.model]
  · rfl

/-- Test 1: the two modeled channels disagree for any nonzero compensated cut. -/
theorem compensated_cut_separates
    (rateDelta exposure : Int) (changed : rateDelta ≠ 0) :
    (neo rateDelta).inflationDelta ≠
      (compensatedCut rateDelta exposure).inflationDelta := by
  rw [neo_change, compensation_switches_off_fiscal_channel]
  exact changed

/-- Test 2: transfers at a fixed rate separate the two stipulated channels. -/
theorem income_only_separates (transferDelta exposure : Int)
    (changed : transferDelta ≠ 0) :
    (neo 0).inflationDelta ≠
      (incomeOnly transferDelta exposure).inflationDelta := by
  have h : (incomeOnly transferDelta exposure).inflationDelta =
      transferDelta := by
    have hx := FiscalTransmission.income_only_effect
      (incomeOnly transferDelta exposure) (by rfl) (by rfl)
    simpa [incomeOnly, fiscal, FiscalTransmission.model] using hx
  rw [neo_change, h]
  exact Ne.symm changed

/-- Unit exposure yields identical responses, so agreement need not identify a cause. -/
theorem simple_cut_agrees_at_unit_exposure (rateDelta : Int) :
    (simpleCut rateDelta 1).inflationDelta =
      (neo rateDelta).inflationDelta := by
  rw [neo_change]
  simp [simpleCut, fiscal, FiscalTransmission.model]

/-- With no indexed interest exposure, the predictions differ for a nonzero cut. -/
theorem no_exposure_separates (rateDelta : Int)
    (changed : rateDelta ≠ 0) :
    (simpleCut rateDelta 0).inflationDelta ≠
      (neo rateDelta).inflationDelta := by
  have h : (simpleCut rateDelta 0).inflationDelta = 0 := by
    simp [simpleCut, fiscal, FiscalTransmission.model]
  rw [h, neo_change]
  exact Ne.symm changed

/-- Synthetic, not calibrated to percent of GDP. -/
theorem exposure_heterogeneity_example :
    (simpleCut (-5) 0).inflationDelta = 0 ∧
    (simpleCut (-5) 2).inflationDelta = -10 ∧
    (neo (-5)).inflationDelta = -5 := by
  decide

/-- Four experimental arms under fixed assumptions (arbitrary units). -/
theorem four_arm_outcomes :
    (fiscal 0 2 0).inflationDelta = 0 ∧
    (simpleCut (-5) 2).inflationDelta = -10 ∧
    (compensatedCut (-5) 2).inflationDelta = 0 ∧
    (incomeOnly (-10) 2).inflationDelta = -10 ∧
    (neo (-5)).inflationDelta = -5 ∧
    (neo 0).inflationDelta = 0 := by
  decide


/-- A signed prediction gap, fiscal channel minus neo-Fisherian channel. -/
def predictedGap (f : FiscalTransmission.Response)
    (n : NeoFisherian.Response) : Int :=
  f.inflationDelta - n.inflationDelta

/--
General algebraic decomposition of disagreement, assuming the same
nominal rate change in both models.

  gap = (s * e - 1) * rateDelta + s * compensation + other + realDelta

This identity localizes the assumptions that can produce disagreement.
It is NOT an empirical law; all price-channel equalities are premises.
-/
theorem gap_decomposition (f : FiscalTransmission.Response)
    (n : NeoFisherian.Response)
    (sameRate : n.policyDelta = f.policyDelta) :
    predictedGap f n =
      (f.sensitivity * f.exposure - 1) * f.policyDelta +
      f.sensitivity * f.compensationDelta +
      f.otherPriceDelta + n.realDelta := by
  have hp := f.priceResponse
  have hnet := f.netIncomeAccounting
  have hint := f.interestPassThrough
  have hn := n.fisherChange
  rw [hnet, hint] at hp
  have hdist :
      f.sensitivity *
          (f.exposure * f.policyDelta + f.compensationDelta) =
        (f.sensitivity * f.exposure) * f.policyDelta +
          f.sensitivity * f.compensationDelta := by
    simp only [mul_add, mul_assoc]
  rw [hdist] at hp
  have hsub :
      (f.sensitivity * f.exposure - 1) * f.policyDelta =
        (f.sensitivity * f.exposure) * f.policyDelta -
          f.policyDelta := by
    rw [sub_mul, one_mul]
  dsimp [predictedGap]
  omega

/-- Two records predict distinct inflation precisely when their gap is nonzero. -/
theorem disagreement_iff_nonzero_gap
    (f : FiscalTransmission.Response) (n : NeoFisherian.Response) :
    f.inflationDelta ≠ n.inflationDelta ↔ predictedGap f n ≠ 0 := by
  dsimp [predictedGap]
  omega

end JurosMMT.Identification
