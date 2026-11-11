import Lean

/-!
# Envelopes condicionais de movimento relativo (uma coordenada).

É um sistema discreto de dupla integração:
  v(t+1) = v(t) + a(t)
  x(t+1) = x(t) + v(t)

Cada passo é uma unidade de tempo declarada pelo usuário do modelo.
v e a são diferenças entre DOIS objetos, NÃO posições orbitais absolutas.
Para dois corpos provenientes da mesma posição, x(0)=0.

Dados somente os limites |v(0)|≤K e |a(t)|≤A, demonstramos
um intervalo que contém TODOS os estados relativos admissíveis.
Nenhum valor numérico histórico foi pressuposto.

Esse sistema não substitui propagação SGP4, J2, atmosfera ou geometria esférica.
-/

namespace Conde1963.Reachability

/-- Velocidade relativa em função de um impulso relativo inicial e acelerações relativas. -/
def velocity (initial : Int) (acc : Nat → Int) : Nat → Int
  | 0 => initial
  | n + 1 => velocity initial acc n + acc n

/-- Deslocamento relativo a partir da mesma posição no instante zero. -/
def displacement (initial : Int) (acc : Nat → Int) : Nat → Int
  | 0 => 0
  | n + 1 => displacement initial acc n + velocity initial acc n

/-- Raios dos intervalos (sem arredondamentos numéricos). -/
def velocityRadius (K A : Nat) : Nat → Nat
  | 0 => K
  | n + 1 => velocityRadius K A n + A

def displacementRadius (K A : Nat) : Nat → Nat
  | 0 => 0
  | n + 1 => displacementRadius K A n + velocityRadius K A n

/-- Sob limites por passo, a velocidade relativa permanece em um intervalo provado. -/
theorem velocity_inside
    (initial : Int) (acc : Nat → Int) (K A : Nat)
    (hinit : -(K : Int) ≤ initial ∧ initial ≤ (K : Int))
    (hacc : ∀ n, -(A : Int) ≤ acc n ∧ acc n ≤ (A : Int)) :
    ∀ n, -((velocityRadius K A n : Nat) : Int) ≤ velocity initial acc n ∧
      velocity initial acc n ≤ ((velocityRadius K A n : Nat) : Int) := by
  intro n
  induction n with
  | zero =>
      simpa [velocity, velocityRadius] using hinit
  | succ n ih =>
      have ha := hacc n
      simp only [velocity, velocityRadius]
      omega

/-- Intervalo certificado para a posição relativa sem conhecer a sequência de acelerações. -/
theorem displacement_inside
    (initial : Int) (acc : Nat → Int) (K A : Nat)
    (hinit : -(K : Int) ≤ initial ∧ initial ≤ (K : Int))
    (hacc : ∀ n, -(A : Int) ≤ acc n ∧ acc n ≤ (A : Int)) :
    ∀ n, -((displacementRadius K A n : Nat) : Int) ≤
      displacement initial acc n ∧
      displacement initial acc n ≤ ((displacementRadius K A n : Nat) : Int) := by
  have hv := velocity_inside initial acc K A hinit hacc
  intro n
  induction n with
  | zero =>
      simp [displacement, displacementRadius]
  | succ n ih =>
      have hn := hv n
      simp only [displacement, displacementRadius]
      omega

/-- Dados adicionais são úteis se restringirem observações:
    um candidato cuja separação observada está fora do intervalo é impossível
    SOB os limites de impulso e aceleração escolhidos. -/
theorem exclude_above_displacement_radius
    (initial : Int) (acc : Nat → Int) (K A n : Nat)
    (hinit : -(K : Int) ≤ initial ∧ initial ≤ (K : Int))
    (hacc : ∀ t, -(A : Int) ≤ acc t ∧ acc t ≤ (A : Int))
    (observed : Int)
    (measurement : observed = displacement initial acc n)
    (outside : ((displacementRadius K A n : Nat) : Int) < observed) :
    False := by
  have h := (displacement_inside initial acc K A hinit hacc n).2
  omega

/-- Exclui também qualquer observação inteiramente abaixo do raio negativo. -/
theorem exclude_below_displacement_radius
    (initial : Int) (acc : Nat → Int) (K A n : Nat)
    (hinit : -(K : Int) ≤ initial ∧ initial ≤ (K : Int))
    (hacc : ∀ t, -(A : Int) ≤ acc t ∧ acc t ≤ (A : Int))
    (observed : Int)
    (measurement : observed = displacement initial acc n)
    (outside : observed < -((displacementRadius K A n : Nat) : Int)) :
    False := by
  have h := (displacement_inside initial acc K A hinit hacc n).1
  omega

end Conde1963.Reachability
