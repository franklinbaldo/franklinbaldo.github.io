# RFC 0002 — De-confounding de qualidade e amostragem ciente do objetivo

|                 |                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Status**      | Proposed / Implemented                                                                                |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                   |
| **Criado em**   | 2026-06-09                                                                                            |
| **Branch / PR** | `claude/hronir-fase3-deconfound` (empilhada sobre a #292)                                             |
| **Depende de**  | RFC 0001 (trilha de qualidade absoluta) — `computeAbsoluteQuality`, campos `version` nos rate files   |
| **Afeta**       | `scripts/hronir/lib/ranking.js`, `scripts/hronir/lib/commands.js`, `index.js` (leitura, sem migração) |

> Esta é a **Fase 3** esboçada no §5 da RFC 0001, agora detalhada e
> implementada. Continua o padrão: RFC + implementação na mesma PR, fase verde
> antes de prosseguir (testes + `prettier --check`).

---

## 1. Resumo

A RFC 0001 expôs a **qualidade absoluta** (EWMA das estrelas) ao lado do ordinal
do OpenSkill. Mas a estrela crua é **confundida**: um post pode ter média alta
só porque calhou de ser avaliado por um agente generoso ou sob uma perspectiva
tolerante. O sistema **injeta humor e sorteia perspectivas de propósito** — ou
seja, ele introduz esses confundidores deliberadamente.

Esta RFC introduz três coisas, todas usando sinais **já gravados** nos rate
files (`agent_id`, `perspective_id`) e a trilha de versão da RFC 0001:

1. **De-confounding por mínimos quadrados (ridge):** separa a qualidade do post
   do viés do avaliador e do efeito da perspectiva.
2. **Stars por perspectiva:** uma trilha EWMA independente por perspectiva.
3. **Amostragem ciente do objetivo (opt-in):** orienta a geração de pares para
   refinar o topo ou caçar o pior.

Tudo é exposto num comando novo de **leitura pura**, `diagnose`. Nada muda o
ranking existente nem o schema.

---

## 2. Motivação

### 2.1. A estrela crua é confundida

Cada observação de estrela é, na verdade:

```
rate = qualidade_do_post + viés_do_avaliador + efeito_da_perspectiva + ruído
```

A trilha absoluta da RFC 0001 reporta a **média** (EWMA) dessas observações, o
que mistura os quatro termos. Dois posts igualmente bons divergem na trilha se
um pegou avaliadores/perspectivas mais generosos. Como o sorteio de perspectiva
é aleatório e o humor é injetado, esse confundimento **não é** ruído que some no
volume — é estrutural.

### 2.2. Os confundidores já estão nos dados

Todo rate file `stars-v1` carrega `agent_id` e `perspective_id`. Dentro de um
clash, ambos os lados compartilham o mesmo avaliador e a mesma perspectiva —
por isso a **diferença** `a − b` cancela esses termos (e vai pro OpenSkill),
enquanto a **soma**/nível os carrega. Modelar o nível com esses fatores como
regressores os torna **separáveis**.

---

## 3. O modelo de de-confounding

Cada lado avaliado de cada clash é uma observação. Ajustamos:

```
rate_obs = μ + q[post] + α[agent] + π[perspective] + ε
```

por **mínimos quadrados com regularização ridge**:

```
minimize  Σ ε²  +  λ (Σ q² + Σ α² + Σ π²)
```

- **μ** (intercepto) **não** é penalizado → absorve a média global (~3.27 nos
  dados atuais).
- **q[post]** é o desvio de qualidade do post, líquido de quem avaliou e sob
  qual perspectiva. A **qualidade de-confundida** reportada é `μ + q`.
- **α[agent]** é o viés do avaliador; **π[perspective]** o efeito da
  perspectiva. Ambos encolhem para 0 sob ridge.

### Por que ridge

O intercepto + dummies completos de cada fator são colineares (cada conjunto de
dummies soma a coluna de 1s do intercepto). Sem regularização o sistema é
singular. O ridge:

1. garante invertibilidade de `XᵀX + λI`;
2. encolhe efeitos de níveis com pouca evidência (um post visto 3× é amaciado
   ~25% com `λ = 1`), o que é exatamente o comportamento desejado para
   amostras finas;
3. mantém os efeitos **identificáveis** apesar da colinearidade dummy/intercepto.

`DECONFOUND_RIDGE = 1.0` é o default (constante nomeada, ajustável).

### Implementação

- `_solveLinear(A, b)` — eliminação de Gauss com pivoteamento parcial. As
  equações normais são montadas **direto** (`XᵀX`, `Xᵀy`), sem materializar a
  matriz de design `(obs × params)`. Dimensão típica: `1 + P + A + K ≈ 60`,
  trivial.
- `_computeDeconfoundedQuality(raw, ridge)` — pura, testável, retorna
  `{ quality, agentBias, perspectiveBias, intercept }`.

### Resultado nos dados reais

O modelo recupera exatamente o que o design previa:

| Perspectiva               | π (viés)  | leitura                           |
| ------------------------- | --------- | --------------------------------- |
| `internet-native`         | **+0.18** | tolerante, paga digressão         |
| `curious-outsider`        | **+0.17** | generoso (pedagógico)             |
| …                         | …         | …                                 |
| `skeptical-specialist`    | **−0.03** | adversarial (caça alegação fraca) |
| `comedy-carries-argument` | **−0.11** | exigente (piada como alavanca)    |
| `applied-thinker`         | **−0.15** | o mais severo                     |

E posts **subnotados** emergem com `gap = de-confundido − cru` positivo:
`three-hammers` (+0.70), `pierre-menard` (+0.38), `conservation-law` (+0.35) —
melhores em absoluto do que as estrelas cruas sugerem, porque pegaram plateias
duras.

---

## 4. Stars por perspectiva

`_computePerPerspectiveQuality(raw)` espelha a EWMA da RFC 0001, mas em baldes
por `perspective_id` (com o mesmo reset-on-edit keyed por `path`). Responde
"qual post lidera **para cada tipo de leitor**" — um post pode brilhar para o
`internet-native` e fracassar para o `skeptical-specialist`. Útil pra detectar
posts de nicho vs. consensuais.

---

## 5. Amostragem ciente do objetivo (opt-in)

Hoje `generateNextMatch` é agnóstico ao objetivo: maximiza informação
(incerteza do resultado + sigma + staleness). A Fase 3 adiciona um **termo
opcional** ao score, controlado por env var:

```
HRONIR_OBJECTIVE=refine-top   # prefere pares de nível alto (refinar o topo)
HRONIR_OBJECTIVE=hunt-worst   # prefere pares de nível baixo (caçar o pior)
# (não setado)                # comportamento idêntico ao atual
```

```
score += OBJECTIVE_WEIGHT * sign * (level_a + level_b)
```

- `level` = EWMA absoluta; posts sem estrelas ainda recebem 3.0 neutro (nem
  caçados nem evitados).
- `OBJECTIVE_WEIGHT = 0.15` é deliberadamente pequeno: **inclina empates** sem
  dominar os termos de informação (sigma ~0.5–2, stale_bonus 3.0).
- **Default-off** respeita o princípio conservador da RFC 0001: nada muda sem
  opt-in explícito.

Env var (e não flag) preserva o contrato não-interativo do CLI e mantém o
sorteio dentro do fluxo `continue` sem nova plumbing de sessão.

---

## 6. O comando `diagnose`

`npm run hronir:diagnose` — **somente leitura**, nunca muda estado. Imprime:

1. Qualidade de-confundida por post (`deconf`, `raw`, `gap`, `n`), ordenada por
   `deconf` DESC; posts com `n < MIN_APPEARANCES` marcados `(baixa-confiança)`.
2. Viés de avaliador (`α`) ordenado.
3. Viés de perspectiva (`π`) ordenado.
4. Líder por perspectiva (stars EWMA dentro de cada perspectiva).

Não entra no `ranking` (que continua estável e retrocompatível); é um
diagnóstico separado pra **calibração**, não pra ordenar edição.

---

## 7. Compatibilidade

- **Schema inalterado.** `agent_id`/`perspective_id` já existem em todo
  `stars-v1`.
- **Sem migração.** Tudo é derivado por leitura.
- **`ranking` intocado.** Nenhum número existente muda. `diagnose` é aditivo.
- **Amostragem** só muda com env var explícita; default idêntico.

---

## 8. Testes

`node:test`, funções puras (sem tocar disco):

- `_solveLinear`: sistemas 2×2 e 3×3 conhecidos (inclui troca de pivô).
- `_computeDeconfoundedQuality`: design cruzado desbalanceado — detecta o agente
  generoso e **encolhe** o gap espúrio entre dois posts de qualidade igual;
  caso vazio (sem estrelas) retorna estruturas vazias.
- `_computePerPerspectiveQuality`: baldes separados por perspectiva; ignora
  matches sem `perspective_id`.

Total da branch: **20/20 verdes** (`npm test`).

---

## 9. Questões em aberto

1. **`DECONFOUND_RIDGE` (λ):** começa em 1.0. Calibrável contra os dados; valores
   altos achatam tudo, baixos arriscam instabilidade em fatores esparsos.
2. **Humor como fator:** `evaluator_mood` é texto livre PT (quase único por
   sessão), logo **não** é um fator categórico identificável. Fica de fora do
   modelo; `agent_id` captura o viés sistemático do avaliador, e o humor
   residual entra em `ε`. Bucketizar humor por heurística de sentimento é
   trabalho futuro, não desta RFC.
3. **Objetivo no fluxo:** hoje via env var. Se virar uso recorrente, considerar
   persistir o objetivo na sessão (`init --objective`).

---

## 10. Alternativas consideradas

- **Modelo bayesiano hierárquico completo.** Mais rigoroso (incerteza por
  efeito), porém pesado e com dependência de amostragem. O ridge-LSQ entrega
  90% do valor com álgebra linear pura e determinística.
- **Subtrair a média do avaliador/perspectiva (centragem simples).** Não
  resolve o confundimento cruzado (um avaliador que só viu posts bons teria
  média alta atribuída a "generosidade"). O LSQ separa os efeitos
  simultaneamente.
- **Flag em vez de env var pra objetivo.** Flag exigiria carregar o objetivo na
  máquina de estados da sessão (`continue` não recebe flags hoje). Env var é
  mais leve e reversível.

---

## Histórico de revisões

- **r0** (2026-06-09): versão inicial + implementação (de-confounding,
  stars-por-perspectiva, amostragem objetiva, comando `diagnose`).
