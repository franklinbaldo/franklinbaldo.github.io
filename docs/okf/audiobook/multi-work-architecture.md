---
type: Product Architecture
title: Audiobook factory — multi-work architecture
description: Contrato para transformar múltiplas obras em audiolivros e podcasts independentes usando a mesma pipeline, runners e infraestrutura de publicação.
tags: [audiobook, okf, multi-work, podcast, rss, github-actions, internet-archive]
timestamp: 2026-08-30T18:40:00Z
---

# Fábrica de audiolivros — arquitetura multi-work

## 1. Decisão

O produto não é "o audiolivro do HPMOR". O produto é uma **pipeline genérica de livro -> audiolivro -> podcast** hospedada no repositório do blog.

Cada obra é uma instância independente dessa pipeline.

_Harry Potter and the Methods of Rationality_ é a primeira obra de referência. _Bhagavad Gita_ é o segundo caso de referência para garantir desde o início que a arquitetura não dependa de personagens, inglês como idioma-fonte, estrutura narrativa de romance ou qualquer propriedade específica do HPMOR.

Adicionar uma nova obra deve ser principalmente uma operação de **dados/configuração**, não uma alteração do motor.

```text
                       audiobook engine
                              |
          +-------------------+-------------------+
          |                   |                   |
        hpmor          bhagavad-gita          work-N
          |                   |                   |
  original/translation/  original/translation/   ...
      narration             narration
          |                   |
          v                   v
       podcast A           podcast B
```

## 2. Unidade de produto: Work

A unidade de primeiro nível é `work`.

Cada obra recebe um `work_id` estável, legível e independente do título exibido.

Exemplos:

```yaml
work_id: hpmor
```

```yaml
work_id: bhagavad-gita
```

O `work_id` é usado para:

- localizar o corpus;
- namespacing de `chapter_id` e `segment_id`;
- selecionar a obra na CLI e no GitHub Actions;
- construir URLs públicas;
- construir o identificador lógico do podcast;
- namespacing de cache, manifests e artifacts;
- localizar configuração de vozes e publicação;
- impedir colisões entre obras.

Depois da primeira publicação pública, `work_id` deve ser considerado identidade estável.

## 3. Estrutura de dados

A estrutura canônica é genérica:

```text
data/audiobooks/
  hpmor/
    work.md
    original/
      001.md
      ...
    translation/
      001.md
      ...
    narration/
      001.md
      ...
    voices.yaml

  bhagavad-gita/
    work.md
    original/
      001.md
      ...
    translation/
      001.md
      ...
    narration/
      001.md
      ...
    voices.yaml

scripts/audiobook/
  # código compartilhado por TODAS as obras
  validate.py
  plan.py
  worker.py
  assemble.py
  publish.py
  runners/
    colab.sh
    kaggle.sh
  storage/
    internet_archive.py
```

Nunca deve surgir `scripts/hpmor/` ou implementação equivalente por obra para funções já pertencentes ao motor.

Código específico de uma obra só é aceitável quando representar uma peculiaridade real e inevitável de ingestão/formato da fonte; mesmo nesse caso deve entrar como adapter configurável, não como fork da pipeline.

## 4. Manifesto da obra

Cada obra possui `work.md`, também em Markdown/OKF, como raiz semântica daquele bundle.

Exemplo conceitual para HPMOR:

```markdown
---
type: Audiobook Work
work_id: hpmor
title: Harry Potter and the Methods of Rationality
author: Eliezer Yudkowsky
source_lang: en
target_lang: pt-BR
publication_slug: hpmor
---

# Harry Potter and the Methods of Rationality

Primeira obra de referência da fábrica de audiolivros.
```

Exemplo conceitual para Bhagavad Gita:

```markdown
---
type: Audiobook Work
work_id: bhagavad-gita
title: Bhagavad Gita
source_lang: sa
target_lang: pt-BR
publication_slug: bhagavad-gita
---

# Bhagavad Gita

Obra independente processada pela mesma pipeline.
```

O schema definitivo pode crescer, mas deve permitir pelo menos:

- `work_id`;
- título;
- autoria/atribuição quando aplicável;
- idioma(s) de origem;
- idioma da edição narrada;
- informação de proveniência da fonte;
- configuração editorial/publicação;
- política ou nota sobre direitos/proveniência quando relevante;
- slug público estável.

