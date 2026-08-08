---
type: RFC
title: Hrönir como sistema de evidência editorial
status: draft
description: Redesenha o Hrönir em torno de planos, assignments, avaliações, projeções e recomendações, com um único fluxo público e escrita delegada ao okf-parser
---

# RFC 0020 — Hrönir como sistema de evidência editorial

|                 |                                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| **Status**      | Draft — decisão arquitetural e contrato da pilha #1501                                |
| **Autor**       | Franklin Baldo (proposta assistida)                                                   |
| **Criado em**   | 2026-08-08                                                                            |
| **Depende de**  | RFC 0019, ledger histórico #1483 e relações Work/Expression/Revision #1485            |
| **Substitui**   | O fluxo operacional de seleção e duelo de versões das RFCs 0010, 0012, 0015 e 0016   |
| **Relaciona-se**| RFCs 0013, 0017 e 0018; issues #1493–#1503                                            |

---

## 1. Decisão

O Hrönir deixa de ser um ranking que escolhe e edita o pior post. Ele passa a
ser um sistema de experimentos editoriais que coleta julgamentos situados,
preserva evidência reproduzível e produz recomendações de atenção.

O fluxo interno é:

```text
EvaluationPlan → Assignment → Evaluation → Projection → RevisionRecommendation
```

O fluxo público, porém, é um só:

```bash
npx hronir run
```

Conceitos internos não se tornam cerimônia para quem usa o sistema. O comando
inicia ou retoma a rodada, apresenta o próximo par, recebe a avaliação, valida,
persiste e avança. Ao final, mostra resultados e recomendações sem editar o
corpus.

## 2. Propósito e fronteiras

O Hrönir existe para ajudar a decidir onde a atenção editorial pode melhorar
mais o corpus, preservando julgamentos plurais e a evidência que os sustenta.

As responsabilidades ficam separadas:

| Sistema      | Responsabilidade                                                               |
| ------------ | ------------------------------------------------------------------------------ |
| Corpus OKF   | Identidades, relações, planos e registros persistidos                          |
| okf-parser   | Leitura, validação, consulta e escrita round-trip do bundle                     |
| Git          | Genealogia, revisão histórica, transação editorial e publicação por PR          |
| Hrönir       | Amostragem, condução da avaliação, projeções e recomendações                    |
| Astro        | Apresentação das projeções públicas                                             |

O Hrönir não:

- seleciona uma versão para publicação;
- cria sibling draft;
- edita um post por consequência automática de ranking;
- mantém um writer próprio de Markdown ou YAML;
- trata OpenSkill como verdade canônica;
- mistura avaliações de texto e áudio numa escala única.

## 3. Três eixos independentes

O modelo histórico misturou três perguntas. A partir desta RFC elas são campos
independentes e obrigatórios.

### 3.1. Alvo

O que a avaliação observa:

- `Work`: identidade intelectual;
- `Expression`: manifestação linguística ou formal;
- `Revision`: estado exato de uma Expression;
- `Media`: áudio, imagem, vídeo ou outra manifestação.

Toda avaliação observa revisões ou mídias exatas, mesmo quando uma Projection
agrega o resultado em Work. O roll-up Expression → Work precisa ser declarado
pelo plano, inclusive sua política de idioma.

### 3.2. Lente

Como o alvo é lido: calibração editorial, perspectiva situada, cadeia afetiva
ou outra lente versionada. Perspectiva, humor e glifo são proveniência útil;
não são autorização implícita para alterar ranking.

### 3.3. Efeito

Qual interpretação pode consumir o resultado. Um plano declara `effects[]` e
não existe default permissivo.

- `calibration` pode alimentar o ranking editorial;
- `lens` alimenta projeções situadas;
- `affective-chain` é experimental e não operacional por padrão;
- avaliação de revisão pode apoiar uma recomendação, nunca publicar conteúdo;
- avaliação de áudio só alimenta projeções de mídia.

## 4. Modelo

### 4.1. EvaluationPlan

Contrato versionado que contém:

- pergunta;
- subject e população;
- política de idioma;
- lente;
- política de amostragem;
- requisitos de avaliador;
- schema de Evaluation;
- efeitos permitidos;
- stopping rule.

Há um plano editorial padrão explícito. O caso comum não exige que o usuário
escolha ou conheça um plano, mas o id e a versão efetivamente usados aparecem
no output e no dado persistido.

