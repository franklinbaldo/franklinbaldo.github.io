import { getCollection, type CollectionEntry } from "astro:content";
import { DEFAULT_LANG } from "./i18n";

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
      en: "On total recall, Pierre Menard, and what Borges saw before anyone else about the cost of perfect memory.",
      pt: "Sobre lembrança total, Pierre Menard, e o que Borges enxergou antes de todos sobre o custo da memória perfeita.",
    },
    source: {
      type: "manual",
      posts: {
        en: [
          "building-funes",
          "funes-soul",
          "2026-05-14-pierre-menard-computational-researcher",
        ],
        pt: [
          "pierre-menard-pesquisador-computacional",
          "orquestrando-agentes-memoria-familiar",
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

  const all = (await getCollection("blog")).filter((p) => !p.data.draft);

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
