# RFC 0012 — Taxonomia de matches, genealogia de versões e proveniência linguística

|                 |                                                                                                                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Proposed                                                                                                                                                                                                                                                                                                          |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                                                                               |
| **Criado em**   | 2026-06-21                                                                                                                                                                                                                                                                                                        |
| **Branch / PR** | `claude/gifted-cray-zefxmx`                                                                                                                                                                                                                                                                                       |
| **Depende de**  | RFC 0001 (qualidade absoluta), RFC 0007 (UI/UX do ranking), RFC 0010 (versões como pares — esta RFC **estabiliza a fronteira pública** das versões que a 0010 tornou ranqueáveis)                                                                                                                                 |
| **Afeta**       | `src/hronir/{matches,ranking,types,commands}.ts`, `src/lib/hronir-rank.ts`, `scripts/hronir/index.js`, `scripts/generate-ranking-snapshot.mjs`, `src/components/RankingView.astro`, `src/pages/ranking/{battles,posts,perspectives}/**` e novas rotas de versão, `src/generated/`, `CLAUDE.md`, testes e fixtures |

> Mesmo padrão das RFCs 0001/0002/0003/0010: primeiro o documento, depois a
> implementação incremental na mesma branch, fase a fase, cada fase verde
> (build + testes + `prettier --check` + `astro check` + `hronir:doctor`) antes
> da próxima. Merge com merge commit, nunca squash.

> Esta RFC é a **primeira metade** da antiga proposta 0012, fatiada por decisão
> editorial. Trata só do problema **estrutural, verificável e de baixo risco**:
> distinguir duelos entre obras de duelos entre versões, preservar a identidade
> exata das versões avaliadas, impedir que testes de revisão contaminem
> recordes/estatísticas/apresentações do ranking editorial, e registrar a
> proveniência linguística de cada avaliação. Os problemas **editoriais e
> experimentais** — regimes de avaliação, estados de evidência, amostragem e o
> papel da cadeia afetiva — ficam para a **RFC 0013**, que só pode começar após
> um diagnóstico do corpus. Nenhum limiar numérico de evidência é fixado aqui.

---

## Histórico de revisões

| Data       | Mudança                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-06-21 | Versão inicial, resultante do fatiamento da proposta 0012 original em 0012 (estrutural) + 0013 (editorial). |

---

## 1. Resumo

O Hrönir produz dois juízos estruturalmente distintos sob o mesmo arquivo de
rate:

1. **comparação entre obras** (`work`): qual texto vence outro texto — pergunta
   editorial;
2. **comparação entre versões** (`version`): qual versão de um mesmo texto deve
   ocupar a URL pública — pergunta de revisão.

O núcleo de ranking **já** trata os dois universos separadamente nos seus
cálculos de OpenSkill: `_computeRatings` pula duelos de mesma `key`
(`ranking.ts:124-125`) e há um `_computeVersionRatings` dedicado
(`ranking.ts:252-290`). O problema que esta RFC ataca não está no cálculo de
rating, e sim na **camada de leitura pública e na identidade dos dados**: a
distinção `work`/`version` é hoje derivada ad hoc por cada consumidor (via
`isVersionDuel` ou comparação local de chaves), sem um normalizador único, e as
superfícies públicas (dossiês, estatísticas, listas de batalhas, cards
recentes) não filtram esses casos de forma consistente. Isso produz artefatos
semânticos: um post parece enfrentar a si mesmo; uma vitória de versão parece
uma vitória editorial; uma taxa de vitórias pode contar partidas cujo objeto de
comparação não é o mesmo.

Em paralelo, há uma contradição de idioma **documentada vs implementada**:
`CLAUDE.md` prescreve "review na língua do post"; o CLI grava `eval_lang`
escolhido na sessão, independente da língua do post (`commands.ts`). As duas
políticas são defensáveis; não podem coexistir sem campos explícitos.

Esta RFC cria:

- um **normalizador único** de rate files, com `kind: "work" | "version"`
  derivado deterministicamente;
- **preservação e exposição de `slug@uuid`** para ambos os lados de um duelo de
  versões;
