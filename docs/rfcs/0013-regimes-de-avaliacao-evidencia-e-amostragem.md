# RFC 0013 — Regimes de avaliação, evidência editorial e política de amostragem

|                |                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | Proposed — diagnóstico executado; decisões editoriais pendentes                                                                                                                                                                 |
| **Autor**      | Franklin Baldo (proposta assistida)                                                                                                                                                                                             |
| **Criado em**  | 2026-06-21                                                                                                                                                                                                                      |
| **Depende de** | RFC 0001 (qualidade absoluta), RFC 0002 (de-confounding e amostragem objetiva), RFC 0007 (UI/UX), RFC 0010 (versões como pares), **RFC 0012 (taxonomia de matches — mergeada)**                                                 |
| **Afeta**      | `src/hronir/{matches,ranking,commands,types}.ts`, `src/lib/hronir-rank.ts`, `scripts/hronir/index.js`, `scripts/generate-ranking-snapshot.mjs`, `src/components/RankingView.astro`, `src/pages/ranking/**`, `CLAUDE.md`, testes |

> Esta RFC é a **segunda metade** da antiga proposta 0012, fatiada por decisão
> editorial. Ela trata do problema **editorial e experimental**: quais regimes
> de leitura contam como evidência, como demonstrar a solidez de uma posição,
> como amostrar o corpus e qual papel a cadeia afetiva deve ter no produto.
>
> A RFC 0012 está **mergeada** (a fronteira estrutural existe). O diagnóstico do
> corpus exigido pela §2 foi **executado** (`npm run hronir:diagnose-corpus`) e
> seus resultados estão na §2.1. A conclusão muda a prioridade da RFC: **a
> restrição que prende tudo não é de design, é de volume de dados.** Nenhum
> limiar numérico de evidência é fixado aqui — e a §2.1 mostra que, no corpus
> atual, qualquer limiar razoável classificaria ~zero obras como calibradas.

---

## Histórico de revisões

| Data       | Mudança                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-21 | Versão inicial, resultante do fatiamento da proposta 0012 original. Estado: bloqueada em diagnóstico do corpus.                                                                                                                             |
| 2026-06-21 | RFC 0012 mergeada. Diagnóstico do corpus executado e incorporado (§2.1). Prioridade reordenada: volume de dados é a restrição binding; estados de evidência são gated em crescimento do acervo. Script `hronir:diagnose-corpus` adicionado. |

---

## 1. Motivação

A RFC 0012 separou estruturalmente duelos `work` de duelos `version` e
estabilizou a proveniência linguística. Resta o problema mais difícil, que é
**editorial e estatístico, não estrutural**:

- nem toda leitura tem o mesmo estatuto epistêmico — uma leitura editorial
  basal, uma leitura situada por perspectiva e uma cadeia afetiva encadeada
  respondem perguntas diferentes e não deveriam alimentar os mesmos agregados
  por acidente;
- a posição no ranking é informativa, mas a posição isolada não mede a
  **solidez** da evidência (oponentes repetidos, perspectivas concentradas,
  confrontos apertados, sigma alto);
- a amostragem atual protege líderes de perspectiva de forma binária
  (`getProtectedPosts`, com fallback quando sobram <4 candidatos), o que pode
  ser refinado.

Estes são problemas de **decisão editorial sob dados reais**, não de correção
de bug. Por isso a RFC exigiu um diagnóstico antes de qualquer limiar — e o
diagnóstico, agora executado, reordena o que vem primeiro.

---

## 2. Diagnóstico do corpus

A §2 da versão original exigia um relatório de leitura pura antes de qualquer
decisão. Ele agora existe como comando reproduzível:

```bash
npm run hronir:diagnose-corpus
```

O script (`scripts/hronir/diagnose-corpus.mjs`) usa o normalizador único da
RFC 0012 (`loadNormalizedMatches`) e o `computeRatings` — não altera dado
nenhum.

### 2.1. Resultados (2026-06-21)

