---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/main/malecns/genotype-connectome-behavior-stories.md"
title: "Behavior as a Shared Story Across Genome and Connectome Latent Spaces"
family: "Neurocomputação experimental"
kind: "conceitual / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Usa um fenótipo comportamental conhecido como restrição inversa: em vez de tentar simular toda a cadeia gene → desenvolvimento → circuito → comportamento, procura muitas famílias diferentes de circuitos ou programas desenvolvimentais capazes de reproduzir a mesma história comportamental e pergunta quais propriedades sobrevivem entre essas soluções. Essas invariantes viram hipóteses biológicas que só contam de verdade se forem congeladas antes de abrir a evidência molecular, anatômica ou fisiológica retida.
status: >-
  O position paper/protocolo já está em `papers/main` e foi acompanhado por auditorias de prior art e identificabilidade. A contribuição não está em ligar genericamente genoma, connectome e comportamento: há prior art direto para modelos genéticos de wiring, connectomes generativos, fenotipagem comportamental, fitting de circuitos a comportamento, inferência posterior de mecanismos neurais e integração genome/connectome/behavior. A versão atual torna explícito que, antes de validação perturbacional held-out, o objeto científico é apenas um ensemble/classe de equivalência phenotype-compatible; “mechanistic recovery” fica reservado para previsões congeladas que sobrevivam à abertura de evidência biológica retida e superem baselines convencionais pareados, incluindo SBI/SNPE e connectomics-SBI. O candidato mais estreito é a composição de comportamento como trajetória ordenada, busca inversa phenotype-to-circuit, múltiplas famílias independentes de geradores, comparação interventional entre espaços incompatíveis e validação cega das invariantes do ensemble. Ainda não há experimento biológico novo nem demonstração de recuperação mecanística.
limit: >-
  Reproduzir o comportamento não implica recuperar o mecanismo biológico: circuitos artificiais podem ser substitutos funcionais, o gerador ou o prior podem impor falsas invariantes, a métrica de comportamento pode vazar a resposta e o fenótipo pode identificar apenas uma classe ampla de mecanismos. Topologia também não pode ser confundida com effectome, pesos, neuromodulação, estado ou plasticidade. O protocolo só ganha força científica se usar várias famílias de geradores, muitos nulls/rewires, métricas congeladas, generator-held-out e perturbation-held-out, análises de sensibilidade a gerador/prior/summary, largura explícita do posterior/classe de equivalência, false-mechanism nulls e identidades de intervenção embaralhadas/negativas, além de baselines de geometria estática e alternativas effectome/state-aware. A etapa decisiva continua sendo abrir a evidência biológica só depois de congelar as previsões. Até isso acontecer, permanece uma proposta estruturada e falsificável, não evidência de um bridge mecanístico já descoberto.
related_file: "audits/prior-art/genotype-connectome-behavior-stories-2026-09-20.md"
relations:
  - type: applies
    target: interventional_latent_graph
    note: "Usa identidades de intervenção para relacionar genoma, desenvolvimento, circuito, atividade e comportamento sem exigir coordenadas comuns; o novo passo é inferir ensembles phenotype-compatible ao longo dessa cadeia."
---
