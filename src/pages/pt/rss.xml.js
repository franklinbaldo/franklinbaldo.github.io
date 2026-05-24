import rss from "@astrojs/rss";
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
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        content: body,
        link: `/blog/${post.id}/`,
        categories: post.data.tags ?? [],
      };
    })
  );

  return rss({
    title: "Franklin Baldo (Português)",
    description:
      "Advogado e Procurador do Estado. Explorando as interseções entre metafísica do processo, agentes de IA e a arquitetura dos sistemas jurídicos.",
    site: context.site,
    items,
    customData: "<language>pt-br</language>",
  });
}
