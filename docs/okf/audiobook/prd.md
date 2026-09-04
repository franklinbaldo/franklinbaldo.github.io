---
type: Product Requirements Document
title: Audiobook Factory — PRD inicial com HPMOR como primeira obra
description: PRD para uma pipeline multi-work reproduzível de original, tradução, adaptação de narração, benchmark de TTS, geração incremental e publicação como podcast.
tags: [audiobook, hpmor, bhagavad-gita, okf, translation, tts, github-actions, kaggle, colab, cli, podcast, multi-work]
timestamp: 2026-08-30T16:37:00Z
---

# Audiobook Factory — PRD inicial

## 1. Resumo

Este projeto cria uma **fábrica genérica de audiolivros** no repositório do blog. Uma mesma pipeline transforma diferentes obras em edições narradas em português do Brasil e as publica como podcasts independentes.

_Harry Potter and the Methods of Rationality_ (HPMOR), de Eliezer Yudkowsky, é a primeira obra end-to-end e o corpus de referência da implementação inicial. _Bhagavad Gita_ é o segundo caso de referência arquitetural e existe desde já para garantir que o desenho não dependa de HPMOR, de inglês como idioma-fonte, de ficção, de diálogo ou de múltiplos personagens.

O contrato multi-work completo está em [`multi-work-architecture.md`](./multi-work-architecture.md). O índice do produto está em [`index.md`](./index.md).

Para cada obra, o princípio central é separar rigorosamente três representações textuais de cada unidade/capítulo:

1. **original** — o texto-fonte escolhido, preservado como referência e com proveniência;
2. **tradução** — uma tradução canônica para português brasileiro, adequada para leitura humana e comparação com o original;
3. **narração** — uma adaptação da tradução destinada especificamente à síntese de voz, podendo ajustar pontuação, pronúncia, pausas, expansão de símbolos, divisão de falas e instruções de interpretação necessárias para que o TTS produza o resultado esperado.

As três camadas são Markdown em formato OKF e compartilham a mesma identidade de obra e unidade. O áudio é derivado da camada de narração; nunca é a fonte canônica do texto.

A computação de GPU deve ser **CLI-first**. O projeto não usa notebooks como interface operacional nem como fonte executável canônica. Toda lógica de produção vive em scripts versionados; Kaggle, Colab e futuros provedores são apenas runners remotos desses scripts.

GitHub Actions é o ponto único de operação da pipeline: valida, planeja, despacha compute remoto usando credenciais em GitHub Secrets, recupera outputs, monta o capítulo e publica os artefatos. O contrato detalhado está em [`github-actions-execution.md`](./github-actions-execution.md).

Cada obra publicada recebe seu **próprio podcast RSS** hospedado pelo blog. O usuário assina uma obra uma vez no tocador de sua preferência e recebe automaticamente os capítulos seguintes daquela obra. O contrato de publicação está em [`podcast-publication.md`](./podcast-publication.md).

## 2. Problema

Um fluxo ingênuo de `texto -> TTS -> arquivo de áudio` perde informação e mistura responsabilidades:

- uma tradução boa para leitura silenciosa nem sempre soa natural quando narrada;
- correções de pronúncia ou ritmo acabam contaminando a tradução canônica;
- não existe uma ligação determinística entre original, tradução e trecho de áudio;
- regenerar um capítulo inteiro por causa de uma fala é caro e lento;
- trocar de modelo ou provedor de TTS exige refazer a arquitetura;
- notebooks manuais tornam a execução difícil de automatizar, revisar e reproduzir;
- artefatos derivados podem se tornar impossíveis de reproduzir depois;
- publicar áudio sem feed estável obriga o ouvinte a acompanhar manualmente o site em vez de usar um tocador de podcast;
- uma implementação centrada em uma única obra tende a duplicar código, workflows e páginas quando novos livros forem adicionados.

O projeto deve transformar livros em um sistema multi-work de conteúdo versionado, auditável, regenerável e assinável.

