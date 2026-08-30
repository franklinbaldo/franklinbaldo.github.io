---
type: Product Requirements Document
title: Audiolivro HPMOR em português — pipeline OKF, TTS e compute CLI-first
description: PRD para uma pipeline reproduzível de original, tradução, adaptação de narração, benchmark de TTS e geração incremental de audiolivro com runners remotos acionados por linha de comando.
tags: [audiobook, hpmor, okf, translation, tts, github-actions, kaggle, colab, cli, podcast]
timestamp: 2026-08-30T16:37:00Z
---

# Audiolivro HPMOR em português

## 1. Resumo

Este projeto cria uma pipeline reproduzível para produzir uma edição em áudio, em português do Brasil, de _Harry Potter and the Methods of Rationality_ (HPMOR), de Eliezer Yudkowsky.

O princípio central é separar rigorosamente três representações textuais do mesmo capítulo:

1. **original** — o texto-fonte em inglês, preservado como referência;
2. **tradução** — uma tradução fiel para português brasileiro, adequada para leitura humana e comparação com o original;
3. **narração** — uma adaptação da tradução destinada especificamente à síntese de voz, podendo ajustar pontuação, pronúncia, pausas, expansão de símbolos, divisão de falas e instruções de interpretação necessárias para que o TTS produza o resultado esperado.

As três camadas são Markdown em formato OKF e compartilham a mesma identidade de obra e capítulo. O áudio é derivado da camada de narração; nunca é a fonte canônica do texto.

A computação de GPU deve ser **CLI-first**. O projeto não usa notebooks como interface operacional nem como fonte executável canônica. Toda lógica de produção vive em scripts versionados; Kaggle, Colab e futuros provedores são apenas runners remotos desses scripts.

GitHub Actions é o ponto único de operação da pipeline: valida, planeja, despacha compute remoto usando credenciais em GitHub Secrets, recupera outputs, monta o capítulo e publica os artefatos. O contrato detalhado está em [`github-actions-execution.md`](./github-actions-execution.md).

Capítulos publicados também devem ser distribuídos como episódios de um podcast RSS hospedado pelo blog. O usuário assina o feed uma vez e recebe os capítulos seguintes automaticamente no tocador de podcast. O contrato de publicação está em [`podcast-publication.md`](./podcast-publication.md).

## 2. Problema

Um fluxo ingênuo de `texto -> TTS -> arquivo de áudio` perde informação e mistura responsabilidades:

- uma tradução boa para leitura silenciosa nem sempre soa natural quando narrada;
- correções de pronúncia ou ritmo acabam contaminando a tradução canônica;
- não existe uma ligação determinística entre original, tradução e trecho de áudio;
- regenerar um capítulo inteiro por causa de uma fala é caro e lento;
- trocar de modelo ou provedor de TTS exige refazer a arquitetura;
- notebooks manuais tornam a execução difícil de automatizar, revisar e reproduzir;
- artefatos derivados podem se tornar impossíveis de reproduzir depois;
- publicar áudio sem feed estável obriga o ouvinte a acompanhar manualmente o site em vez de usar um tocador de podcast.

O projeto deve transformar o audiolivro em um sistema de conteúdo versionado, auditável, regenerável e assinável.

## 3. Objetivo do produto

Entregar uma pipeline capaz de executar, para cada capítulo:

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
planner
    |
    v
worker TTS (.py)
    |
    +--> local
    +--> Colab CLI
    +--> Kaggle CLI
    +--> API TTS
    |
    v
segmentos de áudio
    |
    v
áudio do capítulo
    |
    +--> página/player no blog
    +--> episódio no feed RSS
    +--> artefatos de distribuição futuros
