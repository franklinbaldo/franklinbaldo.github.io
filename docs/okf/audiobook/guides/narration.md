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

## 4. Contrato executável do shard de narração

Um `Audiobook Narration Segment` sob o contrato `tts-body-v1` é um envelope executável para TTS:

```text
frontmatter = identidade + lineage + parâmetros TTS + direção + notas
body        = exatamente o payload textual enviado ao sintetizador
```

O consumidor não deve precisar remover títulos, notas, comentários ou Markdown do body. A operação correta deve poder ser conceitualmente `tts(body, frontmatter)`.

Consequências normativas:

- o body não contém `## Nota de realização oral`, notas editoriais, comentários de revisão ou qualquer seção auxiliar;
- notas pertencem ao frontmatter, preferencialmente em `editorial_notes` quando são locais ao segmento;
- parâmetros de execução pertencem ao frontmatter (`speaker`, `emotion`, `pace`, `intensity`, pausas, partição de voz e campos provider-neutral equivalentes);
- o body pode conter vários parágrafos quando todos eles devem ser sintetizados exatamente como estão;
- Markdown estrutural que não deva ser pronunciado não pode sobreviver no body;
- o body não pode ser vazio;
- adapters de backend recebem o body sem heurística editorial de limpeza.

Cada obra declara em `work.md` o contrato e o primeiro segmento a que ele se aplica:

```yaml
narration_payload_contract: tts-body-v1
narration_payload_contract_from: <segment_id>
```

Isso permite migração explícita de corpus legado sem enfraquecer o contrato para unidades novas. Obras futuras devem preferir `tts-body-v1` desde o primeiro segmento.

## 5. Direção provider-neutral

A direção deve usar conceitos estáveis, por exemplo:

```yaml
speaker: narrator
emotion: contemplative
pace: slow
intensity: low
pause_before_ms: 0
pause_after_ms: 600
editorial_notes:
  - "Manter a frase contida; não inventar suspiro."
```

Adapters podem traduzir isso para prompting, tokens especiais, parâmetros ou SSML específicos do backend. `editorial_notes` não é payload de síntese salvo se um adapter explicitamente converter alguma informação estruturada em instrução suportada; nunca é concatenado ao body.

## 6. Vozes

A narração referencia nomes lógicos declarados em `voices.yaml`.

Nunca gravar diretamente no capítulo um voice ID efêmero de fornecedor.

Exemplos:

- `narrator`
- `harry`
- `mcgonagall`
- `krishna`
- `arjuna`

A mesma identidade lógica pode mapear para configurações diferentes conforme o backend do benchmark/produção.

## 7. Pronúncia

Pronúncias recorrentes pertencem a `pronunciation.yaml` da obra, não a correções copiadas em dezenas de capítulos.

Uma exceção local pode existir quando a mesma grafia deve soar de forma diferente naquele contexto.

## 8. Granularidade TTS

A unidade canônica deve ser escolhida por continuidade semântica e prosódica, não por regra mecânica de uma frase ou um parágrafo por `segment_id`.

Microsegmentação sentence-by-sentence é um antipadrão quando quebra um mesmo movimento narrativo ou raciocínio. TTS modernos se beneficiam de contexto suficiente para resolver ritmo, entonação, continuidade e fechamento de período. Por outro lado, não se deve juntar cenas, speakers ou movimentos retóricos claramente distintos só para aumentar o payload.

Como default editorial do repositório, um body entre aproximadamente 240 e 1800 caracteres é a faixa normal de trabalho. Esses números não são limites técnicos de Kokoro, Breeze ou qualquer outro backend: são sentinelas de revisão para detectar segmentação provavelmente pequena demais ou grande demais.

Um segmento abaixo de 240 caracteres só é aceito sob `tts-body-v1` quando o frontmatter registra `short_segment_reason`, por exemplo uma fala isolada, uma batida dramática deliberada ou uma mudança de speaker que deva permanecer separada. Um segmento acima de 1800 caracteres exige `long_segment_reason`, registrando por que a continuidade semântico-prosódica vale mais do que a divisão.

O segmento editorial e o request físico do backend também não precisam coincidir. Se um backend tiver limite menor, o adapter pode subdividir o body de forma derivada e determinística, preservando `segment_id`; essa limitação não deve contaminar o corpus canônico.

## 9. Revisão oral

Antes de `narration_ready`, ler mentalmente/em voz alta procurando:

- frases que exigem visão da pontuação para serem entendidas;
- números/siglas ambíguos;
- nomes estrangeiros suscetíveis a erro;
- transições de speaker incorretas;
- direção emocional excessiva ou arbitrária;
- pausas que quebram a sintaxe;
- segmentação curta demais para preservar o movimento semântico/prosódico;
- segmentação longa demais sem motivo editorial claro;
- qualquer conteúdo no body que seja metadado ou nota em vez de fala.

## 10. Feedback pós-TTS

Erro observado no áudio deve ser corrigido na camada mais alta adequada:

- erro lexical/semântico -> tradução;
- problema de forma oral -> narração;
- pronúncia recorrente -> `pronunciation.yaml`;
- problema de um backend específico -> adapter/configuração do backend.

Não contaminar o corpus global com workaround específico de modelo quando o adapter consegue resolver.
