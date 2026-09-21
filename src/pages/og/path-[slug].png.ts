import type { APIRoute } from "astro";
import { READING_PATHS } from "../../lib/paths";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export async function getStaticPaths() {
  return READING_PATHS.map((path) => ({
    params: { slug: path.slug },
    props: { path },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const path = props.path as (typeof READING_PATHS)[number];
  const qrSlug = `path-${path.slug}`;
  const qrPng = getQrPng({ slug: qrSlug, fallbackSlug: "home" });
  const png = await renderOgCard({
    title: path.title.en,
    description: path.blurb.en,
    lang: "en",
    kind: "post",
    path: `/paths/${path.slug}/`,
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
