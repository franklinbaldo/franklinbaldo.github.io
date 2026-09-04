---
type: Benchmark Report
title: Audiobook Factory — Breeze TTS 2 no corpus pt-br-audiobook-v1
description: Primeira execução real de TTS em GPU remota, com medições objetivas de qualidade pt-BR, custo e confiabilidade de runner.
tags: [audiobook, tts, breeze, benchmark, kaggle, colab, pt-BR]
timestamp: 2026-08-31T02:00:00Z
---

# Breeze TTS 2 — corpus `pt-br-audiobook-v1`

Primeiro benchmark **executado**, não estimado. Todos os números abaixo vêm de runs registradas no GitHub Actions, com os artifacts baixados e inspecionados.

## Veredito

**Breeze TTS 2 não serve para audiolivro em pt-BR.** A infraestrutura funciona ponta a ponta — o mesmo `plan.json` e o mesmo worker produzem WAVs e manifesto em Kaggle e Colab —, mas o modelo não fala português: ele lê o texto com fonética inglesa.

Isso não é surpresa retroativa: o próprio model card diz **"Bilingual Support — generates natural English and Chinese speech"**. O benchmark serviu para medir o tamanho do problema e para provar que a fábrica está de pé.

## O que foi executado

|                         |                                                                     |
| ----------------------- | ------------------------------------------------------------------- |
| backend                 | `breeze`                                                            |
| modelo                  | `BreezeBlue/Breeze-TTS-2`                                           |
| revisão do modelo       | `a3bd0a6e83cd2d046ce783df2f7cb84292869ef7`                          |
| revisão do código       | `breezeblue-ai/breeze-tts@ca632ce6c4d05f7985da4eab29b1a5d445b43f7b` |
| modo                    | Voice Design zero-shot (sem áudio de referência), `cfg_scale=4`     |
| atenção do text encoder | `eager` (ver "Compatibilidade")                                     |
| corpus                  | `pt-br-audiobook-v1`, 12 segmentos, 3 vozes lógicas                 |
| saída                   | WAV mono 24 kHz PCM 16-bit                                          |

## Qualidade pt-BR

Não foi possível ouvir os áudios na sessão que produziu este relatório, então a avaliação é **objetiva**: os 12 WAVs foram transcritos com `faster-whisper` (modelo `small`, CPU) e comparados ao texto do corpus.

Detecção automática de idioma, sem forçar nada:

| idioma detectado | segmentos |
| ---------------- | --------- |
| inglês           | 10        |
| albanês          | 1         |
| latim            | 1         |
| **português**    | **0**     |

Forçando o decoder para `pt`, o _word error rate_ contra o texto original:

|                                     | WER      |
| ----------------------------------- | -------- |
| mediana                             | **0,78** |
| média                               | 0,77     |
| melhor segmento (`analytical-long`) | 0,38     |
| pior segmento (`fear`)              | 1,00     |

Uma segunda execução independente no Kaggle deu **a mesma mediana de 0,78**.

O que a transcrição revela, segmento a segmento:

- **fonética pt-BR** — o segmento `phonetics` ("João arranhou o joelho, Guilherme recolheu as folhas molhadas…") sai como "João Arandu Ocho-Hello, Guilherme Recolher as Fals Molat". Dígrafos `lh`/`nh`, vogais nasais (`ão`, `ãe`) e o `r` inicial não existem no inventário do modelo.
- **números** — "às oito e quarenta e cinco" vira "Azeite em Quatimfive": numerais por extenso em português são lidos com fonética inglesa.
- **nomes ingleses** — paradoxalmente o **melhor** caso local: `Harry`, `Hermione`, `McGonagall`, `Hogwarts` e `Richard Feynman` saem corretos. O modelo acerta exatamente o que já é inglês.
- **code-switch** — o segmento que mistura "fail-safe" e "Bayesian updating" com português tem WER 0,88: os termos ingleses saem bem, o português em volta não.
- **prosódia e direção** — aqui o modelo **acerta**. O segmento `whisper` saiu medindo −25,4 dBFS de RMS com 31% de silêncio, contra ~−20,5 dBFS e ~13% na média dos demais; a instrução de sussurro foi obedecida. Ironia, medo e transição emocional produzem contornos distintos. O problema é fonético, não interpretativo.

