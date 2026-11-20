import Lean

/-!
# Separação dos três objetos: invariantes de um estado inicial comum.

Este módulo não supõe valores históricos de velocidades de separação.
Componentes inteiras representam unidades configuráveis de velocidade
(por exemplo, milímetros por segundo), sem impor escala numérica.

O modelo assume separação num MESMO instante e posição de referência,
um corpo pai com velocidade `parent`, e três impulsos individuais.
Limites são por componente (norma L∞), não limites físicos medidos.

Não há ainda equações de movimento, arrasto ou propagação de TLE.
-/

namespace Conde1963.Separation

structure Vec3 where
  x : Int
  y : Int
  z : Int
  deriving Repr, DecidableEq

def add (a b : Vec3) : Vec3 :=
  ⟨a.x + b.x, a.y + b.y, a.z + b.z⟩

/-- Velocidade do objeto após um impulso instantâneo. -/
def afterImpulse (parent delta : Vec3) : Vec3 := add parent delta

/-- Caixa de incerteza simétrica: cada componente no intervalo [-bound,bound].
    A desigualdade é paramétrica e não determina bound. -/
def ComponentBound (delta : Vec3) (bound : Nat) : Prop :=
  -(bound : Int) ≤ delta.x ∧ delta.x ≤ (bound : Int) ∧
  -(bound : Int) ≤ delta.y ∧ delta.y ≤ (bound : Int) ∧
  -(bound : Int) ≤ delta.z ∧ delta.z ≤ (bound : Int)

structure CommonSeparation where
  position : Vec3
  parentVelocity : Vec3
  dv527 : Vec3
  dv528 : Vec3
  dv529 : Vec3
  max527 : Nat
  max528 : Nat
  max529 : Nat
  bound527 : ComponentBound dv527 max527
  bound528 : ComponentBound dv528 max528
  bound529 : ComponentBound dv529 max529

def v527 (s : CommonSeparation) : Vec3 :=
  afterImpulse s.parentVelocity s.dv527

def v528 (s : CommonSeparation) : Vec3 :=
  afterImpulse s.parentVelocity s.dv528

def v529 (s : CommonSeparation) : Vec3 :=
  afterImpulse s.parentVelocity s.dv529

/-- O componente x da diferença entre velocidades não depende da
    velocidade de referência comum; idem para y e z. -/
theorem x_diff_independent (s : CommonSeparation) :
    (v528 s).x - (v529 s).x = s.dv528.x - s.dv529.x := by
  simp [v528, v529, afterImpulse, add]
  omega

theorem y_diff_independent (s : CommonSeparation) :
    (v528 s).y - (v529 s).y = s.dv528.y - s.dv529.y := by
  simp [v528, v529, afterImpulse, add]
  omega

theorem z_diff_independent (s : CommonSeparation) :
    (v528 s).z - (v529 s).z = s.dv528.z - s.dv529.z := by
  simp [v528, v529, afterImpulse, add]
  omega

/-- Uma separação comum restringe as diferenças relativas: cada
    componente da diferença entre 528 e 529 é limitada pela soma
    dos limites individuais (desigualdade triangular L∞). -/
theorem pair_528_529_x (s : CommonSeparation) :
    -((s.max528 + s.max529 : Nat) : Int) ≤
      (v528 s).x - (v529 s).x ∧
    (v528 s).x - (v529 s).x ≤
      ((s.max528 + s.max529 : Nat) : Int) := by
  have ha := s.bound528
  have hb := s.bound529
  simp only [ComponentBound] at ha hb
  rw [x_diff_independent]
  omega

theorem pair_528_529_y (s : CommonSeparation) :
    -((s.max528 + s.max529 : Nat) : Int) ≤
      (v528 s).y - (v529 s).y ∧
    (v528 s).y - (v529 s).y ≤
      ((s.max528 + s.max529 : Nat) : Int) := by
  have ha := s.bound528
  have hb := s.bound529
  simp only [ComponentBound] at ha hb
  rw [y_diff_independent]
  omega

theorem pair_528_529_z (s : CommonSeparation) :
    -((s.max528 + s.max529 : Nat) : Int) ≤
      (v528 s).z - (v529 s).z ∧
    (v528 s).z - (v529 s).z ≤
      ((s.max528 + s.max529 : Nat) : Int) := by
  have ha := s.bound528
  have hb := s.bound529
  simp only [ComponentBound] at ha hb
  rw [z_diff_independent]
  omega

/-- A mesma desigualdade abrange 527 e 528: um dos pares de objetos
    pode ter sido um conjunto estágio + satélite, mas isso NÃO é
    inferido pela prova; a restrição depende de CommonSeparation. -/
theorem pair_527_528_x (s : CommonSeparation) :
    -((s.max527 + s.max528 : Nat) : Int) ≤
      (v527 s).x - (v528 s).x ∧
    (v527 s).x - (v528 s).x ≤
      ((s.max527 + s.max528 : Nat) : Int) := by
  have ha := s.bound527
  have hb := s.bound528
  simp only [ComponentBound] at ha hb
  simp [v527, v528, afterImpulse, add]
  omega

/-- Certificado de exclusão condicional: se uma hipótese candidata
    requer diferença x superior ao máximo, ela é incompatível com
    os limites fornecidos, quaisquer que sejam posição e parentVelocity. -/
theorem exclude_excessive_relative_x (s : CommonSeparation)
    (candidate : Int)
    (requires : candidate = (v528 s).x - (v529 s).x)
    (tooLarge : ((s.max528 + s.max529 : Nat) : Int) < candidate) :
    False := by
  have upper := (pair_528_529_x s).2
  omega

/-- Com limites 0, a diferença de velocidade dos corpos 528 e 529
    necessariamente é zero no instante de separação. -/
theorem zero_bounds_force_same_x (s : CommonSeparation)
    (h528 : s.max528 = 0) (h529 : s.max529 = 0) :
    (v528 s).x = (v529 s).x := by
  have h := pair_528_529_x s
  omega

end Conde1963.Separation
