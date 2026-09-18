---
type: paper
file: "forbidden_relay.md"
title: "Forbidden Relay"
family: "Comunicação emergente e agência"
kind: "pré-registro experimental"
scientific_tier: "D"
interest_tier: "S"
confidence: "high"
idea: "Pré-registra um teste de comunicação composta: pequenos relays treinados por RL só podem editar ou recuperar texto entre chamadas de LLMs black-box, e o receptor final deve reconstruir exatamente um alvo benigno mesmo quando o literal não aparece nos outputs intermediários."
status: "Pré-registro não revisado por pares e sem resultados. A auditoria reproduzível encontra antecedentes fortes para protocolos aprendidos por RL, steganografia robusta a paraphrase/word blocking, sequências LLM-to-LLM e decodabilidade relativa ao receptor; o alvo de novidade defensável é a conjunção experimental completa, não esses fenômenos isolados."
limit: "A combinação ainda não localizada junta relay discreto entre chamadas black-box, recuperação exata de palavras e nonces, zero literal intermediário, transferência para profundidades e modelos não vistos, regimes frozen/heterogeneous/coadapted, diagnósticos de private code, memória e controles de side-channel. O falsificador central agora é direto: se um codec semântico/paraphrase-robust ou uma cifra in-context, com bandwidth comparável, igualar o relay em unseen depth/model, o maquinário RL específico não demonstrou valor adicional. Busca negativa não prova prioridade."
related_file: "audits/prior-art/forbidden-relay-2026-09-18.md"
related_label: "ler auditoria de prior art"
updated: "2026-09-18"
---

# Forbidden Relay

Canonical OKF card for the public Papers portfolio. The paper itself remains in `franklinbaldo/papers`.
