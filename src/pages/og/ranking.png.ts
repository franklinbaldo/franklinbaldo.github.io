import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "ranking", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Ranking",
    description:
      "Essays ranked by pairwise comparison under the Hrönir system.",
    tags: ["hronir", "ranking"],
    lang: "en",
    kind: "home",
    path: "/ranking/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
