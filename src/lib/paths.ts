import { getCollection, type CollectionEntry } from "astro:content";
import { DEFAULT_LANG } from "./i18n";
import { isPublished } from "./publish";
import { READING_PATHS as READING_PATHS_DATA } from "./reading-paths-data.mjs";

export type Lang = "en" | "pt";

export interface ReadingPath {
  slug: string;
  title: Record<Lang, string>;
  blurb: Record<Lang, string>;
  source:
    | { type: "series"; series: string }
    | { type: "manual"; posts: Record<Lang, string[]> };
}

export const READING_PATHS: ReadingPath[] = READING_PATHS_DATA as ReadingPath[];

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
