/-
  Cena 8: a prova perfeita do problema errado.
  A IA entendeu 12 convidados. Eram 10.
-/

def convidados : Nat := 12   -- ← a hipótese errada mora aqui
def coxinhasPorPessoa : Nat := 3

theorem coxinhas_suficientes :
    convidados * coxinhasPorPessoa = 36 := by
  decide

#print axioms coxinhas_suficientes