| Métrica                                  | Valor                                                  |
| ---------------------------------------- | ------------------------------------------------------ |
| Obras (`work`) ranqueadas                | **97**                                                 |
| Duelos editoriais (`work`)               | **94** — menos de 1 por obra                           |
| Duelos de versão (`version`)             | 47, em 31 chaves                                       |
| Aparições por obra                       | mín 1 · **mediana 2** · p90 3 · **máx 4**              |
| Oponentes distintos por obra             | mín 1 · mediana 2 · **máx 4**                          |
| Sigma OpenSkill por obra                 | 8.08 – 8.26 (**prior ≈ 8.33**)                         |
| Perspectivas                             | 12 (4–11 duelos cada)                                  |
| Avaliadores (agentes)                    | 4 — todos modelos Claude; **nenhuma avaliação humana** |
| Obras que passam `app≥4, opp≥3, persp≥1` | **3**                                                  |
| Obras que passam `app≥6, opp≥4, persp≥2` | **0**                                                  |
| Obras que passam `app≥8, opp≥5, persp≥3` | **0**                                                  |

### 2.2. Interpretação

Três fatos dominam todo o resto:

1. **O acervo é raso.** 94 duelos para 97 obras; nenhuma obra passou de 4
   aparições. A ordenação existe, mas é quase toda prior.
2. **O sigma confirma isso.** Todas as obras têm sigma entre 8.08 e 8.26, ou
   seja, praticamente coladas no prior (~8.33). Em termos de OpenSkill, **o
   sistema mal começou a aprender**: o mu separou pouco e a incerteza quase não
   caiu. Qualquer estado de evidência honesto baseado em sigma classificaria
   **todas** as obras como "exploratórias" hoje — o que é a verdade.
3. **Os limiares da proposta original eram inalcançáveis.** A tabela de
   evidência cogitada (≥8 aparições, ≥5 oponentes, ≥3 perspectivas para
   "calibrado") classificaria **zero** obras. Mesmo um patamar frouxo
   (≥4/≥3/≥1) pega só 3. Fixar esses números agora produziria um rótulo
   "Calibrated ranking" permanentemente vazio — exatamente o risco que a
   alternativa D previu.

Além disso: **não existe campo `mode` no acervo.** Todos os 94 duelos vêm do
fluxo único atual (perspectiva + mood + glifo — o que a RFC chama de
`affective-chain`), produzidos por modelos Claude. Não há `calibration` nem
`lens` para separar; a distinção `legacy`/`calibration`/`affective-chain` só
passa a existir **a partir de coletas futuras**.

### 2.3. Consequência para a prioridade da RFC

A restrição binding é **volume e diversidade de evidência**, não design de
agregados. Logo, a ordem correta é:

1. **Primeiro, coletar.** Uma campanha de amostragem com objetivo `coverage`
   (e depois `refine-top`) para tirar o acervo do regime prior. Sem isso, todo
   o resto da RFC é decoração sobre dados que não a sustentam.
2. **Depois, reificar evidência.** Estados de evidência e a aba "Calibrated
   ranking" só fazem sentido — e só devem ser publicados — quando o diagnóstico
   mostrar uma rede mínima (ver §4).

---

## 3. Decisões a tomar (em aberto, agora informadas)

Continuam sendo decisões editoriais do autor; o diagnóstico apenas as informa.

1. **Cadeia afetiva** (`affective-chain`): permanece fluxo principal, vira
   fluxo paralelo, ou é arquivada? **Dado relevante:** ela é hoje o **único**
   fluxo — 100% do acervo. Rebaixá-la sem antes ter um fluxo `calibration`
   alternativo deixaria o sistema sem nenhuma coleta. Recomendação: introduzir
   `calibration` como modo paralelo primeiro; só reavaliar o papel da
   `affective-chain` depois que houver dados dos dois.
2. **Regimes de coleta**: quais modos existem (`calibration`, `lens`,
   `affective-chain`, `legacy`) e — ponto crítico — **como sua proveniência é
   validada**, já que `mode` é uma asserção de coleta, não derivável do dado
   como `kind`. Todo dado atual entra como `legacy`/`affective-chain`.
3. **Quais dados alimentam o quê**: ranking editorial, seleção de versões,
   leituras situadas. Em especial, se a seleção de versões (RFC 0010) passa a
   exigir evidência `calibration` para deslocar uma incumbente — **hoje
   inviável**, pois não há duelos `calibration`; aplicar essa regra agora
   congelaria todas as seleções.
4. **Estados de evidência**: combinar **sigma** (sinal que o modelo já produz),
   diversidade de oponentes e de perspectivas. Preferir sigma a contagens
   arbitrárias. **Dado relevante:** com o sigma atual quase uniforme, o estado
   seria "exploratório" para todos — então os estados só ganham poder
   discriminante depois da campanha de coleta.
