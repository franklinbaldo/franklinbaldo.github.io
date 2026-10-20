# Repo Factory — rede multiagente (RFC greenfield)

Status: proposta de arquitetura com primeira entrega visual em branch.
Escopo: repositórios públicos, sem coleta ou exposição de dados privados.

## Objetivo

Claude, Codex, Antigravity, Jules e futuros agentes precisam aparecer como **nós de primeira classe** conectados a tarefas, repositórios, execuções e artefatos. O objetivo não é apenas visualizar marcas: é acompanhar agentes reais, coordenar trabalho e reproduzir acontecimentos com proveniência verificável.

## Modelo de grafo

Separar identidades em vez de representar um provedor como um único trabalhador:

| Tipo de nó | Identidade | Exemplo |
| --- | --- | --- |
| `agent_provider` | Provedor/família de integração | `claude`, `codex`, `antigravity`, `jules` |
| `agent_session` | Instância observada de trabalho | Execução específica, identificada pela fonte |
| `task` | Trabalho atribuído | Issue, pedido ou tarefa externa |
| `repository` | Unidade de código | `franklinbaldo/pink` |
| `execution` | Máquina que executa ferramentas/testes | GitHub Actions, serviço remoto |
| `artifact` | Resultado verificável | Commit, PR, teste, release |
| `human` | Revisão ou aprovação humana | Responsável autorizado |

Arestas tipadas: `instance_of`, `assigned_to`, `works_on`, `produced`, `reviews`, `runs_on`, `delegates_to`, `depends_on`, `blocked_by`. Cada aresta deve trazer evidência concreta, época de observação e fonte. **Menção textual a Claude ou Jules não é prova de autoria nem de execução**.

## Semântica de observação

- `catalogued`: há um caminho de integração documentado, mas nenhuma telemetria implementada. **Não significa offline nem idle**.
- `connected`: adaptador autenticado e capaz de consultar estado, não implica trabalho em andamento.
- `observed`: pelo menos uma sessão foi identificada por fonte confiável.
- `running`, `waiting`, `blocked`, `completed`, `failed`: exclusivamente estados de sessões reportados pela origem, com timestamp e validade explícita.
- `unknown`/ `stale`: uma consulta falhou ou passou do TTL. **Nunca converter silêncio em inatividade**.

Provider node = portal de entrada para instâncias; agente ativo = sessão observada distinta. Múltiplas sessões de um provedor devem ser renderizadas como nós individuais ou um agrupamento expansível, não agregadas num único falso worker.

## Registro de eventos (contrato proposto)

Internamente, um registro append-only deve conservar todas as observações, inclusive retificações. Idempotência por `(source, native_event_id, payload_hash)`; observações repetidas com mesmo conteúdo acrescentam um timestamp de observação, sem apagar versões anteriores.

Exemplo ilustrativo de evento **não real**:

```json
{
  "schemaVersion": "repo-factory-agent-event-v1",
  "source": "jules_api",
  "providerId": "jules",
  "nativeSessionId": "example-redacted",
  "taskRef": "github:franklinbaldo/pink#123",
  "repo": "franklinbaldo/pink",
  "kind": "session_state_observed",
  "state": "waiting",
  "occurredAt": "2026-10-20T10:00:00Z",
  "observedAt": "2026-10-20T10:03:00Z",
  "evidenceRef": "provider-private-session-record",
  "visibility": "private"
}
```

A projeção pública **não deve publicar** `nativeSessionId`, logs, prompts, credenciais ou referências privadas. Só inclui artefatos públicos demonstráveis, com URL de GitHub válida e evidência. `public` e `private` devem ser separados antes do build, não apenas ocultados no CSS.

## Adaptadores possíveis

| Provedor | Integração inicial | Evidência de estado |
| --- | --- | --- |
| Claude Code | Claude Agent SDK / Claude Managed Agents, opção GitHub Actions | Eventos da sessão + PRs vinculadas |
| Codex | Codex SDK / app-server ou Agents API | Eventos da tarefa/sessão + commits e PRs |
| Antigravity | Gemini Interactions API / SDK (e MCP remoto, quando aplicável) | ID de interação, status e artefatos |
| Jules | Jules REST API, com GitHub app configurado | Sources, sessions, activities e PRs |
| Outros | Adaptador plugável | Identidade e eventos verificáveis |

Fontes oficiais de integração:
- https://platform.claude.com/docs/en/cli-sdks-libraries/overview
- https://developers.openai.com/blog/codex-as-a-platform
- https://developers.openai.com/api/docs/guides/agents
- https://ai.google.dev/gemini-api/docs/antigravity-agent
- https://jules.google/docs/api/reference/

## Pipeline e limites operacionais

```
APIs dos provedores + GitHub
  -> adaptadores isolados (segredos apenas no servidor)
  -> log versionado append-only
  -> normalização de identidades e reconciliação
  -> projeção pública sanitizada + snapshot histórico
  -> Repo Factory: Live / Replay / Sandbox
```

A VM Jatobá deve atuar exclusivamente como control-plane leve. Builds, testes, checkouts e agentes pesados usam ambientes remotos apropriados. O browser do GitHub Pages nunca recebe tokens. Execuções remotas têm limites de orçamento, timeout, concorrência e escopo de permissão. Operações mutáveis precisam de autorização explícita, isolamento por repositório, audit trail e tratamento de falhas/retries.

## Plano incremental

1. **Catálogo/portais visuais**: quatro provedores destacados no mapa, distinguindo explicitamente ausência de telemetria de agente parado. Primeira entrega deste PR.
2. **Identidade e eventos**: implementar adaptador Jules como primeiro caso (REST API), sob configuração segura; documentar testes com fixtures sintéticas.
3. **Sessões e arestas verificadas**: vincular somente sessões e PRs cuja atribuição possa ser demonstrada; expor `unknown` quando incompleto.
4. **Replay**: persistir versões e tempos sem reescrever a história.
5. **Sandbox**: simular atribuições e custos sem alterar o GitHub; diferenciar simulação de fato.
6. **Operate**: orquestração com aprovação, orçamento e política de merge seguro.

## Critérios de aceite desta primeira entrega

- Claude, Codex, Antigravity e Jules aparecem como nós distintos no mapa público quando existem repositórios no snapshot.
- O mesmo catálogo é consumido pelos renderizadores Astro e Zola, sem duplicação de metadados.
- Não existe falsa ligação agente↔repositório nem alegação de sessão ativa.
- Links são para documentação oficial; nenhum segredo é incluído.
- O layout dos repositórios continua navegável e os caminhos de interação anteriores permanecem preservados.
- Não existe alteração da versão do contrato `repo-factory-v1` nem quebra de consumidores da projeção de repositórios.