- correção das superfícies públicas para usarem apenas duelos `work` em
  ranking, recordes, históricos, sparklines e estatísticas;
- renderização de duelos `version` como **testes entre duas versões
  identificáveis**, nunca como "X venceu X";
- registro de `content_lang` por lado e `review_lang` da crítica, com uma
  **política de idioma única** unificando docs e CLI;
- preservação dos arquivos históricos como `legacy`, sem reprovação retroativa
  no `doctor`.

---

## 2. Diagnóstico

### 2.1. A distinção `work`/`version` é derivada ad hoc por cada consumidor

Hoje cada lugar que precisa distinguir um duelo de versão faz isso por conta
própria: o ranking compara `m.aKey === m.bKey`; a camada de UI usa
`isVersionDuel` em `DuelEntry`. Não há uma fonte única de verdade. O resultado é
que o cálculo de rating está correto (RFC 0010), mas nada **garante** que toda
nova superfície pública herde a mesma classificação. A correção é estrutural:
classificar uma vez, no carregamento, e proibir defaults ambíguos nos
consumidores.

### 2.2. Um vencedor de versão não é um vencedor editorial

Um duelo entre `post-a` e `post-b` responde "qual texto é melhor". Um duelo
entre `post-a@uuid-1` e `post-a@uuid-2` responde "qual revisão publicar". Os
dois produzem resenha, estrelas e vencedor, mas o significado do vencedor é
diferente. Nenhuma estatística ou visualização editorial deve somar o segundo
ao primeiro, e nenhuma página de duelo de versão deve exibir o título "X venceu
X" nem um `#rank global`.

### 2.3. A identidade exata da versão precisa sobreviver até a UI

Um duelo de versão só é legível se levar às **duas versões exatas avaliadas**,
por `slug@uuid` — e não apenas à seleção corrente do post (que pode já ter
mudado). A identidade `slug@uuid` precisa ser preservada no normalizador e
renderizada com links permanentes para cada lado.

### 2.4. O contrato de idioma divergiu

`CLAUDE.md:137-139` afirma que reviews seguem a língua do post. O CLI grava
`eval_lang` da sessão e instrui o avaliador a escrever sempre nessa língua,
independente da língua do post (`commands.ts:1005`). O dado persistido (`eval_lang`)
não distingue "língua do texto lido" de "língua da crítica". O resultado deve
registrar ambas.

---

## 3. Princípios de design

1. **Tipo antes de apresentação.** `work` e `version` são propriedades
   estruturais do match, derivadas no carregamento, não tags que a UI tenta
   inferir tarde.
2. **Uma pergunta, uma superfície.** Ranking de obras e teste de versões podem
   compartilhar dados brutos, mas não devem compartilhar agregados por acidente.
3. **Versões são endereçáveis.** Um duelo de versão sempre leva às duas versões
   exatas avaliadas, por `slug@uuid`.
4. **Histórico preservado.** Rate files existentes permanecem legíveis e
   públicos, classificados com honestidade como `legacy`. A mudança rege a
   forma de ler o passado, não o reescreve.
5. **Idioma é fato verificável, não convenção em prosa.** A língua do conteúdo e
   a língua da crítica são campos distintos e validados.

---

## 4. Modelo de dados

### 4.1. Normalização única

`matches.ts` passa a exportar um normalizador único, consumido por ranking,
seleção, UI, snapshot e doctor.

```ts
export type MatchKind = "work" | "version";

export type NormalizedMatch = {
  id: string;
  kind: MatchKind;
  winnerSide: "a" | "b";
  runAt: Date | null;

  postA: {
    key: string;
    ref: string | null; // slug@uuid
    path: string | null; // cache, não identidade
    version: string | null;
    contentLang: string | null;
  };
  postB: {
    key: string;
    ref: string | null;
    path: string | null;
    version: string | null;
    contentLang: string | null;
  };

  reviewLang: string | null;
  agentId: string | null;
  perspectiveId: string | null;
  rateA: number | null;
  rateB: number | null;
  // demais campos narrativos e de proveniência preservados
};
```

A regra de classificação é determinística:

```ts
kind = postA.key === postB.key ? "version" : "work";
```

