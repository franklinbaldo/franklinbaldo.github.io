---
type: Audiobook Rights Record
work_id: hpmor
status: editorial-use-allowed-publication-unverified
source_site: https://hpmor.com/
checked_at: 2026-08-30
editorial_work_allowed: true
public_distribution_authorized: false
authorization_basis: null
---

# Direitos e proveniência — HPMOR

## Estado atual

A produção editorial interna pode avançar, mas publicação pública de uma nova tradução e de novo áudio permanece bloqueada até que a base de autorização aplicável esteja registrada de forma explícita.

## Evidência observada

O site oficial/authorized mirror de HPMOR mantém o texto integral e lista historicamente múltiplas traduções de fãs e um podcast da obra. Isso demonstra uma prática pública de traduções e narração, mas não é tratado por esta pipeline como uma licença geral suficiente por si só.

Fontes de referência:

- https://hpmor.com/
- https://hpmor.com/info/
- https://hpmor.com/terms/

## Regra operacional

- `editorial_work_allowed: true` permite importar pequenas unidades de trabalho, traduzir e preparar narração no repositório para revisão;
- `public_distribution_authorized: false` impede habilitar podcast, upload para Internet Archive ou qualquer publicação pública do áudio desta obra;
- a autorização futura deve registrar origem, escopo, data e eventuais condições;
- nenhuma inferência de autorização é feita apenas pela existência de outros podcasts ou traduções.

## Proveniência

Cada unidade original deve registrar a URL específica do capítulo e um digest do texto efetivamente usado. A tradução e a narração apontam para essa unidade e preservam `work_id`, `chapter_id` e `segment_id`.