```

O HPMOR é o primeiro corpus e o caso de uso de referência. A arquitetura não deve depender semanticamente de HPMOR e deve poder ser reutilizada para outras obras.

## 4. Princípios

### 4.1. Texto antes de áudio

Original, tradução e narração são fontes versionadas. MP3, M4A, M4B, waveform, timestamps e demais arquivos de áudio são artefatos derivados.

### 4.2. Tradução não é narração

A tradução deve permanecer linguisticamente fiel e legível. Ajustes feitos apenas para satisfazer o comportamento de um sintetizador pertencem à camada de narração.

### 4.3. Identidade compartilhada

Toda representação equivalente do mesmo capítulo deve carregar o mesmo `work_id` e `chapter_id`.

```yaml
work_id: hpmor
chapter_id: hpmor-001
chapter_number: 1
```

A tradução e a narração apontam explicitamente para a camada da qual derivam.

### 4.4. Unidades menores que o capítulo

A geração de áudio opera sobre segmentos estáveis menores que um capítulo. Um segmento pode ser uma fala, um parágrafo narrativo ou outra unidade suficientemente pequena para regeneração isolada.

Cada segmento possui `segment_id` estável. O mesmo ID é preservado enquanto a unidade correspondente continua semanticamente sendo a mesma.

### 4.5. TTS é implementação, não contrato

A camada canônica de narração não depende de Breeze, Higgs, Chatterbox, Qwen, Fish, OpenAI, Google ou qualquer outro fornecedor específico.

Um adapter transforma a representação canônica de narração no formato esperado pelo backend selecionado.

### 4.6. Idioma declarado pelo modelo não é gate

A ausência de `pt-BR` ou `Portuguese` no model card não elimina um modelo do benchmark.

Modelos generativos podem produzir português adequadamente mesmo quando o idioma não é oficialmente suportado ou avaliado. O critério do projeto é empírico: o modelo permanece candidato enquanto produzir resultado aceitável no corpus de benchmark em português brasileiro.

Nenhum fine-tune deve ser presumido antes de testar zero-shot.

### 4.7. Reprodutibilidade por hash

Um segmento de áudio é identificado por uma chave derivada, no mínimo, de:

- texto de narração;
- identidade/configuração da voz;
- backend e modelo TTS;
- parâmetros relevantes;
- seed, quando aplicável;
- versão do adapter;
- versão do schema de narração.

Se a chave não mudar e o artefato existir, a pipeline reutiliza o áudio.

### 4.8. Git guarda estado; áudio pesado não precisa morar no Git

O repositório guarda corpus, manifestos, configuração, proveniência e hashes. Arquivos pesados podem ser mantidos como artifacts ou em um destino de publicação definido posteriormente.

### 4.9. CLI-first; notebooks não são fonte executável

A fonte operacional do projeto é composta por scripts versionados (`.py`, `.sh` e, quando útil, ferramentas Node já existentes no repo).

Regras:

- nenhuma etapa exige abrir uma UI de notebook;
- `.ipynb` não é formato canônico de código do projeto;
- um runner pode internamente usar infraestrutura Jupyter, mas isso é detalhe do provedor;
- o mesmo worker Python deve ser executável localmente, no Colab e no Kaggle com o mínimo possível de diferenças;
- toda execução remota deve poder ser iniciada, observada e ter seus resultados recuperados por linha de comando;
- comandos usados manualmente devem ser automatizáveis posteriormente por GitHub Actions.

### 4.10. GitHub Actions é o plano de controle

A operação suportada do produto parte do GitHub Actions. Kaggle, Colab e APIs TTS são recursos remotos acionados pela pipeline, não interfaces que o operador precise visitar manualmente.

Secrets permanecem no GitHub e são expostos somente ao step/runtime que deles precisar. Um runner remoto é considerado suportado apenas depois de autenticação headless e execução end-to-end comprovadas.

### 4.11. Podcast é saída de primeira classe

O capítulo não termina tecnicamente em um arquivo de áudio. Quando marcado como publicável, ele deve poder virar um episódio de um feed RSS estável mantido pelo blog.

O `chapter_id` determina um GUID de episódio estável. Regenerar o áudio com outro TTS não deve criar episódio duplicado.

## 5. Modelo de conteúdo

### 5.1. Estrutura-alvo

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

scripts/audiobook/
  worker.py
  plan.py
  validate.py
  assemble.py
  publish.py
  runners/
    colab.sh
    kaggle.sh
```