Direitos autorais não devem ser inferidos automaticamente a partir da idade da obra. O manifesto apenas registra a base/proveniência escolhida para aquela edição; a pipeline técnica não decide por conta própria se um texto pode ser publicado.

## 5. Capítulos e divisões estruturais

`chapter` é o nome operacional inicial da unidade publicável, mas o motor não deve pressupor que toda obra seja um romance moderno.

Uma obra pode mapear sua estrutura natural para essa unidade:

- capítulo de romance;
- capítulo/adhyaya de texto religioso ou filosófico;
- canto;
- livro interno;
- conto;
- ensaio;
- outra divisão editorial apropriada.

A UI pode exibir o nome editorial correto enquanto o contrato interno continua usando uma identidade genérica de unidade, inicialmente `chapter_id` por simplicidade.

Exemplos:

```text
hpmor-001
bhagavad-gita-001
```

Nada no worker TTS deve depender de o conteúdo ser ficção, possuir diálogo ou ter personagens.

## 6. Três camadas por obra

Cada obra mantém o mesmo contrato:

```text
original OKF
    -> translation OKF
        -> narration OKF
            -> audio
```

### 6.1. Original

Representa a fonte escolhida para aquela edição e preserva proveniência.

O idioma de origem não é fixo em inglês. Para Bhagavad Gita pode ser sânscrito, ou outra edição-fonte explicitamente escolhida e documentada.

### 6.2. Translation

Representa a edição textual em `target_lang` usada como tradução canônica para leitura humana.

A pipeline deve permitir obras em que a tradução tenha origem direta na fonte ou em uma edição intermediária, desde que `derived_from` e proveniência tornem essa cadeia explícita.

Se futuramente houver uma obra que já esteja no idioma-alvo e não exija tradução, o motor deve poder representar uma camada equivalente sem duplicação semântica desnecessária; isso é uma extensão do schema, não motivo para duplicar a pipeline.

### 6.3. Narration

É a adaptação oral da edição canônica. Continua provider-neutral e pode introduzir direção de voz, pronúncia, expansão oral, pausas e outras informações necessárias para TTS.

Em HPMOR, `voices.yaml` provavelmente terá vários personagens. Em Bhagavad Gita, a estratégia pode ser narrador único, narrador + vozes distintas, ou outra direção editorial. Isso é configuração da obra, não decisão global do motor.

## 7. Uma CLI, muitas obras

Todos os comandos recebem `--work`.

Exemplos conceituais:

```bash
uv run scripts/audiobook/validate.py --work hpmor
uv run scripts/audiobook/plan.py --work hpmor --chapter 1
uv run scripts/audiobook/worker.py --work hpmor --chapter 1 --backend breeze
```

E, sem mudar o código:

```bash
uv run scripts/audiobook/validate.py --work bhagavad-gita
uv run scripts/audiobook/plan.py --work bhagavad-gita --chapter 1
uv run scripts/audiobook/worker.py --work bhagavad-gita --chapter 1 --backend breeze
```

Não haverá um workflow GitHub Actions por livro. O workflow é genérico e recebe `work_id` como input.

## 8. GitHub Actions multi-work

O ponto único de operação continua sendo GitHub Actions.

O workflow pode expor seleção de obra:

```text
work: hpmor | bhagavad-gita | <outro work_id>
chapter: ...
backend: ...
runner: ...
publish: ...
```

Idealmente a lista de obras é descoberta do conteúdo de `data/audiobooks/*/work.md`, não codificada manualmente no workflow.

Cache, artifacts e concurrency devem ser namespaced por `work_id`.

Exemplo:

```text
audiobook:hpmor:chapter-001
audiobook:bhagavad-gita:chapter-001
```

Uma execução de uma obra nunca invalida ou sobrescreve artifacts de outra.

## 9. Um podcast por obra

Cada obra publicável recebe **seu próprio feed RSS**.

Estrutura pública conceitual:

```text
/audiobooks/
  index.html

/audiobooks/hpmor/
  index.html
  feed.xml
  001/
  002/

/audiobooks/bhagavad-gita/
  index.html
  feed.xml
  001/
  002/
```

Isso produz experiências independentes:

```text
HPMOR -> podcast HPMOR
Bhagavad Gita -> podcast Bhagavad Gita
Work N -> podcast Work N
```

O usuário pode assinar apenas as obras que quiser.

