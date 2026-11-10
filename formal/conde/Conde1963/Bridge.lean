import Conde1963.Separation
import Conde1963.Reachability

/-!
Ponte formal: limites de separação comuns alimentam a alcançabilidade
da coordenada x RELATIVA entre 528 e 529.

Condicional à simultaneidade e ao limite A de aceleração relativa.
Não há data/hora nem limite de arrasto historicamente calibrado.
-/

namespace Conde1963.Bridge

open Conde1963.Separation
open Conde1963.Reachability

/-- Todo deslocamento relativo x admissível é limitado pelo raio
calculado do limite inicial de impulso somado e da aceleração relativa. -/
theorem separation_implies_reachability_x
    (s : CommonSeparation)
    (relativeAcceleration : Nat → Int) (A n : Nat)
    (hacc : ∀ t, -(A : Int) ≤ relativeAcceleration t ∧
      relativeAcceleration t ≤ (A : Int)) :
    -((displacementRadius (s.max528 + s.max529) A n : Nat) : Int) ≤
      displacement ((v528 s).x - (v529 s).x) relativeAcceleration n ∧
      displacement ((v528 s).x - (v529 s).x) relativeAcceleration n ≤
      ((displacementRadius (s.max528 + s.max529) A n : Nat) : Int) := by
  exact displacement_inside
    ((v528 s).x - (v529 s).x) relativeAcceleration
    (s.max528 + s.max529) A (pair_528_529_x s) hacc n

/-- Certificado abstrato de exclusão de uma medição relativa cuja
    coordenada x exceda o limite de alcançabilidade. -/
theorem reject_observation_above_reachability_x
    (s : CommonSeparation)
    (relativeAcceleration : Nat → Int) (A n : Nat)
    (hacc : ∀ t, -(A : Int) ≤ relativeAcceleration t ∧
      relativeAcceleration t ≤ (A : Int))
    (measurement : Int)
    (hmeasurement : measurement =
      displacement ((v528 s).x - (v529 s).x) relativeAcceleration n)
    (houtside : ((displacementRadius (s.max528 + s.max529) A n : Nat) : Int) <
      measurement) : False := by
  exact exclude_above_displacement_radius
    ((v528 s).x - (v529 s).x) relativeAcceleration
    (s.max528 + s.max529) A n
    (pair_528_529_x s) hacc measurement hmeasurement houtside

end Conde1963.Bridge
