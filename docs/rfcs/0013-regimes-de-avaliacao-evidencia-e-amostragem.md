# RFC 0013 — Regimes de avaliação, evidência editorial e política de amostragem

|                |                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | Proposed — bloqueada em diagnóstico do corpus                                                                                                                                                                                   |
| **Autor**      | Franklin Baldo (proposta assistida)                                                                                                                                                                                             |
| **Criado em**  | 2026-06-21                                                                                                                                                                                                                      |
| **Depende de** | RFC 0001 (qualidade absoluta), RFC 0002 (de-confounding e amostragem objetiva), RFC 0007 (UI/UX), RFC 0010 (versões como pares), **RFC 0012 (taxonomia de matches — pré-requisito estrutural)**                                 |
| **Afeta**      | `src/hronir/{matches,ranking,commands,types}.ts`, `src/lib/hronir-rank.ts`, `scripts/hronir/index.js`, `scripts/generate-ranking-snapshot.mjs`, `src/components/RankingView.astro`, `src/pages/ranking/**`, `CLAUDE.md`, testes |

> Esta RFC é a **segunda metade** da antiga proposta 0012, fatiada por decisão
> editorial. Ela trata do problema **editorial e experimental**: quais regimes
> de leitura contam como evidência, como demonstrar a solidez de uma posição,
> como amostrar o corpus e qual papel a cadeia afetiva deve ter no produto.
>
> **Ela não deve começar a ser implementada antes de a RFC 0012 estar concluída
> e antes do diagnóstico do corpus descrito na §2.** Nenhum limiar numérico de
> evidência pode ser fixado antes desse diagnóstico — esta RFC enumera as
> decisões a tomar, não as respostas.

---

## Histórico de revisões

| Data       | Mudança                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-06-21 | Versão inicial, resultante do fatiamento da proposta 0012 original. Estado: bloqueada em diagnóstico do corpus. |

---

## 1. Motivação

A RFC 0012 separa estruturalmente duelos `work` de duelos `version` e estabiliza
a proveniência linguística. Resta o problema mais difícil, que é **editorial e
estatístico, não estrutural**:

- nem toda leitura tem o mesmo estatuto epistêmico — uma leitura editorial
  basal, uma leitura situada por perspectiva e uma cadeia afetiva encadeada
  respondem perguntas diferentes e não deveriam alimentar os mesmos agregados
  por acidente;
- a posição no ranking é informativa desde os primeiros matches, mas a posição
  isolada não mede a **solidez** da evidência (oponentes repetidos, perspectivas
  concentradas, confrontos apertados, sigma alto);
- a amostragem atual protege líderes de perspectiva de forma binária (com
  fallback quando sobram poucos candidatos), o que pode ser refinado.

Estes são problemas de **decisão editorial sob dados reais**, não de correção de
bug. Por isso esta RFC é deliberadamente aberta e condicionada a um diagnóstico.

---

## 2. Pré-requisito: diagnóstico do corpus

Antes de qualquer decisão de design ou limiar, produzir um relatório do acervo
existente (script de leitura pura, sem alterar dados), contendo:

1. quantidade de obras;
2. quantidade de duelos entre obras (`work`) e entre versões (`version`);
3. distribuição de aparições por obra;
4. diversidade de oponentes por obra;
5. distribuição de duelos por perspectiva e por agente;
6. sigma do OpenSkill por obra;
7. proporção dos dados históricos que poderiam satisfazer critérios de
   calibração sob diferentes hipóteses de limiar.

O relatório é insumo obrigatório para §3–§6. **Sem ele, esta RFC não avança.**

---

## 3. Decisões a tomar (em aberto)

Esta RFC deve decidir explicitamente, com base no diagnóstico:

1. **Cadeia afetiva** (`affective-chain`): permanece fluxo principal, vira fluxo
   paralelo, ou é arquivada como experimento? Hoje ela é o fluxo canônico
   descrito em `CLAUDE.md` (perspectiva, mood, glifo, herança). Qualquer
   rebaixamento é uma **mudança de identidade do produto** e deve ser tratado
   como decisão editorial explícita, não como detalhe técnico.