5. **Objetivos de amostragem**: `coverage`, `refine-top`, `hunt-worst`,
   `version-evidence`; persistidos como proveniência; e a proteção binária de
   líderes (`getProtectedPosts`) substituída por uma penalidade suave
   (cooldown) que despriorize sem excluir. **Este é o item de maior alavancagem
   agora** (ver §2.3).
6. **Topologia de rotas**: rota nova para leituras situadas
   (`/ranking/readings/`) ou filtros sobre as rotas existentes + a rota de
   testes de versão (já criada pela RFC 0012).

---

## 4. Restrições herdadas (reforçadas pelo diagnóstico)

- **Limiares de evidência devem ser alcançáveis no corpus real.** Constantes
  nomeadas em `ranking.ts`, derivadas da distribuição observada — não da
  intuição. Concretamente: **não publicar "Calibrated ranking" enquanto o
  diagnóstico mostrar mediana de aparições baixa e sigma ~prior.** Um gate
  objetivo sugerido: revisitar quando a mediana de aparições das obras `work`
  for ≥ um patamar a definir e o p90 de sigma tiver caído de forma mensurável
  abaixo do prior.
- **Não fixar limiares numéricos antes de a coleta acontecer.**
- **Não reescrever rate files históricos.** `legacy` permanece legível.
- **Subjetividade é dado, não ruído.** Perspectivas e humores são lentes; a
  solução é declarar seu plano de validade, não neutralizá-los.
- **Evidência antes de espetáculo.** A UI pode celebrar candidatos, mas não
  chamar de "campeão" o que ainda é hipótese — e, dado o §2.1, **hoje tudo é
  hipótese**.
- A separação `work`/`version`, a normalização única e a proveniência
  linguística **já existem** (RFC 0012) e não são reabertas.

---

## 5. Primeiro passo concreto

Independente das decisões editoriais em aberto, há um passo sem
ambiguidade e de maior alavancagem:

1. **Já entregue nesta revisão:** `hronir:diagnose-corpus` — torna o estado do
   acervo verificável a qualquer momento, e serve de gate para as fases
   seguintes.
2. **Próximo:** campanha de amostragem `coverage` (várias sessões) para tirar o
   acervo do regime prior, re-rodando o diagnóstico entre rodadas. Só quando os
   números melhorarem é que faz sentido implementar estados de evidência,
   modos de coleta e a aba calibrada.

---

## 6. Critério de conclusão

A RFC 0013 estará cumprida quando, somada à 0012, um leitor puder responder
sem ler código:

1. **Quão sólida é esta posição?** (estado de evidência derivado de sigma +
   diversidade — só significativo após a coleta da §5)
2. **Por que esta versão — e não sua rival — está publicada?** (regime de
   evidência exigido para deslocar uma incumbente)
3. **Como leituras situadas e afetivas divergiram da avaliação editorial?**
   (superfície de leituras, sem contaminar o ranking editorial)

A RFC 0012 já garante as perguntas estruturais ("isto é obra ou versão?",
"quais versões exatas?", "entra no ranking editorial?", "em que línguas?").

---

## 7. Alternativas consideradas

### A. Não fatiar — manter tudo na proposta 0012 original

Rejeitada. O problema estrutural (verificável, baixo risco) e o editorial
(dependente de dados) têm naturezas distintas. O diagnóstico confirma: o
editorial dependia de dados que o acervo ainda não tem.

### B. Excluir subjetividade de todo o Hrönir

Rejeitada. Perspectivas, humores e a cadeia afetiva são uma das melhores ideias
do sistema — e, hoje, a única fonte de dados. A solução é declarar seu plano de
validade.

### C. Fazer todo novo match contar para o ranking editorial

Rejeitada. Preserva volume, mas dissolve a diferença entre avaliação editorial,
crítica situada e experimento afetivo.

### D. Fixar limiares de evidência por intuição, antes do diagnóstico

Rejeitada — e **agora confirmada pelos dados**: máximo de 4 aparições por obra,
sigma ~prior em todas, 0 obras passando limiares moderados. Limiares fixados no
escuro tornariam "calibrado" inatingível. Os números seguem os dados.

### E. Implementar estados de evidência/modos agora

Rejeitada por ora. Com sigma quase uniforme no prior, todo estado seria
"exploratório" e todo painel de calibração ficaria vazio. Construir a máquina
antes da coleta é esforço sobre dados que não a sustentam (§2.3).
