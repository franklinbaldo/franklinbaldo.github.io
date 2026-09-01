# RFC 0019 — Rearquitetura OKF-first do corpus editorial e das projeções do blog

|                      |                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**           | Draft — decisão arquitetural; implementação faseada em RFCs/PRs subsequentes                                                                                                                                  |
| **Autor**            | Franklin Baldo (proposta assistida)                                                                                                                                                                           |
| **Criado em**        | 2026-08-07                                                                                                                                                                                                    |
| **Afeta**            | `src/content/blog/**`, `data/suno-catalog.jsonl`, `.routines/hronir/**`, `scripts/hronir/**`, `src/content.config.ts`, `src/lib/**`, `src/pages/**`, `docs/okf/**`, integração com `franklinbaldo/okf-parser` |
| **Relaciona-se com** | RFCs 0014, 0015, 0017 e 0018                                                                                                                                                                                  |

> Esta RFC usa o método de redesign de folha em branco com reconciliação
> brownfield. Ela não trata a arquitetura atual como premissa; preserva apenas
> os contratos, fatos e decisões que continuam sendo restrições reais.

---

## 1. Resumo

O blog deve ser reorganizado para que o corpus editorial seja um bundle OKF
canônico. Astro, Hrönir, busca, DuckDB/Ibis, feeds e páginas de exploração
passam a ser projeções diferentes desse corpus.

Hoje o repositório já possui partes importantes do modelo:

- posts Markdown/MDX com frontmatter `type`;
- traduções relacionadas por `translationKey`;
- séries e caminhos de leitura;
- rate files do Hrönir;
- perspectivas de avaliação;
- catálogo de músicas derivado do Suno;
- versões e referências por conteúdo;
- páginas Astro que recompõem essas relações em TypeScript.

Essas partes, porém, ainda são validadas e conectadas por vários mecanismos
paralelos. A RFC propõe uma fonte semântica única, preservando os corpos
editoriais e as URLs públicas.

O objetivo não é transformar a prosa em registros rígidos. O objetivo é dar
identidade, relações, proveniência e validação determinísticas ao corpus sem
retirar a liberdade do texto.

---

## 2. Propósito

O blog existe para permitir que leitores descubram, leiam e conectem a
produção intelectual de Franklin — textos, músicas, traduções e projetos —
preservando autoria, evolução histórica, proveniência e acessibilidade, sem
transformar o conteúdo em um banco de dados ilegível.

Toda decisão desta RFC deve ser avaliada contra essa frase.

---

## 3. Estado atual relevante

A coleção Astro materializa atualmente aproximadamente 241 entradas:

- 84 entradas classificadas como `Blog Post`;
- 157 entradas classificadas como `Music Post`.

Esses números descrevem entidades da coleção, não arquivos físicos. Parte das
entradas musicais é produzida em memória pelo loader de
`data/suno-catalog.jsonl`, enquanto também existem documentos musicais
editoriais no corpus. O baseline da migração deve separar, sem somar categorias
heterogêneas:

- arquivos editoriais authored `.md` e `.mdx`;
- conceitos editoriais por tipo;
- registros Suno totais, públicos, privados e inválidos;
- entradas públicas derivadas pelo loader;
- `Work`, `Expression`, `Revision` e `Media`;
- sobreposições ou colisões entre documentos authored e registros derivados.

O estado atual já contém conhecimento que não pode ser perdido:

1. URLs públicas e links externos existentes;
2. distinção entre português e inglês;
3. histórico Git e identificadores de versões já referenciados por rate files;
4. filtro de privacidade para músicas Suno não públicas;
5. separação entre duelos editoriais e duelos de versão;
6. rankings textual e musical com critérios diferentes;
7. conteúdo Markdown, MDX, SVG, Mermaid, HTML e embeds;
8. geração estática e superfícies de SEO, RSS e busca.

O problema arquitetural não é falta de conteúdo. É a existência de várias
fontes concorrentes para fatos sobre o mesmo conteúdo:

