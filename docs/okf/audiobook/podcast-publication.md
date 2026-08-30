---
type: Product Architecture
title: Audiobook — podcast publication contract
description: Contrato para publicar capítulos de audiolivro como episódios de um podcast RSS hospedado pelo blog.
tags: [audiobook, podcast, rss, podcasting-2.0, astro, publishing, internet-archive]
timestamp: 2026-08-30T18:25:00Z
---

# Publicação do audiolivro como podcast

## 1. Objetivo

Todo capítulo de audiolivro marcado como publicável deve poder virar automaticamente um episódio de podcast.

O usuário assina uma única URL RSS no tocador de sua preferência. Depois disso, novos capítulos publicados pela pipeline aparecem no player sem qualquer ação adicional.

O blog é a identidade pública e canônica do podcast.

## 2. Identidade estável

Cada obra recebe uma URL estável de feed, por exemplo:

```text
https://franklinbaldo.com/audiobooks/hpmor/feed.xml
```

A URL exata será definida pela estrutura pública do site, mas depois de publicada deve ser considerada parte do contrato externo.

Cada capítulo corresponde a um `<item>` RSS com GUID estável derivado da identidade canônica do capítulo, nunca do arquivo de áudio.

Exemplo conceitual:

```text
podcast_id: audiobook-hpmor
chapter_id: hpmor-001
episode_guid: audiobook-hpmor:hpmor-001
```

Regenerar o áudio, mudar backend TTS ou corrigir metadados **não cria novo episódio**. O GUID permanece o mesmo.

## 3. RSS

O feed deve seguir RSS 2.0 e incluir o namespace `itunes` para compatibilidade ampla. Deve ser público e não exigir autenticação.

Cada episódio deve incluir, no mínimo:

- `title`;
- `guid` estável;
- `pubDate`;
- descrição;
- `<enclosure>` com URL HTTPS, tamanho em bytes e MIME type;
- duração quando disponível;
- link para a página do capítulo no blog.

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

## 5. Feed no blog; mídia fora do Pages quando necessário

O feed, páginas HTML, artwork, transcript e manifests pequenos podem ser publicados pelo próprio site.

O áudio integral **não deve depender de caber no deploy do GitHub Pages**. Um audiolivro longo pode ultrapassar os limites de tamanho do Pages mesmo com compressão eficiente. O GitHub atualmente recomenda até 1 GB para o repositório-fonte, limita o site publicado a 1 GB e aplica limite de banda mensal soft de 100 GB.

Referência: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

A arquitetura portanto separa:

```text
Blog / GitHub Pages
  - feed.xml
  - página da obra
  - página do capítulo
  - artwork
  - transcript / chapters metadata
             |
             | enclosure URL
             v
Media storage
  - chapter-001.mp3
  - chapter-002.mp3
  - ...
```

O backend de mídia é substituível. A identidade do podcast não muda quando o storage muda.

### 5.1. Internet Archive como destino durável preferencial

O **Internet Archive** é o destino durável preferencial para os arquivos finais publicados do audiolivro, sem ser requisito para o primeiro protótipo.

A motivação é separar três funções diferentes:

- GitHub mantém código, corpus, configuração, manifestos e proveniência;
- GitHub Pages mantém a identidade pública, páginas e feed RSS;
- Internet Archive mantém os binários finais de mídia destinados à distribuição durável.

O fluxo de produção pode começar usando artifacts temporários de GitHub Actions ou outro storage experimental. A promoção para Internet Archive entra quando a pipeline de publicação estiver estável.

O upload deve ser totalmente headless e acionável pelo mesmo GitHub Actions, preferencialmente através do cliente de linha de comando `ia`/biblioteca `internetarchive` ou API equivalente, com credenciais mantidas exclusivamente em GitHub Secrets. O projeto não depende de interação manual no site do Archive.

O upload para Internet Archive deve ser **idempotente**: a obra recebe um identifier estável, e cada capítulo final usa um nome de arquivo determinístico. Um desenho inicial possível é:

```text
Internet Archive item: franklinbaldo-hpmor-ptbr-audiobook

files:
  hpmor-001.mp3
  hpmor-002.mp3
  hpmor-003.mp3
  ...
  cover.jpg
  manifest.json
```

A identidade do item e os nomes exatos ainda podem mudar antes da primeira publicação, mas, depois de expostos no feed, devem ser tratados como contratos externos.

