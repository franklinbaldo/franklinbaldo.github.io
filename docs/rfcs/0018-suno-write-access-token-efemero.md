# RFC 0018 — Acesso de escrita ao Suno via token efêmero fornecido pelo usuário

|                 |                                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Proposta                                                                                                                                                                                             |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                  |
| **Criado em**   | 2026-07-15                                                                                                                                                                                           |
| **Branch / PR** | `claude/suno-curator-skill-qp7kkz`                                                                                                                                                                   |
| **Depende de**  | Skill `suno-curator` (`.claude/skills/suno-curator/SKILL.md`) — esta RFC define a exceção à fronteira "escrita só no blog" declarada lá. RFC 0006 (music posts flat), RFC 0011 (genre vs sunoStyle). |
| **Afeta**       | `.claude/skills/suno-curator/SKILL.md`, `scripts/suno/**` (novo), `.gitignore`, `CLAUDE.md`, `package.json` (scripts)                                                                                |

> Mesmo padrão das RFCs anteriores: primeiro o documento, depois a
> implementação faseada, cada fase verde antes da próxima. Merge com merge
> commit, nunca squash.

---

## Histórico de revisões

| Data       | Mudança         |
| ---------- | --------------- |
| 2026-07-15 | Versão inicial. |

---

## 1. Motivação