## 3. Objetivo do produto

Entregar uma pipeline única capaz de executar, para qualquer `work_id`:

```text
work.md
   |
   +--> original OKF
   |       |
   |       v
   +--> tradução OKF
   |       |
   |       v
   +--> narração OKF
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
      áudio da unidade
           |
           +--> storage durável
           +--> página/player da obra
           +--> episódio no feed RSS da obra
```

O código do motor deve ser compartilhado. HPMOR, Bhagavad Gita e futuras obras diferem por corpus/configuração, não por uma pipeline paralela.

## 4. Princípios

### 4.1. Texto antes de áudio

Original, tradução e narração são fontes versionadas. MP3, M4A, M4B, waveform, timestamps e demais arquivos de áudio são artefatos derivados.

### 4.2. Tradução não é narração

A tradução deve permanecer linguisticamente fiel e legível. Ajustes feitos apenas para satisfazer o comportamento de um sintetizador pertencem à camada de narração.

### 4.3. Identidade compartilhada e namespaced por obra

Toda representação equivalente da mesma unidade deve carregar o mesmo `work_id` e `chapter_id`.

```yaml
work_id: hpmor
chapter_id: hpmor-001
chapter_number: 1
```

Para outra obra:

```yaml
work_id: bhagavad-gita
chapter_id: bhagavad-gita-001
chapter_number: 1
```

A tradução e a narração apontam explicitamente para a camada da qual derivam. IDs de unidade e segmento são namespaced por `work_id` para evitar colisões.

### 4.4. Unidades menores que o capítulo

A geração de áudio opera sobre segmentos estáveis menores que uma unidade publicável. Um segmento pode ser uma fala, um parágrafo narrativo ou outra unidade suficientemente pequena para regeneração isolada.

Cada segmento possui `segment_id` estável. O mesmo ID é preservado enquanto a unidade correspondente continua semanticamente sendo a mesma.

O termo operacional inicial continua sendo `chapter`, mas a UI não deve presumir romance moderno: uma obra pode expor capítulo, adhyaya, canto, ensaio, conto ou outra divisão editorial apropriada.

### 4.5. TTS é implementação, não contrato

A camada canônica de narração não depende de Breeze, Higgs, Chatterbox, Qwen, Fish, OpenAI, Google ou qualquer outro fornecedor específico.

Um adapter transforma a representação canônica de narração no formato esperado pelo backend selecionado.

### 4.6. Idioma declarado pelo modelo não é gate

A ausência de `pt-BR` ou `Portuguese` no model card não elimina um modelo do benchmark.

Modelos generativos podem produzir português adequadamente mesmo quando o idioma não é oficialmente suportado ou avaliado. O critério do projeto é empírico: o modelo permanece candidato enquanto produzir resultado aceitável no corpus de benchmark em português brasileiro.

Nenhum fine-tune deve ser presumido antes de testar zero-shot.

### 4.7. Reprodutibilidade por hash

Um segmento de áudio é identificado por uma chave derivada, no mínimo, de:

- `work_id` e `segment_id`;
- texto de narração;
- identidade/configuração da voz;
- backend e modelo TTS;
- parâmetros relevantes;
- seed, quando aplicável;
- versão do adapter;
- versão do schema de narração.

Se a chave não mudar e o artefato existir, a pipeline reutiliza o áudio.

### 4.8. Git guarda estado; áudio pesado não precisa morar no Git

O repositório guarda corpus, manifests, configuração, proveniência e hashes. Arquivos pesados podem ser mantidos como artifacts temporários e/ou em storage de mídia separado.

O Internet Archive é o destino durável preferencial para áudio final publicado quando esse backend estiver habilitado. A preferência não é requisito para o primeiro protótipo e não muda o fato de o storage ser substituível.

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

Não existe workflow por livro. Um único workflow recebe `work_id`.

### 4.11. Podcast é saída de primeira classe e existe por obra