Sanidade acústica dos 12 WAVs: RMS entre −25,4 e −19,7 dBFS, **zero clipping**, nenhum arquivo vazio ou truncado, todos os `audio_digest` do manifesto conferem com o conteúdo baixado, e todos os `input_digest` batem com o `plan.json`.

## Consistência de voz

O seed por personagem é estável e derivado da identidade lógica da voz: as três vozes do corpus produziram exatamente três seeds distintos (`narrator=910591955`, `child_scholar=331951075`, `authority=1422498136`), repetidos idempotentemente em todos os segmentos de cada personagem, e iguais entre execuções diferentes.

## Reprodutibilidade: o áudio **não** é bit-reprodutível

Duas execuções do mesmo `plan.json` no mesmo tipo de GPU produziram:

- **durações idênticas ao milissegundo** nos 12 segmentos;
- **`audio_digest` diferente em 12 de 12**.

Ou seja: o seed fixa o comportamento do modelo e o número de tokens gerados, mas a redução em GPU não é determinística bit a bit. **Consequência de projeto:** `audio_digest` não pode ser chave de cache nem critério de "já sintetizado". A chave continua sendo o `input_digest` do plano.

## Custo e runners

Os dois runners rodaram o **mesmo `plan.json`, o mesmo `worker.py` e o mesmo backend**, e produziram os mesmos 108,96 s de áudio nos mesmos 12 segmentos — o contrato é de fato runner-independent.

|                                                       | Kaggle                                   | Colab                          |
| ----------------------------------------------------- | ---------------------------------------- | ------------------------------ |
| GPU obtida                                            | Tesla T4 ×2, 15 GB (uma usada)           | Tesla T4, 15 GB                |
| Python da imagem                                      | 3.12                                     | 3.13                           |
| bootstrap (instalar + baixar pesos + carregar modelo) | **172,8 s**                              | **310,8 s**                    |
| inferência (12 segmentos)                             | **839,4 s**                              | **843,6 s**                    |
| áudio produzido                                       | 108,96 s                                 | 108,96 s                       |
| fator de tempo real                                   | ~7,7× mais lento que o tempo real        | ~7,7×                          |
| job completo no GitHub Actions                        | 17 min 56 s                              | 20 min 19 s                    |
| falhas de quota                                       | nenhuma                                  | nenhuma                        |
| retorno dos artifacts                                 | `result.zip` via `kaggle kernels output` | `colab download` do `/content` |

Leitura:

- **A inferência é indistinguível** (839 s vs 844 s, 0,5% de diferença): mesma
  GPU, mesmo modelo, mesmo trabalho. O runner não influencia a velocidade.
- **O bootstrap do Colab custa ~2,3 min a mais.** A sessão do Colab fica `READY`
  em ~13 s (contra ~30 s de fila no Kaggle), mas a imagem do Colab exige mais
  reinstalação da pilha pinada.
- **Confiabilidade:** nenhuma falha de quota nem de alocação de GPU em nenhum
  dos dois, em todas as tentativas desta sessão. As falhas que ocorreram foram
  todas de _integração_, não de disponibilidade.
- **Ergonomia de artifacts:** o Kaggle exige `--file-pattern`, porque um
  `kernels output` sem filtro baixa o diretório de trabalho inteiro — incluindo
  vários GB de cache do modelo. O Colab baixa o caminho pedido.
- **Um run não decide a escolha.** Com essa amostra, Kaggle leva por bootstrap
  mais barato; a diferença é pequena o bastante para que disponibilidade de GPU,
  e não velocidade, deva decidir na prática.

## Controle: o problema é o idioma, não a integração

Para separar "modelo ruim" de "modelo que não fala português", os **mesmos**
worker, backend, revisões e tipo de GPU sintetizaram três frases em inglês —
inclusive uma tradução literal do segmento `neutral` do corpus:

|                  | pt-BR (12 segmentos)               | inglês (3 segmentos, controle) |
| ---------------- | ---------------------------------- | ------------------------------ |
| idioma detectado | inglês em 10/12, português em 0/12 | inglês em 3/3                  |
| WER mediana      | **0,78**                           | **0,00**                       |
| WER média        | 0,77                               | 0,02                           |

