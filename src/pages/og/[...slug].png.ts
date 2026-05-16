import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgCard } from "../../lib/og-card";

const SKIP = process.env.SKIP_OG === "1";

export async function getStaticPaths() {
  if (SKIP) return [];
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const post = (props as { post: Awaited<ReturnType<typeof getCollection>>[number] }).post;
  const png = await renderOgCard({
    title: post.data.title,
    description: post.data.description,
  });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
