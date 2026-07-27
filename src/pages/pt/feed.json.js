import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as getMdxRenderer } from "@astrojs/mdx";
import { isPublished } from "../../lib/publish";

export async function GET(context) {
  const posts = (await getCollection("blog"))
    .filter((post) => isPublished(post))
    .filter((post) => (post.data.lang ?? "en") === "pt")
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const renderers = await loadRenderers([getMdxRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const body = await container.renderToString(Content);
      const url = new URL(
        `/pt/blog/${post.data.slug ?? post.id}/`,
        context.site
      ).href;
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
    title: "Franklin Baldo (Português)",
    description:
      "Advogado e Procurador do Estado. Explorando as interseções entre metafísica do processo, agentes de IA e a arquitetura dos sistemas jurídicos.",
    home_page_url: new URL("pt/", context.site).href,
    feed_url: new URL("pt/feed.json", context.site).href,
    language: "pt-br",
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
