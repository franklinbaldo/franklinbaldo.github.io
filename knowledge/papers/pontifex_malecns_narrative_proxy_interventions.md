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
  A v0.1 foi congelada como position paper/protocolo Zenodo-ready no commit dd3db1fec6531d99db9516e96b2c34639f7e2c99. O manuscrito agora incorpora explicitamente o prior art de CTW/GTW, GDTW, Gromov-Wasserstein, causal abstraction e event boundaries, estreita a contribuição para a conjunção de proxies nativos texto↔MaleCNS, intervenção-em-história e previsão held-out, e inclui os controles adversariais exigidos pela auditoria. O bundle do SHA exato passou OKF conformance e validação local de empacotamento; ainda não houve depósito externo no Zenodo nem novas medições empíricas.
limit: >-
  A prontidão arquivística não muda a maturidade científica: a hipótese ainda precisa mostrar, em histórias e intervenções held-out, que a geometria de respostas texto↔MaleCNS acrescenta poder preditivo além de tempo, CTW/GTW, GDTW/Gromov-Wasserstein, tradutores diretos e nulls de capacidade pareada. Também permanece o risco de a correspondência ser construída pelo registry/renderers de proxies; um resultado positivo sustentaria no máximo correspondência estrutural preditiva sob as intervenções declaradas, não mecanismo, ontologia ou computação compartilhados.
related_file: "audits/zenodo-readiness/2026-09-19-1541Z-fix-round.md"
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
