---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/experiment/pontifex-red-1/pontifex_torus.md"
title: "Pontifex Torus"
family: "Interpretabilidade"
kind: "empírico/exploratório"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Troca a fusão direta de sinais por uma cartografia das respostas às mesmas oclusões e propõe um Torus Assembly em que teachers heterogêneos são relacionados pelas mesmas intervenções. A aposta residual não é criar um espaço compartilhado do zero, mas reaproveitar geometria semântica já presente e aprender transporte/reliabilidade com pouquíssima supervisão adicional.
status: >-
  Living paper na PR #485, ainda não mergeado nem revisado por pares. Além dos testes sintéticos de cartografia, a branch já tem um controle externo real em SciFact/BEIR: com Cohere dense + TF-IDF, o melhor canal isolado obteve nDCG@10 0,7334 e AUPRC 0,7047; uma fusão linear de 3 parâmetros chegou a nDCG@10 0,7610 e AUPRC 0,7354 com 24 queries rotuladas, enquanto o MLP não linear foi instável e colapsou no orçamento completo. Isso sustenta a eficiência de reutilizar sinal semântico já existente, mas ainda não testa o transporte A→B completo do Torus.
limit: >-
  O resultado real ainda é um controle reduzido de fusão entre canais heterogêneos, não uma demonstração do mapa Torus ou da Assembly multi-teacher. A hipótese forte continua exigindo mostrar, em benchmarks externos e com splits sem vazamento, que poucas correspondências/intervenções recuperam utilidade downstream de outro espaço além de baselines simples de alinhamento e capacidade pareada.
related_file: "audits/prior-art/pontifex-torus-assembly-multiteacher-2026-09-18.md"
relations:
  - type: extends
    target: pontifex
    note: "Estende Pontifex da fusão direta para campos de resposta construídos pelas mesmas intervenções."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Compartilha a comparação entre observadores heterogêneos sem assumir um espaço interno universal."
  - type: shares_mechanism_with
    target: semantic_atlas
    note: "Compartilha a intuição cartográfica de representar diferenças relacionais como um mapa operacional."
---
