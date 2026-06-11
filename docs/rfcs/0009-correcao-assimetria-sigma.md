# RFC 0009 — Correção da assimetria sigma no margin weighting

|                 |                                                          |
| --------------- | -------------------------------------------------------- |
| **Status**      | Proposed                                                 |
| **Autor**       | Franklin Baldo (proposta assistida)                      |
| **Criado em**   | 2026-06-11                                               |
| **Branch / PR** | —                                                        |
| **Depende de**  | RFC 0001 (margin weighting, `RANKING_MODEL_VERSION = 2`) |
| **Afeta**       | `src/hronir/ranking.ts`, testes, `RANKING_MODEL_VERSION` |

---

## 1. Resumo

A RFC 0001 introduziu o **margin weighting**: a atualização do OpenSkill é
ponderada pela margem de estrelas, de modo que um blowout (5.0 vs 1.0) move
o mu mais do que um photo-finish (3.01 vs 3.00). A implementação atual aplica
o `weight` **só ao mu**, deixando o sigma receber a atualização completa do
OpenSkill:

```typescript
// ranking.ts:125–132 — estado atual
ratings.set(winnerKey, {
  mu: winnerRating.mu + weight * (newWinner.mu - winnerRating.mu),
  sigma: newWinner.sigma, // ← nunca ponderado
});
```

Esta assimetria cria dois efeitos adversos:

1. **Confiança falsa**: posts com muitas partidas apertadas acumulam sigma
   baixo (alta certeza) sem que o mu tenha se afastado do prior de 25.
2. **Não-monotonicidade do ordinal**: com o mesmo win-rate e número de
   partidas, uma margem **média** (~2 estrelas, weight ≈ 0.5) produz um
   ordinal mais alto do que uma margem de **blowout** (4 estrelas, weight =
   1.0) — o inverso do comportamento desejado.

Esta RFC propõe ponderar o sigma pelo mesmo `weight`, tornando os dois eixos
da atualização consistentes.

---

## 2. Motivação

### 2.1. O bug: sigma ignorando o weight

O ordinal do OpenSkill é `μ − 3σ`. Com o weight aplicado só ao mu:

- **Blowout** (weight = 1.0): mu sobe bastante, sigma cai normalmente.
- **Photo-finish** (weight ≈ 0.1): mu quase não se move, mas sigma cai **na
  mesma velocidade** que no blowout.

O efeito se acumula em 10 vitórias + 5 derrotas (win-rate 67%):

| weight | mu     | sigma | ordinal | interpretação              |
| ------ | ------ | ----- | ------- | -------------------------- |
| 0.10   | 26.208 | 5.897 | 8.517   | muito apertado             |
| 0.25   | 27.540 | 5.919 | 9.782   |                            |
| **0.50**   | **28.711** | **5.977** | **10.779** | ← **pico — margem média**  |
| 0.75   | 28.895 | 6.046 | 10.757  |                            |
| 1.00   | 28.378 | 6.115 | 10.034  | blowout total              |

O pico de ordinal está em weight ≈ 0.5, não em weight = 1.0. Um post que
destrói rivais por 4 estrelas ranka **abaixo** de um post que ganha por 2
estrelas, com o mesmo win-rate.

### 2.2. Por que acontece

Com weight = 1.0, o mu do vencedor sobe rápido. Nas partidas seguintes, ele
já está acima do prior (μ = 25) dos oponentes; o modelo espera que ele ganhe,
então cada vitória reduz sigma menos. Com weight = 0.5 o mu cresce devagar,
mantendo as partidas "informativas" por mais tempo — cada vitória ainda é uma
surpresa relativa, empurrando mu mais em cada passo. O efeito composto é que
weight = 0.5 acumula mu maior em 15 partidas do que weight = 1.0.

Enquanto isso, sigma cai à velocidade plena nos dois casos (assimetria), de
modo que a diferença de ordinal fica concentrada em mu, e mu favorece o
weight intermediário.

### 2.3. Sintoma visível no ranking atual

Os ranks 4–6 (`its-raining-truth`, `pierre-menard`, `future-father`) têm
stars modestas (3.28–3.38) mas div alto (+0.40 a +0.45), enquanto
`delegating-to-agents` tem stars = 4.25 e rank 14. O fingerprint é
compatível com a não-monotonicidade: posts que venceram muitas partidas por
margem média inflaram seu ordinal além do que o win-rate justificaria.

---

## 3. Proposta

Ponderar o sigma pelo mesmo `weight` do mu:

```typescript
// ranking.ts — após a correção
ratings.set(winnerKey, {
  mu: winnerRating.mu + weight * (newWinner.mu - winnerRating.mu),
  sigma: winnerRating.sigma + weight * (newWinner.sigma - winnerRating.sigma),
});
ratings.set(loserKey, {
  mu: loserRating.mu + weight * (newLoser.mu - loserRating.mu),
  sigma: loserRating.sigma + weight * (newLoser.sigma - loserRating.sigma),
});
```

**Efeito**: um match de photo-finish (weight ≈ 0.1) move muito pouco tanto
o mu quanto o sigma — a partida quase não aconteceu para o modelo. Um blowout
(weight = 1.0) aplica a atualização plena. O ordinal torna-se monotônico em
função da margem.

**Contrapartida**: posts que vivem de partidas apertadas retêm sigma alto por
mais tempo. Isso é matematicamente correto — partidas próximas revelam menos
sobre qualidade relativa —, mas pode ampliar o tempo necessário para uma
separação estável no topo.