Um campo persistido `match_kind` **pode** ser gravado em novos rate files para
inspeção humana, mas o leitor valida sua coerência com a regra acima e nunca
confia nele isoladamente.

> **Nota de escopo.** `NormalizedMatch` aqui **não** inclui `mode`/
> `EvaluationMode`. Regimes de avaliação são RFC 0013. Esta RFC só classifica o
> que é estruturalmente verificável a partir do próprio dado.

### 4.2. `stars-v3` e campos de idioma

Novos rate files usam `prompt_version: stars-v3` e passam a gravar:

```yaml
match_kind: work # redundante, validado
review_lang: en
post_a:
  content_lang: en
post_b:
  content_lang: pt
```

Rate files `stars-v1` e `stars-v2` continuam válidos. Na ausência de
`review_lang`, o normalizador usa `eval_lang` se existir e, caso contrário,
`null`/`unknown`. `content_lang` ausente é derivado do frontmatter do post
(`lang`) quando o arquivo ainda existe, ou `unknown`.

`hronir:doctor` reporta esses casos como **dados históricos**, não como erro.

---

## 5. Agregados e superfícies públicas

### 5.1. Ranking editorial — apenas `work`

`computeRatings`, qualidade absoluta e snapshot global recebem apenas
`match.kind === "work"`. A página `/ranking/` mostra apenas duelos `work`. O
item "all battles" passa a significar "all editorial battles".

Estatísticas editoriais passam a contar somente duelos `work`: obras avaliadas,
duelos entre obras, aparições por obra, oponentes distintos, perspectivas/
avaliadores distintos.

### 5.2. Dossiê de obra — apenas `work`

`/ranking/posts/[key]/` usa somente duelos `work` para recorde, taxa de
vitória, sparkline, histórico de oponentes e colocação global. Pode ganhar uma
seção secundária **Histórico de edição** com: versão selecionada, número de
duelos de versão e link para a genealogia. Essa seção é informativa e **não**
alimenta o recorde editorial.

### 5.3. Teste de versões — superfície própria

Criar superfície dedicada para duelos `version`:

- `/ranking/version-trials/` — lista de testes entre versões concorrentes;
- `/ranking/versions/[slug]/` — genealogia, seleção vigente, desafiantes,
  duelos e links permanentes por `slug@uuid`;
- `/ranking/battles/[id]/` — continua existindo, mas muda de composição quando
  `kind === "version"`.

Um duelo de versão renderiza:

> **Teste de versão — paperclip-rhapsody**
> `v-2026-06-11T08-25-46` venceu `v-2026-06-09T20-24-29`
> [ler vencedora] [ler desafiante] [comparar diff]

Ele **não** mostra `#rank global`, **não** usa o título "X venceu X" e **não**
altera o recorde editorial do post.

### 5.4. Filtros de rota, não só visuais

`getAllDuels()` / `getDuels()` ganham argumento explícito de `kind`, sem default
ambíguo:

```ts
getDuels({ kind: "work" });
getDuels({ kind: "version" });
getDuels({ kind: "all" }); // precisa ser declarado, nunca implícito
```

> **Nota de escopo.** O filtro por `modes` (`calibration`/`lens`/
> `affective-chain`) e a rota `/ranking/readings/` pertencem à RFC 0013. Esta
> RFC entrega apenas o eixo `kind`.

---

## 6. Contrato de idioma

Cada rate file novo distingue:

- `content_lang`: língua do texto em cada lado;
- `review_lang`: língua da crítica e do clash.

Regras (política única que substitui a contradição atual):

1. Reviews e clash são escritos em `review_lang`.
2. Em duelo `work`, os conteúdos podem estar em línguas diferentes;
   `review_lang` é a língua definida na sessão e gravada explicitamente.
3. Em duelo `version`, ambos os lados pertencem à mesma versão linguística;
   logo `review_lang === content_lang`.
4. A UI exibe chips discretos: `conteúdo: EN/PT`, `crítica: PT`.
5. O `doctor` valida os campos novos **apenas em rate files `stars-v3`**; dados
   antigos recebem marcação `unknown` ou valor derivado, sem reescrita
   obrigatória e sem reprovação retroativa.

