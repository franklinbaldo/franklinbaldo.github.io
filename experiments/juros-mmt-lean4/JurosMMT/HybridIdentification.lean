import Lean

/-!
A single two-channel, *hypothetical* inflation response specification.

The α term captures the residual effect of an intervention on the nominal
policy rate when recipient net income is held fixed. It is NOT synonymous
with a neo-Fisherian causal effect without additional equilibrium assumptions.

The β term captures a net recipient-income channel. It is NOT an asserted
law of Modern Monetary Theory. Both are stylized integer coefficients.
The four arms are synthetic, not calibrated to a particular economy.
-/

namespace JurosMMT.HybridIdentification

/-- Inflation response relative to the common control, in arbitrary units. -/
def response (alpha beta rateDelta incomeDelta : Int) : Int :=
  alpha * rateDelta + beta * incomeDelta

/-- Changing only the accounting label of a payment changes no net-income
response if the same person receives the same net total at the same time. -/
theorem label_invariance
    (alpha beta rateDelta interest transfer otherInterest otherTransfer : Int)
    (sameNet : interest + transfer = otherInterest + otherTransfer) :
    response alpha beta rateDelta (interest + transfer) =
      response alpha beta rateDelta (otherInterest + otherTransfer) := by
  rw [sameNet]

/-- The compensated-rate arm identifies alpha from otherwise equal responses,
without assuming anything about beta. -/
theorem compensated_arm_identifies_alpha
    (alpha beta alpha' beta' : Int)
    (same : response alpha beta (-5) 0 =
      response alpha' beta' (-5) 0) :
    alpha = alpha' := by
  simp only [response, Int.mul_zero, Int.add_zero] at same
  omega

/-- The income-only arm identifies beta without assuming anything about alpha. -/
theorem income_arm_identifies_beta
    (alpha beta alpha' beta' : Int)
    (same : response alpha beta 0 (-10) =
      response alpha' beta' 0 (-10)) :
    beta = beta' := by
  simp only [response, Int.mul_zero, Int.zero_add] at same
  omega

/-- Two independently varied interventions identify both parameters uniquely. -/
theorem two_arms_identify :
    Function.Injective
      (fun p : Int × Int =>
        (response p.1 p.2 (-5) 0, response p.1 p.2 0 (-10))) := by
  intro p q same
  apply Prod.ext
  · apply compensated_arm_identifies_alpha p.1 p.2 q.1 q.2
    exact congrArg Prod.fst same
  · apply income_arm_identifies_beta p.1 p.2 q.1 q.2
    exact congrArg Prod.snd same

/-- The fourth arm provides a restriction independent of the two
measurements that identified alpha and beta. This is a testable *model*
restriction, not an empirical validation of the model. -/
theorem four_arm_additivity (alpha beta : Int) :
    response alpha beta (-5) (-10) -
    response alpha beta (-5) 0 -
    response alpha beta 0 (-10) +
    response alpha beta 0 0 = 0 := by
  simp only [response, Int.mul_zero, Int.add_zero, Int.zero_add]
  omega

/-- The algebraic cross-arm restriction is equivalent to additive
decomposition of observed changes relative to a common control. -/
theorem contrast_iff_additive (p0 pComp pIncome pSimple : Int) :
    pSimple - pComp - pIncome + p0 = 0 ↔
      pSimple - p0 = (pComp - p0) + (pIncome - p0) := by
  omega

/-- A nonzero interaction between rate and income produces an observable
failure of the additive four-arm restriction. -/
def interactionResponse (alpha beta interaction rateDelta incomeDelta : Int) :
    Int :=
  response alpha beta rateDelta incomeDelta +
    interaction * rateDelta * incomeDelta

theorem interaction_countermodel :
    interactionResponse 0 0 1 (-5) (-10) -
    interactionResponse 0 0 1 (-5) 0 -
    interactionResponse 0 0 1 0 (-10) +
    interactionResponse 0 0 1 0 0 = 50 := by
  decide

/-- Collinear rate and income changes cannot distinguish parameter pairs:
(alpha-e*t,beta+t) and (alpha,beta) give the same prediction at *every*
rate change when the recipient income always changes by e times the rate. -/
theorem collinear_observational_equivalence
    (alpha beta exposure shift rateDelta : Int) :
    response (alpha - exposure * shift) (beta + shift)
        rateDelta (exposure * rateDelta) =
      response alpha beta rateDelta (exposure * rateDelta) := by
  dsimp [response]
  rw [Int.sub_mul, Int.add_mul]
  have hcomm : (exposure * shift) * rateDelta =
      shift * (exposure * rateDelta) := by
    rw [Int.mul_comm exposure shift, Int.mul_assoc]
  rw [hcomm]
  omega

