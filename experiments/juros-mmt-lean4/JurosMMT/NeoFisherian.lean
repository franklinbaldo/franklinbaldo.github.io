import Lean

/-!
A minimal long-run neo-Fisherian intervention hypothesis.

All changes are signed integer basis-point units. The field
fisherChange is an explicit premise. It is not a derived causal
statement about a central bank or an adjustment trajectory.
-/

namespace JurosMMT.NeoFisherian

/-- Difference between two hypothetical long-run equilibria. -/
structure Response where
  policyDelta : Int
  realDelta : Int
  inflationDelta : Int
  fisherChange : policyDelta = realDelta + inflationDelta

/-- One-for-one adjustment under the additional constant-real-rate premise. -/
theorem stable_real_transmission (n : Response)
    (stable : n.realDelta = 0) :
    n.inflationDelta = n.policyDelta := by
  have h := n.fisherChange
  omega

/-- Construct a consistent response from nominal and real-rate changes. -/
def model (policyDelta realDelta : Int) : Response where
  policyDelta := policyDelta
  realDelta := realDelta
  inflationDelta := policyDelta - realDelta
  fisherChange := by omega

end JurosMMT.NeoFisherian
