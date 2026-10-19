# MaleCNS — política de publicação por rodada

Esta página descreve o processo editorial da curadoria MaleCNS. Os cartões Markdown OKF em `knowledge/malecns-projects/` são a única fonte semântica das classificações; a interface do blog é uma projeção derivada.

## Persistência obrigatória

Cada rodada deve verificar primeiro `main`, branches e PRs abertas, preservar resultados e controles negativos, e criar uma branch e uma PR próprias com os arquivos alterados e o changelog da rodada. Os arquivos locais são apenas artefatos de execução: não substituem commits e PRs remotos.

Ao iniciar uma rodada, revisar as PRs existentes e tentar integrar aquelas que estiverem seguras, sem conflitos e com os checks obrigatórios aprovados. Corrigir falhas, reconciliar alterações sobrepostas por `project_id` e manter as classificações existentes salvo evidência material nova. Não encerrar uma PR com trabalho único ainda não preservado.

## Qualidade e publicação

Antes do merge, executar em executor **não-Jatobá** o `okf-parser` normativo na versão fixada, testes, build do blog e inspeção PT/EN. O Jatobá não deve executar builds, parser, testes, benchmarks ou scripts de análise; seu uso limita-se a health/control-plane leve. Nunca publicar informação privada de `franklinbaldo/papers` sem autorização explícita.

Manter `scientific_tier`, `interest_tier` e `confidence` independentes, fundamentados em evidências. Sorteios, quando necessários, selecionam apenas o subconjunto de projetos elegíveis em Bash real, nunca o tier.

## Bloqueios

Se uma regra de proteção ou permissão impedir commit, PR ou merge, respeitar o bloqueio e reportar explicitamente a operação tentada, o erro e a URL/branch envolvida. Não afirmar que uma rodada foi publicada quando só existe um patch local. Não contornar verificações de segurança. Reportar cada gate como `pass`, `fail` ou `not_run`, incluindo a causa das pendências.

## Critério de conclusão

A rodada fica registrada quando seus arquivos estão em commit e PR remotos. A publicação fica concluída quando os checks normativos passam, a PR é mergeada e a página pública é verificada. Se um desses passos falhar, reportar a rodada como bloqueada, com o trabalho seguro efetivamente salvo e o próximo bloqueio concreto.
