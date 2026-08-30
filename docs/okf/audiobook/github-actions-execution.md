---
type: Architecture Contract
title: Audiobook — GitHub Actions control plane
description: Contrato para usar GitHub Actions como ponto único de operação da pipeline de audiolivro e despachar compute remoto por CLI.
tags: [audiobook, github-actions, kaggle, colab, cli, tts]
timestamp: 2026-08-30T18:20:00Z
---

# GitHub Actions como plano de controle do audiolivro

## 1. Decisão

A operação normal da pipeline deve acontecer por **GitHub Actions**.

O operador não precisa abrir Kaggle, Colab nem notebook. O workflow recebe os parâmetros da execução, lê credenciais de GitHub Secrets, valida e planeja o trabalho, despacha compute remoto, acompanha o job, recupera os resultados, valida os artefatos, monta o capítulo e publica os outputs selecionados.

GitHub Actions é o **plano de controle**; GPU e TTS são planos de execução substituíveis.

```text
workflow_dispatch / future automation
              |
              v
        GitHub Actions
              |
     +--------+--------+----------------+
     |                 |                |
   Kaggle            Colab            API TTS
     |                 |                |
     +--------+--------+----------------+
              |
              v
       segmentos de áudio
              |
              v
      validate + assemble
              |
              v
       publish + artifact
```

## 2. Interface do workflow

O workflow de produção deve aceitar, no mínimo:

- `work`;
- `chapter` ou intervalo;
- `backend`/modelo TTS;
- `runner`: `kaggle`, `colab`, `api` ou `local` para testes;
- `dry_run`;
- `force` para invalidar cache deliberadamente;
- opcionalmente `publish` para separar geração de publicação.

O workflow deve ser acionável manualmente por `workflow_dispatch` na primeira versão. Geração automática por eventos pode ser adicionada somente depois que cache, custo e publicação estiverem estáveis.

## 3. Segredos

Credenciais nunca entram em Markdown, manifests públicos, arquivos de staging ou argumentos impressos em logs.

Nomes canônicos iniciais:

```text
KAGGLE_API_TOKEN
COLAB_ADC_JSON          # ou outro mecanismo headless comprovado pelo CLI
HF_TOKEN                # quando um modelo no Hugging Face exigir autenticação
HIGGS_API_KEY           # se usado
FISH_API_KEY            # se usado
```

Outros backends podem adicionar seus próprios secrets sem alterar o contrato do corpus.

### 3.1. Kaggle

O runner deve usar autenticação não interativa suportada pelo Kaggle CLI, preferencialmente `KAGGLE_API_TOKEN` exposto apenas como variável de ambiente do step.

O token não pode ser copiado para o staging enviado ao kernel.

Referência: [Kaggle CLI](https://github.com/Kaggle/kaggle-cli).

### 3.2. Colab

O runner deve usar o mecanismo headless oficialmente suportado pelo Colab CLI. A primeira implementação deve provar em CI que a identidade usada pelo workflow consegue provisionar o acelerador esperado.

A disponibilidade de GPU gratuita da conta é uma propriedade operacional do runner, não do modelo TTS. Falta de quota/alocação deve produzir status `runner_unavailable`, não reprovar o backend de TTS.

Segredos necessários pelo worker remoto devem ser injetados no runtime pelo mecanismo de environment variables do CLI, sem `.env` versionado ou notebook intermediário.

Referência: [Google Colab CLI](https://github.com/googlecolab/google-colab-cli).

## 4. Worker comum

O GitHub Actions nunca deve conter a lógica principal do modelo.

O mesmo `scripts/audiobook/worker.py` é executado localmente ou no runner remoto. O workflow apenas:

1. produz `plan.json`;
2. prepara staging mínimo;
3. despacha o worker;
4. aguarda conclusão;
5. baixa outputs;
6. valida o manifesto;
7. chama `assemble`;
8. publica quando solicitado.

Isso impede divergência entre implementação local, Kaggle e Colab.

## 5. Kaggle em CI

Fluxo conceitual:

```bash
kaggle kernels push -p "$STAGING"
# poll até complete/error
kaggle kernels status "$KERNEL_REF"
kaggle kernels output "$KERNEL_REF" -p "$OUTPUT"
```

O job remoto deve ser `kernel_type: script`, privado e com GPU habilitada.

O nome do kernel deve incorporar identidade suficiente para evitar colisão entre execuções concorrentes ou o workflow deve serializar explicitamente o runner.

## 6. Colab em CI

O runner pode usar uma execução efêmera para jobs simples ou uma VM persistente durante um batch quando o custo de carregar o modelo repetidamente for relevante.

Fluxo conceitual efêmero:

```bash
colab run --gpu <preferencia> scripts/audiobook/worker.py -- <args>
```

Fluxo conceitual persistente:

```text
colab new -> install/sync -> exec N vezes -> download -> stop
```

O wrapper deve garantir teardown em `finally`/step `always()` quando uma VM persistente tiver sido criada.

## 7. Estado e retomada

Uma execução remota pode terminar por quota, timeout ou falha transitória. Por isso:

- cada segmento é independente;
- cada output possui cache key determinística;
- o worker escreve progresso incremental;
- rerun não deve refazer segmentos válidos já persistidos;
- o manifesto distingue `generated`, `reused`, `failed` e `pending`;
- o workflow pode retomar um capítulo sem começar do zero.

## 8. Artefatos do workflow

Cada execução de síntese deve produzir, no mínimo:

```text
plan.json
run-manifest.json
segments/
chapter/                 # quando assemble tiver sido executado
benchmark/               # quando for rodada comparativa
```

Os outputs de áudio podem ser temporariamente publicados como GitHub Actions artifacts durante desenvolvimento. Isso não define o storage de distribuição final.

## 9. Segurança e logs

- usar `set -euo pipefail` nos wrappers shell;
- nunca usar `set -x` em steps que manipulam secrets;
- não imprimir environment completo;
- não serializar tokens no `plan.json` ou manifesto;
- marcar valores derivados sensíveis com masking quando necessário;
- workflows de PR vindos de forks não recebem secrets e, portanto, não podem sintetizar remotamente;
- a síntese real deve exigir evento/contexto autorizado.

## 10. Critério de aceite do runner automático

Um runner só pode ser declarado suportado em GitHub Actions depois de um teste end-to-end que prove:

1. autenticação headless;
2. provisionamento do compute;
3. envio do worker e input;
4. execução sem UI;
5. recuperação dos outputs;
6. teardown/encerramento;
7. ausência de secret nos logs e artefatos;
8. rerun idempotente com cache.

Até esse teste, o runner pode existir como experimental sem bloquear os demais.
