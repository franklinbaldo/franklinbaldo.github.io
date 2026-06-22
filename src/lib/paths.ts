import { getCollection, type CollectionEntry } from "astro:content";
import { DEFAULT_LANG } from "./i18n";
import { isPublished } from "./publish";

export type Lang = "en" | "pt";

export interface ReadingPath {
  slug: string;
  title: Record<Lang, string>;
  blurb: Record<Lang, string>;
  source:
    | { type: "series"; series: string }
    | { type: "manual"; posts: Record<Lang, string[]> };
}

export const READING_PATHS: ReadingPath[] = [
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

export function getReadingPath(slug: string): ReadingPath | undefined {
  return READING_PATHS.find((p) => p.slug === slug);
}

export async function getPathPosts(
  slug: string,
  lang: string
): Promise<CollectionEntry<"blog">[]> {
  const path = getReadingPath(slug);
  if (!path) return [];

  const all = (await getCollection("blog")).filter((p) => isPublished(p));

  if (path.source.type === "series") {
    const seriesName = path.source.series;
    return all
      .filter(
        (p) =>
          p.data.series === seriesName && (p.data.lang ?? DEFAULT_LANG) === lang
      )
      .sort((a, b) => {
        const ao = a.data.seriesOrder;
        const bo = b.data.seriesOrder;
        if (ao != null && bo != null) return ao - bo;
        if (ao != null) return -1;
        if (bo != null) return 1;
        return a.data.date.valueOf() - b.data.date.valueOf();
      });
  }

  const wanted = (path.source.posts as Record<string, string[]>)[lang] ?? [];
  const byId = new Map(all.map((p) => [p.id, p]));
  return wanted
    .map((id) => byId.get(id))
    .filter((p): p is CollectionEntry<"blog"> => !!p);
}
