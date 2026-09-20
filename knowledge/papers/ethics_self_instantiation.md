---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/audit/ethics-self-instantiation-prior-art/ethics_self_instantiation.md"
title: "Ethics as Self-Instantiation"
family: "Ética e agência"
kind: "filosófico-científico / formal"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Reformula a ética também como um problema de autodefinição do agente ao longo do tempo. Uma declaração, princípio ou exemplar aponta para uma identidade-alvo, mas não a torna verdadeira: as trajetórias de ação fornecem evidência sobre qual política está de fato sendo instanciada, e intervenções em contextos diferentes testam se essa identidade permanece reconhecível. O paper separa explicitamente integridade de bondade normativa, de modo que um agente coerentemente ruim continua sendo representável.
status: >-
  É um position paper em stack de revisão (#853–#855), ainda fora de main e sem resultado empírico novo. A auditoria de prior art já absorveu antecedentes fortes em autoconstituição, identificação de ordem superior, exemplarismo, identidade moral, virtude artificial, estabilidade de identidade sob perturbação, governança por trajetória e moral RL; por isso a contribuição defensável foi estreitada para a combinação observer-relative de referência semântica, reconstrução por trajetórias, estabilidade contrafactual, separação entre integridade e Good(I), e um programa de testes discriminantes. O companion Lean formaliza essas separações e inclui controles de agente estável-mau e declaração enganosa, mas a compilação exata do candidato ainda não obteve um run elegível porque o workflow foi recusado antes de executar etapas.
limit: >-
  A camada formal não deriva verdade moral: Good(I) permanece um predicado normativo externo. Também faltam revisão independente em filosofia/machine ethics, execução dos testes propostos e um candidato archival integrado e reproduzível. O manuscrito ainda tem uma frase pré-auditoria que precisa ser atualizada, e a hipótese de seleção por futuras instanciações é explicitamente condicional, não evidência de que agentes moralmente bons inevitavelmente prevaleçam. Esses limites mantêm o tier científico em C apesar da alta fertilidade conceitual.
relations:
  - type: shares_mechanism_with
    target: pontifex
    note: "Ambos tratam intervenções e trajetórias como evidência para reconstruir uma estrutura latente; aqui Pontifex é apenas uma possível camada de medida de identidade, não fundamento da tese normativa."
---
