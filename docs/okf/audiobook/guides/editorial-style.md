---
type: Style Guide
title: Audiobook Factory — guia editorial global
description: Defaults editoriais compartilhados por todas as obras antes de overrides específicos.
tags: [audiobook, style-guide, editorial, okf]
timestamp: 2026-08-30T20:17:00Z
---

# Guia editorial global

## 1. Função

Este documento define defaults da Audiobook Factory. Cada obra pode declarar overrides em `data/audiobooks/<work_id>/editorial.md`.

## 2. Princípios

1. **Rastreabilidade antes de elegância.** Toda transformação deve continuar ligada ao segmento de origem.
2. **Três textos, três responsabilidades.** Original preserva; tradução comunica; narração realiza oralmente.
3. **Mudança mínima suficiente.** Não adaptar o que já funciona.
4. **Consistência longitudinal.** Decisões de nomes, termos, tratamento e voz são reutilizadas nos capítulos seguintes.
5. **Dúvida explícita.** Incerteza editorial vira nota/bloqueio; não é resolvida silenciosamente por improviso.
6. **Leitura em voz alta é teste.** A camada de narração deve soar natural sem depender de o ouvinte ver a página.
7. **Provider-neutral.** O corpus não fala a linguagem proprietária do TTS.

## 3. Segmentação

Segmentos devem ser grandes o suficiente para preservar prosódia e pequenos o suficiente para revisão/regeneração localizada.

Defaults:

- diálogo: uma fala coerente por segmento, salvo quando contexto curto precisa ficar junto;
- narração: parágrafo ou unidade prosódica coerente;
- verso: preservar unidade poética definida pela obra;
- títulos/cabeçalhos: segmentos próprios quando efetivamente narrados;
- notas/editoriais: não narradas por default, salvo decisão da obra.

IDs não carregam significado editorial mutável. Use sequência estável namespaced por obra/unidade.

## 4. Pontuação e tipografia

A tradução segue convenções de escrita. A narração pode divergir na pontuação apenas quando isso melhora a realização oral.

Não introduzir grafias fonéticas na tradução canônica. Pronúncia especial pertence à configuração de narração/pronúncia.

## 5. Continuidade

Decisões recorrentes devem sair do capítulo e subir para documentos da obra quando aparecerem pela segunda vez ou quando forem claramente globais.

Exemplos:

- forma escolhida para um nome;
- tradução de termo recorrente;
- registro de fala de personagem;
- pronúncia de nome próprio;
- tratamento formal/informal;
- regra para números, siglas ou fórmulas.

## 6. Revisão

A revisão final deve procurar principalmente:

- perda de conteúdo;
- alteração de sentido;
- português artificial;
- inconsistência terminológica;
- fala impossível/estranha em voz alta;
- speaker incorreto;
- instrução de TTS vazando para a tradução;
- dependência de contexto visual ausente no áudio.
