# RFC 0001 — Trilha de qualidade absoluta no Hrönir

|                 |                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Status**      | Draft / Proposed                                                                                      |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                   |
| **Criado em**   | 2026-06-09                                                                                            |
| **Branch / PR** | `claude/friendly-archimedes-clsv9r`                                                                   |
| **Afeta**       | `scripts/hronir/lib/ranking.js`, `scripts/hronir/lib/commands.js`, rate files (leitura, sem migração) |

> Este documento é a **etapa 1** da PR: primeiro o RFC, depois a implementação
> incremental na mesma branch, fase a fase, seguindo este plano. Cada fase só
> começa depois que a anterior estiver verde (testes + `prettier --check`).

---

## 1. Resumo

Hoje o ranking do Hrönir é **puramente relativo**: cada clash é reduzido a um
único bit (`winner = a | b`) e alimentado ao OpenSkill. As notas em estrelas
(`rate_a`, `rate_b`, 1.00–5.00, resolução 0.25) são coletadas, salvas e
validadas, mas **nunca entram em nenhuma métrica de ranqueamento ou
amostragem**. Estamos jogando fora dois canais de informação independentes:

- a **margem** `|a − b|` (quão decisivo foi o duelo), e
- o **nível** `a + b` (quão bons os dois posts são em termos absolutos).

Esta proposta introduz uma **trilha de qualidade absoluta** paralela ao
OpenSkill, que consome o eixo de nível, e — numa segunda fase — torna o update
do OpenSkill **ciente da margem**. O objetivo é parar de descartar sinal sem
desestabilizar o que já funciona.

---

## 2. Motivação

### 2.1. O que é descartado hoje

No `decide`, o vencedor colapsa as notas em um bit:

```js
// scripts/hronir/lib/commands.js:728
const winner = parsedRateA > parsedRateB ? "a" : "b";
```

As notas são persistidas (`commands.js:752-753`), mas `computeRatings`
(`ranking.js:58-75`) lê **apenas** `data.winner`. Consequência: um massacre
**4.99 × 1.01** atualiza o ranking de forma **idêntica** a um empate técnico
**3.51 × 3.49**. Os únicos outros usos de `rate_a`/`rate_b` no código são
**exibição** no fluxo `edit-worst` (`commands.js:835-836, 924-925`) e
**validação** no `doctor` (`commands.js:1412-1436`) — nenhum deles é sinal de
ranking.

### 2.2. Por que o OpenSkill, sozinho, não basta

O OpenSkill é **scale-free**: ele só enxerga o sinal de `a − b`. Isso implica
duas cegueiras estruturais:

1. **Margem** (`|a − b|`): descartada.
2. **Nível** (`a + b`): invisível _por construção_ — o OpenSkill não tem âncora
   absoluta. O ranking inteiro poderia deslizar para cima ou para baixo sem que
   o modelo percebesse. O nível é a **única** coisa capaz de amarrar o ranking
   relativo ao significado externo da escala 1–5.

### 2.3. A decomposição em dois eixos

Cada clash entrega um par `(a, b)` que pode ser "girado" em duas coordenadas
ortogonais:

| Coordenada    | Fórmula     | Significado                        | Destino                    |
| ------------- | ----------- | ---------------------------------- | -------------------------- |
| **Diferença** | `d = a − b` | vencedor (sinal) + margem (módulo) | OpenSkill (eixo relativo)  |
| **Soma**      | `s = a + b` | nível absoluto do duelo            | Trilha absoluta (este RFC) |

