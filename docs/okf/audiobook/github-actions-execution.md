---
type: Architecture Contract
title: Audiobook — GitHub Actions control plane
description: Contrato para usar GitHub Actions como ponto único de operação da pipeline de audiolivro e despachar compute remoto por CLI.
tags: [audiobook, github-actions, kaggle, colab, cli, tts, internet-archive]
timestamp: 2026-08-30T18:20:00Z
---

# GitHub Actions como plano de controle do audiolivro

## 1. Decisão

A operação normal da pipeline deve acontecer por **GitHub Actions**.

O operador não precisa abrir Kaggle, Colab nem notebook. O workflow recebe os parâmetros da execução, lê credenciais de GitHub Secrets, valida e planeja o trabalho, despacha compute remoto, acompanha o job, recupera os resultados, valida os artefatos, monta o capítulo e publica os outputs selecionados.

GitHub Actions é o **plano de controle**; GPU, TTS e storage são planos de execução substituíveis.

```text
workflow_dispatch / future automation
                  |
                  v
           GitHub Actions
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
 (media when enabled)   (canonical identity)
```

## 2. Segurança e autenticação

Nenhum segredo é versionado.

Credenciais externas são mantidas em GitHub Actions Secrets e expostas somente ao step que precisa delas. O workflow deve evitar ecoar segredos em logs e não deve gravá-los em artifacts.

Exemplos de famílias de credenciais:

- Kaggle API token;
- credenciais headless aceitas pelo Colab CLI;
- tokens de Hugging Face quando necessários para modelos gated;
- chaves de APIs TTS;
- credenciais de upload do Internet Archive quando o backend de publicação estiver habilitado.

Os nomes finais dos secrets são definidos pela implementação dos respectivos adapters. O contrato é que cada adapter documente explicitamente quais secrets consome e falhe cedo quando estiverem ausentes.

## 3. Runners remotos

### 3.1. Kaggle

O workflow instala o Kaggle CLI, injeta a credencial por ambiente, monta um staging directory, envia um **script kernel** privado com GPU e acompanha o estado até sucesso/falha.

O job remoto executa o mesmo `worker.py` usado localmente.

O workflow então baixa os outputs do kernel e os valida antes da montagem/publicação.

### 3.2. Colab

O workflow instala o CLI oficial do Colab e usa somente operações não interativas.

O caminho preferido deve ser `colab run` ou `colab exec`, mantendo o mesmo worker Python e transmitindo configuração por argumentos/arquivos e environment variables suportadas pelo CLI.

A autenticação headless e, principalmente, o acesso efetivo à GPU gratuita a partir da identidade usada no GitHub Actions devem ser provados por um smoke test real antes de o runner Colab ser declarado suportado para produção.

Falha de quota/provisionamento é erro do runner, não do backend TTS.

### 3.3. API

Backends HTTP podem pular a etapa de GPU remota, mas continuam obedecendo ao mesmo plano de segmentos, manifests, cache e validações.

## 4. Publicação e Internet Archive

GitHub Actions também é o ponto único de operação da publicação.

Quando `publish` estiver habilitado para o Internet Archive, o workflow deve:

1. instalar o cliente/adapter de upload (`ia`/`internetarchive` ou equivalente suportado);
2. carregar as credenciais exclusivamente de GitHub Secrets;
3. fazer upload do áudio final e demais arquivos selecionados para o item estável da obra;
4. aguardar o arquivo ficar disponível publicamente;
5. verificar a URL final conforme o contrato de podcast (`HEAD`, range request, MIME e bytes);
6. só então atualizar o feed RSS e publicar o blog.

A ordem impede que o feed anuncie um episódio cujo enclosure ainda não possa ser reproduzido.

O Internet Archive é um backend de publicação, não uma fonte canônica: Git continua guardando corpus, configuração, hashes e proveniência. Se o Archive estiver temporariamente indisponível, o áudio montado continua recuperável como artifact de build e a publicação pode ser retomada sem regerar o TTS.

## 5. Workflow de produção

O workflow inicial deve usar `workflow_dispatch` e aceitar parâmetros como:

- obra;
- capítulo/intervalo;
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
  -> validate
  -> plan
  -> dry-run gate
  -> dispatch remote compute
  -> wait/poll
  -> download results
  -> validate output manifest
  -> assemble
  -> encode final media
  -> optional publish media (Internet Archive preferred)
  -> verify public enclosure
  -> generate feed/site metadata
  -> deploy site
```

## 6. Idempotência e retomada

O workflow não pressupõe que uma execução longa termina em uma única tentativa.

Cada fase deve poder ser retomada a partir de estado verificável:

- cache keys determinam segmentos já válidos;
- outputs remotos são validados por digest;
- capítulo montado é regenerável sem ressintetizar segmentos válidos;
- upload de publicação usa identifier/nome de arquivo estáveis;
- feed só muda após confirmação do arquivo público.

Uma falha depois da síntese não deve obrigar a gastar GPU novamente.

## 7. Dry-run e proteção de custo

`dry_run` não envia job pago nem chama API cobrada. Ele mostra exatamente o que seria produzido e quais credenciais/runners seriam necessários.

Qualquer backend capaz de gerar cobrança deve permanecer opt-in na primeira versão.

Compute gratuito de Kaggle/Colab também deve respeitar planejamento e cache para não desperdiçar quota.

## 8. Critérios de aceite

O control plane está implementado quando:

1. um workflow manual consegue validar e planejar um capítulo sem segredo externo;
2. um runner remoto consegue executar o worker e devolver output validável;
3. secrets nunca aparecem em corpus, commit ou artifact;
4. falha de runner é distinguida de falha de modelo;
5. uma execução interrompida pode ser retomada sem regenerar segmentos válidos;
6. a mesma interface de workflow pode trocar Kaggle/Colab/API sem alterar o corpus;
7. quando a publicação no Internet Archive for ativada, upload, verificação e atualização do feed podem ocorrer integralmente dentro do GitHub Actions.
