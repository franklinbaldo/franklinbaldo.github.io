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

A direção deve usar conceitos estáveis, por exemplo:

```yaml
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

Exemplos:

- `narrator`
- `harry`
- `mcgonagall`
- `krishna`
- `arjuna`

A mesma identidade lógica pode mapear para configurações diferentes conforme o backend do benchmark/produção.

## 6. Pronúncia

Pronúncias recorrentes pertencem a `pronunciation.yaml` da obra, não a correções copiadas em dezenas de capítulos.

Uma exceção local pode existir quando a mesma grafia deve soar de forma diferente naquele contexto.

## 7. Contrato do body: payload TTS puro

Para `Audiobook Narration Segment`, o frontmatter é o plano de execução e o body é o payload de síntese.

A fronteira é deliberadamente rígida:

```text
frontmatter = identidade + lineage + voz + prosódia + parâmetros + notas editoriais
body        = exatamente o texto a enviar ao TTS
```

O consumidor deve poder executar conceitualmente `tts(body, frontmatter)` sem remover títulos, notas, comentários ou qualquer outra decoração Markdown.

Consequências normativas:

- o body deve ser não vazio e conter somente material que deve ser pronunciado;
- notas de realização, justificativas, comentários de tradução, instruções ao agente e observações editoriais pertencem ao frontmatter, preferencialmente em `editorial_notes`;
- headings Markdown, fenced code blocks, comentários HTML e separadores editoriais são proibidos no body da narração;
- não criar `## Nota de realização oral` ou seção equivalente depois do texto narrável;
- quebras de parágrafo no body são parte do payload e podem ser preservadas pelo adapter;
- o worker/adaptor não deve ter heurística para "limpar" o body antes do TTS: corpus inválido deve falhar na validação.

Esse contrato vale independentemente do backend. Breeze, Kokoro, Gemini, Higgs ou outro adapter podem usar o frontmatter de formas diferentes, mas recebem o mesmo body canônico.

## 8. Granularidade TTS

O segmento editorial e o request TTS podem coincidir, mas não precisam.

Quando um segmento precisa ser dividido em vários requests, a relação deve ser derivada e determinística. Não destruir o `segment_id` editorial apenas por limitação do modelo.

Mesmo quando um adapter divide um segmento, a fonte de texto continua sendo exclusivamente o body do shard de narração.

## 9. Revisão oral

Antes de `narration_ready`, ler mentalmente/em voz alta procurando:

- frases que exigem visão da pontuação para serem entendidas;
- números/siglas ambíguos;
- nomes estrangeiros suscetíveis a erro;
- transições de speaker incorretas;
- direção emocional excessiva ou arbitrária;
- pausas que quebram a sintaxe;
- requests longos demais para geração estável;
- qualquer texto no body que não deva ser pronunciado.

## 10. Feedback pós-TTS

Erro observado no áudio deve ser corrigido na camada mais alta adequada:

- erro lexical/semântico -> tradução;
- problema de forma oral -> narração;
- pronúncia recorrente -> `pronunciation.yaml`;
- problema de um backend específico -> adapter/configuração do backend.

Não contaminar o corpus global com workaround específico de modelo quando o adapter consegue resolver.