O único erro do controle foi grafia de nome próprio ("McGonigal" por
"McGonagall"), num segmento em que o texto de referência é o mesmo tipo de
conteúdo do segmento `names` em português.

Isto fecha o diagnóstico: a integração está correta, o pin funciona, a Voice
Design zero-shot funciona, o seed funciona, o transporte de artifacts funciona.
O que não funciona é pedir português a um modelo treinado em inglês e chinês.

## Compatibilidade descoberta na execução

Quatro problemas reais só apareceram rodando de verdade; todos corrigidos:

1. **`torchvision` incompatível** (#1608) — o Breeze pina `torch==2.9.1` mas não `torchvision`, e imagens de GPU hospedadas trazem um `torchvision` compilado contra o torch delas. `transformers` importa `torchvision` avidamente, então o job morria com `operator torchvision::nms does not exist`.
2. **FlashAttention 2 forçada pelo checkpoint** (#1608, #1609) — o `config.json` do modelo define `text_encoder_config.preferred_attn_implementation: flash_attention_2`, e o text encoder obedece mesmo quando o chamador pede atenção eager. FlashAttention 2 só tem kernels para compute capability 8.0+, então **nenhuma GPU do Kaggle gratuito (T4 = 7.5, P100 = 6.0) pode satisfazê-la**. O worker passa a montar um checkpoint irmão que faz symlink de todos os arquivos e carrega um `config.json` reescrito, preservando o pin.
3. **Orçamento de wall-clock do kernel** (#1610) — `kaggle kernels push -t N` é o limite de execução do **kernel**, não um timeout de cliente. Com `-t 600` o Kaggle matava o job no meio da síntese.
4. **`jupyter-kernel-client`** (#1612, #1613) — a série 1.0.x renomeou a classe que o `google-colab-cli` 0.6.0 importa; sem pin, a sessão do Colab fica `READY`, os uploads passam, e só o `exec` morre.

Nota sobre bf16: ao contrário do que a compute capability sugere, `torch` reporta `is_bf16_supported() == True` numa T4 e o matmul bf16 executa. O bloqueio da T4 é só a FlashAttention.

## Recomendação

1. **Não adotar Breeze TTS 2 para pt-BR.** Ele é um excelente teste de carga da arquitetura e um bom candidato se algum dia houver material em inglês, mas WER 0,78 e detecção de idioma "inglês" em 10 de 12 segmentos não deixam margem.
2. **Manter a infraestrutura.** O contrato provou ser runner-independent: mesmo plano, mesmo worker, dois provedores. Trocar de backend é trocar uma classe no worker.
3. **Próximo backend deve ser avaliado neste mesmo corpus**, com o mesmo protocolo objetivo, que agora está no repositório: `scripts/audiobook/benchmark-asr.py <manifest.json> <plan.json>` roda a detecção de idioma e o WER forçado e imprime o resumo. Isso vem antes de qualquer avaliação subjetiva. Candidatos com pt-BR nativo declarado são o ponto de partida.
4. **Avaliação auditiva humana continua pendente**: os WAVs estão nos artifacts das runs listadas abaixo e valem cinco minutos de escuta para confirmar o diagnóstico.

## Runs

| run                                                                                              | runner         | resultado                                     |
| ------------------------------------------------------------------------------------------------ | -------------- | --------------------------------------------- |
| [33341474429](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33341474429) | local (`fake`) | verde — prova do pipeline                     |
| [33341528943](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33341528943) | kaggle         | falhou: `torchvision::nms`                    |
| [33343469590](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33343469590) | kaggle         | falhou: `audio_tokenizer/config.json` ausente |
| [33344144656](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33344144656) | kaggle         | falhou: kernel morto aos 600s                 |
| [33345109023](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33345109023) | kaggle         | **verde — primeiro TTS real**                 |
| [33346027491](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33346027491) | colab          | falhou: `jupyter_kernel_client.KernelClient`  |
| [33346498190](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33346498190) | colab          | falhou: barra-n literal na linha do pip       |
| [33346517077](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33346517077) | kaggle         | verde — run com medições de tempo             |

| [33346938456](https://github.com/franklinbaldo/franklinbaldo.github.io/actions/runs/33346938456) | colab | **verde — mesmo contrato, outro provedor** |
