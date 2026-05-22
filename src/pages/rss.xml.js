import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { isPublished } from "../lib/publish";

export async function GET(context) {
  const posts = (await getCollection("blog"))
    .filter((post) => isPublished(post))
    .filter((post) => (post.data.lang ?? "en") === "en")
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: "Franklin Baldo",
    description:
      "Lawyer and State Attorney. Exploring the intersections of process metaphysics, AI agency, and the architecture of legal systems.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      categories: post.data.tags ?? [],
    })),
    customData: "<language>en-us</language>",
  });
}
