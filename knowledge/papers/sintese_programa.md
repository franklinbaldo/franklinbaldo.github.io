---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/main/auditable-legal-reasoning/research-program.md"
title: "Síntese do programa jurídico"
family: "Raciocínio jurídico auditável"
kind: "síntese"
scientific_tier: "B"
interest_tier: "B"
confidence: "medium"
idea: >-
  Costura dogmática, representação formal, avaliação comparativa e hipóteses institucionais num programa único de raciocínio jurídico auditável, mantendo explícita a fronteira entre o que o direito exige, o que um modelo formal representa e o que ainda precisa ser testado empiricamente.
status: >-
  A v0.1 reúne o estado corrigido dos papers-filhos e está repository-ready para o fluxo Zenodo. A versão atual incorpora as fronteiras de prior art dos Papers 1A–1G, trata Argdown e Lean como superfícies complementares de auditoria, mantém proveniência como rastreabilidade em vez de efeito processual automático e corrige as claims de ESHTR. Desde o primeiro piloto TJRO executado, o mapa empírico também ficou mais preciso: o Q1p comparou structured prompting P_proxy com um baseline simples e não encontrou vantagem (66,4 versus 72,2 de validade processual média; diferença pareada -5,8). Esse resultado negativo informa o programa, mas não testa a pipeline Lean completa. Custos, reputação e mudança institucional continuam como hipóteses condicionais, não efeitos já observados.
limit: >-
  A síntese continua dependente da maturidade desigual dos componentes. O Q1p é exploratório — 10 casos, um único modelo Gemini usado na geração e no julgamento cego, e P_proxy sem compilação Lean —, enquanto Q1/Q2/Q3 e a pipeline completa permanecem não executados. As hipóteses de custos, reputação e mudança institucional também carecem de validação própria. O tier B reflete coerência e delimitação do mapa do programa, não eficácia empírica demonstrada nem revisão independente.
related_file: "audits/zenodo-readiness/2026-09-19-2046Z-fix-round.md"
relations:
  - type: synthesizes
    target: paper1a_embargos_declaracao
    note: "Incorpora a delimitação dos embargos de declaração e o teste de determinação única como peça dogmática do programa."
  - type: synthesizes
    target: paper1b_cinco_saidas_precedentes
    note: "Integra a taxonomia competência-sensível das respostas a precedentes."
  - type: synthesizes
    target: paper1c_categorias_processuais_formalizacao
    note: "Usa o mapa de categorias processuais e suas heurísticas explicitamente delimitadas como ponte para formalização."
  - type: synthesizes
    target: paper1d_vinculacao_racional_dialogo_institucional
    note: "Incorpora o diálogo institucional apenas pelos canais e competências juridicamente cabíveis."
  - type: synthesizes
    target: paper1e_custos_argumentativos
    note: "Trata redução de custos argumentativos como hipótese condicional sujeita ao canal rival de aumento de ruído e triagem."
  - type: synthesizes
    target: paper1f_reputacao_sistema_juridico
    note: "Mantém reputação como mecanismo local e observável antes de qualquer extrapolação sistêmica."
  - type: synthesizes
    target: paper1g_livre_convencimento_patrimonialismo
    note: "Propaga a correção 1939/1940, a hipótese histórica estreita de forma de absorção e mantém aberta a continuidade pré/pós-1988."
  - type: synthesizes
    target: pipeline_lean_argdown
    note: "Combina topologia argumentativa, consequência formal e revisão jurídica como superfícies distintas de auditoria."
  - type: frames
    target: empirical_evaluation
    note: "Incorpora o primeiro piloto Q1p negativo sem confundi-lo com teste da pipeline Lean completa; Q1/Q2/Q3 permanecem prospectivos."
---