### 3.1. Simulação comparativa (mesmo win-rate, 10W/5L)

| Implementação      | weight | mu     | sigma | ordinal |
| ------------------ | ------ | ------ | ----- | ------- |
| Atual (sigma fixo) | 0.10   | 26.208 | 5.897 | 8.517   |
| Atual (sigma fixo) | 0.50   | 28.711 | 5.977 | 10.779  |
| Atual (sigma fixo) | 1.00   | 28.378 | 6.115 | 10.034  |
| **Proposta**       | 0.10   | 26.132 | 7.957 | 2.261   |
| **Proposta**       | 0.50   | 28.235 | 6.882 | 7.590   |
| **Proposta**       | 1.00   | 28.378 | 6.115 | 10.034  |

Com a proposta, o blowout (weight = 1.0) mantém o ordinal 10.034 (inalterado,
pois weight = 1.0 ⟹ `σ_old + 1.0*(σ_new − σ_old) = σ_new`). O photo-finish
e o medium-margin ficam progressivamente penalizados. O ranking torna-se
monotônico no eixo weight → ordinal.

---

## 4. Compatibilidade e migração

### 4.1. `RANKING_MODEL_VERSION`

O comportamento do `_computeRatings` muda de forma incompatível com os
ordinals atuais. Incrementar de `2` para `3`:

```typescript
export const RANKING_MODEL_VERSION = 3;
```

Nenhum dado de rate file muda (a constante é só um marcador de versão para
diagnóstico).

### 4.2. Efeito nos ordinals existentes

Os posts com muitas partidas apertadas (exemplo: `its-raining-truth`,
`pierre-menard`) terão ordinals menores. Posts com blowouts dominantes
sobem relativamente. Os ordinals **absolutos** de todos os posts com
`weight < 1.0` no histórico mudarão; a ordenação relativa em alguns casos
também mudará.

Não há migração de dados — basta re-derivar rodando `hronir:ranking`.

### 4.3. `hronir:doctor`

Nenhuma alteração; o doctor valida o schema dos rate files, não os ordinals.

---

## 5. Testes

Todas as funções alteradas são puras (`_computeRatings` recebe `RawMatch[]`).

| Teste                                                      | Ação     |
| ---------------------------------------------------------- | -------- |
| `phase2: blowout margin produces larger ordinal gap`       | Passa sem mudança (blowout ainda dá gap maior que photo-finish) |
| **Novo**: `monotonicity: blowout ordinal ≥ medium-margin ordinal` | Adicionar — falha atualmente, passa após a correção |
| **Novo**: `sigma update scales with weight`                | Adicionar — verifica que `sigma_close > sigma_blowout` após mesmo número de matches |

---

## 6. Questões em aberto

1. **Amplitude da penalidade para photo-finish**: weight ≈ 0.1 preserva sigma
   quase no prior (σ ≈ 8). Com `MARGIN_W_MIN = 0.1`, partidas de photo-finish
   nunca são completamente ignoradas, mas contribuem muito pouco. Isso pode
   ser ajustado via `MARGIN_W_MIN` sem alterar a correção principal.

2. **Re-ranking do topo**: alguns posts hoje nos ranks 4–6 podem cair
   significativamente. Isso é o comportamento correto, mas pode ser
   surpreendente. Recomenda-se rodar uma sessão de diagnóstico com o
   ranking antes e depois da mudança antes de aceitar o PR.

3. **Pares de photo-finish no histórico**: os 481 rate files existentes incluem
   partidas com margens variadas. Após a correção, matches com margem < 0.5
   terão contribuição muito reduzida. Não é necessário re-coletar dados; os
   matches existentes simplesmente terão peso menor no novo cálculo.

4. **`computePerPerspectiveRatings` fora do escopo**: essa função faz updates
   plenos do OpenSkill sem margin weighting (não lê `rate_a`/`rate_b`, só
   `winner`). Isso é design intencional — rankings por perspectiva operam com
   menos dados e a margem não está disponível no caminho de leitura. A
   assimetria sigma não existe lá (nenhum weight é aplicado); a inconsistência
   entre os dois modelos já existia antes desta RFC e permanece.

---

## 7. Alternativas consideradas

### 7.1. Não fazer nada

A não-monotonicidade é sutil (gap de 7% entre weight = 0.5 e weight = 1.0
com 15 partidas). Aceitável se o sistema for usado só para identificar o pior
post, mas a `div` e o diagnóstico de calibração ficam distorcidos.

### 7.2. Mudar a fórmula do ordinal

Usar `μ − 2σ` ou `μ` diretamente (sem penalidade de sigma) resolve a
aparência do ranking mas não corrige a inconsistência estatística — o modelo
ainda teria sigma errado para todos os usos futuros (de-confounding,
promote/prune, visualização).

### 7.3. Peso diferente para sigma

Usar `weight_sigma = sqrt(weight)` em vez de `weight` para sigma. Correto na
direção, mas introduz outro parâmetro sem motivação teórica clara. A proposta
de `weight` uniforme para os dois eixos é o mais simples e matematicamente
direto.

### 7.4. Recalibrar `MARGIN_W_MIN`

Aumentar `MARGIN_W_MIN` de 0.1 para 0.3 reduziria a diferença entre
photo-finish e blowout, atenuando a não-monotonicidade sem corrigi-la. Não
resolve o problema raiz.

---

## Histórico de revisões

- **r0** (2026-06-11): versão inicial — diagnóstico e proposta.