Uma unidade não termina tecnicamente em um arquivo de áudio. Quando marcada como publicável, ela deve poder virar um episódio do feed RSS estável daquela obra.

Cada obra possui um feed próprio, conceitualmente:

```text
/audiobooks/hpmor/feed.xml
/audiobooks/bhagavad-gita/feed.xml
```

O `chapter_id` determina um GUID de episódio estável. Regenerar o áudio com outro TTS ou mover o enclosure para outro storage não deve criar episódio duplicado.

## 5. Modelo de conteúdo

### 5.1. Estrutura-alvo

```text
data/audiobooks/
  hpmor/
    work.md
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

  bhagavad-gita/
    work.md
    original/
      ...
    translation/
      ...
    narration/
      ...
    voices.yaml

scripts/audiobook/
  # compartilhados entre todas as obras
  worker.py
  plan.py
  validate.py
  assemble.py
  publish.py
  runners/
    colab.sh
    kaggle.sh
  storage/
    internet_archive.py
```

O corpus fica fora de `src/content/blog/**`: livros não são posts do Hrönir e não devem entrar acidentalmente em ranking, versionamento ou seleção de posts.

`work.md` é a raiz OKF de cada obra e carrega `work_id`, título, idiomas, atribuição/proveniência, slug público e configuração editorial relevante.

Adicionar uma obra normal deve significar adicionar `data/audiobooks/<work_id>/...`, e não criar novo worker, novo publisher ou novo workflow.

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
- manter IDs de segmentos estáveis após a primeira segmentação;
- não pressupor inglês como idioma de origem.

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

- mesmo `work_id` e `chapter_id` do original;
- alinhamento por `segment_id`;
- tradução adequada para leitura humana;
- nenhum truque específico de sintetizador;
- comparação automática original <-> tradução por unidade e segmento;
- cadeia de derivação/proveniência explícita quando a edição usar fonte intermediária.

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

`voices.yaml` pertence à obra e define identidades lógicas, não IDs rígidos de um fornecedor.

Para HPMOR pode haver narrador e vários personagens:

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

Outra obra pode usar uma estratégia completamente diferente sem mudar o motor. Bhagavad Gita pode, por exemplo, começar com narrador único ou outra direção editorial definida no próprio corpus.

Cada backend mantém separadamente o mapeamento da identidade lógica para referência, prompt, voice clone ou configuração concreta.

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
- nomes estrangeiros dentro de frase portuguesa;
- alternância pt-BR/outro idioma;
- passagens mais longas para testar estabilidade.

O benchmark inicial pode privilegiar HPMOR, mas a configuração vencedora não precisa ser universal. Obras diferentes podem escolher modelo/voz/direção diferentes.

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

O mesmo código deve aceitar:

```text
python scripts/audiobook/worker.py \
  --work bhagavad-gita \
  --chapter 1 \
  --backend breeze \
  --model <modelo> \
  --input-plan <plan.json> \
  --output-dir <dir>
```

O worker:

1. lê um plano de segmentos já validado;
2. lê configuração da obra por `work_id`;
3. instala/carrega apenas o backend selecionado;
4. gera cada segmento de forma independente;
5. escreve áudio + metadata de execução;
6. não altera original, tradução ou narração;
7. pode retomar execução parcial;
8. encerra com código diferente de zero em falhas não recuperáveis.

O script deve ser capaz de detectar a GPU disponível e registrar hardware, versões e parâmetros no manifesto da execução.

Dependências Python devem ser declaradas de forma autocontida sempre que viável, preferencialmente com PEP 723/`uv run`, evitando manter ambientes manuais diferentes por runner.

## 9. Runners de compute

### 9.1. Princípio

Colab e Kaggle não recebem implementações distintas do TTS nem por modelo nem por obra. Eles recebem o mesmo worker.

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

A pipeline expõe estágios independentes e sempre recebe `work_id`:

