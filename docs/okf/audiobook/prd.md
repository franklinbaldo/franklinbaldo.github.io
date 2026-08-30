---
type: Product Requirements Document
title: Audiolivro HPMOR em português — pipeline OKF e TTS
description: PRD para uma pipeline reproduzível de original, tradução, adaptação de narração e geração incremental de audiolivro.
tags: [audiobook, hpmor, okf, translation, tts, github-actions]
timestamp: 2026-08-30T16:37:00Z
---

# Audiolivro HPMOR em português

## 1. Resumo

Este projeto cria uma pipeline reproduzível para produzir uma edição em áudio, em português do Brasil, de _Harry Potter and the Methods of Rationality_ (HPMOR), de Eliezer Yudkowsky.

O princípio central é separar rigorosamente três representações textuais do mesmo capítulo:

1. **original** — o texto-fonte em inglês, preservado como referência;
2. **tradução** — uma tradução fiel para português brasileiro, adequada para leitura humana e comparação com o original;
3. **narração** — uma adaptação da tradução destinada especificamente à síntese de voz, podendo ajustar pontuação, pronúncia, pausas, expansão de símbolos, divisão de falas e outras instruções necessárias para que o TTS produza o resultado esperado.

As três camadas são Markdown em formato OKF e compartilham a mesma identidade de obra e de capítulo. O áudio é derivado da camada de narração; nunca é a fonte canônica do texto.

A computação pesada deve ser executável por GitHub Actions. A pipeline deve ser incremental: uma alteração pequena em texto, voz ou configuração não deve obrigar a regenerar o livro inteiro.

## 2. Problema

Um fluxo ingênuo de `texto -> TTS -> arquivo de áudio` perde informação e mistura responsabilidades:

- uma tradução boa para leitura silenciosa nem sempre soa natural quando narrada;
- correções de pronúncia ou ritmo acabam contaminando a tradução canônica;
- não existe uma ligação determinística entre original, tradução e trecho de áudio;
- regenerar um capítulo inteiro por causa de uma fala é caro e lento;
- trocar de provedor de TTS exige refazer a arquitetura;
- artefatos derivados podem se tornar impossíveis de reproduzir depois.

O projeto deve transformar o audiolivro em um sistema de conteúdo versionado, auditável e regenerável.

## 3. Objetivo do produto

Entregar uma pipeline capaz de, para cada capítulo:

```text
original OKF
    |
    v
tradução OKF
    |
    v
narração OKF
    |
    v
segmentos TTS
    |
    v
áudio do capítulo
    |
    +--> publicação web / player
    +--> artefatos de distribuição futuros
```

O HPMOR é o primeiro corpus e o caso de uso de referência. A arquitetura, porém, não deve depender semanticamente de HPMOR e deve poder ser reutilizada para outras obras no futuro.

## 4. Princípios

### 4.1. Texto antes de áudio

Original, tradução e narração são fontes versionadas. MP3, M4A, M4B, waveform, timestamps e demais arquivos de áudio são artefatos derivados.

### 4.2. Tradução não é narração

A tradução deve permanecer linguisticamente fiel e legível. Ajustes feitos apenas para satisfazer o comportamento de um sintetizador pertencem à camada de narração.

### 4.3. Identidade compartilhada

Toda representação equivalente do mesmo capítulo deve carregar o mesmo `work_id` e `chapter_id`.

Exemplo:

```yaml
work_id: hpmor
chapter_id: hpmor-001
chapter_number: 1
```

A tradução e a narração devem apontar explicitamente para a camada da qual derivam.

### 4.4. Unidades menores que o capítulo

A geração de áudio deve operar sobre segmentos estáveis menores que um capítulo. Um segmento pode ser uma fala, um parágrafo narrativo ou outra unidade suficientemente pequena para regeneração isolada.

Cada segmento deve possuir um `segment_id` estável dentro do capítulo. O mesmo ID deve ser preservado sempre que a unidade correspondente continua semanticamente sendo a mesma.

### 4.5. Provedor de TTS é implementação, não contrato

A camada canônica de narração não deve depender de OpenAI, ElevenLabs, Google, modelo local ou qualquer outro fornecedor específico.

Um adaptador transforma o formato canônico de narração no request particular de cada backend.

### 4.6. Reprodutibilidade por hash

Um segmento de áudio é identificado por uma chave derivada, no mínimo, de:

