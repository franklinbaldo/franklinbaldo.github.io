---
date: 2026-06-11T05:30:00
slug: rss-atom-self-link
branch: claude/sleepy-pasteur-ms7m8i
status: pr-open
issues: [244]
pr_opened: null
pr_merged: null
---

## Contexto ao chegar

Nenhum PR `routine` pendente de run anterior — nada a mergear. Backlog com exatamente 10 issues abertas (fronteira inferior da faixa 10–20), sem necessidade de reabastecer. Todos os PRs abertos eram `hronir` (jules) ou `rfc` — ignorados conforme protocolo.

## O que foi feito

Implementação da issue #244 (`priority:media`): adicionar `atom:link rel="self"` nos feeds RSS.

### Mudanças entregues

**`src/pages/rss.xml.js`** e **`src/pages/pt/rss.xml.js`**:
- Adicionado `xmlns: { atom: "http://www.w3.org/2005/Atom" }` na chamada `rss()` — isso injeta `xmlns:atom="..."` no elemento raiz `<rss>`.
- Atualizado `customData` para incluir `<atom:link href="..." rel="self" type="application/rss+xml" />` com a URL canônica de cada feed, construída a partir do `context.site` injetado pelo Astro.

### Resultado em produção

O XML gerado em build ficou:
```xml
<rss version="2.0" xmlns:content="..." xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    ...
    <atom:link href="https://franklinbaldo.github.io/rss.xml" rel="self" type="application/rss+xml"/>
```

Ambos os feeds (EN `/rss.xml` e PT `/pt/rss.xml`) validados visualmente na saída `dist/`. Build verde, prettier verde.

## O que fica para a próxima run

Próximas issues `priority:media` em aberto: #245 (barra de progresso de leitura), #246 (print CSS), #247 (tags visual cloud), #248 (atualizar reading path Memory and Funes).