1. `import` — obtém/normaliza o original e calcula proveniência/digest;
2. `translate` — cria ou atualiza a tradução;
3. `prepare-narration` — cria ou atualiza a camada de narração;
4. `validate` — verifica obra, IDs, alinhamento, links e schema;
5. `plan` — calcula segmentos, cache keys e trabalho pendente;
6. `benchmark` — opcionalmente gera as mesmas amostras em múltiplos backends;
7. `synthesize` — despacha o worker para runner local/Colab/Kaggle/API;
8. `assemble` — concatena segmentos em uma unidade/capítulo;
9. `publish` — envia a mídia, atualiza o episódio/feed da obra e publica os artefatos.

Cada estágio pode ser executado sem obrigatoriamente executar os posteriores.

### 10.1. Dry-run obrigatório

Antes de síntese, `plan` deve mostrar:

- obra selecionada;
- unidades/capítulos selecionados;
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

1. descobrir/validar `work_id`;
2. validar o corpus;
3. gerar o plano;
4. escolher runner;
5. invocar `colab` ou `kaggle` CLI, ou usar um backend HTTP;
6. acompanhar a execução;
7. recuperar outputs;
8. validar manifests;
9. montar a unidade;
10. publicar mídia/feed da obra quando autorizado.

O primeiro workflow usa `workflow_dispatch` e aceita, no mínimo:

- `work_id`;
- capítulo/unidade ou intervalo;
- backend/modelo;
- runner (`local`, `colab`, `kaggle`, `api` quando houver);
- `dry_run`;
- `force` para ignorar cache;
- `publish`.

A lista de obras deve preferencialmente ser descoberta de `data/audiobooks/*/work.md`, não duplicada em código.

Credenciais externas entram somente por GitHub Secrets e nunca no corpus, logs ou artefatos públicos.

Detalhes de autenticação headless, staging, retomada, publicação no Internet Archive e segurança ficam no contrato [`github-actions-execution.md`](./github-actions-execution.md).

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

Depois de publicação, pode registrar também `episode_guid`, `enclosure_url`, storage/identifier remoto, digest do arquivo distribuído e timestamp de publicação.

## 13. Validação

Validações mínimas:

- todo diretório de obra possui `work.md` válido;
- `work_id` é único e coincide com o namespace esperado;
- todos os documentos possuem `type` OKF;
- toda unidade possui `work_id`, `chapter_id`, número/ordem e `lang`;
- original, tradução e narração concordam em identidade;
- `derived_from` resolve;
- `segment_id` não se repete dentro da obra;
- ordem dos segmentos é determinística;
- descendentes não referenciam silenciosamente segmentos inexistentes;
- manifests nunca são tratados como fonte canônica;
- nenhum segredo aparece versionado;
- runner não modifica corpus canônico;
- outputs declarados pelo worker correspondem ao plano recebido;
- episódio publicado tem GUID estável;
- enclosure está publicamente acessível antes de entrar no feed;
- uma obra não sobrescreve cache, manifest ou publicação de outra.

## 14. Site e podcasts

O próprio `franklinbaldo.github.io` deve ser o frontend e a identidade RSS da fábrica de audiolivros.

A estrutura pública é data-driven:

```text
/audiobooks/                         # catálogo de obras
/audiobooks/hpmor/                   # página da obra
/audiobooks/hpmor/feed.xml           # podcast HPMOR
/audiobooks/bhagavad-gita/           # página da obra
/audiobooks/bhagavad-gita/feed.xml   # podcast Bhagavad Gita
```

Cada obra pode oferecer:

- página da obra;
- índice de unidades/capítulos;
- página/player por unidade;
- indicação do trecho corrente quando disponível;
- texto traduzido sincronizado;
- comparação original/tradução quando desejada;
- feed RSS próprio;
- ação clara para copiar/adicionar o feed ao tocador;
- M4B e outros formatos futuramente.

O feed fica no blog; a mídia pesada pode usar storage separado, preferencialmente Internet Archive quando habilitado. Essa separação evita acoplar os podcasts aos limites de armazenamento do GitHub Pages.