`CLAUDE.md` é atualizado para descrever esta política única, encerrando a
divergência "review na língua do post" vs "review na língua da sessão".

> A regra 3 (`review_lang === content_lang` em `version`) é validada **só para
> coletas pós-RFC** (`stars-v3`). Rate files históricos de versão em língua
> divergente permanecem `legacy` e não são reprovados.

---

## 7. Migração

### Fase 0 — Especificação e fixtures

- Adicionar tipos `MatchKind`, `NormalizedMatch`.
- Criar fixtures de `stars-v1`, `stars-v2`, `stars-v3`, duelo entre obras e
  duelo de versões.
- Fixar snapshot de comportamento histórico antes de mudar consumidores.

### Fase 1 — Normalizador e filtros sem mudança de UI

- Implementar `loadNormalizedMatches()` em `matches.ts`.
- Migrar todos os consumidores (ranking, `hronir-rank.ts`, snapshot, doctor,
  páginas) para ele.
- Garantir que `computeRatings()` e o snapshot contem somente `work`.
- Expor `getDuels({ kind })`; eliminar defaults ambíguos.
- Rodar `doctor` em todo o acervo sem reescrever rate files.

### Fase 2 — Separação de superfícies

- Corrigir dossiês, cards recentes e estatísticas para `work`.
- Implementar `/ranking/version-trials/` e `/ranking/versions/[slug]/` com
  renderização por `slug@uuid`, links permanentes e diff.
- Tornar explícitas as duas versões em cada duelo `version`.

### Fase 3 — Idioma

- Adicionar `--review-lang` ao `init` e gravar `content_lang`/`review_lang`.
- Introduzir `stars-v3` com validação no `doctor` e chips de idioma na UI.
- Unificar `CLAUDE.md` e o CLI na política única do §6.

Cada fase deve ser verde antes da seguinte: `npm test`, `prettier --check`,
`astro check`, `npm run build`, `npm run hronir:doctor` e fixtures de páginas.

---

## 8. Testes obrigatórios

1. Um duelo `version` nunca altera `computeRatings`, posição global, recorde,
   sparkline ou lista de oponentes de uma obra.
2. Um duelo `version` renderiza duas versões distintas, dois links distintos
   (`slug@uuid`) e nunca produz "X venceu X".
3. Dados `stars-v1`/`stars-v2` permanecem legíveis, classificados como
   `legacy`, sem reprovação no `doctor`.
4. `doctor`, ranking, snapshot, páginas e `select` usam o mesmo `winnerSide` e a
   mesma classificação de match (normalizador único).
5. `getDuels` sem `kind` declarado é erro de tipo/execução — não há default
   ambíguo.
6. `review_lang` é validado em `stars-v3`; duelo de versões `stars-v3` em língua
   divergente é rejeitado; o mesmo caso em `legacy` é aceito como histórico.
7. Sessão interrompida e retomada não duplica rate file nem altera idioma do
   match pendente.

---

## 9. Alternativas consideradas

### A. Manter um único fluxo e só colocar uma tag visual em duelos de versão

Rejeitada. Agregados, dossiês e links precisam de identidades de versão,
filtros e semânticas diferentes — não é problema decorativo.

### B. Apagar ou reescrever rate files históricos para o novo schema

Rejeitada. O arquivo crítico é parte da obra. O normalizador preserva o
passado, classifica-o com honestidade e permite que novas decisões usem regras
mais estritas.

### C. Resolver idioma só na documentação, sem campo persistido

Rejeitada. Uma convenção em prosa sem check deriva (RFC 0004). A distinção
`content_lang`/`review_lang` precisa ser um fato verificável pelo `doctor`.

---

## 10. Critério de conclusão

A RFC 0012 estará cumprida quando toda superfície pública responder
corretamente, sem ler código:

1. **Isto é uma batalha entre obras ou um teste entre versões?**
2. **Quais foram as duas versões exatas avaliadas?** (`slug@uuid`)
3. **Este duelo entra no ranking editorial?**
4. **Em que língua estava cada texto e em que língua foi escrita a crítica?**

A pergunta **"quão sólida é a posição?"** fica deliberadamente reservada à
**RFC 0013**.
