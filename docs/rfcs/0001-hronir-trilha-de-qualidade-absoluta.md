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
(`rate_a`, `rate_b`, 1.00–5.00, resolução 0.01) são coletadas, salvas e
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

> **Invariante útil:** o `doctor` (`commands.js:1424-1438`) _deriva_ o `winner`
> de `rate_a`/`rate_b` e proíbe empate. Logo o `winner` é redundante dado o par
> de notas, e a margem `|a − b|` é sempre recuperável e consistente com o
> vencedor gravado — a Fase 2 pode assumir isso sem código defensivo.

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

### 2.4. Sinais gratuitos já presentes — e como usá-los

Os rate files do schema `stars-v1` carregam três campos que esta RFC ainda não
explora, mas que têm custo de leitura zero (estão no frontmatter já parseado):

| Campo                                     | O que já existe                                         | Uso futuro natural                                                                                               |
| ----------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `post_a.version` / `post_b.version`       | UUIDv5 derivado do conteúdo do post no momento do match | Detectar edições sem chamar `git log`: se o UUID mudou entre dois matches, o post foi editado                    |
| `evaluator_mood` / `evaluator_mood_after` | Humor do avaliador antes/depois do duelo                | Diagnóstico de calibração: avaliar se variância das notas sobe em estados de energia baixa / alta ansiedade      |
| `perspective_id`                          | Perspectiva de leitor sorteada por match                | `stars_per_perspective`: cada perspectiva tem seu próprio EWMA; detecta posts que só brilham para um leitor-tipo |

**Detecção de edição via `previousVersion` (canônico).**
O `edit-commit` já grava em cada post editado:

```yaml
previousVersion:
  uuid: "22c3fbae-..."   # UUIDv5 do conteúdo ANTES da edição
  url:  "https://github.com/…/blob/<sha>/<path>"
  timestamp: "2026-05-18T17:19:55.965Z"
  msg:  "Reorganizei a estrutura…"
```

Este campo é o sinal **semântico correto** de "o post foi intencionalmente
editado pelo fluxo Hrönir". O `stale_bonus` no active sampling usava `gitMtime`
(tempo do último commit git do arquivo), que é mais amplo — dispara em qualquer
mudança de arquivo, incluindo ajustes de frontmatter sem conteúdo novo.

**Implementado nesta PR:** `commands.js` agora usa `previousVersion.timestamp`
como âncora primária do `stale_bonus`, com `gitMtime` como fallback para posts
que nunca passaram por `edit-commit`:

```js
const prevTimestamp = postData?.previousVersion?.timestamp
  ? Date.parse(String(postData.previousVersion.timestamp)) || 0
  : 0;
const mtime = prevTimestamp > 0 ? prevTimestamp : gitMtime(c.path);
staleByKey.set(c.translationKey, mtime > lastMatch);
```

`post_a.version` nos rate files (verificação leve sem git) e os sinais de
`evaluator_mood` / `perspective_id` ficam como trabalho futuro (Fase 3 /
RFC subsequente).

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
  baixa confiança e **não** disparar flags de divergência. **Nota de
  implementação:** a constante vive hoje em `commands.js:25` e **não é
  exportada**; a Fase 1 precisa movê-la para um módulo compartilhado
  (`matches.js`) ou exportá-la para que `ranking.js` a alcance.

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
- A granularidade do percentil com N pequeno é ~`1/N`, então um `τ` fixo é
  instável. **Decisão (revisão):** na Fase 1, exibir `div` numericamente **sem
  flag dura**; calibrar `τ` depois contra os dados reais, em unidades de `1/N`
  (§8 q2).

**5.3. Integração no `ranking()` (`commands.js:778`)**

Adicionar colunas ao TSV atual (`rank key ordinal mu sigma W/N`):

```
rank  key  ordinal  mu  sigma  W/N  stars  n  flag
```

`stars` com 2 casas; `flag` ∈ {``, `freguesia-fraca`, `subnotado`,
`baixa-confianca`}. Mantém retrocompatível para quem faz parse — só **acrescenta**
colunas à direita. A seção **Ranking** do `scripts/hronir/README.md` documenta
essa saída e deve ser atualizada na mesma fase.

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
m = |a − b| / 4            // m ∈ [0.0025, 1]  (margem mínima 0.01 ⇒ m mínimo 0.0025)
weight = W_MIN + (1 − W_MIN) * m
rate([[winner],[loser]], { weights: [[weight],[weight]] })
```

Blowout (`m≈1`) move os ratings mais que um photo-finish (`m≈0`). `W_MIN` →
**questão em aberto** (§8). **Ressalva importante:** em openskill@4.1.1 a opção
`weights` modela _contribuição / partial-play_, **não** "magnitude do update";
reaproveitá-la para escalar pela margem é plausível, mas **não garante** escala
linear do delta de rating — daí a rede de segurança do golden-diff deliberado. A
alternativa `tau`/draw do OpenSkill é um **candidato sério** (não nota de
rodapé), avaliada em §8 q5 e §9.

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
  em `generateNextMatch` (`commands.js:263`): refinar o topo → preferir
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

## 8. Questões em aberto (com decisões da revisão)

> Recomendações da revisão da PR #292 incorporadas como **decisões iniciais** (o
> autor/revisor é dono do sistema); ainda revisáveis na implementação.

1. **Decaimento da EWMA → implementado:** reset quando `post_a.version` /
   `post_b.version` muda entre matches consecutivos do mesmo post — detecção
   puramente baseada nos rate files, sem git. Quando versão ausente (schema
   antigo), acumula sem reset. Qualidade é propriedade do texto _atual_; notas
   pré-edição são stale por definição.
2. **Limiar `τ` → decidido:** na Fase 1, **exibir `div` numericamente sem flag
   dura**; calibrar `τ` depois contra `.routines/hronir/`, em unidades de `1/N`
   (a granularidade do percentil é ~`1/N`, então um valor fixo é instável).
3. **`worst` absoluto vs blend → decidido:** `--absolute` **opt-in**; **não**
   mudar o default. Escolha conservadora e aditiva, coerente com o princípio de
   design (§4). Blend pode virar default depois que a trilha provar valor.
4. **`W_MIN` → leaning:** escolher de modo que um duelo de margem mínima
   (`m = 0.0025`) ainda cutuque o rating, mas um blowout domine; começar em
   ~`0.2–0.3` e validar via golden-diff.
5. **Quase-empate → decidido:** como o sistema **proíbe** empate na entrada, uma
   margem de `0.01` é decisão **deliberada** do avaliador; **weight reduzido
   honra isso melhor que coagir um draw**. Preferir weight-only a `tau`.

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

---

## Histórico de revisões

- **r1 (2026-06-09):** correções de fato e decisões nas questões em aberto após a
  revisão da PR #292 — resolução das notas corrigida de `0.25` para **`0.01`**
  (com impacto no `m` mínimo da Fase 2, `0.0025`); nota de que `MIN_APPEARANCES`
  precisa ser exportado de `commands.js:25`; invariante do `doctor` (winner
  redundante, margem sempre recuperável); ressalva sobre a semântica de `weights`
  no openskill@4.1.1; compromisso de atualizar a seção Ranking do README;
  anchor de `generateNextMatch` corrigido para `commands.js:263`.
