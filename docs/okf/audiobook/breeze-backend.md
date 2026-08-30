---
type: Implementation Note
title: Audiobook Factory — Breeze TTS 2 backend
description: Contrato de execução e benchmark zero-shot do primeiro backend TTS open-weight da fábrica de audiolivros.
tags: [audiobook, tts, breeze, benchmark, kaggle, colab]
timestamp: 2026-08-30T22:30:00Z
---

# Breeze TTS 2 na Audiobook Factory

## Papel

Breeze TTS 2 é o primeiro backend real implementado para testar a arquitetura da fábrica. Ele **não é declarado vencedor por antecipação**. A escolha de produção continua dependente do benchmark pt-BR próprio e da comparação com outros candidatos.

O backend não participa de tradução, preparação de narração nem decisão editorial. Recebe somente um `audiobook-tts-plan-v1` já produzido pela camada editorial/planner.

## Reprodutibilidade

A integração fixa revisões conhecidas em vez de executar `main` flutuante:

```text
código: https://github.com/breezeblue-ai/breeze-tts.git
revision: ca632ce6c4d05f7985da4eab29b1a5d445b43f7b

modelo: BreezeBlue/Breeze-TTS-2
revision: a3bd0a6e83cd2d046ce783df2f7cb84292869ef7
```

As revisões efetivamente utilizadas são gravadas em `manifest.json`.

Variáveis `BREEZE_CODE_REVISION` e `BREEZE_MODEL_REVISION` permitem experimentação deliberada com outra revisão, sem alterar silenciosamente o default reproduzível.

## Bootstrap no runner remoto

O mesmo `scripts/audiobook/worker.py` usado pelo backend fake:

1. clona o código oficial do Breeze na revisão fixada;
2. instala o `requirements.txt` oficial;
3. baixa o snapshot fixado do modelo pelo Hugging Face;
4. inicia a API streaming oficial localmente;
5. espera `/health` informar que o runtime está pronto;
6. mantém a instância carregada para todos os segmentos do job;
7. encerra o processo ao final.

O cache raiz pode ser definido por `AUDIOBOOK_MODEL_CACHE`. `AUDIOBOOK_SKIP_BACKEND_INSTALL=1` existe apenas para ambientes já preparados e não é o caminho padrão reproduzível.

## Voz lógica para Voice Design

A configuração provider-neutral em `voices.yaml` entra no plano de cada segmento e faz parte de `input_digest`.

Exemplo conceitual:

```yaml
harry:
  role: character
  locale: pt-BR
  description: >-
    Menino muito articulado e intelectualmente precoce; energia juvenil sem
    transformar a voz em caricatura infantil.
```

No primeiro benchmark, o adapter compila isso para uma instrução natural do Breeze. Não há reference audio nem fine-tune.

A seed é derivada deterministicamente de:

- `speaker`;
- configuração lógica completa da voz.

Assim, segmentos do mesmo personagem usam a mesma seed de identidade. Texto e direção não alteram essa seed, mas continuam participando do `input_digest` do segmento.

## Direção narrativa

Diretivas provider-neutral são acrescentadas à instrução sem contaminar a camada canônica:

```json
{"emotion":"controlled fear","pace":"slightly fast"}
```

vira, conceitualmente:

```text
<descrição da voz>. Fale naturalmente no idioma e variante pt-BR.
Emoção: controlled fear. Ritmo: slightly fast.
```

Esse compilador é deliberadamente simples na primeira rodada. O benchmark deve mostrar quais dimensões realmente obedecem bem ao Breeze antes de sofisticá-lo.

## Formato de áudio

A API oficial retorna PCM mono signed 16-bit little-endian e anuncia o sample rate no header. O worker encapsula o PCM recebido em WAV por segmento e registra:

- `duration_ms`;
- `sample_rate`;
- `audio_digest`;
- seed;
- instrução compilada;
- `cfg_scale`.

O encoding final para MP3/AAC continua responsabilidade do assembler, não do backend TTS.

## Benchmark independente de obra

O corpus `data/audiobook-benchmarks/pt-br-audiobook-v1.yaml` não pertence a HPMOR nem a qualquer obra. Ele existe para testar o motor antes de um capítulo editorial ficar pronto.

Cobre pelo menos:

- narrativa neutra;
- pergunta e diálogo juvenil;
- autoridade contida;
- ironia;
- medo;
- sussurro;
- fonemas e encontros do pt-BR;
- números;
- nomes ingleses em frase portuguesa;
- code-switch;
- passagem analítica longa;
- transição emocional.

O workflow `Audiobook TTS Benchmark` compila esse corpus para o mesmo contrato `audiobook-tts-plan-v1` usado por livros reais e despacha o mesmo worker para Kaggle ou Colab.

O benchmark **não exige `ready_for_audio`**, porque não representa uma obra editorial e não é publicável. Isso não enfraquece o gate de produção: o workflow normal de mídia continua exigindo readiness antes de sintetizar capítulos.

## Critério de aceitação inicial

Breeze passa da condição de “backend implementado” para “candidato operacional” somente quando uma execução remota real demonstrar:

1. bootstrap completo numa GPU gratuita disponível;
2. geração dos 12 segmentos sem intervenção manual;
3. artifact recuperado pelo GitHub Actions;
4. manifesto com revisão, hardware e parâmetros;
5. áudio pt-BR inteligível em todos os casos;
6. ausência de repetição/alucinação catastrófica no corpus curto.

Qualidade relativa, identidade de personagem e expressividade são avaliadas depois, comparando as mesmas entradas com os demais backends.

## Limitações conhecidas desta primeira integração

- Voice Design por descrição pode não manter timbre tão estável quanto uma referência de voz explícita em um livro inteiro;
- `cfg_scale=4` é o default inicial porque fortalece instruction-following, mas deve ser benchmarkado;
- o modelo é oficialmente apresentado para inglês/chinês; pt-BR é deliberadamente tratado como hipótese empírica zero-shot;
- bootstrap inicial baixa vários gigabytes e pode consumir parte relevante de uma sessão gratuita;
- o backend usa a implementação eager padrão para caber em GPUs de aproximadamente 12–16 GB, em vez de presumir o caminho `--fast-all` mais pesado.

Se Voice Design for linguisticamente bom mas instável entre segmentos, o próximo experimento é gerar uma âncora de voz por personagem e usar Voice Direction com reference audio — sem mudar o contrato canônico de `voices.yaml`.
