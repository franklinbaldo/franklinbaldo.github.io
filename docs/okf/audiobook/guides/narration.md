---
type: Style Guide
title: Audiobook Factory — guia global de narração
description: Regras provider-neutral para transformar tradução aprovada em texto e direção prontos para TTS.
tags: [audiobook, narration, tts, style-guide, okf]
timestamp: 2026-08-30T20:19:00Z
---

# Guia global de narração

## 1. Objetivo

A camada de narração adapta uma tradução aprovada para realização oral por TTS sem alterar seu sentido.

Ela pode mudar a forma superficial do texto quando isso melhora pronúncia, prosódia, pausas ou segmentação.

## 2. Transformações permitidas

- ajustar pontuação para obter pausas naturais;
- expandir siglas, números, símbolos e abreviações quando a forma escrita seria pronunciada incorretamente;
- dividir frases longas em requests menores;
- marcar `speaker` lógico;
- registrar emoção, ritmo, intensidade, pausa e intenção em vocabulário provider-neutral;
- aplicar regras de pronúncia da obra;
- remover elementos tipográficos que não devem ser verbalizados;
- inserir forma oral equivalente quando necessária para preservar compreensão sem contexto visual.

## 3. Transformações proibidas por default

- resumir conteúdo;
- mudar fatos ou relações lógicas;
- reescrever humor ou estilo sem necessidade oral;
- criar falas não existentes;
- inserir explicações editoriais ao ouvinte;
- usar tags proprietárias de Breeze, Higgs, Qwen, Fish, Chatterbox ou outro backend no corpus canônico.

## 4. Direção provider-neutral

A direção deve usar conceitos estáveis no frontmatter, por exemplo:

```yaml
tts_body_contract: body-is-payload-v1
speaker: narrator
emotion: contemplative
pace: slow
intensity: low
pause_before_ms: 0
pause_after_ms: 600
editorial_notes:
  - "Leitura contida; não acrescentar emoção ausente do texto."
```

Adapters podem traduzir isso para prompting, tokens especiais, parâmetros ou SSML específicos do backend.

## 5. Vozes

A narração referencia nomes lógicos declarados em `voices.yaml`.

Nunca gravar diretamente no capítulo um voice ID efêmero de fornecedor.

## 6. Pronúncia

Pronúncias recorrentes pertencem a `pronunciation.yaml` da obra, não a correções copiadas em dezenas de capítulos.

Uma exceção local pode existir quando a mesma grafia deve soar de forma diferente naquele contexto.

## 7. Contrato executável do body

Um `Audiobook Narration Segment` que declara `tts_body_contract: body-is-payload-v1` é um envelope diretamente executável pelo adapter TTS:

```text
frontmatter = identidade + lineage + voz + prosódia + parâmetros + notas editoriais
body        = exatamente o texto a sintetizar
```

O consumidor deve poder fazer conceitualmente `tts(body, frontmatter)` sem remover nada do body.

Portanto:

- o body deve ser não vazio e conter somente material que deve ser pronunciado;
- notas de realização, justificativas, instruções ao agente e observações editoriais ficam no frontmatter, em especial `editorial_notes`;
- headings Markdown, fenced code blocks, comentários HTML e separadores editoriais são proibidos no body;
- `## Nota de realização oral` e equivalentes são inválidos no body;
- quebras de parágrafo do body fazem parte do payload;
- o worker não deve possuir heurística para limpar notas do body: corpus inválido deve falhar antes do TTS.

Shards legados ainda sem `tts_body_contract` podem existir durante a migração, mas um capítulo não pode atingir `ready_for_audio` enquanto houver shard de narração legado.

## 8. Granularidade TTS

O segmento editorial e o request TTS podem coincidir, mas não precisam. Se um adapter precisar dividir um segmento, a divisão deve ser derivada e determinística, sem alterar o `segment_id`; a fonte textual continua sendo exclusivamente o body canônico.

## 9. Revisão oral

Antes de `narration_ready`, verificar também se existe qualquer texto no body que não deva ser pronunciado.

## 10. Feedback pós-TTS

Erro observado no áudio deve ser corrigido na camada mais alta adequada:

- erro lexical/semântico -> tradução;
- problema de forma oral -> narração;
- pronúncia recorrente -> `pronunciation.yaml`;
- problema de um backend específico -> adapter/configuração do backend.

Não contaminar o corpus global com workaround específico de modelo quando o adapter consegue resolver.
