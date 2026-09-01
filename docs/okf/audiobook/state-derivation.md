---
type: Audiobook Architecture Contract
status: active
scope: multi-work
---

# Estado derivado dos documentos

A Audiobook Factory não mantém um ledger mutável de workflow. Em particular, `data/audiobooks/<work_id>/state.yaml` não é uma fonte canônica e não deve ser recriado.

## Autoridades

`work.md` declara identidade e configuração da obra. `rights.md` declara no frontmatter se trabalho editorial é permitido e se distribuição pública é autorizada. Os documentos de source, translation e narration declaram identidade, lifecycle e gates próprios no frontmatter. Metadata de publicação de um capítulo pertence ao frontmatter do documento de narration desse capítulo.

## Unidade concluída

Um `segment_id` está editorialmente concluído somente quando a mesma identidade canônica existe nas três camadas: source, translation e narration. A presença em apenas uma ou duas camadas não é completion.

A implementação pode ler tanto os snapshots agregados de capítulo quanto os shards OKF por segmento. Shards com `status: canonical-editorial-unit` ou `status: canonical` contam como presença canônica.

## Cursor

O próximo segmento é derivado, nunca persistido. Para um `chapter_id`, percorra `s0001`, `s0002`, ... e selecione a primeira unidade que ainda não aparece canonicamente nas três camadas. Assim, remover ou invalidar uma camada automaticamente recua o cursor para a primeira lacuna real.

## Readiness

`ready_for_audio` é a conjunção derivada dos gates de work/source/translation/narration/consistency/editorial-review/audio-contract. Não grave uma cópia de `ready_for_audio` em outro ledger para controlá-lo.

TTS continua proibido enquanto a derivação não produzir `ready_for_audio: true`.

## Publicação

`rights.md` é a autoridade para `public_distribution_authorized`. O workflow de publicação deve falhar fechado quando esse campo não for explicitamente `true`. Depois da publicação, enclosure, transcript, digest, duração e timestamp são registrados no frontmatter da narração do capítulo.

## Inspeção

Use `npm run audiobook:status -- --work <work_id> [--chapter <chapter_id>] [--json]` para reconstruir o retrato operacional. O comando é somente leitura; seu resultado pode ser descartado e regenerado a qualquer momento.
