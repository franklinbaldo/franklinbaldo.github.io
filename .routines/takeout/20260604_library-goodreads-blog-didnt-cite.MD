---
date: 2026-06-04
slug: library-goodreads-blog-didnt-cite
session: 10
status: done
branch: claude/keen-franklin-PtHyp
---

# Sessão 2026-06-04 — Décima sessão: "A Biblioteca Que o Blog Não Citou"

## Contexto

Décima sessão desta série iniciada em 25 de maio. Branch: `claude/keen-franklin-PtHyp`.

**Histórico da série:**

| # | Data | Arquivo | Status |
|---|------|---------|--------|
| 1 | 2026-05-25 | `20260525_march-may-2026-context-log.MD` | ✅ done |
| 2 | 2026-05-26 | `20260526_retrospectiva-marco-maio.md` | ✅ done |
| 3 | 2026-05-27 | `20260527_takeout-session-two.MD` | ✅ done |
| 4 | 2026-05-28 | `20260528_takeout-session-three.MD` | ✅ done |
| 5 | 2026-05-29 | `20260529_takeout-session-four.MD` | ✅ done |
| 6 | 2026-05-30 | `20260530_takeout-analise-abril-maio.md` | ✅ done |
| 7 | 2026-05-31 | `20260531_takeout-session-cinco.MD` | ✅ done |
| 8 | 2026-06-01 | `20260601_takeout-session-oito.MD` | ✅ done |
| 9 | 2026-06-03 | `20260603_may-in-seven-drafts.MD` | ✅ done |
| 10 | 2026-06-04 | `20260604_library-goodreads-blog-didnt-cite.MD` | ✅ done |

**Fontes primárias consultadas:**

- `takeout-20260524T140450Z-001.zip` (187 KB, ID: `1XKQxavIMvf7s91KpSwefe50DrAdQyhsv`) — confirmado novamente que contém apenas `archive_browser.html`
- Goodreads RSS público — **NOVA FONTE**: `https://www.goodreads.com/review/list_rss/5942034?shelf=read`
- Git log: commits confirmados desde última sessão (2026-06-03)
- Logs de sessões anteriores (1–9) como contexto de continuidade

---

## Novidade desta sessão: Goodreads RSS como nova fonte

A limitação central desta série — os arquivos ZIP maiores do Takeout permanecendo inacessíveis — empurrou a análise para uma fonte que estava disponível desde o início mas nunca havia sido consultada diretamente: **a estante pública do Goodreads**.

### Dados obtidos via Goodreads RSS

**Total de livros na prateleira "read"**: 100  
**Perfil**: `https://www.goodreads.com/user/show/5942034`  
**Data mais antiga com registro confirmado**: Cat's Cradle, lido em julho de 2014

**21 livros com 5 estrelas (lista completa):**