A skill `suno-curator` (mergeada/em revisão no PR #1212) desenha o curador
com uma fronteira dura: **o agente lê o Suno e escreve só no blog; qualquer
ação no lado Suno é recomendação ao Franklin, nunca ação.** Essa fronteira foi
escolhida não por princípio, mas por ausência de caminho: o Suno não tem API
oficial (nenhum console de dev, nenhuma página de API key, nenhuma doc pública
— confirmado em jul/2026; o programa de parceiros é curado e sem self-serve).

Mas há um subconjunto de ações que o curador naturalmente quer executar e que
hoje só existem como texto num relatório:

- renomear uma faixa cujo título no Suno diverge do post;
- publicar/despublicar um clipe;
- (re)organizar playlists para refletir uma curadoria proposta;
- corrigir metadados de estilo/gênero na origem.

Esta RFC propõe um caminho **estreito e seguro** para essas escritas, sem
armazenar credencial durável e sem habilitar autonomia: o usuário, presente
na sessão, captura um token efêmero do próprio browser logado e o entrega ao
agente por variável de ambiente, para uso dentro da janela de validade.

Esta RFC é deliberadamente conservadora: seu objetivo primário é **registrar
a ideia, os desafios e as questões em aberto** para decisão do dono, não
comprometer o repo com um cliente de escrita antes de os riscos serem aceitos.

## 2. O modelo de autenticação do Suno (o que sabemos)

O Suno usa **Clerk** para autenticação. A API interna
`studio-api-prod.suno.com` — o mesmo backend que o site usa e que já
consumimos em leitura (`src/lib/suno.ts`, `scripts/generate-music-posts.mjs`)
— aceita, em operações autenticadas, um header:

```
Authorization: Bearer <JWT>
```

Existem **dois segredos distintos**, com perfis de risco opostos:

| Segredo                                             | Vida útil        | Renovável pelo agente? | Risco se vazar / for guardado               |
| --------------------------------------------------- | ---------------- | ---------------------- | ------------------------------------------- |
| **Bearer JWT**                                      | minutos          | não (expira sozinho)   | Baixo — janela curta, morre sem intervenção |
| **Cookie de sessão Clerk** (`__session`/`__client`) | longa, renovável | sim                    | **Alto — equivale à senha da conta**        |

A distinção load-bearing desta RFC: **o eixo não é leitura-vs-escrita, é
interativo-vs-autônomo.** Escrita interativa precisa só do Bearer JWT
efêmero. Escrita autônoma (agendada, sem o usuário presente) precisaria do
cookie durável — e é justamente esse que não queremos tocar.

## 3. Proposta

### 3.1. Escopo: só escrita interativa, com o usuário presente

O agente **nunca** obtém, renova ou armazena o cookie de sessão Clerk. O único
segredo que entra no sistema é o Bearer JWT efêmero, fornecido pelo usuário a
cada janela.

### 3.2. Fluxo de captura (sem committar nada)

1. Franklin, logado em suno.com, abre DevTools → aba **Network** → clica em
   qualquer request para `studio-api-prod.suno.com` → copia o valor do header
   `Authorization: Bearer …`.
2. `export SUNO_TOKEN='eyJ…'` no shell da sessão (ou num `.env` local — já
   gitignorado, `.gitignore:23`).
3. O agente roda scripts em `scripts/suno/` que leem `process.env.SUNO_TOKEN`.
   O token **nunca** é escrito em disco versionado, logado, nem incluído em
   commits, PRs ou relatórios.
4. Quando o token expira (minutos), o script falha com uma mensagem clara
   ("token expirado, recapture"); Franklin recola um novo.

### 3.3. Plumbing segura primeiro (fase testável, sem escrita)

Antes de qualquer operação de escrita:

- `scripts/suno/client.mjs` — wrapper de fetch que injeta o Bearer, trata
  401 (token inválido/expirado) e 429 (backoff, como o cliente de leitura).
- `scripts/suno/verify-token.mjs` (`npm run suno:verify`) — bate num endpoint
  autenticado conhecido (ex. `/api/billing/info/` ou o perfil próprio) só para
  confirmar "o token é válido agora". Não muda nada. Serve de smoke test e de
  documentação executável do formato do token.

Essa fase é segura, testável e não depende de descobrir endpoint de escrita
nenhum. Ela pode entrar mesmo que as fases de escrita fiquem paradas.

### 3.4. Escrita: uma operação por vez, capturada do request real

Como não há doc de escrita (§4.1), cada operação é implementada **capturando
o request real uma vez**: Franklin executa a ação manualmente no site com a
Network tab aberta, o agente lê método + rota + corpo, e codifica um comando
`scripts/suno/<acao>.mjs` em cima daquele formato. Nada de adivinhar rotas.

Ordem sugerida (da mais baixa consequência para a mais alta):

1. renomear faixa (reversível, baixo impacto);
2. editar metadados de estilo/gênero;
3. publicar/despublicar clipe;
4. operações de playlist.

Operações destrutivas (deletar clipe) ficam **fora de escopo** desta RFC.

### 3.5. Relação com a skill

A skill `suno-curator` mantém "escrita só no blog" como **default**. Esta RFC
cria uma **exceção explícita e gated**: o modo de escrita Suno só é permitido
quando (a) `SUNO_TOKEN` está presente no env e (b) Franklin pediu a ação na
sessão. Ausente o token, o comportamento é idêntico ao de hoje — recomendação,
nunca ação. A skill ganha uma seção documentando isso e apontando para
`scripts/suno/`.

## 4. Desafios

### 4.1. Não há endpoints de escrita documentados

`studio-api-prod` é backend privado. As rotas de escrita não são públicas,
podem mudar sem aviso, e só são descobríveis por inspeção da Network tab. Toda
operação de escrita é, por construção, **frágil a mudanças unilaterais do
Suno**. Mitigação: implementar por captura de request real, versionar o
formato observado num comentário do script, e falhar ruidosamente (não
silenciosamente) quando o formato quebrar.

### 4.2. Vida útil do token vs. duração de uma sessão

O Bearer expira em minutos. Uma sessão de curadoria longa vai atravessar
várias expirações. Mitigação: operações idempotentes e re-executáveis; o
`client.mjs` detecta 401 e pede recaptura em vez de falhar de forma opaca. Não
tentamos renovar automaticamente — renovação exigiria o cookie durável (§2),
que é justamente o que evitamos.

### 4.3. Termos de Serviço

Automatizar o backend privado do Suno provavelmente fere os ToS. O risco é
baixo para uso pessoal, pontual, na própria conta, com o dono presente — mas
existe e é real. **Decisão do dono**, registrada aqui explicitamente. Esta RFC
não afirma conformidade; afirma que o risco foi exposto e aceito (ou não).

### 4.4. Higiene do segredo

Um Bearer no `.env` ou no env do shell pode vazar por: log acidental, inclusão
em mensagem de commit/PR, echo em output de erro, ou screenshot. Mitigações:
`.env` já gitignored; o `client.mjs` nunca loga o header; scripts redigem o
token de qualquer erro que propaguem; `check:hygiene` pode ganhar um guard que
recusa qualquer string começando com um prefixo de JWT Suno em arquivos
rastreados (ver §6). GitGuardian no CI é uma segunda linha.

### 4.5. Autonomia é uma porta que não queremos abrir

A tentação natural depois de (3.4) funcionar é agendar o curador para rodar
sozinho. Isso exigiria o cookie durável e cruzaria a fronteira que esta RFC
protege. A RFC deixa registrado: **modo autônomo de escrita Suno é
explicitamente não-objetivo** e exigiria uma nova RFC que enfrente o
armazenamento de credencial durável de frente.

### 4.6. Verificação difícil

Ao contrário do resto do repo, escrita Suno **não é testável em CI** (precisa
de token vivo e muda estado externo). A verificação é sempre manual, na
sessão, com o dono confirmando o efeito no site. Os scripts devem imprimir o
antes/depois (via um GET de leitura) para tornar o efeito auditável.

## 5. Questões em aberto

1. **Qual a primeira operação de escrita?** A implementação de escrita só
   começa quando Franklin escolher o alvo concreto (renomear? playlist?
   publicar?). Até lá, só as fases 0–1 (plumbing + verify) fazem sentido.
2. **O Bearer JWT é o formato certo, ou o Suno já migrou para outro esquema
   (ex. token de sessão Clerk em header próprio)?** A fase de `verify-token`
   confirma isso empiricamente antes de qualquer escrita.
3. **Vale um guard de segredo no `check:hygiene`** (§4.4), ou GitGuardian +
   `.gitignore` bastam? Custo baixo, mas é mais uma regra a manter.
4. **Onde vive a exceção na skill** — uma seção nova em `suno-curator`, ou uma
   skill-companheira `suno-write` separada, carregada só quando o token está
   presente? Separar mantém o default de leitura limpo; unir mantém tudo num
   lugar.
5. **Registro de proveniência.** Quando o agente muda algo no Suno, isso deve
   deixar rastro no repo (ex. uma linha num journal `.routines/`)? Prós:
   auditabilidade. Contras: o Suno é a fonte, não o repo — talvez não seja
   lugar de log.
6. **Reação a quebra de formato.** Quando o Suno mudar uma rota e um script
   quebrar, o comportamento é falhar e esperar recaptura manual do formato, ou
   há um modo de "gravar novo formato" assistido? Provavelmente o primeiro,
   por simplicidade.

## 6. Plano de implementação faseado

Cada fase verde antes da próxima; fases 2+ só após decisão do dono sobre §4.3
e a questão em aberto §5.1.

- **Fase 0 — esta RFC.** Documento em `docs/rfcs/`, sem código. _(este PR)_
- **Fase 1 — plumbing segura, sem escrita.** `scripts/suno/client.mjs` +
  `scripts/suno/verify-token.mjs` (`npm run suno:verify`), lendo
  `SUNO_TOKEN`. Guard opcional de segredo no `check:hygiene`. Nada muta estado
  externo. Testável localmente com um token real; CI valida só que os scripts
  carregam e falham limpo sem token.
- **Fase 2 — primeira operação de escrita** (a escolhida em §5.1), capturada
  do request real, com dump antes/depois. Atualiza a skill com a seção da
  exceção gated.
- **Fase 3+ — operações adicionais**, uma por PR, na ordem de §3.4. Destrutivas
  permanecem fora de escopo.

## 7. Alternativas consideradas

- **Wrappers de terceiros** (musicapi.ai, sunoapi.org, etc.): geram música em
  contas deles, não editam o **seu** perfil. Inúteis para curadoria. Descartado.
- **Cookie de sessão durável armazenado** (ex. secret do GitHub Actions): daria
  autonomia, mas guarda um segredo equivalente à senha da conta num sistema que
  o dono não quer expor. Descartado — é exatamente o que §4.5 recusa.
- **Status quo (só recomendação)**: zero risco, zero capacidade de escrita.
  É o fallback se o dono recusar §4.3. Continua sendo o default da skill.
