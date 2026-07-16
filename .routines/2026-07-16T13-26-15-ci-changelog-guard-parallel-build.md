---
date: "2026-07-16T13:26:15Z"
branch: claude/session-t6pk4n
status: open
---

# Sessão 2026-07-16T13-26-15 — CI: guarda de changelog + build em paralelo

Pedido do dono: fazer o CI checar se o bump de versão em `package.json` e a
entrada de changelog correspondente estão presentes, e avaliar como deixar o
CI mais rápido.

## O que foi feito

1. **`scripts/check-changelog.mjs`** (novo, `npm run check:changelog`, passo
   "Changelog and version check" no `check.yml`) — checa as duas direções da
   convenção "`package.json`'s version é a fonte única" (ver
   `changelog/0.1.0.md`):
   - versão atual de `package.json` sem `changelog/<versão>.md`
     correspondente → erro (bump sem changelog);
   - `changelog/<versão>.md` descrevendo uma versão à frente da atual em
     `package.json` → erro (changelog sem bump);
   - frontmatter de cada entrada validado: campos obrigatórios
     `type`/`version`/`date`/`description`, `type` igual a `"Changelog
     Entry"`, e `version` do frontmatter batendo com o nome do arquivo.
   - Testado manualmente as duas direções de falha antes de integrar ao CI
     (ambas disparam com a mensagem certa).

2. **`check.yml` dividido em dois jobs paralelos** — `check` (hygiene,
   changelog, depcheck, prettier, lint, testes, hronir select/doctor, guard
   de deleção de rate file, link check, translation check, astro check) e
   `build` (classify scope, cache, `npm run build`, Lighthouse CI), sem
   dependência entre eles. Antes rodavam em série no mesmo job — build local
   sozinho já leva ~2min, e Lighthouse (3 runs × 5 páginas) some em cima
   disso; medido localmente para calibrar a decisão (`time npm run build`).
   Como um não depende do resultado do outro, paralelizar corta o tempo de
   espera da PR para o máximo dos dois em vez da soma. `build` continua
   pulando build/Lighthouse pra PRs `routines_only` (mesma lógica de
   "Classify PR scope" de antes) e não roda em push (só PR — Deploy já
   builda o mesmo commit depois).
   - Trade-off registrado em comentário no workflow: numa PR que falha em
     lint/prettier/etc., o job `build` ainda roda até o fim (antes o job
     único abortava cedo nesse ponto e nunca chegava no Build). Aceitável
     aqui porque minutos de Actions são de graça em repo público — o que
     importa é o tempo de espera, não o consumo.
   - Não verificado se há branch protection exigindo checks nomeados
     especificamente (não tenho acesso às settings do repo por aqui); o job
     `check` manteve o mesmo id de antes de propósito, mas o novo job
     `build` é um nome novo — se havia required status check apontando pro
     antigo step "Build" dentro do job único, vale conferir/ajustar nas
     settings do GitHub depois do merge.

## Validação local

- `npm run check:hygiene`, `npm run check:changelog` — verdes.
- `npx prettier --check .` nos arquivos tocados — verde.
- YAML do `check.yml` validado (`js-yaml`) depois da divisão em dois jobs.
- `check-changelog.mjs` testado manualmente contra os dois casos de erro
  (bump sem changelog, changelog sem bump) num diretório escrachado fora do
  repo, antes de integrar.

## O que ficou pra próxima

- Confirmar nas settings do GitHub se branch protection precisa passar a
  exigir também o novo job `build` como required status check (hoje só
  `check` provavelmente está marcado).
- Se quiser reduzir ainda mais o tempo do job `build`: `numberOfRuns: 3` no
  Lighthouse (calibrado pra reduzir ruído — ver comentário em
  `.lighthouserc.cjs`) é o próximo maior custo depois do build em si; não
  mexi nisso agora por ser uma troca de sinal vs. ruído, não só velocidade.
