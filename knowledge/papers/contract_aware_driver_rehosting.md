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
  Position/methodology paper congelado como v0.1 e marcado como pronto para publicação no Zenodo. A novidade foi estreitada para a combinação Windows METHOD_BUFFERED + dual bound + promoção sensível à ambiguidade + protocolo calibrado de evidência; o substrato de brokering do LiteBox foi demonstrado, mas o rehosting .sys, a ABI NT sintética, shadow checking calibrado, contenção e avaliação de terceiros continuam propostos ou não validados.
limit: >-
  ASan container-overflow, EffectiveSan, x64dbg/driver_unpacking, Speakeasy e a documentação de METHOD_BUFFERED antecipam componentes importantes. A contribuição candidata fica na conjunção operacional e no critério de promoção; o scaffold M1–M7 do LiteBox PR #24 permanece aberto, não mergeado e não validado, não há vulnerabilidade de driver reportada e ainda falta validação ampla em drivers reais.
related_file: "audits/prior-art/contract-aware-driver-rehosting-2026-09-17.md"
relations:
  - type: applies
    target: affordance_restriction
    note: >-
      Usa a distinção entre teto de privilégio e custo de affordances de pesquisa para enquadrar o rehosting sem confundir aumento de capacidade prática com aumento de autorização.
---
