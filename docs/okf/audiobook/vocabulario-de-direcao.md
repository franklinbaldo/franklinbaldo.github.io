---
type: Style Guide
title: Audiobook Factory — vocabulário de direção validado por escuta
description: Quais tags e presets de cada motor foram aprovados de ouvido, e quais foram reprovados, para orientar a passada editorial por modelo.
tags: [audiobook, tts, direção, kokoro, higgs, voxcpm2]
timestamp: 2026-08-31T22:00:00Z
---

# Vocabulário de direção, validado por escuta

A RFC 0019 decidiu que **não haverá compilador** `direction → tags`: cada modelo
recebe uma passada manual, feita pelo agente editorial, porque escolher entre
duas emoções próximas é julgamento e não consulta a tabela.

Este documento é o insumo dessa passada. Ele não diz o que usar em cada frase —
diz **o que existe e o que funciona**, para que a passada não gaste esforço em
controle que o motor não entrega.

Tudo aqui foi decidido ouvindo as amostras do corpus `pt-br-audiobook-v1`. Onde
uma linha diz "não avaliado", ela ainda não passou por escuta e não deve ser
usada como se tivesse passado.

## Higgs — emoções

O modelo expõe 21 tags de emoção. Dez foram sintetizadas na mesma frase e
julgadas de ouvido.

| tag             | rótulo       | veredito         |
| --------------- | ------------ | ---------------- |
| `amusement`     | divertida    | **aprovada**     |
| `anger`         | raiva        | **aprovada**     |
| `contemplation` | contemplação | **aprovada**     |
| `longing`       | saudade      | **aprovada**     |
| `shame`         | vergonha     | **aprovada**     |
| `fear`          | medo         | **reprovada**    |
| `relief`        | alívio       | **reprovada**    |
| `awe`           | assombro     | não avaliado     |
| `bitterness`    | amargura     | não avaliado     |
| `sadness`       | tristeza     | não avaliado     |
| as outras 11    | —            | não sintetizadas |

`fear` reprovar é a perda mais séria: medo é registro frequente em ficção. Onde
a passada precisar de medo no Higgs, o caminho é combinar prosódia e pontuação
em vez da tag, e marcar o segmento para reescuta.

Cada tag custa caracteres cobrados pela API — a marcação somou 17,6% acima do
texto puro no benchmark. Vale usá-la onde muda a leitura, não por higiene.

## Kokoro — presets de emoção

O modelo não tem entrada de emoção. Cada preset é uma mistura ponderada de
tensores de estilo, mais velocidade e ganho.

| preset                               | veredito                                     |
| ------------------------------------ | -------------------------------------------- |
| `neutro`, `medo`, `raiva`, `ternura` | **aprovados**                                |
| `sussurro`, `solene`                 | provisórios: reconhecíveis, não convincentes |
| `ironia`, `urgente`                  | **reprovados**, fora do backend              |

Note a inversão em relação ao Higgs: `medo` funciona no Kokoro e falha no
Higgs. Não existe vocabulário comum entre os dois — cada passada é sua.

## Kokoro — o que não funciona

Duas coisas foram testadas e não servem, e estão aqui para ninguém tentar de
novo:

- **Tag deixada no texto.** O modelo pronuncia a marcação. `*sussurrando*` sai
  como "asterisco sussurrando asterisco". Emoção só funciona se o pipeline
  remover a tag antes de sintetizar.
- **Sobrescrita de fonema `[palavra](/ipa/)`.** É recurso do misaki em inglês;
  sob fonemização portuguesa a notação é lida em voz alta. A leitura **sem**
  override saiu melhor. Pronúncia de nome próprio se corrige reescrevendo o
  nome no texto.

## Kokoro — fatiamento

Ler um parágrafo numa única chamada foi reprovado; fatiar por oração
(`(?<=[.;])\s+`) foi aprovado, com a mesma voz e o mesmo texto. É o default do
backend.

## Elenco

Kokoro traz três vozes em português e nenhuma infantil, então personagem jovem
precisa ser construído. O que a escuta aprovou:

| personagem | receita                                         | observação                                                                     |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Harry      | `pm_alex` 60% + `bm_fable` 40%, velocidade 1,12 | base masculina portuguesa carrega o sotaque, o britânico leve levanta o timbre |
| narrador   | não decidido                                    | —                                                                              |
| McGonagall | não decidido                                    | —                                                                              |

O caminho que **não** funciona para Harry: construir sobre base feminina. Uma
rodada inteira de catorze candidatos sobre `pf_dora` e vozes femininas
estrangeiras foi reprovada por inteiro. Menino se aproxima de voz masculina
leve, não de voz feminina grave.

## VoxCPM2

Não avaliado ainda. O controle dele é um parêntese em linguagem natural
prefixando o texto, então a passada dele escreve prosa, não tags.
