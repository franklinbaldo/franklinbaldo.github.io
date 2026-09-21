---
type: changelog
date: 2026-09-19
description: "Evita links vazios e qualifica links de Webmentions como conteúdo de usuário."
tags: [accessibility, seo, ux]
---

Webmentions sem URL agora são exibidas como texto em vez de links `#`, enquanto links reais recebem `rel="ugc nofollow"` para sinalizar sua origem externa e gerada por terceiros.