2. **Regimes de coleta**: quais modos existem (ex. `calibration`, `lens`,
   `affective-chain`, além de `legacy`), como cada um é declarado e — ponto
   crítico — **como sua proveniência será validada**, já que `mode` é uma
   asserção de coleta, não uma propriedade derivável do dado como `kind`.
3. **Quais dados alimentam o quê**: ranking editorial, seleção de versões e
   leituras situadas. Em particular, se a seleção de versões da RFC 0010 passa a
   exigir um regime específico de evidência para deslocar uma incumbente.
4. **Estados de evidência**: como combinar **sigma do OpenSkill**, diversidade
   de oponentes e diversidade de perspectivas num indicador de solidez.
   Preferir o sigma — sinal de incerteza que o modelo já produz — a contagens
   arbitrárias, salvo justificativa baseada no diagnóstico.
5. **Objetivos de amostragem**: quais existem (ex. cobertura, refinar topo,
   caçar pior, evidência de versão), como são persistidos como proveniência e
   como a proteção binária de líderes é substituída por uma penalidade suave
   (cooldown) que despriorize sem excluir.
6. **Topologia de rotas**: se é necessária uma rota nova para leituras situadas
   (`/ranking/readings/`), ou se filtros sobre as rotas existentes mais a rota
   de testes de versão (já criada pela RFC 0012) bastam.

---

## 4. Restrições herdadas

- **Não fixar limiares numéricos** (aparições, oponentes, perspectivas) antes do
  diagnóstico da §2. Quando fixados, devem ser constantes nomeadas em
  `ranking.ts`, não números espalhados pela UI, e justificados pelo tamanho real
  do corpus.
- **Não reescrever rate files históricos.** `legacy` permanece legível e
  classificado com honestidade (herdado da RFC 0012).
- **Subjetividade é dado, não ruído.** Perspectivas e humores são lentes de
  leitura; a solução é declarar seu plano de validade, não neutralizá-los.
- **Evidência antes de espetáculo.** A UI pode celebrar candidatos, mas não deve
  chamar de "campeão" o que ainda é hipótese. A linguagem de pódio fica
  condicionada aos estados de evidência decididos aqui.
- A separação estrutural `work`/`version`, a normalização única e a proveniência
  linguística **já existem** (RFC 0012) e não são reabertas.

---

## 5. Critério de conclusão

A RFC 0013 estará cumprida quando, somada à 0012, um leitor puder responder sem
ler código:

1. **Quão sólida é esta posição?** (estado de evidência derivado de sigma +
   diversidade)
2. **Por que esta versão — e não sua rival — está publicada?** (regime de
   evidência exigido para deslocar uma incumbente)
3. **Como leituras situadas e afetivas divergiram da avaliação editorial?**
   (superfície de leituras, sem contaminar o ranking editorial)

A RFC 0012 já garante as perguntas estruturais ("isto é obra ou versão?",
"quais versões exatas?", "entra no ranking editorial?", "em que línguas?").

---

## 6. Alternativas consideradas

### A. Não fatiar — manter tudo na proposta 0012 original

Rejeitada. O problema estrutural (verificável, baixo risco) e o editorial
(dependente de dados, alto risco de inconclusão) têm naturezas distintas.
Empacotá-los criava uma RFC que dificilmente atingiria "todas as fases verdes".

### B. Excluir subjetividade de todo o Hrönir

Rejeitada. Perspectivas, humores e a cadeia afetiva são uma das melhores ideias
do sistema. A solução é declarar seu plano de validade.

### C. Fazer todo novo match contar para o ranking editorial

Rejeitada. Preserva volume, mas dissolve a diferença entre avaliação editorial,
crítica situada e experimento afetivo.

### D. Fixar limiares de evidência por intuição, antes do diagnóstico

Rejeitada explicitamente. Para um corpus pequeno, limiares mal calibrados podem
tornar "calibrado" inatingível na prática. Os números seguem os dados, não o
contrário.
