---
type: paper
title: "Contract-aware driver rehosting"
family: "Sistemas"
kind: "segurança de sistemas"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: >-
  Instrumenta um driver rehosted com dois limites: a região fisicamente alocada e a fronteira lógica declarada pelo contrato de I/O, tratando o cruzamento dessa fronteira como evento bruto até haver evidência de intenção de saída.
status: >-
  Methodology paper com shadow checking e auditoria reproduzível de prior art. A auditoria mostra que rehosting/emulação de drivers e sub-bounds dentro de uma alocação maior já têm antecedentes fortes.
limit: >-
  ASan container-overflow, EffectiveSan, x64dbg/driver_unpacking, Speakeasy e a documentação de METHOD_BUFFERED antecipam componentes importantes. A contribuição candidata fica na combinação Windows I/O contract + dual bound + promoção sensível à ambiguidade + controle negativo + reprodução independente; ainda falta validação ampla em drivers reais, e busca negativa não prova novidade.
related_file: "audits/prior-art/contract-aware-driver-rehosting-2026-09-17.md"
---
