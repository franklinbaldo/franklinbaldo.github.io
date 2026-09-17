---
type: changelog
date: 2026-09-17
description: Atualiza /papers com a auditoria de prior art de Contract-aware driver rehosting.
tags: [papers, research, systems, driver-rehosting, prior-art]
---

# Contract-aware driver rehosting: prior art no mapa de papers

- O `franklinbaldo/papers` incorporou em `main` a auditoria `audits/prior-art/contract-aware-driver-rehosting-2026-09-17.md`.
- A auditoria corrige duas generalizações: execução/emulação de drivers Windows fora do kernel real já aparece em x64dbg/`driver_unpacking` e Speakeasy, e limites lógicos mais estreitos dentro de uma região fisicamente válida já aparecem em AddressSanitizer container-overflow e EffectiveSan.
- A contribuição candidata fica mais estreita: a combinação `METHOD_BUFFERED` com limite físico `max(InputBufferLength, OutputBufferLength)`, fronteira lógica `OutputBufferLength`, evento bruto antes de inferir intenção de saída, controle negativo de scratch/input-tail, calibração por fixture e reprodução independente antes de confirmar vulnerabilidade.
- `scientific_tier=C`, `interest_tier=A` e confiança `medium` permanecem. A mudança é material para a fronteira de novidade, mas não adiciona validação empírica ampla nem remove a estrutura metodológica já existente; por isso não há promoção ou relegação.
- O card público passa a linkar diretamente para a auditoria e explicita que busca negativa não prova novidade.
- O commit `db2e1cd1ce783f8e1dae8da303696980c90fe8f4` adiciona cinco diagramas úteis a papers existentes, mas declara e mostra mudanças apenas de documentação/visualização, sem alterar resultados ou claims; não há tier move por esse motivo.
