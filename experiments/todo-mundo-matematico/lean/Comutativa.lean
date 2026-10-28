-- Cena 4: a mesma afirmação, agora com uma justificativa de verdade.
theorem obvio (a b : Nat) : a + b = b + a := by
  exact Nat.add_comm a b   -- lema da biblioteca padrão, já verificado

#print axioms obvio
