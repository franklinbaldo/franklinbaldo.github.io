import type { CollectionEntry } from "astro:content";

export function isPublished(
  post: CollectionEntry<"blog">,
  now: Date = new Date()
): boolean {
  if (post.data.draft) return false;
  if (post.data.publishDate && post.data.publishDate > now) return false;
  return true;
}
