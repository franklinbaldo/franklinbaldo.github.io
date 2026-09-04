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

## 7. Granularidade TTS

O segmento editorial e o request TTS podem coincidir, mas não precisam.

Quando um segmento precisa ser dividido em vários requests, a relação deve ser derivada e determinística. Não destruir o `segment_id` editorial apenas por limitação do modelo.

## 8. Revisão oral

Antes de `narration_ready`, ler mentalmente/em voz alta procurando:

- frases que exigem visão da pontuação para serem entendidas;
- números/siglas ambíguos;
- nomes estrangeiros suscetíveis a erro;
- transições de speaker incorretas;
- direção emocional excessiva ou arbitrária;
- pausas que quebram a sintaxe;
- requests longos demais para geração estável.

## 9. Feedback pós-TTS

Erro observado no áudio deve ser corrigido na camada mais alta adequada:

- erro lexical/semântico -> tradução;
- problema de forma oral -> narração;
- pronúncia recorrente -> `pronunciation.yaml`;
- problema de um backend específico -> adapter/configuração do backend.

Não contaminar o corpus global com workaround específico de modelo quando o adapter consegue resolver.