O corpus fica fora de `src/content/blog/**`: ele não é um post do Hrönir e não deve entrar acidentalmente em ranking, versionamento ou seleção de posts.

### 5.2. Original

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

- preservar a proveniência;
- registrar digest do conteúdo importado;
- não conter adaptação para português ou TTS;
- manter IDs de segmentos estáveis após a primeira segmentação.

### 5.3. Tradução

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

- mesmo `chapter_id` do original;
- alinhamento por `segment_id`;
- tradução adequada para leitura humana;
- nenhum truque específico de sintetizador;
- comparação automática original <-> tradução por capítulo e segmento.

### 5.4. Narração

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

O contrato da camada:

- Markdown continua legível sem renderer especial;
- cada trecho enviado ao TTS possui identidade estável;
- `speaker`, emoção, ritmo, pausa e demais instruções são provider-neutral;
- tags proprietárias de um modelo não entram no corpus canônico;
- a adaptação pode divergir superficialmente da tradução para melhorar a realização oral sem mudar o sentido.

Casos típicos:

- escrever uma sigla por extenso;
- ajustar pontuação para obter pausas;
- marcar narrador/personagem;
- definir pronúncia de nomes;
- dividir frases longas;
- controlar ritmo, ênfase e emoção;
- eliminar artefatos tipográficos não verbalizados.

## 6. Vozes

`voices.yaml` define identidades lógicas, não IDs rígidos de um fornecedor.

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

Cada backend mantém separadamente o mapeamento da identidade lógica para referência, prompt, voice clone ou configuração concreta.

Isso permite trocar modelo sem reescrever o corpus e comparar backends mantendo a mesma intenção de voz.

## 7. Benchmark de TTS

### 7.1. Escolha empírica

Nenhum modelo é escolhido definitivamente por leaderboard ou model card.

O projeto mantém um corpus pequeno de benchmark pt-BR com segmentos que cubram:

- narração neutra;
- diálogo coloquial;
- perguntas/exclamações;
- ironia;
- medo, raiva e outras emoções;
- fala baixa/sussurro quando suportado;
- frases longas;
- números, siglas e abreviações;
- fonemas e encontros relevantes do português brasileiro;
- nomes ingleses dentro de frase portuguesa;
- alternância pt-BR/inglês;
- passagens mais longas para testar estabilidade.

### 7.2. Candidatos iniciais

A primeira rodada deve permitir pelo menos:

- Breeze TTS 2;
- Higgs TTS 3;
- Chatterbox V3 / pt-BR;
- Qwen3-TTS;
- Fish S2.x, enquanto acessível.

A lista é expansível sem alterar o contrato do corpus.

### 7.3. Métricas

Registrar, quando aplicável:

- preferência cega humana;
- naturalidade em pt-BR;
- inteligibilidade/pronúncia;
- expressividade e aderência à direção narrativa;
- estabilidade da identidade da voz;
- repetições, omissões e alucinações;
- duração produzida;
- real-time factor;
- VRAM observada;
- falhas de execução;
- custo monetário;
- quantidade de intervenção manual necessária.

A escolha para produção deve privilegiar qualidade de audiobook e estabilidade, não apenas WER.

## 8. Worker TTS único

A unidade executável de geração deve ser um script Python, inicialmente `scripts/audiobook/worker.py`.

Contrato conceitual:

```text
python scripts/audiobook/worker.py \
  --work hpmor \
  --chapter 1 \
  --backend breeze \
  --model <modelo> \
  --input-plan <plan.json> \
  --output-dir <dir>
```

O worker:

1. lê um plano de segmentos já validado;
2. instala/carrega apenas o backend selecionado;
3. gera cada segmento de forma independente;
4. escreve áudio + metadata de execução;
5. não altera original, tradução ou narração;
6. pode retomar execução parcial;
7. encerra com código diferente de zero em falhas não recuperáveis.

O script deve ser capaz de detectar a GPU disponível e registrar hardware, versões e parâmetros no manifesto da execução.

