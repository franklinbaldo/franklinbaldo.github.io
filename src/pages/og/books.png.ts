import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "books", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Books",
    description:
      "Books I've read and enjoyed — curated from my Goodreads shelf.",
    tags: ["reading", "books"],
    lang: "en",
    kind: "home",
    path: "/books/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
