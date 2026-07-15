// RFC 0017: o duelo `version` foi eliminado — não há mais permalink
// /blog/<slug>/v/<uuid>/, identidade de versão a resolver, nem link "ver
// fonte no GitHub" por versão (battles/[id].astro comparava obras
// diferentes via fileForId; sem o ramo de duelo `version`, esse helper
// ficou sem consumidor). O que sobrevive são as constantes do repo, usadas
// por Comments.astro (Giscus).
export const GITHUB_REPO = "franklinbaldo/franklinbaldo.github.io";
export const GITHUB_BRANCH = "main";
