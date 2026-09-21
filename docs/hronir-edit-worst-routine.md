# Rotina de agente Hrönir — revisão editorial diária

Esta rotina substitui o antigo fluxo `draft-worst`/Node. Não existe mais um
comando Hrönir que escolha, crie ou registre um rascunho em nome do agente.

O agente trabalha diretamente sobre os artefatos versionados e usa a evidência
Hrönir já registrada para escolher uma revisão editorial útil.

## 0. Começar do main atual

```bash
git switch main
git pull --ff-only
BRANCH="hronir/edit-worst-$(date -u +"%Y-%m-%dT%H-%M-%S")"
git switch -c "$BRANCH"
```

## 1. Escolher o candidato

Leia a evidência atual em `.routines/hronir/rates/` e, quando útil, as projeções
de ranking já versionadas/publicadas pelo site. Priorize um trabalho com evidência
suficiente de fraqueza e críticas concretas recorrentes.

Não execute `npm run hronir:draft-worst`, `hronir:select`,
`hronir:draft-commit`, `hronir:end` ou `hronir:doctor`.

A seleção deve ser justificável pela evidência existente, não apenas pela posição
ordinal de um snapshot.

## 2. Ler as críticas antes de editar

Localize todas as avaliações relevantes para a chave do post, incluindo
`Hronir Evaluation` e `Rate File` legados. Leia `review_a`, `review_b` e
`clash`, distinguindo críticas recorrentes de preferências isoladas de uma única
perspectiva.

Leia também:

- `scripts/hronir/skills/franklin-blog/SKILL.md`;
- `scripts/hronir/skills/franklin-essay/SKILL.md` quando o texto for
  argumentativo-formal.

## 3. Criar a nova versão diretamente

Preserve a versão publicada e crie um novo arquivo de versão no mesmo diretório,
seguindo a convenção já existente do post. Copie o conteúdo atual e edite o novo
arquivo; não altere retroativamente uma versão que já recebeu avaliações.

A revisão deve responder às críticas concretas que motivaram a escolha. Não faça
polimento cosmético só para produzir atividade.

## 4. Validar conhecimento OKF

A rotina editorial não reintroduz um CLI Hrönir. Para qualquer artefato OKF
criado ou alterado, o gate é `okf-parser`, no mesmo padrão da rotina de
avaliação. Se a revisão produzir uma nova avaliação, use
`type: Hronir Evaluation` e complete-a pelo ciclo de diagnósticos
`OKF011` até ficar conforme.

Os checks normais do blog continuam sendo usados para garantir que o site
renderiza; eles não são a máquina de estado do Hrönir.

## 5. Registrar a decisão

Crie um journal em `.routines/` explicando:

- qual trabalho foi escolhido;
- qual evidência Hrönir sustentou a escolha;
- quais críticas a revisão tentou resolver;
- qual nova versão foi criada.

Crie também o change card obrigatório em `changelog/changes/`, faça commit,
push e abra PR. A versão anterior permanece disponível para comparação e
proveniência.
