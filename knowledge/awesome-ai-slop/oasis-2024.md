---
type: awesome-ai-slop
name: 'Oasis (2024)'
artifact_type: interactive generative world demo
creator_handle: 'Decart + Etched'
quality_tier: C
interest_tier: S
confidence: high
summary: 'Demonstração interativa lançada por Decart e Etched em 2024 na qual um modelo de vídeo generativo produz o mundo quadro a quadro em resposta a teclado e mouse, recriando uma experiência semelhante a Minecraft sem um game engine tradicional determinando cada frame.'
quality_signals:
  - 'A geração acontece durante a interação: movimento, salto, quebra e coleta de blocos alteram imediatamente os frames seguintes, fazendo da resposta do modelo parte da própria experiência em vez de apenas um vídeo pré-renderizado.'
  - 'A instabilidade visual tem uma qualidade onírica própria: objetos, terreno e geometria podem se recompor durante a navegação, criando um tipo de espaço mutável que seria difícil de confundir com um jogo convencional.'
  - 'A experiência é simples de entender e de testar: a referência a Minecraft oferece um vocabulário visual e mecânico familiar, deixando evidente o que muda quando o simulador passa a ser um modelo generativo.'
limitations:
  - 'A própria Decart descreve Oasis como uma demonstração tecnológica, não como um videogame ou produto de entretenimento completo; como jogo, há pouca estrutura além de explorar e provocar o modelo.'
  - 'A publicação oficial registra saídas enevoadas, memória curta para detalhes de frames anteriores e degradação quando a imagem inicial sai da distribuição de treino, limitações que prejudicam continuidade espacial e agência de longo prazo.'
  - 'A versão original operava em resolução e fidelidade modestas, e a relação visual e mecânica com Minecraft faz parte do apelo tanto quanto a identidade estética própria da obra.'
ai_mediation_evidence:
  - 'A publicação oficial da Decart afirma que Oasis é gerado end-to-end por um transformer quadro a quadro e que entradas de teclado e mouse condicionam cada instante da experiência.'
  - 'A Decart descreve a arquitetura como um modelo autoregressivo de difusão-transformer que gera vídeo condicionado às ações do usuário, em contraste com engines tradicionais e com modelos de vídeo renderizados apenas depois do prompt.'
  - 'O repositório público `etched-ai/open-oasis` libera pesos e código do modelo Oasis 500M e documenta geração autoregressiva de gameplay condicionada por input do teclado.'
source_label: 'Decart — Oasis: A Universe in a Transformer'
source_url: 'https://decart.ai/publications/oasis-interactive-ai-video-game-model'
source_urls:
  - 'https://oasis.decart.ai/'
  - 'https://github.com/etched-ai/open-oasis'
observed_at: 2026-09-23
updated: 2026-09-23
note: 'Quality C / interest S: como artefato jogável, Oasis é deliberadamente rudimentar e instável, então não sobe de C apenas por sua sofisticação técnica. Como objeto cultural e caso de estudo, porém, é excepcional: torna visível e manipulável em tempo real a ideia de um mundo cujo próximo estado não é calculado por uma engine tradicional, mas imaginado por um modelo de vídeo. As falhas de memória e continuidade são ao mesmo tempo limitações sérias e parte do estranhamento que torna a experiência memorável.'
---
