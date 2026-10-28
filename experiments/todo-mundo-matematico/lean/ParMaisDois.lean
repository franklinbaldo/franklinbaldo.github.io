/-
  TODO MUNDO É MATEMÁTICO AGORA!  ·  Cena 5
  "Se você pegar qualquer número par e somar dois,
   o resultado continua sendo par."
-/

/-- `n` é par quando é formado por pares completos: `n = k + k`. -/
def Par (n : Nat) : Prop := ∃ k, n = k + k

/-- Par mais dois continua par — para TODO número natural. -/
theorem par_mais_dois (n : Nat) (h : Par n) : Par (n + 2) := by
  obtain ⟨k, hk⟩ := h               -- n = k + k
  refine ⟨k + 1, ?_⟩                -- mais um par: k vira k + 1
  rw [hk, Nat.add_add_add_comm]     -- (k + k) + 2 = (k + 1) + (k + 1)

-- Exemplos só testam; o teorema acima vale para todos.
example : Par 4 := ⟨2, rfl⟩
example : Par 6 := ⟨3, rfl⟩
example : Par 8 := ⟨4, rfl⟩

#print axioms par_mais_dois