O contrato completo de RSS, enclosure, GUID, transcript e Podcasting 2.0 está em [`podcast-publication.md`](./podcast-publication.md).

## 15. Escopo autoral e publicação

Cada obra deve registrar sua própria proveniência e base editorial/publicação em `work.md` ou configuração associada.

O motor não presume que toda obra está em domínio público nem que toda obra requer a mesma autorização. Obras podem entrar por domínio público, licença, permissão ou outra base adequada ao caso concreto.

Questões de autorização não devem contaminar o código compartilhado do motor; são metadata/política da obra e gates de publicação quando relevantes.

## 16. Não-objetivos iniciais

Não fazem parte do kickstart:

- gerar todos os capítulos do HPMOR imediatamente;
- implementar já o conteúdo do Bhagavad Gita;
- escolher um vencedor TTS sem benchmark próprio;
- adaptar/fine-tunar modelo antes de testar zero-shot;
- criar vozes clonadas de atores ou pessoas reais;
- dramatização com efeitos/trilha;
- armazenar grandes binários no Git;
- automatizar gasto em todo `push`;
- contaminar tradução com comandos de sintetizador;
- manter notebooks operacionais ou uma pipeline paralela em `.ipynb`;
- depender de um diretório comercial de podcasts para que a assinatura funcione;
- criar código, workflow ou página manual específica para cada novo livro.

## 17. Fases

### Fase 0 — contrato

Esta PR.

Critério de aceite: os documentos fixam arquitetura multi-work, corpus, benchmark, worker, compute CLI-first, controle via GitHub Actions e publicação de um podcast independente por obra.

### Fase 1 — motor mínimo + HPMOR como primeira obra

Entregáveis:

- estrutura genérica `data/audiobooks/<work_id>/`;
- `data/audiobooks/hpmor/work.md`;
- `data/audiobooks/hpmor/{original,translation,narration}`;
- capítulo 1 do HPMOR nas três camadas;
- `voices.yaml` mínimo;
- validador genérico de obra, IDs, derivação e segmentos;
- uma segunda fixture mínima fictícia ou estrutural para provar que o validador não depende de HPMOR;
- fixtures/testes;
- nenhuma chamada paga.

Critério de aceite: o mesmo validador percorre deterministicamente uma obra por `work_id`; HPMOR é apenas a primeira instância real.

### Fase 2 — planner, worker e runners genéricos

Entregáveis:

- parser da narração;
- representação interna de requests TTS;
- interface de backend;
- cache key namespaced por obra;
- `plan`/dry-run;
- backend fake;
- `scripts/audiobook/worker.py`;
- runner local;
- wrappers CLI para Colab e Kaggle;
- Kaggle configurado como `kernel_type: script`;
- workflow GitHub Actions genérico com `work_id` capaz de despachar runner fake/headless;
- nenhum notebook requerido.

Critério de aceite: o mesmo worker executa jobs de duas fixtures/obras sem alteração de código e pode ser despachado por Actions pelos CLIs remotos.

### Fase 3 — benchmark real

Entregáveis:

- adapters dos candidatos selecionados;
- corpus benchmark pt-BR;
- execução comparável em pelo menos um runner gratuito disponível;
- amostras e manifests comparáveis;
- relatório de qualidade/estabilidade/desempenho.

Critério de aceite: existe evidência própria suficiente para escolher ou ordenar os modelos para a primeira obra, sem transformar essa escolha em default obrigatório de todas as obras futuras.

### Fase 4 — primeiro HPMOR em áudio e feed

Entregáveis:

- backend/modelo selecionado para HPMOR;
- geração incremental;
- montagem do capítulo;
- manifesto completo;
- storage de mídia compatível com podcast;
- feed RSS HPMOR inicial;
- episódio do capítulo 1;
- artifact com áudio resultante.

Critério de aceite: capítulo 1 reproduzível a partir do commit/configuração e assinável em um player de podcast usando o feed HPMOR do blog.

