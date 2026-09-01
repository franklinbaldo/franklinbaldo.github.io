---
type: Product Architecture
title: Audiobook — per-work podcast publication contract
description: Contrato para publicar cada obra da fábrica de audiolivros como um podcast RSS independente hospedado pelo blog.
tags: [audiobook, podcast, rss, podcasting-2.0, astro, publishing, internet-archive, multi-work]
timestamp: 2026-08-30T18:25:00Z
---

# Publicação de cada obra como podcast

## 1. Objetivo

Toda obra publicável da fábrica de audiolivros recebe seu próprio podcast RSS.

Todo capítulo/unidade da obra marcado como publicável deve poder virar automaticamente um episódio desse podcast.

O usuário assina uma única URL RSS para aquela obra no tocador de sua preferência. Depois disso, novos capítulos publicados pela pipeline aparecem no player sem qualquer ação adicional.

O blog é a identidade pública e canônica dos podcasts; o storage da mídia é infraestrutura substituível.

Exemplos conceituais:

```text
HPMOR
  -> https://franklinbaldo.com/audiobooks/hpmor/feed.xml

Bhagavad Gita
  -> https://franklinbaldo.com/audiobooks/bhagavad-gita/feed.xml
```

Não existe dependência arquitetural de HPMOR neste contrato.

## 2. Identidade estável

Cada obra recebe uma URL estável de feed derivada do `publication_slug`/`work_id`, por exemplo:

```text
https://franklinbaldo.com/audiobooks/hpmor/feed.xml
https://franklinbaldo.com/audiobooks/bhagavad-gita/feed.xml
```

A URL exata será definida pela estrutura pública do site, mas depois de publicada deve ser considerada parte do contrato externo.

Cada unidade publicada corresponde a um `<item>` RSS com GUID estável derivado da identidade canônica da obra + unidade, nunca do arquivo de áudio.

Exemplo conceitual:

```text
podcast_id: audiobook:hpmor
chapter_id: hpmor-001
episode_guid: audiobook:hpmor:hpmor-001
```

```text
podcast_id: audiobook:bhagavad-gita
chapter_id: bhagavad-gita-001
episode_guid: audiobook:bhagavad-gita:bhagavad-gita-001
```

Regenerar o áudio, mudar backend TTS, runner, codec ou storage **não cria novo episódio**. O GUID permanece o mesmo.

## 3. RSS

Cada feed deve seguir RSS 2.0 e incluir o namespace `itunes` para compatibilidade ampla. Deve ser público e não exigir autenticação.

Cada episódio deve incluir, no mínimo:

- `title`;
- `guid` estável;
- `pubDate`;
- descrição;
- `<enclosure>` com URL HTTPS, tamanho em bytes e MIME type;
- duração quando disponível;
- link para a página da unidade/capítulo no blog.

O feed deve ser validável por ferramentas de podcast antes de publicação.

