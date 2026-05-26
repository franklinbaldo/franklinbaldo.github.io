---
date: 2026-05-26
slug: retrospectiva-marco-maio
session: takeout-analysis
status: done
---

# Sessão 2026-05-26 — Análise do Google Takeout + retrospectiva março-maio 2026

## Objetivo

Usar os arquivos do Google Takeout no Google Drive para escrever um post
contextualizado sobre os últimos dois meses.

## Arquivos encontrados no Google Drive

Pasta: `Takeout` (criada em 2026-05-24)

| Arquivo                            | Tamanho | ID Drive                            |
| ---------------------------------- | ------- | ----------------------------------- |
| takeout-20260524T140450Z-001.zip   | 187 KB  | `1XKQxavIMvf7s91KpSwefe50DrAdQyhsv` |
| takeout-20260524T151400Z-001.zip   | 236 KB  | `16e9KElZQXrOev0JyE3-unTDtW7f9ff9u` |
| takeout-20260524T140451Z-6-001.zip | ~181 MB | `1RGE9oWM0MAEGvq1JrWTMtjnSjFGlgsrl` |
| takeout-20260524T151400Z-6-001.zip | ~186 MB | `1p7q2BJ5abtNNJ3rq0ob1QIha5t9KSF2a` |
| takeout-20260524T151400Z-4-001.zip | ~1.9 GB | `1AcitlBmVUxIxLFPMR92t5qsYsD5fPjzq` |
| takeout-20260524T140451Z-4-001.zip | ~1.8 GB | `1ukVYv_eLG5BhlheJFWKfUuF2zUViXfsR` |
| takeout-20260524T151400Z-4-002.zip | ~796 MB | `1MopQKpjXiAyeEFLghQVmAfztuC8YHZR9` |
| takeout-20260524T140451Z-4-002.zip | ~927 MB | `1Oo7h4OGr6CIc0mWYlWbaJMHqeO5KR2EP` |

**Total do export**: 4.83 GB (7 produtos do Google)

## O que foi analisado

Os dois arquivos pequenos (`001.zip`) foram baixados e extraídos. Ambos continham
apenas `Takeout/archive_browser.html` — o índice completo do export com listagem
de todos os arquivos, mas sem os dados em si. Os dados reais estão nos arquivos
maiores.

## Limitação crítica

Os dados de atividade de **dezembro 2025 – março 2026** têm uma lacuna no Google
Fit (provavelmente mudança de dispositivo). Métricas diárias de **abril-maio
2026** existem mas estão nos arquivos maiores (~GB) que não foram baixados nesta
sessão.

O post foi escrito com os dados disponíveis: padrões de 2025 como referência,
cruzados com os posts publicados no blog em março-maio 2026.

## Produtos mapeados pelo archive_browser.html

| Produto                 | Arquivos                 | Tamanho |
| ----------------------- | ------------------------ | ------- |
| Google Fit              | 19.393                   | 2,03 GB |
| Google Play Livros      | 63                       | 56,9 MB |
| YouTube e YouTube Music | 101                      | 2,74 GB |
| Google Maps Timeline    | 1 (apenas Settings.json) | < 1 MB  |
| Google Play Filmes e TV | 5                        | < 1 MB  |
| Fitbit                  | 0                        | —       |
| Google Podcasts         | 0                        | —       |

## Principais achados

### Google Fit (dados até set/2025, depois lacuna até abr/2026)

- Ciclismo: 12 sessões (mar/2025) → 18 (abr) → 24 (mai) — maior frequência
  sustentada em 11 anos de dados
- Academia/strength training: iniciada em fev/2025, encerrada em mar/2025,
  substituída pelo ciclismo
- Padrão de pedaladas: sessões vespertinas (16h-19h), mais longas conforme o mês
  avança
- Máxima registrada: 87 minutos (mai/2025)
- Cluster de atividade: 28/fev–2/mar corresponde ao Carnaval 2025

### Google Play Livros (63 arquivos)

- 13 obras de Saramago (cobertura quase completa da obra)
- 4 obras de Borges (Collected Fictions, O Aleph, La biblioteca de Babel, Fiction
  Complete)
- The Anxious Generation (Haidt) em PT e EN
- The Precipice (Toby Ord), Gödel Escher Bach, The Three-Body Problem
- Positive Discipline (parenting)
- Livros infantis: Alice, Rapunzel, Bela Adormecida, etc.

### YouTube (4 perfis supervisionados)

Filhos com perfis ativos: Alice, Gustavo, Sofia, Vicente — cada um com histórico
de busca e assinaturas separadas.

### Google Maps Timeline

Apenas `Settings.json` exportado. Histórico de localização armazenado on-device
(E2E encrypted) — não disponível no Takeout.

## Fontes cruzadas com o repositório

Foram encontrados 25+ posts publicados entre março e maio de 2026:

- **Março**: Travessia (2026-03-02), Travessia Update + Rosencrantz Coin (17/03),
  Verne Identity Repo (18/03), Lobsters + Intelligible Void (21/03), Reddit OSINT
  + O Pai do Futuro (22/03), Delegando para Agentes (28/03), Alfarrábios do Adi
  (30/03)
- **Abril**: Hermes vs OpenClaw (04/04), Reclaiming the Harness (29/04)
- **Maio**: The Third Half (01/05), Three Imperatives at Delphi (04/05), Jules
  API + Ovo de Serpente (10/05), Pierre Menard + Agent that Doesn't Invent Verbs
  (14/05), Three Hammers + Who the Asterisk Protects (15/05), Two Questions Out
  Loud (17/05), Suno Borges Caipira (20/05), Manifold 495 dias (21/05), GitHub
  Tour (22/05), Searching FranklinBaldo (23/05), Video Queue AI Civictech (24/05)

## Arquivo criado

`src/content/blog/retrospectiva-marco-maio-2026.md` — post em PT, tag `diário`,
`retrospectiva`, sem heroImage.

## Branch / PR

Branch: `claude/relaxed-ritchie-NdgTK`
