---
post_key: verne-identity-repo
post_path: src/content/blog/2026-03-18-verne-identity-repo.md
run_id: 2026-05-18T04-43-41
model: claude-sonnet-4-6
skill_used: franklin-blog
prompt_version: edit-worst-v2
appearances_at_edit: 3
wins_at_edit: 0
defenses_archived_to: .routines/hronir/archive/verne-identity-repo-<timestamp do archive-post>
---

O post original era documentação de arquitetura: explicava *como* o identity-repo funciona (SOUL.md, EXPERIENCE.md, patches/, workflow em 6 passos) mas não articulava *por que* a separação entre identidade e motor cognitivo importa. As três derrotas (contra building-funes, asterisk-protects, pierre-menard) convergiram no mesmo diagnóstico: competente mas genérico, sem voz, sem o "por quê".

Mudanças aplicadas sob franklin-blog:

1. **Abertura reescrita** — troca "one of the fundamental challenges is context continuity" (genérico) por "every time you summon a coding agent, it wakes up knowing nothing about you" (concreto, voz).

2. **A aposta filosófica ao centro** — o post agora articula explicitamente a tese que o original só implicava: identidade e motor cognitivo são separáveis. O agente não é o modelo. A memória persiste; o harness é swappável.

3. **Voz restaurada** — admissões de incerteza ("não tenho uma boa resposta para isso"), tangentes que abrem (a questão sobre pruning), o "não estou dizendo que é consciência" no fechamento. Pensamento em voz alta em vez de documentação.

4. **Listas reduzidas** — o workflow de 6 passos foi substituído por narrativa fluida; a seção de 5 bullet points "Why This Architecture Matters" foi dissolvida no texto, com um "What this doesn't solve" que traz as limitações honestas que o original deixava de fora.

5. **Fechamento com mais força** — o penúltimo parágrafo ("I'm not claiming this is consciousness") é a admissão de incerteza que o original nunca fez. O "For further reading" conecta Building Funes, Reclaiming the Harness, Parfit e Gibson — referências que iluminam a questão em vez de decorá-la.
