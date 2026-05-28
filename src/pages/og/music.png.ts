import type { APIRoute } from "astro";
import { renderOgCard } from "../../lib/og-card";
import { getQrPng } from "../../lib/og-qr";

export const GET: APIRoute = async () => {
  const qrPng = getQrPng({ slug: "music", fallbackSlug: "home" });
  const png = await renderOgCard({
    title: "Music",
    description: "Songs and playlists published on Suno by Franklin Baldo.",
    tags: ["music", "suno"],
    lang: "en",
    kind: "home",
    path: "/music/",
    qrPng: qrPng ?? undefined,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
