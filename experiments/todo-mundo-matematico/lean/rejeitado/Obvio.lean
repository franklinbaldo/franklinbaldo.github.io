-- Cena 4: a IA tenta passar um "é óbvio" pelo fiscal. (Este arquivo DEVE falhar.)
theorem obvio (a b : Nat) : a + b = b + a := by
  rfl   -- "é óbvio!"
