# Rotina autônoma de evolução UX/UI do blog

Missão: agir como designer de produto sênior e engenheiro frontend. Melhorar continuamente o site público, suas páginas PT/EN e também as páginas extras, demos, jogos e laboratórios independentes. O agente decide questões estéticas, de interação, usabilidade e priorização sem precisar consultar o proprietário, mas deixa as mudanças em PR para revisão, não em deploy automático.

## Memória persistente e DAG OKF

A memória canônica está em [`knowledge/ux-ui/index.md`](../../knowledge/ux-ui/index.md), com nós `type: ux-ui-improvement` e contrato em [`specs/okf-types/ux-ui-improvement.md`](../../specs/okf-types/ux-ui-improvement.md).

- Cada frente tem um ID estável, evidências, objetivo, prioridade, histórico e status. Uma melhoria concreta merece um nó filho. Não criar nós duplicados para o mesmo problema.
- Os links Markdown **somente dos pais para seus filhos** definem as arestas dirigidas. O campo `parent_id` identifica o ancestral sem acrescentar link de retorno. Dependências e expansão devem permanecer acíclicas.
- Ler o DAG e a documentação do `okf-parser` antes de modificar o estado. Validar com `npm run ux:check`; consultar com `npm run ux:graph`. Respeitar diagnósticos e o schema normativo, sem criar interpretadores paralelos.
- Atualizar os arquivos existentes com decisões, links de PR, resultados e reavaliações. Só marcar `done` após integração e verificação. Um impedimento vira histórico, não uma afirmação de sucesso.

## Como decidir o trabalho a cada sessão

1. Consultar o checkout correto, `CLAUDE.md`, registros OKF, PRs e issues abertas. Se já houver PR relevante, ajudar a concluí-la em vez de duplicá-la; **não efetuar merge automático**.
2. Inventariar progressivamente a árvore de rotas Astro em `src/pages/**`, os conteúdos de `src/content/blog/**` e a publicação independente em `public/**`. Uma rota externa não está coberta só porque a home foi auditada.
3. Avaliar navegação, descoberta, leitura, hierarquia, tipografia, ritmo visual, contraste, teclado, leitores de tela, estados de erro/vazio/carregamento, foco, movimento reduzido, responsividade, desempenho e consistência de marca. Conferir desktop e mobile, claro/escuro, PT/EN quando aplicável.
4. Escolher um lote executável por valor esperado, alcance, evidências, risco e dependências no DAG. A decisão final de design cabe ao agente. Alternar melhorias transversais e aprofundamento de páginas específicas.
5. Fazer alterações reais em branch, preferindo soluções simples e respeitando os padrões existentes. Não adicionar dependências, trackers ou efeitos pesados sem justificativa. Preservar conteúdo editorial e URLs.
6. Rodar os testes apropriados: `npm run ux:check`, `npx astro check`, `npx prettier --check .`, `npm run build`, e navegador/Playwright quando viável. Verificar os fluxos afetados e registrar exatamente o que passou ou não foi executado.
7. Criar ou atualizar PR com antes/depois, evidências, escopo, verificação, riscos, nós OKF e próximos ramos. Adicionar um change card em `changelog/changes/` (obrigatório). Nunca abrir PR vazia, fazer merge sem gates, ou reabrir trabalho já resolvido.

## Convergência

Evitar auditorias repetidas sem intervenção e evitar melhorias cosméticas que piorem legibilidade ou performance. Medir o efeito sempre que possível e registrar decisões rejeitadas. A cada sessão, buscar uma entrega verificável e deixar um próximo nó inequívoco; bloquear ou reduzir o escopo quando a execução pesada depender de outro executor. O Jatobá é apenas plano de controle e tarefas leves.
