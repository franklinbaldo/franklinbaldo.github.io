import { getCollection, type CollectionEntry } from "astro:content";
import { DEFAULT_LANG } from "./i18n";

export interface SeriesContext {
  slug: string;
  posts: CollectionEntry<"blog">[];
  index: number;
  prev?: CollectionEntry<"blog">;
  next?: CollectionEntry<"blog">;
}

export async function getSeriesContext(
  post: CollectionEntry<"blog">,
  options: { lang?: string } = {}
): Promise<SeriesContext | null> {
  const series = post.data.series;
  if (!series) return null;

  const lang = options.lang ?? post.data.lang ?? DEFAULT_LANG;

  const all = (await getCollection("blog"))
    .filter(
      (p) =>
        !p.data.draft &&
        p.data.series === series &&
        (p.data.lang ?? DEFAULT_LANG) === lang
    )
    .sort((a, b) => {
      // Explicit seriesOrder always wins. Posts with order come before
      // posts without; ties (or both missing) break by publication date.
      const ao = a.data.seriesOrder;
      const bo = b.data.seriesOrder;
      if (ao != null && bo != null) return ao - bo;
      if (ao != null) return -1;
      if (bo != null) return 1;
      return a.data.date.valueOf() - b.data.date.valueOf();
    });

  const index = all.findIndex((p) => p.id === post.id);
  if (index === -1) return null;

  return {
    slug: series,
    posts: all,
    index,
    prev: index > 0 ? all[index - 1] : undefined,
    next: index < all.length - 1 ? all[index + 1] : undefined,
  };
}
