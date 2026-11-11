import Conde1963.Separation
import Conde1963.Reachability
import Conde1963.Bridge

/-!
# Conde 1963: núcleo lógico de restrições

Este arquivo NÃO prova mecânica orbital, trajetória, arrasto ou queda.
Formaliza somente implicações lógicas e um contraexemplo à inferência
"três datas de reentrada + origem comum ⇒ longitude do NORAD 528".

A latitude e longitude usam unidades de 1/10000 de grau.
Cada data é um inteiro YYYYMMDD; não há hora de reentrada conhecida.
-/

namespace Conde1963

/-- Estado hipotético, não observado. As datas são civis YYYYMMDD. -/
structure Scenario where
  launch : Nat
  commonOrigin : Bool
  reentry528 : Nat
  reentry529 : Nat
  reentry527 : Nat
  latitude528 : Int
  longitude528 : Int
  deriving Repr, DecidableEq

/-- Apenas os registros históricos usados nesta rodada.
    Não há longitude, latitude ou horário de queda nesta premissa. -/
def Observed (s : Scenario) : Prop :=
  s.launch = 19630116 ∧
  s.commonOrigin = true ∧
  s.reentry528 = 19631108 ∧
  s.reentry529 = 19631231 ∧
  s.reentry527 = 19690109

/-- Limite idealizado da latitude subsatélite para inclinação 81.8615°.
    NÃO é uma restrição sobre a área de dispersão de detritos em solo. -/
def InInclinationBand (latitude : Int) : Prop :=
  (-818615 : Int) ≤ latitude ∧ latitude ≤ 818615

/-- Conde (valores aproximados para a demonstração, 1/10000 de grau). -/
def Conde (s : Scenario) : Prop :=
  s.latitude528 = -118138 ∧ s.longitude528 = -376106

/-- Origem comum, datas catalogadas e queda hipotética em Conde. -/
def scenarioConde : Scenario where
  launch := 19630116
  commonOrigin := true
  reentry528 := 19631108
  reentry529 := 19631231
  reentry527 := 19690109
  latitude528 := -118138
  longitude528 := -376106

/-- Outro ponto da mesma latitude, com mesma origem e mesmas três datas.
    É um contraexemplo *lógico*, não uma trajetória fisicamente possível. -/
def scenarioElsewhere : Scenario :=
  { scenarioConde with longitude528 := -639000 }

theorem conde_inside_inclination_band :
    InInclinationBand (-118138) := by
  unfold InInclinationBand
  decide

theorem porto_velho_inside_inclination_band :
    InInclinationBand (-87600) := by
  unfold InInclinationBand
  decide

theorem north_pole_outside_inclination_band :
    ¬ InInclinationBand (900000) := by
  unfold InInclinationBand
  decide

theorem both_scenarios_match_recorded_dates :
    Observed scenarioConde ∧ Observed scenarioElsewhere := by
  unfold Observed scenarioConde scenarioElsewhere
  decide

theorem locations_differ :
    scenarioConde.longitude528 ≠ scenarioElsewhere.longitude528 := by
  unfold scenarioConde scenarioElsewhere
  decide

/-- As observações empregadas não implicam que a queda tenha sido em Conde.
    A prova não declara que qualquer cenário tenha um movimento orbital real. -/
theorem observations_do_not_imply_conde :
    ¬ (∀ s : Scenario, Observed s → Conde s) := by
  intro claim
  have compatible : Observed scenarioElsewhere := by
    unfold Observed scenarioElsewhere scenarioConde
    decide
  have forced : Conde scenarioElsewhere := claim scenarioElsewhere compatible
  have notConde : ¬ Conde scenarioElsewhere := by
    unfold Conde scenarioElsewhere scenarioConde
    decide
  exact notConde forced

/-- Um novo requisito só estreita o conjunto admissível. -/
def Refine (base extra : Scenario → Prop) (s : Scenario) : Prop :=
  base s ∧ extra s

theorem refine_subset (base extra : Scenario → Prop) (s : Scenario) :
    Refine base extra s → base s := by
  intro h
  exact h.1

/-- Uma hipótese já excluída não reaparece ao acrescentar requisitos. -/
theorem excluded_stays_excluded
    (base extra : Scenario → Prop) (s : Scenario)
    (excluded : ¬ base s) :
    ¬ Refine base extra s := by
  intro refined
  exact excluded refined.1

/-- Um certificado de exclusão para o conjunto base continua válido
    depois de qualquer restrição adicional. -/
theorem exclusion_monotone
    (base extra target : Scenario → Prop)
    (exclude : ∀ s, base s → ¬ target s) :
    ∀ s, Refine base extra s → ¬ target s := by
  intro s hs
  exact exclude s hs.1

end Conde1963
