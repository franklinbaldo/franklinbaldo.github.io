---
type: Experiment
title: VASCO × Gaia — contabilidade E0 de Hamburg 7538
status: draft
---

# Escopo e limites

Reproduzir a classificação dos identificadores Gaia já presentes em APPLAUSE DR4,
placa Hamburg 7538, digitalização 9720. Não é um novo cross-match Gaia nem teste de
transiente. Um identificador vazio exige investigação; não confirma desaparecimento.
A fonte oficial é https://www.plate-archive.org/metadata/applause_dr4/source_calib/
(DOI https://doi.org/10.17876/plate/dr.4/13, CC0). A documentação registra correção de
campos dependentes de matches nulos em 18/09/2026; congelar os bytes é obrigatório.

Protocolo científico canônico:
https://github.com/franklinbaldo/papers/blob/main/experiments/vasco_transients/PROTOCOL.md
A frente vasco-historical-transients-falsification continua exigindo controles de
artefatos, oportunidades incluindo zeros, exposição e independência entre placas.
Este piloto não satisfaz nem substitui esses gates.

# Execução reprodutível

Python >=3.12, biblioteca padrão, nenhuma dependência externa. Executar os testes:

    python -m unittest discover -s experiments/vasco-gaia/tests -v

Fornecer CSV congelado com source_id, plate_id, scan_id, gaiaedr3_id e
sextractor_flags. O SHA256 deve ser obtido da fonte/proveniência revisada, não aceito
automaticamente de um download não verificado. Usar o SHA exato do commit executado:

    python experiments/vasco-gaia/run.py --input input.csv --input-sha256 SHA256 --code-sha COMMIT --output results/IDENTIDADE
    python tools/experiment_harvest.py --results results/IDENTIDADE --input-sha256 SHA256 --code-sha COMMIT

O runner recusa saída existente, CSV vazio ou irregular, IDs duplicados, outras
placas/digitalizações, mais de 2.500 linhas e hash divergente. Preserva bytes brutos,
classificações por ID, RESULT.md e SHA256SUMS. Identidade inclui commit, hash do
runner, hash da entrada, placa/digitalização e versão do protocolo. Isso evita
sobrescrever resultados locais; a fila global ainda precisa de deduplicação persistente.

# Evidência recuperada em 18/10/2026

O pacote blog-experiments-proposal.zip recuperado da Library tem SHA256
f14ff6c6ebc88ee8642b87a5a81dd29b071c6ab7963b1ebc67363d54273b27a8.
O pacote VASCO-GAIA-REAL-TRIAGE-2026-10-18.zip tem SHA256
8b024ef7fcb624ab6a2ead073de9bcfafb50716a14d5c9d593d95a42ccaea408.
Seu CSV arquivado de 36 fontes tem SHA256
214798342dfd2be13cc10335f713fc8d80cb3150e914230ad12fb94c2797283d.
A proveniência anterior descreve seleção estratificada deliberada de 12 por classe.
O replay local reproduziu 12/12/12; não é coleta nova nem amostra representativa.
Os totais anteriores 1.803/230/467 em 2.500 permanecem autorrelatados e não reproduzidos.

A tentativa de coleta TAP síncrona em 18/10/2026 com ADQL TOP 36, filtro
plate_id=7538 AND scan_id=9720, ORDER BY source_id, retornou HTTP400 com
"canceling statement due to statement timeout". Nenhum dado dessa tentativa foi
aceito. O endpoint recusou LANG postgresql-9.6, apesar do exemplo documental antigo.
Não repetir consultas custosas sem ajustar o plano de consulta e limites.

# Gates e próximo experimento

Sucesso E0: entrada oficial congelada, IDs únicos, contagens reconciliadas e hashes
verificados em runner versionado. Falha: hash/schema/contagem divergente; preservar
diagnóstico e parar expansão. Não corrigir dados silenciosamente.

Próximo teste discriminante: obter uma amostra pequena oficial com consulta limitada
compatível com o serviço, congelar dados/metadados, reproduzir no GitHub Actions e
comparar objetos sem identificador com Gaia propagado à época e incertezas astrométricas.
Só expandir para a digitalização completa após revisão de controles, quota e orçamento.
Depois comparar duas digitalizações, distinguindo scans da mesma exposição, e Vaticano
96302. FITS/PSF, injeção/recuperação, movimento próprio e exposição independente:
NOT_RUN. Nenhuma inferência de origem artificial está autorizada por este E0.

# Pendências operacionais explícitas

O workflow limitado a push em main nos caminhos do experimento ou disparo manual
executa testes e replay das 36 observações arquivadas, em ubuntu-24.04, timeout de
5 minutos e contents:read. Não usa secrets ou armazenamento de artifacts; emite
manifesto, hashes e classificações no log. Minutos de runner padrão em repositório
público são gratuitos segundo https://docs.github.com/en/billing/concepts/product-billing/github-actions.
A quota de armazenamento não foi verificada, por isso upload-artifact não é usado.
Execução real, fila global, coleta oficial congelada e persistência cross-repo
ainda não comprovadas por este código. Não usar secrets de
papers para executar código de PR. Publicação dos resultados por PR em papers pode
ser feita por MCP; credencial persistente para automação exige aprovação específica.

O harvester reconstrói os artefatos com código confiável e âncoras externas de
entrada/commit, comparando também o manifesto integral. Requer o mesmo ambiente
Python do produtor; divergência de versão é falha explícita, não normalizada.
