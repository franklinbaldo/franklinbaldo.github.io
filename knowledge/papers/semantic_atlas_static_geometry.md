---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/main/semantic-atlas/static-geometry.md"
title: "Semantic Atlas: geometria local em escala"
family: "Geometria semântica"
kind: "empírico/técnico"
scientific_tier: "B"
interest_tier: "A"
confidence: "medium"
idea: >-
  Testa uma pergunta mais estreita que o Atlas conceitual: dois embedders independentes preservam parte dos mesmos vizinhos locais quando a galeria cresce? Em 32 galerias pré-registradas por escala, Qwen3-Embedding e MiniLM mantêm overlap local calibrado acima do acaso de 1 mil a 100 mil textos, mas continuam muito abaixo da estabilidade do próprio observador.
status: >-
  Technical paper empírico não revisado por pares, com protocolo pré-registrado e resultado terminal reproduzível: mKNN@5 calibrado cai de 0,4065 para 0,3195, retendo 78,6% do sinal e passando o gate de escala; em 100 mil itens, o teto same-observer é ~0,928 e Q=0,344. A auditoria mostra que nearest-neighbor overlap, mKNN, calibração por permutação e testes de gallery scale já têm prior art forte; a contribuição é um boundary result específico e pré-registrado em text embeddings, não a invenção desses métodos nem do fenômeno amplo. O manuscrito está agora marcado como pronto para Zenodo e seu bundle passa em dry-run no CI; essa prontidão editorial/técnica não adiciona nova evidência científica.
limit: >-
  O resultado cobre só dois observadores e um corpus congelado, sem revisão por pares, replicação independente, mecanismo causal, dinâmica ou evidência de que o Atlas global melhora planejamento. Koepke et al. já mostravam antes do cutoff que gallery scale importa e que pares language-language podem manter mKNN estável. O próximo salto científico é replicar em mais famílias/corpora, com protocolo congelado e escrutínio externo, preservando o mesmo teto de estabilidade; busca negativa não prova prioridade.
related_file: "semantic-atlas/prior-art/static-geometry-2026-09-18.md"
relations:
  - type: tests
    target: semantic_atlas
    note: "Testa uma premissa estática e estreita da linha: alinhamento local parcial entre observadores em escala."
---
