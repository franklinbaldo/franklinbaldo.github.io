---
type: paper
order: 9
file: "pipeline_lean_argdown.md"
title: "Lean + Argdown para auditoria jurídica"
family: "Método formal"
kind: "metodológico/formal"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: "Separa três superfícies de auditoria: Argdown torna ataques e apoios legíveis; Lean verifica o que realmente decorre de premissas explícitas e expõe suas dependências com `#print axioms`; uma etapa jurídica independente pergunta se essas premissas representam adequadamente as fontes e os fatos."
status: "Methodology paper não revisado por pares, com pipeline implementável e auditoria reproduzível de prior art. A auditoria encontrou antecedentes fortes para theorem proving jurídico e pipelines formais em estágios e, mais importante, uma correção de conteúdo: o paper atual atribui a TAIR e aos argumentation frameworks uma exigência de aciclicidade que a fonte primária não sustenta, enquanto ciclos são parte conhecida da literatura de Dung-style AFs."
limit: "Enquanto o paper não corrigir essa comparação, a tese `compilação > aciclicidade` não é defensável como escrita; suporte de Lean a definições recursivas também não licencia dependências circulares em provas jurídicas. A contribuição residual fica no contrato de rastreabilidade Argdown attack → Lean theorem → `#print axioms` ledger → revisão jurídica independente → defeat synthesis → tradução forense, especialmente no CPC brasileiro; busca negativa não prova prioridade."
related_file: "audits/prior-art/pipeline-lean-argdown-2026-09-18.md"
related_label: "ler auditoria de prior art"
updated: "2026-09-18"
---

# Lean + Argdown para auditoria jurídica

Canonical OKF card for the public Papers portfolio. The paper itself remains in `franklinbaldo/papers`.