### 4.2. Assignment

Materializa uma solicitação de avaliação antes da leitura:

- plano e versão;
- Work/Expression/Revision ou Media exatos;
- commit, blob e digest quando aplicáveis;
- ordem A/B;
- idioma;
- lente;
- proveniência da amostragem;
- avaliador solicitado;
- estado operacional.

Retomar uma execução nunca sorteia novamente um Assignment pendente. A
identidade é determinística a partir do snapshot, plano e seed.

### 4.3. Evaluation

Registro append-only do julgamento:

```yaml
type: Evaluation
assignment: ../assignments/assignment-id.md
preference: a # a | b | tie | incomparable
confidence: 0.82
ratings:
  a:
    editorial_quality: 4.25
  b:
    editorial_quality: 3.75
evidence:
  - side: a
    anchor: "seção ou trecho"
    observation: "observação específica"
critique_a: "..."
critique_b: "..."
comparison: "..."
```

Preferência relativa e nota absoluta são fatos distintos. Empate e
incomparabilidade são respostas válidas. Confiança registra força do juízo.
Evidência ancorada é a garantia principal de especificidade; contagem mínima de
palavras pode permanecer como proteção secundária, não como medida de qualidade.

Rate files `stars-v1`, `stars-v2` e `stars-v3` permanecem imutáveis e são lidos
por adapter lossless. Campos inexistentes ficam `null`/`unknown`; não são
inventados retroativamente.

### 4.4. Projection

Interpretação versionada de Evaluations. Cada Projection registra:

- id e versão do algoritmo;
- planos e efeitos aceitos;
- população;
- parâmetros;
- avaliações incluídas e excluídas;
- resultado, cobertura e incerteza.

Projeções iniciais:

- `editorial-work-ranking-v1`, preservando OpenSkill;
- `absolute-quality-v1`;
- `coverage-and-uncertainty-v1`;
- `perspective-map-v1`;
- `revision-attention-v1`;
- projeções de mídia separadas.

Uma fórmula nova cria outra versão da Projection; nunca reescreve Evaluation.

### 4.5. RevisionRecommendation

Recomendação editorial derivada, sem autoridade de mutação. Ela aponta Work,
Expressions e Revisions relevantes e explica:

- qualidade estimada;
- incerteza e cobertura;
- staleness;
- críticas convergentes;
- leituras divergentes e contraevidência;
- tipo e foco sugeridos de intervenção.

O pior colocado não é automaticamente a maior prioridade. A recomendação pode
concluir que faltam dados e pedir novas avaliações.

## 5. Um único fluxo público

A superfície canônica é deliberadamente pequena:

| Comando          | Uso                                                       |
| ---------------- | --------------------------------------------------------- |
| `hronir run`     | iniciar ou retomar e executar avaliações                  |
| `hronir status`  | inspecionar trabalho pendente sem mutação                  |
| `hronir doctor`  | validar corpus, planos, assignments e evaluations          |
| `hronir report`  | consultar projections e recommendations                    |

`run` suporta três adapters sobre o mesmo serviço:

- interação humana no terminal;
- protocolo estruturado por stdio/JSON para agentes;
- flags não interativas para automação e CI.

Não há `init` obrigatório, fechamento manual de sessão nem sequência de nomes
de comandos. Erro de validação preserva o rascunho; interrupção retoma o mesmo
Assignment; stopping rule encerra a rodada.

Comandos antigos permanecem apenas durante a migração e saem da documentação
principal imediatamente. `select`, `prune`, `flatten`, duelo de versões e
edição automática não pertencem ao fluxo novo.

## 6. Escrita pelo okf-parser

O Hrönir não serializa frontmatter. `hronir run` compõe os serviços oficiais:

1. `okf-parser import` cria Assignment;
2. `okf-parser import` cria Evaluation append-only;
3. `okf-parser apply` reconcilia o estado operacional do Assignment;
4. `check`/`doctor` validam o resultado.

Uma transição típica é relacional:

```sql
UPDATE "Assignment" AS a
SET status = 'completed'
WHERE status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM "Evaluation" AS e
    WHERE e.assignment = a.__okf_path
  )
```

`apply` altera somente Assignment. Evaluation é imutável. Preview e commit usam
o mesmo serviço e a versão do parser é fixada.

