---
type: Specification
title: Audiobook Narration Segment — contrato TTS-ready
description: Contrato executável entre a camada editorial de narração e qualquer backend TTS.
tags: [audiobook, narration, tts, okf, specification]
timestamp: 2026-09-01T21:08:00Z
---

# Audiobook Narration Segment — contrato TTS-ready

## Objetivo

Um `Audiobook Narration Segment` canônico é uma unidade diretamente consumível pela etapa TTS. O consumidor não deve precisar remover notas, interpretar headings editoriais ou adivinhar qual parte do Markdown deve ser falada.

O contrato é deliberadamente simples:

```text
frontmatter -> metadados, identidade, lineage, voz, prosódia, parâmetros e notas
body        -> exatamente o texto enviado ao TTS
```

## Invariante principal

O body de um narration shard marcado com `tts_body_contract: tts-input-v1` MUST conter somente material destinado à síntese de voz. Depois de remover o frontmatter e o whitespace externo, o resultado pode ser entregue diretamente ao adapter TTS.

Nenhuma etapa posterior pode depender de limpeza heurística como "cortar tudo depois de ## Nota".

## O que pertence ao frontmatter

Pertencem ao frontmatter:

- `work_id`, `chapter_id`, `segment_id`, `lang`, `derived_from` e `status`;
- `speaker`, `voice_partition` quando aplicável;
- `emotion`, `pace`, `intensity`, `pause_before_ms`, `pause_after_ms`;
- `tts_body_contract`;
- `segmentation_contract` e contagens/justificativas de boundary quando aplicáveis;
- notas editoriais ou de realização em `editorial_notes`;
- exceções locais de pronúncia ou intenção quando previstas pelo schema;
- qualquer informação de controle que não deve ser pronunciada.

## O que pertence ao body

Somente a realização oral final da unidade. O body pode conter múltiplos parágrafos e pontuação necessária à fala, mas não documentação sobre como narrar o próprio texto.

## Granularidade semântica

Novos shards SHOULD usar `segmentation_contract: semantic-span-v1`. O boundary primário é editorial e prosódico, não um parágrafo ou uma frase arbitrária. Um segmento deve manter junto um arco de pensamento, uma fala contínua, uma cena curta ou outro bloco que um TTS moderno consiga interpretar com contexto suficiente.

Como faixa operacional inicial, mirar aproximadamente 120–450 palavras no body quando o texto adjacente compartilha voz, registro e arco semântico. Isso é uma preferência, não uma alegação de limite de modelo. Segmentos abaixo de 80 palavras devem existir apenas quando houver uma quebra real de voz, cena, prosódia ou função editorial; segmentos acima de 600 palavras devem ser revistos para garantir que não estejam misturando arcos distintos.

Quando um shard ficar deliberadamente fora dessas faixas, registrar `segmentation_reason` no frontmatter. Não picotar texto apenas porque há uma quebra de parágrafo no original.

## Conteúdo proibido no body

O body TTS-ready MUST NOT conter:

- headings Markdown;
- listas editoriais;
- fenced code blocks;
- comentários HTML;
- links ou imagens em sintaxe Markdown destinados apenas ao leitor visual;
- seções como `Nota de realização oral`, `Nota editorial`, `Observação` ou equivalentes;
- instruções ao modelo, ao narrador ou ao operador;
- metadata duplicada do frontmatter.

Se algo precisa orientar o TTS sem ser falado, ele pertence ao frontmatter ou ao adapter do backend.

## Exemplo

```yaml
---
type: Audiobook Narration Segment
work_id: hpmor
chapter_id: hpmor-001
segment_id: hpmor-001-s0044
lang: pt-BR
derived_from: ../../translation/segments/hpmor-001-s0044.okf.md
status: canonical-editorial-unit
speaker: narrator
emotion: analytical-unease
pace: medium
intensity: low
pause_before_ms: 140
pause_after_ms: 220
tts_body_contract: tts-input-v1
segmentation_contract: semantic-span-v1
segment_word_count: 233
editorial_notes:
  - "Ler como um único arco cognitivo."
---

Texto integral do arco semântico, pronto para síntese.
```

O adapter pode fazer literalmente `tts(body, frontmatter)` depois da validação.

## Migração

Narration shards legados podem não declarar `tts_body_contract` ou `segmentation_contract`. Eles permanecem legíveis durante a migração, mas não devem ser tratados como TTS-ready sob o contrato atual até receberem o marcador e passarem a validação aplicável.

Novos narration shards MUST usar `tts_body_contract: tts-input-v1` e SHOULD usar `segmentation_contract: semantic-span-v1`. A migração dos shards antigos é estrutural e não altera `work_id`, `chapter_id`, `segment_id` nem o texto a ser falado.

## Readiness

Um capítulo não pode ser considerado `ready_for_audio` enquanto qualquer narration shard canônico necessário ao capítulo estiver sem contrato TTS-ready validado.
