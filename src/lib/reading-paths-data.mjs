// Plain data, no astro:content import — consumed by src/lib/paths.ts (typed
// wrapper) and by astro.config.mjs (sitemap hreflang pairing), which can't
// load astro:content at config-eval time.
export const READING_PATHS = [
  {
    slug: "agency-and-constraint",
    title: {
      en: "Agency and Constraint",
      pt: "Agência e Restrição",
    },
    blurb: {
      en: "Why alignment is not the absence of capability but the architecture that shapes it. From the temple at Delphi to the harness in your pocket.",
      pt: "Por que alinhamento não é ausência de capacidade, mas a arquitetura que a molda. Do templo em Delfos ao canivete no bolso.",
    },
    source: { type: "series", series: "harness" },
  },
  {
    slug: "memory-and-funes",
    title: {
      en: "Memory and Funes",
      pt: "Memória e Funes",
    },
    blurb: {
      en: "On total recall, Pierre Menard, and what Borges saw before anyone else. From building Funes to preserving family voices: the cost of perfect memory and the architecture that makes it survivable.",
      pt: "Sobre lembrança total, Pierre Menard, e o que Borges viu antes de todos. De construir Funes a preservar vozes da família: o custo da memória perfeita e a arquitetura que a torna suportável.",
    },
    source: {
      type: "manual",
      posts: {
        en: [
          "building-funes",
          "funes-soul",
          "verne-identity-repo",
          "what-i-learned-orchestrating-ai-agents-to-preserve-family-memory",
          "pierre-menard-computational-researcher",
        ],
        pt: [
          "construindo-funes-como-dei-uma-alma-a-um-agente-de-ia",
          "soulmd-funes",
          "verne-e-o-padro-identity-repo-como-os-agentes-de-ia-se-lembram",
          "orquestrando-agentes-memoria-familiar",
          "pierre-menard-pesquisador-computacional",
        ],
      },
    },
  },
  {
    slug: "law-and-ai",
    title: {
      en: "Law and AI",
      pt: "Direito e IA",
    },
    blurb: {
      en: "A state attorney's journey into AI agents: delegation, memory, and what changes when the clerk never forgets — seen from someone who builds at night and argues in court by day.",
      pt: "A jornada de um procurador do estado pelo mundo dos agentes de IA: delegação, memória, e o que muda quando o escrivão nunca esquece — pelo olhar de quem constrói à noite e argumenta no tribunal de dia.",
    },
    source: {
      type: "manual",
      posts: {
        en: [
          "the-art-of-delegation",
          "census-not-sample",
          "conceptual-document-the-chronicle-of-franklin-baldo",
          "building-funes",
          "funes-soul",
        ],
        pt: [
          "delegando-para-agentes",
          "censo-nao-amostra",
          "documento-conceitual-a-cronica-de-franklin-baldo",
          "construindo-funes-como-dei-uma-alma-a-um-agente-de-ia",
          "soulmd-funes",
        ],
      },
    },
  },
];
