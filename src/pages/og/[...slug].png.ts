import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

const SKIP = process.env.SKIP_OG === "1";
const SITE = "https://franklinbaldo.github.io";

export async function getStaticPaths() {
  const posts = SKIP ? [] : await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      slug: post.id,
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags ?? [],
      lang: post.data.lang ?? "en",
      path: `/blog/${post.id}/`,
      emoji: post.data.emoji,
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const slug = props.slug as string;
  const path = props.path as string;
  const qrPng = await getQrPng({
    slug,
    url: SITE + path,
    emoji: props.emoji as string | undefined,
  });
  const png = await renderOgCard({
    title: props.title as string,
    description: props.description as string | undefined,
    tags: props.tags as string[],
    lang: props.lang as "en" | "pt",
    kind: "post",
    path,
    qrPng,
  });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