O blog também mantém uma página agregadora `/audiobooks/` listando as obras disponíveis e oferecendo player/assinatura para cada uma.

Não deve existir um único feed global misturando capítulos de todas as obras como única forma de consumo. Um feed agregado futuro pode existir como conveniência, mas nunca substitui os feeds por obra.

## 10. Identidade de podcast e episódio

Cada obra possui `podcast_id` derivado de `work_id` ou declarado no manifesto.

Exemplo:

```text
podcast_id: audiobook:hpmor
podcast_id: audiobook:bhagavad-gita
```

Cada unidade publicada possui GUID independente do arquivo de mídia:

```text
audiobook:hpmor:hpmor-001
audiobook:bhagavad-gita:bhagavad-gita-001
```

Regenerar mídia, trocar TTS, runner ou storage nunca muda o GUID.

## 11. Internet Archive multi-work

O Internet Archive é o destino durável preferencial para mídia publicada, quando ativado.

A unidade padrão de publicação deve ser **um item do Archive por obra**, não um item global contendo todos os audiolivros.

Exemplo conceitual:

```text
franklinbaldo-hpmor-ptbr-audiobook
franklinbaldo-bhagavad-gita-ptbr-audiobook
```

Cada item pode conter:

```text
001.mp3
002.mp3
...
cover.jpg
manifest.json
```

A associação entre `work_id` e identifier remoto é configuração persistida da obra. O workflow nunca deve inventar um novo item a cada execução.

Isso mantém publicação, proveniência, metadata e eventual manutenção independentes por livro.

## 12. Site como catálogo de audiolivros

A seção de audiolivros do blog deve ser data-driven.

Ao adicionar um novo `data/audiobooks/<work_id>/work.md`, o site deve conseguir, após implementação das etapas necessárias:

1. descobrir a obra;
2. gerar sua página de catálogo;
3. listar unidades/capítulos disponíveis;
4. expor o feed RSS próprio;
5. mostrar o player dos episódios publicados;
6. fornecer links para original/tradução/narração conforme a política editorial daquela obra;
7. mostrar status de produção/publicação quando útil.

Adicionar Bhagavad Gita não deve exigir criar uma nova página Astro manualmente se a página genérica de obra já existir.

## 13. Benchmark e configuração podem variar por obra

O benchmark inicial de modelos usa HPMOR e um corpus pt-BR controlado, mas o modelo vencedor não precisa ser global e permanente.

A melhor configuração pode variar por obra:

- HPMOR pode privilegiar interpretação dramática e múltiplas vozes;
- Bhagavad Gita pode privilegiar cadência, clareza, estabilidade e uma direção vocal diferente;
- outra obra pode exigir outro modelo, voz ou ritmo.

Por isso backend/modelo são configuração de produção e entram no manifesto do áudio, não na identidade semântica da obra.

## 14. Critérios de aceite da arquitetura multi-work

A arquitetura está corretamente generalizada quando:

1. existe um único conjunto de scripts compartilhados;
2. todos os comandos selecionam a obra por `work_id`;
3. nenhuma regra do motor contém `if work == "hpmor"` para comportamento genérico;
4. HPMOR e uma segunda fixture de obra podem validar usando o mesmo código;
5. cada obra possui corpus, vozes, cache, manifests e publicação isolados;
6. cada obra recebe página e feed RSS próprios;
7. o GitHub Actions despacha qualquer obra sem workflow específico;
8. Internet Archive, quando usado, recebe item estável por obra;
9. adicionar uma nova obra normal não exige alterar worker, runners ou publisher;
10. o site descobre obras a partir dos manifests em vez de uma lista duplicada em código.

## 15. Casos de referência

### HPMOR

Primeira implementação end-to-end. Estressa:

- tradução inglês -> pt-BR;
- diálogo;
- múltiplos personagens;
- vozes consistentes;
- interpretação dramática;
- corpus longo.

### Bhagavad Gita

Segundo caso de referência arquitetural. Estressa:

- idioma-fonte diferente de inglês, conforme a edição escolhida;
- estrutura editorial que não deve ser forçada ao modelo de romance;
- possibilidade de direção vocal/narração distinta;
- proveniência e escolha de edição-fonte;
- reutilização completa da mesma infraestrutura sem código específico.

Nenhum conteúdo do Bhagavad Gita precisa entrar na Fase 1 do HPMOR. Sua função agora é servir como **teste de generalidade do design**.
