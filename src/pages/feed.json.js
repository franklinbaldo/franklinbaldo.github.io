import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as getMdxRenderer } from "@astrojs/mdx";
import { isPublished } from "../lib/publish";

export async function GET(context) {
  const posts = (await getCollection("blog"))
    .filter((post) => isPublished(post))
    .filter((post) => (post.data.lang ?? "en") === "en")
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const renderers = await loadRenderers([getMdxRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const body = await container.renderToString(Content);
      const url = new URL(`/blog/${post.data.slug ?? post.id}/`, context.site)
        .href;
      return {
        id: url,
        url,
        title: post.data.title,
        content_html: body,
        summary: post.data.description,
        date_published: post.data.date.toISOString(),
        tags: post.data.tags ?? [],
      };
    })
  );

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Franklin Baldo",
    description:
      "Essays, code, and music at the border of AI, philosophy, and literature.",
    home_page_url: context.site.href,
    feed_url: new URL("feed.json", context.site).href,
    language: "en-us",
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
