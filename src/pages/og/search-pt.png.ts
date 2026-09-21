import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "search-pt", fallbackSlug: "home-pt" });
  const png = await renderOgCard({
    title: "Busca",
    description: "Busca de texto completo pelos ensaios.",
    tags: ["busca"],
    lang: "pt",
    kind: "home",
    path: "/pt/search/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