/-- Even arbitrarily many observations along a fixed proportional
rate/income relation cannot uniquely identify the two coefficients. -/
theorem proportional_changes_not_identifying (exposure : Int) :
    ¬ Function.Injective
      (fun p : Int × Int =>
        fun rateDelta : Int =>
          response p.1 p.2 rateDelta (exposure * rateDelta)) := by
  intro hinj
  have hSame :
      (fun rateDelta : Int =>
        response (-exposure) 1 rateDelta (exposure * rateDelta)) =
      (fun rateDelta : Int =>
        response 0 0 rateDelta (exposure * rateDelta)) := by
    funext rateDelta
    simpa using
      (collinear_observational_equivalence 0 0 exposure 1 rateDelta)
  have hPairs : ((-exposure, 1) : Int × Int) = (0, 0) :=
    hinj hSame
  have hImpossible : (1 : Int) = 0 := congrArg Prod.snd hPairs
  omega


/-- A generic two-intervention observation map with integer-valued
responses and coefficients. Uniqueness does not assert that every
possible observed pair has an integer-valued solution. -/
def twoObservations (d1 y1 d2 y2 : Int) (params : Int × Int) :
    Int × Int :=
  (response params.1 params.2 d1 y1,
   response params.1 params.2 d2 y2)

/--
Two experimental interventions with nonzero 2×2 determinant uniquely
identify the coefficients in the *specified linear response model*.
This is a rank criterion; no empirical causal identification is implied.
-/
theorem nonzero_determinant_identifies
    (d1 y1 d2 y2 : Int)
    (rank : d1 * y2 - d2 * y1 ≠ 0) :
    Function.Injective (twoObservations d1 y1 d2 y2) := by
  intro p q h
  have h1 : p.1 * d1 + p.2 * y1 =
      q.1 * d1 + q.2 * y1 := by
    exact congrArg Prod.fst h
  have h2 : p.1 * d2 + p.2 * y2 =
      q.1 * d2 + q.2 * y2 := by
    exact congrArg Prod.snd h
  let x : Int := p.1 - q.1
  let z : Int := p.2 - q.2
  have hlin1 : x * d1 + z * y1 = 0 := by
    dsimp [x, z]
    rw [Int.sub_mul, Int.sub_mul]
    omega
  have hlin2 : x * d2 + z * y2 = 0 := by
    dsimp [x, z]
    rw [Int.sub_mul, Int.sub_mul]
    omega
  have h1scaled : x * (d1 * y2) + z * (y1 * y2) = 0 := by
    have hscaled := congrArg (fun a : Int => a * y2) hlin1
    simpa only [Int.add_mul, Int.mul_assoc, Int.zero_mul] using hscaled
  have h2scaled : x * (d2 * y1) + z * (y2 * y1) = 0 := by
    have hscaled := congrArg (fun a : Int => a * y1) hlin2
    simpa only [Int.add_mul, Int.mul_assoc, Int.zero_mul] using hscaled
  have hswap : z * (y2 * y1) = z * (y1 * y2) := by
    rw [Int.mul_comm y2 y1]
  rw [hswap] at h2scaled
  have hfactor : x * (d1 * y2 - d2 * y1) = 0 := by
    rw [Int.mul_sub]
    omega
  have hx : x = 0 := by
    cases Int.mul_eq_zero.mp hfactor with
    | inl hzero => exact hzero
    | inr hzero => exact False.elim (rank hzero)
  have hz1 : z * y1 = 0 := by
    rw [hx] at hlin1
    simpa only [Int.zero_mul, Int.zero_add] using hlin1
  have hz2 : z * y2 = 0 := by
    rw [hx] at hlin2
    simpa only [Int.zero_mul, Int.zero_add] using hlin2
  have hz : z = 0 := by
    by_cases hy1 : y1 = 0
    · have hy2 : y2 ≠ 0 := by
        intro hzero
        rw [hy1, hzero] at rank
        simp at rank
      cases Int.mul_eq_zero.mp hz2 with
      | inl hzero => exact hzero
      | inr hzero => exact False.elim (hy2 hzero)
    · cases Int.mul_eq_zero.mp hz1 with
      | inl hzero => exact hzero
      | inr hzero => exact False.elim (hy1 hzero)
  have ha : p.1 = q.1 := by
    dsimp [x] at hx
    omega
  have hb : p.2 = q.2 := by
    dsimp [z] at hz
    omega
  exact Prod.ext ha hb

/-- The two-arm design in this work has determinant 50, so the generic
full-rank theorem specializes to the four-arm experiment. -/
theorem original_design_full_rank :
    Function.Injective (twoObservations (-5) 0 0 (-10)) := by
  apply nonzero_determinant_identifies
  decide

end JurosMMT.HybridIdentification