| Título | Autor | Ano |
|--------|-------|-----|
| The Anthropocene Reviewed | John Green | 2021 |
| Guns, Germs, and Steel | Jared Diamond | 1997 |
| One Hundred Years of Solitude | García Márquez | 1967 |
| The Hitchhiker's Guide to the Galaxy | Douglas Adams | 1979 |
| Death's End (Three-Body Problem #3) | Liu Cixin | 2010 |
| The Dark Forest (Three-Body Problem #2) | Liu Cixin | 2008 |
| The Three-Body Problem | Liu Cixin | 2006 |
| Longitude | Dava Sobel | 1995 |
| Galápagos | Kurt Vonnegut Jr. | 1985 (read: 2015-10-29) |
| Cat's Cradle | Kurt Vonnegut Jr. | 1963 (read: 2014-07-30) |
| Mother Night | Kurt Vonnegut Jr. | 1961 |
| Ender's Game | Orson Scott Card | 1985 |
| The Gambler | Dostoevsky | 1866 |
| Grande Sertão: Veredas | Guimarães Rosa | 1956 |
| Sophie's World | Jostein Gaarder | 1991 |
| Capitalism and Freedom | Milton Friedman | 1962 |
| Ham on Rye | Charles Bukowski | 1982 |
| The Unbearable Lightness of Being | Milan Kundera | 1984 |
| A Brief History of Time | Stephen Hawking | 1988 |
| Steppenwolf | Hermann Hesse | 1927 |
| Siddhartha | Hermann Hesse | 1922 |
| The Gospel According to Jesus Christ | José Saramago | 1991 |
| Blindness | José Saramago | 1995 |

**Livros com 4 estrelas (notáveis):**

- The Diary of a Young Girl (Anne Frank)
- The Trial + The Metamorphosis (Kafka)
- The Little Prince (Saint-Exupéry)
- The Social Contract (Rousseau)
- Critique of Pure Reason (Kant)
- Vidas Secas (Graciliano Ramos)
- Quincas Borba (Machado de Assis)
- On the Road + The Dharma Bums (Kerouac)
- All the Names (Saramago)

**Literatura brasileira identificada:**
- Grande Sertão: Veredas — Guimarães Rosa (5★)
- Vidas Secas — Graciliano Ramos (4★)
- Quincas Borba — Machado de Assis (4★)
- O Ateneu — Raul Pompéia (3★)
- Iracema — José de Alencar (2★)

**Intersecção Goodreads × Google Play Livros:**
- "Ensaio sobre a cegueira" (Play Books) = "Blindness" (Goodreads, 5★) → mesma obra, dois formatos
- "Collected Fictions" + "Fiction Complete" + "La biblioteca de Babel" + "O Aleph" (Play Books) = Borges em formato físico/digital, sem avaliações explícitas no Goodreads identificadas nesta sessão

**Padrão relevante: Saramago no Goodreads vs. no Play Books:**
- Play Books: 13 obras (foco em ficção madura: A caverna, As intermitências, O Ano da Morte de Ricardo Reis, etc.)
- Goodreads: The Gospel (5★) + Blindness (5★) + All the Names (4★) — os três com avaliação, todos da fase mais universalmente reconhecida de Saramago

---

## O que esta sessão fez

### 1. Verificação de continuidade (sessões 1–9)

Lidos os logs das sessões 8 e 9 para contexto. Confirmado que:
- "O Retrato de Dados" / "The Data Portrait" foram publicados em 2026-06-01 ✅
- "Maio em Sete Rascunhos" / "May in Seven Drafts" foram publicados em 2026-06-03 ✅
- A limitação dos arquivos grandes permanece inalterada (ver tabela abaixo)

### 2. Nova fonte: Goodreads RSS

Descoberta de que `src/pages/books.astro` + `src/components/BooksPage.astro` já integram o Goodreads RSS como fonte de dados para a página `/books/`. O feed RSS é público e foi consultado via subagente para extração dos 100 livros, ratings, e datas de leitura disponíveis.

Esta é a primeira vez em 10 sessões que uma fonte de dados além do archive_browser.html foi acessada com sucesso.

### 3. Posts escritos nesta sessão

**EN**: `src/content/blog/the-library-the-blog-didnt-cite.md`  
**PT**: `src/content/blog/a-biblioteca-que-o-blog-nao-citou.md`  
**translationKey**: `library-didnt-cite-2026`

**Ângulo central**: O Evangelho Segundo Jesus Cristo (Saramago, 5★) como ancestral metodológico de "Está Chovendo Verdade" — ambos são auditorias de cosmologias herdadas. O gesto é o mesmo: não desmontar, mas inspecionar onde se sustenta e onde racha.

**Ângulos secundários**:
- A trilogia Liu Cixin (3x 5★) como o post não escrito sobre IA e civilização
- *The Anthropocene Reviewed* (5★) como o modelo estrutural do próprio blog — Green avalia coisas; o blog audita; a dívida não foi creditada
- Steppenwolf + Siddhartha + Dharma Bums como o fio espiritual que informa "Está Chovendo Verdade" sem ser citado

**Tese**: Os seis ensaios de abril-maio não são pensamento originante — são respostas a perguntas que cem livros abriram. O blog fechou seis delas. Noventa e quatro permanecem.

---

## Estado atual das limitações (inalterado desde sessão 5)

Os dados de conteúdo real permanecem nos arquivos grandes:

| Arquivo | Tamanho | Conteúdo |
|---------|---------|----------|
| `takeout-20260524T140451Z-4-001.zip` | ~1,8 GB | Google Fit (TCX de atividades) |
| `takeout-20260524T140451Z-4-002.zip` | ~927 MB | Google Fit (continuação) |
| `takeout-20260524T151400Z-4-001.zip` | ~1,9 GB | YouTube (histórico) |
| `takeout-20260524T151400Z-4-002.zip` | ~796 MB | YouTube (continuação) |
| `takeout-20260524T140451Z-6-001.zip` | ~181 MB | Fit sessões JSON |
| `takeout-20260524T151400Z-6-001.zip` | ~186 MB | Fit sessões JSON |

A estratégia de byte-range / rclone permanece como próximo passo técnico.

---

## Backlog atualizado

### Alta prioridade

1. **Acessar arquivos `-6-001` por byte range ou rclone**: Os ~181-186 MB de sessões JSON de treino confirmariam (ou complicariam) a hipótese da lacuna de 138 dias. Requer ambiente com acesso local ao Drive.

2. **Post sobre Liu Cixin e IA**: A trilogia (5★ completa) nunca apareceu no blog. O post óbvio conecta a Floresta Negra à lógica de alinhamento de IA — o silêncio estratégico como única resposta à incerteza sobre intenções dos outros. O material existe na estante.

3. **Goodreads: explorar datas de leitura completas**: Apenas 2 datas confirmadas nesta sessão (Cat's Cradle 2014, Galápagos 2015). O RSS pode ter mais datas para outros livros. Um subagente mais focado poderia extrair a cronologia completa.

### Média prioridade

4. **Timeline da Alice**: gap de 138 dias + playlist `aniversário da Alice 1 ano` + parenting books (Geração Ansiosa, Positive Discipline, O dilema do porco-espinho). A evidência continua convergindo.

5. **O post da Bolivia/Peru**: 44 vídeos pessoais, incluindo Salar de Uyuni 360°, Chacaltaya (5.395m), Cañón del Colca, Condores. Viagem que nunca virou post. A altitude de Chacaltaya como detalhe irresistível.

6. **"Josha"**: Playlist YouTube sem contexto claro. Poderia ser artista. Os CSVs de playlists estão nos ZIPs maiores.

7. **"Meu Samba Sim Senhor"**: Único upload pessoal no YouTube Music. Composição própria ou familiar?

### Baixa prioridade

8. **Goodreads: correlacionar leituras com ensaios publicados**: Com a cronologia completa de leitura (quando disponível), mapear quais livros foram lidos próximos à data de cada ensaio relevante. A correlação Evangelho/Chovendo Verdade é de metodologia, não de data — seria interessante saber se o Evangelho foi lido recentemente ou há dez anos.

9. **Completar análise da biblioteca Play Books**: Os arquivos .html de anotações do Play Livros (marcações, destaques) estão nos ZIPs maiores. Quando acessíveis, cruzar com os ensaios publicados.

---

## Decisões metodológicas desta sessão

- **Mudança de fonte**: Esta é a primeira sessão que ultrapassa o archive_browser.html como fonte primária. O Goodreads RSS está disponível publicamente e já integrado ao repositório. As sessões anteriores poderiam ter consultado esta fonte mais cedo.

- **Goodreads ≠ Play Books**: As duas fontes registram relações diferentes com os livros. O Play Books registra propriedade/compra (principalmente em português); o Goodreads registra leitura e avaliação (inclui traduções e outros formatos). Um livro aparece em ambos (Ensaio sobre a cegueira = Blindness), confirmando a intersecção.

- **O ângulo da dívida não creditada**: O post desta sessão optou por nomear explicitamente que The Anthropocene Reviewed é um modelo estrutural do blog que não foi citado. Isso é diferente das sessões anteriores, que geralmente deixavam as inferências implícitas. A escolha foi deliberada — a dívida não creditada é um fato verificável (não está nas referências dos ensaios) e mais honesta do que a alternativa de gesticionar em torno dela.

- **Saramago como ancestral metodológico**: A conexão Gospel → "Está Chovendo Verdade" é de método, não de conteúdo. Ambos inspecionam cosmologias herdadas sem a intenção primária de destruí-las. Nomear essa conexão sem afirmar que foi influência direta é o nível certo de precisão.

---

## Posts desta série (todos publicados)

| Data | EN | PT | Ângulo |
|------|-----|-----|--------|
| 2026-05-26 | Autumn Balance: March to May 2026 | Balanço de Outono: Março a Maio de 2026 | Inventário de conteúdo |
| 2026-05-31 | It's Raining Truth | Está Chovendo Verdade | O ensaio em si |
| 2026-06-01 | The Data Portrait | O Retrato de Dados | Arqueologia do Takeout |
| 2026-06-03 | May in Seven Drafts | Maio em Sete Rascunhos | Processo de escrita |
| 2026-06-04 | The Library the Blog Didn't Cite | A Biblioteca Que o Blog Não Citou | Estante Goodreads como herança |
