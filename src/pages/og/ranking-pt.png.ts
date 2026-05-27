import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "ranking-pt", fallbackSlug: "home-pt" });
  const png = await renderOgCard({
    title: "Ranking",
    description:
      "Posts ranqueados por comparações par-a-par sob o sistema Hrönir.",
    tags: ["hronir", "ranking"],
    lang: "pt",
    kind: "home",
    path: "/pt/ranking/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
