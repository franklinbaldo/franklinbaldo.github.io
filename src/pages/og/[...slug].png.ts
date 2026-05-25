import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

const SKIP = process.env.SKIP_OG === "1";

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
      path:
        post.data.lang === "pt" ? `/pt/blog/${post.id}/` : `/blog/${post.id}/`,
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const slug = props.slug as string;
  const lang = props.lang as "en" | "pt";
  const qrPng = getQrPng({
    slug,
    fallbackSlug: lang === "pt" ? "home-pt" : "home",
  });
  const png = await renderOgCard({
    title: props.title as string,
    description: props.description as string | undefined,
    tags: props.tags as string[],
    lang,
    kind: "post",
    path: props.path as string,
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
