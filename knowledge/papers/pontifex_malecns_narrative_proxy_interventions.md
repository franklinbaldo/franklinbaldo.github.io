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
  A v0.1 foi congelada como position paper/protocolo Zenodo-ready no commit dd3db1fec6531d99db9516e96b2c34639f7e2c99. O manuscrito incorpora prior art de CTW/GTW, GDTW, Gromov-Wasserstein, causal abstraction e event boundaries, estreita a contribuição para a conjunção de proxies nativos texto↔MaleCNS, intervenção-em-história e previsão held-out, e inclui os controles adversariais exigidos pela auditoria. A revisão de consistência do programa também removeu uma dependência conceitual indevida: o protocolo instancia MaleCNS como observador/substrato heterogêneo e não depende de Torus; Torus pode ser testado depois apenas como modelo opcional sobre as respostas. O bundle do SHA exato passou OKF conformance e validação local de empacotamento; ainda não houve depósito externo no Zenodo nem novas medições empíricas.
limit: >-
  A prontidão arquivística não muda a maturidade científica: a hipótese ainda precisa mostrar, em histórias e intervenções held-out, que a geometria de respostas texto↔MaleCNS acrescenta poder preditivo além de tempo, CTW/GTW, GDTW/Gromov-Wasserstein, tradutores diretos e nulls de capacidade pareada. Também permanece o risco de a correspondência ser construída pelo registry/renderers de proxies; desempenho do MaleCNS como reservoir ou controlador não transfere para esta hipótese sem um bridge experiment específico. Um resultado positivo sustentaria no máximo correspondência estrutural preditiva sob as intervenções declaradas, não mecanismo, ontologia ou computação compartilhados.
related_file: "audits/zenodo-readiness/2026-09-19-1541Z-fix-round.md"
relations:
  - type: extends
    target: pontifex
    note: "Troca a exigência de uma realização física comum por uma identidade experimental compartilhada, realizada nativamente em cada substrato."
  - type: applies
    target: interventional_latent_graph
    note: "Realiza uma mesma identidade experimental por proxies substrate-native e acrescenta história, condições de contorno e ordem causal."
  - type: contrasts_with
    target: malecns_connectome_reservoir_tagging
    note: "Instancia MaleCNS como observador heterogêneo; desempenho de reservoir/controller é uma linha separada e não conta como evidência de correspondência proxy sem bridge experiment."
---
