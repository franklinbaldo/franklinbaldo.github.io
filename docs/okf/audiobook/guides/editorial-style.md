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

A unidade canônica deve seguir a **unidade semântico-prosódica**, não o menor parágrafo que possa ser versionado e nem a limitação do backend TTS mais fraco. Modelos modernos se beneficiam de contexto suficiente para manter prosódia, continuidade e intenção.

Defaults:

- prosa de um único speaker: preferir blocos coerentes de aproximadamente **80–240 palavras** quando o texto permitir;
- a faixa **60–320 palavras** é normalmente aceitável; fora dela, revisar conscientemente a fronteira;
- diálogo: preservar uma fala coerente, mas falas curtas adjacentes podem permanecer juntas quando formam uma única batida de cena e o particionamento de voz é explícito;
- narração: vários parágrafos podem e devem permanecer no mesmo segmento quando pertencem ao mesmo movimento de raciocínio ou cena;
- mudança real de speaker, quebra de cena, mudança forte de intenção ou unidade que precise ser regenerada isoladamente são bons motivos para cortar;
- verso: preservar unidade poética definida pela obra;
- títulos/cabeçalhos: segmentos próprios quando efetivamente narrados;
- notas/editoriais: nunca pertencem ao body narrável.

Não criar segmentos de uma frase apenas porque o parágrafo é curto. Se uma frase de transição conduz diretamente ao bloco seguinte com o mesmo speaker e intenção, agregá-la ao bloco.

Essas faixas são **heurísticas editoriais**, não limites de modelo. O adapter de um backend pode subdividir deterministicamente um segmento em requests menores sem alterar `segment_id`.

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
- dependência de contexto visual ausente no áudio;
- segmento curto demais para preservar prosódia sem uma razão editorial real;
- segmento quebrado apenas por parágrafo quando o raciocínio continua diretamente no seguinte.