Antes de inserir uma URL do Archive em `<enclosure>`, o estágio `publish` deve verificar empiricamente que a URL final do arquivo satisfaz o contrato de podcast desta especificação (`HEAD`, range requests, MIME e estabilidade). O Internet Archive é o destino preferencial, não uma exceção às validações de interoperabilidade.

A pipeline deve registrar no manifesto de publicação:

- identifier do item no Internet Archive;
- nome do arquivo remoto;
- URL pública final usada no `<enclosure>`;
- digest local e, quando disponível, digest reportado pelo storage;
- momento do upload;
- resultado da verificação HTTP pós-upload.

A substituição de um áudio regenerado não altera o `episode_guid`. O feed pode atualizar o `<enclosure>` para a versão final do mesmo capítulo mantendo a identidade lógica do episódio.

Referência operacional: o projeto oficial `internetarchive` fornece biblioteca Python e a ferramenta de linha de comando `ia`, incluindo upload de arquivos para itens do Archive.

## 6. Publicação pela mesma pipeline

O estágio `publish` recebe um capítulo já montado e validado.

Fluxo:

1. validar áudio final;
2. calcular digest, bytes, duração e MIME;
3. enviar o arquivo para media storage — preferencialmente Internet Archive quando esse backend estiver habilitado;
4. verificar `HEAD` e range request na URL pública;
5. gerar/atualizar metadata do episódio;
6. gerar transcript/timestamps derivados quando disponíveis;
7. reconstruir o feed RSS;
8. executar validação do feed;
9. publicar o site;
10. registrar no manifesto a URL do enclosure e a versão publicada.

A ordem é importante: o feed nunca deve apontar para um enclosure que ainda não esteja publicamente acessível.

## 7. Estado de publicação

O corpus textual não deve ser publicado como episódio apenas porque existe áudio.

Cada capítulo tem lifecycle explícito, por exemplo:

```yaml
publication:
  status: draft # draft | ready | published
  published_at: null
```

Somente `ready` pode ser promovido por um workflow autorizado para `published`.

O status editorial pertence à obra/capítulo; não ao runner de compute.

## 8. Podcasting 2.0

O feed deve poder usar o namespace Podcasting 2.0 sem tornar isso requisito para players tradicionais.

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

Mesmo que cada episódio já corresponda a um capítulo do livro, os chapters internos podem representar cenas, seções ou outros marcos úteis dentro de episódios longos.

Referência: [Podcasting 2.0 — chapters](https://podcasting2.org/docs/podcast-namespace/tags/chapters).

## 9. Relação com as três camadas OKF

O podcast não cria uma quarta fonte textual.

```text
original OKF
    -> translation OKF
        -> narration OKF
            -> audio
                -> podcast episode
```

A descrição pública e o transcript podem ser gerados a partir das fontes canônicas, mas não substituem nenhuma delas.

## 10. Página do episódio no blog

Cada episódio deve ter página própria, com pelo menos:

- título/capítulo;
- player HTML;
- duração;
- data de publicação;
- link do feed/ação de assinatura;
- texto em português quando a política de publicação permitir;
- opcionalmente original e comparação lado a lado;
- informação de modelo/produção em seção técnica discreta, se desejado.

O player web e o player de podcast consomem o mesmo arquivo de mídia final.

## 11. Assinatura

A página da obra deve oferecer claramente a URL do feed e links de assinatura compatíveis com os destinos que forem configurados.

A primeira versão não depende de cadastro em diretórios: qualquer player que aceite URL RSS diretamente deve funcionar.

Submissão futura a Apple Podcasts, Podcast Index ou outros diretórios é uma etapa de distribuição separada e não muda o feed canônico do blog.

## 12. Critério de aceite

A publicação como podcast está funcional quando:

1. um capítulo `ready` é publicado por GitHub Actions;
2. o áudio fica disponível em URL estável com streaming/seek;
3. o feed RSS é atualizado automaticamente;
4. o episódio mantém GUID estável entre regenerações;
5. o feed pode ser adicionado manualmente a um player de podcast;
6. após publicar um segundo capítulo, o player o recebe como novo episódio sem nova assinatura;
7. transcript e chapters opcionais não quebram compatibilidade RSS tradicional;
8. quando o backend Internet Archive estiver ativado, o upload e a verificação pós-upload são feitos integralmente pelo workflow, sem etapa manual.