Dependências Python devem ser declaradas de forma autocontida sempre que viável, preferencialmente com PEP 723/`uv run`, evitando manter ambientes manuais diferentes por runner.

## 9. Runners de compute

### 9.1. Princípio

Colab e Kaggle não recebem implementações distintas do TTS. Eles recebem o mesmo worker.

O adapter de runner resolve apenas:

- provisionamento/acelerador;
- envio do script e inputs;
- autenticação;
- acompanhamento do job;
- recuperação dos outputs;
- teardown quando aplicável.

### 9.2. Colab CLI

O caminho preferido é o CLI oficial do Google Colab, executando diretamente o arquivo Python local.

Forma conceitual:

```bash
colab run --gpu T4 scripts/audiobook/worker.py -- \
  --work hpmor \
  --chapter 1 \
  --backend breeze \
  --input-plan plan.json \
  --output-dir output
```

Quando for útil reutilizar uma VM durante vários testes, o runner pode usar `colab new`, `colab install`, `colab exec`, `colab download` e `colab stop` em vez do job efêmero.

O projeto não presume que um tipo específico de GPU estará sempre disponível. Falha de quota ou alocação deve ser tratada como indisponibilidade do runner, não como falha do modelo TTS.

### 9.3. Kaggle CLI

Kaggle deve ser usado como **script kernel**, não notebook.

O staging do job contém:

```text
.kaggle-job/
  worker.py
  plan.json
  kernel-metadata.json
```

`kernel-metadata.json` usa:

```json
{
  "code_file": "worker.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": true,
  "enable_gpu": true
}
```

Fluxo conceitual:

```bash
kaggle kernels push -p .kaggle-job --accelerator NvidiaTeslaT4
kaggle kernels status <user>/<job>
kaggle kernels output <user>/<job> -p output
```

O wrapper deve gerar o staging automaticamente; nenhum `.ipynb` precisa existir no repositório.

### 9.4. Local

O mesmo worker deve continuar executável localmente para CPU/GPU disponível, testes e depuração.

O runner local também é a implementação de referência para o contrato de entrada/saída.

## 10. Pipeline

A pipeline expõe estágios independentes:

1. `import` — obtém/normaliza o original e calcula proveniência/digest;
2. `translate` — cria ou atualiza a tradução;
3. `prepare-narration` — cria ou atualiza a camada de narração;
4. `validate` — verifica IDs, alinhamento, links e schema;
5. `plan` — calcula segmentos, cache keys e trabalho pendente;
6. `benchmark` — opcionalmente gera as mesmas amostras em múltiplos backends;
7. `synthesize` — despacha o worker para runner local/Colab/Kaggle/API;
8. `assemble` — concatena segmentos em capítulo;
9. `publish` — envia a mídia, atualiza o episódio/feed e publica os artefatos.

Cada estágio pode ser executado sem obrigatoriamente executar os posteriores.

### 10.1. Dry-run obrigatório

Antes de síntese, `plan` deve mostrar:

- capítulos selecionados;
- segmentos a gerar;
- backend/modelo/voz;
- runner escolhido;
- segmentos reutilizados;
- segmentos invalidados;
- estimativa de caracteres/duração/custo quando disponível.

Nenhum `push` comum dispara automaticamente despesa de API.

## 11. GitHub Actions

GitHub Actions é **orquestrador e ponto único de operação**, não requisito de GPU.

O workflow de produção deve poder:

1. validar o corpus;
2. gerar o plano;
3. escolher runner;
4. invocar `colab` ou `kaggle` CLI, ou usar um backend HTTP;
5. acompanhar a execução;
6. recuperar outputs;
7. validar manifestos;
8. montar o capítulo;
9. publicar mídia/feed quando autorizado.

O primeiro workflow usa `workflow_dispatch` e aceita, no mínimo:

- obra;
- capítulo ou intervalo;
- backend/modelo;
- runner (`local`, `colab`, `kaggle`, `api` quando houver);
- `dry_run`;
- `force` para ignorar cache;
- `publish`.

Credenciais externas entram somente por GitHub Secrets e nunca no corpus, logs ou artefatos públicos.

