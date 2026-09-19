# RFC 0019 — Segmento de narração como conceito OKF, com marcação condicional por renderer

|                 |                                                                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Proposta                                                                                                                                                                                                                                  |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                       |
| **Criado em**   | 2026-08-31                                                                                                                                                                                                                                |
| **Branch / PR** | `feat/audiobook-narration-segment-okf`                                                                                                                                                                                                    |
| **Depende de**  | RFC 0014 (adoção do OKF), o control plane de mídia (#1596), o backend Breeze (#1607) e o benchmark pt-BR executado em `docs/okf/audiobook/benchmarks/pt-br-audiobook-v1-breeze.md`                                                        |
| **Afeta**       | `data/audiobooks/**` (novo layout de narração), `src/audiobook/plan.js`, `src/audiobook/validate.js`, `scripts/audiobook/worker.py`, `docs/okf/audiobook/**`, e o contrato que o agente editorial recorrente segue ao avançar um segmento |

---

## 1. Motivação

A narração de um capítulo vive hoje num único Markdown, com cada segmento
delimitado por um comentário HTML contendo JSON numa linha só:

```js
/<!--\s*tts:\s*(\{[^\n]*\})\s*-->\s*([\s\S]*?)(?=<!--\s*tts:|$)/g
```

Esse formato serviu para provar a pipeline, mas três pressões o quebraram ao
mesmo tempo, e nenhuma delas é hipotética — todas apareceram executando.

**Primeira: cada motor de TTS tem uma notação própria, intercalada com as
palavras.** O benchmark pt-BR mediu cinco backends e nenhum aceita instrução
fora do texto. Higgs usa tags inline (`<|emotion:fear|>`), Kokoro usa
sobrescrita de fonema com sintaxe de link (`[nome](/ipa/)`), VoxCPM2 usa um
parêntese que prefixa a frase. Não é configuração que cabe em frontmatter: é
marcação entremeada ao conteúdo, e cada renderer quer a sua.

**Segunda: um segmento editorial frequentemente tem mais de um locutor.** Ao
avançar `hpmor-001-s0021`, o agente editorial registrou que o parágrafo alterna
fala de personagem com atribuição de narrador, e — corretamente — recusou-se a
fingir que o schema resolvia isso, marcando `voice_partition:
mixed-dialogue-pending`. Em ficção isso não é exceção: quase todo parágrafo de
diálogo tem atribuição. Deixar `mixed` pendente é deixar a maior parte do livro
pendente.

**Terceira: o projeto vai produzir mais de uma renderização da mesma obra.** A
decisão é duas versões pt-BR (Higgs e VoxCPM2) e uma versão em inglês (Breeze,
que reprovou em português com WER mediana 0,78 e acertou WER 0,00 em inglês). O
formato atual tem um único corpo de texto e nenhum lugar onde duas renderizações
do mesmo segmento possam divergir de forma controlada.

Além disso, o parser é regex sobre comentário HTML: sem schema, sem validação
cruzada, sem lineage. O repositório já tem um validador relacional de bundles
OKF (`okf-parser`), e não usá-lo aqui é desperdício.

## 2. Decisão

Um segmento de narração passa a ser **um conceito OKF: um arquivo Markdown, com
frontmatter YAML e corpo**. O frontmatter carrega identidade, lineage, intenção
editorial e configuração por renderer; o corpo carrega o texto e a marcação
condicional.

```text
data/audiobooks/hpmor/narration/001/s0021.md
```

### 2.1 O tipo `Narration Segment`

```markdown
---
type: Narration Segment
segment_id: hpmor-001-s0021
work_id: hpmor
chapter_id: hpmor-001
order: 21
speaker: petunia
lang: pt-BR
derived_from: ../../translation/001.md#hpmor-001-s0021
direction:
  emotion: hesitant resumption into grief
  pace: measured
---

Corpo do segmento.
```

`type` é o único campo obrigatório pelo OKF; os demais são obrigatórios por
regra de perfil, verificada pelo `okf-parser` (§4).

`direction` continua **provider-neutral** e passa a ser explicitamente
**documentação e briefing**, não entrada de máquina — ver §3.

### 2.2 Marcação condicional por renderer

Texto fora de tag vai para todos os renderers. Texto dentro de uma tag de
renderer vai só para aquele renderer.

```markdown
<higgs><|emotion:fear|></higgs><kokoro>[medo]</kokoro>Ela ouviu o barulho outra vez.<kokoro>[/medo]</kokoro>
```

O vocabulário é **fechado**: `kokoro`, `higgs`, `voxcpm2`, `breeze`. Um nome
desconhecido é erro normativo, não texto ignorado — sem isso, um `<kokora>` com
erro de digitação faria o trecho desaparecer silenciosamente de todas as
renderizações.

### 2.3 Trechos por locutor

```markdown
<speaker:petunia>Fala do personagem.</speaker:petunia><speaker:narrator>Atribuição narrativa.</speaker:narrator><speaker:petunia>Continuação da fala.</speaker:petunia>
```

Fora de qualquer tag vale o `speaker` do frontmatter, então segmentos de um
locutor só continuam com corpo limpo.

Isso **substitui `voice_partition: mixed-dialogue-pending`**. O campo deixa de
ser marcador manual e vira derivado: `single` quando não há tags de locutor,
`mixed` quando há. O agente editorial deixa de precisar decidi-lo.

O worker renderiza cada trecho com a voz do seu locutor e concatena. O mecanismo
já foi implementado e exercitado no experimento de emoções do Kokoro: trocar de
preset e trocar de locutor são a mesma operação de spans.

### 2.4 `input_digest` por renderer

O digest deixa de ser função do segmento e passa a ser função de
`(segment_id, renderer)`, calculado sobre o **texto já resolvido para aquele
renderer** — marcação condicional aplicada, tags do renderer preservadas, tags
dos outros removidas — mais a partição de locutores e a configuração de voz.

Sem isso, mexer numa tag do Higgs invalidaria o cache do Kokoro e obrigaria a
ressintetizar dezenas de horas de áudio à toa.

### 2.5 Gate por renderer

`audio_contract_ready` genérico dá lugar a um gate por renderer:

```yaml
gates:
  narration_ready: true
  kokoro_pass_ready: true
  higgs_pass_ready: false
```

O workflow de mídia exige o gate **do renderer que vai executar**, não um
genérico. `ready_for_audio` continua sendo a conjunção dos gates editoriais e
não inclui os gates de renderer, que são condição de execução, não de prontidão
editorial.

## 3. Não haverá compilador `direction → tags`

Uma tabela que traduzisse `direction` em tags automaticamente seria _lookup_.
Escolher entre `<|emotion:bitterness|>` e `<|emotion:sadness|>` para uma frase é
**julgamento**: depende do que veio antes, de quem fala e do que a cena faz. A
camada editorial deste projeto já é um agente, não um script, e é o lugar certo
para esse julgamento.

Portanto: **uma passada manual por modelo**, feita pelo agente editorial, com
`direction` servindo de briefing. A tabela `direction → render` existe como
**guia de estilo** em `docs/okf/audiobook/`, não como código.

O custo aceito conscientemente: acrescentar um quarto renderer deixa de ser
"uma linha na tabela" e passa a ser refazer a passada em todos os segmentos.
Com três renderers decididos, o custo é limitado.

## 4. Validação no `okf-parser`

Regras normativas de perfil, expressas como consultas relacionais:

| regra                     | descrição                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------- |
| identidade                | `segment_id` único no bundle e igual ao nome do arquivo                               |
| ordem                     | `order` contíguo por capítulo, sem buracos nem repetição                              |
| locutor                   | `speaker` do frontmatter e de todo `<speaker:…>` existe em `voices.yaml`              |
| renderer conhecido        | toda tag de renderer pertence ao vocabulário fechado                                  |
| lineage                   | `derived_from` aponta para um segmento de tradução existente com o mesmo `segment_id` |
| **equivalência de texto** | a projeção em texto puro é idêntica entre todos os renderers                          |

A última é a mais importante e a menos óbvia. Com passadas manuais
independentes por modelo, nada impede que alguém escreva palavras diferentes em
`<kokoro>` e `<higgs>`. Nesse caso deixam de existir duas renderizações do mesmo
livro e passam a existir duas edições, e a comparação perde sentido.

Escape explícito: um segmento pode declarar `text_varies: true` com
justificativa quando a divergência for necessária por limitação fonética de um
motor. Sem a declaração, o CI barra.

## 5. Custo e contrapartida

Um arquivo por segmento significa cerca de 125 arquivos por capítulo e algo em
torno de 15 mil no HPMOR inteiro. Git lida bem com isso; o build do Astro pode
sentir, e deve ser medido antes de comprometer.

Mitigação prevista: os segmentos ficam **fora** de `src/content/`, já que só a
mídia final e as páginas de podcast entram no site, e a validação roda por
capítulo no CI, não sobre o bundle inteiro a cada push.

## 6. Implementação faseada

Cada fase verde antes da próxima, na mesma branch.

1. **Tipo e leitura.** Definir o conceito OKF em `docs/okf/audiobook/`, escrever
   o leitor de segmentos e migrar `hpmor-001` do formato de comentário para
   arquivos, preservando todos os `segment_id`.
2. **Marcação condicional.** Resolver texto por renderer, digest por renderer, e
   a regra de equivalência de texto.
3. **Trechos por locutor.** Renderização em spans e concatenação com
   normalização de loudness, derivando `voice_partition`.
4. **Validação.** Regras do `okf-parser` no CI, substituindo a validação ad-hoc
   de narração.
5. **Gates por renderer** e ajuste dos workflows de mídia.

A fase 1 é a única que toca conteúdo editorial existente, e é puramente
mecânica: o texto e os identificadores não mudam.

## 7. Alternativas consideradas

**Manter o formato de comentário e acrescentar campos.** Rejeitada: o parser
continuaria sendo regex sobre comentário HTML, sem schema nem validação cruzada,
e o JSON de uma linha só não comporta configuração por renderer.

**Um arquivo por capítulo com lista de segmentos no frontmatter.** Mantém a
contagem de arquivos baixa e o texto legível em sequência, mas perde o digest
por arquivo — que é o que torna cache e ressíntese um diff de git — e coloca
texto narrativo dentro de YAML.

**Dividir `s0021` em cinco segmentos.** Resolveria a alternância de locutor sem
schema novo, ao custo de fragmentar uma unidade editorial em pedaços de duas
palavras ("disse ela") e de renumerar segmentos já estabilizados. A partição por
trechos preserva o alinhamento entre original, tradução e narração.

## 8. História de revisões

| revisão | data       | mudança                                                              |
| ------- | ---------- | -------------------------------------------------------------------- |
| r0      | 2026-08-31 | Proposta inicial, derivada do benchmark pt-BR e do avanço de `s0021` |