O `(5−a)+(5−b) = 10 − s` é exatamente o eixo de nível, invertido ("déficit
conjunto" / "folga até o teto"). Os dois eixos são independentes:

|                 | margem alta                         | margem baixa                             |
| --------------- | ----------------------------------- | ---------------------------------------- |
| **nível alto**  | `5.0 × 3.0` ótimo bate decente      | `4.75 × 4.5` dois ótimos, foto-finish    |
| **nível baixo** | `2.5 × 1.0` medíocre esmaga péssimo | `2.0 × 1.75` dois ruins, indistinguíveis |

---

## 3. Objetivos e não-objetivos

### Objetivos

- Expor, por post, uma **qualidade absoluta** derivada das estrelas, ao lado do
  ordinal do OpenSkill.
- Detectar divergência **"freguesia fraca"** (alto no relativo, baixo no
  absoluto) e **"subnotado"** (o inverso).
- Tornar `worst`/`edit-worst` capaz de mirar qualidade absoluta, não só posição
  relativa.
- Fazer o update do OpenSkill respeitar a **margem** (Fase 2).
- Travar o comportamento atual com **golden tests** antes de mexer na
  matemática.

### Não-objetivos (por ora)

- Não substituir o OpenSkill como motor relativo.
- Não modelar formalmente viés de avaliador/perspectiva nesta PR (fica esboçado
  como trabalho futuro — Fase 3).
- Não alterar o schema dos rate files nem exigir migração.

---

## 4. Princípio de design

> **Não enfiar o nível dentro do OpenSkill.** Como ele é intrinsecamente
> relativo, empurrar um valor absoluto para dentro do motor briga com o modelo.
> O eixo absoluto vira uma **trilha paralela** por post; o eixo relativo
> (vencedor + margem) continua no OpenSkill. Dois eixos, duas perguntas
> distintas: _"quem é melhor que quem"_ vs _"quão bom em absoluto"_.

---

## 5. Plano de implementação (faseado)

### Fase 0 — Golden tests (pré-requisito, não muda comportamento)

Hoje não há _nenhum_ teste no repositório, e `ranking.js` é justamente a parte
sensível (sensível à ordem do OpenSkill, com determinismo cross-ambiente
documentado em `ranking.js:18-23,37-45`). Antes de tocar na matemática:

- Adotar o runner embutido **`node:test`** (zero dependências novas).
- Adicionar script `"test": "node --test"` ao `package.json`.
- Criar fixtures de rate files sintéticos em
  `scripts/hronir/lib/__fixtures__/` e um snapshot do ranking esperado.
- Cobrir: determinismo (mesma entrada → mesma saída), ordenação por `run_at`,
  empate de `run_at` desempatado por `match_index`/filename, `override`,
  filtragem de `winner=TODO`.

**Critério de aceite:** `npm test` verde, capturando o comportamento _atual_
exatamente como está.

### Fase 1 — Trilha de qualidade absoluta (aditiva, segura)

Núcleo da proposta. Puramente aditivo: não altera nenhum número do OpenSkill.

**5.1. Nova função `computeAbsoluteQuality()` em `ranking.js`**

Espelha o loop de `computeRatings` (mesma ordenação por `run_at`), mas agrega as
estrelas que cada post **recebeu** (não importa se ganhou ou perdeu):

```
para cada post key:
  colete (run_at, nota_propria) de todo clash em que key aparece
    nota_propria = rate_a se key == post_a, senão rate_b
  ordene por run_at
  Q[key]   = EWMA das notas (decaimento por recência)
  n[key]   = nº de avaliações
  raw[key] = média simples (para diagnóstico)
retorne Map<key, { stars: Q, n, rawStars }>
```

- **EWMA** (e não média simples) porque posts são editados; a lógica de
  staleness já existe (`STALE_BONUS`, `gitMtime`). Avaliações recentes devem
  dominar. Parâmetro de decaimento → **questão em aberto** (§8).
- A trilha é significativa só com amostra suficiente: reaproveitar
  `MIN_APPEARANCES = 3` como piso de confiança. Abaixo disso, exibir mas marcar
  baixa confiança e **não** disparar flags de divergência.

**5.2. Métrica de divergência (freguesia fraca / subnotado)**

Comparar a posição do post nos dois rankings, via percentil (robusto a N):

```
p_ord  = percentil do post por ordinal   (1.0 = melhor)
p_star = percentil do post por stars      (1.0 = melhor)
div    = p_ord − p_star
```

- `div > +τ` → **⚠ freguesia fraca** (sobe no relativo além do que a qualidade
  absoluta justifica → provavelmente pegou oponentes fracos).
- `div < −τ` → **↑ subnotado** (melhor em absoluto do que o cartel de duelos
  sugere → azar de chaveamento).
- `τ` default sugerido `0.25` → **questão em aberto** (§8).

**5.3. Integração no `ranking()` (`commands.js:778`)**

Adicionar colunas ao TSV atual (`rank key ordinal mu sigma W/N`):

```
rank  key  ordinal  mu  sigma  W/N  stars  n  flag
```

`stars` com 2 casas; `flag` ∈ {``, `freguesia-fraca`, `subnotado`,
`baixa-confianca`}. Mantém retrocompatível para quem faz parse — só **acrescenta**
colunas à direita.

**5.4. `worst()` / `edit-worst` cientes do absoluto (`commands.js:792`)**

Hoje `worst()` pega o último por ordinal entre `appearances >= 3`. Um post pode
estar ordinalmente baixo só por ter pego oponentes duros. Proposta:

- Adicionar flag `--absolute` que seleciona o pior por **stars** em vez de
  ordinal; e/ou
- Um modo combinado (blend) — **questão em aberto** se vira o default (§8).

**Critério de aceite:** novos testes da Fase 1 verdes; `ranking` mostra as
colunas; nenhum número de OpenSkill mudou; `prettier --check` limpo.

### Fase 2 — Update do OpenSkill ciente da margem (eixo relativo)

Usar `|a − b|` para escalar a magnitude do update. Normalizando pela margem
máxima (4, pois notas ∈ [1,5]):

```
m = |a − b| / 4            // m ∈ (0, 1]
weight = W_MIN + (1 − W_MIN) * m
rate([[winner],[loser]], { weights: [[weight],[weight]] })
```

Blowout (`m≈1`) move os ratings mais que um photo-finish (`m≈0`). `W_MIN` →
**questão em aberto** (§8). Alternativa: tratar margens minúsculas como quase-empate
via `tau`/draw do OpenSkill (avaliar em §9).

**Reprodutibilidade:** os ratings são **derivados** (recomputados dos rate files
a cada chamada), então não há estado salvo para migrar — mas os números **vão
mudar** no replay, e isso é o ponto. Introduzir uma constante
`RANKING_MODEL_VERSION` e **atualizar os golden tests deliberadamente** no mesmo
commit, com o diff de ranking anexado à descrição da PR.

**Critério de aceite:** golden tests atualizados de forma consciente; diff de
ranking documentado; `doctor` continua válido.

### Fase 3 — Futuro (fora desta PR, esboçado)

- **De-confundir nível por mínimos quadrados:** `rate ≈ qualidade_post +
viés_avaliador/humor + efeito_perspectiva + ruído`. A soma `a+b` por clash é o
  agregado que esse modelo consome; é o que torna o viés de avaliador
  _separável_. O sistema **injeta humor de propósito** para descalibrar o
  avaliador, então a média crua carrega esse ruído — a versão rigorosa o remove.
- **Amostragem ciente do objetivo:** nível previsto (do histórico) orienta o par
  em `generateNextMatch` (`commands.js:300-325`): refinar o topo → preferir
  nível alto; caçar o pior → preferir nível baixo. Hoje o sampling é agnóstico
  ao objetivo.

---

## 6. Compatibilidade e migração

- **Schema dos rate files:** inalterado. `rate_a`/`rate_b` já existem em todo
  arquivo produzido pelo schema `stars-v1`.
- **Sem migração de dados.** A Fase 1 só **lê** o que já está salvo.
- **Parsers do `ranking`:** só ganham colunas à direita.
- **Fase 2** muda os números de ranking no replay (esperado, versionado,
  documentado). Fases 0 e 1 não mudam nenhum número existente.

---

## 7. Estratégia de testes

- Runner: **`node:test`** embutido (`node --test`), sem dependência nova.
- **Golden** (Fase 0): fixtures → snapshot do ranking atual.
- **Unitários** (Fase 1): EWMA com sequência conhecida; piso de confiança
  `MIN_APPEARANCES`; sinal correto da divergência em casos construídos
  (freguesia fraca vs subnotado).
- **Determinismo:** a mesma entrada produz a mesma saída em qualquer ambiente
  (mesma disciplina já aplicada a `computeRatings`).
- CI: manter `prettier --check .` verde; adicionar `npm test` ao fluxo.

---

## 8. Questões em aberto

1. **Decaimento da EWMA:** meia-vida por nº de aparições? por tempo? ou
   **reset-on-edit** usando o `gitMtime` que já detectamos? (recomendação
   inicial: reset/forte decaimento no edit, casando com a staleness existente).
2. **Limiar de divergência `τ`:** `0.25` é chute inicial; calibrar com os dados
   reais em `.routines/hronir/`.
3. **`worst` absoluto vs relativo:** `--absolute` opt-in, ou blend vira default?
4. **`W_MIN` da Fase 2:** quão pequeno um photo-finish pode mexer no rating?
5. **Quase-empate:** margem mínima (0.25) deve virar draw via `tau`, ou só
   weight reduzido?

---

## 9. Alternativas consideradas

- **Enfiar o nível no próprio OpenSkill** (ex.: prior por post a partir das
  estrelas). Rejeitado: briga com a natureza relativa do motor e contamina o
  determinismo. Trilha paralela é mais limpa e auditável.
- **Média simples em vez de EWMA.** Mais simples, mas ignora edições; um post
  reescrito carregaria notas antigas para sempre. EWMA (ou reset-on-edit) casa
  com a semântica de staleness já existente.
- **Modelo Bayesiano completo de qualidade absoluta** (item da Fase 3). Poderoso,
  porém pesado para esta PR; entra depois que a trilha simples provar valor.

---

## 10. Plano de execução da PR

1. **Commit 1 (este):** RFC `0001`.
2. Após revisão do RFC: **Fase 0** (testes golden) → **Fase 1** (trilha
   absoluta) → **Fase 2** (margem), cada fase em commit próprio, com testes
   verdes e `prettier --check` limpo.
3. Fase 3 sai do escopo desta PR e vira issue/RFC futuro.

Merge com **merge commit** (não squash), conforme `CLAUDE.md`.