Detalhes de autenticação headless, staging, retomada e segurança ficam no contrato [`github-actions-execution.md`](./github-actions-execution.md).

## 12. Manifesto derivado

A pipeline produz manifesto suficiente para reproduzir e auditar o resultado.

```json
{
  "work_id": "hpmor",
  "chapter_id": "hpmor-001",
  "narration_digest": "sha256:...",
  "runner": "kaggle",
  "hardware": "NvidiaTeslaT4",
  "backend": "breeze",
  "model": "...",
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

O manifesto é derivado e não substitui os três bundles textuais.

Depois de publicação, pode registrar também `episode_guid`, `enclosure_url`, digest do arquivo distribuído e timestamp de publicação.

## 13. Validação

Validações mínimas:

- todos os documentos possuem `type` OKF;
- todo capítulo possui `work_id`, `chapter_id`, `chapter_number` e `lang`;
- original, tradução e narração concordam em identidade;
- `derived_from` resolve;
- `segment_id` não se repete dentro da obra;
- ordem dos segmentos é determinística;
- descendentes não referenciam silenciosamente segmentos inexistentes;
- manifestos nunca são tratados como fonte canônica;
- nenhum segredo aparece versionado;
- runner não modifica corpus canônico;
- outputs declarados pelo worker correspondem ao plano recebido;
- episódio publicado tem GUID estável;
- enclosure está publicamente acessível antes de entrar no feed.

## 14. Site e podcast

O próprio `franklinbaldo.github.io` deve ser o frontend e a identidade RSS do audiolivro.

A experiência inclui:

- página da obra;
- índice de capítulos;
- página/player por capítulo;
- indicação do trecho corrente quando disponível;
- texto traduzido sincronizado;
- comparação original/tradução quando desejada;
- feed RSS de podcast;
- ação clara para copiar/adicionar o feed ao tocador;
- M4B e outros formatos futuramente.

O feed fica no blog; a mídia pesada pode usar storage separado. Essa separação evita acoplar o podcast aos limites de armazenamento do GitHub Pages.

O contrato completo de RSS, enclosure, GUID, transcript e Podcasting 2.0 está em [`podcast-publication.md`](./podcast-publication.md).

## 15. Escopo autoral e publicação

O projeto nasce como experimento pessoal, aberto e não comercial. Questões de autorização, política de distribuição ou eventual mudança de alcance não são gate para o kickstart técnico.

Se o projeto adquirir distribuição material, monetização ou relevância que altere seu perfil de risco, a publicação deve receber revisão própria antes de ser ampliada.

## 16. Não-objetivos iniciais

Não fazem parte do kickstart:

- gerar todos os capítulos imediatamente;
- escolher um vencedor TTS sem benchmark próprio;
- adaptar/fine-tunar modelo antes de testar zero-shot;
- criar vozes clonadas de atores ou pessoas reais;
- dramatização com efeitos/trilha;
- armazenar grandes binários no Git;
- automatizar gasto em todo `push`;
- contaminar tradução com comandos de sintetizador;
- manter notebooks operacionais ou uma pipeline paralela em `.ipynb`;
- depender de um diretório comercial de podcasts para que a assinatura funcione.

## 17. Fases

### Fase 0 — contrato

Esta PR.

Critério de aceite: o documento fixa arquitetura de corpus, benchmark, worker, compute CLI-first, controle via GitHub Actions e publicação como podcast.

### Fase 1 — corpus mínimo e validação

Entregáveis:

- `data/audiobooks/hpmor/{original,translation,narration}`;
- capítulo 1 nas três camadas;
- `voices.yaml` mínimo;
- validador de IDs, derivação e segmentos;
- fixtures/testes;
- nenhuma chamada paga.

Critério de aceite: um agente percorre deterministicamente `original -> translation -> narration` do capítulo 1 e mapeia os segmentos correspondentes.

### Fase 2 — planner, worker e runners

Entregáveis:

- parser da narração;
- representação interna de requests TTS;
- interface de backend;
- cache key;
- `plan`/dry-run;
- backend fake;
- `scripts/audiobook/worker.py`;
- runner local;
- wrappers CLI para Colab e Kaggle;
- Kaggle configurado como `kernel_type: script`;
- workflow GitHub Actions capaz de despachar runner fake/headless;
- nenhum notebook requerido.

Critério de aceite: o mesmo worker executa um job fake localmente e pode ser despachado por Actions pelos CLIs remotos sem divergência de contrato.

### Fase 3 — benchmark real

Entregáveis:

- adapters dos candidatos selecionados;
- corpus benchmark pt-BR;
- execução comparável em pelo menos um runner gratuito disponível;
- amostras e manifestos comparáveis;
- relatório de qualidade/estabilidade/desempenho.

Critério de aceite: existe evidência própria suficiente para escolher ou ordenar os modelos para o capítulo 1.

### Fase 4 — primeiro capítulo em áudio e feed

Entregáveis:

- backend/modelo selecionado;
- geração incremental;
- montagem do capítulo;
- manifesto completo;
- storage de mídia compatível com podcast;
- feed RSS inicial;
- episódio do capítulo 1;
- artifact com áudio resultante.

Critério de aceite: capítulo 1 reproduzível a partir do commit/configuração e assinável em um player de podcast usando o feed do blog.

### Fase 5 — experiência no blog

Entregáveis:

- loader dedicado;
- página da obra;
- página/player de capítulo;
- metadados de navegação;
- ação de assinatura/copiar feed;
- transcript/timestamps derivados quando disponíveis.

### Fase 6 — escala

Somente após o capítulo 1 estar satisfatório:

- capítulos seguintes;
- consistência de personagens/pronúncia;
- geração batch incremental;
- armazenamento/publicação durável;
- formatos adicionais;
- submissão opcional a diretórios de podcasts.

## 18. Métricas de sucesso

O projeto é bem-sucedido quando:

- qualquer tradução é rastreável ao original;
- qualquer narração é rastreável à tradução;
- qualquer áudio é rastreável ao texto/configuração/modelo/runner;
- corrigir uma fala não força regenerar o capítulo inteiro;
- trocar backend não exige reescrever o corpus;
- o mesmo worker roda localmente e em compute remoto;
- nenhum notebook manual é necessário;
- GitHub Actions consegue executar a pipeline sem interação com UI externa;
- o capítulo 1 pode ser reproduzido por comandos documentados;
- o feed pode ser adicionado a um tocador de podcast;
- novos capítulos publicados aparecem como novos episódios sem reassinar;
- o corpus continua compreensível como Markdown sem ferramenta de TTS.

## 19. Decisões já tomadas

1. haverá três camadas: original, tradução e narração;
2. todas serão Markdown compatível com OKF;
3. as camadas correspondentes compartilham `chapter_id` e IDs menores;
4. narração adapta a forma para TTS sem substituir a tradução;
5. TTS é pluggable e provider-neutral;
6. idioma não listado no model card não elimina candidato;
7. zero-shot é testado antes de qualquer adaptação;
8. escolha de modelo passa por benchmark pt-BR próprio;
9. código de produção é CLI-first e script-first;
10. `.ipynb` não é fonte operacional do projeto;
11. Colab e Kaggle são runners do mesmo worker;
12. Kaggle usa `kernel_type: script`;
13. GitHub Actions é o plano de controle e ponto único de operação;
14. credenciais remotas ficam em GitHub Secrets;
15. chamadas pagas começam manuais/dry-run;
16. binários de áudio são derivados;
17. capítulos publicáveis viram episódios com GUID estável;
18. o feed RSS canônico é hospedado pelo blog;
19. mídia pesada pode usar storage separado do GitHub Pages;
20. HPMOR é o corpus inicial, não uma dependência arquitetural.

## 20. Primeira próxima ação

A próxima PR após este PRD deve implementar a **Fase 1**. Em paralelo, a implementação da Fase 2 já deve preservar o contrato de que o worker será um script Python comum executável por GitHub Actions e despachável por CLI, sem notebook como camada intermediária.
