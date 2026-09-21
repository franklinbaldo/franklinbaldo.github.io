---
type: paper
title: "Behavior as a Shared Story Across Genome and Connectome Latent Spaces"
family: "Neurocomputação experimental"
kind: "conceitual / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Usa um fenótipo comportamental conhecido como restrição inversa: em vez de tentar simular toda a cadeia gene → desenvolvimento → circuito → comportamento, procura muitas famílias diferentes de circuitos ou programas desenvolvimentais capazes de reproduzir a mesma história comportamental e pergunta quais propriedades sobrevivem entre essas soluções. Essas invariantes viram hipóteses biológicas que só contam de verdade se forem congeladas antes de abrir a evidência molecular, anatômica ou fisiológica retida.
status: >-
  O position paper/protocolo já está em `papers/main` e foi acompanhado por uma auditoria de prior art e de linhagem interna. A contribuição não está em ligar genericamente genoma, connectome e comportamento: há prior art direto para modelos genéticos de wiring, connectomes generativos, fenotipagem comportamental, fitting de circuitos a comportamento e integração genome/connectome/behavior. O candidato mais estreito é a composição de cinco peças: comportamento como trajetória ordenada; busca inversa phenotype-to-circuit; múltiplas famílias independentes de geradores; comparação interventional entre espaços incompatíveis; e validação cega das invariantes do ensemble contra biologia withheld. O objeto científico proposto é portanto o ensemble cross-generator de circuitos phenotype-compatible, não um único circuito otimizado. Ainda não há experimento biológico novo nem demonstração de recuperação mecanística.
limit: >-
  Reproduzir o comportamento não implica recuperar o mecanismo biológico: circuitos artificiais podem ser substitutos funcionais, o gerador pode impor falsas invariantes, a métrica de comportamento pode vazar a resposta e o fenótipo pode identificar apenas uma classe ampla de mecanismos. Topologia também não pode ser confundida com effectome, pesos, neuromodulação, estado ou plasticidade. O protocolo só ganha força científica se usar várias famílias de geradores, muitos nulls/rewires, métricas congeladas, generator-held-out e perturbation-held-out, baselines de geometria estática e alternativas effectome/state-aware, e principalmente uma abertura cega da evidência biológica depois de congelar as previsões. Até isso acontecer, permanece uma proposta estruturada e falsificável, não evidência de um bridge mecanístico já descoberto.
related_file: "audits/prior-art/genotype-connectome-behavior-stories-2026-09-20.md"
relations:
  - type: applies
    target: interventional_latent_graph
    note: "Usa identidades de intervenção para relacionar genoma, desenvolvimento, circuito, atividade e comportamento sem exigir coordenadas comuns; o novo passo é inferir ensembles phenotype-compatible ao longo dessa cadeia."
---
