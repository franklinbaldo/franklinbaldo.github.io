import { getCollection, type CollectionEntry } from "astro:content";

export interface SeriesContext {
  slug: string;
  posts: CollectionEntry<"blog">[];
  index: number;
  prev?: CollectionEntry<"blog">;
  next?: CollectionEntry<"blog">;
}

export async function getSeriesContext(
  post: CollectionEntry<"blog">,
): Promise<SeriesContext | null> {
  const series = post.data.series;
  if (!series) return null;

  const all = (await getCollection("blog"))
    .filter((p) => !p.data.draft && p.data.series === series)
    .sort((a, b) => {
      const ao = a.data.seriesOrder, bo = b.data.seriesOrder;
      if (ao != null && bo != null) return ao - bo;
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