- schema Zod do Astro;
- scripts de tradução e links;
- loaders especiais;
- normalizadores do Hrönir;
- seleção gerada de versões;
- convenções de caminho;
- campos de frontmatter interpretados por cada consumidor de forma própria.

---

## 4. Arquitetura-alvo

### 4.1. OKF como fonte semântica

O corpus canônico será composto por conceitos OKF em Markdown `.md` e MDX
`.mdx`, tratados como dialetos explícitos do mesmo modelo documental. A
localização física exata será decidida na fase de implementação, mas a estrutura
lógica será:

```text
corpus/
├── works/          # identidade intelectual estável da obra
├── expressions/    # PT, EN e outras expressões linguísticas ou formais
├── revisions/      # quando a revisão precisa ser explicitamente preservada
├── media/          # áudio, imagem, vídeo e outras manifestações
├── series/         # agrupamentos editoriais
├── paths/          # caminhos de leitura
├── perspectives/   # lentes do Hrönir
├── evaluations/    # rate files e outros juízos
├── runs/           # sessões e rodadas de avaliação
└── specs/          # especificações dos tipos do corpus
```

O diretório acima é uma organização conceitual. As raízes atuais
`src/content/blog/` e `.routines/hronir/` podem ser mantidas inicialmente.
Não haverá conversão física obrigatória de `.mdx` para `.md`: ambos poderão
ser fontes canônicas quando o parser suportar MDX como dialeto de primeira
classe.

Esse suporte deve preservar o frontmatter e o corpo exato, extrair headings e
links estáticos com semântica MDX, tornar imports, componentes e expressões
dinâmicas inspecionáveis e nunca executar JavaScript ou JSX. Conversões
individuais para `.md` continuam possíveis como limpeza editorial, mas não são
pré-requisito nem podem criar uma projeção-sombra concorrente.

Até essa capacidade existir no `okf-parser`, a Fase 1 não pode ser declarada
concluída. Uma catraca independente do discovery do parser enumerará todos os
`.md` e `.mdx` publicáveis e provará correspondência 1:1 com o inventário
OKF. `.okfignore` não poderá ocultar conteúdo publicável.

### 4.2. Conceitos fundamentais

#### `Work`

Identidade intelectual que permanece estável entre língua, formato e revisão.
Exemplo: uma determinada reflexão sobre harnesses.

#### `Expression`

Manifestação linguística ou formal de uma obra: texto em português, texto em
inglês, poema, diálogo ou outra forma editorial.

#### `Revision`

Estado histórico de uma expressão. A identidade histórica deve preservar o
conteúdo normalizado exato e sua proveniência Git, sem confundir revisão com a
identidade permanente da obra. Um mesmo estado pode ser observado em mais de um
commit; portanto, commit não é a identidade exclusiva da revisão.

#### `Media`

Música, gravação, áudio, imagem ou vídeo relacionado a uma obra ou expressão.
Uma faixa Suno não é automaticamente um novo post independente.

#### `Evaluation`

Juízo produzido pelo Hrönir ou por outro sistema editorial. Deve apontar para
as expressões/revisões efetivamente avaliadas, para a perspectiva e para o
agente que produziu o juízo.

#### `Perspective`, `Series` e `Reading Path`

Conceitos de primeira classe, não apenas listas ou strings interpretadas por
componentes Astro.

### 4.3. Identidades

O sistema deve manter três identidades distintas:

```text
identidade lógica:       work_id / translationKey compatível
identidade de expressão: expression_id / língua / forma
identidade histórica:    revision_id / normalized content hash / blob OID
```

O caminho do arquivo continua sendo uma identidade física útil ao OKF, mas não
deve substituir a identidade editorial da obra nem a identidade histórica da
revisão.

Para avaliações históricas, a resolução seguirá o contrato:

```text
(path_at_run, legacy_uuid, run_at)
    → revision_id
    → normalized_content_hash
    → blob_oid
    → observed_in_commits[]
    → introduced_by_commit, quando determinável
```

