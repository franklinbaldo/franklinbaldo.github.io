---
run_id: 2026-05-18T06-09-08
run_at: '2026-05-18T06:09:08Z'
match_index: 5
post_a:
  key: pontifex-guide
  path: src/content/blog/pontifex-architecture-implementation-guide.md
post_b:
  key: pontifex-research
  path: src/content/blog/pontifex-novel-architecture-semantic-probing.md
winner: b
model: claude-sonnet-4-6
prompt_version: passion-v1
season: 1
override: null
---

**pontifex-research** vence com clareza.

O post "pontifex-guide" começa com uma confissão desamparadora: nenhuma arquitetura Pontifex existe na literatura. É um guia de implementação para algo que não tem documentação porque não existe. O que se segue é competente — Captum, XLM-RoBERTa, MultiSpaceConvergenceLayer com código Python — mas o leitor nunca esquece que está construindo uma casa sem endereço. O guia serve ao post de pesquisa; ele é derivativo por construção.

"pontifex-research" é o post de pesquisa. Introdução, Related Work, Method, Experiments, Results, Discussion, Conclusion — estrutura de paper, e a estrutura é merecida porque o conteúdo a justifica. As duas inovações centrais têm precisão técnica real: a oclusão em nível de byte com comparação bilateral (fragmento esquerdo e fragmento direito comparados entre si e com o original) gera três sinais por oclusão ao invés de um, o que explica o ganho de eficiência de amostragem. As camadas de convergência neural que operam sobre scores de similaridade em vez de coordenadas de embedding evitam o problema fundamental de alinhamento de espaços: você não precisa transformar um espaço no outro se consegue identificar consenso sobre pares de similaridade.

O experimento do XNLI — F1 de sobreposição de palavras importantes em inglês e francês chegando a 0.81 com Pontifex versus 0.54 com oclusão independente — é o tipo de número que você consegue criticar ou defender, o que é a marca de uma afirmação real. O caso qualitativo do vestido vermelho na legenda, onde o modelo de texto insistia em "red" e o modelo de visão hesitava por causa da iluminação, captura exatamente o valor da análise multi-espaço: não é que o Pontifex resolva a ambiguidade, é que ele a *detecta* como desacordo entre perspectivas.

"pontifex-guide" sabe como construir. "pontifex-research" sabe *o que* construir e por quê. Num torneio de ideias, a pergunta vence o manual.
