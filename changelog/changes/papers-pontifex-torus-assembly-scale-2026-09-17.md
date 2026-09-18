---
type: changelog
date: 2026-09-17
description: Atualiza o mapa de papers com a evolução recente do Pontifex Torus, incluindo Assembly, dupla oclusão e limite de escala.
tags: [papers, research, pontifex, interpretability, embeddings]
---

# Pontifex Torus: Assembly, dupla oclusão e escala

- A PR `franklinbaldo/papers#485` avançou materialmente: o living paper agora formaliza um `Torus Assembly` multi-teacher, separa `D_assembly`, `D_student`, `D_val` e `D_test`, propõe um student byte-level/tokenizer-free e define a dinâmica de múltiplas oclusões com wraparound toroidal.
- O paper também incorporou evidência empírica nova: a dupla oclusão contém sinal não aditivo transferível entre os espaços no toy atual, e a separação entre probes reais e travessia virtual mostra que aumentar resolução virtual integra melhor o campo, mas não cria informação nova.
- A primeira escada de escala é adversa ao decoder regional de capacidade fixa: com 16 anchors e `K=8`, o neighbor overlap cai de `0,3539` em 120 textos para `0,1315` em 2.000, enquanto o Ridge direto permanece mais forte em reconstrução absoluta. Isso motiva testar capacidade regional crescente, não tratar mais dados como solução automática.
- Os tiers permanecem `scientific_tier=C`, `interest_tier=S`, confiança `medium`: há mais estrutura, controles e resultados toy, inclusive negativos, mas Assembly multi-teacher, generalização para teacher held-out, inferência byte-level/long-context e downstream real ainda não foram demonstrados.
- O mapa de relações passa a registrar explicitamente que Pontifex Torus estende/testa Pontifex, compartilha mecanismos cartográficos e multiescala com Semantic Atlas/Semantic Observers e contrasta com Semantic Tokenization Transformers ao tentar retirar o tokenizer subword aprendido do caminho de inferência do student.