### Fase 5 — experiência multi-work no blog

Entregáveis:

- loader genérico de obras;
- `/audiobooks/` como catálogo;
- página genérica por `work_id`;
- página/player genérico por unidade;
- metadados de navegação;
- ação de assinatura/copiar feed por obra;
- transcript/timestamps derivados quando disponíveis;
- nenhuma página Astro exclusiva de HPMOR necessária para comportamento genérico.

### Fase 6 — Internet Archive e escala

Após o primeiro capítulo estar satisfatório:

- backend de publicação Internet Archive;
- item/identifier estável por obra;
- capítulos seguintes do HPMOR;
- consistência de personagens/pronúncia;
- geração batch incremental;
- formatos adicionais;
- submissão opcional a diretórios de podcasts.

### Fase 7 — segunda obra real

Adicionar Bhagavad Gita ou outra obra elegível usando a mesma infraestrutura.

Critério de aceite: a nova obra cria corpus/configuração/feed próprios sem alteração necessária no worker, runners, planner ou publisher para o caso normal.

## 18. Métricas de sucesso

O projeto é bem-sucedido quando:

- qualquer tradução é rastreável ao original;
- qualquer narração é rastreável à tradução;
- qualquer áudio é rastreável ao texto/configuração/modelo/runner;
- corrigir uma fala não força regenerar a unidade inteira;
- trocar backend não exige reescrever o corpus;
- o mesmo worker roda localmente e em compute remoto;
- nenhum notebook manual é necessário;
- GitHub Actions consegue executar a pipeline sem interação com UI externa;
- o feed de uma obra pode ser adicionado a um tocador de podcast;
- novos capítulos publicados aparecem como novos episódios sem reassinar;
- múltiplas obras coexistem sem colisão de IDs/cache/publicação;
- adicionar uma nova obra normal não exige alterar o motor;
- cada obra possui página e feed próprios;
- o corpus continua compreensível como Markdown sem ferramenta de TTS.

## 19. Decisões já tomadas

1. o produto é uma fábrica de audiolivros multi-work; HPMOR é a primeira obra, não o motor;
2. haverá três camadas por obra: original, tradução e narração;
3. todas serão Markdown compatível com OKF;
4. cada obra possui `work_id` estável e `work.md` como raiz do bundle;
5. as camadas correspondentes compartilham `chapter_id` e IDs menores namespaced por obra;
6. narração adapta a forma para TTS sem substituir a tradução;
7. TTS é pluggable e provider-neutral;
8. idioma não listado no model card não elimina candidato;
9. zero-shot é testado antes de qualquer adaptação;
10. escolha de modelo passa por benchmark pt-BR próprio e pode variar por obra;
11. código de produção é CLI-first e script-first;
12. `.ipynb` não é fonte operacional do projeto;
13. Colab e Kaggle são runners do mesmo worker;
14. Kaggle usa `kernel_type: script`;
15. GitHub Actions é o plano de controle e ponto único de operação;
16. credenciais remotas ficam em GitHub Secrets;
17. chamadas pagas começam manuais/dry-run;
18. binários de áudio são derivados;
19. cada obra publicável recebe um podcast/feed RSS próprio;
20. GUID de episódio é estável e independente de TTS/storage;
21. o feed RSS canônico é hospedado pelo blog;
22. mídia pesada usa storage separado do GitHub Pages quando necessário;
23. Internet Archive é o destino durável preferencial quando habilitado;
24. o blog terá catálogo `/audiobooks/` e páginas data-driven por obra;
25. Bhagavad Gita é o segundo caso de referência de generalidade, sem conteúdo exigido no kickstart.

## 20. Primeira próxima ação

A próxima PR após este PRD deve implementar a **Fase 1** como motor genérico + HPMOR como primeira instância. A estrutura e os testes já devem tornar impossível acoplar silenciosamente o código a `hpmor`, preservando desde o início o caminho para Bhagavad Gita e futuras obras.