O UUID histórico permanece como fingerprint e alias de migração, não como
substituto do `revision_id`. O mesmo blob ou conteúdo pode aparecer em vários
commits ou caminhos. A resolução deve suportar os algoritmos de UUID atual,
legacy e pré-OKF e nunca pode apontar silenciosamente para a versão corrente.

### 4.4. Relações explícitas

Relações relevantes devem ser representadas por links ou campos formalmente
validados, e não apenas inferidas por convenção de nome:

- obra → expressões;
- expressão PT ↔ expressão EN;
- expressão → revisão anterior;
- obra → mídia;
- obra → série;
- caminho → obras;
- avaliação → obras/revisões;
- avaliação → perspectiva;
- avaliação → sessão;
- avaliação → agente;
- RFC/documentação → conceito implementado.

Um link no arquivo-fonte só conta como relação do bundle se a projeção também
preservar uma aresta executável no bundle analisado pelo `okf-parser`.

---

## 5. Papéis dos sistemas

```text
Corpus OKF
   ├── okf-parser: validação, grafo, inventário e DuckDB
   ├── Hrönir: seleção, avaliação e ranking
   ├── Astro: publicação e apresentação
   ├── Pagefind: busca derivada
   └── feeds/SEO: projeções derivadas
```

### `okf-parser`

Será a camada de estrutura, validação e consulta. Não decide qual post vence,
qual perspectiva é melhor ou qual texto deve ser editado.

Dependências e extensões upstream relevantes:

- `okf-parser#53`: digests de revisão e índice opcional de proveniência Git;
- `okf-parser#54`: suporte de primeira classe ao dialeto MDX;
- `okf-parser#55`: tipo default explícito e observável;
- `okf-parser#56`: adapter GraphQL opcional para consumidores;
- `okf-parser#57`: avaliação de um core Rust compartilhado, sem bloquear o
  cronograma do blog.

A Fase 1 depende funcionalmente da #54. As demais podem ser consumidas quando
estiverem maduras ou substituídas temporariamente por artefatos locais estreitos
e explicitamente derivados, sem criar uma segunda implementação do parser.

### Hrönir

Continuará responsável por:

- gerar matches;
- conduzir avaliações;
- validar reviews e evidências;
- calcular OpenSkill;
- selecionar amostras;
- produzir avaliações OKF.

O ranking textual e o ranking de áudio permanecem superfícies distintas. A
unificação é de corpus e proveniência, não de métrica.

### Astro

Será um consumidor do corpus normalizado. O schema local pode permanecer como
adaptador de apresentação durante a migração, mas não deve continuar sendo uma
segunda definição independente da taxonomia do corpus.

Astro consumirá exclusivamente o pacote TypeScript oficial do `okf-parser` ou
um artefato gerado por uma implementação oficial do parser. É proibida uma
implementação independente do parsing, do perfil, da taxonomia ou das regras de
validação OKF.

---

## 6. Músicas e Suno

O catálogo Suno continua sendo uma fonte externa de dados, mas seus registros
públicos devem ser importados como conceitos `Media` relacionados a obras.

O importador deve preservar:

- `suno_id`;
- origem e data de sincronização;
- áudio e imagem;
- duração;
- estilo;
- obra/expressão relacionada;
- estado público ou privado.

Registros privados não entram no corpus publicado nem em ranking público.

O julgamento de áudio da RFC 0018 continua separado do julgamento textual. A
relação comum é a proveniência da obra, não uma escala única de qualidade.

---

## 7. Hrönir e avaliações como dados do corpus

Cada rate file deverá ser um conceito OKF com referências explícitas a:

- os dois alvos avaliados;
- a revisão exata de cada alvo;
- a perspectiva;
- o agente/modelo;
- a sessão;
- a versão do prompt;
- o objetivo de amostragem;
- as notas;
- o vencedor;
- as resenhas;
- o clash;
- evidências concretas usadas na decisão.

