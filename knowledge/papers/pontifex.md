---
type: paper
title: "Pontifex"
family: "Interpretabilidade"
kind: "position paper"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Tenta descobrir unidades úteis de interpretação sem depender dos tokens do modelo: perturba bytes/entradas e compara como vários sistemas respondem internamente às mesmas perguntas experimentais, sem exigir que suas coordenadas latentes sejam diretamente alinhadas.
status: >-
  O paper original continua sendo um position paper, mas a linha experimental já não está no estágio de "sem evidência". O RED-1 inicial mostrou um pequeno sinal no convergence head e depois perdeu estabilidade com escala/diversidade, deixando de ser a hipótese central. Trabalhos posteriores de cartografia e transporte encontraram estrutura controlada: correspondências verdadeiras frequentemente superam correspondências destruídas; em SICK-R um residual recupera parte da geometria do espaço B além de Procrustes; e em SciFact deformações compartilhadas preservam utilidade melhor que deformações independentes. Ao mesmo tempo, FiQA/NFCorpus não sustentam um ganho positivo universal e, no piloto MS MARCO, o transporte fica muito abaixo do baseline nativo e aproximadamente empata com Procrustes. O estado canônico é portanto mixed: existe sinal inter-representacional reproduzível em regimes concretos, mas o mecanismo e a generalidade continuam abertos. O programa agora separa explicitamente a camada de identificação por respostas a intervenções da camada opcional de transporte entre espaços.
limit: >-
  O gargalo agora é demonstrar informação especificamente interventional, e não apenas redescobrir estrutura estática já visível ao Semantic Atlas ou capacidade de alinhadores genéricos. Nenhum resultado atual autoriza concluir Torus intrínseco, geometria semântica universal ou superioridade downstream geral: a especificidade TRUE > coupled-null em SciFact ainda não fecha o critério confirmatório, os efeitos variam por dataset e controles simples explicam parte relevante do sinal. O Unified Semantic Identification Benchmark congela justamente esses nested controls; uma promoção científica exigiria efeito incremental em observadores/datasets held-out, nulls de correspondência e orçamento pareado.
related_file: "research/semantic-systems-evidence-state.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex mede respostas a intervenções; Semantic Atlas mede estrutura relacional estática. O benchmark unificado testa se as intervenções acrescentam informação além do mapa estático."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
