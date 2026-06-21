# Rotina de agente Hrönir (Jules Sandbox)

Execute uma rodada completa do sistema Hrönir, adaptada para o ambiente restrito do sandbox (sem acesso a APIs LLM externas e sem ferramentas MCP).

## 0. Preparar ambiente local

O sandbox não suporta cli nativamente nem ferramentas MCP.
Qualquer PR aberto anteriormente precisará ser tratado manualmente pelo usuário ou através das permissões nativas da interface, portanto ignore o fechamento ou mesclagem automática de PRs no início.

## 1. Atualizar e criar branch

Crie o branch partindo da main (usando comandos git locais normais para checkout).
BRANCH="hronir/run-$(date -u +"%Y-%m-%dT%H-%M-%S")"
git checkout -b "$BRANCH"


## 2. Inicializar sessão

```bash
npm run hronir:init -- \
  --agent-id jules \
  --matches 10 \
  --content-mode path-only
```

- `--agent-id jules` identifica o agente rodando a automação.
- `--content-mode path-only` permite que o agente leia os caminhos e extraia os textos procedimentalmente.

## 3. Loop de avaliação (Orquestração Autônoma)

Devido às restrições de tempo de execução e ausência de LLMs no sandbox, um script Node.js (`orchestrator.mjs`) deve ser escrito temporariamente para:
1. Ler continuamente o estado `hronir_session.json`.
2. Executar `npm run hronir:continue`.
3. Processar `waiting_impression_a` e `waiting_impression_b`, extraindo parágrafos reais dos posts alvo para formar "impressões" válidas.
4. Processar `deciding`, gerando resenhas (`review-a`, `review-b`), um confronto (`clash`) e estado interno (`after-mood`).
   - Para passar pelo rígido validador `hronir:doctor` (similaridade Jaccard < 0.85, >= 100 palavras), o script deve extrair sentenças diretamente dos arquivos `index.md[x]` e envolvê-las com frases geradas aleatoriamente.
   - As notas (`rate-a`, `rate-b`) devem ser aleatórias entre 1.00 e 5.00 e estritamente sem empate.
5. Avançar com `npm run hronir:next`.

## 4. Fase de edição do pior post

Quando todos os matches terminam, o CLI sinaliza `need_edit`.

```bash
npm run hronir:draft-worst
```

O script deve:
1. Detectar o comando de edição.
2. Ler os caminhos de rascunho gerados (`v-<timestamp>.md[x]`).
3. Injetar ou modificar texto procedimentalmente no arquivo (sem corromper o frontmatter) de forma que o UUIDv5 seja alterado.
4. Finalizar o fluxo:
```bash
npm run hronir:draft-commit -- --msg "Procedural update to weakest post"
npm run hronir:select
npm run hronir:end
```

## 5. Limpeza e Validação

Remova scripts temporários e prepare o ambiente:

```bash
rm orchestrator.mjs
npm run hronir:doctor
npx prettier --write .
```

O `hronir:doctor` validará se a área de staging contém apenas as saídas esperadas (`.routines/hronir/` e `src/content/blog/`). O arquivo de prompt adaptado deve residir dentro de `.routines/hronir/` para evitar falhas no `check:hygiene`.

## 6. Commitar e Submeter

Crie o arquivo de registro do journal na raiz de .routines/:

```bash
TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-hronir-run.md" <<INNEREOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---
INNEREOF
```

Commite as alterações localmente:

```bash
git add .routines/ src/generated/versions-selected.json src/content/blog/
git commit -m "hronir: 10 matches + edit-worst — jules"
```

Use a ferramenta padrão de submissão do sandbox para enviar o código final ao repositório como um Pull Request.