Se o processo cair depois do import da Evaluation e antes do apply, o próximo
`run` reconcilia a relação. Se repetir a submissão, a identidade determinística
da Evaluation transforma a operação em colisão reconhecível, não em duplicata.

Adapters CLI e MCP podem mudar sem alterar esse contrato. As anotações de efeito
do MCP são descritivas; autorização continua pertencendo ao host e ao workflow.

## 7. Compatibilidade e migração

### Manter

- rate files históricos;
- perspectivas, humor e glifo como proveniência;
- idioma do conteúdo e da crítica;
- identidade do agente/modelo;
- guardrails específicos do `doctor`;
- OpenSkill como Projection de compatibilidade;
- rankings textual e musical separados;
- capacidade de retomar sem duplicar trabalho.

### Remover do fluxo vivo

- `selection.ts` e artefatos `versions-selected/pruned/history`;
- `pickVersionDuel` e `computeVersionRatings`;
- `select`, `prune` e `flatten`;
- sibling drafts;
- `draft-worst`/`draft-commit` como mutação do corpus;
- páginas e documentação que tratam versões concorrentes como domínio vivo.

O histórico continua consultável pelo ledger da #1483. Nenhum rate file é
apagado ou reserializado.

## 8. Fases da pilha

1. **RFC e contratos** — esta decisão, specs e fixtures.
2. **EvaluationPlan e efeitos** — planos iniciais e isolamento testado.
3. **Assignment/Evaluation** — import, retomada e idempotência.
4. **`hronir run`** — fluxo único humano e estruturado.
5. **Projections** — paridade com ranking atual, cobertura e lentes.
6. **Recommendations** — fila explicável sem mutação.
7. **Remoção do legado** — seleção, version duel e comandos antigos.
8. **Superfícies públicas** — proveniência, cobertura e incerteza.

Cada fase é uma PR draft empilhada. A revisão conjunta é solicitada quando a
pilha já contém uma fatia vertical: contrato, runner idempotente, uma Projection
com paridade e Recommendation sem mutação.

## 9. Cenários obrigatórios

1. Uma pessoa nova completa uma avaliação conhecendo apenas `hronir run`.
2. Uma execução interrompida retoma o mesmo par, idioma, lente e revisão.
3. Dupla submissão não cria duas Evaluations.
4. Uma leitura afetiva não altera o ranking editorial.
5. Uma Work bilíngue registra qual Expression foi observada e a política de
   roll-up usada.
6. Uma Evaluation permanece reproduzível após o conteúdo corrente mudar.
7. Uma recomendação apresenta evidência favorável, contrária e dados ausentes.
8. Uma avaliação de áudio nunca entra em Projection textual.
9. Um rate file histórico sem novos campos continua legível sem dados
   fabricados.
10. Falha entre `import` e `apply` converge no próximo `run`.

## 10. Critérios de aceite

A migração termina quando:

- a rotina principal usa apenas `run`;
- Plan, Assignment e Evaluation são conceitos OKF validados;
- toda Evaluation nova aponta para alvos exatos;
- escrita de conceitos passa exclusivamente pelo okf-parser;
- o ranking de compatibilidade reproduz o resultado anterior;
- efeitos incompatíveis são excluídos por contrato;
- recomendações não alteram o corpus;
- o build não depende de seleção de versões;
- documentação e CLI não recomendam o ciclo legado;
- rate files e URLs históricas permanecem preservados conforme os gates da RFC
  0019.

## 11. Alternativas rejeitadas

### Expor um comando para cada conceito do domínio

Rejeitada. A separação interna é necessária; tornar o usuário responsável por
orquestrá-la apenas substitui a cerimônia antiga por outra.

### Manter o vencedor derivado obrigatoriamente das estrelas

Rejeitada. Preferência relativa, qualidade absoluta, confiança e
incomparabilidade são observações distintas.

### Fazer todo julgamento alimentar o ranking global

Rejeitada. Lentes respondem perguntas diferentes. O plano de efeitos impede
contaminação acidental.

### Editar automaticamente o último colocado

Rejeitada. Ranking raso ou incerto não sustenta essa ação. O Hrönir recomenda;
Git/PR governa a revisão.

### Criar um writer OKF no Hrönir

Rejeitada. `okf-parser import/apply` já oferece compilação relacional,
preview, validação e writeback round-trip. Duplicar isso recriaria duas fontes
de semântica e segurança.
