import JurosMMT.Resende
import JurosMMT.MMT

/-!
# Compatibilidade lógica entre modelos parciais

Exibe um estado que satisfaz simultaneamente as hipóteses explícitas
de equilíbrio de Lara Resende e o núcleo operacional MMT. A existência
de um exemplo conjunto não valida empiricamente nenhuma teoria, e
não prova equivalência completa entre tradições macroeconômicas.
-/

namespace JurosMMT.Compatibility

/-- Testemunha: Selic 5,5%, crescimento 2,5%, inflação 3% (em bp). -/
theorem a_joint_model_exists :
    ∃ (r : JurosMMT.Resende.LongRun) (m : JurosMMT.MMT.MonetaryEconomy),
      r.nominalRate = m.policyRate ∧
      r.inflation = m.inflation ∧
      r.growthRate = m.growthRate := by
  let r : JurosMMT.Resende.LongRun := {
    nominalRate := 550
    realRate := 250
    inflation := 300
    growthRate := 250
    fisher := by decide
    realTracksGrowth := by decide
  }
  let m : JurosMMT.MMT.MonetaryEconomy :=
    JurosMMT.MMT.sample 550 300 250 90 100
  refine ⟨r, m, ?_, ?_, ?_⟩
  · rfl
  · rfl
  · rfl

end JurosMMT.Compatibility
