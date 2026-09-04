---
type: Architecture Contract
title: Audiobook Factory — GitHub Actions control plane
description: Contrato para usar GitHub Actions como ponto único de operação da pipeline multi-work de audiolivros e despachar compute remoto por CLI.
tags: [audiobook, github-actions, kaggle, colab, cli, tts, internet-archive, multi-work]
timestamp: 2026-08-30T18:20:00Z
---

# GitHub Actions como plano de controle da fábrica de audiolivros

## 1. Decisão

A operação normal da pipeline deve acontecer por **GitHub Actions**.

O operador não precisa abrir Kaggle, Colab, Internet Archive nem notebook. O workflow recebe `work_id` e os demais parâmetros da execução, lê credenciais de GitHub Secrets, valida e planeja o trabalho, despacha compute remoto, acompanha o job, recupera os resultados, valida os artefatos, monta a unidade e publica os outputs selecionados.

GitHub Actions é o **plano de controle**; GPU, TTS e storage são planos de execução substituíveis.

Não existe workflow por livro. Existe uma pipeline genérica cuja primeira dimensão é `work_id`.

```text
workflow_dispatch / future automation
                  |
                  v
           GitHub Actions
                  |
        resolve work_id
                  |
        validate + plan
                  |
       +----------+----------+
       |          |          |
     Colab      Kaggle      API
       |          |          |
       +----------+----------+
                  |
             collect
                  |
             assemble
                  |
             publish
                  |
       +----------+----------+
       |                     |
 Internet Archive       blog / feed RSS
 (per-work media)       (per-work identity)
```

## 2. Descoberta de obras

O workflow deve descobrir obras a partir de `data/audiobooks/*/work.md` ou de um índice derivado desses manifests.

A lista de obras não deve ser duplicada em YAML do workflow.

Resolver `work_id` significa carregar, no mínimo:

- diretório canônico da obra;
- idiomas e metadata básicos;
- configuração de vozes;
- configuração de publicação;
- namespace de cache/artifacts;
- podcast/feed da obra;
- identifier remoto de storage quando já configurado.

Uma obra desconhecida falha antes de qualquer compute ou chamada externa.

## 3. Segurança e autenticação

Nenhum segredo é versionado.

Credenciais externas são mantidas em GitHub Actions Secrets e expostas somente ao step que precisa delas. O workflow deve evitar ecoar segredos em logs e não deve gravá-los em artifacts.

Exemplos de famílias de credenciais:

- Kaggle API token;
- credenciais headless aceitas pelo Colab CLI;
- tokens de Hugging Face quando necessários para modelos gated;
- chaves de APIs TTS;
- credenciais de upload do Internet Archive quando o backend de publicação estiver habilitado.

Os nomes finais dos secrets são definidos pela implementação dos respectivos adapters. O contrato é que cada adapter documente explicitamente quais secrets consome e falhe cedo quando estiverem ausentes.

Secrets são infraestrutura compartilhada; configuração editorial e escolha de backend/modelo podem variar por obra sem criar novos secrets necessariamente.

## 4. Runners remotos

### 4.1. Kaggle

O workflow instala o Kaggle CLI, injeta a credencial por ambiente, monta um staging directory namespaced por `work_id`, envia um **script kernel** privado com GPU e acompanha o estado até sucesso/falha.

O job remoto executa o mesmo `worker.py` usado localmente e recebe `--work <work_id>`.

O workflow então baixa os outputs do kernel e os valida antes da montagem/publicação.

### 4.2. Colab

O workflow instala o CLI oficial do Colab e usa somente operações não interativas.

O caminho preferido deve ser `colab run` ou `colab exec`, mantendo o mesmo worker Python e transmitindo `work_id`, configuração e inputs por argumentos/arquivos/environment variables suportadas pelo CLI.

A autenticação headless e, principalmente, o acesso efetivo à GPU gratuita a partir da identidade usada no GitHub Actions devem ser provados por um smoke test real antes de o runner Colab ser declarado suportado para produção.

Falha de quota/provisionamento é erro do runner, não do backend TTS nem da obra.

### 4.3. API

Backends HTTP podem pular a etapa de GPU remota, mas continuam obedecendo ao mesmo plano de segmentos, manifests, cache e validações, inclusive `work_id`.

## 5. Namespacing e isolamento

Todo estado derivado precisa ser isolado por obra.

Exemplos:

