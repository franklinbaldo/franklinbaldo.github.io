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
colab --auth=adc new
colab --auth=adc upload
colab --auth=adc exec
colab --auth=adc download
colab --auth=adc stop
```

O CLI oficial recomenda ADC para automação/headless. A identidade precisa ter os scopes necessários ao Colab.

### GitHub Secret

Criar:

```text
COLAB_ADC_JSON
```

O valor esperado é o conteúdo JSON de Application Default Credentials de uma conta autorizada a usar o Colab. O workflow materializa o JSON num arquivo temporário com permissão restrita e define `GOOGLE_APPLICATION_CREDENTIALS` apenas durante o job.

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