O mínimo de palavras continua sendo uma proteção operacional, mas não será a
principal garantia de qualidade. O perfil Hrönir deverá futuramente exigir
evidências específicas, evitando avaliações genéricas ou intercambiáveis.

---

## 8. Reconciliação brownfield

### Manter e fortalecer

- conteúdo, prosa, dialeto e comportamento de renderização dos corpos
  Markdown/MDX, sem exigir migração de extensão;
- URLs e redirects;
- Astro e geração estática;
- traduções PT/EN;
- histórico Git;
- filtros de privacidade;
- separação entre ranking textual e musical;
- rate files existentes e seus identificadores históricos;
- manifesto congelado de resolução histórica e ledger explícito de órfãos.

### Mover para o perfil OKF/parser

- schema principal de conteúdo;
- validação de relações;
- validação de tradução;
- inventário e grafo;
- proveniência de avaliações;
- consultas analíticas.

### Reclassificar como histórico

- scripts `oneoff` de migrações já concluídas;
- campos mantidos apenas para compatibilidade histórica;
- explicações de decisões superadas por RFCs posteriores.

### Substituir gradualmente

- `translationKey` como única identidade editorial;
- loader musical invisível ao corpus do Hrönir;
- `versions-selected.json` como fonte semântica, mantendo-o apenas como
  artefato derivado durante a transição;
- validações duplicadas em Astro, scripts e Hrönir.

### Restrições que o desenho ideal não pode esquecer

O desenho OKF-first não pode:

- quebrar URLs existentes;
- publicar música privada;
- perder revisões já referenciadas;
- tratar links de site como se fossem automaticamente links de arquivo;
- misturar ranking textual com ranking de áudio;
- exigir que a prosa seja reescrita como dados estruturados;
- tornar o build dependente de uma operação externa não reprodutível.

---

## 9. Fases de implementação

### Fase 0 — especificação, baseline e proveniência histórica

- fixar o perfil OKF do corpus;
- enumerar independentemente todos os `.md` e `.mdx` publicáveis;
- inventariar as construções específicas de MDX e classificá-las como
  Markdown compatível, JSX estático ou expressão dinâmica;
- registrar quais documentos omitem `type` e definir, se necessário, uma
  política explícita e observável de tipo default;
- registrar separadamente arquivos authored, conceitos editoriais, entradas
  derivadas e registros Suno totais, públicos, privados e inválidos;
- registrar contagens atuais de obras, expressões, revisões, mídias, traduções e
  links;
- gerar e congelar o manifesto
  `(path_at_run, legacy_uuid, run_at) → revision_id → blob_oid → commits[]`
  para todos os UUIDs citados por rate files;
- registrar em ledger imutável somente os órfãos históricos que não puderem ser
  resolvidos após busca pelos algoritmos atual, legacy e pré-OKF;
- registrar ranking e snapshot atuais;
- corrigir a instalação reprodutível do blog (`package-lock.json` e versão do
  Node documentada).

**Gate:** nenhum comportamento público muda; 100% dos alvos históricos resolvem
para conteúdo exato ou constam no ledger explícito de órfãos; o baseline
distingue conteúdo authored, derivado, público e privado.

### Fase 1 — cobertura OKF de Markdown e MDX

- fixar uma versão do `okf-parser` com suporte explícito ao dialeto MDX;
- validar frontmatter, headings, links estáticos e construções dinâmicas sem
  executar o corpo MDX;
- aplicar tipo default somente como política de ingestão explícita, preservando
  `authored_type`, `effective_type` e a origem do valor;
- executar uma catraca independente que enumere todo `.md` e `.mdx`
  publicável e prove correspondência 1:1 com os conceitos inventariados;
- rodar `okf-parser check` sobre o corpus completo com os dois dialetos;
- adicionar `.okfignore` apenas para artefatos realmente não publicáveis;
- criar especificações para os tipos existentes;
- validar links e tipos.

