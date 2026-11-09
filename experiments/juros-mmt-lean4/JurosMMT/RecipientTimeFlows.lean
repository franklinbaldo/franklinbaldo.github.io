import Lean

/-!
A minimal recipient-and-period account of nominal fiscal transfers.

Payments have four pieces of information: recipient, period, signed
nominal amount, and a Boolean interest-versus-transfer accounting label.

The type does not model changes in assets, taxes, funding, credit or
expectations. All invariance results are conditional on predictions
depending only on the policy-rate change and the recipient-period
net-income schedule. That assumption is explicit, not a general
statement that every real-world payment is equivalent.
-/

namespace JurosMMT.RecipientTimeFlows

/-- One signed nominal payment to one recipient in one accounting period. -/
structure Payment where
  recipient : Nat
  period : Nat
  amount : Int
  interestLabel : Bool
  deriving Repr, DecidableEq

/-- The contribution to one recipient at one period; labels are not inputs. -/
def contribution (p : Payment) (recipient period : Nat) : Int :=
  if p.recipient = recipient ∧ p.period = period then p.amount else 0

/-- Net money received by a particular recipient in a particular period. -/
def netIncome : List Payment → Nat → Nat → Int
  | [], _, _ => 0
  | p :: rest, recipient, period =>
      contribution p recipient period + netIncome rest recipient period

/-- Total nominal payment, deliberately forgetting recipient and period. -/
def totalAmount : List Payment → Int
  | [] => 0
  | p :: rest => p.amount + totalAmount rest

/-- Change any accounting label while preserving amount, recipient, date. -/
def changeLabels (f : Bool → Bool) (payments : List Payment) : List Payment :=
  payments.map (fun p => {p with interestLabel := f p.interestLabel})

/-- Non olet: relabeling alone cannot change any recipient-period net income. -/
theorem label_invariance (f : Bool → Bool) (payments : List Payment)
    (recipient period : Nat) :
    netIncome (changeLabels f payments) recipient period =
      netIncome payments recipient period := by
  induction payments with
  | nil => rfl
  | cons p rest ih =>
      simp [changeLabels, netIncome, contribution, ih]

/-- A one-payment ledger. -/
def single (recipient period : Nat) (amount : Int) (interest : Bool) :
    List Payment :=
  [{recipient := recipient, period := period,
    amount := amount, interestLabel := interest}]

/-- A loss of interest exactly offset by a transfer to the same recipient
in the same period; the two amounts sum to the original payment. -/
def sameRecipientCompensation (recipient period : Nat)
    (original lostInterest : Int) : List Payment :=
  [{recipient := recipient, period := period,
    amount := original - lostInterest, interestLabel := true},
   {recipient := recipient, period := period,
    amount := lostInterest, interestLabel := false}]

/-- Exact recipient/time compensation preserves every entry of the
net-income schedule, not just the economy-wide total. -/
theorem exact_compensation_preserves_net_income
    (recipient period : Nat) (original lostInterest : Int)
    (observer observationPeriod : Nat) :
    netIncome (single recipient period original true) observer observationPeriod =
      netIncome (sameRecipientCompensation recipient period original lostInterest)
        observer observationPeriod := by
  by_cases h : recipient = observer ∧ period = observationPeriod
  · simp [single, sameRecipientCompensation, netIncome, contribution, h] <;> omega
  · simp [single, sameRecipientCompensation, netIncome, contribution, h] <;> omega

/-- A model may depend on the full recipient-period income schedule and
on a separate policy-rate change, but not on the bookkeeping label. -/
def predictedOutcome (predict : Int → (Nat → Nat → Int) → Int)
    (rateDelta : Int) (payments : List Payment) : Int :=
  predict rateDelta (fun recipient period => netIncome payments recipient period)

/-- Any outcome function of rate and the net-income schedule respects
recipient/time-equivalent ledgers when the rate change is fixed. -/
theorem prediction_invariant_when_net_flows_equal
    (predict : Int → (Nat → Nat → Int) → Int) (rateDelta : Int)
    (a b : List Payment)
    (sameFlows : ∀ recipient period,
      netIncome a recipient period = netIncome b recipient period) :
    predictedOutcome predict rateDelta a =
      predictedOutcome predict rateDelta b := by
  have h : (fun recipient period => netIncome a recipient period) =
      (fun recipient period => netIncome b recipient period) := by
    funext recipient period
    exact sameFlows recipient period
  simp [predictedOutcome, h]

/-- Non olet remains valid for every such downstream predictor.
This does not claim that changing the policy rate has no other effects. -/
theorem prediction_ignores_labels
    (predict : Int → (Nat → Nat → Int) → Int)
    (rateDelta : Int) (f : Bool → Bool) (payments : List Payment) :
    predictedOutcome predict rateDelta (changeLabels f payments) =
      predictedOutcome predict rateDelta payments := by
  apply prediction_invariant_when_net_flows_equal
  intro recipient period
  exact label_invariance f payments recipient period

/-- Restoring the very same recipient-period net income cannot affect
this model's prediction at a fixed policy rate. -/
theorem compensation_preserves_prediction
    (predict : Int → (Nat → Nat → Int) → Int)
    (rateDelta : Int) (recipient period : Nat)
    (original lostInterest : Int) :
    predictedOutcome predict rateDelta (single recipient period original true) =
      predictedOutcome predict rateDelta
        (sameRecipientCompensation recipient period original lostInterest) := by
  apply prediction_invariant_when_net_flows_equal
  intro observer observationPeriod
  exact exact_compensation_preserves_net_income
    recipient period original lostInterest observer observationPeriod

/-- A distribution-sensitive hypothetical spending index, NOT a price law. -/
def weightedDemand (payments : List Payment) : Int :=
  netIncome payments 0 0 + 2 * netIncome payments 1 0

/-- Two ledgers can have the same total, while sending the money to
different persons and producing different values under a specified
distribution-sensitive response function. -/
theorem equal_total_can_mask_recipient_difference :
    totalAmount (single 0 0 10 true) =
      totalAmount (single 1 0 10 false) ∧
    netIncome (single 0 0 10 true) 0 0 ≠
      netIncome (single 1 0 10 false) 0 0 ∧
    weightedDemand (single 0 0 10 true) ≠
      weightedDemand (single 1 0 10 false) := by
  decide

/-- Holding the amount and recipient fixed while changing the payment
period also changes the time-indexed income schedule. -/
theorem equal_total_can_mask_timing_difference :
    totalAmount (single 0 0 10 true) =
      totalAmount (single 0 1 10 false) ∧
    netIncome (single 0 0 10 true) 0 0 ≠
      netIncome (single 0 1 10 false) 0 0 := by
  decide

end JurosMMT.RecipientTimeFlows
