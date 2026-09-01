---
type: Architecture Decision Record
title: Audio Publishing Pipeline — matérias, audiolivros, Internet Archive e feeds
status: accepted
tags: [audio, blog, podcast, internet-archive, audiobook, okf, tts]
timestamp: 2026-09-01T18:58:00Z
---

# Audio Publishing Pipeline

## Decisão

O repositório passa a tratar áudio como uma capacidade editorial transversal. Audiolivros continuam sendo uma especialização, mas matérias do blog também podem possuir uma versão em áudio usando a mesma media pipeline.

O fluxo canônico para matérias é:

```text
post Markdown canônico
  -> preparação de narração
  -> validação/readiness
  -> TTS
  -> arquivo de áudio
  -> upload para Internet Archive
  -> verificação do objeto público
  -> metadata de publicação no repositório
  -> player no post + feed de áudio do blog
```

O fluxo canônico de audiolivros permanece:

```text
source/original OKF
  -> translation OKF
  -> narration OKF
  -> validation/readiness
  -> TTS
  -> Internet Archive
  -> player/feed da obra
```

## Fonte de verdade

O repositório continua sendo a fonte de verdade editorial e de metadados. O Internet Archive é o storage público dos binários de áudio finais. MP3/WAV finais não devem ser versionados no Git.

Cada item de áudio publicado deve persistir no repositório, no mínimo:

- `audio_id` estável;
- identidade da fonte (`post_slug` ou `work_id` + `chapter_id`);
- URL canônica da matéria/obra;
- `internet_archive_item`;
- URL pública do arquivo no Internet Archive;
- MIME type;
- tamanho em bytes;
- digest do arquivo quando disponível;
- duração;
- backend de TTS e versão do pipeline;
- data de publicação;
- estado de verificação.

## Identidade

Matérias usam identidade independente dos audiolivros:

```text
audio:blog:<post-slug>
```

Audiolivros mantêm sua identidade própria:

```text
audiobook:<work_id>:<chapter_id>
```

Regenerar mídia, trocar TTS, runner ou storage não muda o identificador editorial. Uma nova mídia para o mesmo conteúdo substitui a mídia associada ao mesmo `audio_id`, preservando histórico no Internet Archive quando aplicável.

## Preparação de narração para posts

O Markdown publicado é a fonte canônica. A preparação oral pode somente transformar aspectos necessários à fala, por exemplo:

- expandir siglas quando isso melhora inteligibilidade;
- decidir como ler URLs, código e símbolos;
- introduzir pausas;
- separar citação de voz autoral;
- fornecer pronúncia e direção de voz.

Ela não pode alterar argumento, informação factual ou posição editorial da matéria.

## Readiness

Nenhum áudio de produção pode ser gerado até a unidade estar explicitamente `ready_for_audio` e os gates relevantes passarem. Para posts, isso inclui pelo menos:

1. Markdown fonte existente e publicado ou marcado para publicação;
2. camada de narração completa;
3. voz e pronúncias resolvidas;
4. validação estrutural;
5. provenance e direitos compatíveis;
6. ausência de placeholders editoriais.

TTS é a única etapa da pipeline autorizada a usar modelo externo. Tradução, reescrita, adaptação oral e decisões editoriais não podem chamar LLM externo.

## Internet Archive

O Internet Archive é o destino padrão dos áudios públicos. O job de publicação deve:

1. gerar a mídia somente após readiness;
2. enviar o arquivo para um item determinístico do Internet Archive;
3. aguardar disponibilidade pública;
4. verificar a URL final com request HTTP e conferir MIME/bytes;
5. só então persistir a referência de mídia no repositório e liberar player/feed.

A publicação deve ser fail-closed: falha de upload ou de verificação não atualiza feed nem página como se o áudio estivesse disponível.

## Player nas matérias

Quando uma matéria possuir metadata de áudio verificada, sua página deve mostrar um player HTML nativo apontando para a URL pública no Internet Archive. A matéria continua legível integralmente sem JavaScript e sem depender do Internet Archive para o HTML principal.

## Feed de áudio do blog

O site deve expor um feed RSS próprio para matérias em áudio, separado dos feeds de cada audiolivro. Cada item deve ter GUID estável derivado de `audio_id` e enclosure apontando para o arquivo público no Internet Archive.

Uma forma canônica é:

```text
/audio/feed.xml
```

O feed só inclui itens cuja mídia esteja `verified`.

## Multi-work

Esta decisão não cria uma pipeline paralela para posts. Ela generaliza a camada de mídia existente para aceitar diferentes tipos de fonte. HPMOR, Bhagavad Gita, futuras obras e matérias do blog compartilham os mesmos princípios de identidade, readiness, TTS, storage remoto, verificação e publicação.

## Próximas PRs

A implementação deve seguir em pilha:

1. modelo de metadata de áudio para posts + player + feed RSS;
2. workflow de upload/verificação no Internet Archive;
3. primeiro post piloto com preparação de narração e geração end-to-end;
4. só depois, expansão gradual para outras matérias.