Referência de interoperabilidade: [Apple Podcasts — RSS feed requirements](https://podcasters.apple.com/support/823-podcast-requirements).

## 4. Áudio do episódio

O formato de distribuição inicial preferido é MP3 ou AAC, mantendo WAV/FLAC apenas como intermediário/master quando necessário.

Para narrativa predominantemente mono, MP3 mono em faixa adequada a voz é suficiente como baseline; encoding final fica separado da geração TTS para poder ser alterado sem regenerar a fala.

A URL usada no `<enclosure>` precisa:

- ser pública e estável;
- aceitar `HEAD`;
- aceitar byte-range/range requests para streaming e seek;
- devolver Content-Type correto;
- não depender de cookie ou sessão;
- permanecer acessível depois que o workflow de Actions terminar.

Referência de áudio: [Apple Podcasts — audio requirements](https://podcasters.apple.com/support/893-audio-requirements).

## 5. Feed no blog; mídia fora do Pages

O feed, páginas HTML, artwork, transcript e manifests pequenos podem ser publicados pelo próprio site.

O áudio integral **não deve depender de caber no deploy do GitHub Pages**. Um acervo com vários audiolivros torna essa separação ainda mais importante.

Referência: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

A arquitetura separa:

```text
Blog / GitHub Pages
  /audiobooks/
  /audiobooks/<work_id>/
  /audiobooks/<work_id>/feed.xml
  transcript / chapters / artwork / páginas
             |
             | enclosure URL
             v
Media storage por obra
  - 001.mp3
  - 002.mp3
  - ...
```

O backend de mídia é substituível. A identidade do podcast não muda quando o storage muda.

### 5.1. Internet Archive como destino durável preferencial

O **Internet Archive** é o destino durável preferencial para os arquivos finais publicados, sem ser requisito para o primeiro protótipo.

A unidade padrão de storage deve ser **um item do Internet Archive por obra**, evitando misturar múltiplos audiolivros em um único item global.

Exemplos conceituais:

```text
work_id: hpmor
archive_identifier: franklinbaldo-hpmor-ptbr-audiobook
```

```text
work_id: bhagavad-gita
archive_identifier: franklinbaldo-bhagavad-gita-ptbr-audiobook
```

Cada item pode conter:

```text
001.mp3
002.mp3
...
cover.jpg
manifest.json
```

A associação `work_id -> archive_identifier` é persistida na configuração da obra. O workflow não inventa um item novo a cada execução.

A motivação é separar três funções:

- Git mantém código, corpus, configuração, manifests e proveniência;
- GitHub Pages mantém catálogo, identidade pública, páginas e feeds RSS;
- Internet Archive mantém mídia final destinada à distribuição durável.

O fluxo pode começar usando artifacts temporários de GitHub Actions ou outro storage experimental. A promoção para Internet Archive entra quando a publicação estiver estável.

O upload deve ser totalmente headless e acionável pelo mesmo GitHub Actions, preferencialmente através do cliente `ia`/biblioteca `internetarchive` ou API equivalente, com credenciais mantidas exclusivamente em GitHub Secrets.

Antes de inserir uma URL do Archive em `<enclosure>`, `publish` deve verificar empiricamente que a URL final satisfaz o contrato HTTP desta especificação (`HEAD`, range requests, MIME e estabilidade).

O manifesto de publicação registra:

- `work_id`;
- identifier do item no Internet Archive;
- nome do arquivo remoto;
- URL pública final usada no `<enclosure>`;
- digest local e, quando disponível, digest reportado pelo storage;
- momento do upload;
- resultado da verificação HTTP pós-upload.

A substituição de um áudio regenerado não altera o `episode_guid`.

## 6. Publicação pela mesma pipeline

O estágio `publish` recebe uma unidade já montada e validada e conhece seu `work_id`.

Fluxo:

1. validar áudio final;
2. calcular digest, bytes, duração e MIME;
3. resolver configuração de publicação da obra;
4. enviar o arquivo para media storage — preferencialmente o item do Internet Archive daquela obra quando habilitado;
5. verificar `HEAD` e range request na URL pública;
6. gerar/atualizar metadata do episódio;
7. gerar transcript/timestamps derivados quando disponíveis;
8. reconstruir **somente o feed da obra afetada** e, quando necessário, o catálogo agregado;
9. executar validação do feed;
10. publicar o site;
11. registrar no manifesto a URL do enclosure e a versão publicada.

A ordem é importante: o feed nunca aponta para um enclosure que ainda não esteja publicamente acessível.

Uma publicação de HPMOR não deve reescrever semanticamente o estado de publicação do Bhagavad Gita, e vice-versa.

## 7. Estado de publicação

O corpus textual não deve ser publicado como episódio apenas porque existe áudio.

Cada unidade tem lifecycle explícito, por exemplo:

```yaml
publication:
  status: draft # draft | ready | published
  published_at: null
```

Somente `ready` pode ser promovido por um workflow autorizado para `published`.

O status editorial pertence à obra/unidade; não ao runner de compute.

## 8. Podcasting 2.0

Cada feed deve poder usar o namespace Podcasting 2.0 sem tornar isso requisito para players tradicionais.

### 8.1. Transcript

Como a pipeline já conhece texto, speakers e limites temporais dos segmentos, ela pode gerar WebVTT de alta qualidade sem transcrever novamente o áudio.

Cada episódio pode expor:

```xml
<podcast:transcript
  url="https://.../001.vtt"
  type="text/vtt"
  language="pt-BR"
  rel="captions" />
```

O transcript é derivado da camada de narração + timestamps efetivamente produzidos pelo áudio, não da tradução isoladamente.

Referências:

- [Podcasting 2.0 — transcript tag](https://podcasting2.org/docs/podcast-namespace/tags/transcript)
- [Podcasting 2.0 — transcript formats](https://podcasting2.org/docs/podcast-namespace/examples/transcripts/transcripts)

### 8.2. Chapters

A pipeline pode gerar um arquivo JSON de capítulos/marcadores e referenciá-lo com `<podcast:chapters>`.

Mesmo que cada episódio corresponda a uma divisão da obra, os chapters internos podem representar cenas, seções, versos/blocos ou outros marcos úteis dentro de episódios longos.

Referência: [Podcasting 2.0 — chapters](https://podcasting2.org/docs/podcast-namespace/tags/chapters).

## 9. Relação com as três camadas OKF

O podcast não cria uma quarta fonte textual.

```text
work
  -> original OKF
      -> translation OKF
          -> narration OKF
              -> audio
                  -> podcast episode
```

A descrição pública e o transcript podem ser gerados a partir das fontes canônicas, mas não substituem nenhuma delas.

## 10. Página da obra e episódio no blog

Cada obra deve ter página própria e cada episódio/unidade, página reproduzível por template genérico.

A página da obra oferece:

- título/atribuição;
- capa/artwork;
- descrição;
- índice de episódios/unidades;
- player quando aplicável;
- URL/ação de assinatura do feed daquela obra.

A página de episódio pode oferecer:

- título/unidade;
- player HTML;
- duração;
- data de publicação;
- texto em português quando a política da obra permitir;
- opcionalmente original e comparação lado a lado;
- informação técnica de produção, se desejado.

O player web e o player de podcast consomem o mesmo arquivo de mídia final.

## 11. Catálogo e assinatura

`/audiobooks/` é o catálogo agregado do blog, não um substituto dos feeds individuais.

Ele lista as obras disponíveis e oferece claramente a assinatura de cada podcast.

A primeira versão não depende de cadastro em diretórios: qualquer player que aceite URL RSS diretamente deve funcionar.

Submissão futura a Apple Podcasts, Podcast Index ou outros diretórios é etapa de distribuição separada por obra e não muda os feeds canônicos do blog.

## 12. Critério de aceite

A publicação multi-work como podcast está funcional quando:

1. uma obra pode ter seu feed gerado sem código exclusivo;
2. um capítulo/unidade `ready` é publicado por GitHub Actions;
3. o áudio fica disponível em URL estável com streaming/seek;
4. o feed correto da obra é atualizado automaticamente;
5. o episódio mantém GUID estável entre regenerações;
6. os feeds de HPMOR e de uma segunda fixture/obra podem coexistir sem colisão;
7. um feed pode ser adicionado manualmente a um player de podcast;
8. após publicar um segundo capítulo, o player o recebe como novo episódio sem nova assinatura;
9. transcript e chapters opcionais não quebram compatibilidade RSS tradicional;
10. quando Internet Archive estiver ativado, upload e verificação pós-upload são feitos integralmente pelo workflow e no item correspondente àquela obra.