- texto de narração do segmento;
- identidade/configuração da voz;
- backend e modelo de TTS;
- parâmetros relevantes do backend;
- versão do schema/adaptador de narração.

Se essa chave não mudar e o artefato existir, a pipeline deve reutilizá-lo.

### 4.7. Git guarda estado; áudio pesado não precisa morar no Git

O repositório deve guardar corpus, manifestos, configuração, proveniência e hashes. Arquivos de áudio pesados podem ser produzidos por Actions e armazenados como artifacts ou em um destino de publicação definido posteriormente.

Não é requisito inicial versionar binários de áudio no histórico Git.

## 5. Modelo de conteúdo

### 5.1. Estrutura-alvo

A estrutura inicial proposta é:

```text
data/audiobooks/
  hpmor/
    original/
      001.md
      002.md
      ...
    translation/
      001.md
      002.md
      ...
    narration/
      001.md
      002.md
      ...
    voices.yaml
    manifest.json
```

O corpus fica fora de `src/content/blog/**`: ele não é um post do Hrönir e não deve entrar acidentalmente em ranking, versionamento ou seleção de posts. O site poderá consumi-lo posteriormente por um loader dedicado, seguindo o princípio já usado em outras fontes derivadas do blog.

### 5.2. Original

Exemplo mínimo:

```markdown
---
type: Audiobook Source Chapter
title: Chapter 1
work_id: hpmor
chapter_id: hpmor-001
chapter_number: 1
lang: en
source_url: https://hpmor.com/chapter/1
source_digest: sha256:...
---

<!-- segment: hpmor-001-s0001 -->

Texto original...
```

Requisitos:

- preservar a proveniência do texto;
- registrar digest do conteúdo importado;
- não incluir adaptações feitas para português ou TTS;
- manter IDs de segmentos estáveis após a primeira segmentação, salvo quando a própria segmentação precisar mudar.

### 5.3. Tradução

Exemplo mínimo:

```markdown
---
type: Audiobook Translation Chapter
title: Capítulo 1
work_id: hpmor
chapter_id: hpmor-001
chapter_number: 1
lang: pt-BR
derived_from: ../original/001.md
---

<!-- segment: hpmor-001-s0001 -->

Texto traduzido...
```

Requisitos:

- usar o mesmo `chapter_id` do original;
- conservar o alinhamento por `segment_id` sempre que possível;
- ser adequada como tradução para leitura humana;
- não conter truques específicos de TTS apenas para alterar a pronúncia do sintetizador;
- permitir comparação automática original <-> tradução por capítulo e segmento.

### 5.4. Narração

Exemplo mínimo:

```markdown
---
type: Audiobook Narration Chapter
title: Capítulo 1 — narração
work_id: hpmor
chapter_id: hpmor-001
chapter_number: 1
lang: pt-BR
derived_from: ../translation/001.md
narration_schema: 1
---

<!-- tts: {"id":"hpmor-001-s0001","speaker":"narrator"} -->

Texto preparado especificamente para ser narrado...
```

A sintaxe exata das diretivas poderá evoluir na primeira implementação, mas o contrato é fixo:

- Markdown continua legível sem um renderer especial;
- cada trecho enviado ao TTS possui identidade estável;
- `speaker` e demais instruções são provider-neutral;
- instruções específicas de um fornecedor não entram no corpus canônico;
- a adaptação pode divergir superficialmente da tradução quando isso melhora a realização oral sem mudar o sentido pretendido.

Casos típicos da camada de narração:

- escrever por extenso uma sigla ou expressão que o TTS pronuncia incorretamente;
- introduzir ou retirar pontuação para obter a pausa correta;
- marcar alternância entre narrador e personagens;
- estabelecer pronúncia canônica de nomes;
- dividir uma frase longa em dois requests;
- controlar pausas e ênfases;
- eliminar artefatos tipográficos que não devem ser verbalizados.

## 6. Vozes

`voices.yaml` define identidades lógicas de voz, não IDs rígidos de um único fornecedor.

Exemplo conceitual:

```yaml
narrator:
  role: narrator
  locale: pt-BR

harry:
  role: character
  locale: pt-BR

mcgonagall:
  role: character
  locale: pt-BR
```

Cada backend mantém separadamente o mapeamento de identidade lógica para voz/modelo concreto.

Isso permite:

- trocar o fornecedor sem reescrever o corpus;
- comparar vozes de diferentes backends;
- manter a identidade de um personagem ao longo de todos os capítulos;
- alterar uma voz e invalidar somente os segmentos afetados.