```text
cache/audiobook/hpmor/...
cache/audiobook/bhagavad-gita/...

artifacts/audiobook/hpmor/001/...
artifacts/audiobook/bhagavad-gita/001/...
```

Concurrency também deve considerar `work_id` e unidade para impedir duas publicações concorrentes de alterarem o mesmo feed/item remoto sem necessidade de serializar obras diferentes.

Uma execução de HPMOR não pode invalidar, apagar ou sobrescrever resultados do Bhagavad Gita.

## 6. Publicação e Internet Archive

GitHub Actions também é o ponto único de operação da publicação.

Quando `publish` estiver habilitado para o Internet Archive, o workflow resolve o **item estável daquela obra** e deve:

1. instalar o cliente/adapter de upload (`ia`/`internetarchive` ou equivalente suportado);
2. carregar as credenciais exclusivamente de GitHub Secrets;
3. obter o `archive_identifier` da configuração de `work_id`;
4. fazer upload do áudio final e demais arquivos selecionados para esse item;
5. aguardar o arquivo ficar disponível publicamente;
6. verificar a URL final conforme o contrato de podcast (`HEAD`, range request, MIME e bytes);
7. só então atualizar **o feed RSS daquela obra** e publicar o blog.

A ordem impede que o feed anuncie um episódio cujo enclosure ainda não possa ser reproduzido.

O Internet Archive é um backend de publicação, não uma fonte canônica: Git continua guardando corpus, configuração, hashes e proveniência. Se o Archive estiver temporariamente indisponível, o áudio montado continua recuperável como artifact de build e a publicação pode ser retomada sem regerar o TTS.

## 7. Workflow de produção

O workflow inicial deve usar `workflow_dispatch` e aceitar parâmetros como:

- `work_id`;
- capítulo/unidade ou intervalo;
- backend/modelo;
- runner (`kaggle`, `colab`, `api` e, para debug, `local`);
- `dry_run`;
- `force`;
- `publish`;
- backend de storage/publicação quando houver mais de um.

Fluxo de referência:

```text
checkout
  -> setup
  -> resolve work
  -> validate
  -> plan
  -> dry-run gate
  -> dispatch remote compute
  -> wait/poll
  -> download results
  -> validate output manifest
  -> assemble
  -> encode final media
  -> optional publish media to work storage
  -> verify public enclosure
  -> generate work feed/site metadata
  -> deploy site/catalog
```

O mesmo workflow deve funcionar conceitualmente assim:

```text
work=hpmor
```

ou:

```text
work=bhagavad-gita
```

sem alterar o código do workflow.

## 8. Idempotência e retomada

O workflow não pressupõe que uma execução longa termina em uma única tentativa.

Cada fase deve poder ser retomada a partir de estado verificável:

- cache keys incluem `work_id` e determinam segmentos já válidos;
- outputs remotos são validados por digest;
- unidade montada é regenerável sem ressintetizar segmentos válidos;
- upload de publicação usa identifier/nome de arquivo estáveis por obra;
- feed só muda após confirmação do arquivo público.

Uma falha depois da síntese não deve obrigar a gastar GPU novamente.

## 9. Dry-run e proteção de custo

`dry_run` não envia job pago nem chama API cobrada. Ele mostra exatamente:

- obra resolvida;
- unidade(s) selecionada(s);
- segmentos pendentes;
- runner/backend/modelo;
- cache aproveitado;
- credenciais necessárias;
- destino de publicação quando aplicável.

Qualquer backend capaz de gerar cobrança deve permanecer opt-in na primeira versão.

Compute gratuito de Kaggle/Colab também deve respeitar planejamento e cache para não desperdiçar quota.

## 10. Critérios de aceite

O control plane está implementado quando:

1. um workflow manual consegue resolver duas fixtures/obras diferentes por `work_id`;
2. uma obra inválida falha antes de compute;
3. um runner remoto consegue executar o worker e devolver output validável;
4. secrets nunca aparecem em corpus, commit ou artifact;
5. falha de runner é distinguida de falha de modelo;
6. uma execução interrompida pode ser retomada sem regenerar segmentos válidos;
7. a mesma interface de workflow pode trocar Kaggle/Colab/API sem alterar o corpus;
8. cache, artifacts, manifests, storage e feed são isolados por obra;
9. nenhuma obra exige workflow próprio;
10. quando a publicação no Internet Archive for ativada, upload, verificação e atualização do feed da obra podem ocorrer integralmente dentro do GitHub Actions.