**Gate:** todos os arquivos `.md` e `.mdx` publicáveis possuem tipo authored
ou default explícito, aparecem diretamente no inventário OKF e nenhuma relação
crítica ou construção dinâmica fica silenciosamente perdida.

### Fase 2 — relações e DuckDB

- criar relações explícitas entre traduções, séries, caminhos e revisões;
- exportar conceitos e links para DuckDB;
- reproduzir contagens, inventários e relações atuais.

**Gate:** consultas relacionais reproduzem o comportamento atual.

### Fase 3 — Hrönir

- converter rate files para o perfil `Evaluation`;
- substituir loaders de avaliação por consultas normalizadas;
- preservar os IDs históricos;
- registrar evidências futuras sem invalidar avaliações antigas.

**Gate:** ranking antigo e novo coincidem sobre o mesmo conjunto de dados.

### Fase 4 — música

- importar registros públicos do Suno como `Media`;
- ligar mídias às obras;
- adaptar o ranking de áudio sem misturá-lo ao textual.

**Gate:** nenhuma faixa privada aparece no bundle ou no site.

### Fase 5 — Astro como projeção

- substituir gradualmente o loader e os schemas duplicados;
- gerar páginas, feeds, busca e SEO a partir do corpus normalizado;
- preservar todas as URLs públicas.

**Gate:** manifesto de URLs antes/depois sem regressões não autorizadas.

---

## 10. Critérios de aceite da arquitetura

O redesenho estará validado quando:

1. todo arquivo editorial authored e toda entrada pública derivada estiverem
   contabilizados separadamente;
2. o corpus completo puder ser inventariado diretamente pelo `okf-parser`,
   com cobertura independente 1:1 dos `.md` e `.mdx` publicáveis;
3. todo alvo histórico de Evaluation resolver para a revisão exata ou para um
   órfão explicitamente registrado;
4. o grafo reproduzir relações de tradução, série, caminho e avaliação;
5. DuckDB puder responder consultas de cobertura e proveniência;
6. o ranking textual reproduzir o snapshot atual;
7. o ranking musical continuar separado;
8. o build Astro permanecer reproduzível;
9. nenhuma URL pública for perdida;
10. conteúdos privados permanecerem excluídos;
11. a origem de cada dado derivado puder ser identificada;
12. a prosa continuar sendo prosa, sem serialização destrutiva.

---

## 11. Questões em aberto

| ID  | Questão                                                                      | Decisão provisória                                                                                                                       |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | O bundle canônico terá raiz em `src/content/`, `content/` ou no repositório? | Começar com o caminho atual e adiar a mudança física.                                                                                    |
| Q2  | `Work` e `Expression` serão arquivos separados desde a primeira fase?        | Não necessariamente; começar com relações compatíveis e separar quando houver benefício demonstrado.                                     |
| Q3  | Como resolver links `/blog/...` no grafo OKF?                                | O importador deve gerar links relativos executáveis ou uma tabela de aliases validada.                                                   |
| Q4  | Como Astro consumirá o contrato OKF?                                         | Pelo pacote TypeScript oficial do `okf-parser` ou por artefato gerado por implementação oficial; nunca por reimplementação independente. |
| Q5  | Rate files antigos ganharão evidências retroativamente?                      | Não; preservar o histórico e exigir evidências somente para novas avaliações.                                                            |
| Q6  | O ranking global agregará texto e áudio?                                     | Não; haverá superfícies relacionadas, mas métricas separadas.                                                                            |
| Q7  | Astro dependerá de um servidor GraphQL?                                      | Não; GraphQL poderá ser um adapter opcional e embutido. O build estático deve continuar funcionando diretamente pelo pacote TypeScript.  |

---

## 12. Decisão solicitada

Aprovar esta RFC como direção arquitetural e iniciar pela Fase 0. Markdown e
MDX permanecerão fontes canônicas; nenhuma mudança de URL, publicação ou ranking
deve ocorrer antes dos gates correspondentes.
