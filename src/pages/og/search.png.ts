import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "search", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Search",
    description: "Full-text search across all essays.",
    tags: ["search"],
    lang: "en",
    kind: "home",
    path: "/search/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
