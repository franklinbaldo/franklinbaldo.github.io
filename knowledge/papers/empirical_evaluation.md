---
type: paper
title: "Avaliação empírica no TJRO"
family: "Raciocínio jurídico auditável"
kind: "paper empírico exploratório / pré-registro parcial"
scientific_tier: "C"
interest_tier: "A"
confidence: "high"
idea: >-
  Testa em decisões reais do TJRO se uma forma estruturada do programa de raciocínio jurídico auditável melhora a validade processual de peças geradas por LLM, preservando separadamente o desenho confirmatório futuro da pipeline Lean completa.
status: >-
  O paper deixou de ser apenas protocolo e passou a conter o primeiro resultado executado e reproduzível. O piloto Q1p congelou uma amostra canônica de 30 decisões RPPS e avaliou os 10 primeiros casos sob três condições cegadas — P_proxy, S e E — com prompts, respostas, mappings, scores, manifests e log preservados. P_proxy é somente structured prompting das seis fases, sem compilação Lean. Contra o baseline simples S, P_proxy não confirmou vantagem: validade processual média 66,4 contra 72,2, diferença pareada -5,8, bootstrap de 5.000 repetições com intervalo de 95% [-17,7, 8,1] e 3/0/7 vitórias/empates/derrotas. P_proxy superou fortemente E, mas E falhou em produzir uma peça adequada em 6 de 10 casos, então esse contraste não sustenta a tese central. O manuscrito integra esse resultado negativo, prior art específico, provenance e metadata Zenodo e está repository-ready para empacotamento, sem depósito externo.
limit: >-
  A evidência é exploratória: apenas 10 casos, um único modelo Gemini usado tanto na geração quanto no julgamento cego, e P_proxy não é a pipeline Lean. Portanto o resultado falsifica a expectativa estreita de que structured prompting sozinho já produziria ganho Q1p, mas não testa nem refuta a pipeline completa. Q1/Q2/Q3 seguem não executados; confirmação exige Lean real, painel heterogêneo de julgadores, amostra maior e execução prospectiva do desenho congelado. A promoção de D para C decorre do primeiro contato empírico reproduzível e de um resultado negativo informativo, não de eficácia demonstrada.
related_file: "audits/zenodo-readiness/2026-09-20-0500Z.md"
relations:
  - type: tests
    target: embedding_seeded_tournament
    note: "Leva hipóteses de proximidade semântica e comparação de decisões a um programa empírico no TJRO; o primeiro Q1p executado testa apenas o braço de geração estruturada, enquanto Q3/ESHTR permanece prospectivo."
---
