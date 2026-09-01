---
type: Architecture Contract
title: Audiobook Factory — chapter readiness
description: Gates editoriais que uma unidade deve satisfazer antes de ser enviada para síntese TTS.
tags: [audiobook, readiness, validation, editorial, okf]
timestamp: 2026-08-30T20:16:00Z
---

# Chapter readiness

## 1. Objetivo

`ready_for_audio` é um estado verificável, não uma impressão subjetiva.

O workflow TTS só pode aceitar uma unidade quando todos os gates obrigatórios estiverem satisfeitos.

## 2. Gates

### G0 — work ready

A obra possui `work.md` válido, `work_id` estável, proveniência da fonte, idiomas, política de publicação/direitos, guia editorial específico, `voices.yaml`/`pronunciation.yaml` e contrato de payload quando a obra já usa shards diretamente executáveis por TTS.

### G1 — source ready

O original existe, tem identidade válida, provenance/digest, está segmentado e não mistura transformação editorial da tradução.

### G2 — translation ready

A tradução cobre os segmentos obrigatórios, preserva IDs, não introduz comandos específicos de TTS, segue os guias e registra dúvidas bloqueantes explicitamente.

### G3 — narration ready

A narração deriva da tradução correspondente, cobre os segmentos destinados à fala, identifica speaker lógico e aplica pronúncia/direção provider-neutral.

Para todo segmento alcançado pelo `narration_payload_contract` da obra, o shard declara o mesmo `payload_contract`. Sob `tts-body-v1`, o frontmatter contém identidade, lineage, parâmetros, direção e notas não faladas; o body contém exatamente o texto enviado ao TTS. Se qualquer limpeza heurística ou remoção de Markdown editorial for necessária, `narration_ready` é falso.

### G4 — consistency ready

Nomes/termos seguem o glossário, speakers existem, pronúncias especiais estão declaradas, IDs não colidem, ordem é determinística e tradução/narração não omitem conteúdo silenciosamente.

### G5 — editorial review ready

A passada final verifica fluência, fidelidade, naturalidade oral, registro consistente, coerência de pausas/ênfases/direção e ausência de TODOs/bloqueios.

### G6 — audio contract ready

Backend/modelo podem ser selecionados sem alterar o corpus; vozes lógicas resolvem; o planner emite requests determinísticos; cache keys e montagem são conhecidos. Sob `tts-body-v1`, o planner entrega o body diretamente ao adapter e nunca concatena `editorial_notes` ao texto falado.

## 3. Migração de corpus legado

Uma obra com shards antigos pode declarar `narration_payload_contract` e `narration_payload_contract_from` em `work.md`. A fronteira permite migração explícita sem tratar legado como exemplo válido. Todo segmento novo a partir da fronteira obedece imediatamente ao contrato. Obras futuras devem iniciar o contrato no primeiro narration segment.

Um capítulo só pode ser considerado integralmente pronto para áudio quando todo o range a sintetizar estiver no contrato vigente ou tiver sido migrado explicitamente.

## 4. Invariantes

- `ready_for_audio` só pode ser `true` quando todos os gates obrigatórios forem `true`;
- body de narração sob o contrato vigente não contém material editorial não falado;
- notas locais pertencem ao frontmatter, preferencialmente em `editorial_notes`;
- alteração no original invalida tradução/narração afetadas;
- alteração na tradução invalida narração/revisões afetadas;
- alteração apenas em backend pode invalidar plano/cache sem invalidar texto editorial;
- um capítulo publicado pode ter áudio regenerado sem mudar `chapter_id`/GUID.

## 5. Gate de CI

O gate estrutural canônico é `uv run scripts/audiobook/validate-okf.py --work <work_id> [--chapter <id>]`. Além da conformidade normativa do `okf-parser`, ele aplica `tts-body-v1` a partir da fronteira declarada pela obra e rejeita body vazio, Markdown estrutural e notas editoriais no payload falado.

Falha nesse gate impede qualquer despacho para API, Colab, Kaggle ou outro runner.

## 6. Skills operacionais

Antes de avançar uma unidade, aplicar `scripts/audiobook/skills/audiobook-editorial-segment/SKILL.md`. Ao criar, revisar ou depurar um narration shard, aplicar também `scripts/audiobook/skills/audiobook-tts-payload/SKILL.md`.

As skills explicam o procedimento editorial; o validador é a fronteira mecânica que impede regressão.

## 7. Retomada pelo agente recorrente

O agente prioriza unidades com gate imediatamente desbloqueável, trabalho já iniciado, dependências globais e só então a próxima unidade. O cursor continua derivado dos shards canônicos, e a fronteira de payload em `work.md` torna a adoção do contrato determinística.
