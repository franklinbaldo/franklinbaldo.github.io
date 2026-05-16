import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgCard } from "../../lib/og-card";

const SKIP = process.env.SKIP_OG === "1";

export async function getStaticPaths() {
  const posts = SKIP ? [] : await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags ?? [],
      lang: post.data.lang ?? "en",
      path: `/blog/${post.id}/`,
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgCard({
    title: props.title as string,
    description: props.description as string | undefined,
    tags: props.tags as string[],
    lang: props.lang as "en" | "pt",
    kind: "post",
    path: props.path as string,
  });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
