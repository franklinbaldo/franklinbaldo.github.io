# Rotina de agente UX/UI — pequenas melhorias de interface

Execute uma rodada de melhoria de UX/UI: escolha um item pequeno e bem
escopado do backlog, implemente, valide, abra PR e mescle. Esta rotina cobre
qualquer melhoria de interface, acessibilidade, i18n de UI ou performance
percebida pelo leitor — não é específica de uma feature. Sessões Hrönir (ver
`docs/hronir-agent-routine.md`) e a edição do pior post (ver
`docs/hronir-edit-worst-routine.md`) são rotinas **separadas**; não misture.

## Antes de começar

Confirme que está dentro do checkout do repositório
(`git rev-parse --show-toplevel` deve apontar para `franklinbaldo.github.io`).
Se não estiver, clone antes de prosseguir:

```bash
git clone https://github.com/franklinbaldo/franklinbaldo.github.io.git
cd franklinbaldo.github.io
npm ci
```

## 0. Revisar e mesclar PRs abertos

Liste os PRs abertos. Para qualquer PR desta rotina com CI verde, sem
conflitos e sem revisões bloqueantes, mescle com **squash**, o método habilitado
e canônico do repositório (via MCP: `mcp__github__merge_pull_request` com
`merge_method: squash`).

## 1. Escolher o item de trabalho

O backlog vive como **issues do GitHub com a label `routine`** (não em
arquivo). Liste com:

```
mcp__github__list_issues:
  owner: franklinbaldo
  repo: franklinbaldo.github.io
  state: OPEN
  labels: ["routine"]
  orderBy: CREATED_AT
  direction: ASC
```

Priorize:

1. `priority:media` (ou mais alta) antes de `priority:baixa`.
2. Issues mais antigas primeiro dentro da mesma prioridade (evita que um item
   fique esquecido no fundo do backlog).
3. Um item **pequeno e verificável** por sessão — várias sessões de 1–2
   issues bem verificadas valem mais que uma sessão tentando fechar o
   backlog inteiro. Prefira 1–2 issues por rodada; feche mais só se forem
   triviais e não conflitarem entre si.

Se o backlog estiver com menos de ~10 issues abertas com label `routine`,
abra 2–3 novas ao final da sessão (ver seção 6) para não deixar a rotina
sem combustível na próxima run — siga o mesmo formato das issues existentes
(Rationale / O que fazer / Invariantes).

## 2. Atualizar main e criar branch

```bash
git checkout main && git pull origin main
BRANCH="ux-ui/run-$(date -u +"%Y-%m-%dT%H-%M-%S")"
git checkout -b "$BRANCH"
```

## 3. Implementar

Ao editar componentes/páginas Astro:

- **Paridade i18n é invariante em quase todo item deste backlog.** Qualquer
  string nova visível ou lida por screen reader precisa de contraparte
  EN/PT — inline ternário (`lang === 'pt' ? '...' : '...'`) é o padrão já
  usado no repo para strings pequenas e locais a um componente; o sistema
  `t(lang, 'chave')` em `src/lib/i18n.ts` é para strings compartilhadas
  entre várias páginas. Não crie uma terceira convenção.
- Labels dinâmicos setados via `setAttribute` em `<script>` client-side não
  têm acesso ao `lang` do servidor — exponha o dicionário já traduzido via
  `data-*` no elemento (ex. `data-labels={JSON.stringify(L)}` ou
  `data-play-label`/`data-pause-label` diretos) e leia do `dataset` em vez
  de hardcodar a string no script.
- Não introduza dependência nova sem necessidade clara — a maioria destas
  issues é resolvível com HTML/CSS/JS do próprio repo.
- Não regrida o que já funciona: se a issue toca um componente usado em
  várias páginas (Header, GlobalMusicPlayer, PageLayout), confira o efeito
  em pelo menos uma página EN e uma PT depois do build.

## 4. Validar

```bash
npx astro check      # 0 erros novos (warnings pré-existentes não bloqueiam)
npx prettier --check .
npm run build         # confirma build completo, incl. prebuild/pregen e pagefind
```

Depois do build, confira o HTML gerado para a string/atributo que você
mudou, em pelo menos uma página EN (`dist/...`) e uma PT
(`dist/pt/...`) — `grep` é suficiente para confirmar que o valor certo
foi renderizado no idioma certo.

## 5. Journal, commit e PR

```bash
TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-ux-ui-run.md" <<EOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---

# Sessão ${TIMESTAMP} — UX/UI

Issues fechadas: #<N>, #<N>
O que foi feito: <resumo curto>
CI local: astro check ✅ · prettier ✅ · build ✅
EOF

git add .routine/ .routines/ src/
git commit -m "ux: <resumo curto> (#<N>)"
git push -u origin HEAD
```

Abra o PR referenciando as issues fechadas (`Closes #<N>`):

```
mcp__github__create_pull_request:
  owner: franklinbaldo
  repo: franklinbaldo.github.io
  title: "ux: <resumo curto>"
  head: <BRANCH>
  base: main
```

## 6. Reabastecer o backlog (se necessário)

Se o passo 1 encontrou menos de ~10 issues abertas com label `routine`, abra
2–3 novas ao final da sessão. Boas fontes de novos itens:

- Auditoria manual de 2-3 páginas do site (home, um post, `/archive/`,
  `/ranking/`) em busca de inconsistência i18n, contraste, foco de teclado,
  ou CLS.
- `docs/reviews/` e `.routines/*-seo-*`/`*-a11y-*` anteriores, para padrões
  já identificados mas não resolvidos em outras partes do site.

Use o mesmo formato das issues existentes: Rationale (por que importa, com
referência a arquivo/linha quando possível) / O que fazer (passos concretos)
/ Invariantes (o que não pode quebrar). Label `routine` + `priority:baixa`
ou `priority:media`.
