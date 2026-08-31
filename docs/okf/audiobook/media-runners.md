---
type: Operations Guide
title: Audiobook Factory — media runners
description: Configuração operacional dos runners local, Colab e Kaggle usados pelo GitHub Actions após ready_for_audio.
tags: [audiobook, github-actions, colab, kaggle, tts, secrets]
timestamp: 2026-08-30T20:30:00Z
---

# Media runners

## 1. Escopo

Este documento cobre somente a execução de mídia após o gate editorial `ready_for_audio`.

Nenhum runner remoto participa da tradução, revisão ou preparação de narração.

## 2. Workflow

`.github/workflows/audiobook-media.yml` recebe:

- `work_id`;
- `chapter_id`;
- `runner` (`local`, `colab`, `kaggle`);
- backend/modelo;
- acelerador opcional;
- `dry_run`.

`dry_run=true` nunca aciona compute remoto.

`dry_run=false` executa primeiro:

```text
npm run audiobook:validate -- \
  --work <work_id> \
  --chapter <chapter_id> \
  --require-ready-for-audio
```

Só depois desse comando passam a ser acessadas credenciais externas.

## 3. Local

O runner local é a implementação de referência e usa o mesmo `scripts/audiobook/worker.py`.

O backend inicial `fake` produz WAVs determinísticos e existe para provar a pipeline sem TTS, rede ou GPU.

## 4. Google Colab

### CLI

Versão inicial pinada no workflow:

```text
google-colab-cli==0.6.0
```

O fluxo usa somente comandos não interativos:

```text
colab --auth=$COLAB_AUTH_PROVIDER new
colab --auth=$COLAB_AUTH_PROVIDER upload
colab --auth=$COLAB_AUTH_PROVIDER exec
colab --auth=$COLAB_AUTH_PROVIDER download
colab --auth=$COLAB_AUTH_PROVIDER stop
```

O CLI aceita duas formas de credencial, e a escolha não é indiferente:

- `oauth2` (**default do projeto**) — o token de usuário que o próprio `colab` emite
  e renova, gravado em `~/.config/colab-cli/token.json`. Ele já nasce com os scopes
  que o backend do Colab exige, incluindo `.../auth/colaboratory`, e se renova
  sozinho pelo `refresh_token`.
- `adc` — Application Default Credentials. Credenciais **de usuário** obtidas por
  `gcloud auth application-default login` não podem ser re-escopadas depois
  (`with_scopes` não é suportado), então precisam ser emitidas já com
  `--scopes=openid,.../cloud-platform,.../userinfo.email,.../colaboratory`;
  caso contrário o keep-alive da sessão devolve `403 SCOPE_NOT_PERMITTED`.

### GitHub Secret

Criar um dos dois:

```text
COLAB_TOKEN_JSON
COLAB_ADC_JSON
```

`COLAB_TOKEN_JSON` é o conteúdo de `~/.config/colab-cli/token.json` de uma conta
já autorizada; o workflow o materializa em `~/.config/colab-cli/token.json` com
permissão restrita e seleciona `COLAB_AUTH_PROVIDER=oauth2`. `COLAB_ADC_JSON` é o
fallback: materializa um arquivo temporário, aponta
`GOOGLE_APPLICATION_CREDENTIALS` para ele e seleciona `COLAB_AUTH_PROVIDER=adc`.
Nenhum dos dois é impresso em log.

**Gate de realidade:** armazenamento correto da credencial não prova que a conta terá direito a uma GPU gratuita em execução headless. Isso deve ser validado por uma execução real com a conta do projeto. Falha de quota/alocação é falha do runner, não do corpus ou do modelo TTS.

Default do projeto: `T4`.

## 5. Kaggle

### CLI

Versão inicial pinada:

```text
kaggle==2.2.4
```

O CLI oficial aceita autenticação não interativa por `KAGGLE_API_TOKEN` e kernels com `kernel_type: script`.

O runner gera um `job.py` autocontido e um `kernel-metadata.json`, depois executa:

```text
kaggle kernels push
kaggle kernels status
kaggle kernels output
```

Default do projeto: `NvidiaTeslaT4`.

A T4 é preferida ao P100 no ambiente atual porque a própria documentação do CLI alerta que o PyTorch default recente pode não conter kernels Pascal (`sm_60`) necessários ao P100.

### GitHub Secret e variável

Criar secret:

```text
KAGGLE_API_TOKEN
```

Criar repository variable:

```text
KAGGLE_USERNAME
```

O kernel default será:

```text
<KAGGLE_USERNAME>/audiobook-factory-tts
```

O token é passado somente ao step que configura/executa Kaggle; não é escrito no corpus nem no artifact.

## 6. Backend TTS e runner são eixos separados

`runner=kaggle` não significa `backend=breeze`.

Exemplos válidos no futuro:

```text
runner=kaggle, backend=breeze
runner=kaggle, backend=qwen3-tts
runner=colab, backend=higgs
runner=local, backend=fake
```

O backend escolhe **como sintetizar**. O runner escolhe **onde executar**.

## 7. Resultado comum

Todos os runners precisam devolver o mesmo contrato:

```text
audiobook-result.zip
  manifest.json
  segments/
    <segment_id>.wav
    ...
```

Assim Actions não precisa saber se o arquivo veio de CPU local, T4 do Colab ou T4 do Kaggle.

## 8. Referências verificadas em 2026-08-30

- Google Colab CLI: https://github.com/googlecolab/google-colab-cli
- Kaggle CLI kernels: https://github.com/Kaggle/kaggle-cli/blob/main/docs/kernels.md
- Kaggle auth: https://github.com/Kaggle/kaggle-cli/blob/main/skills/references/auth.md

As versões e superfícies desses CLIs podem mudar; upgrades devem ser PRs explícitas e acompanhadas de smoke test headless.