## 7. Pipeline

### 7.1. Estágios

A pipeline deve expor estágios independentes:

1. `import` — obtém/normaliza o original e calcula proveniência/digest;
2. `translate` — cria ou atualiza a camada de tradução;
3. `prepare-narration` — cria ou atualiza a camada orientada ao TTS;
4. `validate` — verifica IDs, alinhamento, links de derivação e schema;
5. `plan` — calcula quais segmentos precisam ser sintetizados e quanto trabalho será executado;
6. `synthesize` — gera apenas segmentos ausentes ou invalidados;
7. `assemble` — concatena segmentos em capítulo, preservando ordem e metadados;
8. `publish` — disponibiliza artefatos no destino configurado.

Cada estágio deve poder ser executado sem obrigatoriamente executar os posteriores.

### 7.2. Dry-run obrigatório

Qualquer workflow capaz de chamar um serviço pago deve possuir modo `dry-run` que mostre:

- capítulo(s) selecionado(s);
- número de segmentos a gerar;
- backend/modelo/voz resolvidos;
- segmentos reutilizados do cache;
- segmentos invalidados;
- estimativa de caracteres ou outra unidade de cobrança disponível.

Nenhum evento de `push` comum deve, na primeira versão, disparar automaticamente uma despesa de TTS.

### 7.3. GitHub Actions

O primeiro workflow de produção deve usar `workflow_dispatch` e aceitar, no mínimo:

- obra;
- capítulo ou intervalo de capítulos;
- backend;
- `dry_run`;
- `force` para ignorar cache, quando necessário.

Credenciais de serviços externos entram somente por GitHub Actions secrets e nunca são escritas no corpus, logs ou artefatos.

## 8. Manifesto derivado

A pipeline deve produzir um manifesto por build, contendo informação suficiente para reproduzir e auditar o resultado.

Exemplo conceitual:

```json
{
  "work_id": "hpmor",
  "chapter_id": "hpmor-001",
  "narration_digest": "sha256:...",
  "backend": "example",
  "model": "example-model",
  "segments": [
    {
      "segment_id": "hpmor-001-s0001",
      "speaker": "narrator",
      "input_digest": "sha256:...",
      "audio_digest": "sha256:...",
      "duration_ms": 12345
    }
  ]
}
```

O manifesto é derivado e pode ser regenerado. Ele não substitui os três bundles textuais.

## 9. Validação

O projeto deve falhar cedo quando houver inconsistência estrutural.

Validações mínimas:

- todos os arquivos possuem `type` OKF;
- todo capítulo possui `work_id`, `chapter_id`, `chapter_number` e `lang` válidos;
- original, tradução e narração de um capítulo concordam em `work_id` e `chapter_id`;
- `derived_from` resolve para arquivo existente;
- `segment_id` não se repete dentro de uma obra;
- a ordem dos segmentos é determinística;
- um segmento de tradução/narração não referencia silenciosamente um segmento inexistente no ancestral;
- manifestos nunca são tratados como fonte canônica;
- nenhum segredo aparece em arquivos versionados.

A implementação deve preferir validação por ferramenta existente do ecossistema OKF quando ela já cobre o requisito, complementando somente o que é específico do domínio de audiolivro.

## 10. Site

A primeira entrega não exige uma experiência pública completa, mas a arquitetura deve permitir que o próprio `franklinbaldo.github.io` se torne o frontend do audiolivro.

Uma fase posterior pode oferecer:

- página da obra;
- índice de capítulos;
- player por capítulo;
- indicação do trecho corrente;
- texto traduzido sincronizado;
- comparação opcional original/tradução;
- feed RSS/podcast;
- M4B ou outros formatos de distribuição.

A interface web consome artefatos da pipeline; não redefine o corpus canônico.

## 11. Escopo autoral e de publicação

O projeto nasce como experimento pessoal, aberto e não comercial. Questões de autorização, política de distribuição ou eventual mudança de alcance não são gate para o kickstart técnico.

Se o projeto adquirir distribuição material, monetização ou outra relevância que altere seu perfil de risco, essa etapa deve receber revisão própria antes de ampliar a publicação. Essa revisão é uma decisão de distribuição, não um requisito para modelar o corpus e construir a pipeline.

## 12. Não-objetivos iniciais

Não fazem parte do kickstart:

- gerar imediatamente todos os capítulos;
- escolher definitivamente um fornecedor de TTS;
- criar vozes clonadas de atores ou pessoas reais;
- produzir uma dramatização com efeitos sonoros e trilha;
- otimizar o site antes de existir um capítulo end-to-end;
- armazenar grandes binários de áudio no histórico Git;
- automatizar gasto de API em todo `push`;
- transformar a camada de tradução em texto cheio de instruções de sintetizador.

## 13. Fases

### Fase 0 — contrato

Esta PR.

Entregáveis:

- PRD OKF;
- decisão explícita das três camadas;
- identidade compartilhada entre as camadas;
- contrato de pipeline incremental e provider-neutral.

Critério de aceite: o documento é suficiente para implementar a Fase 1 sem precisar decidir novamente a arquitetura fundamental.

### Fase 1 — corpus mínimo e validação

Entregáveis:

- criar `data/audiobooks/hpmor/{original,translation,narration}`;
- adicionar o capítulo 1 nas três camadas;
- definir `voices.yaml` mínimo;
- implementar validador de IDs, `derived_from` e segmentos;
- adicionar testes/fixtures;
- nenhuma chamada de rede paga.

Critério de aceite: um agente consegue percorrer deterministicamente `original -> translation -> narration` do capítulo 1 e mapear cada segmento correspondente.

### Fase 2 — planner e backend abstrato

Entregáveis:

- parser da camada de narração;
- representação interna de requests TTS;
- interface de backend;
- cálculo de cache key;
- comando `plan`/dry-run;
- backend fake para testes.

Critério de aceite: o sistema informa exatamente quais segmentos seriam gerados sem chamar um serviço externo.

### Fase 3 — primeiro capítulo em áudio

Entregáveis:

- um backend real de TTS;
- workflow manual em GitHub Actions;
- geração incremental dos segmentos;
- montagem do capítulo;
- manifesto com digests e duração;
- artifact de Actions com o áudio resultante.

Critério de aceite: o capítulo 1 é reproduzível a partir do commit do corpus e da configuração declarada.

### Fase 4 — experiência no blog

Entregáveis:

- loader/coleção dedicada;
- página da obra;
- página/player de capítulo;
- metadados suficientes para navegação.

Critério de aceite: o capítulo produzido pela Fase 3 pode ser ouvido no frontend sem duplicar manualmente conteúdo ou metadados.

### Fase 5 — escala

Somente após o capítulo 1 estar satisfatório:

- tradução/adaptação dos capítulos seguintes;
- revisão de consistência de personagens e pronúncia;
- geração batch incremental;
- estratégia de armazenamento/publicação durável;
- formatos de distribuição adicionais.

## 14. Métricas de sucesso

O projeto é bem-sucedido quando:

- qualquer trecho traduzido pode ser rastreado ao original correspondente;
- qualquer trecho narrado pode ser rastreado à tradução correspondente;
- qualquer segmento de áudio pode ser rastreado ao texto/configuração que o gerou;
- corrigir uma única fala não força a regeneração do capítulo inteiro;
- trocar de backend não exige reescrever o corpus de narração;
- o capítulo 1 pode ser regenerado deterministicamente por GitHub Actions;
- o corpus continua compreensível como Markdown sem depender da ferramenta de TTS.

## 15. Decisões já tomadas

Estas decisões são parte do contrato do produto e não devem ser reabertas durante a Fase 1 sem evidência concreta de inviabilidade:

1. haverá três camadas textuais: original, tradução e narração;
2. todas serão Markdown compatível com OKF;
3. original e tradução são separados por capítulo;
4. as camadas correspondentes compartilham o mesmo `chapter_id`;
5. o alinhamento deve chegar a unidades menores que o capítulo para permitir rastreabilidade e geração incremental;
6. a narração pode adaptar a forma do texto para TTS, mas não substitui a tradução canônica;
7. TTS é pluggable e provider-neutral no contrato canônico;
8. GitHub Actions será um ambiente suportado para a computação de produção;
9. chamadas pagas começam manuais e com dry-run;
10. binários de áudio são derivados e não precisam ser commitados no Git;
11. o HPMOR é o corpus inicial, não uma dependência arquitetural do motor.

## 16. Primeira próxima ação

A próxima PR após este PRD deve implementar exclusivamente a **Fase 1**: estrutura do corpus, capítulo 1 nas três camadas, identidade/alinhamento e validação local, sem integrar ainda um fornecedor real de TTS.
