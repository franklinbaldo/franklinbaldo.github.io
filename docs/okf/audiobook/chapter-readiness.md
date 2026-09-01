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

A obra possui:

- `work.md` válido;
- `work_id` estável;
- proveniência da fonte;
- idioma da fonte e idioma alvo;
- política de publicação/direitos registrada;
- guia editorial específico, ou declaração explícita de que os defaults globais bastam;
- `voices.yaml` e `pronunciation.yaml`, ainda que inicialmente mínimos.

### G1 — source ready

O original da unidade:

- existe;
- tem `chapter_id`/`unit_id` válido;
- tem provenance/digest;
- está segmentado;
- não contém transformação editorial da tradução.

### G2 — translation ready

A tradução:

- cobre todos os segmentos obrigatórios do original;
- preserva IDs compartilhados;
- não introduz comandos específicos de TTS;
- segue guia global + overrides da obra;
- registra dúvidas não resolvidas como bloqueio, em vez de escondê-las.

### G3 — narration ready

A narração:

- deriva da tradução correspondente;
- cobre os segmentos destinados à fala;
- identifica speaker lógico;
- aplica pronúncia, pontuação oral, expansão de símbolos e divisão de requests quando necessário;
- mantém intenção sem substituir a tradução canônica;
- usa somente instruções provider-neutral;
- declara `tts_body_contract: body-is-payload-v1` em todos os shards destinados à síntese;
- mantém notas de realização e instruções no frontmatter, não no body;
- possui body não vazio contendo exatamente o texto a enviar ao TTS, sem headings, notas, comentários ou blocos auxiliares.

Shards legados sem `tts_body_contract` podem permanecer parseáveis durante a migração, mas impedem `narration_ready` e, portanto, `ready_for_audio`.

### G4 — consistency ready

A unidade passou por revisão de consistência:

- nomes e termos seguem o glossário;
- vozes/speakers existem em `voices.yaml`;
- pronúncias especiais estão declaradas;
- IDs não colidem;
- ordem dos segmentos é determinística;
- tradução e narração não omitiram silenciosamente conteúdo relevante.

### G5 — editorial review ready

Uma passada editorial final verifica:

- fluência em pt-BR;
- fidelidade sem literalismo desnecessário;
- naturalidade oral;
- consistência de registro entre personagens/narrador;
- coerência de pausas/ênfases/direção;
- ausência de TODOs/bloqueios editoriais.

### G6 — audio contract ready

Antes de síntese:

- backend/modelo podem ser selecionados sem alterar o corpus;
- todas as vozes lógicas resolvem para uma configuração do backend escolhido ou para fallback explícito;
- o planner consegue emitir requests TTS determinísticos usando o body sem limpeza heurística;
- cache keys podem ser calculadas;
- output esperado e estratégia de montagem são conhecidos.

## 3. Estado mínimo persistido

Cada unidade deve poder ser representada por um estado semelhante a:

```yaml
type: Audiobook Chapter State
work_id: hpmor
chapter_id: hpmor-001
status: narration_in_progress
next_action: review narration segments hpmor-001-s0041..s0060
gates:
  work_ready: true
  source_ready: true
  translation_ready: true
  narration_ready: false
  consistency_ready: false
  editorial_review_ready: false
  audio_contract_ready: false
ready_for_audio: false
```

O schema concreto pode usar YAML/JSON derivado, mas os conceitos acima são obrigatórios.

## 4. Invariantes

- `ready_for_audio` só pode ser `true` quando todos os gates obrigatórios forem `true`.
- alteração no original invalida tradução/narração afetadas.
- alteração na tradução invalida narração/revisões afetadas.
- alteração apenas em backend TTS não invalida tradução/narração, mas invalida plano/cache de áudio quando relevante.
- um capítulo publicado pode voltar a ter áudio regenerado sem mudar seu `chapter_id`/GUID.
- nenhuma etapa de produção pode depender de remover notas ou seções do body antes da síntese.

## 5. Gate de CI

O workflow de TTS deve começar com um comando equivalente a:

```text
audiobook validate --work <work_id> --chapter <id> --require-ready-for-audio
```

Falha nesse comando deve impedir qualquer despacho para API, Colab ou Kaggle.

Durante a migração, `scripts/audiobook/validate-okf.py` reporta `legacy_narration_segments`; o gate de audio readiness deve exigir zero no capítulo.

## 6. Retomada pelo agente recorrente

O agente editorial escolhe prioritariamente:

1. unidades com gate imediatamente desbloqueável;
2. trabalho já iniciado antes de abrir nova unidade;
3. dependências globais que bloqueiam múltiplos capítulos;
4. próximo capítulo ainda não iniciado.

Assim, a rotina horária converge para capítulos completos em vez de espalhar trabalho parcial pela obra inteira.
