---
type: paper
title: "Narrative Proxy Interventions"
family: "Interpretabilidade"
kind: "position paper / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Propõe alinhar trajetórias de embeddings de linguagem e do MaleCNS sem fingir que os dois espaços compartilham coordenadas: ambos realizam, em sua própria modalidade, a mesma história causal ordenada, e o Pontifex compara a geometria das respostas preservando a ordem narrativa.
status: >-
  Position paper prospectivo com objeto formal, protocolo, controles e previsões falsificáveis, ainda sem novas medições empíricas. A auditoria claim-specific e a passada adversarial já foram concluídas: Gromov Dynamic Time Warping, CTW/GTW, alinhamento Gromov-Wasserstein sem rótulos, causal abstraction e estudos de event boundaries cobrem vários ingredientes genéricos antes do cutoff. A contribuição defensável ficou mais estreita: a busca não localizou, antes do cutoff, a conjunção completa de proxies nativos texto↔MaleCNS, intervenção-em-história e teste held-out. O manuscrito, porém, ainda não absorveu integralmente essa auditoria, continua em publication.status: draft e não está congelado para Zenodo.
limit: >-
  Um alinhamento positivo demonstraria correspondência estrutural preditiva sob as intervenções declaradas, não mecanismo, ontologia ou computação compartilhados. Antes do freeze, o manuscrito precisa incorporar GDTW/GWOT e CTW/GTW na escada de baselines, separar conteúdo de boundary de efeito de anchor, controlar overlap lexical/participantes e prefixos embaralhados, preregistrar capacidade do warp/mapa, usar renderers/proxies independentes e nulls random/untrained/shuffled, além de consolidar as limitações e empacotar um SHA exato. Depois disso, a hipótese científica ainda exige histórias/intervenções held-out e MaleCNS rewired/random pareados.
related_file: "audits/prior-art/narrative-proxy-interventions-2026-09-19.md"
relations:
  - type: extends
    target: pontifex
    note: "Troca a exigência de um input físico comum por histórias causais ordenadas realizadas nativamente em cada substrato."
  - type: applies
    target: interventional_latent_graph
    note: "Usa intervenções compartilhadas como ponte entre espaços, mas acrescenta história, condições de contorno e ordem causal."
  - type: extends
    target: pontifex_torus
    note: "Pede ao Torus que alinhe geometrias de resposta ao longo de tempo narrativo monotônico, sem alinhamento direto de coordenadas latentes."
  - type: contrasts_with
    target: malecns_connectome_reservoir_tagging
    note: "Leva o programa MaleCNS para uma interface biologicamente endereçada e causal, em contraste com o reservoir reduzido open-loop do baseline de tagging."
---
